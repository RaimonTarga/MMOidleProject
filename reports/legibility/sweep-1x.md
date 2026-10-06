# Legibility run — the canonical 1x six-class tutorial sweep (wave 2 E, 2026-10-06)

The guided tutorial after design §26.1 ("T1 deepens; T2 branches"), taught once on the weapon
each class fights with (the Chaotic Axe for five plans, the Poison Dagger for the Slinger):
**Effect** at its rank I, the weapon's **one verb**, then Effect's **ranks II and III** — no
pair to choose. Compared against the verbs-that-fire sweep (2026-10-04,
`reports/verbs-that-fire/sweep-1x.md`, whose raw runs were still on disk and were re-read for
the Forest and seal comparisons).

| | |
|---|---|
| Revision | `b5bfd7d6` (branch `feat/lg-tutorial` off `feat/legibility` @ `41536caa`, wave 1 merged) |
| Route | `tutorial-<class>-t1` **v1.5.0**, policy `intended` |
| Rate | 1x: every server booted fresh, `--rewardMultiplier=1`, run headers `taints: []` |
| Harness | bots launched directly (`bot/src/run.ts`), not the frozen experiment runner: 1x and untainted, one replica per class |
| Isolation | servers on **4301–4306** (`node --env-file=../.env --conditions=development --import tsx src/index.ts` from `server/`, `NODE_ENV=development`, `AUTH_DEV_BYPASS=1`), databases **`gamedb_lg1`…`gamedb_lg6`** (left in place), the shared logdb, Redis prefix `lg1`…`lg6`; accounts `bot-lg-<class>`; Striker 4301, Squire 4302, Slinger 4303, Spirit 4304, Apprentice 4305, Conduit 4306 |
| Time box | 120 min per class (`--maxRunMs=7200000`); every class finished inside it (51–69 min) |
| Box | 12 logical cores, **CPU 25% mean, 76% max** (56 one-minute samples); nothing else heavy ran |
| Tick rate | `/healthz` tick counters every ~60 s: **9.17 Hz mean (8.98–9.22)** on all six servers — Windows timer granularity, as in the verbs-that-fire sweep (8.7–9.2 Hz there) |
| Ledger script | `server/scripts/_lgTutorialSweep.ts` (model: `_vfTutorialSweep.ts`); machine-readable copy `sweep-1x.json` |

## The lesson this sweep ran

Per class, level → beat → idea (the first-hour checklist, `tutorial.test.ts`; at most two new
ideas per level):

| Level (Axe plans / Slinger) | Beat | New idea |
|---|---|---|
| Cave 0 / Swamp 0 | the leg's first farm (Cave: the axe; Swamp: the dagger) | telegraphs / poison |
| Cave 1 / Swamp 1 | `shards:<weapon>-t1-effect` | the weapon page; every kill pays its territory's shard |
| Cave 2 / Swamp 2 | `card:<weapon>-t1-effect` — "Buy Effect, row one of the Chaotic Axe's page: the lean, one active at a time. Attack and Speed are plain stats; Effect makes the weapon's own move stronger." (+ a read of its sentence) | the lean (with Step Back / Avoid Hazards on the same level: two) |
| Cave 4 / Swamp 4 | `card:<verb>` — "Buy Chopping Rhythm, the Chaotic Axe's own move: a moment in the fight that comes round on its own." Lesson: “Every 6th hit strikes again at 110% strength.” Effect made that stronger; its ranks add more. Ring: "…under your health bar counts your hits, lights when the next one pays, and fires on the 6th." (Slinger: “Hitting an afflicted target doubles its affliction.” Effect makes your poison stronger, and that is what it works on; the ring "counts down, lights when it is ready, and is dashed while the target is not poisoned".) | the verb; the ring under the health bar |
| Cave 5 / Swamp 5 | `card:<weapon>-t1-effect:rank-2` — "Rank Effect up to II… A lean has three ranks, and each one makes its number bigger." Lesson reads the number after and before. | lean ranks |
| Cave 6 / Swamp 6 | `card:<weapon>-t1-effect:rank-3` — "Rank Effect up to III, the last rank at this tier: “+20% to Chopping Rhythm's second strike.”" | — |

Rank II is one level after the verb because Cave 4 / Swamp 4 already carries two ideas (the verb
and its ring); its Global Mastery 10 is long held there (GM 29 / 17). Rank III's Global Mastery
14 is held from the leg's start, so it closes the leg. Beats: Striker 63, Squire 63, Slinger 66,
Spirit 66, Apprentice 68, Conduit 66 (verbs-that-fire: 59/59/62/62/64/62 — two beats per rank).

