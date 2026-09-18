# Durability26 — selected T4 anchor HP trial and bounded Mountain T2 pressure review

Date: 2026-09-17  
Status: complete; sealed synthetic screen and read-only Durability25 death audit completed; no production balance edit authorized  
Decision scope: whether doubling the selected T4 primary body HP can repair the Durability25 T3-to-T4 pacing reversal without creating unacceptable pressure or tail behavior

## Executive result

Durability26 executed the packet-defined matrix once and sequentially on the frozen checkout. The runner exited 0. Both biome blocks verified, all 48 cells and 144 observations were retained, every expected block had three seeds, and no retry, relaunch, adaptive build, source edit, balance edit, cap extension, service, commit, or push was introduced.

- Mountain: 24 cells / 72 observations; 69 window-ended and 3 player-died; 0 wall-ceiling observations.
- Desert: 24 cells / 72 observations; 72 window-ended and 0 player-died; 0 wall-ceiling observations.
- READY/build contract: 144/144 synthetic views; 72/72 control-candidate geometry pairs matched; all paired initial-stat attack, plating, and damage-reduction products matched; the expected roster-hash difference was the selected body HP only.
- Primary body timing: the fresh equal-root median rose from 15.88s to 32.79s in Mountain and from 13.00s to 23.50s in Desert. All six roots rose in both biomes. The Durability25 T3 references were 25.27s and 22.10s respectively, so the Mountain candidate overshot that reference while Desert landed near it at the aggregate level.
- The Mountain candidate created three deaths, dropped the run-level minimum HP to 0%, increased pooled incoming damage exposure from 475.27 to 565.12 per 100 simulated seconds, and increased sampled three-plus-pursuer pressure from 19s to 58s. The deaths were caused by unchanged Cragback Rhino and Avalanche Tyrant attacks, not by a changed candidate attack or defense layer.
- Desert had no deaths and slightly lower normalized incoming damage, but the candidate still produced a 65.30s Dune Basilisk tail and a 64.20s Conduit root center. The aggregate improvement is therefore not a uniform role result.

Disposition: **adjust both primary candidates before any production adoption**. Retain the Mountain Mammoth and Desert Basilisk doubles as bounded upper-bound evidence, not as shippable values. Do not compensate damage automatically; the current screen isolates body HP and shows that pressure, pull cadence, and long tails need a separate review.

## Frozen identity and execution

| Item | Value |
| --- | --- |
| Operator packet | [bot-balance-durability26-operator-packet.md](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-durability26-operator-packet.md>) |
| Frozen revision | `9c333816f4e81f73bbc984a0fc62e0bcbd5603ba` |
| Frozen branch retained | `codex/durability26-frozen` |
| Frozen source tree | `c86a7520b2af038ae0eee284030019273d013154` |
| Definitions SHA-256 | `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0` |
| Hitboxes SHA-256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Detached checkout | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/source` |
| Results root | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/results` |
| Readiness receipts | `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability26` |
| Trial / mode | `durability26` / `run` |
| Seeds | `62003, 64007, 66029` |
| Matrix | 48 cells / 144 observations / Mountain + Desert / T4 / control + candidate |
| Timestep / maximum | 100ms / 600 simulated seconds; first death |
| Synthetic / economy eligible | true / false |
| Batch start | `2026-09-17T14:30:20.732Z` |
| Mountain ledger interval | `2026-09-17T14:30:20.733Z`–`2026-09-17T14:53:18.727Z` |
| Desert ledger interval | `2026-09-17T14:53:21.011Z`–`2026-09-17T14:58:16.217Z` |
| Batch ended marker | `2026-09-17T14:58:18.158Z` |
| Operator exit marker | `2026-09-17T14:58:18.1973121Z` |
| Batch wall time | `1,677,426ms` / `27m 57.4s` |
| Runner exit | `0`; one sequential run; no retry or relaunch |

The preflight verified the frozen revision, retained branch, source tree, launcher, definitions hash, and hitboxes hash. Offline dependencies completed successfully. The detached source remained clean at the frozen revision after the run. The shared checkout was already dirty with unrelated user changes, including `docs/README.md`; those changes were preserved. No production files were changed, and no full repository suite or live/browser playtest was run for this packet.

## Completion and pooled audit

