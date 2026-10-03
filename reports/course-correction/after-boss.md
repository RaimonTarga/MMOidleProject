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

**The tutorial kit WITH its own lean + verb: a no-op in the lab, so it is not a table.**
W3-B's tutorial (`feat/cc-tutorial`) buys a lean and a verb on the RAPIER for every class, but
every boss kit (`bossKit`) still wears the Chaotic Axe or the Poison Dagger, and a lineage pays
only while its own form is worn — the two cards are inert in every seal and gate fight, so "the
tutorial kit with its purchase" is exactly the table above. What the bought pair WOULD do with the
Rapier kept on is the labelled DIAGNOSTIC at the end of this page.

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

## DIAGNOSTIC — the tutorial's Rapier pair, with the Rapier kept on (not the tutorial kit)

The baseline plan with ONE change: the weapon is the Flash Rapier, fought twice — with no cards,
and with the class's own tutorial lean + verb (W3-B's `weaponCards`: Striker, Slinger, Conduit
Quick Wrist → Opening Lunge; Squire, Spirit Keen Edge → Flurry; Apprentice Envenomed → Opening
Lunge), bought through the real economy. 1,800 fights (6 classes × 5 bosses × 30 seeds × 2), 6
shards, 159 s; rows in `diag-tutorial-rapier-boss.jsonl`
(`_t1BossPlan.ts --matrix=tutorial-rapier`). Columns are win rate · median TTK on wins.

| class | pair (lean × verb) | boss | Axe/Dagger kit (baseline) | Rapier, no cards | Rapier + the pair | DPS: pair vs Rapier no-band | verb fires/min |
|---|---|---|---|---|---|---:|---:|
| striker | tempo×engagement | Razorback | 90% · 45.6s | 30% · 38.2s | 40% · 36.3s | +3.4% | 4.4 |
| striker | tempo×engagement | Greatbear | 100% · 31.1s | 100% · 24.8s | 100% · 24.8s | +2.1% | 2.4 |
| striker | tempo×engagement | Toadeater | 90% · 55.3s | 100% · 46.5s | 100% · 45.9s | +1.6% | 1.3 |
| striker | tempo×engagement | Behemoth | 77% · 68.5s | 100% · 50.7s | 100% · 50.6s | +1.6% | 1.2 |
| striker | tempo×engagement | Broodmother | 100% · 57.9s | 100% · 52.4s | 100% · 51.1s | +1.5% | 1.2 |
| squire | engagement×tempo | Razorback | 100% · 52.8s | 93% · 50.2s | 100% · 39.2s | +27.0% | 11.7 |
| squire | engagement×tempo | Greatbear | 100% · 37.8s | 100% · 31.9s | 100% · 26.3s | +23.3% | 11.4 |
| squire | engagement×tempo | Toadeater | 87% · 59.1s | 97% · 56.9s | 100% · 44.6s | +29.2% | 8.2 |
| squire | engagement×tempo | Behemoth | 100% · 76.1s | 100% · 73.1s | 100% · 56.6s | +28.5% | 7.6 |
| squire | engagement×tempo | Broodmother | 100% · 63.5s | 100% · 65.5s | 100% · 49.5s | +31.9% | 9.7 |
| slinger | tempo×engagement | Razorback | 100% · 46.0s | 100% · 48.7s | 100% · 44.9s | +7.5% | 8.4 |
| slinger | tempo×engagement | Greatbear | 100% · 27.4s | 100% · 29.2s | 100% · 28.9s | +1.0% | 2.1 |
| slinger | tempo×engagement | Toadeater | 100% · 34.6s | 93% · 38.5s | 100% · 38.2s | +0.6% | 1.6 |
| slinger | tempo×engagement | Behemoth | 100% · 47.4s | 100% · 51.0s | 100% · 50.7s | +0.5% | 1.2 |
| slinger | tempo×engagement | Broodmother | 100% · 41.9s | 100% · 51.9s | 100% · 51.0s | +1.1% | 1.2 |
| spirit | engagement×tempo | Razorback | 100% · 49.7s | 100% · 41.9s | 100% · 29.9s | +37.7% | 15.8 |
| spirit | engagement×tempo | Greatbear | 100% · 31.6s | 100% · 25.0s | 100% · 19.0s | +32.3% | 15.8 |
| spirit | engagement×tempo | Toadeater | 87% · 41.9s | 100% · 33.3s | 100% · 25.0s | +34.4% | 14.4 |
| spirit | engagement×tempo | Behemoth | 100% · 53.7s | 100% · 44.7s | 100% · 33.1s | +35.3% | 12.7 |
| spirit | engagement×tempo | Broodmother | 100% · 48.5s | 100% · 41.1s | 100% · 30.7s | +32.8% | 15.5 |
| apprentice | affliction×engagement | Razorback | 100% · 44.7s | 80% · 50.8s | 73% · 50.0s | +1.7% | 8.5 |
| apprentice | affliction×engagement | Greatbear | 97% · 31.8s | 47% · 34.8s | 77% · 34.2s | +0.9% | 1.8 |
| apprentice | affliction×engagement | Toadeater | 100% · 40.3s | 100% · 46.4s | 100% · 46.1s | +1.0% | 1.3 |
| apprentice | affliction×engagement | Behemoth | 100% · 49.4s | 100% · 56.9s | 100% · 56.9s | +0.9% | 1.1 |
| apprentice | affliction×engagement | Broodmother | 100% · 44.8s | 100% · 52.4s | 100% · 52.2s | +0.7% | 1.1 |
| conduit | tempo×engagement | Razorback | 100% · 53.2s | 100% · 75.2s | 100% · 62.6s | +20.5% | 7.7 |
| conduit | tempo×engagement | Greatbear | 100% · 31.7s | 97% · 37.7s | 100% · 33.7s | +11.7% | 1.8 |
| conduit | tempo×engagement | Toadeater | 100% · 37.7s | 0% · - | 100% · 39.0s | +13.8% | 1.5 |
| conduit | tempo×engagement | Behemoth | 100% · 75.1s | 100% · 93.0s | 100% · 86.5s | +7.2% | 0.7 |
| conduit | tempo×engagement | Broodmother | 100% · 56.3s | 100% · 86.0s | 100% · 75.4s | +14.1% | 0.8 |

