# Pool raise bench — 2026-10-01T18:00:14.159Z

tiers 1/2/3/4; factors 1, seed, 1.5 (seed = 1/1.25/1.3/1.35/1.4);
boss cap 300 s; normal-node cap 120 s on 3 lane(s) per lineage; gear +3; seeds 101009, 101033.

Criterion (Phase 0 call four): the lowest factor whose median boss time-to-death
exceeds median kill time for the pure lanes, without median normal-node fight-end
HP above 0.80. `>N` means the metric was not reached inside the cap (for TTD, that
the boss could not out-pace the build at all).

## Gate table

| tier | factor | lanes | median TTD (s) | median kill (s) | TTD/kill | lanes TTD>kill | median end HP | deaths | measured TTD | measured kill |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| T1 | 1.00 | 9 | 34.5 | 63.1 | 0.55 | 0/9 | 0.89 | 0 | 18/18 | 0/18 |
| T1 | 1.25 | 9 | 42.3 | 66.2 | 0.64 | 1/9 | 0.92 | 0 | 16/18 | 2/18 |
| T1 | 1.50 | 9 | 51.3 | 65.7 | 0.78 | 3/9 | 0.93 | 0 | 12/18 | 6/18 |
| T2 | 1.00 | 9 | 203.2 | 67.6 | 3.01 | 6/9 | 1.00 | 2 | 6/18 | 12/18 |
| T2 | 1.30 | 9 | 335.7 | 67.6 | 4.97 | 6/9 | 1.00 | 0 | 6/18 | 12/18 |
| T2 | 1.50 | 9 | 546.5 | 67.6 | 8.08 | 6/9 | 1.00 | 0 | 6/18 | 12/18 |
| T3 | 1.00 | 6 | 299.3 | 119.9 | 2.50 | 3/6 | 1.00 | 0 | 6/12 | 6/12 |
| T3 | 1.35 | 6 | 396.9 | 121.8 | 3.26 | 3/6 | 1.00 | 0 | 6/12 | 6/12 |
| T3 | 1.50 | 6 | 436.3 | 120.1 | 3.63 | 3/6 | 1.00 | 0 | 6/12 | 6/12 |
| T4 | 1.00 | 6 | inf | 321.0 | inf | 6/6 | 1.00 | 0 | 0/12 | 4/12 |
| T4 | 1.40 | 6 | >1200 | 321.0 | 478309461526982.88 | 6/6 | 1.00 | 0 | 0/12 | 4/12 |
| T4 | 1.50 | 6 | >1200 | 321.0 | 454621754860886.19 | 6/6 | 1.00 | 0 | 0/12 | 4/12 |

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
| t4-broadsword-kill-chain | 1.00 | dune-throne-sovereign | 665 | timeout | 311.4 | inf | inf | 4 |  |
| t4-broadsword-kill-chain | 1.00 | dune-throne-sovereign | 665 | timeout | 311.4 | inf | inf | 4 |  |
| t4-broadsword-kill-chain | 1.40 | dune-throne-sovereign | 931 | timeout | 311.4 | >1200 | 986144306501993.50 | 4 |  |
| t4-broadsword-kill-chain | 1.40 | dune-throne-sovereign | 931 | timeout | 311.4 | >1200 | 986144306501993.50 | 4 |  |
| t4-broadsword-kill-chain | 1.50 | dune-throne-sovereign | 998 | timeout | 311.4 | inf | inf | 4 |  |
| t4-broadsword-kill-chain | 1.50 | dune-throne-sovereign | 998 | timeout | 311.4 | inf | inf | 4 |  |
| t4-broadsword-empowered | 1.00 | dune-throne-sovereign | 665 | boss_killed | 290.6 | inf | inf | 4 |  |
| t4-broadsword-empowered | 1.00 | dune-throne-sovereign | 665 | boss_killed | 290.6 | inf | inf | 4 |  |
| t4-broadsword-empowered | 1.40 | dune-throne-sovereign | 931 | boss_killed | 290.6 | >1200 | 8.43 | 4 |  |
| t4-broadsword-empowered | 1.40 | dune-throne-sovereign | 931 | boss_killed | 290.6 | >1200 | 8.43 | 4 |  |
| t4-broadsword-empowered | 1.50 | dune-throne-sovereign | 998 | boss_killed | 290.6 | >1200 | 9.69 | 4 |  |
| t4-broadsword-empowered | 1.50 | dune-throne-sovereign | 998 | boss_killed | 290.6 | >1200 | 9.69 | 4 |  |
| t4-broadsword-tempo | 1.00 | dune-throne-sovereign | 665 | boss_killed | 266.0 | inf | inf | 4 |  |
| t4-broadsword-tempo | 1.00 | dune-throne-sovereign | 665 | boss_killed | 266.0 | inf | inf | 4 |  |
| t4-broadsword-tempo | 1.40 | dune-throne-sovereign | 931 | boss_killed | 266.0 | inf | inf | 4 |  |
| t4-broadsword-tempo | 1.40 | dune-throne-sovereign | 931 | boss_killed | 266.0 | inf | inf | 4 |  |
| t4-broadsword-tempo | 1.50 | dune-throne-sovereign | 998 | boss_killed | 266.0 | >1200 | 1097312604520448.00 | 4 |  |
| t4-broadsword-tempo | 1.50 | dune-throne-sovereign | 998 | boss_killed | 266.0 | >1200 | 1097312604520448.00 | 4 |  |
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
| t3-rapier-tempo | 1.00 | apex-bramble-slasher | 450 | boss_killed | 140.8 | >1200 | 23.76 | 3 |  |
| t3-rapier-tempo | 1.00 | apex-bramble-slasher | 450 | boss_killed | 140.8 | >1200 | 23.76 | 3 |  |
| t3-rapier-tempo | 1.35 | apex-bramble-slasher | 607 | boss_killed | 140.8 | >1200 | 32.05 | 3 |  |
| t3-rapier-tempo | 1.35 | apex-bramble-slasher | 607 | boss_killed | 140.8 | >1200 | 32.05 | 3 |  |
| t3-rapier-tempo | 1.50 | apex-bramble-slasher | 675 | boss_killed | 140.8 | >1200 | 35.64 | 3 |  |
| t3-rapier-tempo | 1.50 | apex-bramble-slasher | 675 | boss_killed | 140.8 | >1200 | 35.64 | 3 |  |
| t3-rapier-affliction | 1.00 | apex-bramble-slasher | 450 | boss_killed | 133.3 | 521.8 | 3.91 | 3 |  |
| t3-rapier-affliction | 1.00 | apex-bramble-slasher | 450 | boss_killed | 133.3 | 521.8 | 3.91 | 3 |  |
| t3-rapier-affliction | 1.35 | apex-bramble-slasher | 607 | boss_killed | 133.3 | 703.8 | 5.28 | 3 |  |
| t3-rapier-affliction | 1.35 | apex-bramble-slasher | 607 | boss_killed | 133.3 | 703.8 | 5.28 | 3 |  |
| t3-rapier-affliction | 1.50 | apex-bramble-slasher | 675 | boss_killed | 133.3 | 782.7 | 5.87 | 3 |  |
| t3-rapier-affliction | 1.50 | apex-bramble-slasher | 675 | boss_killed | 133.3 | 782.7 | 5.87 | 3 |  |
| t3-rapier-engagement | 1.00 | apex-bramble-slasher | 450 | boss_killed | 121.5 | inf | inf | 3 |  |
| t3-rapier-engagement | 1.00 | apex-bramble-slasher | 450 | boss_killed | 121.5 | inf | inf | 3 |  |
| t3-rapier-engagement | 1.35 | apex-bramble-slasher | 607 | boss_killed | 121.5 | inf | inf | 3 |  |
| t3-rapier-engagement | 1.35 | apex-bramble-slasher | 607 | boss_killed | 121.5 | inf | inf | 3 |  |
| t3-rapier-engagement | 1.50 | apex-bramble-slasher | 675 | boss_killed | 121.5 | inf | inf | 3 |  |
| t3-rapier-engagement | 1.50 | apex-bramble-slasher | 675 | boss_killed | 121.5 | inf | inf | 3 |  |
| t4-rapier-tempo | 1.00 | verdant-crown-predator | 713 | timeout | 374.6 | >1200 | 15.94 | 4 |  |
| t4-rapier-tempo | 1.00 | verdant-crown-predator | 713 | timeout | 374.6 | >1200 | 15.94 | 4 |  |
| t4-rapier-tempo | 1.40 | verdant-crown-predator | 999 | timeout | 374.6 | >1200 | 22.33 | 4 |  |
| t4-rapier-tempo | 1.40 | verdant-crown-predator | 999 | timeout | 374.6 | >1200 | 22.33 | 4 |  |
| t4-rapier-tempo | 1.50 | verdant-crown-predator | 1071 | timeout | 374.6 | >1200 | 23.94 | 4 |  |
| t4-rapier-tempo | 1.50 | verdant-crown-predator | 1071 | timeout | 374.6 | >1200 | 23.94 | 4 |  |
| t4-rapier-affliction | 1.00 | verdant-crown-predator | 713 | timeout | 357.8 | inf | inf | 4 |  |
| t4-rapier-affliction | 1.00 | verdant-crown-predator | 713 | timeout | 357.8 | inf | inf | 4 |  |
| t4-rapier-affliction | 1.40 | verdant-crown-predator | 999 | timeout | 357.8 | inf | inf | 4 |  |
| t4-rapier-affliction | 1.40 | verdant-crown-predator | 999 | timeout | 357.8 | inf | inf | 4 |  |
| t4-rapier-affliction | 1.50 | verdant-crown-predator | 1071 | timeout | 357.8 | inf | inf | 4 |  |
| t4-rapier-affliction | 1.50 | verdant-crown-predator | 1071 | timeout | 357.8 | inf | inf | 4 |  |
| t4-rapier-engagement | 1.00 | verdant-crown-predator | 713 | timeout | 330.6 | >1200 | 14.54 | 4 |  |
| t4-rapier-engagement | 1.00 | verdant-crown-predator | 713 | timeout | 330.6 | >1200 | 14.54 | 4 |  |
| t4-rapier-engagement | 1.40 | verdant-crown-predator | 999 | timeout | 330.6 | >1200 | 20.37 | 4 |  |
| t4-rapier-engagement | 1.40 | verdant-crown-predator | 999 | timeout | 330.6 | >1200 | 20.37 | 4 |  |
| t4-rapier-engagement | 1.50 | verdant-crown-predator | 1071 | timeout | 330.6 | >1200 | 21.84 | 4 |  |
| t4-rapier-engagement | 1.50 | verdant-crown-predator | 1071 | timeout | 330.6 | >1200 | 21.84 | 4 |  |
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

## Refusals

None: every lane bought and activated its whole band.
