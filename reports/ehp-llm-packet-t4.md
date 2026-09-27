# MMO Idle LLM Survivability Packet - T4

Generated from `tools/ehp-report.ts --llm-packet`. Progression-focused companion to the DPS packet.

## Assumptions / Omissions

- Player model: weapon, armour, charm and mobility only, plus skill nodes, item upgrades and class affinities. NO core, relic, rune, rite, stance or ability is equipped — the bench bots carry all six, so these numbers are comparable to each other but NOT to bench output in absolute terms.

- Class unlock tier 3. Views model progression moments, not just same-tier +3 gear.
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
| Prev-tier +3 vs current mobs | T3 +3 | 82.6 atk / 0.41 aps / 4.33 dot / ×1.00 | 710 | 1.56 | 33.2s | 44.4% | 0 |
| Current +0 vs current mobs (entry) | T4 +0 | 82.6 atk / 0.41 aps / 4.33 dot / ×1.00 | 997 | -7.49 | 26.2s | 33.3% | 0 |
| Current +3 vs current mobs (geared) | T4 +3 | 82.6 atk / 0.41 aps / 4.33 dot / ×1.00 | 1289 | 20.9 | sustains | 100% | 0 |
| Current +3 vs boss/elite | T4 +3 | 204 atk / 0.24 aps / 0.00 dot / ×1.00 | 1318 | 18.0 | 96.1s | 66.7% | 0 |
| Current +3 vs next-tier mobs | T4 +3 | 123 atk / 0.40 aps / 8.07 dot / ×1.11 | 1231 | 11.9 | 47.9s | 50.0% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite | Current +3 vs next-tier mobs |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 690 | 969 | 1232 | 1185 | 1244 |
| Conduit | 565 | 759 | 1035 | 1005 | 975 |
| Slinger | 830 | 1163 | 1479 | 1630 | 1440 |
| Spirit | 532 | 738 | 971 | 944 | 918 |
| Squire | 914 | 1314 | 1677 | 1779 | 1564 |
| Striker | 730 | 1042 | 1341 | 1362 | 1242 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deathless Duneplate | +0 | 288 | 19.0 | 18.0% | 0.00 | defense.engagement-dr-ms=10000, defense.engagement-dr-pct=0.30 | 933 | 46.5s | -17.9 | avg mob | DoT-heavy |
| Deathless Duneplate | +5 | 433 | 29.0 | 18.0% | 0.00 | defense.engagement-dr-ms=10000, defense.engagement-dr-pct=0.35 | 1501 | 116s | -13.6 | avg mob | DoT-heavy |
| Deep Sea Carapace | +0 | 330 | 0.00 | 26.0% | 0.00 | defense.debuff-resistance=0.30 | 890 | 60.6s | -21.0 | hardest | DoT-heavy |
| Deep Sea Carapace | +5 | 475 | 0.00 | 30.0% | 0.00 | defense.debuff-resistance=0.40 | 1250 | 47.6s | -18.5 | hardest | DoT-heavy |
| Grave Ward | +0 | 302 | 0.00 | 18.0% | 0.00 | defense.dot-resistance=0.25, defense.hit-to-dot-pct=0.30 | 867 | 574s | -20.3 | hardest | DoT-heavy |
| Grave Ward | +5 | 452 | 0.00 | 18.0% | 0.00 | defense.dot-resistance=0.35, defense.hit-to-dot-pct=0.30 | 1254 | 47.2s | -17.8 | hardest | DoT-heavy |
| Lava-Tempered Hide | +0 | 288 | 8.00 | 18.0% | 0.00 | defense.hit-plating-duration-ms=3000, defense.hit-plating-max-stacks=8.00, defense.hit-plating-per-stack=1.00, defense.overheal-ward-cap-pct=0.15, defense.overheal-ward-pct=0.50 | 879 | 50.9s | -19.2 | avg mob | DoT-heavy |
| Lava-Tempered Hide | +5 | 433 | 14.0 | 18.0% | 0.00 | defense.hit-plating-duration-ms=3000, defense.hit-plating-max-stacks=8.00, defense.hit-plating-per-stack=1.00, defense.overheal-ward-cap-pct=0.15, defense.overheal-ward-pct=0.50 | 1314 | 53.5s | -16.1 | avg mob | DoT-heavy |
| Permafrost Sovereign | +0 | 346 | 3.00 | 18.0% | 0.00 | defense.stationary-dr-pct=0.16, defense.stationary-dr-ramptime-ms=4000 | 974 | 223s | -19.6 | hardest | DoT-heavy |
| Permafrost Sovereign | +5 | 519 | 5.00 | 18.0% | 0.00 | defense.stationary-dr-pct=0.16, defense.stationary-dr-ramptime-ms=4000 | 1376 | 61.1s | -17.7 | hardest | DoT-heavy |
| Plaguebound Mantle | +0 | 302 | 0.00 | 18.0% | 0.00 | defense.dot-resistance=0.45, defense.hit-to-dot-pct=0.20 | 917 | 74.3s | -19.0 | DoT-heavy | boss |
| Plaguebound Mantle | +5 | 452 | 0.00 | 18.0% | 0.00 | defense.dot-resistance=0.55, defense.hit-to-dot-pct=0.20 | 1316 | 51.8s | -16.7 | DoT-heavy | boss |
| Primal Canopy | +0 | 274 | 0.00 | 10.0% | 0.36 | defense.dot-resistance=0.25, defense.evade-mitigation=0.30 | 957 | 112s | -16.9 | hardest | DoT-heavy |
| Primal Canopy | +5 | 411 | 0.00 | 10.0% | 0.44 | defense.dot-resistance=0.35, defense.evade-mitigation=0.30 | 1444 | 62.6s | -13.8 | hardest | DoT-heavy |
| Pyroclasm Mantle | +0 | 288 | 8.00 | 18.0% | 0.00 | defense.hit-plating-duration-ms=3000, defense.hit-plating-max-stacks=16.0, defense.hit-plating-per-stack=1.00 | 926 | 41.2s | -18.1 | avg mob | DoT-heavy |
| Pyroclasm Mantle | +5 | 433 | 14.0 | 18.0% | 0.00 | defense.hit-plating-duration-ms=3000, defense.hit-plating-max-stacks=16.0, defense.hit-plating-per-stack=1.00 | 1385 | 61.5s | -15.0 | avg mob | DoT-heavy |
| Stormwall Plate | +0 | 346 | 3.00 | 21.0% | 0.00 | defense.barrier-break-hp-recovery-pct=0.20, defense.barrier-pct=0.10, guard.potency-pct=0.20 | 908 | 95.4s | -21.2 | hardest | DoT-heavy |
| Stormwall Plate | +5 | 519 | 5.00 | 21.0% | 0.00 | defense.barrier-break-hp-recovery-pct=0.20, defense.barrier-pct=0.10, guard.potency-pct=0.30 | 1284 | 55.7s | -19.3 | hardest | DoT-heavy |
| Titan's Keep | +0 | 346 | 3.00 | 21.0% | 0.00 | guard.potency-pct=0.30 | 908 | 86.8s | -21.2 | hardest | DoT-heavy |
| Titan's Keep | +5 | 519 | 5.00 | 21.0% | 0.00 | guard.potency-pct=0.40 | 1284 | 50.8s | -19.3 | hardest | DoT-heavy |