`WE/PD/WC` means window-ended / player-died / wall-ceiling observation outcomes. `K/U/R` means unique target kills / unfinished target records / records with observed HP regain. `P;3+` means peak player pursuers maximum and median, followed by sampled seconds with at least three pursuers. `C/U` in the episode column means cleared / unfinished episodes. Incoming damage is monster-to-player event damage summed from the raw streams and normalized by simulated time; it is not player DPS.

| Block / arm | Runs | WE/PD/WC | Target records | K/U/R | Clean N | Min HP median / low | Incoming damage | Incoming / 100 sim s | Recovery interruptions | P;3+ | Late joins | Q | Episodes; C/U | Simulated seconds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mountain control | 36 | 36/0/0 | 1,597 | 1,554/43/61 | 1,510 | 57.869% / 6.701% | 102,657.76 | 475.27 | 360 | 3 / 2; 19s | 484 | 1 | 1,118; 1,089/29 | 21,600.0 |
| Mountain candidate | 36 | 33/3/0 | 1,181 | 1,099/82/108 | 1,048 | 49.505% / 0% | 116,681.67 | 565.12 | 248 | 4 / 2; 58s | 597 | 2 | 601; 571/30 | 20,647.2 |
| Desert control | 36 | 36/0/0 | 1,640 | 1,540/100/218 | 1,384 | 44.325% / 0.897% | 437,079.39 | 2,023.52 | 25 | 5 / 3; 325s | 1,274 | 0 | 401; 369/32 | 21,600.0 |
| Desert candidate | 36 | 36/0/0 | 1,452 | 1,356/96/209 | 1,197 | 48.730% / 23.801% | 433,554.60 | 2,007.20 | 2 | 4 / 3; 407s | 1,212 | 0 | 293; 257/36 | 21,600.0 |

The verification receipts report 24 cells / 72 runs and zero wall-censored runs for each block; `completeWindows` is 69 for Mountain and 72 for Desert. The 30 Mountain candidate unfinished episodes and 36 Desert candidate unfinished episodes include target or episode censoring at the 600s observation limit; they are not wall-ceiling observations.

## Measurement rules and evidence boundary

The primary estimator is the packet-defined body-TTK calculation from each block's `night5-audit.json`: clean eligible body medians are computed per seed and then reduced across seeds. Observed HP-regain targets, unfinished targets, and long-quiet rows are excluded from the headline clean estimator. A seed with no eligible primary target is `I`, never zero. `D` marks a player-died run; a clean body timing that exists before that death remains visible. `Q` marks a retained long-quiet row excluded from the outer median.

The equal-root summary takes the eligible primary-species median per node, then the median of the two nodes, then gives each of the six roots equal weight. The Durability25 T3 values below are a numeric reference from the earlier packet, not a same-seed counterfactual for this fresh run. The fresh control and candidate share the same seed labels within each pair, and their geometry receipts match.

Body TTK starts at the first damaging hit on the selected body and ends at that body's kill. It is not a pack duration. Actual pack durations below use `index.json` episode `startMs`, `endMs`, `durationMs`, `outcome`, `initialMembers`, `members`, and `lateJoiners`. Long chains usually begin with one member and accumulate late joiners; they are not simultaneous swarms.

The run uses the packet's synthetic +5 gear, restored process-local setup, normal targeting, and no services, economy, farming, acquisition, progression, travel, respawn, manual input, or live player state. It cannot certify live balance, browser readability, pacing feel, or invited-playtest readiness.

## READY setup, paired geometry, and actual products

The READY audit found 144/144 expected views and 48 unique expected cells. All views were `synthetic=true`. The 72 control-candidate pairs matched `geometryRosterHash` exactly. All paired `initialStats` attack, plating, damage-reduction, and type fields matched; all 72 paired full roster hashes differed as expected because the selected body HP changed. No unexpected gear, technique, guard, targeting, roster, class, or node mismatch was found.

Both arms used the same prepared T4 branch-A builds: medium/native range, +5 biome armor and charm, Mountain boots where applicable, Tempered Core, Colossus Heart, normal targeting, Offensive stance, Sweep, Second Wind, Cleanse, and the existing selected balanced roots. Candidate-only changes were Granite Mammoth HP in Mountain or Dune Basilisk HP in Desert. No attack, plating, damage reduction, ability cadence, other shield, ecology, or build change was introduced.

### Declared candidate treatment

The control is the selected Durability25 T4 baseline, not the original low-HP production product. The static selected-package comparison is:

