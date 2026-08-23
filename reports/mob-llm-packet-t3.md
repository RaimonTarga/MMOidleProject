# MMO Idle Monster Balance Packet - Biome Tier 3

Generated from `tools/mob-report.ts --llm-packet`. Markdown only. Companion to the DPS and eHP packets.

## Assumptions / Omissions

- Player model: weapon, armour, charm and mobility only, plus skill nodes, item upgrades and class affinities. NO core, relic, rune, rite, stance or ability is equipped — the bench bots carry all six, so these numbers are comparable to each other but NOT to bench output in absolute terms.

- Monster-centric: subject is the world's offence and durability, bucketed by biome tier 3.
- Reference players are tier 4 (a player of tier P fights biome tier P-1). Defensive stats are averaged over spec-agnostic class builds × armor × recovery; the boss-ready profile biases to the tankiest armor.
- Reference player DPS uses shared `estimatePlayerDps` across concrete class builds, including full Conduit formations. T3 specialization, abilities, target-state mechanics, and shields/soft-caps remain outside this planning TTK; cross-check the detailed DPS packet for spec-level clear speed.
- TTL pressure = player maxHP ÷ incoming DPS with **no player recovery** (that lives in the eHP packet). Incoming DPS folds plating/DR/averaged evasion; player DoT-resistance is not applied here.
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 21 mobs; tier avg HP 899, avg total DPS 68.3.

## Reference Players

| Player | Gear | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Entry (prev-tier +3) | T3 +3 | 318 | 32.4 | 5.03% | 12.7% | 130 | 0.94 |
| Same-tier +0 | T4 +0 | 341 | 35.1 | 4.09% | 10.6% | 147 | 0.89 |
| Same-tier +3 | T4 +3 | 470 | 57.0 | 4.69% | 11.0% | 224 | 0.89 |
| Boss-ready (tankiest +3) | T4 +3 | 455 | 48.8 | 1.89% | 5.61% | 224 | 0.89 |


## Cross-Biome Threat & Reward

_Every biome at tier 3, ranked by mean incoming DPS against Entry (prev-tier +3). Threat is post-mitigation; spike is the worst individual hit. Rewards are authored per-kill means, not hourly yield. The threat index is relative to this tier's sibling median, not a target._

| Biome | Threat index | Mean HP | Max HP | Mean incoming DPS | Max incoming DPS | Worst spike %HP | Density | Essence / kill | Biome XP / kill |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tundra | ×3.36 | 1110 | 1500 | 98.7 | 111 | 114% (Glacier Bear) | 16 | 46.3 | 278 |
| Volcanic | ×3.00 | 1498 | 2000 | 88.3 | 108 | 92.7% (Magma Tortoise) | 36 | 34.0 | 205 |
| Caverns | ×1.29 | 557 | 700 | 38.0 | 52.9 | 71.0% (Cavern Troll) | 16 | 66.0 | 397 |
| Mountain | ×1.00 | 511 | 610 | 29.4 | 33.5 | 52.6% (Mountain Colossus) | 24 | 60.7 | 360 |
| Desert | ×0.77 | 1350 | 1350 | 22.5 | 31.6 | 24.2% (Desert Basilisk) | 16 | 37.5 | 225 |
| Swamp | ×0.73 | 363 | 400 | 21.6 | 31.8 | 3.14% (Bog Lurker) | 20 | 52.3 | 315 |
| Jungle | ×0.62 | 852 | 1045 | 18.3 | 26.0 | 21.9% (Silverback) | 40 | 29.0 | 175 |

## Cross-Biome Deviation Signals

_Discovery-only signals for values at least 25% from the tier-sibling median. Deliberate outliers are expected; this is neither a pass/fail gate nor a recommended balance band._

