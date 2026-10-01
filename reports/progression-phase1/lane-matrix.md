# Lineage lane matrix — Tier 1

Generated 2026-09-30T23:18:37.832Z from `105723c6e9ffeb7c59115a1cd54bf4e84eaa586e`.
20 reference profiles x 18 distinct T1 node blends x 2 seeds (101009, 101033), 90 s of sim per cell per seed; wall clock 0.0 min.

Throughput is kills per minute of SIM time with repopulation on; TTK is engaged
milliseconds per kill, which divides out the walk between mobs. Uplift is the
cell against the SAME lineage’s lane-less control on the SAME node — the only
reading in which the lane, and not the class or the weapon, is the variable.

## What the Tier-1 map actually offers

Every T1 node fields only `monsterPoolByTier[1]`, and every biome’s third family
debuts at biome tier 2, so `resolveNodeBlend` drops the unfieldable family and
rescales. The authored blends are the design target; the resolved ones are the
encounters that exist today.

| node | biome | authored blend | resolved blend | shares this row | mobs (of 10 slots) |
|---|---|---|---|---|---|
| `node-t1-mountain-01` | mountain | Crag 70% / Ridge 20% / Hopper 10% | Ridge 67% / Hopper 33% | 1 node(s): mountain-01 | ridge-archer x7, cliff-hopper x3 |
| `node-t1-mountain-02` | mountain | Ridge 70% / Hopper 20% / Crag 10% | Ridge 78% / Hopper 22% | 2 node(s): mountain-02, mountain-04 | ridge-archer x8, cliff-hopper x2 |
| `node-t1-mountain-03` | mountain | Hopper 70% / Crag 20% / Ridge 10% | Hopper 88% / Ridge 13% | 1 node(s): mountain-03 | cliff-hopper x9, ridge-archer x1 |
| `node-t1-mountain-05` | mountain | Crag 34% / Ridge 33% / Hopper 33% | Ridge 50% / Hopper 50% | 1 node(s): mountain-05 | ridge-archer x5, cliff-hopper x5 |
| `node-t1-cave-01` | cave | Brood 70% / Brute 20% / Deep 10% | Brute 67% / Deep 33% | 1 node(s): cave-01 | cave-brute x7, cave-lurker x3 |
| `node-t1-cave-02` | cave | Brute 70% / Deep 20% / Brood 10% | Brute 78% / Deep 22% | 2 node(s): cave-02, cave-04 | cave-brute x8, cave-lurker x2 |
| `node-t1-cave-03` | cave | Deep 70% / Brood 20% / Brute 10% | Deep 88% / Brute 13% | 1 node(s): cave-03 | cave-lurker x9, cave-brute x1 |
| `node-t1-cave-05` | cave | Brood 34% / Brute 33% / Deep 33% | Brute 50% / Deep 50% | 1 node(s): cave-05 | cave-brute x5, cave-lurker x5 |
| `node-t1-cave-06` | cave | Brute 55% / Deep 30% / Brood 15% | Brute 65% / Deep 35% | 1 node(s): cave-06 | cave-brute x6, cave-lurker x4 |
| `node-t1-forest-01` | forest | Pack 70% / Grove 20% / Canopy 10% | Pack 78% / Grove 22% | 1 node(s): forest-01 | wolf x8, forest-slime x2 |
| `node-t1-forest-02` | forest | Grove 70% / Canopy 20% / Pack 10% | Grove 88% / Pack 13% | 1 node(s): forest-02 | forest-slime x9, wolf x1 |
| `node-t1-forest-03` | forest | Canopy 70% / Pack 20% / Grove 10% | Pack 67% / Grove 33% | 1 node(s): forest-03 | wolf x7, forest-slime x3 |
| `node-t1-forest-04` | forest | Pack 45% / Grove 45% / Canopy 10% | Pack 50% / Grove 50% | 2 node(s): forest-04, forest-05 | wolf x5, forest-slime x5 |
| `node-t1-plains-01` | plains | Herd 70% / Swarm 20% / Sky 10% | Herd 78% / Swarm 22% | 1 node(s): plains-01 | boar x8, plains-slime x2 |
| `node-t1-plains-02` | plains | Swarm 70% / Sky 20% / Herd 10% | Swarm 88% / Herd 13% | 1 node(s): plains-02 | plains-slime x9, boar x1 |
| `node-t1-plains-03` | plains | Sky 70% / Herd 20% / Swarm 10% | Herd 67% / Swarm 33% | 1 node(s): plains-03 | boar x7, plains-slime x3 |
| `node-t1-plains-04` | plains | Herd 45% / Swarm 45% / Sky 10% | Herd 50% / Swarm 50% | 2 node(s): plains-04, plains-05 | boar x5, plains-slime x5 |
| `node-t1-swamp-01` | swamp | Mire 70% / Coven 20% / Stalker 10% | Mire 100% | 6 node(s): swamp-01, swamp-02, swamp-03, swamp-04, swamp-05, swamp-06 | bog-slime x5, mud-toad x5 |

## TTK per lane per node

Milliseconds of ENGAGED time per kill, pooled over both seeds. Lower is faster.
Columns are the eighteen distinct blends in the table above.

| profile | lane | class | mountain-01 | mountain-02 | mountain-03 | mountain-05 | cave-01 | cave-02 | cave-03 | cave-05 | cave-06 | forest-01 | forest-02 | forest-03 | forest-04 | plains-01 | plains-02 | plains-03 | plains-04 | swamp-01 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 6118 | 6272 | 6065 | 6145 | 6688 | 7447 | 5333 | 6793 | 6253 | 2404 | 3714 | 3149 | 2672 | 2098 | 1376 | 1839 | 2096 | 3139 |
| `lineage-broadsword-empowered` | empowered | energy | 6147 | 6612 | 6540 | 6268 | 5261 | 5374 | 5319 | 5471 | 5759 | 2368 | 3862 | 2459 | 3078 | 2124 | 1447 | 2062 | 1954 | 2983 |
| `lineage-broadsword-tempo` | tempo | energy | 4482 | 5495 | 6229 | 4533 | 5261 | 5374 | 4728 | 4980 | 5021 | 1960 | 3423 | 2577 | 2377 | 2124 | 1500 | 2100 | 1888 | 2557 |
| `lineage-broadsword-baseline` | _control_ | energy | 5889 | 6612 | 6540 | 6268 | 7013 | 6681 | 5550 | 6275 | 5931 | 2368 | 3862 | 2518 | 2800 | 2124 | 1500 | 2141 | 2142 | 2983 |
| `lineage-rapier-tempo` | tempo | cadence | 5360 | 5659 | 4725 | 4792 | 5869 | 5059 | 4700 | 6592 | 6818 | 1774 | 3418 | 1927 | 1994 | 1668 | 1049 | 1724 | 1428 | 3188 |
| `lineage-rapier-affliction` | affliction | cadence | 5994 | 5919 | 6213 | 5732 | 6392 | 7455 | 5885 | 8382 | 7350 | 2148 | 4139 | 2377 | 2850 | 1900 | 1203 | 1857 | 1761 | 3412 |
| `lineage-rapier-engagement` | engagement | cadence | 5294 | 5788 | 5320 | 5013 | 6323 | 7355 | 5213 | 6492 | 7450 | 2145 | 3860 | 2137 | 2351 | 1859 | 1095 | 1792 | 1704 | 2800 |
| `lineage-rapier-baseline` | _control_ | cadence | 6850 | 6950 | 6247 | 6231 | 7820 | 7645 | 6723 | 8445 | 9380 | 2168 | 4507 | 2460 | 3135 | 1970 | 1214 | 1896 | 2229 | 3412 |
| `lineage-hammer-empowered` | empowered | cooldown | 5528 | 6650 | 5535 | 5421 | 4007 | 4313 | 4044 | 4760 | 5462 | 1990 | 4535 | 2035 | 2838 | 2308 | 1678 | 2473 | 2367 | 3507 |
| `lineage-hammer-control` | control | cooldown | 5532 | 6519 | 5541 | 5633 | 4007 | 4320 | 4044 | 4760 | 5462 | 1990 | 4817 | 2035 | 2838 | 2308 | 1678 | 2473 | 2367 | 3507 |
| `lineage-hammer-engagement` | engagement | cooldown | 5211 | 6763 | 5325 | 5095 | 4054 | 4607 | 4225 | 5100 | 5057 | 2080 | 4825 | 1933 | 2516 | 2250 | 1678 | 2473 | 2427 | 3500 |
| `lineage-hammer-baseline` | _control_ | cooldown | 5528 | 6650 | 5535 | 5421 | 5350 | 6186 | 4044 | 4760 | 5462 | 1990 | 4535 | 2035 | 3021 | 2312 | 1735 | 2429 | 2367 | 3507 |
| `lineage-axe-tempo` | tempo | dot | 7131 | 6736 | 7373 | 7277 | 7907 | 7313 | 6408 | 7938 | 8015 | 2933 | 4595 | 3051 | 3327 | 3032 | 2432 | 2749 | 2846 | 4113 |
| `lineage-axe-kill-chain` | kill-chain | dot | 8292 | 7979 | 7873 | 8485 | 7731 | 8554 | 7533 | 8393 | 9342 | 3058 | 4595 | 3598 | 3528 | 2814 | 2155 | 3127 | 2605 | 4963 |
| `lineage-axe-empowered` | empowered | dot | 7867 | 8031 | 7373 | 8031 | 8317 | 8338 | 8018 | 7938 | 8015 | 3062 | 4480 | 3067 | 3475 | 3194 | 2423 | 3385 | 2853 | 5029 |
| `lineage-axe-baseline` | _control_ | dot | 7654 | 8177 | 7838 | 8287 | 9164 | 8036 | 8100 | 8908 | 9042 | 3171 | 4718 | 3067 | 3475 | 3194 | 2423 | 3385 | 2853 | 5029 |
| `lineage-dagger-affliction` | affliction | reload | 8091 | 7331 | 7643 | 7427 | 7000 | 7433 | 6123 | 7979 | 7207 | 3765 | 4870 | 3831 | 3597 | 3016 | 2202 | 3066 | 2724 | 3862 |
| `lineage-dagger-control` | control | reload | 7262 | 7008 | 7453 | 6675 | 7236 | 7393 | 6467 | 7992 | 7421 | 3450 | 5056 | 4252 | 3955 | 3084 | 1728 | 2890 | 2897 | 3830 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 7700 | 7431 | 7433 | 7387 | 9117 | 8793 | 8108 | 9038 | 8658 | 4345 | 7108 | 4639 | 4519 | 3366 | 2422 | 3040 | 2892 | 4437 |
| `lineage-dagger-baseline` | _control_ | reload | 9200 | 7431 | 7594 | 7194 | 9233 | 8847 | 8182 | 9555 | 8775 | 4393 | 7100 | 4633 | 4873 | 3191 | 2383 | 3403 | 2947 | 4600 |

