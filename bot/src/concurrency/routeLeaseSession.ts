import { CLEARING_NODE_ID, NODE_BIOMES } from "@mmo-idle/shared";
import type { Intents } from "../net/intents";
import type { Observation } from "../state/observation";
import type { BotEvent, CoordinationFallback } from "../telemetry/events";
import type { Activity, Recorder } from "../telemetry/recorder";
import {
  CombatReservationManager,
  type CombatPermit,
  DEFAULT_ISOLATED_LIVENESS_POLICY,
  type LivenessPolicy,
  type ControlledOverlapEvidence,
  type ReservationSnapshot,
} from "./areaLeaseManager";
import type { CohortEvidenceMonitor, ConcurrencyInterval } from "./cohortEvidenceMonitor";

export interface LeaseSessionEvidence {
  totalWaitMs: number;
  maximumWaitMs: number;
  acquisitions: number;
  releases: number;
  contaminated: boolean;
  overlaps: ControlledOverlapEvidence[];
  sharedAdmissions: number;
  fallbacks: CoordinationFallback[];
  /** A forced expiry or failed release invalidates the harness, not gameplay. */
  harnessInvalid: boolean;
}

/** Strict isolation exhausted a local coordination budget; gameplay may continue partially. */
export class CoordinationExhaustedError extends Error {
  constructor(
    readonly reason: string,
    readonly nodeId?: string,
    readonly cause?: unknown,
  ) {
    super(`coordination exhausted: ${reason}`);
  }
}
/**
 * One world node is one exclusive area.
 *
 * The server proves the boundary: monster allocation, auto-targeting, AoE, and
 * `grantMonsterRewards`' party share are all scoped by `hasPosition.nodeId` --
 * the reward share explicitly skips members whose node differs from the kill's.
 * Two controlled bots in different nodes therefore cannot touch one another's
 * combat or progression evidence, so a whole-biome lease is more than isolation
 * requires and needlessly serializes the shared six-biome spine.
 *
 * A dungeon is its own node id, so dungeon/guardian/boss runtime state stays
 * exclusive under exactly the same rule.
 *
 * The Clearing is the one deliberate exemption. Every route opens there for the
 * tier-0 quest and the starter set, so leasing it would serialize the whole
 * batch behind one node before any bot reaches the content under test -- and
 * the tutorial is not a difficulty measurement anyone reads. Bots may share it
 * freely, exactly as they may share any node in transit.
 */
export function controlledAreaForNode(nodeId: string): string | null {
  if (!nodeId || nodeId === CLEARING_NODE_ID) return null;
  return `node:${nodeId}`;
}

/** The biome a node belongs to, for evidence only -- never a lease boundary. */
export function biomeGroupForNode(nodeId: string): string | null {
  return NODE_BIOMES[nodeId]?.biomeGroup ?? null;
}



/**
 * Per-run facade over the central manager. The manager owns arbitration; this
 * object only translates nodes to exclusive node leases and records proof.
 */
export class RouteLeaseSession {
  private recorder: Recorder | null = null;
  private readonly bufferedEvents: BotEvent[] = [];
  private readonly evidenceState: LeaseSessionEvidence = {
    totalWaitMs: 0,
    maximumWaitMs: 0,
    acquisitions: 0,
    releases: 0,
    contaminated: false,
    overlaps: [],
    sharedAdmissions: 0,
    fallbacks: [],
    harnessInvalid: false,
  };
  private unregisterOverlap: (() => void) | null;
  private readonly activePermits = new Map<string, CombatPermit>();
  private readonly activeSharedAdmissions = new Map<string, string>();
  private pendingAbort: AbortController | null = null;

  constructor(
    readonly ownerId: string,
    private readonly manager: CombatReservationManager,
    private readonly liveness: LivenessPolicy = DEFAULT_ISOLATED_LIVENESS_POLICY,
    private readonly evidenceMonitor?: CohortEvidenceMonitor,
  ) {
    this.unregisterOverlap = manager.registerOverlapListener(ownerId, (evidence) => {
      if (evidence.contaminating) this.evidenceState.contaminated = true;
      this.evidenceState.overlaps.push(evidence);
      this.emit({
        kind: "controlled-overlap",
        atMs: this.recorder?.now() ?? 0,
        ...evidence,
      });
    });
  }

