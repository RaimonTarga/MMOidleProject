# MMO Idle Monster Balance Packet - Biome Tier 3

Generated from `tools/mob-report.ts --llm-packet`. Markdown only. Companion to the DPS and eHP packets.

## Assumptions / Omissions

- Monster-centric: subject is the world's offence and durability, bucketed by biome tier 3.
- Reference players are tier 4 (a player of tier P fights biome tier P-1). Defensive stats are averaged over spec-agnostic class builds × armor × recovery; the boss-ready profile biases to the tankiest armor.
- Reference player DPS is **direct-hit only** (class empowered/cadence/DoT mechanics omitted) → boss TTK is an UPPER bound. Shields/soft-caps extend TTK further. Cross-check the DPS packet for real clear speed.
- TTL pressure = player maxHP ÷ incoming DPS with **no player recovery** (that lives in the eHP packet). Incoming DPS folds plating/DR/averaged evasion; player DoT-resistance is not applied here.
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 22 mobs; tier avg HP 690, avg total DPS 25.5.

## Reference Players

| Player | Gear | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Entry (prev-tier +3) | T3 +3 | 295 | 37.1 | 11.5% | 13.7% | 151 | 1.02 |
| Same-tier +0 | T4 +0 | 299 | 37.0 | 11.2% | 11.6% | 165 | 0.96 |
| Same-tier +3 | T4 +3 | 400 | 58.9 | 11.8% | 12.0% | 252 | 0.96 |
| Boss-ready (tankiest +3) | T4 +3 | 465 | 57.4 | 6.39% | 6.78% | 252 | 0.96 |


## Player Matchup Summary

_Each biome's average mob (sustained pressure) vs the four reference players, with worst-spike %HP from the biome's hardest-spiking individual mob. Incoming DPS folds plating/DR/evasion; TTL = maxHP ÷ incoming (no player recovery — see eHP packet). Status: Safe/Risky/Blocked (mob risk<30s, block<10s, ≥50% spike = Risky, one-shot = Blocked)._

| Biome | Player | Incoming DPS | Worst spike %HP | TTL pressure | Status |
| --- | --- | --- | --- | --- | --- |
| Caverns | Entry (prev-tier +3) | 10.8 | 15.3% (Cavern Troll) | 27.4s | Risky |
| Caverns | Same-tier +0 | 10.8 | 15.1% (Cavern Troll) | 27.7s | Risky |
| Caverns | Same-tier +3 | 4.08 | 6.50% (Cavern Troll) | 98.0s | Safe |
| Caverns | Boss-ready (tankiest +3) | 4.82 | 6.23% (Cavern Troll) | 96.6s | Safe |
| Desert | Entry (prev-tier +3) | 1.75 | 7.47% (Gilded Scarab) | 169s | Safe |
| Desert | Same-tier +0 | 1.75 | 7.36% (Gilded Scarab) | 171s | Safe |
| Desert | Same-tier +3 | 0.44 | 0.75% (Gilded Scarab) | 914s | Safe |
| Desert | Boss-ready (tankiest +3) | 0.44 | 0.86% (Gilded Scarab) | 1048s | Safe |
| Jungle | Entry (prev-tier +3) | 1.81 | 6.45% (Silverback) | 163s | Safe |
| Jungle | Same-tier +0 | 1.81 | 6.36% (Silverback) | 165s | Safe |
| Jungle | Same-tier +3 | 1.81 | 0.25% (Jungle Stalker) | 221s | Safe |
| Jungle | Boss-ready (tankiest +3) | 1.82 | 0.21% (Jungle Stalker) | 256s | Safe |
| Mountain | Entry (prev-tier +3) | 11.1 | 17.3% (Mountain Colossus) | 26.5s | Risky |
| Mountain | Same-tier +0 | 11.2 | 17.4% (Mountain Colossus) | 26.8s | Risky |
| Mountain | Same-tier +3 | 5.28 | 8.00% (Mountain Colossus) | 75.8s | Safe |
| Mountain | Boss-ready (tankiest +3) | 6.25 | 7.52% (Mountain Colossus) | 74.5s | Safe |
| Swamp | Entry (prev-tier +3) | 30.4 | 0.34% (Plague-Shell Snapper) | 9.69s | Blocked |
| Swamp | Same-tier +0 | 30.4 | 0.33% (Plague-Shell Snapper) | 9.83s | Blocked |
| Swamp | Same-tier +3 | 30.4 | 0.25% (Plague-Shell Snapper) | 13.2s | Risky |
| Swamp | Boss-ready (tankiest +3) | 30.4 | 0.21% (Plague-Shell Snapper) | 15.3s | Risky |
| Tundra | Entry (prev-tier +3) | 3.74 | 8.14% (Glacier Bear) | 78.8s | Safe |
| Tundra | Same-tier +0 | 4.10 | 8.03% (Glacier Bear) | 73.0s | Safe |
| Tundra | Same-tier +3 | 0.34 | 1.25% (Glacier Bear) | 1173s | Safe |
| Tundra | Boss-ready (tankiest +3) | 0.35 | 1.29% (Glacier Bear) | 1346s | Safe |
| Volcanic | Entry (prev-tier +3) | 0.49 | 18.3% (Magma Tortoise) | 597s | Safe |
| Volcanic | Same-tier +0 | 0.50 | 18.1% (Magma Tortoise) | 603s | Safe |
| Volcanic | Same-tier +3 | 0.49 | 8.75% (Magma Tortoise) | 808s | Safe |
| Volcanic | Boss-ready (tankiest +3) | 0.50 | 8.16% (Magma Tortoise) | 927s | Safe |

