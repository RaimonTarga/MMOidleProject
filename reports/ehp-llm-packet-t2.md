# MMO Idle LLM Survivability Packet - T2

Generated from `tools/ehp-report.ts --llm-packet`. Progression-focused companion to the DPS packet.

## Assumptions / Omissions

- Player model: weapon, armour, charm and mobility only, plus skill nodes, item upgrades and class affinities. NO core, relic, rune, rite, stance or ability is equipped — the bench bots carry all six, so these numbers are comparable to each other but NOT to bench output in absolute terms.

- Class unlock tier 1. Views model progression moments, not just same-tier +3 gear.
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
| Prev-tier +3 vs current mobs | T1 +3 | 28.1 atk / 0.48 aps / 2.70 dot / ×1.00 | 252 | -7.24 | 15.4s | 0.00% | 0 |
| Current +0 vs current mobs (entry) | T2 +0 | 28.1 atk / 0.48 aps / 2.70 dot / ×1.00 | 300 | -5.00 | 21.0s | 0.00% | 0 |
| Current +3 vs current mobs (geared) | T2 +3 | 28.1 atk / 0.48 aps / 2.70 dot / ×1.00 | 387 | -1.72 | 39.6s | 33.3% | 0 |
| Current +3 vs boss/elite | T2 +3 | 56.0 atk / 0.29 aps / 0.00 dot / ×1.00 | 396 | -1.49 | 38.8s | 33.3% | 0 |
| Current +3 vs next-tier mobs | T2 +3 | 41.0 atk / 0.44 aps / 6.65 dot / ×1.00 | 369 | -7.59 | 17.8s | 0.00% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite | Current +3 vs next-tier mobs |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 247 | 305 | 391 | 376 | 384 |
| Conduit | 208 | 241 | 314 | 311 | 306 |
| Slinger | 257 | 321 | 413 | 441 | 386 |
| Spirit | 197 | 229 | 297 | 294 | 289 |
| Squire | 335 | 392 | 503 | 539 | 468 |
| Striker | 270 | 312 | 401 | 416 | 382 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bog Wrappings | +0 | 58.0 | 0.00 | 8.00% | 0.00 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.15 | 286 | 20.6s | -10.4 | DoT-heavy | hardest |
| Bog Wrappings | +5 | 87.0 | 0.00 | 8.00% | 0.00 | defense.dot-resistance=0.40, defense.hit-to-dot-pct=0.15 | 353 | 26.3s | -9.77 | DoT-heavy | hardest |
| Dire Bestial Hide | +0 | 55.0 | 0.00 | 18.0% | 0.00 | - | 273 | 19.6s | -10.6 | boss | DoT-heavy |
| Dire Bestial Hide | +5 | 83.0 | 0.00 | 22.0% | 0.00 | - | 335 | 24.9s | -10.0 | boss | DoT-heavy |
| Duneplate of the Last Stand | +0 | 55.0 | 3.00 | 8.00% | 0.00 | defense.engagement-dr-ms=6000, defense.engagement-dr-pct=0.30 | 278 | 20.1s | -10.5 | avg mob | DoT-heavy |
| Duneplate of the Last Stand | +5 | 83.0 | 8.00 | 8.00% | 0.00 | defense.engagement-dr-ms=6000, defense.engagement-dr-pct=0.35 | 401 | 31.3s | -8.32 | avg mob | DoT-heavy |
| Enduring Robe | +0 | 50.0 | 5.00 | 8.00% | 0.00 | - | 289 | 21.0s | -9.70 | avg mob | DoT-heavy |
| Enduring Robe | +5 | 75.0 | 8.00 | 8.00% | 0.00 | - | 384 | 29.7s | -8.36 | avg mob | DoT-heavy |
| Iron Crusader Plate | +0 | 66.0 | 1.00 | 8.00% | 0.00 | guard.potency-pct=0.20 | 277 | 20.0s | -11.3 | boss | DoT-heavy |
| Iron Crusader Plate | +5 | 99.0 | 2.00 | 8.00% | 0.00 | guard.potency-pct=0.30 | 344 | 25.7s | -10.7 | avg mob | DoT-heavy |
| Phantom Bindings | +0 | 52.0 | 0.00 | 4.00% | 0.34 | defense.evade-mitigation=0.10 | 284 | 20.5s | -10.00 | boss | DoT-heavy |
| Phantom Bindings | +5 | 78.0 | 0.00 | 4.00% | 0.42 | defense.evade-mitigation=0.10 | 348 | 25.9s | -9.40 | boss | DoT-heavy |
| Verdant Weave | +0 | 52.0 | 0.00 | 4.00% | 0.28 | defense.dot-resistance=0.15, defense.evade-mitigation=0.20 | 297 | 21.5s | -9.55 | boss | DoT-heavy |
| Verdant Weave | +5 | 112 | 0.00 | 4.00% | 0.36 | defense.dot-resistance=0.25, defense.evade-mitigation=0.20 | 451 | 35.6s | -8.41 | boss | DoT-heavy |

