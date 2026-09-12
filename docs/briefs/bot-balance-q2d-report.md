# Q2d execution report — resumed remaining class local behavior qualification

2026-09-12. Operator report for the [Q2d operator packet](bot-balance-q2d-operator-packet.md), continuing the [Q2c execution report](bot-balance-q2c-report.md).
This report records the exact frozen execution and preserved artifacts. No
route, profile, assertion, gameplay, or harness fixes were made. There were
no retries, cap extensions, substitutions, balance changes, or downstream
experiments.

## Result

Q2d resumed the existing Spirit experiment exactly once after the Q2c
pre-worker infrastructure stop. Spirit passed the local behavior gate, so
Apprentice was created and passed; Squire was then created and passed. The
original Q2c Spirit failure and the renewed Q2d launch are separate lifecycle
events under the same Spirit experiment ID. No other class or boss case was
run.

| Class | Disposition | Experiment | Scope of the disposition |
|---|---|---|---|
| Spirit | PASS | 20260912t182552z-spirit-campaign-local-behavior | Q2d renewed launch completed normally; all assertions, builds, and both local observation windows passed. |
| Apprentice | PASS | 20260912t185404z-apprentice-campaign-local-beha | Completed normally; one death and return occurred during Expose and are retained as separate observed state. |
| Squire | PASS | 20260912t190003z-squire-campaign-local-behavior | Completed normally with both local observation windows and no death or return. |

PASS means that the class reached the packet's local behavior observation
contract: normal completion, all seven treatment assertions, three exact
build verifications within their observed Runic Point budgets, two completed
non-overlapping observation windows, non-boss kills, expected Technique
activation in each window, and no unwanted initial transit after the
observation builds. A death or return can coexist with PASS when it is
recorded separately and the selected-node alive evidence still satisfies the
contract. This is not a DPS, class-ranking, economy, canonical-progression,
or boss result.

## Frozen contract and provenance

All three cases used the Q2b treatment unchanged: route version 1.0.0,
smoke-isolated, one worker and one run, intended policy, catalyst-primed
synthetic entry, reward multiplier 25x, maximum run time 300,000 ms, farm
timeout 120,000 ms, no-progress watchdog 90,000 ms, and zero automatic
retries. The observation labels were exactly q2b:sweep:observe and
q2b:expose:observe; their timing categories do not overlap. Each case used
the packet's one launch attempt and the sequential Spirit -> Apprentice ->
Squire gate.

| Field | Frozen value |
|---|---|
| Requested and executed revision | 755b2a3642a3a417f364f5fb8486e661bfc351b0 |
| Exported source tree | 46bafaf54dc5016010fb4e30605813dd3f043dba |
| Immutable image | sha256:73f633e15d9903321d610ed5e85b4dd74c152d85b9281127e93126f108adfb6e |
| Image tag / build identity | mmo-idle-experiment:755b2a3642a3-d90e6996 / 5c9d9e0921f9107835bdf844 |
| Build tooling hash | d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1 |
| Runtime hash | d62351a8fa88a6102ec80f0b33401eab7e3a7b70a31d22b43e754b7d5996b095 |
| Reward / entry | 25x / catalyst-primed |
| Limits | maxRunMs=300000, farm 120000, watchdog 90000 |
| Retries | automatic retries 0; no manual retry |

pnpm bot:preflight passed against the pinned revision before this frozen
sequence. That command validates tooling and route semantics; it is not
balance evidence.

Each manifest was created from the develop invocation checkout while it was
dirty, with dirtyWorkingTreeIncluded=false; the uncommitted workspace changes
were excluded from the frozen source and image. They were preserved throughout
this operation.

| Case | Manifest SHA-256 | Terminal |
|---|---|---|
| Spirit | 391803708f566dfa0b5201c5ef8c982d0c527b4a88a4a00e3e981d0882a58a33 | supervisor and run completed; bot_completed |
| Apprentice | 435871269d40d4ffd9cfc26741fef0d7034ba3b55a2701d7d8dd703a357d53ab | supervisor and run completed; bot_completed |
| Squire | 002db86bf0600d2797c89077a171ff165a7055b6380d52aed3613dc18c5ae13c | supervisor and run completed; bot_completed |

