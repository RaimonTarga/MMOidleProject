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
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 28 mobs; tier avg HP 1788, avg total DPS 117.

## The Walk

_Each biome measured against the player who actually arrives there, in authored ladder order. Arrival gear is DERIVED: Global Mastery accrues as you master each biome, and GM is the only gate on upgrade level, so the ladder walks +0 to +4. "Cost/kill" is the share of your health pool one average kill spends — it folds offence and defence into one number. "Step" is this rung's cost divided by the previous rung's: 1.0 means the biome got no harder once your own growth is counted. Labels flag extremes for investigation; they are not pass/fail gates._

| # | Biome | Arrive with | GM | Mob TTK | Your TTL | Worst hit %HP | Cost/kill | Step |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Mountain | T4 +0 | 126 | 4.37s | 7.55s | 84.0% (Granite Mammoth) | 57.9% | - | baseline |
| 2 | Jungle | T4 +0 | 135 | 5.69s | 14.6s | 17.6% (Emerald Constrictor) | 38.9% | 0.67x | EASIER |
| 3 | Desert | T4 +1 | 145 | 8.67s | 9.03s | 131% (Dune Tyrant) | 96.0% | 2.47x | WALL |
| 4 | Tundra | T4 +2 | 154 | 5.96s | 3.67s | 203% (Permafrost Behemoth) | 162% | 1.69x | ok |
| 5 | Volcanic | T4 +2 | 164 | 7.89s | 3.90s | 105% (Obsidian Tortoise) | 202% | 1.25x | ok |
| 6 | Wasteland | T4 +3 | 173 | 9.32s | 4.97s | 33.9% (Plague Hound) | 187% | 0.93x | EASIER |
| 7 | Deep-Sea Trench | T4 +4 | 183 | 19.5s | 3.04s | 186% (Elder Leviathan) | 642% | 3.42x | WALL |

## Walls & Stalls

_Only the rungs that break the pattern. Everything absent from this table walked cleanly._

| Biome | Signal | Detail |
| --- | --- | --- |
| Mountain | Heavy spike | Granite Mammoth hits for 84.0% of maxHP |
| Mountain | Low TTL | 7.55s to die under mean pressure (no recovery modelled) |
| Jungle | No progression | cost/kill is 0.67x the previous rung — the climb stalls here |
| Jungle | Low TTL | 14.6s to die under mean pressure (no recovery modelled) |
| Desert | Difficulty wall | cost/kill jumps 2.47x over the previous rung |
| Desert | One-shot | Dune Tyrant hits for 131% of the arrival player's maxHP |
| Desert | Low TTL | 9.03s to die under mean pressure (no recovery modelled) |
| Tundra | One-shot | Permafrost Behemoth hits for 203% of the arrival player's maxHP |
| Tundra | Low TTL | 3.67s to die under mean pressure (no recovery modelled) |
| Volcanic | One-shot | Obsidian Tortoise hits for 105% of the arrival player's maxHP |
| Volcanic | Low TTL | 3.90s to die under mean pressure (no recovery modelled) |
| Wasteland | No progression | cost/kill is 0.93x the previous rung — the climb stalls here |
| Wasteland | Low TTL | 4.97s to die under mean pressure (no recovery modelled) |
| Deep-Sea Trench | Difficulty wall | cost/kill jumps 3.42x over the previous rung |
| Deep-Sea Trench | One-shot | Elder Leviathan hits for 186% of the arrival player's maxHP |
| Deep-Sea Trench | Low TTL | 3.04s to die under mean pressure (no recovery modelled) |


## Arrival Players

_Derived, not assumed: GM accrues per biome mastered and gates upgrade level, so the ladder walks +0 to +4._

| # | Arrive at | Gear | GM | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Mountain | T4 +0 | 126 | 341 | 35.1 | 4.09% | 10.6% | 147 | 0.89 |
| 2 | Jungle | T4 +0 | 135 | 341 | 35.1 | 4.09% | 10.6% | 147 | 0.89 |
| 3 | Desert | T4 +1 | 145 | 384 | 42.4 | 4.29% | 10.7% | 173 | 0.89 |
| 4 | Tundra | T4 +2 | 154 | 426 | 49.7 | 4.49% | 10.9% | 199 | 0.89 |
| 5 | Volcanic | T4 +2 | 164 | 426 | 49.7 | 4.49% | 10.9% | 199 | 0.89 |
| 6 | Wasteland | T4 +3 | 173 | 470 | 57.0 | 4.69% | 11.0% | 224 | 0.89 |
| 7 | Deep-Sea Trench | T4 +4 | 183 | 512 | 64.4 | 4.89% | 11.1% | 250 | 0.89 |


