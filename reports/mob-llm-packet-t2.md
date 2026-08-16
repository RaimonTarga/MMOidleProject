# MMO Idle Monster Balance Packet - Biome Tier 2

Generated from `tools/mob-report.ts --llm-packet`. Markdown only. Companion to the DPS and eHP packets.

## Assumptions / Omissions

- Monster-centric: subject is the world's offence and durability, bucketed by biome tier 2.
- Reference players are tier 3 (a player of tier P fights biome tier P-1). Defensive stats are averaged over spec-agnostic class builds × armor × recovery; the boss-ready profile biases to the tankiest armor.
- Reference player DPS uses shared `estimatePlayerDps` across concrete class builds, including full Conduit formations. T3 specialization, abilities, target-state mechanics, and shields/soft-caps remain outside this planning TTK; cross-check the detailed DPS packet for spec-level clear speed.
- TTL pressure = player maxHP ÷ incoming DPS with **no player recovery** (that lives in the eHP packet). Incoming DPS folds plating/DR/averaged evasion; player DoT-resistance is not applied here.
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 21 mobs; tier avg HP 295, avg total DPS 21.0.

## Reference Players

| Player | Gear | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Entry (prev-tier +3) | T2 +3 | 229 | 24.8 | 9.67% | 16.5% | 88.6 | 1.22 |
| Same-tier +0 | T3 +0 | 240 | 25.1 | 10.7% | 12.1% | 103 | 0.98 |
| Same-tier +3 | T3 +3 | 295 | 37.1 | 11.5% | 13.7% | 150 | 0.98 |
| Boss-ready (tankiest +3) | T3 +3 | 325 | 35.4 | 6.39% | 6.78% | 150 | 0.98 |


## Cross-Biome Threat & Reward

_Every biome at tier 2, ranked by mean incoming DPS against Entry (prev-tier +3). Threat is post-mitigation; spike is the worst individual hit. Rewards are authored per-kill means, not hourly yield. The threat index is relative to this tier's sibling median, not a target._

| Biome | Threat index | Mean HP | Max HP | Mean incoming DPS | Max incoming DPS | Worst spike %HP | Density | Essence / kill | Biome XP / kill |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Swamp | ×2.01 | 307 | 370 | 18.1 | 25.4 | 0.44% (Moss-Shell Snapper) | 10 | 12.0 | 68.3 |
| Jungle | ×1.63 | 213 | 250 | 14.6 | 24.5 | 5.23% (Jungle Ape) | 20 | 7.33 | 40.0 |
| Caverns | ×1.12 | 577 | 740 | 10.1 | 18.5 | 15.7% (Cave Troll) | 8 | 18.7 | 110 |
| Mountain | ×1.00 | 340 | 400 | 9.01 | 10.4 | 17.9% (Granite Titan) | 12 | 13.0 | 74.3 |
| Plains | ×0.57 | 163 | 200 | 5.17 | 7.90 | 6.10% (Stampede Bull) | 24 | 6.67 | 37.7 |
| Desert | ×0.49 | 263 | 420 | 4.43 | 9.60 | 8.28% (Sun Scarab) | 8 | 7.67 | 42.7 |
| Forest | ×0.15 | 205 | 225 | 1.36 | 2.62 | 1.31% (Dire Wolf) | 18 | 9.00 | 51.0 |

## Cross-Biome Deviation Signals

_Discovery-only signals for values at least 25% from the tier-sibling median. Deliberate outliers are expected; this is neither a pass/fail gate nor a recommended balance band._

