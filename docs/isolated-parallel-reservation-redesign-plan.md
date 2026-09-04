# Isolated-parallel reservation, transit, and liveness redesign

**Status:** IMPLEMENTATION COMPLETE — deterministic validation passed; staged
live rollout pending, 2026-09-04.

**Source incident:**
[briefs/isolated-parallel-lease-incident-2026-09-04.md](briefs/isolated-parallel-lease-incident-2026-09-04.md).

**Goal:** repair `isolated-parallel` so exclusive node combat is the normal path,
while a separately configured liveness layer guarantees that contention or route
failure produces a useful degraded/partial artifact and prompt cleanup rather than
an hours-long stall.

**Interim operating rule:** canonical economy batches remain sequential:

```text
--controlled=true --executionMode=sequential --maxConcurrency=1
```

`isolated-parallel` remains experimental until the staged validation in section 12
passes. The redesign does not promise that every character can beat every route.
It promises that every run reaches a conclusive terminal state, writes an artifact,
releases coordination state, and disconnects within bounded time.

---

## 1. Locked decisions

1. Strict combat reservations remain the primary mechanism. The fallback is an
   additional layer; it does not replace, bypass, or silently weaken reservations.
2. Combat exclusivity, transit planning, and evidence classification are separate
   responsibilities.
3. A bot must never wait in a reservation queue while retaining a combat
   reservation. This is the core deadlock-prevention invariant.
4. Death, step failure, boss exhaustion, abort, disconnect, and process shutdown
   release active reservations and cancel pending requests immediately.
5. Transit is planned and executed hop by hop over the shared world graph. An
   opaque destination-only `navigateTo` is not a sufficient concurrency plan.
6. If exclusive progress cannot be made inside a bounded budget, the liveness
   layer may explicitly degrade the affected node/activity to shared operation.
   Every participant is informed and the interval is recorded.
7. Concurrency is graded evidence, not a single contaminated/not-contaminated
   boolean. Some concurrency is representative of the live MMO environment.
8. Route completion and isolation quality are orthogonal. A run can complete with
   shared-combat exposure, or end partially with otherwise pristine isolation.
9. Boss exhaustion never flows into an impossible passive wait. Dependent steps
   are skipped; independent diagnostic work may continue.
10. The whole-run watchdog is an emergency backstop. Local deadlines and circuit
    breakers must normally settle the run first.

---

## 2. Scope and non-goals

### In scope

- `bot/src/concurrency/areaLeaseManager.ts`
- `bot/src/concurrency/routeLeaseSession.ts`
- new transit and liveness modules under `bot/src/concurrency/`
- `bot/src/route/executor.ts` and route DSL failure/dependency semantics
- bot telemetry, summaries, reports, batch manifests, and CLI configuration
- the Candidate F wrapper's execution-mode configuration
- deterministic bot-package tests and staged live validation

### Out of scope

- Gameplay-server changes or bot-only gameplay privileges.
- A new socket protocol. Hop-by-hop travel can use the existing
  `player:navigateTo` intent, and all planning inputs are already visible through
  `Observation` plus shared static map data.
- Guaranteeing route victory or hiding a balance wall.
- Treating degraded concurrency as equivalent to a pristine solo economy control.
- Automatically pooling isolated and concurrency-exposed results.
- General player AI or changes to normal browser-client movement.

---

## 3. Current failure map

The present implementation combines several lifetimes inside one owner-level
lease session:

- `AreaLeaseManager.acquire()` removes the owner from the progress set while
  queued but deliberately retains its existing node leases.
- `RouteLeaseSession.acquireActivity()` can productively farm a retained node
  while waiting for its next node.
- `ensureAt()` reserves only the destination, while the server chooses the
  intermediate shortest path.
