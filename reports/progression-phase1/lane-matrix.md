# Lineage lane matrix — Tier 1

Generated 2026-10-01T13:41:53.519Z from `5d02eb2fd8e6f1bab8cdf6fdcc43eafa903a550e`.
20 reference profiles x 27 distinct T1 node blends x 2 seeds (101009, 101033), 90 s of sim per cell per seed; wall clock 25.3 min.

Throughput is kills per minute of SIM time with repopulation on; TTK is engaged
milliseconds per kill, which divides out the walk between mobs. Uplift is the
cell against the SAME lineage’s lane-less control on the SAME node — the only
reading in which the lane, and not the class or the weapon, is the variable.

## What the Tier-1 map actually offers

A T1 node fields only `monsterPoolByTier[1]`, so `resolveNodeBlend` drops any
family with no T1 member and rescales its share onto the rest. The authored
blends are the design target; the resolved ones are the encounters that exist
today. Since design §18.8 added a third T1 mob per biome they should be the
same — a row where they differ is a family the map cannot field.

| node | biome | authored blend | resolved blend | shares this row | mobs (of 10 slots) |
|---|---|---|---|---|---|
| `node-t1-mountain-01` | mountain | Crag 70% / Ridge 20% / Hopper 10% | Crag 70% / Ridge 20% / Hopper 10% | 1 node(s): mountain-01 | rockback-ram x7, ridge-archer x2, cliff-hopper x1 |
| `node-t1-mountain-02` | mountain | Ridge 70% / Hopper 20% / Crag 10% | Ridge 70% / Hopper 20% / Crag 10% | 1 node(s): mountain-02 | ridge-archer x7, cliff-hopper x2, rockback-ram x1 |
| `node-t1-mountain-03` | mountain | Hopper 70% / Crag 20% / Ridge 10% | Hopper 70% / Crag 20% / Ridge 10% | 1 node(s): mountain-03 | cliff-hopper x7, rockback-ram x2, ridge-archer x1 |
| `node-t1-mountain-04` | mountain | Crag 45% / Ridge 45% / Hopper 10% | Crag 45% / Ridge 45% / Hopper 10% | 1 node(s): mountain-04 | rockback-ram x5, ridge-archer x4, cliff-hopper x1 |
| `node-t1-mountain-05` | mountain | Crag 34% / Ridge 33% / Hopper 33% | Crag 34% / Ridge 33% / Hopper 33% | 1 node(s): mountain-05 | rockback-ram x4, ridge-archer x3, cliff-hopper x3 |
| `node-t1-cave-01` | cave | Brood 70% / Brute 20% / Deep 10% | Brood 70% / Brute 20% / Deep 10% | 1 node(s): cave-01 | brood-spiderling x7, cave-brute x2, cave-lurker x1 |
| `node-t1-cave-02` | cave | Brute 70% / Deep 20% / Brood 10% | Brute 70% / Deep 20% / Brood 10% | 1 node(s): cave-02 | cave-brute x7, cave-lurker x2, brood-spiderling x1 |
| `node-t1-cave-03` | cave | Deep 70% / Brood 20% / Brute 10% | Deep 70% / Brood 20% / Brute 10% | 1 node(s): cave-03 | cave-lurker x7, brood-spiderling x2, cave-brute x1 |
| `node-t1-cave-04` | cave | Brood 45% / Brute 45% / Deep 10% | Brood 45% / Brute 45% / Deep 10% | 1 node(s): cave-04 | brood-spiderling x5, cave-brute x4, cave-lurker x1 |
| `node-t1-cave-05` | cave | Brood 34% / Brute 33% / Deep 33% | Brood 34% / Brute 33% / Deep 33% | 1 node(s): cave-05 | brood-spiderling x4, cave-brute x3, cave-lurker x3 |
| `node-t1-cave-06` | cave | Brute 55% / Deep 30% / Brood 15% | Brute 55% / Deep 30% / Brood 15% | 1 node(s): cave-06 | cave-brute x6, cave-lurker x3, brood-spiderling x1 |
| `node-t1-forest-01` | forest | Pack 70% / Grove 20% / Canopy 10% | Pack 70% / Grove 20% / Canopy 10% | 1 node(s): forest-01 | wolf x7, forest-slime x2, bramble-pod x1 |
| `node-t1-forest-02` | forest | Grove 70% / Canopy 20% / Pack 10% | Grove 70% / Canopy 20% / Pack 10% | 1 node(s): forest-02 | forest-slime x7, bramble-pod x2, wolf x1 |
| `node-t1-forest-03` | forest | Canopy 70% / Pack 20% / Grove 10% | Canopy 70% / Pack 20% / Grove 10% | 1 node(s): forest-03 | bramble-pod x7, wolf x2, forest-slime x1 |
| `node-t1-forest-04` | forest | Pack 45% / Grove 45% / Canopy 10% | Pack 45% / Grove 45% / Canopy 10% | 1 node(s): forest-04 | wolf x5, forest-slime x4, bramble-pod x1 |
| `node-t1-forest-05` | forest | Pack 34% / Grove 33% / Canopy 33% | Pack 34% / Grove 33% / Canopy 33% | 1 node(s): forest-05 | wolf x4, forest-slime x3, bramble-pod x3 |
| `node-t1-plains-01` | plains | Herd 70% / Swarm 20% / Sky 10% | Herd 70% / Swarm 20% / Sky 10% | 1 node(s): plains-01 | boar x7, plains-slime x2, grass-kite x1 |
| `node-t1-plains-02` | plains | Swarm 70% / Sky 20% / Herd 10% | Swarm 70% / Sky 20% / Herd 10% | 1 node(s): plains-02 | plains-slime x7, grass-kite x2, boar x1 |
| `node-t1-plains-03` | plains | Sky 70% / Herd 20% / Swarm 10% | Sky 70% / Herd 20% / Swarm 10% | 1 node(s): plains-03 | grass-kite x7, boar x2, plains-slime x1 |
| `node-t1-plains-04` | plains | Herd 45% / Swarm 45% / Sky 10% | Herd 45% / Swarm 45% / Sky 10% | 1 node(s): plains-04 | boar x5, plains-slime x4, grass-kite x1 |
| `node-t1-plains-05` | plains | Herd 34% / Swarm 33% / Sky 33% | Herd 34% / Swarm 33% / Sky 33% | 1 node(s): plains-05 | boar x4, plains-slime x3, grass-kite x3 |
| `node-t1-swamp-01` | swamp | Mire 70% / Coven 20% / Stalker 10% | Mire 70% / Coven 20% / Stalker 10% | 1 node(s): swamp-01 | bog-slime x7, fen-hexer x2, mud-toad x1 |
| `node-t1-swamp-02` | swamp | Coven 70% / Stalker 20% / Mire 10% | Coven 70% / Stalker 20% / Mire 10% | 1 node(s): swamp-02 | fen-hexer x7, mud-toad x2, bog-slime x1 |
| `node-t1-swamp-03` | swamp | Stalker 70% / Mire 20% / Coven 10% | Stalker 70% / Mire 20% / Coven 10% | 1 node(s): swamp-03 | mud-toad x7, bog-slime x2, fen-hexer x1 |
| `node-t1-swamp-04` | swamp | Mire 45% / Coven 45% / Stalker 10% | Mire 45% / Coven 45% / Stalker 10% | 1 node(s): swamp-04 | bog-slime x5, fen-hexer x4, mud-toad x1 |
| `node-t1-swamp-05` | swamp | Mire 34% / Coven 33% / Stalker 33% | Mire 34% / Coven 33% / Stalker 33% | 1 node(s): swamp-05 | bog-slime x4, fen-hexer x3, mud-toad x3 |
| `node-t1-swamp-06` | swamp | Coven 55% / Stalker 30% / Mire 15% | Coven 55% / Stalker 30% / Mire 15% | 1 node(s): swamp-06 | fen-hexer x6, mud-toad x3, bog-slime x1 |

