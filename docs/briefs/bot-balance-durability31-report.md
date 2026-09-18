# Durability31 — observation-scoped Jungle navigation diagnosis

Date: 2026-09-17

Status: complete; executed once, sequentially, at the frozen packet revision

Scope: diagnostic replay only; no production/source edit, commit, push, or follow-up run

## Executive result

Durability31 completed and verified all 12 Jungle observations. The replay reproduces the Durability30 gameplay prefixes exactly, including READY state, event stream, sample stream, combat outcome, and player survival. Six observations reach the 120-second wall ceiling and six complete the simulated 120-second window.

The wall-ceiling behavior is explained by repeated unreachable navigation requests after the player is stationary inside a Jungle status-only slow bush. Hazard-aware pathfinding includes these status shapes as avoidance geometry. The player is not physically blocked by the bush, but every tested hazard-aware request from the trapped position fails at the initial padded-segment check. Auto-target selection continues scanning candidates through both its primary and fallback reachability paths, producing a very high volume of null path requests and spatial collision work.

This is not evidence of a generic disconnected map or collider failure. For three exact dominant request keys, the same start and destination return null with avoidHazards enabled and a direct path with avoidHazards disabled. Target churn is present in normal combat but disappears in the expensive idle tails. Costly successful routes occur, but the cutoff rows are dominated by repeated null paths.

The single repair hypothesis is to extend the existing persistent-hazard escape owner to include live player-targeted statusWhileInside features, using a short physically standable escape leg before normal hazard-aware target selection resumes. This hypothesis is not implemented or adopted by this packet.

## Frozen identity and execution

| Item | Value |
|---|---|
| Packet | docs/briefs/bot-balance-durability31-operator-packet.md |
| Frozen revision | d6643bde3551e510f879e7cab775f50e73964e02 |
| Frozen tree | 4ce106a953ab160606965d49416c74cde6e4d178 |
| Frozen definitions hash | a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 |
| Frozen hitbox hash | 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83 |
| Detached source branch | codex/durability31-frozen |
| Trial identity | durability30 |
| Blocks | Jungle only |
| Cells | node03 Apprentice, node03 Slinger, node05 Apprentice, node05 Spirit |
| Seeds | 44017, 46021, 48017 |
| Simulation | T4A, synthetic +5, 120 simulated seconds or first death, 100 ms |
| Navigation diagnostics | enabled |
| Verification | verified=true; runs=12; completeWindows=6; censored=6 |
| Operator exit | exit=0 |

The exact launcher created the previously absent output root at:

C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability31-20260917

The detached checkout remained clean at the frozen revision. The shared checkout was already dirty before launch and was preserved. The batch has complete.json, verification.json, all 12 READY/event/sample/summary bundles, all 12 observation-scoped CPU profiles, and all 12 navigation-counter receipts. No failed, budget-exhausted, or stopped marker was produced.

The replay is synthetic and has economyEligible=false. It is diagnostic evidence about the frozen simulation and navigation implementation, not live-play evidence, economy certification, or a global balance decision.

## Durability30 parity and gameplay boundary

The matching Durability30 artifacts were read from:

C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability30-20260917/results/jungle

Durability31 READY files are byte-identical to their matching Durability30 READY files for all 12 observations. Durability31 events.jsonl and samples.jsonl are exact prefixes of the matching Durability30 streams for all 12 observations. For the six window-ended rows, the streams are complete over the common 120-second simulation. For the six wall-ceiling rows, the Durability31 profile overhead causes an earlier wall cutoff; the common prefixes retain the same gameplay state and outcomes.

Abbreviations: WE means the simulated window ended; WC means the process wall ceiling ended. Censored is the target-level summary count, not a player death.

