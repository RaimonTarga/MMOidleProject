# MMO Idle LLM Survivability Packet - T1

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
| Prev-tier +3 vs current mobs | T0 +3 | 40.3 atk / 0.48 aps / 3.30 dot / ×1.00 | 161 | -15.9 | 6.40s | 0.00% | 6 |
| Current +0 vs current mobs (entry) | T1 +0 | 40.3 atk / 0.48 aps / 3.30 dot / ×1.00 | 189 | -14.3 | 7.97s | 0.00% | 4 |
| Current +3 vs current mobs (geared) | T1 +3 | 40.3 atk / 0.48 aps / 3.30 dot / ×1.00 | 281 | -8.35 | 12.3s | 0.00% | 0 |
| Current +3 vs boss/elite | T1 +3 | 56.0 atk / 0.29 aps / 0.00 dot / ×1.60 | 254 | -6.25 | 16.3s | 0.00% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite |
| --- | --- | --- | --- | --- |
| Apprentice | 161 | 191 | 285 | 236 |
| Conduit | 144 | 168 | 239 | 214 |
| Slinger | 166 | 205 | 272 | 289 |
| Spirit | 137 | 160 | 228 | 207 |
| Squire | 194 | 221 | 370 | 317 |
| Striker | 161 | 188 | 294 | 261 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Arcane Wrappings | +0 | 24.0 | 6.00 | 0.00% | 0.00 | defense.dot-resistance=0.18 | 187 | 8.95s | -15.8 | DoT-heavy | hardest |
| Arcane Wrappings | +5 | 54.0 | 16.0 | 0.00% | 0.00 | defense.dot-resistance=0.18 | 329 | 17.1s | -10.5 | avg mob | hardest |
| Bestial Hide | +0 | 28.0 | 2.00 | 6.00% | 0.00 | - | 176 | 8.37s | -17.4 | hardest | DoT-heavy |
| Bestial Hide | +5 | 63.0 | 7.00 | 16.0% | 0.00 | - | 281 | 14.1s | -13.2 | avg mob | DoT-heavy |
| Fallen Knight Plate | +0 | 22.0 | 7.00 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25 | 184 | 8.78s | -15.9 | hardest | DoT-heavy |
| Fallen Knight Plate | +5 | 52.0 | 17.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25 | 326 | 16.9s | -10.5 | avg mob | DoT-heavy |
| Shaded Bindings | +0 | 24.0 | 4.00 | 0.00% | 0.18 | - | 186 | 8.90s | -15.9 | boss | DoT-heavy |
| Shaded Bindings | +5 | 54.0 | 9.00 | 0.00% | 0.38 | - | 294 | 14.8s | -11.9 | avg mob | DoT-heavy |
| Survivor's Robe | +0 | 14.0 | 9.00 | 0.00% | 0.00 | - | 182 | 8.69s | -14.9 | avg mob | hardest |
| Survivor's Robe | +5 | 34.0 | 24.0 | 0.00% | 0.00 | - | 415 | 23.0s | -7.24 | avg mob | DoT-heavy |

## Charm Comparison

