# T2 Day Experiment — Overnight Window Closeout

Closeout date: 2026-09-09  
Scope: progression/combat checkpoint experiments only. No balance values were changed.

## Executive result

The status sweep found no active T2-day supervisor or run. No additional replacement experiment was launched.

The admissible primary dataset contains 49 terminal runs: 35 completed and 14 valid progression stalls. All 640 treatment assertions emitted by those runs passed. The accelerated configuration (`rewardMultiplier=25`, `entryEconomy=catalyst-primed`, `mode=smoke-isolated`) is suitable for progression/combat isolation, not economy conclusions.

The literal `389d442b` prep cohort is quarantined. Its replacement that passed validation is the no-balance harness descendant `58606306`; downstream cohorts used the later no-balance route-boundary fix `045bd4fb`.

## 1. Cohort ledger

### Quarantined prep and harness cohorts

All artifacts are preserved and excluded from downstream results.

| Cohort | Terminal runs | Classification | Evidence |
|---|---:|---|---|
| `20260908t061935z-t2-day-j0-prep-2026-09-08b` | 6/6 completed | `INVALID_PREP / harness-confounded` | 0 treatment assertions; pre-fix completion short-circuited before the declared boundary; `core-tempered` was not equipped in the captured checkpoints |
| `20260908t190203z-t2-day-j0-prep-2026-09-08-fixed` | 5 completed, 1 cancelled | `INVALID_PREP / harness-confounded` | The exact `389d442b` image allowed auto-combat during Jungle transit; Squire captured Jungle XP 1554 before J0. Five completed runs had 7/7 assertions but the cohort is invalid as a whole |
| `20260908t200332z-t2-day-j0-prep-2026-09-08-corrected` | 1 failed | `INVALID_PREP / harness-confounded` | PowerShell passed six route IDs as one malformed route ID; `bot_process_exit_without_summary`; no checkpoint |

The corresponding quarantine markers are `INVALID_PREP.json` under each cohort artifact root.

### Invalid downstream harness attempts

| Cohort | Terminal runs | Classification |
|---|---:|---|
| `20260908t205432z-t2-day-frame-replication-2026-09-08` | 27 failed | `INVALID_HARNESS`: historical unowned upgrade keys (`plains-vest-t1`); no usable assertions/checkpoints |
| `20260908t210729z-t2-day-frame-replication-rerun-2026-09-0` | 5 failed, 22 cancelled | `INVALID_HARNESS`: frame-entry assertion defect; stopped and preserved |
| `20260908t211743z-t2-day-frame-replication-final-2026-09-0` | 1 failed, 26 cancelled | `INVALID_HARNESS`: Survivalist gate remained in the Jungle tail; no terminal treatment evidence |
| `20260908t213050z-t2-day-weapon-ab-apprentice-squire-live-` | 12 cancelled | `INVALID_HARNESS`: shared Survivalist gate; stopped and preserved |

These cohorts are not gameplay evidence.

## 2. Corrected J0 prep checkpoints

Cohort: `20260908t200706z-t2-day-j0-prep-2026-09-08-rerun`  
Revision: `58606306dded5f9166cc06cb914358e16a147bda`  
Image: `sha256:94f975c716ad693728bd9a813beaa997bc169608c54ed9e82bf5f28a96fc76a9`

All six runs completed. Every checkpoint was `experiment-checkpoint` / `j0`, player tier 2, with no Jungle/Desert XP or levels and no future T2 Jungle/Desert cleared nodes. The expected equipment and seven assertions were present:

| Class | Core | Frame | Weapon | Assertions/order |
|---|---|---|---|---|
| Striker | `core-tempered` | `cadence-balanced` | `ruinous-axe` | 7/7, assertions before checkpoint and run-end |
| Squire | `core-tempered` | `cooldown-heavy` | `quake-hammer` | 7/7, assertions before checkpoint and run-end |
| Apprentice | `core-tempered` | `dot-balanced` | `swamp-mirebrand` | 7/7, assertions before checkpoint and run-end |
| Slinger | `core-tempered` | `reload-heavy` | `gale-needle` | 7/7, assertions before checkpoint and run-end |
| Spirit | `core-tempered` | `energy-heavy` | `ruinous-axe` | 7/7, assertions before checkpoint and run-end |
| Conduit | `core-tempered` | `summoner-balanced` | `ruinous-axe` | 7/7, assertions before checkpoint and run-end |

J0 prep metrics: 6/6 completed; duration median 21.54 minutes, range 13.76–24.83; deaths median 3, range 0–9; 22 total deaths; 42/42 assertions passed.

## 3. D0/Core checkpoints

Cohort: `20260908t215750z-t2-day-d0-checkpoints-postfix-2026-09-08`  
Revision: `045bd4fbdbeb877221e1434be70cde21441961b0`

