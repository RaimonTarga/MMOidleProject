# Executed bot results

T1 rows before bot-t1-final are superseded: they used the original candidate plus a historical server override, and funding metadata omitted that override. Only bot-t1-final uses corrected runtime lifetime prices and funding metadata. T2-T4 rows remain applicable. All times are simulated minutes. A dash means not observed before death or timeout, never zero. fixed3 grants +3 gear; buy starts with base gear on credit and calls the production upgrade function. These are synthetic single-node fixtures, not earned full progression routes. Separate batches retain their different rune policies and repeated prefixes.

| Batch | Arm | Mode | Runs | Mastered | Died | Actually bought full +3 | Actually bought full +5 |
|---|---|---|---:|---:|---:|---:|---:|
| bot-run | baseline | fixed3 | 16 | 4 | 14 | 0 | 0 |
| bot-run | baseline | buy | 16 | 2 | 14 | 2 | 0 |
| bot-run | candidate | fixed3 | 16 | 1 | 14 | 0 | 0 |
| bot-run | candidate | buy | 16 | 0 | 14 | 1 | 0 |
| bot-supported | baseline | fixed3 | 16 | 5 | 13 | 0 | 0 |
| bot-supported | baseline | buy | 16 | 3 | 13 | 3 | 0 |
| bot-supported | candidate | fixed3 | 16 | 1 | 13 | 0 | 0 |
| bot-supported | candidate | buy | 16 | 0 | 13 | 1 | 0 |
| bot-replicate | baseline | fixed3 | 6 | 3 | 3 | 0 | 0 |
| bot-replicate | baseline | buy | 6 | 2 | 4 | 2 | 0 |
| bot-replicate | candidate | fixed3 | 6 | 1 | 3 | 0 | 0 |
| bot-replicate | candidate | buy | 6 | 0 | 4 | 1 | 0 |
| bot-t1-extended | baseline | fixed3 | 4 | 3 | 1 | 0 | 0 |
| bot-t1-extended | baseline | buy | 4 | 3 | 2 | 3 | 2 |
| bot-t1-extended | candidate | fixed3 | 4 | 3 | 1 | 0 | 0 |
| bot-t1-extended | candidate | buy | 4 | 3 | 1 | 3 | 2 |
| bot-t1-final | baseline | fixed3 | 4 | 3 | 1 | 0 | 0 |
| bot-t1-final | baseline | buy | 4 | 3 | 2 | 3 | 2 |
| bot-t1-final | candidate | fixed3 | 4 | 3 | 1 | 0 | 0 |
| bot-t1-final | candidate | buy | 4 | 3 | 2 | 3 | 2 |

## Every completed observation

