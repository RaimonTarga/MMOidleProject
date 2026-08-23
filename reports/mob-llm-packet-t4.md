# MMO Idle Monster Balance Packet - Biome Tier 4

Generated from `tools/mob-report.ts --llm-packet`. Markdown only. Companion to the DPS and eHP packets.

## Assumptions / Omissions

- Player model: weapon, armour, charm and mobility only, plus skill nodes, item upgrades and class affinities. NO core, relic, rune, rite, stance or ability is equipped — the bench bots carry all six, so these numbers are comparable to each other but NOT to bench output in absolute terms.

- Monster-centric: subject is the world's offence and durability, bucketed by biome tier 4.
- Reference players are tier 4 (a player of tier P fights biome tier P-1); **no tier-5 gear authored yet, best-available T4 used as the reference**. Defensive stats are averaged over spec-agnostic class builds × armor × recovery; the boss-ready profile biases to the tankiest armor.
- Reference player DPS uses shared `estimatePlayerDps` across concrete class builds, including full Conduit formations. T3 specialization, abilities, target-state mechanics, and shields/soft-caps remain outside this planning TTK; cross-check the detailed DPS packet for spec-level clear speed.
- TTL pressure = player maxHP ÷ incoming DPS with **no player recovery** (that lives in the eHP packet). Incoming DPS folds plating/DR/averaged evasion; player DoT-resistance is not applied here.
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 28 mobs; tier avg HP 1788, avg total DPS 117.

## Reference Players

| Player | Gear | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Entry (prev-tier +3) | T3 +3 | 318 | 32.4 | 5.03% | 12.7% | 130 | 0.94 |
| Same-tier +0 | T4 +0 | 341 | 35.1 | 4.09% | 10.6% | 147 | 0.89 |
| Same-tier +3 | T4 +3 | 470 | 57.0 | 4.69% | 11.0% | 224 | 0.89 |
| Boss-ready (tankiest +3) | T4 +3 | 455 | 48.8 | 1.89% | 5.61% | 224 | 0.89 |


## Cross-Biome Threat & Reward

_Every biome at tier 4, ranked by mean incoming DPS against Entry (prev-tier +3). Threat is post-mitigation; spike is the worst individual hit. Rewards are authored per-kill means, not hourly yield. The threat index is relative to this tier's sibling median, not a target._

| Biome | Threat index | Mean HP | Max HP | Mean incoming DPS | Max incoming DPS | Worst spike %HP | Density | Essence / kill | Biome XP / kill |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deep-Sea Trench | ×1.65 | 4293 | 5880 | 182 | 196 | 323% (Elder Leviathan) | 10 | 290 | 1740 |
| Tundra | ×1.10 | 1188 | 1914 | 122 | 155 | 285% (Permafrost Behemoth) | 16 | 146 | 873 |
| Volcanic | ×1.06 | 1753 | 2904 | 118 | 154 | 151% (Obsidian Tortoise) | 36 | 99.4 | 596 |
| Wasteland | ×1.00 | 2471 | 3168 | 111 | 228 | 57.2% (Plague Hound) | 28 | 42.4 | 254 |
| Desert | ×0.42 | 1527 | 1738 | 46.1 | 93.9 | 165% (Dune Tyrant) | 16 | 108 | 650 |
| Mountain | ×0.41 | 702 | 923 | 45.6 | 58.5 | 90.5% (Granite Mammoth) | 24 | 106 | 635 |
| Jungle | ×0.23 | 979 | 1408 | 25.0 | 49.4 | 20.1% (Emerald Constrictor) | 40 | 78.3 | 470 |

## Cross-Biome Deviation Signals

_Discovery-only signals for values at least 25% from the tier-sibling median. Deliberate outliers are expected; this is neither a pass/fail gate nor a recommended balance band._

