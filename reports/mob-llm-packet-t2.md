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
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 20 mobs; tier avg HP 313, avg total DPS 34.5.

## The Walk

_Each biome measured against the player who actually arrives there, in authored ladder order. Arrival gear is DERIVED: Global Mastery accrues as you master each biome, and GM is the only gate on upgrade level, so the ladder walks +0 to +4. "Cost/kill" is the share of your health pool one average kill spends — it folds offence and defence into one number. "Step" is this rung's cost divided by the previous rung's: 1.0 means the biome got no harder once your own growth is counted. Labels flag extremes for investigation; they are not pass/fail gates._

| # | Biome | Arrive with | GM | Mob TTK | Your TTL | Worst hit %HP | Cost/kill | Step |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Plains | T2 +0 | 30 | 3.34s | 33.6s | 8.10% (Savanna Hawk) | 9.94% | - | baseline |
| 2 | Forest | T2 +0 | 36 | 4.18s | 12.4s | 10.6% (Dire Wolf) | 33.7% | 3.39x | WALL |
| 3 | Swamp | T2 +1 | 42 | 2.89s | 7.82s | 15.0% (Mire Stalker) | 37.0% | 1.10x | ok |
| 4 | Mountain | T2 +2 | 48 | 4.07s | 7.02s | 70.9% (Granite Titan) | 58.0% | 1.57x | ok |
| 5 | Caverns | T2 +2 | 54 | 4.95s | 5.82s | 127% (Cave Troll) | 85.1% | 1.47x | ok |
| 6 | Jungle | T2 +3 | 60 | 5.62s | 11.0s | 9.64% (Jungle Ape) | 51.2% | 0.60x | EASIER |
| 7 | Desert | T2 +4 | 66 | 8.97s | 5.25s | 48.6% (Stone Basilisk) | 171% | 3.33x | WALL |

## Walls & Stalls

_Only the rungs that break the pattern. Everything absent from this table walked cleanly._

| Biome | Signal | Detail |
| --- | --- | --- |
| Forest | Difficulty wall | cost/kill jumps 3.39x over the previous rung |
| Forest | Low TTL | 12.4s to die under mean pressure (no recovery modelled) |
| Swamp | Low TTL | 7.82s to die under mean pressure (no recovery modelled) |
| Mountain | Heavy spike | Granite Titan hits for 70.9% of maxHP |
| Mountain | Low TTL | 7.02s to die under mean pressure (no recovery modelled) |
| Caverns | One-shot | Cave Troll hits for 127% of the arrival player's maxHP |
| Caverns | Low TTL | 5.82s to die under mean pressure (no recovery modelled) |
| Jungle | No progression | cost/kill is 0.60x the previous rung — the climb stalls here |
| Jungle | Low TTL | 11.0s to die under mean pressure (no recovery modelled) |
| Desert | Difficulty wall | cost/kill jumps 3.33x over the previous rung |
| Desert | Low TTL | 5.25s to die under mean pressure (no recovery modelled) |


## Arrival Players

_Derived, not assumed: GM accrues per biome mastered and gates upgrade level, so the ladder walks +0 to +4._

| # | Arrive at | Gear | GM | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Plains | T2 +0 | 30 | 198 | 12.4 | 3.75% | 11.1% | 41.8 | 1.18 |
| 2 | Forest | T2 +0 | 36 | 198 | 12.4 | 3.75% | 11.1% | 41.8 | 1.18 |
| 3 | Swamp | T2 +1 | 42 | 207 | 14.1 | 3.89% | 11.8% | 45.2 | 1.18 |
| 4 | Mountain | T2 +2 | 48 | 216 | 15.6 | 4.03% | 12.4% | 49.3 | 1.18 |
| 5 | Caverns | T2 +2 | 54 | 216 | 15.6 | 4.03% | 12.4% | 49.3 | 1.18 |
| 6 | Jungle | T2 +3 | 60 | 226 | 17.1 | 4.17% | 13.1% | 53.0 | 1.18 |
| 7 | Desert | T2 +4 | 66 | 235 | 19.0 | 4.32% | 13.7% | 57.1 | 1.18 |


---

## Detail

_Fixed-reference views, kept for cross-biome comparison at one power level. These do NOT account for the walk — read them only after the Walk has pointed you at a biome._

