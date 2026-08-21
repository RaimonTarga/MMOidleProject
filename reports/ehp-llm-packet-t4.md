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
| Prev-tier +3 vs current mobs | T3 +3 | 46.4 atk / 0.42 aps / 5.95 dot / ×1.13 | 1240 | 9.08 | sustains | 100% | 0 |
| Current +0 vs current mobs (entry) | T4 +0 | 46.4 atk / 0.42 aps / 5.95 dot / ×1.13 | 1396 | 8.26 | 835s | 91.7% | 0 |
| Current +3 vs current mobs (geared) | T4 +3 | 46.4 atk / 0.42 aps / 5.95 dot / ×1.13 | 2658 | 22.3 | sustains | 100% | 0 |
| Current +3 vs boss/elite | T4 +3 | 125 atk / 0.24 aps / 0.00 dot / ×1.60 | 2367 | 18.1 | sustains | 100% | 0 |
| Current +3 vs next-tier mobs | T4 +3 | 90.8 atk / 0.41 aps / 10.1 dot / ×1.61 | 1939 | 15.0 | 1058s | 94.4% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite | Current +3 vs next-tier mobs |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 1474 | 1635 | 3330 | 1714 | 2305 |
| Conduit | 1118 | 1316 | 2223 | 1421 | 1639 |
| Slinger | 1013 | 1210 | 2107 | 1991 | 1540 |
| Spirit | 967 | 1160 | 1986 | 1219 | 1371 |
| Squire | 1536 | 1622 | 3408 | 5724 | 2579 |
| Striker | 1330 | 1434 | 2896 | 2135 | 2201 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deathless Duneplate | +0 | 165 | 38.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=2.00, defense.debuff-resistance=0.30, defense.post-cheat-death-heal-ms=4000, defense.post-cheat-death-heal-pct=0.30 | 1388 | 199s | -2.26 | avg mob | DoT-heavy |
| Deathless Duneplate | +5 | 365 | 83.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=2.00, defense.debuff-resistance=0.30, defense.post-cheat-death-heal-ms=4000, defense.post-cheat-death-heal-pct=0.30 | 2539 | 233s | 1.30 | hardest | DoT-heavy |
| Deep Sea Carapace | +0 | 90.0 | 24.0 | 22.0% | 0.00 | defense.sustained-fight-dr-bonus=0.01, defense.sustained-fight-dr-max=0.05, defense.sustained-fight-ramptime-ms=10000 | 648 | 95.5s | -7.09 | avg mob | DoT-heavy |
| Deep Sea Carapace | +5 | 200 | 54.0 | 32.0% | 0.00 | defense.sustained-fight-dr-bonus=0.01, defense.sustained-fight-dr-max=0.05, defense.sustained-fight-ramptime-ms=10000 | 1638 | 124s | -1.35 | hardest | DoT-heavy |
| Grave Ward | +0 | 150 | 20.0 | 0.00% | 0.00 | defense.debt-cheat-death=1.00, defense.dot-resistance=0.40, defense.hit-to-dot-pct=0.08 | 821 | 88.1s | -6.50 | avg mob | boss |
| Grave Ward | +5 | 330 | 40.0 | 0.00% | 0.00 | defense.debt-cheat-death=1.00, defense.dot-resistance=0.40, defense.hit-to-dot-pct=0.08 | 3791 | 155s | 3.01 | avg mob | boss |
| Lava-Tempered Hide | +0 | 150 | 28.0 | 0.00% | 0.00 | defense.hardening-max=24.0, defense.hardening-per-sec=3.00, defense.hardening-reset-pct=0.25, defense.overheal-shield-pct=0.50 | 938 | 66.6s | -5.45 | avg mob | DoT-heavy |
| Lava-Tempered Hide | +5 | 330 | 63.0 | 0.00% | 0.00 | defense.hardening-max=24.0, defense.hardening-per-sec=3.00, defense.hardening-reset-pct=0.25, defense.overheal-shield-pct=0.50 | 2349 | 388s | 0.74 | hardest | DoT-heavy |
| Permafrost Sovereign | +0 | 180 | 28.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.stationary-dr-pct=0.20, defense.stationary-dr-ramptime-ms=5000 | 1050 | 144s | -4.97 | avg mob | DoT-heavy |
| Permafrost Sovereign | +5 | 390 | 63.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.stationary-dr-pct=0.20, defense.stationary-dr-ramptime-ms=5000 | 2677 | 107s | 1.70 | hardest | DoT-heavy |
| Plaguebound Mantle | +0 | 150 | 16.0 | 0.00% | 0.00 | defense.debuff-resistance=0.25, defense.dot-resistance=0.35, defense.hit-plating-duration-ms=4000, defense.hit-plating-max-stacks=5.00, defense.hit-plating-per-stack=1.00, defense.hit-to-dot-pct=0.08 | 668 | 86.0s | -8.71 | avg mob | boss |
| Plaguebound Mantle | +5 | 330 | 46.0 | 0.00% | 0.00 | defense.debuff-resistance=0.25, defense.dot-resistance=0.35, defense.hit-plating-duration-ms=4000, defense.hit-plating-max-stacks=5.00, defense.hit-plating-per-stack=1.00, defense.hit-to-dot-pct=0.08 | 3584 | 147s | 2.84 | avg mob | DoT-heavy |
| Primal Canopy | +0 | 145 | 24.0 | 0.00% | 0.55 | defense.evade-mitigation=0.20 | 919 | 73.8s | -5.21 | avg mob | DoT-heavy |
| Primal Canopy | +5 | 320 | 54.0 | 0.00% | 0.70 | defense.evade-mitigation=0.20 | 2361 | 443s | 0.75 | hardest | DoT-heavy |
| Pyroclasm Mantle | +0 | 165 | 38.0 | 0.00% | 0.00 | defense.hardening-max=32.0, defense.hardening-max-dr-bonus=0.06, defense.hardening-max-dr-ms=3000, defense.hardening-per-sec=4.00, defense.hardening-reset-pct=0.25 | 1388 | 86.4s | -2.26 | avg mob | DoT-heavy |
| Pyroclasm Mantle | +5 | 365 | 88.0 | 0.00% | 0.00 | defense.hardening-max=32.0, defense.hardening-max-dr-bonus=0.06, defense.hardening-max-dr-ms=3000, defense.hardening-per-sec=4.00, defense.hardening-reset-pct=0.25 | 2539 | 101s | 1.30 | hardest | DoT-heavy |
| Stormwall Plate | +0 | 100 | 30.0 | 14.0% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.shield-break-hp-recovery-pct=0.30 | 838 | 77.4s | -5.19 | avg mob | DoT-heavy |
| Stormwall Plate | +5 | 225 | 70.0 | 14.0% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.shield-break-hp-recovery-pct=0.30 | 1775 | 188s | -0.95 | hardest | DoT-heavy |
| Titan's Keep | +0 | 100 | 40.0 | 12.0% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.max-hit-rearms-shield=1.00 | 1075 | 99.5s | -3.09 | avg mob | DoT-heavy |
| Titan's Keep | +5 | 225 | 90.0 | 12.0% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.max-hit-rearms-shield=1.00 | 1775 | 188s | -0.95 | hardest | DoT-heavy |

