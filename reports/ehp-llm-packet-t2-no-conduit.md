# MMO Idle LLM Survivability Packet - T2 (No Conduit)

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
| Prev-tier +3 vs current mobs | T1 +3 | 19.6 atk / 0.43 aps / 1.07 dot / ×1.00 | 1233 | 3.05 | sustains | 100% | 0 |
| Current +0 vs current mobs (entry) | T2 +0 | 19.6 atk / 0.43 aps / 1.07 dot / ×1.00 | 1107 | 3.20 | sustains | 100% | 0 |
| Current +3 vs current mobs (geared) | T2 +3 | 19.6 atk / 0.43 aps / 1.07 dot / ×1.00 | 1619 | 6.44 | sustains | 100% | 0 |
| Current +3 vs boss/elite | T2 +3 | 60.0 atk / 0.29 aps / 0.00 dot / ×1.60 | 479 | -0.53 | 50.7s | 33.3% | 0 |
| Current +3 vs next-tier mobs | T2 +3 | 32.9 atk / 0.45 aps / 5.38 dot / ×1.00 | 655 | 0.70 | 68.6s | 66.7% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite | Current +3 vs next-tier mobs |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 1472 | 1352 | 1922 | 495 | 788 |
| Slinger | 1139 | 963 | 1475 | 522 | 588 |
| Spirit | 921 | 842 | 1262 | 348 | 521 |
| Squire | 1467 | 1306 | 1882 | 584 | 734 |
| Striker | 1169 | 1072 | 1556 | 446 | 643 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bog Wrappings | +0 | 44.0 | 6.00 | 0.00% | 0.00 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.08 | 520 | 176s | -1.77 | avg mob | boss |
| Bog Wrappings | +3 | 80.0 | 12.0 | 0.00% | 0.00 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.08 | 1334 | 144s | 0.63 | avg mob | boss |
| Dire Bestial Hide | +0 | 46.0 | 5.00 | 12.0% | 0.00 | - | 461 | 118s | -2.10 | avg mob | boss |
| Dire Bestial Hide | +3 | 76.0 | 11.0 | 18.0% | 0.00 | - | 1035 | 10602s | 0.21 | avg mob | DoT-heavy |
| Duneplate of the Last Stand | +0 | 44.0 | 10.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=1.00 | 760 | 385s | -0.69 | avg mob | boss |
| Duneplate of the Last Stand | +3 | 80.0 | 19.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=1.00 | 1486 | 336s | 1.07 | avg mob | DoT-heavy |
| Enduring Robe | +0 | 24.0 | 16.0 | 0.00% | 0.00 | - | 1076 | 119s | 0.36 | avg mob | DoT-heavy |
| Enduring Robe | +3 | 42.0 | 28.0 | 0.00% | 0.00 | - | 1234 | 140s | 0.63 | hardest | DoT-heavy |
| Iron Crusader Plate | +0 | 29.0 | 12.0 | 5.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25 | 879 | 496s | -0.16 | avg mob | DoT-heavy |
| Iron Crusader Plate | +3 | 53.0 | 21.0 | 5.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25 | 1307 | 148s | 0.76 | avg mob | DoT-heavy |
| Phantom Bindings | +0 | 43.0 | 6.00 | 0.00% | 0.28 | - | 512 | 167s | -1.72 | avg mob | next-tier |
| Phantom Bindings | +3 | 79.0 | 12.0 | 0.00% | 0.46 | - | 1194 | 129s | 0.54 | avg mob | DoT-heavy |
| Verdant Weave | +0 | 44.0 | 6.00 | 0.00% | 0.15 | - | 489 | 124s | -1.92 | avg mob | boss |
| Verdant Weave | +3 | 80.0 | 12.0 | 0.00% | 0.27 | - | 1149 | 124s | 0.45 | avg mob | DoT-heavy |

## Charm Comparison

