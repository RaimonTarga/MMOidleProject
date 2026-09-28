# MMO Idle Monster Balance Packet - Biome Tier 2

Generated from `tools/mob-report.ts --llm-packet`. Markdown only. Companion to the DPS and eHP packets.

## Assumptions / Omissions

- Player model: weapon, armour, charm and mobility only, plus skill nodes, item upgrades and class affinities. NO core, relic, rune, rite, stance or ability is equipped — the bench bots carry all six, so these numbers are comparable to each other but NOT to bench output in absolute terms.

**Read the Walk first.** It is the only section that measures each biome against the
player who actually arrives there. Everything below it is detail for a biome the Walk
already told you to look at.

- Monster-centric: subject is the world's offence and durability, bucketed by biome tier 2.
- Reference players are tier 3 (a player of tier P fights biome tier P-1). Defensive stats are averaged over spec-agnostic class builds × armor × recovery.
- Reference player DPS uses shared `estimatePlayerDps` across concrete class builds, including full Conduit formations. T3 specialization, abilities, target-state mechanics, and shields/soft-caps remain outside this planning TTK; cross-check the detailed DPS packet for spec-level clear speed.
- TTL = player maxHP ÷ incoming DPS with **no player recovery** (that lives in the eHP packet). Incoming DPS folds plating/DR/averaged evasion; player DoT-resistance is not applied here.
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 21 mobs; tier avg HP 718, avg total DPS 28.0.

## The Walk

_Each biome measured against the player who actually arrives there, in authored ladder order. Arrival gear is DERIVED: Global Mastery accrues as you master each biome, and GM is the only gate on upgrade level, so the ladder walks +0 to +4. "Cost/kill" is the share of your health pool one average kill spends — it folds offence and defence into one number. "Step" is this rung's cost divided by the previous rung's: 1.0 means the biome got no harder once your own growth is counted. Labels flag extremes for investigation; they are not pass/fail gates._

| # | Biome | Arrive with | GM | Mob TTK | Your TTL | Worst hit %HP | Cost/kill | Step |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Plains | T2 +0 | 30 | 5.29s | 21.8s | 10.2% (Savanna Hawk) | 24.3% | - | baseline |
| 2 | Forest | T2 +0 | 36 | 14.5s | 14.9s | 11.2% (Thorn Spitter) | 97.4% | 4.01x | WALL |
| 3 | Swamp | T2 +1 | 42 | 5.77s | 7.48s | 16.3% (Mire Stalker) | 77.1% | 0.79x | EASIER |
| 4 | Mountain | T2 +2 | 48 | 9.52s | 12.2s | 50.2% (Boulder Thrower) | 78.3% | 1.02x | flat |
| 5 | Caverns | T2 +2 | 54 | 11.8s | 7.49s | 63.0% (Cave Troll) | 158% | 2.02x | WALL |
| 6 | Jungle | T2 +3 | 60 | 7.09s | 8.28s | 12.3% (Jungle Snake) | 85.5% | 0.54x | EASIER |
| 7 | Desert | T2 +4 | 66 | 15.2s | 10.5s | 20.4% (Sand Scorpion) | 145% | 1.69x | ok |

## Walls & Stalls

_Only the rungs that break the pattern. Everything absent from this table walked cleanly._

| Biome | Signal | Detail |
| --- | --- | --- |
| Forest | Difficulty wall | cost/kill jumps 4.01x over the previous rung |
| Forest | Low TTL | 14.9s to die under mean pressure (no recovery modelled) |
| Swamp | No progression | cost/kill is 0.79x the previous rung — the climb stalls here |
| Swamp | Low TTL | 7.48s to die under mean pressure (no recovery modelled) |
| Mountain | No progression | cost/kill is 1.02x the previous rung — the climb stalls here |
| Mountain | Heavy spike | Boulder Thrower hits for 50.2% of maxHP |
| Mountain | Low TTL | 12.2s to die under mean pressure (no recovery modelled) |
| Caverns | Difficulty wall | cost/kill jumps 2.02x over the previous rung |
| Caverns | Heavy spike | Cave Troll hits for 63.0% of maxHP |
| Caverns | Low TTL | 7.49s to die under mean pressure (no recovery modelled) |
| Jungle | No progression | cost/kill is 0.54x the previous rung — the climb stalls here |
| Jungle | Low TTL | 8.28s to die under mean pressure (no recovery modelled) |
| Desert | Low TTL | 10.5s to die under mean pressure (no recovery modelled) |


