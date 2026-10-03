# Lineage lane matrix — Tier 1

Generated 2026-10-03T12:15:05.885Z from `95a9ba8b311ac54e2a49b05187db415b08aaf2bc`.
20 lane reference profiles (band 1: 20, band 2: 0) x 15 distinct node blends, x 2 seeds (101009, 101033), 90 s of sim per cell per seed; 600 measured runs; wall clock 22.6 min.

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
| `node-t1-mountain-01` | 1 | mountain | Ridge 70% / Hopper 20% / Crag 10% | Ridge 70% / Hopper 20% / Crag 10% | 1 node(s): t1-mountain-01 | ridge-archer x7, cliff-hopper x2, rockback-ram x1 |
| `node-t1-mountain-03` | 1 | mountain | Crag 70% / Ridge 20% / Hopper 10% | Crag 70% / Ridge 20% / Hopper 10% | 1 node(s): t1-mountain-03 | rockback-ram x7, ridge-archer x2, cliff-hopper x1 |
| `node-t1-mountain-04` | 1 | mountain | Hopper 70% / Crag 20% / Ridge 10% | Hopper 70% / Crag 20% / Ridge 10% | 1 node(s): t1-mountain-04 | cliff-hopper x7, rockback-ram x2, ridge-archer x1 |
| `node-t1-cave-01` | 1 | cave | Brood 70% / Brute 20% / Deep 10% | Brood 70% / Brute 20% / Deep 10% | 1 node(s): t1-cave-01 | brood-spiderling x7, cave-brute x2, cave-lurker x1 |
| `node-t1-cave-02` | 1 | cave | Brute 70% / Deep 20% / Brood 10% | Brute 70% / Deep 20% / Brood 10% | 1 node(s): t1-cave-02 | cave-brute x7, cave-lurker x2, brood-spiderling x1 |
| `node-t1-cave-03` | 1 | cave | Deep 70% / Brood 20% / Brute 10% | Deep 70% / Brood 20% / Brute 10% | 1 node(s): t1-cave-03 | cave-lurker x7, brood-spiderling x2, cave-brute x1 |
| `node-t1-forest-01` | 1 | forest | Pack 70% / Grove 20% / Canopy 10% | Pack 70% / Grove 20% / Canopy 10% | 1 node(s): t1-forest-01 | wolf x7, forest-slime x2, bramble-pod x1 |
| `node-t1-forest-02` | 1 | forest | Grove 70% / Canopy 20% / Pack 10% | Grove 70% / Canopy 20% / Pack 10% | 1 node(s): t1-forest-02 | forest-slime x7, bramble-pod x2, wolf x1 |
| `node-t1-forest-03` | 1 | forest | Canopy 70% / Pack 20% / Grove 10% | Canopy 70% / Pack 20% / Grove 10% | 1 node(s): t1-forest-03 | bramble-pod x7, wolf x2, forest-slime x1 |
| `node-t1-plains-01` | 1 | plains | Herd 70% / Swarm 20% / Sky 10% | Herd 70% / Swarm 20% / Sky 10% | 1 node(s): t1-plains-01 | boar x7, plains-slime x2, grass-kite x1 |
| `node-t1-plains-03` | 1 | plains | Sky 70% / Herd 20% / Swarm 10% | Sky 70% / Herd 20% / Swarm 10% | 1 node(s): t1-plains-03 | grass-kite x7, boar x2, plains-slime x1 |
| `node-t1-plains-04` | 1 | plains | Swarm 70% / Sky 20% / Herd 10% | Swarm 70% / Sky 20% / Herd 10% | 1 node(s): t1-plains-04 | plains-slime x7, grass-kite x2, boar x1 |
| `node-t1-swamp-01` | 1 | swamp | Mire 70% / Coven 20% / Stalker 10% | Mire 70% / Coven 20% / Stalker 10% | 1 node(s): t1-swamp-01 | bog-slime x7, fen-hexer x2, mud-toad x1 |
| `node-t1-swamp-02` | 1 | swamp | Coven 70% / Stalker 20% / Mire 10% | Coven 70% / Stalker 20% / Mire 10% | 1 node(s): t1-swamp-02 | fen-hexer x7, mud-toad x2, bog-slime x1 |
| `node-t1-swamp-03` | 1 | swamp | Stalker 70% / Mire 20% / Coven 10% | Stalker 70% / Mire 20% / Coven 10% | 1 node(s): t1-swamp-03 | mud-toad x7, bog-slime x2, fen-hexer x1 |

## TTK per lane per node

Milliseconds of ENGAGED time per kill, pooled over both seeds. Lower is faster.

**Tier 1 node, Band 1 (T1 cards, T1 gear)**

