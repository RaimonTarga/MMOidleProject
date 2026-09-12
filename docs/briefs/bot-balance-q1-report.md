# Q1 execution report — Plains build-transition readiness

2026-09-12. Luna operator report for [the Q1 operator packet](bot-balance-q1-operator-packet.md).
This report records the frozen execution and its artifacts. No route, profile,
assertion, gameplay, or harness fixes were made; no reruns or balance proposals
were made.

## Result

The six scheduled readiness cases completed sequentially in the authored order:
6/6 completed, 6/6 treatment-valid and isolated, 14/14 route steps per run,
and 3/3 named build stages verified per run. There were no queued cancellations,
automatic retries, deaths, rejected build edits, assertion failures, timeouts,
disconnects, or emitted failure events.

This proves the acquisition/configuration route under the frozen prepared
revision. It does not prove a class comparison, boss viability, economy pacing,
or balance result. Every run is noncanonical because it uses synthetic T2 entry
state and a 25x reward multiplier; the summaries mark both
combatEvidenceEligible=false and economyEvidenceEligible=false.

The accelerated acquisition boundary was reached in every case: the second
farm step, after the Plains farm build was installed, lasted 0–1 ms. Therefore
the Plains farm build is configuration-verified but its combat behavior is
untested in all six runs. The boss configuration was also endpoint-only; every
run had 0 boss attempts and 0 victories.

## Frozen manifest and execution record

| Field | Recorded value |
|---|---|
| Experiment ID | 20260912t154251z-striker-campaign-readiness-t2 |
| Requested and executed revision | 1d3c710feacb530b731af33d33af63616a49dd25 |
| Source tree exported | 318d3f8470b86c61da7ed54dd53fa898070bf38e |
| Image | sha256:30f276fadeedb21e679eda7742045d69e55c6662f2b6ba4b4d555c58390457ea |
| Mode / worker | smoke-isolated / 1 |
| Economy / reward | catalyst-primed / 25x |
| Run ceiling | 300,000 ms |
| Policies / count / retries | intended / 1 / 0 |
| Supervisor result | completed; six run-terminal events, no cancellation event |
| Manifest | [experiment.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/experiment.json) |
| Manifest hash | [experiment.sha256](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/experiment.sha256) — ca4ac44c2de103cf5329e1ffeab3dc493d429380df2017605afa557cedcb560e |
| Cohort report | [cohort-summary.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/cohort-summary.json) |
| Scheduler state | [state.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/state.json) |
| Supervisor events | [supervisor-events.jsonl](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/supervisor-events.jsonl) |
| Artifact root | C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t154251z-striker-campaign-readiness-t2 |

The invoking checkout was dirty, but the runner recorded
dirtyWorkingTreeIncluded=false; the image and all run artifacts came from the
requested revision. Image/container setup time is separate from the run timing
below.

## Authored build contract and observed reconciliation

| Stage | Abilities | Stance | RP target |
|---|---|---|---:|
| Entry | Expose Weakness, Second Wind | none | 20 melee / 22 ranged |
| Plains farm | Sweep, Second Wind | Offensive | 20 melee / 22 ranged |
| Boss configuration | Expose Weakness, Second Wind | Defensive | 19 melee / 21 ranged |

Each run began from its exact generated T2 entry profile at T2 Sanctuary, with
the entry frame/gear assertions and the no-tier-3 assertion passing. The
entry, Plains farm, and boss-candidate configureBuild events each ended in
phase=verified, with the requested ordered abilities, stance selection, Rune
rules, and no Rites observed. The boss candidate dropped always → avoid-hazards
as specified. Melee routes used in-combat → chase-enemy; ranged routes used
in-combat → orbit.

The RP values below are the observed totals at each verified stage. B is the
live RP budget at that same event; Spirit's budget increased from 22 to 23 as
mastery advanced.

## Scheduled run ledger

Timing tuple order is prep → first Plains node / transit / farm fight /
defensive-stance resource wait / dead-recovery / build mutation, all in ms.
Prep is run start through the first Plains node-enter; transit is the
summary's biome travelMs; farm fight and dead-recovery are the summary
telemetry slices; resource wait is the paired blocked-on-resource event
duration for defensive stance; build mutation is the sum of the three
configureBuild route-step durations. These are independent slices and are
not intended to sum to the wall-clock duration.

