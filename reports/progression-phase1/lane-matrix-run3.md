# Lineage lane matrix — Tier 1 and 2

Generated 2026-10-01T18:52:36.222Z from `9746da9d8b234567461959a9cbcdc6523235124f`.
20 lane reference profiles x 60 distinct node blends, plus 18 frame references x 12 nodes, x 2 seeds (101009, 101033), 90 s of sim per cell per seed; 2832 measured runs; wall clock 44.7 min.

Throughput is kills per minute of SIM time with repopulation on; TTK is engaged
milliseconds per kill, which divides out the walk between mobs. Uplift is the
cell against the SAME lineage’s lane-less control on the SAME node — the only
reading in which the lane, and not the class or the weapon, is the variable.

The criteria are design §18.9's, which replaced §9's: the lane budget band is the
median uplift **±3 percentage points, absolute**, and the encounter check is an
**ordinal** reading — does the favoured lane out-uplift the punished lane on that
family's own node, and by what margin? The margin is reported, never thresholded.

The references are unchanged by the addition of Tier 2: a Tier-1 band on a Tier-2
encounter is the character the gate hands over, so the T2 rows read as "what does
a T1 lane still buy here" and their death counts are part of the answer.

## What the map actually offers

A node fields only `monsterPoolByTier[its tier]`, so `resolveNodeBlend` drops any
family with no member in that pool and rescales its share onto the rest. The
authored blends are the design target; the resolved ones are the encounters that
exist today. A row where they differ is a family the map cannot field at that tier.

| node | tier | biome | authored blend | resolved blend | shares this row | mobs (of 10 slots) |
|---|---:|---|---|---|---|---|
| `node-t1-mountain-01` | 1 | mountain | Crag 70% / Ridge 20% / Hopper 10% | Crag 70% / Ridge 20% / Hopper 10% | 1 node(s): t1-mountain-01 | rockback-ram x7, ridge-archer x2, cliff-hopper x1 |
| `node-t1-mountain-02` | 1 | mountain | Ridge 70% / Hopper 20% / Crag 10% | Ridge 70% / Hopper 20% / Crag 10% | 1 node(s): t1-mountain-02 | ridge-archer x7, cliff-hopper x2, rockback-ram x1 |
| `node-t1-mountain-03` | 1 | mountain | Hopper 70% / Crag 20% / Ridge 10% | Hopper 70% / Crag 20% / Ridge 10% | 1 node(s): t1-mountain-03 | cliff-hopper x7, rockback-ram x2, ridge-archer x1 |
| `node-t1-mountain-04` | 1 | mountain | Crag 45% / Ridge 45% / Hopper 10% | Crag 45% / Ridge 45% / Hopper 10% | 1 node(s): t1-mountain-04 | rockback-ram x5, ridge-archer x4, cliff-hopper x1 |
| `node-t1-mountain-05` | 1 | mountain | Crag 34% / Ridge 33% / Hopper 33% | Crag 34% / Ridge 33% / Hopper 33% | 1 node(s): t1-mountain-05 | rockback-ram x4, ridge-archer x3, cliff-hopper x3 |
| `node-t1-cave-01` | 1 | cave | Brood 70% / Brute 20% / Deep 10% | Brood 70% / Brute 20% / Deep 10% | 1 node(s): t1-cave-01 | brood-spiderling x7, cave-brute x2, cave-lurker x1 |
| `node-t1-cave-02` | 1 | cave | Brute 70% / Deep 20% / Brood 10% | Brute 70% / Deep 20% / Brood 10% | 1 node(s): t1-cave-02 | cave-brute x7, cave-lurker x2, brood-spiderling x1 |
| `node-t1-cave-03` | 1 | cave | Deep 70% / Brood 20% / Brute 10% | Deep 70% / Brood 20% / Brute 10% | 1 node(s): t1-cave-03 | cave-lurker x7, brood-spiderling x2, cave-brute x1 |
| `node-t1-cave-04` | 1 | cave | Brood 45% / Brute 45% / Deep 10% | Brood 45% / Brute 45% / Deep 10% | 1 node(s): t1-cave-04 | brood-spiderling x5, cave-brute x4, cave-lurker x1 |
| `node-t1-cave-05` | 1 | cave | Brood 34% / Brute 33% / Deep 33% | Brood 34% / Brute 33% / Deep 33% | 1 node(s): t1-cave-05 | brood-spiderling x4, cave-brute x3, cave-lurker x3 |
| `node-t1-forest-01` | 1 | forest | Pack 70% / Grove 20% / Canopy 10% | Pack 70% / Grove 20% / Canopy 10% | 1 node(s): t1-forest-01 | wolf x7, forest-slime x2, bramble-pod x1 |
| `node-t1-forest-02` | 1 | forest | Grove 70% / Canopy 20% / Pack 10% | Grove 70% / Canopy 20% / Pack 10% | 1 node(s): t1-forest-02 | forest-slime x7, bramble-pod x2, wolf x1 |
| `node-t1-forest-03` | 1 | forest | Canopy 70% / Pack 20% / Grove 10% | Canopy 70% / Pack 20% / Grove 10% | 1 node(s): t1-forest-03 | bramble-pod x7, wolf x2, forest-slime x1 |
| `node-t1-forest-04` | 1 | forest | Pack 45% / Grove 45% / Canopy 10% | Pack 45% / Grove 45% / Canopy 10% | 1 node(s): t1-forest-04 | wolf x5, forest-slime x4, bramble-pod x1 |
| `node-t1-forest-05` | 1 | forest | Pack 34% / Grove 33% / Canopy 33% | Pack 34% / Grove 33% / Canopy 33% | 1 node(s): t1-forest-05 | wolf x4, forest-slime x3, bramble-pod x3 |
| `node-t1-plains-01` | 1 | plains | Herd 70% / Swarm 20% / Sky 10% | Herd 70% / Swarm 20% / Sky 10% | 1 node(s): t1-plains-01 | boar x7, plains-slime x2, grass-kite x1 |
| `node-t1-plains-02` | 1 | plains | Swarm 70% / Sky 20% / Herd 10% | Swarm 70% / Sky 20% / Herd 10% | 1 node(s): t1-plains-02 | plains-slime x7, grass-kite x2, boar x1 |
| `node-t1-plains-03` | 1 | plains | Sky 70% / Herd 20% / Swarm 10% | Sky 70% / Herd 20% / Swarm 10% | 1 node(s): t1-plains-03 | grass-kite x7, boar x2, plains-slime x1 |
| `node-t1-plains-04` | 1 | plains | Herd 45% / Swarm 45% / Sky 10% | Herd 45% / Swarm 45% / Sky 10% | 1 node(s): t1-plains-04 | boar x5, plains-slime x4, grass-kite x1 |
| `node-t1-plains-05` | 1 | plains | Herd 34% / Swarm 33% / Sky 33% | Herd 34% / Swarm 33% / Sky 33% | 1 node(s): t1-plains-05 | boar x4, plains-slime x3, grass-kite x3 |
| `node-t1-swamp-01` | 1 | swamp | Mire 70% / Coven 20% / Stalker 10% | Mire 70% / Coven 20% / Stalker 10% | 1 node(s): t1-swamp-01 | bog-slime x7, fen-hexer x2, mud-toad x1 |
| `node-t1-swamp-02` | 1 | swamp | Coven 70% / Stalker 20% / Mire 10% | Coven 70% / Stalker 20% / Mire 10% | 1 node(s): t1-swamp-02 | fen-hexer x7, mud-toad x2, bog-slime x1 |
| `node-t1-swamp-03` | 1 | swamp | Stalker 70% / Mire 20% / Coven 10% | Stalker 70% / Mire 20% / Coven 10% | 1 node(s): t1-swamp-03 | mud-toad x7, bog-slime x2, fen-hexer x1 |
| `node-t1-swamp-04` | 1 | swamp | Mire 45% / Coven 45% / Stalker 10% | Mire 45% / Coven 45% / Stalker 10% | 1 node(s): t1-swamp-04 | bog-slime x5, fen-hexer x4, mud-toad x1 |
| `node-t1-swamp-05` | 1 | swamp | Mire 34% / Coven 33% / Stalker 33% | Mire 34% / Coven 33% / Stalker 33% | 1 node(s): t1-swamp-05 | bog-slime x4, fen-hexer x3, mud-toad x3 |
| `node-t2-forest-01` | 2 | forest | Pack 70% / Grove 20% / Canopy 10% | Pack 70% / Grove 20% / Canopy 10% | 1 node(s): t2-forest-01 | ancient-wolf x7, ironwood-golem x2, canopy-sprite x1 |
| `node-t2-forest-02` | 2 | forest | Grove 70% / Canopy 20% / Pack 10% | Grove 70% / Canopy 20% / Pack 10% | 1 node(s): t2-forest-02 | ironwood-golem x7, canopy-sprite x2, ancient-wolf x1 |
| `node-t2-forest-03` | 2 | forest | Canopy 70% / Pack 20% / Grove 10% | Canopy 70% / Pack 20% / Grove 10% | 1 node(s): t2-forest-03 | canopy-sprite x7, ancient-wolf x2, ironwood-golem x1 |
| `node-t2-forest-04` | 2 | forest | Pack 45% / Grove 45% / Canopy 10% | Pack 45% / Grove 45% / Canopy 10% | 1 node(s): t2-forest-04 | ancient-wolf x5, ironwood-golem x4, canopy-sprite x1 |
| `node-t2-forest-05` | 2 | forest | Pack 34% / Grove 33% / Canopy 33% | Pack 34% / Grove 33% / Canopy 33% | 1 node(s): t2-forest-05 | ancient-wolf x4, ironwood-golem x3, canopy-sprite x3 |
| `node-t2-plains-01` | 2 | plains | Herd 70% / Swarm 20% / Sky 10% | Herd 70% / Swarm 20% / Sky 10% | 1 node(s): t2-plains-01 | stampede-bull x7, prairie-wolf x2, savanna-hawk x1 |
| `node-t2-plains-02` | 2 | plains | Swarm 70% / Sky 20% / Herd 10% | Swarm 70% / Sky 20% / Herd 10% | 1 node(s): t2-plains-02 | prairie-wolf x7, savanna-hawk x2, stampede-bull x1 |
| `node-t2-plains-03` | 2 | plains | Sky 70% / Herd 20% / Swarm 10% | Sky 70% / Herd 20% / Swarm 10% | 1 node(s): t2-plains-03 | savanna-hawk x7, stampede-bull x2, prairie-wolf x1 |
| `node-t2-plains-04` | 2 | plains | Herd 45% / Swarm 45% / Sky 10% | Herd 45% / Swarm 45% / Sky 10% | 1 node(s): t2-plains-04 | stampede-bull x5, prairie-wolf x4, savanna-hawk x1 |
| `node-t2-plains-05` | 2 | plains | Herd 34% / Swarm 33% / Sky 33% | Herd 34% / Swarm 33% / Sky 33% | 1 node(s): t2-plains-05 | stampede-bull x4, prairie-wolf x3, savanna-hawk x3 |
| `node-t2-mountain-01` | 2 | mountain | Crag 70% / Ridge 20% / Hopper 10% | Crag 70% / Ridge 20% / Hopper 10% | 1 node(s): t2-mountain-01 | granite-titan x7, peak-archer x2, stone-eagle x1 |
| `node-t2-mountain-02` | 2 | mountain | Ridge 70% / Hopper 20% / Crag 10% | Ridge 70% / Hopper 20% / Crag 10% | 1 node(s): t2-mountain-02 | peak-archer x7, stone-eagle x2, granite-titan x1 |
| `node-t2-mountain-03` | 2 | mountain | Hopper 70% / Crag 20% / Ridge 10% | Hopper 70% / Crag 20% / Ridge 10% | 1 node(s): t2-mountain-03 | stone-eagle x7, granite-titan x2, peak-archer x1 |
| `node-t2-mountain-04` | 2 | mountain | Crag 45% / Ridge 45% / Hopper 10% | Crag 45% / Ridge 45% / Hopper 10% | 1 node(s): t2-mountain-04 | granite-titan x5, peak-archer x4, stone-eagle x1 |
| `node-t2-mountain-05` | 2 | mountain | Crag 34% / Ridge 33% / Hopper 33% | Crag 34% / Ridge 33% / Hopper 33% | 1 node(s): t2-mountain-05 | granite-titan x4, peak-archer x3, stone-eagle x3 |
| `node-t2-cave-01` | 2 | cave | Brood 70% / Brute 20% / Deep 10% | Brood 70% / Brute 20% / Deep 10% | 1 node(s): t2-cave-01 | giant-spider x7, cave-troll x2, cave-gargoyle x1 |
| `node-t2-cave-02` | 2 | cave | Brute 70% / Deep 20% / Brood 10% | Brute 70% / Deep 20% / Brood 10% | 1 node(s): t2-cave-02 | cave-troll x7, cave-gargoyle x2, giant-spider x1 |
| `node-t2-cave-03` | 2 | cave | Deep 70% / Brood 20% / Brute 10% | Deep 70% / Brood 20% / Brute 10% | 1 node(s): t2-cave-03 | cave-gargoyle x7, giant-spider x2, cave-troll x1 |
| `node-t2-cave-04` | 2 | cave | Brood 45% / Brute 45% / Deep 10% | Brood 45% / Brute 45% / Deep 10% | 1 node(s): t2-cave-04 | giant-spider x5, cave-troll x4, cave-gargoyle x1 |
| `node-t2-cave-05` | 2 | cave | Brood 34% / Brute 33% / Deep 33% | Brood 34% / Brute 33% / Deep 33% | 1 node(s): t2-cave-05 | giant-spider x4, cave-troll x3, cave-gargoyle x3 |
| `node-t2-cave-06` | 2 | cave | Brute 55% / Deep 30% / Brood 15% | Brute 55% / Deep 30% / Brood 15% | 1 node(s): t2-cave-06 | cave-troll x6, cave-gargoyle x3, giant-spider x1 |
| `node-t2-swamp-01` | 2 | swamp | Mire 70% / Coven 20% / Stalker 10% | Coven 67% / Stalker 33% | 1 node(s): t2-swamp-01 | swamp-hydra x4, mire-stalker x3, bog-witch x3 |
| `node-t2-swamp-02` | 2 | swamp | Coven 70% / Stalker 20% / Mire 10% | Coven 78% / Stalker 22% | 2 node(s): t2-swamp-02, t2-swamp-04 | swamp-hydra x4, bog-witch x4, mire-stalker x2 |
| `node-t2-swamp-03` | 2 | swamp | Stalker 70% / Mire 20% / Coven 10% | Stalker 88% / Coven 13% | 1 node(s): t2-swamp-03 | mire-stalker x9, swamp-hydra x1 |
| `node-t2-swamp-05` | 2 | swamp | Mire 34% / Coven 33% / Stalker 33% | Coven 50% / Stalker 50% | 1 node(s): t2-swamp-05 | mire-stalker x5, swamp-hydra x3, bog-witch x2 |
| `node-t2-swamp-06` | 2 | swamp | Coven 55% / Stalker 30% / Mire 15% | Coven 65% / Stalker 35% | 1 node(s): t2-swamp-06 | mire-stalker x4, swamp-hydra x3, bog-witch x3 |
| `node-t2-jungle-01` | 2 | jungle | Ape 70% / Undergrowth 20% / Stalker 10% | Ape 78% / Undergrowth 22% | 1 node(s): t2-jungle-01 | jungle-ape x8, jungle-snake x1, jungle-blowdarter x1 |
| `node-t2-jungle-02` | 2 | jungle | Undergrowth 70% / Stalker 20% / Ape 10% | Undergrowth 88% / Ape 13% | 1 node(s): t2-jungle-02 | jungle-snake x5, jungle-blowdarter x4, jungle-ape x1 |
| `node-t2-jungle-03` | 2 | jungle | Stalker 70% / Ape 20% / Undergrowth 10% | Ape 67% / Undergrowth 33% | 1 node(s): t2-jungle-03 | jungle-ape x7, jungle-snake x2, jungle-blowdarter x1 |
| `node-t2-jungle-04` | 2 | jungle | Ape 45% / Undergrowth 45% / Stalker 10% | Ape 50% / Undergrowth 50% | 2 node(s): t2-jungle-04, t2-jungle-05 | jungle-ape x5, jungle-snake x3, jungle-blowdarter x2 |
| `node-t2-desert-01` | 2 | desert | Basilisk 70% / Scorpion 30% | Basilisk 70% / Scorpion 30% | 1 node(s): t2-desert-01 | stone-basilisk x7, sand-scorpion x3 |
| `node-t2-desert-02` | 2 | desert | Scorpion 70% / Basilisk 30% | Scorpion 70% / Basilisk 30% | 1 node(s): t2-desert-02 | sand-scorpion x7, stone-basilisk x3 |
| `node-t2-desert-03` | 2 | desert | Basilisk 60% / Scorpion 40% | Basilisk 60% / Scorpion 40% | 1 node(s): t2-desert-03 | stone-basilisk x6, sand-scorpion x4 |
| `node-t2-desert-04` | 2 | desert | Scorpion 60% / Basilisk 40% | Scorpion 60% / Basilisk 40% | 1 node(s): t2-desert-04 | sand-scorpion x6, stone-basilisk x4 |
| `node-t2-desert-05` | 2 | desert | Basilisk 50% / Scorpion 50% | Basilisk 50% / Scorpion 50% | 1 node(s): t2-desert-05 | stone-basilisk x5, sand-scorpion x5 |

## TTK per lane per node

Milliseconds of ENGAGED time per kill, pooled over both seeds. Lower is faster.

**Tier 1**

| profile | lane | class | t1-mountain-01 | t1-mountain-02 | t1-mountain-03 | t1-mountain-04 | t1-mountain-05 | t1-cave-01 | t1-cave-02 | t1-cave-03 | t1-cave-04 | t1-cave-05 | t1-forest-01 | t1-forest-02 | t1-forest-03 | t1-forest-04 | t1-forest-05 | t1-plains-01 | t1-plains-02 | t1-plains-03 | t1-plains-04 | t1-plains-05 | t1-swamp-01 | t1-swamp-02 | t1-swamp-03 | t1-swamp-04 | t1-swamp-05 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 8181 | 6000 | 5800 | 7169 | 7071 | 2691 | 7500 | 7542 | 4205 | 3721 | 2393 | 3905 | 3288 | 2502 | 3106 | 2402 | 1767 | 2700 | 2027 | 2346 | 3148 | 3289 | 3079 | 3126 | 3259 |
| `lineage-broadsword-empowered` | empowered | energy | 6961 | 5421 | 5970 | 6544 | 6550 | 2966 | 7240 | 4574 | 4376 | 3868 | 2509 | 4143 | 3412 | 2712 | 3644 | 2319 | 1677 | 2711 | 1856 | 2134 | 3114 | 3279 | 3096 | 3187 | 3119 |
| `lineage-broadsword-tempo` | tempo | energy | 6961 | 5421 | 6127 | 6544 | 6550 | 2966 | 7240 | 4574 | 4376 | 3868 | 2509 | 4143 | 3412 | 2712 | 3644 | 2424 | 1677 | 2711 | 1856 | 2278 | 3114 | 3279 | 3096 | 3187 | 3119 |
| `lineage-broadsword-baseline` | _control_ | energy | 8263 | 5421 | 6118 | 6941 | 6894 | 3037 | 7760 | 5731 | 3656 | 3936 | 2509 | 4143 | 3412 | 2712 | 3644 | 2424 | 1677 | 2711 | 1856 | 2278 | 3114 | 3279 | 3096 | 3187 | 3119 |
| `lineage-rapier-tempo` | tempo | cadence | 6627 | 5510 | 4955 | 5450 | 5728 | 2610 | 7945 | 4044 | 3473 | 3365 | 1831 | 3091 | 2604 | 1975 | 2349 | 1764 | 1392 | 2335 | 1538 | 1683 | 3056 | 3317 | 3155 | 3164 | 3153 |
| `lineage-rapier-affliction` | affliction | cadence | 6424 | 6136 | 5589 | 6124 | 6400 | 2497 | 7545 | 4382 | 4289 | 3538 | 1930 | 3584 | 2848 | 2311 | 2684 | 1830 | 1555 | 2417 | 1715 | 1878 | 3207 | 2680 | 2952 | 2887 | 2895 |
| `lineage-rapier-engagement` | engagement | cadence | 6138 | 5195 | 4782 | 5428 | 5317 | 2368 | 6358 | 3933 | 3868 | 3414 | 1907 | 3597 | 2793 | 2303 | 2759 | 1776 | 1533 | 2142 | 1508 | 1830 | 2795 | 2580 | 2641 | 2688 | 2676 |
| `lineage-rapier-baseline` | _control_ | cadence | 6893 | 6164 | 5419 | 6853 | 6275 | 2490 | 8410 | 4731 | 4522 | 3538 | 1976 | 3590 | 2848 | 2422 | 2684 | 1843 | 1549 | 2534 | 1689 | 1852 | 3456 | 3615 | 3455 | 3475 | 3315 |
| `lineage-hammer-empowered` | empowered | cooldown | 5400 | 5976 | 5582 | 5289 | 5361 | 2764 | 4585 | 3650 | 3121 | 3087 | 2023 | 4632 | 3727 | 2370 | 2733 | 2678 | 1867 | 3080 | 2251 | 2419 | 2817 | 3204 | 3553 | 3695 | 3495 |
| `lineage-hammer-control` | control | cooldown | 5400 | 5724 | 5582 | 5217 | 5083 | 2764 | 4485 | 3500 | 3121 | 2752 | 2023 | 4632 | 3727 | 2370 | 2733 | 2678 | 1867 | 3080 | 2251 | 2419 | 2817 | 3204 | 3553 | 3695 | 3495 |
| `lineage-hammer-engagement` | engagement | cooldown | 5206 | 5600 | 5782 | 5350 | 5078 | 2955 | 4138 | 3506 | 2881 | 2716 | 2378 | 4660 | 3224 | 2582 | 2888 | 2587 | 1861 | 3237 | 2320 | 2419 | 2817 | 3213 | 3553 | 3695 | 3233 |
| `lineage-hammer-baseline` | _control_ | cooldown | 5738 | 5976 | 5476 | 6225 | 5535 | 2650 | 4857 | 3650 | 3411 | 3109 | 2023 | 4632 | 3727 | 2583 | 2733 | 3220 | 1827 | 3080 | 2647 | 2226 | 2918 | 4211 | 3553 | 4153 | 3674 |
| `lineage-axe-tempo` | tempo | dot | 8233 | 8277 | 7006 | 8100 | 8231 | 4032 | 8475 | 6257 | 5450 | 5969 | 3527 | 4790 | 3933 | 3755 | 3820 | 3251 | 2584 | 3727 | 3121 | 3491 | 4773 | 4682 | 4844 | 4350 | 4394 |
| `lineage-axe-kill-chain` | kill-chain | dot | 8427 | 8115 | 7141 | 8293 | 8408 | 4005 | 8471 | 6500 | 4844 | 5581 | 3357 | 4674 | 3652 | 3916 | 4231 | 3212 | 2616 | 3557 | 2900 | 3438 | 4627 | 4547 | 4776 | 4435 | 4474 |
| `lineage-axe-empowered` | empowered | dot | 8233 | 8277 | 7006 | 8100 | 8231 | 4232 | 7750 | 5807 | 5211 | 5442 | 3527 | 5033 | 4220 | 3509 | 3574 | 3161 | 2584 | 3727 | 3121 | 3491 | 4773 | 4682 | 4844 | 4350 | 4394 |
| `lineage-axe-baseline` | _control_ | dot | 8233 | 8277 | 7006 | 8100 | 8231 | 4032 | 8475 | 6257 | 5450 | 5969 | 3527 | 4829 | 4264 | 3755 | 3820 | 3251 | 2584 | 3727 | 3121 | 3491 | 4773 | 4682 | 4844 | 4350 | 4394 |
| `lineage-dagger-affliction` | affliction | reload | 6547 | 6480 | 5655 | 6747 | 6741 | 3019 | 6400 | 4329 | 3492 | 3809 | 2992 | 3641 | 3225 | 3043 | 3153 | 2474 | 1960 | 2731 | 2296 | 2335 | 3435 | 3079 | 3129 | 3170 | 3223 |
| `lineage-dagger-control` | control | reload | 5588 | 6019 | 5768 | 6139 | 6000 | 2886 | 6306 | 4906 | 4081 | 3755 | 2724 | 4068 | 3212 | 2881 | 3074 | 2829 | 1910 | 2737 | 2218 | 2441 | 3410 | 3254 | 3278 | 3223 | 3396 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 6856 | 6086 | 5890 | 6550 | 6650 | 3170 | 6460 | 5220 | 4621 | 3896 | 3191 | 4458 | 3164 | 2920 | 3587 | 2800 | 2051 | 3306 | 2409 | 2524 | 3227 | 3336 | 3217 | 3609 | 3348 |
| `lineage-dagger-baseline` | _control_ | reload | 6800 | 6121 | 5967 | 6625 | 6850 | 3016 | 7236 | 5357 | 4747 | 3600 | 3171 | 4461 | 3415 | 3453 | 3313 | 2826 | 2254 | 3241 | 2528 | 2724 | 3350 | 3500 | 3600 | 3514 | 3340 |

**Tier 2**

| profile | lane | class | t2-forest-01 | t2-forest-02 | t2-forest-03 | t2-forest-04 | t2-forest-05 | t2-plains-01 | t2-plains-02 | t2-plains-03 | t2-plains-04 | t2-plains-05 | t2-mountain-01 | t2-mountain-02 | t2-mountain-03 | t2-mountain-04 | t2-mountain-05 | t2-cave-01 | t2-cave-02 | t2-cave-03 | t2-cave-04 | t2-cave-05 | t2-cave-06 | t2-swamp-01 | t2-swamp-02 | t2-swamp-03 | t2-swamp-05 | t2-swamp-06 | t2-jungle-01 | t2-jungle-02 | t2-jungle-03 | t2-jungle-04 | t2-desert-01 | t2-desert-02 | t2-desert-03 | t2-desert-04 | t2-desert-05 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 7190 | 14400 | 7944 | 10120 | 10038 | 5424 | 3500 | 7105 | 5938 | 6932 | 22383 | 16700 | 21214 | 17613 | 40075 | 14075 | 35400 | 13763 | 36875 | 35425 | 48200 | 15771 | 12775 | 8850 | 11527 | 10990 | 42900 | 19900 | 31220 | 32825 | 34400 | 83750 | 32240 | 38675 | 53000 |
| `lineage-broadsword-empowered` | empowered | energy | 7100 | 19813 | 9462 | 8494 | 8563 | 6325 | 4370 | 6621 | 3786 | 6136 | 22517 | 13900 | 15222 | 27020 | 26380 | 17029 | 75550 | 13763 | 35025 | 22017 | 52100 | 15314 | 15213 | 9240 | 13878 | 9570 | 35475 | 22550 | 30740 | 22217 | 57967 | 81200 | 57300 | 82400 | 50867 |
| `lineage-broadsword-tempo` | tempo | energy | 7995 | 15820 | 9531 | 8300 | 8550 | 6325 | 4553 | 7405 | 5104 | 6136 | 18371 | 13900 | 15222 | 22850 | 30660 | 20200 | 77350 | 13850 | 37375 | 22050 | 53400 | 15357 | 20833 | 9070 | 17886 | 9600 | 51400 | 25460 | 38700 | 22400 | 57967 | 83350 | 57767 | 82400 | 50733 |
| `lineage-broadsword-baseline` | _control_ | energy | 7995 | 19775 | 9531 | 8300 | 8550 | 6380 | 4173 | 7405 | 5104 | 6136 | 18500 | 13900 | 15222 | 22850 | 30320 | 20200 | 77350 | 13850 | 37375 | 22050 | 53400 | 15357 | 20833 | 9070 | 17886 | 9600 | 51400 | 25460 | 38700 | 22400 | 57967 | 83350 | 57767 | 82400 | 50733 |
| `lineage-rapier-tempo` | tempo | cadence | 7875 | 14357 | 8254 | 12222 | 7840 | 5218 | 2559 | 4812 | 4277 | 4992 | 20600 | 16757 | 15678 | 36150 | 39100 | 8950 | 43067 | 8640 | 14000 | 16717 | 24100 | 8710 | 14271 | 6064 | 19733 | 15329 | 33950 | 9950 | 24760 | 14629 | — | — | — | — | — |
| `lineage-rapier-affliction` | affliction | cadence | 8492 | 17533 | 10767 | 10630 | 7993 | 4914 | 3103 | 7894 | 4896 | 6170 | 20771 | 17014 | 14267 | 27800 | 38675 | 9425 | 42633 | 9913 | 14450 | 14857 | 24560 | 10120 | 18817 | 7580 | 22520 | 11444 | 35050 | 19429 | 35925 | 19467 | — | — | — | — | — |
| `lineage-rapier-engagement` | engagement | cadence | 7506 | 17433 | 6378 | 6939 | 8792 | 5250 | 2727 | 5930 | 4412 | 6025 | 20357 | 16529 | 14267 | 35025 | 30580 | 8725 | 42500 | 9213 | 11871 | 13829 | 23400 | 10788 | 25325 | 5600 | 10178 | 8245 | 33950 | 12886 | 19500 | 17350 | — | — | — | — | — |
| `lineage-rapier-baseline` | _control_ | cadence | 8235 | 18363 | 10700 | 10823 | 16963 | 7159 | 3316 | 6510 | 5335 | 7050 | 24767 | 16871 | 24683 | 36250 | 51100 | — | 45667 | 20100 | 68300 | 29700 | 25680 | 7650 | 23280 | 7100 | 19467 | 11156 | 74350 | 30980 | 27200 | 23900 | — | — | — | — | — |
| `lineage-hammer-empowered` | empowered | cooldown | 10029 | 22900 | 14913 | 13856 | 11318 | 8231 | 3216 | 11375 | 4086 | 7600 | 17771 | 21283 | 19871 | 27100 | 38300 | 9386 | 145700 | 10650 | 21040 | 19267 | 71400 | 12063 | 11044 | 5293 | 10330 | 4800 | 33850 | 21300 | 36700 | 25260 | — | — | — | — | — |
| `lineage-hammer-control` | control | cooldown | 10064 | 22900 | 14913 | 13856 | 11318 | 7863 | 3216 | 11375 | 4176 | 7471 | 15875 | 21283 | 13760 | 35725 | 38725 | 7700 | 145700 | 10650 | 23320 | 19267 | 71400 | 12529 | 9910 | 5293 | 8345 | 4800 | 33750 | 21200 | 24880 | 25260 | — | — | — | — | — |
| `lineage-hammer-engagement` | engagement | cooldown | 10136 | 23000 | 14913 | 12409 | 11527 | 5275 | 3284 | 8019 | 5100 | 5555 | 15663 | 25520 | 15433 | 35800 | 38825 | 7700 | 145700 | 10725 | 30500 | 18800 | 71500 | 12657 | 9378 | 4593 | 10770 | 7567 | 33750 | 21280 | 21383 | 25280 | — | — | — | — | — |
| `lineage-hammer-baseline` | _control_ | cooldown | 9836 | 22500 | 14913 | 12220 | 11318 | 7524 | 3038 | 11533 | 7106 | 6542 | 19057 | 21283 | 23400 | 27700 | 38675 | 9386 | 145700 | 10650 | 21040 | 19267 | 71400 | 14414 | 14371 | 5253 | 9390 | 7945 | 28240 | 21300 | 36700 | 32100 | — | — | — | — | — |
| `lineage-axe-tempo` | tempo | dot | 6270 | 24950 | 10233 | 8671 | 8022 | 5452 | 4219 | 10243 | 5892 | 8647 | 53867 | 18633 | 78950 | 27340 | 20233 | 17400 | 68550 | 16117 | 26500 | 20260 | 31175 | 10513 | 13638 | 8344 | 11120 | 11825 | 38500 | 69900 | 71400 | 43867 | 54867 | 81800 | 57033 | 160800 | 86450 |
| `lineage-axe-kill-chain` | kill-chain | dot | 6911 | 17325 | 13575 | 9487 | 11275 | 6027 | 3736 | 9887 | 5276 | 6095 | 51100 | 25120 | 21543 | 36850 | 32575 | 28825 | 155900 | 14029 | 70750 | 30600 | 43133 | 8644 | 11350 | 9111 | 12888 | 10822 | 172100 | 144900 | 77150 | 166000 | 56833 | — | 56767 | 82500 | 79250 |
| `lineage-axe-empowered` | empowered | dot | 5872 | 24950 | 10233 | 9438 | 7245 | 5452 | 4586 | 8725 | 5892 | 8647 | 79200 | 18683 | 78950 | 27340 | 20233 | 17183 | 68550 | 15300 | 23360 | 19960 | 32250 | 10513 | 13038 | 8344 | 16929 | 12013 | 38500 | 69900 | 71400 | 43867 | 54333 | 82400 | 56067 | 160800 | 167800 |
| `lineage-axe-baseline` | _control_ | dot | 6270 | 23783 | 13775 | 8671 | 8659 | 5438 | 4219 | 10243 | 5892 | 8647 | 80450 | 21900 | 28240 | 27240 | 23940 | 17400 | 68550 | 16117 | 26500 | 20260 | 31175 | 10425 | 12950 | 8344 | 13311 | 11150 | 38500 | 69900 | 71400 | 43867 | 42225 | 81800 | 57033 | 154700 | 86450 |
| `lineage-dagger-affliction` | affliction | reload | 8011 | 16338 | 8877 | 8641 | 9031 | 8260 | 4100 | 7460 | 5133 | 7400 | 17700 | 12738 | 20871 | 18157 | 35225 | 12714 | 43767 | 11225 | 25240 | 12488 | 21780 | 10411 | 12363 | 7360 | 10160 | 10489 | 25350 | 19833 | 19300 | 33950 | 40675 | 80600 | 56867 | 55367 | 83700 |
| `lineage-dagger-control` | control | reload | 8539 | 14440 | 7412 | 8605 | 7790 | 5170 | 3967 | 8128 | 4732 | 6050 | 16743 | 15057 | 28380 | 16443 | 20529 | 11814 | 22920 | 11138 | 18300 | 19217 | 29750 | 12738 | 8940 | 6782 | 8460 | 9880 | 29720 | 16729 | 37275 | 20200 | 43525 | — | 54467 | 52233 | 164400 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 8153 | 13810 | 7808 | 10929 | 12955 | 5113 | 4507 | 11931 | 7314 | 5850 | 21383 | 13514 | 15863 | 25060 | 33950 | 12450 | 23980 | 12113 | 31725 | 31375 | 25800 | 9078 | 12750 | 7150 | 10278 | 11244 | 37250 | 51167 | 25733 | 51233 | 40875 | 80400 | 79450 | 83800 | 83150 |
| `lineage-dagger-baseline` | _control_ | reload | 7519 | 21486 | 8243 | 8750 | 9964 | 6894 | 4216 | 10586 | 6524 | 7030 | 20100 | 20133 | 23467 | 16743 | 25940 | 12488 | 23460 | 13914 | 24520 | 21760 | 29850 | 8389 | 13900 | 8880 | 8730 | 9470 | 36350 | 37125 | 33600 | 52367 | 41325 | 79800 | 82750 | 82600 | 81600 |

