export type ControlledExecutionMode = "sequential" | "isolated-parallel";

export interface AreaLeaseRequest {
  ownerId: string;
  areaIds: readonly string[];
  reason: string;
  /**
   * "all" (default) needs every listed area at once -- the historical shape.
   * "any" needs exactly ONE, taken in the caller's preference order. Farm steps
   * use "any" over a biome's interchangeable-by-authorship node candidates so a
   * bot takes a free node instead of queueing; dungeons resolve to a single
   * candidate and therefore still queue.
   */
  mode?: "all" | "any";
  /**
   * "any" mode only: the subset worth holding out for -- normally the nodes
   * nearest the bot. While the request is younger than `widenAfterMs` it is
   * granted ONLY from here; after that the full `areaIds` list is considered.
   *
   * Without this, a contended near cluster silently pushed bots to whatever was
   * free, which at 8-bot scale meant crossings through several biomes. Waiting
   * briefly is usually cheaper than the walk, so nearness is a real preference
   * rather than just an ordering.
   */
  preferredAreaIds?: readonly string[];
  widenAfterMs?: number;
}

export interface AreaLeaseGrant {
  ownerId: string;
  areaIds: string[];
  newlyAcquiredAreaIds: string[];
  waitDurationMs: number;
  conflictingOwnerIds: string[];
}

interface PendingRequest extends AreaLeaseRequest {
  mode: "all" | "any";
  sequence: number;
  requestedAt: number;
  conflictingOwnerIds: Set<string>;
  resolve: (grant: AreaLeaseGrant) => void;
  reject: (error: Error) => void;
}

export interface AreaLeaseSnapshot {
  ownersByArea: Record<string, string>;
  heldByOwner: Record<string, string[]>;
  waiting: Array<{ ownerId: string; areaIds: string[]; reason: string; sequence: number }>;
  progressingOwners: string[];
  maximumSimultaneouslyProgressing: number;
}

export interface ControlledOverlapEvidence {
  areaId: string;
  nodeId: string;
  ownerIds: string[];
  entityIds: string[];
  /**
   * `controlled-player-observed` is a real overlap: another controlled bot was
   * ENGAGED (farming/boss) in a node this bot exclusively holds.
   * `transit-co-presence` is the benign case the design allows -- a bot merely
   * walking through. It is recorded as evidence but does not taint the run.
   */
  reason: "unleased-entry" | "controlled-player-observed" | "transit-co-presence";
  /** True only for a genuine overlap; false for a pass-through. */
  contaminating: boolean;
}

/**
 * Coordinator-owned, in-process exclusive lease scheduler.
 *
 * Requests acquire their entire area set atomically. A younger request may pass
 * an older blocked request only when their area sets do not intersect, preserving
 * FIFO fairness per area without imposing global head-of-line blocking.
 */
export class AreaLeaseManager {
  private readonly ownerByArea = new Map<string, string>();
  private readonly areasByOwner = new Map<string, Set<string>>();
  private readonly lastHeartbeatByOwner = new Map<string, number>();
  private readonly entityIdByOwner = new Map<string, string>();
  private readonly overlapListeners = new Map<string, (evidence: ControlledOverlapEvidence) => void>();
  private readonly progressingOwners = new Set<string>();
  /**
   * Owners currently doing deliberate combat (farming/boss), as opposed to
   * walking somewhere. Only an engaged bot can contaminate another's node, so
   * this is what separates a real overlap from a harmless pass-through.
   */
  private readonly engagedOwners = new Set<string>();
  private readonly pending: PendingRequest[] = [];
  private sequence = 0;
  private maximumProgressing = 0;
  private closed = false;
  private readonly sweepTimer: ReturnType<typeof setInterval>;

  constructor(
    readonly maxProgressing: number,
    private readonly staleAfterMs = 60_000,
    private readonly now: () => number = Date.now,
    /**
     * How long a waiter may keep the area it is parked in before that area is
     * force-released. A bot holds its current node while queueing so nobody
     * farms the node it is standing in; if every candidate is held by other
     * waiters doing the same, that is a cycle, and this breaks it.
     */
    private readonly parkedHoldBreakerMs = 120_000,
  ) {
    if (!Number.isInteger(maxProgressing) || maxProgressing < 1) {
      throw new Error("maxProgressing must be a positive integer");
    }
    if (staleAfterMs <= 0) throw new Error("staleAfterMs must be positive");
    if (parkedHoldBreakerMs <= 0) throw new Error("parkedHoldBreakerMs must be positive");
    this.sweepTimer = setInterval(
      () => {
        this.expireStaleOwners();
        this.breakParkedHolds();
        // Widen deadlines are time-based: nothing else would wake a request
        // whose near cluster stayed busy past its widen point.
        this.poll();
      },
      Math.max(250, Math.min(5_000, Math.floor(staleAfterMs / 2))),
    );
    this.sweepTimer.unref?.();
  }