| Area | Primary body | Durability25 control HP | Durability26 candidate HP | Other numeric change |
| --- | --- | ---: | ---: | --- |
| Mountain | Granite Mammoth | 6,900 | 13,800 | Low-health ward percentage halves again so absolute ward capacity remains 287.5 at the static package level |
| Desert | Dune Basilisk | 4,503 | 9,006 | No ward, attack, plating, damage reduction, ability, or ecology change |

The source contract's static Granite Mammoth ward capacity is `1,150 × 25% = 287.5`. Durability25 control uses `6,900 × 1/24 = 287.5`; Durability26 candidate uses `13,800 × 1/48 = 287.5`. Actual node modifiers produce 345 ward capacity at Mountain node03 for both arms and 287.5 at node05 for both arms.

### Actual READY HP / attack / plating / damage reduction

Values are `initialRoster maxHp / initialStats attack / plating / damage reduction`. These were stable across class variants and seeds within each node and arm.

| Area / node | Control product | Candidate product | Unchanged supporting products |
| --- | --- | --- | --- |
| Mountain node03 | Granite Mammoth `8,280 / 258 / 0 / 10%` | Granite Mammoth `16,560 / 258 / 0 / 10%` | Cragback Rhino `7,920 / 158 / 19 / 15.4%`; Cliffside Roc `2,040 / 251 / 0 / 10%`; Avalanche Tyrant `1,920 / 203 / 0 / 10%` |
| Mountain node05 | Granite Mammoth `6,900 / 258 / 0 / 0%` | Granite Mammoth `13,800 / 258 / 0 / 0%` | Cragback Rhino `6,600 / 158 / 16 / 6%`; Cliffside Roc `1,700 / 251 / 0 / 0%`; Avalanche Tyrant `1,600 / 203 / 0 / 0%` |
| Desert node03/node05 | Dune Basilisk `5,404 / 126 / 12 / 22.6%` | Dune Basilisk `10,807 / 126 / 12 / 22.6%` | Sand Viper `4,835 / 109 / 0 / 17.2%`; Dune Tyrant `8,342 / 196 / 10 / 17.2%`; Sandspitter Cobra `683 / 210 / 0 / 10%` |

The Desert READY product is `5,404 → 10,807` because the node/runtime product is integer-rounded; the static treatment declaration is `4,503 → 9,006`. The artifacts, rather than the static overlay declaration, are authoritative for the products used in combat.

## Primary body timing by seed

Each row is the packet's primary role: Mountain Granite Mammoth and Desert Dune Basilisk. Values are clean per-seed medians in seconds. `D` is a player-died run, `Q` is a retained long-quiet row excluded from the outer median, and `I` has no clean eligible primary target. The outer median has at least two eligible seeds in every row.

### Mountain Granite Mammoth

| Node / root | Control 62003 | Control 64007 | Control 66029 | Control outer | Candidate 62003 | Candidate 64007 | Candidate 66029 | Candidate outer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| node03 / Striker | 10.70 | 10.70 | 10.65 | 10.70 | 22.90 D | 20.80 | 20.85 D | 20.85 |
| node03 / Squire | 31.60 | 31.60 | 31.70 | 31.60 | 61.00 | 60.30 | 63.05 | 61.00 |
| node03 / Apprentice | 10.20 | 10.20 | 8.40 | 10.20 | 18.95 | 19.85 | 20.00 | 19.85 |
| node03 / Slinger | 16.50 | 17.50 | 15.10 | 16.50 | I | 31.90 | 34.50 | 33.20 |
| node03 / Conduit | 20.20 Q | 20.15 | 20.35 | 20.25 | 57.40 | 57.40 | 61.55 | 57.40 |
| node03 / Spirit | 13.30 | 26.60 | 26.80 | 26.60 | 32.60 | 25.55 Q | 51.95 | 42.28 |
| node05 / Striker | 7.90 | 8.10 | 8.00 | 8.00 | 15.40 | 16.00 D | 15.70 Q | 15.70 |
| node05 / Squire | 24.30 | 24.20 | 25.20 | 24.30 | 50.70 | 48.90 | 48.50 | 48.90 |
| node05 / Apprentice | 7.20 | 7.20 | 7.20 | 7.20 | 13.80 | 13.80 | 13.80 | 13.80 |
| node05 / Slinger | 12.90 | 12.90 | 12.80 | 12.90 | 24.90 | 25.80 | 25.00 | 25.00 |
| node05 / Conduit | 13.85 | 13.80 | 18.40 | 13.85 | 28.80 | 29.75 | 28.75 | 28.80 |
| node05 / Spirit | 6.80 | 10.65 | 12.85 | 10.65 | 30.70 | 35.65 | 29.10 | 30.70 |

