# Phase 0 recovery pass — 2026-09-30T15:07:50.628Z

cap 300000 ms per cell per seed; seeds 101009, 101033; gear +3; Second Wind reference x1; RECOVERY_BASE_FRACTION 0.05 of pools 100/130/200/330/560 (flat HP/s); OOC 0.1; PLAYER_MAX_HP 100

Target: median fight-end HP 0.40–0.60, time in band > 0.50.

| cell | maxHp | fights | median end HP | mean end HP | time in band | lost/fight | healed/fight | deaths | kills | <20% | 20-40 | 40-60 | 60-80 | >=80 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| p0-t1-striker-root-plains | 159 | 55 | 0.94 | 0.93 | 0.02 | 0.17 | 0.09 | 0 | 155 | 0 | 0 | 0 | 1 | 54 |
| p0-t2-striker-light-plains | 225 | 45 | 0.94 | 0.93 | 0.08 | 0.27 | 0.19 | 0 | 168 | 0 | 0 | 0 | 5 | 40 |
| p0-t2-striker-heavy-plains | 251 | 41 | 0.98 | 0.96 | 0.07 | 0.20 | 0.15 | 0 | 172 | 0 | 0 | 0 | 2 | 39 |
| p0-t1-striker-root-forest | 163 | 42 | 0.86 | 0.72 | 0.34 | 0.43 | 0.15 | 0 | 75 | 1 | 3 | 12 | 1 | 25 |
| p0-t2-striker-light-forest | 230 | 37 | 0.58 | 0.43 | 0.48 | 0.87 | 0.33 | 11 | 75 | 13 | 3 | 4 | 11 | 6 |
| p0-t2-striker-heavy-forest | 255 | 37 | 0.73 | 0.58 | 0.41 | 0.69 | 0.28 | 7 | 74 | 8 | 5 | 4 | 7 | 13 |
| p0-t1-squire-root-plains | 176 | 38 | 0.96 | 0.94 | 0.03 | 0.18 | 0.10 | 0 | 147 | 0 | 0 | 0 | 2 | 36 |
| p0-t2-squire-light-plains | 250 | 42 | 1.00 | 0.99 | 0.00 | 0.15 | 0.13 | 0 | 180 | 0 | 0 | 0 | 0 | 42 |
| p0-t2-squire-heavy-plains | 281 | 39 | 1.00 | 0.99 | 0.00 | 0.14 | 0.12 | 0 | 134 | 0 | 0 | 0 | 0 | 39 |
| p0-t1-squire-root-forest | 179 | 42 | 0.88 | 0.79 | 0.23 | 0.32 | 0.11 | 1 | 95 | 1 | 2 | 2 | 11 | 26 |
| p0-t2-squire-light-forest | 254 | 26 | 0.57 | 0.63 | 0.51 | 0.74 | 0.37 | 0 | 62 | 2 | 0 | 13 | 4 | 7 |
| p0-t2-squire-heavy-forest | 286 | 32 | 0.71 | 0.78 | 0.36 | 0.48 | 0.25 | 0 | 61 | 0 | 0 | 2 | 19 | 11 |
| p0-t1-apprentice-root-plains | 151 | 47 | 1.00 | 0.94 | 0.04 | 0.11 | 0.05 | 0 | 111 | 1 | 0 | 1 | 1 | 44 |
| p0-t2-apprentice-light-plains | 214 | 41 | 0.90 | 0.88 | 0.09 | 0.26 | 0.14 | 0 | 121 | 0 | 0 | 3 | 2 | 36 |
| p0-t2-apprentice-heavy-plains | 241 | 39 | 0.94 | 0.92 | 0.07 | 0.23 | 0.14 | 0 | 144 | 0 | 0 | 0 | 5 | 34 |
| p0-t1-apprentice-root-forest | 155 | 34 | 0.43 | 0.47 | 0.45 | 0.63 | 0.14 | 7 | 81 | 8 | 5 | 11 | 0 | 10 |
| p0-t2-apprentice-light-forest | 218 | 33 | 0.94 | 0.66 | 0.36 | 0.58 | 0.24 | 6 | 55 | 10 | 0 | 0 | 2 | 21 |
| p0-t2-apprentice-heavy-forest | 244 | 30 | 0.86 | 0.64 | 0.34 | 0.60 | 0.26 | 4 | 55 | 6 | 4 | 1 | 0 | 19 |
| p0-t1-slinger-root-plains | 144 | 53 | 1.00 | 0.98 | 0.00 | 0.09 | 0.06 | 0 | 116 | 0 | 0 | 0 | 0 | 53 |
| p0-t2-slinger-light-plains | 205 | 41 | 1.00 | 0.98 | 0.00 | 0.17 | 0.13 | 0 | 166 | 0 | 0 | 0 | 0 | 41 |
| p0-t2-slinger-heavy-plains | 224 | 40 | 0.98 | 0.97 | 0.00 | 0.19 | 0.16 | 0 | 174 | 0 | 0 | 0 | 0 | 40 |
| p0-t1-slinger-root-forest | 148 | 39 | 0.29 | 0.39 | 0.47 | 0.76 | 0.20 | 12 | 76 | 17 | 6 | 4 | 2 | 10 |
| p0-t2-slinger-light-forest | 208 | 28 | 0.79 | 0.81 | 0.30 | 0.54 | 0.34 | 0 | 71 | 0 | 0 | 0 | 14 | 14 |
| p0-t2-slinger-heavy-forest | 227 | 32 | 0.88 | 0.81 | 0.33 | 0.42 | 0.23 | 0 | 77 | 0 | 0 | 3 | 10 | 19 |
| p0-t1-conduit-root-plains | 146 | 6 | 0.96 | 0.94 | 0.00 | 0.09 | 0.04 | 0 | 164 | 0 | 0 | 0 | 0 | 6 |
| p0-t2-conduit-light-plains | 207 | 19 | 0.98 | 0.95 | 0.07 | 0.15 | 0.10 | 0 | 174 | 0 | 0 | 0 | 0 | 19 |
| p0-t2-conduit-heavy-plains | 230 | 26 | 0.95 | 0.95 | 0.01 | 0.21 | 0.15 | 0 | 137 | 0 | 0 | 0 | 1 | 25 |
| p0-t1-conduit-root-forest | 149 | 27 | 0.72 | 0.69 | 0.33 | 0.41 | 0.11 | 1 | 84 | 1 | 0 | 3 | 17 | 6 |
| p0-t2-conduit-light-forest | 211 | 18 | 0.73 | 0.79 | 0.33 | 0.51 | 0.31 | 0 | 58 | 0 | 0 | 1 | 9 | 8 |
| p0-t2-conduit-heavy-forest | 233 | 6 | 0.85 | 0.72 | 0.41 | 0.44 | 0.16 | 1 | 64 | 1 | 0 | 1 | 0 | 4 |
| p0-t1-spirit-root-plains | 139 | 47 | 1.00 | 1.00 | 0.00 | 0.01 | 0.00 | 0 | 126 | 0 | 0 | 0 | 0 | 47 |
| p0-t2-spirit-light-plains | 196 | 37 | 1.00 | 0.95 | 0.04 | 0.11 | 0.04 | 1 | 168 | 1 | 1 | 0 | 1 | 34 |
| p0-t2-spirit-heavy-plains | 216 | 42 | 1.00 | 0.99 | 0.00 | 0.03 | 0.02 | 0 | 168 | 0 | 0 | 0 | 0 | 42 |
| p0-t1-spirit-root-forest | 142 | 38 | 0.30 | 0.37 | 0.36 | 0.71 | 0.12 | 16 | 107 | 16 | 4 | 7 | 4 | 7 |
| p0-t2-spirit-light-forest | 199 | 28 | 0.76 | 0.70 | 0.33 | 0.52 | 0.21 | 0 | 69 | 2 | 1 | 9 | 3 | 13 |
| p0-t2-spirit-heavy-forest | 221 | 34 | 0.96 | 0.77 | 0.26 | 0.34 | 0.12 | 1 | 80 | 2 | 0 | 8 | 6 | 18 |