### The same table as uplift over each lineage’s own control

**Tier 1**

| profile | lane | class | t1-mountain-01 | t1-mountain-02 | t1-mountain-03 | t1-mountain-04 | t1-mountain-05 | t1-cave-01 | t1-cave-02 | t1-cave-03 | t1-cave-04 | t1-cave-05 | t1-forest-01 | t1-forest-02 | t1-forest-03 | t1-forest-04 | t1-forest-05 | t1-plains-01 | t1-plains-02 | t1-plains-03 | t1-plains-04 | t1-plains-05 | t1-swamp-01 | t1-swamp-02 | t1-swamp-03 | t1-swamp-04 | t1-swamp-05 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-kill-chain` | kill-chain | energy | +0.0% | -10.5% | +0.0% | -5.9% | +0.0% | +16.7% | +6.7% | -25.0% | -12.0% | +9.1% | +25.0% | +5.7% | +0.0% | +2.4% | +9.4% | +6.5% | -4.9% | +2.2% | +6.3% | -2.0% | +4.5% | -6.9% | -4.0% | +0.0% | +7.4% |
| `lineage-broadsword-empowered` | empowered | energy | +12.5% | +0.0% | -9.1% | +5.9% | +5.9% | -3.3% | +0.0% | +18.8% | -16.0% | +13.6% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +2.2% | +0.0% | +0.0% | +0.0% | +8.2% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-broadsword-tempo` | tempo | energy | +12.5% | +0.0% | +0.0% | +5.9% | +5.9% | -3.3% | +0.0% | +18.8% | -16.0% | +13.6% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-rapier-tempo` | tempo | cadence | +0.0% | +42.9% | -4.8% | +20.0% | +12.5% | -3.2% | +10.0% | +12.5% | +22.2% | +9.5% | +17.1% | +3.2% | +3.7% | +18.9% | +9.4% | +19.1% | +6.8% | +4.5% | +7.0% | +3.6% | +0.0% | -11.1% | +0.0% | +10.0% | -5.0% |
| `lineage-rapier-affliction` | affliction | cadence | +13.3% | +0.0% | -14.3% | +13.3% | +0.0% | +0.0% | +10.0% | +6.3% | +0.0% | +0.0% | +7.3% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | -1.7% | +6.8% | +3.5% | -10.7% | -6.3% | +11.1% | +15.0% | +15.0% | +10.0% |
| `lineage-rapier-engagement` | engagement | cadence | +6.7% | +42.9% | +4.8% | +20.0% | +12.5% | +0.0% | +20.0% | +12.5% | +5.6% | +4.8% | +7.3% | +0.0% | +7.4% | +5.4% | +0.0% | +6.4% | -3.4% | -2.3% | +5.3% | -10.7% | +25.0% | +11.1% | +10.0% | +25.0% | +25.0% |
| `lineage-hammer-empowered` | empowered | cooldown | +6.3% | +0.0% | +0.0% | +12.5% | +5.9% | +0.0% | -7.1% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +2.8% | +0.0% | +5.7% | -3.9% | +0.0% | +13.2% | +0.0% | +5.9% | +26.3% | +0.0% | +5.3% | +5.3% |
| `lineage-hammer-control` | control | cooldown | +6.3% | +0.0% | +0.0% | +12.5% | +5.9% | +0.0% | -7.1% | +6.3% | +0.0% | +8.7% | +0.0% | +0.0% | +0.0% | +2.8% | +0.0% | +5.7% | -3.9% | +0.0% | +13.2% | +0.0% | +5.9% | +26.3% | +0.0% | +5.3% | +5.3% |
| `lineage-hammer-engagement` | engagement | cooldown | +0.0% | +0.0% | +0.0% | +12.5% | +5.9% | +0.0% | -7.1% | +6.3% | +10.5% | +8.7% | -10.0% | +0.0% | +13.6% | +5.6% | +3.0% | +11.4% | +0.0% | +0.0% | +5.3% | +0.0% | +5.9% | +26.3% | +0.0% | +5.3% | +10.5% |
| `lineage-axe-tempo` | tempo | dot | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +7.1% | +8.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-axe-kill-chain` | kill-chain | dot | +0.0% | +0.0% | +6.3% | -6.7% | +0.0% | +5.3% | +16.7% | +0.0% | +0.0% | +0.0% | -9.1% | +21.4% | +16.0% | +0.0% | -13.3% | -2.9% | +0.0% | +6.1% | +14.7% | +3.0% | +0.0% | -13.6% | +6.3% | -5.6% | +5.6% |
| `lineage-axe-empowered` | empowered | dot | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +16.7% | +0.0% | +5.6% | +18.8% | +0.0% | +7.1% | +0.0% | +12.9% | +3.3% | +2.9% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-dagger-affliction` | affliction | reload | +6.3% | +7.1% | +4.8% | -6.3% | +6.3% | +8.0% | +14.3% | +21.4% | +26.3% | -8.3% | +14.7% | +19.4% | -7.7% | +5.3% | +0.0% | +2.4% | +6.0% | +13.5% | +9.3% | +12.2% | -9.1% | +16.7% | -4.5% | +4.5% | +4.0% |
| `lineage-dagger-control` | control | reload | +6.3% | +14.3% | +4.8% | +12.5% | +12.5% | +12.0% | +28.6% | +14.3% | +10.5% | -8.3% | +20.6% | -9.7% | +0.0% | +23.7% | +16.7% | -16.7% | +2.0% | +10.8% | +2.3% | +7.3% | -4.5% | +8.3% | -18.2% | +0.0% | +0.0% |
| `lineage-dagger-kill-chain` | kill-chain | reload | +0.0% | +0.0% | -4.8% | +0.0% | +0.0% | +8.0% | +7.1% | +7.1% | +0.0% | +0.0% | +29.4% | +0.0% | +7.7% | +18.4% | +0.0% | -4.8% | +2.0% | -5.4% | +7.0% | +9.8% | +0.0% | +4.2% | +4.5% | +0.0% | +8.0% |

**Tier 2**

| profile | lane | class | t2-forest-01 | t2-forest-02 | t2-forest-03 | t2-forest-04 | t2-forest-05 | t2-plains-01 | t2-plains-02 | t2-plains-03 | t2-plains-04 | t2-plains-05 | t2-mountain-01 | t2-mountain-02 | t2-mountain-03 | t2-mountain-04 | t2-mountain-05 | t2-cave-01 | t2-cave-02 | t2-cave-03 | t2-cave-04 | t2-cave-05 | t2-cave-06 | t2-swamp-01 | t2-swamp-02 | t2-swamp-03 | t2-swamp-05 | t2-swamp-06 | t2-jungle-01 | t2-jungle-02 | t2-jungle-03 | t2-jungle-04 | t2-desert-01 | t2-desert-02 | t2-desert-03 | t2-desert-04 | t2-desert-05 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-kill-chain` | kill-chain | energy | +5.3% | +37.5% | +23.1% | -11.8% | -11.1% | +5.0% | +6.7% | +4.8% | -25.0% | -13.6% | -14.3% | -12.5% | -22.2% | +33.3% | -20.0% | +33.3% | +100.0% | +0.0% | +0.0% | -33.3% | +0.0% | +0.0% | +33.3% | +0.0% | +57.1% | +0.0% | +33.3% | +20.0% | +25.0% | -33.3% | +66.7% | +0.0% | +66.7% | +100.0% | +0.0% |
| `lineage-broadsword-empowered` | empowered | energy | +10.5% | +0.0% | +0.0% | +0.0% | +5.6% | +0.0% | +0.0% | +14.3% | +25.0% | +0.0% | -14.3% | +0.0% | +0.0% | -16.7% | +0.0% | +16.7% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +33.3% | +0.0% | +28.6% | +0.0% | +33.3% | +20.0% | +25.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-broadsword-tempo` | tempo | energy | +0.0% | +25.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-rapier-tempo` | tempo | cadence | -5.9% | -12.5% | +30.0% | -30.8% | +87.5% | +29.4% | +6.3% | +30.0% | +13.0% | +20.0% | +16.7% | +0.0% | +50.0% | +0.0% | +33.3% | — | +0.0% | +66.7% | +200.0% | +50.0% | +0.0% | +0.0% | +40.0% | +10.0% | +0.0% | -22.2% | +100.0% | +100.0% | +0.0% | +16.7% | — | — | — | — | — |
| `lineage-rapier-affliction` | affliction | cadence | -23.5% | -25.0% | -10.0% | -23.1% | +75.0% | +29.4% | +0.0% | -15.0% | +4.3% | +0.0% | +16.7% | +0.0% | +50.0% | +25.0% | +33.3% | — | +0.0% | +33.3% | +200.0% | +75.0% | +0.0% | +0.0% | +20.0% | +0.0% | -16.7% | +0.0% | +100.0% | +40.0% | -20.0% | +0.0% | — | — | — | — | — |
| `lineage-rapier-engagement` | engagement | cadence | -5.9% | -25.0% | +80.0% | +38.5% | +62.5% | +29.4% | +3.1% | +15.0% | +8.7% | +0.0% | +16.7% | +0.0% | +50.0% | +0.0% | +66.7% | — | +0.0% | +33.3% | +250.0% | +75.0% | +0.0% | -20.0% | -20.0% | +50.0% | +50.0% | +22.2% | +100.0% | +40.0% | +20.0% | +0.0% | — | — | — | — | — |
| `lineage-hammer-empowered` | empowered | cooldown | +0.0% | +0.0% | +0.0% | -10.0% | +0.0% | -5.9% | +0.0% | +0.0% | +55.6% | -10.5% | +0.0% | +0.0% | +16.7% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +14.3% | +28.6% | -6.7% | +0.0% | +36.4% | -20.0% | +0.0% | +0.0% | +25.0% | — | — | — | — | — |
| `lineage-hammer-control` | control | cooldown | +0.0% | +0.0% | +0.0% | -10.0% | +0.0% | -5.9% | +0.0% | +0.0% | +61.1% | -10.5% | +14.3% | +0.0% | +66.7% | -20.0% | +0.0% | +14.3% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +42.9% | -6.7% | +10.0% | +36.4% | -20.0% | +0.0% | +25.0% | +25.0% | — | — | — | — | — |
| `lineage-hammer-engagement` | engagement | cooldown | +0.0% | +0.0% | +0.0% | +10.0% | +0.0% | +41.2% | -3.1% | +33.3% | +33.3% | +5.3% | +14.3% | -16.7% | +50.0% | -20.0% | +0.0% | +14.3% | +0.0% | +0.0% | -20.0% | +0.0% | +0.0% | +0.0% | +28.6% | -6.7% | +0.0% | +9.1% | -20.0% | +0.0% | +50.0% | +25.0% | — | — | — | — | — |
| `lineage-axe-tempo` | tempo | dot | +0.0% | +0.0% | +12.5% | +0.0% | +5.9% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +50.0% | +20.0% | -60.0% | +0.0% | +20.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +11.1% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | -25.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-axe-kill-chain` | kill-chain | dot | -21.7% | +33.3% | +0.0% | -11.8% | -29.4% | +4.8% | +6.5% | +7.1% | +4.2% | +40.0% | +50.0% | +0.0% | +40.0% | -20.0% | -20.0% | -33.3% | -50.0% | +16.7% | -60.0% | -20.0% | -25.0% | +12.5% | +0.0% | +0.0% | -11.1% | +12.5% | -75.0% | -50.0% | +0.0% | -66.7% | -25.0% | -100.0% | +0.0% | +100.0% | +0.0% |
| `lineage-axe-empowered` | empowered | dot | +8.7% | +0.0% | +12.5% | -5.9% | +17.6% | +0.0% | -6.5% | +14.3% | +0.0% | +0.0% | +0.0% | +20.0% | -60.0% | +0.0% | +20.0% | +0.0% | +0.0% | +16.7% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | -22.2% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | -25.0% | +0.0% | +0.0% | +0.0% | -50.0% |
| `lineage-dagger-affliction` | affliction | reload | -14.3% | +14.3% | -7.1% | -5.6% | +14.3% | -16.7% | -3.2% | +42.9% | +28.6% | -20.0% | +16.7% | +33.3% | +16.7% | +0.0% | -20.0% | -12.5% | -40.0% | +14.3% | +0.0% | +60.0% | +25.0% | +0.0% | +14.3% | +0.0% | +0.0% | -10.0% | +50.0% | +50.0% | +50.0% | +33.3% | +0.0% | +0.0% | +50.0% | +50.0% | +0.0% |
| `lineage-dagger-control` | control | reload | -14.3% | +42.9% | +21.4% | +5.6% | +42.9% | +50.0% | +6.5% | +28.6% | +33.3% | +0.0% | +16.7% | +16.7% | -16.7% | +0.0% | +40.0% | -12.5% | +0.0% | +14.3% | +20.0% | +20.0% | +0.0% | -11.1% | +42.9% | +10.0% | +0.0% | +0.0% | +25.0% | +75.0% | +0.0% | +100.0% | +0.0% | -100.0% | +50.0% | +50.0% | -50.0% |
| `lineage-dagger-kill-chain` | kill-chain | reload | -9.5% | +42.9% | -7.1% | -22.2% | -21.4% | +33.3% | -9.7% | -7.1% | +0.0% | +20.0% | +0.0% | +16.7% | +33.3% | -28.6% | -20.0% | +0.0% | +0.0% | +14.3% | -20.0% | -20.0% | +25.0% | +0.0% | +14.3% | +0.0% | -10.0% | -10.0% | +0.0% | -25.0% | +50.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |

## Lane budget (design §18.9)

“The band is the median uplift ±3pp, absolute.” Measured on each lane’s favoured
node — the node its own family dominates hardest — per tier.

**Tier 1.** Median lane uplift on the favoured node: **+0.0%**. The §18.9 band is -3.0% to +3.0% (median ±3 pp). Median absolute throughput there: 5.67 kills/min.

| lane | profile | favoured node | uplift | uplift − median | in ±3 pp (§18.9) | kills/min | in ±10% abs (§9, retired) | shards |
|---|---|---|---:|---:|:--:|---:|:--:|---|
| kill-chain | `lineage-broadsword-kill-chain` | `node-t1-cave-03` | -25.0% | -25.0% | NO | 4.00 | NO | earned |
| empowered | `lineage-broadsword-empowered` | `node-t1-mountain-01` | +12.5% | +12.5% | NO | 6.00 | yes | earned |
| tempo | `lineage-broadsword-tempo` | `node-t1-mountain-03` | +0.0% | +0.0% | yes | 7.33 | NO | earned |
| tempo | `lineage-rapier-tempo` | `node-t1-mountain-03` | -4.8% | -4.8% | NO | 6.67 | NO | earned |
| affliction | `lineage-rapier-affliction` | `node-t1-cave-01` | +0.0% | +0.0% | yes | 10.33 | NO | earned |
| engagement | `lineage-rapier-engagement` | `node-t1-plains-03` | -2.3% | -2.3% | yes | 14.33 | NO | earned |
| empowered | `lineage-hammer-empowered` | `node-t1-mountain-01` | +6.3% | +6.3% | NO | 5.67 | yes | earned |
| control | `lineage-hammer-control` | `node-t1-mountain-02` | +0.0% | +0.0% | yes | 5.67 | yes | earned |
| engagement | `lineage-hammer-engagement` | `node-t1-plains-03` | +0.0% | +0.0% | yes | 11.67 | NO | earned |
| tempo | `lineage-axe-tempo` | `node-t1-mountain-03` | +0.0% | +0.0% | yes | 5.33 | yes | earned |
| kill-chain | `lineage-axe-kill-chain` | `node-t1-cave-03` | +0.0% | +0.0% | yes | 4.67 | NO | earned |
| empowered | `lineage-axe-empowered` | `node-t1-mountain-01` | +0.0% | +0.0% | yes | 5.00 | NO | earned |
| affliction | `lineage-dagger-affliction` | `node-t1-cave-01` | +8.0% | +8.0% | NO | 9.00 | NO | earned |
| control | `lineage-dagger-control` | `node-t1-mountain-02` | +14.3% | +14.3% | NO | 5.33 | yes | earned |
| kill-chain | `lineage-dagger-kill-chain` | `node-t1-cave-03` | +7.1% | +7.1% | NO | 5.00 | NO | earned |

**Tier 2.** Median lane uplift on the favoured node: **+0.0%**. The §18.9 band is -3.0% to +3.0% (median ±3 pp). Median absolute throughput there: 3.33 kills/min.

| lane | profile | favoured node | uplift | uplift − median | in ±3 pp (§18.9) | kills/min | in ±10% abs (§9, retired) | shards |
|---|---|---|---:|---:|:--:|---:|:--:|---|
| kill-chain | `lineage-broadsword-kill-chain` | `node-t2-swamp-03` | +0.0% | +0.0% | yes | 3.33 | yes | earned |
| empowered | `lineage-broadsword-empowered` | `node-t2-jungle-01` | +33.3% | +33.3% | NO | 1.33 | NO | earned |
| tempo | `lineage-broadsword-tempo` | `node-t2-forest-01` | +0.0% | +0.0% | yes | 6.33 | NO | earned |
| tempo | `lineage-rapier-tempo` | `node-t2-forest-01` | -5.9% | -5.9% | NO | 5.33 | NO | earned |
| affliction | `lineage-rapier-affliction` | `node-t2-jungle-02` | +40.0% | +40.0% | NO | 2.33 | NO | earned |
| engagement | `lineage-rapier-engagement` | `node-t2-plains-03` | +15.0% | +15.0% | NO | 7.67 | NO | earned |
| empowered | `lineage-hammer-empowered` | `node-t2-jungle-01` | -20.0% | -20.0% | NO | 1.33 | NO | earned |
| control | `lineage-hammer-control` | `node-t2-swamp-02` | +42.9% | +42.9% | NO | 3.33 | yes | earned |
| engagement | `lineage-hammer-engagement` | `node-t2-plains-03` | +33.3% | +33.3% | NO | 5.33 | NO | earned |
| tempo | `lineage-axe-tempo` | `node-t2-forest-01` | +0.0% | +0.0% | yes | 7.67 | NO | earned |
| kill-chain | `lineage-axe-kill-chain` | `node-t2-swamp-03` | +0.0% | +0.0% | yes | 3.00 | NO | earned |
| empowered | `lineage-axe-empowered` | `node-t2-jungle-01` | +0.0% | +0.0% | yes | 1.33 | NO | earned |
| affliction | `lineage-dagger-affliction` | `node-t2-jungle-02` | +50.0% | +50.0% | NO | 2.00 | NO | earned |
| control | `lineage-dagger-control` | `node-t2-swamp-02` | +42.9% | +42.9% | NO | 3.33 | yes | earned |
| kill-chain | `lineage-dagger-kill-chain` | `node-t2-swamp-03` | +0.0% | +0.0% | yes | 3.33 | yes | earned |

### How much of the absolute column is class, not lane

| control | class | weapon | mean kills/min over all nodes | vs control median |
|---|---|---|---:|---:|
| `lineage-broadsword-baseline` | energy | iron-broadsword | 6.02 | +10.4% |
| `lineage-rapier-baseline` | cadence | flash-rapier | 5.46 | +0.2% |
| `lineage-hammer-baseline` | cooldown | heavy-hammer | 4.97 | -8.8% |
| `lineage-axe-baseline` | dot | chaotic-axe | 4.76 | -12.6% |
| `lineage-dagger-baseline` | reload | ashbrand-blade | 5.45 | +0.0% |

### Lane budget per PACKET — the table `PACKET_BUDGET` is tuned from

Median packet uplift: **+7.7%**. The §18.9 band is +4.7% to +10.7% (median ±3 pp).

| packet | lineages carrying it | mean uplift | − median | in ±3 pp | payoff fx fired | hardest favouring node |
|---|---:|---:|---:|:--:|---:|---|
| engagement | 2 | +14.0% | +6.4% | NO | 1051 | `node-t1-plains-03` |
| affliction | 2 | +10.8% | +3.2% | NO | 13503 | `node-t2-jungle-02` |
| control | 2 | +8.3% | +0.7% | yes | 3334 | `node-t2-swamp-02` |
| tempo | 3 | +7.0% | -0.7% | yes | 5415 | `node-t1-mountain-03` |
| empowered | 3 | +2.5% | -5.2% | NO | 1302 | `node-t2-jungle-01` |
| kill-chain | 3 | +2.1% | -5.6% | NO | 1719 | `node-t2-swamp-03` |

### Lane uplift over every node

The same uplift as above, averaged over all node blends rather than only the
favoured one — the reading least sensitive to which single encounter a lane
happened to be measured on.

| lane | profile | mean uplift over all nodes | uplift on favoured node | worst node | best node | payoff fx fired (all nodes) |
|---|---|---:|---:|---|---|---:|
| kill-chain | `lineage-broadsword-kill-chain` | +8.1% | -25.0% | t2-cave-05 -33.3% | t2-desert-04 +100.0% | 886 |
| empowered | `lineage-broadsword-empowered` | +3.7% | +12.5% | t2-mountain-04 -16.7% | t2-jungle-01 +33.3% | 294 |
| tempo | `lineage-broadsword-tempo` | +1.0% | +0.0% | t1-cave-04 -16.0% | t2-forest-02 +25.0% | 1723 |
| tempo | `lineage-rapier-tempo` | +19.2% | -4.8% | t2-forest-04 -30.8% | t2-cave-04 +200.0% | 2041 |
| affliction | `lineage-rapier-affliction` | +12.0% | +0.0% | t2-forest-02 -25.0% | t2-cave-04 +200.0% | 5413 |
| engagement | `lineage-rapier-engagement` | +21.9% | -2.3% | t2-forest-02 -25.0% | t2-cave-04 +250.0% | 523 |
| empowered | `lineage-hammer-empowered` | +3.7% | +6.3% | t2-jungle-01 -20.0% | t2-plains-04 +55.6% | 709 |
| control | `lineage-hammer-control` | +5.7% | +0.0% | t2-mountain-04 -20.0% | t2-mountain-03 +66.7% | 690 |
| engagement | `lineage-hammer-engagement` | +6.2% | +0.0% | t2-mountain-04 -20.0% | t2-jungle-03 +50.0% | 528 |
| tempo | `lineage-axe-tempo` | +0.8% | +0.0% | t2-mountain-03 -60.0% | t2-mountain-01 +50.0% | 1651 |
| kill-chain | `lineage-axe-kill-chain` | -4.0% | +0.0% | t2-desert-02 -100.0% | t2-desert-04 +100.0% | 655 |
| empowered | `lineage-axe-empowered` | +0.1% | +0.0% | t2-mountain-03 -60.0% | t2-mountain-05 +20.0% | 299 |
| affliction | `lineage-dagger-affliction` | +9.7% | +8.0% | t2-cave-02 -40.0% | t2-cave-05 +60.0% | 8090 |
| control | `lineage-dagger-control` | +10.9% | +14.3% | t2-desert-02 -100.0% | t2-jungle-04 +100.0% | 2644 |
| kill-chain | `lineage-dagger-kill-chain` | +2.3% | +7.1% | t2-mountain-04 -28.6% | t2-jungle-03 +50.0% | 178 |

## Frames (design §18.10)

Light / Balanced / Heavy per class root. Lane-less on purpose: design §10 gives
each frame its own feedback loop, so a card on top would be a second variable.
There is no control-relative uplift here and there must not be — every T1
character has bought a frame, so a frame has nothing to be an uplift OVER. The
reading is frame-against-frame inside one root, against the frame that root’s own
canonical T1 route wears.

Eighteen lane-less frame references over 12 nodes (t1-mountain-01, t1-cave-01, t1-forest-01, t1-plains-01, t1-swamp-01, t2-forest-01, t2-plains-01, t2-mountain-01, t2-cave-01, t2-swamp-01, t2-jungle-01, t2-desert-01).

| root | frame | shape | weapon | kills/min | vs the root's canonical frame | median TTK (ms) | mean HP engaged | deaths |
|---|---|---|---|---:|---:|---:|---:|---:|
| cadence | `cadence-light` | light | flash-rapier | 6.11 | +8.9% | 6000 | 0.79 | 38 |
| cadence | `cadence-balanced` | balanced **(canonical)** | flash-rapier | 5.61 | _denominator_ | 7026 | 0.79 | 58 |
| cadence | `cadence-heavy` | heavy | flash-rapier | 6.25 | +11.4% | 5844 | 0.82 | 25 |
| cooldown | `cooldown-light` | light | heavy-hammer | 5.44 | +4.8% | 5904 | 0.77 | 45 |
| cooldown | `cooldown-balanced` | balanced | heavy-hammer | 4.83 | -7.0% | 7710 | 0.79 | 30 |
| cooldown | `cooldown-heavy` | heavy **(canonical)** | heavy-hammer | 5.19 | _denominator_ | 7524 | 0.80 | 20 |
| reload | `reload-light` | light | ashbrand-blade | 6.03 | +3.8% | 7469 | 0.81 | 34 |
| reload | `reload-balanced` | balanced | ashbrand-blade | 5.92 | +1.9% | 7222 | 0.80 | 29 |
| reload | `reload-heavy` | heavy **(canonical)** | ashbrand-blade | 5.81 | _denominator_ | 7207 | 0.79 | 23 |
| energy | `energy-light` | light | iron-broadsword | 5.69 | -8.1% | 8444 | 0.86 | 40 |
| energy | `energy-balanced` | balanced | iron-broadsword | 5.81 | -6.3% | 8106 | 0.85 | 39 |
| energy | `energy-heavy` | heavy **(canonical)** | iron-broadsword | 6.19 | _denominator_ | 8129 | 0.85 | 22 |
| dot | `dot-light` | light | chaotic-axe | 5.17 | +0.5% | 7707 | 0.79 | 34 |
| dot | `dot-balanced` | balanced **(canonical)** | chaotic-axe | 5.14 | _denominator_ | 7252 | 0.79 | 28 |
| dot | `dot-heavy` | heavy | chaotic-axe | 4.92 | -4.3% | 8731 | 0.79 | 18 |
| summoner | `summoner-light` | light | chaotic-axe | 7.42 | +21.4% | 619 | 0.81 | 5 |
| summoner | `summoner-balanced` | balanced **(canonical)** | chaotic-axe | 6.11 | _denominator_ | 847 | 0.74 | 6 |
| summoner | `summoner-heavy` | heavy | chaotic-axe | 9.22 | +50.9% | 2632 | 0.91 | 1 |

### The same reading per frame SHAPE, across all six roots

| shape | mean kills/min | mean delta vs each root's canonical frame | roots where it is fastest |
|---|---:|---:|---:|
| light | 5.98 | +5.2% | 3 of 6 |
| balanced | 5.57 | -1.9% | 0 of 6 |
| heavy | 6.26 | +9.7% | 3 of 6 |

## Survival — what the non-damage lanes buy instead

Control’s slow and Engagement’s opening DR buy time, not throughput, so the
TTK matrix above reads them as worth nothing. This is the same runs read as
survival: mean HP fraction while engaged and damage taken per engaged second,
each against the same lineage’s lane-less control.

| profile | lane | class | mean HP while engaged | damage taken / engaged s | deaths | Δ HP vs control | Δ damage taken vs control |
|---|---|---|---:|---:|---:|---:|---:|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 0.87 | 5.57 | 81 | +0.0% | -2.0% |
| `lineage-broadsword-empowered` | empowered | energy | 0.87 | 5.75 | 95 | -0.2% | +1.3% |
| `lineage-broadsword-tempo` | tempo | energy | 0.87 | 5.67 | 101 | +0.0% | -0.1% |
| `lineage-broadsword-baseline` | _control_ | energy | 0.87 | 5.68 | 99 | — | — |
| `lineage-rapier-tempo` | tempo | cadence | 0.80 | 14.41 | 157 | +1.7% | -1.5% |
| `lineage-rapier-affliction` | affliction | cadence | 0.79 | 14.44 | 167 | +0.1% | -1.3% |
| `lineage-rapier-engagement` | engagement | cadence | 0.80 | 14.62 | 160 | +1.5% | -0.1% |
| `lineage-rapier-baseline` | _control_ | cadence | 0.79 | 14.64 | 237 | — | — |
| `lineage-hammer-empowered` | empowered | cooldown | 0.81 | 10.71 | 92 | -0.3% | +0.2% |
| `lineage-hammer-control` | control | cooldown | 0.81 | 10.72 | 86 | -0.1% | +0.3% |
| `lineage-hammer-engagement` | engagement | cooldown | 0.82 | 10.26 | 89 | +1.1% | -3.9% |
| `lineage-hammer-baseline` | _control_ | cooldown | 0.81 | 10.68 | 96 | — | — |
| `lineage-axe-tempo` | tempo | dot | 0.79 | 9.05 | 136 | +0.0% | +0.9% |
| `lineage-axe-kill-chain` | kill-chain | dot | 0.79 | 8.79 | 140 | -0.3% | -1.9% |
| `lineage-axe-empowered` | empowered | dot | 0.79 | 8.99 | 140 | -0.2% | +0.3% |
| `lineage-axe-baseline` | _control_ | dot | 0.79 | 8.96 | 128 | — | — |
| `lineage-dagger-affliction` | affliction | reload | 0.81 | 9.55 | 108 | +1.1% | -4.2% |
| `lineage-dagger-control` | control | reload | 0.80 | 9.47 | 105 | -0.0% | -5.0% |
| `lineage-dagger-kill-chain` | kill-chain | reload | 0.80 | 9.79 | 140 | +0.5% | -1.8% |
| `lineage-dagger-baseline` | _control_ | reload | 0.80 | 9.97 | 131 | — | — |

## Encounter check (design §18.9) — ordinal

One row per family that has an OWN node: a node where it reaches at least 60% of
the resolved blend, so the encounter really is that family rather than two sharing
it. Lanes are ranked by median uplift; rank 1 is the strongest. The favoured lane
is read off `FamilyDefinition.drops`, which design §18.7 confirms IS the definition
of favours. A family whose favoured lane ranks below its punished lane is a
monster-shape finding for Phase 4, not a magnitude to tune.

| family | own node | tier | favoured | rank | punished | rank | margin (fav − pun) | lanes | per-seed fav rank | per-seed top lane | fav deaths | pun deaths |
|---|---|---:|---|---:|---|---:|---:|---:|---|---|---:|---:|
| Brood | `node-t1-cave-01` | 1 | affliction | 3/6 | tempo | 6/6 | +7.2% | 6 | 4/6 / 2/6 | kill-chain / control | 0 | 0 |
| Deep | `node-t1-cave-03` | 1 | kill-chain | no reference | engagement | 2/5 | — | 5 | — / 6/6 | — / affliction | 0 | 0 |
| Canopy | `node-t1-forest-03` | 1 | affliction | 6/6 | control | 5/6 | -3.8% | 6 | 5/6 / 6/6 | engagement / engagement | 0 | 0 |
| Grove | `node-t1-forest-02` | 1 | empowered | 4/6 | tempo | 3/6 | -3.2% | 6 | 4/6 / 4/6 | tempo / kill-chain | 3 | 3 |
| Pack | `node-t1-forest-01` | 1 | tempo | 5/6 | empowered | 4/6 | +0.0% | 6 | 6/6 / 5/6 | affliction / kill-chain | 4 | 4 |
| Pack | `node-t2-forest-01` | 2 | tempo | 2/6 | empowered | 1/6 | -9.6% | 6 | 3/6 / 2/6 | empowered / empowered | 27 | 17 |
| Crag | `node-t1-mountain-01` | 1 | empowered | 2/6 | affliction | 4/6 | +3.1% | 6 | 3/6 / 3/6 | control / affliction | 0 | 0 |
| Hopper | `node-t1-mountain-03` | 1 | tempo | 5/6 | empowered | 4/6 | +0.0% | 6 | 4/6 / 4/6 | engagement / control | 0 | 0 |
| Ridge | `node-t1-mountain-02` | 1 | control | 3/5 | kill-chain | 5/5 | +10.5% | 5 | 3/6 / 3/5 | empowered / empowered | 0 | 0 |
| Herd | `node-t1-plains-01` | 1 | empowered | 2/6 | tempo | 4/6 | +2.9% | 6 | 3/6 / 2/6 | engagement / engagement | 0 | 0 |
| Herd | `node-t2-plains-01` | 2 | empowered | 5/6 | tempo | 6/6 | +0.0% | 6 | 5/6 / 4/5 | affliction / affliction | 6 | 5 |
| Sky | `node-t1-plains-03` | 1 | engagement | 6/6 | affliction | 1/6 | -11.3% | 6 | 1/6 / 6/6 | engagement / affliction | 0 | 0 |
| Sky | `node-t2-plains-03` | 2 | engagement | 2/5 | affliction | 5/5 | +30.0% | 5 | 2/5 / 4/6 | tempo / empowered | 4 | 8 |
| Swarm | `node-t1-plains-02` | 1 | tempo | 4/6 | empowered | 3/6 | +0.0% | 6 | 4/6 / 5/6 | affliction / kill-chain | 0 | 0 |
| Swarm | `node-t2-plains-02` | 2 | tempo | 5/6 | empowered | 4/6 | +0.0% | 6 | 4/6 / 5/6 | engagement / kill-chain | 7 | 8 |
| Coven | `node-t1-swamp-02` | 1 | control | 2/6 | tempo | 5/6 | +17.3% | 6 | 1/6 / 2/6 | control / engagement | 0 | 0 |
| Mire | `node-t1-swamp-01` | 1 | affliction | 6/6 | empowered | 2/6 | -12.0% | 6 | 5/6 / 6/6 | engagement / engagement | 0 | 0 |
| Stalker | `node-t1-swamp-03` | 1 | kill-chain | 3/6 | bulwark | no reference | — | 6 | 1/6 / 3/6 | kill-chain / engagement | 0 | 0 |

### Clear `drops` remaps (design §18 3b)

The test, computed rather than eyeballed: the favoured lane ranks LAST on the
family’s own node with BOTH seeds agreeing, and one other lane ranks FIRST with
both seeds. Anything short of that is left alone.

No family meets the test: no `drops` move is CLEAR on this run.

## Refused purchases

None — every lane bought its whole band.

## Per-node detail

### `node-t1-mountain-01` — Crag 70% / Ridge 20% / Hopper 10% (mountain T1; shared by 1 authored node)

Dominant family **Crag** drops `empowered`, punishes `affliction`. Authored Crag 70% / Ridge 20% / Hopper 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 16 | 8181 | 5.33 | +0.0% | 0 | kill-chain.kill-pulse x16 |
| `lineage-broadsword-empowered` | empowered | energy | 18 | 6961 | 6.00 | +12.5% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-tempo` | tempo | energy | 18 | 6961 | 6.00 | +12.5% | 0 | tempo.ghost-strike x40 |
| `lineage-broadsword-baseline` | _control_ | energy | 16 | 8263 | 5.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 15 | 6627 | 5.00 | +0.0% | 0 | tempo.ghost-strike x48 |
| `lineage-rapier-affliction` | affliction | cadence | 17 | 6424 | 5.67 | +13.3% | 0 | affliction.bleed-pips x138 |
| `lineage-rapier-engagement` | engagement | cadence | 16 | 6138 | 5.33 | +6.7% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | cadence | 15 | 6893 | 5.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 17 | 5400 | 5.67 | +6.3% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | cooldown | 17 | 5400 | 5.67 | +6.3% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | cooldown | 16 | 5206 | 5.33 | +0.0% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | cooldown | 16 | 5738 | 5.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 15 | 8233 | 5.00 | +0.0% | 0 | tempo.ghost-strike x43 |
| `lineage-axe-kill-chain` | kill-chain | dot | 15 | 8427 | 5.00 | +0.0% | 0 | kill-chain.kill-pulse x15 |
| `lineage-axe-empowered` | empowered | dot | 15 | 8233 | 5.00 | +0.0% | 0 | empowered.weak-point x15 |
| `lineage-axe-baseline` | _control_ | dot | 15 | 8233 | 5.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 17 | 6547 | 5.67 | +6.3% | 0 | affliction.venom-pips x181 |
| `lineage-dagger-control` | control | reload | 17 | 5588 | 5.67 | +6.3% | 0 | control.frost-drag x54 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 16 | 6856 | 5.33 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 16 | 6800 | 5.33 | — | 0 | — |
| `frame-cadence-light` | _frame light_ | cadence | 17 | 6000 | 5.67 | — | 0 | — |
| `frame-cadence-balanced` | _frame balanced_ | cadence | 15 | 6893 | 5.00 | — | 0 | — |
| `frame-cadence-heavy` | _frame heavy_ | cadence | 18 | 5844 | 6.00 | — | 0 | — |
| `frame-cooldown-light` | _frame light_ | cooldown | 15 | 7373 | 5.00 | — | 0 | — |
| `frame-cooldown-balanced` | _frame balanced_ | cooldown | 14 | 7650 | 4.67 | — | 0 | — |
| `frame-cooldown-heavy` | _frame heavy_ | cooldown | 16 | 5738 | 5.33 | — | 0 | — |
| `frame-reload-light` | _frame light_ | reload | 17 | 7282 | 5.67 | — | 0 | — |
| `frame-reload-balanced` | _frame balanced_ | reload | 17 | 6794 | 5.67 | — | 0 | — |
| `frame-reload-heavy` | _frame heavy_ | reload | 16 | 6800 | 5.33 | — | 0 | — |
| `frame-energy-light` | _frame light_ | energy | 15 | 8393 | 5.00 | — | 0 | — |
| `frame-energy-balanced` | _frame balanced_ | energy | 16 | 8106 | 5.33 | — | 0 | — |
| `frame-energy-heavy` | _frame heavy_ | energy | 16 | 8263 | 5.33 | — | 0 | — |
| `frame-dot-light` | _frame light_ | dot | 15 | 7707 | 5.00 | — | 0 | — |
| `frame-dot-balanced` | _frame balanced_ | dot | 15 | 8233 | 5.00 | — | 0 | — |
| `frame-dot-heavy` | _frame heavy_ | dot | 14 | 8386 | 4.67 | — | 0 | — |
| `frame-summoner-light` | _frame light_ | summoner | 19 | 937 | 6.33 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | summoner | 16 | 3156 | 5.33 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | summoner | 25 | 3988 | 8.33 | — | 0 | — |