| Biome | Axis | Metric | Value | Sibling median | Deviation |
| --- | --- | --- | --- | --- | --- |
| Tundra | Threat | Mean incoming DPS | 98.7 | 29.4 | +236% |
| Tundra | Threat | Max incoming DPS | 111 | 33.5 | +230% |
| Volcanic | Threat | Max incoming DPS | 108 | 33.5 | +223% |
| Volcanic | Threat | Mean incoming DPS | 88.3 | 29.4 | +200% |
| Tundra | Threat | Worst spike %HP | 114% | 52.6% | +117% |
| Jungle | Exposure | Mob density | 40.0 | 20.0 | +100% |
| Swamp | Threat | Worst spike %HP | 3.14% | 52.6% | -94.0% |
| Volcanic | Exposure | Mob density | 36.0 | 20.0 | +80.0% |
| Volcanic | Threat | Worst spike %HP | 92.7% | 52.6% | +76.2% |
| Jungle | Threat | Worst spike %HP | 21.9% | 52.6% | -58.4% |
| Caverns | Threat | Max incoming DPS | 52.9 | 33.5 | +57.8% |
| Desert | Threat | Worst spike %HP | 24.2% | 52.6% | -54.0% |
| Caverns | Reward | Biome XP / kill | 397 | 278 | +42.5% |
| Caverns | Reward | Essence / kill | 66.0 | 46.3 | +42.4% |
| Jungle | Threat | Mean incoming DPS | 18.3 | 29.4 | -37.8% |
| Jungle | Reward | Essence / kill | 29.0 | 46.3 | -37.4% |
| Jungle | Reward | Biome XP / kill | 175 | 278 | -37.1% |
| Caverns | Threat | Worst spike %HP | 71.0% | 52.6% | +35.1% |
| Mountain | Reward | Essence / kill | 60.7 | 46.3 | +30.9% |
| Mountain | Reward | Biome XP / kill | 360 | 278 | +29.3% |
| Caverns | Threat | Mean incoming DPS | 38.0 | 29.4 | +29.2% |
| Volcanic | Reward | Essence / kill | 34.0 | 46.3 | -26.6% |
| Swamp | Threat | Mean incoming DPS | 21.6 | 29.4 | -26.5% |
| Volcanic | Reward | Biome XP / kill | 205 | 278 | -26.3% |

## Player Matchup Summary

_Mean resolved per-mob pressure vs the four reference players, with worst-spike %HP from the biome's hardest-spiking individual mob. Incoming DPS folds plating/DR/evasion; TTL = maxHP ÷ incoming (no player recovery — see eHP packet). Status: Safe/Risky/Blocked (mob risk<30s, block<10s, ≥50% spike = Risky, one-shot = Blocked)._

| Biome | Player | Incoming DPS | Worst spike %HP | TTL pressure | Status |
| --- | --- | --- | --- | --- | --- |
| Caverns | Entry (prev-tier +3) | 38.0 | 71.0% (Cavern Troll) | 8.38s | Blocked |
| Caverns | Same-tier +0 | 37.1 | 64.9% (Cavern Troll) | 9.19s | Blocked |
| Caverns | Same-tier +3 | 26.0 | 35.4% (Cavern Troll) | 18.0s | Risky |
| Caverns | Boss-ready (tankiest +3) | 30.7 | 42.3% (Cavern Troll) | 14.8s | Risky |
| Desert | Entry (prev-tier +3) | 22.5 | 24.2% (Desert Basilisk) | 14.1s | Risky |
| Desert | Same-tier +0 | 21.8 | 22.0% (Desert Basilisk) | 15.6s | Risky |
| Desert | Same-tier +3 | 12.7 | 11.3% (Desert Basilisk) | 36.8s | Safe |
| Desert | Boss-ready (tankiest +3) | 16.9 | 13.9% (Desert Basilisk) | 27.0s | Risky |
| Jungle | Entry (prev-tier +3) | 18.3 | 21.9% (Silverback) | 17.4s | Risky |
| Jungle | Same-tier +0 | 16.9 | 19.6% (Silverback) | 20.2s | Risky |
| Jungle | Same-tier +3 | 5.09 | 7.72% (Silverback) | 92.2s | Safe |
| Jungle | Boss-ready (tankiest +3) | 8.47 | 10.8% (Silverback) | 53.7s | Safe |
| Mountain | Entry (prev-tier +3) | 29.4 | 52.6% (Mountain Colossus) | 10.8s | Risky |
| Mountain | Same-tier +0 | 28.7 | 48.1% (Mountain Colossus) | 11.9s | Risky |
| Mountain | Same-tier +3 | 19.9 | 26.8% (Mountain Colossus) | 23.7s | Risky |
| Mountain | Boss-ready (tankiest +3) | 23.9 | 31.7% (Mountain Colossus) | 19.0s | Risky |
| Swamp | Entry (prev-tier +3) | 21.6 | 3.14% (Bog Lurker) | 14.7s | Risky |
| Swamp | Same-tier +0 | 20.7 | 2.35% (Bog Lurker) | 16.4s | Risky |
| Swamp | Same-tier +3 | 18.8 | 0.21% (Plague-Shell Snapper) | 25.0s | Risky |
| Swamp | Boss-ready (tankiest +3) | 18.8 | 0.22% (Plague-Shell Snapper) | 24.2s | Risky |
| Tundra | Entry (prev-tier +3) | 98.7 | 114% (Glacier Bear) | 3.22s | Blocked |
| Tundra | Same-tier +0 | 99.2 | 107% (Glacier Bear) | 3.43s | Blocked |
| Tundra | Same-tier +3 | 90.8 | 72.6% (Glacier Bear) | 5.17s | Blocked |
| Tundra | Boss-ready (tankiest +3) | 97.7 | 79.0% (Glacier Bear) | 4.65s | Blocked |
| Volcanic | Entry (prev-tier +3) | 88.3 | 92.7% (Magma Tortoise) | 3.60s | Blocked |
| Volcanic | Same-tier +0 | 88.1 | 86.6% (Magma Tortoise) | 3.87s | Blocked |
| Volcanic | Same-tier +3 | 76.1 | 58.1% (Magma Tortoise) | 6.17s | Blocked |
| Volcanic | Boss-ready (tankiest +3) | 83.8 | 63.6% (Magma Tortoise) | 5.42s | Blocked |

