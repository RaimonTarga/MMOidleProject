# MMO Idle Monster Balance Packet - Biome Tier 4

Generated from `tools/mob-report.ts --llm-packet`. Markdown only. Companion to the DPS and eHP packets.

## Assumptions / Omissions

- Player model: weapon, armour, charm and mobility only, plus skill nodes, item upgrades and class affinities. NO core, relic, rune, rite, stance or ability is equipped — the bench bots carry all six, so these numbers are comparable to each other but NOT to bench output in absolute terms.

**Read the Walk first.** It is the only section that measures each biome against the
player who actually arrives there. Everything below it is detail for a biome the Walk
already told you to look at.

- Monster-centric: subject is the world's offence and durability, bucketed by biome tier 4.
- Reference players are tier 4 (a player of tier P fights biome tier P-1); **no tier-5 gear authored yet, best-available T4 used as the reference**. Defensive stats are averaged over spec-agnostic class builds × armor × recovery.
- Reference player DPS uses shared `estimatePlayerDps` across concrete class builds, including full Conduit formations. T3 specialization, abilities, target-state mechanics, and shields/soft-caps remain outside this planning TTK; cross-check the detailed DPS packet for spec-level clear speed.
- TTL = player maxHP ÷ incoming DPS with **no player recovery** (that lives in the eHP packet). Incoming DPS folds plating/DR/averaged evasion; player DoT-resistance is not applied here.
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 28 mobs; tier avg HP 7609, avg total DPS 67.1.

## The Walk

_Each biome measured against the player who actually arrives there, in authored ladder order. Arrival gear is DERIVED: Global Mastery accrues as you master each biome, and GM is the only gate on upgrade level, so the ladder walks +0 to +4. "Cost/kill" is the share of your health pool one average kill spends — it folds offence and defence into one number. "Step" is this rung's cost divided by the previous rung's: 1.0 means the biome got no harder once your own growth is counted. Labels flag extremes for investigation; they are not pass/fail gates._

| # | Biome | Arrive with | GM | Mob TTK | Your TTL | Worst hit %HP | Cost/kill | Step |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Mountain | T4 +0 | 114 | 29.8s | 17.3s | 30.0% (Granite Mammoth) | 172% | - | baseline |
| 2 | Jungle | T4 +0 | 120 | 32.1s | 16.2s | 15.8% (Emerald Constrictor) | 198% | 1.15x | ok |
| 3 | Desert | T4 +1 | 126 | 32.1s | 17.1s | 36.4% (Dune Tyrant) | 188% | 0.95x | flat |
| 4 | Tundra | T4 +2 | 132 | 19.0s | 12.0s | 49.2% (Permafrost Behemoth) | 158% | 0.84x | EASIER |
| 5 | Volcanic | T4 +2 | 138 | 11.1s | 11.8s | 16.5% (Magma Salamander) | 94.2% | 0.60x | EASIER |
| 6 | Wasteland | T4 +3 | 144 | 7.49s | 10.8s | 10.5% (Plague Hound) | 69.6% | 0.74x | EASIER |
| 7 | Deep-Sea Trench | T4 +4 | 150 | 159s | 12.2s | 41.3% (Elder Leviathan) | 1301% | 18.7x | WALL |

## Walls & Stalls

_Only the rungs that break the pattern. Everything absent from this table walked cleanly._

| Biome | Signal | Detail |
| --- | --- | --- |
| Desert | No progression | cost/kill is 0.95x the previous rung — the climb stalls here |
| Tundra | No progression | cost/kill is 0.84x the previous rung — the climb stalls here |
| Tundra | Low TTL | 12.0s to die under mean pressure (no recovery modelled) |
| Volcanic | No progression | cost/kill is 0.60x the previous rung — the climb stalls here |
| Volcanic | Low TTL | 11.8s to die under mean pressure (no recovery modelled) |
| Wasteland | No progression | cost/kill is 0.74x the previous rung — the climb stalls here |
| Wasteland | Low TTL | 10.8s to die under mean pressure (no recovery modelled) |
| Deep-Sea Trench | Difficulty wall | cost/kill jumps 18.7x over the previous rung |
| Deep-Sea Trench | Low TTL | 12.2s to die under mean pressure (no recovery modelled) |


## Arrival Players

