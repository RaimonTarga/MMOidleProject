# Phase 0 recovery pass — 2026-09-30T14:07:52.022Z

cap 300000 ms per cell per seed; seeds 101009, 101033; gear +3; Second Wind reference x1; PLAYER_RECOVERY 5; PLAYER_MAX_HP 100

Target: median fight-end HP 0.40–0.60, time in band > 0.50.

| cell | maxHp | fights | median end HP | mean end HP | time in band | lost/fight | healed/fight | deaths | kills | <20% | 20-40 | 40-60 | 60-80 | >=80 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| p0-t1-striker-root-plains | 159 | 46 | 0.96 | 0.94 | 0.04 | 0.20 | 0.11 | 0 | 155 | 0 | 0 | 0 | 1 | 45 |
| p0-t2-striker-light-plains | 225 | 45 | 0.98 | 0.95 | 0.07 | 0.26 | 0.19 | 0 | 173 | 0 | 0 | 0 | 2 | 43 |
| p0-t2-striker-heavy-plains | 251 | 39 | 0.99 | 0.98 | 0.00 | 0.20 | 0.16 | 0 | 170 | 0 | 0 | 0 | 0 | 39 |
| p0-t1-striker-root-forest | 163 | 39 | 0.78 | 0.71 | 0.42 | 0.48 | 0.18 | 0 | 81 | 1 | 1 | 14 | 7 | 16 |
| p0-t2-striker-light-forest | 230 | 32 | 0.67 | 0.64 | 0.50 | 0.79 | 0.43 | 1 | 67 | 2 | 3 | 6 | 15 | 6 |
| p0-t2-striker-heavy-forest | 255 | 30 | 0.60 | 0.58 | 0.53 | 0.79 | 0.37 | 2 | 76 | 3 | 4 | 8 | 8 | 7 |
| p0-t1-squire-root-plains | 176 | 31 | 0.97 | 0.96 | 0.01 | 0.24 | 0.18 | 0 | 155 | 0 | 0 | 0 | 0 | 31 |
| p0-t2-squire-light-plains | 250 | 44 | 1.00 | 0.99 | 0.01 | 0.16 | 0.14 | 0 | 168 | 0 | 0 | 0 | 0 | 44 |
| p0-t2-squire-heavy-plains | 281 | 35 | 1.00 | 0.99 | 0.00 | 0.18 | 0.17 | 0 | 149 | 0 | 0 | 0 | 0 | 35 |
| p0-t1-squire-root-forest | 179 | 47 | 0.89 | 0.86 | 0.14 | 0.26 | 0.11 | 0 | 93 | 1 | 0 | 4 | 3 | 39 |
| p0-t2-squire-light-forest | 254 | 27 | 0.64 | 0.66 | 0.48 | 0.77 | 0.43 | 0 | 62 | 0 | 2 | 2 | 17 | 6 |
| p0-t2-squire-heavy-forest | 286 | 33 | 0.82 | 0.85 | 0.20 | 0.46 | 0.31 | 0 | 68 | 0 | 0 | 0 | 15 | 18 |
| p0-t1-apprentice-root-plains | 151 | 47 | 1.00 | 0.97 | 0.02 | 0.09 | 0.05 | 0 | 116 | 0 | 0 | 0 | 3 | 44 |
| p0-t2-apprentice-light-plains | 214 | 38 | 0.93 | 0.93 | 0.02 | 0.23 | 0.14 | 0 | 120 | 0 | 0 | 0 | 1 | 37 |
| p0-t2-apprentice-heavy-plains | 241 | 38 | 0.96 | 0.93 | 0.03 | 0.23 | 0.15 | 0 | 134 | 0 | 0 | 0 | 2 | 36 |
| p0-t1-apprentice-root-forest | 155 | 32 | 0.34 | 0.38 | 0.49 | 0.76 | 0.16 | 7 | 85 | 10 | 9 | 6 | 1 | 6 |
| p0-t2-apprentice-light-forest | 218 | 27 | 0.64 | 0.50 | 0.44 | 0.80 | 0.30 | 5 | 60 | 10 | 3 | 0 | 1 | 13 |
| p0-t2-apprentice-heavy-forest | 244 | 26 | 0.81 | 0.66 | 0.38 | 0.63 | 0.29 | 1 | 50 | 3 | 4 | 3 | 1 | 15 |
| p0-t1-slinger-root-plains | 144 | 42 | 1.00 | 0.98 | 0.00 | 0.11 | 0.08 | 0 | 111 | 0 | 0 | 0 | 0 | 42 |
| p0-t2-slinger-light-plains | 205 | 38 | 0.99 | 0.97 | 0.02 | 0.21 | 0.17 | 0 | 163 | 0 | 0 | 0 | 0 | 38 |
| p0-t2-slinger-heavy-plains | 224 | 39 | 1.00 | 0.98 | 0.00 | 0.18 | 0.15 | 0 | 184 | 0 | 0 | 0 | 0 | 39 |
| p0-t1-slinger-root-forest | 148 | 34 | 0.41 | 0.50 | 0.48 | 0.68 | 0.23 | 4 | 72 | 6 | 10 | 4 | 3 | 11 |
| p0-t2-slinger-light-forest | 208 | 27 | 0.75 | 0.75 | 0.34 | 0.60 | 0.34 | 0 | 78 | 1 | 1 | 3 | 11 | 11 |
| p0-t2-slinger-heavy-forest | 227 | 31 | 0.83 | 0.80 | 0.28 | 0.44 | 0.25 | 0 | 78 | 0 | 1 | 2 | 12 | 16 |
| p0-t1-conduit-root-plains | 146 | 10 | 0.99 | 0.97 | 0.00 | 0.09 | 0.05 | 0 | 161 | 0 | 0 | 0 | 0 | 10 |
| p0-t2-conduit-light-plains | 207 | 15 | 0.98 | 0.94 | 0.00 | 0.14 | 0.08 | 0 | 187 | 0 | 0 | 0 | 1 | 14 |
| p0-t2-conduit-heavy-plains | 230 | 27 | 0.96 | 0.96 | 0.00 | 0.21 | 0.17 | 0 | 123 | 0 | 0 | 0 | 0 | 27 |
| p0-t1-conduit-root-forest | 149 | 26 | 0.74 | 0.69 | 0.35 | 0.44 | 0.13 | 1 | 92 | 1 | 2 | 2 | 15 | 6 |
| p0-t2-conduit-light-forest | 211 | 17 | 0.85 | 0.80 | 0.33 | 0.49 | 0.30 | 0 | 53 | 0 | 0 | 1 | 7 | 9 |
| p0-t2-conduit-heavy-forest | 233 | 5 | 0.85 | 0.77 | 0.50 | 0.28 | 0.10 | 0 | 64 | 0 | 1 | 0 | 1 | 3 |
| p0-t1-spirit-root-plains | 139 | 45 | 1.00 | 0.99 | 0.01 | 0.03 | 0.01 | 0 | 129 | 0 | 0 | 0 | 1 | 44 |
| p0-t2-spirit-light-plains | 196 | 34 | 1.00 | 0.95 | 0.04 | 0.10 | 0.05 | 1 | 169 | 1 | 0 | 0 | 2 | 31 |
| p0-t2-spirit-heavy-plains | 216 | 40 | 1.00 | 0.98 | 0.01 | 0.04 | 0.03 | 0 | 177 | 0 | 0 | 0 | 1 | 39 |
| p0-t1-spirit-root-forest | 142 | 35 | 0.56 | 0.58 | 0.29 | 0.50 | 0.09 | 5 | 86 | 6 | 4 | 8 | 3 | 14 |
| p0-t2-spirit-light-forest | 199 | 28 | 0.78 | 0.72 | 0.28 | 0.45 | 0.17 | 0 | 69 | 0 | 3 | 9 | 3 | 13 |
| p0-t2-spirit-heavy-forest | 221 | 30 | 0.66 | 0.74 | 0.27 | 0.42 | 0.16 | 0 | 84 | 0 | 2 | 7 | 8 | 13 |

