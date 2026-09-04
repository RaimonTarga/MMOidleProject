export type ControlledExecutionMode = "sequential" | "isolated-parallel";

/** Exact-node reservation primitives used by controlled parallel runs. */
export type ReservationPurpose = "farm" | "boss" | "protected-transit";
export type ContentionPolicy = "strict-isolation" | "degrade-to-shared";

export interface LivenessPolicy {
  contentionPolicy: ContentionPolicy;
  exclusiveWaitMs: number;
  transitReplans: number;
  transitDeathBudgetPerLeg: number;
  totalCoordinationWaitMs: number;
  sharedAdmissionTtlMs: number;
  stepDeadlineMs: number;
}
export const DEFAULT_ISOLATED_LIVENESS_POLICY: LivenessPolicy = {
  contentionPolicy: "degrade-to-shared",
  exclusiveWaitMs: 120_000,
  transitReplans: 1,
  transitDeathBudgetPerLeg: 1,
  totalCoordinationWaitMs: 120_000,
  sharedAdmissionTtlMs: 30_000,
  stepDeadlineMs: 30 * 60_000,
};
export type ReservationReleaseReason =
  | "activity-complete"
  | "area-left"
  | "death"
  | "step-failure"
  | "abort"
  | "disconnect"
  | "heartbeat-expired"
  | "entry-deadline-expired"
  | "coordinator-shutdown"
  | string;

export interface CombatPermit {
  permitId: string;
  ownerId: string;
  nodeId: string;
  epoch: number;
  purpose: ReservationPurpose;
  grantedAt: number;
  enterBy: number;
  expiresAt: number;
}

export interface ReservationRequest {
  ownerId: string;
  nodeId: string;
  purpose: ReservationPurpose;
}

export interface SharedAdmission {
  admissionId: string;
  nodeId: string;
  participantOwnerIds: string[];
  trigger: string;
  /** Activities that were explicitly converted into this shared interval. */
  purposes: ReservationPurpose[];
  admittedAt: number;
  expiresAt: number;
}

export interface SharedAdmissionRequest {
  ownerId: string;
  nodeId: string;
  trigger: string;
  purpose?: ReservationPurpose;
  ttlMs?: number;
}

export type NodeAdmissionState =
  | { kind: "vacant"; epoch: number }
  | { kind: "exclusive"; permit: CombatPermit }
  | { kind: "shared-degraded"; admission: SharedAdmission };

export interface ReservationSnapshot {
  admissionsByNode: Record<string, NodeAdmissionState>;
  pending: Array<{ requestId: string; ownerId: string; nodeId: string; purpose: ReservationPurpose; deadlineAt: number }>;
}

/** Passive evidence emitted by the coordinator monitor to participating runs. */
export interface ControlledOverlapEvidence {
  areaId: string;
  nodeId: string;
  ownerIds: string[];
  entityIds: string[];
  reason: "unleased-entry" | "controlled-player-observed" | "transit-co-presence";
  contaminating: boolean;
}

export interface CombatReservationManagerOptions {
  permitTtlMs?: number;
  entryTtlMs?: number;
  sharedAdmissionTtlMs?: number;
  now?: () => number;
}

interface PendingReservation extends ReservationRequest {
  requestId: string;
  deadlineAt: number;
  signal: AbortSignal;
  resolve: (permit: CombatPermit) => void;
  reject: (error: Error) => void;
  abortListener: () => void;
}

/** A run-capacity semaphore; it deliberately knows nothing about nodes. */
export class RunConcurrencyLimiter {
  private active = 0;
  private maximumActive = 0;
  private readonly pending: Array<() => void> = [];

  constructor(readonly maxConcurrency: number) {
    if (!Number.isInteger(maxConcurrency) || maxConcurrency < 1) {
      throw new Error("maxConcurrency must be a positive integer");
    }
  }

