# Q2c execution report — remaining class local behavior qualification

2026-09-12. Operator report for the [Q2c operator packet](bot-balance-q2c-operator-packet.md), continuing [Q2](bot-balance-q2-report.md) and [Q2b](bot-balance-q2b-report.md).
This report records the exact frozen execution and preserved artifacts. No
route, profile, assertion, gameplay, or harness fixes were made. There were
no retries, cap extensions, substitutions, balance changes, or downstream
experiments.

## Result

Q2c stopped at the Spirit launch gate. Conduit and Slinger each passed their
single smoke-isolated local-behavior check. Both completed the required
post-build windows with the expected local technique evidence; Conduit also
produced formation telemetry. Spirit was created from the same frozen source
but could not start because Docker reported that all predefined address pools
were fully subnetted. No Spirit worker started, no Spirit run artifact exists,
and Apprentice and Squire were not created, as required by the sequential
gate.

| Class | Disposition | Experiment / reason | Scope of the disposition |
|---|---|---|---|
| Conduit | PASS | `20260912t181057z-conduit-campaign-local-behavio` | Both required post-build windows completed with the expected local technique evidence and formation telemetry. |
| Slinger | PASS | `20260912t181639z-slinger-campaign-local-behavio` | Both windows completed with the expected local technique evidence. One death occurred during Sweep and was observed as a death/return trip, not a gate failure. |
| Spirit | STOPPED BEFORE WORKER | `20260912t182552z-spirit-campaign-local-behavior`; Docker network creation failed | Created and preserved only; no gameplay or qualification evidence. |
| Apprentice | NOT CREATED | Sequential gate stopped at Spirit | No experiment ID or run exists. |
| Squire | NOT CREATED | Sequential gate stopped at Spirit | No experiment ID or run exists. |

PASS here means that the class-specific route reached the packet's local
behavior observation contract. It is not a DPS, class-ranking, economy,
canonical-progression, or boss result.

## Frozen contract and provenance

Both completed cases used the packet's exact treatment and limits: route
version 1.0.0, `smoke-isolated`, one worker and one run, `intended` policy,
`catalyst-primed` synthetic entry, reward multiplier 25x, maximum run time
300,000 ms, farm timeout 120,000 ms, no-progress watchdog 90,000 ms, and zero
automatic retries. The observation steps were exactly
`q2b:sweep:observe` and `q2b:expose:observe`; no timing categories overlap.

| Field | Frozen value |
|---|---|
| Requested and executed revision | `755b2a3642a3a417f364f5fb8486e661bfc351b0` |
| Exported source tree | `46bafaf54dc5016010fb4e30605813dd3f043dba` |
| Immutable image | `sha256:73f633e15d9903321d610ed5e85b4dd74c152d85b9281127e93126f108adfb6e` |
| Image tag / build identity | `mmo-idle-experiment:755b2a3642a3-d90e6996` / `5c9d9e0921f9107835bdf844` |
| Build tooling hash | `d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1` |
| Runtime hash | `d62351a8fa88a6102ec80f0b33401eab7e3a7b70a31d22b43e754b7d5996b095` |
| Reward / entry | `25x` / `catalyst-primed` |
| Limits | `maxRunMs=300000`, farm `120000`, watchdog `90000` |
| Retries | automatic retries `0`; no manual retry |

`pnpm bot:preflight` passed against the pinned revision before the first
case. That command validates tooling and route semantics; it is not balance
evidence.

The frozen image and source revision are shared provenance, not a reason to
pool Q2, Q2b, and Q2c as one controlled gameplay study. Q2 ended before a
complete observation window, Q2b was the independent Striker repair check,
and the current workspace also contains a separate `b1123804` presentation
pass. No economy or balance conclusion is pooled across those revisions.

## Conduit execution

### Manifest and terminal record

| Field | Recorded value |
|---|---|
| Experiment ID | `20260912t181057z-conduit-campaign-local-behavio` |
| Route / version | `conduit-campaign-local-behavior-t2` / `1.0.0` |
| Class root / frame | `summoner-root` / `summoner-balanced` |
| Source invocation | `develop`, clean at creation; `dirtyWorkingTreeIncluded=false` |
| Run | `001-conduit-campaign-local-behavior-t2-intended-r01` |
| Terminal | supervisor completed; run `completed`; `bot_completed` |
| Duration | 152,267 ms |
| Manifest SHA-256 | `fc67a187cd788427e20aa28174601e8f9468c3077e7161c575e41f0a2b543561` |
| Treatment / isolation | `valid` / `isolated` |
| Evidence flags | `canonical=false`, `soloBaselineEligible=false`, `combatEvidenceEligible=false`, `economyEvidenceEligible=false` |
| Bosses | 0 attempts |