### The same table as uplift over each lineage’s own control

| profile | lane | class | mountain-01 | mountain-02 | mountain-03 | mountain-05 | cave-01 | cave-02 | cave-03 | cave-05 | cave-06 | forest-01 | forest-02 | forest-03 | forest-04 | plains-01 | plains-02 | plains-03 | plains-04 | swamp-01 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-kill-chain` | kill-chain | energy | -5.6% | +5.9% | +0.0% | +5.3% | +6.7% | -6.3% | +12.5% | -6.3% | +6.3% | +12.2% | -14.3% | +0.0% | +6.8% | +0.0% | -4.6% | +9.8% | -11.3% | -4.2% |
| `lineage-broadsword-empowered` | empowered | energy | -5.6% | +0.0% | +0.0% | +0.0% | +20.0% | +18.8% | +0.0% | +6.3% | +6.3% | +0.0% | +0.0% | +0.0% | -6.8% | +0.0% | +1.5% | +2.0% | +1.9% | +0.0% |
| `lineage-broadsword-tempo` | tempo | energy | +22.2% | +17.6% | +5.0% | +26.3% | +20.0% | +18.8% | +12.5% | +25.0% | +18.8% | +39.0% | +2.4% | +0.0% | +20.5% | +0.0% | +0.0% | +2.0% | +7.5% | +16.7% |
| `lineage-rapier-tempo` | tempo | cadence | +42.9% | +21.4% | +60.0% | +50.0% | +30.0% | +54.5% | +23.1% | +18.2% | +10.0% | +21.1% | +31.0% | +25.7% | +54.8% | +19.1% | +15.4% | +12.5% | +31.7% | -5.9% |
| `lineage-rapier-affliction` | affliction | cadence | +14.3% | +14.3% | +0.0% | +18.8% | +20.0% | +0.0% | +0.0% | +0.0% | +20.0% | +5.3% | +13.8% | +0.0% | +16.1% | +8.5% | +0.0% | +2.1% | +24.4% | +0.0% |
| `lineage-rapier-engagement` | engagement | cadence | +28.6% | +21.4% | +33.3% | +50.0% | +30.0% | +0.0% | +15.4% | +18.2% | +20.0% | +5.3% | +20.7% | +17.1% | +25.8% | +4.3% | +15.4% | +4.2% | +14.6% | +0.0% |
| `lineage-hammer-empowered` | empowered | cooldown | +0.0% | +0.0% | +0.0% | +0.0% | +16.7% | +7.1% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | -4.9% | +6.5% | +0.0% | +0.0% | +0.0% |
| `lineage-hammer-control` | control | cooldown | +5.6% | +0.0% | +0.0% | -5.3% | +16.7% | +7.1% | +0.0% | +0.0% | +0.0% | +0.0% | -7.7% | +0.0% | +0.0% | -4.9% | +6.5% | +0.0% | +0.0% | +0.0% |
| `lineage-hammer-engagement` | engagement | cooldown | +5.6% | +0.0% | -5.9% | +0.0% | +8.3% | +0.0% | +0.0% | -6.7% | +7.7% | +0.0% | -7.7% | +0.0% | +11.8% | -7.3% | +6.5% | +0.0% | +4.8% | +0.0% |
| `lineage-axe-tempo` | tempo | dot | +0.0% | +7.7% | -6.3% | -13.3% | +27.3% | +7.1% | +18.2% | +8.3% | +8.3% | +7.1% | +2.6% | +18.2% | -8.3% | +3.0% | -7.5% | +37.0% | +8.3% | +14.3% |
| `lineage-axe-kill-chain` | kill-chain | dot | -7.7% | +7.7% | -6.3% | -13.3% | +18.2% | -7.1% | +9.1% | +16.7% | +0.0% | +42.9% | +2.6% | +30.3% | -19.4% | +6.1% | +22.5% | +11.1% | +11.1% | +14.3% |
| `lineage-axe-empowered` | empowered | dot | -7.7% | +0.0% | -6.3% | -13.3% | +9.1% | -7.1% | +0.0% | +8.3% | +8.3% | +3.6% | +5.3% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-dagger-affliction` | affliction | reload | +0.0% | +0.0% | -12.5% | -6.3% | +8.3% | +0.0% | +18.2% | +27.3% | +16.7% | +23.3% | +30.4% | +20.0% | +6.1% | +11.8% | +7.5% | -2.6% | +7.9% | +16.7% |
| `lineage-dagger-control` | control | reload | +18.2% | -7.7% | +6.3% | +0.0% | +16.7% | +0.0% | +9.1% | +18.2% | +16.7% | +33.3% | +47.8% | +3.3% | +15.2% | +8.8% | +42.5% | +7.7% | -2.6% | +11.1% |
| `lineage-dagger-kill-chain` | kill-chain | reload | +18.2% | +0.0% | -6.3% | -6.3% | +0.0% | -6.7% | +9.1% | +18.2% | +0.0% | +10.0% | +8.7% | +10.0% | +12.1% | +2.9% | +15.0% | +2.6% | +0.0% | +5.6% |

## Lane budget (design §9)

“At full rows for a tier, each lane’s measured throughput lands within ±10% of the
tier median on that lane’s intended variant.”

Median absolute throughput on the favoured node: **6.00 kills/min**. Median lane uplift over the matching control: **+5.0%**.

| lane | profile | favoured node | kills/min | vs abs median | uplift | uplift − median | in ±10% (abs) | shards |
|---|---|---|---:|---:|---:|---:|:--:|---|
| kill-chain | `lineage-broadsword-kill-chain` | `node-t1-cave-03` | 6.00 | +0.0% | +12.5% | +7.5% | yes | earned |
| empowered | `lineage-broadsword-empowered` | `node-t1-forest-02` | 14.00 | +133.3% | +0.0% | -5.0% | NO | earned |
| tempo | `lineage-broadsword-tempo` | `node-t1-mountain-03` | 7.00 | +16.7% | +5.0% | +0.0% | NO | earned |
| tempo | `lineage-rapier-tempo` | `node-t1-mountain-03` | 8.00 | +33.3% | +60.0% | +55.0% | NO | earned |
| affliction | `lineage-rapier-affliction` | `node-t1-swamp-01` | 5.67 | -5.6% | +0.0% | -5.0% | yes | earned |
| engagement | `lineage-rapier-engagement` | **no T1 node favours this lane** | — | — | — | — | n/a | granted (no T1 source) |
| empowered | `lineage-hammer-empowered` | `node-t1-forest-02` | 8.67 | +44.4% | +0.0% | -5.0% | NO | earned |
| control | `lineage-hammer-control` | `node-t1-mountain-02` | 5.33 | -11.1% | +0.0% | -5.0% | NO | earned |
| engagement | `lineage-hammer-engagement` | **no T1 node favours this lane** | — | — | — | — | n/a | granted (no T1 source) |
| tempo | `lineage-axe-tempo` | `node-t1-mountain-03` | 5.00 | -16.7% | -6.3% | -11.3% | NO | earned |
| kill-chain | `lineage-axe-kill-chain` | `node-t1-cave-03` | 4.00 | -33.3% | +9.1% | +4.1% | NO | earned |
| empowered | `lineage-axe-empowered` | `node-t1-forest-02` | 13.33 | +122.2% | +5.3% | +0.3% | NO | earned |
| affliction | `lineage-dagger-affliction` | `node-t1-swamp-01` | 7.00 | +16.7% | +16.7% | +11.7% | NO | earned |
| control | `lineage-dagger-control` | `node-t1-mountain-02` | 4.00 | -33.3% | -7.7% | -12.7% | NO | earned |
| kill-chain | `lineage-dagger-kill-chain` | `node-t1-cave-03` | 4.00 | -33.3% | +9.1% | +4.1% | NO | earned |

