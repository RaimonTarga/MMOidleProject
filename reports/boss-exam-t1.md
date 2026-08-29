
> mmo-idle@0.4 boss:exam C:\Users\osaif\Documents\Claude\Projects\MMO idle
> pnpm --filter @mmo-idle/server exec tsx --conditions=development bench/bossExam.ts "--" "--tier" "1"

# Tier 1 boss exam

Guard stripped, boss woken immediately. 5 armour set(s) x 6 class roots per boss, gear fully upgraded, time-scale 1, cap 240s.

`cost` = health bars the full fight costs (`hp lost/s / pool` x `ttk`). `ttk` is extrapolated from boss HP removed when the fight did not finish. `burst` is the worst single second as a share of the pool.

| boss | biome | win | ttk s | cost bars | hp/s %pool | burst %pool | spike% | attrition% |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Obsidian Broodmother | cave | 0/30 | 85.3 | 4.99 | 6.1 | 22.7 | 0 | 0 |
| Gnarled Greatbear | forest | 0/30 | 57.2 | 4.95 | 8.8 | 15.5 | 0 | 0 |
| Tusked Razorback | plains | 0/30 | 79.3 | 4.67 | 6.1 | 16.2 | 0 | 0 |
| Crag Behemoth | mountain | 0/30 | 57.6 | 3.39 | 5.9 | 25.4 | 0 | 0 |
| Grave Toadeater | swamp | 0/30 | 62.9 | 3.39 | 5.4 | 10.2 | 0 | 89 |

## Per class root (cost bars)

| boss | cadence | cooldown | reload | energy | dot | summoner |
|---|---:|---:|---:|---:|---:|---:|
| Obsidian Broodmother | 4.03 | 3.96 | 3.86 | 3.65 | 3.69 | 10.72 |
| Gnarled Greatbear | 5.03 | 4.69 | 4.93 | 4.77 | 5.54 | 4.72 |
| Tusked Razorback | 3.63 | 3.59 | 4.17 | 3.91 | 4.37 | 8.38 |
| Crag Behemoth | 3.31 | 3.24 | 3.55 | 3.46 | 3.73 | 3.06 |
| Grave Toadeater | 3.32 | 3.53 | 2.56 | 3.17 | 2.97 | 4.76 |

## Per armour set (cost bars)

| boss | plains | forest | swamp | mountain | cave |
|---|---:|---:|---:|---:|---:|
| Obsidian Broodmother | 6.32 | 5.85 | 6.00 | 3.64 | 3.12 |
| Gnarled Greatbear | 4.33 | 5.26 | 6.18 | 4.72 | 4.23 |
| Tusked Razorback | 4.81 | 5.02 | 6.70 | 3.78 | 3.06 |
| Crag Behemoth | 3.81 | 3.39 | 3.87 | 3.26 | 2.63 |
| Grave Toadeater | 4.70 | 2.90 | 3.21 | 3.26 | 2.86 |

## Every fight