| Batch | Arm / mode | Node | Class | Seed | Mastery | Death | +3 funding | +5 funding | Actual +3 | Actual +5 |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| bot-run | baseline/buy | node-t1-cave-01 | cadence-root | 101009 | — | 0.56 | — | — | — | — |
| bot-run | baseline/buy | node-t1-cave-01 | dot-root | 101009 | — | 0.41 | — | — | — | — |
| bot-run | baseline/buy | node-t1-plains-01 | cadence-root | 101009 | 3.85 | — | 4.67 | — | 4.68 | — |
| bot-run | baseline/buy | node-t1-plains-01 | dot-root | 101009 | 4.59 | — | 5.58 | — | 5.58 | — |
| bot-run | baseline/buy | node-t2-desert-01 | cadence-root | 101009 | — | 0.17 | — | — | — | — |
| bot-run | baseline/buy | node-t2-desert-01 | dot-root | 101009 | — | 0.14 | — | — | — | — |
| bot-run | baseline/buy | node-t2-forest-01 | cadence-root | 101009 | — | 0.33 | — | — | — | — |
| bot-run | baseline/buy | node-t2-forest-01 | dot-root | 101009 | — | 0.21 | — | — | — | — |
| bot-run | baseline/buy | node-t3-swamp-01 | cadence-root | 101009 | — | 1.85 | — | — | — | — |
| bot-run | baseline/buy | node-t3-swamp-01 | dot-root | 101009 | — | 0.73 | — | — | — | — |
| bot-run | baseline/buy | node-t3-volcanic-01 | cadence-root | 101009 | — | 0.24 | — | — | — | — |
| bot-run | baseline/buy | node-t3-volcanic-01 | dot-root | 101009 | — | 0.28 | — | — | — | — |
| bot-run | baseline/buy | node-t4-mountain-01 | cadence-root | 101009 | — | 1.35 | — | — | — | — |
| bot-run | baseline/buy | node-t4-mountain-01 | dot-root | 101009 | — | 1.14 | — | — | — | — |
| bot-run | baseline/buy | node-t4-trench-01 | cadence-root | 101009 | — | 0.89 | — | — | — | — |
| bot-run | baseline/buy | node-t4-trench-01 | dot-root | 101009 | — | 0.23 | — | — | — | — |
| bot-run | baseline/fixed3 | node-t1-cave-01 | cadence-root | 101009 | — | 0.48 | — | — | — | — |
| bot-run | baseline/fixed3 | node-t1-cave-01 | dot-root | 101009 | — | 0.34 | — | — | — | — |
| bot-run | baseline/fixed3 | node-t1-plains-01 | cadence-root | 101009 | 3.50 | — | 4.43 | — | — | — |
| bot-run | baseline/fixed3 | node-t1-plains-01 | dot-root | 101009 | 4.70 | — | 5.72 | — | — | — |
| bot-run | baseline/fixed3 | node-t2-desert-01 | cadence-root | 101009 | — | 0.20 | — | — | — | — |
| bot-run | baseline/fixed3 | node-t2-desert-01 | dot-root | 101009 | — | 0.18 | — | — | — | — |
| bot-run | baseline/fixed3 | node-t2-forest-01 | cadence-root | 101009 | — | 0.45 | — | — | — | — |
| bot-run | baseline/fixed3 | node-t2-forest-01 | dot-root | 101009 | — | 0.25 | — | — | — | — |
| bot-run | baseline/fixed3 | node-t3-swamp-01 | cadence-root | 101009 | 4.69 | 18.71 | 11.71 | — | — | — |
| bot-run | baseline/fixed3 | node-t3-swamp-01 | dot-root | 101009 | — | 4.97 | — | — | — | — |
| bot-run | baseline/fixed3 | node-t3-volcanic-01 | cadence-root | 101009 | — | 1.41 | — | — | — | — |
| bot-run | baseline/fixed3 | node-t3-volcanic-01 | dot-root | 101009 | — | 0.85 | — | — | — | — |
| bot-run | baseline/fixed3 | node-t4-mountain-01 | cadence-root | 101009 | — | 1.26 | — | — | — | — |
| bot-run | baseline/fixed3 | node-t4-mountain-01 | dot-root | 101009 | — | 1.29 | — | — | — | — |
| bot-run | baseline/fixed3 | node-t4-trench-01 | cadence-root | 101009 | 4.46 | 108.00 | 22.62 | 67.34 | — | — |
| bot-run | baseline/fixed3 | node-t4-trench-01 | dot-root | 101009 | — | 0.98 | — | — | — | — |
| bot-run | candidate/buy | node-t1-cave-01 | cadence-root | 101009 | — | 0.56 | — | — | — | — |
| bot-run | candidate/buy | node-t1-cave-01 | dot-root | 101009 | — | 0.41 | — | — | — | — |
| bot-run | candidate/buy | node-t1-plains-01 | cadence-root | 101009 | — | — | 8.22 | — | 8.23 | — |
| bot-run | candidate/buy | node-t1-plains-01 | dot-root | 101009 | — | — | — | — | — | — |
| bot-run | candidate/buy | node-t2-desert-01 | cadence-root | 101009 | — | 0.17 | — | — | — | — |
| bot-run | candidate/buy | node-t2-desert-01 | dot-root | 101009 | — | 0.14 | — | — | — | — |
| bot-run | candidate/buy | node-t2-forest-01 | cadence-root | 101009 | — | 0.33 | — | — | — | — |
| bot-run | candidate/buy | node-t2-forest-01 | dot-root | 101009 | — | 0.21 | — | — | — | — |
| bot-run | candidate/buy | node-t3-swamp-01 | cadence-root | 101009 | — | 1.85 | — | — | — | — |
| bot-run | candidate/buy | node-t3-swamp-01 | dot-root | 101009 | — | 0.73 | — | — | — | — |
| bot-run | candidate/buy | node-t3-volcanic-01 | cadence-root | 101009 | — | 0.24 | — | — | — | — |
| bot-run | candidate/buy | node-t3-volcanic-01 | dot-root | 101009 | — | 0.28 | — | — | — | — |
| bot-run | candidate/buy | node-t4-mountain-01 | cadence-root | 101009 | — | 1.35 | — | — | — | — |
| bot-run | candidate/buy | node-t4-mountain-01 | dot-root | 101009 | — | 1.14 | — | — | — | — |
| bot-run | candidate/buy | node-t4-trench-01 | cadence-root | 101009 | — | 0.89 | — | — | — | — |
| bot-run | candidate/buy | node-t4-trench-01 | dot-root | 101009 | — | 0.23 | — | — | — | — |
| bot-run | candidate/fixed3 | node-t1-cave-01 | cadence-root | 101009 | — | 0.48 | — | — | — | — |
| bot-run | candidate/fixed3 | node-t1-cave-01 | dot-root | 101009 | — | 0.34 | — | — | — | — |
| bot-run | candidate/fixed3 | node-t1-plains-01 | cadence-root | 101009 | — | — | 7.98 | — | — | — |
| bot-run | candidate/fixed3 | node-t1-plains-01 | dot-root | 101009 | — | — | 9.70 | — | — | — |
| bot-run | candidate/fixed3 | node-t2-desert-01 | cadence-root | 101009 | — | 0.20 | — | — | — | — |
| bot-run | candidate/fixed3 | node-t2-desert-01 | dot-root | 101009 | — | 0.18 | — | — | — | — |
| bot-run | candidate/fixed3 | node-t2-forest-01 | cadence-root | 101009 | — | 0.45 | — | — | — | — |
| bot-run | candidate/fixed3 | node-t2-forest-01 | dot-root | 101009 | — | 0.25 | — | — | — | — |
| bot-run | candidate/fixed3 | node-t3-swamp-01 | cadence-root | 101009 | — | 18.71 | — | — | — | — |
| bot-run | candidate/fixed3 | node-t3-swamp-01 | dot-root | 101009 | — | 4.97 | — | — | — | — |
| bot-run | candidate/fixed3 | node-t3-volcanic-01 | cadence-root | 101009 | — | 1.41 | — | — | — | — |
| bot-run | candidate/fixed3 | node-t3-volcanic-01 | dot-root | 101009 | — | 0.85 | — | — | — | — |
| bot-run | candidate/fixed3 | node-t4-mountain-01 | cadence-root | 101009 | — | 1.26 | — | — | — | — |
| bot-run | candidate/fixed3 | node-t4-mountain-01 | dot-root | 101009 | — | 1.29 | — | — | — | — |
| bot-run | candidate/fixed3 | node-t4-trench-01 | cadence-root | 101009 | 51.46 | 108.00 | 49.38 | 74.65 | — | — |
| bot-run | candidate/fixed3 | node-t4-trench-01 | dot-root | 101009 | — | 0.98 | — | — | — | — |
| bot-supported | baseline/buy | node-t1-cave-01 | cadence-root | 101009 | 3.25 | — | 6.99 | — | 7.00 | — |
| bot-supported | baseline/buy | node-t1-cave-01 | dot-root | 101009 | — | 0.47 | — | — | — | — |
| bot-supported | baseline/buy | node-t1-plains-01 | cadence-root | 101009 | 4.14 | — | 5.09 | — | 5.10 | — |
| bot-supported | baseline/buy | node-t1-plains-01 | dot-root | 101009 | 6.32 | — | 7.61 | — | 7.62 | — |
| bot-supported | baseline/buy | node-t2-desert-01 | cadence-root | 101009 | — | 0.17 | — | — | — | — |
| bot-supported | baseline/buy | node-t2-desert-01 | dot-root | 101009 | — | 0.14 | — | — | — | — |
| bot-supported | baseline/buy | node-t2-forest-01 | cadence-root | 101009 | — | 0.74 | — | — | — | — |
| bot-supported | baseline/buy | node-t2-forest-01 | dot-root | 101009 | — | 0.21 | — | — | — | — |
| bot-supported | baseline/buy | node-t3-swamp-01 | cadence-root | 101009 | — | 1.37 | — | — | — | — |
| bot-supported | baseline/buy | node-t3-swamp-01 | dot-root | 101009 | — | 2.06 | — | — | — | — |
| bot-supported | baseline/buy | node-t3-volcanic-01 | cadence-root | 101009 | — | 0.24 | — | — | — | — |
| bot-supported | baseline/buy | node-t3-volcanic-01 | dot-root | 101009 | — | 0.27 | — | — | — | — |
| bot-supported | baseline/buy | node-t4-mountain-01 | cadence-root | 101009 | — | 1.35 | — | — | — | — |
| bot-supported | baseline/buy | node-t4-mountain-01 | dot-root | 101009 | — | 1.39 | — | — | — | — |
| bot-supported | baseline/buy | node-t4-trench-01 | cadence-root | 101009 | — | 0.89 | — | — | — | — |
| bot-supported | baseline/buy | node-t4-trench-01 | dot-root | 101009 | — | 0.23 | — | — | — | — |
| bot-supported | baseline/fixed3 | node-t1-cave-01 | cadence-root | 101009 | 2.93 | — | 6.62 | — | — | — |
| bot-supported | baseline/fixed3 | node-t1-cave-01 | dot-root | 101009 | — | 0.46 | — | — | — | — |
| bot-supported | baseline/fixed3 | node-t1-plains-01 | cadence-root | 101009 | 3.54 | — | 4.45 | — | — | — |
| bot-supported | baseline/fixed3 | node-t1-plains-01 | dot-root | 101009 | 5.08 | — | 6.23 | — | — | — |
| bot-supported | baseline/fixed3 | node-t2-desert-01 | cadence-root | 101009 | — | 0.20 | — | — | — | — |
| bot-supported | baseline/fixed3 | node-t2-desert-01 | dot-root | 101009 | — | 0.18 | — | — | — | — |
| bot-supported | baseline/fixed3 | node-t2-forest-01 | cadence-root | 101009 | — | 0.71 | — | — | — | — |
| bot-supported | baseline/fixed3 | node-t2-forest-01 | dot-root | 101009 | — | 0.25 | — | — | — | — |
| bot-supported | baseline/fixed3 | node-t3-swamp-01 | cadence-root | 101009 | — | 1.35 | — | — | — | — |
| bot-supported | baseline/fixed3 | node-t3-swamp-01 | dot-root | 101009 | — | 2.04 | — | — | — | — |
| bot-supported | baseline/fixed3 | node-t3-volcanic-01 | cadence-root | 101009 | — | 1.45 | — | — | — | — |
| bot-supported | baseline/fixed3 | node-t3-volcanic-01 | dot-root | 101009 | — | 1.41 | — | — | — | — |
| bot-supported | baseline/fixed3 | node-t4-mountain-01 | cadence-root | 101009 | 5.98 | 17.81 | — | — | — | — |
| bot-supported | baseline/fixed3 | node-t4-mountain-01 | dot-root | 101009 | — | 1.49 | — | — | — | — |
| bot-supported | baseline/fixed3 | node-t4-trench-01 | cadence-root | 101009 | 4.30 | 67.75 | 21.37 | 65.08 | — | — |
| bot-supported | baseline/fixed3 | node-t4-trench-01 | dot-root | 101009 | — | 1.49 | — | — | — | — |
| bot-supported | candidate/buy | node-t1-cave-01 | cadence-root | 101009 | — | — | — | — | — | — |
| bot-supported | candidate/buy | node-t1-cave-01 | dot-root | 101009 | — | 0.47 | — | — | — | — |
| bot-supported | candidate/buy | node-t1-plains-01 | cadence-root | 101009 | — | — | 9.06 | — | 9.07 | — |
| bot-supported | candidate/buy | node-t1-plains-01 | dot-root | 101009 | — | — | — | — | — | — |
| bot-supported | candidate/buy | node-t2-desert-01 | cadence-root | 101009 | — | 0.17 | — | — | — | — |
| bot-supported | candidate/buy | node-t2-desert-01 | dot-root | 101009 | — | 0.14 | — | — | — | — |
| bot-supported | candidate/buy | node-t2-forest-01 | cadence-root | 101009 | — | 0.74 | — | — | — | — |
| bot-supported | candidate/buy | node-t2-forest-01 | dot-root | 101009 | — | 0.21 | — | — | — | — |
| bot-supported | candidate/buy | node-t3-swamp-01 | cadence-root | 101009 | — | 1.37 | — | — | — | — |
| bot-supported | candidate/buy | node-t3-swamp-01 | dot-root | 101009 | — | 2.06 | — | — | — | — |
| bot-supported | candidate/buy | node-t3-volcanic-01 | cadence-root | 101009 | — | 0.24 | — | — | — | — |
| bot-supported | candidate/buy | node-t3-volcanic-01 | dot-root | 101009 | — | 0.27 | — | — | — | — |
| bot-supported | candidate/buy | node-t4-mountain-01 | cadence-root | 101009 | — | 1.35 | — | — | — | — |
| bot-supported | candidate/buy | node-t4-mountain-01 | dot-root | 101009 | — | 1.39 | — | — | — | — |
| bot-supported | candidate/buy | node-t4-trench-01 | cadence-root | 101009 | — | 0.89 | — | — | — | — |
| bot-supported | candidate/buy | node-t4-trench-01 | dot-root | 101009 | — | 0.23 | — | — | — | — |
| bot-supported | candidate/fixed3 | node-t1-cave-01 | cadence-root | 101009 | — | — | — | — | — | — |
| bot-supported | candidate/fixed3 | node-t1-cave-01 | dot-root | 101009 | — | 0.46 | — | — | — | — |
| bot-supported | candidate/fixed3 | node-t1-plains-01 | cadence-root | 101009 | — | — | 7.99 | — | — | — |
| bot-supported | candidate/fixed3 | node-t1-plains-01 | dot-root | 101009 | — | — | — | — | — | — |
| bot-supported | candidate/fixed3 | node-t2-desert-01 | cadence-root | 101009 | — | 0.20 | — | — | — | — |
| bot-supported | candidate/fixed3 | node-t2-desert-01 | dot-root | 101009 | — | 0.18 | — | — | — | — |
| bot-supported | candidate/fixed3 | node-t2-forest-01 | cadence-root | 101009 | — | 0.71 | — | — | — | — |
| bot-supported | candidate/fixed3 | node-t2-forest-01 | dot-root | 101009 | — | 0.25 | — | — | — | — |
| bot-supported | candidate/fixed3 | node-t3-swamp-01 | cadence-root | 101009 | — | 1.35 | — | — | — | — |
| bot-supported | candidate/fixed3 | node-t3-swamp-01 | dot-root | 101009 | — | 2.04 | — | — | — | — |
| bot-supported | candidate/fixed3 | node-t3-volcanic-01 | cadence-root | 101009 | — | 1.45 | — | — | — | — |
| bot-supported | candidate/fixed3 | node-t3-volcanic-01 | dot-root | 101009 | — | 1.41 | — | — | — | — |
| bot-supported | candidate/fixed3 | node-t4-mountain-01 | cadence-root | 101009 | — | 17.81 | — | — | — | — |
| bot-supported | candidate/fixed3 | node-t4-mountain-01 | dot-root | 101009 | — | 1.49 | — | — | — | — |
| bot-supported | candidate/fixed3 | node-t4-trench-01 | cadence-root | 101009 | 49.65 | 67.75 | 47.78 | — | — | — |
| bot-supported | candidate/fixed3 | node-t4-trench-01 | dot-root | 101009 | — | 1.49 | — | — | — | — |
| bot-replicate | baseline/buy | node-t1-plains-01 | cadence-root | 101033 | 4.31 | — | 5.37 | — | 5.38 | — |
| bot-replicate | baseline/buy | node-t1-plains-01 | dot-root | 101033 | 6.40 | — | 7.76 | — | 7.77 | — |
| bot-replicate | baseline/buy | node-t3-swamp-01 | cadence-root | 101033 | — | 0.95 | — | — | — | — |
| bot-replicate | baseline/buy | node-t3-swamp-01 | dot-root | 101033 | — | 1.46 | — | — | — | — |
| bot-replicate | baseline/buy | node-t4-trench-01 | cadence-root | 101033 | — | 2.72 | — | — | — | — |
| bot-replicate | baseline/buy | node-t4-trench-01 | dot-root | 101033 | — | 0.21 | — | — | — | — |
| bot-replicate | baseline/fixed3 | node-t1-plains-01 | cadence-root | 101033 | 3.67 | — | 4.45 | — | — | — |
| bot-replicate | baseline/fixed3 | node-t1-plains-01 | dot-root | 101033 | 5.16 | — | 6.29 | — | — | — |
| bot-replicate | baseline/fixed3 | node-t3-swamp-01 | cadence-root | 101033 | — | 1.04 | — | — | — | — |
| bot-replicate | baseline/fixed3 | node-t3-swamp-01 | dot-root | 101033 | — | 1.57 | — | — | — | — |
| bot-replicate | baseline/fixed3 | node-t4-trench-01 | cadence-root | 101033 | 4.45 | — | 21.92 | 63.43 | — | — |
| bot-replicate | baseline/fixed3 | node-t4-trench-01 | dot-root | 101033 | — | 2.44 | — | — | — | — |
| bot-replicate | candidate/buy | node-t1-plains-01 | cadence-root | 101033 | — | — | 9.30 | — | 9.30 | — |
| bot-replicate | candidate/buy | node-t1-plains-01 | dot-root | 101033 | — | — | — | — | — | — |
| bot-replicate | candidate/buy | node-t3-swamp-01 | cadence-root | 101033 | — | 0.95 | — | — | — | — |
| bot-replicate | candidate/buy | node-t3-swamp-01 | dot-root | 101033 | — | 1.46 | — | — | — | — |
| bot-replicate | candidate/buy | node-t4-trench-01 | cadence-root | 101033 | — | 2.72 | — | — | — | — |
| bot-replicate | candidate/buy | node-t4-trench-01 | dot-root | 101033 | — | 0.21 | — | — | — | — |
| bot-replicate | candidate/fixed3 | node-t1-plains-01 | cadence-root | 101033 | — | — | 8.07 | — | — | — |
| bot-replicate | candidate/fixed3 | node-t1-plains-01 | dot-root | 101033 | — | — | — | — | — | — |
| bot-replicate | candidate/fixed3 | node-t3-swamp-01 | cadence-root | 101033 | — | 1.04 | — | — | — | — |
| bot-replicate | candidate/fixed3 | node-t3-swamp-01 | dot-root | 101033 | — | 1.57 | — | — | — | — |
| bot-replicate | candidate/fixed3 | node-t4-trench-01 | cadence-root | 101033 | 49.10 | — | 46.96 | 70.55 | — | — |
| bot-replicate | candidate/fixed3 | node-t4-trench-01 | dot-root | 101033 | — | 2.44 | — | — | — | — |
| bot-t1-extended | baseline/buy | node-t1-cave-01 | cadence-root | 101009 | 3.25 | 20.39 | 6.99 | 17.49 | 7.00 | — |
| bot-t1-extended | baseline/buy | node-t1-cave-01 | dot-root | 101009 | — | 0.47 | — | — | — | — |
| bot-t1-extended | baseline/buy | node-t1-plains-01 | cadence-root | 101009 | 4.14 | — | 5.09 | 12.15 | 5.10 | 11.50 |
| bot-t1-extended | baseline/buy | node-t1-plains-01 | dot-root | 101009 | 6.32 | — | 7.61 | 17.02 | 7.62 | 16.12 |
| bot-t1-extended | baseline/fixed3 | node-t1-cave-01 | cadence-root | 101009 | 2.93 | — | 6.62 | 17.42 | — | — |
| bot-t1-extended | baseline/fixed3 | node-t1-cave-01 | dot-root | 101009 | — | 0.46 | — | — | — | — |
| bot-t1-extended | baseline/fixed3 | node-t1-plains-01 | cadence-root | 101009 | 3.54 | — | 4.45 | 11.70 | — | — |
| bot-t1-extended | baseline/fixed3 | node-t1-plains-01 | dot-root | 101009 | 5.08 | — | 6.23 | 17.29 | — | — |
| bot-t1-extended | candidate/buy | node-t1-cave-01 | cadence-root | 101009 | 11.34 | — | 13.12 | 19.20 | 13.13 | — |
| bot-t1-extended | candidate/buy | node-t1-cave-01 | dot-root | 101009 | — | 0.47 | — | — | — | — |
| bot-t1-extended | candidate/buy | node-t1-plains-01 | cadence-root | 101009 | 13.49 | — | 9.06 | 12.82 | 9.07 | 14.27 |
| bot-t1-extended | candidate/buy | node-t1-plains-01 | dot-root | 101009 | 21.39 | — | 14.02 | 20.34 | 14.03 | 22.10 |
| bot-t1-extended | candidate/fixed3 | node-t1-cave-01 | cadence-root | 101009 | 10.17 | — | 12.30 | 18.95 | — | — |
| bot-t1-extended | candidate/fixed3 | node-t1-cave-01 | dot-root | 101009 | — | 0.46 | — | — | — | — |
| bot-t1-extended | candidate/fixed3 | node-t1-plains-01 | cadence-root | 101009 | 12.29 | — | 7.99 | 11.70 | — | — |
| bot-t1-extended | candidate/fixed3 | node-t1-plains-01 | dot-root | 101009 | 18.06 | — | 11.59 | 17.29 | — | — |
| bot-t1-final | baseline/buy | node-t1-cave-01 | cadence-root | 101009 | 3.25 | 20.39 | 6.99 | 15.97 | 7.00 | — |
| bot-t1-final | baseline/buy | node-t1-cave-01 | dot-root | 101009 | — | 0.47 | — | — | — | — |
| bot-t1-final | baseline/buy | node-t1-plains-01 | cadence-root | 101009 | 4.14 | — | 5.09 | 11.50 | 5.10 | 11.50 |
| bot-t1-final | baseline/buy | node-t1-plains-01 | dot-root | 101009 | 6.32 | — | 7.61 | 16.11 | 7.62 | 16.12 |
| bot-t1-final | baseline/fixed3 | node-t1-cave-01 | cadence-root | 101009 | 2.93 | — | 6.62 | 15.97 | — | — |
| bot-t1-final | baseline/fixed3 | node-t1-cave-01 | dot-root | 101009 | — | 0.46 | — | — | — | — |
| bot-t1-final | baseline/fixed3 | node-t1-plains-01 | cadence-root | 101009 | 3.54 | — | 4.45 | 10.90 | — | — |
| bot-t1-final | baseline/fixed3 | node-t1-plains-01 | dot-root | 101009 | 5.08 | — | 6.23 | 15.68 | — | — |
| bot-t1-final | candidate/buy | node-t1-cave-01 | cadence-root | 101009 | 11.32 | 16.69 | 12.38 | — | 12.38 | — |
| bot-t1-final | candidate/buy | node-t1-cave-01 | dot-root | 101009 | — | 0.47 | — | — | — | — |
| bot-t1-final | candidate/buy | node-t1-plains-01 | cadence-root | 101009 | 13.56 | — | 8.54 | 12.45 | 8.62 | 13.57 |
| bot-t1-final | candidate/buy | node-t1-plains-01 | dot-root | 101009 | 20.66 | — | 13.08 | 18.55 | 13.35 | 20.67 |
| bot-t1-final | candidate/fixed3 | node-t1-cave-01 | cadence-root | 101009 | 10.17 | — | 11.33 | 17.71 | — | — |
| bot-t1-final | candidate/fixed3 | node-t1-cave-01 | dot-root | 101009 | — | 0.46 | — | — | — | — |
| bot-t1-final | candidate/fixed3 | node-t1-plains-01 | cadence-root | 101009 | 12.29 | — | 7.21 | 10.90 | — | — |
| bot-t1-final | candidate/fixed3 | node-t1-plains-01 | dot-root | 101009 | 18.06 | — | 10.90 | 15.68 | — | — |