| Cell | Seed | D31 result | D30 result | D31 sim s | D30 sim s | D31 wall ms | D30 wall ms | Min HP | Kills / censored | Max quiet |
|---|---:|---|---|---:|---:|---:|---:|---:|---:|---:|
| 03-A | 44017 | WE | WE | 120.0 | 120.0 | 76125 | 55145 | 0.925194 | 20 / 0 | 7.8 s |
| 03-A | 46021 | WC | WC | 78.6 | 84.1 | 120097 | 120404 | 0.964375 | 12 / 0 | 14.1 s |
| 03-A | 48017 | WC | WC | 104.2 | 113.2 | 120475 | 120337 | 0.941371 | 14 / 0 | 23.1 s |
| 03-S | 44017 | WC | WC | 98.1 | 103.4 | 120656 | 120400 | 0.901503 | 18 / 0 | 14.7 s |
| 03-S | 46021 | WE | WE | 120.0 | 120.0 | 1734 | 1261 | 0.906761 | 22 / 1 | 3.2 s |
| 03-S | 48017 | WC | WC | 71.1 | 78.6 | 120205 | 120246 | 0.880161 | 12 / 0 | 16.1 s |
| 05-A | 44017 | WC | WC | 35.3 | 46.1 | 120033 | 120318 | 1.000000 | 4 / 0 | 21.5 s |
| 05-A | 46021 | WE | WE | 120.0 | 120.0 | 1824 | 1433 | 0.978299 | 24 / 0 | 7.1 s |
| 05-A | 48017 | WE | WE | 120.0 | 120.0 | 2095 | 1247 | 0.975525 | 23 / 0 | 4.7 s |
| 05-Spirit | 44017 | WE | WE | 120.0 | 120.0 | 2350 | 1710 | 1.000000 | 27 / 1 | 4.6 s |
| 05-Spirit | 46021 | WC | WC | 82.0 | 85.3 | 121109 | 120921 | 1.000000 | 16 / 0 | 7.8 s |
| 05-Spirit | 48017 | WE | WE | 120.0 | 120.0 | 1817 | 1244 | 1.000000 | 29 / 1 | 2.8 s |

Across all 12 rows there were zero player deaths. The combat and progression fields match over each Durability31/Durability30 common simulated prefix. The extra wall time on window-ended rows is profiling overhead, not a gameplay change. This packet does not certify HP timing or live feel.

## Navigation-counter audit

The navigation receipt is observation-scoped and cumulative. Its pathMs field is measured with performance.now. Its overlapQueries field is limited to direct padded-segment checks, as specified by the packet. droppedKeys counts unretained invocation records after the first 1,000 distinct request keys; it is not a count of distinct signatures.

The source-derived path count before tick 0 is zero. safeSpawn builds the navigation grid and performs mover-overlap work, but does not call findPathForMover; setupArena, materializeBot, and prepareSurveyBot likewise do not call it. The first serialized tick is recorded after world.tick(100), and every row therefore begins with a cumulative 1 path and 0 null paths. There is no separate pre-tick counter in the receipt, so tick 0 must not be interpreted as a zero-work baseline.

| Cell | Seed | Result | Sim s | Paths | Null paths | Null % | Path ms / sim s | Expanded / call | Padded checks / call | Overlap queries / call | Segment samples / call | Dropped keys |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 03-A | 44017 | WE | 120.0 | 5021 | 4519 | 90.0% | 614.7 | 594.0 | 4605.3 | 22968.8 | 18363.5 | 2594 |
| 03-A | 46021 | WC | 78.6 | 9962 | 9704 | 97.4% | 1501.9 | 497.3 | 3862.7 | 19260.7 | 15398.0 | 7012 |
| 03-A | 48017 | WC | 104.2 | 16535 | 16137 | 97.6% | 1128.0 | 294.6 | 2311.0 | 11523.7 | 9212.6 | 13342 |
| 03-S | 44017 | WC | 98.1 | 10510 | 9968 | 94.9% | 1205.3 | 464.1 | 3584.3 | 17862.3 | 14277.9 | 7592 |
| 03-S | 46021 | WE | 120.0 | 714 | 0 | 0.0% | 1.6 | 11.9 | 94.7 | 525.2 | 430.4 | 0 |
| 03-S | 48017 | WC | 71.1 | 11157 | 10878 | 97.5% | 1661.8 | 439.1 | 3430.6 | 17110.4 | 13679.7 | 7914 |
| 05-A | 44017 | WC | 35.3 | 17417 | 17350 | 99.6% | 3333.5 | 318.5 | 2498.0 | 12455.0 | 9957.0 | 13908 |
| 05-A | 46021 | WE | 120.0 | 531 | 0 | 0.0% | 1.2 | 20.2 | 148.1 | 800.8 | 652.6 | 0 |
| 05-A | 48017 | WE | 120.0 | 601 | 0 | 0.0% | 0.15 | 0.5 | 7.0 | 129.1 | 122.0 | 0 |
| 05-Spirit | 44017 | WE | 120.0 | 815 | 0 | 0.0% | 4.6 | 38.2 | 292.7 | 1509.0 | 1216.2 | 0 |
| 05-Spirit | 46021 | WC | 82.0 | 6527 | 6142 | 94.1% | 1454.0 | 778.3 | 6044.6 | 30150.7 | 24106.1 | 3504 |
| 05-Spirit | 48017 | WE | 120.0 | 631 | 0 | 0.0% | 0.38 | 4.6 | 37.8 | 262.5 | 224.7 | 0 |

