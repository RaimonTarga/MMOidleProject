# Q2 execution report — actual post-configuration behavior

2026-09-12. Luna operator report for [the Q2 operator packet](bot-balance-q2-operator-packet.md), continuation of [Q1](bot-balance-q1-report.md).
This report records the exact frozen execution and its artifacts. No route,
profile, assertion, gameplay, or harness fixes were made; there were no
retries, cap extensions, balance changes, or downstream experiments.

## Result

The family did not produce a completed Q2 behavior window. The first scheduled
case, Striker, passed its Entry and Sweep/Offensive build verification and
entered q2:sweep:observe, but never emitted that route-step's end event before
the 300,000 ms run ceiling. It did not reach the authored first normal Plains
node until 288,705 ms and then produced only 11,002 ms of farm-purpose combat
samples before the run timed out. The required 60,000 ms eligible observation
was therefore not completed. The Defensive/Expose Weakness build and its
q2:expose:observe window were never reached.

Striker's partial stream contains ordinary Plains kills and two Sweep
activations after reaching the target node. Those are preserved as diagnostic
observations, not treated as a completed-window pass: the packet's runtime
qualification requires a completed 60-second eligible window. Squire reached
only its verified Entry build before the family stop. Apprentice, Slinger,
Spirit, and Conduit were cancelled before start.

The first timeout triggered the packet-defined family stop. The final family
ledger is 1 timed_out, 1 cancelled after worker start, and 4 cancelled before
start. This is not a class-balance, DPS, economy, boss, hazard, or ability
quality result. It is an incomplete observation operation with a useful
transit/target-node diagnostic slice.
The started-run summaries mark combatEvidenceEligible=false and
economyEvidenceEligible=false.

## Frozen manifest and execution record

| Field | Recorded value |
|---|---|
| Experiment ID | 20260912t162628z-striker-campaign-behavior-t2-s |
| Requested and executed revision | 06c0818ae1554c00ed9ab7e5b1cf96e87f000f31 |
| Source tree exported | 84359bcbae11483df1e381694dc435e9e177f83d |
| Immutable image | sha256:1998163184a8411e49af9e882cd3195bdc63efef8b2220c820c5a61a71b00b41 |
| Mode / worker | smoke-isolated / 1 |
| Entry / reward | catalyst-primed / 25x |
| Run ceiling | 300,000 ms |
| Behavior farm timeout / no-progress watchdog | 120,000 ms / 90,000 ms |
| Policy / count / automatic retries | intended / 1 / 0 |
| Supervisor result | completed; first run timed out, second received SIGTERM, four remained unstarted |
| Manifest | [experiment.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/experiment.json) |
| Manifest hash | [experiment.sha256](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/experiment.sha256) — e7edd585df998ff68fdf970c4066d50662ec014f17ecd31c568daa12eeb93a47 |
| Cohort report | [cohort-summary.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/cohort-summary.json) |
| Scheduler state | [state.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/state.json) |
| Supervisor events | [supervisor-events.jsonl](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/supervisor-events.jsonl) |
| Artifact root | C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t162628z-striker-campaign-behavior-t2-s |

The invoking checkout was dirty, but the manifest records
dirtyWorkingTreeIncluded=false. The container image and run artifacts came
from the requested revision, excluding the newer uncommitted monster/combat
changes in the main workspace. Container setup and compilation were outside
the run ceiling.

Both started runs carry the expected noncanonical taints:
SYNTHETIC_TIER_ENTRY and NON_CANONICAL_REWARD_MULTIPLIER. Consequently, no
rate comparison, natural-economy conclusion, or canonical combat result is
admissible from this family.

## Authored build contract

The six routes use the same class frames, Q1 entry equipment/upgrades, and
three authored builds from campaignProfiles.ts. Entry and Sweep retain each
class's original safe movement rules. The Defensive candidate removes
Avoid Hazards as specified, but it was not reached in this family.

| Stage | Requested build | Authored RP target | Q2 observation |
|---|---|---:|---|
| Entry | Expose Weakness + Second Wind; no stance | 20 melee / 22 ranged | Striker observed 20 RP / budget 22; Squire observed 20 RP / budget 22; other four not started |
| Sweep | Sweep + Second Wind; Offensive stance | 20 melee / 22 ranged | Striker observed 20 RP / budget 22; other five not reached |
| Defensive candidate | Expose Weakness + Second Wind; Defensive stance | 19 melee / 21 ranged | No Q2 run reached this stage |

The RP values in the table are targets for the authored profiles. The
per-run evidence below reports only observed phase=verified events and marks
unreached stages as not observed.