---

## Detail

_Fixed-reference views, kept for cross-biome comparison at one power level. These do NOT account for the walk — read them only after the Walk has pointed you at a biome._

## Boss / Elite Table

_Bosses for biome tier 4 vs the boss-ready reference player (T4 +3). TTK uses the shared class-aware planning estimator; T3 specs, abilities, and shields/soft-caps remain unmodeled. TTL is player survival with no recovery modeled._

| Boss | Biome | HP | Attack profile | Raw DPS | Spike | Defenses | Expected TTK | Player TTL | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Elder Trench Serpent | Deep-Sea Trench | 21793 | 143 @ 0.31 aps | 67.2 | ×2.70 | plate 20.0, DR 22.0%, shield 28.0% | 114s | 10.6s | Risky | TTK undercounted (shield/softcap) |
| Dune-Throne Sovereign | Desert | 17893 | 185 @ 0.36 aps | 92.1 | ×2.00 | plate 8.00, DR 8.00% | 76.1s | 6.87s | Blocked | kills player fast |
| Verdant-Crown Predator | Jungle | 18352 | 117 @ 0.71 aps | 140 | ×2.60 | plate 0.00, DR 4.00%, evasion 25.0% | 71.8s | 4.69s | Blocked | kills player fast |
| Iron-Crest Titan | Mountain | 19499 | 228 @ 0.24 aps | 104 | ×2.20 | plate 14.0, DR 6.00% | 84.3s | 5.70s | Blocked | kills player fast |
| Glacial Patriarch | Tundra | 22940 | 189 @ 0.22 aps | 70.1 | ×1.90 | plate 22.0, DR 14.0%, shield 20.0% | 112s | 8.95s | Risky | TTK undercounted (shield/softcap) |
| Caldera Sovereign | Volcanic | 20646 | 130 @ 0.38 aps | 124 | ×1.80 | plate 10.0, DR 5.00% | 86.4s | 4.77s | Blocked | kills player fast |
| Charnel-Crown Sovereign | Wasteland | 19499 | 115 @ 0.43 aps | 83.4 | ×1.70 | plate 14.0, DR 8.00% | 86.0s | 8.18s | Risky | - |

## Mob / Boss Diagnostic Signals

_Attention signals only: mobs >±25% of biome-tier average on HP / raw DPS / spike, bosses outside the TTK/TTL observation bands, and narrow biome threat profiles. These are not verdicts or balance gates._

