# Durability22 — provisional T4 role durability and Trench mini-boss pacing

Date: 2026-09-17  
Status: complete; sealed synthetic screen and read-only audit completed; no production balance edit authorized  
Decision scope: provisional species durability, Trench encounter pacing, and pressure interpretation only

## Executive result

Durability22 executed the packet-defined four-block matrix once and sequentially on the frozen checkout. The runner exited 0, all 288 observations were retained, each block verifier passed, geometry control/candidate parity was checked, and no retry, relaunch, adaptive build, source edit, balance edit, cap extension, or service was introduced.

- Matrix: 96 cells / 288 observations — Trench, Mountain, Tundra, and Desert; Trench used 600-second windows and the other blocks 300-second windows.
- Outcomes: 283 window-ended, 5 player deaths, 0 wall ceilings. The five deaths were three Mountain node03 candidate deaths and two Desert Spirit control deaths at seed 38011; no Trench or Tundra player died.
- Target stream: 8,144 killed, 368 unfinished/censored, 377 with observed HP regain, and 8,512 damaged target records. Regain overlaps killed/unfinished; unfinished target records are not player deaths.
- Exposure reconstruction: 0 long-quiet runs, 0 blocked samples, and 144 control/candidate geometry comparisons with 0 mismatches. The run logged 2,727 late joiners and 2,312 sampled seconds with three or more player pursuers; exact block totals are in the completion table below.
- Trench candidate center: Elder Leviathan 62.1s, Abyssal Serpent 48.7s, Hadal Stalker 38.0s across the 12 node/class cells per species. This is near the 40–60s design band at representative medians, but the intended class spread remains wide: candidate class medians span 20.0s (Apprentice) to 147.0s (Conduit).
- Interpretation: retain the three Trench HP overlays as provisional planner candidates, with no class patch or attack compensation. The long Conduit tail is an engagement/delivery diagnostic, not sufficient evidence for a class-wide change; Mountain deaths and Desert control deaths are narrow pressure evidence, not biome-wide nerf signals.

## Frozen identity and execution