| profile | lane | class | t1-mountain-01 | t1-mountain-03 | t1-mountain-04 | t1-cave-01 | t1-cave-02 | t1-cave-03 | t1-forest-01 | t1-forest-02 | t1-forest-03 | t1-plains-01 | t1-plains-03 | t1-plains-04 | t1-swamp-01 | t1-swamp-02 | t1-swamp-03 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-technique` | technique | energy | 5432 | 5335 | 4929 | 2330 | 4687 | 4286 | 1748 | 4074 | 3004 | 2121 | 2854 | 1621 | 3671 | 2450 | 3239 |
| `lineage-broadsword-kill-chain` | kill-chain | energy | 5365 | 4987 | 5141 | 2100 | 4167 | 4086 | 2176 | 3273 | 2643 | 2002 | 2909 | 1654 | 4650 | 2783 | 2697 |
| `lineage-broadsword-empowered` | empowered | energy | 5432 | 5335 | 4929 | 2330 | 4687 | 4286 | 1793 | 3025 | 2732 | 2053 | 2854 | 1806 | 3671 | 2450 | 3239 |
| `lineage-broadsword-baseline` | _control_ | energy | 5432 | 5335 | 4929 | 2330 | 4687 | 4286 | 1914 | 4033 | 3004 | 2053 | 2854 | 1806 | 3671 | 2450 | 3239 |
| `lineage-rapier-tempo` | tempo | cadence | 5082 | 4947 | 4583 | 2179 | 6325 | 3678 | 1485 | 2638 | 2617 | 1688 | 1881 | 1315 | 3893 | 2837 | 2947 |
| `lineage-rapier-affliction` | affliction | cadence | 4594 | 4678 | 4456 | 2179 | 7027 | 3256 | 1469 | 2541 | 2617 | 1574 | 1848 | 1315 | 3829 | 2883 | 2910 |
| `lineage-rapier-engagement` | engagement | cadence | 3779 | 4021 | 3675 | 2231 | 5508 | 2463 | 1313 | 2373 | 1963 | 1462 | 1783 | 1315 | 3494 | 2547 | 2400 |
| `lineage-rapier-baseline` | _control_ | cadence | 5082 | 4947 | 4583 | 2244 | 6325 | 3678 | 1432 | 2793 | 2617 | 1643 | 1874 | 1352 | 3893 | 2837 | 3344 |
| `lineage-hammer-empowered` | empowered | cooldown | 3679 | 4429 | 3600 | 2758 | 2947 | 2939 | 2013 | 3243 | 2396 | 2228 | 2521 | 1798 | 3044 | 2865 | 2695 |
| `lineage-hammer-control` | control | cooldown | 3679 | 4429 | 3600 | 1550 | 2476 | 2605 | 2013 | 3243 | 2396 | 2228 | 2521 | 1798 | 3731 | 2865 | 2695 |
| `lineage-hammer-engagement` | engagement | cooldown | 3833 | 4471 | 3600 | 2033 | 2295 | 2605 | 1802 | 3500 | 2392 | 2228 | 2518 | 1660 | 3731 | 2900 | 2714 |
| `lineage-hammer-baseline` | _control_ | cooldown | 3679 | 4429 | 3600 | 2758 | 2947 | 2939 | 2119 | 3733 | 2829 | 2228 | 2521 | 1798 | 3044 | 2865 | 2695 |
| `lineage-axe-tempo` | tempo | dot | 6686 | 8093 | 5815 | 3358 | 7273 | 4913 | 2192 | 4956 | 3555 | 2991 | 3680 | 2273 | 6669 | 4427 | 5450 |
| `lineage-axe-kill-chain` | kill-chain | dot | 6657 | 8107 | 5963 | 3358 | 7367 | 5400 | 2568 | 4570 | 3486 | 2881 | 3811 | 2210 | 6027 | 4638 | 5095 |
| `lineage-axe-empowered` | empowered | dot | 6571 | 7000 | 5775 | 3358 | 7273 | 4913 | 2192 | 4956 | 3555 | 2817 | 3680 | 2273 | 6669 | 4427 | 5450 |
| `lineage-axe-baseline` | _control_ | dot | 6679 | 8093 | 6068 | 3358 | 7273 | 4913 | 2176 | 4956 | 3555 | 2991 | 3680 | 2273 | 6007 | 4427 | 5450 |
| `lineage-dagger-affliction` | affliction | reload | 5465 | 5494 | 4696 | 3037 | 5240 | 4063 | 2323 | 3387 | 2742 | 2359 | 2932 | 1731 | 4450 | 2463 | 3000 |
| `lineage-dagger-control` | control | reload | 5250 | 5667 | 4737 | 3162 | 5363 | 4224 | 2184 | 3479 | 2815 | 2268 | 2830 | 1644 | 4330 | 2450 | 3052 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 5622 | 5958 | 5286 | 3512 | 5885 | 4244 | 2133 | 4022 | 3400 | 2258 | 2731 | 1815 | 5294 | 3338 | 3748 |
| `lineage-dagger-baseline` | _control_ | reload | 5528 | 6344 | 5378 | 3372 | 5728 | 4538 | 2515 | 3736 | 2950 | 2454 | 2933 | 1888 | 4924 | 3227 | 3995 |

### The same table as uplift over each lineage’s own control

**Tier 1 node, Band 1 (T1 cards, T1 gear)**

| profile | lane | class | t1-mountain-01 | t1-mountain-03 | t1-mountain-04 | t1-cave-01 | t1-cave-02 | t1-cave-03 | t1-forest-01 | t1-forest-02 | t1-forest-03 | t1-plains-01 | t1-plains-03 | t1-plains-04 | t1-swamp-01 | t1-swamp-02 | t1-swamp-03 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-technique` | technique | energy | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | -1.8% | +0.0% | +0.0% | -4.4% | +0.0% | +18.4% | +0.0% | +0.0% | +0.0% |
| `lineage-broadsword-kill-chain` | kill-chain | energy | +5.3% | +15.0% | +4.8% | +8.1% | +4.3% | +0.0% | -26.3% | +22.2% | +25.0% | +6.7% | +0.0% | +16.3% | -4.8% | -9.4% | +26.1% |
| `lineage-broadsword-empowered` | empowered | energy | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +5.3% | +18.5% | +16.7% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-rapier-tempo` | tempo | cadence | +0.0% | +0.0% | +0.0% | +3.1% | +0.0% | +0.0% | +2.1% | +6.7% | +0.0% | +10.9% | -2.3% | +13.0% | +0.0% | +0.0% | +5.6% |
| `lineage-rapier-affliction` | affliction | cadence | +5.9% | +5.9% | +0.0% | +3.1% | -8.3% | +0.0% | +2.1% | +6.7% | +0.0% | +2.2% | -2.3% | +13.0% | +21.4% | -11.1% | +16.7% |
| `lineage-rapier-engagement` | engagement | cadence | +11.8% | +11.8% | +11.1% | -9.4% | +8.3% | +33.3% | -2.1% | +10.0% | +33.3% | +15.2% | -2.3% | +13.0% | +21.4% | +11.1% | +33.3% |
| `lineage-hammer-empowered` | empowered | cooldown | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +8.3% | +16.7% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-hammer-control` | control | cooldown | +0.0% | +0.0% | +0.0% | +50.0% | +10.5% | +5.6% | +8.3% | +16.7% | +0.0% | +0.0% | +0.0% | +0.0% | -11.1% | +0.0% | +0.0% |
| `lineage-hammer-engagement` | engagement | cooldown | -5.3% | +0.0% | +0.0% | +37.5% | +10.5% | +5.6% | +16.7% | +12.5% | +0.0% | +0.0% | +0.0% | +0.0% | -11.1% | +0.0% | +0.0% |
| `lineage-axe-tempo` | tempo | dot | +0.0% | +0.0% | +5.3% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | -7.1% | +0.0% | +0.0% |
| `lineage-axe-kill-chain` | kill-chain | dot | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | -6.7% | -10.5% | +11.1% | +0.0% | +5.9% | +8.0% | +11.4% | +7.1% | -4.5% | +25.0% |
| `lineage-axe-empowered` | empowered | dot | +0.0% | +0.0% | +5.3% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +5.9% | +0.0% | +0.0% | -7.1% | +0.0% | +0.0% |
| `lineage-dagger-affliction` | affliction | reload | -5.6% | -5.6% | +27.8% | +8.0% | +11.1% | +0.0% | +7.3% | +24.0% | +19.2% | +10.8% | -6.1% | +2.0% | +5.9% | +15.4% | +21.1% |
| `lineage-dagger-control` | control | reload | +0.0% | +0.0% | +5.6% | +4.0% | +5.6% | +6.3% | +7.3% | +12.0% | +3.8% | +8.1% | -9.1% | +11.8% | +17.6% | +15.4% | +21.1% |
| `lineage-dagger-kill-chain` | kill-chain | reload | +0.0% | +5.6% | +16.7% | +0.0% | +11.1% | +12.5% | +12.2% | -8.0% | -23.1% | +2.7% | -3.0% | +2.0% | -5.9% | +0.0% | +10.5% |

## Lane budget (design §18.9)

“The band is the median uplift ±3pp, absolute.” Measured on each lane’s favoured
node — the node its own family dominates hardest — per tier.

**Tier 1 node, Band 1 (T1 cards, T1 gear).** Median lane uplift on the favoured node: **+0.0%**. The §18.9 band is -3.0% to +3.0% (median ±3 pp). Median absolute throughput there: 6.67 kills/min.