### How much of the absolute column is class, not lane

| control | class | weapon | mean kills/min over all nodes | vs control median |
|---|---|---|---:|---:|
| `lineage-broadsword-baseline` | energy | iron-broadsword | 10.41 | +20.9% |
| `lineage-rapier-baseline` | cadence | flash-rapier | 8.61 | +0.0% |
| `lineage-hammer-baseline` | cooldown | heavy-hammer | 8.76 | +1.7% |
| `lineage-axe-baseline` | dot | chaotic-axe | 7.44 | -13.5% |
| `lineage-dagger-baseline` | reload | ashbrand-blade | 7.44 | -13.5% |

### Lane budget per PACKET — the table `PACKET_BUDGET` is tuned from

Median packet uplift: **+8.2%**. The ±10% band is +7.4% to +9.1%.

| packet | lineages carrying it | mean uplift | x median | in ±10% | payoff fx fired | has a favouring T1 node |
|---|---:|---:|---:|:--:|---:|---|
| tempo | 3 | +16.7% | 2.03x | NO | 1921 | `node-t1-mountain-03` |
| engagement | 2 | +9.5% | 1.15x | NO | 452 | **none** |
| affliction | 2 | +9.2% | 1.11x | NO | 4563 | `node-t1-swamp-01` |
| control | 2 | +7.3% | 0.89x | NO | 1016 | `node-t1-mountain-02` |
| kill-chain | 3 | +4.5% | 0.55x | NO | 838 | `node-t1-cave-03` |
| empowered | 3 | +1.3% | 0.16x | NO | 535 | `node-t1-forest-02` |

### Lane uplift over every node

The same uplift as above, averaged over all node blends rather than only the
favoured one — the reading least sensitive to which single encounter a lane
happened to be measured on.

| lane | profile | mean uplift over all nodes | uplift on favoured node | worst node | best node | payoff fx fired (all nodes) |
|---|---|---:|---:|---|---|---:|
| kill-chain | `lineage-broadsword-kill-chain` | +0.7% | +12.5% | forest-02 -14.3% | cave-03 +12.5% | 506 |
| empowered | `lineage-broadsword-empowered` | +2.5% | +0.0% | forest-04 -6.8% | cave-01 +20.0% | 138 |
| tempo | `lineage-broadsword-tempo` | +14.1% | +5.0% | forest-03 +0.0% | forest-01 +39.0% | 579 |
| tempo | `lineage-rapier-tempo` | +28.6% | +60.0% | swamp-01 -5.9% | mountain-03 +60.0% | 770 |
| affliction | `lineage-rapier-affliction` | +8.7% | +0.0% | mountain-03 +0.0% | plains-04 +24.4% | 2095 |
| engagement | `lineage-rapier-engagement` | +18.0% | — | cave-02 +0.0% | mountain-05 +50.0% | 221 |
| empowered | `lineage-hammer-empowered` | +1.4% | +0.0% | plains-01 -4.9% | cave-01 +16.7% | 278 |
| control | `lineage-hammer-control` | +1.0% | +0.0% | forest-02 -7.7% | cave-01 +16.7% | 237 |
| engagement | `lineage-hammer-engagement` | +0.9% | — | forest-02 -7.7% | forest-04 +11.8% | 231 |
| tempo | `lineage-axe-tempo` | +7.3% | -6.3% | mountain-05 -13.3% | plains-03 +37.0% | 572 |
| kill-chain | `lineage-axe-kill-chain` | +7.7% | +9.1% | forest-04 -19.4% | forest-01 +42.9% | 332 |
| empowered | `lineage-axe-empowered` | +0.0% | +5.3% | mountain-05 -13.3% | cave-01 +9.1% | 119 |
| affliction | `lineage-dagger-affliction` | +9.6% | +16.7% | mountain-03 -12.5% | forest-02 +30.4% | 2468 |
| control | `lineage-dagger-control` | +13.6% | -7.7% | mountain-02 -7.7% | forest-02 +47.8% | 779 |
| kill-chain | `lineage-dagger-kill-chain` | +5.2% | +9.1% | cave-02 -6.7% | cave-05 +18.2% | 0 |

## Encounter check (design §9)

“Does the intended lane win by ~30%? Does the punished lane still clear?” The
favoured lane is read off `FamilyDefinition.drops`; the shipped family table has
no `favours` field.

| family | node | favoured | punished | fav abs Δ | fav uplift Δ | pun abs Δ | pun uplift Δ | pun ≥70% | pun deaths | verdict (abs) |
|---|---|---|---|---:|---:|---:|---:|:--:|---:|---|
| Ridge | `node-t1-mountain-01` | control (n=2) | kill-chain (n=3) | -5.9% | +6.3% | -23.5% | -11.1% | yes | 0 | favoured lane does NOT win by ~30% |
| Ridge | `node-t1-mountain-02` | control (n=2) | kill-chain (n=3) | -12.5% | -3.8% | -12.5% | +5.9% | yes | 1 | favoured lane does NOT win by ~30% |
| Hopper | `node-t1-mountain-03` | tempo (n=3) | empowered (n=3) | +23.5% | +5.0% | +0.0% | +0.0% | yes | 0 | favoured lane does NOT win by ~30% |
| Ridge | `node-t1-mountain-05` | control (n=2) | kill-chain (n=3) | -10.5% | -2.6% | -21.1% | -6.3% | yes | 0 | favoured lane does NOT win by ~30% |
| Brute | `node-t1-cave-01` | empowered (n=3) | affliction (n=2) | +7.7% | +0.0% | -3.8% | -2.5% | yes | 0 | favoured lane does NOT win by ~30% |
| Brute | `node-t1-cave-02` | empowered (n=3) | affliction (n=2) | +0.0% | +7.1% | -13.3% | +0.0% | yes | 0 | favoured lane does NOT win by ~30% |
| Deep | `node-t1-cave-03` | kill-chain (n=3) | engagement (n=2) | -20.0% | +0.0% | +3.3% | -1.4% | yes | 0 | favoured lane does NOT win by ~30% |
| Brute | `node-t1-cave-05` | empowered (n=3) | affliction (n=2) | +7.1% | -2.1% | -10.7% | +5.3% | yes | 0 | favoured lane does NOT win by ~30% |
| Brute | `node-t1-cave-06` | empowered (n=3) | affliction (n=2) | +0.0% | -2.1% | +0.0% | +10.0% | yes | 0 | favoured lane does NOT win by ~30% |
| Pack | `node-t1-forest-01` | tempo (n=3) | empowered (n=3) | +15.0% | +13.9% | +2.5% | -7.1% | yes | 2 | favoured lane does NOT win by ~30% |
| Grove | `node-t1-forest-02` | empowered (n=3) | tempo (n=3) | +14.3% | -2.6% | +11.4% | +0.0% | yes | 9 | favoured lane does NOT win by ~30% |
| Pack | `node-t1-forest-03` | tempo (n=3) | empowered (n=3) | +0.0% | +18.2% | +0.0% | +0.0% | yes | 3 | favoured lane does NOT win by ~30% |
| Pack | `node-t1-forest-04` | tempo (n=3) | empowered (n=3) | +29.7% | +13.6% | -2.7% | -6.8% | yes | 5 | favoured lane wins |
| Herd | `node-t1-plains-01` | empowered (n=3) | tempo (n=3) | +0.0% | -2.9% | +28.2% | +0.1% | yes | 0 | favoured lane does NOT win by ~30% |
| Swarm | `node-t1-plains-02` | tempo (n=3) | empowered (n=3) | +32.7% | -6.5% | +0.0% | -5.0% | yes | 0 | favoured lane wins |
| Herd | `node-t1-plains-03` | empowered (n=3) | tempo (n=3) | +0.0% | -2.1% | +15.6% | +10.4% | yes | 0 | favoured lane does NOT win by ~30% |
| Herd | `node-t1-plains-04` | empowered (n=3) | tempo (n=3) | +0.0% | -4.8% | +28.6% | +3.6% | yes | 0 | favoured lane does NOT win by ~30% |
| Mire | `node-t1-swamp-01` | affliction (n=2) | empowered (n=3) | +11.8% | +8.3% | -11.8% | +0.0% | yes | 0 | favoured lane does NOT win by ~30% |

