# MMO Idle Monster Balance Packet - Biome Tier 4

Generated from `tools/mob-report.ts --llm-packet`. Markdown only. Companion to the DPS and eHP packets.

## Assumptions / Omissions

- Monster-centric: subject is the world's offence and durability, bucketed by biome tier 4.
- Reference players are tier 4 (a player of tier P fights biome tier P-1); **no tier-5 gear authored yet, best-available T4 used as the reference**. Defensive stats are averaged over spec-agnostic class builds × armor × recovery; the boss-ready profile biases to the tankiest armor.
- Reference player DPS is **direct-hit only** (class empowered/cadence/DoT mechanics omitted) → boss TTK is an UPPER bound. Shields/soft-caps extend TTK further. Cross-check the DPS packet for real clear speed.
- TTL pressure = player maxHP ÷ incoming DPS with **no player recovery** (that lives in the eHP packet). Incoming DPS folds plating/DR/averaged evasion; player DoT-resistance is not applied here.
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 29 mobs; tier avg HP 1538, avg total DPS 48.8.

## Reference Players

| Player | Gear | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Entry (prev-tier +3) | T3 +3 | 294 | 37.1 | 11.7% | 13.7% | 145 | 1.06 |
| Same-tier +0 | T4 +0 | 299 | 37.0 | 11.4% | 11.6% | 165 | 0.96 |
| Same-tier +3 | T4 +3 | 400 | 58.9 | 12.0% | 12.0% | 252 | 0.96 |
| Boss-ready (tankiest +3) | T4 +3 | 465 | 57.4 | 6.56% | 6.78% | 252 | 0.96 |


## Player Matchup Summary

_Each biome's average mob (sustained pressure) vs the four reference players, with worst-spike %HP from the biome's hardest-spiking individual mob. Incoming DPS folds plating/DR/evasion; TTL = maxHP ÷ incoming (no player recovery — see eHP packet). Status: Safe/Risky/Blocked (mob risk<30s, block<10s, ≥50% spike = Risky, one-shot = Blocked). ⚠ No tier-5 gear authored; using best-available T4 as reference._

| Biome | Player | Incoming DPS | Worst spike %HP | TTL pressure | Status |
| --- | --- | --- | --- | --- | --- |
| Deep-Sea Trench | Entry (prev-tier +3) | 26.3 | 88.0% (Abyssal Serpent) | 11.2s | Risky |
| Deep-Sea Trench | Same-tier +0 | 26.4 | 87.1% (Abyssal Serpent) | 11.3s | Risky |
| Deep-Sea Trench | Same-tier +3 | 20.6 | 59.8% (Abyssal Serpent) | 19.4s | Risky |
| Deep-Sea Trench | Boss-ready (tankiest +3) | 22.5 | 54.8% (Abyssal Serpent) | 20.7s | Risky |
| Desert | Entry (prev-tier +3) | 16.2 | 62.9% (Dune Tyrant) | 18.2s | Risky |
| Desert | Same-tier +0 | 16.7 | 62.3% (Dune Tyrant) | 17.9s | Risky |
| Desert | Same-tier +3 | 8.90 | 41.3% (Dune Tyrant) | 44.9s | Safe |
| Desert | Boss-ready (tankiest +3) | 10.2 | 38.1% (Dune Tyrant) | 45.5s | Safe |
| Graveyard | Entry (prev-tier +3) | 45.2 | 53.7% (Charnel Brute) | 6.51s | Blocked |
| Graveyard | Same-tier +0 | 45.3 | 53.3% (Charnel Brute) | 6.59s | Blocked |
| Graveyard | Same-tier +3 | 33.8 | 34.5% (Charnel Brute) | 11.8s | Risky |
| Graveyard | Boss-ready (tankiest +3) | 35.0 | 31.8% (Charnel Brute) | 13.3s | Risky |
| Jungle | Entry (prev-tier +3) | 28.2 | 34.3% (Emerald Constrictor) | 10.4s | Risky |
| Jungle | Same-tier +0 | 28.2 | 34.2% (Emerald Constrictor) | 10.6s | Risky |
| Jungle | Same-tier +3 | 16.1 | 20.5% (Emerald Constrictor) | 24.9s | Risky |
| Jungle | Boss-ready (tankiest +3) | 17.5 | 18.9% (Emerald Constrictor) | 26.6s | Risky |
| Mountain | Entry (prev-tier +3) | 23.9 | 81.9% (Granite Mammoth) | 12.3s | Risky |
| Mountain | Same-tier +0 | 24.2 | 81.1% (Granite Mammoth) | 12.3s | Risky |
| Mountain | Same-tier +3 | 18.4 | 55.3% (Granite Mammoth) | 21.7s | Risky |
| Mountain | Boss-ready (tankiest +3) | 20.1 | 50.8% (Granite Mammoth) | 23.1s | Risky |
| Tundra | Entry (prev-tier +3) | 16.6 | 78.8% (Permafrost Behemoth) | 17.7s | Risky |
| Tundra | Same-tier +0 | 16.7 | 78.1% (Permafrost Behemoth) | 17.9s | Risky |
| Tundra | Same-tier +3 | 11.2 | 53.1% (Permafrost Behemoth) | 35.6s | Risky |
| Tundra | Boss-ready (tankiest +3) | 12.2 | 48.8% (Permafrost Behemoth) | 38.0s | Safe |
| Volcanic | Entry (prev-tier +3) | 23.0 | 55.0% (Obsidian Tortoise) | 12.8s | Risky |
| Volcanic | Same-tier +0 | 23.6 | 54.3% (Obsidian Tortoise) | 12.7s | Risky |
| Volcanic | Same-tier +3 | 14.0 | 35.5% (Obsidian Tortoise) | 28.6s | Risky |
| Volcanic | Boss-ready (tankiest +3) | 15.6 | 32.7% (Obsidian Tortoise) | 29.8s | Risky |