## Every class completed the whole script, gate paid

| Class | Clearing | Plains | Forest | Swamp | Mountain | Cave | Seals | Gate | beats | outcome | wall | deaths |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Striker | 11/11 | 11/11 | 5/5 | 8/8 | 4/4 | 17/17 | 4/4 | 3/3 | 63/63 | completed | 66m04s | 4 |
| Squire | 11/11 | 11/11 | 5/5 | 8/8 | 4/4 | 17/17 | 4/4 | 3/3 | 63/63 | completed | 64m01s | 2 |
| Slinger | 11/11 | 11/11 | 7/7 | 18/18 | 5/5 | 7/7 | 4/4 | 3/3 | 66/66 | completed | 57m46s | 2 |
| Spirit | 11/11 | 11/11 | 5/5 | 8/8 | 7/7 | 17/17 | 4/4 | 3/3 | 66/66 | completed | 51m30s | 3 |
| Apprentice | 11/11 | 11/11 | 5/5 | 10/10 | 7/7 | 17/17 | 4/4 | 3/3 | 68/68 | completed | 68m58s | 2 |
| Conduit | 11/11 | 11/11 | 5/5 | 8/8 | 7/7 | 17/17 | 4/4 | 3/3 | 66/66 | completed | 55m06s | 2 |

**No beat anywhere ended `stalled`, `blocked` or `skipped`, and no stall was raised.**

## The purchases

Time; the home zone's level and Global Mastery at the purchase; how long that purchase's shards
farm stood (0 s: the wallet covered it). The weapon in the slot was the boss weapon (Chaotic Axe
/ Poison Dagger) at every purchase.

| Class | Effect I | Verb | Effect II | Effect III |
|---|---|---|---|---|
| Striker | 26m55s (Cave 2, GM 26, farm 19 s) | 28m03s (Cave 4, GM 28, farm 49 s) | 28m46s (Cave 5, GM 29, farm 42 s) | 29m21s (Cave 6, GM 30, farm 9 s) |
| Squire | 26m20s (Cave 2, GM 26, farm 0 s) | 27m59s (Cave 4, GM 28, farm 57 s) | 28m28s (Cave 5, GM 29, farm 28 s) | 29m12s (Cave 6, GM 30, farm 14 s) |
| Slinger | 16m36s (Swamp 2, GM 14, farm 51 s) | 19m38s (Swamp 5, GM 17, farm 122 s) | 20m12s (Swamp 6, GM 18, farm 34 s) | 21m06s (Swamp 6, GM 18, farm 53 s) |
| Spirit | 24m11s (Cave 2, GM 26, farm 15 s) | 25m02s (Cave 4, GM 28, farm 43 s) | 25m21s (Cave 5, GM 29, farm 18 s) | 25m47s (Cave 6, GM 30, farm 11 s) |
| Apprentice | 33m27s (Cave 2, GM 26, farm 45 s) | 34m52s (Cave 4, GM 28, farm 66 s) | 35m30s (Cave 5, GM 29, farm 38 s) | 36m38s (Cave 6, GM 30, farm 23 s) |
| Conduit | 24m13s (Cave 2, GM 26, farm 14 s) | 25m22s (Cave 4, GM 28, farm 52 s) | 25m47s (Cave 5, GM 29, farm 24 s) | 26m23s (Cave 6, GM 30, farm 22 s) |

- **Rank III was bought by all six inside the home leg** (Cave 6 / Swamp 6), 26–37 min before
  the gate; every seal and gate fight was fought at Effect III.
- The whole band costs the Axe plans 3 + 8 + 5 + 6 = 22 Gale Shards and 225 Cave essence; the
  four farms together stood 1.5–2.9 min (the Slinger's 4.3 min: its verb waited on its shards
  into Swamp 5).
- What the page says (`cardSentence`): Axe — Effect “+10% → +20% to Chopping Rhythm's second
  strike.”, the verb “Every 6th hit strikes again at 110% → 120% strength.”; Dagger — Effect
  “Your poison is +10% → +20% stronger.”, the verb “Hitting an afflicted target doubles its
  affliction.” (unchanged by Effect: it scales the reservoir the verb re-doses, design §26.2).

## Seals and gate

