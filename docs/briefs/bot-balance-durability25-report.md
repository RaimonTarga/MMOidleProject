# Durability25 — matched Mountain and Desert tier-pacing screen

Date: 2026-09-17
Status: complete; sealed synthetic screen and read-only sample/event audit completed; no production balance edit authorized
Decision scope: whether comparable low-density roles take longer at T3 than T2 and at T4 than T3 under the frozen Mountain/Desert matrix

## Executive result

Durability25 executed the packet-defined matrix once and sequentially on the frozen checkout. The runner exited 0. All 72 cells and 216 observations were retained, both biome blocks verified, geometry and READY parity passed, and no retry, relaunch, adaptive build, source edit, balance edit, cap extension, service, commit, or push was introduced.

- Mountain: 36 cells / 108 observations; 88 window-ended target windows and 20 player-died observations; 0 wall-ceiling observations.
- Desert: 36 cells / 108 observations; 106 window-ended and 2 player-died; 0 wall-ceiling observations.
- Completeness: every expected block/tier/node/class/seed cell is present with three seeds; all 216 READY views are synthetic and every build-contract check passed.
- T2 to T3: Mountain rises for 4/6 equal-weight roots; Desert rises for 6/6. The equal-root overall median moves from 19.28s to 25.27s in Mountain and from 8.80s to 22.10s in Desert.
- T3 to T4: the generalized rise does not hold. Mountain falls for all 6 roots, 25.27s to 14.50s overall. Desert has one rising root (Squire), one near-flat/biome-split root (Spirit), and four falling roots, 22.10s to 14.61s overall.
- T4 remains role-dependent rather than a single target band. The slowest primary/anchor tails reach 49.8s for Mountain Cragback Rhino and 48.4s for Desert Dune Tyrant; these are body-TTK cell tails, not pack-clear durations.

Planner disposition: **no numeric production adjustment is supported by this screen**. The evidence is a class/root-by-tier interaction, with the T4 package often shortening body TTK despite higher authored HP and defense products. A global HP, attack, or progression scalar would confound the observed T2-to-T3 rise and T3-to-T4 reversal. If another authorized screen is needed, the smallest isolating proposal is one T4-only primary-body HP/progression factor with unchanged gear, skills, targeting, and ecology, measured separately from actual pack duration. No value is adopted here.

The packet’s pacing guides remain guardrails rather than pass/fail certification: T2 anchors are roughly around 15s, T3 elites are roughly 20–30s, and Trench’s 40–60s discussion target is not a universal T4 target. This is synthetic, non-economy evidence and is not a live-feel, browser, invited-playtest, or full-ladder certification.

## Frozen identity and execution

| Item | Value |
| --- | --- |
| Operator packet | [bot-balance-durability25-operator-packet.md](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-durability25-operator-packet.md>) |
| Frozen revision | 03a3bf24fb5799119f0e8a4c98a584a67cf8275a |
| Frozen branch retained | codex/durability25-frozen |
| Frozen source tree | 31e2f2226b63bcca85c40eea2e39c231e35f9d49 |
| Definitions SHA-256 | a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 |
| Hitboxes SHA-256 | 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83 |
| Detached checkout | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/source |
| Results root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results |
| Readiness receipts | C:/Users/osaif/AppData/Local/mmo-idle/validation/durability25 |
| Trial / mode | durability25 / run |
| Seeds | 56003, 58013, 60013 |
| Matrix | 72 cells / 216 observations / Mountain + Desert / T2–T4 |
| Timestep / maximum | 100ms / 600 simulated seconds; first death |
| Synthetic / economy eligible | true / false |
| Batch start | 2026-09-17T13:17:39.049Z |
| Batch ended marker | 2026-09-17T13:47:06.135Z |
| Operator exit marker | 2026-09-17T13:47:06.1665354Z |
| Batch wall time | 1,767,086ms / 29m 27.1s |
| Mountain ledger interval | 2026-09-17T13:17:39.051Z–2026-09-17T13:41:19.172Z |
| Desert ledger interval | 2026-09-17T13:41:22.120Z–2026-09-17T13:47:03.703Z |
| Runner exit | 0; one sequential run; no retry or relaunch |

The preflight verified the revision, retained branch, source tree, launcher, definitions hash, and hitboxes hash. Offline dependencies completed successfully. The detached source remained clean at the frozen revision after the run. The shared checkout was already dirty with unrelated user changes, including `docs/README.md`; those changes were preserved. No production files were changed, and no full repository suite or live/browser playtest was run for this packet.

## Completion and matrix audit

`WE/PD/WC` means window-ended / player-died / wall-ceiling observation outcomes. `K/U/R` means killed target records / unfinished target records / target records with observed HP regain. `P/3+/LJ/Q` means maximum player pursuers / sampled seconds with at least three pursuers / late joiners / long-quiet rows. Target `U` is per-target unfinished/censored evidence; it is not a wall-ceiling run.

| Area / tier | Cells / runs | WE/PD/WC | Target records | Unique kills | U / R | Clean records | Min HP median / low | Incoming damage | Recovery interruptions | P max / median | 3+ sampled seconds | Late joiners | Q | Episodes cleared / unfinished | Simulated seconds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mountain T2 | 12 / 36 | 22/14/0 | 1,145 | 1,109 | 36 / 8 | 1,104 | 17.471% / 0% | 66,713.91 | 234 | 3 / 2 | 17 | 137 | 2 | 982/30 | 16,991.3 |
| Mountain T3 | 12 / 36 | 34/2/0 | 1,493 | 1,471 | 22 / 6 | 1,468 | 49.450% / 0% | 88,219.93 | 353 | 3 / 2 | 15 | 393 | 1 | 1,094/23 | 21,335.4 |
| Mountain T4 | 12 / 36 | 32/4/0 | 1,603 | 1,560 | 43 / 78 | 1,496 | 44.660% / 0% | 107,021.79 | 426 | 3 / 2 | 16 | 575 | 1 | 1,001/29 | 20,624.8 |
| Desert T2 | 12 / 36 | 35/1/0 | 1,583 | 1,529 | 54 / 140 | 1,420 | 46.931% / 0% | 151,319.52 | 0 | 5 / 2.5 | 195 | 1,094 | 0 | 483/30 | 21,426.1 |
| Desert T3 | 12 / 36 | 36/0/0 | 1,217 | 1,138 | 79 / 186 | 1,001 | 46.225% / 14.590% | 299,424.60 | 0 | 5 / 3 | 249 | 1,009 | 0 | 232/32 | 21,600.0 |
| Desert T4 | 12 / 36 | 35/1/0 | 1,639 | 1,549 | 90 / 205 | 1,403 | 46.861% / 0% | 435,420.82 | 27 | 5 / 3 | 451 | 1,270 | 0 | 355/32 | 21,343.5 |
| **Total** | **72 / 216** | **194/22/0** | **8,680** | **8,356** | **324 / 623** | **7,892** | — | **1,148,120.57** | **1,040** | — | **943** | **4,478** | **4** | **4,147/176** | **123,321.1** |

