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
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 11 mobs; tier avg HP 163, avg total DPS 18.6.

## The Walk

_Each biome measured against the player who actually arrives there, in authored ladder order. Arrival gear is DERIVED: Global Mastery accrues as you master each biome, and GM is the only gate on upgrade level, so the ladder walks +0 to +4. "Cost/kill" is the share of your health pool one average kill spends — it folds offence and defence into one number. "Step" is this rung's cost divided by the previous rung's: 1.0 means the biome got no harder once your own growth is counted. Labels flag extremes for investigation; they are not pass/fail gates._

| # | Biome | Arrive with | GM | Mob TTK | Your TTL | Worst hit %HP | Cost/kill | Step |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Plains | T1 +0 | 0 | 1.78s | 30.4s | 8.07% (Boar) | 5.86% | - | baseline |
| 2 | Forest | T1 +1 | 6 | 3.32s | 15.2s | 9.09% (Wolf) | 21.8% | 3.72x | WALL |
| 3 | Swamp | T1 +2 | 12 | 2.92s | 9.93s | 5.35% (Mud Toad) | 29.4% | 1.35x | ok |
| 4 | Mountain | T1 +3 | 18 | 4.35s | 10.9s | 40.8% (Ridge Ambusher) | 40.0% | 1.36x | ok |
| 5 | Caverns | T1 +4 | 24 | 5.31s | 7.50s | 74.9% (Cave Brute) | 70.8% | 1.77x | ok |

## Walls & Stalls

_Only the rungs that break the pattern. Everything absent from this table walked cleanly._

| Biome | Signal | Detail |
| --- | --- | --- |
| Forest | Difficulty wall | cost/kill jumps 3.72x over the previous rung |
| Swamp | Low TTL | 9.93s to die under mean pressure (no recovery modelled) |
| Mountain | Low TTL | 10.9s to die under mean pressure (no recovery modelled) |
| Caverns | Heavy spike | Cave Brute hits for 74.9% of maxHP |
| Caverns | Low TTL | 7.50s to die under mean pressure (no recovery modelled) |


## Arrival Players

_Derived, not assumed: GM accrues per biome mastered and gates upgrade level, so the ladder walks +0 to +4._

| # | Arrive at | Gear | GM | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Plains | T1 +0 | 0 | 161 | 2.64 | 14.1% | 11.0% | 34.5 | 0.99 |
| 2 | Forest | T1 +1 | 6 | 165 | 2.64 | 14.2% | 11.3% | 35.8 | 0.99 |
| 3 | Swamp | T1 +2 | 12 | 168 | 2.64 | 14.3% | 11.6% | 37.4 | 0.99 |
| 4 | Mountain | T1 +3 | 18 | 173 | 3.09 | 14.5% | 11.9% | 38.7 | 0.99 |
| 5 | Caverns | T1 +4 | 24 | 176 | 3.09 | 14.6% | 12.2% | 40.3 | 0.99 |


---

## Detail

_Fixed-reference views, kept for cross-biome comparison at one power level. These do NOT account for the walk — read them only after the Walk has pointed you at a biome._

## Boss / Elite Table

_Bosses for biome tier 1 vs the boss-ready reference player (T2 +3). TTK uses the shared class-aware planning estimator; T3 specs, abilities, and shields/soft-caps remain unmodeled. TTL is player survival with no recovery modeled._

| Boss | Biome | HP | Attack profile | Raw DPS | Spike | Defenses | Expected TTK | Player TTL | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Obsidian Broodmother | Caverns | 1750 | 40.0 @ 0.36 aps | 14.3 | ×1.00 | plate 6.00, DR 10.0% | 24.8s | 21.5s | Safe | - |
| Gnarled Greatbear | Forest | 1800 | 18.0 @ 0.53 aps | 18.9 | ×1.00 | plate 0.00, DR 0.00% | 20.5s | 19.9s | Risky | - |
| Crag Behemoth | Mountain | 2100 | 56.0 @ 0.29 aps | 16.0 | ×1.00 | plate 0.00, DR 0.00% | 23.9s | 18.7s | Risky | - |
| Tusked Razorback | Plains | 1700 | 26.0 @ 0.50 aps | 13.0 | ×1.00 | plate 4.00, DR 2.00% | 21.4s | 25.6s | Safe | - |
| Grave Toadeater | Swamp | 2100 | 13.0 @ 0.38 aps | 13.8 | ×1.00 | plate 2.00, DR 2.00% | 25.3s | 20.6s | Safe | - |

## Mob / Boss Diagnostic Signals

_Attention signals only: mobs >±25% of biome-tier average on HP / raw DPS / spike, bosses outside the TTK/TTL observation bands, and narrow biome threat profiles. These are not verdicts or balance gates._

