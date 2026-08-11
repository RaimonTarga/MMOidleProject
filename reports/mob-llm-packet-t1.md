# MMO Idle Monster Balance Packet - Biome Tier 1

Generated from `tools/mob-report.ts --llm-packet`. Markdown only. Companion to the DPS and eHP packets.

## Assumptions / Omissions

- Monster-centric: subject is the world's offence and durability, bucketed by biome tier 1.
- Reference players are tier 2 (a player of tier P fights biome tier P-1). Defensive stats are averaged over spec-agnostic class builds × armor × recovery; the boss-ready profile biases to the tankiest armor.
- Reference player DPS is **direct-hit only** (class empowered/cadence/DoT mechanics omitted) → boss TTK is an UPPER bound. Shields/soft-caps extend TTK further. Cross-check the DPS packet for real clear speed.
- TTL pressure = player maxHP ÷ incoming DPS with **no player recovery** (that lives in the eHP packet). Incoming DPS folds plating/DR/averaged evasion; player DoT-resistance is not applied here.
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 11 mobs; tier avg HP 160, avg total DPS 9.45.

## Reference Players

| Player | Gear | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Entry (prev-tier +3) | T1 +3 | 182 | 15.6 | 5.96% | 11.7% | 64.5 | 0.96 |
| Same-tier +0 | T2 +0 | 182 | 13.3 | 5.98% | 11.9% | 59.2 | 1.16 |
| Same-tier +3 | T2 +3 | 213 | 21.0 | 6.84% | 15.8% | 86.5 | 1.16 |
| Boss-ready (tankiest +3) | T2 +3 | 223 | 23.6 | 3.56% | 6.00% | 86.5 | 1.16 |


## Cross-Biome Threat & Reward

_Every biome at tier 1, ranked by mean incoming DPS against Entry (prev-tier +3). Threat is post-mitigation; spike is the worst individual hit. Rewards are authored per-kill means, not hourly yield. The threat index is relative to this tier's sibling median, not a target._

| Biome | Threat index | Mean HP | Max HP | Mean incoming DPS | Max incoming DPS | Worst spike %HP | Density | Essence / kill | Biome XP / kill |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Swamp | ×1.74 | 128 | 145 | 5.76 | 5.78 | 0.55% (Mire Ooze) | 10 | 5.50 | 38.5 |
| Mountain | ×1.49 | 180 | 200 | 4.93 | 5.30 | 10.4% (Cliff Hopper) | 12 | 6.67 | 45.3 |
| Caverns | ×1.00 | 325 | 400 | 3.30 | 5.91 | 12.6% (Cave Brute) | 8 | 11.5 | 80.0 |
| Plains | ×0.23 | 75.0 | 100 | 0.76 | 1.03 | 1.10% (Boar) | 24 | 2.50 | 14.0 |
| Forest | ×0.22 | 80.0 | 100 | 0.73 | 0.81 | 0.55% (Moss Rat) | 18 | 3.50 | 21.5 |

## Cross-Biome Deviation Signals

_Discovery-only signals for values at least 25% from the tier-sibling median. Deliberate outliers are expected; this is neither a pass/fail gate nor a recommended balance band._

| Biome | Axis | Metric | Value | Sibling median | Deviation |
| --- | --- | --- | --- | --- | --- |
| Caverns | Threat | Worst spike %HP | 12.6% | 1.10% | +1050% |
| Mountain | Threat | Worst spike %HP | 10.4% | 1.10% | +850% |
| Caverns | Reward | Essence / kill | 11.5 | 5.50 | +109% |
| Caverns | Reward | Biome XP / kill | 80.0 | 38.5 | +108% |
| Plains | Exposure | Mob density | 24.0 | 12.0 | +100% |
| Forest | Threat | Max incoming DPS | 0.81 | 5.30 | -84.6% |
| Plains | Threat | Max incoming DPS | 1.03 | 5.30 | -80.6% |
| Forest | Threat | Mean incoming DPS | 0.73 | 3.30 | -77.8% |
| Plains | Threat | Mean incoming DPS | 0.76 | 3.30 | -77.1% |
| Swamp | Threat | Mean incoming DPS | 5.76 | 3.30 | +74.3% |
| Plains | Reward | Biome XP / kill | 14.0 | 38.5 | -63.6% |
| Plains | Reward | Essence / kill | 2.50 | 5.50 | -54.5% |
| Forest | Threat | Worst spike %HP | 0.55% | 1.10% | -50.0% |
| Forest | Exposure | Mob density | 18.0 | 12.0 | +50.0% |
| Swamp | Threat | Worst spike %HP | 0.55% | 1.10% | -50.0% |
| Mountain | Threat | Mean incoming DPS | 4.93 | 3.30 | +49.2% |
| Forest | Reward | Biome XP / kill | 21.5 | 38.5 | -44.2% |
| Forest | Reward | Essence / kill | 3.50 | 5.50 | -36.4% |
| Caverns | Exposure | Mob density | 8.00 | 12.0 | -33.3% |