The summaries for all three cases record canonical=false,
soloBaselineEligible=false, combatEvidenceEligible=false, and
economyEvidenceEligible=false. The observations below are route and mechanics
evidence only.

## Spirit execution

### Separate Q2c stop and Q2d renewal

The [Q2c report](bot-balance-q2c-report.md) records the original Spirit
launch failure under the same preserved experiment ID:

    [experiment] docker network create mmoexp-6c5539466337-network failed (1): Error response from daemon: all predefined address pools have been fully subnetted

That event happened before supervisor start. The pre-Q2d status check found
the existing experiment still queued with supervisor=not-started,
counts={"queued":1}, no worker, and no gameplay run artifact. The packet's
empty network was prepared, and no replacement, reset, or state edit was made.
The Q2c failure remains an infrastructure-preparation record, not a Spirit
gameplay failure.

The exact Q2d launch of the existing ID then succeeded. It produced run
001-spirit-campaign-local-behavior-t2-intended-r01 and completed with terminal
reason bot_completed. The [sealed manifest](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/experiment.json>) and [manifest hash](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/experiment.sha256>) match the frozen revision, source tree, and image above.

### Manifest and terminal record

| Field | Recorded value |
|---|---|
| Experiment ID | 20260912t182552z-spirit-campaign-local-behavior |
| Route / version | spirit-campaign-local-behavior-t2 / 1.0.0 |
| Class root / frame | energy-root / energy-heavy |
| Source invocation | develop, dirty at creation; dirtyWorkingTreeIncluded=false |
| Run | 001-spirit-campaign-local-behavior-t2-intended-r01 |
| Terminal | supervisor completed; run completed; bot_completed |
| Duration | 154,385 ms |
| Treatment / isolation | valid / isolated |
| Evidence flags | canonical=false, soloBaselineEligible=false, combatEvidenceEligible=false, economyEvidenceEligible=false |
| Progression gate | tier 2, GM 36, route steps 15/15 |
| Bosses | 0 attempts |
| Resource summary | max memory 152.9 MiB; max CPU 54.8%; event-loop p99 33.3 ms |

The run began and ended with chaotic-axe, mountain-vest-t1, swamp-charm-t1,
and plains-boots-t1, with no Core or Relic. All seven treatment assertions
passed: lines 4, 7, 10, 13, 16, 19, and 347; see the [first assertion](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/events.jsonl:4>) and [final assertion](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/events.jsonl:347>).

### Verified builds and movement

Entry and Sweep retained five authored Rune rules: Auto Path Enemy, Step
Back, Orbit, Avoid Hazards, and Wait for Regen. Defensive omitted Avoid
Hazards and retained the other four. The ordinary route crafted both stances
before the observation builds.

| Stage | Verified at run-relative ms | Build and stance | Observed RP / budget | Evidence |
|---|---:|---|---:|---|
| Entry | 628 | Expose Weakness + Second Wind; no stance | 22 / 22 | [verified loadout](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/events.jsonl:23>) |
| Sweep / Offensive | 29,206 | Sweep + Second Wind; Offensive attuned and default | 22 / 22 | [verified loadout](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/events.jsonl:107>) |
| Defensive / Expose | 93,303 | Expose Weakness + Second Wind; Defensive attuned and default | 21 / 23 | [verified loadout](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/events.jsonl:234>) |

Preparation entered node-t2-plains-04 with Dominion at 1,625 ms ([node-enter](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/events.jsonl:26>)) and then node-t2-plains-05 with Fortified at 26,627 ms ([node-enter](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/events.jsonl:94>)). Both observation windows stayed on Plains-05 with no post-build transit. There were zero deaths and zero return trips.

### Exact observation windows

Experience samples use the interval ending at the event's atMs; the first and
last sample references show the clipping boundaries. Preparation and the
inter-window kill at 91,269 ms are excluded.

#### q2b:sweep:observe

