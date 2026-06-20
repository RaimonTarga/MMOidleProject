# MMO Idle LLM Survivability Packet - T4 (No Conduit)

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
| Prev-tier +3 vs current mobs | T3 +3 | 46.5 atk / 0.42 aps / 6.68 dot / ×1.08 | 1098 | 9.43 | sustains | 100% | 0 |
| Current +0 vs current mobs (entry) | T4 +0 | 46.5 atk / 0.42 aps / 6.68 dot / ×1.08 | 1193 | 9.25 | 423s | 93.3% | 0 |
| Current +3 vs current mobs (geared) | T4 +3 | 46.5 atk / 0.42 aps / 6.68 dot / ×1.08 | 2198 | 21.1 | sustains | 100% | 0 |
| Current +3 vs boss/elite | T4 +3 | 125 atk / 0.24 aps / 0.00 dot / ×2.20 | 1476 | 17.3 | sustains | 100% | 0 |
| Current +3 vs next-tier mobs | T4 +3 | 93.3 atk / 0.40 aps / 8.75 dot / ×1.61 | 1519 | 13.3 | sustains | 100% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite | Current +3 vs next-tier mobs |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 1324 | 1425 | 2850 | 1405 | 1732 |
| Slinger | 998 | 1095 | 1984 | 1997 | 1496 |
| Spirit | 903 | 992 | 1744 | 1101 | 1218 |
| Squire | 1208 | 1306 | 2318 | 1573 | 1700 |
| Striker | 1055 | 1146 | 2092 | 1301 | 1448 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deathless Duneplate | +0 | 165 | 38.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=2.00, defense.debuff-resistance=0.30, defense.post-cheat-death-heal-ms=4000, defense.post-cheat-death-heal-pct=0.30 | 1183 | 523s | -2.01 | avg mob | DoT-heavy |
| Deathless Duneplate | +3 | 285 | 65.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=2.00, defense.debuff-resistance=0.30, defense.post-cheat-death-heal-ms=4000, defense.post-cheat-death-heal-pct=0.30 | 1712 | 686s | 0.44 | hardest | DoT-heavy |
| Deep Sea Carapace | +0 | 90.0 | 24.0 | 22.0% | 0.00 | defense.sustained-fight-dr-bonus=0.01, defense.sustained-fight-dr-max=0.05, defense.sustained-fight-ramptime-ms=10000 | 672 | 54.6s | -6.03 | avg mob | DoT-heavy |
| Deep Sea Carapace | +3 | 156 | 42.0 | 28.0% | 0.00 | defense.sustained-fight-dr-bonus=0.01, defense.sustained-fight-dr-max=0.05, defense.sustained-fight-ramptime-ms=10000 | 1212 | 154s | -1.69 | hardest | DoT-heavy |
| Grave Ward | +0 | 150 | 20.0 | 0.00% | 0.00 | defense.debt-cheat-death=1.00, defense.dot-resistance=0.40, defense.hit-to-dot-pct=0.08 | 889 | 60.4s | -4.70 | avg mob | boss |
| Grave Ward | +3 | 258 | 32.0 | 0.00% | 0.00 | defense.debt-cheat-death=1.00, defense.dot-resistance=0.40, defense.hit-to-dot-pct=0.08 | 2030 | 126s | 0.92 | avg mob | boss |
| Lava-Tempered Hide | +0 | 150 | 28.0 | 0.00% | 0.00 | defense.hardening-max=24.0, defense.hardening-per-sec=3.00, defense.hardening-reset-pct=0.25, defense.overheal-shield-pct=0.50 | 864 | 61.9s | -4.86 | avg mob | DoT-heavy |
| Lava-Tempered Hide | +3 | 258 | 49.0 | 0.00% | 0.00 | defense.hardening-max=24.0, defense.hardening-per-sec=3.00, defense.hardening-reset-pct=0.25, defense.overheal-shield-pct=0.50 | 1608 | 146s | -0.00 | avg mob | DoT-heavy |
| Permafrost Sovereign | +0 | 180 | 28.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.stationary-dr-pct=0.20, defense.stationary-dr-ramptime-ms=5000 | 946 | 103s | -4.37 | avg mob | DoT-heavy |
| Permafrost Sovereign | +3 | 306 | 49.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.stationary-dr-pct=0.20, defense.stationary-dr-ramptime-ms=5000 | 1792 | 155s | 0.78 | avg mob | DoT-heavy |
| Plaguebound Mantle | +0 | 150 | 16.0 | 0.00% | 0.00 | defense.debuff-resistance=0.25, defense.dot-resistance=0.35, defense.hit-plating-duration-ms=4000, defense.hit-plating-max-stacks=5.00, defense.hit-plating-per-stack=1.00, defense.hit-to-dot-pct=0.08 | 740 | 59.6s | -6.42 | avg mob | boss |
| Plaguebound Mantle | +3 | 258 | 34.0 | 0.00% | 0.00 | defense.debuff-resistance=0.25, defense.dot-resistance=0.35, defense.hit-plating-duration-ms=4000, defense.hit-plating-max-stacks=5.00, defense.hit-plating-per-stack=1.00, defense.hit-to-dot-pct=0.08 | 2042 | 173s | 1.09 | avg mob | boss |
| Primal Canopy | +0 | 145 | 24.0 | 0.00% | 0.55 | defense.evade-mitigation=0.20 | 872 | 57.6s | -4.44 | hardest | DoT-heavy |
| Primal Canopy | +3 | 250 | 42.0 | 0.00% | 0.64 | defense.evade-mitigation=0.20 | 1607 | 150s | -0.02 | hardest | DoT-heavy |
| Pyroclasm Mantle | +0 | 165 | 38.0 | 0.00% | 0.00 | defense.hardening-max=32.0, defense.hardening-max-dr-bonus=0.06, defense.hardening-max-dr-ms=3000, defense.hardening-per-sec=4.00, defense.hardening-reset-pct=0.25 | 1183 | 227s | -2.01 | avg mob | DoT-heavy |
| Pyroclasm Mantle | +3 | 285 | 68.0 | 0.00% | 0.00 | defense.hardening-max=32.0, defense.hardening-max-dr-bonus=0.06, defense.hardening-max-dr-ms=3000, defense.hardening-per-sec=4.00, defense.hardening-reset-pct=0.25 | 1712 | 298s | 0.44 | hardest | DoT-heavy |
| Stormwall Plate | +0 | 100 | 30.0 | 14.0% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.shield-break-hp-recovery-pct=0.30 | 806 | 50.1s | -4.58 | avg mob | DoT-heavy |
| Stormwall Plate | +3 | 175 | 54.0 | 14.0% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.shield-break-hp-recovery-pct=0.30 | 1290 | 1119s | -1.35 | hardest | DoT-heavy |
| Titan's Keep | +0 | 100 | 40.0 | 12.0% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.max-hit-rearms-shield=1.00 | 981 | 95.9s | -2.75 | avg mob | DoT-heavy |
| Titan's Keep | +3 | 175 | 70.0 | 12.0% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.max-hit-rearms-shield=1.00 | 1290 | 1119s | -1.35 | hardest | DoT-heavy |

