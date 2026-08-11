# MMO Idle Monster Balance Packet - Biome Tier 4

Generated from `tools/mob-report.ts --llm-packet`. Markdown only. Companion to the DPS and eHP packets.

## Assumptions / Omissions

- Monster-centric: subject is the world's offence and durability, bucketed by biome tier 4.
- Reference players are tier 4 (a player of tier P fights biome tier P-1); **no tier-5 gear authored yet, best-available T4 used as the reference**. Defensive stats are averaged over spec-agnostic class builds × armor × recovery; the boss-ready profile biases to the tankiest armor.
- Reference player DPS is **direct-hit only** (class empowered/cadence/DoT mechanics omitted) → boss TTK is an UPPER bound. Shields/soft-caps extend TTK further. Cross-check the DPS packet for real clear speed.
- TTL pressure = player maxHP ÷ incoming DPS with **no player recovery** (that lives in the eHP packet). Incoming DPS folds plating/DR/averaged evasion; player DoT-resistance is not applied here.
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 30 mobs; tier avg HP 1519, avg total DPS 49.6.

## Reference Players

| Player | Gear | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Entry (prev-tier +3) | T3 +3 | 295 | 37.1 | 11.5% | 13.7% | 151 | 1.02 |
| Same-tier +0 | T4 +0 | 299 | 37.0 | 11.2% | 11.6% | 165 | 0.96 |
| Same-tier +3 | T4 +3 | 400 | 58.9 | 11.8% | 12.0% | 252 | 0.96 |
| Boss-ready (tankiest +3) | T4 +3 | 465 | 57.4 | 6.39% | 6.78% | 252 | 0.96 |


## Cross-Biome Threat & Reward

_Every biome at tier 4, ranked by mean incoming DPS against Entry (prev-tier +3). Threat is post-mitigation; spike is the worst individual hit. Rewards are authored per-kill means, not hourly yield. The threat index is relative to this tier's sibling median, not a target._

| Biome | Threat index | Mean HP | Max HP | Mean incoming DPS | Max incoming DPS | Worst spike %HP | Density | Essence / kill | Biome XP / kill |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Wasteland | ×1.67 | 820 | 1800 | 44.2 | 64.3 | 53.6% (Charnel Brute) | 20 | 62.0 | 372 |
| Jungle | ×1.27 | 1113 | 1600 | 33.6 | 50.7 | 34.6% (Emerald Constrictor) | 20 | 78.3 | 470 |
| Volcanic | ×1.10 | 1328 | 2200 | 29.3 | 44.9 | 55.0% (Obsidian Tortoise) | 18 | 99.4 | 596 |
| Deep-Sea Trench | ×1.00 | 3233 | 4200 | 26.5 | 29.2 | 87.9% (Abyssal Serpent) | 5 | 290 | 1740 |
| Mountain | ×0.93 | 1713 | 2250 | 24.6 | 29.2 | 81.8% (Granite Mammoth) | 12 | 106 | 635 |
| Desert | ×0.65 | 1450 | 2200 | 17.3 | 33.9 | 62.8% (Dune Tyrant) | 8 | 95.8 | 575 |
| Tundra | ×0.63 | 1800 | 2900 | 16.7 | 20.3 | 79.1% (Permafrost Behemoth) | 8 | 146 | 873 |

## Cross-Biome Deviation Signals

_Discovery-only signals for values at least 25% from the tier-sibling median. Deliberate outliers are expected; this is neither a pass/fail gate nor a recommended balance band._

