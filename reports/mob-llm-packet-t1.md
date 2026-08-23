# MMO Idle Monster Balance Packet - Biome Tier 1

Generated from `tools/mob-report.ts --llm-packet`. Markdown only. Companion to the DPS and eHP packets.

## Assumptions / Omissions

- Player model: weapon, armour, charm and mobility only, plus skill nodes, item upgrades and class affinities. NO core, relic, rune, rite, stance or ability is equipped — the bench bots carry all six, so these numbers are comparable to each other but NOT to bench output in absolute terms.

**Read the Walk first.** It is the only section that measures each biome against the
player who actually arrives there. Everything below it is detail for a biome the Walk
already told you to look at.

- Monster-centric: subject is the world's offence and durability, bucketed by biome tier 1.
- Reference players are tier 2 (a player of tier P fights biome tier P-1). Defensive stats are averaged over spec-agnostic class builds × armor × recovery.
- Reference player DPS uses shared `estimatePlayerDps` across concrete class builds, including full Conduit formations. T3 specialization, abilities, target-state mechanics, and shields/soft-caps remain outside this planning TTK; cross-check the detailed DPS packet for spec-level clear speed.
- TTL = player maxHP ÷ incoming DPS with **no player recovery** (that lives in the eHP packet). Incoming DPS folds plating/DR/averaged evasion; player DoT-resistance is not applied here.
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 11 mobs; tier avg HP 163, avg total DPS 21.3.

## The Walk

_Each biome measured against the player who actually arrives there, in authored ladder order. Arrival gear is DERIVED: Global Mastery accrues as you master each biome, and GM is the only gate on upgrade level, so the ladder walks +0 to +4. "Cost/kill" is the share of your health pool one average kill spends — it folds offence and defence into one number. "Step" is this rung's cost divided by the previous rung's: 1.0 means the biome got no harder once your own growth is counted. Labels flag extremes for investigation; they are not pass/fail gates._

| # | Biome | Arrive with | GM | Mob TTK | Your TTL | Worst hit %HP | Cost/kill | Step |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Plains | T1 +0 | 0 | 1.90s | 44.2s | 6.33% (Boar) | 4.29% | - | baseline |
| 2 | Forest | T1 +1 | 6 | 3.52s | 19.0s | 7.40% (Wolf) | 18.5% | 4.31x | WALL |
| 3 | Swamp | T1 +2 | 12 | 3.12s | 9.43s | 2.40% (Mud Toad) | 33.1% | 1.79x | ok |
| 4 | Mountain | T1 +3 | 18 | 4.62s | 8.31s | 57.2% (Ridge Ambusher) | 55.6% | 1.68x | ok |
| 5 | Caverns | T1 +4 | 24 | 5.62s | 7.11s | 87.0% (Cave Brute) | 79.0% | 1.42x | ok |

## Walls & Stalls

_Only the rungs that break the pattern. Everything absent from this table walked cleanly._

| Biome | Signal | Detail |
| --- | --- | --- |
| Forest | Difficulty wall | cost/kill jumps 4.31x over the previous rung |
| Swamp | Low TTL | 9.43s to die under mean pressure (no recovery modelled) |
| Mountain | Heavy spike | Ridge Ambusher hits for 57.2% of maxHP |
| Mountain | Low TTL | 8.31s to die under mean pressure (no recovery modelled) |
| Caverns | Heavy spike | Cave Brute hits for 87.0% of maxHP |
| Caverns | Low TTL | 7.11s to die under mean pressure (no recovery modelled) |


## Arrival Players

_Derived, not assumed: GM accrues per biome mastered and gates upgrade level, so the ladder walks +0 to +4._

| # | Arrive at | Gear | GM | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Plains | T1 +0 | 0 | 158 | 7.76 | 2.92% | 7.98% | 33.2 | 0.97 |
| 2 | Forest | T1 +1 | 6 | 162 | 8.02 | 3.12% | 8.18% | 34.6 | 0.97 |
| 3 | Swamp | T1 +2 | 12 | 166 | 9.13 | 3.32% | 8.38% | 36.1 | 0.97 |
| 4 | Mountain | T1 +3 | 18 | 171 | 9.34 | 3.52% | 8.57% | 37.4 | 0.97 |
| 5 | Caverns | T1 +4 | 24 | 175 | 10.6 | 3.72% | 8.77% | 39.2 | 0.98 |


