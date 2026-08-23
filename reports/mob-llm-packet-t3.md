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
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 21 mobs; tier avg HP 899, avg total DPS 68.3.

## The Walk

_Each biome measured against the player who actually arrives there, in authored ladder order. Arrival gear is DERIVED: Global Mastery accrues as you master each biome, and GM is the only gate on upgrade level, so the ladder walks +0 to +4. "Cost/kill" is the share of your health pool one average kill spends — it folds offence and defence into one number. "Step" is this rung's cost divided by the previous rung's: 1.0 means the biome got no harder once your own growth is counted. Labels flag extremes for investigation; they are not pass/fail gates._

| # | Biome | Arrive with | GM | Mob TTK | Your TTL | Worst hit %HP | Cost/kill | Step |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Swamp | T3 +0 | 72 | 3.51s | 9.81s | 7.81% (Bog Lurker) | 35.8% | - | baseline |
| 2 | Mountain | T3 +0 | 80 | 4.83s | 7.60s | 72.4% (Mountain Colossus) | 63.6% | 1.78x | ok |
| 3 | Caverns | T3 +1 | 87 | 5.04s | 6.63s | 88.3% (Cavern Troll) | 75.9% | 1.19x | ok |
| 4 | Jungle | T3 +2 | 95 | 6.27s | 14.1s | 25.3% (Silverback) | 44.4% | 0.58x | EASIER |
| 5 | Desert | T3 +2 | 103 | 11.1s | 12.5s | 26.9% (Desert Basilisk) | 88.4% | 1.99x | WALL |
| 6 | Tundra | T3 +3 | 111 | 8.18s | 3.22s | 114% (Glacier Bear) | 254% | 2.87x | WALL |
| 7 | Volcanic | T3 +4 | 118 | 9.30s | 3.93s | 85.9% (Magma Tortoise) | 236% | 0.93x | EASIER |

## Walls & Stalls

_Only the rungs that break the pattern. Everything absent from this table walked cleanly._

| Biome | Signal | Detail |
| --- | --- | --- |
| Swamp | Low TTL | 9.81s to die under mean pressure (no recovery modelled) |
| Mountain | Heavy spike | Mountain Colossus hits for 72.4% of maxHP |
| Mountain | Low TTL | 7.60s to die under mean pressure (no recovery modelled) |
| Caverns | Heavy spike | Cavern Troll hits for 88.3% of maxHP |
| Caverns | Low TTL | 6.63s to die under mean pressure (no recovery modelled) |
| Jungle | No progression | cost/kill is 0.58x the previous rung — the climb stalls here |
| Jungle | Low TTL | 14.1s to die under mean pressure (no recovery modelled) |
| Desert | Difficulty wall | cost/kill jumps 1.99x over the previous rung |
| Desert | Low TTL | 12.5s to die under mean pressure (no recovery modelled) |
| Tundra | Difficulty wall | cost/kill jumps 2.87x over the previous rung |
| Tundra | One-shot | Glacier Bear hits for 114% of the arrival player's maxHP |
| Tundra | Low TTL | 3.22s to die under mean pressure (no recovery modelled) |
| Volcanic | No progression | cost/kill is 0.93x the previous rung — the climb stalls here |
| Volcanic | Heavy spike | Magma Tortoise hits for 85.9% of maxHP |
| Volcanic | Low TTL | 3.93s to die under mean pressure (no recovery modelled) |


## Arrival Players

_Derived, not assumed: GM accrues per biome mastered and gates upgrade level, so the ladder walks +0 to +4._

| # | Arrive at | Gear | GM | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Swamp | T3 +0 | 72 | 256 | 21.7 | 4.60% | 11.0% | 89.2 | 0.94 |
| 2 | Mountain | T3 +0 | 80 | 256 | 21.7 | 4.60% | 11.0% | 89.2 | 0.94 |
| 3 | Caverns | T3 +1 | 87 | 277 | 25.3 | 4.75% | 11.7% | 103 | 0.94 |
| 4 | Jungle | T3 +2 | 95 | 298 | 28.8 | 4.89% | 12.3% | 116 | 0.94 |
| 5 | Desert | T3 +2 | 103 | 298 | 28.8 | 4.89% | 12.3% | 116 | 0.94 |
| 6 | Tundra | T3 +3 | 111 | 318 | 32.4 | 5.03% | 12.7% | 130 | 0.94 |
| 7 | Volcanic | T3 +4 | 118 | 339 | 36.3 | 5.17% | 13.0% | 143 | 0.94 |


---

## Detail

_Fixed-reference views, kept for cross-biome comparison at one power level. These do NOT account for the walk — read them only after the Walk has pointed you at a biome._

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