| lane | profile | favoured node | uplift | uplift − median | in ±3 pp (§18.9) | kills/min | in ±10% abs (§9, retired) | shards |
|---|---|---|---:|---:|:--:|---:|:--:|---|
| technique | `lineage-broadsword-technique` | `node-t1-plains-04` | +18.4% | +18.4% | NO | 19.33 | NO | earned |
| kill-chain | `lineage-broadsword-kill-chain` | `node-t1-cave-03` | +0.0% | +0.0% | yes | 7.00 | yes | earned |
| empowered | `lineage-broadsword-empowered` | `node-t1-mountain-03` | +0.0% | +0.0% | yes | 6.67 | yes | earned |
| tempo | `lineage-rapier-tempo` | `node-t1-mountain-04` | +0.0% | +0.0% | yes | 6.00 | NO | earned |
| affliction | `lineage-rapier-affliction` | `node-t1-cave-01` | +3.1% | +3.1% | NO | 11.00 | NO | earned |
| engagement | `lineage-rapier-engagement` | `node-t1-plains-03` | -2.3% | -2.3% | yes | 14.00 | NO | earned |
| empowered | `lineage-hammer-empowered` | `node-t1-mountain-03` | +0.0% | +0.0% | yes | 5.67 | NO | earned |
| control | `lineage-hammer-control` | `node-t1-mountain-01` | +0.0% | +0.0% | yes | 6.33 | yes | earned |
| engagement | `lineage-hammer-engagement` | `node-t1-plains-03` | +0.0% | +0.0% | yes | 11.00 | NO | earned |
| tempo | `lineage-axe-tempo` | `node-t1-mountain-04` | +5.3% | +5.3% | NO | 6.67 | yes | earned |
| kill-chain | `lineage-axe-kill-chain` | `node-t1-cave-03` | -6.7% | -6.7% | NO | 4.67 | NO | earned |
| empowered | `lineage-axe-empowered` | `node-t1-mountain-03` | +0.0% | +0.0% | yes | 5.00 | NO | earned |
| affliction | `lineage-dagger-affliction` | `node-t1-cave-01` | +8.0% | +8.0% | NO | 9.00 | NO | earned |
| control | `lineage-dagger-control` | `node-t1-mountain-01` | +0.0% | +0.0% | yes | 6.00 | NO | earned |
| kill-chain | `lineage-dagger-kill-chain` | `node-t1-cave-03` | +12.5% | +12.5% | NO | 6.00 | NO | earned |

### How much of the absolute column is class, not lane

**Band 1 (T1 cards, T1 gear).**

| control | class | weapon | mean kills/min over its node set | vs that band's control median |
|---|---|---|---:|---:|
| `lineage-broadsword-baseline` | energy | iron-broadsword | 10.09 | +17.0% |
| `lineage-rapier-baseline` | cadence | flash-rapier | 9.27 | +7.5% |
| `lineage-hammer-baseline` | cooldown | heavy-hammer | 8.56 | -0.8% |
| `lineage-axe-baseline` | dot | chaotic-axe | 7.44 | -13.7% |
| `lineage-dagger-baseline` | reload | ashbrand-blade | 8.62 | +0.0% |


### Lane budget per PACKET — the table `PACKET_BUDGET` is tuned from

**Band 1 (T1 cards, T1 gear).** Median packet uplift: **+3.9%**. The §18.9 band is +0.9% to +6.9% (median ±3 pp).

| packet | lineages carrying it | mean uplift | − median | in ±3 pp | payoff fx fired | hardest favouring node |
|---|---:|---:|---:|:--:|---:|---|
| engagement | 2 | +8.9% | +5.0% | NO | 445 | `node-t1-plains-03` |
| affliction | 2 | +6.4% | +2.5% | yes | 3891 | `node-t1-cave-01` |
| control | 2 | +6.3% | +2.5% | yes | 938 | `node-t1-mountain-01` |
| kill-chain | 3 | +3.9% | +0.0% | yes | 865 | `node-t1-cave-03` |
| empowered | 3 | +1.5% | -2.3% | yes | 406 | `node-t1-mountain-03` |
| tempo | 2 | +1.2% | -2.6% | yes | 1051 | `node-t1-mountain-04` |
| technique | 1 | +0.8% | -3.0% | NO | 692 | `node-t1-plains-04` |


### Lane uplift over every node

The same uplift as above, averaged over all node blends rather than only the
favoured one — the reading least sensitive to which single encounter a lane
happened to be measured on.

| lane | profile | band | mean uplift over all nodes | uplift on favoured node | worst node | best node | payoff fx fired (all nodes) |
|---|---|---:|---:|---:|---|---|---:|
| technique | `lineage-broadsword-technique` | 1 | +0.8% | +18.4% | t1-plains-01 -4.4% | t1-plains-04 +18.4% | 692 |
| kill-chain | `lineage-broadsword-kill-chain` | 1 | +6.2% | +0.0% | t1-forest-01 -26.3% | t1-swamp-03 +26.1% | 473 |
| empowered | `lineage-broadsword-empowered` | 1 | +2.7% | +0.0% | t1-mountain-01 +0.0% | t1-forest-02 +18.5% | 87 |
| tempo | `lineage-rapier-tempo` | 1 | +2.6% | +0.0% | t1-plains-03 -2.3% | t1-plains-04 +13.0% | 544 |
| affliction | `lineage-rapier-affliction` | 1 | +3.7% | +3.1% | t1-swamp-02 -11.1% | t1-swamp-01 +21.4% | 1603 |
| engagement | `lineage-rapier-engagement` | 1 | +13.3% | -2.3% | t1-cave-01 -9.4% | t1-swamp-03 +33.3% | 226 |
| empowered | `lineage-hammer-empowered` | 1 | +1.7% | +0.0% | t1-mountain-01 +0.0% | t1-forest-02 +16.7% | 236 |
| control | `lineage-hammer-control` | 1 | +5.3% | +0.0% | t1-swamp-01 -11.1% | t1-cave-01 +50.0% | 179 |
| engagement | `lineage-hammer-engagement` | 1 | +4.4% | +0.0% | t1-swamp-01 -11.1% | t1-cave-01 +37.5% | 219 |
| tempo | `lineage-axe-tempo` | 1 | -0.1% | +5.3% | t1-swamp-01 -7.1% | t1-mountain-04 +5.3% | 507 |
| kill-chain | `lineage-axe-kill-chain` | 1 | +3.1% | -6.7% | t1-forest-01 -10.5% | t1-swamp-03 +25.0% | 345 |
| empowered | `lineage-axe-empowered` | 1 | +0.3% | +0.0% | t1-swamp-01 -7.1% | t1-plains-01 +5.9% | 83 |
| affliction | `lineage-dagger-affliction` | 1 | +9.0% | +8.0% | t1-plains-03 -6.1% | t1-mountain-04 +27.8% | 2288 |
| control | `lineage-dagger-control` | 1 | +7.3% | +0.0% | t1-plains-03 -9.1% | t1-swamp-03 +21.1% | 759 |
| kill-chain | `lineage-dagger-kill-chain` | 1 | +2.2% | +12.5% | t1-forest-03 -23.1% | t1-mountain-04 +16.7% | 47 |