| Biome | Axis | Metric | Value | Sibling median | Deviation |
| --- | --- | --- | --- | --- | --- |
| Deep-Sea Trench | Reward | Biome XP / kill | 1740 | 596 | +192% |
| Deep-Sea Trench | Reward | Essence / kill | 290 | 99.4 | +192% |
| Wasteland | Threat | Max incoming DPS | 64.3 | 33.9 | +90.0% |
| Wasteland | Threat | Mean incoming DPS | 44.2 | 26.5 | +67.0% |
| Jungle | Exposure | Mob density | 20.0 | 12.0 | +66.7% |
| Wasteland | Exposure | Mob density | 20.0 | 12.0 | +66.7% |
| Deep-Sea Trench | Exposure | Mob density | 5.00 | 12.0 | -58.3% |
| Volcanic | Exposure | Mob density | 18.0 | 12.0 | +50.0% |
| Jungle | Threat | Max incoming DPS | 50.7 | 33.9 | +49.8% |
| Tundra | Reward | Biome XP / kill | 873 | 596 | +46.4% |
| Tundra | Reward | Essence / kill | 146 | 99.4 | +46.4% |
| Jungle | Threat | Worst spike %HP | 34.6% | 62.8% | -44.9% |
| Deep-Sea Trench | Threat | Worst spike %HP | 87.9% | 62.8% | +40.0% |
| Tundra | Threat | Max incoming DPS | 20.3 | 33.9 | -40.0% |
| Wasteland | Reward | Biome XP / kill | 372 | 596 | -37.6% |
| Wasteland | Reward | Essence / kill | 62.0 | 99.4 | -37.6% |
| Tundra | Threat | Mean incoming DPS | 16.7 | 26.5 | -37.1% |
| Desert | Threat | Mean incoming DPS | 17.3 | 26.5 | -34.6% |
| Desert | Exposure | Mob density | 8.00 | 12.0 | -33.3% |
| Tundra | Exposure | Mob density | 8.00 | 12.0 | -33.3% |
| Volcanic | Threat | Max incoming DPS | 44.9 | 33.9 | +32.5% |
| Mountain | Threat | Worst spike %HP | 81.8% | 62.8% | +30.3% |
| Jungle | Threat | Mean incoming DPS | 33.6 | 26.5 | +26.7% |
| Tundra | Threat | Worst spike %HP | 79.1% | 62.8% | +25.9% |

## Player Matchup Summary

_Mean resolved per-mob pressure vs the four reference players, with worst-spike %HP from the biome's hardest-spiking individual mob. Incoming DPS folds plating/DR/evasion; TTL = maxHP ÷ incoming (no player recovery — see eHP packet). Status: Safe/Risky/Blocked (mob risk<30s, block<10s, ≥50% spike = Risky, one-shot = Blocked). ⚠ No tier-5 gear authored; using best-available T4 as reference._

| Biome | Player | Incoming DPS | Worst spike %HP | TTL pressure | Status |
| --- | --- | --- | --- | --- | --- |
| Deep-Sea Trench | Entry (prev-tier +3) | 26.5 | 87.9% (Abyssal Serpent) | 11.1s | Risky |
| Deep-Sea Trench | Same-tier +0 | 26.6 | 87.0% (Abyssal Serpent) | 11.2s | Risky |
| Deep-Sea Trench | Same-tier +3 | 20.6 | 59.7% (Abyssal Serpent) | 19.4s | Risky |
| Deep-Sea Trench | Boss-ready (tankiest +3) | 22.7 | 54.8% (Abyssal Serpent) | 20.5s | Risky |
| Desert | Entry (prev-tier +3) | 17.3 | 62.8% (Dune Tyrant) | 17.0s | Risky |
| Desert | Same-tier +0 | 17.5 | 62.2% (Dune Tyrant) | 17.1s | Risky |
| Desert | Same-tier +3 | 10.5 | 41.2% (Dune Tyrant) | 38.0s | Safe |
| Desert | Boss-ready (tankiest +3) | 11.7 | 38.0% (Dune Tyrant) | 39.7s | Safe |
| Jungle | Entry (prev-tier +3) | 33.6 | 34.6% (Emerald Constrictor) | 8.78s | Blocked |
| Jungle | Same-tier +0 | 33.8 | 34.1% (Emerald Constrictor) | 8.84s | Blocked |
| Jungle | Same-tier +3 | 21.2 | 20.5% (Emerald Constrictor) | 18.9s | Risky |
| Jungle | Boss-ready (tankiest +3) | 22.4 | 19.1% (Emerald Constrictor) | 20.8s | Risky |
| Mountain | Entry (prev-tier +3) | 24.6 | 81.8% (Granite Mammoth) | 12.0s | Risky |
| Mountain | Same-tier +0 | 24.9 | 81.0% (Granite Mammoth) | 12.0s | Risky |
| Mountain | Same-tier +3 | 18.9 | 55.5% (Granite Mammoth) | 21.2s | Risky |
| Mountain | Boss-ready (tankiest +3) | 20.8 | 50.7% (Granite Mammoth) | 22.4s | Risky |
| Tundra | Entry (prev-tier +3) | 16.7 | 79.1% (Permafrost Behemoth) | 17.7s | Risky |
| Tundra | Same-tier +0 | 16.9 | 78.3% (Permafrost Behemoth) | 17.7s | Risky |
| Tundra | Same-tier +3 | 11.1 | 53.2% (Permafrost Behemoth) | 36.0s | Risky |
| Tundra | Boss-ready (tankiest +3) | 12.5 | 48.8% (Permafrost Behemoth) | 37.4s | Safe |
| Volcanic | Entry (prev-tier +3) | 29.3 | 55.0% (Obsidian Tortoise) | 10.1s | Risky |
| Volcanic | Same-tier +0 | 29.4 | 54.5% (Obsidian Tortoise) | 10.2s | Risky |
| Volcanic | Same-tier +3 | 19.1 | 35.5% (Obsidian Tortoise) | 20.9s | Risky |
| Volcanic | Boss-ready (tankiest +3) | 20.4 | 32.7% (Obsidian Tortoise) | 22.8s | Risky |
| Wasteland | Entry (prev-tier +3) | 44.2 | 53.6% (Charnel Brute) | 6.66s | Blocked |
| Wasteland | Same-tier +0 | 44.4 | 53.2% (Charnel Brute) | 6.73s | Blocked |
| Wasteland | Same-tier +3 | 36.1 | 34.7% (Charnel Brute) | 11.1s | Risky |
| Wasteland | Boss-ready (tankiest +3) | 36.7 | 32.0% (Charnel Brute) | 12.7s | Risky |