| Biome | Axis | Metric | Value | Sibling median | Deviation |
| --- | --- | --- | --- | --- | --- |
| Mountain | Threat | Worst spike %HP | 17.9% | 6.10% | +193% |
| Caverns | Threat | Worst spike %HP | 15.7% | 6.10% | +157% |
| Swamp | Threat | Max incoming DPS | 25.4 | 10.4 | +146% |
| Jungle | Threat | Max incoming DPS | 24.5 | 10.4 | +137% |
| Caverns | Reward | Biome XP / kill | 110 | 51.0 | +116% |
| Caverns | Reward | Essence / kill | 18.7 | 9.00 | +107% |
| Swamp | Threat | Mean incoming DPS | 18.1 | 9.01 | +101% |
| Plains | Exposure | Mob density | 24.0 | 12.0 | +100% |
| Swamp | Threat | Worst spike %HP | 0.44% | 6.10% | -92.9% |
| Forest | Threat | Mean incoming DPS | 1.36 | 9.01 | -84.9% |
| Caverns | Threat | Max incoming DPS | 18.5 | 10.4 | +79.0% |
| Forest | Threat | Worst spike %HP | 1.31% | 6.10% | -78.6% |
| Forest | Threat | Max incoming DPS | 2.62 | 10.4 | -74.7% |
| Jungle | Exposure | Mob density | 20.0 | 12.0 | +66.7% |
| Jungle | Threat | Mean incoming DPS | 14.6 | 9.01 | +62.7% |
| Desert | Threat | Mean incoming DPS | 4.43 | 9.01 | -50.8% |
| Forest | Exposure | Mob density | 18.0 | 12.0 | +50.0% |
| Mountain | Reward | Biome XP / kill | 74.3 | 51.0 | +45.8% |
| Mountain | Reward | Essence / kill | 13.0 | 9.00 | +44.4% |
| Plains | Threat | Mean incoming DPS | 5.17 | 9.01 | -42.6% |
| Desert | Threat | Worst spike %HP | 8.28% | 6.10% | +35.7% |
| Swamp | Reward | Biome XP / kill | 68.3 | 51.0 | +34.0% |
| Caverns | Exposure | Mob density | 8.00 | 12.0 | -33.3% |
| Desert | Exposure | Mob density | 8.00 | 12.0 | -33.3% |
| Swamp | Reward | Essence / kill | 12.0 | 9.00 | +33.3% |
| Plains | Reward | Biome XP / kill | 37.7 | 51.0 | -26.1% |
| Plains | Reward | Essence / kill | 6.67 | 9.00 | -25.9% |

## Player Matchup Summary

_Mean resolved per-mob pressure vs the four reference players, with worst-spike %HP from the biome's hardest-spiking individual mob. Incoming DPS folds plating/DR/evasion; TTL = maxHP ÷ incoming (no player recovery — see eHP packet). Status: Safe/Risky/Blocked (mob risk<30s, block<10s, ≥50% spike = Risky, one-shot = Blocked)._

