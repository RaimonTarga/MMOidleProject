# Durability21 — closed T4 biome coverage and existing death-case review

Date: 2026-09-17  
Status: complete; raw matrix and read-only Night5-R1 review completed; no production balance edit authorized  
Decision scope: descriptive synthetic coverage, pressure interpretation, and planner work map only

## Executive result

Durability21 executed the sealed three-block screen once and sequentially on the frozen checkout, then completed the packet-defined read-only review of 24 existing Night5-R1 rows. The runner exited 0, all 108 new observations were retained, each biome verifier passed, and no retry, relaunch, balance edit, adaptive build, or cap extension occurred.

- New matrix: 36 cells / 108 observations; Tundra 36 window-ended, Volcanic 35 window-ended plus one player death, Trench 36 window-ended.
- New target stream: 4,702 killed, 131 unfinished/censored, 170 with observed regain, and 4,588 clean target records out of 4,833. Regain overlaps the other categories.
- Species estimator: 144 class/node/species rows. There are 17 missing species-seed medians; 13 rows have two eligible seeds and 2 rows are inconclusive with one eligible seed. No expected species was unobserved and no observed species was never killed.
- Exposure reconstruction: zero long-quiet runs, zero blocked samples, and no evidence that quiet survival should be treated as safety. The screen logged 2,657 late-joiner events and 3,034 sampled seconds with three or more player pursuers.
- The sole death was Volcanic node05 Conduit/Marshal at 70.5s after six kills. Ash Burn from a five-stack Ashspitter Salamander DoT dealt the terminal 88 damage. Its frequency is one of 108, so it is a targeted pressure/mechanic review item, not a global nerf signal.

The matrix closes the previously missing broad screen for T4 Tundra, Volcanic, and Trench. It does not prove farming safety, economy viability, optimal class specialization, respawn cost, or live/browser feel. Five-minute survival remains a bounded first-death observation, not longer-window attrition evidence.

## Frozen identity and execution