## TTK per lane per node

Milliseconds of ENGAGED time per kill, pooled over both seeds. Lower is faster.
Columns are the eighteen distinct blends in the table above.

| profile | lane | class | mountain-01 | mountain-02 | mountain-03 | mountain-04 | mountain-05 | cave-01 | cave-02 | cave-03 | cave-04 | cave-05 | cave-06 | forest-01 | forest-02 | forest-03 | forest-04 | forest-05 | plains-01 | plains-02 | plains-03 | plains-04 | plains-05 | swamp-01 | swamp-02 | swamp-03 | swamp-04 | swamp-05 | swamp-06 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 8181 | 6000 | 5800 | 7169 | 7071 | 2776 | 7500 | 7542 | 4205 | 3721 | 8121 | 2393 | 3905 | 3288 | 2502 | 3106 | 2402 | 1767 | 2700 | 2027 | 2346 | 3148 | 3289 | 3079 | 3126 | 3259 | 3208 |
| `lineage-broadsword-empowered` | empowered | energy | 6961 | 5421 | 5970 | 6544 | 6550 | 3039 | 7240 | 4574 | 4376 | 3868 | 5959 | 2509 | 4143 | 3412 | 2712 | 3644 | 2319 | 1677 | 2711 | 1856 | 2134 | 3114 | 3279 | 3096 | 3187 | 3119 | 3335 |
| `lineage-broadsword-tempo` | tempo | energy | 6961 | 5421 | 6127 | 6544 | 6550 | 3039 | 7240 | 4574 | 4376 | 3868 | 5959 | 2509 | 4143 | 3412 | 2712 | 3644 | 2424 | 1677 | 2711 | 1856 | 2278 | 3114 | 3279 | 3096 | 3187 | 3119 | 3335 |
| `lineage-broadsword-baseline` | _control_ | energy | 8263 | 5421 | 6118 | 6941 | 6894 | 2925 | 7760 | 5731 | 3656 | 3936 | 7513 | 2509 | 4143 | 3412 | 2712 | 3644 | 2424 | 1677 | 2711 | 1856 | 2278 | 3114 | 3279 | 3096 | 3187 | 3119 | 3335 |
| `lineage-rapier-tempo` | tempo | cadence | 6627 | 5510 | 4955 | 5450 | 5728 | 2378 | 7945 | 4044 | 3473 | 3365 | 5838 | 1831 | 3091 | 2604 | 1975 | 2349 | 1764 | 1392 | 2335 | 1538 | 1683 | 3056 | 3317 | 3155 | 3164 | 3153 | 3100 |
| `lineage-rapier-affliction` | affliction | cadence | 6424 | 6136 | 5589 | 6124 | 6400 | 2457 | 7545 | 4382 | 4289 | 3538 | 6433 | 1930 | 3584 | 2848 | 2311 | 2684 | 1830 | 1555 | 2417 | 1715 | 1878 | 3207 | 2680 | 2952 | 2887 | 2895 | 2914 |
| `lineage-rapier-engagement` | engagement | cadence | 6138 | 5195 | 4782 | 5428 | 5317 | 2403 | 6358 | 3933 | 3868 | 3414 | 5623 | 1907 | 3597 | 2793 | 2303 | 2759 | 1776 | 1533 | 2142 | 1508 | 1830 | 2795 | 2580 | 2641 | 2688 | 2676 | 2514 |
| `lineage-rapier-baseline` | _control_ | cadence | 6893 | 6164 | 5419 | 6853 | 6275 | 2563 | 8410 | 4731 | 4522 | 3538 | 6550 | 1976 | 3590 | 2848 | 2422 | 2684 | 1843 | 1549 | 2534 | 1689 | 1852 | 3456 | 3615 | 3455 | 3475 | 3315 | 3422 |
| `lineage-hammer-empowered` | empowered | cooldown | 5400 | 5976 | 5582 | 5289 | 5361 | 2829 | 4585 | 3650 | 3121 | 3087 | 4429 | 2023 | 4632 | 3727 | 2370 | 2733 | 2678 | 1867 | 3080 | 2251 | 2419 | 2817 | 3204 | 3553 | 3695 | 3495 | 2710 |
| `lineage-hammer-control` | control | cooldown | 5400 | 5724 | 5582 | 5217 | 5083 | 2705 | 4485 | 3500 | 3121 | 2752 | 4429 | 2023 | 4632 | 3727 | 2370 | 2733 | 2678 | 1867 | 3080 | 2251 | 2419 | 2817 | 3204 | 3553 | 3695 | 3495 | 2710 |
| `lineage-hammer-engagement` | engagement | cooldown | 5206 | 5600 | 5782 | 5350 | 5078 | 2682 | 4138 | 3506 | 2881 | 2716 | 4229 | 2378 | 4660 | 3224 | 2582 | 2888 | 2587 | 1861 | 3237 | 2320 | 2419 | 2817 | 3213 | 3553 | 3695 | 3233 | 2710 |
| `lineage-hammer-baseline` | _control_ | cooldown | 5738 | 5976 | 5476 | 6225 | 5535 | 2995 | 4857 | 3650 | 3411 | 3109 | 5033 | 2023 | 4632 | 3727 | 2583 | 2733 | 3220 | 1827 | 3080 | 2647 | 2226 | 2918 | 4211 | 3553 | 4153 | 3674 | 3400 |
| `lineage-axe-tempo` | tempo | dot | 8233 | 8277 | 7006 | 8100 | 8231 | 4122 | 8475 | 6257 | 5450 | 5969 | 8923 | 3527 | 4790 | 3933 | 3755 | 3820 | 3251 | 2584 | 3727 | 3121 | 3491 | 4773 | 4682 | 4844 | 4350 | 4394 | 4200 |
| `lineage-axe-kill-chain` | kill-chain | dot | 8427 | 8115 | 7141 | 8293 | 8408 | 4155 | 8471 | 6500 | 4844 | 5581 | 8064 | 3357 | 4674 | 3652 | 3916 | 4231 | 3212 | 2616 | 3557 | 2900 | 3438 | 4627 | 4547 | 4776 | 4435 | 4474 | 4278 |
| `lineage-axe-empowered` | empowered | dot | 8233 | 8277 | 7006 | 8100 | 8231 | 4344 | 7750 | 5807 | 5211 | 5442 | 7408 | 3527 | 5033 | 4220 | 3509 | 3574 | 3161 | 2584 | 3727 | 3121 | 3491 | 4773 | 4682 | 4844 | 4350 | 4394 | 4200 |
| `lineage-axe-baseline` | _control_ | dot | 8233 | 8277 | 7006 | 8100 | 8231 | 4122 | 8475 | 6257 | 5450 | 5969 | 8923 | 3527 | 4829 | 4264 | 3755 | 3820 | 3251 | 2584 | 3727 | 3121 | 3491 | 4773 | 4682 | 4844 | 4350 | 4394 | 4200 |
| `lineage-dagger-affliction` | affliction | reload | 6547 | 6480 | 5655 | 6747 | 6741 | 3108 | 6400 | 4329 | 3492 | 3809 | 5559 | 2992 | 3641 | 3225 | 3043 | 3153 | 2474 | 1960 | 2731 | 2296 | 2335 | 3435 | 3079 | 3129 | 3170 | 3223 | 3288 |
| `lineage-dagger-control` | control | reload | 5588 | 6019 | 5768 | 6139 | 6000 | 3112 | 6306 | 4906 | 4081 | 3755 | 6031 | 2724 | 4068 | 3212 | 2881 | 3074 | 2829 | 1910 | 2737 | 2218 | 2441 | 3410 | 3254 | 3278 | 3223 | 3396 | 3167 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 6856 | 6086 | 5890 | 6550 | 6650 | 3364 | 6460 | 5220 | 4621 | 3896 | 6567 | 3191 | 4458 | 3164 | 2920 | 3587 | 2800 | 2051 | 3306 | 2409 | 2524 | 3227 | 3336 | 3217 | 3609 | 3348 | 3452 |
| `lineage-dagger-baseline` | _control_ | reload | 6800 | 6121 | 5967 | 6625 | 6850 | 3300 | 7236 | 5357 | 4747 | 3600 | 6769 | 3171 | 4461 | 3415 | 3453 | 3313 | 2826 | 2254 | 3241 | 2528 | 2724 | 3350 | 3500 | 3600 | 3514 | 3340 | 3418 |

