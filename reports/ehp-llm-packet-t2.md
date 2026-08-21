# MMO Idle LLM Survivability Packet - T2

Generated from `tools/ehp-report.ts --llm-packet`. Progression-focused companion to the DPS packet.

## Assumptions / Omissions

- Class unlock tier 1. Views model progression moments, not just same-tier +3 gear.
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
| Prev-tier +3 vs current mobs | T1 +3 | 40.3 atk / 0.48 aps / 3.30 dot / ×1.00 | 335 | -7.27 | 12.8s | 0.00% | 0 |
| Current +0 vs current mobs (entry) | T2 +0 | 40.3 atk / 0.48 aps / 3.30 dot / ×1.00 | 300 | -8.28 | 11.8s | 0.00% | 0 |
| Current +3 vs current mobs (geared) | T2 +3 | 40.3 atk / 0.48 aps / 3.30 dot / ×1.00 | 766 | -0.11 | 35.3s | 50.0% | 0 |
| Current +3 vs boss/elite | T2 +3 | 56.0 atk / 0.29 aps / 0.00 dot / ×1.60 | 576 | 0.01 | 42.2s | 50.0% | 0 |
| Current +3 vs next-tier mobs | T2 +3 | 32.7 atk / 0.45 aps / 5.38 dot / ×1.02 | 623 | -0.02 | 50.5s | 50.0% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite | Current +3 vs next-tier mobs |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 345 | 297 | 832 | 494 | 721 |
| Conduit | 270 | 247 | 537 | 393 | 549 |
| Slinger | 308 | 294 | 570 | 495 | 533 |
| Spirit | 256 | 233 | 508 | 372 | 519 |
| Squire | 482 | 419 | 1215 | 1103 | 789 |
| Striker | 352 | 313 | 935 | 600 | 629 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bog Wrappings | +0 | 44.0 | 6.00 | 0.00% | 0.00 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.08 | 257 | 12.7s | -14.2 | DoT-heavy | hardest |
| Bog Wrappings | +5 | 104 | 16.0 | 0.00% | 0.00 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.08 | 553 | 34.1s | -8.38 | next-tier | hardest |
| Dire Bestial Hide | +0 | 46.0 | 5.00 | 12.0% | 0.00 | - | 257 | 12.7s | -14.3 | avg mob | DoT-heavy |
| Dire Bestial Hide | +5 | 96.0 | 15.0 | 22.0% | 0.00 | - | 539 | 33.0s | -8.20 | avg mob | DoT-heavy |
| Duneplate of the Last Stand | +0 | 44.0 | 10.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=1.00 | 269 | 26.9s | -13.5 | next-tier | hardest |
| Duneplate of the Last Stand | +5 | 104 | 25.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=1.00 | 894 | 220s | -4.86 | avg mob | DoT-heavy |
| Enduring Robe | +0 | 24.0 | 16.0 | 0.00% | 0.00 | - | 299 | 15.3s | -10.5 | next-tier | DoT-heavy |
| Enduring Robe | +5 | 54.0 | 36.0 | 0.00% | 0.00 | - | 1149 | 93.7s | -2.10 | boss | DoT-heavy |
| Iron Crusader Plate | +0 | 29.0 | 12.0 | 5.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25 | 271 | 13.6s | -12.0 | hardest | DoT-heavy |
| Iron Crusader Plate | +5 | 69.0 | 27.0 | 5.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25 | 850 | 89.0s | -4.37 | avg mob | DoT-heavy |
| Phantom Bindings | +0 | 43.0 | 6.00 | 0.00% | 0.28 | - | 267 | 13.2s | -13.5 | boss | DoT-heavy |
| Phantom Bindings | +5 | 103 | 16.0 | 0.00% | 0.58 | - | 613 | 40.4s | -7.23 | avg mob | DoT-heavy |
| Verdant Weave | +0 | 44.0 | 6.00 | 0.00% | 0.15 | - | 252 | 12.5s | -14.4 | avg mob | DoT-heavy |
| Verdant Weave | +5 | 104 | 16.0 | 0.00% | 0.35 | - | 568 | 35.4s | -8.02 | avg mob | DoT-heavy |

## Charm Comparison

