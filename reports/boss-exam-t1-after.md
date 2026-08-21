# Tier 1 boss exam

Guard stripped, boss woken immediately. 5 armour set(s) x 6 class roots per boss, gear fully upgraded, time-scale 1, cap 240s.

`cost` = health bars the full fight costs (`hp lost/s / pool` x `ttk`). `ttk` is extrapolated from boss HP removed when the fight did not finish. `burst` is the worst single second as a share of the pool.

| boss | biome | win | ttk s | cost bars | hp/s %pool | burst %pool | spike% | attrition% |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Obsidian Broodmother | cave | 15/30 | 76.6 | 3.89 | 4.2 | 18.4 | 0 | 4 |
| Crag Behemoth | mountain | 16/30 | 64.7 | 3.19 | 4.2 | 20.5 | 0 | 4 |
| Grave Toadeater | swamp | 14/30 | 39.9 | 1.81 | 4.2 | 8.7 | 0 | 93 |
| Tusked Razorback | plains | 22/30 | 40.7 | 1.40 | 3.6 | 12.1 | 0 | 1 |
| Gnarled Greatbear | forest | 14/30 | 30.3 | 1.18 | 4.2 | 7.8 | 0 | 0 |

## Per class root (cost bars)

| boss | cadence | cooldown | reload | energy | dot | summoner |
|---|---:|---:|---:|---:|---:|---:|
| Obsidian Broodmother | 1.57 | 1.29 | 1.16 | 0.99 | 1.23 | 17.11 |
| Crag Behemoth | 1.51 | 1.24 | 1.27 | 0.86 | 1.37 | 12.91 |
| Grave Toadeater | 1.74 | 1.48 | 0.92 | 1.02 | 1.33 | 4.36 |
| Tusked Razorback | 1.29 | 1.04 | 1.25 | 1.04 | 1.53 | 2.27 |
| Gnarled Greatbear | 1.25 | 1.01 | 1.12 | 1.06 | 1.36 | 1.29 |

## Per armour set (cost bars)

| boss | plains | forest | swamp | mountain | cave |
|---|---:|---:|---:|---:|---:|
| Obsidian Broodmother | 4.90 | 5.73 | 3.98 | 2.51 | 2.35 |
| Crag Behemoth | 4.04 | 3.97 | 2.73 | 2.88 | 2.35 |
| Grave Toadeater | 2.91 | 1.09 | 1.92 | 1.56 | 1.55 |
| Tusked Razorback | 1.47 | 1.57 | 1.60 | 0.94 | 1.44 |
| Gnarled Greatbear | 0.22 | 1.87 | 1.27 | 0.65 | 1.90 |

## Every fight