## Arrival Players

_Derived, not assumed: GM accrues per biome mastered and gates upgrade level, so the ladder walks +0 to +4._

| # | Arrive at | Gear | GM | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Plains | T2 +0 | 30 | 206 | 3.37 | 18.0% | 14.8% | 46.9 | 1.12 |
| 2 | Forest | T2 +0 | 36 | 206 | 3.37 | 18.0% | 14.8% | 46.9 | 1.12 |
| 3 | Swamp | T2 +1 | 42 | 215 | 3.67 | 18.1% | 15.2% | 53.4 | 1.12 |
| 4 | Mountain | T2 +2 | 48 | 223 | 3.81 | 18.2% | 15.6% | 59.7 | 1.12 |
| 5 | Caverns | T2 +2 | 54 | 223 | 3.81 | 18.2% | 15.6% | 59.7 | 1.12 |
| 6 | Jungle | T2 +3 | 60 | 232 | 4.26 | 18.3% | 16.0% | 65.7 | 1.12 |
| 7 | Desert | T2 +4 | 66 | 240 | 4.40 | 18.4% | 16.5% | 71.2 | 1.12 |


---

## Detail

_Fixed-reference views, kept for cross-biome comparison at one power level. These do NOT account for the walk — read them only after the Walk has pointed you at a biome._

## Boss / Elite Table

_Bosses for biome tier 2 vs the boss-ready reference player (T3 +3). TTK uses the shared class-aware planning estimator; T3 specs, abilities, and shields/soft-caps remain unmodeled. TTL is player survival with no recovery modeled._

| Boss | Biome | HP | Attack profile | Raw DPS | Spike | Defenses | Expected TTK | Player TTL | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chitinous Dreadbore | Caverns | 4375 | 85.0 @ 0.28 aps | 23.6 | ×1.00 | plate 12.0, DR 12.0% | 36.5s | 26.3s | Safe | - |
| Dune-Stalker Emperor | Desert | 3750 | 85.0 @ 0.38 aps | 32.7 | ×1.00 | plate 12.0, DR 8.00% | 30.1s | 19.0s | Risky | - |
| Apex Timberclaw | Forest | 3750 | 44.0 @ 0.67 aps | 60.4 | ×1.25 | plate 0.00, DR 0.00% | 24.4s | 10.8s | Risky | - |
| Jungle Dread-Gorger | Jungle | 3625 | 85.0 @ 0.42 aps | 35.4 | ×1.00 | plate 0.00, DR 3.00% | 24.3s | 17.5s | Risky | - |
| Stoneplate Juggernaut | Mountain | 5000 | 128 @ 0.24 aps | 30.5 | ×1.00 | plate 10.0, DR 5.00% | 38.0s | 19.9s | Risky | - |
| Gorging Razortusk | Plains | 4000 | 96.0 @ 0.45 aps | 43.6 | ×1.00 | plate 8.00, DR 5.00% | 29.7s | 14.0s | Risky | - |
| Mire-Gorged Behemoth | Swamp | 3375 | 38.0 @ 0.36 aps | 36.7 | ×1.10 | plate 6.00, DR 8.00% | 25.2s | 14.3s | Risky | - |

## Mob / Boss Diagnostic Signals

_Attention signals only: mobs >±25% of biome-tier average on HP / raw DPS / spike, bosses outside the TTK/TTL observation bands, and narrow biome threat profiles. These are not verdicts or balance gates._