## Refused purchases

None — every lane bought its whole band.

## Per-node detail

### `node-t1-mountain-01` — Ridge 67% / Hopper 33% (mountain; shared by 1 authored node)

Dominant family **Ridge** drops `control`, punishes `kill-chain`. Authored Crag 70% / Ridge 20% / Hopper 10%; unfieldable at T1: Crag.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 17 | 6118 | 5.67 | -5.6% | 0 | kill-chain.kill-pulse x17 |
| `lineage-broadsword-empowered` | empowered | energy | 17 | 6147 | 5.67 | -5.6% | 0 | empowered.weak-point x8 |
| `lineage-broadsword-tempo` | tempo | energy | 22 | 4482 | 7.33 | +22.2% | 0 | tempo.ghost-strike x31 |
| `lineage-broadsword-baseline` | _control_ | energy | 18 | 5889 | 6.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 20 | 5360 | 6.67 | +42.9% | 0 | tempo.ghost-strike x47 |
| `lineage-rapier-affliction` | affliction | cadence | 16 | 5994 | 5.33 | +14.3% | 0 | affliction.bleed-pips x115 |
| `lineage-rapier-engagement` | engagement | cadence | 18 | 5294 | 6.00 | +28.6% | 0 | engagement.opening-flash x14 |
| `lineage-rapier-baseline` | _control_ | cadence | 14 | 6850 | 4.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 18 | 5528 | 6.00 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | cooldown | 19 | 5532 | 6.33 | +5.6% | 0 | control.frost-drag x14 |
| `lineage-hammer-engagement` | engagement | cooldown | 19 | 5211 | 6.33 | +5.6% | 0 | engagement.brace-sparks x15 |
| `lineage-hammer-baseline` | _control_ | cooldown | 18 | 5528 | 6.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 13 | 7131 | 4.33 | +0.0% | 0 | tempo.ghost-strike x31 |
| `lineage-axe-kill-chain` | kill-chain | dot | 12 | 8292 | 4.00 | -7.7% | 0 | kill-chain.kill-pulse x12 |
| `lineage-axe-empowered` | empowered | dot | 12 | 7867 | 4.00 | -7.7% | 0 | empowered.weak-point x11 |
| `lineage-axe-baseline` | _control_ | dot | 13 | 7654 | 4.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 11 | 8091 | 3.67 | +0.0% | 0 | affliction.venom-pips x120 |
| `lineage-dagger-control` | control | reload | 13 | 7262 | 4.33 | +18.2% | 0 | control.frost-drag x43 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 13 | 7700 | 4.33 | +18.2% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 11 | 9200 | 3.67 | — | 0 | — |

### `node-t1-mountain-02` — Ridge 78% / Hopper 22% (mountain; shared by 2 authored nodes)

Dominant family **Ridge** drops `control`, punishes `kill-chain`. Authored Ridge 70% / Hopper 20% / Crag 10%; unfieldable at T1: Crag.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 18 | 6272 | 6.00 | +5.9% | 0 | kill-chain.kill-pulse x18 |
| `lineage-broadsword-empowered` | empowered | energy | 17 | 6612 | 5.67 | +0.0% | 0 | empowered.weak-point x8 |
| `lineage-broadsword-tempo` | tempo | energy | 20 | 5495 | 6.67 | +17.6% | 0 | tempo.ghost-strike x34 |
| `lineage-broadsword-baseline` | _control_ | energy | 17 | 6612 | 5.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 17 | 5659 | 5.67 | +21.4% | 0 | tempo.ghost-strike x44 |
| `lineage-rapier-affliction` | affliction | cadence | 16 | 5919 | 5.33 | +14.3% | 0 | affliction.bleed-pips x116 |
| `lineage-rapier-engagement` | engagement | cadence | 17 | 5788 | 5.67 | +21.4% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | cadence | 14 | 6950 | 4.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 16 | 6650 | 5.33 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | cooldown | 16 | 6519 | 5.33 | +0.0% | 0 | control.frost-drag x14 |
| `lineage-hammer-engagement` | engagement | cooldown | 16 | 6763 | 5.33 | +0.0% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | cooldown | 16 | 6650 | 5.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 14 | 6736 | 4.67 | +7.7% | 0 | tempo.ghost-strike x32 |
| `lineage-axe-kill-chain` | kill-chain | dot | 14 | 7979 | 4.67 | +7.7% | 1 | kill-chain.kill-pulse x8 |
| `lineage-axe-empowered` | empowered | dot | 13 | 8031 | 4.33 | +0.0% | 1 | empowered.weak-point x8 |
| `lineage-axe-baseline` | _control_ | dot | 13 | 8177 | 4.33 | — | 1 | — |
| `lineage-dagger-affliction` | affliction | reload | 13 | 7331 | 4.33 | +0.0% | 0 | affliction.venom-pips x134 |
| `lineage-dagger-control` | control | reload | 12 | 7008 | 4.00 | -7.7% | 0 | control.frost-drag x42 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 13 | 7431 | 4.33 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 13 | 7431 | 4.33 | — | 0 | — |

### `node-t1-mountain-03` — Hopper 88% / Ridge 13% (mountain; shared by 1 authored node)

Dominant family **Hopper** drops `tempo`, punishes `empowered`. Authored Hopper 70% / Crag 20% / Ridge 10%; unfieldable at T1: Crag.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 20 | 6065 | 6.67 | +0.0% | 0 | kill-chain.kill-pulse x20 |
| `lineage-broadsword-empowered` | empowered | energy | 20 | 6540 | 6.67 | +0.0% | 0 | empowered.weak-point x10 |
| `lineage-broadsword-tempo` | tempo | energy | 21 | 6229 | 7.00 | +5.0% | 0 | tempo.ghost-strike x40 |
| `lineage-broadsword-baseline` | _control_ | energy | 20 | 6540 | 6.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 24 | 4725 | 8.00 | +60.0% | 0 | tempo.ghost-strike x51 |
| `lineage-rapier-affliction` | affliction | cadence | 15 | 6213 | 5.00 | +0.0% | 0 | affliction.bleed-pips x103 |
| `lineage-rapier-engagement` | engagement | cadence | 20 | 5320 | 6.67 | +33.3% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | cadence | 15 | 6247 | 5.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 17 | 5535 | 5.67 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | cooldown | 17 | 5541 | 5.67 | +0.0% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | cooldown | 16 | 5325 | 5.33 | -5.9% | 0 | engagement.brace-sparks x11 |
| `lineage-hammer-baseline` | _control_ | cooldown | 17 | 5535 | 5.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 15 | 7373 | 5.00 | -6.3% | 0 | tempo.ghost-strike x37 |
| `lineage-axe-kill-chain` | kill-chain | dot | 15 | 7873 | 5.00 | -6.3% | 1 | kill-chain.kill-pulse x11 |
| `lineage-axe-empowered` | empowered | dot | 15 | 7373 | 5.00 | -6.3% | 0 | empowered.weak-point x15 |
| `lineage-axe-baseline` | _control_ | dot | 16 | 7838 | 5.33 | — | 1 | — |
| `lineage-dagger-affliction` | affliction | reload | 14 | 7643 | 4.67 | -12.5% | 0 | affliction.venom-pips x141 |
| `lineage-dagger-control` | control | reload | 17 | 7453 | 5.67 | +6.3% | 1 | control.frost-drag x51 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 15 | 7433 | 5.00 | -6.3% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 16 | 7594 | 5.33 | — | 1 | — |

### `node-t1-mountain-05` — Ridge 50% / Hopper 50% (mountain; shared by 1 authored node)