## Boss / Elite Table

_Bosses for biome tier 2 vs the boss-ready reference player (T3 +3). TTK uses the shared class-aware planning estimator; T3 specs, abilities, and shields/soft-caps remain unmodeled. TTL is player survival with no recovery modeled._

| Boss | Biome | HP | Attack profile | Raw DPS | Spike | Defenses | Expected TTK | Player TTL | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chitinous Dreadbore | Caverns | 4375 | 139 @ 0.28 aps | 56.5 | ×1.60 | plate 12.0, DR 12.0% | 36.7s | 7.11s | Blocked | kills player fast |
| Dune-Stalker Emperor | Desert | 3750 | 85.0 @ 0.38 aps | 42.1 | ×2.50 | plate 12.0, DR 8.00% | 30.3s | 11.3s | Risky | - |
| Apex Timberclaw | Forest | 3750 | 64.0 @ 0.67 aps | 87.9 | ×1.60 | plate 0.00, DR 0.00% | 24.9s | 6.55s | Blocked | kills player fast |
| Jungle Dread-Gorger | Jungle | 3625 | 85.0 @ 0.42 aps | 35.4 | ×2.50 | plate 0.00, DR 3.00% | 24.7s | 13.5s | Risky | - |
| Stoneplate Juggernaut | Mountain | 5000 | 128 @ 0.24 aps | 49.1 | ×2.00 | plate 10.0, DR 5.00% | 38.6s | 8.38s | Risky | - |
| Gorging Razortusk | Plains | 4000 | 96.0 @ 0.45 aps | 43.6 | ×1.00 | plate 8.00, DR 5.00% | 30.2s | 10.3s | Risky | - |
| Mire-Gorged Behemoth | Swamp | 3375 | 38.0 @ 0.36 aps | 52.7 | ×1.10 | plate 6.00, DR 8.00% | 25.6s | 7.75s | Blocked | kills player fast |

## Mob / Boss Diagnostic Signals

_Attention signals only: mobs >±25% of biome-tier average on HP / raw DPS / spike, bosses outside the TTK/TTL observation bands, and narrow biome threat profiles. These are not verdicts or balance gates._