### The same table as uplift over each lineage’s own control

| profile | lane | class | mountain-01 | mountain-02 | mountain-03 | mountain-04 | mountain-05 | cave-01 | cave-02 | cave-03 | cave-04 | cave-05 | cave-06 | forest-01 | forest-02 | forest-03 | forest-04 | forest-05 | plains-01 | plains-02 | plains-03 | plains-04 | plains-05 | swamp-01 | swamp-02 | swamp-03 | swamp-04 | swamp-05 | swamp-06 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `lineage-broadsword-kill-chain` | kill-chain | energy | +0.0% | -10.5% | +0.0% | -5.9% | +0.0% | +3.1% | +6.7% | -25.0% | -12.0% | +9.1% | -12.5% | +25.0% | +5.7% | +0.0% | +2.4% | +9.4% | +6.5% | -4.9% | +2.2% | +6.3% | -2.0% | +4.5% | -6.9% | -4.0% | +0.0% | +7.4% | +8.7% |
| `lineage-broadsword-empowered` | empowered | energy | +12.5% | +0.0% | -9.1% | +5.9% | +5.9% | -12.5% | +0.0% | +18.8% | -16.0% | +13.6% | +6.3% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +2.2% | +0.0% | +0.0% | +0.0% | +8.2% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-broadsword-tempo` | tempo | energy | +12.5% | +0.0% | +0.0% | +5.9% | +5.9% | -12.5% | +0.0% | +18.8% | -16.0% | +13.6% | +6.3% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-rapier-tempo` | tempo | cadence | +0.0% | +42.9% | -4.8% | +20.0% | +12.5% | +6.7% | +10.0% | +12.5% | +22.2% | +9.5% | +8.3% | +17.1% | +3.2% | +3.7% | +18.9% | +9.4% | +19.1% | +6.8% | +4.5% | +7.0% | +3.6% | +0.0% | -11.1% | +0.0% | +10.0% | -5.0% | +8.7% |
| `lineage-rapier-affliction` | affliction | cadence | +13.3% | +0.0% | -14.3% | +13.3% | +0.0% | +0.0% | +10.0% | +6.3% | +0.0% | +0.0% | +0.0% | +7.3% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | -1.7% | +6.8% | +3.5% | -10.7% | -6.3% | +11.1% | +15.0% | +15.0% | +10.0% | +26.1% |
| `lineage-rapier-engagement` | engagement | cadence | +6.7% | +42.9% | +4.8% | +20.0% | +12.5% | +0.0% | +20.0% | +12.5% | +5.6% | +4.8% | +8.3% | +7.3% | +0.0% | +7.4% | +5.4% | +0.0% | +6.4% | -3.4% | -2.3% | +5.3% | -10.7% | +25.0% | +11.1% | +10.0% | +25.0% | +25.0% | +26.1% |
| `lineage-hammer-empowered` | empowered | cooldown | +6.3% | +0.0% | +0.0% | +12.5% | +5.9% | +0.0% | -7.1% | +0.0% | +0.0% | +0.0% | +16.7% | +0.0% | +0.0% | +0.0% | +2.8% | +0.0% | +5.7% | -3.9% | +0.0% | +13.2% | +0.0% | +5.9% | +26.3% | +0.0% | +5.3% | +5.3% | +5.3% |
| `lineage-hammer-control` | control | cooldown | +6.3% | +0.0% | +0.0% | +12.5% | +5.9% | +0.0% | -7.1% | +6.3% | +0.0% | +8.7% | +16.7% | +0.0% | +0.0% | +0.0% | +2.8% | +0.0% | +5.7% | -3.9% | +0.0% | +13.2% | +0.0% | +5.9% | +26.3% | +0.0% | +5.3% | +5.3% | +5.3% |
| `lineage-hammer-engagement` | engagement | cooldown | +0.0% | +0.0% | +0.0% | +12.5% | +5.9% | +4.8% | -7.1% | +6.3% | +10.5% | +8.7% | +16.7% | -10.0% | +0.0% | +13.6% | +5.6% | +3.0% | +11.4% | +0.0% | +0.0% | +5.3% | +0.0% | +5.9% | +26.3% | +0.0% | +5.3% | +10.5% | +5.3% |
| `lineage-axe-tempo` | tempo | dot | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +7.1% | +8.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-axe-kill-chain` | kill-chain | dot | +0.0% | +0.0% | +6.3% | -6.7% | +0.0% | +11.1% | +16.7% | +0.0% | +0.0% | +0.0% | +7.7% | -9.1% | +21.4% | +16.0% | +0.0% | -13.3% | -2.9% | +0.0% | +6.1% | +14.7% | +3.0% | +0.0% | -13.6% | +6.3% | -5.6% | +5.6% | +12.5% |
| `lineage-axe-empowered` | empowered | dot | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +16.7% | +0.0% | +5.6% | +18.8% | +0.0% | +0.0% | +7.1% | +0.0% | +12.9% | +3.3% | +2.9% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-dagger-affliction` | affliction | reload | +6.3% | +7.1% | +4.8% | -6.3% | +6.3% | +8.7% | +14.3% | +21.4% | +26.3% | -8.3% | +6.3% | +14.7% | +19.4% | -7.7% | +5.3% | +0.0% | +2.4% | +6.0% | +13.5% | +9.3% | +12.2% | -9.1% | +16.7% | -4.5% | +4.5% | +4.0% | +13.6% |
| `lineage-dagger-control` | control | reload | +6.3% | +14.3% | +4.8% | +12.5% | +12.5% | +13.0% | +28.6% | +14.3% | +10.5% | -8.3% | +0.0% | +20.6% | -9.7% | +0.0% | +23.7% | +16.7% | -16.7% | +2.0% | +10.8% | +2.3% | +7.3% | -4.5% | +8.3% | -18.2% | +0.0% | +0.0% | +9.1% |
| `lineage-dagger-kill-chain` | kill-chain | reload | +0.0% | +0.0% | -4.8% | +0.0% | +0.0% | +8.7% | +7.1% | +7.1% | +0.0% | +0.0% | -6.3% | +29.4% | +0.0% | +7.7% | +18.4% | +0.0% | -4.8% | +2.0% | -5.4% | +7.0% | +9.8% | +0.0% | +4.2% | +4.5% | +0.0% | +8.0% | +4.5% |