## Biome Threat Summary

_Per-biome aggregates for biome tier 3. "Hardest hitter" uses raw direct DPS; "tankiest" weights plating ×8 against HP._

| Biome | Mobs | Avg HP | Avg DPS | Avg atk | Avg APS | Avg DoT/s | Hardest | Fastest | Tankiest | DoT-heavy | Biggest spike | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | 3 | 1250 | 23.7 | 63.3 | 0.42 | 8.00 | Deep Spider | Deep Spider | Cavern Troll | Deep Spider | Cavern Troll ×1.00 | density 8; 1/3 carry DoT |
| Desert | 3 | 587 | 20.3 | 42.0 | 0.46 | 0.00 | Gilded Scarab | Gilded Scarab | Desert Basilisk | - | Gilded Scarab ×1.00 | density 8; 0/3 carry DoT |
| Jungle | 3 | 473 | 21.3 | 29.3 | 0.76 | 3.33 | Jungle Stalker | Jungle Stalker | Silverback | Jungle Stalker | Silverback ×1.45 | density 20; 1/3 carry DoT |
| Mountain | 3 | 730 | 23.9 | 79.7 | 0.31 | 0.00 | Mountain Colossus | Avalanche Ram | Mountain Colossus | - | Mountain Colossus ×1.00 | density 12; 0/3 carry DoT |
| Swamp | 3 | 680 | 12.1 | 28.0 | 0.43 | 32.3 | Mire Hex Spitter | Plague-Shell Snapper | Plague-Shell Snapper | Plague-Shell Snapper | Mire Hex Spitter ×1.00 | density 10; 3/3 carry DoT |
| Tundra | 3 | 653 | 17.3 | 50.0 | 0.35 | 0.00 | Glacier Bear | Frost Lurker | Glacier Bear | - | Glacier Bear ×1.00 | density 8; 0/3 carry DoT |
| Volcanic | 4 | 515 | 18.4 | 36.0 | 0.56 | 0.00 | Cinder Hound | Cinder Hound | Magma Tortoise | - | Magma Tortoise ×1.75 | density 18; 0/4 carry DoT |

## Boss / Elite Table

_Bosses for biome tier 3 vs the boss-ready reference player (T4 +3). TTK is an UPPER bound from direct-hit DPS only (class empowered/DoT mechanics omitted; shields/soft-caps extend it). TTL is player survival with no recovery modeled._

