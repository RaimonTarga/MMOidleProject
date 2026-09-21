# Farming stance 01 — prepared experiment

Preparation requested on 2026-09-21 from `FARMING_STANCE_NEXT_EXPERIMENT_ASTRA.md`.
The attachment describes preparation followed by a later execution/reporting
assignment. This delivery prepares that assignment; it does not launch it, create
a Luna task, deploy, or publish remotely. Combat observations so far: **0/24**.

## Fixed source and R2 adoption

Execution source: **`f9dcde59217770390752f3ce0f089e323b0a6f37`**.
Source-byte hash: `11336e6885a6af9bfa4e88b09c8d01c8c11420d5186e8ecbd2e7a4c4d79a945c`.
The source commit is local on `develop`; source and later publication SHAs must be
reported separately. The detached execution checkout is
`C:/Users/osaif/AppData/Local/mmo-idle/fs01-0921`. Dependencies were installed there
with `pnpm install --offline --frozen-lockfile`; Node is `v22.16.0`.

Normal production tuning now adopts exactly the measured R2: Light nominal
2,000 ms, Balanced 2,500 ms, final Light/Balanced floor 1,500 ms. R1's far x0.85
and Kilnmaster x0.80 are preserved once. Root/Heavy, HP payment and safety floor,
queue healing, FIFO, slot weights, summon HP, damage and relics are unchanged.
No existing formation is reset. Source adoption does not imply deployment.

[R2 equivalence](r2-equivalence.json) checks the actual sealed historical source
`59c895b3979dbe5867e21c9b81bdffdfb17d7c9c`, installs its measured four-value R2
overlay only in the validation process, and compares 768 profiles, including
384 unchanged Root/Heavy combinations. All 12 saved candidate-R2 applied receipts
match current runtime, including slots/HP costs, relic/floor composition and tick
quantization. A temporary sentinel floor proves the server profile consumes the
same shared tuning instance; it is restored in `finally`. Zero World ticks.
Historical R1/R2 artifacts and their transport meanings remain unchanged.

## Frozen matrix

| Stable identity | Original fixture | Contrasting fixture |
| --- | --- | --- |
| breadth-t3-striker-balanced | node-t3-volcanic-03 | node-t3-tundra-03 |
| breadth-t3-squire-balanced | node-t3-volcanic-03 | node-t3-tundra-03 |
| breadth-t3-apprentice-balanced | node-t3-volcanic-03 | node-t3-tundra-03 |
| breadth-t3-conduit-balanced | node-t3-volcanic-03 | node-t3-tundra-03 |
| breadth-t3-conduit-heavy | node-t3-volcanic-03 | node-t3-tundra-03 |
| breadth-t4-conduit-heavy-a (Covenanter) | node-t4-graveyard-03 | node-t4-desert-03 |

T3 contrast: Tundra exchanges Volcanic pressure for authored Chill/ice ecology.
T4 contrast: Desert exchanges Graveyard attrition for authored Heat and its
ranged/controller ecology. Both are current ordinary same-tier nodes, checked
against `NODE_BIOMES`; the actual child validates their populated ecology and
baked hitboxes. No enemy removal, density override or ecology/encounter treatment.

Each row has `offensive` and `defensive` arms on both fixtures: **6 × 2 × 2 = 24**.
Both stances cost **1 RP** in current shared definitions. The active and attuned
stance is replaced, preserving the complete ordered ability loadout, equipment,
upgrades, frame/range/path, Rune rules and preparation. There is no stance switching,
no Brace/Cleanse timing edit, and no ability dropped to pay RP. T3 Balanced/mid
Conduit still has no Orbit. All Conduit observations use **production-r2**;
`playerTreatment: untreated` is only the legacy no-overlay transport value.

No historical observations are reused. Seed **101003**, **100 ms** steps,
**300,000 ms** cap, end on first player death. No pilots, bosses, longer windows,
extra seeds, roster expansion, adaptive values, R3 or damage multiplier.

[Manifest](packet/manifest.json) contains the exact full cells. Observation IDs
are `stance-01-<identityId>-<fixture>-<offensive|defensive>`; comparison IDs omit
the final arm. [Identity](packet/identity.json) and [seal](packet/seal.json)
freeze source files, runtime and the hitbox artifact.