The run began with the catalyst-primed synthetic entry loadout
`chaotic-axe`, `mountain-vest-t1`, `swamp-charm-t1`, and `plains-boots-t1`,
with no Core or Relic. Its final loadout was the same. All seven treatment
assertions passed, from [the first assertion](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/events.jsonl:4>) through [the final ability assertion](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/events.jsonl:373>).

Both stances were obtained by the route's ordinary `craftStance` steps before
the observation builds; no stance was injected as an observation workaround.

### Verified builds

Entry and Sweep retained five authored Rune rules: Auto Path Enemy, Step
Back, Orbit, Avoid Hazards, and Wait for Regen. Defensive intentionally
omitted Avoid Hazards and retained the other four.

| Stage | Verified at run-relative ms | Build and stance | Observed RP / budget | Evidence |
|---|---:|---|---:|---|
| Entry | 582 | Expose Weakness + Second Wind; no stance | 22 / 22 | [verified loadout](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/events.jsonl:23>) |
| Sweep / Offensive | 27,136 | Sweep + Second Wind; Offensive attuned and default | 22 / 22 | [verified loadout](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/events.jsonl:95>) |
| Defensive / Expose | 91,211 | Expose Weakness + Second Wind; Defensive attuned and default | 21 / 23 | [verified loadout](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/events.jsonl:256>) |

### Node, transit, and deaths

Preparation entered `node-t2-plains-04` with the Dominion modifier at 1,578
ms ([node-enter](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/events.jsonl:26>)) and later entered `node-t2-plains-05` with Fortified at 24,577 ms ([node-enter](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/events.jsonl:81>)). Both observation windows began on the current Plains-05 node with no post-build transit. There were zero deaths and zero return trips. The final wallet/node snapshot remained on `node-t2-plains-05`; the recorded node mix was 23,578 ms on Plains-04 Dominion and 128,013 ms on Plains-05 Fortified.

### Exact observation windows

The route windows are clipped to their exact step boundaries. Experience
samples use the interval ending at the event's `atMs`; the first and last
sample references below show the clipping boundaries. Preparation activity is
not included.

#### `q2b:sweep:observe`

The window ran from 27,136 ms / 18:12:09.552Z at [step start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/events.jsonl:97>) to 88,195 ms / 18:13:10.611Z at [step end](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/events.jsonl:242>), for 61,059 ms.

| Measure | Observed evidence |
|---|---:|
| Selected node / modifier | `node-t2-plains-05` / Fortified |
| Clipped experience samples | 62; full 61,059 ms coverage, first [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/events.jsonl:98>), last clipped [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/events.jsonl:245>) |
| Non-boss kills | 5 at 36,671; 46,878; 57,686; 62,286; 80,901 ms |
| Sweep activations | 6 at 40,472; 46,477; 52,483; 58,485; 74,498; 80,499 ms |
| Expose Weakness activations | 0 |
| Second Wind activations | 1 at 55,285 ms |
| Observed activity | 13,446 ms idle + 47,613 ms combat = 61,059 ms |
| Un-sampled / unavailable | 0 ms |
| Conduit formation telemetry | 6 arms; eligible summons `[1, 2, 4, 5, 1, 2]`; 15 deliveries; 15 secondary-damage events totaling 240 damage |

The window contains both kills and the expected Sweep activation evidence. The
formation adapter also observed available summons; these are local adapter
events, not a DPS estimate.

#### `q2b:expose:observe`

The window ran from 91,211 ms / 18:13:13.627Z at [step start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/events.jsonl:258>) to 152,260 ms / 18:14:14.676Z at [step end](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/events.jsonl:371>), for 61,049 ms.

| Measure | Observed evidence |
|---|---:|
| Selected node / modifier | `node-t2-plains-05` / Fortified |
| Clipped experience samples | 61; 60,380 ms sampled coverage, first [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/events.jsonl:259>), last [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/events.jsonl:370>) |
| Non-boss kills | 5 at 92,124; 115,735; 123,542; 130,142; 150,955 ms |
| Sweep activations | 0 |
| Expose Weakness activations | 3 at 99,326; 111,332; 140,747 ms |
| Second Wind activations | 0 |
| Observed activity | 49,378 ms combat + 11,002 ms idle = 60,380 ms |
| Un-sampled / unavailable | 669 ms tail from 151,591 to 152,260 ms; not treated as zero activity |
| Conduit formation telemetry | 3 arms; eligible summons `[1, 4, 1]`; 6 deliveries; no secondary-damage event observed |

## Slinger execution

### Manifest and terminal record

