# MMO Idle Monster Balance Packet - Biome Tier 2

Generated from `tools/mob-report.ts --llm-packet`. Markdown only. Companion to the DPS and eHP packets.

## Assumptions / Omissions

- Monster-centric: subject is the world's offence and durability, bucketed by biome tier 2.
- Reference players are tier 3 (a player of tier P fights biome tier P-1). Defensive stats are averaged over spec-agnostic class builds × armor × recovery; the boss-ready profile biases to the tankiest armor.
- Reference player DPS is **direct-hit only** (class empowered/cadence/DoT mechanics omitted) → boss TTK is an UPPER bound. Shields/soft-caps extend TTK further. Cross-check the DPS packet for real clear speed.
- TTL pressure = player maxHP ÷ incoming DPS with **no player recovery** (that lives in the eHP packet). Incoming DPS folds plating/DR/averaged evasion; player DoT-resistance is not applied here.
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. 21 mobs; tier avg HP 293, avg total DPS 21.0.

## Reference Players

| Player | Gear | maxHP | Plating | DR | Dodge | Ref atk | Ref APS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Entry (prev-tier +3) | T2 +3 | 229 | 24.8 | 9.84% | 16.5% | 96.2 | 1.17 |
| Same-tier +0 | T3 +0 | 240 | 25.1 | 10.8% | 12.1% | 99.9 | 1.06 |
| Same-tier +3 | T3 +3 | 294 | 37.1 | 11.7% | 13.7% | 145 | 1.06 |
| Boss-ready (tankiest +3) | T3 +3 | 325 | 35.4 | 6.56% | 6.78% | 145 | 1.06 |


## Player Matchup Summary

_Each biome's average mob (sustained pressure) vs the four reference players, with worst-spike %HP from the biome's hardest-spiking individual mob. Incoming DPS folds plating/DR/evasion; TTL = maxHP ÷ incoming (no player recovery — see eHP packet). Status: Safe/Risky/Blocked (mob risk<30s, block<10s, ≥50% spike = Risky, one-shot = Blocked)._

| Biome | Player | Incoming DPS | Worst spike %HP | TTL pressure | Status |
| --- | --- | --- | --- | --- | --- |
| Caverns | Entry (prev-tier +3) | 6.35 | 15.7% (Cave Troll) | 36.0s | Safe |
| Caverns | Same-tier +0 | 6.43 | 15.0% (Cave Troll) | 37.3s | Safe |
| Caverns | Same-tier +3 | 2.68 | 8.50% (Cave Troll) | 110s | Safe |
| Caverns | Boss-ready (tankiest +3) | 3.38 | 8.62% (Cave Troll) | 96.1s | Safe |
| Desert | Entry (prev-tier +3) | 3.44 | 4.37% (Stone Basilisk) | 66.6s | Safe |
| Desert | Same-tier +0 | 3.50 | 4.17% (Stone Basilisk) | 68.5s | Safe |
| Desert | Same-tier +3 | 0.44 | 0.34% (Sand Scorpion) | 674s | Safe |
| Desert | Boss-ready (tankiest +3) | 0.44 | 0.31% (Sand Scorpion) | 732s | Safe |
| Forest | Entry (prev-tier +3) | 1.31 | 1.31% (Ancient Wolf) | 175s | Safe |
| Forest | Same-tier +0 | 0.67 | 1.25% (Ancient Wolf) | 360s | Safe |
| Forest | Same-tier +3 | 0.66 | 0.34% (Ancient Wolf) | 443s | Safe |
| Forest | Boss-ready (tankiest +3) | 0.68 | 0.31% (Ancient Wolf) | 481s | Safe |
| Jungle | Entry (prev-tier +3) | 8.61 | 0.44% (Jungle Snake) | 26.6s | Risky |
| Jungle | Same-tier +0 | 8.62 | 0.42% (Jungle Snake) | 27.8s | Risky |
| Jungle | Same-tier +3 | 8.62 | 0.34% (Jungle Snake) | 34.1s | Safe |
| Jungle | Boss-ready (tankiest +3) | 8.63 | 0.31% (Jungle Snake) | 37.6s | Safe |
| Mountain | Entry (prev-tier +3) | 9.12 | 17.9% (Granite Titan) | 25.1s | Risky |
| Mountain | Same-tier +0 | 9.00 | 16.7% (Granite Titan) | 26.6s | Risky |
| Mountain | Same-tier +3 | 5.79 | 9.85% (Granite Titan) | 50.8s | Safe |
| Mountain | Boss-ready (tankiest +3) | 6.77 | 9.85% (Granite Titan) | 48.0s | Safe |
| Plains | Entry (prev-tier +3) | 4.35 | 6.11% (Stampede Bull) | 52.7s | Safe |
| Plains | Same-tier +0 | 4.43 | 5.42% (Stampede Bull) | 54.2s | Safe |
| Plains | Same-tier +3 | 0.55 | 1.02% (Stampede Bull) | 533s | Safe |
| Plains | Boss-ready (tankiest +3) | 0.56 | 1.23% (Stampede Bull) | 579s | Safe |
| Swamp | Entry (prev-tier +3) | 16.4 | 0.44% (Swamp Hydra) | 14.0s | Risky |
| Swamp | Same-tier +0 | 16.4 | 0.42% (Swamp Hydra) | 14.6s | Risky |
| Swamp | Same-tier +3 | 16.4 | 0.34% (Swamp Hydra) | 17.9s | Risky |
| Swamp | Boss-ready (tankiest +3) | 16.4 | 0.31% (Swamp Hydra) | 19.8s | Risky |

