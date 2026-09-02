# T1 Economy Factorial Experiment

Batch: `bot\runs\t1-economy-factorial-2026-09-01-r2\batch-2026-09-01T06-29-28-708Z`  
Revision: `721d2b57`  
Experiment: `t1-economy-factorial-2026-09-01` / `t1-economy-factorial-2026-09-01-r1`  
Runs: **78/80** route artifacts; **76/80** completed; launch mode `uncontrolled-parallel`, stagger 5 minutes.

Fixed conditions: reward multiplier 2×, catalyst progress decoupled from multiplier, primary routes only, and no family-specific catalyst rates. The shared-world/debug taints are expected under the requested conditions.

## Arm/class results

| Arm | Class | Artifacts / scheduled | Completion | Runtime mean / median / range (min) | All-biomes maxed (mean) | Gear +5 (mean) | Maxed → +5 (mean) | Resource block (mean) | Essence-only | Catalyst-only | Mixed | Boss/dungeon | Deaths |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| C | apprentice | 4/5 | 80% | 110.8 / 104.7 / 96.0–142.8 | 57.9 | 75.0 | 17.1 | 34.6 | 28.2 | 0.0 | 6.4 | 35.7 | 6.3 |
| C | conduit | 5/5 | 100% | 109.9 / 108.5 / 102.3–117.4 | 58.7 | 72.3 | 13.6 | 27.2 | 20.6 | 0.0 | 6.4 | 37.5 | 5.6 |
| C | squire | 5/5 | 100% | 90.7 / 89.7 / 86.3–98.3 | 50.2 | 61.4 | 11.1 | 20.8 | 14.8 | 0.0 | 6.0 | 29.2 | 4.6 |
| C | striker | 5/5 | 100% | 95.6 / 90.1 / 71.2–140.5 | 45.1 | 54.6 | 9.4 | 20.0 | 14.7 | 0.0 | 5.3 | 40.9 | 4.6 |
| D | apprentice | 5/5 | 80% | 87.7 / 98.2 / 24.1–118.5 | 57.5 | 72.5 | 15.0 | 26.8 | 21.6 | 0.0 | 5.1 | 24.8 | 6.8 |
| D | conduit | 4/5 | 80% | 131.6 / 132.9 / 115.0–157.6 | 59.9 | 70.3 | 10.4 | 24.5 | 18.1 | 0.0 | 6.3 | 61.2 | 5.8 |
| D | squire | 5/5 | 100% | 104.4 / 106.9 / 79.8–129.5 | 48.6 | 58.5 | 9.9 | 20.7 | 15.1 | 0.0 | 5.6 | 45.8 | 5.8 |
| D | striker | 5/5 | 100% | 93.9 / 89.9 / 76.2–129.5 | 43.9 | 52.7 | 8.8 | 17.9 | 12.5 | 0.0 | 5.4 | 41.1 | 5.4 |
| E | apprentice | 5/5 | 100% | 116.1 / 122.9 / 101.9–126.6 | 61.3 | 83.6 | 22.3 | 39.5 | 24.2 | 0.0 | 15.3 | 32.3 | 8.4 |
| E | conduit | 5/5 | 100% | 124.4 / 122.2 / 119.0–131.1 | 62.2 | 78.1 | 15.9 | 30.2 | 14.4 | 0.0 | 15.9 | 46.2 | 5.6 |
| E | squire | 5/5 | 100% | 115.6 / 114.8 / 108.0–127.1 | 51.7 | 66.3 | 14.6 | 25.1 | 10.5 | 0.0 | 14.6 | 49.1 | 7.0 |
| E | striker | 5/5 | 100% | 91.1 / 81.7 / 75.9–111.5 | 42.3 | 56.3 | 14.0 | 23.6 | 9.7 | 0.0 | 13.9 | 34.7 | 4.2 |
| F | apprentice | 5/5 | 80% | 91.1 / 96.7 / 54.6–104.7 | 55.4 | 73.9 | 18.5 | 29.5 | 19.3 | 0.0 | 10.2 | 20.9 | 4.8 |
| F | conduit | 5/5 | 100% | 122.7 / 125.4 / 108.7–137.9 | 59.9 | 74.4 | 14.5 | 27.6 | 13.2 | 0.0 | 14.4 | 48.2 | 5.8 |
| F | squire | 5/5 | 100% | 113.7 / 111.5 / 89.5–142.4 | 48.9 | 62.8 | 13.8 | 23.0 | 9.7 | 0.0 | 13.3 | 50.8 | 4.8 |
| F | striker | 5/5 | 100% | 91.3 / 90.4 / 82.0–103.6 | 45.4 | 57.8 | 12.4 | 22.6 | 10.2 | 0.0 | 12.3 | 33.4 | 5.6 |