## Biome Threat Summary

_Per-biome aggregates for biome tier 4. "Hardest hitter" uses raw direct DPS; "tankiest" weights plating ×8 against HP._

| Biome | Mobs | Avg HP | Avg DPS | Avg atk | Avg APS | Avg DoT/s | Hardest | Fastest | Tankiest | DoT-heavy | Biggest spike | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deep-Sea Trench | 3 | 3233 | 42.1 | 137 | 0.31 | 0.00 | Abyssal Serpent | Abyssal Serpent | Elder Leviathan | - | Abyssal Serpent ×2.50 | density 5; 0/3 carry DoT |
| Desert | 4 | 1390 | 36.1 | 85.0 | 0.43 | 0.00 | Sand Viper | Sand Viper | Dune Tyrant | - | Dune Tyrant ×2.80 | density 8; 0/4 carry DoT |
| Graveyard | 5 | 840 | 42.0 | 66.0 | 0.69 | 28.8 | Plague Hound | Plague Rat | Charnel Brute | Charnel Brute | Charnel Brute ×2.40 | density 20; 4/5 carry DoT |
| Jungle | 4 | 1113 | 46.6 | 71.0 | 0.67 | 15.0 | Hunting Panther | Hunting Panther | Emerald Constrictor | Thornback Lizard | Emerald Constrictor ×2.00 | density 15; 2/4 carry DoT |
| Mountain | 4 | 1713 | 39.9 | 131 | 0.31 | 0.00 | Avalanche Tyrant | Avalanche Tyrant | Cragback Rhino | - | Granite Mammoth ×2.00 | density 10; 0/4 carry DoT |
| Tundra | 4 | 1800 | 30.4 | 103 | 0.30 | 0.00 | Rime-Tusk Mastodon | Hoarfrost Yeti | Permafrost Behemoth | - | Permafrost Behemoth ×3.00 | density 8; 0/4 carry DoT |
| Volcanic | 5 | 1328 | 42.5 | 81.6 | 0.55 | 10.0 | Infernal Direhound | Ember Skink | Magma Salamander | Ashspitter Salamander | Obsidian Tortoise ×2.20 | density 18; 2/5 carry DoT |

## Boss / Elite Table

_Bosses for biome tier 4 vs the boss-ready reference player (T4 +3). TTK is an UPPER bound from direct-hit DPS only (class empowered/DoT mechanics omitted; shields/soft-caps extend it). TTL is player survival with no recovery modeled._

