# Applied intervals: adopted R1 versus optional R2

All 24 packages qualified with zero World ticks. Each arm uses the same package
and fixed production source. Times are milliseconds. Tick quantization is
ceil(interval / 100) * 100; actual queue return can also depend on HP availability.
Light/Balanced final floors are 2000 ms for R1 and 1500 ms for R2. The floor-binds
flag is strict post-relic interval < floor, so equality does not set the flag.
Full frame/range/specialization/passive/relic factors, HP costs, exact loadouts and
arm provenance are in [qualification receipts](r2-qualification/results.json) and
the per-observation arm.json files. These are structural readings, not outcomes.

| Identity | Setting | R1 interval | R2 interval | R1 / R2 tick quantized | R1 / R2 floor binds |
|---|---|---:|---:|---:|---|
| t2-conduit-balanced | farm | 3000 | 2500 | 3000 / 2500 | False / False |
| t2-conduit-balanced | boss | 3000 | 2500 | 3000 / 2500 | False / False |
| t2-conduit-light | farm | 2500 | 2000 | 2500 / 2000 | False / False |
| t2-conduit-light | boss | 2500 | 2000 | 2500 / 2000 | False / False |
| t3-conduit-balanced | farm | 3000 | 2500 | 3000 / 2500 | False / False |
| t3-conduit-balanced | boss | 3000 | 2500 | 3000 / 2500 | False / False |
| t4-conduit-balanced-a | farm | 2727 | 2273 | 2800 / 2300 | False / False |
| t4-conduit-balanced-a | boss | 2727 | 2273 | 2800 / 2300 | False / False |
| t4-conduit-light-b | farm | 2000 | 1500 | 2000 / 1500 | True / True |
| t4-conduit-light-b | boss | 2000 | 1500 | 2000 / 1500 | True / True |
| t4-conduit-light-c | farm | 2273 | 1818 | 2300 / 1900 | False / False |
| t4-conduit-light-c | boss | 2273 | 1818 | 2300 / 1900 | False / False |