| Flag | Subject | Detail |
| --- | --- | --- |
| HP > +25% tier avg | Abyssal Serpent | 4200 vs avg 1788 (×2.35) |
| Raw DPS > +25% tier avg | Abyssal Serpent | 230 vs avg 108 (×2.13) |
| Spike > +25% tier avg | Abyssal Serpent | 1050 vs avg 372 (×2.82) |
| HP > +25% tier avg | Hadal Stalker | 2800 vs avg 1788 (×1.57) |
| Raw DPS > +25% tier avg | Hadal Stalker | 200 vs avg 108 (×1.86) |
| Spike > +25% tier avg | Hadal Stalker | 962 vs avg 372 (×2.59) |
| HP > +25% tier avg | Elder Leviathan | 5880 vs avg 1788 (×3.29) |
| Raw DPS > +25% tier avg | Elder Leviathan | 208 vs avg 108 (×1.93) |
| Spike > +25% tier avg | Elder Leviathan | 1159 vs avg 372 (×3.12) |
| Raw DPS < -25% tier avg | Sand Viper | 32.5 vs avg 108 (×0.30) |
| Spike < -25% tier avg | Sand Viper | 78.0 vs avg 372 (×0.21) |
| Raw DPS < -25% tier avg | Dune Basilisk | 42.0 vs avg 108 (×0.39) |
| Spike < -25% tier avg | Dune Basilisk | 104 vs avg 372 (×0.28) |
| Spike > +25% tier avg | Dune Tyrant | 644 vs avg 372 (×1.73) |
| HP < -25% tier avg | Hunting Panther | 704 vs avg 1788 (×0.39) |
| Raw DPS < -25% tier avg | Hunting Panther | 43.3 vs avg 108 (×0.40) |
| Spike < -25% tier avg | Hunting Panther | 114 vs avg 372 (×0.31) |
| HP < -25% tier avg | Apex Silverback | 1056 vs avg 1788 (×0.59) |
| Raw DPS < -25% tier avg | Apex Silverback | 42.8 vs avg 108 (×0.40) |
| Spike < -25% tier avg | Apex Silverback | 112 vs avg 372 (×0.30) |
| HP < -25% tier avg | Thornback Chameleon | 748 vs avg 1788 (×0.42) |
| Raw DPS < -25% tier avg | Thornback Chameleon | 34.7 vs avg 108 (×0.32) |
| Spike < -25% tier avg | Thornback Chameleon | 52.0 vs avg 372 (×0.14) |
| Raw DPS < -25% tier avg | Emerald Constrictor | 51.6 vs avg 108 (×0.48) |
| Spike < -25% tier avg | Emerald Constrictor | 132 vs avg 372 (×0.35) |
| HP < -25% tier avg | Granite Mammoth | 779 vs avg 1788 (×0.44) |
| Raw DPS < -25% tier avg | Granite Mammoth | 63.9 vs avg 108 (×0.59) |
| HP < -25% tier avg | Avalanche Tyrant | 533 vs avg 1788 (×0.30) |
| Spike < -25% tier avg | Avalanche Tyrant | 261 vs avg 372 (×0.70) |
| HP < -25% tier avg | Cliffside Roc | 574 vs avg 1788 (×0.32) |
| Raw DPS < -25% tier avg | Cliffside Roc | 51.1 vs avg 108 (×0.48) |
| Spike < -25% tier avg | Cliffside Roc | 179 vs avg 372 (×0.48) |
| HP < -25% tier avg | Cragback Rhino | 923 vs avg 1788 (×0.52) |
| Raw DPS < -25% tier avg | Cragback Rhino | 54.6 vs avg 108 (×0.51) |
| HP < -25% tier avg | Rime-Tusk Mastodon | 924 vs avg 1788 (×0.52) |
| Raw DPS > +25% tier avg | Rime-Tusk Mastodon | 150 vs avg 108 (×1.40) |
| Spike > +25% tier avg | Rime-Tusk Mastodon | 842 vs avg 372 (×2.26) |
| HP < -25% tier avg | Glacial Dire-Bear | 1221 vs avg 1788 (×0.68) |
| HP < -25% tier avg | Hoarfrost Yeti | 693 vs avg 1788 (×0.39) |
| Raw DPS > +25% tier avg | Permafrost Behemoth | 183 vs avg 108 (×1.70) |
| Spike > +25% tier avg | Permafrost Behemoth | 1053 vs avg 372 (×2.83) |
| HP < -25% tier avg | Ember Skink | 1043 vs avg 1788 (×0.58) |
| Spike < -25% tier avg | Ember Skink | 168 vs avg 372 (×0.45) |
| Raw DPS > +25% tier avg | Infernal Direhound | 150 vs avg 108 (×1.40) |
| Spike < -25% tier avg | Infernal Direhound | 210 vs avg 372 (×0.56) |
| HP > +25% tier avg | Obsidian Tortoise | 2244 vs avg 1788 (×1.26) |
| Spike > +25% tier avg | Obsidian Tortoise | 576 vs avg 372 (×1.55) |
| HP < -25% tier avg | Ashspitter Salamander | 1188 vs avg 1788 (×0.66) |
| Spike < -25% tier avg | Ashspitter Salamander | 183 vs avg 372 (×0.49) |
| HP > +25% tier avg | Magma Salamander | 2904 vs avg 1788 (×1.62) |
| Spike < -25% tier avg | Magma Salamander | 246 vs avg 372 (×0.66) |
| Spike < -25% tier avg | Bone Crawler | 159 vs avg 372 (×0.43) |
| HP > +25% tier avg | Plague Hound | 3168 vs avg 1788 (×1.77) |
| Raw DPS > +25% tier avg | Plague Hound | 149 vs avg 108 (×1.39) |
| Spike < -25% tier avg | Plague Hound | 224 vs avg 372 (×0.60) |
| HP > +25% tier avg | Carrion Vulture | 2693 vs avg 1788 (×1.51) |
| Spike < -25% tier avg | Carrion Vulture | 189 vs avg 372 (×0.51) |
| Raw DPS > +25% tier avg | Bone Rat | 143 vs avg 108 (×1.33) |
| Spike < -25% tier avg | Bone Rat | 136 vs avg 372 (×0.37) |
| HP > +25% tier avg | Gravewright | 2851 vs avg 1788 (×1.59) |
| Raw DPS < -25% tier avg | Gravewright | 62.1 vs avg 108 (×0.58) |
| Spike < -25% tier avg | Gravewright | 118 vs avg 372 (×0.32) |
| high boss lethality | Dune-Throne Sovereign | player TTL 6.87s, spike 58.9% |
| high boss lethality | Verdant-Crown Predator | player TTL 4.69s, spike 38.3% |
| high boss lethality | Iron-Crest Titan | player TTL 5.70s, spike 85.2% |
| high boss lethality | Caldera Sovereign | player TTL 4.77s, spike 31.7% |
| biome single-type | Deep-Sea Trench | 100% Direct damage |
| biome single-type | Desert | 100% Direct damage |
| biome single-type | Mountain | 100% Direct damage |
| biome single-type | Tundra | 100% Direct damage |
| biome single-type | Wasteland | 80% Direct damage |