| boss | gear | class | outcome | elapsed s | boss hp removed | ttk s | cost bars | burst %pool |
|---|---|---|---|---:|---:|---:|---:|---:|
| Crag Behemoth | plains | cadence | bot_died | 21.1 | 33% | 64.7 | 3.89 | 23.8 |
| Crag Behemoth | plains | cooldown | bot_died | 24.6 | 34% | 72.7 | 3.68 | 19.8 |
| Crag Behemoth | plains | reload | bot_died | 17.6 | 27% | 65.9 | 3.74 | 28.2 |
| Crag Behemoth | plains | energy | bot_died | 17.6 | 27% | 64.7 | 3.68 | 29.4 |
| Crag Behemoth | plains | dot | bot_died | 17.6 | 25% | 69.1 | 3.93 | 24.3 |
| Crag Behemoth | plains | summoner | bot_died | 21.1 | 25% | 83.6 | 3.96 | 19.3 |
| Crag Behemoth | forest | cadence | bot_died | 21.1 | 50% | 42.6 | 2.70 | 26.6 |
| Crag Behemoth | forest | cooldown | bot_died | 24.6 | 43% | 56.6 | 3.01 | 24.0 |
| Crag Behemoth | forest | reload | bot_died | 14.1 | 25% | 56.9 | 4.04 | 32.0 |
| Crag Behemoth | forest | energy | bot_died | 14.1 | 32% | 44.6 | 3.16 | 33.3 |
| Crag Behemoth | forest | dot | bot_died | 14.1 | 22% | 64.7 | 4.59 | 27.6 |
| Crag Behemoth | forest | summoner | bot_died | 21.1 | 35% | 60.0 | 2.85 | 22.1 |
| Crag Behemoth | swamp | cadence | bot_died | 28.1 | 47% | 59.5 | 4.10 | 26.0 |
| Crag Behemoth | swamp | cooldown | bot_died | 31.6 | 48% | 65.8 | 3.80 | 22.4 |
| Crag Behemoth | swamp | reload | bot_died | 21.1 | 35% | 59.9 | 3.76 | 29.8 |
| Crag Behemoth | swamp | energy | bot_died | 17.6 | 33% | 53.3 | 3.71 | 31.0 |
| Crag Behemoth | swamp | dot | bot_died | 17.6 | 28% | 62.4 | 4.35 | 25.8 |
| Crag Behemoth | swamp | summoner | bot_died | 24.6 | 39% | 62.8 | 3.48 | 21.0 |
| Crag Behemoth | mountain | cadence | bot_died | 21.1 | 39% | 54.6 | 3.29 | 25.1 |
| Crag Behemoth | mountain | cooldown | bot_died | 24.6 | 42% | 58.9 | 2.98 | 21.1 |
| Crag Behemoth | mountain | reload | bot_died | 17.6 | 33% | 53.0 | 3.01 | 28.8 |
| Crag Behemoth | mountain | energy | bot_died | 14.1 | 24% | 58.3 | 4.13 | 29.9 |
| Crag Behemoth | mountain | dot | bot_died | 17.6 | 33% | 53.0 | 3.01 | 24.9 |
| Crag Behemoth | mountain | summoner | bot_died | 21.1 | 32% | 66.7 | 3.16 | 20.1 |
| Crag Behemoth | cave | cadence | bot_died | 24.6 | 58% | 42.8 | 2.57 | 24.3 |
| Crag Behemoth | cave | cooldown | bot_died | 28.1 | 54% | 52.5 | 2.73 | 20.9 |
| Crag Behemoth | cave | reload | bot_died | 17.6 | 34% | 51.3 | 3.19 | 28.2 |
| Crag Behemoth | cave | energy | bot_died | 17.6 | 41% | 42.7 | 2.64 | 29.4 |
| Crag Behemoth | cave | dot | bot_died | 17.6 | 39% | 45.3 | 2.80 | 24.3 |
| Crag Behemoth | cave | summoner | bot_died | 24.6 | 63% | 39.2 | 1.87 | 19.5 |
| Obsidian Broodmother | plains | cadence | bot_died | 19.7 | 25% | 78.0 | 4.96 | 21.3 |
| Obsidian Broodmother | plains | cooldown | bot_died | 22.5 | 25% | 89.5 | 4.88 | 18.7 |
| Obsidian Broodmother | plains | reload | bot_died | 16.9 | 22% | 75.4 | 4.46 | 24.2 |
| Obsidian Broodmother | plains | energy | bot_died | 16.9 | 23% | 73.9 | 4.38 | 25.2 |
| Obsidian Broodmother | plains | dot | bot_died | 16.9 | 26% | 65.7 | 3.89 | 21.4 |
| Obsidian Broodmother | plains | summoner | bot_died | 19.7 | 7% | 302.4 | 15.35 | 18.0 |
| Obsidian Broodmother | forest | cadence | bot_died | 19.7 | 38% | 52.2 | 3.49 | 24.9 |
| Obsidian Broodmother | forest | cooldown | bot_died | 22.5 | 33% | 67.4 | 3.85 | 21.4 |
| Obsidian Broodmother | forest | reload | bot_died | 16.9 | 30% | 57.1 | 3.38 | 27.5 |
| Obsidian Broodmother | forest | energy | bot_died | 16.9 | 33% | 50.8 | 3.01 | 28.6 |
| Obsidian Broodmother | forest | dot | bot_died | 14.1 | 21% | 66.2 | 4.69 | 23.7 |
| Obsidian Broodmother | forest | summoner | bot_died | 19.7 | 6% | 328.3 | 16.67 | 20.1 |
| Obsidian Broodmother | swamp | cadence | bot_died | 25.3 | 37% | 68.2 | 4.90 | 23.7 |
| Obsidian Broodmother | swamp | cooldown | bot_died | 28.1 | 37% | 75.9 | 4.88 | 20.9 |
| Obsidian Broodmother | swamp | reload | bot_died | 16.9 | 24% | 70.4 | 5.09 | 26.1 |
| Obsidian Broodmother | swamp | energy | bot_died | 16.9 | 27% | 62.1 | 4.49 | 27.7 |
| Obsidian Broodmother | swamp | dot | bot_died | 16.9 | 28% | 60.9 | 4.40 | 23.1 |
| Obsidian Broodmother | swamp | summoner | bot_died | 25.3 | 11% | 221.4 | 12.23 | 19.1 |
| Obsidian Broodmother | mountain | cadence | bot_died | 19.7 | 35% | 56.7 | 3.60 | 22.9 |
| Obsidian Broodmother | mountain | cooldown | bot_died | 22.5 | 38% | 59.8 | 3.26 | 19.6 |
| Obsidian Broodmother | mountain | reload | bot_died | 16.9 | 32% | 52.8 | 3.13 | 25.2 |
| Obsidian Broodmother | mountain | energy | bot_died | 16.9 | 31% | 54.1 | 3.20 | 26.8 |
| Obsidian Broodmother | mountain | dot | bot_died | 16.9 | 34% | 49.4 | 2.92 | 22.3 |
| Obsidian Broodmother | mountain | summoner | bot_died | 19.7 | 17% | 113.4 | 5.76 | 18.3 |
| Obsidian Broodmother | cave | cadence | bot_died | 19.7 | 43% | 45.5 | 3.22 | 22.3 |
| Obsidian Broodmother | cave | cooldown | bot_died | 25.3 | 49% | 51.9 | 2.93 | 19.8 |
| Obsidian Broodmother | cave | reload | bot_died | 16.9 | 34% | 50.3 | 3.26 | 24.2 |
| Obsidian Broodmother | cave | energy | bot_died | 16.9 | 34% | 49.2 | 3.17 | 25.9 |
| Obsidian Broodmother | cave | dot | bot_died | 16.9 | 43% | 39.6 | 2.54 | 21.4 |
| Obsidian Broodmother | cave | summoner | bot_died | 22.5 | 32% | 69.8 | 3.62 | 18.2 |
| Gnarled Greatbear | plains | cadence | bot_died | 18.1 | 28% | 65.0 | 4.44 | 9.8 |
| Gnarled Greatbear | plains | cooldown | bot_died | 26.5 | 38% | 70.0 | 3.37 | 6.5 |
| Gnarled Greatbear | plains | reload | bot_died | 13.5 | 23% | 59.2 | 4.39 | 13.4 |
| Gnarled Greatbear | plains | energy | bot_died | 13.6 | 23% | 59.0 | 4.34 | 14.0 |
| Gnarled Greatbear | plains | dot | bot_died | 14.6 | 22% | 67.4 | 4.62 | 10.4 |
| Gnarled Greatbear | plains | summoner | bot_died | 16.0 | 21% | 77.3 | 4.83 | 9.3 |
| Gnarled Greatbear | forest | cadence | bot_died | 10.9 | 25% | 43.1 | 4.69 | 18.9 |
| Gnarled Greatbear | forest | cooldown | bot_died | 13.3 | 23% | 58.3 | 5.10 | 14.9 |
| Gnarled Greatbear | forest | reload | bot_died | 11.0 | 21% | 52.4 | 4.76 | 22.2 |
| Gnarled Greatbear | forest | energy | bot_died | 9.7 | 22% | 43.7 | 4.50 | 23.1 |
| Gnarled Greatbear | forest | dot | bot_died | 9.6 | 14% | 67.4 | 7.02 | 19.2 |
| Gnarled Greatbear | forest | summoner | bot_died | 11.0 | 18% | 60.1 | 5.46 | 15.6 |
| Gnarled Greatbear | swamp | cadence | bot_died | 12.1 | 18% | 65.8 | 7.41 | 16.9 |
| Gnarled Greatbear | swamp | cooldown | bot_died | 15.7 | 24% | 66.4 | 5.95 | 13.2 |
| Gnarled Greatbear | swamp | reload | bot_died | 12.3 | 20% | 60.4 | 6.06 | 19.9 |
| Gnarled Greatbear | swamp | energy | bot_died | 11.2 | 20% | 54.6 | 5.59 | 20.6 |
| Gnarled Greatbear | swamp | dot | bot_died | 12.2 | 19% | 65.2 | 6.62 | 16.1 |
| Gnarled Greatbear | swamp | summoner | bot_died | 14.8 | 23% | 63.9 | 5.47 | 13.6 |
| Gnarled Greatbear | mountain | cadence | bot_died | 13.3 | 25% | 53.6 | 4.74 | 15.6 |
| Gnarled Greatbear | mountain | cooldown | bot_died | 15.7 | 27% | 57.9 | 4.21 | 12.0 |
| Gnarled Greatbear | mountain | reload | bot_died | 12.2 | 23% | 53.4 | 4.38 | 18.4 |
| Gnarled Greatbear | mountain | energy | bot_died | 11.2 | 19% | 58.8 | 5.25 | 19.1 |
| Gnarled Greatbear | mountain | dot | bot_died | 11.0 | 20% | 55.6 | 5.05 | 16.0 |
| Gnarled Greatbear | mountain | summoner | bot_died | 13.6 | 21% | 64.2 | 4.72 | 12.2 |
| Gnarled Greatbear | cave | cadence | bot_died | 13.3 | 33% | 39.9 | 3.90 | 15.4 |
| Gnarled Greatbear | cave | cooldown | bot_died | 14.5 | 26% | 55.0 | 4.78 | 12.8 |
| Gnarled Greatbear | cave | reload | bot_died | 11.0 | 21% | 51.6 | 5.07 | 18.4 |
| Gnarled Greatbear | cave | energy | bot_died | 11.1 | 26% | 42.9 | 4.16 | 19.1 |
| Gnarled Greatbear | cave | dot | bot_died | 11.0 | 24% | 45.0 | 4.37 | 15.3 |
| Gnarled Greatbear | cave | summoner | bot_died | 13.6 | 36% | 37.6 | 3.12 | 13.0 |
| Tusked Razorback | plains | cadence | bot_died | 22.3 | 36% | 62.5 | 3.61 | 13.2 |
| Tusked Razorback | plains | cooldown | bot_died | 28.1 | 40% | 69.9 | 3.11 | 9.5 |
| Tusked Razorback | plains | reload | bot_died | 28.1 | 41% | 68.5 | 3.92 | 14.8 |
| Tusked Razorback | plains | energy | bot_died | 20.1 | 29% | 69.2 | 3.91 | 15.4 |
| Tusked Razorback | plains | dot | bot_died | 26.5 | 28% | 96.3 | 5.07 | 12.2 |
| Tusked Razorback | plains | summoner | bot_died | 40.1 | 19% | 215.7 | 9.26 | 9.3 |
| Tusked Razorback | forest | cadence | bot_died | 20.1 | 41% | 49.3 | 3.26 | 18.6 |
| Tusked Razorback | forest | cooldown | bot_died | 22.1 | 31% | 70.8 | 4.10 | 15.8 |
| Tusked Razorback | forest | reload | bot_died | 14.1 | 27% | 52.3 | 3.71 | 19.0 |
| Tusked Razorback | forest | energy | bot_died | 14.1 | 33% | 43.0 | 3.05 | 22.4 |
| Tusked Razorback | forest | dot | bot_died | 15.9 | 26% | 61.3 | 3.85 | 19.1 |
| Tusked Razorback | forest | summoner | bot_died | 18.1 | 8% | 219.8 | 12.14 | 16.2 |
| Tusked Razorback | swamp | cadence | bot_died | 22.1 | 34% | 65.1 | 5.01 | 18.0 |
| Tusked Razorback | swamp | cooldown | bot_died | 30.1 | 39% | 76.6 | 4.48 | 14.4 |
| Tusked Razorback | swamp | reload | bot_died | 16.1 | 21% | 75.0 | 6.09 | 21.1 |
| Tusked Razorback | swamp | energy | bot_died | 16.1 | 25% | 63.8 | 4.52 | 24.5 |
| Tusked Razorback | swamp | dot | bot_died | 20.1 | 18% | 109.2 | 7.38 | 16.6 |
| Tusked Razorback | swamp | summoner | bot_died | 24.1 | 11% | 217.9 | 12.71 | 14.8 |
| Tusked Razorback | mountain | cadence | bot_died | 20.1 | 40% | 50.3 | 3.06 | 15.6 |
| Tusked Razorback | mountain | cooldown | bot_died | 26.1 | 36% | 72.3 | 3.40 | 11.4 |
| Tusked Razorback | mountain | reload | bot_died | 18.1 | 32% | 57.0 | 3.56 | 19.0 |
| Tusked Razorback | mountain | energy | bot_died | 16.1 | 20% | 78.6 | 4.89 | 17.8 |
| Tusked Razorback | mountain | dot | bot_died | 16.6 | 35% | 46.9 | 2.82 | 15.9 |
| Tusked Razorback | mountain | summoner | bot_died | 22.1 | 20% | 109.2 | 4.94 | 12.8 |
| Tusked Razorback | cave | cadence | bot_died | 18.1 | 41% | 44.0 | 3.23 | 15.9 |
| Tusked Razorback | cave | cooldown | bot_died | 22.1 | 47% | 47.0 | 2.84 | 13.4 |
| Tusked Razorback | cave | reload | bot_died | 16.1 | 33% | 48.4 | 3.59 | 20.7 |
| Tusked Razorback | cave | energy | bot_died | 14.1 | 34% | 41.8 | 3.17 | 21.1 |
| Tusked Razorback | cave | dot | bot_died | 18.1 | 41% | 44.5 | 2.70 | 16.4 |
| Tusked Razorback | cave | summoner | bot_died | 22.1 | 41% | 54.2 | 2.84 | 12.3 |
| Grave Toadeater | plains | cadence | bot_died | 18.7 | 27% | 70.3 | 4.47 | 10.4 |
| Grave Toadeater | plains | cooldown | bot_died | 19.7 | 25% | 80.3 | 4.78 | 9.3 |
| Grave Toadeater | plains | reload | bot_died | 21.1 | 30% | 69.7 | 3.30 | 8.7 |
| Grave Toadeater | plains | energy | bot_died | 16.7 | 23% | 71.1 | 4.26 | 11.9 |
| Grave Toadeater | plains | dot | bot_died | 17.7 | 24% | 74.2 | 4.19 | 9.0 |
| Grave Toadeater | plains | summoner | bot_died | 15.7 | 14% | 113.3 | 7.22 | 10.7 |
| Grave Toadeater | forest | cadence | bot_died | 24.7 | 53% | 46.5 | 2.58 | 12.4 |
| Grave Toadeater | forest | cooldown | bot_died | 25.7 | 43% | 59.9 | 3.03 | 10.5 |
| Grave Toadeater | forest | reload | bot_died | 32.3 | 56% | 58.2 | 1.80 | 9.2 |
| Grave Toadeater | forest | energy | bot_died | 19.7 | 43% | 46.2 | 2.34 | 15.0 |
| Grave Toadeater | forest | dot | bot_died | 21.7 | 34% | 64.6 | 2.98 | 10.9 |
| Grave Toadeater | forest | summoner | bot_died | 18.7 | 21% | 87.7 | 4.69 | 13.0 |
| Grave Toadeater | swamp | cadence | bot_died | 40.7 | 68% | 60.1 | 3.31 | 8.5 |
| Grave Toadeater | swamp | cooldown | bot_died | 40.7 | 58% | 70.6 | 3.45 | 7.0 |
| Grave Toadeater | swamp | reload | bot_died | 42.9 | 72% | 59.5 | 2.34 | 8.1 |
| Grave Toadeater | swamp | energy | bot_died | 23.7 | 42% | 56.8 | 3.05 | 10.3 |
| Grave Toadeater | swamp | dot | bot_died | 34.7 | 59% | 58.4 | 2.56 | 6.9 |
| Grave Toadeater | swamp | summoner | bot_died | 24.7 | 29% | 86.2 | 4.57 | 8.6 |
| Grave Toadeater | mountain | cadence | bot_died | 20.7 | 37% | 56.6 | 3.32 | 10.6 |
| Grave Toadeater | mountain | cooldown | bot_died | 22.7 | 37% | 61.9 | 3.18 | 8.5 |
| Grave Toadeater | mountain | reload | bot_died | 22.1 | 38% | 58.2 | 2.63 | 9.8 |
| Grave Toadeater | mountain | energy | bot_died | 16.7 | 30% | 55.1 | 3.30 | 12.7 |
| Grave Toadeater | mountain | dot | bot_died | 19.7 | 36% | 54.1 | 2.75 | 9.2 |
| Grave Toadeater | mountain | summoner | bot_died | 16.7 | 23% | 73.1 | 4.38 | 11.6 |
| Grave Toadeater | cave | cadence | bot_died | 19.7 | 42% | 46.7 | 2.94 | 10.7 |
| Grave Toadeater | cave | cooldown | bot_died | 20.7 | 37% | 55.4 | 3.23 | 9.5 |
| Grave Toadeater | cave | reload | bot_died | 20.1 | 37% | 54.6 | 2.72 | 9.9 |
| Grave Toadeater | cave | energy | bot_died | 16.7 | 34% | 48.8 | 2.92 | 13.0 |
| Grave Toadeater | cave | dot | bot_died | 18.3 | 42% | 43.7 | 2.39 | 9.8 |
| Grave Toadeater | cave | summoner | bot_died | 15.7 | 34% | 46.4 | 2.95 | 11.8 |