### `node-t1-mountain-02` — Ridge 70% / Hopper 20% / Crag 10% (mountain T1; shared by 1 authored node)

Dominant family **Ridge** drops `control`, punishes `kill-chain`. Authored Ridge 70% / Hopper 20% / Crag 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 17 | 6000 | 5.67 | -10.5% | 0 | kill-chain.kill-pulse x17 |
| `lineage-broadsword-empowered` | empowered | energy | 19 | 5421 | 6.33 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-tempo` | tempo | energy | 19 | 5421 | 6.33 | +0.0% | 0 | tempo.ghost-strike x32 |
| `lineage-broadsword-baseline` | _control_ | energy | 19 | 5421 | 6.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 20 | 5510 | 6.67 | +42.9% | 0 | tempo.ghost-strike x50 |
| `lineage-rapier-affliction` | affliction | cadence | 14 | 6136 | 4.67 | +0.0% | 0 | affliction.bleed-pips x101 |
| `lineage-rapier-engagement` | engagement | cadence | 20 | 5195 | 6.67 | +42.9% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | cadence | 14 | 6164 | 4.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 17 | 5976 | 5.67 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | cooldown | 17 | 5724 | 5.67 | +0.0% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | cooldown | 17 | 5600 | 5.67 | +0.0% | 0 | engagement.brace-sparks x16 |
| `lineage-hammer-baseline` | _control_ | cooldown | 17 | 5976 | 5.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 13 | 8277 | 4.33 | +0.0% | 0 | tempo.ghost-strike x36 |
| `lineage-axe-kill-chain` | kill-chain | dot | 13 | 8115 | 4.33 | +0.0% | 0 | kill-chain.kill-pulse x13 |
| `lineage-axe-empowered` | empowered | dot | 13 | 8277 | 4.33 | +0.0% | 0 | empowered.weak-point x13 |
| `lineage-axe-baseline` | _control_ | dot | 13 | 8277 | 4.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 15 | 6480 | 5.00 | +7.1% | 0 | affliction.venom-pips x150 |
| `lineage-dagger-control` | control | reload | 16 | 6019 | 5.33 | +14.3% | 0 | control.frost-drag x49 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 14 | 6086 | 4.67 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 14 | 6121 | 4.67 | — | 0 | — |

### `node-t1-mountain-03` — Hopper 70% / Crag 20% / Ridge 10% (mountain T1; shared by 1 authored node)

Dominant family **Hopper** drops `tempo`, punishes `empowered`. Authored Hopper 70% / Crag 20% / Ridge 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 22 | 5800 | 7.33 | +0.0% | 0 | kill-chain.kill-pulse x22 |
| `lineage-broadsword-empowered` | empowered | energy | 20 | 5970 | 6.67 | -9.1% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-tempo` | tempo | energy | 22 | 6127 | 7.33 | +0.0% | 0 | tempo.ghost-strike x42 |
| `lineage-broadsword-baseline` | _control_ | energy | 22 | 6118 | 7.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 20 | 4955 | 6.67 | -4.8% | 0 | tempo.ghost-strike x45 |
| `lineage-rapier-affliction` | affliction | cadence | 18 | 5589 | 6.00 | -14.3% | 0 | affliction.bleed-pips x121 |
| `lineage-rapier-engagement` | engagement | cadence | 22 | 4782 | 7.33 | +4.8% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | cadence | 21 | 5419 | 7.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 17 | 5582 | 5.67 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | cooldown | 17 | 5582 | 5.67 | +0.0% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | cooldown | 17 | 5782 | 5.67 | +0.0% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | cooldown | 17 | 5476 | 5.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 16 | 7006 | 5.33 | +0.0% | 0 | tempo.ghost-strike x38 |
| `lineage-axe-kill-chain` | kill-chain | dot | 17 | 7141 | 5.67 | +6.3% | 0 | kill-chain.kill-pulse x17 |
| `lineage-axe-empowered` | empowered | dot | 16 | 7006 | 5.33 | +0.0% | 0 | empowered.weak-point x16 |
| `lineage-axe-baseline` | _control_ | dot | 16 | 7006 | 5.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 22 | 5655 | 7.33 | +4.8% | 0 | affliction.venom-pips x192 |
| `lineage-dagger-control` | control | reload | 22 | 5768 | 7.33 | +4.8% | 0 | control.frost-drag x65 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 20 | 5890 | 6.67 | -4.8% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 21 | 5967 | 7.00 | — | 0 | — |

### `node-t1-mountain-04` — Crag 45% / Ridge 45% / Hopper 10% (mountain T1; shared by 1 authored node)

Dominant family **Crag** drops `empowered`, punishes `affliction`. Authored Crag 45% / Ridge 45% / Hopper 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 16 | 7169 | 5.33 | -5.9% | 0 | kill-chain.kill-pulse x16 |
| `lineage-broadsword-empowered` | empowered | energy | 18 | 6544 | 6.00 | +5.9% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-tempo` | tempo | energy | 18 | 6544 | 6.00 | +5.9% | 0 | tempo.ghost-strike x37 |
| `lineage-broadsword-baseline` | _control_ | energy | 17 | 6941 | 5.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 18 | 5450 | 6.00 | +20.0% | 0 | tempo.ghost-strike x47 |
| `lineage-rapier-affliction` | affliction | cadence | 17 | 6124 | 5.67 | +13.3% | 0 | affliction.bleed-pips x132 |
| `lineage-rapier-engagement` | engagement | cadence | 18 | 5428 | 6.00 | +20.0% | 0 | engagement.opening-flash x15 |
| `lineage-rapier-baseline` | _control_ | cadence | 15 | 6853 | 5.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 18 | 5289 | 6.00 | +12.5% | 0 | empowered.plating-crack x18 |
| `lineage-hammer-control` | control | cooldown | 18 | 5217 | 6.00 | +12.5% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | cooldown | 18 | 5350 | 6.00 | +12.5% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | cooldown | 16 | 6225 | 5.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 15 | 8100 | 5.00 | +0.0% | 0 | tempo.ghost-strike x43 |
| `lineage-axe-kill-chain` | kill-chain | dot | 14 | 8293 | 4.67 | -6.7% | 0 | kill-chain.kill-pulse x14 |
| `lineage-axe-empowered` | empowered | dot | 15 | 8100 | 5.00 | +0.0% | 0 | empowered.weak-point x15 |
| `lineage-axe-baseline` | _control_ | dot | 15 | 8100 | 5.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 15 | 6747 | 5.00 | -6.3% | 0 | affliction.venom-pips x161 |
| `lineage-dagger-control` | control | reload | 18 | 6139 | 6.00 | +12.5% | 0 | control.frost-drag x57 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 16 | 6550 | 5.33 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 16 | 6625 | 5.33 | — | 0 | — |

### `node-t1-mountain-05` — Crag 34% / Ridge 33% / Hopper 33% (mountain T1; shared by 1 authored node)

Dominant family **Crag** drops `empowered`, punishes `affliction`. Authored Crag 34% / Ridge 33% / Hopper 33%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 17 | 7071 | 5.67 | +0.0% | 0 | kill-chain.kill-pulse x17 |
| `lineage-broadsword-empowered` | empowered | energy | 18 | 6550 | 6.00 | +5.9% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-tempo` | tempo | energy | 18 | 6550 | 6.00 | +5.9% | 0 | tempo.ghost-strike x36 |
| `lineage-broadsword-baseline` | _control_ | energy | 17 | 6894 | 5.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 18 | 5728 | 6.00 | +12.5% | 0 | tempo.ghost-strike x48 |
| `lineage-rapier-affliction` | affliction | cadence | 16 | 6400 | 5.33 | +0.0% | 0 | affliction.bleed-pips x127 |
| `lineage-rapier-engagement` | engagement | cadence | 18 | 5317 | 6.00 | +12.5% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | cadence | 16 | 6275 | 5.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 18 | 5361 | 6.00 | +5.9% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | cooldown | 18 | 5083 | 6.00 | +5.9% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | cooldown | 18 | 5078 | 6.00 | +5.9% | 0 | engagement.brace-sparks x15 |
| `lineage-hammer-baseline` | _control_ | cooldown | 17 | 5535 | 5.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 13 | 8231 | 4.33 | +0.0% | 0 | tempo.ghost-strike x37 |
| `lineage-axe-kill-chain` | kill-chain | dot | 13 | 8408 | 4.33 | +0.0% | 0 | kill-chain.kill-pulse x13 |
| `lineage-axe-empowered` | empowered | dot | 13 | 8231 | 4.33 | +0.0% | 0 | empowered.weak-point x13 |
| `lineage-axe-baseline` | _control_ | dot | 13 | 8231 | 4.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 17 | 6741 | 5.67 | +6.3% | 0 | affliction.venom-pips x167 |
| `lineage-dagger-control` | control | reload | 18 | 6000 | 6.00 | +12.5% | 0 | control.frost-drag x55 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 16 | 6650 | 5.33 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 16 | 6850 | 5.33 | — | 0 | — |

### `node-t1-cave-01` — Brood 70% / Brute 20% / Deep 10% (cave T1; shared by 1 authored node)

Dominant family **Brood** drops `affliction`, punishes `tempo`. Authored Brood 70% / Brute 20% / Deep 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 35 | 2691 | 11.67 | +16.7% | 0 | kill-chain.kill-pulse x35 |
| `lineage-broadsword-empowered` | empowered | energy | 29 | 2966 | 9.67 | -3.3% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-tempo` | tempo | energy | 29 | 2966 | 9.67 | -3.3% | 0 | tempo.ghost-strike x32 |
| `lineage-broadsword-baseline` | _control_ | energy | 30 | 3037 | 10.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 30 | 2610 | 10.00 | -3.2% | 0 | tempo.ghost-strike x38 |
| `lineage-rapier-affliction` | affliction | cadence | 31 | 2497 | 10.33 | +0.0% | 0 | affliction.bleed-pips x106 |
| `lineage-rapier-engagement` | engagement | cadence | 31 | 2368 | 10.33 | +0.0% | 0 | engagement.opening-flash x14 |
| `lineage-rapier-baseline` | _control_ | cadence | 31 | 2490 | 10.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 22 | 2764 | 7.33 | +0.0% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | cooldown | 22 | 2764 | 7.33 | +0.0% | 0 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | cooldown | 22 | 2955 | 7.33 | +0.0% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | cooldown | 22 | 2650 | 7.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 19 | 4032 | 6.33 | +0.0% | 0 | tempo.ghost-strike x29 |
| `lineage-axe-kill-chain` | kill-chain | dot | 20 | 4005 | 6.67 | +5.3% | 0 | kill-chain.kill-pulse x20 |
| `lineage-axe-empowered` | empowered | dot | 19 | 4232 | 6.33 | +0.0% | 0 | empowered.weak-point x5 |
| `lineage-axe-baseline` | _control_ | dot | 19 | 4032 | 6.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 27 | 3019 | 9.00 | +8.0% | 0 | affliction.venom-pips x150 |
| `lineage-dagger-control` | control | reload | 28 | 2886 | 9.33 | +12.0% | 0 | control.frost-drag x48 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 27 | 3170 | 9.00 | +8.0% | 0 | kill-chain.spread-arc x3 |
| `lineage-dagger-baseline` | _control_ | reload | 25 | 3016 | 8.33 | — | 0 | — |
| `frame-cadence-light` | _frame light_ | cadence | 29 | 2717 | 9.67 | — | 0 | — |
| `frame-cadence-balanced` | _frame balanced_ | cadence | 31 | 2490 | 10.33 | — | 0 | — |
| `frame-cadence-heavy` | _frame heavy_ | cadence | 24 | 3221 | 8.00 | — | 0 | — |
| `frame-cooldown-light` | _frame light_ | cooldown | 23 | 3365 | 7.67 | — | 0 | — |
| `frame-cooldown-balanced` | _frame balanced_ | cooldown | 22 | 3173 | 7.33 | — | 0 | — |
| `frame-cooldown-heavy` | _frame heavy_ | cooldown | 22 | 2650 | 7.33 | — | 0 | — |
| `frame-reload-light` | _frame light_ | reload | 27 | 3093 | 9.00 | — | 0 | — |
| `frame-reload-balanced` | _frame balanced_ | reload | 27 | 3363 | 9.00 | — | 0 | — |
| `frame-reload-heavy` | _frame heavy_ | reload | 25 | 3016 | 8.33 | — | 0 | — |
| `frame-energy-light` | _frame light_ | energy | 25 | 3640 | 8.33 | — | 0 | — |
| `frame-energy-balanced` | _frame balanced_ | energy | 24 | 3971 | 8.00 | — | 0 | — |
| `frame-energy-heavy` | _frame heavy_ | energy | 30 | 3037 | 10.00 | — | 0 | — |
| `frame-dot-light` | _frame light_ | dot | 24 | 3621 | 8.00 | — | 0 | — |
| `frame-dot-balanced` | _frame balanced_ | dot | 19 | 4032 | 6.33 | — | 0 | — |
| `frame-dot-heavy` | _frame heavy_ | dot | 22 | 3341 | 7.33 | — | 0 | — |
| `frame-summoner-light` | _frame light_ | summoner | 36 | 119 | 12.00 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | summoner | 27 | 0 | 9.00 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | summoner | 44 | 907 | 14.67 | — | 0 | — |

### `node-t1-cave-02` — Brute 70% / Deep 20% / Brood 10% (cave T1; shared by 1 authored node)

Dominant family **Brute** drops `empowered`, punishes `affliction`. Authored Brute 70% / Deep 20% / Brood 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 16 | 7500 | 5.33 | +6.7% | 0 | kill-chain.kill-pulse x16 |
| `lineage-broadsword-empowered` | empowered | energy | 15 | 7240 | 5.00 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-tempo` | tempo | energy | 15 | 7240 | 5.00 | +0.0% | 0 | tempo.ghost-strike x36 |
| `lineage-broadsword-baseline` | _control_ | energy | 15 | 7760 | 5.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 11 | 7945 | 3.67 | +10.0% | 0 | tempo.ghost-strike x37 |
| `lineage-rapier-affliction` | affliction | cadence | 11 | 7545 | 3.67 | +10.0% | 0 | affliction.bleed-pips x95 |
| `lineage-rapier-engagement` | engagement | cadence | 12 | 6358 | 4.00 | +20.0% | 0 | engagement.opening-flash x12 |
| `lineage-rapier-baseline` | _control_ | cadence | 10 | 8410 | 3.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 13 | 4585 | 4.33 | -7.1% | 0 | empowered.plating-crack x13 |
| `lineage-hammer-control` | control | cooldown | 13 | 4485 | 4.33 | -7.1% | 0 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | cooldown | 13 | 4138 | 4.33 | -7.1% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | cooldown | 14 | 4857 | 4.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 12 | 8475 | 4.00 | +0.0% | 0 | tempo.ghost-strike x37 |
| `lineage-axe-kill-chain` | kill-chain | dot | 14 | 8471 | 4.67 | +16.7% | 0 | kill-chain.kill-pulse x14 |
| `lineage-axe-empowered` | empowered | dot | 14 | 7750 | 4.67 | +16.7% | 0 | empowered.weak-point x14 |
| `lineage-axe-baseline` | _control_ | dot | 12 | 8475 | 4.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 16 | 6400 | 5.33 | +14.3% | 0 | affliction.venom-pips x173 |
| `lineage-dagger-control` | control | reload | 18 | 6306 | 6.00 | +28.6% | 0 | control.frost-drag x64 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 15 | 6460 | 5.00 | +7.1% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 14 | 7236 | 4.67 | — | 0 | — |

### `node-t1-cave-03` — Deep 70% / Brood 20% / Brute 10% (cave T1; shared by 1 authored node)

Dominant family **Deep** drops `kill-chain`, punishes `engagement`. Authored Deep 70% / Brood 20% / Brute 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 12 | 7542 | 4.00 | -25.0% | 0 | kill-chain.kill-pulse x12 |
| `lineage-broadsword-empowered` | empowered | energy | 19 | 4574 | 6.33 | +18.8% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-tempo` | tempo | energy | 19 | 4574 | 6.33 | +18.8% | 0 | tempo.ghost-strike x32 |
| `lineage-broadsword-baseline` | _control_ | energy | 16 | 5731 | 5.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 18 | 4044 | 6.00 | +12.5% | 0 | tempo.ghost-strike x40 |
| `lineage-rapier-affliction` | affliction | cadence | 17 | 4382 | 5.67 | +6.3% | 0 | affliction.bleed-pips x106 |
| `lineage-rapier-engagement` | engagement | cadence | 18 | 3933 | 6.00 | +12.5% | 0 | engagement.opening-flash x16 |
| `lineage-rapier-baseline` | _control_ | cadence | 16 | 4731 | 5.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 16 | 3650 | 5.33 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | cooldown | 17 | 3500 | 5.67 | +6.3% | 0 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | cooldown | 17 | 3506 | 5.67 | +6.3% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | cooldown | 16 | 3650 | 5.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 14 | 6257 | 4.67 | +0.0% | 0 | tempo.ghost-strike x34 |
| `lineage-axe-kill-chain` | kill-chain | dot | 14 | 6500 | 4.67 | +0.0% | 0 | kill-chain.kill-pulse x14 |
| `lineage-axe-empowered` | empowered | dot | 14 | 5807 | 4.67 | +0.0% | 0 | empowered.weak-point x11 |
| `lineage-axe-baseline` | _control_ | dot | 14 | 6257 | 4.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 17 | 4329 | 5.67 | +21.4% | 0 | affliction.venom-pips x150 |
| `lineage-dagger-control` | control | reload | 16 | 4906 | 5.33 | +14.3% | 0 | control.frost-drag x46 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 15 | 5220 | 5.00 | +7.1% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 14 | 5357 | 4.67 | — | 0 | — |

### `node-t1-cave-04` — Brood 45% / Brute 45% / Deep 10% (cave T1; shared by 1 authored node)

Dominant family **Brood** drops `affliction`, punishes `tempo`. Authored Brood 45% / Brute 45% / Deep 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 22 | 4205 | 7.33 | -12.0% | 0 | kill-chain.kill-pulse x22 |
| `lineage-broadsword-empowered` | empowered | energy | 21 | 4376 | 7.00 | -16.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-tempo` | tempo | energy | 21 | 4376 | 7.00 | -16.0% | 0 | tempo.ghost-strike x33 |
| `lineage-broadsword-baseline` | _control_ | energy | 25 | 3656 | 8.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 22 | 3473 | 7.33 | +22.2% | 0 | tempo.ghost-strike x36 |
| `lineage-rapier-affliction` | affliction | cadence | 18 | 4289 | 6.00 | +0.0% | 0 | affliction.bleed-pips x92 |
| `lineage-rapier-engagement` | engagement | cadence | 19 | 3868 | 6.33 | +5.6% | 0 | engagement.opening-flash x12 |
| `lineage-rapier-baseline` | _control_ | cadence | 18 | 4522 | 6.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 19 | 3121 | 6.33 | +0.0% | 0 | empowered.plating-crack x13 |
| `lineage-hammer-control` | control | cooldown | 19 | 3121 | 6.33 | +0.0% | 0 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | cooldown | 21 | 2881 | 7.00 | +10.5% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | cooldown | 19 | 3411 | 6.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 18 | 5450 | 6.00 | +0.0% | 0 | tempo.ghost-strike x36 |
| `lineage-axe-kill-chain` | kill-chain | dot | 18 | 4844 | 6.00 | +0.0% | 0 | kill-chain.kill-pulse x18 |
| `lineage-axe-empowered` | empowered | dot | 19 | 5211 | 6.33 | +5.6% | 0 | empowered.weak-point x10 |
| `lineage-axe-baseline` | _control_ | dot | 18 | 5450 | 6.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 24 | 3492 | 8.00 | +26.3% | 0 | affliction.venom-pips x147 |
| `lineage-dagger-control` | control | reload | 21 | 4081 | 7.00 | +10.5% | 0 | control.frost-drag x52 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 19 | 4621 | 6.33 | +0.0% | 0 | kill-chain.spread-arc x3 |
| `lineage-dagger-baseline` | _control_ | reload | 19 | 4747 | 6.33 | — | 0 | — |