## Biome Threat Summary

_Per-biome aggregates for biome tier 2. "Hardest hitter" uses raw direct DPS; "tankiest" weights plating ×8 against HP._

| Biome | Mobs | Avg HP | Avg DPS | Avg atk | Avg APS | Avg DoT/s | Hardest | Fastest | Tankiest | DoT-heavy | Biggest spike | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | 3 | 577 | 13.4 | 39.7 | 0.38 | 6.00 | Cave Troll | Giant Spider | Cave Troll | Giant Spider | Cave Troll ×1.00 | density 8; 1/3 carry DoT |
| Desert | 3 | 247 | 15.3 | 34.0 | 0.45 | 0.00 | Dust Djinn | Sand Scorpion | Stone Basilisk | - | Stone Basilisk ×1.00 | density 8; 0/3 carry DoT |
| Forest | 3 | 205 | 21.7 | 26.7 | 0.81 | 0.00 | Ironwood Golem | Ironwood Golem | Ancient Wolf | - | Ancient Wolf ×1.00 | density 13; 0/3 carry DoT |
| Jungle | 3 | 213 | 12.8 | 19.3 | 0.67 | 14.0 | Jungle Ape | Jungle Snake | Jungle Ape | Jungle Blowdarter | Jungle Ape ×1.00 | density 15; 2/3 carry DoT |
| Mountain | 3 | 340 | 17.8 | 60.0 | 0.30 | 0.00 | Granite Titan | Stone Eagle | Granite Titan | - | Granite Titan ×1.00 | density 10; 0/3 carry DoT |
| Plains | 3 | 163 | 20.9 | 34.0 | 0.61 | 0.00 | Prairie Wolf | Prairie Wolf | Stampede Bull | - | Stampede Bull ×1.00 | density 16; 0/3 carry DoT |
| Swamp | 3 | 307 | 7.06 | 16.7 | 0.43 | 17.7 | Mire Stalker | Swamp Hydra | Swamp Hydra | Swamp Hydra | Mire Stalker ×1.00 | density 10; 3/3 carry DoT |

## Boss / Elite Table

_Bosses for biome tier 2 vs the boss-ready reference player (T3 +3). TTK is an UPPER bound from direct-hit DPS only (class empowered/DoT mechanics omitted; shields/soft-caps extend it). TTL is player survival with no recovery modeled._

| Boss | Biome | HP | Attack profile | Raw DPS | Spike | Defenses | Expected TTK | Player TTL | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chitinous Dreadbore | Caverns | 3500 | 65.0 @ 0.28 aps | 18.1 | ×1.60 | plate 12.0, DR 12.0% | 27.5s | 42.1s | Safe | - |
| Dune-Stalker Emperor | Desert | 3000 | 40.0 @ 0.38 aps | 15.4 | ×1.20 | plate 12.0, DR 8.00% | 22.6s | 213s | Safe | - |
| Apex Timberclaw | Forest | 3000 | 30.0 @ 0.67 aps | 20.0 | ×1.15 | plate 0.00, DR 0.00% | 19.1s | 492s | Safe | - |
| Jungle Dread-Gorger | Jungle | 2900 | 40.0 @ 0.42 aps | 16.7 | ×1.10 | plate 0.00, DR 3.00% | 19.1s | 197s | Safe | - |
| Stoneplate Juggernaut | Mountain | 4000 | 60.0 @ 0.24 aps | 14.3 | ×1.60 | plate 10.0, DR 5.00% | 28.8s | 59.9s | Safe | - |
| Gorging Razortusk | Plains | 3200 | 45.0 @ 0.45 aps | 20.5 | ×1.30 | plate 8.00, DR 5.00% | 22.7s | 80.1s | Safe | - |
| Mire-Gorged Behemoth | Swamp | 2700 | 18.0 @ 0.36 aps | 22.4 | ×1.60 | plate 6.00, DR 8.00% | 19.6s | 19.9s | Risky | - |

