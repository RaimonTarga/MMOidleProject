# MMO Idle LLM Survivability Packet - T3

Generated from `tools/ehp-report.ts --llm-packet`. Progression-focused companion to the DPS packet.

## Assumptions / Omissions

- Class unlock tier 2. Views model progression moments, not just same-tier +3 gear.
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
| Prev-tier +3 vs current mobs | T2 +3 | 32.7 atk / 0.45 aps / 5.38 dot / ×1.02 | 691 | 2.02 | 58.3s | 50.0% | 0 |
| Current +0 vs current mobs (entry) | T3 +0 | 32.7 atk / 0.45 aps / 5.38 dot / ×1.02 | 693 | 1.80 | 43.9s | 50.0% | 0 |
| Current +3 vs current mobs (geared) | T3 +3 | 32.7 atk / 0.45 aps / 5.38 dot / ×1.02 | 1365 | 11.1 | sustains | 100% | 0 |
| Current +3 vs boss/elite | T3 +3 | 65.0 atk / 0.28 aps / 0.00 dot / ×1.60 | 3875 | 9.76 | sustains | 100% | 0 |
| Current +3 vs next-tier mobs | T3 +3 | 46.4 atk / 0.42 aps / 5.95 dot / ×1.13 | 1240 | 9.08 | sustains | 100% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite | Current +3 vs next-tier mobs |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 773 | 783 | 1548 | 1709 | 1474 |
| Conduit | 626 | 595 | 1175 | 1242 | 1118 |
| Slinger | 608 | 567 | 1133 | 1282 | 1013 |
| Spirit | 580 | 511 | 1090 | 977 | 967 |
| Squire | 884 | 958 | 1831 | 15236 | 1536 |
| Striker | 677 | 742 | 1413 | 2803 | 1330 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deepscale Hide | +0 | 65.0 | 14.0 | 20.0% | 0.00 | - | 468 | 53.7s | -6.89 | avg mob | DoT-heavy |
| Deepscale Hide | +5 | 140 | 24.0 | 30.0% | 0.00 | - | 1061 | 82.0s | -2.27 | avg mob | DoT-heavy |
| Emberforge Plate | +0 | 90.0 | 20.0 | 0.00% | 0.00 | defense.hardening-max=24.0, defense.hardening-per-sec=3.00, defense.hardening-reset-pct=0.25 | 674 | 117s | -4.80 | avg mob | DoT-heavy |
| Emberforge Plate | +5 | 190 | 45.0 | 0.00% | 0.00 | defense.hardening-max=24.0, defense.hardening-per-sec=3.00, defense.hardening-reset-pct=0.25 | 1372 | 159s | -0.98 | boss | DoT-heavy |
| Eternal Duneplate | +0 | 90.0 | 20.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=1.00, defense.debuff-resistance=0.20 | 674 | 234s | -4.80 | avg mob | DoT-heavy |
| Eternal Duneplate | +5 | 190 | 45.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=1.00, defense.debuff-resistance=0.20 | 1372 | 318s | -0.98 | boss | DoT-heavy |
| Glacial Bulwark | +0 | 100 | 15.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.stationary-dr-pct=0.15, defense.stationary-dr-ramptime-ms=6000 | 539 | 45.0s | -6.91 | avg mob | DoT-heavy |
| Glacial Bulwark | +5 | 210 | 35.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.stationary-dr-pct=0.15, defense.stationary-dr-ramptime-ms=6000 | 1466 | 382s | -0.66 | boss | DoT-heavy |
| Plaguebound Shroud | +0 | 86.0 | 12.0 | 0.00% | 0.00 | defense.debuff-resistance=0.20, defense.dot-resistance=0.35, defense.hit-to-dot-pct=0.10 | 531 | 122s | -6.50 | avg mob | hardest |
| Plaguebound Shroud | +5 | 176 | 27.0 | 0.00% | 0.00 | defense.debuff-resistance=0.20, defense.dot-resistance=0.35, defense.hit-to-dot-pct=0.10 | 1908 | 259s | 0.50 | avg mob | DoT-heavy |
| Summit Aegis | +0 | 55.0 | 23.0 | 10.0% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25 | 654 | 75.0s | -4.00 | avg mob | DoT-heavy |
| Summit Aegis | +5 | 125 | 53.0 | 10.0% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25 | 1064 | 76.5s | -2.03 | boss | DoT-heavy |
| Wildgrowth Weave | +0 | 80.0 | 13.0 | 0.00% | 0.40 | - | 491 | 287s | -6.98 | avg mob | DoT-heavy |
| Wildgrowth Weave | +5 | 170 | 28.0 | 0.00% | 0.65 | - | 1295 | 127s | -1.24 | boss | DoT-heavy |

