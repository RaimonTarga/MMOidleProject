import type { ControlledOverlapEvidence, CombatReservationManager } from "./areaLeaseManager";

export interface CohortObservation {
  ownerId: string;
  entityId: string;
  nodeId: string | null;
  alive: boolean;
  autoCombat: boolean;
}

export interface ConcurrencyInterval {
  nodeId: string;
  participantOwnerIds: string[];
  startedAtMs: number;
  endedAtMs: number | null;
  classification:
    | "transit-co-presence"
    | "shared-combat"
    | "foreign-combat-in-exclusive-node"
    | "shared-boss-state";
}

/**
 * Coordinator-owned passive evidence monitor. It observes session snapshots and
 * reads reservation state, but never grants, renews, releases, or converts an
 * admission. Existing session listeners receive compatibility overlap events.
 */
export class CohortEvidenceMonitor {
  private readonly observations = new Map<string, CohortObservation>();
  private readonly activeIntervals = new Map<string, ConcurrencyInterval>();
  private readonly intervals: ConcurrencyInterval[] = [];
  private maximumProgressing = 0;

  constructor(
    private readonly manager: CombatReservationManager,
    private readonly now: () => number = Date.now,
  ) {}

  observe(observation: CohortObservation): void {
    this.observations.set(observation.ownerId, { ...observation });
    this.maximumProgressing = Math.max(
      this.maximumProgressing,
      [...this.observations.values()].filter((entry) => entry.alive && entry.autoCombat).length,
    );
    this.reconcile();
  }

  snapshot(): ConcurrencyInterval[] {
    return this.cloneIntervals(this.intervals);
  }

  /** The evidence stream for one run contains only intervals it participated in. */
  snapshotFor(ownerId: string): ConcurrencyInterval[] {
    return this.cloneIntervals(
      this.intervals.filter((interval) => interval.participantOwnerIds.includes(ownerId)),
    );
  }

  maximumSimultaneouslyProgressing(): number {
    return this.maximumProgressing;
  }

  private cloneIntervals(intervals: readonly ConcurrencyInterval[]): ConcurrencyInterval[] {
    const endedAtMs = this.now();
    return intervals.map((interval) => ({
      ...interval,
      participantOwnerIds: [...interval.participantOwnerIds],
      endedAtMs: interval.endedAtMs ?? endedAtMs,
    }));
  }

  private reconcile(): void {
    const current = new Map<string, ConcurrencyInterval>();
    const observations = [...this.observations.values()].filter((entry) => entry.nodeId && entry.alive);
    for (let i = 0; i < observations.length; i += 1) {
      for (let j = i + 1; j < observations.length; j += 1) {
        const a = observations[i];
        const b = observations[j];
        if (!a.nodeId || a.nodeId !== b.nodeId) continue;
        const classification = this.classify(a, b);
        const participantOwnerIds = [a.ownerId, b.ownerId].sort();
        const key = `${a.nodeId}|${participantOwnerIds.join(",")}|${classification}`;
        current.set(key, {
          nodeId: a.nodeId,
          participantOwnerIds,
          startedAtMs: this.now(),
          endedAtMs: null,
          classification,
        });
        if (!this.activeIntervals.has(key)) {
          const interval = current.get(key)!;
          this.activeIntervals.set(key, interval);
          this.intervals.push(interval);
          this.manager.reportOverlap(this.compatibilityEvidence(a, b, classification));
        }
      }
    }
    for (const [key, interval] of this.activeIntervals) {
      if (current.has(key)) continue;
      interval.endedAtMs = this.now();
      this.activeIntervals.delete(key);
    }
  }

  private classify(a: CohortObservation, b: CohortObservation): ConcurrencyInterval["classification"] {
    const nodeId = a.nodeId!;
    const admission = this.manager.snapshot().admissionsByNode[nodeId];
    if (admission?.kind === "shared-degraded") {
      return admission.admission.purposes.includes("boss") ? "shared-boss-state" : "shared-combat";
    }
    const exclusiveOwner = this.manager.ownerOf(nodeId);
    if (exclusiveOwner && (
      (a.autoCombat && a.ownerId !== exclusiveOwner) ||
      (b.autoCombat && b.ownerId !== exclusiveOwner)
    )) {
      return "foreign-combat-in-exclusive-node";
    }
    return "transit-co-presence";
  }

  private compatibilityEvidence(
    a: CohortObservation,
    b: CohortObservation,
    classification: ConcurrencyInterval["classification"],
  ): ControlledOverlapEvidence {
    const contaminating =
      classification === "foreign-combat-in-exclusive-node" || classification === "shared-boss-state";
    return {
      areaId: `node:${a.nodeId}`,
      nodeId: a.nodeId!,
      ownerIds: [a.ownerId, b.ownerId],
      entityIds: [a.entityId, b.entityId].filter(Boolean),
      reason: contaminating ? "controlled-player-observed" : "transit-co-presence",
      contaminating,
    };
  }
}