| # route / frame | Scheduled outcome and endpoint | Three-stage verification / RP (B) | Attained mastery | Timing tuple; failures | Observed behavior | Untested behavior and artifacts |
|---|---|---|---|---|---|---|
| 1. striker / cadence-balanced | 001-striker-campaign-readiness-t2-intended-r01; completed / bot_completed; 14/14; 18,148 ms; deaths 0 | [entry](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/001-striker-campaign-readiness-t2-intended-r01/artifacts/striker-campaign-readiness-t2-intended-2026-09-12T15-46-38-086Z-553b61e5/events.jsonl:23), [farm](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/001-striker-campaign-readiness-t2-intended-r01/artifacts/striker-campaign-readiness-t2-intended-2026-09-12T15-46-38-086Z-553b61e5/events.jsonl:72), [boss](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/001-striker-campaign-readiness-t2-intended-r01/artifacts/striker-campaign-readiness-t2-intended-2026-09-12T15-46-38-086Z-553b61e5/events.jsonl:90); RP 20 / 20 / 19 (B 22 / 22 / 22) | GM 33; Plains 9; 2 kills | 1,584 / 0 / 14,003 / 0 / 0 / 5,529; rejected 0; timeout no | Expose Weakness ×1; Second Wind ×1 | Farm step after farm build: 1 ms; no boss, stance-switch, hazard-escape, or Step Back behavior. [summary](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/001-striker-campaign-readiness-t2-intended-r01/artifacts/striker-campaign-readiness-t2-intended-2026-09-12T15-46-38-086Z-553b61e5/summary.json) · [events](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/001-striker-campaign-readiness-t2-intended-r01/artifacts/striker-campaign-readiness-t2-intended-2026-09-12T15-46-38-086Z-553b61e5/events.jsonl) |
| 2. squire / cooldown-heavy | 002-squire-campaign-readiness-t2-intended-r01; completed / bot_completed; 14/14; 32,196 ms; deaths 0 | [entry](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/002-squire-campaign-readiness-t2-intended-r01/artifacts/squire-campaign-readiness-t2-intended-2026-09-12T15-47-16-053Z-feb47bd3/events.jsonl:23), [farm](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/002-squire-campaign-readiness-t2-intended-r01/artifacts/squire-campaign-readiness-t2-intended-2026-09-12T15-47-16-053Z-feb47bd3/events.jsonl:102), [boss](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/002-squire-campaign-readiness-t2-intended-r01/artifacts/squire-campaign-readiness-t2-intended-2026-09-12T15-47-16-053Z-feb47bd3/events.jsonl:119); RP 20 / 20 / 19 (B 22 / 22 / 22) | GM 33; Plains 9; 3 kills | 1,595 / 18,000 / 17,593 / 18,529 / 0 / 5,539; rejected 0; timeout no | Expose Weakness ×1 | Farm step after farm build: 1 ms; no boss, stance-switch, hazard-escape, or Step Back behavior. [summary](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/002-squire-campaign-readiness-t2-intended-r01/artifacts/squire-campaign-readiness-t2-intended-2026-09-12T15-47-16-053Z-feb47bd3/summary.json) · [events](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/002-squire-campaign-readiness-t2-intended-r01/artifacts/squire-campaign-readiness-t2-intended-2026-09-12T15-47-16-053Z-feb47bd3/events.jsonl) |
| 3. apprentice / dot-balanced | 003-apprentice-campaign-readiness-t2-intended-r01; completed / bot_completed; 14/14; 27,672 ms; deaths 0 | [entry](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/003-apprentice-campaign-readiness-t2-intended-r01/artifacts/apprentice-campaign-readiness-t2-intended-2026-09-12T15-48-07-309Z-f81b99de/events.jsonl:23), [farm](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/003-apprentice-campaign-readiness-t2-intended-r01/artifacts/apprentice-campaign-readiness-t2-intended-2026-09-12T15-48-07-309Z-f81b99de/events.jsonl:99), [boss](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/003-apprentice-campaign-readiness-t2-intended-r01/artifacts/apprentice-campaign-readiness-t2-intended-2026-09-12T15-48-07-309Z-f81b99de/events.jsonl:116); RP 22 / 22 / 21 (B 22 / 22 / 22) | GM 34; Plains 10; 4 kills | 1,590 / 13,002 / 15,005 / 13,019 / 0 / 5,523; rejected 0; timeout no | Expose Weakness ×1 | Farm step after farm build: 0 ms; no boss, stance-switch, hazard-escape, or Step Back behavior. Apprentice Sweep secondary/DoT combat is untested. [summary](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/003-apprentice-campaign-readiness-t2-intended-r01/artifacts/apprentice-campaign-readiness-t2-intended-2026-09-12T15-48-07-309Z-f81b99de/summary.json) · [events](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/003-apprentice-campaign-readiness-t2-intended-r01/artifacts/apprentice-campaign-readiness-t2-intended-2026-09-12T15-48-07-309Z-f81b99de/events.jsonl) |
| 4. slinger / reload-heavy | 004-slinger-campaign-readiness-t2-intended-r01; completed / bot_completed; 14/14; 31,230 ms; deaths 0 | [entry](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/004-slinger-campaign-readiness-t2-intended-r01/artifacts/slinger-campaign-readiness-t2-intended-2026-09-12T15-48-58-045Z-d7afc553/events.jsonl:23), [farm](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/004-slinger-campaign-readiness-t2-intended-r01/artifacts/slinger-campaign-readiness-t2-intended-2026-09-12T15-48-58-045Z-d7afc553/events.jsonl:107), [boss](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/004-slinger-campaign-readiness-t2-intended-r01/artifacts/slinger-campaign-readiness-t2-intended-2026-09-12T15-48-58-045Z-d7afc553/events.jsonl:123); RP 22 / 22 / 21 (B 22 / 22 / 22) | GM 33; Plains 9; 3 kills | 1,628 / 10,006 / 19,012 / 10,518 / 0 / 5,532; rejected 0; timeout no | Expose Weakness ×1 | Farm step after farm build: 1 ms; no boss, stance-switch, hazard-escape, or Step Back behavior. Slinger clip/splash combat is untested. [summary](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/004-slinger-campaign-readiness-t2-intended-r01/artifacts/slinger-campaign-readiness-t2-intended-2026-09-12T15-48-58-045Z-d7afc553/summary.json) · [events](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/004-slinger-campaign-readiness-t2-intended-r01/artifacts/slinger-campaign-readiness-t2-intended-2026-09-12T15-48-58-045Z-d7afc553/events.jsonl) |
| 5. spirit / energy-heavy | 005-spirit-campaign-readiness-t2-intended-r01; completed / bot_completed; 14/14; 35,695 ms; deaths 0 | [entry](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/005-spirit-campaign-readiness-t2-intended-r01/artifacts/spirit-campaign-readiness-t2-intended-2026-09-12T15-49-48-669Z-075509fb/events.jsonl:23), [farm](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/005-spirit-campaign-readiness-t2-intended-r01/artifacts/spirit-campaign-readiness-t2-intended-2026-09-12T15-49-48-669Z-075509fb/events.jsonl:122), [boss](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/005-spirit-campaign-readiness-t2-intended-r01/artifacts/spirit-campaign-readiness-t2-intended-2026-09-12T15-49-48-669Z-075509fb/events.jsonl:139); RP 22 / 22 / 21 (B 22 / 23 / 23) | GM 36; Plains 12; 6 kills | 1,593 / 19,999 / 26,002 / 19,527 / 0 / 5,536; rejected 0; timeout no | Expose Weakness ×1 | Farm step after farm build: 1 ms; no boss, stance-switch, hazard-escape, or Step Back behavior. Spirit energy/recovery behavior is untested. [summary](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/005-spirit-campaign-readiness-t2-intended-r01/artifacts/spirit-campaign-readiness-t2-intended-2026-09-12T15-49-48-669Z-075509fb/summary.json) · [events](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/005-spirit-campaign-readiness-t2-intended-r01/artifacts/spirit-campaign-readiness-t2-intended-2026-09-12T15-49-48-669Z-075509fb/events.jsonl) |
| 6. conduit / summoner-balanced | 006-conduit-campaign-readiness-t2-intended-r01; completed / bot_completed; 14/14; 23,644 ms; deaths 0 | [entry](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/006-conduit-campaign-readiness-t2-intended-r01/artifacts/conduit-campaign-readiness-t2-intended-2026-09-12T15-50-45-099Z-f5d615ab/events.jsonl:23), [farm](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/006-conduit-campaign-readiness-t2-intended-r01/artifacts/conduit-campaign-readiness-t2-intended-2026-09-12T15-50-45-099Z-f5d615ab/events.jsonl:77), [boss](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/006-conduit-campaign-readiness-t2-intended-r01/artifacts/conduit-campaign-readiness-t2-intended-2026-09-12T15-50-45-099Z-f5d615ab/events.jsonl:93); RP 22 / 22 / 21 (B 22 / 22 / 22) | GM 32; Plains 8; 1 kill | 1,572 / 0 / 9,000 / 0 / 0 / 5,531; rejected 0; timeout no | No ability activation; 1 kill | Farm step after farm build: 1 ms; no boss, stance-switch, hazard-escape, or Step Back behavior. Conduit formation/reconstruction behavior is untested. [summary](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/006-conduit-campaign-readiness-t2-intended-r01/artifacts/conduit-campaign-readiness-t2-intended-2026-09-12T15-50-45-099Z-f5d615ab/summary.json) · [events](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/006-conduit-campaign-readiness-t2-intended-r01/artifacts/conduit-campaign-readiness-t2-intended-2026-09-12T15-50-45-099Z-f5d615ab/events.jsonl) |

