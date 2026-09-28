# MMO Idle Monster Balance Packet - Biome Tier 3

Generated from `tools/mob-report.ts --llm-packet`. Markdown only. Companion to the DPS and eHP packets.

## Assumptions / Omissions

- Player model: weapon, armour, charm and mobility only, plus skill nodes, item upgrades and class affinities. NO core, relic, rune, rite, stance or ability is equipped — the bench bots carry all six, so these numbers are comparable to each other but NOT to bench output in absolute terms.

**Read the Walk first.** It is the only section that measures each biome against the
player who actually arrives there. Everything below it is detail for a biome the Walk
already told you to look at.

- Monster-centric: subject is the world's offence and durability, bucketed by biome tier 3.
- Reference players are tier 4 (a player of tier P fights biome tier P-1). Defensive stats are averaged over spec-agnostic class builds × armor × recovery.
- Reference player DPS uses shared `estimatePlayerDps` across concrete class builds, including full Conduit formations. T3 specialization, abilities, target-state mechanics, and shields/soft-caps remain outside this planning TTK; cross-check the detailed DPS packet for spec-level clear speed.
- TTL = player maxHP ÷ incoming DPS with **no player recovery** (that lives in the eHP packet). Incoming DPS folds plating/DR/averaged evasion; player DoT-resistance is not applied here.
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 21 mobs; tier avg HP 1946, avg total DPS 43.1.

## The Walk

_Each biome measured against the player who actually arrives there, in authored ladder order. Arrival gear is DERIVED: Global Mastery accrues as you master each biome, and GM is the only gate on upgrade level, so the ladder walks +0 to +4. "Cost/kill" is the share of your health pool one average kill spends — it folds offence and defence into one number. "Step" is this rung's cost divided by the previous rung's: 1.0 means the biome got no harder once your own growth is counted. Labels flag extremes for investigation; they are not pass/fail gates._

| # | Biome | Arrive with | GM | Mob TTK | Your TTL | Worst hit %HP | Cost/kill | Step |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Swamp | T3 +0 | 72 | 9.99s | 11.1s | 11.8% (Bog Lurker) | 89.9% | - | baseline |
| 2 | Mountain | T3 +0 | 78 | 17.3s | 11.6s | 38.8% (Mountain Colossus) | 149% | 1.66x | ok |
| 3 | Caverns | T3 +1 | 84 | 20.5s | 9.00s | 49.4% (Cavern Troll) | 228% | 1.53x | ok |
| 4 | Jungle | T3 +2 | 90 | 13.2s | 13.0s | 16.8% (Jungle Stalker) | 102% | 0.45x | EASIER |
| 5 | Desert | T3 +2 | 96 | 32.1s | 14.4s | 14.5% (Desert Basilisk) | 223% | 2.19x | WALL |
| 6 | Tundra | T3 +3 | 102 | 13.7s | 9.53s | 36.6% (Rime Caster) | 143% | 0.64x | EASIER |
| 7 | Volcanic | T3 +4 | 108 | 9.76s | 22.7s | 14.7% (Magma Tortoise) | 43.0% | 0.30x | EASIER |

## Walls & Stalls

_Only the rungs that break the pattern. Everything absent from this table walked cleanly._

| Biome | Signal | Detail |
| --- | --- | --- |
| Swamp | Low TTL | 11.1s to die under mean pressure (no recovery modelled) |
| Mountain | Low TTL | 11.6s to die under mean pressure (no recovery modelled) |
| Caverns | Low TTL | 9.00s to die under mean pressure (no recovery modelled) |
| Jungle | No progression | cost/kill is 0.45x the previous rung — the climb stalls here |
| Jungle | Low TTL | 13.0s to die under mean pressure (no recovery modelled) |
| Desert | Difficulty wall | cost/kill jumps 2.19x over the previous rung |
| Desert | Low TTL | 14.4s to die under mean pressure (no recovery modelled) |
| Tundra | No progression | cost/kill is 0.64x the previous rung — the climb stalls here |
| Tundra | Low TTL | 9.53s to die under mean pressure (no recovery modelled) |
| Volcanic | No progression | cost/kill is 0.30x the previous rung — the climb stalls here |


## Arrival Players

_Derived, not assumed: GM accrues per biome mastered and gates upgrade level, so the ladder walks +0 to +4._