## Outlier Summary

_Mobs >±25% of biome-tier average on HP / raw DPS / spike; bosses outside the TTK/TTL sanity bands; biomes with weak or single-typed threat profiles._

| Flag | Subject | Detail |
| --- | --- | --- |
| HP > +25% tier avg | Giant Spider | 460 vs avg 293 (×1.57) |
| Spike < -25% tier avg | Giant Spider | 22.0 vs avg 32.9 (×0.67) |
| HP > +25% tier avg | Cave Troll | 740 vs avg 293 (×2.52) |
| Spike > +25% tier avg | Cave Troll | 65.0 vs avg 32.9 (×1.98) |
| HP > +25% tier avg | Cave Gargoyle | 530 vs avg 293 (×1.81) |
| Raw DPS < -25% tier avg | Cave Gargoyle | 10.0 vs avg 15.6 (×0.64) |
| HP < -25% tier avg | Dust Djinn | 200 vs avg 293 (×0.68) |
| Raw DPS > +25% tier avg | Ancient Wolf | 25.5 vs avg 15.6 (×1.63) |
| HP < -25% tier avg | Ironwood Golem | 200 vs avg 293 (×0.68) |
| Raw DPS > +25% tier avg | Ironwood Golem | 28.9 vs avg 15.6 (×1.85) |
| HP < -25% tier avg | Canopy Sprite | 190 vs avg 293 (×0.65) |
| Raw DPS < -25% tier avg | Canopy Sprite | 10.8 vs avg 15.6 (×0.70) |
| HP < -25% tier avg | Jungle Snake | 200 vs avg 293 (×0.68) |
| Spike < -25% tier avg | Jungle Snake | 16.0 vs avg 32.9 (×0.49) |
| HP < -25% tier avg | Jungle Blowdarter | 190 vs avg 293 (×0.65) |
| Raw DPS < -25% tier avg | Jungle Blowdarter | 8.42 vs avg 15.6 (×0.54) |
| Spike < -25% tier avg | Jungle Blowdarter | 16.0 vs avg 32.9 (×0.49) |
| HP > +25% tier avg | Granite Titan | 400 vs avg 293 (×1.36) |
| Spike > +25% tier avg | Granite Titan | 70.0 vs avg 32.9 (×2.13) |
| Spike > +25% tier avg | Stone Eagle | 50.0 vs avg 32.9 (×1.52) |
| Spike > +25% tier avg | Boulder Thrower | 60.0 vs avg 32.9 (×1.82) |
| HP < -25% tier avg | Stampede Bull | 200 vs avg 293 (×0.68) |
| Raw DPS > +25% tier avg | Stampede Bull | 23.5 vs avg 15.6 (×1.51) |
| HP < -25% tier avg | Prairie Wolf | 150 vs avg 293 (×0.51) |
| Raw DPS > +25% tier avg | Prairie Wolf | 26.7 vs avg 15.6 (×1.71) |
| HP < -25% tier avg | Savanna Hawk | 140 vs avg 293 (×0.48) |
| HP > +25% tier avg | Swamp Hydra | 370 vs avg 293 (×1.26) |
| Raw DPS < -25% tier avg | Swamp Hydra | 5.45 vs avg 15.6 (×0.35) |
| Spike < -25% tier avg | Swamp Hydra | 12.0 vs avg 32.9 (×0.36) |
| Raw DPS < -25% tier avg | Bog Witch | 7.27 vs avg 15.6 (×0.47) |
| Spike < -25% tier avg | Bog Witch | 16.0 vs avg 32.9 (×0.49) |
| Raw DPS < -25% tier avg | Mire Stalker | 8.46 vs avg 15.6 (×0.54) |
| Spike < -25% tier avg | Mire Stalker | 22.0 vs avg 32.9 (×0.67) |
| biome single-type | Desert | 100% Direct damage |
| biome single-type | Forest | 100% Direct damage |
| biome single-type | Mountain | 100% Direct damage |
| biome single-type | Plains | 100% Direct damage |

## Mob Stat Summary

_Every non-boss spawn in biome tier 2, sorted by raw total DPS within each biome. Raw DPS is pre-mitigation (attack × APS); DoT/s assumes full refreshed stacks._