Weighted across simulated exposure:

| Group | Rows | Sim s | Paths | Null paths | Null % | Path ms | Path ms / sim s | Expanded / call | Padded / call | Overlap / call | Segment / call | Dropped |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| All | 12 | 1189.3 | 80421 | 74708 | 92.90% | 783592.3 | 658.87 | 413.6 | 3222.3 | 16070.1 | 12847.8 | 55866 |
| Window ended | 6 | 720.0 | 8313 | 4518 | 54.35% | 74711.2 | 103.77 | 365.2 | 2831.3 | 14146.5 | 11315.2 | 2594 |
| Wall ceiling | 6 | 469.3 | 72108 | 70190 | 97.34% | 708881.0 | 1510.51 | 419.2 | 3267.3 | 16291.9 | 13024.5 | 53272 |

The separation is strong: wall-ceiling rows account for 89.3% of the sampled path time while contributing only 39.5% of the simulated seconds. Their null fraction is 97.34%, versus 54.35% for window-ended rows, and their path work is about 14.6 times the window-ended group on a simulated-second basis.

## Counter and sample correlation

The navigation counters are aligned to atMs values in the samples. Heavy rows become quiet and stationary before their largest repeated-null bursts. The following peak is a one-second diagnostic interval; paths/nulls/pathMs are interval deltas.

| Cell / seed | First fully idle sample | Peak interval | Peak paths / nulls / path ms | State at peak | Last active sample | Max quiet |
|---|---:|---|---:|---|---:|---:|
| 03-A / 44017 | 114000 ms | 114000–114900 | 660 / 660 / 11866.1 | No selected target, target, motion, or path; position about 3622,4084 | 113000 ms | 7.8 s |
| 03-A / 46021 | 65000 ms | 69000–69900 | 680 / 680 / 9706.0 | No selected target, target, motion, or path; position about 4121,2334 | 64000 ms | 14.1 s |
| 03-A / 48017 | 82000 ms | 100000–100900 | 680 / 680 / 6673.3 | No selected target, target, motion, or path; position about 1253,2345 | 81000 ms | 23.1 s |
| 03-S / 44017 | 84000 ms | 97000–97900 | 680 / 680 / 9055.7 | No selected target, target, motion, or path; position about 1669,4072 | 83000 ms | 14.7 s |
| 03-S / 48017 | 56000 ms | 65000–65900 | 680 / 680 / 8297.1 | No selected target, target, motion, or path; position about 1623,1104 | 55000 ms | 16.1 s |
| 05-A / 44017 | 14000 ms | 15000–15900 | 796 / 796 / 6125.7 | No selected target, target, motion, or path; position about 1566,2269 | 13000 ms | 21.5 s |
| 05-Spirit / 46021 | 75000 ms | 79000–79900 | 800 / 800 / 16648.7 | No selected target, target, motion, or path; position about 603,4424 | 74000 ms | 7.8 s |