  async run<T>(work: () => Promise<T>): Promise<T> {
    await new Promise<void>((resolve) => {
      if (this.active < this.maxConcurrency) {
        this.active += 1;
        this.maximumActive = Math.max(this.maximumActive, this.active);
        resolve();
      }
      else this.pending.push(resolve);
    });
    try {
      return await work();
    } finally {
      this.active -= 1;
      const next = this.pending.shift();
      if (next) {
        this.active += 1;
        this.maximumActive = Math.max(this.maximumActive, this.active);
        next();
      }
    }
  }

  snapshot(): { active: number; maximumActive: number; pending: number } {
    return { active: this.active, maximumActive: this.maximumActive, pending: this.pending.length };
  }
}

/**
 * Exact-node, epoch-fenced permits. An owner may use non-blocking acquisition
 * while holding a permit (the two-permit handoff), but may never enter a wait
 * queue until it holds none. This is intentionally independent of batch launch
 * capacity; use `RunConcurrencyLimiter` for that concern.
 */
export class CombatReservationManager {
  private readonly permitsByNode = new Map<string, CombatPermit>();
  private readonly permitsByOwner = new Map<string, Map<string, CombatPermit>>();
  private readonly epochsByNode = new Map<string, number>();
  private readonly sharedByNode = new Map<string, SharedAdmission>();
  private readonly entityIdByOwner = new Map<string, string>();
  private readonly engagedOwners = new Set<string>();
  private readonly overlapListeners = new Map<string, (evidence: ControlledOverlapEvidence) => void>();
  private readonly pending: PendingReservation[] = [];
  private readonly now: () => number;
  private readonly permitTtlMs: number;
  private readonly entryTtlMs: number;
  private readonly sharedAdmissionTtlMs: number;
  private readonly sweepTimer: ReturnType<typeof setInterval>;
  private nextId = 0;
  private closed = false;