  acquire(request: AreaLeaseRequest): Promise<AreaLeaseGrant> {
    if (this.closed) return Promise.reject(new Error("lease manager is shut down"));
    const areaIds = normalizeAreas(request.areaIds);
    if (areaIds.length === 0) return Promise.reject(new Error("lease request has no areas"));

    this.heartbeat(request.ownerId);
    const existing = this.pending.find((entry) => entry.ownerId === request.ownerId);
    if (existing) {
      if (sameAreas(existing.areaIds, areaIds)) {
        return new Promise((resolve, reject) => {
          const originalResolve = existing.resolve;
          const originalReject = existing.reject;
          existing.resolve = (grant) => { originalResolve(grant); resolve(grant); };
          existing.reject = (error) => { originalReject(error); reject(error); };
        });
      }
      return Promise.reject(new Error(`${request.ownerId} already has a different pending lease request`));
    }

    const mode = request.mode ?? "all";
    const held = this.areasByOwner.get(request.ownerId) ?? new Set<string>();
    // "any" is satisfied by the first preferred candidate we already hold.
    const ownedSubset =
      mode === "any"
        ? areaIds.filter((areaId) => held.has(areaId)).slice(0, 1)
        : areaIds.every((areaId) => held.has(areaId))
          ? areaIds
          : [];
    if (ownedSubset.length > 0 && this.progressingOwners.has(request.ownerId)) {
      return Promise.resolve({
        ownerId: request.ownerId,
        areaIds: ownedSubset,
        newlyAcquiredAreaIds: [],
        waitDurationMs: 0,
        conflictingOwnerIds: [],
      });
    }

    // The caller pauses before requesting. It no longer consumes a progress
    // permit while queued, though its existing area leases remain protective.
    this.progressingOwners.delete(request.ownerId);
    return new Promise<AreaLeaseGrant>((resolve, reject) => {
      this.pending.push({
        ...request,
        areaIds,
        mode,
        sequence: this.sequence++,
        requestedAt: this.now(),
        conflictingOwnerIds: new Set<string>(),
        resolve,
        reject,
      });
      this.dispatch();
    });
  }

  heartbeat(ownerId: string): void {
    if (!this.closed) this.lastHeartbeatByOwner.set(ownerId, this.now());
  }

  registerOverlapListener(
    ownerId: string,
    listener: (evidence: ControlledOverlapEvidence) => void,
  ): () => void {
    this.overlapListeners.set(ownerId, listener);
    return () => this.overlapListeners.delete(ownerId);
  }

  noteEntity(ownerId: string, entityId: string): void {
    this.heartbeat(ownerId);
    if (entityId) this.entityIdByOwner.set(ownerId, entityId);
  }

  setEngaged(ownerId: string, engaged: boolean): void {
    if (engaged) this.engagedOwners.add(ownerId);
    else this.engagedOwners.delete(ownerId);
  }

  isEngaged(ownerId: string): boolean {
    return this.engagedOwners.has(ownerId);
  }

  ownerForEntity(entityId: string): string | null {
    for (const [ownerId, currentEntityId] of this.entityIdByOwner) {
      if (currentEntityId === entityId) return ownerId;
    }
    return null;
  }

  reportOverlap(evidence: ControlledOverlapEvidence): void {
    for (const ownerId of new Set(evidence.ownerIds)) {
      this.overlapListeners.get(ownerId)?.(evidence);
    }
  }

  releaseExcept(ownerId: string, retainedAreaIds: readonly string[], reason = "area-left"): string[] {
    void reason;
    const retained = new Set(normalizeAreas(retainedAreaIds));
    const held = this.areasByOwner.get(ownerId);
    if (!held) return [];
    const released: string[] = [];
    for (const areaId of [...held]) {
      if (retained.has(areaId)) continue;
      if (this.ownerByArea.get(areaId) === ownerId) this.ownerByArea.delete(areaId);
      held.delete(areaId);
      released.push(areaId);
    }
    if (held.size === 0) {
      this.areasByOwner.delete(ownerId);
      this.progressingOwners.delete(ownerId);
    }
    this.dispatch();
    return released.sort();
  }