| Class | GM 30 | Plains seal | Mountain seal | Gate boss (3 kills) | Tier 2 | gate paid |
|---|---|---|---|---|---|---|
| Striker | 29m11s | 1/1, 40 s | **1/3**, 55 s (lost at 7% and 1%) | Cave 3/5 | 48m51s | 66m04s |
| Squire | 28m57s | 1/1, 46 s | 1/1, 66 s | Cave 3/5 | 43m17s | 64m01s |
| Slinger | 31m08s | 1/1, 29 s | 1/1, 27 s | Swamp 3/5 | 40m21s | 57m45s |
| Spirit | 25m35s | 1/1, 39 s | 1/1, 45 s | Cave 3/5 | 35m36s | 51m29s |
| Apprentice | 36m13s | 1/1, 44 s | 1/1, 50 s | Cave 3/5 | 47m52s | 68m58s |
| Conduit | 26m00s | 1/1, 43 s | 1/1, 66 s | Cave 3/5 | 35m56s | 55m05s |

The two lost gate rounds per class are, as in every sweep since 2026-10-02, the round after a
win: the dungeon's guard (Cave Sentinel; the Slinger's Mire Keeper) or a boss woken seconds
after re-entry, dead at 100% boss HP within 3–8 s.

## The verb fired in every boss fight

The bought verb's landed `card-fx` per fight (boss combat start to end); every fight at Effect
III.

| Class | per win (fires, /min) | total, whole run | farming after the verb |
|---|---|---|---|
| Striker | Plains 5 (7.6); Mountain 4, 5 (losses), 5 (5.5); Cave 5, 5, 5 (6.1–6.2) | 76 | 3.7 min, 9 fires (2.5/min) |
| Squire | Plains 5 (6.5); Mountain 4 (3.6); Cave 5, 4, 4 (4.2–5.7) | 62 | 4.9 min, 11 (2.2/min) |
| Slinger | Plains 5 (10.5); Mountain 5 (11.1); Swamp 4, 4, 4 (11.2–11.8) | 155 | 17.1 min, 80 (4.7/min) |
| Spirit | Plains 5 (7.7); Mountain 5 (6.6); Cave 5, 5, 5 (7.3–7.6) | 60 | 3.8 min, 13 (3.4/min) |
| Apprentice | Plains 5 (6.8); Mountain 4 (4.8); Cave 4, 4, 5 (5.5–6.8) | 67 | 5.3 min, 14 (2.6/min) |
| Conduit | Plains 22 (30.6); Mountain 19 (17.2); Cave 22, 23, 23 (26.1–28.8) | 253 | 4.2 min, 40 (9.5/min) |

**The verb fired in all 30 boss wins** (4–5 a fight for five classes, 19–23 for the Conduit),
like the verbs-that-fire sweep. The Effect lean never fires on its own (a stat): no other card
fired.

## Forest leg (wave 1 C: Forest entry pressure)

Wave 1 C raised Forest entry pressure (forest-04, the tutorial's Forest node, Pack picks 4 → 6
in 10). Read off both sweeps' raw runs, the Forest leg = Plains 6 → Forest 6:

| Class | Forest leg (vf → lg) | Forest 4 at | Forest deaths | samples with 3+ attackers | lowest HP |
|---|---|---|---|---|---|
| Striker | 6m39s → 5m45s | 13m34s → 12m22s | 0 → 0 | 6.1% → 12.6% | 72% → 59% |
| Squire | 6m34s → 5m50s | 13m41s → 13m11s | 0 → 0 | 6.4% → 11.0% | 73% → 77% |
| Slinger | 6m02s → 6m17s | 11m39s → 12m37s | 0 → 0 | 9.7% → 13.5% | 55% → 61% |
| Spirit | 5m01s → 5m20s | 10m31s → 11m36s | 0 → 0 | 8.1% → 14.6% | 65% → 71% |
| Apprentice | 7m25s → 7m22s | 16m36s → 15m50s | 0 → 0 | 11.3% → 13.5% | 38% → 32% |
| Conduit | 5m01s → 4m36s | 11m24s → 11m00s | 0 → 0 | 6.5% → 5.1% | 56% → 78% |

(Every class farms forest-04 only, in both sweeps. "3+ attackers" and "lowest HP" are the bot's
`concurrency-sample`s on Forest nodes during the leg.)