### `node-t1-cave-05` — Brood 34% / Brute 33% / Deep 33% (cave T1; shared by 1 authored node)

Dominant family **Brood** drops `affliction`, punishes `tempo`. Authored Brood 34% / Brute 33% / Deep 33%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 24 | 3721 | 8.00 | +9.1% | 0 | kill-chain.kill-pulse x24 |
| `lineage-broadsword-empowered` | empowered | energy | 25 | 3868 | 8.33 | +13.6% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-tempo` | tempo | energy | 25 | 3868 | 8.33 | +13.6% | 0 | tempo.ghost-strike x35 |
| `lineage-broadsword-baseline` | _control_ | energy | 22 | 3936 | 7.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 23 | 3365 | 7.67 | +9.5% | 0 | tempo.ghost-strike x38 |
| `lineage-rapier-affliction` | affliction | cadence | 21 | 3538 | 7.00 | +0.0% | 0 | affliction.bleed-pips x101 |
| `lineage-rapier-engagement` | engagement | cadence | 22 | 3414 | 7.33 | +4.8% | 0 | engagement.opening-flash x12 |
| `lineage-rapier-baseline` | _control_ | cadence | 21 | 3538 | 7.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 23 | 3087 | 7.67 | +0.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | cooldown | 25 | 2752 | 8.33 | +8.7% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | cooldown | 25 | 2716 | 8.33 | +8.7% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | cooldown | 23 | 3109 | 7.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 16 | 5969 | 5.33 | +0.0% | 0 | tempo.ghost-strike x35 |
| `lineage-axe-kill-chain` | kill-chain | dot | 16 | 5581 | 5.33 | +0.0% | 0 | kill-chain.kill-pulse x16 |
| `lineage-axe-empowered` | empowered | dot | 19 | 5442 | 6.33 | +18.8% | 0 | empowered.weak-point x11 |
| `lineage-axe-baseline` | _control_ | dot | 16 | 5969 | 5.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 22 | 3809 | 7.33 | -8.3% | 0 | affliction.venom-pips x149 |
| `lineage-dagger-control` | control | reload | 22 | 3755 | 7.33 | -8.3% | 0 | control.frost-drag x49 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 24 | 3896 | 8.00 | +0.0% | 0 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | reload | 24 | 3600 | 8.00 | — | 0 | — |

### `node-t1-forest-01` — Pack 70% / Grove 20% / Canopy 10% (forest T1; shared by 1 authored node)

Dominant family **Pack** drops `tempo`, punishes `empowered`. Authored Pack 70% / Grove 20% / Canopy 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 55 | 2393 | 18.33 | +25.0% | 3 | kill-chain.kill-pulse x8 |
| `lineage-broadsword-empowered` | empowered | energy | 44 | 2509 | 14.67 | +0.0% | 1 | empowered.weak-point x3 |
| `lineage-broadsword-tempo` | tempo | energy | 44 | 2509 | 14.67 | +0.0% | 1 | tempo.ghost-strike x20 |
| `lineage-broadsword-baseline` | _control_ | energy | 44 | 2509 | 14.67 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | cadence | 48 | 1831 | 16.00 | +17.1% | 0 | tempo.ghost-strike x40 |
| `lineage-rapier-affliction` | affliction | cadence | 44 | 1930 | 14.67 | +7.3% | 0 | affliction.bleed-pips x105 |
| `lineage-rapier-engagement` | engagement | cadence | 44 | 1907 | 14.67 | +7.3% | 0 | engagement.opening-flash x16 |
| `lineage-rapier-baseline` | _control_ | cadence | 41 | 1976 | 13.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 40 | 2023 | 13.33 | +0.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | cooldown | 40 | 2023 | 13.33 | +0.0% | 0 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | cooldown | 36 | 2378 | 12.00 | -10.0% | 0 | engagement.brace-sparks x12 |
| `lineage-hammer-baseline` | _control_ | cooldown | 40 | 2023 | 13.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 33 | 3527 | 11.00 | +0.0% | 3 | tempo.ghost-strike x6 |
| `lineage-axe-kill-chain` | kill-chain | dot | 30 | 3357 | 10.00 | -9.1% | 2 | kill-chain.kill-pulse x5 |
| `lineage-axe-empowered` | empowered | dot | 33 | 3527 | 11.00 | +0.0% | 3 | — |
| `lineage-axe-baseline` | _control_ | dot | 33 | 3527 | 11.00 | — | 3 | — |
| `lineage-dagger-affliction` | affliction | reload | 39 | 2992 | 13.00 | +14.7% | 2 | affliction.venom-pips x39 |
| `lineage-dagger-control` | control | reload | 41 | 2724 | 13.67 | +20.6% | 2 | control.frost-drag x13 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 44 | 3191 | 14.67 | +29.4% | 5 | kill-chain.spread-arc x11 |
| `lineage-dagger-baseline` | _control_ | reload | 34 | 3171 | 11.33 | — | 2 | — |
| `frame-cadence-light` | _frame light_ | cadence | 43 | 2126 | 14.33 | — | 0 | — |
| `frame-cadence-balanced` | _frame balanced_ | cadence | 41 | 1976 | 13.67 | — | 0 | — |
| `frame-cadence-heavy` | _frame heavy_ | cadence | 45 | 2047 | 15.00 | — | 0 | — |
| `frame-cooldown-light` | _frame light_ | cooldown | 38 | 2566 | 12.67 | — | 0 | — |
| `frame-cooldown-balanced` | _frame balanced_ | cooldown | 35 | 2443 | 11.67 | — | 0 | — |
| `frame-cooldown-heavy` | _frame heavy_ | cooldown | 40 | 2023 | 13.33 | — | 0 | — |
| `frame-reload-light` | _frame light_ | reload | 41 | 3785 | 13.67 | — | 7 | — |
| `frame-reload-balanced` | _frame balanced_ | reload | 40 | 3360 | 13.33 | — | 4 | — |
| `frame-reload-heavy` | _frame heavy_ | reload | 34 | 3171 | 11.33 | — | 2 | — |
| `frame-energy-light` | _frame light_ | energy | 45 | 2918 | 15.00 | — | 4 | — |
| `frame-energy-balanced` | _frame balanced_ | energy | 46 | 2922 | 15.33 | — | 6 | — |
| `frame-energy-heavy` | _frame heavy_ | energy | 44 | 2509 | 14.67 | — | 1 | — |
| `frame-dot-light` | _frame light_ | dot | 31 | 3635 | 10.33 | — | 2 | — |
| `frame-dot-balanced` | _frame balanced_ | dot | 33 | 3527 | 11.00 | — | 3 | — |
| `frame-dot-heavy` | _frame heavy_ | dot | 36 | 2894 | 12.00 | — | 2 | — |
| `frame-summoner-light` | _frame light_ | summoner | 50 | 988 | 16.67 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | summoner | 43 | 1363 | 14.33 | — | 1 | — |
| `frame-summoner-heavy` | _frame heavy_ | summoner | 57 | 1495 | 19.00 | — | 0 | — |

### `node-t1-forest-02` — Grove 70% / Canopy 20% / Pack 10% (forest T1; shared by 1 authored node)

Dominant family **Grove** drops `empowered`, punishes `tempo`. Authored Grove 70% / Canopy 20% / Pack 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 37 | 3905 | 12.33 | +5.7% | 1 | kill-chain.kill-pulse x23 |
| `lineage-broadsword-empowered` | empowered | energy | 35 | 4143 | 11.67 | +0.0% | 2 | empowered.weak-point x4 |
| `lineage-broadsword-tempo` | tempo | energy | 35 | 4143 | 11.67 | +0.0% | 2 | tempo.ghost-strike x25 |
| `lineage-broadsword-baseline` | _control_ | energy | 35 | 4143 | 11.67 | — | 2 | — |
| `lineage-rapier-tempo` | tempo | cadence | 32 | 3091 | 10.67 | +3.2% | 0 | tempo.ghost-strike x42 |
| `lineage-rapier-affliction` | affliction | cadence | 31 | 3584 | 10.33 | +0.0% | 0 | affliction.bleed-pips x127 |
| `lineage-rapier-engagement` | engagement | cadence | 31 | 3597 | 10.33 | +0.0% | 0 | engagement.opening-flash x12 |
| `lineage-rapier-baseline` | _control_ | cadence | 31 | 3590 | 10.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 25 | 4632 | 8.33 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | cooldown | 25 | 4632 | 8.33 | +0.0% | 0 | control.frost-drag x16 |
| `lineage-hammer-engagement` | engagement | cooldown | 25 | 4660 | 8.33 | +0.0% | 0 | engagement.brace-sparks x16 |
| `lineage-hammer-baseline` | _control_ | cooldown | 25 | 4632 | 8.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 30 | 4790 | 10.00 | +7.1% | 1 | tempo.ghost-strike x38 |
| `lineage-axe-kill-chain` | kill-chain | dot | 34 | 4674 | 11.33 | +21.4% | 3 | kill-chain.kill-pulse x20 |
| `lineage-axe-empowered` | empowered | dot | 30 | 5033 | 10.00 | +7.1% | 1 | empowered.weak-point x9 |
| `lineage-axe-baseline` | _control_ | dot | 28 | 4829 | 9.33 | — | 1 | — |
| `lineage-dagger-affliction` | affliction | reload | 37 | 3641 | 12.33 | +19.4% | 1 | affliction.venom-pips x200 |
| `lineage-dagger-control` | control | reload | 28 | 4068 | 9.33 | -9.7% | 0 | control.frost-drag x62 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 31 | 4458 | 10.33 | +0.0% | 0 | kill-chain.spread-arc x9 |
| `lineage-dagger-baseline` | _control_ | reload | 31 | 4461 | 10.33 | — | 0 | — |

### `node-t1-forest-03` — Canopy 70% / Pack 20% / Grove 10% (forest T1; shared by 1 authored node)

Dominant family **Canopy** drops `affliction`, punishes `control`. Authored Canopy 70% / Pack 20% / Grove 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 26 | 3288 | 8.67 | +0.0% | 0 | kill-chain.kill-pulse x26 |
| `lineage-broadsword-empowered` | empowered | energy | 26 | 3412 | 8.67 | +0.0% | 0 | empowered.weak-point x5 |
| `lineage-broadsword-tempo` | tempo | energy | 26 | 3412 | 8.67 | +0.0% | 0 | tempo.ghost-strike x30 |
| `lineage-broadsword-baseline` | _control_ | energy | 26 | 3412 | 8.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 28 | 2604 | 9.33 | +3.7% | 0 | tempo.ghost-strike x35 |
| `lineage-rapier-affliction` | affliction | cadence | 27 | 2848 | 9.00 | +0.0% | 0 | affliction.bleed-pips x98 |
| `lineage-rapier-engagement` | engagement | cadence | 29 | 2793 | 9.67 | +7.4% | 0 | engagement.opening-flash x16 |
| `lineage-rapier-baseline` | _control_ | cadence | 27 | 2848 | 9.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 22 | 3727 | 7.33 | +0.0% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | cooldown | 22 | 3727 | 7.33 | +0.0% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | cooldown | 25 | 3224 | 8.33 | +13.6% | 0 | engagement.brace-sparks x18 |
| `lineage-hammer-baseline` | _control_ | cooldown | 22 | 3727 | 7.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 27 | 3933 | 9.00 | +8.0% | 0 | tempo.ghost-strike x35 |
| `lineage-axe-kill-chain` | kill-chain | dot | 29 | 3652 | 9.67 | +16.0% | 0 | kill-chain.kill-pulse x29 |
| `lineage-axe-empowered` | empowered | dot | 25 | 4220 | 8.33 | +0.0% | 0 | empowered.weak-point x1 |
| `lineage-axe-baseline` | _control_ | dot | 25 | 4264 | 8.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 24 | 3225 | 8.00 | -7.7% | 0 | affliction.venom-pips x137 |
| `lineage-dagger-control` | control | reload | 26 | 3212 | 8.67 | +0.0% | 0 | control.frost-drag x47 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 28 | 3164 | 9.33 | +7.7% | 0 | kill-chain.spread-arc x10 |
| `lineage-dagger-baseline` | _control_ | reload | 26 | 3415 | 8.67 | — | 0 | — |

### `node-t1-forest-04` — Pack 45% / Grove 45% / Canopy 10% (forest T1; shared by 1 authored node)

Dominant family **Pack** drops `tempo`, punishes `empowered`. Authored Pack 45% / Grove 45% / Canopy 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 42 | 2502 | 14.00 | +2.4% | 0 | kill-chain.kill-pulse x42 |
| `lineage-broadsword-empowered` | empowered | energy | 41 | 2712 | 13.67 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-tempo` | tempo | energy | 41 | 2712 | 13.67 | +0.0% | 0 | tempo.ghost-strike x34 |
| `lineage-broadsword-baseline` | _control_ | energy | 41 | 2712 | 13.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 44 | 1975 | 14.67 | +18.9% | 0 | tempo.ghost-strike x39 |
| `lineage-rapier-affliction` | affliction | cadence | 37 | 2311 | 12.33 | +0.0% | 0 | affliction.bleed-pips x102 |
| `lineage-rapier-engagement` | engagement | cadence | 39 | 2303 | 13.00 | +5.4% | 0 | engagement.opening-flash x15 |
| `lineage-rapier-baseline` | _control_ | cadence | 37 | 2422 | 12.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 37 | 2370 | 12.33 | +2.8% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | cooldown | 37 | 2370 | 12.33 | +2.8% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | cooldown | 38 | 2582 | 12.67 | +5.6% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | cooldown | 36 | 2583 | 12.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 31 | 3755 | 10.33 | +0.0% | 2 | tempo.ghost-strike x16 |
| `lineage-axe-kill-chain` | kill-chain | dot | 31 | 3916 | 10.33 | +0.0% | 2 | kill-chain.kill-pulse x21 |
| `lineage-axe-empowered` | empowered | dot | 35 | 3509 | 11.67 | +12.9% | 2 | empowered.weak-point x2 |
| `lineage-axe-baseline` | _control_ | dot | 31 | 3755 | 10.33 | — | 2 | — |
| `lineage-dagger-affliction` | affliction | reload | 40 | 3043 | 13.33 | +5.3% | 0 | affliction.venom-pips x192 |
| `lineage-dagger-control` | control | reload | 47 | 2881 | 15.67 | +23.7% | 1 | control.frost-drag x53 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 45 | 2920 | 15.00 | +18.4% | 1 | kill-chain.spread-arc x28 |
| `lineage-dagger-baseline` | _control_ | reload | 38 | 3453 | 12.67 | — | 2 | — |

### `node-t1-forest-05` — Pack 34% / Grove 33% / Canopy 33% (forest T1; shared by 1 authored node)

Dominant family **Pack** drops `tempo`, punishes `empowered`. Authored Pack 34% / Grove 33% / Canopy 33%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 35 | 3106 | 11.67 | +9.4% | 0 | kill-chain.kill-pulse x35 |
| `lineage-broadsword-empowered` | empowered | energy | 32 | 3644 | 10.67 | +0.0% | 2 | empowered.weak-point x3 |
| `lineage-broadsword-tempo` | tempo | energy | 32 | 3644 | 10.67 | +0.0% | 2 | tempo.ghost-strike x19 |
| `lineage-broadsword-baseline` | _control_ | energy | 32 | 3644 | 10.67 | — | 2 | — |
| `lineage-rapier-tempo` | tempo | cadence | 35 | 2349 | 11.67 | +9.4% | 0 | tempo.ghost-strike x37 |
| `lineage-rapier-affliction` | affliction | cadence | 32 | 2684 | 10.67 | +0.0% | 0 | affliction.bleed-pips x105 |
| `lineage-rapier-engagement` | engagement | cadence | 32 | 2759 | 10.67 | +0.0% | 0 | engagement.opening-flash x18 |
| `lineage-rapier-baseline` | _control_ | cadence | 32 | 2684 | 10.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 33 | 2733 | 11.00 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | cooldown | 33 | 2733 | 11.00 | +0.0% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | cooldown | 34 | 2888 | 11.33 | +3.0% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | cooldown | 33 | 2733 | 11.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 30 | 3820 | 10.00 | +0.0% | 1 | tempo.ghost-strike x28 |
| `lineage-axe-kill-chain` | kill-chain | dot | 26 | 4231 | 8.67 | -13.3% | 1 | kill-chain.kill-pulse x18 |
| `lineage-axe-empowered` | empowered | dot | 31 | 3574 | 10.33 | +3.3% | 1 | empowered.weak-point x5 |
| `lineage-axe-baseline` | _control_ | dot | 30 | 3820 | 10.00 | — | 1 | — |
| `lineage-dagger-affliction` | affliction | reload | 30 | 3153 | 10.00 | +0.0% | 0 | affliction.venom-pips x151 |
| `lineage-dagger-control` | control | reload | 35 | 3074 | 11.67 | +16.7% | 0 | control.frost-drag x59 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 30 | 3587 | 10.00 | +0.0% | 0 | kill-chain.spread-arc x13 |
| `lineage-dagger-baseline` | _control_ | reload | 30 | 3313 | 10.00 | — | 0 | — |

### `node-t1-plains-01` — Herd 70% / Swarm 20% / Sky 10% (plains T1; shared by 1 authored node)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Herd 70% / Swarm 20% / Sky 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 49 | 2402 | 16.33 | +6.5% | 0 | kill-chain.kill-pulse x49 |
| `lineage-broadsword-empowered` | empowered | energy | 47 | 2319 | 15.67 | +2.2% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-tempo` | tempo | energy | 46 | 2424 | 15.33 | +0.0% | 0 | tempo.ghost-strike x40 |
| `lineage-broadsword-baseline` | _control_ | energy | 46 | 2424 | 15.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 56 | 1764 | 18.67 | +19.1% | 0 | tempo.ghost-strike x54 |
| `lineage-rapier-affliction` | affliction | cadence | 47 | 1830 | 15.67 | +0.0% | 0 | affliction.bleed-pips x126 |
| `lineage-rapier-engagement` | engagement | cadence | 50 | 1776 | 16.67 | +6.4% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | cadence | 47 | 1843 | 15.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 37 | 2678 | 12.33 | +5.7% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | cooldown | 37 | 2678 | 12.33 | +5.7% | 0 | control.frost-drag x17 |
| `lineage-hammer-engagement` | engagement | cooldown | 39 | 2587 | 13.00 | +11.4% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | cooldown | 35 | 3220 | 11.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 35 | 3251 | 11.67 | +0.0% | 0 | tempo.ghost-strike x43 |
| `lineage-axe-kill-chain` | kill-chain | dot | 34 | 3212 | 11.33 | -2.9% | 0 | kill-chain.kill-pulse x34 |
| `lineage-axe-empowered` | empowered | dot | 36 | 3161 | 12.00 | +2.9% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 35 | 3251 | 11.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 43 | 2474 | 14.33 | +2.4% | 0 | affliction.venom-pips x199 |
| `lineage-dagger-control` | control | reload | 35 | 2829 | 11.67 | -16.7% | 0 | control.frost-drag x55 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 40 | 2800 | 13.33 | -4.8% | 0 | kill-chain.spread-arc x3 |
| `lineage-dagger-baseline` | _control_ | reload | 42 | 2826 | 14.00 | — | 0 | — |
| `frame-cadence-light` | _frame light_ | cadence | 48 | 2081 | 16.00 | — | 0 | — |
| `frame-cadence-balanced` | _frame balanced_ | cadence | 47 | 1843 | 15.67 | — | 0 | — |
| `frame-cadence-heavy` | _frame heavy_ | cadence | 47 | 1917 | 15.67 | — | 0 | — |
| `frame-cooldown-light` | _frame light_ | cooldown | 39 | 2423 | 13.00 | — | 0 | — |
| `frame-cooldown-balanced` | _frame balanced_ | cooldown | 41 | 2637 | 13.67 | — | 0 | — |
| `frame-cooldown-heavy` | _frame heavy_ | cooldown | 35 | 3220 | 11.67 | — | 0 | — |
| `frame-reload-light` | _frame light_ | reload | 41 | 2776 | 13.67 | — | 0 | — |
| `frame-reload-balanced` | _frame balanced_ | reload | 37 | 2905 | 12.33 | — | 0 | — |
| `frame-reload-heavy` | _frame heavy_ | reload | 42 | 2826 | 14.00 | — | 0 | — |
| `frame-energy-light` | _frame light_ | energy | 46 | 2643 | 15.33 | — | 0 | — |
| `frame-energy-balanced` | _frame balanced_ | energy | 43 | 2779 | 14.33 | — | 0 | — |
| `frame-energy-heavy` | _frame heavy_ | energy | 46 | 2424 | 15.33 | — | 0 | — |
| `frame-dot-light` | _frame light_ | dot | 37 | 3084 | 12.33 | — | 0 | — |
| `frame-dot-balanced` | _frame balanced_ | dot | 35 | 3251 | 11.67 | — | 0 | — |
| `frame-dot-heavy` | _frame heavy_ | dot | 31 | 3613 | 10.33 | — | 0 | — |
| `frame-summoner-light` | _frame light_ | summoner | 57 | 300 | 19.00 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | summoner | 48 | 331 | 16.00 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | summoner | 71 | 785 | 23.67 | — | 0 | — |

### `node-t1-plains-02` — Swarm 70% / Sky 20% / Herd 10% (plains T1; shared by 1 authored node)

Dominant family **Swarm** drops `tempo`, punishes `empowered`. Authored Swarm 70% / Sky 20% / Herd 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 58 | 1767 | 19.33 | -4.9% | 0 | kill-chain.kill-pulse x58 |
| `lineage-broadsword-empowered` | empowered | energy | 61 | 1677 | 20.33 | +0.0% | 0 | empowered.weak-point x8 |
| `lineage-broadsword-tempo` | tempo | energy | 61 | 1677 | 20.33 | +0.0% | 0 | tempo.ghost-strike x41 |
| `lineage-broadsword-baseline` | _control_ | energy | 61 | 1677 | 20.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 63 | 1392 | 21.00 | +6.8% | 0 | tempo.ghost-strike x46 |
| `lineage-rapier-affliction` | affliction | cadence | 58 | 1555 | 19.33 | -1.7% | 0 | affliction.bleed-pips x128 |
| `lineage-rapier-engagement` | engagement | cadence | 57 | 1533 | 19.00 | -3.4% | 0 | engagement.opening-flash x12 |
| `lineage-rapier-baseline` | _control_ | cadence | 59 | 1549 | 19.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 49 | 1867 | 16.33 | -3.9% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | cooldown | 49 | 1867 | 16.33 | -3.9% | 0 | control.frost-drag x17 |
| `lineage-hammer-engagement` | engagement | cooldown | 51 | 1861 | 17.00 | +0.0% | 0 | engagement.brace-sparks x12 |
| `lineage-hammer-baseline` | _control_ | cooldown | 51 | 1827 | 17.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 44 | 2584 | 14.67 | +0.0% | 0 | tempo.ghost-strike x43 |
| `lineage-axe-kill-chain` | kill-chain | dot | 44 | 2616 | 14.67 | +0.0% | 0 | kill-chain.kill-pulse x44 |
| `lineage-axe-empowered` | empowered | dot | 44 | 2584 | 14.67 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 44 | 2584 | 14.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 53 | 1960 | 17.67 | +6.0% | 0 | affliction.venom-pips x187 |
| `lineage-dagger-control` | control | reload | 51 | 1910 | 17.00 | +2.0% | 0 | control.frost-drag x58 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 51 | 2051 | 17.00 | +2.0% | 0 | kill-chain.spread-arc x12 |
| `lineage-dagger-baseline` | _control_ | reload | 50 | 2254 | 16.67 | — | 0 | — |

### `node-t1-plains-03` — Sky 70% / Herd 20% / Swarm 10% (plains T1; shared by 1 authored node)

Dominant family **Sky** drops `engagement`, punishes `affliction`. Authored Sky 70% / Herd 20% / Swarm 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 46 | 2700 | 15.33 | +2.2% | 0 | kill-chain.kill-pulse x46 |
| `lineage-broadsword-empowered` | empowered | energy | 45 | 2711 | 15.00 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-tempo` | tempo | energy | 45 | 2711 | 15.00 | +0.0% | 0 | tempo.ghost-strike x38 |
| `lineage-broadsword-baseline` | _control_ | energy | 45 | 2711 | 15.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 46 | 2335 | 15.33 | +4.5% | 0 | tempo.ghost-strike x48 |
| `lineage-rapier-affliction` | affliction | cadence | 47 | 2417 | 15.67 | +6.8% | 0 | affliction.bleed-pips x144 |
| `lineage-rapier-engagement` | engagement | cadence | 43 | 2142 | 14.33 | -2.3% | 0 | engagement.opening-flash x14 |
| `lineage-rapier-baseline` | _control_ | cadence | 44 | 2534 | 14.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 35 | 3080 | 11.67 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | cooldown | 35 | 3080 | 11.67 | +0.0% | 0 | control.frost-drag x18 |
| `lineage-hammer-engagement` | engagement | cooldown | 35 | 3237 | 11.67 | +0.0% | 0 | engagement.brace-sparks x11 |
| `lineage-hammer-baseline` | _control_ | cooldown | 35 | 3080 | 11.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 33 | 3727 | 11.00 | +0.0% | 0 | tempo.ghost-strike x40 |
| `lineage-axe-kill-chain` | kill-chain | dot | 35 | 3557 | 11.67 | +6.1% | 0 | kill-chain.kill-pulse x35 |
| `lineage-axe-empowered` | empowered | dot | 33 | 3727 | 11.00 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 33 | 3727 | 11.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 42 | 2731 | 14.00 | +13.5% | 0 | affliction.venom-pips x186 |
| `lineage-dagger-control` | control | reload | 41 | 2737 | 13.67 | +10.8% | 0 | control.frost-drag x60 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 35 | 3306 | 11.67 | -5.4% | 0 | kill-chain.spread-arc x4 |
| `lineage-dagger-baseline` | _control_ | reload | 37 | 3241 | 12.33 | — | 0 | — |

### `node-t1-plains-04` — Herd 45% / Swarm 45% / Sky 10% (plains T1; shared by 1 authored node)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Herd 45% / Swarm 45% / Sky 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 51 | 2027 | 17.00 | +6.3% | 0 | kill-chain.kill-pulse x51 |
| `lineage-broadsword-empowered` | empowered | energy | 48 | 1856 | 16.00 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-tempo` | tempo | energy | 48 | 1856 | 16.00 | +0.0% | 0 | tempo.ghost-strike x35 |
| `lineage-broadsword-baseline` | _control_ | energy | 48 | 1856 | 16.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 61 | 1538 | 20.33 | +7.0% | 0 | tempo.ghost-strike x51 |
| `lineage-rapier-affliction` | affliction | cadence | 59 | 1715 | 19.67 | +3.5% | 0 | affliction.bleed-pips x148 |
| `lineage-rapier-engagement` | engagement | cadence | 60 | 1508 | 20.00 | +5.3% | 0 | engagement.opening-flash x12 |
| `lineage-rapier-baseline` | _control_ | cadence | 57 | 1689 | 19.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 43 | 2251 | 14.33 | +13.2% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | cooldown | 43 | 2251 | 14.33 | +13.2% | 0 | control.frost-drag x17 |
| `lineage-hammer-engagement` | engagement | cooldown | 40 | 2320 | 13.33 | +5.3% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | cooldown | 38 | 2647 | 12.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 34 | 3121 | 11.33 | +0.0% | 0 | tempo.ghost-strike x41 |
| `lineage-axe-kill-chain` | kill-chain | dot | 39 | 2900 | 13.00 | +14.7% | 0 | kill-chain.kill-pulse x39 |
| `lineage-axe-empowered` | empowered | dot | 34 | 3121 | 11.33 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 34 | 3121 | 11.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 47 | 2296 | 15.67 | +9.3% | 0 | affliction.venom-pips x199 |
| `lineage-dagger-control` | control | reload | 44 | 2218 | 14.67 | +2.3% | 0 | control.frost-drag x59 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 46 | 2409 | 15.33 | +7.0% | 0 | kill-chain.spread-arc x9 |
| `lineage-dagger-baseline` | _control_ | reload | 43 | 2528 | 14.33 | — | 0 | — |

### `node-t1-plains-05` — Herd 34% / Swarm 33% / Sky 33% (plains T1; shared by 1 authored node)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Herd 34% / Swarm 33% / Sky 33%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 48 | 2346 | 16.00 | -2.0% | 0 | kill-chain.kill-pulse x48 |
| `lineage-broadsword-empowered` | empowered | energy | 53 | 2134 | 17.67 | +8.2% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-tempo` | tempo | energy | 49 | 2278 | 16.33 | +0.0% | 0 | tempo.ghost-strike x39 |
| `lineage-broadsword-baseline` | _control_ | energy | 49 | 2278 | 16.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 58 | 1683 | 19.33 | +3.6% | 0 | tempo.ghost-strike x52 |
| `lineage-rapier-affliction` | affliction | cadence | 50 | 1878 | 16.67 | -10.7% | 0 | affliction.bleed-pips x133 |
| `lineage-rapier-engagement` | engagement | cadence | 50 | 1830 | 16.67 | -10.7% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | cadence | 56 | 1852 | 18.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 43 | 2419 | 14.33 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | cooldown | 43 | 2419 | 14.33 | +0.0% | 0 | control.frost-drag x18 |
| `lineage-hammer-engagement` | engagement | cooldown | 43 | 2419 | 14.33 | +0.0% | 0 | engagement.brace-sparks x12 |
| `lineage-hammer-baseline` | _control_ | cooldown | 43 | 2226 | 14.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 33 | 3491 | 11.00 | +0.0% | 0 | tempo.ghost-strike x40 |
| `lineage-axe-kill-chain` | kill-chain | dot | 34 | 3438 | 11.33 | +3.0% | 0 | kill-chain.kill-pulse x34 |
| `lineage-axe-empowered` | empowered | dot | 33 | 3491 | 11.00 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 33 | 3491 | 11.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 46 | 2335 | 15.33 | +12.2% | 0 | affliction.venom-pips x199 |
| `lineage-dagger-control` | control | reload | 44 | 2441 | 14.67 | +7.3% | 0 | control.frost-drag x60 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 45 | 2524 | 15.00 | +9.8% | 0 | kill-chain.spread-arc x9 |
| `lineage-dagger-baseline` | _control_ | reload | 41 | 2724 | 13.67 | — | 0 | — |

