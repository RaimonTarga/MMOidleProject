# MMO Idle LLM Survivability Packet - T3 (No Conduit)

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
| Prev-tier +3 vs current mobs | T2 +3 | 32.9 atk / 0.45 aps / 5.38 dot / ×1.00 | 802 | 3.97 | 77.5s | 76.7% | 0 |
| Current +0 vs current mobs (entry) | T3 +0 | 32.9 atk / 0.45 aps / 5.38 dot / ×1.00 | 809 | 4.43 | 57.1s | 76.7% | 0 |
| Current +3 vs current mobs (geared) | T3 +3 | 32.9 atk / 0.45 aps / 5.38 dot / ×1.00 | 1404 | 12.4 | sustains | 100% | 0 |
| Current +3 vs boss/elite | T3 +3 | 65.0 atk / 0.28 aps / 0.00 dot / ×1.60 | 1900 | 11.2 | sustains | 100% | 0 |
| Current +3 vs next-tier mobs | T3 +3 | 46.5 atk / 0.42 aps / 6.68 dot / ×1.08 | 1098 | 9.43 | sustains | 100% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite | Current +3 vs next-tier mobs |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 996 | 1033 | 1808 | 2107 | 1324 |
| Slinger | 695 | 689 | 1269 | 1727 | 998 |
| Spirit | 596 | 567 | 1082 | 1027 | 903 |
| Squire | 959 | 994 | 1523 | 3007 | 1208 |
| Striker | 764 | 762 | 1337 | 1633 | 1055 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deepscale Hide | +0 | 65.0 | 14.0 | 20.0% | 0.00 | - | 587 | 76.2s | -4.57 | avg mob | DoT-heavy |
| Deepscale Hide | +3 | 110 | 20.0 | 26.0% | 0.00 | - | 855 | 396s | -2.20 | avg mob | DoT-heavy |
| Emberforge Plate | +0 | 90.0 | 20.0 | 0.00% | 0.00 | defense.hardening-max=24.0, defense.hardening-per-sec=3.00, defense.hardening-reset-pct=0.25 | 746 | 99.5s | -3.09 | avg mob | DoT-heavy |
| Emberforge Plate | +3 | 150 | 35.0 | 0.00% | 0.00 | defense.hardening-max=24.0, defense.hardening-per-sec=3.00, defense.hardening-reset-pct=0.25 | 1124 | 475s | -0.53 | boss | DoT-heavy |
| Eternal Duneplate | +0 | 90.0 | 20.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=1.00, defense.debuff-resistance=0.20 | 746 | 199s | -3.09 | avg mob | DoT-heavy |
| Eternal Duneplate | +3 | 150 | 35.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=1.00, defense.debuff-resistance=0.20 | 1124 | 949s | -0.53 | boss | DoT-heavy |
| Glacial Bulwark | +0 | 100 | 15.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.stationary-dr-pct=0.15, defense.stationary-dr-ramptime-ms=6000 | 656 | 61.7s | -4.40 | avg mob | DoT-heavy |
| Glacial Bulwark | +3 | 166 | 27.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.stationary-dr-pct=0.15, defense.stationary-dr-ramptime-ms=6000 | 1149 | 114s | -0.47 | avg mob | DoT-heavy |
| Plaguebound Shroud | +0 | 86.0 | 12.0 | 0.00% | 0.00 | defense.debuff-resistance=0.20, defense.dot-resistance=0.35, defense.hit-to-dot-pct=0.10 | 734 | 52.7s | -3.62 | avg mob | hardest |
| Plaguebound Shroud | +3 | 140 | 21.0 | 0.00% | 0.00 | defense.debuff-resistance=0.20, defense.dot-resistance=0.35, defense.hit-to-dot-pct=0.10 | 1336 | 786s | -0.05 | avg mob | DoT-heavy |
| Summit Aegis | +0 | 55.0 | 23.0 | 10.0% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25 | 715 | 67.2s | -2.76 | avg mob | DoT-heavy |
| Summit Aegis | +3 | 97.0 | 41.0 | 10.0% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25 | 933 | 154s | -1.39 | boss | DoT-heavy |
| Wildgrowth Weave | +0 | 80.0 | 13.0 | 0.00% | 0.40 | - | 606 | 110s | -4.58 | avg mob | DoT-heavy |
| Wildgrowth Weave | +3 | 134 | 22.0 | 0.00% | 0.55 | - | 978 | 201s | -1.45 | avg mob | DoT-heavy |