**The pressure rose and did no harm**: the share of moments with three or more attackers about
doubled for the Striker, Squire and Spirit (6–8% → 11–15%), rose 2–4 pp for the Slinger and
Apprentice, and fell for the Conduit (its summons hold the pack); but no class died in the
Forest, the leg took the same time (−54 s to +19 s; −92 s summed over the six), and the lowest
HP moved within the run-to-run spread. No Forest regression; C's data-only fallback is not
needed on this evidence (one replica per class).

## Mountain seal

| Class | verbs-that-fire (Cleaving Blow / Chopping Rhythm pairs) | legibility (Effect III + Chopping Rhythm) |
|---|---|---|
| Striker | 1/1, 59 s | **1/3**: died with the Crag Behemoth at 7% and at 1%, won the third (55 s each) |
| Squire | 1/1, 57 s | 1/1, 66 s |
| Slinger | 1/1, 31 s | 1/1, 27 s |
| Spirit | 1/1, 42 s | 1/1, 45 s |
| Apprentice | 1/1, 47 s | 1/1, 50 s |
| Conduit | 1/1, 65 s | 1/1, 66 s |

The Striker's two losses are a DPS shortfall of under 7% of the boss (55 s fights, the same
length as the win), the same shape as the course-correction sweep's Striker (1/3, lost at 8%
twice). Its verbs-that-fire kit was Loose Grip + Cleaving Blow (+31.2% boss-lab uplift); this
run's Effect III + Chopping Rhythm is, by the after-wave-1 matrix, the Striker's weakest Axe kit
(+12.9% at III vs Speed +24.5%, Attack +28.1%). It cost the Striker 4.3 min to Tier 2. Gameplay
evidence for the designer's lean call, not retuned here. The Squire's, Spirit's and
Apprentice's Mountain wins also ran 3–9 s longer than before (Squire 57 → 66 s).

## Against the verbs-that-fire sweep

| Class | lean I | verb | GM 30 | Tier 2 | gate paid | deaths | beats |
|---|---|---|---|---|---|---|---|
| Striker | 27m52s → 26m55s | 30m27s → 28m03s | 30m59s → 29m11s | 44m35s → 48m51s | 64m42s → 66m04s | 2 → 4 | 59 → 63 |
| Squire | 29m01s → 26m20s | 30m12s → 27m59s | 30m47s → 28m57s | 44m21s → 43m17s | 64m01s → 64m01s | 2 → 2 | 59 → 63 |
| Slinger | 15m20s → 16m36s | 18m23s → 19m38s | 27m10s → 31m08s | 36m47s → 40m21s | 53m56s → 57m45s | 2 → 2 | 62 → 66 |
| Spirit | 21m12s → 24m11s | 22m21s → 25m02s | 23m02s → 25m35s | 31m33s → 35m36s | 46m42s → 51m29s | 2 → 3 | 62 → 66 |
| Apprentice | 32m59s → 33m27s | 35m06s → 34m52s | 36m13s → 36m13s | 48m11s → 47m52s | 68m32s → 68m58s | 2 → 2 | 64 → 68 |
| Conduit | 23m18s → 24m13s | 24m10s → 25m22s | 24m48s → 26m00s | 33m38s → 35m56s | 50m20s → 55m05s | 2 → 2 | 62 → 66 |

- The gate is paid 0–4.8 min later (Squire ±0, Apprentice +0.4, Striker +1.4, Slinger +3.8,
  Spirit and Conduit +4.8). The two ranks' own farms are 0.5–1.5 min of it; the rest is spread
  over legs that do not touch the band (the Spirit's Plains and Swamp legs, the Slinger's
  Mountain and Cave legs ran 1–1.5 min slower each) and the Striker's two Mountain losses —
  one replica per class, so read the per-leg differences as noise around a ~1 min cost.
