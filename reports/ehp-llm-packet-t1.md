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
- **Ramping mitigations ARE modelled**, as duty-cycle averages over the 60s window, never at their printed maximum: hardening (ramp + big-hit reset, assumed spike cadence 12s when only a spike trips it), reactive plating (stack ramp against the attacker's own cadence), stationary DR (scaled by an assumed 50% stationary duty cycle — override with `--stationary-fraction`), and sustained-fight DR. Each is printed in the affected row's notes. The assumed duty cycles are the two judgement calls in this report; treat Tundra and Volcanic rows accordingly.
- **Not** modelled: core DR layer, wards, barrier recharge, barrier-break heals, on-kill Recovery.
- **Multi-enemy pressure** is not modeled; a single attacker profile is assumed (idle pulls are often several mobs).

## Progression Checkpoints

| Checkpoint | Gear | Attacker | Avg eHP | Avg net/s | Min TTL | Safe % | Blocked |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prev-tier +3 vs current mobs | T0 +3 | 31.1 atk / 0.48 aps / 3.30 dot / ×1.00 | 171 | -13.8 | 8.52s | 0.00% | 3 |
| Current +0 vs current mobs (entry) | T1 +0 | 31.1 atk / 0.48 aps / 3.30 dot / ×1.00 | 199 | -10.5 | 11.0s | 0.00% | 0 |
| Current +3 vs current mobs (geared) | T1 +3 | 31.1 atk / 0.48 aps / 3.30 dot / ×1.00 | 243 | -7.96 | 14.5s | 0.00% | 0 |
| Current +3 vs boss/elite | T1 +3 | 56.0 atk / 0.29 aps / 0.00 dot / ×1.00 | 212 | -8.26 | 14.3s | 0.00% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite |
| --- | --- | --- | --- | --- |
| Apprentice | 169 | 201 | 243 | 198 |
| Conduit | 155 | 176 | 211 | 184 |
| Slinger | 177 | 205 | 239 | 238 |
| Spirit | 148 | 168 | 201 | 175 |
| Squire | 205 | 246 | 315 | 255 |
| Striker | 175 | 199 | 250 | 223 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Arcane Wrappings | +0 | 30.0 | 4.00 | 0.00% | 0.00 | defense.dot-resistance=0.20 | 195 | 11.8s | -13.1 | DoT-heavy | hardest |
| Arcane Wrappings | +5 | 50.0 | 6.00 | 0.00% | 0.00 | defense.dot-resistance=0.30 | 250 | 15.4s | -11.7 | DoT-heavy | hardest |
| Bestial Hide | +0 | 28.0 | 4.00 | 6.00% | 0.00 | - | 190 | 11.5s | -13.3 | avg mob | DoT-heavy |
| Bestial Hide | +5 | 42.0 | 6.00 | 11.0% | 0.00 | - | 236 | 14.5s | -11.8 | avg mob | DoT-heavy |
| Fallen Knight Plate | +0 | 32.0 | 5.00 | 0.00% | 0.00 | guard.potency-pct=0.15 | 196 | 11.9s | -13.3 | avg mob | hardest |
| Fallen Knight Plate | +5 | 52.0 | 7.00 | 0.00% | 0.00 | guard.potency-pct=0.25 | 244 | 15.0s | -12.2 | avg mob | hardest |
| Shaded Bindings | +0 | 28.0 | 3.00 | 0.00% | 0.16 | - | 190 | 11.5s | -13.3 | avg mob | DoT-heavy |
| Shaded Bindings | +5 | 43.0 | 5.00 | 0.00% | 0.22 | - | 234 | 14.3s | -11.9 | avg mob | DoT-heavy |
| Survivor's Robe | +0 | 24.0 | 7.00 | 0.00% | 0.00 | - | 199 | 12.1s | -12.3 | avg mob | hardest |
| Survivor's Robe | +5 | 39.0 | 12.0 | 0.00% | 0.00 | - | 274 | 17.1s | -9.85 | avg mob | DoT-heavy |

## Charm Comparison

_Reference armor Fallen Knight Plate +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | recovery | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Granite Barrier | +0 | 1.00 | defense.barrier-pct=0.12 | 0.70 | -47.6 | 13.3s | avg mob | hardest |
| Granite Barrier | +5 | 2.00 | defense.barrier-pct=0.18 | 0.87 | 0.00 | 17.9s | avg mob | hardest |
| Heartroot Amulet | +0 | 3.00 | defense.recovery-skill-potency=0.10 | 0.82 | -47.6 | 12.1s | avg mob | hardest |
| Heartroot Amulet | +5 | 5.00 | defense.recovery-skill-potency=0.15 | 1.09 | 0.00 | 15.7s | avg mob | hardest |
| Murk Eye | +0 | 2.00 | defense.recovery-pulse-duration-ms=4000, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.20 | 2.55 | -47.6 | 14.0s | avg mob | hardest |
| Murk Eye | +5 | 3.00 | defense.recovery-pulse-duration-ms=4000, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.30 | 4.36 | 0.00 | 22.6s | avg mob | hardest |
| Plains Stone | +0 | 1.00 | defense.recovery-on-kill-ms=4000, defense.recovery-on-kill-pct=0.20 (on-kill Recovery undercounted) | 0.70 | -47.6 | 11.9s | avg mob | hardest |
| Plains Stone | +5 | 2.00 | defense.recovery-on-kill-ms=4000, defense.recovery-on-kill-pct=0.30 (on-kill Recovery undercounted) | 0.87 | 0.00 | 15.3s | avg mob | hardest |
| Pulse Stone | +0 | 2.00 | defense.absorb-pct=0.08 | 1.62 | -47.6 | 12.9s | hardest | DoT-heavy |
| Pulse Stone | +5 | 3.00 | defense.absorb-pct=0.12 | 2.11 | 0.00 | 17.1s | avg mob | DoT-heavy |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-1 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Forest | 18.5 atk / 0.80 aps / 0.00 dot / ×1.00 | Squire · Survivor's Robe/Murk Eye | 1600 | 1.60 | 5.17 | 3.57 | sustains | 1.16% | Safe |
| Mountain | 50.0 atk / 0.33 aps / 0.00 dot / ×1.00 | Squire · Survivor's Robe/Murk Eye | 262 | 10.9 | 5.17 | -5.71 | 30.3s | 19.1% | Risky |
| Plains | 15.0 atk / 0.51 aps / 0.00 dot / ×1.00 | Squire · Survivor's Robe/Murk Eye | 2595 | 0.51 | 5.17 | 4.66 | sustains | 0.58% | Safe |
| Swamp | 11.5 atk / 0.48 aps / 16.5 dot / ×1.00 | Squire · Arcane Wrappings/Murk Eye | 309 | 13.2 | 5.53 | -7.63 | 24.2s | 1.08% | Risky |
| Caverns | 60.5 atk / 0.48 aps / 0.00 dot / ×1.00 | Striker · Shaded Bindings/Murk Eye | 230 | 20.3 | 5.76 | -14.5 | 11.2s | 29.0% | Risky |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Crag Behemoth | Obsidian Broodmother | Tusked Razorback | Gnarled Greatbear | Grave Toadeater |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 15.7s | 15.8s | 19.1s | 28.7s | 19.6s |
| Conduit | 14.3s | 14.3s | 16.8s | 23.5s | 13.2s |
| Slinger | 19.9s | 19.2s | 21.3s | 30.4s | 13.6s |
| Spirit | 17.5s | 17.5s | 20.5s | 28.5s | 16.2s |
| Squire | 30.4s | 31.2s | 52.0s | 319s | 23.6s |
| Striker | 27.6s | 26.8s | 35.5s | 100s | 21.6s |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crag Behemoth | 56.0 atk / 0.29 aps / 0.00 dot / ×1.00 | Squire | Survivor's Robe | Murk Eye | 255 | 30.4s | -5.68 | 22.0% | Risky |
| Obsidian Broodmother | 47.0 atk / 0.36 aps / 0.00 dot / ×1.00 | Squire | Survivor's Robe | Murk Eye | 271 | 31.2s | -5.54 | 17.3% | Risky |
| Tusked Razorback | 34.0 atk / 0.50 aps / 0.00 dot / ×1.00 | Squire | Survivor's Robe | Murk Eye | 346 | 52.0s | -3.33 | 9.83% | Risky |
| Gnarled Greatbear | 24.0 atk / 0.71 aps / 0.00 dot / ×1.28 | Squire | Survivor's Robe | Murk Eye | 519 | 319s | -0.54 | 5.92% | Risky |
| Grave Toadeater | 13.0 atk / 0.38 aps / 16.0 dot / ×1.00 | Squire | Arcane Wrappings | Murk Eye | 290 | 23.6s | -7.85 | 2.16% | Risky |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss |
| --- | --- | --- | --- | --- |
| Arcane Wrappings | 276 | 342 | 230 | 234 |
| Bestial Hide | 261 | 226 | 243 | 247 |
| Fallen Knight Plate | 270 | 245 | 235 | 243 |
| Shaded Bindings | 259 | 224 | 246 | 250 |
| Survivor's Robe | 304 | 224 | 231 | 252 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Fallen Knight Plate, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss |
| --- | --- | --- | --- | --- |
| Granite Barrier | 317 | 287 | 276 | 285 |
| Heartroot Amulet | 277 | 251 | 242 | 250 |
| Murk Eye | 347 | 315 | 302 | 312 |
| Plains Stone | 273 | 247 | 238 | 245 |
| Pulse Stone | 299 | 250 | 297 | 276 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire | Survivor's Robe/Murk Eye | 456 | 315 | 10.00 | 5.17 | 35.8s | 8.09% |
| Striker | Survivor's Robe/Murk Eye | 383 | 250 | 11.4 | 5.58 | 26.8s | 10.8% |
| Spirit | Survivor's Robe/Murk Eye | 312 | 201 | 12.4 | 2.32 | 17.7s | 13.9% |
| Apprentice | Survivor's Robe/Murk Eye | 304 | 243 | 11.2 | 2.52 | 17.2s | 12.1% |
| Slinger | Survivor's Robe/Murk Eye | 300 | 239 | 10.8 | 2.40 | 16.9s | 13.4% |
| Conduit | Survivor's Robe/Murk Eye | 265 | 211 | 12.4 | 2.43 | 14.5s | 13.2% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit | Survivor's Robe/Murk Eye | 265 | 211 | 12.4 | 2.43 | 14.5s | 13.2% |
| Slinger | Survivor's Robe/Murk Eye | 300 | 239 | 10.8 | 2.40 | 16.9s | 13.4% |
| Apprentice | Survivor's Robe/Murk Eye | 304 | 243 | 11.2 | 2.52 | 17.2s | 12.1% |
| Spirit | Survivor's Robe/Murk Eye | 312 | 201 | 12.4 | 2.32 | 17.7s | 13.9% |
| Striker | Survivor's Robe/Murk Eye | 383 | 250 | 11.4 | 5.58 | 26.8s | 10.8% |
| Squire | Survivor's Robe/Murk Eye | 456 | 315 | 10.00 | 5.17 | 35.8s | 8.09% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| dominant charm | Murk Eye | best survival in every matchup profile |
| boss TTL < threshold | Conduit · Bestial Hide/Murk Eye | 14.3s |
| boss TTL < threshold | Apprentice · Bestial Hide/Murk Eye | 15.7s |
| boss TTL < threshold | Spirit · Bestial Hide/Murk Eye | 17.5s |
| boss TTL < threshold | Slinger · Shaded Bindings/Murk Eye | 19.9s |

