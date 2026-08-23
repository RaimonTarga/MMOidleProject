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
- **Ramping mitigations ARE modelled**, as duty-cycle averages over the 60s window, never at their printed maximum: hardening (ramp + big-hit reset, assumed spike cadence 12s when only a spike trips it), reactive plating (stack ramp against the attacker's own cadence), stationary DR (scaled by an assumed 50% stationary duty cycle — override with `--stationary-fraction`), and sustained-fight DR. Each is printed in the affected row's notes. The assumed duty cycles are the two judgement calls in this report; treat Tundra and Volcanic rows accordingly.
- **Not** modelled: core DR layer, wards, barrier recharge, barrier-break heals, on-kill Recovery.
- **Multi-enemy pressure** is not modeled; a single attacker profile is assumed (idle pulls are often several mobs).

## Progression Checkpoints

| Checkpoint | Gear | Attacker | Avg eHP | Avg net/s | Min TTL | Safe % | Blocked |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prev-tier +3 vs current mobs | T1 +3 | 31.1 atk / 0.48 aps / 3.30 dot / ×1.00 | 278 | -7.20 | 15.1s | 0.00% | 0 |
| Current +0 vs current mobs (entry) | T2 +0 | 31.1 atk / 0.48 aps / 3.30 dot / ×1.00 | 350 | -4.35 | 21.7s | 5.56% | 0 |
| Current +3 vs current mobs (geared) | T2 +3 | 31.1 atk / 0.48 aps / 3.30 dot / ×1.00 | 708 | 1.64 | 166s | 50.0% | 0 |
| Current +3 vs boss/elite | T2 +3 | 56.0 atk / 0.29 aps / 0.00 dot / ×1.00 | 436 | -0.59 | 95.2s | 33.3% | 0 |
| Current +3 vs next-tier mobs | T2 +3 | 58.9 atk / 0.44 aps / 6.65 dot / ×1.02 | 355 | -12.8 | 15.2s | 0.00% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite | Current +3 vs next-tier mobs |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 278 | 358 | 746 | 414 | 361 |
| Conduit | 235 | 292 | 521 | 353 | 302 |
| Slinger | 268 | 329 | 567 | 451 | 360 |
| Spirit | 223 | 276 | 493 | 338 | 288 |
| Squire | 372 | 483 | 1161 | 611 | 456 |
| Striker | 290 | 365 | 759 | 450 | 365 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bog Wrappings | +0 | 54.0 | 7.00 | 0.00% | 0.00 | defense.dot-resistance=0.34, defense.hit-to-dot-pct=0.08 | 316 | 20.0s | -10.2 | DoT-heavy | hardest |
| Bog Wrappings | +5 | 81.0 | 11.0 | 0.00% | 0.00 | defense.dot-resistance=0.42, defense.hit-to-dot-pct=0.08 | 482 | 33.8s | -7.67 | DoT-heavy | hardest |
| Dire Bestial Hide | +0 | 50.0 | 7.00 | 13.0% | 0.00 | - | 302 | 19.1s | -10.4 | avg mob | DoT-heavy |
| Dire Bestial Hide | +5 | 76.0 | 11.0 | 17.0% | 0.00 | - | 447 | 30.7s | -8.06 | avg mob | DoT-heavy |
| Duneplate of the Last Stand | +0 | 44.0 | 10.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=1.00 | 301 | 37.6s | -10.2 | avg mob | DoT-heavy |
| Duneplate of the Last Stand | +5 | 104 | 25.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=1.00 | 1165 | 718s | -2.96 | avg mob | DoT-heavy |
| Enduring Robe | +0 | 43.0 | 13.0 | 0.00% | 0.00 | - | 350 | 22.9s | -8.59 | avg mob | DoT-heavy |
| Enduring Robe | +5 | 65.0 | 19.0 | 0.00% | 0.00 | - | 649 | 59.8s | -5.29 | avg mob | DoT-heavy |
| Iron Crusader Plate | +0 | 58.0 | 9.00 | 0.00% | 0.00 | guard.potency-pct=0.28 | 315 | 20.1s | -10.6 | avg mob | next-tier |
| Iron Crusader Plate | +5 | 86.0 | 14.0 | 0.00% | 0.00 | guard.potency-pct=0.38 | 488 | 35.2s | -7.83 | avg mob | DoT-heavy |
| Phantom Bindings | +0 | 50.0 | 5.00 | 0.00% | 0.24 | - | 277 | 17.3s | -11.4 | avg mob | DoT-heavy |
| Phantom Bindings | +5 | 75.0 | 7.00 | 0.00% | 0.30 | - | 361 | 23.2s | -10.1 | avg mob | DoT-heavy |
| Verdant Weave | +0 | 44.0 | 6.00 | 0.00% | 0.15 | - | 266 | 16.5s | -11.5 | avg mob | DoT-heavy |
| Verdant Weave | +5 | 104 | 16.0 | 0.00% | 0.35 | - | 691 | 62.0s | -5.82 | avg mob | DoT-heavy |

## Charm Comparison

_Reference armor Iron Crusader Plate +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | recovery | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ancient Heartroot Amulet | +0 | 5.00 | defense.recovery-skill-potency=0.18 | 1.24 | -174 | 21.7s | avg mob | next-tier |
| Ancient Heartroot Amulet | +5 | 8.00 | defense.recovery-skill-potency=0.23 | 1.76 | 0.00 | 58.9s | avg mob | DoT-heavy |
| Bog Eye | +0 | 4.00 | defense.recovery-pulse-duration-ms=4000, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.32 | 5.51 | -174 | 59.0s | avg mob | next-tier |
| Bog Eye | +5 | 6.00 | defense.recovery-pulse-duration-ms=4000, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.42 | 9.36 | 0.00 | 132s | avg mob | DoT-heavy |
| Canopy Heart | +0 | 6.00 | defense.recovery-ramp-max-pct=0.10, defense.recovery-ramp-ramptime-ms=10000, defense.recovery-ramp-start-pct=0.04 | 3.50 | -174 | 31.4s | avg mob | next-tier |
| Canopy Heart | +5 | 6.00 | defense.recovery-ramp-max-pct=0.20, defense.recovery-ramp-ramptime-ms=10000, defense.recovery-ramp-start-pct=0.04 | 5.96 | 0.00 | 98.1s | avg mob | DoT-heavy |
| Iron Bulwark | +0 | 2.00 | defense.barrier-pct=0.20 | 0.99 | -174 | 24.7s | avg mob | next-tier |
| Iron Bulwark | +5 | 3.00 | defense.barrier-pct=0.26 | 1.27 | 0.00 | 49.9s | avg mob | DoT-heavy |
| Mirage Talisman | +0 | 6.00 | defense.cleanse-empty-heal-pct=0.03, defense.cleanse-interval-ms=6000, defense.cleanse-stacks=1.00 | 2.30 | -174 | 25.4s | avg mob | next-tier |
| Mirage Talisman | +5 | 6.00 | defense.cleanse-empty-heal-pct=0.08, defense.cleanse-interval-ms=6000, defense.cleanse-stacks=1.00 | 4.61 | 0.00 | 158s | avg mob | DoT-heavy |
| Resonant Gem | +0 | 4.00 | defense.absorb-pct=0.14 | 2.31 | -174 | 24.3s | avg mob | DoT-heavy |
| Resonant Gem | +5 | 6.00 | defense.absorb-pct=0.19 | 2.62 | 0.00 | 64.3s | avg mob | DoT-heavy |
| Stalwart Heart | +0 | 2.00 | defense.recovery-on-kill-ms=4000, defense.recovery-on-kill-pct=0.32 (on-kill Recovery undercounted) | 0.99 | -174 | 20.7s | avg mob | next-tier |
| Stalwart Heart | +5 | 3.00 | defense.recovery-on-kill-ms=4000, defense.recovery-on-kill-pct=0.42 (on-kill Recovery undercounted) | 1.27 | 0.00 | 39.8s | avg mob | DoT-heavy |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-1 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Forest | 18.5 atk / 0.80 aps / 0.00 dot / ×1.00 | Squire / Bulwark · Verdant Weave/Bog Eye | 5860 | 0.69 | 11.9 | 11.2 | sustains | 0.36% | Safe |
| Mountain | 50.0 atk / 0.33 aps / 0.00 dot / ×1.00 | Squire / Bulwark · Duneplate of the Last Stand/Bog Eye | 856 | 5.27 | 11.9 | 6.64 | sustains | 5.84% | Safe |
| Plains | 15.0 atk / 0.51 aps / 0.00 dot / ×1.00 | Squire / Bulwark · Verdant Weave/Bog Eye | 4751 | 0.44 | 11.9 | 11.5 | sustains | 0.36% | Safe |
| Swamp | 11.5 atk / 0.48 aps / 16.5 dot / ×1.00 | Apprentice / Rime-Bound · Bog Wrappings/Bog Eye | 646 | 7.52 | 6.30 | -1.22 | 181s | 0.45% | Risky |
| Caverns | 60.5 atk / 0.48 aps / 0.00 dot / ×1.00 | Squire / Bulwark · Duneplate of the Last Stand/Bog Eye | 638 | 12.4 | 11.9 | -0.46 | 1186s | 9.49% | Risky |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Crag Behemoth | Obsidian Broodmother | Tusked Razorback | Gnarled Greatbear | Grave Toadeater |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 394s | sustains | sustains | sustains | 238s |
| Conduit | 160s | 240s | sustains | sustains | 51.2s |
| Slinger | 197s | 773s | sustains | sustains | 49.1s |
| Spirit | 171s | 221s | sustains | sustains | 58.0s |
| Squire | sustains | sustains | sustains | sustains | sustains |
| Striker | sustains | sustains | sustains | sustains | sustains |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crag Behemoth | 56.0 atk / 0.29 aps / 0.00 dot / ×1.00 | Squire / Bulwark | Duneplate of the Last Stand | Bog Eye | 731 | sustains | 5.92 | 7.66% | Safe |
| Obsidian Broodmother | 47.0 atk / 0.36 aps / 0.00 dot / ×1.00 | Squire / Bulwark | Duneplate of the Last Stand | Bog Eye | 991 | sustains | 7.28 | 4.74% | Safe |
| Tusked Razorback | 34.0 atk / 0.50 aps / 0.00 dot / ×1.00 | Squire / Bulwark | Duneplate of the Last Stand | Bog Eye | 9316 | sustains | 11.4 | 0.36% | Safe |
| Gnarled Greatbear | 24.0 atk / 0.71 aps / 0.00 dot / ×1.28 | Squire / Bulwark | Duneplate of the Last Stand | Bog Eye | 6576 | sustains | 11.2 | 0.47% | Safe |
| Grave Toadeater | 13.0 atk / 0.38 aps / 16.0 dot / ×1.00 | Apprentice / Rime-Bound | Bog Wrappings | Bog Eye | 642 | 238s | -0.93 | 0.45% | Risky |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Bog Wrappings | 534 | 554 | 336 | 381 | 386 |
| Dire Bestial Hide | 496 | 308 | 374 | 429 | 367 |
| Duneplate of the Last Stand | 1290 | 357 | 461 | 724 | 521 |
| Enduring Robe | 721 | 289 | 336 | 439 | 358 |
| Iron Crusader Plate | 542 | 326 | 345 | 410 | 360 |
| Phantom Bindings | 399 | 308 | 353 | 376 | 335 |
| Verdant Weave | 767 | 359 | 478 | 592 | 475 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Iron Crusader Plate, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Ancient Heartroot Amulet | 570 | 341 | 362 | 430 | 377 |
| Bog Eye | 812 | 488 | 517 | 613 | 539 |
| Canopy Heart | 703 | 422 | 447 | 531 | 467 |
| Iron Bulwark | 679 | 408 | 432 | 513 | 451 |
| Mirage Talisman | 660 | 396 | 420 | 498 | 438 |
| Resonant Gem | 595 | 339 | 449 | 470 | 440 |
| Stalwart Heart | 552 | 331 | 351 | 417 | 367 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire / Bulwark | Duneplate of the Last Stand/Bog Eye | 2179 | 1318 | 3.78 | 11.9 | sustains | 0.36% |
| Squire / Knight | Duneplate of the Last Stand/Bog Eye | 2035 | 1232 | 3.78 | 11.1 | sustains | 0.39% |
| Striker / Breaker | Duneplate of the Last Stand/Bog Eye | 1646 | 941 | 4.74 | 12.3 | sustains | 1.22% |
| Squire / Warrior | Duneplate of the Last Stand/Bog Eye | 1542 | 933 | 4.74 | 10.6 | sustains | 1.23% |
| Apprentice / Rime-Bound | Duneplate of the Last Stand/Bog Eye | 1324 | 928 | 4.59 | 6.67 | sustains | 1.71% |
| Striker / Skirmisher | Duneplate of the Last Stand/Bog Eye | 1286 | 735 | 5.69 | 11.5 | sustains | 2.17% |
| Striker / Flurry | Duneplate of the Last Stand/Bog Eye | 1053 | 602 | 6.65 | 11.0 | sustains | 3.18% |
| Apprentice / Ember mage | Duneplate of the Last Stand/Bog Eye | 1033 | 724 | 5.53 | 6.27 | sustains | 2.73% |
| Spirit / Phantasm | Duneplate of the Last Stand/Bog Eye | 997 | 577 | 6.65 | 6.01 | 763s | 3.32% |
| Slinger / Artillerist | Duneplate of the Last Stand/Bog Eye | 933 | 654 | 6.06 | 6.21 | sustains | 3.21% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit / Splinter | Duneplate of the Last Stand/Bog Eye | 648 | 454 | 8.08 | 5.76 | 174s | 4.95% |
| Conduit / Consort | Duneplate of the Last Stand/Bog Eye | 713 | 500 | 7.61 | 5.96 | 253s | 4.31% |
| Slinger / Scout | Duneplate of the Last Stand/Bog Eye | 740 | 518 | 7.01 | 5.70 | 305s | 5.00% |
| Spirit / Spark | Duneplate of the Last Stand/Bog Eye | 742 | 430 | 8.08 | 5.44 | 166s | 5.24% |
| Slinger / Marksman | Duneplate of the Last Stand/Bog Eye | 755 | 529 | 7.11 | 5.90 | 341s | 4.83% |
| Spirit / Wraith | Duneplate of the Last Stand/Bog Eye | 818 | 473 | 7.61 | 5.64 | 232s | 4.55% |
| Apprentice / Venom vessel | Duneplate of the Last Stand/Bog Eye | 839 | 588 | 6.46 | 5.96 | 822s | 3.83% |
| Conduit / Effigy | Duneplate of the Last Stand/Bog Eye | 870 | 610 | 6.65 | 6.36 | 1518s | 3.14% |
| Slinger / Artillerist | Duneplate of the Last Stand/Bog Eye | 933 | 654 | 6.06 | 6.21 | sustains | 3.21% |
| Spirit / Phantasm | Duneplate of the Last Stand/Bog Eye | 997 | 577 | 6.65 | 6.01 | 763s | 3.32% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| armor < -25% tier avg | Dire Bestial Hide | survival 496 vs avg 678 |
| armor > +25% tier avg | Duneplate of the Last Stand | survival 1290 vs avg 678 |
| armor < -25% tier avg | Phantom Bindings | survival 399 vs avg 678 |
| dominant charm | Bog Eye | best survival in every matchup profile |
| sustains too early | 1 build(s) | already immortal vs avg mobs on entry (+0) gear |