_Derived, not assumed: GM accrues per biome mastered and gates upgrade level, so the ladder walks +0 to +4._

| # | Arrive at | Gear | GM | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Mountain | T4 +0 | 114 | 545 | 6.73 | 27.2% | 9.82% | 179 | 0.90 |
| 2 | Jungle | T4 +0 | 120 | 545 | 6.73 | 27.2% | 9.82% | 179 | 0.90 |
| 3 | Desert | T4 +1 | 126 | 586 | 7.14 | 27.3% | 9.97% | 207 | 0.90 |
| 4 | Tundra | T4 +2 | 132 | 626 | 7.86 | 27.3% | 10.1% | 234 | 0.90 |
| 5 | Volcanic | T4 +2 | 138 | 626 | 7.86 | 27.3% | 10.1% | 234 | 0.90 |
| 6 | Wasteland | T4 +3 | 144 | 667 | 8.47 | 27.4% | 10.2% | 261 | 0.90 |
| 7 | Deep-Sea Trench | T4 +4 | 150 | 707 | 9.20 | 27.5% | 10.4% | 288 | 0.90 |


---

## Detail

_Fixed-reference views, kept for cross-biome comparison at one power level. These do NOT account for the walk — read them only after the Walk has pointed you at a biome._

## Boss / Elite Table

_Bosses for biome tier 4 vs the boss-ready reference player (T4 +3). TTK uses the shared class-aware planning estimator; T3 specs, abilities, and shields/soft-caps remain unmodeled. TTL is player survival with no recovery modeled._

| Boss | Biome | HP | Attack profile | Raw DPS | Spike | Defenses | Expected TTK | Player TTL | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Elder Trench Serpent | Deep-Sea Trench | 68910 | 143 @ 0.31 aps | 44.7 | ×1.00 | plate 20.0, DR 40.0% | 394s | 23.5s | Safe | TTK slog |
| Dune-Throne Sovereign | Desert | 71080 | 185 @ 0.36 aps | 66.1 | ×1.00 | plate 8.00, DR 35.0% | 357s | 15.7s | Risky | TTK slog |
| Verdant-Crown Predator | Jungle | 112570 | 117 @ 0.71 aps | 83.6 | ×1.20 | plate 0.00, DR 8.00% | 399s | 12.7s | Risky | TTK slog |
| Iron-Crest Titan | Mountain | 73140 | 228 @ 0.24 aps | 54.3 | ×1.00 | plate 28.0, DR 15.0% | 324s | 18.9s | Risky | TTK slog |
| Glacial Patriarch | Tundra | 90450 | 189 @ 0.22 aps | 42.0 | ×1.00 | plate 32.0, DR 18.0% | 423s | 24.7s | Safe | TTK slog |
| Caldera Sovereign | Volcanic | 74130 | 130 @ 0.38 aps | 50.0 | ×1.00 | plate 10.0, DR 35.0% | 376s | 21.0s | Safe | TTK slog |
| Charnel-Crown Sovereign | Wasteland | 42000 | 115 @ 0.43 aps | 50.0 | ×1.00 | plate 14.0, DR 25.0% | 192s | 21.1s | Safe | TTK slog |

## Mob / Boss Diagnostic Signals

_Attention signals only: mobs >±25% of biome-tier average on HP / raw DPS / spike, bosses outside the TTK/TTL observation bands, and narrow biome threat profiles. These are not verdicts or balance gates._

