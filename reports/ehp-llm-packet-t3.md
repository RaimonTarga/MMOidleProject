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
- **Ramping mitigations ARE modelled**, as duty-cycle averages over the 60s window, never at their printed maximum: hardening (ramp + big-hit reset, assumed spike cadence 12s when only a spike trips it), reactive plating (stack ramp against the attacker's own cadence), stationary DR (scaled by an assumed 50% stationary duty cycle — override with `--stationary-fraction`), and sustained-fight DR. Each is printed in the affected row's notes. The assumed duty cycles are the two judgement calls in this report; treat Tundra and Volcanic rows accordingly.
- **Not** modelled: core DR layer, wards, barrier recharge, barrier-break heals, on-kill Recovery.
- **Multi-enemy pressure** is not modeled; a single attacker profile is assumed (idle pulls are often several mobs).

## Progression Checkpoints

| Checkpoint | Gear | Attacker | Avg eHP | Avg net/s | Min TTL | Safe % | Blocked |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prev-tier +3 vs current mobs | T2 +3 | 58.9 atk / 0.44 aps / 6.65 dot / ×1.02 | 395 | -10.7 | 15.8s | 8.33% | 0 |
| Current +0 vs current mobs (entry) | T3 +0 | 58.9 atk / 0.44 aps / 6.65 dot / ×1.02 | 839 | 2.12 | 52.9s | 47.2% | 0 |
| Current +3 vs current mobs (geared) | T3 +3 | 58.9 atk / 0.44 aps / 6.65 dot / ×1.02 | 1582 | 12.1 | sustains | 100% | 0 |
| Current +3 vs boss/elite | T3 +3 | 139 atk / 0.28 aps / 0.00 dot / ×1.00 | 660 | -1.06 | 28.9s | 36.1% | 0 |
| Current +3 vs next-tier mobs | T3 +3 | 140 atk / 0.41 aps / 4.33 dot / ×1.02 | 610 | -15.4 | 11.4s | 11.1% | 0 |

## Class Average eHP By Checkpoint

| Class | Prev-tier +3 vs current mobs | Current +0 vs current mobs (entry) | Current +3 vs current mobs (geared) | Current +3 vs boss/elite | Current +3 vs next-tier mobs |
| --- | --- | --- | --- | --- | --- |
| Apprentice | 394 | 885 | 1828 | 580 | 563 |
| Conduit | 348 | 706 | 1488 | 528 | 506 |
| Slinger | 416 | 732 | 1476 | 720 | 655 |
| Spirit | 320 | 635 | 1410 | 501 | 482 |
| Squire | 496 | 1204 | 1721 | 923 | 821 |
| Striker | 395 | 873 | 1568 | 706 | 630 |

## Armor Comparison

_No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst._

| Armor | Plus | maxHP | Plating | DR | Evasion | Special | eHP | TTL | Net/s | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deepscale Hide | +0 | 91.0 | 13.0 | 19.0% | 0.00 | - | 419 | 15.7s | -18.1 | avg mob | DoT-heavy |
| Deepscale Hide | +5 | 136 | 19.0 | 23.0% | 0.00 | - | 611 | 28.2s | -14.7 | avg mob | DoT-heavy |
| Emberforge Plate | +0 | 90.0 | 20.0 | 0.00% | 0.00 | defense.hardening-max=24.0, defense.hardening-per-sec=3.00, defense.hardening-reset-pct=0.25 | 839 | 91.5s | -8.48 | avg mob | DoT-heavy |
| Emberforge Plate | +5 | 190 | 45.0 | 0.00% | 0.00 | defense.hardening-max=24.0, defense.hardening-per-sec=3.00, defense.hardening-reset-pct=0.25 | 1834 | 82.1s | -4.30 | avg mob | DoT-heavy |
| Eternal Duneplate | +0 | 90.0 | 20.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=1.00, defense.debuff-resistance=0.20 | 427 | 32.3s | -17.8 | avg mob | DoT-heavy |
| Eternal Duneplate | +5 | 190 | 45.0 | 0.00% | 0.00 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=1.00, defense.debuff-resistance=0.20 | 1578 | 137s | -5.77 | avg mob | DoT-heavy |
| Glacial Bulwark | +0 | 100 | 15.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.stationary-dr-pct=0.15, defense.stationary-dr-ramptime-ms=6000 | 417 | 15.7s | -19.0 | hardest | DoT-heavy |
| Glacial Bulwark | +5 | 210 | 35.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.stationary-dr-pct=0.15, defense.stationary-dr-ramptime-ms=6000 | 1229 | 57.9s | -8.89 | avg mob | DoT-heavy |
| Plaguebound Shroud | +0 | 97.0 | 13.0 | 0.00% | 0.00 | defense.debuff-resistance=0.20, defense.dot-resistance=0.46, defense.hit-to-dot-pct=0.10 | 452 | 17.2s | -17.2 | DoT-heavy | boss |
| Plaguebound Shroud | +5 | 146 | 19.0 | 0.00% | 0.00 | defense.debuff-resistance=0.20, defense.dot-resistance=0.52, defense.hit-to-dot-pct=0.10 | 687 | 56.3s | -13.5 | DoT-heavy | boss |
| Summit Aegis | +0 | 104 | 16.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, guard.potency-pct=0.41 | 412 | 15.4s | -19.7 | hardest | DoT-heavy |
| Summit Aegis | +5 | 156 | 24.0 | 0.00% | 0.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, guard.potency-pct=0.51 | 642 | 41.9s | -15.2 | avg mob | DoT-heavy |
| Wildgrowth Weave | +0 | 80.0 | 13.0 | 0.00% | 0.40 | - | 401 | 14.8s | -17.9 | hardest | DoT-heavy |
| Wildgrowth Weave | +5 | 170 | 28.0 | 0.00% | 0.65 | - | 936 | 38.2s | -10.4 | avg mob | DoT-heavy |

## Charm Comparison

_Reference armor Summit Aegis +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully._

| Charm | Plus | recovery | Special | Recov/s | eHP contrib | TTL | Best matchup | Worst matchup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bastion Heart | +0 | 3.00 | defense.barrier-pct=0.28 | 2.50 | -231 | 21.4s | boss | DoT-heavy |
| Bastion Heart | +5 | 5.00 | defense.barrier-pct=0.34 | 3.51 | 0.00 | 35.3s | avg mob | DoT-heavy |
| Echo Geode | +0 | 7.00 | defense.absorb-pct=0.20 | 6.27 | -231 | 28.2s | next-tier | DoT-heavy |
| Echo Geode | +5 | 10.0 | defense.absorb-pct=0.24 | 7.32 | 0.00 | 273s | avg mob | DoT-heavy |
| Frostward Charm | +0 | 11.0 | defense.absorb-pct=0.08, defense.barrier-pct=0.12 | 5.17 | -231 | 28.4s | hardest | DoT-heavy |
| Frostward Charm | +5 | 11.0 | defense.absorb-pct=0.18, defense.barrier-pct=0.22 | 6.88 | 0.00 | 45.4s | avg mob | DoT-heavy |
| Magmaheart Stone | +0 | 11.0 | defense.recovery-active-pct=0.06, defense.recovery-on-kill-pct=0.04 (on-kill Recovery undercounted) | 7.35 | -231 | 20.8s | boss | DoT-heavy |
| Magmaheart Stone | +5 | 11.0 | defense.recovery-active-pct=0.16, defense.recovery-on-kill-pct=0.14 (on-kill Recovery undercounted) | 16.3 | 0.00 | 58.3s | avg mob | DoT-heavy |
| Oasis Heart | +0 | 11.0 | defense.cleanse-empty-heal-pct=0.05, defense.cleanse-interval-ms=6000, defense.cleanse-stacks=1.00 | 6.20 | -231 | 18.7s | boss | DoT-heavy |
| Oasis Heart | +5 | 11.0 | defense.cleanse-empty-heal-pct=0.10, defense.cleanse-interval-ms=6000, defense.cleanse-stacks=1.00 | 10.5 | 0.00 | 56.2s | avg mob | DoT-heavy |
| Sorrow Eye | +0 | 7.00 | defense.recovery-pulse-duration-ms=4000, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.44 | 13.3 | -231 | 41.6s | boss | DoT-heavy |
| Sorrow Eye | +5 | 10.0 | defense.recovery-pulse-duration-ms=4000, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-pct=0.54 | 23.2 | 0.00 | 1184s | avg mob | DoT-heavy |
| Worldvine Heart | +0 | 11.0 | defense.recovery-ramp-max-pct=0.14, defense.recovery-ramp-ramptime-ms=10000, defense.recovery-ramp-start-pct=0.05 | 9.34 | -231 | 27.0s | boss | DoT-heavy |
| Worldvine Heart | +5 | 11.0 | defense.recovery-ramp-max-pct=0.24, defense.recovery-ramp-ramptime-ms=10000, defense.recovery-ramp-start-pct=0.05 | 15.2 | 0.00 | 87.3s | avg mob | DoT-heavy |

## Biome Route

_Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-2 pool._

| Biome | Attacker | Best loadout | eHP | In DPS | Recov/s | Net/s | TTL | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Forest | 32.0 atk / 0.68 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Wildgrowth Weave/Sorrow Eye | 16521 | 0.50 | 37.5 | 37.0 | sustains | 0.26% | Safe |
| Mountain | 105 atk / 0.30 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Emberforge Plate/Sorrow Eye | 2245 | 5.64 | 40.1 | 34.5 | sustains | 4.69% | Safe |
| Plains | 24.0 atk / 0.57 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Wildgrowth Weave/Sorrow Eye | 12391 | 0.42 | 37.5 | 37.1 | sustains | 0.26% | Safe |
| Swamp | 37.0 atk / 0.43 aps / 17.0 dot / ×1.00 | Squire / Bulwark / Vanguard · Plaguebound Shroud/Sorrow Eye | 1049 | 11.5 | 36.4 | 24.9 | sustains | 1.90% | Safe |
| Caverns | 79.7 atk / 0.35 aps / 11.0 dot / ×1.00 | Squire / Bulwark / Vanguard · Emberforge Plate/Sorrow Eye | 1384 | 11.3 | 40.1 | 28.7 | sustains | 0.25% | Safe |
| Jungle | 24.3 atk / 0.64 aps / 16.3 dot / ×1.15 | Squire / Bulwark / Vanguard · Plaguebound Shroud/Sorrow Eye | 1312 | 8.94 | 36.4 | 27.5 | sustains | 0.31% | Safe |
| Desert | 135 atk / 0.38 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard · Emberforge Plate/Sorrow Eye | 1163 | 18.1 | 40.1 | 22.0 | sustains | 11.6% | Safe |

## Boss Matchups By Class

_Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk)._