The window ran from 29,206 ms / 18:49:41.880Z at [step start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/events.jsonl:109>) to 90,286 ms / 18:50:42.960Z at [step end](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/events.jsonl:220>), for 61,080 ms.

| Measure | Observed evidence |
|---|---:|
| Selected node / modifier | node-t2-plains-05 / Fortified |
| Clipped experience samples | 62; full 61,080 ms coverage, first [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/events.jsonl:110>), last clipped [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/events.jsonl:223>) |
| Non-boss kills | 6: Stampede Bull at 41,190 and 54,825; Savanna Hawk at 61,642; Prairie Yearling at 72,855 and 75,458; Stampede Bull at 84,664 ms |
| Sweep activations | 8 at 40,184; 47,608; 53,619; 59,638; 68,048; 74,057; 82,663; 88,668 ms |
| Expose Weakness activations | 0 |
| Observed activity | 34,428 ms idle + 26,652 ms combat = 61,080 ms |
| Un-sampled / unavailable | 0 ms |

The window contains both non-boss kills and the expected Sweep activation
evidence.

#### q2b:expose:observe

The window ran from 93,303 ms / 18:50:45.977Z at [step start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/events.jsonl:236>) to 154,371 ms / 18:51:47.045Z at [step end](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/events.jsonl:345>), for 61,068 ms.

| Measure | Observed evidence |
|---|---:|
| Selected node / modifier | node-t2-plains-05 / Fortified |
| Clipped experience samples | 61; 60,352 ms sampled coverage, first [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/events.jsonl:237>), last [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/events.jsonl:343>) |
| Non-boss kills | 8: Stampede Bull at 99,079 and 111,287; Savanna Hawk at 123,897; Prairie Yearling at 130,504, 147,518, and 152,526; Prairie Wolf at 138,508 and 143,917 ms |
| Sweep activations | 0 |
| Expose Weakness activations | 5 at 95,275; 107,287; 119,295; 131,309; 143,316 ms |
| Observed activity | 17,340 ms idle + 43,012 ms combat = 60,352 ms |
| Un-sampled / unavailable | 716 ms tail from 153,655 to 154,371 ms; not treated as zero activity |

The window contains both non-boss kills and the expected Expose Weakness
activation evidence.

## Apprentice execution

### Manifest and terminal record

| Field | Recorded value |
|---|---|
| Experiment ID | 20260912t185404z-apprentice-campaign-local-beha |
| Route / version | apprentice-campaign-local-behavior-t2 / 1.0.0 |
| Class root / frame | dot-root / dot-balanced |
| Source invocation | develop, dirty at creation; dirtyWorkingTreeIncluded=false |
| Run | 001-apprentice-campaign-local-behavior-t2-intended-r01 |
| Terminal | supervisor completed; run completed; bot_completed |
| Duration | 188,364 ms |
| Treatment / isolation | valid / isolated |
| Evidence flags | canonical=false, soloBaselineEligible=false, combatEvidenceEligible=false, economyEvidenceEligible=false |
| Progression gate | tier 2, GM 36, route steps 15/15 |
| Bosses | 0 attempts |
| Resource summary | max memory 153.6 MiB; max CPU 61.2%; event-loop p99 49.5 ms |

All seven treatment assertions passed: lines 4, 7, 10, 13, 16, 19, and 444;
see the [first assertion](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:4>) and [final assertion](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:444>).

The final loadout remained chaotic-axe, mountain-vest-t1, swamp-charm-t1,
and plains-boots-t1, with no Core or Relic. Entry and Sweep used Auto Path
Enemy, Step Back, Orbit, Avoid Hazards, and Wait for Regen. Defensive used
Auto Path Enemy, Step Back, Orbit, and Wait for Regen.

### Verified builds, transit, death, and return

