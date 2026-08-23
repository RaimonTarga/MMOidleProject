# MMO Idle Monster Balance Packet - Biome Tier 1

Generated from `tools/mob-report.ts --llm-packet`. Markdown only. Companion to the DPS and eHP packets.

## Assumptions / Omissions

- Player model: weapon, armour, charm and mobility only, plus skill nodes, item upgrades and class affinities. NO core, relic, rune, rite, stance or ability is equipped — the bench bots carry all six, so these numbers are comparable to each other but NOT to bench output in absolute terms.

- Monster-centric: subject is the world's offence and durability, bucketed by biome tier 1.
- Reference players are tier 2 (a player of tier P fights biome tier P-1). Defensive stats are averaged over spec-agnostic class builds × armor × recovery; the boss-ready profile biases to the tankiest armor.
- Reference player DPS uses shared `estimatePlayerDps` across concrete class builds, including full Conduit formations. T3 specialization, abilities, target-state mechanics, and shields/soft-caps remain outside this planning TTK; cross-check the detailed DPS packet for spec-level clear speed.
- TTL pressure = player maxHP ÷ incoming DPS with **no player recovery** (that lives in the eHP packet). Incoming DPS folds plating/DR/averaged evasion; player DoT-resistance is not applied here.
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 11 mobs; tier avg HP 163, avg total DPS 21.3.

## Reference Players

| Player | Gear | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Entry (prev-tier +3) | T1 +3 | 171 | 9.34 | 3.52% | 8.57% | 37.4 | 0.97 |
| Same-tier +0 | T2 +0 | 183 | 11.9 | 3.58% | 10.3% | 40.8 | 1.14 |
| Same-tier +3 | T2 +3 | 209 | 16.4 | 4.01% | 12.4% | 51.7 | 1.14 |
| Boss-ready (tankiest +3) | T2 +3 | 216 | 16.6 | 1.72% | 4.78% | 51.7 | 1.14 |


## Cross-Biome Threat & Reward

_Every biome at tier 1, ranked by mean incoming DPS against Entry (prev-tier +3). Threat is post-mitigation; spike is the worst individual hit. Rewards are authored per-kill means, not hourly yield. The threat index is relative to this tier's sibling median, not a target._

| Biome | Threat index | Mean HP | Max HP | Mean incoming DPS | Max incoming DPS | Worst spike %HP | Density | Essence / kill | Biome XP / kill |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | ×1.44 | 238 | 250 | 25.4 | 36.0 | 91.5% (Cave Brute) | 16 | 11.5 | 80.0 |
| Mountain | ×1.16 | 207 | 240 | 20.5 | 21.3 | 57.2% (Ridge Ambusher) | 24 | 6.67 | 45.3 |
| Swamp | ×1.00 | 130 | 140 | 17.6 | 18.5 | 2.35% (Mud Toad) | 20 | 5.50 | 38.5 |
| Forest | ×0.39 | 145 | 160 | 6.92 | 8.94 | 5.86% (Wolf) | 36 | 3.50 | 21.5 |
| Plains | ×0.16 | 75.0 | 100 | 2.81 | 4.14 | 4.69% (Boar) | 48 | 2.50 | 14.0 |

## Cross-Biome Deviation Signals

_Discovery-only signals for values at least 25% from the tier-sibling median. Deliberate outliers are expected; this is neither a pass/fail gate nor a recommended balance band._

| Biome | Axis | Metric | Value | Sibling median | Deviation |
| --- | --- | --- | --- | --- | --- |
| Caverns | Threat | Worst spike %HP | 91.5% | 5.86% | +1460% |
| Mountain | Threat | Worst spike %HP | 57.2% | 5.86% | +875% |
| Caverns | Reward | Essence / kill | 11.5 | 5.50 | +109% |
| Caverns | Reward | Biome XP / kill | 80.0 | 38.5 | +108% |
| Plains | Exposure | Mob density | 48.0 | 24.0 | +100% |
| Caverns | Threat | Max incoming DPS | 36.0 | 18.5 | +95.0% |
| Plains | Threat | Mean incoming DPS | 2.81 | 17.6 | -84.1% |
| Plains | Threat | Max incoming DPS | 4.14 | 18.5 | -77.6% |
| Plains | Reward | Biome XP / kill | 14.0 | 38.5 | -63.6% |
| Forest | Threat | Mean incoming DPS | 6.92 | 17.6 | -60.7% |
| Swamp | Threat | Worst spike %HP | 2.35% | 5.86% | -60.0% |
| Plains | Reward | Essence / kill | 2.50 | 5.50 | -54.5% |
| Forest | Threat | Max incoming DPS | 8.94 | 18.5 | -51.7% |
| Forest | Exposure | Mob density | 36.0 | 24.0 | +50.0% |
| Forest | Reward | Biome XP / kill | 21.5 | 38.5 | -44.2% |
| Caverns | Threat | Mean incoming DPS | 25.4 | 17.6 | +44.0% |
| Forest | Reward | Essence / kill | 3.50 | 5.50 | -36.4% |
| Caverns | Exposure | Mob density | 16.0 | 24.0 | -33.3% |