## Frames (design §18.10)

Light / Balanced / Heavy per class root. Lane-less on purpose: design §10 gives
each frame its own feedback loop, so a card on top would be a second variable.
There is no control-relative uplift here and there must not be — every T1
character has bought a frame, so a frame has nothing to be an uplift OVER. The
reading is frame-against-frame inside one root, against the frame that root’s own
canonical T1 route wears.

Not measured on this run (`LANE_FRAMES=0`).

## Survival — what the non-damage lanes buy instead

Control’s slow and Engagement’s opening DR buy time, not throughput, so the
TTK matrix above reads them as worth nothing. This is the same runs read as
survival: mean HP fraction while engaged and damage taken per engaged second,
each against the same lineage’s lane-less control.

| profile | lane | band | class | mean HP while engaged | damage taken / engaged s | deaths | Δ HP vs control | Δ damage taken vs control |
|---|---|---:|---|---:|---:|---:|---:|---:|
| `lineage-broadsword-technique` | technique | 1 | energy | 1.00 | 0.54 | 0 | +0.5% | -14.3% |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 1.00 | 0.69 | 0 | +0.4% | +9.8% |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 1.00 | 0.59 | 0 | +0.4% | -6.0% |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 0.99 | 0.63 | 0 | — | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 0.96 | 8.30 | 0 | -0.0% | -1.3% |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 0.96 | 8.41 | 0 | +0.1% | +0.0% |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 0.97 | 8.29 | 0 | +0.6% | -1.5% |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 0.96 | 8.41 | 0 | — | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 0.98 | 5.77 | 0 | +0.2% | -3.2% |
| `lineage-hammer-control` | control | 1 | cooldown | 0.98 | 5.74 | 0 | +0.3% | -3.6% |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 0.98 | 5.41 | 0 | +0.5% | -9.2% |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 0.98 | 5.96 | 0 | — | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 0.97 | 4.04 | 0 | +0.1% | +0.2% |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 0.98 | 3.83 | 0 | +0.6% | -4.9% |
| `lineage-axe-empowered` | empowered | 1 | dot | 0.97 | 3.98 | 0 | +0.2% | -1.1% |
| `lineage-axe-baseline` | _control_ | 1 | dot | 0.97 | 4.03 | 0 | — | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 0.98 | 4.29 | 0 | +0.5% | -1.8% |
| `lineage-dagger-control` | control | 1 | reload | 0.98 | 4.17 | 0 | +0.4% | -4.6% |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 0.97 | 4.24 | 0 | +0.2% | -2.9% |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 0.97 | 4.37 | 0 | — | — |

## Encounter check (design §18.9) — ordinal

One row per family that has an OWN node: a node where it reaches at least 60% of
the resolved blend, so the encounter really is that family rather than two sharing
it. Lanes are ranked by median uplift; rank 1 is the strongest. The favoured lane
is read off `FamilyDefinition.drops`, which design §18.7 confirms IS the definition
of favours. A family whose favoured lane ranks below its punished lane is a
monster-shape finding for Phase 4, not a magnitude to tune.

| family | own node | tier | band | favoured | rank | punished | rank | margin (fav − pun) | lanes | per-seed fav rank | per-seed top lane | fav deaths | pun deaths |
|---|---|---:|---:|---|---:|---|---:|---:|---:|---|---|---:|---:|
| Brood | `node-t1-cave-01` | 1 | 1 | affliction | 3/7 | tempo | 4/7 | +4.0% | 7 | 2/7 / 7/7 | kill-chain / control | 0 | 0 |
| Brute | `node-t1-cave-02` | 1 | 1 | empowered | 6/6 | affliction | 1/6 | -11.1% | 6 | 6/7 / 6/6 | affliction / engagement | 0 | 0 |
| Deep | `node-t1-cave-03` | 1 | 1 | kill-chain | 2/7 | engagement | 1/7 | -13.2% | 7 | 3/7 / 5/7 | engagement / control | 0 | 0 |
| Canopy | `node-t1-forest-03` | 1 | 1 | affliction | 2/7 | control | 3/7 | +7.7% | 7 | 3/7 / 1/7 | engagement / affliction | 0 | 0 |
| Grove | `node-t1-forest-02` | 1 | 1 | empowered | 1/7 | tempo | 6/7 | +13.3% | 7 | 5/7 / 3/7 | control / affliction | 0 | 0 |
| Pack | `node-t1-forest-01` | 1 | 1 | tempo | 5/7 | empowered | 3/7 | -4.2% | 7 | 4/7 / 5/7 | affliction / engagement | 0 | 0 |
| Crag | `node-t1-mountain-03` | 1 | 1 | empowered | 5/7 | affliction | 3/7 | -0.2% | 7 | 6/7 / 3/7 | engagement / kill-chain | 0 | 0 |
| Hopper | `node-t1-mountain-04` | 1 | 1 | tempo | 5/7 | empowered | 7/7 | +2.6% | 7 | 6/7 / 3/7 | affliction / engagement | 0 | 0 |
| Ridge | `node-t1-mountain-01` | 1 | 1 | control | 7/7 | kill-chain | 2/7 | -2.6% | 7 | 7/7 / 6/7 | affliction / kill-chain | 0 | 0 |
| Herd | `node-t1-plains-01` | 1 | 1 | empowered | 6/7 | tempo | 4/7 | -5.4% | 7 | 6/7 / 5/7 | control / kill-chain | 0 | 0 |
| Sky | `node-t1-plains-03` | 1 | 1 | engagement | 5/7 | affliction | 6/7 | +3.0% | 7 | 5/7 / 3/7 | kill-chain / affliction | 0 | 0 |
| Swarm | `node-t1-plains-04` | 1 | 1 | technique | 1/7 | empowered | 7/7 | +18.4% | 7 | 7/7 / 1/7 | kill-chain / technique | 0 | 0 |
| Coven | `node-t1-swamp-02` | 1 | 1 | control | 1/7 | tempo | 6/7 | +7.7% | 7 | 3/7 / 1/7 | engagement / control | 0 | 0 |
| Mire | `node-t1-swamp-01` | 1 | 1 | affliction | 1/6 | empowered | 4/6 | +5.9% | 6 | 1/7 / 4/5 | affliction / technique | 0 | 0 |
| Stalker | `node-t1-swamp-03` | 1 | 1 | kill-chain | 1/7 | bulwark | no reference | — | 7 | 3/7 / 1/7 | affliction / kill-chain | 0 | 0 |

### Clear `drops` remaps (design §18 3b)

The test, computed rather than eyeballed: the favoured lane ranks LAST on the
family’s own node with BOTH seeds agreeing, and one other lane ranks FIRST with
both seeds. Anything short of that is left alone.

No family meets the test: no `drops` move is CLEAR on this run.

## Refused purchases

None — every lane bought its whole band.

## Per-node detail

### `node-t1-mountain-01` — Ridge 70% / Hopper 20% / Crag 10% (mountain T1; shared by 1 authored node)