## Player Matchup Summary

_Mean resolved per-mob pressure vs the four reference players, with worst-spike %HP from the biome's hardest-spiking individual mob. Incoming DPS folds plating/DR/evasion; TTL = maxHP ÷ incoming (no player recovery — see eHP packet). Status: Safe/Risky/Blocked (mob risk<30s, block<10s, ≥50% spike = Risky, one-shot = Blocked)._

| Biome | Player | Incoming DPS | Worst spike %HP | TTL pressure | Status |
| --- | --- | --- | --- | --- | --- |
| Caverns | Entry (prev-tier +3) | 3.30 | 12.6% (Cave Brute) | 55.2s | Safe |
| Caverns | Same-tier +0 | 4.24 | 13.8% (Cave Brute) | 42.9s | Safe |
| Caverns | Same-tier +3 | 2.62 | 8.47% (Cave Brute) | 81.0s | Safe |
| Caverns | Boss-ready (tankiest +3) | 2.45 | 7.19% (Cave Brute) | 91.0s | Safe |
| Forest | Entry (prev-tier +3) | 0.73 | 0.55% (Moss Rat) | 249s | Safe |
| Forest | Same-tier +0 | 0.73 | 0.55% (Moss Rat) | 249s | Safe |
| Forest | Same-tier +3 | 0.72 | 0.47% (Moss Rat) | 294s | Safe |
| Forest | Boss-ready (tankiest +3) | 0.74 | 0.45% (Moss Rat) | 299s | Safe |
| Mountain | Entry (prev-tier +3) | 4.93 | 10.4% (Cliff Hopper) | 37.0s | Safe |
| Mountain | Same-tier +0 | 5.55 | 11.6% (Cliff Hopper) | 32.7s | Safe |
| Mountain | Same-tier +3 | 3.48 | 6.59% (Cliff Hopper) | 61.0s | Safe |
| Mountain | Boss-ready (tankiest +3) | 3.03 | 5.39% (Cliff Hopper) | 73.5s | Safe |
| Plains | Entry (prev-tier +3) | 0.76 | 1.10% (Boar) | 240s | Safe |
| Plains | Same-tier +0 | 1.27 | 2.20% (Boar) | 143s | Safe |
| Plains | Same-tier +3 | 0.49 | 0.47% (Field Hare) | 430s | Safe |
| Plains | Boss-ready (tankiest +3) | 0.51 | 0.45% (Field Hare) | 437s | Safe |
| Swamp | Entry (prev-tier +3) | 5.76 | 0.55% (Mire Ooze) | 31.7s | Safe |
| Swamp | Same-tier +0 | 5.76 | 0.55% (Mire Ooze) | 31.6s | Safe |
| Swamp | Same-tier +3 | 5.75 | 0.47% (Mire Ooze) | 36.9s | Safe |
| Swamp | Boss-ready (tankiest +3) | 5.77 | 0.45% (Mire Ooze) | 38.6s | Safe |

## Biome Threat Summary

_Per-biome aggregates for biome tier 1. "Hardest hitter" uses raw direct DPS; "tankiest" weights plating ×8 against HP._