| Boss | Biome | HP | Attack profile | Raw DPS | Spike | Defenses | Expected TTK | Player TTL | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deep-Core Burrow-Gorger | Caverns | 5400 | 120 @ 0.22 aps | 26.7 | ×1.80 | plate 16.0, DR 15.0% | 27.4s | 35.8s | Safe | - |
| Dune-Carapace Monarch | Desert | 5000 | 120 @ 0.33 aps | 40.0 | ×1.60 | plate 10.0, DR 8.00% | 22.9s | 23.9s | Safe | - |
| Apex Bramble-Slasher | Jungle | 4900 | 64.0 @ 0.67 aps | 42.7 | ×1.40 | plate 0.00, DR 3.00% | 20.5s | 117s | Safe | - |
| Crag-Gorged Horn-Behemoth | Mountain | 5200 | 125 @ 0.24 aps | 29.8 | ×2.20 | plate 12.0, DR 5.00% | 23.2s | 31.3s | Safe | - |
| Rot-Spore Croc-Behemoth | Swamp | 5000 | 32.0 @ 0.29 aps | 57.4 | ×4.00 | plate 8.00, DR 10.0% | 23.2s | 9.64s | Risky | - |
| Frost-Plated Rime-Mammoth | Tundra | 5400 | 125 @ 0.24 aps | 29.8 | ×1.80 | plate 12.0, DR 12.0%, shield 18.0% | 26.0s | 31.3s | Safe | TTK undercounted (shield/softcap) |
| Cinder-Shell Magma-Salamander | Volcanic | 4800 | 110 @ 0.33 aps | 36.7 | ×2.00 | plate 8.00, DR 4.00% | 20.9s | 28.7s | Safe | - |

## Outlier Summary

_Mobs >±25% of biome-tier average on HP / raw DPS / spike; bosses outside the TTK/TTL sanity bands; biomes with weak or single-typed threat profiles._