## Charm Comparison

_Reference armor Glacial Bulwark +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | hpRegen | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bastion Heart | +0 | 11.0 | defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.17 | 9.80 | -493 | 163s | avg mob | DoT-heavy |
| Bastion Heart | +3 | 11.0 | defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.26 | 15.5 | 0.00 | sustains | avg mob | DoT-heavy |
| Echo Geode | +0 | 11.0 | defense.in-combat-regen-pct=0.02, defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.07 | 9.93 | -493 | 121s | avg mob | DoT-heavy |
| Echo Geode | +3 | 11.0 | defense.in-combat-regen-pct=0.05, defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.13 | 18.2 | 0.00 | sustains | avg mob | DoT-heavy |
| Frostward Charm | +0 | 11.0 | defense.absorb-pct=0.08, defense.shield-duration-ms=9000, defense.shield-interval-ms=9000, defense.shield-pct=0.12 | 8.19 | -493 | 92.3s | avg mob | DoT-heavy |
| Frostward Charm | +3 | 11.0 | defense.absorb-pct=0.14, defense.shield-duration-ms=9000, defense.shield-interval-ms=9000, defense.shield-pct=0.18 | 11.9 | 0.00 | 949s | avg mob | DoT-heavy |
| Magmaheart Core | +0 | 11.0 | defense.in-combat-regen-pct=0.06, defense.kill-burst-pct=0.04 (kill-burst undercounted) | 9.55 | -493 | 94.7s | avg mob | DoT-heavy |
| Magmaheart Core | +3 | 11.0 | defense.in-combat-regen-pct=0.12, defense.kill-burst-pct=0.10 (kill-burst undercounted) | 16.9 | 0.00 | sustains | avg mob | DoT-heavy |
| Oasis Core | +0 | 11.0 | defense.cleanse-empty-heal-pct=0.05, defense.cleanse-interval-ms=6000, defense.cleanse-stacks=1.00 | 7.73 | -493 | 91.6s | avg mob | DoT-heavy |
| Oasis Core | +3 | 11.0 | defense.cleanse-empty-heal-pct=0.08, defense.cleanse-interval-ms=6000, defense.cleanse-stacks=1.00 | 11.3 | 0.00 | 1568s | avg mob | DoT-heavy |
| Sorrow Eye | +0 | 11.0 | defense.absorb-pct=0.18 | 6.18 | -493 | 79.3s | avg mob | DoT-heavy |
| Sorrow Eye | +3 | 11.0 | defense.absorb-pct=0.30 | 7.09 | 0.00 | 92.2s | avg mob | DoT-heavy |
| Worldvine Heart | +0 | 11.0 | defense.ramp-regen-max-pct=0.14, defense.ramp-regen-ramptime-ms=10000, defense.ramp-regen-start-pct=0.05 | 11.9 | -493 | 772s | avg mob | DoT-heavy |
| Worldvine Heart | +3 | 11.0 | defense.ramp-regen-max-pct=0.20, defense.ramp-regen-ramptime-ms=10000, defense.ramp-regen-start-pct=0.05 | 17.3 | 0.00 | sustains | avg mob | DoT-heavy |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-2 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Forest | 26.7 atk / 0.68 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Wildgrowth Weave/Worldvine Heart | 12387 | 0.50 | 42.0 | 41.5 | sustains | 0.29% | Safe |
| Mountain | 60.0 atk / 0.30 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Summit Aegis/Worldvine Heart | 18240 | 0.30 | 37.5 | 37.2 | sustains | 0.33% | Safe |
| Plains | 34.0 atk / 0.57 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Wildgrowth Weave/Worldvine Heart | 15794 | 0.42 | 42.0 | 41.6 | sustains | 0.29% | Safe |
| Swamp | 16.7 atk / 0.43 aps / 17.7 dot / ×1.00 | Squire / Bulwark / Vanguard · Plaguebound Shroud/Worldvine Heart | 724 | 11.9 | 42.8 | 30.9 | sustains | 0.29% | Safe |
| Caverns | 39.7 atk / 0.35 aps / 6.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Plaguebound Shroud/Worldvine Heart | 1625 | 4.24 | 42.8 | 38.5 | sustains | 0.29% | Safe |
| Jungle | 19.3 atk / 0.64 aps / 14.0 dot / ×1.00 | Squire / Bulwark / Vanguard · Plaguebound Shroud/Worldvine Heart | 941 | 9.72 | 42.8 | 33.1 | sustains | 0.29% | Safe |
| Desert | 34.0 atk / 0.45 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Wildgrowth Weave/Worldvine Heart | 15794 | 0.33 | 42.0 | 41.7 | sustains | 0.29% | Safe |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Chitinous Dreadbore | Stoneplate Juggernaut | Gorging Razortusk | Dune-Stalker Emperor | Jungle Dread-Gorger | Apex Timberclaw | Mire-Gorged Behemoth |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Slinger | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Spirit | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Squire | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Striker | sustains | sustains | sustains | sustains | sustains | sustains | sustains |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chitinous Dreadbore | 65.0 atk / 0.28 aps / 0.00 dot / ×1.60 | Squire / Bulwark / Vanguard | Summit Aegis | Worldvine Heart | 6587 | sustains | 36.6 | 10.2% | Safe |
| Stoneplate Juggernaut | 60.0 atk / 0.24 aps / 0.00 dot / ×1.60 | Squire / Bulwark / Vanguard | Summit Aegis | Worldvine Heart | 18240 | sustains | 37.2 | 8.55% | Safe |
| Gorging Razortusk | 45.0 atk / 0.45 aps / 0.00 dot / ×1.30 | Squire / Bulwark / Vanguard | Glacial Bulwark | Worldvine Heart | 16785 | sustains | 45.5 | 2.68% | Safe |
| Dune-Stalker Emperor | 40.0 atk / 0.38 aps / 0.00 dot / ×1.20 | Squire / Bulwark / Vanguard | Wildgrowth Weave | Worldvine Heart | 18581 | sustains | 41.7 | 1.47% | Safe |
| Jungle Dread-Gorger | 40.0 atk / 0.42 aps / 0.00 dot / ×1.10 | Squire / Bulwark / Vanguard | Wildgrowth Weave | Worldvine Heart | 18581 | sustains | 41.7 | 0.59% | Safe |
| Apex Timberclaw | 30.0 atk / 0.67 aps / 0.00 dot / ×1.15 | Squire / Bulwark / Vanguard | Wildgrowth Weave | Worldvine Heart | 13936 | sustains | 41.5 | 0.29% | Safe |
| Mire-Gorged Behemoth | 18.0 atk / 0.36 aps / 16.0 dot / ×1.60 | Squire / Bulwark / Vanguard | Plaguebound Shroud | Worldvine Heart | 724 | sustains | 32.0 | 0.29% | Safe |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Deepscale Hide | 1060 | 419 | 987 | 1060 | 829 |
| Emberforge Plate | 1388 | 480 | 1337 | 1598 | 1320 |
| Eternal Duneplate | 1388 | 480 | 1337 | 1598 | 1320 |
| Glacial Bulwark | 1420 | 505 | 1037 | 1143 | 1099 |
| Plaguebound Shroud | 1653 | 727 | 839 | 897 | 1071 |
| Summit Aegis | 1152 | 398 | 1693 | 2467 | 1210 |
| Wildgrowth Weave | 1213 | 458 | 1102 | 1187 | 942 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Glacial Bulwark, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Bastion Heart | 1962 | 696 | 1452 | 1603 | 1538 |
| Echo Geode | 2096 | 744 | 1539 | 1699 | 1633 |
| Frostward Charm | 1770 | 627 | 1346 | 1483 | 1404 |
| Magmaheart Core | 2032 | 721 | 1495 | 1651 | 1587 |
| Oasis Core | 1731 | 615 | 1274 | 1407 | 1351 |
| Sorrow Eye | 1510 | 535 | 1191 | 1306 | 1216 |
| Worldvine Heart | 2054 | 729 | 1511 | 1668 | 1604 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire / Bulwark / Vanguard | Plaguebound Shroud/Worldvine Heart | 5067 | 1779 | 3.93 | 42.8 | sustains | 0.29% |
| Squire / Knight / Vanguard | Plaguebound Shroud/Echo Geode | 4709 | 1717 | 3.93 | 38.9 | sustains | 0.30% |
| Squire / Warrior / Vanguard | Plaguebound Shroud/Echo Geode | 4080 | 1645 | 3.93 | 31.7 | sustains | 0.31% |
| Apprentice / Rime-Bound / Hexblade | Plaguebound Shroud/Worldvine Heart | 3614 | 2283 | 2.93 | 12.9 | sustains | 0.30% |
| Apprentice / Ember mage / Hexblade | Plaguebound Shroud/Echo Geode | 3340 | 2173 | 2.93 | 11.3 | sustains | 0.32% |
| Apprentice / Venom vessel / Hexblade | Plaguebound Shroud/Echo Geode | 3187 | 2104 | 2.93 | 10.5 | sustains | 0.33% |
| Striker / Breaker / In-Fighter | Plaguebound Shroud/Worldvine Heart | 3015 | 1635 | 3.93 | 17.9 | sustains | 0.31% |
| Squire / Bulwark / Sentinel | Plaguebound Shroud/Echo Geode | 2979 | 1524 | 4.36 | 21.0 | sustains | 0.61% |
| Striker / Skirmisher / In-Fighter | Plaguebound Shroud/Echo Geode | 2901 | 1594 | 3.93 | 17.0 | sustains | 0.32% |
| Spirit / Phantasm / Haunt | Plaguebound Shroud/Worldvine Heart | 2900 | 1353 | 4.36 | 22.3 | sustains | 0.68% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Slinger / Scout / Deadeye | Emberforge Plate/Bastion Heart | 1507 | 1013 | 5.69 | 9.29 | sustains | 0.35% |
| Slinger / Marksman / Deadeye | Emberforge Plate/Echo Geode | 1564 | 1044 | 5.71 | 9.82 | sustains | 0.34% |
| Slinger / Artillerist / Deadeye | Glacial Bulwark/Echo Geode | 1685 | 1114 | 5.75 | 10.9 | sustains | 0.31% |
| Striker / Flurry / Phantom-Blade | Emberforge Plate/Bastion Heart | 1691 | 1002 | 5.83 | 13.3 | sustains | 0.34% |
| Spirit / Wraith / Wisp | Emberforge Plate/Echo Geode | 1823 | 943 | 5.83 | 17.0 | sustains | 0.37% |
| Spirit / Spark / Wisp | Emberforge Plate/Echo Geode | 1830 | 947 | 5.83 | 17.0 | sustains | 0.36% |
| Apprentice / Venom vessel / Harbinger | Emberforge Plate/Echo Geode | 1859 | 1241 | 4.85 | 9.92 | sustains | 0.33% |
| Striker / Skirmisher / Phantom-Blade | Glacial Bulwark/Echo Geode | 1877 | 1106 | 5.83 | 14.9 | sustains | 0.31% |
| Spirit / Phantasm / Wisp | Emberforge Plate/Echo Geode | 1932 | 988 | 5.83 | 18.2 | sustains | 0.35% |
| Striker / Breaker / Phantom-Blade | Plaguebound Shroud/Echo Geode | 2001 | 1163 | 5.23 | 14.5 | sustains | 1.32% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| dominant charm | Echo Geode | best survival in every matchup profile |
| sustains too early | 23 build(s) | already immortal vs avg mobs on entry (+0) gear |