- death changes the derived `engaged` flag but does not release the held area;
- `attemptBoss` records `boss-step-exhausted` and returns normally;
- the following `unlockSkill` may wait up to the generic six-hour step timeout;
- terminal cleanup is therefore the first guaranteed release point;
- `RunSummary.run.canonical` and economy eligibility are derived mostly from
  taints and do not require a successfully completed route.

The Candidate F cascade was a valid consequence of these rules, not a lease
manager double-grant.

---

## 4. Target component boundaries

```text
BatchCoordinator
  ├─ RunConcurrencyLimiter       launch/active-run capacity only
  ├─ CombatReservationManager   exact-node exclusive/shared admission
  └─ CohortEvidenceMonitor      passive overlap/interaction intervals

RouteCoordinationSession
  ├─ TransitPlanner             pure path generation and risk classification
  ├─ TransitExecutor            hop-by-hop handoff and crossing
  ├─ CombatReservationScope     farm/boss/protected-crossing lifetime
  └─ DegradationController      bounded recovery and last-resort shared fallback

RouteExecutor
  └─ structured step outcomes, prerequisites, and partial completion
```

The manager must not decide routes or evidence validity. The transit planner must
not own indefinite reservations. The evidence monitor must never grant, extend, or
release a reservation.

Existing filenames may be retained during the first implementation phase to limit
churn, but their contracts should move toward these responsibilities. Rename only
after behavior tests pass.

---

## 5. Combat reservation model

### 5.1 Types

```ts
type ReservationPurpose = "farm" | "boss" | "protected-transit";

interface CombatPermit {
  permitId: string;
  ownerId: string;
  nodeId: string;
  epoch: number;
  purpose: ReservationPurpose;
  grantedAt: number;
  enterBy: number;
  expiresAt: number;
}

interface SharedAdmission {
  admissionId: string;
  nodeId: string;
  participantOwnerIds: string[];
  trigger: DegradationTrigger;
  admittedAt: number;
  expiresAt: number;
}

type NodeAdmissionState =
  | { kind: "vacant"; epoch: number }
  | { kind: "exclusive"; permit: CombatPermit }
  | { kind: "shared-degraded"; admission: SharedAdmission };
```

Every exclusive grant increments the node epoch. `renew` and `release` require the
exact `(permitId, ownerId, nodeId, epoch)` tuple. A delayed `finally` from an old
scope must be unable to release a newer owner's permit.

### 5.2 Manager API

```ts
interface CombatReservationManager {
  tryAcquireExclusive(request: ReservationRequest): CombatPermit | null;
  acquireExclusive(
    request: ReservationRequest,
    options: { signal: AbortSignal; deadlineAt: number },
  ): Promise<CombatPermit>;
  renew(permit: CombatPermit): CombatPermit;
  release(permit: CombatPermit, reason: ReservationReleaseReason): boolean;
  admitShared(request: SharedAdmissionRequest): SharedAdmission;
  leaveShared(admissionId: string, ownerId: string, reason: string): void;
  releaseOwner(ownerId: string, reason: string): ReleaseReport;
  snapshot(): ReservationSnapshot;
  shutdown(reason: string): void;
}
```

`acquireExclusive` rejects immediately if the owner holds an active permit.
Duplicate requests should not chain mutable promise callbacks; give every request
an ID and explicit cancellation lifecycle.

`maxProgressing` does not belong in this manager. Batch/run concurrency is a
separate semaphore. The reservation manager arbitrates node admission only.

### 5.3 Permit lifecycle

```text
vacant
  → reserved-entering     exclusive grant, entry deadline active
  → exclusive-active     owner observed alive in node for declared activity
  → quiescing             combat stopped; departure deadline active
  → released             authoritative node exit observed
```

From any state:

```text
death / abort / disconnect / step failure / TTL expiry → released
```

Suggested initial timings, configurable and validated in live smoke tests:

- heartbeat interval: 5 seconds;
- permit TTL: 20–30 seconds;
- departure grace: 15 seconds;
- entry deadline: derived from planned hop count, capped at 5 minutes;
- exclusive queue budget: 90–120 seconds or 5% of remaining run time,
  whichever is smaller.