| Biome | Axis | Metric | Value | Sibling median | Deviation |
| --- | --- | --- | --- | --- | --- |
| Deep-Sea Trench | Reward | Essence / kill | 290 | 106 | +174% |
| Deep-Sea Trench | Reward | Biome XP / kill | 1740 | 635 | +174% |
| Deep-Sea Trench | Threat | Worst spike %HP | 323% | 151% | +114% |
| Tundra | Threat | Worst spike %HP | 285% | 151% | +89.5% |
| Jungle | Threat | Worst spike %HP | 20.1% | 151% | -86.7% |
| Jungle | Threat | Mean incoming DPS | 25.0 | 111 | -77.4% |
| Jungle | Threat | Max incoming DPS | 49.4 | 154 | -67.8% |
| Jungle | Exposure | Mob density | 40.0 | 24.0 | +66.7% |
| Deep-Sea Trench | Threat | Mean incoming DPS | 182 | 111 | +64.7% |
| Wasteland | Threat | Worst spike %HP | 57.2% | 151% | -62.1% |
| Mountain | Threat | Max incoming DPS | 58.5 | 154 | -61.9% |
| Wasteland | Reward | Biome XP / kill | 254 | 635 | -60.0% |
| Wasteland | Reward | Essence / kill | 42.4 | 106 | -59.9% |
| Mountain | Threat | Mean incoming DPS | 45.6 | 111 | -58.8% |
| Desert | Threat | Mean incoming DPS | 46.1 | 111 | -58.4% |
| Deep-Sea Trench | Exposure | Mob density | 10.0 | 24.0 | -58.3% |
| Volcanic | Exposure | Mob density | 36.0 | 24.0 | +50.0% |
| Wasteland | Threat | Max incoming DPS | 228 | 154 | +48.3% |
| Mountain | Threat | Worst spike %HP | 90.5% | 151% | -39.9% |
| Desert | Threat | Max incoming DPS | 93.9 | 154 | -38.8% |
| Tundra | Reward | Essence / kill | 146 | 106 | +37.6% |
| Tundra | Reward | Biome XP / kill | 873 | 635 | +37.4% |
| Desert | Exposure | Mob density | 16.0 | 24.0 | -33.3% |
| Tundra | Exposure | Mob density | 16.0 | 24.0 | -33.3% |
| Deep-Sea Trench | Threat | Max incoming DPS | 196 | 154 | +27.9% |
| Jungle | Reward | Biome XP / kill | 470 | 635 | -26.1% |
| Jungle | Reward | Essence / kill | 78.3 | 106 | -26.0% |

## Player Matchup Summary

_Mean resolved per-mob pressure vs the four reference players, with worst-spike %HP from the biome's hardest-spiking individual mob. Incoming DPS folds plating/DR/evasion; TTL = maxHP ÷ incoming (no player recovery — see eHP packet). Status: Safe/Risky/Blocked (mob risk<30s, block<10s, ≥50% spike = Risky, one-shot = Blocked). ⚠ No tier-5 gear authored; using best-available T4 as reference._