## Charm Comparison

_Reference armor Permafrost Sovereign +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | hpRegen | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ancient Canopy | +0 | 16.0 | defense.ramp-regen-max-pct=0.14, defense.ramp-regen-ramptime-ms=9000, defense.ramp-regen-start-pct=0.04 | 17.3 | -846 | 200s | avg mob | DoT-heavy |
| Ancient Canopy | +3 | 16.0 | defense.ramp-regen-max-pct=0.20, defense.ramp-regen-ramptime-ms=9000, defense.ramp-regen-start-pct=0.04 | 27.9 | 0.00 | sustains | avg mob | DoT-heavy |
| Deepfreeze Ward | +0 | 16.0 | defense.absorb-ramp-max-pct=0.18, defense.absorb-ramp-start-pct=0.04, defense.absorb-ramptime-ms=12000, defense.shield-duration-ms=9000, defense.shield-interval-ms=9000, defense.shield-pct=0.14 | 12.0 | -846 | 566s | avg mob | DoT-heavy |
| Deepfreeze Ward | +3 | 16.0 | defense.absorb-ramp-max-pct=0.27, defense.absorb-ramp-start-pct=0.04, defense.absorb-ramptime-ms=12000, defense.shield-duration-ms=9000, defense.shield-interval-ms=9000, defense.shield-pct=0.23 | 20.1 | 0.00 | sustains | avg mob | DoT-heavy |
| Fortress Core | +0 | 16.0 | defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.18 | 13.8 | -846 | 541s | avg mob | DoT-heavy |
| Fortress Core | +3 | 16.0 | defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.30 | 25.1 | 0.00 | sustains | avg mob | DoT-heavy |
| Glacial Ward | +0 | 16.0 | defense.absorb-pct=0.12, defense.shield-duration-ms=9000, defense.shield-interval-ms=9000, defense.shield-pct=0.17 | 13.1 | -846 | 218s | avg mob | DoT-heavy |
| Glacial Ward | +3 | 16.0 | defense.absorb-pct=0.21, defense.shield-duration-ms=9000, defense.shield-interval-ms=9000, defense.shield-pct=0.26 | 21.5 | 0.00 | sustains | avg mob | DoT-heavy |
| Grave-Tide Pulse | +0 | 16.0 | defense.in-combat-regen-pct=0.04, defense.regen-burst-interval-ms=8000, defense.regen-burst-pct=0.04 | 13.8 | -846 | 482s | avg mob | DoT-heavy |
| Grave-Tide Pulse | +3 | 16.0 | defense.in-combat-regen-pct=0.07, defense.regen-burst-interval-ms=8000, defense.regen-burst-pct=0.07 | 24.9 | 0.00 | sustains | avg mob | DoT-heavy |
| Inferno Core | +0 | 16.0 | defense.in-combat-regen-pct=0.06, defense.kill-burst-pct=0.04 (kill-burst undercounted) | 14.2 | -846 | 132s | avg mob | DoT-heavy |
| Inferno Core | +3 | 16.0 | defense.in-combat-regen-pct=0.12, defense.kill-burst-pct=0.10 (kill-burst undercounted) | 27.9 | 0.00 | sustains | avg mob | DoT-heavy |
| Last Oasis | +0 | 16.0 | defense.cleanse-empty-heal-pct=0.07, defense.cleanse-interval-ms=6000, defense.cleanse-per-stack-heal-pct=0.02, defense.cleanse-stacks=2.00 | 11.9 | -846 | 118s | avg mob | DoT-heavy |
| Last Oasis | +3 | 16.0 | defense.cleanse-empty-heal-pct=0.12, defense.cleanse-interval-ms=6000, defense.cleanse-per-stack-heal-pct=0.02, defense.cleanse-stacks=2.00 | 19.7 | 0.00 | sustains | avg mob | DoT-heavy |
| Necrotic Pulse | +0 | 16.0 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.11 | 14.2 | -846 | 2209s | avg mob | DoT-heavy |
| Necrotic Pulse | +3 | 16.0 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.20 | 26.4 | 0.00 | sustains | avg mob | DoT-heavy |
| Overgrowth Pulse | +0 | 16.0 | defense.overheal-shield-pct=0.25, defense.ramp-regen-max-pct=0.12, defense.ramp-regen-ramptime-ms=9000, defense.ramp-regen-start-pct=0.04 | 16.3 | -846 | 528s | avg mob | DoT-heavy |
| Overgrowth Pulse | +3 | 16.0 | defense.overheal-shield-pct=0.25, defense.ramp-regen-max-pct=0.18, defense.ramp-regen-ramptime-ms=9000, defense.ramp-regen-start-pct=0.04 | 26.4 | 0.00 | sustains | avg mob | DoT-heavy |
| Pressure Vessel | +0 | 16.0 | defense.absorb-pct=0.16, defense.regen-burst-interval-ms=8000, defense.regen-burst-pct=0.10 | 12.8 | -846 | 114s | avg mob | DoT-heavy |
| Pressure Vessel | +3 | 16.0 | defense.absorb-pct=0.25, defense.regen-burst-interval-ms=8000, defense.regen-burst-pct=0.16 | 20.5 | 0.00 | sustains | avg mob | DoT-heavy |
| Shieldmend Ward | +0 | 16.0 | defense.shield-break-heal-pct=0.25, defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.18 | 13.8 | -846 | 541s | avg mob | DoT-heavy |
| Shieldmend Ward | +3 | 16.0 | defense.shield-break-heal-pct=0.25, defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.27 | 23.5 | 0.00 | sustains | avg mob | DoT-heavy |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-3 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mountain | 79.7 atk / 0.30 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Deathless Duneplate/Ancient Canopy | 39196 | 0.30 | 70.3 | 70.0 | sustains | 0.20% | Safe |
| Swamp | 28.0 atk / 0.43 aps / 37.7 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Grave Ward/Ancient Canopy | 1003 | 23.0 | 66.4 | 43.4 | sustains | 0.22% | Safe |
| Caverns | 63.3 atk / 0.36 aps / 8.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Permafrost Sovereign/Ancient Canopy | 1895 | 8.36 | 73.3 | 64.9 | sustains | 0.19% | Safe |
| Jungle | 29.3 atk / 0.71 aps / 3.33 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Grave Ward/Ancient Canopy | 4196 | 2.69 | 66.4 | 63.7 | sustains | 0.22% | Safe |
| Tundra | 50.0 atk / 0.35 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Primal Canopy/Ancient Canopy | 38313 | 0.21 | 65.3 | 65.1 | sustains | 0.22% | Safe |
| Desert | 42.7 atk / 0.44 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Primal Canopy/Ancient Canopy | 32694 | 0.26 | 65.3 | 65.0 | sustains | 0.22% | Safe |
| Volcanic | 36.0 atk / 0.51 aps / 0.00 dot / ×1.45 | Squire / Bulwark / Vanguard / No spec · Primal Canopy/Ancient Canopy | 27585 | 0.30 | 65.3 | 65.0 | sustains | 0.22% | Safe |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Crag-Gorged Horn-Behemoth | Frost-Plated Rime-Mammoth | Cinder-Shell Magma-Salamander | Deep-Core Burrow-Gorger | Dune-Carapace Monarch | Rot-Spore Croc-Behemoth | Apex Bramble-Slasher |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice | sustains | sustains | sustains | sustains | sustains | 473s | sustains |
| Slinger | sustains | sustains | sustains | sustains | sustains | 36.9s | sustains |
| Spirit | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Squire | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Striker | sustains | sustains | sustains | sustains | sustains | 174s | sustains |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crag-Gorged Horn-Behemoth | 125 atk / 0.24 aps / 0.00 dot / ×2.20 | Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle | Ancient Canopy | 1984 | sustains | 62.9 | 31.5% | Safe |
| Frost-Plated Rime-Mammoth | 125 atk / 0.24 aps / 0.00 dot / ×1.80 | Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle | Ancient Canopy | 1984 | sustains | 62.9 | 23.2% | Safe |
| Cinder-Shell Magma-Salamander | 110 atk / 0.33 aps / 0.00 dot / ×2.00 | Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle | Ancient Canopy | 3007 | sustains | 64.3 | 22.4% | Safe |
| Deep-Core Burrow-Gorger | 120 atk / 0.22 aps / 0.00 dot / ×1.80 | Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle | Ancient Canopy | 2187 | sustains | 64.3 | 21.5% | Safe |
| Dune-Carapace Monarch | 120 atk / 0.33 aps / 0.00 dot / ×1.60 | Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle | Ancient Canopy | 2187 | sustains | 61.3 | 17.5% | Safe |
| Rot-Spore Croc-Behemoth | 32.0 atk / 0.29 aps / 48.0 dot / ×4.00 | Squire / Bulwark / Vanguard / No spec | Grave Ward | Ancient Canopy | 918 | sustains | 37.3 | 13.5% | Safe |
| Apex Bramble-Slasher | 64.0 atk / 0.67 aps / 0.00 dot / ×1.40 | Squire / Bulwark / Vanguard / No spec | Permafrost Sovereign | Ancient Canopy | 32832 | sustains | 72.6 | 3.31% | Safe |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Deathless Duneplate | 2112 | 710 | 3326 | 1636 | 1752 |
| Deep Sea Carapace | 1496 | 505 | 1497 | 1149 | 1000 |
| Grave Ward | 2510 | 1141 | 1149 | 963 | 1110 |
| Lava-Tempered Hide | 1984 | 667 | 1634 | 1163 | 1194 |
| Permafrost Sovereign | 2211 | 743 | 1820 | 1294 | 1330 |
| Plaguebound Mantle | 2522 | 1048 | 1188 | 983 | 1115 |
| Primal Canopy | 1983 | 657 | 2324 | 1784 | 1413 |
| Pyroclasm Mantle | 2112 | 710 | 4037 | 1742 | 1892 |
| Stormwall Plate | 1592 | 535 | 1823 | 1194 | 1143 |
| Titan's Keep | 1592 | 535 | 4176 | 1579 | 1566 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Permafrost Sovereign, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Ancient Canopy | 3371 | 1133 | 2806 | 1987 | 2039 |
| Deepfreeze Ward | 2930 | 985 | 2509 | 1800 | 1838 |
| Fortress Core | 3217 | 1081 | 2696 | 1907 | 1954 |
| Glacial Ward | 3013 | 1013 | 2601 | 1878 | 1914 |
| Grave-Tide Pulse | 3202 | 1076 | 2665 | 1887 | 1937 |
| Inferno Core | 3371 | 1133 | 2806 | 1987 | 2039 |
| Last Oasis | 2901 | 975 | 2416 | 1711 | 1756 |
| Necrotic Pulse | 3282 | 1103 | 2726 | 1933 | 1983 |
| Overgrowth Pulse | 3289 | 1105 | 2738 | 1939 | 1990 |
| Pressure Vessel | 2942 | 989 | 2538 | 1843 | 1879 |
| Shieldmend Ward | 3126 | 1051 | 2621 | 1854 | 1899 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire / Bulwark / Vanguard / No spec | Grave Ward/Ancient Canopy | 8628 | 2746 | 4.41 | 66.4 | sustains | 0.22% |
| Squire / Knight / Vanguard / No spec | Grave Ward/Ancient Canopy | 8068 | 2675 | 4.41 | 60.9 | sustains | 0.22% |
| Squire / Warrior / Vanguard / No spec | Grave Ward/Fortress Core | 7201 | 2592 | 4.41 | 52.0 | sustains | 0.68% |
| Apprentice / Rime-Bound / Hexblade / No spec | Grave Ward/Ancient Canopy | 6083 | 3688 | 3.18 | 19.5 | sustains | 0.22% |
| Apprentice / Ember mage / Hexblade / No spec | Grave Ward/Ancient Canopy | 5675 | 3557 | 3.18 | 17.2 | sustains | 0.69% |
| Striker / Breaker / In-Fighter / No spec | Grave Ward/Ancient Canopy | 4934 | 2581 | 4.41 | 26.6 | sustains | 0.46% |
| Apprentice / Venom vessel / Hexblade / No spec | Plaguebound Mantle/Fortress Core | 4913 | 3141 | 3.52 | 15.9 | sustains | 0.94% |
| Squire / Bulwark / Sentinel / No spec | Plaguebound Mantle/Ancient Canopy | 4732 | 2265 | 5.15 | 32.5 | sustains | 1.34% |
| Striker / Skirmisher / In-Fighter / No spec | Grave Ward/Fortress Core | 4718 | 2533 | 4.41 | 24.7 | sustains | 1.17% |
| Spirit / Phantasm / Haunt / No spec | Plaguebound Mantle/Ancient Canopy | 4597 | 2078 | 5.15 | 33.2 | sustains | 1.46% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Slinger / Scout / Deadeye / No spec | Permafrost Sovereign/Fortress Core | 2583 | 1653 | 6.97 | 16.6 | sustains | 0.23% |
| Slinger / Marksman / Deadeye / No spec | Permafrost Sovereign/Fortress Core | 2634 | 1685 | 6.99 | 16.9 | sustains | 0.22% |
| Slinger / Artillerist / Deadeye / No spec | Permafrost Sovereign/Fortress Core | 2654 | 1699 | 7.03 | 17.2 | sustains | 0.22% |
| Striker / Flurry / Phantom-Blade / No spec | Permafrost Sovereign/Fortress Core | 2885 | 1637 | 7.10 | 22.7 | sustains | 0.22% |
| Striker / Skirmisher / Phantom-Blade / No spec | Permafrost Sovereign/Fortress Core | 2976 | 1689 | 7.10 | 23.4 | sustains | 0.22% |
| Spirit / Wraith / Wisp / No spec | Permafrost Sovereign/Necrotic Pulse | 3071 | 1575 | 7.10 | 27.2 | sustains | 0.23% |
| Spirit / Spark / Wisp / No spec | Permafrost Sovereign/Necrotic Pulse | 3078 | 1578 | 7.10 | 27.2 | sustains | 0.23% |
| Apprentice / Venom vessel / Harbinger / No spec | Permafrost Sovereign/Fortress Core | 3146 | 2013 | 5.89 | 17.1 | sustains | 0.22% |
| Spirit / Phantasm / Wisp / No spec | Permafrost Sovereign/Ancient Canopy | 3200 | 1622 | 7.10 | 28.6 | sustains | 0.23% |
| Apprentice / Ember mage / Harbinger / No spec | Permafrost Sovereign/Fortress Core | 3215 | 2058 | 5.89 | 17.4 | sustains | 0.22% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| armor < -25% tier avg | Deep Sea Carapace | survival 1496 vs avg 2012 |
| armor > +25% tier avg | Plaguebound Mantle | survival 2522 vs avg 2012 |
| dominant charm | Ancient Canopy | best survival in every matchup profile |
| dominant charm | Inferno Core | best survival in every matchup profile |
| sustains too early | 28 build(s) | already immortal vs avg mobs on entry (+0) gear |