### Desert Dune Basilisk

| Node / root | Control 62003 | Control 64007 | Control 66029 | Control outer | Candidate 62003 | Candidate 64007 | Candidate 66029 | Candidate outer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| node03 / Striker | 8.30 | 8.20 | 8.05 | 8.20 | 16.35 | 16.45 | 16.80 | 16.45 |
| node03 / Squire | 26.50 | 24.60 | 25.35 | 25.35 | 49.90 | 49.60 | 48.80 | 49.60 |
| node03 / Apprentice | 5.60 | 6.00 | 5.70 | 5.70 | 12.25 | 12.40 | 12.35 | 12.35 |
| node03 / Slinger | 12.50 | 12.40 | 12.30 | 12.40 | 24.80 | 24.20 | 24.90 | 24.80 |
| node03 / Conduit | 42.00 | 44.45 | 43.75 | 43.75 | 64.90 | 66.75 | 65.30 | 65.30 |
| node03 / Spirit | 13.80 | 14.30 | 8.45 | 13.80 | 24.90 | 17.80 | 22.80 | 22.80 |
| node05 / Striker | 8.20 | 8.50 | 8.25 | 8.25 | 16.85 | 16.50 | 16.00 | 16.50 |
| node05 / Squire | 24.00 | 22.60 | 22.25 | 22.60 | 49.20 | 49.15 | 48.20 | 49.15 |
| node05 / Apprentice | 5.40 | 5.70 | 5.40 | 5.40 | 12.50 | 12.40 | 12.80 | 12.50 |
| node05 / Slinger | 12.40 | 12.75 | 12.40 | 12.40 | 25.85 | 24.20 | 25.10 | 25.10 |
| node05 / Conduit | 44.10 | 44.70 | 42.00 | 44.10 | 63.10 | 66.00 | 57.65 | 63.10 |
| node05 / Spirit | 13.40 | 9.15 | 17.00 | 13.40 | 21.30 | 18.45 | 28.10 | 21.30 |

### Equal-root centers and Durability25 T3 reference

The root center is the median of the two node outer medians. The T3 column is carried forward from the Durability25 report and is not a same-seed counterfactual.

| Area / root | Fresh control | Fresh candidate | Candidate - control | Ratio | Durability25 T3 reference | Candidate - T3 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mountain / Striker | 9.35 | 18.28 | +8.93 | 1.96x | 22.55 | -4.28 |
| Mountain / Squire | 27.95 | 54.95 | +27.00 | 1.97x | 30.90 | +24.05 |
| Mountain / Apprentice | 8.70 | 16.83 | +8.13 | 1.93x | 25.15 | -8.33 |
| Mountain / Slinger | 14.70 | 29.10 | +14.40 | 1.98x | 25.40 | +3.70 |
| Mountain / Conduit | 17.05 | 43.10 | +26.05 | 2.53x | 28.18 | +14.92 |
| Mountain / Spirit | 18.63 | 36.49 | +17.86 | 1.96x | 18.35 | +18.14 |
| **Mountain / equal-root overall** | **15.88** | **32.79** | **+16.92** | **2.07x** | **25.27** | **+7.52** |
| Desert / Striker | 8.23 | 16.48 | +8.25 | 2.00x | 16.82 | -0.35 |
| Desert / Squire | 23.98 | 49.38 | +25.40 | 2.06x | 24.65 | +24.73 |
| Desert / Apprentice | 5.55 | 12.43 | +6.88 | 2.24x | 21.50 | -9.08 |
| Desert / Slinger | 12.40 | 24.95 | +12.55 | 2.01x | 22.70 | +2.25 |
| Desert / Conduit | 43.93 | 64.20 | +20.28 | 1.46x | 44.15 | +20.05 |
| Desert / Spirit | 13.60 | 22.05 | +8.45 | 1.62x | 16.52 | +5.53 |
| **Desert / equal-root overall** | **13.00** | **23.50** | **+10.50** | **1.81x** | **22.10** | **+1.40** |

The body-pacing direction is therefore clear but not uniform in role outcome. Mountain's Squire, Conduit, and Spirit candidates are materially above the old T3 reference, while Striker and Apprentice remain below it. Desert's aggregate is close to T3, but Squire and Conduit overshoot while Apprentice remains materially below it.

## Supporting species and fastest/slowest tails