### `node-t1-swamp-01` — Mire 70% / Coven 20% / Stalker 10% (swamp T1; shared by 1 authored node)

Dominant family **Mire** drops `affliction`, punishes `empowered`. Authored Mire 70% / Coven 20% / Stalker 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 23 | 3148 | 7.67 | +4.5% | 0 | kill-chain.kill-pulse x23 |
| `lineage-broadsword-empowered` | empowered | energy | 22 | 3114 | 7.33 | +0.0% | 0 | empowered.weak-point x5 |
| `lineage-broadsword-tempo` | tempo | energy | 22 | 3114 | 7.33 | +0.0% | 0 | tempo.ghost-strike x27 |
| `lineage-broadsword-baseline` | _control_ | energy | 22 | 3114 | 7.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 16 | 3056 | 5.33 | +0.0% | 0 | tempo.ghost-strike x26 |
| `lineage-rapier-affliction` | affliction | cadence | 15 | 3207 | 5.00 | -6.3% | 0 | affliction.bleed-pips x70 |
| `lineage-rapier-engagement` | engagement | cadence | 20 | 2795 | 6.67 | +25.0% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | cadence | 16 | 3456 | 5.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 18 | 2817 | 6.00 | +5.9% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | cooldown | 18 | 2817 | 6.00 | +5.9% | 0 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | cooldown | 18 | 2817 | 6.00 | +5.9% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | cooldown | 17 | 2918 | 5.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 15 | 4773 | 5.00 | +0.0% | 0 | tempo.ghost-strike x24 |
| `lineage-axe-kill-chain` | kill-chain | dot | 15 | 4627 | 5.00 | +0.0% | 0 | kill-chain.kill-pulse x15 |
| `lineage-axe-empowered` | empowered | dot | 15 | 4773 | 5.00 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 15 | 4773 | 5.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 20 | 3435 | 6.67 | -9.1% | 0 | affliction.venom-pips x128 |
| `lineage-dagger-control` | control | reload | 21 | 3410 | 7.00 | -4.5% | 0 | control.frost-drag x44 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 22 | 3227 | 7.33 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 22 | 3350 | 7.33 | — | 0 | — |
| `frame-cadence-light` | _frame light_ | cadence | 18 | 2839 | 6.00 | — | 0 | — |
| `frame-cadence-balanced` | _frame balanced_ | cadence | 16 | 3456 | 5.33 | — | 0 | — |
| `frame-cadence-heavy` | _frame heavy_ | cadence | 19 | 3447 | 6.33 | — | 0 | — |
| `frame-cooldown-light` | _frame light_ | cooldown | 23 | 3126 | 7.67 | — | 0 | — |
| `frame-cooldown-balanced` | _frame balanced_ | cooldown | 15 | 3300 | 5.00 | — | 0 | — |
| `frame-cooldown-heavy` | _frame heavy_ | cooldown | 17 | 2918 | 5.67 | — | 0 | — |
| `frame-reload-light` | _frame light_ | reload | 23 | 3870 | 7.67 | — | 0 | — |
| `frame-reload-balanced` | _frame balanced_ | reload | 20 | 4055 | 6.67 | — | 0 | — |
| `frame-reload-heavy` | _frame heavy_ | reload | 22 | 3350 | 7.33 | — | 0 | — |
| `frame-energy-light` | _frame light_ | energy | 26 | 3385 | 8.67 | — | 0 | — |
| `frame-energy-balanced` | _frame balanced_ | energy | 23 | 3626 | 7.67 | — | 0 | — |
| `frame-energy-heavy` | _frame heavy_ | energy | 22 | 3114 | 7.33 | — | 0 | — |
| `frame-dot-light` | _frame light_ | dot | 21 | 4038 | 7.00 | — | 0 | — |
| `frame-dot-balanced` | _frame balanced_ | dot | 15 | 4773 | 5.00 | — | 0 | — |
| `frame-dot-heavy` | _frame heavy_ | dot | 15 | 4393 | 5.00 | — | 0 | — |
| `frame-summoner-light` | _frame light_ | summoner | 27 | 0 | 9.00 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | summoner | 27 | 0 | 9.00 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | summoner | 31 | 368 | 10.33 | — | 0 | — |

### `node-t1-swamp-02` — Coven 70% / Stalker 20% / Mire 10% (swamp T1; shared by 1 authored node)

Dominant family **Coven** drops `control`, punishes `tempo`. Authored Coven 70% / Stalker 20% / Mire 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 27 | 3289 | 9.00 | -6.9% | 0 | kill-chain.kill-pulse x27 |
| `lineage-broadsword-empowered` | empowered | energy | 29 | 3279 | 9.67 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-tempo` | tempo | energy | 29 | 3279 | 9.67 | +0.0% | 0 | tempo.ghost-strike x36 |
| `lineage-broadsword-baseline` | _control_ | energy | 29 | 3279 | 9.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 24 | 3317 | 8.00 | -11.1% | 0 | tempo.ghost-strike x40 |
| `lineage-rapier-affliction` | affliction | cadence | 30 | 2680 | 10.00 | +11.1% | 0 | affliction.bleed-pips x107 |
| `lineage-rapier-engagement` | engagement | cadence | 30 | 2580 | 10.00 | +11.1% | 0 | engagement.opening-flash x16 |
| `lineage-rapier-baseline` | _control_ | cadence | 27 | 3615 | 9.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 24 | 3204 | 8.00 | +26.3% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | cooldown | 24 | 3204 | 8.00 | +26.3% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | cooldown | 24 | 3213 | 8.00 | +26.3% | 0 | engagement.brace-sparks x15 |
| `lineage-hammer-baseline` | _control_ | cooldown | 19 | 4211 | 6.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 22 | 4682 | 7.33 | +0.0% | 0 | tempo.ghost-strike x34 |
| `lineage-axe-kill-chain` | kill-chain | dot | 19 | 4547 | 6.33 | -13.6% | 0 | kill-chain.kill-pulse x19 |
| `lineage-axe-empowered` | empowered | dot | 22 | 4682 | 7.33 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 22 | 4682 | 7.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 28 | 3079 | 9.33 | +16.7% | 0 | affliction.venom-pips x155 |
| `lineage-dagger-control` | control | reload | 26 | 3254 | 8.67 | +8.3% | 0 | control.frost-drag x49 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 25 | 3336 | 8.33 | +4.2% | 0 | kill-chain.spread-arc x2 |
| `lineage-dagger-baseline` | _control_ | reload | 24 | 3500 | 8.00 | — | 0 | — |

### `node-t1-swamp-03` — Stalker 70% / Mire 20% / Coven 10% (swamp T1; shared by 1 authored node)

Dominant family **Stalker** drops `kill-chain`, punishes `bulwark`. Authored Stalker 70% / Mire 20% / Coven 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 24 | 3079 | 8.00 | -4.0% | 0 | kill-chain.kill-pulse x24 |
| `lineage-broadsword-empowered` | empowered | energy | 25 | 3096 | 8.33 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-tempo` | tempo | energy | 25 | 3096 | 8.33 | +0.0% | 0 | tempo.ghost-strike x31 |
| `lineage-broadsword-baseline` | _control_ | energy | 25 | 3096 | 8.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 20 | 3155 | 6.67 | +0.0% | 0 | tempo.ghost-strike x33 |
| `lineage-rapier-affliction` | affliction | cadence | 23 | 2952 | 7.67 | +15.0% | 0 | affliction.bleed-pips x99 |
| `lineage-rapier-engagement` | engagement | cadence | 22 | 2641 | 7.33 | +10.0% | 0 | engagement.opening-flash x18 |
| `lineage-rapier-baseline` | _control_ | cadence | 20 | 3455 | 6.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 15 | 3553 | 5.00 | +0.0% | 0 | empowered.plating-crack x12 |
| `lineage-hammer-control` | control | cooldown | 15 | 3553 | 5.00 | +0.0% | 0 | control.frost-drag x9 |
| `lineage-hammer-engagement` | engagement | cooldown | 15 | 3553 | 5.00 | +0.0% | 0 | engagement.brace-sparks x11 |
| `lineage-hammer-baseline` | _control_ | cooldown | 15 | 3553 | 5.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 16 | 4844 | 5.33 | +0.0% | 0 | tempo.ghost-strike x27 |
| `lineage-axe-kill-chain` | kill-chain | dot | 17 | 4776 | 5.67 | +6.3% | 0 | kill-chain.kill-pulse x17 |
| `lineage-axe-empowered` | empowered | dot | 16 | 4844 | 5.33 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 16 | 4844 | 5.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 21 | 3129 | 7.00 | -4.5% | 0 | affliction.venom-pips x125 |
| `lineage-dagger-control` | control | reload | 18 | 3278 | 6.00 | -18.2% | 0 | control.frost-drag x38 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 23 | 3217 | 7.67 | +4.5% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 22 | 3600 | 7.33 | — | 0 | — |

### `node-t1-swamp-04` — Mire 45% / Coven 45% / Stalker 10% (swamp T1; shared by 1 authored node)

Dominant family **Mire** drops `affliction`, punishes `empowered`. Authored Mire 45% / Coven 45% / Stalker 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 23 | 3126 | 7.67 | +0.0% | 0 | kill-chain.kill-pulse x23 |
| `lineage-broadsword-empowered` | empowered | energy | 23 | 3187 | 7.67 | +0.0% | 0 | empowered.weak-point x5 |
| `lineage-broadsword-tempo` | tempo | energy | 23 | 3187 | 7.67 | +0.0% | 0 | tempo.ghost-strike x29 |
| `lineage-broadsword-baseline` | _control_ | energy | 23 | 3187 | 7.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 22 | 3164 | 7.33 | +10.0% | 0 | tempo.ghost-strike x35 |
| `lineage-rapier-affliction` | affliction | cadence | 23 | 2887 | 7.67 | +15.0% | 0 | affliction.bleed-pips x91 |
| `lineage-rapier-engagement` | engagement | cadence | 25 | 2688 | 8.33 | +25.0% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | cadence | 20 | 3475 | 6.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 20 | 3695 | 6.67 | +5.3% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | cooldown | 20 | 3695 | 6.67 | +5.3% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | cooldown | 20 | 3695 | 6.67 | +5.3% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | cooldown | 19 | 4153 | 6.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 18 | 4350 | 6.00 | +0.0% | 0 | tempo.ghost-strike x28 |
| `lineage-axe-kill-chain` | kill-chain | dot | 17 | 4435 | 5.67 | -5.6% | 0 | kill-chain.kill-pulse x17 |
| `lineage-axe-empowered` | empowered | dot | 18 | 4350 | 6.00 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 18 | 4350 | 6.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 23 | 3170 | 7.67 | +4.5% | 0 | affliction.venom-pips x142 |
| `lineage-dagger-control` | control | reload | 22 | 3223 | 7.33 | +0.0% | 0 | control.frost-drag x44 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 22 | 3609 | 7.33 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 22 | 3514 | 7.33 | — | 0 | — |

### `node-t1-swamp-05` — Mire 34% / Coven 33% / Stalker 33% (swamp T1; shared by 1 authored node)

Dominant family **Mire** drops `affliction`, punishes `empowered`. Authored Mire 34% / Coven 33% / Stalker 33%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 29 | 3259 | 9.67 | +7.4% | 0 | kill-chain.kill-pulse x29 |
| `lineage-broadsword-empowered` | empowered | energy | 27 | 3119 | 9.00 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-tempo` | tempo | energy | 27 | 3119 | 9.00 | +0.0% | 0 | tempo.ghost-strike x34 |
| `lineage-broadsword-baseline` | _control_ | energy | 27 | 3119 | 9.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 19 | 3153 | 6.33 | -5.0% | 0 | tempo.ghost-strike x31 |
| `lineage-rapier-affliction` | affliction | cadence | 22 | 2895 | 7.33 | +10.0% | 0 | affliction.bleed-pips x92 |
| `lineage-rapier-engagement` | engagement | cadence | 25 | 2676 | 8.33 | +25.0% | 0 | engagement.opening-flash x16 |
| `lineage-rapier-baseline` | _control_ | cadence | 20 | 3315 | 6.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 20 | 3495 | 6.67 | +5.3% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | cooldown | 20 | 3495 | 6.67 | +5.3% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | cooldown | 21 | 3233 | 7.00 | +10.5% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | cooldown | 19 | 3674 | 6.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 18 | 4394 | 6.00 | +0.0% | 0 | tempo.ghost-strike x29 |
| `lineage-axe-kill-chain` | kill-chain | dot | 19 | 4474 | 6.33 | +5.6% | 0 | kill-chain.kill-pulse x19 |
| `lineage-axe-empowered` | empowered | dot | 18 | 4394 | 6.00 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 18 | 4394 | 6.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 26 | 3223 | 8.67 | +4.0% | 0 | affliction.venom-pips x156 |
| `lineage-dagger-control` | control | reload | 25 | 3396 | 8.33 | +0.0% | 0 | control.frost-drag x49 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 27 | 3348 | 9.00 | +8.0% | 0 | kill-chain.spread-arc x2 |
| `lineage-dagger-baseline` | _control_ | reload | 25 | 3340 | 8.33 | — | 0 | — |

### `node-t2-forest-01` — Pack 70% / Grove 20% / Canopy 10% (forest T2; shared by 1 authored node)

Dominant family **Pack** drops `tempo`, punishes `empowered`. Authored Pack 70% / Grove 20% / Canopy 10%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 20 | 7190 | 6.67 | +5.3% | 5 | kill-chain.kill-pulse x6 |
| `lineage-broadsword-empowered` | empowered | energy | 21 | 7100 | 7.00 | +10.5% | 6 | empowered.weak-point x1 |
| `lineage-broadsword-tempo` | tempo | energy | 19 | 7995 | 6.33 | +0.0% | 6 | tempo.ghost-strike x12 |
| `lineage-broadsword-baseline` | _control_ | energy | 19 | 7995 | 6.33 | — | 6 | — |
| `lineage-rapier-tempo` | tempo | cadence | 16 | 7875 | 5.33 | -5.9% | 11 | tempo.ghost-strike x9 |
| `lineage-rapier-affliction` | affliction | cadence | 13 | 8492 | 4.33 | -23.5% | 7 | affliction.bleed-pips x27 |
| `lineage-rapier-engagement` | engagement | cadence | 16 | 7506 | 5.33 | -5.9% | 10 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | cadence | 17 | 8235 | 5.67 | — | 13 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 14 | 10029 | 4.67 | +0.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | cooldown | 14 | 10064 | 4.67 | +0.0% | 0 | control.frost-drag x18 |
| `lineage-hammer-engagement` | engagement | cooldown | 14 | 10136 | 4.67 | +0.0% | 0 | engagement.brace-sparks x4 |
| `lineage-hammer-baseline` | _control_ | cooldown | 14 | 9836 | 4.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 23 | 6270 | 7.67 | +0.0% | 10 | tempo.ghost-strike x8 |
| `lineage-axe-kill-chain` | kill-chain | dot | 18 | 6911 | 6.00 | -21.7% | 9 | kill-chain.kill-pulse x5 |
| `lineage-axe-empowered` | empowered | dot | 25 | 5872 | 8.33 | +8.7% | 11 | empowered.weak-point x1 |
| `lineage-axe-baseline` | _control_ | dot | 23 | 6270 | 7.67 | — | 10 | — |
| `lineage-dagger-affliction` | affliction | reload | 18 | 8011 | 6.00 | -14.3% | 6 | affliction.venom-pips x73 |
| `lineage-dagger-control` | control | reload | 18 | 8539 | 6.00 | -14.3% | 7 | control.frost-drag x26 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 19 | 8153 | 6.33 | -9.5% | 8 | kill-chain.spread-arc x4 |
| `lineage-dagger-baseline` | _control_ | reload | 21 | 7519 | 7.00 | — | 8 | — |
| `frame-cadence-light` | _frame light_ | cadence | 14 | 8986 | 4.67 | — | 10 | — |
| `frame-cadence-balanced` | _frame balanced_ | cadence | 17 | 8235 | 5.67 | — | 13 | — |
| `frame-cadence-heavy` | _frame heavy_ | cadence | 20 | 6535 | 6.67 | — | 5 | — |
| `frame-cooldown-light` | _frame light_ | cooldown | 24 | 5904 | 8.00 | — | 8 | — |
| `frame-cooldown-balanced` | _frame balanced_ | cooldown | 14 | 10657 | 4.67 | — | 5 | — |
| `frame-cooldown-heavy` | _frame heavy_ | cooldown | 14 | 9836 | 4.67 | — | 0 | — |
| `frame-reload-light` | _frame light_ | reload | 18 | 8644 | 6.00 | — | 4 | — |
| `frame-reload-balanced` | _frame balanced_ | reload | 20 | 7650 | 6.67 | — | 8 | — |
| `frame-reload-heavy` | _frame heavy_ | reload | 21 | 7519 | 7.00 | — | 8 | — |
| `frame-energy-light` | _frame light_ | energy | 18 | 8444 | 6.00 | — | 4 | — |
| `frame-energy-balanced` | _frame balanced_ | energy | 22 | 6773 | 7.33 | — | 6 | — |
| `frame-energy-heavy` | _frame heavy_ | energy | 19 | 7995 | 6.33 | — | 6 | — |
| `frame-dot-light` | _frame light_ | dot | 16 | 8713 | 5.33 | — | 8 | — |
| `frame-dot-balanced` | _frame balanced_ | dot | 23 | 6270 | 7.67 | — | 10 | — |
| `frame-dot-heavy` | _frame heavy_ | dot | 17 | 9076 | 5.67 | — | 4 | — |
| `frame-summoner-light` | _frame light_ | summoner | 14 | 9764 | 4.67 | — | 3 | — |
| `frame-summoner-balanced` | _frame balanced_ | summoner | 13 | 10285 | 4.33 | — | 3 | — |
| `frame-summoner-heavy` | _frame heavy_ | summoner | 18 | 2750 | 6.00 | — | 1 | — |

### `node-t2-forest-02` — Grove 70% / Canopy 20% / Pack 10% (forest T2; shared by 1 authored node)

Dominant family **Grove** drops `empowered`, punishes `tempo`. Authored Grove 70% / Canopy 20% / Pack 10%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 11 | 14400 | 3.67 | +37.5% | 1 | kill-chain.kill-pulse x11 |
| `lineage-broadsword-empowered` | empowered | energy | 8 | 19813 | 2.67 | +0.0% | 0 | empowered.weak-point x9 |
| `lineage-broadsword-tempo` | tempo | energy | 10 | 15820 | 3.33 | +25.0% | 0 | tempo.ghost-strike x50 |
| `lineage-broadsword-baseline` | _control_ | energy | 8 | 19775 | 2.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 7 | 14357 | 2.33 | -12.5% | 0 | tempo.ghost-strike x54 |
| `lineage-rapier-affliction` | affliction | cadence | 6 | 17533 | 2.00 | -25.0% | 0 | affliction.bleed-pips x150 |
| `lineage-rapier-engagement` | engagement | cadence | 6 | 17433 | 2.00 | -25.0% | 0 | engagement.opening-flash x7 |
| `lineage-rapier-baseline` | _control_ | cadence | 8 | 18363 | 2.67 | — | 7 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 5 | 22900 | 1.67 | +0.0% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | cooldown | 5 | 22900 | 1.67 | +0.0% | 0 | control.frost-drag x16 |
| `lineage-hammer-engagement` | engagement | cooldown | 5 | 23000 | 1.67 | +0.0% | 0 | engagement.brace-sparks x7 |
| `lineage-hammer-baseline` | _control_ | cooldown | 5 | 22500 | 1.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 6 | 24950 | 2.00 | +0.0% | 0 | tempo.ghost-strike x56 |
| `lineage-axe-kill-chain` | kill-chain | dot | 8 | 17325 | 2.67 | +33.3% | 1 | kill-chain.kill-pulse x6 |
| `lineage-axe-empowered` | empowered | dot | 6 | 24950 | 2.00 | +0.0% | 0 | empowered.weak-point x8 |
| `lineage-axe-baseline` | _control_ | dot | 6 | 23783 | 2.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 8 | 16338 | 2.67 | +14.3% | 1 | affliction.venom-pips x171 |
| `lineage-dagger-control` | control | reload | 10 | 14440 | 3.33 | +42.9% | 1 | control.frost-drag x64 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 10 | 13810 | 3.33 | +42.9% | 1 | kill-chain.spread-arc x3 |
| `lineage-dagger-baseline` | _control_ | reload | 7 | 21486 | 2.33 | — | 2 | — |

### `node-t2-forest-03` — Canopy 70% / Pack 20% / Grove 10% (forest T2; shared by 1 authored node)

Dominant family **Canopy** drops `affliction`, punishes `control`. Authored Canopy 70% / Pack 20% / Grove 10%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 16 | 7944 | 5.33 | +23.1% | 2 | kill-chain.kill-pulse x13 |
| `lineage-broadsword-empowered` | empowered | energy | 13 | 9462 | 4.33 | +0.0% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-tempo` | tempo | energy | 13 | 9531 | 4.33 | +0.0% | 1 | tempo.ghost-strike x39 |
| `lineage-broadsword-baseline` | _control_ | energy | 13 | 9531 | 4.33 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | cadence | 13 | 8254 | 4.33 | +30.0% | 3 | tempo.ghost-strike x27 |
| `lineage-rapier-affliction` | affliction | cadence | 9 | 10767 | 3.00 | -10.0% | 1 | affliction.bleed-pips x86 |
| `lineage-rapier-engagement` | engagement | cadence | 18 | 6378 | 6.00 | +80.0% | 5 | engagement.opening-flash x7 |
| `lineage-rapier-baseline` | _control_ | cadence | 10 | 10700 | 3.33 | — | 2 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 8 | 14913 | 2.67 | +0.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | cooldown | 8 | 14913 | 2.67 | +0.0% | 0 | control.frost-drag x16 |
| `lineage-hammer-engagement` | engagement | cooldown | 8 | 14913 | 2.67 | +0.0% | 0 | engagement.brace-sparks x6 |
| `lineage-hammer-baseline` | _control_ | cooldown | 8 | 14913 | 2.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 9 | 10233 | 3.00 | +12.5% | 0 | tempo.ghost-strike x32 |
| `lineage-axe-kill-chain` | kill-chain | dot | 8 | 13575 | 2.67 | +0.0% | 0 | kill-chain.kill-pulse x8 |
| `lineage-axe-empowered` | empowered | dot | 9 | 10233 | 3.00 | +12.5% | 0 | empowered.weak-point x9 |
| `lineage-axe-baseline` | _control_ | dot | 8 | 13775 | 2.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 13 | 8877 | 4.33 | -7.1% | 1 | affliction.venom-pips x170 |
| `lineage-dagger-control` | control | reload | 17 | 7412 | 5.67 | +21.4% | 3 | control.frost-drag x39 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 13 | 7808 | 4.33 | -7.1% | 0 | kill-chain.spread-arc x2 |
| `lineage-dagger-baseline` | _control_ | reload | 14 | 8243 | 4.67 | — | 3 | — |

### `node-t2-forest-04` — Pack 45% / Grove 45% / Canopy 10% (forest T2; shared by 1 authored node)

Dominant family **Pack** drops `tempo`, punishes `empowered`. Authored Pack 45% / Grove 45% / Canopy 10%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 15 | 10120 | 5.00 | -11.8% | 3 | kill-chain.kill-pulse x5 |
| `lineage-broadsword-empowered` | empowered | energy | 17 | 8494 | 5.67 | +0.0% | 4 | empowered.weak-point x1 |
| `lineage-broadsword-tempo` | tempo | energy | 17 | 8300 | 5.67 | +0.0% | 4 | tempo.ghost-strike x11 |
| `lineage-broadsword-baseline` | _control_ | energy | 17 | 8300 | 5.67 | — | 4 | — |
| `lineage-rapier-tempo` | tempo | cadence | 9 | 12222 | 3.00 | -30.8% | 4 | tempo.ghost-strike x8 |
| `lineage-rapier-affliction` | affliction | cadence | 10 | 10630 | 3.33 | -23.1% | 3 | affliction.bleed-pips x23 |
| `lineage-rapier-engagement` | engagement | cadence | 18 | 6939 | 6.00 | +38.5% | 7 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | cadence | 13 | 10823 | 4.33 | — | 10 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 9 | 13856 | 3.00 | -10.0% | 1 | empowered.plating-crack x8 |
| `lineage-hammer-control` | control | cooldown | 9 | 13856 | 3.00 | -10.0% | 1 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | cooldown | 11 | 12409 | 3.67 | +10.0% | 1 | engagement.brace-sparks x3 |
| `lineage-hammer-baseline` | _control_ | cooldown | 10 | 12220 | 3.33 | — | 1 | — |
| `lineage-axe-tempo` | tempo | dot | 17 | 8671 | 5.67 | +0.0% | 8 | tempo.ghost-strike x7 |
| `lineage-axe-kill-chain` | kill-chain | dot | 15 | 9487 | 5.00 | -11.8% | 7 | kill-chain.kill-pulse x4 |
| `lineage-axe-empowered` | empowered | dot | 16 | 9438 | 5.33 | -5.9% | 8 | empowered.weak-point x1 |
| `lineage-axe-baseline` | _control_ | dot | 17 | 8671 | 5.67 | — | 8 | — |
| `lineage-dagger-affliction` | affliction | reload | 17 | 8641 | 5.67 | -5.6% | 5 | affliction.venom-pips x80 |
| `lineage-dagger-control` | control | reload | 19 | 8605 | 6.33 | +5.6% | 5 | control.frost-drag x26 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 14 | 10929 | 4.67 | -22.2% | 5 | kill-chain.spread-arc x6 |
| `lineage-dagger-baseline` | _control_ | reload | 18 | 8750 | 6.00 | — | 7 | — |

### `node-t2-forest-05` — Pack 34% / Grove 33% / Canopy 33% (forest T2; shared by 1 authored node)

Dominant family **Pack** drops `tempo`, punishes `empowered`. Authored Pack 34% / Grove 33% / Canopy 33%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 16 | 10038 | 5.33 | -11.1% | 3 | kill-chain.kill-pulse x8 |
| `lineage-broadsword-empowered` | empowered | energy | 19 | 8563 | 6.33 | +5.6% | 6 | empowered.weak-point x4 |
| `lineage-broadsword-tempo` | tempo | energy | 18 | 8550 | 6.00 | +0.0% | 5 | tempo.ghost-strike x25 |
| `lineage-broadsword-baseline` | _control_ | energy | 18 | 8550 | 6.00 | — | 5 | — |
| `lineage-rapier-tempo` | tempo | cadence | 15 | 7840 | 5.00 | +87.5% | 3 | tempo.ghost-strike x25 |
| `lineage-rapier-affliction` | affliction | cadence | 14 | 7993 | 4.67 | +75.0% | 3 | affliction.bleed-pips x70 |
| `lineage-rapier-engagement` | engagement | cadence | 13 | 8792 | 4.33 | +62.5% | 4 | engagement.opening-flash x4 |
| `lineage-rapier-baseline` | _control_ | cadence | 8 | 16963 | 2.67 | — | 7 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 11 | 11318 | 3.67 | +0.0% | 1 | empowered.plating-crack x9 |
| `lineage-hammer-control` | control | cooldown | 11 | 11318 | 3.67 | +0.0% | 1 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | cooldown | 11 | 11527 | 3.67 | +0.0% | 1 | engagement.brace-sparks x5 |
| `lineage-hammer-baseline` | _control_ | cooldown | 11 | 11318 | 3.67 | — | 1 | — |
| `lineage-axe-tempo` | tempo | dot | 18 | 8022 | 6.00 | +5.9% | 7 | tempo.ghost-strike x19 |
| `lineage-axe-kill-chain` | kill-chain | dot | 12 | 11275 | 4.00 | -29.4% | 2 | kill-chain.kill-pulse x9 |
| `lineage-axe-empowered` | empowered | dot | 20 | 7245 | 6.67 | +17.6% | 9 | empowered.weak-point x2 |
| `lineage-axe-baseline` | _control_ | dot | 17 | 8659 | 5.67 | — | 7 | — |
| `lineage-dagger-affliction` | affliction | reload | 16 | 9031 | 5.33 | +14.3% | 6 | affliction.venom-pips x115 |
| `lineage-dagger-control` | control | reload | 20 | 7790 | 6.67 | +42.9% | 4 | control.frost-drag x35 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 11 | 12955 | 3.67 | -21.4% | 3 | kill-chain.spread-arc x4 |
| `lineage-dagger-baseline` | _control_ | reload | 14 | 9964 | 4.67 | — | 5 | — |