| # | Arrive at | Gear | GM | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Swamp | T3 +0 | 72 | 343 | 4.90 | 24.1% | 10.8% | 92.7 | 0.96 |
| 2 | Mountain | T3 +0 | 78 | 343 | 4.90 | 24.1% | 10.8% | 92.7 | 0.96 |
| 3 | Caverns | T3 +1 | 84 | 364 | 5.21 | 24.2% | 11.0% | 103 | 0.96 |
| 4 | Jungle | T3 +2 | 90 | 385 | 5.49 | 24.3% | 11.2% | 113 | 0.96 |
| 5 | Desert | T3 +2 | 96 | 385 | 5.49 | 24.3% | 11.2% | 113 | 0.96 |
| 6 | Tundra | T3 +3 | 102 | 407 | 5.97 | 24.4% | 11.4% | 123 | 0.96 |
| 7 | Volcanic | T3 +4 | 108 | 427 | 6.31 | 24.5% | 11.6% | 132 | 0.96 |


---

## Detail

_Fixed-reference views, kept for cross-biome comparison at one power level. These do NOT account for the walk — read them only after the Walk has pointed you at a biome._

## Boss / Elite Table

_Bosses for biome tier 3 vs the boss-ready reference player (T4 +3). TTK uses the shared class-aware planning estimator; T3 specs, abilities, and shields/soft-caps remain unmodeled. TTL is player survival with no recovery modeled._

| Boss | Biome | HP | Attack profile | Raw DPS | Spike | Defenses | Expected TTK | Player TTL | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deep-Core Burrow-Gorger | Caverns | 14360 | 196 @ 0.22 aps | 43.6 | ×1.00 | plate 12.0, DR 35.0% | 73.5s | 23.8s | Safe | - |
| Dune-Carapace Monarch | Desert | 15800 | 196 @ 0.33 aps | 65.3 | ×1.00 | plate 10.0, DR 30.0% | 75.1s | 15.9s | Risky | - |
| Apex Bramble-Slasher | Jungle | 22400 | 104 @ 0.67 aps | 69.3 | ×1.00 | plate 0.00, DR 5.00% | 77.1s | 15.3s | Risky | - |
| Crag-Gorged Horn-Behemoth | Mountain | 16070 | 204 @ 0.24 aps | 48.6 | ×1.00 | plate 20.0, DR 15.0% | 68.0s | 21.3s | Safe | - |
| Rot-Spore Croc-Behemoth | Swamp | 10790 | 52.0 @ 0.29 aps | 99.2 | ×1.20 | plate 8.00, DR 30.0% | 50.8s | 7.95s | Blocked | kills player fast |
| Frost-Plated Rime-Mammoth | Tundra | 19100 | 204 @ 0.24 aps | 48.6 | ×1.00 | plate 22.0, DR 15.0% | 81.8s | 21.3s | Safe | - |
| Cinder-Shell Magma-Salamander | Volcanic | 18760 | 130 @ 0.33 aps | 43.3 | ×1.00 | plate 8.00, DR 30.0% | 88.3s | 24.2s | Safe | - |

## Mob / Boss Diagnostic Signals

_Attention signals only: mobs >±25% of biome-tier average on HP / raw DPS / spike, bosses outside the TTK/TTL observation bands, and narrow biome threat profiles. These are not verdicts or balance gates._