## Biome Threat Summary

_Per-biome aggregates for biome tier 3. "Hardest hitter" uses raw direct DPS; "tankiest" weights plating ×8 against HP._

| Biome | Mobs | Avg HP | Avg DPS | Avg atk | Avg APS | Avg DoT/s | Hardest | Fastest | Tankiest | DoT-heavy | Biggest spike | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | 3 | 557 | 45.4 | 89.7 | 0.42 | 12.0 | Cavern Troll | Deep Spider | Cavern Troll | Deep Spider | Cavern Troll ×2.60 | density 16; 1/3 carry DoT |
| Desert | 2 | 1350 | 37.7 | 90.0 | 0.39 | 0.00 | Desert Basilisk | Dune Stalker | Dune Stalker | - | Desert Basilisk ×1.00 | density 16; 0/2 carry DoT |
| Jungle | 3 | 852 | 44.4 | 61.0 | 0.76 | 0.00 | Jungle Stalker | Jungle Stalker | Silverback | - | Jungle Stalker ×2.20 | density 40; 0/3 carry DoT |
| Mountain | 3 | 511 | 45.5 | 109 | 0.31 | 0.00 | Mountain Colossus | Avalanche Ram | Mountain Colossus | - | Mountain Colossus ×1.80 | density 24; 0/3 carry DoT |
| Swamp | 3 | 363 | 17.9 | 40.7 | 0.43 | 18.3 | Mire Hexer | Plague-Shell Snapper | Plague-Shell Snapper | Plague-Shell Snapper | Bog Lurker ×1.00 | density 20; 2/3 carry DoT |
| Tundra | 3 | 1110 | 119 | 324 | 0.35 | 0.00 | Glacier Bear | Frost Lurker | Glacier Bear | - | Glacier Bear ×1.00 | density 16; 0/3 carry DoT |
| Volcanic | 4 | 1498 | 113 | 221 | 0.56 | 0.00 | Cinder Hound | Cinder Hound | Magma Tortoise | - | Magma Tortoise ×1.00 | density 36; 0/4 carry DoT |

## Boss / Elite Table

_Bosses for biome tier 3 vs the boss-ready reference player (T4 +3). TTK uses the shared class-aware planning estimator; T3 specs, abilities, and shields/soft-caps remain unmodeled. TTL is player survival with no recovery modeled._