| Field | Recorded value |
|---|---|
| Experiment ID | `20260912t181639z-slinger-campaign-local-behavio` |
| Route / version | `slinger-campaign-local-behavior-t2` / `1.0.0` |
| Class root / frame | `reload-root` / `reload-heavy` |
| Source invocation | `develop`, dirty at creation; only `server/src/systems/classes/archetypes/summoner/specs/buffs.ts` was recorded, and `dirtyWorkingTreeIncluded=false` |
| Run | `001-slinger-campaign-local-behavior-t2-intended-r01` |
| Terminal | supervisor completed; run `completed`; `bot_completed` |
| Duration | 161,413 ms |
| Manifest SHA-256 | `4ff22c1a377b0cba5a4c48d1150d2f260878fd263b3fd037f900f4dc6b28ff15` |
| Treatment / isolation | `valid` / `isolated` |
| Evidence flags | `canonical=false`, `soloBaselineEligible=false`, `combatEvidenceEligible=false`, `economyEvidenceEligible=false` |
| Bosses | 0 attempts |

The run began and ended with `ashbrand-blade`, `mountain-vest-t1`,
`swamp-charm-t1`, and `plains-boots-t1`, with no Core or Relic. All seven
treatment assertions passed, from [the first assertion](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:4>) through [the final ability assertion](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:484>).

Both stances were obtained by ordinary `craftStance` route steps before the
observation builds. The first preparation Expose activation at 5,743 ms is
not included in the Expose-window counts below.

### Verified builds

Entry and Sweep retained Auto Path Enemy, Step Back, Orbit, Avoid Hazards, and
Wait for Regen. Defensive omitted Avoid Hazards and retained the other four.

| Stage | Verified at run-relative ms | Build and stance | Observed RP / budget | Evidence |
|---|---:|---|---:|---|
| Entry | 633 | Expose Weakness + Second Wind; no stance | 22 / 22 | [verified loadout](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:23>) |
| Sweep / Offensive | 17,175 | Sweep + Second Wind; Offensive attuned and default | 22 / 22 | [verified loadout](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:71>) |
| Defensive / Expose | 100,321 | Expose Weakness + Second Wind; Defensive attuned and default | 21 / 23 | [verified loadout](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:347>) |

### Node, transit, death, and return trip

Preparation entered `node-t2-plains-04` with Dominion at 1,625 ms ([node-enter](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:26>)). The Sweep window remained on that selected normal Plains node until one death at 60,173 ms ([death](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:254>), Savanna Hawk). The bot returned to Sanctuary at 62,663 ms ([node-enter](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:258>)) and re-entered the same Plains-04 Dominion node at 78,662 ms ([return node-enter](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:282>)). There was no transit after the Defensive build was verified. The final wallet/node snapshot remained on `node-t2-plains-04`; the recorded node mix was 144,682 ms on Plains-04 Dominion and 15,998 ms in Sanctuary.

### Exact observation windows

#### `q2b:sweep:observe`

The window ran from 17,175 ms / 18:17:43.739Z at [step start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:73>) to 97,306 ms / 18:19:03.870Z at [step end](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:330>), for 80,131 ms.

| Measure | Observed evidence |
|---|---:|
| Selected node / modifier | `node-t2-plains-04` / Dominion |
| Clipped experience samples | 81; full 80,131 ms coverage, first [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:74>), last clipped [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:333>) |
| Non-boss kills | 5 at 27,969; 31,973; 37,389; 51,820; 91,076 ms |
| Sweep activations | 4 at 23,162; 29,168; 45,999; 58,632 ms |
| Expose Weakness activations | 0 |
| Second Wind activations | 2 at 47,201; 59,432 ms |
| Sampled activity | 40,093 ms idle + 38,038 ms combat + 2,000 ms dead = 80,131 ms |
| Eligible alive selected-node activity | 24,095 ms idle + 38,038 ms combat = 62,133 ms |
| Excluded from eligible activity | 15,998 ms Sanctuary/off-node + 2,000 ms dead |
| Un-sampled / unavailable | 0 ms |
| Slinger Sweep telemetry | 4 clips; 60 shots; 42 splash hits; 42 splash damage |

The death and return trip are retained as observed state, not silently removed
from the full window. Only alive activity on the selected Plains node is
eligible for the local observation contract.

#### `q2b:expose:observe`

The window ran from 100,321 ms / 18:19:06.885Z at [step start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:349>) to 161,397 ms / 18:20:07.961Z at [step end](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:482>), for 61,076 ms.

