# Pool raise bench — 2026-10-01T18:11:05.690Z

tiers 1; factors 1.75, 2 (seed = 1/1.25/1.3/1.35/1.4);
boss cap 300 s; normal-node cap 120 s on 3 lane(s) per lineage; gear +3; seeds 101009, 101033.

Criterion (Phase 0 call four): the lowest factor whose median boss time-to-death
exceeds median kill time for the pure lanes, without median normal-node fight-end
HP above 0.80. Time-to-death is clamped at 1200 s, which reads as "the boss
cannot kill this build"; kill time is extrapolated from the share of the bar removed
whenever the boss survived, which is optimistic for a boss that gets harder late.

## Gate table

| tier | factor | lanes | median TTD (s) | median kill (s) | TTD/kill | lanes TTD>kill | median end HP | deaths | measured TTD | measured kill |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| T1 | 1.75 | 15 | 81.6 | 55.8 | 1.46 | 10/15 | 0.94 | 0 | 10/30 | 20/30 |
| T1 | 2.00 | 15 | 93.3 | 55.8 | 1.67 | 11/15 | 0.95 | 0 | 8/30 | 22/30 |

## Per lane, boss

| cell | factor | boss | maxHp | outcome | kill (s) | TTD (s) | TTD/kill | cards | refusals |
|---|---:|---|---:|---|---:|---:|---:|---:|---|
| t1-broadsword-kill-chain | 1.75 | tusked-razorback | 243 | player_died | 66.5 | 61.6 | 0.93 | 2 |  |
| t1-broadsword-kill-chain | 1.75 | tusked-razorback | 243 | player_died | 66.8 | 55.2 | 0.83 | 2 |  |
| t1-broadsword-kill-chain | 2.00 | tusked-razorback | 278 | boss_killed | 65.1 | 71.7 | 1.10 | 2 |  |
| t1-broadsword-kill-chain | 2.00 | tusked-razorback | 278 | player_died | 67.0 | 57.5 | 0.86 | 2 |  |
| t1-broadsword-empowered | 1.75 | tusked-razorback | 243 | boss_killed | 61.1 | 73.6 | 1.20 | 2 |  |
| t1-broadsword-empowered | 1.75 | tusked-razorback | 243 | player_died | 63.4 | 59.3 | 0.94 | 2 |  |
| t1-broadsword-empowered | 2.00 | tusked-razorback | 278 | boss_killed | 61.1 | 89.1 | 1.46 | 2 |  |
| t1-broadsword-empowered | 2.00 | tusked-razorback | 278 | boss_killed | 63.1 | 73.8 | 1.17 | 2 |  |
| t1-broadsword-tempo | 1.75 | tusked-razorback | 243 | boss_killed | 65.1 | 75.1 | 1.15 | 2 |  |
| t1-broadsword-tempo | 1.75 | tusked-razorback | 243 | player_died | 66.5 | 47.4 | 0.71 | 2 |  |
| t1-broadsword-tempo | 2.00 | tusked-razorback | 278 | boss_killed | 65.1 | 94.2 | 1.45 | 2 |  |
| t1-broadsword-tempo | 2.00 | tusked-razorback | 278 | player_died | 66.5 | 57.1 | 0.86 | 2 |  |
| t1-rapier-tempo | 1.75 | gnarled-greatbear | 286 | player_died | 37.3 | 31.4 | 0.84 | 2 |  |
| t1-rapier-tempo | 1.75 | gnarled-greatbear | 286 | player_died | 37.3 | 31.4 | 0.84 | 2 |  |
| t1-rapier-tempo | 2.00 | gnarled-greatbear | 326 | player_died | 37.6 | 33.8 | 0.90 | 2 |  |
| t1-rapier-tempo | 2.00 | gnarled-greatbear | 326 | player_died | 37.6 | 33.8 | 0.90 | 2 |  |
| t1-rapier-affliction | 1.75 | gnarled-greatbear | 286 | player_died | 40.7 | 31.4 | 0.77 | 2 |  |
| t1-rapier-affliction | 1.75 | gnarled-greatbear | 286 | player_died | 40.7 | 31.4 | 0.77 | 2 |  |
| t1-rapier-affliction | 2.00 | gnarled-greatbear | 326 | player_died | 39.9 | 33.8 | 0.85 | 2 |  |
| t1-rapier-affliction | 2.00 | gnarled-greatbear | 326 | player_died | 39.9 | 33.8 | 0.85 | 2 |  |
| t1-rapier-engagement | 1.75 | gnarled-greatbear | 286 | player_died | 39.2 | 31.4 | 0.80 | 2 |  |
| t1-rapier-engagement | 1.75 | gnarled-greatbear | 286 | player_died | 39.2 | 31.4 | 0.80 | 2 |  |
| t1-rapier-engagement | 2.00 | gnarled-greatbear | 326 | player_died | 38.5 | 33.8 | 0.88 | 2 |  |
| t1-rapier-engagement | 2.00 | gnarled-greatbear | 326 | player_died | 38.5 | 33.8 | 0.88 | 2 |  |
| t1-hammer-empowered | 1.75 | crag-behemoth | 334 | boss_killed | 88.0 | 185.0 | 2.10 | 2 |  |
| t1-hammer-empowered | 1.75 | crag-behemoth | 334 | boss_killed | 88.0 | 185.0 | 2.10 | 2 |  |
| t1-hammer-empowered | 2.00 | crag-behemoth | 382 | boss_killed | 88.0 | 237.5 | 2.70 | 2 |  |
| t1-hammer-empowered | 2.00 | crag-behemoth | 382 | boss_killed | 88.0 | 237.5 | 2.70 | 2 |  |
| t1-hammer-control | 1.75 | crag-behemoth | 334 | boss_killed | 88.0 | 185.0 | 2.10 | 2 |  |
| t1-hammer-control | 1.75 | crag-behemoth | 334 | boss_killed | 88.0 | 185.0 | 2.10 | 2 |  |
| t1-hammer-control | 2.00 | crag-behemoth | 382 | boss_killed | 88.0 | 237.5 | 2.70 | 2 |  |
| t1-hammer-control | 2.00 | crag-behemoth | 382 | boss_killed | 88.0 | 237.5 | 2.70 | 2 |  |
| t1-hammer-engagement | 1.75 | crag-behemoth | 334 | boss_killed | 88.0 | 194.3 | 2.21 | 2 |  |
| t1-hammer-engagement | 1.75 | crag-behemoth | 334 | boss_killed | 88.0 | 194.3 | 2.21 | 2 |  |
| t1-hammer-engagement | 2.00 | crag-behemoth | 382 | boss_killed | 88.0 | 246.2 | 2.80 | 2 |  |
| t1-hammer-engagement | 2.00 | crag-behemoth | 382 | boss_killed | 88.0 | 246.2 | 2.80 | 2 |  |
| t1-axe-tempo | 1.75 | obsidian-broodmother | 272 | boss_killed | 55.8 | >=1200 | 21.51 | 2 |  |
| t1-axe-tempo | 1.75 | obsidian-broodmother | 272 | boss_killed | 55.8 | >=1200 | 21.51 | 2 |  |
| t1-axe-tempo | 2.00 | obsidian-broodmother | 311 | boss_killed | 55.8 | >=1200 | 21.51 | 2 |  |
| t1-axe-tempo | 2.00 | obsidian-broodmother | 311 | boss_killed | 55.8 | >=1200 | 21.51 | 2 |  |
| t1-axe-kill-chain | 1.75 | obsidian-broodmother | 272 | boss_killed | 56.9 | >=1200 | 21.09 | 2 |  |
| t1-axe-kill-chain | 1.75 | obsidian-broodmother | 272 | boss_killed | 56.9 | >=1200 | 21.09 | 2 |  |
| t1-axe-kill-chain | 2.00 | obsidian-broodmother | 311 | boss_killed | 56.9 | >=1200 | 21.09 | 2 |  |
| t1-axe-kill-chain | 2.00 | obsidian-broodmother | 311 | boss_killed | 56.9 | >=1200 | 21.09 | 2 |  |
| t1-axe-empowered | 1.75 | obsidian-broodmother | 272 | boss_killed | 55.4 | >=1200 | 21.66 | 2 |  |
| t1-axe-empowered | 1.75 | obsidian-broodmother | 272 | boss_killed | 55.4 | >=1200 | 21.66 | 2 |  |
| t1-axe-empowered | 2.00 | obsidian-broodmother | 311 | boss_killed | 55.4 | >=1200 | 21.66 | 2 |  |
| t1-axe-empowered | 2.00 | obsidian-broodmother | 311 | boss_killed | 55.4 | >=1200 | 21.66 | 2 |  |
| t1-dagger-affliction | 1.75 | grave-toadeater | 266 | boss_killed | 47.6 | 81.4 | 1.71 | 2 |  |
| t1-dagger-affliction | 1.75 | grave-toadeater | 266 | boss_killed | 47.6 | 81.4 | 1.71 | 2 |  |
| t1-dagger-affliction | 2.00 | grave-toadeater | 304 | boss_killed | 47.6 | 93.1 | 1.96 | 2 |  |
| t1-dagger-affliction | 2.00 | grave-toadeater | 304 | boss_killed | 47.6 | 93.1 | 1.96 | 2 |  |
| t1-dagger-control | 1.75 | grave-toadeater | 266 | boss_killed | 49.9 | 82.6 | 1.66 | 2 |  |
| t1-dagger-control | 1.75 | grave-toadeater | 266 | boss_killed | 49.9 | 82.6 | 1.66 | 2 |  |
| t1-dagger-control | 2.00 | grave-toadeater | 304 | boss_killed | 49.9 | 94.5 | 1.89 | 2 |  |
| t1-dagger-control | 2.00 | grave-toadeater | 304 | boss_killed | 49.9 | 94.5 | 1.89 | 2 |  |
| t1-dagger-kill-chain | 1.75 | grave-toadeater | 266 | boss_killed | 55.1 | 81.6 | 1.48 | 2 |  |
| t1-dagger-kill-chain | 1.75 | grave-toadeater | 266 | boss_killed | 55.1 | 81.6 | 1.48 | 2 |  |
| t1-dagger-kill-chain | 2.00 | grave-toadeater | 304 | boss_killed | 55.1 | 93.3 | 1.69 | 2 |  |
| t1-dagger-kill-chain | 2.00 | grave-toadeater | 304 | boss_killed | 55.1 | 93.3 | 1.69 | 2 |  |