Dominant family **Ridge** drops `control`, punishes `kill-chain`. Authored Crag 34% / Ridge 33% / Hopper 33%; unfieldable at T1: Crag.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 20 | 6145 | 6.67 | +5.3% | 0 | kill-chain.kill-pulse x20 |
| `lineage-broadsword-empowered` | empowered | energy | 19 | 6268 | 6.33 | +0.0% | 0 | empowered.weak-point x9 |
| `lineage-broadsword-tempo` | tempo | energy | 24 | 4533 | 8.00 | +26.3% | 0 | tempo.ghost-strike x34 |
| `lineage-broadsword-baseline` | _control_ | energy | 19 | 6268 | 6.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 24 | 4792 | 8.00 | +50.0% | 0 | tempo.ghost-strike x52 |
| `lineage-rapier-affliction` | affliction | cadence | 19 | 5732 | 6.33 | +18.8% | 0 | affliction.bleed-pips x132 |
| `lineage-rapier-engagement` | engagement | cadence | 24 | 5013 | 8.00 | +50.0% | 0 | engagement.opening-flash x7 |
| `lineage-rapier-baseline` | _control_ | cadence | 16 | 6231 | 5.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 19 | 5421 | 6.33 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | cooldown | 18 | 5633 | 6.00 | -5.3% | 0 | control.frost-drag x14 |
| `lineage-hammer-engagement` | engagement | cooldown | 19 | 5095 | 6.33 | +0.0% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | cooldown | 19 | 5421 | 6.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 13 | 7277 | 4.33 | -13.3% | 0 | tempo.ghost-strike x31 |
| `lineage-axe-kill-chain` | kill-chain | dot | 13 | 8485 | 4.33 | -13.3% | 0 | kill-chain.kill-pulse x13 |
| `lineage-axe-empowered` | empowered | dot | 13 | 8031 | 4.33 | -13.3% | 0 | empowered.weak-point x13 |
| `lineage-axe-baseline` | _control_ | dot | 15 | 8287 | 5.00 | — | 1 | — |
| `lineage-dagger-affliction` | affliction | reload | 15 | 7427 | 5.00 | -6.3% | 0 | affliction.venom-pips x147 |
| `lineage-dagger-control` | control | reload | 16 | 6675 | 5.33 | +0.0% | 0 | control.frost-drag x49 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 15 | 7387 | 5.00 | -6.3% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 16 | 7194 | 5.33 | — | 0 | — |

### `node-t1-cave-01` — Brute 67% / Deep 33% (cave; shared by 1 authored node)

Dominant family **Brute** drops `empowered`, punishes `affliction`. Authored Brood 70% / Brute 20% / Deep 10%; unfieldable at T1: Brood.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 16 | 6688 | 5.33 | +6.7% | 0 | kill-chain.kill-pulse x16 |
| `lineage-broadsword-empowered` | empowered | energy | 18 | 5261 | 6.00 | +20.0% | 0 | empowered.weak-point x9 |
| `lineage-broadsword-tempo` | tempo | energy | 18 | 5261 | 6.00 | +20.0% | 0 | tempo.ghost-strike x33 |
| `lineage-broadsword-baseline` | _control_ | energy | 15 | 7013 | 5.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 13 | 5869 | 4.33 | +30.0% | 0 | tempo.ghost-strike x35 |
| `lineage-rapier-affliction` | affliction | cadence | 12 | 6392 | 4.00 | +20.0% | 0 | affliction.bleed-pips x100 |
| `lineage-rapier-engagement` | engagement | cadence | 13 | 6323 | 4.33 | +30.0% | 0 | engagement.opening-flash x14 |
| `lineage-rapier-baseline` | _control_ | cadence | 10 | 7820 | 3.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 14 | 4007 | 4.67 | +16.7% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | cooldown | 14 | 4007 | 4.67 | +16.7% | 0 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | cooldown | 13 | 4054 | 4.33 | +8.3% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | cooldown | 12 | 5350 | 4.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 14 | 7907 | 4.67 | +27.3% | 0 | tempo.ghost-strike x40 |
| `lineage-axe-kill-chain` | kill-chain | dot | 13 | 7731 | 4.33 | +18.2% | 0 | kill-chain.kill-pulse x13 |
| `lineage-axe-empowered` | empowered | dot | 12 | 8317 | 4.00 | +9.1% | 0 | empowered.weak-point x13 |
| `lineage-axe-baseline` | _control_ | dot | 11 | 9164 | 3.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 13 | 7000 | 4.33 | +8.3% | 0 | affliction.venom-pips x143 |
| `lineage-dagger-control` | control | reload | 14 | 7236 | 4.67 | +16.7% | 0 | control.frost-drag x51 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 12 | 9117 | 4.00 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 12 | 9233 | 4.00 | — | 0 | — |

### `node-t1-cave-02` — Brute 78% / Deep 22% (cave; shared by 2 authored nodes)

Dominant family **Brute** drops `empowered`, punishes `affliction`. Authored Brute 70% / Deep 20% / Brood 10%; unfieldable at T1: Brood.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 15 | 7447 | 5.00 | -6.3% | 0 | kill-chain.kill-pulse x15 |
| `lineage-broadsword-empowered` | empowered | energy | 19 | 5374 | 6.33 | +18.8% | 0 | empowered.weak-point x9 |
| `lineage-broadsword-tempo` | tempo | energy | 19 | 5374 | 6.33 | +18.8% | 0 | tempo.ghost-strike x36 |
| `lineage-broadsword-baseline` | _control_ | energy | 16 | 6681 | 5.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 17 | 5059 | 5.67 | +54.5% | 0 | tempo.ghost-strike x37 |
| `lineage-rapier-affliction` | affliction | cadence | 11 | 7455 | 3.67 | +0.0% | 0 | affliction.bleed-pips x99 |
| `lineage-rapier-engagement` | engagement | cadence | 11 | 7355 | 3.67 | +0.0% | 0 | engagement.opening-flash x12 |
| `lineage-rapier-baseline` | _control_ | cadence | 11 | 7645 | 3.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 15 | 4313 | 5.00 | +7.1% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | cooldown | 15 | 4320 | 5.00 | +7.1% | 0 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | cooldown | 14 | 4607 | 4.67 | +0.0% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | cooldown | 14 | 6186 | 4.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 15 | 7313 | 5.00 | +7.1% | 0 | tempo.ghost-strike x40 |
| `lineage-axe-kill-chain` | kill-chain | dot | 13 | 8554 | 4.33 | -7.1% | 0 | kill-chain.kill-pulse x13 |
| `lineage-axe-empowered` | empowered | dot | 13 | 8338 | 4.33 | -7.1% | 0 | empowered.weak-point x13 |
| `lineage-axe-baseline` | _control_ | dot | 14 | 8036 | 4.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 15 | 7433 | 5.00 | +0.0% | 0 | affliction.venom-pips x162 |
| `lineage-dagger-control` | control | reload | 15 | 7393 | 5.00 | +0.0% | 0 | control.frost-drag x54 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 14 | 8793 | 4.67 | -6.7% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 15 | 8847 | 5.00 | — | 0 | — |

### `node-t1-cave-03` — Deep 88% / Brute 13% (cave; shared by 1 authored node)

Dominant family **Deep** drops `kill-chain`, punishes `engagement`. Authored Deep 70% / Brood 20% / Brute 10%; unfieldable at T1: Brood.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 18 | 5333 | 6.00 | +12.5% | 0 | kill-chain.kill-pulse x18 |
| `lineage-broadsword-empowered` | empowered | energy | 16 | 5319 | 5.33 | +0.0% | 0 | empowered.weak-point x8 |
| `lineage-broadsword-tempo` | tempo | energy | 18 | 4728 | 6.00 | +12.5% | 0 | tempo.ghost-strike x30 |
| `lineage-broadsword-baseline` | _control_ | energy | 16 | 5550 | 5.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 16 | 4700 | 5.33 | +23.1% | 0 | tempo.ghost-strike x40 |
| `lineage-rapier-affliction` | affliction | cadence | 13 | 5885 | 4.33 | +0.0% | 0 | affliction.bleed-pips x107 |
| `lineage-rapier-engagement` | engagement | cadence | 15 | 5213 | 5.00 | +15.4% | 0 | engagement.opening-flash x14 |
| `lineage-rapier-baseline` | _control_ | cadence | 13 | 6723 | 4.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 16 | 4044 | 5.33 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | cooldown | 16 | 4044 | 5.33 | +0.0% | 0 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | cooldown | 16 | 4225 | 5.33 | +0.0% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | cooldown | 16 | 4044 | 5.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 13 | 6408 | 4.33 | +18.2% | 0 | tempo.ghost-strike x31 |
| `lineage-axe-kill-chain` | kill-chain | dot | 12 | 7533 | 4.00 | +9.1% | 0 | kill-chain.kill-pulse x12 |
| `lineage-axe-empowered` | empowered | dot | 11 | 8018 | 3.67 | +0.0% | 0 | empowered.weak-point x11 |
| `lineage-axe-baseline` | _control_ | dot | 11 | 8100 | 3.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 13 | 6123 | 4.33 | +18.2% | 0 | affliction.venom-pips x130 |
| `lineage-dagger-control` | control | reload | 12 | 6467 | 4.00 | +9.1% | 0 | control.frost-drag x41 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 12 | 8108 | 4.00 | +9.1% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 11 | 8182 | 3.67 | — | 0 | — |

### `node-t1-cave-05` — Brute 50% / Deep 50% (cave; shared by 1 authored node)

