# MMO Idle Monster Balance Packet - Biome Tier 2

Generated from `tools/mob-report.ts --llm-packet`. Markdown only. Companion to the DPS and eHP packets.

## Assumptions / Omissions

- Player model: weapon, armour, charm and mobility only, plus skill nodes, item upgrades and class affinities. NO core, relic, rune, rite, stance or ability is equipped — the bench bots carry all six, so these numbers are comparable to each other but NOT to bench output in absolute terms.

- Monster-centric: subject is the world's offence and durability, bucketed by biome tier 2.
- Reference players are tier 3 (a player of tier P fights biome tier P-1). Defensive stats are averaged over spec-agnostic class builds × armor × recovery; the boss-ready profile biases to the tankiest armor.
- Reference player DPS uses shared `estimatePlayerDps` across concrete class builds, including full Conduit formations. T3 specialization, abilities, target-state mechanics, and shields/soft-caps remain outside this planning TTK; cross-check the detailed DPS packet for spec-level clear speed.
- TTL pressure = player maxHP ÷ incoming DPS with **no player recovery** (that lives in the eHP packet). Incoming DPS folds plating/DR/averaged evasion; player DoT-resistance is not applied here.
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 20 mobs; tier avg HP 313, avg total DPS 34.5.

## Reference Players

| Player | Gear | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Entry (prev-tier +3) | T2 +3 | 226 | 17.1 | 4.17% | 13.1% | 53.0 | 1.18 |
| Same-tier +0 | T3 +0 | 256 | 21.7 | 4.60% | 11.0% | 89.2 | 0.94 |
| Same-tier +3 | T3 +3 | 318 | 32.4 | 5.03% | 12.7% | 130 | 0.94 |
| Boss-ready (tankiest +3) | T3 +3 | 313 | 28.1 | 1.89% | 5.61% | 130 | 0.94 |


## Cross-Biome Threat & Reward

_Every biome at tier 2, ranked by mean incoming DPS against Entry (prev-tier +3). Threat is post-mitigation; spike is the worst individual hit. Rewards are authored per-kill means, not hourly yield. The threat index is relative to this tier's sibling median, not a target._

| Biome | Threat index | Mean HP | Max HP | Mean incoming DPS | Max incoming DPS | Worst spike %HP | Density | Essence / kill | Biome XP / kill |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Desert | ×1.81 | 660 | 660 | 45.6 | 46.8 | 51.4% (Stone Basilisk) | 16 | 7.50 | 43.0 |
| Caverns | ×1.45 | 320 | 400 | 36.5 | 45.5 | 119% (Cave Troll) | 16 | 18.7 | 110 |
| Mountain | ×1.20 | 286 | 336 | 30.1 | 34.1 | 67.2% (Granite Titan) | 24 | 13.0 | 74.3 |
| Swamp | ×1.00 | 177 | 210 | 25.1 | 38.1 | 12.4% (Mire Stalker) | 20 | 12.0 | 68.3 |
| Jungle | ×0.82 | 425 | 500 | 20.6 | 29.5 | 9.64% (Jungle Ape) | 40 | 7.33 | 40.0 |
| Forest | ×0.47 | 247 | 270 | 11.7 | 14.1 | 7.09% (Dire Wolf) | 36 | 9.00 | 51.0 |
| Plains | ×0.13 | 193 | 230 | 3.35 | 4.44 | 4.88% (Savanna Hawk) | 48 | 6.67 | 37.7 |

## Cross-Biome Deviation Signals

_Discovery-only signals for values at least 25% from the tier-sibling median. Deliberate outliers are expected; this is neither a pass/fail gate nor a recommended balance band._