The repeated requests are not explained by a changing target alone. The heavy tails have no selected target, target, movement, or path fields while the counter continues to grow. The recorded from position remains fixed, and the repeated keys are fixed start/end signatures with 64–82 calls for the listed dominant entries.

Normal rows show the contrasting state. At a 1-second peak, 03-S/46021 had 15 successful paths and selected/target monster-52 while stationary; 05-A/46021 had 20 successful paths while moving toward selected monster-36 with 37 waypoints; 05-A/48017 had 10 successful paths with selected and target monster-49; 05-Spirit/44017 and 05-Spirit/48017 likewise retained an active selected target and motion. These rows have zero null paths and only 0.15–4.6 path milliseconds per simulated second, apart from an isolated successful-route burst.

## Top repeated request keys

Keys below are summarized by rounded from and to coordinates. Every listed key used pad(22,18), avoidHazards=true, and an empty suppressed-feature list. The value format is calls / null fraction / accumulated path milliseconds where available.

| Cell / seed | Highest repeated keys |
|---|---|
| 03-A / 44017 | (3622,4084) to (3909,3211): 64 / 100% / 103.0 ms; to (311,4393): 62 / 100% / 435.8 ms; to (1782,3074): 60 / 100% / 180.2 ms |
| 03-A / 46021 | (4121,2334) to (1869,757): 72 / 100% / 2189.0 ms; to (3094,322): 70 / 100% / 384.0 ms; to (2085,117): 66 / 100% / 453.2 ms |
| 03-A / 48017 | (1253,2345) to (4238,2499): 76 / 100% / 562.4 ms; to (3795,3258): 60 / 100% / 650.9 ms; to (322,4004): 60 / 100% / 335.8 ms |
| 03-S / 44017 | (1669,4072) to (429,4562): 80 / 100% / 528.8 ms; to (1484,3828): 74 / 100% / 22.6 ms; to (3818,3498): 72 / 100% / 2357.3 ms |
| 03-S / 46021 | (1252,3518) to (1107,3475): 45 / 0% / 0.5 ms; (510,2479) to (436,2549): 41 / 0% / 1.0 ms; (3064,3414) to (2888,3381): 4 / 0% / 0.1 ms |
| 03-S / 48017 | (1623,1104) to (2086,2502): 82 / 100% / 603.7 ms; to (3753,1519): 74 / 100% / 292.1 ms; to (2881,493): 74 / 100% / 155.8 ms |
| 05-A / 44017 | (1566,2269) to (2240,847): 70 / 100% / 459.3 ms; to (1277,177): 64 / 100% / 402.8 ms; to (3830,3010): 64 / 100% / 180.1 ms |
| 05-A / 46021 | (4124,2372) to (3381,2048): 6 / 0% / 7.9 ms; to (3686,2108): 6 / 0% / 6.1 ms; (4106,2390) to (3685,2112): 6 / 0% / 3.8 ms |
| 05-A / 48017 | (1658,1254) to (914,1753): 1 / 0%; (4453,758) to (4582,1214): 1 / 0%; (2082,913) to (2679,388): 1 / 0% |
| 05-Spirit / 44017 | (1601,2347) to (1757,2420): 6 / 0% / 0.1 ms; the next two entries are single calls of 24.9 ms and 20.8 ms |
| 05-Spirit / 46021 | (603,4424) to (4274,1971): 72 / 100% / 5678.8 ms; to (2120,309): 72 / 100% / 1403.6 ms; to (227,1714): 72 / 100% / 340.3 ms |
| 05-Spirit / 48017 | (4035,2481) to (4132,2570): 17 / 0% / 0.2 ms; the next two entries are single calls of 1.6 ms and 1.5 ms |

## CPU-profile audit

Each profile covers setup, simulation, and teardown. The navigation receipt is written before the profiler is stopped. Profile sampled times therefore include diagnostic overhead and are not gameplay time. Caller-stack masses are inclusive/overlapping views; they must not be added to leaf self times or to one another.