The verification receipts report 36 cells / 108 runs and zero censored runs for each block; `completeWindows` is 88 for Mountain and 106 for Desert, matching the 194 window-ended observations above. The four long-quiet rows are retained but omitted from headline per-seed outer medians:

| Block / tier / node / class / seed | Outcome | Maximum quiet | Min HP | Peak pursuers | 3+ seconds | Late joiners | Recovery interruptions |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mountain T2 node03 Squire / 58013 | window-ended + long-quiet | 33.0s | 48.567% | 2 | 0 | 1 | 6 |
| Mountain T2 node03 Slinger / 60013 | window-ended + long-quiet | 161.2s | 7.743% | 2 | 0 | 6 | 8 |
| Mountain T3 node05 Conduit / 60013 | window-ended + long-quiet | 95.6s | 77.686% | 1 | 0 | 1 | 0 |
| Mountain T4 node05 Conduit / 56003 | window-ended + long-quiet | 30.2s | 78.051% | 2 | 0 | 6 | 2 |

No primary equal-root summary is inconclusive: every root/node summary retains at least two eligible seeds. Cell-level `I` values are explicitly preserved below for Mountain T2 node03 Apprentice seed58013 and Mountain T2 node05 Spirit seed58013.

## Measurement rules and evidence boundary

The primary estimator is the packet-defined body-TTK calculation from `night5-audit.json`: for each root/node/species, clean eligible body medians are computed per seed and then reduced across seeds. Targets with observed HP regain, unfinished targets, and long-quiet rows are excluded from the headline clean estimator. A seed with no eligible primary target is `I`, never zero. `D` marks a seed whose run ended by player death; a clean body timing that exists before that death remains visible and is not silently discarded.

The equal-root summary first takes the eligible primary-species median per node, then the median of the two nodes, then gives each of the six roots equal weight. It does not pool kills or give classes with more target records more influence. The same numeric seed is a repeat label, not a claim that Mountain and Desert geometry matched.

Body TTK starts at the first damaging hit on the target and ends at the target kill. It is not a pack duration. Actual pack durations below use `index.json` episode `start`, `end`, `duration`, and `outcome` fields, with initial members, late joiners, and unfinished episodes kept separate. They are descriptive encounter timelines, not class DPS rankings.

The run uses synthetic +5 gear and restored process-local setup. It has no services, economy, farming, acquisition, progression, travel, respawn, manual input, or live player state. Therefore it cannot certify live balance, browser readability, pacing feel, or invited-playtest readiness.

## READY setup, build contract, and authored products

The READY audit found 216/216 expected views and 72 unique expected cells. All 216 were `synthetic=true`. There were 36 block/tier/node/seed geometry groups, each with six class variants; within every group, geometry and initial-roster hashes matched across class variants. All 216 build-contract checks passed. There were no unexpected class, gear, technique, guard, targeting, or roster mismatches.

Every tier used the medium frame, biome armor and charm, Mountain boots, Tempered Core, Offensive stance, Sweep, Second Wind, Cleanse, normal targeting, and the packet’s +5 equipment. T3+ added the native close/medium range choice and Frenzy. T4 added Colossus Heart and branch A. T2/T3 had no HP treatment; T4 used the declared packet overlay.

| Class / root | T2 weapon / range | T3 weapon / range | T4 weapon / branch / range |
| --- | --- | --- | --- |
| Striker / cadence-root | gale-needle / 12 | volcanic-cinderlash / 12 | volcanic-eruption-lash / Maestro / 12 |
| Squire / cooldown-root | quake-hammer / 12 | mountain-avalanche-maul / 12 | mountain-warmaul / Reverb / 12 |
| Apprentice / dot-root | ruinous-axe / 72 | cave-cataclysm-axe / 72 | graveyard-plague-axe / Pyromancer / 72 |
| Slinger / reload-root | jungle-stinger-rapier / 132 | jungle-venomthorn-rapier / 132 | jungle-deathfang-rapier / Bounty Hunter / 132 |
| Conduit / summoner-root | jungle-stinger-rapier / 162 | jungle-venomthorn-rapier / 162 | jungle-deathfang-rapier / Marshal / 162 |
| Spirit / energy-root | gale-needle / 142 | volcanic-cinderlash / 142 | volcanic-eruption-lash / Equinox / 142 |

The selected paths were the packet’s cadence-balanced, cooldown-balanced, dot-balanced, reload-balanced, summoner-balanced, and energy-balanced roots; T3 added the corresponding close or mid range path; T4 added the corresponding `*-balanced-t3-a` branch. Conduit and Spirit deliberately retain their non-axe T2/T3 weapons rather than inheriting the earlier Night5A axe choice.

### Declared T4 HP overlay

| Area | Species | Before | After |
| --- | --- | ---: | ---: |
| Mountain | Avalanche Tyrant | 800 | 1,600 |
| Mountain | Cliffside Roc | 850 | 1,700 |
| Mountain | Cragback Rhino | 1,100 | 6,600 |
| Mountain | Granite Mammoth | 1,150 | 6,900 |
| Desert | Sand Viper | 1,343 | 4,029 |
| Desert | Dune Basilisk | 1,501 | 4,503 |
| Desert | Dune Tyrant | 1,738 | 6,952 |

The overlay declarations are not a substitute for the final READY view. Node modifiers and ecology can change the actual initial HP, so the products below are the authoritative per-node READY values used by the runs.

### Actual READY HP / attack / plating / damage-reduction products

Values are `initialRoster maxHp / initialStats attack / plating / damage reduction`, rounded only for display. These products were stable across the six class variants and three seeds within each block/tier/node.

