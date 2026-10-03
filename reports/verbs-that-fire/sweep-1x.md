# Verbs-that-fire — the canonical 1x six-class tutorial sweep (wave 2, 2026-10-04)

The guided tutorial after design §24.9's tutorial bullet: the lean and the verb bought on the
page of the weapon each class FIGHTS with (the Chaotic Axe for five plans, the Poison Dagger
for the Slinger), worn from where it is made; the T1 verb row at Global Mastery 10; the gate
chapter paying that same weapon's gate. One server and one game database per class, so no two
bots share a world. **This sweep is the first to record card FIRINGS** (`card-fired`, the bot's
own landed `card-fx`), so it shows the bought verb firing in every boss fight.

| | |
|---|---|
| Revision | `d42e4953` (branch `feat/vf-tutorial`: the lean + verb on the boss weapon, the GM-10 verb row, the bot's card firings) |
| Route | `tutorial-<class>-t1` **v1.4.0**, policy `intended` |
| Rate | 1x: every server booted fresh, `--rewardMultiplier=1`, run headers `taints: []` |
| Harness | bots launched directly (`bot/src/run.ts`), **not** the frozen experiment runner (it cannot target per-class servers): 1x and untainted, not "frozen-runner canonical" |
| Isolation | servers on 4331–4336 (`server/node_modules/.bin/tsx --env-file=../.env --conditions=development src/index.ts`, `NODE_ENV=development`, `AUTH_DEV_BYPASS=1`), databases `gamedb_vftut1`…`6` (left in place), the shared logdb, Redis pub/sub prefix `vftut1`…`6`; accounts `vftut-<class>` |
| Time box | 90 min per class (`--maxRunMs=5400000`); every class finished inside it (46–69 min) |
| Box | 12 logical cores, **CPU 83% mean (100% for 00:13–00:37)**: the conductor's T1 composition matrix (boss lab + lane bench) ran beside the sweep until it cut to two shards at ~00:40, and another session's three tutorial bots (ports 4341–4343) joined at 00:45 |
| Tick rate | measured from `/healthz` tick counts against wall time, sampled every ~70 s (table below): **8.7 Hz for the first 24 min, 9.2 Hz after**; never 10 Hz on this box — a bare `setInterval(100)` measured 8.3 Hz under the same load (Windows timer granularity), and the simulation advances by real `dt`, so game time kept wall time; attack timing quantises to the longer tick |
| Ledger script | `server/scripts/_vfTutorialSweep.ts` (the model: `_ccTutorialSweep.ts`); machine-readable copy `sweep-1x.json` |
| Picks | `tutorial-picks.md` (the composition matrix at `57916b52`) |

## Every class completed the whole script, gate paid

Beats passed per chapter (a beat passes when every step ended `done`):

| Class | Clearing | Plains | Forest | Swamp | Mountain | Cave | Seals | Gate | beats | outcome | wall | deaths |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Striker | 11/11 | 11/11 | 5/5 | 8/8 | 4/4 | 13/13 | 4/4 | 3/3 | 59/59 | completed | 64m42s | 2 |
| Squire | 11/11 | 11/11 | 5/5 | 8/8 | 4/4 | 13/13 | 4/4 | 3/3 | 59/59 | completed | 64m01s | 2 |
| Slinger | 11/11 | 11/11 | 7/7 | 14/14 | 5/5 | 7/7 | 4/4 | 3/3 | 62/62 | completed | 53m56s | 2 |
| Spirit | 11/11 | 11/11 | 5/5 | 8/8 | 7/7 | 13/13 | 4/4 | 3/3 | 62/62 | completed | 46m42s | 2 |
| Apprentice | 11/11 | 11/11 | 5/5 | 10/10 | 7/7 | 13/13 | 4/4 | 3/3 | 64/64 | completed | 68m33s | 2 |
| Conduit | 11/11 | 11/11 | 5/5 | 8/8 | 7/7 | 13/13 | 4/4 | 3/3 | 62/62 | completed | 50m20s | 2 |

**No beat anywhere ended `stalled`, `blocked` or `skipped`, and no stall was raised.**

## The purchases

Time; the weapon in the slot (the bot's last `equip` of the weapon slot); the home zone's level
and Global Mastery at the purchase; how long the purchase's shards farm stood (0 s: the wallet
covered it).

| Class | Lean | Verb | The verb then reads |
|---|---|---|---|
| Striker | Loose Grip, 27m52s (Cave 2, GM 26, Chaotic Axe, farm 18 s) | Cleaving Blow, 30m27s (Cave 5, GM 29, Chaotic Axe, farm 136 s) | When your class mechanic fires (every 4 s at most), the hit lands twice. |
| Squire | Hewing Arc, 29m01s (Cave 3, GM 27, Chaotic Axe, farm 104 s) | Cleaving Blow, 30m12s (Cave 5, GM 29, Chaotic Axe, farm 67 s) | Your mechanic hits half again as hard. (pure) |
| Slinger | Coated Edge, 15m20s (Swamp 2, GM 14, Poison Dagger, farm 42 s) | Into the Wound, 18m23s (Swamp 5, GM 17, Poison Dagger, farm 90 s) | Hitting an afflicted target doubles its affliction. (pure) |
| Spirit | Loose Grip, 21m12s (Cave 2, GM 26, Chaotic Axe, farm 5 s) | Chopping Rhythm, 22m21s (Cave 4, GM 28, Chaotic Axe, farm 45 s) | Every 6th hit strikes twice. (pure) |
| Apprentice | Hewing Arc, 32m59s (Cave 2, GM 26, Chaotic Axe, farm 97 s) | Chopping Rhythm, 35m06s (Cave 4, GM 28, Chaotic Axe, farm 105 s) | Every 6th hit counts as your class mechanic firing. |
| Conduit | Loose Grip, 23m18s (Cave 2, GM 26, Chaotic Axe, farm 15 s) | Chopping Rhythm, 24m10s (Cave 4, GM 28, Chaotic Axe, farm 39 s) | Every 6th hit strikes twice. (pure) |

- **The boss weapon was in the slot at both purchases and in every boss fight, for all six**
  (equip events; the ledger flags any fight off it, and none was).
- The verb farm waits for the zone's level 4 and the shards; where the shards took longer the
  level had moved on (the Striker's, Squire's and Slinger's verbs at level 5).
- **How long the pair is live**: from the verb's purchase to the end of the script, 24–36 min
  (Spirit 24.4, Conduit 26.2, Apprentice 33.5, Squire 33.8, Striker 34.3, Slinger 35.6), every
  boss fight included — against 4.6–8.6 min and no boss fight in the course-correction sweep.
  Most of it is the seals and the gate: the verb's farming time (farm steps after the purchase,
  the gate's shard farm included) is short for the Axe plans (2.2–3.5 min: the Cave's last
  levels) and 13.6 min for the Slinger (the Swamp's last levels and the Mountain and Cave legs
  on the Dagger).

## The verb fired in every boss fight

The bought verb's landed `card-fx` per fight (boss combat start to end), the fight's length,
and the rate. "death" rows are the gate rounds lost before or at the start of the fight (see
Deaths). Own bleed ticks: the Slinger's own `bleed` DoT ticks inside the fight.

| Class | Plains seal | Mountain seal | Gate boss, wins (3) | Farming after the verb |
|---|---|---|---|---|
| Striker | 8 in 41 s (11.8/min) | 7 in 59 s (7.1/min) | Cave: 7, 7, 7 in 45–48 s (8.7–9.3/min) | 9 in 3.3 min |
| Squire | 6 in 42 s (8.5/min) | 7 in 57 s (7.4/min) | Cave: 6, 6, 6 in 46 s (7.7–7.9/min) | 10 in 2.6 min |
| Slinger | 6 in 33 s (10.9/min), 50 own bleed ticks | 6 in 31 s (11.8/min), 47 | Swamp: 4, 4, 4 in 22–24 s (9.8–10.7/min), 35–36 each | 70 in 13.6 min, 416 own bleed ticks |
| Spirit | 6 in 42 s (8.5/min) | 5 in 42 s (7.2/min) | Cave: 5, 5, 5 in 37–38 s (7.9–8.2/min) | 8 in 2.2 min |
| Apprentice | 5 in 40 s (7.4/min) | 4 in 47 s (5.1/min) | Cave: 4, 4, 4 in 39–40 s (6.0–6.1/min) | 9 in 3.5 min |
| Conduit | 23 in 45 s (30.7/min) | 20 in 65 s (18.4/min) | Cave: 23, 23, 23 in 45–50 s (27.6–30.5/min) | 26 in 2.9 min |

- **Every boss fight of the script — 2 seals and 3 gate wins, six classes, 30 fights — had the
  verb firing**, 4–8 times a fight for five classes (one firing every 5–12 s) and 20–23 for the
  Conduit. The live rates sit on the boss lab's (`tutorial-picks.md`: Striker 10.2/min, Squire
  6.6, Slinger 11.6, Spirit 7.3, Apprentice 6.0, Conduit 26.9).
