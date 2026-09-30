# Phase 0 recovery pass — 2026-09-30T16:54:09.590Z

cap 300000 ms per cell per seed; seeds 101009, 101033; arm charm; gear +3; Second Wind reference x1; RECOVERY_BASE_FRACTION 0.05 of pools 100/130/200/330/560 (flat HP/s); OOC 0.1; PLAYER_MAX_HP 100

Target: median fight-end HP 0.40–0.60, time in band > 0.50.

| cell | maxHp | fights | median end HP | mean end HP | time in band | lost/fight | healed/fight | deaths | kills | <20% | 20-40 | 40-60 | 60-80 | >=80 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| p0-t3-striker-light-cave | 442 | 30 | 0.88 | 0.89 | 0.21 | 0.67 | 0.56 | 0 | 39 | 0 | 0 | 1 | 1 | 28 |
| p0-t3-striker-heavy-cave | 489 | 34 | 0.98 | 0.95 | 0.09 | 0.51 | 0.46 | 0 | 41 | 0 | 0 | 0 | 0 | 34 |
| p0-t3-striker-light-volcanic | 442 | 39 | 1.00 | 0.97 | 0.06 | 0.50 | 0.46 | 0 | 147 | 0 | 0 | 0 | 0 | 39 |
| p0-t3-striker-heavy-volcanic | 489 | 41 | 1.00 | 0.98 | 0.02 | 0.40 | 0.38 | 0 | 152 | 0 | 0 | 0 | 0 | 41 |
| p0-t4-striker-light-graveyard | 738 | 23 | 1.00 | 0.92 | 0.24 | 1.51 | 1.41 | 1 | 112 | 1 | 0 | 0 | 1 | 21 |
| p0-t4-striker-heavy-graveyard | 815 | 37 | 1.00 | 0.96 | 0.18 | 0.62 | 0.57 | 0 | 96 | 0 | 0 | 1 | 1 | 35 |
| p0-t4-striker-light-tundra | 825 | 18 | 0.91 | 0.90 | 0.10 | 1.21 | 1.12 | 0 | 17 | 0 | 0 | 0 | 3 | 15 |
| p0-t4-striker-heavy-tundra | 912 | 20 | 0.99 | 0.95 | 0.04 | 0.82 | 0.77 | 0 | 20 | 0 | 0 | 0 | 1 | 19 |
| p0-t3-squire-light-cave | 479 | 30 | 1.00 | 0.98 | 0.03 | 0.55 | 0.52 | 0 | 37 | 0 | 0 | 0 | 0 | 30 |
| p0-t3-squire-heavy-cave | 535 | 25 | 0.96 | 0.96 | 0.00 | 0.46 | 0.42 | 0 | 36 | 0 | 0 | 0 | 0 | 25 |
| p0-t3-squire-light-volcanic | 479 | 32 | 1.00 | 0.99 | 0.00 | 0.51 | 0.50 | 0 | 131 | 0 | 0 | 0 | 0 | 32 |
| p0-t3-squire-heavy-volcanic | 535 | 36 | 1.00 | 0.99 | 0.00 | 0.29 | 0.28 | 0 | 120 | 0 | 0 | 0 | 0 | 36 |
| p0-t4-squire-light-graveyard | 799 | 23 | 1.00 | 0.99 | 0.12 | 1.09 | 1.06 | 0 | 86 | 0 | 0 | 0 | 0 | 23 |
| p0-t4-squire-heavy-graveyard | 893 | 28 | 1.00 | 0.99 | 0.14 | 0.67 | 0.67 | 0 | 81 | 0 | 0 | 0 | 0 | 28 |
| p0-t4-squire-light-tundra | 894 | 14 | 0.98 | 0.96 | 0.00 | 1.15 | 1.10 | 0 | 15 | 0 | 0 | 0 | 0 | 14 |
| p0-t4-squire-heavy-tundra | 998 | 21 | 0.96 | 0.95 | 0.00 | 0.45 | 0.41 | 0 | 19 | 0 | 0 | 0 | 0 | 21 |
| p0-t3-apprentice-light-cave | 410 | 27 | 0.77 | 0.79 | 0.24 | 0.50 | 0.27 | 0 | 33 | 0 | 1 | 0 | 14 | 12 |
| p0-t3-apprentice-heavy-cave | 456 | 20 | 0.79 | 0.81 | 0.21 | 0.73 | 0.52 | 0 | 24 | 0 | 1 | 0 | 9 | 10 |
| p0-t3-apprentice-light-volcanic | 410 | 25 | 0.91 | 0.89 | 0.16 | 0.77 | 0.65 | 0 | 91 | 0 | 0 | 0 | 5 | 20 |
| p0-t3-apprentice-heavy-volcanic | 456 | 23 | 0.95 | 0.91 | 0.18 | 0.82 | 0.70 | 0 | 82 | 0 | 0 | 0 | 4 | 19 |
| p0-t4-apprentice-light-graveyard | 683 | 30 | 0.89 | 0.56 | 0.29 | 1.27 | 0.81 | 11 | 68 | 11 | 1 | 0 | 1 | 17 |
| p0-t4-apprentice-heavy-graveyard | 760 | 30 | 0.95 | 0.87 | 0.18 | 0.67 | 0.55 | 2 | 64 | 2 | 0 | 0 | 1 | 27 |
| p0-t4-apprentice-light-tundra | 764 | 13 | 0.85 | 0.79 | 0.22 | 0.90 | 0.69 | 0 | 14 | 0 | 1 | 1 | 4 | 7 |
| p0-t4-apprentice-heavy-tundra | 850 | 15 | 0.77 | 0.70 | 0.16 | 0.81 | 0.54 | 0 | 16 | 0 | 2 | 4 | 4 | 5 |
| p0-t3-slinger-light-cave | 393 | 29 | 0.86 | 0.87 | 0.18 | 0.40 | 0.26 | 0 | 33 | 0 | 0 | 0 | 10 | 19 |
| p0-t3-slinger-heavy-cave | 427 | 20 | 1.00 | 0.94 | 0.11 | 0.35 | 0.27 | 0 | 28 | 0 | 0 | 0 | 4 | 16 |
| p0-t3-slinger-light-volcanic | 393 | 21 | 0.99 | 0.97 | 0.09 | 0.83 | 0.77 | 0 | 112 | 0 | 0 | 0 | 0 | 21 |
| p0-t3-slinger-heavy-volcanic | 427 | 29 | 0.98 | 0.95 | 0.06 | 0.54 | 0.45 | 0 | 120 | 0 | 0 | 0 | 1 | 28 |
| p0-t4-slinger-light-graveyard | 655 | 15 | 0.93 | 0.88 | 0.11 | 1.75 | 1.56 | 1 | 71 | 1 | 0 | 0 | 0 | 14 |
| p0-t4-slinger-heavy-graveyard | 711 | 25 | 1.00 | 0.91 | 0.18 | 1.29 | 1.17 | 1 | 84 | 1 | 0 | 1 | 1 | 22 |
| p0-t4-slinger-light-tundra | 734 | 16 | 0.68 | 0.73 | 0.13 | 0.58 | 0.34 | 0 | 16 | 0 | 1 | 2 | 7 | 6 |
| p0-t4-slinger-heavy-tundra | 795 | 15 | 0.97 | 0.89 | 0.08 | 0.37 | 0.26 | 0 | 17 | 0 | 0 | 0 | 5 | 10 |
| p0-t3-conduit-light-cave | 403 | 0 | — | — | — | 0.00 | 0.00 | 0 | 28 | 0 | 0 | 0 | 0 | 0 |
| p0-t3-conduit-heavy-cave | 442 | 22 | 1.00 | 0.95 | 0.01 | 0.17 | 0.12 | 0 | 33 | 0 | 0 | 0 | 0 | 22 |
| p0-t3-conduit-light-volcanic | 403 | 14 | 1.00 | 0.98 | 0.05 | 0.49 | 0.46 | 0 | 116 | 0 | 0 | 0 | 0 | 14 |
| p0-t3-conduit-heavy-volcanic | 442 | 22 | 0.97 | 0.92 | 0.13 | 0.54 | 0.46 | 0 | 97 | 0 | 0 | 0 | 3 | 19 |
| p0-t4-conduit-light-graveyard | 672 | 10 | 0.97 | 0.95 | 0.15 | 1.49 | 1.44 | 0 | 71 | 0 | 0 | 0 | 0 | 10 |
| p0-t4-conduit-heavy-graveyard | 738 | 28 | 0.97 | 0.79 | 0.28 | 0.94 | 0.74 | 4 | 42 | 4 | 0 | 0 | 3 | 21 |
| p0-t4-conduit-light-tundra | 752 | 0 | — | — | — | 0.00 | 0.00 | 0 | 13 | 0 | 0 | 0 | 0 | 0 |
| p0-t4-conduit-heavy-tundra | 825 | 2 | 0.78 | 0.78 | 0.41 | 0.32 | 0.21 | 0 | 16 | 0 | 0 | 0 | 1 | 1 |
| p0-t3-spirit-light-cave | 376 | 28 | 1.00 | 0.94 | 0.05 | 0.15 | 0.08 | 0 | 40 | 0 | 0 | 0 | 3 | 25 |
| p0-t3-spirit-heavy-cave | 413 | 35 | 1.00 | 0.99 | 0.00 | 0.04 | 0.03 | 0 | 46 | 0 | 0 | 0 | 0 | 35 |
| p0-t3-spirit-light-volcanic | 376 | 33 | 1.00 | 0.94 | 0.07 | 0.29 | 0.23 | 0 | 127 | 0 | 0 | 1 | 1 | 31 |
| p0-t3-spirit-heavy-volcanic | 413 | 36 | 1.00 | 0.95 | 0.04 | 0.23 | 0.18 | 0 | 132 | 0 | 0 | 0 | 1 | 35 |
| p0-t4-spirit-light-graveyard | 628 | 24 | 0.98 | 0.90 | 0.27 | 1.03 | 0.90 | 1 | 90 | 1 | 0 | 0 | 1 | 22 |
| p0-t4-spirit-heavy-graveyard | 689 | 27 | 1.00 | 0.89 | 0.21 | 1.03 | 0.91 | 2 | 85 | 2 | 0 | 0 | 1 | 24 |
| p0-t4-spirit-light-tundra | 702 | 11 | 0.92 | 0.83 | 0.06 | 0.45 | 0.27 | 0 | 13 | 0 | 0 | 3 | 0 | 8 |
| p0-t4-spirit-heavy-tundra | 771 | 16 | 1.00 | 0.86 | 0.04 | 0.29 | 0.13 | 0 | 23 | 0 | 1 | 2 | 2 | 11 |
| p0-t1-striker-root-plains | 159 | 53 | 0.95 | 0.94 | 0.01 | 0.18 | 0.10 | 0 | 151 | 0 | 0 | 0 | 0 | 53 |
| p0-t2-striker-light-plains | 225 | 43 | 0.95 | 0.95 | 0.03 | 0.27 | 0.20 | 0 | 186 | 0 | 0 | 0 | 1 | 42 |
| p0-t2-striker-heavy-plains | 251 | 41 | 1.00 | 0.96 | 0.02 | 0.18 | 0.14 | 1 | 175 | 1 | 0 | 0 | 0 | 40 |
| p0-t1-striker-root-forest | 163 | 42 | 0.79 | 0.72 | 0.37 | 0.44 | 0.16 | 0 | 80 | 1 | 1 | 12 | 7 | 21 |
| p0-t2-striker-light-forest | 230 | 35 | 0.67 | 0.56 | 0.46 | 0.80 | 0.38 | 4 | 62 | 7 | 3 | 3 | 15 | 7 |
| p0-t2-striker-heavy-forest | 255 | 31 | 0.78 | 0.62 | 0.47 | 0.75 | 0.37 | 2 | 67 | 4 | 0 | 8 | 15 | 4 |
| p0-t1-squire-root-plains | 176 | 41 | 0.96 | 0.94 | 0.05 | 0.18 | 0.11 | 0 | 151 | 0 | 0 | 0 | 2 | 39 |
| p0-t2-squire-light-plains | 250 | 39 | 1.00 | 0.98 | 0.00 | 0.19 | 0.15 | 0 | 169 | 0 | 0 | 0 | 1 | 38 |
| p0-t2-squire-heavy-plains | 281 | 43 | 1.00 | 0.98 | 0.03 | 0.13 | 0.11 | 0 | 153 | 0 | 0 | 0 | 0 | 43 |
| p0-t1-squire-root-forest | 179 | 45 | 0.88 | 0.81 | 0.24 | 0.30 | 0.11 | 1 | 101 | 1 | 1 | 2 | 13 | 28 |
| p0-t2-squire-light-forest | 254 | 26 | 0.62 | 0.64 | 0.46 | 0.78 | 0.42 | 0 | 61 | 2 | 0 | 6 | 13 | 5 |
| p0-t2-squire-heavy-forest | 286 | 31 | 0.74 | 0.81 | 0.27 | 0.48 | 0.28 | 0 | 66 | 0 | 0 | 2 | 14 | 15 |
| p0-t1-apprentice-root-plains | 151 | 53 | 1.00 | 0.97 | 0.01 | 0.09 | 0.06 | 0 | 114 | 0 | 0 | 0 | 2 | 51 |
| p0-t2-apprentice-light-plains | 214 | 36 | 0.94 | 0.92 | 0.05 | 0.30 | 0.21 | 0 | 137 | 0 | 1 | 0 | 0 | 35 |
| p0-t2-apprentice-heavy-plains | 241 | 34 | 0.94 | 0.93 | 0.01 | 0.27 | 0.19 | 0 | 140 | 0 | 0 | 0 | 1 | 33 |
| p0-t1-apprentice-root-forest | 155 | 36 | 0.35 | 0.41 | 0.46 | 0.72 | 0.15 | 9 | 85 | 11 | 8 | 7 | 2 | 8 |
| p0-t2-apprentice-light-forest | 218 | 33 | 0.88 | 0.67 | 0.37 | 0.58 | 0.26 | 4 | 58 | 8 | 1 | 0 | 5 | 19 |
| p0-t2-apprentice-heavy-forest | 244 | 24 | 0.78 | 0.62 | 0.39 | 0.71 | 0.33 | 2 | 54 | 2 | 6 | 3 | 1 | 12 |
| p0-t1-slinger-root-plains | 144 | 49 | 1.00 | 0.98 | 0.02 | 0.09 | 0.07 | 0 | 118 | 0 | 0 | 0 | 1 | 48 |
| p0-t2-slinger-light-plains | 205 | 43 | 1.00 | 0.98 | 0.00 | 0.18 | 0.15 | 0 | 176 | 0 | 0 | 0 | 0 | 43 |
| p0-t2-slinger-heavy-plains | 224 | 49 | 1.00 | 0.98 | 0.00 | 0.14 | 0.12 | 0 | 162 | 0 | 0 | 0 | 0 | 49 |
| p0-t1-slinger-root-forest | 148 | 31 | 0.38 | 0.52 | 0.46 | 0.71 | 0.24 | 3 | 67 | 7 | 9 | 1 | 2 | 12 |
| p0-t2-slinger-light-forest | 208 | 29 | 0.80 | 0.82 | 0.25 | 0.54 | 0.35 | 0 | 79 | 0 | 0 | 1 | 13 | 15 |
| p0-t2-slinger-heavy-forest | 227 | 35 | 0.84 | 0.85 | 0.31 | 0.39 | 0.24 | 0 | 80 | 0 | 0 | 4 | 9 | 22 |
| p0-t1-conduit-root-plains | 146 | 12 | 0.95 | 0.94 | 0.01 | 0.14 | 0.08 | 0 | 150 | 0 | 0 | 0 | 1 | 11 |
| p0-t2-conduit-light-plains | 207 | 16 | 0.95 | 0.89 | 0.29 | 0.26 | 0.17 | 0 | 177 | 0 | 1 | 0 | 2 | 13 |
| p0-t2-conduit-heavy-plains | 230 | 25 | 0.96 | 0.94 | 0.04 | 0.27 | 0.21 | 0 | 126 | 0 | 0 | 0 | 2 | 23 |
| p0-t1-conduit-root-forest | 149 | 27 | 0.66 | 0.60 | 0.45 | 0.54 | 0.16 | 2 | 90 | 2 | 2 | 9 | 8 | 6 |
| p0-t2-conduit-light-forest | 211 | 13 | 0.87 | 0.80 | 0.37 | 0.53 | 0.33 | 0 | 55 | 0 | 1 | 0 | 5 | 7 |
| p0-t2-conduit-heavy-forest | 233 | 10 | 0.84 | 0.70 | 0.56 | 0.48 | 0.20 | 0 | 60 | 1 | 2 | 0 | 2 | 5 |
| p0-t1-spirit-root-plains | 139 | 48 | 1.00 | 1.00 | 0.00 | 0.00 | 0.00 | 0 | 125 | 0 | 0 | 0 | 0 | 48 |
| p0-t2-spirit-light-plains | 196 | 43 | 1.00 | 0.99 | 0.00 | 0.02 | 0.02 | 0 | 165 | 0 | 0 | 0 | 0 | 43 |
| p0-t2-spirit-heavy-plains | 216 | 42 | 1.00 | 0.99 | 0.00 | 0.03 | 0.02 | 0 | 171 | 0 | 0 | 0 | 0 | 42 |
| p0-t1-spirit-root-forest | 142 | 40 | 0.43 | 0.46 | 0.32 | 0.62 | 0.12 | 12 | 102 | 13 | 5 | 9 | 0 | 13 |
| p0-t2-spirit-light-forest | 199 | 28 | 0.78 | 0.70 | 0.29 | 0.52 | 0.23 | 2 | 72 | 2 | 1 | 10 | 2 | 13 |
| p0-t2-spirit-heavy-forest | 221 | 33 | 0.97 | 0.81 | 0.21 | 0.31 | 0.13 | 0 | 80 | 0 | 1 | 6 | 8 | 18 |