## Charm Comparison

_Reference armor Permafrost Sovereign +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | recovery | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ancient Canopy | +0 | 14.0 | defense.recovery-ramp-max-pct=0.14, defense.recovery-ramp-ramptime-ms=9000, defense.recovery-ramp-start-pct=0.04, guard.recovery-ramp-advance-ms=4000 | 22.4 | -402 | 52.2s | hardest | DoT-heavy |
| Ancient Canopy | +5 | 21.0 | defense.recovery-ramp-max-pct=0.24, defense.recovery-ramp-ramptime-ms=9000, defense.recovery-ramp-start-pct=0.04, guard.recovery-ramp-advance-ms=4000 | 52.8 | 0.00 | sustains | hardest | DoT-heavy |
| Deepfreeze Ward | +0 | 14.0 | defense.absorb-ramp-max-pct=0.30, defense.absorb-ramp-start-pct=0.06, defense.absorb-ramptime-ms=12000 | 13.0 | -402 | 205s | hardest | DoT-heavy |
| Deepfreeze Ward | +5 | 21.0 | defense.absorb-ramp-max-pct=0.45, defense.absorb-ramp-start-pct=0.06, defense.absorb-ramptime-ms=12000 | 21.9 | 0.00 | 44.0s | hardest | DoT-heavy |
| Fortress Heart | +0 | 6.00 | defense.barrier-pct=0.36, guard.barrier-refill-pct=0.30 | 6.52 | -402 | 123s | hardest | DoT-heavy |
| Fortress Heart | +5 | 9.00 | defense.barrier-pct=0.42, guard.barrier-refill-pct=0.30 | 10.6 | 0.00 | 374s | hardest | DoT-heavy |
| Glacial Ward | +0 | 14.0 | defense.barrier-pct=0.22, defense.barrier-stationary-recharge-pct=0.03, guard.barrier-refill-on-control-pct=1.00 | 9.68 | -402 | 64.1s | hardest | DoT-heavy |
| Glacial Ward | +5 | 21.0 | defense.barrier-pct=0.37, defense.barrier-stationary-recharge-pct=0.03, guard.barrier-refill-on-control-pct=1.00 | 17.2 | 0.00 | 47.3s | hardest | DoT-heavy |
| Grave-Tide Pulse | +0 | 14.0 | defense.recovery-active-pct=0.04, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.04, guard.cleanse-pulse=1.00 | 18.2 | -402 | 37.9s | hardest | DoT-heavy |
| Grave-Tide Pulse | +5 | 21.0 | defense.recovery-active-pct=0.12, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.12, guard.cleanse-pulse=1.00 | 63.6 | 0.00 | sustains | hardest | DoT-heavy |
| Inferno Heart | +0 | 14.0 | defense.recovery-active-pct=0.10, defense.recovery-on-kill-pct=0.08 (on-kill Recovery undercounted) | 23.9 | -402 | 60.2s | hardest | DoT-heavy |
| Inferno Heart | +5 | 21.0 | defense.recovery-active-pct=0.20, defense.recovery-on-kill-pct=0.18 (on-kill Recovery undercounted) | 68.1 | 0.00 | sustains | hardest | DoT-heavy |
| Last Oasis | +0 | 14.0 | cleanse.cooldown-reduction-pct=0.25 | 9.68 | -402 | 52.8s | hardest | DoT-heavy |
| Last Oasis | +5 | 21.0 | cleanse.cooldown-reduction-pct=0.33 | 17.2 | 0.00 | 35.2s | hardest | DoT-heavy |
| Necrotic Pulse | +0 | 14.0 | defense.recovery-pulse-interval-ms=6000, defense.recovery-pulse-pct=0.11, guard.cleanse-pulse=1.00 | 20.1 | -402 | 43.1s | hardest | DoT-heavy |
| Necrotic Pulse | +5 | 21.0 | defense.recovery-pulse-interval-ms=6000, defense.recovery-pulse-pct=0.26, guard.cleanse-pulse=1.00 | 61.3 | 0.00 | sustains | hardest | DoT-heavy |
| Overgrowth Pulse | +0 | 14.0 | defense.overheal-ward-cap-pct=0.05, defense.overheal-ward-pct=0.10, defense.recovery-ramp-max-pct=0.12, defense.recovery-ramp-ramptime-ms=9000, defense.recovery-ramp-start-pct=0.04, guard.recovery-ramp-advance-ms=4000 | 21.0 | -402 | 46.3s | hardest | DoT-heavy |
| Overgrowth Pulse | +5 | 21.0 | defense.overheal-ward-cap-pct=0.05, defense.overheal-ward-pct=0.10, defense.recovery-ramp-max-pct=0.22, defense.recovery-ramp-ramptime-ms=9000, defense.recovery-ramp-start-pct=0.04, guard.recovery-ramp-advance-ms=4000 | 50.3 | 0.00 | 8812s | hardest | DoT-heavy |
| Pressure Vessel | +0 | 14.0 | defense.recovery-skill-potency=0.30, recovery.cooldown-reduction-pct=0.15 | 9.68 | -402 | 52.8s | hardest | DoT-heavy |
| Pressure Vessel | +5 | 21.0 | defense.recovery-skill-potency=0.40, recovery.cooldown-reduction-pct=0.25 | 17.2 | 0.00 | 35.2s | hardest | DoT-heavy |
| Shieldmend Ward | +0 | 6.00 | defense.barrier-break-heal-pct=0.25, defense.barrier-pct=0.32, guard.barrier-refill-pct=0.20 | 6.52 | -402 | 120s | hardest | DoT-heavy |
| Shieldmend Ward | +5 | 9.00 | defense.barrier-break-heal-pct=0.25, defense.barrier-pct=0.37, guard.barrier-refill-pct=0.20 | 10.6 | 0.00 | 360s | hardest | DoT-heavy |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-3 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mountain | 109 atk / 0.30 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Permafrost Sovereign/Inferno Heart | 2105 | 13.8 | 115 | 101 | sustains | 5.16% | Safe |
| Swamp | 40.7 atk / 0.43 aps / 18.3 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Plaguebound Mantle/Inferno Heart | 1670 | 17.1 | 103 | 85.6 | sustains | 2.63% | Safe |
| Caverns | 84.7 atk / 0.36 aps / 12.0 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Plaguebound Mantle/Inferno Heart | 1684 | 20.2 | 103 | 82.5 | sustains | 5.52% | Safe |
| Jungle | 61.0 atk / 0.71 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Deathless Duneplate/Inferno Heart | 3131 | 10.7 | 99.2 | 88.5 | sustains | 1.95% | Safe |
| Tundra | 159 atk / 0.35 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Permafrost Sovereign/Inferno Heart | 2057 | 24.1 | 115 | 90.7 | sustains | 7.74% | Safe |
| Desert | 73.5 atk / 0.38 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Deathless Duneplate/Inferno Heart | 2573 | 8.46 | 99.2 | 90.7 | sustains | 2.86% | Safe |
| Volcanic | 56.3 atk / 0.51 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Deathless Duneplate/Inferno Heart | 3332 | 6.58 | 99.2 | 92.6 | sustains | 1.69% | Safe |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Crag-Gorged Horn-Behemoth | Frost-Plated Rime-Mammoth | Deep-Core Burrow-Gorger | Dune-Carapace Monarch | Cinder-Shell Magma-Salamander | Apex Bramble-Slasher | Rot-Spore Croc-Behemoth |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice | sustains | sustains | sustains | sustains | sustains | 1451s | sustains |
| Conduit | sustains | sustains | sustains | 75.5s | sustains | 69.2s | 40.0s |
| Slinger | sustains | sustains | sustains | sustains | sustains | sustains | 44.5s |
| Spirit | 3933s | 3933s | sustains | 88.8s | sustains | 79.2s | 50.8s |
| Squire | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Striker | sustains | sustains | sustains | sustains | sustains | sustains | sustains |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crag-Gorged Horn-Behemoth | 204 atk / 0.24 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec | Permafrost Sovereign | Inferno Heart | 2042 | sustains | 93.6 | 9.99% | Safe |
| Frost-Plated Rime-Mammoth | 204 atk / 0.24 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec | Permafrost Sovereign | Inferno Heart | 2042 | sustains | 93.6 | 9.99% | Safe |
| Deep-Core Burrow-Gorger | 196 atk / 0.22 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec | Permafrost Sovereign | Inferno Heart | 2031 | sustains | 95.6 | 9.65% | Safe |
| Dune-Carapace Monarch | 196 atk / 0.33 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec | Permafrost Sovereign | Inferno Heart | 2031 | sustains | 86.1 | 9.65% | Safe |
| Cinder-Shell Magma-Salamander | 130 atk / 0.33 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec | Permafrost Sovereign | Inferno Heart | 2068 | sustains | 96.1 | 6.29% | Safe |
| Apex Bramble-Slasher | 104 atk / 0.67 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec | Deathless Duneplate | Inferno Heart | 2107 | sustains | 73.8 | 4.94% | Safe |
| Rot-Spore Croc-Behemoth | 52.0 atk / 0.29 aps / 78.0 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec | Plaguebound Mantle | Inferno Heart | 1640 | sustains | 57.3 | 3.39% | Safe |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Deathless Duneplate | 1746 | 1313 | 1517 | 1457 | 1462 |
| Deep Sea Carapace | 1452 | 1167 | 1560 | 1557 | 1415 |
| Grave Ward | 1453 | 1420 | 1456 | 1452 | 1448 |
| Lava-Tempered Hide | 1527 | 1213 | 1417 | 1341 | 1355 |
| Permafrost Sovereign | 1601 | 1285 | 1675 | 1661 | 1534 |
| Plaguebound Mantle | 1525 | 1701 | 1467 | 1464 | 1533 |
| Primal Canopy | 1669 | 1477 | 1738 | 1732 | 1643 |
| Pyroclasm Mantle | 1610 | 1273 | 1454 | 1341 | 1397 |
| Stormwall Plate | 1622 | 1351 | 1671 | 1654 | 1558 |
| Titan's Keep | 1493 | 1243 | 1539 | 1523 | 1435 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Permafrost Sovereign, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Ancient Canopy | 2828 | 2251 | 2964 | 2940 | 2706 |
| Deepfreeze Ward | 2047 | 1635 | 2255 | 2193 | 2015 |
| Fortress Heart | 2321 | 1856 | 2429 | 2410 | 2222 |
| Glacial Ward | 2441 | 1939 | 2561 | 2541 | 2336 |
| Grave-Tide Pulse | 3099 | 2469 | 3246 | 3221 | 2965 |
| Inferno Heart | 3212 | 2561 | 3364 | 3337 | 3073 |
| Last Oasis | 1932 | 1529 | 2031 | 2014 | 1848 |
| Necrotic Pulse | 3041 | 2423 | 3186 | 3161 | 2910 |
| Overgrowth Pulse | 2764 | 2200 | 2897 | 2874 | 2645 |
| Pressure Vessel | 1932 | 1529 | 2031 | 2014 | 1848 |
| Shieldmend Ward | 2252 | 1800 | 2358 | 2339 | 2156 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire / Bulwark / Vanguard / No spec | Deathless Duneplate/Inferno Heart | 5600 | 1910 | 15.4 | 99.2 | sustains | 3.51% |
| Squire / Knight / Vanguard / No spec | Deathless Duneplate/Inferno Heart | 5115 | 1745 | 15.8 | 93.0 | sustains | 3.88% |
| Squire / Warrior / Vanguard / No spec | Deathless Duneplate/Inferno Heart | 4758 | 1623 | 16.2 | 88.7 | sustains | 4.21% |
| Striker / Breaker / In-Fighter / No spec | Deathless Duneplate/Inferno Heart | 3866 | 1539 | 17.5 | 70.9 | sustains | 4.55% |
| Squire / Bulwark / Sentinel / No spec | Deathless Duneplate/Inferno Heart | 3626 | 1733 | 16.2 | 53.6 | sustains | 3.94% |
| Striker / Skirmisher / In-Fighter / No spec | Deathless Duneplate/Inferno Heart | 3493 | 1390 | 18.3 | 67.0 | sustains | 5.11% |
| Squire / Knight / Sentinel / No spec | Deathless Duneplate/Inferno Heart | 3311 | 1583 | 16.6 | 50.2 | sustains | 4.35% |
| Striker / Flurry / In-Fighter / No spec | Deathless Duneplate/Inferno Heart | 3267 | 1301 | 18.7 | 64.1 | sustains | 5.50% |
| Striker / Breaker / Phantom-Blade / No spec | Deathless Duneplate/Inferno Heart | 3080 | 1380 | 18.3 | 54.2 | sustains | 5.15% |
| Squire / Warrior / Sentinel / No spec | Deathless Duneplate/Inferno Heart | 3077 | 1471 | 17.0 | 47.8 | sustains | 4.73% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit / Splinter / Vigil / No spec | Deathless Duneplate/Inferno Heart | 1545 | 924 | 23.2 | 25.1 | sustains | 8.20% |
| Conduit / Consort / Vigil / No spec | Deathless Duneplate/Inferno Heart | 1598 | 955 | 23.2 | 26.0 | sustains | 7.93% |
| Spirit / Spark / Wisp / No spec | Deathless Duneplate/Inferno Heart | 1683 | 853 | 23.2 | 23.2 | sustains | 8.88% |
| Conduit / Splinter / Harrier / No spec | Deathless Duneplate/Inferno Heart | 1733 | 1036 | 22.8 | 27.7 | sustains | 7.28% |
| Spirit / Wraith / Wisp / No spec | Deathless Duneplate/Inferno Heart | 1745 | 885 | 23.2 | 24.1 | sustains | 8.57% |
| Conduit / Effigy / Vigil / No spec | Deathless Duneplate/Inferno Heart | 1765 | 1055 | 22.4 | 27.7 | sustains | 7.12% |
| Conduit / Consort / Harrier / No spec | Deathless Duneplate/Inferno Heart | 1783 | 1067 | 22.8 | 28.5 | sustains | 7.08% |
| Apprentice / Venom vessel / Harbinger / No spec | Plaguebound Mantle/Inferno Heart | 1840 | 1100 | 20.3 | 26.2 | sustains | 10.4% |
| Spirit / Phantasm / Wisp / No spec | Deathless Duneplate/Inferno Heart | 1920 | 973 | 22.4 | 25.5 | sustains | 7.72% |
| Apprentice / Ember mage / Harbinger / No spec | Plaguebound Mantle/Inferno Heart | 1934 | 1157 | 20.3 | 27.6 | sustains | 9.92% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| charm > +25% tier avg | Inferno Heart | survival 3212 vs avg 2534 |
| dominant charm | Inferno Heart | best survival in every matchup profile |
| sustains too early | 12 build(s) | already immortal vs avg mobs on entry (+0) gear |

