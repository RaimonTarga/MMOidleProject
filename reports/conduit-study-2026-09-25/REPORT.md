# Conduit study results - 2026-09-25

## Decision

Advance **+50% summon HP with approximately unchanged per-replacement HP payments** as the early-game candidate. Do not adopt the same multiplier globally on the strength of this study: upper-tier responses are package-dependent and include regressions. No gameplay tuning was applied to the main checkout or deployed.

The prototype changes HP budgets by x1.5 and the replacement ratio from 0.30 to 0.20. Reconstruction timers, offense budgets, proc budgets, owner stats and movement are unchanged. Payment rounding can differ by 1 HP. The treatment lives only in each experiment child process.

## What was run

224 combat observations, including 14 deterministic baseline replays. Separate zero-combat qualification failures are preserved and excluded from balance conclusions. All completed stages have terminal complete.json files; validation checks matching starting worlds and owner stats, unchanged timers/offense, payment bounds, source resolution, raw artifacts and exact baseline replay.

Real server World ticks at 100 ms, native bot Rune decisions, baked hitboxes, fixed prepared mastery and gear. Farming stops after five simulated minutes or owner death; bosses stop on authoritative boss kill, death or the same cap. These are combat simulations, not socket-based acquisition/economy campaigns, browser play, deployment evidence or rankings against other classes. Tiers 5-6 were not covered. See README.md for source provenance and setup history.

## Early-game iteration

- Half-cost reconstruction alone regressed Plains entry: both baseline lives survived; both tax15 lives died. Lower payments are not automatically a safer combat trajectory.
- +25% HP improved developed Cave farming but introduced a Plains-entry death and did not rescue the failing Forest seed.
- +50% HP rescued that Forest seed and improved the capped farming work in every T1 context when summed across its two seeds.
- +100% HP did not improve on the +50% candidate overall; the larger buff was not advanced.
- The original T1 boss packages still failed. A separate affordable defensive package (Orbit plus target-casting Brace, no Sweep) cleared Mountain in both seeds with baseline AND hp50. That is a loadout/automation result, not an HP-buff win. Prepared Plains boss packages still lost the owner with intact summons.

## Baseline versus hp50 summary

| Stage / role | Observations per arm | Baseline kills / deaths / boss clears | hp50 kills / deaths / boss clears |
|---|---:|---:|---:|
| t1-iteration2 / farm | 10 | 224 / 1 / 0 | 299 / 0 / 0 |
| t1-iteration2 / boss | 4 | 12 / 4 / 0 | 10 / 4 / 0 |
| t1-boss-followup / boss | 4 | 8 / 4 / 0 | 8 / 4 / 0 |
| t1-boss-orbit-r2 / boss | 4 | 10 / 2 / 2 | 10 / 2 / 2 |
| t2 / farm | 12 | 466 / 0 / 0 | 499 / 0 / 0 |
| t2 / boss | 6 | 4 / 2 / 4 | 6 / 0 / 6 |
| t3 / farm | 20 | 215 / 17 / 0 | 292 / 17 / 0 |
| t3 / boss | 6 | 4 / 0 / 4 | 4 / 0 / 4 |
| t4 / farm | 9 | 493 / 0 / 0 | 497 / 0 / 0 |
| t4 / boss | 9 | 9 / 0 / 9 | 9 / 0 / 9 |

Kills include ordinary enemies and boss-spawned adds; **boss clears are counted separately**. Death-shortened runs contribute only their actual completed work. Surviving a five-minute boss cap is not a kill, a death, or an indefinite sustain proof. Do not pool different packages/biomes/tiers into a universal win rate.

## Specific upper-tier findings