## Player Matchup Summary

_Mean resolved per-mob pressure vs the four reference players, with worst-spike %HP from the biome's hardest-spiking individual mob. Incoming DPS folds plating/DR/evasion; TTL = maxHP ÷ incoming (no player recovery — see eHP packet). Status: Safe/Risky/Blocked (mob risk<30s, block<10s, ≥50% spike = Risky, one-shot = Blocked)._

| Biome | Player | Incoming DPS | Worst spike %HP | TTL pressure | Status |
| --- | --- | --- | --- | --- | --- |
| Caverns | Entry (prev-tier +3) | 25.4 | 91.5% (Cave Brute) | 6.72s | Blocked |
| Caverns | Same-tier +0 | 23.5 | 81.8% (Cave Brute) | 7.81s | Blocked |
| Caverns | Same-tier +3 | 21.1 | 67.8% (Cave Brute) | 9.94s | Blocked |
| Caverns | Boss-ready (tankiest +3) | 21.8 | 66.8% (Cave Brute) | 9.88s | Blocked |
| Forest | Entry (prev-tier +3) | 6.92 | 5.86% (Wolf) | 24.6s | Risky |
| Forest | Same-tier +0 | 5.29 | 4.36% (Wolf) | 34.7s | Safe |
| Forest | Same-tier +3 | 1.67 | 1.43% (Wolf) | 125s | Safe |
| Forest | Boss-ready (tankiest +3) | 1.71 | 1.39% (Wolf) | 126s | Safe |
| Mountain | Entry (prev-tier +3) | 20.5 | 57.2% (Ridge Ambusher) | 8.31s | Blocked |
| Mountain | Same-tier +0 | 19.3 | 50.5% (Ridge Ambusher) | 9.49s | Blocked |
| Mountain | Same-tier +3 | 16.6 | 38.2% (Ridge Ambusher) | 12.6s | Risky |
| Mountain | Boss-ready (tankiest +3) | 17.6 | 38.3% (Ridge Ambusher) | 12.3s | Risky |
| Plains | Entry (prev-tier +3) | 2.81 | 4.69% (Boar) | 60.8s | Safe |
| Plains | Same-tier +0 | 1.78 | 3.27% (Boar) | 103s | Safe |
| Plains | Same-tier +3 | 0.50 | 0.48% (Field Hare) | 420s | Safe |
| Plains | Boss-ready (tankiest +3) | 0.51 | 0.46% (Field Hare) | 422s | Safe |
| Swamp | Entry (prev-tier +3) | 17.6 | 2.35% (Mud Toad) | 9.67s | Blocked |
| Swamp | Same-tier +0 | 17.0 | 0.55% (Mire Ooze) | 10.8s | Risky |
| Swamp | Same-tier +3 | 17.0 | 0.48% (Mire Ooze) | 12.3s | Risky |
| Swamp | Boss-ready (tankiest +3) | 17.0 | 0.46% (Mire Ooze) | 12.7s | Risky |

## Biome Threat Summary

_Per-biome aggregates for biome tier 1. "Hardest hitter" uses raw direct DPS; "tankiest" weights plating ×8 against HP._

| Biome | Mobs | Avg HP | Avg DPS | Avg atk | Avg APS | Avg DoT/s | Hardest | Fastest | Tankiest | DoT-heavy | Biggest spike | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | 2 | 238 | 32.2 | 60.5 | 0.54 | 0.00 | Cave Brute | Cave Lurker | Cave Brute | - | Cave Brute ×2.00 | density 16; 0/2 carry DoT |
| Forest | 2 | 145 | 15.2 | 18.5 | 0.81 | 0.00 | Wolf | Wolf | Moss Rat | - | Wolf ×1.00 | density 36; 0/2 carry DoT |
| Mountain | 3 | 207 | 26.8 | 50.0 | 0.33 | 0.00 | Ridge Ambusher | Cliff Hopper | Ridge Ambusher | - | Ridge Ambusher ×2.50 | density 24; 0/3 carry DoT |
| Plains | 2 | 75.0 | 7.74 | 15.0 | 0.51 | 0.00 | Boar | Boar | Boar | - | Boar ×1.00 | density 48; 0/2 carry DoT |
| Swamp | 2 | 130 | 5.45 | 11.5 | 0.48 | 16.5 | Mud Toad | Mire Ooze | Mire Ooze | Mire Ooze | Mud Toad ×1.00 | density 20; 2/2 carry DoT |

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