| Flag | Subject | Detail |
| --- | --- | --- |
| HP < -25% tier avg | Deep Spider | 610 vs avg 1946 (×0.31) |
| Spike < -25% tier avg | Deep Spider | 60.0 vs avg 98.2 (×0.61) |
| HP > +25% tier avg | Cavern Troll | 4725 vs avg 1946 (×2.43) |
| Spike > +25% tier avg | Cavern Troll | 248 vs avg 98.2 (×2.53) |
| HP < -25% tier avg | Crystal Gargoyle | 700 vs avg 1946 (×0.36) |
| Spike < -25% tier avg | Crystal Gargoyle | 70.0 vs avg 98.2 (×0.71) |
| HP > +25% tier avg | Dune Stalker | 4050 vs avg 1946 (×2.08) |
| Spike < -25% tier avg | Dune Stalker | 67.0 vs avg 98.2 (×0.68) |
| HP > +25% tier avg | Desert Basilisk | 4050 vs avg 1946 (×2.08) |
| HP < -25% tier avg | Jungle Stalker | 1250 vs avg 1946 (×0.64) |
| Raw DPS > +25% tier avg | Jungle Stalker | 55.0 vs avg 38.8 (×1.42) |
| HP > +25% tier avg | Silverback | 3200 vs avg 1946 (×1.64) |
| HP < -25% tier avg | Canopy Chameleon | 1150 vs avg 1946 (×0.59) |
| Spike < -25% tier avg | Canopy Chameleon | 45.0 vs avg 98.2 (×0.46) |
| HP > +25% tier avg | Mountain Colossus | 4675 vs avg 1946 (×2.40) |
| Spike > +25% tier avg | Mountain Colossus | 182 vs avg 98.2 (×1.85) |
| HP < -25% tier avg | Avalanche Ram | 610 vs avg 1946 (×0.31) |
| HP < -25% tier avg | Crag Mortar | 685 vs avg 1946 (×0.35) |
| Spike > +25% tier avg | Crag Mortar | 142 vs avg 98.2 (×1.44) |
| Raw DPS < -25% tier avg | Plague-Shell Snapper | 16.8 vs avg 38.8 (×0.43) |
| Spike < -25% tier avg | Plague-Shell Snapper | 37.0 vs avg 98.2 (×0.38) |
| HP < -25% tier avg | Mire Hexer | 510 vs avg 1946 (×0.26) |
| Raw DPS < -25% tier avg | Mire Hexer | 20.8 vs avg 38.8 (×0.54) |
| Spike < -25% tier avg | Mire Hexer | 42.0 vs avg 98.2 (×0.43) |
| HP < -25% tier avg | Bog Lurker | 490 vs avg 1946 (×0.25) |
| Raw DPS < -25% tier avg | Bog Lurker | 20.4 vs avg 38.8 (×0.52) |
| Spike < -25% tier avg | Bog Lurker | 60.2 vs avg 98.2 (×0.61) |
| HP < -25% tier avg | Frost Lurker | 950 vs avg 1946 (×0.49) |
| Raw DPS > +25% tier avg | Frost Lurker | 61.5 vs avg 38.8 (×1.59) |
| Spike > +25% tier avg | Frost Lurker | 160 vs avg 98.2 (×1.63) |
| HP > +25% tier avg | Glacier Bear | 3750 vs avg 1946 (×1.93) |
| Spike > +25% tier avg | Glacier Bear | 148 vs avg 98.2 (×1.51) |
| HP < -25% tier avg | Rime Caster | 880 vs avg 1946 (×0.45) |
| Raw DPS > +25% tier avg | Rime Caster | 72.6 vs avg 38.8 (×1.87) |
| Spike > +25% tier avg | Rime Caster | 204 vs avg 98.2 (×2.08) |
| HP < -25% tier avg | Ember Scuttler | 500 vs avg 1946 (×0.26) |
| Raw DPS < -25% tier avg | Ember Scuttler | 18.8 vs avg 38.8 (×0.48) |
| Spike < -25% tier avg | Ember Scuttler | 30.0 vs avg 98.2 (×0.31) |
| HP < -25% tier avg | Cinder Hound | 1440 vs avg 1946 (×0.74) |
| Spike < -25% tier avg | Cinder Hound | 55.0 vs avg 98.2 (×0.56) |
| HP > +25% tier avg | Magma Tortoise | 3000 vs avg 1946 (×1.54) |
| HP < -25% tier avg | Ash Salamander | 1330 vs avg 1946 (×0.68) |
| Raw DPS < -25% tier avg | Ash Salamander | 25.0 vs avg 38.8 (×0.64) |
| Spike < -25% tier avg | Ash Salamander | 50.0 vs avg 98.2 (×0.51) |
| high boss lethality | Rot-Spore Croc-Behemoth | player TTL 7.95s, spike 5.59% |
| biome single-type | Desert | 100% Direct damage |
| biome single-type | Jungle | 100% Direct damage |
| biome single-type | Mountain | 100% Direct damage |
| biome single-type | Tundra | 100% Direct damage |
| biome single-type | Volcanic | 100% Direct damage |

## Mob Stat Summary

_Every non-boss spawn in biome tier 3, sorted by raw total DPS within each biome. Raw DPS is pre-mitigation (attack × APS); DoT/s assumes full refreshed stacks._