These are cell-level outer medians across the six class/node cells in each biome arm for each species. They are descriptive tails, not pooled DPS estimates. All 12 cells for every listed type had at least one eligible value; the primary rows above preserve the stricter seed-level eligibility markers.

| Area / species | Control median; fastest–slowest cell | Candidate median; fastest–slowest cell |
| --- | --- | --- |
| Mountain / Granite Mammoth | 13.38s; 7.20–31.60s | 29.75s; 13.80–61.00s |
| Mountain / Cragback Rhino | 15.40s; 7.20–64.00s | 16.95s; 7.20–54.45s |
| Mountain / Cliffside Roc | 3.00s; 1.70–6.55s | 3.25s; 1.90–5.30s |
| Mountain / Avalanche Tyrant | 2.95s; 1.75–7.00s | 3.20s; 1.70–5.30s |
| Desert / Dune Basilisk | 12.90s; 5.40–44.10s | 23.80s; 12.35–65.30s |
| Desert / Dune Tyrant | 18.65s; 10.20–50.25s | 16.58s; 10.30–51.40s |
| Desert / Sand Viper | 9.68s; 5.20–26.50s | 8.48s; 5.20–30.40s |
| Desert / Sandspitter Cobra | 2.30s; 1.20–8.60s | 2.08s; 0.85–8.65s |

The non-primary READY products were unchanged, but their observed TTK distributions move as the longer primary bodies reduce the number and timing of later pulls. That is why the supporting species table is retained as context rather than interpreted as a direct HP treatment effect.

## Per-specialization/node audit

`K/U/R` is unique kills / unfinished targets / observed HP-regain records for the six observations in the cell. `Clean` is the clean target-record count used by the built-in descriptive audit. This table keeps every specialization and node visible beside the primary timing table.

### Mountain

| Node / root | Control deaths | Candidate deaths | Control K/U/R; clean | Candidate K/U/R; clean | Control recovery interruptions | Candidate recovery interruptions |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| node03 / Striker | 0 | 2 | 147/2/0; 147 | 65/4/0; 65 | 95 | 42 |
| node03 / Squire | 0 | 0 | 71/2/0; 71 | 54/3/0; 54 | 30 | 22 |
| node03 / Apprentice | 0 | 0 | 163/3/5; 159 | 137/7/6; 135 | 17 | 26 |
| node03 / Slinger | 0 | 0 | 101/6/24; 81 | 56/15/27; 42 | 6 | 2 |
| node03 / Conduit | 0 | 0 | 51/6/6; 48 | 50/3/3; 47 | 1 | 2 |
| node03 / Spirit | 0 | 0 | 99/9/12; 94 | 71/11/19; 62 | 7 | 4 |
| node05 / Striker | 0 | 1 | 188/2/0; 188 | 135/2/0; 135 | 81 | 86 |
| node05 / Squire | 0 | 0 | 94/3/0; 94 | 76/1/0; 76 | 47 | 38 |
| node05 / Apprentice | 0 | 0 | 190/1/1; 189 | 155/4/12; 147 | 27 | 15 |
| node05 / Slinger | 0 | 0 | 148/2/8; 140 | 107/19/27; 97 | 14 | 0 |
| node05 / Conduit | 0 | 0 | 110/5/2; 110 | 84/4/1; 84 | 1 | 2 |
| node05 / Spirit | 0 | 0 | 192/2/3; 189 | 109/9/13; 104 | 34 | 9 |

### Desert

| Node / root | Control deaths | Candidate deaths | Control K/U/R; clean | Candidate K/U/R; clean | Control recovery interruptions | Candidate recovery interruptions |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| node03 / Striker | 0 | 0 | 196/3/0; 196 | 170/5/0; 170 | 0 | 0 |
| node03 / Squire | 0 | 0 | 99/2/0; 99 | 82/2/0; 82 | 0 | 0 |
| node03 / Apprentice | 0 | 0 | 173/4/17; 158 | 148/12/27; 128 | 11 | 0 |
| node03 / Slinger | 0 | 0 | 106/17/47; 72 | 82/14/36; 56 | 0 | 0 |
| node03 / Conduit | 0 | 0 | 59/11/17; 49 | 54/7/12; 46 | 0 | 0 |
| node03 / Spirit | 0 | 0 | 138/12/32; 115 | 136/8/27; 114 | 4 | 1 |
| node05 / Striker | 0 | 0 | 193/3/0; 193 | 168/5/0; 168 | 0 | 0 |
| node05 / Squire | 0 | 0 | 99/1/0; 99 | 78/3/0; 78 | 0 | 0 |
| node05 / Apprentice | 0 | 0 | 170/6/19; 154 | 151/5/20; 133 | 10 | 0 |
| node05 / Slinger | 0 | 0 | 115/19/43; 89 | 98/11/41; 67 | 0 | 0 |
| node05 / Conduit | 0 | 0 | 56/12/15; 46 | 49/14/16; 40 | 0 | 0 |
| node05 / Spirit | 0 | 0 | 136/10/28; 114 | 140/10/30; 115 | 0 | 1 |

