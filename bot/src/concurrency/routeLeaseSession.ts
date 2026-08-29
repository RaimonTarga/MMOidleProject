import { CLEARING_NODE_ID, NODE_BIOMES, shortestWorldPath } from "@mmo-idle/shared";
import type { Intents } from "../net/intents";
import type { Observation } from "../state/observation";
import type { BotEvent } from "../telemetry/events";
import type { Activity, Recorder } from "../telemetry/recorder";
import {
  AreaLeaseManager,
  type ControlledOverlapEvidence,
} from "./areaLeaseManager";

export interface LeaseSessionEvidence {
  totalWaitMs: number;
  maximumWaitMs: number;
  acquisitions: number;
  releases: number;
  contaminated: boolean;
  overlaps: ControlledOverlapEvidence[];
  /**
   * Waits the bot spent still fighting in a node it exclusively owned, and how
   * long. This is safe for isolation but NOT free for evidence: the run banks
   * essence/XP a sequential run would not have at that point, and can die doing
   * it. Reported so a parallel run is never compared to a solo one blind.
   */
  productiveWaits: number;
  productiveWaitMs: number;
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

/** All biome areas touched by the authoritative shared shortest path. */
export function controlledAreasForTravel(fromNodeId: string, toNodeId: string): string[] {
  const path = shortestWorldPath(fromNodeId, toNodeId);
  if (!path) throw new Error(`no world path from ${fromNodeId} to ${toNodeId}`);
  const areas = path.map(controlledAreaForNode).filter((area): area is string => area !== null);
  return [...new Set(areas)].sort();
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
    productiveWaits: 0,
    productiveWaitMs: 0,
  };
  private unregisterOverlap: (() => void) | null;

  constructor(
    readonly ownerId: string,
    private readonly manager: AreaLeaseManager,
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
    opts: {
      /** Nodes worth holding out for (normally the nearest cluster). */
      preferredNodeIds?: readonly string[];
      /** How long to insist on `preferredNodeIds` before accepting any candidate. */
      widenAfterMs?: number;
    } = {},
  ): Promise<string> {
    if (candidateNodeIds.length === 0) throw new Error(`no candidate nodes for ${reason}`);

    // An unleased node (the Clearing) needs no permission from anyone. Any node
    // still held is released by `releaseNode` once we are observed to have left
    // it, not here -- we may still be standing in it.
    const head = candidateNodeIds[0];
    if (controlledAreaForNode(head) === null) return head;

    const areas = candidateNodeIds
      .map(controlledAreaForNode)
      .filter((area): area is string => area !== null);
    if (areas.length === 0) return head;

    const standingArea = controlledAreaForNode(obs.nodeId ?? "");
    const canFarmWhileWaiting =
      standingArea !== null &&
      this.manager.owns(this.ownerId, standingArea) &&
      !areas.includes(standingArea);
    if (!canFarmWhileWaiting) this.pause(obs, intents);
    else this.evidenceState.productiveWaits += 1;

    const preferredAreas = (opts.preferredNodeIds ?? [])
      .map(controlledAreaForNode)
      .filter((area): area is string => area !== null && areas.includes(area));
    const granted = await this.acquire(
      areas,
      reason,
      areas.length > 1 ? "any" : "all",
      canFarmWhileWaiting,
      preferredAreas.length > 0 && preferredAreas.length < areas.length
        ? { preferredAreaIds: preferredAreas, widenAfterMs: opts.widenAfterMs }
        : undefined,
    );
    // The previously held node is NOT dropped here. We may still be standing in
    // it; `releaseNode` gives it up once the walk out is actually observed.
    const nodeId = nodeIdForArea(granted);
    if (!nodeId) throw new Error(`granted area is not a node: ${granted}`);
    return nodeId;
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
    const areaId = controlledAreaForNode(nodeId);
    if (!areaId) return;
    const held = this.manager.heldAreas(this.ownerId);
    if (!held.includes(areaId)) return;
    const released = this.manager.releaseExcept(
      this.ownerId,
      held.filter((entry) => entry !== areaId),
      reason,
    );
    if (released.length === 0) return;
    this.evidenceState.releases += released.length;
    this.emit({
      kind: "area-lease",
      atMs: this.recorder?.now() ?? 0,
      phase: "released",
      areaIds: released,
      reason,
    });
  }