_Reference armor Dire Bestial Hide +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | hpRegen | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ancient Heartroot Amulet | +0 | 10.0 | - | 2.54 | -574 | 149s | avg mob | boss |
| Ancient Heartroot Amulet | +3 | 19.0 | - | 3.39 | 0.00 | 10963s | avg mob | DoT-heavy |
| Bog Eye | +0 | 6.00 | defense.absorb-pct=0.09 | 2.65 | -574 | 245s | avg mob | next-tier |
| Bog Eye | +3 | 6.00 | defense.absorb-pct=0.15 | 2.93 | 0.00 | 124s | avg mob | DoT-heavy |
| Canopy Heart | +0 | 6.00 | defense.ramp-regen-max-pct=0.10, defense.ramp-regen-ramptime-ms=10000, defense.ramp-regen-start-pct=0.04 | 4.91 | -574 | 154s | avg mob | boss |
| Canopy Heart | +3 | 6.00 | defense.ramp-regen-max-pct=0.16, defense.ramp-regen-ramptime-ms=10000, defense.ramp-regen-start-pct=0.04 | 6.95 | 0.00 | sustains | avg mob | DoT-heavy |
| Iron Bulwark | +0 | 6.00 | defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.12 | 4.51 | -574 | 136s | avg mob | boss |
| Iron Bulwark | +3 | 6.00 | defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.18 | 6.70 | 0.00 | sustains | avg mob | DoT-heavy |
| Mirage Core | +0 | 6.00 | defense.cleanse-empty-heal-pct=0.03, defense.cleanse-interval-ms=6000, defense.cleanse-stacks=1.00 | 3.32 | -574 | 322s | avg mob | boss |
| Mirage Core | +3 | 6.00 | defense.cleanse-empty-heal-pct=0.06, defense.cleanse-interval-ms=6000, defense.cleanse-stacks=1.00 | 4.95 | 0.00 | 471s | avg mob | DoT-heavy |
| Resonant Gem | +0 | 6.00 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.06 | 4.27 | -574 | 4529s | avg mob | boss |
| Resonant Gem | +3 | 6.00 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.12 | 7.16 | 0.00 | sustains | avg mob | DoT-heavy |
| Stalwart Core | +0 | 7.00 | defense.kill-burst-pct=0.09 (kill-burst undercounted) | 2.41 | -574 | 128s | avg mob | boss |
| Stalwart Core | +3 | 7.00 | defense.kill-burst-pct=0.12 (kill-burst undercounted) | 2.80 | 0.00 | 10963s | avg mob | DoT-heavy |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-1 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Forest | 12.0 atk / 0.74 aps / 0.00 dot / ×1.00 | Squire / Bulwark · Phantom Bindings/Canopy Heart | 4068 | 0.57 | 12.0 | 11.4 | sustains | 0.38% | Safe |
| Mountain | 34.0 atk / 0.29 aps / 0.00 dot / ×1.00 | Squire / Bulwark · Enduring Robe/Canopy Heart | 7616 | 0.29 | 10.3 | 10.0 | sustains | 0.45% | Safe |
| Plains | 15.0 atk / 0.51 aps / 0.00 dot / ×1.00 | Squire / Bulwark · Phantom Bindings/Canopy Heart | 5084 | 0.39 | 12.0 | 11.6 | sustains | 0.38% | Safe |
| Swamp | 9.00 atk / 0.43 aps / 5.33 dot / ×1.00 | Squire / Bulwark · Bog Wrappings/Canopy Heart | 583 | 4.16 | 12.1 | 7.89 | sustains | 0.38% | Safe |
| Caverns | 28.0 atk / 0.38 aps / 0.00 dot / ×1.00 | Squire / Bulwark · Duneplate of the Last Stand/Canopy Heart | 7336 | 0.38 | 12.1 | 11.7 | sustains | 0.38% | Safe |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Crag Behemoth | Obsidian Broodmother | Tusked Razorback | Gnarled Greatbear | Grave Toadeater |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 239s | sustains | sustains | sustains | sustains |
| Slinger | 117s | sustains | sustains | sustains | 143s |
| Spirit | sustains | sustains | sustains | sustains | sustains |
| Squire | sustains | sustains | sustains | sustains | sustains |
| Striker | sustains | sustains | sustains | sustains | sustains |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crag Behemoth | 60.0 atk / 0.29 aps / 0.00 dot / ×1.60 | Squire / Bulwark | Enduring Robe | Canopy Heart | 672 | sustains | 4.59 | 23.2% | Safe |
| Obsidian Broodmother | 40.0 atk / 0.36 aps / 0.00 dot / ×1.60 | Squire / Bulwark | Enduring Robe | Canopy Heart | 4480 | sustains | 9.59 | 10.3% | Safe |
| Tusked Razorback | 42.0 atk / 0.50 aps / 0.00 dot / ×1.00 | Squire / Bulwark | Enduring Robe | Canopy Heart | 2352 | sustains | 8.30 | 1.79% | Safe |
| Gnarled Greatbear | 36.0 atk / 0.71 aps / 0.00 dot / ×1.00 | Squire / Bulwark | Enduring Robe | Canopy Heart | 8064 | sustains | 9.59 | 0.45% | Safe |
| Grave Toadeater | 12.0 atk / 0.38 aps / 9.00 dot / ×1.60 | Apprentice / Rime-Bound | Bog Wrappings | Canopy Heart | 668 | sustains | 0.90 | 0.40% | Safe |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Bog Wrappings | 1532 | 596 | 536 | 423 | 550 |
| Dire Bestial Hide | 1191 | 414 | 604 | 483 | 491 |
| Duneplate of the Last Stand | 1723 | 422 | 760 | 490 | 618 |
| Enduring Robe | 1430 | 350 | 1736 | 546 | 758 |
| Iron Crusader Plate | 1515 | 371 | 812 | 483 | 620 |
| Phantom Bindings | 1376 | 428 | 674 | 533 | 526 |
| Verdant Weave | 1322 | 427 | 607 | 480 | 501 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Dire Bestial Hide, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Ancient Heartroot Amulet | 1269 | 436 | 642 | 511 | 519 |
| Bog Eye | 1226 | 423 | 640 | 530 | 523 |
| Canopy Heart | 1522 | 524 | 768 | 612 | 623 |
| Iron Bulwark | 1517 | 518 | 763 | 609 | 618 |
| Mirage Core | 1370 | 475 | 694 | 555 | 563 |
| Resonant Gem | 1526 | 528 | 773 | 617 | 627 |
| Stalwart Core | 1219 | 422 | 618 | 493 | 501 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire / Bulwark | Bog Wrappings/Canopy Heart | 3593 | 2126 | 1.16 | 12.1 | sustains | 0.38% |
| Apprentice / Rime-Bound | Bog Wrappings/Canopy Heart | 3356 | 2468 | 0.95 | 5.93 | sustains | 0.40% |
| Squire / Knight | Bog Wrappings/Iron Bulwark | 3352 | 2028 | 1.16 | 10.9 | sustains | 0.40% |
| Striker / Breaker | Bog Wrappings/Iron Bulwark | 2919 | 1899 | 1.16 | 8.38 | sustains | 0.43% |
| Squire / Warrior | Duneplate of the Last Stand/Iron Bulwark | 2353 | 1492 | 1.49 | 9.09 | sustains | 0.42% |
| Spirit / Phantasm | Duneplate of the Last Stand/Resonant Gem | 2301 | 1315 | 1.49 | 10.4 | sustains | 0.48% |
| Apprentice / Ember mage | Duneplate of the Last Stand/Iron Bulwark | 2254 | 1685 | 1.29 | 5.20 | sustains | 0.43% |
| Striker / Skirmisher | Duneplate of the Last Stand/Iron Bulwark | 2196 | 1428 | 1.49 | 8.10 | sustains | 0.44% |
| Spirit / Spark | Duneplate of the Last Stand/Resonant Gem | 2168 | 1239 | 1.49 | 9.80 | sustains | 0.51% |
| Spirit / Wraith | Duneplate of the Last Stand/Resonant Gem | 2157 | 1232 | 1.49 | 9.75 | sustains | 0.51% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Slinger / Scout | Duneplate of the Last Stand/Iron Bulwark | 1932 | 1445 | 1.36 | 4.68 | sustains | 0.48% |
| Slinger / Artillerist | Duneplate of the Last Stand/Iron Bulwark | 1993 | 1490 | 1.42 | 5.04 | sustains | 0.45% |
| Slinger / Marksman | Duneplate of the Last Stand/Iron Bulwark | 1995 | 1491 | 1.38 | 4.91 | sustains | 0.46% |
| Striker / Flurry | Duneplate of the Last Stand/Iron Bulwark | 2060 | 1340 | 1.49 | 7.60 | sustains | 0.47% |
| Apprentice / Venom vessel | Duneplate of the Last Stand/Iron Bulwark | 2156 | 1612 | 1.29 | 4.97 | sustains | 0.45% |
| Spirit / Wraith | Duneplate of the Last Stand/Resonant Gem | 2157 | 1232 | 1.49 | 9.75 | sustains | 0.51% |
| Spirit / Spark | Duneplate of the Last Stand/Resonant Gem | 2168 | 1239 | 1.49 | 9.80 | sustains | 0.51% |
| Striker / Skirmisher | Duneplate of the Last Stand/Iron Bulwark | 2196 | 1428 | 1.49 | 8.10 | sustains | 0.44% |
| Apprentice / Ember mage | Duneplate of the Last Stand/Iron Bulwark | 2254 | 1685 | 1.29 | 5.20 | sustains | 0.43% |
| Spirit / Phantasm | Duneplate of the Last Stand/Resonant Gem | 2301 | 1315 | 1.49 | 10.4 | sustains | 0.48% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| dominant charm | Resonant Gem | best survival in every matchup profile |
| sustains too early | 15 build(s) | already immortal vs avg mobs on entry (+0) gear |