| Biome | Mobs | Avg HP | Avg DPS | Avg atk | Avg APS | Avg DoT/s | Hardest | Fastest | Tankiest | DoT-heavy | Biggest spike | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | 2 | 325 | 11.0 | 28.0 | 0.49 | 0.00 | Cave Lurker | Cave Lurker | Cave Brute | - | Cave Brute ×1.00 | density 8; 0/2 carry DoT |
| Forest | 2 | 80.0 | 9.17 | 12.0 | 0.75 | 0.00 | Wolf | Wolf | Moss Rat | - | Wolf ×1.00 | density 18; 0/2 carry DoT |
| Mountain | 3 | 180 | 9.90 | 34.7 | 0.29 | 0.00 | Cliff Hopper | Cliff Hopper | Ridge Ambusher | - | Cliff Hopper ×1.00 | density 12; 0/3 carry DoT |
| Plains | 2 | 75.0 | 7.74 | 15.0 | 0.51 | 0.00 | Boar | Boar | Boar | - | Boar ×1.00 | density 24; 0/2 carry DoT |
| Swamp | 2 | 128 | 3.90 | 9.00 | 0.44 | 5.33 | Mud Toad | Mire Ooze | Mud Toad | Mire Ooze | Mud Toad ×1.00 | density 10; 2/2 carry DoT |

## Boss / Elite Table

_Bosses for biome tier 1 vs the boss-ready reference player (T2 +3). TTK is an UPPER bound from direct-hit DPS only (class empowered/DoT mechanics omitted; shields/soft-caps extend it). TTL is player survival with no recovery modeled._

| Boss | Biome | HP | Attack profile | Raw DPS | Spike | Defenses | Expected TTK | Player TTL | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Obsidian Broodmother | Caverns | 1050 | 40.0 @ 0.36 aps | 14.3 | ×1.60 | plate 6.00, DR 10.0% | 12.1s | 39.2s | Safe | - |
| Gnarled Greatbear | Forest | 1250 | 36.0 @ 0.71 aps | 25.7 | ×1.10 | plate 0.00, DR 0.00% | 12.0s | 26.1s | Safe | - |
| Crag Behemoth | Mountain | 1400 | 60.0 @ 0.29 aps | 17.1 | ×1.60 | plate 0.00, DR 0.00% | 13.4s | 22.4s | Safe | - |
| Tusked Razorback | Plains | 1500 | 42.0 @ 0.50 aps | 21.0 | ×1.10 | plate 4.00, DR 2.00% | 15.4s | 24.9s | Safe | - |
| Grave Toadeater | Swamp | 1150 | 12.0 @ 0.38 aps | 13.6 | ×1.60 | plate 2.00, DR 2.00% | 11.5s | 23.7s | Safe | - |

## Mob / Boss Diagnostic Signals

_Attention signals only: mobs >±25% of biome-tier average on HP / raw DPS / spike, bosses outside the TTK/TTL observation bands, and narrow biome threat profiles. These are not verdicts or balance gates._

| Flag | Subject | Detail |
| --- | --- | --- |
| HP > +25% tier avg | Cave Lurker | 250 vs avg 160 (×1.57) |
| Raw DPS > +25% tier avg | Cave Lurker | 11.4 vs avg 8.48 (×1.35) |
| HP > +25% tier avg | Cave Brute | 400 vs avg 160 (×2.51) |
| Spike > +25% tier avg | Cave Brute | 40.0 vs avg 21.1 (×1.90) |
| HP < -25% tier avg | Moss Rat | 100 vs avg 160 (×0.63) |
| Spike < -25% tier avg | Moss Rat | 10.0 vs avg 21.1 (×0.47) |
| HP < -25% tier avg | Wolf | 60.0 vs avg 160 (×0.38) |
| Raw DPS > +25% tier avg | Wolf | 11.7 vs avg 8.48 (×1.38) |
| Spike < -25% tier avg | Wolf | 14.0 vs avg 21.1 (×0.66) |
| Spike > +25% tier avg | Cliff Hopper | 36.0 vs avg 21.1 (×1.71) |
| Spike > +25% tier avg | Cliff Hopper | 36.0 vs avg 21.1 (×1.71) |
| HP > +25% tier avg | Ridge Ambusher | 200 vs avg 160 (×1.25) |
| Spike > +25% tier avg | Ridge Ambusher | 32.0 vs avg 21.1 (×1.52) |
| HP < -25% tier avg | Field Hare | 50.0 vs avg 160 (×0.31) |
| Raw DPS < -25% tier avg | Field Hare | 6.00 vs avg 8.48 (×0.71) |
| Spike < -25% tier avg | Field Hare | 12.0 vs avg 21.1 (×0.57) |
| HP < -25% tier avg | Boar | 100 vs avg 160 (×0.63) |
| HP < -25% tier avg | Mire Ooze | 110 vs avg 160 (×0.69) |
| Raw DPS < -25% tier avg | Mire Ooze | 3.64 vs avg 8.48 (×0.43) |
| Spike < -25% tier avg | Mire Ooze | 8.00 vs avg 21.1 (×0.38) |
| Raw DPS < -25% tier avg | Mud Toad | 4.17 vs avg 8.48 (×0.49) |
| Spike < -25% tier avg | Mud Toad | 10.0 vs avg 21.1 (×0.47) |
| biome single-type | Caverns | 100% Direct damage |
| biome single-type | Forest | 100% Direct damage |
| biome single-type | Mountain | 100% Direct damage |
| biome single-type | Plains | 100% Direct damage |