_Reference armor Bestial Hide +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | hpRegen | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Granite Barrier | +0 | 3.00 | defense.shield-duration-ms=10000, defense.shield-interval-ms=10000, defense.shield-pct=0.09 | 2.23 | -106 | 8.90s | hardest | DoT-heavy |
| Granite Barrier | +5 | 3.00 | defense.shield-duration-ms=10000, defense.shield-interval-ms=10000, defense.shield-pct=0.14 | 3.69 | 0.00 | 17.0s | avg mob | DoT-heavy |
| Heartroot Amulet | +0 | 6.00 | guard.cooldown-reduction-pct=0.15, guard.heal-on-fire-pct=0.08 | 1.44 | -106 | 8.48s | hardest | DoT-heavy |
| Heartroot Amulet | +5 | 16.0 | guard.cooldown-reduction-pct=0.15, guard.heal-on-fire-pct=0.08 | 2.19 | 0.00 | 15.3s | boss | DoT-heavy |
| Murk Eye | +0 | 3.00 | defense.absorb-pct=0.07 | 2.44 | -106 | 8.99s | hardest | DoT-heavy |
| Murk Eye | +5 | 3.00 | defense.absorb-pct=0.12 | 3.12 | 0.00 | 16.1s | hardest | DoT-heavy |
| Plains Stone | +0 | 4.00 | defense.kill-burst-pct=0.05, guard.potency-pct=0.20 (kill-burst undercounted) | 1.38 | -106 | 8.44s | hardest | DoT-heavy |
| Plains Stone | +5 | 4.00 | defense.kill-burst-pct=0.10, guard.potency-pct=0.20 (kill-burst undercounted) | 1.76 | 0.00 | 14.4s | avg mob | DoT-heavy |
| Pulse Stone | +0 | 3.00 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.05 | 2.56 | -106 | 9.07s | hardest | DoT-heavy |
| Pulse Stone | +5 | 3.00 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.10 | 4.80 | 0.00 | 19.0s | avg mob | DoT-heavy |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-1 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Forest | 18.5 atk / 0.80 aps / 0.00 dot / ×1.00 | Squire · Arcane Wrappings/Pulse Stone | 3423 | 0.80 | 4.87 | 4.07 | sustains | 0.54% | Safe |
| Mountain | 82.0 atk / 0.33 aps / 0.00 dot / ×1.00 | Striker · Shaded Bindings/Pulse Stone | 284 | 16.0 | 4.48 | -11.5 | 14.6s | 33.9% | Risky |
| Plains | 15.0 atk / 0.51 aps / 0.00 dot / ×1.00 | Squire · Arcane Wrappings/Pulse Stone | 2775 | 0.51 | 4.87 | 4.36 | sustains | 0.54% | Safe |
| Swamp | 11.5 atk / 0.48 aps / 16.5 dot / ×1.00 | Squire · Arcane Wrappings/Pulse Stone | 290 | 14.0 | 4.87 | -9.13 | 20.3s | 0.54% | Risky |
| Caverns | 74.5 atk / 0.48 aps / 0.00 dot / ×1.00 | Striker · Shaded Bindings/Pulse Stone | 278 | 21.5 | 4.48 | -17.0 | 9.90s | 31.5% | Blocked |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Crag Behemoth | Obsidian Broodmother | Tusked Razorback | Gnarled Greatbear | Grave Toadeater |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 18.4s | 20.5s | 35.1s | sustains | 18.7s |
| Conduit | 16.3s | 17.4s | 26.2s | 130s | 13.3s |
| Slinger | 23.7s | 23.4s | 34.0s | 242s | 13.3s |
| Spirit | 29.4s | 32.4s | 95.1s | sustains | 20.3s |
| Squire | 41.3s | 58.1s | sustains | sustains | 21.4s |
| Striker | 28.8s | 32.4s | 97.6s | sustains | 18.6s |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crag Behemoth | 56.0 atk / 0.29 aps / 0.00 dot / ×1.60 | Squire | Survivor's Robe | Pulse Stone | 317 | 41.3s | -3.97 | 37.2% | Risky |
| Obsidian Broodmother | 47.0 atk / 0.36 aps / 0.00 dot / ×1.60 | Squire | Survivor's Robe | Pulse Stone | 385 | 58.1s | -2.82 | 28.7% | Risky |
| Tusked Razorback | 34.0 atk / 0.50 aps / 0.00 dot / ×1.10 | Squire | Survivor's Robe | Pulse Stone | 697 | sustains | 0.32 | 6.71% | Safe |
| Gnarled Greatbear | 24.0 atk / 0.71 aps / 0.00 dot / ×1.28 | Squire | Survivor's Robe | Pulse Stone | 3936 | sustains | 3.60 | 3.05% | Safe |
| Grave Toadeater | 13.0 atk / 0.38 aps / 16.0 dot / ×1.60 | Squire | Arcane Wrappings | Pulse Stone | 288 | 21.4s | -8.63 | 1.62% | Risky |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss |
| --- | --- | --- | --- | --- |
| Arcane Wrappings | 372 | 309 | 263 | 319 |
| Bestial Hide | 317 | 267 | 297 | 317 |
| Fallen Knight Plate | 368 | 250 | 325 | 326 |
| Shaded Bindings | 331 | 254 | 307 | 331 |
| Survivor's Robe | 469 | 220 | 252 | 372 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Bestial Hide, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss |
| --- | --- | --- | --- | --- |
| Granite Barrier | 366 | 308 | 343 | 365 |
| Heartroot Amulet | 331 | 278 | 309 | 331 |
| Murk Eye | 352 | 271 | 375 | 348 |
| Plains Stone | 321 | 270 | 300 | 320 |
| Pulse Stone | 390 | 329 | 365 | 390 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire | Survivor's Robe/Pulse Stone | 517 | 370 | 10.00 | 4.32 | 28.9s | 8.54% |
| Striker | Survivor's Robe/Pulse Stone | 412 | 294 | 11.4 | 3.97 | 20.0s | 11.4% |
| Spirit | Survivor's Robe/Pulse Stone | 376 | 228 | 12.9 | 5.63 | 18.0s | 15.4% |
| Apprentice | Survivor's Robe/Pulse Stone | 342 | 285 | 11.2 | 1.88 | 15.2s | 12.8% |
| Slinger | Survivor's Robe/Pulse Stone | 327 | 272 | 11.2 | 1.80 | 14.4s | 14.8% |
| Conduit | Survivor's Robe/Pulse Stone | 286 | 239 | 12.9 | 1.81 | 12.3s | 14.7% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit | Survivor's Robe/Pulse Stone | 286 | 239 | 12.9 | 1.81 | 12.3s | 14.7% |
| Slinger | Survivor's Robe/Pulse Stone | 327 | 272 | 11.2 | 1.80 | 14.4s | 14.8% |
| Apprentice | Survivor's Robe/Pulse Stone | 342 | 285 | 11.2 | 1.88 | 15.2s | 12.8% |
| Spirit | Survivor's Robe/Pulse Stone | 376 | 228 | 12.9 | 5.63 | 18.0s | 15.4% |
| Striker | Survivor's Robe/Pulse Stone | 412 | 294 | 11.4 | 3.97 | 20.0s | 11.4% |
| Squire | Survivor's Robe/Pulse Stone | 517 | 370 | 10.00 | 4.32 | 28.9s | 8.54% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| armor > +25% tier avg | Survivor's Robe | survival 469 vs avg 371 |
| boss TTL < threshold | Conduit · Shaded Bindings/Pulse Stone | 16.3s |
| boss TTL < threshold | Apprentice · Survivor's Robe/Pulse Stone | 18.4s |