| Biome | Axis | Metric | Value | Sibling median | Deviation |
| --- | --- | --- | --- | --- | --- |
| Caverns | Threat | Worst spike %HP | 119% | 12.4% | +860% |
| Mountain | Threat | Worst spike %HP | 67.2% | 12.4% | +441% |
| Desert | Threat | Worst spike %HP | 51.4% | 12.4% | +314% |
| Caverns | Reward | Biome XP / kill | 110 | 51.0 | +116% |
| Caverns | Reward | Essence / kill | 18.7 | 9.00 | +107% |
| Plains | Exposure | Mob density | 48.0 | 24.0 | +100% |
| Plains | Threat | Max incoming DPS | 4.44 | 34.1 | -87.0% |
| Plains | Threat | Mean incoming DPS | 3.35 | 25.1 | -86.7% |
| Desert | Threat | Mean incoming DPS | 45.6 | 25.1 | +81.4% |
| Jungle | Exposure | Mob density | 40.0 | 24.0 | +66.7% |
| Plains | Threat | Worst spike %HP | 4.88% | 12.4% | -60.7% |
| Forest | Threat | Max incoming DPS | 14.1 | 34.1 | -58.7% |
| Forest | Threat | Mean incoming DPS | 11.7 | 25.1 | -53.5% |
| Forest | Exposure | Mob density | 36.0 | 24.0 | +50.0% |
| Mountain | Reward | Biome XP / kill | 74.3 | 51.0 | +45.8% |
| Caverns | Threat | Mean incoming DPS | 36.5 | 25.1 | +45.2% |
| Mountain | Reward | Essence / kill | 13.0 | 9.00 | +44.4% |
| Forest | Threat | Worst spike %HP | 7.09% | 12.4% | -42.9% |
| Desert | Threat | Max incoming DPS | 46.8 | 34.1 | +37.2% |
| Swamp | Reward | Biome XP / kill | 68.3 | 51.0 | +34.0% |
| Caverns | Threat | Max incoming DPS | 45.5 | 34.1 | +33.5% |
| Caverns | Exposure | Mob density | 16.0 | 24.0 | -33.3% |
| Desert | Exposure | Mob density | 16.0 | 24.0 | -33.3% |
| Swamp | Reward | Essence / kill | 12.0 | 9.00 | +33.3% |
| Plains | Reward | Biome XP / kill | 37.7 | 51.0 | -26.1% |
| Plains | Reward | Essence / kill | 6.67 | 9.00 | -25.9% |

## Player Matchup Summary

_Mean resolved per-mob pressure vs the four reference players, with worst-spike %HP from the biome's hardest-spiking individual mob. Incoming DPS folds plating/DR/evasion; TTL = maxHP ÷ incoming (no player recovery — see eHP packet). Status: Safe/Risky/Blocked (mob risk<30s, block<10s, ≥50% spike = Risky, one-shot = Blocked)._