| Class | Chitinous Dreadbore | Stoneplate Juggernaut | Apex Timberclaw | Gorging Razortusk | Jungle Dread-Gorger | Dune-Stalker Emperor | Mire-Gorged Behemoth |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice | sustains | sustains | sustains | sustains | sustains | sustains | 372s |
| Conduit | 49.7s | sustains | sustains | sustains | sustains | sustains | 34.6s |
| Slinger | 8561s | sustains | sustains | sustains | sustains | sustains | 38.1s |
| Spirit | 57.8s | sustains | sustains | sustains | sustains | sustains | 42.9s |
| Squire | sustains | sustains | sustains | sustains | sustains | sustains | sustains |
| Striker | sustains | sustains | sustains | sustains | sustains | sustains | sustains |

## Best Gear Per Boss

_Single highest-survival loadout (any class) at current +3 vs each boss._

| Boss | Attacker | Best build | Armor | Charm | eHP | TTL | Net/s | Spike %HP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chitinous Dreadbore | 139 atk / 0.28 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard | Emberforge Plate | Sorrow Eye | 1104 | sustains | 25.9 | 12.6% | Safe |
| Stoneplate Juggernaut | 128 atk / 0.24 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard | Emberforge Plate | Sorrow Eye | 1264 | sustains | 30.3 | 10.1% | Safe |
| Apex Timberclaw | 64.0 atk / 0.67 aps / 0.00 dot / ×1.60 | Squire / Bulwark / Vanguard | Emberforge Plate | Sorrow Eye | 25920 | sustains | 39.4 | 0.40% | Safe |
| Gorging Razortusk | 96.0 atk / 0.45 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard | Emberforge Plate | Sorrow Eye | 3535 | sustains | 35.1 | 2.72% | Safe |
| Jungle Dread-Gorger | 85.0 atk / 0.42 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard | Emberforge Plate | Sorrow Eye | 34425 | sustains | 39.7 | 0.25% | Safe |
| Dune-Stalker Emperor | 85.0 atk / 0.38 aps / 0.00 dot / ×1.00 | Squire / Bulwark / Vanguard | Emberforge Plate | Sorrow Eye | 34425 | sustains | 39.7 | 0.25% | Safe |
| Mire-Gorged Behemoth | 38.0 atk / 0.36 aps / 36.0 dot / ×1.00 | Squire / Bulwark / Vanguard | Plaguebound Shroud | Sorrow Eye | 880 | sustains | 15.7 | 1.90% | Safe |