## Biome Threat Summary

_Per-biome aggregates for biome tier 4. "Hardest hitter" uses raw direct DPS; "tankiest" weights plating ×8 against HP._

| Biome | Mobs | Avg HP | Avg DPS | Avg atk | Avg APS | Avg DoT/s | Hardest | Fastest | Tankiest | DoT-heavy | Biggest spike | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deep-Sea Trench | 3 | 3233 | 42.1 | 137 | 0.31 | 0.00 | Abyssal Serpent | Abyssal Serpent | Elder Leviathan | - | Abyssal Serpent ×2.50 | density 5; 0/3 carry DoT |
| Desert | 4 | 1450 | 36.5 | 79.5 | 0.44 | 0.00 | Sunshield Scarab | Sand Viper | Dune Tyrant | - | Dune Tyrant ×2.80 | density 8; 0/4 carry DoT |
| Jungle | 4 | 1113 | 46.6 | 71.0 | 0.67 | 15.0 | Hunting Panther | Hunting Panther | Emerald Constrictor | Thornback Lizard | Emerald Constrictor ×2.00 | density 20; 2/4 carry DoT |
| Mountain | 4 | 1713 | 39.9 | 131 | 0.31 | 0.00 | Avalanche Tyrant | Avalanche Tyrant | Cragback Rhino | - | Granite Mammoth ×2.00 | density 12; 0/4 carry DoT |
| Tundra | 4 | 1800 | 30.4 | 103 | 0.30 | 0.00 | Rime-Tusk Mastodon | Hoarfrost Yeti | Permafrost Behemoth | - | Permafrost Behemoth ×3.00 | density 8; 0/4 carry DoT |
| Volcanic | 5 | 1328 | 42.5 | 81.6 | 0.55 | 10.0 | Infernal Direhound | Ember Skink | Magma Salamander | Ashspitter Salamander | Obsidian Tortoise ×2.20 | density 18; 2/5 carry DoT |
| Wasteland | 6 | 820 | 38.5 | 61.7 | 0.66 | 32.2 | Plague Hound | Bone Rat | Charnel Brute | Charnel Brute | Charnel Brute ×2.40 | density 20; 6/6 carry DoT |

## Boss / Elite Table

_Bosses for biome tier 4 vs the boss-ready reference player (T4 +3). TTK is an UPPER bound from direct-hit DPS only (class empowered/DoT mechanics omitted; shields/soft-caps extend it). TTL is player survival with no recovery modeled._