TTL expiry is crash protection. Normal interruption paths release synchronously.

### 5.4 Scoped use

Farm, boss, and protected transit use `try/finally` ownership:

```ts
await session.withCombatReservation(request, async (permit) => {
  await transit.enterReservedNode(permit);
  await performActivity();
});
```

`releaseAll()` remains a supervisor/coordinator safety net. Ordinary correctness
must not depend on reaching run-terminal cleanup.

---

## 6. No-hold-and-wait handoff protocol

The invariant is precise:

> An owner with an active combat permit may make non-blocking acquisition attempts,
> but may not join or remain in a wait queue.

Fast path:

```text
tryAcquire(next node) succeeds
→ stop current combat
→ begin next-hop travel
→ release old permit on observed exit
→ bounded two-permit handoff ends
```

Contended path:

```text
tryAcquire(next node) fails
→ do not enqueue while holding
→ choose an immediately available alternate hop or begin safe evacuation
→ release old permit on observed exit
→ queue only after holding no permit (normally from Clearing)
```

If every safe exit is contended, the degradation controller activates immediately
rather than constructing a wait cycle. It can request shared admission for the
crossing or current node, whichever makes forward progress.

Delete the old parked-hold breaker after the invariant is enforced and covered by
tests. It is recovery for a state the new design forbids.

---

## 7. Transit planning and execution

### 7.1 Pure planner

Add `bot/src/concurrency/transitPlanner.ts`. It receives only:

- current and candidate destination node IDs;
- shared `worldNodeExits` and node metadata;
- a read-only reservation snapshot;
- player-visible build/progression state;
- run-local transit history, including deaths on edges;
- the configured liveness policy.

It returns an auditable plan:

```ts
interface TransitPlan {
  fromNodeId: string;
  destinationNodeId: string;
  hops: TransitHop[];
  totalCost: number;
  rejectedAlternatives: Array<{ destinationNodeId: string; reason: string }>;
}

interface TransitHop {
  fromNodeId: string;
  toNodeId: string;
  classification:
    | "safe-pass"
    | "protected-crossing"
    | "temporarily-blocked"
    | "unsafe";
  reasons: string[];
}
```

Use weighted Dijkstra, or an equivalently deterministic weighted graph search,
instead of hop-count-only BFS. Initial costs:

- Clearing/tutorial: minimal;
- foreign exclusive reservation: unavailable for ordinary traversal;
- hostile intermediate combat node: `protected-crossing` cost;
- an edge that already killed this bot during the step: very high/unsafe;
- schedule-dependent destination or modifier deviation: explicit evidence cost;
- impossible/unreachable nodes: rejected.

The first implementation need not invent a fragile numerical survivability model.
Classify every hostile intermediate node as a protected crossing. Observed data may
later relax known survivable crossings without changing the interface.

### 7.2 Hop-by-hop executor

Add `bot/src/concurrency/transitExecutor.ts`. It issues
`navigateTo(nextHopNodeId)`, confirms authoritative arrival, and then advances.
This ensures the planner's path is the path actually requested.

For a protected crossing:

1. acquire the exact node before entry;
2. enter it;
3. allow ordinary autocombat/fight-back if attacked;
4. continue toward the next hop;
5. release immediately after observed exit;
6. attribute kills, rewards, deaths, and time to a transit span.

Never reserve the entire path atomically. Large corridor reservations recreate
deadlocks and excessive serialization.

### 7.3 Bounded transit recovery

Initial policy:

- one death per planned leg;
- one replan after a death or invalidated next hop;
- then shared-admission fallback if allowed;
- if traversal remains impossible, return a blocked travel outcome rather than
  retrying until the run watchdog.

Required regression fixture:

```text
node-clearing → node-t1-forest-04 (Fortified) → node-t1-forest-03
```