| boss | gear | class | outcome | elapsed s | boss hp removed | ttk s | cost bars | burst %pool |
|---|---|---|---|---:|---:|---:|---:|---:|
| Crag Behemoth | plains | cadence | bot_died | 31.6 | 74% | 42.8 | 1.84 | 16.4 |
| Crag Behemoth | plains | cooldown | bot_died | 38.6 | 95% | 40.8 | 1.56 | 13.4 |
| Crag Behemoth | plains | reload | bot_died | 21.1 | 58% | 36.2 | 1.72 | 19.0 |
| Crag Behemoth | plains | energy | bot_died | 38.6 | 96% | 40.0 | 1.04 | 20.8 |
| Crag Behemoth | plains | dot | bot_died | 24.6 | 62% | 39.9 | 1.62 | 15.5 |
| Crag Behemoth | plains | summoner | bot_died | 31.6 | 11% | 297.6 | 16.48 | 23.5 |
| Crag Behemoth | forest | cadence | boss_killed | 28.9 | 100% | 28.9 | 1.35 | 22.2 |
| Crag Behemoth | forest | cooldown | boss_killed | 30.5 | 100% | 30.5 | 1.23 | 18.9 |
| Crag Behemoth | forest | reload | boss_killed | 28.6 | 100% | 28.6 | 1.19 | 25.3 |
| Crag Behemoth | forest | energy | boss_killed | 27.4 | 100% | 27.4 | 0.70 | 27.4 |
| Crag Behemoth | forest | dot | bot_died | 31.6 | 83% | 37.9 | 1.55 | 20.5 |
| Crag Behemoth | forest | summoner | timeout | 240.0 | 82% | 292.5 | 17.82 | 35.1 |
| Crag Behemoth | swamp | cadence | bot_died | 28.1 | 79% | 35.5 | 1.83 | 18.9 |
| Crag Behemoth | swamp | cooldown | boss_killed | 34.8 | 100% | 34.8 | 1.39 | 15.5 |
| Crag Behemoth | swamp | reload | bot_died | 21.1 | 74% | 28.5 | 1.47 | 21.3 |
| Crag Behemoth | swamp | energy | boss_killed | 34.2 | 100% | 34.2 | 0.95 | 23.1 |
| Crag Behemoth | swamp | dot | bot_died | 24.6 | 69% | 35.4 | 1.59 | 17.6 |
| Crag Behemoth | swamp | summoner | bot_died | 31.6 | 21% | 154.0 | 9.15 | 25.2 |
| Crag Behemoth | mountain | cadence | boss_killed | 30.5 | 100% | 30.5 | 1.07 | 18.7 |
| Crag Behemoth | mountain | cooldown | boss_killed | 28.6 | 100% | 28.6 | 0.80 | 15.2 |
| Crag Behemoth | mountain | reload | boss_killed | 25.9 | 100% | 25.9 | 0.90 | 21.0 |
| Crag Behemoth | mountain | energy | boss_killed | 28.9 | 100% | 28.9 | 0.95 | 22.8 |
| Crag Behemoth | mountain | dot | boss_killed | 26.7 | 100% | 26.7 | 0.85 | 17.4 |
| Crag Behemoth | mountain | summoner | bot_died | 31.6 | 13% | 241.3 | 12.68 | 21.5 |
| Crag Behemoth | cave | cadence | boss_killed | 28.6 | 100% | 28.6 | 1.47 | 18.6 |
| Crag Behemoth | cave | cooldown | boss_killed | 29.7 | 100% | 29.7 | 1.22 | 15.3 |
| Crag Behemoth | cave | reload | boss_killed | 24.2 | 100% | 24.2 | 1.10 | 20.8 |
| Crag Behemoth | cave | energy | boss_killed | 25.0 | 100% | 25.0 | 0.67 | 22.5 |
| Crag Behemoth | cave | dot | boss_killed | 26.8 | 100% | 26.8 | 1.22 | 17.3 |
| Crag Behemoth | cave | summoner | bot_died | 66.6 | 42% | 157.9 | 8.42 | 24.6 |
| Obsidian Broodmother | plains | cadence | bot_died | 33.7 | 74% | 45.4 | 1.88 | 14.6 |
| Obsidian Broodmother | plains | cooldown | boss_killed | 42.4 | 100% | 42.4 | 1.48 | 11.8 |
| Obsidian Broodmother | plains | reload | bot_died | 25.3 | 70% | 35.9 | 1.42 | 16.5 |
| Obsidian Broodmother | plains | energy | bot_died | 39.3 | 94% | 42.0 | 1.07 | 18.8 |
| Obsidian Broodmother | plains | dot | bot_died | 28.1 | 79% | 35.5 | 1.26 | 13.9 |
| Obsidian Broodmother | plains | summoner | bot_died | 30.9 | 8% | 394.7 | 22.29 | 20.2 |
| Obsidian Broodmother | forest | cadence | boss_killed | 31.1 | 100% | 31.1 | 1.46 | 20.6 |
| Obsidian Broodmother | forest | cooldown | boss_killed | 32.7 | 100% | 32.7 | 1.37 | 17.4 |
| Obsidian Broodmother | forest | reload | bot_died | 28.1 | 94% | 29.9 | 1.31 | 21.9 |
| Obsidian Broodmother | forest | energy | boss_killed | 29.9 | 100% | 29.9 | 1.00 | 25.6 |
| Obsidian Broodmother | forest | dot | bot_died | 28.1 | 76% | 37.1 | 1.61 | 17.7 |
| Obsidian Broodmother | forest | summoner | timeout | 240.0 | 52% | 459.0 | 27.63 | 26.5 |
| Obsidian Broodmother | swamp | cadence | bot_died | 28.1 | 75% | 37.4 | 1.95 | 17.1 |
| Obsidian Broodmother | swamp | cooldown | boss_killed | 35.9 | 100% | 35.9 | 1.43 | 14.0 |
| Obsidian Broodmother | swamp | reload | bot_died | 25.3 | 89% | 28.5 | 1.26 | 18.4 |
| Obsidian Broodmother | swamp | energy | boss_killed | 35.2 | 100% | 35.2 | 1.05 | 21.2 |
| Obsidian Broodmother | swamp | dot | bot_died | 25.3 | 76% | 33.2 | 1.46 | 16.2 |
| Obsidian Broodmother | swamp | summoner | bot_died | 33.7 | 12% | 284.9 | 16.70 | 22.3 |
| Obsidian Broodmother | mountain | cadence | boss_killed | 30.5 | 100% | 30.5 | 1.09 | 16.8 |
| Obsidian Broodmother | mountain | cooldown | boss_killed | 28.6 | 100% | 28.6 | 0.85 | 14.2 |
| Obsidian Broodmother | mountain | reload | boss_killed | 25.1 | 100% | 25.1 | 0.73 | 18.2 |
| Obsidian Broodmother | mountain | energy | bot_died | 28.1 | 95% | 29.7 | 1.06 | 20.4 |
| Obsidian Broodmother | mountain | dot | boss_killed | 24.5 | 100% | 24.5 | 0.72 | 15.5 |
| Obsidian Broodmother | mountain | summoner | bot_died | 36.5 | 17% | 219.5 | 10.60 | 22.2 |
| Obsidian Broodmother | cave | cadence | boss_killed | 28.7 | 100% | 28.7 | 1.50 | 17.5 |
| Obsidian Broodmother | cave | cooldown | boss_killed | 28.8 | 100% | 28.8 | 1.30 | 14.4 |
| Obsidian Broodmother | cave | reload | boss_killed | 24.3 | 100% | 24.3 | 1.10 | 19.0 |
| Obsidian Broodmother | cave | energy | boss_killed | 25.0 | 100% | 25.0 | 0.79 | 21.1 |
| Obsidian Broodmother | cave | dot | boss_killed | 23.9 | 100% | 23.9 | 1.09 | 15.5 |
| Obsidian Broodmother | cave | summoner | bot_died | 44.9 | 32% | 138.6 | 8.33 | 23.9 |
| Gnarled Greatbear | plains | cadence | boss_killed | 39.3 | 100% | 39.3 | 0.38 | 1.2 |
| Gnarled Greatbear | plains | cooldown | boss_killed | 37.9 | 100% | 37.9 | 0.32 | 0.9 |
| Gnarled Greatbear | plains | reload | boss_killed | 32.5 | 100% | 32.5 | 0.28 | 1.3 |
| Gnarled Greatbear | plains | energy | boss_killed | 37.3 | 100% | 37.3 | 0.00 | 0.0 |
| Gnarled Greatbear | plains | dot | boss_killed | 36.0 | 100% | 36.0 | 0.34 | 1.1 |
| Gnarled Greatbear | plains | summoner | boss_killed | 47.7 | 100% | 47.7 | 0.00 | 0.0 |
| Gnarled Greatbear | forest | cadence | bot_died | 19.1 | 73% | 26.2 | 1.86 | 11.9 |
| Gnarled Greatbear | forest | cooldown | boss_killed | 27.3 | 100% | 27.3 | 1.70 | 10.5 |
| Gnarled Greatbear | forest | reload | bot_died | 18.2 | 68% | 26.9 | 1.68 | 11.2 |
| Gnarled Greatbear | forest | energy | bot_died | 18.1 | 73% | 24.9 | 1.56 | 15.9 |
| Gnarled Greatbear | forest | dot | bot_died | 17.4 | 48% | 36.4 | 2.37 | 11.4 |
| Gnarled Greatbear | forest | summoner | bot_died | 18.5 | 55% | 33.8 | 2.08 | 10.3 |
| Gnarled Greatbear | swamp | cadence | boss_killed | 31.4 | 100% | 31.4 | 1.29 | 6.4 |
| Gnarled Greatbear | swamp | cooldown | boss_killed | 31.4 | 100% | 31.4 | 1.01 | 4.7 |
| Gnarled Greatbear | swamp | reload | bot_died | 23.2 | 92% | 25.3 | 1.21 | 8.9 |
| Gnarled Greatbear | swamp | energy | bot_died | 29.5 | 93% | 31.6 | 1.18 | 9.7 |
| Gnarled Greatbear | swamp | dot | bot_died | 26.3 | 79% | 33.2 | 1.40 | 6.6 |
| Gnarled Greatbear | swamp | summoner | bot_died | 27.7 | 76% | 36.6 | 1.53 | 6.8 |
| Gnarled Greatbear | mountain | cadence | boss_killed | 28.6 | 100% | 28.6 | 0.67 | 5.5 |
| Gnarled Greatbear | mountain | cooldown | boss_killed | 26.7 | 100% | 26.7 | 0.25 | 3.8 |
| Gnarled Greatbear | mountain | reload | boss_killed | 23.4 | 100% | 23.4 | 0.66 | 8.0 |
| Gnarled Greatbear | mountain | energy | boss_killed | 27.3 | 100% | 27.3 | 0.70 | 8.6 |
| Gnarled Greatbear | mountain | dot | boss_killed | 24.8 | 100% | 24.8 | 0.62 | 5.8 |
| Gnarled Greatbear | mountain | summoner | bot_died | 34.5 | 99% | 34.8 | 1.01 | 5.8 |
| Gnarled Greatbear | cave | cadence | bot_died | 17.0 | 69% | 24.8 | 2.04 | 12.3 |
| Gnarled Greatbear | cave | cooldown | bot_died | 23.1 | 88% | 26.2 | 1.78 | 10.2 |
| Gnarled Greatbear | cave | reload | bot_died | 13.8 | 67% | 20.6 | 1.77 | 14.9 |
| Gnarled Greatbear | cave | energy | bot_died | 14.8 | 63% | 23.6 | 1.87 | 16.0 |
| Gnarled Greatbear | cave | dot | bot_died | 16.0 | 59% | 27.4 | 2.08 | 12.2 |
| Gnarled Greatbear | cave | summoner | bot_died | 16.1 | 66% | 24.4 | 1.85 | 10.7 |
| Tusked Razorback | plains | cadence | boss_killed | 39.3 | 100% | 39.3 | 1.17 | 7.7 |
| Tusked Razorback | plains | cooldown | boss_killed | 35.1 | 100% | 35.1 | 0.86 | 6.0 |
| Tusked Razorback | plains | reload | boss_killed | 47.2 | 100% | 47.2 | 1.38 | 8.2 |
| Tusked Razorback | plains | energy | boss_killed | 38.5 | 100% | 38.5 | 0.54 | 9.7 |
| Tusked Razorback | plains | dot | boss_killed | 77.7 | 100% | 77.7 | 2.06 | 6.7 |
| Tusked Razorback | plains | summoner | boss_killed | 94.9 | 100% | 94.9 | 2.82 | 15.2 |
| Tusked Razorback | forest | cadence | boss_killed | 35.7 | 100% | 35.7 | 1.52 | 13.4 |
| Tusked Razorback | forest | cooldown | boss_killed | 28.1 | 100% | 28.1 | 1.14 | 11.2 |
| Tusked Razorback | forest | reload | boss_killed | 28.6 | 100% | 28.6 | 1.34 | 15.5 |
| Tusked Razorback | forest | energy | boss_killed | 34.0 | 100% | 34.0 | 0.80 | 17.7 |
| Tusked Razorback | forest | dot | bot_died | 25.3 | 67% | 37.6 | 1.77 | 13.8 |
| Tusked Razorback | forest | summoner | boss_killed | 63.8 | 100% | 63.8 | 2.83 | 19.5 |
| Tusked Razorback | swamp | cadence | boss_killed | 32.6 | 100% | 32.6 | 1.42 | 10.6 |
| Tusked Razorback | swamp | cooldown | boss_killed | 36.3 | 100% | 36.3 | 1.34 | 8.6 |
| Tusked Razorback | swamp | reload | boss_killed | 27.0 | 100% | 27.0 | 0.99 | 12.7 |
| Tusked Razorback | swamp | energy | bot_died | 38.0 | 81% | 47.1 | 1.37 | 13.9 |
| Tusked Razorback | swamp | dot | bot_died | 28.7 | 65% | 44.4 | 1.69 | 9.7 |
| Tusked Razorback | swamp | summoner | bot_died | 46.3 | 54% | 85.9 | 2.80 | 11.6 |
| Tusked Razorback | mountain | cadence | boss_killed | 28.6 | 100% | 28.6 | 0.81 | 10.3 |
| Tusked Razorback | mountain | cooldown | boss_killed | 30.5 | 100% | 30.5 | 0.71 | 8.9 |
| Tusked Razorback | mountain | reload | boss_killed | 31.4 | 100% | 31.4 | 1.05 | 10.8 |
| Tusked Razorback | mountain | energy | bot_died | 35.7 | 88% | 40.4 | 1.13 | 13.6 |
| Tusked Razorback | mountain | dot | boss_killed | 28.6 | 100% | 28.6 | 0.82 | 9.6 |
| Tusked Razorback | mountain | summoner | bot_died | 45.5 | 91% | 50.2 | 1.10 | 7.6 |
| Tusked Razorback | cave | cadence | boss_killed | 28.4 | 100% | 28.4 | 1.51 | 12.3 |
| Tusked Razorback | cave | cooldown | boss_killed | 26.5 | 100% | 26.5 | 1.14 | 10.3 |
| Tusked Razorback | cave | reload | boss_killed | 29.8 | 100% | 29.8 | 1.50 | 12.8 |
| Tusked Razorback | cave | energy | boss_killed | 33.0 | 100% | 33.0 | 1.34 | 20.1 |
| Tusked Razorback | cave | dot | bot_died | 22.9 | 93% | 24.5 | 1.34 | 14.0 |
| Tusked Razorback | cave | summoner | bot_died | 29.0 | 84% | 34.4 | 1.80 | 21.2 |
| Grave Toadeater | plains | cadence | bot_died | 18.7 | 42% | 44.3 | 2.76 | 10.3 |
| Grave Toadeater | plains | cooldown | bot_died | 21.7 | 52% | 42.0 | 2.37 | 8.6 |
| Grave Toadeater | plains | reload | bot_died | 22.1 | 61% | 36.4 | 1.65 | 8.2 |
| Grave Toadeater | plains | energy | bot_died | 23.2 | 57% | 40.6 | 1.75 | 11.8 |
| Grave Toadeater | plains | dot | bot_died | 19.7 | 49% | 40.5 | 2.05 | 8.2 |
| Grave Toadeater | plains | summoner | bot_died | 17.7 | 17% | 103.3 | 6.86 | 10.8 |
| Grave Toadeater | forest | cadence | boss_killed | 29.4 | 100% | 29.4 | 0.78 | 5.4 |
| Grave Toadeater | forest | cooldown | boss_killed | 30.9 | 100% | 30.9 | 0.65 | 3.9 |
| Grave Toadeater | forest | reload | boss_killed | 28.6 | 100% | 28.6 | 0.55 | 4.5 |
| Grave Toadeater | forest | energy | boss_killed | 27.4 | 100% | 27.4 | 0.07 | 3.7 |
| Grave Toadeater | forest | dot | boss_killed | 38.7 | 100% | 38.7 | 0.83 | 4.5 |
| Grave Toadeater | forest | summoner | boss_killed | 86.5 | 100% | 86.5 | 3.68 | 15.1 |
| Grave Toadeater | swamp | cadence | bot_died | 23.7 | 63% | 37.8 | 1.94 | 7.5 |
| Grave Toadeater | swamp | cooldown | bot_died | 26.7 | 74% | 35.9 | 1.70 | 6.7 |
| Grave Toadeater | swamp | reload | boss_killed | 27.9 | 100% | 27.9 | 0.93 | 6.2 |
| Grave Toadeater | swamp | energy | bot_died | 29.7 | 84% | 35.2 | 1.18 | 8.5 |
| Grave Toadeater | swamp | dot | bot_died | 24.7 | 69% | 35.8 | 1.45 | 5.8 |
| Grave Toadeater | swamp | summoner | bot_died | 22.7 | 28% | 80.8 | 4.34 | 7.8 |
| Grave Toadeater | mountain | cadence | bot_died | 24.7 | 74% | 33.2 | 1.60 | 9.3 |
| Grave Toadeater | mountain | cooldown | boss_killed | 28.6 | 100% | 28.6 | 1.22 | 7.8 |
| Grave Toadeater | mountain | reload | boss_killed | 25.0 | 100% | 25.0 | 0.55 | 7.4 |
| Grave Toadeater | mountain | energy | bot_died | 24.7 | 83% | 29.8 | 1.21 | 10.5 |
| Grave Toadeater | mountain | dot | bot_died | 26.7 | 100% | 26.8 | 1.00 | 7.5 |
| Grave Toadeater | mountain | summoner | bot_died | 21.7 | 32% | 68.2 | 3.76 | 18.7 |
| Grave Toadeater | cave | cadence | boss_killed | 28.4 | 100% | 28.4 | 1.60 | 8.6 |
| Grave Toadeater | cave | cooldown | boss_killed | 29.5 | 100% | 29.5 | 1.46 | 7.4 |
| Grave Toadeater | cave | reload | boss_killed | 24.2 | 100% | 24.2 | 0.91 | 8.5 |
| Grave Toadeater | cave | energy | boss_killed | 25.0 | 100% | 25.0 | 0.90 | 11.5 |
| Grave Toadeater | cave | dot | boss_killed | 26.7 | 100% | 26.7 | 1.31 | 7.8 |
| Grave Toadeater | cave | summoner | bot_died | 23.7 | 48% | 48.9 | 3.14 | 18.8 |