| Item | Value |
| --- | --- |
| Operator packet | [bot-balance-durability22-operator-packet.md](<bot-balance-durability22-operator-packet.md>) |
| Frozen revision | `ffd6f1ec1ec70de238d631e0c3116e786694390b` |
| Frozen branch retained | `codex/durability22-frozen` |
| Frozen source tree | `d3a2ce8e345c36acec52de76da0ea1c94574fb00` |
| Definitions SHA-256 | `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0` |
| Hitboxes SHA-256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Hitbox source | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json` |
| Detached checkout | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/source` |
| Results root | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results` |
| Preparation receipts | `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability22` |
| Trial / mode | durability22 / run |
| Seeds | 38011, 40009, 42013 |
| Matrix | 96 cells / 288 observations / 4 biomes / 6 roots |
| Timestep / maximum | 100 ms / Trench 600 s; other blocks 300 s; first death |
| Synthetic / economy eligible | true / false |
| Operator queue start | 2026-09-17T09:20:19.277Z |
| Batch ended marker | 2026-09-17T09:44:56.409Z |
| Operator exit marker | 2026-09-17T09:44:56.4467284Z |
| Queue wall time | 1,477,132 ms / 24m 37.1s |
| Runner exit | 0; one sequential run; no retry or relaunch |

The detached checkout resolved to the packet revision/tree before launch. Offline dependencies completed successfully, and the preparation overlay test verified the matrix, HP treatment, fixed-defense products, and full restoration. The source directory and all raw results remain retained. No full repository suite or live/browser playtest was run for this packet.

## Completion and retained evidence

| Biome block | Artifact window | Cells / runs | Outcomes WE/PD/WC | Verified | Complete windows | K/U/R | Casts started/fired | Min HP median / low | Recovery interruptions / episodes | Late joiners / 3+ seconds | Incoming HP total |
| --- | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Trench | 09:20:25.306–09:24:52.185Z (266.9s) | 24 / 72 | 72/0/0 | true | 72 | 1557/148/138 | 3200/2964 | 59.2% / 26.5% | 84 / 963 | 869 / 2000 | 526265.1 |
| Mountain | 09:24:56.757–09:39:47.443Z (890.7s) | 24 / 72 | 69/3/0 | true | 69 | 2362/52/49 | 1177/955 | 57.9% / 0% | 730 / 2060 | 363 / 25 | 93068.9 |
| Tundra | 09:39:53.137–09:42:28.594Z (155.5s) | 24 / 72 | 72/0/0 | true | 72 | 2143/43/22 | 215/191 | 77.1% / 56.8% | 779 / 2097 | 92 / 0 | 136348.7 |
| Desert | 09:42:34.551–09:44:56.409Z (141.9s) | 24 / 72 | 70/2/0 | true | 70 | 2082/125/168 | 945/823 | 51.9% / 0% | 117 / 833 | 1403 / 287 | 430376.9 |
| Total | queue 09:20:19.277–09:44:56.409Z (24m 37.1s) | 96 / 288 | 283/5/0 | true for all four blocks | 283 | 8144/368/377 | 5537/4933 | block rows below | 1710 / 5953 | 2727 / 2312 | 1186059.7 |

Block artifact windows are manifest-to-complete windows, while queue wall time comes from the packet batch-ended marker. The block completion marker reports 24 cells / 72 runs and verified true for every block. Mountain had 69 complete windows plus three player deaths; Desert had 70 complete windows plus two player deaths; no wall-ceiling outcome occurred.

## Measurement rules and evidence boundary

For every species/class/node row below, the primary estimator is the corresponding `night5-audit.json` row: one clean body-TTK median per seed from eligible killed targets. Clean excludes observed HP regain and unfinished targets. The species value is the median of available per-seed medians, not a pooled generic per-type value. A dash is missing evidence, not a zero-second kill. A paired candidate-minus-control delta is shown only when both arms have an eligible seed; fewer than two paired seeds is marked inconclusive.

TTK begins at the first damaging hit on the target and ends at the kill. First-damage onset is reported separately as an approach/engagement proxy. `K/U/R` is killed / unfinished-or-censored / observed-regain target records; R can overlap K or U. `WE/PD/WC` is window-ended / player-died / wall-ceiling observation outcomes. `U`, `R`, `D`, `Q`, and `M` in per-seed cells mean unfinished, observed regain, death, long-quiet, and missing clean median respectively; markers can overlap. Exposure `P/3+/LJ/LQ/B` is peak player pursuers / sampled seconds with at least three pursuers / late joiners / long-quiet runs with maximum quiet interval / blocked-approach samples. Quiet survival is not safety.

All source summaries in the pressure tables are aggregate across the three seeds of that cell/arm and report applied HP damage plus absorbed damage where present. More incoming damage in a longer successful candidate run is exposure, not regression by itself. No survival, economy, farming, acquisition, respawn-cost, or live/browser claim follows from this synthetic run.

## Geometry parity and overlay treatment

| Block | Control/candidate READY comparisons | Mismatches | Initial roster hash use |
| --- | ---: | ---: | --- |
| Trench | 36 | 0 | Each control/candidate pair was checked before comparison; no mismatch |
| Mountain | 36 | 0 | Each control/candidate pair was checked before comparison; no mismatch |
| Tundra | 36 | 0 | Each control/candidate pair was checked before comparison; no mismatch |
| Desert | 36 | 0 | Each control/candidate pair was checked before comparison; no mismatch |
| Total | 144 | 0 | Geometry parity passed across all 96 cells |

The comparison unit is the same node/class/seed with the control and candidate arms separated. Candidate HP is applied only for an observation and restored afterward. Attacks, cast cadence, plating, damage reduction, pack composition, movement, aggro, damage multipliers, and ambient rules were unchanged. The candidate percentage adjustments preserve the source-level absolute products for the Mountain Mammoth ward, Glacial Dire-Bear Ice Armor/self-shatter, and Elder Leviathan Carapace; schedules, durations, vulnerability, and thresholds remain unchanged.

| Biome / species | Packet base control → candidate HP | Actual READY control → candidate HP by node | Attack | Plating / DR |
| --- | ---: | --- | ---: | --- |
| Trench / Elder Leviathan | 5,880→17,640 | 03: 5880→17640; 05: 5880→17640 | 210 | 22 / 0.24 |
| Trench / Abyssal Serpent | 4,200→16,800 | 03: 4200→16800; 05: 4200→16800 | 190 | 18 / 0.2 |
| Trench / Hadal Stalker | 2,800→16,800 | 03: 2800→16800; 05: 2800→16800 | 175 | 20 / 0.1 |
| Mountain / Granite Mammoth | 1,150→6,900 | 03: 1380→8280; 05: 1150→6900 | 258 | 0 / 0.1 |
| Mountain / Cragback Rhino | 1,100→6,600 | 03: 1320→7920; 05: 1100→6600 | 158 | 19 / 0.154 |
| Mountain / Avalanche Tyrant | 800→1,600 | 03: 960→1920; 05: 800→1600 | 203 | 0 / 0.1 |
| Mountain / Cliffside Roc | 850→1,700 | 03: 1020→2040; 05: 850→1700 | 251 | 0 / 0.1 |
| Tundra / Permafrost Behemoth | 1,914→7,656 | 03: 2297→9187; 05: 1914→7656 | 308 | 24 / 0.208 |
| Tundra / Glacial Dire-Bear | 1,221→4,884 | 03: 1465→5861; 05: 1221→4884 | 308 | 0 / 0.226 |
| Tundra / Rime-Tusk Mastodon | 1,100→3,300 | 03: 1320→3960; 05: 1100→3300 | 322 | 14 / 0.1 |
| Tundra / Hoarfrost Yeti | 900→1,800 | 03: 1080→2160; 05: 900→1800 | 266 | 0 / 0.172 |
| Desert / Sand Viper | 1,343→4,029 | 03: 1612→4835; 05: 1612→4835 | 109 | 0 / 0.172 |
| Desert / Dune Basilisk | 1,501→4,503 | 03: 1801→5404; 05: 1801→5404 | 126 | 12 / 0.226 |
| Desert / Dune Tyrant | 1,738→6,952 | 03: 2086→8342; 05: 2086→8342 | 196 | 10 / 0.172 |
| Desert / Sunshield Scarab | 569→569 | 03: 683→683; 05: 683→683 | 210 | 0 / 0.1 |

The actual READY HP values include the packet’s full +5 natural ecology and therefore differ from the base-definition overlay table in some node03 placements. That is expected and retained as part of the prepared encounter. The displayed fixed-defense products below are the source-level base-definition products used by the overlay test; natural ecology can change realized node HP and therefore the runtime amount. No shield was silently multiplied with body HP.

### Fixed-defense absolute products

| Species / mechanic | Base definition | Candidate overlay | Absolute amount | Runtime rounding |
| --- | --- | --- | ---: | ---: |
| Granite Mammoth low-HP ward | 25% of 1,150 | 4.1666667% of 6,900 | 287.5 | 288 in source-level runtime math |
| Glacial Dire-Bear Ice Armor | 22% of 1,221 | 5.5% of 4,884 | 268.62 | 269 |
| Glacial Dire-Bear shatter self-damage | 14% of 1,221 | 3.5% of 4,884 | 170.94 | 171 |
| Elder Leviathan Abyssal Carapace | 18% of 5,880 | 6% of 17,640 | 1,058.4 | 1,058 |

The fixed-defense test asserted the exact products and restoration after each treatment. The runtime uses rounded ward/shield/self-damage amounts; the exact fractional products are the preservation invariant. READY node values remain natural-ecology values, so the table is not a claim that every realized node receives the same rounded amount.

## Actual player READY setup

These are prepared synthetic views used for provenance, not acquisition or live-balance evidence. Both nodes use the same class-root loadouts within a biome; the node-specific species ecology is shown above. Equipment, stance, techniques, guards, and root ownership were held constant between control and candidate arms.
| Cell | Root | HP / attack / plating | DR / dodge / evade / barrier | Speed / range / cooldown | Equipment |
| --- | --- | --- | --- | --- | --- |
| trench 03 striker | cadence-root | 470 / 152 / 76 | 0.34 / 0 / 0 / 0 | 256 / 12 / 441ms | volcanic-eruption-lash; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 03 squire | cooldown-root | 511 / 211 / 88 | 0.38 / 0 / 0 / 0 | 210 / 12 / 1765ms | mountain-warmaul; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 03 apprentice | dot-root | 437 / 387 / 69 | 0.32 / 0 / 0 / 0 | 251 / 72 / 764ms | graveyard-plague-axe; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 03 slinger | reload-root | 413 / 86 / 58 | 0.32 / 0.34 / 0.7 / 0 | 282 / 132 / 223ms | jungle-deathfang-rapier; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 03 conduit | summoner-root | 423 / 107 / 63 | 0.32 / 0 / 0 / 0 | 261 / 162 / 501ms | jungle-deathfang-rapier; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 03 spirit | energy-root | 396 / 165 / 61 | 0.32 / 0 / 0 / 119 | 292 / 142 / 421ms | volcanic-eruption-lash; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 05 striker | cadence-root | 470 / 152 / 76 | 0.34 / 0 / 0 / 0 | 256 / 12 / 441ms | volcanic-eruption-lash; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 05 squire | cooldown-root | 511 / 211 / 88 | 0.38 / 0 / 0 / 0 | 210 / 12 / 1765ms | mountain-warmaul; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 05 apprentice | dot-root | 437 / 387 / 69 | 0.32 / 0 / 0 / 0 | 251 / 72 / 764ms | graveyard-plague-axe; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 05 slinger | reload-root | 413 / 86 / 58 | 0.32 / 0.34 / 0.7 / 0 | 282 / 132 / 223ms | jungle-deathfang-rapier; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 05 conduit | summoner-root | 423 / 107 / 63 | 0.32 / 0 / 0 / 0 | 261 / 162 / 501ms | jungle-deathfang-rapier; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| trench 05 spirit | energy-root | 396 / 165 / 61 | 0.32 / 0 / 0 / 119 | 292 / 142 / 421ms | volcanic-eruption-lash; trench-vest-t4; trench-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| mountain 03 striker | cadence-root | 596 / 152 / 62 | 0.02 / 0 / 0 / 250 | 256 / 12 / 441ms | volcanic-eruption-lash; mountain-vest-t4; mountain-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| mountain 03 squire | cooldown-root | 647 / 211 / 72 | 0.06 / 0 / 0 / 272 | 210 / 12 / 1765ms | mountain-warmaul; mountain-vest-t4; mountain-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| mountain 03 apprentice | dot-root | 553 / 387 / 57 | 0 / 0 / 0 / 232 | 251 / 72 / 764ms | graveyard-plague-axe; mountain-vest-t4; mountain-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| mountain 03 slinger | reload-root | 523 / 86 / 47 | 0 / 0.34 / 0.7 / 220 | 282 / 132 / 223ms | jungle-deathfang-rapier; mountain-vest-t4; mountain-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| mountain 03 conduit | summoner-root | 536 / 107 / 52 | 0 / 0 / 0 / 225 | 261 / 162 / 501ms | jungle-deathfang-rapier; mountain-vest-t4; mountain-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| mountain 03 spirit | energy-root | 502 / 165 / 50 | 0 / 0 / 0 / 361 | 292 / 142 / 421ms | volcanic-eruption-lash; mountain-vest-t4; mountain-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| mountain 05 striker | cadence-root | 596 / 152 / 62 | 0.02 / 0 / 0 / 250 | 256 / 12 / 441ms | volcanic-eruption-lash; mountain-vest-t4; mountain-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| mountain 05 squire | cooldown-root | 647 / 211 / 72 | 0.06 / 0 / 0 / 272 | 210 / 12 / 1765ms | mountain-warmaul; mountain-vest-t4; mountain-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| mountain 05 apprentice | dot-root | 553 / 387 / 57 | 0 / 0 / 0 / 232 | 251 / 72 / 764ms | graveyard-plague-axe; mountain-vest-t4; mountain-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| mountain 05 slinger | reload-root | 523 / 86 / 47 | 0 / 0.34 / 0.7 / 220 | 282 / 132 / 223ms | jungle-deathfang-rapier; mountain-vest-t4; mountain-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| mountain 05 conduit | summoner-root | 536 / 107 / 52 | 0 / 0 / 0 / 225 | 261 / 162 / 501ms | jungle-deathfang-rapier; mountain-vest-t4; mountain-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| mountain 05 spirit | energy-root | 502 / 165 / 50 | 0 / 0 / 0 / 361 | 292 / 142 / 421ms | volcanic-eruption-lash; mountain-vest-t4; mountain-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 03 striker | cadence-root | 768 / 152 / 88 | 0.02 / 0 / 0 / 246 | 256 / 12 / 441ms | volcanic-eruption-lash; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 03 squire | cooldown-root | 834 / 211 / 102 | 0.06 / 0 / 0 / 267 | 210 / 12 / 1765ms | mountain-warmaul; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 03 apprentice | dot-root | 713 / 387 / 81 | 0 / 0 / 0 / 228 | 251 / 72 / 764ms | graveyard-plague-axe; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 03 slinger | reload-root | 675 / 86 / 67 | 0 / 0.34 / 0.7 / 216 | 282 / 132 / 223ms | jungle-deathfang-rapier; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 03 conduit | summoner-root | 691 / 107 / 73 | 0 / 0 / 0 / 221 | 261 / 162 / 501ms | jungle-deathfang-rapier; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 03 spirit | energy-root | 647 / 165 / 71 | 0 / 0 / 0 / 401 | 292 / 142 / 421ms | volcanic-eruption-lash; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 05 striker | cadence-root | 768 / 152 / 88 | 0.02 / 0 / 0 / 246 | 256 / 12 / 441ms | volcanic-eruption-lash; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 05 squire | cooldown-root | 834 / 211 / 102 | 0.06 / 0 / 0 / 267 | 210 / 12 / 1765ms | mountain-warmaul; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 05 apprentice | dot-root | 713 / 387 / 81 | 0 / 0 / 0 / 228 | 251 / 72 / 764ms | graveyard-plague-axe; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 05 slinger | reload-root | 675 / 86 / 67 | 0 / 0.34 / 0.7 / 216 | 282 / 132 / 223ms | jungle-deathfang-rapier; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 05 conduit | summoner-root | 691 / 107 / 73 | 0 / 0 / 0 / 221 | 261 / 162 / 501ms | jungle-deathfang-rapier; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| tundra 05 spirit | energy-root | 647 / 165 / 71 | 0 / 0 / 0 / 401 | 292 / 142 / 421ms | volcanic-eruption-lash; tundra-vest-t4; tundra-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| desert 03 striker | cadence-root | 729 / 152 / 115 | 0.02 / 0 / 0 / 0 | 256 / 12 / 441ms | volcanic-eruption-lash; desert-vest-t4; desert-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| desert 03 squire | cooldown-root | 792 / 211 / 133 | 0.06 / 0 / 0 / 0 | 210 / 12 / 1765ms | mountain-warmaul; desert-vest-t4; desert-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| desert 03 apprentice | dot-root | 678 / 387 / 105 | 0 / 0 / 0 / 0 | 251 / 72 / 764ms | graveyard-plague-axe; desert-vest-t4; desert-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| desert 03 slinger | reload-root | 641 / 86 / 88 | 0 / 0.34 / 0.7 / 0 | 282 / 132 / 223ms | jungle-deathfang-rapier; desert-vest-t4; desert-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| desert 03 conduit | summoner-root | 656 / 107 / 95 | 0 / 0 / 0 / 0 | 261 / 162 / 501ms | jungle-deathfang-rapier; desert-vest-t4; desert-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| desert 03 spirit | energy-root | 615 / 165 / 93 | 0 / 0 / 0 / 185 | 292 / 142 / 421ms | volcanic-eruption-lash; desert-vest-t4; desert-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| desert 05 striker | cadence-root | 729 / 152 / 115 | 0.02 / 0 / 0 / 0 | 256 / 12 / 441ms | volcanic-eruption-lash; desert-vest-t4; desert-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| desert 05 squire | cooldown-root | 792 / 211 / 133 | 0.06 / 0 / 0 / 0 | 210 / 12 / 1765ms | mountain-warmaul; desert-vest-t4; desert-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| desert 05 apprentice | dot-root | 678 / 387 / 105 | 0 / 0 / 0 / 0 | 251 / 72 / 764ms | graveyard-plague-axe; desert-vest-t4; desert-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| desert 05 slinger | reload-root | 641 / 86 / 88 | 0 / 0.34 / 0.7 / 0 | 282 / 132 / 223ms | jungle-deathfang-rapier; desert-vest-t4; desert-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| desert 05 conduit | summoner-root | 656 / 107 / 95 | 0 / 0 / 0 / 0 | 261 / 162 / 501ms | jungle-deathfang-rapier; desert-vest-t4; desert-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |
| desert 05 spirit | energy-root | 615 / 165 / 93 | 0 / 0 / 0 / 185 | 292 / 142 / 421ms | volcanic-eruption-lash; desert-vest-t4; desert-charm-t4; mountain-boots-t4; core-tempered; relic-colossus-heart |

## Species estimator completeness

| Biome | Expected READY species | Species/class/node rows | Control missing clean medians | Candidate missing clean medians | Paired rows <2 seeds | Candidate target K/U/R by species |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Trench | Elder Leviathan, Abyssal Serpent, Hadal Stalker | 36 | 4 | 12 | 5 | Elder Leviathan 134/50/55; Abyssal Serpent 174/38/37; Hadal Stalker 88/10/3 |
| Mountain | Granite Mammoth, Cragback Rhino, Avalanche Tyrant, Cliffside Roc | 48 | 0 | 5 | 0 | Granite Mammoth 157/17/22; Cragback Rhino 157/17/22; Avalanche Tyrant 154/4/2; Cliffside Roc 294/7/1 |
| Tundra | Permafrost Behemoth, Glacial Dire-Bear, Rime-Tusk Mastodon, Hoarfrost Yeti | 48 | 0 | 8 | 2 | Permafrost Behemoth 158/18/13; Glacial Dire-Bear 174/6/8; Rime-Tusk Mastodon 178/5/0; Hoarfrost Yeti 169/1/1 |
| Desert | Sand Viper, Dune Basilisk, Dune Tyrant, Sunshield Scarab | 48 | 1 | 6 | 0 | Sand Viper 139/8/2; Dune Basilisk 119/12/15; Dune Tyrant 137/15/17; Sunshield Scarab 343/41/92 |
| Total | 15 expected species identities / 30 two-node placements | 180 | see block rows | see block rows | see block rows | see species summaries |

All expected READY species placements were present in the manifests and audit target streams. Missing seed medians are retained as missing; they are not replaced with zeros or survivor-selected pooled values. No expected species is absent from the observed target roster.

### Trench species-level candidate summary

| Species | Candidate outer median / range | Control outer median / range | Candidate 40–60s cells | Candidate >90s cells | Candidate target K/U/R | Candidate missing medians / paired inconclusive rows |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Elder Leviathan | 62.1s / 22.3s–306s | 23.2s / 6.6s–229.5s | 3/12 | 3/12 | 134/50/55 | 5 / 2 |
| Abyssal Serpent | 48.7s / 19.4s–191.8s | 12.6s / 4.6s–62s | 3/12 | 3/12 | 174/38/37 | 0 / 0 |
| Hadal Stalker | 38s / 18.6s–90.4s | 7.5s / 3.6s–36.6s | 2/12 | 1/12 | 88/10/3 | 7 / 3 |

### Mountain species-level candidate summary

| Species | Candidate outer median / range | Control outer median / range | Candidate 40–60s cells | Candidate >90s cells | Candidate target K/U/R | Candidate missing medians / paired inconclusive rows |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Granite Mammoth | 13.4s / 7.2s–31.6s | 2.4s / 1.4s–4.7s | 0/12 | 0/12 | 157/17/22 | 1 / 0 |
| Cragback Rhino | 16s / 7.2s–68.8s | 2.8s / 1.6s–5.6s | 0/12 | 0/12 | 157/17/22 | 2 / 0 |
| Avalanche Tyrant | 3.5s / 1.6s–6.9s | 1.5s / 0.6s–4.2s | 0/12 | 0/12 | 154/4/2 | 1 / 0 |
| Cliffside Roc | 3.5s / 1.7s–6.4s | 1.6s / 0s–2.8s | 0/12 | 0/12 | 294/7/1 | 1 / 0 |

### Tundra species-level candidate summary

| Species | Candidate outer median / range | Control outer median / range | Candidate 40–60s cells | Candidate >90s cells | Candidate target K/U/R | Candidate missing medians / paired inconclusive rows |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Permafrost Behemoth | 18.7s / 8.9s–92.7s | 4.8s / 2.7s–15.2s | 1/12 | 1/12 | 158/18/13 | 2 / 1 |
| Glacial Dire-Bear | 8.8s / 4.7s–25.2s | 3s / 1.4s–5.4s | 0/12 | 0/12 | 174/6/8 | 2 / 0 |
| Rime-Tusk Mastodon | 6.8s / 3.6s–36.7s | 2.5s / 1.2s–5.5s | 0/12 | 0/12 | 178/5/0 | 2 / 0 |
| Hoarfrost Yeti | 4s / 2.3s–8s | 2s / 1s–5s | 0/12 | 0/12 | 169/1/1 | 2 / 1 |

### Desert species-level candidate summary

| Species | Candidate outer median / range | Control outer median / range | Candidate 40–60s cells | Candidate >90s cells | Candidate target K/U/R | Candidate missing medians / paired inconclusive rows |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Sand Viper | 9.8s / 5.2s–28.3s | 3.6s / 2s–5.5s | 0/12 | 0/12 | 139/8/2 | 0 / 0 |
| Dune Basilisk | 13.2s / 5.6s–45.1s | 5s / 2.4s–16.3s | 1/12 | 0/12 | 119/12/15 | 3 / 0 |
| Dune Tyrant | 18.4s / 10.4s–45.8s | 5.5s / 2.6s–19.8s | 2/12 | 0/12 | 137/15/17 | 1 / 0 |
| Sunshield Scarab | 2.5s / 1.1s–8.8s | 4s / 1.4s–9.3s | 0/12 | 0/12 | 343/41/92 | 2 / 0 |

## Per-species, class, node estimators

Each row below is one species/class/node comparison. The three arm cells are seed order 38011 / 40009 / 42013. A value is the eligible clean body-TTK median for that seed; markers preserve unfinished, regain, death, long-quiet, and missing evidence. The outer value is the median across available seed medians. Paired deltas are candidate minus control in the same seed.

### Trench

| Node / root | Species | Control seed medians | Control outer | Candidate seed medians | Candidate outer | Paired Δ by seed | Paired n / Δ median | Control U/R/D/M | Candidate U/R/D/M |
| --- | --- | --- | ---: | --- | ---: | --- | --- | ---: | ---: |
| 03 / striker | Elder Leviathan | 13.9s / 13.6s / 13.4s | 13.6s | 40.7s / 40.4s / 40.4s[U] | 40.4s | +26.8s / +26.9s / +26.9s | 3 / +26.9s | 0/0/0/0 | 1/0/0/0 |
| 03 / striker | Abyssal Serpent | 5.9s[U] / 6.3s / 6.1s | 6.1s | 25.4s[U] / 25s / 25s | 25s | +19.5s / +18.8s / +18.9s | 3 / +18.9s | 1/0/0/0 | 1/0/0/0 |
| 03 / striker | Hadal Stalker | 3.6s / 3.9s / 3.5s | 3.6s | 23.8s / 23.2s[U] / 25.5s | 23.8s | +20.1s / +19.3s / +22s | 3 / +20.1s | 0/0/0/0 | 1/0/0/0 |
| 03 / squire | Elder Leviathan | 42.4s / 42.1s[U] / 40.8s | 42.1s | 127.4s[U] / 128.6s / 128.8s[U] | 128.6s | +85s / +86.5s / +88s | 3 / +86.5s | 1/0/0/0 | 2/0/0/0 |
| 03 / squire | Abyssal Serpent | 17.8s / 17.4s / 17.4s | 17.4s | 76.4s / 75.5s[U] / 76s | 76s | +58.6s / +58.1s / +58.6s | 3 / +58.6s | 0/0/0/0 | 1/0/0/0 |
| 03 / squire | Hadal Stalker | 11s[U] / 11s / 11.4s | 11s | 66.3s / 66s / 112.3s | 66.3s | +55.3s / +55s / +101s | 3 / +55.3s | 1/0/0/0 | 0/0/0/0 |
| 03 / apprentice | Elder Leviathan | 6.6s[UR] / 6.6s / 6s | 6.6s | 22.3s[R] / 22.1s[UR] / 24.2s[UR] | 22.3s | +15.7s / +15.4s / +18.2s | 3 / +15.7s | 1/1/0/0 | 2/3/0/0 |
| 03 / apprentice | Abyssal Serpent | 4.5s / 4.6s / 4.7s[U] | 4.6s | 19.6s[U] / 19.8s / 19.2s[UR] | 19.6s | +15.1s / +15.2s / +14.5s | 3 / +15.1s | 1/0/0/0 | 2/1/0/0 |
| 03 / apprentice | Hadal Stalker | 3.8s / 3.6s / 3.6s | 3.6s | 18.6s / 17.3s[U] / 19.8s[U] | 18.6s | +14.8s / +13.7s / +16.2s | 3 / +14.8s | 0/0/0/0 | 2/0/0/0 |
| 03 / slinger | Elder Leviathan | 15.4s[R] / 15.2s[U] / 15.2s[UR] | 15.2s | 47.4s[UR] / 47.9s[UR] / 46.3s[R] | 47.4s | +31.9s / +32.8s / +31.1s | 3 / +31.9s | 2/2/0/0 | 2/3/0/0 |
| 03 / slinger | Abyssal Serpent | 8.8s[R] / 8.5s[U] / 9.2s[UR] | 8.8s | 37.8s[UR] / 37.9s[U] / 37.8s[UR] | 37.8s | +29s / +29.4s / +28.6s | 3 / +29s | 2/2/0/0 | 3/2/0/0 |
| 03 / slinger | Hadal Stalker | 5.7s[U] / 4.2s / 5.4s[U] | 5.4s | 34.4s / 35s / 36.2s | 35s | +28.6s / +30.8s / +30.8s | 3 / +30.8s | 2/0/0/0 | 0/0/0/0 |
| 03 / conduit | Elder Leviathan | 81.3s[UR] / 52.9s[UR] / 62.8s[UR] | 62.8s | —[UR] / 306s[UR] / —[UR] | 306s | — / +253.1s / — | 1 / +253.1s inconclusive | 3/3/0/0 | 3/3/0/2 |
| 03 / conduit | Abyssal Serpent | 28.2s[UR] / 29.6s[UR] / 28.8s[UR] | 28.8s | 125s[UR] / 98.5s[UR] / 102.3s[UR] | 102.3s | +96.8s / +68.9s / +73.5s | 3 / +73.5s | 3/3/0/0 | 3/3/0/0 |
| 03 / conduit | Hadal Stalker | 18.4s / 11.4s / 19.5s | 18.4s | 80s / —[UR] / — | 80s | +61.6s / — / — | 1 / +61.6s inconclusive | 0/0/0/0 | 1/1/0/2 |
| 03 / spirit | Elder Leviathan | 26.6s[UR] / 28.1s[UR] / 26.1s[UR] | 26.6s | 58.7s[UR] / 72.2s[UR] / 66.5s[UR] | 66.5s | +32.1s / +44.1s / +40.4s | 3 / +40.4s | 3/3/0/0 | 3/3/0/0 |
| 03 / spirit | Abyssal Serpent | 11s[R] / 13.3s[R] / 15s[UR] | 13.3s | 42.4s[UR] / 50s[UR] / 49.8s[UR] | 49.8s | +31.4s / +36.8s / +34.8s | 3 / +34.8s | 1/3/0/0 | 3/3/0/0 |
| 03 / spirit | Hadal Stalker | 8s / 7.9s / 8.9s | 8s | 38s[U] / 44.7s / 37s | 38s | +30s / +36.8s / +28.1s | 3 / +30s | 0/0/0/0 | 1/0/0/0 |
| 05 / striker | Elder Leviathan | 16.5s[U] / 16.4s[U] / 16.1s | 16.4s | 77.3s / 53.4s / 53s | 53.4s | +60.8s / +37s / +36.9s | 3 / +37s | 2/0/0/0 | 0/0/0/0 |
| 05 / striker | Abyssal Serpent | 8.1s / 7.8s / 7.8s | 7.8s | 31.4s / 31.4s[U] / 31.3s | 31.4s | +23.4s / +23.6s / +23.5s | 3 / +23.5s | 0/0/0/0 | 1/0/0/0 |
| 05 / striker | Hadal Stalker | 4.7s / 4.7s / 4.7s[U] | 4.7s | 29.4s[U] / 29.2s / 29.4s | 29.4s | +24.7s / +24.5s / +24.6s | 3 / +24.6s | 1/0/0/0 | 1/0/0/0 |
| 05 / squire | Elder Leviathan | 53.3s[U] / 57.6s / 57.5s[U] | 57.5s | 268.8s[U] / 179.3s[U] / 179.3s[U] | 179.3s | +215.4s / +121.7s / +121.8s | 3 / +121.8s | 2/0/0/0 | 3/0/0/0 |
| 05 / squire | Abyssal Serpent | 24.2s / 22s / 24.5s | 24.2s | 99.5s / 99.6s / 99.5s | 99.5s | +75.3s / +77.6s / +75s | 3 / +75.3s | 0/0/0/0 | 0/0/0/0 |
| 05 / squire | Hadal Stalker | 12.8s / 16s[U] / 15.8s | 15.8s | — / 90.4s / — | 90.4s | — / +74.4s / — | 1 / +74.4s inconclusive | 1/0/0/0 | 0/0/0/2 |
| 05 / apprentice | Elder Leviathan | 7.4s[R] / 7.2s / 7.2s | 7.2s | 23.2s[UR] / 23.9s[UR] / 24.7s[R] | 23.9s | +15.8s / +16.7s / +17.5s | 3 / +16.7s | 0/1/0/0 | 2/3/0/0 |
| 05 / apprentice | Abyssal Serpent | 4.2s / 5.2s / 4.8s | 4.8s | 19.4s[UR] / 19.6s[UR] / 19.3s | 19.4s | +15.2s / +14.3s / +14.5s | 3 / +14.5s | 0/0/0/0 | 2/2/0/0 |
| 05 / apprentice | Hadal Stalker | 3.6s / 3.6s / 3.6s | 3.6s | 19.2s / 20.4s / 20.4s[UR] | 20.4s | +15.6s / +16.8s / +16.9s | 3 / +16.8s | 0/0/0/0 | 1/1/0/0 |
| 05 / slinger | Elder Leviathan | 19.8s[UR] / 19.8s[UR] / 19.9s[R] | 19.8s | 63.9s[R] / 62.1s[UR] / 62.1s[UR] | 62.1s | +44.1s / +42.3s / +42.2s | 3 / +42.3s | 2/3/0/0 | 2/3/0/0 |
| 05 / slinger | Abyssal Serpent | 12s / 11.9s[UR] / 11.7s[U] | 11.9s | 47.6s[UR] / 45.8s[U] / 47.7s[UR] | 47.6s | +35.6s / +33.9s / +36s | 3 / +35.6s | 2/1/0/0 | 3/2/0/0 |
| 05 / slinger | Hadal Stalker | 6.9s / 7.3s / 6.8s | 6.9s | 42.7s / 42.6s / 42.9s | 42.7s | +35.8s / +35.4s / +36.1s | 3 / +35.8s | 0/0/0/0 | 0/0/0/0 |
| 05 / conduit | Elder Leviathan | 233.2s[U] / 225.8s[UR] / —[UR] | 229.5s | —[UR] / —[UR] / —[UR] | — | — / — / — | 0 / — inconclusive | 3/2/0/1 | 3/3/0/3 |
| 05 / conduit | Abyssal Serpent | 71s[UR] / —[UR] / 53s | 62s | 190.4s[UR] / 191.8s[UR] / 206.8s[UR] | 191.8s | +119.3s / — / +153.8s | 2 / +136.6s | 2/2/0/1 | 3/3/0/0 |
| 05 / conduit | Hadal Stalker | — / 36.6s / — | 36.6s | — / —[U] / — | — | — / — / — | 0 / — inconclusive | 0/0/0/2 | 1/0/0/3 |
| 05 / spirit | Elder Leviathan | 9.6s / 35.4s / 39.5s[UR] | 35.4s | 84.4s[UR] / 93.5s[UR] / 83s[UR] | 84.4s | +74.8s / +58.1s / +43.5s | 3 / +58.1s | 1/1/0/0 | 3/3/0/0 |
| 05 / spirit | Abyssal Serpent | 6.2s / 16.1s[U] / 17s | 16.1s | 54.2s[UR] / 56.5s / 57.3s[UR] | 56.5s | +48s / +40.4s / +40.3s | 3 / +40.4s | 1/0/0/0 | 2/2/0/0 |
| 05 / spirit | Hadal Stalker | 4.1s[U] / 10.2s / 10.6s[R] | 10.2s | 43.2s / 59.8s[U] / 59.4s | 59.4s | +39.1s / +49.6s / +48.8s | 3 / +48.8s | 1/1/0/0 | 1/0/0/0 |

Trench estimator note: 36 rows; missing clean medians control/candidate 4/12; 5 paired rows have fewer than two eligible seeds and are inconclusive for paired disposition. Target K/U/R remains separate in the summary and cell tables.

### Mountain

| Node / root | Species | Control seed medians | Control outer | Candidate seed medians | Candidate outer | Paired Δ by seed | Paired n / Δ median | Control U/R/D/M | Candidate U/R/D/M |
| --- | --- | --- | ---: | --- | ---: | --- | --- | ---: | ---: |
| 03 / striker | Granite Mammoth | 1.7s / 1.8s / 1.7s | 1.7s | 10.8s / 10.5s / 10.8s[UD] | 10.8s | +9.1s / +8.8s / +9.1s | 3 / +9.1s | 0/0/0/0 | 1/0/1/0 |
| 03 / striker | Cragback Rhino | 1.7s / 2s / 2s | 2s | 11.4s / 11.3s / 11.6s[D] | 11.4s | +9.7s / +9.3s / +9.6s | 3 / +9.6s | 0/0/0/0 | 0/0/1/0 |
| 03 / striker | Avalanche Tyrant | 1.1s / 0.9s / 1.1s | 1.1s | 2.4s / 2s / 2s[D] | 2s | +1.4s / +1.1s / +0.9s | 3 / +1.1s | 0/0/0/0 | 0/0/1/0 |
| 03 / striker | Cliffside Roc | 1.4s / 1.3s / 1s | 1.3s | 2.3s / 2.3s / 2.3s[UD] | 2.3s | +0.9s / +1s / +1.3s | 3 / +1s | 0/0/0/0 | 1/0/1/0 |
| 03 / squire | Granite Mammoth | 6s / 4.2s / 4.7s | 4.7s | 31.6s[U] / 31.6s[U] / 32.3s | 31.6s | +25.6s / +27.4s / +27.6s | 3 / +27.4s | 0/0/0/0 | 2/0/0/0 |
| 03 / squire | Cragback Rhino | 4.2s / 4.4s / 6s | 4.4s | 34.4s / 35.4s / 39.4s | 35.4s | +30.2s / +31s / +33.4s | 3 / +31s | 0/0/0/0 | 0/0/0/0 |
| 03 / squire | Avalanche Tyrant | 5s / 3.2s / 4.2s | 4.2s | 6.9s / 9.2s / 5.3s | 6.9s | +1.9s / +6s / +1.1s | 3 / +1.9s | 0/0/0/0 | 0/0/0/0 |
| 03 / squire | Cliffside Roc | 0s / 4.4s / 0s | 0s | 6.4s / 7.1s / 4.8s[U] | 6.4s | +6.4s / +2.7s / +4.8s | 3 / +4.8s | 0/0/0/0 | 1/0/0/0 |
| 03 / apprentice | Granite Mammoth | 2.7s / 3s[U] / 2.4s | 2.7s | 10.3s[R] / 10.2s / 10.2s[U] | 10.2s | +7.6s / +7.2s / +7.8s | 3 / +7.6s | 1/0/0/0 | 1/1/0/0 |
| 03 / apprentice | Cragback Rhino | 3s[R] / 3s / 1.8s | 3s | 9.6s / 9.6s / 9.8s | 9.6s | +6.6s / +6.6s / +8s | 3 / +6.6s | 0/1/0/0 | 0/0/0/0 |
| 03 / apprentice | Avalanche Tyrant | 2.3s / 2.4s / 2.4s | 2.4s | 3s / 3s / 3.2s | 3s | +0.7s / +0.6s / +0.8s | 3 / +0.7s | 0/0/0/0 | 0/0/0/0 |
| 03 / apprentice | Cliffside Roc | 2.4s / 2.2s / 2.2s | 2.2s | 3s / 3.1s / 3.1s | 3.1s | +0.6s / +0.9s / +0.9s | 3 / +0.9s | 0/0/0/0 | 0/0/0/0 |
| 03 / slinger | Granite Mammoth | 3.1s[Q] / 1.5s[UR] / 2.1s | 1.8s | 15.3s[R] / 17.7s[UR] / 14.9s[R] | 15.3s | +12.2s / +16.2s / +12.8s | 3 / +12.8s | 1/1/0/0 | 1/3/0/0 |
| 03 / slinger | Cragback Rhino | 2.4s[Q] / 1.7s / 2.4s | 2s | 16.4s[UR] / 16.9s[UR] / 15.9s[R] | 16.4s | +14s / +15.3s / +13.5s | 3 / +14s | 0/0/0/0 | 2/3/0/0 |
| 03 / slinger | Avalanche Tyrant | 1.4s[Q] / 1.5s / 1.1s | 1.3s | 5s / 4.9s[R] / 4.6s[UR] | 4.9s | +3.5s / +3.4s / +3.5s | 3 / +3.5s | 0/0/0/0 | 1/2/0/0 |
| 03 / slinger | Cliffside Roc | 1.1s[Q] / 1.8s / 1.5s | 1.6s | 3.8s / 4.2s[U] / 2.6s | 3.8s | +2.6s / +2.4s / +1.1s | 3 / +2.4s | 0/0/0/0 | 1/0/0/0 |
| 03 / conduit | Granite Mammoth | 2.6s / 2.6s / 2.5s | 2.6s | 19.9s[D] / 19.8s[U] / 33.3s | 19.9s | +17.4s / +17.2s / +30.8s | 3 / +17.4s | 0/0/0/0 | 1/0/1/0 |
| 03 / conduit | Cragback Rhino | 5.6s / 5.6s / 5.5s | 5.6s | —[URD] / 46.1s[UR] / 91.6s[R] | 68.8s | — / +40.5s / +86.1s | 2 / +63.3s | 0/0/0/0 | 2/3/1/1 |
| 03 / conduit | Avalanche Tyrant | 1.9s / 2s / 1.9s | 1.9s | 4.4s[D] / 7.9s / 4.3s | 4.4s | +2.5s / +5.9s / +2.4s | 3 / +2.5s | 0/0/0/0 | 0/0/1/0 |
| 03 / conduit | Cliffside Roc | 2s / 2.1s / 2s | 2s | 5s[UD] / 22.9s / 6.3s | 6.3s | +3s / +20.8s / +4.3s | 3 / +4.3s | 0/0/0/0 | 1/0/1/0 |
| 03 / spirit | Granite Mammoth | 3.4s[U] / 3.4s / 1.5s | 3.4s | 17.5s / 18.8s / —[D] | 18.1s | +14.1s / +15.4s / — | 2 / +14.8s | 1/0/0/0 | 0/0/1/1 |
| 03 / spirit | Cragback Rhino | 3.2s / 4.2s / 2.1s | 3.2s | 20.4s[UR] / 26.9s[UR] / —[UD] | 23.6s | +17.2s / +22.7s / — | 2 / +19.9s | 0/0/0/0 | 3/2/1/1 |
| 03 / spirit | Avalanche Tyrant | 1.9s / 2.1s / 1.2s | 1.9s | 3.8s / 7.5s / —[D] | 5.7s | +1.9s / +5.4s / — | 2 / +3.6s | 0/0/0/0 | 0/0/1/1 |
| 03 / spirit | Cliffside Roc | 2.2s / 2.8s / 1.2s | 2.2s | 4.5s / 5.2s / —[UD] | 4.8s | +2.3s / +2.4s / — | 2 / +2.4s | 0/0/0/0 | 1/0/1/1 |
| 05 / striker | Granite Mammoth | 1.4s / 1.4s / 1.2s | 1.4s | 8.1s / 8s / 8.4s | 8.1s | +6.7s / +6.6s / +7.2s | 3 / +6.7s | 0/0/0/0 | 0/0/0/0 |
| 05 / striker | Cragback Rhino | 1.6s / 1.6s / 1.6s | 1.6s | 8.3s / 8.3s[U] / 8.5s | 8.3s | +6.7s / +6.7s / +6.8s | 3 / +6.7s | 0/0/0/0 | 1/0/0/0 |
| 05 / striker | Avalanche Tyrant | 0.8s / 0.8s / 0.9s | 0.8s | 2s / 1.6s / 1.6s | 1.6s | +1.1s / +0.8s / +0.7s | 3 / +0.8s | 0/0/0/0 | 0/0/0/0 |
| 05 / striker | Cliffside Roc | 0.8s / 1.1s / 0.9s | 0.9s | 1.8s / 1.7s / 1.7s | 1.7s | +0.9s / +0.6s / +0.8s | 3 / +0.8s | 0/0/0/0 | 0/0/0/0 |
| 05 / squire | Granite Mammoth | 1.6s / 2.8s / 4.2s | 2.8s | 25.2s / 25.5s[U] / 25.6s | 25.5s | +23.6s / +22.7s / +21.4s | 3 / +22.7s | 0/0/0/0 | 1/0/0/0 |
| 05 / squire | Cragback Rhino | 2.8s / 3.6s / 3.9s | 3.6s | 26.6s / 26.1s / 27s | 26.6s | +23.8s / +22.6s / +23.1s | 3 / +23.1s | 0/0/0/0 | 0/0/0/0 |
| 05 / squire | Avalanche Tyrant | 2.8s / 3.2s / 3.2s | 3.2s | 4.3s / 2.8s / 9.7s | 4.3s | +1.5s / --0.4s / +6.5s | 3 / +1.5s | 0/0/0/0 | 0/0/0/0 |
| 05 / squire | Cliffside Roc | 2.3s[U] / 2.8s / 2.8s | 2.8s | 5.3s / 2.8s / 2.3s | 2.8s | +3s / 0s / --0.5s | 3 / 0s | 1/0/0/0 | 0/0/0/0 |
| 05 / apprentice | Granite Mammoth | 2.2s / 2.2s / 2.6s | 2.2s | 8.1s[R] / 7.2s[UR] / 7.2s | 7.2s | +5.9s / +5s / +4.6s | 3 / +5s | 0/0/0/0 | 1/2/0/0 |
| 05 / apprentice | Cragback Rhino | 2.2s / 2.2s / 2.1s | 2.2s | 7.2s[U] / 7.2s / 7.2s | 7.2s | +5s / +5s / +5.1s | 3 / +5s | 0/0/0/0 | 1/0/0/0 |
| 05 / apprentice | Avalanche Tyrant | 1.9s / 1.7s / 1.7s | 1.7s | 3.6s / 3.8s / 3.7s | 3.7s | +1.7s / +2.1s / +2s | 3 / +2s | 0/0/0/0 | 0/0/0/0 |
| 05 / apprentice | Cliffside Roc | 1.7s / 1.8s / 1.8s | 1.8s | 3.1s / 3.4s / 3.4s | 3.4s | +1.4s / +1.6s / +1.6s | 3 / +1.6s | 0/0/0/0 | 0/0/0/0 |
| 05 / slinger | Granite Mammoth | 1.4s / 1.5s / 1.4s | 1.4s | 12.7s[UR] / 12.8s[UR] / 13s[R] | 12.8s | +11.3s / +11.3s / +11.6s | 3 / +11.3s | 0/0/0/0 | 2/3/0/0 |
| 05 / slinger | Cragback Rhino | 1.8s / 1.6s / 2.5s | 1.8s | 12.9s[R] / 12.8s[UR] / 12.9s[UR] | 12.9s | +11.1s / +11.1s / +10.4s | 3 / +11.1s | 0/0/0/0 | 2/3/0/0 |
| 05 / slinger | Avalanche Tyrant | 0.9s / 0.6s / 0.6s | 0.6s | 4.3s[U] / 2.1s / 1.8s[U] | 2.1s | +3.4s / +1.5s / +1.1s | 3 / +1.5s | 0/0/0/0 | 2/0/0/0 |
| 05 / slinger | Cliffside Roc | 1.2s / 1.2s / 1.1s | 1.2s | 1.8s / 4.2s / 2.4s | 2.4s | +0.6s / +3s / +1.3s | 3 / +1.3s | 0/0/0/0 | 0/0/0/0 |
| 05 / conduit | Granite Mammoth | 2s / 1.9s / 2s | 2s | 13.7s[UR] / 13.7s / 14.3s | 13.7s | +11.7s / +11.8s / +12.3s | 3 / +11.8s | 0/0/0/0 | 1/1/0/0 |
| 05 / conduit | Cragback Rhino | 3.8s / 3.5s / 3.7s | 3.7s | 31s[U] / 24.2s[U] / 26.3s | 26.3s | +27.3s / +20.8s / +22.6s | 3 / +22.6s | 0/0/0/0 | 2/0/0/0 |
| 05 / conduit | Avalanche Tyrant | 1.3s / 1.3s / 1.4s[U] | 1.3s | 2.6s / 2.8s / 3.2s[U] | 2.8s | +1.3s / +1.5s / +1.8s | 3 / +1.5s | 1/0/0/0 | 1/0/0/0 |
| 05 / conduit | Cliffside Roc | 1.3s / 1.4s / 1.4s | 1.4s | 3.8s / 3.5s / 3.1s | 3.5s | +2.5s / +2.1s / +1.7s | 3 / +2.1s | 0/0/0/0 | 0/0/0/0 |
| 05 / spirit | Granite Mammoth | 1.5s / 3s / 3s | 3s | 13.1s[UR] / 13s[UR] / 19.6s[R] | 13.1s | +11.6s / +10s / +16.6s | 3 / +11.6s | 0/0/0/0 | 2/3/0/0 |
| 05 / spirit | Cragback Rhino | 2.2s[U] / 2.5s / 2.8s | 2.5s | 15.4s / 18.1s[R] / 15.6s[UR] | 15.6s | +13.2s / +15.6s / +12.8s | 3 / +13.2s | 1/0/0/0 | 1/2/0/0 |
| 05 / spirit | Avalanche Tyrant | 1.1s / 1.4s[U] / 1.4s | 1.4s | 3.3s / 2.9s / 4.4s | 3.3s | +2.3s / +1.5s / +3s | 3 / +2.3s | 1/0/0/0 | 0/0/0/0 |
| 05 / spirit | Cliffside Roc | 1.1s / 1.5s / 1.8s | 1.5s | 3.7s / 4s[R] / 4.2s | 4s | +2.5s / +2.5s / +2.4s | 3 / +2.5s | 0/0/0/0 | 0/1/0/0 |

Mountain estimator note: 48 rows; missing clean medians control/candidate 0/5; 0 paired rows have fewer than two eligible seeds and are inconclusive for paired disposition. Target K/U/R remains separate in the summary and cell tables.

### Tundra

| Node / root | Species | Control seed medians | Control outer | Candidate seed medians | Candidate outer | Paired Δ by seed | Paired n / Δ median | Control U/R/D/M | Candidate U/R/D/M |
| --- | --- | --- | ---: | --- | ---: | --- | --- | ---: | ---: |
| 03 / striker | Permafrost Behemoth | 3.9s / 3.6s / 3.4s | 3.6s | 17.1s[U] / 16.7s / 18.1s | 17.1s | +13.2s / +13.1s / +14.8s | 3 / +13.2s | 0/0/0/0 | 1/0/0/0 |
| 03 / striker | Glacial Dire-Bear | 1.6s / 2s / 2.1s | 2s | 6.9s / 5.9s / 6.8s | 6.8s | +5.3s / +3.9s / +4.8s | 3 / +4.8s | 0/0/0/0 | 0/0/0/0 |
| 03 / striker | Rime-Tusk Mastodon | 1.8s / 1.6s / 1.8s | 1.8s | 4.9s / 5.2s / 5.3s | 5.2s | +3.1s / +3.6s / +3.5s | 3 / +3.5s | 0/0/0/0 | 0/0/0/0 |
| 03 / striker | Hoarfrost Yeti | 1.5s / 1.2s / 1.7s | 1.5s | 2.5s / 2.7s / 3.2s | 2.7s | +1.1s / +1.5s / +1.5s | 3 / +1.5s | 0/0/0/0 | 0/0/0/0 |
| 03 / squire | Permafrost Behemoth | 12.9s[U] / 13.2s / 12.9s | 12.9s | 49.8s[U] / 51.5s[U] / 48.8s[U] | 49.8s | +36.9s / +38.4s / +35.9s | 3 / +36.9s | 1/0/0/0 | 3/0/0/0 |
| 03 / squire | Glacial Dire-Bear | 6.3s / 4.3s / 5.4s | 5.4s | 22.6s / 25.2s / 25.3s | 25.2s | +16.3s / +20.9s / +19.9s | 3 / +19.9s | 0/0/0/0 | 0/0/0/0 |
| 03 / squire | Rime-Tusk Mastodon | 5.5s / 6s / 2.4s | 5.5s | — / 16.3s / 14.3s | 15.3s | — / +10.3s / +11.9s | 2 / +11.1s | 0/0/0/0 | 0/0/0/1 |
| 03 / squire | Hoarfrost Yeti | 5s / 2.5s / 5.5s | 5s | 7s / 8.4s / 8s | 8s | +2s / +5.9s / +2.5s | 3 / +2.5s | 0/0/0/0 | 0/0/0/0 |
| 03 / apprentice | Permafrost Behemoth | 3.7s / 4.2s / 4.2s[U] | 4.2s | 12.1s / 11s[U] / 12.2s | 12.1s | +8.4s / +6.8s / +8s | 3 / +8s | 1/0/0/0 | 1/0/0/0 |
| 03 / apprentice | Glacial Dire-Bear | 3s / 3.3s[U] / 3s | 3s | 5.9s / 5.2s / 5.2s | 5.2s | +2.9s / +1.9s / +2.2s | 3 / +2.2s | 1/0/0/0 | 0/0/0/0 |
| 03 / apprentice | Rime-Tusk Mastodon | 2.4s / 3s / 3.3s | 3s | 4.8s / 4.8s / 5.8s | 4.8s | +2.4s / +1.8s / +2.5s | 3 / +2.4s | 0/0/0/0 | 0/0/0/0 |
| 03 / apprentice | Hoarfrost Yeti | 3s / 3.5s / 3.5s | 3.5s | 3.1s / 2.9s / 3.2s | 3.1s | +0.1s / --0.7s / --0.3s | 3 / --0.3s | 0/0/0/0 | 0/0/0/0 |
| 03 / slinger | Permafrost Behemoth | 4.8s / 5.5s[U] / 5.5s | 5.5s | 21.5s[R] / 20.3s[UR] / 20.3s[UR] | 20.3s | +16.7s / +14.8s / +14.8s | 3 / +14.8s | 1/0/0/0 | 2/3/0/0 |
| 03 / slinger | Glacial Dire-Bear | 3.6s / 3.9s / 2.4s[U] | 3.6s | 12.3s[UR] / —[UR] / 10.4s[R] | 11.3s | +8.7s / — / +8s | 2 / +8.3s | 1/0/0/0 | 2/3/0/1 |
| 03 / slinger | Rime-Tusk Mastodon | 2.6s / 2.2s / 2.5s | 2.5s | 7.5s / 7.6s / 7.1s[U] | 7.5s | +5s / +5.4s / +4.6s | 3 / +5s | 0/0/0/0 | 1/0/0/0 |
| 03 / slinger | Hoarfrost Yeti | 1.2s / 1.8s / 1.8s | 1.8s | 4.8s[U] / 3.9s / 3.5s | 3.9s | +3.6s / +2.1s / +1.8s | 3 / +2.1s | 0/0/0/0 | 1/0/0/0 |
| 03 / conduit | Permafrost Behemoth | 15.2s / 20.1s / 14.6s | 15.2s | —[UR] / 92.7s / —[UR] | 92.7s | — / +72.5s / — | 1 / +72.5s inconclusive | 0/0/0/0 | 2/2/0/2 |
| 03 / conduit | Glacial Dire-Bear | 3.3s / 6.2s / 3.1s | 3.3s | 14.6s / —[U] / 13.4s | 14s | +11.3s / — / +10.3s | 2 / +10.8s | 0/0/0/0 | 1/0/0/1 |
| 03 / conduit | Rime-Tusk Mastodon | 4.7s / 6.6s[U] / 4.4s[U] | 4.7s | — / 38.5s / 35s | 36.7s | — / +31.9s / +30.6s | 2 / +31.2s | 2/0/0/0 | 0/0/0/1 |
| 03 / conduit | Hoarfrost Yeti | 3.1s / 3.2s / 2.4s | 3.1s | — / 6.6s / — | 6.6s | — / +3.4s / — | 1 / +3.4s inconclusive | 0/0/0/0 | 0/0/0/2 |
| 03 / spirit | Permafrost Behemoth | 5.3s / 6.5s / 6.3s | 6.3s | 24.4s / 43.8s / 17.7s | 24.4s | +19.1s / +37.3s / +11.4s | 3 / +19.1s | 0/0/0/0 | 0/0/0/0 |
| 03 / spirit | Glacial Dire-Bear | 2.8s / 3s / 3.1s[U] | 3s | 12.6s / 12.4s / 9.1s | 12.4s | +9.8s / +9.4s / +6s | 3 / +9.4s | 1/0/0/0 | 0/0/0/0 |
| 03 / spirit | Rime-Tusk Mastodon | 3.4s / 3s / 2.5s | 3s | 12.5s[U] / 12.1s[U] / 6.5s | 12.1s | +9.2s / +9.1s / +4s | 3 / +9.1s | 0/0/0/0 | 2/0/0/0 |
| 03 / spirit | Hoarfrost Yeti | 2.5s / 2.1s / 1.8s | 2.1s | 5.1s / 9.8s / 3.2s[R] | 5.1s | +2.6s / +7.8s / +1.4s | 3 / +2.6s | 0/0/0/0 | 0/1/0/0 |
| 05 / striker | Permafrost Behemoth | 2.8s / 2.7s / 2.7s | 2.7s | 13.6s / 13.5s[U] / 13.1s | 13.5s | +10.8s / +10.8s / +10.4s | 3 / +10.8s | 0/0/0/0 | 1/0/0/0 |
| 05 / striker | Glacial Dire-Bear | 1.4s / 1.5s / 1.4s[U] | 1.4s | 5.2s / 5.2s / 4.5s | 5.2s | +3.8s / +3.7s / +3s | 3 / +3.7s | 1/0/0/0 | 0/0/0/0 |
| 05 / striker | Rime-Tusk Mastodon | 1.1s / 1.2s / 1.2s | 1.2s | 3.5s / 4.3s / 4s[U] | 4s | +2.4s / +3.1s / +2.8s | 3 / +2.8s | 0/0/0/0 | 1/0/0/0 |
| 05 / striker | Hoarfrost Yeti | 1s / 1s / 1s | 1s | 2.3s / 2.4s / 2.3s | 2.3s | +1.3s / +1.4s / +1.3s | 3 / +1.3s | 0/0/0/0 | 0/0/0/0 |
| 05 / squire | Permafrost Behemoth | 6.6s / 6.8s / 6.7s | 6.7s | 39.4s / 40s / 38.9s | 39.4s | +32.8s / +33.2s / +32.2s | 3 / +32.8s | 0/0/0/0 | 0/0/0/0 |
| 05 / squire | Glacial Dire-Bear | 6.4s / 3.6s / 4.3s | 4.3s | 18.1s / 17.2s / 17.6s | 17.6s | +11.7s / +13.6s / +13.3s | 3 / +13.3s | 0/0/0/0 | 0/0/0/0 |
| 05 / squire | Rime-Tusk Mastodon | 4.3s / 3.6s / 5s | 4.3s | 14.4s / 12.2s / 12.4s | 12.4s | +10.1s / +8.6s / +7.5s | 3 / +8.6s | 0/0/0/0 | 0/0/0/0 |
| 05 / squire | Hoarfrost Yeti | 4.8s / 4.3s / 4.9s | 4.8s | 5.3s / 4s / 5s | 5s | +0.5s / --0.3s / +0.1s | 3 / +0.1s | 0/0/0/0 | 0/0/0/0 |
| 05 / apprentice | Permafrost Behemoth | 2.6s[U] / 3s / 3s | 3s | 8.9s / 8.9s / 8.5s | 8.9s | +6.3s / +5.9s / +5.5s | 3 / +5.9s | 1/0/0/0 | 0/0/0/0 |
| 05 / apprentice | Glacial Dire-Bear | 3s / 3.4s / 3.6s | 3.4s | 4.7s / 5.2s / 4.7s | 4.7s | +1.7s / +1.8s / +1.1s | 3 / +1.7s | 0/0/0/0 | 0/0/0/0 |
| 05 / apprentice | Rime-Tusk Mastodon | 2.4s / 2.2s / 2.2s | 2.2s | 3.6s / 3.6s / 3.6s | 3.6s | +1.2s / +1.4s / +1.4s | 3 / +1.4s | 0/0/0/0 | 0/0/0/0 |
| 05 / apprentice | Hoarfrost Yeti | 2.2s / 2.4s / 2.2s | 2.2s | 3s / 3s / 2.4s | 3s | +0.8s / +0.6s / +0.2s | 3 / +0.6s | 0/0/0/0 | 0/0/0/0 |
| 05 / slinger | Permafrost Behemoth | 3.7s[U] / 3.1s / 4.5s | 3.7s | 15s[UR] / 14.5s[UR] / 16.6s[UR] | 15s | +11.3s / +11.4s / +12.1s | 3 / +11.4s | 1/0/0/0 | 3/3/0/0 |
| 05 / slinger | Glacial Dire-Bear | 1.6s / 1.6s / 1.8s | 1.6s | 8s / 8s[UR] / 8.1s[UR] | 8s | +6.4s / +6.3s / +6.3s | 3 / +6.3s | 0/0/0/0 | 2/2/0/0 |
| 05 / slinger | Rime-Tusk Mastodon | 1.5s / 1.2s / 1.5s | 1.5s | 6s / 6.4s / 5.8s | 6s | +4.5s / +5.2s / +4.3s | 3 / +4.5s | 0/0/0/0 | 0/0/0/0 |
| 05 / slinger | Hoarfrost Yeti | 1.2s / 1.2s / 1.1s | 1.2s | 4.1s / 4.5s / 3.5s | 4.1s | +2.9s / +3.3s / +2.4s | 3 / +2.9s | 0/0/0/0 | 0/0/0/0 |
| 05 / conduit | Permafrost Behemoth | 8.1s / 8s / 8.2s[U] | 8.1s | 37.5s / 35.3s / 35.5s | 35.5s | +29.4s / +27.3s / +27.3s | 3 / +27.3s | 1/0/0/0 | 0/0/0/0 |
| 05 / conduit | Glacial Dire-Bear | 2.1s / 2.1s / 2.1s | 2.1s | 9.8s / 9.2s / 9.5s[U] | 9.5s | +7.7s / +7.1s / +7.4s | 3 / +7.4s | 0/0/0/0 | 1/0/0/0 |
| 05 / conduit | Rime-Tusk Mastodon | 2.6s / 2.6s / 2.6s | 2.6s | 9.5s / 9.3s[U] / 9.2s | 9.3s | +6.9s / +6.7s / +6.6s | 3 / +6.7s | 0/0/0/0 | 1/0/0/0 |
| 05 / conduit | Hoarfrost Yeti | 1.9s / 1.9s / 1.9s | 1.9s | 4.1s / 3.8s / 4s | 4s | +2.3s / +1.9s / +2.1s | 3 / +2.1s | 0/0/0/0 | 0/0/0/0 |
| 05 / spirit | Permafrost Behemoth | 3.3s / 3.5s / 5s | 3.5s | 9.3s / 17s[U] / 17.5s[U] | 17s | +6s / +13.5s / +12.5s | 3 / +12.5s | 0/0/0/0 | 2/0/0/0 |
| 05 / spirit | Glacial Dire-Bear | 1.5s / 1.5s / 2.5s[U] | 1.5s | 4.3s / 9.8s / 6.7s | 6.7s | +2.8s / +8.3s / +4.2s | 3 / +4.2s | 1/0/0/0 | 0/0/0/0 |
| 05 / spirit | Rime-Tusk Mastodon | 1.3s / 1.2s / 2.5s | 1.3s | 3.8s / 5.3s / 7s | 5.3s | +2.5s / +4.1s / +4.5s | 3 / +4.1s | 0/0/0/0 | 0/0/0/0 |
| 05 / spirit | Hoarfrost Yeti | 1.3s / 1s / 2.6s | 1.3s | 2.8s / 3.5s / 1.9s | 2.8s | +1.5s / +2.5s / --0.8s | 3 / +1.5s | 0/0/0/0 | 0/0/0/0 |

Tundra estimator note: 48 rows; missing clean medians control/candidate 0/8; 2 paired rows have fewer than two eligible seeds and are inconclusive for paired disposition. Target K/U/R remains separate in the summary and cell tables.

### Desert

| Node / root | Species | Control seed medians | Control outer | Candidate seed medians | Candidate outer | Paired Δ by seed | Paired n / Δ median | Control U/R/D/M | Candidate U/R/D/M |
| --- | --- | --- | ---: | --- | ---: | --- | --- | ---: | ---: |
| 03 / striker | Sand Viper | 2s / 1.9s / 2s | 2s | 6.5s / 6.4s / 6.7s | 6.5s | +4.5s / +4.5s / +4.7s | 3 / +4.5s | 0/0/0/0 | 0/0/0/0 |
| 03 / striker | Dune Basilisk | 2.6s / 2.5s / 2.6s[U] | 2.6s | 8.4s / 8.1s / 8.2s | 8.2s | +5.8s / +5.6s / +5.5s | 3 / +5.6s | 1/0/0/0 | 0/0/0/0 |
| 03 / striker | Dune Tyrant | 2.6s / 2.8s / 3.1s | 2.8s | 11.8s / 11.8s[U] / 11.8s | 11.8s | +9.2s / +9.1s / +8.7s | 3 / +9.1s | 0/0/0/0 | 1/0/0/0 |
| 03 / striker | Sunshield Scarab | 3.3s / 1s / 1.4s | 1.4s | 9.3s / 1.1s / 8.8s | 8.8s | +6s / +0.1s / +7.5s | 3 / +6s | 0/0/0/0 | 0/0/0/0 |
| 03 / squire | Sand Viper | 4.1s / 4.6s / 4.2s | 4.2s | 18.1s / 19.6s / 19.9s | 19.6s | +14s / +15.1s / +15.7s | 3 / +15.1s | 0/0/0/0 | 0/0/0/0 |
| 03 / squire | Dune Basilisk | 6.4s / 6.4s[U] / 6.4s | 6.4s | 22.1s / 22.8s / 25.5s[U] | 22.8s | +15.7s / +16.4s / +19.1s | 3 / +16.4s | 1/0/0/0 | 1/0/0/0 |
| 03 / squire | Dune Tyrant | 8.2s[U] / 7.8s / 8.6s | 8.2s | 37s[U] / 36.8s / 34.8s | 36.8s | +28.8s / +28.9s / +26.2s | 3 / +28.8s | 1/0/0/0 | 1/0/0/0 |
| 03 / squire | Sunshield Scarab | 3.1s / 4.6s[U] / 2.3s | 3.1s | 1.4s / 4.6s[U] / 3.4s | 3.4s | --1.8s / 0s / +1.1s | 3 / 0s | 1/0/0/0 | 1/0/0/0 |
| 03 / apprentice | Sand Viper | 2.4s / 2.1s / 2.4s | 2.4s | 5.7s[U] / 5.8s / 5s | 5.7s | +3.3s / +3.7s / +2.6s | 3 / +3.3s | 0/0/0/0 | 1/0/0/0 |
| 03 / apprentice | Dune Basilisk | 2.4s / 2.4s / 2.4s | 2.4s | 5.4s / 6.4s / 5.6s | 5.6s | +3s / +4s / +3.2s | 3 / +3.2s | 0/0/0/0 | 0/0/0/0 |
| 03 / apprentice | Dune Tyrant | 2.4s / 3s / 2.6s | 2.6s | 10.5s / 10.4s / 10.5s | 10.5s | +8.1s / +7.4s / +7.9s | 3 / +7.9s | 0/0/0/0 | 0/0/0/0 |
| 03 / apprentice | Sunshield Scarab | 2.2s / 3.6s / 2.2s | 2.2s | 2.2s[R] / 2.4s[R] / 1.6s[UR] | 2.2s | 0s / --1.2s / --0.6s | 3 / --0.6s | 0/0/0/0 | 1/3/0/0 |
| 03 / slinger | Sand Viper | 2.7s / 1.9s / 2.8s | 2.7s | 9.9s / 9.1s[U] / 9.4s[UR] | 9.4s | +7.2s / +7.1s / +6.6s | 3 / +7.1s | 0/0/0/0 | 2/1/0/0 |
| 03 / slinger | Dune Basilisk | 3.4s[R] / 3.9s[U] / 3.1s | 3.4s | 13s[UR] / —[R] / 12.3s[UR] | 12.7s | +9.6s / — / +9.2s | 2 / +9.4s | 1/1/0/0 | 2/3/0/1 |
| 03 / slinger | Dune Tyrant | 5.3s / 5.2s / 5.3s[U] | 5.3s | 18.6s[R] / —[UR] / 18s[R] | 18.3s | +13.3s / — / +12.7s | 2 / +13s | 1/0/0/0 | 1/3/0/1 |
| 03 / slinger | Sunshield Scarab | 3.9s / 5.5s[U] / 5.9s | 5.5s | 1s[UR] / 1.1s[UR] / 13.5s[UR] | 1.1s | --2.9s / --4.5s / +7.6s | 3 / --2.9s | 1/0/0/0 | 3/3/0/0 |
| 03 / conduit | Sand Viper | 4.5s / 5.8s / 5.1s | 5.1s | 31.9s[U] / 28.3s / 28.3s | 28.3s | +27.4s / +22.4s / +23.2s | 3 / +23.2s | 0/0/0/0 | 1/0/0/0 |
| 03 / conduit | Dune Basilisk | 14.6s[U] / 15.7s[U] / 10.1s | 14.6s | 46.2s / —[U] / 44s[U] | 45.1s | +31.6s / — / +34s | 2 / +32.8s | 2/0/0/0 | 2/0/0/1 |
| 03 / conduit | Dune Tyrant | 22.6s[UR] / 12.4s[UR] / — | 17.5s | 32.2s[R] / 48.7s / 45.8s | 45.8s | +9.6s / +36.3s / — | 2 / +22.9s | 2/2/0/1 | 0/1/0/0 |
| 03 / conduit | Sunshield Scarab | 9.3s[UR] / 8.4s[UR] / 10.3s | 9.3s | 4s[UR] / —[UR] / 1.8s[UR] | 2.9s | --5.3s / — / --8.6s | 2 / --6.9s | 2/2/0/0 | 3/3/0/1 |
| 03 / spirit | Sand Viper | 4.2s[URD] / 3.8s / 3.8s[U] | 3.8s | 10.2s / 15.2s[U] / 7.9s | 10.2s | +6s / +11.4s / +4.1s | 3 / +6s | 2/1/1/0 | 1/0/0/0 |
| 03 / spirit | Dune Basilisk | 9.3s[D] / 6.3s[U] / 5.2s | 6.3s | 18.6s / 13.8s / 11s[U] | 13.8s | +9.2s / +7.4s / +5.8s | 3 / +7.4s | 1/0/1/0 | 1/0/0/0 |
| 03 / spirit | Dune Tyrant | 6s[URD] / 5.2s / 6.7s | 6s | 16.2s / 21.3s / 14.1s | 16.2s | +10.2s / +16.1s / +7.4s | 3 / +10.2s | 1/1/1/0 | 0/0/0/0 |
| 03 / spirit | Sunshield Scarab | 5s[URD] / 4.6s[R] / 7.3s[UR] | 5s | 1.7s[UR] / 1.2s[UR] / 0.9s[UR] | 1.2s | --3.3s / --3.4s / --6.3s | 3 / --3.4s | 2/3/1/0 | 3/3/0/0 |
| 05 / striker | Sand Viper | 2s / 2s[U] / 2s | 2s | 6.5s / 6.3s / 6.4s | 6.4s | +4.5s / +4.3s / +4.4s | 3 / +4.4s | 1/0/0/0 | 0/0/0/0 |
| 05 / striker | Dune Basilisk | 2.6s / 2.6s / 2.5s | 2.6s | 9s / 8.2s / 8.2s | 8.2s | +6.4s / +5.6s / +5.7s | 3 / +5.7s | 0/0/0/0 | 0/0/0/0 |
| 05 / striker | Dune Tyrant | 2.6s / 2.6s / 3.1s | 2.6s | 11.7s[U] / 11.8s[U] / 11.8s | 11.8s | +9.1s / +9.3s / +8.7s | 3 / +9.1s | 0/0/0/0 | 2/0/0/0 |
| 05 / striker | Sunshield Scarab | 2.5s / 2.8s / 0.9s | 2.5s | 8.9s / 7.6s / 1.3s | 7.6s | +6.4s / +4.8s / +0.4s | 3 / +4.8s | 0/0/0/0 | 0/0/0/0 |
| 05 / squire | Sand Viper | 3.2s / 4.6s / 4.1s | 4.1s | 18.1s / 17.9s / 18.3s[U] | 18.1s | +14.9s / +13.3s / +14.2s | 3 / +14.2s | 0/0/0/0 | 1/0/0/0 |
| 05 / squire | Dune Basilisk | 6s / 6s / 6s | 6s | 22.1s / 21.4s / 21.9s | 21.9s | +16.1s / +15.4s / +15.9s | 3 / +15.9s | 0/0/0/0 | 0/0/0/0 |
| 05 / squire | Dune Tyrant | 8.9s[U] / 7.8s / 6s | 7.8s | 37s[U] / 36.5s / 32.9s | 36.5s | +28.1s / +28.7s / +26.9s | 3 / +28.1s | 1/0/0/0 | 1/0/0/0 |
| 05 / squire | Sunshield Scarab | 4.4s / 3.1s / 4.6s[U] | 4.4s | 1.4s / 2.3s / 5.2s | 2.3s | --3s / --0.8s / +0.6s | 3 / --0.8s | 1/0/0/0 | 0/0/0/0 |
| 05 / apprentice | Sand Viper | 2.4s / 2.4s / 2.4s[U] | 2.4s | 5.2s / 5.7s / 5s | 5.2s | +2.8s / +3.3s / +2.6s | 3 / +2.8s | 1/0/0/0 | 0/0/0/0 |
| 05 / apprentice | Dune Basilisk | 1.8s / 2.4s / 2.4s | 2.4s | 4.8s / 7s / 5.9s | 5.9s | +3s / +4.6s / +3.5s | 3 / +3.5s | 0/0/0/0 | 0/0/0/0 |
| 05 / apprentice | Dune Tyrant | 2.6s / 3s / 2.4s | 2.6s | 10.4s / 10.4s / 10.3s | 10.4s | +7.8s / +7.4s / +7.8s | 3 / +7.8s | 0/0/0/0 | 0/0/0/0 |
| 05 / apprentice | Sunshield Scarab | 2.2s / 2.4s[U] / 2.2s | 2.2s | 7.6s[UR] / 2.3s[R] / 2.2s[UR] | 2.3s | +5.4s / --0.1s / 0s | 3 / 0s | 1/0/0/0 | 2/3/0/0 |
| 05 / slinger | Sand Viper | 4.1s[U] / 3.5s / 2.7s | 3.5s | 8.7s / 8.7s[UR] / 9.4s | 8.7s | +4.6s / +5.3s / +6.7s | 3 / +5.3s | 1/0/0/0 | 1/1/0/0 |
| 05 / slinger | Dune Basilisk | 4s / 4.5s / 3.2s[U] | 4s | 13.1s[UR] / —[UR] / 12.1s[R] | 12.6s | +9.2s / — / +8.9s | 2 / +9s | 1/0/0/0 | 2/3/0/1 |
| 05 / slinger | Dune Tyrant | 5s / 5s / 4.5s | 5s | 18.6s[UR] / 18.7s[UR] / 16.2s[UR] | 18.6s | +13.6s / +13.7s / +11.7s | 3 / +13.6s | 0/0/0/0 | 3/3/0/0 |
| 05 / slinger | Sunshield Scarab | 3.6s / 7s[U] / 2.7s[U] | 3.6s | 2.3s[UR] / 0.8s[R] / 3.6s[UR] | 2.3s | --1.4s / --6.2s / +0.9s | 3 / --1.4s | 2/0/0/0 | 2/3/0/0 |
| 05 / conduit | Sand Viper | 4.4s / 6.2s / 5.5s | 5.5s | 29.8s / 27.5s / 21.4s | 27.5s | +25.4s / +21.3s / +15.9s | 3 / +21.3s | 0/0/0/0 | 0/0/0/0 |
| 05 / conduit | Dune Basilisk | 9.2s / 16.3s / 19.7s | 16.3s | 21.8s / 24.1s / 45.5s[U] | 24.1s | +12.6s / +7.8s / +25.9s | 3 / +12.6s | 0/0/0/0 | 1/0/0/0 |
| 05 / conduit | Dune Tyrant | 13.8s[UR] / 21.5s / 19.8s[U] | 19.8s | 41.6s[UR] / 49.1s[R] / 31.5s | 41.6s | +27.9s / +27.6s / +11.8s | 3 / +27.6s | 2/1/0/0 | 1/2/0/0 |
| 05 / conduit | Sunshield Scarab | 5.3s[UR] / 8.2s[UR] / 8.7s[U] | 8.2s | —[UR] / 3.3s[UR] / 2.5s[UR] | 2.9s | — / --4.8s / --6.2s | 2 / --5.5s | 3/2/0/0 | 3/3/0/1 |
| 05 / spirit | Sand Viper | 4.2s[URD] / 5.2s[U] / 3.6s[U] | 4.2s | 11s[U] / 16.4s / 8.8s | 11s | +6.8s / +11.2s / +5.2s | 3 / +6.8s | 3/1/1/0 | 1/0/0/0 |
| 05 / spirit | Dune Basilisk | 9.3s[D] / 9.8s / 4.5s | 9.3s | 23s / 17.4s / 8.8s | 17.4s | +13.7s / +7.6s / +4.2s | 3 / +7.6s | 0/0/1/0 | 0/0/0/0 |
| 05 / spirit | Dune Tyrant | 6s[URD] / 5.3s / 5.6s | 5.6s | 14.4s / 31.4s[U] / 18.6s[U] | 18.6s | +8.4s / +26s / +13s | 3 / +13s | 1/1/1/0 | 2/0/0/0 |
| 05 / spirit | Sunshield Scarab | 5s[URD] / 6.8s[UR] / 4.8s[U] | 5s | 1.7s[UR] / 2.6s[UR] / 4s[UR] | 2.6s | --3.3s / --4.2s / --0.8s | 3 / --3.3s | 3/2/1/0 | 3/3/0/0 |

Desert estimator note: 48 rows; missing clean medians control/candidate 1/6; 0 paired rows have fewer than two eligible seeds and are inconclusive for paired disposition. Target K/U/R remains separate in the summary and cell tables.

## Trench mini-boss pacing and engagement analysis

The user goal for this block was that all three species read as roughly 40–60s mini-boss encounters while preserving role/class spread. The candidate species medians are near that band at the representative outer-median level, but they are not a universal floor: body TTK varies materially by root, and many target records remain unfinished or regain-tainted.

| Species | Candidate outer median | Candidate cell range | Cells in 40–60s | Cells >90s | Candidate K/U/R | Candidate onset median / range | Candidate median max-gap / largest gap |
| --- | ---: | --- | ---: | ---: | ---: | --- | --- |
| Elder Leviathan | 62.1s | 22.3s–306s | 3/12 | 3/12 | 134/50/55 | 259.3s / 155.1s–364.8s | 3.2s / 512.3s |
| Abyssal Serpent | 48.7s | 19.4s–191.8s | 3/12 | 3/12 | 174/38/37 | 227.9s / 136.8s–320.6s | 1.6s / 442s |
| Hadal Stalker | 38s | 18.6s–90.4s | 2/12 | 1/12 | 88/10/3 | 348.1s / 255.3s–469.2s | 1.1s / 75.6s |

The 40–60s counts are descriptive, not pass/fail thresholds. Elder Leviathan’s representative candidate median is 62.1s, Abyssal Serpent’s 48.7s, and Hadal Stalker’s 38.0s. The candidate tails are driven by class and engagement variation: three of twelve Leviathan cells and three of twelve Serpent cells exceed 90s; one Stalker cell exceeds 90s. Unfinished candidate target records are 26 Leviathan, 24 Serpent, and 9 Stalker, with observed regain in 24, 18, and 2 records respectively. No Trench player death or wall-ceiling outcome occurred.

### Full Trench class spread

| Root / source class | Candidate outer median across six species-node rows | Candidate range | Control outer median | Paired candidate-control median Δ |
| --- | ---: | --- | ---: | ---: |
| striker / cadence-root | 30.4s | 23.8s–53.4s | 7s | +24.1s |
| squire / cooldown-root | 95s | 66.3s–179.3s | 20.8s | +74.8s |
| apprentice / dot-root | 20s | 18.6s–23.9s | 4.7s | +15.4s |
| slinger / reload-root | 45s | 35s–62.1s | 10.3s | +33.8s |
| conduit / summoner-root | 147s | 80s–306s | 49.3s | +105s |
| spirit / energy-root | 58s | 38s–84.4s | 14.7s | +40.4s |

The prepared roots therefore retain a real spread: Apprentice is fastest, while Squire and Conduit are slowest in the candidate. That is compatible with the packet’s instruction to preserve specialization and not force every build to one target. The species overlay should not be translated into a class-wide damage, cooldown, or delivery patch.

### Trench Stalker approach/recovery proxy

The table reports per-cell candidate/control Stalker target statistics and the surrounding engagement. First damaging hit is a proxy for approach/onset only; it is not body TTK. The episode columns are multi-target engagement durations and must not be read as a single Stalker mini-boss fight.
| Node / root | Stalker control/candidate first-hit onset | Control/candidate clean body TTK | Candidate max damage gap | Candidate target K/U/R | Candidate episode max / late joiners / recovery interruptions |
| --- | --- | --- | --- | --- | --- |
| 03 / striker | 363.3s / 387.3s | 3.6s / 23.4s | 26.4s | 10/1/0 | 74.3s / 6 / 0 |
| 03 / squire | 251.3s / 255.3s | 11s / 67.3s | 75.6s | 4/0/0 | 235.1s / 2 / 0 |
| 03 / apprentice | 278.4s / 300.9s | 3.6s / 18.6s | 21.8s | 20/2/0 | 600s / 72 / 5 |
| 03 / slinger | 392.8s / 256.7s | 4.9s / 35.3s | 1.9s | 7/0/0 | 600s / 57 / 0 |
| 03 / conduit | 396.6s / 398.9s | 17.1s / 80s | 0.6s | 1/1/1 | 600s / 34 / 0 |
| 03 / spirit | 375.6s / 367.6s | 8s / 38s | 0.6s | 5/1/0 | 600s / 56 / 0 |
| 05 / striker | 308s / 460.6s | 4.7s / 29.3s | 0.5s | 9/1/0 | 138.2s / 4 / 0 |
| 05 / squire | 260.2s / 288.1s | 15.5s / 90.4s | 1.8s | 1/0/0 | 331.3s / 1 / 0 |
| 05 / apprentice | 315.7s / 301.5s | 3.6s / 20.4s | 2.2s | 16/2/2 | 600s / 74 / 1 |
| 05 / slinger | 286.4s / 428.1s | 6.9s / 42.7s | 1.9s | 10/0/0 | 600s / 46 / 0 |
| 05 / conduit | 396.2s / 469.2s | 36.6s / — | 0.4s | 0/1/0 | 600s / 28 / 0 |
| 05 / spirit | 368.1s / 328.7s | 7.5s / 59.4s | 0.6s | 5/1/0 | 600s / 46 / 0 |

Stalker onset and max-gap values move with pull order, pursuit, and target availability. Several candidate cells have long first-hit windows while still showing clean body TTKs for the targets they did reach; this is why a first-hit-to-death number would be misleading. Trench aggregate exposure was 869 late joiners and 2000 sampled 3+ pursuer seconds; recovery interruptions remain separately recorded.

### Trench Conduit diagnostic

| Node / species | Control / candidate body outer median | Control / candidate first-hit onset | Candidate max damage gap | Candidate K/U/R | Candidate episodes / max episode / late joiners / recovery interruptions | Candidate top incoming sources |
| --- | --- | --- | --- | --- | --- | --- |
| 03 / Elder Leviathan | 62.8s / 306s | 249.1s / 265s | 512.3s | 1/9/8 | 3 / 600s / 34 / 0 | Abyssal Serpent direct 15772hp/191x/max123<br>Elder Leviathan direct 3723hp/52x/max102 |
| 03 / Abyssal Serpent | 28.8s / 102.3s | 151.9s / 235.5s | 56.5s | 7/6/8 | 3 / 600s / 34 / 0 | Abyssal Serpent direct 15772hp/191x/max123<br>Elder Leviathan direct 3723hp/52x/max102 |
| 03 / Hadal Stalker | 18.4s / 80s | 396.6s / 398.9s | 0.6s | 1/1/1 | 3 / 600s / 34 / 0 | Abyssal Serpent direct 15772hp/191x/max123<br>Elder Leviathan direct 3723hp/52x/max102 |
| 05 / Elder Leviathan | 229.5s / — | 217.1s / 247.8s | 245.4s | 0/10/10 | 3 / 600s / 28 / 0 | Abyssal Serpent direct 12469hp/150x/max176<br>Elder Leviathan direct 6097hp/85x/max102 |
| 05 / Abyssal Serpent | 62s / 191.8s | 75.6s / 194.4s | 379.3s | 3/7/6 | 3 / 600s / 28 / 0 | Abyssal Serpent direct 12469hp/150x/max176<br>Elder Leviathan direct 6097hp/85x/max102 |
| 05 / Hadal Stalker | 36.6s / — | 396.2s / 469.2s | 0.4s | 0/1/0 | 3 / 600s / 28 / 0 | Abyssal Serpent direct 12469hp/150x/max176<br>Elder Leviathan direct 6097hp/85x/max102 |

Conduit’s slow candidate rows are not explained by one proven class defect. The traces show low delivered throughput against the enlarged body package, long or interrupted multi-target episodes, and in some cells long gaps between target damage; the target-side shield/Carapace schedules were deliberately preserved in absolute source-level amount but were not isolated by a counterfactual arm. There were no long-quiet or blocked samples to support a pure pathing stall explanation. The evidence supports a delivery/engagement audit of the existing Summoner root and target mechanics, not a Conduit class patch, shield multiplication, or a forced TTK equalization.

Descriptive >90s/unfinished outliers are retained in the estimator tables. They are not automatic nerf thresholds: the Squire/Conduit long tails are counterbalanced by fast Apprentice/Slinger rows and by the packet’s requirement to preserve class specialization.
## All-biome per-cell pressure, durability, and exposure

This table reports each prepared cell/arm across its three seeds. TTK is a mixed descriptive median of run-level clean medians; species/class/node estimator tables above remain primary. Incoming source strings aggregate the three raw event streams for that cell/arm. Death time/kills are expanded in the death review below.
### Trench

| Cell | WE/PD/WC | Mixed clean TTK / clean targets | K/U/R | Min HP median / low; deaths | Incoming median / max; top sources | Casts started/fired | Recovery interrupts / episodes | Exposure P/3+/LJ/LQ/B |
| --- | ---: | ---: | ---: | --- | --- | ---: | ---: | --- |
| trench 03 striker candidate | 3/0/0 | 25.4s / 52 | 52/3/0 | 56.1% / 46%; 0 | 12611 / 14185; Abyssal Serpent direct 19837hp/215x/max138<br>Elder Leviathan direct 12012hp/132x/max97<br>Hadal Stalker direct 6919hp/81x/max126 | 172/170 | 0 / 49 | P2/3+0s/LJ6/LQ0 (max7s)/B0 |
| trench 03 striker control | 3/0/0 | 6.2s / 155 | 155/1/0 | 72.2% / 59.4%; 0 | 8685 / 8714; Abyssal Serpent direct 9833hp/120x/max136<br>Elder Leviathan direct 9469hp/100x/max97<br>Hadal Stalker direct 6538hp/92x/max126 | 150/96 | 0 / 153 | P2/3+0s/LJ3/LQ0 (max10.3s)/B0 |
| trench 03 squire candidate | 3/0/0 | 76.7s / 17 | 17/3/0 | 75.3% / 63.3%; 0 | 10940 / 13095; Abyssal Serpent direct 15955hp/199x/max132<br>Elder Leviathan direct 11138hp/144x/max84<br>Hadal Stalker direct 6668hp/92x/max110 | 176/175 | 0 / 18 | P2/3+0s/LJ2/LQ0 (max7.5s)/B0 |
| trench 03 squire control | 3/0/0 | 17.8s / 60 | 60/2/0 | 75.3% / 68.5%; 0 | 8994 / 9926; Elder Leviathan direct 12725hp/163x/max84<br>Abyssal Serpent direct 10211hp/133x/max132<br>Hadal Stalker direct 4614hp/64x/max110 | 163/158 | 0 / 60 | P2/3+0s/LJ2/LQ0 (max11.3s)/B0 |
| trench 03 apprentice candidate | 3/0/0 | 19.8s / 66 | 73/7/10 | 34.1% / 33.5%; 0 | 9073.3 / 10501.5; Abyssal Serpent direct 11442.6hp/109x/max158.4<br>Hadal Stalker direct 9310.5hp/111x/max138.6<br>Elder Leviathan direct 4853.7hp/55x/max90.9 | 145/123 | 5 / 11 | P4/3+102s/LJ72/LQ0 (max10.8s)/B0 |
| trench 03 apprentice control | 3/0/0 | 4.8s / 178 | 179/2/1 | 72.2% / 67.4%; 0 | 3280.3 / 3367.7; Hadal Stalker direct 7057.8hp/99x/max140.4<br>Abyssal Serpent direct 966.6hp/12x/max81<br>Hadal Stalker debt 645hp/494x/max3 | 15/5 | 29 / 163 | P3/3+1s/LJ18/LQ0 (max12.6s)/B0 |
| trench 03 slinger candidate | 3/0/0 | 37.9s / 34 | 37/10/11 | 42.2% / 36.4%; 0 | 7688 / 8360; Abyssal Serpent direct 12091hp/119x/max185<br>Hadal Stalker direct 6362hp/77x/max163<br>Elder Leviathan direct 4402hp/52x/max106 | 133/130 | 0 / 3 | P4/3+230s/LJ57/LQ0 (max11.3s)/B0 |
| trench 03 slinger control | 3/0/0 | 8.8s / 119 | 121/6/4 | 55.5% / 54.9%; 0 | 3992 / 4382; Hadal Stalker direct 7233hp/83x/max167<br>Abyssal Serpent direct 4395hp/25x/max189<br>Elder Leviathan direct 424hp/4x/max106 | 98/62 | 0 / 51 | P4/3+12s/LJ78/LQ0 (max11.6s)/B0 |
| trench 03 conduit candidate | 3/0/0 | 124.8s / 7 | 9/16/17 | 52.5% / 50.4%; 0 | 6927 / 9918; Abyssal Serpent direct 15772hp/191x/max123<br>Elder Leviathan direct 3723hp/52x/max102<br>Hadal Stalker direct 3076hp/42x/max117 | 132/131 | 0 / 3 | P5/3+240s/LJ34/LQ0 (max10.4s)/B0 |
| trench 03 conduit control | 3/0/0 | 29.6s / 29 | 32/11/12 | 63.4% / 61.7%; 0 | 3858 / 4078; Abyssal Serpent direct 4819hp/56x/max128<br>Elder Leviathan direct 3550hp/50x/max71<br>Hadal Stalker direct 3355hp/45x/max165 | 105/101 | 0 / 6 | P6/3+179s/LJ44/LQ0 (max11.3s)/B0 |
| trench 03 spirit candidate | 3/0/0 | 49.8s / 30 | 31/11/9 | 34.9% / 26.5%; 0 | 6548 / 7851.2; Abyssal Serpent direct 12905.3hp/145x/max178 + 4684.7 absorbed<br>Hadal Stalker direct 5488.4hp/68x/max158 + 1600.6 absorbed<br>Elder Leviathan direct 2196.2hp/62x/max103 + 4193.8 absorbed | 151/139 | 0 / 3 | P5/3+301s/LJ56/LQ0 (max7.6s)/B0 |
| trench 03 spirit control | 3/0/0 | 13.8s / 79 | 84/5/8 | 61.9% / 40.5%; 0 | 3178.4 / 3979; Abyssal Serpent direct 4347.3hp/63x/max129.1 + 4412.8 absorbed<br>Hadal Stalker direct 3193.9hp/56x/max119.3 + 2346.1 absorbed<br>Elder Leviathan direct 1778.6hp/51x/max103 + 3474.4 absorbed | 122/113 | 9 / 24 | P5/3+103s/LJ75/LQ0 (max12.6s)/B0 |
| trench 05 striker candidate | 3/0/0 | 31.5s / 42 | 42/2/0 | 71.1% / 55.1%; 0 | 11945 / 14066; Abyssal Serpent direct 18213hp/202x/max138<br>Elder Leviathan direct 12474hp/137x/max97<br>Hadal Stalker direct 6717hp/82x/max126 | 176/169 | 0 / 40 | P3/3+11s/LJ4/LQ0 (max12.3s)/B0 |
| trench 05 striker control | 3/0/0 | 7.8s / 120 | 120/3/0 | 66.1% / 65.6%; 0 | 9749 / 10552; Abyssal Serpent direct 11901hp/122x/max138<br>Elder Leviathan direct 11441hp/123x/max97<br>Hadal Stalker direct 5966hp/82x/max126 | 127/120 | 0 / 119 | P2/3+0s/LJ4/LQ0 (max10.9s)/B0 |
| trench 05 squire candidate | 3/0/0 | 99.6s / 11 | 11/3/0 | 75.7% / 74.9%; 0 | 11217 / 11448; Elder Leviathan direct 16451hp/213x/max84<br>Abyssal Serpent direct 15009hp/186x/max132<br>Hadal Stalker direct 1657hp/23x/max110 | 206/204 | 0 / 13 | P2/3+0s/LJ1/LQ0 (max7.7s)/B0 |
| trench 05 squire control | 3/0/0 | 53.2s / 36 | 36/4/0 | 75.3% / 74.9%; 0 | 9341 / 9495; Elder Leviathan direct 17080hp/220x/max84<br>Abyssal Serpent direct 7529hp/92x/max132<br>Hadal Stalker direct 1684hp/25x/max110 | 199/198 | 0 / 38 | P2/3+0s/LJ2/LQ0 (max15.7s)/B0 |
| trench 05 apprentice candidate | 3/0/0 | 20.4s / 61 | 67/6/11 | 41.5% / 35.7%; 0 | 9174 / 9359.9; Abyssal Serpent direct 9324.9hp/89x/max158.4<br>Hadal Stalker direct 8641.8hp/100x/max138.6<br>Elder Leviathan direct 6298.2hp/71x/max95.4 | 147/126 | 1 / 4 | P4/3+87s/LJ74/LQ0 (max11s)/B0 |
| trench 05 apprentice control | 3/0/0 | 4.8s / 174 | 175/0/1 | 65.1% / 63%; 0 | 3416.2 / 3735.4; Hadal Stalker direct 7750.8hp/106x/max140.4<br>Abyssal Serpent direct 876.6hp/9x/max158.4<br>Hadal Stalker debt 687hp/518x/max3 | 14/9 | 23 / 128 | P3/3+4s/LJ49/LQ0 (max12.3s)/B0 |
| trench 05 slinger candidate | 3/0/0 | 45.2s / 25 | 30/8/10 | 42.6% / 39.5%; 0 | 8101 / 8493; Abyssal Serpent direct 11390hp/106x/max185<br>Hadal Stalker direct 9131hp/119x/max163<br>Elder Leviathan direct 3780hp/44x/max110 | 136/130 | 0 / 3 | P4/3+146s/LJ46/LQ0 (max6.4s)/B0 |
| trench 05 slinger control | 3/0/0 | 11.9s / 91 | 97/5/8 | 54.5% / 52.8%; 0 | 4890 / 5502; Abyssal Serpent direct 5691hp/37x/max189<br>Hadal Stalker direct 4662hp/59x/max163<br>Elder Leviathan direct 3626hp/37x/max106 | 114/101 | 0 / 15 | P4/3+24s/LJ90/LQ0 (max12s)/B0 |
| trench 05 conduit candidate | 3/0/0 | 191.8s / 3 | 3/18/16 | 59% / 58%; 0 | 6816 / 7738; Abyssal Serpent direct 12469hp/150x/max176<br>Elder Leviathan direct 6097hp/85x/max102<br>Hadal Stalker direct 2628hp/36x/max109 | 146/146 | 0 / 3 | P4/3+160s/LJ28/LQ0 (max5.9s)/B0 |
| trench 05 conduit control | 3/0/0 | 71.7s / 9 | 9/8/6 | 61.7% / 59.6%; 0 | 3481 / 5144; Elder Leviathan direct 5751hp/81x/max71<br>Abyssal Serpent direct 4574hp/55x/max128<br>Hadal Stalker direct 1488hp/21x/max114 | 120/117 | 0 / 3 | P4/3+62s/LJ27/LQ0 (max10.2s)/B0 |
| trench 05 spirit candidate | 3/0/0 | 60.1s / 21 | 24/11/11 | 40.2% / 30.5%; 0 | 6309.3 / 7120.5; Abyssal Serpent direct 9740.3hp/106x/max178 + 3377.8 absorbed<br>Elder Leviathan direct 2949.1hp/85x/max103 + 5805.9 absorbed<br>Hadal Stalker direct 6644.1hp/80x/max119.3 + 1680.9 absorbed | 146/146 | 0 / 3 | P6/3+175s/LJ46/LQ0 (max10.8s)/B0 |
| trench 05 spirit control | 3/0/0 | 14.9s / 91 | 93/3/3 | 43.7% / 38.1%; 0 | 4230.9 / 5406.1; Hadal Stalker direct 5670.1hp/92x/max158 + 3506.9 absorbed<br>Abyssal Serpent direct 3526.5hp/48x/max142.3 + 2763.5 absorbed<br>Elder Leviathan direct 1741.6hp/44x/max103 + 2790.4 absorbed | 107/95 | 17 / 50 | P5/3+163s/LJ51/LQ0 (max11.1s)/B0 |

### Mountain

| Cell | WE/PD/WC | Mixed clean TTK / clean targets | K/U/R | Min HP median / low; deaths | Incoming median / max; top sources | Casts started/fired | Recovery interrupts / episodes | Exposure P/3+/LJ/LQ/B |
| --- | ---: | ---: | ---: | --- | --- | ---: | ---: | --- |
| mountain 03 striker candidate | 2/1/0 | 3s / 75 | 75/2/0 | 14.5% / 0%; 255s | 5218.8 / 6285.5; Granite Mammoth direct 7813.5hp/58x/max211 + 4812.5 absorbed<br>Cliffside Roc direct 2774.5hp/28x/max311 + 5612.5 absorbed<br>Cragback Rhino direct 4600.5hp/61x/max259 + 3086.5 absorbed | 43/43 | 46 / 71 | P3/3+4s/LJ6/LQ0 (max17.3s)/B0 |
| mountain 03 striker control | 3/0/0 | 1.5s / 135 | 135/0/0 | 50.5% / 47.8%; 0 | 2220.5 / 2321.5; Cliffside Roc direct 3516.5hp/39x/max311 + 8612.5 absorbed<br>Granite Mammoth direct 1124.3hp/29x/max211 + 4994.8 absorbed<br>Avalanche Tyrant direct 1514hp/33x/max152 + 3502 absorbed | 66/39 | 97 / 131 | P2/3+0s/LJ5/LQ0 (max16.9s)/B0 |
| mountain 03 squire candidate | 3/0/0 | 9.3s / 44 | 44/3/0 | 55.1% / 48.2%; 0 | 4939.6 / 4948.8; Granite Mammoth direct 5768.2hp/69x/max235 + 7368.8 absorbed<br>Cliffside Roc direct 3921hp/51x/max239 + 6318 absorbed<br>Cragback Rhino direct 3189.2hp/84x/max193 + 6782.8 absorbed | 34/33 | 26 / 42 | P2/3+0s/LJ5/LQ0 (max10.6s)/B0 |
| mountain 03 squire control | 3/0/0 | 4.2s / 97 | 97/0/0 | 69.6% / 53.2%; 0 | 1513.8 / 2382; Cliffside Roc direct 2591.2hp/34x/max239 + 4559.8 absorbed<br>Granite Mammoth direct 1198.4hp/40x/max178 + 5921.6 absorbed<br>Cragback Rhino direct 392.4hp/45x/max89 + 3612.6 absorbed | 48/48 | 40 / 92 | P2/3+0s/LJ5/LQ0 (max15.3s)/B0 |
| mountain 03 apprentice candidate | 3/0/0 | 3.9s / 83 | 84/1/1 | 44.7% / 33.6%; 0 | 610.3 / 972.2; Cliffside Roc direct 1843.6hp/41x/max175.5 + 7642.6 absorbed<br>Granite Mammoth direct 0hp/2x/max0 + 360 absorbed<br>Cragback Rhino direct 0hp/2x/max0 + 222 absorbed | 50/45 | 14 / 77 | P2/3+0s/LJ8/LQ0 (max12.9s)/B0 |
| mountain 03 apprentice control | 3/0/0 | 2.4s / 119 | 120/1/1 | 87.7% / 70.9%; 0 | 267.7 / 346.5; Cliffside Roc direct 798.5hp/33x/max152.1 + 7395.8 absorbed<br>Granite Mammoth direct 0hp/3x/max0 + 540 absorbed<br>Avalanche Tyrant direct 0hp/2x/max0 + 300 absorbed | 56/42 | 22 / 111 | P3/3+2s/LJ10/LQ0 (max22.9s)/B0 |
| mountain 03 slinger candidate | 3/0/0 | 5s / 46 | 54/7/14 | 49.9% / 8.1%; 0 | 1104.5 / 1560; Cliffside Roc direct 3437hp/41x/max257 + 5156 absorbed<br>Cragback Rhino direct 0hp/6x/max0 + 732 absorbed<br>Granite Mammoth direct 144hp/2x/max144 + 220 absorbed | 39/38 | 3 / 9 | P3/3+2s/LJ52/LQ0 (max9.8s)/B0 |
| mountain 03 slinger control | 3/0/0 | 1.6s / 122 | 123/1/1 | 51.2% / 49.1%; 0 | 939 / 1069; Cliffside Roc direct 2726.5hp/40x/max257 + 7474.5 absorbed | 65/40 | 27 / 115 | P3/3+1s/LJ9/LQ1 (max83.6s)/B0 |
| mountain 03 conduit candidate | 2/1/0 | 7s / 19 | 20/6/4 | 6.4% / 0%; 156.6s | 1013 / 1818; Cliffside Roc direct 3037hp/32x/max177 + 2025 absorbed<br>Granite Mammoth direct 161.5hp/6x/max123.9 + 922.5 absorbed<br>Cragback Rhino direct 0hp/3x/max0 + 543 absorbed | 10/10 | 0 / 11 | P3/3+2s/LJ16/LQ0 (max7.2s)/B0 |
| mountain 03 conduit control | 3/0/0 | 2.5s / 112 | 112/0/0 | 90.3% / 63.2%; 0 | 100 / 277; Cliffside Roc direct 477hp/16x/max177 + 3375 absorbed | 16/16 | 6 / 109 | P2/3+0s/LJ4/LQ0 (max13.2s)/B0 |
| mountain 03 spirit candidate | 2/1/0 | 8.3s / 36 | 39/5/4 | 35.8% / 0%; 22.1s | 875 / 1247.8; Cliffside Roc direct 2496.8hp/39x/max251 + 5906.1 absorbed<br>Granite Mammoth direct 0hp/13x/max0 + 2314 absorbed<br>Cragback Rhino direct 306hp/10x/max102 + 1628 absorbed | 32/32 | 10 / 21 | P3/3+4s/LJ24/LQ0 (max8.2s)/B0 |
| mountain 03 spirit control | 3/0/0 | 2.4s / 149 | 149/1/0 | 71.9% / 52.6%; 0 | 141 / 507; Cliffside Roc direct 680.7hp/37x/max174 + 8298.3 absorbed | 76/42 | 29 / 147 | P2/3+0s/LJ4/LQ0 (max11.9s)/B0 |
| mountain 05 striker candidate | 3/0/0 | 2.4s / 106 | 106/1/0 | 47.8% / 43.9%; 0 | 3481.5 / 4267.8; Cliffside Roc direct 3690hp/40x/max311 + 8750 absorbed<br>Granite Mammoth direct 4712.5hp/44x/max211 + 4571.5 absorbed<br>Cragback Rhino direct 932hp/48x/max103 + 4012 absorbed | 61/61 | 70 / 97 | P3/3+1s/LJ10/LQ0 (max10.7s)/B0 |
| mountain 05 striker control | 3/0/0 | 1.1s / 151 | 151/0/0 | 47.8% / 21.9%; 0 | 2854 / 2996.5; Cliffside Roc direct 4726.8hp/46x/max311 + 9579.3 absorbed<br>Granite Mammoth direct 1419.8hp/33x/max211 + 5543.3 absorbed<br>Avalanche Tyrant direct 1858.8hp/32x/max152 + 3005.3 absorbed | 75/46 | 120 / 149 | P2/3+0s/LJ3/LQ0 (max10.8s)/B0 |
| mountain 05 squire candidate | 3/0/0 | 21.9s / 45 | 45/1/0 | 54.1% / 51.3%; 0 | 1407.4 / 1567.2; Granite Mammoth direct 2008.2hp/56x/max178 + 8472.8 absorbed<br>Cragback Rhino direct 385.4hp/83x/max89 + 8873.6 absorbed<br>Cliffside Roc direct 1160hp/22x/max239 + 3643 absorbed | 29/28 | 22 / 41 | P2/3+0s/LJ5/LQ0 (max18.4s)/B0 |
| mountain 05 squire control | 3/0/0 | 3.1s / 124 | 124/1/0 | 68.7% / 47.7%; 0 | 558.2 / 611.2; Cliffside Roc direct 645.6hp/28x/max206 + 5916.4 absorbed<br>Granite Mammoth direct 489.6hp/26x/max178 + 4138.4 absorbed<br>Avalanche Tyrant direct 513.2hp/27x/max169.4 + 3179.8 absorbed | 64/54 | 50 / 119 | P3/3+3s/LJ5/LQ0 (max13.1s)/B0 |
| mountain 05 apprentice candidate | 3/0/0 | 4s / 91 | 94/2/3 | 39.9% / 29.4%; 0 | 722 / 1077.2; Cliffside Roc direct 1691.3hp/33x/max225.9 + 6253.8 absorbed<br>Avalanche Tyrant direct 171hp/6x/max171 + 790 absorbed<br>Granite Mammoth direct 0hp/4x/max0 + 720 absorbed | 53/52 | 16 / 77 | P2/3+0s/LJ20/LQ0 (max13.4s)/B0 |
| mountain 05 apprentice control | 3/0/0 | 2s / 130 | 130/0/0 | 74.8% / 59.7%; 0 | 415.8 / 568.8; Cliffside Roc direct 1155.8hp/46x/max194.6 + 10261.8 absorbed<br>Avalanche Tyrant direct 0hp/3x/max0 + 450 absorbed<br>Cragback Rhino direct 0hp/1x/max0 + 111 absorbed | 59/48 | 28 / 115 | P2/3+0s/LJ15/LQ0 (max29.1s)/B0 |
| mountain 05 slinger candidate | 3/0/0 | 4.2s / 71 | 78/8/12 | 70.8% / 51.2%; 0 | 510.5 / 1143; Cliffside Roc direct 1875.5hp/33x/max257 + 6605.5 absorbed<br>Cragback Rhino direct 0hp/4x/max0 + 488 absorbed<br>Granite Mammoth direct 0hp/1x/max0 + 182 absorbed | 48/48 | 11 / 28 | P3/3+2s/LJ58/LQ0 (max8.5s)/B0 |
| mountain 05 slinger control | 3/0/0 | 1.2s / 163 | 163/0/0 | 75% / 56.1%; 0 | 791.5 / 1180.5; Cliffside Roc direct 2609.5hp/46x/max229.5 + 9212.5 absorbed | 89/53 | 39 / 160 | P2/3+0s/LJ2/LQ0 (max7.8s)/B0 |
| mountain 05 conduit candidate | 3/0/0 | 4.5s / 54 | 54/4/1 | 90.3% / 90.3%; 0 | 80 / 80; Cliffside Roc direct 220hp/11x/max20 + 2475 absorbed | 11/11 | 0 / 37 | P1/3+0s/LJ21/LQ0 (max11s)/B0 |
| mountain 05 conduit control | 3/0/0 | 1.9s / 120 | 120/1/0 | 90.3% / 90.3%; 0 | 100 / 140; Cliffside Roc direct 340hp/17x/max20 + 3825 absorbed | 17/17 | 6 / 117 | P1/3+0s/LJ4/LQ0 (max17.4s)/B0 |
| mountain 05 spirit candidate | 3/0/0 | 4.9s / 64 | 69/5/8 | 71.9% / 50.4%; 0 | 362.8 / 446.8; Cliffside Roc direct 809.7hp/30x/max146.9 + 6412.3 absorbed<br>Cragback Rhino direct 0hp/7x/max0 + 1484 absorbed<br>Granite Mammoth direct 0hp/6x/max0 + 1068 absorbed | 45/43 | 2 / 13 | P3/3+4s/LJ65/LQ0 (max8.2s)/B0 |
| mountain 05 spirit control | 3/0/0 | 2.1s / 176 | 176/2/0 | 71.9% / 46.2%; 0 | 282 / 410.9; Cliffside Roc direct 833.9hp/43x/max141 + 9882.1 absorbed | 91/66 | 46 / 171 | P2/3+0s/LJ7/LQ0 (max8.5s)/B0 |

### Tundra

| Cell | WE/PD/WC | Mixed clean TTK / clean targets | K/U/R | Min HP median / low; deaths | Incoming median / max; top sources | Casts started/fired | Recovery interrupts / episodes | Exposure P/3+/LJ/LQ/B |
| --- | ---: | ---: | ---: | --- | --- | ---: | ---: | --- |
| tundra 03 striker candidate | 3/0/0 | 6.8s / 67 | 67/1/0 | 63.7% / 63.4%; 0 | 6888.6 / 6926.5; Permafrost Behemoth direct 6176.7hp/59x/max191 + 5547.3 absorbed<br>Rime-Tusk Mastodon direct 5098.1hp/40x/max217 + 3806.9 absorbed<br>Glacial Dire-Bear direct 5273.2hp/42x/max204.1 + 3351.8 absorbed | 23/20 | 52 / 68 | P1/3+0s/LJ0/LQ0 (max9.3s)/B0 |
| tundra 03 striker control | 3/0/0 | 2s / 131 | 131/0/0 | 74% / 73.2%; 0 | 3642.1 / 4030.3; Permafrost Behemoth direct 4364.8hp/44x/max201.1 + 5685.2 absorbed<br>Glacial Dire-Bear direct 2151.7hp/33x/max188.9 + 5519.3 absorbed<br>Hoarfrost Yeti direct 2651hp/37x/max190 + 4256 absorbed | 0/0 | 105 / 131 | P1/3+0s/LJ0/LQ0 (max9.6s)/B0 |
| tundra 03 squire candidate | 3/0/0 | 17.3s / 27 | 27/3/0 | 79% / 78.2%; 0 | 6372.7 / 7784.7; Permafrost Behemoth direct 8584.7hp/92x/max160.3 + 7356.3 absorbed<br>Glacial Dire-Bear direct 7014hp/48x/max183 + 1355 absorbed<br>Rime-Tusk Mastodon direct 2732.5hp/29x/max190 + 2803.5 absorbed | 42/41 | 22 / 30 | P1/3+0s/LJ0/LQ0 (max7.7s)/B0 |
| tundra 03 squire control | 3/0/0 | 6.4s / 73 | 73/1/0 | 77.7% / 77.6%; 0 | 4669.9 / 4828.2; Permafrost Behemoth direct 3567.3hp/58x/max170.3 + 7169.7 absorbed<br>Glacial Dire-Bear direct 3705.5hp/36x/max184 + 3107.5 absorbed<br>Hoarfrost Yeti direct 3066.9hp/40x/max156 + 3049.1 absorbed | 36/33 | 52 / 74 | P1/3+0s/LJ0/LQ0 (max10.4s)/B0 |
| tundra 03 apprentice candidate | 3/0/0 | 6.1s / 77 | 77/1/0 | 74.9% / 69.3%; 0 | 923.9 / 1425.6; Hoarfrost Yeti direct 2953.9hp/44x/max153.9 + 4607.9 absorbed<br>Rime-Tusk Mastodon direct 0hp/2x/max0 + 416 absorbed<br>Hoarfrost Yeti debt 247hp/156x/max4 | 2/0 | 16 / 76 | P2/3+0s/LJ2/LQ0 (max11.3s)/B0 |
| tundra 03 apprentice control | 3/0/0 | 3.5s / 106 | 106/2/0 | 75.2% / 71.8%; 0 | 1726.5 / 1990.5; Hoarfrost Yeti direct 3789.8hp/56x/max152.6 + 5888.1 absorbed<br>Glacial Dire-Bear direct 8.3hp/3x/max8.3 + 598.8 absorbed<br>Permafrost Behemoth direct 108.9hp/2x/max108.9 + 281 absorbed | 0/0 | 20 / 108 | P1/3+0s/LJ0/LQ0 (max11.3s)/B0 |
| tundra 03 slinger candidate | 3/0/0 | 9.6s / 42 | 47/8/10 | 76.2% / 71.4%; 0 | 337 / 845.2; Hoarfrost Yeti direct 1490.2hp/20x/max172 + 2229.8 absorbed<br>Glacial Dire-Bear direct 8hp/8x/max1 + 1728 absorbed<br>Permafrost Behemoth direct 0hp/3x/max0 + 614 absorbed | 0/0 | 5 / 14 | P2/3+0s/LJ41/LQ0 (max8.5s)/B0 |
| tundra 03 slinger control | 3/0/0 | 3s / 137 | 137/2/0 | 63.7% / 61.2%; 0 | 301 / 397.4; Hoarfrost Yeti direct 851.4hp/37x/max183 + 6270.6 absorbed | 0/0 | 33 / 139 | P1/3+0s/LJ0/LQ0 (max7.1s)/B0 |
| tundra 03 conduit candidate | 3/0/0 | 14.6s / 14 | 15/4/3 | 75.1% / 72.3%; 0 | 313.5 / 548.1; Permafrost Behemoth direct 295.7hp/11x/max97.2 + 1930.3 absorbed<br>Rime-Tusk Mastodon direct 803.6hp/9x/max157 + 867.4 absorbed | 11/11 | 1 / 15 | P1/3+0s/LJ4/LQ0 (max9.6s)/B0 |
| tundra 03 conduit control | 3/0/0 | 4.4s / 73 | 73/2/0 | 94.1% / 94.1%; 0 | 0 / 0; Hoarfrost Yeti direct 0hp/1x/max0 + 179 absorbed | 0/0 | 1 / 75 | P1/3+0s/LJ0/LQ0 (max9.8s)/B0 |
| tundra 03 spirit candidate | 3/0/0 | 12.1s / 51 | 52/2/1 | 61.1% / 56.8%; 0 | 467.9 / 651.8; Hoarfrost Yeti direct 1192.4hp/31x/max176 + 4429.6 absorbed<br>Permafrost Behemoth direct 0hp/18x/max0 + 3747 absorbed<br>Glacial Dire-Bear direct 288.1hp/12x/max131.8 + 2255.9 absorbed | 22/14 | 15 / 37 | P2/3+0s/LJ17/LQ0 (max8.3s)/B0 |
| tundra 03 spirit control | 3/0/0 | 3.3s / 128 | 128/1/0 | 82.4% / 76.5%; 0 | 114.9 / 153; Hoarfrost Yeti direct 355.8hp/33x/max153 + 5809.3 absorbed | 0/0 | 24 / 129 | P1/3+0s/LJ0/LQ0 (max6.6s)/B0 |
| tundra 05 striker candidate | 3/0/0 | 4.5s / 80 | 80/2/0 | 75.2% / 73.3%; 0 | 4073.7 / 4510.6; Permafrost Behemoth direct 3684.2hp/63x/max191.9 + 9116.8 absorbed<br>Glacial Dire-Bear direct 4843.2hp/42x/max200 + 3984.8 absorbed<br>Rime-Tusk Mastodon direct 2390.1hp/24x/max212.9 + 3176.9 absorbed | 21/21 | 64 / 82 | P1/3+0s/LJ0/LQ0 (max8.7s)/B0 |
| tundra 05 striker control | 3/0/0 | 1.5s / 146 | 146/1/0 | 69.2% / 68.2%; 0 | 4581.3 / 4676.6; Rime-Tusk Mastodon direct 4327.9hp/40x/max245.8 + 5652.1 absorbed<br>Glacial Dire-Bear direct 3341.5hp/40x/max238 + 6067.5 absorbed<br>Permafrost Behemoth direct 2114.3hp/30x/max231.8 + 4966.7 absorbed | 0/0 | 127 / 147 | P1/3+0s/LJ0/LQ0 (max9.7s)/B0 |
| tundra 05 squire candidate | 3/0/0 | 12.2s / 41 | 41/0/0 | 79.6% / 78.8%; 0 | 4237.2 / 4367; Permafrost Behemoth direct 1702.1hp/60x/max184.7 + 8817.9 absorbed<br>Glacial Dire-Bear direct 6932.6hp/50x/max178 + 1882.3 absorbed<br>Hoarfrost Yeti direct 2646.3hp/35x/max153 + 2615.7 absorbed | 38/38 | 30 / 42 | P1/3+0s/LJ0/LQ0 (max7.8s)/B0 |
| tundra 05 squire control | 3/0/0 | 5s / 100 | 100/0/0 | 79.6% / 74.7%; 0 | 4270.8 / 4601.7; Rime-Tusk Mastodon direct 4292.1hp/43x/max219 + 4362.9 absorbed<br>Permafrost Behemoth direct 2500.7hp/42x/max153.9 + 5389.3 absorbed<br>Glacial Dire-Bear direct 3428.5hp/40x/max178 + 4343.5 absorbed | 9/7 | 82 / 101 | P1/3+0s/LJ0/LQ0 (max8.9s)/B0 |
| tundra 05 apprentice candidate | 3/0/0 | 4.2s / 90 | 90/0/0 | 81.5% / 76%; 0 | 559 / 613.1; Hoarfrost Yeti direct 1596.6hp/32x/max162 + 4002 absorbed<br>Glacial Dire-Bear direct 0hp/1x/max0 + 214 absorbed<br>Hoarfrost Yeti debt 132hp/86x/max4 | 1/1 | 15 / 90 | P1/3+0s/LJ0/LQ0 (max10.5s)/B0 |
| tundra 05 apprentice control | 3/0/0 | 2.4s / 131 | 131/1/0 | 81.5% / 65.9%; 0 | 361.3 / 565.9; Hoarfrost Yeti direct 1103.9hp/42x/max162 + 6634.4 absorbed<br>Glacial Dire-Bear direct 0hp/1x/max0 + 215 absorbed<br>Permafrost Behemoth direct 0hp/1x/max0 + 210 absorbed | 0/0 | 32 / 132 | P1/3+0s/LJ0/LQ0 (max10.1s)/B0 |
| tundra 05 slinger candidate | 3/0/0 | 6.8s / 56 | 61/5/8 | 76.8% / 76.6%; 0 | 529.4 / 633; Hoarfrost Yeti direct 1302.4hp/20x/max159 + 2268.6 absorbed<br>Glacial Dire-Bear direct 1hp/1x/max1 + 216 absorbed<br>Permafrost Behemoth direct 0hp/1x/max0 + 216 absorbed | 1/1 | 5 / 39 | P2/3+0s/LJ27/LQ0 (max7.9s)/B0 |
| tundra 05 slinger control | 3/0/0 | 1.8s / 153 | 153/1/0 | 75.2% / 58.9%; 0 | 905.4 / 1171; Hoarfrost Yeti direct 2234.4hp/45x/max180 + 6191.6 absorbed | 0/0 | 32 / 155 | P1/3+0s/LJ0/LQ0 (max7.9s)/B0 |
| tundra 05 conduit candidate | 3/0/0 | 9.3s / 46 | 46/2/0 | 94.1% / 94.1%; 0 | 0 / 0; none recorded | 0/0 | 0 / 48 | P0/3+0s/LJ0/LQ0 (max8.4s)/B0 |
| tundra 05 conduit control | 3/0/0 | 2.4s / 117 | 117/1/0 | 94.1% / 94.1%; 0 | 0 / 0; Hoarfrost Yeti direct 0hp/5x/max0 + 936 absorbed | 0/0 | 0 / 118 | P1/3+0s/LJ0/LQ0 (max9.3s)/B0 |
| tundra 05 spirit candidate | 3/0/0 | 6.8s / 76 | 76/2/0 | 100% / 75.7%; 0 | 0 / 305; Hoarfrost Yeti direct 305hp/23x/max158 + 3957 absorbed<br>Permafrost Behemoth direct 0hp/3x/max0 + 617 absorbed<br>Glacial Dire-Bear direct 0hp/2x/max0 + 419 absorbed | 9/4 | 13 / 77 | P2/3+0s/LJ1/LQ0 (max8.6s)/B0 |
| tundra 05 spirit control | 3/0/0 | 1.6s / 169 | 169/1/0 | 100% / 97.6%; 0 | 0 / 15.6; Hoarfrost Yeti direct 15.6hp/40x/max15.6 + 7534.4 absorbed | 0/0 | 33 / 170 | P1/3+0s/LJ0/LQ0 (max6.7s)/B0 |

### Desert

| Cell | WE/PD/WC | Mixed clean TTK / clean targets | K/U/R | Min HP median / low; deaths | Incoming median / max; top sources | Casts started/fired | Recovery interrupts / episodes | Exposure P/3+/LJ/LQ/B |
| --- | ---: | ---: | ---: | --- | --- | ---: | ---: | --- |
| desert 03 striker candidate | 3/0/0 | 8.2s / 98 | 98/1/0 | 51.3% / 39.4%; 0 | 12546 / 13234; Sunshield Scarab direct 30348hp/291x/max120<br>Dune Tyrant direct 6846hp/58x/max187<br>Dune Basilisk direct 536hp/44x/max14 | 76/63 | 0 / 50 | P2/3+0s/LJ49/LQ0 (max10.7s)/B0 |
| desert 03 striker control | 3/0/0 | 2.3s / 155 | 155/1/0 | 60.9% / 55.8%; 0 | 8193 / 8626; Sunshield Scarab direct 21528hp/210x/max120<br>Dune Tyrant direct 2523hp/29x/max87<br>Dune Basilisk direct 264hp/22x/max12 | 49/48 | 0 / 79 | P2/3+0s/LJ73/LQ0 (max15.6s)/B0 |
| desert 03 squire candidate | 3/0/0 | 20.6s / 49 | 49/3/0 | 73.5% / 73.5%; 0 | 9036 / 11536; Sunshield Scarab direct 22713hp/279x/max93<br>Dune Tyrant direct 5096hp/58x/max143<br>Sand Viper direct 85hp/85x/max1 | 99/95 | 0 / 29 | P2/3+0s/LJ23/LQ0 (max8s)/B0 |
| desert 03 squire control | 3/0/0 | 5.4s / 107 | 107/3/0 | 73.5% / 73.5%; 0 | 8084 / 9698; Sunshield Scarab direct 21963hp/275x/max93<br>Dune Tyrant direct 3172hp/44x/max143<br>Sand Viper direct 40hp/40x/max1 | 59/45 | 0 / 55 | P2/3+0s/LJ52/LQ0 (max16s)/B0 |
| desert 03 apprentice candidate | 3/0/0 | 5.6s / 80 | 86/3/8 | 38.8% / 38.6%; 0 | 6131.1 / 6416.5; Sunshield Scarab direct 14198.4hp/136x/max104.4<br>Dune Tyrant direct 2754hp/15x/max198<br>Sunshield Scarab debt 1267hp/625x/max9 | 34/23 | 4 / 18 | P5/3+41s/LJ73/LQ0 (max15s)/B0 |
| desert 03 apprentice control | 3/0/0 | 2.4s / 138 | 138/0/0 | 51% / 42.5%; 0 | 7840.6 / 8407.5; Sunshield Scarab direct 21193.2hp/203x/max104.4<br>Sunshield Scarab debt 1863hp/802x/max7<br>Dune Tyrant direct 90hp/1x/max90 | 2/2 | 42 / 69 | P3/3+9s/LJ67/LQ0 (max12.8s)/B0 |
| desert 03 slinger candidate | 3/0/0 | 8.8s / 37 | 56/12/29 | 53.7% / 50.4%; 0 | 3127 / 3608; Sunshield Scarab direct 8046hp/66x/max158<br>Dune Tyrant direct 758hp/5x/max262<br>Dune Basilisk direct 689hp/18x/max50 | 30/29 | 0 / 5 | P4/3+31s/LJ69/LQ0 (max10.9s)/B0 |
| desert 03 slinger control | 3/0/0 | 4.5s / 129 | 130/3/1 | 50.8% / 50.8%; 0 | 7046 / 7140; Sunshield Scarab direct 20590hp/174x/max134 | 0/0 | 0 / 61 | P2/3+0s/LJ71/LQ0 (max12.2s)/B0 |
| desert 03 conduit candidate | 3/0/0 | 31.3s / 20 | 25/11/10 | 60.7% / 46.8%; 0 | 1588 / 3342; Dune Tyrant direct 3690hp/33x/max171<br>Sunshield Scarab direct 2161hp/23x/max127<br>Dune Basilisk direct 456hp/19x/max24 | 38/37 | 0 / 3 | P3/3+12s/LJ35/LQ0 (max11.8s)/B0 |
| desert 03 conduit control | 3/0/0 | 9.9s / 52 | 58/8/11 | 55.7% / 53.4%; 0 | 2185 / 2985; Sunshield Scarab direct 5546hp/60x/max127<br>Dune Tyrant direct 1182hp/8x/max171<br>Dune Basilisk direct 432hp/18x/max24 | 26/21 | 0 / 6 | P3/3+18s/LJ65/LQ0 (max11.4s)/B0 |
| desert 03 spirit candidate | 3/0/0 | 13.9s / 53 | 63/8/16 | 38.7% / 36.9%; 0 | 1858.5 / 2188.4; Sunshield Scarab direct 2711.5hp/74x/max129 + 6857.5 absorbed<br>Dune Tyrant direct 2421.9hp/30x/max207.4 + 3023.1 absorbed<br>Dune Basilisk direct 0hp/22x/max0 + 792 absorbed | 40/35 | 0 / 4 | P4/3+37s/LJ73/LQ0 (max11.5s)/B0 |
| desert 03 spirit control | 2/1/0 | 5.7s / 77 | 80/9/8 | 65% / 0%; 196.1s | 2297.3 / 3285.2; Sunshield Scarab direct 6733.6hp/135x/max129 + 10681.4 absorbed<br>Dune Tyrant direct 629hp/6x/max113<br>Dune Basilisk direct 0hp/6x/max0 + 216 absorbed | 8/6 | 11 / 33 | P4/3+6s/LJ58/LQ0 (max11.5s)/B0 |
| desert 05 striker candidate | 3/0/0 | 8.4s / 98 | 98/2/0 | 49.4% / 40.1%; 0 | 12899 / 14087; Sunshield Scarab direct 29514hp/283x/max120<br>Dune Tyrant direct 7294hp/62x/max187<br>Dune Basilisk direct 482hp/39x/max14 | 76/65 | 0 / 51 | P2/3+0s/LJ47/LQ0 (max11.9s)/B0 |
| desert 05 striker control | 3/0/0 | 2.4s / 156 | 156/1/0 | 58.1% / 55.2%; 0 | 8145 / 8524; Sunshield Scarab direct 21816hp/213x/max120<br>Dune Tyrant direct 2262hp/26x/max87<br>Dune Basilisk direct 336hp/28x/max12 | 51/50 | 0 / 80 | P2/3+0s/LJ75/LQ0 (max14.2s)/B0 |
| desert 05 squire candidate | 3/0/0 | 20.1s / 50 | 50/2/0 | 75% / 73.5%; 0 | 10865 / 11157; Sunshield Scarab direct 22899hp/281x/max93<br>Dune Tyrant direct 6305hp/73x/max143<br>Sand Viper direct 69hp/69x/max1 | 92/84 | 0 / 28 | P2/3+0s/LJ26/LQ0 (max13s)/B0 |
| desert 05 squire control | 3/0/0 | 5.4s / 107 | 107/2/0 | 73.5% / 73.5%; 0 | 9237 / 9475; Sunshield Scarab direct 23613hp/295x/max93<br>Dune Tyrant direct 3562hp/50x/max143<br>Sand Viper direct 40hp/40x/max1 | 51/40 | 0 / 56 | P2/3+0s/LJ49/LQ0 (max12.3s)/B0 |
| desert 05 apprentice candidate | 3/0/0 | 6.8s / 75 | 82/2/8 | 38.9% / 35.1%; 0 | 5907.8 / 6207.7; Sunshield Scarab direct 13258.8hp/127x/max104.4<br>Dune Tyrant direct 3150hp/17x/max198<br>Sunshield Scarab debt 1145hp/581x/max6 | 38/21 | 5 / 17 | P4/3+20s/LJ69/LQ0 (max15.6s)/B0 |
| desert 05 apprentice control | 3/0/0 | 2.4s / 137 | 137/2/0 | 48.4% / 46.5%; 0 | 7899.3 / 8310.7; Sunshield Scarab direct 21402hp/205x/max104.4<br>Sunshield Scarab debt 1847hp/817x/max6<br>Dune Basilisk direct 124.2hp/6x/max20.7 | 10/10 | 45 / 70 | P3/3+4s/LJ65/LQ0 (max13.1s)/B0 |
| desert 05 slinger candidate | 3/0/0 | 8.7s / 30 | 52/11/31 | 51.6% / 47.1%; 0 | 3471 / 3590; Sunshield Scarab direct 7976hp/66x/max158<br>Dune Tyrant direct 1346hp/6x/max262<br>Dune Basilisk direct 773hp/20x/max50 | 32/31 | 0 / 4 | P5/3+50s/LJ64/LQ0 (max12.4s)/B0 |
| desert 05 slinger control | 3/0/0 | 4s / 131 | 131/4/0 | 51.2% / 50.8%; 0 | 6310 / 6926; Sunshield Scarab direct 19278hp/160x/max134<br>Sand Viper direct 23hp/1x/max23 | 1/1 | 0 / 71 | P2/3+0s/LJ60/LQ0 (max12.3s)/B0 |
| desert 05 conduit candidate | 3/0/0 | 30.4s / 20 | 25/8/11 | 51.9% / 29.7%; 0 | 2079 / 3800; Dune Tyrant direct 4812hp/41x/max171<br>Sunshield Scarab direct 1923hp/21x/max127<br>Dune Basilisk direct 336hp/14x/max24 | 48/46 | 0 / 3 | P5/3+31s/LJ41/LQ0 (max9.5s)/B0 |
| desert 05 conduit control | 3/0/0 | 9.3s / 57 | 64/6/11 | 57.7% / 56.9%; 0 | 2582 / 3207; Sunshield Scarab direct 5568hp/60x/max127<br>Dune Tyrant direct 2010hp/17x/max171<br>Dune Basilisk direct 240hp/10x/max24 | 24/20 | 0 / 6 | P3/3+1s/LJ68/LQ0 (max10.7s)/B0 |
| desert 05 spirit candidate | 3/0/0 | 14.4s / 49 | 54/13/13 | 47.4% / 47%; 0 | 1405.8 / 2707; Sunshield Scarab direct 2800.4hp/71x/max129 + 6381.6 absorbed<br>Dune Tyrant direct 2376.6hp/29x/max222.3 + 2955.4 absorbed<br>Dune Basilisk direct 0hp/21x/max0 + 756 absorbed | 51/44 | 0 / 3 | P3/3+17s/LJ68/LQ0 (max11.5s)/B0 |
| desert 05 spirit control | 2/1/0 | 5.7s / 76 | 81/10/11 | 46.2% / 0%; 196.1s | 1988.5 / 3285.2; Sunshield Scarab direct 6386.1hp/128x/max129 + 10125.9 absorbed<br>Dune Tyrant direct 694hp/7x/max113 + 185 absorbed<br>Dune Basilisk direct 0hp/4x/max0 + 144 absorbed | 10/7 | 10 / 32 | P4/3+10s/LJ63/LQ0 (max11.6s)/B0 |

## Exact player-death review

There were five player deaths, all ordinary `player-died` outcomes and none a wall ceiling. The three Mountain deaths were candidate arm, node03 only; the two Desert deaths were Spirit control, seed 38011, one at each node. Trench and Tundra had no player death. The death rows below keep the 10-second and 30-second pre-death windows separate and report applied and absorbed pressure.

### dur22-mountain-03-conduit-candidate / seed 38011

Outcome: player-died at 156.6s; minimum HP fraction 0%; kills before death 5; damaged target records 8; unfinished/censored 3; observed regain 1.
Terminal cause: melee from Cliffside Roc (cliffside-roc), 124 damage. Final episode: 73.1s–156.6s (83.5s), 1 initial member(s), 5 total member(s), 4 late joiner(s).
Final 10s incoming: Cliffside Roc direct 869hp/7x/max177 + 225 absorbed.
Final 30s incoming: Cliffside Roc direct 1013hp/9x/max177 + 450 absorbed.
Last-30s monster casts started/fired: 3/3 (Skyfall Rend). Terminal incoming events: Cliffside Roc direct 124hp @156.3s; Cliffside Roc direct 124hp @156.6s.
Recovery entries: 4; interrupted by next pull: 0.

### dur22-mountain-03-spirit-candidate / seed 42013

Outcome: player-died at 22.1s; minimum HP fraction 0%; kills before death 0; damaged target records 3; unfinished/censored 3; observed regain 0.
Terminal cause: melee from Cliffside Roc (cliffside-roc), 174 damage. Final episode: 0.6s–22.1s (21.5s), 1 initial member(s), 3 total member(s), 2 late joiner(s).
Final 10s incoming: Cliffside Roc direct 773hp/5x/max251 + 251 absorbed; Cragback Rhino direct 102hp/1x/max102 + 110 absorbed.
Final 30s incoming: Cliffside Roc direct 773hp/5x/max251 + 251 absorbed; Cragback Rhino direct 102hp/1x/max102 + 110 absorbed.
Last-30s monster casts started/fired: 2/2 (Skyfall Rend). Terminal incoming events: Cliffside Roc direct 174hp @21.2s; Cliffside Roc direct 174hp @22.1s.
Recovery entries: 0; interrupted by next pull: 0.

### dur22-mountain-03-striker-candidate / seed 42013

Outcome: player-died at 255s; minimum HP fraction 0%; kills before death 25; damaged target records 27; unfinished/censored 2; observed regain 0.
Terminal cause: melee from Granite Mammoth (granite-mammoth), 211 damage. Final episode: 247.4s–255s (7.6s), 2 initial member(s), 3 total member(s), 1 late joiner(s).
Final 10s incoming: Granite Mammoth direct 520.5hp/3x/max211 + 112.5 absorbed; Cliffside Roc direct 515hp/2x/max311; Avalanche Tyrant direct 152hp/1x/max152.
Final 30s incoming: Granite Mammoth direct 961.5hp/7x/max211 + 612.5 absorbed; Cliffside Roc direct 515hp/2x/max311; Avalanche Tyrant direct 152hp/1x/max152.
Last-30s monster casts started/fired: 2/2 (Granite Barrier, Skyfall Rend). Terminal incoming events: Granite Mammoth direct 211hp @255s.
Recovery entries: 23; interrupted by next pull: 17.

### dur22-desert-03-spirit-control / seed 38011

Outcome: player-died at 196.1s; minimum HP fraction 0%; kills before death 12; damaged target records 17; unfinished/censored 5; observed regain 6.
Terminal cause: ranged from Sunshield Scarab (sandspitter-cobra), 129 damage. Final episode: 137.1s–196.1s (59s), 1 initial member(s), 8 total member(s), 7 late joiner(s).
Final 10s incoming: Sunshield Scarab direct 516hp/4x/max129; Dune Tyrant direct 403hp/4x/max113.
Final 30s incoming: Sunshield Scarab direct 782.3hp/8x/max129 + 249.8 absorbed; Dune Tyrant direct 403hp/4x/max113.
Last-30s monster casts started/fired: 0/0. Terminal incoming events: Dune Tyrant direct 113hp @195.2s; Dune Tyrant direct 113hp @195.7s; Dune Tyrant direct 64hp @196.1s; Sunshield Scarab direct 129hp @196.1s.
Recovery entries: 2; interrupted by next pull: 2.

### dur22-desert-05-spirit-control / seed 38011

Outcome: player-died at 196.1s; minimum HP fraction 0%; kills before death 12; damaged target records 17; unfinished/censored 5; observed regain 6.
Terminal cause: ranged from Sunshield Scarab (sandspitter-cobra), 129 damage. Final episode: 137.1s–196.1s (59s), 1 initial member(s), 8 total member(s), 7 late joiner(s).
Final 10s incoming: Sunshield Scarab direct 516hp/4x/max129; Dune Tyrant direct 403hp/4x/max113.
Final 30s incoming: Sunshield Scarab direct 782.3hp/8x/max129 + 249.8 absorbed; Dune Tyrant direct 403hp/4x/max113.
Last-30s monster casts started/fired: 0/0. Terminal incoming events: Dune Tyrant direct 113hp @195.2s; Dune Tyrant direct 113hp @195.7s; Dune Tyrant direct 64hp @196.1s; Sunshield Scarab direct 129hp @196.1s.
Recovery entries: 2; interrupted by next pull: 2.

Mountain candidate death interpretation: the spirit death at 22.1s was a short stacked Roc/Rhino pressure case with two Skyfall Rend casts, while the Conduit death at 156.6s accumulated a 83.5s final multi-target episode, four late joiners, and terminal Cliffside Roc direct hits after three fired Skyfall Rend casts. The Striker death at 255.0s followed 25 kills; the final 10s combined Granite Mammoth, Cliffside Roc, and Avalanche Tyrant damage, and the terminal hit was an existing Granite Mammoth melee hit. These are three node03 candidate pressure cases, not a repeated single-species attack defect.

Desert control interpretation: both Spirit control deaths are the same seed at 196.1s, with a 59.0s final episode that grew to eight members and seven late joiners. Final pressure was Sunshield Scarab plus Dune Tyrant direct damage; no monster cast fired in the final 30 seconds. The death marker was the Scarab ranged hit, while the Tyrant contributed concurrent terminal pressure. Because neither death is a candidate arm, this does not support a candidate HP rollback or Desert-wide attack change.

There was no new Trench/Tundra candidate failure to inspect at 10s/30s. Longer successful arms naturally accumulate more incoming damage and late-joiner exposure; that fact alone is not regression. The meaningful failure signal here is the narrow three-run Mountain node03 candidate cluster, which is not sufficient for an automatic biome-wide nerf or attack compensation.

## Finite species-level recommendation for this proposed package

Disposition vocabulary: retain means the tested overlay remains a provisional planner candidate with no production adoption; inconclusive means this packet does not justify a further numeric change for that species, while retaining the raw evidence for a separate scoped review. No row below authorizes a source edit.
| Biome | Species | Disposition | Evidence-based reading | Boundary / next use |
| --- | --- | --- | --- | --- |
| Trench | Elder Leviathan | retain provisional | 62.1s representative candidate median; 40–60s goal is close, with Squire/Conduit tails and 26 unfinished candidate target records | Do not lower body HP from the tail; audit Conduit delivery/Carapace interaction separately |
| Trench | Abyssal Serpent | retain provisional | 48.7s representative candidate median; the broad 19.4–191.8s class range preserves specialization | No blanket attack or class change; keep candidate HP overlay as a planner input |
| Trench | Hadal Stalker | retain provisional | 38.0s representative candidate median after x6, with 2/12 cells in the 40–60s band and one >90s tail | Near-goal body pacing; do not force an HP floor without separating approach and multi-target episodes |
| Mountain | Granite Mammoth | inconclusive | 13.4s candidate median; three Mountain deaths were mixed-pack node03 pressure and do not isolate Mammoth body durability | No additional plating or attack change from this packet; keep the x6 body overlay separate from death-pressure review |
| Mountain | Cragback Rhino | inconclusive | 16.0s candidate median with a 68.9s Conduit node03 tail and mixed-pack candidate deaths | Do not promote a further multiplier from this run; keep armored-elite question separate |
| Mountain | Avalanche Tyrant | retain provisional | 3.5s candidate median as a shorter auxiliary threat under the x2 overlay | No change indicated; retain its shorter role |
| Mountain | Cliffside Roc | retain provisional | 3.5s candidate median; Roc appears as a pressure source in deaths but not as a repeated body-duration failure | Review existing attack/cast pressure separately; no HP or attack patch here |
| Tundra | Permafrost Behemoth | inconclusive | 18.7s candidate median with a 92.7s outlier and 15 unfinished candidate target records, but zero player deaths | Do not promote or reduce from selected tails; keep the apex question separate |
| Tundra | Glacial Dire-Bear | retain provisional | 8.8s candidate median with fixed Ice Armor/self-shatter products preserved and zero player deaths | No further shield/body translation; preserve absolute-defense semantics |
| Tundra | Rime-Tusk Mastodon | retain provisional | 6.8s candidate median and zero player deaths under x3 | No change indicated in this packet |
| Tundra | Hoarfrost Yeti | retain provisional | 4.0s candidate median as the shorter control-caster role under x2 | No change indicated in this packet |
| Desert | Sand Viper | retain provisional | 9.8s candidate median under x3; candidate deaths were absent and controller durability increased without changing Scarab | No biome-wide attack change; keep fragile dealer distinct |
| Desert | Dune Basilisk | retain provisional | 13.2s candidate median under x3; no candidate player death isolated to Basilisk | No extra HP or attack action from this packet |
| Desert | Dune Tyrant | retain provisional | 18.5s candidate median under x4; two Spirit control deaths had concurrent Tyrant pressure but were not candidate failures | Review controller pressure only if repeated outside this packet |
| Desert | Sunshield Scarab | retain unchanged | 2.5s candidate median because it stayed at 569 base HP; Scarab was the terminal source in both Desert control deaths | Keep dealer fragile as packet specified; no Scarab nerf or buff from two control deaths |

### Attack-compensation decision

No attack compensation is proposed. The Mountain candidate deaths are few, node03-local, and sourced by a changing multi-target pack (Roc/Rhino/Mammoth/Tyrant); the Desert deaths are control-arm Spirit traces. No repeated candidate-specific attacker or loss of practical counterplay was isolated across the matrix. Preserve attack, cast cadence, plating, damage reduction, pack composition, and ambient multipliers exactly as tested.

No source balance patch, class/ability tuning, extra experiment, release claim, or production adoption follows. Other T4 biome decisions and outstanding Jungle performance remain separate workstreams. A targeted Conduit delivery/engagement audit, if later authorized, must remain separate from the species HP overlay and must not require another entire survey solely to normalize one class.

## Raw artifacts

- [operator packet](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-durability22-operator-packet.md>)
- [batch manifest](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/batch-manifest.json>)
- [batch ended marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/batch-ended.json>)
- [operator exit marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/operator-exit.json>)
- [operator ledger](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/operator-ledger.jsonl>)
- [results root](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results>)
- [Trench index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/trench/index.json>); [Trench Night5 audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/trench/night5-audit.json>); [Trench verification](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/trench/verification.json>); [Trench complete marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/trench/complete.json>)
- [Mountain index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/mountain/index.json>); [Mountain Night5 audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/mountain/night5-audit.json>); [Mountain verification](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/mountain/verification.json>); [Mountain complete marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/mountain/complete.json>)
- [Tundra index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/tundra/index.json>); [Tundra Night5 audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/tundra/night5-audit.json>); [Tundra verification](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/tundra/verification.json>); [Tundra complete marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/tundra/complete.json>)
- [Desert index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/desert/index.json>); [Desert Night5 audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/desert/night5-audit.json>); [Desert verification](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/desert/verification.json>); [Desert complete marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/results/desert/complete.json>)
- [detached frozen source checkout](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917/source>)
- [Durability22 preparation receipts](<C:/Users/osaif/AppData/Local/mmo-idle/validation/durability22>)
- [hitbox input](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>)

The raw result tree contains all manifests, audits, verification logs, complete markers, summaries, event streams, sample streams, and 288 run directories. This report is an interpretation layer; the retained raw artifacts remain authoritative and synthetic evidence is not live gameplay proof.

Report generated from the packet-defined frozen results and read-only raw-event audit. No production source or balance data was edited by the experiment.


## Planner interpretation — eligible headline medians (2026-09-17)

Recomputed from night5-audit.json with inconclusive cells (<2 eligible seeds)
excluded: Trench candidate Leviathan57.75s, Serpent48.7s, Stalker34.95s;
Tundra Behemoth17.1s. The earlier62.1/38.0/18.7 summaries include sparse cells.
Keep those individual measurements as inconclusive, not primary headline medians.
The planner retains all14 candidate packages for the initial consolidated mob
patch review, including Mammoth/Rhino/Behemoth, with explicit Mountain03 and
class-tail watch items. This recommendation is not production adoption. Source
attack compensation is not proposed. See Durability23 for remaining biome work.