---

## Detail

_Fixed-reference views, kept for cross-biome comparison at one power level. These do NOT account for the walk — read them only after the Walk has pointed you at a biome._

## Boss / Elite Table

_Bosses for biome tier 1 vs the boss-ready reference player (T2 +3). TTK uses the shared class-aware planning estimator; T3 specs, abilities, and shields/soft-caps remain unmodeled. TTL is player survival with no recovery modeled._

| Boss | Biome | HP | Attack profile | Raw DPS | Spike | Defenses | Expected TTK | Player TTL | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Obsidian Broodmother | Caverns | 1750 | 47.0 @ 0.36 aps | 22.7 | ×1.80 | plate 6.00, DR 10.0% | 30.7s | 15.0s | Risky | - |
| Gnarled Greatbear | Forest | 2000 | 24.0 @ 0.71 aps | 34.3 | ×1.28 | plate 0.00, DR 0.00% | 27.8s | 21.7s | Safe | - |
| Crag Behemoth | Mountain | 2100 | 56.0 @ 0.29 aps | 22.8 | ×1.90 | plate 0.00, DR 0.00% | 29.2s | 13.6s | Risky | - |
| Tusked Razorback | Plains | 1700 | 34.0 @ 0.50 aps | 17.0 | ×1.00 | plate 4.00, DR 2.00% | 26.6s | 25.5s | Safe | - |
| Grave Toadeater | Swamp | 2100 | 13.0 @ 0.38 aps | 21.8 | ×1.00 | plate 2.00, DR 2.00% | 31.2s | 13.1s | Risky | - |

## Mob / Boss Diagnostic Signals

_Attention signals only: mobs >±25% of biome-tier average on HP / raw DPS / spike, bosses outside the TTK/TTL observation bands, and narrow biome threat profiles. These are not verdicts or balance gates._

| Flag | Subject | Detail |
| --- | --- | --- |
| HP > +25% tier avg | Cave Lurker | 225 vs avg 163 (×1.38) |
| Spike < -25% tier avg | Cave Lurker | 31.0 vs avg 57.8 (×0.54) |
| HP > +25% tier avg | Cave Brute | 250 vs avg 163 (×1.53) |
| Raw DPS > +25% tier avg | Cave Brute | 42.3 vs avg 18.3 (×2.31) |
| Spike > +25% tier avg | Cave Brute | 180 vs avg 57.8 (×3.11) |
| Raw DPS < -25% tier avg | Moss Rat | 12.1 vs avg 18.3 (×0.66) |
| Spike < -25% tier avg | Moss Rat | 17.0 vs avg 57.8 (×0.29) |
| Spike < -25% tier avg | Wolf | 20.0 vs avg 57.8 (×0.35) |
| Raw DPS > +25% tier avg | Cliff Hopper | 26.3 vs avg 18.3 (×1.44) |
| Spike > +25% tier avg | Cliff Hopper | 105 vs avg 57.8 (×1.82) |
| Raw DPS > +25% tier avg | Cliff Hopper | 26.3 vs avg 18.3 (×1.44) |
| Spike > +25% tier avg | Cliff Hopper | 105 vs avg 57.8 (×1.82) |
| HP > +25% tier avg | Ridge Ambusher | 240 vs avg 163 (×1.47) |
| Raw DPS > +25% tier avg | Ridge Ambusher | 27.7 vs avg 18.3 (×1.51) |
| Spike > +25% tier avg | Ridge Ambusher | 125 vs avg 57.8 (×2.16) |
| HP < -25% tier avg | Field Hare | 50.0 vs avg 163 (×0.31) |
| Raw DPS < -25% tier avg | Field Hare | 6.00 vs avg 18.3 (×0.33) |
| Spike < -25% tier avg | Field Hare | 12.0 vs avg 57.8 (×0.21) |
| HP < -25% tier avg | Boar | 100 vs avg 163 (×0.61) |
| Raw DPS < -25% tier avg | Boar | 9.47 vs avg 18.3 (×0.52) |
| Spike < -25% tier avg | Boar | 18.0 vs avg 57.8 (×0.31) |
| Raw DPS < -25% tier avg | Mire Ooze | 5.00 vs avg 18.3 (×0.27) |
| Spike < -25% tier avg | Mire Ooze | 10.0 vs avg 57.8 (×0.17) |
| HP < -25% tier avg | Mud Toad | 120 vs avg 163 (×0.74) |
| Raw DPS < -25% tier avg | Mud Toad | 5.91 vs avg 18.3 (×0.32) |
| Spike < -25% tier avg | Mud Toad | 13.0 vs avg 57.8 (×0.22) |
| biome single-type | Caverns | 100% Direct damage |
| biome single-type | Forest | 100% Direct damage |
| biome single-type | Mountain | 100% Direct damage |
| biome single-type | Plains | 100% Direct damage |
| biome single-type | Swamp | 100% DoT damage |