| Stage | Verified at run-relative ms | Build and stance | Observed RP / budget | Evidence |
|---|---:|---|---:|---|
| Entry | 635 | Expose Weakness + Second Wind; no stance | 22 / 22 | [verified loadout](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:23>) |
| Sweep / Offensive | 27,682 | Sweep + Second Wind; Offensive attuned and default | 22 / 22 | [verified loadout](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:102>) |
| Defensive / Expose | 91,768 | Expose Weakness + Second Wind; Defensive attuned and default | 21 / 23 | [verified loadout](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:248>) |

Preparation entered node-t2-plains-04 with Dominion at 1,631 ms ([node-enter](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:26>)) and then node-t2-plains-05 with Fortified at 24,635 ms ([node-enter](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:84>)). There was no transit after either observation build until the later death/return sequence.

One death occurred at 151,081 ms from a Savanna Hawk ([death](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:379>)). The run entered Sanctuary at 153,654 ms ([return node](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:383>)), Forest-05 with Alacrity at 169,653 ms ([transit node](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:407>)), and returned to Plains-05 Fortified at 186,654 ms ([return node](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:438>)). The death, dead interval, off-node recovery, and return are included in the raw Expose window record and excluded from selected-node alive eligibility.

### Exact observation windows

#### q2b:sweep:observe

The window ran from 27,683 ms / 18:55:16.418Z at [step start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:104>) to 88,758 ms / 18:56:17.493Z at [step end](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:234>), for 61,075 ms.

| Measure | Observed evidence |
|---|---:|
| Selected node / modifier | node-t2-plains-05 / Fortified |
| Clipped experience samples | 62; full 61,075 ms coverage, first [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:105>), last clipped [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:238>) |
| Non-boss kills | 10: Prairie Yearling at 37,424, 38,227, 43,229, 53,436, 58,037, and 74,849; Prairie Wolf at 43,027 and 57,236; Savanna Hawk at 61,241; Stampede Bull at 84,258 ms |
| Sweep activations | 8 at 32,219; 38,228; 48,431; 54,435; 60,437; 71,250; 77,853; 84,058 ms |
| Second Wind activations | 1 at 56,436 ms |
| Expose Weakness activations | 0 |
| Observed activity | 27,074 ms idle + 34,001 ms combat = 61,075 ms |
| Un-sampled / unavailable | 0 ms |

The window contains both non-boss kills and the expected Sweep activation
evidence. The five apprentice-sweep adapter events at lines 113, 129, 169,
170, and 171 recorded five secondary targets and five stacks; see the [first
adapter event](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:113>) and [last adapter event](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:171>).

#### q2b:expose:observe

The window ran from 91,768 ms / 18:56:20.503Z at [step start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:250>) to 188,356 ms / 18:57:57.091Z at [step end](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:442>), for 96,588 ms.

| Measure | Observed evidence |
|---|---:|
| Selected node / modifier | node-t2-plains-05 / Fortified |
| Clipped experience samples | 96; 95,886 ms sampled coverage, first [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:251>), last [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl:440>) |
| Non-boss kills | 9: Prairie Wolf at 103,068 and 148,703; Prairie Yearling at 104,268, 117,280, 125,685, 126,887, 133,887, and 140,290; Savanna Hawk at 139,890 ms |
| Expose Weakness activations | 5 at 96,666; 113,676; 125,685; 137,689; 149,699 ms |
| Second Wind activations | 2 at 132,684 and 144,693 ms |
| Sweep activations | 0 |
| Sampled activity | 41,877 ms idle + 52,009 ms combat + 2,000 ms dead = 95,886 ms |
| Eligible alive selected-node activity | 14,876 ms idle + 46,009 ms combat = 60,885 ms |
| Excluded from eligible activity | 16,000 ms Sanctuary + 17,001 ms Forest-05/off-node + 2,000 ms dead |
| Un-sampled / unavailable | 702 ms tail from 187,654 to 188,356 ms; not treated as zero activity |

The window contains both non-boss kills and the expected Expose Weakness
activation evidence. The death and return are retained in the full window
record; only alive activity on the selected Plains node is eligible.

## Squire execution

### Manifest and terminal record