| Area / tier / node | Species and actual product |
| --- | --- |
| Mountain T2 node03 | Granite Titan `1,822 / 101 / 0 / 5%`; Stone Eagle `374 / 90 / 0 / 5%`; Boulder Thrower `424 / 108 / 0 / 5%` |
| Mountain T2 node05 | Granite Titan `1,656 / 101 / 0 / 0%`; Stone Eagle `340 / 90 / 0 / 0%`; Boulder Thrower `385 / 108 / 0 / 0%` |
| Mountain T3 node03 | Mountain Colossus `5,376 / 169 / 0 / 7.5%`; Avalanche Ram `702 / 113 / 0 / 7.5%`; Crag Mortar `788 / 142 / 0 / 7.5%` |
| Mountain T3 node05 | Mountain Colossus `4,675 / 169 / 0 / 0%`; Avalanche Ram `610 / 113 / 0 / 0%`; Crag Mortar `685 / 142 / 0 / 0%` |
| Mountain T4 node03 | Granite Mammoth `8,280 / 258 / 0 / 10%`; Cragback Rhino `7,920 / 158 / 19 / 15.4%`; Cliffside Roc `2,040 / 251 / 0 / 10%`; Avalanche Tyrant `1,920 / 203 / 0 / 10%` |
| Mountain T4 node05 | Granite Mammoth `6,900 / 258 / 0 / 0%`; Cragback Rhino `6,600 / 158 / 16 / 6%`; Cliffside Roc `1,700 / 251 / 0 / 0%`; Avalanche Tyrant `1,600 / 203 / 0 / 0%` |
| Desert T2 node03/node05 | Sun Scarab `429 / 58 / 0 / 5%`; Sand Scorpion `858 / 78 / 0 / 12.6%`; Stone Basilisk `858 / 66 / 0 / 19.25%` |
| Desert T3 node03/node05 | Gilded Scarab `587 / 125 / 0 / 7.5%`; Dune Stalker `4,658 / 87 / 0 / 14.9%`; Desert Basilisk `4,658 / 104 / 0 / 21.375%` |
| Desert T4 node03/node05 | Sunshield Scarab `683 / 210 / 0 / 10%`; Sand Viper `4,835 / 109 / 0 / 17.2%`; Dune Basilisk `5,404 / 126 / 12 / 22.6%`; Dune Tyrant `8,342 / 196 / 10 / 17.2%` |

## Primary body timing by seed

Each row is the packet’s repeated primary role: Mountain `Granite Titan → Mountain Colossus → Granite Mammoth`; Desert `Stone Basilisk → Desert Basilisk → Dune Basilisk`. Seed cells are clean body medians in seconds. `D` is a player-death run, `Q` is a retained long-quiet row excluded from the headline outer median, and `I` has no clean eligible primary target. The last column is the outer median and eligible-seed count.

### Mountain primary body medians

| Tier / node / root | 56003 | 58013 | 60013 | Headline outer |
| --- | ---: | ---: | ---: | ---: |
| T2 node03 / Striker | 30.60 | 30.90 | 31.10 | 30.90s (n=3) |
| T2 node03 / Squire | 26.00 | 26.00 Q | 26.25 | 26.13s (n=2) |
| T2 node03 / Apprentice | 18.75 D | I D | 18.00 | 18.38s (n=2) |
| T2 node03 / Slinger | 14.40 | 14.40 | 14.40 Q | 14.40s (n=2) |
| T2 node03 / Conduit | 14.80 | 14.80 D | 14.75 | 14.80s (n=3) |
| T2 node03 / Spirit | 23.00 D | 23.00 D | 22.50 D | 23.00s (n=3) |
| T2 node05 / Striker | 27.60 D | 27.60 D | 28.20 D | 27.60s (n=3) |
| T2 node05 / Squire | 22.00 | 22.10 D | 22.50 | 22.10s (n=3) |
| T2 node05 / Apprentice | 15.00 | 15.75 D | 16.50 D | 15.75s (n=3) |
| T2 node05 / Slinger | 13.10 | 12.90 | 12.90 | 12.90s (n=3) |
| T2 node05 / Conduit | 12.70 | 12.70 | 12.60 | 12.70s (n=3) |
| T2 node05 / Spirit | 20.00 D | I D | 20.00 | 20.00s (n=2) |
| T3 node03 / Striker | 24.00 | 24.80 | 24.50 | 24.50s (n=3) |
| T3 node03 / Squire | 33.35 | 34.40 | 34.40 | 34.40s (n=3) |
| T3 node03 / Apprentice | 27.00 | 27.00 D | 27.00 | 27.00s (n=3) |
| T3 node03 / Slinger | 27.25 | 28.70 | 28.50 | 28.50s (n=3) |
| T3 node03 / Conduit | 31.50 | 31.25 | 31.80 | 31.50s (n=3) |
| T3 node03 / Spirit | 20.70 | 20.00 | 21.00 | 20.70s (n=3) |
| T3 node05 / Striker | 20.60 | 20.80 | 20.50 | 20.60s (n=3) |
| T3 node05 / Squire | 27.95 | 27.40 | 27.10 D | 27.40s (n=3) |
| T3 node05 / Apprentice | 23.30 | 22.50 | 24.00 | 23.30s (n=3) |
| T3 node05 / Slinger | 22.20 | 22.30 | 22.30 | 22.30s (n=3) |
| T3 node05 / Conduit | 24.80 | 24.90 | 24.80 Q | 24.85s (n=2) |
| T3 node05 / Spirit | 16.00 | 16.00 | 16.20 | 16.00s (n=3) |
| T4 node03 / Striker | 10.70 D | 10.70 | 10.65 | 10.70s (n=3) |
| T4 node03 / Squire | 31.60 | 31.60 | 31.60 | 31.60s (n=3) |
| T4 node03 / Apprentice | 10.30 D | 10.20 | 10.20 | 10.20s (n=3) |
| T4 node03 / Slinger | 15.15 | 16.40 | 16.05 | 16.05s (n=3) |
| T4 node03 / Conduit | 19.95 D | 37.60 | 19.80 | 19.95s (n=3) |
| T4 node03 / Spirit | 8.30 | 16.50 | 21.70 D | 16.50s (n=3) |
| T4 node05 / Striker | 8.30 | 8.10 | 8.10 | 8.10s (n=3) |
| T4 node05 / Squire | 23.40 | 24.70 | 25.60 | 24.70s (n=3) |
| T4 node05 / Apprentice | 7.20 | 7.20 | 7.20 | 7.20s (n=3) |
| T4 node05 / Slinger | 13.05 | 12.80 | 13.10 | 13.05s (n=3) |
| T4 node05 / Conduit | 13.80 Q | 19.05 | 13.70 | 16.38s (n=2) |
| T4 node05 / Spirit | 12.40 | 17.10 | 6.50 | 12.40s (n=3) |

