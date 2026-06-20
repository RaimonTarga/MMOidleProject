# MMO Idle LLM Survivability Packet - T4

Generated from `tools/ehp-report.ts --llm-packet`. Progression-focused companion to the DPS packet.

## Assumptions / Omissions

- Class unlock tier 3. Views model progression moments, not just same-tier +3 gear.
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
| Prev-tier +3 vs current mobs | T3 +3 | 44.6 atk / 0.42 aps / 11.8 dot / ×1.08 | 1285 | 16.4 | sustains | 100% | 0 |
| Current +0 vs current mobs (entry) | T4 +0 | 44.6 atk / 0.42 aps / 11.8 dot / ×1.08 | 1270 | 15.9 | sustains | 100% | 0 |
| Current +3 vs current mobs (geared) | T4 +3 | 44.6 atk / 0.42 aps / 11.8 dot / ×1.08 | 1820 | 33.9 | sustains | 100% | 0 |
| Current +3 vs boss/elite | T4 +3 | 125 atk / 0.24 aps / 0.00 dot / ×2.20 | 1418 | 32.2 | sustains | 100% | 0 |
| Current +3 vs next-tier mobs | T4 +3 | 93.6 atk / 0.40 aps / 17.2 dot / ×1.69 | 1396 | 24.0 | sustains | 100% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite | Current +3 vs next-tier mobs |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 1756 | 1755 | 2451 | 1429 | 1805 |
| Conduit | 1122 | 1078 | 1655 | 1106 | 1142 |
| Slinger | 1185 | 1165 | 1700 | 1997 | 1407 |
| Spirit | 1098 | 1058 | 1604 | 1101 | 1144 |
| Squire | 1325 | 1347 | 1806 | 1573 | 1547 |
| Striker | 1222 | 1218 | 1703 | 1301 | 1331 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deathless Duneplate | +0 | 165 | 38.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=2.00, defense.debuff-resistance=0.30, defense.post-cheat-death-heal-ms=4000, defense.post-cheat-death-heal-pct=0.30 | 815 | 740s | -7.78 | avg mob | DoT-heavy |
| Deathless Duneplate | +3 | 285 | 65.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=2.00, defense.debuff-resistance=0.30, defense.post-cheat-death-heal-ms=4000, defense.post-cheat-death-heal-pct=0.30 | 1145 | 136s | -5.80 | hardest | DoT-heavy |
| Deep Sea Carapace | +0 | 90.0 | 24.0 | 22.0% | 0.00 | defense.sustained-fight-dr-bonus=0.01, defense.sustained-fight-dr-max=0.05, defense.sustained-fight-ramptime-ms=10000 | 517 | 22.6s | -11.6 | hardest | DoT-heavy |
| Deep Sea Carapace | +3 | 156 | 42.0 | 28.0% | 0.00 | defense.sustained-fight-dr-bonus=0.01, defense.sustained-fight-dr-max=0.05, defense.sustained-fight-ramptime-ms=10000 | 812 | 92.0s | -7.55 | hardest | DoT-heavy |
| Grave Ward | +0 | 150 | 30.0 | 0.00% | 0.00 | defense.debt-cheat-death=1.00, defense.dot-resistance=0.40, defense.hit-to-dot-pct=0.22 | 1102 | 73.0s | -4.81 | avg mob | DoT-heavy |
| Grave Ward | +3 | 258 | 51.0 | 0.00% | 0.00 | defense.debt-cheat-death=1.00, defense.dot-resistance=0.40, defense.hit-to-dot-pct=0.22 | 1820 | 103s | -1.40 | avg mob | DoT-heavy |
| Lava-Tempered Hide | +0 | 150 | 28.0 | 0.00% | 0.00 | defense.hardening-max=24.0, defense.hardening-per-sec=3.00, defense.hardening-reset-pct=0.25, defense.overheal-shield-pct=0.50 | 661 | 40.4s | -10.4 | avg mob | DoT-heavy |
| Lava-Tempered Hide | +3 | 258 | 49.0 | 0.00% | 0.00 | defense.hardening-max=24.0, defense.hardening-per-sec=3.00, defense.hardening-reset-pct=0.25, defense.overheal-shield-pct=0.50 | 1075 | 111s | -6.17 | hardest | DoT-heavy |
| Permafrost Sovereign | +0 | 180 | 28.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.stationary-dr-pct=0.20, defense.stationary-dr-ramptime-ms=5000 | 725 | 78.8s | -10.0 | avg mob | DoT-heavy |
| Permafrost Sovereign | +3 | 306 | 49.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.stationary-dr-pct=0.20, defense.stationary-dr-ramptime-ms=5000 | 1199 | 65.6s | -5.52 | hardest | DoT-heavy |
| Plaguebound Mantle | +0 | 150 | 36.0 | 0.00% | 0.00 | defense.debuff-resistance=0.25, defense.dot-resistance=0.40, defense.hit-plating-duration-ms=4000, defense.hit-plating-max-stacks=15.0, defense.hit-plating-per-stack=2.00, defense.hit-to-dot-pct=0.22 | 1270 | 399s | -3.43 | avg mob | DoT-heavy |
| Plaguebound Mantle | +3 | 258 | 63.0 | 0.00% | 0.00 | defense.debuff-resistance=0.25, defense.dot-resistance=0.40, defense.hit-plating-duration-ms=4000, defense.hit-plating-max-stacks=15.0, defense.hit-plating-per-stack=2.00, defense.hit-to-dot-pct=0.22 | 1820 | 103s | -1.40 | hardest | DoT-heavy |
| Primal Canopy | +0 | 145 | 24.0 | 0.00% | 0.55 | defense.evade-mitigation=0.20 | 660 | 36.2s | -10.1 | hardest | DoT-heavy |
| Primal Canopy | +3 | 250 | 42.0 | 0.00% | 0.64 | defense.evade-mitigation=0.20 | 1070 | 102s | -6.11 | hardest | DoT-heavy |
| Pyroclasm Mantle | +0 | 165 | 38.0 | 0.00% | 0.00 | defense.hardening-max=32.0, defense.hardening-max-dr-bonus=0.06, defense.hardening-max-dr-ms=3000, defense.hardening-per-sec=4.00, defense.hardening-reset-pct=0.25 | 815 | 322s | -7.78 | avg mob | DoT-heavy |
| Pyroclasm Mantle | +3 | 285 | 68.0 | 0.00% | 0.00 | defense.hardening-max=32.0, defense.hardening-max-dr-bonus=0.06, defense.hardening-max-dr-ms=3000, defense.hardening-per-sec=4.00, defense.hardening-reset-pct=0.25 | 1145 | 59.2s | -5.80 | hardest | DoT-heavy |
| Stormwall Plate | +0 | 100 | 30.0 | 14.0% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.shield-break-hp-recovery-pct=0.30 | 591 | 29.0s | -10.1 | hardest | DoT-heavy |
| Stormwall Plate | +3 | 175 | 54.0 | 14.0% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.shield-break-hp-recovery-pct=0.30 | 861 | 65.0s | -7.29 | hardest | DoT-heavy |
| Titan's Keep | +0 | 100 | 40.0 | 12.0% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.max-hit-rearms-shield=1.00 | 665 | 36.2s | -8.37 | hardest | DoT-heavy |
| Titan's Keep | +3 | 175 | 70.0 | 12.0% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.max-hit-rearms-shield=1.00 | 861 | 65.0s | -7.29 | hardest | DoT-heavy |