Dominant family **Ridge** drops `control`, punishes `kill-chain`. Authored Ridge 70% / Hopper 20% / Crag 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 19 | 5432 | 6.33 | +0.0% | 0 | technique.cast-flare x44 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 20 | 5365 | 6.67 | +5.3% | 0 | kill-chain.kill-pulse x20 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 19 | 5432 | 6.33 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 19 | 5432 | 6.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 17 | 5082 | 5.67 | +0.0% | 0 | tempo.ghost-strike x39 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 18 | 4594 | 6.00 | +5.9% | 0 | affliction.bleed-pips x112 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 19 | 3779 | 6.33 | +11.8% | 0 | engagement.opening-flash x15 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 17 | 5082 | 5.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 19 | 3679 | 6.33 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | 1 | cooldown | 19 | 3679 | 6.33 | +0.0% | 0 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 18 | 3833 | 6.00 | -5.3% | 0 | engagement.brace-sparks x15 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 19 | 3679 | 6.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 14 | 6686 | 4.67 | +0.0% | 0 | tempo.ghost-strike x32 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 14 | 6657 | 4.67 | +0.0% | 0 | kill-chain.kill-pulse x14 |
| `lineage-axe-empowered` | empowered | 1 | dot | 14 | 6571 | 4.67 | +0.0% | 0 | empowered.weak-point x12 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 14 | 6679 | 4.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 17 | 5465 | 5.67 | -5.6% | 0 | affliction.venom-pips x143 |
| `lineage-dagger-control` | control | 1 | reload | 18 | 5250 | 6.00 | +0.0% | 0 | control.frost-drag x50 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 18 | 5622 | 6.00 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 18 | 5528 | 6.00 | — | 0 | — |

### `node-t1-mountain-03` — Crag 70% / Ridge 20% / Hopper 10% (mountain T1; shared by 1 authored node)

Dominant family **Crag** drops `empowered`, punishes `affliction`. Authored Crag 70% / Ridge 20% / Hopper 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 20 | 5335 | 6.67 | +0.0% | 0 | technique.cast-flare x48 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 23 | 4987 | 7.67 | +15.0% | 0 | kill-chain.kill-pulse x23 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 20 | 5335 | 6.67 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 20 | 5335 | 6.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 17 | 4947 | 5.67 | +0.0% | 0 | tempo.ghost-strike x41 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 18 | 4678 | 6.00 | +5.9% | 0 | affliction.bleed-pips x125 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 19 | 4021 | 6.33 | +11.8% | 0 | engagement.opening-flash x15 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 17 | 4947 | 5.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 17 | 4429 | 5.67 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | 1 | cooldown | 17 | 4429 | 5.67 | +0.0% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 17 | 4471 | 5.67 | +0.0% | 0 | engagement.brace-sparks x16 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 17 | 4429 | 5.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 15 | 8093 | 5.00 | +0.0% | 0 | tempo.ghost-strike x44 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 15 | 8107 | 5.00 | +0.0% | 0 | kill-chain.kill-pulse x15 |
| `lineage-axe-empowered` | empowered | 1 | dot | 15 | 7000 | 5.00 | +0.0% | 0 | empowered.weak-point x14 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 15 | 8093 | 5.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 17 | 5494 | 5.67 | -5.6% | 0 | affliction.venom-pips x165 |
| `lineage-dagger-control` | control | 1 | reload | 18 | 5667 | 6.00 | +0.0% | 0 | control.frost-drag x58 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 19 | 5958 | 6.33 | +5.6% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 18 | 6344 | 6.00 | — | 0 | — |

### `node-t1-mountain-04` — Hopper 70% / Crag 20% / Ridge 10% (mountain T1; shared by 1 authored node)

Dominant family **Hopper** drops `tempo`, punishes `empowered`. Authored Hopper 70% / Crag 20% / Ridge 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 21 | 4929 | 7.00 | +0.0% | 0 | technique.cast-flare x44 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 22 | 5141 | 7.33 | +4.8% | 0 | kill-chain.kill-pulse x22 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 21 | 4929 | 7.00 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 21 | 4929 | 7.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 18 | 4583 | 6.00 | +0.0% | 0 | tempo.ghost-strike x39 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 18 | 4456 | 6.00 | +0.0% | 0 | affliction.bleed-pips x114 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 20 | 3675 | 6.67 | +11.1% | 0 | engagement.opening-flash x16 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 18 | 4583 | 6.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 18 | 3600 | 6.00 | +0.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | 1 | cooldown | 18 | 3600 | 6.00 | +0.0% | 0 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 18 | 3600 | 6.00 | +0.0% | 0 | engagement.brace-sparks x15 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 18 | 3600 | 6.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 20 | 5815 | 6.67 | +5.3% | 0 | tempo.ghost-strike x37 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 19 | 5963 | 6.33 | +0.0% | 0 | kill-chain.kill-pulse x19 |
| `lineage-axe-empowered` | empowered | 1 | dot | 20 | 5775 | 6.67 | +5.3% | 0 | empowered.weak-point x6 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 19 | 6068 | 6.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 23 | 4696 | 7.67 | +27.8% | 0 | affliction.venom-pips x162 |
| `lineage-dagger-control` | control | 1 | reload | 19 | 4737 | 6.33 | +5.6% | 0 | control.frost-drag x47 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 21 | 5286 | 7.00 | +16.7% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 18 | 5378 | 6.00 | — | 0 | — |

### `node-t1-cave-01` — Brood 70% / Brute 20% / Deep 10% (cave T1; shared by 1 authored node)

Dominant family **Brood** drops `affliction`, punishes `tempo`. Authored Brood 70% / Brute 20% / Deep 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 37 | 2330 | 12.33 | +0.0% | 0 | technique.cast-flare x44 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 40 | 2100 | 13.33 | +8.1% | 0 | kill-chain.kill-pulse x40 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 37 | 2330 | 12.33 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 37 | 2330 | 12.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 33 | 2179 | 11.00 | +3.1% | 0 | tempo.ghost-strike x35 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 33 | 2179 | 11.00 | +3.1% | 0 | affliction.bleed-pips x107 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 29 | 2231 | 9.67 | -9.4% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 32 | 2244 | 10.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 24 | 2758 | 8.00 | +0.0% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | 1 | cooldown | 36 | 1550 | 12.00 | +50.0% | 0 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 33 | 2033 | 11.00 | +37.5% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 24 | 2758 | 8.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 24 | 3358 | 8.00 | +0.0% | 0 | tempo.ghost-strike x31 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 24 | 3358 | 8.00 | +0.0% | 0 | kill-chain.kill-pulse x24 |
| `lineage-axe-empowered` | empowered | 1 | dot | 24 | 3358 | 8.00 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 24 | 3358 | 8.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 27 | 3037 | 9.00 | +8.0% | 0 | affliction.venom-pips x151 |
| `lineage-dagger-control` | control | 1 | reload | 26 | 3162 | 8.67 | +4.0% | 0 | control.frost-drag x51 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 25 | 3512 | 8.33 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 25 | 3372 | 8.33 | — | 0 | — |

### `node-t1-cave-02` — Brute 70% / Deep 20% / Brood 10% (cave T1; shared by 1 authored node)