| Boss | Biome | HP | Attack profile | Raw DPS | Spike | Defenses | Expected TTK | Player TTL | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Elder Trench Serpent | Deep-Sea Trench | 9500 | 110 @ 0.31 aps | 34.4 | ×2.50 | plate 20.0, DR 22.0%, shield 28.0% | 53.1s | 30.7s | Safe | TTK undercounted (shield/softcap) |
| Dune-Throne Sovereign | Desert | 7800 | 142 @ 0.36 aps | 50.7 | ×1.80 | plate 8.00, DR 8.00% | 35.4s | 16.6s | Risky | - |
| Verdant-Crown Predator | Jungle | 8000 | 90.0 @ 0.71 aps | 94.3 | ×2.10 | plate 0.00, DR 4.00%, evasion 25.0% | 33.7s | 8.96s | Risky | - |
| Iron-Crest Titan | Mountain | 8500 | 175 @ 0.24 aps | 41.7 | ×2.20 | plate 14.0, DR 6.00% | 38.7s | 17.9s | Risky | - |
| Glacial Patriarch | Tundra | 10000 | 145 @ 0.22 aps | 32.2 | ×1.80 | plate 22.0, DR 14.0%, shield 20.0% | 51.2s | 25.8s | Safe | TTK undercounted (shield/softcap) |
| Caldera Sovereign | Volcanic | 9000 | 100 @ 0.38 aps | 78.5 | ×2.00 | plate 10.0, DR 5.00% | 39.8s | 8.42s | Risky | - |
| Charnel-Crown Sovereign | Wasteland | 8500 | 88.0 @ 0.43 aps | 80.3 | ×1.60 | plate 14.0, DR 8.00% | 39.4s | 8.54s | Risky | - |

## Mob / Boss Diagnostic Signals

_Attention signals only: mobs >±25% of biome-tier average on HP / raw DPS / spike, bosses outside the TTK/TTL observation bands, and narrow biome threat profiles. These are not verdicts or balance gates._