## Armor Matrix By Attacker Profile

_Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds._

| Armor | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Deepscale Hide | 709 | 481 | 635 | 634 | 606 |
| Emberforge Plate | 2108 | 593 | 1161 | 1147 | 1024 |
| Eternal Duneplate | 1823 | 593 | 846 | 841 | 791 |
| Glacial Bulwark | 1439 | 634 | 842 | 837 | 798 |
| Plaguebound Shroud | 797 | 1082 | 551 | 548 | 566 |
| Summit Aegis | 748 | 523 | 602 | 602 | 583 |
| Wildgrowth Weave | 1088 | 554 | 882 | 879 | 817 |

## Charm Matrix By Attacker Profile

_Survival score at +3 with reference armor Summit Aegis, averaged over class builds._

| Charm | avg mob | DoT-heavy | hardest | boss | next-tier |
| --- | --- | --- | --- | --- | --- |
| Bastion Heart | 1002 | 700 | 803 | 803 | 777 |
| Echo Geode | 893 | 569 | 829 | 790 | 830 |
| Frostward Charm | 1023 | 673 | 904 | 874 | 895 |
| Magmaheart Stone | 1150 | 801 | 918 | 918 | 887 |
| Oasis Heart | 987 | 686 | 786 | 786 | 760 |
| Sorrow Eye | 1345 | 940 | 1076 | 1076 | 1040 |
| Worldvine Heart | 1120 | 780 | 893 | 893 | 864 |