## Lane budget (design §9)

“At full rows for a tier, each lane’s measured throughput lands within ±10% of the
tier median on that lane’s intended variant.”

Median absolute throughput on the favoured node: **5.67 kills/min**. Median lane uplift over the matching control: **+0.0%**.

| lane | profile | favoured node | kills/min | vs abs median | uplift | uplift − median | in ±10% (abs) | shards |
|---|---|---|---:|---:|---:|---:|:--:|---|
| kill-chain | `lineage-broadsword-kill-chain` | `node-t1-cave-03` | 4.00 | -29.4% | -25.0% | -25.0% | NO | earned |
| empowered | `lineage-broadsword-empowered` | `node-t1-mountain-01` | 6.00 | +5.9% | +12.5% | +12.5% | yes | earned |
| tempo | `lineage-broadsword-tempo` | `node-t1-mountain-03` | 7.33 | +29.4% | +0.0% | +0.0% | NO | earned |
| tempo | `lineage-rapier-tempo` | `node-t1-mountain-03` | 6.67 | +17.6% | -4.8% | -4.8% | NO | earned |
| affliction | `lineage-rapier-affliction` | `node-t1-cave-01` | 10.00 | +76.5% | +0.0% | +0.0% | NO | earned |
| engagement | `lineage-rapier-engagement` | `node-t1-plains-03` | 14.33 | +152.9% | -2.3% | -2.3% | NO | earned |
| empowered | `lineage-hammer-empowered` | `node-t1-mountain-01` | 5.67 | +0.0% | +6.3% | +6.3% | yes | earned |
| control | `lineage-hammer-control` | `node-t1-mountain-02` | 5.67 | +0.0% | +0.0% | +0.0% | yes | earned |
| engagement | `lineage-hammer-engagement` | `node-t1-plains-03` | 11.67 | +105.9% | +0.0% | +0.0% | NO | earned |
| tempo | `lineage-axe-tempo` | `node-t1-mountain-03` | 5.33 | -5.9% | +0.0% | +0.0% | yes | earned |
| kill-chain | `lineage-axe-kill-chain` | `node-t1-cave-03` | 4.67 | -17.6% | +0.0% | +0.0% | NO | earned |
| empowered | `lineage-axe-empowered` | `node-t1-mountain-01` | 5.00 | -11.8% | +0.0% | +0.0% | NO | earned |
| affliction | `lineage-dagger-affliction` | `node-t1-cave-01` | 8.33 | +47.1% | +8.7% | +8.7% | NO | earned |
| control | `lineage-dagger-control` | `node-t1-mountain-02` | 5.33 | -5.9% | +14.3% | +14.3% | yes | earned |
| kill-chain | `lineage-dagger-kill-chain` | `node-t1-cave-03` | 5.00 | -11.8% | +7.1% | +7.1% | NO | earned |