  releaseOwner(ownerId: string, reason = "terminal"): string[] {
    void reason;
    const pending = this.pending.findIndex((entry) => entry.ownerId === ownerId);
    if (pending >= 0) {
      const [entry] = this.pending.splice(pending, 1);
      entry.reject(new Error(`lease request cancelled: ${reason}`));
    }
    this.progressingOwners.delete(ownerId);
    this.engagedOwners.delete(ownerId);
    this.lastHeartbeatByOwner.delete(ownerId);
    this.entityIdByOwner.delete(ownerId);
    this.overlapListeners.delete(ownerId);
    return this.releaseExcept(ownerId, [], reason);
  }

  disconnectOwner(ownerId: string): string[] {
    return this.releaseOwner(ownerId, "disconnect/crash");
  }

  expireStaleOwners(): string[] {
    if (this.closed) return [];
    const cutoff = this.now() - this.staleAfterMs;
    const expired: string[] = [];
    for (const [ownerId, lastHeartbeat] of this.lastHeartbeatByOwner) {
      if (lastHeartbeat > cutoff) continue;
      expired.push(ownerId);
      this.releaseOwner(ownerId, "heartbeat-expired");
    }
    return expired.sort();
  }

  /**
   * Release the parked area of any waiter that has held it too long, so a ring
   * of mutually-blocked waiters cannot wedge. Only areas the waiter is NOT
   * asking for are dropped -- its pending request is untouched, and it keeps
   * waiting rather than failing. Returns the owners whose hold was broken.
   */
  breakParkedHolds(): string[] {
    if (this.closed) return [];
    const cutoff = this.now() - this.parkedHoldBreakerMs;
    const broken: string[] = [];
    for (const request of [...this.pending]) {
      if (request.requestedAt > cutoff) continue;
      const wanted = new Set(request.areaIds);
      const parked = [...(this.areasByOwner.get(request.ownerId) ?? [])].filter(
        (areaId) => !wanted.has(areaId),
      );
      if (parked.length === 0) continue;
      // Only give up a parked node that is actually blocking somebody. A bot
      // simply queueing for a busy dungeon keeps standing where it is, because
      // releasing it there would expose the very overlap the hold prevents. In
      // a genuine ring every parked area IS wanted, so the ring still breaks.
      const contested = parked.some((areaId) =>
        this.pending.some(
          (other) => other.ownerId !== request.ownerId && other.areaIds.includes(areaId),
        ),
      );
      if (!contested) continue;
      this.releaseExcept(request.ownerId, request.areaIds, "parked-hold-breaker");
      broken.push(request.ownerId);
    }
    return broken.sort();
  }

  /**
   * Re-run arbitration. Widen deadlines are time-based, so nothing else would
   * wake a request whose near cluster is still busy past its widen point. The
   * sweep timer calls this; tests drive it directly with a fake clock.
   */
  poll(): void {
    this.dispatch();
  }

  owns(ownerId: string, areaId: string): boolean {
    return this.ownerByArea.get(areaId) === ownerId;
  }

  ownerOf(areaId: string): string | null {
    return this.ownerByArea.get(areaId) ?? null;
  }

  heldAreas(ownerId: string): string[] {
    return [...(this.areasByOwner.get(ownerId) ?? [])].sort();
  }