Times are minutes from each run start; block columns are mean minutes per run. Runtime statistics use every available route artifact, including stalled runs; milestone statistics use runs that reached that milestone. Final wallet columns below are mean wallets at run end.

## Factor-level comparison

| Arm | Artifacts / scheduled | Completion | Runtime mean (min) | Resource block mean (min) | Essence-only | Catalyst-only | Mixed | All-biomes → +5 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| C | 19/20 | 95% | 101.3 | 25.2 | 19.1 | 0.0 | 6.0 | 12.6 |
| D | 19/20 | 90% | 103.0 | 22.4 | 16.8 | 0.0 | 5.6 | 10.8 |
| E | 20/20 | 100% | 111.8 | 29.6 | 14.7 | 0.0 | 14.9 | 16.7 |
| F | 20/20 | 95% | 104.7 | 25.7 | 13.1 | 0.0 | 12.6 | 14.6 |

## Decision readout

1. **×0.60 pricing does not materially reach the ≤60-minute terminal target.** The balanced arm-mean runtime effect of D/F versus C/E is -2.7 minutes, while the resource-block effect is -3.4 minutes and the all-biomes→+5 effect is -1.9 minutes. No completed terminal route finished within 60 minutes (0/76).

2. **Threshold 200 creates meaningful scarcity.** Compared with C/D, E/F reduce end-of-run fortified stockpiles and add targeted modifier farming: alacrity averages 6.0→8.5 minutes, heavy 0.0→3.6, and swarming 0.0→2.0.

3. **It does not create excessive catalyst-only waiting.** Catalyst-only block time is zero in all 78 route artifacts, including zero runs with ≥10 minutes. Threshold 200 does, however, increase mixed essence+catalyst waiting by about 8.0 minutes/run; 38 artifacts have at least 10 minutes of mixed waiting.

4. **There is a scarcity interaction, but catalysts become a co-gate rather than a standalone gate.** F versus E reduces essence-only and mixed block time while retaining threshold-200 catalyst hunts; no catalyst-only deadlock was observed.

5. **No arm meets the full 45–55-minute terminal target.** D is closest on the all-biomes→+5 economy milestone, but its threshold-150 catalyst stockpiles do not support the intended rare-key role. F is the best combined candidate for purposeful friction because it retains threshold-200 scarcity, has short targeted hunts, and has no catalyst-only waits; it still needs a separate pacing/combat investigation before adoption.


## Wallets and catalyst-family detail

The machine-readable JSON contains per-run final essence/catalyst wallets and per-family first acquisition, first +5 eligibility inventory, targeted modifier-farming duration, and T1-completion inventory. The arm/class rows below expose the mean final wallets.