- T2: all three frames tested in Plains, Cave and against Stoneplate Juggernaut, with two seeds. Heavy changes from death at 97.0 seconds to a boss clear at 104.8 seconds in both seeds. Balanced farming is near-neutral in Plains; Light and all frames in Cave improve summed work.
- T3 Heavy/far Volcano, seed 101009: baseline survives the cap with 21 kills; hp50 dies with 4 kills. This is a concrete reason to hold global adoption. It does not prove that extra HP is generally harmful.
- T3 Balanced/mid boss: both arms deal 12,308 HP damage by the cap, with identical recorded gameplay. Bodies rise from 74 to 111 HP while the authored normal boss hit is 204 before any encounter-specific modifiers: the buff does not cross that normal-hit survival threshold. This is not a failure to engage or a zero-damage stall.
- T3 ranges were tested separately; higher aggregate work must not hide a new death in a particular frame/range/seed.
- T4: farming totals are 493 to 497 kills, with no owner deaths in either arm. All nine bosses clear in both arms. Marshal improves 41 to 53; Chorister falls 66 to 56; Ritualist falls 52 to 48; Inquisitor falls 68 to 64; Iconoclast improves 62 to 68. This one-seed coverage screen does not justify a uniform specialization buff.

## Per-package paired results

Each entry shows actual total kills, owner deaths and boss clears summed over the listed seeds. Availability is an unweighted mean of each run's living authored-offense fraction; it is not landed DPS.

### t1-r2

| Package | Arm | n | Kills | Deaths | Boss clears | Availability | HP paid | HP-blocked seconds |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| arrival-plains | baseline | 2 | 47 | 0 | 0 | 75.4% | 784 | 0.0 |
| arrival-plains | tax15 | 2 | 28 | 2 | 0 | 69.6% | 276 | 0.0 |
| arrival-plains | hp25 | 2 | 42 | 1 | 0 | 77.0% | 664 | 3.2 |
| equipped-plains | baseline | 2 | 81 | 0 | 0 | 84.8% | 600 | 0.0 |
| equipped-plains | tax15 | 2 | 86 | 0 | 0 | 80.4% | 352 | 0.0 |
| equipped-plains | hp25 | 2 | 82 | 0 | 0 | 87.3% | 512 | 0.0 |
| forest | baseline | 2 | 30 | 1 | 0 | 64.1% | 328 | 0.8 |
| forest | tax15 | 2 | 29 | 1 | 0 | 63.2% | 180 | 2.4 |
| forest | hp25 | 2 | 28 | 1 | 0 | 63.0% | 392 | 2.0 |
| plains-boss | baseline | 2 | 12 | 2 | 0 | 86.5% | 32 | 13.1 |
| plains-boss | tax15 | 2 | 13 | 2 | 0 | 87.2% | 12 | 18.4 |
| plains-boss | hp25 | 2 | 10 | 2 | 0 | 99.2% | 0 | 0.0 |
| developed-mountain | baseline | 2 | 40 | 0 | 0 | 83.4% | 819 | 4.7 |
| developed-mountain | tax15 | 2 | 44 | 0 | 0 | 82.4% | 445 | 0.0 |
| developed-mountain | hp25 | 2 | 43 | 0 | 0 | 82.8% | 882 | 3.9 |
| developed-cave | baseline | 2 | 26 | 0 | 0 | 68.4% | 1017 | 0.0 |
| developed-cave | tax15 | 2 | 28 | 0 | 0 | 70.5% | 565 | 0.0 |
| developed-cave | hp25 | 2 | 34 | 0 | 0 | 82.5% | 882 | 0.0 |
| mountain-boss | baseline | 2 | 0 | 2 | 0 | 37.2% | 200 | 6.6 |
| mountain-boss | tax15 | 2 | 0 | 2 | 0 | 37.8% | 110 | 6.6 |
| mountain-boss | hp25 | 2 | 0 | 2 | 0 | 37.2% | 200 | 6.6 |

### t1-iteration2