| Biome | Player | Incoming DPS | Worst spike %HP | TTL pressure | Status |
| --- | --- | --- | --- | --- | --- |
| Deep-Sea Trench | Entry (prev-tier +3) | 182 | 323% (Elder Leviathan) | 1.75s | Blocked |
| Deep-Sea Trench | Same-tier +0 | 184 | 303% (Elder Leviathan) | 1.86s | Blocked |
| Deep-Sea Trench | Same-tier +3 | 172 | 208% (Elder Leviathan) | 2.73s | Blocked |
| Deep-Sea Trench | Boss-ready (tankiest +3) | 184 | 225% (Elder Leviathan) | 2.48s | Blocked |
| Desert | Entry (prev-tier +3) | 46.1 | 165% (Dune Tyrant) | 6.91s | Blocked |
| Desert | Same-tier +0 | 45.5 | 154% (Dune Tyrant) | 7.48s | Blocked |
| Desert | Same-tier +3 | 36.2 | 98.4% (Dune Tyrant) | 13.0s | Risky |
| Desert | Boss-ready (tankiest +3) | 41.4 | 110% (Dune Tyrant) | 11.0s | Blocked |
| Jungle | Entry (prev-tier +3) | 25.0 | 20.1% (Emerald Constrictor) | 12.7s | Risky |
| Jungle | Same-tier +0 | 23.3 | 17.6% (Emerald Constrictor) | 14.6s | Risky |
| Jungle | Same-tier +3 | 10.9 | 5.87% (Apex Silverback) | 43.0s | Safe |
| Jungle | Boss-ready (tankiest +3) | 14.5 | 8.93% (Apex Silverback) | 31.3s | Safe |
| Mountain | Entry (prev-tier +3) | 45.6 | 90.5% (Granite Mammoth) | 6.98s | Blocked |
| Mountain | Same-tier +0 | 45.1 | 84.0% (Granite Mammoth) | 7.55s | Blocked |
| Mountain | Same-tier +3 | 36.2 | 51.5% (Granite Mammoth) | 13.0s | Risky |
| Mountain | Boss-ready (tankiest +3) | 41.2 | 58.5% (Granite Mammoth) | 11.0s | Risky |
| Tundra | Entry (prev-tier +3) | 122 | 285% (Permafrost Behemoth) | 2.62s | Blocked |
| Tundra | Same-tier +0 | 122 | 267% (Permafrost Behemoth) | 2.79s | Blocked |
| Tundra | Same-tier +3 | 113 | 179% (Permafrost Behemoth) | 4.16s | Blocked |
| Tundra | Boss-ready (tankiest +3) | 121 | 195% (Permafrost Behemoth) | 3.76s | Blocked |
| Volcanic | Entry (prev-tier +3) | 118 | 151% (Obsidian Tortoise) | 2.70s | Blocked |
| Volcanic | Same-tier +0 | 117 | 141% (Obsidian Tortoise) | 2.90s | Blocked |
| Volcanic | Same-tier +3 | 105 | 91.4% (Obsidian Tortoise) | 4.46s | Blocked |
| Volcanic | Boss-ready (tankiest +3) | 113 | 101% (Obsidian Tortoise) | 4.02s | Blocked |
| Wasteland | Entry (prev-tier +3) | 111 | 57.2% (Plague Hound) | 2.88s | Blocked |
| Wasteland | Same-tier +0 | 110 | 53.1% (Plague Hound) | 3.09s | Blocked |
| Wasteland | Same-tier +3 | 94.4 | 33.9% (Plague Hound) | 4.97s | Blocked |
| Wasteland | Boss-ready (tankiest +3) | 104 | 37.8% (Plague Hound) | 4.39s | Blocked |

## Biome Threat Summary

_Per-biome aggregates for biome tier 4. "Hardest hitter" uses raw direct DPS; "tankiest" weights plating ×8 against HP._

| Biome | Mobs | Avg HP | Avg DPS | Avg atk | Avg APS | Avg DoT/s | Hardest | Fastest | Tankiest | DoT-heavy | Biggest spike | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deep-Sea Trench | 3 | 4293 | 212 | 435 | 0.31 | 0.00 | Abyssal Serpent | Abyssal Serpent | Elder Leviathan | - | Elder Leviathan ×2.40 | density 10; 0/3 carry DoT |
| Desert | 3 | 1527 | 64.1 | 137 | 0.35 | 0.00 | Dune Tyrant | Sand Viper | Dune Tyrant | - | Dune Tyrant ×2.80 | density 16; 0/3 carry DoT |
| Jungle | 4 | 979 | 43.1 | 61.8 | 0.67 | 6.25 | Emerald Constrictor | Hunting Panther | Emerald Constrictor | Emerald Constrictor | Emerald Constrictor ×2.00 | density 40; 1/4 carry DoT |
| Mountain | 4 | 702 | 62.7 | 155 | 0.31 | 0.00 | Avalanche Tyrant | Avalanche Tyrant | Cragback Rhino | - | Granite Mammoth ×2.00 | density 24; 0/4 carry DoT |
| Tundra | 4 | 1188 | 144 | 361 | 0.30 | 0.00 | Permafrost Behemoth | Hoarfrost Yeti | Permafrost Behemoth | - | Permafrost Behemoth ×3.00 | density 16; 0/4 carry DoT |
| Volcanic | 5 | 1753 | 117 | 214 | 0.55 | 26.4 | Infernal Direhound | Ember Skink | Magma Salamander | Ashspitter Salamander | Obsidian Tortoise ×2.20 | density 36; 2/5 carry DoT |
| Wasteland | 5 | 2471 | 120 | 165 | 0.73 | 21.8 | Plague Hound | Bone Rat | Plague Hound | Plague Hound | Plague Hound ×1.00 | density 28; 1/5 carry DoT |

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
