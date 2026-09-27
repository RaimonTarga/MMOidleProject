# MMO Idle LLM Survivability Packet - T1

Generated from `tools/ehp-report.ts --llm-packet`. Progression-focused companion to the DPS packet.

## Assumptions / Omissions

- Player model: weapon, armour, charm and mobility only, plus skill nodes, item upgrades and class affinities. NO core, relic, rune, rite, stance or ability is equipped — the bench bots carry all six, so these numbers are comparable to each other but NOT to bench output in absolute terms.

- Class unlock tier 0. Views model progression moments, not just same-tier +3 gear.
- Checkpoints: prev-tier +3 entering, current +0 entry, current +3 geared, current +3 vs boss, current +3 vs next-tier mobs. "Current mobs" = biome spawn pools one tier below report tier (the established convention); bosses come from boss pools.
- Comparison/route/checkpoint views are **spec-agnostic** (root+frame+range only) to keep the cross-product readable; the HTML report's collapsed dump keeps full per-spec rows.
- eHP = maxHP × (raw ÷ post-mitigation DPS). Survival = (maxHP + recovery×15s) × mitigation, so charms rank. TTL/"sustains" use averaged recovery.
- Status: Safe / Risky / Blocked from TTL + one-shot risk (mob risk<30s/block<10s; boss risk<20s/block<8s).

## Undercounted / Unmodeled Mechanics