| Biome | Player | Incoming DPS | Worst spike %HP | TTL pressure | Status |
| --- | --- | --- | --- | --- | --- |
| Caverns | Entry (prev-tier +3) | 10.1 | 15.7% (Cave Troll) | 22.8s | Risky |
| Caverns | Same-tier +0 | 10.1 | 15.0% (Cave Troll) | 23.9s | Risky |
| Caverns | Same-tier +3 | 8.54 | 8.48% (Cave Troll) | 34.5s | Safe |
| Caverns | Boss-ready (tankiest +3) | 8.86 | 8.60% (Cave Troll) | 36.7s | Safe |
| Desert | Entry (prev-tier +3) | 4.43 | 8.28% (Sun Scarab) | 51.7s | Safe |
| Desert | Same-tier +0 | 4.35 | 7.91% (Sun Scarab) | 55.2s | Safe |
| Desert | Same-tier +3 | 1.65 | 2.71% (Sun Scarab) | 179s | Safe |
| Desert | Boss-ready (tankiest +3) | 2.02 | 3.07% (Sun Scarab) | 161s | Safe |
| Forest | Entry (prev-tier +3) | 1.36 | 1.31% (Dire Wolf) | 169s | Safe |
| Forest | Same-tier +0 | 1.39 | 1.25% (Dire Wolf) | 173s | Safe |
| Forest | Same-tier +3 | 0.79 | 0.34% (Dire Wolf) | 372s | Safe |
| Forest | Boss-ready (tankiest +3) | 0.81 | 0.31% (Dire Wolf) | 404s | Safe |
| Jungle | Entry (prev-tier +3) | 14.6 | 5.23% (Jungle Ape) | 15.7s | Risky |
| Jungle | Same-tier +0 | 14.7 | 4.58% (Jungle Ape) | 16.4s | Risky |
| Jungle | Same-tier +3 | 14.7 | 0.34% (Jungle Snake) | 20.1s | Risky |
| Jungle | Boss-ready (tankiest +3) | 14.7 | 0.61% (Jungle Ape) | 22.2s | Risky |
| Mountain | Entry (prev-tier +3) | 9.01 | 17.9% (Granite Titan) | 25.5s | Risky |
| Mountain | Same-tier +0 | 8.88 | 16.6% (Granite Titan) | 27.1s | Risky |
| Mountain | Same-tier +3 | 5.61 | 9.84% (Granite Titan) | 52.5s | Safe |
| Mountain | Boss-ready (tankiest +3) | 6.61 | 9.83% (Granite Titan) | 49.2s | Safe |
| Plains | Entry (prev-tier +3) | 5.17 | 6.10% (Stampede Bull) | 44.4s | Safe |
| Plains | Same-tier +0 | 4.66 | 5.41% (Stampede Bull) | 51.5s | Safe |
| Plains | Same-tier +3 | 0.98 | 1.02% (Stampede Bull) | 301s | Safe |
| Plains | Boss-ready (tankiest +3) | 1.19 | 1.23% (Stampede Bull) | 273s | Safe |
| Swamp | Entry (prev-tier +3) | 18.1 | 0.44% (Moss-Shell Snapper) | 12.7s | Risky |
| Swamp | Same-tier +0 | 18.1 | 0.42% (Moss-Shell Snapper) | 13.3s | Risky |
| Swamp | Same-tier +3 | 18.1 | 0.34% (Moss-Shell Snapper) | 16.3s | Risky |
| Swamp | Boss-ready (tankiest +3) | 18.1 | 0.31% (Moss-Shell Snapper) | 18.0s | Risky |

## Biome Threat Summary

_Per-biome aggregates for biome tier 2. "Hardest hitter" uses raw direct DPS; "tankiest" weights plating ×8 against HP._

| Biome | Mobs | Avg HP | Avg DPS | Avg atk | Avg APS | Avg DoT/s | Hardest | Fastest | Tankiest | DoT-heavy | Biggest spike | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | 3 | 577 | 13.4 | 39.7 | 0.38 | 6.00 | Cave Troll | Giant Spider | Cave Troll | Giant Spider | Cave Troll ×1.00 | density 8; 1/3 carry DoT |
| Desert | 3 | 263 | 15.8 | 32.7 | 0.46 | 0.00 | Sun Scarab | Sun Scarab | Stone Basilisk | - | Sun Scarab ×1.00 | density 8; 0/3 carry DoT |
| Forest | 3 | 205 | 21.7 | 26.7 | 0.81 | 0.00 | Ironclaw Badger | Ironclaw Badger | Dire Wolf | - | Dire Wolf ×1.00 | density 18; 0/3 carry DoT |
| Jungle | 3 | 213 | 12.8 | 19.3 | 0.67 | 14.0 | Jungle Ape | Jungle Snake | Jungle Ape | Vine Chameleon | Jungle Ape ×1.45 | density 20; 2/3 carry DoT |
| Mountain | 3 | 340 | 17.8 | 60.0 | 0.30 | 0.00 | Granite Titan | Stone Eagle | Granite Titan | - | Granite Titan ×1.00 | density 12; 0/3 carry DoT |
| Plains | 3 | 163 | 20.9 | 34.0 | 0.61 | 0.00 | Prairie Wolf | Prairie Wolf | Stampede Bull | - | Stampede Bull ×1.00 | density 24; 0/3 carry DoT |
| Swamp | 3 | 307 | 7.06 | 16.7 | 0.43 | 17.7 | Mire Stalker | Moss-Shell Snapper | Moss-Shell Snapper | Moss-Shell Snapper | Mire Stalker ×1.00 | density 10; 3/3 carry DoT |

