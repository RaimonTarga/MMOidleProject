# Q2b execution report — single Striker local observation repair

2026-09-12. Luna operator report for the [Q2b operator packet](bot-balance-q2b-operator-packet.md), continuation of [Q2](bot-balance-q2-report.md) and [Q1](bot-balance-q1-report.md).
This report records the exact frozen execution and its artifacts. No route,
profile, assertion, gameplay, or harness fixes were made; there were no
retries, cap extensions, balance changes, or downstream experiments.

## Result

PASS for the single Striker repair check. The one run completed normally with
terminal reason bot_completed. All three required builds were phase=verified
within RP budget, both post-build observation steps emitted start and end
events, and each completed window recorded kills plus its expected Technique
activation.

The repair also passed its structural condition. Preparation entered
node-t2-plains-04 at 1,609 ms and that was the only node-enter event in the
run. After the Sweep build was verified, q2b:sweep:observe began on that
current normal T2 Plains node without transit. After the Defensive build was
verified, q2b:expose:observe did the same. There was no death and therefore no
return trip to confuse with initial selection.

This qualifies the repaired local observation route for this one Striker case
only. It does not authorize the remaining classes, a boss campaign, or any
economy, DPS, class-balance, or canonical progression conclusion. Q2 and Q2b
are not pooled as a same-gameplay controlled comparison: the current source
also contains the independent b1123804 monster animation/combat presentation
pass, while this run used only the frozen Q2b source revision.

## Frozen manifest and execution record

| Field | Recorded value |
|---|---|
| Experiment ID | 20260912t170727z-striker-campaign-local-behavio |
| Requested and executed revision | 755b2a3642a3a417f364f5fb8486e661bfc351b0 |
| Source tree exported | 46bafaf54dc5016010fb4e30605813dd3f043dba |
| Immutable image | sha256:73f633e15d9903321d610ed5e85b4dd74c152d85b9281127e93126f108adfb6e |
| Build identity | image tag mmo-idle-experiment:755b2a3642a3-d90e6996; buildId 5c9d9e0921f9107835bdf844 |
| Route / version | striker-campaign-local-behavior-t2 / 1.0.0 |
| Mode / worker | smoke-isolated / 1 |
| Entry / reward | catalyst-primed / 25x |
| Run ceiling | 300,000 ms |
| Farm timeout / no-progress watchdog | 120,000 ms / 90,000 ms |
| Policy / count / automatic retries | intended / 1 / 0 |
| Terminal result | supervisor completed; run completed; bot_completed |
| Manifest | [experiment.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/experiment.json) |
| Manifest hash | [experiment.sha256](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/experiment.sha256) — e44d88401a2f0dc0803dfc7876050333f2deec239f1378393537ac5d209e02a |
| Cohort report | [cohort-summary.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/cohort-summary.json) |
| Scheduler state | [state.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/state.json) |
| Supervisor events | [supervisor-events.jsonl](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/supervisor-events.jsonl) |
| Artifact root | C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t170727z-striker-campaign-local-behavio\runs\001-striker-campaign-local-behavior-t2-intended-r01\artifacts\striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982 |

The invoking checkout was dirty, but the manifest records
dirtyWorkingTreeIncluded=false. The immutable image and run artifacts came
from the requested revision; the newer uncommitted monster/combat changes in
the main workspace were excluded. Container setup and compilation were
outside the run ceiling.

The run carries the expected noncanonical taints
SYNTHETIC_TIER_ENTRY and NON_CANONICAL_REWARD_MULTIPLIER. The preserved
summary flags are canonical=false, isolationGrade=isolated,
treatmentValidity=valid, soloBaselineEligible=false,
concurrencyCohortEligible=true, combatEvidenceEligible=false, and
economyEvidenceEligible=false. No boss attempt was made.

Key preserved files are the [run summary.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/summary.json), [events.jsonl](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl), [deaths.jsonl](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/deaths.jsonl), [snapshot-b.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/snapshot-b.json), [snapshot-index.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/snapshot-index.json), and [worker-result.json](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/worker-result.json).

## Entry assertions and verified build contract

The route used the authored Striker profile and the exact source definitions
named by the packet: campaignProfiles.ts, campaignReadiness.ts, and
campaignBehavior.ts. Entry assertions for the frame, tier, four equipment
slots, and non-tier-3 state all passed at [the first assertion](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:4) through [the last entry assertion](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:19).

| Stage | Verified at run-relative ms | Verified build | Observed RP / budget | Evidence |
|---|---:|---|---:|---|
| Entry | 612 ms (2026-09-12T17:10:13.040Z) | Expose Weakness + Second Wind; no stance | 20 / 22 | [phase=verified](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:23) |
| Sweep / Offensive | 10,161 ms (2026-09-12T17:10:22.589Z) | Sweep + Second Wind; Offensive attuned and default | 20 / 22 | [phase=verified](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:63) |
| Defensive / Expose | 74,229 ms (2026-09-12T17:11:26.657Z) | Expose Weakness + Second Wind; Defensive attuned and default | 19 / 23 | [phase=verified](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:194) |

Each verified event observed the requested abilities, stance, and five
intended Rune rules: Auto Path Enemy, Step Back, Chase Enemy, Avoid Hazards,
and Wait for Regen. All three observed RP totals were within their recorded
budgets. The final readiness assertion also passed after the observation
windows at [events.jsonl line 305](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:305).

## Node, transit, death, and return-trip evidence

The run began at node-t2-sanctuary, as recorded in the run-start header
([events.jsonl line 1](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:1)) and start wallet snapshot
([events.jsonl line 2](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:2)).
The normal preparation farm selected and entered node-t2-plains-04 with the
Dominion modifier at 1,609 ms ([events.jsonl line 27](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:27)).
That was the only node-enter event. It is preparation evidence and is not
counted in either observation window.