## Charm Comparison

_Reference armor Glacial Bulwark +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | hpRegen | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bastion Heart | +0 | 11.0 | defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.17 | 8.88 | -927 | 69.4s | avg mob | DoT-heavy |
| Bastion Heart | +5 | 11.0 | defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.32 | 20.7 | 0.00 | sustains | boss | DoT-heavy |
| Echo Geode | +0 | 11.0 | defense.in-combat-regen-pct=0.02, defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.07 | 8.58 | -927 | 117s | avg mob | DoT-heavy |
| Echo Geode | +5 | 11.0 | defense.in-combat-regen-pct=0.07, defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.17 | 24.4 | 0.00 | sustains | boss | DoT-heavy |
| Frostward Charm | +0 | 11.0 | defense.absorb-pct=0.08, defense.shield-duration-ms=9000, defense.shield-interval-ms=9000, defense.shield-pct=0.12 | 7.33 | -927 | 113s | avg mob | DoT-heavy |
| Frostward Charm | +5 | 11.0 | defense.absorb-pct=0.18, defense.shield-duration-ms=9000, defense.shield-interval-ms=9000, defense.shield-pct=0.22 | 15.0 | 0.00 | sustains | boss | DoT-heavy |
| Magmaheart Stone | +0 | 11.0 | defense.in-combat-regen-pct=0.06, defense.kill-burst-pct=0.04 (kill-burst undercounted) | 7.71 | -927 | 140s | avg mob | DoT-heavy |
| Magmaheart Stone | +5 | 11.0 | defense.in-combat-regen-pct=0.16, defense.kill-burst-pct=0.14 (kill-burst undercounted) | 20.5 | 0.00 | sustains | boss | DoT-heavy |
| Oasis Heart | +0 | 11.0 | defense.cleanse-empty-heal-pct=0.05, defense.cleanse-interval-ms=6000, defense.cleanse-stacks=1.00 | 6.58 | -927 | 779s | avg mob | DoT-heavy |
| Oasis Heart | +5 | 11.0 | defense.cleanse-empty-heal-pct=0.10, defense.cleanse-interval-ms=6000, defense.cleanse-stacks=1.00 | 13.6 | 0.00 | sustains | boss | DoT-heavy |
| Sorrow Eye | +0 | 11.0 | defense.absorb-pct=0.18 | 5.26 | -927 | 127s | avg mob | DoT-heavy |
| Sorrow Eye | +5 | 11.0 | defense.absorb-pct=0.38 | 6.87 | 0.00 | 191s | boss | DoT-heavy |
| Worldvine Heart | +0 | 11.0 | defense.ramp-regen-max-pct=0.14, defense.ramp-regen-ramptime-ms=10000, defense.ramp-regen-start-pct=0.05 | 9.66 | -927 | 145s | avg mob | DoT-heavy |
| Worldvine Heart | +5 | 11.0 | defense.ramp-regen-max-pct=0.24, defense.ramp-regen-ramptime-ms=10000, defense.ramp-regen-start-pct=0.05 | 19.2 | 0.00 | sustains | boss | DoT-heavy |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-2 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Forest | 26.7 atk / 0.68 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Wildgrowth Weave/Bastion Heart | 13768 | 0.50 | 36.2 | 35.7 | sustains | 0.26% | Safe |
| Mountain | 60.0 atk / 0.30 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Emberforge Plate/Bastion Heart | 24300 | 0.30 | 38.7 | 38.4 | sustains | 0.25% | Safe |
| Plains | 34.0 atk / 0.57 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Wildgrowth Weave/Bastion Heart | 17554 | 0.42 | 36.2 | 35.8 | sustains | 0.26% | Safe |
| Swamp | 16.7 atk / 0.43 aps / 17.7 dot / ×1.00 | Squire / Bulwark / Vanguard · Plaguebound Shroud/Bastion Heart | 811 | 11.9 | 37.1 | 25.3 | sustains | 0.26% | Safe |
| Caverns | 39.7 atk / 0.35 aps / 6.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Plaguebound Shroud/Bastion Heart | 1687 | 4.57 | 37.1 | 32.6 | sustains | 0.51% | Safe |
| Jungle | 19.3 atk / 0.64 aps / 14.0 dot / ×1.15 | Squire / Bulwark / Vanguard · Plaguebound Shroud/Bastion Heart | 1055 | 9.72 | 37.1 | 27.4 | sustains | 0.26% | Safe |
| Desert | 32.7 atk / 0.45 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Wildgrowth Weave/Bastion Heart | 16865 | 0.33 | 36.2 | 35.9 | sustains | 0.26% | Safe |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Chitinous Dreadbore | Stoneplate Juggernaut | Gorging Razortusk | Apex Timberclaw | Dune-Stalker Emperor | Jungle Dread-Gorger | Mire-Gorged Behemoth |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Conduit | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Slinger | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Spirit | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Squire | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Striker | sustains | sustains | sustains | sustains | sustains | sustains | sustains |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chitinous Dreadbore | 65.0 atk / 0.28 aps / 0.00 dot / ×1.60 | Squire / Bulwark / Vanguard | Summit Aegis | Bastion Heart | 20735 | sustains | 30.2 | 8.46% | Safe |
| Stoneplate Juggernaut | 60.0 atk / 0.24 aps / 0.00 dot / ×1.60 | Squire / Bulwark / Vanguard | Emberforge Plate | Bastion Heart | 24300 | sustains | 38.4 | 7.90% | Safe |
| Gorging Razortusk | 45.0 atk / 0.45 aps / 0.00 dot / ×1.30 | Squire / Bulwark / Vanguard | Glacial Bulwark | Bastion Heart | 19395 | sustains | 40.7 | 2.32% | Safe |
| Apex Timberclaw | 30.0 atk / 0.67 aps / 0.00 dot / ×1.60 | Squire / Bulwark / Vanguard | Wildgrowth Weave | Bastion Heart | 15489 | sustains | 35.7 | 1.85% | Safe |
| Dune-Stalker Emperor | 40.0 atk / 0.38 aps / 0.00 dot / ×1.20 | Squire / Bulwark / Vanguard | Wildgrowth Weave | Bastion Heart | 20651 | sustains | 35.9 | 1.85% | Safe |
| Jungle Dread-Gorger | 40.0 atk / 0.42 aps / 0.00 dot / ×1.10 | Squire / Bulwark / Vanguard | Wildgrowth Weave | Bastion Heart | 20651 | sustains | 35.9 | 1.06% | Safe |
| Mire-Gorged Behemoth | 18.0 atk / 0.36 aps / 16.0 dot / ×1.60 | Squire / Bulwark / Vanguard | Plaguebound Shroud | Bastion Heart | 812 | sustains | 26.4 | 0.26% | Safe |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Deepscale Hide | 1247 | 464 | 1105 | 1189 | 1013 |
| Emberforge Plate | 1612 | 561 | 8274 | 10842 | 1862 |
| Eternal Duneplate | 1612 | 561 | 8274 | 10842 | 1862 |
| Glacial Bulwark | 1723 | 599 | 1748 | 2322 | 1774 |
| Plaguebound Shroud | 2236 | 831 | 1031 | 1135 | 1568 |
| Summit Aegis | 1251 | 435 | 13050 | 16517 | 1445 |
| Wildgrowth Weave | 1522 | 525 | 1435 | 1599 | 1332 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Glacial Bulwark, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Bastion Heart | 2568 | 893 | 2703 | 3653 | 2673 |
| Echo Geode | 2758 | 959 | 2854 | 3833 | 2851 |
| Frostward Charm | 2257 | 785 | 2433 | 3281 | 2357 |
| Magmaheart Stone | 2551 | 887 | 2649 | 3566 | 2637 |
| Oasis Heart | 2178 | 757 | 2281 | 3086 | 2254 |
| Sorrow Eye | 1821 | 633 | 2024 | 2716 | 1902 |
| Worldvine Heart | 2482 | 863 | 2581 | 3477 | 2566 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire / Bulwark / Vanguard | Plaguebound Shroud/Bastion Heart | 4829 | 1985 | 3.93 | 37.1 | sustains | 0.26% |
| Squire / Knight / Vanguard | Plaguebound Shroud/Bastion Heart | 4531 | 1863 | 3.93 | 34.9 | sustains | 0.27% |
| Squire / Warrior / Vanguard | Plaguebound Shroud/Bastion Heart | 4320 | 1776 | 3.93 | 33.2 | sustains | 0.29% |
| Squire / Bulwark / Sentinel | Plaguebound Shroud/Bastion Heart | 3422 | 1899 | 3.93 | 19.9 | sustains | 0.27% |
| Striker / Breaker / In-Fighter | Plaguebound Shroud/Bastion Heart | 3239 | 1812 | 3.93 | 18.6 | sustains | 0.28% |
| Squire / Knight / Sentinel | Plaguebound Shroud/Bastion Heart | 3201 | 1776 | 3.93 | 18.6 | sustains | 0.29% |
| Apprentice / Rime-Bound / Hexblade | Plaguebound Shroud/Bastion Heart | 3126 | 2096 | 3.33 | 11.4 | sustains | 0.57% |
| Squire / Warrior / Sentinel | Plaguebound Shroud/Bastion Heart | 3045 | 1689 | 3.93 | 17.7 | sustains | 0.30% |
| Striker / Skirmisher / In-Fighter | Plaguebound Shroud/Bastion Heart | 2761 | 1545 | 4.36 | 17.6 | sustains | 0.60% |
| Spirit / Phantasm / Haunt | Glacial Bulwark/Echo Geode | 2608 | 1253 | 5.83 | 26.3 | sustains | 0.27% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Slinger / Scout / Deadeye | Emberforge Plate/Bastion Heart | 1484 | 998 | 5.73 | 9.26 | sustains | 0.35% |
| Conduit / Splinter / Vigil | Emberforge Plate/Bastion Heart | 1510 | 1015 | 5.83 | 9.59 | sustains | 0.34% |
| Slinger / Marksman / Deadeye | Emberforge Plate/Bastion Heart | 1534 | 1031 | 5.74 | 9.59 | sustains | 0.34% |
| Conduit / Consort / Vigil | Glacial Bulwark/Bastion Heart | 1664 | 1118 | 5.83 | 10.6 | sustains | 0.31% |
| Slinger / Scout / Breacher | Emberforge Plate/Bastion Heart | 1697 | 1141 | 5.68 | 10.5 | sustains | 0.31% |
| Slinger / Artillerist / Deadeye | Glacial Bulwark/Bastion Heart | 1712 | 1151 | 5.75 | 10.7 | sustains | 0.30% |
| Slinger / Marksman / Breacher | Emberforge Plate/Bastion Heart | 1746 | 1174 | 5.69 | 10.8 | sustains | 0.30% |
| Conduit / Splinter / Harrier | Glacial Bulwark/Bastion Heart | 1771 | 1191 | 5.83 | 11.2 | sustains | 0.29% |
| Conduit / Effigy / Vigil | Glacial Bulwark/Bastion Heart | 1771 | 1191 | 5.83 | 11.2 | sustains | 0.29% |
| Spirit / Spark / Wisp | Emberforge Plate/Echo Geode | 1815 | 939 | 5.83 | 17.0 | sustains | 0.37% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| armor > +25% tier avg | Plaguebound Shroud | survival 2236 vs avg 1601 |
| dominant charm | Echo Geode | best survival in every matchup profile |
| sustains too early | 18 build(s) | already immortal vs avg mobs on entry (+0) gear |