| Flag | Subject | Detail |
| --- | --- | --- |
| HP > +25% tier avg | Abyssal Serpent | 3000 vs avg 1519 (×1.98) |
| Spike > +25% tier avg | Abyssal Serpent | 330 vs avg 154 (×2.14) |
| HP > +25% tier avg | Hadal Stalker | 2500 vs avg 1519 (×1.65) |
| Spike > +25% tier avg | Hadal Stalker | 302 vs avg 154 (×1.96) |
| HP > +25% tier avg | Elder Leviathan | 4200 vs avg 1519 (×2.77) |
| Spike > +25% tier avg | Elder Leviathan | 304 vs avg 154 (×1.97) |
| HP < -25% tier avg | Sand Viper | 980 vs avg 1519 (×0.65) |
| Spike < -25% tier avg | Sand Viper | 78.0 vs avg 154 (×0.51) |
| HP > +25% tier avg | Dune Basilisk | 1900 vs avg 1519 (×1.25) |
| Raw DPS < -25% tier avg | Dune Basilisk | 13.3 vs avg 39.5 (×0.34) |
| Spike < -25% tier avg | Dune Basilisk | 40.0 vs avg 154 (×0.26) |
| HP < -25% tier avg | Sunshield Scarab | 720 vs avg 1519 (×0.47) |
| Raw DPS > +25% tier avg | Sunshield Scarab | 58.9 vs avg 39.5 (×1.49) |
| Spike < -25% tier avg | Sunshield Scarab | 112 vs avg 154 (×0.73) |
| HP > +25% tier avg | Dune Tyrant | 2200 vs avg 1519 (×1.45) |
| Raw DPS < -25% tier avg | Dune Tyrant | 25.1 vs avg 39.5 (×0.64) |
| Spike > +25% tier avg | Dune Tyrant | 246 vs avg 154 (×1.60) |
| HP < -25% tier avg | Hunting Panther | 800 vs avg 1519 (×0.53) |
| Raw DPS > +25% tier avg | Hunting Panther | 50.0 vs avg 39.5 (×1.27) |
| Spike < -25% tier avg | Hunting Panther | 60.0 vs avg 154 (×0.39) |
| HP < -25% tier avg | Thornback Lizard | 850 vs avg 1519 (×0.56) |
| Spike < -25% tier avg | Thornback Lizard | 60.0 vs avg 154 (×0.39) |
| HP > +25% tier avg | Granite Mammoth | 1900 vs avg 1519 (×1.25) |
| Spike > +25% tier avg | Granite Mammoth | 310 vs avg 154 (×2.01) |
| HP > +25% tier avg | Cragback Rhino | 2250 vs avg 1519 (×1.48) |
| Raw DPS < -25% tier avg | Cragback Rhino | 25.0 vs avg 39.5 (×0.63) |
| Spike > +25% tier avg | Cragback Rhino | 304 vs avg 154 (×1.97) |
| Spike > +25% tier avg | Rime-Tusk Mastodon | 240 vs avg 154 (×1.56) |
| Spike < -25% tier avg | Glacial Dire-Bear | 105 vs avg 154 (×0.68) |
| HP < -25% tier avg | Hoarfrost Yeti | 1050 vs avg 1519 (×0.69) |
| Spike < -25% tier avg | Hoarfrost Yeti | 86.0 vs avg 154 (×0.56) |
| HP > +25% tier avg | Permafrost Behemoth | 2900 vs avg 1519 (×1.91) |
| Raw DPS < -25% tier avg | Permafrost Behemoth | 25.0 vs avg 39.5 (×0.63) |
| Spike > +25% tier avg | Permafrost Behemoth | 300 vs avg 154 (×1.94) |
| HP < -25% tier avg | Ember Skink | 790 vs avg 1519 (×0.52) |
| Spike < -25% tier avg | Ember Skink | 96.0 vs avg 154 (×0.62) |
| HP < -25% tier avg | Infernal Direhound | 1050 vs avg 1519 (×0.69) |
| Raw DPS > +25% tier avg | Infernal Direhound | 57.1 vs avg 39.5 (×1.45) |
| Spike > +25% tier avg | Obsidian Tortoise | 220 vs avg 154 (×1.43) |
| HP < -25% tier avg | Ashspitter Salamander | 900 vs avg 1519 (×0.59) |
| Spike < -25% tier avg | Ashspitter Salamander | 105 vs avg 154 (×0.68) |
| HP > +25% tier avg | Magma Salamander | 2200 vs avg 1519 (×1.45) |
| HP < -25% tier avg | Bone Crawler | 520 vs avg 1519 (×0.34) |
| Spike < -25% tier avg | Bone Crawler | 54.0 vs avg 154 (×0.35) |
| HP < -25% tier avg | Plague Hound | 800 vs avg 1519 (×0.53) |
| Raw DPS > +25% tier avg | Plague Hound | 50.7 vs avg 39.5 (×1.28) |
| Spike < -25% tier avg | Plague Hound | 76.0 vs avg 154 (×0.49) |
| HP < -25% tier avg | Carrion Vulture | 680 vs avg 1519 (×0.45) |
| Spike < -25% tier avg | Carrion Vulture | 64.0 vs avg 154 (×0.41) |
| Raw DPS < -25% tier avg | Charnel Brute | 28.1 vs avg 39.5 (×0.71) |
| Spike > +25% tier avg | Charnel Brute | 216 vs avg 154 (×1.40) |
| HP < -25% tier avg | Bone Rat | 400 vs avg 1519 (×0.26) |
| Spike < -25% tier avg | Bone Rat | 46.0 vs avg 154 (×0.30) |
| HP < -25% tier avg | Gravewright | 720 vs avg 1519 (×0.47) |
| Raw DPS < -25% tier avg | Gravewright | 21.1 vs avg 39.5 (×0.53) |
| Spike < -25% tier avg | Gravewright | 40.0 vs avg 154 (×0.26) |
| biome single-type | Deep-Sea Trench | 100% Direct damage |
| biome single-type | Desert | 100% Direct damage |
| biome single-type | Mountain | 100% Direct damage |
| biome single-type | Tundra | 100% Direct damage |

## Mob Stat Summary

