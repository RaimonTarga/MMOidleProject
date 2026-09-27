# MMO Idle LLM Survivability Packet - T3

Generated from `tools/ehp-report.ts --llm-packet`. Progression-focused companion to the DPS packet.

## Assumptions / Omissions

- Player model: weapon, armour, charm and mobility only, plus skill nodes, item upgrades and class affinities. NO core, relic, rune, rite, stance or ability is equipped — the bench bots carry all six, so these numbers are comparable to each other but NOT to bench output in absolute terms.

- Class unlock tier 2. Views model progression moments, not just same-tier +3 gear.
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
| Prev-tier +3 vs current mobs | T2 +3 | 41.0 atk / 0.44 aps / 6.65 dot / ×1.00 | 405 | -5.72 | 19.3s | 16.7% | 0 |
| Current +0 vs current mobs (entry) | T3 +0 | 41.0 atk / 0.44 aps / 6.65 dot / ×1.00 | 575 | 1.81 | 55.3s | 44.4% | 0 |
| Current +3 vs current mobs (geared) | T3 +3 | 41.0 atk / 0.44 aps / 6.65 dot / ×1.00 | 712 | 8.80 | 292s | 91.7% | 0 |
| Current +3 vs boss/elite | T3 +3 | 128 atk / 0.24 aps / 0.00 dot / ×1.00 | 742 | 6.45 | 68.1s | 61.1% | 0 |
| Current +3 vs next-tier mobs | T3 +3 | 82.6 atk / 0.41 aps / 4.33 dot / ×1.00 | 710 | 1.56 | 33.2s | 44.4% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite | Current +3 vs next-tier mobs |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 413 | 594 | 742 | 671 | 690 |
| Conduit | 338 | 489 | 604 | 572 | 565 |
| Slinger | 447 | 605 | 753 | 906 | 830 |
| Spirit | 319 | 463 | 567 | 538 | 532 |
| Squire | 500 | 705 | 878 | 996 | 914 |
| Striker | 413 | 593 | 729 | 767 | 730 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deepscale Hide | +0 | 150 | 0.00 | 26.0% | 0.00 | - | 480 | 29.9s | -15.0 | hardest | DoT-heavy |
| Deepscale Hide | +5 | 225 | 0.00 | 30.0% | 0.00 | - | 648 | 47.5s | -13.6 | hardest | DoT-heavy |
| Emberforge Plate | +0 | 150 | 5.00 | 14.0% | 0.00 | defense.hit-plating-duration-ms=3000, defense.hit-plating-max-stacks=10.0, defense.hit-plating-per-stack=1.00 | 566 | 53.7s | -12.4 | avg mob | DoT-heavy |
| Emberforge Plate | +5 | 225 | 9.00 | 14.0% | 0.00 | defense.hit-plating-duration-ms=3000, defense.hit-plating-max-stacks=10.0, defense.hit-plating-per-stack=1.00 | 812 | 47.4s | -10.3 | avg mob | DoT-heavy |
| Eternal Duneplate | +0 | 150 | 10.0 | 14.0% | 0.00 | defense.engagement-dr-ms=8000, defense.engagement-dr-pct=0.30 | 534 | 42.9s | -13.3 | hardest | DoT-heavy |
| Eternal Duneplate | +5 | 225 | 15.0 | 14.0% | 0.00 | defense.engagement-dr-ms=8000, defense.engagement-dr-pct=0.35 | 776 | 44.4s | -11.0 | hardest | DoT-heavy |
| Glacial Bulwark | +0 | 180 | 2.00 | 14.0% | 0.00 | defense.stationary-dr-pct=0.12, defense.stationary-dr-ramptime-ms=4000 | 535 | 47.2s | -14.8 | hardest | DoT-heavy |
| Glacial Bulwark | +5 | 270 | 3.00 | 14.0% | 0.00 | defense.stationary-dr-pct=0.12, defense.stationary-dr-ramptime-ms=4000 | 722 | 39.1s | -13.7 | hardest | DoT-heavy |
| Plaguebound Shroud | +0 | 158 | 0.00 | 14.0% | 0.00 | defense.dot-resistance=0.35, defense.hit-to-dot-pct=0.20 | 555 | 50.0s | -13.1 | DoT-heavy | boss |
| Plaguebound Shroud | +5 | 239 | 0.00 | 14.0% | 0.00 | defense.dot-resistance=0.45, defense.hit-to-dot-pct=0.20 | 778 | 43.5s | -11.5 | DoT-heavy | boss |
| Summit Aegis | +0 | 180 | 2.00 | 17.0% | 0.00 | guard.potency-pct=0.25 | 519 | 39.2s | -15.3 | hardest | DoT-heavy |
| Summit Aegis | +5 | 270 | 3.00 | 17.0% | 0.00 | guard.potency-pct=0.35 | 701 | 37.4s | -14.2 | hardest | DoT-heavy |
| Wildgrowth Weave | +0 | 143 | 0.00 | 7.00% | 0.32 | defense.dot-resistance=0.20, defense.evade-mitigation=0.25 | 539 | 38.4s | -12.8 | hardest | DoT-heavy |
| Wildgrowth Weave | +5 | 216 | 0.00 | 7.00% | 0.40 | defense.dot-resistance=0.30, defense.evade-mitigation=0.25 | 775 | 42.5s | -10.7 | hardest | DoT-heavy |