## Boss / Elite Table

_Bosses for biome tier 2 vs the boss-ready reference player (T3 +3). TTK uses the shared class-aware planning estimator; T3 specs, abilities, and shields/soft-caps remain unmodeled. TTL is player survival with no recovery modeled._

| Boss | Biome | HP | Attack profile | Raw DPS | Spike | Defenses | Expected TTK | Player TTL | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chitinous Dreadbore | Caverns | 3500 | 65.0 @ 0.28 aps | 18.1 | ×1.60 | plate 12.0, DR 12.0% | 23.4s | 42.2s | Safe | - |
| Dune-Stalker Emperor | Desert | 3000 | 40.0 @ 0.38 aps | 15.4 | ×1.20 | plate 12.0, DR 8.00% | 19.3s | 213s | Safe | - |
| Apex Timberclaw | Forest | 3000 | 30.0 @ 0.67 aps | 20.0 | ×1.15 | plate 0.00, DR 0.00% | 16.2s | 492s | Safe | - |
| Jungle Dread-Gorger | Jungle | 2900 | 40.0 @ 0.42 aps | 16.7 | ×1.10 | plate 0.00, DR 3.00% | 16.0s | 197s | Safe | - |
| Stoneplate Juggernaut | Mountain | 4000 | 60.0 @ 0.24 aps | 14.3 | ×1.60 | plate 10.0, DR 5.00% | 24.6s | 59.9s | Safe | - |
| Gorging Razortusk | Plains | 3200 | 45.0 @ 0.45 aps | 20.5 | ×1.30 | plate 8.00, DR 5.00% | 19.3s | 80.2s | Safe | - |
| Mire-Gorged Behemoth | Swamp | 2700 | 18.0 @ 0.36 aps | 22.4 | ×1.60 | plate 6.00, DR 8.00% | 16.5s | 19.9s | Risky | - |

## Mob / Boss Diagnostic Signals

_Attention signals only: mobs >±25% of biome-tier average on HP / raw DPS / spike, bosses outside the TTK/TTL observation bands, and narrow biome threat profiles. These are not verdicts or balance gates._