## Mob Stat Summary

_Every non-boss spawn in biome tier 1, sorted by raw total DPS within each biome. Raw DPS is pre-mitigation (attack × APS); DoT/s assumes full refreshed stacks._

| Biome | Mob | Role | HP | Attack | APS / CD | Raw DPS | DoT/s | Plating | DR | Range | Speed | Spike | Specials |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | Cave Lurker | Bruiser | 250 | 16.0 | 0.71 / 1400ms | 11.4 | 0.00 | 4.00 | 5.00% | 12.0 | 68.0 | ×1.00 | - |
| Caverns | Cave Brute | Bruiser | 400 | 40.0 | 0.26 / 3800ms | 10.5 | 0.00 | 2.00 | 10.0% | 12.0 | 18.0 | ×1.00 | charge ×2.50 |
| Forest | Wolf | Bruiser | 60.0 | 14.0 | 0.83 / 1200ms | 11.7 | 0.00 | 0.00 | 0.00% | 12.0 | 82.0 | ×1.00 | - |
| Forest | Moss Rat | Bruiser | 100 | 10.0 | 0.67 / 1500ms | 6.67 | 0.00 | 0.00 | 0.00% | 12.0 | 54.0 | ×1.00 | - |
| Mountain | Cliff Hopper | Bruiser | 170 | 36.0 | 0.29 / 3500ms | 10.3 | 0.00 | 0.00 | 0.00% | 12.0 | 28.0 | ×1.00 | charge ×3.00 |
| Mountain | Cliff Hopper | Bruiser | 170 | 36.0 | 0.29 / 3500ms | 10.3 | 0.00 | 0.00 | 0.00% | 12.0 | 28.0 | ×1.00 | charge ×3.00 |
| Mountain | Ridge Ambusher | Bruiser | 200 | 32.0 | 0.29 / 3500ms | 9.14 | 0.00 | 0.00 | 0.00% | 210 | 26.0 | ×1.00 | - |
| Plains | Boar | Bruiser | 100 | 18.0 | 0.53 / 1900ms | 9.47 | 0.00 | 0.00 | 0.00% | 12.0 | 50.0 | ×1.00 | charge ×2.50 |
| Plains | Field Hare | Bruiser | 50.0 | 12.0 | 0.50 / 2000ms | 6.00 | 0.00 | 0.00 | 0.00% | 12.0 | 46.0 | ×1.00 | - |
| Swamp | Mud Toad | DoT | 145 | 10.0 | 0.42 / 2400ms | 4.17 | 5.33 | 2.00 | 0.00% | 12.0 | 30.0 | ×1.00 | dot 5.33/s×4 |
| Swamp | Mire Ooze | DoT | 110 | 8.00 | 0.45 / 2200ms | 3.64 | 5.33 | 0.00 | 0.00% | 12.0 | 28.0 | ×1.00 | dot 5.33/s×4 |