## Cast, damage, and pressure exposure

The raw stream counts were normalized by the same simulated seconds used for the incoming-damage rate. Candidate Mountain has fewer cast starts per simulated time because its longer primary bodies produce fewer completed pulls, but it has higher damage exposure and more sampled multi-pursuer pressure. Candidate Desert has more cast starts and technique events per simulated time while its incoming damage rate is nearly unchanged.

| Block / arm | Raw damage events | Monster cast starts / ends | Cast starts / 100 sim s | Cast ends / 100 sim s | Technique events / 100 sim s | Incoming / 100 sim s |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mountain control | 48,255 | 773 / 743 | 3.58 | 3.44 | 68.25 | 475.27 |
| Mountain candidate | 49,380 | 598 / 584 | 2.90 | 2.83 | 78.14 | 565.12 |
| Desert control | 48,534 | 1,254 / 1,113 | 5.81 | 5.15 | 82.30 | 2,023.52 |
| Desert candidate | 52,894 | 1,342 / 1,269 | 6.21 | 5.88 | 90.04 | 2,007.20 |

### Durability26 terminal deaths

All three current-run deaths occurred in Mountain candidate Striker cells. No control or Desert run died. The killing blows came from unchanged supporting species, which is evidence of longer exposure and attrition, not evidence for changing their damage in this packet.

| Node / root / seed | Death time | Killer | Blow | Kills before death | Incoming last 10s / 30s |
| --- | ---: | --- | ---: | ---: | ---: |
| node03 / Striker / 62003 | 68.0s | Cragback Rhino | 259.0 | 4 | 1,077.00 / 1,258.00 |
| node03 / Striker / 66029 | 287.3s | Cragback Rhino | 259.0 | 21 | 1,210.25 / 1,582.25 |
| node05 / Striker / 64007 | 491.9s | Avalanche Tyrant | 228.0 | 41 | 1,063.50 / 1,124.50 |

The current packet has no damage-layer change to audit against these deaths. The correct follow-up is bounded pressure/role timing review, not automatic attack or damage-reduction compensation.

### Actual pack episode durations

The episode median and maximum values remain separate from body TTK. Candidate Mountain has fewer total episodes because longer Mammoth bodies slow the pull sequence, while its longest chain still starts with one member and accumulates late joiners. Representative terminal/window chains are:

| Block / arm | Episodes; cleared/unfinished | Median cleared episode | Longest observed episode | Long-chain shape |
| --- | ---: | ---: | ---: | --- |
| Mountain control | 1,118; 1,089/29 | 7.4s | 595.5s | Spirit node03 window-ended: 1 initial → 33 final, 32 late joiners |
| Mountain candidate | 601; 571/30 | 8.9s | 599.3s | Spirit node03 window-ended: 1 initial → 32 final, 31 late joiners |
| Desert control | 401; 369/32 | 13.3s | 598.6s | Spirit node05 window-ended: 1 initial → 43 final, 42 late joiners |
| Desert candidate | 293; 257/36 | 18.1s | 598.6s | Spirit node03 window-ended: 1 initial → 52 final, 51 late joiners |

The long chains are late-joiner sequences, not simultaneous starting swarms. They should not be converted into a universal T4 duration target or a direct class DPS ranking.

## Bounded Durability25 Mountain T2 pressure review

This section is a read-only audit of the existing Durability25 Mountain T2 artifacts at `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/mountain`. No Durability25 rerun, source change, adaptive treatment, or broad log exploration was performed.

There were 14 player deaths among the 36 Mountain T2 observations. All 14 began at full READY health and barrier. Terminal episodes often began with one member and added one or two late joiners; two cases accumulated +7 or +8 late joiners. Across the 14 death runs, there were 60 recovery interruptions in the preceding run state. Thirteen terminal 10s windows recorded a telegraph-dodge attempt followed by a safe event; one terminal window had no dodge telemetry. No death can be assigned to a failed Ground Slam escape from these records.