### Desert primary body medians

| Tier / node / root | 56003 | 58013 | 60013 | Headline outer |
| --- | ---: | ---: | ---: | ---: |
| T2 node03 / Striker | 10.00 | 10.00 | 10.00 | 10.00s (n=3) |
| T2 node03 / Squire | 7.60 | 7.60 | 7.60 | 7.60s (n=3) |
| T2 node03 / Apprentice | 7.50 | 7.50 D | 7.50 | 7.50s (n=3) |
| T2 node03 / Slinger | 5.60 | 5.60 | 6.20 | 5.60s (n=3) |
| T2 node03 / Conduit | 20.70 | 19.95 | 19.80 | 19.95s (n=3) |
| T2 node03 / Spirit | 10.50 | 10.50 | 10.50 | 10.50s (n=3) |
| T2 node05 / Striker | 10.00 | 10.00 | 10.00 | 10.00s (n=3) |
| T2 node05 / Squire | 7.60 | 7.60 | 7.60 | 7.60s (n=3) |
| T2 node05 / Apprentice | 7.30 | 7.50 | 7.50 | 7.50s (n=3) |
| T2 node05 / Slinger | 6.35 | 5.60 | 6.50 | 6.35s (n=3) |
| T2 node05 / Conduit | 20.30 | 20.40 | 20.10 | 20.30s (n=3) |
| T2 node05 / Spirit | 10.50 | 10.50 | 10.50 | 10.50s (n=3) |
| T3 node03 / Striker | 16.75 | 17.60 | 16.70 | 16.75s (n=3) |
| T3 node03 / Squire | 25.10 | 24.70 | 24.60 | 24.70s (n=3) |
| T3 node03 / Apprentice | 21.15 | 21.80 | 21.40 | 21.40s (n=3) |
| T3 node03 / Slinger | 22.50 | 22.75 | 22.20 | 22.50s (n=3) |
| T3 node03 / Conduit | 43.50 | 44.50 | 45.10 | 44.50s (n=3) |
| T3 node03 / Spirit | 16.40 | 16.65 | 16.60 | 16.60s (n=3) |
| T3 node05 / Striker | 16.90 | 17.10 | 16.70 | 16.90s (n=3) |
| T3 node05 / Squire | 24.60 | 24.75 | 24.30 | 24.60s (n=3) |
| T3 node05 / Apprentice | 21.60 | 21.30 | 21.60 | 21.60s (n=3) |
| T3 node05 / Slinger | 23.60 | 22.90 | 22.20 | 22.90s (n=3) |
| T3 node05 / Conduit | 43.80 | 43.80 | 40.75 | 43.80s (n=3) |
| T3 node05 / Spirit | 16.45 | 16.60 | 16.40 | 16.45s (n=3) |
| T4 node03 / Striker | 8.30 | 8.20 | 8.25 | 8.25s (n=3) |
| T4 node03 / Squire | 26.25 | 25.60 | 25.15 | 25.60s (n=3) |
| T4 node03 / Apprentice | 6.40 | 6.00 | 5.65 | 6.00s (n=3) |
| T4 node03 / Slinger | 13.35 | 12.55 | 13.10 | 13.10s (n=3) |
| T4 node03 / Conduit | 42.60 | 44.05 | 43.90 | 43.90s (n=3) |
| T4 node03 / Spirit | 17.00 | 24.30 | 9.55 | 17.00s (n=3) |
| T4 node05 / Striker | 8.30 | 8.50 | 8.35 | 8.35s (n=3) |
| T4 node05 / Squire | 26.10 | 25.45 | 25.40 | 25.45s (n=3) |
| T4 node05 / Apprentice | 5.80 | 6.10 | 5.80 | 5.80s (n=3) |
| T4 node05 / Slinger | 12.50 | 12.90 | 12.55 | 12.55s (n=3) |
| T4 node05 / Conduit | 45.10 | 34.50 | 34.30 | 34.50s (n=3) |
| T4 node05 / Spirit | 6.00 | 21.00 | 15.80 D | 15.80s (n=3) |

## Tier deltas and ratios by root

The deltas are `T3 − T2` and `T4 − T3`; ratios are the corresponding later tier divided by the earlier tier. Positive TTK change means the later tier took longer.

| Area / node / root | T2 | T3 | T4 | T3−T2 / ratio | T4−T3 / ratio |
| --- | ---: | ---: | ---: | ---: | ---: |
| Mountain node03 / Striker | 30.90 | 24.50 | 10.70 | −6.40 / 0.79x | −13.80 / 0.44x |
| Mountain node03 / Squire | 26.13 | 34.40 | 31.60 | +8.28 / 1.32x | −2.80 / 0.92x |
| Mountain node03 / Apprentice | 18.38 | 27.00 | 10.20 | +8.63 / 1.47x | −16.80 / 0.38x |
| Mountain node03 / Slinger | 14.40 | 28.50 | 16.05 | +14.10 / 1.98x | −12.45 / 0.56x |
| Mountain node03 / Conduit | 14.80 | 31.50 | 19.95 | +16.70 / 2.13x | −11.55 / 0.63x |
| Mountain node03 / Spirit | 23.00 | 20.70 | 16.50 | −2.30 / 0.90x | −4.20 / 0.80x |
| Mountain node05 / Striker | 27.60 | 20.60 | 8.10 | −7.00 / 0.75x | −12.50 / 0.39x |
| Mountain node05 / Squire | 22.10 | 27.40 | 24.70 | +5.30 / 1.24x | −2.70 / 0.90x |
| Mountain node05 / Apprentice | 15.75 | 23.30 | 7.20 | +7.55 / 1.48x | −16.10 / 0.31x |
| Mountain node05 / Slinger | 12.90 | 22.30 | 13.05 | +9.40 / 1.73x | −9.25 / 0.59x |
| Mountain node05 / Conduit | 12.70 | 24.85 | 16.38 | +12.15 / 1.96x | −8.47 / 0.66x |
| Mountain node05 / Spirit | 20.00 | 16.00 | 12.40 | −4.00 / 0.80x | −3.60 / 0.78x |
| Desert node03 / Striker | 10.00 | 16.75 | 8.25 | +6.75 / 1.68x | −8.50 / 0.49x |
| Desert node03 / Squire | 7.60 | 24.70 | 25.60 | +17.10 / 3.25x | +0.90 / 1.04x |
| Desert node03 / Apprentice | 7.50 | 21.40 | 6.00 | +13.90 / 2.85x | −15.40 / 0.28x |
| Desert node03 / Slinger | 5.60 | 22.50 | 13.10 | +16.90 / 4.02x | −9.40 / 0.58x |
| Desert node03 / Conduit | 19.95 | 44.50 | 43.90 | +24.55 / 2.23x | −0.60 / 0.99x |
| Desert node03 / Spirit | 10.50 | 16.60 | 17.00 | +6.10 / 1.58x | +0.40 / 1.02x |
| Desert node05 / Striker | 10.00 | 16.90 | 8.35 | +6.90 / 1.69x | −8.55 / 0.49x |
| Desert node05 / Squire | 7.60 | 24.60 | 25.45 | +17.00 / 3.24x | +0.85 / 1.03x |
| Desert node05 / Apprentice | 7.50 | 21.60 | 5.80 | +14.10 / 2.88x | −15.80 / 0.27x |
| Desert node05 / Slinger | 6.35 | 22.90 | 12.55 | +16.55 / 3.61x | −10.35 / 0.55x |
| Desert node05 / Conduit | 20.30 | 43.80 | 34.50 | +23.50 / 2.16x | −9.30 / 0.79x |
| Desert node05 / Spirit | 10.50 | 16.45 | 15.80 | +5.95 / 1.57x | −0.65 / 0.96x |