- **The lean's own condition is observable for the one lean that seeds one**, the Slinger's
  Coated Edge (the Affliction lean's light bleed, design §24.9): the bot's own `bleed` ticks were
  **0 before the lean, 64 in the 3 min with the lean alone, 975 after the verb** (the lean's bleed
  plus Into the Wound's re-dose). The other five leans are plain stats (attack speed, Attack %),
  with nothing on the target to see.
- "Farming after the verb" counts farm steps only (travel inside them included); the per-minute
  rate there (2.6–5.1/min, Conduit 9.0) is lower than in a fight because it includes walking.
- No other card fired (the leans are stats; no capstone is worn until the gate's last step).

## Seals and gate

| Class | GM 30 | Plains seal | Mountain seal | Gate boss (3 kills) | Tier 2 | gate paid |
|---|---|---|---|---|---|---|
| Striker | 30m59s | 1/1, 41 s | 1/1, 59 s | Cave 3/5, 45–48 s | 44m35s | 64m42s |
| Squire | 30m47s | 1/1, 42 s | 1/1, 57 s | Cave 3/5, 46 s | 44m21s | 64m01s |
| Slinger | 27m10s | 1/1, 33 s | 1/1, 31 s | Swamp 3/5, 22–24 s | 36m47s | 53m56s |
| Spirit | 23m02s | 1/1, 42 s | 1/1, 42 s | Cave 3/5, 37–38 s | 31m33s | 46m42s |
| Apprentice | 36m13s | 1/1, 40 s | 1/1, 47 s | Cave 3/5, 39–40 s | 48m11s | 68m32s |
| Conduit | 24m48s | 1/1, 45 s | 1/1, 65 s | Cave 3/5, 45–50 s | 33m38s | 50m20s |

The gate pays the Ruinous Axe (Cave boss, Broodmother Chitin) for five classes and the Venom
Knife (Swamp boss, Toadeater Gland) for the Slinger. Every seal fell first try — including the
Striker's Mountain seal, 1/3 in the course-correction sweep (one replica each).

## Deaths

| Class | Where | Killer | Count |
|---|---|---|---|
| Spirit, Apprentice, Conduit | the Cave dungeon, the gate's second round | Cave Sentinel (guard) | 2 each |
| Striker, Squire | the Cave dungeon, the gate's second round | Cave Sentinel (guard) 1, Obsidian Broodmother 1 (at 100% HP, 2–4 s into the fight) | 2 each |
| Slinger | the Swamp dungeon, the gate's second round | Mire Keeper (guard) 1, Grave Toadeater 1 (at 100%, 3 s in) | 2 |

Every death is the gate chapter's second round, right after the first win: the same shape as the
course-correction sweep's Forest guard pack (two deaths per three kills for every class), now in
the Cave and the Swamp dungeons. No death anywhere else, no seal lost. The re-entry after a win
(the guard pack reformed, the boss woken at full HP within seconds) is a harness/encounter
question, not a card one; it was not diagnosed here.

## The Global Mastery the verb row needs (the provisional 10)

**Read off this sweep's own runs**: the Global Mastery each class held when its Forest first
reached level 4 (biome level-ups) — **10 for all six** (Plains 6 + Forest 4), at 10m31s–16m36s.
That is the value set in `ROW_GLOBAL_MASTERY` (design §24.9's "Forest 4", the designer's number,
provisional). The course-correction sweep agrees: every lean there was bought at Forest 2 with
GM 8 (Plains 6 + Forest 2). Nobody buys a Rapier verb in this script any more; for the Slinger
the lower gate moves the Dagger's verb from Swamp 6 to Swamp 4 (GM 16).

## Tick rate per server

`/healthz` tick counter against its capture time; start = the monitor's first sample, mid =
00:37 (the conductor cut its bench at ~00:40), end = the last sample before the server was
stopped.

| Server | Class | start | mid | end | Hz start→mid (CPU ~100%) | Hz mid→end | Hz whole |
|---|---|---|---|---|---:|---:|---:|
| 4331 | Striker | 2052 @ 00:13:17 | 14470 @ 00:37:02 | 36115 @ 01:16:12 | 8.72 | 9.20 | 9.02 |
| 4332 | Squire | 1336 @ 00:13:17 | 13790 @ 00:37:02 | 35469 @ 01:16:12 | 8.75 | 9.21 | 9.03 |
| 4333 | Slinger | 1082 @ 00:13:17 | 13496 @ 00:37:02 | 29348 @ 01:05:57 | 8.71 | 9.20 | 8.98 |
| 4334 | Spirit | 829 @ 00:13:17 | 13293 @ 00:37:02 | 29168 @ 01:05:57 | 8.75 | 9.21 | 9.00 |
| 4335 | Apprentice | 623 @ 00:13:17 | 13123 @ 00:37:02 | 37519 @ 01:21:20 | 8.78 | 9.19 | 9.05 |
| 4336 | Conduit | 402 @ 00:13:17 | 12794 @ 00:37:02 | 28685 @ 01:05:57 | 8.71 | 9.21 | 8.98 |

**Flag: the early stretch.** For the first ~24 minutes (the Clearing through the Swamp or the
Mountain, every class) the box was at 100% CPU and the servers ran 8.1–9.1 Hz per minute
(8.7 Hz mean); after the conductor cut its bench they held 9.2 Hz to the end, the box's
ceiling for a 100 ms `setInterval`. The six servers moved together, so the classes are
comparable with each other; against the course-correction sweep (same box, also saturated)
the early legs may run a few percent slower in wall time. Event-loop p99 stayed at or under
~100 ms (max 101.5 ms on 4331) except one 202 ms sample on 4335.

## Against the course-correction sweep (`reports/course-correction/sweep-1x.md`, `1297b206`)

| Class | GM 30 | Tier 2 | gate paid | deaths | beats |
|---|---|---|---|---|---|
| Striker | 32m56s → 30m59s | 53m41s → 44m35s | 68m41s → 64m42s | 4 → 2 | 60 → 59 |
| Squire | 33m36s → 30m47s | 46m04s → 44m21s | 61m54s → 64m01s | 2 → 2 | 60 → 59 |
| Slinger | 33m19s → 27m10s | 43m12s → 36m47s | 58m38s → 53m56s | 2 → 2 | 63 → 62 |
| Spirit | 23m38s → 23m02s | 33m23s → 31m33s | 47m25s → 46m42s | 2 → 2 | 63 → 62 |
| Apprentice | 40m30s → 36m13s | 52m38s → 48m11s | 69m25s → 68m32s | 2 → 2 | 65 → 64 |
| Conduit | 27m17s → 24m48s | 37m28s → 33m38s | 51m18s → 50m20s | 2 → 2 | 63 → 62 |

- **Every class reaches GM 30 and Tier 2 sooner** (GM 30 by 0.6–6.2 min, Tier 2 by 1.7–9.1 min):
  no walk back to the Forest for the verb, and the lean and verb live through the Cave leg and
  the seals. The Slinger gains most (6.2 min to GM 30), farming the Swamp, Mountain and Cave
  legs on the Dagger with both cards (one replica; the Dagger's own share against the Rapier
  is not separated).
- **Gate paid sooner for five classes** (0.7–4.7 min); the Squire's is 2.1 min later (its gate
  rounds in the Cave take 19.7 min against 15.8 for the Greatbear's).
- Deaths are unchanged in kind: two in the gate's second round for every class, now the Cave or
  Swamp dungeon instead of the Forest's. The Striker's two Mountain-seal losses are gone (1/1).
- **The verb fired**: in the course-correction sweep it was inert in every boss fight (the
  Rapier's pair, the Axe worn); here it fires 4–23 times in each of the 30 boss wins.

## The first-hour checklist, measured

The ideas each beat introduces, placed at the level the run was ACTUALLY at when the beat
started (farm beats already satisfied left out): **no level showed more than two new ideas, for
any class, and no idea-bearing line was skipped.** Where the tree beats landed:

| Class | page + shards | lean | Step Back | verb + ring |
|---|---|---|---|---|
| Striker | Cave 1 | Cave 2 | Cave 2 | Cave 5 |
| Squire | Cave 1 | Cave 3 | Cave 3 | Cave 5 |
| Spirit, Apprentice, Conduit | Cave 1 | Cave 2 | Cave 2 | Cave 4 |
| Slinger | Swamp 1 | Swamp 2 (with Avoid Hazards) | Cave 2 | Swamp 5 |

## What this sweep does not cover

- One replica per class: a 3/5 gate is one sample, not a rate.
- The client: the director's purchases, the lesson (its "same colour" line for the four pure
  pairs), the ring on the rhythm readout, and the gate chapter's loadout swap were not checked in
  a live client; the bot runs the same intents.
- The Rapier's T1 band in play: the verb row's Global Mastery 10 is pinned by tests and by the
  Forest-4 reading above, but no run bought a Rapier verb at Forest 4.
- The gate's second-round deaths (re-entry after a win), and the Swamp and Mountain bosses'
  behaviour for the Axe plans outside the seals.
- The lean's condition for a Control lean (no pick uses one; the slow is not observable to the
  bot).
