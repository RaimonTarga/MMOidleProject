# Lineage lane matrix — Tier 1 and 2

Generated 2026-10-01T23:51:56.869Z from `d2910a3b1345c6d8a94d7457a63d1308fa8bcf3d`.
40 lane reference profiles (band 1: 20, band 2: 20) x 60 distinct node blends, plus 36 frame references x up to 12 nodes, x 2 seeds (101009, 101033), 90 s of sim per cell per seed; 4484 measured runs; wall clock 66.3 min.

Throughput is kills per minute of SIM time with repopulation on; TTK is engaged
milliseconds per kill, which divides out the walk between mobs. Uplift is the
cell against the SAME lineage’s lane-less control on the SAME node — the only
reading in which the lane, and not the class or the weapon, is the variable.

The criteria are design §18.9's, which replaced §9's: the lane budget band is the
median uplift **±3 percentage points, absolute**, and the encounter check is an
**ordinal** reading — does the favoured lane out-uplift the punished lane on that
family's own node, and by what margin? The margin is reported, never thresholded.

RUN 4 ADDS THE SECOND BAND. Run 3 measured only a Tier-1 band, so every Tier-2
row it produced was reading the gear gap at the gate rather than the lane (a T1
band scored 1.6 kills against 7.0 deaths per cell on Tier-2 Desert). Band 2 is the
character the Tier-2 gate hands over: the lineage's tier-2 form, the tier-2 form of
every armour/charm/boot the band-1 reference wears, and the T2 stat/payoff/amplifier
rows on top of the T1 band it bought on the way. Class, frame and ability package
are held fixed across the bands, so a band-1 and band-2 row of one lane are the same
build one tier apart.

Band 1 still runs on BOTH tiers, unchanged, so run 3 and run 4 can be laid side by
side — those rows remain the "what does a Tier-1 lane still buy you here" reading.
Band 2 runs on TIER-2 NODES ONLY, and that omission is deliberate: a Tier-2 band on
a Tier-1 node is a character farming a tier behind its own gear, which §18.9 asks
nothing about, and including it would have added roughly a thousand runs to say so.

Every control is BAND-MATCHED. A band-2 lane measured against the band-1 control
would report the tier step as the lane's uplift, which is exactly the confusion
run 3 ran into. One known confound remains and is not hidden: the tier-2 form a
band-2 row wears carries a CAPSTONE whose lane is fixed per lineage (the Rapier's
Gale Needle crowns Tempo, the Axe's Ruinous Axe crowns Tempo, the Hammer's Quake
Hammer crowns Empowered, the Dagger's Mirebrand crowns Control, the Broadsword's
Knight Steelsword crowns Kill chain). It is in the control too, so most of it
divides out, but it still favours one of each lineage's three lanes. The
family-contract instrument (`family-contracts-run4.md`) is the arbiter that does
not depend on this.

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

**Tier 1 node, Band 1 (T1 cards, T1 gear)**

| profile | lane | class | t1-mountain-01 | t1-mountain-02 | t1-mountain-03 | t1-mountain-04 | t1-mountain-05 | t1-cave-01 | t1-cave-02 | t1-cave-03 | t1-cave-04 | t1-cave-05 | t1-forest-01 | t1-forest-02 | t1-forest-03 | t1-forest-04 | t1-forest-05 | t1-plains-01 | t1-plains-02 | t1-plains-03 | t1-plains-04 | t1-plains-05 | t1-swamp-01 | t1-swamp-02 | t1-swamp-03 | t1-swamp-04 | t1-swamp-05 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-technique` | technique | energy | 8153 | 6524 | 5930 | 6850 | 6478 | 3544 | 7475 | 6019 | 4559 | 4715 | 2148 | 4287 | 2788 | 2374 | 2810 | 2823 | 1967 | 2874 | 2238 | 2602 | 5300 | 3756 | 3759 | 5247 | 4956 |
| `lineage-broadsword-kill-chain` | kill-chain | energy | 7772 | 6306 | 5919 | 7794 | 7488 | 3425 | 7519 | 6056 | 4690 | 4659 | 2500 | 4842 | 3083 | 2698 | 2900 | 2664 | 1817 | 2620 | 2587 | 2624 | 5700 | 3796 | 3871 | 5150 | 4453 |
| `lineage-broadsword-empowered` | empowered | energy | 7206 | 5800 | 5636 | 6767 | 6922 | 3421 | 7547 | 4160 | 3925 | 4876 | 2404 | 4277 | 2815 | 2621 | 3241 | 2866 | 2035 | 2738 | 2342 | 2655 | 5356 | 3928 | 4041 | 5033 | 5224 |
| `lineage-broadsword-baseline` | _control_ | energy | 8153 | 5800 | 5930 | 6850 | 6478 | 4059 | 7475 | 6019 | 4980 | 4715 | 2619 | 5131 | 2894 | 3050 | 3641 | 2866 | 2035 | 2738 | 2342 | 2655 | 5300 | 3756 | 3759 | 5247 | 4956 |
| `lineage-rapier-tempo` | tempo | cadence | 6294 | 5505 | 4900 | 5559 | 5828 | 2613 | 7417 | 4056 | 3505 | 3370 | 1784 | 3640 | 2679 | 2174 | 2685 | 2146 | 1398 | 2245 | 1754 | 1988 | 5000 | 3450 | 3811 | 3978 | 4412 |
| `lineage-rapier-affliction` | affliction | cadence | 6453 | 6267 | 5411 | 6544 | 6033 | 3148 | 6967 | 4100 | 4247 | 3376 | 2113 | 4319 | 2731 | 2456 | 2432 | 2055 | 1459 | 2533 | 1800 | 2098 | 5585 | 3888 | 3939 | 4581 | 5264 |
| `lineage-rapier-engagement` | engagement | cadence | 5953 | 5350 | 4795 | 5444 | 5706 | 2206 | 6462 | 3933 | 3889 | 3518 | 1986 | 3476 | 2620 | 2295 | 2482 | 1910 | 1439 | 2094 | 1609 | 1907 | 4550 | 2889 | 3326 | 4356 | 4067 |
| `lineage-rapier-baseline` | _control_ | cadence | 6569 | 6607 | 5671 | 6840 | 6089 | 3272 | 8745 | 4144 | 4468 | 3695 | 2164 | 4533 | 2731 | 2641 | 2684 | 2267 | 1625 | 2500 | 1962 | 2065 | 5585 | 3954 | 4194 | 5207 | 5264 |
| `lineage-hammer-empowered` | empowered | cooldown | 5638 | 5356 | 5806 | 5847 | 5644 | 2917 | 4346 | 3650 | 2848 | 3050 | 2342 | 5165 | 3320 | 3097 | 2724 | 2983 | 1992 | 3183 | 2456 | 2330 | 4814 | 4656 | 3547 | 4744 | 4144 |
| `lineage-hammer-control` | control | cooldown | 5638 | 5172 | 5806 | 5317 | 5341 | 2917 | 4162 | 3500 | 2848 | 2760 | 2342 | 4520 | 3320 | 2554 | 2724 | 2983 | 1992 | 3183 | 2456 | 2330 | 4262 | 2942 | 3400 | 3752 | 4425 |
| `lineage-hammer-engagement` | engagement | cooldown | 5106 | 5833 | 5947 | 5278 | 4958 | 3143 | 4500 | 3500 | 2857 | 2724 | 2085 | 4544 | 3324 | 2608 | 2589 | 3069 | 1992 | 3217 | 2456 | 2438 | 4262 | 2956 | 3400 | 3752 | 4271 |
| `lineage-hammer-baseline` | _control_ | cooldown | 6153 | 5356 | 5594 | 6400 | 5713 | 2917 | 4821 | 3650 | 2967 | 3163 | 2342 | 5165 | 3320 | 3097 | 2724 | 2983 | 1992 | 3183 | 2456 | 2330 | 5833 | 4656 | 3694 | 4861 | 4150 |
| `lineage-axe-tempo` | tempo | dot | 8964 | 8545 | 7831 | 8608 | 8825 | 4288 | 7738 | 7554 | 5728 | 5012 | 3279 | 5115 | 4379 | 3044 | 3694 | 3577 | 2545 | 3691 | 3251 | 3431 | 6514 | 4814 | 5400 | 4774 | 5468 |
| `lineage-axe-kill-chain` | kill-chain | dot | 9179 | 8927 | 7606 | 8669 | 8785 | 3784 | 8443 | 6000 | 4675 | 6267 | 3396 | 4531 | 3970 | 4093 | 4636 | 3351 | 2670 | 3942 | 3167 | 3364 | 7767 | 5000 | 5638 | 6563 | 5850 |
| `lineage-axe-empowered` | empowered | dot | 8964 | 8545 | 7831 | 8608 | 8825 | 4281 | 8492 | 6154 | 4063 | 6521 | 3449 | 4717 | 4379 | 2973 | 3918 | 3413 | 2545 | 3791 | 3251 | 3431 | 6708 | 4895 | 5894 | 6862 | 6088 |
| `lineage-axe-baseline` | _control_ | dot | 8964 | 8545 | 8315 | 8608 | 8750 | 4288 | 7869 | 7223 | 5255 | 5944 | 3279 | 4928 | 4379 | 3479 | 3800 | 3577 | 2545 | 3691 | 3251 | 3431 | 6508 | 4862 | 5775 | 6386 | 6575 |
| `lineage-dagger-affliction` | affliction | reload | 6512 | 6047 | 6055 | 6218 | 6478 | 3192 | 7006 | 4700 | 3678 | 3363 | 2665 | 4610 | 3158 | 3115 | 3266 | 2793 | 1960 | 2972 | 2388 | 2544 | 5300 | 3783 | 4114 | 4874 | 4853 |
| `lineage-dagger-control` | control | reload | 6571 | 6206 | 5695 | 6206 | 6037 | 3350 | 6847 | 4741 | 4555 | 3948 | 2688 | 4094 | 3208 | 2925 | 2956 | 2684 | 1943 | 2893 | 2385 | 2440 | 5313 | 3629 | 4075 | 4242 | 4611 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 7471 | 6571 | 6268 | 7280 | 6644 | 3883 | 7353 | 5636 | 4900 | 3929 | 3136 | 4457 | 3412 | 3067 | 3061 | 2861 | 2116 | 3303 | 2528 | 2763 | 5741 | 3946 | 4817 | 5612 | 5011 |
| `lineage-dagger-baseline` | _control_ | reload | 7327 | 6564 | 6850 | 7736 | 7000 | 4670 | 7179 | 5493 | 4847 | 4064 | 3086 | 4557 | 3609 | 3562 | 3254 | 2973 | 2257 | 3367 | 2658 | 2712 | 5647 | 3821 | 4233 | 5506 | 5318 |

**Tier 1 node, Band 2 (T2 cards, T2 gear)**

| profile | lane | class | t1-mountain-01 | t1-mountain-02 | t1-mountain-03 | t1-mountain-04 | t1-mountain-05 | t1-cave-01 | t1-cave-02 | t1-cave-03 | t1-cave-04 | t1-cave-05 | t1-forest-01 | t1-forest-02 | t1-forest-03 | t1-forest-04 | t1-forest-05 | t1-plains-01 | t1-plains-02 | t1-plains-03 | t1-plains-04 | t1-plains-05 | t1-swamp-01 | t1-swamp-02 | t1-swamp-03 | t1-swamp-04 | t1-swamp-05 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-technique-t2` | technique | energy | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-broadsword-kill-chain-t2` | kill-chain | energy | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-broadsword-empowered-t2` | empowered | energy | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-broadsword-baseline-t2` | _control_ | energy | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-rapier-tempo-t2` | tempo | cadence | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-rapier-affliction-t2` | affliction | cadence | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-rapier-engagement-t2` | engagement | cadence | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-rapier-baseline-t2` | _control_ | cadence | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-hammer-empowered-t2` | empowered | cooldown | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-hammer-control-t2` | control | cooldown | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-hammer-engagement-t2` | engagement | cooldown | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-hammer-baseline-t2` | _control_ | cooldown | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-axe-tempo-t2` | tempo | dot | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-axe-kill-chain-t2` | kill-chain | dot | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-axe-empowered-t2` | empowered | dot | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-axe-baseline-t2` | _control_ | dot | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-dagger-affliction-t2` | affliction | reload | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-dagger-control-t2` | control | reload | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-dagger-kill-chain-t2` | kill-chain | reload | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-dagger-baseline-t2` | _control_ | reload | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |

**Tier 2 node, Band 1 (T1 cards, T1 gear)**

| profile | lane | class | t2-forest-01 | t2-forest-02 | t2-forest-03 | t2-forest-04 | t2-forest-05 | t2-plains-01 | t2-plains-02 | t2-plains-03 | t2-plains-04 | t2-plains-05 | t2-mountain-01 | t2-mountain-02 | t2-mountain-03 | t2-mountain-04 | t2-mountain-05 | t2-cave-01 | t2-cave-02 | t2-cave-03 | t2-cave-04 | t2-cave-05 | t2-cave-06 | t2-swamp-01 | t2-swamp-02 | t2-swamp-03 | t2-swamp-05 | t2-swamp-06 | t2-jungle-01 | t2-jungle-02 | t2-jungle-03 | t2-jungle-04 | t2-desert-01 | t2-desert-02 | t2-desert-03 | t2-desert-04 | t2-desert-05 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-technique` | technique | energy | 9220 | 18144 | 8993 | 8879 | 10942 | 6465 | 3432 | 7189 | 4081 | 4266 | 31340 | 23567 | 17600 | 21743 | 26033 | 21267 | 79050 | 13525 | 36725 | 15600 | 80700 | 16300 | 13713 | 9418 | 11470 | 8764 | 50533 | 17750 | 29560 | 39675 | 41525 | 50900 | 54633 | 39675 | 34860 |
| `lineage-broadsword-kill-chain` | kill-chain | energy | 9460 | 14209 | 8494 | 9488 | 9814 | 5933 | 3919 | 12164 | 4707 | 4710 | 28940 | 21250 | 11125 | 18943 | 31580 | 28340 | 48633 | 15425 | 23900 | 14963 | 51933 | 16038 | 16429 | 7436 | 14688 | 8664 | 39875 | 17950 | 82550 | 31260 | 43075 | 44250 | 35180 | 39750 | 43900 |
| `lineage-broadsword-empowered` | empowered | energy | 9056 | 18000 | 9040 | 8853 | 10842 | 5550 | 3008 | 7019 | 4618 | 4916 | 31340 | 23567 | 20400 | 21343 | 19629 | 21600 | 77850 | 15100 | 27340 | 18157 | 81000 | 15425 | 14200 | 8945 | 14100 | 8964 | 50533 | 20214 | 51700 | 31660 | 41575 | 50900 | 55533 | 56467 | 35400 |
| `lineage-broadsword-baseline` | _control_ | energy | 7965 | 18144 | 9007 | 8726 | 11233 | 5835 | 3181 | 7189 | 4826 | 4269 | 31340 | 23567 | 19800 | 15144 | 26033 | 21267 | 79050 | 13525 | 36725 | 15600 | 80700 | 16300 | 13713 | 9418 | 11470 | 8764 | 50533 | 17750 | 29560 | 39675 | 41525 | 50900 | 54633 | 39675 | 34860 |
| `lineage-rapier-tempo` | tempo | cadence | 11950 | 15371 | 10058 | 11462 | 9369 | 6690 | 2677 | 5739 | 3807 | 5229 | 18275 | 17029 | 16222 | 36575 | 38675 | 16917 | 46467 | 8340 | 16750 | 32875 | 155300 | 13500 | 33200 | 7936 | 9591 | 14213 | 49067 | 8909 | 26660 | 12967 | — | — | — | — | — |
| `lineage-rapier-affliction` | affliction | cadence | 11391 | 15043 | 10009 | 11780 | 10527 | 6874 | 2882 | 5604 | 4237 | 5171 | 17413 | 17443 | 20486 | 28100 | 39000 | 16117 | 47067 | 8610 | 17217 | 33325 | 155300 | 13988 | 26280 | 7764 | 15714 | 22460 | 46667 | 13171 | 32150 | 23900 | — | — | — | — | — |
| `lineage-rapier-engagement` | engagement | cadence | 9608 | 15671 | 7618 | 10550 | 10950 | 4948 | 2627 | 5613 | 7429 | 6085 | 15122 | 16657 | 17713 | 35525 | 30680 | 15433 | 45900 | 7910 | 29300 | 32275 | 154600 | 9560 | 15338 | 5692 | 16129 | 12613 | 48733 | 14300 | 25660 | 19950 | — | — | — | — | — |
| `lineage-rapier-baseline` | _control_ | cadence | 12510 | 18550 | 10073 | 10708 | 8814 | 6470 | 3071 | 7500 | 8400 | 8819 | 19929 | 16814 | 21971 | 36850 | 51500 | 11643 | 47733 | 10075 | 14933 | 33625 | 156700 | 10556 | 14071 | 8260 | 19200 | 10722 | 48367 | 12886 | 32950 | 24100 | — | — | — | — | — |
| `lineage-hammer-empowered` | empowered | cooldown | 10300 | 24120 | 14913 | 8463 | 12491 | 6944 | 3852 | 10985 | 5827 | 7342 | 21800 | 14650 | 20243 | 27100 | 38350 | 14933 | — | 11100 | 29625 | 79250 | 45167 | 7470 | 12525 | 6077 | 9055 | 8760 | 49133 | 17717 | 32275 | 34800 | — | 129600 | 76900 | 48100 | — |
| `lineage-hammer-control` | control | cooldown | 10264 | 24120 | 14913 | 8463 | 12491 | 6944 | 3766 | 9771 | 5668 | 6763 | 18957 | 14650 | 14020 | 35925 | 38775 | 21740 | — | 11100 | 30825 | 79250 | 45167 | 7620 | 12888 | 6077 | 8475 | 8510 | 49267 | 17717 | 34150 | 34750 | 73700 | 67850 | 51900 | 48100 | 75600 |
| `lineage-hammer-engagement` | engagement | cooldown | 10336 | 24280 | 14913 | 10992 | 9875 | 5857 | 3652 | 9667 | 5586 | 6779 | 19671 | 13238 | 16167 | 36025 | 39000 | 21900 | — | 10800 | 30250 | 47267 | 161400 | 7590 | 14200 | 4879 | 8033 | 8450 | 49267 | 17400 | 33100 | 34750 | 75200 | 37350 | 78450 | 48533 | 51033 |
| `lineage-hammer-baseline` | _control_ | cooldown | 10100 | 23140 | 14913 | 7818 | 13850 | 6944 | 3793 | 12125 | 5827 | 7342 | 23250 | 14650 | 20414 | 27700 | 38775 | 14933 | — | 11300 | 29625 | 79250 | 45167 | 9700 | 12500 | 5079 | 8973 | 6169 | 48333 | 14471 | 47167 | 35075 | — | — | — | — | — |
| `lineage-axe-tempo` | tempo | dot | 9100 | 24117 | 9327 | 7695 | 9693 | 6226 | 3903 | 8933 | 6878 | 6690 | 27100 | 19383 | 22086 | 28260 | 26220 | 19067 | 75050 | 19750 | 26260 | 32150 | 34550 | 10256 | 12475 | 8833 | 9550 | 10440 | 46933 | 15238 | 50400 | 26400 | 81600 | — | 84150 | 165700 | 85300 |
| `lineage-axe-kill-chain` | kill-chain | dot | 8729 | 18375 | 10664 | 13727 | 9041 | 6395 | 4291 | 8371 | 5919 | 8100 | 28380 | 24380 | 15070 | 28060 | 45000 | 23940 | 46733 | 30200 | 26720 | 18717 | 159100 | 11750 | 13963 | 11100 | 11567 | 9970 | 30420 | 16929 | 50667 | 23033 | 58733 | — | 82500 | 152200 | 163800 |
| `lineage-axe-empowered` | empowered | dot | 7542 | 24117 | 9327 | 8244 | 9647 | 6389 | 3887 | 9164 | 6878 | 7175 | 27100 | 15429 | 22086 | 28260 | 26220 | 22720 | 75050 | 19550 | 18767 | 32275 | 46733 | 10056 | 12225 | 8833 | 11067 | 10210 | 37525 | 14075 | 50367 | 34925 | 55100 | — | 84300 | 158700 | 56733 |
| `lineage-axe-baseline` | _control_ | dot | 9100 | 25083 | 12733 | 7695 | 9025 | 6226 | 3903 | 8933 | 6878 | 6690 | 27420 | 18817 | 24657 | 28100 | 33150 | 19067 | 75050 | 19750 | 26260 | 32150 | 34550 | 9667 | 12500 | 8833 | 9430 | 9460 | 46933 | 15238 | 50400 | 26400 | 85600 | — | 84150 | 158100 | 85300 |
| `lineage-dagger-affliction` | affliction | reload | 11608 | 17250 | 7900 | 10860 | 10179 | 6315 | 3990 | 9707 | 5955 | 8111 | 17457 | 12044 | 18800 | 14350 | 29420 | 14914 | 46200 | 11988 | 20583 | 21400 | 32400 | 8810 | 9050 | 7691 | 9730 | 9170 | 31120 | 14244 | 18400 | 28020 | 42425 | 38900 | 32200 | 56633 | 39700 |
| `lineage-dagger-control` | control | reload | 9133 | 12355 | 7200 | 7911 | 8813 | 6742 | 3578 | 6587 | 5062 | 5927 | 22117 | 9100 | 16513 | 12656 | 23517 | 14671 | 48067 | 10300 | 16529 | 17983 | 46800 | 8209 | 9956 | 6258 | 8700 | 8700 | 17500 | 19714 | 23383 | 16971 | 39500 | 39975 | 41000 | 56633 | 39600 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 9412 | 13860 | 7457 | 8370 | 10079 | 6157 | 3712 | 7875 | 7383 | 7270 | 20071 | 11288 | 14522 | 19300 | 21317 | 15329 | 72050 | 14314 | 20817 | 25680 | 71200 | 7691 | 12413 | 7933 | 10611 | 11422 | 53000 | 20383 | 35075 | 29200 | 33300 | 38150 | 58300 | 43350 | 39575 |
| `lineage-dagger-baseline` | _control_ | reload | 9944 | 14618 | 9346 | 11917 | 9463 | 8012 | 4158 | 13467 | 7353 | 6890 | 28100 | 16386 | 21700 | 20200 | 19733 | 12033 | 45100 | 14500 | 24680 | 18433 | 46233 | 10667 | 10422 | 7745 | 8727 | 10011 | 37700 | 20233 | 38150 | 20150 | 33460 | 54000 | 41050 | 84100 | 40275 |

**Tier 2 node, Band 2 (T2 cards, T2 gear)**

| profile | lane | class | t2-forest-01 | t2-forest-02 | t2-forest-03 | t2-forest-04 | t2-forest-05 | t2-plains-01 | t2-plains-02 | t2-plains-03 | t2-plains-04 | t2-plains-05 | t2-mountain-01 | t2-mountain-02 | t2-mountain-03 | t2-mountain-04 | t2-mountain-05 | t2-cave-01 | t2-cave-02 | t2-cave-03 | t2-cave-04 | t2-cave-05 | t2-cave-06 | t2-swamp-01 | t2-swamp-02 | t2-swamp-03 | t2-swamp-05 | t2-swamp-06 | t2-jungle-01 | t2-jungle-02 | t2-jungle-03 | t2-jungle-04 | t2-desert-01 | t2-desert-02 | t2-desert-03 | t2-desert-04 | t2-desert-05 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-technique-t2` | technique | energy | 5636 | 11293 | 5252 | 6957 | 6583 | 3261 | 2058 | 3947 | 2934 | 2870 | 17889 | 8633 | 9200 | 15980 | 18900 | 11727 | 25550 | 7031 | 14082 | 13800 | 26883 | 7338 | 7213 | 5081 | 6994 | 5939 | 19425 | 8686 | 17000 | 16511 | 19325 | 20088 | 18611 | 15730 | 17556 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | energy | 6452 | 10075 | 5396 | 6848 | 6309 | 3642 | 2047 | 4250 | 3833 | 4094 | 17600 | 9447 | 10236 | 13427 | 17100 | 10831 | 31960 | 10215 | 14370 | 14180 | 19400 | 6405 | 8133 | 5511 | 7618 | 7076 | 17578 | 8793 | 16733 | 16156 | 19338 | 22188 | 20625 | 17400 | 20838 |
| `lineage-broadsword-empowered-t2` | empowered | energy | 5670 | 11086 | 4974 | 6370 | 5741 | 3446 | 2222 | 3916 | 3030 | 3407 | 16570 | 8560 | 9321 | 12208 | 17875 | 8331 | 23783 | 6906 | 15110 | 12273 | 26517 | 7306 | 6776 | 5389 | 7571 | 5942 | 17044 | 8377 | 17433 | 13991 | 17700 | 18478 | 20238 | 16756 | 17744 |
| `lineage-broadsword-baseline-t2` | _control_ | energy | 6329 | 12223 | 5752 | 7345 | 6154 | 2853 | 2203 | 3864 | 3166 | 3480 | 18233 | 8653 | 10423 | 14282 | 19875 | 10882 | 24117 | 6678 | 11383 | 12845 | 27083 | 7331 | 5460 | 5379 | 6489 | 6216 | 18222 | 8586 | 20163 | 16433 | 20400 | 19725 | 19625 | 18311 | 20000 |
| `lineage-rapier-tempo-t2` | tempo | cadence | 5231 | 7772 | 5288 | 5148 | 5632 | 4400 | 1854 | 3046 | 3536 | 4484 | 15144 | 9057 | 7606 | 16078 | 16667 | 8008 | 22000 | 5289 | 12600 | 12744 | 17163 | 6324 | 6238 | 3774 | 6853 | 5270 | 14620 | 7743 | 15520 | 13118 | 11764 | 10945 | 9792 | 10442 | 11236 |
| `lineage-rapier-affliction-t2` | affliction | cadence | 5319 | 6662 | 5472 | 5003 | 5475 | 3581 | 1803 | 3690 | 3495 | 3982 | 15289 | 8236 | 7276 | 16067 | 16722 | 8215 | 30300 | 5272 | 13067 | 11470 | 15333 | 8164 | 6893 | 4432 | 5739 | 6013 | 13073 | 6840 | 13855 | 11100 | 11655 | 10075 | 9900 | 11518 | 11018 |
| `lineage-rapier-engagement-t2` | engagement | cadence | 4136 | 6668 | 4252 | 4552 | 5004 | 3054 | 1614 | 3268 | 2526 | 2858 | 16456 | 9100 | 6900 | 11742 | 13182 | 8029 | 25267 | 4311 | 11427 | 9138 | 13260 | 4926 | 5076 | 3338 | 5195 | 4678 | 10962 | 5824 | 12558 | 9621 | 9167 | 9075 | 9358 | 9133 | 9258 |
| `lineage-rapier-baseline-t2` | _control_ | cadence | 6212 | 9857 | 5600 | 5577 | 5591 | 4991 | 2176 | 3595 | 4568 | 3188 | 21514 | 10400 | 10892 | 20986 | 13755 | 7262 | 30820 | 7760 | 16513 | 12820 | 17450 | 8585 | 8085 | 4900 | 5856 | 8157 | 14890 | 9008 | 17700 | 13645 | 15850 | 14711 | 11950 | 16263 | 13711 |
| `lineage-hammer-empowered-t2` | empowered | cooldown | 6279 | 10923 | 5923 | 6600 | 7763 | 6256 | 2335 | 5300 | 5607 | 4931 | 15178 | 7867 | 8820 | 17950 | 19125 | 7692 | 29440 | 5224 | 20000 | 15889 | 20457 | 8408 | 7264 | 5500 | 6920 | 5336 | 15511 | 8392 | 16111 | 15856 | 15133 | 16875 | 14944 | 15111 | 17113 |
| `lineage-hammer-control-t2` | control | cooldown | 6292 | 11567 | 5991 | 5460 | 7679 | 6284 | 2130 | 4575 | 4990 | 4931 | 14480 | 7707 | 8513 | 13720 | 16022 | 6464 | 37650 | 5224 | 17313 | 10400 | 17513 | 6785 | 7508 | 3918 | 6093 | 6569 | 15522 | 8825 | 17133 | 13560 | 14933 | 13500 | 10692 | 15367 | 16556 |
| `lineage-hammer-engagement-t2` | engagement | cooldown | 6292 | 11583 | 5938 | 5460 | 7732 | 6284 | 2136 | 5261 | 4990 | 5057 | 15467 | 6825 | 8287 | 13810 | 16300 | 7692 | 37725 | 5224 | 17350 | 10445 | 17988 | 6785 | 7279 | 3914 | 5475 | 5307 | 15600 | 8369 | 17144 | 13600 | 17363 | 11267 | 12910 | 15378 | 14650 |
| `lineage-hammer-baseline-t2` | _control_ | cooldown | 8116 | 13127 | 6552 | 7515 | 7763 | 5977 | 2329 | 8315 | 7423 | 6687 | 13930 | 7867 | 9843 | 17775 | 14540 | 11520 | 30960 | 5588 | 20000 | 16788 | 24550 | 8617 | 8185 | 5500 | 6240 | 5521 | 17863 | 10536 | 18863 | 18513 | 17538 | 16813 | 16775 | 16338 | 16863 |
| `lineage-axe-tempo-t2` | tempo | dot | 7775 | 14491 | 7494 | 7605 | 7314 | 4279 | 2582 | 4611 | 3702 | 4410 | 19025 | 12240 | 11508 | 14922 | 17788 | 11110 | 36225 | 9064 | 18100 | 13811 | 24867 | 8077 | 8092 | 6033 | 7971 | 8954 | 16767 | 11460 | 19738 | 18850 | 22000 | 22871 | 29533 | 25783 | 23800 |
| `lineage-axe-kill-chain-t2` | kill-chain | dot | 7638 | 15700 | 7929 | 9459 | 8289 | 4787 | 2616 | 4184 | 3660 | 3768 | 13500 | 15567 | 9700 | 19057 | 23167 | 13850 | 23800 | 9429 | 14744 | 24633 | 24750 | 7569 | 9192 | 6100 | 8546 | 8421 | 24667 | 9558 | 13182 | 17950 | 27383 | 24757 | 27483 | 24186 | 20275 |
| `lineage-axe-empowered-t2` | empowered | dot | 6986 | 12767 | 6979 | 8200 | 8089 | 3363 | 2418 | 4329 | 3797 | 4486 | 16411 | 11417 | 10169 | 13260 | 10667 | 10055 | 37750 | 8233 | 10464 | 13889 | 17338 | 7100 | 8738 | 4769 | 7900 | 7973 | 16978 | 10860 | 13960 | 17189 | 16160 | 20200 | 20463 | 21788 | 20038 |
| `lineage-axe-baseline-t2` | _control_ | dot | 8261 | 10427 | 7589 | 8305 | 6924 | 4806 | 2609 | 4779 | 3327 | 5039 | 18613 | 11008 | 9893 | 16925 | 15489 | 11110 | 37650 | 9143 | 16356 | 13856 | 24867 | 8758 | 8677 | 6093 | 7864 | 9215 | 20525 | 9123 | 19413 | 18950 | 21886 | 23114 | 24629 | 25333 | 26833 |
| `lineage-dagger-affliction-t2` | affliction | reload | 6504 | 9360 | 5742 | 6843 | 6104 | 3261 | 2639 | 3400 | 3024 | 3574 | 14991 | 6179 | 11292 | 11462 | 11123 | 11767 | 22700 | 8393 | 14645 | 17411 | 23629 | 6644 | 6033 | 4625 | 6095 | 6040 | 13675 | 8812 | 15427 | 13775 | 19100 | 14864 | 15000 | 13367 | 13808 |
| `lineage-dagger-control-t2` | control | reload | 5452 | 8806 | 5620 | 5273 | 5685 | 3698 | 2787 | 4291 | 3333 | 3140 | 11093 | 5876 | 7958 | 9075 | 9693 | 10746 | 22429 | 6533 | 12817 | 10257 | 17944 | 5129 | 6100 | 4939 | 6381 | 5690 | 12462 | 8141 | 12492 | 13636 | 15036 | 12446 | 13742 | 13133 | 13558 |
| `lineage-dagger-kill-chain-t2` | kill-chain | reload | 6716 | 11869 | 6196 | 7323 | 7030 | 4133 | 2982 | 4635 | 4277 | 4064 | 16760 | 7094 | 10293 | 11692 | 13708 | 9513 | 26750 | 8319 | 15510 | 18556 | 23471 | 6174 | 6021 | 4817 | 6476 | 6320 | 15255 | 9169 | 21788 | 16160 | 16810 | 19222 | 18944 | 19256 | 18911 |
| `lineage-dagger-baseline-t2` | _control_ | reload | 6867 | 12000 | 5820 | 7895 | 7632 | 3655 | 2962 | 5206 | 3348 | 3537 | 16540 | 8500 | 12700 | 12858 | 12433 | 9607 | 26350 | 10300 | 20075 | 20863 | 20113 | 7033 | 6079 | 5013 | 6542 | 6717 | 15373 | 8981 | 17320 | 14164 | 16790 | 19244 | 19033 | 17160 | 18889 |

### The same table as uplift over each lineage’s own control

**Tier 1 node, Band 1 (T1 cards, T1 gear)**

| profile | lane | class | t1-mountain-01 | t1-mountain-02 | t1-mountain-03 | t1-mountain-04 | t1-mountain-05 | t1-cave-01 | t1-cave-02 | t1-cave-03 | t1-cave-04 | t1-cave-05 | t1-forest-01 | t1-forest-02 | t1-forest-03 | t1-forest-04 | t1-forest-05 | t1-plains-01 | t1-plains-02 | t1-plains-03 | t1-plains-04 | t1-plains-05 | t1-swamp-01 | t1-swamp-02 | t1-swamp-03 | t1-swamp-04 | t1-swamp-05 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-technique` | technique | energy | +0.0% | -5.6% | +0.0% | +0.0% | +0.0% | +13.6% | +0.0% | +0.0% | +10.0% | +0.0% | +23.4% | +15.4% | +3.2% | +15.0% | +17.6% | +13.2% | +2.0% | -8.5% | +4.7% | +2.4% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-broadsword-kill-chain` | kill-chain | energy | +20.0% | +0.0% | +5.0% | -11.1% | -11.1% | +9.1% | +0.0% | +0.0% | +5.0% | +10.0% | +4.3% | +19.2% | -6.5% | +17.5% | +5.9% | +23.7% | +15.7% | +4.3% | -9.3% | +7.1% | +0.0% | +0.0% | -4.5% | +17.6% | +5.6% |
| `lineage-broadsword-empowered` | empowered | energy | +20.0% | +0.0% | +10.0% | +0.0% | +0.0% | +9.1% | -6.3% | +25.0% | +20.0% | +5.0% | +6.4% | +19.2% | +9.7% | +5.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | -5.9% | +0.0% | +0.0% | +23.5% | -5.6% |
| `lineage-rapier-tempo` | tempo | cadence | +0.0% | +42.9% | +9.5% | +13.3% | +0.0% | +20.0% | +9.1% | +0.0% | +15.8% | +9.5% | +28.2% | +11.1% | -3.4% | +23.5% | +3.1% | +0.0% | -1.7% | -4.5% | +4.0% | +2.0% | +0.0% | -15.4% | +5.9% | +20.0% | +21.4% |
| `lineage-rapier-affliction` | affliction | cadence | +6.3% | +7.1% | -9.5% | +6.7% | +0.0% | +0.0% | +9.1% | +0.0% | +0.0% | +0.0% | -2.6% | +0.0% | +0.0% | +5.9% | +6.3% | +10.9% | +10.0% | -4.5% | +4.0% | -10.2% | +0.0% | +0.0% | +5.9% | +6.7% | +0.0% |
| `lineage-rapier-engagement` | engagement | cadence | +6.3% | +42.9% | +4.8% | +20.0% | +0.0% | +32.0% | +18.2% | +0.0% | +0.0% | +4.8% | +12.8% | +22.2% | +3.4% | +11.8% | +6.3% | +10.9% | +1.7% | +11.4% | +14.0% | -10.2% | +23.1% | +3.8% | +11.8% | +6.7% | +28.6% |
| `lineage-hammer-empowered` | empowered | cooldown | +6.7% | +0.0% | +0.0% | +6.3% | +0.0% | +0.0% | -7.1% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +16.7% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-hammer-control` | control | cooldown | +6.7% | +0.0% | +0.0% | +12.5% | +6.3% | +0.0% | -7.1% | +6.3% | +0.0% | +4.2% | +0.0% | +8.7% | +0.0% | +25.8% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +8.3% | +44.4% | +0.0% | +16.7% | +0.0% |
| `lineage-hammer-engagement` | engagement | cooldown | +6.7% | +0.0% | +0.0% | +12.5% | +18.8% | +0.0% | -14.3% | +6.3% | +0.0% | +4.2% | +5.3% | +8.7% | +0.0% | +22.6% | +5.9% | -2.8% | +0.0% | +0.0% | +0.0% | +0.0% | +8.3% | +38.9% | +0.0% | +16.7% | +6.3% |
| `lineage-axe-tempo` | tempo | dot | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | -10.0% | +6.3% | +0.0% | -15.6% | +0.0% | +18.4% | -11.4% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +7.7% | +4.8% | +6.3% | +35.7% | +18.8% |
| `lineage-axe-kill-chain` | kill-chain | dot | +0.0% | +0.0% | +30.8% | +0.0% | +8.3% | +11.8% | +7.7% | +15.4% | +0.0% | -6.3% | +21.1% | -9.4% | +12.5% | -23.7% | -20.0% | +16.7% | +2.4% | -2.9% | -7.7% | +12.5% | -7.7% | -9.5% | +0.0% | +14.3% | +0.0% |
| `lineage-axe-empowered` | empowered | dot | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | -5.9% | +0.0% | +0.0% | -5.0% | -12.5% | -2.6% | -9.4% | +0.0% | +18.4% | -20.0% | +3.3% | +0.0% | -5.9% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | -7.1% | +0.0% |
| `lineage-dagger-affliction` | affliction | reload | +13.3% | +21.4% | +22.2% | +21.4% | +20.0% | +25.0% | +14.3% | +7.1% | +21.1% | +9.1% | +9.1% | -3.3% | +13.0% | +38.2% | -17.1% | +0.0% | +2.0% | +0.0% | +0.0% | -7.1% | -5.9% | -4.2% | +0.0% | +18.8% | +0.0% |
| `lineage-dagger-control` | control | reload | +13.3% | +21.4% | +11.1% | +21.4% | +26.7% | +30.0% | +7.1% | +21.4% | +5.3% | -4.5% | -4.5% | +16.7% | +13.0% | +17.6% | +11.4% | +10.0% | +0.0% | +12.8% | -7.0% | +7.1% | -5.9% | +0.0% | -4.8% | +18.8% | +11.8% |
| `lineage-dagger-kill-chain` | kill-chain | reload | +13.3% | +0.0% | +5.6% | +7.1% | +6.7% | +20.0% | +7.1% | +0.0% | +5.3% | +9.1% | +0.0% | -6.7% | +13.0% | +35.3% | +17.1% | -5.0% | +0.0% | -2.6% | +9.3% | -2.4% | +0.0% | +0.0% | -14.3% | +6.3% | +5.9% |

**Tier 1 node, Band 2 (T2 cards, T2 gear)**

| profile | lane | class | t1-mountain-01 | t1-mountain-02 | t1-mountain-03 | t1-mountain-04 | t1-mountain-05 | t1-cave-01 | t1-cave-02 | t1-cave-03 | t1-cave-04 | t1-cave-05 | t1-forest-01 | t1-forest-02 | t1-forest-03 | t1-forest-04 | t1-forest-05 | t1-plains-01 | t1-plains-02 | t1-plains-03 | t1-plains-04 | t1-plains-05 | t1-swamp-01 | t1-swamp-02 | t1-swamp-03 | t1-swamp-04 | t1-swamp-05 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-technique-t2` | technique | energy | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-broadsword-kill-chain-t2` | kill-chain | energy | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-broadsword-empowered-t2` | empowered | energy | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-rapier-tempo-t2` | tempo | cadence | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-rapier-affliction-t2` | affliction | cadence | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-rapier-engagement-t2` | engagement | cadence | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-hammer-empowered-t2` | empowered | cooldown | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-hammer-control-t2` | control | cooldown | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-hammer-engagement-t2` | engagement | cooldown | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-axe-tempo-t2` | tempo | dot | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-axe-kill-chain-t2` | kill-chain | dot | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-axe-empowered-t2` | empowered | dot | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-dagger-affliction-t2` | affliction | reload | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-dagger-control-t2` | control | reload | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `lineage-dagger-kill-chain-t2` | kill-chain | reload | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |

**Tier 2 node, Band 1 (T1 cards, T1 gear)**

| profile | lane | class | t2-forest-01 | t2-forest-02 | t2-forest-03 | t2-forest-04 | t2-forest-05 | t2-plains-01 | t2-plains-02 | t2-plains-03 | t2-plains-04 | t2-plains-05 | t2-mountain-01 | t2-mountain-02 | t2-mountain-03 | t2-mountain-04 | t2-mountain-05 | t2-cave-01 | t2-cave-02 | t2-cave-03 | t2-cave-04 | t2-cave-05 | t2-cave-06 | t2-swamp-01 | t2-swamp-02 | t2-swamp-03 | t2-swamp-05 | t2-swamp-06 | t2-jungle-01 | t2-jungle-02 | t2-jungle-03 | t2-jungle-04 | t2-desert-01 | t2-desert-02 | t2-desert-03 | t2-desert-04 | t2-desert-05 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-technique` | technique | energy | -11.8% | +0.0% | +0.0% | +0.0% | +0.0% | -13.0% | -8.1% | +0.0% | +14.8% | +0.0% | +0.0% | +0.0% | +12.5% | -22.2% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-broadsword-kill-chain` | kill-chain | energy | -11.8% | +22.2% | +13.3% | -10.5% | +16.7% | +4.3% | -16.2% | -26.3% | +3.7% | +6.9% | +0.0% | +0.0% | +50.0% | -22.2% | -16.7% | -16.7% | +50.0% | +0.0% | +50.0% | +14.3% | +50.0% | +14.3% | -12.5% | +0.0% | -20.0% | +0.0% | +33.3% | +0.0% | -60.0% | +25.0% | +0.0% | +33.3% | +66.7% | +0.0% | -20.0% |
| `lineage-broadsword-empowered` | empowered | energy | -5.9% | +0.0% | +0.0% | +0.0% | +0.0% | +4.3% | +0.0% | +10.5% | +3.7% | -13.8% | +0.0% | +0.0% | +0.0% | -22.2% | +16.7% | +0.0% | +0.0% | +0.0% | +25.0% | +0.0% | +0.0% | +14.3% | +0.0% | +0.0% | -10.0% | +0.0% | +0.0% | -12.5% | -40.0% | +25.0% | +0.0% | +0.0% | +0.0% | -25.0% | +0.0% |
| `lineage-rapier-tempo` | tempo | cadence | +20.0% | +16.7% | +9.1% | +8.3% | -7.1% | +5.0% | +2.9% | +21.1% | +93.3% | +50.0% | +14.3% | +0.0% | +28.6% | +0.0% | +33.3% | -14.3% | +0.0% | +25.0% | +0.0% | +0.0% | +0.0% | -11.1% | -42.9% | +10.0% | +83.3% | -11.1% | +0.0% | +57.1% | +25.0% | +80.0% | — | — | — | — | — |
| `lineage-rapier-affliction` | affliction | cadence | +10.0% | +16.7% | +0.0% | -16.7% | -21.4% | -5.0% | +0.0% | +26.3% | +80.0% | +50.0% | +14.3% | +0.0% | +0.0% | +25.0% | +33.3% | -14.3% | +0.0% | +25.0% | +0.0% | +0.0% | +0.0% | -11.1% | -28.6% | +10.0% | +16.7% | -44.4% | +0.0% | +0.0% | +0.0% | +0.0% | — | — | — | — | — |
| `lineage-rapier-engagement` | engagement | cadence | +30.0% | +16.7% | +54.5% | +0.0% | -14.3% | +15.0% | +8.8% | +26.3% | +13.3% | +25.0% | +28.6% | +0.0% | +14.3% | +0.0% | +66.7% | -14.3% | +0.0% | +25.0% | -33.3% | +0.0% | +0.0% | +11.1% | +14.3% | +20.0% | +16.7% | -11.1% | +0.0% | +0.0% | +25.0% | +20.0% | — | — | — | — | — |
| `lineage-hammer-empowered` | empowered | cooldown | +0.0% | +0.0% | +0.0% | -5.9% | +10.0% | +0.0% | +0.0% | +8.3% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | — | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | -11.1% | -7.1% | +0.0% | -23.1% | +0.0% | -14.3% | +33.3% | +0.0% | — | — | — | — | — |
| `lineage-hammer-control` | control | cooldown | +0.0% | +0.0% | +0.0% | -5.9% | +10.0% | +0.0% | +0.0% | +16.7% | +0.0% | +0.0% | +16.7% | +0.0% | +42.9% | -20.0% | +0.0% | -16.7% | — | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | -11.1% | -7.1% | +9.1% | -23.1% | +0.0% | -14.3% | +33.3% | +0.0% | — | — | — | — | — |
| `lineage-hammer-engagement` | engagement | cooldown | +0.0% | +0.0% | +0.0% | -23.5% | +20.0% | +16.7% | +0.0% | +25.0% | +0.0% | +0.0% | +16.7% | +0.0% | +28.6% | -20.0% | +0.0% | -16.7% | — | +0.0% | +0.0% | +50.0% | -66.7% | +0.0% | -11.1% | +0.0% | +9.1% | -23.1% | +0.0% | -14.3% | +33.3% | +0.0% | — | — | — | — | — |
| `lineage-axe-tempo` | tempo | dot | +0.0% | +0.0% | +22.2% | +0.0% | -6.3% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +25.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | — | +0.0% | +0.0% | +0.0% |
| `lineage-axe-kill-chain` | kill-chain | dot | +6.3% | +33.3% | +22.2% | -42.1% | +6.3% | +0.0% | +6.5% | +13.3% | +16.7% | -20.0% | +0.0% | -16.7% | +42.9% | +0.0% | -25.0% | -16.7% | +50.0% | -33.3% | +0.0% | +50.0% | -75.0% | -11.1% | +0.0% | -11.1% | -10.0% | +0.0% | +66.7% | -12.5% | +0.0% | +20.0% | +50.0% | — | +0.0% | +0.0% | -50.0% |
| `lineage-axe-empowered` | empowered | dot | +18.8% | +0.0% | +22.2% | -5.3% | -6.3% | +0.0% | +0.0% | -6.7% | +0.0% | +0.0% | +0.0% | +16.7% | +0.0% | +0.0% | +25.0% | -16.7% | +0.0% | +0.0% | +20.0% | +0.0% | -25.0% | +0.0% | +0.0% | +0.0% | -10.0% | +0.0% | +33.3% | +0.0% | +0.0% | -20.0% | +50.0% | — | +0.0% | +0.0% | +50.0% |
| `lineage-dagger-affliction` | affliction | reload | -18.8% | -27.3% | +0.0% | +25.0% | -12.5% | +17.6% | +0.0% | +25.0% | +15.8% | -10.0% | +40.0% | +28.6% | +0.0% | +33.3% | -16.7% | -22.2% | +0.0% | +14.3% | +20.0% | +0.0% | +33.3% | +11.1% | +11.1% | +0.0% | -9.1% | +11.1% | +25.0% | +50.0% | +50.0% | -16.7% | -20.0% | +33.3% | +25.0% | +50.0% | +0.0% |
| `lineage-dagger-control` | control | reload | -6.3% | +0.0% | +7.7% | +50.0% | -6.3% | +11.8% | +3.2% | +91.7% | +36.8% | +10.0% | +20.0% | +57.1% | +14.3% | +50.0% | +0.0% | -22.2% | +0.0% | +28.6% | +40.0% | +0.0% | +0.0% | +22.2% | +0.0% | +9.1% | +0.0% | +22.2% | +100.0% | +16.7% | +50.0% | +16.7% | -20.0% | +33.3% | +0.0% | +50.0% | +0.0% |
| `lineage-dagger-kill-chain` | kill-chain | reload | +6.3% | -9.1% | +7.7% | +66.7% | -12.5% | +35.3% | +6.5% | +66.7% | -5.3% | +0.0% | +40.0% | +14.3% | +28.6% | +16.7% | +0.0% | -22.2% | -33.3% | +0.0% | +20.0% | -16.7% | -33.3% | +22.2% | -11.1% | -18.2% | -18.2% | +0.0% | -25.0% | +0.0% | +0.0% | -16.7% | +0.0% | +33.3% | -25.0% | +100.0% | +0.0% |

**Tier 2 node, Band 2 (T2 cards, T2 gear)**

| profile | lane | class | t2-forest-01 | t2-forest-02 | t2-forest-03 | t2-forest-04 | t2-forest-05 | t2-plains-01 | t2-plains-02 | t2-plains-03 | t2-plains-04 | t2-plains-05 | t2-mountain-01 | t2-mountain-02 | t2-mountain-03 | t2-mountain-04 | t2-mountain-05 | t2-cave-01 | t2-cave-02 | t2-cave-03 | t2-cave-04 | t2-cave-05 | t2-cave-06 | t2-swamp-01 | t2-swamp-02 | t2-swamp-03 | t2-swamp-05 | t2-swamp-06 | t2-jungle-01 | t2-jungle-02 | t2-jungle-03 | t2-jungle-04 | t2-desert-01 | t2-desert-02 | t2-desert-03 | t2-desert-04 | t2-desert-05 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-technique-t2` | technique | energy | +16.7% | +7.7% | +8.7% | +5.0% | -4.2% | -15.6% | +15.5% | -7.7% | +6.8% | +17.5% | +0.0% | +0.0% | +23.1% | -9.1% | +0.0% | +0.0% | +0.0% | -11.1% | -8.3% | -9.1% | +0.0% | +0.0% | -25.0% | +10.5% | -5.3% | -5.3% | -11.1% | +0.0% | +25.0% | +0.0% | +0.0% | +0.0% | +12.5% | +11.1% | +12.5% |
| `lineage-broadsword-kill-chain-t2` | kill-chain | energy | -4.2% | +23.1% | +13.0% | +15.0% | -4.2% | -15.6% | +17.2% | -12.8% | -18.2% | -15.0% | +0.0% | +0.0% | +7.7% | +0.0% | +12.5% | +18.2% | -16.7% | -27.8% | -16.7% | -9.1% | +33.3% | +18.8% | -25.0% | +0.0% | -10.5% | -10.5% | +0.0% | +0.0% | +12.5% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-broadsword-empowered-t2` | empowered | energy | +12.5% | +7.7% | +17.4% | +15.0% | +12.5% | -17.8% | +3.4% | -5.1% | +4.5% | +10.0% | +11.1% | +0.0% | +7.7% | +9.1% | +0.0% | +18.2% | +0.0% | -11.1% | -16.7% | +0.0% | +0.0% | +0.0% | -15.0% | +0.0% | -10.5% | +0.0% | +0.0% | -7.1% | +12.5% | +22.2% | +12.5% | +12.5% | +0.0% | +0.0% | +12.5% |
| `lineage-rapier-tempo-t2` | tempo | cadence | +4.0% | +28.6% | +4.0% | +3.8% | +8.7% | +3.1% | +15.3% | +17.9% | +23.5% | -25.6% | +28.6% | +7.7% | +23.1% | +28.6% | -18.2% | +0.0% | +40.0% | +26.7% | +25.0% | -10.0% | +0.0% | +30.8% | +23.1% | +27.8% | -16.7% | +42.9% | +0.0% | +7.7% | +11.1% | +0.0% | +37.5% | +22.2% | +20.0% | +50.0% | +22.2% |
| `lineage-rapier-affliction-t2` | affliction | cadence | +4.0% | +50.0% | +0.0% | +11.5% | +4.3% | +31.3% | +22.0% | +7.7% | +23.5% | -11.6% | +28.6% | +7.7% | +30.8% | +28.6% | -18.2% | +0.0% | +0.0% | +20.0% | +12.5% | +0.0% | +12.5% | +7.7% | +15.4% | +5.6% | +0.0% | +14.3% | +10.0% | +15.4% | +22.2% | +9.1% | +37.5% | +33.3% | +20.0% | +37.5% | +22.2% |
| `lineage-rapier-engagement-t2` | engagement | cadence | +32.0% | +35.7% | +16.0% | +19.2% | +8.7% | +43.8% | +33.9% | +20.5% | +67.6% | +11.6% | +28.6% | +7.7% | +46.2% | +71.4% | +0.0% | +7.7% | +20.0% | +26.7% | +37.5% | +30.0% | +25.0% | +46.2% | +30.8% | +44.4% | +5.6% | +64.3% | +30.0% | +30.8% | +33.3% | +27.3% | +50.0% | +33.3% | +20.0% | +50.0% | +33.3% |
| `lineage-hammer-empowered-t2` | empowered | cooldown | +26.3% | +18.2% | +4.8% | +15.0% | +0.0% | -3.8% | +0.0% | +45.0% | +27.3% | +13.0% | -10.0% | +0.0% | +7.1% | +0.0% | -20.0% | +30.0% | +0.0% | +6.3% | +0.0% | +12.5% | +16.7% | +0.0% | +7.7% | +0.0% | +0.0% | +0.0% | +12.5% | +18.2% | +12.5% | +12.5% | +12.5% | +0.0% | +12.5% | +12.5% | +0.0% |
| `lineage-hammer-control-t2` | control | cooldown | +26.3% | +9.1% | +4.8% | +25.0% | +0.0% | -3.8% | +7.7% | +60.0% | +40.9% | +13.0% | +0.0% | +0.0% | +7.1% | +25.0% | -10.0% | +40.0% | -20.0% | +6.3% | +14.3% | +37.5% | +33.3% | +8.3% | +0.0% | +57.1% | -6.7% | -7.1% | +12.5% | +9.1% | +12.5% | +25.0% | +12.5% | +25.0% | +50.0% | +12.5% | +12.5% |
| `lineage-hammer-engagement-t2` | engagement | cooldown | +26.3% | +9.1% | +0.0% | +25.0% | +0.0% | -3.8% | +5.8% | +40.0% | +40.9% | +21.7% | -10.0% | +6.7% | +7.1% | +25.0% | -10.0% | +30.0% | -20.0% | +6.3% | +14.3% | +37.5% | +33.3% | +8.3% | +7.7% | +57.1% | +6.7% | +0.0% | +12.5% | +18.2% | +12.5% | +25.0% | +0.0% | +50.0% | +25.0% | +12.5% | +25.0% |
| `lineage-axe-tempo-t2` | tempo | dot | +11.1% | -26.7% | +0.0% | +5.0% | +0.0% | +6.5% | +0.0% | +6.1% | -8.9% | +10.7% | +0.0% | -16.7% | -14.3% | +12.5% | -11.1% | +0.0% | +0.0% | +0.0% | -11.1% | +0.0% | +0.0% | +8.3% | +0.0% | +0.0% | +0.0% | +0.0% | +12.5% | -23.1% | +0.0% | +0.0% | +0.0% | +0.0% | -14.3% | +0.0% | +16.7% |
| `lineage-axe-kill-chain-t2` | kill-chain | dot | +16.7% | -33.3% | -5.6% | -15.0% | -9.5% | -3.2% | +15.9% | +12.1% | -11.1% | +42.9% | +37.5% | -25.0% | +0.0% | -12.5% | -33.3% | +0.0% | +50.0% | +0.0% | +0.0% | -33.3% | +0.0% | +8.3% | +0.0% | +6.7% | -7.1% | +7.7% | -25.0% | -7.7% | +37.5% | +0.0% | -14.3% | +0.0% | -14.3% | +16.7% | +33.3% |
| `lineage-axe-empowered-t2` | empowered | dot | +16.7% | -20.0% | +5.6% | -10.0% | -9.5% | +22.6% | +25.0% | +6.1% | -22.2% | +3.6% | +12.5% | +0.0% | -7.1% | +25.0% | +33.3% | +10.0% | +0.0% | +7.1% | +22.2% | +0.0% | +33.3% | +16.7% | +0.0% | +6.7% | +7.1% | +15.4% | +12.5% | -23.1% | +25.0% | +12.5% | +42.9% | +14.3% | +14.3% | +33.3% | +33.3% |
| `lineage-dagger-affliction-t2` | affliction | reload | +8.3% | +15.4% | -4.0% | +15.0% | +26.3% | +9.5% | +5.7% | +43.8% | +8.7% | -6.5% | +10.0% | +18.8% | +8.3% | +8.3% | +8.3% | -14.3% | +16.7% | +15.4% | +37.5% | +12.5% | -12.5% | +0.0% | -5.3% | +0.0% | +10.5% | +11.1% | +9.1% | +6.3% | +10.0% | +9.1% | -10.0% | +22.2% | +22.2% | +20.0% | +33.3% |
| `lineage-dagger-control-t2` | control | reload | +29.2% | +23.1% | +0.0% | +50.0% | +42.1% | +0.0% | +0.0% | +9.4% | -2.2% | +4.3% | +40.0% | +31.3% | +58.3% | +33.3% | +25.0% | -7.1% | +16.7% | +38.5% | +50.0% | +75.0% | +12.5% | +16.7% | -10.5% | -4.2% | +10.5% | +16.7% | +18.2% | +6.3% | +30.0% | +0.0% | +10.0% | +44.4% | +33.3% | +20.0% | +33.3% |
| `lineage-dagger-kill-chain-t2` | kill-chain | reload | +4.2% | +0.0% | -8.0% | +10.0% | +21.1% | -7.1% | -7.5% | +6.3% | -23.9% | -21.7% | +0.0% | +12.5% | +16.7% | +8.3% | +0.0% | +7.1% | +0.0% | +23.1% | +25.0% | +12.5% | -12.5% | +5.6% | +0.0% | +0.0% | +10.5% | +11.1% | +0.0% | +0.0% | -20.0% | -9.1% | +0.0% | +0.0% | +0.0% | -10.0% | +0.0% |

## Lane budget (design §18.9)

“The band is the median uplift ±3pp, absolute.” Measured on each lane’s favoured
node — the node its own family dominates hardest — per tier.

**Tier 1 node, Band 1 (T1 cards, T1 gear).** Median lane uplift on the favoured node: **+2.0%**. The §18.9 band is -1.0% to +5.0% (median ±3 pp). Median absolute throughput there: 6.00 kills/min.

| lane | profile | favoured node | uplift | uplift − median | in ±3 pp (§18.9) | kills/min | in ±10% abs (§9, retired) | shards |
|---|---|---|---:|---:|:--:|---:|:--:|---|
| technique | `lineage-broadsword-technique` | `node-t1-plains-02` | +2.0% | +0.0% | yes | 17.33 | NO | earned |
| kill-chain | `lineage-broadsword-kill-chain` | `node-t1-cave-03` | +0.0% | -2.0% | yes | 5.33 | NO | earned |
| empowered | `lineage-broadsword-empowered` | `node-t1-mountain-01` | +20.0% | +18.0% | NO | 6.00 | yes | earned |
| tempo | `lineage-rapier-tempo` | `node-t1-mountain-03` | +9.5% | +7.6% | NO | 7.67 | NO | earned |
| affliction | `lineage-rapier-affliction` | `node-t1-cave-01` | +0.0% | -2.0% | yes | 8.33 | NO | earned |
| engagement | `lineage-rapier-engagement` | `node-t1-plains-03` | +11.4% | +9.4% | NO | 16.33 | NO | earned |
| empowered | `lineage-hammer-empowered` | `node-t1-mountain-01` | +6.7% | +4.7% | NO | 5.33 | NO | earned |
| control | `lineage-hammer-control` | `node-t1-mountain-02` | +0.0% | -2.0% | yes | 6.00 | yes | earned |
| engagement | `lineage-hammer-engagement` | `node-t1-plains-03` | +0.0% | -2.0% | yes | 11.67 | NO | earned |
| tempo | `lineage-axe-tempo` | `node-t1-mountain-03` | +0.0% | -2.0% | yes | 4.33 | NO | earned |
| kill-chain | `lineage-axe-kill-chain` | `node-t1-cave-03` | +15.4% | +13.4% | NO | 5.00 | NO | earned |
| empowered | `lineage-axe-empowered` | `node-t1-mountain-01` | +0.0% | -2.0% | yes | 4.67 | NO | earned |
| affliction | `lineage-dagger-affliction` | `node-t1-cave-01` | +25.0% | +23.0% | NO | 8.33 | NO | earned |
| control | `lineage-dagger-control` | `node-t1-mountain-02` | +21.4% | +19.5% | NO | 5.67 | yes | earned |
| kill-chain | `lineage-dagger-kill-chain` | `node-t1-cave-03` | +0.0% | -2.0% | yes | 4.67 | NO | earned |

**Tier 2 node, Band 1 (T1 cards, T1 gear).** Median lane uplift on the favoured node: **+0.0%**. The §18.9 band is -3.0% to +3.0% (median ±3 pp). Median absolute throughput there: 3.00 kills/min.

| lane | profile | favoured node | uplift | uplift − median | in ±3 pp (§18.9) | kills/min | in ±10% abs (§9, retired) | shards |
|---|---|---|---:|---:|:--:|---:|:--:|---|
| technique | `lineage-broadsword-technique` | `node-t2-plains-02` | -8.1% | -8.1% | NO | 11.33 | NO | earned |
| kill-chain | `lineage-broadsword-kill-chain` | `node-t2-swamp-03` | +0.0% | +0.0% | yes | 3.67 | NO | earned |
| empowered | `lineage-broadsword-empowered` | `node-t2-jungle-01` | +0.0% | +0.0% | yes | 1.00 | NO | earned |
| tempo | `lineage-rapier-tempo` | `node-t2-forest-01` | +20.0% | +20.0% | NO | 4.00 | NO | earned |
| affliction | `lineage-rapier-affliction` | `node-t2-jungle-02` | +0.0% | +0.0% | yes | 2.33 | NO | earned |
| engagement | `lineage-rapier-engagement` | `node-t2-plains-03` | +26.3% | +26.3% | NO | 8.00 | NO | earned |
| empowered | `lineage-hammer-empowered` | `node-t2-jungle-01` | +0.0% | +0.0% | yes | 1.00 | NO | earned |
| control | `lineage-hammer-control` | `node-t2-swamp-02` | -11.1% | -11.1% | NO | 2.67 | NO | earned |
| engagement | `lineage-hammer-engagement` | `node-t2-plains-03` | +25.0% | +25.0% | NO | 5.00 | NO | earned |
| tempo | `lineage-axe-tempo` | `node-t2-forest-01` | +0.0% | +0.0% | yes | 5.33 | NO | earned |
| kill-chain | `lineage-axe-kill-chain` | `node-t2-swamp-03` | -11.1% | -11.1% | NO | 2.67 | NO | earned |
| empowered | `lineage-axe-empowered` | `node-t2-jungle-01` | +33.3% | +33.3% | NO | 1.33 | NO | earned |
| affliction | `lineage-dagger-affliction` | `node-t2-jungle-02` | +50.0% | +50.0% | NO | 3.00 | yes | earned |
| control | `lineage-dagger-control` | `node-t2-swamp-02` | +0.0% | +0.0% | yes | 3.00 | yes | earned |
| kill-chain | `lineage-dagger-kill-chain` | `node-t2-swamp-03` | -18.2% | -18.2% | NO | 3.00 | yes | earned |

**Tier 2 node, Band 2 (T2 cards, T2 gear).** Median lane uplift on the favoured node: **+6.7%**. The §18.9 band is +3.7% to +9.7% (median ±3 pp). Median absolute throughput there: 5.67 kills/min.

| lane | profile | favoured node | uplift | uplift − median | in ±3 pp (§18.9) | kills/min | in ±10% abs (§9, retired) | shards |
|---|---|---|---:|---:|:--:|---:|:--:|---|
| technique | `lineage-broadsword-technique-t2` | `node-t2-plains-02` | +15.5% | +8.9% | NO | 22.33 | NO | earned |
| kill-chain | `lineage-broadsword-kill-chain-t2` | `node-t2-swamp-03` | +0.0% | -6.7% | NO | 6.33 | NO | earned |
| empowered | `lineage-broadsword-empowered-t2` | `node-t2-jungle-01` | +0.0% | -6.7% | NO | 3.00 | NO | earned |
| tempo | `lineage-rapier-tempo-t2` | `node-t2-forest-01` | +4.0% | -2.7% | yes | 8.67 | NO | earned |
| affliction | `lineage-rapier-affliction-t2` | `node-t2-jungle-02` | +15.4% | +8.7% | NO | 5.00 | NO | earned |
| engagement | `lineage-rapier-engagement-t2` | `node-t2-plains-03` | +20.5% | +13.8% | NO | 15.67 | NO | earned |
| empowered | `lineage-hammer-empowered-t2` | `node-t2-jungle-01` | +12.5% | +5.8% | NO | 3.00 | NO | earned |
| control | `lineage-hammer-control-t2` | `node-t2-swamp-02` | +0.0% | -6.7% | NO | 4.33 | NO | earned |
| engagement | `lineage-hammer-engagement-t2` | `node-t2-plains-03` | +40.0% | +33.3% | NO | 9.33 | NO | earned |
| tempo | `lineage-axe-tempo-t2` | `node-t2-forest-01` | +11.1% | +4.4% | NO | 6.67 | NO | earned |
| kill-chain | `lineage-axe-kill-chain-t2` | `node-t2-swamp-03` | +6.7% | +0.0% | yes | 5.33 | yes | earned |
| empowered | `lineage-axe-empowered-t2` | `node-t2-jungle-01` | +12.5% | +5.8% | NO | 3.00 | NO | earned |
| affliction | `lineage-dagger-affliction-t2` | `node-t2-jungle-02` | +6.3% | -0.4% | yes | 5.67 | yes | earned |
| control | `lineage-dagger-control-t2` | `node-t2-swamp-02` | -10.5% | -17.2% | NO | 5.67 | yes | earned |
| kill-chain | `lineage-dagger-kill-chain-t2` | `node-t2-swamp-03` | +0.0% | -6.7% | NO | 8.00 | NO | earned |

### How much of the absolute column is class, not lane

**Band 1 (T1 cards, T1 gear).**

| control | class | weapon | mean kills/min over its node set | vs that band's control median |
|---|---|---|---:|---:|
| `lineage-broadsword-baseline` | energy | iron-broadsword | 5.76 | +9.5% |
| `lineage-rapier-baseline` | cadence | flash-rapier | 5.26 | +0.0% |
| `lineage-hammer-baseline` | cooldown | heavy-hammer | 4.99 | -5.1% |
| `lineage-axe-baseline` | dot | chaotic-axe | 4.78 | -9.1% |
| `lineage-dagger-baseline` | reload | ashbrand-blade | 5.33 | +1.3% |

**Band 2 (T2 cards, T2 gear).**

| control | class | weapon | mean kills/min over its node set | vs that band's control median |
|---|---|---|---:|---:|
| `lineage-broadsword-baseline-t2` | energy | knight-steelsword | 5.94 | +5.2% |
| `lineage-rapier-baseline-t2` | cadence | gale-needle | 5.65 | +0.0% |
| `lineage-hammer-baseline-t2` | cooldown | quake-hammer | 4.62 | -18.2% |
| `lineage-axe-baseline-t2` | dot | ruinous-axe | 4.89 | -13.5% |
| `lineage-dagger-baseline-t2` | reload | swamp-mirebrand | 6.02 | +6.6% |


### Lane budget per PACKET — the table `PACKET_BUDGET` is tuned from

**Band 1 (T1 cards, T1 gear).** Median packet uplift: **+6.9%**. The §18.9 band is +3.9% to +9.9% (median ±3 pp).

| packet | lineages carrying it | mean uplift | − median | in ±3 pp | payoff fx fired | hardest favouring node |
|---|---:|---:|---:|:--:|---:|---|
| control | 2 | +9.3% | +2.5% | yes | 3850 | `node-t2-swamp-02` |
| engagement | 2 | +7.4% | +0.6% | yes | 1045 | `node-t1-plains-03` |
| tempo | 2 | +7.3% | +0.5% | yes | 4120 | `node-t1-mountain-03` |
| affliction | 2 | +6.9% | +0.0% | yes | 14765 | `node-t2-jungle-02` |
| kill-chain | 3 | +4.6% | -2.3% | yes | 1780 | `node-t2-swamp-03` |
| technique | 1 | +1.3% | -5.5% | NO | 2264 | `node-t1-plains-02` |
| empowered | 3 | +1.2% | -5.6% | NO | 1473 | `node-t2-jungle-01` |

**Band 2 (T2 cards, T2 gear).** Median packet uplift: **+7.4%**. The §18.9 band is +4.4% to +10.4% (median ±3 pp).

| packet | lineages carrying it | mean uplift | − median | in ±3 pp | payoff fx fired | hardest favouring node |
|---|---:|---:|---:|:--:|---:|---|
| engagement | 2 | +23.4% | +16.0% | NO | 7006 | `node-t1-plains-03` |
| control | 2 | +18.5% | +11.1% | NO | 10698 | `node-t2-swamp-02` |
| affliction | 2 | +12.6% | +5.3% | NO | 24363 | `node-t2-jungle-02` |
| empowered | 3 | +7.4% | +0.0% | yes | 10210 | `node-t2-jungle-01` |
| tempo | 2 | +6.8% | -0.5% | yes | 11980 | `node-t1-mountain-03` |
| technique | 1 | +1.7% | -5.6% | NO | 4426 | `node-t1-plains-02` |
| kill-chain | 3 | +0.7% | -6.6% | NO | 12458 | `node-t2-swamp-03` |


### Lane uplift over every node

The same uplift as above, averaged over all node blends rather than only the
favoured one — the reading least sensitive to which single encounter a lane
happened to be measured on.

| lane | profile | band | mean uplift over all nodes | uplift on favoured node | worst node | best node | payoff fx fired (all nodes) |
|---|---|---:|---:|---:|---|---|---:|
| technique | `lineage-broadsword-technique` | 1 | +1.3% | +2.0% | t2-mountain-04 -22.2% | t1-forest-01 +23.4% | 2264 |
| kill-chain | `lineage-broadsword-kill-chain` | 1 | +5.8% | +0.0% | t2-jungle-03 -60.0% | t2-desert-03 +66.7% | 885 |
| empowered | `lineage-broadsword-empowered` | 1 | +1.8% | +20.0% | t2-jungle-03 -40.0% | t2-jungle-04 +25.0% | 350 |
| tempo | `lineage-rapier-tempo` | 1 | +12.9% | +9.5% | t2-swamp-02 -42.9% | t2-plains-04 +93.3% | 2259 |
| affliction | `lineage-rapier-affliction` | 1 | +4.0% | +0.0% | t2-swamp-06 -44.4% | t2-plains-04 +80.0% | 6001 |
| engagement | `lineage-rapier-engagement` | 1 | +11.7% | +11.4% | t2-cave-04 -33.3% | t2-mountain-05 +66.7% | 501 |
| empowered | `lineage-hammer-empowered` | 1 | +0.2% | +6.7% | t2-swamp-06 -23.1% | t2-jungle-03 +33.3% | 777 |
| control | `lineage-hammer-control` | 1 | +3.0% | +0.0% | t2-swamp-06 -23.1% | t1-swamp-02 +44.4% | 750 |
| engagement | `lineage-hammer-engagement` | 1 | +3.1% | +0.0% | t2-cave-06 -66.7% | t2-cave-05 +50.0% | 544 |
| tempo | `lineage-axe-tempo` | 1 | +1.7% | +0.0% | t1-forest-02 -15.6% | t1-swamp-04 +35.7% | 1861 |
| kill-chain | `lineage-axe-kill-chain` | 1 | +2.1% | +15.4% | t2-cave-06 -75.0% | t2-jungle-01 +66.7% | 683 |
| empowered | `lineage-axe-empowered` | 1 | +1.7% | +0.0% | t2-cave-06 -25.0% | t2-desert-05 +50.0% | 346 |
| affliction | `lineage-dagger-affliction` | 1 | +9.7% | +25.0% | t2-forest-02 -27.3% | t2-desert-04 +50.0% | 8764 |
| control | `lineage-dagger-control` | 1 | +15.6% | +21.4% | t2-cave-01 -22.2% | t2-jungle-01 +100.0% | 3100 |
| kill-chain | `lineage-dagger-kill-chain` | 1 | +5.8% | +0.0% | t2-cave-02 -33.3% | t2-desert-04 +100.0% | 212 |
| technique | `lineage-broadsword-technique-t2` | 2 | +1.7% | +15.5% | t2-swamp-02 -25.0% | t2-jungle-03 +25.0% | 4426 |
| kill-chain | `lineage-broadsword-kill-chain-t2` | 2 | -0.4% | +0.0% | t2-cave-03 -27.8% | t2-cave-06 +33.3% | 3204 |
| empowered | `lineage-broadsword-empowered-t2` | 2 | +3.4% | +0.0% | t2-plains-01 -17.8% | t2-jungle-04 +22.2% | 2914 |
| tempo | `lineage-rapier-tempo-t2` | 2 | +14.7% | +4.0% | t2-plains-05 -25.6% | t2-desert-04 +50.0% | 6180 |
| affliction | `lineage-rapier-affliction-t2` | 2 | +14.7% | +15.4% | t2-mountain-05 -18.2% | t2-forest-02 +50.0% | 10319 |
| engagement | `lineage-rapier-engagement-t2` | 2 | +31.1% | +20.5% | t2-mountain-05 +0.0% | t2-mountain-04 +71.4% | 4231 |
| empowered | `lineage-hammer-empowered-t2` | 2 | +8.3% | +12.5% | t2-mountain-05 -20.0% | t2-plains-03 +45.0% | 3019 |
| control | `lineage-hammer-control-t2` | 2 | +15.4% | +0.0% | t2-cave-02 -20.0% | t2-plains-03 +60.0% | 3039 |
| engagement | `lineage-hammer-engagement-t2` | 2 | +15.6% | +40.0% | t2-cave-02 -20.0% | t2-swamp-03 +57.1% | 2775 |
| tempo | `lineage-axe-tempo-t2` | 2 | -1.1% | +11.1% | t2-forest-02 -26.7% | t2-desert-05 +16.7% | 5800 |
| kill-chain | `lineage-axe-kill-chain-t2` | 2 | +1.0% | +6.7% | t2-mountain-05 -33.3% | t2-cave-02 +50.0% | 4451 |
| empowered | `lineage-axe-empowered-t2` | 2 | +10.4% | +12.5% | t2-jungle-02 -23.1% | t2-desert-01 +42.9% | 4277 |
| affliction | `lineage-dagger-affliction-t2` | 2 | +10.6% | +6.3% | t2-cave-01 -14.3% | t2-plains-03 +43.8% | 14044 |
| control | `lineage-dagger-control-t2` | 2 | +21.5% | -10.5% | t2-swamp-02 -10.5% | t2-cave-05 +75.0% | 7659 |
| kill-chain | `lineage-dagger-kill-chain-t2` | 2 | +1.5% | +0.0% | t2-plains-04 -23.9% | t2-cave-04 +25.0% | 4803 |

## Frames (design §18.10)

Light / Balanced / Heavy per class root. Lane-less on purpose: design §10 gives
each frame its own feedback loop, so a card on top would be a second variable.
There is no control-relative uplift here and there must not be — every T1
character has bought a frame, so a frame has nothing to be an uplift OVER. The
reading is frame-against-frame inside one root, against the frame that root’s own
canonical T1 route wears.

36 lane-less frame references, three per class root per band.

**Band 1 (T1 cards, T1 gear)**, over 12 nodes (t1-mountain-01, t1-cave-01, t1-forest-01, t1-plains-01, t1-swamp-01, t2-forest-01, t2-plains-01, t2-mountain-01, t2-cave-01, t2-swamp-01, t2-jungle-01, t2-desert-01).

| root | frame | shape | weapon | kills/min | vs the root's canonical frame | median TTK (ms) | mean HP engaged | deaths |
|---|---|---|---|---:|---:|---:|---:|---:|
| cadence | `cadence-light` | light | flash-rapier | 6.00 | +10.8% | 6375 | 0.78 | 28 |
| cadence | `cadence-balanced` | balanced **(canonical)** | flash-rapier | 5.42 | _denominator_ | 6569 | 0.79 | 29 |
| cadence | `cadence-heavy` | heavy | flash-rapier | 6.25 | +15.4% | 6243 | 0.84 | 11 |
| cooldown | `cooldown-light` | light | heavy-hammer | 5.25 | +4.4% | 7420 | 0.78 | 32 |
| cooldown | `cooldown-balanced` | balanced | heavy-hammer | 4.97 | -1.1% | 7800 | 0.78 | 20 |
| cooldown | `cooldown-heavy` | heavy **(canonical)** | heavy-hammer | 5.03 | _denominator_ | 6944 | 0.82 | 13 |
| reload | `reload-light` | light | ashbrand-blade | 5.75 | +3.0% | 9051 | 0.81 | 17 |
| reload | `reload-balanced` | balanced | ashbrand-blade | 5.44 | -2.5% | 8877 | 0.81 | 20 |
| reload | `reload-heavy` | heavy **(canonical)** | ashbrand-blade | 5.58 | _denominator_ | 8978 | 0.81 | 18 |
| energy | `energy-light` | light | iron-broadsword | 6.14 | +8.3% | 8582 | 0.86 | 22 |
| energy | `energy-balanced` | balanced | iron-broadsword | 5.89 | +3.9% | 7693 | 0.84 | 22 |
| energy | `energy-heavy` | heavy **(canonical)** | iron-broadsword | 5.67 | _denominator_ | 8059 | 0.89 | 9 |
| dot | `dot-light` | light | chaotic-axe | 5.28 | +10.5% | 8292 | 0.79 | 24 |
| dot | `dot-balanced` | balanced **(canonical)** | chaotic-axe | 4.78 | _denominator_ | 9032 | 0.81 | 17 |
| dot | `dot-heavy` | heavy | chaotic-axe | 5.22 | +9.3% | 8934 | 0.80 | 12 |
| summoner | `summoner-light` | light | chaotic-axe | 6.53 | +6.3% | 512 | 0.78 | 8 |
| summoner | `summoner-balanced` | balanced **(canonical)** | chaotic-axe | 6.14 | _denominator_ | 508 | 0.84 | 2 |
| summoner | `summoner-heavy` | heavy | chaotic-axe | 9.89 | +61.1% | 2360 | 0.93 | 1 |

*Per frame SHAPE across the 6 roots, band 1 (t1 cards, t1 gear).*

| shape | mean kills/min | mean delta vs each root's canonical frame | roots where it is fastest |
|---|---:|---:|---:|
| light | 5.82 | +7.2% | 4 of 6 |
| balanced | 5.44 | +0.1% | 0 of 6 |
| heavy | 6.27 | +14.3% | 2 of 6 |

**Band 2 (T2 cards, T2 gear)**, over 7 nodes (t2-forest-01, t2-plains-01, t2-mountain-01, t2-cave-01, t2-swamp-01, t2-jungle-01, t2-desert-01).

| root | frame | shape | weapon | kills/min | vs the root's canonical frame | median TTK (ms) | mean HP engaged | deaths |
|---|---|---|---|---:|---:|---:|---:|---:|
| cadence | `cadence-light` | light | gale-needle | 4.95 | -3.7% | 8462 | 0.86 | 1 |
| cadence | `cadence-balanced` | balanced **(canonical)** | gale-needle | 5.14 | _denominator_ | 8585 | 0.87 | 2 |
| cadence | `cadence-heavy` | heavy | gale-needle | 5.43 | +5.6% | 11331 | 0.93 | 0 |
| cooldown | `cooldown-light` | light | quake-hammer | 4.71 | +6.5% | 13300 | 0.93 | 0 |
| cooldown | `cooldown-balanced` | balanced | quake-hammer | 4.38 | -1.1% | 8869 | 0.94 | 1 |
| cooldown | `cooldown-heavy` | heavy **(canonical)** | quake-hammer | 4.43 | _denominator_ | 11520 | 0.93 | 0 |
| reload | `reload-light` | light | swamp-mirebrand | 5.38 | -12.4% | 10343 | 1.00 | 0 |
| reload | `reload-balanced` | balanced | swamp-mirebrand | 5.24 | -14.7% | 11933 | 0.99 | 0 |
| reload | `reload-heavy` | heavy **(canonical)** | swamp-mirebrand | 6.14 | _denominator_ | 9607 | 0.99 | 0 |
| energy | `energy-light` | light | knight-steelsword | 5.38 | -7.4% | 10523 | 0.95 | 2 |
| energy | `energy-balanced` | balanced | knight-steelsword | 4.71 | -18.9% | 15567 | 0.94 | 3 |
| energy | `energy-heavy` | heavy **(canonical)** | knight-steelsword | 5.81 | _denominator_ | 10882 | 0.96 | 1 |
| dot | `dot-light` | light | ruinous-axe | 3.95 | -11.7% | 14238 | 0.90 | 5 |
| dot | `dot-balanced` | balanced **(canonical)** | ruinous-axe | 4.48 | _denominator_ | 11110 | 0.93 | 1 |
| dot | `dot-heavy` | heavy | ruinous-axe | 4.38 | -2.1% | 19488 | 0.90 | 3 |
| summoner | `summoner-light` | light | ruinous-axe | 5.48 | +23.7% | 2011 | 0.89 | 2 |
| summoner | `summoner-balanced` | balanced **(canonical)** | ruinous-axe | 4.43 | _denominator_ | 7516 | 0.90 | 1 |
| summoner | `summoner-heavy` | heavy | ruinous-axe | 7.81 | +76.3% | 3230 | 0.98 | 0 |

*Per frame SHAPE across the 6 roots, band 2 (t2 cards, t2 gear).*

| shape | mean kills/min | mean delta vs each root's canonical frame | roots where it is fastest |
|---|---:|---:|---:|
| light | 4.98 | -0.8% | 1 of 6 |
| balanced | 4.73 | -5.8% | 1 of 6 |
| heavy | 5.67 | +13.3% | 4 of 6 |


## Survival — what the non-damage lanes buy instead

Control’s slow and Engagement’s opening DR buy time, not throughput, so the
TTK matrix above reads them as worth nothing. This is the same runs read as
survival: mean HP fraction while engaged and damage taken per engaged second,
each against the same lineage’s lane-less control.

| profile | lane | band | class | mean HP while engaged | damage taken / engaged s | deaths | Δ HP vs control | Δ damage taken vs control |
|---|---|---:|---|---:|---:|---:|---:|---:|
| `lineage-broadsword-technique` | technique | 1 | energy | 0.89 | 4.95 | 53 | +0.1% | -1.7% |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 0.88 | 5.16 | 63 | -0.4% | +2.4% |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 0.89 | 5.07 | 54 | -0.1% | +0.7% |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 0.89 | 5.03 | 54 | — | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 0.79 | 14.08 | 140 | +0.4% | -0.2% |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 0.79 | 14.20 | 130 | +0.6% | +0.7% |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 0.79 | 13.95 | 129 | +1.0% | -1.1% |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 0.78 | 14.11 | 129 | — | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 0.82 | 10.34 | 67 | -0.1% | -1.2% |
| `lineage-hammer-control` | control | 1 | cooldown | 0.82 | 10.24 | 64 | -0.1% | -2.2% |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 0.83 | 9.95 | 66 | +0.4% | -5.0% |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 0.82 | 10.47 | 69 | — | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 0.80 | 9.10 | 91 | +0.7% | -0.8% |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 0.80 | 8.72 | 99 | +1.0% | -4.9% |
| `lineage-axe-empowered` | empowered | 1 | dot | 0.80 | 9.08 | 93 | +1.2% | -1.0% |
| `lineage-axe-baseline` | _control_ | 1 | dot | 0.79 | 9.17 | 97 | — | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 0.82 | 9.84 | 77 | +1.3% | -1.7% |
| `lineage-dagger-control` | control | 1 | reload | 0.82 | 9.42 | 59 | +1.0% | -5.9% |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 0.80 | 9.81 | 88 | -0.7% | -2.0% |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 0.81 | 10.01 | 91 | — | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 0.97 | 4.46 | 3 | +0.8% | -8.4% |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 0.97 | 4.09 | 3 | +1.0% | -15.9% |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 0.97 | 4.55 | 4 | +0.7% | -6.5% |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 0.96 | 4.87 | 2 | — | — |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 0.88 | 16.07 | 0 | +1.3% | +1.5% |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 0.88 | 16.21 | 1 | +1.3% | +2.4% |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 0.90 | 15.58 | 0 | +3.2% | -1.6% |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 0.87 | 15.83 | 4 | — | — |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 0.93 | 10.83 | 0 | +0.8% | -2.3% |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 0.94 | 10.76 | 0 | +1.7% | -2.9% |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 0.95 | 10.19 | 0 | +2.5% | -8.1% |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 0.93 | 11.08 | 0 | — | — |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 0.92 | 9.54 | 3 | +0.6% | -2.8% |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 0.92 | 9.59 | 4 | +0.3% | -2.3% |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 0.91 | 9.66 | 2 | -0.0% | -1.6% |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 0.92 | 9.82 | 4 | — | — |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 0.99 | 3.63 | 0 | +0.1% | -0.8% |
| `lineage-dagger-control-t2` | control | 2 | reload | 0.98 | 3.80 | 1 | -0.1% | +3.7% |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 0.98 | 3.87 | 2 | -0.5% | +5.7% |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 0.98 | 3.66 | 1 | — | — |

## Encounter check (design §18.9) — ordinal

One row per family that has an OWN node: a node where it reaches at least 60% of
the resolved blend, so the encounter really is that family rather than two sharing
it. Lanes are ranked by median uplift; rank 1 is the strongest. The favoured lane
is read off `FamilyDefinition.drops`, which design §18.7 confirms IS the definition
of favours. A family whose favoured lane ranks below its punished lane is a
monster-shape finding for Phase 4, not a magnitude to tune.

| family | own node | tier | band | favoured | rank | punished | rank | margin (fav − pun) | lanes | per-seed fav rank | per-seed top lane | fav deaths | pun deaths |
|---|---|---:|---:|---|---:|---|---:|---:|---:|---|---|---:|---:|
| Brood | `node-t1-cave-01` | 1 | 1 | affliction | 4/7 | tempo | 6/7 | +2.5% | 7 | 7/7 / 1/7 | kill-chain / affliction | 0 | 0 |
| Brute | `node-t1-cave-02` | 1 | 1 | empowered | no reference | affliction | no reference | — | 2 | — / 3/3 | technique / technique | 0 | 0 |
| Deep | `node-t1-cave-03` | 1 | 1 | kill-chain | 5/7 | engagement | 3/7 | -3.1% | 7 | — / 4/7 | tempo / control | 0 | 0 |
| Deep | `node-t2-cave-03` | 2 | 2 | kill-chain | no reference | engagement | 2/4 | — | 4 | — / 5/6 | tempo / empowered | 0 | 0 |
| Canopy | `node-t1-forest-03` | 1 | 1 | affliction | 2/7 | control | 3/7 | +0.0% | 7 | 1/7 / 2/7 | affliction / technique | 0 | 0 |
| Canopy | `node-t2-forest-03` | 2 | 2 | affliction | 6/7 | control | 4/7 | -4.4% | 7 | 5/7 / 7/7 | technique / engagement | 0 | 0 |
| Grove | `node-t1-forest-02` | 1 | 1 | empowered | 4/7 | tempo | 6/7 | +2.3% | 7 | 6/7 / 5/7 | kill-chain / engagement | 3 | 1 |
| Pack | `node-t1-forest-01` | 1 | 1 | tempo | 2/7 | empowered | 6/7 | +14.1% | 7 | 1/7 / 2/7 | tempo / technique | 3 | 4 |
| Pack | `node-t2-forest-01` | 2 | 1 | tempo | 3/3 | empowered | 1/3 | -6.4% | 3 | 3/5 / — | empowered / empowered | 14 | 7 |
| Pack | `node-t2-forest-01` | 2 | 2 | tempo | 5/7 | empowered | 4/7 | -9.1% | 7 | 7/7 / 4/7 | technique / engagement | 0 | 0 |
| Undergrowth | `node-t2-jungle-02` | 2 | 2 | affliction | 1/3 | control | 2/3 | +0.0% | 3 | — / 1/3 | — / affliction | 0 | 0 |
| Crag | `node-t1-mountain-01` | 1 | 1 | empowered | no reference | affliction | 1/3 | — | 3 | 6/6 / 2/6 | control / kill-chain | 0 | 0 |
| Hopper | `node-t1-mountain-03` | 1 | 1 | tempo | 1/7 | empowered | 5/7 | +4.5% | 7 | 6/7 / 1/7 | affliction / tempo | 0 | 0 |
| Ridge | `node-t1-mountain-02` | 1 | 1 | control | 3/5 | kill-chain | 1/5 | +0.0% | 5 | 2/5 / 4/5 | empowered / kill-chain | 0 | 0 |
| Ridge | `node-t2-mountain-02` | 2 | 2 | control | 1/3 | kill-chain | 3/3 | +18.8% | 3 | 2/5 / 2/5 | kill-chain / affliction | 0 | 0 |
| Herd | `node-t1-plains-01` | 1 | 1 | empowered | 6/7 | tempo | 7/7 | +0.0% | 7 | 6/7 / 5/7 | kill-chain / kill-chain | 0 | 0 |
| Herd | `node-t2-plains-01` | 2 | 1 | empowered | 6/7 | tempo | 5/7 | -2.5% | 7 | 4/6 / 2/7 | kill-chain / engagement | 2 | 4 |
| Herd | `node-t2-plains-01` | 2 | 2 | empowered | 5/7 | tempo | 3/7 | -8.6% | 7 | 6/7 / 4/7 | affliction / engagement | 0 | 0 |
| Sky | `node-t1-plains-03` | 1 | 1 | engagement | 2/7 | affliction | 5/7 | +8.0% | 7 | 3/7 / 2/7 | kill-chain / control | 0 | 0 |
| Sky | `node-t2-plains-03` | 2 | 1 | engagement | 2/5 | affliction | 1/5 | +0.0% | 5 | 4/6 / 1/5 | affliction / engagement | 4 | 8 |
| Sky | `node-t2-plains-03` | 2 | 2 | engagement | 2/7 | affliction | 3/7 | +4.5% | 7 | 1/7 / 3/7 | engagement / control | 0 | 0 |
| Swarm | `node-t1-plains-02` | 1 | 1 | technique | 3/7 | empowered | 5/7 | +2.0% | 7 | 3/7 / 4/7 | kill-chain / control | 0 | 0 |
| Swarm | `node-t2-plains-02` | 2 | 1 | technique | 7/7 | empowered | 5/7 | -8.1% | 7 | 6/7 / 6/7 | affliction / engagement | 0 | 2 |
| Swarm | `node-t2-plains-02` | 2 | 2 | technique | 3/7 | empowered | 7/7 | +12.1% | 7 | 6/7 / 1/7 | affliction / technique | 0 | 0 |
| Coven | `node-t1-swamp-02` | 1 | 1 | control | 1/7 | tempo | 7/7 | +27.5% | 7 | 1/7 / 2/7 | control / engagement | 0 | 0 |
| Coven | `node-t2-swamp-02` | 2 | 2 | control | 3/4 | tempo | no reference | — | 4 | 4/4 / — | empowered / technique | 0 | 0 |
| Mire | `node-t1-swamp-01` | 1 | 1 | affliction | 4/5 | empowered | 3/5 | +0.0% | 5 | 2/5 / — | technique / control | 0 | 0 |
| Stalker | `node-t1-swamp-03` | 1 | 1 | kill-chain | 7/7 | bulwark | no reference | — | 7 | 7/7 / 5/7 | tempo / affliction | 0 | 0 |
| Stalker | `node-t2-swamp-03` | 2 | 2 | kill-chain | 5/7 | bulwark | no reference | — | 7 | 7/7 / 3/7 | engagement / engagement | 0 | 0 |

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

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 15 | 8153 | 5.00 | +0.0% | 0 | technique.cast-flare x45 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 18 | 7772 | 6.00 | +20.0% | 0 | kill-chain.kill-pulse x18 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 18 | 7206 | 6.00 | +20.0% | 0 | empowered.weak-point x8 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 15 | 8153 | 5.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 16 | 6294 | 5.33 | +0.0% | 0 | tempo.ghost-strike x48 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 17 | 6453 | 5.67 | +6.3% | 0 | affliction.bleed-pips x139 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 17 | 5953 | 5.67 | +6.3% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 16 | 6569 | 5.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 16 | 5638 | 5.33 | +6.7% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | 1 | cooldown | 16 | 5638 | 5.33 | +6.7% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 16 | 5106 | 5.33 | +6.7% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 15 | 6153 | 5.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 14 | 8964 | 4.67 | +0.0% | 0 | tempo.ghost-strike x44 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 14 | 9179 | 4.67 | +0.0% | 0 | kill-chain.kill-pulse x14 |
| `lineage-axe-empowered` | empowered | 1 | dot | 14 | 8964 | 4.67 | +0.0% | 0 | empowered.weak-point x14 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 14 | 8964 | 4.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 17 | 6512 | 5.67 | +13.3% | 0 | affliction.venom-pips x174 |
| `lineage-dagger-control` | control | 1 | reload | 17 | 6571 | 5.67 | +13.3% | 0 | control.frost-drag x59 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 17 | 7471 | 5.67 | +13.3% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 15 | 7327 | 5.00 | — | 0 | — |
| `frame-cadence-light` | _frame light_ | 1 | cadence | 16 | 6375 | 5.33 | — | 0 | — |
| `frame-cadence-balanced` | _frame balanced_ | 1 | cadence | 16 | 6569 | 5.33 | — | 0 | — |
| `frame-cadence-heavy` | _frame heavy_ | 1 | cadence | 18 | 5844 | 6.00 | — | 0 | — |
| `frame-cooldown-light` | _frame light_ | 1 | cooldown | 15 | 7420 | 5.00 | — | 0 | — |
| `frame-cooldown-balanced` | _frame balanced_ | 1 | cooldown | 14 | 7457 | 4.67 | — | 0 | — |
| `frame-cooldown-heavy` | _frame heavy_ | 1 | cooldown | 15 | 6153 | 5.00 | — | 0 | — |
| `frame-reload-light` | _frame light_ | 1 | reload | 16 | 7863 | 5.33 | — | 0 | — |
| `frame-reload-balanced` | _frame balanced_ | 1 | reload | 15 | 7273 | 5.00 | — | 0 | — |
| `frame-reload-heavy` | _frame heavy_ | 1 | reload | 15 | 7327 | 5.00 | — | 0 | — |
| `frame-energy-light` | _frame light_ | 1 | energy | 16 | 8363 | 5.33 | — | 0 | — |
| `frame-energy-balanced` | _frame balanced_ | 1 | energy | 18 | 7661 | 6.00 | — | 0 | — |
| `frame-energy-heavy` | _frame heavy_ | 1 | energy | 15 | 8153 | 5.00 | — | 0 | — |
| `frame-dot-light` | _frame light_ | 1 | dot | 14 | 9550 | 4.67 | — | 0 | — |
| `frame-dot-balanced` | _frame balanced_ | 1 | dot | 14 | 8964 | 4.67 | — | 0 | — |
| `frame-dot-heavy` | _frame heavy_ | 1 | dot | 14 | 9200 | 4.67 | — | 0 | — |
| `frame-summoner-light` | _frame light_ | 1 | summoner | 18 | 578 | 6.00 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | 1 | summoner | 17 | 2088 | 5.67 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | 1 | summoner | 25 | 3988 | 8.33 | — | 0 | — |

### `node-t1-mountain-02` — Ridge 70% / Hopper 20% / Crag 10% (mountain T1; shared by 1 authored node)

Dominant family **Ridge** drops `control`, punishes `kill-chain`. Authored Ridge 70% / Hopper 20% / Crag 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 17 | 6524 | 5.67 | -5.6% | 0 | technique.cast-flare x42 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 18 | 6306 | 6.00 | +0.0% | 0 | kill-chain.kill-pulse x18 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 18 | 5800 | 6.00 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 18 | 5800 | 6.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 20 | 5505 | 6.67 | +42.9% | 0 | tempo.ghost-strike x50 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 15 | 6267 | 5.00 | +7.1% | 0 | affliction.bleed-pips x112 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 20 | 5350 | 6.67 | +42.9% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 14 | 6607 | 4.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 18 | 5356 | 6.00 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | 1 | cooldown | 18 | 5172 | 6.00 | +0.0% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 18 | 5833 | 6.00 | +0.0% | 0 | engagement.brace-sparks x17 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 18 | 5356 | 6.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 11 | 8545 | 3.67 | +0.0% | 0 | tempo.ghost-strike x29 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 11 | 8927 | 3.67 | +0.0% | 0 | kill-chain.kill-pulse x11 |
| `lineage-axe-empowered` | empowered | 1 | dot | 11 | 8545 | 3.67 | +0.0% | 0 | empowered.weak-point x11 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 11 | 8545 | 3.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 17 | 6047 | 5.67 | +21.4% | 0 | affliction.venom-pips x156 |
| `lineage-dagger-control` | control | 1 | reload | 17 | 6206 | 5.67 | +21.4% | 0 | control.frost-drag x52 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 14 | 6571 | 4.67 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 14 | 6564 | 4.67 | — | 0 | — |

### `node-t1-mountain-03` — Hopper 70% / Crag 20% / Ridge 10% (mountain T1; shared by 1 authored node)

Dominant family **Hopper** drops `tempo`, punishes `empowered`. Authored Hopper 70% / Crag 20% / Ridge 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 20 | 5930 | 6.67 | +0.0% | 0 | technique.cast-flare x42 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 21 | 5919 | 7.00 | +5.0% | 0 | kill-chain.kill-pulse x21 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 22 | 5636 | 7.33 | +10.0% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 20 | 5930 | 6.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 23 | 4900 | 7.67 | +9.5% | 0 | tempo.ghost-strike x51 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 19 | 5411 | 6.33 | -9.5% | 0 | affliction.bleed-pips x126 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 22 | 4795 | 7.33 | +4.8% | 0 | engagement.opening-flash x14 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 21 | 5671 | 7.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 17 | 5806 | 5.67 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | 1 | cooldown | 17 | 5806 | 5.67 | +0.0% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 17 | 5947 | 5.67 | +0.0% | 0 | engagement.brace-sparks x15 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 17 | 5594 | 5.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 13 | 7831 | 4.33 | +0.0% | 0 | tempo.ghost-strike x31 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 17 | 7606 | 5.67 | +30.8% | 0 | kill-chain.kill-pulse x17 |
| `lineage-axe-empowered` | empowered | 1 | dot | 13 | 7831 | 4.33 | +0.0% | 0 | empowered.weak-point x13 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 13 | 8315 | 4.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 22 | 6055 | 7.33 | +22.2% | 0 | affliction.venom-pips x195 |
| `lineage-dagger-control` | control | 1 | reload | 20 | 5695 | 6.67 | +11.1% | 0 | control.frost-drag x53 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 19 | 6268 | 6.33 | +5.6% | 0 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 18 | 6850 | 6.00 | — | 0 | — |

### `node-t1-mountain-04` — Crag 45% / Ridge 45% / Hopper 10% (mountain T1; shared by 1 authored node)

Dominant family **Crag** drops `empowered`, punishes `affliction`. Authored Crag 45% / Ridge 45% / Hopper 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 18 | 6850 | 6.00 | +0.0% | 0 | technique.cast-flare x47 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 16 | 7794 | 5.33 | -11.1% | 0 | kill-chain.kill-pulse x16 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 18 | 6767 | 6.00 | +0.0% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 18 | 6850 | 6.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 17 | 5559 | 5.67 | +13.3% | 0 | tempo.ghost-strike x45 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 16 | 6544 | 5.33 | +6.7% | 0 | affliction.bleed-pips x131 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 18 | 5444 | 6.00 | +20.0% | 0 | engagement.opening-flash x15 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 15 | 6840 | 5.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 17 | 5847 | 5.67 | +6.3% | 0 | empowered.plating-crack x18 |
| `lineage-hammer-control` | control | 1 | cooldown | 18 | 5317 | 6.00 | +12.5% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 18 | 5278 | 6.00 | +12.5% | 0 | engagement.brace-sparks x15 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 16 | 6400 | 5.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 13 | 8608 | 4.33 | +0.0% | 0 | tempo.ghost-strike x39 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 13 | 8669 | 4.33 | +0.0% | 0 | kill-chain.kill-pulse x13 |
| `lineage-axe-empowered` | empowered | 1 | dot | 13 | 8608 | 4.33 | +0.0% | 0 | empowered.weak-point x13 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 13 | 8608 | 4.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 17 | 6218 | 5.67 | +21.4% | 0 | affliction.venom-pips x171 |
| `lineage-dagger-control` | control | 1 | reload | 17 | 6206 | 5.67 | +21.4% | 0 | control.frost-drag x57 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 15 | 7280 | 5.00 | +7.1% | 0 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 14 | 7736 | 4.67 | — | 0 | — |

### `node-t1-mountain-05` — Crag 34% / Ridge 33% / Hopper 33% (mountain T1; shared by 1 authored node)

Dominant family **Crag** drops `empowered`, punishes `affliction`. Authored Crag 34% / Ridge 33% / Hopper 33%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 18 | 6478 | 6.00 | +0.0% | 0 | technique.cast-flare x44 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 16 | 7488 | 5.33 | -11.1% | 0 | kill-chain.kill-pulse x16 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 18 | 6922 | 6.00 | +0.0% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 18 | 6478 | 6.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 18 | 5828 | 6.00 | +0.0% | 0 | tempo.ghost-strike x49 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 18 | 6033 | 6.00 | +0.0% | 0 | affliction.bleed-pips x135 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 18 | 5706 | 6.00 | +0.0% | 0 | engagement.opening-flash x12 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 18 | 6089 | 6.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 16 | 5644 | 5.33 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | 1 | cooldown | 17 | 5341 | 5.67 | +6.3% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 19 | 4958 | 6.33 | +18.8% | 0 | engagement.brace-sparks x15 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 16 | 5713 | 5.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 12 | 8825 | 4.00 | +0.0% | 0 | tempo.ghost-strike x34 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 13 | 8785 | 4.33 | +8.3% | 0 | kill-chain.kill-pulse x13 |
| `lineage-axe-empowered` | empowered | 1 | dot | 12 | 8825 | 4.00 | +0.0% | 0 | empowered.weak-point x12 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 12 | 8750 | 4.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 18 | 6478 | 6.00 | +20.0% | 0 | affliction.venom-pips x179 |
| `lineage-dagger-control` | control | 1 | reload | 19 | 6037 | 6.33 | +26.7% | 0 | control.frost-drag x56 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 16 | 6644 | 5.33 | +6.7% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 15 | 7000 | 5.00 | — | 0 | — |

### `node-t1-cave-01` — Brood 70% / Brute 20% / Deep 10% (cave T1; shared by 1 authored node)

Dominant family **Brood** drops `affliction`, punishes `tempo`. Authored Brood 70% / Brute 20% / Deep 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 25 | 3544 | 8.33 | +13.6% | 0 | technique.cast-flare x37 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 24 | 3425 | 8.00 | +9.1% | 0 | kill-chain.kill-pulse x24 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 24 | 3421 | 8.00 | +9.1% | 0 | empowered.weak-point x5 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 22 | 4059 | 7.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 30 | 2613 | 10.00 | +20.0% | 0 | tempo.ghost-strike x39 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 25 | 3148 | 8.33 | +0.0% | 0 | affliction.bleed-pips x106 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 33 | 2206 | 11.00 | +32.0% | 0 | engagement.opening-flash x16 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 25 | 3272 | 8.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 23 | 2917 | 7.67 | +0.0% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | 1 | cooldown | 23 | 2917 | 7.67 | +0.0% | 0 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 23 | 3143 | 7.67 | +0.0% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 23 | 2917 | 7.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 17 | 4288 | 5.67 | +0.0% | 0 | tempo.ghost-strike x28 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 19 | 3784 | 6.33 | +11.8% | 0 | kill-chain.kill-pulse x19 |
| `lineage-axe-empowered` | empowered | 1 | dot | 16 | 4281 | 5.33 | -5.9% | 0 | empowered.weak-point x4 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 17 | 4288 | 5.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 25 | 3192 | 8.33 | +25.0% | 0 | affliction.venom-pips x146 |
| `lineage-dagger-control` | control | 1 | reload | 26 | 3350 | 8.67 | +30.0% | 0 | control.frost-drag x51 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 24 | 3883 | 8.00 | +20.0% | 0 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 20 | 4670 | 6.67 | — | 0 | — |
| `frame-cadence-light` | _frame light_ | 1 | cadence | 29 | 2797 | 9.67 | — | 0 | — |
| `frame-cadence-balanced` | _frame balanced_ | 1 | cadence | 25 | 3272 | 8.33 | — | 0 | — |
| `frame-cadence-heavy` | _frame heavy_ | 1 | cadence | 25 | 3040 | 8.33 | — | 0 | — |
| `frame-cooldown-light` | _frame light_ | 1 | cooldown | 24 | 3313 | 8.00 | — | 0 | — |
| `frame-cooldown-balanced` | _frame balanced_ | 1 | cooldown | 22 | 3182 | 7.33 | — | 0 | — |
| `frame-cooldown-heavy` | _frame heavy_ | 1 | cooldown | 23 | 2917 | 7.67 | — | 0 | — |
| `frame-reload-light` | _frame light_ | 1 | reload | 26 | 3185 | 8.67 | — | 0 | — |
| `frame-reload-balanced` | _frame balanced_ | 1 | reload | 23 | 4278 | 7.67 | — | 0 | — |
| `frame-reload-heavy` | _frame heavy_ | 1 | reload | 20 | 4670 | 6.67 | — | 0 | — |
| `frame-energy-light` | _frame light_ | 1 | energy | 27 | 3500 | 9.00 | — | 0 | — |
| `frame-energy-balanced` | _frame balanced_ | 1 | energy | 25 | 3956 | 8.33 | — | 0 | — |
| `frame-energy-heavy` | _frame heavy_ | 1 | energy | 22 | 4059 | 7.33 | — | 0 | — |
| `frame-dot-light` | _frame light_ | 1 | dot | 21 | 3729 | 7.00 | — | 0 | — |
| `frame-dot-balanced` | _frame balanced_ | 1 | dot | 17 | 4288 | 5.67 | — | 0 | — |
| `frame-dot-heavy` | _frame heavy_ | 1 | dot | 21 | 3329 | 7.00 | — | 0 | — |
| `frame-summoner-light` | _frame light_ | 1 | summoner | 33 | 0 | 11.00 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | 1 | summoner | 34 | 56 | 11.33 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | 1 | summoner | 44 | 907 | 14.67 | — | 0 | — |

### `node-t1-cave-02` — Brute 70% / Deep 20% / Brood 10% (cave T1; shared by 1 authored node)

Dominant family **Brute** drops `empowered`, punishes `affliction`. Authored Brute 70% / Deep 20% / Brood 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 16 | 7475 | 5.33 | +0.0% | 0 | technique.cast-flare x45 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 16 | 7519 | 5.33 | +0.0% | 0 | kill-chain.kill-pulse x16 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 15 | 7547 | 5.00 | -6.3% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 16 | 7475 | 5.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 12 | 7417 | 4.00 | +9.1% | 0 | tempo.ghost-strike x39 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 12 | 6967 | 4.00 | +9.1% | 0 | affliction.bleed-pips x98 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 13 | 6462 | 4.33 | +18.2% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 11 | 8745 | 3.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 13 | 4346 | 4.33 | -7.1% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | 1 | cooldown | 13 | 4162 | 4.33 | -7.1% | 0 | control.frost-drag x9 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 12 | 4500 | 4.00 | -14.3% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 14 | 4821 | 4.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 13 | 7738 | 4.33 | +0.0% | 0 | tempo.ghost-strike x36 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 14 | 8443 | 4.67 | +7.7% | 0 | kill-chain.kill-pulse x14 |
| `lineage-axe-empowered` | empowered | 1 | dot | 13 | 8492 | 4.33 | +0.0% | 0 | empowered.weak-point x13 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 13 | 7869 | 4.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 16 | 7006 | 5.33 | +14.3% | 0 | affliction.venom-pips x195 |
| `lineage-dagger-control` | control | 1 | reload | 15 | 6847 | 5.00 | +7.1% | 0 | control.frost-drag x58 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 15 | 7353 | 5.00 | +7.1% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 14 | 7179 | 4.67 | — | 0 | — |

### `node-t1-cave-03` — Deep 70% / Brood 20% / Brute 10% (cave T1; shared by 1 authored node)

Dominant family **Deep** drops `kill-chain`, punishes `engagement`. Authored Deep 70% / Brood 20% / Brute 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 16 | 6019 | 5.33 | +0.0% | 0 | technique.cast-flare x40 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 16 | 6056 | 5.33 | +0.0% | 0 | kill-chain.kill-pulse x16 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 20 | 4160 | 6.67 | +25.0% | 0 | empowered.weak-point x5 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 16 | 6019 | 5.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 18 | 4056 | 6.00 | +0.0% | 0 | tempo.ghost-strike x40 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 18 | 4100 | 6.00 | +0.0% | 0 | affliction.bleed-pips x107 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 18 | 3933 | 6.00 | +0.0% | 0 | engagement.opening-flash x16 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 18 | 4144 | 6.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 16 | 3650 | 5.33 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | 1 | cooldown | 17 | 3500 | 5.67 | +6.3% | 0 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 17 | 3500 | 5.67 | +6.3% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 16 | 3650 | 5.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 13 | 7554 | 4.33 | +0.0% | 0 | tempo.ghost-strike x36 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 15 | 6000 | 5.00 | +15.4% | 0 | kill-chain.kill-pulse x15 |
| `lineage-axe-empowered` | empowered | 1 | dot | 13 | 6154 | 4.33 | +0.0% | 0 | empowered.weak-point x11 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 13 | 7223 | 4.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 15 | 4700 | 5.00 | +7.1% | 0 | affliction.venom-pips x150 |
| `lineage-dagger-control` | control | 1 | reload | 17 | 4741 | 5.67 | +21.4% | 0 | control.frost-drag x48 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 14 | 5636 | 4.67 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 14 | 5493 | 4.67 | — | 0 | — |

### `node-t1-cave-04` — Brood 45% / Brute 45% / Deep 10% (cave T1; shared by 1 authored node)

Dominant family **Brood** drops `affliction`, punishes `tempo`. Authored Brood 45% / Brute 45% / Deep 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 22 | 4559 | 7.33 | +10.0% | 0 | technique.cast-flare x40 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 21 | 4690 | 7.00 | +5.0% | 0 | kill-chain.kill-pulse x21 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 24 | 3925 | 8.00 | +20.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 20 | 4980 | 6.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 22 | 3505 | 7.33 | +15.8% | 0 | tempo.ghost-strike x37 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 19 | 4247 | 6.33 | +0.0% | 0 | affliction.bleed-pips x95 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 19 | 3889 | 6.33 | +0.0% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 19 | 4468 | 6.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 21 | 2848 | 7.00 | +0.0% | 0 | empowered.plating-crack x13 |
| `lineage-hammer-control` | control | 1 | cooldown | 21 | 2848 | 7.00 | +0.0% | 0 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 21 | 2857 | 7.00 | +0.0% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 21 | 2967 | 7.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 18 | 5728 | 6.00 | -10.0% | 0 | tempo.ghost-strike x36 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 20 | 4675 | 6.67 | +0.0% | 0 | kill-chain.kill-pulse x20 |
| `lineage-axe-empowered` | empowered | 1 | dot | 19 | 4063 | 6.33 | -5.0% | 0 | empowered.weak-point x6 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 20 | 5255 | 6.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 23 | 3678 | 7.67 | +21.1% | 0 | affliction.venom-pips x156 |
| `lineage-dagger-control` | control | 1 | reload | 20 | 4555 | 6.67 | +5.3% | 0 | control.frost-drag x53 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 20 | 4900 | 6.67 | +5.3% | 0 | kill-chain.spread-arc x4 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 19 | 4847 | 6.33 | — | 0 | — |

### `node-t1-cave-05` — Brood 34% / Brute 33% / Deep 33% (cave T1; shared by 1 authored node)

Dominant family **Brood** drops `affliction`, punishes `tempo`. Authored Brood 34% / Brute 33% / Deep 33%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 20 | 4715 | 6.67 | +0.0% | 0 | technique.cast-flare x39 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 22 | 4659 | 7.33 | +10.0% | 0 | kill-chain.kill-pulse x22 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 21 | 4876 | 7.00 | +5.0% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 20 | 4715 | 6.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 23 | 3370 | 7.67 | +9.5% | 0 | tempo.ghost-strike x39 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 21 | 3376 | 7.00 | +0.0% | 0 | affliction.bleed-pips x99 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 22 | 3518 | 7.33 | +4.8% | 0 | engagement.opening-flash x12 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 21 | 3695 | 7.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 24 | 3050 | 8.00 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | 1 | cooldown | 25 | 2760 | 8.33 | +4.2% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 25 | 2724 | 8.33 | +4.2% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 24 | 3163 | 8.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 17 | 5012 | 5.67 | +6.3% | 0 | tempo.ghost-strike x32 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 15 | 6267 | 5.00 | -6.3% | 0 | kill-chain.kill-pulse x15 |
| `lineage-axe-empowered` | empowered | 1 | dot | 14 | 6521 | 4.67 | -12.5% | 0 | empowered.weak-point x9 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 16 | 5944 | 5.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 24 | 3363 | 8.00 | +9.1% | 0 | affliction.venom-pips x147 |
| `lineage-dagger-control` | control | 1 | reload | 21 | 3948 | 7.00 | -4.5% | 0 | control.frost-drag x46 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 24 | 3929 | 8.00 | +9.1% | 0 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 22 | 4064 | 7.33 | — | 0 | — |

### `node-t1-forest-01` — Pack 70% / Grove 20% / Canopy 10% (forest T1; shared by 1 authored node)

Dominant family **Pack** drops `tempo`, punishes `empowered`. Authored Pack 70% / Grove 20% / Canopy 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 58 | 2148 | 19.33 | +23.4% | 1 | technique.cast-flare x26 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 49 | 2500 | 16.33 | +4.3% | 2 | kill-chain.kill-pulse x12 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 50 | 2404 | 16.67 | +6.4% | 1 | empowered.weak-point x3 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 47 | 2619 | 15.67 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 50 | 1784 | 16.67 | +28.2% | 0 | tempo.ghost-strike x41 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 38 | 2113 | 12.67 | -2.6% | 0 | affliction.bleed-pips x98 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 44 | 1986 | 14.67 | +12.8% | 0 | engagement.opening-flash x17 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 39 | 2164 | 13.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 38 | 2342 | 12.67 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | 1 | cooldown | 38 | 2342 | 12.67 | +0.0% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 40 | 2085 | 13.33 | +5.3% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 38 | 2342 | 12.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 38 | 3279 | 12.67 | +0.0% | 3 | tempo.ghost-strike x7 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 46 | 3396 | 15.33 | +21.1% | 6 | kill-chain.kill-pulse x6 |
| `lineage-axe-empowered` | empowered | 1 | dot | 37 | 3449 | 12.33 | -2.6% | 3 | — |
| `lineage-axe-baseline` | _control_ | 1 | dot | 38 | 3279 | 12.67 | — | 3 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 48 | 2665 | 16.00 | +9.1% | 2 | affliction.venom-pips x54 |
| `lineage-dagger-control` | control | 1 | reload | 42 | 2688 | 14.00 | -4.5% | 2 | control.frost-drag x17 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 44 | 3136 | 14.67 | +0.0% | 3 | kill-chain.spread-arc x13 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 44 | 3086 | 14.67 | — | 3 | — |
| `frame-cadence-light` | _frame light_ | 1 | cadence | 44 | 2045 | 14.67 | — | 0 | — |
| `frame-cadence-balanced` | _frame balanced_ | 1 | cadence | 39 | 2164 | 13.00 | — | 0 | — |
| `frame-cadence-heavy` | _frame heavy_ | 1 | cadence | 46 | 1946 | 15.33 | — | 0 | — |
| `frame-cooldown-light` | _frame light_ | 1 | cooldown | 42 | 2279 | 14.00 | — | 0 | — |
| `frame-cooldown-balanced` | _frame balanced_ | 1 | cooldown | 40 | 2228 | 13.33 | — | 0 | — |
| `frame-cooldown-heavy` | _frame heavy_ | 1 | cooldown | 38 | 2342 | 12.67 | — | 0 | — |
| `frame-reload-light` | _frame light_ | 1 | reload | 38 | 3511 | 12.67 | — | 3 | — |
| `frame-reload-balanced` | _frame balanced_ | 1 | reload | 40 | 3260 | 13.33 | — | 3 | — |
| `frame-reload-heavy` | _frame heavy_ | 1 | reload | 44 | 3086 | 14.67 | — | 3 | — |
| `frame-energy-light` | _frame light_ | 1 | energy | 53 | 2351 | 17.67 | — | 2 | — |
| `frame-energy-balanced` | _frame balanced_ | 1 | energy | 45 | 2658 | 15.00 | — | 3 | — |
| `frame-energy-heavy` | _frame heavy_ | 1 | energy | 47 | 2619 | 15.67 | — | 1 | — |
| `frame-dot-light` | _frame light_ | 1 | dot | 43 | 3012 | 14.33 | — | 3 | — |
| `frame-dot-balanced` | _frame balanced_ | 1 | dot | 38 | 3279 | 12.67 | — | 3 | — |
| `frame-dot-heavy` | _frame heavy_ | 1 | dot | 39 | 2631 | 13.00 | — | 2 | — |
| `frame-summoner-light` | _frame light_ | 1 | summoner | 56 | 1255 | 18.67 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | 1 | summoner | 48 | 1010 | 16.00 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | 1 | summoner | 69 | 1346 | 23.00 | — | 0 | — |

### `node-t1-forest-02` — Grove 70% / Canopy 20% / Pack 10% (forest T1; shared by 1 authored node)

Dominant family **Grove** drops `empowered`, punishes `tempo`. Authored Grove 70% / Canopy 20% / Pack 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 30 | 4287 | 10.00 | +15.4% | 0 | technique.cast-flare x45 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 31 | 4842 | 10.33 | +19.2% | 0 | kill-chain.kill-pulse x31 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 31 | 4277 | 10.33 | +19.2% | 2 | empowered.weak-point x4 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 26 | 5131 | 8.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 30 | 3640 | 10.00 | +11.1% | 0 | tempo.ghost-strike x48 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 27 | 4319 | 9.00 | +0.0% | 0 | affliction.bleed-pips x138 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 33 | 3476 | 11.00 | +22.2% | 0 | engagement.opening-flash x10 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 27 | 4533 | 9.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 23 | 5165 | 7.67 | +0.0% | 0 | empowered.plating-crack x18 |
| `lineage-hammer-control` | control | 1 | cooldown | 25 | 4520 | 8.33 | +8.7% | 0 | control.frost-drag x16 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 25 | 4544 | 8.33 | +8.7% | 0 | engagement.brace-sparks x15 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 23 | 5165 | 7.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 27 | 5115 | 9.00 | -15.6% | 1 | tempo.ghost-strike x39 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 29 | 4531 | 9.67 | -9.4% | 0 | kill-chain.kill-pulse x29 |
| `lineage-axe-empowered` | empowered | 1 | dot | 29 | 4717 | 9.67 | -9.4% | 1 | empowered.weak-point x11 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 32 | 4928 | 10.67 | — | 2 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 29 | 4610 | 9.67 | -3.3% | 0 | affliction.venom-pips x197 |
| `lineage-dagger-control` | control | 1 | reload | 35 | 4094 | 11.67 | +16.7% | 1 | control.frost-drag x62 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 28 | 4457 | 9.33 | -6.7% | 0 | kill-chain.spread-arc x10 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 30 | 4557 | 10.00 | — | 0 | — |

### `node-t1-forest-03` — Canopy 70% / Pack 20% / Grove 10% (forest T1; shared by 1 authored node)

Dominant family **Canopy** drops `affliction`, punishes `control`. Authored Canopy 70% / Pack 20% / Grove 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 32 | 2788 | 10.67 | +3.2% | 0 | technique.cast-flare x41 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 29 | 3083 | 9.67 | -6.5% | 0 | kill-chain.kill-pulse x29 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 34 | 2815 | 11.33 | +9.7% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 31 | 2894 | 10.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 28 | 2679 | 9.33 | -3.4% | 0 | tempo.ghost-strike x35 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 29 | 2731 | 9.67 | +0.0% | 0 | affliction.bleed-pips x102 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 30 | 2620 | 10.00 | +3.4% | 0 | engagement.opening-flash x14 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 29 | 2731 | 9.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 25 | 3320 | 8.33 | +0.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | 1 | cooldown | 25 | 3320 | 8.33 | +0.0% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 25 | 3324 | 8.33 | +0.0% | 0 | engagement.brace-sparks x16 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 25 | 3320 | 8.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 24 | 4379 | 8.00 | +0.0% | 0 | tempo.ghost-strike x35 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 27 | 3970 | 9.00 | +12.5% | 0 | kill-chain.kill-pulse x27 |
| `lineage-axe-empowered` | empowered | 1 | dot | 24 | 4379 | 8.00 | +0.0% | 0 | empowered.weak-point x1 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 24 | 4379 | 8.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 26 | 3158 | 8.67 | +13.0% | 0 | affliction.venom-pips x146 |
| `lineage-dagger-control` | control | 1 | reload | 26 | 3208 | 8.67 | +13.0% | 0 | control.frost-drag x48 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 26 | 3412 | 8.67 | +13.0% | 0 | kill-chain.spread-arc x8 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 23 | 3609 | 7.67 | — | 0 | — |

### `node-t1-forest-04` — Pack 45% / Grove 45% / Canopy 10% (forest T1; shared by 1 authored node)

Dominant family **Pack** drops `tempo`, punishes `empowered`. Authored Pack 45% / Grove 45% / Canopy 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 46 | 2374 | 15.33 | +15.0% | 0 | technique.cast-flare x39 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 47 | 2698 | 15.67 | +17.5% | 1 | kill-chain.kill-pulse x28 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 42 | 2621 | 14.00 | +5.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 40 | 3050 | 13.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 42 | 2174 | 14.00 | +23.5% | 0 | tempo.ghost-strike x41 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 36 | 2456 | 12.00 | +5.9% | 0 | affliction.bleed-pips x109 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 38 | 2295 | 12.67 | +11.8% | 0 | engagement.opening-flash x14 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 34 | 2641 | 11.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 31 | 3097 | 10.33 | +0.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | 1 | cooldown | 39 | 2554 | 13.00 | +25.8% | 0 | control.frost-drag x15 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 38 | 2608 | 12.67 | +22.6% | 0 | engagement.brace-sparks x15 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 31 | 3097 | 10.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 45 | 3044 | 15.00 | +18.4% | 3 | tempo.ghost-strike x26 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 29 | 4093 | 9.67 | -23.7% | 1 | kill-chain.kill-pulse x19 |
| `lineage-axe-empowered` | empowered | 1 | dot | 45 | 2973 | 15.00 | +18.4% | 2 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 38 | 3479 | 12.67 | — | 3 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 47 | 3115 | 15.67 | +38.2% | 2 | affliction.venom-pips x171 |
| `lineage-dagger-control` | control | 1 | reload | 40 | 2925 | 13.33 | +17.6% | 0 | control.frost-drag x63 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 46 | 3067 | 15.33 | +35.3% | 3 | kill-chain.spread-arc x23 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 34 | 3562 | 11.33 | — | 0 | — |

### `node-t1-forest-05` — Pack 34% / Grove 33% / Canopy 33% (forest T1; shared by 1 authored node)

Dominant family **Pack** drops `tempo`, punishes `empowered`. Authored Pack 34% / Grove 33% / Canopy 33%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 40 | 2810 | 13.33 | +17.6% | 0 | technique.cast-flare x43 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 36 | 2900 | 12.00 | +5.9% | 0 | kill-chain.kill-pulse x36 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 34 | 3241 | 11.33 | +0.0% | 1 | empowered.weak-point x3 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 34 | 3641 | 11.33 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 33 | 2685 | 11.00 | +3.1% | 0 | tempo.ghost-strike x39 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 34 | 2432 | 11.33 | +6.3% | 0 | affliction.bleed-pips x105 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 34 | 2482 | 11.33 | +6.3% | 0 | engagement.opening-flash x18 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 32 | 2684 | 10.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 34 | 2724 | 11.33 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | 1 | cooldown | 34 | 2724 | 11.33 | +0.0% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 36 | 2589 | 12.00 | +5.9% | 0 | engagement.brace-sparks x16 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 34 | 2724 | 11.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 31 | 3694 | 10.33 | -11.4% | 0 | tempo.ghost-strike x38 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 28 | 4636 | 9.33 | -20.0% | 3 | kill-chain.kill-pulse x16 |
| `lineage-axe-empowered` | empowered | 1 | dot | 28 | 3918 | 9.33 | -20.0% | 0 | empowered.weak-point x8 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 35 | 3800 | 11.67 | — | 3 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 29 | 3266 | 9.67 | -17.1% | 0 | affliction.venom-pips x154 |
| `lineage-dagger-control` | control | 1 | reload | 39 | 2956 | 13.00 | +11.4% | 0 | control.frost-drag x60 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 41 | 3061 | 13.67 | +17.1% | 1 | kill-chain.spread-arc x24 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 35 | 3254 | 11.67 | — | 0 | — |

### `node-t1-plains-01` — Herd 70% / Swarm 20% / Sky 10% (plains T1; shared by 1 authored node)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Herd 70% / Swarm 20% / Sky 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 43 | 2823 | 14.33 | +13.2% | 0 | technique.cast-flare x50 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 47 | 2664 | 15.67 | +23.7% | 0 | kill-chain.kill-pulse x47 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 38 | 2866 | 12.67 | +0.0% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 38 | 2866 | 12.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 46 | 2146 | 15.33 | +0.0% | 0 | tempo.ghost-strike x54 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 51 | 2055 | 17.00 | +10.9% | 0 | affliction.bleed-pips x155 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 51 | 1910 | 17.00 | +10.9% | 0 | engagement.opening-flash x10 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 46 | 2267 | 15.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 36 | 2983 | 12.00 | +0.0% | 0 | empowered.plating-crack x18 |
| `lineage-hammer-control` | control | 1 | cooldown | 36 | 2983 | 12.00 | +0.0% | 0 | control.frost-drag x19 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 35 | 3069 | 11.67 | -2.8% | 0 | engagement.brace-sparks x8 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 36 | 2983 | 12.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 30 | 3577 | 10.00 | +0.0% | 0 | tempo.ghost-strike x40 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 35 | 3351 | 11.67 | +16.7% | 0 | kill-chain.kill-pulse x35 |
| `lineage-axe-empowered` | empowered | 1 | dot | 31 | 3413 | 10.33 | +3.3% | 0 | — |
| `lineage-axe-baseline` | _control_ | 1 | dot | 30 | 3577 | 10.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 40 | 2793 | 13.33 | +0.0% | 0 | affliction.venom-pips x198 |
| `lineage-dagger-control` | control | 1 | reload | 44 | 2684 | 14.67 | +10.0% | 0 | control.frost-drag x69 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 38 | 2861 | 12.67 | -5.0% | 0 | kill-chain.spread-arc x6 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 40 | 2973 | 13.33 | — | 0 | — |
| `frame-cadence-light` | _frame light_ | 1 | cadence | 47 | 2009 | 15.67 | — | 0 | — |
| `frame-cadence-balanced` | _frame balanced_ | 1 | cadence | 46 | 2267 | 15.33 | — | 0 | — |
| `frame-cadence-heavy` | _frame heavy_ | 1 | cadence | 54 | 1998 | 18.00 | — | 0 | — |
| `frame-cooldown-light` | _frame light_ | 1 | cooldown | 41 | 2337 | 13.67 | — | 0 | — |
| `frame-cooldown-balanced` | _frame balanced_ | 1 | cooldown | 39 | 2536 | 13.00 | — | 0 | — |
| `frame-cooldown-heavy` | _frame heavy_ | 1 | cooldown | 36 | 2983 | 12.00 | — | 0 | — |
| `frame-reload-light` | _frame light_ | 1 | reload | 40 | 2985 | 13.33 | — | 0 | — |
| `frame-reload-balanced` | _frame balanced_ | 1 | reload | 41 | 2966 | 13.67 | — | 0 | — |
| `frame-reload-heavy` | _frame heavy_ | 1 | reload | 40 | 2973 | 13.33 | — | 0 | — |
| `frame-energy-light` | _frame light_ | 1 | energy | 49 | 2447 | 16.33 | — | 0 | — |
| `frame-energy-balanced` | _frame balanced_ | 1 | energy | 43 | 2779 | 14.33 | — | 0 | — |
| `frame-energy-heavy` | _frame heavy_ | 1 | energy | 38 | 2866 | 12.67 | — | 0 | — |
| `frame-dot-light` | _frame light_ | 1 | dot | 36 | 3244 | 12.00 | — | 0 | — |
| `frame-dot-balanced` | _frame balanced_ | 1 | dot | 30 | 3577 | 10.00 | — | 0 | — |
| `frame-dot-heavy` | _frame heavy_ | 1 | dot | 29 | 3514 | 9.67 | — | 0 | — |
| `frame-summoner-light` | _frame light_ | 1 | summoner | 49 | 445 | 16.33 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | 1 | summoner | 52 | 463 | 17.33 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | 1 | summoner | 79 | 775 | 26.33 | — | 0 | — |

### `node-t1-plains-02` — Swarm 70% / Sky 20% / Herd 10% (plains T1; shared by 1 authored node)

Dominant family **Swarm** drops `technique`, punishes `empowered`. Authored Swarm 70% / Sky 20% / Herd 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 52 | 1967 | 17.33 | +2.0% | 0 | technique.cast-flare x48 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 59 | 1817 | 19.67 | +15.7% | 0 | kill-chain.kill-pulse x59 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 51 | 2035 | 17.00 | +0.0% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 51 | 2035 | 17.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 59 | 1398 | 19.67 | -1.7% | 0 | tempo.ghost-strike x42 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 66 | 1459 | 22.00 | +10.0% | 0 | affliction.bleed-pips x138 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 61 | 1439 | 20.33 | +1.7% | 0 | engagement.opening-flash x9 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 60 | 1625 | 20.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 50 | 1992 | 16.67 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | 1 | cooldown | 50 | 1992 | 16.67 | +0.0% | 0 | control.frost-drag x18 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 50 | 1992 | 16.67 | +0.0% | 0 | engagement.brace-sparks x10 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 50 | 1992 | 16.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 42 | 2545 | 14.00 | +0.0% | 0 | tempo.ghost-strike x41 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 43 | 2670 | 14.33 | +2.4% | 0 | kill-chain.kill-pulse x43 |
| `lineage-axe-empowered` | empowered | 1 | dot | 42 | 2545 | 14.00 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | 1 | dot | 42 | 2545 | 14.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 52 | 1960 | 17.33 | +2.0% | 0 | affliction.venom-pips x184 |
| `lineage-dagger-control` | control | 1 | reload | 51 | 1943 | 17.00 | +0.0% | 0 | control.frost-drag x59 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 51 | 2116 | 17.00 | +0.0% | 0 | kill-chain.spread-arc x10 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 51 | 2257 | 17.00 | — | 0 | — |

### `node-t1-plains-03` — Sky 70% / Herd 20% / Swarm 10% (plains T1; shared by 1 authored node)

Dominant family **Sky** drops `engagement`, punishes `affliction`. Authored Sky 70% / Herd 20% / Swarm 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 43 | 2874 | 14.33 | -8.5% | 0 | technique.cast-flare x49 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 49 | 2620 | 16.33 | +4.3% | 0 | kill-chain.kill-pulse x49 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 47 | 2738 | 15.67 | +0.0% | 0 | empowered.weak-point x8 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 47 | 2738 | 15.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 42 | 2245 | 14.00 | -4.5% | 0 | tempo.ghost-strike x43 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 42 | 2533 | 14.00 | -4.5% | 0 | affliction.bleed-pips x132 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 49 | 2094 | 16.33 | +11.4% | 0 | engagement.opening-flash x11 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 44 | 2500 | 14.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 35 | 3183 | 11.67 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | 1 | cooldown | 35 | 3183 | 11.67 | +0.0% | 0 | control.frost-drag x17 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 35 | 3217 | 11.67 | +0.0% | 0 | engagement.brace-sparks x10 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 35 | 3183 | 11.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 34 | 3691 | 11.33 | +0.0% | 0 | tempo.ghost-strike x43 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 33 | 3942 | 11.00 | -2.9% | 0 | kill-chain.kill-pulse x33 |
| `lineage-axe-empowered` | empowered | 1 | dot | 32 | 3791 | 10.67 | -5.9% | 0 | — |
| `lineage-axe-baseline` | _control_ | 1 | dot | 34 | 3691 | 11.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 39 | 2972 | 13.00 | +0.0% | 0 | affliction.venom-pips x182 |
| `lineage-dagger-control` | control | 1 | reload | 44 | 2893 | 14.67 | +12.8% | 0 | control.frost-drag x67 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 38 | 3303 | 12.67 | -2.6% | 0 | kill-chain.spread-arc x9 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 39 | 3367 | 13.00 | — | 0 | — |

### `node-t1-plains-04` — Herd 45% / Swarm 45% / Sky 10% (plains T1; shared by 1 authored node)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Herd 45% / Swarm 45% / Sky 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 45 | 2238 | 15.00 | +4.7% | 0 | technique.cast-flare x48 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 39 | 2587 | 13.00 | -9.3% | 0 | kill-chain.kill-pulse x39 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 43 | 2342 | 14.33 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 43 | 2342 | 14.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 52 | 1754 | 17.33 | +4.0% | 0 | tempo.ghost-strike x50 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 52 | 1800 | 17.33 | +4.0% | 0 | affliction.bleed-pips x139 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 57 | 1609 | 19.00 | +14.0% | 0 | engagement.opening-flash x9 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 50 | 1962 | 16.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 45 | 2456 | 15.00 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | 1 | cooldown | 45 | 2456 | 15.00 | +0.0% | 0 | control.frost-drag x19 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 45 | 2456 | 15.00 | +0.0% | 0 | engagement.brace-sparks x9 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 45 | 2456 | 15.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 39 | 3251 | 13.00 | +0.0% | 0 | tempo.ghost-strike x49 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 36 | 3167 | 12.00 | -7.7% | 0 | kill-chain.kill-pulse x36 |
| `lineage-axe-empowered` | empowered | 1 | dot | 39 | 3251 | 13.00 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | 1 | dot | 39 | 3251 | 13.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 43 | 2388 | 14.33 | +0.0% | 0 | affliction.venom-pips x187 |
| `lineage-dagger-control` | control | 1 | reload | 40 | 2385 | 13.33 | -7.0% | 0 | control.frost-drag x56 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 47 | 2528 | 15.67 | +9.3% | 0 | kill-chain.spread-arc x12 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 43 | 2658 | 14.33 | — | 0 | — |

### `node-t1-plains-05` — Herd 34% / Swarm 33% / Sky 33% (plains T1; shared by 1 authored node)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Herd 34% / Swarm 33% / Sky 33%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 43 | 2602 | 14.33 | +2.4% | 0 | technique.cast-flare x50 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 45 | 2624 | 15.00 | +7.1% | 0 | kill-chain.kill-pulse x45 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 42 | 2655 | 14.00 | +0.0% | 0 | empowered.weak-point x8 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 42 | 2655 | 14.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 50 | 1988 | 16.67 | +2.0% | 0 | tempo.ghost-strike x52 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 44 | 2098 | 14.67 | -10.2% | 0 | affliction.bleed-pips x127 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 44 | 1907 | 14.67 | -10.2% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 49 | 2065 | 16.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 40 | 2330 | 13.33 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | 1 | cooldown | 40 | 2330 | 13.33 | +0.0% | 0 | control.frost-drag x16 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 40 | 2438 | 13.33 | +0.0% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 40 | 2330 | 13.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 32 | 3431 | 10.67 | +0.0% | 0 | tempo.ghost-strike x40 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 36 | 3364 | 12.00 | +12.5% | 0 | kill-chain.kill-pulse x36 |
| `lineage-axe-empowered` | empowered | 1 | dot | 32 | 3431 | 10.67 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | 1 | dot | 32 | 3431 | 10.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 39 | 2544 | 13.00 | -7.1% | 0 | affliction.venom-pips x177 |
| `lineage-dagger-control` | control | 1 | reload | 45 | 2440 | 15.00 | +7.1% | 0 | control.frost-drag x64 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 41 | 2763 | 13.67 | -2.4% | 0 | kill-chain.spread-arc x11 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 42 | 2712 | 14.00 | — | 0 | — |

### `node-t1-swamp-01` — Mire 70% / Coven 20% / Stalker 10% (swamp T1; shared by 1 authored node)

Dominant family **Mire** drops `affliction`, punishes `empowered`. Authored Mire 70% / Coven 20% / Stalker 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 17 | 5300 | 5.67 | +0.0% | 0 | technique.cast-flare x36 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 17 | 5700 | 5.67 | +0.0% | 0 | kill-chain.kill-pulse x17 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 16 | 5356 | 5.33 | -5.9% | 0 | empowered.weak-point x5 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 17 | 5300 | 5.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 13 | 5000 | 4.33 | +0.0% | 0 | tempo.ghost-strike x30 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 13 | 5585 | 4.33 | +0.0% | 0 | affliction.bleed-pips x93 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 16 | 4550 | 5.33 | +23.1% | 0 | engagement.opening-flash x12 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 13 | 5585 | 4.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 14 | 4814 | 4.67 | +16.7% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | 1 | cooldown | 13 | 4262 | 4.33 | +8.3% | 0 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 13 | 4262 | 4.33 | +8.3% | 0 | engagement.brace-sparks x11 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 12 | 5833 | 4.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 14 | 6514 | 4.67 | +7.7% | 0 | tempo.ghost-strike x33 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 12 | 7767 | 4.00 | -7.7% | 0 | kill-chain.kill-pulse x12 |
| `lineage-axe-empowered` | empowered | 1 | dot | 13 | 6708 | 4.33 | +0.0% | 0 | empowered.weak-point x7 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 13 | 6508 | 4.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 16 | 5300 | 5.33 | -5.9% | 0 | affliction.venom-pips x141 |
| `lineage-dagger-control` | control | 1 | reload | 16 | 5313 | 5.33 | -5.9% | 0 | control.frost-drag x47 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 17 | 5741 | 5.67 | +0.0% | 0 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 17 | 5647 | 5.67 | — | 0 | — |
| `frame-cadence-light` | _frame light_ | 1 | cadence | 13 | 4946 | 4.33 | — | 0 | — |
| `frame-cadence-balanced` | _frame balanced_ | 1 | cadence | 13 | 5585 | 4.33 | — | 0 | — |
| `frame-cadence-heavy` | _frame heavy_ | 1 | cadence | 16 | 4638 | 5.33 | — | 0 | — |
| `frame-cooldown-light` | _frame light_ | 1 | cooldown | 14 | 5979 | 4.67 | — | 0 | — |
| `frame-cooldown-balanced` | _frame balanced_ | 1 | cooldown | 13 | 5892 | 4.33 | — | 0 | — |
| `frame-cooldown-heavy` | _frame heavy_ | 1 | cooldown | 12 | 5833 | 4.00 | — | 0 | — |
| `frame-reload-light` | _frame light_ | 1 | reload | 16 | 5956 | 5.33 | — | 0 | — |
| `frame-reload-balanced` | _frame balanced_ | 1 | reload | 14 | 6571 | 4.67 | — | 0 | — |
| `frame-reload-heavy` | _frame heavy_ | 1 | reload | 17 | 5647 | 5.67 | — | 0 | — |
| `frame-energy-light` | _frame light_ | 1 | energy | 17 | 6135 | 5.67 | — | 0 | — |
| `frame-energy-balanced` | _frame balanced_ | 1 | energy | 18 | 5817 | 6.00 | — | 0 | — |
| `frame-energy-heavy` | _frame heavy_ | 1 | energy | 17 | 5300 | 5.67 | — | 0 | — |
| `frame-dot-light` | _frame light_ | 1 | dot | 12 | 7433 | 4.00 | — | 0 | — |
| `frame-dot-balanced` | _frame balanced_ | 1 | dot | 13 | 6508 | 4.33 | — | 0 | — |
| `frame-dot-heavy` | _frame heavy_ | 1 | dot | 12 | 7417 | 4.00 | — | 0 | — |
| `frame-summoner-light` | _frame light_ | 1 | summoner | 23 | 0 | 7.67 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | 1 | summoner | 17 | 553 | 5.67 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | 1 | summoner | 35 | 131 | 11.67 | — | 0 | — |

### `node-t1-swamp-02` — Coven 70% / Stalker 20% / Mire 10% (swamp T1; shared by 1 authored node)

Dominant family **Coven** drops `control`, punishes `tempo`. Authored Coven 70% / Stalker 20% / Mire 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 25 | 3756 | 8.33 | +0.0% | 0 | technique.cast-flare x41 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 25 | 3796 | 8.33 | +0.0% | 0 | kill-chain.kill-pulse x25 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 25 | 3928 | 8.33 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 25 | 3756 | 8.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 22 | 3450 | 7.33 | -15.4% | 0 | tempo.ghost-strike x38 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 26 | 3888 | 8.67 | +0.0% | 0 | affliction.bleed-pips x132 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 27 | 2889 | 9.00 | +3.8% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 26 | 3954 | 8.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 18 | 4656 | 6.00 | +0.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | 1 | cooldown | 26 | 2942 | 8.67 | +44.4% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 25 | 2956 | 8.33 | +38.9% | 0 | engagement.brace-sparks x16 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 18 | 4656 | 6.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 22 | 4814 | 7.33 | +4.8% | 0 | tempo.ghost-strike x35 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 19 | 5000 | 6.33 | -9.5% | 0 | kill-chain.kill-pulse x19 |
| `lineage-axe-empowered` | empowered | 1 | dot | 21 | 4895 | 7.00 | +0.0% | 0 | empowered.weak-point x1 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 21 | 4862 | 7.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 23 | 3783 | 7.67 | -4.2% | 0 | affliction.venom-pips x151 |
| `lineage-dagger-control` | control | 1 | reload | 24 | 3629 | 8.00 | +0.0% | 0 | control.frost-drag x51 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 24 | 3946 | 8.00 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 24 | 3821 | 8.00 | — | 0 | — |

### `node-t1-swamp-03` — Stalker 70% / Mire 20% / Coven 10% (swamp T1; shared by 1 authored node)

Dominant family **Stalker** drops `kill-chain`, punishes `bulwark`. Authored Stalker 70% / Mire 20% / Coven 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 22 | 3759 | 7.33 | +0.0% | 0 | technique.cast-flare x36 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 21 | 3871 | 7.00 | -4.5% | 0 | kill-chain.kill-pulse x21 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 22 | 4041 | 7.33 | +0.0% | 0 | empowered.weak-point x5 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 22 | 3759 | 7.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 18 | 3811 | 6.00 | +5.9% | 0 | tempo.ghost-strike x36 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 18 | 3939 | 6.00 | +5.9% | 0 | affliction.bleed-pips x97 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 19 | 3326 | 6.33 | +11.8% | 0 | engagement.opening-flash x14 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 17 | 4194 | 5.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 17 | 3547 | 5.67 | +0.0% | 0 | empowered.plating-crack x13 |
| `lineage-hammer-control` | control | 1 | cooldown | 17 | 3400 | 5.67 | +0.0% | 0 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 17 | 3400 | 5.67 | +0.0% | 0 | engagement.brace-sparks x12 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 17 | 3694 | 5.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 17 | 5400 | 5.67 | +6.3% | 0 | tempo.ghost-strike x33 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 16 | 5638 | 5.33 | +0.0% | 0 | kill-chain.kill-pulse x16 |
| `lineage-axe-empowered` | empowered | 1 | dot | 16 | 5894 | 5.33 | +0.0% | 0 | empowered.weak-point x5 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 16 | 5775 | 5.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 21 | 4114 | 7.00 | +0.0% | 0 | affliction.venom-pips x152 |
| `lineage-dagger-control` | control | 1 | reload | 20 | 4075 | 6.67 | -4.8% | 0 | control.frost-drag x49 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 18 | 4817 | 6.00 | -14.3% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 21 | 4233 | 7.00 | — | 0 | — |

### `node-t1-swamp-04` — Mire 45% / Coven 45% / Stalker 10% (swamp T1; shared by 1 authored node)

Dominant family **Mire** drops `affliction`, punishes `empowered`. Authored Mire 45% / Coven 45% / Stalker 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 17 | 5247 | 5.67 | +0.0% | 0 | technique.cast-flare x37 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 20 | 5150 | 6.67 | +17.6% | 0 | kill-chain.kill-pulse x20 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 21 | 5033 | 7.00 | +23.5% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 17 | 5247 | 5.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 18 | 3978 | 6.00 | +20.0% | 0 | tempo.ghost-strike x37 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 16 | 4581 | 5.33 | +6.7% | 0 | affliction.bleed-pips x95 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 16 | 4356 | 5.33 | +6.7% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 15 | 5207 | 5.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 18 | 4744 | 6.00 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | 1 | cooldown | 21 | 3752 | 7.00 | +16.7% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 21 | 3752 | 7.00 | +16.7% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 18 | 4861 | 6.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 19 | 4774 | 6.33 | +35.7% | 0 | tempo.ghost-strike x30 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 16 | 6563 | 5.33 | +14.3% | 0 | kill-chain.kill-pulse x16 |
| `lineage-axe-empowered` | empowered | 1 | dot | 13 | 6862 | 4.33 | -7.1% | 0 | empowered.weak-point x7 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 14 | 6386 | 4.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 19 | 4874 | 6.33 | +18.8% | 0 | affliction.venom-pips x152 |
| `lineage-dagger-control` | control | 1 | reload | 19 | 4242 | 6.33 | +18.8% | 0 | control.frost-drag x44 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 17 | 5612 | 5.67 | +6.3% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 16 | 5506 | 5.33 | — | 0 | — |

### `node-t1-swamp-05` — Mire 34% / Coven 33% / Stalker 33% (swamp T1; shared by 1 authored node)

Dominant family **Mire** drops `affliction`, punishes `empowered`. Authored Mire 34% / Coven 33% / Stalker 33%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 18 | 4956 | 6.00 | +0.0% | 0 | technique.cast-flare x37 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 19 | 4453 | 6.33 | +5.6% | 0 | kill-chain.kill-pulse x19 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 17 | 5224 | 5.67 | -5.6% | 0 | empowered.weak-point x3 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 18 | 4956 | 6.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 17 | 4412 | 5.67 | +21.4% | 0 | tempo.ghost-strike x37 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 14 | 5264 | 4.67 | +0.0% | 0 | affliction.bleed-pips x99 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 18 | 4067 | 6.00 | +28.6% | 0 | engagement.opening-flash x15 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 14 | 5264 | 4.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 16 | 4144 | 5.33 | +0.0% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | 1 | cooldown | 16 | 4425 | 5.33 | +0.0% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 17 | 4271 | 5.67 | +6.3% | 0 | engagement.brace-sparks x12 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 16 | 4150 | 5.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 19 | 5468 | 6.33 | +18.8% | 0 | tempo.ghost-strike x37 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 16 | 5850 | 5.33 | +0.0% | 0 | kill-chain.kill-pulse x16 |
| `lineage-axe-empowered` | empowered | 1 | dot | 16 | 6088 | 5.33 | +0.0% | 0 | empowered.weak-point x7 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 16 | 6575 | 5.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 17 | 4853 | 5.67 | +0.0% | 0 | affliction.venom-pips x138 |
| `lineage-dagger-control` | control | 1 | reload | 19 | 4611 | 6.33 | +11.8% | 0 | control.frost-drag x51 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 18 | 5011 | 6.00 | +5.9% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 17 | 5318 | 5.67 | — | 0 | — |

### `node-t2-forest-01` — Pack 70% / Grove 20% / Canopy 10% (forest T2; shared by 1 authored node)

Dominant family **Pack** drops `tempo`, punishes `empowered`. Authored Pack 70% / Grove 20% / Canopy 10%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 15 | 9220 | 5.00 | -11.8% | 0 | technique.cast-flare x43 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 15 | 9460 | 5.00 | -11.8% | 0 | kill-chain.kill-pulse x15 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 16 | 9056 | 5.33 | -5.9% | 0 | empowered.weak-point x8 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 17 | 7965 | 5.67 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 12 | 11950 | 4.00 | +20.0% | 8 | tempo.ghost-strike x15 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 11 | 11391 | 3.67 | +10.0% | 5 | affliction.bleed-pips x40 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 13 | 9608 | 4.33 | +30.0% | 5 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 10 | 12510 | 3.33 | — | 5 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 14 | 10300 | 4.67 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | 1 | cooldown | 14 | 10264 | 4.67 | +0.0% | 0 | control.frost-drag x20 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 14 | 10336 | 4.67 | +0.0% | 0 | engagement.brace-sparks x4 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 14 | 10100 | 4.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 16 | 9100 | 5.33 | +0.0% | 6 | tempo.ghost-strike x12 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 17 | 8729 | 5.67 | +6.3% | 4 | kill-chain.kill-pulse x5 |
| `lineage-axe-empowered` | empowered | 1 | dot | 19 | 7542 | 6.33 | +18.8% | 7 | empowered.weak-point x2 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 16 | 9100 | 5.33 | — | 6 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 13 | 11608 | 4.33 | -18.8% | 3 | affliction.venom-pips x95 |
| `lineage-dagger-control` | control | 1 | reload | 15 | 9133 | 5.00 | -6.3% | 2 | control.frost-drag x51 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 17 | 9412 | 5.67 | +6.3% | 6 | kill-chain.spread-arc x6 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 16 | 9944 | 5.33 | — | 4 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 28 | 5636 | 9.33 | +16.7% | 0 | affliction.bog-eye x40, technique.cast-flare x55, kill-chain.steel-vigil x28, kill-chain.wind-chaser x28 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 23 | 6452 | 7.67 | -4.2% | 0 | affliction.bog-eye x35, kill-chain.kill-pulse x23, kill-chain.steel-vigil x23, kill-chain.wind-chaser x23, bulwark.rampart-seal x1 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 27 | 5670 | 9.00 | +12.5% | 0 | affliction.bog-eye x37, kill-chain.steel-vigil x27, kill-chain.wind-chaser x27, empowered.weak-point x10, bulwark.rampart-seal x1 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 24 | 6329 | 8.00 | — | 0 | affliction.bog-eye x37, kill-chain.steel-vigil x24, kill-chain.wind-chaser x24 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 26 | 5231 | 8.67 | +4.0% | 0 | tempo.ghost-strike x85, bulwark.rampart-seal x8, tempo.gale-wake x51, kill-chain.wind-chaser x26, affliction.bog-eye x29 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 26 | 5319 | 8.67 | +4.0% | 0 | affliction.bleed-pips x232, bulwark.rampart-seal x8, tempo.gale-wake x45, kill-chain.wind-chaser x26, affliction.bog-eye x30 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 33 | 4136 | 11.00 | +32.0% | 0 | engagement.opening-flash x28, bulwark.rampart-seal x10, kill-chain.wind-chaser x33, tempo.gale-wake x45, affliction.bog-eye x30 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 25 | 6212 | 8.33 | — | 0 | bulwark.rampart-seal x8, tempo.gale-wake x51, kill-chain.wind-chaser x25, affliction.bog-eye x35 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 24 | 6279 | 8.00 | +26.3% | 0 | bulwark.rampart-seal x8, kill-chain.wind-chaser x24, affliction.bog-eye x35, empowered.plating-crack x18, empowered.quake-ring x18 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 24 | 6292 | 8.00 | +26.3% | 0 | bulwark.rampart-seal x8, kill-chain.wind-chaser x24, affliction.bog-eye x34, empowered.quake-ring x18, control.frost-drag x22 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 24 | 6292 | 8.00 | +26.3% | 0 | engagement.brace-sparks x6, bulwark.rampart-seal x8, kill-chain.wind-chaser x24, affliction.bog-eye x34, empowered.quake-ring x18 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 19 | 8116 | 6.33 | — | 0 | bulwark.rampart-seal x7, affliction.bog-eye x34, empowered.quake-ring x18, kill-chain.wind-chaser x19 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 20 | 7775 | 6.67 | +11.1% | 0 | tempo.ghost-strike x66, tempo.ruin-afterimage x66, kill-chain.wind-chaser x20, affliction.bog-eye x36, bulwark.rampart-seal x7 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 21 | 7638 | 7.00 | +16.7% | 0 | tempo.ruin-afterimage x67, affliction.bog-eye x38, kill-chain.kill-pulse x21, kill-chain.wind-chaser x21, bulwark.rampart-seal x9 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 21 | 6986 | 7.00 | +16.7% | 0 | tempo.ruin-afterimage x61, kill-chain.wind-chaser x21, affliction.bog-eye x33, empowered.weak-point x6, bulwark.rampart-seal x5 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 18 | 8261 | 6.00 | — | 0 | tempo.ruin-afterimage x62, kill-chain.wind-chaser x18, affliction.bog-eye x34, bulwark.rampart-seal x9 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 26 | 6504 | 8.67 | +8.3% | 0 | affliction.venom-pips x307, control.mire-grasp x85, affliction.bog-eye x41, kill-chain.wind-chaser x26, bulwark.rampart-seal x4 |
| `lineage-dagger-control-t2` | control | 2 | reload | 31 | 5452 | 10.33 | +29.2% | 0 | control.frost-drag x105, control.mire-grasp x83, affliction.bog-eye x41, kill-chain.wind-chaser x31, bulwark.rampart-seal x7 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 25 | 6716 | 8.33 | +4.2% | 0 | affliction.bog-eye x43, control.mire-grasp x83, kill-chain.spread-arc x13, kill-chain.wind-chaser x25, bulwark.rampart-seal x7 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 24 | 6867 | 8.00 | — | 0 | control.mire-grasp x79, affliction.bog-eye x43, kill-chain.wind-chaser x24, bulwark.rampart-seal x4 |
| `frame-cadence-light` | _frame light_ | 1 | cadence | 17 | 7912 | 5.67 | — | 5 | — |
| `frame-cadence-balanced` | _frame balanced_ | 1 | cadence | 10 | 12510 | 3.33 | — | 5 | — |
| `frame-cadence-heavy` | _frame heavy_ | 1 | cadence | 16 | 7900 | 5.33 | — | 0 | — |
| `frame-cooldown-light` | _frame light_ | 1 | cooldown | 17 | 8912 | 5.67 | — | 4 | — |
| `frame-cooldown-balanced` | _frame balanced_ | 1 | cooldown | 10 | 14820 | 3.33 | — | 3 | — |
| `frame-cooldown-heavy` | _frame heavy_ | 1 | cooldown | 14 | 10100 | 4.67 | — | 0 | — |
| `frame-reload-light` | _frame light_ | 1 | reload | 16 | 10238 | 5.33 | — | 4 | — |
| `frame-reload-balanced` | _frame balanced_ | 1 | reload | 19 | 8884 | 6.33 | — | 4 | — |
| `frame-reload-heavy` | _frame heavy_ | 1 | reload | 16 | 9944 | 5.33 | — | 4 | — |
| `frame-energy-light` | _frame light_ | 1 | energy | 17 | 8800 | 5.67 | — | 4 | — |
| `frame-energy-balanced` | _frame balanced_ | 1 | energy | 21 | 7724 | 7.00 | — | 6 | — |
| `frame-energy-heavy` | _frame heavy_ | 1 | energy | 17 | 7965 | 5.67 | — | 1 | — |
| `frame-dot-light` | _frame light_ | 1 | dot | 23 | 6957 | 7.67 | — | 8 | — |
| `frame-dot-balanced` | _frame balanced_ | 1 | dot | 16 | 9100 | 5.33 | — | 6 | — |
| `frame-dot-heavy` | _frame heavy_ | 1 | dot | 17 | 9571 | 5.67 | — | 3 | — |
| `frame-summoner-light` | _frame light_ | 1 | summoner | 17 | 7706 | 5.67 | — | 1 | — |
| `frame-summoner-balanced` | _frame balanced_ | 1 | summoner | 13 | 8292 | 4.33 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | 1 | summoner | 21 | 1476 | 7.00 | — | 0 | — |
| `frame-cadence-light-t2` | _frame light_ | 2 | cadence | 25 | 5984 | 8.33 | — | 0 | bulwark.rampart-seal x9, tempo.gale-wake x61, kill-chain.wind-chaser x25, affliction.bog-eye x34 |
| `frame-cadence-balanced-t2` | _frame balanced_ | 2 | cadence | 25 | 6212 | 8.33 | — | 0 | bulwark.rampart-seal x8, tempo.gale-wake x51, kill-chain.wind-chaser x25, affliction.bog-eye x35 |
| `frame-cadence-heavy-t2` | _frame heavy_ | 2 | cadence | 27 | 5504 | 9.00 | — | 0 | bulwark.rampart-seal x8, kill-chain.wind-chaser x27, affliction.bog-eye x31, tempo.gale-wake x35 |
| `frame-cooldown-light-t2` | _frame light_ | 2 | cooldown | 18 | 8378 | 6.00 | — | 0 | bulwark.rampart-seal x7, affliction.bog-eye x34, empowered.quake-ring x29, kill-chain.wind-chaser x18 |
| `frame-cooldown-balanced-t2` | _frame balanced_ | 2 | cooldown | 20 | 7875 | 6.67 | — | 0 | bulwark.rampart-seal x7, affliction.bog-eye x35, empowered.quake-ring x20, kill-chain.wind-chaser x20 |
| `frame-cooldown-heavy-t2` | _frame heavy_ | 2 | cooldown | 19 | 8116 | 6.33 | — | 0 | bulwark.rampart-seal x7, affliction.bog-eye x34, empowered.quake-ring x18, kill-chain.wind-chaser x19 |
| `frame-reload-light-t2` | _frame light_ | 2 | reload | 22 | 7159 | 7.33 | — | 0 | control.mire-grasp x82, affliction.bog-eye x41, kill-chain.wind-chaser x22, bulwark.rampart-seal x7 |
| `frame-reload-balanced-t2` | _frame balanced_ | 2 | reload | 22 | 7259 | 7.33 | — | 0 | affliction.bog-eye x40, control.mire-grasp x84, kill-chain.wind-chaser x22, bulwark.rampart-seal x12 |
| `frame-reload-heavy-t2` | _frame heavy_ | 2 | reload | 24 | 6867 | 8.00 | — | 0 | control.mire-grasp x79, affliction.bog-eye x43, kill-chain.wind-chaser x24, bulwark.rampart-seal x4 |
| `frame-energy-light-t2` | _frame light_ | 2 | energy | 22 | 7305 | 7.33 | — | 0 | affliction.bog-eye x42, kill-chain.steel-vigil x22, kill-chain.wind-chaser x22 |
| `frame-energy-balanced-t2` | _frame balanced_ | 2 | energy | 24 | 6642 | 8.00 | — | 0 | affliction.bog-eye x43, kill-chain.steel-vigil x24, kill-chain.wind-chaser x24 |
| `frame-energy-heavy-t2` | _frame heavy_ | 2 | energy | 24 | 6329 | 8.00 | — | 0 | affliction.bog-eye x37, kill-chain.steel-vigil x24, kill-chain.wind-chaser x24 |
| `frame-dot-light-t2` | _frame light_ | 2 | dot | 21 | 7381 | 7.00 | — | 0 | tempo.ruin-afterimage x64, affliction.bog-eye x36, kill-chain.wind-chaser x21, bulwark.rampart-seal x7 |
| `frame-dot-balanced-t2` | _frame balanced_ | 2 | dot | 18 | 8261 | 6.00 | — | 0 | tempo.ruin-afterimage x62, kill-chain.wind-chaser x18, affliction.bog-eye x34, bulwark.rampart-seal x9 |
| `frame-dot-heavy-t2` | _frame heavy_ | 2 | dot | 18 | 8283 | 6.00 | — | 0 | tempo.ruin-afterimage x49, affliction.bog-eye x36, kill-chain.wind-chaser x18, bulwark.rampart-seal x5 |
| `frame-summoner-light-t2` | _frame light_ | 2 | summoner | 22 | 3977 | 7.33 | — | 0 | tempo.ruin-afterimage x328, kill-chain.wind-chaser x22 |
| `frame-summoner-balanced-t2` | _frame balanced_ | 2 | summoner | 19 | 7516 | 6.33 | — | 0 | tempo.ruin-afterimage x231, kill-chain.wind-chaser x19, bulwark.rampart-seal x1 |
| `frame-summoner-heavy-t2` | _frame heavy_ | 2 | summoner | 31 | 1794 | 10.33 | — | 0 | tempo.ruin-afterimage x93, kill-chain.wind-chaser x31, bulwark.rampart-seal x2 |

### `node-t2-forest-02` — Grove 70% / Canopy 20% / Pack 10% (forest T2; shared by 1 authored node)

Dominant family **Grove** drops `empowered`, punishes `tempo`. Authored Grove 70% / Canopy 20% / Pack 10%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 9 | 18144 | 3.00 | +0.0% | 0 | technique.cast-flare x53 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 11 | 14209 | 3.67 | +22.2% | 0 | kill-chain.kill-pulse x11 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 9 | 18000 | 3.00 | +0.0% | 0 | empowered.weak-point x10 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 9 | 18144 | 3.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 7 | 15371 | 2.33 | +16.7% | 0 | tempo.ghost-strike x59 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 7 | 15043 | 2.33 | +16.7% | 0 | affliction.bleed-pips x150 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 7 | 15671 | 2.33 | +16.7% | 0 | engagement.opening-flash x7 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 6 | 18550 | 2.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 5 | 24120 | 1.67 | +0.0% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | 1 | cooldown | 5 | 24120 | 1.67 | +0.0% | 0 | control.frost-drag x16 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 5 | 24280 | 1.67 | +0.0% | 0 | engagement.brace-sparks x7 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 5 | 23140 | 1.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 6 | 24117 | 2.00 | +0.0% | 0 | tempo.ghost-strike x54 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 8 | 18375 | 2.67 | +33.3% | 1 | kill-chain.kill-pulse x7 |
| `lineage-axe-empowered` | empowered | 1 | dot | 6 | 24117 | 2.00 | +0.0% | 0 | empowered.weak-point x9 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 6 | 25083 | 2.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 8 | 17250 | 2.67 | -27.3% | 1 | affliction.venom-pips x181 |
| `lineage-dagger-control` | control | 1 | reload | 11 | 12355 | 3.67 | +0.0% | 0 | control.frost-drag x76 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 10 | 13860 | 3.33 | -9.1% | 1 | kill-chain.spread-arc x3 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 11 | 14618 | 3.67 | — | 2 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 14 | 11293 | 4.67 | +7.7% | 0 | affliction.bog-eye x42, technique.cast-flare x56, kill-chain.steel-vigil x14, kill-chain.wind-chaser x14, bulwark.rampart-seal x1 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 16 | 10075 | 5.33 | +23.1% | 0 | affliction.bog-eye x44, kill-chain.kill-pulse x16, kill-chain.steel-vigil x16, kill-chain.wind-chaser x16, bulwark.rampart-seal x1 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 14 | 11086 | 4.67 | +7.7% | 0 | affliction.bog-eye x40, empowered.weak-point x10, kill-chain.steel-vigil x14, kill-chain.wind-chaser x14, bulwark.rampart-seal x1 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 13 | 12223 | 4.33 | — | 0 | affliction.bog-eye x42, kill-chain.steel-vigil x13, kill-chain.wind-chaser x13, bulwark.rampart-seal x1 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 18 | 7772 | 6.00 | +28.6% | 0 | bulwark.rampart-seal x13, tempo.ghost-strike x87, tempo.gale-wake x52, affliction.bog-eye x29, kill-chain.wind-chaser x18 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 21 | 6662 | 7.00 | +50.0% | 0 | affliction.bleed-pips x233, bulwark.rampart-seal x14, tempo.gale-wake x46, affliction.bog-eye x30, kill-chain.wind-chaser x21 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 19 | 6668 | 6.33 | +35.7% | 0 | engagement.opening-flash x18, bulwark.rampart-seal x14, tempo.gale-wake x41, affliction.bog-eye x27, kill-chain.wind-chaser x19 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 14 | 9857 | 4.67 | — | 0 | bulwark.rampart-seal x12, tempo.gale-wake x45, affliction.bog-eye x26, kill-chain.wind-chaser x14 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 13 | 10923 | 4.33 | +18.2% | 0 | bulwark.rampart-seal x10, affliction.bog-eye x30, empowered.plating-crack x18, empowered.quake-ring x18, kill-chain.wind-chaser x13 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 12 | 11567 | 4.00 | +9.1% | 0 | bulwark.rampart-seal x11, affliction.bog-eye x30, control.frost-drag x20, empowered.quake-ring x17, kill-chain.wind-chaser x12 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 12 | 11583 | 4.00 | +9.1% | 0 | bulwark.rampart-seal x11, engagement.brace-sparks x9, affliction.bog-eye x30, empowered.quake-ring x17, kill-chain.wind-chaser x12 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 11 | 13127 | 3.67 | — | 0 | bulwark.rampart-seal x9, affliction.bog-eye x31, empowered.quake-ring x18, kill-chain.wind-chaser x11 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 11 | 14491 | 3.67 | -26.7% | 0 | affliction.bog-eye x38, bulwark.rampart-seal x15, tempo.ghost-strike x67, tempo.ruin-afterimage x67, kill-chain.wind-chaser x11 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 10 | 15700 | 3.33 | -33.3% | 0 | affliction.bog-eye x36, bulwark.rampart-seal x21, tempo.ruin-afterimage x65, kill-chain.kill-pulse x10, kill-chain.wind-chaser x10 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 12 | 12767 | 4.00 | -20.0% | 0 | affliction.bog-eye x36, bulwark.rampart-seal x13, tempo.ruin-afterimage x64, empowered.weak-point x12, kill-chain.wind-chaser x12 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 15 | 10427 | 5.00 | — | 0 | affliction.bog-eye x38, bulwark.rampart-seal x13, tempo.ruin-afterimage x65, kill-chain.wind-chaser x15 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 15 | 9360 | 5.00 | +15.4% | 0 | affliction.bog-eye x38, affliction.venom-pips x269, control.mire-grasp x65, kill-chain.wind-chaser x15, bulwark.rampart-seal x11 |
| `lineage-dagger-control-t2` | control | 2 | reload | 16 | 8806 | 5.33 | +23.1% | 0 | affliction.bog-eye x42, control.frost-drag x99, control.mire-grasp x71, kill-chain.wind-chaser x16, bulwark.rampart-seal x10 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 13 | 11869 | 4.33 | +0.0% | 0 | affliction.bog-eye x41, control.mire-grasp x67, kill-chain.wind-chaser x13, bulwark.rampart-seal x12 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 13 | 12000 | 4.33 | — | 0 | affliction.bog-eye x42, control.mire-grasp x69, kill-chain.wind-chaser x13, bulwark.rampart-seal x10 |

### `node-t2-forest-03` — Canopy 70% / Pack 20% / Grove 10% (forest T2; shared by 1 authored node)

Dominant family **Canopy** drops `affliction`, punishes `control`. Authored Canopy 70% / Pack 20% / Grove 10%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 15 | 8993 | 5.00 | +0.0% | 1 | technique.cast-flare x44 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 17 | 8494 | 5.67 | +13.3% | 2 | kill-chain.kill-pulse x13 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 15 | 9040 | 5.00 | +0.0% | 0 | empowered.weak-point x8 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 15 | 9007 | 5.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 12 | 10058 | 4.00 | +9.1% | 4 | tempo.ghost-strike x32 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 11 | 10009 | 3.67 | +0.0% | 1 | affliction.bleed-pips x106 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 17 | 7618 | 5.67 | +54.5% | 4 | engagement.opening-flash x7 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 11 | 10073 | 3.67 | — | 1 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 8 | 14913 | 2.67 | +0.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | 1 | cooldown | 8 | 14913 | 2.67 | +0.0% | 0 | control.frost-drag x16 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 8 | 14913 | 2.67 | +0.0% | 0 | engagement.brace-sparks x6 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 8 | 14913 | 2.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 11 | 9327 | 3.67 | +22.2% | 0 | tempo.ghost-strike x37 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 11 | 10664 | 3.67 | +22.2% | 0 | kill-chain.kill-pulse x11 |
| `lineage-axe-empowered` | empowered | 1 | dot | 11 | 9327 | 3.67 | +22.2% | 0 | empowered.weak-point x9 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 9 | 12733 | 3.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 13 | 7900 | 4.33 | +0.0% | 1 | affliction.venom-pips x157 |
| `lineage-dagger-control` | control | 1 | reload | 14 | 7200 | 4.67 | +7.7% | 0 | control.frost-drag x57 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 14 | 7457 | 4.67 | +7.7% | 0 | kill-chain.spread-arc x3 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 13 | 9346 | 4.33 | — | 2 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 25 | 5252 | 8.33 | +8.7% | 0 | technique.cast-flare x52, bulwark.rampart-seal x14, affliction.bog-eye x30, kill-chain.steel-vigil x25, kill-chain.wind-chaser x25 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 26 | 5396 | 8.67 | +13.0% | 0 | bulwark.rampart-seal x15, affliction.bog-eye x33, kill-chain.kill-pulse x26, kill-chain.steel-vigil x26, kill-chain.wind-chaser x26 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 27 | 4974 | 9.00 | +17.4% | 0 | bulwark.rampart-seal x15, affliction.bog-eye x33, kill-chain.steel-vigil x27, kill-chain.wind-chaser x27, empowered.weak-point x10 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 23 | 5752 | 7.67 | — | 0 | bulwark.rampart-seal x13, affliction.bog-eye x28, kill-chain.steel-vigil x23, kill-chain.wind-chaser x23 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 26 | 5288 | 8.67 | +4.0% | 0 | tempo.ghost-strike x84, bulwark.rampart-seal x15, tempo.gale-wake x50, affliction.bog-eye x29, kill-chain.wind-chaser x26 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 25 | 5472 | 8.33 | +0.0% | 0 | affliction.bleed-pips x225, bulwark.rampart-seal x15, tempo.gale-wake x44, affliction.bog-eye x34, kill-chain.wind-chaser x25 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 29 | 4252 | 9.67 | +16.0% | 0 | engagement.opening-flash x27, bulwark.rampart-seal x19, tempo.gale-wake x39, kill-chain.wind-chaser x29, affliction.bog-eye x20 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 25 | 5600 | 8.33 | — | 0 | bulwark.rampart-seal x15, tempo.gale-wake x45, affliction.bog-eye x32, kill-chain.wind-chaser x25 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 22 | 5923 | 7.33 | +4.8% | 0 | bulwark.rampart-seal x12, affliction.bog-eye x25, empowered.plating-crack x17, empowered.quake-ring x17, kill-chain.wind-chaser x22 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 22 | 5991 | 7.33 | +4.8% | 0 | bulwark.rampart-seal x11, affliction.bog-eye x26, control.frost-drag x19, empowered.quake-ring x18, kill-chain.wind-chaser x22 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 21 | 5938 | 7.00 | +0.0% | 0 | engagement.brace-sparks x12, bulwark.rampart-seal x14, affliction.bog-eye x23, empowered.quake-ring x18, kill-chain.wind-chaser x21 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 21 | 6552 | 7.00 | — | 0 | bulwark.rampart-seal x10, affliction.bog-eye x28, empowered.quake-ring x18, kill-chain.wind-chaser x21 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 18 | 7494 | 6.00 | +0.0% | 0 | bulwark.rampart-seal x12, tempo.ghost-strike x57, tempo.ruin-afterimage x57, affliction.bog-eye x29, kill-chain.wind-chaser x18 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 17 | 7929 | 5.67 | -5.6% | 0 | bulwark.rampart-seal x14, tempo.ruin-afterimage x55, affliction.bog-eye x26, kill-chain.kill-pulse x17, kill-chain.wind-chaser x17 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 19 | 6979 | 6.33 | +5.6% | 0 | bulwark.rampart-seal x14, tempo.ruin-afterimage x56, affliction.bog-eye x29, empowered.weak-point x14, kill-chain.wind-chaser x19 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 18 | 7589 | 6.00 | — | 0 | bulwark.rampart-seal x14, tempo.ruin-afterimage x56, affliction.bog-eye x27, kill-chain.wind-chaser x18 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 24 | 5742 | 8.00 | -4.0% | 0 | affliction.venom-pips x249, control.mire-grasp x66, bulwark.rampart-seal x17, affliction.bog-eye x33, kill-chain.wind-chaser x24 |
| `lineage-dagger-control-t2` | control | 2 | reload | 25 | 5620 | 8.33 | +0.0% | 0 | control.frost-drag x86, control.mire-grasp x66, bulwark.rampart-seal x17, affliction.bog-eye x38, kill-chain.wind-chaser x25 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 23 | 6196 | 7.67 | -8.0% | 0 | control.mire-grasp x68, bulwark.rampart-seal x20, affliction.bog-eye x33, kill-chain.wind-chaser x23, kill-chain.spread-arc x3 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 25 | 5820 | 8.33 | — | 0 | control.mire-grasp x70, bulwark.rampart-seal x15, affliction.bog-eye x34, kill-chain.wind-chaser x25 |

### `node-t2-forest-04` — Pack 45% / Grove 45% / Canopy 10% (forest T2; shared by 1 authored node)

Dominant family **Pack** drops `tempo`, punishes `empowered`. Authored Pack 45% / Grove 45% / Canopy 10%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 19 | 8879 | 6.33 | +0.0% | 4 | technique.cast-flare x14 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 17 | 9488 | 5.67 | -10.5% | 3 | kill-chain.kill-pulse x6 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 19 | 8853 | 6.33 | +0.0% | 4 | empowered.weak-point x2 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 19 | 8726 | 6.33 | — | 5 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 13 | 11462 | 4.33 | +8.3% | 9 | tempo.ghost-strike x14 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 10 | 11780 | 3.33 | -16.7% | 3 | affliction.bleed-pips x32 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 12 | 10550 | 4.00 | +0.0% | 4 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 12 | 10708 | 4.00 | — | 4 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 16 | 8463 | 5.33 | -5.9% | 1 | empowered.plating-crack x9 |
| `lineage-hammer-control` | control | 1 | cooldown | 16 | 8463 | 5.33 | -5.9% | 1 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 13 | 10992 | 4.33 | -23.5% | 1 | engagement.brace-sparks x3 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 17 | 7818 | 5.67 | — | 1 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 19 | 7695 | 6.33 | +0.0% | 6 | tempo.ghost-strike x12 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 11 | 13727 | 3.67 | -42.1% | 3 | kill-chain.kill-pulse x5 |
| `lineage-axe-empowered` | empowered | 1 | dot | 18 | 8244 | 6.00 | -5.3% | 6 | empowered.weak-point x1 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 19 | 7695 | 6.33 | — | 6 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 15 | 10860 | 5.00 | +25.0% | 4 | affliction.venom-pips x117 |
| `lineage-dagger-control` | control | 1 | reload | 18 | 7911 | 6.00 | +50.0% | 1 | control.frost-drag x70 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 20 | 8370 | 6.67 | +66.7% | 5 | kill-chain.spread-arc x6 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 12 | 11917 | 4.00 | — | 3 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 21 | 6957 | 7.00 | +5.0% | 0 | affliction.bog-eye x39, technique.cast-flare x51, kill-chain.steel-vigil x21, kill-chain.wind-chaser x21 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 23 | 6848 | 7.67 | +15.0% | 0 | affliction.bog-eye x39, kill-chain.kill-pulse x23, kill-chain.steel-vigil x23, kill-chain.wind-chaser x23, bulwark.rampart-seal x2 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 23 | 6370 | 7.67 | +15.0% | 0 | affliction.bog-eye x36, kill-chain.steel-vigil x23, kill-chain.wind-chaser x23, empowered.weak-point x10 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 20 | 7345 | 6.67 | — | 0 | affliction.bog-eye x39, kill-chain.steel-vigil x20, kill-chain.wind-chaser x20, bulwark.rampart-seal x1 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 27 | 5148 | 9.00 | +3.8% | 0 | tempo.ghost-strike x86, bulwark.rampart-seal x11, tempo.gale-wake x51, kill-chain.wind-chaser x27, affliction.bog-eye x31 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 29 | 5003 | 9.67 | +11.5% | 0 | affliction.bleed-pips x239, bulwark.rampart-seal x11, tempo.gale-wake x47, kill-chain.wind-chaser x29, affliction.bog-eye x31 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 31 | 4552 | 10.33 | +19.2% | 0 | engagement.opening-flash x28, bulwark.rampart-seal x12, tempo.gale-wake x46, kill-chain.wind-chaser x31, affliction.bog-eye x31 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 26 | 5577 | 8.67 | — | 0 | bulwark.rampart-seal x8, tempo.gale-wake x48, kill-chain.wind-chaser x26, affliction.bog-eye x34 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 23 | 6600 | 7.67 | +15.0% | 0 | bulwark.rampart-seal x6, affliction.bog-eye x36, kill-chain.wind-chaser x23, empowered.plating-crack x17, empowered.quake-ring x17 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 25 | 5460 | 8.33 | +25.0% | 0 | bulwark.rampart-seal x6, affliction.bog-eye x31, control.frost-drag x20, kill-chain.wind-chaser x25, empowered.quake-ring x16 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 25 | 5460 | 8.33 | +25.0% | 0 | engagement.brace-sparks x7, bulwark.rampart-seal x6, affliction.bog-eye x31, kill-chain.wind-chaser x25, empowered.quake-ring x16 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 20 | 7515 | 6.67 | — | 0 | bulwark.rampart-seal x8, affliction.bog-eye x34, empowered.quake-ring x18, kill-chain.wind-chaser x20 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 21 | 7605 | 7.00 | +5.0% | 0 | tempo.ghost-strike x67, tempo.ruin-afterimage x67, affliction.bog-eye x39, kill-chain.wind-chaser x21, bulwark.rampart-seal x6 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 17 | 9459 | 5.67 | -15.0% | 0 | tempo.ruin-afterimage x68, affliction.bog-eye x39, kill-chain.kill-pulse x17, kill-chain.wind-chaser x17, bulwark.rampart-seal x13 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 18 | 8200 | 6.00 | -10.0% | 0 | tempo.ruin-afterimage x61, kill-chain.wind-chaser x18, affliction.bog-eye x34, empowered.weak-point x8, bulwark.rampart-seal x12 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 20 | 8305 | 6.67 | — | 0 | tempo.ruin-afterimage x70, affliction.bog-eye x40, kill-chain.wind-chaser x20, bulwark.rampart-seal x9 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 23 | 6843 | 7.67 | +15.0% | 0 | affliction.venom-pips x285, affliction.bog-eye x39, control.mire-grasp x75, kill-chain.wind-chaser x23, bulwark.rampart-seal x6 |
| `lineage-dagger-control-t2` | control | 2 | reload | 30 | 5273 | 10.00 | +50.0% | 0 | affliction.bog-eye x40, control.frost-drag x99, control.mire-grasp x80, kill-chain.wind-chaser x30, bulwark.rampart-seal x6 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 22 | 7323 | 7.33 | +10.0% | 0 | affliction.bog-eye x42, control.mire-grasp x76, kill-chain.spread-arc x11, kill-chain.wind-chaser x22, bulwark.rampart-seal x5 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 20 | 7895 | 6.67 | — | 0 | affliction.bog-eye x43, control.mire-grasp x74, kill-chain.wind-chaser x20, bulwark.rampart-seal x3 |

### `node-t2-forest-05` — Pack 34% / Grove 33% / Canopy 33% (forest T2; shared by 1 authored node)

Dominant family **Pack** drops `tempo`, punishes `empowered`. Authored Pack 34% / Grove 33% / Canopy 33%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 12 | 10942 | 4.00 | +0.0% | 0 | technique.cast-flare x44 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 14 | 9814 | 4.67 | +16.7% | 0 | kill-chain.kill-pulse x14 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 12 | 10842 | 4.00 | +0.0% | 0 | empowered.weak-point x8 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 12 | 11233 | 4.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 13 | 9369 | 4.33 | -7.1% | 3 | tempo.ghost-strike x40 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 11 | 10527 | 3.67 | -21.4% | 2 | affliction.bleed-pips x102 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 12 | 10950 | 4.00 | -14.3% | 3 | engagement.opening-flash x4 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 14 | 8814 | 4.67 | — | 3 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 11 | 12491 | 3.67 | +10.0% | 1 | empowered.plating-crack x12 |
| `lineage-hammer-control` | control | 1 | cooldown | 11 | 12491 | 3.67 | +10.0% | 1 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 12 | 9875 | 4.00 | +20.0% | 0 | engagement.brace-sparks x7 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 10 | 13850 | 3.33 | — | 1 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 15 | 9693 | 5.00 | -6.3% | 3 | tempo.ghost-strike x26 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 17 | 9041 | 5.67 | +6.3% | 5 | kill-chain.kill-pulse x8 |
| `lineage-axe-empowered` | empowered | 1 | dot | 15 | 9647 | 5.00 | -6.3% | 3 | empowered.weak-point x5 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 16 | 9025 | 5.33 | — | 3 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 14 | 10179 | 4.67 | -12.5% | 3 | affliction.venom-pips x151 |
| `lineage-dagger-control` | control | 1 | reload | 15 | 8813 | 5.00 | -6.3% | 2 | control.frost-drag x59 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 14 | 10079 | 4.67 | -12.5% | 3 | kill-chain.spread-arc x6 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 16 | 9463 | 5.33 | — | 2 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 23 | 6583 | 7.67 | -4.2% | 0 | technique.cast-flare x55, bulwark.rampart-seal x4, affliction.bog-eye x39, kill-chain.steel-vigil x23, kill-chain.wind-chaser x23 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 23 | 6309 | 7.67 | -4.2% | 0 | bulwark.rampart-seal x4, affliction.bog-eye x38, kill-chain.kill-pulse x23, kill-chain.steel-vigil x23, kill-chain.wind-chaser x23 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 27 | 5741 | 9.00 | +12.5% | 0 | bulwark.rampart-seal x3, affliction.bog-eye x36, kill-chain.steel-vigil x27, kill-chain.wind-chaser x27, empowered.weak-point x10 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 24 | 6154 | 8.00 | — | 0 | bulwark.rampart-seal x3, affliction.bog-eye x35, kill-chain.steel-vigil x24, kill-chain.wind-chaser x24 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 25 | 5632 | 8.33 | +8.7% | 0 | tempo.ghost-strike x87, bulwark.rampart-seal x13, tempo.gale-wake x52, affliction.bog-eye x33, kill-chain.wind-chaser x25 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 24 | 5475 | 8.00 | +4.3% | 0 | affliction.bleed-pips x217, bulwark.rampart-seal x12, tempo.gale-wake x43, affliction.bog-eye x30, kill-chain.wind-chaser x24 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 25 | 5004 | 8.33 | +8.7% | 0 | engagement.opening-flash x22, bulwark.rampart-seal x13, tempo.gale-wake x40, kill-chain.wind-chaser x25, affliction.bog-eye x25 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 23 | 5591 | 7.67 | — | 0 | bulwark.rampart-seal x12, tempo.gale-wake x42, affliction.bog-eye x30, kill-chain.wind-chaser x23 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 19 | 7763 | 6.33 | +0.0% | 0 | bulwark.rampart-seal x9, affliction.bog-eye x31, empowered.plating-crack x18, empowered.quake-ring x18, kill-chain.wind-chaser x19 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 19 | 7679 | 6.33 | +0.0% | 0 | bulwark.rampart-seal x9, affliction.bog-eye x31, control.frost-drag x20, empowered.quake-ring x16, kill-chain.wind-chaser x19 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 19 | 7732 | 6.33 | +0.0% | 0 | engagement.brace-sparks x7, bulwark.rampart-seal x9, affliction.bog-eye x31, empowered.quake-ring x17, kill-chain.wind-chaser x19 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 19 | 7763 | 6.33 | — | 0 | bulwark.rampart-seal x9, affliction.bog-eye x31, empowered.quake-ring x18, kill-chain.wind-chaser x19 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 21 | 7314 | 7.00 | +0.0% | 0 | bulwark.rampart-seal x11, tempo.ghost-strike x64, tempo.ruin-afterimage x64, affliction.bog-eye x33, kill-chain.wind-chaser x21 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 19 | 8289 | 6.33 | -9.5% | 0 | bulwark.rampart-seal x12, tempo.ruin-afterimage x65, affliction.bog-eye x35, kill-chain.kill-pulse x19, kill-chain.wind-chaser x19 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 19 | 8089 | 6.33 | -9.5% | 0 | bulwark.rampart-seal x11, tempo.ruin-afterimage x64, affliction.bog-eye x35, empowered.weak-point x11, kill-chain.wind-chaser x19 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 21 | 6924 | 7.00 | — | 0 | bulwark.rampart-seal x10, tempo.ruin-afterimage x61, affliction.bog-eye x30, kill-chain.wind-chaser x21 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 24 | 6104 | 8.00 | +26.3% | 0 | affliction.venom-pips x269, control.mire-grasp x71, bulwark.rampart-seal x11, affliction.bog-eye x37, kill-chain.wind-chaser x24 |
| `lineage-dagger-control-t2` | control | 2 | reload | 27 | 5685 | 9.00 | +42.1% | 0 | control.frost-drag x92, control.mire-grasp x74, bulwark.rampart-seal x10, affliction.bog-eye x38, kill-chain.wind-chaser x27 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 23 | 7030 | 7.67 | +21.1% | 0 | control.mire-grasp x82, bulwark.rampart-seal x11, affliction.bog-eye x41, kill-chain.wind-chaser x23, kill-chain.spread-arc x8 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 19 | 7632 | 6.33 | — | 0 | control.mire-grasp x67, bulwark.rampart-seal x9, affliction.bog-eye x40, kill-chain.wind-chaser x19 |

### `node-t2-plains-01` — Herd 70% / Swarm 20% / Sky 10% (plains T2; shared by 1 authored node)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Herd 70% / Swarm 20% / Sky 10%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 20 | 6465 | 6.67 | -13.0% | 1 | technique.cast-flare x24 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 24 | 5933 | 8.00 | +4.3% | 3 | kill-chain.kill-pulse x16 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 24 | 5550 | 8.00 | +4.3% | 1 | empowered.weak-point x4 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 23 | 5835 | 7.67 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 21 | 6690 | 7.00 | +5.0% | 4 | tempo.ghost-strike x43 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 19 | 6874 | 6.33 | -5.0% | 2 | affliction.bleed-pips x98 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 23 | 4948 | 7.67 | +15.0% | 2 | engagement.opening-flash x6 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 20 | 6470 | 6.67 | — | 2 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 18 | 6944 | 6.00 | +0.0% | 1 | empowered.plating-crack x12 |
| `lineage-hammer-control` | control | 1 | cooldown | 18 | 6944 | 6.00 | +0.0% | 1 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 21 | 5857 | 7.00 | +16.7% | 1 | engagement.brace-sparks x6 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 18 | 6944 | 6.00 | — | 1 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 19 | 6226 | 6.33 | +0.0% | 0 | tempo.ghost-strike x42 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 19 | 6395 | 6.33 | +0.0% | 2 | kill-chain.kill-pulse x13 |
| `lineage-axe-empowered` | empowered | 1 | dot | 19 | 6389 | 6.33 | +0.0% | 0 | empowered.weak-point x10 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 19 | 6226 | 6.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 20 | 6315 | 6.67 | +17.6% | 1 | affliction.venom-pips x145 |
| `lineage-dagger-control` | control | 1 | reload | 19 | 6742 | 6.33 | +11.8% | 0 | control.frost-drag x72 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 23 | 6157 | 7.67 | +35.3% | 1 | kill-chain.spread-arc x7 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 17 | 8012 | 5.67 | — | 3 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 38 | 3261 | 12.67 | -15.6% | 0 | technique.cast-flare x51, affliction.bog-eye x26, kill-chain.steel-vigil x38, kill-chain.wind-chaser x38 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 38 | 3642 | 12.67 | -15.6% | 0 | affliction.bog-eye x30, kill-chain.kill-pulse x38, kill-chain.steel-vigil x38, kill-chain.wind-chaser x38 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 37 | 3446 | 12.33 | -17.8% | 0 | affliction.bog-eye x29, kill-chain.steel-vigil x37, kill-chain.wind-chaser x37, empowered.weak-point x9 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 45 | 2853 | 15.00 | — | 0 | affliction.bog-eye x29, kill-chain.steel-vigil x45, kill-chain.wind-chaser x45 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 33 | 4400 | 11.00 | +3.1% | 0 | tempo.ghost-strike x91, bulwark.rampart-seal x14, tempo.gale-wake x54, affliction.bog-eye x29, kill-chain.wind-chaser x33 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 42 | 3581 | 14.00 | +31.3% | 0 | affliction.bleed-pips x251, bulwark.rampart-seal x17, tempo.gale-wake x49, affliction.bog-eye x30, kill-chain.wind-chaser x42 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 46 | 3054 | 15.33 | +43.8% | 0 | engagement.opening-flash x46, bulwark.rampart-seal x17, tempo.gale-wake x46, affliction.bog-eye x28, kill-chain.wind-chaser x46 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 32 | 4991 | 10.67 | — | 0 | bulwark.rampart-seal x14, tempo.gale-wake x53, affliction.bog-eye x38, kill-chain.wind-chaser x32 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 25 | 6256 | 8.33 | -3.8% | 0 | bulwark.rampart-seal x12, affliction.bog-eye x33, empowered.plating-crack x18, empowered.quake-ring x18, kill-chain.wind-chaser x25 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 25 | 6284 | 8.33 | -3.8% | 0 | bulwark.rampart-seal x12, affliction.bog-eye x34, control.frost-drag x22, empowered.quake-ring x18, kill-chain.wind-chaser x25 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 25 | 6284 | 8.33 | -3.8% | 0 | engagement.brace-sparks x3, bulwark.rampart-seal x12, affliction.bog-eye x34, empowered.quake-ring x18, kill-chain.wind-chaser x25 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 26 | 5977 | 8.67 | — | 0 | bulwark.rampart-seal x12, affliction.bog-eye x33, empowered.quake-ring x17, kill-chain.wind-chaser x26 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 33 | 4279 | 11.00 | +6.5% | 0 | bulwark.rampart-seal x7, tempo.ghost-strike x59, tempo.ruin-afterimage x56, affliction.bog-eye x31, kill-chain.wind-chaser x33 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 30 | 4787 | 10.00 | -3.2% | 0 | bulwark.rampart-seal x7, tempo.ruin-afterimage x59, affliction.bog-eye x28, kill-chain.kill-pulse x30, kill-chain.wind-chaser x30 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 38 | 3363 | 12.67 | +22.6% | 0 | bulwark.rampart-seal x4, tempo.ruin-afterimage x53, affliction.bog-eye x28, empowered.weak-point x15, kill-chain.wind-chaser x38 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 31 | 4806 | 10.33 | — | 0 | bulwark.rampart-seal x6, tempo.ruin-afterimage x61, affliction.bog-eye x32, kill-chain.wind-chaser x31 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 46 | 3261 | 15.33 | +9.5% | 0 | affliction.venom-pips x280, control.mire-grasp x82, affliction.bog-eye x35, kill-chain.wind-chaser x46, bulwark.rampart-seal x1 |
| `lineage-dagger-control-t2` | control | 2 | reload | 42 | 3698 | 14.00 | +0.0% | 0 | control.frost-drag x92, control.mire-grasp x79, affliction.bog-eye x34, kill-chain.wind-chaser x42, bulwark.rampart-seal x1 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 39 | 4133 | 13.00 | -7.1% | 0 | control.mire-grasp x89, affliction.bog-eye x36, kill-chain.wind-chaser x39, kill-chain.spread-arc x18, bulwark.rampart-seal x1 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 42 | 3655 | 14.00 | — | 0 | control.mire-grasp x87, affliction.bog-eye x37, kill-chain.wind-chaser x42 |
| `frame-cadence-light` | _frame light_ | 1 | cadence | 25 | 4632 | 8.33 | — | 3 | — |
| `frame-cadence-balanced` | _frame balanced_ | 1 | cadence | 20 | 6470 | 6.67 | — | 2 | — |
| `frame-cadence-heavy` | _frame heavy_ | 1 | cadence | 21 | 6243 | 7.00 | — | 1 | — |
| `frame-cooldown-light` | _frame light_ | 1 | cooldown | 18 | 6772 | 6.00 | — | 1 | — |
| `frame-cooldown-balanced` | _frame balanced_ | 1 | cooldown | 17 | 7800 | 5.67 | — | 2 | — |
| `frame-cooldown-heavy` | _frame heavy_ | 1 | cooldown | 18 | 6944 | 6.00 | — | 1 | — |
| `frame-reload-light` | _frame light_ | 1 | reload | 19 | 6832 | 6.33 | — | 1 | — |
| `frame-reload-balanced` | _frame balanced_ | 1 | reload | 16 | 8869 | 5.33 | — | 2 | — |
| `frame-reload-heavy` | _frame heavy_ | 1 | reload | 17 | 8012 | 5.67 | — | 3 | — |
| `frame-energy-light` | _frame light_ | 1 | energy | 20 | 6895 | 6.67 | — | 3 | — |
| `frame-energy-balanced` | _frame balanced_ | 1 | energy | 23 | 6683 | 7.67 | — | 4 | — |
| `frame-energy-heavy` | _frame heavy_ | 1 | energy | 23 | 5835 | 7.67 | — | 1 | — |
| `frame-dot-light` | _frame light_ | 1 | dot | 20 | 6535 | 6.67 | — | 1 | — |
| `frame-dot-balanced` | _frame balanced_ | 1 | dot | 19 | 6226 | 6.33 | — | 0 | — |
| `frame-dot-heavy` | _frame heavy_ | 1 | dot | 27 | 4733 | 9.00 | — | 1 | — |
| `frame-summoner-light` | _frame light_ | 1 | summoner | 12 | 7908 | 4.00 | — | 4 | — |
| `frame-summoner-balanced` | _frame balanced_ | 1 | summoner | 15 | 4460 | 5.00 | — | 2 | — |
| `frame-summoner-heavy` | _frame heavy_ | 1 | summoner | 32 | 3244 | 10.67 | — | 1 | — |
| `frame-cadence-light-t2` | _frame light_ | 2 | cadence | 29 | 5600 | 9.67 | — | 0 | bulwark.rampart-seal x15, tempo.gale-wake x67, affliction.bog-eye x38, kill-chain.wind-chaser x29 |
| `frame-cadence-balanced-t2` | _frame balanced_ | 2 | cadence | 32 | 4991 | 10.67 | — | 0 | bulwark.rampart-seal x14, tempo.gale-wake x53, affliction.bog-eye x38, kill-chain.wind-chaser x32 |
| `frame-cadence-heavy-t2` | _frame heavy_ | 2 | cadence | 28 | 5232 | 9.33 | — | 0 | bulwark.rampart-seal x13, affliction.bog-eye x35, tempo.gale-wake x34, kill-chain.wind-chaser x28 |
| `frame-cooldown-light-t2` | _frame light_ | 2 | cooldown | 36 | 4247 | 12.00 | — | 0 | bulwark.rampart-seal x14, affliction.bog-eye x34, empowered.quake-ring x28, kill-chain.wind-chaser x36 |
| `frame-cooldown-balanced-t2` | _frame balanced_ | 2 | cooldown | 27 | 5544 | 9.00 | — | 0 | bulwark.rampart-seal x13, affliction.bog-eye x32, empowered.quake-ring x20, kill-chain.wind-chaser x27 |
| `frame-cooldown-heavy-t2` | _frame heavy_ | 2 | cooldown | 26 | 5977 | 8.67 | — | 0 | bulwark.rampart-seal x12, affliction.bog-eye x33, empowered.quake-ring x17, kill-chain.wind-chaser x26 |
| `frame-reload-light-t2` | _frame light_ | 2 | reload | 32 | 5172 | 10.67 | — | 0 | control.mire-grasp x87, affliction.bog-eye x38, kill-chain.wind-chaser x32, bulwark.rampart-seal x8 |
| `frame-reload-balanced-t2` | _frame balanced_ | 2 | reload | 34 | 4782 | 11.33 | — | 0 | control.mire-grasp x83, affliction.bog-eye x41, kill-chain.wind-chaser x34, bulwark.rampart-seal x2 |
| `frame-reload-heavy-t2` | _frame heavy_ | 2 | reload | 42 | 3655 | 14.00 | — | 0 | control.mire-grasp x87, affliction.bog-eye x37, kill-chain.wind-chaser x42 |
| `frame-energy-light-t2` | _frame light_ | 2 | energy | 40 | 3418 | 13.33 | — | 0 | affliction.bog-eye x30, kill-chain.steel-vigil x40, kill-chain.wind-chaser x40, bulwark.rampart-seal x2 |
| `frame-energy-balanced-t2` | _frame balanced_ | 2 | energy | 30 | 5273 | 10.00 | — | 0 | affliction.bog-eye x38, kill-chain.steel-vigil x30, kill-chain.wind-chaser x30, bulwark.rampart-seal x3 |
| `frame-energy-heavy-t2` | _frame heavy_ | 2 | energy | 45 | 2853 | 15.00 | — | 0 | affliction.bog-eye x29, kill-chain.steel-vigil x45, kill-chain.wind-chaser x45 |
| `frame-dot-light-t2` | _frame light_ | 2 | dot | 21 | 7019 | 7.00 | — | 0 | bulwark.rampart-seal x9, tempo.ruin-afterimage x62, affliction.bog-eye x30, kill-chain.wind-chaser x21 |
| `frame-dot-balanced-t2` | _frame balanced_ | 2 | dot | 31 | 4806 | 10.33 | — | 0 | bulwark.rampart-seal x6, tempo.ruin-afterimage x61, affliction.bog-eye x32, kill-chain.wind-chaser x31 |
| `frame-dot-heavy-t2` | _frame heavy_ | 2 | dot | 34 | 3859 | 11.33 | — | 0 | tempo.ruin-afterimage x42, bulwark.rampart-seal x4, affliction.bog-eye x28, kill-chain.wind-chaser x34 |
| `frame-summoner-light-t2` | _frame light_ | 2 | summoner | 52 | 1638 | 17.33 | — | 0 | tempo.ruin-afterimage x326, kill-chain.wind-chaser x52 |
| `frame-summoner-balanced-t2` | _frame balanced_ | 2 | summoner | 36 | 2867 | 12.00 | — | 0 | tempo.ruin-afterimage x226, kill-chain.wind-chaser x36 |
| `frame-summoner-heavy-t2` | _frame heavy_ | 2 | summoner | 40 | 3230 | 13.33 | — | 0 | tempo.ruin-afterimage x52, kill-chain.wind-chaser x40 |

### `node-t2-plains-02` — Swarm 70% / Sky 20% / Herd 10% (plains T2; shared by 1 authored node)

Dominant family **Swarm** drops `technique`, punishes `empowered`. Authored Swarm 70% / Sky 20% / Herd 10%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 34 | 3432 | 11.33 | -8.1% | 0 | technique.cast-flare x39 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 31 | 3919 | 10.33 | -16.2% | 2 | kill-chain.kill-pulse x18 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 37 | 3008 | 12.33 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 37 | 3181 | 12.33 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 35 | 2677 | 11.67 | +2.9% | 0 | tempo.ghost-strike x50 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 34 | 2882 | 11.33 | +0.0% | 0 | affliction.bleed-pips x136 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 37 | 2627 | 12.33 | +8.8% | 0 | engagement.opening-flash x10 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 34 | 3071 | 11.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 29 | 3852 | 9.67 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | 1 | cooldown | 29 | 3766 | 9.67 | +0.0% | 0 | control.frost-drag x15 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 29 | 3652 | 9.67 | +0.0% | 0 | engagement.brace-sparks x9 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 29 | 3793 | 9.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 31 | 3903 | 10.33 | +0.0% | 2 | tempo.ghost-strike x12 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 33 | 4291 | 11.00 | +6.5% | 4 | kill-chain.kill-pulse x10 |
| `lineage-axe-empowered` | empowered | 1 | dot | 31 | 3887 | 10.33 | +0.0% | 2 | empowered.weak-point x1 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 31 | 3903 | 10.33 | — | 2 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 31 | 3990 | 10.33 | +0.0% | 1 | affliction.venom-pips x140 |
| `lineage-dagger-control` | control | 1 | reload | 32 | 3578 | 10.67 | +3.2% | 0 | control.frost-drag x63 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 33 | 3712 | 11.00 | +6.5% | 0 | kill-chain.spread-arc x27 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 31 | 4158 | 10.33 | — | 1 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 67 | 2058 | 22.33 | +15.5% | 0 | technique.cast-flare x53, kill-chain.steel-vigil x67, kill-chain.wind-chaser x67, affliction.bog-eye x28 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 68 | 2047 | 22.67 | +17.2% | 0 | kill-chain.kill-pulse x68, kill-chain.steel-vigil x68, kill-chain.wind-chaser x68, affliction.bog-eye x29 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 60 | 2222 | 20.00 | +3.4% | 0 | kill-chain.steel-vigil x60, kill-chain.wind-chaser x60, affliction.bog-eye x29, empowered.weak-point x8 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 58 | 2203 | 19.33 | — | 0 | kill-chain.steel-vigil x58, kill-chain.wind-chaser x58, affliction.bog-eye x28 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 68 | 1854 | 22.67 | +15.3% | 0 | tempo.ghost-strike x75, bulwark.rampart-seal x18, tempo.gale-wake x45, kill-chain.wind-chaser x68, affliction.bog-eye x20 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 72 | 1803 | 24.00 | +22.0% | 0 | affliction.bleed-pips x209, bulwark.rampart-seal x18, tempo.gale-wake x41, kill-chain.wind-chaser x72, affliction.bog-eye x22 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 79 | 1614 | 26.33 | +33.9% | 0 | engagement.opening-flash x72, bulwark.rampart-seal x22, tempo.gale-wake x40, kill-chain.wind-chaser x79, affliction.bog-eye x20 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 59 | 2176 | 19.67 | — | 0 | bulwark.rampart-seal x17, tempo.gale-wake x41, kill-chain.wind-chaser x59, affliction.bog-eye x24 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 52 | 2335 | 17.33 | +0.0% | 0 | bulwark.rampart-seal x15, affliction.bog-eye x22, kill-chain.wind-chaser x52, empowered.plating-crack x18, empowered.quake-ring x18 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 56 | 2130 | 18.67 | +7.7% | 0 | bulwark.rampart-seal x16, affliction.bog-eye x20, control.frost-drag x18, kill-chain.wind-chaser x56, empowered.quake-ring x17 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 55 | 2136 | 18.33 | +5.8% | 0 | engagement.brace-sparks x13, bulwark.rampart-seal x16, affliction.bog-eye x20, kill-chain.wind-chaser x55, empowered.quake-ring x17 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 52 | 2329 | 17.33 | — | 0 | bulwark.rampart-seal x14, affliction.bog-eye x23, kill-chain.wind-chaser x52, empowered.quake-ring x18 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 44 | 2582 | 14.67 | +0.0% | 0 | tempo.ghost-strike x46, tempo.ruin-afterimage x46, affliction.bog-eye x23, kill-chain.wind-chaser x44 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 51 | 2616 | 17.00 | +15.9% | 0 | tempo.ruin-afterimage x55, kill-chain.kill-pulse x51, kill-chain.wind-chaser x51, affliction.bog-eye x28 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 55 | 2418 | 18.33 | +25.0% | 0 | tempo.ruin-afterimage x55, affliction.bog-eye x31, kill-chain.wind-chaser x55, empowered.weak-point x9, bulwark.rampart-seal x2 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 44 | 2609 | 14.67 | — | 0 | tempo.ruin-afterimage x46, affliction.bog-eye x23, kill-chain.wind-chaser x44 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 56 | 2639 | 18.67 | +5.7% | 0 | affliction.venom-pips x259, control.mire-grasp x79, affliction.bog-eye x33, kill-chain.wind-chaser x56 |
| `lineage-dagger-control-t2` | control | 2 | reload | 53 | 2787 | 17.67 | +0.0% | 0 | control.frost-drag x85, control.mire-grasp x77, affliction.bog-eye x31, kill-chain.wind-chaser x53, bulwark.rampart-seal x1 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 49 | 2982 | 16.33 | -7.5% | 0 | control.mire-grasp x77, affliction.bog-eye x32, kill-chain.spread-arc x32, kill-chain.wind-chaser x49, bulwark.rampart-seal x2 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 53 | 2962 | 17.67 | — | 0 | control.mire-grasp x88, affliction.bog-eye x36, kill-chain.wind-chaser x53, bulwark.rampart-seal x1 |

### `node-t2-plains-03` — Sky 70% / Herd 20% / Swarm 10% (plains T2; shared by 1 authored node)

Dominant family **Sky** drops `engagement`, punishes `affliction`. Authored Sky 70% / Herd 20% / Swarm 10%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 19 | 7189 | 6.33 | +0.0% | 3 | technique.cast-flare x18 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 14 | 12164 | 4.67 | -26.3% | 7 | kill-chain.kill-pulse x2 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 21 | 7019 | 7.00 | +10.5% | 3 | empowered.weak-point x2 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 19 | 7189 | 6.33 | — | 3 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 23 | 5739 | 7.67 | +21.1% | 1 | tempo.ghost-strike x36 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 24 | 5604 | 8.00 | +26.3% | 3 | affliction.bleed-pips x59 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 24 | 5613 | 8.00 | +26.3% | 2 | engagement.opening-flash x6 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 19 | 7500 | 6.33 | — | 4 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 13 | 10985 | 4.33 | +8.3% | 1 | empowered.plating-crack x10 |
| `lineage-hammer-control` | control | 1 | cooldown | 14 | 9771 | 4.67 | +16.7% | 1 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 15 | 9667 | 5.00 | +25.0% | 2 | engagement.brace-sparks x5 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 12 | 12125 | 4.00 | — | 1 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 15 | 8933 | 5.00 | +0.0% | 1 | tempo.ghost-strike x28 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 17 | 8371 | 5.67 | +13.3% | 4 | kill-chain.kill-pulse x8 |
| `lineage-axe-empowered` | empowered | 1 | dot | 14 | 9164 | 4.67 | -6.7% | 1 | empowered.weak-point x11 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 15 | 8933 | 5.00 | — | 1 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 15 | 9707 | 5.00 | +25.0% | 5 | affliction.venom-pips x69 |
| `lineage-dagger-control` | control | 1 | reload | 23 | 6587 | 7.67 | +91.7% | 4 | control.frost-drag x27 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 20 | 7875 | 6.67 | +66.7% | 3 | kill-chain.spread-arc x3 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 12 | 13467 | 4.00 | — | 6 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 36 | 3947 | 12.00 | -7.7% | 0 | affliction.bog-eye x33, technique.cast-flare x52, kill-chain.steel-vigil x36, kill-chain.wind-chaser x36 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 34 | 4250 | 11.33 | -12.8% | 1 | affliction.bog-eye x24, kill-chain.kill-pulse x24, kill-chain.steel-vigil x24, kill-chain.wind-chaser x24 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 37 | 3916 | 12.33 | -5.1% | 0 | affliction.bog-eye x32, kill-chain.steel-vigil x37, kill-chain.wind-chaser x37, empowered.weak-point x9 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 39 | 3864 | 13.00 | — | 1 | affliction.bog-eye x23, kill-chain.steel-vigil x24, kill-chain.wind-chaser x24 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 46 | 3046 | 15.33 | +17.9% | 0 | affliction.bog-eye x26, bulwark.rampart-seal x21, tempo.ghost-strike x79, tempo.gale-wake x46, kill-chain.wind-chaser x46 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 42 | 3690 | 14.00 | +7.7% | 0 | affliction.bog-eye x27, affliction.bleed-pips x243, bulwark.rampart-seal x21, tempo.gale-wake x48, kill-chain.wind-chaser x42 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 47 | 3268 | 15.67 | +20.5% | 0 | affliction.bog-eye x29, engagement.opening-flash x49, bulwark.rampart-seal x21, tempo.gale-wake x47, kill-chain.wind-chaser x47 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 39 | 3595 | 13.00 | — | 0 | affliction.bog-eye x32, bulwark.rampart-seal x22, tempo.gale-wake x42, kill-chain.wind-chaser x39 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 29 | 5300 | 9.67 | +45.0% | 0 | affliction.bog-eye x30, bulwark.rampart-seal x15, empowered.plating-crack x17, empowered.quake-ring x17, kill-chain.wind-chaser x29 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 32 | 4575 | 10.67 | +60.0% | 0 | affliction.bog-eye x30, bulwark.rampart-seal x13, control.frost-drag x21, empowered.quake-ring x16, kill-chain.wind-chaser x32 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 28 | 5261 | 9.33 | +40.0% | 0 | affliction.bog-eye x30, bulwark.rampart-seal x10, engagement.brace-sparks x7, empowered.quake-ring x17, kill-chain.wind-chaser x28 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 20 | 8315 | 6.67 | — | 0 | affliction.bog-eye x37, bulwark.rampart-seal x10, empowered.quake-ring x17, kill-chain.wind-chaser x20 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 35 | 4611 | 11.67 | +6.1% | 0 | affliction.bog-eye x37, tempo.ghost-strike x65, tempo.ruin-afterimage x65, bulwark.rampart-seal x3, kill-chain.wind-chaser x35 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 37 | 4184 | 12.33 | +12.1% | 0 | affliction.bog-eye x37, tempo.ruin-afterimage x63, bulwark.rampart-seal x6, kill-chain.kill-pulse x37, kill-chain.wind-chaser x37 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 35 | 4329 | 11.67 | +6.1% | 0 | affliction.bog-eye x36, tempo.ruin-afterimage x60, bulwark.rampart-seal x6, empowered.weak-point x24, kill-chain.wind-chaser x35 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 33 | 4779 | 11.00 | — | 0 | affliction.bog-eye x37, tempo.ruin-afterimage x64, bulwark.rampart-seal x3, kill-chain.wind-chaser x33 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 46 | 3400 | 15.33 | +43.8% | 0 | affliction.bog-eye x36, affliction.venom-pips x277, control.mire-grasp x81, kill-chain.wind-chaser x46, bulwark.rampart-seal x1 |
| `lineage-dagger-control-t2` | control | 2 | reload | 35 | 4291 | 11.67 | +9.4% | 0 | affliction.bog-eye x32, control.frost-drag x84, control.mire-grasp x69, kill-chain.wind-chaser x35, bulwark.rampart-seal x1 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 34 | 4635 | 11.33 | +6.3% | 0 | affliction.bog-eye x35, control.mire-grasp x80, kill-chain.spread-arc x17, kill-chain.wind-chaser x34, bulwark.rampart-seal x3 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 32 | 5206 | 10.67 | — | 0 | affliction.bog-eye x38, control.mire-grasp x78, kill-chain.wind-chaser x32, bulwark.rampart-seal x1 |

### `node-t2-plains-04` — Herd 45% / Swarm 45% / Sky 10% (plains T2; shared by 1 authored node)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Herd 45% / Swarm 45% / Sky 10%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 31 | 4081 | 10.33 | +14.8% | 2 | technique.cast-flare x23 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 28 | 4707 | 9.33 | +3.7% | 1 | kill-chain.kill-pulse x14 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 28 | 4618 | 9.33 | +3.7% | 1 | empowered.weak-point x4 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 27 | 4826 | 9.00 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 29 | 3807 | 9.67 | +93.3% | 1 | tempo.ghost-strike x39 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 27 | 4237 | 9.00 | +80.0% | 1 | affliction.bleed-pips x101 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 17 | 7429 | 5.67 | +13.3% | 2 | engagement.opening-flash x5 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 15 | 8400 | 5.00 | — | 1 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 22 | 5827 | 7.33 | +0.0% | 1 | empowered.plating-crack x11 |
| `lineage-hammer-control` | control | 1 | cooldown | 22 | 5668 | 7.33 | +0.0% | 1 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 22 | 5586 | 7.33 | +0.0% | 2 | engagement.brace-sparks x5 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 22 | 5827 | 7.33 | — | 1 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 18 | 6878 | 6.00 | +0.0% | 4 | tempo.ghost-strike x10 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 21 | 5919 | 7.00 | +16.7% | 2 | kill-chain.kill-pulse x14 |
| `lineage-axe-empowered` | empowered | 1 | dot | 18 | 6878 | 6.00 | +0.0% | 4 | empowered.weak-point x4 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 18 | 6878 | 6.00 | — | 4 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 22 | 5955 | 7.33 | +15.8% | 1 | affliction.venom-pips x125 |
| `lineage-dagger-control` | control | 1 | reload | 26 | 5062 | 8.67 | +36.8% | 2 | control.frost-drag x41 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 18 | 7383 | 6.00 | -5.3% | 4 | kill-chain.spread-arc x6 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 19 | 7353 | 6.33 | — | 4 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 47 | 2934 | 15.67 | +6.8% | 0 | technique.cast-flare x52, kill-chain.steel-vigil x47, kill-chain.wind-chaser x47, affliction.bog-eye x29 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 36 | 3833 | 12.00 | -18.2% | 0 | kill-chain.kill-pulse x36, kill-chain.steel-vigil x36, kill-chain.wind-chaser x36, affliction.bog-eye x31 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 46 | 3030 | 15.33 | +4.5% | 0 | kill-chain.steel-vigil x46, kill-chain.wind-chaser x46, affliction.bog-eye x31, empowered.weak-point x9 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 44 | 3166 | 14.67 | — | 0 | kill-chain.steel-vigil x44, kill-chain.wind-chaser x44, affliction.bog-eye x30 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 42 | 3536 | 14.00 | +23.5% | 0 | tempo.ghost-strike x91, bulwark.rampart-seal x17, kill-chain.wind-chaser x42, tempo.gale-wake x55, affliction.bog-eye x28 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 42 | 3495 | 14.00 | +23.5% | 0 | affliction.bleed-pips x244, kill-chain.wind-chaser x42, bulwark.rampart-seal x16, tempo.gale-wake x48, affliction.bog-eye x28 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 57 | 2526 | 19.00 | +67.6% | 0 | engagement.opening-flash x53, kill-chain.wind-chaser x57, bulwark.rampart-seal x23, tempo.gale-wake x47, affliction.bog-eye x31 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 34 | 4568 | 11.33 | — | 0 | bulwark.rampart-seal x12, kill-chain.wind-chaser x34, tempo.gale-wake x51, affliction.bog-eye x37 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 28 | 5607 | 9.33 | +27.3% | 0 | bulwark.rampart-seal x12, affliction.bog-eye x32, empowered.plating-crack x16, empowered.quake-ring x16, kill-chain.wind-chaser x28 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 31 | 4990 | 10.33 | +40.9% | 0 | bulwark.rampart-seal x12, affliction.bog-eye x31, empowered.quake-ring x16, control.frost-drag x21, kill-chain.wind-chaser x31 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 31 | 4990 | 10.33 | +40.9% | 0 | engagement.brace-sparks x4, bulwark.rampart-seal x12, affliction.bog-eye x31, empowered.quake-ring x16, kill-chain.wind-chaser x31 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 22 | 7423 | 7.33 | — | 0 | bulwark.rampart-seal x10, affliction.bog-eye x35, empowered.quake-ring x17, kill-chain.wind-chaser x22 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 41 | 3702 | 13.67 | -8.9% | 0 | tempo.ghost-strike x63, tempo.ruin-afterimage x61, affliction.bog-eye x34, kill-chain.wind-chaser x41, bulwark.rampart-seal x6 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 40 | 3660 | 13.33 | -11.1% | 0 | tempo.ruin-afterimage x60, kill-chain.kill-pulse x40, kill-chain.wind-chaser x40, affliction.bog-eye x32, bulwark.rampart-seal x5 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 35 | 3797 | 11.67 | -22.2% | 0 | tempo.ruin-afterimage x55, affliction.bog-eye x29, kill-chain.wind-chaser x35, empowered.weak-point x16, bulwark.rampart-seal x6 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 45 | 3327 | 15.00 | — | 0 | tempo.ruin-afterimage x62, affliction.bog-eye x34, kill-chain.wind-chaser x45, bulwark.rampart-seal x5 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 50 | 3024 | 16.67 | +8.7% | 0 | affliction.venom-pips x265, control.mire-grasp x83, affliction.bog-eye x31, kill-chain.wind-chaser x50 |
| `lineage-dagger-control-t2` | control | 2 | reload | 45 | 3333 | 15.00 | -2.2% | 0 | control.frost-drag x89, control.mire-grasp x78, affliction.bog-eye x30, kill-chain.wind-chaser x45, bulwark.rampart-seal x2 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 35 | 4277 | 11.67 | -23.9% | 0 | control.mire-grasp x77, affliction.bog-eye x30, kill-chain.spread-arc x13, kill-chain.wind-chaser x35, bulwark.rampart-seal x2 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 46 | 3348 | 15.33 | — | 0 | control.mire-grasp x87, affliction.bog-eye x37, kill-chain.wind-chaser x46, bulwark.rampart-seal x1 |

### `node-t2-plains-05` — Herd 34% / Swarm 33% / Sky 33% (plains T2; shared by 1 authored node)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Herd 34% / Swarm 33% / Sky 33%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 29 | 4266 | 9.67 | +0.0% | 1 | technique.cast-flare x25 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 31 | 4710 | 10.33 | +6.9% | 5 | kill-chain.kill-pulse x1 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 25 | 4916 | 8.33 | -13.8% | 1 | empowered.weak-point x3 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 29 | 4269 | 9.67 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 24 | 5229 | 8.00 | +50.0% | 1 | tempo.ghost-strike x42 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 24 | 5171 | 8.00 | +50.0% | 3 | affliction.bleed-pips x54 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 20 | 6085 | 6.67 | +25.0% | 1 | engagement.opening-flash x6 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 16 | 8819 | 5.33 | — | 3 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 19 | 7342 | 6.33 | +0.0% | 2 | empowered.plating-crack x4 |
| `lineage-hammer-control` | control | 1 | cooldown | 19 | 6763 | 6.33 | +0.0% | 1 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 19 | 6779 | 6.33 | +0.0% | 1 | engagement.brace-sparks x5 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 19 | 7342 | 6.33 | — | 2 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 20 | 6690 | 6.67 | +0.0% | 2 | tempo.ghost-strike x26 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 16 | 8100 | 5.33 | -20.0% | 1 | kill-chain.kill-pulse x9 |
| `lineage-axe-empowered` | empowered | 1 | dot | 20 | 7175 | 6.67 | +0.0% | 3 | empowered.weak-point x7 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 20 | 6690 | 6.67 | — | 2 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 18 | 8111 | 6.00 | -10.0% | 4 | affliction.venom-pips x78 |
| `lineage-dagger-control` | control | 1 | reload | 22 | 5927 | 7.33 | +10.0% | 1 | control.frost-drag x41 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 20 | 7270 | 6.67 | +0.0% | 3 | kill-chain.spread-arc x3 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 20 | 6890 | 6.67 | — | 2 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 47 | 2870 | 15.67 | +17.5% | 0 | affliction.bog-eye x31, technique.cast-flare x51, kill-chain.steel-vigil x47, kill-chain.wind-chaser x47 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 34 | 4094 | 11.33 | -15.0% | 0 | affliction.bog-eye x32, kill-chain.kill-pulse x34, kill-chain.steel-vigil x34, kill-chain.wind-chaser x34 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 44 | 3407 | 14.67 | +10.0% | 0 | affliction.bog-eye x33, kill-chain.steel-vigil x44, kill-chain.wind-chaser x44, empowered.weak-point x10 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 40 | 3480 | 13.33 | — | 0 | affliction.bog-eye x30, kill-chain.steel-vigil x40, kill-chain.wind-chaser x40 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 32 | 4484 | 10.67 | -25.6% | 0 | bulwark.rampart-seal x14, tempo.ghost-strike x89, tempo.gale-wake x53, affliction.bog-eye x30, kill-chain.wind-chaser x32 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 38 | 3982 | 12.67 | -11.6% | 0 | affliction.bleed-pips x248, bulwark.rampart-seal x14, tempo.gale-wake x49, affliction.bog-eye x31, kill-chain.wind-chaser x38 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 48 | 2858 | 16.00 | +11.6% | 0 | engagement.opening-flash x48, bulwark.rampart-seal x18, tempo.gale-wake x44, affliction.bog-eye x30, kill-chain.wind-chaser x48 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 43 | 3188 | 14.33 | — | 0 | bulwark.rampart-seal x16, tempo.gale-wake x42, affliction.bog-eye x28, kill-chain.wind-chaser x43 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 26 | 4931 | 8.67 | +13.0% | 0 | bulwark.rampart-seal x11, affliction.bog-eye x25, empowered.plating-crack x17, empowered.quake-ring x17, kill-chain.wind-chaser x26 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 26 | 4931 | 8.67 | +13.0% | 0 | bulwark.rampart-seal x11, affliction.bog-eye x25, control.frost-drag x18, empowered.quake-ring x17, kill-chain.wind-chaser x26 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 28 | 5057 | 9.33 | +21.7% | 0 | bulwark.rampart-seal x13, engagement.brace-sparks x6, affliction.bog-eye x30, empowered.quake-ring x17, kill-chain.wind-chaser x28 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 23 | 6687 | 7.67 | — | 0 | bulwark.rampart-seal x8, affliction.bog-eye x35, empowered.quake-ring x17, kill-chain.wind-chaser x23 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 31 | 4410 | 10.33 | +10.7% | 0 | affliction.bog-eye x33, tempo.ghost-strike x56, tempo.ruin-afterimage x56, kill-chain.wind-chaser x31, bulwark.rampart-seal x5 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 40 | 3768 | 13.33 | +42.9% | 0 | affliction.bog-eye x34, tempo.ruin-afterimage x62, kill-chain.kill-pulse x40, kill-chain.wind-chaser x40, bulwark.rampart-seal x6 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 29 | 4486 | 9.67 | +3.6% | 0 | affliction.bog-eye x30, tempo.ruin-afterimage x52, empowered.weak-point x18, kill-chain.wind-chaser x29, bulwark.rampart-seal x5 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 28 | 5039 | 9.33 | — | 0 | affliction.bog-eye x32, tempo.ruin-afterimage x57, kill-chain.wind-chaser x28, bulwark.rampart-seal x7 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 43 | 3574 | 14.33 | -6.5% | 0 | affliction.bog-eye x35, affliction.venom-pips x272, control.mire-grasp x81, kill-chain.wind-chaser x43, bulwark.rampart-seal x2 |
| `lineage-dagger-control-t2` | control | 2 | reload | 48 | 3140 | 16.00 | +4.3% | 0 | affliction.bog-eye x35, control.frost-drag x88, control.mire-grasp x79, kill-chain.wind-chaser x48, bulwark.rampart-seal x4 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 36 | 4064 | 12.00 | -21.7% | 0 | affliction.bog-eye x38, control.mire-grasp x76, kill-chain.wind-chaser x36, kill-chain.spread-arc x16 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 46 | 3537 | 15.33 | — | 0 | affliction.bog-eye x34, control.mire-grasp x88, kill-chain.wind-chaser x46, bulwark.rampart-seal x3 |

### `node-t2-mountain-01` — Crag 70% / Ridge 20% / Hopper 10% (mountain T2; shared by 1 authored node)

Dominant family **Crag** drops `empowered`, punishes `affliction`. Authored Crag 70% / Ridge 20% / Hopper 10%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 5 | 31340 | 1.67 | +0.0% | 0 | technique.cast-flare x49 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 5 | 28940 | 1.67 | +0.0% | 0 | kill-chain.kill-pulse x5 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 5 | 31340 | 1.67 | +0.0% | 0 | empowered.weak-point x8 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 5 | 31340 | 1.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 8 | 18275 | 2.67 | +14.3% | 1 | tempo.ghost-strike x36 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 8 | 17413 | 2.67 | +14.3% | 2 | affliction.bleed-pips x100 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 9 | 15122 | 3.00 | +28.6% | 2 | engagement.opening-flash x4 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 7 | 19929 | 2.33 | — | 2 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 6 | 21800 | 2.00 | +0.0% | 0 | empowered.plating-crack x18 |
| `lineage-hammer-control` | control | 1 | cooldown | 7 | 18957 | 2.33 | +16.7% | 0 | control.frost-drag x16 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 7 | 19671 | 2.33 | +16.7% | 0 | engagement.brace-sparks x6 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 6 | 23250 | 2.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 5 | 27100 | 1.67 | +0.0% | 1 | tempo.ghost-strike x36 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 5 | 28380 | 1.67 | +0.0% | 0 | kill-chain.kill-pulse x5 |
| `lineage-axe-empowered` | empowered | 1 | dot | 5 | 27100 | 1.67 | +0.0% | 1 | empowered.weak-point x5 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 5 | 27420 | 1.67 | — | 1 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 7 | 17457 | 2.33 | +40.0% | 0 | affliction.venom-pips x198 |
| `lineage-dagger-control` | control | 1 | reload | 6 | 22117 | 2.00 | +20.0% | 0 | control.frost-drag x72 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 7 | 20071 | 2.33 | +40.0% | 0 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 5 | 28100 | 1.67 | — | 0 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 9 | 17889 | 3.00 | +0.0% | 0 | technique.cast-flare x55, affliction.bog-eye x40, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9, bulwark.rampart-seal x17 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 9 | 17600 | 3.00 | +0.0% | 0 | affliction.bog-eye x38, kill-chain.kill-pulse x9, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9, bulwark.rampart-seal x17 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 10 | 16570 | 3.33 | +11.1% | 0 | affliction.bog-eye x40, kill-chain.steel-vigil x10, kill-chain.wind-chaser x10, bulwark.rampart-seal x20, empowered.weak-point x10 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 9 | 18233 | 3.00 | — | 0 | affliction.bog-eye x40, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9, bulwark.rampart-seal x18 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 9 | 15144 | 3.00 | +28.6% | 0 | tempo.ghost-strike x63, bulwark.rampart-seal x18, tempo.gale-wake x37, affliction.bog-eye x21, kill-chain.wind-chaser x9 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 9 | 15289 | 3.00 | +28.6% | 0 | affliction.bleed-pips x173, bulwark.rampart-seal x17, tempo.gale-wake x33, affliction.bog-eye x21, kill-chain.wind-chaser x9 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 9 | 16456 | 3.00 | +28.6% | 0 | engagement.opening-flash x12, bulwark.rampart-seal x19, tempo.gale-wake x35, affliction.bog-eye x21, kill-chain.wind-chaser x9 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 7 | 21514 | 2.33 | — | 0 | bulwark.rampart-seal x18, tempo.gale-wake x36, affliction.bog-eye x26, kill-chain.wind-chaser x7 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 9 | 15178 | 3.00 | -10.0% | 0 | bulwark.rampart-seal x16, affliction.bog-eye x23, empowered.plating-crack x17, empowered.quake-ring x17, kill-chain.wind-chaser x9 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 10 | 14480 | 3.33 | +0.0% | 0 | bulwark.rampart-seal x15, affliction.bog-eye x25, empowered.quake-ring x17, control.frost-drag x17, kill-chain.wind-chaser x10 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 9 | 15467 | 3.00 | -10.0% | 0 | engagement.brace-sparks x15, bulwark.rampart-seal x16, affliction.bog-eye x22, empowered.quake-ring x17, kill-chain.wind-chaser x9 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 10 | 13930 | 3.33 | — | 0 | bulwark.rampart-seal x16, affliction.bog-eye x23, empowered.quake-ring x18, kill-chain.wind-chaser x10 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 8 | 19025 | 2.67 | +0.0% | 0 | tempo.ghost-strike x58, tempo.ruin-afterimage x58, affliction.bog-eye x33, kill-chain.wind-chaser x8, bulwark.rampart-seal x18 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 11 | 13500 | 3.67 | +37.5% | 0 | tempo.ruin-afterimage x56, affliction.bog-eye x32, kill-chain.kill-pulse x11, kill-chain.wind-chaser x11, bulwark.rampart-seal x21 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 9 | 16411 | 3.00 | +12.5% | 0 | tempo.ruin-afterimage x56, affliction.bog-eye x30, empowered.weak-point x12, kill-chain.wind-chaser x9, bulwark.rampart-seal x20 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 8 | 18613 | 2.67 | — | 0 | tempo.ruin-afterimage x58, affliction.bog-eye x34, kill-chain.wind-chaser x8, bulwark.rampart-seal x19 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 11 | 14991 | 3.67 | +10.0% | 0 | affliction.venom-pips x289, control.mire-grasp x75, affliction.bog-eye x41, kill-chain.wind-chaser x11, bulwark.rampart-seal x16 |
| `lineage-dagger-control-t2` | control | 2 | reload | 14 | 11093 | 4.67 | +40.0% | 0 | control.frost-drag x94, control.mire-grasp x70, affliction.bog-eye x37, kill-chain.wind-chaser x14, bulwark.rampart-seal x18 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 10 | 16760 | 3.33 | +0.0% | 0 | control.mire-grasp x72, affliction.bog-eye x43, kill-chain.wind-chaser x10, bulwark.rampart-seal x15 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 10 | 16540 | 3.33 | — | 0 | control.mire-grasp x71, affliction.bog-eye x41, kill-chain.wind-chaser x10, bulwark.rampart-seal x17 |
| `frame-cadence-light` | _frame light_ | 1 | cadence | 7 | 20571 | 2.33 | — | 1 | — |
| `frame-cadence-balanced` | _frame balanced_ | 1 | cadence | 7 | 19929 | 2.33 | — | 2 | — |
| `frame-cadence-heavy` | _frame heavy_ | 1 | cadence | 6 | 24950 | 2.00 | — | 0 | — |
| `frame-cooldown-light` | _frame light_ | 1 | cooldown | 4 | 40325 | 1.33 | — | 1 | — |
| `frame-cooldown-balanced` | _frame balanced_ | 1 | cooldown | 5 | 29440 | 1.67 | — | 0 | — |
| `frame-cooldown-heavy` | _frame heavy_ | 1 | cooldown | 6 | 23250 | 2.00 | — | 0 | — |
| `frame-reload-light` | _frame light_ | 1 | reload | 6 | 26467 | 2.00 | — | 1 | — |
| `frame-reload-balanced` | _frame balanced_ | 1 | reload | 6 | 23100 | 2.00 | — | 0 | — |
| `frame-reload-heavy` | _frame heavy_ | 1 | reload | 5 | 28100 | 1.67 | — | 0 | — |
| `frame-energy-light` | _frame light_ | 1 | energy | 6 | 23800 | 2.00 | — | 2 | — |
| `frame-energy-balanced` | _frame balanced_ | 1 | energy | 4 | 40250 | 1.33 | — | 0 | — |
| `frame-energy-heavy` | _frame heavy_ | 1 | energy | 5 | 31340 | 1.67 | — | 0 | — |
| `frame-dot-light` | _frame light_ | 1 | dot | 3 | 50900 | 1.00 | — | 1 | — |
| `frame-dot-balanced` | _frame balanced_ | 1 | dot | 5 | 27420 | 1.67 | — | 1 | — |
| `frame-dot-heavy` | _frame heavy_ | 1 | dot | 5 | 30320 | 1.67 | — | 0 | — |
| `frame-summoner-light` | _frame light_ | 1 | summoner | 6 | 0 | 2.00 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | 1 | summoner | 4 | 0 | 1.33 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | 1 | summoner | 12 | 4258 | 4.00 | — | 0 | — |
| `frame-cadence-light-t2` | _frame light_ | 2 | cadence | 7 | 21014 | 2.33 | — | 0 | bulwark.rampart-seal x19, tempo.gale-wake x45, affliction.bog-eye x24, kill-chain.wind-chaser x7 |
| `frame-cadence-balanced-t2` | _frame balanced_ | 2 | cadence | 7 | 21514 | 2.33 | — | 0 | bulwark.rampart-seal x18, tempo.gale-wake x36, affliction.bog-eye x26, kill-chain.wind-chaser x7 |
| `frame-cadence-heavy-t2` | _frame heavy_ | 2 | cadence | 11 | 13545 | 3.67 | — | 0 | bulwark.rampart-seal x11, affliction.bog-eye x26, tempo.gale-wake x30, kill-chain.wind-chaser x11 |
| `frame-cooldown-light-t2` | _frame light_ | 2 | cooldown | 7 | 21743 | 2.33 | — | 0 | bulwark.rampart-seal x17, affliction.bog-eye x28, empowered.quake-ring x26, kill-chain.wind-chaser x7 |
| `frame-cooldown-balanced-t2` | _frame balanced_ | 2 | cooldown | 7 | 22143 | 2.33 | — | 0 | bulwark.rampart-seal x20, affliction.bog-eye x27, empowered.quake-ring x18, kill-chain.wind-chaser x7 |
| `frame-cooldown-heavy-t2` | _frame heavy_ | 2 | cooldown | 10 | 13930 | 3.33 | — | 0 | bulwark.rampart-seal x16, affliction.bog-eye x23, empowered.quake-ring x18, kill-chain.wind-chaser x10 |
| `frame-reload-light-t2` | _frame light_ | 2 | reload | 10 | 16470 | 3.33 | — | 0 | control.mire-grasp x87, affliction.bog-eye x42, kill-chain.wind-chaser x10, bulwark.rampart-seal x20 |
| `frame-reload-balanced-t2` | _frame balanced_ | 2 | reload | 8 | 20788 | 2.67 | — | 0 | control.mire-grasp x86, affliction.bog-eye x41, kill-chain.wind-chaser x8, bulwark.rampart-seal x17 |
| `frame-reload-heavy-t2` | _frame heavy_ | 2 | reload | 10 | 16540 | 3.33 | — | 0 | control.mire-grasp x71, affliction.bog-eye x41, kill-chain.wind-chaser x10, bulwark.rampart-seal x17 |
| `frame-energy-light-t2` | _frame light_ | 2 | energy | 9 | 17844 | 3.00 | — | 0 | affliction.bog-eye x37, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9, bulwark.rampart-seal x18 |
| `frame-energy-balanced-t2` | _frame balanced_ | 2 | energy | 8 | 19413 | 2.67 | — | 0 | affliction.bog-eye x35, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8, bulwark.rampart-seal x16 |
| `frame-energy-heavy-t2` | _frame heavy_ | 2 | energy | 9 | 18233 | 3.00 | — | 0 | affliction.bog-eye x40, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9, bulwark.rampart-seal x18 |
| `frame-dot-light-t2` | _frame light_ | 2 | dot | 8 | 19913 | 2.67 | — | 0 | tempo.ruin-afterimage x62, affliction.bog-eye x35, kill-chain.wind-chaser x8, bulwark.rampart-seal x21 |
| `frame-dot-balanced-t2` | _frame balanced_ | 2 | dot | 8 | 18613 | 2.67 | — | 0 | tempo.ruin-afterimage x58, affliction.bog-eye x34, kill-chain.wind-chaser x8, bulwark.rampart-seal x19 |
| `frame-dot-heavy-t2` | _frame heavy_ | 2 | dot | 8 | 19488 | 2.67 | — | 0 | tempo.ruin-afterimage x49, affliction.bog-eye x33, kill-chain.wind-chaser x8, bulwark.rampart-seal x20 |
| `frame-summoner-light-t2` | _frame light_ | 2 | summoner | 9 | 2011 | 3.00 | — | 0 | tempo.ruin-afterimage x283, kill-chain.wind-chaser x9, bulwark.rampart-seal x2 |
| `frame-summoner-balanced-t2` | _frame balanced_ | 2 | summoner | 7 | 1671 | 2.33 | — | 0 | tempo.ruin-afterimage x200, kill-chain.wind-chaser x7, bulwark.rampart-seal x1 |
| `frame-summoner-heavy-t2` | _frame heavy_ | 2 | summoner | 17 | 1494 | 5.67 | — | 0 | tempo.ruin-afterimage x95, kill-chain.wind-chaser x17, bulwark.rampart-seal x3 |

### `node-t2-mountain-02` — Ridge 70% / Hopper 20% / Crag 10% (mountain T2; shared by 1 authored node)

Dominant family **Ridge** drops `control`, punishes `kill-chain`. Authored Ridge 70% / Hopper 20% / Crag 10%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 6 | 23567 | 2.00 | +0.0% | 0 | technique.cast-flare x45 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 6 | 21250 | 2.00 | +0.0% | 0 | kill-chain.kill-pulse x6 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 6 | 23567 | 2.00 | +0.0% | 0 | empowered.weak-point x8 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 6 | 23567 | 2.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 7 | 17029 | 2.33 | +0.0% | 0 | tempo.ghost-strike x49 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 7 | 17443 | 2.33 | +0.0% | 0 | affliction.bleed-pips x134 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 7 | 16657 | 2.33 | +0.0% | 0 | engagement.opening-flash x8 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 7 | 16814 | 2.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 8 | 14650 | 2.67 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | 1 | cooldown | 8 | 14650 | 2.67 | +0.0% | 0 | control.frost-drag x14 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 8 | 13238 | 2.67 | +0.0% | 0 | engagement.brace-sparks x9 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 8 | 14650 | 2.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 6 | 19383 | 2.00 | +0.0% | 0 | tempo.ghost-strike x38 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 5 | 24380 | 1.67 | -16.7% | 0 | kill-chain.kill-pulse x5 |
| `lineage-axe-empowered` | empowered | 1 | dot | 7 | 15429 | 2.33 | +16.7% | 0 | empowered.weak-point x7 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 6 | 18817 | 2.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 9 | 12044 | 3.00 | +28.6% | 0 | affliction.venom-pips x171 |
| `lineage-dagger-control` | control | 1 | reload | 11 | 9100 | 3.67 | +57.1% | 0 | control.frost-drag x52 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 8 | 11288 | 2.67 | +14.3% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 7 | 16386 | 2.33 | — | 0 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 15 | 8633 | 5.00 | +0.0% | 0 | technique.cast-flare x48, bulwark.rampart-seal x19, affliction.bog-eye x24, kill-chain.steel-vigil x15, kill-chain.wind-chaser x15 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 15 | 9447 | 5.00 | +0.0% | 0 | bulwark.rampart-seal x18, affliction.bog-eye x30, kill-chain.kill-pulse x15, kill-chain.steel-vigil x15, kill-chain.wind-chaser x15 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 15 | 8560 | 5.00 | +0.0% | 0 | bulwark.rampart-seal x18, affliction.bog-eye x23, kill-chain.steel-vigil x15, kill-chain.wind-chaser x15, empowered.weak-point x8 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 15 | 8653 | 5.00 | — | 0 | bulwark.rampart-seal x19, affliction.bog-eye x23, kill-chain.steel-vigil x15, kill-chain.wind-chaser x15 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 14 | 9057 | 4.67 | +7.7% | 0 | tempo.ghost-strike x55, bulwark.rampart-seal x23, tempo.gale-wake x33, kill-chain.wind-chaser x14, affliction.bog-eye x12 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 14 | 8236 | 4.67 | +7.7% | 0 | affliction.bleed-pips x143, bulwark.rampart-seal x19, tempo.gale-wake x28, kill-chain.wind-chaser x14, affliction.bog-eye x11 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 14 | 9100 | 4.67 | +7.7% | 0 | engagement.opening-flash x15, bulwark.rampart-seal x18, tempo.gale-wake x29, kill-chain.wind-chaser x14, affliction.bog-eye x15 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 13 | 10400 | 4.33 | — | 0 | bulwark.rampart-seal x24, tempo.gale-wake x32, kill-chain.wind-chaser x13, affliction.bog-eye x15 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 15 | 7867 | 5.00 | +0.0% | 0 | bulwark.rampart-seal x19, empowered.plating-crack x18, empowered.quake-ring x18, kill-chain.wind-chaser x15, affliction.bog-eye x14 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 15 | 7707 | 5.00 | +0.0% | 0 | bulwark.rampart-seal x15, empowered.quake-ring x18, kill-chain.wind-chaser x15, control.frost-drag x14, affliction.bog-eye x12 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 16 | 6825 | 5.33 | +6.7% | 0 | engagement.brace-sparks x18, bulwark.rampart-seal x16, empowered.quake-ring x18, kill-chain.wind-chaser x16, affliction.bog-eye x13 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 15 | 7867 | 5.00 | — | 0 | bulwark.rampart-seal x19, empowered.quake-ring x18, kill-chain.wind-chaser x15, affliction.bog-eye x14 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 10 | 12240 | 3.33 | -16.7% | 0 | bulwark.rampart-seal x17, tempo.ghost-strike x46, tempo.ruin-afterimage x46, affliction.bog-eye x22, kill-chain.wind-chaser x10 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 9 | 15567 | 3.00 | -25.0% | 0 | bulwark.rampart-seal x21, tempo.ruin-afterimage x51, affliction.bog-eye x28, kill-chain.kill-pulse x9, kill-chain.wind-chaser x9 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 12 | 11417 | 4.00 | +0.0% | 0 | bulwark.rampart-seal x22, tempo.ruin-afterimage x48, affliction.bog-eye x24, empowered.weak-point x12, kill-chain.wind-chaser x12 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 12 | 11008 | 4.00 | — | 0 | bulwark.rampart-seal x16, tempo.ruin-afterimage x50, affliction.bog-eye x28, kill-chain.wind-chaser x12 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 19 | 6179 | 6.33 | +18.8% | 0 | affliction.venom-pips x210, control.mire-grasp x54, bulwark.rampart-seal x17, affliction.bog-eye x23, kill-chain.wind-chaser x19 |
| `lineage-dagger-control-t2` | control | 2 | reload | 21 | 5876 | 7.00 | +31.3% | 0 | control.frost-drag x77, control.mire-grasp x59, bulwark.rampart-seal x21, affliction.bog-eye x26, kill-chain.wind-chaser x21 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 18 | 7094 | 6.00 | +12.5% | 0 | control.mire-grasp x50, bulwark.rampart-seal x18, affliction.bog-eye x25, kill-chain.wind-chaser x18 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 16 | 8500 | 5.33 | — | 0 | control.mire-grasp x56, bulwark.rampart-seal x17, affliction.bog-eye x30, kill-chain.wind-chaser x16 |

### `node-t2-mountain-03` — Hopper 70% / Crag 20% / Ridge 10% (mountain T2; shared by 1 authored node)

Dominant family **Hopper** drops `tempo`, punishes `empowered`. Authored Hopper 70% / Crag 20% / Ridge 10%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 9 | 17600 | 3.00 | +12.5% | 6 | technique.cast-flare x17 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 12 | 11125 | 4.00 | +50.0% | 3 | kill-chain.kill-pulse x5 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 8 | 20400 | 2.67 | +0.0% | 7 | empowered.weak-point x2 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 8 | 19800 | 2.67 | — | 6 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 9 | 16222 | 3.00 | +28.6% | 1 | tempo.ghost-strike x54 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 7 | 20486 | 2.33 | +0.0% | 3 | affliction.bleed-pips x124 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 8 | 17713 | 2.67 | +14.3% | 1 | engagement.opening-flash x4 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 7 | 21971 | 2.33 | — | 3 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 7 | 20243 | 2.33 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | 1 | cooldown | 10 | 14020 | 3.33 | +42.9% | 0 | control.frost-drag x17 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 9 | 16167 | 3.00 | +28.6% | 0 | engagement.brace-sparks x8 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 7 | 20414 | 2.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 7 | 22086 | 2.33 | +0.0% | 6 | tempo.ghost-strike x17 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 10 | 15070 | 3.33 | +42.9% | 6 | kill-chain.kill-pulse x2 |
| `lineage-axe-empowered` | empowered | 1 | dot | 7 | 22086 | 2.33 | +0.0% | 6 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 7 | 24657 | 2.33 | — | 8 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 7 | 18800 | 2.33 | +0.0% | 3 | affliction.venom-pips x116 |
| `lineage-dagger-control` | control | 1 | reload | 8 | 16513 | 2.67 | +14.3% | 2 | control.frost-drag x46 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 9 | 14522 | 3.00 | +28.6% | 2 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 7 | 21700 | 2.33 | — | 6 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 16 | 9200 | 5.33 | +23.1% | 0 | affliction.bog-eye x35, technique.cast-flare x52, bulwark.rampart-seal x9, kill-chain.steel-vigil x16, kill-chain.wind-chaser x16 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 14 | 10236 | 4.67 | +7.7% | 0 | affliction.bog-eye x32, bulwark.rampart-seal x11, kill-chain.kill-pulse x14, kill-chain.steel-vigil x14, kill-chain.wind-chaser x14 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 14 | 9321 | 4.67 | +7.7% | 0 | affliction.bog-eye x31, bulwark.rampart-seal x9, empowered.weak-point x8, kill-chain.steel-vigil x14, kill-chain.wind-chaser x14 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 13 | 10423 | 4.33 | — | 0 | affliction.bog-eye x31, bulwark.rampart-seal x8, kill-chain.steel-vigil x13, kill-chain.wind-chaser x13 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 16 | 7606 | 5.33 | +23.1% | 0 | tempo.ghost-strike x62, bulwark.rampart-seal x18, tempo.gale-wake x37, affliction.bog-eye x21, kill-chain.wind-chaser x16 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 17 | 7276 | 5.67 | +30.8% | 0 | affliction.bleed-pips x172, bulwark.rampart-seal x18, tempo.gale-wake x33, affliction.bog-eye x22, kill-chain.wind-chaser x17 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 19 | 6900 | 6.33 | +46.2% | 0 | engagement.opening-flash x22, bulwark.rampart-seal x20, tempo.gale-wake x33, affliction.bog-eye x18, kill-chain.wind-chaser x19 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 13 | 10892 | 4.33 | — | 0 | bulwark.rampart-seal x18, tempo.gale-wake x38, affliction.bog-eye x24, kill-chain.wind-chaser x13 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 15 | 8820 | 5.00 | +7.1% | 0 | bulwark.rampart-seal x16, empowered.plating-crack x17, empowered.quake-ring x17, affliction.bog-eye x22, kill-chain.wind-chaser x15 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 15 | 8513 | 5.00 | +7.1% | 0 | bulwark.rampart-seal x16, empowered.quake-ring x17, control.frost-drag x17, affliction.bog-eye x20, kill-chain.wind-chaser x15 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 15 | 8287 | 5.00 | +7.1% | 0 | engagement.brace-sparks x16, bulwark.rampart-seal x16, empowered.quake-ring x17, affliction.bog-eye x19, kill-chain.wind-chaser x15 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 14 | 9843 | 4.67 | — | 0 | bulwark.rampart-seal x14, empowered.quake-ring x17, affliction.bog-eye x22, kill-chain.wind-chaser x14 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 12 | 11508 | 4.00 | -14.3% | 1 | bulwark.rampart-seal x11, tempo.ghost-strike x47, tempo.ruin-afterimage x47, affliction.bog-eye x24, kill-chain.wind-chaser x11 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 14 | 9700 | 4.67 | +0.0% | 0 | bulwark.rampart-seal x10, tempo.ruin-afterimage x53, affliction.bog-eye x29, kill-chain.kill-pulse x14, kill-chain.wind-chaser x14 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 13 | 10169 | 4.33 | -7.1% | 0 | bulwark.rampart-seal x15, tempo.ruin-afterimage x50, affliction.bog-eye x23, empowered.weak-point x13, kill-chain.wind-chaser x13 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 14 | 9893 | 4.67 | — | 1 | bulwark.rampart-seal x12, tempo.ruin-afterimage x47, affliction.bog-eye x23, kill-chain.wind-chaser x12 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 13 | 11292 | 4.33 | +8.3% | 0 | affliction.venom-pips x262, affliction.bog-eye x34, control.mire-grasp x62, bulwark.rampart-seal x11, kill-chain.wind-chaser x13 |
| `lineage-dagger-control-t2` | control | 2 | reload | 19 | 7958 | 6.33 | +58.3% | 0 | affliction.bog-eye x36, control.frost-drag x87, control.mire-grasp x66, bulwark.rampart-seal x11, kill-chain.wind-chaser x19 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 14 | 10293 | 4.67 | +16.7% | 0 | affliction.bog-eye x34, control.mire-grasp x64, bulwark.rampart-seal x9, kill-chain.wind-chaser x14, kill-chain.spread-arc x1 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 12 | 12700 | 4.00 | — | 0 | affliction.bog-eye x36, control.mire-grasp x66, bulwark.rampart-seal x10, kill-chain.wind-chaser x12 |

### `node-t2-mountain-04` — Crag 45% / Ridge 45% / Hopper 10% (mountain T2; shared by 1 authored node)

Dominant family **Crag** drops `empowered`, punishes `affliction`. Authored Crag 45% / Ridge 45% / Hopper 10%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 7 | 21743 | 2.33 | -22.2% | 1 | technique.cast-flare x43 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 7 | 18943 | 2.33 | -22.2% | 0 | kill-chain.kill-pulse x7 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 7 | 21343 | 2.33 | -22.2% | 1 | empowered.weak-point x7 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 9 | 15144 | 3.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 4 | 36575 | 1.33 | +0.0% | 0 | tempo.ghost-strike x60 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 5 | 28100 | 1.67 | +25.0% | 0 | affliction.bleed-pips x149 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 4 | 35525 | 1.33 | +0.0% | 0 | engagement.opening-flash x6 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 4 | 36850 | 1.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 5 | 27100 | 1.67 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | 1 | cooldown | 4 | 35925 | 1.33 | -20.0% | 0 | control.frost-drag x18 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 4 | 36025 | 1.33 | -20.0% | 0 | engagement.brace-sparks x7 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 5 | 27700 | 1.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 5 | 28260 | 1.67 | +0.0% | 0 | tempo.ghost-strike x47 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 5 | 28060 | 1.67 | +0.0% | 1 | kill-chain.kill-pulse x3 |
| `lineage-axe-empowered` | empowered | 1 | dot | 5 | 28260 | 1.67 | +0.0% | 0 | empowered.weak-point x7 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 5 | 28100 | 1.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 8 | 14350 | 2.67 | +33.3% | 0 | affliction.venom-pips x183 |
| `lineage-dagger-control` | control | 1 | reload | 9 | 12656 | 3.00 | +50.0% | 0 | control.frost-drag x62 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 7 | 19300 | 2.33 | +16.7% | 1 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 6 | 20200 | 2.00 | — | 1 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 10 | 15980 | 3.33 | -9.1% | 0 | affliction.bog-eye x37, technique.cast-flare x54, bulwark.rampart-seal x21, kill-chain.steel-vigil x10, kill-chain.wind-chaser x10 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 11 | 13427 | 3.67 | +0.0% | 0 | affliction.bog-eye x32, bulwark.rampart-seal x19, kill-chain.kill-pulse x11, kill-chain.steel-vigil x11, kill-chain.wind-chaser x11 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 12 | 12208 | 4.00 | +9.1% | 0 | affliction.bog-eye x33, bulwark.rampart-seal x17, empowered.weak-point x10, kill-chain.steel-vigil x12, kill-chain.wind-chaser x12 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 11 | 14282 | 3.67 | — | 0 | affliction.bog-eye x36, bulwark.rampart-seal x15, kill-chain.steel-vigil x11, kill-chain.wind-chaser x11 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 9 | 16078 | 3.00 | +28.6% | 0 | tempo.ghost-strike x66, bulwark.rampart-seal x20, tempo.gale-wake x39, affliction.bog-eye x21, kill-chain.wind-chaser x9 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 9 | 16067 | 3.00 | +28.6% | 0 | affliction.bleed-pips x179, bulwark.rampart-seal x21, tempo.gale-wake x35, affliction.bog-eye x20, kill-chain.wind-chaser x9 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 12 | 11742 | 4.00 | +71.4% | 0 | engagement.opening-flash x12, bulwark.rampart-seal x21, tempo.gale-wake x34, affliction.bog-eye x20, kill-chain.wind-chaser x12 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 7 | 20986 | 2.33 | — | 0 | bulwark.rampart-seal x18, tempo.gale-wake x36, affliction.bog-eye x23, kill-chain.wind-chaser x7 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 8 | 17950 | 2.67 | +0.0% | 0 | bulwark.rampart-seal x19, empowered.plating-crack x17, empowered.quake-ring x17, affliction.bog-eye x19, kill-chain.wind-chaser x8 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 10 | 13720 | 3.33 | +25.0% | 0 | bulwark.rampart-seal x19, empowered.quake-ring x17, control.frost-drag x15, affliction.bog-eye x19, kill-chain.wind-chaser x10 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 10 | 13810 | 3.33 | +25.0% | 0 | engagement.brace-sparks x17, bulwark.rampart-seal x19, empowered.quake-ring x17, affliction.bog-eye x18, kill-chain.wind-chaser x10 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 8 | 17775 | 2.67 | — | 0 | bulwark.rampart-seal x19, empowered.quake-ring x17, affliction.bog-eye x22, kill-chain.wind-chaser x8 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 9 | 14922 | 3.00 | +12.5% | 0 | bulwark.rampart-seal x17, tempo.ghost-strike x50, tempo.ruin-afterimage x50, affliction.bog-eye x26, kill-chain.wind-chaser x9 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 7 | 19057 | 2.33 | -12.5% | 0 | bulwark.rampart-seal x18, tempo.ruin-afterimage x52, affliction.bog-eye x26, kill-chain.kill-pulse x7, kill-chain.wind-chaser x7 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 10 | 13260 | 3.33 | +25.0% | 0 | bulwark.rampart-seal x16, tempo.ruin-afterimage x52, affliction.bog-eye x27, empowered.weak-point x13, kill-chain.wind-chaser x10 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 8 | 16925 | 2.67 | — | 0 | bulwark.rampart-seal x22, tempo.ruin-afterimage x51, affliction.bog-eye x25, kill-chain.wind-chaser x8 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 13 | 11462 | 4.33 | +8.3% | 0 | affliction.venom-pips x271, affliction.bog-eye x38, control.mire-grasp x64, bulwark.rampart-seal x17, kill-chain.wind-chaser x13 |
| `lineage-dagger-control-t2` | control | 2 | reload | 16 | 9075 | 5.33 | +33.3% | 0 | affliction.bog-eye x38, control.frost-drag x89, control.mire-grasp x67, bulwark.rampart-seal x20, kill-chain.wind-chaser x16 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 13 | 11692 | 4.33 | +8.3% | 0 | affliction.bog-eye x36, control.mire-grasp x66, bulwark.rampart-seal x14, kill-chain.wind-chaser x13 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 12 | 12858 | 4.00 | — | 0 | affliction.bog-eye x38, control.mire-grasp x66, bulwark.rampart-seal x15, kill-chain.wind-chaser x12 |

### `node-t2-mountain-05` — Crag 34% / Ridge 33% / Hopper 33% (mountain T2; shared by 1 authored node)

Dominant family **Crag** drops `empowered`, punishes `affliction`. Authored Crag 34% / Ridge 33% / Hopper 33%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 6 | 26033 | 2.00 | +0.0% | 0 | technique.cast-flare x49 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 5 | 31580 | 1.67 | -16.7% | 0 | kill-chain.kill-pulse x5 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 7 | 19629 | 2.33 | +16.7% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 6 | 26033 | 2.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 4 | 38675 | 1.33 | +33.3% | 0 | tempo.ghost-strike x65 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 4 | 39000 | 1.33 | +33.3% | 0 | affliction.bleed-pips x167 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 5 | 30680 | 1.67 | +66.7% | 0 | engagement.opening-flash x3 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 3 | 51500 | 1.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 4 | 38350 | 1.33 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | 1 | cooldown | 4 | 38775 | 1.33 | +0.0% | 0 | control.frost-drag x19 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 4 | 39000 | 1.33 | +0.0% | 0 | engagement.brace-sparks x7 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 4 | 38775 | 1.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 5 | 26220 | 1.67 | +25.0% | 0 | tempo.ghost-strike x45 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 3 | 45000 | 1.00 | -25.0% | 1 | kill-chain.kill-pulse x3 |
| `lineage-axe-empowered` | empowered | 1 | dot | 5 | 26220 | 1.67 | +25.0% | 0 | empowered.weak-point x7 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 4 | 33150 | 1.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 5 | 29420 | 1.67 | -16.7% | 0 | affliction.venom-pips x240 |
| `lineage-dagger-control` | control | 1 | reload | 6 | 23517 | 2.00 | +0.0% | 0 | control.frost-drag x76 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 6 | 21317 | 2.00 | +0.0% | 0 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 6 | 19733 | 2.00 | — | 0 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 8 | 18900 | 2.67 | +0.0% | 0 | affliction.bog-eye x36, technique.cast-flare x51, bulwark.rampart-seal x19, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 9 | 17100 | 3.00 | +12.5% | 0 | affliction.bog-eye x37, bulwark.rampart-seal x17, kill-chain.kill-pulse x9, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 8 | 17875 | 2.67 | +0.0% | 0 | affliction.bog-eye x36, bulwark.rampart-seal x14, empowered.weak-point x9, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 8 | 19875 | 2.67 | — | 0 | affliction.bog-eye x39, bulwark.rampart-seal x19, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 9 | 16667 | 3.00 | -18.2% | 0 | bulwark.rampart-seal x18, tempo.ghost-strike x71, affliction.bog-eye x27, tempo.gale-wake x42, kill-chain.wind-chaser x9 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 9 | 16722 | 3.00 | -18.2% | 0 | affliction.bleed-pips x188, bulwark.rampart-seal x18, affliction.bog-eye x26, tempo.gale-wake x37, kill-chain.wind-chaser x9 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 11 | 13182 | 3.67 | +0.0% | 0 | engagement.opening-flash x13, bulwark.rampart-seal x19, affliction.bog-eye x21, tempo.gale-wake x35, kill-chain.wind-chaser x11 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 11 | 13755 | 3.67 | — | 0 | bulwark.rampart-seal x19, affliction.bog-eye x26, tempo.gale-wake x38, kill-chain.wind-chaser x11 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 8 | 19125 | 2.67 | -20.0% | 0 | empowered.plating-crack x18, empowered.quake-ring x18, affliction.bog-eye x24, bulwark.rampart-seal x19, kill-chain.wind-chaser x8 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 9 | 16022 | 3.00 | -10.0% | 0 | empowered.quake-ring x18, affliction.bog-eye x21, bulwark.rampart-seal x19, control.frost-drag x16, kill-chain.wind-chaser x9 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 9 | 16300 | 3.00 | -10.0% | 0 | engagement.brace-sparks x16, empowered.quake-ring x18, affliction.bog-eye x22, bulwark.rampart-seal x19, kill-chain.wind-chaser x9 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 10 | 14540 | 3.33 | — | 0 | empowered.quake-ring x18, affliction.bog-eye x22, bulwark.rampart-seal x17, kill-chain.wind-chaser x10 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 8 | 17788 | 2.67 | -11.1% | 0 | bulwark.rampart-seal x21, tempo.ghost-strike x53, tempo.ruin-afterimage x53, affliction.bog-eye x28, kill-chain.wind-chaser x8 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 6 | 23167 | 2.00 | -33.3% | 0 | bulwark.rampart-seal x20, tempo.ruin-afterimage x52, affliction.bog-eye x28, kill-chain.kill-pulse x6, kill-chain.wind-chaser x6 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 12 | 10667 | 4.00 | +33.3% | 0 | bulwark.rampart-seal x19, tempo.ruin-afterimage x50, affliction.bog-eye x21, empowered.weak-point x15, kill-chain.wind-chaser x12 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 9 | 15489 | 3.00 | — | 0 | bulwark.rampart-seal x19, tempo.ruin-afterimage x52, affliction.bog-eye x31, kill-chain.wind-chaser x9 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 13 | 11123 | 4.33 | +8.3% | 0 | affliction.venom-pips x262, affliction.bog-eye x37, control.mire-grasp x63, bulwark.rampart-seal x16, kill-chain.wind-chaser x13 |
| `lineage-dagger-control-t2` | control | 2 | reload | 15 | 9693 | 5.00 | +25.0% | 0 | affliction.bog-eye x34, control.frost-drag x89, control.mire-grasp x67, bulwark.rampart-seal x17, kill-chain.wind-chaser x15 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 12 | 13708 | 4.00 | +0.0% | 0 | affliction.bog-eye x42, control.mire-grasp x71, bulwark.rampart-seal x14, kill-chain.wind-chaser x12 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 12 | 12433 | 4.00 | — | 0 | affliction.bog-eye x39, control.mire-grasp x65, bulwark.rampart-seal x14, kill-chain.wind-chaser x12 |

### `node-t2-cave-01` — Brood 70% / Brute 20% / Deep 10% (cave T2; shared by 1 authored node)

Dominant family **Brood** drops `affliction`, punishes `tempo`. Authored Brood 70% / Brute 20% / Deep 10%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 6 | 21267 | 2.00 | +0.0% | 0 | technique.cast-flare x42 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 5 | 28340 | 1.67 | -16.7% | 2 | kill-chain.kill-pulse x2 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 6 | 21600 | 2.00 | +0.0% | 1 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 6 | 21267 | 2.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 6 | 16917 | 2.00 | -14.3% | 2 | tempo.ghost-strike x43 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 6 | 16117 | 2.00 | -14.3% | 2 | affliction.bleed-pips x117 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 6 | 15433 | 2.00 | -14.3% | 2 | engagement.opening-flash x7 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 7 | 11643 | 2.33 | — | 1 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 6 | 14933 | 2.00 | +0.0% | 0 | empowered.plating-crack x10 |
| `lineage-hammer-control` | control | 1 | cooldown | 5 | 21740 | 1.67 | -16.7% | 0 | control.frost-drag x14 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 5 | 21900 | 1.67 | -16.7% | 0 | engagement.brace-sparks x10 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 6 | 14933 | 2.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 6 | 19067 | 2.00 | +0.0% | 2 | tempo.ghost-strike x26 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 5 | 23940 | 1.67 | -16.7% | 2 | kill-chain.kill-pulse x2 |
| `lineage-axe-empowered` | empowered | 1 | dot | 5 | 22720 | 1.67 | -16.7% | 3 | empowered.weak-point x4 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 6 | 19067 | 2.00 | — | 2 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 7 | 14914 | 2.33 | -22.2% | 3 | affliction.venom-pips x88 |
| `lineage-dagger-control` | control | 1 | reload | 7 | 14671 | 2.33 | -22.2% | 2 | control.frost-drag x30 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 7 | 15329 | 2.33 | -22.2% | 4 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 9 | 12033 | 3.00 | — | 3 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 11 | 11727 | 3.67 | +0.0% | 0 | technique.cast-flare x49, affliction.bog-eye x29, kill-chain.steel-vigil x11, kill-chain.wind-chaser x11, bulwark.rampart-seal x1 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 13 | 10831 | 4.33 | +18.2% | 0 | affliction.bog-eye x33, kill-chain.kill-pulse x13, kill-chain.steel-vigil x13, kill-chain.wind-chaser x13, bulwark.rampart-seal x1 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 13 | 8331 | 4.33 | +18.2% | 0 | affliction.bog-eye x24, kill-chain.steel-vigil x13, kill-chain.wind-chaser x13, bulwark.rampart-seal x1, empowered.weak-point x7 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 11 | 10882 | 3.67 | — | 0 | affliction.bog-eye x25, kill-chain.steel-vigil x11, kill-chain.wind-chaser x11, bulwark.rampart-seal x1 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 13 | 8008 | 4.33 | +0.0% | 0 | tempo.ghost-strike x59, bulwark.rampart-seal x15, tempo.gale-wake x36, affliction.bog-eye x23, kill-chain.wind-chaser x13 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 13 | 8215 | 4.33 | +0.0% | 0 | affliction.bleed-pips x167, bulwark.rampart-seal x16, tempo.gale-wake x32, affliction.bog-eye x24, kill-chain.wind-chaser x13 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 14 | 8029 | 4.67 | +7.7% | 0 | engagement.opening-flash x15, bulwark.rampart-seal x17, tempo.gale-wake x32, kill-chain.wind-chaser x14, affliction.bog-eye x16 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 13 | 7262 | 4.33 | — | 0 | bulwark.rampart-seal x14, tempo.gale-wake x28, affliction.bog-eye x19, kill-chain.wind-chaser x13 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 13 | 7692 | 4.33 | +30.0% | 0 | bulwark.rampart-seal x16, affliction.bog-eye x15, empowered.plating-crack x18, empowered.quake-ring x18, kill-chain.wind-chaser x13 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 14 | 6464 | 4.67 | +40.0% | 0 | bulwark.rampart-seal x14, affliction.bog-eye x15, control.frost-drag x14, empowered.quake-ring x18, kill-chain.wind-chaser x14 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 13 | 7692 | 4.33 | +30.0% | 0 | engagement.brace-sparks x15, bulwark.rampart-seal x13, affliction.bog-eye x17, empowered.quake-ring x18, kill-chain.wind-chaser x13 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 10 | 11520 | 3.33 | — | 0 | bulwark.rampart-seal x15, affliction.bog-eye x21, empowered.quake-ring x18, kill-chain.wind-chaser x10 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 10 | 11110 | 3.33 | +0.0% | 0 | tempo.ghost-strike x45, tempo.ruin-afterimage x45, affliction.bog-eye x22, kill-chain.wind-chaser x10, bulwark.rampart-seal x6 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 10 | 13850 | 3.33 | +0.0% | 0 | tempo.ruin-afterimage x56, affliction.bog-eye x31, kill-chain.kill-pulse x10, kill-chain.wind-chaser x10, bulwark.rampart-seal x12 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 11 | 10055 | 3.67 | +10.0% | 0 | tempo.ruin-afterimage x45, affliction.bog-eye x21, empowered.weak-point x11, kill-chain.wind-chaser x11, bulwark.rampart-seal x8 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 10 | 11110 | 3.33 | — | 0 | tempo.ruin-afterimage x45, affliction.bog-eye x22, kill-chain.wind-chaser x10, bulwark.rampart-seal x6 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 12 | 11767 | 4.00 | -14.3% | 0 | affliction.venom-pips x263, control.mire-grasp x65, affliction.bog-eye x38, kill-chain.wind-chaser x12, bulwark.rampart-seal x5 |
| `lineage-dagger-control-t2` | control | 2 | reload | 13 | 10746 | 4.33 | -7.1% | 0 | control.frost-drag x85, control.mire-grasp x63, affliction.bog-eye x33, kill-chain.wind-chaser x13, bulwark.rampart-seal x3 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 15 | 9513 | 5.00 | +7.1% | 0 | control.mire-grasp x62, affliction.bog-eye x33, kill-chain.wind-chaser x15, bulwark.rampart-seal x11 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 14 | 9607 | 4.67 | — | 0 | control.mire-grasp x58, affliction.bog-eye x29, kill-chain.wind-chaser x14, bulwark.rampart-seal x5 |
| `frame-cadence-light` | _frame light_ | 1 | cadence | 8 | 10913 | 2.67 | — | 2 | — |
| `frame-cadence-balanced` | _frame balanced_ | 1 | cadence | 7 | 11643 | 2.33 | — | 1 | — |
| `frame-cadence-heavy` | _frame heavy_ | 1 | cadence | 10 | 9840 | 3.33 | — | 0 | — |
| `frame-cooldown-light` | _frame light_ | 1 | cooldown | 8 | 17175 | 2.67 | — | 9 | — |
| `frame-cooldown-balanced` | _frame balanced_ | 1 | cooldown | 5 | 25900 | 1.67 | — | 3 | — |
| `frame-cooldown-heavy` | _frame heavy_ | 1 | cooldown | 6 | 14933 | 2.00 | — | 0 | — |
| `frame-reload-light` | _frame light_ | 1 | reload | 10 | 10810 | 3.33 | — | 6 | — |
| `frame-reload-balanced` | _frame balanced_ | 1 | reload | 5 | 23460 | 1.67 | — | 5 | — |
| `frame-reload-heavy` | _frame heavy_ | 1 | reload | 9 | 12033 | 3.00 | — | 3 | — |
| `frame-energy-light` | _frame light_ | 1 | energy | 5 | 22600 | 1.67 | — | 3 | — |
| `frame-energy-balanced` | _frame balanced_ | 1 | energy | 4 | 35200 | 1.33 | — | 1 | — |
| `frame-energy-heavy` | _frame heavy_ | 1 | energy | 6 | 21267 | 2.00 | — | 0 | — |
| `frame-dot-light` | _frame light_ | 1 | dot | 5 | 22980 | 1.67 | — | 3 | — |
| `frame-dot-balanced` | _frame balanced_ | 1 | dot | 6 | 19067 | 2.00 | — | 2 | — |
| `frame-dot-heavy` | _frame heavy_ | 1 | dot | 7 | 16886 | 2.33 | — | 2 | — |
| `frame-summoner-light` | _frame light_ | 1 | summoner | 9 | 0 | 3.00 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | 1 | summoner | 7 | 0 | 2.33 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | 1 | summoner | 11 | 4664 | 3.67 | — | 0 | — |
| `frame-cadence-light-t2` | _frame light_ | 2 | cadence | 13 | 7908 | 4.33 | — | 0 | bulwark.rampart-seal x15, tempo.gale-wake x41, affliction.bog-eye x22, kill-chain.wind-chaser x13 |
| `frame-cadence-balanced-t2` | _frame balanced_ | 2 | cadence | 13 | 7262 | 4.33 | — | 0 | bulwark.rampart-seal x14, tempo.gale-wake x28, affliction.bog-eye x19, kill-chain.wind-chaser x13 |
| `frame-cadence-heavy-t2` | _frame heavy_ | 2 | cadence | 13 | 11331 | 4.33 | — | 0 | bulwark.rampart-seal x13, affliction.bog-eye x35, tempo.gale-wake x33, kill-chain.wind-chaser x13 |
| `frame-cooldown-light-t2` | _frame light_ | 2 | cooldown | 10 | 13300 | 3.33 | — | 0 | bulwark.rampart-seal x14, affliction.bog-eye x24, empowered.quake-ring x26, kill-chain.wind-chaser x10 |
| `frame-cooldown-balanced-t2` | _frame balanced_ | 2 | cooldown | 11 | 7573 | 3.67 | — | 0 | bulwark.rampart-seal x11, affliction.bog-eye x12, empowered.quake-ring x13, kill-chain.wind-chaser x11 |
| `frame-cooldown-heavy-t2` | _frame heavy_ | 2 | cooldown | 10 | 11520 | 3.33 | — | 0 | bulwark.rampart-seal x15, affliction.bog-eye x21, empowered.quake-ring x18, kill-chain.wind-chaser x10 |
| `frame-reload-light-t2` | _frame light_ | 2 | reload | 14 | 10343 | 4.67 | — | 0 | control.mire-grasp x76, affliction.bog-eye x28, kill-chain.wind-chaser x14, bulwark.rampart-seal x11 |
| `frame-reload-balanced-t2` | _frame balanced_ | 2 | reload | 12 | 11933 | 4.00 | — | 0 | control.mire-grasp x72, affliction.bog-eye x27, kill-chain.wind-chaser x12, bulwark.rampart-seal x3 |
| `frame-reload-heavy-t2` | _frame heavy_ | 2 | reload | 14 | 9607 | 4.67 | — | 0 | control.mire-grasp x58, affliction.bog-eye x29, kill-chain.wind-chaser x14, bulwark.rampart-seal x5 |
| `frame-energy-light-t2` | _frame light_ | 2 | energy | 13 | 10523 | 4.33 | — | 0 | affliction.bog-eye x28, kill-chain.steel-vigil x13, kill-chain.wind-chaser x13, bulwark.rampart-seal x1 |
| `frame-energy-balanced-t2` | _frame balanced_ | 2 | energy | 9 | 15567 | 3.00 | — | 0 | affliction.bog-eye x31, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9, bulwark.rampart-seal x2 |
| `frame-energy-heavy-t2` | _frame heavy_ | 2 | energy | 11 | 10882 | 3.67 | — | 0 | affliction.bog-eye x25, kill-chain.steel-vigil x11, kill-chain.wind-chaser x11, bulwark.rampart-seal x1 |
| `frame-dot-light-t2` | _frame light_ | 2 | dot | 8 | 14238 | 2.67 | — | 0 | tempo.ruin-afterimage x45, affliction.bog-eye x22, kill-chain.wind-chaser x8, bulwark.rampart-seal x6 |
| `frame-dot-balanced-t2` | _frame balanced_ | 2 | dot | 10 | 11110 | 3.33 | — | 0 | tempo.ruin-afterimage x45, affliction.bog-eye x22, kill-chain.wind-chaser x10, bulwark.rampart-seal x6 |
| `frame-dot-heavy-t2` | _frame heavy_ | 2 | dot | 6 | 23983 | 2.00 | — | 0 | tempo.ruin-afterimage x47, affliction.bog-eye x34, kill-chain.wind-chaser x6, bulwark.rampart-seal x6 |
| `frame-summoner-light-t2` | _frame light_ | 2 | summoner | 8 | 0 | 2.67 | — | 0 | tempo.ruin-afterimage x337, kill-chain.wind-chaser x8 |
| `frame-summoner-balanced-t2` | _frame balanced_ | 2 | summoner | 9 | 8811 | 3.00 | — | 0 | tempo.ruin-afterimage x191, kill-chain.wind-chaser x9 |
| `frame-summoner-heavy-t2` | _frame heavy_ | 2 | summoner | 16 | 4631 | 5.33 | — | 0 | tempo.ruin-afterimage x69, kill-chain.wind-chaser x16, bulwark.rampart-seal x3 |

### `node-t2-cave-02` — Brute 70% / Deep 20% / Brood 10% (cave T2; shared by 1 authored node)

Dominant family **Brute** drops `empowered`, punishes `affliction`. Authored Brute 70% / Deep 20% / Brood 10%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 2 | 79050 | 0.67 | +0.0% | 0 | technique.cast-flare x48 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 3 | 48633 | 1.00 | +50.0% | 0 | kill-chain.kill-pulse x3 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 2 | 77850 | 0.67 | +0.0% | 0 | empowered.weak-point x8 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 2 | 79050 | 0.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 3 | 46467 | 1.00 | +0.0% | 4 | tempo.ghost-strike x22 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 3 | 47067 | 1.00 | +0.0% | 4 | affliction.bleed-pips x60 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 3 | 45900 | 1.00 | +0.0% | 4 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 3 | 47733 | 1.00 | — | 4 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 0 | — | 0.00 | — | 3 | empowered.plating-crack x8 |
| `lineage-hammer-control` | control | 1 | cooldown | 0 | — | 0.00 | — | 3 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 0 | — | 0.00 | — | 3 | engagement.brace-sparks x6 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 0 | — | 0.00 | — | 3 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 2 | 75050 | 0.67 | +0.0% | 4 | tempo.ghost-strike x17 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 3 | 46733 | 1.00 | +50.0% | 4 | — |
| `lineage-axe-empowered` | empowered | 1 | dot | 2 | 75050 | 0.67 | +0.0% | 4 | empowered.weak-point x2 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 2 | 75050 | 0.67 | — | 4 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 3 | 46200 | 1.00 | +0.0% | 7 | affliction.venom-pips x54 |
| `lineage-dagger-control` | control | 1 | reload | 3 | 48067 | 1.00 | +0.0% | 7 | control.frost-drag x17 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 2 | 72050 | 0.67 | -33.3% | 6 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 3 | 45100 | 1.00 | — | 6 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 6 | 25550 | 2.00 | +0.0% | 0 | technique.cast-flare x53, affliction.bog-eye x36, kill-chain.steel-vigil x6, kill-chain.wind-chaser x6, bulwark.rampart-seal x2 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 5 | 31960 | 1.67 | -16.7% | 0 | affliction.bog-eye x39, bulwark.rampart-seal x3, kill-chain.kill-pulse x5, kill-chain.steel-vigil x5, kill-chain.wind-chaser x5 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 6 | 23783 | 2.00 | +0.0% | 0 | affliction.bog-eye x33, empowered.weak-point x9, kill-chain.steel-vigil x6, kill-chain.wind-chaser x6, bulwark.rampart-seal x2 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 6 | 24117 | 2.00 | — | 0 | affliction.bog-eye x33, kill-chain.steel-vigil x6, kill-chain.wind-chaser x6, bulwark.rampart-seal x2 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 7 | 22000 | 2.33 | +40.0% | 0 | affliction.bog-eye x36, tempo.ghost-strike x85, bulwark.rampart-seal x11, tempo.gale-wake x51, kill-chain.wind-chaser x7 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 5 | 30300 | 1.67 | +0.0% | 0 | affliction.bleed-pips x223, affliction.bog-eye x36, bulwark.rampart-seal x11, tempo.gale-wake x44, kill-chain.wind-chaser x5 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 6 | 25267 | 2.00 | +20.0% | 0 | engagement.opening-flash x8, affliction.bog-eye x34, bulwark.rampart-seal x13, tempo.gale-wake x42, kill-chain.wind-chaser x6 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 5 | 30820 | 1.67 | — | 0 | affliction.bog-eye x35, bulwark.rampart-seal x12, tempo.gale-wake x45, kill-chain.wind-chaser x5 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 5 | 29440 | 1.67 | +0.0% | 0 | affliction.bog-eye x34, bulwark.rampart-seal x12, empowered.plating-crack x16, empowered.quake-ring x16, kill-chain.wind-chaser x5 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 4 | 37650 | 1.33 | -20.0% | 0 | affliction.bog-eye x31, bulwark.rampart-seal x13, empowered.quake-ring x17, control.frost-drag x19, kill-chain.wind-chaser x4 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 4 | 37725 | 1.33 | -20.0% | 0 | engagement.brace-sparks x9, affliction.bog-eye x30, bulwark.rampart-seal x13, empowered.quake-ring x17, kill-chain.wind-chaser x4 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 5 | 30960 | 1.67 | — | 0 | affliction.bog-eye x34, bulwark.rampart-seal x11, empowered.quake-ring x18, kill-chain.wind-chaser x5 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 4 | 36225 | 1.33 | +0.0% | 0 | tempo.ghost-strike x60, tempo.ruin-afterimage x60, affliction.bog-eye x32, bulwark.rampart-seal x15, kill-chain.wind-chaser x4 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 6 | 23800 | 2.00 | +50.0% | 1 | tempo.ruin-afterimage x44, affliction.bog-eye x24, bulwark.rampart-seal x13, kill-chain.kill-pulse x3, kill-chain.wind-chaser x3 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 4 | 37750 | 1.33 | +0.0% | 0 | tempo.ruin-afterimage x61, affliction.bog-eye x35, empowered.weak-point x6, bulwark.rampart-seal x17, kill-chain.wind-chaser x4 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 4 | 37650 | 1.33 | — | 0 | tempo.ruin-afterimage x61, affliction.bog-eye x33, bulwark.rampart-seal x18, kill-chain.wind-chaser x4 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 7 | 22700 | 2.33 | +16.7% | 0 | affliction.venom-pips x286, control.mire-grasp x67, affliction.bog-eye x37, kill-chain.wind-chaser x7, bulwark.rampart-seal x3 |
| `lineage-dagger-control-t2` | control | 2 | reload | 7 | 22429 | 2.33 | +16.7% | 0 | control.frost-drag x93, control.mire-grasp x72, affliction.bog-eye x36, kill-chain.wind-chaser x7, bulwark.rampart-seal x4 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 6 | 26750 | 2.00 | +0.0% | 0 | control.mire-grasp x66, affliction.bog-eye x39, bulwark.rampart-seal x11, kill-chain.wind-chaser x6 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 6 | 26350 | 2.00 | — | 0 | control.mire-grasp x66, affliction.bog-eye x39, kill-chain.wind-chaser x6, bulwark.rampart-seal x6 |

### `node-t2-cave-03` — Deep 70% / Brood 20% / Brute 10% (cave T2; shared by 1 authored node)

Dominant family **Deep** drops `kill-chain`, punishes `engagement`. Authored Deep 70% / Brood 20% / Brute 10%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 8 | 13525 | 2.67 | +0.0% | 1 | technique.cast-flare x33 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 8 | 15425 | 2.67 | +0.0% | 0 | kill-chain.kill-pulse x8 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 8 | 15100 | 2.67 | +0.0% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 8 | 13525 | 2.67 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 10 | 8340 | 3.33 | +25.0% | 0 | tempo.ghost-strike x44 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 10 | 8610 | 3.33 | +25.0% | 0 | affliction.bleed-pips x121 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 10 | 7910 | 3.33 | +25.0% | 0 | engagement.opening-flash x10 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 8 | 10075 | 2.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 8 | 11100 | 2.67 | +0.0% | 0 | empowered.plating-crack x11 |
| `lineage-hammer-control` | control | 1 | cooldown | 8 | 11100 | 2.67 | +0.0% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 8 | 10800 | 2.67 | +0.0% | 0 | engagement.brace-sparks x9 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 8 | 11300 | 2.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 6 | 19750 | 2.00 | +0.0% | 2 | tempo.ghost-strike x36 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 4 | 30200 | 1.33 | -33.3% | 3 | kill-chain.kill-pulse x4 |
| `lineage-axe-empowered` | empowered | 1 | dot | 6 | 19550 | 2.00 | +0.0% | 2 | empowered.weak-point x7 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 6 | 19750 | 2.00 | — | 2 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 8 | 11988 | 2.67 | +14.3% | 1 | affliction.venom-pips x136 |
| `lineage-dagger-control` | control | 1 | reload | 9 | 10300 | 3.00 | +28.6% | 1 | control.frost-drag x45 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 7 | 14314 | 2.33 | +0.0% | 2 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 7 | 14500 | 2.33 | — | 2 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 16 | 7031 | 5.33 | -11.1% | 0 | affliction.bog-eye x30, technique.cast-flare x45, bulwark.rampart-seal x14, kill-chain.steel-vigil x16, kill-chain.wind-chaser x16 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 13 | 10215 | 4.33 | -27.8% | 0 | bulwark.rampart-seal x10, affliction.bog-eye x36, kill-chain.kill-pulse x13, kill-chain.steel-vigil x13, kill-chain.wind-chaser x13 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 16 | 6906 | 5.33 | -11.1% | 0 | affliction.bog-eye x28, bulwark.rampart-seal x13, kill-chain.steel-vigil x16, kill-chain.wind-chaser x16, empowered.weak-point x8 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 18 | 6678 | 6.00 | — | 0 | affliction.bog-eye x34, bulwark.rampart-seal x16, kill-chain.steel-vigil x18, kill-chain.wind-chaser x18 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 19 | 5289 | 6.33 | +26.7% | 0 | tempo.ghost-strike x59, bulwark.rampart-seal x19, tempo.gale-wake x36, affliction.bog-eye x19, kill-chain.wind-chaser x19 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 18 | 5272 | 6.00 | +20.0% | 0 | affliction.bleed-pips x154, bulwark.rampart-seal x19, tempo.gale-wake x30, affliction.bog-eye x20, kill-chain.wind-chaser x18 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 19 | 4311 | 6.33 | +26.7% | 0 | engagement.opening-flash x19, bulwark.rampart-seal x19, tempo.gale-wake x26, affliction.bog-eye x13, kill-chain.wind-chaser x19 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 15 | 7760 | 5.00 | — | 0 | bulwark.rampart-seal x17, tempo.gale-wake x37, affliction.bog-eye x23, kill-chain.wind-chaser x15 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 17 | 5224 | 5.67 | +6.3% | 0 | bulwark.rampart-seal x18, affliction.bog-eye x10, empowered.plating-crack x18, empowered.quake-ring x18, kill-chain.wind-chaser x17 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 17 | 5224 | 5.67 | +6.3% | 0 | bulwark.rampart-seal x18, affliction.bog-eye x10, empowered.quake-ring x18, control.frost-drag x15, kill-chain.wind-chaser x17 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 17 | 5224 | 5.67 | +6.3% | 0 | engagement.brace-sparks x13, bulwark.rampart-seal x18, affliction.bog-eye x10, empowered.quake-ring x18, kill-chain.wind-chaser x17 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 16 | 5588 | 5.33 | — | 0 | bulwark.rampart-seal x16, affliction.bog-eye x13, empowered.quake-ring x17, kill-chain.wind-chaser x16 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 14 | 9064 | 4.67 | +0.0% | 0 | bulwark.rampart-seal x12, tempo.ghost-strike x53, tempo.ruin-afterimage x53, affliction.bog-eye x19, kill-chain.wind-chaser x14 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 14 | 9429 | 4.67 | +0.0% | 0 | bulwark.rampart-seal x14, tempo.ruin-afterimage x56, affliction.bog-eye x20, kill-chain.kill-pulse x14, kill-chain.wind-chaser x14 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 15 | 8233 | 5.00 | +7.1% | 0 | bulwark.rampart-seal x13, tempo.ruin-afterimage x52, affliction.bog-eye x20, empowered.weak-point x15, kill-chain.wind-chaser x15 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 14 | 9143 | 4.67 | — | 0 | bulwark.rampart-seal x12, tempo.ruin-afterimage x54, affliction.bog-eye x20, kill-chain.wind-chaser x14 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 15 | 8393 | 5.00 | +15.4% | 0 | affliction.venom-pips x229, control.mire-grasp x55, bulwark.rampart-seal x14, affliction.bog-eye x33, kill-chain.wind-chaser x15 |
| `lineage-dagger-control-t2` | control | 2 | reload | 18 | 6533 | 6.00 | +38.5% | 0 | control.frost-drag x74, control.mire-grasp x52, bulwark.rampart-seal x18, affliction.bog-eye x34, kill-chain.wind-chaser x18 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 16 | 8319 | 5.33 | +23.1% | 0 | control.mire-grasp x59, bulwark.rampart-seal x15, affliction.bog-eye x33, kill-chain.wind-chaser x16 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 13 | 10300 | 4.33 | — | 0 | control.mire-grasp x58, bulwark.rampart-seal x12, affliction.bog-eye x31, kill-chain.wind-chaser x13 |

### `node-t2-cave-04` — Brood 45% / Brute 45% / Deep 10% (cave T2; shared by 1 authored node)

Dominant family **Brood** drops `affliction`, punishes `tempo`. Authored Brood 45% / Brute 45% / Deep 10%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 4 | 36725 | 1.33 | +0.0% | 0 | technique.cast-flare x47 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 6 | 23900 | 2.00 | +50.0% | 3 | kill-chain.kill-pulse x2 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 5 | 27340 | 1.67 | +25.0% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 4 | 36725 | 1.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 6 | 16750 | 2.00 | +0.0% | 2 | tempo.ghost-strike x39 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 6 | 17217 | 2.00 | +0.0% | 2 | affliction.bleed-pips x106 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 4 | 29300 | 1.33 | -33.3% | 3 | engagement.opening-flash x6 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 6 | 14933 | 2.00 | — | 1 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 4 | 29625 | 1.33 | +0.0% | 1 | empowered.plating-crack x11 |
| `lineage-hammer-control` | control | 1 | cooldown | 4 | 30825 | 1.33 | +0.0% | 1 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 4 | 30250 | 1.33 | +0.0% | 1 | engagement.brace-sparks x8 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 4 | 29625 | 1.33 | — | 1 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 5 | 26260 | 1.67 | +0.0% | 3 | tempo.ghost-strike x18 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 5 | 26720 | 1.67 | +0.0% | 4 | kill-chain.kill-pulse x2 |
| `lineage-axe-empowered` | empowered | 1 | dot | 6 | 18767 | 2.00 | +20.0% | 2 | empowered.weak-point x4 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 5 | 26260 | 1.67 | — | 3 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 6 | 20583 | 2.00 | +20.0% | 4 | affliction.venom-pips x80 |
| `lineage-dagger-control` | control | 1 | reload | 7 | 16529 | 2.33 | +40.0% | 4 | control.frost-drag x26 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 6 | 20817 | 2.00 | +20.0% | 4 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 5 | 24680 | 1.67 | — | 5 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 11 | 14082 | 3.67 | -8.3% | 0 | affliction.bog-eye x36, technique.cast-flare x55, bulwark.rampart-seal x4, kill-chain.steel-vigil x11, kill-chain.wind-chaser x11 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 10 | 14370 | 3.33 | -16.7% | 0 | affliction.bog-eye x36, bulwark.rampart-seal x2, kill-chain.kill-pulse x10, kill-chain.steel-vigil x10, kill-chain.wind-chaser x10 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 10 | 15110 | 3.33 | -16.7% | 0 | affliction.bog-eye x38, bulwark.rampart-seal x2, kill-chain.steel-vigil x10, kill-chain.wind-chaser x10, empowered.weak-point x10 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 12 | 11383 | 4.00 | — | 0 | affliction.bog-eye x32, bulwark.rampart-seal x4, kill-chain.steel-vigil x12, kill-chain.wind-chaser x12 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 10 | 12600 | 3.33 | +25.0% | 0 | tempo.ghost-strike x71, bulwark.rampart-seal x14, tempo.gale-wake x42, affliction.bog-eye x27, kill-chain.wind-chaser x10 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 9 | 13067 | 3.00 | +12.5% | 0 | affliction.bleed-pips x180, bulwark.rampart-seal x14, tempo.gale-wake x35, affliction.bog-eye x26, kill-chain.wind-chaser x9 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 11 | 11427 | 3.67 | +37.5% | 0 | engagement.opening-flash x13, bulwark.rampart-seal x16, tempo.gale-wake x37, affliction.bog-eye x22, kill-chain.wind-chaser x11 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 8 | 16513 | 2.67 | — | 0 | bulwark.rampart-seal x12, tempo.gale-wake x40, affliction.bog-eye x29, kill-chain.wind-chaser x8 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 7 | 20000 | 2.33 | +0.0% | 0 | bulwark.rampart-seal x11, affliction.bog-eye x29, empowered.plating-crack x18, empowered.quake-ring x18, kill-chain.wind-chaser x7 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 8 | 17313 | 2.67 | +14.3% | 0 | bulwark.rampart-seal x11, affliction.bog-eye x27, control.frost-drag x18, empowered.quake-ring x17, kill-chain.wind-chaser x8 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 8 | 17350 | 2.67 | +14.3% | 0 | engagement.brace-sparks x13, bulwark.rampart-seal x12, affliction.bog-eye x28, empowered.quake-ring x18, kill-chain.wind-chaser x8 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 7 | 20000 | 2.33 | — | 0 | bulwark.rampart-seal x11, affliction.bog-eye x29, empowered.quake-ring x18, kill-chain.wind-chaser x7 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 8 | 18100 | 2.67 | -11.1% | 0 | bulwark.rampart-seal x13, tempo.ghost-strike x58, tempo.ruin-afterimage x58, affliction.bog-eye x28, kill-chain.wind-chaser x8 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 9 | 14744 | 3.00 | +0.0% | 0 | bulwark.rampart-seal x11, tempo.ruin-afterimage x54, affliction.bog-eye x27, kill-chain.kill-pulse x9, kill-chain.wind-chaser x9 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 11 | 10464 | 3.67 | +22.2% | 0 | bulwark.rampart-seal x8, tempo.ruin-afterimage x48, affliction.bog-eye x23, empowered.weak-point x12, kill-chain.wind-chaser x11 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 9 | 16356 | 3.00 | — | 0 | bulwark.rampart-seal x13, tempo.ruin-afterimage x60, affliction.bog-eye x29, kill-chain.wind-chaser x9 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 11 | 14645 | 3.67 | +37.5% | 0 | affliction.venom-pips x296, affliction.bog-eye x41, control.mire-grasp x71, bulwark.rampart-seal x7, kill-chain.wind-chaser x11 |
| `lineage-dagger-control-t2` | control | 2 | reload | 12 | 12817 | 4.00 | +50.0% | 0 | affliction.bog-eye x37, control.frost-drag x91, control.mire-grasp x68, bulwark.rampart-seal x8, kill-chain.wind-chaser x12 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 10 | 15510 | 3.33 | +25.0% | 0 | affliction.bog-eye x35, control.mire-grasp x65, bulwark.rampart-seal x13, kill-chain.wind-chaser x10 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 8 | 20075 | 2.67 | — | 0 | affliction.bog-eye x37, control.mire-grasp x67, bulwark.rampart-seal x8, kill-chain.wind-chaser x8 |

### `node-t2-cave-05` — Brood 34% / Brute 33% / Deep 33% (cave T2; shared by 1 authored node)

Dominant family **Brood** drops `affliction`, punishes `tempo`. Authored Brood 34% / Brute 33% / Deep 33%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 7 | 15600 | 2.33 | +0.0% | 1 | technique.cast-flare x25 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 8 | 14963 | 2.67 | +14.3% | 1 | kill-chain.kill-pulse x3 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 7 | 18157 | 2.33 | +0.0% | 2 | empowered.weak-point x4 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 7 | 15600 | 2.33 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 4 | 32875 | 1.33 | +0.0% | 4 | tempo.ghost-strike x27 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 4 | 33325 | 1.33 | +0.0% | 4 | affliction.bleed-pips x73 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 4 | 32275 | 1.33 | +0.0% | 4 | engagement.opening-flash x3 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 4 | 33625 | 1.33 | — | 4 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 2 | 79250 | 0.67 | +0.0% | 2 | empowered.plating-crack x10 |
| `lineage-hammer-control` | control | 1 | cooldown | 2 | 79250 | 0.67 | +0.0% | 2 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 3 | 47267 | 1.00 | +50.0% | 2 | engagement.brace-sparks x7 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 2 | 79250 | 0.67 | — | 2 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 4 | 32150 | 1.33 | +0.0% | 4 | tempo.ghost-strike x17 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 6 | 18717 | 2.00 | +50.0% | 2 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | 1 | dot | 4 | 32275 | 1.33 | +0.0% | 4 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 4 | 32150 | 1.33 | — | 4 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 6 | 21400 | 2.00 | +0.0% | 6 | affliction.venom-pips x60 |
| `lineage-dagger-control` | control | 1 | reload | 6 | 17983 | 2.00 | +0.0% | 4 | control.frost-drag x20 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 5 | 25680 | 1.67 | -16.7% | 5 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 6 | 18433 | 2.00 | — | 4 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 10 | 13800 | 3.33 | -9.1% | 0 | affliction.bog-eye x33, technique.cast-flare x52, bulwark.rampart-seal x6, kill-chain.steel-vigil x10, kill-chain.wind-chaser x10 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 10 | 14180 | 3.33 | -9.1% | 0 | affliction.bog-eye x36, bulwark.rampart-seal x8, kill-chain.kill-pulse x10, kill-chain.steel-vigil x10, kill-chain.wind-chaser x10 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 11 | 12273 | 3.67 | +0.0% | 0 | affliction.bog-eye x32, bulwark.rampart-seal x6, kill-chain.steel-vigil x11, kill-chain.wind-chaser x11, empowered.weak-point x9 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 11 | 12845 | 3.67 | — | 0 | affliction.bog-eye x34, bulwark.rampart-seal x9, kill-chain.steel-vigil x11, kill-chain.wind-chaser x11 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 9 | 12744 | 3.00 | -10.0% | 0 | tempo.ghost-strike x65, bulwark.rampart-seal x13, tempo.gale-wake x38, affliction.bog-eye x24, kill-chain.wind-chaser x9 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 10 | 11470 | 3.33 | +0.0% | 0 | affliction.bleed-pips x176, bulwark.rampart-seal x14, tempo.gale-wake x35, affliction.bog-eye x25, kill-chain.wind-chaser x10 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 13 | 9138 | 4.33 | +30.0% | 0 | engagement.opening-flash x14, bulwark.rampart-seal x17, tempo.gale-wake x36, affliction.bog-eye x27, kill-chain.wind-chaser x13 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 10 | 12820 | 3.33 | — | 0 | bulwark.rampart-seal x13, tempo.gale-wake x39, affliction.bog-eye x28, kill-chain.wind-chaser x10 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 9 | 15889 | 3.00 | +12.5% | 0 | bulwark.rampart-seal x13, affliction.bog-eye x30, empowered.plating-crack x18, empowered.quake-ring x18, kill-chain.wind-chaser x9 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 11 | 10400 | 3.67 | +37.5% | 0 | bulwark.rampart-seal x14, affliction.bog-eye x19, empowered.quake-ring x17, control.frost-drag x16, kill-chain.wind-chaser x11 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 11 | 10445 | 3.67 | +37.5% | 0 | engagement.brace-sparks x11, bulwark.rampart-seal x14, affliction.bog-eye x19, empowered.quake-ring x17, kill-chain.wind-chaser x11 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 8 | 16788 | 2.67 | — | 0 | bulwark.rampart-seal x12, affliction.bog-eye x27, empowered.quake-ring x17, kill-chain.wind-chaser x8 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 9 | 13811 | 3.00 | +0.0% | 0 | bulwark.rampart-seal x9, tempo.ghost-strike x50, tempo.ruin-afterimage x50, affliction.bog-eye x26, kill-chain.wind-chaser x9 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 6 | 24633 | 2.00 | -33.3% | 0 | bulwark.rampart-seal x18, tempo.ruin-afterimage x60, affliction.bog-eye x31, kill-chain.kill-pulse x6, kill-chain.wind-chaser x6 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 9 | 13889 | 3.00 | +0.0% | 0 | bulwark.rampart-seal x10, tempo.ruin-afterimage x50, affliction.bog-eye x26, empowered.weak-point x11, kill-chain.wind-chaser x9 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 9 | 13856 | 3.00 | — | 0 | bulwark.rampart-seal x9, tempo.ruin-afterimage x51, affliction.bog-eye x26, kill-chain.wind-chaser x9 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 9 | 17411 | 3.00 | +12.5% | 0 | affliction.venom-pips x282, affliction.bog-eye x39, control.mire-grasp x68, bulwark.rampart-seal x10, kill-chain.wind-chaser x9 |
| `lineage-dagger-control-t2` | control | 2 | reload | 14 | 10257 | 4.67 | +75.0% | 0 | affliction.bog-eye x36, control.frost-drag x89, control.mire-grasp x64, bulwark.rampart-seal x7, kill-chain.wind-chaser x14 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 9 | 18556 | 3.00 | +12.5% | 0 | affliction.bog-eye x42, control.mire-grasp x70, bulwark.rampart-seal x11, kill-chain.wind-chaser x9, kill-chain.spread-arc x1 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 8 | 20863 | 2.67 | — | 0 | affliction.bog-eye x43, control.mire-grasp x69, bulwark.rampart-seal x7, kill-chain.wind-chaser x8 |

### `node-t2-cave-06` — Brute 55% / Deep 30% / Brood 15% (cave T2; shared by 1 authored node)

Dominant family **Brute** drops `empowered`, punishes `affliction`. Authored Brute 55% / Deep 30% / Brood 15%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 2 | 80700 | 0.67 | +0.0% | 2 | technique.cast-flare x29 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 3 | 51933 | 1.00 | +50.0% | 0 | kill-chain.kill-pulse x3 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 2 | 81000 | 0.67 | +0.0% | 2 | empowered.weak-point x5 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 2 | 80700 | 0.67 | — | 2 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 1 | 155300 | 0.33 | +0.0% | 5 | tempo.ghost-strike x27 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 1 | 155300 | 0.33 | +0.0% | 5 | affliction.bleed-pips x73 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 1 | 154600 | 0.33 | +0.0% | 5 | engagement.opening-flash x3 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 1 | 156700 | 0.33 | — | 5 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 3 | 45167 | 1.00 | +0.0% | 2 | empowered.plating-crack x10 |
| `lineage-hammer-control` | control | 1 | cooldown | 3 | 45167 | 1.00 | +0.0% | 2 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 1 | 161400 | 0.33 | -66.7% | 3 | engagement.brace-sparks x6 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 3 | 45167 | 1.00 | — | 2 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 4 | 34550 | 1.33 | +0.0% | 4 | tempo.ghost-strike x20 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 1 | 159100 | 0.33 | -75.0% | 4 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | 1 | dot | 3 | 46733 | 1.00 | -25.0% | 5 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 4 | 34550 | 1.33 | — | 4 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 4 | 32400 | 1.33 | +33.3% | 5 | affliction.venom-pips x66 |
| `lineage-dagger-control` | control | 1 | reload | 3 | 46800 | 1.00 | +0.0% | 5 | control.frost-drag x28 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 2 | 71200 | 0.67 | -33.3% | 5 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 3 | 46233 | 1.00 | — | 7 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 6 | 26883 | 2.00 | +0.0% | 0 | technique.cast-flare x55, affliction.bog-eye x36, kill-chain.steel-vigil x6, kill-chain.wind-chaser x6, bulwark.rampart-seal x3 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 8 | 19400 | 2.67 | +33.3% | 0 | affliction.bog-eye x37, bulwark.rampart-seal x6, kill-chain.kill-pulse x8, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 6 | 26517 | 2.00 | +0.0% | 0 | affliction.bog-eye x38, empowered.weak-point x10, kill-chain.steel-vigil x6, kill-chain.wind-chaser x6, bulwark.rampart-seal x1 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 6 | 27083 | 2.00 | — | 0 | affliction.bog-eye x39, kill-chain.steel-vigil x6, kill-chain.wind-chaser x6, bulwark.rampart-seal x4 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 8 | 17163 | 2.67 | +0.0% | 0 | tempo.ghost-strike x78, tempo.gale-wake x46, affliction.bog-eye x30, bulwark.rampart-seal x13, kill-chain.wind-chaser x8 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 9 | 15333 | 3.00 | +12.5% | 0 | affliction.bleed-pips x210, tempo.gale-wake x42, affliction.bog-eye x30, bulwark.rampart-seal x15, kill-chain.wind-chaser x9 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 10 | 13260 | 3.33 | +25.0% | 0 | engagement.opening-flash x11, tempo.gale-wake x39, affliction.bog-eye x27, bulwark.rampart-seal x15, kill-chain.wind-chaser x10 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 8 | 17450 | 2.67 | — | 0 | tempo.gale-wake x42, affliction.bog-eye x32, bulwark.rampart-seal x12, kill-chain.wind-chaser x8 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 7 | 20457 | 2.33 | +16.7% | 0 | affliction.bog-eye x30, bulwark.rampart-seal x11, empowered.plating-crack x16, empowered.quake-ring x16, kill-chain.wind-chaser x7 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 8 | 17513 | 2.67 | +33.3% | 0 | affliction.bog-eye x32, bulwark.rampart-seal x11, empowered.quake-ring x17, control.frost-drag x19, kill-chain.wind-chaser x8 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 8 | 17988 | 2.67 | +33.3% | 0 | engagement.brace-sparks x9, affliction.bog-eye x32, bulwark.rampart-seal x12, empowered.quake-ring x17, kill-chain.wind-chaser x8 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 6 | 24550 | 2.00 | — | 0 | affliction.bog-eye x32, bulwark.rampart-seal x14, empowered.quake-ring x18, kill-chain.wind-chaser x6 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 6 | 24867 | 2.00 | +0.0% | 1 | tempo.ghost-strike x41, tempo.ruin-afterimage x41, affliction.bog-eye x20, bulwark.rampart-seal x9, kill-chain.wind-chaser x5 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 6 | 24750 | 2.00 | +0.0% | 1 | tempo.ruin-afterimage x38, affliction.bog-eye x17, bulwark.rampart-seal x8, kill-chain.kill-pulse x5, kill-chain.wind-chaser x5 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 8 | 17338 | 2.67 | +33.3% | 0 | tempo.ruin-afterimage x57, affliction.bog-eye x27, empowered.weak-point x9, bulwark.rampart-seal x14, kill-chain.wind-chaser x8 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 6 | 24867 | 2.00 | — | 1 | tempo.ruin-afterimage x41, affliction.bog-eye x20, bulwark.rampart-seal x9, kill-chain.wind-chaser x5 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 7 | 23629 | 2.33 | -12.5% | 0 | affliction.venom-pips x294, control.mire-grasp x69, affliction.bog-eye x41, kill-chain.wind-chaser x7, bulwark.rampart-seal x7 |
| `lineage-dagger-control-t2` | control | 2 | reload | 9 | 17944 | 3.00 | +12.5% | 0 | control.frost-drag x96, control.mire-grasp x70, affliction.bog-eye x40, kill-chain.wind-chaser x9, bulwark.rampart-seal x7 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 7 | 23471 | 2.33 | -12.5% | 0 | control.mire-grasp x69, affliction.bog-eye x42, bulwark.rampart-seal x8, kill-chain.wind-chaser x7 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 8 | 20113 | 2.67 | — | 0 | control.mire-grasp x68, affliction.bog-eye x41, kill-chain.wind-chaser x8, bulwark.rampart-seal x7 |

### `node-t2-swamp-01` — Coven 67% / Stalker 33% (swamp T2; shared by 1 authored node)

Dominant family **Coven** drops `control`, punishes `tempo`. Authored Mire 70% / Coven 20% / Stalker 10%; unfieldable at T2: Mire.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 7 | 16300 | 2.33 | +0.0% | 1 | technique.cast-flare x26 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 8 | 16038 | 2.67 | +14.3% | 3 | kill-chain.kill-pulse x3 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 8 | 15425 | 2.67 | +14.3% | 2 | empowered.weak-point x4 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 7 | 16300 | 2.33 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 8 | 13500 | 2.67 | -11.1% | 3 | tempo.ghost-strike x30 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 8 | 13988 | 2.67 | -11.1% | 3 | affliction.bleed-pips x85 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 10 | 9560 | 3.33 | +11.1% | 3 | engagement.opening-flash x8 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 9 | 10556 | 3.00 | — | 2 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 10 | 7470 | 3.33 | +0.0% | 1 | empowered.plating-crack x12 |
| `lineage-hammer-control` | control | 1 | cooldown | 10 | 7620 | 3.33 | +0.0% | 1 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 10 | 7590 | 3.33 | +0.0% | 1 | engagement.brace-sparks x7 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 10 | 9700 | 3.33 | — | 1 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 9 | 10256 | 3.00 | +0.0% | 0 | tempo.ghost-strike x33 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 8 | 11750 | 2.67 | -11.1% | 0 | kill-chain.kill-pulse x8 |
| `lineage-axe-empowered` | empowered | 1 | dot | 9 | 10056 | 3.00 | +0.0% | 0 | empowered.weak-point x9 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 9 | 9667 | 3.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 10 | 8810 | 3.33 | +11.1% | 0 | affliction.venom-pips x140 |
| `lineage-dagger-control` | control | 1 | reload | 11 | 8209 | 3.67 | +22.2% | 0 | control.frost-drag x49 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 11 | 7691 | 3.67 | +22.2% | 0 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 9 | 10667 | 3.00 | — | 0 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 16 | 7338 | 5.33 | +0.0% | 0 | affliction.bog-eye x33, technique.cast-flare x47, kill-chain.steel-vigil x16, kill-chain.wind-chaser x16, bulwark.rampart-seal x15 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 19 | 6405 | 6.33 | +18.8% | 0 | affliction.bog-eye x35, kill-chain.kill-pulse x19, kill-chain.steel-vigil x19, kill-chain.wind-chaser x19, bulwark.rampart-seal x13 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 16 | 7306 | 5.33 | +0.0% | 0 | affliction.bog-eye x33, kill-chain.steel-vigil x16, kill-chain.wind-chaser x16, empowered.weak-point x8, bulwark.rampart-seal x12 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 16 | 7331 | 5.33 | — | 0 | affliction.bog-eye x33, kill-chain.steel-vigil x16, kill-chain.wind-chaser x16, bulwark.rampart-seal x13 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 17 | 6324 | 5.67 | +30.8% | 0 | tempo.ghost-strike x65, bulwark.rampart-seal x16, tempo.gale-wake x39, kill-chain.wind-chaser x17, affliction.bog-eye x14 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 14 | 8164 | 4.67 | +7.7% | 0 | affliction.bleed-pips x185, bulwark.rampart-seal x15, tempo.gale-wake x37, affliction.bog-eye x18, kill-chain.wind-chaser x14 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 19 | 4926 | 6.33 | +46.2% | 0 | engagement.opening-flash x20, bulwark.rampart-seal x14, tempo.gale-wake x30, kill-chain.wind-chaser x19, affliction.bog-eye x17 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 13 | 8585 | 4.33 | — | 0 | bulwark.rampart-seal x12, tempo.gale-wake x37, affliction.bog-eye x22, kill-chain.wind-chaser x13 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 12 | 8408 | 4.00 | +0.0% | 0 | bulwark.rampart-seal x11, empowered.plating-crack x15, empowered.quake-ring x15, kill-chain.wind-chaser x12, affliction.bog-eye x19 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 13 | 6785 | 4.33 | +8.3% | 0 | bulwark.rampart-seal x11, empowered.quake-ring x15, kill-chain.wind-chaser x13, control.frost-drag x14, affliction.bog-eye x17 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 13 | 6785 | 4.33 | +8.3% | 0 | engagement.brace-sparks x10, bulwark.rampart-seal x11, empowered.quake-ring x15, kill-chain.wind-chaser x13, affliction.bog-eye x17 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 12 | 8617 | 4.00 | — | 0 | bulwark.rampart-seal x11, empowered.quake-ring x16, kill-chain.wind-chaser x12, affliction.bog-eye x19 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 13 | 8077 | 4.33 | +8.3% | 0 | tempo.ghost-strike x43, tempo.ruin-afterimage x43, affliction.bog-eye x23, kill-chain.wind-chaser x13, bulwark.rampart-seal x14 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 13 | 7569 | 4.33 | +8.3% | 0 | tempo.ruin-afterimage x39, affliction.bog-eye x20, kill-chain.kill-pulse x13, kill-chain.wind-chaser x13, bulwark.rampart-seal x14 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 14 | 7100 | 4.67 | +16.7% | 0 | tempo.ruin-afterimage x41, affliction.bog-eye x21, kill-chain.wind-chaser x14, bulwark.rampart-seal x14, empowered.weak-point x13 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 12 | 8758 | 4.00 | — | 0 | tempo.ruin-afterimage x41, affliction.bog-eye x20, kill-chain.wind-chaser x12, bulwark.rampart-seal x13 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 18 | 6644 | 6.00 | +0.0% | 0 | affliction.venom-pips x235, affliction.bog-eye x29, control.mire-grasp x55, kill-chain.wind-chaser x18, bulwark.rampart-seal x16 |
| `lineage-dagger-control-t2` | control | 2 | reload | 21 | 5129 | 7.00 | +16.7% | 0 | affliction.bog-eye x28, control.frost-drag x68, control.mire-grasp x49, kill-chain.wind-chaser x21, bulwark.rampart-seal x16 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 19 | 6174 | 6.33 | +5.6% | 0 | affliction.bog-eye x31, control.mire-grasp x55, kill-chain.wind-chaser x19, bulwark.rampart-seal x17 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 18 | 7033 | 6.00 | — | 0 | affliction.bog-eye x34, control.mire-grasp x59, kill-chain.wind-chaser x18, bulwark.rampart-seal x17 |
| `frame-cadence-light` | _frame light_ | 1 | cadence | 7 | 15514 | 2.33 | — | 2 | — |
| `frame-cadence-balanced` | _frame balanced_ | 1 | cadence | 9 | 10556 | 3.00 | — | 2 | — |
| `frame-cadence-heavy` | _frame heavy_ | 1 | cadence | 8 | 12888 | 2.67 | — | 1 | — |
| `frame-cooldown-light` | _frame light_ | 1 | cooldown | 4 | 29125 | 1.33 | — | 4 | — |
| `frame-cooldown-balanced` | _frame balanced_ | 1 | cooldown | 11 | 9391 | 3.67 | — | 2 | — |
| `frame-cooldown-heavy` | _frame heavy_ | 1 | cooldown | 10 | 9700 | 3.33 | — | 1 | — |
| `frame-reload-light` | _frame light_ | 1 | reload | 9 | 10356 | 3.00 | — | 0 | — |
| `frame-reload-balanced` | _frame balanced_ | 1 | reload | 10 | 9820 | 3.33 | — | 0 | — |
| `frame-reload-heavy` | _frame heavy_ | 1 | reload | 9 | 10667 | 3.00 | — | 0 | — |
| `frame-energy-light` | _frame light_ | 1 | energy | 7 | 16314 | 2.33 | — | 2 | — |
| `frame-energy-balanced` | _frame balanced_ | 1 | energy | 8 | 12475 | 2.67 | — | 1 | — |
| `frame-energy-heavy` | _frame heavy_ | 1 | energy | 7 | 16300 | 2.33 | — | 1 | — |
| `frame-dot-light` | _frame light_ | 1 | dot | 10 | 9150 | 3.33 | — | 1 | — |
| `frame-dot-balanced` | _frame balanced_ | 1 | dot | 9 | 9667 | 3.00 | — | 0 | — |
| `frame-dot-heavy` | _frame heavy_ | 1 | dot | 9 | 8667 | 3.00 | — | 0 | — |
| `frame-summoner-light` | _frame light_ | 1 | summoner | 8 | 0 | 2.67 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | 1 | summoner | 7 | 0 | 2.33 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | 1 | summoner | 15 | 1353 | 5.00 | — | 0 | — |
| `frame-cadence-light-t2` | _frame light_ | 2 | cadence | 13 | 8462 | 4.33 | — | 0 | bulwark.rampart-seal x13, tempo.gale-wake x46, affliction.bog-eye x20, kill-chain.wind-chaser x13 |
| `frame-cadence-balanced-t2` | _frame balanced_ | 2 | cadence | 13 | 8585 | 4.33 | — | 0 | bulwark.rampart-seal x12, tempo.gale-wake x37, affliction.bog-eye x22, kill-chain.wind-chaser x13 |
| `frame-cadence-heavy-t2` | _frame heavy_ | 2 | cadence | 13 | 8592 | 4.33 | — | 0 | bulwark.rampart-seal x12, tempo.gale-wake x25, kill-chain.wind-chaser x13, affliction.bog-eye x22 |
| `frame-cooldown-light-t2` | _frame light_ | 2 | cooldown | 13 | 9815 | 4.33 | — | 0 | empowered.quake-ring x27, bulwark.rampart-seal x14, affliction.bog-eye x28, kill-chain.wind-chaser x13 |
| `frame-cooldown-balanced-t2` | _frame balanced_ | 2 | cooldown | 13 | 8869 | 4.33 | — | 0 | empowered.quake-ring x19, bulwark.rampart-seal x13, affliction.bog-eye x24, kill-chain.wind-chaser x13 |
| `frame-cooldown-heavy-t2` | _frame heavy_ | 2 | cooldown | 12 | 8617 | 4.00 | — | 0 | bulwark.rampart-seal x11, empowered.quake-ring x16, kill-chain.wind-chaser x12, affliction.bog-eye x19 |
| `frame-reload-light-t2` | _frame light_ | 2 | reload | 17 | 7588 | 5.67 | — | 0 | affliction.bog-eye x36, control.mire-grasp x71, kill-chain.wind-chaser x17, bulwark.rampart-seal x16 |
| `frame-reload-balanced-t2` | _frame balanced_ | 2 | reload | 15 | 8520 | 5.00 | — | 0 | affliction.bog-eye x36, control.mire-grasp x68, kill-chain.wind-chaser x15, bulwark.rampart-seal x14 |
| `frame-reload-heavy-t2` | _frame heavy_ | 2 | reload | 18 | 7033 | 6.00 | — | 0 | affliction.bog-eye x34, control.mire-grasp x59, kill-chain.wind-chaser x18, bulwark.rampart-seal x17 |
| `frame-energy-light-t2` | _frame light_ | 2 | energy | 17 | 7359 | 5.67 | — | 0 | affliction.bog-eye x28, kill-chain.steel-vigil x17, kill-chain.wind-chaser x17, bulwark.rampart-seal x16 |
| `frame-energy-balanced-t2` | _frame balanced_ | 2 | energy | 16 | 7106 | 5.33 | — | 0 | affliction.bog-eye x33, kill-chain.steel-vigil x16, kill-chain.wind-chaser x16, bulwark.rampart-seal x7 |
| `frame-energy-heavy-t2` | _frame heavy_ | 2 | energy | 16 | 7331 | 5.33 | — | 0 | affliction.bog-eye x33, kill-chain.steel-vigil x16, kill-chain.wind-chaser x16, bulwark.rampart-seal x13 |
| `frame-dot-light-t2` | _frame light_ | 2 | dot | 14 | 8579 | 4.67 | — | 0 | tempo.ruin-afterimage x50, affliction.bog-eye x24, kill-chain.wind-chaser x14, bulwark.rampart-seal x16 |
| `frame-dot-balanced-t2` | _frame balanced_ | 2 | dot | 12 | 8758 | 4.00 | — | 0 | tempo.ruin-afterimage x41, affliction.bog-eye x20, kill-chain.wind-chaser x12, bulwark.rampart-seal x13 |
| `frame-dot-heavy-t2` | _frame heavy_ | 2 | dot | 13 | 7615 | 4.33 | — | 0 | tempo.ruin-afterimage x33, affliction.bog-eye x19, kill-chain.wind-chaser x13, bulwark.rampart-seal x14 |
| `frame-summoner-light-t2` | _frame light_ | 2 | summoner | 15 | 0 | 5.00 | — | 0 | tempo.ruin-afterimage x310, kill-chain.wind-chaser x15 |
| `frame-summoner-balanced-t2` | _frame balanced_ | 2 | summoner | 11 | 2136 | 3.67 | — | 0 | tempo.ruin-afterimage x222, kill-chain.wind-chaser x11, bulwark.rampart-seal x1 |
| `frame-summoner-heavy-t2` | _frame heavy_ | 2 | summoner | 28 | 2136 | 9.33 | — | 0 | tempo.ruin-afterimage x82, kill-chain.wind-chaser x28, bulwark.rampart-seal x8 |

### `node-t2-swamp-02` — Coven 78% / Stalker 22% (swamp T2; shared by 2 authored nodes)

Dominant family **Coven** drops `control`, punishes `tempo`. Authored Coven 70% / Stalker 20% / Mire 10%; unfieldable at T2: Mire.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 8 | 13713 | 2.67 | +0.0% | 2 | technique.cast-flare x28 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 7 | 16429 | 2.33 | -12.5% | 1 | kill-chain.kill-pulse x5 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 8 | 14200 | 2.67 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 8 | 13713 | 2.67 | — | 2 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 4 | 33200 | 1.33 | -42.9% | 7 | tempo.ghost-strike x22 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 5 | 26280 | 1.67 | -28.6% | 5 | affliction.bleed-pips x63 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 8 | 15338 | 2.67 | +14.3% | 5 | engagement.opening-flash x3 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 7 | 14071 | 2.33 | — | 4 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 8 | 12525 | 2.67 | -11.1% | 2 | empowered.plating-crack x9 |
| `lineage-hammer-control` | control | 1 | cooldown | 8 | 12888 | 2.67 | -11.1% | 2 | control.frost-drag x9 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 8 | 14200 | 2.67 | -11.1% | 2 | engagement.brace-sparks x4 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 9 | 12500 | 3.00 | — | 3 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 8 | 12475 | 2.67 | +0.0% | 0 | tempo.ghost-strike x36 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 8 | 13963 | 2.67 | +0.0% | 0 | kill-chain.kill-pulse x8 |
| `lineage-axe-empowered` | empowered | 1 | dot | 8 | 12225 | 2.67 | +0.0% | 0 | empowered.weak-point x9 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 8 | 12500 | 2.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 10 | 9050 | 3.33 | +11.1% | 0 | affliction.venom-pips x147 |
| `lineage-dagger-control` | control | 1 | reload | 9 | 9956 | 3.00 | +0.0% | 0 | control.frost-drag x49 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 8 | 12413 | 2.67 | -11.1% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 9 | 10422 | 3.00 | — | 0 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 15 | 7213 | 5.00 | -25.0% | 0 | technique.cast-flare x43, bulwark.rampart-seal x13, affliction.bog-eye x30, kill-chain.steel-vigil x15, kill-chain.wind-chaser x15 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 15 | 8133 | 5.00 | -25.0% | 0 | bulwark.rampart-seal x13, affliction.bog-eye x33, kill-chain.kill-pulse x15, kill-chain.steel-vigil x15, kill-chain.wind-chaser x15 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 17 | 6776 | 5.67 | -15.0% | 0 | bulwark.rampart-seal x14, affliction.bog-eye x31, kill-chain.steel-vigil x17, kill-chain.wind-chaser x17, empowered.weak-point x7 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 20 | 5460 | 6.67 | — | 0 | bulwark.rampart-seal x14, affliction.bog-eye x30, kill-chain.steel-vigil x20, kill-chain.wind-chaser x20 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 16 | 6238 | 5.33 | +23.1% | 0 | tempo.ghost-strike x58, bulwark.rampart-seal x14, tempo.gale-wake x36, kill-chain.wind-chaser x16, affliction.bog-eye x14 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 15 | 6893 | 5.00 | +15.4% | 0 | affliction.bleed-pips x166, bulwark.rampart-seal x13, tempo.gale-wake x33, kill-chain.wind-chaser x15, affliction.bog-eye x14 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 17 | 5076 | 5.67 | +30.8% | 0 | engagement.opening-flash x18, bulwark.rampart-seal x11, kill-chain.wind-chaser x17, tempo.gale-wake x27, affliction.bog-eye x15 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 13 | 8085 | 4.33 | — | 0 | bulwark.rampart-seal x12, tempo.gale-wake x34, kill-chain.wind-chaser x13, affliction.bog-eye x18 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 14 | 7264 | 4.67 | +7.7% | 0 | bulwark.rampart-seal x11, affliction.bog-eye x19, empowered.plating-crack x15, empowered.quake-ring x15, kill-chain.wind-chaser x14 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 13 | 7508 | 4.33 | +0.0% | 0 | bulwark.rampart-seal x11, affliction.bog-eye x18, empowered.quake-ring x16, control.frost-drag x15, kill-chain.wind-chaser x13 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 14 | 7279 | 4.67 | +7.7% | 0 | engagement.brace-sparks x12, bulwark.rampart-seal x12, affliction.bog-eye x18, empowered.quake-ring x17, kill-chain.wind-chaser x14 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 13 | 8185 | 4.33 | — | 0 | bulwark.rampart-seal x10, affliction.bog-eye x19, empowered.quake-ring x17, kill-chain.wind-chaser x13 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 13 | 8092 | 4.33 | +0.0% | 0 | bulwark.rampart-seal x16, tempo.ghost-strike x42, tempo.ruin-afterimage x42, affliction.bog-eye x24, kill-chain.wind-chaser x13 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 13 | 9192 | 4.33 | +0.0% | 0 | bulwark.rampart-seal x18, tempo.ruin-afterimage x48, affliction.bog-eye x27, kill-chain.kill-pulse x13, kill-chain.wind-chaser x13 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 13 | 8738 | 4.33 | +0.0% | 0 | bulwark.rampart-seal x17, tempo.ruin-afterimage x46, affliction.bog-eye x26, empowered.weak-point x13, kill-chain.wind-chaser x13 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 13 | 8677 | 4.33 | — | 0 | bulwark.rampart-seal x18, tempo.ruin-afterimage x44, affliction.bog-eye x24, kill-chain.wind-chaser x13 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 18 | 6033 | 6.00 | -5.3% | 0 | affliction.venom-pips x215, control.mire-grasp x52, bulwark.rampart-seal x19, kill-chain.wind-chaser x18, affliction.bog-eye x28 |
| `lineage-dagger-control-t2` | control | 2 | reload | 17 | 6100 | 5.67 | -10.5% | 0 | control.frost-drag x65, control.mire-grasp x48, bulwark.rampart-seal x20, kill-chain.wind-chaser x17, affliction.bog-eye x25 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 19 | 6021 | 6.33 | +0.0% | 0 | control.mire-grasp x54, bulwark.rampart-seal x22, affliction.bog-eye x27, kill-chain.wind-chaser x19, kill-chain.spread-arc x1 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 19 | 6079 | 6.33 | — | 0 | control.mire-grasp x53, bulwark.rampart-seal x18, affliction.bog-eye x28, kill-chain.wind-chaser x19 |

### `node-t2-swamp-03` — Stalker 88% / Coven 13% (swamp T2; shared by 1 authored node)

Dominant family **Stalker** drops `kill-chain`, punishes `bulwark`. Authored Stalker 70% / Mire 20% / Coven 10%; unfieldable at T2: Mire.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 11 | 9418 | 3.67 | +0.0% | 1 | technique.cast-flare x37 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 11 | 7436 | 3.67 | +0.0% | 0 | kill-chain.kill-pulse x11 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 11 | 8945 | 3.67 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 11 | 9418 | 3.67 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 11 | 7936 | 3.67 | +10.0% | 2 | tempo.ghost-strike x31 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 11 | 7764 | 3.67 | +10.0% | 1 | affliction.bleed-pips x76 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 12 | 5692 | 4.00 | +20.0% | 0 | engagement.opening-flash x11 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 10 | 8260 | 3.33 | — | 1 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 13 | 6077 | 4.33 | -7.1% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | 1 | cooldown | 13 | 6077 | 4.33 | -7.1% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 14 | 4879 | 4.67 | +0.0% | 0 | engagement.brace-sparks x11 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 14 | 5079 | 4.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 9 | 8833 | 3.00 | +0.0% | 1 | tempo.ghost-strike x27 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 8 | 11100 | 2.67 | -11.1% | 0 | kill-chain.kill-pulse x8 |
| `lineage-axe-empowered` | empowered | 1 | dot | 9 | 8833 | 3.00 | +0.0% | 1 | empowered.weak-point x9 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 9 | 8833 | 3.00 | — | 1 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 11 | 7691 | 3.67 | +0.0% | 0 | affliction.venom-pips x126 |
| `lineage-dagger-control` | control | 1 | reload | 12 | 6258 | 4.00 | +9.1% | 0 | control.frost-drag x38 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 9 | 7933 | 3.00 | -18.2% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 11 | 7745 | 3.67 | — | 0 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 21 | 5081 | 7.00 | +10.5% | 0 | affliction.bog-eye x37, technique.cast-flare x46, kill-chain.steel-vigil x21, kill-chain.wind-chaser x21, bulwark.rampart-seal x2 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 19 | 5511 | 6.33 | +0.0% | 0 | affliction.bog-eye x36, kill-chain.kill-pulse x19, kill-chain.steel-vigil x19, kill-chain.wind-chaser x19, bulwark.rampart-seal x3 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 19 | 5389 | 6.33 | +0.0% | 0 | affliction.bog-eye x36, kill-chain.steel-vigil x19, kill-chain.wind-chaser x19, empowered.weak-point x7, bulwark.rampart-seal x3 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 19 | 5379 | 6.33 | — | 0 | affliction.bog-eye x35, kill-chain.steel-vigil x19, kill-chain.wind-chaser x19, bulwark.rampart-seal x2 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 23 | 3774 | 7.67 | +27.8% | 0 | tempo.ghost-strike x46, bulwark.rampart-seal x20, tempo.gale-wake x31, kill-chain.wind-chaser x23, affliction.bog-eye x6 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 19 | 4432 | 6.33 | +5.6% | 0 | affliction.bleed-pips x128, bulwark.rampart-seal x19, tempo.gale-wake x28, kill-chain.wind-chaser x19, affliction.bog-eye x6 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 26 | 3338 | 8.67 | +44.4% | 0 | engagement.opening-flash x27, bulwark.rampart-seal x20, tempo.gale-wake x29, kill-chain.wind-chaser x26, affliction.bog-eye x11 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 18 | 4900 | 6.00 | — | 0 | bulwark.rampart-seal x18, tempo.gale-wake x29, affliction.bog-eye x16, kill-chain.wind-chaser x18 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 14 | 5500 | 4.67 | +0.0% | 0 | bulwark.rampart-seal x8, affliction.bog-eye x15, empowered.plating-crack x13, empowered.quake-ring x13, kill-chain.wind-chaser x14 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 22 | 3918 | 7.33 | +57.1% | 0 | bulwark.rampart-seal x11, affliction.bog-eye x15, control.frost-drag x15, kill-chain.wind-chaser x22, empowered.quake-ring x15 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 22 | 3914 | 7.33 | +57.1% | 0 | engagement.brace-sparks x12, bulwark.rampart-seal x11, affliction.bog-eye x15, kill-chain.wind-chaser x22, empowered.quake-ring x15 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 14 | 5500 | 4.67 | — | 0 | bulwark.rampart-seal x8, affliction.bog-eye x15, empowered.quake-ring x13, kill-chain.wind-chaser x14 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 15 | 6033 | 5.00 | +0.0% | 0 | tempo.ghost-strike x35, tempo.ruin-afterimage x35, affliction.bog-eye x17, kill-chain.wind-chaser x15, bulwark.rampart-seal x4 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 16 | 6100 | 5.33 | +6.7% | 0 | tempo.ruin-afterimage x37, affliction.bog-eye x20, kill-chain.kill-pulse x16, kill-chain.wind-chaser x16, bulwark.rampart-seal x5 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 16 | 4769 | 5.33 | +6.7% | 0 | tempo.ruin-afterimage x29, affliction.bog-eye x16, kill-chain.wind-chaser x16, empowered.weak-point x8, bulwark.rampart-seal x1 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 15 | 6093 | 5.00 | — | 0 | tempo.ruin-afterimage x36, affliction.bog-eye x17, kill-chain.wind-chaser x15, bulwark.rampart-seal x4 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 24 | 4625 | 8.00 | +0.0% | 0 | affliction.venom-pips x204, affliction.bog-eye x34, control.mire-grasp x52, kill-chain.wind-chaser x24, bulwark.rampart-seal x14 |
| `lineage-dagger-control-t2` | control | 2 | reload | 23 | 4939 | 7.67 | -4.2% | 0 | affliction.bog-eye x35, control.frost-drag x58, control.mire-grasp x48, kill-chain.wind-chaser x23, bulwark.rampart-seal x12 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 24 | 4817 | 8.00 | +0.0% | 0 | affliction.bog-eye x39, control.mire-grasp x59, kill-chain.wind-chaser x24, bulwark.rampart-seal x10 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 24 | 5013 | 8.00 | — | 0 | affliction.bog-eye x39, control.mire-grasp x61, kill-chain.wind-chaser x24, bulwark.rampart-seal x7 |

### `node-t2-swamp-05` — Coven 50% / Stalker 50% (swamp T2; shared by 1 authored node)

Dominant family **Coven** drops `control`, punishes `tempo`. Authored Mire 34% / Coven 33% / Stalker 33%; unfieldable at T2: Mire.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 10 | 11470 | 3.33 | +0.0% | 1 | technique.cast-flare x38 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 8 | 14688 | 2.67 | -20.0% | 0 | kill-chain.kill-pulse x8 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 9 | 14100 | 3.00 | -10.0% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 10 | 11470 | 3.33 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 11 | 9591 | 3.67 | +83.3% | 3 | tempo.ghost-strike x24 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 7 | 15714 | 2.33 | +16.7% | 4 | affliction.bleed-pips x67 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 7 | 16129 | 2.33 | +16.7% | 4 | engagement.opening-flash x3 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 6 | 19200 | 2.00 | — | 5 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 11 | 9055 | 3.67 | +0.0% | 1 | empowered.plating-crack x12 |
| `lineage-hammer-control` | control | 1 | cooldown | 12 | 8475 | 4.00 | +9.1% | 1 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 12 | 8033 | 4.00 | +9.1% | 1 | engagement.brace-sparks x7 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 11 | 8973 | 3.67 | — | 1 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 10 | 9550 | 3.33 | +0.0% | 0 | tempo.ghost-strike x33 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 9 | 11567 | 3.00 | -10.0% | 0 | kill-chain.kill-pulse x9 |
| `lineage-axe-empowered` | empowered | 1 | dot | 9 | 11067 | 3.00 | -10.0% | 0 | empowered.weak-point x9 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 10 | 9430 | 3.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 10 | 9730 | 3.33 | -9.1% | 0 | affliction.venom-pips x163 |
| `lineage-dagger-control` | control | 1 | reload | 11 | 8700 | 3.67 | +0.0% | 0 | control.frost-drag x53 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 9 | 10611 | 3.00 | -18.2% | 0 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 11 | 8727 | 3.67 | — | 1 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 18 | 6994 | 6.00 | -5.3% | 0 | affliction.bog-eye x34, technique.cast-flare x48, bulwark.rampart-seal x13, kill-chain.steel-vigil x18, kill-chain.wind-chaser x18 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 17 | 7618 | 5.67 | -10.5% | 0 | affliction.bog-eye x37, bulwark.rampart-seal x11, kill-chain.kill-pulse x17, kill-chain.steel-vigil x17, kill-chain.wind-chaser x17 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 17 | 7571 | 5.67 | -10.5% | 0 | affliction.bog-eye x37, bulwark.rampart-seal x12, empowered.weak-point x9, kill-chain.steel-vigil x17, kill-chain.wind-chaser x17 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 19 | 6489 | 6.33 | — | 0 | affliction.bog-eye x34, bulwark.rampart-seal x11, kill-chain.steel-vigil x19, kill-chain.wind-chaser x19 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 15 | 6853 | 5.00 | -16.7% | 0 | tempo.ghost-strike x61, bulwark.rampart-seal x13, tempo.gale-wake x37, affliction.bog-eye x16, kill-chain.wind-chaser x15 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 18 | 5739 | 6.00 | +0.0% | 0 | affliction.bleed-pips x163, bulwark.rampart-seal x16, tempo.gale-wake x33, affliction.bog-eye x13, kill-chain.wind-chaser x18 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 19 | 5195 | 6.33 | +5.6% | 0 | engagement.opening-flash x20, bulwark.rampart-seal x15, tempo.gale-wake x32, affliction.bog-eye x16, kill-chain.wind-chaser x19 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 18 | 5856 | 6.00 | — | 0 | bulwark.rampart-seal x17, tempo.gale-wake x34, affliction.bog-eye x17, kill-chain.wind-chaser x18 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 15 | 6920 | 5.00 | +0.0% | 0 | bulwark.rampart-seal x9, affliction.bog-eye x21, empowered.plating-crack x16, empowered.quake-ring x16, kill-chain.wind-chaser x15 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 14 | 6093 | 4.67 | -6.7% | 0 | bulwark.rampart-seal x8, affliction.bog-eye x15, control.frost-drag x13, empowered.quake-ring x14, kill-chain.wind-chaser x14 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 16 | 5475 | 5.33 | +6.7% | 0 | engagement.brace-sparks x13, bulwark.rampart-seal x11, affliction.bog-eye x15, empowered.quake-ring x15, kill-chain.wind-chaser x16 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 15 | 6240 | 5.00 | — | 0 | bulwark.rampart-seal x9, affliction.bog-eye x17, empowered.quake-ring x16, kill-chain.wind-chaser x15 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 14 | 7971 | 4.67 | +0.0% | 0 | bulwark.rampart-seal x16, tempo.ghost-strike x45, tempo.ruin-afterimage x45, affliction.bog-eye x25, kill-chain.wind-chaser x14 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 13 | 8546 | 4.33 | -7.1% | 0 | bulwark.rampart-seal x15, tempo.ruin-afterimage x44, affliction.bog-eye x24, kill-chain.kill-pulse x13, kill-chain.wind-chaser x13 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 15 | 7900 | 5.00 | +7.1% | 0 | bulwark.rampart-seal x14, tempo.ruin-afterimage x48, affliction.bog-eye x28, empowered.weak-point x13, kill-chain.wind-chaser x15 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 14 | 7864 | 4.67 | — | 0 | bulwark.rampart-seal x11, tempo.ruin-afterimage x43, affliction.bog-eye x24, kill-chain.wind-chaser x14 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 21 | 6095 | 7.00 | +10.5% | 0 | affliction.venom-pips x240, affliction.bog-eye x34, control.mire-grasp x58, bulwark.rampart-seal x18, kill-chain.wind-chaser x21 |
| `lineage-dagger-control-t2` | control | 2 | reload | 21 | 6381 | 7.00 | +10.5% | 0 | affliction.bog-eye x38, control.frost-drag x80, control.mire-grasp x58, bulwark.rampart-seal x18, kill-chain.wind-chaser x21 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 21 | 6476 | 7.00 | +10.5% | 0 | affliction.bog-eye x36, control.mire-grasp x61, bulwark.rampart-seal x23, kill-chain.wind-chaser x21 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 19 | 6542 | 6.33 | — | 0 | affliction.bog-eye x33, control.mire-grasp x56, bulwark.rampart-seal x17, kill-chain.wind-chaser x19 |

### `node-t2-swamp-06` — Coven 65% / Stalker 35% (swamp T2; shared by 1 authored node)

Dominant family **Coven** drops `control`, punishes `tempo`. Authored Coven 55% / Stalker 30% / Mire 15%; unfieldable at T2: Mire.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 11 | 8764 | 3.67 | +0.0% | 0 | technique.cast-flare x35 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 11 | 8664 | 3.67 | +0.0% | 0 | kill-chain.kill-pulse x11 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 11 | 8964 | 3.67 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 11 | 8764 | 3.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 8 | 14213 | 2.67 | -11.1% | 5 | tempo.ghost-strike x19 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 5 | 22460 | 1.67 | -44.4% | 4 | affliction.bleed-pips x84 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 8 | 12613 | 2.67 | -11.1% | 3 | engagement.opening-flash x5 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 9 | 10722 | 3.00 | — | 3 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 10 | 8760 | 3.33 | -23.1% | 1 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | 1 | cooldown | 10 | 8510 | 3.33 | -23.1% | 1 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 10 | 8450 | 3.33 | -23.1% | 1 | engagement.brace-sparks x9 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 13 | 6169 | 4.33 | — | 1 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 10 | 10440 | 3.33 | +0.0% | 0 | tempo.ghost-strike x37 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 10 | 9970 | 3.33 | +0.0% | 1 | kill-chain.kill-pulse x8 |
| `lineage-axe-empowered` | empowered | 1 | dot | 10 | 10210 | 3.33 | +0.0% | 0 | empowered.weak-point x10 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 10 | 9460 | 3.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 10 | 9170 | 3.33 | +11.1% | 0 | affliction.venom-pips x149 |
| `lineage-dagger-control` | control | 1 | reload | 11 | 8700 | 3.67 | +22.2% | 0 | control.frost-drag x51 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 9 | 11422 | 3.00 | +0.0% | 0 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 9 | 10011 | 3.00 | — | 0 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 18 | 5939 | 6.00 | -5.3% | 0 | technique.cast-flare x44, bulwark.rampart-seal x13, affliction.bog-eye x28, kill-chain.steel-vigil x18, kill-chain.wind-chaser x18 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 17 | 7076 | 5.67 | -10.5% | 0 | bulwark.rampart-seal x15, affliction.bog-eye x33, kill-chain.kill-pulse x17, kill-chain.steel-vigil x17, kill-chain.wind-chaser x17 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 19 | 5942 | 6.33 | +0.0% | 0 | bulwark.rampart-seal x13, affliction.bog-eye x30, kill-chain.steel-vigil x19, kill-chain.wind-chaser x19, empowered.weak-point x8 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 19 | 6216 | 6.33 | — | 0 | bulwark.rampart-seal x14, affliction.bog-eye x31, kill-chain.steel-vigil x19, kill-chain.wind-chaser x19 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 20 | 5270 | 6.67 | +42.9% | 0 | tempo.ghost-strike x60, bulwark.rampart-seal x18, tempo.gale-wake x37, kill-chain.wind-chaser x20, affliction.bog-eye x14 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 16 | 6013 | 5.33 | +14.3% | 0 | affliction.bleed-pips x153, bulwark.rampart-seal x14, tempo.gale-wake x31, kill-chain.wind-chaser x16, affliction.bog-eye x14 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 23 | 4678 | 7.67 | +64.3% | 0 | engagement.opening-flash x23, bulwark.rampart-seal x16, kill-chain.wind-chaser x23, tempo.gale-wake x35, affliction.bog-eye x19 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 14 | 8157 | 4.67 | — | 0 | bulwark.rampart-seal x14, tempo.gale-wake x36, kill-chain.wind-chaser x14, affliction.bog-eye x22 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 14 | 5336 | 4.67 | +0.0% | 0 | bulwark.rampart-seal x9, affliction.bog-eye x12, kill-chain.wind-chaser x14, empowered.plating-crack x16, empowered.quake-ring x16 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 13 | 6569 | 4.33 | -7.1% | 0 | bulwark.rampart-seal x9, affliction.bog-eye x15, control.frost-drag x14, kill-chain.wind-chaser x13, empowered.quake-ring x15 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 14 | 5307 | 4.67 | +0.0% | 0 | engagement.brace-sparks x11, bulwark.rampart-seal x10, affliction.bog-eye x12, kill-chain.wind-chaser x14, empowered.quake-ring x12 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 14 | 5521 | 4.67 | — | 0 | bulwark.rampart-seal x9, affliction.bog-eye x13, kill-chain.wind-chaser x14, empowered.quake-ring x16 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 13 | 8954 | 4.33 | +0.0% | 0 | bulwark.rampart-seal x15, tempo.ghost-strike x47, tempo.ruin-afterimage x47, affliction.bog-eye x25, kill-chain.wind-chaser x13 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 14 | 8421 | 4.67 | +7.7% | 0 | bulwark.rampart-seal x13, tempo.ruin-afterimage x49, affliction.bog-eye x26, kill-chain.kill-pulse x14, kill-chain.wind-chaser x14 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 15 | 7973 | 5.00 | +15.4% | 0 | bulwark.rampart-seal x15, tempo.ruin-afterimage x47, affliction.bog-eye x27, empowered.weak-point x13, kill-chain.wind-chaser x15 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 13 | 9215 | 4.33 | — | 0 | bulwark.rampart-seal x12, tempo.ruin-afterimage x47, affliction.bog-eye x26, kill-chain.wind-chaser x13 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 20 | 6040 | 6.67 | +11.1% | 0 | affliction.venom-pips x223, control.mire-grasp x54, bulwark.rampart-seal x16, kill-chain.wind-chaser x20, affliction.bog-eye x31 |
| `lineage-dagger-control-t2` | control | 2 | reload | 21 | 5690 | 7.00 | +16.7% | 0 | control.frost-drag x75, control.mire-grasp x57, bulwark.rampart-seal x20, kill-chain.wind-chaser x21, affliction.bog-eye x31 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 20 | 6320 | 6.67 | +11.1% | 0 | control.mire-grasp x58, bulwark.rampart-seal x14, affliction.bog-eye x33, kill-chain.wind-chaser x20, kill-chain.spread-arc x1 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 18 | 6717 | 6.00 | — | 0 | control.mire-grasp x53, bulwark.rampart-seal x17, affliction.bog-eye x32, kill-chain.wind-chaser x18 |

### `node-t2-jungle-01` — Ape 78% / Undergrowth 22% (jungle T2; shared by 1 authored node)

Dominant family **Ape** drops `empowered`, punishes `tempo`. Authored Ape 70% / Undergrowth 20% / Stalker 10%; unfieldable at T2: Stalker.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 3 | 50533 | 1.00 | +0.0% | 5 | technique.cast-flare x22 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 4 | 39875 | 1.33 | +33.3% | 4 | kill-chain.kill-pulse x1 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 3 | 50533 | 1.00 | +0.0% | 5 | empowered.weak-point x3 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 3 | 50533 | 1.00 | — | 5 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 3 | 49067 | 1.00 | +0.0% | 4 | tempo.ghost-strike x21 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 3 | 46667 | 1.00 | +0.0% | 4 | affliction.bleed-pips x59 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 3 | 48733 | 1.00 | +0.0% | 4 | engagement.opening-flash x3 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 3 | 48367 | 1.00 | — | 4 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 3 | 49133 | 1.00 | +0.0% | 3 | empowered.plating-crack x8 |
| `lineage-hammer-control` | control | 1 | cooldown | 3 | 49267 | 1.00 | +0.0% | 3 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 3 | 49267 | 1.00 | +0.0% | 3 | engagement.brace-sparks x4 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 3 | 48333 | 1.00 | — | 3 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 3 | 46933 | 1.00 | +0.0% | 3 | tempo.ghost-strike x34 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 5 | 30420 | 1.67 | +66.7% | 4 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | 1 | dot | 4 | 37525 | 1.33 | +33.3% | 5 | empowered.weak-point x5 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 3 | 46933 | 1.00 | — | 3 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 5 | 31120 | 1.67 | +25.0% | 4 | affliction.venom-pips x100 |
| `lineage-dagger-control` | control | 1 | reload | 8 | 17500 | 2.67 | +100.0% | 2 | control.frost-drag x50 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 3 | 53000 | 1.00 | -25.0% | 5 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 4 | 37700 | 1.33 | — | 3 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 8 | 19425 | 2.67 | -11.1% | 2 | technique.cast-flare x35, affliction.bog-eye x23, bulwark.rampart-seal x6, kill-chain.steel-vigil x6, kill-chain.wind-chaser x6 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 9 | 17578 | 3.00 | +0.0% | 1 | affliction.bog-eye x27, bulwark.rampart-seal x5, kill-chain.kill-pulse x7, kill-chain.steel-vigil x7, kill-chain.wind-chaser x7 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 9 | 17044 | 3.00 | +0.0% | 2 | affliction.bog-eye x22, bulwark.rampart-seal x6, empowered.weak-point x6, kill-chain.steel-vigil x6, kill-chain.wind-chaser x6 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 9 | 18222 | 3.00 | — | 1 | affliction.bog-eye x31, bulwark.rampart-seal x4, kill-chain.steel-vigil x7, kill-chain.wind-chaser x7 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 10 | 14620 | 3.33 | +0.0% | 0 | tempo.ghost-strike x91, bulwark.rampart-seal x11, tempo.gale-wake x55, affliction.bog-eye x30, kill-chain.wind-chaser x10 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 11 | 13073 | 3.67 | +10.0% | 0 | affliction.bleed-pips x241, bulwark.rampart-seal x11, tempo.gale-wake x47, affliction.bog-eye x30, kill-chain.wind-chaser x11 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 13 | 10962 | 4.33 | +30.0% | 0 | engagement.opening-flash x14, bulwark.rampart-seal x11, tempo.gale-wake x47, affliction.bog-eye x33, kill-chain.wind-chaser x13 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 10 | 14890 | 3.33 | — | 2 | bulwark.rampart-seal x5, tempo.gale-wake x24, affliction.bog-eye x17, kill-chain.wind-chaser x5 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 9 | 15511 | 3.00 | +12.5% | 0 | bulwark.rampart-seal x10, affliction.bog-eye x31, empowered.plating-crack x17, empowered.quake-ring x17, kill-chain.wind-chaser x9 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 9 | 15522 | 3.00 | +12.5% | 0 | bulwark.rampart-seal x10, affliction.bog-eye x30, control.frost-drag x20, empowered.quake-ring x17, kill-chain.wind-chaser x9 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 9 | 15600 | 3.00 | +12.5% | 0 | engagement.brace-sparks x7, bulwark.rampart-seal x10, affliction.bog-eye x31, empowered.quake-ring x17, kill-chain.wind-chaser x9 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 8 | 17863 | 2.67 | — | 0 | bulwark.rampart-seal x8, affliction.bog-eye x34, empowered.quake-ring x16, kill-chain.wind-chaser x8 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 9 | 16767 | 3.00 | +12.5% | 0 | tempo.ghost-strike x62, tempo.ruin-afterimage x62, bulwark.rampart-seal x10, affliction.bog-eye x36, kill-chain.wind-chaser x9 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 6 | 24667 | 2.00 | -25.0% | 2 | bulwark.rampart-seal x5, tempo.ruin-afterimage x35, affliction.bog-eye x20, kill-chain.kill-pulse x3, kill-chain.wind-chaser x3 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 9 | 16978 | 3.00 | +12.5% | 0 | tempo.ruin-afterimage x64, bulwark.rampart-seal x6, affliction.bog-eye x36, empowered.weak-point x11, kill-chain.wind-chaser x9 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 8 | 20525 | 2.67 | — | 1 | tempo.ruin-afterimage x67, bulwark.rampart-seal x10, affliction.bog-eye x39, kill-chain.wind-chaser x8 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 12 | 13675 | 4.00 | +9.1% | 0 | affliction.venom-pips x290, control.mire-grasp x71, affliction.bog-eye x38, kill-chain.wind-chaser x12, bulwark.rampart-seal x6 |
| `lineage-dagger-control-t2` | control | 2 | reload | 13 | 12462 | 4.33 | +18.2% | 0 | control.frost-drag x98, control.mire-grasp x72, affliction.bog-eye x36, kill-chain.wind-chaser x13, bulwark.rampart-seal x3 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 11 | 15255 | 3.67 | +0.0% | 0 | control.mire-grasp x75, affliction.bog-eye x36, kill-chain.wind-chaser x11, bulwark.rampart-seal x5, kill-chain.spread-arc x3 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 11 | 15373 | 3.67 | — | 0 | control.mire-grasp x78, affliction.bog-eye x36, kill-chain.wind-chaser x11, bulwark.rampart-seal x6 |
| `frame-cadence-light` | _frame light_ | 1 | cadence | 3 | 47267 | 1.00 | — | 3 | — |
| `frame-cadence-balanced` | _frame balanced_ | 1 | cadence | 3 | 48367 | 1.00 | — | 4 | — |
| `frame-cadence-heavy` | _frame heavy_ | 1 | cadence | 5 | 27960 | 1.67 | — | 1 | — |
| `frame-cooldown-light` | _frame light_ | 1 | cooldown | 2 | 78200 | 0.67 | — | 2 | — |
| `frame-cooldown-balanced` | _frame balanced_ | 1 | cooldown | 3 | 45700 | 1.00 | — | 2 | — |
| `frame-cooldown-heavy` | _frame heavy_ | 1 | cooldown | 3 | 48333 | 1.00 | — | 3 | — |
| `frame-reload-light` | _frame light_ | 1 | reload | 6 | 20983 | 2.00 | — | 1 | — |
| `frame-reload-balanced` | _frame balanced_ | 1 | reload | 3 | 55467 | 1.00 | — | 5 | — |
| `frame-reload-heavy` | _frame heavy_ | 1 | reload | 4 | 37700 | 1.33 | — | 3 | — |
| `frame-energy-light` | _frame light_ | 1 | energy | 1 | 170700 | 0.33 | — | 6 | — |
| `frame-energy-balanced` | _frame balanced_ | 1 | energy | 1 | 176400 | 0.33 | — | 6 | — |
| `frame-energy-heavy` | _frame heavy_ | 1 | energy | 3 | 50533 | 1.00 | — | 5 | — |
| `frame-dot-light` | _frame light_ | 1 | dot | 1 | 165400 | 0.33 | — | 5 | — |
| `frame-dot-balanced` | _frame balanced_ | 1 | dot | 3 | 46933 | 1.00 | — | 3 | — |
| `frame-dot-heavy` | _frame heavy_ | 1 | dot | 4 | 34225 | 1.33 | — | 2 | — |
| `frame-summoner-light` | _frame light_ | 1 | summoner | 1 | 65300 | 0.33 | — | 3 | — |
| `frame-summoner-balanced` | _frame balanced_ | 1 | summoner | 4 | 0 | 1.33 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | 1 | summoner | 9 | 15289 | 3.00 | — | 0 | — |
| `frame-cadence-light-t2` | _frame light_ | 2 | cadence | 9 | 17678 | 3.00 | — | 1 | bulwark.rampart-seal x7, tempo.gale-wake x41, affliction.bog-eye x22, kill-chain.wind-chaser x6 |
| `frame-cadence-balanced-t2` | _frame balanced_ | 2 | cadence | 10 | 14890 | 3.33 | — | 2 | bulwark.rampart-seal x5, tempo.gale-wake x24, affliction.bog-eye x17, kill-chain.wind-chaser x5 |
| `frame-cadence-heavy-t2` | _frame heavy_ | 2 | cadence | 10 | 15320 | 3.33 | — | 0 | bulwark.rampart-seal x9, affliction.bog-eye x34, tempo.gale-wake x35, kill-chain.wind-chaser x10 |
| `frame-cooldown-light-t2` | _frame light_ | 2 | cooldown | 7 | 21857 | 2.33 | — | 0 | bulwark.rampart-seal x8, affliction.bog-eye x35, empowered.quake-ring x29, kill-chain.wind-chaser x7 |
| `frame-cooldown-balanced-t2` | _frame balanced_ | 2 | cooldown | 6 | 27033 | 2.00 | — | 1 | bulwark.rampart-seal x5, affliction.bog-eye x25, empowered.quake-ring x12, kill-chain.wind-chaser x4 |
| `frame-cooldown-heavy-t2` | _frame heavy_ | 2 | cooldown | 8 | 17863 | 2.67 | — | 0 | bulwark.rampart-seal x8, affliction.bog-eye x34, empowered.quake-ring x16, kill-chain.wind-chaser x8 |
| `frame-reload-light-t2` | _frame light_ | 2 | reload | 9 | 18933 | 3.00 | — | 0 | control.mire-grasp x89, affliction.bog-eye x40, bulwark.rampart-seal x5, kill-chain.wind-chaser x9 |
| `frame-reload-balanced-t2` | _frame balanced_ | 2 | reload | 10 | 16760 | 3.33 | — | 0 | control.mire-grasp x87, affliction.bog-eye x40, kill-chain.wind-chaser x10, bulwark.rampart-seal x4 |
| `frame-reload-heavy-t2` | _frame heavy_ | 2 | reload | 11 | 15373 | 3.67 | — | 0 | control.mire-grasp x78, affliction.bog-eye x36, kill-chain.wind-chaser x11, bulwark.rampart-seal x6 |
| `frame-energy-light-t2` | _frame light_ | 2 | energy | 6 | 26583 | 2.00 | — | 2 | affliction.bog-eye x25, bulwark.rampart-seal x5, kill-chain.steel-vigil x5, kill-chain.wind-chaser x5 |
| `frame-energy-balanced-t2` | _frame balanced_ | 2 | energy | 6 | 26733 | 2.00 | — | 3 | affliction.bog-eye x23, bulwark.rampart-seal x4, kill-chain.steel-vigil x4, kill-chain.wind-chaser x4 |
| `frame-energy-heavy-t2` | _frame heavy_ | 2 | energy | 9 | 18222 | 3.00 | — | 1 | affliction.bog-eye x31, bulwark.rampart-seal x4, kill-chain.steel-vigil x7, kill-chain.wind-chaser x7 |
| `frame-dot-light-t2` | _frame light_ | 2 | dot | 5 | 32560 | 1.67 | — | 5 | bulwark.rampart-seal x8, tempo.ruin-afterimage x38, affliction.bog-eye x21, kill-chain.wind-chaser x5 |
| `frame-dot-balanced-t2` | _frame balanced_ | 2 | dot | 8 | 20525 | 2.67 | — | 1 | tempo.ruin-afterimage x67, bulwark.rampart-seal x10, affliction.bog-eye x39, kill-chain.wind-chaser x8 |
| `frame-dot-heavy-t2` | _frame heavy_ | 2 | dot | 7 | 22829 | 2.33 | — | 3 | tempo.ruin-afterimage x41, bulwark.rampart-seal x6, affliction.bog-eye x29, kill-chain.wind-chaser x6 |
| `frame-summoner-light-t2` | _frame light_ | 2 | summoner | 2 | 61800 | 0.67 | — | 2 | tempo.ruin-afterimage x199, bulwark.rampart-seal x1, kill-chain.wind-chaser x1 |
| `frame-summoner-balanced-t2` | _frame balanced_ | 2 | summoner | 6 | 17167 | 2.00 | — | 1 | tempo.ruin-afterimage x172, kill-chain.wind-chaser x4 |
| `frame-summoner-heavy-t2` | _frame heavy_ | 2 | summoner | 18 | 8017 | 6.00 | — | 0 | tempo.ruin-afterimage x99, kill-chain.wind-chaser x18, bulwark.rampart-seal x2 |

### `node-t2-jungle-02` — Undergrowth 88% / Ape 13% (jungle T2; shared by 1 authored node)

Dominant family **Undergrowth** drops `affliction`, punishes `control`. Authored Undergrowth 70% / Stalker 20% / Ape 10%; unfieldable at T2: Stalker.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 8 | 17750 | 2.67 | +0.0% | 7 | technique.cast-flare x18 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 8 | 17950 | 2.67 | +0.0% | 7 | kill-chain.kill-pulse x1 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 7 | 20214 | 2.33 | -12.5% | 7 | empowered.weak-point x2 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 8 | 17750 | 2.67 | — | 7 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 11 | 8909 | 3.67 | +57.1% | 1 | tempo.ghost-strike x27 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 7 | 13171 | 2.33 | +0.0% | 1 | affliction.bleed-pips x76 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 7 | 14300 | 2.33 | +0.0% | 1 | engagement.opening-flash x6 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 7 | 12886 | 2.33 | — | 1 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 6 | 17717 | 2.00 | -14.3% | 1 | empowered.plating-crack x8 |
| `lineage-hammer-control` | control | 1 | cooldown | 6 | 17717 | 2.00 | -14.3% | 1 | control.frost-drag x8 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 6 | 17400 | 2.00 | -14.3% | 1 | engagement.brace-sparks x5 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 7 | 14471 | 2.33 | — | 1 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 8 | 15238 | 2.67 | +0.0% | 4 | tempo.ghost-strike x23 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 7 | 16929 | 2.33 | -12.5% | 4 | kill-chain.kill-pulse x4 |
| `lineage-axe-empowered` | empowered | 1 | dot | 8 | 14075 | 2.67 | +0.0% | 3 | empowered.weak-point x4 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 8 | 15238 | 2.67 | — | 4 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 9 | 14244 | 3.00 | +50.0% | 4 | affliction.venom-pips x86 |
| `lineage-dagger-control` | control | 1 | reload | 7 | 19714 | 2.33 | +16.7% | 5 | control.frost-drag x27 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 6 | 20383 | 2.00 | +0.0% | 4 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 6 | 20233 | 2.00 | — | 4 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 14 | 8686 | 4.67 | +0.0% | 0 | technique.cast-flare x48, affliction.bog-eye x28, kill-chain.steel-vigil x14, kill-chain.wind-chaser x14, bulwark.rampart-seal x11 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 14 | 8793 | 4.67 | +0.0% | 0 | affliction.bog-eye x29, kill-chain.kill-pulse x14, kill-chain.steel-vigil x14, kill-chain.wind-chaser x14, bulwark.rampart-seal x11 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 13 | 8377 | 4.33 | -7.1% | 0 | affliction.bog-eye x24, empowered.weak-point x7, kill-chain.steel-vigil x13, kill-chain.wind-chaser x13, bulwark.rampart-seal x10 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 14 | 8586 | 4.67 | — | 0 | affliction.bog-eye x27, kill-chain.steel-vigil x14, kill-chain.wind-chaser x14, bulwark.rampart-seal x12 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 14 | 7743 | 4.67 | +7.7% | 0 | tempo.ghost-strike x62, bulwark.rampart-seal x15, tempo.gale-wake x37, affliction.bog-eye x21, kill-chain.wind-chaser x14 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 15 | 6840 | 5.00 | +15.4% | 0 | affliction.bleed-pips x162, bulwark.rampart-seal x15, tempo.gale-wake x32, affliction.bog-eye x20, kill-chain.wind-chaser x15 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 17 | 5824 | 5.67 | +30.8% | 0 | engagement.opening-flash x18, bulwark.rampart-seal x18, tempo.gale-wake x31, affliction.bog-eye x19, kill-chain.wind-chaser x17 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 13 | 9008 | 4.33 | — | 1 | bulwark.rampart-seal x9, tempo.gale-wake x25, affliction.bog-eye x16, kill-chain.wind-chaser x9 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 13 | 8392 | 4.33 | +18.2% | 0 | bulwark.rampart-seal x13, affliction.bog-eye x18, empowered.plating-crack x17, empowered.quake-ring x17, kill-chain.wind-chaser x13 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 12 | 8825 | 4.00 | +9.1% | 0 | bulwark.rampart-seal x13, affliction.bog-eye x21, control.frost-drag x15, empowered.quake-ring x17, kill-chain.wind-chaser x12 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 13 | 8369 | 4.33 | +18.2% | 0 | engagement.brace-sparks x11, bulwark.rampart-seal x14, affliction.bog-eye x21, empowered.quake-ring x17, kill-chain.wind-chaser x13 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 11 | 10536 | 3.67 | — | 0 | bulwark.rampart-seal x12, affliction.bog-eye x24, empowered.quake-ring x15, kill-chain.wind-chaser x11 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 10 | 11460 | 3.33 | -23.1% | 0 | tempo.ghost-strike x46, tempo.ruin-afterimage x46, bulwark.rampart-seal x12, affliction.bog-eye x25, kill-chain.wind-chaser x10 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 12 | 9558 | 4.00 | -7.7% | 0 | bulwark.rampart-seal x11, tempo.ruin-afterimage x47, affliction.bog-eye x26, kill-chain.kill-pulse x12, kill-chain.wind-chaser x12 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 10 | 10860 | 3.33 | -23.1% | 0 | tempo.ruin-afterimage x44, bulwark.rampart-seal x12, affliction.bog-eye x21, empowered.weak-point x11, kill-chain.wind-chaser x10 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 13 | 9123 | 4.33 | — | 1 | tempo.ruin-afterimage x48, bulwark.rampart-seal x11, affliction.bog-eye x27, kill-chain.wind-chaser x13 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 17 | 8812 | 5.67 | +6.3% | 0 | affliction.venom-pips x268, control.mire-grasp x63, affliction.bog-eye x37, kill-chain.wind-chaser x17, bulwark.rampart-seal x12 |
| `lineage-dagger-control-t2` | control | 2 | reload | 17 | 8141 | 5.67 | +6.3% | 0 | control.frost-drag x81, control.mire-grasp x58, affliction.bog-eye x31, kill-chain.wind-chaser x17, bulwark.rampart-seal x13 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 16 | 9169 | 5.33 | +0.0% | 0 | control.mire-grasp x64, affliction.bog-eye x31, kill-chain.wind-chaser x16, bulwark.rampart-seal x13 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 16 | 8981 | 5.33 | — | 0 | control.mire-grasp x62, affliction.bog-eye x31, kill-chain.wind-chaser x16, bulwark.rampart-seal x13 |

### `node-t2-jungle-03` — Ape 67% / Undergrowth 33% (jungle T2; shared by 1 authored node)

Dominant family **Ape** drops `empowered`, punishes `tempo`. Authored Stalker 70% / Ape 20% / Undergrowth 10%; unfieldable at T2: Stalker.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 5 | 29560 | 1.67 | +0.0% | 3 | technique.cast-flare x27 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 2 | 82550 | 0.67 | -60.0% | 5 | kill-chain.kill-pulse x1 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 3 | 51700 | 1.00 | -40.0% | 5 | empowered.weak-point x4 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 5 | 29560 | 1.67 | — | 3 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 5 | 26660 | 1.67 | +25.0% | 0 | tempo.ghost-strike x73 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 4 | 32150 | 1.33 | +0.0% | 1 | affliction.bleed-pips x174 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 5 | 25660 | 1.67 | +25.0% | 0 | engagement.opening-flash x6 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 4 | 32950 | 1.33 | — | 1 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 4 | 32275 | 1.33 | +33.3% | 1 | empowered.plating-crack x12 |
| `lineage-hammer-control` | control | 1 | cooldown | 4 | 34150 | 1.33 | +33.3% | 0 | control.frost-drag x19 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 4 | 33100 | 1.33 | +33.3% | 1 | engagement.brace-sparks x6 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 3 | 47167 | 1.00 | — | 1 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 3 | 50400 | 1.00 | +0.0% | 4 | tempo.ghost-strike x15 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 3 | 50667 | 1.00 | +0.0% | 4 | kill-chain.kill-pulse x2 |
| `lineage-axe-empowered` | empowered | 1 | dot | 3 | 50367 | 1.00 | +0.0% | 4 | empowered.weak-point x4 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 3 | 50400 | 1.00 | — | 4 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 6 | 18400 | 2.00 | +50.0% | 0 | affliction.venom-pips x184 |
| `lineage-dagger-control` | control | 1 | reload | 6 | 23383 | 2.00 | +50.0% | 1 | control.frost-drag x64 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 4 | 35075 | 1.33 | +0.0% | 3 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 4 | 38150 | 1.33 | — | 7 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 10 | 17000 | 3.33 | +25.0% | 0 | technique.cast-flare x58, affliction.bog-eye x43, kill-chain.steel-vigil x10, kill-chain.wind-chaser x10, bulwark.rampart-seal x4 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 9 | 16733 | 3.00 | +12.5% | 1 | affliction.bog-eye x23, kill-chain.kill-pulse x7, kill-chain.steel-vigil x7, kill-chain.wind-chaser x7, bulwark.rampart-seal x5 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 9 | 17433 | 3.00 | +12.5% | 1 | affliction.bog-eye x26, kill-chain.steel-vigil x6, kill-chain.wind-chaser x6, empowered.weak-point x7, bulwark.rampart-seal x4 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 8 | 20163 | 2.67 | — | 0 | affliction.bog-eye x37, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8, bulwark.rampart-seal x2 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 10 | 15520 | 3.33 | +11.1% | 0 | tempo.ghost-strike x97, bulwark.rampart-seal x10, tempo.gale-wake x58, affliction.bog-eye x33, kill-chain.wind-chaser x10 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 11 | 13855 | 3.67 | +22.2% | 1 | affliction.bleed-pips x190, bulwark.rampart-seal x8, tempo.gale-wake x37, affliction.bog-eye x24, kill-chain.wind-chaser x8 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 12 | 12558 | 4.00 | +33.3% | 0 | engagement.opening-flash x14, bulwark.rampart-seal x13, tempo.gale-wake x50, affliction.bog-eye x36, kill-chain.wind-chaser x12 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 9 | 17700 | 3.00 | — | 0 | bulwark.rampart-seal x10, tempo.gale-wake x52, affliction.bog-eye x37, kill-chain.wind-chaser x9 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 9 | 16111 | 3.00 | +12.5% | 0 | bulwark.rampart-seal x11, affliction.bog-eye x28, empowered.plating-crack x18, empowered.quake-ring x18, kill-chain.wind-chaser x9 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 9 | 17133 | 3.00 | +12.5% | 0 | bulwark.rampart-seal x10, affliction.bog-eye x32, control.frost-drag x21, empowered.quake-ring x18, kill-chain.wind-chaser x9 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 9 | 17144 | 3.00 | +12.5% | 0 | engagement.brace-sparks x5, bulwark.rampart-seal x10, affliction.bog-eye x32, empowered.quake-ring x18, kill-chain.wind-chaser x9 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 8 | 18863 | 2.67 | — | 0 | bulwark.rampart-seal x10, affliction.bog-eye x32, empowered.quake-ring x17, kill-chain.wind-chaser x8 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 8 | 19738 | 2.67 | +0.0% | 1 | tempo.ghost-strike x65, tempo.ruin-afterimage x65, affliction.bog-eye x38, kill-chain.wind-chaser x8, bulwark.rampart-seal x9 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 11 | 13182 | 3.67 | +37.5% | 0 | tempo.ruin-afterimage x60, affliction.bog-eye x32, kill-chain.kill-pulse x11, kill-chain.wind-chaser x11, bulwark.rampart-seal x12 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 10 | 13960 | 3.33 | +25.0% | 1 | tempo.ruin-afterimage x54, affliction.bog-eye x32, empowered.weak-point x10, kill-chain.wind-chaser x9, bulwark.rampart-seal x8 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 8 | 19413 | 2.67 | — | 0 | tempo.ruin-afterimage x64, affliction.bog-eye x38, kill-chain.wind-chaser x8, bulwark.rampart-seal x9 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 11 | 15427 | 3.67 | +10.0% | 0 | affliction.venom-pips x306, control.mire-grasp x75, affliction.bog-eye x41, kill-chain.wind-chaser x11, bulwark.rampart-seal x3 |
| `lineage-dagger-control-t2` | control | 2 | reload | 13 | 12492 | 4.33 | +30.0% | 0 | control.frost-drag x97, control.mire-grasp x73, affliction.bog-eye x39, kill-chain.wind-chaser x13, bulwark.rampart-seal x7 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 8 | 21788 | 2.67 | -20.0% | 2 | control.mire-grasp x58, affliction.bog-eye x31, kill-chain.wind-chaser x7, bulwark.rampart-seal x5, kill-chain.spread-arc x3 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 10 | 17320 | 3.33 | — | 0 | control.mire-grasp x79, affliction.bog-eye x42, kill-chain.wind-chaser x10, bulwark.rampart-seal x3 |

### `node-t2-jungle-04` — Ape 50% / Undergrowth 50% (jungle T2; shared by 2 authored nodes)

Dominant family **Ape** drops `empowered`, punishes `tempo`. Authored Ape 45% / Undergrowth 45% / Stalker 10%; unfieldable at T2: Stalker.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 4 | 39675 | 1.33 | +0.0% | 4 | technique.cast-flare x18 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 5 | 31260 | 1.67 | +25.0% | 5 | — |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 5 | 31660 | 1.67 | +25.0% | 4 | empowered.weak-point x2 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 4 | 39675 | 1.33 | — | 4 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 9 | 12967 | 3.00 | +80.0% | 0 | tempo.ghost-strike x63 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 5 | 23900 | 1.67 | +0.0% | 0 | affliction.bleed-pips x168 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 6 | 19950 | 2.00 | +20.0% | 0 | engagement.opening-flash x6 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 5 | 24100 | 1.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 4 | 34800 | 1.33 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | 1 | cooldown | 4 | 34750 | 1.33 | +0.0% | 0 | control.frost-drag x18 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 4 | 34750 | 1.33 | +0.0% | 0 | engagement.brace-sparks x6 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 4 | 35075 | 1.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 5 | 26400 | 1.67 | +0.0% | 3 | tempo.ghost-strike x34 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 6 | 23033 | 2.00 | +20.0% | 6 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | 1 | dot | 4 | 34925 | 1.33 | -20.0% | 4 | empowered.weak-point x5 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 5 | 26400 | 1.67 | — | 3 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 5 | 28020 | 1.67 | -16.7% | 2 | affliction.venom-pips x138 |
| `lineage-dagger-control` | control | 1 | reload | 7 | 16971 | 2.33 | +16.7% | 2 | control.frost-drag x49 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 5 | 29200 | 1.67 | -16.7% | 7 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 6 | 20150 | 2.00 | — | 0 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 9 | 16511 | 3.00 | +0.0% | 1 | technique.cast-flare x38, bulwark.rampart-seal x5, affliction.bog-eye x25, kill-chain.steel-vigil x7, kill-chain.wind-chaser x7 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 9 | 16156 | 3.00 | +0.0% | 0 | bulwark.rampart-seal x6, affliction.bog-eye x34, kill-chain.kill-pulse x9, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 11 | 13991 | 3.67 | +22.2% | 1 | bulwark.rampart-seal x5, affliction.bog-eye x27, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8, empowered.weak-point x7 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 9 | 16433 | 3.00 | — | 0 | bulwark.rampart-seal x6, affliction.bog-eye x35, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 11 | 13118 | 3.67 | +0.0% | 0 | tempo.ghost-strike x90, bulwark.rampart-seal x12, tempo.gale-wake x53, affliction.bog-eye x30, kill-chain.wind-chaser x11 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 12 | 11100 | 4.00 | +9.1% | 0 | affliction.bleed-pips x219, bulwark.rampart-seal x12, tempo.gale-wake x43, affliction.bog-eye x26, kill-chain.wind-chaser x12 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 14 | 9621 | 4.67 | +27.3% | 0 | engagement.opening-flash x15, bulwark.rampart-seal x14, tempo.gale-wake x43, affliction.bog-eye x30, kill-chain.wind-chaser x14 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 11 | 13645 | 3.67 | — | 1 | bulwark.rampart-seal x10, tempo.gale-wake x42, affliction.bog-eye x32, kill-chain.wind-chaser x10 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 9 | 15856 | 3.00 | +12.5% | 0 | bulwark.rampart-seal x11, affliction.bog-eye x29, empowered.plating-crack x18, empowered.quake-ring x18, kill-chain.wind-chaser x9 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 10 | 13560 | 3.33 | +25.0% | 0 | bulwark.rampart-seal x11, affliction.bog-eye x28, control.frost-drag x20, empowered.quake-ring x18, kill-chain.wind-chaser x10 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 10 | 13600 | 3.33 | +25.0% | 0 | engagement.brace-sparks x7, bulwark.rampart-seal x11, affliction.bog-eye x28, empowered.quake-ring x18, kill-chain.wind-chaser x10 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 8 | 18513 | 2.67 | — | 0 | bulwark.rampart-seal x10, affliction.bog-eye x33, empowered.quake-ring x18, kill-chain.wind-chaser x8 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 8 | 18850 | 2.67 | +0.0% | 0 | bulwark.rampart-seal x10, tempo.ghost-strike x63, tempo.ruin-afterimage x63, affliction.bog-eye x35, kill-chain.wind-chaser x8 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 8 | 17950 | 2.67 | +0.0% | 0 | bulwark.rampart-seal x15, tempo.ruin-afterimage x60, affliction.bog-eye x31, kill-chain.kill-pulse x8, kill-chain.wind-chaser x8 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 9 | 17189 | 3.00 | +12.5% | 1 | bulwark.rampart-seal x10, tempo.ruin-afterimage x53, affliction.bog-eye x30, empowered.weak-point x9, kill-chain.wind-chaser x8 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 8 | 18950 | 2.67 | — | 0 | bulwark.rampart-seal x10, tempo.ruin-afterimage x63, affliction.bog-eye x35, kill-chain.wind-chaser x8 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 12 | 13775 | 4.00 | +9.1% | 0 | affliction.venom-pips x295, control.mire-grasp x75, bulwark.rampart-seal x6, affliction.bog-eye x40, kill-chain.wind-chaser x12 |
| `lineage-dagger-control-t2` | control | 2 | reload | 11 | 13636 | 3.67 | +0.0% | 1 | control.frost-drag x68, control.mire-grasp x51, bulwark.rampart-seal x4, affliction.bog-eye x27, kill-chain.wind-chaser x8 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 10 | 16160 | 3.33 | -9.1% | 0 | control.mire-grasp x73, bulwark.rampart-seal x6, affliction.bog-eye x37, kill-chain.wind-chaser x10, kill-chain.spread-arc x3 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 11 | 14164 | 3.67 | — | 1 | control.mire-grasp x51, bulwark.rampart-seal x5, affliction.bog-eye x27, kill-chain.wind-chaser x9 |

### `node-t2-desert-01` — Basilisk 70% / Scorpion 30% (desert T2; shared by 1 authored node)

Dominant family **Basilisk** drops `empowered`, punishes `tempo`. Authored Basilisk 70% / Scorpion 30%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 4 | 41525 | 1.33 | +0.0% | 0 | technique.cast-flare x52 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 4 | 43075 | 1.33 | +0.0% | 1 | kill-chain.kill-pulse x4 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 4 | 41575 | 1.33 | +0.0% | 0 | empowered.weak-point x9 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 4 | 41525 | 1.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 0 | — | 0.00 | — | 13 | tempo.ghost-strike x12 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 0 | — | 0.00 | — | 13 | affliction.bleed-pips x31 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 0 | — | 0.00 | — | 13 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 0 | — | 0.00 | — | 13 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 0 | — | 0.00 | — | 8 | empowered.plating-crack x3 |
| `lineage-hammer-control` | control | 1 | cooldown | 2 | 73700 | 0.67 | — | 7 | control.frost-drag x5 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 2 | 75200 | 0.67 | — | 8 | engagement.brace-sparks x2 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 0 | — | 0.00 | — | 8 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 2 | 81600 | 0.67 | +0.0% | 2 | tempo.ghost-strike x41 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 3 | 58733 | 1.00 | +50.0% | 2 | kill-chain.kill-pulse x3 |
| `lineage-axe-empowered` | empowered | 1 | dot | 3 | 55100 | 1.00 | +50.0% | 1 | empowered.weak-point x4 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 2 | 85600 | 0.67 | — | 2 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 4 | 42425 | 1.33 | -20.0% | 2 | affliction.venom-pips x194 |
| `lineage-dagger-control` | control | 1 | reload | 4 | 39500 | 1.33 | -20.0% | 2 | control.frost-drag x60 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 5 | 33300 | 1.67 | +0.0% | 1 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 5 | 33460 | 1.67 | — | 2 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 8 | 19325 | 2.67 | +0.0% | 0 | technique.cast-flare x49, affliction.bog-eye x32, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8, bulwark.rampart-seal x2 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 8 | 19338 | 2.67 | +0.0% | 0 | affliction.bog-eye x36, kill-chain.kill-pulse x8, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8, bulwark.rampart-seal x4 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 9 | 17700 | 3.00 | +12.5% | 0 | affliction.bog-eye x35, empowered.weak-point x9, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9, bulwark.rampart-seal x2 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 8 | 20400 | 2.67 | — | 0 | affliction.bog-eye x36, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8, bulwark.rampart-seal x3 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 11 | 11764 | 3.67 | +37.5% | 0 | tempo.ghost-strike x81, bulwark.rampart-seal x12, tempo.gale-wake x48, affliction.bog-eye x29, kill-chain.wind-chaser x11 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 11 | 11655 | 3.67 | +37.5% | 0 | affliction.bleed-pips x211, bulwark.rampart-seal x11, tempo.gale-wake x42, affliction.bog-eye x27, kill-chain.wind-chaser x11 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 12 | 9167 | 4.00 | +50.0% | 0 | engagement.opening-flash x10, bulwark.rampart-seal x11, tempo.gale-wake x35, affliction.bog-eye x24, kill-chain.wind-chaser x12 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 8 | 15850 | 2.67 | — | 0 | bulwark.rampart-seal x10, tempo.gale-wake x40, affliction.bog-eye x29, kill-chain.wind-chaser x8 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 9 | 15133 | 3.00 | +12.5% | 0 | bulwark.rampart-seal x9, affliction.bog-eye x32, empowered.plating-crack x16, empowered.quake-ring x16, kill-chain.wind-chaser x9 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 9 | 14933 | 3.00 | +12.5% | 0 | bulwark.rampart-seal x9, affliction.bog-eye x29, control.frost-drag x18, empowered.quake-ring x17, kill-chain.wind-chaser x9 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 8 | 17363 | 2.67 | +0.0% | 0 | engagement.brace-sparks x6, bulwark.rampart-seal x10, affliction.bog-eye x30, empowered.quake-ring x16, kill-chain.wind-chaser x8 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 8 | 17538 | 2.67 | — | 0 | bulwark.rampart-seal x9, affliction.bog-eye x31, empowered.quake-ring x17, kill-chain.wind-chaser x8 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 7 | 22000 | 2.33 | +0.0% | 0 | bulwark.rampart-seal x14, tempo.ghost-strike x59, tempo.ruin-afterimage x59, affliction.bog-eye x33, kill-chain.wind-chaser x7 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 6 | 27383 | 2.00 | -14.3% | 0 | bulwark.rampart-seal x18, tempo.ruin-afterimage x64, affliction.bog-eye x36, kill-chain.kill-pulse x6, kill-chain.wind-chaser x6 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 10 | 16160 | 3.33 | +42.9% | 0 | bulwark.rampart-seal x19, tempo.ruin-afterimage x62, affliction.bog-eye x35, empowered.weak-point x10, kill-chain.wind-chaser x10 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 7 | 21886 | 2.33 | — | 0 | bulwark.rampart-seal x14, tempo.ruin-afterimage x59, affliction.bog-eye x31, kill-chain.wind-chaser x7 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 9 | 19100 | 3.00 | -10.0% | 0 | affliction.venom-pips x300, control.mire-grasp x72, affliction.bog-eye x39, kill-chain.wind-chaser x9, bulwark.rampart-seal x3 |
| `lineage-dagger-control-t2` | control | 2 | reload | 11 | 15036 | 3.67 | +10.0% | 0 | control.frost-drag x95, control.mire-grasp x68, affliction.bog-eye x36, kill-chain.wind-chaser x11, bulwark.rampart-seal x6 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 10 | 16810 | 3.33 | +0.0% | 0 | control.mire-grasp x70, bulwark.rampart-seal x9, affliction.bog-eye x39, kill-chain.wind-chaser x10 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 10 | 16790 | 3.33 | — | 0 | control.mire-grasp x70, affliction.bog-eye x38, kill-chain.wind-chaser x10, bulwark.rampart-seal x7 |
| `frame-cadence-light` | _frame light_ | 1 | cadence | 0 | — | 0.00 | — | 12 | — |
| `frame-cadence-balanced` | _frame balanced_ | 1 | cadence | 0 | — | 0.00 | — | 13 | — |
| `frame-cadence-heavy` | _frame heavy_ | 1 | cadence | 0 | — | 0.00 | — | 8 | — |
| `frame-cooldown-light` | _frame light_ | 1 | cooldown | 0 | — | 0.00 | — | 11 | — |
| `frame-cooldown-balanced` | _frame balanced_ | 1 | cooldown | 0 | — | 0.00 | — | 8 | — |
| `frame-cooldown-heavy` | _frame heavy_ | 1 | cooldown | 0 | — | 0.00 | — | 8 | — |
| `frame-reload-light` | _frame light_ | 1 | reload | 5 | 33860 | 1.67 | — | 1 | — |
| `frame-reload-balanced` | _frame balanced_ | 1 | reload | 4 | 40600 | 1.33 | — | 1 | — |
| `frame-reload-heavy` | _frame heavy_ | 1 | reload | 5 | 33460 | 1.67 | — | 2 | — |
| `frame-energy-light` | _frame light_ | 1 | energy | 3 | 55600 | 1.00 | — | 0 | — |
| `frame-energy-balanced` | _frame balanced_ | 1 | energy | 2 | 87000 | 0.67 | — | 1 | — |
| `frame-energy-heavy` | _frame heavy_ | 1 | energy | 4 | 41525 | 1.33 | — | 0 | — |
| `frame-dot-light` | _frame light_ | 1 | dot | 2 | 84650 | 0.67 | — | 2 | — |
| `frame-dot-balanced` | _frame balanced_ | 1 | dot | 2 | 85600 | 0.67 | — | 2 | — |
| `frame-dot-heavy` | _frame heavy_ | 1 | dot | 4 | 44075 | 1.33 | — | 2 | — |
| `frame-summoner-light` | _frame light_ | 1 | summoner | 3 | 48967 | 1.00 | — | 0 | — |
| `frame-summoner-balanced` | _frame balanced_ | 1 | summoner | 3 | 44800 | 1.00 | — | 0 | — |
| `frame-summoner-heavy` | _frame heavy_ | 1 | summoner | 4 | 23550 | 1.33 | — | 0 | — |
| `frame-cadence-light-t2` | _frame light_ | 2 | cadence | 8 | 16363 | 2.67 | — | 0 | bulwark.rampart-seal x10, tempo.gale-wake x52, affliction.bog-eye x29, kill-chain.wind-chaser x8 |
| `frame-cadence-balanced-t2` | _frame balanced_ | 2 | cadence | 8 | 15850 | 2.67 | — | 0 | bulwark.rampart-seal x10, tempo.gale-wake x40, affliction.bog-eye x29, kill-chain.wind-chaser x8 |
| `frame-cadence-heavy-t2` | _frame heavy_ | 2 | cadence | 12 | 12100 | 4.00 | — | 0 | bulwark.rampart-seal x11, affliction.bog-eye x33, tempo.gale-wake x33, kill-chain.wind-chaser x12 |
| `frame-cooldown-light-t2` | _frame light_ | 2 | cooldown | 8 | 18650 | 2.67 | — | 0 | bulwark.rampart-seal x9, affliction.bog-eye x33, empowered.quake-ring x28, kill-chain.wind-chaser x8 |
| `frame-cooldown-balanced-t2` | _frame balanced_ | 2 | cooldown | 8 | 18163 | 2.67 | — | 0 | bulwark.rampart-seal x8, affliction.bog-eye x33, empowered.quake-ring x19, kill-chain.wind-chaser x8 |
| `frame-cooldown-heavy-t2` | _frame heavy_ | 2 | cooldown | 8 | 17538 | 2.67 | — | 0 | bulwark.rampart-seal x9, affliction.bog-eye x31, empowered.quake-ring x17, kill-chain.wind-chaser x8 |
| `frame-reload-light-t2` | _frame light_ | 2 | reload | 9 | 19033 | 3.00 | — | 0 | control.mire-grasp x90, affliction.bog-eye x41, bulwark.rampart-seal x14, kill-chain.wind-chaser x9 |
| `frame-reload-balanced-t2` | _frame balanced_ | 2 | reload | 9 | 18933 | 3.00 | — | 0 | control.mire-grasp x89, bulwark.rampart-seal x11, affliction.bog-eye x41, kill-chain.wind-chaser x9 |
| `frame-reload-heavy-t2` | _frame heavy_ | 2 | reload | 10 | 16790 | 3.33 | — | 0 | control.mire-grasp x70, affliction.bog-eye x38, kill-chain.wind-chaser x10, bulwark.rampart-seal x7 |
| `frame-energy-light-t2` | _frame light_ | 2 | energy | 6 | 29633 | 2.00 | — | 0 | affliction.bog-eye x38, kill-chain.steel-vigil x6, kill-chain.wind-chaser x6, bulwark.rampart-seal x2 |
| `frame-energy-balanced-t2` | _frame balanced_ | 2 | energy | 6 | 28350 | 2.00 | — | 0 | affliction.bog-eye x36, kill-chain.steel-vigil x6, kill-chain.wind-chaser x6, bulwark.rampart-seal x1 |
| `frame-energy-heavy-t2` | _frame heavy_ | 2 | energy | 8 | 20400 | 2.67 | — | 0 | affliction.bog-eye x36, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8, bulwark.rampart-seal x3 |
| `frame-dot-light-t2` | _frame light_ | 2 | dot | 6 | 29500 | 2.00 | — | 0 | bulwark.rampart-seal x18, tempo.ruin-afterimage x69, affliction.bog-eye x40, kill-chain.wind-chaser x6 |
| `frame-dot-balanced-t2` | _frame balanced_ | 2 | dot | 7 | 21886 | 2.33 | — | 0 | bulwark.rampart-seal x14, tempo.ruin-afterimage x59, affliction.bog-eye x31, kill-chain.wind-chaser x7 |
| `frame-dot-heavy-t2` | _frame heavy_ | 2 | dot | 6 | 27467 | 2.00 | — | 0 | tempo.ruin-afterimage x51, bulwark.rampart-seal x14, affliction.bog-eye x37, kill-chain.wind-chaser x6 |
| `frame-summoner-light-t2` | _frame light_ | 2 | summoner | 7 | 24329 | 2.33 | — | 0 | tempo.ruin-afterimage x391, kill-chain.wind-chaser x7, bulwark.rampart-seal x1 |
| `frame-summoner-balanced-t2` | _frame balanced_ | 2 | summoner | 5 | 32280 | 1.67 | — | 0 | tempo.ruin-afterimage x251, kill-chain.wind-chaser x5, bulwark.rampart-seal x1 |
| `frame-summoner-heavy-t2` | _frame heavy_ | 2 | summoner | 14 | 4914 | 4.67 | — | 0 | tempo.ruin-afterimage x86, kill-chain.wind-chaser x14, bulwark.rampart-seal x5 |

### `node-t2-desert-02` — Scorpion 70% / Basilisk 30% (desert T2; shared by 1 authored node)

Dominant family **Scorpion** drops `control`, punishes `kill-chain`. Authored Scorpion 70% / Basilisk 30%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 3 | 50900 | 1.00 | +0.0% | 1 | technique.cast-flare x30 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 4 | 44250 | 1.33 | +33.3% | 0 | kill-chain.kill-pulse x4 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 3 | 50900 | 1.00 | +0.0% | 1 | empowered.weak-point x5 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 3 | 50900 | 1.00 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 0 | — | 0.00 | — | 13 | tempo.ghost-strike x9 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 0 | — | 0.00 | — | 13 | affliction.bleed-pips x25 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 0 | — | 0.00 | — | 13 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 0 | — | 0.00 | — | 13 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 1 | 129600 | 0.33 | — | 8 | empowered.plating-crack x2 |
| `lineage-hammer-control` | control | 1 | cooldown | 2 | 67850 | 0.67 | — | 8 | control.frost-drag x2 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 4 | 37350 | 1.33 | — | 8 | engagement.brace-sparks x2 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 0 | — | 0.00 | — | 8 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 0 | — | 0.00 | — | 5 | tempo.ghost-strike x19 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 0 | — | 0.00 | — | 5 | — |
| `lineage-axe-empowered` | empowered | 1 | dot | 0 | — | 0.00 | — | 5 | empowered.weak-point x2 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 0 | — | 0.00 | — | 5 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 4 | 38900 | 1.33 | +33.3% | 3 | affliction.venom-pips x116 |
| `lineage-dagger-control` | control | 1 | reload | 4 | 39975 | 1.33 | +33.3% | 2 | control.frost-drag x46 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 4 | 38150 | 1.33 | +33.3% | 1 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 3 | 54000 | 1.00 | — | 2 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 8 | 20088 | 2.67 | +0.0% | 0 | technique.cast-flare x55, affliction.bog-eye x37, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8, bulwark.rampart-seal x2 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 8 | 22188 | 2.67 | +0.0% | 0 | affliction.bog-eye x40, kill-chain.kill-pulse x8, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8, bulwark.rampart-seal x1 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 9 | 18478 | 3.00 | +12.5% | 0 | affliction.bog-eye x38, empowered.weak-point x10, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9, bulwark.rampart-seal x1 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 8 | 19725 | 2.67 | — | 0 | affliction.bog-eye x36, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8, bulwark.rampart-seal x2 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 11 | 10945 | 3.67 | +22.2% | 0 | tempo.ghost-strike x74, bulwark.rampart-seal x10, tempo.gale-wake x44, affliction.bog-eye x27, kill-chain.wind-chaser x11 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 12 | 10075 | 4.00 | +33.3% | 0 | affliction.bleed-pips x199, bulwark.rampart-seal x11, tempo.gale-wake x39, affliction.bog-eye x29, kill-chain.wind-chaser x12 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 12 | 9075 | 4.00 | +33.3% | 0 | engagement.opening-flash x13, bulwark.rampart-seal x12, tempo.gale-wake x35, affliction.bog-eye x24, kill-chain.wind-chaser x12 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 9 | 14711 | 3.00 | — | 0 | bulwark.rampart-seal x8, tempo.gale-wake x42, affliction.bog-eye x30, kill-chain.wind-chaser x9 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 8 | 16875 | 2.67 | +0.0% | 0 | bulwark.rampart-seal x9, affliction.bog-eye x31, empowered.plating-crack x15, empowered.quake-ring x15, kill-chain.wind-chaser x8 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 10 | 13500 | 3.33 | +25.0% | 0 | bulwark.rampart-seal x8, affliction.bog-eye x30, control.frost-drag x18, empowered.quake-ring x16, kill-chain.wind-chaser x10 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 12 | 11267 | 4.00 | +50.0% | 0 | engagement.brace-sparks x6, bulwark.rampart-seal x8, affliction.bog-eye x30, empowered.quake-ring x16, kill-chain.wind-chaser x12 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 8 | 16813 | 2.67 | — | 0 | bulwark.rampart-seal x8, affliction.bog-eye x29, empowered.quake-ring x15, kill-chain.wind-chaser x8 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 7 | 22871 | 2.33 | +0.0% | 0 | bulwark.rampart-seal x17, tempo.ghost-strike x60, tempo.ruin-afterimage x60, affliction.bog-eye x34, kill-chain.wind-chaser x7 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 7 | 24757 | 2.33 | +0.0% | 0 | bulwark.rampart-seal x18, tempo.ruin-afterimage x65, affliction.bog-eye x38, kill-chain.kill-pulse x7, kill-chain.wind-chaser x7 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 8 | 20200 | 2.67 | +14.3% | 0 | bulwark.rampart-seal x14, tempo.ruin-afterimage x60, affliction.bog-eye x36, empowered.weak-point x9, kill-chain.wind-chaser x8 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 7 | 23114 | 2.33 | — | 0 | bulwark.rampart-seal x16, tempo.ruin-afterimage x61, affliction.bog-eye x34, kill-chain.wind-chaser x7 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 11 | 14864 | 3.67 | +22.2% | 0 | affliction.venom-pips x290, control.mire-grasp x71, affliction.bog-eye x37, kill-chain.wind-chaser x11, bulwark.rampart-seal x6 |
| `lineage-dagger-control-t2` | control | 2 | reload | 13 | 12446 | 4.33 | +44.4% | 0 | control.frost-drag x92, control.mire-grasp x68, affliction.bog-eye x33, kill-chain.wind-chaser x13, bulwark.rampart-seal x11 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 9 | 19222 | 3.00 | +0.0% | 0 | control.mire-grasp x70, affliction.bog-eye x40, kill-chain.wind-chaser x9, bulwark.rampart-seal x13 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 9 | 19244 | 3.00 | — | 0 | control.mire-grasp x70, affliction.bog-eye x39, kill-chain.wind-chaser x9, bulwark.rampart-seal x5 |

### `node-t2-desert-03` — Basilisk 60% / Scorpion 40% (desert T2; shared by 1 authored node)

Dominant family **Basilisk** drops `empowered`, punishes `tempo`. Authored Basilisk 60% / Scorpion 40%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 3 | 54633 | 1.00 | +0.0% | 1 | technique.cast-flare x47 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 5 | 35180 | 1.67 | +66.7% | 0 | kill-chain.kill-pulse x5 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 3 | 55533 | 1.00 | +0.0% | 0 | empowered.weak-point x9 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 3 | 54633 | 1.00 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 0 | — | 0.00 | — | 12 | tempo.ghost-strike x11 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 0 | — | 0.00 | — | 12 | affliction.bleed-pips x28 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 0 | — | 0.00 | — | 12 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 0 | — | 0.00 | — | 12 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 2 | 76900 | 0.67 | — | 9 | empowered.plating-crack x3 |
| `lineage-hammer-control` | control | 1 | cooldown | 3 | 51900 | 1.00 | — | 9 | control.frost-drag x4 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 2 | 78450 | 0.67 | — | 9 | engagement.brace-sparks x2 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 0 | — | 0.00 | — | 10 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 2 | 84150 | 0.67 | +0.0% | 4 | tempo.ghost-strike x25 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 2 | 82500 | 0.67 | +0.0% | 2 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | 1 | dot | 2 | 84300 | 0.67 | +0.0% | 4 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 2 | 84150 | 0.67 | — | 4 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 5 | 32200 | 1.67 | +25.0% | 1 | affliction.venom-pips x194 |
| `lineage-dagger-control` | control | 1 | reload | 4 | 41000 | 1.33 | +0.0% | 1 | control.frost-drag x74 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 3 | 58300 | 1.00 | -25.0% | 2 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 4 | 41050 | 1.33 | — | 1 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 9 | 18611 | 3.00 | +12.5% | 0 | technique.cast-flare x55, affliction.bog-eye x37, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9, bulwark.rampart-seal x2 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 8 | 20625 | 2.67 | +0.0% | 0 | affliction.bog-eye x38, kill-chain.kill-pulse x8, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8, bulwark.rampart-seal x3 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 8 | 20238 | 2.67 | +0.0% | 0 | affliction.bog-eye x37, empowered.weak-point x9, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8, bulwark.rampart-seal x3 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 8 | 19625 | 2.67 | — | 0 | affliction.bog-eye x33, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8, bulwark.rampart-seal x3 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 12 | 9792 | 4.00 | +20.0% | 0 | tempo.ghost-strike x72, bulwark.rampart-seal x9, tempo.gale-wake x44, affliction.bog-eye x24, kill-chain.wind-chaser x12 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 12 | 9900 | 4.00 | +20.0% | 0 | affliction.bleed-pips x195, bulwark.rampart-seal x11, tempo.gale-wake x39, affliction.bog-eye x26, kill-chain.wind-chaser x12 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 12 | 9358 | 4.00 | +20.0% | 0 | engagement.opening-flash x12, bulwark.rampart-seal x11, tempo.gale-wake x36, affliction.bog-eye x25, kill-chain.wind-chaser x12 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 10 | 11950 | 3.33 | — | 0 | bulwark.rampart-seal x9, tempo.gale-wake x38, affliction.bog-eye x27, kill-chain.wind-chaser x10 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 9 | 14944 | 3.00 | +12.5% | 0 | bulwark.rampart-seal x8, affliction.bog-eye x32, empowered.plating-crack x16, empowered.quake-ring x16, kill-chain.wind-chaser x9 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 12 | 10692 | 4.00 | +50.0% | 0 | bulwark.rampart-seal x8, affliction.bog-eye x27, control.frost-drag x17, empowered.quake-ring x15, kill-chain.wind-chaser x12 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 10 | 12910 | 3.33 | +25.0% | 0 | engagement.brace-sparks x6, bulwark.rampart-seal x9, affliction.bog-eye x27, empowered.quake-ring x15, kill-chain.wind-chaser x10 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 8 | 16775 | 2.67 | — | 0 | bulwark.rampart-seal x8, affliction.bog-eye x31, empowered.quake-ring x15, kill-chain.wind-chaser x8 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 6 | 29533 | 2.00 | -14.3% | 0 | bulwark.rampart-seal x19, tempo.ghost-strike x68, tempo.ruin-afterimage x68, affliction.bog-eye x39, kill-chain.wind-chaser x6 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 6 | 27483 | 2.00 | -14.3% | 0 | bulwark.rampart-seal x19, tempo.ruin-afterimage x63, affliction.bog-eye x35, kill-chain.kill-pulse x6, kill-chain.wind-chaser x6 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 8 | 20463 | 2.67 | +14.3% | 0 | bulwark.rampart-seal x20, tempo.ruin-afterimage x63, affliction.bog-eye x37, empowered.weak-point x9, kill-chain.wind-chaser x8 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 7 | 24629 | 2.33 | — | 0 | bulwark.rampart-seal x19, tempo.ruin-afterimage x66, affliction.bog-eye x37, kill-chain.wind-chaser x7 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 11 | 15000 | 3.67 | +22.2% | 0 | affliction.venom-pips x283, control.mire-grasp x69, affliction.bog-eye x39, kill-chain.wind-chaser x11, bulwark.rampart-seal x7 |
| `lineage-dagger-control-t2` | control | 2 | reload | 12 | 13742 | 4.00 | +33.3% | 0 | control.frost-drag x94, control.mire-grasp x68, affliction.bog-eye x36, kill-chain.wind-chaser x12, bulwark.rampart-seal x8 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 9 | 18944 | 3.00 | +0.0% | 0 | control.mire-grasp x70, affliction.bog-eye x39, kill-chain.wind-chaser x9, bulwark.rampart-seal x8 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 9 | 19033 | 3.00 | — | 0 | control.mire-grasp x71, affliction.bog-eye x40, kill-chain.wind-chaser x9, bulwark.rampart-seal x7 |

### `node-t2-desert-04` — Scorpion 60% / Basilisk 40% (desert T2; shared by 1 authored node)

Dominant family **Scorpion** drops `control`, punishes `kill-chain`. Authored Scorpion 60% / Basilisk 40%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 4 | 39675 | 1.33 | +0.0% | 2 | technique.cast-flare x34 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 4 | 39750 | 1.33 | +0.0% | 1 | kill-chain.kill-pulse x4 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 3 | 56467 | 1.00 | -25.0% | 3 | empowered.weak-point x5 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 4 | 39675 | 1.33 | — | 2 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 0 | — | 0.00 | — | 14 | tempo.ghost-strike x10 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 0 | — | 0.00 | — | 14 | affliction.bleed-pips x28 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 0 | — | 0.00 | — | 14 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 0 | — | 0.00 | — | 14 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 3 | 48100 | 1.00 | — | 8 | empowered.plating-crack x2 |
| `lineage-hammer-control` | control | 1 | cooldown | 3 | 48100 | 1.00 | — | 8 | control.frost-drag x3 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 3 | 48533 | 1.00 | — | 8 | engagement.brace-sparks x2 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 0 | — | 0.00 | — | 8 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 1 | 165700 | 0.33 | +0.0% | 4 | tempo.ghost-strike x29 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 1 | 152200 | 0.33 | +0.0% | 4 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | 1 | dot | 1 | 158700 | 0.33 | +0.0% | 4 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 1 | 158100 | 0.33 | — | 4 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 3 | 56633 | 1.00 | +50.0% | 3 | affliction.venom-pips x129 |
| `lineage-dagger-control` | control | 1 | reload | 3 | 56633 | 1.00 | +50.0% | 3 | control.frost-drag x54 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 4 | 43350 | 1.33 | +100.0% | 2 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 2 | 84100 | 0.67 | — | 3 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 10 | 15730 | 3.33 | +11.1% | 0 | technique.cast-flare x53, affliction.bog-eye x34, kill-chain.steel-vigil x10, kill-chain.wind-chaser x10, bulwark.rampart-seal x3 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 9 | 17400 | 3.00 | +0.0% | 0 | affliction.bog-eye x35, kill-chain.kill-pulse x9, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9, bulwark.rampart-seal x3 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 9 | 16756 | 3.00 | +0.0% | 0 | affliction.bog-eye x34, empowered.weak-point x9, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9, bulwark.rampart-seal x3 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 9 | 18311 | 3.00 | — | 0 | affliction.bog-eye x37, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9, bulwark.rampart-seal x3 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 12 | 10442 | 4.00 | +50.0% | 0 | tempo.ghost-strike x78, bulwark.rampart-seal x11, tempo.gale-wake x46, affliction.bog-eye x27, kill-chain.wind-chaser x12 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 11 | 11518 | 3.67 | +37.5% | 0 | affliction.bleed-pips x208, bulwark.rampart-seal x11, tempo.gale-wake x41, affliction.bog-eye x28, kill-chain.wind-chaser x11 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 12 | 9133 | 4.00 | +50.0% | 0 | engagement.opening-flash x12, bulwark.rampart-seal x10, tempo.gale-wake x35, affliction.bog-eye x24, kill-chain.wind-chaser x12 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 8 | 16263 | 2.67 | — | 0 | bulwark.rampart-seal x9, tempo.gale-wake x42, affliction.bog-eye x29, kill-chain.wind-chaser x8 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 9 | 15111 | 3.00 | +12.5% | 0 | bulwark.rampart-seal x9, affliction.bog-eye x30, empowered.plating-crack x16, empowered.quake-ring x16, kill-chain.wind-chaser x9 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 9 | 15367 | 3.00 | +12.5% | 0 | bulwark.rampart-seal x9, affliction.bog-eye x31, control.frost-drag x19, empowered.quake-ring x17, kill-chain.wind-chaser x9 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 9 | 15378 | 3.00 | +12.5% | 0 | engagement.brace-sparks x6, bulwark.rampart-seal x9, affliction.bog-eye x30, empowered.quake-ring x17, kill-chain.wind-chaser x9 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 8 | 16338 | 2.67 | — | 0 | bulwark.rampart-seal x7, affliction.bog-eye x29, empowered.quake-ring x17, kill-chain.wind-chaser x8 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 6 | 25783 | 2.00 | +0.0% | 0 | bulwark.rampart-seal x13, tempo.ghost-strike x58, tempo.ruin-afterimage x58, affliction.bog-eye x34, kill-chain.wind-chaser x6 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 7 | 24186 | 2.33 | +16.7% | 0 | bulwark.rampart-seal x19, tempo.ruin-afterimage x63, affliction.bog-eye x37, kill-chain.kill-pulse x7, kill-chain.wind-chaser x7 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 8 | 21788 | 2.67 | +33.3% | 0 | bulwark.rampart-seal x11, tempo.ruin-afterimage x65, affliction.bog-eye x38, empowered.weak-point x9, kill-chain.wind-chaser x8 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 6 | 25333 | 2.00 | — | 0 | bulwark.rampart-seal x14, tempo.ruin-afterimage x57, affliction.bog-eye x32, kill-chain.wind-chaser x6 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 12 | 13367 | 4.00 | +20.0% | 0 | affliction.venom-pips x275, control.mire-grasp x67, affliction.bog-eye x34, kill-chain.wind-chaser x12, bulwark.rampart-seal x11 |
| `lineage-dagger-control-t2` | control | 2 | reload | 12 | 13133 | 4.00 | +20.0% | 0 | control.frost-drag x91, control.mire-grasp x69, affliction.bog-eye x34, kill-chain.wind-chaser x12, bulwark.rampart-seal x10 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 9 | 19256 | 3.00 | -10.0% | 0 | control.mire-grasp x72, bulwark.rampart-seal x15, affliction.bog-eye x41, kill-chain.wind-chaser x9 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 10 | 17160 | 3.33 | — | 0 | control.mire-grasp x70, affliction.bog-eye x40, kill-chain.wind-chaser x10, bulwark.rampart-seal x10 |

### `node-t2-desert-05` — Basilisk 50% / Scorpion 50% (desert T2; shared by 1 authored node)

Dominant family **Basilisk** drops `empowered`, punishes `tempo`. Authored Basilisk 50% / Scorpion 50%; unfieldable at T2: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 5 | 34860 | 1.67 | +0.0% | 1 | technique.cast-flare x51 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 4 | 43900 | 1.33 | -20.0% | 1 | kill-chain.kill-pulse x3 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 5 | 35400 | 1.67 | +0.0% | 0 | empowered.weak-point x10 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 5 | 34860 | 1.67 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 0 | — | 0.00 | — | 13 | tempo.ghost-strike x11 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 0 | — | 0.00 | — | 13 | affliction.bleed-pips x28 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 0 | — | 0.00 | — | 13 | engagement.opening-flash x2 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 0 | — | 0.00 | — | 13 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 0 | — | 0.00 | — | 9 | empowered.plating-crack x3 |
| `lineage-hammer-control` | control | 1 | cooldown | 2 | 75600 | 0.67 | — | 9 | control.frost-drag x4 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 3 | 51033 | 1.00 | — | 7 | engagement.brace-sparks x2 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 0 | — | 0.00 | — | 9 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 2 | 85300 | 0.67 | +0.0% | 4 | tempo.ghost-strike x28 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 1 | 163800 | 0.33 | -50.0% | 4 | kill-chain.kill-pulse x1 |
| `lineage-axe-empowered` | empowered | 1 | dot | 3 | 56733 | 1.00 | +50.0% | 3 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 2 | 85300 | 0.67 | — | 4 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 4 | 39700 | 1.33 | +0.0% | 1 | affliction.venom-pips x195 |
| `lineage-dagger-control` | control | 1 | reload | 4 | 39600 | 1.33 | +0.0% | 1 | control.frost-drag x65 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 4 | 39575 | 1.33 | +0.0% | 1 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 4 | 40275 | 1.33 | — | 2 | — |
| `lineage-broadsword-technique-t2` | technique | 2 | energy | 9 | 17556 | 3.00 | +12.5% | 0 | technique.cast-flare x52, affliction.bog-eye x37, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9 |
| `lineage-broadsword-kill-chain-t2` | kill-chain | 2 | energy | 8 | 20838 | 2.67 | +0.0% | 0 | affliction.bog-eye x38, kill-chain.kill-pulse x8, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8, bulwark.rampart-seal x2 |
| `lineage-broadsword-empowered-t2` | empowered | 2 | energy | 9 | 17744 | 3.00 | +12.5% | 0 | affliction.bog-eye x36, empowered.weak-point x9, kill-chain.steel-vigil x9, kill-chain.wind-chaser x9, bulwark.rampart-seal x4 |
| `lineage-broadsword-baseline-t2` | _control_ | 2 | energy | 8 | 20000 | 2.67 | — | 0 | affliction.bog-eye x33, kill-chain.steel-vigil x8, kill-chain.wind-chaser x8, bulwark.rampart-seal x2 |
| `lineage-rapier-tempo-t2` | tempo | 2 | cadence | 11 | 11236 | 3.67 | +22.2% | 0 | tempo.ghost-strike x76, bulwark.rampart-seal x11, tempo.gale-wake x46, affliction.bog-eye x27, kill-chain.wind-chaser x11 |
| `lineage-rapier-affliction-t2` | affliction | 2 | cadence | 11 | 11018 | 3.67 | +22.2% | 0 | affliction.bleed-pips x199, bulwark.rampart-seal x10, tempo.gale-wake x39, affliction.bog-eye x27, kill-chain.wind-chaser x11 |
| `lineage-rapier-engagement-t2` | engagement | 2 | cadence | 12 | 9258 | 4.00 | +33.3% | 0 | engagement.opening-flash x11, bulwark.rampart-seal x12, tempo.gale-wake x35, affliction.bog-eye x25, kill-chain.wind-chaser x12 |
| `lineage-rapier-baseline-t2` | _control_ | 2 | cadence | 9 | 13711 | 3.00 | — | 0 | bulwark.rampart-seal x10, tempo.gale-wake x39, affliction.bog-eye x28, kill-chain.wind-chaser x9 |
| `lineage-hammer-empowered-t2` | empowered | 2 | cooldown | 8 | 17113 | 2.67 | +0.0% | 0 | bulwark.rampart-seal x9, affliction.bog-eye x32, empowered.plating-crack x16, empowered.quake-ring x16, kill-chain.wind-chaser x8 |
| `lineage-hammer-control-t2` | control | 2 | cooldown | 9 | 16556 | 3.00 | +12.5% | 0 | bulwark.rampart-seal x10, affliction.bog-eye x32, control.frost-drag x20, empowered.quake-ring x17, kill-chain.wind-chaser x9 |
| `lineage-hammer-engagement-t2` | engagement | 2 | cooldown | 10 | 14650 | 3.33 | +25.0% | 0 | engagement.brace-sparks x6, bulwark.rampart-seal x10, affliction.bog-eye x32, empowered.quake-ring x16, kill-chain.wind-chaser x10 |
| `lineage-hammer-baseline-t2` | _control_ | 2 | cooldown | 8 | 16863 | 2.67 | — | 0 | bulwark.rampart-seal x8, affliction.bog-eye x31, empowered.quake-ring x15, kill-chain.wind-chaser x8 |
| `lineage-axe-tempo-t2` | tempo | 2 | dot | 7 | 23800 | 2.33 | +16.7% | 0 | bulwark.rampart-seal x16, tempo.ghost-strike x64, tempo.ruin-afterimage x64, affliction.bog-eye x36, kill-chain.wind-chaser x7 |
| `lineage-axe-kill-chain-t2` | kill-chain | 2 | dot | 8 | 20275 | 2.67 | +33.3% | 0 | bulwark.rampart-seal x18, tempo.ruin-afterimage x65, affliction.bog-eye x38, kill-chain.kill-pulse x8, kill-chain.wind-chaser x8 |
| `lineage-axe-empowered-t2` | empowered | 2 | dot | 8 | 20038 | 2.67 | +33.3% | 0 | bulwark.rampart-seal x15, tempo.ruin-afterimage x62, affliction.bog-eye x36, empowered.weak-point x10, kill-chain.wind-chaser x8 |
| `lineage-axe-baseline-t2` | _control_ | 2 | dot | 6 | 26833 | 2.00 | — | 0 | bulwark.rampart-seal x16, tempo.ruin-afterimage x64, affliction.bog-eye x37, kill-chain.wind-chaser x6 |
| `lineage-dagger-affliction-t2` | affliction | 2 | reload | 12 | 13808 | 4.00 | +33.3% | 0 | affliction.venom-pips x288, control.mire-grasp x70, affliction.bog-eye x37, kill-chain.wind-chaser x12, bulwark.rampart-seal x9 |
| `lineage-dagger-control-t2` | control | 2 | reload | 12 | 13558 | 4.00 | +33.3% | 0 | control.frost-drag x94, control.mire-grasp x69, affliction.bog-eye x38, kill-chain.wind-chaser x12, bulwark.rampart-seal x10 |
| `lineage-dagger-kill-chain-t2` | kill-chain | 2 | reload | 9 | 18911 | 3.00 | +0.0% | 0 | control.mire-grasp x69, affliction.bog-eye x38, kill-chain.wind-chaser x9, bulwark.rampart-seal x5 |
| `lineage-dagger-baseline-t2` | _control_ | 2 | reload | 9 | 18889 | 3.00 | — | 0 | control.mire-grasp x68, affliction.bog-eye x37, kill-chain.wind-chaser x9, bulwark.rampart-seal x5 |

