# Tier 1 boss exam

Guard stripped, boss woken immediately. 5 armour set(s) x 6 class roots per boss, gear fully upgraded, time-scale 1, cap 240s.

`cost` = health bars the full fight costs (`hp lost/s / pool` x `ttk`). `ttk` is extrapolated from boss HP removed when the fight did not finish. `burst` is the worst single second as a share of the pool.

| boss | biome | win | ttk s | cost bars | hp/s %pool | burst %pool | spike% | attrition% |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Crag Behemoth | mountain | 21/30 | 44.3 | 2.38 | 4.5 | 22.3 | 0 | 3 |
| Gnarled Greatbear | forest | 0/30 | 20.6 | 1.99 | 10.0 | 19.3 | 0 | 0 |
| Tusked Razorback | plains | 9/30 | 37.8 | 1.87 | 5.2 | 15.8 | 0 | 0 |
| Obsidian Broodmother | cave | 26/30 | 44.4 | 1.79 | 3.2 | 14.5 | 0 | 4 |
| Grave Toadeater | swamp | 27/30 | 23.0 | 0.64 | 2.3 | 6.3 | 0 | 86 |

## Per class root (cost bars)

| boss | cadence | cooldown | reload | energy | dot | summoner |
|---|---:|---:|---:|---:|---:|---:|
| Crag Behemoth | 1.09 | 0.98 | 0.86 | 0.68 | 1.08 | 9.60 |
| Gnarled Greatbear | 2.10 | 1.99 | 1.74 | 1.86 | 2.21 | 2.07 |
| Tusked Razorback | 1.92 | 1.33 | 1.64 | 1.75 | 1.84 | 2.74 |
| Obsidian Broodmother | 0.72 | 0.62 | 0.54 | 0.34 | 0.60 | 7.94 |
| Grave Toadeater | 0.55 | 0.45 | 0.33 | 0.15 | 0.41 | 1.95 |

## Per armour set (cost bars)

| boss | plains | forest | swamp | mountain | cave |
|---|---:|---:|---:|---:|---:|
| Crag Behemoth | 2.73 | 3.02 | 2.60 | 2.11 | 1.43 |
| Gnarled Greatbear | 1.68 | 2.23 | 2.34 | 1.74 | 1.98 |
| Tusked Razorback | 2.23 | 2.04 | 1.82 | 1.61 | 1.63 |
| Obsidian Broodmother | 2.00 | 2.82 | 1.79 | 1.17 | 1.18 |
| Grave Toadeater | 1.11 | 0.41 | 0.74 | 0.52 | 0.45 |

## Every fight