## Charm Comparison

_Reference armor Iron Crusader Plate +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | recovery | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ancient Heartroot Amulet | +0 | 5.00 | defense.recovery-skill-potency=0.18 | 1.31 | -67.1 | 21.7s | boss | DoT-heavy |
| Ancient Heartroot Amulet | +5 | 8.00 | defense.recovery-skill-potency=0.23 | 1.88 | 0.00 | 32.0s | avg mob | DoT-heavy |
| Bog Eye | +0 | 4.00 | defense.recovery-pulse-duration-ms=4000, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.32, guard.cleanse-pulse=1.00 | 5.80 | -67.1 | 61.9s | boss | DoT-heavy |
| Bog Eye | +5 | 6.00 | defense.recovery-pulse-duration-ms=4000, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.42, guard.cleanse-pulse=1.00 | 10.0 | 0.00 | 59.3s | avg mob | DoT-heavy |
| Canopy Heart | +0 | 5.00 | defense.recovery-ramp-max-pct=0.10, defense.recovery-ramp-ramptime-ms=10000, defense.recovery-ramp-start-pct=0.04, guard.recovery-ramp-advance-ms=3000 | 3.45 | -67.1 | 29.6s | boss | DoT-heavy |
| Canopy Heart | +5 | 7.50 | defense.recovery-ramp-max-pct=0.20, defense.recovery-ramp-ramptime-ms=10000, defense.recovery-ramp-start-pct=0.04, guard.recovery-ramp-advance-ms=3000 | 6.97 | 0.00 | 2510s | avg mob | DoT-heavy |
| Iron Bulwark | +0 | 2.00 | defense.barrier-pct=0.20, guard.barrier-refill-pct=0.15 | 1.04 | -67.1 | 24.6s | boss | DoT-heavy |
| Iron Bulwark | +5 | 3.00 | defense.barrier-pct=0.26, guard.barrier-refill-pct=0.15 | 1.36 | 0.00 | 34.4s | avg mob | DoT-heavy |
| Mirage Talisman | +0 | 5.00 | cleanse.cooldown-reduction-pct=0.15 | 1.31 | -67.1 | 21.7s | boss | DoT-heavy |
| Mirage Talisman | +5 | 7.50 | cleanse.cooldown-reduction-pct=0.20 | 1.83 | 0.00 | 31.4s | avg mob | DoT-heavy |
| Resonant Gem | +0 | 4.00 | defense.absorb-guard-bonus-pct=0.08, defense.absorb-pct=0.14 | 2.55 | -67.1 | 24.6s | hardest | DoT-heavy |
| Resonant Gem | +5 | 6.00 | defense.absorb-guard-bonus-pct=0.08, defense.absorb-pct=0.19 | 3.40 | 0.00 | 38.3s | hardest | DoT-heavy |
| Stalwart Heart | +0 | 2.00 | defense.recovery-on-kill-ms=4000, defense.recovery-on-kill-pct=0.32 (on-kill Recovery undercounted) | 1.04 | -67.1 | 20.6s | boss | DoT-heavy |
| Stalwart Heart | +5 | 3.00 | defense.recovery-on-kill-ms=4000, defense.recovery-on-kill-pct=0.42 (on-kill Recovery undercounted) | 1.36 | 0.00 | 27.5s | avg mob | DoT-heavy |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-1 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Forest | 18.5 atk / 0.80 aps / 0.00 dot / ×1.00 | Squire / Bulwark · Duneplate of the Last Stand/Bog Eye | 966 | 4.00 | 11.4 | 7.35 | sustains | 1.92% | Safe |
| Mountain | 40.0 atk / 0.33 aps / 0.00 dot / ×1.00 | Squire / Bulwark · Verdant Weave/Bog Eye | 594 | 6.35 | 12.4 | 6.09 | sustains | 8.74% | Safe |
| Plains | 15.0 atk / 0.51 aps / 0.00 dot / ×1.00 | Squire / Bulwark · Duneplate of the Last Stand/Bog Eye | 1305 | 1.54 | 11.4 | 9.82 | sustains | 1.15% | Safe |
| Swamp | 11.5 atk / 0.48 aps / 13.5 dot / ×1.00 | Squire / Bulwark · Bog Wrappings/Bog Eye | 445 | 11.3 | 11.6 | 0.23 | sustains | 2.26% | Safe |
| Caverns | 55.5 atk / 0.48 aps / 0.00 dot / ×1.00 | Squire / Bulwark · Verdant Weave/Bog Eye | 589 | 12.8 | 12.4 | -0.40 | 717s | 12.2% | Risky |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Crag Behemoth | Obsidian Broodmother | Tusked Razorback | Gnarled Greatbear | Grave Toadeater |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 94.6s | 183s | 369s | sustains | 2755s |
| Conduit | 50.8s | 71.4s | 124s | sustains | 88.2s |
| Slinger | 142s | 444s | sustains | sustains | 106s |
| Spirit | 57.7s | 78.7s | 125s | sustains | 94.9s |
| Squire | sustains | sustains | sustains | sustains | sustains |
| Striker | sustains | sustains | sustains | sustains | sustains |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crag Behemoth | 56.0 atk / 0.29 aps / 0.00 dot / ×1.00 | Squire / Bulwark | Verdant Weave | Bog Eye | 577 | sustains | 4.52 | 12.6% | Safe |
| Obsidian Broodmother | 40.0 atk / 0.36 aps / 0.00 dot / ×1.00 | Squire / Bulwark | Verdant Weave | Bog Eye | 594 | sustains | 5.56 | 8.74% | Safe |
| Tusked Razorback | 26.0 atk / 0.50 aps / 0.00 dot / ×1.00 | Squire / Bulwark | Duneplate of the Last Stand | Bog Eye | 679 | sustains | 6.35 | 3.83% | Safe |
| Gnarled Greatbear | 18.0 atk / 0.53 aps / 0.00 dot / ×1.00 | Squire / Bulwark | Enduring Robe | Bog Eye | 1130 | sustains | 8.81 | 1.59% | Safe |
| Grave Toadeater | 13.0 atk / 0.38 aps / 8.00 dot / ×1.00 | Squire / Bulwark | Bog Wrappings | Bog Eye | 451 | sustains | 3.90 | 2.63% | Safe |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Bog Wrappings | 390 | 450 | 364 | 367 | 389 |
| Dire Bestial Hide | 372 | 291 | 388 | 394 | 347 |
| Duneplate of the Last Stand | 445 | 333 | 373 | 400 | 367 |
| Enduring Robe | 426 | 318 | 357 | 383 | 351 |
| Iron Crusader Plate | 381 | 322 | 370 | 379 | 352 |
| Phantom Bindings | 385 | 286 | 415 | 419 | 357 |
| Verdant Weave | 499 | 439 | 503 | 508 | 478 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Iron Crusader Plate, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Ancient Heartroot Amulet | 400 | 336 | 389 | 399 | 369 |
| Bog Eye | 571 | 481 | 555 | 568 | 527 |
| Canopy Heart | 507 | 427 | 493 | 505 | 468 |
| Iron Bulwark | 478 | 403 | 464 | 475 | 441 |
| Mirage Talisman | 399 | 335 | 388 | 397 | 368 |
| Resonant Gem | 431 | 341 | 466 | 439 | 412 |
| Stalwart Heart | 388 | 327 | 377 | 386 | 359 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire / Bulwark | Verdant Weave/Bog Eye | 908 | 550 | 8.40 | 12.4 | sustains | 5.94% |
| Squire / Knight | Verdant Weave/Bog Eye | 812 | 492 | 8.77 | 11.6 | sustains | 6.74% |
| Squire / Warrior | Verdant Weave/Bog Eye | 773 | 468 | 8.77 | 11.0 | sustains | 7.09% |
| Striker / Breaker | Verdant Weave/Bog Eye | 761 | 435 | 9.51 | 12.8 | sustains | 7.81% |
| Striker / Skirmisher | Verdant Weave/Bog Eye | 690 | 394 | 9.87 | 12.0 | sustains | 8.71% |
| Striker / Flurry | Verdant Weave/Bog Eye | 655 | 374 | 9.87 | 11.4 | sustains | 9.17% |
| Slinger / Artillerist | Verdant Weave/Bog Eye | 606 | 425 | 8.63 | 6.47 | 105s | 11.0% |
| Apprentice / Rime-Bound | Verdant Weave/Bog Eye | 606 | 424 | 9.28 | 6.95 | 105s | 9.02% |
| Slinger / Marksman | Verdant Weave/Bog Eye | 588 | 412 | 8.47 | 6.16 | 93.4s | 11.6% |
| Slinger / Scout | Verdant Weave/Bog Eye | 576 | 404 | 8.36 | 5.96 | 87.0s | 12.0% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit / Splinter | Verdant Weave/Bog Eye | 429 | 300 | 11.3 | 6.01 | 39.6s | 11.8% |
| Conduit / Consort | Verdant Weave/Bog Eye | 443 | 310 | 11.3 | 6.21 | 42.5s | 11.5% |
| Conduit / Effigy | Verdant Weave/Bog Eye | 473 | 331 | 11.3 | 6.64 | 49.5s | 10.7% |
| Spirit / Spark | Verdant Weave/Bog Eye | 489 | 283 | 11.3 | 5.67 | 45.6s | 12.6% |
| Spirit / Wraith | Verdant Weave/Bog Eye | 509 | 294 | 11.3 | 5.90 | 49.4s | 12.1% |
| Apprentice / Venom vessel | Verdant Weave/Bog Eye | 522 | 366 | 9.63 | 6.21 | 63.8s | 10.6% |
| Spirit / Phantasm | Verdant Weave/Bog Eye | 541 | 313 | 11.3 | 6.27 | 56.3s | 11.4% |
| Apprentice / Ember mage | Verdant Weave/Bog Eye | 548 | 384 | 9.63 | 6.53 | 73.8s | 10.0% |
| Slinger / Scout | Verdant Weave/Bog Eye | 576 | 404 | 8.36 | 5.96 | 87.0s | 12.0% |
| Slinger / Marksman | Verdant Weave/Bog Eye | 588 | 412 | 8.47 | 6.16 | 93.4s | 11.6% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| charm > +25% tier avg | Bog Eye | survival 571 vs avg 453 |
| dominant charm | Bog Eye | best survival in every matchup profile |