  observe(obs: Observation, entityId: string): void {
    this.manager.noteEntity(this.ownerId, entityId);

    // Engagement is DERIVED from the server's own auto-combat flag, every tick,
    // rather than toggled by hand at each travel/farm site. A manual flag leaked:
    // `farmUntil`'s death-recovery nudge issues its own `navigateTo` without
    // going through `ensureAt`, so a bot that died mid-farm walked home still
    // marked "engaged" and poisoned every node it crossed with a false
    // contamination. `auto` cannot go stale -- the server clears it on
    // `navigateTo` and on respawn -- so any present or future travel path is
    // covered without needing to know it exists.
    const self = obs.self;
    this.manager.setEngaged(this.ownerId, (self?.auto ?? false) && !(self?.isDead ?? false));

    const nodeId = obs.nodeId;
    const areaId = controlledAreaForNode(nodeId);
    if (!nodeId || !areaId) return;

    // Pure transit and the shared Clearing are intentionally unleased. Only an
    // owner claiming active progression in a node generates overlap evidence.
    if (!this.manager.owns(this.ownerId, areaId)) return;

    for (const other of obs.otherPlayers()) {
      const otherOwner = this.manager.ownerForEntity(other.id);
      if (!otherOwner || otherOwner === this.ownerId) continue;
      // Walking through a node is allowed by design and cannot affect its
      // owner's evidence -- a transiting bot does not fight here. Only a bot
      // that is ENGAGED in a node it does not hold is a real overlap. Both are
      // recorded; only the engaged case taints the run.
      const contaminating = this.manager.isEngaged(otherOwner);
      this.manager.reportOverlap({
        areaId,
        nodeId,
        ownerIds: [this.ownerId, otherOwner],
        entityIds: [entityId, other.id].filter(Boolean),
        reason: contaminating ? "controlled-player-observed" : "transit-co-presence",
        contaminating,
      });
    }
  }

  /** True when another controlled bot exclusively holds this node. */
  isForeignNode(nodeId: string): boolean {
    const areaId = controlledAreaForNode(nodeId);
    if (!areaId) return false;
    const owner = this.manager.ownerOf(areaId);
    return owner !== null && owner !== this.ownerId;
  }

  heartbeat(entityId = ""): void {
    if (entityId) this.manager.noteEntity(this.ownerId, entityId);
    else this.manager.heartbeat(this.ownerId);
  }

  releaseAll(reason: string): void {
    const released = this.manager.releaseOwner(this.ownerId, reason);
    if (released.length > 0) {
      this.evidenceState.releases += released.length;
      this.emit({
        kind: "area-lease",
        atMs: this.recorder?.now() ?? 0,
        phase: "released",
        areaIds: released,
        reason,
      });
    }
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
    return this.manager.heldAreas(this.ownerId);
  }

  ownsNode(nodeId: string): boolean {
    const areaId = controlledAreaForNode(nodeId);
    // An unleased node is nobody's to own -- callers gating on exclusivity
    // (the fast-retry check) must read that as "not owned", never as a throw.
    return areaId !== null && this.manager.owns(this.ownerId, areaId);
  }

  maximumSimultaneouslyProgressing(): number {
    return this.manager.snapshot().maximumSimultaneouslyProgressing;
  }

  private async acquire(
    areaIds: string[],
    reason: string,
    mode: "all" | "any" = "all",
    /** The bot is still fighting in a node it owns; do not relabel it as idle. */
    farmingWhileWaiting = false,
    nearness?: { preferredAreaIds: readonly string[]; widenAfterMs?: number },
  ): Promise<string> {
    const conflictingOwnerId = areaIds
      .map((areaId) => this.manager.ownerOf(areaId))
      .find((owner): owner is string => !!owner && owner !== this.ownerId);
    const waitStartedAt = Date.now();
    this.emit({
      kind: "area-lease",
      atMs: this.recorder?.now() ?? 0,
      phase: "wait-start",
      areaIds,
      reason,
      conflictingOwnerId,
    });
    // A frozen bot is parked in "lease-wait" so the time is never mistaken for
    // combat. A productively waiting one keeps its farm activity, because it IS
    // still fighting -- its kills and damage must land in the normal buckets.
    if (this.recorder && !farmingWhileWaiting) this.setActivity("lease-wait");
    const grant = await this.manager.acquire({
      ownerId: this.ownerId,
      areaIds,
      reason,
      mode,
      ...nearness,
    });
    if (this.recorder && !farmingWhileWaiting) this.setActivity("idle");
    const waitDurationMs = Math.max(grant.waitDurationMs, Date.now() - waitStartedAt);
    this.evidenceState.totalWaitMs += waitDurationMs;
    if (farmingWhileWaiting) this.evidenceState.productiveWaitMs += waitDurationMs;
    this.evidenceState.maximumWaitMs = Math.max(this.evidenceState.maximumWaitMs, waitDurationMs);
    this.evidenceState.acquisitions += grant.newlyAcquiredAreaIds.length;
    this.emit({
      kind: "area-lease",
      atMs: this.recorder?.now() ?? 0,
      phase: "acquired",
      areaIds: grant.areaIds,
      reason,
      waitDurationMs,
      conflictingOwnerId: grant.conflictingOwnerIds[0] ?? conflictingOwnerId,
    });
    return grant.areaIds[0];
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

function nodeIdForArea(areaId: string): string | null {
  return areaId.startsWith("node:") ? areaId.slice("node:".length) : null;
}
