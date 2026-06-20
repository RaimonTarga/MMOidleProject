# MMO Idle LLM Survivability Packet - T1 (No Conduit)

Generated from `tools/ehp-report.ts --llm-packet`. Progression-focused companion to the DPS packet.

## Assumptions / Omissions

- Class unlock tier 0. Views model progression moments, not just same-tier +3 gear.
- Checkpoints: prev-tier +3 entering, current +0 entry, current +3 geared, current +3 vs boss, current +3 vs next-tier mobs. "Current mobs" = biome spawn pools one tier below report tier (the established convention); bosses come from boss pools.
- Comparison/route/checkpoint views are **spec-agnostic** (root+frame+range only) to keep the cross-product readable; the HTML report's collapsed dump keeps full per-spec rows.
- eHP = maxHP × (raw ÷ post-mitigation DPS). Survival = (maxHP + recovery×15s) × mitigation, so charms rank. TTL/"sustains" use averaged recovery.
- Status: Safe / Risky / Blocked from TTL + one-shot risk (mob risk<30s/block<10s; boss risk<20s/block<8s).

## Undercounted / Unmodeled Mechanics

- **Range & movement**: kiting, attack range, and repositioning are ignored — melee-range pressure is assumed.
- **Kill-burst** recovery is undercounted (no kill cadence modeled); flagged in the charm table.
- **Evasion** is averaged (dodgeRate × evade-mitigation), not the deterministic first-hit accumulator.
- **Shield timing** is treated as flat HP/s throughput — no burst-vs-chip interaction or DoT bypass beyond notes.
- **Multi-enemy pressure** is not modeled; a single attacker profile is assumed (idle pulls are often several mobs).

## Progression Checkpoints

| Checkpoint | Gear | Attacker | Avg eHP | Avg net/s | Min TTL | Safe % | Blocked |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prev-tier +3 vs current mobs | T0 +3 | 19.6 atk / 0.43 aps / 1.07 dot / ×1.00 | 277 | -3.24 | 26.5s | 0.00% | 0 |
| Current +0 vs current mobs (entry) | T1 +0 | 19.6 atk / 0.43 aps / 1.07 dot / ×1.00 | 355 | -1.13 | 46.0s | 20.0% | 0 |
| Current +3 vs current mobs (geared) | T1 +3 | 19.6 atk / 0.43 aps / 1.07 dot / ×1.00 | 1044 | 2.40 | sustains | 100% | 0 |
| Current +3 vs boss/elite | T1 +3 | 60.0 atk / 0.29 aps / 0.00 dot / ×1.60 | 274 | -6.42 | 19.6s | 0.00% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite |
| --- | --- | --- | --- | --- |
| Apprentice | 288 | 369 | 1175 | 266 |
| Slinger | 250 | 307 | 998 | 311 |
| Spirit | 192 | 238 | 860 | 214 |
| Squire | 365 | 483 | 1201 | 311 |
| Striker | 288 | 375 | 986 | 270 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Arcane Wrappings | +0 | 24.0 | 6.00 | 0.00% | 0.00 | defense.dot-resistance=0.18 | 298 | 51.1s | -3.42 | DoT-heavy | boss |
| Arcane Wrappings | +3 | 42.0 | 12.0 | 0.00% | 0.00 | defense.dot-resistance=0.18 | 692 | 65.7s | -0.77 | avg mob | boss |
| Bestial Hide | +0 | 28.0 | 2.00 | 6.00% | 0.00 | - | 235 | 34.9s | -4.82 | avg mob | boss |
| Bestial Hide | +3 | 49.0 | 5.00 | 12.0% | 0.00 | - | 339 | 76.3s | -3.21 | avg mob | boss |
| Fallen Knight Plate | +0 | 22.0 | 7.00 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25 | 307 | 54.3s | -3.24 | avg mob | boss |
| Fallen Knight Plate | +3 | 40.0 | 13.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25 | 760 | 70.0s | -0.58 | avg mob | boss |
| Shaded Bindings | +0 | 24.0 | 4.00 | 0.00% | 0.18 | - | 268 | 42.4s | -3.94 | avg mob | boss |
| Shaded Bindings | +3 | 42.0 | 7.00 | 0.00% | 0.30 | - | 399 | 121s | -2.39 | avg mob | boss |
| Survivor's Robe | +0 | 14.0 | 9.00 | 0.00% | 0.00 | - | 355 | 72.9s | -2.50 | avg mob | boss |
| Survivor's Robe | +3 | 26.0 | 18.0 | 0.00% | 0.00 | - | 1026 | 115s | 0.14 | avg mob | DoT-heavy |

