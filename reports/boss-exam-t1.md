# Tier 1 boss exam

Guard stripped, boss woken immediately. 5 armour set(s) x 6 class roots per boss, gear fully upgraded, time-scale 1, cap 180s.

`cost` = health bars the full fight costs (`hp lost/s / pool` x `ttk`). `ttk` is extrapolated from boss HP removed when the fight did not finish. `burst` is the worst single second as a share of the pool.

| boss | biome | win | ttk s | cost bars | hp/s %pool | burst %pool | spike% | attrition% |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Obsidian Broodmother | cave | 0/30 | 186.2 | 13.17 | 6.5 | 24.1 | 0 | 1 |
| Crag Behemoth | mountain | 0/30 | 104.8 | 7.02 | 6.3 | 27.0 | 0 | 2 |
| Gnarled Greatbear | forest | 0/30 | 57.0 | 5.02 | 8.9 | 15.5 | 0 | 0 |
| Tusked Razorback | plains | 0/30 | 79.0 | 4.76 | 6.3 | 16.0 | 0 | 0 |
| Grave Toadeater | swamp | 0/30 | 73.0 | 4.09 | 5.5 | 11.0 | 0 | 88 |

## Per class root (cost bars)

| boss | cadence | cooldown | reload | energy | dot | summoner |
|---|---:|---:|---:|---:|---:|---:|
| Obsidian Broodmother | 3.99 | 3.90 | 3.79 | 3.58 | 3.67 | 60.11 |
| Crag Behemoth | 3.29 | 3.20 | 3.50 | 3.42 | 3.72 | 25.02 |
| Gnarled Greatbear | 5.04 | 4.84 | 4.97 | 4.90 | 5.54 | 4.84 |
| Tusked Razorback | 3.50 | 3.94 | 4.07 | 3.89 | 4.36 | 8.80 |
| Grave Toadeater | 3.31 | 3.47 | 2.54 | 3.13 | 2.97 | 9.11 |

## Per armour set (cost bars)

| boss | plains | forest | swamp | mountain | cave |
|---|---:|---:|---:|---:|---:|
| Obsidian Broodmother | 17.22 | 19.67 | 16.55 | 6.93 | 5.49 |
| Crag Behemoth | 7.92 | 6.96 | 8.24 | 7.28 | 4.72 |
| Gnarled Greatbear | 4.58 | 5.30 | 6.43 | 4.82 | 3.99 |
| Tusked Razorback | 5.57 | 5.22 | 6.48 | 3.74 | 2.78 |
| Grave Toadeater | 5.50 | 4.00 | 4.29 | 3.71 | 2.94 |

## Every fight