Dominant family **Brute** drops `empowered`, punishes `affliction`. Authored Brood 34% / Brute 33% / Deep 33%; unfieldable at T1: Brood.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 15 | 6793 | 5.00 | -6.3% | 0 | kill-chain.kill-pulse x15 |
| `lineage-broadsword-empowered` | empowered | energy | 17 | 5471 | 5.67 | +6.3% | 0 | empowered.weak-point x8 |
| `lineage-broadsword-tempo` | tempo | energy | 20 | 4980 | 6.67 | +25.0% | 0 | tempo.ghost-strike x35 |
| `lineage-broadsword-baseline` | _control_ | energy | 16 | 6275 | 5.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 13 | 6592 | 4.33 | +18.2% | 0 | tempo.ghost-strike x37 |
| `lineage-rapier-affliction` | affliction | cadence | 11 | 8382 | 3.67 | +0.0% | 0 | affliction.bleed-pips x110 |
| `lineage-rapier-engagement` | engagement | cadence | 13 | 6492 | 4.33 | +18.2% | 0 | engagement.opening-flash x12 |
| `lineage-rapier-baseline` | _control_ | cadence | 11 | 8445 | 3.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 15 | 4760 | 5.00 | +0.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | cooldown | 15 | 4760 | 5.00 | +0.0% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | cooldown | 14 | 5100 | 4.67 | -6.7% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | cooldown | 15 | 4760 | 5.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 13 | 7938 | 4.33 | +8.3% | 0 | tempo.ghost-strike x38 |
| `lineage-axe-kill-chain` | kill-chain | dot | 14 | 8393 | 4.67 | +16.7% | 0 | kill-chain.kill-pulse x14 |
| `lineage-axe-empowered` | empowered | dot | 13 | 7938 | 4.33 | +8.3% | 0 | empowered.weak-point x13 |
| `lineage-axe-baseline` | _control_ | dot | 12 | 8908 | 4.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 14 | 7979 | 4.67 | +27.3% | 0 | affliction.venom-pips x158 |
| `lineage-dagger-control` | control | reload | 13 | 7992 | 4.33 | +18.2% | 0 | control.frost-drag x50 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 13 | 9038 | 4.33 | +18.2% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 11 | 9555 | 3.67 | — | 0 | — |

### `node-t1-cave-06` — Brute 65% / Deep 35% (cave; shared by 1 authored node)

Dominant family **Brute** drops `empowered`, punishes `affliction`. Authored Brute 55% / Deep 30% / Brood 15%; unfieldable at T1: Brood.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 17 | 6253 | 5.67 | +6.3% | 0 | kill-chain.kill-pulse x17 |
| `lineage-broadsword-empowered` | empowered | energy | 17 | 5759 | 5.67 | +6.3% | 0 | empowered.weak-point x9 |
| `lineage-broadsword-tempo` | tempo | energy | 19 | 5021 | 6.33 | +18.8% | 0 | tempo.ghost-strike x33 |
| `lineage-broadsword-baseline` | _control_ | energy | 16 | 5931 | 5.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 11 | 6818 | 3.67 | +10.0% | 0 | tempo.ghost-strike x34 |
| `lineage-rapier-affliction` | affliction | cadence | 12 | 7350 | 4.00 | +20.0% | 0 | affliction.bleed-pips x108 |
| `lineage-rapier-engagement` | engagement | cadence | 12 | 7450 | 4.00 | +20.0% | 0 | engagement.opening-flash x12 |
| `lineage-rapier-baseline` | _control_ | cadence | 10 | 9380 | 3.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 13 | 5462 | 4.33 | +0.0% | 0 | empowered.plating-crack x13 |
| `lineage-hammer-control` | control | cooldown | 13 | 5462 | 4.33 | +0.0% | 0 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | cooldown | 14 | 5057 | 4.67 | +7.7% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | cooldown | 13 | 5462 | 4.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 13 | 8015 | 4.33 | +8.3% | 0 | tempo.ghost-strike x38 |
| `lineage-axe-kill-chain` | kill-chain | dot | 12 | 9342 | 4.00 | +0.0% | 0 | kill-chain.kill-pulse x12 |
| `lineage-axe-empowered` | empowered | dot | 13 | 8015 | 4.33 | +8.3% | 0 | empowered.weak-point x13 |
| `lineage-axe-baseline` | _control_ | dot | 12 | 9042 | 4.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 14 | 7207 | 4.67 | +16.7% | 0 | affliction.venom-pips x152 |
| `lineage-dagger-control` | control | reload | 14 | 7421 | 4.67 | +16.7% | 0 | control.frost-drag x51 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 12 | 8658 | 4.00 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 12 | 8775 | 4.00 | — | 0 | — |

### `node-t1-forest-01` — Pack 78% / Grove 22% (forest; shared by 1 authored node)

Dominant family **Pack** drops `tempo`, punishes `empowered`. Authored Pack 70% / Grove 20% / Canopy 10%; unfieldable at T1: Canopy.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 46 | 2404 | 15.33 | +12.2% | 1 | kill-chain.kill-pulse x33 |
| `lineage-broadsword-empowered` | empowered | energy | 41 | 2368 | 13.67 | +0.0% | 1 | empowered.weak-point x4 |
| `lineage-broadsword-tempo` | tempo | energy | 57 | 1960 | 19.00 | +39.0% | 2 | tempo.ghost-strike x16 |
| `lineage-broadsword-baseline` | _control_ | energy | 41 | 2368 | 13.67 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | cadence | 46 | 1774 | 15.33 | +21.1% | 0 | tempo.ghost-strike x37 |
| `lineage-rapier-affliction` | affliction | cadence | 40 | 2148 | 13.33 | +5.3% | 0 | affliction.bleed-pips x107 |
| `lineage-rapier-engagement` | engagement | cadence | 40 | 2145 | 13.33 | +5.3% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | cadence | 38 | 2168 | 12.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 41 | 1990 | 13.67 | +0.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | cooldown | 41 | 1990 | 13.67 | +0.0% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | cooldown | 41 | 2080 | 13.67 | +0.0% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | cooldown | 41 | 1990 | 13.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 30 | 2933 | 10.00 | +7.1% | 1 | tempo.ghost-strike x17 |
| `lineage-axe-kill-chain` | kill-chain | dot | 40 | 3058 | 13.33 | +42.9% | 5 | kill-chain.kill-pulse x18 |
| `lineage-axe-empowered` | empowered | dot | 29 | 3062 | 9.67 | +3.6% | 1 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | dot | 28 | 3171 | 9.33 | — | 1 | — |
| `lineage-dagger-affliction` | affliction | reload | 37 | 3765 | 12.33 | +23.3% | 5 | affliction.venom-pips x59 |
| `lineage-dagger-control` | control | reload | 40 | 3450 | 13.33 | +33.3% | 3 | control.frost-drag x31 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 33 | 4345 | 11.00 | +10.0% | 5 | — |
| `lineage-dagger-baseline` | _control_ | reload | 30 | 4393 | 10.00 | — | 4 | — |

### `node-t1-forest-02` — Grove 88% / Pack 13% (forest; shared by 1 authored node)

Dominant family **Grove** drops `empowered`, punishes `tempo`. Authored Grove 70% / Canopy 20% / Pack 10%; unfieldable at T1: Canopy.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 36 | 3714 | 12.00 | -14.3% | 1 | kill-chain.kill-pulse x25 |
| `lineage-broadsword-empowered` | empowered | energy | 42 | 3862 | 14.00 | +0.0% | 3 | empowered.weak-point x3 |
| `lineage-broadsword-tempo` | tempo | energy | 43 | 3423 | 14.33 | +2.4% | 1 | tempo.ghost-strike x27 |
| `lineage-broadsword-baseline` | _control_ | energy | 42 | 3862 | 14.00 | — | 3 | — |
| `lineage-rapier-tempo` | tempo | cadence | 38 | 3418 | 12.67 | +31.0% | 0 | tempo.ghost-strike x55 |
| `lineage-rapier-affliction` | affliction | cadence | 33 | 4139 | 11.00 | +13.8% | 0 | affliction.bleed-pips x156 |
| `lineage-rapier-engagement` | engagement | cadence | 35 | 3860 | 11.67 | +20.7% | 0 | engagement.opening-flash x9 |
| `lineage-rapier-baseline` | _control_ | cadence | 29 | 4507 | 9.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 26 | 4535 | 8.67 | +0.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | cooldown | 24 | 4817 | 8.00 | -7.7% | 0 | control.frost-drag x15 |
| `lineage-hammer-engagement` | engagement | cooldown | 24 | 4825 | 8.00 | -7.7% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | cooldown | 26 | 4535 | 8.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 39 | 4595 | 13.00 | +2.6% | 8 | tempo.ghost-strike x16 |
| `lineage-axe-kill-chain` | kill-chain | dot | 39 | 4595 | 13.00 | +2.6% | 8 | kill-chain.kill-pulse x10 |
| `lineage-axe-empowered` | empowered | dot | 40 | 4480 | 13.33 | +5.3% | 8 | empowered.weak-point x3 |
| `lineage-axe-baseline` | _control_ | dot | 38 | 4718 | 12.67 | — | 7 | — |
| `lineage-dagger-affliction` | affliction | reload | 30 | 4870 | 10.00 | +30.4% | 0 | affliction.venom-pips x189 |
| `lineage-dagger-control` | control | reload | 34 | 5056 | 11.33 | +47.8% | 6 | control.frost-drag x27 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 25 | 7108 | 8.33 | +8.7% | 6 | — |
| `lineage-dagger-baseline` | _control_ | reload | 23 | 7100 | 7.67 | — | 5 | — |