| Measure | Observed evidence |
|---|---:|
| Selected node / modifier | `node-t2-plains-04` / Dominion |
| Clipped experience samples | 61; 60,359 ms sampled coverage, first [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:351>), last [sample](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl:480>) |
| Non-boss kills | 6 at 104,682; 110,491; 129,501; 137,909; 140,111; 159,139 ms |
| Sweep activations | 0 |
| Expose Weakness activations | 5 at 100,478; 115,693; 127,699; 139,710; 151,722 ms |
| Second Wind activations | 2 at 125,098; 137,108 ms |
| Observed activity | 46,353 ms combat + 14,006 ms idle = 60,359 ms |
| Un-sampled / unavailable | 717 ms tail from 160,680 to 161,397 ms; not treated as zero activity |
| Slinger Sweep telemetry | 0 new clips; 8 clip shots; 6 splash hits; 6 splash damage |

The window contains kills and the expected Expose Weakness activation evidence.

## Spirit stop record

The exact Spirit create command produced
`20260912t182552z-spirit-campaign-local-behavior` from the pinned revision and
image. Its manifest records source tree
`46bafaf54dc5016010fb4e30605813dd3f043dba`, image
`sha256:73f633e15d9903321d610ed5e85b4dd74c152d85b9281127e93126f108adfb6e`,
and `dirtyWorkingTreeIncluded=false`; the invoking checkout had unrelated
working-tree changes excluded. The manifest SHA-256 is
`391803708f566dfa0b5201c5ef8c982d0c527b4a88a4a00e3e981d0882a58a33`.

The exact launch command failed before supervisor start with exit code 1:

```text
[experiment] docker network create mmoexp-6c5539466337-network failed (1): Error response from daemon: all predefined address pools have been fully subnetted
```

The preserved status is `supervisor=not-started`, `counts={"queued":1}`;
there is no worker, run terminal reason, cohort report, or gameplay artifact.
No retry, Docker repair, or later-class creation was attempted.

## Artifact index

The links below intentionally omit `runtime-secrets.json`.

### Conduit

- [experiment.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/experiment.json>)
- [experiment.sha256](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/experiment.sha256>)
- [cohort-summary.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/cohort-summary.json>)
- [state.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/state.json>) and [supervisor-events.jsonl](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/supervisor-events.jsonl>)
- [summary.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/summary.json>)
- [events.jsonl](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/events.jsonl>)
- [deaths.jsonl](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/deaths.jsonl>)
- [snapshot-b.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/snapshot-b.json>) and [snapshot-index.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/artifacts/conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb/snapshot-index.json>)
- [worker-result.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181057z-conduit-campaign-local-behavio/runs/001-conduit-campaign-local-behavior-t2-intended-r01/worker-result.json>)

Artifact root:
`C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t181057z-conduit-campaign-local-behavio\runs\001-conduit-campaign-local-behavior-t2-intended-r01\artifacts\conduit-campaign-local-behavior-t2-intended-2026-09-12T18-11-42-406Z-bc2181bb`

### Slinger

- [experiment.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/experiment.json>)
- [experiment.sha256](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/experiment.sha256>)
- [cohort-summary.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/cohort-summary.json>)
- [state.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/state.json>) and [supervisor-events.jsonl](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/supervisor-events.jsonl>)
- [summary.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/summary.json>)
- [events.jsonl](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/events.jsonl>)
- [deaths.jsonl](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/deaths.jsonl>)
- [snapshot-b.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/snapshot-b.json>) and [snapshot-index.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/artifacts/slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9/snapshot-index.json>)
- [worker-result.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t181639z-slinger-campaign-local-behavio/runs/001-slinger-campaign-local-behavior-t2-intended-r01/worker-result.json>)

Artifact root:
`C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t181639z-slinger-campaign-local-behavio\runs\001-slinger-campaign-local-behavior-t2-intended-r01\artifacts\slinger-campaign-local-behavior-t2-intended-2026-09-12T18-17-26-550Z-cc9a43f9`

### Spirit

- [experiment.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/experiment.json>)
- [experiment.sha256](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/experiment.sha256>)
- [state.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t182552z-spirit-campaign-local-behavior/state.json>)

There is no Spirit `cohort-summary.json`, supervisor event stream, worker
result, or run artifact because launch failed before supervisor start.

## Evidence boundary and audit note

The completed runs carry the expected taints `SYNTHETIC_TIER_ENTRY` and
`NON_CANONICAL_REWARD_MULTIPLIER`, and both summaries explicitly set
`combatEvidenceEligible=false` and `economyEvidenceEligible=false`. The
reported kills, activations, deaths, formation events, and Slinger adapter
events are observed route evidence only. This report makes no DPS estimate,
class ranking, economy claim, boss claim, or canonical progression claim.

The first immediate read of Slinger's cohort report after the report command
returned `{}`; a later settled read contained one completed run with
`bot_completed`, matching the preserved state, summary, revision, and image.
The run was not repeated. Manifest SHA-256 values were checked against the
corresponding `experiment.json` files. The workspace source changes present
during execution were preserved and not edited by this operation.