## Equal-root-weight summary

These values are the median across the two nodes for each root, followed by an equal-weight median across the six roots. They are the decision-level summaries for the experiment.

| Area / tier | Striker | Squire | Apprentice | Slinger | Conduit | Spirit | Overall six-root median |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mountain T2 | 29.25 | 24.11 | 17.06 | 13.65 | 13.75 | 21.50 | 19.28 |
| Mountain T3 | 22.55 | 30.90 | 25.15 | 25.40 | 28.18 | 18.35 | 25.27 |
| Mountain T4 | 9.40 | 28.15 | 8.70 | 14.55 | 18.16 | 14.45 | 14.50 |
| Desert T2 | 10.00 | 7.60 | 7.50 | 5.97 | 20.13 | 10.50 | 8.80 |
| Desert T3 | 16.82 | 24.65 | 21.50 | 22.70 | 44.15 | 16.52 | 22.10 |
| Desert T4 | 8.30 | 25.52 | 5.90 | 12.82 | 39.20 | 16.40 | 14.61 |

Mountain T2 to T3 has four rising roots (Squire, Apprentice, Slinger, Conduit) and two reversals (Striker, Spirit). Desert T2 to T3 has six rising roots. Mountain T3 to T4 has six declines. Desert T3 to T4 has one rise (Squire), one near-flat split (Spirit), and four declines. The Spirit Mountain node03/node05 split is +0.4s/−0.65s; it is treated as flat/gap, not a pass.

## All-species fast/slow tails

These are headline per-cell body-TTK medians across the 12 root/node cells in each area/tier, excluding long-quiet rows. `P` is the repeated primary anchor and `S` is another authored encounter species. The range is the fastest-to-slowest cell median; it is not a pooled kill distribution and not an actual pack-clear duration.

| Area / tier | Role | Species | Cell count | Median | Fastest–slowest cell medians |
| --- | --- | --- | ---: | ---: | ---: |
| Mountain T2 | P | Granite Titan | 12 | 19.19s | 12.70–30.90s |
| Mountain T2 | S | Stone Eagle | 12 | 3.00s | 1.20–3.75s |
| Mountain T2 | S | Boulder Thrower | 12 | 3.45s | 1.20–5.40s |
| Mountain T3 | P | Mountain Colossus | 12 | 24.68s | 16.00–34.40s |
| Mountain T3 | S | Avalanche Ram | 12 | 2.80s | 1.50–4.20s |
| Mountain T3 | S | Crag Mortar | 12 | 2.70s | 1.40–4.55s |
| Mountain T4 | P | Granite Mammoth | 12 | 14.55s | 7.20–31.60s |
| Mountain T4 | S | Cragback Rhino | 12 | 13.30s | 7.20–49.80s |
| Mountain T4 | S | Cliffside Roc | 12 | 3.30s | 1.95–6.05s |
| Mountain T4 | S | Avalanche Tyrant | 12 | 3.01s | 1.80–6.80s |
| Desert T2 | P | Stone Basilisk | 12 | 8.80s | 5.60–20.30s |
| Desert T2 | S | Sand Scorpion | 12 | 8.55s | 5.30–18.10s |
| Desert T2 | S | Sun Scarab | 12 | 5.20s | 4.00–13.40s |
| Desert T3 | P | Desert Basilisk | 12 | 22.05s | 16.45–44.50s |
| Desert T3 | S | Dune Stalker | 12 | 21.15s | 15.00–42.15s |
| Desert T3 | S | Gilded Scarab | 12 | 3.15s | 1.45–17.30s |
| Desert T4 | P | Dune Basilisk | 12 | 14.45s | 5.80–43.90s |
| Desert T4 | S | Dune Tyrant | 12 | 18.30s | 10.25–48.40s |
| Desert T4 | S | Sand Viper | 12 | 10.10s | 5.00–24.05s |
| Desert T4 | S | Sunshield Scarab | 12 | 2.20s | 1.10–4.80s |

The fastest observed body medians are support-role cells around 1.1–1.5s. The slow tails are concentrated in a small number of named bodies: Mountain T4 Cragback Rhino 49.8s, Desert T4 Dune Tyrant 48.4s, Desert T3 Desert Basilisk 44.5s, Desert T4 Dune Basilisk 43.9s, and Mountain T3 Mountain Colossus 34.4s. This supports a role-specific follow-up, not a universal T4 number.

## Actual pack episode durations

Pack categories are derived from the episode’s actual member count: solo is one member, small is 2–4, and swarm is at least 5. These counts cover all 36 runs in each area/tier, across all three seeds. The primary duration is the median of the six root-level cleared-duration medians; the pooled clear median is shown in parentheses as a secondary descriptive value. Sparse categories are descriptive only. `C/U` is cleared / unfinished episode count. Unfinished episodes are not treated as clears.