Across the 12 profiles, sampled time totals about 810817.5 ms. A coarse URL grouping gives:

| Group | Sampled ms | Share |
|---|---:|---:|
| Other, including shared spatial helpers | 532264.8 | 65.65% |
| Navigation collision/path | 206247.0 | 25.44% |
| Garbage collection | 63959.3 | 7.89% |
| AI targeting | 3336.4 | 0.41% |
| World movement | 2934.4 | 0.36% |
| Node runtime | 1994.7 | 0.25% |
| Benchmark harness | 80.9 | 0.01% |

The dominant leaf self-time entries across all profiles are moverOverlapsBlockShapes (369439.3 ms), findPathOnGrid (138724.0 ms), clampSegmentBeforeShapes (73302.5 ms), garbage collector (63953.3 ms), segmentEntryT (36796.8 ms), isPaddedSegmentClear (34512.4 ms), spatial get (32718.5 ms), findPathForMover (18223.0 ms), and navGrid get (9098.0 ms). The coarse other bucket includes spatial helpers because those helpers are in the shared spatial module.

| Cell / seed | Profile sampled ms | Top navigation-related self | Dominant navigation caller stack and leaf mass |
|---|---:|---|---|
| 03-A / 44017 | 76307.2 | moverOverlapsBlockShapes, 34457.0 ms | selectAutoCombatAction to pickPathReachableTarget to monsterHasPath to findPathForMover to findPathOnGrid to isPaddedSegmentClear to moverOverlapsBlockShapes, 12137.2 ms |
| 03-A / 46021 | 120242.7 | moverOverlapsBlockShapes, 56681.6 ms | updateAutoTargets to nearestEngageableMonster to monsterHasPath to findPathForMover to findPathOnGrid to isPaddedSegmentClear to moverOverlapsBlockShapes, 20009.2 ms |
| 03-A / 48017 | 120653.7 | moverOverlapsBlockShapes, 58141.1 ms | selectAutoCombatAction to pickPathReachableTarget to monsterHasPath to findPathForMover to findPathOnGrid to isPaddedSegmentClear to moverOverlapsBlockShapes, 20423.7 ms |
| 03-S / 44017 | 120827.9 | moverOverlapsBlockShapes, 57032.1 ms | updateAutoTargets to nearestEngageableMonster to monsterHasPath to findPathForMover to findPathOnGrid to isPaddedSegmentClear to moverOverlapsBlockShapes, 19896.8 ms |
| 03-S / 46021 | 1921.3 | moverOverlapsBlockShapes, 106.8 ms | selectAutoCombatAction to pickPathReachableTarget to monsterHasPath to findPathForMover to findPathOnGrid to isPaddedSegmentClear to moverOverlapsBlockShapes, 42.5 ms |
| 03-S / 48017 | 120481.4 | moverOverlapsBlockShapes, 57912.0 ms | updateAutoTargets to nearestEngageableMonster to monsterHasPath to findPathForMover to findPathOnGrid to isPaddedSegmentClear to moverOverlapsBlockShapes, 20284.8 ms |
| 05-A / 44017 | 120218.9 | moverOverlapsBlockShapes, 55438.3 ms | selectAutoCombatAction to pickPathReachableTarget to monsterHasPath to findPathForMover to findPathOnGrid to isPaddedSegmentClear to moverOverlapsBlockShapes, 19373.4 ms |
| 05-A / 46021 | 2011.6 | rectGap, 124.6 ms | updateAutoTargets to steerTowardTarget to reachablePullPoint to findPathForMover to findPathOnGrid to isPaddedSegmentClear to moverOverlapsBlockShapes, 21.6 ms |
| 05-A / 48017 | 2300.7 | rectGap, 125.8 ms | anonymous tick to updateAutoTargets to selectAutoCombatAction to pickPathReachableTarget to monsterHasPath to findPathForMover, 8.9 ms |
| 05-Spirit / 44017 | 2571.3 | moverOverlapsBlockShapes, 301.2 ms | selectAutoCombatAction to pickPathReachableTarget to monsterHasPath to findPathForMover to findPathOnGrid to isPaddedSegmentClear to moverOverlapsBlockShapes, 105.9 ms |
| 05-Spirit / 46021 | 121287.8 | moverOverlapsBlockShapes, 49159.1 ms | updateAutoTargets to nearestEngageableMonster to monsterHasPath to findPathForMover to findPathOnGrid to isPaddedSegmentClear to moverOverlapsBlockShapes, 17256.4 ms |
| 05-Spirit / 48017 | 1993.0 | rectGap, 96.2 ms | pickPathReachableTarget to monsterHasPath to findPathForMover to findPathOnGrid to isSegmentWalkableOnGrid to isPaddedSegmentClear to moverOverlapsBlockShapes, 10.9 ms |