### How much of the absolute column is class, not lane

| control | class | weapon | mean kills/min over all nodes | vs control median |
|---|---|---|---:|---:|
| `lineage-broadsword-baseline` | energy | iron-broadsword | 9.79 | +13.0% |
| `lineage-rapier-baseline` | cadence | flash-rapier | 9.20 | +6.1% |
| `lineage-hammer-baseline` | cooldown | heavy-hammer | 8.07 | -6.8% |
| `lineage-axe-baseline` | dot | chaotic-axe | 7.33 | -15.4% |
| `lineage-dagger-baseline` | reload | ashbrand-blade | 8.67 | +0.0% |

### Lane budget per PACKET — the table `PACKET_BUDGET` is tuned from

Median packet uplift: **+4.3%**. The ±10% band is +3.9% to +4.7%.

| packet | lineages carrying it | mean uplift | x median | in ±10% | payoff fx fired | has a favouring T1 node |
|---|---:|---:|---:|:--:|---:|---|
| engagement | 2 | +7.7% | 1.79x | NO | 752 | `node-t1-plains-03` |
| affliction | 2 | +5.4% | 1.25x | NO | 7333 | `node-t1-cave-01` |
| control | 2 | +5.1% | 1.18x | NO | 1733 | `node-t1-mountain-02` |
| tempo | 3 | +3.5% | 0.82x | NO | 2904 | `node-t1-mountain-03` |
| empowered | 3 | +2.5% | 0.58x | NO | 724 | `node-t1-mountain-01` |
| kill-chain | 3 | +2.3% | 0.54x | NO | 1417 | `node-t1-cave-03` |

### Lane uplift over every node

The same uplift as above, averaged over all node blends rather than only the
favoured one — the reading least sensitive to which single encounter a lane
happened to be measured on.

| lane | profile | mean uplift over all nodes | uplift on favoured node | worst node | best node | payoff fx fired (all nodes) |
|---|---|---:|---:|---|---|---:|
| kill-chain | `lineage-broadsword-kill-chain` | +0.5% | -25.0% | cave-03 -25.0% | forest-01 +25.0% | 746 |
| empowered | `lineage-broadsword-empowered` | +1.3% | +12.5% | cave-04 -16.0% | cave-03 +18.8% | 158 |
| tempo | `lineage-broadsword-tempo` | +1.3% | +0.0% | cave-04 -16.0% | cave-03 +18.8% | 897 |
| tempo | `lineage-rapier-tempo` | +8.7% | -4.8% | swamp-02 -11.1% | mountain-02 +42.9% | 1112 |
| affliction | `lineage-rapier-affliction` | +3.9% | +0.0% | mountain-03 -14.3% | swamp-06 +26.1% | 3006 |
| engagement | `lineage-rapier-engagement` | +10.2% | -2.3% | plains-05 -10.7% | mountain-02 +42.9% | 384 |
| empowered | `lineage-hammer-empowered` | +3.7% | +6.3% | cave-02 -7.1% | swamp-02 +26.3% | 413 |
| control | `lineage-hammer-control` | +4.3% | +0.0% | cave-02 -7.1% | swamp-02 +26.3% | 346 |
| engagement | `lineage-hammer-engagement` | +5.2% | +0.0% | forest-01 -10.0% | swamp-02 +26.3% | 368 |
| tempo | `lineage-axe-tempo` | +0.6% | +0.0% | mountain-01 +0.0% | forest-03 +8.0% | 895 |
| kill-chain | `lineage-axe-kill-chain` | +2.8% | +0.0% | swamp-02 -13.6% | forest-02 +21.4% | 552 |
| empowered | `lineage-axe-empowered` | +2.5% | +0.0% | mountain-01 +0.0% | cave-05 +18.8% | 153 |
| affliction | `lineage-dagger-affliction` | +6.9% | +8.7% | swamp-01 -9.1% | cave-04 +26.3% | 4327 |
| control | `lineage-dagger-control` | +5.9% | +14.3% | swamp-03 -18.2% | cave-02 +28.6% | 1387 |
| kill-chain | `lineage-dagger-kill-chain` | +3.6% | +7.1% | cave-06 -6.3% | forest-01 +29.4% | 119 |

## Survival — what the non-damage lanes buy instead

Control’s slow and Engagement’s opening DR buy time, not throughput, so the
TTK matrix above reads them as worth nothing. This is the same runs read as
survival: mean HP fraction while engaged and damage taken per engaged second,
each against the same lineage’s lane-less control.