| Flag | Subject | Detail |
| --- | --- | --- |
| HP > +25% tier avg | Deep Spider | 1000 vs avg 690 (×1.45) |
| Raw DPS > +25% tier avg | Deep Spider | 28.0 vs avg 19.5 (×1.43) |
| HP > +25% tier avg | Cavern Troll | 1600 vs avg 690 (×2.32) |
| Raw DPS > +25% tier avg | Cavern Troll | 24.4 vs avg 19.5 (×1.25) |
| Spike > +25% tier avg | Cavern Troll | 88.0 vs avg 51.4 (×1.71) |
| HP > +25% tier avg | Crystal Gargoyle | 1150 vs avg 690 (×1.67) |
| Spike < -25% tier avg | Dune Stalker | 38.0 vs avg 51.4 (×0.74) |
| HP > +25% tier avg | Desert Basilisk | 900 vs avg 690 (×1.30) |
| Raw DPS < -25% tier avg | Desert Basilisk | 9.29 vs avg 19.5 (×0.48) |
| Spike < -25% tier avg | Desert Basilisk | 26.0 vs avg 51.4 (×0.51) |
| HP < -25% tier avg | Gilded Scarab | 340 vs avg 690 (×0.49) |
| Raw DPS > +25% tier avg | Gilded Scarab | 32.6 vs avg 19.5 (×1.67) |
| HP < -25% tier avg | Jungle Stalker | 440 vs avg 690 (×0.64) |
| Raw DPS > +25% tier avg | Jungle Stalker | 26.0 vs avg 19.5 (×1.33) |
| Spike < -25% tier avg | Jungle Stalker | 26.0 vs avg 51.4 (×0.51) |
| HP < -25% tier avg | Canopy Chameleon | 400 vs avg 690 (×0.58) |
| Spike < -25% tier avg | Canopy Chameleon | 22.0 vs avg 51.4 (×0.43) |
| HP > +25% tier avg | Mountain Colossus | 870 vs avg 690 (×1.26) |
| Raw DPS > +25% tier avg | Mountain Colossus | 25.0 vs avg 19.5 (×1.28) |
| Spike > +25% tier avg | Mountain Colossus | 95.0 vs avg 51.4 (×1.85) |
| Raw DPS > +25% tier avg | Avalanche Ram | 24.6 vs avg 19.5 (×1.26) |
| Spike > +25% tier avg | Crag Mortar | 80.0 vs avg 51.4 (×1.56) |
| Raw DPS < -25% tier avg | Plague-Shell Snapper | 11.8 vs avg 19.5 (×0.61) |
| Spike < -25% tier avg | Plague-Shell Snapper | 26.0 vs avg 51.4 (×0.51) |
| HP < -25% tier avg | Mire Hex Spitter | 500 vs avg 690 (×0.72) |
| Raw DPS < -25% tier avg | Mire Hex Spitter | 13.6 vs avg 19.5 (×0.70) |
| Spike < -25% tier avg | Mire Hex Spitter | 30.0 vs avg 51.4 (×0.58) |
| Raw DPS < -25% tier avg | Bog Lurker | 10.8 vs avg 19.5 (×0.55) |
| Spike < -25% tier avg | Bog Lurker | 28.0 vs avg 51.4 (×0.54) |
| HP > +25% tier avg | Glacier Bear | 880 vs avg 690 (×1.28) |
| HP < -25% tier avg | Ember Scuttler | 380 vs avg 690 (×0.55) |
| Spike < -25% tier avg | Ember Scuttler | 38.4 vs avg 51.4 (×0.75) |
| HP < -25% tier avg | Cinder Hound | 460 vs avg 690 (×0.67) |
| Spike > +25% tier avg | Magma Tortoise | 98.0 vs avg 51.4 (×1.91) |
| HP < -25% tier avg | Ash Salamander | 420 vs avg 690 (×0.61) |
| biome single-type | Desert | 100% Direct damage |
| biome single-type | Mountain | 100% Direct damage |
| biome single-type | Swamp | 100% DoT damage |
| biome single-type | Tundra | 100% Direct damage |
| biome single-type | Volcanic | 100% Direct damage |

## Mob Stat Summary

_Every non-boss spawn in biome tier 3, sorted by raw total DPS within each biome. Raw DPS is pre-mitigation (attack × APS); DoT/s assumes full refreshed stacks._