The planner must expose Forest-04 as an intermediate hostile crossing. Conduit
must obtain a protected crossing, choose a viable alternate path, degrade
explicitly to shared transit, or terminate that step as blocked. It must not loop
through eleven deaths.

---

## 8. Degradation controller: liveness above isolation

The degradation controller wraps reservation acquisition and transit. It is not
called during successful exclusive operation.

### 8.1 Policy

```ts
type ContentionPolicy = "strict-isolation" | "degrade-to-shared";

interface LivenessPolicy {
  contentionPolicy: ContentionPolicy;
  exclusiveWaitMs: number;
  transitReplans: number;
  transitDeathBudgetPerLeg: number;
  totalCoordinationWaitMs: number;
  sharedAdmissionTtlMs: number;
  stepDeadlineMs: number;
}
```

- Sequential execution does not instantiate coordination machinery.
- Experimental `isolated-parallel` defaults to `degrade-to-shared`, matching the
  chosen priority of keeping the testing environment moving.
- `strict-isolation` still uses bounded waits. On exhaustion it produces a partial
  run and cleanup, never an unbounded stall.
- A batch must use one contention policy. Mixed strict/degrading participants are
  forbidden because a degrading bot must not surprise a strict owner.

### 8.2 Degradation ladder

```text
exclusive destination unavailable
→ try comparable destination
→ try viable alternate path
→ release held activity and wait briefly from Clearing
→ cancel exclusive request at its deadline
→ convert affected node/activity to explicit shared admission
→ continue and record the degraded interval
```

`admitShared` changes coordinator state from:

```text
exclusive(owner A)
```

to:

```text
shared-degraded(participants A, B, ...)
```

Every current and newly admitted participant receives the shared-admission event.
When participants leave, the admission closes; it must not silently convert back
to an exclusive permit with an old epoch.

### 8.3 What fallback cannot repair

Concurrency can repair contention and unsafe passage. It cannot make an impossible
progression prerequisite true. Boss exhaustion follows the partial-route flow in
section 9 rather than repeatedly escalating shared admission.

---

## 9. Route outcomes and dependency propagation

### 9.1 Orthogonal run result dimensions

Do not create combinations such as `completed-degraded-partial`. Record two axes:

```ts
type RouteCompletion = "completed" | "partial" | "failed" | "aborted";

type IsolationGrade =
  | "isolated"
  | "ambient-concurrency"
  | "shared-combat"
  | "outcome-interference"
  | "harness-invalid";
```

- `isolated`: no relevant controlled-player interaction;
- `ambient-concurrency`: co-presence/transit without observed combat interaction;
- `shared-combat`: multiple controlled players deliberately fought in one node;
- `outcome-interference`: shared boss state, assisted clear, aggro displacement,
  or another observed interaction changed progression attribution;
- `harness-invalid`: corrupt/missing telemetry or cleanup/coordination failure.

### 9.2 Structured step outcomes

```ts
type StepOutcome =
  | { status: "completed" }
  | { status: "skipped"; reason: string }
  | { status: "blocked"; reason: BlockReason; failedFact?: string }
  | { status: "failed"; reason: string };
```

Add an optional prerequisite to `RouteStep`:

```ts
requires?: Condition;
```

The executor tracks permanently failed facts using stable keys such as
`bossCleared:forest:1`. Before executing a step:

1. execute when `requires` is currently true;
2. skip immediately when it depends on a permanently failed fact;
3. otherwise apply the step's own bounded recovery logic;
4. never use the generic multi-hour wait for a mutation prerequisite.

Static route validation should require progression-sensitive mutations to declare
their prerequisite when an earlier capped step produces it.

### 9.3 Boss exhaustion

After the final attempt:

```text
stop combat
→ release dungeon permit
→ emit boss-step-exhausted with nextAction="skip-dependent"
→ record failed fact bossCleared:<biome>:<tier>
→ mark the route partial
→ continue independent steps
```

For the Forest frame unlock, author:

```ts
{
  type: "unlockSkill",
  skillId: frameId,
  requires: { type: "bossCleared", biomeGroup: "forest", tier: 1 },
}
```

The current unconditional `<biome>-boss-cleared` route milestone must gain the
same prerequisite or be renamed to a neutral checkpoint. A failed boss must not
produce a cleared milestone.

### 9.4 Local circuit breakers

Every operation awaiting external state needs a local deadline and exhaustion
action:

| Operation | On deadline |
|---|---|
| exclusive acquisition | degrade or return partial |
| travel | replan, degrade, then block |
| boss phase | record attempt outcome; enforce attempt cap |
| mutation acknowledgement | retry boundedly, then fail step |
| prerequisite | skip/block immediately when permanently impossible |
| socket resync | fail run and invoke supervisor cleanup |

Remove `DEFAULT_STEP_TIMEOUT_MS = 6 hours` as a meaningful control path. A shorter
per-step ceiling may remain as a last local guard, but each known step type must
settle through its own policy first.

---

## 10. Evidence and telemetry

### 10.1 Passive cohort evidence monitor

Move overlap classification out of lease-owner observation and into a coordinator
monitor. It may consume each session's observed node, entity ID, alive state,
authoritative `auto` state, and reservation snapshot, but it must not mutate
reservation state.

Record deduplicated intervals:

```ts
interface ConcurrencyInterval {
  nodeId: string;
  participantOwnerIds: string[];
  startedAtMs: number;
  endedAtMs: number;
  classification:
    | "transit-co-presence"
    | "shared-combat"
    | "foreign-combat-in-exclusive-node"
    | "shared-boss-state";
}
```

The grade is sticky upward: an `outcome-interference` interval cannot later be
downgraded because the other player left.

### 10.2 Fallback events

```ts
interface CoordinationFallback {
  trigger:
    | "exclusive-wait-budget"
    | "unsafe-transit"
    | "transit-death-budget"
    | "reservation-expired"
    | "step-deadline";
  action:
    | "alternate-node"
    | "replan"
    | "shared-admission"
    | "skip-dependent"
    | "partial-stop";
  nodeId?: string;
  startedAtMs: number;
  endedAtMs: number;
  affectedStepIndexes: number[];
}
```

Reservation events additionally carry `permitId`, epoch, purpose,
deadline/expiry, and structured release reason. Transit-plan events record the
selected hops and rejected alternatives.

### 10.3 Evidence eligibility

Replace the current single `canonical` interpretation with explicit fields:

```ts
soloBaselineEligible: boolean;
concurrencyCohortEligible: boolean;
economyEvidenceEligible: boolean;
combatEvidenceEligible: boolean;
```

Minimum rules:

- solo baseline requires completed route, grade `isolated`, no unsafe override,
  no forced expiry, and the expected route/node profile;
- concurrency cohorts may accept higher grades according to their declared
  research question;
- a partial run remains eligible for explicitly scoped observations occurring
  before its failed prerequisite, not for full-route completion statistics;
- harness-invalid runs are excluded from gameplay conclusions;
- degraded and pristine results are never silently pooled.

Keep the legacy contamination tag for schema compatibility during migration, but
derive it from the new grade and mark it deprecated.

---

## 11. Supervisor and cleanup guarantee

`runBot` needs a supervisor independent of `RouteExecutor`. It owns one
`AbortController` used by reservation, transit, mutation, and route-step waits.

On a fatal local deadline, socket failure, signal, or whole-run watchdog:

```text
abort pending awaits
→ stop auto-combat and traversal when connected
→ release all exclusive/shared admissions
→ write the best available partial/failed artifact
→ disconnect the bot
→ mark its manifest entry terminal
```

Cleanup is idempotent. `batch.ts` keeps its outer `finally` release as a second
line of defense. Coordinator shutdown rejects all waiters and clears admissions.