| Biome | Player | Incoming DPS | Worst spike %HP | TTL pressure | Status |
| --- | --- | --- | --- | --- | --- |
| Caverns | Entry (prev-tier +3) | 36.5 | 119% (Cave Troll) | 6.19s | Blocked |
| Caverns | Same-tier +0 | 34.5 | 100% (Cave Troll) | 7.43s | Blocked |
| Caverns | Same-tier +3 | 29.7 | 72.4% (Cave Troll) | 10.7s | Risky |
| Caverns | Boss-ready (tankiest +3) | 32.7 | 79.8% (Cave Troll) | 9.55s | Blocked |
| Desert | Entry (prev-tier +3) | 45.6 | 51.4% (Stone Basilisk) | 4.95s | Blocked |
| Desert | Same-tier +0 | 44.1 | 43.4% (Stone Basilisk) | 5.81s | Blocked |
| Desert | Same-tier +3 | 39.7 | 31.4% (Stone Basilisk) | 8.03s | Blocked |
| Desert | Boss-ready (tankiest +3) | 43.4 | 34.5% (Stone Basilisk) | 7.20s | Blocked |
| Forest | Entry (prev-tier +3) | 11.7 | 7.09% (Dire Wolf) | 19.3s | Risky |
| Forest | Same-tier +0 | 8.46 | 4.69% (Dire Wolf) | 30.3s | Safe |
| Forest | Same-tier +3 | 0.84 | 0.31% (Dire Wolf) | 380s | Safe |
| Forest | Boss-ready (tankiest +3) | 3.46 | 1.92% (Dire Wolf) | 90.4s | Safe |
| Jungle | Entry (prev-tier +3) | 20.6 | 9.64% (Jungle Ape) | 11.0s | Risky |
| Jungle | Same-tier +0 | 18.9 | 6.23% (Jungle Ape) | 13.5s | Risky |
| Jungle | Same-tier +3 | 17.0 | 0.69% (Jungle Snake) | 18.7s | Risky |
| Jungle | Boss-ready (tankiest +3) | 17.8 | 2.32% (Jungle Ape) | 17.6s | Risky |
| Mountain | Entry (prev-tier +3) | 30.1 | 67.2% (Granite Titan) | 7.49s | Blocked |
| Mountain | Same-tier +0 | 28.7 | 56.2% (Granite Titan) | 8.94s | Blocked |
| Mountain | Same-tier +3 | 24.9 | 40.0% (Granite Titan) | 12.8s | Risky |
| Mountain | Boss-ready (tankiest +3) | 27.6 | 44.1% (Granite Titan) | 11.3s | Risky |
| Plains | Entry (prev-tier +3) | 3.35 | 4.88% (Savanna Hawk) | 67.4s | Safe |
| Plains | Same-tier +0 | 1.61 | 2.73% (Savanna Hawk) | 159s | Safe |
| Plains | Same-tier +3 | 0.60 | 0.31% (Stampede Bull) | 532s | Safe |
| Plains | Boss-ready (tankiest +3) | 0.61 | 0.32% (Stampede Bull) | 514s | Safe |
| Swamp | Entry (prev-tier +3) | 25.1 | 12.4% (Mire Stalker) | 8.98s | Blocked |
| Swamp | Same-tier +0 | 23.1 | 8.98% (Mire Stalker) | 11.1s | Risky |
| Swamp | Same-tier +3 | 20.0 | 4.08% (Mire Stalker) | 15.9s | Risky |
| Swamp | Boss-ready (tankiest +3) | 21.5 | 5.76% (Mire Stalker) | 14.5s | Risky |

## Biome Threat Summary

_Per-biome aggregates for biome tier 2. "Hardest hitter" uses raw direct DPS; "tankiest" weights plating ×8 against HP._

| Biome | Mobs | Avg HP | Avg DPS | Avg atk | Avg APS | Avg DoT/s | Hardest | Fastest | Tankiest | DoT-heavy | Biggest spike | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | 3 | 320 | 35.4 | 79.7 | 0.38 | 11.0 | Cave Troll | Giant Spider | Cave Troll | Giant Spider | Cave Troll ×2.40 | density 16; 1/3 carry DoT |
| Desert | 2 | 660 | 56.3 | 135 | 0.39 | 0.00 | Stone Basilisk | Sand Scorpion | Sand Scorpion | - | Stone Basilisk ×1.00 | density 16; 0/2 carry DoT |
| Forest | 3 | 247 | 27.5 | 32.0 | 0.81 | 0.00 | Ironclaw Badger | Ironclaw Badger | Dire Wolf | - | Dire Wolf ×1.00 | density 36; 0/3 carry DoT |
| Jungle | 3 | 425 | 16.0 | 24.3 | 0.67 | 16.3 | Jungle Ape | Jungle Snake | Jungle Ape | Vine Chameleon | Jungle Ape ×1.45 | density 40; 2/3 carry DoT |
| Mountain | 3 | 286 | 38.7 | 105 | 0.30 | 0.00 | Granite Titan | Stone Eagle | Granite Titan | - | Granite Titan ×1.50 | density 24; 0/3 carry DoT |
| Plains | 3 | 193 | 14.0 | 24.0 | 0.61 | 0.00 | Prairie Wolf | Prairie Wolf | Stampede Bull | - | Savanna Hawk ×1.00 | density 48; 0/3 carry DoT |
| Swamp | 3 | 177 | 16.2 | 37.0 | 0.43 | 17.0 | Bog Witch | Moss-Shell Snapper | Mire Stalker | Moss-Shell Snapper | Mire Stalker ×1.00 | density 20; 2/3 carry DoT |

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