  constructor(options: CombatReservationManagerOptions = {}) {
    this.now = options.now ?? Date.now;
    this.permitTtlMs = options.permitTtlMs ?? 30_000;
    this.entryTtlMs = options.entryTtlMs ?? 5 * 60_000;
    this.sharedAdmissionTtlMs = options.sharedAdmissionTtlMs ?? 30_000;
    for (const [name, value] of Object.entries({ permitTtlMs: this.permitTtlMs, entryTtlMs: this.entryTtlMs, sharedAdmissionTtlMs: this.sharedAdmissionTtlMs })) {
      if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be positive`);
    }
    this.sweepTimer = setInterval(() => this.sweep(), Math.max(100, Math.min(1_000, Math.floor(this.permitTtlMs / 2))));
    this.sweepTimer.unref?.();
  }

  tryAcquireExclusive(request: ReservationRequest): CombatPermit | null {
    this.assertOpen();
    this.assertRequest(request);
    const existing = this.permitsByNode.get(request.nodeId);
    if (existing?.ownerId === request.ownerId) return { ...existing };
    if (existing || this.sharedByNode.has(request.nodeId)) return null;
    return this.grant(request, this.now() + this.entryTtlMs);
  }

  acquireExclusive(
    request: ReservationRequest,
    options: { signal: AbortSignal; deadlineAt: number },
  ): Promise<CombatPermit> {
    this.assertOpen();
    this.assertRequest(request);
    if (!Number.isFinite(options.deadlineAt) || options.deadlineAt <= this.now()) {
      return Promise.reject(new Error("reservation deadline has already elapsed"));
    }
    const immediate = this.tryAcquireExclusive(request);
    if (immediate) return Promise.resolve(immediate);
    if ((this.permitsByOwner.get(request.ownerId)?.size ?? 0) > 0) {
      return Promise.reject(new Error(`${request.ownerId} cannot queue while holding a combat permit`));
    }
    if (this.pending.some((pending) => pending.ownerId === request.ownerId)) {
      return Promise.reject(new Error(`${request.ownerId} already has a pending reservation request`));
    }
    return new Promise<CombatPermit>((resolve, reject) => {
      const requestId = `reservation-request-${++this.nextId}`;
      const cancel = (): void => this.cancelPending(requestId, new Error("reservation request aborted"));
      if (options.signal.aborted) {
        reject(new Error("reservation request aborted"));
        return;
      }
      options.signal.addEventListener("abort", cancel, { once: true });
      this.pending.push({ ...request, requestId, deadlineAt: options.deadlineAt, signal: options.signal, resolve, reject, abortListener: cancel });
      this.dispatch();
    });
  }

  renew(permit: CombatPermit): CombatPermit {
    const current = this.requireCurrent(permit);
    const renewed = { ...current, expiresAt: this.now() + this.permitTtlMs };
    this.permitsByNode.set(renewed.nodeId, renewed);
    this.permitsByOwner.get(renewed.ownerId)?.set(renewed.permitId, renewed);
    return { ...renewed };
  }

  /** Mark the grant as authoritatively entered; its entry deadline no longer applies. */
  confirmEntry(permit: CombatPermit): CombatPermit {
    const current = this.requireCurrent(permit);
    const entered = { ...current, enterBy: 0 };
    this.permitsByNode.set(entered.nodeId, entered);
    this.permitsByOwner.get(entered.ownerId)?.set(entered.permitId, entered);
    return { ...entered };
  }

  release(permit: CombatPermit, _reason: ReservationReleaseReason): boolean {
    const current = this.permitsByNode.get(permit.nodeId);
    if (!current || !samePermit(current, permit)) return false;
    this.removePermit(current);
    this.dispatch();
    return true;
  }

  admitShared(request: SharedAdmissionRequest): SharedAdmission {
    this.assertOpen();
    if (!request.ownerId || !request.nodeId || !request.trigger) throw new Error("shared admission requires ownerId, nodeId, and trigger");
    const existingShared = this.sharedByNode.get(request.nodeId);
    if (existingShared) {
      if (!existingShared.participantOwnerIds.includes(request.ownerId)) existingShared.participantOwnerIds.push(request.ownerId);
      if (request.purpose && !existingShared.purposes.includes(request.purpose)) existingShared.purposes.push(request.purpose);
      existingShared.participantOwnerIds.sort();
      existingShared.purposes.sort();
      return cloneAdmission(existingShared);
    }
    const exclusive = this.permitsByNode.get(request.nodeId);
    const participants = new Set([request.ownerId]);
    if (exclusive) {
      participants.add(exclusive.ownerId);
      this.removePermit(exclusive);
    }
    const admission: SharedAdmission = {
      admissionId: `shared-admission-${++this.nextId}`,
      nodeId: request.nodeId,
      participantOwnerIds: [...participants].sort(),
      trigger: request.trigger,
      purposes: [...new Set([request.purpose, exclusive?.purpose].filter((purpose): purpose is ReservationPurpose => !!purpose))].sort(),
      admittedAt: this.now(),
      expiresAt: this.now() + (request.ttlMs ?? this.sharedAdmissionTtlMs),
    };
    this.sharedByNode.set(request.nodeId, admission);
    this.dispatch();
    return cloneAdmission(admission);
  }

  leaveShared(admissionId: string, ownerId: string, _reason: string): void {
    for (const [nodeId, admission] of this.sharedByNode) {
      if (admission.admissionId !== admissionId) continue;
      admission.participantOwnerIds = admission.participantOwnerIds.filter((participant) => participant !== ownerId);
      if (admission.participantOwnerIds.length === 0) this.sharedByNode.delete(nodeId);
      return;
    }
  }

  renewShared(admissionId: string, ownerId: string, ttlMs = this.sharedAdmissionTtlMs): SharedAdmission {
    for (const admission of this.sharedByNode.values()) {
      if (admission.admissionId !== admissionId || !admission.participantOwnerIds.includes(ownerId)) continue;
      admission.expiresAt = this.now() + ttlMs;
      return cloneAdmission(admission);
    }
    throw new Error("shared admission is no longer current");
  }

  releaseOwner(ownerId: string, reason: ReservationReleaseReason): { releasedPermitIds: string[]; cancelledRequestIds: string[]; leftAdmissionIds: string[] } {
    const cancelledRequestIds = this.pending.filter((request) => request.ownerId === ownerId).map((request) => request.requestId);
    for (const requestId of cancelledRequestIds) this.cancelPending(requestId, new Error(`reservation request cancelled: ${reason}`));
    const releasedPermitIds = [...(this.permitsByOwner.get(ownerId)?.values() ?? [])].map((permit) => permit.permitId);
    for (const permitId of releasedPermitIds) {
      const permit = this.permitsByOwner.get(ownerId)?.get(permitId);
      if (permit) this.removePermit(permit);
    }
    const leftAdmissionIds: string[] = [];
    for (const admission of this.sharedByNode.values()) {
      if (!admission.participantOwnerIds.includes(ownerId)) continue;
      leftAdmissionIds.push(admission.admissionId);
      this.leaveShared(admission.admissionId, ownerId, reason);
    }
    // Entity/evidence registration belongs to the session lifetime, not an
    // individual permit. A death releases combat immediately but its resumed
    // run must still be observable by the cohort monitor.
    this.engagedOwners.delete(ownerId);
    this.dispatch();
    return { releasedPermitIds, cancelledRequestIds, leftAdmissionIds };
  }

  snapshot(): ReservationSnapshot {
    const nodeIds = new Set([...this.epochsByNode.keys(), ...this.permitsByNode.keys(), ...this.sharedByNode.keys()]);
    const admissionsByNode: Record<string, NodeAdmissionState> = {};
    for (const nodeId of [...nodeIds].sort()) {
      const permit = this.permitsByNode.get(nodeId);
      const shared = this.sharedByNode.get(nodeId);
      admissionsByNode[nodeId] = permit
        ? { kind: "exclusive", permit: { ...permit } }
        : shared
          ? { kind: "shared-degraded", admission: cloneAdmission(shared) }
          : { kind: "vacant", epoch: this.epochsByNode.get(nodeId) ?? 0 };
    }
    return {
      admissionsByNode,
      pending: this.pending.map(({ requestId, ownerId, nodeId, purpose, deadlineAt }) => ({ requestId, ownerId, nodeId, purpose, deadlineAt })),
    };
  }

  owns(ownerId: string, nodeId: string): boolean {
    return this.permitsByNode.get(nodeId)?.ownerId === ownerId;
  }

  ownerOf(nodeId: string): string | null {
    return this.permitsByNode.get(nodeId)?.ownerId ?? null;
  }

  heldNodes(ownerId: string): string[] {
    return [...(this.permitsByOwner.get(ownerId)?.values() ?? [])]
      .map((permit) => permit.nodeId)
      .sort();
  }

  isSharedParticipant(nodeId: string, ownerId: string): boolean {
    return this.sharedByNode.get(nodeId)?.participantOwnerIds.includes(ownerId) ?? false;
  }

  noteEntity(ownerId: string, entityId: string): void {
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

  registerOverlapListener(
    ownerId: string,
    listener: (evidence: ControlledOverlapEvidence) => void,
  ): () => void {
    this.overlapListeners.set(ownerId, listener);
    return () => this.overlapListeners.delete(ownerId);
  }

  reportOverlap(evidence: ControlledOverlapEvidence): void {
    for (const ownerId of new Set(evidence.ownerIds)) this.overlapListeners.get(ownerId)?.(evidence);
  }

  shutdown(reason = "coordinator-shutdown"): void {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.sweepTimer);
    for (const pending of [...this.pending]) this.cancelPending(pending.requestId, new Error(`reservation manager shut down: ${reason}`));
    this.permitsByNode.clear();
    this.permitsByOwner.clear();
    this.sharedByNode.clear();
    this.entityIdByOwner.clear();
    this.engagedOwners.clear();
    this.overlapListeners.clear();
  }

  private grant(request: ReservationRequest, enterBy: number): CombatPermit {
    const grantedAt = this.now();
    const permit: CombatPermit = {
      permitId: `combat-permit-${++this.nextId}`,
      ownerId: request.ownerId,
      nodeId: request.nodeId,
      epoch: (this.epochsByNode.get(request.nodeId) ?? 0) + 1,
      purpose: request.purpose,
      grantedAt,
      enterBy,
      expiresAt: grantedAt + this.permitTtlMs,
    };
    this.epochsByNode.set(permit.nodeId, permit.epoch);
    this.permitsByNode.set(permit.nodeId, permit);
    const permits = this.permitsByOwner.get(permit.ownerId) ?? new Map<string, CombatPermit>();
    permits.set(permit.permitId, permit);
    this.permitsByOwner.set(permit.ownerId, permits);
    return { ...permit };
  }

  private dispatch(): void {
    if (this.closed) return;
    for (const pending of [...this.pending]) {
      if (this.permitsByNode.has(pending.nodeId) || this.sharedByNode.has(pending.nodeId)) continue;
      if ((this.permitsByOwner.get(pending.ownerId)?.size ?? 0) > 0) {
        this.cancelPending(pending.requestId, new Error(`${pending.ownerId} acquired a permit while queued`));
        continue;
      }
      this.removePending(pending);
      pending.resolve(this.grant(pending, pending.deadlineAt));
    }
  }

  private sweep(): void {
    if (this.closed) return;
    const now = this.now();
    for (const pending of [...this.pending]) {
      if (pending.deadlineAt <= now) this.cancelPending(pending.requestId, new Error("reservation request deadline expired"));
    }
    for (const permit of [...this.permitsByNode.values()]) {
      if ((permit.enterBy > 0 && permit.enterBy <= now) || permit.expiresAt <= now) {
        this.release(permit, permit.enterBy > 0 && permit.enterBy <= now ? "entry-deadline-expired" : "heartbeat-expired");
      }
    }
    for (const [nodeId, admission] of this.sharedByNode) {
      if (admission.expiresAt <= now) this.sharedByNode.delete(nodeId);
    }
    this.dispatch();
  }

  private removePermit(permit: CombatPermit): void {
    if (this.permitsByNode.get(permit.nodeId)?.permitId !== permit.permitId) return;
    this.permitsByNode.delete(permit.nodeId);
    const permits = this.permitsByOwner.get(permit.ownerId);
    permits?.delete(permit.permitId);
    if (permits?.size === 0) this.permitsByOwner.delete(permit.ownerId);
  }

  private cancelPending(requestId: string, error: Error): void {
    const pending = this.pending.find((request) => request.requestId === requestId);
    if (!pending) return;
    this.removePending(pending);
    pending.reject(error);
  }

  private removePending(pending: PendingReservation): void {
    const index = this.pending.indexOf(pending);
    if (index >= 0) this.pending.splice(index, 1);
    // `AbortSignal` is a one-shot event target; removing this listener avoids
    // retaining a completed request through a long-lived supervisor signal.
    // The same function reference makes cancellation idempotent.
    pending.signal.removeEventListener("abort", pending.abortListener);
  }

  private requireCurrent(permit: CombatPermit): CombatPermit {
    const current = this.permitsByNode.get(permit.nodeId);
    if (!current || !samePermit(current, permit)) throw new Error("permit is no longer current");
    return current;
  }

  private assertOpen(): void {
    if (this.closed) throw new Error("reservation manager is shut down");
  }

  private assertRequest(request: ReservationRequest): void {
    if (!request.ownerId || !request.nodeId || !request.purpose) throw new Error("reservation requires ownerId, nodeId, and purpose");
  }
}

function samePermit(a: CombatPermit, b: CombatPermit): boolean {
  return a.permitId === b.permitId && a.ownerId === b.ownerId && a.nodeId === b.nodeId && a.epoch === b.epoch;
}

function cloneAdmission(admission: SharedAdmission): SharedAdmission {
  return {
    ...admission,
    participantOwnerIds: [...admission.participantOwnerIds],
    purposes: [...admission.purposes],
  };
}