| Biome | Mob | Role | HP | Attack | APS / CD | Raw DPS | DoT/s | Plating | DR | Range | Speed | Spike | Specials |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | Deep Spider | Evasive | 1000 | 42.0 | 0.67 / 1500ms | 28.0 | 24.0 | 0.00 | 8.00% | 12.0 | 70.0 | ×1.00 | dot 24.0/s×3, evasion 25.0% |
| Caverns | Cavern Troll | Bruiser | 1600 | 88.0 | 0.28 / 3600ms | 24.4 | 0.00 | 4.00 | 15.0% | 15.0 | 14.0 | ×1.00 | charge ×2.00 |
| Caverns | Crystal Gargoyle | Bruiser | 1150 | 60.0 | 0.31 / 3200ms | 18.8 | 0.00 | 3.00 | 10.0% | 210 | 20.0 | ×1.00 | - |
| Desert | Gilded Scarab | Bruiser | 340 | 62.0 | 0.53 / 1900ms | 32.6 | 0.00 | 0.00 | 0.00% | 220 | 52.0 | ×1.00 | slow ×0.60 |
| Desert | Dune Stalker | Bruiser | 520 | 38.0 | 0.50 / 2000ms | 19.0 | 0.00 | 0.00 | 8.00% | 12.0 | 56.0 | ×1.00 | slow ×0.50 |
| Desert | Desert Basilisk | Bruiser | 900 | 26.0 | 0.36 / 2800ms | 9.29 | 0.00 | 0.00 | 15.0% | 12.0 | 26.0 | ×1.00 | root |
| Jungle | Jungle Stalker | Bruiser | 440 | 26.0 | 1.00 / 1000ms | 26.0 | 10.0 | 0.00 | 0.00% | 12.0 | 78.0 | ×1.00 | dot 10.0/s×3 |
| Jungle | Silverback | Bruiser | 580 | 40.0 | 0.56 / 1800ms | 22.2 | 0.00 | 0.00 | 5.00% | 12.0 | 60.0 | ×1.45 | ramp +45.0% atk, charge ×2.80 |
| Jungle | Canopy Chameleon | Bruiser | 400 | 22.0 | 0.71 / 1400ms | 15.7 | 0.00 | 0.00 | 0.00% | 190 | 52.0 | ×1.00 | - |
| Mountain | Mountain Colossus | Bruiser | 870 | 95.0 | 0.26 / 3800ms | 25.0 | 0.00 | 0.00 | 0.00% | 15.0 | 16.0 | ×1.00 | charge ×2.50 |
| Mountain | Avalanche Ram | Bruiser | 620 | 64.0 | 0.38 / 2600ms | 24.6 | 0.00 | 0.00 | 0.00% | 12.0 | 38.0 | ×1.00 | charge ×2.50 |
| Mountain | Crag Mortar | Bruiser | 700 | 80.0 | 0.28 / 3600ms | 22.2 | 0.00 | 0.00 | 0.00% | 250 | 30.0 | ×1.00 | - |
| Swamp | Plague-Shell Snapper | DoT | 820 | 26.0 | 0.45 / 2200ms | 11.8 | 42.0 | 0.00 | 12.0% | 15.0 | 26.0 | ×1.00 | dot 42.0/s×6 |
| Swamp | Bog Lurker | DoT | 720 | 28.0 | 0.38 / 2600ms | 10.8 | 30.0 | 0.00 | 14.0% | 12.0 | 30.0 | ×1.00 | dot 30.0/s×5, evasion 25.0% |
| Swamp | Mire Hex Spitter | DoT | 500 | 30.0 | 0.45 / 2200ms | 13.6 | 25.0 | 0.00 | 0.00% | 200 | 36.0 | ×1.00 | dot 25.0/s×5 |
| Tundra | Glacier Bear | Bruiser | 880 | 64.0 | 0.31 / 3200ms | 20.0 | 0.00 | 0.00 | 14.0% | 15.0 | 22.0 | ×1.00 | debuff-ramp slow/atk, shield 20.0%/11.0s |
| Tundra | Rime Caster | Bruiser | 520 | 46.0 | 0.36 / 2800ms | 16.4 | 0.00 | 0.00 | 8.00% | 200 | 30.0 | ×1.00 | slow ×0.60 |
| Tundra | Frost Lurker | Bruiser | 560 | 40.0 | 0.38 / 2600ms | 15.4 | 0.00 | 0.00 | 10.0% | 12.0 | 26.0 | ×1.00 | slow ×0.50 |
| Volcanic | Cinder Hound | Bruiser | 460 | 30.0 | 0.77 / 1300ms | 23.1 | 0.00 | 3.00 | 0.00% | 12.0 | 70.0 | ×1.60 | ramp +60.0% atk, charge ×2.50 |
| Volcanic | Magma Tortoise | Bruiser | 800 | 56.0 | 0.33 / 3000ms | 18.7 | 0.00 | 6.00 | 0.00% | 15.0 | 22.0 | ×1.75 | ramp +75.0% atk |
| Volcanic | Ash Salamander | Bruiser | 420 | 34.0 | 0.50 / 2000ms | 17.0 | 0.00 | 2.00 | 0.00% | 180 | 44.0 | ×1.50 | ramp +50.0% atk |
| Volcanic | Ember Scuttler | Bruiser | 380 | 24.0 | 0.63 / 1600ms | 15.0 | 0.00 | 2.00 | 0.00% | 12.0 | 64.0 | ×1.60 | ramp +60.0% atk |