| profile | lane | class | mean HP while engaged | damage taken / engaged s | deaths | Δ HP vs control | Δ damage taken vs control |
|---|---|---|---:|---:|---:|---:|---:|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 0.97 | 2.41 | 4 | +0.1% | +0.2% |
| `lineage-broadsword-empowered` | empowered | energy | 0.97 | 2.47 | 5 | -0.0% | +2.5% |
| `lineage-broadsword-tempo` | tempo | energy | 0.97 | 2.44 | 5 | -0.0% | +1.1% |
| `lineage-broadsword-baseline` | _control_ | energy | 0.97 | 2.41 | 5 | — | — |
| `lineage-rapier-tempo` | tempo | cadence | 0.94 | 8.43 | 0 | +0.7% | -2.9% |
| `lineage-rapier-affliction` | affliction | cadence | 0.94 | 8.70 | 0 | +0.5% | +0.1% |
| `lineage-rapier-engagement` | engagement | cadence | 0.94 | 8.43 | 0 | +1.2% | -3.0% |
| `lineage-rapier-baseline` | _control_ | cadence | 0.93 | 8.69 | 0 | — | — |
| `lineage-hammer-empowered` | empowered | cooldown | 0.96 | 6.00 | 0 | +0.2% | -1.0% |
| `lineage-hammer-control` | control | cooldown | 0.96 | 6.04 | 0 | +0.1% | -0.3% |
| `lineage-hammer-engagement` | engagement | cooldown | 0.96 | 5.75 | 0 | +0.4% | -5.1% |
| `lineage-hammer-baseline` | _control_ | cooldown | 0.96 | 6.06 | 0 | — | — |
| `lineage-axe-tempo` | tempo | dot | 0.93 | 5.29 | 8 | -0.1% | +0.8% |
| `lineage-axe-kill-chain` | kill-chain | dot | 0.92 | 5.08 | 8 | -0.7% | -3.1% |
| `lineage-axe-empowered` | empowered | dot | 0.92 | 5.14 | 7 | -0.5% | -2.1% |
| `lineage-axe-baseline` | _control_ | dot | 0.93 | 5.25 | 8 | — | — |
| `lineage-dagger-affliction` | affliction | reload | 0.95 | 5.31 | 3 | +1.0% | -4.7% |
| `lineage-dagger-control` | control | reload | 0.95 | 4.79 | 3 | +1.2% | -14.1% |
| `lineage-dagger-kill-chain` | kill-chain | reload | 0.94 | 5.44 | 6 | +0.1% | -2.4% |
| `lineage-dagger-baseline` | _control_ | reload | 0.94 | 5.58 | 4 | — | — |

## Encounter check (design §9)

“Does the intended lane win by ~30%? Does the punished lane still clear?” The
favoured lane is read off `FamilyDefinition.drops`; the shipped family table has
no `favours` field.

| family | node | favoured | punished | fav abs Δ | fav uplift Δ | pun abs Δ | pun uplift Δ | pun ≥70% | pun deaths | verdict (abs) |
|---|---|---|---|---:|---:|---:|---:|:--:|---:|---|
| Crag | `node-t1-mountain-01` | empowered (n=3) | affliction (n=2) | +6.3% | +0.0% | +6.3% | +3.5% | yes | 0 | favoured lane does NOT win by ~30% |
| Ridge | `node-t1-mountain-02` | control (n=2) | kill-chain (n=3) | -2.9% | +7.1% | -17.6% | +0.0% | yes | 0 | favoured lane does NOT win by ~30% |
| Hopper | `node-t1-mountain-03` | tempo (n=3) | empowered (n=3) | +0.0% | +0.0% | -15.0% | +0.0% | yes | 0 | favoured lane does NOT win by ~30% |
| Crag | `node-t1-mountain-04` | empowered (n=3) | affliction (n=2) | +0.0% | +0.0% | -11.1% | -2.3% | yes | 0 | favoured lane does NOT win by ~30% |
| Crag | `node-t1-mountain-05` | empowered (n=3) | affliction (n=2) | +0.0% | +0.0% | -8.3% | -2.8% | yes | 0 | favoured lane does NOT win by ~30% |
| Brood | `node-t1-cave-01` | affliction (n=2) | tempo (n=3) | +10.0% | +4.3% | +12.0% | +0.0% | yes | 0 | favoured lane does NOT win by ~30% |
| Brute | `node-t1-cave-02` | empowered (n=3) | affliction (n=2) | +0.0% | -7.1% | -3.6% | +5.0% | yes | 0 | favoured lane does NOT win by ~30% |
| Deep | `node-t1-cave-03` | kill-chain (n=3) | engagement (n=2) | -17.6% | -6.3% | +2.9% | +3.1% | yes | 0 | favoured lane does NOT win by ~30% |
| Brood | `node-t1-cave-04` | affliction (n=2) | tempo (n=3) | +10.5% | +13.2% | +10.5% | +0.0% | yes | 0 | favoured lane does NOT win by ~30% |
| Brood | `node-t1-cave-05` | affliction (n=2) | tempo (n=3) | -6.5% | -8.9% | +0.0% | +4.8% | yes | 0 | favoured lane does NOT win by ~30% |
| Brute | `node-t1-cave-06` | empowered (n=3) | affliction (n=2) | +0.0% | +0.0% | +3.6% | -3.1% | yes | 0 | favoured lane does NOT win by ~30% |
| Pack | `node-t1-forest-01` | tempo (n=3) | empowered (n=3) | +7.3% | +0.0% | -2.4% | +0.0% | yes | 4 | favoured lane does NOT win by ~30% |
| Grove | `node-t1-forest-02` | empowered (n=3) | tempo (n=3) | -3.2% | +0.0% | +3.2% | +3.2% | yes | 3 | favoured lane does NOT win by ~30% |
| Canopy | `node-t1-forest-03` | affliction (n=2) | control (n=2) | -1.9% | -3.8% | -7.7% | +0.0% | yes | 0 | favoured lane does NOT win by ~30% |
| Pack | `node-t1-forest-04` | tempo (n=3) | empowered (n=3) | +5.1% | -2.8% | -5.1% | +0.0% | yes | 2 | favoured lane does NOT win by ~30% |
| Pack | `node-t1-forest-05` | tempo (n=3) | empowered (n=3) | +0.0% | +0.0% | +0.0% | +0.0% | yes | 3 | favoured lane does NOT win by ~30% |
| Herd | `node-t1-plains-01` | empowered (n=3) | tempo (n=3) | -7.5% | +0.5% | +15.0% | -2.4% | yes | 0 | favoured lane does NOT win by ~30% |
| Swarm | `node-t1-plains-02` | tempo (n=3) | empowered (n=3) | +19.6% | +0.0% | -3.9% | +0.0% | yes | 0 | favoured lane does NOT win by ~30% |
| Sky | `node-t1-plains-03` | engagement (n=2) | affliction (n=2) | -4.9% | -1.1% | +8.5% | +10.2% | yes | 0 | favoured lane does NOT win by ~30% |
| Herd | `node-t1-plains-04` | empowered (n=3) | tempo (n=3) | -6.5% | -5.3% | +4.3% | -5.3% | yes | 0 | favoured lane does NOT win by ~30% |
| Herd | `node-t1-plains-05` | empowered (n=3) | tempo (n=3) | -4.4% | +0.0% | +8.9% | +0.0% | yes | 0 | favoured lane does NOT win by ~30% |
| Mire | `node-t1-swamp-01` | affliction (n=2) | empowered (n=3) | -2.8% | -7.7% | +0.0% | +0.0% | yes | 0 | favoured lane does NOT win by ~30% |
| Coven | `node-t1-swamp-02` | control (n=2) | tempo (n=3) | -0.0% | +13.2% | -4.0% | -4.2% | yes | 0 | favoured lane does NOT win by ~30% |
| Stalker | `node-t1-swamp-03` | kill-chain (n=3) | bulwark (none) | +15.0% | +4.5% | — | — | n/a | 0 | favoured lane does NOT win by ~30% |
| Mire | `node-t1-swamp-04` | affliction (n=2) | empowered (n=3) | +4.5% | +9.8% | -9.1% | +0.0% | yes | 0 | favoured lane does NOT win by ~30% |
| Mire | `node-t1-swamp-05` | affliction (n=2) | empowered (n=3) | +9.1% | +1.7% | -9.1% | -5.3% | yes | 0 | favoured lane does NOT win by ~30% |
| Coven | `node-t1-swamp-06` | control (n=2) | tempo (n=3) | -4.3% | +1.9% | +0.0% | -5.3% | yes | 0 | favoured lane does NOT win by ~30% |