  attachRecorder(recorder: Recorder): void {
    this.recorder = recorder;
    for (const event of this.bufferedEvents.splice(0)) recorder.emit(event);
  }

  /**
   * Gate an activity BEFORE any travel happens, and answer which node it may
   * use. `candidateNodeIds` is the executor's own preference order; index 0 is
   * what a solo run would pick, so an uncontended parallel run behaves exactly
   * like a sequential one.
   *
   * The bot keeps the lease on the node it is currently parked in until the new
   * grant lands. Releasing first would let another controlled bot legitimately
   * acquire and farm the very node this one is still standing in, which is the
   * overlap the whole system exists to prevent.
   *
   * Waiting is PRODUCTIVE where it safely can be: if the bot still owns the node
   * it is standing in, it keeps fighting there instead of freezing, because an
   * exclusively-held node cannot contaminate anyone. It only freezes when it
   * holds nothing -- there is nowhere safe to fight.
   */
  async acquireActivity(
    candidateNodeIds: readonly string[],
    obs: Observation,
    intents: Intents,
    reason: string,
    opts: { preferredNodeIds?: readonly string[]; widenAfterMs?: number } = {},
  ): Promise<string> {
    if (candidateNodeIds.length === 0) throw new Error(`no candidate nodes for ${reason}`);
    return this.acquireTypedActivity(candidateNodeIds, obs, intents, reason, opts);
  }

  /**
   * Give up exactly ONE node, leaving every other lease intact.
   *
   * This is the release that matters for isolation: it is called when the bot's
   * own position slice confirms it has left that node, never when the executor
   * merely decides to travel. Releasing at the decision left the node free while
   * the avatar was still walking out of it, so the next bot could be granted it
   * and farm around a bot that had not actually gone yet.
   *
   * Deliberately surgical rather than "release all but the destination": during
   * a multi-hop walk the bot stands in intermediate nodes it does not own, and a
   * retain-list built from its current position would drop the destination.
   */
  releaseNode(nodeId: string, reason = "departed-node"): void {
    const permit = this.activePermits.get(nodeId);
    const admissionId = this.activeSharedAdmissions.get(nodeId);
    const released = permit
      ? this.manager.release(permit, reason)
      : admissionId
        ? (this.manager.leaveShared(admissionId, this.ownerId, reason), true)
        : false;
    if (!released) return;
    this.activePermits.delete(nodeId);
    this.activeSharedAdmissions.delete(nodeId);
    this.evidenceState.releases += 1;
    this.emit({
      kind: "area-lease",
      atMs: this.recorder?.now() ?? 0,
      phase: "released",
      areaIds: [`node:${nodeId}`],
      reason,
      permitId: permit?.permitId,
      epoch: permit?.epoch,
      purpose: permit?.purpose,
    });
  }


  observe(obs: Observation, entityId: string): void {
    this.manager.noteEntity(this.ownerId, entityId);
    for (const [nodeId, permit] of this.activePermits) {
      try {
        const renewed = this.manager.renew(permit);
        this.activePermits.set(nodeId, obs.nodeId === nodeId ? this.manager.confirmEntry(renewed) : renewed);
      } catch {
        this.activePermits.delete(nodeId);
        this.evidenceState.harnessInvalid = true;
        this.recordFallback("reservation-expired", "partial-stop", nodeId);
      }
    }
    for (const [nodeId, admissionId] of this.activeSharedAdmissions) {
      try {
        this.manager.renewShared(admissionId, this.ownerId, this.liveness.sharedAdmissionTtlMs);
      } catch {
        this.activeSharedAdmissions.delete(nodeId);
        this.evidenceState.harnessInvalid = true;
        this.recordFallback("reservation-expired", "partial-stop", nodeId);
      }
    }
    const self = obs.self;
    this.manager.setEngaged(this.ownerId, (self?.auto ?? false) && !(self?.isDead ?? false));
    this.evidenceMonitor?.observe({
      ownerId: this.ownerId,
      entityId,
      nodeId: obs.nodeId ?? null,
      alive: !(self?.isDead ?? false),
      autoCombat: self?.auto ?? false,
    });
  }