| Area / tier / type | Episodes / C / U | Outer clear median (pooled clear) | Cleared range | Initial members median (range) → final members median | Late joiners total / median | Unfinished max / median |
| --- | ---: | ---: | ---: | --- | ---: | ---: |
| Mountain T2 / solo | 907 / 893 / 14 | 4.15s (4.4s) | 1.2–31.9s | 1 (1–1) → 1 | 0 / 0 | 21.8s / 4.25s |
| Mountain T2 / small | 102 / 88 / 14 | 14.20s (14.45s) | 5.5–67.9s | 1 (1–1) → 2 | 116 / 1 | 27.6s / 17.75s |
| Mountain T2 / swarm | 3 / 1 / 2 | 106.10s (106.1s) | 106.1s | 1 (1–1) → 9 | 21 / 8 | 140.6s / 121.45s |
| Mountain T3 / solo | 1,037 / 1,026 / 11 | 3.825s (3.7s) | 0.7–36.5s | 1 (1–1) → 1 | 0 / 0 | 22.7s / 9.9s |
| Mountain T3 / small | 62 / 60 / 2 | 17.70s (19.4s) | 4.6–76.4s | 1 (1–1) → 2 | 82 / 1 | 35.2s / 27.6s |
| Mountain T3 / swarm | 18 / 8 / 10 | 150.00s (128.8s) | 59.6–290.2s | 1 (1–1) → 13 | 311 / 12 | 579.5s / 320.9s |
| Mountain T4 / solo | 911 / 896 / 15 | 5.00s (5.9s) | 0.8–47.8s | 1 (1–1) → 1 | 0 / 0 | 25.1s / 8.8s |
| Mountain T4 / small | 86 / 82 / 4 | 14.30s (12.65s) | 2.8–81.8s | 1 (1–2) → 2 | 109 / 1 | 29.6s / 13.65s |
| Mountain T4 / swarm | 33 / 23 / 10 | 151.575s (150.5s) | 26.9–597.0s | 1 (1–2) → 9 | 466 / 8 | 584.5s / 224.1s |
| Desert T2 / solo | 5 / 4 / 1 | 5.125s (5.35s) | 1.8–8.0s | 1 (1–1) → 1 | 0 / 0 | 1.2s / 1.2s |
| Desert T2 / small | 479 / 467 / 12 | 15.90s (15.0s) | 7.4–45.7s | 1 (1–2) → 2 | 478 / 1 | 11.1s / 7.45s |
| Desert T2 / swarm | 29 / 12 / 17 | 164.80s (129.35s) | 41.9–314.7s | 1 (1–1) → 24 | 616 / 23 | 600.0s / 591.9s |
| Desert T3 / solo | 4 / 4 / 0 | 11.45s (9.5s) | 1.4–25.4s | 1 (1–1) → 1 | 0 / 0 | — |
| Desert T3 / small | 234 / 225 / 9 | 24.70s (20.3s) | 17.1–34.2s | 1 (1–2) → 2 | 225 / 1 | 44.8s / 15.7s |
| Desert T3 / swarm | 26 / 3 / 23 | 386.525s (546.7s) | 178.4–546.7s | 1 (1–1) → 34 | 784 / 33 | 597.2s / 594.4s |
| Desert T4 / solo | 3 / 2 / 1 | 1.10s (1.1s) | 1.1s | 1 (1–1) → 1 | 0 / 0 | 0.1s / 0.1s |
| Desert T4 / small | 357 / 349 / 8 | 14.275s (13.3s) | 5.9–46.3s | 1 (1–2) → 2 | 351 / 1 | 23.7s / 8.5s |
| Desert T4 / swarm | 27 / 4 / 23 | 311.95s (310.35s) | 53.1–353.2s | 1 (1–2) → 39 | 919 / 38 | 597.9s / 595.0s |

The episodes show why target body TTK and pack duration must remain separate. Most episodes begin with one member; late joiners create the swarm classes. Representative actual `index.json` episodes include:

- Mountain T2 node03 Apprentice seed56003: `dur25-t2-mountain-03-apprentice-selected`, start 36.6s, end 104.5s, duration 67.9s, initial 1, final 4, three late joiners, cleared.
- Mountain T3 node03 Slinger seed56003: `dur25-t3-mountain-03-slinger-selected`, start 12.2s, end 302.4s, duration 290.2s, initial 1, final 19, 18 late joiners, cleared.
- Mountain T4 node05 Slinger seed56003: `dur25-t4-mountain-05-slinger-selected`, start 15.5s, end 600.0s, duration 584.5s, initial 1, final 51, 50 late joiners, window-ended.
- Desert T2 node03 Spirit seed56003: `dur25-t2-desert-03-spirit-selected`, start 0s, end 600.0s, duration 600.0s, initial 1, final 42, 41 late joiners, window-ended.
- Desert T3 node05 Spirit seed58013: `dur25-t3-desert-05-spirit-selected`, start 2.8s, end 600.0s, duration 597.2s, initial 1, final 42, 41 late joiners, window-ended.
- Desert T4 node03 Spirit seed58013: `dur25-t4-desert-03-spirit-selected`, start 2.1s, end 600.0s, duration 597.9s, initial 1, final 34, 33 late joiners, window-ended.

## Survival, pressure, and mechanics by specialization

`Min HP` is median / lowest observed player HP percentage across the six seeds for that class/tier/area. `K/U/R` is target kills / unfinished targets / targets with observed HP regain. Incoming damage is normalized by observed simulated time (`damage from monsters to player / simulated seconds × 100`); it is not a player-DPS or per-target measure. `P;3+` is peak pursuers maximum and sampled seconds with at least three pursuers. Casts are monster cast starts/completions. `Tech` is `technique-adapter` event count. `Q` is long-quiet row count.

