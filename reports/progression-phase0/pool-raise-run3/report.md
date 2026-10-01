# Pool raise bench — 2026-10-01T18:11:01.780Z

tiers 1/2/3/4; factors 1, seed, 1.5 (seed = 1/1.25/1.3/1.35/1.4);
boss cap 300 s; normal-node cap 120 s on 3 lane(s) per lineage; gear +3; seeds 101009, 101033.

Criterion (Phase 0 call four): the lowest factor whose median boss time-to-death
exceeds median kill time for the pure lanes, without median normal-node fight-end
HP above 0.80. Time-to-death is clamped at 1200 s, which reads as "the boss
cannot kill this build"; kill time is extrapolated from the share of the bar removed
whenever the boss survived, which is optimistic for a boss that gets harder late.

## Gate table

| tier | factor | lanes | median TTD (s) | median kill (s) | TTD/kill | lanes TTD>kill | median end HP | deaths | measured TTD | measured kill |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| T1 | 1.00 | 15 | 44.4 | 55.8 | 0.80 | 3/15 | 0.89 | 0 | 24/30 | 6/30 |
| T1 | 1.25 | 15 | 58.3 | 55.8 | 1.04 | 7/15 | 0.92 | 0 | 16/30 | 14/30 |
| T1 | 1.50 | 15 | 69.9 | 55.8 | 1.25 | 9/15 | 0.93 | 0 | 12/30 | 18/30 |
| T2 | 1.00 | 15 | 203.2 | 67.6 | 3.01 | 9/15 | 1.00 | 2 | 12/30 | 18/30 |
| T2 | 1.30 | 15 | 335.7 | 67.6 | 4.97 | 9/15 | 1.00 | 1 | 12/30 | 18/30 |
| T2 | 1.50 | 15 | 546.5 | 67.6 | 8.08 | 9/15 | 1.00 | 0 | 12/30 | 18/30 |
| T3 | 1.00 | 15 | 429.1 | 127.0 | 3.38 | 9/15 | 1.00 | 0 | 12/30 | 18/30 |
| T3 | 1.35 | 15 | 666.9 | 127.0 | 5.25 | 9/15 | 1.00 | 0 | 12/30 | 18/30 |
| T3 | 1.50 | 15 | 782.7 | 127.0 | 6.16 | 9/15 | 1.00 | 0 | 12/30 | 18/30 |
| T4 | 1.00 | 15 | >=1200 | 324.1 | 3.70 | 13/15 | 1.00 | 0 | 3/30 | 5/30 |
| T4 | 1.40 | 15 | >=1200 | 320.9 | 3.74 | 15/15 | 1.00 | 0 | 1/30 | 5/30 |
| T4 | 1.50 | 15 | >=1200 | 320.9 | 3.74 | 15/15 | 1.00 | 0 | 1/30 | 5/30 |

## Per lane, boss