| Flag | Subject | Detail |
| --- | --- | --- |
| Spike < -25% tier avg | Giant Spider | 39.0 vs avg 79.0 (×0.49) |
| HP > +25% tier avg | Cave Troll | 400 vs avg 313 (×1.28) |
| Raw DPS > +25% tier avg | Cave Troll | 56.2 vs avg 27.8 (×2.02) |
| Spike > +25% tier avg | Cave Troll | 322 vs avg 79.0 (×4.07) |
| Spike > +25% tier avg | Cave Gargoyle | 119 vs avg 79.0 (×1.50) |
| HP > +25% tier avg | Sand Scorpion | 660 vs avg 313 (×2.11) |
| Raw DPS > +25% tier avg | Sand Scorpion | 55.0 vs avg 27.8 (×1.98) |
| Spike > +25% tier avg | Sand Scorpion | 132 vs avg 79.0 (×1.67) |
| HP > +25% tier avg | Stone Basilisk | 660 vs avg 313 (×2.11) |
| Raw DPS > +25% tier avg | Stone Basilisk | 57.5 vs avg 27.8 (×2.07) |
| Spike > +25% tier avg | Stone Basilisk | 138 vs avg 79.0 (×1.75) |
| Spike < -25% tier avg | Dire Wolf | 34.0 vs avg 79.0 (×0.43) |
| Spike < -25% tier avg | Ironclaw Badger | 31.0 vs avg 79.0 (×0.39) |
| HP < -25% tier avg | Thorn Spitter | 230 vs avg 313 (×0.73) |
| Raw DPS < -25% tier avg | Thorn Spitter | 17.2 vs avg 27.8 (×0.62) |
| Spike < -25% tier avg | Thorn Spitter | 31.0 vs avg 79.0 (×0.39) |
| HP > +25% tier avg | Jungle Snake | 400 vs avg 313 (×1.28) |
| Raw DPS < -25% tier avg | Jungle Snake | 18.2 vs avg 27.8 (×0.65) |
| Spike < -25% tier avg | Jungle Snake | 44.0 vs avg 79.0 (×0.56) |
| HP > +25% tier avg | Jungle Ape | 500 vs avg 313 (×1.60) |
| Raw DPS < -25% tier avg | Jungle Ape | 19.4 vs avg 27.8 (×0.70) |
| Spike < -25% tier avg | Jungle Ape | 47.9 vs avg 79.0 (×0.61) |
| Raw DPS < -25% tier avg | Vine Chameleon | 10.5 vs avg 27.8 (×0.38) |
| Spike < -25% tier avg | Vine Chameleon | 20.0 vs avg 79.0 (×0.25) |
| Raw DPS > +25% tier avg | Granite Titan | 42.5 vs avg 27.8 (×1.53) |
| Spike > +25% tier avg | Granite Titan | 183 vs avg 79.0 (×2.32) |
| Raw DPS > +25% tier avg | Boulder Thrower | 42.1 vs avg 27.8 (×1.51) |
| Spike > +25% tier avg | Boulder Thrower | 170 vs avg 79.0 (×2.15) |
| HP < -25% tier avg | Stampede Bull | 230 vs avg 313 (×0.73) |
| Raw DPS < -25% tier avg | Stampede Bull | 14.1 vs avg 27.8 (×0.51) |
| Spike < -25% tier avg | Stampede Bull | 24.0 vs avg 79.0 (×0.30) |
| HP < -25% tier avg | Prairie Wolf | 180 vs avg 313 (×0.57) |
| Raw DPS < -25% tier avg | Prairie Wolf | 15.8 vs avg 27.8 (×0.57) |
| Spike < -25% tier avg | Prairie Wolf | 19.0 vs avg 79.0 (×0.24) |
| HP < -25% tier avg | Savanna Hawk | 170 vs avg 313 (×0.54) |
| Raw DPS < -25% tier avg | Savanna Hawk | 12.1 vs avg 27.8 (×0.43) |
| Spike < -25% tier avg | Savanna Hawk | 29.0 vs avg 79.0 (×0.37) |
| HP < -25% tier avg | Moss-Shell Snapper | 150 vs avg 313 (×0.48) |
| Raw DPS < -25% tier avg | Moss-Shell Snapper | 10.9 vs avg 27.8 (×0.39) |
| Spike < -25% tier avg | Moss-Shell Snapper | 24.0 vs avg 79.0 (×0.30) |
| HP < -25% tier avg | Bog Witch | 170 vs avg 313 (×0.54) |
| Raw DPS < -25% tier avg | Bog Witch | 20.0 vs avg 27.8 (×0.72) |
| Spike < -25% tier avg | Bog Witch | 41.0 vs avg 79.0 (×0.52) |
| HP < -25% tier avg | Mire Stalker | 210 vs avg 313 (×0.67) |
| Raw DPS < -25% tier avg | Mire Stalker | 17.7 vs avg 27.8 (×0.64) |
| Spike < -25% tier avg | Mire Stalker | 46.0 vs avg 79.0 (×0.58) |
| high boss lethality | Chitinous Dreadbore | player TTL 7.11s, spike 55.8% |
| high boss lethality | Apex Timberclaw | player TTL 6.55s, spike 17.9% |
| high boss lethality | Mire-Gorged Behemoth | player TTL 7.75s, spike 3.52% |
| biome single-type | Desert | 100% Direct damage |
| biome single-type | Forest | 100% Direct damage |
| biome single-type | Mountain | 100% Direct damage |
| biome single-type | Plains | 100% Direct damage |

## Mob Stat Summary

_Every non-boss spawn in biome tier 2, sorted by raw total DPS within each biome. Raw DPS is pre-mitigation (attack × APS); DoT/s assumes full refreshed stacks._