| Boss | Biome | HP | Attack profile | Raw DPS | Spike | Defenses | Expected TTK | Player TTL | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deep-Core Burrow-Gorger | Caverns | 12895 | 196 @ 0.22 aps | 75.1 | ×1.70 | plate 16.0, DR 15.0% | 61.5s | 8.30s | Risky | - |
| Dune-Carapace Monarch | Desert | 11940 | 196 @ 0.33 aps | 90.7 | ×1.90 | plate 10.0, DR 8.00% | 51.4s | 6.87s | Blocked | kills player fast |
| Apex Bramble-Slasher | Jungle | 11701 | 104 @ 0.67 aps | 84.5 | ×2.50 | plate 0.00, DR 3.00%, evasion 15.0% | 45.4s | 10.4s | Risky | - |
| Crag-Gorged Horn-Behemoth | Mountain | 12418 | 204 @ 0.24 aps | 81.0 | ×2.00 | plate 12.0, DR 5.00% | 52.6s | 7.59s | Blocked | kills player fast |
| Rot-Spore Croc-Behemoth | Swamp | 11940 | 52.0 @ 0.29 aps | 99.2 | ×1.20 | plate 8.00, DR 10.0% | 51.7s | 5.74s | Blocked | kills player fast |
| Frost-Plated Rime-Mammoth | Tundra | 12895 | 204 @ 0.24 aps | 78.5 | ×1.70 | plate 12.0, DR 12.0%, shield 18.0% | 58.3s | 7.83s | Blocked | kills player fast; TTK undercounted (shield/softcap) |
| Cinder-Shell Magma-Salamander | Volcanic | 11462 | 179 @ 0.33 aps | 88.6 | ×1.60 | plate 8.00, DR 4.00% | 47.0s | 7.22s | Blocked | kills player fast |

## Mob / Boss Diagnostic Signals

_Attention signals only: mobs >±25% of biome-tier average on HP / raw DPS / spike, bosses outside the TTK/TTL observation bands, and narrow biome threat profiles. These are not verdicts or balance gates._