| cell | factor | boss | maxHp | outcome | kill (s) | TTD (s) | TTD/kill | cards | refusals |
|---|---:|---|---:|---|---:|---:|---:|---:|---|
| t1-broadsword-kill-chain | 1.00 | tusked-razorback | 139 | player_died | 65.5 | 37.8 | 0.58 | 2 |  |
| t1-broadsword-kill-chain | 1.00 | tusked-razorback | 139 | player_died | 62.7 | 31.2 | 0.50 | 2 |  |
| t1-broadsword-kill-chain | 1.25 | tusked-razorback | 174 | player_died | 67.2 | 45.2 | 0.67 | 2 |  |
| t1-broadsword-kill-chain | 1.25 | tusked-razorback | 174 | player_died | 66.4 | 39.4 | 0.59 | 2 |  |
| t1-broadsword-kill-chain | 1.50 | tusked-razorback | 209 | player_died | 65.2 | 55.2 | 0.85 | 2 |  |
| t1-broadsword-kill-chain | 1.50 | tusked-razorback | 209 | player_died | 66.3 | 45.3 | 0.68 | 2 |  |
| t1-broadsword-empowered | 1.00 | tusked-razorback | 139 | player_died | 58.0 | 37.7 | 0.65 | 2 |  |
| t1-broadsword-empowered | 1.00 | tusked-razorback | 139 | player_died | 61.8 | 35.5 | 0.57 | 2 |  |
| t1-broadsword-empowered | 1.25 | tusked-razorback | 174 | player_died | 62.1 | 43.2 | 0.70 | 2 |  |
| t1-broadsword-empowered | 1.25 | tusked-razorback | 174 | player_died | 62.1 | 45.2 | 0.73 | 2 |  |
| t1-broadsword-empowered | 1.50 | tusked-razorback | 209 | player_died | 59.2 | 58.6 | 0.99 | 2 |  |
| t1-broadsword-empowered | 1.50 | tusked-razorback | 209 | player_died | 63.6 | 55.1 | 0.87 | 2 |  |
| t1-broadsword-tempo | 1.00 | tusked-razorback | 139 | player_died | 63.0 | 37.4 | 0.59 | 2 |  |
| t1-broadsword-tempo | 1.00 | tusked-razorback | 139 | player_died | 63.2 | 31.1 | 0.49 | 2 |  |
| t1-broadsword-tempo | 1.25 | tusked-razorback | 174 | player_died | 69.1 | 45.1 | 0.65 | 2 |  |
| t1-broadsword-tempo | 1.25 | tusked-razorback | 174 | player_died | 63.2 | 38.2 | 0.60 | 2 |  |
| t1-broadsword-tempo | 1.50 | tusked-razorback | 209 | player_died | 65.1 | 59.4 | 0.91 | 2 |  |
| t1-broadsword-tempo | 1.50 | tusked-razorback | 209 | player_died | 66.6 | 43.2 | 0.65 | 2 |  |
| t2-broadsword-kill-chain | 1.00 | gorging-razortusk | 216 | boss_killed | 67.6 | 175.5 | 2.60 | 3 |  |
| t2-broadsword-kill-chain | 1.00 | gorging-razortusk | 216 | boss_killed | 67.6 | 289.1 | 4.28 | 3 |  |
| t2-broadsword-kill-chain | 1.30 | gorging-razortusk | 282 | boss_killed | 67.6 | 416.7 | 6.16 | 3 |  |
| t2-broadsword-kill-chain | 1.30 | gorging-razortusk | 282 | boss_killed | 67.6 | 788.2 | 11.66 | 3 |  |
| t2-broadsword-kill-chain | 1.50 | gorging-razortusk | 325 | boss_killed | 67.6 | 530.4 | 7.85 | 3 |  |
| t2-broadsword-kill-chain | 1.50 | gorging-razortusk | 325 | boss_killed | 67.6 | 1182.3 | 17.49 | 3 |  |
| t2-broadsword-empowered | 1.00 | gorging-razortusk | 216 | boss_killed | 62.3 | 224.0 | 3.60 | 3 |  |
| t2-broadsword-empowered | 1.00 | gorging-razortusk | 216 | boss_killed | 61.4 | 200.9 | 3.27 | 3 |  |
| t2-broadsword-empowered | 1.30 | gorging-razortusk | 282 | boss_killed | 62.3 | 286.1 | 4.59 | 3 |  |
| t2-broadsword-empowered | 1.30 | gorging-razortusk | 282 | boss_killed | 60.5 | 575.2 | 9.51 | 3 |  |
| t2-broadsword-empowered | 1.50 | gorging-razortusk | 325 | boss_killed | 62.3 | 442.0 | 7.09 | 3 |  |
| t2-broadsword-empowered | 1.50 | gorging-razortusk | 325 | boss_killed | 60.5 | 824.9 | 13.64 | 3 |  |
| t2-broadsword-tempo | 1.00 | gorging-razortusk | 216 | boss_killed | 66.8 | 142.1 | 2.13 | 3 |  |
| t2-broadsword-tempo | 1.00 | gorging-razortusk | 216 | boss_killed | 66.8 | 91.9 | 1.38 | 3 |  |
| t2-broadsword-tempo | 1.30 | gorging-razortusk | 282 | boss_killed | 66.8 | 242.9 | 3.64 | 3 |  |
| t2-broadsword-tempo | 1.30 | gorging-razortusk | 282 | boss_killed | 65.9 | 258.1 | 3.92 | 3 |  |
| t2-broadsword-tempo | 1.50 | gorging-razortusk | 325 | boss_killed | 66.8 | 350.4 | 5.25 | 3 |  |
| t2-broadsword-tempo | 1.50 | gorging-razortusk | 325 | boss_killed | 65.9 | 376.5 | 5.71 | 3 |  |
| t3-broadsword-kill-chain | 1.00 | dune-carapace-monarch | 413 | player_died | 118.2 | 75.0 | 0.63 | 3 |  |
| t3-broadsword-kill-chain | 1.00 | dune-carapace-monarch | 413 | player_died | 118.2 | 75.0 | 0.63 | 3 |  |
| t3-broadsword-kill-chain | 1.35 | dune-carapace-monarch | 558 | player_died | 122.0 | 78.0 | 0.64 | 3 |  |
| t3-broadsword-kill-chain | 1.35 | dune-carapace-monarch | 558 | player_died | 122.0 | 78.0 | 0.64 | 3 |  |
| t3-broadsword-kill-chain | 1.50 | dune-carapace-monarch | 620 | player_died | 118.7 | 83.2 | 0.70 | 3 |  |
| t3-broadsword-kill-chain | 1.50 | dune-carapace-monarch | 620 | player_died | 118.7 | 83.2 | 0.70 | 3 |  |
| t3-broadsword-empowered | 1.00 | dune-carapace-monarch | 413 | player_died | 112.7 | 76.9 | 0.68 | 3 |  |
| t3-broadsword-empowered | 1.00 | dune-carapace-monarch | 413 | player_died | 112.7 | 76.9 | 0.68 | 3 |  |
| t3-broadsword-empowered | 1.35 | dune-carapace-monarch | 558 | player_died | 110.3 | 89.9 | 0.81 | 3 |  |
| t3-broadsword-empowered | 1.35 | dune-carapace-monarch | 558 | player_died | 110.3 | 89.9 | 0.81 | 3 |  |
| t3-broadsword-empowered | 1.50 | dune-carapace-monarch | 620 | player_died | 110.3 | 89.9 | 0.81 | 3 |  |
| t3-broadsword-empowered | 1.50 | dune-carapace-monarch | 620 | player_died | 110.3 | 89.9 | 0.81 | 3 |  |
| t3-broadsword-tempo | 1.00 | dune-carapace-monarch | 413 | player_died | 103.6 | 66.3 | 0.64 | 3 |  |
| t3-broadsword-tempo | 1.00 | dune-carapace-monarch | 413 | player_died | 103.6 | 66.3 | 0.64 | 3 |  |
| t3-broadsword-tempo | 1.35 | dune-carapace-monarch | 558 | player_died | 104.4 | 74.9 | 0.72 | 3 |  |
| t3-broadsword-tempo | 1.35 | dune-carapace-monarch | 558 | player_died | 104.4 | 74.9 | 0.72 | 3 |  |
| t3-broadsword-tempo | 1.50 | dune-carapace-monarch | 620 | player_died | 104.9 | 77.9 | 0.74 | 3 |  |
| t3-broadsword-tempo | 1.50 | dune-carapace-monarch | 620 | player_died | 104.9 | 77.9 | 0.74 | 3 |  |
| t4-broadsword-kill-chain | 1.00 | dune-throne-sovereign | 665 | timeout | 311.4 | >=1200 | 3.85 | 4 |  |
| t4-broadsword-kill-chain | 1.00 | dune-throne-sovereign | 665 | timeout | 311.4 | >=1200 | 3.85 | 4 |  |
| t4-broadsword-kill-chain | 1.40 | dune-throne-sovereign | 931 | timeout | 311.4 | >=1200 | 3.85 | 4 |  |
| t4-broadsword-kill-chain | 1.40 | dune-throne-sovereign | 931 | timeout | 311.4 | >=1200 | 3.85 | 4 |  |
| t4-broadsword-kill-chain | 1.50 | dune-throne-sovereign | 998 | timeout | 311.4 | >=1200 | 3.85 | 4 |  |
| t4-broadsword-kill-chain | 1.50 | dune-throne-sovereign | 998 | timeout | 311.4 | >=1200 | 3.85 | 4 |  |
| t4-broadsword-empowered | 1.00 | dune-throne-sovereign | 665 | boss_killed | 290.6 | >=1200 | 4.13 | 4 |  |
| t4-broadsword-empowered | 1.00 | dune-throne-sovereign | 665 | boss_killed | 290.6 | >=1200 | 4.13 | 4 |  |
| t4-broadsword-empowered | 1.40 | dune-throne-sovereign | 931 | boss_killed | 290.6 | >=1200 | 4.13 | 4 |  |
| t4-broadsword-empowered | 1.40 | dune-throne-sovereign | 931 | boss_killed | 290.6 | >=1200 | 4.13 | 4 |  |
| t4-broadsword-empowered | 1.50 | dune-throne-sovereign | 998 | boss_killed | 290.6 | >=1200 | 4.13 | 4 |  |
| t4-broadsword-empowered | 1.50 | dune-throne-sovereign | 998 | boss_killed | 290.6 | >=1200 | 4.13 | 4 |  |
| t4-broadsword-tempo | 1.00 | dune-throne-sovereign | 665 | boss_killed | 266.0 | >=1200 | 4.51 | 4 |  |
| t4-broadsword-tempo | 1.00 | dune-throne-sovereign | 665 | boss_killed | 266.0 | >=1200 | 4.51 | 4 |  |
| t4-broadsword-tempo | 1.40 | dune-throne-sovereign | 931 | boss_killed | 266.0 | >=1200 | 4.51 | 4 |  |
| t4-broadsword-tempo | 1.40 | dune-throne-sovereign | 931 | boss_killed | 266.0 | >=1200 | 4.51 | 4 |  |
| t4-broadsword-tempo | 1.50 | dune-throne-sovereign | 998 | boss_killed | 266.0 | >=1200 | 4.51 | 4 |  |
| t4-broadsword-tempo | 1.50 | dune-throne-sovereign | 998 | boss_killed | 266.0 | >=1200 | 4.51 | 4 |  |
| t1-rapier-tempo | 1.00 | gnarled-greatbear | 163 | player_died | 39.0 | 21.9 | 0.56 | 2 |  |
| t1-rapier-tempo | 1.00 | gnarled-greatbear | 163 | player_died | 39.0 | 21.9 | 0.56 | 2 |  |
| t1-rapier-tempo | 1.25 | gnarled-greatbear | 204 | player_died | 38.1 | 24.6 | 0.65 | 2 |  |
| t1-rapier-tempo | 1.25 | gnarled-greatbear | 204 | player_died | 38.1 | 24.6 | 0.65 | 2 |  |
| t1-rapier-tempo | 1.50 | gnarled-greatbear | 244 | player_died | 37.8 | 27.6 | 0.73 | 2 |  |
| t1-rapier-tempo | 1.50 | gnarled-greatbear | 244 | player_died | 37.8 | 27.6 | 0.73 | 2 |  |
| t1-rapier-affliction | 1.00 | gnarled-greatbear | 163 | player_died | 40.2 | 21.9 | 0.54 | 2 |  |
| t1-rapier-affliction | 1.00 | gnarled-greatbear | 163 | player_died | 40.2 | 21.9 | 0.54 | 2 |  |
| t1-rapier-affliction | 1.25 | gnarled-greatbear | 204 | player_died | 41.6 | 24.6 | 0.59 | 2 |  |
| t1-rapier-affliction | 1.25 | gnarled-greatbear | 204 | player_died | 41.6 | 24.6 | 0.59 | 2 |  |
| t1-rapier-affliction | 1.50 | gnarled-greatbear | 244 | player_died | 40.5 | 27.6 | 0.68 | 2 |  |
| t1-rapier-affliction | 1.50 | gnarled-greatbear | 244 | player_died | 40.5 | 27.6 | 0.68 | 2 |  |
| t1-rapier-engagement | 1.00 | gnarled-greatbear | 163 | player_died | 38.6 | 21.9 | 0.57 | 2 |  |
| t1-rapier-engagement | 1.00 | gnarled-greatbear | 163 | player_died | 38.6 | 21.9 | 0.57 | 2 |  |
| t1-rapier-engagement | 1.25 | gnarled-greatbear | 204 | player_died | 40.1 | 24.6 | 0.61 | 2 |  |
| t1-rapier-engagement | 1.25 | gnarled-greatbear | 204 | player_died | 40.1 | 24.6 | 0.61 | 2 |  |
| t1-rapier-engagement | 1.50 | gnarled-greatbear | 244 | player_died | 39.1 | 27.6 | 0.71 | 2 |  |
| t1-rapier-engagement | 1.50 | gnarled-greatbear | 244 | player_died | 39.1 | 27.6 | 0.71 | 2 |  |
| t2-rapier-tempo | 1.00 | apex-timberclaw | 241 | player_died | 64.2 | 37.9 | 0.59 | 3 |  |
| t2-rapier-tempo | 1.00 | apex-timberclaw | 241 | player_died | 64.2 | 37.9 | 0.59 | 3 |  |
| t2-rapier-tempo | 1.30 | apex-timberclaw | 312 | player_died | 64.0 | 45.9 | 0.72 | 3 |  |
| t2-rapier-tempo | 1.30 | apex-timberclaw | 312 | player_died | 64.0 | 45.9 | 0.72 | 3 |  |
| t2-rapier-tempo | 1.50 | apex-timberclaw | 362 | player_died | 63.8 | 48.1 | 0.75 | 3 |  |
| t2-rapier-tempo | 1.50 | apex-timberclaw | 362 | player_died | 63.8 | 48.1 | 0.75 | 3 |  |
| t2-rapier-affliction | 1.00 | apex-timberclaw | 241 | player_died | 68.2 | 38.1 | 0.56 | 3 |  |
| t2-rapier-affliction | 1.00 | apex-timberclaw | 241 | player_died | 68.2 | 38.1 | 0.56 | 3 |  |
| t2-rapier-affliction | 1.30 | apex-timberclaw | 312 | player_died | 69.0 | 45.9 | 0.67 | 3 |  |
| t2-rapier-affliction | 1.30 | apex-timberclaw | 312 | player_died | 69.0 | 45.9 | 0.67 | 3 |  |
| t2-rapier-affliction | 1.50 | apex-timberclaw | 362 | player_died | 68.7 | 48.6 | 0.71 | 3 |  |
| t2-rapier-affliction | 1.50 | apex-timberclaw | 362 | player_died | 68.7 | 48.6 | 0.71 | 3 |  |
| t2-rapier-engagement | 1.00 | apex-timberclaw | 241 | player_died | 59.0 | 37.7 | 0.64 | 3 |  |
| t2-rapier-engagement | 1.00 | apex-timberclaw | 241 | player_died | 59.0 | 37.7 | 0.64 | 3 |  |
| t2-rapier-engagement | 1.30 | apex-timberclaw | 312 | player_died | 59.7 | 45.9 | 0.77 | 3 |  |
| t2-rapier-engagement | 1.30 | apex-timberclaw | 312 | player_died | 59.7 | 45.9 | 0.77 | 3 |  |
| t2-rapier-engagement | 1.50 | apex-timberclaw | 362 | player_died | 58.8 | 48.1 | 0.82 | 3 |  |
| t2-rapier-engagement | 1.50 | apex-timberclaw | 362 | player_died | 58.8 | 48.1 | 0.82 | 3 |  |
| t3-rapier-tempo | 1.00 | apex-bramble-slasher | 450 | boss_killed | 140.8 | >=1200 | 8.52 | 3 |  |
| t3-rapier-tempo | 1.00 | apex-bramble-slasher | 450 | boss_killed | 140.8 | >=1200 | 8.52 | 3 |  |
| t3-rapier-tempo | 1.35 | apex-bramble-slasher | 607 | boss_killed | 140.8 | >=1200 | 8.52 | 3 |  |
| t3-rapier-tempo | 1.35 | apex-bramble-slasher | 607 | boss_killed | 140.8 | >=1200 | 8.52 | 3 |  |
| t3-rapier-tempo | 1.50 | apex-bramble-slasher | 675 | boss_killed | 140.8 | >=1200 | 8.52 | 3 |  |
| t3-rapier-tempo | 1.50 | apex-bramble-slasher | 675 | boss_killed | 140.8 | >=1200 | 8.52 | 3 |  |
| t3-rapier-affliction | 1.00 | apex-bramble-slasher | 450 | boss_killed | 133.3 | 521.8 | 3.91 | 3 |  |
| t3-rapier-affliction | 1.00 | apex-bramble-slasher | 450 | boss_killed | 133.3 | 521.8 | 3.91 | 3 |  |
| t3-rapier-affliction | 1.35 | apex-bramble-slasher | 607 | boss_killed | 133.3 | 703.8 | 5.28 | 3 |  |
| t3-rapier-affliction | 1.35 | apex-bramble-slasher | 607 | boss_killed | 133.3 | 703.8 | 5.28 | 3 |  |
| t3-rapier-affliction | 1.50 | apex-bramble-slasher | 675 | boss_killed | 133.3 | 782.7 | 5.87 | 3 |  |
| t3-rapier-affliction | 1.50 | apex-bramble-slasher | 675 | boss_killed | 133.3 | 782.7 | 5.87 | 3 |  |
| t3-rapier-engagement | 1.00 | apex-bramble-slasher | 450 | boss_killed | 121.5 | >=1200 | 9.88 | 3 |  |
| t3-rapier-engagement | 1.00 | apex-bramble-slasher | 450 | boss_killed | 121.5 | >=1200 | 9.88 | 3 |  |
| t3-rapier-engagement | 1.35 | apex-bramble-slasher | 607 | boss_killed | 121.5 | >=1200 | 9.88 | 3 |  |
| t3-rapier-engagement | 1.35 | apex-bramble-slasher | 607 | boss_killed | 121.5 | >=1200 | 9.88 | 3 |  |
| t3-rapier-engagement | 1.50 | apex-bramble-slasher | 675 | boss_killed | 121.5 | >=1200 | 9.88 | 3 |  |
| t3-rapier-engagement | 1.50 | apex-bramble-slasher | 675 | boss_killed | 121.5 | >=1200 | 9.88 | 3 |  |
| t4-rapier-tempo | 1.00 | verdant-crown-predator | 713 | timeout | 374.6 | >=1200 | 3.20 | 4 |  |
| t4-rapier-tempo | 1.00 | verdant-crown-predator | 713 | timeout | 374.6 | >=1200 | 3.20 | 4 |  |
| t4-rapier-tempo | 1.40 | verdant-crown-predator | 999 | timeout | 374.6 | >=1200 | 3.20 | 4 |  |
| t4-rapier-tempo | 1.40 | verdant-crown-predator | 999 | timeout | 374.6 | >=1200 | 3.20 | 4 |  |
| t4-rapier-tempo | 1.50 | verdant-crown-predator | 1071 | timeout | 374.6 | >=1200 | 3.20 | 4 |  |
| t4-rapier-tempo | 1.50 | verdant-crown-predator | 1071 | timeout | 374.6 | >=1200 | 3.20 | 4 |  |
| t4-rapier-affliction | 1.00 | verdant-crown-predator | 713 | timeout | 357.8 | >=1200 | 3.35 | 4 |  |
| t4-rapier-affliction | 1.00 | verdant-crown-predator | 713 | timeout | 357.8 | >=1200 | 3.35 | 4 |  |
| t4-rapier-affliction | 1.40 | verdant-crown-predator | 999 | timeout | 357.8 | >=1200 | 3.35 | 4 |  |
| t4-rapier-affliction | 1.40 | verdant-crown-predator | 999 | timeout | 357.8 | >=1200 | 3.35 | 4 |  |
| t4-rapier-affliction | 1.50 | verdant-crown-predator | 1071 | timeout | 357.8 | >=1200 | 3.35 | 4 |  |
| t4-rapier-affliction | 1.50 | verdant-crown-predator | 1071 | timeout | 357.8 | >=1200 | 3.35 | 4 |  |
| t4-rapier-engagement | 1.00 | verdant-crown-predator | 713 | timeout | 330.6 | >=1200 | 3.63 | 4 |  |
| t4-rapier-engagement | 1.00 | verdant-crown-predator | 713 | timeout | 330.6 | >=1200 | 3.63 | 4 |  |
| t4-rapier-engagement | 1.40 | verdant-crown-predator | 999 | timeout | 330.6 | >=1200 | 3.63 | 4 |  |
| t4-rapier-engagement | 1.40 | verdant-crown-predator | 999 | timeout | 330.6 | >=1200 | 3.63 | 4 |  |
| t4-rapier-engagement | 1.50 | verdant-crown-predator | 1071 | timeout | 330.6 | >=1200 | 3.63 | 4 |  |
| t4-rapier-engagement | 1.50 | verdant-crown-predator | 1071 | timeout | 330.6 | >=1200 | 3.63 | 4 |  |
| t1-hammer-empowered | 1.00 | crag-behemoth | 191 | player_died | 87.7 | 44.4 | 0.51 | 2 |  |
| t1-hammer-empowered | 1.00 | crag-behemoth | 191 | player_died | 87.7 | 44.4 | 0.51 | 2 |  |
| t1-hammer-empowered | 1.25 | crag-behemoth | 239 | player_died | 90.0 | 78.7 | 0.87 | 2 |  |
| t1-hammer-empowered | 1.25 | crag-behemoth | 239 | player_died | 90.0 | 78.7 | 0.87 | 2 |  |
| t1-hammer-empowered | 1.50 | crag-behemoth | 287 | boss_killed | 88.0 | 141.3 | 1.61 | 2 |  |
| t1-hammer-empowered | 1.50 | crag-behemoth | 287 | boss_killed | 88.0 | 141.3 | 1.61 | 2 |  |
| t1-hammer-control | 1.00 | crag-behemoth | 191 | player_died | 86.2 | 44.4 | 0.52 | 2 |  |
| t1-hammer-control | 1.00 | crag-behemoth | 191 | player_died | 86.2 | 44.4 | 0.52 | 2 |  |
| t1-hammer-control | 1.25 | crag-behemoth | 239 | player_died | 88.4 | 78.7 | 0.89 | 2 |  |
| t1-hammer-control | 1.25 | crag-behemoth | 239 | player_died | 88.4 | 78.7 | 0.89 | 2 |  |
| t1-hammer-control | 1.50 | crag-behemoth | 287 | boss_killed | 88.0 | 141.3 | 1.61 | 2 |  |
| t1-hammer-control | 1.50 | crag-behemoth | 287 | boss_killed | 88.0 | 141.3 | 1.61 | 2 |  |
| t1-hammer-engagement | 1.00 | crag-behemoth | 191 | player_died | 86.2 | 44.4 | 0.52 | 2 |  |
| t1-hammer-engagement | 1.00 | crag-behemoth | 191 | player_died | 86.2 | 44.4 | 0.52 | 2 |  |
| t1-hammer-engagement | 1.25 | crag-behemoth | 239 | boss_killed | 88.0 | 106.3 | 1.21 | 2 |  |
| t1-hammer-engagement | 1.25 | crag-behemoth | 239 | boss_killed | 88.0 | 106.3 | 1.21 | 2 |  |
| t1-hammer-engagement | 1.50 | crag-behemoth | 287 | boss_killed | 88.0 | 149.2 | 1.69 | 2 |  |
| t1-hammer-engagement | 1.50 | crag-behemoth | 287 | boss_killed | 88.0 | 149.2 | 1.69 | 2 |  |
| t2-hammer-empowered | 1.00 | stoneplate-juggernaut | 317 | boss_killed | 77.5 | 218.8 | 2.82 | 3 |  |
| t2-hammer-empowered | 1.00 | stoneplate-juggernaut | 317 | boss_killed | 77.5 | 218.8 | 2.82 | 3 |  |
| t2-hammer-empowered | 1.30 | stoneplate-juggernaut | 412 | boss_killed | 77.5 | 422.3 | 5.45 | 3 |  |
| t2-hammer-empowered | 1.30 | stoneplate-juggernaut | 412 | boss_killed | 77.5 | 422.3 | 5.45 | 3 |  |
| t2-hammer-empowered | 1.50 | stoneplate-juggernaut | 475 | boss_killed | 77.5 | 734.8 | 9.48 | 3 |  |
| t2-hammer-empowered | 1.50 | stoneplate-juggernaut | 475 | boss_killed | 77.5 | 734.8 | 9.48 | 3 |  |
| t2-hammer-control | 1.00 | stoneplate-juggernaut | 317 | boss_killed | 77.4 | 214.6 | 2.77 | 3 |  |
| t2-hammer-control | 1.00 | stoneplate-juggernaut | 317 | boss_killed | 77.4 | 214.6 | 2.77 | 3 |  |
| t2-hammer-control | 1.30 | stoneplate-juggernaut | 412 | boss_killed | 77.4 | 420.8 | 5.44 | 3 |  |
| t2-hammer-control | 1.30 | stoneplate-juggernaut | 412 | boss_killed | 77.4 | 420.8 | 5.44 | 3 |  |
| t2-hammer-control | 1.50 | stoneplate-juggernaut | 475 | boss_killed | 77.4 | 731.1 | 9.45 | 3 |  |
| t2-hammer-control | 1.50 | stoneplate-juggernaut | 475 | boss_killed | 77.4 | 731.1 | 9.45 | 3 |  |
| t2-hammer-engagement | 1.00 | stoneplate-juggernaut | 317 | boss_killed | 71.2 | 203.2 | 2.85 | 3 |  |
| t2-hammer-engagement | 1.00 | stoneplate-juggernaut | 317 | boss_killed | 71.2 | 203.2 | 2.85 | 3 |  |
| t2-hammer-engagement | 1.30 | stoneplate-juggernaut | 412 | boss_killed | 71.2 | 335.7 | 4.71 | 3 |  |
| t2-hammer-engagement | 1.30 | stoneplate-juggernaut | 412 | boss_killed | 71.2 | 335.7 | 4.71 | 3 |  |
| t2-hammer-engagement | 1.50 | stoneplate-juggernaut | 475 | boss_killed | 71.2 | 546.5 | 7.68 | 3 |  |
| t2-hammer-engagement | 1.50 | stoneplate-juggernaut | 475 | boss_killed | 71.2 | 546.5 | 7.68 | 3 |  |
| t3-hammer-empowered | 1.00 | crag-gorged-horn-behemoth | 606 | boss_killed | 139.2 | 214.1 | 1.54 | 3 |  |
| t3-hammer-empowered | 1.00 | crag-gorged-horn-behemoth | 606 | boss_killed | 139.2 | 214.1 | 1.54 | 3 |  |
| t3-hammer-empowered | 1.35 | crag-gorged-horn-behemoth | 819 | boss_killed | 139.2 | 666.9 | 4.79 | 3 |  |
| t3-hammer-empowered | 1.35 | crag-gorged-horn-behemoth | 819 | boss_killed | 139.2 | 666.9 | 4.79 | 3 |  |
| t3-hammer-empowered | 1.50 | crag-gorged-horn-behemoth | 909 | boss_killed | 139.2 | 885.2 | 6.36 | 3 |  |
| t3-hammer-empowered | 1.50 | crag-gorged-horn-behemoth | 909 | boss_killed | 139.2 | 885.2 | 6.36 | 3 |  |
| t3-hammer-control | 1.00 | crag-gorged-horn-behemoth | 606 | boss_killed | 124.1 | 429.1 | 3.46 | 3 |  |
| t3-hammer-control | 1.00 | crag-gorged-horn-behemoth | 606 | boss_killed | 124.1 | 429.1 | 3.46 | 3 |  |
| t3-hammer-control | 1.35 | crag-gorged-horn-behemoth | 819 | boss_killed | 124.1 | >=1200 | 9.67 | 3 |  |
| t3-hammer-control | 1.35 | crag-gorged-horn-behemoth | 819 | boss_killed | 124.1 | >=1200 | 9.67 | 3 |  |
| t3-hammer-control | 1.50 | crag-gorged-horn-behemoth | 909 | boss_killed | 124.1 | >=1200 | 9.67 | 3 |  |
| t3-hammer-control | 1.50 | crag-gorged-horn-behemoth | 909 | boss_killed | 124.1 | >=1200 | 9.67 | 3 |  |
| t3-hammer-engagement | 1.00 | crag-gorged-horn-behemoth | 606 | boss_killed | 139.2 | 544.4 | 3.91 | 3 |  |
| t3-hammer-engagement | 1.00 | crag-gorged-horn-behemoth | 606 | boss_killed | 139.2 | 544.4 | 3.91 | 3 |  |
| t3-hammer-engagement | 1.35 | crag-gorged-horn-behemoth | 819 | boss_killed | 139.2 | >=1200 | 8.62 | 3 |  |
| t3-hammer-engagement | 1.35 | crag-gorged-horn-behemoth | 819 | boss_killed | 139.2 | >=1200 | 8.62 | 3 |  |
| t3-hammer-engagement | 1.50 | crag-gorged-horn-behemoth | 909 | boss_killed | 139.2 | >=1200 | 8.62 | 3 |  |
| t3-hammer-engagement | 1.50 | crag-gorged-horn-behemoth | 909 | boss_killed | 139.2 | >=1200 | 8.62 | 3 |  |
| t4-hammer-empowered | 1.00 | iron-crest-titan | 998 | timeout | 306.6 | >=1200 | 3.91 | 4 |  |
| t4-hammer-empowered | 1.00 | iron-crest-titan | 998 | timeout | 307.7 | >=1200 | 3.90 | 4 |  |
| t4-hammer-empowered | 1.40 | iron-crest-titan | 1397 | timeout | 306.6 | >=1200 | 3.91 | 4 |  |
| t4-hammer-empowered | 1.40 | iron-crest-titan | 1397 | timeout | 307.7 | >=1200 | 3.90 | 4 |  |
| t4-hammer-empowered | 1.50 | iron-crest-titan | 1497 | timeout | 306.6 | >=1200 | 3.91 | 4 |  |
| t4-hammer-empowered | 1.50 | iron-crest-titan | 1497 | timeout | 307.7 | >=1200 | 3.90 | 4 |  |
| t4-hammer-control | 1.00 | iron-crest-titan | 998 | timeout | 384.8 | >=1200 | 3.12 | 4 |  |
| t4-hammer-control | 1.00 | iron-crest-titan | 998 | timeout | 388.5 | >=1200 | 3.09 | 4 |  |
| t4-hammer-control | 1.40 | iron-crest-titan | 1397 | timeout | 384.8 | >=1200 | 3.12 | 4 |  |
| t4-hammer-control | 1.40 | iron-crest-titan | 1397 | timeout | 388.5 | >=1200 | 3.09 | 4 |  |
| t4-hammer-control | 1.50 | iron-crest-titan | 1497 | timeout | 384.8 | >=1200 | 3.12 | 4 |  |
| t4-hammer-control | 1.50 | iron-crest-titan | 1497 | timeout | 388.5 | >=1200 | 3.09 | 4 |  |
| t4-hammer-engagement | 1.00 | iron-crest-titan | 998 | timeout | 348.8 | >=1200 | 3.44 | 4 |  |
| t4-hammer-engagement | 1.00 | iron-crest-titan | 998 | timeout | 349.7 | >=1200 | 3.43 | 4 |  |
| t4-hammer-engagement | 1.40 | iron-crest-titan | 1397 | timeout | 348.8 | >=1200 | 3.44 | 4 |  |
| t4-hammer-engagement | 1.40 | iron-crest-titan | 1397 | timeout | 349.7 | >=1200 | 3.43 | 4 |  |
| t4-hammer-engagement | 1.50 | iron-crest-titan | 1497 | timeout | 348.8 | >=1200 | 3.44 | 4 |  |
| t4-hammer-engagement | 1.50 | iron-crest-titan | 1497 | timeout | 349.7 | >=1200 | 3.43 | 4 |  |
| t1-axe-tempo | 1.00 | obsidian-broodmother | 156 | boss_killed | 55.8 | >=1200 | 21.51 | 2 |  |
| t1-axe-tempo | 1.00 | obsidian-broodmother | 156 | boss_killed | 55.8 | >=1200 | 21.51 | 2 |  |
| t1-axe-tempo | 1.25 | obsidian-broodmother | 195 | boss_killed | 55.8 | >=1200 | 21.51 | 2 |  |
| t1-axe-tempo | 1.25 | obsidian-broodmother | 195 | boss_killed | 55.8 | >=1200 | 21.51 | 2 |  |
| t1-axe-tempo | 1.50 | obsidian-broodmother | 234 | boss_killed | 55.8 | >=1200 | 21.51 | 2 |  |
| t1-axe-tempo | 1.50 | obsidian-broodmother | 234 | boss_killed | 55.8 | >=1200 | 21.51 | 2 |  |
| t1-axe-kill-chain | 1.00 | obsidian-broodmother | 156 | boss_killed | 56.9 | >=1200 | 21.09 | 2 |  |
| t1-axe-kill-chain | 1.00 | obsidian-broodmother | 156 | boss_killed | 56.9 | >=1200 | 21.09 | 2 |  |
| t1-axe-kill-chain | 1.25 | obsidian-broodmother | 195 | boss_killed | 56.9 | >=1200 | 21.09 | 2 |  |
| t1-axe-kill-chain | 1.25 | obsidian-broodmother | 195 | boss_killed | 56.9 | >=1200 | 21.09 | 2 |  |
| t1-axe-kill-chain | 1.50 | obsidian-broodmother | 234 | boss_killed | 56.9 | >=1200 | 21.09 | 2 |  |
| t1-axe-kill-chain | 1.50 | obsidian-broodmother | 234 | boss_killed | 56.9 | >=1200 | 21.09 | 2 |  |
| t1-axe-empowered | 1.00 | obsidian-broodmother | 156 | boss_killed | 55.4 | >=1200 | 21.66 | 2 |  |
| t1-axe-empowered | 1.00 | obsidian-broodmother | 156 | boss_killed | 55.4 | >=1200 | 21.66 | 2 |  |
| t1-axe-empowered | 1.25 | obsidian-broodmother | 195 | boss_killed | 55.4 | >=1200 | 21.66 | 2 |  |
| t1-axe-empowered | 1.25 | obsidian-broodmother | 195 | boss_killed | 55.4 | >=1200 | 21.66 | 2 |  |
| t1-axe-empowered | 1.50 | obsidian-broodmother | 234 | boss_killed | 55.4 | >=1200 | 21.66 | 2 |  |
| t1-axe-empowered | 1.50 | obsidian-broodmother | 234 | boss_killed | 55.4 | >=1200 | 21.66 | 2 |  |
| t2-axe-tempo | 1.00 | chitinous-dreadbore | 235 | player_died | 83.0 | 24.6 | 0.30 | 3 |  |
| t2-axe-tempo | 1.00 | chitinous-dreadbore | 235 | player_died | 83.0 | 24.6 | 0.30 | 3 |  |
| t2-axe-tempo | 1.30 | chitinous-dreadbore | 306 | player_died | 78.9 | 33.6 | 0.43 | 3 |  |
| t2-axe-tempo | 1.30 | chitinous-dreadbore | 306 | player_died | 78.9 | 33.6 | 0.43 | 3 |  |
| t2-axe-tempo | 1.50 | chitinous-dreadbore | 353 | player_died | 77.1 | 39.0 | 0.51 | 3 |  |
| t2-axe-tempo | 1.50 | chitinous-dreadbore | 353 | player_died | 77.1 | 39.0 | 0.51 | 3 |  |
| t2-axe-kill-chain | 1.00 | chitinous-dreadbore | 235 | player_died | 85.6 | 24.6 | 0.29 | 3 |  |
| t2-axe-kill-chain | 1.00 | chitinous-dreadbore | 235 | player_died | 85.6 | 24.6 | 0.29 | 3 |  |
| t2-axe-kill-chain | 1.30 | chitinous-dreadbore | 306 | player_died | 82.3 | 33.6 | 0.41 | 3 |  |
| t2-axe-kill-chain | 1.30 | chitinous-dreadbore | 306 | player_died | 82.3 | 33.6 | 0.41 | 3 |  |
| t2-axe-kill-chain | 1.50 | chitinous-dreadbore | 353 | player_died | 77.8 | 39.0 | 0.50 | 3 |  |
| t2-axe-kill-chain | 1.50 | chitinous-dreadbore | 353 | player_died | 77.8 | 39.0 | 0.50 | 3 |  |
| t2-axe-empowered | 1.00 | chitinous-dreadbore | 235 | player_died | 79.9 | 24.6 | 0.31 | 3 |  |
| t2-axe-empowered | 1.00 | chitinous-dreadbore | 235 | player_died | 79.9 | 24.6 | 0.31 | 3 |  |
| t2-axe-empowered | 1.30 | chitinous-dreadbore | 306 | player_died | 75.6 | 33.6 | 0.44 | 3 |  |
| t2-axe-empowered | 1.30 | chitinous-dreadbore | 306 | player_died | 75.6 | 33.6 | 0.44 | 3 |  |
| t2-axe-empowered | 1.50 | chitinous-dreadbore | 353 | player_died | 73.1 | 39.0 | 0.53 | 3 |  |
| t2-axe-empowered | 1.50 | chitinous-dreadbore | 353 | player_died | 73.1 | 39.0 | 0.53 | 3 |  |
| t3-axe-tempo | 1.00 | deep-core-burrow-gorger | 430 | player_died | 172.3 | 25.1 | 0.15 | 3 |  |
| t3-axe-tempo | 1.00 | deep-core-burrow-gorger | 430 | player_died | 172.3 | 25.1 | 0.15 | 3 |  |
| t3-axe-tempo | 1.35 | deep-core-burrow-gorger | 579 | player_died | 164.8 | 29.1 | 0.18 | 3 |  |
| t3-axe-tempo | 1.35 | deep-core-burrow-gorger | 579 | player_died | 164.8 | 29.1 | 0.18 | 3 |  |
| t3-axe-tempo | 1.50 | deep-core-burrow-gorger | 645 | player_died | 164.8 | 29.1 | 0.18 | 3 |  |
| t3-axe-tempo | 1.50 | deep-core-burrow-gorger | 645 | player_died | 164.8 | 29.1 | 0.18 | 3 |  |
| t3-axe-kill-chain | 1.00 | deep-core-burrow-gorger | 430 | player_died | 173.8 | 25.1 | 0.14 | 3 |  |
| t3-axe-kill-chain | 1.00 | deep-core-burrow-gorger | 430 | player_died | 173.8 | 25.1 | 0.14 | 3 |  |
| t3-axe-kill-chain | 1.35 | deep-core-burrow-gorger | 579 | player_died | 166.2 | 29.1 | 0.18 | 3 |  |
| t3-axe-kill-chain | 1.35 | deep-core-burrow-gorger | 579 | player_died | 166.2 | 29.1 | 0.18 | 3 |  |
| t3-axe-kill-chain | 1.50 | deep-core-burrow-gorger | 645 | player_died | 166.2 | 29.1 | 0.18 | 3 |  |
| t3-axe-kill-chain | 1.50 | deep-core-burrow-gorger | 645 | player_died | 166.2 | 29.1 | 0.18 | 3 |  |
| t3-axe-empowered | 1.00 | deep-core-burrow-gorger | 430 | player_died | 154.6 | 25.1 | 0.16 | 3 |  |
| t3-axe-empowered | 1.00 | deep-core-burrow-gorger | 430 | player_died | 154.6 | 25.1 | 0.16 | 3 |  |
| t3-axe-empowered | 1.35 | deep-core-burrow-gorger | 579 | player_died | 147.9 | 29.1 | 0.20 | 3 |  |
| t3-axe-empowered | 1.35 | deep-core-burrow-gorger | 579 | player_died | 147.9 | 29.1 | 0.20 | 3 |  |
| t3-axe-empowered | 1.50 | deep-core-burrow-gorger | 645 | player_died | 147.9 | 29.1 | 0.20 | 3 |  |
| t3-axe-empowered | 1.50 | deep-core-burrow-gorger | 645 | player_died | 147.9 | 29.1 | 0.20 | 3 |  |
| t4-axe-tempo | 1.00 | charnel-crown-sovereign | 717 | boss_killed | 250.2 | >=1200 | 4.80 | 4 |  |
| t4-axe-tempo | 1.00 | charnel-crown-sovereign | 717 | timeout | 352.6 | >=1200 | 3.40 | 4 |  |
| t4-axe-tempo | 1.40 | charnel-crown-sovereign | 1004 | boss_killed | 250.2 | >=1200 | 4.80 | 4 |  |
| t4-axe-tempo | 1.40 | charnel-crown-sovereign | 1004 | timeout | 352.6 | >=1200 | 3.40 | 4 |  |
| t4-axe-tempo | 1.50 | charnel-crown-sovereign | 1074 | boss_killed | 250.2 | >=1200 | 4.80 | 4 |  |
| t4-axe-tempo | 1.50 | charnel-crown-sovereign | 1074 | timeout | 352.6 | >=1200 | 3.40 | 4 |  |
| t4-axe-kill-chain | 1.00 | charnel-crown-sovereign | 717 | timeout | 437.1 | >=1200 | 2.75 | 4 |  |
| t4-axe-kill-chain | 1.00 | charnel-crown-sovereign | 717 | player_died | 801.0 | 11.9 | 0.01 | 4 |  |
| t4-axe-kill-chain | 1.40 | charnel-crown-sovereign | 1004 | timeout | 437.1 | >=1200 | 2.75 | 4 |  |
| t4-axe-kill-chain | 1.40 | charnel-crown-sovereign | 1004 | timeout | 363.7 | >=1200 | 3.30 | 4 |  |
| t4-axe-kill-chain | 1.50 | charnel-crown-sovereign | 1074 | timeout | 437.1 | >=1200 | 2.75 | 4 |  |
| t4-axe-kill-chain | 1.50 | charnel-crown-sovereign | 1074 | timeout | 363.7 | >=1200 | 3.30 | 4 |  |
| t4-axe-empowered | 1.00 | charnel-crown-sovereign | 717 | player_died | 276.9 | 110.7 | 0.40 | 4 |  |
| t4-axe-empowered | 1.00 | charnel-crown-sovereign | 717 | player_died | 468.1 | 131.3 | 0.28 | 4 |  |
| t4-axe-empowered | 1.40 | charnel-crown-sovereign | 1004 | player_died | 263.2 | 116.8 | 0.44 | 4 |  |
| t4-axe-empowered | 1.40 | charnel-crown-sovereign | 1004 | timeout | 395.0 | >=1200 | 3.04 | 4 |  |
| t4-axe-empowered | 1.50 | charnel-crown-sovereign | 1074 | player_died | 262.2 | 117.9 | 0.45 | 4 |  |
| t4-axe-empowered | 1.50 | charnel-crown-sovereign | 1074 | timeout | 395.0 | >=1200 | 3.04 | 4 |  |
| t1-dagger-affliction | 1.00 | grave-toadeater | 152 | player_died | 47.6 | 47.5 | 1.00 | 2 |  |
| t1-dagger-affliction | 1.00 | grave-toadeater | 152 | player_died | 47.6 | 47.5 | 1.00 | 2 |  |
| t1-dagger-affliction | 1.25 | grave-toadeater | 190 | boss_killed | 47.6 | 58.2 | 1.22 | 2 |  |
| t1-dagger-affliction | 1.25 | grave-toadeater | 190 | boss_killed | 47.6 | 58.2 | 1.22 | 2 |  |
| t1-dagger-affliction | 1.50 | grave-toadeater | 228 | boss_killed | 47.6 | 69.8 | 1.47 | 2 |  |
| t1-dagger-affliction | 1.50 | grave-toadeater | 228 | boss_killed | 47.6 | 69.8 | 1.47 | 2 |  |
| t1-dagger-control | 1.00 | grave-toadeater | 152 | player_died | 49.9 | 47.8 | 0.96 | 2 |  |
| t1-dagger-control | 1.00 | grave-toadeater | 152 | player_died | 49.9 | 47.8 | 0.96 | 2 |  |
| t1-dagger-control | 1.25 | grave-toadeater | 190 | boss_killed | 49.9 | 59.0 | 1.18 | 2 |  |
| t1-dagger-control | 1.25 | grave-toadeater | 190 | boss_killed | 49.9 | 59.0 | 1.18 | 2 |  |
| t1-dagger-control | 1.50 | grave-toadeater | 228 | boss_killed | 49.9 | 70.8 | 1.42 | 2 |  |
| t1-dagger-control | 1.50 | grave-toadeater | 228 | boss_killed | 49.9 | 70.8 | 1.42 | 2 |  |
| t1-dagger-kill-chain | 1.00 | grave-toadeater | 152 | player_died | 55.0 | 48.3 | 0.88 | 2 |  |
| t1-dagger-kill-chain | 1.00 | grave-toadeater | 152 | player_died | 55.0 | 48.3 | 0.88 | 2 |  |
| t1-dagger-kill-chain | 1.25 | grave-toadeater | 190 | boss_killed | 55.1 | 58.3 | 1.06 | 2 |  |
| t1-dagger-kill-chain | 1.25 | grave-toadeater | 190 | boss_killed | 55.1 | 58.3 | 1.06 | 2 |  |
| t1-dagger-kill-chain | 1.50 | grave-toadeater | 228 | boss_killed | 55.1 | 69.9 | 1.27 | 2 |  |
| t1-dagger-kill-chain | 1.50 | grave-toadeater | 228 | boss_killed | 55.1 | 69.9 | 1.27 | 2 |  |
| t2-dagger-affliction | 1.00 | mire-gorged-behemoth | 237 | boss_killed | 52.1 | >=1200 | 23.03 | 3 |  |
| t2-dagger-affliction | 1.00 | mire-gorged-behemoth | 237 | boss_killed | 47.4 | >=1200 | 25.32 | 3 |  |
| t2-dagger-affliction | 1.30 | mire-gorged-behemoth | 309 | boss_killed | 52.1 | >=1200 | 23.03 | 3 |  |
| t2-dagger-affliction | 1.30 | mire-gorged-behemoth | 309 | boss_killed | 47.4 | >=1200 | 25.32 | 3 |  |
| t2-dagger-affliction | 1.50 | mire-gorged-behemoth | 356 | boss_killed | 52.1 | >=1200 | 23.03 | 3 |  |
| t2-dagger-affliction | 1.50 | mire-gorged-behemoth | 356 | boss_killed | 47.4 | >=1200 | 25.32 | 3 |  |
| t2-dagger-control | 1.00 | mire-gorged-behemoth | 237 | boss_killed | 42.4 | 692.1 | 16.32 | 3 |  |
| t2-dagger-control | 1.00 | mire-gorged-behemoth | 237 | boss_killed | 33.6 | 377.9 | 11.25 | 3 |  |
| t2-dagger-control | 1.30 | mire-gorged-behemoth | 309 | boss_killed | 42.4 | 902.4 | 21.28 | 3 |  |
| t2-dagger-control | 1.30 | mire-gorged-behemoth | 309 | boss_killed | 33.6 | 492.7 | 14.66 | 3 |  |
| t2-dagger-control | 1.50 | mire-gorged-behemoth | 356 | boss_killed | 42.4 | 1039.6 | 24.52 | 3 |  |
| t2-dagger-control | 1.50 | mire-gorged-behemoth | 356 | boss_killed | 33.6 | 567.6 | 16.89 | 3 |  |
| t2-dagger-kill-chain | 1.00 | mire-gorged-behemoth | 237 | boss_killed | 57.9 | >=1200 | 20.73 | 3 |  |
| t2-dagger-kill-chain | 1.00 | mire-gorged-behemoth | 237 | boss_killed | 49.4 | >=1200 | 24.29 | 3 |  |
| t2-dagger-kill-chain | 1.30 | mire-gorged-behemoth | 309 | boss_killed | 57.9 | >=1200 | 20.73 | 3 |  |
| t2-dagger-kill-chain | 1.30 | mire-gorged-behemoth | 309 | boss_killed | 49.4 | >=1200 | 24.29 | 3 |  |
| t2-dagger-kill-chain | 1.50 | mire-gorged-behemoth | 356 | boss_killed | 57.9 | >=1200 | 20.73 | 3 |  |
| t2-dagger-kill-chain | 1.50 | mire-gorged-behemoth | 356 | boss_killed | 49.4 | >=1200 | 24.29 | 3 |  |
| t3-dagger-affliction | 1.00 | rot-spore-croc-behemoth | 444 | boss_killed | 130.8 | 649.5 | 4.97 | 3 |  |
| t3-dagger-affliction | 1.00 | rot-spore-croc-behemoth | 444 | boss_killed | 103.3 | 216.5 | 2.10 | 3 |  |
| t3-dagger-affliction | 1.35 | rot-spore-croc-behemoth | 598 | boss_killed | 130.8 | 874.7 | 6.69 | 3 |  |
| t3-dagger-affliction | 1.35 | rot-spore-croc-behemoth | 598 | boss_killed | 103.3 | 291.6 | 2.82 | 3 |  |
| t3-dagger-affliction | 1.50 | rot-spore-croc-behemoth | 666 | boss_killed | 130.8 | 974.2 | 7.45 | 3 |  |
| t3-dagger-affliction | 1.50 | rot-spore-croc-behemoth | 666 | boss_killed | 103.3 | 324.8 | 3.14 | 3 |  |
| t3-dagger-control | 1.00 | rot-spore-croc-behemoth | 444 | boss_killed | 100.8 | 1105.8 | 10.97 | 3 |  |
| t3-dagger-control | 1.00 | rot-spore-croc-behemoth | 444 | boss_killed | 97.3 | >=1200 | 12.33 | 3 |  |
| t3-dagger-control | 1.35 | rot-spore-croc-behemoth | 598 | boss_killed | 100.8 | >=1200 | 11.90 | 3 |  |
| t3-dagger-control | 1.35 | rot-spore-croc-behemoth | 598 | boss_killed | 97.3 | >=1200 | 12.33 | 3 |  |
| t3-dagger-control | 1.50 | rot-spore-croc-behemoth | 666 | boss_killed | 100.8 | >=1200 | 11.90 | 3 |  |
| t3-dagger-control | 1.50 | rot-spore-croc-behemoth | 666 | boss_killed | 97.3 | >=1200 | 12.33 | 3 |  |
| t3-dagger-kill-chain | 1.00 | rot-spore-croc-behemoth | 444 | boss_killed | 121.6 | >=1200 | 9.87 | 3 |  |
| t3-dagger-kill-chain | 1.00 | rot-spore-croc-behemoth | 444 | boss_killed | 132.5 | 617.9 | 4.66 | 3 |  |
| t3-dagger-kill-chain | 1.35 | rot-spore-croc-behemoth | 598 | boss_killed | 121.6 | >=1200 | 9.87 | 3 |  |
| t3-dagger-kill-chain | 1.35 | rot-spore-croc-behemoth | 598 | boss_killed | 132.5 | 832.2 | 6.28 | 3 |  |
| t3-dagger-kill-chain | 1.50 | rot-spore-croc-behemoth | 666 | boss_killed | 121.6 | >=1200 | 9.87 | 3 |  |
| t3-dagger-kill-chain | 1.50 | rot-spore-croc-behemoth | 666 | boss_killed | 132.5 | 926.8 | 6.99 | 3 |  |
| t4-dagger-affliction | 1.00 | glacial-patriarch | 795 | timeout | 311.6 | >=1200 | 3.85 | 4 |  |
| t4-dagger-affliction | 1.00 | glacial-patriarch | 795 | timeout | 311.6 | >=1200 | 3.85 | 4 |  |
| t4-dagger-affliction | 1.40 | glacial-patriarch | 1112 | timeout | 311.2 | >=1200 | 3.86 | 4 |  |
| t4-dagger-affliction | 1.40 | glacial-patriarch | 1112 | timeout | 311.2 | >=1200 | 3.86 | 4 |  |
| t4-dagger-affliction | 1.50 | glacial-patriarch | 1192 | timeout | 311.2 | >=1200 | 3.86 | 4 |  |
| t4-dagger-affliction | 1.50 | glacial-patriarch | 1192 | timeout | 311.2 | >=1200 | 3.86 | 4 |  |
| t4-dagger-control | 1.00 | glacial-patriarch | 795 | timeout | 311.9 | >=1200 | 3.85 | 4 |  |
| t4-dagger-control | 1.00 | glacial-patriarch | 795 | timeout | 311.9 | >=1200 | 3.85 | 4 |  |
| t4-dagger-control | 1.40 | glacial-patriarch | 1112 | timeout | 313.4 | >=1200 | 3.83 | 4 |  |
| t4-dagger-control | 1.40 | glacial-patriarch | 1112 | timeout | 313.4 | >=1200 | 3.83 | 4 |  |
| t4-dagger-control | 1.50 | glacial-patriarch | 1192 | timeout | 313.4 | >=1200 | 3.83 | 4 |  |
| t4-dagger-control | 1.50 | glacial-patriarch | 1192 | timeout | 313.4 | >=1200 | 3.83 | 4 |  |
| t4-dagger-kill-chain | 1.00 | glacial-patriarch | 795 | timeout | 324.1 | >=1200 | 3.70 | 4 |  |
| t4-dagger-kill-chain | 1.00 | glacial-patriarch | 795 | timeout | 324.1 | >=1200 | 3.70 | 4 |  |
| t4-dagger-kill-chain | 1.40 | glacial-patriarch | 1112 | timeout | 320.9 | >=1200 | 3.74 | 4 |  |
| t4-dagger-kill-chain | 1.40 | glacial-patriarch | 1112 | timeout | 320.9 | >=1200 | 3.74 | 4 |  |
| t4-dagger-kill-chain | 1.50 | glacial-patriarch | 1192 | timeout | 320.9 | >=1200 | 3.74 | 4 |  |
| t4-dagger-kill-chain | 1.50 | glacial-patriarch | 1192 | timeout | 320.9 | >=1200 | 3.74 | 4 |  |