| Item | Value |
| --- | --- |
| Operator packet | [bot-balance-durability21-operator-packet.md](bot-balance-durability21-operator-packet.md) |
| Frozen revision | `bcd0b0a3b61bf75451b1d1a3fc42c13d04e6b24e` |
| Frozen branch retained | `codex/durability21-frozen` |
| Frozen source tree | `2f84f01cf2caffd16ebdc20b6471220be4101979` |
| Definitions SHA-256 | `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0` |
| Hitboxes SHA-256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Hitbox source | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json` |
| Detached checkout | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability21-20260917/source` |
| Results root | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability21-20260917/results` |
| Trial / mode | durability21 / run |
| Seeds | 32003, 34019, 36007 |
| Matrix | 36 cells / 108 observations / 3 biomes / 6 roots |
| Timestep / maximum | 100 ms / 300 s or first death |
| Synthetic / economy eligible | true / false |
| Operator start | `2026-09-17T07:53:23.712Z` |
| Operator end | `2026-09-17T07:58:42.6669079Z` |
| Batch wall time | 318,918 ms / 5m 18.918s |
| Runner exit | 0; one sequential run; no retry or relaunch |

The frozen checkout was clean and its revision/tree identity matched the packet before cleanup. Per the packet, the disposable worktree was offered to `git worktree remove` without force after terminal completion; Windows returned a filename-too-long error after the worktree registration was removed. The source directory remains as an orphaned file tree without Git metadata, while the raw manifests, results, and partials preserve provenance and nothing was force-deleted.

## Completion and retained evidence

| Biome block | Cells / runs | Outcomes WE/PD/WC | Verified | Complete windows | K/U/R | Casts started/fired | Recovery interruptions / episodes | Incoming HP total |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Tundra | 12 / 36 | 36/0/0 | true | 36 | 1442/20/1 | 49/47 | 516/1460 | 59,699.285 |
| Volcanic | 12 / 36 | 35/1/0 | true | 35 | 2701/63/147 | 112/78 | 428/795 | 179,811.025 |
| Trench | 12 / 36 | 36/0/0 | true | 36 | 559/48/22 | 691/612 | 36/456 | 105,255.575 |
| Total | 36 / 108 | 107/1/0 | true for all three blocks | 107 complete windows plus one death | 4702/131/170 | 852/737 | 980/2711 | 344,765.885 |

Per-block operator ledger: Tundra `2026-09-17T07:53:23.714Z`–`07:54:36.129Z`, exit 0; Volcanic `07:54:36.665Z`–`07:57:30.707Z`, exit 0; Trench `07:57:31.650Z`–`07:58:42.178Z`, exit 0. All result manifests, audits, verification logs, complete markers, and raw run directories remain under the results root.

## Measurement rules and evidence boundary

For each class/node/species row, `night5-audit.json` supplies one clean TTK median per seed from killed targets that had no observed HP regain and were not unfinished/censored. The reported species TTK is the outer median of the eligible per-seed medians in seed order 32003 / 34019 / 36007. `M` is the number of missing seed medians; fewer than two eligible seeds is inconclusive. A dash is missing evidence, not a zero-second kill.
Cell `K/U/R` counts killed / unfinished-or-censored / observed-regain target records. Regain overlaps K or U. Cell `WE/PD/WC` counts window-ended / player-died / wall-ceiling observations. `Mixed clean TTK` is the reporter’s descriptive mixed-body value, not the primary species estimator, an elite median, or a pack-clear duration. All TTK values below are seconds.
Exposure columns are read from the retained audit streams: `P` is peak player pursuers, `3+` is sampled seconds with at least three player pursuers, `LJ` is late joiners, `LQ` is long-quiet run count with the maximum quiet seconds in parentheses, and `B` is blocked-approach samples. Sampled aggro counts are one-second proxies; minion pursuit differs from player pursuit. Quiet survival is not safety.

## Species coverage and estimator completeness

| Biome | Expected species | Observed species | Species rows | Missing seed medians | Inconclusive rows | Never killed |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Tundra | Hoarfrost Yeti, Permafrost Behemoth, Glacial Dire-Bear, Rime-Tusk Mastodon | Hoarfrost Yeti, Permafrost Behemoth, Glacial Dire-Bear, Rime-Tusk Mastodon | 48 | 1 | 0 | none |
| Volcanic | Ember Skink, Obsidian Tortoise, Ashspitter Salamander, Magma Salamander, Infernal Direhound | Ember Skink, Obsidian Tortoise, Ashspitter Salamander, Magma Salamander, Infernal Direhound | 60 | 9 | volcanic 05 conduit / Obsidian Tortoise (1 eligible) | none |
| Trench | Elder Leviathan, Abyssal Serpent, Hadal Stalker | Elder Leviathan, Abyssal Serpent, Hadal Stalker | 36 | 7 | trench 05 conduit / Elder Leviathan (1 eligible) | none |
| Total | 12 expected species placements across three biomes | 12 observed species placements | 144 | 17 | volcanic 05 conduit / Obsidian Tortoise; trench 05 conduit / Elder Leviathan | none |

Limited two-seed rows are retained descriptively but should not be treated as fully stable estimates:
- tundra 03 squire / Glacial Dire-Bear: eligible 2, missing 1, outer 4.97s.
- volcanic 03 squire / Obsidian Tortoise: eligible 2, missing 1, outer 5.20s.
- volcanic 03 conduit / Magma Salamander: eligible 2, missing 1, outer 15.65s.
- volcanic 03 conduit / Obsidian Tortoise: eligible 2, missing 1, outer 10.72s.
- volcanic 05 apprentice / Obsidian Tortoise: eligible 2, missing 1, outer 3.20s.
- volcanic 05 apprentice / Magma Salamander: eligible 2, missing 1, outer 5.50s.
- volcanic 05 conduit / Ashspitter Salamander: eligible 2, missing 1, outer 11.22s.
- volcanic 05 conduit / Magma Salamander: eligible 2, missing 1, outer 29.02s.
- trench 03 squire / Hadal Stalker: eligible 2, missing 1, outer 31.55s.
- trench 03 conduit / Hadal Stalker: eligible 2, missing 1, outer 13.93s.
- trench 03 conduit / Abyssal Serpent: eligible 2, missing 1, outer 30.82s.
- trench 05 conduit / Abyssal Serpent: eligible 2, missing 1, outer 62.55s.
- trench 05 conduit / Hadal Stalker: eligible 2, missing 1, outer 55.30s.
Inconclusive rows:
- volcanic 05 conduit / Obsidian Tortoise: eligible 1, outer value withheld from disposition; K/U/R/M 2/1/0/2.
- trench 05 conduit / Elder Leviathan: eligible 1, outer value withheld from disposition; K/U/R/M 1/5/4/2.

## Actual READY legality and setup

Every new cell had an actual READY view. The packet used biome primary armor/charm, Mountain boots, Tempered Core, Colossus Heart, fixed class weapon, offensive stance, Sweep/Frenzy, Second Wind, Cleanse, ranged orbit where applicable, and the existing Night5 continuity roots. These are synthetic prepared snapshots; they are not acquisition or economy proof.
| Cell | Root / weapon | HP / attack / plating | DR / dodge / evade / barrier | Speed / range / cooldown | Equipment |
| --- | --- | ---: | --- | --- | --- |
| tundra 03 striker | cadence-root / volcanic-eruption-lash | 768 / 152 / 88 | DR 0.020 / dodge 0.000 / evade 0.000 / barrier 246 | 256 / 12 / 441 ms | volcanic-eruption-lash; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 03 squire | cooldown-root / mountain-warmaul | 834 / 211 / 102 | DR 0.060 / dodge 0.000 / evade 0.000 / barrier 267 | 210 / 12 / 1,765 ms | mountain-warmaul; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 03 apprentice | dot-root / graveyard-plague-axe | 713 / 387 / 81 | DR 0.000 / dodge 0.000 / evade 0.000 / barrier 228 | 251 / 72 / 764 ms | graveyard-plague-axe; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 03 slinger | reload-root / jungle-deathfang-rapier | 675 / 86 / 67 | DR 0.000 / dodge 0.340 / evade 0.700 / barrier 216 | 282 / 132 / 223 ms | jungle-deathfang-rapier; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 03 conduit | summoner-root / jungle-deathfang-rapier | 691 / 107 / 73 | DR 0.000 / dodge 0.000 / evade 0.000 / barrier 221 | 261 / 162 / 501 ms | jungle-deathfang-rapier; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 03 spirit | energy-root / volcanic-eruption-lash | 647 / 165 / 71 | DR 0.000 / dodge 0.000 / evade 0.000 / barrier 401 | 292 / 142 / 421 ms | volcanic-eruption-lash; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 05 striker | cadence-root / volcanic-eruption-lash | 768 / 152 / 88 | DR 0.020 / dodge 0.000 / evade 0.000 / barrier 246 | 256 / 12 / 441 ms | volcanic-eruption-lash; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 05 squire | cooldown-root / mountain-warmaul | 834 / 211 / 102 | DR 0.060 / dodge 0.000 / evade 0.000 / barrier 267 | 210 / 12 / 1,765 ms | mountain-warmaul; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 05 apprentice | dot-root / graveyard-plague-axe | 713 / 387 / 81 | DR 0.000 / dodge 0.000 / evade 0.000 / barrier 228 | 251 / 72 / 764 ms | graveyard-plague-axe; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 05 slinger | reload-root / jungle-deathfang-rapier | 675 / 86 / 67 | DR 0.000 / dodge 0.340 / evade 0.700 / barrier 216 | 282 / 132 / 223 ms | jungle-deathfang-rapier; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 05 conduit | summoner-root / jungle-deathfang-rapier | 691 / 107 / 73 | DR 0.000 / dodge 0.000 / evade 0.000 / barrier 221 | 261 / 162 / 501 ms | jungle-deathfang-rapier; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 05 spirit | energy-root / volcanic-eruption-lash | 647 / 165 / 71 | DR 0.000 / dodge 0.000 / evade 0.000 / barrier 401 | 292 / 142 / 421 ms | volcanic-eruption-lash; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| volcanic 03 striker | cadence-root / volcanic-eruption-lash | 729 / 152 / 122 | DR 0.020 / dodge 0.000 / evade 0.000 / barrier 0 | 256 / 12 / 441 ms | volcanic-eruption-lash; volcanic-vest-t4; volcanic-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| volcanic 03 squire | cooldown-root / mountain-warmaul | 792 / 211 / 141 | DR 0.060 / dodge 0.000 / evade 0.000 / barrier 0 | 210 / 12 / 1,765 ms | mountain-warmaul; volcanic-vest-t4; volcanic-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| volcanic 03 apprentice | dot-root / graveyard-plague-axe | 678 / 387 / 112 | DR 0.000 / dodge 0.000 / evade 0.000 / barrier 0 | 251 / 72 / 764 ms | graveyard-plague-axe; volcanic-vest-t4; volcanic-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| volcanic 03 slinger | reload-root / jungle-deathfang-rapier | 641 / 86 / 93 | DR 0.000 / dodge 0.340 / evade 0.700 / barrier 0 | 282 / 132 / 223 ms | jungle-deathfang-rapier; volcanic-vest-t4; volcanic-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| volcanic 03 conduit | summoner-root / jungle-deathfang-rapier | 656 / 107 / 101 | DR 0.000 / dodge 0.000 / evade 0.000 / barrier 0 | 261 / 162 / 501 ms | jungle-deathfang-rapier; volcanic-vest-t4; volcanic-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| volcanic 03 spirit | energy-root / volcanic-eruption-lash | 615 / 165 / 98 | DR 0.000 / dodge 0.000 / evade 0.000 / barrier 185 | 292 / 142 / 421 ms | volcanic-eruption-lash; volcanic-vest-t4; volcanic-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| volcanic 05 striker | cadence-root / volcanic-eruption-lash | 729 / 152 / 122 | DR 0.020 / dodge 0.000 / evade 0.000 / barrier 0 | 256 / 12 / 441 ms | volcanic-eruption-lash; volcanic-vest-t4; volcanic-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| volcanic 05 squire | cooldown-root / mountain-warmaul | 792 / 211 / 141 | DR 0.060 / dodge 0.000 / evade 0.000 / barrier 0 | 210 / 12 / 1,765 ms | mountain-warmaul; volcanic-vest-t4; volcanic-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| volcanic 05 apprentice | dot-root / graveyard-plague-axe | 678 / 387 / 112 | DR 0.000 / dodge 0.000 / evade 0.000 / barrier 0 | 251 / 72 / 764 ms | graveyard-plague-axe; volcanic-vest-t4; volcanic-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| volcanic 05 slinger | reload-root / jungle-deathfang-rapier | 641 / 86 / 93 | DR 0.000 / dodge 0.340 / evade 0.700 / barrier 0 | 282 / 132 / 223 ms | jungle-deathfang-rapier; volcanic-vest-t4; volcanic-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| volcanic 05 conduit | summoner-root / jungle-deathfang-rapier | 656 / 107 / 101 | DR 0.000 / dodge 0.000 / evade 0.000 / barrier 0 | 261 / 162 / 501 ms | jungle-deathfang-rapier; volcanic-vest-t4; volcanic-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| volcanic 05 spirit | energy-root / volcanic-eruption-lash | 615 / 165 / 98 | DR 0.000 / dodge 0.000 / evade 0.000 / barrier 185 | 292 / 142 / 421 ms | volcanic-eruption-lash; volcanic-vest-t4; volcanic-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 03 striker | cadence-root / volcanic-eruption-lash | 470 / 152 / 76 | DR 0.340 / dodge 0.000 / evade 0.000 / barrier 0 | 256 / 12 / 441 ms | volcanic-eruption-lash; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 03 squire | cooldown-root / mountain-warmaul | 511 / 211 / 88 | DR 0.380 / dodge 0.000 / evade 0.000 / barrier 0 | 210 / 12 / 1,765 ms | mountain-warmaul; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 03 apprentice | dot-root / graveyard-plague-axe | 437 / 387 / 69 | DR 0.320 / dodge 0.000 / evade 0.000 / barrier 0 | 251 / 72 / 764 ms | graveyard-plague-axe; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 03 slinger | reload-root / jungle-deathfang-rapier | 413 / 86 / 58 | DR 0.320 / dodge 0.340 / evade 0.700 / barrier 0 | 282 / 132 / 223 ms | jungle-deathfang-rapier; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 03 conduit | summoner-root / jungle-deathfang-rapier | 423 / 107 / 63 | DR 0.320 / dodge 0.000 / evade 0.000 / barrier 0 | 261 / 162 / 501 ms | jungle-deathfang-rapier; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 03 spirit | energy-root / volcanic-eruption-lash | 396 / 165 / 61 | DR 0.320 / dodge 0.000 / evade 0.000 / barrier 119 | 292 / 142 / 421 ms | volcanic-eruption-lash; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 05 striker | cadence-root / volcanic-eruption-lash | 470 / 152 / 76 | DR 0.340 / dodge 0.000 / evade 0.000 / barrier 0 | 256 / 12 / 441 ms | volcanic-eruption-lash; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 05 squire | cooldown-root / mountain-warmaul | 511 / 211 / 88 | DR 0.380 / dodge 0.000 / evade 0.000 / barrier 0 | 210 / 12 / 1,765 ms | mountain-warmaul; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 05 apprentice | dot-root / graveyard-plague-axe | 437 / 387 / 69 | DR 0.320 / dodge 0.000 / evade 0.000 / barrier 0 | 251 / 72 / 764 ms | graveyard-plague-axe; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 05 slinger | reload-root / jungle-deathfang-rapier | 413 / 86 / 58 | DR 0.320 / dodge 0.340 / evade 0.700 / barrier 0 | 282 / 132 / 223 ms | jungle-deathfang-rapier; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 05 conduit | summoner-root / jungle-deathfang-rapier | 423 / 107 / 63 | DR 0.320 / dodge 0.000 / evade 0.000 / barrier 0 | 261 / 162 / 501 ms | jungle-deathfang-rapier; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 05 spirit | energy-root / volcanic-eruption-lash | 396 / 165 / 61 | DR 0.320 / dodge 0.000 / evade 0.000 / barrier 119 | 292 / 142 / 421 ms | volcanic-eruption-lash; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |

No concurrent main-checkout runtime edits entered the matrix. The report treats all readiness, synthetic gear, and loader receipts as provenance, not as live playtest or balance evidence.

## Per-cell pressure, durability, and exposure

The following table is the class/node view. It reports actual READY values above, the mixed descriptive TTK, target accounting, minimum HP, deaths, source-labeled incoming pressure, cast starts/fires, recovery interruptions, and exposure flags. Species-level TTK is in the tables below and is the primary estimator.
| Cell | WE/PD/WC | Mixed clean TTK / clean targets | K/U/R / records | Min HP med / low; deaths | Incoming med / max; top sources and types | Casts started/fired | Recovery interruptions / episodes | Exposure P/3+/LJ/LQ/B |
| --- | ---: | ---: | ---: | --- | --- | ---: | ---: | --- |
### Tundra

| tundra 03 striker | 3/0/0 | 2.00s / 130 | 130/1/0 / 131 | 70.7% / 68.2%; 0 | 4,489.1 / 4,582.7; Glacial Dire-Bear direct 690hp/5x/max212.6<br>Permafrost Behemoth direct 475.1hp/4x/max191.8<br>Hoarfrost Yeti direct 146.8hp/2x/max111<br>Rime-Tusk Mastodon direct 113hp/2x/max107 | 0/0 | 102/131 | P1/3+0s/LJ0/LQ0 (max8.4s)/B0 |
| tundra 03 squire | 3/0/0 | 6.60s / 71 | 71/3/0 / 74 | 76.4% / 75.8%; 0 | 3,894.6 / 4,606.9; Rime-Tusk Mastodon direct 548.6hp/5x/max184<br>Glacial Dire-Bear direct 281.9hp/2x/max167<br>Permafrost Behemoth direct 203hp/3x/max160.3 | 42/42 | 47/74 | P1/3+0s/LJ0/LQ0 (max12.8s)/B0 |
| tundra 03 apprentice | 3/0/0 | 3.20s / 110 | 110/1/0 / 111 | 81.3% / 60.8%; 0 | 986.2 / 1,326; — | 0/0 | 14/111 | P1/3+0s/LJ0/LQ0 (max9.7s)/B0 |
| tundra 03 slinger | 3/0/0 | 2.15s / 138 | 138/2/1 / 140 | 75.4% / 75.2%; 0 | 437.4 / 633; Hoarfrost Yeti direct 300hp/2x/max154 | 0/0 | 35/137 | P1/3+0s/LJ3/LQ0 (max8.9s)/B0 |
| tundra 03 conduit | 3/0/0 | 4.30s / 78 | 78/1/0 / 79 | 94.1% / 94.1%; 0 | 0 / 0; — | 0/0 | 2/79 | P1/3+0s/LJ0/LQ0 (max9.2s)/B0 |
| tundra 03 spirit | 3/0/0 | 2.70s / 133 | 133/2/0 / 135 | 82.2% / 76.2%; 0 | 115.9 / 155; — | 1/0 | 28/135 | P1/3+0s/LJ0/LQ0 (max8s)/B0 |
| tundra 05 striker | 3/0/0 | 1.50s / 144 | 144/1/0 / 145 | 69% / 68.2%; 0 | 4,613.6 / 4,668.9; Glacial Dire-Bear direct 726.8hp/6x/max222<br>Rime-Tusk Mastodon direct 396.8hp/3x/max212.6<br>Hoarfrost Yeti direct 197.5hp/2x/max184.8 | 0/0 | 124/146 | P1/3+0s/LJ0/LQ0 (max10.6s)/B0 |
| tundra 05 squire | 3/0/0 | 5.35s / 95 | 95/1/0 / 96 | 79.1% / 77.1%; 0 | 4,617.7 / 4,859.9; Rime-Tusk Mastodon direct 654.7hp/5x/max199<br>Permafrost Behemoth direct 585.8hp/6x/max131.3<br>Glacial Dire-Bear direct 119.6hp/1x/max119.6 | 6/5 | 75/97 | P1/3+0s/LJ0/LQ0 (max12.1s)/B0 |
| tundra 05 apprentice | 3/0/0 | 2.40s / 132 | 132/1/0 / 133 | 83.7% / 78.4%; 0 | 172.6 / 534.8; Hoarfrost Yeti direct 338hp/3x/max146.7<br>Hoarfrost Yeti debt 27hp/18x/max3 | 0/0 | 26/133 | P1/3+0s/LJ0/LQ0 (max9.1s)/B0 |
| tundra 05 slinger | 3/0/0 | 1.80s / 152 | 152/2/0 / 154 | 75.2% / 75.2%; 0 | 551 / 692; Hoarfrost Yeti direct 260.8hp/2x/max161.2 | 0/0 | 39/153 | P1/3+0s/LJ1/LQ0 (max6.7s)/B0 |
| tundra 05 conduit | 3/0/0 | 2.10s / 121 | 121/3/0 / 124 | 94.1% / 94.1%; 0 | 0 / 0; — | 0/0 | 0/124 | P1/3+0s/LJ0/LQ0 (max9.7s)/B0 |
| tundra 05 spirit | 3/0/0 | 2.50s / 138 | 138/2/0 / 140 | 100% / 86.8%; 0 | 0 / 85.8; Hoarfrost Yeti direct 85.8hp/1x/max85.8 | 0/0 | 24/140 | P1/3+0s/LJ0/LQ0 (max8s)/B0 |

### Volcanic

| volcanic 03 striker | 3/0/0 | 1.05s / 369 | 369/0/0 / 369 | 82.4% / 76.7%; 0 | 7,941 / 8,016; Ashspitter Salamander dot 861hp/28x/max53<br>Ember Skink dot 818hp/20x/max56<br>Magma Salamander direct 134hp/4x/max41<br>Ember Skink direct 31hp/31x/max1 | 9/2 | 122/228 | P6/3+234s/LJ258/LQ0 (max9s)/B0 |
| volcanic 03 squire | 3/0/0 | 1.80s / 217 | 217/0/0 / 217 | 87.4% / 84%; 0 | 10,703 / 14,222; Ember Skink dot 1,646hp/38x/max55<br>Ashspitter Salamander dot 1,589hp/31x/max83<br>Ember Skink direct 51hp/51x/max1<br>Ashspitter Salamander direct 16hp/16x/max1 | 27/25 | 70/127 | P6/3+231s/LJ157/LQ0 (max10.9s)/B0 |
| volcanic 03 apprentice | 3/0/0 | 2.20s / 198 | 203/7/11 / 210 | 91.6% / 62.2%; 0 | 3,156.3 / 3,585.9; Ashspitter Salamander dot 783hp/28x/max43<br>Ember Skink dot 499hp/16x/max47<br>Ember Skink direct 13.5hp/15x/max0.9<br>Ashspitter Salamander direct 10.8hp/12x/max0.9 | 0/0 | 0/5 | P9/3+210s/LJ222/LQ0 (max8.2s)/B0 |
| volcanic 03 slinger | 3/0/0 | 1.50s / 222 | 249/4/31 / 253 | 83.7% / 82.6%; 0 | 2,280 / 2,667; Ashspitter Salamander dot 144hp/8x/max18<br>Ember Skink dot 98hp/7x/max14<br>Magma Salamander direct 38hp/1x/max38<br>Ashspitter Salamander direct 22hp/4x/max16 | 5/4 | 6/21 | P6/3+223s/LJ253/LQ0 (max10.7s)/B0 |
| volcanic 03 conduit | 3/0/0 | 5.70s / 98 | 111/13/24 / 124 | 86.7% / 84.1%; 0 | 2,286 / 2,898; Ember Skink dot 942hp/21x/max57<br>Ember Skink direct 1hp/1x/max1 | 3/2 | 0/8 | P9/3+183s/LJ130/LQ0 (max10.7s)/B0 |
| volcanic 03 spirit | 3/0/0 | 1.20s / 313 | 321/3/8 / 324 | 91.3% / 84.6%; 0 | 799 / 967.3; Ashspitter Salamander dot 94hp/3x/max34<br>Ashspitter Salamander direct 19hp/1x/max19 | 2/1 | 0/6 | P6/3+206s/LJ329/LQ0 (max7.6s)/B0 |
| volcanic 05 striker | 3/0/0 | 1.40s / 318 | 318/2/0 / 320 | 80.4% / 66.6%; 0 | 8,397 / 10,183; Ember Skink dot 2,051hp/44x/max56<br>Ashspitter Salamander dot 424hp/15x/max53<br>Magma Salamander direct 66hp/2x/max39<br>Ember Skink direct 62hp/62x/max1 | 16/4 | 143/230 | P6/3+224s/LJ217/LQ0 (max14.2s)/B0 |
| volcanic 05 squire | 3/0/0 | 4.20s / 177 | 177/1/0 / 178 | 76.3% / 61.6%; 0 | 13,598 / 16,101; Ashspitter Salamander dot 2,318hp/45x/max83<br>Ember Skink dot 1,150hp/30x/max55<br>Ember Skink direct 33hp/33x/max1<br>Ashspitter Salamander direct 24hp/24x/max1 | 27/22 | 63/111 | P6/3+298s/LJ124/LQ0 (max13.2s)/B0 |
| volcanic 05 apprentice | 3/0/0 | 2.20s / 175 | 187/2/12 / 189 | 70.5% / 61.1%; 0 | 3,090.1 / 3,289.6; Ember Skink dot 465hp/17x/max47<br>Ashspitter Salamander dot 244hp/11x/max29<br>Ember Skink direct 18hp/20x/max0.9<br>Ashspitter Salamander direct 5.4hp/6x/max0.9 | 3/2 | 3/12 | P8/3+221s/LJ199/LQ0 (max11.3s)/B0 |
| volcanic 05 slinger | 3/0/0 | 1.60s / 191 | 214/11/31 / 225 | 80.2% / 67.2%; 0 | 2,249 / 2,530; Ashspitter Salamander dot 394hp/20x/max35<br>Ashspitter Salamander direct 142hp/12x/max28<br>Magma Salamander direct 131hp/4x/max59<br>Ember Skink dot 86hp/3x/max43 | 7/5 | 6/16 | P6/3+206s/LJ218/LQ0 (max8.7s)/B0 |
| volcanic 05 conduit | 2/1/0 | 6.15s / 48 | 57/14/17 / 71 | 53.6% / 0%; 1 | 3,463 / 3,608; Ashspitter Salamander dot 2,410hp/42x/max88<br>Ember Skink dot 1,701hp/38x/max57<br>Magma Salamander direct 752hp/13x/max80<br>Ashspitter Salamander direct 245hp/24x/max15 | 9/9 | 0/6 | P6/3+106s/LJ76/LQ0 (max10.3s)/B0 |
| volcanic 05 spirit | 3/0/0 | 1.45s / 267 | 278/6/13 / 284 | 70.7% / 67.9%; 0 | 737.4 / 1,969; — | 4/2 | 15/25 | P6/3+210s/LJ277/LQ0 (max10.6s)/B0 |

### Trench

| trench 03 striker | 3/0/0 | 6.10s / 71 | 71/3/0 / 74 | 79.5% / 79.5%; 0 | 4,146 / 4,287; Elder Leviathan direct 553hp/6x/max97<br>Abyssal Serpent direct 411hp/5x/max83 | 75/53 | 0/73 | P2/3+0s/LJ1/LQ0 (max9.4s)/B0 |
| trench 03 squire | 3/0/0 | 17.40s / 30 | 30/3/0 / 33 | 75.3% / 64.8%; 0 | 5,131 / 5,573; Elder Leviathan direct 937hp/12x/max84<br>Abyssal Serpent direct 136hp/2x/max69 | 82/76 | 0/30 | P2/3+0s/LJ3/LQ0 (max9.6s)/B0 |
| trench 03 apprentice | 3/0/0 | 5.20s / 92 | 92/1/0 / 93 | 46.9% / 40%; 0 | 1,861.1 / 1,883.5; Abyssal Serpent direct 160.2hp/2x/max81<br>Hadal Stalker direct 141.3hp/2x/max71.1<br>Hadal Stalker debt 13hp/10x/max2<br>Abyssal Serpent debt 12hp/10x/max2 | 9/6 | 11/69 | P3/3+6s/LJ27/LQ0 (max11.1s)/B0 |
| trench 03 slinger | 3/0/0 | 8.45s / 60 | 60/3/0 / 63 | 54.5% / 35.6%; 0 | 1,785 / 2,442; Hadal Stalker direct 24hp/1x/max24 | 44/29 | 0/56 | P2/3+0s/LJ7/LQ0 (max11.1s)/B0 |
| trench 03 conduit | 3/0/0 | 31.30s / 10 | 13/8/8 / 21 | 65.3% / 62.5%; 0 | 2,293 / 2,423; Abyssal Serpent direct 370hp/4x/max123<br>Elder Leviathan direct 213hp/3x/max71<br>Hadal Stalker direct 110hp/2x/max55 | 62/60 | 0/6 | P4/3+226s/LJ29/LQ0 (max6.6s)/B0 |
| trench 03 spirit | 3/0/0 | 17.50s / 42 | 42/6/3 / 48 | 64.2% / 51.7%; 0 | 1,047.4 / 1,531.2; Abyssal Serpent direct 205.3hp/3x/max80.1<br>Hadal Stalker direct 186.1hp/2x/max119.3<br>Elder Leviathan direct 33.5hp/1x/max33.5 | 70/59 | 7/14 | P3/3+29s/LJ39/LQ0 (max8.3s)/B0 |
| trench 05 striker | 3/0/0 | 7.80s / 63 | 63/2/0 / 65 | 71.3% / 55.7%; 0 | 4,974 / 5,365; Elder Leviathan direct 552hp/6x/max97<br>Hadal Stalker direct 471hp/6x/max125<br>Abyssal Serpent direct 301hp/3x/max137 | 62/59 | 0/65 | P2/3+0s/LJ1/LQ0 (max11s)/B0 |
| trench 05 squire | 3/0/0 | 40.00s / 21 | 21/3/0 / 24 | 75.3% / 50.4%; 0 | 5,286 / 5,290; Abyssal Serpent direct 2,649hp/34x/max130<br>Elder Leviathan direct 154hp/2x/max77 | 90/88 | 0/21 | P2/3+0s/LJ3/LQ0 (max8.2s)/B0 |
| trench 05 apprentice | 3/0/0 | 5.20s / 83 | 83/2/0 / 85 | 70.1% / 66.6%; 0 | 1,896.7 / 2,415.2; Hadal Stalker direct 565.2hp/8x/max71.1<br>Abyssal Serpent direct 159.3hp/2x/max81<br>Hadal Stalker debt 56hp/44x/max2<br>Abyssal Serpent debt 10hp/9x/max2 | 3/2 | 14/79 | P2/3+0s/LJ7/LQ0 (max11.9s)/B0 |
| trench 05 slinger | 3/0/0 | 11.25s / 48 | 49/4/1 / 53 | 55.5% / 49.7%; 0 | 2,415 / 2,608; Abyssal Serpent direct 370hp/2x/max185<br>Elder Leviathan direct 212hp/2x/max106 | 55/45 | 0/28 | P3/3+4s/LJ27/LQ0 (max9.8s)/B0 |
| trench 05 conduit | 3/0/0 | 68.30s / 5 | 6/8/7 / 14 | 59.8% / 57.4%; 0 | 2,508 / 2,582; Hadal Stalker direct 821hp/11x/max109<br>Elder Leviathan direct 284hp/4x/max71 | 71/69 | 0/3 | P4/3+186s/LJ20/LQ0 (max10.5s)/B0 |
| trench 05 spirit | 3/0/0 | 15.90s / 28 | 29/5/3 / 34 | 54.2% / 51.7%; 0 | 2,129.7 / 2,878; Hadal Stalker direct 608.6hp/7x/max125.3<br>Elder Leviathan direct 117.5hp/2x/max87 | 68/66 | 4/12 | P3/3+31s/LJ29/LQ0 (max13.8s)/B0 |

Tundra rows had 20 unfinished/censored target records and one observed regain but no player death, long-quiet flag, or blocked sample. Volcanic rows had 63 unfinished/censored and 147 regain records, one player death, and substantial sampled multi-pursuer exposure. Trench rows had 48 unfinished/censored and 22 regain records, no player death, and the slowest mixed cells in the matrix. These are different failure and attrition shapes, not a single pass/fail score.

## Species clean TTK by biome, class, and node

Each row is one species within one class/node cell. Values are `seed32003 / seed34019 / seed36007 → outer median`, followed by `K/U/R/M`; casts are started/fired for that species row. Missing seeds remain visible. This is intentionally not a pooled per-type median.
### Tundra species

| Class/node | Species | Clean TTK by seed → outer | K/U/R/M | Casts started/fired |
| --- | --- | --- | ---: | ---: |
| tundra 03 striker | Hoarfrost Yeti | 1.50 / 1.50 / 1.35 → 1.50s | 24/0/0/0 | 0/0 |
| tundra 03 striker | Permafrost Behemoth | 4.05 / 3.60 / 4.10 → 4.05s | 30/0/0/0 | 0/0 |
| tundra 03 striker | Glacial Dire-Bear | 1.90 / 2.00 / 2.05 → 2.00s | 41/1/0/0 | 0/0 |
| tundra 03 striker | Rime-Tusk Mastodon | 1.85 / 1.80 / 1.90 → 1.85s | 35/0/0/0 | 0/0 |
| tundra 03 squire | Hoarfrost Yeti | 5.65 / 2.80 / 5.60 → 5.60s | 19/0/0/0 | 9/9 |
| tundra 03 squire | Permafrost Behemoth | 13.10 / 12.85 / 13.80 → 13.10s | 21/2/0/0 | 21/21 |
| tundra 03 squire | Glacial Dire-Bear | 3.90 / 6.05 / — → 4.97s | 11/0/0/1 | 0/0 |
| tundra 03 squire | Rime-Tusk Mastodon | 6.50 / 4.30 / 6.60 → 6.50s | 20/1/0/0 | 12/12 |
| tundra 03 apprentice | Hoarfrost Yeti | 3.00 / 3.00 / 3.00 → 3.00s | 24/0/0/0 | 0/0 |
| tundra 03 apprentice | Permafrost Behemoth | 3.75 / 3.60 / 3.60 → 3.60s | 30/1/0/0 | 0/0 |
| tundra 03 apprentice | Glacial Dire-Bear | 3.20 / 3.30 / 3.00 → 3.20s | 25/0/0/0 | 0/0 |
| tundra 03 apprentice | Rime-Tusk Mastodon | 3.00 / 3.00 / 3.00 → 3.00s | 31/0/0/0 | 0/0 |
| tundra 03 slinger | Hoarfrost Yeti | 1.80 / 2.00 / 1.30 → 1.80s | 39/1/0/0 | 0/0 |
| tundra 03 slinger | Permafrost Behemoth | 4.90 / 5.20 / 5.20 → 5.20s | 30/1/1/0 | 0/0 |
| tundra 03 slinger | Glacial Dire-Bear | 2.40 / 3.90 / 3.20 → 3.20s | 33/0/0/0 | 0/0 |
| tundra 03 slinger | Rime-Tusk Mastodon | 2.20 / 2.10 / 2.00 → 2.10s | 36/0/0/0 | 0/0 |
| tundra 03 conduit | Hoarfrost Yeti | 2.40 / 2.40 / 2.40 → 2.40s | 20/0/0/0 | 0/0 |
| tundra 03 conduit | Permafrost Behemoth | 14.60 / 14.60 / 14.60 → 14.60s | 22/1/0/0 | 0/0 |
| tundra 03 conduit | Glacial Dire-Bear | 3.30 / 3.10 / 3.10 → 3.10s | 17/0/0/0 | 0/0 |
| tundra 03 conduit | Rime-Tusk Mastodon | 4.40 / 4.40 / 4.60 → 4.40s | 19/0/0/0 | 0/0 |
| tundra 03 spirit | Hoarfrost Yeti | 1.80 / 2.50 / 1.90 → 1.90s | 35/0/0/0 | 0/0 |
| tundra 03 spirit | Permafrost Behemoth | 5.20 / 8.30 / 5.80 → 5.80s | 33/0/0/0 | 1/0 |
| tundra 03 spirit | Glacial Dire-Bear | 2.80 / 3.40 / 2.65 → 2.80s | 35/0/0/0 | 0/0 |
| tundra 03 spirit | Rime-Tusk Mastodon | 2.50 / 2.80 / 2.75 → 2.75s | 30/2/0/0 | 0/0 |
| tundra 05 striker | Hoarfrost Yeti | 1.20 / 1.35 / 1.20 → 1.20s | 37/0/0/0 | 0/0 |
| tundra 05 striker | Glacial Dire-Bear | 1.20 / 1.50 / 1.20 → 1.20s | 39/0/0/0 | 0/0 |
| tundra 05 striker | Permafrost Behemoth | 2.70 / 3.00 / 2.80 → 2.80s | 33/0/0/0 | 0/0 |
| tundra 05 striker | Rime-Tusk Mastodon | 1.30 / 1.20 / 1.30 → 1.30s | 35/1/0/0 | 0/0 |
| tundra 05 squire | Hoarfrost Yeti | 4.50 / 5.30 / 4.70 → 4.70s | 26/0/0/0 | 0/0 |
| tundra 05 squire | Glacial Dire-Bear | 2.80 / 4.30 / 5.40 → 4.30s | 19/0/0/0 | 0/0 |
| tundra 05 squire | Permafrost Behemoth | 6.50 / 6.30 / 6.70 → 6.50s | 26/1/0/0 | 0/0 |
| tundra 05 squire | Rime-Tusk Mastodon | 4.80 / 4.20 / 3.50 → 4.20s | 24/0/0/0 | 6/5 |
| tundra 05 apprentice | Hoarfrost Yeti | 2.20 / 2.20 / 2.40 → 2.20s | 30/0/0/0 | 0/0 |
| tundra 05 apprentice | Glacial Dire-Bear | 3.00 / 3.00 / 3.20 → 3.00s | 30/0/0/0 | 0/0 |
| tundra 05 apprentice | Permafrost Behemoth | 3.40 / 3.00 / 2.70 → 3.00s | 42/1/0/0 | 0/0 |
| tundra 05 apprentice | Rime-Tusk Mastodon | 2.40 / 2.20 / 2.40 → 2.40s | 30/0/0/0 | 0/0 |
| tundra 05 slinger | Hoarfrost Yeti | 0.95 / 1.20 / 0.80 → 0.95s | 38/1/0/0 | 0/0 |
| tundra 05 slinger | Glacial Dire-Bear | 1.80 / 1.80 / 2.00 → 1.80s | 36/0/0/0 | 0/0 |
| tundra 05 slinger | Permafrost Behemoth | 4.50 / 4.50 / 4.60 → 4.50s | 42/1/0/0 | 0/0 |
| tundra 05 slinger | Rime-Tusk Mastodon | 1.50 / 1.50 / 1.50 → 1.50s | 36/0/0/0 | 0/0 |
| tundra 05 conduit | Hoarfrost Yeti | 1.90 / 1.90 / 1.90 → 1.90s | 41/0/0/0 | 0/0 |
| tundra 05 conduit | Glacial Dire-Bear | 2.10 / 2.10 / 2.10 → 2.10s | 29/0/0/0 | 0/0 |
| tundra 05 conduit | Permafrost Behemoth | 8.10 / 8.10 / 8.10 → 8.10s | 21/2/0/0 | 0/0 |
| tundra 05 conduit | Rime-Tusk Mastodon | 2.70 / 2.60 / 2.60 → 2.60s | 30/1/0/0 | 0/0 |
| tundra 05 spirit | Hoarfrost Yeti | 2.15 / 2.05 / 1.35 → 2.05s | 34/1/0/0 | 0/0 |
| tundra 05 spirit | Glacial Dire-Bear | 2.80 / 2.05 / 1.80 → 2.05s | 31/1/0/0 | 0/0 |
| tundra 05 spirit | Permafrost Behemoth | 6.80 / 5.10 / 4.10 → 5.10s | 40/0/0/0 | 0/0 |
| tundra 05 spirit | Rime-Tusk Mastodon | 3.00 / 2.50 / 2.75 → 2.75s | 33/0/0/0 | 0/0 |

### Volcanic species

| Class/node | Species | Clean TTK by seed → outer | K/U/R/M | Casts started/fired |
| --- | --- | --- | ---: | ---: |
| volcanic 03 striker | Ember Skink | 0.80 / 0.70 / 0.80 → 0.80s | 240/0/0/0 | 0/0 |
| volcanic 03 striker | Obsidian Tortoise | 2.90 / 2.50 / 2.40 → 2.50s | 23/0/0/0 | 8/2 |
| volcanic 03 striker | Ashspitter Salamander | 1.30 / 1.20 / 1.45 → 1.30s | 60/0/0/0 | 0/0 |
| volcanic 03 striker | Magma Salamander | 2.60 / 2.50 / 3.00 → 2.60s | 23/0/0/0 | 1/0 |
| volcanic 03 striker | Infernal Direhound | 1.90 / 2.30 / 1.20 → 1.90s | 23/0/0/0 | 0/0 |
| volcanic 03 squire | Ember Skink | 1.40 / 1.80 / 1.40 → 1.40s | 137/0/0/0 | 0/0 |
| volcanic 03 squire | Obsidian Tortoise | 3.20 / 7.20 / — → 5.20s | 14/0/0/1 | 14/13 |
| volcanic 03 squire | Ashspitter Salamander | 2.10 / 6.00 / 2.30 → 2.30s | 39/0/0/0 | 0/0 |
| volcanic 03 squire | Infernal Direhound | 4.60 / 2.85 / 4.20 → 4.20s | 14/0/0/0 | 0/0 |
| volcanic 03 squire | Magma Salamander | 13.15 / 10.45 / 9.60 → 10.45s | 13/0/0/0 | 13/12 |
| volcanic 03 apprentice | Ember Skink | 1.80 / 1.80 / 2.20 → 1.80s | 126/2/2/0 | 0/0 |
| volcanic 03 apprentice | Obsidian Tortoise | 4.40 / 3.10 / 1.80 → 3.10s | 11/0/3/0 | 0/0 |
| volcanic 03 apprentice | Ashspitter Salamander | 3.00 / 3.00 / 3.00 → 3.00s | 41/2/3/0 | 0/0 |
| volcanic 03 apprentice | Infernal Direhound | 3.75 / 3.50 / 3.80 → 3.75s | 13/2/2/0 | 0/0 |
| volcanic 03 apprentice | Magma Salamander | 3.10 / 3.60 / 3.90 → 3.60s | 12/1/1/0 | 0/0 |
| volcanic 03 slinger | Ember Skink | 0.90 / 0.90 / 1.05 → 0.90s | 164/0/18/0 | 0/0 |
| volcanic 03 slinger | Ashspitter Salamander | 3.35 / 1.60 / 2.00 → 2.00s | 38/2/6/0 | 0/0 |
| volcanic 03 slinger | Obsidian Tortoise | 8.20 / 5.00 / 10.30 → 8.20s | 14/1/3/0 | 1/0 |
| volcanic 03 slinger | Infernal Direhound | 4.30 / 4.40 / 4.30 → 4.30s | 18/0/1/0 | 0/0 |
| volcanic 03 slinger | Magma Salamander | 7.05 / 6.60 / 8.30 → 7.05s | 15/1/3/0 | 4/4 |
| volcanic 03 conduit | Ember Skink | 3.00 / 6.50 / 7.55 → 6.50s | 79/8/15/0 | 0/0 |
| volcanic 03 conduit | Infernal Direhound | 15.00 / 19.40 / 15.50 → 15.50s | 7/2/2/0 | 0/0 |
| volcanic 03 conduit | Ashspitter Salamander | 9.90 / 3.65 / 5.00 → 5.00s | 14/1/1/0 | 0/0 |
| volcanic 03 conduit | Magma Salamander | 12.80 / — / 18.50 → 15.65s | 5/1/2/1 | 2/2 |
| volcanic 03 conduit | Obsidian Tortoise | 15.00 / — / 6.45 → 10.72s | 6/1/4/1 | 1/0 |
| volcanic 03 spirit | Ember Skink | 1.20 / 0.60 / 0.75 → 0.75s | 204/1/4/0 | 0/0 |
| volcanic 03 spirit | Ashspitter Salamander | 2.20 / 1.60 / 1.90 → 1.90s | 55/1/4/0 | 0/0 |
| volcanic 03 spirit | Obsidian Tortoise | 5.65 / 4.30 / 3.05 → 4.30s | 15/0/0/0 | 1/0 |
| volcanic 03 spirit | Infernal Direhound | 3.55 / 2.00 / 3.20 → 3.20s | 23/1/0/0 | 0/0 |
| volcanic 03 spirit | Magma Salamander | 4.85 / 5.20 / 4.05 → 4.85s | 24/0/0/0 | 1/1 |
| volcanic 05 striker | Ember Skink | 0.90 / 1.00 / 0.90 → 0.90s | 207/1/0/0 | 0/0 |
| volcanic 05 striker | Ashspitter Salamander | 1.60 / 1.60 / 1.65 → 1.60s | 52/1/0/0 | 0/0 |
| volcanic 05 striker | Obsidian Tortoise | 3.00 / 2.10 / 2.60 → 2.60s | 25/0/0/0 | 10/4 |
| volcanic 05 striker | Infernal Direhound | 2.20 / 1.80 / 2.05 → 2.05s | 15/0/0/0 | 0/0 |
| volcanic 05 striker | Magma Salamander | 3.80 / 3.40 / 3.30 → 3.40s | 19/0/0/0 | 6/0 |
| volcanic 05 squire | Ember Skink | 3.90 / 3.60 / 2.80 → 3.60s | 111/0/0/0 | 0/0 |
| volcanic 05 squire | Ashspitter Salamander | 6.50 / 4.20 / 6.70 → 6.50s | 33/1/0/0 | 0/0 |
| volcanic 05 squire | Obsidian Tortoise | 11.20 / 9.60 / 6.75 → 9.60s | 15/0/0/0 | 17/15 |
| volcanic 05 squire | Infernal Direhound | 7.80 / 4.20 / 4.20 → 4.20s | 11/0/0/0 | 0/0 |
| volcanic 05 squire | Magma Salamander | 13.55 / 17.35 / 17.70 → 17.35s | 7/0/0/0 | 10/7 |
| volcanic 05 apprentice | Ember Skink | 2.20 / 1.80 / 1.80 → 1.80s | 119/0/4/0 | 0/0 |
| volcanic 05 apprentice | Ashspitter Salamander | 3.10 / 3.40 / 3.10 → 3.10s | 37/0/2/0 | 0/0 |
| volcanic 05 apprentice | Obsidian Tortoise | 2.80 / 3.60 / — → 3.20s | 10/1/2/1 | 1/0 |
| volcanic 05 apprentice | Infernal Direhound | 4.00 / 2.55 / 3.20 → 3.20s | 14/0/2/0 | 0/0 |
| volcanic 05 apprentice | Magma Salamander | 6.70 / — / 4.30 → 5.50s | 7/1/2/1 | 2/2 |
| volcanic 05 slinger | Ember Skink | 0.90 / 0.90 / 2.00 → 0.90s | 142/3/13/0 | 0/0 |
| volcanic 05 slinger | Ashspitter Salamander | 4.20 / 2.00 / 4.30 → 4.20s | 32/5/7/0 | 0/0 |
| volcanic 05 slinger | Obsidian Tortoise | 5.80 / 6.25 / 4.65 → 5.80s | 15/1/7/0 | 4/2 |
| volcanic 05 slinger | Infernal Direhound | 3.35 / 2.50 / 4.35 → 3.35s | 11/1/0/0 | 0/0 |
| volcanic 05 slinger | Magma Salamander | 9.50 / 9.00 / 6.50 → 9.00s | 14/1/4/0 | 3/3 |
| volcanic 05 conduit | Ashspitter Salamander | — / 9.30 / 13.15 → 11.22s | 8/3/4/1 | 0/0 |
| volcanic 05 conduit | Ember Skink | 11.00 / 3.70 / 5.50 → 5.50s | 39/8/11/0 | 0/0 |
| volcanic 05 conduit | Infernal Direhound | 19.00 / 21.10 / 16.50 → 19.00s | 4/0/1/0 | 0/0 |
| volcanic 05 conduit | Magma Salamander | — / 31.60 / 26.45 → 29.02s | 4/2/1/1 | 8/8 |
| volcanic 05 conduit | Obsidian Tortoise | — / 25.50 / — → 25.50s | 2/1/0/2 | 1/1 |
| volcanic 05 spirit | Ember Skink | 1.50 / 0.90 / 1.20 → 1.20s | 193/2/5/0 | 0/0 |
| volcanic 05 spirit | Ashspitter Salamander | 3.35 / 1.55 / 2.20 → 2.20s | 35/0/3/0 | 0/0 |
| volcanic 05 spirit | Obsidian Tortoise | 6.95 / 3.20 / 5.80 → 5.80s | 18/3/5/0 | 2/2 |
| volcanic 05 spirit | Infernal Direhound | 4.10 / 3.00 / 3.20 → 3.20s | 16/1/0/0 | 0/0 |
| volcanic 05 spirit | Magma Salamander | 9.60 / 4.85 / 7.70 → 7.70s | 16/0/0/0 | 2/0 |

### Trench species

| Class/node | Species | Clean TTK by seed → outer | K/U/R/M | Casts started/fired |
| --- | --- | --- | ---: | ---: |
| trench 03 striker | Elder Leviathan | 13.40 / 13.40 / 13.65 → 13.40s | 28/1/0/0 | 57/53 |
| trench 03 striker | Abyssal Serpent | 6.10 / 5.80 / 5.80 → 5.80s | 23/2/0/0 | 18/0 |
| trench 03 striker | Hadal Stalker | 3.90 / 4.00 / 3.90 → 3.90s | 20/0/0/0 | 0/0 |
| trench 03 squire | Abyssal Serpent | 17.50 / 17.35 / 18.30 → 17.50s | 14/1/0/0 | 19/14 |
| trench 03 squire | Hadal Stalker | 11.20 / — / 51.90 → 31.55s | 7/0/0/1 | 12/12 |
| trench 03 squire | Elder Leviathan | 43.55 / 42.20 / 41.65 → 42.20s | 9/2/0/0 | 51/50 |
| trench 03 apprentice | Elder Leviathan | 6.60 / 6.30 / 6.60 → 6.60s | 32/1/0/0 | 1/1 |
| trench 03 apprentice | Abyssal Serpent | 4.90 / 5.20 / 4.20 → 4.90s | 34/0/0/0 | 6/4 |
| trench 03 apprentice | Hadal Stalker | 3.60 / 2.40 / 3.40 → 3.40s | 26/0/0/0 | 2/1 |
| trench 03 slinger | Elder Leviathan | 15.80 / 15.30 / 15.50 → 15.50s | 20/1/0/0 | 20/16 |
| trench 03 slinger | Abyssal Serpent | 8.30 / 8.50 / 8.45 → 8.45s | 20/2/0/0 | 19/11 |
| trench 03 slinger | Hadal Stalker | 6.25 / 6.10 / 4.30 → 6.10s | 20/0/0/0 | 5/2 |
| trench 03 conduit | Elder Leviathan | 112.40 / 91.40 / 121.70 → 112.40s | 5/4/3/0 | 50/49 |
| trench 03 conduit | Hadal Stalker | 16.25 / 11.60 / — → 13.93s | 3/1/1/1 | 5/4 |
| trench 03 conduit | Abyssal Serpent | 30.80 / 30.85 / — → 30.82s | 5/3/4/1 | 7/7 |
| trench 03 spirit | Elder Leviathan | 20.50 / 22.70 / 29.80 → 22.70s | 19/5/2/0 | 47/42 |
| trench 03 spirit | Abyssal Serpent | 11.40 / 10.60 / 15.70 → 11.40s | 13/1/1/0 | 14/13 |
| trench 03 spirit | Hadal Stalker | 7.15 / 7.00 / 6.50 → 7.00s | 10/0/0/0 | 9/4 |
| trench 05 striker | Hadal Stalker | 4.70 / 4.85 / 4.50 → 4.70s | 21/2/0/0 | 1/1 |
| trench 05 striker | Abyssal Serpent | 8.15 / 7.90 / 7.75 → 7.90s | 23/0/0/0 | 23/20 |
| trench 05 striker | Elder Leviathan | 17.00 / 16.90 / 16.30 → 16.90s | 19/0/0/0 | 38/38 |
| trench 05 squire | Hadal Stalker | 15.60 / 16.00 / 49.50 → 16.00s | 5/0/0/0 | 9/8 |
| trench 05 squire | Elder Leviathan | 53.30 / 59.70 / 54.80 → 54.80s | 9/1/0/0 | 63/62 |
| trench 05 squire | Abyssal Serpent | 26.45 / 24.55 / 26.20 → 26.20s | 7/2/0/0 | 18/18 |
| trench 05 apprentice | Hadal Stalker | 3.60 / 3.60 / 3.60 → 3.60s | 27/0/0/0 | 1/1 |
| trench 05 apprentice | Elder Leviathan | 6.40 / 6.50 / 7.20 → 6.50s | 29/2/0/0 | 1/1 |
| trench 05 apprentice | Abyssal Serpent | 4.40 / 5.10 / 5.20 → 5.10s | 27/0/0/0 | 1/0 |
| trench 05 slinger | Hadal Stalker | 7.00 / 6.80 / 6.65 → 6.80s | 15/0/0/0 | 12/3 |
| trench 05 slinger | Abyssal Serpent | 10.40 / 10.60 / 11.95 → 10.60s | 18/0/0/0 | 18/18 |
| trench 05 slinger | Elder Leviathan | 19.75 / 20.80 / 18.20 → 19.75s | 16/4/1/0 | 25/24 |
| trench 05 conduit | Elder Leviathan | — / 214.10 / — → 214.10s | 1/5/4/2 | 52/52 |
| trench 05 conduit | Abyssal Serpent | 68.30 / — / 56.80 → 62.55s | 3/2/2/1 | 12/10 |
| trench 05 conduit | Hadal Stalker | — / 75.20 / 35.40 → 55.30s | 2/1/1/1 | 7/7 |
| trench 05 spirit | Hadal Stalker | 12.70 / 10.40 / 11.35 → 11.35s | 13/1/0/0 | 15/14 |
| trench 05 spirit | Abyssal Serpent | 22.20 / 22.00 / 15.25 → 22.00s | 7/1/1/0 | 9/9 |
| trench 05 spirit | Elder Leviathan | 59.20 / 43.80 / 39.30 → 43.80s | 9/3/2/0 | 44/43 |

## Slow simulations versus hard combat

A slow mixed TTK is not automatically dangerous combat. Conduit can take long to finish target bodies while its minions absorb or distribute pressure; conversely, a short fight can still end in a lethal burst or accumulated DoT. The observed separation is:
| Biome | Slowest mixed cells | Hard-combat signal | Interpretation |
| --- | --- | --- | --- |
| Tundra | node03 Squire 6.60s; node05 Squire 5.35s; node03 Conduit 4.30s | Striker/Squire incoming medians about 4,536 / 4,500 HP, but min-HP medians remained about 69.8% / 77.8%; zero deaths | Sustained source pressure without a lethal outcome in this template; do not convert duration or incoming totals into a global mob nerf. |
| Volcanic | node05 Conduit 6.15s; node03 Conduit 5.70s; node05 Squire 4.20s | One death at 70.5s, peak P9, 2,552 sampled seconds at 3+ pursuers, and 147 regain records | Targeted DoT/late-join pressure review; frequency is too low for blanket adoption. |
| Trench | node05 Conduit 68.30s; node05 Squire 40.00s; node03 Conduit 31.30s; node03 Spirit 17.50s | zero deaths, 48 unfinished target records, 22 regain records, and sparse species eligibility | Long/slow attrition with incomplete estimator coverage, not a demonstrated universal survival failure. |

Tundra’s baseline was deliberately not optimized with known control/kiting alternatives. Its zero-death result is useful coverage, not proof that Mountain boots are best. The result supports a later comparison of applicable Hamstring, Binding Strike, slow-resist, or other control packages only if separately authorized.

## Existing Night5-R1 read-only review

The following 24 rows were read from the existing Night5-R1 results root. They were not replayed, rewritten, or pooled as matched treatments. WE/PD is window-ended/player-died; `minHP / low sample` is the retained normalized minimum and the lowest sampled HP with timestamp. Pressure columns preserve source and damage type from the final 10s and 30s before death or end. `P/3+/LJ/RInt/B/LQ` are peak pursuers / sampled seconds with at least three pursuers / late joiners / recovery interruptions / blocked samples / maximum quiet seconds.
### Mountain T2 Striker no-orbit boot-arm rows

| Cell / seed | Outcome and seconds | Kills / damage events | Min HP / low sample | Final 10s pressure | Final 30s pressure | P/3+/LJ/RInt/B/LQ | Casts started/fired | Defensive activation evidence |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| mountain t2 striker 03 no orbit mountain / s26003 | PD @109.4s (death) | 5 / 6 | 0% / 19.297 HP @107.0s | Stone Eagle direct 142.7hp/2x/max72<br>Boulder Thrower direct 81hp/1x/max81 | Stone Eagle direct 295.7hp/4x/max81<br>Boulder Thrower direct 174hp/3x/max81<br>Granite Titan direct 77hp/1x/max77 | P2/3+0s/LJ1/RInt2/B0/LQ8.8s | 12/12 | second-wind=4; cleanse=0; last second-wind@96.9s, second-wind@108.9s |
| mountain t2 striker 03 no orbit mountain / s28001 | PD @360.1s (death) | 14 / 16 | 0% / 18.546 HP @110.0s | Stone Eagle direct 297hp/4x/max81<br>Granite Titan direct 77hp/1x/max77 | Stone Eagle direct 297hp/4x/max81<br>Granite Titan direct 187.3hp/4x/max77 | P2/3+0s/LJ3/RInt1/B0/LQ14.7s | 38/38 | second-wind=10; cleanse=0; last second-wind@351.8s |
| mountain t2 striker 03 no orbit mountain / s30011 | PD @44.9s (death) | 2 / 4 | 0% / 7.326 HP @42.0s | Boulder Thrower direct 243hp/3x/max81<br>Granite Titan direct 154hp/2x/max77 | Boulder Thrower direct 387.6hp/7x/max81<br>Granite Titan direct 154hp/2x/max77 | P2/3+0s/LJ1/RInt0/B0/LQ10.5s | 5/4 | second-wind=1; cleanse=0; last second-wind@37.0s |
| mountain t2 striker 03 no orbit cave / s26003 | PD @899.5s (death) | 31 / 32 | 0% / 42.323 HP @896.0s | Granite Titan direct 154hp/2x/max77<br>Stone Eagle direct 137.5hp/2x/max72 | Granite Titan direct 343hp/6x/max77<br>Stone Eagle direct 137.5hp/2x/max72 | P2/3+0s/LJ1/RInt6/B0/LQ13.3s | 89/88 | second-wind=21; cleanse=0; last second-wind@888.2s |
| mountain t2 striker 03 no orbit cave / s28001 | PD @143.6s (death) | 5 / 7 | 0% / 22.517 HP @143.0s | Boulder Thrower direct 236.1hp/3x/max81<br>Granite Titan direct 154hp/2x/max77 | Granite Titan direct 239hp/4x/max77<br>Boulder Thrower direct 236.1hp/3x/max81 | P2/3+0s/LJ1/RInt1/B0/LQ9.1s | 14/14 | second-wind=3; cleanse=0; last second-wind@135.1s |
| mountain t2 striker 03 no orbit cave / s30011 | WE @900.0s (lowest-sampled-hp) | 42 / 43 | 48.4% / 133.946 HP @887.0s | Granite Titan direct 104hp/2x/max77 | Granite Titan direct 296.4hp/6x/max77 | P1/3+0s/LJ0/RInt7/B0/LQ11.8s | 82/80 | second-wind=14; cleanse=0; last second-wind@887.1s |
| mountain t2 striker 05 no orbit mountain / s26003 | PD @18.7s (death) | 0 / 1 | 0% / 55.918 HP @11.0s | Boulder Thrower direct 237.8hp/3x/max81<br>Granite Titan direct 154hp/2x/max77 | Boulder Thrower direct 249.8hp/4x/max81<br>Granite Titan direct 231hp/3x/max77 | P2/3+0s/LJ1/RInt0/B0/LQ3.1s | 2/2 | second-wind=1; cleanse=0; last second-wind@11.0s |
| mountain t2 striker 05 no orbit mountain / s28001 | WE @900.0s (lowest-sampled-hp) | 55 / 56 | 43.5% / 129.768 HP @515.0s | Granite Titan direct 90.2hp/2x/max71.8 | Granite Titan direct 188.4hp/5x/max71.8 | P2/3+0s/LJ2/RInt22/B0/LQ11.8s | 95/89 | second-wind=15; cleanse=0; last second-wind@891.6s |
| mountain t2 striker 05 no orbit mountain / s30011 | WE @900.0s (lowest-sampled-hp) | 57 / 57 | 12.4% / 35.76 HP @351.0s | Granite Titan direct 77hp/1x/max77<br>Stone Eagle direct 32.7hp/1x/max32.7 | Granite Titan direct 247hp/5x/max77<br>Stone Eagle direct 32.7hp/1x/max32.7 | P2/3+0s/LJ7/RInt22/B0/LQ17.7s | 100/95 | second-wind=19; cleanse=0; last second-wind@887.9s |
| mountain t2 striker 05 no orbit cave / s26003 | PD @203.4s (death) | 11 / 13 | 0% / 83.698 HP @196.0s | Boulder Thrower direct 215.4hp/3x/max81<br>Granite Titan direct 154hp/2x/max77 | Granite Titan direct 231hp/3x/max77<br>Boulder Thrower direct 227.4hp/4x/max81 | P2/3+0s/LJ1/RInt5/B0/LQ14.3s | 20/19 | second-wind=4; cleanse=0; last second-wind@195.7s |
| mountain t2 striker 05 no orbit cave / s28001 | WE @900.0s (lowest-sampled-hp) | 53 / 54 | 18% / 62.048 HP @722.0s | Granite Titan direct 8hp/1x/max8 | Granite Titan direct 121.7hp/4x/max71.8 | P2/3+0s/LJ1/RInt17/B0/LQ12.7s | 90/85 | second-wind=17; cleanse=0; last second-wind@880.7s |
| mountain t2 striker 05 no orbit cave / s30011 | PD @408.0s (death) | 24 / 25 | 0% / 0 HP @408.0s | Granite Titan direct 148.8hp/2x/max77<br>Stone Eagle direct 144hp/2x/max72 | Granite Titan direct 228.7hp/4x/max77<br>Stone Eagle direct 225hp/3x/max81<br>Boulder Thrower direct 12hp/1x/max12 | P2/3+0s/LJ1/RInt7/B0/LQ20.2s | 40/38 | second-wind=7; cleanse=0; last second-wind@396.7s |

### T4A Spirit / Desert rows

| Cell / seed | Outcome and seconds | Kills / damage events | Min HP / low sample | Final 10s pressure | Final 30s pressure | P/3+/LJ/RInt/B/LQ | Casts started/fired | Defensive activation evidence |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| t4a desert 03 spirit / s26003 | WE @900.0s (lowest-sampled-hp) | 75 / 79 | 38.4% / 236 HP @296.0s | Sunshield Scarab direct 202hp/2x/max129 | Sunshield Scarab direct 578.8hp/6x/max129<br>Dune Basilisk direct 36hp/1x/max36 | P3/3+28s/LJ73/RInt5/B0/LQ9.9s | 25/23 | second-wind=9; cleanse=21; last cleanse@877.4s, second-wind@883.1s |
| t4a desert 03 spirit / s28001 | WE @900.0s (lowest-sampled-hp) | 79 / 83 | 43.2% / 308.393 HP @898.0s | Sunshield Scarab direct 496hp/4x/max129 | Sunshield Scarab direct 496hp/4x/max129 | P3/3+10s/LJ65/RInt10/B0/LQ11.5s | 20/15 | second-wind=10; cleanse=16; last cleanse@889.3s, second-wind@898.0s |
| t4a desert 03 spirit / s30011 | PD @572.8s (death) | 51 / 60 | 0% / 15.515 HP @562.0s | Sunshield Scarab direct 659.5hp/6x/max129 | Sunshield Scarab direct 1,949.5hp/16x/max129 | P5/3+28s/LJ42/RInt10/B0/LQ11.9s | 8/6 | second-wind=8; cleanse=9; last second-wind@553.0s, second-wind@563.5s |
| t4a desert 05 spirit / s26003 | PD @494.6s (death) | 35 / 42 | 0% / 19.45 HP @493.0s | Sunshield Scarab direct 717.9hp/6x/max129 | Sunshield Scarab direct 1,666.6hp/14x/max129 | P4/3+17s/LJ33/RInt6/B0/LQ14.4s | 8/8 | second-wind=12; cleanse=11; last second-wind@462.4s, second-wind@473.8s, second-wind@484.3s |
| t4a desert 05 spirit / s28001 | WE @900.0s (lowest-sampled-hp) | 97 / 102 | 40.2% / 248 HP @734.0s | — | Sunshield Scarab direct 188hp/2x/max152<br>Dune Basilisk direct 72hp/2x/max36 | P3/3+2s/LJ64/RInt17/B0/LQ20.3s | 16/13 | second-wind=13; cleanse=14; last cleanse@889.1s, second-wind@889.6s, cleanse@899.1s |
| t4a desert 05 spirit / s30011 | WE @900.0s (lowest-sampled-hp) | 92 / 94 | 44.6% / 274.25 HP @629.0s | — | Sunshield Scarab direct 350hp/3x/max129 | P3/3+6s/LJ78/RInt7/B0/LQ9.9s | 17/10 | second-wind=6; cleanse=10; last none |

### T4B Slinger / Graveyard rows

| Cell / seed | Outcome and seconds | Kills / damage events | Min HP / low sample | Final 10s pressure | Final 30s pressure | P/3+/LJ/RInt/B/LQ | Casts started/fired | Defensive activation evidence |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| t4b graveyard 03 slinger / s26003 | WE @900.0s (lowest-sampled-hp) | 153 / 155 | 15.6% / 111.765 HP @592.0s | Plague Hound direct 67.2hp/2x/max51.5<br>Bone Crawler direct 32.2hp/1x/max32.2<br>Bone Rat direct 25.8hp/3x/max11<br>Plague Hound debt 2hp/2x/max1 | Carrion Vulture direct 95.7hp/3x/max41.4<br>Bone Crawler direct 75.4hp/3x/max33.1<br>Plague Hound direct 67.2hp/2x/max51.5<br>Bone Rat direct 58hp/5x/max16.6<br>Plague Hound dot 18hp/1x/max18<br>Plague Hound debt 3hp/3x/max1 | P5/3+409s/LJ112/RInt5/B0/LQ4.6s | 79/79 | second-wind=17; cleanse=18; last cleanse@899.0s |
| t4b graveyard 03 slinger / s28001 | PD @125.3s (death) | 20 / 23 | 0% / 91.621 HP @125.0s | Risen Plague Hound dot 380hp/7x/max86<br>Risen Plague Hound direct 288.9hp/13x/max30.4<br>Bone Crawler direct 237.4hp/9x/max31.3<br>Gravewright direct 147.2hp/4x/max36.8<br>Risen Bone Crawler direct 27.6hp/4x/max13.8<br>Risen Plague Hound debt 13hp/4x/max4 | Bone Crawler direct 833.5hp/35x/max34<br>Gravewright direct 439.8hp/14x/max37.7<br>Risen Plague Hound dot 380hp/7x/max86<br>Risen Plague Hound direct 307.3hp/15x/max30.4<br>Plague Hound direct 263.1hp/5x/max57<br>Plague Hound dot 140hp/5x/max52 | P5/3+63s/LJ18/RInt1/B0/LQ3.9s | 7/6 | second-wind=4; cleanse=3; last second-wind@113.9s, cleanse@116.2s, second-wind@124.4s |
| t4b graveyard 03 slinger / s30011 | PD @731.4s (death) | 113 / 118 | 0% / 65.249 HP @215.0s | Bone Crawler direct 412.2hp/16x/max31.3<br>Plague Hound dot 274hp/6x/max68<br>Plague Hound direct 273.2hp/6x/max51.5<br>Gravewright direct 81hp/5x/max36.8<br>Risen Bone Crawler direct 32.2hp/3x/max13.8<br>Bone Crawler debt 15hp/4x/max5 | Bone Crawler direct 578.7hp/22x/max31.3<br>Plague Hound direct 416.8hp/10x/max57<br>Plague Hound dot 310hp/8x/max68<br>Gravewright direct 178.5hp/9x/max38.6<br>Risen Bone Crawler direct 32.2hp/3x/max13.8<br>Bone Crawler debt 19hp/6x/max5 | P6/3+364s/LJ92/RInt6/B0/LQ6.3s | 62/61 | second-wind=17; cleanse=25; last second-wind@721.9s, cleanse@723.2s |
| t4b graveyard 05 slinger / s26003 | WE @900.0s (lowest-sampled-hp) | 111 / 115 | 31.3% / 212.37 HP @149.0s | Bone Crawler direct 349.6hp/14x/max31.3<br>Bone Rat direct 161.9hp/20x/max11<br>Gravewright direct 132.5hp/5x/max36.8<br>Bone Rat debt 36hp/9x/max4<br>Risen Bone Crawler direct 32.2hp/3x/max13.8<br>Bone Crawler debt 4hp/1x/max4 | Bone Crawler direct 742.4hp/29x/max36.8<br>Bone Rat direct 288.9hp/36x/max12.9<br>Gravewright direct 217.1hp/8x/max36.8<br>Risen Bone Crawler direct 73.6hp/6x/max13.8<br>Bone Rat debt 45hp/13x/max4<br>Bone Crawler debt 11hp/6x/max4 | P6/3+387s/LJ105/RInt1/B0/LQ5.3s | 60/51 | second-wind=20; cleanse=22; last second-wind@893.5s |
| t4b graveyard 05 slinger / s28001 | PD @227.6s (death) | 29 / 31 | 0% / 77.15 HP @67.0s | Plague Hound dot 380hp/9x/max68<br>Plague Hound direct 360.6hp/7x/max51.5<br>Bone Crawler direct 233.7hp/11x/max31.3<br>Gravewright direct 132.5hp/5x/max36.8<br>Bone Crawler debt 26hp/7x/max4<br>Risen Bone Crawler direct 18.4hp/2x/max13.8 | Bone Crawler direct 527.2hp/23x/max35.9<br>Plague Hound direct 481.2hp/10x/max53.4<br>Plague Hound dot 398hp/10x/max68<br>Gravewright direct 232.8hp/9x/max41.4<br>Bone Crawler debt 27hp/8x/max4<br>Risen Bone Crawler direct 18.4hp/2x/max13.8 | P5/3+123s/LJ22/RInt0/B0/LQ3.6s | 14/11 | second-wind=11; cleanse=14; last cleanse@214.0s, second-wind@216.5s, cleanse@224.0s, second-wind@227.0s |
| t4b graveyard 05 slinger / s30011 | PD @300.7s (death) | 37 / 41 | 0% / 35.538 HP @300.0s | Risen Plague Hound dot 410hp/6x/max86<br>Bone Crawler direct 305.4hp/14x/max31.3<br>Risen Plague Hound direct 212.5hp/7x/max30.4<br>Plague Hound dot 156hp/3x/max86<br>Plague Hound direct 154.6hp/3x/max51.5<br>Gravewright direct 69.9hp/4x/max36.8 | Bone Crawler direct 471hp/21x/max36.8<br>Risen Plague Hound dot 410hp/6x/max86<br>Plague Hound direct 278.8hp/6x/max56.1<br>Risen Plague Hound direct 212.5hp/7x/max30.4<br>Plague Hound dot 192hp/5x/max86<br>Gravewright direct 144.4hp/6x/max37.7 | P6/3+159s/LJ41/RInt0/B0/LQ5.8s | 31/27 | second-wind=8; cleanse=5; last cleanse@289.1s, second-wind@293.0s, cleanse@299.1s |

Night5 READY views for the reviewed arms were:
| Arm | READY HP / attack / plating | DR / dodge / evade / barrier | Speed / range / cooldown | Equipment | Root / stance / techniques / guards | Passives |
| --- | --- | --- | --- | --- | --- | --- |
| Mountain T2 Striker / mountain-boots-t2 | 267 / 33 / 20 | DR 0.020 / dodge 0.000 / evade 0.000 / barrier 69 | 168 / 12 / 490 ms | gale-needle; mountain-vest-t2; mountain-charm-t2; mountain-boots-t2; core-tempered; none | root cadence-root; offensive-stance; techniques sweep; guards second-wind+cleanse | defense.recovery-pulse-pct=0.20 |
| Mountain T2 Striker / cave-boots-t2 | 267 / 33 / 20 | DR 0.020 / dodge 0.000 / evade 0.000 / barrier 69 | 178 / 12 / 490 ms | gale-needle; mountain-vest-t2; mountain-charm-t2; cave-boots-t2; core-tempered; none | root cadence-root; offensive-stance; techniques sweep; guards second-wind+cleanse | defense.recovery-pulse-pct=0.20 |
| T4A Spirit / Desert | 615 / 165 / 93 | DR 0.000 / dodge 0.000 / evade 0.000 / barrier 185 | 292 / 142 / 421 ms | volcanic-eruption-lash; desert-vest-t4; desert-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart | root energy-root; offensive-stance; techniques frenzy+sweep; guards second-wind+cleanse | defense.debuff-resistance=0.30 |
| T4B Slinger / Graveyard | 592 / 86 / 49 | DR 0.000 / dodge 0.340 / evade 0.700 / barrier 0 | 282 / 32 / 223 ms | jungle-deathfang-rapier; graveyard-vest-t4; graveyard-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart | root reload-root; offensive-stance; techniques frenzy+sweep; guards second-wind+cleanse | defense.dot-resistance=0.35; defense.debuff-resistance=0.25; defense.evade-mitigation=0.20; defense.recovery-on-kill-pct=0.20; defense.recovery-pulse-pct=0.26 |

Night5 review totals and interpretation:
- Mountain T2 Striker died 8/12 overall, exactly 4/6 with Mountain boots and 4/6 with Cave boots. Deaths were direct Stone Eagle, Boulder Thrower, or Granite Titan pressure; no row had three-plus sampled player pursuers. The paired boot result is a bounded control/build question, not an automatic mob or class patch.
- T4A Spirit/Desert had 2/6 deaths. Survivors reached 900s in four rows, while the deaths reached 572.8s and 494.6s. The observed source mix centers on Sunshield Scarab direct pressure; treat it as a Spirit/Desert build-sensitive review, not a universal Desert conclusion.
- T4B Slinger/Graveyard had 4/6 deaths. Death rows show Risen Plague Hound DoT/direct pressure and Bone Crawler direct pressure, while successful rows include 900s survivors with substantial multi-pursuer exposure. That supports a narrow Graveyard DoT/pack-mechanic review, not an across-the-board HP reduction.
- Defensive activations are reported as observed counts and last timestamps, not counterfactual opportunity failures. A death after a Second Wind or Cleanse activation does not prove that the ability was available, correctly timed, or ineffective in an expert-controlled run.

## Exact Durability21 death review

The only new player death was `dur21-volcanic-05-conduit-baseline`, seed 32003, at 70.5s. The run had 6 kills, 12 damaged target records, 3463 incoming HP, minimum HP 0, largest hit 88, and maximum one-second incoming 281.
Terminal cause: Ash Burn DoT from Ashspitter Salamander, 5 stacks, 88 damage. The last combat episode ran 8.9–70.5s (61.6s), grew from 1 to 14 members, and added 13 late joiners.
Top final pressure by 10s: Ashspitter Salamander dot 791hp/11x/max88<br>Ember Skink dot 457hp/10x/max57<br>Magma Salamander direct 168hp/3x/max56<br>Ashspitter Salamander direct 50hp/5x/max10. By 30s: Ember Skink dot 1,228hp/26x/max57<br>Ashspitter Salamander dot 1,196hp/21x/max88<br>Magma Salamander direct 416hp/7x/max80<br>Ashspitter Salamander direct 125hp/12x/max15<br>Ember Skink direct 4hp/4x/max1.
Observed ability counts were Cleanse 7, Frenzy 6, Sweep 10, and Second Wind 2; the last Cleanse was at 61.9s and the last Second Wind at 62.3s. Casts started/fired were 2/2; recovery interruptions were 0.
Interpretation: this is a credible accumulated-pressure case—late joining, repeated Ash Burn and Ember Skink DoT, and a terminal five-stack DoT—rather than a single oversized environment hit. The player killed six targets before death, and no environment damage was recorded. A player could plausibly pre-empt the stack, disengage before the late-member pile-up, or use a better applicable control/cleanse timing, but the retained synthetic bot trace cannot establish preventability or counterfactual success. It is one pressure/mechanic candidate for planner review, not a global Volcanic HP multiplier or a universal TTK floor.

## Combined T4 seven-biome coverage and work map

Night5-R1 and Durability21 are descriptive, differently scoped observations. They are not matched trials and should not be pooled into a single winner ranking. Night5 supplied Desert, Graveyard, Jungle, partial Mountain, and five T4B Trench cells; Durability21 supplied full 12-cell screens for Tundra, Volcanic, and Trench.
| T4 biome | Night5-R1 retained coverage | Durability21 coverage | Combined disposition | Work interpretation |
| --- | --- | --- | --- | --- |
| Desert | T4A/B/C: 36 cells / 108 runs; 2 T4A Spirit deaths | — | build-sensitive | Keep the Spirit/Desert pairing and Sunshield Scarab pressure under review; no biome-wide change. |
| Graveyard | T4A/B/C: 36 cells / 108 runs; 4 T4B Slinger deaths and highest T4 target censoring | — | pressure or mechanic candidate | Inspect Risen Plague Hound DoT/direct and Bone Crawler pack pressure with role-specific evidence. |
| Jungle | T4A/B/C: 36 cells / 108 runs; 54 wall-censored rows (19/15/20) | — | unknown | Performance/cutoff-limited. Zero deaths is not a balance result; do not call Jungle balanced. |
| Mountain | T4A 11 / T4B 12 / T4C 10 cells; 33 cells / 99 runs | — | durability candidate | Existing T4 view is incomplete by branch, and the T2 Striker boot result remains a separate durability/control question. |
| Tundra | — | 12 cells / 36 runs; 36 WE, 0 PD, complete | retain | No broad durability disposition from this template; Glacial Dire-Bear/Squire has one limited two-seed species row. |
| Volcanic | — | 12 cells / 36 runs; 35 WE, 1 PD, complete | pressure or mechanic candidate | Inspect Ash Burn/late-join pressure in Conduit/Marshal; one death does not justify a blanket mob or class edit. |
| Trench | T4B: 5 cells / 15 runs; rare partial branchB species | 12 cells / 36 runs; 36 WE, 0 PD, complete | unknown / build-sensitive | Broad coverage is now present, but node05 Conduit is extremely slow and Elder Leviathan is inconclusive; do not infer safety or a global multiplier. |

Jungle remains performance-limited, not automatically balanced. Mountain’s disposition is a bounded durability/control candidate only because the existing branch coverage and T2 Striker deaths leave a narrow question; it is not a blanket T4 mob finding.

## Role-based numerical candidates for planner review

These are candidate roles and measurement questions for the planned consolidated T1–T4 mob pass. No value below was changed or adopted in this experiment.
| Role / source | Observed evidence | Planner-review candidate | Guardrail |
| --- | --- | --- | --- |
| Volcanic DoT/stack role — Ashspitter Salamander / Ash Burn | One Conduit death at 70.5s; terminal 5-stack DoT for 88; Ashspitter DoT 791 HP in final 10s and 1,196 HP in final 30s; block had 2,552 sampled 3+ pursuer seconds | Review stack cap, refresh/decay, and DoT cadence/damage as a targeted role-level number; exact value deferred | Preserve direct-damage role and require repeatable cross-build pressure before adoption; no global HP multiplier |
| Graveyard DoT/pack role — Risen Plague Hound plus Bone Crawler | Four T4B Slinger deaths; death rows show mixed DoT/direct pressure while 900s survivors exist | Review DoT tick/cadence and pack-join timing separately from base HP | Do not generalize from Slinger/Graveyard or reduce every Graveyard species together |
| Desert ranged/elite pressure — Sunshield Scarab | Two T4A Spirit deaths; survivors include 900s windows; source is concentrated but pairing/build fit is unresolved | Review source cadence and Spirit/Desert counterplay before any small attack/pressure adjustment | Keep Desert species and Spirit Equinox treatment separate; require a paired reference |
| Trench elite/attrition — Elder Leviathan / Abyssal Serpent | Conduit node05 is the slowest cell at 68.30s; Elder Leviathan has only one eligible seed there; no player deaths | No numeric candidate yet; first classify whether the tail is body HP, control, minion compensation, or rare-species estimation | Fewer than two eligible seeds is inconclusive; do not lower HP or attack from this row |

The planner should use role-specific bounded numbers—DoT cadence/stack pressure, pack-join timing, source attack/cadence, or elite body durability where evidence supports it—rather than one global T4 HP multiplier or a universal per-class TTK floor. The next authorized direction remains a consolidated initial T1–T4 mob pass, focused regression/boss/progression checks, basic x1 pacing and operational readiness, then invited player feedback. No automatic production adoption, new experiment, cap extension, or release claim follows from Durability21.

## Raw artifacts

- [batch manifest](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability21-20260917/results/batch-manifest.json>)
- [batch ended marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability21-20260917/results/batch-ended.json>)
- [operator ledger](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability21-20260917/results/operator-ledger.jsonl>)
- [Tundra index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability21-20260917/results/tundra/index.json>) and [Tundra audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability21-20260917/results/tundra/night5-audit.json>)
- [Volcanic index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability21-20260917/results/volcanic/index.json>) and [Volcanic audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability21-20260917/results/volcanic/night5-audit.json>)
- [Trench index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability21-20260917/results/trench/index.json>) and [Trench audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability21-20260917/results/trench/night5-audit.json>)
- [Durability21 source checkout](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability21-20260917/source>)
- [Night5-R1 report](<C:/Users/osaif/Documents/Claude/Projects/MMO%20idle/docs/briefs/bot-balance-night5-r1-report.md>) and [Night5-R1 review](<C:/Users/osaif/Documents/Claude/Projects/MMO%20idle/docs/briefs/bot-balance-night5-r1-review.md>)
- [Night5-R1 results root](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results>)

Report generated from the retained Durability21 indices/audits and the packet-scoped Night5-R1 row review. Raw artifacts remain authoritative; this report is a descriptive interpretation and does not certify live gameplay.

## Planner correction and updated design intent (2026-09-17)

The24 death-review table low-sample values had raw sampled HP multiplied by100
and labeled as percentages. Corrected the second value to HP units; the first
normalized minHP percentage remains unchanged. Raw samples are authoritative.
T4 Mountain's durability concern comes from its own species kill times (~2s for
Mammoth/Rhino), not T2 Striker deaths. Zero deaths does not justify retaining
Tundra's current durability: its species medians are roughly2–5s. The user has
clarified ALL THREE Trench species should feel like40–60s mini-boss fights; the
prior retain/no-HP-increase interpretation is superseded. Class spread and long
Conduit tails remain guardrails, not reasons to ignore the biome design goal.
See the Durability22 packet for experimental candidates; no production changes.