| Flag | Subject | Detail |
| --- | --- | --- |
| HP < -25% tier avg | Giant Spider | 350 vs avg 718 (×0.49) |
| Spike < -25% tier avg | Giant Spider | 35.0 vs avg 53.4 (×0.66) |
| HP > +25% tier avg | Cave Troll | 1584 vs avg 718 (×2.21) |
| Raw DPS > +25% tier avg | Cave Troll | 34.1 vs avg 20.7 (×1.65) |
| Spike > +25% tier avg | Cave Troll | 181 vs avg 53.4 (×3.38) |
| HP < -25% tier avg | Cave Gargoyle | 415 vs avg 718 (×0.58) |
| Spike > +25% tier avg | Cave Gargoyle | 89.9 vs avg 53.4 (×1.68) |
| HP > +25% tier avg | Sand Scorpion | 1365 vs avg 718 (×1.90) |
| Raw DPS > +25% tier avg | Sand Scorpion | 39.9 vs avg 20.7 (×1.93) |
| HP > +25% tier avg | Stone Basilisk | 1365 vs avg 718 (×1.90) |
| HP > +25% tier avg | Dire Wolf | 1575 vs avg 718 (×2.19) |
| Spike < -25% tier avg | Dire Wolf | 22.0 vs avg 53.4 (×0.41) |
| HP > +25% tier avg | Ironclaw Badger | 945 vs avg 718 (×1.32) |
| Raw DPS > +25% tier avg | Ironclaw Badger | 27.8 vs avg 20.7 (×1.34) |
| Spike < -25% tier avg | Ironclaw Badger | 25.0 vs avg 53.4 (×0.47) |
| HP < -25% tier avg | Thorn Spitter | 300 vs avg 718 (×0.42) |
| Raw DPS < -25% tier avg | Thorn Spitter | 12.9 vs avg 20.7 (×0.63) |
| Spike < -25% tier avg | Thorn Spitter | 31.0 vs avg 53.4 (×0.58) |
| HP < -25% tier avg | Jungle Snake | 480 vs avg 718 (×0.67) |
| HP < -25% tier avg | Jungle Snake | 480 vs avg 718 (×0.67) |
| HP > +25% tier avg | Jungle Ape | 1200 vs avg 718 (×1.67) |
| Spike < -25% tier avg | Jungle Ape | 33.0 vs avg 53.4 (×0.62) |
| HP < -25% tier avg | Vine Chameleon | 450 vs avg 718 (×0.63) |
| Raw DPS < -25% tier avg | Vine Chameleon | 10.5 vs avg 20.7 (×0.51) |
| Spike < -25% tier avg | Vine Chameleon | 20.0 vs avg 53.4 (×0.37) |
| HP > +25% tier avg | Granite Titan | 1656 vs avg 718 (×2.31) |
| Spike > +25% tier avg | Granite Titan | 89.1 vs avg 53.4 (×1.67) |
| HP < -25% tier avg | Stone Eagle | 340 vs avg 718 (×0.47) |
| HP < -25% tier avg | Boulder Thrower | 385 vs avg 718 (×0.54) |
| Raw DPS > +25% tier avg | Boulder Thrower | 30.0 vs avg 20.7 (×1.45) |
| Spike > +25% tier avg | Boulder Thrower | 144 vs avg 53.4 (×2.70) |
| HP < -25% tier avg | Stampede Bull | 495 vs avg 718 (×0.69) |
| Raw DPS < -25% tier avg | Stampede Bull | 14.1 vs avg 20.7 (×0.68) |
| Spike < -25% tier avg | Stampede Bull | 24.0 vs avg 53.4 (×0.45) |
| HP < -25% tier avg | Prairie Wolf | 260 vs avg 718 (×0.36) |
| Spike < -25% tier avg | Prairie Wolf | 19.0 vs avg 53.4 (×0.36) |
| HP < -25% tier avg | Savanna Hawk | 250 vs avg 718 (×0.35) |
| Raw DPS < -25% tier avg | Savanna Hawk | 12.1 vs avg 20.7 (×0.58) |
| Spike < -25% tier avg | Savanna Hawk | 29.0 vs avg 53.4 (×0.54) |
| Raw DPS < -25% tier avg | Moss-Shell Snapper | 10.9 vs avg 20.7 (×0.53) |
| Spike < -25% tier avg | Moss-Shell Snapper | 24.0 vs avg 53.4 (×0.45) |
| HP < -25% tier avg | Bog Witch | 220 vs avg 718 (×0.31) |
| HP < -25% tier avg | Mire Stalker | 275 vs avg 718 (×0.38) |
| biome single-type | Desert | 100% Direct damage |
| biome single-type | Forest | 100% Direct damage |
| biome single-type | Mountain | 100% Direct damage |
| biome single-type | Plains | 100% Direct damage |

## Mob Stat Summary

_Every non-boss spawn in biome tier 2, sorted by raw total DPS within each biome. Raw DPS is pre-mitigation (attack × APS); DoT/s assumes full refreshed stacks._

