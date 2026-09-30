# Phase 0 recovery pass — 2026-09-30T15:08:48.931Z

cap 300000 ms per cell per seed; seeds 101009, 101033; gear +3; Second Wind reference x1; RECOVERY_BASE_FRACTION 0.05 of pools 100/130/200/330/560 (flat HP/s); OOC 0.1; PLAYER_MAX_HP 100

Target: median fight-end HP 0.40–0.60, time in band > 0.50.

| cell | maxHp | fights | median end HP | mean end HP | time in band | lost/fight | healed/fight | deaths | kills | <20% | 20-40 | 40-60 | 60-80 | >=80 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| p0-t3-striker-light-cave | 442 | 32 | 0.91 | 0.90 | 0.24 | 0.59 | 0.49 | 0 | 35 | 0 | 0 | 0 | 1 | 31 |
| p0-t3-striker-heavy-cave | 489 | 38 | 0.94 | 0.94 | 0.19 | 0.49 | 0.42 | 0 | 46 | 0 | 0 | 0 | 2 | 36 |
| p0-t3-striker-light-volcanic | 442 | 37 | 0.96 | 0.94 | 0.13 | 0.59 | 0.53 | 0 | 145 | 0 | 0 | 0 | 1 | 36 |
| p0-t3-striker-heavy-volcanic | 489 | 43 | 1.00 | 0.98 | 0.06 | 0.37 | 0.34 | 0 | 144 | 0 | 0 | 0 | 0 | 43 |
| p0-t4-striker-light-graveyard | 738 | 28 | 0.94 | 0.86 | 0.37 | 1.14 | 0.98 | 1 | 104 | 1 | 0 | 3 | 1 | 23 |
| p0-t4-striker-heavy-graveyard | 815 | 34 | 0.98 | 0.87 | 0.30 | 0.76 | 0.62 | 1 | 97 | 1 | 2 | 2 | 0 | 29 |
| p0-t4-striker-light-tundra | 825 | 19 | 0.86 | 0.84 | 0.15 | 1.13 | 0.97 | 0 | 19 | 0 | 0 | 0 | 6 | 13 |
| p0-t4-striker-heavy-tundra | 912 | 20 | 0.85 | 0.87 | 0.07 | 0.80 | 0.67 | 0 | 20 | 0 | 0 | 0 | 3 | 17 |
| p0-t3-squire-light-cave | 479 | 28 | 0.98 | 0.96 | 0.06 | 0.58 | 0.53 | 0 | 35 | 0 | 0 | 0 | 0 | 28 |
| p0-t3-squire-heavy-cave | 535 | 30 | 0.95 | 0.94 | 0.00 | 0.39 | 0.33 | 0 | 39 | 0 | 0 | 0 | 0 | 30 |
| p0-t3-squire-light-volcanic | 479 | 31 | 1.00 | 0.99 | 0.01 | 0.55 | 0.54 | 0 | 126 | 0 | 0 | 0 | 0 | 31 |
| p0-t3-squire-heavy-volcanic | 535 | 32 | 1.00 | 0.99 | 0.00 | 0.37 | 0.36 | 0 | 115 | 0 | 0 | 0 | 0 | 32 |
| p0-t4-squire-light-graveyard | 799 | 17 | 0.98 | 0.78 | 0.34 | 2.26 | 1.97 | 3 | 92 | 3 | 0 | 0 | 0 | 14 |
| p0-t4-squire-heavy-graveyard | 893 | 27 | 1.00 | 0.88 | 0.16 | 0.81 | 0.69 | 2 | 83 | 3 | 0 | 0 | 0 | 24 |
| p0-t4-squire-light-tundra | 894 | 17 | 0.97 | 0.95 | 0.01 | 0.90 | 0.85 | 0 | 19 | 0 | 0 | 0 | 0 | 17 |
| p0-t4-squire-heavy-tundra | 998 | 20 | 1.00 | 0.97 | 0.00 | 0.46 | 0.42 | 0 | 19 | 0 | 0 | 0 | 0 | 20 |
| p0-t3-apprentice-light-cave | 410 | 29 | 0.86 | 0.81 | 0.22 | 0.43 | 0.24 | 0 | 30 | 1 | 0 | 0 | 12 | 16 |
| p0-t3-apprentice-heavy-cave | 456 | 25 | 0.87 | 0.81 | 0.12 | 0.49 | 0.28 | 0 | 27 | 0 | 1 | 1 | 5 | 18 |
| p0-t3-apprentice-light-volcanic | 410 | 29 | 0.85 | 0.84 | 0.21 | 0.63 | 0.46 | 0 | 92 | 0 | 0 | 1 | 12 | 16 |
| p0-t3-apprentice-heavy-volcanic | 456 | 26 | 0.89 | 0.85 | 0.28 | 0.65 | 0.50 | 0 | 68 | 0 | 0 | 2 | 5 | 19 |
| p0-t4-apprentice-light-graveyard | 683 | 29 | 0.83 | 0.59 | 0.26 | 1.05 | 0.63 | 9 | 65 | 9 | 1 | 0 | 4 | 15 |
| p0-t4-apprentice-heavy-graveyard | 760 | 27 | 0.91 | 0.66 | 0.31 | 0.97 | 0.63 | 5 | 72 | 6 | 1 | 2 | 2 | 16 |
| p0-t4-apprentice-light-tundra | 764 | 13 | 0.74 | 0.68 | 0.19 | 0.77 | 0.46 | 0 | 11 | 1 | 2 | 1 | 4 | 5 |
| p0-t4-apprentice-heavy-tundra | 850 | 15 | 0.75 | 0.59 | 0.27 | 0.88 | 0.49 | 1 | 14 | 4 | 1 | 1 | 5 | 4 |
| p0-t3-slinger-light-cave | 393 | 25 | 0.85 | 0.86 | 0.23 | 0.50 | 0.36 | 0 | 28 | 0 | 0 | 1 | 8 | 16 |
| p0-t3-slinger-heavy-cave | 427 | 31 | 0.97 | 0.91 | 0.09 | 0.23 | 0.14 | 0 | 34 | 0 | 0 | 1 | 5 | 25 |
| p0-t3-slinger-light-volcanic | 393 | 30 | 0.97 | 0.92 | 0.13 | 0.57 | 0.47 | 0 | 104 | 0 | 0 | 1 | 1 | 28 |
| p0-t3-slinger-heavy-volcanic | 427 | 31 | 0.95 | 0.91 | 0.13 | 0.53 | 0.41 | 0 | 112 | 0 | 0 | 1 | 4 | 26 |
| p0-t4-slinger-light-graveyard | 655 | 26 | 0.91 | 0.83 | 0.13 | 0.79 | 0.58 | 2 | 69 | 2 | 0 | 1 | 1 | 22 |
| p0-t4-slinger-heavy-graveyard | 711 | 29 | 0.91 | 0.73 | 0.17 | 0.83 | 0.53 | 6 | 72 | 6 | 0 | 1 | 0 | 22 |
| p0-t4-slinger-light-tundra | 734 | 14 | 0.67 | 0.73 | 0.12 | 0.63 | 0.37 | 0 | 16 | 0 | 0 | 2 | 8 | 4 |
| p0-t4-slinger-heavy-tundra | 795 | 14 | 0.97 | 0.87 | 0.05 | 0.34 | 0.20 | 0 | 14 | 0 | 0 | 1 | 5 | 8 |
| p0-t3-conduit-light-cave | 403 | 0 | — | — | — | 0.00 | 0.00 | 0 | 27 | 0 | 0 | 0 | 0 | 0 |
| p0-t3-conduit-heavy-cave | 442 | 18 | 0.93 | 0.89 | 0.10 | 0.34 | 0.23 | 0 | 26 | 0 | 0 | 0 | 4 | 14 |
| p0-t3-conduit-light-volcanic | 403 | 15 | 0.94 | 0.93 | 0.09 | 0.47 | 0.40 | 0 | 114 | 0 | 0 | 0 | 1 | 14 |
| p0-t3-conduit-heavy-volcanic | 442 | 26 | 0.95 | 0.91 | 0.15 | 0.47 | 0.37 | 0 | 86 | 0 | 0 | 0 | 4 | 22 |
| p0-t4-conduit-light-graveyard | 672 | 12 | 0.90 | 0.73 | 0.39 | 1.75 | 1.49 | 2 | 67 | 2 | 0 | 1 | 1 | 8 |
| p0-t4-conduit-heavy-graveyard | 738 | 30 | 0.95 | 0.77 | 0.26 | 0.76 | 0.53 | 5 | 46 | 5 | 0 | 0 | 3 | 22 |
| p0-t4-conduit-light-tundra | 752 | 0 | — | — | — | 0.00 | 0.00 | 0 | 13 | 0 | 0 | 0 | 0 | 0 |
| p0-t4-conduit-heavy-tundra | 825 | 6 | 0.77 | 0.77 | 0.46 | 0.67 | 0.44 | 0 | 16 | 0 | 0 | 2 | 1 | 3 |
| p0-t3-spirit-light-cave | 376 | 28 | 1.00 | 0.95 | 0.02 | 0.08 | 0.02 | 0 | 41 | 0 | 0 | 0 | 1 | 27 |
| p0-t3-spirit-heavy-cave | 413 | 35 | 1.00 | 0.98 | 0.01 | 0.04 | 0.03 | 0 | 50 | 0 | 0 | 0 | 0 | 35 |
| p0-t3-spirit-light-volcanic | 376 | 35 | 1.00 | 0.91 | 0.07 | 0.26 | 0.16 | 0 | 121 | 1 | 0 | 0 | 4 | 30 |
| p0-t3-spirit-heavy-volcanic | 413 | 37 | 0.96 | 0.93 | 0.03 | 0.22 | 0.14 | 0 | 127 | 0 | 0 | 0 | 4 | 33 |
| p0-t4-spirit-light-graveyard | 628 | 26 | 0.90 | 0.64 | 0.23 | 0.92 | 0.55 | 7 | 84 | 7 | 1 | 1 | 1 | 16 |
| p0-t4-spirit-heavy-graveyard | 689 | 29 | 0.94 | 0.71 | 0.34 | 0.81 | 0.51 | 4 | 95 | 4 | 3 | 2 | 2 | 18 |
| p0-t4-spirit-light-tundra | 702 | 10 | 0.85 | 0.81 | 0.04 | 0.39 | 0.19 | 0 | 14 | 0 | 0 | 3 | 2 | 5 |
| p0-t4-spirit-heavy-tundra | 771 | 13 | 0.87 | 0.80 | 0.06 | 0.53 | 0.24 | 0 | 23 | 0 | 1 | 2 | 1 | 9 |

