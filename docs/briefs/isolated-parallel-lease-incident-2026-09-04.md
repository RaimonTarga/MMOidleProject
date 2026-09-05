# Incident brief: isolated-parallel lease cascade and unsafe transit

**Status: OPEN — found 2026-09-04; no code fix applied in this brief.**

This records the failures observed during the Candidate F T1 validation cohort
and the recommended operating mode for the next canonical batch.

## Executive decision

For the next economy-validation batch, use controlled sequential execution:

```text
--controlled=true --executionMode=sequential --maxConcurrency=1
```

Do not use `isolated-parallel` as the canonical measurement harness until the
lease system has been redesigned and revalidated. The current implementation is
useful as an opt-in concurrency experiment and as an overlap detector, but it
has not earned the role of an isolation guarantee at six concurrent routes.

This is a measurement-quality decision, not a claim that the idea of traffic
control is impossible. A sequential cohort is slower, but it preserves the
meaning of the economy result while the parallel scheduler is being repaired.

## Cohort and evidence

The affected run root is:

`bot/runs/t1-candidate-f-final-2026-09-03/`

The cohort was configured for six intended T1 routes, Candidate F, reward
multiplier 1x, `isolated-parallel`, `maxConcurrency=6`, and a 60-second launch
stagger. Replicates were launched sequentially by the wrapper. At the time of
this investigation, replicate 1 was terminal, replicate 2 had five terminal
summaries, and its Slinger was still running.

Observed outcomes so far:

| Replicate | Route | Outcome | Key result |
|---|---|---|---|
| 1 | Apprentice | timed out | 5,250,960 ms maximum lease wait for Forest dungeon |
| 1 | Conduit | timed out | 4,988,368 ms lease wait for Plains dungeon |
| 1 | Slinger | timed out | six Forest-boss deaths, then impossible T2-skill wait |
| 2 | Conduit | stalled | 11 deaths while repeating the Forest-04 transit hop |
| 2 | Striker, Squire, Apprentice, Spirit | completed | not all were clean; overlap taints still require filtering |
| 2 | Slinger | running at investigation time | same route step 110 as replicate 1 |

Failed and tainted runs are not valid Candidate F economy evidence.

## Finding 1: one failed boss route caused a lease cascade

The first-wave Slinger reached the Forest boss with the intended build, lost all
six attempts, and left the boss at roughly 27–30% HP on each death. The executor
then emitted `boss-step-exhausted` and continued the route. The next authored
step was:

```text
spend the T2 point on reload-heavy
```

Only the second T1 seal grants that point, so this step could never become
true while Forest remained uncleared. The Slinger stayed alive in that
dependent wait until the 180-minute watchdog and retained the Forest dungeon
lease for almost the entire interval. Its lease was released only with
`reason: "run-timed-out"`.

That stale lease blocked the first-wave Apprentice from Forest for about 87.5
minutes. Apprentice was itself still holding the Plains dungeon lease while
waiting, which then blocked Conduit for about 83.1 minutes. Both downstream
runs acquired their dungeon lease only at the edge of the watchdog and were
terminated before meaningful boss progress could occur.

Evidence:

- First-wave [Slinger events](../../bot/runs/t1-candidate-f-final-2026-09-03/replicate-01/batch-2026-09-03T17-33-45-732Z/slinger-t1-intended-2026-09-03T17-37-45-913Z-0bc2b24b/events.jsonl)
- First-wave [Apprentice summary](../../bot/runs/t1-candidate-f-final-2026-09-03/replicate-01/batch-2026-09-03T17-33-45-732Z/apprentice-t1-intended-2026-09-03T17-35-45-920Z-be4856c6/summary.json)
- First-wave [Conduit summary](../../bot/runs/t1-candidate-f-final-2026-09-03/replicate-01/batch-2026-09-03T17-33-45-732Z/conduit-t1-intended-2026-09-03T17-36-45-919Z-8e66ad6a/summary.json)

The underlying design failure is the combination of:

1. A boss-attempt cap that continues into dependent route steps after failure.
2. A dependent `unlockSkill` that waits rather than recording an explicit
   blocked prerequisite.
3. A dungeon lease that remains held until terminal cleanup, even after death
   teleports the player away from the dungeon.
4. Other bots waiting productively while retaining their own current leases,
   which turns one bad route into a chain of long-lived reservations.

## Finding 2: Conduit has a real unsafe transit route

The current world graph confirms that the selected path is:

```text
node-clearing -> node-t1-forest-04 -> node-t1-forest-03
```

`node-t1-forest-04` is a fortified Forest node. The route resolver chooses a
shortest-hop destination and the lease manager reserves the destination node,
but the reservation does not cover or score the intermediate transit nodes.
The travel executor also intentionally avoids fighting inside a node another
controlled bot owns. That is correct for evidence isolation, but dangerous for
survivability when the transit node is hostile.