| Flag | Subject | Detail |
| --- | --- | --- |
| HP < -25% tier avg | Deep Spider | 450 vs avg 899 (×0.50) |
| Raw DPS < -25% tier avg | Deep Spider | 40.0 vs avg 64.0 (×0.62) |
| Spike < -25% tier avg | Deep Spider | 60.0 vs avg 168 (×0.36) |
| Spike > +25% tier avg | Cavern Troll | 322 vs avg 168 (×1.92) |
| HP < -25% tier avg | Crystal Gargoyle | 520 vs avg 899 (×0.58) |
| Raw DPS < -25% tier avg | Crystal Gargoyle | 44.3 vs avg 64.0 (×0.69) |
| Spike < -25% tier avg | Crystal Gargoyle | 85.0 vs avg 168 (×0.51) |
| HP > +25% tier avg | Dune Stalker | 1350 vs avg 899 (×1.50) |
| Raw DPS < -25% tier avg | Dune Stalker | 27.9 vs avg 64.0 (×0.44) |
| Spike < -25% tier avg | Dune Stalker | 67.0 vs avg 168 (×0.40) |
| HP > +25% tier avg | Desert Basilisk | 1350 vs avg 899 (×1.50) |
| Raw DPS < -25% tier avg | Desert Basilisk | 47.5 vs avg 64.0 (×0.74) |
| Spike < -25% tier avg | Desert Basilisk | 113 vs avg 168 (×0.67) |
| Spike < -25% tier avg | Jungle Stalker | 121 vs avg 168 (×0.72) |
| Raw DPS < -25% tier avg | Silverback | 46.1 vs avg 64.0 (×0.72) |
| Spike < -25% tier avg | Silverback | 120 vs avg 168 (×0.72) |
| Raw DPS < -25% tier avg | Canopy Chameleon | 32.1 vs avg 64.0 (×0.50) |
| Spike < -25% tier avg | Canopy Chameleon | 45.0 vs avg 168 (×0.27) |
| HP < -25% tier avg | Mountain Colossus | 610 vs avg 899 (×0.68) |
| Raw DPS < -25% tier avg | Mountain Colossus | 48.0 vs avg 64.0 (×0.75) |
| Spike > +25% tier avg | Mountain Colossus | 234 vs avg 168 (×1.40) |
| HP < -25% tier avg | Avalanche Ram | 434 vs avg 899 (×0.48) |
| Raw DPS < -25% tier avg | Avalanche Ram | 44.8 vs avg 64.0 (×0.70) |
| HP < -25% tier avg | Crag Mortar | 490 vs avg 899 (×0.55) |
| Raw DPS < -25% tier avg | Crag Mortar | 43.6 vs avg 64.0 (×0.68) |
| HP < -25% tier avg | Plague-Shell Snapper | 400 vs avg 899 (×0.45) |
| Raw DPS < -25% tier avg | Plague-Shell Snapper | 16.8 vs avg 64.0 (×0.26) |
| Spike < -25% tier avg | Plague-Shell Snapper | 37.0 vs avg 168 (×0.22) |
| HP < -25% tier avg | Mire Hexer | 350 vs avg 899 (×0.39) |
| Raw DPS < -25% tier avg | Mire Hexer | 20.4 vs avg 64.0 (×0.32) |
| Spike < -25% tier avg | Mire Hexer | 42.0 vs avg 168 (×0.25) |
| HP < -25% tier avg | Bog Lurker | 340 vs avg 899 (×0.38) |
| Raw DPS < -25% tier avg | Bog Lurker | 16.5 vs avg 64.0 (×0.26) |
| Spike < -25% tier avg | Bog Lurker | 43.0 vs avg 168 (×0.26) |
| Raw DPS > +25% tier avg | Frost Lurker | 99.6 vs avg 64.0 (×1.56) |
| Spike > +25% tier avg | Frost Lurker | 259 vs avg 168 (×1.55) |
| HP > +25% tier avg | Glacier Bear | 1500 vs avg 899 (×1.67) |
| Raw DPS > +25% tier avg | Glacier Bear | 130 vs avg 64.0 (×2.03) |
| Spike > +25% tier avg | Glacier Bear | 415 vs avg 168 (×2.48) |
| Raw DPS > +25% tier avg | Rime Caster | 127 vs avg 64.0 (×1.98) |
| Spike > +25% tier avg | Rime Caster | 356 vs avg 168 (×2.13) |
| HP > +25% tier avg | Ember Scuttler | 1220 vs avg 899 (×1.36) |
| Raw DPS > +25% tier avg | Ember Scuttler | 92.5 vs avg 64.0 (×1.45) |
| HP > +25% tier avg | Cinder Hound | 1440 vs avg 899 (×1.60) |
| Raw DPS > +25% tier avg | Cinder Hound | 142 vs avg 64.0 (×2.21) |
| HP > +25% tier avg | Magma Tortoise | 2000 vs avg 899 (×2.23) |
| Raw DPS > +25% tier avg | Magma Tortoise | 114 vs avg 64.0 (×1.79) |
| Spike > +25% tier avg | Magma Tortoise | 343 vs avg 168 (×2.05) |
| HP > +25% tier avg | Ash Salamander | 1330 vs avg 899 (×1.48) |
| Raw DPS > +25% tier avg | Ash Salamander | 105 vs avg 64.0 (×1.63) |
| high boss lethality | Dune-Carapace Monarch | player TTL 6.87s, spike 60.2% |
| high boss lethality | Crag-Gorged Horn-Behemoth | player TTL 7.59s, spike 66.9% |
| high boss lethality | Rot-Spore Croc-Behemoth | player TTL 5.74s, spike 0.79% |
| high boss lethality | Frost-Plated Rime-Mammoth | player TTL 7.83s, spike 56.8% |
| high boss lethality | Cinder-Shell Magma-Salamander | player TTL 7.22s, spike 45.0% |
| biome single-type | Desert | 100% Direct damage |
| biome single-type | Jungle | 100% Direct damage |
| biome single-type | Mountain | 100% Direct damage |
| biome single-type | Tundra | 100% Direct damage |
| biome single-type | Volcanic | 100% Direct damage |

## Mob Stat Summary

_Every non-boss spawn in biome tier 3, sorted by raw total DPS within each biome. Raw DPS is pre-mitigation (attack × APS); DoT/s assumes full refreshed stacks._