| Flag | Subject | Detail |
| --- | --- | --- |
| HP > +25% tier avg | Giant Spider | 460 vs avg 295 (×1.56) |
| Spike < -25% tier avg | Giant Spider | 22.0 vs avg 33.3 (×0.66) |
| HP > +25% tier avg | Cave Troll | 740 vs avg 295 (×2.50) |
| Spike > +25% tier avg | Cave Troll | 65.0 vs avg 33.3 (×1.95) |
| HP > +25% tier avg | Cave Gargoyle | 530 vs avg 295 (×1.79) |
| Raw DPS < -25% tier avg | Cave Gargoyle | 10.0 vs avg 15.6 (×0.64) |
| HP < -25% tier avg | Sand Scorpion | 220 vs avg 295 (×0.74) |
| HP > +25% tier avg | Stone Basilisk | 420 vs avg 295 (×1.42) |
| Raw DPS < -25% tier avg | Stone Basilisk | 7.14 vs avg 15.6 (×0.46) |
| Spike < -25% tier avg | Stone Basilisk | 20.0 vs avg 33.3 (×0.60) |
| HP < -25% tier avg | Sun Scarab | 150 vs avg 295 (×0.51) |
| Raw DPS > +25% tier avg | Sun Scarab | 24.2 vs avg 15.6 (×1.55) |
| Spike > +25% tier avg | Sun Scarab | 46.0 vs avg 33.3 (×1.38) |
| Raw DPS > +25% tier avg | Dire Wolf | 25.5 vs avg 15.6 (×1.63) |
| HP < -25% tier avg | Ironclaw Badger | 200 vs avg 295 (×0.68) |
| Raw DPS > +25% tier avg | Ironclaw Badger | 28.9 vs avg 15.6 (×1.85) |
| HP < -25% tier avg | Thorn Spitter | 190 vs avg 295 (×0.64) |
| Raw DPS < -25% tier avg | Thorn Spitter | 10.8 vs avg 15.6 (×0.69) |
| HP < -25% tier avg | Jungle Snake | 200 vs avg 295 (×0.68) |
| Spike < -25% tier avg | Jungle Snake | 16.0 vs avg 33.3 (×0.48) |
| HP < -25% tier avg | Vine Chameleon | 190 vs avg 295 (×0.64) |
| Raw DPS < -25% tier avg | Vine Chameleon | 8.42 vs avg 15.6 (×0.54) |
| Spike < -25% tier avg | Vine Chameleon | 16.0 vs avg 33.3 (×0.48) |
| HP > +25% tier avg | Granite Titan | 400 vs avg 295 (×1.35) |
| Spike > +25% tier avg | Granite Titan | 70.0 vs avg 33.3 (×2.10) |
| Spike > +25% tier avg | Stone Eagle | 50.0 vs avg 33.3 (×1.50) |
| Spike > +25% tier avg | Boulder Thrower | 60.0 vs avg 33.3 (×1.80) |
| HP < -25% tier avg | Stampede Bull | 200 vs avg 295 (×0.68) |
| Raw DPS > +25% tier avg | Stampede Bull | 23.5 vs avg 15.6 (×1.50) |
| HP < -25% tier avg | Prairie Wolf | 150 vs avg 295 (×0.51) |
| Raw DPS > +25% tier avg | Prairie Wolf | 26.7 vs avg 15.6 (×1.71) |
| HP < -25% tier avg | Savanna Hawk | 140 vs avg 295 (×0.47) |
| HP > +25% tier avg | Moss-Shell Snapper | 370 vs avg 295 (×1.25) |
| Raw DPS < -25% tier avg | Moss-Shell Snapper | 5.45 vs avg 15.6 (×0.35) |
| Spike < -25% tier avg | Moss-Shell Snapper | 12.0 vs avg 33.3 (×0.36) |
| Raw DPS < -25% tier avg | Bog Witch | 7.27 vs avg 15.6 (×0.47) |
| Spike < -25% tier avg | Bog Witch | 16.0 vs avg 33.3 (×0.48) |
| Raw DPS < -25% tier avg | Mire Stalker | 8.46 vs avg 15.6 (×0.54) |
| Spike < -25% tier avg | Mire Stalker | 22.0 vs avg 33.3 (×0.66) |
| biome single-type | Desert | 100% Direct damage |
| biome single-type | Forest | 100% Direct damage |
| biome single-type | Mountain | 100% Direct damage |
| biome single-type | Plains | 100% Direct damage |

## Mob Stat Summary

_Every non-boss spawn in biome tier 2, sorted by raw total DPS within each biome. Raw DPS is pre-mitigation (attack × APS); DoT/s assumes full refreshed stacks._