  /** True when another controlled bot exclusively holds this node. */
  isForeignNode(nodeId: string): boolean {
    if (controlledAreaForNode(nodeId) === null) return false;
    const owner = this.manager.ownerOf(nodeId);
    return owner !== null && owner !== this.ownerId;
  }

  heartbeat(entityId = ""): void {
    if (entityId) this.manager.noteEntity(this.ownerId, entityId);
  }

  /** Release permits and cancel a waiter without unregistering this live session. */
  interrupt(reason: string): void {
    this.pendingAbort?.abort();
    this.pendingAbort = null;
    const report = this.manager.releaseOwner(this.ownerId, reason);
    this.activePermits.clear();
    this.activeSharedAdmissions.clear();
    const released = [...report.releasedPermitIds, ...report.leftAdmissionIds];
    if (released.length > 0) {
      this.evidenceState.releases += released.length;
      this.emit({ kind: "area-lease", atMs: this.recorder?.now() ?? 0, phase: "released", areaIds: released, reason });
    }
  }

  releaseAll(reason: string): void {
    this.interrupt(reason);
    this.unregisterOverlap?.();
    this.unregisterOverlap = null;
  }

  evidence(): LeaseSessionEvidence {
    return {
      ...this.evidenceState,
      overlaps: this.evidenceState.overlaps.map((entry) => ({
        ...entry,
        ownerIds: [...entry.ownerIds],
        entityIds: [...entry.entityIds],
      })),
    };
  }

  heldAreas(): string[] {
    return this.manager.heldNodes(this.ownerId).map((nodeId) => `node:${nodeId}`);
  }

  ownsNode(nodeId: string): boolean {
    return controlledAreaForNode(nodeId) !== null &&
      (this.manager.owns(this.ownerId, nodeId) || this.manager.isSharedParticipant(nodeId, this.ownerId));
  }

  maximumSimultaneouslyProgressing(): number {
    return 0;
  }

  reservationSnapshot(): ReservationSnapshot {
    return this.manager.snapshot();
  }

  concurrencyIntervals(): ConcurrencyInterval[] {
    return this.evidenceMonitor?.snapshotFor(this.ownerId) ?? [];
  }