Dominant family **Brute** drops `empowered`, punishes `affliction`. Authored Brute 70% / Deep 20% / Brood 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 23 | 4687 | 7.67 | +0.0% | 0 | technique.cast-flare x51 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 24 | 4167 | 8.00 | +4.3% | 0 | kill-chain.kill-pulse x24 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 23 | 4687 | 7.67 | +0.0% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 23 | 4687 | 7.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 12 | 6325 | 4.00 | +0.0% | 0 | tempo.ghost-strike x31 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 11 | 7027 | 3.67 | -8.3% | 0 | affliction.bleed-pips x92 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 13 | 5508 | 4.33 | +8.3% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 12 | 6325 | 4.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 19 | 2947 | 6.33 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | 1 | cooldown | 21 | 2476 | 7.00 | +10.5% | 0 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 21 | 2295 | 7.00 | +10.5% | 0 | engagement.brace-sparks x17 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 19 | 2947 | 6.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 15 | 7273 | 5.00 | +0.0% | 0 | tempo.ghost-strike x39 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 15 | 7367 | 5.00 | +0.0% | 0 | kill-chain.kill-pulse x15 |
| `lineage-axe-empowered` | empowered | 1 | dot | 15 | 7273 | 5.00 | +0.0% | 0 | empowered.weak-point x15 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 15 | 7273 | 5.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 20 | 5240 | 6.67 | +11.1% | 0 | affliction.venom-pips x189 |
| `lineage-dagger-control` | control | 1 | reload | 19 | 5363 | 6.33 | +5.6% | 0 | control.frost-drag x63 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 20 | 5885 | 6.67 | +11.1% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 18 | 5728 | 6.00 | — | 0 | — |

### `node-t1-cave-03` — Deep 70% / Brood 20% / Brute 10% (cave T1; shared by 1 authored node)

Dominant family **Deep** drops `kill-chain`, punishes `engagement`. Authored Deep 70% / Brood 20% / Brute 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 21 | 4286 | 7.00 | +0.0% | 0 | technique.cast-flare x46 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 21 | 4086 | 7.00 | +0.0% | 0 | kill-chain.kill-pulse x21 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 21 | 4286 | 7.00 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 21 | 4286 | 7.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 18 | 3678 | 6.00 | +0.0% | 0 | tempo.ghost-strike x36 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 18 | 3256 | 6.00 | +0.0% | 0 | affliction.bleed-pips x97 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 24 | 2463 | 8.00 | +33.3% | 0 | engagement.opening-flash x17 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 18 | 3678 | 6.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 18 | 2939 | 6.00 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | 1 | cooldown | 19 | 2605 | 6.33 | +5.6% | 0 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 19 | 2605 | 6.33 | +5.6% | 0 | engagement.brace-sparks x16 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 18 | 2939 | 6.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 15 | 4913 | 5.00 | +0.0% | 0 | tempo.ghost-strike x28 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 14 | 5400 | 4.67 | -6.7% | 0 | kill-chain.kill-pulse x14 |
| `lineage-axe-empowered` | empowered | 1 | dot | 15 | 4913 | 5.00 | +0.0% | 0 | empowered.weak-point x10 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 15 | 4913 | 5.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 16 | 4063 | 5.33 | +0.0% | 0 | affliction.venom-pips x111 |
| `lineage-dagger-control` | control | 1 | reload | 17 | 4224 | 5.67 | +6.3% | 0 | control.frost-drag x43 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 18 | 4244 | 6.00 | +12.5% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 16 | 4538 | 5.33 | — | 0 | — |

### `node-t1-forest-01` — Pack 70% / Grove 20% / Canopy 10% (forest T1; shared by 1 authored node)

Dominant family **Pack** drops `tempo`, punishes `empowered`. Authored Pack 70% / Grove 20% / Canopy 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 56 | 1748 | 18.67 | -1.8% | 0 | technique.cast-flare x48 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 42 | 2176 | 14.00 | -26.3% | 0 | kill-chain.kill-pulse x42 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 60 | 1793 | 20.00 | +5.3% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 57 | 1914 | 19.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 48 | 1485 | 16.00 | +2.1% | 0 | tempo.ghost-strike x36 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 48 | 1469 | 16.00 | +2.1% | 0 | affliction.bleed-pips x106 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 46 | 1313 | 15.33 | -2.1% | 0 | engagement.opening-flash x17 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 47 | 1432 | 15.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 39 | 2013 | 13.00 | +8.3% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | 1 | cooldown | 39 | 2013 | 13.00 | +8.3% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 42 | 1802 | 14.00 | +16.7% | 0 | engagement.brace-sparks x16 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 36 | 2119 | 12.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 38 | 2192 | 12.67 | +0.0% | 0 | tempo.ghost-strike x29 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 34 | 2568 | 11.33 | -10.5% | 0 | kill-chain.kill-pulse x34 |
| `lineage-axe-empowered` | empowered | 1 | dot | 38 | 2192 | 12.67 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | 1 | dot | 38 | 2176 | 12.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 44 | 2323 | 14.67 | +7.3% | 0 | affliction.venom-pips x173 |
| `lineage-dagger-control` | control | 1 | reload | 44 | 2184 | 14.67 | +7.3% | 0 | control.frost-drag x55 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 46 | 2133 | 15.33 | +12.2% | 0 | kill-chain.spread-arc x30 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 41 | 2515 | 13.67 | — | 0 | — |

### `node-t1-forest-02` — Grove 70% / Canopy 20% / Pack 10% (forest T1; shared by 1 authored node)

Dominant family **Grove** drops `empowered`, punishes `tempo`. Authored Grove 70% / Canopy 20% / Pack 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 27 | 4074 | 9.00 | +0.0% | 0 | technique.cast-flare x51 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 33 | 3273 | 11.00 | +22.2% | 0 | kill-chain.kill-pulse x33 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 32 | 3025 | 10.67 | +18.5% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 27 | 4033 | 9.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 32 | 2638 | 10.67 | +6.7% | 0 | tempo.ghost-strike x42 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 32 | 2541 | 10.67 | +6.7% | 0 | affliction.bleed-pips x122 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 33 | 2373 | 11.00 | +10.0% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 30 | 2793 | 10.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 28 | 3243 | 9.33 | +16.7% | 0 | empowered.plating-crack x18 |
| `lineage-hammer-control` | control | 1 | cooldown | 28 | 3243 | 9.33 | +16.7% | 0 | control.frost-drag x15 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 27 | 3500 | 9.00 | +12.5% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 24 | 3733 | 8.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 18 | 4956 | 6.00 | +0.0% | 0 | tempo.ghost-strike x29 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 20 | 4570 | 6.67 | +11.1% | 0 | kill-chain.kill-pulse x20 |
| `lineage-axe-empowered` | empowered | 1 | dot | 18 | 4956 | 6.00 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | 1 | dot | 18 | 4956 | 6.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 31 | 3387 | 10.33 | +24.0% | 0 | affliction.venom-pips x168 |
| `lineage-dagger-control` | control | 1 | reload | 28 | 3479 | 9.33 | +12.0% | 0 | control.frost-drag x52 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 23 | 4022 | 7.67 | -8.0% | 0 | kill-chain.spread-arc x2 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 25 | 3736 | 8.33 | — | 0 | — |