## Scheduled run ledger

| # route / frame | Terminal record | Verified stages and deaths | Q2 window status | Artifacts |
|---|---|---|---|---|
| 1. striker / cadence-balanced | timed_out; bot duration 300,623 ms; run exceeded maxRunMs (300000ms) | Entry: RP 20 / budget 22 at [events line 23](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:23). Sweep/Offensive: RP 20 / budget 22 at [line 65](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:65). Defensive: not observed. Deaths: 1 at [line 225](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:225). Treatment validity was valid; isolation grade was isolated. | Sweep window started at [line 67](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:67), had no route-step end, and was cut off by the run ceiling. Expose window not reached. | [summary.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/summary.json) · [events.jsonl](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl) |
| 2. squire / cooldown-heavy | cancelled; worker_received_sigterm; bot duration 8,764 ms | Entry: RP 20 / budget 22 at [events line 23](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/002-squire-campaign-behavior-t2-intended-r01/artifacts/squire-campaign-behavior-t2-intended-2026-09-12T16-35-01-923Z-1b22e46b/events.jsonl:23). Sweep and Defensive: not observed. Deaths: 0. Treatment validity was valid; isolation was isolated. Preparation Expose Weakness activated once at [line 38](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/002-squire-campaign-behavior-t2-intended-r01/artifacts/squire-campaign-behavior-t2-intended-2026-09-12T16-35-01-923Z-1b22e46b/events.jsonl:38); it is excluded from any Q2 window. | No q2:sweep:observe or q2:expose:observe route step started before cancellation. | [summary.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/002-squire-campaign-behavior-t2-intended-r01/artifacts/squire-campaign-behavior-t2-intended-2026-09-12T16-35-01-923Z-1b22e46b/summary.json) · [events.jsonl](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/002-squire-campaign-behavior-t2-intended-r01/artifacts/squire-campaign-behavior-t2-intended-2026-09-12T16-35-01-923Z-1b22e46b/events.jsonl) |
| 3. apprentice / dot-balanced | cancelled; user_cancelled_before_start | No run process, build verification, or death observation. | No Q2 window. | No per-run artifact directory was created; the cancellation is recorded in [state.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/state.json). |
| 4. slinger / reload-heavy | cancelled; user_cancelled_before_start | No run process, build verification, or death observation. | No Q2 window. | No per-run artifact directory was created; the cancellation is recorded in [state.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/state.json). |
| 5. spirit / energy-heavy | cancelled; user_cancelled_before_start | No run process, build verification, or death observation. | No Q2 window. | No per-run artifact directory was created; the cancellation is recorded in [state.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/state.json). |
| 6. conduit / summoner-balanced | cancelled; user_cancelled_before_start | No run process, build verification, or death observation. | No Q2 window. | No per-run artifact directory was created; the cancellation is recorded in [state.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/state.json). |

The squire worker was already starting when the stop request took effect, so
its partial artifacts are retained separately from the four never-started
records. The cohort report's summaryPath is null for that SIGTERM-terminated
worker, but the worker did write a partial summary and event stream.

## Exact observation-window evidence

### Striker q2:sweep:observe

| Boundary or check | Evidence |
|---|---|
| Correct build before start | The phase=verified event at [line 65](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:65) observes Sweep + Second Wind, Offensive attuned/default stance, the five intended Rune rules, and RP total 20 against budget 22. |
| Start | q2:sweep:observe route-step start at 10,665 ms: [line 67](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:67). |
| Intended target | The first authored normal Plains node, node-t2-plains-01, was entered at 288,705 ms: [line 513](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:513). This is 278,040 ms after the window step started. |
| End / terminal cause | No q2:sweep:observe route-step end was emitted. The run ended at 300,623 ms with completion=timed-out: [line 539](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:539). The attempted route-step wall span was 289,958 ms, not a completed eligible duration. |
| Required duration | 60,000 ms of consecutive eligible samples. The exact internal ObservationWindow elapsed value is not emitted. Only 11,002 ms of farm-purpose combat samples (11 samples) are present after arrival at the intended node, from [line 516](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:516) through [line 536](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:536). |
| Build drift | No later build-change event occurs in the 539-line stream after line 65. This is the available drift evidence; the stream has no periodic full-loadout snapshot during the partial window. |

The window's non-overlapping experience activity totals are below. They use
the activity field only; purpose labels such as travel and farm are not added
to these totals.