## Per lane, normal node

| cell | factor | node | maxHp | fights | median end HP | time in band | deaths | kills |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| t1-broadsword-kill-chain | 1.00 | node-t1-plains-03 | 139 | 7 | 1.00 | 0.00 | 0 | 27 |
| t1-broadsword-kill-chain | 1.00 | node-t1-plains-03 | 139 | 8 | 1.00 | 0.00 | 0 | 24 |
| t1-broadsword-kill-chain | 1.25 | node-t1-plains-03 | 174 | 7 | 1.00 | 0.00 | 0 | 27 |
| t1-broadsword-kill-chain | 1.25 | node-t1-plains-03 | 174 | 8 | 1.00 | 0.00 | 0 | 24 |
| t1-broadsword-kill-chain | 1.50 | node-t1-plains-03 | 209 | 7 | 1.00 | 0.00 | 0 | 27 |
| t1-broadsword-kill-chain | 1.50 | node-t1-plains-03 | 209 | 8 | 1.00 | 0.00 | 0 | 24 |
| t1-broadsword-empowered | 1.00 | node-t1-plains-03 | 139 | 7 | 1.00 | 0.00 | 0 | 26 |
| t1-broadsword-empowered | 1.00 | node-t1-plains-03 | 139 | 8 | 1.00 | 0.00 | 0 | 26 |
| t1-broadsword-empowered | 1.25 | node-t1-plains-03 | 174 | 7 | 1.00 | 0.00 | 0 | 26 |
| t1-broadsword-empowered | 1.25 | node-t1-plains-03 | 174 | 8 | 1.00 | 0.00 | 0 | 27 |
| t1-broadsword-empowered | 1.50 | node-t1-plains-03 | 209 | 7 | 1.00 | 0.00 | 0 | 26 |
| t1-broadsword-empowered | 1.50 | node-t1-plains-03 | 209 | 6 | 1.00 | 0.00 | 0 | 27 |
| t1-broadsword-tempo | 1.00 | node-t1-plains-03 | 139 | 7 | 1.00 | 0.00 | 0 | 25 |
| t1-broadsword-tempo | 1.00 | node-t1-plains-03 | 139 | 7 | 1.00 | 0.00 | 0 | 27 |
| t1-broadsword-tempo | 1.25 | node-t1-plains-03 | 174 | 7 | 1.00 | 0.00 | 0 | 25 |
| t1-broadsword-tempo | 1.25 | node-t1-plains-03 | 174 | 7 | 1.00 | 0.00 | 0 | 27 |
| t1-broadsword-tempo | 1.50 | node-t1-plains-03 | 209 | 7 | 1.00 | 0.00 | 0 | 25 |
| t1-broadsword-tempo | 1.50 | node-t1-plains-03 | 209 | 6 | 1.00 | 0.00 | 0 | 27 |
| t2-broadsword-kill-chain | 1.00 | node-t2-plains-03 | 216 | 4 | 0.95 | 0.20 | 0 | 28 |
| t2-broadsword-kill-chain | 1.00 | node-t2-plains-03 | 216 | 7 | 1.00 | 0.00 | 0 | 27 |
| t2-broadsword-kill-chain | 1.30 | node-t2-plains-03 | 282 | 2 | 0.70 | 0.23 | 0 | 35 |
| t2-broadsword-kill-chain | 1.30 | node-t2-plains-03 | 282 | 7 | 1.00 | 0.00 | 0 | 27 |
| t2-broadsword-kill-chain | 1.50 | node-t2-plains-03 | 325 | 6 | 1.00 | 0.14 | 0 | 28 |
| t2-broadsword-kill-chain | 1.50 | node-t2-plains-03 | 325 | 7 | 1.00 | 0.00 | 0 | 27 |
| t2-broadsword-empowered | 1.00 | node-t2-plains-03 | 216 | 6 | 0.89 | 0.10 | 1 | 38 |
| t2-broadsword-empowered | 1.00 | node-t2-plains-03 | 216 | 7 | 1.00 | 0.00 | 0 | 21 |
| t2-broadsword-empowered | 1.30 | node-t2-plains-03 | 282 | 7 | 1.00 | 0.17 | 0 | 25 |
| t2-broadsword-empowered | 1.30 | node-t2-plains-03 | 282 | 8 | 1.00 | 0.00 | 0 | 22 |
| t2-broadsword-empowered | 1.50 | node-t2-plains-03 | 325 | 7 | 1.00 | 0.12 | 0 | 26 |
| t2-broadsword-empowered | 1.50 | node-t2-plains-03 | 325 | 7 | 1.00 | 0.00 | 0 | 22 |
| t2-broadsword-tempo | 1.00 | node-t2-plains-03 | 216 | 8 | 1.00 | 0.11 | 1 | 31 |
| t2-broadsword-tempo | 1.00 | node-t2-plains-03 | 216 | 7 | 1.00 | 0.15 | 0 | 26 |
| t2-broadsword-tempo | 1.30 | node-t2-plains-03 | 282 | 7 | 1.00 | 0.17 | 0 | 25 |
| t2-broadsword-tempo | 1.30 | node-t2-plains-03 | 282 | 7 | 1.00 | 0.20 | 0 | 25 |
| t2-broadsword-tempo | 1.50 | node-t2-plains-03 | 325 | 5 | 1.00 | 0.11 | 0 | 28 |
| t2-broadsword-tempo | 1.50 | node-t2-plains-03 | 325 | 7 | 1.00 | 0.16 | 0 | 26 |
| t3-broadsword-kill-chain | 1.00 | node-t3-desert-03 | 413 | 1 | 1.00 | 0.00 | 0 | 8 |
| t3-broadsword-kill-chain | 1.00 | node-t3-desert-03 | 413 | 3 | 1.00 | 0.05 | 0 | 7 |
| t3-broadsword-kill-chain | 1.35 | node-t3-desert-03 | 558 | 1 | 1.00 | 0.00 | 0 | 8 |
| t3-broadsword-kill-chain | 1.35 | node-t3-desert-03 | 558 | 3 | 1.00 | 0.00 | 0 | 7 |
| t3-broadsword-kill-chain | 1.50 | node-t3-desert-03 | 620 | 1 | 1.00 | 0.00 | 0 | 8 |
| t3-broadsword-kill-chain | 1.50 | node-t3-desert-03 | 620 | 3 | 1.00 | 0.00 | 0 | 7 |
| t3-broadsword-empowered | 1.00 | node-t3-desert-03 | 413 | 4 | 1.00 | 0.00 | 0 | 7 |
| t3-broadsword-empowered | 1.00 | node-t3-desert-03 | 413 | 3 | 1.00 | 0.07 | 0 | 6 |
| t3-broadsword-empowered | 1.35 | node-t3-desert-03 | 558 | 4 | 1.00 | 0.00 | 0 | 7 |
| t3-broadsword-empowered | 1.35 | node-t3-desert-03 | 558 | 3 | 1.00 | 0.01 | 0 | 6 |
| t3-broadsword-empowered | 1.50 | node-t3-desert-03 | 620 | 4 | 1.00 | 0.00 | 0 | 7 |
| t3-broadsword-empowered | 1.50 | node-t3-desert-03 | 620 | 3 | 1.00 | 0.00 | 0 | 6 |
| t3-broadsword-tempo | 1.00 | node-t3-desert-03 | 413 | 3 | 1.00 | 0.02 | 0 | 9 |
| t3-broadsword-tempo | 1.00 | node-t3-desert-03 | 413 | 4 | 1.00 | 0.00 | 0 | 7 |
| t3-broadsword-tempo | 1.35 | node-t3-desert-03 | 558 | 3 | 1.00 | 0.00 | 0 | 9 |
| t3-broadsword-tempo | 1.35 | node-t3-desert-03 | 558 | 4 | 1.00 | 0.00 | 0 | 7 |
| t3-broadsword-tempo | 1.50 | node-t3-desert-03 | 620 | 3 | 1.00 | 0.00 | 0 | 9 |
| t3-broadsword-tempo | 1.50 | node-t3-desert-03 | 620 | 4 | 1.00 | 0.00 | 0 | 7 |
| t4-broadsword-kill-chain | 1.00 | node-t4-desert-03 | 665 | 4 | 1.00 | 0.00 | 0 | 9 |
| t4-broadsword-kill-chain | 1.00 | node-t4-desert-03 | 665 | 3 | 1.00 | 0.00 | 0 | 8 |
| t4-broadsword-kill-chain | 1.40 | node-t4-desert-03 | 931 | 1 | 1.00 | 0.00 | 0 | 10 |
| t4-broadsword-kill-chain | 1.40 | node-t4-desert-03 | 931 | 3 | 1.00 | 0.00 | 0 | 8 |
| t4-broadsword-kill-chain | 1.50 | node-t4-desert-03 | 998 | 1 | 1.00 | 0.00 | 0 | 10 |
| t4-broadsword-kill-chain | 1.50 | node-t4-desert-03 | 998 | 3 | 1.00 | 0.00 | 0 | 8 |
| t4-broadsword-empowered | 1.00 | node-t4-desert-03 | 665 | 4 | 1.00 | 0.00 | 0 | 8 |
| t4-broadsword-empowered | 1.00 | node-t4-desert-03 | 665 | 2 | 1.00 | 0.00 | 0 | 7 |
| t4-broadsword-empowered | 1.40 | node-t4-desert-03 | 931 | 4 | 1.00 | 0.00 | 0 | 8 |
| t4-broadsword-empowered | 1.40 | node-t4-desert-03 | 931 | 2 | 1.00 | 0.00 | 0 | 7 |
| t4-broadsword-empowered | 1.50 | node-t4-desert-03 | 998 | 4 | 1.00 | 0.00 | 0 | 8 |
| t4-broadsword-empowered | 1.50 | node-t4-desert-03 | 998 | 2 | 1.00 | 0.00 | 0 | 7 |
| t4-broadsword-tempo | 1.00 | node-t4-desert-03 | 665 | 3 | 1.00 | 0.00 | 0 | 7 |
| t4-broadsword-tempo | 1.00 | node-t4-desert-03 | 665 | 3 | 1.00 | 0.04 | 0 | 8 |
| t4-broadsword-tempo | 1.40 | node-t4-desert-03 | 931 | 3 | 1.00 | 0.00 | 0 | 7 |
| t4-broadsword-tempo | 1.40 | node-t4-desert-03 | 931 | 3 | 1.00 | 0.00 | 0 | 8 |
| t4-broadsword-tempo | 1.50 | node-t4-desert-03 | 998 | 3 | 1.00 | 0.00 | 0 | 7 |
| t4-broadsword-tempo | 1.50 | node-t4-desert-03 | 998 | 3 | 1.00 | 0.00 | 0 | 8 |
| t1-rapier-tempo | 1.00 | node-t1-forest-03 | 163 | 11 | 0.89 | 0.10 | 0 | 13 |
| t1-rapier-tempo | 1.00 | node-t1-forest-03 | 163 | 10 | 0.89 | 0.21 | 0 | 17 |
| t1-rapier-tempo | 1.25 | node-t1-forest-03 | 204 | 11 | 0.91 | 0.09 | 0 | 13 |
| t1-rapier-tempo | 1.25 | node-t1-forest-03 | 204 | 9 | 0.90 | 0.37 | 0 | 18 |
| t1-rapier-tempo | 1.50 | node-t1-forest-03 | 244 | 11 | 0.93 | 0.17 | 0 | 15 |
| t1-rapier-tempo | 1.50 | node-t1-forest-03 | 244 | 10 | 0.93 | 0.18 | 0 | 17 |
| t1-rapier-affliction | 1.00 | node-t1-forest-03 | 163 | 11 | 0.90 | 0.11 | 0 | 13 |
| t1-rapier-affliction | 1.00 | node-t1-forest-03 | 163 | 10 | 0.88 | 0.33 | 0 | 17 |
| t1-rapier-affliction | 1.25 | node-t1-forest-03 | 204 | 11 | 0.97 | 0.10 | 0 | 13 |
| t1-rapier-affliction | 1.25 | node-t1-forest-03 | 204 | 9 | 0.94 | 0.31 | 0 | 17 |
| t1-rapier-affliction | 1.50 | node-t1-forest-03 | 244 | 11 | 0.98 | 0.09 | 0 | 13 |
| t1-rapier-affliction | 1.50 | node-t1-forest-03 | 244 | 9 | 0.93 | 0.35 | 0 | 17 |
| t1-rapier-engagement | 1.00 | node-t1-forest-03 | 163 | 11 | 0.90 | 0.11 | 0 | 13 |
| t1-rapier-engagement | 1.00 | node-t1-forest-03 | 163 | 7 | 0.67 | 0.48 | 0 | 20 |
| t1-rapier-engagement | 1.25 | node-t1-forest-03 | 204 | 11 | 0.97 | 0.10 | 0 | 13 |
| t1-rapier-engagement | 1.25 | node-t1-forest-03 | 204 | 9 | 0.90 | 0.28 | 0 | 17 |
| t1-rapier-engagement | 1.50 | node-t1-forest-03 | 244 | 11 | 0.98 | 0.09 | 0 | 13 |
| t1-rapier-engagement | 1.50 | node-t1-forest-03 | 244 | 10 | 0.93 | 0.24 | 0 | 17 |
| t2-rapier-tempo | 1.00 | node-t2-forest-03 | 241 | 9 | 0.90 | 0.37 | 0 | 17 |
| t2-rapier-tempo | 1.00 | node-t2-forest-03 | 241 | 9 | 0.87 | 0.29 | 0 | 16 |
| t2-rapier-tempo | 1.30 | node-t2-forest-03 | 312 | 9 | 0.92 | 0.22 | 0 | 17 |
| t2-rapier-tempo | 1.30 | node-t2-forest-03 | 312 | 9 | 0.89 | 0.18 | 0 | 16 |
| t2-rapier-tempo | 1.50 | node-t2-forest-03 | 362 | 9 | 0.93 | 0.14 | 0 | 17 |
| t2-rapier-tempo | 1.50 | node-t2-forest-03 | 362 | 9 | 0.93 | 0.20 | 0 | 16 |
| t2-rapier-affliction | 1.00 | node-t2-forest-03 | 241 | 8 | 0.82 | 0.44 | 0 | 15 |
| t2-rapier-affliction | 1.00 | node-t2-forest-03 | 241 | 9 | 0.87 | 0.32 | 0 | 14 |
| t2-rapier-affliction | 1.30 | node-t2-forest-03 | 312 | 8 | 0.85 | 0.31 | 0 | 13 |
| t2-rapier-affliction | 1.30 | node-t2-forest-03 | 312 | 7 | 0.94 | 0.21 | 0 | 14 |
| t2-rapier-affliction | 1.50 | node-t2-forest-03 | 362 | 8 | 0.89 | 0.25 | 0 | 14 |
| t2-rapier-affliction | 1.50 | node-t2-forest-03 | 362 | 7 | 0.91 | 0.39 | 0 | 17 |
| t2-rapier-engagement | 1.00 | node-t2-forest-03 | 241 | 11 | 0.92 | 0.29 | 0 | 15 |
| t2-rapier-engagement | 1.00 | node-t2-forest-03 | 241 | 8 | 0.95 | 0.37 | 0 | 15 |
| t2-rapier-engagement | 1.30 | node-t2-forest-03 | 312 | 11 | 0.94 | 0.20 | 0 | 15 |
| t2-rapier-engagement | 1.30 | node-t2-forest-03 | 312 | 8 | 0.94 | 0.27 | 0 | 16 |
| t2-rapier-engagement | 1.50 | node-t2-forest-03 | 362 | 11 | 0.95 | 0.20 | 0 | 15 |
| t2-rapier-engagement | 1.50 | node-t2-forest-03 | 362 | 9 | 0.93 | 0.27 | 0 | 17 |
| t3-rapier-tempo | 1.00 | node-t3-jungle-03 | 450 | 9 | 0.93 | 0.01 | 0 | 12 |
| t3-rapier-tempo | 1.00 | node-t3-jungle-03 | 450 | 5 | 1.00 | 0.01 | 0 | 14 |
| t3-rapier-tempo | 1.35 | node-t3-jungle-03 | 607 | 9 | 0.94 | 0.00 | 0 | 12 |
| t3-rapier-tempo | 1.35 | node-t3-jungle-03 | 607 | 5 | 1.00 | 0.00 | 0 | 14 |
| t3-rapier-tempo | 1.50 | node-t3-jungle-03 | 675 | 9 | 0.95 | 0.00 | 0 | 12 |
| t3-rapier-tempo | 1.50 | node-t3-jungle-03 | 675 | 5 | 1.00 | 0.00 | 0 | 14 |
| t3-rapier-affliction | 1.00 | node-t3-jungle-03 | 450 | 2 | 0.79 | 0.03 | 0 | 13 |
| t3-rapier-affliction | 1.00 | node-t3-jungle-03 | 450 | 9 | 0.85 | 0.08 | 0 | 12 |
| t3-rapier-affliction | 1.35 | node-t3-jungle-03 | 607 | 2 | 0.85 | 0.00 | 0 | 13 |
| t3-rapier-affliction | 1.35 | node-t3-jungle-03 | 607 | 9 | 0.89 | 0.04 | 0 | 12 |
| t3-rapier-affliction | 1.50 | node-t3-jungle-03 | 675 | 2 | 0.86 | 0.00 | 0 | 13 |
| t3-rapier-affliction | 1.50 | node-t3-jungle-03 | 675 | 9 | 0.90 | 0.02 | 0 | 12 |
| t3-rapier-engagement | 1.00 | node-t3-jungle-03 | 450 | 4 | 0.99 | 0.07 | 0 | 16 |
| t3-rapier-engagement | 1.00 | node-t3-jungle-03 | 450 | 5 | 0.95 | 0.02 | 0 | 15 |
| t3-rapier-engagement | 1.35 | node-t3-jungle-03 | 607 | 4 | 0.99 | 0.04 | 0 | 16 |
| t3-rapier-engagement | 1.35 | node-t3-jungle-03 | 607 | 5 | 0.96 | 0.00 | 0 | 15 |
| t3-rapier-engagement | 1.50 | node-t3-jungle-03 | 675 | 4 | 0.99 | 0.03 | 0 | 16 |
| t3-rapier-engagement | 1.50 | node-t3-jungle-03 | 675 | 5 | 0.97 | 0.00 | 0 | 15 |
| t4-rapier-tempo | 1.00 | node-t4-jungle-03 | 713 | 3 | 0.96 | 0.00 | 0 | 10 |
| t4-rapier-tempo | 1.00 | node-t4-jungle-03 | 713 | 1 | 1.00 | 0.00 | 0 | 9 |
| t4-rapier-tempo | 1.40 | node-t4-jungle-03 | 999 | 3 | 0.97 | 0.00 | 0 | 10 |
| t4-rapier-tempo | 1.40 | node-t4-jungle-03 | 999 | 1 | 1.00 | 0.00 | 0 | 9 |
| t4-rapier-tempo | 1.50 | node-t4-jungle-03 | 1071 | 3 | 0.97 | 0.00 | 0 | 10 |
| t4-rapier-tempo | 1.50 | node-t4-jungle-03 | 1071 | 1 | 1.00 | 0.00 | 0 | 9 |
| t4-rapier-affliction | 1.00 | node-t4-jungle-03 | 713 | 2 | 1.00 | 0.00 | 0 | 11 |
| t4-rapier-affliction | 1.00 | node-t4-jungle-03 | 713 | 2 | 1.00 | 0.00 | 0 | 8 |
| t4-rapier-affliction | 1.40 | node-t4-jungle-03 | 999 | 2 | 1.00 | 0.00 | 0 | 11 |
| t4-rapier-affliction | 1.40 | node-t4-jungle-03 | 999 | 2 | 1.00 | 0.00 | 0 | 8 |
| t4-rapier-affliction | 1.50 | node-t4-jungle-03 | 1071 | 2 | 1.00 | 0.00 | 0 | 11 |
| t4-rapier-affliction | 1.50 | node-t4-jungle-03 | 1071 | 2 | 1.00 | 0.00 | 0 | 8 |
| t4-rapier-engagement | 1.00 | node-t4-jungle-03 | 713 | 1 | 1.00 | 0.00 | 0 | 11 |
| t4-rapier-engagement | 1.00 | node-t4-jungle-03 | 713 | 2 | 1.00 | 0.00 | 0 | 11 |
| t4-rapier-engagement | 1.40 | node-t4-jungle-03 | 999 | 1 | 1.00 | 0.00 | 0 | 11 |
| t4-rapier-engagement | 1.40 | node-t4-jungle-03 | 999 | 2 | 1.00 | 0.00 | 0 | 11 |
| t4-rapier-engagement | 1.50 | node-t4-jungle-03 | 1071 | 1 | 1.00 | 0.00 | 0 | 11 |
| t4-rapier-engagement | 1.50 | node-t4-jungle-03 | 1071 | 2 | 1.00 | 0.00 | 0 | 11 |
| t1-hammer-empowered | 1.00 | node-t1-mountain-03 | 191 | 7 | 0.80 | 0.14 | 0 | 8 |
| t1-hammer-empowered | 1.00 | node-t1-mountain-03 | 191 | 8 | 0.83 | 0.15 | 0 | 8 |
| t1-hammer-empowered | 1.25 | node-t1-mountain-03 | 239 | 7 | 0.87 | 0.08 | 0 | 9 |
| t1-hammer-empowered | 1.25 | node-t1-mountain-03 | 239 | 7 | 0.87 | 0.23 | 0 | 8 |
| t1-hammer-empowered | 1.50 | node-t1-mountain-03 | 287 | 6 | 0.78 | 0.08 | 0 | 10 |
| t1-hammer-empowered | 1.50 | node-t1-mountain-03 | 287 | 8 | 0.92 | 0.14 | 0 | 9 |
| t1-hammer-control | 1.00 | node-t1-mountain-03 | 191 | 7 | 0.80 | 0.14 | 0 | 8 |
| t1-hammer-control | 1.00 | node-t1-mountain-03 | 191 | 6 | 0.80 | 0.15 | 0 | 8 |
| t1-hammer-control | 1.25 | node-t1-mountain-03 | 239 | 7 | 0.87 | 0.08 | 0 | 9 |
| t1-hammer-control | 1.25 | node-t1-mountain-03 | 239 | 8 | 0.87 | 0.00 | 0 | 8 |
| t1-hammer-control | 1.50 | node-t1-mountain-03 | 287 | 6 | 0.78 | 0.08 | 0 | 10 |
| t1-hammer-control | 1.50 | node-t1-mountain-03 | 287 | 8 | 0.92 | 0.00 | 0 | 9 |
| t1-hammer-engagement | 1.00 | node-t1-mountain-03 | 191 | 7 | 0.82 | 0.06 | 0 | 7 |
| t1-hammer-engagement | 1.00 | node-t1-mountain-03 | 191 | 6 | 0.82 | 0.13 | 0 | 8 |
| t1-hammer-engagement | 1.25 | node-t1-mountain-03 | 239 | 7 | 0.76 | 0.09 | 0 | 9 |
| t1-hammer-engagement | 1.25 | node-t1-mountain-03 | 239 | 7 | 0.88 | 0.12 | 0 | 8 |
| t1-hammer-engagement | 1.50 | node-t1-mountain-03 | 287 | 8 | 0.91 | 0.00 | 0 | 8 |
| t1-hammer-engagement | 1.50 | node-t1-mountain-03 | 287 | 8 | 0.93 | 0.00 | 0 | 8 |
| t2-hammer-empowered | 1.00 | node-t2-mountain-03 | 317 | 5 | 1.00 | 0.00 | 0 | 10 |
| t2-hammer-empowered | 1.00 | node-t2-mountain-03 | 317 | 6 | 1.00 | 0.00 | 0 | 8 |
| t2-hammer-empowered | 1.30 | node-t2-mountain-03 | 412 | 5 | 1.00 | 0.00 | 0 | 8 |
| t2-hammer-empowered | 1.30 | node-t2-mountain-03 | 412 | 6 | 1.00 | 0.02 | 0 | 8 |
| t2-hammer-empowered | 1.50 | node-t2-mountain-03 | 475 | 5 | 1.00 | 0.00 | 0 | 9 |
| t2-hammer-empowered | 1.50 | node-t2-mountain-03 | 475 | 6 | 1.00 | 0.00 | 0 | 8 |
| t2-hammer-control | 1.00 | node-t2-mountain-03 | 317 | 6 | 1.00 | 0.00 | 0 | 9 |
| t2-hammer-control | 1.00 | node-t2-mountain-03 | 317 | 6 | 1.00 | 0.00 | 0 | 9 |
| t2-hammer-control | 1.30 | node-t2-mountain-03 | 412 | 6 | 1.00 | 0.00 | 0 | 9 |
| t2-hammer-control | 1.30 | node-t2-mountain-03 | 412 | 6 | 1.00 | 0.00 | 0 | 9 |
| t2-hammer-control | 1.50 | node-t2-mountain-03 | 475 | 7 | 1.00 | 0.00 | 0 | 11 |
| t2-hammer-control | 1.50 | node-t2-mountain-03 | 475 | 6 | 1.00 | 0.00 | 0 | 9 |
| t2-hammer-engagement | 1.00 | node-t2-mountain-03 | 317 | 6 | 1.00 | 0.00 | 0 | 9 |
| t2-hammer-engagement | 1.00 | node-t2-mountain-03 | 317 | 6 | 1.00 | 0.00 | 0 | 9 |
| t2-hammer-engagement | 1.30 | node-t2-mountain-03 | 412 | 6 | 1.00 | 0.00 | 0 | 9 |
| t2-hammer-engagement | 1.30 | node-t2-mountain-03 | 412 | 6 | 1.00 | 0.00 | 0 | 9 |
| t2-hammer-engagement | 1.50 | node-t2-mountain-03 | 475 | 7 | 1.00 | 0.00 | 0 | 11 |
| t2-hammer-engagement | 1.50 | node-t2-mountain-03 | 475 | 6 | 1.00 | 0.00 | 0 | 9 |
| t3-hammer-empowered | 1.00 | node-t3-mountain-03 | 606 | 7 | 1.00 | 0.00 | 0 | 11 |
| t3-hammer-empowered | 1.00 | node-t3-mountain-03 | 606 | 5 | 1.00 | 0.00 | 0 | 8 |
| t3-hammer-empowered | 1.35 | node-t3-mountain-03 | 819 | 7 | 1.00 | 0.00 | 0 | 11 |
| t3-hammer-empowered | 1.35 | node-t3-mountain-03 | 819 | 5 | 1.00 | 0.00 | 0 | 8 |
| t3-hammer-empowered | 1.50 | node-t3-mountain-03 | 909 | 7 | 1.00 | 0.00 | 0 | 11 |
| t3-hammer-empowered | 1.50 | node-t3-mountain-03 | 909 | 5 | 1.00 | 0.00 | 0 | 8 |
| t3-hammer-control | 1.00 | node-t3-mountain-03 | 606 | 6 | 1.00 | 0.00 | 0 | 11 |
| t3-hammer-control | 1.00 | node-t3-mountain-03 | 606 | 6 | 1.00 | 0.00 | 0 | 8 |
| t3-hammer-control | 1.35 | node-t3-mountain-03 | 819 | 7 | 1.00 | 0.00 | 0 | 11 |
| t3-hammer-control | 1.35 | node-t3-mountain-03 | 819 | 6 | 1.00 | 0.00 | 0 | 8 |
| t3-hammer-control | 1.50 | node-t3-mountain-03 | 909 | 7 | 1.00 | 0.00 | 0 | 11 |
| t3-hammer-control | 1.50 | node-t3-mountain-03 | 909 | 6 | 1.00 | 0.00 | 0 | 8 |
| t3-hammer-engagement | 1.00 | node-t3-mountain-03 | 606 | 7 | 1.00 | 0.00 | 0 | 10 |
| t3-hammer-engagement | 1.00 | node-t3-mountain-03 | 606 | 6 | 1.00 | 0.00 | 0 | 9 |
| t3-hammer-engagement | 1.35 | node-t3-mountain-03 | 819 | 7 | 1.00 | 0.00 | 0 | 10 |
| t3-hammer-engagement | 1.35 | node-t3-mountain-03 | 819 | 6 | 1.00 | 0.00 | 0 | 9 |
| t3-hammer-engagement | 1.50 | node-t3-mountain-03 | 909 | 7 | 1.00 | 0.00 | 0 | 10 |
| t3-hammer-engagement | 1.50 | node-t3-mountain-03 | 909 | 6 | 1.00 | 0.00 | 0 | 9 |
| t4-hammer-empowered | 1.00 | node-t4-mountain-03 | 998 | 5 | 1.00 | 0.00 | 0 | 8 |
| t4-hammer-empowered | 1.00 | node-t4-mountain-03 | 998 | 8 | 1.00 | 0.00 | 0 | 9 |
| t4-hammer-empowered | 1.40 | node-t4-mountain-03 | 1397 | 5 | 1.00 | 0.00 | 0 | 8 |
| t4-hammer-empowered | 1.40 | node-t4-mountain-03 | 1397 | 8 | 1.00 | 0.00 | 0 | 9 |
| t4-hammer-empowered | 1.50 | node-t4-mountain-03 | 1497 | 5 | 1.00 | 0.00 | 0 | 8 |
| t4-hammer-empowered | 1.50 | node-t4-mountain-03 | 1497 | 8 | 1.00 | 0.00 | 0 | 9 |
| t4-hammer-control | 1.00 | node-t4-mountain-03 | 998 | 4 | 1.00 | 0.00 | 0 | 6 |
| t4-hammer-control | 1.00 | node-t4-mountain-03 | 998 | 7 | 1.00 | 0.00 | 0 | 9 |
| t4-hammer-control | 1.40 | node-t4-mountain-03 | 1397 | 4 | 1.00 | 0.00 | 0 | 6 |
| t4-hammer-control | 1.40 | node-t4-mountain-03 | 1397 | 7 | 1.00 | 0.00 | 0 | 9 |
| t4-hammer-control | 1.50 | node-t4-mountain-03 | 1497 | 4 | 1.00 | 0.00 | 0 | 6 |
| t4-hammer-control | 1.50 | node-t4-mountain-03 | 1497 | 7 | 1.00 | 0.00 | 0 | 9 |
| t4-hammer-engagement | 1.00 | node-t4-mountain-03 | 998 | 4 | 1.00 | 0.00 | 0 | 6 |
| t4-hammer-engagement | 1.00 | node-t4-mountain-03 | 998 | 6 | 1.00 | 0.00 | 0 | 10 |
| t4-hammer-engagement | 1.40 | node-t4-mountain-03 | 1397 | 4 | 1.00 | 0.00 | 0 | 6 |
| t4-hammer-engagement | 1.40 | node-t4-mountain-03 | 1397 | 6 | 1.00 | 0.00 | 0 | 10 |
| t4-hammer-engagement | 1.50 | node-t4-mountain-03 | 1497 | 4 | 1.00 | 0.00 | 0 | 6 |
| t4-hammer-engagement | 1.50 | node-t4-mountain-03 | 1497 | 6 | 1.00 | 0.00 | 0 | 10 |
| t1-axe-tempo | 1.00 | node-t1-cave-03 | 156 | 6 | 0.64 | 0.29 | 0 | 6 |
| t1-axe-tempo | 1.00 | node-t1-cave-03 | 156 | 8 | 0.71 | 0.19 | 0 | 9 |
| t1-axe-tempo | 1.25 | node-t1-cave-03 | 195 | 7 | 0.71 | 0.20 | 0 | 6 |
| t1-axe-tempo | 1.25 | node-t1-cave-03 | 195 | 9 | 0.71 | 0.16 | 0 | 8 |
| t1-axe-tempo | 1.50 | node-t1-cave-03 | 234 | 7 | 0.76 | 0.13 | 0 | 6 |
| t1-axe-tempo | 1.50 | node-t1-cave-03 | 234 | 9 | 0.76 | 0.13 | 0 | 10 |
| t1-axe-kill-chain | 1.00 | node-t1-cave-03 | 156 | 6 | 0.51 | 0.32 | 0 | 6 |
| t1-axe-kill-chain | 1.00 | node-t1-cave-03 | 156 | 8 | 0.72 | 0.29 | 0 | 8 |
| t1-axe-kill-chain | 1.25 | node-t1-cave-03 | 195 | 6 | 0.61 | 0.23 | 0 | 6 |
| t1-axe-kill-chain | 1.25 | node-t1-cave-03 | 195 | 8 | 0.71 | 0.23 | 0 | 9 |
| t1-axe-kill-chain | 1.50 | node-t1-cave-03 | 234 | 7 | 0.67 | 0.16 | 0 | 6 |
| t1-axe-kill-chain | 1.50 | node-t1-cave-03 | 234 | 8 | 0.71 | 0.15 | 0 | 8 |
| t1-axe-empowered | 1.00 | node-t1-cave-03 | 156 | 6 | 0.64 | 0.29 | 0 | 6 |
| t1-axe-empowered | 1.00 | node-t1-cave-03 | 156 | 8 | 0.71 | 0.19 | 0 | 9 |
| t1-axe-empowered | 1.25 | node-t1-cave-03 | 195 | 7 | 0.71 | 0.21 | 0 | 6 |
| t1-axe-empowered | 1.25 | node-t1-cave-03 | 195 | 9 | 0.71 | 0.16 | 0 | 8 |
| t1-axe-empowered | 1.50 | node-t1-cave-03 | 234 | 7 | 0.76 | 0.13 | 0 | 6 |
| t1-axe-empowered | 1.50 | node-t1-cave-03 | 234 | 9 | 0.76 | 0.13 | 0 | 10 |
| t2-axe-tempo | 1.00 | node-t2-cave-03 | 235 | 8 | 0.94 | 0.18 | 0 | 8 |
| t2-axe-tempo | 1.00 | node-t2-cave-03 | 235 | 10 | 0.94 | 0.05 | 0 | 10 |
| t2-axe-tempo | 1.30 | node-t2-cave-03 | 306 | 8 | 0.95 | 0.20 | 0 | 9 |
| t2-axe-tempo | 1.30 | node-t2-cave-03 | 306 | 10 | 0.94 | 0.03 | 0 | 9 |
| t2-axe-tempo | 1.50 | node-t2-cave-03 | 353 | 8 | 0.95 | 0.19 | 0 | 9 |
| t2-axe-tempo | 1.50 | node-t2-cave-03 | 353 | 10 | 0.96 | 0.00 | 0 | 10 |
| t2-axe-kill-chain | 1.00 | node-t2-cave-03 | 235 | 9 | 0.91 | 0.14 | 0 | 8 |
| t2-axe-kill-chain | 1.00 | node-t2-cave-03 | 235 | 10 | 0.93 | 0.10 | 0 | 10 |
| t2-axe-kill-chain | 1.30 | node-t2-cave-03 | 306 | 7 | 0.94 | 0.19 | 1 | 11 |
| t2-axe-kill-chain | 1.30 | node-t2-cave-03 | 306 | 9 | 0.91 | 0.05 | 0 | 8 |
| t2-axe-kill-chain | 1.50 | node-t2-cave-03 | 353 | 8 | 0.95 | 0.16 | 0 | 8 |
| t2-axe-kill-chain | 1.50 | node-t2-cave-03 | 353 | 9 | 0.93 | 0.02 | 0 | 8 |
| t2-axe-empowered | 1.00 | node-t2-cave-03 | 235 | 9 | 0.92 | 0.10 | 0 | 8 |
| t2-axe-empowered | 1.00 | node-t2-cave-03 | 235 | 10 | 0.94 | 0.05 | 0 | 9 |
| t2-axe-empowered | 1.30 | node-t2-cave-03 | 306 | 8 | 0.94 | 0.04 | 0 | 8 |
| t2-axe-empowered | 1.30 | node-t2-cave-03 | 306 | 10 | 0.95 | 0.03 | 0 | 10 |
| t2-axe-empowered | 1.50 | node-t2-cave-03 | 353 | 8 | 0.95 | 0.00 | 0 | 8 |
| t2-axe-empowered | 1.50 | node-t2-cave-03 | 353 | 10 | 0.96 | 0.00 | 0 | 10 |
| t3-axe-tempo | 1.00 | node-t3-cave-03 | 430 | 11 | 0.92 | 0.00 | 0 | 11 |
| t3-axe-tempo | 1.00 | node-t3-cave-03 | 430 | 11 | 0.82 | 0.00 | 0 | 11 |
| t3-axe-tempo | 1.35 | node-t3-cave-03 | 579 | 12 | 0.98 | 0.00 | 0 | 11 |
| t3-axe-tempo | 1.35 | node-t3-cave-03 | 579 | 11 | 0.86 | 0.00 | 0 | 11 |
| t3-axe-tempo | 1.50 | node-t3-cave-03 | 645 | 11 | 0.98 | 0.00 | 0 | 11 |
| t3-axe-tempo | 1.50 | node-t3-cave-03 | 645 | 11 | 0.88 | 0.00 | 0 | 11 |
| t3-axe-kill-chain | 1.00 | node-t3-cave-03 | 430 | 11 | 0.92 | 0.00 | 0 | 11 |
| t3-axe-kill-chain | 1.00 | node-t3-cave-03 | 430 | 12 | 0.93 | 0.00 | 0 | 12 |
| t3-axe-kill-chain | 1.35 | node-t3-cave-03 | 579 | 12 | 0.97 | 0.00 | 0 | 11 |
| t3-axe-kill-chain | 1.35 | node-t3-cave-03 | 579 | 12 | 0.93 | 0.00 | 0 | 12 |
| t3-axe-kill-chain | 1.50 | node-t3-cave-03 | 645 | 11 | 0.95 | 0.00 | 0 | 12 |
| t3-axe-kill-chain | 1.50 | node-t3-cave-03 | 645 | 12 | 0.94 | 0.00 | 0 | 12 |
| t3-axe-empowered | 1.00 | node-t3-cave-03 | 430 | 11 | 0.95 | 0.00 | 0 | 11 |
| t3-axe-empowered | 1.00 | node-t3-cave-03 | 430 | 11 | 0.82 | 0.00 | 0 | 11 |
| t3-axe-empowered | 1.35 | node-t3-cave-03 | 579 | 11 | 0.94 | 0.00 | 0 | 11 |
| t3-axe-empowered | 1.35 | node-t3-cave-03 | 579 | 11 | 0.86 | 0.00 | 0 | 11 |
| t3-axe-empowered | 1.50 | node-t3-cave-03 | 645 | 11 | 0.94 | 0.00 | 0 | 11 |
| t3-axe-empowered | 1.50 | node-t3-cave-03 | 645 | 12 | 0.91 | 0.00 | 0 | 11 |
| t4-axe-tempo | 1.00 | node-t4-graveyard-03 | 717 | 5 | 0.85 | 0.23 | 0 | 24 |
| t4-axe-tempo | 1.00 | node-t4-graveyard-03 | 717 | 3 | 0.94 | 0.26 | 0 | 23 |
| t4-axe-tempo | 1.40 | node-t4-graveyard-03 | 1004 | 5 | 0.90 | 0.11 | 0 | 24 |
| t4-axe-tempo | 1.40 | node-t4-graveyard-03 | 1004 | 3 | 0.95 | 0.16 | 0 | 23 |
| t4-axe-tempo | 1.50 | node-t4-graveyard-03 | 1074 | 5 | 0.90 | 0.09 | 0 | 24 |
| t4-axe-tempo | 1.50 | node-t4-graveyard-03 | 1074 | 3 | 0.96 | 0.15 | 0 | 23 |
| t4-axe-kill-chain | 1.00 | node-t4-graveyard-03 | 717 | 4 | 0.93 | 0.24 | 0 | 23 |
| t4-axe-kill-chain | 1.00 | node-t4-graveyard-03 | 717 | 4 | 0.88 | 0.28 | 0 | 20 |
| t4-axe-kill-chain | 1.40 | node-t4-graveyard-03 | 1004 | 4 | 0.95 | 0.15 | 0 | 23 |
| t4-axe-kill-chain | 1.40 | node-t4-graveyard-03 | 1004 | 4 | 0.92 | 0.22 | 0 | 20 |
| t4-axe-kill-chain | 1.50 | node-t4-graveyard-03 | 1074 | 4 | 0.95 | 0.12 | 0 | 23 |
| t4-axe-kill-chain | 1.50 | node-t4-graveyard-03 | 1074 | 4 | 0.92 | 0.18 | 0 | 20 |
| t4-axe-empowered | 1.00 | node-t4-graveyard-03 | 717 | 6 | 0.97 | 0.16 | 0 | 21 |
| t4-axe-empowered | 1.00 | node-t4-graveyard-03 | 717 | 6 | 0.92 | 0.34 | 0 | 23 |
| t4-axe-empowered | 1.40 | node-t4-graveyard-03 | 1004 | 6 | 0.98 | 0.10 | 0 | 21 |
| t4-axe-empowered | 1.40 | node-t4-graveyard-03 | 1004 | 6 | 0.95 | 0.22 | 0 | 23 |
| t4-axe-empowered | 1.50 | node-t4-graveyard-03 | 1074 | 6 | 0.98 | 0.09 | 0 | 21 |
| t4-axe-empowered | 1.50 | node-t4-graveyard-03 | 1074 | 6 | 0.95 | 0.19 | 0 | 23 |
| t1-dagger-affliction | 1.00 | node-t1-swamp-03 | 152 | 12 | 1.00 | 0.00 | 0 | 13 |
| t1-dagger-affliction | 1.00 | node-t1-swamp-03 | 152 | 11 | 1.00 | 0.00 | 0 | 11 |
| t1-dagger-affliction | 1.25 | node-t1-swamp-03 | 190 | 12 | 1.00 | 0.00 | 0 | 13 |
| t1-dagger-affliction | 1.25 | node-t1-swamp-03 | 190 | 11 | 1.00 | 0.00 | 0 | 11 |
| t1-dagger-affliction | 1.50 | node-t1-swamp-03 | 228 | 12 | 1.00 | 0.00 | 0 | 13 |
| t1-dagger-affliction | 1.50 | node-t1-swamp-03 | 228 | 11 | 1.00 | 0.00 | 0 | 11 |
| t1-dagger-control | 1.00 | node-t1-swamp-03 | 152 | 12 | 1.00 | 0.00 | 0 | 13 |
| t1-dagger-control | 1.00 | node-t1-swamp-03 | 152 | 11 | 1.00 | 0.00 | 0 | 11 |
| t1-dagger-control | 1.25 | node-t1-swamp-03 | 190 | 12 | 1.00 | 0.00 | 0 | 13 |
| t1-dagger-control | 1.25 | node-t1-swamp-03 | 190 | 11 | 1.00 | 0.00 | 0 | 11 |
| t1-dagger-control | 1.50 | node-t1-swamp-03 | 228 | 12 | 1.00 | 0.00 | 0 | 13 |
| t1-dagger-control | 1.50 | node-t1-swamp-03 | 228 | 11 | 1.00 | 0.00 | 0 | 11 |
| t1-dagger-kill-chain | 1.00 | node-t1-swamp-03 | 152 | 11 | 0.96 | 0.00 | 0 | 12 |
| t1-dagger-kill-chain | 1.00 | node-t1-swamp-03 | 152 | 12 | 0.95 | 0.00 | 0 | 12 |
| t1-dagger-kill-chain | 1.25 | node-t1-swamp-03 | 190 | 11 | 0.97 | 0.00 | 0 | 12 |
| t1-dagger-kill-chain | 1.25 | node-t1-swamp-03 | 190 | 12 | 0.96 | 0.00 | 0 | 12 |
| t1-dagger-kill-chain | 1.50 | node-t1-swamp-03 | 228 | 11 | 0.97 | 0.00 | 0 | 12 |
| t1-dagger-kill-chain | 1.50 | node-t1-swamp-03 | 228 | 11 | 0.96 | 0.00 | 0 | 10 |
| t2-dagger-affliction | 1.00 | node-t2-swamp-03 | 237 | 10 | 1.00 | 0.00 | 0 | 16 |
| t2-dagger-affliction | 1.00 | node-t2-swamp-03 | 237 | 10 | 1.00 | 0.00 | 0 | 15 |
| t2-dagger-affliction | 1.30 | node-t2-swamp-03 | 309 | 10 | 1.00 | 0.00 | 0 | 16 |
| t2-dagger-affliction | 1.30 | node-t2-swamp-03 | 309 | 10 | 1.00 | 0.00 | 0 | 15 |
| t2-dagger-affliction | 1.50 | node-t2-swamp-03 | 356 | 10 | 1.00 | 0.00 | 0 | 16 |
| t2-dagger-affliction | 1.50 | node-t2-swamp-03 | 356 | 10 | 1.00 | 0.00 | 0 | 15 |
| t2-dagger-control | 1.00 | node-t2-swamp-03 | 237 | 12 | 1.00 | 0.00 | 0 | 16 |
| t2-dagger-control | 1.00 | node-t2-swamp-03 | 237 | 10 | 1.00 | 0.00 | 0 | 18 |
| t2-dagger-control | 1.30 | node-t2-swamp-03 | 309 | 12 | 1.00 | 0.00 | 0 | 16 |
| t2-dagger-control | 1.30 | node-t2-swamp-03 | 309 | 10 | 1.00 | 0.00 | 0 | 18 |
| t2-dagger-control | 1.50 | node-t2-swamp-03 | 356 | 12 | 1.00 | 0.00 | 0 | 16 |
| t2-dagger-control | 1.50 | node-t2-swamp-03 | 356 | 10 | 1.00 | 0.00 | 0 | 18 |
| t2-dagger-kill-chain | 1.00 | node-t2-swamp-03 | 237 | 9 | 1.00 | 0.00 | 0 | 16 |
| t2-dagger-kill-chain | 1.00 | node-t2-swamp-03 | 237 | 8 | 1.00 | 0.00 | 0 | 14 |
| t2-dagger-kill-chain | 1.30 | node-t2-swamp-03 | 309 | 9 | 1.00 | 0.00 | 0 | 16 |
| t2-dagger-kill-chain | 1.30 | node-t2-swamp-03 | 309 | 8 | 1.00 | 0.00 | 0 | 14 |
| t2-dagger-kill-chain | 1.50 | node-t2-swamp-03 | 356 | 9 | 1.00 | 0.00 | 0 | 16 |
| t2-dagger-kill-chain | 1.50 | node-t2-swamp-03 | 356 | 8 | 1.00 | 0.00 | 0 | 14 |
| t3-dagger-affliction | 1.00 | node-t3-swamp-03 | 444 | 9 | 0.94 | 0.05 | 0 | 12 |
| t3-dagger-affliction | 1.00 | node-t3-swamp-03 | 444 | 7 | 1.00 | 0.00 | 0 | 7 |
| t3-dagger-affliction | 1.35 | node-t3-swamp-03 | 598 | 7 | 0.99 | 0.02 | 0 | 9 |
| t3-dagger-affliction | 1.35 | node-t3-swamp-03 | 598 | 7 | 1.00 | 0.00 | 0 | 7 |
| t3-dagger-affliction | 1.50 | node-t3-swamp-03 | 666 | 7 | 0.99 | 0.00 | 0 | 9 |
| t3-dagger-affliction | 1.50 | node-t3-swamp-03 | 666 | 7 | 1.00 | 0.00 | 0 | 7 |
| t3-dagger-control | 1.00 | node-t3-swamp-03 | 444 | 7 | 1.00 | 0.00 | 0 | 8 |
| t3-dagger-control | 1.00 | node-t3-swamp-03 | 444 | 9 | 1.00 | 0.00 | 0 | 9 |
| t3-dagger-control | 1.35 | node-t3-swamp-03 | 598 | 7 | 1.00 | 0.00 | 0 | 8 |
| t3-dagger-control | 1.35 | node-t3-swamp-03 | 598 | 9 | 1.00 | 0.00 | 0 | 9 |
| t3-dagger-control | 1.50 | node-t3-swamp-03 | 666 | 7 | 1.00 | 0.00 | 0 | 8 |
| t3-dagger-control | 1.50 | node-t3-swamp-03 | 666 | 7 | 1.00 | 0.00 | 0 | 8 |
| t3-dagger-kill-chain | 1.00 | node-t3-swamp-03 | 444 | 8 | 0.97 | 0.00 | 0 | 12 |
| t3-dagger-kill-chain | 1.00 | node-t3-swamp-03 | 444 | 9 | 1.00 | 0.00 | 0 | 11 |
| t3-dagger-kill-chain | 1.35 | node-t3-swamp-03 | 598 | 7 | 0.96 | 0.00 | 0 | 10 |
| t3-dagger-kill-chain | 1.35 | node-t3-swamp-03 | 598 | 9 | 1.00 | 0.00 | 0 | 11 |
| t3-dagger-kill-chain | 1.50 | node-t3-swamp-03 | 666 | 8 | 0.98 | 0.00 | 0 | 12 |
| t3-dagger-kill-chain | 1.50 | node-t3-swamp-03 | 666 | 9 | 1.00 | 0.00 | 0 | 11 |
| t4-dagger-affliction | 1.00 | node-t4-tundra-03 | 795 | 6 | 1.00 | 0.03 | 0 | 9 |
| t4-dagger-affliction | 1.00 | node-t4-tundra-03 | 795 | 3 | 1.00 | 0.00 | 0 | 9 |
| t4-dagger-affliction | 1.40 | node-t4-tundra-03 | 1112 | 7 | 1.00 | 0.00 | 0 | 9 |
| t4-dagger-affliction | 1.40 | node-t4-tundra-03 | 1112 | 3 | 1.00 | 0.00 | 0 | 9 |
| t4-dagger-affliction | 1.50 | node-t4-tundra-03 | 1192 | 8 | 1.00 | 0.00 | 0 | 9 |
| t4-dagger-affliction | 1.50 | node-t4-tundra-03 | 1192 | 3 | 1.00 | 0.00 | 0 | 9 |
| t4-dagger-control | 1.00 | node-t4-tundra-03 | 795 | 5 | 1.00 | 0.00 | 0 | 10 |
| t4-dagger-control | 1.00 | node-t4-tundra-03 | 795 | 4 | 1.00 | 0.00 | 0 | 8 |
| t4-dagger-control | 1.40 | node-t4-tundra-03 | 1112 | 6 | 1.00 | 0.00 | 0 | 9 |
| t4-dagger-control | 1.40 | node-t4-tundra-03 | 1112 | 4 | 1.00 | 0.00 | 0 | 8 |
| t4-dagger-control | 1.50 | node-t4-tundra-03 | 1192 | 6 | 1.00 | 0.00 | 0 | 9 |
| t4-dagger-control | 1.50 | node-t4-tundra-03 | 1192 | 4 | 1.00 | 0.00 | 0 | 8 |
| t4-dagger-kill-chain | 1.00 | node-t4-tundra-03 | 795 | 11 | 1.00 | 0.01 | 0 | 12 |
| t4-dagger-kill-chain | 1.00 | node-t4-tundra-03 | 795 | 8 | 1.00 | 0.08 | 0 | 11 |
| t4-dagger-kill-chain | 1.40 | node-t4-tundra-03 | 1112 | 13 | 1.00 | 0.00 | 0 | 13 |
| t4-dagger-kill-chain | 1.40 | node-t4-tundra-03 | 1112 | 6 | 1.00 | 0.00 | 0 | 11 |
| t4-dagger-kill-chain | 1.50 | node-t4-tundra-03 | 1192 | 13 | 1.00 | 0.00 | 0 | 13 |
| t4-dagger-kill-chain | 1.50 | node-t4-tundra-03 | 1192 | 5 | 1.00 | 0.00 | 0 | 11 |

## Refusals

None: every lane bought and activated its whole band.