### `node-t1-forest-03` — Canopy 70% / Pack 20% / Grove 10% (forest T1; shared by 1 authored node)

Dominant family **Canopy** drops `affliction`, punishes `control`. Authored Canopy 70% / Pack 20% / Grove 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 24 | 3004 | 8.00 | +0.0% | 0 | technique.cast-flare x37 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 30 | 2643 | 10.00 | +25.0% | 0 | kill-chain.kill-pulse x30 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 28 | 2732 | 9.33 | +16.7% | 0 | empowered.weak-point x4 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 24 | 3004 | 8.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 24 | 2617 | 8.00 | +0.0% | 0 | tempo.ghost-strike x30 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 24 | 2617 | 8.00 | +0.0% | 0 | affliction.bleed-pips x90 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 32 | 1963 | 10.67 | +33.3% | 0 | engagement.opening-flash x20 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 24 | 2617 | 8.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 24 | 2396 | 8.00 | +0.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | 1 | cooldown | 24 | 2396 | 8.00 | +0.0% | 0 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 24 | 2392 | 8.00 | +0.0% | 0 | engagement.brace-sparks x20 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 24 | 2829 | 8.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 22 | 3555 | 7.33 | +0.0% | 0 | tempo.ghost-strike x27 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 22 | 3486 | 7.33 | +0.0% | 0 | kill-chain.kill-pulse x22 |
| `lineage-axe-empowered` | empowered | 1 | dot | 22 | 3555 | 7.33 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | 1 | dot | 22 | 3555 | 7.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 31 | 2742 | 10.33 | +19.2% | 0 | affliction.venom-pips x140 |
| `lineage-dagger-control` | control | 1 | reload | 27 | 2815 | 9.00 | +3.8% | 0 | control.frost-drag x42 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 20 | 3400 | 6.67 | -23.1% | 0 | kill-chain.spread-arc x3 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 26 | 2950 | 8.67 | — | 0 | — |

### `node-t1-plains-01` — Herd 70% / Swarm 20% / Sky 10% (plains T1; shared by 1 authored node)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Herd 70% / Swarm 20% / Sky 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 43 | 2121 | 14.33 | -4.4% | 0 | technique.cast-flare x51 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 48 | 2002 | 16.00 | +6.7% | 0 | kill-chain.kill-pulse x48 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 45 | 2053 | 15.00 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 45 | 2053 | 15.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 51 | 1688 | 17.00 | +10.9% | 0 | tempo.ghost-strike x49 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 47 | 1574 | 15.67 | +2.2% | 0 | affliction.bleed-pips x122 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 53 | 1462 | 17.67 | +15.2% | 0 | engagement.opening-flash x11 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 46 | 1643 | 15.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 40 | 2228 | 13.33 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | 1 | cooldown | 40 | 2228 | 13.33 | +0.0% | 0 | control.frost-drag x16 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 40 | 2228 | 13.33 | +0.0% | 0 | engagement.brace-sparks x12 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 40 | 2228 | 13.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 34 | 2991 | 11.33 | +0.0% | 0 | tempo.ghost-strike x40 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 36 | 2881 | 12.00 | +5.9% | 0 | kill-chain.kill-pulse x36 |
| `lineage-axe-empowered` | empowered | 1 | dot | 36 | 2817 | 12.00 | +5.9% | 0 | — |
| `lineage-axe-baseline` | _control_ | 1 | dot | 34 | 2991 | 11.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 41 | 2359 | 13.67 | +10.8% | 0 | affliction.venom-pips x163 |
| `lineage-dagger-control` | control | 1 | reload | 40 | 2268 | 13.33 | +8.1% | 0 | control.frost-drag x52 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 38 | 2258 | 12.67 | +2.7% | 0 | kill-chain.spread-arc x3 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 37 | 2454 | 12.33 | — | 0 | — |

### `node-t1-plains-03` — Sky 70% / Herd 20% / Swarm 10% (plains T1; shared by 1 authored node)

Dominant family **Sky** drops `engagement`, punishes `affliction`. Authored Sky 70% / Herd 20% / Swarm 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 35 | 2854 | 11.67 | +0.0% | 0 | technique.cast-flare x53 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 35 | 2909 | 11.67 | +0.0% | 0 | kill-chain.kill-pulse x35 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 35 | 2854 | 11.67 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 35 | 2854 | 11.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 42 | 1881 | 14.00 | -2.3% | 0 | tempo.ghost-strike x36 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 42 | 1848 | 14.00 | -2.3% | 0 | affliction.bleed-pips x106 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 42 | 1783 | 14.00 | -2.3% | 0 | engagement.opening-flash x16 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 43 | 1874 | 14.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 33 | 2521 | 11.00 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | 1 | cooldown | 33 | 2521 | 11.00 | +0.0% | 0 | control.frost-drag x14 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 33 | 2518 | 11.00 | +0.0% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 33 | 2521 | 11.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 25 | 3680 | 8.33 | +0.0% | 0 | tempo.ghost-strike x33 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 27 | 3811 | 9.00 | +8.0% | 0 | kill-chain.kill-pulse x27 |
| `lineage-axe-empowered` | empowered | 1 | dot | 25 | 3680 | 8.33 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | 1 | dot | 25 | 3680 | 8.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 31 | 2932 | 10.33 | -6.1% | 0 | affliction.venom-pips x127 |
| `lineage-dagger-control` | control | 1 | reload | 30 | 2830 | 10.00 | -9.1% | 0 | control.frost-drag x39 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 32 | 2731 | 10.67 | -3.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 33 | 2933 | 11.00 | — | 0 | — |

### `node-t1-plains-04` — Swarm 70% / Sky 20% / Herd 10% (plains T1; shared by 1 authored node)

Dominant family **Swarm** drops `technique`, punishes `empowered`. Authored Swarm 70% / Sky 20% / Herd 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 58 | 1621 | 19.33 | +18.4% | 0 | technique.cast-flare x54 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 57 | 1654 | 19.00 | +16.3% | 0 | kill-chain.kill-pulse x57 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 49 | 1806 | 16.33 | +0.0% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 49 | 1806 | 16.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 61 | 1315 | 20.33 | +13.0% | 0 | tempo.ghost-strike x43 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 61 | 1315 | 20.33 | +13.0% | 0 | affliction.bleed-pips x131 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 61 | 1315 | 20.33 | +13.0% | 0 | engagement.opening-flash x12 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 54 | 1352 | 18.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 48 | 1798 | 16.00 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | 1 | cooldown | 48 | 1798 | 16.00 | +0.0% | 0 | control.frost-drag x16 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 48 | 1660 | 16.00 | +0.0% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 48 | 1798 | 16.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 44 | 2273 | 14.67 | +0.0% | 0 | tempo.ghost-strike x38 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 49 | 2210 | 16.33 | +11.4% | 0 | kill-chain.kill-pulse x49 |
| `lineage-axe-empowered` | empowered | 1 | dot | 44 | 2273 | 14.67 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | 1 | dot | 44 | 2273 | 14.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 52 | 1731 | 17.33 | +2.0% | 0 | affliction.venom-pips x157 |
| `lineage-dagger-control` | control | 1 | reload | 57 | 1644 | 19.00 | +11.8% | 0 | control.frost-drag x57 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 52 | 1815 | 17.33 | +2.0% | 0 | kill-chain.spread-arc x9 |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 51 | 1888 | 17.00 | — | 0 | — |