Per class, all five bosses (win rate · median TTK on wins):

| class | Axe/Dagger kit | Rapier, no cards | Rapier + the pair | refusals |
|---|---|---|---|---|
| striker | 91% · 55.1s | 86% · 49.2s | 88% · 48.1s | none |
| squire | 97% · 59.1s | 98% · 57.1s | 100% · 44.6s | none |
| slinger | 100% · 41.9s | 99% · 48.8s | 100% · 44.9s | none |
| spirit | 97% · 48.5s | 100% · 41.1s | 100% · 29.9s | none |
| apprentice | 99% · 44.6s | 85% · 51.0s | 90% · 50.1s | none |
| conduit | 100% · 52.9s | 79% · 82.1s | 100% · 62.6s | none |

**Reading it.** Keen Edge × Flurry (every 6th hit a ×2 lunge) is the one pick that pays in a boss
fight: Squire +23–32% DPS, Spirit +32–38%, both 100% on every boss. The "speed opener" (Quick
Wrist × Opening Lunge) pays once per BODY, so on a boss it fires 1–2 times a minute and is worth
+0.5–3% outside the Razorback's adds — and Quick Wrist itself is worth exactly 0 to the Striker
and the Slinger on this weapon (their attack interval does not cross a 100 ms tick; see
`composition-matrix.md`, "quantised to the 10 Hz tick"). On the Conduit the same pair is worth
+7–20%, because its Rapier interval does cross a tick. The Apprentice's Envenomed lean adds DoT
potency, but Opening Lunge's payload with that lean is the heavy bleed once per body: +1%.

**And the Rapier is not the Axe.** Kept on for the seals, it costs the Striker the Razorback
(90% on the Axe kit → 30–40% on the Rapier), the Apprentice the Greatbear (97% → 47% bare, 77%
with its pair) and the Conduit time everywhere (median TTK 53 s → 63–82 s; its bare-Rapier
Toadeater lost 30 of 30). Whether the guide keeps the Rapier worn for the gate (review P9) is
the designer's call; this is the price list.