_Reference armor Dire Bestial Hide +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | hpRegen | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ancient Heartroot Amulet | +0 | 10.0 | - | 1.93 | -282 | 13.2s | boss | DoT-heavy |
| Ancient Heartroot Amulet | +5 | 25.0 | - | 3.28 | 0.00 | 95.7s | avg mob | DoT-heavy |
| Bog Eye | +0 | 6.00 | defense.absorb-pct=0.09 | 2.93 | -282 | 14.2s | hardest | DoT-heavy |
| Bog Eye | +5 | 6.00 | defense.absorb-pct=0.19 | 3.75 | 0.00 | 47.2s | avg mob | DoT-heavy |
| Canopy Heart | +0 | 6.00 | defense.ramp-regen-max-pct=0.10, defense.ramp-regen-ramptime-ms=10000, defense.ramp-regen-start-pct=0.04 | 3.80 | -282 | 15.4s | boss | DoT-heavy |
| Canopy Heart | +5 | 6.00 | defense.ramp-regen-max-pct=0.20, defense.ramp-regen-ramptime-ms=10000, defense.ramp-regen-start-pct=0.04 | 7.03 | 0.00 | 176s | avg mob | DoT-heavy |
| Iron Bulwark | +0 | 6.00 | defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.12 | 3.90 | -282 | 15.6s | boss | DoT-heavy |
| Iron Bulwark | +5 | 6.00 | defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.22 | 7.99 | 0.00 | 151s | avg mob | DoT-heavy |
| Mirage Talisman | +0 | 6.00 | defense.cleanse-empty-heal-pct=0.03, defense.cleanse-interval-ms=6000, defense.cleanse-stacks=1.00 | 2.68 | -282 | 14.0s | boss | DoT-heavy |
| Mirage Talisman | +5 | 6.00 | defense.cleanse-empty-heal-pct=0.08, defense.cleanse-interval-ms=6000, defense.cleanse-stacks=1.00 | 5.61 | 0.00 | 103s | avg mob | DoT-heavy |
| Resonant Gem | +0 | 6.00 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.06 | 3.58 | -282 | 15.1s | boss | DoT-heavy |
| Resonant Gem | +5 | 6.00 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.16 | 8.83 | 0.00 | 250s | avg mob | DoT-heavy |
| Stalwart Heart | +0 | 7.00 | defense.kill-burst-pct=0.09 (kill-burst undercounted) | 1.82 | -282 | 13.1s | boss | DoT-heavy |
| Stalwart Heart | +5 | 7.00 | defense.kill-burst-pct=0.14 (kill-burst undercounted) | 2.44 | 0.00 | 37.4s | avg mob | DoT-heavy |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-1 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Forest | 18.5 atk / 0.80 aps / 0.00 dot / ×1.00 | Squire / Bulwark · Phantom Bindings/Iron Bulwark | 6535 | 0.62 | 10.5 | 9.86 | sustains | 0.37% | Safe |
| Mountain | 82.0 atk / 0.33 aps / 0.00 dot / ×1.00 | Squire / Bulwark · Enduring Robe/Iron Bulwark | 537 | 10.9 | 8.32 | -2.56 | 84.3s | 15.3% | Risky |
| Plains | 15.0 atk / 0.51 aps / 0.00 dot / ×1.00 | Squire / Bulwark · Phantom Bindings/Iron Bulwark | 5299 | 0.39 | 10.5 | 10.1 | sustains | 0.37% | Safe |
| Swamp | 11.5 atk / 0.48 aps / 16.5 dot / ×1.00 | Squire / Bulwark · Bog Wrappings/Iron Bulwark | 501 | 12.0 | 10.5 | -1.47 | 187s | 0.36% | Risky |
| Caverns | 74.5 atk / 0.48 aps / 0.00 dot / ×1.00 | Squire / Bulwark · Enduring Robe/Iron Bulwark | 619 | 12.4 | 8.32 | -4.06 | 53.1s | 12.0% | Risky |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Crag Behemoth | Obsidian Broodmother | Tusked Razorback | Gnarled Greatbear | Grave Toadeater |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 305s | sustains | sustains | sustains | 68.7s |
| Conduit | 75.7s | 258s | sustains | sustains | 34.0s |
| Slinger | 131s | sustains | sustains | sustains | 33.0s |
| Spirit | sustains | sustains | sustains | sustains | 206s |
| Squire | sustains | sustains | sustains | sustains | 267s |
| Striker | sustains | sustains | sustains | sustains | 87.6s |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crag Behemoth | 56.0 atk / 0.29 aps / 0.00 dot / ×1.60 | Squire / Bulwark | Enduring Robe | Iron Bulwark | 1512 | sustains | 6.03 | 18.5% | Safe |
| Obsidian Broodmother | 47.0 atk / 0.36 aps / 0.00 dot / ×1.60 | Squire / Bulwark | Enduring Robe | Iron Bulwark | 10152 | sustains | 7.96 | 12.0% | Safe |
| Tusked Razorback | 34.0 atk / 0.50 aps / 0.00 dot / ×1.10 | Squire / Bulwark | Duneplate of the Last Stand | Iron Bulwark | 9316 | sustains | 10.0 | 1.46% | Safe |
| Gnarled Greatbear | 24.0 atk / 0.71 aps / 0.00 dot / ×1.28 | Squire / Bulwark | Duneplate of the Last Stand | Iron Bulwark | 6576 | sustains | 9.83 | 0.36% | Safe |
| Grave Toadeater | 13.0 atk / 0.38 aps / 16.0 dot / ×1.60 | Squire / Bulwark | Bog Wrappings | Iron Bulwark | 497 | 267s | -1.03 | 0.36% | Risky |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Bog Wrappings | 623 | 524 | 390 | 505 | 708 |
| Dire Bestial Hide | 608 | 350 | 455 | 590 | 593 |
| Duneplate of the Last Stand | 1010 | 364 | 421 | 735 | 902 |
| Enduring Robe | 1295 | 275 | 381 | 2650 | 761 |
| Iron Crusader Plate | 961 | 302 | 429 | 727 | 798 |
| Phantom Bindings | 691 | 365 | 524 | 678 | 660 |
| Verdant Weave | 640 | 366 | 466 | 603 | 632 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Dire Bestial Hide, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Ancient Heartroot Amulet | 654 | 372 | 486 | 634 | 636 |
| Bog Eye | 663 | 357 | 583 | 646 | 628 |
| Canopy Heart | 774 | 445 | 579 | 751 | 754 |
| Iron Bulwark | 811 | 464 | 606 | 787 | 789 |
| Mirage Talisman | 727 | 418 | 544 | 705 | 708 |
| Resonant Gem | 835 | 480 | 624 | 810 | 813 |
| Stalwart Heart | 621 | 356 | 464 | 602 | 605 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire / Bulwark | Enduring Robe/Iron Bulwark | 2036 | 1291 | 3.78 | 8.32 | sustains | 0.46% |
| Squire / Knight | Enduring Robe/Iron Bulwark | 1904 | 1207 | 3.78 | 7.78 | sustains | 0.50% |
| Squire / Warrior | Enduring Robe/Iron Bulwark | 1810 | 1148 | 3.78 | 7.39 | sustains | 0.52% |
| Striker / Breaker | Enduring Robe/Iron Bulwark | 1773 | 1153 | 3.78 | 6.92 | sustains | 0.52% |
| Apprentice / Rime-Bound | Enduring Robe/Iron Bulwark | 1533 | 1146 | 3.65 | 4.16 | sustains | 1.08% |
| Striker / Skirmisher | Enduring Robe/Iron Bulwark | 1484 | 965 | 4.26 | 6.52 | sustains | 1.10% |
| Spirit / Phantasm | Enduring Robe/Resonant Gem | 1063 | 607 | 6.17 | 8.30 | sustains | 3.61% |
| Striker / Flurry | Enduring Robe/Iron Bulwark | 1055 | 686 | 5.69 | 6.20 | sustains | 2.89% |
| Apprentice / Ember mage | Enduring Robe/Iron Bulwark | 1034 | 773 | 5.06 | 3.89 | 149s | 2.89% |
| Slinger / Artillerist | Enduring Robe/Iron Bulwark | 916 | 685 | 5.67 | 3.87 | 95.6s | 3.49% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit / Splinter | Enduring Robe/Iron Bulwark | 594 | 444 | 8.08 | 3.58 | 35.3s | 6.29% |
| Slinger / Scout | Enduring Robe/Iron Bulwark | 680 | 509 | 7.01 | 3.55 | 45.7s | 6.33% |
| Slinger / Marksman | Enduring Robe/Iron Bulwark | 692 | 517 | 7.11 | 3.67 | 47.3s | 6.13% |
| Conduit / Consort | Enduring Robe/Iron Bulwark | 699 | 523 | 7.13 | 3.71 | 48.3s | 4.85% |
| Spirit / Spark | Enduring Robe/Resonant Gem | 738 | 422 | 8.08 | 7.55 | 282s | 6.62% |
| Apprentice / Venom vessel | Enduring Robe/Iron Bulwark | 771 | 576 | 6.46 | 3.71 | 59.9s | 4.85% |
| Conduit / Effigy | Enduring Robe/Iron Bulwark | 861 | 644 | 6.17 | 3.96 | 79.6s | 3.41% |
| Spirit / Wraith | Enduring Robe/Resonant Gem | 865 | 494 | 7.13 | 7.80 | sustains | 5.13% |
| Slinger / Artillerist | Enduring Robe/Iron Bulwark | 916 | 685 | 5.67 | 3.87 | 95.6s | 3.49% |
| Apprentice / Ember mage | Enduring Robe/Iron Bulwark | 1034 | 773 | 5.06 | 3.89 | 149s | 2.89% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| armor < -25% tier avg | Bog Wrappings | survival 623 vs avg 833 |
| armor < -25% tier avg | Dire Bestial Hide | survival 608 vs avg 833 |
| armor > +25% tier avg | Enduring Robe | survival 1295 vs avg 833 |
| dominant charm | Resonant Gem | best survival in every matchup profile |