### `node-t2-plains-01` — Herd 70% / Swarm 20% / Sky 10% (plains T2; shared by 1 authored node)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Herd 70% / Swarm 20% / Sky 10%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 21 | 5424 | 7.00 | +5.0% | 1 | kill-chain.kill-pulse x14 |
| `lineage-broadsword-empowered` | empowered | energy | 20 | 6325 | 6.67 | +0.0% | 3 | empowered.weak-point x3 |
| `lineage-broadsword-tempo` | tempo | energy | 20 | 6325 | 6.67 | +0.0% | 3 | tempo.ghost-strike x20 |
| `lineage-broadsword-baseline` | _control_ | energy | 20 | 6380 | 6.67 | — | 3 | — |
| `lineage-rapier-tempo` | tempo | cadence | 22 | 5218 | 7.33 | +29.4% | 2 | tempo.ghost-strike x39 |
| `lineage-rapier-affliction` | affliction | cadence | 22 | 4914 | 7.33 | +29.4% | 1 | affliction.bleed-pips x129 |
| `lineage-rapier-engagement` | engagement | cadence | 22 | 5250 | 7.33 | +29.4% | 1 | engagement.opening-flash x7 |
| `lineage-rapier-baseline` | _control_ | cadence | 17 | 7159 | 5.67 | — | 3 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 16 | 8231 | 5.33 | -5.9% | 3 | empowered.plating-crack x12 |
| `lineage-hammer-control` | control | cooldown | 16 | 7863 | 5.33 | -5.9% | 3 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | cooldown | 24 | 5275 | 8.00 | +41.2% | 2 | engagement.brace-sparks x6 |
| `lineage-hammer-baseline` | _control_ | cooldown | 17 | 7524 | 5.67 | — | 3 | — |
| `lineage-axe-tempo` | tempo | dot | 21 | 5452 | 7.00 | +0.0% | 0 | tempo.ghost-strike x41 |
| `lineage-axe-kill-chain` | kill-chain | dot | 22 | 6027 | 7.33 | +4.8% | 4 | kill-chain.kill-pulse x9 |
| `lineage-axe-empowered` | empowered | dot | 21 | 5452 | 7.00 | +0.0% | 0 | empowered.weak-point x11 |
| `lineage-axe-baseline` | _control_ | dot | 21 | 5438 | 7.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 15 | 8260 | 5.00 | -16.7% | 3 | affliction.venom-pips x117 |
| `lineage-dagger-control` | control | reload | 27 | 5170 | 9.00 | +50.0% | 1 | control.frost-drag x68 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 24 | 5113 | 8.00 | +33.3% | 2 | kill-chain.spread-arc x9 |
| `lineage-dagger-baseline` | _control_ | reload | 18 | 6894 | 6.00 | — | 2 | — |
| `frame-cadence-light` | _frame light_ | cadence | 27 | 4033 | 9.00 | — | 1 | — |
| `frame-cadence-balanced` | _frame balanced_ | cadence | 17 | 7159 | 5.67 | — | 3 | — |
| `frame-cadence-heavy` | _frame heavy_ | cadence | 24 | 4567 | 8.00 | — | 1 | — |
| `frame-cooldown-light` | _frame light_ | cooldown | 21 | 5810 | 7.00 | — | 1 | — |
| `frame-cooldown-balanced` | _frame balanced_ | cooldown | 13 | 10415 | 4.33 | — | 1 | — |
| `frame-cooldown-heavy` | _frame heavy_ | cooldown | 17 | 7524 | 5.67 | — | 3 | — |
| `frame-reload-light` | _frame light_ | reload | 25 | 5308 | 8.33 | — | 2 | — |
| `frame-reload-balanced` | _frame balanced_ | reload | 20 | 6335 | 6.67 | — | 1 | — |
| `frame-reload-heavy` | _frame heavy_ | reload | 18 | 6894 | 6.00 | — | 2 | — |
| `frame-energy-light` | _frame light_ | energy | 14 | 9586 | 4.67 | — | 4 | — |
| `frame-energy-balanced` | _frame balanced_ | energy | 16 | 8994 | 5.33 | — | 5 | — |
| `frame-energy-heavy` | _frame heavy_ | energy | 20 | 6380 | 6.67 | — | 3 | — |
| `frame-dot-light` | _frame light_ | dot | 22 | 5364 | 7.33 | — | 0 | — |
| `frame-dot-balanced` | _frame balanced_ | dot | 21 | 5438 | 7.00 | — | 0 | — |
| `frame-dot-heavy` | _frame heavy_ | dot | 18 | 6494 | 6.00 | — | 0 | — |
| `frame-summoner-light` | _frame light_ | summoner | 30 | 2293 | 10.00 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | summoner | 18 | 5261 | 6.00 | — | 1 | — |
| `frame-summoner-heavy` | _frame heavy_ | summoner | 36 | 2514 | 12.00 | — | 0 | — |

### `node-t2-plains-02` — Swarm 70% / Sky 20% / Herd 10% (plains T2; shared by 1 authored node)

Dominant family **Swarm** drops `tempo`, punishes `empowered`. Authored Swarm 70% / Sky 20% / Herd 10%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 32 | 3500 | 10.67 | +6.7% | 1 | kill-chain.kill-pulse x19 |
| `lineage-broadsword-empowered` | empowered | energy | 30 | 4370 | 10.00 | +0.0% | 3 | empowered.weak-point x2 |
| `lineage-broadsword-tempo` | tempo | energy | 30 | 4553 | 10.00 | +0.0% | 3 | tempo.ghost-strike x18 |
| `lineage-broadsword-baseline` | _control_ | energy | 30 | 4173 | 10.00 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | cadence | 34 | 2559 | 11.33 | +6.3% | 0 | tempo.ghost-strike x45 |
| `lineage-rapier-affliction` | affliction | cadence | 32 | 3103 | 10.67 | +0.0% | 0 | affliction.bleed-pips x136 |
| `lineage-rapier-engagement` | engagement | cadence | 33 | 2727 | 11.00 | +3.1% | 0 | engagement.opening-flash x10 |
| `lineage-rapier-baseline` | _control_ | cadence | 32 | 3316 | 10.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 32 | 3216 | 10.67 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | cooldown | 32 | 3216 | 10.67 | +0.0% | 0 | control.frost-drag x15 |
| `lineage-hammer-engagement` | engagement | cooldown | 31 | 3284 | 10.33 | -3.1% | 0 | engagement.brace-sparks x8 |
| `lineage-hammer-baseline` | _control_ | cooldown | 32 | 3038 | 10.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 31 | 4219 | 10.33 | +0.0% | 4 | tempo.ghost-strike x12 |
| `lineage-axe-kill-chain` | kill-chain | dot | 33 | 3736 | 11.00 | +6.5% | 2 | kill-chain.kill-pulse x6 |
| `lineage-axe-empowered` | empowered | dot | 29 | 4586 | 9.67 | -6.5% | 5 | empowered.weak-point x1 |
| `lineage-axe-baseline` | _control_ | dot | 31 | 4219 | 10.33 | — | 4 | — |
| `lineage-dagger-affliction` | affliction | reload | 30 | 4100 | 10.00 | -3.2% | 1 | affliction.venom-pips x121 |
| `lineage-dagger-control` | control | reload | 33 | 3967 | 11.00 | +6.5% | 2 | control.frost-drag x51 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 28 | 4507 | 9.33 | -9.7% | 1 | kill-chain.spread-arc x21 |
| `lineage-dagger-baseline` | _control_ | reload | 31 | 4216 | 10.33 | — | 1 | — |

### `node-t2-plains-03` — Sky 70% / Herd 20% / Swarm 10% (plains T2; shared by 1 authored node)

Dominant family **Sky** drops `engagement`, punishes `affliction`. Authored Sky 70% / Herd 20% / Swarm 10%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 22 | 7105 | 7.33 | +4.8% | 4 | kill-chain.kill-pulse x2 |
| `lineage-broadsword-empowered` | empowered | energy | 24 | 6621 | 8.00 | +14.3% | 8 | empowered.weak-point x2 |
| `lineage-broadsword-tempo` | tempo | energy | 21 | 7405 | 7.00 | +0.0% | 7 | tempo.ghost-strike x14 |
| `lineage-broadsword-baseline` | _control_ | energy | 21 | 7405 | 7.00 | — | 7 | — |
| `lineage-rapier-tempo` | tempo | cadence | 26 | 4812 | 8.67 | +30.0% | 2 | tempo.ghost-strike x37 |
| `lineage-rapier-affliction` | affliction | cadence | 17 | 7894 | 5.67 | -15.0% | 4 | affliction.bleed-pips x48 |
| `lineage-rapier-engagement` | engagement | cadence | 23 | 5930 | 7.67 | +15.0% | 3 | engagement.opening-flash x6 |
| `lineage-rapier-baseline` | _control_ | cadence | 20 | 6510 | 6.67 | — | 3 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 12 | 11375 | 4.00 | +0.0% | 1 | empowered.plating-crack x9 |
| `lineage-hammer-control` | control | cooldown | 12 | 11375 | 4.00 | +0.0% | 1 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | cooldown | 16 | 8019 | 5.33 | +33.3% | 1 | engagement.brace-sparks x5 |
| `lineage-hammer-baseline` | _control_ | cooldown | 12 | 11533 | 4.00 | — | 1 | — |
| `lineage-axe-tempo` | tempo | dot | 14 | 10243 | 4.67 | +0.0% | 3 | tempo.ghost-strike x23 |
| `lineage-axe-kill-chain` | kill-chain | dot | 15 | 9887 | 5.00 | +7.1% | 7 | kill-chain.kill-pulse x5 |
| `lineage-axe-empowered` | empowered | dot | 16 | 8725 | 5.33 | +14.3% | 2 | empowered.weak-point x8 |
| `lineage-axe-baseline` | _control_ | dot | 14 | 10243 | 4.67 | — | 3 | — |
| `lineage-dagger-affliction` | affliction | reload | 20 | 7460 | 6.67 | +42.9% | 4 | affliction.venom-pips x62 |
| `lineage-dagger-control` | control | reload | 18 | 8128 | 6.00 | +28.6% | 4 | control.frost-drag x21 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 13 | 11931 | 4.33 | -7.1% | 5 | kill-chain.spread-arc x2 |
| `lineage-dagger-baseline` | _control_ | reload | 14 | 10586 | 4.67 | — | 5 | — |

### `node-t2-plains-04` — Herd 45% / Swarm 45% / Sky 10% (plains T2; shared by 1 authored node)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Herd 45% / Swarm 45% / Sky 10%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 21 | 5938 | 7.00 | -25.0% | 3 | kill-chain.kill-pulse x10 |
| `lineage-broadsword-empowered` | empowered | energy | 35 | 3786 | 11.67 | +25.0% | 3 | empowered.weak-point x1 |
| `lineage-broadsword-tempo` | tempo | energy | 28 | 5104 | 9.33 | +0.0% | 6 | tempo.ghost-strike x12 |
| `lineage-broadsword-baseline` | _control_ | energy | 28 | 5104 | 9.33 | — | 6 | — |
| `lineage-rapier-tempo` | tempo | cadence | 26 | 4277 | 8.67 | +13.0% | 2 | tempo.ghost-strike x34 |
| `lineage-rapier-affliction` | affliction | cadence | 24 | 4896 | 8.00 | +4.3% | 3 | affliction.bleed-pips x88 |
| `lineage-rapier-engagement` | engagement | cadence | 25 | 4412 | 8.33 | +8.7% | 2 | engagement.opening-flash x6 |
| `lineage-rapier-baseline` | _control_ | cadence | 23 | 5335 | 7.67 | — | 5 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 28 | 4086 | 9.33 | +55.6% | 1 | empowered.plating-crack x8 |
| `lineage-hammer-control` | control | cooldown | 29 | 4176 | 9.67 | +61.1% | 1 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | cooldown | 24 | 5100 | 8.00 | +33.3% | 1 | engagement.brace-sparks x6 |
| `lineage-hammer-baseline` | _control_ | cooldown | 18 | 7106 | 6.00 | — | 1 | — |
| `lineage-axe-tempo` | tempo | dot | 24 | 5892 | 8.00 | +0.0% | 6 | tempo.ghost-strike x8 |
| `lineage-axe-kill-chain` | kill-chain | dot | 25 | 5276 | 8.33 | +4.2% | 3 | kill-chain.kill-pulse x11 |
| `lineage-axe-empowered` | empowered | dot | 24 | 5892 | 8.00 | +0.0% | 6 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | dot | 24 | 5892 | 8.00 | — | 6 | — |
| `lineage-dagger-affliction` | affliction | reload | 27 | 5133 | 9.00 | +28.6% | 3 | affliction.venom-pips x120 |
| `lineage-dagger-control` | control | reload | 28 | 4732 | 9.33 | +33.3% | 3 | control.frost-drag x30 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 21 | 7314 | 7.00 | +0.0% | 6 | kill-chain.spread-arc x3 |
| `lineage-dagger-baseline` | _control_ | reload | 21 | 6524 | 7.00 | — | 5 | — |

### `node-t2-plains-05` — Herd 34% / Swarm 33% / Sky 33% (plains T2; shared by 1 authored node)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Herd 34% / Swarm 33% / Sky 33%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 19 | 6932 | 6.33 | -13.6% | 3 | — |
| `lineage-broadsword-empowered` | empowered | energy | 22 | 6136 | 7.33 | +0.0% | 4 | empowered.weak-point x2 |
| `lineage-broadsword-tempo` | tempo | energy | 22 | 6136 | 7.33 | +0.0% | 4 | tempo.ghost-strike x17 |
| `lineage-broadsword-baseline` | _control_ | energy | 22 | 6136 | 7.33 | — | 4 | — |
| `lineage-rapier-tempo` | tempo | cadence | 24 | 4992 | 8.00 | +20.0% | 2 | tempo.ghost-strike x36 |
| `lineage-rapier-affliction` | affliction | cadence | 20 | 6170 | 6.67 | +0.0% | 1 | affliction.bleed-pips x104 |
| `lineage-rapier-engagement` | engagement | cadence | 20 | 6025 | 6.67 | +0.0% | 2 | engagement.opening-flash x5 |
| `lineage-rapier-baseline` | _control_ | cadence | 20 | 7050 | 6.67 | — | 3 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 17 | 7600 | 5.67 | -10.5% | 2 | empowered.plating-crack x3 |
| `lineage-hammer-control` | control | cooldown | 17 | 7471 | 5.67 | -10.5% | 2 | control.frost-drag x4 |
| `lineage-hammer-engagement` | engagement | cooldown | 20 | 5555 | 6.67 | +5.3% | 2 | engagement.brace-sparks x2 |
| `lineage-hammer-baseline` | _control_ | cooldown | 19 | 6542 | 6.33 | — | 3 | — |
| `lineage-axe-tempo` | tempo | dot | 15 | 8647 | 5.00 | +0.0% | 4 | tempo.ghost-strike x18 |
| `lineage-axe-kill-chain` | kill-chain | dot | 21 | 6095 | 7.00 | +40.0% | 3 | kill-chain.kill-pulse x8 |
| `lineage-axe-empowered` | empowered | dot | 15 | 8647 | 5.00 | +0.0% | 4 | empowered.weak-point x4 |
| `lineage-axe-baseline` | _control_ | dot | 15 | 8647 | 5.00 | — | 4 | — |
| `lineage-dagger-affliction` | affliction | reload | 16 | 7400 | 5.33 | -20.0% | 2 | affliction.venom-pips x108 |
| `lineage-dagger-control` | control | reload | 20 | 6050 | 6.67 | +0.0% | 2 | control.frost-drag x36 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 24 | 5850 | 8.00 | +20.0% | 4 | — |
| `lineage-dagger-baseline` | _control_ | reload | 20 | 7030 | 6.67 | — | 2 | — |

### `node-t2-mountain-01` — Crag 70% / Ridge 20% / Hopper 10% (mountain T2; shared by 1 authored node)

Dominant family **Crag** drops `empowered`, punishes `affliction`. Authored Crag 70% / Ridge 20% / Hopper 10%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 6 | 22383 | 2.00 | -14.3% | 0 | kill-chain.kill-pulse x6 |
| `lineage-broadsword-empowered` | empowered | energy | 6 | 22517 | 2.00 | -14.3% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-tempo` | tempo | energy | 7 | 18371 | 2.33 | +0.0% | 0 | tempo.ghost-strike x39 |
| `lineage-broadsword-baseline` | _control_ | energy | 7 | 18500 | 2.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 7 | 20600 | 2.33 | +16.7% | 1 | tempo.ghost-strike x33 |
| `lineage-rapier-affliction` | affliction | cadence | 7 | 20771 | 2.33 | +16.7% | 1 | affliction.bleed-pips x95 |
| `lineage-rapier-engagement` | engagement | cadence | 7 | 20357 | 2.33 | +16.7% | 1 | engagement.opening-flash x4 |
| `lineage-rapier-baseline` | _control_ | cadence | 6 | 24767 | 2.00 | — | 1 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 7 | 17771 | 2.33 | +0.0% | 1 | empowered.plating-crack x13 |
| `lineage-hammer-control` | control | cooldown | 8 | 15875 | 2.67 | +14.3% | 1 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | cooldown | 8 | 15663 | 2.67 | +14.3% | 1 | engagement.brace-sparks x6 |
| `lineage-hammer-baseline` | _control_ | cooldown | 7 | 19057 | 2.33 | — | 1 | — |
| `lineage-axe-tempo` | tempo | dot | 3 | 53867 | 1.00 | +50.0% | 2 | tempo.ghost-strike x29 |
| `lineage-axe-kill-chain` | kill-chain | dot | 3 | 51100 | 1.00 | +50.0% | 3 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | dot | 2 | 79200 | 0.67 | +0.0% | 3 | empowered.weak-point x4 |
| `lineage-axe-baseline` | _control_ | dot | 2 | 80450 | 0.67 | — | 2 | — |
| `lineage-dagger-affliction` | affliction | reload | 7 | 17700 | 2.33 | +16.7% | 0 | affliction.venom-pips x194 |
| `lineage-dagger-control` | control | reload | 7 | 16743 | 2.33 | +16.7% | 0 | control.frost-drag x60 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 6 | 21383 | 2.00 | +0.0% | 1 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | reload | 6 | 20100 | 2.00 | — | 0 | — |
| `frame-cadence-light` | _frame light_ | cadence | 6 | 24633 | 2.00 | — | 1 | — |
| `frame-cadence-balanced` | _frame balanced_ | cadence | 6 | 24767 | 2.00 | — | 1 | — |
| `frame-cadence-heavy` | _frame heavy_ | cadence | 6 | 24650 | 2.00 | — | 0 | — |
| `frame-cooldown-light` | _frame light_ | cooldown | 5 | 31960 | 1.67 | — | 1 | — |
| `frame-cooldown-balanced` | _frame balanced_ | cooldown | 3 | 53967 | 1.00 | — | 1 | — |
| `frame-cooldown-heavy` | _frame heavy_ | cooldown | 7 | 19057 | 2.33 | — | 1 | — |
| `frame-reload-light` | _frame light_ | reload | 5 | 31560 | 1.67 | — | 0 | — |
| `frame-reload-balanced` | _frame balanced_ | reload | 7 | 18200 | 2.33 | — | 0 | — |
| `frame-reload-heavy` | _frame heavy_ | reload | 6 | 20100 | 2.00 | — | 0 | — |
| `frame-energy-light` | _frame light_ | energy | 6 | 25267 | 2.00 | — | 1 | — |
| `frame-energy-balanced` | _frame balanced_ | energy | 4 | 38350 | 1.33 | — | 1 | — |
| `frame-energy-heavy` | _frame heavy_ | energy | 7 | 18500 | 2.33 | — | 0 | — |
| `frame-dot-light` | _frame light_ | dot | 6 | 21200 | 2.00 | — | 2 | — |
| `frame-dot-balanced` | _frame balanced_ | dot | 2 | 80450 | 0.67 | — | 2 | — |
| `frame-dot-heavy` | _frame heavy_ | dot | 4 | 35550 | 1.33 | — | 1 | — |
| `frame-summoner-light` | _frame light_ | summoner | 6 | 0 | 2.00 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | summoner | 4 | 0 | 1.33 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | summoner | 11 | 3691 | 3.67 | — | 0 | — |

### `node-t2-mountain-02` — Ridge 70% / Hopper 20% / Crag 10% (mountain T2; shared by 1 authored node)

Dominant family **Ridge** drops `control`, punishes `kill-chain`. Authored Ridge 70% / Hopper 20% / Crag 10%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 7 | 16700 | 2.33 | -12.5% | 1 | kill-chain.kill-pulse x6 |
| `lineage-broadsword-empowered` | empowered | energy | 8 | 13900 | 2.67 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-tempo` | tempo | energy | 8 | 13900 | 2.67 | +0.0% | 0 | tempo.ghost-strike x33 |
| `lineage-broadsword-baseline` | _control_ | energy | 8 | 13900 | 2.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 7 | 16757 | 2.33 | +0.0% | 0 | tempo.ghost-strike x47 |
| `lineage-rapier-affliction` | affliction | cadence | 7 | 17014 | 2.33 | +0.0% | 0 | affliction.bleed-pips x131 |
| `lineage-rapier-engagement` | engagement | cadence | 7 | 16529 | 2.33 | +0.0% | 0 | engagement.opening-flash x8 |
| `lineage-rapier-baseline` | _control_ | cadence | 7 | 16871 | 2.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 6 | 21283 | 2.00 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | cooldown | 6 | 21283 | 2.00 | +0.0% | 0 | control.frost-drag x15 |
| `lineage-hammer-engagement` | engagement | cooldown | 5 | 25520 | 1.67 | -16.7% | 0 | engagement.brace-sparks x7 |
| `lineage-hammer-baseline` | _control_ | cooldown | 6 | 21283 | 2.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 6 | 18633 | 2.00 | +20.0% | 0 | tempo.ghost-strike x36 |
| `lineage-axe-kill-chain` | kill-chain | dot | 5 | 25120 | 1.67 | +0.0% | 1 | kill-chain.kill-pulse x4 |
| `lineage-axe-empowered` | empowered | dot | 6 | 18683 | 2.00 | +20.0% | 0 | empowered.weak-point x7 |
| `lineage-axe-baseline` | _control_ | dot | 5 | 21900 | 1.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 8 | 12738 | 2.67 | +33.3% | 0 | affliction.venom-pips x162 |
| `lineage-dagger-control` | control | reload | 7 | 15057 | 2.33 | +16.7% | 1 | control.frost-drag x49 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 7 | 13514 | 2.33 | +16.7% | 1 | — |
| `lineage-dagger-baseline` | _control_ | reload | 6 | 20133 | 2.00 | — | 1 | — |

### `node-t2-mountain-03` — Hopper 70% / Crag 20% / Ridge 10% (mountain T2; shared by 1 authored node)

Dominant family **Hopper** drops `tempo`, punishes `empowered`. Authored Hopper 70% / Crag 20% / Ridge 10%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 7 | 21214 | 2.33 | -22.2% | 6 | kill-chain.kill-pulse x3 |
| `lineage-broadsword-empowered` | empowered | energy | 9 | 15222 | 3.00 | +0.0% | 5 | empowered.weak-point x3 |
| `lineage-broadsword-tempo` | tempo | energy | 9 | 15222 | 3.00 | +0.0% | 5 | tempo.ghost-strike x20 |
| `lineage-broadsword-baseline` | _control_ | energy | 9 | 15222 | 3.00 | — | 5 | — |
| `lineage-rapier-tempo` | tempo | cadence | 9 | 15678 | 3.00 | +50.0% | 1 | tempo.ghost-strike x50 |
| `lineage-rapier-affliction` | affliction | cadence | 9 | 14267 | 3.00 | +50.0% | 2 | affliction.bleed-pips x63 |
| `lineage-rapier-engagement` | engagement | cadence | 9 | 14267 | 3.00 | +50.0% | 2 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | cadence | 6 | 24683 | 2.00 | — | 2 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 7 | 19871 | 2.33 | +16.7% | 1 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | cooldown | 10 | 13760 | 3.33 | +66.7% | 0 | control.frost-drag x17 |
| `lineage-hammer-engagement` | engagement | cooldown | 9 | 15433 | 3.00 | +50.0% | 1 | engagement.brace-sparks x6 |
| `lineage-hammer-baseline` | _control_ | cooldown | 6 | 23400 | 2.00 | — | 1 | — |
| `lineage-axe-tempo` | tempo | dot | 2 | 78950 | 0.67 | -60.0% | 9 | tempo.ghost-strike x16 |
| `lineage-axe-kill-chain` | kill-chain | dot | 7 | 21543 | 2.33 | +40.0% | 7 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | dot | 2 | 78950 | 0.67 | -60.0% | 9 | empowered.weak-point x2 |
| `lineage-axe-baseline` | _control_ | dot | 5 | 28240 | 1.67 | — | 6 | — |
| `lineage-dagger-affliction` | affliction | reload | 7 | 20871 | 2.33 | +16.7% | 7 | affliction.venom-pips x65 |
| `lineage-dagger-control` | control | reload | 5 | 28380 | 1.67 | -16.7% | 3 | control.frost-drag x37 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 8 | 15863 | 2.67 | +33.3% | 3 | — |
| `lineage-dagger-baseline` | _control_ | reload | 6 | 23467 | 2.00 | — | 6 | — |

### `node-t2-mountain-04` — Crag 45% / Ridge 45% / Hopper 10% (mountain T2; shared by 1 authored node)

Dominant family **Crag** drops `empowered`, punishes `affliction`. Authored Crag 45% / Ridge 45% / Hopper 10%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 8 | 17613 | 2.67 | +33.3% | 1 | kill-chain.kill-pulse x7 |
| `lineage-broadsword-empowered` | empowered | energy | 5 | 27020 | 1.67 | -16.7% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-tempo` | tempo | energy | 6 | 22850 | 2.00 | +0.0% | 0 | tempo.ghost-strike x42 |
| `lineage-broadsword-baseline` | _control_ | energy | 6 | 22850 | 2.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 4 | 36150 | 1.33 | +0.0% | 0 | tempo.ghost-strike x59 |
| `lineage-rapier-affliction` | affliction | cadence | 5 | 27800 | 1.67 | +25.0% | 0 | affliction.bleed-pips x149 |
| `lineage-rapier-engagement` | engagement | cadence | 4 | 35025 | 1.33 | +0.0% | 0 | engagement.opening-flash x6 |
| `lineage-rapier-baseline` | _control_ | cadence | 4 | 36250 | 1.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 5 | 27100 | 1.67 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | cooldown | 4 | 35725 | 1.33 | -20.0% | 0 | control.frost-drag x18 |
| `lineage-hammer-engagement` | engagement | cooldown | 4 | 35800 | 1.33 | -20.0% | 0 | engagement.brace-sparks x7 |
| `lineage-hammer-baseline` | _control_ | cooldown | 5 | 27700 | 1.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 5 | 27340 | 1.67 | +0.0% | 0 | tempo.ghost-strike x44 |
| `lineage-axe-kill-chain` | kill-chain | dot | 4 | 36850 | 1.33 | -20.0% | 2 | kill-chain.kill-pulse x2 |
| `lineage-axe-empowered` | empowered | dot | 5 | 27340 | 1.67 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-axe-baseline` | _control_ | dot | 5 | 27240 | 1.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 7 | 18157 | 2.33 | +0.0% | 1 | affliction.venom-pips x169 |
| `lineage-dagger-control` | control | reload | 7 | 16443 | 2.33 | +0.0% | 1 | control.frost-drag x52 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 5 | 25060 | 1.67 | -28.6% | 1 | — |
| `lineage-dagger-baseline` | _control_ | reload | 7 | 16743 | 2.33 | — | 0 | — |

### `node-t2-mountain-05` — Crag 34% / Ridge 33% / Hopper 33% (mountain T2; shared by 1 authored node)

Dominant family **Crag** drops `empowered`, punishes `affliction`. Authored Crag 34% / Ridge 33% / Hopper 33%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 4 | 40075 | 1.33 | -20.0% | 2 | kill-chain.kill-pulse x4 |
| `lineage-broadsword-empowered` | empowered | energy | 5 | 26380 | 1.67 | +0.0% | 1 | empowered.weak-point x7 |
| `lineage-broadsword-tempo` | tempo | energy | 5 | 30660 | 1.67 | +0.0% | 0 | tempo.ghost-strike x46 |
| `lineage-broadsword-baseline` | _control_ | energy | 5 | 30320 | 1.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 4 | 39100 | 1.33 | +33.3% | 0 | tempo.ghost-strike x64 |
| `lineage-rapier-affliction` | affliction | cadence | 4 | 38675 | 1.33 | +33.3% | 0 | affliction.bleed-pips x166 |
| `lineage-rapier-engagement` | engagement | cadence | 5 | 30580 | 1.67 | +66.7% | 0 | engagement.opening-flash x3 |
| `lineage-rapier-baseline` | _control_ | cadence | 3 | 51100 | 1.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 4 | 38300 | 1.33 | +0.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | cooldown | 4 | 38725 | 1.33 | +0.0% | 0 | control.frost-drag x19 |
| `lineage-hammer-engagement` | engagement | cooldown | 4 | 38825 | 1.33 | +0.0% | 0 | engagement.brace-sparks x7 |
| `lineage-hammer-baseline` | _control_ | cooldown | 4 | 38675 | 1.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 6 | 20233 | 2.00 | +20.0% | 0 | tempo.ghost-strike x41 |
| `lineage-axe-kill-chain` | kill-chain | dot | 4 | 32575 | 1.33 | -20.0% | 0 | kill-chain.kill-pulse x4 |
| `lineage-axe-empowered` | empowered | dot | 6 | 20233 | 2.00 | +20.0% | 0 | empowered.weak-point x9 |
| `lineage-axe-baseline` | _control_ | dot | 5 | 23940 | 1.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 4 | 35225 | 1.33 | -20.0% | 0 | affliction.venom-pips x226 |
| `lineage-dagger-control` | control | reload | 7 | 20529 | 2.33 | +40.0% | 0 | control.frost-drag x77 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 4 | 33950 | 1.33 | -20.0% | 3 | — |
| `lineage-dagger-baseline` | _control_ | reload | 5 | 25940 | 1.67 | — | 0 | — |

### `node-t2-cave-01` — Brood 70% / Brute 20% / Deep 10% (cave T2; shared by 1 authored node)