## Per lane, normal node

| cell | factor | node | maxHp | fights | median end HP | time in band | deaths | kills |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| t1-broadsword-kill-chain | 1.75 | node-t1-plains-03 | 243 | 7 | 1.00 | 0.00 | 0 | 27 |
| t1-broadsword-kill-chain | 1.75 | node-t1-plains-03 | 243 | 8 | 1.00 | 0.00 | 0 | 24 |
| t1-broadsword-kill-chain | 2.00 | node-t1-plains-03 | 278 | 7 | 1.00 | 0.00 | 0 | 27 |
| t1-broadsword-kill-chain | 2.00 | node-t1-plains-03 | 278 | 8 | 1.00 | 0.00 | 0 | 24 |
| t1-broadsword-empowered | 1.75 | node-t1-plains-03 | 243 | 7 | 1.00 | 0.00 | 0 | 26 |
| t1-broadsword-empowered | 1.75 | node-t1-plains-03 | 243 | 6 | 1.00 | 0.00 | 0 | 27 |
| t1-broadsword-empowered | 2.00 | node-t1-plains-03 | 278 | 7 | 1.00 | 0.00 | 0 | 26 |
| t1-broadsword-empowered | 2.00 | node-t1-plains-03 | 278 | 6 | 1.00 | 0.00 | 0 | 27 |
| t1-broadsword-tempo | 1.75 | node-t1-plains-03 | 243 | 7 | 1.00 | 0.00 | 0 | 25 |
| t1-broadsword-tempo | 1.75 | node-t1-plains-03 | 243 | 6 | 1.00 | 0.00 | 0 | 27 |
| t1-broadsword-tempo | 2.00 | node-t1-plains-03 | 278 | 7 | 1.00 | 0.00 | 0 | 25 |
| t1-broadsword-tempo | 2.00 | node-t1-plains-03 | 278 | 6 | 1.00 | 0.00 | 0 | 27 |
| t1-rapier-tempo | 1.75 | node-t1-forest-03 | 286 | 11 | 0.94 | 0.00 | 0 | 14 |
| t1-rapier-tempo | 1.75 | node-t1-forest-03 | 286 | 10 | 0.92 | 0.18 | 0 | 19 |
| t1-rapier-tempo | 2.00 | node-t1-forest-03 | 326 | 11 | 0.95 | 0.08 | 0 | 15 |
| t1-rapier-tempo | 2.00 | node-t1-forest-03 | 326 | 10 | 0.94 | 0.13 | 0 | 19 |
| t1-rapier-affliction | 1.75 | node-t1-forest-03 | 286 | 11 | 0.94 | 0.09 | 0 | 13 |
| t1-rapier-affliction | 1.75 | node-t1-forest-03 | 286 | 9 | 0.93 | 0.23 | 0 | 17 |
| t1-rapier-affliction | 2.00 | node-t1-forest-03 | 326 | 11 | 0.95 | 0.06 | 0 | 13 |
| t1-rapier-affliction | 2.00 | node-t1-forest-03 | 326 | 10 | 0.95 | 0.28 | 0 | 17 |
| t1-rapier-engagement | 1.75 | node-t1-forest-03 | 286 | 11 | 0.94 | 0.09 | 0 | 13 |
| t1-rapier-engagement | 1.75 | node-t1-forest-03 | 286 | 9 | 0.89 | 0.25 | 0 | 19 |
| t1-rapier-engagement | 2.00 | node-t1-forest-03 | 326 | 11 | 0.95 | 0.05 | 0 | 13 |
| t1-rapier-engagement | 2.00 | node-t1-forest-03 | 326 | 10 | 0.84 | 0.22 | 0 | 21 |
| t1-hammer-empowered | 1.75 | node-t1-mountain-03 | 334 | 7 | 0.91 | 0.08 | 0 | 10 |
| t1-hammer-empowered | 1.75 | node-t1-mountain-03 | 334 | 8 | 0.94 | 0.00 | 0 | 9 |
| t1-hammer-empowered | 2.00 | node-t1-mountain-03 | 382 | 8 | 0.94 | 0.00 | 0 | 9 |
| t1-hammer-empowered | 2.00 | node-t1-mountain-03 | 382 | 6 | 0.94 | 0.11 | 0 | 9 |
| t1-hammer-control | 1.75 | node-t1-mountain-03 | 334 | 7 | 0.91 | 0.08 | 0 | 10 |
| t1-hammer-control | 1.75 | node-t1-mountain-03 | 334 | 7 | 0.95 | 0.11 | 0 | 9 |
| t1-hammer-control | 2.00 | node-t1-mountain-03 | 382 | 8 | 0.94 | 0.00 | 0 | 9 |
| t1-hammer-control | 2.00 | node-t1-mountain-03 | 382 | 7 | 0.97 | 0.11 | 0 | 9 |
| t1-hammer-engagement | 1.75 | node-t1-mountain-03 | 334 | 7 | 0.95 | 0.02 | 0 | 9 |
| t1-hammer-engagement | 1.75 | node-t1-mountain-03 | 334 | 8 | 0.95 | 0.11 | 0 | 10 |
| t1-hammer-engagement | 2.00 | node-t1-mountain-03 | 382 | 7 | 0.90 | 0.01 | 0 | 10 |
| t1-hammer-engagement | 2.00 | node-t1-mountain-03 | 382 | 7 | 0.95 | 0.08 | 0 | 10 |
| t1-axe-tempo | 1.75 | node-t1-cave-03 | 272 | 6 | 0.79 | 0.10 | 0 | 6 |
| t1-axe-tempo | 1.75 | node-t1-cave-03 | 272 | 8 | 0.79 | 0.16 | 0 | 10 |
| t1-axe-tempo | 2.00 | node-t1-cave-03 | 311 | 6 | 0.82 | 0.00 | 0 | 6 |
| t1-axe-tempo | 2.00 | node-t1-cave-03 | 311 | 9 | 0.82 | 0.01 | 0 | 10 |
| t1-axe-kill-chain | 1.75 | node-t1-cave-03 | 272 | 7 | 0.72 | 0.16 | 0 | 7 |
| t1-axe-kill-chain | 1.75 | node-t1-cave-03 | 272 | 9 | 0.79 | 0.14 | 0 | 10 |
| t1-axe-kill-chain | 2.00 | node-t1-cave-03 | 311 | 7 | 0.81 | 0.04 | 0 | 7 |
| t1-axe-kill-chain | 2.00 | node-t1-cave-03 | 311 | 8 | 0.82 | 0.01 | 0 | 9 |
| t1-axe-empowered | 1.75 | node-t1-cave-03 | 272 | 6 | 0.79 | 0.10 | 0 | 6 |
| t1-axe-empowered | 1.75 | node-t1-cave-03 | 272 | 8 | 0.79 | 0.16 | 0 | 10 |
| t1-axe-empowered | 2.00 | node-t1-cave-03 | 311 | 6 | 0.82 | 0.00 | 0 | 6 |
| t1-axe-empowered | 2.00 | node-t1-cave-03 | 311 | 9 | 0.82 | 0.01 | 0 | 10 |
| t1-dagger-affliction | 1.75 | node-t1-swamp-03 | 266 | 12 | 1.00 | 0.00 | 0 | 13 |
| t1-dagger-affliction | 1.75 | node-t1-swamp-03 | 266 | 11 | 1.00 | 0.00 | 0 | 11 |
| t1-dagger-affliction | 2.00 | node-t1-swamp-03 | 304 | 12 | 1.00 | 0.00 | 0 | 13 |
| t1-dagger-affliction | 2.00 | node-t1-swamp-03 | 304 | 11 | 1.00 | 0.00 | 0 | 11 |
| t1-dagger-control | 1.75 | node-t1-swamp-03 | 266 | 12 | 1.00 | 0.00 | 0 | 13 |
| t1-dagger-control | 1.75 | node-t1-swamp-03 | 266 | 11 | 1.00 | 0.00 | 0 | 11 |
| t1-dagger-control | 2.00 | node-t1-swamp-03 | 304 | 12 | 1.00 | 0.00 | 0 | 13 |
| t1-dagger-control | 2.00 | node-t1-swamp-03 | 304 | 11 | 1.00 | 0.00 | 0 | 11 |
| t1-dagger-kill-chain | 1.75 | node-t1-swamp-03 | 266 | 11 | 0.98 | 0.00 | 0 | 12 |
| t1-dagger-kill-chain | 1.75 | node-t1-swamp-03 | 266 | 12 | 0.97 | 0.00 | 0 | 11 |
| t1-dagger-kill-chain | 2.00 | node-t1-swamp-03 | 304 | 10 | 0.98 | 0.00 | 0 | 11 |
| t1-dagger-kill-chain | 2.00 | node-t1-swamp-03 | 304 | 12 | 0.97 | 0.00 | 0 | 11 |

## Refusals

None: every lane bought and activated its whole band.