## Top / Bottom Loadouts (current +3 vs current mobs)

| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire / Bulwark / Vanguard | Emberforge Plate/Sorrow Eye | 4631 | 1864 | 7.09 | 40.1 | sustains | 0.25% |
| Squire / Knight / Vanguard | Emberforge Plate/Sorrow Eye | 4345 | 1749 | 7.09 | 37.6 | sustains | 0.27% |
| Squire / Warrior / Vanguard | Emberforge Plate/Sorrow Eye | 4151 | 1670 | 7.09 | 35.9 | sustains | 0.28% |
| Striker / Breaker / In-Fighter | Emberforge Plate/Sorrow Eye | 3817 | 1703 | 7.09 | 30.6 | sustains | 0.28% |
| Striker / Skirmisher / In-Fighter | Emberforge Plate/Sorrow Eye | 3611 | 1611 | 7.09 | 29.0 | sustains | 0.29% |
| Squire / Bulwark / Sentinel | Emberforge Plate/Sorrow Eye | 3473 | 1785 | 7.09 | 24.4 | sustains | 0.26% |
| Striker / Flurry / In-Fighter | Emberforge Plate/Sorrow Eye | 3456 | 1542 | 7.09 | 27.7 | sustains | 0.31% |
| Apprentice / Rime-Bound / Hexblade | Emberforge Plate/Sorrow Eye | 3375 | 2012 | 5.89 | 16.4 | sustains | 0.28% |
| Striker / Breaker / Phantom-Blade | Emberforge Plate/Sorrow Eye | 3302 | 1601 | 7.09 | 24.6 | sustains | 0.29% |
| Spirit / Phantasm / Haunt | Emberforge Plate/Sorrow Eye | 3275 | 1578 | 7.09 | 15.4 | sustains | 0.30% |


| Build | Loadout | Survival | eHP | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Slinger / Scout / Deadeye | Emberforge Plate/Sorrow Eye | 2228 | 1330 | 6.99 | 12.8 | sustains | 0.36% |
| Conduit / Splinter / Vigil | Emberforge Plate/Sorrow Eye | 2274 | 1357 | 7.09 | 13.3 | sustains | 0.35% |
| Slinger / Marksman / Deadeye | Emberforge Plate/Sorrow Eye | 2303 | 1375 | 7.00 | 13.3 | sustains | 0.35% |
| Conduit / Consort / Vigil | Emberforge Plate/Sorrow Eye | 2351 | 1403 | 7.09 | 13.7 | sustains | 0.34% |
| Slinger / Artillerist / Deadeye | Emberforge Plate/Sorrow Eye | 2416 | 1442 | 7.01 | 13.9 | sustains | 0.33% |
| Spirit / Spark / Wisp | Emberforge Plate/Sorrow Eye | 2481 | 1256 | 7.09 | 12.3 | sustains | 0.37% |
| Conduit / Splinter / Harrier | Emberforge Plate/Sorrow Eye | 2505 | 1496 | 7.09 | 14.6 | sustains | 0.31% |
| Conduit / Effigy / Vigil | Emberforge Plate/Sorrow Eye | 2505 | 1496 | 7.09 | 14.6 | sustains | 0.31% |
| Slinger / Scout / Breacher | Emberforge Plate/Sorrow Eye | 2543 | 1518 | 6.94 | 14.5 | sustains | 0.32% |
| Spirit / Wraith / Wisp | Emberforge Plate/Sorrow Eye | 2572 | 1302 | 7.09 | 12.7 | sustains | 0.36% |


## Outlier Summary

_Flags items >±25% of tier-average survival, dominant items, early-sustain loadouts, and sub-20s boss TTLs._

| Flag | Item / Build | Detail |
| --- | --- | --- |
| armor < -25% tier avg | Deepscale Hide | survival 709 vs avg 1245 |
| armor > +25% tier avg | Emberforge Plate | survival 2108 vs avg 1245 |
| armor > +25% tier avg | Eternal Duneplate | survival 1823 vs avg 1245 |
| armor < -25% tier avg | Plaguebound Shroud | survival 797 vs avg 1245 |
| armor < -25% tier avg | Summit Aegis | survival 748 vs avg 1245 |
| charm > +25% tier avg | Sorrow Eye | survival 1345 vs avg 1075 |
| dominant charm | Sorrow Eye | best survival in every matchup profile |
| sustains too early | 17 build(s) | already immortal vs avg mobs on entry (+0) gear |