The manifest must not retain `running` after the supervisor settles. A run unable
to write its own summary becomes `failed_harness` with a coordinator-generated
terminal reason.

---

## 12. Implementation sequence

Each phase must be independently reviewable and leave sequential mode working.

### Phase 0 — operational guardrail

- Parameterize `scripts/run-t1-candidate-f.ps1` with execution mode,
  `maxConcurrency`, and stagger.
- Default it to sequential/1/no stagger.
- Validate incompatible combinations through the same rules as `batch.ts`.
- Update `bot/README.md` to call existing isolated-parallel experimental.

### Phase 1 — typed permits and cancellation

- Introduce permit IDs, epochs, TTL, entry deadlines, renew, and exact release.
- Give each pending request an ID and `AbortSignal`.
- Enforce no queued wait while holding an active permit.
- Separate the run-concurrency semaphore from node admission.
- Retain adapters for existing session call sites until Phase 3.

### Phase 2 — interruption and scoped ownership

- Create scoped farm/boss/protected-transit helpers.
- Wire immediate release/cancellation to death, step failure, abort, disconnect,
  and shutdown.
- Make cleanup idempotent and preserve batch-level safety cleanup.
- Remove productive waiting and the parked-hold breaker.

### Phase 3 — transit planner/executor

- Add the pure weighted planner and hop classifications.
- Execute navigation one hop at a time.
- Protect hostile intermediate crossings.
- Add per-leg death budget and one-replan behavior.
- Verify the Forest-04 Conduit fixture.

### Phase 4 — route failure propagation

- Add `requires`, structured `StepOutcome`, and failed-fact tracking.
- Change boss exhaustion to release and return `blocked`.
- Annotate the T1 frame unlock and boss-cleared milestones.
- Replace long passive mutation waits with immediate/bounded decisions.
- Emit partial route summaries.

### Phase 5 — degradation layer

- Add contention/liveness configuration and CLI validation.
- Implement the degradation ladder and explicit shared admission.
- Notify and grade every participant in a shared interval.
- Enforce a single contention policy per batch.

### Phase 6 — evidence schema and reports

- Add route completion, isolation grade, fallback records, reservation details,
  transit plans, and explicit eligibility fields.
- Update summary builder, dashboard, batch manifest, and report consumers.
- Bump `BOT_JSONL_SCHEMA_VERSION` for incompatible event changes.
- Preserve/deprecate old lease fields for one schema version where practical.

### Phase 7 — remove compatibility machinery

- Remove owner-lifetime lease APIs, productive waits, parked-hold breaking, and
  destination-only travel gating after all call sites use the new scopes.
- Rename manager/session files if desired.
- Rewrite the controlled-concurrency section of `bot/README.md` as current state.

---

## 13. Deterministic test matrix

Tests remain plain `tsx` scripts and must run without Postgres or Redis.

### Reservation manager

1. FIFO exclusivity for one node.
2. Independent nodes do not head-of-line block each other.
3. Epoch N release cannot release epoch N+1.
4. Aborting a pending request removes it and rejects once.
5. An owner cannot enqueue while holding a permit.
6. Entry-deadline and heartbeat expiry release exactly once.
7. Death/disconnect/shutdown leave no permits, admissions, or waiters.
8. Shared conversion notifies the exclusive owner and requester.
9. Shared departure closes or shrinks admission deterministically.
10. Mixed strict/degrading policy is rejected at batch construction.

### Coordination session and transit

1. Old node remains protected until authoritative exit.
2. Immediate next-hop acquisition performs a bounded two-permit handoff.
3. Contended next hop never creates hold-and-wait.
4. Clearing waits hold no permit and have combat disabled.
5. Death during farm, boss, entry, and crossing releases immediately.
6. Forest-03 planning exposes Forest-04 as a protected intermediate hop.
7. A foreign exclusive hop is avoided when an alternate exists.
8. No safe alternate triggers shared fallback after the budget.
9. First transit death replans; next exhaustion blocks instead of looping.
10. Two bots crossing in opposite directions terminate without deadlock.