## Qualification and execution

The actual `server/scripts/ttkSurvey.ts` child is reused. Its new packet selector
only supplies these cells; existing preparation, combat, metrics and Conduit
recording stay authoritative. In this trial the child itself requires the source
contract and verifies HEAD, Node, hitboxes and every sealed source file before
constructing an arena. The outer dispatcher also checks full source identity
before/after each child and validates runtime receipts against qualification.

Qualification status and exact receipts are in [checks](checks.json),
[qualified marker](packet/qualified.json), and
[resolved builds](qualification/resolved-builds.json). The external qualification
root is `C:/Users/osaif/AppData/Local/mmo-idle/fs01-data/qualification`.
Qualification sets up each real fixture and checks loadouts without ticking
combat. Its `qualified` status is not a survival or throughput result.

**24/24 actual children qualified; 0 failures; 0 combat observations.** Pairwise
applied receipts and initial ecology hashes match. A deliberately invalid source
hash was rejected by the actual child before arena/output creation. Seven focused
tests, full typecheck including benches, shared build and server TypeScript build
passed. Full-suite and live playtest status: **not run**.

| Identity (both stances, both fixtures) | RP used / budget | Effective reconstruction / tick-quantized |
| --- | --- | --- |
| T3 Striker Balanced | 33 / 38 | not applicable |
| T3 Squire Balanced | 33 / 38 | not applicable |
| T3 Apprentice Balanced | 36 / 38 | not applicable |
| T3 Conduit Balanced | 33 / 38 | 2,500 / 2,500 ms |
| T3 Conduit Heavy | 36 / 38 | 3,920 / 4,000 ms |
| T4 Covenanter | 43 / 47 | 5,600 / 5,600 ms |

Covenanter's Colossus Heart frequency penalty composes before the unchanged Heavy
floor. Full signed relic factors are retained in each receipt.

When separately assigned to execute, run these exact PowerShell commands:

```powershell
Set-Location 'C:/Users/osaif/AppData/Local/mmo-idle/fs01-0921'
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/farming-stance.mjs --mode=verify "--packet=C:/Users/osaif/Documents/Claude/Projects/MMO idle/reports/player-fast-pass/farming-stance-01-preparation/packet"
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/farming-stance.mjs --mode=run "--packet=C:/Users/osaif/Documents/Claude/Projects/MMO idle/reports/player-fast-pass/farming-stance-01-preparation/packet" --out=C:/Users/osaif/AppData/Local/mmo-idle/fs01-data/run-01
```

Do not execute from the publishing checkout or rebuild/reseal against a newer
HEAD. The dispatcher derives all 24 actual child commands from the sealed cells:

```text
node <frozen server-resolved tsx/cli> --conditions=development scripts/ttkSurvey.ts
  --trial=farming-stance-01 --block=<observationId> --mode=run
  --revision=f9dcde59217770390752f3ce0f089e323b0a6f37
  --source-contract=<absolute packet/identity.json>
  --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json
  --out=C:/Users/osaif/AppData/Local/mmo-idle/fs01-data/run-01/<observationId>
```

Children run sequentially from the frozen checkout's `server` directory. Both
fresh output and no prior `run-launched.json` are mandatory. No retries or overwrites.
The first operational/readback failure stops the shared ordinary-farm family;
remaining rows stay explicitly not-run. This matrix contains no independent
second runner family. Deaths and caps with valid receipts are completed gameplay
observations. Preserve all failed logs; a repair would require a new assignment
and separately rooted packet. Source drift fails closed and must not be resealed.

## Expected artifacts and later report

The output root contains `manifest.json`, `identity.json`, `results-summary.json`,
`resolved-builds.json`, `raw-inventory.json`, and `complete.json` or `partial.json`.
Each observation directory has `process.json` (the exact argv), `process.log`,
`manifest.json`, `index.json`, `complete.json` and, on child failure, `failed.json`.
Successful measured details are under `<observationId>/<observationId>-s101003/`:
`ready.json`, `summary.json`, `events.jsonl`, `samples.jsonl`, and Conduit's
`conduit.json`. `conduit.json` carries replacement lives, payments, queue healing
and useful-delivery evidence. Relative pointers live in each compact row.