## Mob Stat Summary

_Every non-boss spawn in biome tier 4, sorted by raw total DPS within each biome. Raw DPS is pre-mitigation (attack × APS); DoT/s assumes full refreshed stacks._

| Biome | Mob | Role | HP | Attack | APS / CD | Raw DPS | DoT/s | Plating | DR | Range | Speed | Spike | Specials |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deep-Sea Trench | Abyssal Serpent | Spiker | 4200 | 420 | 0.36 / 2800ms | 230 | 0.00 | 18.0 | 20.0% | 15.0 | 28.0 | ×2.50 | charge ×2.50 |
| Deep-Sea Trench | Elder Leviathan | Spiker | 5880 | 483 | 0.28 / 3600ms | 208 | 0.00 | 22.0 | 24.0% | 15.0 | 20.0 | ×2.40 | shield 30.0%/16.0s |
| Deep-Sea Trench | Hadal Stalker | Spiker | 2800 | 401 | 0.29 / 3400ms | 200 | 0.00 | 20.0 | 10.0% | 240 | 22.0 | ×2.40 | - |
| Desert | Dune Tyrant | Spiker | 1738 | 230 | 0.29 / 3500ms | 118 | 0.00 | 8.00 | 8.00% | 15.0 | 20.0 | ×2.80 | slow ×0.40 |
| Desert | Dune Basilisk | Tank | 1501 | 104 | 0.33 / 3000ms | 42.0 | 0.00 | 10.0 | 14.0% | 15.0 | 26.0 | ×1.00 | - |
| Desert | Sand Viper | Bruiser | 1343 | 78.0 | 0.42 / 2400ms | 32.5 | 0.00 | 0.00 | 8.00% | 12.0 | 28.0 | ×1.00 | slow ×0.45 |
| Jungle | Emerald Constrictor | Spiker | 1408 | 66.0 | 0.63 / 1600ms | 51.6 | 25.0 | 0.00 | 0.00% | 12.0 | 62.0 | ×2.00 | dot 25.0/s×5, cadence 4→×2.00 |
| Jungle | Hunting Panther | Spiker | 704 | 52.0 | 0.83 / 1200ms | 43.3 | 0.00 | 0.00 | 0.00% | 12.0 | 82.0 | ×2.20 | - |
| Jungle | Apex Silverback | Bruiser | 1056 | 77.0 | 0.56 / 1800ms | 42.8 | 0.00 | 0.00 | 0.00% | 12.0 | 54.0 | ×1.45 | ramp +45.0% atk, charge ×2.80 |
| Jungle | Thornback Chameleon | Bruiser | 748 | 52.0 | 0.67 / 1500ms | 34.7 | 0.00 | 0.00 | 0.00% | 200 | 50.0 | ×1.00 | - |
| Mountain | Avalanche Tyrant | Spiker | 533 | 145 | 0.40 / 2500ms | 81.2 | 0.00 | 0.00 | 0.00% | 12.0 | 42.0 | ×1.80 | charge ×2.80 |
| Mountain | Granite Mammoth | Spiker | 779 | 184 | 0.28 / 3600ms | 63.9 | 0.00 | 0.00 | 0.00% | 15.0 | 16.0 | ×2.00 | cadence 4→×2.00, charge ×2.50 |
| Mountain | Cragback Rhino | Spiker | 923 | 113 | 0.26 / 3800ms | 54.6 | 0.00 | 16.0 | 6.00% | 15.0 | 14.0 | ×3.20 | cooldown 10.0s→×3.20, softcap 25.0%×0.50, charge ×2.20 |
| Mountain | Cliffside Roc | Bruiser | 574 | 179 | 0.29 / 3500ms | 51.1 | 0.00 | 0.00 | 0.00% | 260 | 34.0 | ×1.00 | - |
| Tundra | Permafrost Behemoth | Spiker | 1914 | 351 | 0.25 / 4000ms | 183 | 0.00 | 20.0 | 12.0% | 15.0 | 12.0 | ×3.00 | charge ×2.00 |
| Tundra | Rime-Tusk Mastodon | Spiker | 924 | 421 | 0.29 / 3500ms | 150 | 0.00 | 12.0 | 0.00% | 15.0 | 18.0 | ×2.00 | cadence 4→×2.00, charge ×2.30 |
| Tundra | Hoarfrost Yeti | Bruiser | 693 | 302 | 0.34 / 2900ms | 127 | 0.00 | 0.00 | 8.00% | 220 | 36.0 | ×1.20 | - |
| Tundra | Glacial Dire-Bear | Bruiser | 1221 | 369 | 0.31 / 3200ms | 115 | 0.00 | 0.00 | 14.0% | 15.0 | 18.0 | ×1.00 | shield 22.0%/12.0s |
| Volcanic | Ember Skink | Bruiser | 1043 | 168 | 0.77 / 1300ms | 129 | 52.0 | 2.00 | 0.00% | 12.0 | 70.0 | ×1.00 | dot 52.0/s×4 |
| Volcanic | Ashspitter Salamander | Bruiser | 1188 | 183 | 0.53 / 1900ms | 96.3 | 80.0 | 2.00 | 0.00% | 190 | 46.0 | ×1.00 | dot 80.0/s×5 |
| Volcanic | Infernal Direhound | Bruiser | 1386 | 210 | 0.71 / 1400ms | 150 | 0.00 | 4.00 | 0.00% | 12.0 | 72.0 | ×1.00 | charge ×2.50 |
| Volcanic | Obsidian Tortoise | Spiker | 2244 | 262 | 0.33 / 3000ms | 114 | 0.00 | 8.00 | 0.00% | 15.0 | 20.0 | ×2.20 | cadence 4→×2.20 |
| Volcanic | Magma Salamander | Bruiser | 2904 | 246 | 0.38 / 2600ms | 94.6 | 0.00 | 6.00 | 6.00% | 15.0 | 22.0 | ×1.00 | shield 28.0%/14.0s |
| Wasteland | Plague Hound | Bruiser | 3168 | 224 | 0.67 / 1500ms | 149 | 109 | 0.00 | 0.00% | 12.0 | 70.0 | ×1.00 | dot 109/s×5, charge ×2.50 |
| Wasteland | Bone Rat | Bruiser | 1584 | 136 | 1.05 / 950ms | 143 | 0.00 | 0.00 | 0.00% | 12.0 | 92.0 | ×1.00 | - |
| Wasteland | Bone Crawler | Bruiser | 2059 | 159 | 0.83 / 1200ms | 133 | 0.00 | 0.00 | 0.00% | 12.0 | 78.0 | ×1.00 | - |
| Wasteland | Carrion Vulture | Bruiser | 2693 | 189 | 0.59 / 1700ms | 111 | 0.00 | 0.00 | 0.00% | 200 | 46.0 | ×1.00 | - |
| Wasteland | Gravewright | Bruiser | 2851 | 118 | 0.53 / 1900ms | 62.1 | 0.00 | 0.00 | 0.00% | 200 | 40.0 | ×1.00 | - |