## Charm Comparison

_Reference armor Bestial Hide +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | hpRegen | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Granite Barrier | +0 | 3.00 | defense.shield-duration-ms=10000, defense.shield-interval-ms=10000, defense.shield-pct=0.09 | 2.59 | -104 | 49.6s | avg mob | boss |
| Granite Barrier | +3 | 3.00 | defense.shield-duration-ms=10000, defense.shield-interval-ms=10000, defense.shield-pct=0.12 | 3.43 | 0.00 | 166s | avg mob | boss |
| Heartroot Amulet | +0 | 6.00 | - | 1.82 | -104 | 38.1s | avg mob | boss |
| Heartroot Amulet | +3 | 12.0 | - | 2.31 | 0.00 | 431s | avg mob | boss |
| Murk Eye | +0 | 3.00 | defense.absorb-pct=0.07 | 2.09 | -104 | 40.0s | avg mob | boss |
| Murk Eye | +3 | 3.00 | defense.absorb-pct=0.10 | 2.35 | 0.00 | 118s | avg mob | boss |
| Plains Core | +0 | 4.00 | defense.kill-burst-pct=0.05 (kill-burst undercounted) | 1.75 | -104 | 36.8s | avg mob | boss |
| Plains Core | +3 | 4.00 | defense.kill-burst-pct=0.08 (kill-burst undercounted) | 1.99 | 0.00 | 83.7s | avg mob | boss |
| Pulse Stone | +0 | 3.00 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.05 | 3.03 | -104 | 54.6s | avg mob | boss |
| Pulse Stone | +3 | 3.00 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.08 | 4.33 | 0.00 | 473s | avg mob | boss |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-1 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Forest | 12.0 atk / 0.74 aps / 0.00 dot / ×1.00 | Squire · Shaded Bindings/Pulse Stone | 2711 | 0.63 | 5.06 | 4.43 | sustains | 0.52% | Safe |
| Mountain | 34.0 atk / 0.29 aps / 0.00 dot / ×1.00 | Squire · Survivor's Robe/Pulse Stone | 598 | 2.86 | 4.63 | 1.78 | sustains | 5.68% | Safe |
| Plains | 15.0 atk / 0.51 aps / 0.00 dot / ×1.00 | Squire · Arcane Wrappings/Pulse Stone | 2880 | 0.51 | 5.06 | 4.54 | sustains | 0.52% | Safe |
| Swamp | 9.00 atk / 0.43 aps / 5.33 dot / ×1.00 | Squire · Arcane Wrappings/Pulse Stone | 369 | 4.81 | 5.06 | 0.25 | sustains | 0.52% | Safe |
| Caverns | 28.0 atk / 0.38 aps / 0.00 dot / ×1.00 | Squire · Survivor's Robe/Pulse Stone | 986 | 1.92 | 4.63 | 2.71 | sustains | 2.84% | Safe |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Crag Behemoth | Obsidian Broodmother | Tusked Razorback | Gnarled Greatbear | Grave Toadeater |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 19.6s | 38.6s | 21.0s | 21.0s | 46.9s |
| Slinger | 23.9s | 38.5s | 21.2s | 20.2s | 30.3s |
| Spirit | 27.3s | 109s | 26.6s | 24.6s | 129s |
| Squire | 34.6s | 163s | 45.5s | 44.7s | 70.9s |
| Striker | 27.1s | 81.6s | 29.2s | 30.4s | 54.1s |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crag Behemoth | 60.0 atk / 0.29 aps / 0.00 dot / ×1.60 | Squire | Survivor's Robe | Pulse Stone | 311 | 34.6s | -5.08 | 38.1% | Risky |
| Obsidian Broodmother | 40.0 atk / 0.36 aps / 0.00 dot / ×1.60 | Squire | Survivor's Robe | Pulse Stone | 440 | 163s | -1.08 | 21.6% | Risky |
| Tusked Razorback | 42.0 atk / 0.50 aps / 0.00 dot / ×1.00 | Squire | Survivor's Robe | Pulse Stone | 435 | 45.5s | -3.87 | 9.66% | Risky |
| Gnarled Greatbear | 36.0 atk / 0.71 aps / 0.00 dot / ×1.00 | Squire | Survivor's Robe | Pulse Stone | 528 | 44.7s | -3.94 | 6.82% | Risky |
| Grave Toadeater | 12.0 atk / 0.38 aps / 9.00 dot / ×1.60 | Apprentice | Arcane Wrappings | Pulse Stone | 393 | 46.9s | -3.77 | 2.26% | Risky |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss |
| --- | --- | --- | --- | --- |
| Arcane Wrappings | 791 | 386 | 347 | 286 |
| Bestial Hide | 389 | 332 | 319 | 292 |
| Fallen Knight Plate | 869 | 315 | 357 | 295 |
| Shaded Bindings | 456 | 323 | 343 | 312 |
| Survivor's Robe | 1176 | 289 | 414 | 301 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Bestial Hide, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss |
| --- | --- | --- | --- | --- |
| Granite Barrier | 437 | 371 | 359 | 328 |
| Heartroot Amulet | 404 | 343 | 331 | 303 |
| Murk Eye | 404 | 336 | 338 | 321 |
| Plains Core | 394 | 336 | 323 | 296 |
| Pulse Stone | 461 | 392 | 378 | 346 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire | Fallen Knight Plate/Pulse Stone | 1675 | 1201 | 1.49 | 5.00 | sustains | 0.53% |
| Spirit | Survivor's Robe/Pulse Stone | 1418 | 860 | 1.49 | 5.89 | sustains | 0.74% |
| Apprentice | Survivor's Robe/Pulse Stone | 1409 | 1175 | 1.29 | 2.15 | sustains | 0.62% |
| Striker | Survivor's Robe/Pulse Stone | 1380 | 986 | 1.49 | 4.16 | sustains | 0.64% |
| Slinger | Survivor's Robe/Pulse Stone | 1198 | 998 | 1.42 | 2.00 | sustains | 0.67% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Slinger | Survivor's Robe/Pulse Stone | 1198 | 998 | 1.42 | 2.00 | sustains | 0.67% |
| Striker | Survivor's Robe/Pulse Stone | 1380 | 986 | 1.49 | 4.16 | sustains | 0.64% |
| Apprentice | Survivor's Robe/Pulse Stone | 1409 | 1175 | 1.29 | 2.15 | sustains | 0.62% |
| Spirit | Survivor's Robe/Pulse Stone | 1418 | 860 | 1.49 | 5.89 | sustains | 0.74% |
| Squire | Fallen Knight Plate/Pulse Stone | 1675 | 1201 | 1.49 | 5.00 | sustains | 0.53% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| armor < -25% tier avg | Bestial Hide | survival 389 vs avg 736 |
| armor < -25% tier avg | Shaded Bindings | survival 456 vs avg 736 |
| armor > +25% tier avg | Survivor's Robe | survival 1176 vs avg 736 |
| dominant charm | Pulse Stone | best survival in every matchup profile |
| sustains too early | 1 build(s) | already immortal vs avg mobs on entry (+0) gear |
| boss TTL < threshold | Apprentice · Survivor's Robe/Pulse Stone | 19.6s |