| Biome | Mob | Role | HP | Attack | APS / CD | Raw DPS | DoT/s | Plating | DR | Range | Speed | Spike | Specials |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | Deep Spider | Bruiser | 450 | 60.0 | 0.67 / 1500ms | 40.0 | 36.0 | 0.00 | 8.00% | 12.0 | 70.0 | ×1.00 | dot 36.0/s×3 |
| Caverns | Cavern Troll | Spiker | 700 | 124 | 0.28 / 3600ms | 52.1 | 0.00 | 2.00 | 10.0% | 15.0 | 14.0 | ×2.60 | charge ×2.00 |
| Caverns | Crystal Gargoyle | Bruiser | 520 | 85.0 | 0.31 / 3200ms | 44.3 | 0.00 | 1.00 | 5.00% | 210 | 20.0 | ×1.00 | - |
| Desert | Desert Basilisk | Bruiser | 1350 | 113 | 0.36 / 2800ms | 47.5 | 0.00 | 0.00 | 15.0% | 12.0 | 26.0 | ×1.00 | - |
| Desert | Dune Stalker | Bruiser | 1350 | 67.0 | 0.42 / 2400ms | 27.9 | 0.00 | 0.00 | 8.00% | 12.0 | 30.0 | ×1.00 | slow ×0.50 |
| Jungle | Jungle Stalker | Spiker | 790 | 55.0 | 1.00 / 1000ms | 55.0 | 0.00 | 0.00 | 0.00% | 12.0 | 78.0 | ×2.20 | - |
| Jungle | Silverback | Bruiser | 1045 | 83.0 | 0.56 / 1800ms | 46.1 | 0.00 | 0.00 | 0.00% | 12.0 | 60.0 | ×1.45 | ramp +45.0% atk, charge ×2.80 |
| Jungle | Canopy Chameleon | Bruiser | 720 | 45.0 | 0.71 / 1400ms | 32.1 | 0.00 | 0.00 | 0.00% | 190 | 52.0 | ×1.00 | - |
| Mountain | Mountain Colossus | Spiker | 610 | 130 | 0.26 / 3800ms | 48.0 | 0.00 | 0.00 | 0.00% | 15.0 | 16.0 | ×1.80 | charge ×2.50 |
| Mountain | Avalanche Ram | Bruiser | 434 | 87.0 | 0.38 / 2600ms | 44.8 | 0.00 | 0.00 | 0.00% | 12.0 | 38.0 | ×1.60 | charge ×2.50 |
| Mountain | Crag Mortar | Bruiser | 490 | 109 | 0.28 / 3600ms | 43.6 | 0.00 | 0.00 | 0.00% | 250 | 30.0 | ×1.60 | - |
| Swamp | Plague-Shell Snapper | DoT | 400 | 37.0 | 0.45 / 2200ms | 16.8 | 30.0 | 4.00 | 0.00% | 15.0 | 26.0 | ×1.00 | dot 30.0/s×6 |
| Swamp | Bog Lurker | DoT | 340 | 43.0 | 0.38 / 2600ms | 16.5 | 25.0 | 0.00 | 0.00% | 12.0 | 30.0 | ×1.00 | dot 25.0/s×5, evasion 25.0% |
| Swamp | Mire Hexer | Bruiser | 350 | 42.0 | 0.45 / 2200ms | 20.4 | 0.00 | 0.00 | 0.00% | 200 | 36.0 | ×1.00 | - |
| Tundra | Glacier Bear | Bruiser | 1500 | 415 | 0.31 / 3200ms | 130 | 0.00 | 0.00 | 14.0% | 15.0 | 22.0 | ×1.00 | shield 20.0%/11.0s |
| Tundra | Rime Caster | Bruiser | 880 | 297 | 0.36 / 2800ms | 127 | 0.00 | 0.00 | 8.00% | 200 | 30.0 | ×1.20 | - |
| Tundra | Frost Lurker | Bruiser | 950 | 259 | 0.38 / 2600ms | 99.6 | 0.00 | 0.00 | 10.0% | 12.0 | 26.0 | ×1.00 | - |
| Volcanic | Cinder Hound | Bruiser | 1440 | 184 | 0.77 / 1300ms | 142 | 0.00 | 3.00 | 0.00% | 12.0 | 70.0 | ×1.00 | charge ×2.50 |
| Volcanic | Magma Tortoise | Bruiser | 2000 | 343 | 0.33 / 3000ms | 114 | 0.00 | 4.00 | 0.00% | 15.0 | 22.0 | ×1.00 | - |
| Volcanic | Ash Salamander | Bruiser | 1330 | 209 | 0.50 / 2000ms | 105 | 0.00 | 2.00 | 0.00% | 180 | 44.0 | ×1.00 | - |
| Volcanic | Ember Scuttler | Bruiser | 1220 | 148 | 0.63 / 1600ms | 92.5 | 0.00 | 2.00 | 0.00% | 12.0 | 64.0 | ×1.00 | - |