## Charm Comparison

_Reference armor Permafrost Sovereign +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | hpRegen | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ancient Canopy | +0 | 16.0 | defense.ramp-regen-max-pct=0.28, defense.ramp-regen-ramptime-ms=9000, defense.ramp-regen-start-pct=0.07 | 24.3 | -474 | 439s | avg mob | DoT-heavy |
| Ancient Canopy | +3 | 16.0 | defense.ramp-regen-max-pct=0.40, defense.ramp-regen-ramptime-ms=9000, defense.ramp-regen-start-pct=0.07 | 41.5 | 0.00 | sustains | hardest | DoT-heavy |
| Deepfreeze Ward | +0 | 16.0 | defense.absorb-ramp-max-pct=0.18, defense.absorb-ramp-start-pct=0.04, defense.absorb-ramptime-ms=12000, defense.shield-duration-ms=9000, defense.shield-interval-ms=9000, defense.shield-pct=0.14 | 10.9 | -474 | 82.1s | avg mob | DoT-heavy |
| Deepfreeze Ward | +3 | 16.0 | defense.absorb-ramp-max-pct=0.27, defense.absorb-ramp-start-pct=0.04, defense.absorb-ramptime-ms=12000, defense.shield-duration-ms=9000, defense.shield-interval-ms=9000, defense.shield-pct=0.23 | 18.7 | 0.00 | 8004s | hardest | DoT-heavy |
| Fortress Core | +0 | 16.0 | defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.22 | 14.3 | -474 | 131s | avg mob | DoT-heavy |
| Fortress Core | +3 | 16.0 | defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.34 | 25.9 | 0.00 | sustains | hardest | DoT-heavy |
| Glacial Ward | +0 | 16.0 | defense.absorb-pct=0.12, defense.shield-duration-ms=9000, defense.shield-interval-ms=9000, defense.shield-pct=0.17 | 12.0 | -474 | 144s | avg mob | DoT-heavy |
| Glacial Ward | +3 | 16.0 | defense.absorb-pct=0.21, defense.shield-duration-ms=9000, defense.shield-interval-ms=9000, defense.shield-pct=0.26 | 20.2 | 0.00 | sustains | hardest | DoT-heavy |
| Grave-Tide Pulse | +0 | 16.0 | defense.in-combat-regen-pct=0.08, defense.regen-burst-interval-ms=8000, defense.regen-burst-pct=0.10 | 18.9 | -474 | 211s | avg mob | DoT-heavy |
| Grave-Tide Pulse | +3 | 16.0 | defense.in-combat-regen-pct=0.14, defense.regen-burst-interval-ms=8000, defense.regen-burst-pct=0.16 | 37.8 | 0.00 | sustains | hardest | DoT-heavy |
| Inferno Core | +0 | 16.0 | defense.in-combat-regen-pct=0.19, defense.kill-burst-pct=0.11 (kill-burst undercounted) | 25.8 | -474 | 275s | avg mob | DoT-heavy |
| Inferno Core | +3 | 16.0 | defense.in-combat-regen-pct=0.27, defense.kill-burst-pct=0.18 (kill-burst undercounted) | 45.6 | 0.00 | sustains | hardest | DoT-heavy |
| Last Oasis | +0 | 16.0 | defense.cleanse-empty-heal-pct=0.07, defense.cleanse-interval-ms=6000, defense.cleanse-per-stack-heal-pct=0.02, defense.cleanse-stacks=2.00 | 10.6 | -474 | 63.3s | avg mob | DoT-heavy |
| Last Oasis | +3 | 16.0 | defense.cleanse-empty-heal-pct=0.12, defense.cleanse-interval-ms=6000, defense.cleanse-per-stack-heal-pct=0.02, defense.cleanse-stacks=2.00 | 17.9 | 0.00 | 274s | hardest | DoT-heavy |
| Necrotic Pulse | +0 | 16.0 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.13 | 14.0 | -474 | 3381s | avg mob | DoT-heavy |
| Necrotic Pulse | +3 | 16.0 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.22 | 26.0 | 0.00 | sustains | hardest | DoT-heavy |
| Overgrowth Pulse | +0 | 16.0 | defense.overheal-shield-pct=0.50, defense.ramp-regen-max-pct=0.22, defense.ramp-regen-ramptime-ms=9000, defense.ramp-regen-start-pct=0.07 | 21.2 | -474 | 168s | avg mob | DoT-heavy |
| Overgrowth Pulse | +3 | 16.0 | defense.overheal-shield-pct=0.50, defense.ramp-regen-max-pct=0.31, defense.ramp-regen-ramptime-ms=9000, defense.ramp-regen-start-pct=0.07 | 35.3 | 0.00 | sustains | hardest | DoT-heavy |
| Pressure Vessel | +0 | 16.0 | defense.absorb-pct=0.16, defense.regen-burst-interval-ms=8000, defense.regen-burst-pct=0.10 | 11.4 | -474 | 83.8s | avg mob | DoT-heavy |
| Pressure Vessel | +3 | 16.0 | defense.absorb-pct=0.25, defense.regen-burst-interval-ms=8000, defense.regen-burst-pct=0.16 | 18.6 | 0.00 | 401s | hardest | DoT-heavy |
| Shieldmend Ward | +0 | 16.0 | defense.shield-break-heal-pct=0.25, defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.18 | 12.8 | -474 | 65.7s | avg mob | DoT-heavy |
| Shieldmend Ward | +3 | 16.0 | defense.shield-break-heal-pct=0.25, defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.27 | 22.1 | 0.00 | sustains | hardest | DoT-heavy |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-3 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mountain | 79.7 atk / 0.30 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Plaguebound Mantle/Inferno Core | 40620 | 0.27 | 89.3 | 89.1 | sustains | 0.22% | Safe |
| Swamp | 14.0 atk / 0.43 aps / 75.3 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Grave Ward/Inferno Core | 830 | 45.6 | 89.3 | 43.7 | sustains | 0.22% | Safe |
| Caverns | 63.3 atk / 0.36 aps / 8.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Grave Ward/Inferno Core | 2800 | 5.13 | 89.3 | 84.2 | sustains | 0.22% | Safe |
| Jungle | 29.3 atk / 0.71 aps / 3.33 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Grave Ward/Inferno Core | 4259 | 2.65 | 89.3 | 86.7 | sustains | 0.22% | Safe |
| Tundra | 50.0 atk / 0.35 aps / 0.00 dot / ×1.00 | Slinger / Marksman / Breacher / No spec · Primal Canopy/Inferno Core | 67429 | 0.11 | 35.0 | 34.9 | sustains | 0.24% | Safe |
| Desert | 42.7 atk / 0.44 aps / 0.00 dot / ×1.00 | Slinger / Marksman / Breacher / No spec · Primal Canopy/Inferno Core | 57539 | 0.14 | 35.0 | 34.9 | sustains | 0.24% | Safe |
| Volcanic | 36.0 atk / 0.51 aps / 0.00 dot / ×1.45 | Slinger / Marksman / Breacher / No spec · Primal Canopy/Inferno Core | 48549 | 0.16 | 35.0 | 34.9 | sustains | 0.24% | Safe |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Crag-Gorged Horn-Behemoth | Frost-Plated Rime-Mammoth | Cinder-Shell Magma-Salamander | Deep-Core Burrow-Gorger | Dune-Carapace Monarch | Apex Bramble-Slasher | Rot-Spore Croc-Behemoth |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Conduit | sustains | sustains | sustains | sustains | sustains | sustains | 15.1s |
| Slinger | sustains | sustains | sustains | sustains | sustains | sustains | 22.1s |
| Spirit | sustains | sustains | sustains | sustains | sustains | sustains | 93.5s |
| Squire | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Striker | sustains | sustains | sustains | sustains | sustains | sustains | 44.8s |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crag-Gorged Horn-Behemoth | 125 atk / 0.24 aps / 0.00 dot / ×2.20 | Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle | Inferno Core | 1984 | sustains | 87.1 | 31.5% | Safe |
| Frost-Plated Rime-Mammoth | 125 atk / 0.24 aps / 0.00 dot / ×1.80 | Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle | Inferno Core | 1984 | sustains | 87.1 | 23.2% | Safe |
| Cinder-Shell Magma-Salamander | 110 atk / 0.33 aps / 0.00 dot / ×2.00 | Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle | Inferno Core | 3007 | sustains | 88.5 | 22.4% | Safe |
| Deep-Core Burrow-Gorger | 120 atk / 0.22 aps / 0.00 dot / ×1.80 | Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle | Inferno Core | 2187 | sustains | 88.5 | 21.5% | Safe |
| Dune-Carapace Monarch | 120 atk / 0.33 aps / 0.00 dot / ×1.60 | Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle | Inferno Core | 2187 | sustains | 85.5 | 17.5% | Safe |
| Apex Bramble-Slasher | 64.0 atk / 0.67 aps / 0.00 dot / ×1.40 | Squire / Bulwark / Vanguard / No spec | Permafrost Sovereign | Inferno Core | 32832 | sustains | 97.9 | 3.31% | Safe |
| Rot-Spore Croc-Behemoth | 16.0 atk / 0.29 aps / 96.0 dot / ×4.00 | Squire / Bulwark / Vanguard / No spec | Grave Ward | Inferno Core | 809 | sustains | 31.5 | 0.22% | Safe |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Deathless Duneplate | 1371 | 585 | 3051 | 1531 | 1251 |
| Deep Sea Carapace | 973 | 416 | 1393 | 1076 | 772 |
| Grave Ward | 2167 | 940 | 1797 | 1252 | 1363 |
| Lava-Tempered Hide | 1287 | 550 | 1523 | 1091 | 950 |
| Permafrost Sovereign | 1435 | 613 | 1696 | 1216 | 1058 |
| Plaguebound Mantle | 2167 | 940 | 2839 | 1538 | 1681 |
| Primal Canopy | 1281 | 540 | 2164 | 1671 | 1064 |
| Pyroclasm Mantle | 1371 | 585 | 3683 | 1630 | 1312 |
| Stormwall Plate | 1032 | 441 | 1690 | 1119 | 862 |
| Titan's Keep | 1032 | 441 | 3780 | 1474 | 1051 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Permafrost Sovereign, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Ancient Canopy | 2794 | 1193 | 3330 | 2379 | 2065 |
| Deepfreeze Ward | 1913 | 817 | 2349 | 1701 | 1469 |
| Fortress Core | 2191 | 935 | 2624 | 1873 | 1623 |
| Glacial Ward | 1969 | 841 | 2438 | 1777 | 1533 |
| Grave-Tide Pulse | 2651 | 1132 | 3156 | 2256 | 1959 |
| Inferno Core | 2954 | 1262 | 3519 | 2515 | 2183 |
| Last Oasis | 1879 | 802 | 2244 | 1602 | 1391 |
| Necrotic Pulse | 2193 | 937 | 2611 | 1866 | 1621 |
| Overgrowth Pulse | 2552 | 1090 | 3045 | 2175 | 1887 |
| Pressure Vessel | 1905 | 814 | 2364 | 1732 | 1496 |
| Shieldmend Ward | 2047 | 874 | 2454 | 1751 | 1517 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire / Bulwark / Vanguard / No spec | Grave Ward/Inferno Core | 7344 | 1892 | 7.47 | 89.3 | sustains | 0.22% |
| Squire / Knight / Vanguard / No spec | Grave Ward/Inferno Core | 6842 | 1843 | 7.47 | 81.9 | sustains | 0.22% |
| Apprentice / Rime-Bound / Hexblade / No spec | Grave Ward/Inferno Core | 6274 | 2579 | 5.30 | 43.0 | sustains | 0.22% |
| Squire / Warrior / Vanguard / No spec | Grave Ward/Inferno Core | 5874 | 1786 | 7.47 | 67.0 | sustains | 0.23% |
| Apprentice / Rime-Bound / Harbinger / No spec | Grave Ward/Inferno Core | 5837 | 2482 | 5.30 | 39.0 | sustains | 0.23% |
| Apprentice / Ember mage / Hexblade / No spec | Grave Ward/Inferno Core | 5755 | 2488 | 5.30 | 38.0 | sustains | 0.23% |
| Apprentice / Ember mage / Harbinger / No spec | Grave Ward/Inferno Core | 5336 | 2390 | 5.30 | 34.3 | sustains | 0.24% |
| Apprentice / Venom vessel / Hexblade / No spec | Grave Ward/Inferno Core | 5332 | 2430 | 5.30 | 33.7 | sustains | 0.24% |
| Squire / Bulwark / Sentinel / No spec | Grave Ward/Inferno Core | 5116 | 1823 | 7.47 | 54.0 | sustains | 0.22% |
| Spirit / Phantasm / Haunt / No spec | Grave Ward/Inferno Core | 4936 | 1672 | 7.47 | 53.5 | sustains | 0.24% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit / Light Frame / Far Range / No spec | Grave Ward/Inferno Core | 3194 | 1571 | 7.47 | 26.6 | sustains | 0.26% |
| Conduit / Medium Frame / Far Range / No spec | Grave Ward/Inferno Core | 3293 | 1619 | 7.47 | 27.4 | sustains | 0.25% |
| Slinger / Scout / Deadeye / No spec | Grave Ward/Inferno Core | 3313 | 1629 | 7.35 | 27.1 | sustains | 0.25% |
| Conduit / Light Frame / Close Range / No spec | Grave Ward/Inferno Core | 3334 | 1640 | 7.47 | 27.8 | sustains | 0.25% |
| Conduit / Heavy Frame / Far Range / No spec | Grave Ward/Inferno Core | 3401 | 1672 | 7.47 | 28.3 | sustains | 0.24% |
| Conduit / Medium Frame / Close Range / No spec | Grave Ward/Inferno Core | 3434 | 1689 | 7.47 | 28.6 | sustains | 0.24% |
| Slinger / Marksman / Deadeye / No spec | Grave Ward/Inferno Core | 3521 | 1666 | 7.37 | 30.0 | sustains | 0.25% |
| Conduit / Heavy Frame / Close Range / No spec | Grave Ward/Inferno Core | 3541 | 1741 | 7.47 | 29.5 | sustains | 0.23% |
| Striker / Flurry / Phantom-Blade / No spec | Grave Ward/Inferno Core | 3617 | 1619 | 7.47 | 32.7 | sustains | 0.25% |
| Slinger / Artillerist / Deadeye / No spec | Grave Ward/Inferno Core | 3690 | 1683 | 7.40 | 32.6 | sustains | 0.24% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| armor < -25% tier avg | Deep Sea Carapace | survival 973 vs avg 1412 |
| armor > +25% tier avg | Grave Ward | survival 2167 vs avg 1412 |
| armor > +25% tier avg | Plaguebound Mantle | survival 2167 vs avg 1412 |
| armor < -25% tier avg | Stormwall Plate | survival 1032 vs avg 1412 |
| armor < -25% tier avg | Titan's Keep | survival 1032 vs avg 1412 |
| charm > +25% tier avg | Inferno Core | survival 2954 vs avg 2277 |
| dominant charm | Inferno Core | best survival in every matchup profile |
| sustains too early | 36 build(s) | already immortal vs avg mobs on entry (+0) gear |