## Charm Comparison

_Reference armor Glacial Bulwark +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | recovery | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bastion Heart | +0 | 3.00 | defense.barrier-pct=0.28, guard.barrier-refill-pct=0.20 | 3.34 | -188 | 36.0s | hardest | DoT-heavy |
| Bastion Heart | +5 | 5.00 | defense.barrier-pct=0.34, guard.barrier-refill-pct=0.20 | 5.02 | 0.00 | 118s | hardest | DoT-heavy |
| Echo Geode | +0 | 7.00 | defense.absorb-guard-bonus-pct=0.10, defense.absorb-pct=0.20 | 6.52 | -188 | 44.0s | boss | DoT-heavy |
| Echo Geode | +5 | 10.0 | defense.absorb-guard-bonus-pct=0.10, defense.absorb-pct=0.24 | 9.20 | 0.00 | 125s | boss | DoT-heavy |
| Frostward Charm | +0 | 10.0 | defense.barrier-pct=0.18, defense.barrier-stationary-recharge-pct=0.02, guard.barrier-refill-on-control-pct=0.50 | 5.07 | -188 | 51.5s | hardest | DoT-heavy |
| Frostward Charm | +5 | 14.0 | defense.barrier-pct=0.28, defense.barrier-stationary-recharge-pct=0.02, guard.barrier-refill-on-control-pct=0.50 | 7.97 | 0.00 | 95.5s | hardest | DoT-heavy |
| Magmaheart Stone | +0 | 10.0 | defense.recovery-active-pct=0.06, defense.recovery-on-kill-pct=0.04 (on-kill Recovery undercounted) | 9.52 | -188 | 60.1s | hardest | DoT-heavy |
| Magmaheart Stone | +5 | 14.0 | defense.recovery-active-pct=0.16, defense.recovery-on-kill-pct=0.14 (on-kill Recovery undercounted) | 26.8 | 0.00 | 1097s | hardest | DoT-heavy |
| Oasis Heart | +0 | 10.0 | cleanse.cooldown-reduction-pct=0.20 | 5.07 | -188 | 43.8s | hardest | DoT-heavy |
| Oasis Heart | +5 | 14.0 | cleanse.cooldown-reduction-pct=0.25 | 7.97 | 0.00 | 74.9s | hardest | DoT-heavy |
| Sorrow Eye | +0 | 7.00 | defense.recovery-pulse-duration-ms=4000, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.44, guard.cleanse-pulse=1.00 | 18.2 | -188 | 274s | hardest | DoT-heavy |
| Sorrow Eye | +5 | 10.0 | defense.recovery-pulse-duration-ms=4000, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.54, guard.cleanse-pulse=1.00 | 33.4 | 0.00 | sustains | hardest | DoT-heavy |
| Worldvine Heart | +0 | 10.0 | defense.recovery-ramp-max-pct=0.14, defense.recovery-ramp-ramptime-ms=10000, defense.recovery-ramp-start-pct=0.05, guard.recovery-ramp-advance-ms=3000 | 12.1 | -188 | 86.1s | hardest | DoT-heavy |
| Worldvine Heart | +5 | 14.0 | defense.recovery-ramp-max-pct=0.24, defense.recovery-ramp-ramptime-ms=10000, defense.recovery-ramp-start-pct=0.05, guard.recovery-ramp-advance-ms=3000 | 25.0 | 0.00 | 300s | hardest | DoT-heavy |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-2 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Forest | 26.0 atk / 0.68 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Emberforge Plate/Sorrow Eye | 4143 | 2.05 | 47.3 | 45.3 | sustains | 0.63% | Safe |
| Mountain | 62.0 atk / 0.30 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Glacial Bulwark/Sorrow Eye | 1198 | 8.32 | 53.6 | 45.2 | sustains | 5.18% | Safe |
| Plains | 24.0 atk / 0.57 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Emberforge Plate/Sorrow Eye | 5736 | 1.13 | 47.3 | 46.2 | sustains | 0.42% | Safe |
| Swamp | 37.0 atk / 0.43 aps / 17.0 dot / ×1.00 | Squire / Bulwark / Vanguard · Plaguebound Shroud/Sorrow Eye | 912 | 17.9 | 49.2 | 31.3 | sustains | 4.02% | Safe |
| Caverns | 59.7 atk / 0.35 aps / 11.0 dot / ×1.00 | Squire / Bulwark / Vanguard · Plaguebound Shroud/Sorrow Eye | 945 | 16.7 | 49.2 | 32.5 | sustains | 6.44% | Safe |
| Jungle | 23.3 atk / 0.69 aps / 17.5 dot / ×1.00 | Squire / Bulwark / Vanguard · Plaguebound Shroud/Sorrow Eye | 930 | 17.9 | 49.2 | 31.3 | sustains | 2.41% | Safe |
| Desert | 60.0 atk / 0.38 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Emberforge Plate/Sorrow Eye | 1247 | 8.85 | 47.3 | 38.5 | sustains | 4.81% | Safe |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Stoneplate Juggernaut | Gorging Razortusk | Chitinous Dreadbore | Jungle Dread-Gorger | Dune-Stalker Emperor | Apex Timberclaw | Mire-Gorged Behemoth |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice | sustains | 175s | sustains | sustains | sustains | sustains | sustains |
| Conduit | 368s | 45.2s | sustains | 105s | 188s | sustains | 216s |
| Slinger | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Spirit | 285s | 55.0s | sustains | 114s | 177s | sustains | 219s |
| Squire | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Striker | sustains | sustains | sustains | sustains | sustains | sustains | sustains |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Stoneplate Juggernaut | 128 atk / 0.24 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard | Glacial Bulwark | Sorrow Eye | 1135 | sustains | 39.0 | 11.3% | Safe |
| Gorging Razortusk | 96.0 atk / 0.45 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard | Glacial Bulwark | Sorrow Eye | 1154 | sustains | 33.1 | 8.32% | Safe |
| Chitinous Dreadbore | 85.0 atk / 0.28 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard | Glacial Bulwark | Sorrow Eye | 1179 | sustains | 42.7 | 7.21% | Safe |
| Jungle Dread-Gorger | 85.0 atk / 0.42 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard | Glacial Bulwark | Sorrow Eye | 1179 | sustains | 37.3 | 7.21% | Safe |
| Dune-Stalker Emperor | 85.0 atk / 0.38 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard | Glacial Bulwark | Sorrow Eye | 1179 | sustains | 38.6 | 7.21% | Safe |
| Apex Timberclaw | 44.0 atk / 0.67 aps / 0.00 dot / ×1.15 | Squire / Bulwark / Vanguard | Emberforge Plate | Sorrow Eye | 1502 | sustains | 38.0 | 3.37% | Safe |
| Mire-Gorged Behemoth | 38.0 atk / 0.36 aps / 20.0 dot / ×1.00 | Squire / Bulwark / Vanguard | Plaguebound Shroud | Sorrow Eye | 909 | sustains | 30.8 | 4.02% | Safe |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Deepscale Hide | 751 | 575 | 890 | 886 | 823 |
| Emberforge Plate | 940 | 647 | 831 | 788 | 851 |
| Eternal Duneplate | 900 | 636 | 902 | 828 | 835 |
| Glacial Bulwark | 838 | 658 | 938 | 920 | 878 |
| Plaguebound Shroud | 900 | 975 | 847 | 841 | 862 |
| Summit Aegis | 813 | 653 | 893 | 873 | 844 |
| Wildgrowth Weave | 895 | 776 | 966 | 961 | 930 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Glacial Bulwark, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Bastion Heart | 1124 | 880 | 1259 | 1235 | 1176 |
| Echo Geode | 973 | 739 | 1119 | 1123 | 1078 |
| Frostward Charm | 1152 | 897 | 1296 | 1271 | 1209 |
| Magmaheart Stone | 1366 | 1066 | 1534 | 1504 | 1431 |
| Oasis Heart | 950 | 738 | 1071 | 1050 | 998 |
| Sorrow Eye | 1509 | 1182 | 1692 | 1658 | 1580 |
| Worldvine Heart | 1327 | 1035 | 1491 | 1461 | 1391 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire / Bulwark / Vanguard | Emberforge Plate/Sorrow Eye | 2459 | 989 | 11.9 | 47.3 | sustains | 2.51% |
| Squire / Knight / Vanguard | Plaguebound Shroud/Sorrow Eye | 2235 | 899 | 12.8 | 46.2 | sustains | 4.71% |
| Squire / Warrior / Vanguard | Emberforge Plate/Sorrow Eye | 2123 | 854 | 12.4 | 42.4 | sustains | 3.04% |
| Striker / Breaker / In-Fighter | Emberforge Plate/Sorrow Eye | 1825 | 814 | 13.3 | 36.2 | sustains | 3.43% |
| Squire / Bulwark / Sentinel | Emberforge Plate/Sorrow Eye | 1774 | 912 | 12.4 | 28.8 | sustains | 2.84% |
| Striker / Skirmisher / In-Fighter | Emberforge Plate/Sorrow Eye | 1725 | 770 | 13.3 | 34.2 | sustains | 3.63% |
| Squire / Knight / Sentinel | Plaguebound Shroud/Sorrow Eye | 1616 | 831 | 13.2 | 28.0 | sustains | 5.17% |
| Striker / Flurry / In-Fighter | Emberforge Plate/Sorrow Eye | 1597 | 712 | 13.7 | 32.7 | sustains | 4.05% |
| Squire / Warrior / Sentinel | Emberforge Plate/Sorrow Eye | 1526 | 784 | 12.8 | 25.6 | sustains | 3.44% |
| Striker / Breaker / Phantom-Blade | Emberforge Plate/Sorrow Eye | 1524 | 739 | 13.7 | 29.0 | sustains | 3.90% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit / Splinter / Vigil | Emberforge Plate/Sorrow Eye | 905 | 541 | 15.9 | 15.7 | 1331s | 6.03% |
| Conduit / Consort / Vigil | Emberforge Plate/Sorrow Eye | 937 | 559 | 15.9 | 16.2 | sustains | 5.83% |
| Spirit / Spark / Wisp | Emberforge Plate/Sorrow Eye | 988 | 500 | 15.9 | 14.5 | 292s | 6.52% |
| Spirit / Wraith / Wisp | Emberforge Plate/Sorrow Eye | 1022 | 517 | 15.9 | 15.0 | 462s | 6.31% |
| Conduit / Splinter / Harrier | Emberforge Plate/Sorrow Eye | 1028 | 613 | 15.5 | 17.3 | sustains | 5.21% |
| Conduit / Effigy / Vigil | Emberforge Plate/Sorrow Eye | 1028 | 613 | 15.5 | 17.3 | sustains | 5.21% |
| Conduit / Consort / Harrier | Emberforge Plate/Sorrow Eye | 1057 | 631 | 15.5 | 17.8 | sustains | 5.06% |
| Slinger / Scout / Deadeye | Wildgrowth Weave/Sorrow Eye | 1081 | 645 | 12.5 | 14.7 | sustains | 11.0% |
| Slinger / Marksman / Deadeye | Wildgrowth Weave/Sorrow Eye | 1108 | 662 | 12.7 | 15.3 | sustains | 10.6% |
| Apprentice / Venom vessel / Harbinger | Plaguebound Shroud/Sorrow Eye | 1113 | 664 | 13.6 | 16.4 | sustains | 8.49% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| charm > +25% tier avg | Sorrow Eye | survival 1509 vs avg 1200 |
| dominant charm | Sorrow Eye | best survival in every matchup profile |
| sustains too early | 16 build(s) | already immortal vs avg mobs on entry (+0) gear |

