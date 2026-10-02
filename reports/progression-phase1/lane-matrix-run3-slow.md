# Lineage lane matrix — Tier 1

Generated 2026-10-01T19:26:36.640Z from `7ae9922925f85032243c8378e4e5e89dc3b71d32`.
20 lane reference profiles x 9 distinct node blends, x 2 seeds (101009, 101033), 270 s of sim per cell per seed; 360 measured runs; wall clock 26.7 min.

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
| `node-t1-cave-01` | 1 | cave | Brood 70% / Brute 20% / Deep 10% | Brood 70% / Brute 20% / Deep 10% | 1 node(s): t1-cave-01 | brood-spiderling x7, cave-brute x2, cave-lurker x1 |
| `node-t1-cave-02` | 1 | cave | Brute 70% / Deep 20% / Brood 10% | Brute 70% / Deep 20% / Brood 10% | 1 node(s): t1-cave-02 | cave-brute x7, cave-lurker x2, brood-spiderling x1 |
| `node-t1-cave-03` | 1 | cave | Deep 70% / Brood 20% / Brute 10% | Deep 70% / Brood 20% / Brute 10% | 1 node(s): t1-cave-03 | cave-lurker x7, brood-spiderling x2, cave-brute x1 |
| `node-t1-forest-03` | 1 | forest | Canopy 70% / Pack 20% / Grove 10% | Canopy 70% / Pack 20% / Grove 10% | 1 node(s): t1-forest-03 | bramble-pod x7, wolf x2, forest-slime x1 |
| `node-t1-plains-03` | 1 | plains | Sky 70% / Herd 20% / Swarm 10% | Sky 70% / Herd 20% / Swarm 10% | 1 node(s): t1-plains-03 | grass-kite x7, boar x2, plains-slime x1 |
| `node-t1-swamp-01` | 1 | swamp | Mire 70% / Coven 20% / Stalker 10% | Mire 70% / Coven 20% / Stalker 10% | 1 node(s): t1-swamp-01 | bog-slime x7, fen-hexer x2, mud-toad x1 |

## TTK per lane per node

Milliseconds of ENGAGED time per kill, pooled over both seeds. Lower is faster.

**Tier 1**

| profile | lane | class | t1-mountain-01 | t1-mountain-02 | t1-mountain-03 | t1-cave-01 | t1-cave-02 | t1-cave-03 | t1-forest-03 | t1-plains-03 | t1-swamp-01 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 7696 | 5672 | 5897 | 2930 | 6946 | 5473 | 2951 | 2753 | 3142 |
| `lineage-broadsword-empowered` | empowered | energy | 7448 | 5878 | 5574 | 2402 | 6165 | 4335 | 2934 | 2667 | 3075 |
| `lineage-broadsword-tempo` | tempo | energy | 7448 | 5878 | 5577 | 2402 | 6165 | 4257 | 2934 | 2656 | 3075 |
| `lineage-broadsword-baseline` | _control_ | energy | 7622 | 6002 | 6229 | 2822 | 6727 | 6018 | 2934 | 2656 | 3075 |
| `lineage-rapier-tempo` | tempo | cadence | 5979 | 5424 | 4983 | 2549 | 6584 | 4218 | 2482 | 2115 | 3094 |
| `lineage-rapier-affliction` | affliction | cadence | 6065 | 5956 | 5443 | 2720 | 6653 | 4561 | 2980 | 2368 | 3071 |
| `lineage-rapier-engagement` | engagement | cadence | 5791 | 5270 | 4697 | 2563 | 5587 | 3925 | 2787 | 1962 | 2900 |
| `lineage-rapier-baseline` | _control_ | cadence | 6891 | 6264 | 5527 | 2740 | 6836 | 4388 | 2980 | 2479 | 3427 |
| `lineage-hammer-empowered` | empowered | cooldown | 5008 | 5343 | 4927 | 2591 | 3913 | 3191 | 3044 | 2831 | 2646 |
| `lineage-hammer-control` | control | cooldown | 4789 | 5089 | 4927 | 2623 | 3673 | 3138 | 3044 | 2831 | 2646 |
| `lineage-hammer-engagement` | engagement | cooldown | 4904 | 5189 | 4956 | 2622 | 3493 | 3637 | 3060 | 2854 | 2671 |
| `lineage-hammer-baseline` | _control_ | cooldown | 5378 | 5400 | 5233 | 2551 | 4056 | 3278 | 3044 | 2965 | 2964 |
| `lineage-axe-tempo` | tempo | dot | 8335 | 8421 | 7258 | 3964 | 7362 | 7032 | 3759 | 3594 | 4733 |
| `lineage-axe-kill-chain` | kill-chain | dot | 8331 | 8243 | 7321 | 4095 | 7260 | 6649 | 4077 | 3687 | 4383 |
| `lineage-axe-empowered` | empowered | dot | 8335 | 8421 | 7258 | 3791 | 7538 | 5775 | 3841 | 3634 | 4733 |
| `lineage-axe-baseline` | _control_ | dot | 8335 | 8421 | 7377 | 3964 | 7362 | 7032 | 3897 | 3594 | 4733 |
| `lineage-dagger-affliction` | affliction | reload | 6438 | 6141 | 5815 | 3051 | 6176 | 4665 | 3364 | 2919 | 3334 |
| `lineage-dagger-control` | control | reload | 5822 | 6169 | 5552 | 2820 | 6039 | 5564 | 3245 | 2866 | 3351 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 7850 | 6240 | 6064 | 3234 | 7121 | 5362 | 3301 | 3198 | 3410 |
| `lineage-dagger-baseline` | _control_ | reload | 7170 | 6248 | 6192 | 3396 | 6821 | 5410 | 3618 | 3227 | 3432 |