The same expensive path/collision chain appears under both selectAutoCombatAction and the nearestEngageableMonster fallback. The three largest aggregate caller paths are:

- updateAutoTargets to nearestEngageableMonster to monsterHasPath to findPathForMover to findPathOnGrid to isPaddedSegmentClear to moverOverlapsBlockShapes: 128970.5 ms
- selectAutoCombatAction to pickPathReachableTarget to monsterHasPath to findPathForMover to findPathOnGrid to isPaddedSegmentClear to moverOverlapsBlockShapes: 128664.8 ms
- World.tick to updateAutoTargets to selectAutoCombatAction to pickPathReachableTarget to monsterHasPath to findPathForMover to findPathOnGrid: 69192.5 ms

These aggregate stacks overlap by design. They identify the call chain, not additive CPU partitions.

## Endpoint and frozen-geometry audit

The frozen Jungle grids are 32-pixel cells, 150 by 150 cells. Node03 has 15 static regions and node05 has 12. The dominant requests were checked against the frozen navigation and collision builders.

| Cell / seed | Dominant from to to | Start geometry | Destination geometry | Result |
|---|---|---|---|---|
| 03-A / 44017 | (3622,4084) to (3909,3211) | node03 jungle_bush_3 status; slow; player target; circle center (3491,3645), radius 446 | No static-region overlap | 64/64 null with hazard avoidance |
| 03-A / 46021 | (4121,2334) to (1869,757) | node03 jungle_bush_2 status; slow; player target; circle center (4000,1883), radius 465 | node03 jungle_bush_1 status; slow; player target; circle center (1935,913), radius 361 | 72/72 null with hazard avoidance |
| 03-A / 48017 | (1253,2345) to (4238,2499) | node03 jungle_bush_0 status; slow; player target; circle center (885,2087), radius 432 | No static-region overlap | 76/76 null with hazard avoidance |
| 03-S / 44017 | (1669,4072) to (429,4562) | node03 jungle_bush_4 status; slow; player target; circle center (1690,3656), radius 398 | No static-region overlap | 80/80 null with hazard avoidance |
| 03-S / 48017 | (1623,1104) to (2086,2502) | node03 jungle_bush_1 status; slow; player target; circle center (1935,913), radius 361 | No static-region overlap | 82/82 null with hazard avoidance |
| 05-A / 44017 | (1566,2269) to (2240,847) | node05 jungle_bush_1 status; slow; player target; circle center (1127,2320), radius 426 | No static-region overlap | 70/70 null with hazard avoidance |
| 05-Spirit / 46021 | (603,4424) to (4274,1971) | node05 jungle_bush_3 status; slow; player target; circle center (635,4053), radius 477 | No static-region overlap | 72/72 null with hazard avoidance |

The listed bushes are status-only regions, not movement-block regions. Their statusWhileInside slow is applied to the player. hazardAvoidanceShapesForMover includes shapes with statusWhileInside or damage effects, so they are present in the hazard-aware navigation grid. The current dynamic hazard escape set is built from active persistent ground zones and active player damage features; it does not include these status-only features.