| Arm | Class | Mean final essence wallet | Mean final catalyst wallet |
|---|---|---|---|
| C | apprentice | {"red":427,"blue":385.5,"green":499,"yellow":591.5,"purple":347.75} | {"fortified":5,"swarming":0,"heavy":1,"alacrity":0} |
| C | conduit | {"red":324.8,"blue":352,"green":427.8,"yellow":568.8,"purple":397.8} | {"fortified":4.4,"swarming":0,"heavy":0.2,"alacrity":0} |
| C | squire | {"red":400.6,"blue":391.8,"green":436.8,"yellow":522,"purple":381.4} | {"fortified":4.8,"swarming":0,"heavy":0.6,"alacrity":0} |
| C | striker | {"red":392.6,"blue":351,"green":477,"yellow":557.2,"purple":418.6} | {"fortified":4.6,"swarming":0,"heavy":0,"alacrity":0} |
| D | apprentice | {"red":302,"blue":287.6,"green":393,"yellow":554.2,"purple":273.2} | {"fortified":3.6,"swarming":0,"heavy":0.2,"alacrity":0} |
| D | conduit | {"red":501.75,"blue":535.75,"green":451.5,"yellow":520.5,"purple":399} | {"fortified":4,"swarming":0,"heavy":0.25,"alacrity":0} |
| D | squire | {"red":681,"blue":365.4,"green":451,"yellow":638.4,"purple":409.2} | {"fortified":5,"swarming":0,"heavy":0.2,"alacrity":0} |
| D | striker | {"red":505.2,"blue":291.2,"green":444.8,"yellow":530.4,"purple":412.6} | {"fortified":4.6,"swarming":0,"heavy":0,"alacrity":0} |
| E | apprentice | {"red":525.4,"blue":355.4,"green":476,"yellow":580.4,"purple":417.2} | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | conduit | {"red":422,"blue":318.2,"green":426.6,"yellow":634.4,"purple":449.6} | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | squire | {"red":565,"blue":423,"green":517.6,"yellow":594.8,"purple":518.6} | {"fortified":3.2,"swarming":0,"alacrity":0,"heavy":0} |
| E | striker | {"red":359.6,"blue":303,"green":470.4,"yellow":598.8,"purple":395.6} | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | apprentice | {"red":361.6,"blue":285.8,"green":442.2,"yellow":590.8,"purple":269.8} | {"fortified":2.8,"swarming":0,"alacrity":0,"heavy":0} |
| F | conduit | {"red":464.2,"blue":339,"green":434,"yellow":866,"purple":502.2} | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | squire | {"red":466.8,"blue":401.8,"green":477.8,"yellow":876.4,"purple":508.4} | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | striker | {"red":355.2,"blue":340.4,"green":470.6,"yellow":600,"purple":391} | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |

### Catalyst-family metrics