### Route executor

1. Six failed Forest boss attempts release the dungeon.
2. The dependent T2 frame unlock is skipped without waiting.
3. Independent later diagnostic steps still run.
4. A failed boss never emits a boss-cleared milestone.
5. Partial route state reaches the summary and manifest.
6. Every wait site accepts the supervisor abort signal.
7. No known step relies on the global six-hour timeout for ordinary control flow.

### Evidence and summaries

1. Transit co-presence produces `ambient-concurrency` only.
2. Deliberate shared fighting produces `shared-combat` for all participants.
3. Shared boss state produces `outcome-interference`.
4. Fallback intervals are deduplicated and have terminal timestamps.
5. A partial run is not solo-baseline eligible.
6. A completed shared run is concurrency-cohort eligible but not solo eligible.
7. Forced expiry or cleanup failure produces `harness-invalid`.
8. Sequential clean completion remains eligible under the new schema.

Run during implementation:

```bash
pnpm --filter @mmo-idle/bot exec tsx --conditions=development src/concurrency/areaLeaseManager.test.ts
pnpm --filter @mmo-idle/bot exec tsx --conditions=development src/concurrency/routeLeaseSession.test.ts
pnpm --filter @mmo-idle/bot exec tsx --conditions=development src/harness.test.ts
pnpm typecheck
pnpm test
```

---

## 14. Live rollout gates

### Stage A — sequential control

- Six intended routes, one at a time.
- No regression in route results or telemetry.
- Every run terminal and no connected bot left behind.

### Stage B — two low-conflict bots

- No stale permit after death or exit.
- Transit plans match requested hops.
- No forced expiry.

### Stage C — two deliberately contending bots

- Exercise bounded exclusive wait and shared degradation.
- Both artifacts record the same shared interval and participants.
- Both runs settle without watchdog intervention.

### Stage D — three bots with injected failure shapes

- Boss exhaustion, transit death, and pending-request abort.
- Zero hold-and-wait states.
- Every run completed, partial, failed, or aborted before its global watchdog.

### Stage E — full six-route cohort

- Repeat at least twice before reconsidering canonical status.
- Zero stale reservations after death/disconnect.
- Zero manifest entries stranded as running.
- Zero global-watchdog terminations caused by known coordination paths.
- All concurrency/fallback intervals reconcile across participants.

Even after Stage E, pristine sequential runs remain the economy control. Parallel
runs may become an explicitly named concurrency cohort. Whether isolated parallel
can also qualify as a solo-equivalent baseline is a later evidence decision, not
an assumption embedded in the scheduler.

---

## 15. Acceptance criteria

The redesign is complete when all of the following hold:

- one failed route cannot retain a node needed by another route;
- no queued owner holds a combat permit;
- all ownership is permit/epoch fenced and locally time-bounded;
- death and boss exhaustion release before the next route decision;
- the Conduit Forest-04 path is planned explicitly and cannot death-loop;
- exhausted prerequisites become structured skips/partial results;
- exclusive contention degrades visibly when policy permits;
- every participant in shared activity receives matching evidence;
- completion and isolation quality are reported independently;
- failed/partial/degraded artifacts remain useful but are not silently pooled with
  pristine controls;
- the run supervisor writes a terminal artifact and cleans the bot;
- sequential execution remains unchanged and is still the canonical control;
- deterministic tests and staged live rollout pass.

## 16. Implementation handoff summary

Start with Phase 0 and Phase 1. Do not begin by patching another individual release
call into `executor.ts`; that leaves the owner-lifetime model intact. Establish
typed, cancellable, epoch-fenced permits and the no-hold-and-wait invariant first.
Then migrate activity scopes, transit, route outcomes, degradation, and telemetry
in that order. Preserve the incident artifacts as regression evidence and do not
modify gameplay-server behavior to make the harness pass.