| Area / tier / class | Deaths / 6 | Min HP median / low | K/U/R | Incoming / 100 sim s | Recovery interrupts | P;3+ | Cast starts / ends | Tech | Q |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mountain T2 Striker | 3 | 7.86% / 0% | 150/7/0 | 714.18 | 32 | 3;6 | 279/273 | 0 | 0 |
| Mountain T2 Squire | 1 | 41.84% / 0% | 213/5/0 | 483.98 | 61 | 2;0 | 325/324 | 0 | 1 |
| Mountain T2 Apprentice | 4 | 0% / 0% | 114/6/2 | 539.12 | 22 | 3;4 | 165/146 | 7 | 0 |
| Mountain T2 Slinger | 0 | 41.25% / 7.74% | 277/4/1 | 347.85 | 77 | 2;0 | 303/271 | 6,608 | 1 |
| Mountain T2 Conduit | 1 | 55.86% / 0% | 225/5/2 | 60.88 | 6 | 3;2 | 50/34 | 837 | 0 |
| Mountain T2 Spirit | 5 | 0% / 0% | 130/9/3 | 273.60 | 36 | 3;5 | 178/158 | 0 | 0 |
| Mountain T3 Striker | 0 | 41.04% / 33.30% | 257/4/0 | 1,040.74 | 135 | 2;0 | 246/245 | 0 | 0 |
| Mountain T3 Squire | 1 | 57.59% / 0% | 207/5/0 | 809.26 | 84 | 3;7 | 227/212 | 0 | 0 |
| Mountain T3 Apprentice | 1 | 31.85% / 0% | 231/4/0 | 390.99 | 24 | 3;7 | 192/170 | 5 | 0 |
| Mountain T3 Slinger | 0 | 48.78% / 8.45% | 256/4/3 | 206.94 | 33 | 3;1 | 187/174 | 8,364 | 0 |
| Mountain T3 Conduit | 0 | 78.78% / 51.84% | 187/2/0 | 15.87 | 6 | 2;0 | 21/8 | 1,080 | 1 |
| Mountain T3 Spirit | 0 | 63.52% / 30.77% | 333/3/3 | 39.85 | 71 | 2;0 | 222/213 | 0 | 0 |
| Mountain T4 Striker | 1 | 30.90% / 0% | 352/6/0 | 1,482.21 | 226 | 3;4 | 183/183 | 0 | 0 |
| Mountain T4 Squire | 0 | 43.54% / 27.26% | 167/5/0 | 937.78 | 95 | 3;6 | 101/96 | 0 | 0 |
| Mountain T4 Apprentice | 1 | 62.01% / 0% | 315/6/9 | 169.95 | 39 | 3;2 | 171/160 | 13 | 0 |
| Mountain T4 Slinger | 0 | 45.31% / 40.48% | 263/5/36 | 197.83 | 11 | 3;4 | 132/128 | 13,376 | 0 |
| Mountain T4 Conduit | 1 | 73.17% / 0% | 150/10/12 | 156.62 | 3 | 2;0 | 38/35 | 1,294 | 1 |
| Mountain T4 Spirit | 1 | 50.09% / 0% | 313/11/21 | 111.82 | 52 | 2;0 | 185/180 | 0 | 0 |
| Desert T2 Striker | 0 | 29.24% / 16.77% | 277/3/0 | 1,426.33 | 0 | 2;0 | 282/215 | 0 | 0 |
| Desert T2 Squire | 0 | 48.74% / 48.74% | 284/5/0 | 1,057.64 | 0 | 2;0 | 238/232 | 0 | 0 |
| Desert T2 Apprentice | 1 | 42.51% / 0% | 253/9/25 | 655.39 | 0 | 5;118 | 139/137 | 25 | 0 |
| Desert T2 Slinger | 0 | 54.39% / 46.39% | 350/6/5 | 499.97 | 0 | 3;32 | 166/121 | 7,107 | 0 |
| Desert T2 Conduit | 0 | 50.45% / 50.13% | 144/19/34 | 304.89 | 0 | 4;6 | 164/149 | 1,784 | 0 |
| Desert T2 Spirit | 0 | 43.47% / 4.03% | 221/12/76 | 290.76 | 0 | 4;39 | 137/129 | 0 | 0 |
| Desert T3 Striker | 0 | 15.14% / 14.59% | 261/5/0 | 3,253.86 | 0 | 2;0 | 594/571 | 0 | 0 |
| Desert T3 Squire | 0 | 56.31% / 55.10% | 197/5/0 | 2,196.33 | 0 | 2;0 | 593/584 | 0 | 0 |
| Desert T3 Apprentice | 0 | 38.93% / 22.02% | 169/21/48 | 1,150.59 | 0 | 4;137 | 291/284 | 38 | 0 |
| Desert T3 Slinger | 0 | 48.50% / 46.00% | 177/22/56 | 977.94 | 0 | 4;48 | 269/257 | 7,915 | 0 |
| Desert T3 Conduit | 0 | 51.64% / 41.12% | 99/12/25 | 476.81 | 0 | 3;12 | 300/293 | 6,636 | 0 |
| Desert T3 Spirit | 0 | 43.20% / 33.42% | 235/14/57 | 261.82 | 0 | 5;52 | 249/219 | 0 | 0 |
| Desert T4 Striker | 0 | 39.15% / 35.81% | 397/5/0 | 4,167.92 | 0 | 2;0 | 313/263 | 0 | 0 |
| Desert T4 Squire | 0 | 72.75% / 70.36% | 201/4/0 | 3,475.86 | 0 | 2;0 | 368/352 | 0 | 0 |
| Desert T4 Apprentice | 0 | 36.83% / 28.78% | 346/14/36 | 1,982.41 | 15 | 4;182 | 127/88 | 35 | 0 |
| Desert T4 Slinger | 0 | 46.95% / 37.62% | 227/24/81 | 1,076.81 | 0 | 5;68 | 106/100 | 12,039 | 0 |
| Desert T4 Conduit | 0 | 53.97% / 46.49% | 123/22/34 | 762.72 | 0 | 5;104 | 181/172 | 5,129 | 0 |
| Desert T4 Spirit | 1 | 48.65% / 0% | 255/21/54 | 677.58 | 12 | 5;97 | 145/132 | 0 | 0 |

Global event counts were retained in the raw streams: 235,345 damage events, 33,739 ability activations, 30,262 buff gains, 29,989 buff expiries, 12,842 absorbs, 339,325 heals, 7,867 monster cast starts, 7,308 cast ends, 7,684 telegraph dodges, 17,926 buff updates, 72,292 technique-adapter events, 8,439 kill events, and 22 player-death events.

## Death review and 10s / 30s windows

There were 22 player deaths. Each run stops at its first death, so “repeated death” means grouped cause review across runs, not multiple deaths in one observation. Death causes were only melee or ranged in this run; no death was attributed to DoT. The table uses the raw terminal death window and preserves the first-kill count before death.