## Largest single hits (burst watch list)

| cell | source | hit / maxHp | HP before |
|---|---|---:|---:|
| p0-t2-spirit-light-forest | Thorn Spitter | 0.19 | 0.93 |
| p0-t2-spirit-light-forest | Thorn Spitter | 0.19 | 0.95 |
| p0-t2-slinger-light-forest | Thorn Spitter | 0.18 | 1.00 |
| p0-t2-slinger-light-forest | Thorn Spitter | 0.18 | 0.52 |
| p0-t2-slinger-light-forest | Thorn Spitter | 0.18 | 0.46 |
| p0-t2-slinger-light-forest | Thorn Spitter | 0.18 | 1.00 |
| p0-t2-slinger-light-forest | Thorn Spitter | 0.18 | 1.00 |
| p0-t2-slinger-light-forest | Thorn Spitter | 0.18 | 1.00 |
| p0-t2-slinger-light-forest | Thorn Spitter | 0.18 | 1.00 |
| p0-t2-slinger-heavy-forest | Thorn Spitter | 0.16 | 1.00 |
| p0-t2-slinger-heavy-forest | Thorn Spitter | 0.16 | 1.00 |
| p0-t2-slinger-heavy-forest | Thorn Spitter | 0.16 | 1.00 |
| p0-t2-slinger-heavy-forest | Thorn Spitter | 0.16 | 0.71 |
| p0-t2-slinger-heavy-forest | Thorn Spitter | 0.16 | 1.00 |
| p0-t2-slinger-heavy-forest | Thorn Spitter | 0.16 | 1.00 |