| Killer / damage family | Deaths | Dive/ability context | Median death time | Median kills before death | Median incoming last 10s / 30s |
| --- | ---: | --- | ---: | ---: | ---: |
| Stone Eagle melee | 9 | 3 killing blows followed a targeted Skyfall Rend dive; 6 were ordinary Eagle hits | 149.6s | 11 | 329.10 / 351.40 |
| Granite Titan melee | 3 | 3 ordinary direct Titan hits; no lethal Ground Slam attribution | 377.3s | 22 | 370.00 / 477.90 |
| Boulder Thrower ranged | 2 | 1 killing blow was 0.3s after Huge Boulder; 1 was 3.7s after the prior Huge Boulder and was an ordinary ranged hit | 395.6s | 30.5 | 363.80 / 418.30 |

The Eagle review separates charge/dive exposure from ordinary hits: the majority of Eagle killing blows were ordinary direct hits, although several runs had preceding Skyfall Rend damage and recurring Eagle pressure. The Titan and Boulder cases likewise show multiple attackers and late joins, so the killing blow is not the total cause.

### The 14 T2 deaths, retained individually

`READY` is HP plus barrier immediately before the pull. `Dodge 10s` is terminal-window attempt/safe telemetry. `Terminal episode` is initial members → final members with late joins.

| Node / class / seed | READY | Death | Killer / blow | Kills | Incoming 10s / 30s | Dodge 10s | Recovery interrupts | Terminal episode |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| node03 / Apprentice / 56003 | 254+66 | 246.9s | Boulder Thrower / 88.2 | 16 | 384.60 / 493.60 | 1/1 | 4 | 1 → 2 (+1) |
| node03 / Apprentice / 58013 | 254+66 | 19.1s | Stone Eagle / 88.2 | 1 | 363.72 / 363.72 | 1/1 | 0 | 1 → 3 (+2) |
| node03 / Conduit / 58013 | 242+63 | 362.3s | Stone Eagle / 56.0 | 20 | 268.00 / 364.00 | 0/0 | 0 | 1 → 3 (+2) |
| node03 / Spirit / 56003 | 230+129 | 212.8s | Stone Eagle / 80.0 | 14 | 243.00 / 243.00 | 1/1 | 4 | 1 → 3 (+2) |
| node03 / Spirit / 58013 | 230+129 | 328.3s | Stone Eagle / 80.0 | 20 | 251.00 / 302.00 | 1/1 | 3 | 1 → 2 (+1) |
| node03 / Spirit / 60013 | 230+129 | 142.7s | Stone Eagle / 100.0 | 5 | 243.00 / 272.20 | 1/1 | 0 | 1 → 8 (+7) |
| node05 / Apprentice / 58013 | 254+66 | 149.6s | Stone Eagle / 70.2 | 11 | 329.10 / 358.90 | 1/1 | 1 | 1 → 2 (+1) |
| node05 / Apprentice / 60013 | 254+66 | 134.8s | Stone Eagle / 70.2 | 10 | 351.40 / 351.40 | 1/1 | 1 | 1 → 9 (+8) |
| node05 / Spirit / 56003 | 230+129 | 544.3s | Boulder Thrower / 100.0 | 45 | 343.00 / 343.00 | 1/1 | 12 | 1 → 3 (+2) |
| node05 / Spirit / 58013 | 230+129 | 20.0s | Stone Eagle / 100.0 | 1 | 335.00 / 335.00 | 1/1 | 0 | 1 → 3 (+2) |
| node05 / Squire / 58013 | 296+77 | 594.4s | Granite Titan / 74.22 | 38 | 330.22 / 478.42 | 1/1 | 11 | 1 → 2 (+1) |
| node05 / Striker / 56003 | 267+69 | 377.3s | Granite Titan / 77.0 | 22 | 370.00 / 477.90 | 1/1 | 10 | 1 → 2 (+1) |
| node05 / Striker / 58013 | 267+69 | 279.9s | Granite Titan / 77.0 | 18 | 400.00 / 465.40 | 2/2 | 5 | 1 → 3 (+2) |
| node05 / Striker / 60013 | 267+69 | 378.9s | Stone Eagle / 72.0 | 22 | 447.30 / 555.82 | 1/1 | 9 | 1 → 3 (+2) |