| Cause / victim species | Deaths | Median death time | Median kills before death | Median incoming last 10s | Median incoming last 30s | DoT deaths |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| melee / Stone Eagle | 9 | 149.6s | 11 | 329.10 | 351.40 | 0 |
| melee / Cliffside Roc | 3 | 397.6s | 11 | 735.00 | 1,073.30 | 0 |
| melee / Granite Titan | 3 | 377.3s | 22 | 370.00 | 477.90 | 0 |
| ranged / Boulder Thrower | 2 | 395.6s | 30.5 | 363.80 | 418.30 | 0 |
| ranged / Sunshield Scarab | 1 | 343.5s | 13 | 650.04 | 1,663.04 | 0 |
| melee / Mountain Colossus | 1 | 390.3s | 26 | 639.00 | 980.00 | 0 |
| ranged / Sun Scarab | 1 | 426.1s | 33 | 121.60 | 457.948 | 0 |
| melee / Granite Mammoth | 1 | 488.8s | 44 | 1,040.00 | 1,403.75 | 0 |
| ranged / Crag Mortar | 1 | 545.1s | 31 | 366.9825 | 532.9175 | 0 |

Representative terminal rows include Mountain T2 node03 Apprentice seed58013 dying at 19.1s to a Stone Eagle melee hit after one kill, Mountain T4 node03 Apprentice seed56003 dying at 89.2s to a Cliffside Roc after nine kills with 879.2 / 1,073.3 incoming damage in the 10s/30s windows, Desert T4 node05 Spirit seed60013 dying at 343.5s to a Sunshield Scarab ranged hit with 650.04 / 1,663.04 incoming damage, and Mountain T2 node05 Squire seed58013 dying at 594.4s to a Granite Titan melee hit after 38 kills with 330.225 / 478.425 incoming damage. The earliest death window and late terminal window are therefore both retained; neither is converted into a universal balance claim.

Actor-normalized damage in the complete streams was player→monster 122,824, monster→player 30,630, and minion→monster 81,891. No monster→minion damage was recorded. Recovery interruption and pursuer columns above retain the pressure context around these deaths.

## Kill, corpse, and summon-removal semantics

- All 8,439 raw `kill` events had `killer.actorType=player` and `victim.actorType=monster`. There were 8,356 unique victim IDs and 83 duplicate same-victim kill records at the same tick. No non-monster kill event was present.
- Sampled monster-state disappearance found 8,346 removals. Every sampled disappearance followed a prior unique kill at the 1s sample resolution; there were 0 sampled removals without a prior kill. This is sample-derived body/corpse cleanup evidence, not an explicit corpse-removal event kind.
- Only Conduit had minions. Sampled summon-slot deactivations / minion-ID disappearances and activations were: Mountain T2 520/510, Mountain T3 537/534, Mountain T4 602/583; Desert T2 717/705, Desert T3 454/451, Desert T4 585/569. Totals were 3,415 deactivations and 3,352 activations. These are sample/state transitions, not explicit summon-removal event records.
- Kills remain damage-kill evidence only. Summon disappearance, corpse cleanup, and player death are kept as separate event/state categories and are not counted as extra damage kills.

## Role-by-role disposition

| Area / transition | Rising roots | Evidence | Disposition |
| --- | --- | --- | --- |
| Mountain T2 → T3 | Squire, Apprentice, Slinger, Conduit (4/6) | Equal-root overall 19.28s → 25.27s; Striker and Spirit reverse | Partial pass for the question; not uniform across roots |
| Mountain T3 → T4 | None (0/6) | Equal-root overall 25.27s → 14.50s; every root declines | Gap; do not generalize T4 as slower from this matrix |
| Desert T2 → T3 | Striker, Squire, Apprentice, Slinger, Conduit, Spirit (6/6) | Equal-root overall 8.80s → 22.10s; every root rises | Pass for this comparison, still synthetic and biome-local |
| Desert T3 → T4 | Squire only; Spirit near-flat | Equal-root overall 22.10s → 14.61s; Squire +0.87s, Spirit 16.52s → 16.40s | Gap for a generalized rise; retain Squire as a narrow local pass |

The role-level data supports retaining the observation that T3 can be slower than T2, especially in Desert, but it rejects a single cross-tier rule that every T4 body should be slower than its T3 counterpart. The resulting numeric disposition is **none**: no production HP, attack, defense, Focus, or universal T4 scalar is justified from this experiment alone.

## Retention, exclusions, and next gate

- Retain the 16 prior candidates and the Graveyard five-species normal-targeting package. Durability25 does not invalidate those narrower records.
- Do not reopen the rejected universal Focus grid or all-T4 Focus policy. Durability25 used normal targeting only and does not add Focus evidence.
- Keep Jungle, Trench/Stalker, and current-source regression coverage pending. The Trench 40–60s discussion target is not silently applied to Mountain, Desert, or every T4 species.
- If a follow-up is authorized, isolate one T4-only primary-body numeric factor on the same six-root control and report body medians and actual pack episodes separately. Do not change source during a frozen replication.
- This remains a limited ladder screen, not full certification and not an invited playtest. Live browser visuals, real economy, progression, farming, and player feel remain unverified.

## Raw artifacts

- [Batch manifest](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/batch-manifest.json>)
- [Operator ledger](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/operator-ledger.jsonl>)
- [Batch ended marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/batch-ended.json>)
- [Operator exit marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/operator-exit.json>)
- [Mountain manifest](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/mountain/manifest.json>), [analysis JSON](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/mountain/analysis.json>), [analysis markdown](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/mountain/analysis.md>), [verification](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/mountain/verification.json>), [night5 audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/mountain/night5-audit.json>), [episode index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/mountain/index.json>)
- [Desert manifest](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/desert/manifest.json>), [analysis JSON](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/desert/analysis.json>), [analysis markdown](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/desert/analysis.md>), [verification](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/desert/verification.json>), [night5 audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/desert/night5-audit.json>), [episode index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/desert/index.json>)
- [Mountain raw run directory](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/mountain>) and [Desert raw run directory](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/desert>) contain every `ready.json`, `summary.json`, `events.jsonl`, and `samples.jsonl` artifact for all 216 observations.
- [Detached frozen source](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/source>) was retained clean at the frozen revision.

## Planner review

The T4 pacing reversal is a gap against the user's intended progression, not a
reason to reject that goal. It supports a targeted candidate trial rather than
an immediate global scalar. Durability26 tests doubled selected Mammoth/Basilisk
body HP while preserving Mammoth absolute ward and all other numeric layers.
T2 Mountain14/36 deaths warrants a bounded pressure review; T2 Desert8.80s primary
timing remains an open short-controller issue. The Spirit +0.4/-0.65s node split
quoted above belongs to Desert T3->T4, not Mountain. No production edit follows.