| Biome | Mob | Role | HP | Attack | APS / CD | Raw DPS | DoT/s | Plating | DR | Range | Speed | Spike | Specials |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | Deep Spider | Bruiser | 610 | 60.0 | 0.67 / 1500ms | 40.0 | 36.0 | 0.00 | 8.00% | 12.0 | 70.0 | ×1.00 | dot 36.0/s×3 |
| Caverns | Cavern Troll | Spiker | 4725 | 124 | 0.28 / 3600ms | 46.7 | 0.00 | 2.00 | 28.0% | 15.0 | 14.0 | ×2.00 | - |
| Caverns | Crystal Gargoyle | Bruiser | 700 | 70.0 | 0.31 / 3200ms | 36.5 | 0.00 | 1.00 | 5.00% | 210 | 20.0 | ×1.00 | - |
| Desert | Dune Stalker | Bruiser | 4050 | 67.0 | 0.42 / 2400ms | 43.1 | 0.00 | 0.00 | 8.00% | 12.0 | 30.0 | ×1.00 | - |
| Desert | Desert Basilisk | Bruiser | 4050 | 80.0 | 0.36 / 2800ms | 35.2 | 0.00 | 0.00 | 15.0% | 12.0 | 26.0 | ×1.00 | - |
| Jungle | Jungle Stalker | Bruiser | 1250 | 55.0 | 1.00 / 1000ms | 55.0 | 0.00 | 0.00 | 0.00% | 12.0 | 78.0 | ×1.75 | - |
| Jungle | Silverback | Bruiser | 3200 | 83.0 | 0.56 / 1800ms | 46.1 | 0.00 | 0.00 | 0.00% | 12.0 | 60.0 | ×1.00 | charge ×2.80 |
| Jungle | Canopy Chameleon | Bruiser | 1150 | 45.0 | 0.71 / 1400ms | 32.1 | 0.00 | 0.00 | 0.00% | 190 | 52.0 | ×1.00 | - |
| Mountain | Mountain Colossus | Bruiser | 4675 | 130 | 0.26 / 3800ms | 43.7 | 0.00 | 0.00 | 0.00% | 15.0 | 16.0 | ×1.40 | charge ×2.50 |
| Mountain | Avalanche Ram | Bruiser | 610 | 87.0 | 0.38 / 2600ms | 41.9 | 0.00 | 0.00 | 0.00% | 12.0 | 38.0 | ×1.30 | charge ×2.50 |
| Mountain | Crag Mortar | Bruiser | 685 | 109 | 0.28 / 3600ms | 40.0 | 0.00 | 0.00 | 0.00% | 250 | 30.0 | ×1.30 | - |
| Swamp | Plague-Shell Snapper | DoT | 2320 | 37.0 | 0.45 / 2200ms | 16.8 | 30.0 | 4.00 | 0.00% | 15.0 | 26.0 | ×1.00 | dot 30.0/s×6 |
| Swamp | Bog Lurker | DoT | 490 | 43.0 | 0.38 / 2600ms | 20.4 | 25.0 | 0.00 | 0.00% | 12.0 | 30.0 | ×1.40 | dot 25.0/s×5, evasion 25.0% |
| Swamp | Mire Hexer | Bruiser | 510 | 42.0 | 0.45 / 2200ms | 20.8 | 0.00 | 0.00 | 0.00% | 200 | 36.0 | ×1.00 | - |
| Tundra | Rime Caster | Bruiser | 880 | 170 | 0.36 / 2800ms | 72.6 | 0.00 | 0.00 | 8.00% | 200 | 30.0 | ×1.20 | - |
| Tundra | Frost Lurker | Bruiser | 950 | 160 | 0.38 / 2600ms | 61.5 | 0.00 | 0.00 | 10.0% | 12.0 | 26.0 | ×1.00 | - |
| Tundra | Glacier Bear | Bruiser | 3750 | 148 | 0.31 / 3200ms | 46.3 | 0.00 | 0.00 | 14.0% | 15.0 | 22.0 | ×1.00 | shield 8.00%/11.0s |
| Volcanic | Cinder Hound | Bruiser | 1440 | 55.0 | 0.77 / 1300ms | 42.3 | 0.00 | 3.00 | 0.00% | 12.0 | 70.0 | ×1.00 | charge ×2.50 |
| Volcanic | Magma Tortoise | Bruiser | 3000 | 90.0 | 0.33 / 3000ms | 30.0 | 0.00 | 4.00 | 0.00% | 15.0 | 22.0 | ×1.00 | - |
| Volcanic | Ash Salamander | Bruiser | 1330 | 50.0 | 0.50 / 2000ms | 25.0 | 0.00 | 2.00 | 0.00% | 180 | 44.0 | ×1.00 | - |
| Volcanic | Ember Scuttler | Bruiser | 500 | 30.0 | 0.63 / 1600ms | 18.8 | 0.00 | 2.00 | 0.00% | 12.0 | 64.0 | ×1.00 | - |