- **Range & movement**: kiting, attack range, and repositioning are ignored — melee-range pressure is assumed.
- **Kill-burst** recovery is undercounted (no kill cadence modeled); flagged in the charm table.
- **Evasion** is averaged (dodgeRate × evade-mitigation), not the deterministic first-hit accumulator.
- **Barrier** is a flat one-time buffer — no between-engagement recharge, no burst-vs-chip interaction, no DoT bypass beyond notes.
- **Ramping mitigations ARE modelled**, as duty-cycle averages over the 60s window, never at their printed maximum: reactive plating (stack ramp against the attacker's own cadence), stationary DR (scaled by an assumed 50% stationary duty cycle — override with `--stationary-fraction`). Each is printed in the affected row's notes. The assumed duty cycles are the two judgement calls in this report; treat Tundra and Volcanic rows accordingly.
- **Not** modelled: core DR layer, wards, barrier recharge, barrier-break heals, on-kill Recovery.
- **Multi-enemy pressure** is not modeled; a single attacker profile is assumed (idle pulls are often several mobs).

## Progression Checkpoints

| Checkpoint | Gear | Attacker | Avg eHP | Avg net/s | Min TTL | Safe % | Blocked |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prev-tier +3 vs current mobs | T0 +3 | 28.1 atk / 0.48 aps / 2.70 dot / ×1.00 | 190 | -11.1 | 9.83s | 0.00% | 1 |
| Current +0 vs current mobs (entry) | T1 +0 | 28.1 atk / 0.48 aps / 2.70 dot / ×1.00 | 208 | -8.99 | 12.2s | 0.00% | 0 |
| Current +3 vs current mobs (geared) | T1 +3 | 28.1 atk / 0.48 aps / 2.70 dot / ×1.00 | 229 | -7.66 | 14.6s | 0.00% | 0 |
| Current +3 vs boss/elite | T1 +3 | 56.0 atk / 0.29 aps / 0.00 dot / ×1.00 | 244 | -6.96 | 15.4s | 0.00% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite |
| --- | --- | --- | --- | --- |
| Apprentice | 188 | 202 | 224 | 227 |
| Conduit | 159 | 172 | 190 | 196 |
| Slinger | 182 | 215 | 235 | 261 |
| Spirit | 151 | 165 | 181 | 187 |
| Squire | 255 | 275 | 300 | 328 |
| Striker | 203 | 222 | 244 | 264 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Arcane Wrappings | +0 | 32.0 | 0.00 | 4.00% | 0.00 | defense.dot-resistance=0.25 | 198 | 13.7s | -11.8 | DoT-heavy | hardest |
| Arcane Wrappings | +5 | 48.0 | 0.00 | 4.00% | 0.00 | defense.dot-resistance=0.35 | 227 | 15.9s | -11.4 | DoT-heavy | hardest |
| Bestial Hide | +0 | 30.0 | 0.00 | 10.0% | 0.00 | - | 194 | 13.4s | -11.7 | boss | DoT-heavy |
| Bestial Hide | +5 | 45.0 | 0.00 | 14.0% | 0.00 | - | 225 | 15.8s | -11.2 | boss | DoT-heavy |
| Fallen Knight Plate | +0 | 36.0 | 1.00 | 4.00% | 0.00 | guard.potency-pct=0.15 | 199 | 13.8s | -12.0 | avg mob | DoT-heavy |
| Fallen Knight Plate | +5 | 54.0 | 2.00 | 4.00% | 0.00 | guard.potency-pct=0.25 | 231 | 16.3s | -11.6 | avg mob | DoT-heavy |
| Shaded Bindings | +0 | 29.0 | 0.00 | 2.00% | 0.28 | defense.evade-mitigation=0.10 | 208 | 14.5s | -10.9 | boss | DoT-heavy |
| Shaded Bindings | +5 | 44.0 | 0.00 | 2.00% | 0.36 | defense.evade-mitigation=0.10 | 243 | 17.2s | -10.3 | boss | DoT-heavy |
| Survivor's Robe | +0 | 27.0 | 2.00 | 4.00% | 0.00 | - | 191 | 13.2s | -11.7 | avg mob | DoT-heavy |
| Survivor's Robe | +5 | 41.0 | 3.00 | 4.00% | 0.00 | - | 223 | 15.6s | -11.1 | avg mob | DoT-heavy |

## Charm Comparison

_Reference armor Fallen Knight Plate +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | recovery | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Granite Barrier | +0 | 1.00 | defense.barrier-pct=0.12 | 0.72 | -32.7 | 15.5s | avg mob | DoT-heavy |
| Granite Barrier | +5 | 2.00 | defense.barrier-pct=0.18 | 0.89 | 0.00 | 19.5s | avg mob | DoT-heavy |
| Heartroot Amulet | +0 | 3.00 | defense.recovery-skill-potency=0.10 | 0.85 | -32.7 | 14.2s | avg mob | DoT-heavy |
| Heartroot Amulet | +5 | 5.00 | defense.recovery-skill-potency=0.15 | 1.11 | 0.00 | 17.2s | avg mob | DoT-heavy |
| Murk Eye | +0 | 2.00 | defense.recovery-pulse-duration-ms=4000, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.20 | 2.62 | -32.7 | 17.0s | avg mob | DoT-heavy |
| Murk Eye | +5 | 3.00 | defense.recovery-pulse-duration-ms=4000, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.30 | 4.42 | 0.00 | 26.6s | avg mob | DoT-heavy |
| Plains Stone | +0 | 1.00 | defense.recovery-on-kill-ms=4000, defense.recovery-on-kill-pct=0.20 (on-kill Recovery undercounted) | 0.72 | -32.7 | 13.9s | avg mob | DoT-heavy |
| Plains Stone | +5 | 2.00 | defense.recovery-on-kill-ms=4000, defense.recovery-on-kill-pct=0.30 (on-kill Recovery undercounted) | 0.89 | 0.00 | 16.6s | avg mob | DoT-heavy |
| Pulse Stone | +0 | 2.00 | defense.absorb-pct=0.08 | 1.59 | -32.7 | 15.1s | hardest | DoT-heavy |
| Pulse Stone | +5 | 3.00 | defense.absorb-pct=0.12 | 2.12 | 0.00 | 18.9s | hardest | DoT-heavy |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-1 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Forest | 18.5 atk / 0.80 aps / 0.00 dot / ×1.00 | Squire · Survivor's Robe/Murk Eye | 362 | 7.20 | 5.26 | -1.94 | 90.8s | 5.11% | Risky |
| Mountain | 40.0 atk / 0.33 aps / 0.00 dot / ×1.00 | Squire · Shaded Bindings/Murk Eye | 330 | 7.15 | 5.35 | -1.80 | 99.6s | 15.1% | Risky |
| Plains | 15.0 atk / 0.51 aps / 0.00 dot / ×1.00 | Squire · Survivor's Robe/Murk Eye | 440 | 3.08 | 5.26 | 2.19 | sustains | 3.41% | Safe |
| Swamp | 11.5 atk / 0.48 aps / 13.5 dot / ×1.00 | Squire · Arcane Wrappings/Murk Eye | 278 | 12.6 | 5.53 | -7.12 | 26.0s | 3.78% | Risky |
| Caverns | 55.5 atk / 0.48 aps / 0.00 dot / ×1.00 | Squire · Shaded Bindings/Murk Eye | 325 | 14.5 | 5.35 | -9.18 | 19.5s | 21.2% | Risky |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Crag Behemoth | Obsidian Broodmother | Tusked Razorback | Gnarled Greatbear | Grave Toadeater |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 18.6s | 22.6s | 25.9s | 49.4s | 32.1s |
| Conduit | 15.4s | 18.4s | 20.9s | 38.3s | 21.4s |
| Slinger | 22.5s | 27.3s | 31.5s | 58.0s | 23.7s |
| Spirit | 18.9s | 22.5s | 25.5s | 45.8s | 26.1s |
| Squire | 53.1s | 74.8s | 121s | sustains | 60.4s |
| Striker | 40.0s | 52.6s | 88.7s | sustains | 55.8s |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crag Behemoth | 56.0 atk / 0.29 aps / 0.00 dot / ×1.00 | Squire | Shaded Bindings | Murk Eye | 328 | 53.1s | -3.37 | 21.2% | Risky |
| Obsidian Broodmother | 40.0 atk / 0.36 aps / 0.00 dot / ×1.00 | Squire | Shaded Bindings | Murk Eye | 330 | 74.8s | -2.39 | 15.1% | Risky |
| Tusked Razorback | 26.0 atk / 0.50 aps / 0.00 dot / ×1.00 | Squire | Shaded Bindings | Murk Eye | 341 | 121s | -1.48 | 9.50% | Risky |
| Gnarled Greatbear | 18.0 atk / 0.53 aps / 0.00 dot / ×1.00 | Squire | Survivor's Robe | Murk Eye | 396 | sustains | 1.05 | 4.55% | Safe |
| Grave Toadeater | 13.0 atk / 0.38 aps / 8.00 dot / ×1.00 | Squire | Arcane Wrappings | Murk Eye | 280 | 60.4s | -3.07 | 4.32% | Risky |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss |
| --- | --- | --- | --- | --- |
| Arcane Wrappings | 251 | 294 | 233 | 235 |
| Bestial Hide | 250 | 207 | 253 | 258 |
| Fallen Knight Plate | 257 | 226 | 246 | 252 |
| Shaded Bindings | 269 | 210 | 285 | 288 |
| Survivor's Robe | 247 | 213 | 230 | 236 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Fallen Knight Plate, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss |
| --- | --- | --- | --- | --- |
| Granite Barrier | 301 | 266 | 289 | 296 |
| Heartroot Amulet | 264 | 233 | 254 | 260 |
| Murk Eye | 330 | 291 | 317 | 325 |
| Plains Stone | 260 | 229 | 250 | 256 |
| Pulse Stone | 284 | 235 | 303 | 286 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire | Shaded Bindings/Murk Eye | 435 | 300 | 9.62 | 5.35 | 42.0s | 10.1% |
| Striker | Shaded Bindings/Murk Eye | 375 | 244 | 10.8 | 5.79 | 32.7s | 12.9% |
| Slinger | Shaded Bindings/Murk Eye | 295 | 235 | 10.2 | 2.50 | 19.3s | 17.6% |
| Spirit | Shaded Bindings/Murk Eye | 281 | 181 | 12.7 | 2.40 | 17.9s | 18.3% |
| Apprentice | Shaded Bindings/Murk Eye | 280 | 224 | 11.2 | 2.62 | 18.1s | 15.5% |
| Conduit | Shaded Bindings/Murk Eye | 238 | 190 | 12.7 | 2.52 | 14.6s | 17.4% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit | Shaded Bindings/Murk Eye | 238 | 190 | 12.7 | 2.52 | 14.6s | 17.4% |
| Apprentice | Shaded Bindings/Murk Eye | 280 | 224 | 11.2 | 2.62 | 18.1s | 15.5% |
| Spirit | Shaded Bindings/Murk Eye | 281 | 181 | 12.7 | 2.40 | 17.9s | 18.3% |
| Slinger | Shaded Bindings/Murk Eye | 295 | 235 | 10.2 | 2.50 | 19.3s | 17.6% |
| Striker | Shaded Bindings/Murk Eye | 375 | 244 | 10.8 | 5.79 | 32.7s | 12.9% |
| Squire | Shaded Bindings/Murk Eye | 435 | 300 | 9.62 | 5.35 | 42.0s | 10.1% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| dominant charm | Murk Eye | best survival in every matchup profile |
| boss TTL < threshold | Conduit · Shaded Bindings/Murk Eye | 15.4s |
| boss TTL < threshold | Apprentice · Shaded Bindings/Murk Eye | 18.6s |
| boss TTL < threshold | Spirit · Shaded Bindings/Murk Eye | 18.9s |