| boss | gear | class | outcome | elapsed s | boss hp removed | ttk s | cost bars | burst %pool |
|---|---|---|---|---:|---:|---:|---:|---:|
| Crag Behemoth | plains | cadence | bot_died | 24.6 | 83% | 29.6 | 1.51 | 18.9 |
| Crag Behemoth | plains | cooldown | boss_killed | 28.3 | 100% | 28.3 | 1.25 | 15.6 |
| Crag Behemoth | plains | reload | bot_died | 21.1 | 87% | 24.3 | 1.15 | 21.5 |
| Crag Behemoth | plains | energy | boss_killed | 27.7 | 100% | 27.7 | 0.76 | 23.6 |
| Crag Behemoth | plains | dot | bot_died | 21.1 | 79% | 26.7 | 1.26 | 17.6 |
| Crag Behemoth | plains | summoner | bot_died | 24.6 | 15% | 164.8 | 10.47 | 25.4 |
| Crag Behemoth | forest | cadence | boss_killed | 20.5 | 100% | 20.5 | 1.00 | 24.4 |
| Crag Behemoth | forest | cooldown | boss_killed | 21.4 | 100% | 21.4 | 1.01 | 20.3 |
| Crag Behemoth | forest | reload | boss_killed | 19.7 | 100% | 19.7 | 0.88 | 27.5 |
| Crag Behemoth | forest | energy | boss_killed | 19.0 | 100% | 19.0 | 0.75 | 29.9 |
| Crag Behemoth | forest | dot | bot_died | 24.6 | 93% | 26.4 | 1.28 | 22.4 |
| Crag Behemoth | forest | summoner | boss_killed | 213.6 | 100% | 213.6 | 13.23 | 37.4 |
| Crag Behemoth | swamp | cadence | boss_killed | 24.6 | 100% | 24.6 | 1.23 | 20.5 |
| Crag Behemoth | swamp | cooldown | boss_killed | 24.8 | 100% | 24.8 | 1.22 | 17.5 |
| Crag Behemoth | swamp | reload | boss_killed | 19.8 | 100% | 19.8 | 1.01 | 23.5 |
| Crag Behemoth | swamp | energy | boss_killed | 24.3 | 100% | 24.3 | 0.68 | 25.5 |
| Crag Behemoth | swamp | dot | bot_died | 21.1 | 87% | 24.3 | 1.26 | 19.0 |
| Crag Behemoth | swamp | summoner | bot_died | 24.6 | 16% | 150.4 | 10.19 | 26.3 |
| Crag Behemoth | mountain | cadence | boss_killed | 21.0 | 100% | 21.0 | 0.74 | 20.3 |
| Crag Behemoth | mountain | cooldown | boss_killed | 19.1 | 100% | 19.1 | 0.58 | 17.2 |
| Crag Behemoth | mountain | reload | boss_killed | 17.1 | 100% | 17.1 | 0.48 | 23.3 |
| Crag Behemoth | mountain | energy | boss_killed | 20.9 | 100% | 20.9 | 0.83 | 25.3 |
| Crag Behemoth | mountain | dot | boss_killed | 19.1 | 100% | 19.1 | 0.63 | 18.8 |
| Crag Behemoth | mountain | summoner | bot_died | 31.6 | 18% | 177.0 | 9.41 | 23.8 |
| Crag Behemoth | cave | cadence | boss_killed | 19.6 | 100% | 19.6 | 1.00 | 20.1 |
| Crag Behemoth | cave | cooldown | boss_killed | 20.7 | 100% | 20.7 | 0.83 | 16.7 |
| Crag Behemoth | cave | reload | boss_killed | 17.0 | 100% | 17.0 | 0.75 | 22.9 |
| Crag Behemoth | cave | energy | boss_killed | 16.2 | 100% | 16.2 | 0.39 | 19.5 |
| Crag Behemoth | cave | dot | boss_killed | 19.3 | 100% | 19.3 | 0.94 | 18.7 |
| Crag Behemoth | cave | summoner | bot_died | 35.1 | 49% | 72.3 | 4.69 | 25.5 |
| Obsidian Broodmother | plains | cadence | boss_killed | 26.9 | 100% | 26.9 | 0.80 | 10.3 |
| Obsidian Broodmother | plains | cooldown | boss_killed | 25.6 | 100% | 25.6 | 0.66 | 8.6 |
| Obsidian Broodmother | plains | reload | boss_killed | 22.6 | 100% | 22.6 | 0.64 | 11.4 |
| Obsidian Broodmother | plains | energy | boss_killed | 25.3 | 100% | 25.3 | 0.23 | 13.9 |
| Obsidian Broodmother | plains | dot | boss_killed | 22.5 | 100% | 22.5 | 0.56 | 9.6 |
| Obsidian Broodmother | plains | summoner | bot_died | 61.7 | 27% | 225.7 | 9.12 | 18.9 |
| Obsidian Broodmother | forest | cadence | boss_killed | 19.9 | 100% | 19.9 | 0.88 | 16.1 |
| Obsidian Broodmother | forest | cooldown | boss_killed | 21.5 | 100% | 21.5 | 0.75 | 13.5 |
| Obsidian Broodmother | forest | reload | boss_killed | 18.6 | 100% | 18.6 | 0.64 | 17.4 |
| Obsidian Broodmother | forest | energy | boss_killed | 18.5 | 100% | 18.5 | 0.35 | 10.4 |
| Obsidian Broodmother | forest | dot | boss_killed | 23.1 | 100% | 23.1 | 0.88 | 15.3 |
| Obsidian Broodmother | forest | summoner | boss_killed | 235.7 | 100% | 235.7 | 13.44 | 29.1 |
| Obsidian Broodmother | swamp | cadence | boss_killed | 23.7 | 100% | 23.7 | 0.91 | 13.3 |
| Obsidian Broodmother | swamp | cooldown | boss_killed | 23.5 | 100% | 23.5 | 0.78 | 11.1 |
| Obsidian Broodmother | swamp | reload | boss_killed | 17.8 | 100% | 17.8 | 0.66 | 14.0 |
| Obsidian Broodmother | swamp | energy | boss_killed | 22.2 | 100% | 22.2 | 0.47 | 17.0 |
| Obsidian Broodmother | swamp | dot | boss_killed | 20.4 | 100% | 20.4 | 0.71 | 11.8 |
| Obsidian Broodmother | swamp | summoner | bot_died | 47.7 | 32% | 149.1 | 7.18 | 21.2 |
| Obsidian Broodmother | mountain | cadence | boss_killed | 19.1 | 100% | 19.1 | 0.40 | 12.6 |
| Obsidian Broodmother | mountain | cooldown | boss_killed | 17.2 | 100% | 17.2 | 0.27 | 10.3 |
| Obsidian Broodmother | mountain | reload | boss_killed | 15.5 | 100% | 15.5 | 0.27 | 13.1 |
| Obsidian Broodmother | mountain | energy | boss_killed | 17.7 | 100% | 17.7 | 0.43 | 16.0 |
| Obsidian Broodmother | mountain | dot | boss_killed | 15.5 | 100% | 15.5 | 0.26 | 10.1 |
| Obsidian Broodmother | mountain | summoner | bot_died | 61.7 | 44% | 138.7 | 5.37 | 20.4 |
| Obsidian Broodmother | cave | cadence | boss_killed | 16.7 | 100% | 16.7 | 0.63 | 13.4 |
| Obsidian Broodmother | cave | cooldown | boss_killed | 17.8 | 100% | 17.8 | 0.64 | 11.6 |
| Obsidian Broodmother | cave | reload | boss_killed | 13.5 | 100% | 13.5 | 0.48 | 14.8 |
| Obsidian Broodmother | cave | energy | boss_killed | 15.4 | 100% | 15.4 | 0.20 | 16.0 |
| Obsidian Broodmother | cave | dot | boss_killed | 14.9 | 100% | 14.9 | 0.60 | 12.6 |
| Obsidian Broodmother | cave | summoner | bot_died | 67.3 | 77% | 87.6 | 4.56 | 21.8 |
| Gnarled Greatbear | plains | cadence | bot_died | 15.8 | 66% | 24.1 | 1.79 | 21.1 |
| Gnarled Greatbear | plains | cooldown | bot_died | 19.3 | 78% | 24.9 | 1.58 | 21.5 |
| Gnarled Greatbear | plains | reload | bot_died | 12.4 | 62% | 20.0 | 1.61 | 17.7 |
| Gnarled Greatbear | plains | energy | bot_died | 14.8 | 64% | 23.3 | 1.57 | 19.4 |
| Gnarled Greatbear | plains | dot | bot_died | 14.8 | 58% | 25.6 | 1.73 | 12.8 |
| Gnarled Greatbear | plains | summoner | bot_died | 16.0 | 55% | 29.1 | 1.82 | 10.4 |
| Gnarled Greatbear | forest | cadence | bot_died | 9.2 | 53% | 17.3 | 2.19 | 23.7 |
| Gnarled Greatbear | forest | cooldown | bot_died | 11.2 | 58% | 19.2 | 2.23 | 19.3 |
| Gnarled Greatbear | forest | reload | bot_died | 9.1 | 54% | 16.7 | 1.96 | 21.3 |
| Gnarled Greatbear | forest | energy | bot_died | 9.2 | 55% | 16.8 | 1.94 | 23.2 |
| Gnarled Greatbear | forest | dot | bot_died | 9.3 | 37% | 24.9 | 2.85 | 22.4 |
| Gnarled Greatbear | forest | summoner | bot_died | 10.7 | 49% | 22.0 | 2.20 | 19.5 |
| Gnarled Greatbear | swamp | cadence | bot_died | 11.7 | 47% | 25.1 | 2.58 | 16.2 |
| Gnarled Greatbear | swamp | cooldown | bot_died | 12.7 | 55% | 23.2 | 2.24 | 13.6 |
| Gnarled Greatbear | swamp | reload | bot_died | 10.5 | 56% | 18.7 | 1.93 | 20.2 |
| Gnarled Greatbear | swamp | energy | bot_died | 11.7 | 50% | 23.4 | 2.19 | 21.9 |
| Gnarled Greatbear | swamp | dot | bot_died | 10.5 | 43% | 24.5 | 2.50 | 16.0 |
| Gnarled Greatbear | swamp | summoner | bot_died | 11.9 | 43% | 27.7 | 2.62 | 14.9 |
| Gnarled Greatbear | mountain | cadence | bot_died | 12.3 | 65% | 18.9 | 1.70 | 19.7 |
| Gnarled Greatbear | mountain | cooldown | bot_died | 13.3 | 66% | 20.1 | 1.69 | 16.7 |
| Gnarled Greatbear | mountain | reload | bot_died | 10.0 | 67% | 14.9 | 1.49 | 23.9 |
| Gnarled Greatbear | mountain | energy | bot_died | 10.5 | 54% | 19.5 | 1.86 | 21.0 |
| Gnarled Greatbear | mountain | dot | bot_died | 11.5 | 55% | 20.9 | 1.82 | 17.0 |
| Gnarled Greatbear | mountain | summoner | bot_died | 11.7 | 53% | 22.2 | 1.89 | 14.0 |
| Gnarled Greatbear | cave | cadence | bot_died | 9.1 | 54% | 16.8 | 2.24 | 20.6 |
| Gnarled Greatbear | cave | cooldown | bot_died | 10.1 | 55% | 18.3 | 2.22 | 19.5 |
| Gnarled Greatbear | cave | reload | bot_died | 8.9 | 65% | 13.6 | 1.70 | 24.5 |
| Gnarled Greatbear | cave | energy | bot_died | 8.2 | 62% | 13.2 | 1.74 | 26.6 |
| Gnarled Greatbear | cave | dot | bot_died | 9.1 | 52% | 17.7 | 2.15 | 20.0 |
| Gnarled Greatbear | cave | summoner | bot_died | 10.1 | 63% | 16.1 | 1.81 | 19.5 |
| Tusked Razorback | plains | cadence | bot_died | 28.7 | 87% | 32.9 | 1.53 | 12.4 |
| Tusked Razorback | plains | cooldown | boss_killed | 36.5 | 100% | 36.5 | 1.49 | 10.7 |
| Tusked Razorback | plains | reload | bot_died | 34.1 | 99% | 34.5 | 1.80 | 14.6 |
| Tusked Razorback | plains | energy | boss_killed | 42.1 | 100% | 42.1 | 1.57 | 16.0 |
| Tusked Razorback | plains | dot | bot_died | 58.3 | 77% | 76.1 | 2.99 | 10.3 |
| Tusked Razorback | plains | summoner | bot_died | 77.1 | 79% | 98.2 | 4.01 | 18.4 |
| Tusked Razorback | forest | cadence | bot_died | 19.5 | 75% | 25.9 | 1.76 | 21.2 |
| Tusked Razorback | forest | cooldown | boss_killed | 26.0 | 100% | 26.0 | 1.50 | 15.3 |
| Tusked Razorback | forest | reload | bot_died | 17.3 | 75% | 23.1 | 1.62 | 19.8 |
| Tusked Razorback | forest | energy | bot_died | 17.5 | 70% | 25.1 | 1.58 | 24.2 |
| Tusked Razorback | forest | dot | bot_died | 17.9 | 52% | 34.2 | 2.16 | 15.3 |
| Tusked Razorback | forest | summoner | bot_died | 35.1 | 50% | 69.7 | 3.64 | 15.0 |
| Tusked Razorback | swamp | cadence | bot_died | 27.7 | 58% | 48.0 | 2.49 | 14.2 |
| Tusked Razorback | swamp | cooldown | boss_killed | 26.7 | 100% | 26.7 | 1.31 | 12.4 |
| Tusked Razorback | swamp | reload | bot_died | 21.1 | 70% | 30.1 | 1.76 | 17.1 |
| Tusked Razorback | swamp | energy | bot_died | 25.1 | 67% | 37.6 | 1.64 | 17.5 |
| Tusked Razorback | swamp | dot | bot_died | 21.3 | 80% | 26.6 | 1.36 | 14.3 |
| Tusked Razorback | swamp | summoner | bot_died | 27.9 | 50% | 55.6 | 2.37 | 9.7 |
| Tusked Razorback | mountain | cadence | bot_died | 28.5 | 52% | 54.5 | 2.43 | 15.1 |
| Tusked Razorback | mountain | cooldown | boss_killed | 28.6 | 100% | 28.6 | 1.13 | 12.8 |
| Tusked Razorback | mountain | reload | boss_killed | 29.8 | 100% | 29.8 | 1.24 | 15.3 |
| Tusked Razorback | mountain | energy | bot_died | 19.5 | 61% | 31.9 | 1.64 | 18.5 |
| Tusked Razorback | mountain | dot | bot_died | 25.1 | 74% | 33.8 | 1.35 | 14.0 |
| Tusked Razorback | mountain | summoner | bot_died | 29.1 | 57% | 50.6 | 1.89 | 11.0 |
| Tusked Razorback | cave | cadence | boss_killed | 20.4 | 100% | 20.4 | 1.36 | 17.3 |
| Tusked Razorback | cave | cooldown | boss_killed | 22.5 | 100% | 22.5 | 1.23 | 13.7 |
| Tusked Razorback | cave | reload | boss_killed | 26.2 | 100% | 26.2 | 1.76 | 21.8 |
| Tusked Razorback | cave | energy | bot_died | 19.1 | 53% | 35.7 | 2.30 | 23.2 |
| Tusked Razorback | cave | dot | bot_died | 17.3 | 88% | 19.6 | 1.34 | 16.9 |
| Tusked Razorback | cave | summoner | bot_died | 22.9 | 75% | 30.5 | 1.81 | 17.1 |
| Grave Toadeater | plains | cadence | boss_killed | 23.9 | 100% | 23.9 | 1.05 | 6.0 |
| Grave Toadeater | plains | cooldown | boss_killed | 23.9 | 100% | 23.9 | 0.92 | 5.3 |
| Grave Toadeater | plains | reload | boss_killed | 19.2 | 100% | 19.2 | 0.65 | 6.3 |
| Grave Toadeater | plains | energy | boss_killed | 22.9 | 100% | 22.9 | 0.38 | 6.9 |
| Grave Toadeater | plains | dot | boss_killed | 22.5 | 100% | 22.5 | 0.73 | 4.7 |
| Grave Toadeater | plains | summoner | bot_died | 27.7 | 47% | 59.2 | 2.92 | 15.7 |
| Grave Toadeater | forest | cadence | boss_killed | 16.1 | 100% | 16.1 | 0.30 | 3.8 |
| Grave Toadeater | forest | cooldown | boss_killed | 16.9 | 100% | 16.9 | 0.28 | 2.9 |
| Grave Toadeater | forest | reload | boss_killed | 15.7 | 100% | 15.7 | 0.24 | 3.4 |
| Grave Toadeater | forest | energy | boss_killed | 15.4 | 100% | 15.4 | 0.02 | 1.8 |
| Grave Toadeater | forest | dot | boss_killed | 22.2 | 100% | 22.2 | 0.35 | 3.6 |
| Grave Toadeater | forest | summoner | boss_killed | 41.3 | 100% | 41.3 | 1.27 | 12.8 |
| Grave Toadeater | swamp | cadence | boss_killed | 20.6 | 100% | 20.6 | 0.57 | 4.3 |
| Grave Toadeater | swamp | cooldown | boss_killed | 20.5 | 100% | 20.5 | 0.51 | 3.8 |
| Grave Toadeater | swamp | reload | boss_killed | 16.0 | 100% | 16.0 | 0.34 | 4.5 |
| Grave Toadeater | swamp | energy | boss_killed | 19.9 | 100% | 19.9 | 0.16 | 4.9 |
| Grave Toadeater | swamp | dot | boss_killed | 20.3 | 100% | 20.3 | 0.50 | 3.6 |
| Grave Toadeater | swamp | summoner | bot_died | 43.7 | 73% | 59.8 | 2.32 | 14.4 |
| Grave Toadeater | mountain | cadence | boss_killed | 19.1 | 100% | 19.1 | 0.42 | 5.4 |
| Grave Toadeater | mountain | cooldown | boss_killed | 15.3 | 100% | 15.3 | 0.18 | 4.8 |
| Grave Toadeater | mountain | reload | boss_killed | 13.8 | 100% | 13.8 | 0.13 | 5.1 |
| Grave Toadeater | mountain | energy | boss_killed | 16.1 | 100% | 16.1 | 0.19 | 6.2 |
| Grave Toadeater | mountain | dot | boss_killed | 15.5 | 100% | 15.5 | 0.12 | 4.2 |
| Grave Toadeater | mountain | summoner | bot_died | 48.7 | 89% | 54.9 | 2.07 | 14.9 |
| Grave Toadeater | cave | cadence | boss_killed | 16.4 | 100% | 16.4 | 0.43 | 5.0 |
| Grave Toadeater | cave | cooldown | boss_killed | 16.5 | 100% | 16.5 | 0.39 | 4.3 |
| Grave Toadeater | cave | reload | boss_killed | 12.2 | 100% | 12.2 | 0.31 | 5.9 |
| Grave Toadeater | cave | energy | boss_killed | 13.8 | 100% | 13.8 | 0.02 | 2.2 |
| Grave Toadeater | cave | dot | boss_killed | 14.7 | 100% | 14.7 | 0.35 | 4.8 |
| Grave Toadeater | cave | summoner | boss_killed | 26.5 | 100% | 26.5 | 1.18 | 16.0 |