| Biome | Mob | Role | HP | Attack | APS / CD | Raw DPS | DoT/s | Plating | DR | Range | Speed | Spike | Specials |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caverns | Giant Spider | DoT | 460 | 22.0 | 0.56 / 1800ms | 12.2 | 18.0 | 0.00 | 8.00% | 12.0 | 72.0 | ×1.00 | dot 18.0/s×3, evasion 20.0% |
| Caverns | Cave Troll | Bruiser | 740 | 65.0 | 0.28 / 3600ms | 18.1 | 0.00 | 4.00 | 15.0% | 15.0 | 15.0 | ×1.00 | charge ×2.00 |
| Caverns | Cave Gargoyle | Ranged | 530 | 32.0 | 0.31 / 3200ms | 10.0 | 0.00 | 3.00 | 10.0% | 200 | 22.0 | ×1.00 | ranged |
| Desert | Dust Djinn | Ranged | 200 | 34.0 | 0.48 / 2100ms | 16.2 | 0.00 | 0.00 | 5.00% | 185 | 40.0 | ×1.00 | slow ×0.60, ranged |
| Desert | Sand Scorpion | Bruiser | 220 | 32.0 | 0.50 / 2000ms | 16.0 | 0.00 | 0.00 | 8.00% | 12.0 | 52.0 | ×1.00 | slow ×0.50 |
| Desert | Stone Basilisk | Bruiser | 320 | 36.0 | 0.38 / 2600ms | 13.8 | 0.00 | 0.00 | 12.0% | 12.0 | 28.0 | ×1.00 | root |
| Forest | Ironwood Golem | Bruiser | 200 | 26.0 | 1.11 / 900ms | 28.9 | 0.00 | 0.00 | 0.00% | 15.0 | 22.0 | ×1.00 | - |
| Forest | Ancient Wolf | Bruiser | 225 | 28.0 | 0.91 / 1100ms | 25.5 | 0.00 | 0.00 | 0.00% | 12.0 | 96.0 | ×1.00 | charge ×3.00 |
| Forest | Canopy Sprite | Ranged | 190 | 26.0 | 0.42 / 2400ms | 10.8 | 0.00 | 0.00 | 0.00% | 190 | 48.0 | ×1.00 | ranged |
| Jungle | Jungle Snake | DoT | 200 | 16.0 | 0.91 / 1100ms | 14.5 | 18.0 | 0.00 | 0.00% | 12.0 | 76.0 | ×1.00 | dot 18.0/s×3 |
| Jungle | Jungle Blowdarter | DoT | 190 | 16.0 | 0.53 / 1900ms | 8.42 | 24.0 | 0.00 | 0.00% | 190 | 48.0 | ×1.00 | dot 24.0/s×4, ranged |
| Jungle | Jungle Ape | Bruiser | 250 | 26.0 | 0.59 / 1700ms | 15.3 | 0.00 | 0.00 | 0.00% | 12.0 | 62.0 | ×1.00 | charge ×2.80 |
| Mountain | Granite Titan | Bruiser | 400 | 70.0 | 0.26 / 3800ms | 18.4 | 0.00 | 0.00 | 0.00% | 15.0 | 18.0 | ×1.00 | charge ×2.50 |
| Mountain | Stone Eagle | Bruiser | 290 | 50.0 | 0.36 / 2800ms | 17.9 | 0.00 | 0.00 | 0.00% | 12.0 | 40.0 | ×1.00 | charge ×2.50 |
| Mountain | Boulder Thrower | Ranged | 330 | 60.0 | 0.29 / 3500ms | 17.1 | 0.00 | 0.00 | 0.00% | 240 | 28.0 | ×1.00 | ranged |
| Plains | Prairie Wolf | Bruiser | 150 | 32.0 | 0.83 / 1200ms | 26.7 | 0.00 | 0.00 | 0.00% | 12.0 | 92.0 | ×1.00 | - |
| Plains | Stampede Bull | Bruiser | 200 | 40.0 | 0.59 / 1700ms | 23.5 | 0.00 | 0.00 | 5.00% | 12.0 | 62.0 | ×1.00 | charge ×2.50 |
| Plains | Savanna Hawk | Ranged | 140 | 30.0 | 0.42 / 2400ms | 12.5 | 0.00 | 0.00 | 0.00% | 165 | 50.0 | ×1.00 | ranged |
| Swamp | Swamp Hydra | DoT | 370 | 12.0 | 0.45 / 2200ms | 5.45 | 25.0 | 0.00 | 10.0% | 15.0 | 28.0 | ×1.00 | dot 25.0/s×5 |
| Swamp | Bog Witch | DoT | 230 | 16.0 | 0.45 / 2200ms | 7.27 | 16.0 | 0.00 | 5.00% | 180 | 38.0 | ×1.00 | dot 16.0/s×4, ranged |
| Swamp | Mire Stalker | DoT | 320 | 22.0 | 0.38 / 2600ms | 8.46 | 12.0 | 0.00 | 12.0% | 12.0 | 40.0 | ×1.00 | dot 12.0/s×4, evasion 20.0% |