- The extra deaths: the Striker's two Mountain-seal losses, and one Spirit death farming the
  Swamp (a Mire Ooze's poison, `max:swamp`, on the Flash Rapier — before the band exists).
- Lean and verb land in the same levels as before (Cave 2 / Cave 4; the Slinger Swamp 2 /
  Swamp 5); the Squire's is a level earlier (Cave 2, it had been Cave 3).

## The first-hour checklist, measured

The ideas each beat introduces, at the level the run was ACTUALLY at when the beat started
(farm beats already satisfied left out): **no level showed more than two new ideas, for any
class.** Where the page beats landed:

| Class | page + shards | lean (Effect I) | verb + ring | lean ranks (Effect II) |
|---|---|---|---|---|
| Striker, Spirit, Apprentice, Conduit | Cave 1 | Cave 2 | Cave 4 | Cave 5 |
| Squire | **skipped** | Cave 2 | Cave 4 | Cave 5 |
| Slinger | Swamp 1 | Swamp 2 (with Avoid Hazards) | Swamp 5 | Swamp 6 |

**One gap: two idea-carrying farm lines never showed for the Squire** — the Cave's intro
("…monsters wind up big hits you can dodge", *telegraphs*) on `farm:chaotic-axe`, and the page +
shards line on `shards:axe-t1-effect`. Cause: travelling from the Swamp to the Mountain the
Squire crossed cave-05 (21m24s–22m25s) and fought there (`while-traveling → fight-back`),
reaching Cave 2 and enough Cave essence before the Mountain leg; it arrived in the Cave chapter
with the axe affordable, Cave 2 held and Gale Shards already in the wallet (the Forest's Pack
territory pays Gale, and Effect is paid in Gale on the Axe), so both farms were satisfied on
arrival and skipped. The idea-on-a-farm-line risk is the checklist doc's own caveat, not new
here; moving those ideas onto the craft line would instead compress three ideas into Cave 2 for
a run like this one. Left for the tutorial's next pass (open question below).

## Effect against the best lean, per class (the designer's switch)

Boss lab after wave 1 (`after-composition.md`, 10 seeds, median over the five T1 bosses,
uplift over the same class on the same weapon with no cards):

| Class (weapon) | Effect I / III | best at I | best at III | verb alone |
|---|---|---|---|---|
| Striker (Axe) | +11.6% / +12.9% | Speed +24.5% | Attack +28.1% | +10.2% |
| Squire (Axe) | +10.7% / +12.1% | Speed +18.4% (Attack +18.3%) | Speed +29.2% | +9.7% |
| Slinger (Dagger) | +50.5% / +58.4% | Attack +52.3% | **Effect** +58.4% | +46.3% |
| Spirit (Axe) | +13.9% / +15.6% | Speed +24.8% | Attack +28.0% | +12.5% |
| Apprentice (Axe) | +5.1% / +5.8% | Attack +16.4% | Attack +18.9% | +4.6% |
| Conduit (Axe) | +17.5% / +19.9% | Attack +24.0% | Attack +36.9% | +17.0% |

On the Axe, Effect adds 1–3 pp over the verb alone; Attack or Speed add 8–20 pp. Switching a
plan is one line in `shared/src/tutorial/scripts/plans.ts` (`AXE_BAND.lean`), and the lesson's
copy follows the kind (an Attack/Speed lean is called "a plain stat").

## What this sweep does not cover

- One replica per class: a 1/3 Mountain seal and a 3/5 gate are one sample each.
- The client: the director's Rank up press (the new `lineageRankUp` anchor on D's button), the
  lean and rank II read lessons, the ring lesson pointing under the HP bar, and the panel copy
  were not checked in a live client; the bot sends the same intents.
- The Slinger's own poison ticks: the bot's `own-dot-ticks` has no Slinger rows in this run
  (the verbs-that-fire sweep counted the lean's bleed, which no longer exists on the Dagger,
  design §26.2). The bot counts only `dot-tick` events whose `sourceId` is its own, and the
  weapon DoT path pushes its ticks with `sourceType: "weapon"` and no `sourceId`
  (`server/src/systems/combat/damage/weaponEffects.ts`), so the Dagger's reservoir is invisible to
  that counter — a telemetry gap, not a missing poison (the Slinger's verb, which needs an
  afflicted target, fired 4–5 times in every boss win).
- Rank purchases by a player who opted in mid-Tier-1 with another lean already ranked.

## Open calls

1. **The lean the guide names.** The brief's Effect costs the Axe plans 8–20 pp of boss uplift
   against Attack/Speed, and the Striker its Mountain margin (1/3). Switch per class in
   `plans.ts` (the copy and the tests follow the lean's kind)?
2. **Idea lines on farm beats.** A run that pre-earns a zone's early levels skips the lines that
   carry its intro and the page + shards ideas (the Squire here). Keep, or give those ideas a
   never-skipped home in the tutorial's next pass?
3. **The weapon reservoir's ticks in telemetry** (above): give weapon `dot-tick`s a `sourceId`,
   or let the bot count `sourceType: "weapon"` ticks in an isolated world?