| Arm | Class | Family | Corresponding +5 item | First acquisition (mean min) | First +5 eligibility (mean min) | Inventory at eligibility (mean) | Targeted farming necessary | Targeted farm duration (mean min) | Catalyst inventory at T1 completion (mean) |
|---|---|---|---|---:|---:|---|---:|---:|---|
| C | apprentice | alacrity | plains-vest-t1 | 66.5 | 66.5 | {"fortified":5,"swarming":0,"heavy":1,"alacrity":1} | 4/4 | 6.4 | {"fortified":4.75,"swarming":0,"heavy":0,"alacrity":0} |
| C | apprentice | fortified | swamp-vest-t1 | 10.3 | 74.1 | {"fortified":5.5,"swarming":0,"heavy":0,"alacrity":0} | 0/4 | 0.0 | {"fortified":4.75,"swarming":0,"heavy":0,"alacrity":0} |
| C | apprentice | heavy | mountain-vest-t1 | 45.4 | 70.1 | {"fortified":5,"swarming":0,"heavy":1,"alacrity":0} | 0/4 | 0.0 | {"fortified":4.75,"swarming":0,"heavy":0,"alacrity":0} |
| C | apprentice | swarming | chaotic-axe | 35.1 | 59.2 | {"fortified":5,"swarming":1,"heavy":1} | 0/4 | 0.0 | {"fortified":4.75,"swarming":0,"heavy":0,"alacrity":0} |
| C | conduit | alacrity | plains-vest-t1 | 69.0 | 69.0 | {"fortified":4,"swarming":0,"heavy":1,"alacrity":1} | 5/5 | 6.4 | {"fortified":4,"swarming":0,"heavy":0,"alacrity":0} |
| C | conduit | fortified | — | 14.0 | — | {} | 0/5 | 0.0 | {"fortified":4,"swarming":0,"heavy":0,"alacrity":0} |
| C | conduit | heavy | mountain-vest-t1 | 48.5 | 72.2 | {"fortified":4,"swarming":0,"heavy":1,"alacrity":0} | 0/5 | 0.0 | {"fortified":4,"swarming":0,"heavy":0,"alacrity":0} |
| C | conduit | swarming | chaotic-axe | 39.2 | 62.5 | {"fortified":4,"swarming":1,"heavy":1} | 0/5 | 0.0 | {"fortified":4,"swarming":0,"heavy":0,"alacrity":0} |
| C | squire | alacrity | plains-vest-t1 | 58.5 | 58.5 | {"fortified":4.6,"swarming":0,"heavy":1,"alacrity":1} | 5/5 | 6.0 | {"fortified":4.8,"swarming":0,"heavy":0,"alacrity":0} |
| C | squire | fortified | — | 8.8 | — | {} | 0/5 | 0.0 | {"fortified":4.8,"swarming":0,"heavy":0,"alacrity":0} |
| C | squire | heavy | mountain-vest-t1 | 41.7 | 61.4 | {"fortified":4.8,"swarming":0,"heavy":1,"alacrity":0} | 0/5 | 0.0 | {"fortified":4.8,"swarming":0,"heavy":0,"alacrity":0} |
| C | squire | swarming | chaotic-axe | 29.7 | 52.4 | {"fortified":4.2,"swarming":1,"heavy":1} | 0/5 | 0.0 | {"fortified":4.8,"swarming":0,"heavy":0,"alacrity":0} |
| C | striker | alacrity | plains-vest-t1 | 52.0 | 52.0 | {"fortified":4.2,"swarming":0,"heavy":1,"alacrity":1} | 5/5 | 5.3 | {"fortified":4.2,"swarming":0,"heavy":0,"alacrity":0} |
| C | striker | fortified | — | 8.0 | — | {} | 0/5 | 0.0 | {"fortified":4.2,"swarming":0,"heavy":0,"alacrity":0} |
| C | striker | heavy | mountain-vest-t1 | 35.7 | 54.6 | {"fortified":4.2,"swarming":0,"heavy":1,"alacrity":0} | 0/5 | 0.0 | {"fortified":4.2,"swarming":0,"heavy":0,"alacrity":0} |
| C | striker | swarming | chaotic-axe | 26.6 | 46.8 | {"fortified":4,"swarming":1,"heavy":1} | 0/5 | 0.0 | {"fortified":4.2,"swarming":0,"heavy":0,"alacrity":0} |
| D | apprentice | alacrity | plains-vest-t1 | 65.6 | 65.6 | {"fortified":5,"swarming":0,"heavy":1,"alacrity":1} | 4/5 | 6.4 | {"fortified":4.25,"swarming":0,"heavy":0,"alacrity":0} |
| D | apprentice | fortified | swamp-vest-t1 | 10.0 | 71.2 | {"fortified":4,"swarming":0,"heavy":0,"alacrity":0} | 0/5 | 0.0 | {"fortified":3.4,"swarming":0,"heavy":0,"alacrity":0} |
| D | apprentice | heavy | mountain-vest-t1 | 46.3 | 68.1 | {"fortified":5,"swarming":0,"heavy":1,"alacrity":0} | 0/5 | 0.0 | {"fortified":4.25,"swarming":0,"heavy":0,"alacrity":0} |
| D | apprentice | swarming | chaotic-axe | 36.5 | 58.8 | {"fortified":5,"swarming":1,"heavy":1} | 0/5 | 0.0 | {"fortified":4.25,"swarming":0,"heavy":0,"alacrity":0} |
| D | conduit | alacrity | plains-vest-t1 | 67.7 | 67.7 | {"fortified":4,"swarming":0,"heavy":1,"alacrity":1} | 4/4 | 6.3 | {"fortified":4,"swarming":0,"heavy":0,"alacrity":0} |
| D | conduit | fortified | — | 13.2 | — | {} | 0/4 | 0.0 | {"fortified":4,"swarming":0,"heavy":0,"alacrity":0} |
| D | conduit | heavy | mountain-vest-t1 | 49.1 | 70.3 | {"fortified":4,"swarming":0,"heavy":1,"alacrity":0} | 0/4 | 0.0 | {"fortified":4,"swarming":0,"heavy":0,"alacrity":0} |
| D | conduit | swarming | chaotic-axe | 38.9 | 61.3 | {"fortified":4,"swarming":1,"heavy":1} | 0/4 | 0.0 | {"fortified":4,"swarming":0,"heavy":0,"alacrity":0} |
| D | squire | alacrity | plains-vest-t1 | 56.0 | 56.0 | {"fortified":4,"swarming":0,"heavy":1,"alacrity":1} | 5/5 | 5.6 | {"fortified":4,"swarming":0,"heavy":0,"alacrity":0} |
| D | squire | fortified | — | 8.8 | — | {} | 0/5 | 0.0 | {"fortified":4,"swarming":0,"heavy":0,"alacrity":0} |
| D | squire | heavy | mountain-vest-t1 | 39.8 | 58.5 | {"fortified":4,"swarming":0,"heavy":1,"alacrity":0} | 0/5 | 0.0 | {"fortified":4,"swarming":0,"heavy":0,"alacrity":0} |
| D | squire | swarming | chaotic-axe | 29.3 | 50.4 | {"fortified":4,"swarming":1,"heavy":1} | 0/5 | 0.0 | {"fortified":4,"swarming":0,"heavy":0,"alacrity":0} |
| D | striker | alacrity | plains-vest-t1 | 50.7 | 50.7 | {"fortified":4,"swarming":0,"heavy":1,"alacrity":1} | 5/5 | 5.4 | {"fortified":4.2,"swarming":0,"heavy":0,"alacrity":0} |
| D | striker | fortified | — | 8.5 | — | {} | 0/5 | 0.0 | {"fortified":4.2,"swarming":0,"heavy":0,"alacrity":0} |
| D | striker | heavy | mountain-vest-t1 | 36.8 | 52.7 | {"fortified":4.2,"swarming":0,"heavy":1,"alacrity":0} | 0/5 | 0.0 | {"fortified":4.2,"swarming":0,"heavy":0,"alacrity":0} |
| D | striker | swarming | chaotic-axe | 27.8 | 45.3 | {"fortified":4,"swarming":1,"heavy":1} | 0/5 | 0.0 | {"fortified":4.2,"swarming":0,"heavy":0,"alacrity":0} |
| E | apprentice | alacrity | plains-vest-t1 | 73.9 | 73.9 | {"fortified":3,"swarming":0,"alacrity":1} | 5/5 | 9.0 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | apprentice | fortified | swamp-vest-t1 | 13.0 | 82.4 | {"fortified":3.6,"swarming":0,"alacrity":0,"heavy":0} | 0/5 | 0.0 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | apprentice | heavy | mountain-vest-t1 | 76.6 | 78.1 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":1} | 5/5 | 4.2 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | apprentice | swarming | chaotic-axe | 62.2 | 63.5 | {"fortified":3,"swarming":1} | 5/5 | 2.2 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | conduit | alacrity | plains-vest-t1 | 74.0 | 74.0 | {"fortified":3,"swarming":0,"alacrity":1} | 5/5 | 9.9 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | conduit | fortified | — | 19.8 | — | {} | 0/5 | 0.0 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | conduit | heavy | mountain-vest-t1 | 76.3 | 78.0 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":1} | 5/5 | 4.0 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | conduit | swarming | chaotic-axe | 63.2 | 64.2 | {"fortified":3,"swarming":1} | 5/5 | 2.0 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | squire | alacrity | plains-vest-t1 | 62.6 | 62.6 | {"fortified":3,"swarming":0,"alacrity":1} | 5/5 | 8.3 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | squire | fortified | — | 10.8 | — | {} | 0/5 | 0.0 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | squire | heavy | mountain-vest-t1 | 65.2 | 66.3 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":1} | 5/5 | 3.7 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | squire | swarming | chaotic-axe | 53.2 | 54.3 | {"fortified":3,"swarming":1} | 5/5 | 2.6 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | striker | alacrity | plains-vest-t1 | 52.4 | 52.4 | {"fortified":3,"swarming":0,"alacrity":1} | 5/5 | 8.1 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | striker | fortified | — | 9.8 | — | {} | 0/5 | 0.0 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | striker | heavy | mountain-vest-t1 | 55.8 | 56.2 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":1} | 5/5 | 3.8 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| E | striker | swarming | chaotic-axe | 43.3 | 44.4 | {"fortified":3,"swarming":1} | 5/5 | 2.1 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | apprentice | alacrity | plains-vest-t1 | 66.1 | 66.1 | {"fortified":3,"swarming":0,"alacrity":1} | 4/5 | 7.7 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | apprentice | fortified | swamp-vest-t1 | 13.5 | 72.8 | {"fortified":2.8,"swarming":0,"alacrity":0,"heavy":0} | 0/5 | 0.0 | {"fortified":2.4,"swarming":0,"alacrity":0,"heavy":0} |
| F | apprentice | heavy | mountain-vest-t1 | 67.7 | 69.6 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":1} | 4/5 | 3.5 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | apprentice | swarming | chaotic-axe | 56.2 | 57.0 | {"fortified":3,"swarming":1} | 4/5 | 1.6 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | conduit | alacrity | plains-vest-t1 | 70.6 | 70.6 | {"fortified":3,"swarming":0,"alacrity":1} | 5/5 | 9.0 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | conduit | fortified | — | 17.8 | — | {} | 0/5 | 0.0 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | conduit | heavy | mountain-vest-t1 | 73.5 | 74.4 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":1} | 5/5 | 3.8 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | conduit | swarming | chaotic-axe | 60.9 | 61.6 | {"fortified":3,"swarming":1} | 5/5 | 1.7 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | squire | alacrity | plains-vest-t1 | 59.7 | 59.7 | {"fortified":3,"swarming":0,"alacrity":1,"heavy":0.2} | 5/5 | 8.8 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | squire | fortified | — | 10.4 | — | {} | 0/5 | 0.0 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | squire | heavy | mountain-vest-t1 | 57.6 | 62.8 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":1} | 4/5 | 2.6 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | squire | swarming | chaotic-axe | 50.0 | 50.9 | {"fortified":3,"swarming":1,"heavy":0.2} | 5/5 | 1.9 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | striker | alacrity | plains-vest-t1 | 54.8 | 54.8 | {"fortified":3,"swarming":0,"alacrity":1} | 5/5 | 7.5 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | striker | fortified | — | 10.5 | — | {} | 0/5 | 0.0 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | striker | heavy | mountain-vest-t1 | 57.6 | 57.7 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":1} | 5/5 | 2.9 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |
| F | striker | swarming | chaotic-axe | 46.6 | 47.3 | {"fortified":3,"swarming":1} | 5/5 | 2.0 | {"fortified":3,"swarming":0,"alacrity":0,"heavy":0} |

## Integrity checks

- Configuration identities observed: ["C:0.75:150","D:0.6:150","E:0.75:200","F:0.6:200"]
- Git revisions observed: ["721d2b57"]
- Reward multipliers observed: [2]
- Catalyst-progress decoupling flags observed: [false]
- Incomplete/malformed artifacts: 0; missing slots without a summary: 2
- Missing slots: C apprentice-t1 replica 05; D conduit-t1 replica 05
- Batch-reported failures: F-apprentice-t1-intended-04: stalled; no progress for 12m while farming node-t1-mountain-05 for mountain level >= 6; D-apprentice-t1-intended-05: stalled; timed out waiting for arrive at node-t1-forest-04; C-apprentice-t1-intended-05: Error: character list never arrived; D-conduit-t1-intended-05: Error: character list never arrived

The five decision questions should be answered from this completed table and the per-family JSON, with the selection criterion weighted toward the 45–55-minute band, low completion failures, no repeated 10+ minute catalyst-only waits, and retained purposeful friction rather than minimum runtime alone.