The second-wave Conduit had only the +1 Plains kit, entered Forest-04, and
cycled between Forest-04 and Clearing six times. It recorded six Forest deaths
and eleven deaths overall before `travel forest T1` timed out at
`node-t1-forest-03`. A historical clean 1x Conduit run reproduced the exact
same `forest-03` travel stall with no taint, so this is not a Candidate F
multiplier problem.

Evidence:

- Current [Conduit summary](../../bot/runs/t1-candidate-f-final-2026-09-03/replicate-02/batch-2026-09-03T20-37-58-790Z/conduit-t1-intended-2026-09-03T20-40-58-970Z-50bd661c/summary.json)
- Current [Conduit events](../../bot/runs/t1-candidate-f-final-2026-09-03/replicate-02/batch-2026-09-03T20-37-58-790Z/conduit-t1-intended-2026-09-03T20-40-58-970Z-50bd661c/events.jsonl)
- Historical [clean Conduit summary](../../bot/runs/economy-probe-1x/batch-2026-08-29T02-05-50-408Z/conduit-t1-intended-2026-08-29T02-54-50-440Z-7fbc4506/summary.json)

This is best classified as a route survivability hazard, not a malformed graph
edge. The route needs either a risk-aware transit plan, enough survivability
before the first Forest crossing, or an explicitly accepted/recorded hazard.

## Finding 3: isolation was not clean at cohort scale

The lease system correctly detected several real overlaps, but detection did
not prevent the underlying shared-world interaction. Examples include:

- First-wave Apprentice and Spirit in `node-t1-swamp-03`.
- Second-wave Conduit and Slinger in `node-t1-plains-04`.

Transit-only co-presence was also common and is not itself a defect. The problem
is that a run can remain logically leased to one node while another route is
physically crossing, respawning, or continuing after a failed prerequisite.
Those states are difficult to reconcile with a simple node-owner model.

The affected runs carry `CONTAMINATED_CONTROLLED_OVERLAP` and must be excluded
from canonical economy analysis even when their progression completed.

## Recommendations

### P0 — next canonical batch

Disable isolated-parallel execution for the next measurement batch. Run the
intended routes sequentially with one active bot. Do not treat the 60-second
stagger as an isolation mechanism; it only spreads connection/startup load.

The existing batch runner already supports this mode, and it creates no
`AreaLeaseManager` in sequential execution. If the wrapper is used, it needs a
mode switch first because the current Candidate F launcher hardcodes
`isolated-parallel`.

### P1 — separate the three jobs currently combined in “leases”

The current system asks one mechanism to provide three different guarantees:

1. **Combat exclusivity:** do not let two controlled bots farm or fight in the
   same node.
2. **Transit safety:** route a bot through a shared world without letting it
   steal aggro or die repeatedly.
3. **Evidence classification:** prove whether a run was clean or contaminated.

I would redesign these as separate layers:

- Keep a short-lived exact-node combat reservation for active farming and boss
  attempts. Renew it with a heartbeat and attach an owner/epoch token.
- Treat transit as a path-planning problem, not as ownership of the destination
  alone. Before walking, inspect the entire path for hostile or controlled
  nodes. Wait, choose an alternate path, or fail the travel step within a
  bounded deadline; never silently accept an unsafe multi-biome crossing.
- Keep overlap detection as passive telemetry. A detected overlap should make a
  run ineligible, but it should not create a second, long-lived scheduler state
  that can deadlock the rest of the cohort.

### P1 — make every failure release and propagate

Regardless of whether the lease system stays, every one of these states should
release active reservations immediately:

- death/respawn;
- route-step failure or timeout;
- boss-attempt exhaustion;
- prerequisite becoming impossible;
- socket disconnect or process abort.

Boss exhaustion should produce a terminal “blocked on Forest boss” result, not a
successful-looking step followed by an impossible skill wait. Dependent steps
should be skipped or marked blocked, and the run should release its reservations
before the rest of the cohort is affected.

### P2 — remove parked-hold deadlocks

If parallel mode is retained, a bot should not hold a combat node for hours
while waiting for another node. Safer choices are:

- park only in an unleased safe hub such as Clearing;
- use a short bounded reservation and abandon/replan after the deadline; or
- serialize only the contested activity while allowing unrelated bots to keep
  progressing.

The current “retain the node while waiting” rule is locally defensible—it
prevents another bot from farming under a parked avatar—but globally expensive:
one failed route can preserve a chain of reservations for most of the watchdog.

### P2 — reintroduce concurrency gradually

After the cleanup and path behavior are changed, validate in this order:

1. one sequential bot, as the canonical control;
2. two isolated bots with disjoint or low-conflict routes;
3. three bots with a short watchdog and a hard lease-wait budget;
4. only then the full six-route cohort.

Each stage should require zero contaminating overlaps, zero stale leases after
death, and no lease wait that consumes a material fraction of the run budget.

## Disposition

For now, treat `isolated-parallel` as **experimental / noncanonical**. Retain
its telemetry because it is valuable for learning where routes collide, but do
not let it gate or invalidate the economy experiment by pretending that node
ownership alone provides clean isolation. The next canonical batch should be
sequential until the above failure paths have tests and a fresh live smoke.