| Boss | Biome | HP | Attack profile | Raw DPS | Spike | Defenses | Expected TTK | Player TTL | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Elder Trench Serpent | Deep-Sea Trench | 9500 | 110 @ 0.31 aps | 34.4 | ×2.50 | plate 20.0, DR 22.0%, shield 28.0% | 53.1s | 30.6s | Safe | TTK undercounted (shield/softcap) |
| Dune-Throne Sovereign | Desert | 7800 | 142 @ 0.36 aps | 50.7 | ×1.80 | plate 8.00, DR 8.00% | 35.4s | 16.6s | Risky | - |
| Charnel-Crown Sovereign | Graveyard | 8500 | 88.0 @ 0.43 aps | 80.3 | ×1.60 | plate 14.0, DR 8.00% | 39.4s | 8.53s | Risky | - |
| Verdant-Crown Predator | Jungle | 8000 | 90.0 @ 0.71 aps | 94.3 | ×2.10 | plate 0.00, DR 4.00%, evasion 25.0% | 33.7s | 9.07s | Risky | - |
| Iron-Crest Titan | Mountain | 8500 | 175 @ 0.24 aps | 41.7 | ×2.20 | plate 14.0, DR 6.00% | 38.7s | 17.9s | Risky | - |
| Glacial Patriarch | Tundra | 10000 | 145 @ 0.22 aps | 32.2 | ×1.80 | plate 22.0, DR 14.0% | 51.2s | 25.7s | Safe | - |
| Caldera Sovereign | Volcanic | 9000 | 100 @ 0.38 aps | 78.5 | ×2.00 | plate 10.0, DR 5.00% | 39.8s | 8.42s | Risky | - |

## Outlier Summary

_Mobs >±25% of biome-tier average on HP / raw DPS / spike; bosses outside the TTK/TTL sanity bands; biomes with weak or single-typed threat profiles._