### The same table as uplift over each lineage’s own control

**Tier 1**

| profile | lane | class | t1-mountain-01 | t1-mountain-02 | t1-mountain-03 | t1-cave-01 | t1-cave-02 | t1-cave-03 | t1-forest-03 | t1-plains-03 | t1-swamp-01 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-kill-chain` | kill-chain | energy | +2.2% | +6.0% | +0.0% | +2.3% | +0.0% | +6.7% | +6.1% | -4.7% | +3.0% |
| `lineage-broadsword-empowered` | empowered | energy | +6.7% | +2.0% | +5.1% | +8.1% | +6.3% | +22.2% | +0.0% | +1.6% | +0.0% |
| `lineage-broadsword-tempo` | tempo | energy | +6.7% | +2.0% | +11.9% | +8.1% | +6.3% | +24.4% | +0.0% | +0.0% | +0.0% |
| `lineage-rapier-tempo` | tempo | cadence | +6.8% | +31.0% | -3.3% | +8.7% | +2.8% | +4.2% | +8.6% | +8.9% | -1.8% |
| `lineage-rapier-affliction` | affliction | cadence | +11.4% | +7.1% | -6.7% | +1.2% | -5.6% | +2.1% | +0.0% | +5.2% | -30.9% |
| `lineage-rapier-engagement` | engagement | cadence | +6.8% | +33.3% | -1.7% | +2.5% | +8.3% | +10.4% | +3.7% | +8.9% | +9.1% |
| `lineage-hammer-empowered` | empowered | cooldown | +17.8% | +0.0% | +2.0% | +1.3% | +0.0% | +3.9% | +0.0% | +2.0% | +1.9% |
| `lineage-hammer-control` | control | cooldown | +20.0% | +3.7% | +2.0% | -8.0% | -2.2% | +3.9% | +0.0% | +2.0% | +1.9% |
| `lineage-hammer-engagement` | engagement | cooldown | +8.9% | +1.9% | +2.0% | -4.0% | +2.2% | +2.0% | +0.0% | +11.2% | +3.8% |
| `lineage-axe-tempo` | tempo | dot | +0.0% | +0.0% | +2.3% | +0.0% | +0.0% | +0.0% | +5.3% | +0.0% | +0.0% |
| `lineage-axe-kill-chain` | kill-chain | dot | -2.5% | +12.1% | +6.8% | -3.4% | +7.7% | +0.0% | -2.7% | -4.2% | +11.6% |
| `lineage-axe-empowered` | empowered | dot | +0.0% | +0.0% | +2.3% | -1.7% | +0.0% | +8.1% | +0.0% | +0.0% | +0.0% |
| `lineage-dagger-affliction` | affliction | reload | +5.0% | +10.0% | +13.2% | +7.1% | +21.4% | +12.2% | +2.8% | +7.3% | -6.5% |
| `lineage-dagger-control` | control | reload | +22.5% | +20.0% | +18.9% | +24.3% | +21.4% | +2.4% | +4.2% | +6.4% | +8.1% |
| `lineage-dagger-kill-chain` | kill-chain | reload | -5.0% | +5.0% | +0.0% | +4.3% | -7.1% | +2.4% | +8.5% | -7.3% | +11.3% |

## Lane budget (design §18.9)

“The band is the median uplift ±3pp, absolute.” Measured on each lane’s favoured
node — the node its own family dominates hardest — per tier.

**Tier 1.** Median lane uplift on the favoured node: **+6.7%**. The §18.9 band is +3.7% to +9.7% (median ±3 pp). Median absolute throughput there: 5.89 kills/min.

| lane | profile | favoured node | uplift | uplift − median | in ±3 pp (§18.9) | kills/min | in ±10% abs (§9, retired) | shards |
|---|---|---|---:|---:|:--:|---:|:--:|---|
| kill-chain | `lineage-broadsword-kill-chain` | `node-t1-cave-03` | +6.7% | +0.0% | yes | 5.33 | yes | earned |
| empowered | `lineage-broadsword-empowered` | `node-t1-mountain-01` | +6.7% | +0.0% | yes | 5.33 | yes | earned |
| tempo | `lineage-broadsword-tempo` | `node-t1-mountain-03` | +11.9% | +5.2% | NO | 7.33 | NO | earned |
| tempo | `lineage-rapier-tempo` | `node-t1-mountain-03` | -3.3% | -10.0% | NO | 6.44 | yes | earned |
| affliction | `lineage-rapier-affliction` | `node-t1-cave-01` | +1.2% | -5.4% | NO | 9.00 | NO | earned |
| engagement | `lineage-rapier-engagement` | `node-t1-plains-03` | +8.9% | +2.2% | yes | 16.33 | NO | earned |
| empowered | `lineage-hammer-empowered` | `node-t1-mountain-01` | +17.8% | +11.1% | NO | 5.89 | yes | earned |
| control | `lineage-hammer-control` | `node-t1-mountain-02` | +3.7% | -3.0% | yes | 6.22 | yes | earned |
| engagement | `lineage-hammer-engagement` | `node-t1-plains-03` | +11.2% | +4.6% | NO | 12.11 | NO | earned |
| tempo | `lineage-axe-tempo` | `node-t1-mountain-03` | +2.3% | -4.4% | NO | 5.00 | NO | earned |
| kill-chain | `lineage-axe-kill-chain` | `node-t1-cave-03` | +0.0% | -6.7% | NO | 4.11 | NO | earned |
| empowered | `lineage-axe-empowered` | `node-t1-mountain-01` | +0.0% | -6.7% | NO | 4.44 | NO | earned |
| affliction | `lineage-dagger-affliction` | `node-t1-cave-01` | +7.1% | +0.5% | yes | 8.33 | NO | earned |
| control | `lineage-dagger-control` | `node-t1-mountain-02` | +20.0% | +13.3% | NO | 5.33 | yes | earned |
| kill-chain | `lineage-dagger-kill-chain` | `node-t1-cave-03` | +2.4% | -4.2% | NO | 4.67 | NO | earned |

### How much of the absolute column is class, not lane

| control | class | weapon | mean kills/min over all nodes | vs control median |
|---|---|---|---:|---:|
| `lineage-broadsword-baseline` | energy | iron-broadsword | 7.52 | +11.3% |
| `lineage-rapier-baseline` | cadence | flash-rapier | 7.17 | +6.2% |
| `lineage-hammer-baseline` | cooldown | heavy-hammer | 6.75 | +0.0% |
| `lineage-axe-baseline` | dot | chaotic-axe | 5.73 | -15.2% |
| `lineage-dagger-baseline` | reload | ashbrand-blade | 6.52 | -3.5% |

### Lane budget per PACKET — the table `PACKET_BUDGET` is tuned from

Median packet uplift: **+4.1%**. The §18.9 band is +1.1% to +7.1% (median ±3 pp).

| packet | lineages carrying it | mean uplift | − median | in ±3 pp | payoff fx fired | hardest favouring node |
|---|---:|---:|---:|:--:|---:|---|
| control | 2 | +8.4% | +4.3% | NO | 1704 | `node-t1-mountain-02` |
| engagement | 2 | +6.1% | +2.0% | yes | 722 | `node-t1-plains-03` |
| tempo | 3 | +4.9% | +0.8% | yes | 2850 | `node-t1-mountain-03` |
| empowered | 3 | +3.3% | -0.8% | yes | 809 | `node-t1-mountain-01` |
| affliction | 2 | +3.1% | -1.0% | yes | 6879 | `node-t1-cave-01` |
| kill-chain | 3 | +2.2% | -1.9% | yes | 1140 | `node-t1-cave-03` |

### Lane uplift over every node

The same uplift as above, averaged over all node blends rather than only the
favoured one — the reading least sensitive to which single encounter a lane
happened to be measured on.

| lane | profile | mean uplift over all nodes | uplift on favoured node | worst node | best node | payoff fx fired (all nodes) |
|---|---|---:|---:|---|---|---:|
| kill-chain | `lineage-broadsword-kill-chain` | +2.4% | +6.7% | t1-plains-03 -4.7% | t1-cave-03 +6.7% | 619 |
| empowered | `lineage-broadsword-empowered` | +5.8% | +6.7% | t1-forest-03 +0.0% | t1-cave-03 +22.2% | 169 |
| tempo | `lineage-broadsword-tempo` | +6.6% | +11.9% | t1-forest-03 +0.0% | t1-cave-03 +24.4% | 883 |
| tempo | `lineage-rapier-tempo` | +7.3% | -3.3% | t1-mountain-03 -3.3% | t1-mountain-02 +31.0% | 1077 |
| affliction | `lineage-rapier-affliction` | -1.8% | +1.2% | t1-swamp-01 -30.9% | t1-mountain-01 +11.4% | 2852 |
| engagement | `lineage-rapier-engagement` | +9.0% | +8.9% | t1-mountain-03 -1.7% | t1-mountain-02 +33.3% | 347 |
| empowered | `lineage-hammer-empowered` | +3.2% | +17.8% | t1-mountain-02 +0.0% | t1-mountain-01 +17.8% | 436 |
| control | `lineage-hammer-control` | +2.6% | +3.7% | t1-cave-01 -8.0% | t1-mountain-01 +20.0% | 323 |
| engagement | `lineage-hammer-engagement` | +3.1% | +11.2% | t1-cave-01 -4.0% | t1-plains-03 +11.2% | 375 |
| tempo | `lineage-axe-tempo` | +0.8% | +2.3% | t1-mountain-01 +0.0% | t1-forest-03 +5.3% | 890 |
| kill-chain | `lineage-axe-kill-chain` | +2.8% | +0.0% | t1-plains-03 -4.2% | t1-mountain-02 +12.1% | 470 |
| empowered | `lineage-axe-empowered` | +1.0% | +0.0% | t1-cave-01 -1.7% | t1-cave-03 +8.1% | 204 |
| affliction | `lineage-dagger-affliction` | +8.1% | +7.1% | t1-swamp-01 -6.5% | t1-cave-02 +21.4% | 4027 |
| control | `lineage-dagger-control` | +14.2% | +20.0% | t1-cave-03 +2.4% | t1-cave-01 +24.3% | 1381 |
| kill-chain | `lineage-dagger-kill-chain` | +1.3% | +2.4% | t1-plains-03 -7.3% | t1-swamp-01 +11.3% | 51 |

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

| profile | lane | class | mean HP while engaged | damage taken / engaged s | deaths | Δ HP vs control | Δ damage taken vs control |
|---|---|---|---:|---:|---:|---:|---:|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 0.98 | 2.30 | 0 | -0.6% | +0.3% |
| `lineage-broadsword-empowered` | empowered | energy | 0.98 | 2.10 | 0 | +0.1% | -8.8% |
| `lineage-broadsword-tempo` | tempo | energy | 0.98 | 2.06 | 0 | +0.2% | -10.3% |
| `lineage-broadsword-baseline` | _control_ | energy | 0.98 | 2.30 | 0 | — | — |
| `lineage-rapier-tempo` | tempo | cadence | 0.93 | 9.50 | 0 | +0.5% | +1.7% |
| `lineage-rapier-affliction` | affliction | cadence | 0.93 | 9.46 | 0 | +0.7% | +1.2% |
| `lineage-rapier-engagement` | engagement | cadence | 0.93 | 9.21 | 0 | +1.1% | -1.4% |
| `lineage-rapier-baseline` | _control_ | cadence | 0.92 | 9.35 | 0 | — | — |
| `lineage-hammer-empowered` | empowered | cooldown | 0.96 | 6.32 | 0 | +0.4% | -4.6% |
| `lineage-hammer-control` | control | cooldown | 0.96 | 6.52 | 0 | +0.3% | -1.6% |
| `lineage-hammer-engagement` | engagement | cooldown | 0.97 | 5.89 | 0 | +1.0% | -11.1% |
| `lineage-hammer-baseline` | _control_ | cooldown | 0.96 | 6.62 | 0 | — | — |
| `lineage-axe-tempo` | tempo | dot | 0.93 | 5.74 | 1 | -0.0% | +1.1% |
| `lineage-axe-kill-chain` | kill-chain | dot | 0.93 | 5.37 | 0 | +0.8% | -5.5% |
| `lineage-axe-empowered` | empowered | dot | 0.93 | 5.64 | 0 | +0.2% | -0.8% |
| `lineage-axe-baseline` | _control_ | dot | 0.93 | 5.68 | 1 | — | — |
| `lineage-dagger-affliction` | affliction | reload | 0.96 | 5.52 | 0 | +0.6% | -9.4% |
| `lineage-dagger-control` | control | reload | 0.95 | 5.08 | 0 | +0.5% | -16.7% |
| `lineage-dagger-kill-chain` | kill-chain | reload | 0.95 | 5.68 | 0 | +0.3% | -6.7% |
| `lineage-dagger-baseline` | _control_ | reload | 0.95 | 6.09 | 0 | — | — |

## Encounter check (design §18.9) — ordinal

One row per family that has an OWN node: a node where it reaches at least 60% of
the resolved blend, so the encounter really is that family rather than two sharing
it. Lanes are ranked by median uplift; rank 1 is the strongest. The favoured lane
is read off `FamilyDefinition.drops`, which design §18.7 confirms IS the definition
of favours. A family whose favoured lane ranks below its punished lane is a
monster-shape finding for Phase 4, not a magnitude to tune.

| family | own node | tier | favoured | rank | punished | rank | margin (fav − pun) | lanes | per-seed fav rank | per-seed top lane | fav deaths | pun deaths |
|---|---|---:|---|---:|---|---:|---:|---:|---|---|---:|---:|
| Brood | `node-t1-cave-01` | 1 | affliction | 3/6 | tempo | 2/6 | -3.9% | 6 | 2/6 / 6/6 | kill-chain / control | 0 | 0 |
| Brute | `node-t1-cave-02` | 1 | empowered | 6/6 | affliction | 2/6 | -7.9% | 6 | 1/6 / 6/6 | empowered / control | 0 | 0 |
| Deep | `node-t1-cave-03` | 1 | kill-chain | 6/6 | engagement | 3/6 | -3.7% | 6 | 1/6 / 6/6 | kill-chain / engagement | 0 | 0 |
| Canopy | `node-t1-forest-03` | 1 | affliction | 5/6 | control | 3/6 | -0.7% | 6 | 3/6 / 5/6 | kill-chain / engagement | 0 | 0 |
| Crag | `node-t1-mountain-01` | 1 | empowered | 4/6 | affliction | 2/6 | -1.5% | 6 | 5/6 / 1/6 | control / empowered | 0 | 0 |
| Hopper | `node-t1-mountain-03` | 1 | tempo | 4/6 | empowered | 3/6 | +0.0% | 6 | 4/6 / 4/6 | control / control | 0 | 0 |
| Ridge | `node-t1-mountain-02` | 1 | control | 2/6 | kill-chain | 4/6 | +5.9% | 6 | 4/6 / 2/6 | engagement / engagement | 0 | 0 |
| Sky | `node-t1-plains-03` | 1 | engagement | 1/6 | affliction | 2/6 | +3.8% | 6 | 2/6 / 1/6 | control / engagement | 0 | 0 |
| Mire | `node-t1-swamp-01` | 1 | affliction | 6/6 | empowered | 4/6 | -18.7% | 6 | 6/6 / 6/6 | engagement / control | 0 | 0 |

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
| `lineage-broadsword-kill-chain` | kill-chain | energy | 46 | 7696 | 5.11 | +2.2% | 0 | kill-chain.kill-pulse x46 |
| `lineage-broadsword-empowered` | empowered | energy | 48 | 7448 | 5.33 | +6.7% | 0 | empowered.weak-point x22 |
| `lineage-broadsword-tempo` | tempo | energy | 48 | 7448 | 5.33 | +6.7% | 0 | tempo.ghost-strike x114 |
| `lineage-broadsword-baseline` | _control_ | energy | 45 | 7622 | 5.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 47 | 5979 | 5.22 | +6.8% | 0 | tempo.ghost-strike x138 |
| `lineage-rapier-affliction` | affliction | cadence | 49 | 6065 | 5.44 | +11.4% | 0 | affliction.bleed-pips x380 |
| `lineage-rapier-engagement` | engagement | cadence | 47 | 5791 | 5.22 | +6.8% | 0 | engagement.opening-flash x35 |
| `lineage-rapier-baseline` | _control_ | cadence | 44 | 6891 | 4.89 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 53 | 5008 | 5.89 | +17.8% | 0 | empowered.plating-crack x52 |
| `lineage-hammer-control` | control | cooldown | 54 | 4789 | 6.00 | +20.0% | 0 | control.frost-drag x39 |
| `lineage-hammer-engagement` | engagement | cooldown | 49 | 4904 | 5.44 | +8.9% | 0 | engagement.brace-sparks x40 |
| `lineage-hammer-baseline` | _control_ | cooldown | 45 | 5378 | 5.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 40 | 8335 | 4.44 | +0.0% | 0 | tempo.ghost-strike x118 |
| `lineage-axe-kill-chain` | kill-chain | dot | 39 | 8331 | 4.33 | -2.5% | 0 | kill-chain.kill-pulse x39 |
| `lineage-axe-empowered` | empowered | dot | 40 | 8335 | 4.44 | +0.0% | 0 | empowered.weak-point x41 |
| `lineage-axe-baseline` | _control_ | dot | 40 | 8335 | 4.44 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 42 | 6438 | 4.67 | +5.0% | 0 | affliction.venom-pips x436 |
| `lineage-dagger-control` | control | reload | 49 | 5822 | 5.44 | +22.5% | 0 | control.frost-drag x160 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 38 | 7850 | 4.22 | -5.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 40 | 7170 | 4.44 | — | 0 | — |

### `node-t1-mountain-02` — Ridge 70% / Hopper 20% / Crag 10% (mountain T1; shared by 1 authored node)

Dominant family **Ridge** drops `control`, punishes `kill-chain`. Authored Ridge 70% / Hopper 20% / Crag 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 53 | 5672 | 5.89 | +6.0% | 0 | kill-chain.kill-pulse x53 |
| `lineage-broadsword-empowered` | empowered | energy | 51 | 5878 | 5.67 | +2.0% | 0 | empowered.weak-point x18 |
| `lineage-broadsword-tempo` | tempo | energy | 51 | 5878 | 5.67 | +2.0% | 0 | tempo.ghost-strike x92 |
| `lineage-broadsword-baseline` | _control_ | energy | 50 | 6002 | 5.56 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 55 | 5424 | 6.11 | +31.0% | 0 | tempo.ghost-strike x136 |
| `lineage-rapier-affliction` | affliction | cadence | 45 | 5956 | 5.00 | +7.1% | 0 | affliction.bleed-pips x322 |
| `lineage-rapier-engagement` | engagement | cadence | 56 | 5270 | 6.22 | +33.3% | 0 | engagement.opening-flash x34 |
| `lineage-rapier-baseline` | _control_ | cadence | 42 | 6264 | 4.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 54 | 5343 | 6.00 | +0.0% | 0 | empowered.plating-crack x53 |
| `lineage-hammer-control` | control | cooldown | 56 | 5089 | 6.22 | +3.7% | 0 | control.frost-drag x39 |
| `lineage-hammer-engagement` | engagement | cooldown | 55 | 5189 | 6.11 | +1.9% | 0 | engagement.brace-sparks x48 |
| `lineage-hammer-baseline` | _control_ | cooldown | 54 | 5400 | 6.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 33 | 8421 | 3.67 | +0.0% | 0 | tempo.ghost-strike x95 |
| `lineage-axe-kill-chain` | kill-chain | dot | 37 | 8243 | 4.11 | +12.1% | 0 | kill-chain.kill-pulse x37 |
| `lineage-axe-empowered` | empowered | dot | 33 | 8421 | 3.67 | +0.0% | 0 | empowered.weak-point x33 |
| `lineage-axe-baseline` | _control_ | dot | 33 | 8421 | 3.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 44 | 6141 | 4.89 | +10.0% | 0 | affliction.venom-pips x411 |
| `lineage-dagger-control` | control | reload | 48 | 6169 | 5.33 | +20.0% | 0 | control.frost-drag x146 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 42 | 6240 | 4.67 | +5.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 40 | 6248 | 4.44 | — | 0 | — |

### `node-t1-mountain-03` — Hopper 70% / Crag 20% / Ridge 10% (mountain T1; shared by 1 authored node)

Dominant family **Hopper** drops `tempo`, punishes `empowered`. Authored Hopper 70% / Crag 20% / Ridge 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 59 | 5897 | 6.56 | +0.0% | 0 | kill-chain.kill-pulse x59 |
| `lineage-broadsword-empowered` | empowered | energy | 62 | 5574 | 6.89 | +5.1% | 0 | empowered.weak-point x21 |
| `lineage-broadsword-tempo` | tempo | energy | 66 | 5577 | 7.33 | +11.9% | 0 | tempo.ghost-strike x116 |
| `lineage-broadsword-baseline` | _control_ | energy | 59 | 6229 | 6.56 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 58 | 4983 | 6.44 | -3.3% | 0 | tempo.ghost-strike x132 |
| `lineage-rapier-affliction` | affliction | cadence | 56 | 5443 | 6.22 | -6.7% | 0 | affliction.bleed-pips x367 |
| `lineage-rapier-engagement` | engagement | cadence | 59 | 4697 | 6.56 | -1.7% | 0 | engagement.opening-flash x39 |
| `lineage-rapier-baseline` | _control_ | cadence | 60 | 5527 | 6.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 52 | 4927 | 5.78 | +2.0% | 0 | empowered.plating-crack x52 |
| `lineage-hammer-control` | control | cooldown | 52 | 4927 | 5.78 | +2.0% | 0 | control.frost-drag x37 |
| `lineage-hammer-engagement` | engagement | cooldown | 52 | 4956 | 5.78 | +2.0% | 0 | engagement.brace-sparks x42 |
| `lineage-hammer-baseline` | _control_ | cooldown | 51 | 5233 | 5.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 45 | 7258 | 5.00 | +2.3% | 0 | tempo.ghost-strike x113 |
| `lineage-axe-kill-chain` | kill-chain | dot | 47 | 7321 | 5.22 | +6.8% | 0 | kill-chain.kill-pulse x47 |
| `lineage-axe-empowered` | empowered | dot | 45 | 7258 | 5.00 | +2.3% | 0 | empowered.weak-point x45 |
| `lineage-axe-baseline` | _control_ | dot | 44 | 7377 | 4.89 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 60 | 5815 | 6.67 | +13.2% | 0 | affliction.venom-pips x535 |
| `lineage-dagger-control` | control | reload | 63 | 5552 | 7.00 | +18.9% | 0 | control.frost-drag x178 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 53 | 6064 | 5.89 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 53 | 6192 | 5.89 | — | 0 | — |

### `node-t1-cave-01` — Brood 70% / Brute 20% / Deep 10% (cave T1; shared by 1 authored node)

Dominant family **Brood** drops `affliction`, punishes `tempo`. Authored Brood 70% / Brute 20% / Deep 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 88 | 2930 | 9.78 | +2.3% | 0 | kill-chain.kill-pulse x88 |
| `lineage-broadsword-empowered` | empowered | energy | 93 | 2402 | 10.33 | +8.1% | 0 | empowered.weak-point x16 |
| `lineage-broadsword-tempo` | tempo | energy | 93 | 2402 | 10.33 | +8.1% | 0 | tempo.ghost-strike x86 |
| `lineage-broadsword-baseline` | _control_ | energy | 86 | 2822 | 9.56 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 87 | 2549 | 9.67 | +8.7% | 0 | tempo.ghost-strike x112 |
| `lineage-rapier-affliction` | affliction | cadence | 81 | 2720 | 9.00 | +1.2% | 0 | affliction.bleed-pips x299 |
| `lineage-rapier-engagement` | engagement | cadence | 82 | 2563 | 9.11 | +2.5% | 0 | engagement.opening-flash x38 |
| `lineage-rapier-baseline` | _control_ | cadence | 80 | 2740 | 8.89 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 76 | 2591 | 8.44 | +1.3% | 0 | empowered.plating-crack x43 |
| `lineage-hammer-control` | control | cooldown | 69 | 2623 | 7.67 | -8.0% | 0 | control.frost-drag x33 |
| `lineage-hammer-engagement` | engagement | cooldown | 72 | 2622 | 8.00 | -4.0% | 0 | engagement.brace-sparks x38 |
| `lineage-hammer-baseline` | _control_ | cooldown | 75 | 2551 | 8.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 58 | 3964 | 6.44 | +0.0% | 0 | tempo.ghost-strike x89 |
| `lineage-axe-kill-chain` | kill-chain | dot | 56 | 4095 | 6.22 | -3.4% | 0 | kill-chain.kill-pulse x56 |
| `lineage-axe-empowered` | empowered | dot | 57 | 3791 | 6.33 | -1.7% | 0 | empowered.weak-point x10 |
| `lineage-axe-baseline` | _control_ | dot | 58 | 3964 | 6.44 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 75 | 3051 | 8.33 | +7.1% | 0 | affliction.venom-pips x414 |
| `lineage-dagger-control` | control | reload | 87 | 2820 | 9.67 | +24.3% | 0 | control.frost-drag x145 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 73 | 3234 | 8.11 | +4.3% | 0 | kill-chain.spread-arc x11 |
| `lineage-dagger-baseline` | _control_ | reload | 70 | 3396 | 7.78 | — | 0 | — |

### `node-t1-cave-02` — Brute 70% / Deep 20% / Brood 10% (cave T1; shared by 1 authored node)

Dominant family **Brute** drops `empowered`, punishes `affliction`. Authored Brute 70% / Deep 20% / Brood 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 48 | 6946 | 5.33 | +0.0% | 0 | kill-chain.kill-pulse x48 |
| `lineage-broadsword-empowered` | empowered | energy | 51 | 6165 | 5.67 | +6.3% | 0 | empowered.weak-point x21 |
| `lineage-broadsword-tempo` | tempo | energy | 51 | 6165 | 5.67 | +6.3% | 0 | tempo.ghost-strike x109 |
| `lineage-broadsword-baseline` | _control_ | energy | 48 | 6727 | 5.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 37 | 6584 | 4.11 | +2.8% | 0 | tempo.ghost-strike x106 |
| `lineage-rapier-affliction` | affliction | cadence | 34 | 6653 | 3.78 | -5.6% | 0 | affliction.bleed-pips x269 |
| `lineage-rapier-engagement` | engagement | cadence | 39 | 5587 | 4.33 | +8.3% | 0 | engagement.opening-flash x35 |
| `lineage-rapier-baseline` | _control_ | cadence | 36 | 6836 | 4.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 45 | 3913 | 5.00 | +0.0% | 0 | empowered.plating-crack x42 |
| `lineage-hammer-control` | control | cooldown | 44 | 3673 | 4.89 | -2.2% | 0 | control.frost-drag x29 |
| `lineage-hammer-engagement` | engagement | cooldown | 46 | 3493 | 5.11 | +2.2% | 0 | engagement.brace-sparks x41 |
| `lineage-hammer-baseline` | _control_ | cooldown | 45 | 4056 | 5.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 39 | 7362 | 4.33 | +0.0% | 0 | tempo.ghost-strike x107 |
| `lineage-axe-kill-chain` | kill-chain | dot | 42 | 7260 | 4.67 | +7.7% | 0 | kill-chain.kill-pulse x42 |
| `lineage-axe-empowered` | empowered | dot | 39 | 7538 | 4.33 | +0.0% | 0 | empowered.weak-point x37 |
| `lineage-axe-baseline` | _control_ | dot | 39 | 7362 | 4.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 51 | 6176 | 5.67 | +21.4% | 0 | affliction.venom-pips x538 |
| `lineage-dagger-control` | control | reload | 51 | 6039 | 5.67 | +21.4% | 0 | control.frost-drag x174 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 39 | 7121 | 4.33 | -7.1% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 42 | 6821 | 4.67 | — | 0 | — |

### `node-t1-cave-03` — Deep 70% / Brood 20% / Brute 10% (cave T1; shared by 1 authored node)

Dominant family **Deep** drops `kill-chain`, punishes `engagement`. Authored Deep 70% / Brood 20% / Brute 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 48 | 5473 | 5.33 | +6.7% | 0 | kill-chain.kill-pulse x48 |
| `lineage-broadsword-empowered` | empowered | energy | 55 | 4335 | 6.11 | +22.2% | 0 | empowered.weak-point x17 |
| `lineage-broadsword-tempo` | tempo | energy | 56 | 4257 | 6.22 | +24.4% | 0 | tempo.ghost-strike x87 |
| `lineage-broadsword-baseline` | _control_ | energy | 45 | 6018 | 5.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 50 | 4218 | 5.56 | +4.2% | 0 | tempo.ghost-strike x112 |
| `lineage-rapier-affliction` | affliction | cadence | 49 | 4561 | 5.44 | +2.1% | 0 | affliction.bleed-pips x313 |
| `lineage-rapier-engagement` | engagement | cadence | 53 | 3925 | 5.89 | +10.4% | 0 | engagement.opening-flash x42 |
| `lineage-rapier-baseline` | _control_ | cadence | 48 | 4388 | 5.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 53 | 3191 | 5.89 | +3.9% | 0 | empowered.plating-crack x48 |
| `lineage-hammer-control` | control | cooldown | 53 | 3138 | 5.89 | +3.9% | 0 | control.frost-drag x33 |
| `lineage-hammer-engagement` | engagement | cooldown | 52 | 3637 | 5.78 | +2.0% | 0 | engagement.brace-sparks x38 |
| `lineage-hammer-baseline` | _control_ | cooldown | 51 | 3278 | 5.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 37 | 7032 | 4.11 | +0.0% | 0 | tempo.ghost-strike x100 |
| `lineage-axe-kill-chain` | kill-chain | dot | 37 | 6649 | 4.11 | +0.0% | 0 | kill-chain.kill-pulse x37 |
| `lineage-axe-empowered` | empowered | dot | 40 | 5775 | 4.44 | +8.1% | 0 | empowered.weak-point x31 |
| `lineage-axe-baseline` | _control_ | dot | 37 | 7032 | 4.11 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 46 | 4665 | 5.11 | +12.2% | 0 | affliction.venom-pips x402 |
| `lineage-dagger-control` | control | reload | 42 | 5564 | 4.67 | +2.4% | 0 | control.frost-drag x135 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 42 | 5362 | 4.67 | +2.4% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 41 | 5410 | 4.56 | — | 0 | — |

### `node-t1-forest-03` — Canopy 70% / Pack 20% / Grove 10% (forest T1; shared by 1 authored node)

Dominant family **Canopy** drops `affliction`, punishes `control`. Authored Canopy 70% / Pack 20% / Grove 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 87 | 2951 | 9.67 | +6.1% | 0 | kill-chain.kill-pulse x87 |
| `lineage-broadsword-empowered` | empowered | energy | 82 | 2934 | 9.11 | +0.0% | 0 | empowered.weak-point x16 |
| `lineage-broadsword-tempo` | tempo | energy | 82 | 2934 | 9.11 | +0.0% | 0 | tempo.ghost-strike x83 |
| `lineage-broadsword-baseline` | _control_ | energy | 82 | 2934 | 9.11 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 88 | 2482 | 9.78 | +8.6% | 0 | tempo.ghost-strike x103 |
| `lineage-rapier-affliction` | affliction | cadence | 81 | 2980 | 9.00 | +0.0% | 0 | affliction.bleed-pips x304 |
| `lineage-rapier-engagement` | engagement | cadence | 84 | 2787 | 9.33 | +3.7% | 0 | engagement.opening-flash x47 |
| `lineage-rapier-baseline` | _control_ | cadence | 81 | 2980 | 9.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 75 | 3044 | 8.33 | +0.0% | 0 | empowered.plating-crack x49 |
| `lineage-hammer-control` | control | cooldown | 75 | 3044 | 8.33 | +0.0% | 0 | control.frost-drag x36 |
| `lineage-hammer-engagement` | engagement | cooldown | 75 | 3060 | 8.33 | +0.0% | 0 | engagement.brace-sparks x48 |
| `lineage-hammer-baseline` | _control_ | cooldown | 75 | 3044 | 8.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 79 | 3759 | 8.78 | +5.3% | 1 | tempo.ghost-strike x83 |
| `lineage-axe-kill-chain` | kill-chain | dot | 73 | 4077 | 8.11 | -2.7% | 0 | kill-chain.kill-pulse x73 |
| `lineage-axe-empowered` | empowered | dot | 75 | 3841 | 8.33 | +0.0% | 0 | empowered.weak-point x7 |
| `lineage-axe-baseline` | _control_ | dot | 75 | 3897 | 8.33 | — | 1 | — |
| `lineage-dagger-affliction` | affliction | reload | 73 | 3364 | 8.11 | +2.8% | 0 | affliction.venom-pips x396 |
| `lineage-dagger-control` | control | reload | 74 | 3245 | 8.22 | +4.2% | 0 | control.frost-drag x135 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 77 | 3301 | 8.56 | +8.5% | 0 | kill-chain.spread-arc x25 |
| `lineage-dagger-baseline` | _control_ | reload | 71 | 3618 | 7.89 | — | 0 | — |

### `node-t1-plains-03` — Sky 70% / Herd 20% / Swarm 10% (plains T1; shared by 1 authored node)

Dominant family **Sky** drops `engagement`, punishes `affliction`. Authored Sky 70% / Herd 20% / Swarm 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 121 | 2753 | 13.44 | -4.7% | 0 | kill-chain.kill-pulse x121 |
| `lineage-broadsword-empowered` | empowered | energy | 129 | 2667 | 14.33 | +1.6% | 0 | empowered.weak-point x22 |
| `lineage-broadsword-tempo` | tempo | energy | 127 | 2656 | 14.11 | +0.0% | 0 | tempo.ghost-strike x113 |
| `lineage-broadsword-baseline` | _control_ | energy | 127 | 2656 | 14.11 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 147 | 2115 | 16.33 | +8.9% | 0 | tempo.ghost-strike x148 |
| `lineage-rapier-affliction` | affliction | cadence | 142 | 2368 | 15.78 | +5.2% | 0 | affliction.bleed-pips x430 |
| `lineage-rapier-engagement` | engagement | cadence | 147 | 1962 | 16.33 | +8.9% | 0 | engagement.opening-flash x36 |
| `lineage-rapier-baseline` | _control_ | cadence | 135 | 2479 | 15.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 100 | 2831 | 11.11 | +2.0% | 0 | empowered.plating-crack x52 |
| `lineage-hammer-control` | control | cooldown | 100 | 2831 | 11.11 | +2.0% | 0 | control.frost-drag x48 |
| `lineage-hammer-engagement` | engagement | cooldown | 109 | 2854 | 12.11 | +11.2% | 0 | engagement.brace-sparks x36 |
| `lineage-hammer-baseline` | _control_ | cooldown | 98 | 2965 | 10.89 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 95 | 3594 | 10.56 | +0.0% | 0 | tempo.ghost-strike x115 |
| `lineage-axe-kill-chain` | kill-chain | dot | 91 | 3687 | 10.11 | -4.2% | 0 | kill-chain.kill-pulse x91 |
| `lineage-axe-empowered` | empowered | dot | 95 | 3634 | 10.56 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 95 | 3594 | 10.56 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 117 | 2919 | 13.00 | +7.3% | 0 | affliction.venom-pips x530 |
| `lineage-dagger-control` | control | reload | 116 | 2866 | 12.89 | +6.4% | 0 | control.frost-drag x172 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 101 | 3198 | 11.22 | -7.3% | 0 | kill-chain.spread-arc x14 |
| `lineage-dagger-baseline` | _control_ | reload | 109 | 3227 | 12.11 | — | 0 | — |

### `node-t1-swamp-01` — Mire 70% / Coven 20% / Stalker 10% (swamp T1; shared by 1 authored node)

Dominant family **Mire** drops `affliction`, punishes `empowered`. Authored Mire 70% / Coven 20% / Stalker 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 69 | 3142 | 7.67 | +3.0% | 0 | kill-chain.kill-pulse x69 |
| `lineage-broadsword-empowered` | empowered | energy | 67 | 3075 | 7.44 | +0.0% | 0 | empowered.weak-point x16 |
| `lineage-broadsword-tempo` | tempo | energy | 67 | 3075 | 7.44 | +0.0% | 0 | tempo.ghost-strike x83 |
| `lineage-broadsword-baseline` | _control_ | energy | 67 | 3075 | 7.44 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 54 | 3094 | 6.00 | -1.8% | 0 | tempo.ghost-strike x90 |
| `lineage-rapier-affliction` | affliction | cadence | 38 | 3071 | 4.22 | -30.9% | 0 | affliction.bleed-pips x168 |
| `lineage-rapier-engagement` | engagement | cadence | 60 | 2900 | 6.67 | +9.1% | 0 | engagement.opening-flash x41 |
| `lineage-rapier-baseline` | _control_ | cadence | 55 | 3427 | 6.11 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 54 | 2646 | 6.00 | +1.9% | 0 | empowered.plating-crack x45 |
| `lineage-hammer-control` | control | cooldown | 54 | 2646 | 6.00 | +1.9% | 0 | control.frost-drag x29 |
| `lineage-hammer-engagement` | engagement | cooldown | 55 | 2671 | 6.11 | +3.8% | 0 | engagement.brace-sparks x44 |
| `lineage-hammer-baseline` | _control_ | cooldown | 53 | 2964 | 5.89 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 43 | 4733 | 4.78 | +0.0% | 0 | tempo.ghost-strike x70 |
| `lineage-axe-kill-chain` | kill-chain | dot | 48 | 4383 | 5.33 | +11.6% | 0 | kill-chain.kill-pulse x48 |
| `lineage-axe-empowered` | empowered | dot | 43 | 4733 | 4.78 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 43 | 4733 | 4.78 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 58 | 3334 | 6.44 | -6.5% | 0 | affliction.venom-pips x365 |
| `lineage-dagger-control` | control | reload | 67 | 3351 | 7.44 | +8.1% | 0 | control.frost-drag x136 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 69 | 3410 | 7.67 | +11.3% | 0 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | reload | 62 | 3432 | 6.89 | — | 0 | — |