| Package | Arm | n | Kills | Deaths | Boss clears | Availability | HP paid | HP-blocked seconds |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| arrival-plains | baseline | 2 | 47 | 0 | 0 | 75.4% | 784 | 0.0 |
| arrival-plains | hp50 | 2 | 66 | 0 | 0 | 84.3% | 616 | 0.0 |
| arrival-plains | hp100 | 2 | 62 | 0 | 0 | 85.9% | 600 | 4.0 |
| equipped-plains | baseline | 2 | 81 | 0 | 0 | 84.8% | 600 | 0.0 |
| equipped-plains | hp50 | 2 | 95 | 0 | 0 | 89.9% | 488 | 0.0 |
| equipped-plains | hp100 | 2 | 96 | 0 | 0 | 91.4% | 416 | 0.0 |
| forest | baseline | 2 | 30 | 1 | 0 | 64.1% | 328 | 0.8 |
| forest | hp50 | 2 | 57 | 0 | 0 | 80.4% | 568 | 0.0 |
| forest | hp100 | 2 | 55 | 0 | 0 | 79.0% | 656 | 0.0 |
| plains-boss | baseline | 2 | 12 | 2 | 0 | 86.5% | 32 | 13.1 |
| plains-boss | hp50 | 2 | 10 | 2 | 0 | 100.0% | 0 | 0.0 |
| plains-boss | hp100 | 2 | 10 | 2 | 0 | 100.0% | 0 | 0.0 |
| developed-mountain | baseline | 2 | 40 | 0 | 0 | 83.4% | 819 | 4.7 |
| developed-mountain | hp50 | 2 | 46 | 0 | 0 | 92.9% | 432 | 0.0 |
| developed-mountain | hp100 | 2 | 44 | 0 | 0 | 93.8% | 378 | 0.0 |
| developed-cave | baseline | 2 | 26 | 0 | 0 | 68.4% | 1017 | 0.0 |
| developed-cave | hp50 | 2 | 35 | 0 | 0 | 83.4% | 846 | 0.0 |
| developed-cave | hp100 | 2 | 35 | 0 | 0 | 83.4% | 846 | 0.0 |
| mountain-boss | baseline | 2 | 0 | 2 | 0 | 37.2% | 200 | 6.6 |
| mountain-boss | hp50 | 2 | 0 | 2 | 0 | 37.2% | 200 | 6.6 |
| mountain-boss | hp100 | 2 | 0 | 2 | 0 | 69.3% | 140 | 0.0 |

### t1-boss-followup

| Package | Arm | n | Kills | Deaths | Boss clears | Availability | HP paid | HP-blocked seconds |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| prepared-mountain-boss | baseline | 2 | 0 | 2 | 0 | 37.2% | 200 | 6.6 |
| prepared-plains-boss | baseline | 2 | 8 | 2 | 0 | 100.0% | 0 | 0.0 |
| prepared-mountain-boss | hp50 | 2 | 0 | 2 | 0 | 37.2% | 200 | 6.6 |
| prepared-plains-boss | hp50 | 2 | 8 | 2 | 0 | 100.0% | 0 | 0.0 |

### t1-boss-orbit-r2

| Package | Arm | n | Kills | Deaths | Boss clears | Availability | HP paid | HP-blocked seconds |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| prepared-mountain-boss-orbit | baseline | 2 | 2 | 0 | 2 | 34.4% | 720 | 0.0 |
| prepared-plains-boss-orbit | baseline | 2 | 8 | 2 | 0 | 100.0% | 0 | 0.0 |
| prepared-mountain-boss-orbit | hp50 | 2 | 2 | 0 | 2 | 34.4% | 720 | 0.0 |
| prepared-plains-boss-orbit | hp50 | 2 | 8 | 2 | 0 | 100.0% | 0 | 0.0 |

### t2