| boss | gear | class | outcome | elapsed s | boss hp removed | ttk s | cost bars | burst %pool |
|---|---|---|---|---:|---:|---:|---:|---:|
| Crag Behemoth | plains | cadence | bot_died | 21.1 | 33% | 64.7 | 3.89 | 23.8 |
| Crag Behemoth | plains | cooldown | bot_died | 24.6 | 34% | 72.7 | 3.68 | 19.8 |
| Crag Behemoth | plains | reload | bot_died | 17.6 | 27% | 65.9 | 3.74 | 28.2 |
| Crag Behemoth | plains | energy | bot_died | 17.6 | 27% | 64.7 | 3.68 | 29.4 |
| Crag Behemoth | plains | dot | bot_died | 17.6 | 25% | 69.1 | 3.93 | 24.3 |
| Crag Behemoth | plains | summoner | bot_died | 17.6 | 5% | 381.0 | 28.61 | 28.9 |
| Crag Behemoth | forest | cadence | bot_died | 21.1 | 50% | 42.6 | 2.70 | 26.6 |
| Crag Behemoth | forest | cooldown | bot_died | 24.6 | 43% | 56.6 | 3.01 | 24.0 |
| Crag Behemoth | forest | reload | bot_died | 14.1 | 25% | 56.9 | 4.04 | 32.0 |
| Crag Behemoth | forest | energy | bot_died | 14.1 | 32% | 44.6 | 3.16 | 33.3 |
| Crag Behemoth | forest | dot | bot_died | 14.1 | 22% | 64.7 | 4.59 | 27.6 |
| Crag Behemoth | forest | summoner | bot_died | 21.1 | 6% | 340.8 | 24.30 | 31.9 |
| Crag Behemoth | swamp | cadence | bot_died | 28.1 | 47% | 59.5 | 4.10 | 26.0 |
| Crag Behemoth | swamp | cooldown | bot_died | 31.6 | 48% | 65.8 | 3.80 | 22.4 |
| Crag Behemoth | swamp | reload | bot_died | 21.1 | 35% | 59.9 | 3.76 | 29.8 |
| Crag Behemoth | swamp | energy | bot_died | 17.6 | 33% | 53.3 | 3.71 | 31.0 |
| Crag Behemoth | swamp | dot | bot_died | 17.6 | 28% | 62.4 | 4.35 | 25.8 |
| Crag Behemoth | swamp | summoner | bot_died | 24.6 | 6% | 388.4 | 29.71 | 30.3 |
| Crag Behemoth | mountain | cadence | bot_died | 21.1 | 39% | 54.6 | 3.29 | 25.1 |
| Crag Behemoth | mountain | cooldown | bot_died | 24.6 | 42% | 58.9 | 2.98 | 21.1 |
| Crag Behemoth | mountain | reload | bot_died | 17.6 | 33% | 53.0 | 3.01 | 28.8 |
| Crag Behemoth | mountain | energy | bot_died | 14.1 | 24% | 58.3 | 4.13 | 29.9 |
| Crag Behemoth | mountain | dot | bot_died | 17.6 | 33% | 53.0 | 3.01 | 24.9 |
| Crag Behemoth | mountain | summoner | bot_died | 21.1 | 5% | 410.3 | 27.28 | 30.0 |
| Crag Behemoth | cave | cadence | bot_died | 24.6 | 59% | 41.4 | 2.48 | 24.3 |
| Crag Behemoth | cave | cooldown | bot_died | 28.1 | 58% | 48.8 | 2.54 | 20.9 |
| Crag Behemoth | cave | reload | bot_died | 17.6 | 37% | 47.4 | 2.95 | 28.2 |
| Crag Behemoth | cave | energy | bot_died | 17.6 | 45% | 39.0 | 2.41 | 29.4 |
| Crag Behemoth | cave | dot | bot_died | 17.6 | 40% | 44.1 | 2.72 | 24.3 |
| Crag Behemoth | cave | summoner | bot_died | 24.6 | 11% | 220.8 | 15.21 | 29.3 |
| Obsidian Broodmother | plains | cadence | bot_died | 19.7 | 25% | 78.0 | 4.96 | 21.3 |
| Obsidian Broodmother | plains | cooldown | bot_died | 22.5 | 25% | 89.5 | 4.88 | 18.7 |
| Obsidian Broodmother | plains | reload | bot_died | 16.9 | 22% | 75.4 | 4.46 | 24.2 |
| Obsidian Broodmother | plains | energy | bot_died | 16.9 | 23% | 73.9 | 4.38 | 25.2 |
| Obsidian Broodmother | plains | dot | bot_died | 16.9 | 26% | 65.7 | 3.89 | 21.4 |
| Obsidian Broodmother | plains | summoner | bot_died | 19.7 | 2% | 1149.2 | 80.73 | 25.5 |
| Obsidian Broodmother | forest | cadence | bot_died | 19.7 | 38% | 52.2 | 3.49 | 24.9 |
| Obsidian Broodmother | forest | cooldown | bot_died | 22.5 | 33% | 67.4 | 3.85 | 21.4 |
| Obsidian Broodmother | forest | reload | bot_died | 16.9 | 30% | 57.1 | 3.38 | 27.5 |
| Obsidian Broodmother | forest | energy | bot_died | 16.9 | 33% | 50.8 | 3.01 | 28.6 |
| Obsidian Broodmother | forest | dot | bot_died | 14.1 | 21% | 66.2 | 4.69 | 23.7 |
| Obsidian Broodmother | forest | summoner | bot_died | 19.7 | 1% | 1326.0 | 99.62 | 28.6 |
| Obsidian Broodmother | swamp | cadence | bot_died | 25.3 | 37% | 68.2 | 4.90 | 23.7 |
| Obsidian Broodmother | swamp | cooldown | bot_died | 28.1 | 37% | 75.9 | 4.88 | 20.9 |
| Obsidian Broodmother | swamp | reload | bot_died | 16.9 | 24% | 70.4 | 5.09 | 26.1 |
| Obsidian Broodmother | swamp | energy | bot_died | 16.9 | 27% | 62.1 | 4.49 | 27.7 |
| Obsidian Broodmother | swamp | dot | bot_died | 16.9 | 28% | 60.9 | 4.40 | 23.1 |
| Obsidian Broodmother | swamp | summoner | bot_died | 25.3 | 3% | 983.9 | 75.55 | 27.5 |
| Obsidian Broodmother | mountain | cadence | bot_died | 19.7 | 35% | 56.7 | 3.60 | 22.9 |
| Obsidian Broodmother | mountain | cooldown | bot_died | 22.5 | 38% | 59.8 | 3.26 | 19.6 |
| Obsidian Broodmother | mountain | reload | bot_died | 16.9 | 32% | 52.8 | 3.13 | 25.2 |
| Obsidian Broodmother | mountain | energy | bot_died | 16.9 | 31% | 54.1 | 3.20 | 26.8 |
| Obsidian Broodmother | mountain | dot | bot_died | 16.9 | 34% | 49.4 | 2.92 | 22.3 |
| Obsidian Broodmother | mountain | summoner | bot_died | 19.7 | 5% | 362.9 | 25.49 | 27.0 |
| Obsidian Broodmother | cave | cadence | bot_died | 19.7 | 47% | 42.2 | 2.99 | 22.3 |
| Obsidian Broodmother | cave | cooldown | bot_died | 25.3 | 54% | 46.8 | 2.64 | 19.8 |
| Obsidian Broodmother | cave | reload | bot_died | 16.9 | 38% | 44.8 | 2.90 | 24.2 |
| Obsidian Broodmother | cave | energy | bot_died | 16.9 | 38% | 43.9 | 2.83 | 25.9 |
| Obsidian Broodmother | cave | dot | bot_died | 16.9 | 44% | 38.4 | 2.46 | 21.4 |
| Obsidian Broodmother | cave | summoner | bot_died | 22.5 | 9% | 260.8 | 19.14 | 26.1 |
| Gnarled Greatbear | plains | cadence | bot_died | 17.4 | 28% | 62.5 | 4.44 | 9.8 |
| Gnarled Greatbear | plains | cooldown | bot_died | 25.1 | 36% | 70.0 | 3.51 | 6.5 |
| Gnarled Greatbear | plains | reload | bot_died | 13.2 | 22% | 61.1 | 4.63 | 13.4 |
| Gnarled Greatbear | plains | energy | bot_died | 13.2 | 21% | 62.7 | 4.75 | 14.0 |
| Gnarled Greatbear | plains | dot | bot_died | 14.2 | 21% | 68.8 | 4.84 | 10.4 |
| Gnarled Greatbear | plains | summoner | bot_died | 15.4 | 19% | 81.3 | 5.28 | 9.3 |
| Gnarled Greatbear | forest | cadence | bot_died | 10.7 | 25% | 42.3 | 4.69 | 18.9 |
| Gnarled Greatbear | forest | cooldown | bot_died | 13.0 | 23% | 57.0 | 5.08 | 14.9 |
| Gnarled Greatbear | forest | reload | bot_died | 10.8 | 20% | 53.5 | 4.95 | 22.2 |
| Gnarled Greatbear | forest | energy | bot_died | 9.6 | 22% | 43.2 | 4.50 | 23.1 |
| Gnarled Greatbear | forest | dot | bot_died | 9.5 | 14% | 66.7 | 7.02 | 19.2 |
| Gnarled Greatbear | forest | summoner | bot_died | 10.8 | 18% | 60.0 | 5.56 | 15.6 |
| Gnarled Greatbear | swamp | cadence | bot_died | 11.9 | 18% | 64.7 | 7.41 | 16.9 |
| Gnarled Greatbear | swamp | cooldown | bot_died | 15.2 | 22% | 69.9 | 6.44 | 13.2 |
| Gnarled Greatbear | swamp | reload | bot_died | 12.1 | 20% | 61.4 | 6.24 | 19.9 |
| Gnarled Greatbear | swamp | energy | bot_died | 11.0 | 18% | 59.8 | 6.19 | 20.6 |
| Gnarled Greatbear | swamp | dot | bot_died | 12.0 | 19% | 64.2 | 6.58 | 16.1 |
| Gnarled Greatbear | swamp | summoner | bot_died | 14.3 | 22% | 64.6 | 5.71 | 13.6 |
| Gnarled Greatbear | mountain | cadence | bot_died | 13.0 | 25% | 52.4 | 4.71 | 15.6 |
| Gnarled Greatbear | mountain | cooldown | bot_died | 15.2 | 24% | 64.3 | 4.80 | 12.0 |
| Gnarled Greatbear | mountain | reload | bot_died | 12.0 | 23% | 52.5 | 4.38 | 18.4 |
| Gnarled Greatbear | mountain | energy | bot_died | 11.0 | 19% | 57.7 | 5.25 | 19.1 |
| Gnarled Greatbear | mountain | dot | bot_died | 11.0 | 20% | 55.6 | 5.05 | 16.0 |
| Gnarled Greatbear | mountain | summoner | bot_died | 13.2 | 21% | 62.3 | 4.72 | 12.2 |
| Gnarled Greatbear | cave | cadence | bot_died | 13.0 | 33% | 39.8 | 3.95 | 15.4 |
| Gnarled Greatbear | cave | cooldown | bot_died | 14.1 | 29% | 49.0 | 4.35 | 12.8 |
| Gnarled Greatbear | cave | reload | bot_died | 10.8 | 23% | 46.8 | 4.67 | 18.4 |
| Gnarled Greatbear | cave | energy | bot_died | 10.9 | 28% | 38.4 | 3.79 | 19.1 |
| Gnarled Greatbear | cave | dot | bot_died | 10.8 | 25% | 42.8 | 4.23 | 15.8 |
| Gnarled Greatbear | cave | summoner | bot_died | 13.2 | 38% | 34.7 | 2.96 | 13.0 |
| Tusked Razorback | plains | cadence | bot_died | 26.1 | 38% | 68.7 | 3.77 | 11.8 |
| Tusked Razorback | plains | cooldown | bot_died | 50.1 | 49% | 101.5 | 4.26 | 9.7 |
| Tusked Razorback | plains | reload | bot_died | 22.1 | 32% | 68.4 | 4.45 | 14.8 |
| Tusked Razorback | plains | energy | bot_died | 22.1 | 31% | 71.2 | 4.03 | 15.4 |
| Tusked Razorback | plains | dot | bot_died | 28.1 | 29% | 97.1 | 5.04 | 12.2 |
| Tusked Razorback | plains | summoner | bot_died | 50.1 | 19% | 260.5 | 11.90 | 11.4 |
| Tusked Razorback | forest | cadence | bot_died | 16.1 | 40% | 40.2 | 3.17 | 18.9 |
| Tusked Razorback | forest | cooldown | bot_died | 20.1 | 26% | 77.8 | 4.85 | 16.0 |
| Tusked Razorback | forest | reload | bot_died | 14.1 | 27% | 52.3 | 3.71 | 20.3 |
| Tusked Razorback | forest | energy | bot_died | 14.1 | 33% | 43.0 | 3.05 | 21.8 |
| Tusked Razorback | forest | dot | bot_died | 14.3 | 23% | 62.8 | 4.39 | 17.5 |
| Tusked Razorback | forest | summoner | bot_died | 16.1 | 8% | 195.5 | 12.14 | 16.2 |
| Tusked Razorback | swamp | cadence | bot_died | 20.1 | 34% | 58.7 | 4.72 | 19.2 |
| Tusked Razorback | swamp | cooldown | bot_died | 28.1 | 35% | 79.4 | 4.99 | 14.6 |
| Tusked Razorback | swamp | reload | bot_died | 18.1 | 27% | 66.2 | 5.01 | 19.3 |
| Tusked Razorback | swamp | energy | bot_died | 14.1 | 25% | 57.2 | 4.63 | 19.4 |
| Tusked Razorback | swamp | dot | bot_died | 20.1 | 20% | 101.7 | 6.86 | 16.6 |
| Tusked Razorback | swamp | summoner | bot_died | 24.1 | 11% | 217.9 | 12.71 | 14.8 |
| Tusked Razorback | mountain | cadence | bot_died | 19.1 | 37% | 51.6 | 3.25 | 15.2 |
| Tusked Razorback | mountain | cooldown | bot_died | 28.1 | 45% | 62.2 | 2.76 | 11.3 |
| Tusked Razorback | mountain | reload | bot_died | 16.1 | 28% | 58.4 | 3.94 | 19.0 |
| Tusked Razorback | mountain | energy | bot_died | 16.1 | 20% | 78.6 | 4.89 | 17.8 |
| Tusked Razorback | mountain | dot | bot_died | 16.1 | 34% | 47.8 | 2.97 | 17.5 |
| Tusked Razorback | mountain | summoner | bot_died | 22.1 | 22% | 98.4 | 4.64 | 12.8 |
| Tusked Razorback | cave | cadence | bot_died | 17.9 | 51% | 34.9 | 2.59 | 14.7 |
| Tusked Razorback | cave | cooldown | bot_died | 24.1 | 48% | 50.6 | 2.85 | 12.3 |
| Tusked Razorback | cave | reload | bot_died | 14.1 | 33% | 42.2 | 3.24 | 17.7 |
| Tusked Razorback | cave | energy | bot_died | 14.3 | 37% | 38.3 | 2.87 | 21.0 |
| Tusked Razorback | cave | dot | bot_died | 18.1 | 43% | 41.8 | 2.53 | 15.6 |
| Tusked Razorback | cave | summoner | bot_died | 20.1 | 44% | 45.6 | 2.61 | 16.0 |
| Grave Toadeater | plains | cadence | bot_died | 18.7 | 27% | 70.3 | 4.47 | 10.4 |
| Grave Toadeater | plains | cooldown | bot_died | 19.7 | 25% | 80.3 | 4.78 | 9.3 |
| Grave Toadeater | plains | reload | bot_died | 21.1 | 30% | 69.7 | 3.30 | 8.7 |
| Grave Toadeater | plains | energy | bot_died | 16.7 | 23% | 71.1 | 4.26 | 11.9 |
| Grave Toadeater | plains | dot | bot_died | 17.7 | 24% | 74.2 | 4.19 | 9.0 |
| Grave Toadeater | plains | summoner | bot_died | 17.7 | 10% | 184.9 | 12.03 | 11.1 |
| Grave Toadeater | forest | cadence | bot_died | 24.7 | 53% | 46.5 | 2.58 | 12.4 |
| Grave Toadeater | forest | cooldown | bot_died | 25.7 | 43% | 59.9 | 3.03 | 10.5 |
| Grave Toadeater | forest | reload | bot_died | 31.0 | 53% | 58.9 | 1.90 | 9.2 |
| Grave Toadeater | forest | energy | bot_died | 19.7 | 43% | 46.2 | 2.34 | 15.0 |
| Grave Toadeater | forest | dot | bot_died | 21.7 | 34% | 64.6 | 2.98 | 10.9 |
| Grave Toadeater | forest | summoner | bot_died | 22.7 | 12% | 192.2 | 11.19 | 12.7 |
| Grave Toadeater | swamp | cadence | bot_died | 37.7 | 61% | 61.6 | 3.47 | 8.5 |
| Grave Toadeater | swamp | cooldown | bot_died | 39.7 | 57% | 69.7 | 3.44 | 7.9 |
| Grave Toadeater | swamp | reload | bot_died | 39.3 | 67% | 59.0 | 2.39 | 9.3 |
| Grave Toadeater | swamp | energy | bot_died | 23.7 | 42% | 56.8 | 3.05 | 10.3 |
| Grave Toadeater | swamp | dot | bot_died | 33.7 | 57% | 58.9 | 2.60 | 7.1 |
| Grave Toadeater | swamp | summoner | bot_died | 30.7 | 18% | 174.7 | 10.78 | 17.4 |
| Grave Toadeater | mountain | cadence | bot_died | 20.7 | 37% | 56.6 | 3.32 | 10.6 |
| Grave Toadeater | mountain | cooldown | bot_died | 22.7 | 37% | 61.9 | 3.18 | 8.5 |
| Grave Toadeater | mountain | reload | bot_died | 22.1 | 38% | 58.2 | 2.63 | 9.8 |
| Grave Toadeater | mountain | energy | bot_died | 16.7 | 30% | 55.1 | 3.30 | 12.7 |
| Grave Toadeater | mountain | dot | bot_died | 19.7 | 36% | 54.1 | 2.75 | 9.2 |
| Grave Toadeater | mountain | summoner | bot_died | 17.7 | 16% | 108.7 | 7.05 | 21.5 |
| Grave Toadeater | cave | cadence | bot_died | 19.7 | 46% | 42.9 | 2.70 | 10.7 |
| Grave Toadeater | cave | cooldown | bot_died | 20.7 | 41% | 50.5 | 2.94 | 9.5 |
| Grave Toadeater | cave | reload | bot_died | 20.1 | 40% | 50.1 | 2.49 | 9.9 |
| Grave Toadeater | cave | energy | bot_died | 16.7 | 37% | 44.7 | 2.68 | 13.0 |
| Grave Toadeater | cave | dot | bot_died | 18.3 | 43% | 42.5 | 2.32 | 9.8 |
| Grave Toadeater | cave | summoner | bot_died | 16.7 | 25% | 66.2 | 4.52 | 12.2 |