| Class | Result | Checkpoint state | Assertions/order |
|---|---|---|---|
| Apprentice | completed | J6, Desert 0/absent; `core-tempered` equipped; `core-survivalist` in inventory; `dot-balanced` + `swamp-mirebrand` | 15/15 before `checkpoint:d0` and run-end |
| Conduit | completed | J6, Desert 0/absent; `core-tempered` equipped; `core-survivalist` in inventory; `summoner-balanced` + `ruinous-axe` | 15/15 before `checkpoint:d0` and run-end |
| Spirit | completed | J6, Desert 0/absent; `core-tempered` equipped; `core-survivalist` in inventory; `energy-heavy` + `ruinous-axe` | 15/15 before `checkpoint:d0` and run-end |
| Squire | **STALLED** | J3; no D0 checkpoint; goal was `core-survivalist` unlocked | 7/7 entry assertions passed; no checkpoint was captured |

D0 metrics: 3/4 completed; duration median 7.74 minutes, range 3.86–14.47; deaths median 0.5, range 0–2; 3 total deaths; 52/52 emitted assertions passed.

Event order, rather than equal timestamps, was used for the checkpoint gate. In every usable J0/D0 checkpoint, the final treatment assertion occurs before the checkpoint milestone, which occurs before `run-end`.

## 4. Valid frame replication

Cohort: `20260908t215653z-t2-day-frame-replication-postfix-2026-09`  
Runs: 17/27 completed (62.96%); 10/27 `STALLED` at the Jungle level-6 goal; duration median 9.47 minutes, range 4.10–17.02; deaths median 0, range 0–6; 31 total deaths; 378/378 assertions passed.

The table gives all three replicate outcomes as final Jungle level and deaths (`C` = completed, `S` = stalled).

| Route | Completion | Duration median/range (min) | Deaths median/range | Replicates |
|---|---:|---:|---:|---|
| Striker light | 3/3 | 8.95 / 7.29–12.98 | 3 / 2–6 | C/J6/D2; C/J6/D3; C/J6/D6 |
| Striker balanced | 1/3 | 13.87 / 8.73–15.45 | 0 / 0–3 | S/J5/D0; S/J2/D0; C/J6/D3 |
| Striker heavy | 2/3 | 10.74 / 6.26–14.21 | 1 / 0–2 | C/J6/D2; S/J2/D0; C/J6/D1 |
| Squire light | 2/3 | 8.46 / 4.95–14.59 | 0 / 0–0 | S/J2/D0; C/J6/D0; C/J6/D0 |
| Squire balanced | 0/3 | 15.70 / 14.56–16.04 | 0 / 0–0 | S/J5/D0; S/J3/D0; S/J4/D0 |
| Squire heavy | 1/3 | 14.56 / 4.10–15.96 | 0 / 0–0 | S/J5/D0; C/J6/D0; S/J3/D0 |
| Conduit light | 2/3 | 7.33 / 6.79–17.02 | 1 / 0–2 | S/J4/D0; C/J6/D2; C/J6/D1 |
| Conduit balanced | 3/3 | 8.32 / 4.26–11.57 | 2 / 0–4 | C/J6/D4; C/J6/D0; C/J6/D2 |
| Conduit heavy | 3/3 | 8.91 / 6.51–9.47 | 2 / 1–2 | C/J6/D2; C/J6/D1; C/J6/D2 |

Replicate consistency is strong for Striker light, Conduit balanced/heavy, and weak for Squire balanced and the mixed Striker/Squire arms. Every stall had valid treatment state and passed assertions; these are progression outcomes, not harness invalidations.

## 5. Valid weapon A/B

Cohort: `20260908t215707z-t2-day-weapon-ab-apprentice-squire-postf`  
Runs: 9/12 completed (75%); 3/12 `STALLED`; duration median 7.83 minutes, range 4.50–17.52; deaths median 0, range 0–2; 6 total deaths; 168/168 assertions passed.

| Route | Completion | Duration median/range (min) | Deaths median/range | Replicates |
|---|---:|---:|---:|---|
| Apprentice / `swamp-mirebrand` | 3/3 | 6.41 / 5.75–9.67 | 1 / 0–2 | C/J6/D1; C/J6/D2; C/J6/D0 |
| Apprentice / `quake-hammer` | 3/3 | 8.47 / 6.81–16.72 | 0 / 0–1 | C/J6/D0; C/J6/D0; C/J6/D1 |
| Squire / `quake-hammer` | 1/3 | 15.40 / 4.50–17.52 | 0 / 0–1 | C/J6/D0; S/J5/D0; S/J5/D1 |
| Squire / `ruinous-axe` | 2/3 | 7.20 / 4.82–14.74 | 0 / 0–1 | C/J6/D0; C/J6/D1; S/J3/D0 |

The Squire result trends toward better completion with `ruinous-axe` than `quake-hammer` (2/3 versus 1/3), but n=3 and the shared Jungle wall make this a follow-up signal, not a balance conclusion. Apprentice completed all six weapon runs.

## 6. Contagion, Survivalist, and remaining Core experiments

No valid Contagion or Survivalist follow-on treatment run started. The D0 Core-boundary validation is reported above.