## Refused purchases

None — every lane bought its whole band.

## Per-node detail

### `node-t1-mountain-01` — Crag 70% / Ridge 20% / Hopper 10% (mountain; shared by 1 authored node)

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

### `node-t1-mountain-02` — Ridge 70% / Hopper 20% / Crag 10% (mountain; shared by 1 authored node)

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

### `node-t1-mountain-03` — Hopper 70% / Crag 20% / Ridge 10% (mountain; shared by 1 authored node)

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

### `node-t1-mountain-04` — Crag 45% / Ridge 45% / Hopper 10% (mountain; shared by 1 authored node)

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

### `node-t1-mountain-05` — Crag 34% / Ridge 33% / Hopper 33% (mountain; shared by 1 authored node)

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

### `node-t1-cave-01` — Brood 70% / Brute 20% / Deep 10% (cave; shared by 1 authored node)

Dominant family **Brood** drops `affliction`, punishes `tempo`. Authored Brood 70% / Brute 20% / Deep 10%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 33 | 2776 | 11.00 | +3.1% | 0 | kill-chain.kill-pulse x33 |
| `lineage-broadsword-empowered` | empowered | energy | 28 | 3039 | 9.33 | -12.5% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-tempo` | tempo | energy | 28 | 3039 | 9.33 | -12.5% | 0 | tempo.ghost-strike x32 |
| `lineage-broadsword-baseline` | _control_ | energy | 32 | 2925 | 10.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 32 | 2378 | 10.67 | +6.7% | 0 | tempo.ghost-strike x38 |
| `lineage-rapier-affliction` | affliction | cadence | 30 | 2457 | 10.00 | +0.0% | 0 | affliction.bleed-pips x103 |
| `lineage-rapier-engagement` | engagement | cadence | 30 | 2403 | 10.00 | +0.0% | 0 | engagement.opening-flash x16 |
| `lineage-rapier-baseline` | _control_ | cadence | 30 | 2563 | 10.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 21 | 2829 | 7.00 | +0.0% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | cooldown | 21 | 2705 | 7.00 | +0.0% | 0 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | cooldown | 22 | 2682 | 7.33 | +4.8% | 0 | engagement.brace-sparks x12 |
| `lineage-hammer-baseline` | _control_ | cooldown | 21 | 2995 | 7.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 18 | 4122 | 6.00 | +0.0% | 0 | tempo.ghost-strike x28 |
| `lineage-axe-kill-chain` | kill-chain | dot | 20 | 4155 | 6.67 | +11.1% | 0 | kill-chain.kill-pulse x20 |
| `lineage-axe-empowered` | empowered | dot | 18 | 4344 | 6.00 | +0.0% | 0 | empowered.weak-point x5 |
| `lineage-axe-baseline` | _control_ | dot | 18 | 4122 | 6.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 25 | 3108 | 8.33 | +8.7% | 0 | affliction.venom-pips x141 |
| `lineage-dagger-control` | control | reload | 26 | 3112 | 8.67 | +13.0% | 0 | control.frost-drag x46 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 25 | 3364 | 8.33 | +8.7% | 0 | kill-chain.spread-arc x2 |
| `lineage-dagger-baseline` | _control_ | reload | 23 | 3300 | 7.67 | — | 0 | — |

### `node-t1-cave-02` — Brute 70% / Deep 20% / Brood 10% (cave; shared by 1 authored node)

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

### `node-t1-cave-03` — Deep 70% / Brood 20% / Brute 10% (cave; shared by 1 authored node)

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

### `node-t1-cave-04` — Brood 45% / Brute 45% / Deep 10% (cave; shared by 1 authored node)

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

### `node-t1-cave-05` — Brood 34% / Brute 33% / Deep 33% (cave; shared by 1 authored node)

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

### `node-t1-cave-06` — Brute 55% / Deep 30% / Brood 15% (cave; shared by 1 authored node)

Dominant family **Brute** drops `empowered`, punishes `affliction`. Authored Brute 55% / Deep 30% / Brood 15%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 14 | 8121 | 4.67 | -12.5% | 0 | kill-chain.kill-pulse x14 |
| `lineage-broadsword-empowered` | empowered | energy | 17 | 5959 | 5.67 | +6.3% | 0 | empowered.weak-point x6 |
| `lineage-broadsword-tempo` | tempo | energy | 17 | 5959 | 5.67 | +6.3% | 0 | tempo.ghost-strike x35 |
| `lineage-broadsword-baseline` | _control_ | energy | 16 | 7513 | 5.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 13 | 5838 | 4.33 | +8.3% | 0 | tempo.ghost-strike x36 |
| `lineage-rapier-affliction` | affliction | cadence | 12 | 6433 | 4.00 | +0.0% | 0 | affliction.bleed-pips x98 |
| `lineage-rapier-engagement` | engagement | cadence | 13 | 5623 | 4.33 | +8.3% | 0 | engagement.opening-flash x14 |
| `lineage-rapier-baseline` | _control_ | cadence | 12 | 6550 | 4.00 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 14 | 4429 | 4.67 | +16.7% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | cooldown | 14 | 4429 | 4.67 | +16.7% | 0 | control.frost-drag x10 |
| `lineage-hammer-engagement` | engagement | cooldown | 14 | 4229 | 4.67 | +16.7% | 0 | engagement.brace-sparks x12 |
| `lineage-hammer-baseline` | _control_ | cooldown | 12 | 5033 | 4.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 13 | 8923 | 4.33 | +0.0% | 1 | tempo.ghost-strike x33 |
| `lineage-axe-kill-chain` | kill-chain | dot | 14 | 8064 | 4.67 | +7.7% | 0 | kill-chain.kill-pulse x14 |
| `lineage-axe-empowered` | empowered | dot | 13 | 7408 | 4.33 | +0.0% | 0 | empowered.weak-point x13 |
| `lineage-axe-baseline` | _control_ | dot | 13 | 8923 | 4.33 | — | 1 | — |
| `lineage-dagger-affliction` | affliction | reload | 17 | 5559 | 5.67 | +6.3% | 0 | affliction.venom-pips x176 |
| `lineage-dagger-control` | control | reload | 16 | 6031 | 5.33 | +0.0% | 0 | control.frost-drag x54 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 15 | 6567 | 5.00 | -6.3% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 16 | 6769 | 5.33 | — | 0 | — |

### `node-t1-forest-01` — Pack 70% / Grove 20% / Canopy 10% (forest; shared by 1 authored node)

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

### `node-t1-forest-02` — Grove 70% / Canopy 20% / Pack 10% (forest; shared by 1 authored node)

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

### `node-t1-forest-03` — Canopy 70% / Pack 20% / Grove 10% (forest; shared by 1 authored node)

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

### `node-t1-forest-04` — Pack 45% / Grove 45% / Canopy 10% (forest; shared by 1 authored node)

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

### `node-t1-forest-05` — Pack 34% / Grove 33% / Canopy 33% (forest; shared by 1 authored node)

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

### `node-t1-plains-01` — Herd 70% / Swarm 20% / Sky 10% (plains; shared by 1 authored node)

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

### `node-t1-plains-02` — Swarm 70% / Sky 20% / Herd 10% (plains; shared by 1 authored node)

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

### `node-t1-plains-03` — Sky 70% / Herd 20% / Swarm 10% (plains; shared by 1 authored node)

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

### `node-t1-plains-04` — Herd 45% / Swarm 45% / Sky 10% (plains; shared by 1 authored node)

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

### `node-t1-plains-05` — Herd 34% / Swarm 33% / Sky 33% (plains; shared by 1 authored node)

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

### `node-t1-swamp-01` — Mire 70% / Coven 20% / Stalker 10% (swamp; shared by 1 authored node)

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

### `node-t1-swamp-02` — Coven 70% / Stalker 20% / Mire 10% (swamp; shared by 1 authored node)

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

### `node-t1-swamp-03` — Stalker 70% / Mire 20% / Coven 10% (swamp; shared by 1 authored node)

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

### `node-t1-swamp-04` — Mire 45% / Coven 45% / Stalker 10% (swamp; shared by 1 authored node)

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

### `node-t1-swamp-05` — Mire 34% / Coven 33% / Stalker 33% (swamp; shared by 1 authored node)

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

### `node-t1-swamp-06` — Coven 55% / Stalker 30% / Mire 15% (swamp; shared by 1 authored node)

Dominant family **Coven** drops `control`, punishes `tempo`. Authored Coven 55% / Stalker 30% / Mire 15%; unfieldable at T1: none.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 25 | 3208 | 8.33 | +8.7% | 0 | kill-chain.kill-pulse x25 |
| `lineage-broadsword-empowered` | empowered | energy | 23 | 3335 | 7.67 | +0.0% | 0 | empowered.weak-point x5 |
| `lineage-broadsword-tempo` | tempo | energy | 23 | 3335 | 7.67 | +0.0% | 0 | tempo.ghost-strike x29 |
| `lineage-broadsword-baseline` | _control_ | energy | 23 | 3335 | 7.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 25 | 3100 | 8.33 | +8.7% | 0 | tempo.ghost-strike x40 |
| `lineage-rapier-affliction` | affliction | cadence | 29 | 2914 | 9.67 | +26.1% | 0 | affliction.bleed-pips x117 |
| `lineage-rapier-engagement` | engagement | cadence | 29 | 2514 | 9.67 | +26.1% | 0 | engagement.opening-flash x18 |
| `lineage-rapier-baseline` | _control_ | cadence | 23 | 3422 | 7.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 20 | 2710 | 6.67 | +5.3% | 0 | empowered.plating-crack x14 |
| `lineage-hammer-control` | control | cooldown | 20 | 2710 | 6.67 | +5.3% | 0 | control.frost-drag x9 |
| `lineage-hammer-engagement` | engagement | cooldown | 20 | 2710 | 6.67 | +5.3% | 0 | engagement.brace-sparks x16 |
| `lineage-hammer-baseline` | _control_ | cooldown | 19 | 3400 | 6.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 16 | 4200 | 5.33 | +0.0% | 0 | tempo.ghost-strike x23 |
| `lineage-axe-kill-chain` | kill-chain | dot | 18 | 4278 | 6.00 | +12.5% | 0 | kill-chain.kill-pulse x18 |
| `lineage-axe-empowered` | empowered | dot | 16 | 4200 | 5.33 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 16 | 4200 | 5.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 25 | 3288 | 8.33 | +13.6% | 0 | affliction.venom-pips x145 |
| `lineage-dagger-control` | control | reload | 24 | 3167 | 8.00 | +9.1% | 0 | control.frost-drag x46 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 23 | 3452 | 7.67 | +4.5% | 0 | kill-chain.spread-arc x1 |
| `lineage-dagger-baseline` | _control_ | reload | 22 | 3418 | 7.33 | — | 0 | — |