## Largest single hits (burst watch list)

| cell | source | hit / maxHp | HP before |
|---|---|---:|---:|
| p0-t2-spirit-light-forest | Thorn Spitter | 0.19 | 0.89 |
| p0-t2-spirit-light-forest | Thorn Spitter | 0.19 | 0.53 |
| p0-t2-spirit-light-forest | Thorn Spitter | 0.19 | 0.94 |
| p0-t2-spirit-light-forest | Thorn Spitter | 0.19 | 0.95 |
| p0-t2-slinger-light-forest | Thorn Spitter | 0.18 | 1.00 |
| p0-t2-slinger-light-forest | Thorn Spitter | 0.18 | 1.00 |
| p0-t2-slinger-light-forest | Thorn Spitter | 0.18 | 1.00 |
| p0-t2-slinger-light-forest | Thorn Spitter | 0.18 | 1.00 |
| p0-t2-slinger-light-forest | Thorn Spitter | 0.18 | 1.00 |
| p0-t2-slinger-light-forest | Thorn Spitter | 0.18 | 1.00 |
| p0-t2-slinger-light-forest | Thorn Spitter | 0.18 | 1.00 |
| p0-t2-slinger-light-forest | Thorn Spitter | 0.18 | 1.00 |
| p0-t2-slinger-light-forest | Thorn Spitter | 0.18 | 1.00 |
| p0-t2-slinger-heavy-forest | Thorn Spitter | 0.16 | 1.00 |
| p0-t2-slinger-heavy-forest | Thorn Spitter | 0.16 | 1.00 |