| Biome | Mob | Role | HP | Attack | APS / CD | Raw DPS | DoT/s | Plating | DR | Range | Speed | Spike | Specials |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | Cave Troll | Spiker | 400 | 134 | 0.28 / 3600ms | 56.2 | 0.00 | 1.00 | 8.00% | 15.0 | 15.0 | ×2.40 | - |
| Caverns | Giant Spider | DoT | 260 | 39.0 | 0.56 / 1800ms | 21.7 | 33.0 | 0.00 | 8.00% | 12.0 | 72.0 | ×1.00 | dot 33.0/s×3 |
| Caverns | Cave Gargoyle | Spiker | 300 | 66.0 | 0.31 / 3200ms | 28.4 | 0.00 | 1.00 | 5.00% | 200 | 22.0 | ×1.80 | - |
| Desert | Stone Basilisk | Bruiser | 660 | 138 | 0.36 / 2800ms | 57.5 | 0.00 | 0.00 | 15.0% | 12.0 | 26.0 | ×1.00 | - |
| Desert | Sand Scorpion | Bruiser | 660 | 132 | 0.42 / 2400ms | 55.0 | 0.00 | 0.00 | 8.00% | 12.0 | 30.0 | ×1.00 | slow ×0.50 |
| Forest | Ironclaw Badger | Bruiser | 240 | 31.0 | 1.11 / 900ms | 34.4 | 0.00 | 0.00 | 0.00% | 15.0 | 22.0 | ×1.00 | - |
| Forest | Dire Wolf | Bruiser | 270 | 34.0 | 0.91 / 1100ms | 30.9 | 0.00 | 0.00 | 0.00% | 12.0 | 96.0 | ×1.00 | charge ×3.00 |
| Forest | Thorn Spitter | Bruiser | 230 | 31.0 | 0.42 / 2400ms | 17.2 | 0.00 | 0.00 | 0.00% | 190 | 48.0 | ×1.00 | - |
| Jungle | Jungle Snake | DoT | 400 | 20.0 | 0.91 / 1100ms | 18.2 | 21.0 | 0.00 | 0.00% | 12.0 | 76.0 | ×2.20 | dot 21.0/s×3 |
| Jungle | Vine Chameleon | DoT | 375 | 20.0 | 0.53 / 1900ms | 10.5 | 28.0 | 0.00 | 0.00% | 190 | 48.0 | ×1.00 | dot 28.0/s×4 |
| Jungle | Jungle Ape | Bruiser | 500 | 33.0 | 0.59 / 1700ms | 19.4 | 0.00 | 0.00 | 0.00% | 12.0 | 62.0 | ×1.45 | ramp +45.0% atk, charge ×2.80 |
| Mountain | Granite Titan | Bruiser | 336 | 122 | 0.26 / 3800ms | 42.5 | 0.00 | 0.00 | 0.00% | 15.0 | 18.0 | ×1.50 | charge ×2.50 |
| Mountain | Boulder Thrower | Bruiser | 277 | 106 | 0.29 / 3500ms | 42.1 | 0.00 | 0.00 | 0.00% | 240 | 28.0 | ×1.60 | - |
| Mountain | Stone Eagle | Bruiser | 244 | 88.0 | 0.36 / 2800ms | 31.4 | 0.00 | 0.00 | 0.00% | 12.0 | 40.0 | ×1.00 | charge ×2.50 |
| Plains | Prairie Wolf | Bruiser | 180 | 19.0 | 0.83 / 1200ms | 15.8 | 0.00 | 0.00 | 0.00% | 12.0 | 92.0 | ×1.00 | - |
| Plains | Stampede Bull | Bruiser | 230 | 24.0 | 0.59 / 1700ms | 14.1 | 0.00 | 0.00 | 5.00% | 12.0 | 62.0 | ×1.00 | charge ×2.50 |
| Plains | Savanna Hawk | Bruiser | 170 | 29.0 | 0.42 / 2400ms | 12.1 | 0.00 | 0.00 | 0.00% | 165 | 50.0 | ×1.00 | - |
| Swamp | Moss-Shell Snapper | DoT | 150 | 24.0 | 0.45 / 2200ms | 10.9 | 35.0 | 6.00 | 0.00% | 15.0 | 28.0 | ×1.00 | dot 35.0/s×5 |
| Swamp | Mire Stalker | Evasive | 210 | 46.0 | 0.38 / 2600ms | 17.7 | 16.0 | 0.00 | 0.00% | 12.0 | 40.0 | ×1.00 | dot 16.0/s×4, evasion 20.0% |
| Swamp | Bog Witch | Bruiser | 170 | 41.0 | 0.45 / 2200ms | 20.0 | 0.00 | 0.00 | 0.00% | 180 | 38.0 | ×1.00 | - |
