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
- **Ramping mitigations ARE modelled**, as duty-cycle averages over the 60s window, never at their printed maximum: hardening (ramp + big-hit reset, assumed spike cadence 12s when only a spike trips it), reactive plating (stack ramp against the attacker's own cadence), stationary DR (scaled by an assumed 50% stationary duty cycle — override with `--stationary-fraction`), and sustained-fight DR. Each is printed in the affected row's notes. The assumed duty cycles are the two judgement calls in this report; treat Tundra and Volcanic rows accordingly.
- **Not** modelled: core DR layer, wards, barrier recharge, barrier-break heals, on-kill Recovery.
- **Multi-enemy pressure** is not modeled; a single attacker profile is assumed (idle pulls are often several mobs).

## Progression Checkpoints

| Checkpoint | Gear | Attacker | Avg eHP | Avg net/s | Min TTL | Safe % | Blocked |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prev-tier +3 vs current mobs | T3 +3 | 121 atk / 0.41 aps / 4.33 dot / ×1.02 | 706 | -7.09 | 13.3s | 25.0% | 0 |
| Current +0 vs current mobs (entry) | T4 +0 | 121 atk / 0.41 aps / 4.33 dot / ×1.02 | 982 | -10.1 | 13.8s | 30.6% | 0 |
| Current +3 vs current mobs (geared) | T4 +3 | 121 atk / 0.41 aps / 4.33 dot / ×1.02 | 4294 | 19.2 | sustains | 100% | 0 |
| Current +3 vs boss/elite | T4 +3 | 204 atk / 0.24 aps / 0.00 dot / ×1.00 | 1397 | 8.03 | 50.9s | 47.2% | 0 |
| Current +3 vs next-tier mobs | T4 +3 | 184 atk / 0.40 aps / 9.50 dot / ×1.24 | 1272 | -7.53 | 17.0s | 30.6% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite | Current +3 vs next-tier mobs |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 689 | 946 | 5111 | 1238 | 1228 |
| Conduit | 610 | 824 | 3279 | 1131 | 1048 |
| Slinger | 688 | 958 | 2978 | 1614 | 1267 |
| Spirit | 514 | 716 | 2551 | 971 | 918 |
| Squire | 982 | 1415 | 6545 | 1998 | 1841 |
| Striker | 753 | 1030 | 5303 | 1427 | 1332 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deathless Duneplate | +0 | 165 | 38.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=2.00, defense.debuff-resistance=0.30, defense.post-cheat-death-heal-ms=4000, defense.post-cheat-death-heal-pct=0.30 | 608 | 30.8s | -29.2 | DoT-heavy | hardest |
| Deathless Duneplate | +5 | 365 | 83.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=2.00, defense.debuff-resistance=0.30, defense.post-cheat-death-heal-ms=4000, defense.post-cheat-death-heal-pct=0.30 | 3732 | 137s | -7.20 | avg mob | hardest |
| Deep Sea Carapace | +0 | 90.0 | 24.0 | 22.0% | 0.00 | defense.sustained-fight-dr-bonus=0.01, defense.sustained-fight-dr-max=0.05, defense.sustained-fight-ramptime-ms=10000 | 472 | 10.1s | -27.2 | avg mob | DoT-heavy |
| Deep Sea Carapace | +5 | 200 | 54.0 | 32.0% | 0.00 | defense.sustained-fight-dr-bonus=0.01, defense.sustained-fight-dr-max=0.05, defense.sustained-fight-ramptime-ms=10000 | 1328 | 47.4s | -14.0 | avg mob | DoT-heavy |
| Grave Ward | +0 | 150 | 20.0 | 0.00% | 0.00 | defense.debt-cheat-death=1.00, defense.dot-resistance=0.40, defense.hit-to-dot-pct=0.08 | 492 | 10.5s | -34.3 | DoT-heavy | hardest |
| Grave Ward | +5 | 330 | 40.0 | 0.00% | 0.00 | defense.debt-cheat-death=1.00, defense.dot-resistance=0.40, defense.hit-to-dot-pct=0.08 | 1124 | 85.4s | -24.0 | DoT-heavy | hardest |
| Lava-Tempered Hide | +0 | 150 | 28.0 | 0.00% | 0.00 | defense.hardening-max=24.0, defense.hardening-per-sec=3.00, defense.hardening-reset-pct=0.25, defense.overheal-ward-pct=0.50 | 589 | 13.5s | -29.3 | DoT-heavy | hardest |
| Lava-Tempered Hide | +5 | 330 | 63.0 | 0.00% | 0.00 | defense.hardening-max=24.0, defense.hardening-per-sec=3.00, defense.hardening-reset-pct=0.25, defense.overheal-ward-pct=0.50 | 3208 | 106s | -7.83 | avg mob | hardest |
| Permafrost Sovereign | +0 | 180 | 28.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.stationary-dr-pct=0.20, defense.stationary-dr-ramptime-ms=5000 | 612 | 13.6s | -30.4 | hardest | next-tier |
| Permafrost Sovereign | +5 | 390 | 63.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.stationary-dr-pct=0.20, defense.stationary-dr-ramptime-ms=5000 | 2068 | 59.1s | -13.9 | avg mob | hardest |
| Plaguebound Mantle | +0 | 150 | 16.0 | 0.00% | 0.00 | defense.debuff-resistance=0.25, defense.dot-resistance=0.35, defense.hit-plating-duration-ms=4000, defense.hit-plating-max-stacks=5.00, defense.hit-plating-per-stack=1.00, defense.hit-to-dot-pct=0.08 | 484 | 10.3s | -34.8 | DoT-heavy | boss |
| Plaguebound Mantle | +5 | 330 | 46.0 | 0.00% | 0.00 | defense.debuff-resistance=0.25, defense.dot-resistance=0.35, defense.hit-plating-duration-ms=4000, defense.hit-plating-max-stacks=5.00, defense.hit-plating-per-stack=1.00, defense.hit-to-dot-pct=0.08 | 1330 | 40.8s | -19.9 | DoT-heavy | hardest |
| Primal Canopy | +0 | 145 | 24.0 | 0.00% | 0.55 | defense.evade-mitigation=0.20 | 715 | 16.1s | -22.6 | boss | DoT-heavy |
| Primal Canopy | +5 | 320 | 54.0 | 0.00% | 0.70 | defense.evade-mitigation=0.20 | 2015 | 70.7s | -11.7 | avg mob | DoT-heavy |
| Pyroclasm Mantle | +0 | 165 | 38.0 | 0.00% | 0.00 | defense.hardening-max=32.0, defense.hardening-max-dr-bonus=0.06, defense.hardening-max-dr-ms=3000, defense.hardening-per-sec=4.00, defense.hardening-reset-pct=0.25 | 967 | 181s | -18.6 | avg mob | hardest |
| Pyroclasm Mantle | +5 | 365 | 88.0 | 0.00% | 0.00 | defense.hardening-max=32.0, defense.hardening-max-dr-bonus=0.06, defense.hardening-max-dr-ms=3000, defense.hardening-per-sec=4.00, defense.hardening-reset-pct=0.25 | 7265 | 143s | -0.48 | avg mob | hardest |
| Stormwall Plate | +0 | 187 | 22.0 | 0.00% | 0.00 | defense.barrier-break-hp-recovery-pct=0.30, defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, guard.potency-pct=0.54 | 534 | 11.5s | -35.9 | hardest | avg mob |
| Stormwall Plate | +5 | 280 | 33.0 | 0.00% | 0.00 | defense.barrier-break-hp-recovery-pct=0.30, defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, guard.potency-pct=0.64 | 809 | 19.5s | -30.5 | DoT-heavy | next-tier |
| Titan's Keep | +0 | 187 | 29.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.max-hit-refills-barrier=1.00, guard.potency-pct=0.54 | 581 | 12.8s | -33.0 | hardest | next-tier |
| Titan's Keep | +5 | 280 | 44.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.max-hit-refills-barrier=1.00, guard.potency-pct=0.64 | 961 | 29.6s | -25.4 | DoT-heavy | next-tier |

## Charm Comparison

_Reference armor Stormwall Plate +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | recovery | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ancient Canopy | +0 | 16.0 | defense.recovery-ramp-max-pct=0.14, defense.recovery-ramp-ramptime-ms=9000, defense.recovery-ramp-start-pct=0.04 | 15.9 | -274 | 18.3s | hardest | avg mob |
| Ancient Canopy | +5 | 16.0 | defense.recovery-ramp-max-pct=0.24, defense.recovery-ramp-ramptime-ms=9000, defense.recovery-ramp-start-pct=0.04 | 27.4 | 0.00 | 95.6s | DoT-heavy | next-tier |
| Deepfreeze Ward | +0 | 16.0 | defense.absorb-ramp-max-pct=0.18, defense.absorb-ramp-start-pct=0.04, defense.absorb-ramptime-ms=12000, defense.barrier-pct=0.14 | 10.4 | -274 | 21.8s | hardest | DoT-heavy |
| Deepfreeze Ward | +5 | 16.0 | defense.absorb-ramp-max-pct=0.33, defense.absorb-ramp-start-pct=0.04, defense.absorb-ramptime-ms=12000, defense.barrier-pct=0.29 | 14.3 | 0.00 | 64.3s | hardest | next-tier |
| Fortress Heart | +0 | 6.00 | defense.barrier-pct=0.36 | 4.43 | -274 | 17.2s | hardest | avg mob |
| Fortress Heart | +5 | 9.00 | defense.barrier-pct=0.42 | 6.70 | 0.00 | 83.1s | DoT-heavy | next-tier |
| Glacial Ward | +0 | 16.0 | defense.absorb-pct=0.12, defense.barrier-pct=0.17 | 11.1 | -274 | 23.9s | hardest | DoT-heavy |
| Glacial Ward | +5 | 16.0 | defense.absorb-pct=0.27, defense.barrier-pct=0.32 | 17.1 | 0.00 | 103s | hardest | boss |
| Grave-Tide Pulse | +0 | 16.0 | defense.recovery-active-pct=0.04, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.04 | 12.9 | -274 | 15.6s | hardest | avg mob |
| Grave-Tide Pulse | +5 | 16.0 | defense.recovery-active-pct=0.09, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.09 | 26.9 | 0.00 | 56.7s | DoT-heavy | next-tier |
| Inferno Heart | +0 | 16.0 | defense.recovery-active-pct=0.06, defense.recovery-on-kill-pct=0.04 (on-kill Recovery undercounted) | 12.9 | -274 | 15.6s | hardest | avg mob |
| Inferno Heart | +5 | 16.0 | defense.recovery-active-pct=0.16, defense.recovery-on-kill-pct=0.14 (on-kill Recovery undercounted) | 30.0 | 0.00 | 77.9s | DoT-heavy | next-tier |
| Last Oasis | +0 | 16.0 | defense.cleanse-empty-heal-pct=0.07, defense.cleanse-interval-ms=6000, defense.cleanse-per-stack-heal-pct=0.02, defense.cleanse-stacks=2.00 | 11.4 | -274 | 25.5s | hardest | avg mob |
| Last Oasis | +5 | 16.0 | defense.cleanse-empty-heal-pct=0.15, defense.cleanse-interval-ms=6000, defense.cleanse-per-stack-heal-pct=0.02, defense.cleanse-stacks=2.00 | 21.2 | 0.00 | 40.5s | DoT-heavy | next-tier |
| Necrotic Pulse | +0 | 16.0 | defense.recovery-pulse-interval-ms=6000, defense.recovery-pulse-pct=0.11 | 14.2 | -274 | 16.6s | hardest | avg mob |
| Necrotic Pulse | +5 | 16.0 | defense.recovery-pulse-interval-ms=6000, defense.recovery-pulse-pct=0.26 | 31.7 | 0.00 | 51.7s | DoT-heavy | next-tier |
| Overgrowth Pulse | +0 | 16.0 | defense.overheal-ward-pct=0.25, defense.recovery-ramp-max-pct=0.12, defense.recovery-ramp-ramptime-ms=9000, defense.recovery-ramp-start-pct=0.04 | 14.9 | -274 | 17.3s | hardest | avg mob |
| Overgrowth Pulse | +5 | 16.0 | defense.overheal-ward-pct=0.25, defense.recovery-ramp-max-pct=0.22, defense.recovery-ramp-ramptime-ms=9000, defense.recovery-ramp-start-pct=0.04 | 26.1 | 0.00 | 61.6s | DoT-heavy | next-tier |
| Pressure Vessel | +0 | 16.0 | defense.absorb-pct=0.16, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.10 | 17.4 | -274 | 20.0s | hardest | DoT-heavy |
| Pressure Vessel | +5 | 16.0 | defense.absorb-pct=0.31, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.20 | 31.8 | 0.00 | 46.6s | hardest | boss |
| Shieldmend Ward | +0 | 6.00 | defense.barrier-break-heal-pct=0.25, defense.barrier-pct=0.32 | 4.43 | -274 | 16.7s | hardest | avg mob |
| Shieldmend Ward | +5 | 9.00 | defense.barrier-break-heal-pct=0.25, defense.barrier-pct=0.37 | 6.70 | 0.00 | 80.2s | DoT-heavy | next-tier |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-3 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mountain | 109 atk / 0.30 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Deathless Duneplate/Necrotic Pulse | 67808 | 0.30 | 70.3 | 70.0 | sustains | 0.16% | Safe |
| Swamp | 40.7 atk / 0.43 aps / 18.3 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Grave Ward/Necrotic Pulse | 1817 | 11.4 | 65.3 | 53.9 | sustains | 0.17% | Safe |
| Caverns | 89.7 atk / 0.36 aps / 12.0 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Deathless Duneplate/Necrotic Pulse | 2242 | 12.4 | 70.3 | 57.9 | sustains | 0.16% | Safe |
| Jungle | 61.0 atk / 0.71 aps / 0.00 dot / ×1.15 | Squire / Bulwark / Vanguard / No spec · Primal Canopy/Necrotic Pulse | 57992 | 0.43 | 63.9 | 63.5 | sustains | 0.20% | Safe |
| Tundra | 285 atk / 0.35 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Primal Canopy/Pressure Vessel | 1377 | 41.0 | 66.3 | 25.3 | sustains | 34.7% | Safe |
| Desert | 90.0 atk / 0.38 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Deathless Duneplate/Necrotic Pulse | 56160 | 0.38 | 70.3 | 69.9 | sustains | 0.16% | Safe |
| Volcanic | 151 atk / 0.51 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Pyroclasm Mantle/Necrotic Pulse | 23556 | 2.03 | 70.3 | 68.3 | sustains | 0.64% | Safe |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Crag-Gorged Horn-Behemoth | Frost-Plated Rime-Mammoth | Deep-Core Burrow-Gorger | Dune-Carapace Monarch | Cinder-Shell Magma-Salamander | Apex Bramble-Slasher | Rot-Spore Croc-Behemoth |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice | sustains | sustains | sustains | sustains | sustains | sustains | 32.1s |
| Conduit | 6439s | 6439s | sustains | 102s | 14652s | sustains | 15.9s |
| Slinger | sustains | sustains | sustains | sustains | sustains | sustains | 15.6s |
| Spirit | 334s | 334s | sustains | 91.5s | 270s | sustains | 20.5s |
| Squire | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Striker | sustains | sustains | sustains | sustains | sustains | sustains | 308s |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crag-Gorged Horn-Behemoth | 204 atk / 0.24 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle | Necrotic Pulse | 2546 | sustains | 58.4 | 8.01% | Safe |
| Frost-Plated Rime-Mammoth | 204 atk / 0.24 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle | Necrotic Pulse | 2546 | sustains | 58.4 | 8.01% | Safe |
| Deep-Core Burrow-Gorger | 196 atk / 0.22 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle | Necrotic Pulse | 2844 | sustains | 60.7 | 6.89% | Safe |
| Dune-Carapace Monarch | 196 atk / 0.33 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle | Necrotic Pulse | 2844 | sustains | 56.0 | 6.89% | Safe |
| Cinder-Shell Magma-Salamander | 179 atk / 0.33 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle | Necrotic Pulse | 3989 | sustains | 61.0 | 4.49% | Safe |
| Apex Bramble-Slasher | 104 atk / 0.67 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec | Deathless Duneplate | Necrotic Pulse | 64896 | sustains | 69.6 | 0.16% | Safe |
| Rot-Spore Croc-Behemoth | 52.0 atk / 0.29 aps / 78.0 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec | Grave Ward | Necrotic Pulse | 1149 | sustains | 18.3 | 0.17% | Safe |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Deathless Duneplate | 4438 | 1522 | 1218 | 1643 | 1593 |
| Deep Sea Carapace | 1551 | 980 | 1070 | 1214 | 1079 |
| Grave Ward | 1306 | 1987 | 944 | 1003 | 1056 |
| Lava-Tempered Hide | 3821 | 1408 | 1036 | 1432 | 1401 |
| Permafrost Sovereign | 2434 | 1604 | 1339 | 1511 | 1448 |
| Plaguebound Mantle | 1549 | 2147 | 982 | 1056 | 1133 |
| Primal Canopy | 2339 | 1382 | 1689 | 1899 | 1627 |
| Pyroclasm Mantle | 8349 | 1522 | 1376 | 2964 | 2672 |
| Stormwall Plate | 940 | 987 | 942 | 873 | 829 |
| Titan's Keep | 1120 | 1159 | 977 | 933 | 888 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Stormwall Plate, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Ancient Canopy | 1519 | 1598 | 1500 | 1399 | 1328 |
| Deepfreeze Ward | 1436 | 1426 | 1539 | 1333 | 1332 |
| Fortress Heart | 1357 | 1427 | 1348 | 1254 | 1190 |
| Glacial Ward | 1528 | 1477 | 1697 | 1425 | 1455 |
| Grave-Tide Pulse | 1508 | 1586 | 1488 | 1388 | 1318 |
| Inferno Heart | 1582 | 1664 | 1564 | 1458 | 1384 |
| Last Oasis | 1371 | 1442 | 1351 | 1260 | 1198 |
| Necrotic Pulse | 1624 | 1708 | 1606 | 1497 | 1421 |
| Overgrowth Pulse | 1488 | 1565 | 1469 | 1369 | 1301 |
| Pressure Vessel | 1622 | 1556 | 1817 | 1514 | 1554 |
| Shieldmend Ward | 1317 | 1384 | 1307 | 1216 | 1154 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle/Necrotic Pulse | 19088 | 7096 | 4.74 | 70.3 | sustains | 0.16% |
| Squire / Knight / Vanguard / No spec | Pyroclasm Mantle/Necrotic Pulse | 17895 | 6653 | 4.74 | 65.9 | sustains | 0.17% |
| Squire / Warrior / Vanguard / No spec | Pyroclasm Mantle/Necrotic Pulse | 17070 | 6346 | 4.74 | 62.9 | sustains | 0.18% |
| Striker / Breaker / In-Fighter / No spec | Pyroclasm Mantle/Necrotic Pulse | 14909 | 6482 | 4.74 | 49.4 | sustains | 0.18% |
| Striker / Skirmisher / In-Fighter / No spec | Pyroclasm Mantle/Necrotic Pulse | 14098 | 6129 | 4.74 | 46.7 | sustains | 0.19% |
| Squire / Bulwark / Sentinel / No spec | Pyroclasm Mantle/Necrotic Pulse | 12967 | 6789 | 4.74 | 36.2 | sustains | 0.17% |
| Striker / Breaker / Phantom-Blade / No spec | Pyroclasm Mantle/Necrotic Pulse | 12411 | 6084 | 4.74 | 37.1 | sustains | 0.19% |
| Squire / Knight / Sentinel / No spec | Pyroclasm Mantle/Necrotic Pulse | 12120 | 6346 | 4.74 | 33.9 | sustains | 0.18% |
| Apprentice / Rime-Bound / Hexblade / No spec | Pyroclasm Mantle/Necrotic Pulse | 11575 | 7608 | 3.96 | 19.4 | sustains | 0.18% |
| Squire / Warrior / Sentinel / No spec | Pyroclasm Mantle/Necrotic Pulse | 11534 | 6039 | 4.74 | 32.2 | sustains | 0.19% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Spirit / Spark / Wisp / No spec | Pyroclasm Mantle/Necrotic Pulse | 3289 | 1807 | 12.5 | 14.6 | sustains | 4.86% |
| Conduit / Splinter / Vigil / No spec | Pyroclasm Mantle/Necrotic Pulse | 3292 | 2166 | 11.3 | 15.7 | sustains | 3.82% |
| Slinger / Scout / Deadeye / No spec | Pyroclasm Mantle/Necrotic Pulse | 3364 | 2213 | 10.7 | 15.2 | sustains | 4.65% |
| Slinger / Marksman / Deadeye / No spec | Pyroclasm Mantle/Necrotic Pulse | 3424 | 2253 | 10.9 | 15.7 | sustains | 4.50% |
| Spirit / Wraith / Wisp / No spec | Pyroclasm Mantle/Necrotic Pulse | 3920 | 2154 | 10.9 | 15.1 | sustains | 3.76% |
| Conduit / Consort / Vigil / No spec | Pyroclasm Mantle/Necrotic Pulse | 3987 | 2623 | 9.67 | 16.3 | sustains | 2.83% |
| Apprentice / Venom vessel / Harbinger / No spec | Pyroclasm Mantle/Necrotic Pulse | 4085 | 2688 | 9.19 | 15.9 | sustains | 3.12% |
| Conduit / Splinter / Harrier / No spec | Pyroclasm Mantle/Necrotic Pulse | 4438 | 2920 | 9.26 | 17.4 | sustains | 2.45% |
| Spirit / Spark / Haunt / No spec | Pyroclasm Mantle/Necrotic Pulse | 4443 | 2314 | 11.3 | 16.8 | sustains | 3.58% |
| Slinger / Artillerist / Deadeye / No spec | Pyroclasm Mantle/Necrotic Pulse | 4659 | 3065 | 8.39 | 16.5 | sustains | 2.57% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| armor > +25% tier avg | Deathless Duneplate | survival 4438 vs avg 2785 |
| armor < -25% tier avg | Deep Sea Carapace | survival 1551 vs avg 2785 |
| armor < -25% tier avg | Grave Ward | survival 1306 vs avg 2785 |
| armor > +25% tier avg | Lava-Tempered Hide | survival 3821 vs avg 2785 |
| armor < -25% tier avg | Plaguebound Mantle | survival 1549 vs avg 2785 |
| armor > +25% tier avg | Pyroclasm Mantle | survival 8349 vs avg 2785 |
| armor < -25% tier avg | Stormwall Plate | survival 940 vs avg 2785 |
| armor < -25% tier avg | Titan's Keep | survival 1120 vs avg 2785 |
| sustains too early | 11 build(s) | already immortal vs avg mobs on entry (+0) gear |