| Field | Recorded value |
|---|---|
| Experiment ID | 20260912t190003z-squire-campaign-local-behavior |
| Route / version | squire-campaign-local-behavior-t2 / 1.0.0 |
| Class root / frame | cooldown-root / cooldown-heavy |
| Source invocation | develop, dirty at creation; dirtyWorkingTreeIncluded=false |
| Run | 001-squire-campaign-local-behavior-t2-intended-r01 |
| Terminal | supervisor completed; run completed; bot_completed |
| Duration | 144,790 ms |
| Treatment / isolation | valid / isolated |
| Evidence flags | canonical=false, soloBaselineEligible=false, combatEvidenceEligible=false, economyEvidenceEligible=false |
| Progression gate | tier 2, GM 36, route steps 15/15 |
| Bosses | 0 attempts |
| Resource summary | max memory 151.2 MiB; max CPU 54.5%; event-loop p99 37.2 ms |

All seven treatment assertions passed: lines 4, 7, 10, 13, 16, 19, and 319;
see the [first assertion](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/events.jsonl:4>) and [final assertion](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/events.jsonl:319>).

The final loadout remained chaotic-axe, mountain-vest-t1, swamp-charm-t1,
and plains-boots-t1, with no Core or Relic. Entry and Sweep used Auto Path
Enemy, Step Back, Chase Enemy, Avoid Hazards, and Wait for Regen. Defensive
used Auto Path Enemy, Step Back, Chase Enemy, and Wait for Regen. No
class-specific adapter telemetry was emitted; the expected local evidence here
is the generic Sweep/Expose activation contract.

### Verified builds and movement

| Stage | Verified at run-relative ms | Build and stance | Observed RP / budget | Evidence |
|---|---:|---|---:|---|
| Entry | 599 | Expose Weakness + Second Wind; no stance | 20 / 22 | [verified loadout](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/events.jsonl:23>) |
| Sweep / Offensive | 19,644 | Sweep + Second Wind; Offensive attuned and default | 20 / 22 | [verified loadout](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/events.jsonl:77>) |
| Defensive / Expose | 83,717 | Expose Weakness + Second Wind; Defensive attuned and default | 19 / 23 | [verified loadout](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/events.jsonl:209>) |

Preparation entered node-t2-plains-04 with Dominion at 1,594 ms ([node-enter](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/events.jsonl:26>)). Both observation windows stayed on that selected node with no post-build transit. There were zero deaths and zero return trips.

### Exact observation windows

#### q2b:sweep:observe

The window ran from 19,644 ms / 19:01:07.589Z at [step start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/events.jsonl:79>) to 80,705 ms / 19:02:08.650Z at [step end](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/events.jsonl:195>), for 61,061 ms.

| Measure | Observed evidence |
|---|---:|
| Selected node / modifier | node-t2-plains-04 / Dominion |
| Clipped experience samples | 62; full 61,061 ms coverage, first [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/events.jsonl:80>), last clipped [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/events.jsonl:199>) |
| Non-boss kills | 11: Prairie Yearling at 27,344 twice, 35,153, 68,776, 73,176, and 76,577; Prairie Wolf at 30,748 and 79,780; Savanna Hawk at 41,558, 51,565, and 58,968 ms |
| Sweep activations | 8 at 25,541; 31,549; 37,953; 47,960; 53,966; 65,773; 71,779; 77,778 ms |
| Expose Weakness activations | 0 |
| Observed activity | 24,042 ms idle + 37,019 ms combat = 61,061 ms |
| Un-sampled / unavailable | 0 ms |

The window contains both non-boss kills and the expected Sweep activation
evidence.

#### q2b:expose:observe

The window ran from 83,717 ms / 19:02:11.662Z at [step start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/events.jsonl:211>) to 144,777 ms / 19:03:12.722Z at [step end](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/events.jsonl:317>), for 61,060 ms.