## Mob Stat Summary

_Every non-boss spawn in biome tier 1, sorted by raw total DPS within each biome. Raw DPS is pre-mitigation (attack × APS); DoT/s assumes full refreshed stacks._

| Biome | Mob | Role | HP | Attack | APS / CD | Raw DPS | DoT/s | Plating | DR | Range | Speed | Spike | Specials |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | Cave Brute | Spiker | 250 | 90.0 | 0.36 / 2800ms | 42.3 | 0.00 | 1.00 | 10.0% | 12.0 | 18.0 | ×2.00 | charge ×2.50 |
| Caverns | Cave Lurker | Bruiser | 225 | 31.0 | 0.71 / 1400ms | 22.1 | 0.00 | 1.00 | 5.00% | 12.0 | 68.0 | ×1.00 | - |
| Forest | Wolf | Bruiser | 130 | 20.0 | 0.91 / 1100ms | 18.2 | 0.00 | 0.00 | 0.00% | 12.0 | 82.0 | ×1.00 | - |
| Forest | Moss Rat | Bruiser | 160 | 17.0 | 0.71 / 1400ms | 12.1 | 0.00 | 0.00 | 0.00% | 12.0 | 54.0 | ×1.00 | - |
| Mountain | Ridge Ambusher | Spiker | 240 | 50.0 | 0.32 / 3100ms | 27.7 | 0.00 | 0.00 | 0.00% | 210 | 26.0 | ×2.50 | - |
| Mountain | Cliff Hopper | Spiker | 190 | 50.0 | 0.33 / 3000ms | 26.3 | 0.00 | 0.00 | 0.00% | 12.0 | 28.0 | ×2.10 | charge ×3.00 |
| Mountain | Cliff Hopper | Spiker | 190 | 50.0 | 0.33 / 3000ms | 26.3 | 0.00 | 0.00 | 0.00% | 12.0 | 28.0 | ×2.10 | charge ×3.00 |
| Plains | Boar | Bruiser | 100 | 18.0 | 0.53 / 1900ms | 9.47 | 0.00 | 0.00 | 0.00% | 12.0 | 50.0 | ×1.00 | charge ×2.50 |
| Plains | Field Hare | Bruiser | 50.0 | 12.0 | 0.50 / 2000ms | 6.00 | 0.00 | 0.00 | 0.00% | 12.0 | 46.0 | ×1.00 | - |
| Swamp | Mire Ooze | DoT | 140 | 10.0 | 0.50 / 2000ms | 5.00 | 18.0 | 0.00 | 0.00% | 12.0 | 28.0 | ×1.00 | dot 18.0/s×3 |
| Swamp | Mud Toad | DoT | 120 | 13.0 | 0.45 / 2200ms | 5.91 | 15.0 | 2.00 | 0.00% | 12.0 | 30.0 | ×1.00 | dot 15.0/s×3, slow ×0.60 |