`results-summary.json` includes the experiment/source/hash identities, seed/cap,
planned/completed/failed/not-run counts, local publication status, stable build,
arm/comparison, fixture and effective reconstruction factors/intervals; outcomes,
elapsed time, kills, unfinished damaged targets, minimum HP fraction, observed
HP-regain counts, sampled static-feature contacts, Conduit authored-offense/zero-body/
ready-HP-blocked exposure and relative evidence paths. Missing values are null
with reasons. Static contacts are sampled once per second, not continuous
duration or incoming-target contacts. Never infer contact from episode membership.

The execution assignment should produce `REPORT.md` and the compact result at
`reports/player-fast-pass/farming-stance-01-run-01/` in a publishing checkout,
copy necessary small JSON/process evidence with the same relative paths, and
preserve raw streams separately at the external run root. Retain the raw inventory
and record that root in the report. Update publication status honestly and return
source SHA, publication SHA, branch and report path after the requested scoped
commit/push. No publish action is authorized or performed by this preparation.

Report paired survival, completed kills and unfinished/regained progress by
identity and fixture. A death-shortened rate is not sustainable throughput; a cap
is not a kill. Quantify the throughput tradeoff without inventing a tolerability
threshold or declaring every package a winner. Availability is authored formation
weight, not DPS. These are synthetic mature-package results, not economy or live
player validation. T4 Slinger heavy-a remains a queued item/path outlier review.

## Existing evidence reviewed during preparation

[Historical excerpts and raw hashes](historical-evidence.json) point to the
existing summaries/recorders and external terminal samples; no reruns were made.

| Historical case | Outcome / elapsed | Kills / unfinished / regained | Mean live authored offense | Zero bodies / HP-blocked | HP paid / queue healing |
| --- | --- | --- | --- | --- | --- |
| T3 Balanced R2 | death / 115 s | 3 / 10 / 6 | 49.53% | 12.4 s / 0 s | 814 / 799.13 |
| Marshal R1 | cap / 300 s | 35 / 0 / 4 | 69.05% | 15.6 s / 0 s | 1,980 / 1,905.35 |
| Marshal R2 | cap / 300 s | 32 / 11 / 17 | 75.17% | 13.1 s / 0 s | 2,244 / 1,903.48 |
| T3 Heavy historical | death / 66.2 s | 3 / 6 / 4 | 91.24% | 3.6 s / 0 s | 166 / 67.77 |
| Covenanter historical | death / 71.7 s | 10 / 1 / 0 | 100% | 0 s / 0 s | 0 / 0 |

T3 Balanced mixes formation loss, payments and owner pressure (1,022 recorded
incoming HP damage); no cleared-episode recovery entry was recorded. Zero
ready-HP-blocked time does not make HP costs harmless, and queue healing totals
cannot be treated as a counterfactual refund. The terminal zero-minion sample is
after owner death and is not proof of a pre-death total formation wipe.

Marshal R2 had better availability but fewer kills and more unfinished/regained
targets, plus one recorded recovery interruption versus none for R1. This supports
examining delivery/persistence; it does not establish a particular AI bug. Its
last sample still has six bodies, full owner HP and no selected target, with last
outgoing damage at 293.2 s; that sample alone cannot explain all lost progress.

T3 Heavy's last sample at 66.0 s has two bodies and damage at 66.0 s while the
owner is nearly dead. Covenanter has both bodies at 71.0 s, last damage at 70.7 s,
1,237.3 recorded incoming HP damage and six recorded recovery interruptions;
its recorder reports no reconstruction hypothesis exposure. These support the
stance/owner-defense question without extending reconstruction tuning. The last
sampled static-contact arrays are empty, which is not evidence of no earlier
hazard contact. No localized implementation defect was established in this review.

After measurement: retain a practical defensive reference if survival improves
at an acceptable measured cost; if intact formations accompany deaths in both
stances, stop reconstruction edits and identify the specific defense/delivery
mechanism; keep ecology-specific failures local; use existing traces to specify
one persistence correction if survival still loses progress. No outcome starts
another experiment automatically; return the result to the command center.
