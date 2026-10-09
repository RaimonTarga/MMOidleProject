# Wave 3 — the no-card identity, per boss

The frozen no-band plan (`reports/t1-boss-pass/plan-base.json`, 900 rows) on the final tip, against `reports/legibility/final-base.jsonl`, `wallMs` dropped. Rows whose kit names a cut ability (Expose Weakness, 24 of 30 cells) are refused by the lab (`illegal ability budget`: the cut id is unknown), as README §4 predicted; the rows whose abilities survive unchanged (the Razorback's Sweep + Second Wind) are the identity, and they hold.

```
crag-behemoth [expose-weakness / second-wind]                same 0 differ 180 errors 180 | dps 35.0 -> 0.0 | wins 173 -> 0
gnarled-greatbear [expose-weakness / second-wind]            same 0 differ 180 errors 180 | dps 45.2 -> 0.0 | wins 179 -> 0
grave-toadeater [expose-weakness / cleanse]                  same 0 differ 180 errors 180 | dps 39.9 -> 0.0 | wins 169 -> 0
obsidian-broodmother [expose-weakness / second-wind]         same 0 differ 180 errors 180 | dps 33.8 -> 0.0 | wins 180 -> 0
tusked-razorback [sweep / second-wind]                       same 180 differ 0 errors 0 | dps 34.4 -> 34.4 | wins 177 -> 177
```