| Flag | Subject | Detail |
| --- | --- | --- |
| HP > +25% tier avg | Abyssal Serpent | 32800 vs avg 7609 (×4.31) |
| Raw DPS > +25% tier avg | Abyssal Serpent | 94.3 vs avg 59.0 (×1.60) |
| Spike > +25% tier avg | Abyssal Serpent | 380 vs avg 172 (×2.20) |
| HP > +25% tier avg | Hadal Stalker | 34500 vs avg 7609 (×4.53) |
| Raw DPS > +25% tier avg | Hadal Stalker | 79.5 vs avg 59.0 (×1.35) |
| Spike > +25% tier avg | Hadal Stalker | 350 vs avg 172 (×2.03) |
| HP > +25% tier avg | Elder Leviathan | 31800 vs avg 7609 (×4.18) |
| Raw DPS > +25% tier avg | Elder Leviathan | 82.7 vs avg 59.0 (×1.40) |
| Spike > +25% tier avg | Elder Leviathan | 420 vs avg 172 (×2.44) |
| HP < -25% tier avg | Sand Viper | 4029 vs avg 7609 (×0.53) |
| Spike < -25% tier avg | Sand Viper | 78.0 vs avg 172 (×0.45) |
| Raw DPS < -25% tier avg | Dune Basilisk | 38.5 vs avg 59.0 (×0.65) |
| Spike < -25% tier avg | Dune Basilisk | 90.0 vs avg 172 (×0.52) |
| Spike > +25% tier avg | Dune Tyrant | 308 vs avg 172 (×1.79) |
| HP < -25% tier avg | Hunting Panther | 2400 vs avg 7609 (×0.32) |
| Raw DPS < -25% tier avg | Hunting Panther | 43.3 vs avg 59.0 (×0.73) |
| Spike < -25% tier avg | Hunting Panther | 91.0 vs avg 172 (×0.53) |
| HP > +25% tier avg | Apex Silverback | 10000 vs avg 7609 (×1.31) |
| Raw DPS < -25% tier avg | Apex Silverback | 42.8 vs avg 59.0 (×0.73) |
| Spike < -25% tier avg | Apex Silverback | 77.0 vs avg 172 (×0.45) |
| HP < -25% tier avg | Thornback Chameleon | 2500 vs avg 7609 (×0.33) |
| Raw DPS < -25% tier avg | Thornback Chameleon | 34.7 vs avg 59.0 (×0.59) |
| Spike < -25% tier avg | Thornback Chameleon | 52.0 vs avg 172 (×0.30) |
| HP > +25% tier avg | Emerald Constrictor | 12000 vs avg 7609 (×1.58) |
| HP > +25% tier avg | Granite Mammoth | 13800 vs avg 7609 (×1.81) |
| Spike > +25% tier avg | Granite Mammoth | 235 vs avg 172 (×1.36) |
| HP < -25% tier avg | Avalanche Tyrant | 1600 vs avg 7609 (×0.21) |
| HP < -25% tier avg | Cliffside Roc | 1700 vs avg 7609 (×0.22) |
| Raw DPS < -25% tier avg | Cliffside Roc | 40.9 vs avg 59.0 (×0.69) |
| Raw DPS < -25% tier avg | Cragback Rhino | 37.2 vs avg 59.0 (×0.63) |
| Spike > +25% tier avg | Cragback Rhino | 225 vs avg 172 (×1.30) |
| HP < -25% tier avg | Rime-Tusk Mastodon | 3300 vs avg 7609 (×0.43) |
| Spike > +25% tier avg | Rime-Tusk Mastodon | 230 vs avg 172 (×1.33) |
| HP < -25% tier avg | Glacial Dire-Bear | 4884 vs avg 7609 (×0.64) |
| Spike > +25% tier avg | Glacial Dire-Bear | 220 vs avg 172 (×1.28) |
| HP < -25% tier avg | Hoarfrost Yeti | 1800 vs avg 7609 (×0.24) |
| Raw DPS > +25% tier avg | Hoarfrost Yeti | 79.2 vs avg 59.0 (×1.34) |
| Spike > +25% tier avg | Hoarfrost Yeti | 228 vs avg 172 (×1.32) |
| Raw DPS > +25% tier avg | Permafrost Behemoth | 90.4 vs avg 59.0 (×1.53) |
| Spike > +25% tier avg | Permafrost Behemoth | 440 vs avg 172 (×2.55) |
| HP < -25% tier avg | Ember Skink | 720 vs avg 7609 (×0.09) |
| Spike < -25% tier avg | Ember Skink | 60.0 vs avg 172 (×0.35) |
| HP < -25% tier avg | Infernal Direhound | 1750 vs avg 7609 (×0.23) |
| Raw DPS > +25% tier avg | Infernal Direhound | 78.6 vs avg 59.0 (×1.33) |
| Spike < -25% tier avg | Infernal Direhound | 110 vs avg 172 (×0.64) |
| HP < -25% tier avg | Obsidian Tortoise | 4488 vs avg 7609 (×0.59) |
| Raw DPS < -25% tier avg | Obsidian Tortoise | 33.3 vs avg 59.0 (×0.57) |
| Spike < -25% tier avg | Obsidian Tortoise | 100 vs avg 172 (×0.58) |
| HP < -25% tier avg | Ashspitter Salamander | 1550 vs avg 7609 (×0.20) |
| Spike < -25% tier avg | Ashspitter Salamander | 95.0 vs avg 172 (×0.55) |
| HP < -25% tier avg | Bone Crawler | 1235 vs avg 7609 (×0.16) |
| Spike < -25% tier avg | Bone Crawler | 85.0 vs avg 172 (×0.49) |
| HP < -25% tier avg | Plague Hound | 1901 vs avg 7609 (×0.25) |
| Spike < -25% tier avg | Plague Hound | 105 vs avg 172 (×0.61) |
| HP < -25% tier avg | Carrion Vulture | 1616 vs avg 7609 (×0.21) |
| Spike < -25% tier avg | Carrion Vulture | 95.0 vs avg 172 (×0.55) |
| HP < -25% tier avg | Bone Rat | 950 vs avg 7609 (×0.12) |
| Spike < -25% tier avg | Bone Rat | 65.0 vs avg 172 (×0.38) |
| HP < -25% tier avg | Gravewright | 5702 vs avg 7609 (×0.75) |
| Spike < -25% tier avg | Gravewright | 90.0 vs avg 172 (×0.52) |
| biome single-type | Deep-Sea Trench | 100% Direct damage |
| biome single-type | Desert | 100% Direct damage |
| biome single-type | Mountain | 100% Direct damage |
| biome single-type | Tundra | 100% Direct damage |
| biome single-type | Wasteland | 80% Direct damage |