### `node-t1-swamp-01` — Mire 70% / Coven 20% / Stalker 10% (swamp T1; shared by 1 authored node)

Dominant family **Mire** drops `affliction`, punishes `empowered`. Authored Mire 70% / Coven 20% / Stalker 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 21 | 3671 | 7.00 | +0.0% | 0 | technique.cast-flare x37 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 20 | 4650 | 6.67 | -4.8% | 0 | kill-chain.kill-pulse x20 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 21 | 3671 | 7.00 | +0.0% | 0 | empowered.weak-point x4 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 21 | 3671 | 7.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 14 | 3893 | 4.67 | +0.0% | 0 | tempo.ghost-strike x25 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 17 | 3829 | 5.67 | +21.4% | 0 | affliction.bleed-pips x96 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 17 | 3494 | 5.67 | +21.4% | 0 | engagement.opening-flash x16 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 14 | 3893 | 4.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 18 | 3044 | 6.00 | +0.0% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | 1 | cooldown | 16 | 3731 | 5.33 | -11.1% | 0 | control.frost-drag x9 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 16 | 3731 | 5.33 | -11.1% | 0 | engagement.brace-sparks x11 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 18 | 3044 | 6.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 13 | 6669 | 4.33 | -7.1% | 0 | tempo.ghost-strike x32 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 15 | 6027 | 5.00 | +7.1% | 0 | kill-chain.kill-pulse x15 |
| `lineage-axe-empowered` | empowered | 1 | dot | 13 | 6669 | 4.33 | -7.1% | 0 | empowered.weak-point x11 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 14 | 6007 | 4.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 18 | 4450 | 6.00 | +5.9% | 0 | affliction.venom-pips x142 |
| `lineage-dagger-control` | control | 1 | reload | 20 | 4330 | 6.67 | +17.6% | 0 | control.frost-drag x54 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 16 | 5294 | 5.33 | -5.9% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 17 | 4924 | 5.67 | — | 0 | — |

### `node-t1-swamp-02` — Coven 70% / Stalker 20% / Mire 10% (swamp T1; shared by 1 authored node)

Dominant family **Coven** drops `control`, punishes `tempo`. Authored Coven 70% / Stalker 20% / Mire 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 32 | 2450 | 10.67 | +0.0% | 0 | technique.cast-flare x45 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 29 | 2783 | 9.67 | -9.4% | 0 | kill-chain.kill-pulse x29 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 32 | 2450 | 10.67 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 32 | 2450 | 10.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 27 | 2837 | 9.00 | +0.0% | 0 | tempo.ghost-strike x33 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 24 | 2883 | 8.00 | -11.1% | 0 | affliction.bleed-pips x91 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 30 | 2547 | 10.00 | +11.1% | 0 | engagement.opening-flash x15 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 27 | 2837 | 9.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 26 | 2865 | 8.67 | +0.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | 1 | cooldown | 26 | 2865 | 8.67 | +0.0% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 26 | 2900 | 8.67 | +0.0% | 0 | engagement.brace-sparks x15 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 26 | 2865 | 8.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 22 | 4427 | 7.33 | +0.0% | 0 | tempo.ghost-strike x35 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 21 | 4638 | 7.00 | -4.5% | 0 | kill-chain.kill-pulse x21 |
| `lineage-axe-empowered` | empowered | 1 | dot | 22 | 4427 | 7.33 | +0.0% | 0 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 22 | 4427 | 7.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 30 | 2463 | 10.00 | +15.4% | 0 | affliction.venom-pips x158 |
| `lineage-dagger-control` | control | 1 | reload | 30 | 2450 | 10.00 | +15.4% | 0 | control.frost-drag x50 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 26 | 3338 | 8.67 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 26 | 3227 | 8.67 | — | 0 | — |

### `node-t1-swamp-03` — Stalker 70% / Mire 20% / Coven 10% (swamp T1; shared by 1 authored node)

Dominant family **Stalker** drops `kill-chain`, punishes `bulwark`. Authored Stalker 70% / Mire 20% / Coven 10%; unfieldable at T1: none.

| profile | lane | band | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-technique` | technique | 1 | energy | 23 | 3239 | 7.67 | +0.0% | 0 | technique.cast-flare x39 |
| `lineage-broadsword-kill-chain` | kill-chain | 1 | energy | 29 | 2697 | 9.67 | +26.1% | 0 | kill-chain.kill-pulse x29 |
| `lineage-broadsword-empowered` | empowered | 1 | energy | 23 | 3239 | 7.67 | +0.0% | 0 | empowered.weak-point x5 |
| `lineage-broadsword-baseline` | _control_ | 1 | energy | 23 | 3239 | 7.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | 1 | cadence | 19 | 2947 | 6.33 | +5.6% | 0 | tempo.ghost-strike x29 |
| `lineage-rapier-affliction` | affliction | 1 | cadence | 21 | 2910 | 7.00 | +16.7% | 0 | affliction.bleed-pips x92 |
| `lineage-rapier-engagement` | engagement | 1 | cadence | 24 | 2400 | 8.00 | +33.3% | 0 | engagement.opening-flash x17 |
| `lineage-rapier-baseline` | _control_ | 1 | cadence | 18 | 3344 | 6.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | 1 | cooldown | 21 | 2695 | 7.00 | +0.0% | 0 | empowered.plating-crack x13 |
| `lineage-hammer-control` | control | 1 | cooldown | 21 | 2695 | 7.00 | +0.0% | 0 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | 1 | cooldown | 21 | 2714 | 7.00 | +0.0% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | 1 | cooldown | 21 | 2695 | 7.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | 1 | dot | 16 | 5450 | 5.33 | +0.0% | 0 | tempo.ghost-strike x33 |
| `lineage-axe-kill-chain` | kill-chain | 1 | dot | 20 | 5095 | 6.67 | +25.0% | 0 | kill-chain.kill-pulse x20 |
| `lineage-axe-empowered` | empowered | 1 | dot | 16 | 5450 | 5.33 | +0.0% | 0 | empowered.weak-point x6 |
| `lineage-axe-baseline` | _control_ | 1 | dot | 16 | 5450 | 5.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | 1 | reload | 23 | 3000 | 7.67 | +21.1% | 0 | affliction.venom-pips x139 |
| `lineage-dagger-control` | control | 1 | reload | 23 | 3052 | 7.67 | +21.1% | 0 | control.frost-drag x46 |
| `lineage-dagger-kill-chain` | kill-chain | 1 | reload | 21 | 3748 | 7.00 | +10.5% | 0 | — |
| `lineage-dagger-baseline` | _control_ | 1 | reload | 19 | 3995 | 6.33 | — | 0 | — |