Dominant family **Brood** drops `affliction`, punishes `tempo`. Authored Brood 70% / Brute 20% / Deep 10%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 8 | 14075 | 2.67 | +33.3% | 3 | kill-chain.kill-pulse x1 |
| `lineage-broadsword-empowered` | empowered | energy | 7 | 17029 | 2.33 | +16.7% | 3 | empowered.weak-point x3 |
| `lineage-broadsword-tempo` | tempo | energy | 6 | 20200 | 2.00 | +0.0% | 4 | tempo.ghost-strike x22 |
| `lineage-broadsword-baseline` | _control_ | energy | 6 | 20200 | 2.00 | — | 4 | — |
| `lineage-rapier-tempo` | tempo | cadence | 8 | 8950 | 2.67 | — | 1 | tempo.ghost-strike x30 |
| `lineage-rapier-affliction` | affliction | cadence | 8 | 9425 | 2.67 | — | 1 | affliction.bleed-pips x85 |
| `lineage-rapier-engagement` | engagement | cadence | 8 | 8725 | 2.67 | — | 1 | engagement.opening-flash x7 |
| `lineage-rapier-baseline` | _control_ | cadence | 0 | — | 0.00 | — | 17 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 7 | 9386 | 2.33 | +0.0% | 0 | empowered.plating-crack x8 |
| `lineage-hammer-control` | control | cooldown | 8 | 7700 | 2.67 | +14.3% | 0 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | cooldown | 8 | 7700 | 2.67 | +14.3% | 0 | engagement.brace-sparks x8 |
| `lineage-hammer-baseline` | _control_ | cooldown | 7 | 9386 | 2.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 6 | 17400 | 2.00 | +0.0% | 3 | tempo.ghost-strike x12 |
| `lineage-axe-kill-chain` | kill-chain | dot | 4 | 28825 | 1.33 | -33.3% | 5 | kill-chain.kill-pulse x2 |
| `lineage-axe-empowered` | empowered | dot | 6 | 17183 | 2.00 | +0.0% | 3 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | dot | 6 | 17400 | 2.00 | — | 3 | — |
| `lineage-dagger-affliction` | affliction | reload | 7 | 12714 | 2.33 | -12.5% | 3 | affliction.venom-pips x73 |
| `lineage-dagger-control` | control | reload | 7 | 11814 | 2.33 | -12.5% | 2 | control.frost-drag x24 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 8 | 12450 | 2.67 | +0.0% | 6 | — |
| `lineage-dagger-baseline` | _control_ | reload | 8 | 12488 | 2.67 | — | 4 | — |
| `frame-cadence-light` | _frame light_ | cadence | 8 | 8500 | 2.67 | — | 1 | — |
| `frame-cadence-balanced` | _frame balanced_ | cadence | 0 | — | 0.00 | — | 17 | — |
| `frame-cadence-heavy` | _frame heavy_ | cadence | 10 | 10180 | 3.33 | — | 0 | — |
| `frame-cooldown-light` | _frame light_ | cooldown | 1 | 139800 | 0.33 | — | 14 | — |
| `frame-cooldown-balanced` | _frame balanced_ | cooldown | 5 | 26080 | 1.67 | — | 7 | — |
| `frame-cooldown-heavy` | _frame heavy_ | cooldown | 7 | 9386 | 2.33 | — | 0 | — |
| `frame-reload-light` | _frame light_ | reload | 4 | 32075 | 1.33 | — | 12 | — |
| `frame-reload-balanced` | _frame balanced_ | reload | 8 | 16225 | 2.67 | — | 10 | — |
| `frame-reload-heavy` | _frame heavy_ | reload | 8 | 12488 | 2.67 | — | 4 | — |
| `frame-energy-light` | _frame light_ | energy | 1 | 145700 | 0.33 | — | 15 | — |
| `frame-energy-balanced` | _frame balanced_ | energy | 5 | 25040 | 1.67 | — | 8 | — |
| `frame-energy-heavy` | _frame heavy_ | energy | 6 | 20200 | 2.00 | — | 4 | — |
| `frame-dot-light` | _frame light_ | dot | 3 | 44667 | 1.00 | — | 8 | — |
| `frame-dot-balanced` | _frame balanced_ | dot | 6 | 17400 | 2.00 | — | 3 | — |
| `frame-dot-heavy` | _frame heavy_ | dot | 6 | 17200 | 2.00 | — | 3 | — |
| `frame-summoner-light` | _frame light_ | summoner | 9 | 0 | 3.00 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | summoner | 9 | 0 | 3.00 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | summoner | 13 | 3823 | 4.33 | — | 0 | — |

### `node-t2-cave-02` — Brute 70% / Deep 20% / Brood 10% (cave T2; shared by 1 authored node)

Dominant family **Brute** drops `empowered`, punishes `affliction`. Authored Brute 70% / Deep 20% / Brood 10%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 4 | 35400 | 1.33 | +100.0% | 1 | kill-chain.kill-pulse x3 |
| `lineage-broadsword-empowered` | empowered | energy | 2 | 75550 | 0.67 | +0.0% | 1 | empowered.weak-point x8 |
| `lineage-broadsword-tempo` | tempo | energy | 2 | 77350 | 0.67 | +0.0% | 0 | tempo.ghost-strike x47 |
| `lineage-broadsword-baseline` | _control_ | energy | 2 | 77350 | 0.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 3 | 43067 | 1.00 | +0.0% | 7 | tempo.ghost-strike x14 |
| `lineage-rapier-affliction` | affliction | cadence | 3 | 42633 | 1.00 | +0.0% | 7 | affliction.bleed-pips x38 |
| `lineage-rapier-engagement` | engagement | cadence | 3 | 42500 | 1.00 | +0.0% | 7 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | cadence | 3 | 45667 | 1.00 | — | 8 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 1 | 145700 | 0.33 | +0.0% | 4 | empowered.plating-crack x5 |
| `lineage-hammer-control` | control | cooldown | 1 | 145700 | 0.33 | +0.0% | 4 | control.frost-drag x6 |
| `lineage-hammer-engagement` | engagement | cooldown | 1 | 145700 | 0.33 | +0.0% | 4 | engagement.brace-sparks x4 |
| `lineage-hammer-baseline` | _control_ | cooldown | 1 | 145700 | 0.33 | — | 4 | — |
| `lineage-axe-tempo` | tempo | dot | 2 | 68550 | 0.67 | +0.0% | 8 | tempo.ghost-strike x10 |
| `lineage-axe-kill-chain` | kill-chain | dot | 1 | 155900 | 0.33 | -50.0% | 7 | — |
| `lineage-axe-empowered` | empowered | dot | 2 | 68550 | 0.67 | +0.0% | 8 | empowered.weak-point x2 |
| `lineage-axe-baseline` | _control_ | dot | 2 | 68550 | 0.67 | — | 8 | — |
| `lineage-dagger-affliction` | affliction | reload | 3 | 43767 | 1.00 | -40.0% | 8 | affliction.venom-pips x40 |
| `lineage-dagger-control` | control | reload | 5 | 22920 | 1.67 | +0.0% | 5 | control.frost-drag x12 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 5 | 23980 | 1.67 | +0.0% | 6 | — |
| `lineage-dagger-baseline` | _control_ | reload | 5 | 23460 | 1.67 | — | 6 | — |

### `node-t2-cave-03` — Deep 70% / Brood 20% / Brute 10% (cave T2; shared by 1 authored node)