| Biome | Mob | Role | HP | Attack | APS / CD | Raw DPS | DoT/s | Plating | DR | Range | Speed | Spike | Specials |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | Giant Spider | DoT | 350 | 35.0 | 0.56 / 1800ms | 19.4 | 33.0 | 0.00 | 8.00% | 12.0 | 72.0 | ×1.00 | dot 33.0/s×3 |
| Caverns | Cave Troll | Spiker | 1584 | 86.0 | 0.28 / 3600ms | 34.1 | 0.00 | 1.00 | 26.4% | 15.0 | 15.0 | ×2.10 | - |
| Caverns | Cave Gargoyle | Bruiser | 415 | 58.0 | 0.31 / 3200ms | 23.7 | 0.00 | 1.00 | 5.00% | 200 | 22.0 | ×1.55 | - |
| Desert | Sand Scorpion | Bruiser | 1365 | 65.0 | 0.42 / 2400ms | 39.9 | 0.00 | 0.00 | 8.00% | 12.0 | 30.0 | ×1.00 | - |
| Desert | Stone Basilisk | Bruiser | 1365 | 55.0 | 0.36 / 2800ms | 23.9 | 0.00 | 0.00 | 15.0% | 12.0 | 26.0 | ×1.00 | - |
| Forest | Ironclaw Badger | Bruiser | 945 | 25.0 | 1.11 / 900ms | 27.8 | 0.00 | 0.00 | 0.00% | 15.0 | 22.0 | ×1.00 | - |
| Forest | Dire Wolf | Bruiser | 1575 | 22.0 | 0.91 / 1100ms | 20.0 | 0.00 | 0.00 | 0.00% | 12.0 | 96.0 | ×1.00 | charge ×3.00 |
| Forest | Thorn Spitter | Bruiser | 300 | 31.0 | 0.42 / 2400ms | 12.9 | 0.00 | 0.00 | 0.00% | 190 | 48.0 | ×1.00 | - |
| Jungle | Jungle Snake | DoT | 480 | 20.0 | 0.91 / 1100ms | 18.2 | 21.0 | 0.00 | 0.00% | 12.0 | 76.0 | ×2.20 | dot 21.0/s×3 |
| Jungle | Jungle Snake | DoT | 480 | 20.0 | 0.91 / 1100ms | 18.2 | 21.0 | 0.00 | 0.00% | 12.0 | 76.0 | ×2.20 | dot 21.0/s×3 |
| Jungle | Vine Chameleon | DoT | 450 | 20.0 | 0.53 / 1900ms | 10.5 | 28.0 | 0.00 | 0.00% | 190 | 48.0 | ×1.00 | dot 28.0/s×4 |
| Jungle | Jungle Ape | Bruiser | 1200 | 33.0 | 0.59 / 1700ms | 19.4 | 0.00 | 0.00 | 0.00% | 12.0 | 62.0 | ×1.00 | charge ×2.80 |
| Mountain | Boulder Thrower | Spiker | 385 | 72.0 | 0.29 / 3500ms | 30.0 | 0.00 | 0.00 | 0.00% | 240 | 28.0 | ×2.00 | - |
| Mountain | Granite Titan | Bruiser | 1656 | 54.0 | 0.26 / 3800ms | 23.4 | 0.00 | 0.00 | 0.00% | 15.0 | 18.0 | ×1.65 | charge ×2.50 |
| Mountain | Stone Eagle | Bruiser | 340 | 60.0 | 0.36 / 2800ms | 21.4 | 0.00 | 0.00 | 0.00% | 12.0 | 105 | ×1.00 | - |
| Plains | Prairie Wolf | Bruiser | 260 | 19.0 | 0.83 / 1200ms | 15.8 | 0.00 | 0.00 | 0.00% | 12.0 | 92.0 | ×1.00 | - |
| Plains | Stampede Bull | Bruiser | 495 | 24.0 | 0.59 / 1700ms | 14.1 | 0.00 | 0.00 | 5.00% | 12.0 | 62.0 | ×1.00 | charge ×2.50 |
| Plains | Savanna Hawk | Bruiser | 250 | 29.0 | 0.42 / 2400ms | 12.1 | 0.00 | 0.00 | 0.00% | 12.0 | 110 | ×1.00 | - |
| Swamp | Moss-Shell Snapper | DoT | 680 | 24.0 | 0.45 / 2200ms | 10.9 | 35.0 | 6.00 | 0.00% | 15.0 | 28.0 | ×1.00 | dot 35.0/s×5 |
| Swamp | Mire Stalker | Evasive | 275 | 46.0 | 0.38 / 2600ms | 17.7 | 16.0 | 0.00 | 0.00% | 12.0 | 75.0 | ×1.00 | dot 16.0/s×4, evasion 20.0% |
| Swamp | Bog Witch | Bruiser | 220 | 41.0 | 0.45 / 2200ms | 20.5 | 0.00 | 0.00 | 0.00% | 180 | 38.0 | ×1.00 | - |