| Measure | Observed evidence |
|---|---:|
| Selected node / modifier | node-t2-plains-04 / Dominion |
| Clipped experience samples | 61; 60,919 ms sampled coverage, first [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/events.jsonl:213>), last [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/events.jsonl:316>) |
| Non-boss kills | 7: Savanna Hawk at 89,385; Prairie Yearling at 95,989, 101,197, 105,004, 131,654, and 138,065; Prairie Wolf at 115,426 ms |
| Sweep activations | 0 |
| Expose Weakness activations | 5 at 83,784; 95,788; 107,810; 123,235; 136,055 ms |
| Observed activity | 16,002 ms idle + 44,917 ms combat = 60,919 ms |
| Un-sampled / unavailable | 141 ms tail from 144,636 to 144,777 ms; not treated as zero activity |

The window contains both non-boss kills and the expected Expose Weakness
activation evidence.

## Artifact index

The links below intentionally omit runtime-secrets.json. The experiment.json,
experiment.sha256, state.json, cohort report, and supervisor records are at
the experiment root; run-level evidence is under the linked artifact
directory.

### Spirit

- [experiment.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/experiment.json>)
- [experiment.sha256](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/experiment.sha256>)
- [cohort-summary.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/cohort-summary.json>)
- [state.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/state.json>) and [supervisor-events.jsonl](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/supervisor-events.jsonl>)
- [summary.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/summary.json>)
- [events.jsonl](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/events.jsonl>)
- [deaths.jsonl](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/deaths.jsonl>)
- [snapshot-b.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/snapshot-b.json>) and [snapshot-index.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df/snapshot-index.json>)
- [worker-result.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/worker-result.json>)

Artifact root:
C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/runs/001-spirit-campaign-local-behavior-t2-intended-r01/artifacts/spirit-campaign-local-behavior-t2-intended-2026-09-12T18-49-12-658Z-506565df

### Apprentice

- [experiment.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/experiment.json>)
- [experiment.sha256](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/experiment.sha256>)
- [cohort-summary.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/cohort-summary.json>)
- [state.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/state.json>) and [supervisor-events.jsonl](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/supervisor-events.jsonl>)
- [summary.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/summary.json>)
- [events.jsonl](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/events.jsonl>)
- [deaths.jsonl](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/deaths.jsonl>)
- [snapshot-b.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/snapshot-b.json>) and [snapshot-index.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499/snapshot-index.json>)
- [worker-result.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/worker-result.json>)

Artifact root:
C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t185404z-apprentice-campaign-local-beha/runs/001-apprentice-campaign-local-behavior-t2-intended-r01/artifacts/apprentice-campaign-local-behavior-t2-intended-2026-09-12T18-54-48-691Z-20cb8499

### Squire

- [experiment.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/experiment.json>)
- [experiment.sha256](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/experiment.sha256>)
- [cohort-summary.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/cohort-summary.json>)
- [state.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/state.json>) and [supervisor-events.jsonl](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/supervisor-events.jsonl>)
- [summary.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/summary.json>)
- [events.jsonl](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/events.jsonl>)
- [deaths.jsonl](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/deaths.jsonl>)
- [snapshot-b.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/snapshot-b.json>) and [snapshot-index.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e/snapshot-index.json>)
- [worker-result.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/worker-result.json>)

Artifact root:
C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t190003z-squire-campaign-local-behavior/runs/001-squire-campaign-local-behavior-t2-intended-r01/artifacts/squire-campaign-local-behavior-t2-intended-2026-09-12T19-00-47-936Z-4bb3907e

## Evidence boundary and audit note

All three completed runs carry the expected taints
SYNTHETIC_TIER_ENTRY and NON_CANONICAL_REWARD_MULTIPLIER. The reported kills,
activations, RP observations, node/modifier observations, death/return state,
and Apprentice adapter events are observed route evidence only. The completed
route reaching tier 2 and GM 36 is a route-completion record, not a
natural-progression result. This report makes no DPS estimate, class ranking,
economy claim, boss claim, or canonical progression claim.

The Q2c Spirit network failure is retained as a pre-worker infrastructure
event. The Q2d Spirit launch was a single renewed launch of the existing
experiment, followed by exactly one Apprentice and one Squire case after the
required pass gates. No source or build edits, retries, limit extensions,
Docker cleanup, boss attempts, or future cases were performed.