### `node-t1-forest-03` — Pack 67% / Grove 33% (forest; shared by 1 authored node)

Dominant family **Pack** drops `tempo`, punishes `empowered`. Authored Canopy 70% / Pack 20% / Grove 10%; unfieldable at T1: Canopy.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 39 | 3149 | 13.00 | +0.0% | 2 | kill-chain.kill-pulse x21 |
| `lineage-broadsword-empowered` | empowered | energy | 39 | 2459 | 13.00 | +0.0% | 1 | empowered.weak-point x3 |
| `lineage-broadsword-tempo` | tempo | energy | 39 | 2577 | 13.00 | +0.0% | 1 | tempo.ghost-strike x16 |
| `lineage-broadsword-baseline` | _control_ | energy | 39 | 2518 | 13.00 | — | 1 | — |
| `lineage-rapier-tempo` | tempo | cadence | 44 | 1927 | 14.67 | +25.7% | 0 | tempo.ghost-strike x38 |
| `lineage-rapier-affliction` | affliction | cadence | 35 | 2377 | 11.67 | +0.0% | 0 | affliction.bleed-pips x101 |
| `lineage-rapier-engagement` | engagement | cadence | 41 | 2137 | 13.67 | +17.1% | 0 | engagement.opening-flash x14 |
| `lineage-rapier-baseline` | _control_ | cadence | 35 | 2460 | 11.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 43 | 2035 | 14.33 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | cooldown | 43 | 2035 | 14.33 | +0.0% | 0 | control.frost-drag x12 |
| `lineage-hammer-engagement` | engagement | cooldown | 43 | 1933 | 14.33 | +0.0% | 0 | engagement.brace-sparks x16 |
| `lineage-hammer-baseline` | _control_ | cooldown | 43 | 2035 | 14.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 39 | 3051 | 13.00 | +18.2% | 4 | tempo.ghost-strike x17 |
| `lineage-axe-kill-chain` | kill-chain | dot | 43 | 3598 | 14.33 | +30.3% | 8 | kill-chain.kill-pulse x9 |
| `lineage-axe-empowered` | empowered | dot | 33 | 3067 | 11.00 | +0.0% | 2 | empowered.weak-point x1 |
| `lineage-axe-baseline` | _control_ | dot | 33 | 3067 | 11.00 | — | 2 | — |
| `lineage-dagger-affliction` | affliction | reload | 36 | 3831 | 12.00 | +20.0% | 5 | affliction.venom-pips x36 |
| `lineage-dagger-control` | control | reload | 31 | 4252 | 10.33 | +3.3% | 4 | control.frost-drag x11 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 33 | 4639 | 11.00 | +10.0% | 7 | — |
| `lineage-dagger-baseline` | _control_ | reload | 30 | 4633 | 10.00 | — | 6 | — |

### `node-t1-forest-04` — Pack 50% / Grove 50% (forest; shared by 2 authored nodes)

Dominant family **Pack** drops `tempo`, punishes `empowered`. Authored Pack 45% / Grove 45% / Canopy 10%; unfieldable at T1: Canopy.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 47 | 2672 | 15.67 | +6.8% | 2 | kill-chain.kill-pulse x33 |
| `lineage-broadsword-empowered` | empowered | energy | 41 | 3078 | 13.67 | -6.8% | 2 | empowered.weak-point x2 |
| `lineage-broadsword-tempo` | tempo | energy | 53 | 2377 | 17.67 | +20.5% | 1 | tempo.ghost-strike x22 |
| `lineage-broadsword-baseline` | _control_ | energy | 44 | 2800 | 14.67 | — | 2 | — |
| `lineage-rapier-tempo` | tempo | cadence | 48 | 1994 | 16.00 | +54.8% | 0 | tempo.ghost-strike x43 |
| `lineage-rapier-affliction` | affliction | cadence | 36 | 2850 | 12.00 | +16.1% | 0 | affliction.bleed-pips x119 |
| `lineage-rapier-engagement` | engagement | cadence | 39 | 2351 | 13.00 | +25.8% | 0 | engagement.opening-flash x15 |
| `lineage-rapier-baseline` | _control_ | cadence | 31 | 3135 | 10.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 34 | 2838 | 11.33 | +0.0% | 0 | empowered.plating-crack x15 |
| `lineage-hammer-control` | control | cooldown | 34 | 2838 | 11.33 | +0.0% | 0 | control.frost-drag x13 |
| `lineage-hammer-engagement` | engagement | cooldown | 38 | 2516 | 12.67 | +11.8% | 0 | engagement.brace-sparks x15 |
| `lineage-hammer-baseline` | _control_ | cooldown | 34 | 3021 | 11.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 33 | 3327 | 11.00 | -8.3% | 2 | tempo.ghost-strike x20 |
| `lineage-axe-kill-chain` | kill-chain | dot | 29 | 3528 | 9.67 | -19.4% | 1 | kill-chain.kill-pulse x17 |
| `lineage-axe-empowered` | empowered | dot | 36 | 3475 | 12.00 | +0.0% | 3 | empowered.weak-point x2 |
| `lineage-axe-baseline` | _control_ | dot | 36 | 3475 | 12.00 | — | 3 | — |
| `lineage-dagger-affliction` | affliction | reload | 35 | 3597 | 11.67 | +6.1% | 2 | affliction.venom-pips x90 |
| `lineage-dagger-control` | control | reload | 38 | 3955 | 12.67 | +15.2% | 6 | control.frost-drag x12 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 37 | 4519 | 12.33 | +12.1% | 6 | — |
| `lineage-dagger-baseline` | _control_ | reload | 33 | 4873 | 11.00 | — | 6 | — |

### `node-t1-plains-01` — Herd 78% / Swarm 22% (plains; shared by 1 authored node)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Herd 70% / Swarm 20% / Sky 10%; unfieldable at T1: Sky.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 50 | 2098 | 16.67 | +0.0% | 0 | kill-chain.kill-pulse x50 |
| `lineage-broadsword-empowered` | empowered | energy | 50 | 2124 | 16.67 | +0.0% | 0 | empowered.weak-point x11 |
| `lineage-broadsword-tempo` | tempo | energy | 50 | 2124 | 16.67 | +0.0% | 0 | tempo.ghost-strike x41 |
| `lineage-broadsword-baseline` | _control_ | energy | 50 | 2124 | 16.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 56 | 1668 | 18.67 | +19.1% | 0 | tempo.ghost-strike x53 |
| `lineage-rapier-affliction` | affliction | cadence | 51 | 1900 | 17.00 | +8.5% | 0 | affliction.bleed-pips x147 |
| `lineage-rapier-engagement` | engagement | cadence | 49 | 1859 | 16.33 | +4.3% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | cadence | 47 | 1970 | 15.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 39 | 2308 | 13.00 | -4.9% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | cooldown | 39 | 2308 | 13.00 | -4.9% | 0 | control.frost-drag x16 |
| `lineage-hammer-engagement` | engagement | cooldown | 38 | 2250 | 12.67 | -7.3% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | cooldown | 41 | 2312 | 13.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 34 | 3032 | 11.33 | +3.0% | 0 | tempo.ghost-strike x40 |
| `lineage-axe-kill-chain` | kill-chain | dot | 35 | 2814 | 11.67 | +6.1% | 0 | kill-chain.kill-pulse x35 |
| `lineage-axe-empowered` | empowered | dot | 33 | 3194 | 11.00 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 33 | 3194 | 11.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 38 | 3016 | 12.67 | +11.8% | 0 | affliction.venom-pips x174 |
| `lineage-dagger-control` | control | reload | 37 | 3084 | 12.33 | +8.8% | 0 | control.frost-drag x57 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 35 | 3366 | 11.67 | +2.9% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 34 | 3191 | 11.33 | — | 0 | — |

### `node-t1-plains-02` — Swarm 88% / Herd 13% (plains; shared by 1 authored node)