  snapshot(): AreaLeaseSnapshot {
    return {
      ownersByArea: Object.fromEntries([...this.ownerByArea].sort(([a], [b]) => a.localeCompare(b))),
      heldByOwner: Object.fromEntries(
        [...this.areasByOwner]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([owner, areas]) => [owner, [...areas].sort()]),
      ),
      waiting: [...this.pending]
        .sort((a, b) => a.sequence - b.sequence)
        .map((entry) => ({
          ownerId: entry.ownerId,
          areaIds: [...entry.areaIds],
          reason: entry.reason,
          sequence: entry.sequence,
        })),
      progressingOwners: [...this.progressingOwners].sort(),
      maximumSimultaneouslyProgressing: this.maximumProgressing,
    };
  }

  shutdown(reason = "coordinator-shutdown"): void {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.sweepTimer);
    for (const entry of this.pending.splice(0)) {
      entry.reject(new Error(`lease manager shut down: ${reason}`));
    }
    this.ownerByArea.clear();
    this.areasByOwner.clear();
    this.progressingOwners.clear();
    this.engagedOwners.clear();
    this.lastHeartbeatByOwner.clear();
    this.entityIdByOwner.clear();
    this.overlapListeners.clear();
  }

  private dispatch(): void {
    if (this.closed) return;
    let granted = true;
    while (granted && this.progressingOwners.size < this.maxProgressing) {
      granted = false;
      const ordered = [...this.pending].sort((a, b) => a.sequence - b.sequence);
      for (const request of ordered) {
        const conflicts = this.conflictingOwners(request);
        for (const owner of conflicts) request.conflictingOwnerIds.add(owner);

        // What this grant would actually take. "any" claims exactly the first
        // free (or already-ours) candidate in the caller's preference order.
        let grantAreas: string[];
        if (request.mode === "any") {
          const pool = this.candidatePool(request);
          const free = pool.find((areaId) => {
            const owner = this.ownerByArea.get(areaId);
            return !owner || owner === request.ownerId;
          });
          if (!free) continue;
          grantAreas = [free];
        } else {
          if (conflicts.length > 0) continue;
          // FIFO per area: a younger request must not jump an older blocked one
          // that needs the same areas. "any" needs no such guard -- this loop is
          // already oldest-first, so an older waiter gets first pick of whatever
          // frees up, while a younger one may still take a candidate the older
          // one does not need. That avoids head-of-line blocking.
          const olderConflictingWaiter = ordered.some(
            (older) =>
              older.sequence < request.sequence &&
              older.ownerId !== request.ownerId &&
              older.mode === "all" &&
              intersects(older.areaIds, request.areaIds),
          );
          if (olderConflictingWaiter) continue;
          grantAreas = [...request.areaIds];
        }

        const index = this.pending.indexOf(request);
        if (index < 0) continue;
        this.pending.splice(index, 1);
        const held = this.areasByOwner.get(request.ownerId) ?? new Set<string>();
        const newlyAcquiredAreaIds: string[] = [];
        for (const areaId of grantAreas) {
          if (!held.has(areaId)) newlyAcquiredAreaIds.push(areaId);
          held.add(areaId);
          this.ownerByArea.set(areaId, request.ownerId);
        }
        this.areasByOwner.set(request.ownerId, held);
        this.progressingOwners.add(request.ownerId);
        this.maximumProgressing = Math.max(this.maximumProgressing, this.progressingOwners.size);
        request.resolve({
          ownerId: request.ownerId,
          areaIds: grantAreas,
          newlyAcquiredAreaIds: newlyAcquiredAreaIds.sort(),
          waitDurationMs: this.now() - request.requestedAt,
          conflictingOwnerIds: [...request.conflictingOwnerIds].sort(),
        });
        granted = true;
        break;
      }
    }
  }

  /**
   * What an "any" request may be granted from right now: its preferred (near)
   * subset until the widen deadline passes, the full list afterwards.
   */
  private candidatePool(request: PendingRequest): readonly string[] {
    const preferred = request.preferredAreaIds;
    if (!preferred || preferred.length === 0) return request.areaIds;
    if (request.widenAfterMs === undefined) return preferred;
    const widened = this.now() - request.requestedAt >= request.widenAfterMs;
    return widened ? request.areaIds : preferred;
  }

  private conflictingOwners(request: PendingRequest): string[] {
    const owners = new Set<string>();
    for (const areaId of request.areaIds) {
      const owner = this.ownerByArea.get(areaId);
      if (owner && owner !== request.ownerId) owners.add(owner);
    }
    return [...owners].sort();
  }
}

/** Dedupe and drop blanks, but KEEP caller order: "any" mode treats it as preference. */
function normalizeAreas(areaIds: readonly string[]): string[] {
  return [...new Set(areaIds.filter((areaId) => areaId.length > 0))];
}

function sameAreas(a: readonly string[], b: readonly string[]): boolean {
  const aa = [...normalizeAreas(a)].sort();
  const bb = [...normalizeAreas(b)].sort();
  return aa.length === bb.length && aa.every((value, index) => value === bb[index]);
}

function intersects(a: readonly string[], b: readonly string[]): boolean {
  const values = new Set(a);
  return b.some((value) => values.has(value));
}