_Every non-boss spawn in biome tier 4, sorted by raw total DPS within each biome. Raw DPS is pre-mitigation (attack × APS); DoT/s assumes full refreshed stacks._

| Biome | Mob | Role | HP | Attack | APS / CD | Raw DPS | DoT/s | Plating | DR | Range | Speed | Spike | Specials |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deep-Sea Trench | Abyssal Serpent | Spiker | 3000 | 132 | 0.36 / 2800ms | 47.1 | 0.00 | 18.0 | 20.0% | 15.0 | 28.0 | ×2.50 | cooldown 10.0s→×2.50, charge ×2.50 |
| Deep-Sea Trench | Elder Leviathan | Spiker | 4200 | 152 | 0.28 / 3600ms | 42.2 | 0.00 | 22.0 | 24.0% | 15.0 | 20.0 | ×2.00 | cooldown 10.0s→×2.00, shield 30.0%/16.0s, softcap 25.0%×0.50, charge ×2.00 |
| Deep-Sea Trench | Hadal Stalker | Spiker | 2500 | 126 | 0.29 / 3400ms | 37.1 | 0.00 | 15.0 | 16.0% | 15.0 | 22.0 | ×2.40 | cadence 5→×2.40, charge ×2.20 |
| Desert | Sunshield Scarab | Bruiser | 720 | 112 | 0.53 / 1900ms | 58.9 | 0.00 | 0.00 | 0.00% | 230 | 54.0 | ×1.00 | slow ×0.60, shield 22.0%/12.0s |
| Desert | Sand Viper | Bruiser | 980 | 78.0 | 0.63 / 1600ms | 48.8 | 0.00 | 0.00 | 8.00% | 12.0 | 60.0 | ×1.00 | slow ×0.45 |
| Desert | Dune Tyrant | Spiker | 2200 | 88.0 | 0.29 / 3500ms | 25.1 | 0.00 | 8.00 | 8.00% | 15.0 | 20.0 | ×2.80 | slow ×0.40, cooldown 10.0s→×2.80 |
| Desert | Dune Basilisk | Tank | 1900 | 40.0 | 0.33 / 3000ms | 13.3 | 0.00 | 10.0 | 14.0% | 15.0 | 26.0 | ×1.00 | root |
| Jungle | Emerald Constrictor | Spiker | 1600 | 76.0 | 0.63 / 1600ms | 47.5 | 30.0 | 0.00 | 6.00% | 12.0 | 62.0 | ×2.00 | dot 30.0/s×5, cadence 4→×2.00, ramp +50.0% atk, evasion 25.0% |
| Jungle | Thornback Lizard | Bruiser | 850 | 60.0 | 0.67 / 1500ms | 40.0 | 30.0 | 0.00 | 0.00% | 200 | 50.0 | ×1.00 | dot 30.0/s×5 |
| Jungle | Hunting Panther | Bruiser | 800 | 60.0 | 0.83 / 1200ms | 50.0 | 0.00 | 0.00 | 0.00% | 12.0 | 82.0 | ×1.00 | - |
| Jungle | Apex Silverback | Evasive | 1200 | 88.0 | 0.56 / 1800ms | 48.9 | 0.00 | 0.00 | 5.00% | 12.0 | 54.0 | ×1.45 | ramp +45.0% atk, evasion 25.0%, charge ×2.80 |
| Mountain | Avalanche Tyrant | Bruiser | 1300 | 122 | 0.40 / 2500ms | 48.8 | 0.00 | 0.00 | 0.00% | 12.0 | 42.0 | ×1.00 | charge ×2.80 |
| Mountain | Granite Mammoth | Spiker | 1900 | 155 | 0.28 / 3600ms | 43.1 | 0.00 | 0.00 | 0.00% | 15.0 | 16.0 | ×2.00 | cadence 4→×2.00, charge ×2.50 |
| Mountain | Cliffside Roc | Bruiser | 1400 | 150 | 0.29 / 3500ms | 42.9 | 0.00 | 0.00 | 0.00% | 260 | 34.0 | ×1.00 | - |
| Mountain | Cragback Rhino | Spiker | 2250 | 95.0 | 0.26 / 3800ms | 25.0 | 0.00 | 16.0 | 6.00% | 15.0 | 14.0 | ×3.20 | cooldown 10.0s→×3.20, softcap 25.0%×0.50, charge ×2.20 |
| Tundra | Rime-Tusk Mastodon | Spiker | 1400 | 120 | 0.29 / 3500ms | 34.3 | 0.00 | 12.0 | 0.00% | 15.0 | 18.0 | ×2.00 | slow ×0.45, cadence 4→×2.00, charge ×2.30 |
| Tundra | Glacial Dire-Bear | Bruiser | 1850 | 105 | 0.31 / 3200ms | 32.8 | 0.00 | 0.00 | 14.0% | 15.0 | 18.0 | ×1.00 | debuff-ramp slow/atk, shield 22.0%/12.0s |
| Tundra | Hoarfrost Yeti | Bruiser | 1050 | 86.0 | 0.34 / 2900ms | 29.7 | 0.00 | 0.00 | 8.00% | 220 | 36.0 | ×1.00 | debuff-ramp slow/atk |
| Tundra | Permafrost Behemoth | Spiker | 2900 | 100 | 0.25 / 4000ms | 25.0 | 0.00 | 20.0 | 12.0% | 15.0 | 12.0 | ×3.00 | cooldown 9.00s→×3.00, softcap 25.0%×0.50, charge ×2.00 |
| Volcanic | Ember Skink | Bruiser | 790 | 64.0 | 0.77 / 1300ms | 49.2 | 20.0 | 2.00 | 0.00% | 12.0 | 70.0 | ×1.50 | dot 20.0/s×4, ramp +50.0% atk |
| Volcanic | Ashspitter Salamander | Bruiser | 900 | 70.0 | 0.53 / 1900ms | 36.8 | 30.0 | 2.00 | 0.00% | 190 | 46.0 | ×1.50 | dot 30.0/s×5, ramp +50.0% atk |
| Volcanic | Infernal Direhound | Bruiser | 1050 | 80.0 | 0.71 / 1400ms | 57.1 | 0.00 | 4.00 | 0.00% | 12.0 | 72.0 | ×1.60 | ramp +60.0% atk, charge ×2.50 |
| Volcanic | Magma Salamander | Bruiser | 2200 | 94.0 | 0.38 / 2600ms | 36.2 | 0.00 | 6.00 | 6.00% | 15.0 | 22.0 | ×1.65 | ramp +65.0% atk, shield 28.0%/14.0s |
| Volcanic | Obsidian Tortoise | Spiker | 1700 | 100 | 0.33 / 3000ms | 33.3 | 0.00 | 8.00 | 0.00% | 15.0 | 20.0 | ×2.20 | cadence 4→×2.20, ramp +80.0% atk |
| Wasteland | Plague Hound | Bruiser | 800 | 76.0 | 0.67 / 1500ms | 50.7 | 36.4 | 0.00 | 0.00% | 12.0 | 70.0 | ×1.00 | dot 36.4/s×5, charge ×2.50 |
| Wasteland | Charnel Brute | DoT | 1800 | 90.0 | 0.31 / 3200ms | 28.1 | 50.0 | 16.0 | 8.00% | 15.0 | 18.0 | ×2.40 | dot 50.0/s×5, cadence 4→×2.40 |
| Wasteland | Bone Crawler | Bruiser | 520 | 54.0 | 0.83 / 1200ms | 45.0 | 30.0 | 0.00 | 0.00% | 12.0 | 78.0 | ×1.00 | dot 30.0/s×5 |
| Wasteland | Carrion Vulture | Bruiser | 680 | 64.0 | 0.59 / 1700ms | 37.6 | 35.0 | 0.00 | 0.00% | 200 | 46.0 | ×1.00 | dot 35.0/s×5 |
| Wasteland | Bone Rat | Bruiser | 400 | 46.0 | 1.05 / 950ms | 48.4 | 18.0 | 0.00 | 0.00% | 12.0 | 92.0 | ×1.00 | dot 18.0/s×3 |
| Wasteland | Gravewright | DoT | 720 | 40.0 | 0.53 / 1900ms | 21.1 | 24.0 | 0.00 | 0.00% | 200 | 40.0 | ×1.00 | dot 24.0/s×4 |