Dominant family **Swarm** drops `tempo`, punishes `empowered`. Authored Swarm 70% / Sky 20% / Herd 10%; unfieldable at T1: Sky.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 62 | 1376 | 20.67 | -4.6% | 0 | kill-chain.kill-pulse x62 |
| `lineage-broadsword-empowered` | empowered | energy | 66 | 1447 | 22.00 | +1.5% | 0 | empowered.weak-point x10 |
| `lineage-broadsword-tempo` | tempo | energy | 65 | 1500 | 21.67 | +0.0% | 0 | tempo.ghost-strike x40 |
| `lineage-broadsword-baseline` | _control_ | energy | 65 | 1500 | 21.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 75 | 1049 | 25.00 | +15.4% | 0 | tempo.ghost-strike x44 |
| `lineage-rapier-affliction` | affliction | cadence | 65 | 1203 | 21.67 | +0.0% | 0 | affliction.bleed-pips x118 |
| `lineage-rapier-engagement` | engagement | cadence | 75 | 1095 | 25.00 | +15.4% | 0 | engagement.opening-flash x12 |
| `lineage-rapier-baseline` | _control_ | cadence | 65 | 1214 | 21.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 49 | 1678 | 16.33 | +6.5% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | cooldown | 49 | 1678 | 16.33 | +6.5% | 0 | control.frost-drag x15 |
| `lineage-hammer-engagement` | engagement | cooldown | 49 | 1678 | 16.33 | +6.5% | 0 | engagement.brace-sparks x12 |
| `lineage-hammer-baseline` | _control_ | cooldown | 46 | 1735 | 15.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 37 | 2432 | 12.33 | -7.5% | 0 | tempo.ghost-strike x36 |
| `lineage-axe-kill-chain` | kill-chain | dot | 49 | 2155 | 16.33 | +22.5% | 0 | kill-chain.kill-pulse x49 |
| `lineage-axe-empowered` | empowered | dot | 40 | 2423 | 13.33 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 40 | 2423 | 13.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 43 | 2202 | 14.33 | +7.5% | 0 | affliction.venom-pips x157 |
| `lineage-dagger-control` | control | reload | 57 | 1728 | 19.00 | +42.5% | 0 | control.frost-drag x57 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 46 | 2422 | 15.33 | +15.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 40 | 2383 | 13.33 | — | 0 | — |

### `node-t1-plains-03` — Herd 67% / Swarm 33% (plains; shared by 1 authored node)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Sky 70% / Herd 20% / Swarm 10%; unfieldable at T1: Sky.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 56 | 1839 | 18.67 | +9.8% | 0 | kill-chain.kill-pulse x56 |
| `lineage-broadsword-empowered` | empowered | energy | 52 | 2062 | 17.33 | +2.0% | 0 | empowered.weak-point x10 |
| `lineage-broadsword-tempo` | tempo | energy | 52 | 2100 | 17.33 | +2.0% | 0 | tempo.ghost-strike x41 |
| `lineage-broadsword-baseline` | _control_ | energy | 51 | 2141 | 17.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 54 | 1724 | 18.00 | +12.5% | 0 | tempo.ghost-strike x53 |
| `lineage-rapier-affliction` | affliction | cadence | 49 | 1857 | 16.33 | +2.1% | 0 | affliction.bleed-pips x138 |
| `lineage-rapier-engagement` | engagement | cadence | 50 | 1792 | 16.67 | +4.2% | 0 | engagement.opening-flash x10 |
| `lineage-rapier-baseline` | _control_ | cadence | 48 | 1896 | 16.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 45 | 2473 | 15.00 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | cooldown | 45 | 2473 | 15.00 | +0.0% | 0 | control.frost-drag x19 |
| `lineage-hammer-engagement` | engagement | cooldown | 45 | 2473 | 15.00 | +0.0% | 0 | engagement.brace-sparks x8 |
| `lineage-hammer-baseline` | _control_ | cooldown | 45 | 2429 | 15.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 37 | 2749 | 12.33 | +37.0% | 0 | tempo.ghost-strike x39 |
| `lineage-axe-kill-chain` | kill-chain | dot | 30 | 3127 | 10.00 | +11.1% | 0 | kill-chain.kill-pulse x30 |
| `lineage-axe-empowered` | empowered | dot | 27 | 3385 | 9.00 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 27 | 3385 | 9.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 38 | 3066 | 12.67 | -2.6% | 0 | affliction.venom-pips x170 |
| `lineage-dagger-control` | control | reload | 42 | 2890 | 14.00 | +7.7% | 0 | control.frost-drag x58 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 40 | 3040 | 13.33 | +2.6% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 39 | 3403 | 13.00 | — | 0 | — |

### `node-t1-plains-04` — Herd 50% / Swarm 50% (plains; shared by 2 authored nodes)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Herd 45% / Swarm 45% / Sky 10%; unfieldable at T1: Sky.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 47 | 2096 | 15.67 | -11.3% | 0 | kill-chain.kill-pulse x47 |
| `lineage-broadsword-empowered` | empowered | energy | 54 | 1954 | 18.00 | +1.9% | 0 | empowered.weak-point x10 |
| `lineage-broadsword-tempo` | tempo | energy | 57 | 1888 | 19.00 | +7.5% | 0 | tempo.ghost-strike x41 |
| `lineage-broadsword-baseline` | _control_ | energy | 53 | 2142 | 17.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 54 | 1428 | 18.00 | +31.7% | 0 | tempo.ghost-strike x43 |
| `lineage-rapier-affliction` | affliction | cadence | 51 | 1761 | 17.00 | +24.4% | 0 | affliction.bleed-pips x134 |
| `lineage-rapier-engagement` | engagement | cadence | 47 | 1704 | 15.67 | +14.6% | 0 | engagement.opening-flash x10 |
| `lineage-rapier-baseline` | _control_ | cadence | 41 | 2229 | 13.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 42 | 2367 | 14.00 | +0.0% | 0 | empowered.plating-crack x17 |
| `lineage-hammer-control` | control | cooldown | 42 | 2367 | 14.00 | +0.0% | 0 | control.frost-drag x17 |
| `lineage-hammer-engagement` | engagement | cooldown | 44 | 2427 | 14.67 | +4.8% | 0 | engagement.brace-sparks x9 |
| `lineage-hammer-baseline` | _control_ | cooldown | 42 | 2367 | 14.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 39 | 2846 | 13.00 | +8.3% | 0 | tempo.ghost-strike x44 |
| `lineage-axe-kill-chain` | kill-chain | dot | 40 | 2605 | 13.33 | +11.1% | 0 | kill-chain.kill-pulse x40 |
| `lineage-axe-empowered` | empowered | dot | 36 | 2853 | 12.00 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 36 | 2853 | 12.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 41 | 2724 | 13.67 | +7.9% | 0 | affliction.venom-pips x167 |
| `lineage-dagger-control` | control | reload | 37 | 2897 | 12.33 | -2.6% | 0 | control.frost-drag x52 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 38 | 2892 | 12.67 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 38 | 2947 | 12.67 | — | 0 | — |

### `node-t1-swamp-01` — Mire 100% (swamp; shared by 6 authored nodes)

Dominant family **Mire** drops `affliction`, punishes `empowered`. Authored Mire 70% / Coven 20% / Stalker 10%; unfieldable at T1: Coven, Stalker.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 23 | 3139 | 7.67 | -4.2% | 0 | kill-chain.kill-pulse x23 |
| `lineage-broadsword-empowered` | empowered | energy | 24 | 2983 | 8.00 | +0.0% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-tempo` | tempo | energy | 28 | 2557 | 9.33 | +16.7% | 0 | tempo.ghost-strike x29 |
| `lineage-broadsword-baseline` | _control_ | energy | 24 | 2983 | 8.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 16 | 3188 | 5.33 | -5.9% | 0 | tempo.ghost-strike x27 |
| `lineage-rapier-affliction` | affliction | cadence | 17 | 3412 | 5.67 | +0.0% | 0 | affliction.bleed-pips x85 |
| `lineage-rapier-engagement` | engagement | cadence | 17 | 2800 | 5.67 | +0.0% | 0 | engagement.opening-flash x14 |
| `lineage-rapier-baseline` | _control_ | cadence | 17 | 3412 | 5.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 15 | 3507 | 5.00 | +0.0% | 0 | empowered.plating-crack x11 |
| `lineage-hammer-control` | control | cooldown | 15 | 3507 | 5.00 | +0.0% | 0 | control.frost-drag x9 |
| `lineage-hammer-engagement` | engagement | cooldown | 15 | 3500 | 5.00 | +0.0% | 0 | engagement.brace-sparks x11 |
| `lineage-hammer-baseline` | _control_ | cooldown | 15 | 3507 | 5.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 16 | 4113 | 5.33 | +14.3% | 0 | tempo.ghost-strike x25 |
| `lineage-axe-kill-chain` | kill-chain | dot | 16 | 4963 | 5.33 | +14.3% | 0 | kill-chain.kill-pulse x16 |
| `lineage-axe-empowered` | empowered | dot | 14 | 5029 | 4.67 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 14 | 5029 | 4.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 21 | 3862 | 7.00 | +16.7% | 0 | affliction.venom-pips x139 |
| `lineage-dagger-control` | control | reload | 20 | 3830 | 6.67 | +11.1% | 0 | control.frost-drag x42 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 19 | 4437 | 6.33 | +5.6% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 18 | 4600 | 6.00 | — | 0 | — |