## Largest single hits (burst watch list)

| cell | source | hit / maxHp | HP before |
|---|---|---:|---:|
| p0-t3-spirit-light-cave | Cavern Troll | 0.67 | 0.70 |
| p0-t3-slinger-heavy-cave | Cavern Troll | 0.59 | 0.91 |
| p0-t3-apprentice-light-cave | Cavern Troll | 0.48 | 1.00 |
| p0-t3-striker-light-cave | Cavern Troll | 0.45 | 1.00 |
| p0-t3-striker-light-cave | Cavern Troll | 0.45 | 1.00 |
| p0-t3-striker-light-cave | Cavern Troll | 0.45 | 1.00 |
| p0-t3-striker-light-cave | Cavern Troll | 0.45 | 1.00 |
| p0-t3-striker-light-cave | Cavern Troll | 0.45 | 1.00 |
| p0-t3-apprentice-heavy-cave | Cavern Troll | 0.42 | 0.72 |
| p0-t3-apprentice-heavy-cave | Cavern Troll | 0.42 | 0.95 |
| p0-t3-apprentice-heavy-cave | Cavern Troll | 0.42 | 0.97 |
| p0-t3-striker-heavy-cave | Cavern Troll | 0.39 | 1.00 |
| p0-t3-striker-heavy-cave | Cavern Troll | 0.39 | 1.00 |
| p0-t3-striker-heavy-cave | Cavern Troll | 0.39 | 1.00 |
| p0-t4-slinger-light-tundra | Rime-Tusk Mastodon | 0.39 | 1.00 |