For the exact dominant keys from 03-A/44017, 03-A/46021, and 05-Spirit/46021, a read-only frozen-source probe produced null with avoidHazards=true and a direct one-point path to the same destination with avoidHazards=false. This contrast rules against treating the result as a generally unreachable destination or a broken physical collider. It shows that the extra hazard-avoidance geometry changes the result while the physical status bush itself is not a block shape.

The normal successful contrast was 05-A/46021: its dominant successful request was called six times with zero null results and returned a 29-waypoint path ending at the requested destination. Neither endpoint overlapped a static region. A 05-Spirit/44017 successful request had a one-call 24.9 ms route, demonstrating that successful route cost exists but does not match the repeated-null signature of the wall-ceiling rows.

## Mechanism decision

The evidence ranks the candidate mechanisms as follows:

1. Repeated unreachable queries: supported. Wall-ceiling rows have 94.1–99.6% null paths, 680–800 null path calls in their largest one-second intervals, fixed positions, no movement/path state, repeated exact keys, and a status-only hazard start. The same chain is visible from both target-selection branches.
2. Costly successful routes: secondary, not the cutoff mechanism. Normal rows have zero null paths and low path-ms-per-sim-second values of 0.15–4.6, with only isolated successful-route spikes.
3. Target churn: not the primary cause. Target selection and movement vary during normal combat, but the heaviest cutoff intervals have no selected target, target, motion, or path while path requests continue.
4. Other runtime work: garbage collection is measurable at about 7.89% of sampled time, but navigation collision and shared spatial work dominate the diagnostic profile. It does not account for the endpoint-specific null behavior.

The mechanism is therefore: a player enters a status-only slow bush; hazard-aware candidate paths reject the initial padded segment from inside that status shape; auto-target reachability scanning repeats the rejection against many monsters; CPU and wall time rise until the harness wall ceiling, while the gameplay state remains quiet and stationary.

## One repair hypothesis — not implemented

Extend the existing persistent-hazard escape owner so that it also claims escape for a live player-targeted statusWhileInside feature, including the Jungle slow-bush case. The escape leg should use the existing real-collision and node-standability checks and avoidHazards=false for the short exit route. The escape owner should remain active until the player is outside the status feature's clear envelope; ordinary hazard-aware targeting should resume only after that safe exit.

Regression invariants for a future implementation:

1. Escape triggers only while the player is inside a live player-targeted status, damage, or persistent hazard. Outside behavior and target priority remain unchanged.
2. The destination is inside the current node and physically standable against world collision.blockShapes and resolveObstaclesForNode. No static-block routing or collider resizing is introduced.
3. While escaping, no combat or retargeting movement owner overrides the escape. Once safe, selected-target acquisition, attack, and ordinary motion resume.
4. Clear paths and currently successful hazard-aware paths remain unchanged, including attack-range and target-reachability semantics.
5. Add a regression case that starts inside a status-only slow bush, exits to a safe standable point outside its envelope, then acquires and approaches a target. Keep existing dynamic-hazard, telegraph, retarget, and combat tests green.

This packet does not implement the hypothesis, choose a production balance change, add a cache/debounce workaround, or launch a validation follow-up.

## Stop point and remaining campaign scope

Durability31 is complete at the required diagnostic boundary. No Trench or Mountain repeat was requested or run. The next campaign step remains current-source consolidation and regression planning; any repair must be separately scoped, implemented, tested, and live-play validated.

## Artifact index

Primary batch root:

C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability31-20260917

Key artifacts:

- results/batch-manifest.json
- results/jungle/manifest.json
- results/jungle/index.json
- results/jungle/complete.json
- results/jungle/verification.json
- results/jungle/analysis.json
- results/jungle/analysis.md
- results/jungle/night5-audit.json
- results/jungle/operator-ledger.jsonl
- results/jungle/*-navigation.json
- results/jungle/*.cpuprofile
- results/jungle/<observation>/ready.json
- results/jungle/<observation>/events.jsonl
- results/jungle/<observation>/samples.jsonl
- results/jungle/<observation>/summary.json
- operator-exit.json

The matching Durability30 comparison artifacts are under:

C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability30-20260917/results/jungle
