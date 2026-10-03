# Boss lab after/before — Wave 0 baseline vs the course-correction base (W3-A item 4)

**Plan:** `reports/t1-boss-pass/plan-base.json`, unchanged — six tutorial classes × five T1
bosses × 30 seeds, the tutorial boss kit, no lineage band, seeded approach geometry.
**After:** `after-boss.jsonl`, run at `dcd06e5e` (Waves 1–2 merged + the hit-nth fix;
neither touches a no-band fight) with the lab as Wave 0 ran it; 900 fights, 6 shards,
**66 s** wall. **Before:** `baseline-boss.jsonl` (Wave 0).

```bash
# from server/: 6 shards of _t1BossLab.ts over the baseline plan, then
node --conditions=development --import tsx scripts/_t1BossMatrix.ts \
  ../reports/course-correction/after-boss.jsonl --md --before=../reports/course-correction/baseline-boss.jsonl
```

## The verdict

**750 of 900 fights are byte-identical; the 150 that moved are all the Striker's, and
the Striker moved by a hair.** The non-weapon `+5` ladders folded into base (W1-D) give
every class the SAME reported loadout as Wave 0 (max HP, plating, DR, dodge, barrier,
Recovery, Attack — the Slinger's dodge differs in the 16th decimal), and for five classes
the fights are identical seed for seed.

**Why the Striker moved — a fold that is not exactly power-neutral.** The swamp charm's
ladder was five `+0.02 defense.recovery-pulse-pct` steps carrying NO interval, which the
pulse accumulator (`shared/src/passives.ts`, `accruePulse`) treats as a *pct-only* source:
it adds at whatever interval is active. W1-D folded the +0.10 into the charm's own
*cadenced* source (0.30 every 8 s for 4 s). For five classes the charm is the only pulse,
so 0.20 + 0.10 flat and 0.30 cadenced resolve the same. **The Striker's class root carries
its own pulse (`cadence-root`: 0.20 every 6 s)**, and the accumulator normalises cadenced
sources to the fastest interval: before, 0.233 × 6/4 + 0.10 = **0.45**; after,
(0.15 + 0.133) × 6/4 = **0.425**. The Striker heals ~3% less in every fight (e.g.
Razorback seed 947: healed 258 → 250 HP, min HP 29.9% → 25.9%), which flips 2 Toadeater
fights to losses (29/30 → 27/30) and moves nothing else. Bisected: identical through the
W1-B merge, the ladder-retired W1-C state loses the +5 outright, the W1-D fold restores
all of it except this; confirmed by dumping the prepared Striker's passives under both
trees (only `defense.recovery-pulse-pct` differs).

This is within the lab's resolution (±16 points at 95% on a 30-seed cell) and it is a
**designer call**, not a code defect: keep the fold as is (0.425), or fold the charm's
ladder as a pct-only `+0.10` the way it used to resolve (0.45) — balance numbers are the
designer's, so nothing was changed here.

**The tutorial kit WITH its lean + verb: not run.** The tutorial plan buys one lineage card,
the Rapier's lean Quick Wrist (`rapier-t1-tempo-stat`), and no verb; every melee boss kit
then wears the Chaotic Axe and the Slinger the Ashbrand Blade, so that lean is inert in
every boss fight. W3-B is rewriting the tutorial (lean at Forest 2, verb at Forest 4, the
Rapier kept worn); the composition matrix (`composition-matrix.md`) measures every pair on
these kits meanwhile.

## After (900 fights)

| class      | Razorback  | Greatbear  | Toadeater  | Behemoth   | Broodmother | worst |
|------------|------------|------------|------------|------------|-------------|-------|
| striker    | 90% 27/30  | 100% 30/30 | 90% 27/30  | 77% 23/30  | 100% 30/30  | 77%   |
| squire     | 100% 30/30 | 100% 30/30 | 87% 26/30  | 100% 30/30 | 100% 30/30  | 87%   |
| slinger    | 100% 30/30 | 100% 30/30 | 100% 30/30 | 100% 30/30 | 100% 30/30  | 100%  |
| spirit     | 100% 30/30 | 100% 30/30 | 87% 26/30  | 100% 30/30 | 100% 30/30  | 87%   |
| apprentice | 100% 30/30 | 97% 29/30  | 100% 30/30 | 100% 30/30 | 100% 30/30  | 97%   |
| conduit    | 100% 30/30 | 100% 30/30 | 100% 30/30 | 100% 30/30 | 100% 30/30  | 100%  |
| FLOOR      | 90%        | 97%        | 87%        | 77%        | 100%        |       |

Losses (boss % left, median / worst) and median TTK on wins:

```
  Razorback   striker 3L@8.9/24.1%  squire clean(52.8s)  slinger clean(46s)  spirit clean(49.7s)  apprentice clean(44.7s)  conduit clean(53.2s)
  Greatbear   striker clean(31.1s)  squire clean(37.8s)  slinger clean(27.4s)  spirit clean(31.6s)  apprentice 1L@0.8/0.8%  conduit clean(31.7s)
  Toadeater   striker 3L@2.2/2.7%  squire 4L@3.5/4.3%  slinger clean(34.6s)  spirit 4L@3.1/3.1%  apprentice clean(40.3s)  conduit clean(37.7s)
  Behemoth    striker 7L@4.5/9.1%  squire clean(76.1s)  slinger clean(47.4s)  spirit clean(53.7s)  apprentice clean(49.4s)  conduit clean(75.1s)
  Broodmother striker clean(57.9s)  squire clean(63.5s)  slinger clean(41.9s)  spirit clean(48.5s)  apprentice clean(44.8s)  conduit clean(56.3s)
```

## Before → after

**Per class — before -> after (900 fights matched by id)**

| group | win rate | median TTK on wins | median boss % left on losses | fights changed |
|---|---|---|---|---:|
| striker | 93% 139/150 -> 91% 137/150 | 55.2s -> 55.1s | 8.8% -> 4.5% | 150/150 |
| squire | 97% 146/150 -> 97% 146/150 | 59.1s -> 59.1s | 3.5% -> 3.5% | 0/150 |
| slinger | 100% 150/150 -> 100% 150/150 | 41.9s -> 41.9s | - -> - | 0/150 |
| spirit | 97% 146/150 -> 97% 146/150 | 48.5s -> 48.5s | 3.1% -> 3.1% | 0/150 |
| apprentice | 99% 149/150 -> 99% 149/150 | 44.6s -> 44.6s | 0.8% -> 0.8% | 0/150 |
| conduit | 100% 150/150 -> 100% 150/150 | 52.9s -> 52.9s | - -> - | 0/150 |

**Per boss — before -> after (900 fights matched by id)**

| group | win rate | median TTK on wins | median boss % left on losses | fights changed |
|---|---|---|---|---:|
| Razorback | 98% 177/180 -> 98% 177/180 | 49.5s -> 49.5s | 8.9% -> 8.9% | 30/180 |
| Greatbear | 99% 179/180 -> 99% 179/180 | 31.6s -> 31.6s | 0.8% -> 0.8% | 30/180 |
| Toadeater | 95% 171/180 -> 94% 169/180 | 41.1s -> 40.9s | 2.7% -> 2.3% | 30/180 |
| Behemoth | 96% 173/180 -> 96% 173/180 | 54.6s -> 54.6s | 4.5% -> 4.5% | 30/180 |
| Broodmother | 100% 180/180 -> 100% 180/180 | 51.2s -> 51.2s | - -> - | 30/180 |

**Per class x boss (changed cells only) — before -> after (900 fights matched by id)**

| group | win rate | median TTK on wins | median boss % left on losses | fights changed |
|---|---|---|---|---:|
| striker / Razorback | 90% 27/30 -> 90% 27/30 | 45.6s -> 45.6s | 8.9% -> 8.9% | 30/30 |
| striker / Greatbear | 100% 30/30 -> 100% 30/30 | 31.1s -> 31.1s | - -> - | 30/30 |
| striker / Toadeater | 97% 29/30 -> 90% 27/30 | 55.8s -> 55.3s | 2.7% -> 2.2% | 30/30 |
| striker / Behemoth | 77% 23/30 -> 77% 23/30 | 68.5s -> 68.5s | 4.5% -> 4.5% | 30/30 |
| striker / Broodmother | 100% 30/30 -> 100% 30/30 | 57.9s -> 57.9s | - -> - | 30/30 |