Same-node/class survivors are retained as the comparison boundary:

| Durability25 T2 cell | Death seeds | Surviving seeds |
| --- | --- | --- |
| Mountain node03 Apprentice | 56003, 58013 | 60013 |
| Mountain node03 Conduit | 58013 | 56003, 60013 |
| Mountain node03 Spirit | 56003, 58013, 60013 | none |
| Mountain node05 Apprentice | 58013, 60013 | 56003 |
| Mountain node05 Spirit | 56003, 58013 | 60013 |
| Mountain node05 Squire | 58013 | 56003, 60013 |
| Mountain node05 Striker | 56003, 58013, 60013 | none |
| Mountain node03 Striker, Squire, Slinger; node05 Conduit, Slinger | none | all three seeds |

The T2 review supports a bounded Mountain pressure investigation, not a universal Eagle or Titan damage change. It also confirms that the candidate's current Mountain deaths should be treated as a pressure/tail warning rather than repaired with an unscoped damage scalar.

## Candidate decisions and remaining work

| Candidate | Result | Decision |
| --- | --- | --- |
| Mountain Granite Mammoth 6,900 → 13,800 | Primary equal-root center 15.88s → 32.79s; candidate T4 anchor tails reach 61.00s; 3/36 candidate deaths; normalized incoming damage and 3+ pursuer exposure rise | **Adjust.** Keep as an upper-bound probe only. A smaller or role-aware factor needs a separately authorized screen; no value is chosen here and no source adoption follows. |
| Desert Dune Basilisk 4,503 → 9,006 static package / 5,404 → 10,807 READY product | Primary equal-root center 13.00s → 23.50s; no deaths; candidate is close to Durability25 T3 overall but Squire/Conduit roots and the 65.30s Basilisk tail overshoot | **Adjust.** Retain the direction as local evidence, but do not adopt the double globally or in production. A later screen must address role spread and body/pack tails. |
| Absolute Granite Mammoth ward preservation | Static capacity 287.5 in both arms; actual node03 capacity 345 and node05 capacity 287.5 in both arms | **Retain invariant.** No ward, attack, plating, damage-reduction, ability-cadence, or support-species change is indicated. |

Retain the Graveyard normal-targeting shape and prior narrow candidates. Do not reopen the rejected universal Focus grid. The next explicitly bounded work remains:

- T4 role timing and a smaller/role-aware body factor, with body TTK and actual pack episodes kept separate.
- Mountain T2 pressure and the short-controller problem in Desert T2.
- Jungle performance/durability coverage and the Trench Stalker result below its discussion target.
- Only after those screens: production reconciliation against current source, representative bosses/progression/basic x1/ops checks, then invited-player gates. Deep item/class/ability work remains later.

No production adoption or extra run follows this report.

## Raw artifacts

- [Batch manifest](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/results/batch-manifest.json>)
- [Operator ledger](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/results/operator-ledger.jsonl>)
- [Batch ended marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/results/batch-ended.json>)
- [Operator exit marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/operator-exit.json>)
- [Mountain verification](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/results/mountain/verification.json>), [night5 audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/results/mountain/night5-audit.json>), [episode index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/results/mountain/index.json>), [analysis](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/results/mountain/analysis.json>)
- [Desert verification](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/results/desert/verification.json>), [night5 audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/results/desert/night5-audit.json>), [episode index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/results/desert/index.json>), [analysis](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/results/desert/analysis.json>)
- [Mountain raw run directory](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/results/mountain>) and [Desert raw run directory](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/results/desert>) contain every `ready.json`, `summary.json`, `events.jsonl`, and `samples.jsonl` artifact for all 144 observations.
- [Durability25 Mountain T2 raw directory](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/mountain>) was used only for the bounded read-only pressure review above.
- [Detached frozen source](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917/source>) was retained clean at the frozen revision.

## Planner disposition after review

Retain the tested Mammoth13800 and Basilisk9006 provisionally for consolidated
review, with absolute Mammoth ward unchanged. Being slower than the T3 reference
is the intended direction, not by itself an overshoot. Do not automatically reduce
all HP solely for Reverb/Marshal long tails. This does not close safety: Maestro
had3/6 candidate deaths vs0/6 controls, a specific unresolved pressure gate.
No production adoption. Durability27 addresses T2 Mountain's14/36 deaths with a
local attack80% candidate and T2 Desert's short controllers with HP1.75x; it does
not rerun T4 or authorize a general damage nerf.