| Package | Arm | n | Kills | Deaths | Boss clears | Availability | HP paid | HP-blocked seconds |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| breadth-t2-conduit-balanced-farm | baseline | 2 | 134 | 0 | 0 | 92.0% | 1110 | 0.0 |
| breadth-t2-conduit-balanced-farm | hp50 | 2 | 132 | 0 | 0 | 93.0% | 915 | 0.0 |
| breadth-t2-conduit-balanced-boss | baseline | 2 | 2 | 0 | 2 | 38.8% | 1680 | 0.0 |
| breadth-t2-conduit-balanced-boss | hp50 | 2 | 2 | 0 | 2 | 38.8% | 1680 | 0.0 |
| breadth-t2-conduit-heavy-farm | baseline | 2 | 108 | 0 | 0 | 99.0% | 168 | 0.0 |
| breadth-t2-conduit-heavy-farm | hp50 | 2 | 108 | 0 | 0 | 100.0% | 0 | 0.0 |
| breadth-t2-conduit-heavy-boss | baseline | 2 | 0 | 2 | 0 | 75.1% | 896 | 0.0 |
| breadth-t2-conduit-heavy-boss | hp50 | 2 | 2 | 0 | 2 | 82.8% | 672 | 0.0 |
| breadth-t2-conduit-light-farm | baseline | 2 | 121 | 0 | 0 | 84.9% | 1024 | 0.0 |
| breadth-t2-conduit-light-farm | hp50 | 2 | 141 | 0 | 0 | 84.1% | 1088 | 0.0 |
| breadth-t2-conduit-light-boss | baseline | 2 | 2 | 0 | 2 | 41.9% | 1040 | 1.0 |
| breadth-t2-conduit-light-boss | hp50 | 2 | 2 | 0 | 2 | 41.8% | 1024 | 1.6 |
| breadth-t2-conduit-balanced-farm-cave | baseline | 2 | 34 | 0 | 0 | 90.9% | 1575 | 0.0 |
| breadth-t2-conduit-balanced-farm-cave | hp50 | 2 | 42 | 0 | 0 | 93.3% | 1200 | 0.0 |
| breadth-t2-conduit-heavy-farm-cave | baseline | 2 | 30 | 0 | 0 | 96.0% | 672 | 0.0 |
| breadth-t2-conduit-heavy-farm-cave | hp50 | 2 | 32 | 0 | 0 | 98.0% | 336 | 0.0 |
| breadth-t2-conduit-light-farm-cave | baseline | 2 | 39 | 0 | 0 | 93.1% | 968 | 0.0 |
| breadth-t2-conduit-light-farm-cave | hp50 | 2 | 44 | 0 | 0 | 94.5% | 784 | 0.0 |

### t3

| Package | Arm | n | Kills | Deaths | Boss clears | Availability | HP paid | HP-blocked seconds |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| breadth-t3-conduit-balanced-farm | baseline | 2 | 1 | 2 | 0 | 33.8% | 418 | 0.0 |
| breadth-t3-conduit-balanced-farm | hp50 | 2 | 4 | 2 | 0 | 39.9% | 462 | 0.0 |
| breadth-t3-conduit-balanced-boss | baseline | 2 | 0 | 0 | 0 | 52.1% | 3872 | 0.0 |
| breadth-t3-conduit-balanced-boss | hp50 | 2 | 0 | 0 | 0 | 52.1% | 3872 | 0.0 |
| breadth-t3-conduit-balanced-far-farm | baseline | 2 | 12 | 2 | 0 | 92.7% | 153 | 0.0 |
| breadth-t3-conduit-balanced-far-farm | hp50 | 2 | 45 | 1 | 0 | 90.2% | 799 | 0.0 |
| breadth-t3-conduit-heavy-farm | baseline | 2 | 19 | 2 | 0 | 62.2% | 2573 | 0.1 |
| breadth-t3-conduit-heavy-farm | hp50 | 2 | 5 | 2 | 0 | 74.1% | 830 | 1.2 |
| breadth-t3-conduit-heavy-boss | baseline | 2 | 2 | 0 | 2 | 77.3% | 3486 | 0.0 |
| breadth-t3-conduit-heavy-boss | hp50 | 2 | 2 | 0 | 2 | 82.9% | 2656 | 0.0 |
| breadth-t3-conduit-heavy-far-farm | baseline | 2 | 28 | 1 | 0 | 80.5% | 1674 | 0.0 |
| breadth-t3-conduit-heavy-far-farm | hp50 | 2 | 14 | 2 | 0 | 81.0% | 806 | 0.0 |
| breadth-t3-conduit-light-farm | baseline | 2 | 9 | 2 | 0 | 61.0% | 264 | 0.8 |
| breadth-t3-conduit-light-farm | hp50 | 2 | 57 | 2 | 0 | 69.6% | 1536 | 3.4 |
| breadth-t3-conduit-light-boss | baseline | 2 | 2 | 0 | 2 | 53.6% | 2496 | 0.0 |
| breadth-t3-conduit-light-boss | hp50 | 2 | 2 | 0 | 2 | 53.6% | 2496 | 0.0 |
| breadth-t3-conduit-light-far-farm | baseline | 2 | 56 | 2 | 0 | 85.0% | 594 | 0.0 |
| breadth-t3-conduit-light-far-farm | hp50 | 2 | 56 | 2 | 0 | 85.0% | 594 | 0.0 |
| breadth-t3-conduit-balanced-close-farm | baseline | 2 | 20 | 2 | 0 | 55.7% | 1161 | 9.2 |
| breadth-t3-conduit-balanced-tundra-farm | baseline | 2 | 32 | 0 | 0 | 88.7% | 2970 | 0.0 |
| breadth-t3-conduit-balanced-close-farm | hp50 | 2 | 9 | 2 | 0 | 53.6% | 1242 | 1.2 |
| breadth-t3-conduit-balanced-tundra-farm | hp50 | 2 | 32 | 0 | 0 | 88.7% | 2970 | 0.0 |
| breadth-t3-conduit-heavy-close-farm | baseline | 2 | 27 | 2 | 0 | 73.2% | 2828 | 1.6 |
| breadth-t3-conduit-heavy-close-farm | hp50 | 2 | 24 | 2 | 0 | 87.7% | 1515 | 0.9 |
| breadth-t3-conduit-light-close-farm | baseline | 2 | 11 | 2 | 0 | 38.6% | 896 | 0.3 |
| breadth-t3-conduit-light-close-farm | hp50 | 2 | 46 | 2 | 0 | 79.0% | 1428 | 0.5 |

