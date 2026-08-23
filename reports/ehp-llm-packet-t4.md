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
| Prev-tier +3 vs current mobs | T3 +3 | 140 atk / 0.41 aps / 4.33 dot / ×1.02 | 610 | -15.4 | 11.4s | 11.1% | 0 |
| Current +0 vs current mobs (entry) | T4 +0 | 140 atk / 0.41 aps / 4.33 dot / ×1.02 | 789 | -14.4 | 11.6s | 13.9% | 0 |
| Current +3 vs current mobs (geared) | T4 +3 | 140 atk / 0.41 aps / 4.33 dot / ×1.02 | 2937 | 13.6 | 102s | 75.0% | 0 |
| Current +3 vs boss/elite | T4 +3 | 204 atk / 0.24 aps / 0.00 dot / ×1.00 | 1397 | 8.03 | 50.9s | 47.2% | 0 |
| Current +3 vs next-tier mobs | T4 +3 | 212 atk / 0.40 aps / 9.50 dot / ×1.24 | 1104 | -14.9 | 13.4s | 19.4% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite | Current +3 vs next-tier mobs |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 563 | 729 | 2570 | 1238 | 1009 |
| Conduit | 506 | 634 | 1974 | 1131 | 907 |
| Slinger | 655 | 884 | 2103 | 1614 | 1259 |
| Spirit | 482 | 563 | 1667 | 971 | 835 |
| Squire | 821 | 1108 | 6244 | 1998 | 1493 |
| Striker | 630 | 815 | 3065 | 1427 | 1120 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deathless Duneplate | +0 | 165 | 38.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=2.00, defense.debuff-resistance=0.30, defense.post-cheat-death-heal-ms=4000, defense.post-cheat-death-heal-pct=0.30 | 564 | 23.9s | -36.3 | DoT-heavy | hardest |
| Deathless Duneplate | +5 | 365 | 83.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=2.00, defense.debuff-resistance=0.30, defense.post-cheat-death-heal-ms=4000, defense.post-cheat-death-heal-pct=0.30 | 2607 | 146s | -13.7 | avg mob | hardest |
| Deep Sea Carapace | +0 | 90.0 | 24.0 | 22.0% | 0.00 | defense.sustained-fight-dr-bonus=0.01, defense.sustained-fight-dr-max=0.05, defense.sustained-fight-ramptime-ms=10000 | 461 | 8.47s | -32.1 | boss | DoT-heavy |
| Deep Sea Carapace | +5 | 200 | 54.0 | 32.0% | 0.00 | defense.sustained-fight-dr-bonus=0.01, defense.sustained-fight-dr-max=0.05, defense.sustained-fight-ramptime-ms=10000 | 1182 | 59.3s | -18.5 | avg mob | DoT-heavy |
| Grave Ward | +0 | 150 | 20.0 | 0.00% | 0.00 | defense.debt-cheat-death=1.00, defense.dot-resistance=0.40, defense.hit-to-dot-pct=0.08 | 480 | 8.83s | -40.5 | DoT-heavy | hardest |
| Grave Ward | +5 | 330 | 40.0 | 0.00% | 0.00 | defense.debt-cheat-death=1.00, defense.dot-resistance=0.40, defense.hit-to-dot-pct=0.08 | 1025 | 22.9s | -30.8 | DoT-heavy | hardest |
| Lava-Tempered Hide | +0 | 150 | 28.0 | 0.00% | 0.00 | defense.hardening-max=24.0, defense.hardening-per-sec=3.00, defense.hardening-reset-pct=0.25, defense.overheal-ward-pct=0.50 | 510 | 9.63s | -38.5 | DoT-heavy | hardest |
| Lava-Tempered Hide | +5 | 330 | 63.0 | 0.00% | 0.00 | defense.hardening-max=24.0, defense.hardening-per-sec=3.00, defense.hardening-reset-pct=0.25, defense.overheal-ward-pct=0.50 | 2095 | 75.1s | -14.6 | avg mob | hardest |
| Permafrost Sovereign | +0 | 180 | 28.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.stationary-dr-pct=0.20, defense.stationary-dr-ramptime-ms=5000 | 595 | 11.2s | -36.0 | hardest | DoT-heavy |
| Permafrost Sovereign | +5 | 390 | 63.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.stationary-dr-pct=0.20, defense.stationary-dr-ramptime-ms=5000 | 1682 | 35.6s | -20.4 | avg mob | next-tier |
| Plaguebound Mantle | +0 | 150 | 16.0 | 0.00% | 0.00 | defense.debuff-resistance=0.25, defense.dot-resistance=0.35, defense.hit-plating-duration-ms=4000, defense.hit-plating-max-stacks=5.00, defense.hit-plating-per-stack=1.00, defense.hit-to-dot-pct=0.08 | 473 | 8.68s | -41.1 | DoT-heavy | boss |
| Plaguebound Mantle | +5 | 330 | 46.0 | 0.00% | 0.00 | defense.debuff-resistance=0.25, defense.dot-resistance=0.35, defense.hit-plating-duration-ms=4000, defense.hit-plating-max-stacks=5.00, defense.hit-plating-per-stack=1.00, defense.hit-to-dot-pct=0.08 | 1166 | 33.8s | -26.8 | DoT-heavy | hardest |
| Primal Canopy | +0 | 145 | 24.0 | 0.00% | 0.55 | defense.evade-mitigation=0.20 | 701 | 13.4s | -26.8 | boss | DoT-heavy |
| Primal Canopy | +5 | 320 | 54.0 | 0.00% | 0.70 | defense.evade-mitigation=0.20 | 1809 | 38.5s | -15.7 | avg mob | DoT-heavy |
| Pyroclasm Mantle | +0 | 165 | 38.0 | 0.00% | 0.00 | defense.hardening-max=32.0, defense.hardening-max-dr-bonus=0.06, defense.hardening-max-dr-ms=3000, defense.hardening-per-sec=4.00, defense.hardening-reset-pct=0.25 | 708 | 15.2s | -30.5 | DoT-heavy | hardest |
| Pyroclasm Mantle | +5 | 365 | 88.0 | 0.00% | 0.00 | defense.hardening-max=32.0, defense.hardening-max-dr-bonus=0.06, defense.hardening-max-dr-ms=3000, defense.hardening-per-sec=4.00, defense.hardening-reset-pct=0.25 | 6477 | 95.4s | -2.53 | avg mob | hardest |
| Stormwall Plate | +0 | 187 | 22.0 | 0.00% | 0.00 | defense.barrier-break-hp-recovery-pct=0.30, defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, guard.potency-pct=0.54 | 536 | 9.91s | -41.2 | hardest | avg mob |
| Stormwall Plate | +5 | 280 | 33.0 | 0.00% | 0.00 | defense.barrier-break-hp-recovery-pct=0.30, defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, guard.potency-pct=0.64 | 760 | 15.0s | -37.7 | hardest | next-tier |
| Titan's Keep | +0 | 187 | 29.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.max-hit-refills-barrier=1.00, guard.potency-pct=0.54 | 568 | 10.6s | -38.8 | hardest | avg mob |
| Titan's Keep | +5 | 280 | 44.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.max-hit-refills-barrier=1.00, guard.potency-pct=0.64 | 876 | 18.5s | -32.5 | DoT-heavy | next-tier |