## Largest single hits (burst watch list)

| cell | source | hit / maxHp | HP before |
|---|---|---:|---:|
| p0-t3-slinger-heavy-cave | Cavern Troll | 0.59 | 1.00 |
| p0-t3-slinger-heavy-cave | Cavern Troll | 0.59 | 0.84 |
| p0-t3-striker-light-cave | Cavern Troll | 0.45 | 1.00 |
| p0-t3-striker-light-cave | Cavern Troll | 0.45 | 1.00 |
| p0-t3-apprentice-heavy-cave | Cavern Troll | 0.42 | 0.62 |
| p0-t3-conduit-heavy-cave | Cavern Troll | 0.40 | 1.00 |
| p0-t3-striker-heavy-cave | Cavern Troll | 0.39 | 1.00 |
| p0-t3-striker-heavy-cave | Cavern Troll | 0.39 | 1.00 |
| p0-t3-striker-heavy-cave | Cavern Troll | 0.39 | 1.00 |
| p0-t3-striker-heavy-cave | Cavern Troll | 0.39 | 1.00 |
| p0-t3-striker-heavy-cave | Cavern Troll | 0.39 | 1.00 |
| p0-t4-slinger-light-tundra | Rime-Tusk Mastodon | 0.39 | 1.00 |
| p0-t4-slinger-light-tundra | Rime-Tusk Mastodon | 0.38 | 1.00 |
| p0-t4-slinger-light-tundra | Rime-Tusk Mastodon | 0.37 | 1.00 |
| p0-t4-spirit-light-tundra | Glacial Dire-Bear | 0.37 | 1.00 |