  private async acquireTypedActivity(
    candidateNodeIds: readonly string[],
    obs: Observation,
    intents: Intents,
    reason: string,
    opts: { preferredNodeIds?: readonly string[]; widenAfterMs?: number },
  ): Promise<string> {
    void opts;
    const manager = this.manager;
    const candidates = [...new Set(candidateNodeIds.filter((nodeId) => controlledAreaForNode(nodeId) !== null))];
    if (candidates.length === 0) return candidateNodeIds[0];
    const purpose = reason.startsWith("dungeon-boss:")
      ? "boss" as const
      : reason.startsWith("protected-transit")
        ? "protected-transit" as const
        : "farm" as const;
    for (const nodeId of candidates) {
      const permit = manager.tryAcquireExclusive({ ownerId: this.ownerId, nodeId, purpose });
      if (!permit) continue;
      this.rememberPermit(permit, reason, 0);
      return nodeId;
    }
    if (this.activePermits.size > 0) {
      throw new Error(`${this.ownerId} cannot wait for ${reason} while holding a combat permit`);
    }
    this.pause(obs, intents);
    const controller = new AbortController();
    const waitStartedAt = Date.now();
    const nodeId = candidates[0];
    const remainingCoordinationWaitMs = this.liveness.totalCoordinationWaitMs - this.evidenceState.totalWaitMs;
    if (remainingCoordinationWaitMs <= 0 && this.liveness.contentionPolicy !== "degrade-to-shared") {
      throw new CoordinationExhaustedError(`total wait budget before ${reason}`, nodeId);
    }
    this.pendingAbort = controller;
    this.emit({ kind: "area-lease", atMs: this.recorder?.now() ?? 0, phase: "wait-start", areaIds: candidates.map((id) => `node:${id}`), reason });
    if (this.recorder) this.setActivity("lease-wait");
    try {
      const permit = await manager.acquireExclusive(
        { ownerId: this.ownerId, nodeId, purpose },
        {
          signal: controller.signal,
          deadlineAt: Date.now() + Math.max(1, Math.min(this.liveness.exclusiveWaitMs, remainingCoordinationWaitMs)),
        },
      );
      this.rememberPermit(permit, reason, Date.now() - waitStartedAt);
      return nodeId;
    } catch (error) {
      if (controller.signal.aborted) throw error;
      if (this.liveness.contentionPolicy !== "degrade-to-shared") {
        throw new CoordinationExhaustedError(`exclusive wait budget for ${reason}`, nodeId, error);
      }
      const admission = manager.admitShared({
        ownerId: this.ownerId,
        nodeId,
        trigger: "exclusive-wait-budget",
        purpose,
        ttlMs: this.liveness.sharedAdmissionTtlMs,
      });
      this.activeSharedAdmissions.set(nodeId, admission.admissionId);
      const waitDurationMs = Date.now() - waitStartedAt;
      this.evidenceState.acquisitions += 1;
      this.evidenceState.sharedAdmissions += 1;
      this.evidenceState.totalWaitMs += waitDurationMs;
      this.evidenceState.maximumWaitMs = Math.max(this.evidenceState.maximumWaitMs, waitDurationMs);
      this.emitFallback({
        trigger: "exclusive-wait-budget",
        action: "shared-admission",
        nodeId,
        startedAtMs: this.recorder?.now() ?? 0,
        endedAtMs: this.recorder?.now() ?? 0,
        affectedStepIndexes: [],
      });
      this.emit({
        kind: "area-lease",
        atMs: this.recorder?.now() ?? 0,
        phase: "acquired",
        areaIds: [`node:${nodeId}`],
        reason: `${reason}:shared-admission`,
        waitDurationMs,
      });
      return nodeId;
    } finally {
      if (this.pendingAbort === controller) this.pendingAbort = null;
      if (this.recorder) this.setActivity("idle");
    }
  }

  private rememberPermit(permit: CombatPermit, reason: string, waitDurationMs: number): void {
    const previous = this.activePermits.get(permit.nodeId);
    this.activePermits.set(permit.nodeId, permit);
    if (!previous) this.evidenceState.acquisitions += 1;
    this.evidenceState.totalWaitMs += waitDurationMs;
    this.evidenceState.maximumWaitMs = Math.max(this.evidenceState.maximumWaitMs, waitDurationMs);
    this.emit({
      kind: "area-lease",
      atMs: this.recorder?.now() ?? 0,
      phase: "acquired",
      areaIds: [`node:${permit.nodeId}`],
      reason,
      waitDurationMs,
      permitId: permit.permitId,
      epoch: permit.epoch,
      purpose: permit.purpose,
    });
  }

  recordFallback(
    trigger: CoordinationFallback["trigger"],
    action: CoordinationFallback["action"],
    nodeId?: string,
  ): void {
    const now = this.recorder?.now() ?? 0;
    this.emitFallback({ trigger, action, nodeId, startedAtMs: now, endedAtMs: now, affectedStepIndexes: [] });
  }

  private emitFallback(fallback: CoordinationFallback): void {
    this.evidenceState.fallbacks.push({
      ...fallback,
      affectedStepIndexes: [...fallback.affectedStepIndexes],
    });
    this.emit({ kind: "coordination-fallback", atMs: fallback.endedAtMs, fallback });
  }

  private pause(obs: Observation, intents: Intents): void {
    intents.setAuto(false);
    intents.setAutoTraverse(false);
    const self = obs.self;
    if (self) intents.moveTo(self.pos);
  }

  private setActivity(activity: Activity): Activity {
    this.recorder?.setActivity(activity);
    return activity;
  }

  private emit(event: BotEvent): void {
    if (this.recorder) this.recorder.emit(event);
    else this.bufferedEvents.push(event);
  }
}