## Charm Comparison

_Reference armor Permafrost Sovereign +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | hpRegen | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ancient Canopy | +0 | 16.0 | defense.ramp-regen-max-pct=0.14, defense.ramp-regen-ramptime-ms=9000, defense.ramp-regen-start-pct=0.04 | 15.5 | -1627 | 459s | avg mob | DoT-heavy |
| Ancient Canopy | +5 | 16.0 | defense.ramp-regen-max-pct=0.24, defense.ramp-regen-ramptime-ms=9000, defense.ramp-regen-start-pct=0.04 | 35.5 | 0.00 | sustains | hardest | DoT-heavy |
| Deepfreeze Ward | +0 | 16.0 | defense.absorb-ramp-max-pct=0.18, defense.absorb-ramp-start-pct=0.04, defense.absorb-ramptime-ms=12000, defense.shield-duration-ms=9000, defense.shield-interval-ms=9000, defense.shield-pct=0.14 | 11.5 | -1627 | 180s | avg mob | DoT-heavy |
| Deepfreeze Ward | +5 | 16.0 | defense.absorb-ramp-max-pct=0.33, defense.absorb-ramp-start-pct=0.04, defense.absorb-ramptime-ms=12000, defense.shield-duration-ms=9000, defense.shield-interval-ms=9000, defense.shield-pct=0.29 | 29.5 | 0.00 | sustains | hardest | DoT-heavy |
| Fortress Heart | +0 | 16.0 | defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.18 | 13.5 | -1627 | 231s | avg mob | DoT-heavy |
| Fortress Heart | +5 | 16.0 | defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.38 | 38.5 | 0.00 | sustains | hardest | DoT-heavy |
| Glacial Ward | +0 | 16.0 | defense.absorb-pct=0.12, defense.shield-duration-ms=9000, defense.shield-interval-ms=9000, defense.shield-pct=0.17 | 12.7 | -1627 | 306s | avg mob | DoT-heavy |
| Glacial Ward | +5 | 16.0 | defense.absorb-pct=0.27, defense.shield-duration-ms=9000, defense.shield-interval-ms=9000, defense.shield-pct=0.32 | 31.5 | 0.00 | sustains | hardest | DoT-heavy |
| Grave-Tide Pulse | +0 | 16.0 | defense.in-combat-regen-pct=0.04, defense.regen-burst-interval-ms=8000, defense.regen-burst-pct=0.04 | 12.5 | -1627 | 167s | avg mob | DoT-heavy |
| Grave-Tide Pulse | +5 | 16.0 | defense.in-combat-regen-pct=0.09, defense.regen-burst-interval-ms=8000, defense.regen-burst-pct=0.09 | 34.6 | 0.00 | sustains | hardest | DoT-heavy |
| Inferno Heart | +0 | 16.0 | defense.in-combat-regen-pct=0.06, defense.kill-burst-pct=0.04 (kill-burst undercounted) | 12.6 | -1627 | 186s | avg mob | DoT-heavy |
| Inferno Heart | +5 | 16.0 | defense.in-combat-regen-pct=0.16, defense.kill-burst-pct=0.14 (kill-burst undercounted) | 38.9 | 0.00 | sustains | hardest | DoT-heavy |
| Last Oasis | +0 | 16.0 | defense.cleanse-empty-heal-pct=0.07, defense.cleanse-interval-ms=6000, defense.cleanse-per-stack-heal-pct=0.02, defense.cleanse-stacks=2.00 | 11.1 | -1627 | 229s | avg mob | DoT-heavy |
| Last Oasis | +5 | 16.0 | defense.cleanse-empty-heal-pct=0.15, defense.cleanse-interval-ms=6000, defense.cleanse-per-stack-heal-pct=0.02, defense.cleanse-stacks=2.00 | 27.5 | 0.00 | sustains | hardest | DoT-heavy |
| Necrotic Pulse | +0 | 16.0 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.11 | 13.6 | -1627 | 139s | avg mob | DoT-heavy |
| Necrotic Pulse | +5 | 16.0 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.26 | 40.0 | 0.00 | sustains | hardest | DoT-heavy |
| Overgrowth Pulse | +0 | 16.0 | defense.overheal-shield-pct=0.25, defense.ramp-regen-max-pct=0.12, defense.ramp-regen-ramptime-ms=9000, defense.ramp-regen-start-pct=0.04 | 14.5 | -1627 | 196s | avg mob | DoT-heavy |
| Overgrowth Pulse | +5 | 16.0 | defense.overheal-shield-pct=0.25, defense.ramp-regen-max-pct=0.22, defense.ramp-regen-ramptime-ms=9000, defense.ramp-regen-start-pct=0.04 | 33.8 | 0.00 | sustains | hardest | DoT-heavy |
| Pressure Vessel | +0 | 16.0 | defense.absorb-pct=0.16, defense.regen-burst-interval-ms=8000, defense.regen-burst-pct=0.10 | 12.0 | -1627 | 112s | avg mob | DoT-heavy |
| Pressure Vessel | +5 | 16.0 | defense.absorb-pct=0.31, defense.regen-burst-interval-ms=8000, defense.regen-burst-pct=0.20 | 28.7 | 0.00 | sustains | hardest | DoT-heavy |
| Shieldmend Ward | +0 | 16.0 | defense.shield-break-heal-pct=0.25, defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.18 | 13.5 | -1627 | 231s | avg mob | DoT-heavy |
| Shieldmend Ward | +5 | 16.0 | defense.shield-break-heal-pct=0.25, defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.33 | 34.8 | 0.00 | sustains | hardest | DoT-heavy |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-3 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mountain | 79.7 atk / 0.30 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Permafrost Sovereign/Fortress Heart | 52421 | 0.30 | 76.0 | 75.7 | sustains | 0.15% | Safe |
| Swamp | 28.0 atk / 0.43 aps / 32.3 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Grave Ward/Fortress Heart | 1298 | 19.8 | 67.0 | 47.2 | sustains | 0.17% | Safe |
| Caverns | 63.3 atk / 0.36 aps / 8.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Plaguebound Mantle/Fortress Heart | 2865 | 6.25 | 67.0 | 60.7 | sustains | 0.52% | Safe |
| Jungle | 29.3 atk / 0.71 aps / 3.33 dot / ×1.15 | Squire / Bulwark / Vanguard / No spec · Grave Ward/Fortress Heart | 5234 | 2.69 | 67.0 | 64.3 | sustains | 0.17% | Safe |
| Tundra | 50.0 atk / 0.35 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Primal Canopy/Fortress Heart | 47535 | 0.21 | 65.5 | 65.3 | sustains | 0.18% | Safe |
| Desert | 42.0 atk / 0.45 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Primal Canopy/Fortress Heart | 39929 | 0.27 | 65.5 | 65.2 | sustains | 0.18% | Safe |
| Volcanic | 36.0 atk / 0.51 aps / 0.00 dot / ×1.61 | Squire / Bulwark / Vanguard / No spec · Primal Canopy/Fortress Heart | 34225 | 0.30 | 65.5 | 65.2 | sustains | 0.18% | Safe |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Crag-Gorged Horn-Behemoth | Frost-Plated Rime-Mammoth | Deep-Core Burrow-Gorger | Cinder-Shell Magma-Salamander | Dune-Carapace Monarch | Rot-Spore Croc-Behemoth | Apex Bramble-Slasher |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice | sustains | sustains | sustains | sustains | sustains | 558s | sustains |
| Conduit | sustains | sustains | sustains | sustains | sustains | 50.6s | sustains |
| Slinger | sustains | sustains | sustains | sustains | sustains | 48.2s | sustains |
| Spirit | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Squire | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Striker | sustains | sustains | sustains | sustains | sustains | sustains | sustains |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crag-Gorged Horn-Behemoth | 125 atk / 0.24 aps / 0.00 dot / ×1.60 | Squire / Bulwark / Vanguard / No spec | Titan's Keep | Fortress Heart | 13938 | sustains | 50.6 | 14.6% | Safe |
| Frost-Plated Rime-Mammoth | 125 atk / 0.24 aps / 0.00 dot / ×1.60 | Squire / Bulwark / Vanguard / No spec | Titan's Keep | Fortress Heart | 13938 | sustains | 50.6 | 14.6% | Safe |
| Deep-Core Burrow-Gorger | 120 atk / 0.22 aps / 0.00 dot / ×1.60 | Squire / Bulwark / Vanguard / No spec | Titan's Keep | Fortress Heart | 53520 | sustains | 51.3 | 13.0% | Safe |
| Cinder-Shell Magma-Salamander | 110 atk / 0.33 aps / 0.00 dot / ×1.70 | Squire / Bulwark / Vanguard / No spec | Deathless Duneplate | Fortress Heart | 68640 | sustains | 71.7 | 11.2% | Safe |
| Dune-Carapace Monarch | 120 atk / 0.33 aps / 0.00 dot / ×1.15 | Squire / Bulwark / Vanguard / No spec | Titan's Keep | Fortress Heart | 53520 | sustains | 51.2 | 3.36% | Safe |
| Rot-Spore Croc-Behemoth | 32.0 atk / 0.29 aps / 48.0 dot / ×4.00 | Squire / Bulwark / Vanguard / No spec | Grave Ward | Fortress Heart | 1145 | sustains | 37.9 | 11.4% | Safe |
| Apex Bramble-Slasher | 64.0 atk / 0.67 aps / 0.00 dot / ×1.40 | Squire / Bulwark / Vanguard / No spec | Primal Canopy | Fortress Heart | 60844 | sustains | 65.1 | 2.65% | Safe |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Deathless Duneplate | 2985 | 952 | 57751 | 21424 | 3314 |
| Deep Sea Carapace | 1926 | 614 | 5179 | 1772 | 1490 |
| Grave Ward | 4438 | 1499 | 1744 | 1315 | 1638 |
| Lava-Tempered Hide | 2761 | 880 | 17090 | 2291 | 2317 |
| Permafrost Sovereign | 3146 | 1003 | 19473 | 2610 | 2640 |
| Plaguebound Mantle | 4198 | 1377 | 2200 | 1464 | 1866 |
| Primal Canopy | 2774 | 864 | 9833 | 2969 | 2209 |
| Pyroclasm Mantle | 2985 | 952 | 68230 | 27799 | 3364 |
| Stormwall Plate | 2087 | 665 | 20157 | 3135 | 2050 |
| Titan's Keep | 2087 | 665 | 48215 | 23903 | 2352 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Permafrost Sovereign, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Ancient Canopy | 4843 | 1544 | 33048 | 4145 | 4122 |
| Deepfreeze Ward | 4479 | 1428 | 31962 | 3970 | 3889 |
| Fortress Heart | 5038 | 1606 | 35323 | 4360 | 4329 |
| Glacial Ward | 4605 | 1469 | 32746 | 4115 | 4014 |
| Grave-Tide Pulse | 4787 | 1526 | 32736 | 4100 | 4077 |
| Inferno Heart | 5052 | 1611 | 34231 | 4315 | 4296 |
| Last Oasis | 4352 | 1388 | 30264 | 3747 | 3714 |
| Necrotic Pulse | 5122 | 1633 | 34626 | 4371 | 4354 |
| Overgrowth Pulse | 4739 | 1511 | 32456 | 4061 | 4036 |
| Pressure Vessel | 4421 | 1410 | 30742 | 3936 | 3834 |
| Shieldmend Ward | 4808 | 1533 | 33922 | 4169 | 4134 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire / Bulwark / Vanguard / No spec | Grave Ward/Fortress Heart | 10094 | 3694 | 3.98 | 67.0 | sustains | 0.17% |
| Squire / Knight / Vanguard / No spec | Grave Ward/Fortress Heart | 9467 | 3465 | 3.98 | 62.8 | sustains | 0.18% |
| Squire / Warrior / Vanguard / No spec | Grave Ward/Fortress Heart | 9032 | 3306 | 3.98 | 59.9 | sustains | 0.39% |
| Apprentice / Rime-Bound / Hexblade / No spec | Grave Ward/Fortress Heart | 7151 | 4573 | 2.87 | 19.5 | sustains | 1.16% |
| Squire / Bulwark / Sentinel / No spec | Grave Ward/Fortress Heart | 6902 | 3535 | 3.98 | 35.2 | sustains | 0.18% |
| Squire / Knight / Sentinel / No spec | Grave Ward/Fortress Heart | 6454 | 3306 | 3.98 | 33.0 | sustains | 0.39% |
| Striker / Breaker / In-Fighter / No spec | Grave Ward/Fortress Heart | 6287 | 3376 | 3.98 | 30.5 | sustains | 0.57% |
| Squire / Warrior / Sentinel / No spec | Grave Ward/Fortress Heart | 6143 | 3146 | 3.98 | 31.4 | sustains | 1.01% |
| Apprentice / Ember mage / Hexblade / No spec | Plaguebound Mantle/Fortress Heart | 6111 | 3907 | 3.18 | 18.4 | sustains | 1.63% |
| Striker / Skirmisher / In-Fighter / No spec | Grave Ward/Fortress Heart | 5943 | 3191 | 3.98 | 28.8 | sustains | 1.20% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Slinger / Scout / Deadeye / No spec | Permafrost Sovereign/Fortress Heart | 2918 | 1868 | 6.28 | 17.4 | sustains | 0.43% |
| Conduit / Splinter / Vigil / No spec | Permafrost Sovereign/Fortress Heart | 2975 | 1904 | 6.37 | 18.0 | sustains | 0.21% |
| Slinger / Marksman / Deadeye / No spec | Permafrost Sovereign/Fortress Heart | 3015 | 1930 | 6.29 | 18.0 | sustains | 0.42% |
| Conduit / Consort / Vigil / No spec | Permafrost Sovereign/Fortress Heart | 3074 | 1968 | 6.37 | 18.6 | sustains | 0.20% |
| Slinger / Artillerist / Deadeye / No spec | Permafrost Sovereign/Fortress Heart | 3160 | 2023 | 6.30 | 18.9 | sustains | 0.20% |
| Conduit / Splinter / Harrier / No spec | Permafrost Sovereign/Fortress Heart | 3279 | 2099 | 6.37 | 19.8 | sustains | 0.19% |
| Slinger / Scout / Breacher / No spec | Permafrost Sovereign/Fortress Heart | 3328 | 2130 | 6.23 | 19.6 | sustains | 0.19% |
| Conduit / Effigy / Vigil / No spec | Plaguebound Mantle/Fortress Heart | 3350 | 2144 | 5.49 | 17.4 | sustains | 2.15% |
| Slinger / Marksman / Breacher / No spec | Permafrost Sovereign/Fortress Heart | 3424 | 2191 | 6.24 | 20.3 | sustains | 0.19% |
| Spirit / Spark / Wisp / No spec | Permafrost Sovereign/Necrotic Pulse | 3434 | 1761 | 6.37 | 28.1 | sustains | 0.45% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| armor < -25% tier avg | Deep Sea Carapace | survival 1926 vs avg 2939 |
| armor > +25% tier avg | Grave Ward | survival 4438 vs avg 2939 |
| armor > +25% tier avg | Plaguebound Mantle | survival 4198 vs avg 2939 |
| armor < -25% tier avg | Stormwall Plate | survival 2087 vs avg 2939 |
| armor < -25% tier avg | Titan's Keep | survival 2087 vs avg 2939 |
| sustains too early | 33 build(s) | already immortal vs avg mobs on entry (+0) gear |