| Flag | Subject | Detail |
| --- | --- | --- |
| HP > +25% tier avg | Abyssal Serpent | 3000 vs avg 1538 (×1.95) |
| Spike > +25% tier avg | Abyssal Serpent | 330 vs avg 158 (×2.09) |
| HP > +25% tier avg | Hadal Stalker | 2500 vs avg 1538 (×1.63) |
| Spike > +25% tier avg | Hadal Stalker | 302 vs avg 158 (×1.92) |
| HP > +25% tier avg | Elder Leviathan | 4200 vs avg 1538 (×2.73) |
| Spike > +25% tier avg | Elder Leviathan | 304 vs avg 158 (×1.93) |
| HP < -25% tier avg | Sand Viper | 980 vs avg 1538 (×0.64) |
| Spike < -25% tier avg | Sand Viper | 78.0 vs avg 158 (×0.49) |
| Spike < -25% tier avg | Dune Basilisk | 90.0 vs avg 158 (×0.57) |
| HP < -25% tier avg | Sandspitter Cobra | 930 vs avg 1538 (×0.60) |
| Spike < -25% tier avg | Sandspitter Cobra | 84.0 vs avg 158 (×0.53) |
| HP > +25% tier avg | Dune Tyrant | 2200 vs avg 1538 (×1.43) |
| Raw DPS < -25% tier avg | Dune Tyrant | 25.1 vs avg 40.0 (×0.63) |
| Spike > +25% tier avg | Dune Tyrant | 246 vs avg 158 (×1.56) |
| HP < -25% tier avg | Bone Crawler | 520 vs avg 1538 (×0.34) |
| Spike < -25% tier avg | Bone Crawler | 54.0 vs avg 158 (×0.34) |
| HP < -25% tier avg | Plague Hound | 800 vs avg 1538 (×0.52) |
| Raw DPS > +25% tier avg | Plague Hound | 50.7 vs avg 40.0 (×1.27) |
| Spike < -25% tier avg | Plague Hound | 76.0 vs avg 158 (×0.48) |
| HP < -25% tier avg | Carrion Vulture | 680 vs avg 1538 (×0.44) |
| Spike < -25% tier avg | Carrion Vulture | 64.0 vs avg 158 (×0.41) |
| Raw DPS < -25% tier avg | Charnel Brute | 28.1 vs avg 40.0 (×0.70) |
| Spike > +25% tier avg | Charnel Brute | 216 vs avg 158 (×1.37) |
| HP < -25% tier avg | Plague Rat | 400 vs avg 1538 (×0.26) |
| Spike < -25% tier avg | Plague Rat | 46.0 vs avg 158 (×0.29) |
| HP < -25% tier avg | Hunting Panther | 800 vs avg 1538 (×0.52) |
| Spike < -25% tier avg | Hunting Panther | 60.0 vs avg 158 (×0.38) |
| Spike < -25% tier avg | Apex Silverback | 88.0 vs avg 158 (×0.56) |
| HP < -25% tier avg | Thornback Lizard | 850 vs avg 1538 (×0.55) |
| Spike < -25% tier avg | Thornback Lizard | 60.0 vs avg 158 (×0.38) |
| Spike > +25% tier avg | Granite Mammoth | 310 vs avg 158 (×1.97) |
| HP > +25% tier avg | Cragback Rhino | 2250 vs avg 1538 (×1.46) |
| Raw DPS < -25% tier avg | Cragback Rhino | 25.0 vs avg 40.0 (×0.62) |
| Spike > +25% tier avg | Cragback Rhino | 304 vs avg 158 (×1.93) |
| Spike > +25% tier avg | Rime-Tusk Mastodon | 240 vs avg 158 (×1.52) |
| Spike < -25% tier avg | Glacial Dire-Bear | 105 vs avg 158 (×0.67) |
| HP < -25% tier avg | Hoarfrost Yeti | 1050 vs avg 1538 (×0.68) |
| Raw DPS < -25% tier avg | Hoarfrost Yeti | 29.7 vs avg 40.0 (×0.74) |
| Spike < -25% tier avg | Hoarfrost Yeti | 86.0 vs avg 158 (×0.55) |
| HP > +25% tier avg | Permafrost Behemoth | 2900 vs avg 1538 (×1.89) |
| Raw DPS < -25% tier avg | Permafrost Behemoth | 25.0 vs avg 40.0 (×0.62) |
| Spike > +25% tier avg | Permafrost Behemoth | 300 vs avg 158 (×1.90) |
| HP < -25% tier avg | Ember Skink | 790 vs avg 1538 (×0.51) |
| Spike < -25% tier avg | Ember Skink | 96.0 vs avg 158 (×0.61) |
| HP < -25% tier avg | Infernal Direhound | 1050 vs avg 1538 (×0.68) |
| Raw DPS > +25% tier avg | Infernal Direhound | 57.1 vs avg 40.0 (×1.43) |
| Spike > +25% tier avg | Obsidian Tortoise | 220 vs avg 158 (×1.40) |
| HP < -25% tier avg | Ashspitter Salamander | 900 vs avg 1538 (×0.59) |
| Spike < -25% tier avg | Ashspitter Salamander | 105 vs avg 158 (×0.67) |
| HP > +25% tier avg | Magma Salamander | 2200 vs avg 1538 (×1.43) |
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
| Desert | Sand Viper | Bruiser | 980 | 78.0 | 0.63 / 1600ms | 48.8 | 0.00 | 0.00 | 8.00% | 12.0 | 60.0 | ×1.00 | slow ×0.45 |
| Desert | Sandspitter Cobra | Ranged | 930 | 84.0 | 0.45 / 2200ms | 38.2 | 0.00 | 0.00 | 0.00% | 230 | 38.0 | ×1.00 | slow ×0.60, shield 22.0%/12.0s, ranged, kite |
| Desert | Dune Basilisk | Tank | 1450 | 90.0 | 0.36 / 2800ms | 32.1 | 0.00 | 10.0 | 10.0% | 15.0 | 26.0 | ×1.00 | root |
| Desert | Dune Tyrant | Spiker | 2200 | 88.0 | 0.29 / 3500ms | 25.1 | 0.00 | 8.00 | 8.00% | 15.0 | 20.0 | ×2.80 | slow ×0.40, cooldown 10.0s→×2.80 |
| Graveyard | Plague Hound | Bruiser | 800 | 76.0 | 0.67 / 1500ms | 50.7 | 31.8 | 0.00 | 0.00% | 12.0 | 70.0 | ×1.00 | dot 31.8/s×5, charge ×2.50 |
| Graveyard | Charnel Brute | DoT | 1800 | 90.0 | 0.31 / 3200ms | 28.1 | 45.0 | 16.0 | 8.00% | 15.0 | 18.0 | ×2.40 | dot 45.0/s×5, cadence 4→×2.40 |
| Graveyard | Bone Crawler | Bruiser | 520 | 54.0 | 0.83 / 1200ms | 45.0 | 25.0 | 0.00 | 0.00% | 12.0 | 78.0 | ×1.00 | dot 25.0/s×5 |
| Graveyard | Carrion Vulture | Ranged | 680 | 64.0 | 0.59 / 1700ms | 37.6 | 30.0 | 0.00 | 0.00% | 200 | 46.0 | ×1.00 | dot 30.0/s×5, ranged |
| Graveyard | Plague Rat | Bruiser | 400 | 46.0 | 1.05 / 950ms | 48.4 | 12.0 | 0.00 | 0.00% | 12.0 | 92.0 | ×1.00 | dot 12.0/s×3 |
| Jungle | Emerald Constrictor | Spiker | 1600 | 76.0 | 0.63 / 1600ms | 47.5 | 30.0 | 0.00 | 6.00% | 12.0 | 62.0 | ×2.00 | dot 30.0/s×5, cadence 4→×2.00, evasion 25.0% |
| Jungle | Thornback Lizard | Ranged | 850 | 60.0 | 0.67 / 1500ms | 40.0 | 30.0 | 0.00 | 0.00% | 200 | 50.0 | ×1.00 | dot 30.0/s×5, ranged |
| Jungle | Hunting Panther | Bruiser | 800 | 60.0 | 0.83 / 1200ms | 50.0 | 0.00 | 0.00 | 0.00% | 12.0 | 82.0 | ×1.00 | - |
| Jungle | Apex Silverback | Evasive | 1200 | 88.0 | 0.56 / 1800ms | 48.9 | 0.00 | 0.00 | 5.00% | 12.0 | 54.0 | ×1.00 | evasion 25.0%, charge ×2.80 |
| Mountain | Avalanche Tyrant | Bruiser | 1300 | 122 | 0.40 / 2500ms | 48.8 | 0.00 | 0.00 | 0.00% | 12.0 | 42.0 | ×1.00 | charge ×2.80 |
| Mountain | Granite Mammoth | Spiker | 1900 | 155 | 0.28 / 3600ms | 43.1 | 0.00 | 0.00 | 0.00% | 15.0 | 16.0 | ×2.00 | cadence 4→×2.00, charge ×2.50 |
| Mountain | Cliffside Roc | Ranged | 1400 | 150 | 0.29 / 3500ms | 42.9 | 0.00 | 0.00 | 0.00% | 260 | 34.0 | ×1.00 | ranged, kite |
| Mountain | Cragback Rhino | Spiker | 2250 | 95.0 | 0.26 / 3800ms | 25.0 | 0.00 | 16.0 | 6.00% | 15.0 | 14.0 | ×3.20 | cooldown 10.0s→×3.20, softcap 25.0%×0.50, charge ×2.20 |
| Tundra | Rime-Tusk Mastodon | Spiker | 1400 | 120 | 0.29 / 3500ms | 34.3 | 0.00 | 12.0 | 0.00% | 15.0 | 18.0 | ×2.00 | slow ×0.45, cadence 4→×2.00, charge ×2.30 |
| Tundra | Glacial Dire-Bear | Bruiser | 1850 | 105 | 0.31 / 3200ms | 32.8 | 0.00 | 0.00 | 14.0% | 15.0 | 18.0 | ×1.00 | debuff-ramp slow/atk |
| Tundra | Hoarfrost Yeti | Ranged | 1050 | 86.0 | 0.34 / 2900ms | 29.7 | 0.00 | 0.00 | 8.00% | 220 | 36.0 | ×1.00 | debuff-ramp slow/atk, ranged, kite |
| Tundra | Permafrost Behemoth | Spiker | 2900 | 100 | 0.25 / 4000ms | 25.0 | 0.00 | 20.0 | 12.0% | 15.0 | 12.0 | ×3.00 | cooldown 9.00s→×3.00, softcap 25.0%×0.50, charge ×2.00 |
| Volcanic | Ember Skink | Bruiser | 790 | 64.0 | 0.77 / 1300ms | 49.2 | 20.0 | 2.00 | 0.00% | 12.0 | 70.0 | ×1.50 | dot 20.0/s×4, ramp +50.0% atk |
| Volcanic | Ashspitter Salamander | Ranged | 900 | 70.0 | 0.53 / 1900ms | 36.8 | 30.0 | 2.00 | 0.00% | 190 | 46.0 | ×1.50 | dot 30.0/s×5, ramp +50.0% atk, ranged |
| Volcanic | Infernal Direhound | Bruiser | 1050 | 80.0 | 0.71 / 1400ms | 57.1 | 0.00 | 4.00 | 0.00% | 12.0 | 72.0 | ×1.60 | ramp +60.0% atk, charge ×2.50 |
| Volcanic | Magma Salamander | Bruiser | 2200 | 94.0 | 0.38 / 2600ms | 36.2 | 0.00 | 6.00 | 6.00% | 15.0 | 22.0 | ×1.65 | ramp +65.0% atk, shield 28.0%/14.0s |
| Volcanic | Obsidian Tortoise | Spiker | 1700 | 100 | 0.33 / 3000ms | 33.3 | 0.00 | 8.00 | 0.00% | 15.0 | 20.0 | ×2.20 | cadence 4→×2.20, ramp +80.0% atk |
