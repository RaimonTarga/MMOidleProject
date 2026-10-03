# Boss lab after/before — the course-correction after-boss vs the verbs-that-fire tree

**Plan:** `reports/t1-boss-pass/plan-base.json`, unchanged (six tutorial classes × five T1 bosses × 30 seeds, the tutorial boss kit, NO lineage band). **After:** `after-boss.jsonl`, run at `1a9a35e5` (wave 1 merged; code = `57916b52`), one process, 254 s wall, beside the wave-2 sweep. **Before:** `../course-correction/after-boss.jsonl`.

**Verdict: 900 of 900 fights are byte-identical** (won, time, damage dealt, min HP, HP lost). Wave 1 changes nothing for a character with no cards: the lean conditions are passives a lean writes, the Empowered cap is a card cap, and the T2 composition is T2 data. The tutorial pair's effect is read from the composition matrix's Axe and Dagger rows instead (`composition-matrix.md`).

```bash
# from server/
node --conditions=development --import tsx scripts/_t1BossLab.ts --plan=../reports/t1-boss-pass/plan-base.json --out=after-boss.jsonl --hitboxes=<artifact>
node --conditions=development --import tsx scripts/_t1BossMatrix.ts ../reports/verbs-that-fire/after-boss.jsonl --md --before=../reports/course-correction/after-boss.jsonl
```


==============================================================================
base  (900 fights)
==============================================================================
| class      | Razorback  | Greatbear  | Toadeater  | Behemoth   | Broodmother | worst |
|------------|------------|------------|------------|------------|-------------|-------|
| striker    | 90% 27/30  | 100% 30/30 | 90% 27/30  | 77% 23/30  | 100% 30/30  | 77%   |
| squire     | 100% 30/30 | 100% 30/30 | 87% 26/30  | 100% 30/30 | 100% 30/30  | 87%   |
| slinger    | 100% 30/30 | 100% 30/30 | 100% 30/30 | 100% 30/30 | 100% 30/30  | 100%  |
| spirit     | 100% 30/30 | 100% 30/30 | 87% 26/30  | 100% 30/30 | 100% 30/30  | 87%   |
| apprentice | 100% 30/30 | 97% 29/30  | 100% 30/30 | 100% 30/30 | 100% 30/30  | 97%   |
| conduit    | 100% 30/30 | 100% 30/30 | 100% 30/30 | 100% 30/30 | 100% 30/30  | 100%  |
| FLOOR      | 90%        | 97%        | 87%        | 77%        | 100%        |       |

losses (boss % left, median / worst) and median TTK on wins:
  Razorback   striker 3L@8.9/24.1%  squire clean(52.8s)  slinger clean(46s)  spirit clean(49.7s)  apprentice clean(44.7s)  conduit clean(53.2s)
  Greatbear   striker clean(31.1s)  squire clean(37.8s)  slinger clean(27.4s)  spirit clean(31.6s)  apprentice 1L@0.8/0.8%  conduit clean(31.7s)
  Toadeater   striker 3L@2.2/2.7%  squire 4L@3.5/4.3%  slinger clean(34.6s)  spirit 4L@3.1/3.1%  apprentice clean(40.3s)  conduit clean(37.7s)
  Behemoth    striker 7L@4.5/9.1%  squire clean(76.1s)  slinger clean(47.4s)  spirit clean(53.7s)  apprentice clean(49.4s)  conduit clean(75.1s)
  Broodmother striker clean(57.9s)  squire clean(63.5s)  slinger clean(41.9s)  spirit clean(48.5s)  apprentice clean(44.8s)  conduit clean(56.3s)

Per class — before -> after (900 fights matched by id)
| group | win rate | median TTK on wins | median boss % left on losses | fights changed |
|---|---|---|---|---:|
| striker | 91% 137/150 -> 91% 137/150 | 55.1s -> 55.1s | 4.5% -> 4.5% | 0/150 |
| squire | 97% 146/150 -> 97% 146/150 | 59.1s -> 59.1s | 3.5% -> 3.5% | 0/150 |
| slinger | 100% 150/150 -> 100% 150/150 | 41.9s -> 41.9s | - -> - | 0/150 |
| spirit | 97% 146/150 -> 97% 146/150 | 48.5s -> 48.5s | 3.1% -> 3.1% | 0/150 |
| apprentice | 99% 149/150 -> 99% 149/150 | 44.6s -> 44.6s | 0.8% -> 0.8% | 0/150 |
| conduit | 100% 150/150 -> 100% 150/150 | 52.9s -> 52.9s | - -> - | 0/150 |

Per boss — before -> after (900 fights matched by id)
| group | win rate | median TTK on wins | median boss % left on losses | fights changed |
|---|---|---|---|---:|
| Razorback | 98% 177/180 -> 98% 177/180 | 49.5s -> 49.5s | 8.9% -> 8.9% | 0/180 |
| Greatbear | 99% 179/180 -> 99% 179/180 | 31.6s -> 31.6s | 0.8% -> 0.8% | 0/180 |
| Toadeater | 94% 169/180 -> 94% 169/180 | 40.9s -> 40.9s | 2.3% -> 2.3% | 0/180 |
| Behemoth | 96% 173/180 -> 96% 173/180 | 54.6s -> 54.6s | 4.5% -> 4.5% | 0/180 |
| Broodmother | 100% 180/180 -> 100% 180/180 | 51.2s -> 51.2s | - -> - | 0/180 |

Per class x boss (changed cells only) — before -> after (900 fights matched by id)
| group | win rate | median TTK on wins | median boss % left on losses | fights changed |
|---|---|---|---|---:|