| Interval | Recorded node | Initial-selection transit check |
|---|---|---|
| q2b:sweep:observe | node-t2-plains-04 | No node-enter or transit after the Sweep/Offensive verification; first clipped sample is already on Plains-04 at [events.jsonl line 66](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:66). |
| q2b:expose:observe | node-t2-plains-04 | No node-enter or transit after the Defensive/Expose verification; first sample is already on Plains-04 at [events.jsonl line 198](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:198). |

There were zero deaths in the summary and no death events in the preserved
[deaths.jsonl](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/deaths.jsonl), so there were zero return trips. The run-end
wallet snapshot remained on node-t2-plains-04 ([events.jsonl line 307](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:307)).

## Exact observation-window evidence

All counts and activity totals in this section are restricted to the named
window boundaries. Preparation events, including the preparation Expose
activation and preparation kills, are excluded. Experience-sample durations
are clipped to the exact window bounds. Activity totals use only the activity
field; purpose labels are not added to them, so no timing categories overlap.

### q2b:sweep:observe

The Sweep/Offensive build was verified at 10,161 ms, and the observation step
started at the same timestamp ([route-step start](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:65)).
The step ended at 71,217 ms ([route-step end](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:181)), for a completed duration of
61,056 ms (2026-09-12T17:10:22.589Z to 2026-09-12T17:11:23.645Z).

| Measure | Window evidence |
|---|---:|
| Node | node-t2-plains-04 |
| Non-boss kills | 8 ([18,267 ms](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:80), [20,672 ms](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:87), [25,476 ms](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:96), [27,880 ms](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:104), [39,886 ms](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:126), [50,490 ms](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:142), [60,700 ms](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:163), [63,901 ms](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:169)) |
| Sweep activations | 8 ([events lines 72, 85, 100, 112, 122, 134, 149, 160](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl)) |
| Expose Weakness activations | 0 |
| Second Wind activations | 1 ([events.jsonl line 156](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:156)) |
| Observed activity | 38,006 ms combat + 23,050 ms idle = 61,056 ms |
| Unavailable / uncounted | 0 ms; 62 clipped experience samples covered the full step |

The Sweep activations are all restricted to this window; the event stream
records them at 14,264, 20,270, 26,278, 32,882, 38,885, 44,888, 53,894, and
59,900 ms. The full sample coverage includes the interval that straddles the
route-step end and is clipped at 71,217 ms, as required. The window therefore
contains both kills and the expected Sweep Technique activation evidence.

### q2b:expose:observe

The Defensive/Expose build was verified at 74,229 ms, and the observation step
started at that same timestamp ([route-step start](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:196)).
The step ended at 135,306 ms ([route-step end](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:303)), for a completed duration of
61,077 ms (2026-09-12T17:11:26.657Z to 2026-09-12T17:12:27.734Z).

| Measure | Window evidence |
|---|---:|
| Node | node-t2-plains-04 |
| Non-boss kills | 5 ([81,514 ms](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:208), [96,128 ms](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:235), [104,336 ms](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:249), [112,943 ms](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:264), [129,765 ms](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:292)) |
| Sweep activations | 0 |
| Expose Weakness activations | 6 ([events lines 197, 217, 240, 259, 279, 301](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl)) |
| Second Wind activations | 2 ([events lines 232 and 300](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl)) |
| Observed activity | 48,408 ms combat + 12,001 ms idle = 60,409 ms |
| Unavailable / uncounted | 668 ms tail after the last sample; no explicit unavailable activity label |

The Expose window has 61 clipped experience samples, with the first on-node
sample at [events.jsonl line 198](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:198) and the last at [line 302](/C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t170727z-striker-campaign-local-behavio/runs/001-striker-campaign-local-behavior-t2-intended-r01/artifacts/striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982/events.jsonl:302).
The 668 ms after the last sample is unavailable/uncounted, not zero activity.
The window nevertheless contains more than the required 60,000 ms of
observed activity, kills, and repeated Expose Weakness Technique activations.

## Evidence boundary and handoff

Established for this packet:

- The exact frozen revision, immutable image, isolated single-worker execution,
  synthetic entry, reward mode, limits, terminal result, and preserved
  artifacts.
- All entry assertions and all three exact Striker build convergences, with
  observed RP totals within budget.
- The initial run node, the actual current Plains node used by both windows,
  the absence of unwanted post-build transit, and the absence of deaths or
  return trips.
- Two completed observation windows with non-boss kills, expected Technique
  activations, Second Wind observations, activity totals, and explicit
  unavailable-time accounting.

Not established or admissible:

- No six-class comparison, optimized balance, exact DPS, economy rate, natural
  progression, canonical combat result, or boss viability.
- No claim that every Striker or every class will use Plains-04; Q2b records
  the actual current normal Plains node selected in this run.
- No pooling of Q2's incomplete transit-affected stream with this Q2b run.
- No engine or balance defect inference from any individual activation timing.

Return to Astra with this single-case result. Success does not authorize
additional classes or a boss campaign.

## Operator checks

- Frozen revision verification: PASS; requested commit was present and
  exported.
- pnpm bot:preflight: PASS; the command labels itself noncanonical
  infrastructure validation, not balance evidence.
- Immutable container build from the requested revision: PASS.
- pnpm experiment:launch: PASS; exactly one worker started.
- pnpm experiment:status: PASS; terminal state was completed / bot_completed.
- pnpm experiment:report: PASS; cohort-summary.json was generated.
- No source or treatment edits, retries, cap extensions, staging, commits, or
  pushes were made by this operation.
- The main checkout's unrelated dirty changes were preserved.
- Build time was excluded from run time; artifacts and source/manifest identity
  were preserved.