Dominant family **Deep** drops `kill-chain`, punishes `engagement`. Authored Deep 70% / Brood 20% / Brute 10%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 8 | 13763 | 2.67 | +0.0% | 0 | kill-chain.kill-pulse x8 |
| `lineage-broadsword-empowered` | empowered | energy | 8 | 13763 | 2.67 | +0.0% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-tempo` | tempo | energy | 8 | 13850 | 2.67 | +0.0% | 0 | tempo.ghost-strike x36 |
| `lineage-broadsword-baseline` | _control_ | energy | 8 | 13850 | 2.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 10 | 8640 | 3.33 | +66.7% | 0 | tempo.ghost-strike x46 |
| `lineage-rapier-affliction` | affliction | cadence | 8 | 9913 | 2.67 | +33.3% | 0 | affliction.bleed-pips x111 |
| `lineage-rapier-engagement` | engagement | cadence | 8 | 9213 | 2.67 | +33.3% | 0 | engagement.opening-flash x10 |
| `lineage-rapier-baseline` | _control_ | cadence | 6 | 20100 | 2.00 | — | 6 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 8 | 10650 | 2.67 | +0.0% | 0 | empowered.plating-crack x13 |
| `lineage-hammer-control` | control | cooldown | 8 | 10650 | 2.67 | +0.0% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | cooldown | 8 | 10725 | 2.67 | +0.0% | 0 | engagement.brace-sparks x9 |
| `lineage-hammer-baseline` | _control_ | cooldown | 8 | 10650 | 2.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 6 | 16117 | 2.00 | +0.0% | 2 | tempo.ghost-strike x26 |
| `lineage-axe-kill-chain` | kill-chain | dot | 7 | 14029 | 2.33 | +16.7% | 2 | kill-chain.kill-pulse x4 |
| `lineage-axe-empowered` | empowered | dot | 7 | 15300 | 2.33 | +16.7% | 2 | empowered.weak-point x5 |
| `lineage-axe-baseline` | _control_ | dot | 6 | 16117 | 2.00 | — | 2 | — |
| `lineage-dagger-affliction` | affliction | reload | 8 | 11225 | 2.67 | +14.3% | 2 | affliction.venom-pips x79 |
| `lineage-dagger-control` | control | reload | 8 | 11138 | 2.67 | +14.3% | 2 | control.frost-drag x26 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 8 | 12113 | 2.67 | +14.3% | 2 | — |
| `lineage-dagger-baseline` | _control_ | reload | 7 | 13914 | 2.33 | — | 2 | — |

### `node-t2-cave-04` — Brood 45% / Brute 45% / Deep 10% (cave T2; shared by 1 authored node)

Dominant family **Brood** drops `affliction`, punishes `tempo`. Authored Brood 45% / Brute 45% / Deep 10%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 4 | 36875 | 1.33 | +0.0% | 2 | kill-chain.kill-pulse x2 |
| `lineage-broadsword-empowered` | empowered | energy | 4 | 35025 | 1.33 | +0.0% | 2 | empowered.weak-point x4 |
| `lineage-broadsword-tempo` | tempo | energy | 4 | 37375 | 1.33 | +0.0% | 3 | tempo.ghost-strike x26 |
| `lineage-broadsword-baseline` | _control_ | energy | 4 | 37375 | 1.33 | — | 3 | — |
| `lineage-rapier-tempo` | tempo | cadence | 6 | 14000 | 2.00 | +200.0% | 2 | tempo.ghost-strike x30 |
| `lineage-rapier-affliction` | affliction | cadence | 6 | 14450 | 2.00 | +200.0% | 2 | affliction.bleed-pips x84 |
| `lineage-rapier-engagement` | engagement | cadence | 7 | 11871 | 2.33 | +250.0% | 2 | engagement.opening-flash x6 |
| `lineage-rapier-baseline` | _control_ | cadence | 2 | 68300 | 0.67 | — | 11 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 5 | 21040 | 1.67 | +0.0% | 2 | empowered.plating-crack x8 |
| `lineage-hammer-control` | control | cooldown | 5 | 23320 | 1.67 | +0.0% | 2 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | cooldown | 4 | 30500 | 1.33 | -20.0% | 2 | engagement.brace-sparks x8 |
| `lineage-hammer-baseline` | _control_ | cooldown | 5 | 21040 | 1.67 | — | 2 | — |
| `lineage-axe-tempo` | tempo | dot | 5 | 26500 | 1.67 | +0.0% | 6 | tempo.ghost-strike x13 |
| `lineage-axe-kill-chain` | kill-chain | dot | 2 | 70750 | 0.67 | -60.0% | 8 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | dot | 5 | 23360 | 1.67 | +0.0% | 5 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | dot | 5 | 26500 | 1.67 | — | 6 | — |
| `lineage-dagger-affliction` | affliction | reload | 5 | 25240 | 1.67 | +0.0% | 7 | affliction.venom-pips x75 |
| `lineage-dagger-control` | control | reload | 6 | 18300 | 2.00 | +20.0% | 5 | control.frost-drag x17 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 4 | 31725 | 1.33 | -20.0% | 9 | — |
| `lineage-dagger-baseline` | _control_ | reload | 5 | 24520 | 1.67 | — | 8 | — |

### `node-t2-cave-05` — Brood 34% / Brute 33% / Deep 33% (cave T2; shared by 1 authored node)

Dominant family **Brood** drops `affliction`, punishes `tempo`. Authored Brood 34% / Brute 33% / Deep 33%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 4 | 35425 | 1.33 | -33.3% | 1 | kill-chain.kill-pulse x3 |
| `lineage-broadsword-empowered` | empowered | energy | 6 | 22017 | 2.00 | +0.0% | 2 | empowered.weak-point x4 |
| `lineage-broadsword-tempo` | tempo | energy | 6 | 22050 | 2.00 | +0.0% | 2 | tempo.ghost-strike x23 |
| `lineage-broadsword-baseline` | _control_ | energy | 6 | 22050 | 2.00 | — | 2 | — |
| `lineage-rapier-tempo` | tempo | cadence | 6 | 16717 | 2.00 | +50.0% | 3 | tempo.ghost-strike x19 |
| `lineage-rapier-affliction` | affliction | cadence | 7 | 14857 | 2.33 | +75.0% | 3 | affliction.bleed-pips x51 |
| `lineage-rapier-engagement` | engagement | cadence | 7 | 13829 | 2.33 | +75.0% | 3 | engagement.opening-flash x3 |
| `lineage-rapier-baseline` | _control_ | cadence | 4 | 29700 | 1.33 | — | 7 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 6 | 19267 | 2.00 | +0.0% | 2 | empowered.plating-crack x7 |
| `lineage-hammer-control` | control | cooldown | 6 | 19267 | 2.00 | +0.0% | 2 | control.frost-drag x8 |
| `lineage-hammer-engagement` | engagement | cooldown | 6 | 18800 | 2.00 | +0.0% | 2 | engagement.brace-sparks x5 |
| `lineage-hammer-baseline` | _control_ | cooldown | 6 | 19267 | 2.00 | — | 2 | — |
| `lineage-axe-tempo` | tempo | dot | 5 | 20260 | 1.67 | +0.0% | 3 | tempo.ghost-strike x12 |
| `lineage-axe-kill-chain` | kill-chain | dot | 4 | 30600 | 1.33 | -20.0% | 5 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | dot | 5 | 19960 | 1.67 | +0.0% | 3 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | dot | 5 | 20260 | 1.67 | — | 3 | — |
| `lineage-dagger-affliction` | affliction | reload | 8 | 12488 | 2.67 | +60.0% | 4 | affliction.venom-pips x55 |
| `lineage-dagger-control` | control | reload | 6 | 19217 | 2.00 | +20.0% | 7 | control.frost-drag x16 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 4 | 31375 | 1.33 | -20.0% | 9 | — |
| `lineage-dagger-baseline` | _control_ | reload | 5 | 21760 | 1.67 | — | 5 | — |

### `node-t2-cave-06` — Brute 55% / Deep 30% / Brood 15% (cave T2; shared by 1 authored node)

Dominant family **Brute** drops `empowered`, punishes `affliction`. Authored Brute 55% / Deep 30% / Brood 15%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 3 | 48200 | 1.00 | +0.0% | 0 | kill-chain.kill-pulse x3 |
| `lineage-broadsword-empowered` | empowered | energy | 3 | 52100 | 1.00 | +0.0% | 2 | empowered.weak-point x5 |
| `lineage-broadsword-tempo` | tempo | energy | 3 | 53400 | 1.00 | +0.0% | 2 | tempo.ghost-strike x27 |
| `lineage-broadsword-baseline` | _control_ | energy | 3 | 53400 | 1.00 | — | 2 | — |
| `lineage-rapier-tempo` | tempo | cadence | 5 | 24100 | 1.67 | +0.0% | 5 | tempo.ghost-strike x19 |
| `lineage-rapier-affliction` | affliction | cadence | 5 | 24560 | 1.67 | +0.0% | 5 | affliction.bleed-pips x51 |
| `lineage-rapier-engagement` | engagement | cadence | 5 | 23400 | 1.67 | +0.0% | 5 | engagement.opening-flash x3 |
| `lineage-rapier-baseline` | _control_ | cadence | 5 | 25680 | 1.67 | — | 5 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 2 | 71400 | 0.67 | +0.0% | 4 | empowered.plating-crack x6 |
| `lineage-hammer-control` | control | cooldown | 2 | 71400 | 0.67 | +0.0% | 4 | control.frost-drag x8 |
| `lineage-hammer-engagement` | engagement | cooldown | 2 | 71500 | 0.67 | +0.0% | 4 | engagement.brace-sparks x4 |
| `lineage-hammer-baseline` | _control_ | cooldown | 2 | 71400 | 0.67 | — | 4 | — |
| `lineage-axe-tempo` | tempo | dot | 4 | 31175 | 1.33 | +0.0% | 4 | tempo.ghost-strike x15 |
| `lineage-axe-kill-chain` | kill-chain | dot | 3 | 43133 | 1.00 | -25.0% | 5 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | dot | 4 | 32250 | 1.33 | +0.0% | 4 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | dot | 4 | 31175 | 1.33 | — | 4 | — |
| `lineage-dagger-affliction` | affliction | reload | 5 | 21780 | 1.67 | +25.0% | 5 | affliction.venom-pips x56 |
| `lineage-dagger-control` | control | reload | 4 | 29750 | 1.33 | +0.0% | 6 | control.frost-drag x18 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 5 | 25800 | 1.67 | +25.0% | 7 | — |
| `lineage-dagger-baseline` | _control_ | reload | 4 | 29850 | 1.33 | — | 6 | — |

### `node-t2-swamp-01` — Coven 67% / Stalker 33% (swamp T2; shared by 1 authored node)

Dominant family **Coven** drops `control`, punishes `tempo`. Authored Mire 70% / Coven 20% / Stalker 10%; unfieldable at T2: Mire.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 7 | 15771 | 2.33 | +0.0% | 2 | kill-chain.kill-pulse x2 |
| `lineage-broadsword-empowered` | empowered | energy | 7 | 15314 | 2.33 | +0.0% | 2 | empowered.weak-point x3 |
| `lineage-broadsword-tempo` | tempo | energy | 7 | 15357 | 2.33 | +0.0% | 2 | tempo.ghost-strike x20 |
| `lineage-broadsword-baseline` | _control_ | energy | 7 | 15357 | 2.33 | — | 2 | — |
| `lineage-rapier-tempo` | tempo | cadence | 10 | 8710 | 3.33 | +0.0% | 2 | tempo.ghost-strike x26 |
| `lineage-rapier-affliction` | affliction | cadence | 10 | 10120 | 3.33 | +0.0% | 2 | affliction.bleed-pips x74 |
| `lineage-rapier-engagement` | engagement | cadence | 8 | 10788 | 2.67 | -20.0% | 2 | engagement.opening-flash x8 |
| `lineage-rapier-baseline` | _control_ | cadence | 10 | 7650 | 3.33 | — | 1 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 8 | 12063 | 2.67 | +14.3% | 3 | empowered.plating-crack x6 |
| `lineage-hammer-control` | control | cooldown | 7 | 12529 | 2.33 | +0.0% | 2 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | cooldown | 7 | 12657 | 2.33 | +0.0% | 2 | engagement.brace-sparks x6 |
| `lineage-hammer-baseline` | _control_ | cooldown | 7 | 14414 | 2.33 | — | 4 | — |
| `lineage-axe-tempo` | tempo | dot | 8 | 10513 | 2.67 | +0.0% | 1 | tempo.ghost-strike x28 |
| `lineage-axe-kill-chain` | kill-chain | dot | 9 | 8644 | 3.00 | +12.5% | 0 | kill-chain.kill-pulse x9 |
| `lineage-axe-empowered` | empowered | dot | 8 | 10513 | 2.67 | +0.0% | 1 | empowered.weak-point x8 |
| `lineage-axe-baseline` | _control_ | dot | 8 | 10425 | 2.67 | — | 1 | — |
| `lineage-dagger-affliction` | affliction | reload | 9 | 10411 | 3.00 | +0.0% | 1 | affliction.venom-pips x106 |
| `lineage-dagger-control` | control | reload | 8 | 12738 | 2.67 | -11.1% | 1 | control.frost-drag x43 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 9 | 9078 | 3.00 | +0.0% | 0 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | reload | 9 | 8389 | 3.00 | — | 0 | — |
| `frame-cadence-light` | _frame light_ | cadence | 6 | 16317 | 2.00 | — | 5 | — |
| `frame-cadence-balanced` | _frame balanced_ | cadence | 10 | 7650 | 3.33 | — | 1 | — |
| `frame-cadence-heavy` | _frame heavy_ | cadence | 7 | 15143 | 2.33 | — | 1 | — |
| `frame-cooldown-light` | _frame light_ | cooldown | 5 | 19940 | 1.67 | — | 5 | — |
| `frame-cooldown-balanced` | _frame balanced_ | cooldown | 10 | 7710 | 3.33 | — | 1 | — |
| `frame-cooldown-heavy` | _frame heavy_ | cooldown | 7 | 14414 | 2.33 | — | 4 | — |
| `frame-reload-light` | _frame light_ | reload | 11 | 7655 | 3.67 | — | 0 | — |
| `frame-reload-balanced` | _frame balanced_ | reload | 9 | 11211 | 3.00 | — | 1 | — |
| `frame-reload-heavy` | _frame heavy_ | reload | 9 | 8389 | 3.00 | — | 0 | — |
| `frame-energy-light` | _frame light_ | energy | 6 | 17583 | 2.00 | — | 2 | — |
| `frame-energy-balanced` | _frame balanced_ | energy | 7 | 15971 | 2.33 | — | 2 | — |
| `frame-energy-heavy` | _frame heavy_ | energy | 7 | 15357 | 2.33 | — | 2 | — |
| `frame-dot-light` | _frame light_ | dot | 9 | 10844 | 3.00 | — | 2 | — |
| `frame-dot-balanced` | _frame balanced_ | dot | 8 | 10425 | 2.67 | — | 1 | — |
| `frame-dot-heavy` | _frame heavy_ | dot | 9 | 9544 | 3.00 | — | 0 | — |
| `frame-summoner-light` | _frame light_ | summoner | 9 | 0 | 3.00 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | summoner | 7 | 0 | 2.33 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | summoner | 13 | 1938 | 4.33 | — | 0 | — |

### `node-t2-swamp-02` — Coven 78% / Stalker 22% (swamp T2; shared by 2 authored nodes)

Dominant family **Coven** drops `control`, punishes `tempo`. Authored Coven 70% / Stalker 20% / Mire 10%; unfieldable at T2: Mire.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 8 | 12775 | 2.67 | +33.3% | 2 | kill-chain.kill-pulse x3 |
| `lineage-broadsword-empowered` | empowered | energy | 8 | 15213 | 2.67 | +33.3% | 3 | empowered.weak-point x4 |
| `lineage-broadsword-tempo` | tempo | energy | 6 | 20833 | 2.00 | +0.0% | 3 | tempo.ghost-strike x26 |
| `lineage-broadsword-baseline` | _control_ | energy | 6 | 20833 | 2.00 | — | 3 | — |
| `lineage-rapier-tempo` | tempo | cadence | 7 | 14271 | 2.33 | +40.0% | 3 | tempo.ghost-strike x19 |
| `lineage-rapier-affliction` | affliction | cadence | 6 | 18817 | 2.00 | +20.0% | 5 | affliction.bleed-pips x54 |
| `lineage-rapier-engagement` | engagement | cadence | 4 | 25325 | 1.33 | -20.0% | 6 | engagement.opening-flash x3 |
| `lineage-rapier-baseline` | _control_ | cadence | 5 | 23280 | 1.67 | — | 7 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 9 | 11044 | 3.00 | +28.6% | 2 | empowered.plating-crack x7 |
| `lineage-hammer-control` | control | cooldown | 10 | 9910 | 3.33 | +42.9% | 2 | control.frost-drag x8 |
| `lineage-hammer-engagement` | engagement | cooldown | 9 | 9378 | 3.00 | +28.6% | 2 | engagement.brace-sparks x4 |
| `lineage-hammer-baseline` | _control_ | cooldown | 7 | 14371 | 2.33 | — | 5 | — |
| `lineage-axe-tempo` | tempo | dot | 8 | 13638 | 2.67 | +0.0% | 2 | tempo.ghost-strike x38 |
| `lineage-axe-kill-chain` | kill-chain | dot | 8 | 11350 | 2.67 | +0.0% | 0 | kill-chain.kill-pulse x8 |
| `lineage-axe-empowered` | empowered | dot | 8 | 13038 | 2.67 | +0.0% | 1 | empowered.weak-point x8 |
| `lineage-axe-baseline` | _control_ | dot | 8 | 12950 | 2.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 8 | 12363 | 2.67 | +14.3% | 0 | affliction.venom-pips x164 |
| `lineage-dagger-control` | control | reload | 10 | 8940 | 3.33 | +42.9% | 0 | control.frost-drag x50 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 8 | 12750 | 2.67 | +14.3% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 7 | 13900 | 2.33 | — | 1 | — |

### `node-t2-swamp-03` — Stalker 88% / Coven 13% (swamp T2; shared by 1 authored node)

Dominant family **Stalker** drops `kill-chain`, punishes `bulwark`. Authored Stalker 70% / Mire 20% / Coven 10%; unfieldable at T2: Mire.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 10 | 8850 | 3.33 | +0.0% | 1 | kill-chain.kill-pulse x8 |
| `lineage-broadsword-empowered` | empowered | energy | 10 | 9240 | 3.33 | +0.0% | 1 | empowered.weak-point x2 |
| `lineage-broadsword-tempo` | tempo | energy | 10 | 9070 | 3.33 | +0.0% | 2 | tempo.ghost-strike x17 |
| `lineage-broadsword-baseline` | _control_ | energy | 10 | 9070 | 3.33 | — | 2 | — |
| `lineage-rapier-tempo` | tempo | cadence | 11 | 6064 | 3.67 | +10.0% | 0 | tempo.ghost-strike x29 |
| `lineage-rapier-affliction` | affliction | cadence | 10 | 7580 | 3.33 | +0.0% | 2 | affliction.bleed-pips x48 |
| `lineage-rapier-engagement` | engagement | cadence | 15 | 5600 | 5.00 | +50.0% | 1 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | cadence | 10 | 7100 | 3.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 14 | 5293 | 4.67 | -6.7% | 0 | empowered.plating-crack x13 |
| `lineage-hammer-control` | control | cooldown | 14 | 5293 | 4.67 | -6.7% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | cooldown | 14 | 4593 | 4.67 | -6.7% | 0 | engagement.brace-sparks x10 |
| `lineage-hammer-baseline` | _control_ | cooldown | 15 | 5253 | 5.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 9 | 8344 | 3.00 | +0.0% | 0 | tempo.ghost-strike x28 |
| `lineage-axe-kill-chain` | kill-chain | dot | 9 | 9111 | 3.00 | +0.0% | 2 | kill-chain.kill-pulse x4 |
| `lineage-axe-empowered` | empowered | dot | 9 | 8344 | 3.00 | +0.0% | 0 | empowered.weak-point x9 |
| `lineage-axe-baseline` | _control_ | dot | 9 | 8344 | 3.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 10 | 7360 | 3.33 | +0.0% | 0 | affliction.venom-pips x111 |
| `lineage-dagger-control` | control | reload | 11 | 6782 | 3.67 | +10.0% | 1 | control.frost-drag x36 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 10 | 7150 | 3.33 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 10 | 8880 | 3.33 | — | 1 | — |

### `node-t2-swamp-05` — Coven 50% / Stalker 50% (swamp T2; shared by 1 authored node)

Dominant family **Coven** drops `control`, punishes `tempo`. Authored Mire 34% / Coven 33% / Stalker 33%; unfieldable at T2: Mire.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 11 | 11527 | 3.67 | +57.1% | 1 | kill-chain.kill-pulse x6 |
| `lineage-broadsword-empowered` | empowered | energy | 9 | 13878 | 3.00 | +28.6% | 1 | empowered.weak-point x7 |
| `lineage-broadsword-tempo` | tempo | energy | 7 | 17886 | 2.33 | +0.0% | 3 | tempo.ghost-strike x21 |
| `lineage-broadsword-baseline` | _control_ | energy | 7 | 17886 | 2.33 | — | 3 | — |
| `lineage-rapier-tempo` | tempo | cadence | 6 | 19733 | 2.00 | +0.0% | 6 | tempo.ghost-strike x10 |
| `lineage-rapier-affliction` | affliction | cadence | 5 | 22520 | 1.67 | -16.7% | 6 | affliction.bleed-pips x36 |
| `lineage-rapier-engagement` | engagement | cadence | 9 | 10178 | 3.00 | +50.0% | 3 | engagement.opening-flash x3 |
| `lineage-rapier-baseline` | _control_ | cadence | 6 | 19467 | 2.00 | — | 7 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 10 | 10330 | 3.33 | +0.0% | 2 | empowered.plating-crack x10 |
| `lineage-hammer-control` | control | cooldown | 11 | 8345 | 3.67 | +10.0% | 1 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | cooldown | 10 | 10770 | 3.33 | +0.0% | 3 | engagement.brace-sparks x6 |
| `lineage-hammer-baseline` | _control_ | cooldown | 10 | 9390 | 3.33 | — | 1 | — |
| `lineage-axe-tempo` | tempo | dot | 10 | 11120 | 3.33 | +11.1% | 2 | tempo.ghost-strike x20 |
| `lineage-axe-kill-chain` | kill-chain | dot | 8 | 12888 | 2.67 | -11.1% | 0 | kill-chain.kill-pulse x8 |
| `lineage-axe-empowered` | empowered | dot | 7 | 16929 | 2.33 | -22.2% | 3 | empowered.weak-point x4 |
| `lineage-axe-baseline` | _control_ | dot | 9 | 13311 | 3.00 | — | 1 | — |
| `lineage-dagger-affliction` | affliction | reload | 10 | 10160 | 3.33 | +0.0% | 0 | affliction.venom-pips x164 |
| `lineage-dagger-control` | control | reload | 10 | 8460 | 3.33 | +0.0% | 0 | control.frost-drag x46 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 9 | 10278 | 3.00 | -10.0% | 0 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | reload | 10 | 8730 | 3.33 | — | 0 | — |

### `node-t2-swamp-06` — Coven 65% / Stalker 35% (swamp T2; shared by 1 authored node)

Dominant family **Coven** drops `control`, punishes `tempo`. Authored Coven 55% / Stalker 30% / Mire 15%; unfieldable at T2: Mire.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 10 | 10990 | 3.33 | +0.0% | 1 | kill-chain.kill-pulse x10 |
| `lineage-broadsword-empowered` | empowered | energy | 10 | 9570 | 3.33 | +0.0% | 2 | empowered.weak-point x4 |
| `lineage-broadsword-tempo` | tempo | energy | 10 | 9600 | 3.33 | +0.0% | 2 | tempo.ghost-strike x22 |
| `lineage-broadsword-baseline` | _control_ | energy | 10 | 9600 | 3.33 | — | 2 | — |
| `lineage-rapier-tempo` | tempo | cadence | 7 | 15329 | 2.33 | -22.2% | 5 | tempo.ghost-strike x31 |
| `lineage-rapier-affliction` | affliction | cadence | 9 | 11444 | 3.00 | +0.0% | 3 | affliction.bleed-pips x91 |
| `lineage-rapier-engagement` | engagement | cadence | 11 | 8245 | 3.67 | +22.2% | 3 | engagement.opening-flash x7 |
| `lineage-rapier-baseline` | _control_ | cadence | 9 | 11156 | 3.00 | — | 3 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 15 | 4800 | 5.00 | +36.4% | 1 | empowered.plating-crack x10 |
| `lineage-hammer-control` | control | cooldown | 15 | 4800 | 5.00 | +36.4% | 1 | control.frost-drag x7 |
| `lineage-hammer-engagement` | engagement | cooldown | 12 | 7567 | 4.00 | +9.1% | 1 | engagement.brace-sparks x8 |
| `lineage-hammer-baseline` | _control_ | cooldown | 11 | 7945 | 3.67 | — | 1 | — |
| `lineage-axe-tempo` | tempo | dot | 8 | 11825 | 2.67 | +0.0% | 2 | tempo.ghost-strike x23 |
| `lineage-axe-kill-chain` | kill-chain | dot | 9 | 10822 | 3.00 | +12.5% | 1 | kill-chain.kill-pulse x7 |
| `lineage-axe-empowered` | empowered | dot | 8 | 12013 | 2.67 | +0.0% | 0 | empowered.weak-point x9 |
| `lineage-axe-baseline` | _control_ | dot | 8 | 11150 | 2.67 | — | 1 | — |
| `lineage-dagger-affliction` | affliction | reload | 9 | 10489 | 3.00 | -10.0% | 1 | affliction.venom-pips x131 |
| `lineage-dagger-control` | control | reload | 10 | 9880 | 3.33 | +0.0% | 1 | control.frost-drag x43 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 9 | 11244 | 3.00 | -10.0% | 1 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | reload | 10 | 9470 | 3.33 | — | 0 | — |

### `node-t2-jungle-01` — Ape 78% / Undergrowth 22% (jungle T2; shared by 1 authored node)

Dominant family **Ape** drops `empowered`, punishes `tempo`. Authored Ape 70% / Undergrowth 20% / Stalker 10%; unfieldable at T2: Stalker.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 4 | 42900 | 1.33 | +33.3% | 5 | kill-chain.kill-pulse x1 |
| `lineage-broadsword-empowered` | empowered | energy | 4 | 35475 | 1.33 | +33.3% | 4 | empowered.weak-point x2 |
| `lineage-broadsword-tempo` | tempo | energy | 3 | 51400 | 1.00 | +0.0% | 5 | tempo.ghost-strike x16 |
| `lineage-broadsword-baseline` | _control_ | energy | 3 | 51400 | 1.00 | — | 5 | — |
| `lineage-rapier-tempo` | tempo | cadence | 4 | 33950 | 1.33 | +100.0% | 4 | tempo.ghost-strike x16 |
| `lineage-rapier-affliction` | affliction | cadence | 4 | 35050 | 1.33 | +100.0% | 6 | affliction.bleed-pips x29 |
| `lineage-rapier-engagement` | engagement | cadence | 4 | 33950 | 1.33 | +100.0% | 4 | engagement.opening-flash x3 |
| `lineage-rapier-baseline` | _control_ | cadence | 2 | 74350 | 0.67 | — | 6 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 4 | 33850 | 1.33 | -20.0% | 2 | empowered.plating-crack x4 |
| `lineage-hammer-control` | control | cooldown | 4 | 33750 | 1.33 | -20.0% | 2 | control.frost-drag x5 |
| `lineage-hammer-engagement` | engagement | cooldown | 4 | 33750 | 1.33 | -20.0% | 2 | engagement.brace-sparks x3 |
| `lineage-hammer-baseline` | _control_ | cooldown | 5 | 28240 | 1.67 | — | 2 | — |
| `lineage-axe-tempo` | tempo | dot | 4 | 38500 | 1.33 | +0.0% | 7 | tempo.ghost-strike x18 |
| `lineage-axe-kill-chain` | kill-chain | dot | 1 | 172100 | 0.33 | -75.0% | 7 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | dot | 4 | 38500 | 1.33 | +0.0% | 7 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | dot | 4 | 38500 | 1.33 | — | 7 | — |
| `lineage-dagger-affliction` | affliction | reload | 6 | 25350 | 2.00 | +50.0% | 7 | affliction.venom-pips x88 |
| `lineage-dagger-control` | control | reload | 5 | 29720 | 1.67 | +25.0% | 3 | control.frost-drag x28 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 4 | 37250 | 1.33 | +0.0% | 7 | — |
| `lineage-dagger-baseline` | _control_ | reload | 4 | 36350 | 1.33 | — | 5 | — |
| `frame-cadence-light` | _frame light_ | cadence | 4 | 31700 | 1.33 | — | 4 | — |
| `frame-cadence-balanced` | _frame balanced_ | cadence | 2 | 74350 | 0.67 | — | 6 | — |
| `frame-cadence-heavy` | _frame heavy_ | cadence | 5 | 30520 | 1.67 | — | 5 | — |
| `frame-cooldown-light` | _frame light_ | cooldown | 2 | 76450 | 0.67 | — | 4 | — |
| `frame-cooldown-balanced` | _frame balanced_ | cooldown | 2 | 75900 | 0.67 | — | 3 | — |
| `frame-cooldown-heavy` | _frame heavy_ | cooldown | 5 | 28240 | 1.67 | — | 2 | — |
| `frame-reload-light` | _frame light_ | reload | 2 | 74050 | 0.67 | — | 7 | — |
| `frame-reload-balanced` | _frame balanced_ | reload | 4 | 37700 | 1.33 | — | 3 | — |
| `frame-reload-heavy` | _frame heavy_ | reload | 4 | 36350 | 1.33 | — | 5 | — |
| `frame-energy-light` | _frame light_ | energy | 0 | — | 0.00 | — | 9 | — |
| `frame-energy-balanced` | _frame balanced_ | energy | 0 | — | 0.00 | — | 9 | — |
| `frame-energy-heavy` | _frame heavy_ | energy | 3 | 51400 | 1.00 | — | 5 | — |
| `frame-dot-light` | _frame light_ | dot | 0 | — | 0.00 | — | 9 | — |
| `frame-dot-balanced` | _frame balanced_ | dot | 4 | 38500 | 1.33 | — | 7 | — |
| `frame-dot-heavy` | _frame heavy_ | dot | 2 | 78900 | 0.67 | — | 6 | — |
| `frame-summoner-light` | _frame light_ | summoner | 6 | 5950 | 2.00 | — | 1 | — |
| `frame-summoner-balanced` | _frame balanced_ | summoner | 5 | 6800 | 1.67 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | summoner | 9 | 15333 | 3.00 | — | 0 | — |

### `node-t2-jungle-02` — Undergrowth 88% / Ape 13% (jungle T2; shared by 1 authored node)

Dominant family **Undergrowth** drops `affliction`, punishes `control`. Authored Undergrowth 70% / Stalker 20% / Ape 10%; unfieldable at T2: Stalker.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 6 | 19900 | 2.00 | +20.0% | 5 | kill-chain.kill-pulse x2 |
| `lineage-broadsword-empowered` | empowered | energy | 6 | 22550 | 2.00 | +20.0% | 7 | empowered.weak-point x2 |
| `lineage-broadsword-tempo` | tempo | energy | 5 | 25460 | 1.67 | +0.0% | 4 | tempo.ghost-strike x15 |
| `lineage-broadsword-baseline` | _control_ | energy | 5 | 25460 | 1.67 | — | 4 | — |
| `lineage-rapier-tempo` | tempo | cadence | 10 | 9950 | 3.33 | +100.0% | 4 | tempo.ghost-strike x21 |
| `lineage-rapier-affliction` | affliction | cadence | 7 | 19429 | 2.33 | +40.0% | 11 | affliction.bleed-pips x54 |
| `lineage-rapier-engagement` | engagement | cadence | 7 | 12886 | 2.33 | +40.0% | 3 | engagement.opening-flash x5 |
| `lineage-rapier-baseline` | _control_ | cadence | 5 | 30980 | 1.67 | — | 12 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 5 | 21300 | 1.67 | +0.0% | 2 | empowered.plating-crack x7 |
| `lineage-hammer-control` | control | cooldown | 5 | 21200 | 1.67 | +0.0% | 2 | control.frost-drag x7 |
| `lineage-hammer-engagement` | engagement | cooldown | 5 | 21280 | 1.67 | +0.0% | 1 | engagement.brace-sparks x5 |
| `lineage-hammer-baseline` | _control_ | cooldown | 5 | 21300 | 1.67 | — | 2 | — |
| `lineage-axe-tempo` | tempo | dot | 2 | 69900 | 0.67 | +0.0% | 9 | tempo.ghost-strike x17 |
| `lineage-axe-kill-chain` | kill-chain | dot | 1 | 144900 | 0.33 | -50.0% | 9 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | dot | 2 | 69900 | 0.67 | +0.0% | 9 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | dot | 2 | 69900 | 0.67 | — | 9 | — |
| `lineage-dagger-affliction` | affliction | reload | 6 | 19833 | 2.00 | +50.0% | 7 | affliction.venom-pips x77 |
| `lineage-dagger-control` | control | reload | 7 | 16729 | 2.33 | +75.0% | 5 | control.frost-drag x24 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 3 | 51167 | 1.00 | -25.0% | 13 | — |
| `lineage-dagger-baseline` | _control_ | reload | 4 | 37125 | 1.33 | — | 13 | — |

### `node-t2-jungle-03` — Ape 67% / Undergrowth 33% (jungle T2; shared by 1 authored node)

Dominant family **Ape** drops `empowered`, punishes `tempo`. Authored Stalker 70% / Ape 20% / Undergrowth 10%; unfieldable at T2: Stalker.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 5 | 31220 | 1.67 | +25.0% | 4 | kill-chain.kill-pulse x1 |
| `lineage-broadsword-empowered` | empowered | energy | 5 | 30740 | 1.67 | +25.0% | 3 | empowered.weak-point x4 |
| `lineage-broadsword-tempo` | tempo | energy | 4 | 38700 | 1.33 | +0.0% | 4 | tempo.ghost-strike x22 |
| `lineage-broadsword-baseline` | _control_ | energy | 4 | 38700 | 1.33 | — | 4 | — |
| `lineage-rapier-tempo` | tempo | cadence | 5 | 24760 | 1.67 | +0.0% | 2 | tempo.ghost-strike x40 |
| `lineage-rapier-affliction` | affliction | cadence | 4 | 35925 | 1.33 | -20.0% | 4 | affliction.bleed-pips x112 |
| `lineage-rapier-engagement` | engagement | cadence | 6 | 19500 | 2.00 | +20.0% | 1 | engagement.opening-flash x5 |
| `lineage-rapier-baseline` | _control_ | cadence | 5 | 27200 | 1.67 | — | 3 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 4 | 36700 | 1.33 | +0.0% | 3 | empowered.plating-crack x9 |
| `lineage-hammer-control` | control | cooldown | 5 | 24880 | 1.67 | +25.0% | 0 | control.frost-drag x17 |
| `lineage-hammer-engagement` | engagement | cooldown | 6 | 21383 | 2.00 | +50.0% | 0 | engagement.brace-sparks x6 |
| `lineage-hammer-baseline` | _control_ | cooldown | 4 | 36700 | 1.33 | — | 3 | — |
| `lineage-axe-tempo` | tempo | dot | 2 | 71400 | 0.67 | +0.0% | 5 | tempo.ghost-strike x19 |
| `lineage-axe-kill-chain` | kill-chain | dot | 2 | 77150 | 0.67 | +0.0% | 4 | — |
| `lineage-axe-empowered` | empowered | dot | 2 | 71400 | 0.67 | +0.0% | 5 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | dot | 2 | 71400 | 0.67 | — | 5 | — |
| `lineage-dagger-affliction` | affliction | reload | 6 | 19300 | 2.00 | +50.0% | 0 | affliction.venom-pips x189 |
| `lineage-dagger-control` | control | reload | 4 | 37275 | 1.33 | +0.0% | 5 | control.frost-drag x49 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 6 | 25733 | 2.00 | +50.0% | 6 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | reload | 4 | 33600 | 1.33 | — | 4 | — |

### `node-t2-jungle-04` — Ape 50% / Undergrowth 50% (jungle T2; shared by 2 authored nodes)

Dominant family **Ape** drops `empowered`, punishes `tempo`. Authored Ape 45% / Undergrowth 45% / Stalker 10%; unfieldable at T2: Stalker.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 4 | 32825 | 1.33 | -33.3% | 5 | — |
| `lineage-broadsword-empowered` | empowered | energy | 6 | 22217 | 2.00 | +0.0% | 3 | empowered.weak-point x4 |
| `lineage-broadsword-tempo` | tempo | energy | 6 | 22400 | 2.00 | +0.0% | 5 | tempo.ghost-strike x17 |
| `lineage-broadsword-baseline` | _control_ | energy | 6 | 22400 | 2.00 | — | 5 | — |
| `lineage-rapier-tempo` | tempo | cadence | 7 | 14629 | 2.33 | +16.7% | 1 | tempo.ghost-strike x50 |
| `lineage-rapier-affliction` | affliction | cadence | 6 | 19467 | 2.00 | +0.0% | 3 | affliction.bleed-pips x134 |
| `lineage-rapier-engagement` | engagement | cadence | 6 | 17350 | 2.00 | +0.0% | 1 | engagement.opening-flash x6 |
| `lineage-rapier-baseline` | _control_ | cadence | 6 | 23900 | 2.00 | — | 7 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 5 | 25260 | 1.67 | +25.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | cooldown | 5 | 25260 | 1.67 | +25.0% | 0 | control.frost-drag x18 |
| `lineage-hammer-engagement` | engagement | cooldown | 5 | 25280 | 1.67 | +25.0% | 0 | engagement.brace-sparks x6 |
| `lineage-hammer-baseline` | _control_ | cooldown | 4 | 32100 | 1.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 3 | 43867 | 1.00 | +0.0% | 3 | tempo.ghost-strike x26 |
| `lineage-axe-kill-chain` | kill-chain | dot | 1 | 166000 | 0.33 | -66.7% | 10 | — |
| `lineage-axe-empowered` | empowered | dot | 3 | 43867 | 1.00 | +0.0% | 3 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | dot | 3 | 43867 | 1.00 | — | 3 | — |
| `lineage-dagger-affliction` | affliction | reload | 4 | 33950 | 1.33 | +33.3% | 3 | affliction.venom-pips x157 |
| `lineage-dagger-control` | control | reload | 6 | 20200 | 2.00 | +100.0% | 2 | control.frost-drag x45 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 3 | 51233 | 1.00 | +0.0% | 8 | — |
| `lineage-dagger-baseline` | _control_ | reload | 3 | 52367 | 1.00 | — | 7 | — |

### `node-t2-desert-01` — Basilisk 70% / Scorpion 30% (desert T2; shared by 1 authored node)

Dominant family **Basilisk** drops `empowered`, punishes `tempo`. Authored Basilisk 70% / Scorpion 30%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 5 | 34400 | 1.67 | +66.7% | 1 | kill-chain.kill-pulse x3 |
| `lineage-broadsword-empowered` | empowered | energy | 3 | 57967 | 1.00 | +0.0% | 1 | empowered.weak-point x8 |
| `lineage-broadsword-tempo` | tempo | energy | 3 | 57967 | 1.00 | +0.0% | 1 | tempo.ghost-strike x44 |
| `lineage-broadsword-baseline` | _control_ | energy | 3 | 57967 | 1.00 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | cadence | 0 | — | 0.00 | — | 17 | tempo.ghost-strike x8 |
| `lineage-rapier-affliction` | affliction | cadence | 0 | — | 0.00 | — | 17 | affliction.bleed-pips x22 |
| `lineage-rapier-engagement` | engagement | cadence | 0 | — | 0.00 | — | 17 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | cadence | 0 | — | 0.00 | — | 17 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 0 | — | 0.00 | — | 10 | empowered.plating-crack x2 |
| `lineage-hammer-control` | control | cooldown | 0 | — | 0.00 | — | 10 | control.frost-drag x2 |
| `lineage-hammer-engagement` | engagement | cooldown | 0 | — | 0.00 | — | 10 | engagement.brace-sparks x2 |
| `lineage-hammer-baseline` | _control_ | cooldown | 0 | — | 0.00 | — | 10 | — |
| `lineage-axe-tempo` | tempo | dot | 3 | 54867 | 1.00 | -25.0% | 3 | tempo.ghost-strike x37 |
| `lineage-axe-kill-chain` | kill-chain | dot | 3 | 56833 | 1.00 | -25.0% | 2 | kill-chain.kill-pulse x2 |
| `lineage-axe-empowered` | empowered | dot | 3 | 54333 | 1.00 | -25.0% | 3 | empowered.weak-point x4 |
| `lineage-axe-baseline` | _control_ | dot | 4 | 42225 | 1.33 | — | 2 | — |
| `lineage-dagger-affliction` | affliction | reload | 4 | 40675 | 1.33 | +0.0% | 2 | affliction.venom-pips x163 |
| `lineage-dagger-control` | control | reload | 4 | 43525 | 1.33 | +0.0% | 2 | control.frost-drag x69 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 4 | 40875 | 1.33 | +0.0% | 1 | — |
| `lineage-dagger-baseline` | _control_ | reload | 4 | 41325 | 1.33 | — | 2 | — |
| `frame-cadence-light` | _frame light_ | cadence | 0 | — | 0.00 | — | 16 | — |
| `frame-cadence-balanced` | _frame balanced_ | cadence | 0 | — | 0.00 | — | 17 | — |
| `frame-cadence-heavy` | _frame heavy_ | cadence | 0 | — | 0.00 | — | 13 | — |
| `frame-cooldown-light` | _frame light_ | cooldown | 0 | — | 0.00 | — | 12 | — |
| `frame-cooldown-balanced` | _frame balanced_ | cooldown | 0 | — | 0.00 | — | 12 | — |
| `frame-cooldown-heavy` | _frame heavy_ | cooldown | 0 | — | 0.00 | — | 10 | — |
| `frame-reload-light` | _frame light_ | reload | 3 | 56500 | 1.00 | — | 2 | — |
| `frame-reload-balanced` | _frame balanced_ | reload | 4 | 43825 | 1.33 | — | 2 | — |
| `frame-reload-heavy` | _frame heavy_ | reload | 4 | 41325 | 1.33 | — | 2 | — |
| `frame-energy-light` | _frame light_ | energy | 3 | 50633 | 1.00 | — | 1 | — |
| `frame-energy-balanced` | _frame balanced_ | energy | 3 | 53133 | 1.00 | — | 2 | — |
| `frame-energy-heavy` | _frame heavy_ | energy | 3 | 57967 | 1.00 | — | 1 | — |
| `frame-dot-light` | _frame light_ | dot | 2 | 85500 | 0.67 | — | 3 | — |
| `frame-dot-balanced` | _frame balanced_ | dot | 4 | 42225 | 1.33 | — | 2 | — |
| `frame-dot-heavy` | _frame heavy_ | dot | 3 | 56333 | 1.00 | — | 2 | — |
| `frame-summoner-light` | _frame light_ | summoner | 4 | 36950 | 1.33 | — | 1 | — |
| `frame-summoner-balanced` | _frame balanced_ | summoner | 3 | 47033 | 1.00 | — | 1 | — |
| `frame-summoner-heavy` | _frame heavy_ | summoner | 4 | 12275 | 1.33 | — | 0 | — |

### `node-t2-desert-02` — Scorpion 70% / Basilisk 30% (desert T2; shared by 1 authored node)

Dominant family **Scorpion** drops `control`, punishes `kill-chain`. Authored Scorpion 70% / Basilisk 30%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 2 | 83750 | 0.67 | +0.0% | 4 | — |
| `lineage-broadsword-empowered` | empowered | energy | 2 | 81200 | 0.67 | +0.0% | 3 | empowered.weak-point x2 |
| `lineage-broadsword-tempo` | tempo | energy | 2 | 83350 | 0.67 | +0.0% | 3 | tempo.ghost-strike x15 |
| `lineage-broadsword-baseline` | _control_ | energy | 2 | 83350 | 0.67 | — | 3 | — |
| `lineage-rapier-tempo` | tempo | cadence | 0 | — | 0.00 | — | 15 | tempo.ghost-strike x7 |
| `lineage-rapier-affliction` | affliction | cadence | 0 | — | 0.00 | — | 15 | affliction.bleed-pips x19 |
| `lineage-rapier-engagement` | engagement | cadence | 0 | — | 0.00 | — | 15 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | cadence | 0 | — | 0.00 | — | 15 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 0 | — | 0.00 | — | 13 | empowered.plating-crack x2 |
| `lineage-hammer-control` | control | cooldown | 0 | — | 0.00 | — | 13 | control.frost-drag x2 |
| `lineage-hammer-engagement` | engagement | cooldown | 0 | — | 0.00 | — | 12 | engagement.brace-sparks x2 |
| `lineage-hammer-baseline` | _control_ | cooldown | 0 | — | 0.00 | — | 13 | — |
| `lineage-axe-tempo` | tempo | dot | 2 | 81800 | 0.67 | +0.0% | 4 | tempo.ghost-strike x13 |
| `lineage-axe-kill-chain` | kill-chain | dot | 0 | — | 0.00 | -100.0% | 5 | — |
| `lineage-axe-empowered` | empowered | dot | 2 | 82400 | 0.67 | +0.0% | 4 | empowered.weak-point x2 |
| `lineage-axe-baseline` | _control_ | dot | 2 | 81800 | 0.67 | — | 4 | — |
| `lineage-dagger-affliction` | affliction | reload | 2 | 80600 | 0.67 | +0.0% | 4 | affliction.venom-pips x64 |
| `lineage-dagger-control` | control | reload | 0 | — | 0.00 | -100.0% | 6 | control.frost-drag x26 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 2 | 80400 | 0.67 | +0.0% | 5 | — |
| `lineage-dagger-baseline` | _control_ | reload | 2 | 79800 | 0.67 | — | 4 | — |

### `node-t2-desert-03` — Basilisk 60% / Scorpion 40% (desert T2; shared by 1 authored node)

Dominant family **Basilisk** drops `empowered`, punishes `tempo`. Authored Basilisk 60% / Scorpion 40%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 5 | 32240 | 1.67 | +66.7% | 2 | kill-chain.kill-pulse x1 |
| `lineage-broadsword-empowered` | empowered | energy | 3 | 57300 | 1.00 | +0.0% | 2 | empowered.weak-point x4 |
| `lineage-broadsword-tempo` | tempo | energy | 3 | 57767 | 1.00 | +0.0% | 2 | tempo.ghost-strike x24 |
| `lineage-broadsword-baseline` | _control_ | energy | 3 | 57767 | 1.00 | — | 2 | — |
| `lineage-rapier-tempo` | tempo | cadence | 0 | — | 0.00 | — | 16 | tempo.ghost-strike x8 |
| `lineage-rapier-affliction` | affliction | cadence | 0 | — | 0.00 | — | 16 | affliction.bleed-pips x20 |
| `lineage-rapier-engagement` | engagement | cadence | 0 | — | 0.00 | — | 16 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | cadence | 0 | — | 0.00 | — | 16 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 0 | — | 0.00 | — | 10 | empowered.plating-crack x2 |
| `lineage-hammer-control` | control | cooldown | 0 | — | 0.00 | — | 10 | control.frost-drag x2 |
| `lineage-hammer-engagement` | engagement | cooldown | 0 | — | 0.00 | — | 11 | engagement.brace-sparks x2 |
| `lineage-hammer-baseline` | _control_ | cooldown | 0 | — | 0.00 | — | 10 | — |
| `lineage-axe-tempo` | tempo | dot | 3 | 57033 | 1.00 | +0.0% | 3 | tempo.ghost-strike x24 |
| `lineage-axe-kill-chain` | kill-chain | dot | 3 | 56767 | 1.00 | +0.0% | 2 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | dot | 3 | 56067 | 1.00 | +0.0% | 4 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | dot | 3 | 57033 | 1.00 | — | 3 | — |
| `lineage-dagger-affliction` | affliction | reload | 3 | 56867 | 1.00 | +50.0% | 4 | affliction.venom-pips x111 |
| `lineage-dagger-control` | control | reload | 3 | 54467 | 1.00 | +50.0% | 4 | control.frost-drag x36 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 2 | 79450 | 0.67 | +0.0% | 3 | — |
| `lineage-dagger-baseline` | _control_ | reload | 2 | 82750 | 0.67 | — | 4 | — |

### `node-t2-desert-04` — Scorpion 60% / Basilisk 40% (desert T2; shared by 1 authored node)

Dominant family **Scorpion** drops `control`, punishes `kill-chain`. Authored Scorpion 60% / Basilisk 40%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 4 | 38675 | 1.33 | +100.0% | 0 | kill-chain.kill-pulse x4 |
| `lineage-broadsword-empowered` | empowered | energy | 2 | 82400 | 0.67 | +0.0% | 3 | empowered.weak-point x4 |
| `lineage-broadsword-tempo` | tempo | energy | 2 | 82400 | 0.67 | +0.0% | 3 | tempo.ghost-strike x26 |
| `lineage-broadsword-baseline` | _control_ | energy | 2 | 82400 | 0.67 | — | 3 | — |
| `lineage-rapier-tempo` | tempo | cadence | 0 | — | 0.00 | — | 17 | tempo.ghost-strike x7 |
| `lineage-rapier-affliction` | affliction | cadence | 0 | — | 0.00 | — | 17 | affliction.bleed-pips x21 |
| `lineage-rapier-engagement` | engagement | cadence | 0 | — | 0.00 | — | 17 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | cadence | 0 | — | 0.00 | — | 17 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 0 | — | 0.00 | — | 11 | empowered.plating-crack x2 |
| `lineage-hammer-control` | control | cooldown | 0 | — | 0.00 | — | 11 | control.frost-drag x2 |
| `lineage-hammer-engagement` | engagement | cooldown | 0 | — | 0.00 | — | 12 | engagement.brace-sparks x2 |
| `lineage-hammer-baseline` | _control_ | cooldown | 0 | — | 0.00 | — | 11 | — |
| `lineage-axe-tempo` | tempo | dot | 1 | 160800 | 0.33 | +0.0% | 5 | tempo.ghost-strike x21 |
| `lineage-axe-kill-chain` | kill-chain | dot | 2 | 82500 | 0.67 | +100.0% | 3 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | dot | 1 | 160800 | 0.33 | +0.0% | 5 | empowered.weak-point x2 |
| `lineage-axe-baseline` | _control_ | dot | 1 | 154700 | 0.33 | — | 5 | — |
| `lineage-dagger-affliction` | affliction | reload | 3 | 55367 | 1.00 | +50.0% | 3 | affliction.venom-pips x108 |
| `lineage-dagger-control` | control | reload | 3 | 52233 | 1.00 | +50.0% | 3 | control.frost-drag x38 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 2 | 83800 | 0.67 | +0.0% | 3 | — |
| `lineage-dagger-baseline` | _control_ | reload | 2 | 82600 | 0.67 | — | 4 | — |

### `node-t2-desert-05` — Basilisk 50% / Scorpion 50% (desert T2; shared by 1 authored node)

Dominant family **Basilisk** drops `empowered`, punishes `tempo`. Authored Basilisk 50% / Scorpion 50%; unfieldable at T2: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 3 | 53000 | 1.00 | +0.0% | 1 | kill-chain.kill-pulse x2 |
| `lineage-broadsword-empowered` | empowered | energy | 3 | 50867 | 1.00 | +0.0% | 2 | empowered.weak-point x4 |
| `lineage-broadsword-tempo` | tempo | energy | 3 | 50733 | 1.00 | +0.0% | 2 | tempo.ghost-strike x26 |
| `lineage-broadsword-baseline` | _control_ | energy | 3 | 50733 | 1.00 | — | 2 | — |
| `lineage-rapier-tempo` | tempo | cadence | 0 | — | 0.00 | — | 16 | tempo.ghost-strike x8 |
| `lineage-rapier-affliction` | affliction | cadence | 0 | — | 0.00 | — | 16 | affliction.bleed-pips x20 |
| `lineage-rapier-engagement` | engagement | cadence | 0 | — | 0.00 | — | 16 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | cadence | 0 | — | 0.00 | — | 16 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 0 | — | 0.00 | — | 10 | empowered.plating-crack x2 |
| `lineage-hammer-control` | control | cooldown | 0 | — | 0.00 | — | 10 | control.frost-drag x2 |
| `lineage-hammer-engagement` | engagement | cooldown | 0 | — | 0.00 | — | 11 | engagement.brace-sparks x2 |
| `lineage-hammer-baseline` | _control_ | cooldown | 0 | — | 0.00 | — | 10 | — |
| `lineage-axe-tempo` | tempo | dot | 2 | 86450 | 0.67 | +0.0% | 4 | tempo.ghost-strike x21 |
| `lineage-axe-kill-chain` | kill-chain | dot | 2 | 79250 | 0.67 | +0.0% | 4 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | dot | 1 | 167800 | 0.33 | -50.0% | 6 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | dot | 2 | 86450 | 0.67 | — | 4 | — |
| `lineage-dagger-affliction` | affliction | reload | 2 | 83700 | 0.67 | +0.0% | 4 | affliction.venom-pips x111 |
| `lineage-dagger-control` | control | reload | 1 | 164400 | 0.33 | -50.0% | 5 | control.frost-drag x38 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 2 | 83150 | 0.67 | +0.0% | 4 | — |
| `lineage-dagger-baseline` | _control_ | reload | 2 | 81600 | 0.67 | — | 4 | — |