All six rows have zero failure events. Because none were emitted, this cohort
has no failure-event links. The blocked-on-resource waits in the
four middle runs were diagnostic acquisition waits for
stance:defensive-stance with 44 yellow essence missing; each ended in a
successful defensive stance craft, not a failed readiness run:
[Squire wait](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/002-squire-campaign-readiness-t2-intended-r01/artifacts/squire-campaign-readiness-t2-intended-2026-09-12T15-47-16-053Z-feb47bd3/events.jsonl:86),
[Apprentice wait](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/003-apprentice-campaign-readiness-t2-intended-r01/artifacts/apprentice-campaign-readiness-t2-intended-2026-09-12T15-48-07-309Z-f81b99de/events.jsonl:84),
[Slinger wait](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/004-slinger-campaign-readiness-t2-intended-r01/artifacts/slinger-campaign-readiness-t2-intended-2026-09-12T15-48-58-045Z-d7afc553/events.jsonl:90),
and [Spirit wait](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t154251z-striker-campaign-readiness-t2/runs/005-spirit-campaign-readiness-t2-intended-r01/artifacts/spirit-campaign-readiness-t2-intended-2026-09-12T15-49-48-669Z-075509fb/events.jsonl:107).
The summaries report stalls=[], deaths.total=0, and
blockedOnResourceMs=0 for the biome timing slice.

## Evidence boundary

Observed and valid for this packet:

- Exact generated entry profile, frame, equipment, no-tier-3 state, and
  authored default Rune/ability state.
- Successful acquisition of both stances and authoritative full-build
  convergence at Entry, Plains farm, and boss-candidate stages.
- RP legality and ordered-loadout verification at every stage.
- Default-trigger activations listed in the ledger and ordinary farm kills.

Untested or inadmissible as balance evidence:

- The post-farm Sweep build's combat behavior, because its farm leg was already
  complete at level 8 in every accelerated run.
- Boss combat, boss viability, stance-switch behavior, telegraph avoidance,
  persistent-hazard escape, and Step Back behavior; all had zero opportunities.
- Apprentice secondary/DoT, Slinger clip/splash, Spirit energy/recovery, and
  Conduit formation/reconstruction behavior.
- Economy, pacing, kill-rate, resource-supply, or cross-class comparisons,
  because the runs are synthetic and 25x-reward noncanonical pipeline tests.

The operator handoff is complete for Astra's review of these artifacts before
any next local experiment is prepared.