## Charm Comparison

_Reference armor Stormwall Plate +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | recovery | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ancient Canopy | +0 | 16.0 | defense.recovery-ramp-max-pct=0.14, defense.recovery-ramp-ramptime-ms=9000, defense.recovery-ramp-start-pct=0.04 | 15.9 | -224 | 16.8s | hardest | avg mob |
| Ancient Canopy | +5 | 16.0 | defense.recovery-ramp-max-pct=0.24, defense.recovery-ramp-ramptime-ms=9000, defense.recovery-ramp-start-pct=0.04 | 27.5 | 0.00 | 36.1s | hardest | next-tier |
| Deepfreeze Ward | +0 | 16.0 | defense.absorb-ramp-max-pct=0.18, defense.absorb-ramp-start-pct=0.04, defense.absorb-ramptime-ms=12000, defense.barrier-pct=0.14 | 11.0 | -224 | 23.5s | hardest | DoT-heavy |
| Deepfreeze Ward | +5 | 16.0 | defense.absorb-ramp-max-pct=0.33, defense.absorb-ramp-start-pct=0.04, defense.absorb-ramptime-ms=12000, defense.barrier-pct=0.29 | 15.6 | 0.00 | 32.2s | hardest | boss |
| Fortress Heart | +0 | 6.00 | defense.barrier-pct=0.36 | 4.48 | -224 | 14.2s | hardest | avg mob |
| Fortress Heart | +5 | 9.00 | defense.barrier-pct=0.42 | 6.77 | 0.00 | 89.2s | hardest | next-tier |
| Glacial Ward | +0 | 16.0 | defense.absorb-pct=0.12, defense.barrier-pct=0.17 | 11.8 | -224 | 26.4s | hardest | DoT-heavy |
| Glacial Ward | +5 | 16.0 | defense.absorb-pct=0.27, defense.barrier-pct=0.32 | 19.2 | 0.00 | 73.6s | hardest | boss |
| Grave-Tide Pulse | +0 | 16.0 | defense.recovery-active-pct=0.04, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.04 | 13.0 | -224 | 17.7s | hardest | avg mob |
| Grave-Tide Pulse | +5 | 16.0 | defense.recovery-active-pct=0.09, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.09 | 27.0 | 0.00 | 60.6s | hardest | next-tier |
| Inferno Heart | +0 | 16.0 | defense.recovery-active-pct=0.06, defense.recovery-on-kill-pct=0.04 (on-kill Recovery undercounted) | 13.0 | -224 | 17.7s | hardest | avg mob |
| Inferno Heart | +5 | 16.0 | defense.recovery-active-pct=0.16, defense.recovery-on-kill-pct=0.14 (on-kill Recovery undercounted) | 30.1 | 0.00 | 89.4s | hardest | next-tier |
| Last Oasis | +0 | 16.0 | defense.cleanse-empty-heal-pct=0.07, defense.cleanse-interval-ms=6000, defense.cleanse-per-stack-heal-pct=0.02, defense.cleanse-stacks=2.00 | 11.5 | -224 | 31.3s | hardest | avg mob |
| Last Oasis | +5 | 16.0 | defense.cleanse-empty-heal-pct=0.15, defense.cleanse-interval-ms=6000, defense.cleanse-per-stack-heal-pct=0.02, defense.cleanse-stacks=2.00 | 21.3 | 0.00 | 41.1s | hardest | next-tier |
| Necrotic Pulse | +0 | 16.0 | defense.recovery-pulse-interval-ms=6000, defense.recovery-pulse-pct=0.11 | 14.3 | -224 | 23.4s | hardest | avg mob |
| Necrotic Pulse | +5 | 16.0 | defense.recovery-pulse-interval-ms=6000, defense.recovery-pulse-pct=0.26 | 31.8 | 0.00 | 40.5s | hardest | next-tier |
| Overgrowth Pulse | +0 | 16.0 | defense.overheal-ward-pct=0.25, defense.recovery-ramp-max-pct=0.12, defense.recovery-ramp-ramptime-ms=9000, defense.recovery-ramp-start-pct=0.04 | 14.9 | -224 | 34.8s | hardest | avg mob |
| Overgrowth Pulse | +5 | 16.0 | defense.overheal-ward-pct=0.25, defense.recovery-ramp-max-pct=0.22, defense.recovery-ramp-ramptime-ms=9000, defense.recovery-ramp-start-pct=0.04 | 26.1 | 0.00 | 42.9s | hardest | next-tier |
| Pressure Vessel | +0 | 16.0 | defense.absorb-pct=0.16, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.10 | 18.4 | -224 | 24.3s | hardest | DoT-heavy |
| Pressure Vessel | +5 | 16.0 | defense.absorb-pct=0.31, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.20 | 34.1 | 0.00 | 55.3s | hardest | boss |
| Shieldmend Ward | +0 | 6.00 | defense.barrier-break-heal-pct=0.25, defense.barrier-pct=0.32 | 4.48 | -224 | 13.8s | hardest | avg mob |
| Shieldmend Ward | +5 | 9.00 | defense.barrier-break-heal-pct=0.25, defense.barrier-pct=0.37 | 6.77 | 0.00 | 86.1s | hardest | next-tier |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-3 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mountain | 109 atk / 0.30 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Deathless Duneplate/Necrotic Pulse | 67808 | 0.30 | 70.3 | 70.0 | sustains | 0.16% | Safe |
| Swamp | 40.7 atk / 0.43 aps / 18.3 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Grave Ward/Necrotic Pulse | 1817 | 11.4 | 65.3 | 53.9 | sustains | 0.17% | Safe |
| Caverns | 89.7 atk / 0.36 aps / 12.0 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Deathless Duneplate/Necrotic Pulse | 2242 | 12.4 | 70.3 | 57.9 | sustains | 0.16% | Safe |
| Jungle | 61.0 atk / 0.71 aps / 0.00 dot / ×1.15 | Squire / Bulwark / Vanguard / No spec · Primal Canopy/Necrotic Pulse | 57992 | 0.43 | 63.9 | 63.5 | sustains | 0.20% | Safe |
| Tundra | 324 atk / 0.35 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Primal Canopy/Pressure Vessel | 1321 | 48.5 | 68.1 | 19.7 | sustains | 41.1% | Safe |
| Desert | 90.0 atk / 0.38 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Deathless Duneplate/Necrotic Pulse | 56160 | 0.38 | 70.3 | 69.9 | sustains | 0.16% | Safe |
| Volcanic | 221 atk / 0.51 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard / No spec · Pyroclasm Mantle/Necrotic Pulse | 2122 | 32.9 | 70.3 | 37.4 | sustains | 10.4% | Safe |

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
| Deathless Duneplate | 3127 | 1522 | 1103 | 1643 | 1410 |
| Deep Sea Carapace | 1379 | 980 | 1025 | 1214 | 1036 |
| Grave Ward | 1191 | 1987 | 923 | 1003 | 1011 |
| Lava-Tempered Hide | 2474 | 1408 | 970 | 1432 | 1208 |
| Permafrost Sovereign | 1966 | 1604 | 1393 | 1511 | 1355 |
| Plaguebound Mantle | 1356 | 2147 | 947 | 1056 | 1070 |
| Primal Canopy | 2095 | 1382 | 1610 | 1899 | 1571 |
| Pyroclasm Mantle | 7510 | 1522 | 1146 | 2964 | 2042 |
| Stormwall Plate | 885 | 987 | 1025 | 873 | 843 |
| Titan's Keep | 1021 | 1159 | 1051 | 933 | 888 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Stormwall Plate, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Ancient Canopy | 1428 | 1598 | 1635 | 1399 | 1346 |
| Deepfreeze Ward | 1378 | 1426 | 1750 | 1333 | 1375 |
| Fortress Heart | 1276 | 1427 | 1467 | 1254 | 1208 |
| Glacial Ward | 1480 | 1477 | 1961 | 1425 | 1514 |
| Grave-Tide Pulse | 1417 | 1586 | 1622 | 1388 | 1336 |
| Inferno Heart | 1487 | 1664 | 1703 | 1458 | 1403 |
| Last Oasis | 1288 | 1442 | 1473 | 1260 | 1214 |
| Necrotic Pulse | 1526 | 1708 | 1749 | 1497 | 1441 |
| Overgrowth Pulse | 1398 | 1565 | 1600 | 1369 | 1318 |
| Pressure Vessel | 1575 | 1556 | 2109 | 1514 | 1621 |
| Shieldmend Ward | 1238 | 1384 | 1423 | 1216 | 1172 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire / Bulwark / Vanguard / No spec | Pyroclasm Mantle/Necrotic Pulse | 21819 | 8111 | 4.74 | 70.3 | sustains | 0.16% |
| Squire / Knight / Vanguard / No spec | Pyroclasm Mantle/Necrotic Pulse | 20455 | 7604 | 4.74 | 65.9 | sustains | 0.17% |
| Squire / Bulwark / Sentinel / No spec | Pyroclasm Mantle/Necrotic Pulse | 14822 | 7760 | 4.74 | 36.2 | sustains | 0.17% |
| Squire / Warrior / Vanguard / No spec | Pyroclasm Mantle/Necrotic Pulse | 13622 | 5064 | 6.79 | 62.9 | sustains | 1.10% |
| Striker / Breaker / In-Fighter / No spec | Pyroclasm Mantle/Necrotic Pulse | 11220 | 4878 | 7.20 | 49.4 | sustains | 1.25% |
| Squire / Knight / Sentinel / No spec | Pyroclasm Mantle/Necrotic Pulse | 10293 | 5389 | 6.38 | 33.9 | sustains | 0.92% |
| Striker / Skirmisher / In-Fighter / No spec | Pyroclasm Mantle/Necrotic Pulse | 7586 | 3298 | 10.1 | 46.7 | sustains | 2.65% |
| Squire / Warrior / Sentinel / No spec | Pyroclasm Mantle/Necrotic Pulse | 6757 | 3537 | 9.26 | 32.2 | sustains | 2.31% |
| Striker / Breaker / Phantom-Blade / No spec | Pyroclasm Mantle/Necrotic Pulse | 6679 | 3274 | 10.1 | 37.1 | sustains | 2.67% |
| Striker / Flurry / In-Fighter / No spec | Pyroclasm Mantle/Necrotic Pulse | 5837 | 2538 | 12.5 | 44.7 | sustains | 3.96% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit / Splinter / Vigil / No spec | Pyroclasm Mantle/Necrotic Pulse | 2277 | 1498 | 18.7 | 15.7 | 154s | 7.87% |
| Spirit / Spark / Wisp / No spec | Pyroclasm Mantle/Necrotic Pulse | 2366 | 1300 | 19.9 | 14.6 | 102s | 9.24% |
| Slinger / Scout / Deadeye / No spec | Pyroclasm Mantle/Necrotic Pulse | 2504 | 1648 | 16.4 | 15.2 | 363s | 8.84% |
| Slinger / Marksman / Deadeye / No spec | Pyroclasm Mantle/Necrotic Pulse | 2539 | 1671 | 16.8 | 15.7 | 447s | 8.55% |
| Conduit / Consort / Vigil / No spec | Pyroclasm Mantle/Necrotic Pulse | 2584 | 1700 | 17.0 | 16.3 | 623s | 6.74% |
| Apprentice / Venom vessel / Harbinger / No spec | Pyroclasm Mantle/Necrotic Pulse | 2611 | 1717 | 16.4 | 15.9 | 811s | 7.14% |
| Spirit / Wraith / Wisp / No spec | Pyroclasm Mantle/Necrotic Pulse | 2671 | 1467 | 18.3 | 15.1 | 177s | 7.98% |
| Conduit / Splinter / Harrier / No spec | Pyroclasm Mantle/Necrotic Pulse | 2822 | 1857 | 16.6 | 17.4 | sustains | 6.12% |
| Conduit / Effigy / Vigil / No spec | Pyroclasm Mantle/Necrotic Pulse | 3047 | 2005 | 15.4 | 17.4 | sustains | 5.50% |
| Spirit / Spark / Haunt / No spec | Pyroclasm Mantle/Necrotic Pulse | 3072 | 1600 | 18.7 | 16.8 | 362s | 7.37% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| armor > +25% tier avg | Deathless Duneplate | survival 3127 vs avg 2300 |
| armor < -25% tier avg | Deep Sea Carapace | survival 1379 vs avg 2300 |
| armor < -25% tier avg | Grave Ward | survival 1191 vs avg 2300 |
| armor < -25% tier avg | Plaguebound Mantle | survival 1356 vs avg 2300 |
| armor > +25% tier avg | Pyroclasm Mantle | survival 7510 vs avg 2300 |
| armor < -25% tier avg | Stormwall Plate | survival 885 vs avg 2300 |
| armor < -25% tier avg | Titan's Keep | survival 1021 vs avg 2300 |
| sustains too early | 5 build(s) | already immortal vs avg mobs on entry (+0) gear |