### t4

| Package | Arm | n | Kills | Deaths | Boss clears | Availability | HP paid | HP-blocked seconds |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| breadth-t4-conduit-balanced-a-farm | baseline | 1 | 41 | 0 | 0 | 80.0% | 1881 | 0.0 |
| breadth-t4-conduit-balanced-a-farm | hp50 | 1 | 53 | 0 | 0 | 93.5% | 1023 | 0.0 |
| breadth-t4-conduit-balanced-a-boss | baseline | 1 | 1 | 0 | 1 | 38.6% | 2409 | 0.0 |
| breadth-t4-conduit-balanced-a-boss | hp50 | 1 | 1 | 0 | 1 | 38.6% | 2409 | 0.0 |
| breadth-t4-conduit-balanced-b-farm | baseline | 1 | 66 | 0 | 0 | 91.4% | 1221 | 0.0 |
| breadth-t4-conduit-balanced-b-farm | hp50 | 1 | 56 | 0 | 0 | 94.5% | 891 | 0.0 |
| breadth-t4-conduit-balanced-b-boss | baseline | 1 | 1 | 0 | 1 | 35.3% | 2277 | 0.0 |
| breadth-t4-conduit-balanced-b-boss | hp50 | 1 | 1 | 0 | 1 | 35.3% | 2277 | 0.0 |
| breadth-t4-conduit-balanced-c-farm | baseline | 1 | 52 | 0 | 0 | 90.1% | 1221 | 0.0 |
| breadth-t4-conduit-balanced-c-farm | hp50 | 1 | 48 | 0 | 0 | 90.5% | 1056 | 0.0 |
| breadth-t4-conduit-balanced-c-boss | baseline | 1 | 1 | 0 | 1 | 39.2% | 2475 | 0.0 |
| breadth-t4-conduit-balanced-c-boss | hp50 | 1 | 1 | 0 | 1 | 39.2% | 2475 | 0.0 |
| breadth-t4-conduit-heavy-a-farm | baseline | 1 | 44 | 0 | 0 | 97.5% | 585 | 0.0 |
| breadth-t4-conduit-heavy-a-farm | hp50 | 1 | 44 | 0 | 0 | 96.7% | 447 | 0.0 |
| breadth-t4-conduit-heavy-a-boss | baseline | 1 | 1 | 0 | 1 | 77.4% | 997 | 0.0 |
| breadth-t4-conduit-heavy-a-boss | hp50 | 1 | 1 | 0 | 1 | 83.5% | 791 | 0.0 |
| breadth-t4-conduit-heavy-b-farm | baseline | 1 | 66 | 0 | 0 | 100.0% | 0 | 0.0 |
| breadth-t4-conduit-heavy-b-farm | hp50 | 1 | 66 | 0 | 0 | 100.0% | 0 | 0.0 |
| breadth-t4-conduit-heavy-b-boss | baseline | 1 | 1 | 0 | 1 | 94.2% | 418 | 0.0 |
| breadth-t4-conduit-heavy-b-boss | hp50 | 1 | 1 | 0 | 1 | 96.1% | 417 | 0.0 |
| breadth-t4-conduit-heavy-c-farm | baseline | 1 | 43 | 0 | 0 | 94.9% | 688 | 0.0 |
| breadth-t4-conduit-heavy-c-farm | hp50 | 1 | 47 | 0 | 0 | 97.5% | 344 | 0.0 |
| breadth-t4-conduit-heavy-c-boss | baseline | 1 | 1 | 0 | 1 | 83.9% | 688 | 0.0 |
| breadth-t4-conduit-heavy-c-boss | hp50 | 1 | 1 | 0 | 1 | 90.8% | 344 | 0.0 |
| breadth-t4-conduit-light-a-farm | baseline | 1 | 68 | 0 | 0 | 89.8% | 825 | 0.0 |
| breadth-t4-conduit-light-a-farm | hp50 | 1 | 64 | 0 | 0 | 88.9% | 810 | 0.0 |
| breadth-t4-conduit-light-a-boss | baseline | 1 | 1 | 0 | 1 | 34.9% | 975 | 0.0 |
| breadth-t4-conduit-light-a-boss | hp50 | 1 | 1 | 0 | 1 | 34.9% | 975 | 0.0 |
| breadth-t4-conduit-light-b-farm | baseline | 1 | 51 | 0 | 0 | 91.1% | 814 | 0.0 |
| breadth-t4-conduit-light-b-farm | hp50 | 1 | 51 | 0 | 0 | 91.1% | 814 | 0.0 |
| breadth-t4-conduit-light-b-boss | baseline | 1 | 1 | 0 | 1 | 37.9% | 979 | 0.0 |
| breadth-t4-conduit-light-b-boss | hp50 | 1 | 1 | 0 | 1 | 37.9% | 979 | 0.0 |
| breadth-t4-conduit-light-c-farm | baseline | 1 | 62 | 0 | 0 | 85.0% | 1335 | 0.0 |
| breadth-t4-conduit-light-c-farm | hp50 | 1 | 68 | 0 | 0 | 86.0% | 1305 | 0.0 |
| breadth-t4-conduit-light-c-boss | baseline | 1 | 1 | 0 | 1 | 29.1% | 1260 | 0.0 |
| breadth-t4-conduit-light-c-boss | hp50 | 1 | 1 | 0 | 1 | 29.1% | 1260 | 0.0 |

## Next balance step

Keep the early durability candidate separate from upper-tier redesign. Before adoption, define how the extra early HP carries through frame/range unlocks so progression does not create a durability cliff. Then run a real early-character route with earned equipment and compare acquisition time and deaths. For upper tiers, investigate owner damage exposure, summon hit-survival thresholds and range-specific targeting using the recorded failing lives; do not stack a timer reduction onto this candidate to conceal them.

## Validation and artifacts

- Bench TypeScript check passed during preparation; final check is recorded separately in validation-checks.json.
- Focused summoner overhaul, specialization and starter-maintenance tests passed. No full repository suite or browser playtest was run.
- results.json contains the compact per-life results; validation.json contains integrity checks; artifact-inventory.json lists SHA-256 hashes for raw evidence.
- Raw evidence and isolated source: D:/mmo-idle/conduit-study-2026-09-25/.
- Main-checkout changes are experiment tooling and a narrow bench preparation fix for starter Rune recipe validation. Production combat values remain untouched.