| Flag | Subject | Detail |
| --- | --- | --- |
| HP > +25% tier avg | Cave Lurker | 225 vs avg 163 (×1.38) |
| Raw DPS > +25% tier avg | Cave Lurker | 22.1 vs avg 16.1 (×1.37) |
| Spike < -25% tier avg | Cave Lurker | 31.0 vs avg 47.4 (×0.65) |
| HP > +25% tier avg | Cave Brute | 250 vs avg 163 (×1.53) |
| Raw DPS > +25% tier avg | Cave Brute | 37.6 vs avg 16.1 (×2.33) |
| Spike > +25% tier avg | Cave Brute | 160 vs avg 47.4 (×3.38) |
| Spike < -25% tier avg | Moss Rat | 17.0 vs avg 47.4 (×0.36) |
| Spike < -25% tier avg | Wolf | 20.0 vs avg 47.4 (×0.42) |
| Spike > +25% tier avg | Cliff Hopper | 76.0 vs avg 47.4 (×1.60) |
| Spike > +25% tier avg | Cliff Hopper | 76.0 vs avg 47.4 (×1.60) |
| HP > +25% tier avg | Ridge Ambusher | 240 vs avg 163 (×1.47) |
| Raw DPS > +25% tier avg | Ridge Ambusher | 20.7 vs avg 16.1 (×1.28) |
| Spike > +25% tier avg | Ridge Ambusher | 88.0 vs avg 47.4 (×1.86) |
| HP < -25% tier avg | Field Hare | 50.0 vs avg 163 (×0.31) |
| Raw DPS < -25% tier avg | Field Hare | 6.00 vs avg 16.1 (×0.37) |
| Spike < -25% tier avg | Field Hare | 12.0 vs avg 47.4 (×0.25) |
| HP < -25% tier avg | Boar | 100 vs avg 163 (×0.61) |
| Raw DPS < -25% tier avg | Boar | 9.47 vs avg 16.1 (×0.59) |
| Spike < -25% tier avg | Boar | 18.0 vs avg 47.4 (×0.38) |
| Raw DPS < -25% tier avg | Mire Ooze | 5.00 vs avg 16.1 (×0.31) |
| Spike < -25% tier avg | Mire Ooze | 10.0 vs avg 47.4 (×0.21) |
| HP < -25% tier avg | Mud Toad | 120 vs avg 163 (×0.74) |
| Raw DPS < -25% tier avg | Mud Toad | 5.91 vs avg 16.1 (×0.37) |
| Spike < -25% tier avg | Mud Toad | 13.0 vs avg 47.4 (×0.27) |
| biome single-type | Caverns | 100% Direct damage |
| biome single-type | Forest | 100% Direct damage |
| biome single-type | Mountain | 100% Direct damage |
| biome single-type | Plains | 100% Direct damage |
| biome single-type | Swamp | 100% DoT damage |

## Mob Stat Summary

_Every non-boss spawn in biome tier 1, sorted by raw total DPS within each biome. Raw DPS is pre-mitigation (attack × APS); DoT/s assumes full refreshed stacks._

| Biome | Mob | Role | HP | Attack | APS / CD | Raw DPS | DoT/s | Plating | DR | Range | Speed | Spike | Specials |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | Cave Brute | Spiker | 250 | 80.0 | 0.36 / 2800ms | 37.6 | 0.00 | 1.00 | 10.0% | 12.0 | 18.0 | ×2.00 | charge ×2.50 |
| Caverns | Cave Lurker | Bruiser | 225 | 31.0 | 0.71 / 1400ms | 22.1 | 0.00 | 1.00 | 5.00% | 12.0 | 68.0 | ×1.00 | - |
| Forest | Wolf | Bruiser | 130 | 20.0 | 0.91 / 1100ms | 18.2 | 0.00 | 0.00 | 0.00% | 12.0 | 82.0 | ×1.00 | - |
| Forest | Moss Rat | Bruiser | 160 | 17.0 | 0.71 / 1400ms | 12.1 | 0.00 | 0.00 | 0.00% | 12.0 | 54.0 | ×1.00 | - |
| Mountain | Ridge Ambusher | Spiker | 240 | 40.0 | 0.32 / 3100ms | 20.7 | 0.00 | 0.00 | 0.00% | 210 | 26.0 | ×2.20 | - |
| Mountain | Cliff Hopper | Spiker | 190 | 40.0 | 0.33 / 3000ms | 20.1 | 0.00 | 0.00 | 0.00% | 12.0 | 28.0 | ×1.90 | charge ×3.00 |
| Mountain | Cliff Hopper | Spiker | 190 | 40.0 | 0.33 / 3000ms | 20.1 | 0.00 | 0.00 | 0.00% | 12.0 | 28.0 | ×1.90 | charge ×3.00 |
| Plains | Boar | Bruiser | 100 | 18.0 | 0.53 / 1900ms | 9.47 | 0.00 | 0.00 | 0.00% | 12.0 | 50.0 | ×1.00 | charge ×2.50 |
| Plains | Field Hare | Bruiser | 50.0 | 12.0 | 0.50 / 2000ms | 6.00 | 0.00 | 0.00 | 0.00% | 12.0 | 46.0 | ×1.00 | - |
| Swamp | Mire Ooze | DoT | 140 | 10.0 | 0.50 / 2000ms | 5.00 | 15.0 | 0.00 | 0.00% | 12.0 | 28.0 | ×1.00 | dot 15.0/s×3 |
| Swamp | Mud Toad | DoT | 120 | 13.0 | 0.45 / 2200ms | 5.91 | 12.0 | 2.00 | 0.00% | 12.0 | 30.0 | ×1.00 | dot 12.0/s×3, slow ×0.60 |