| Slice | Combat | Movement/travel | Dead | Explicit unavailable | Unobserved |
|---|---:|---:|---:|---:|---:|
| First 60,000 ms after step start, 10,665–70,665 ms | 12,957 ms | 47,043 ms | 0 ms | 0 ms | 0 ms |
| Entire attempted step span, 10,665–300,623 ms | 93,991 ms | 193,050 ms | 2,001 ms | 0 ms | 916 ms tail after the last sample |

The first 60,000 ms are not a valid Q2 observation window: every sample in
that slice carries purpose=travel, the bot was moving through other Plains
nodes, and node-t2-plains-01 had not yet been reached. The 916 ms tail has no
sample and is therefore unavailable/uncounted, not zero activity. There is no
dedicated recovery activity in this telemetry schema. The death is recorded at
[line 225](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:225), dead samples total 2,001 ms, and route resumption is visible at the Sanctuary node-enter [line 229](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:229).

### Counts and opportunity evidence

The following counts are restricted to the attempted q2:sweep:observe span;
the preparation phase is not mixed into them.

- Kills: 14 non-boss kills — [68](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:68), [79](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:79), [114](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:114), [203](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:203), [391](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:391), [418](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:418), [420](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:420), [444](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:444), [449](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:449), [507](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:507), [512](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:512), [521](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:521), [527](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:527), [537](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:537).
- Sweep activations: 2, at [lines 515](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:515) and [528](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:528).
- Expose Weakness activations in the attempted window: 0. The preparation Expose Weakness activation at [line 34](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:34) is outside the interval and is not counted.
- First 60,000 ms: 28 concurrency samples, 6 with attackers > 0 and 22 with zero attackers; maximum attackers 2. Positive samples are linked at [71](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:71), [74](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:74), [77](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:77), [105](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:105), [108](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:108), and [111](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:111). These are transit opportunities, not eligible target-node observations; no cooldown or trigger fields were emitted.
- After node-t2-plains-01 was reached, five concurrency samples were all positive (attackers 4, 4, 3, 2, 2) at [lines 517](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:517), [520](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:520), [525](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:525), [532](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:532), and [535](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:535). The target-node segment also contains three kills at [521](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:521), [527](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:527), and [537](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:537). This is repeated target-node activity, but still not a completed 60-second window.

### Stance and mastery context

- At the Sweep build boundary, line 65 records Offensive as both attuned and
  default stance. There were no stance-switch events in the partial stream.
- The latest authoritative wallet snapshot before the Q2 step is the run-start
  snapshot at [line 2](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:2): global mastery 30 and Plains level 6. Preparation reached Plains level 8 at [line 40](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:40). There is no wallet snapshot exactly at the Q2 step boundary, so global mastery at that exact instant is unavailable rather than inferred.
- The run-end snapshot at [line 538](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t162628z-striker-campaign-behavior-t2-s/runs/001-striker-campaign-behavior-t2-intended-r01/artifacts/striker-campaign-behavior-t2-intended-2026-09-12T16-29-39-824Z-096a4162/events.jsonl:538) records global mastery 36 and Plains level 12. This is run-end context, not an observation-window end.

## Evidence boundary and handoff

Observed and valid for this packet:

- The exact frozen revision, isolated image, synthetic entry, reward mode,
  worker configuration, stop decision, and preserved terminal ledger.
- Striker and Squire entry assertions and their authoritative observed
  Entry-build convergence.
- Striker's authoritative observed Sweep/Offensive convergence before the
  attempted window, with RP 20 against budget 22 and no later recorded build
  mutation.
- Partial ordinary-Plains combat, movement, death, target-node, kill, and
  Sweep-activation telemetry, clearly separated from preparation.

Not established or admissible as a Q2 result:

- No completed 60-second q2:sweep:observe or q2:expose:observe window.
- No Expose Weakness/Defensive behavior observation.
- No six-class comparison, optimized balance, exact DPS, economy rate,
  canonical progression, boss viability, Step Back correctness, hazard
  correctness, custom firing, or Conduit reconstruction.
- No inference that the absent first-60-second Sweep activation is an engine
  defect: those samples were transit combat away from the intended target
  node, and the stream did not emit cooldown/trigger evidence.

The timeout/transit and partial target-node evidence should be returned to
Astra for selection of the next bounded diagnosis or prepared boss-local
experiment. No follow-on was materialized automatically.

## Operator checks

- pnpm bot:preflight: PASS; the command labels itself noncanonical
  infrastructure validation, not balance evidence.
- Immutable container build from the requested revision: PASS.
- pnpm experiment:report: PASS; cohort-summary.json was generated.
- No source or treatment edits, retries, or automatic replicates were made.
- The main checkout's unrelated dirty changes were preserved.