## Mob Stat Summary

_Every non-boss spawn in biome tier 4, sorted by raw total DPS within each biome. Raw DPS is pre-mitigation (attack × APS); DoT/s assumes full refreshed stacks._

| Biome | Mob | Role | HP | Attack | APS / CD | Raw DPS | DoT/s | Plating | DR | Range | Speed | Spike | Specials |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deep-Sea Trench | Abyssal Serpent | Spiker | 32800 | 190 | 0.36 / 2800ms | 94.3 | 0.00 | 18.0 | 35.0% | 15.0 | 28.0 | ×2.00 | - |
| Deep-Sea Trench | Elder Leviathan | Spiker | 31800 | 210 | 0.28 / 3600ms | 82.7 | 0.00 | 22.0 | 40.0% | 15.0 | 20.0 | ×2.00 | - |
| Deep-Sea Trench | Hadal Stalker | Spiker | 34500 | 175 | 0.29 / 3400ms | 79.5 | 0.00 | 20.0 | 30.0% | 240 | 22.0 | ×2.00 | - |
| Desert | Dune Tyrant | Spiker | 6952 | 140 | 0.29 / 3500ms | 63.2 | 0.00 | 8.00 | 8.00% | 15.0 | 20.0 | ×2.20 | slow ×0.40 |
| Desert | Sand Viper | Bruiser | 4029 | 78.0 | 0.42 / 2400ms | 53.1 | 0.00 | 0.00 | 8.00% | 12.0 | 28.0 | ×1.00 | - |
| Desert | Dune Basilisk | Tank | 9006 | 90.0 | 0.33 / 3000ms | 38.5 | 0.00 | 10.0 | 14.0% | 15.0 | 26.0 | ×1.00 | - |
| Jungle | Emerald Constrictor | Spiker | 12000 | 66.0 | 0.63 / 1600ms | 51.6 | 25.0 | 0.00 | 0.00% | 12.0 | 62.0 | ×2.00 | dot 25.0/s×5, cadence 4→×2.00 |
| Jungle | Hunting Panther | Bruiser | 2400 | 52.0 | 0.83 / 1200ms | 43.3 | 0.00 | 0.00 | 0.00% | 12.0 | 82.0 | ×1.75 | - |
| Jungle | Apex Silverback | Bruiser | 10000 | 77.0 | 0.56 / 1800ms | 42.8 | 0.00 | 0.00 | 0.00% | 12.0 | 54.0 | ×1.00 | charge ×2.80 |
| Jungle | Thornback Chameleon | Bruiser | 2500 | 52.0 | 0.67 / 1500ms | 34.7 | 0.00 | 0.00 | 0.00% | 200 | 50.0 | ×1.00 | - |
| Mountain | Avalanche Tyrant | Bruiser | 1600 | 116 | 0.40 / 2500ms | 60.9 | 0.00 | 0.00 | 0.00% | 12.0 | 42.0 | ×1.50 | charge ×2.80 |
| Mountain | Granite Mammoth | Bruiser | 13800 | 147 | 0.28 / 3600ms | 47.0 | 0.00 | 0.00 | 0.00% | 15.0 | 16.0 | ×1.60 | cadence 4→×1.60, charge ×2.50 |
| Mountain | Cliffside Roc | Bruiser | 1700 | 143 | 0.29 / 3500ms | 40.9 | 0.00 | 0.00 | 0.00% | 12.0 | 105 | ×1.00 | - |
| Mountain | Cragback Rhino | Spiker | 6600 | 90.0 | 0.26 / 3800ms | 37.2 | 0.00 | 16.0 | 6.00% | 15.0 | 14.0 | ×2.50 | cooldown 10.0s→×2.50, softcap 25.0%×0.50, charge ×2.20 |
| Tundra | Permafrost Behemoth | Spiker | 7656 | 220 | 0.25 / 4000ms | 90.4 | 0.00 | 20.0 | 12.0% | 15.0 | 12.0 | ×2.00 | charge ×2.00 |
| Tundra | Hoarfrost Yeti | Bruiser | 1800 | 190 | 0.34 / 2900ms | 79.2 | 0.00 | 0.00 | 8.00% | 220 | 36.0 | ×1.20 | - |
| Tundra | Glacial Dire-Bear | Bruiser | 4884 | 220 | 0.31 / 3200ms | 68.8 | 0.00 | 0.00 | 14.0% | 15.0 | 18.0 | ×1.00 | shield 5.50%/12.0s |
| Tundra | Rime-Tusk Mastodon | Tank | 3300 | 230 | 0.29 / 3500ms | 65.7 | 0.00 | 12.0 | 0.00% | 15.0 | 18.0 | ×1.00 | charge ×2.30 |
| Volcanic | Ashspitter Salamander | DoT | 1550 | 95.0 | 0.53 / 1900ms | 50.0 | 60.0 | 2.00 | 0.00% | 190 | 46.0 | ×1.00 | dot 60.0/s×5 |
| Volcanic | Infernal Direhound | Bruiser | 1750 | 110 | 0.71 / 1400ms | 78.6 | 0.00 | 4.00 | 0.00% | 12.0 | 72.0 | ×1.00 | charge ×2.50 |
| Volcanic | Ember Skink | Bruiser | 720 | 60.0 | 0.77 / 1300ms | 46.2 | 32.0 | 2.00 | 0.00% | 12.0 | 70.0 | ×1.00 | dot 32.0/s×4 |
| Volcanic | Magma Salamander | Bruiser | 5808 | 150 | 0.38 / 2600ms | 57.7 | 0.00 | 6.00 | 6.00% | 15.0 | 22.0 | ×1.00 | - |
| Volcanic | Obsidian Tortoise | Tank | 4488 | 100 | 0.33 / 3000ms | 33.3 | 0.00 | 8.00 | 0.00% | 15.0 | 20.0 | ×1.00 | - |
| Wasteland | Plague Hound | DoT | 1901 | 105 | 0.67 / 1500ms | 70.0 | 109 | 0.00 | 0.00% | 12.0 | 70.0 | ×1.00 | dot 109/s×5, charge ×2.50 |
| Wasteland | Bone Crawler | Bruiser | 1235 | 85.0 | 0.83 / 1200ms | 70.8 | 0.00 | 0.00 | 0.00% | 12.0 | 78.0 | ×1.00 | - |
| Wasteland | Bone Rat | Bruiser | 950 | 65.0 | 1.05 / 950ms | 68.4 | 0.00 | 0.00 | 0.00% | 12.0 | 92.0 | ×1.00 | - |
| Wasteland | Carrion Vulture | Bruiser | 1616 | 95.0 | 0.59 / 1700ms | 55.9 | 0.00 | 0.00 | 0.00% | 200 | 46.0 | ×1.00 | - |
| Wasteland | Gravewright | Bruiser | 5702 | 90.0 | 0.53 / 1900ms | 47.4 | 0.00 | 0.00 | 0.00% | 200 | 40.0 | ×1.00 | - |