- Contagion A/B: current post-fix cohort `20260908t215737z-t2-day-contagion-ab-postfix-2026-09-08` remained `not-started` with 16 queued runs.
- Spirit/Conduit weapon A/B: `20260908t215723z-t2-day-weapon-ab-spirit-conduit-postfix-` remained `not-started` with 12 queued runs.
- Survivalist: Apprentice `20260908t223254z-t2-day-survivalist-apprentice-postfix-20`, Conduit `20260908t223749z-t2-day-survivalist-conduit-postfix-2026-`, and Spirit `20260908t224430z-t2-day-survivalist-spirit-postfix-2026-0` each remained `not-started` with 4 queued runs.

Their validated D0 source checkpoints exist, but no treatment results should be inferred from the queued manifests.

## 7. Invalid treatment/tooling versus gameplay

No admissible J0, D0, frame, or weapon run had a failed treatment assertion. The four `INVALID_HARNESS` cohorts and three `INVALID_PREP` cohorts are runner/harness classifications and remain excluded; their failures are not gameplay evidence. The 14 stalls in the admissible primary set passed their emitted assertions and are therefore classified as gameplay/progression outcomes.

## 8. Genuine progression walls

The valid stalls all terminated on the declared no-progress guard, not on assertion or import failure:

- Frame replication: 10 runs stalled farming `node-t2-jungle-04` for `jungle level >= 6`. Final Jungle levels were J2–J5 for the stalled runs.
- Weapon A/B: two Squire `quake-hammer` runs stalled at J5 and one Squire `ruinous-axe` run stalled at J3, with the same J6 goal.
- D0: Squire stalled at J3 while farming for `core-survivalist` unlock, so no D0 checkpoint was admitted.
- Post-fix diagnostic probe: Striker balanced stalled at J2 after 14/14 assertions passed.

These walls are valid progression/combat observations. They are not evidence that a balance value should be changed.

## 9. Planned cohorts that did not run

There were 17 materialized `not-started` manifests containing 172 queued run records. None has gameplay evidence; all are runner/orchestration non-runs. The groups were:

- `20260908t205608z` D0 (4), `20260908t205621z` Apprentice/Squire weapon (12), `20260908t205637z` Contagion (16), `20260908t205654z` Spirit/Conduit weapon (12): 44 queued runs from the first 586 harness iteration.
- `20260908t210902z` D0 (4), `20260908t210917z` Apprentice/Squire weapon (12), `20260908t210933z` Contagion (16), `20260908t210951z` Spirit/Conduit weapon (12): 44 queued runs from the snapshot-import-fix iteration.
- `20260908t211844z` D0 (4), `20260908t211859z` Apprentice/Squire weapon (12), `20260908t211912z` Contagion (16), `20260908t211927z` Spirit/Conduit weapon (12): 44 queued runs from the assertion-fix iteration.
- Current post-fix Spirit/Conduit weapon (12), Contagion (16), and the three Survivalist cohorts (4 each): 40 queued runs.

Five additional directories never materialized a state/manifest and therefore contain zero runs: `20260908t061752z-t2-day-j0-prep-2026-09-08`, `20260908t210836z-t2-day-d0-checkpoints-rerun-2026-09-08`, `20260908t210839z-t2-day-weapon-ab-apprentice-squire-rerun`, `20260908t210842z-t2-day-contagion-ab-rerun-2026-09-08`, and `20260908t210845z-t2-day-weapon-ab-spirit-conduit-rerun-20`.

The queue stopped advancing across cohort manifests after the available workers were consumed by the valid frame and weapon cohorts. This is an experiment-runner/orchestration issue, not a gameplay result.

## 10. Recommended next experiments before any balance change

1. Repair the cross-cohort queue controller: durable queue state, explicit launch/resume ownership, and a closeout ledger that distinguishes `not-started` from run failure. Do not auto-retry the 14 valid stalls.
2. Run one route per pending Contagion and Survivalist arm as a readiness gate from the validated J0/D0 checkpoints, asserting equipment, frame, progression, and assertion-before-termination order before scaling to replicates.
3. Complete the missing Spirit/Conduit weapon, Contagion, and Survivalist cohorts with the corrected route boundaries. Use real 1x Snapshot B inputs for economy questions; keep 25x/catalyst-primed results labeled progression/combat-only.
4. Investigate the Squire J3–J5 wall and the variable Striker/Squire frame outcomes through combat, route-step, and resource telemetry. Replicate the diagnostic at fixed n before considering any balance adjustment.

## Artifact roots

- Valid J0: `C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260908t200706z-t2-day-j0-prep-2026-09-08-rerun`
- Valid D0: `C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260908t215750z-t2-day-d0-checkpoints-postfix-2026-09-08`
- Valid frame replication: `C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260908t215653z-t2-day-frame-replication-postfix-2026-09`
- Valid weapon A/B: `C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260908t215707z-t2-day-weapon-ab-apprentice-squire-postf`
- All other preserved cohorts: `C:\Users\osaif\AppData\Local\mmo-idle\experiments`