| Biome | Mob | Role | HP | Attack | APS / CD | Raw DPS | DoT/s | Plating | DR | Range | Speed | Spike | Specials |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | Giant Spider | DoT | 460 | 22.0 | 0.56 / 1800ms | 12.2 | 18.0 | 0.00 | 8.00% | 12.0 | 72.0 | ×1.00 | dot 18.0/s×3, evasion 20.0% |
| Caverns | Cave Troll | Bruiser | 740 | 65.0 | 0.28 / 3600ms | 18.1 | 0.00 | 4.00 | 15.0% | 15.0 | 15.0 | ×1.00 | - |
| Caverns | Cave Gargoyle | Bruiser | 530 | 32.0 | 0.31 / 3200ms | 10.0 | 0.00 | 3.00 | 10.0% | 200 | 22.0 | ×1.00 | - |
| Desert | Sun Scarab | Bruiser | 150 | 46.0 | 0.53 / 1900ms | 24.2 | 0.00 | 0.00 | 0.00% | 190 | 52.0 | ×1.00 | slow ×0.60 |
| Desert | Sand Scorpion | Bruiser | 220 | 32.0 | 0.50 / 2000ms | 16.0 | 0.00 | 0.00 | 8.00% | 12.0 | 52.0 | ×1.00 | slow ×0.50 |
| Desert | Stone Basilisk | Bruiser | 420 | 20.0 | 0.36 / 2800ms | 7.14 | 0.00 | 0.00 | 15.0% | 12.0 | 26.0 | ×1.00 | root |
| Forest | Ironclaw Badger | Bruiser | 200 | 26.0 | 1.11 / 900ms | 28.9 | 0.00 | 0.00 | 0.00% | 15.0 | 22.0 | ×1.00 | - |
| Forest | Dire Wolf | Bruiser | 225 | 28.0 | 0.91 / 1100ms | 25.5 | 0.00 | 0.00 | 0.00% | 12.0 | 96.0 | ×1.00 | charge ×3.00 |
| Forest | Thorn Spitter | Bruiser | 190 | 26.0 | 0.42 / 2400ms | 10.8 | 0.00 | 0.00 | 0.00% | 190 | 48.0 | ×1.00 | - |
| Jungle | Jungle Snake | DoT | 200 | 16.0 | 0.91 / 1100ms | 14.5 | 18.0 | 0.00 | 0.00% | 12.0 | 76.0 | ×1.00 | dot 18.0/s×3 |
| Jungle | Vine Chameleon | DoT | 190 | 16.0 | 0.53 / 1900ms | 8.42 | 24.0 | 0.00 | 0.00% | 190 | 48.0 | ×1.00 | dot 24.0/s×4 |
| Jungle | Jungle Ape | Bruiser | 250 | 26.0 | 0.59 / 1700ms | 15.3 | 0.00 | 0.00 | 0.00% | 12.0 | 62.0 | ×1.45 | ramp +45.0% atk, charge ×2.80 |
| Mountain | Granite Titan | Bruiser | 400 | 70.0 | 0.26 / 3800ms | 18.4 | 0.00 | 0.00 | 0.00% | 15.0 | 18.0 | ×1.00 | charge ×2.50 |
| Mountain | Stone Eagle | Bruiser | 290 | 50.0 | 0.36 / 2800ms | 17.9 | 0.00 | 0.00 | 0.00% | 12.0 | 40.0 | ×1.00 | charge ×2.50 |
| Mountain | Boulder Thrower | Bruiser | 330 | 60.0 | 0.29 / 3500ms | 17.1 | 0.00 | 0.00 | 0.00% | 240 | 28.0 | ×1.00 | - |
| Plains | Prairie Wolf | Bruiser | 150 | 32.0 | 0.83 / 1200ms | 26.7 | 0.00 | 0.00 | 0.00% | 12.0 | 92.0 | ×1.00 | - |
| Plains | Stampede Bull | Bruiser | 200 | 40.0 | 0.59 / 1700ms | 23.5 | 0.00 | 0.00 | 5.00% | 12.0 | 62.0 | ×1.00 | charge ×2.50 |
| Plains | Savanna Hawk | Bruiser | 140 | 30.0 | 0.42 / 2400ms | 12.5 | 0.00 | 0.00 | 0.00% | 165 | 50.0 | ×1.00 | - |
| Swamp | Moss-Shell Snapper | DoT | 370 | 12.0 | 0.45 / 2200ms | 5.45 | 25.0 | 0.00 | 10.0% | 15.0 | 28.0 | ×1.00 | dot 25.0/s×5 |
| Swamp | Bog Witch | DoT | 230 | 16.0 | 0.45 / 2200ms | 7.27 | 16.0 | 0.00 | 5.00% | 180 | 38.0 | ×1.00 | dot 16.0/s×4 |
| Swamp | Mire Stalker | DoT | 320 | 22.0 | 0.38 / 2600ms | 8.46 | 12.0 | 0.00 | 12.0% | 12.0 | 40.0 | ×1.00 | dot 12.0/s×4, evasion 20.0% |
