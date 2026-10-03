# Course correction — the canonical 1x six-class tutorial sweep (W3-B, 2026-10-03)

The guided tutorial after the course correction: the weapon page's two purchases (a lean
at Forest 2, a verb when its gates open), `unlockCard` + `setActive`, and the first-hour
checklist. One server and one game database per class, so no two bots share a world.

| | |
|---|---|
| Revision | `1297b206` (branch `feat/cc-tutorial`: lean + verb, setActive, the director lesson) |
| Route | `tutorial-<class>-t1` v1.2.0, policy `intended` |
| Rate | 1x: every server booted fresh, `--rewardMultiplier=1`, run headers `taints: []` |
| Harness | bots launched directly (`bot/src/run.ts`), **not** the frozen experiment runner: it builds its own containers and cannot point at per-class servers. So: 1x and untainted, not "frozen-runner canonical" |
| Isolation | servers on 4321–4326, databases `gamedb_cctut1`…`6` (dropped afterwards), shared logdb, one Redis pub/sub prefix per server (`REDIS_CHANNEL_PREFIX=cctutN`; the local Redis has 16 databases, so the assigned indices 21–26 do not exist, and the server's only Redis use is pub/sub, which ignores the index) |
| Time box | 75 min per class; every class finished inside it |
| Box | 12 cores, saturated by another session's eight bench processes for most of the sweep; the six servers held 10 Hz throughout (healthz tick counts) |
| Ledger script | `server/scripts/_ccTutorialSweep.ts`; machine-readable copy `sweep-1x.json` |

Later commits on the branch change only copy and the order of the Clearing's first beats
(see "The opening" below); the opening was smoke-run separately on `8b74cd4a`.

## Every class completed the whole script, gate paid

Beats passed per chapter (a beat passes when every step ended `done`):

| Class | Clearing | Plains | Forest | Swamp | Mountain | Cave | Seals | Gate | beats | outcome | wall | deaths |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Striker | 11/11 | 11/11 | 7/7 | 10/10 | 4/4 | 10/10 | 4/4 | 3/3 | 60/60 | completed | 68m41s | 4 |
| Squire | 11/11 | 11/11 | 7/7 | 10/10 | 4/4 | 10/10 | 4/4 | 3/3 | 60/60 | completed | 61m55s | 2 |
| Slinger | 11/11 | 11/11 | 9/9 | 12/12 | 5/5 | 8/8 | 4/4 | 3/3 | 63/63 | completed | 58m38s | 2 |
| Spirit | 11/11 | 11/11 | 7/7 | 10/10 | 7/7 | 10/10 | 4/4 | 3/3 | 63/63 | completed | 47m26s | 2 |
| Apprentice | 11/11 | 11/11 | 7/7 | 12/12 | 7/7 | 10/10 | 4/4 | 3/3 | 65/65 | completed | 69m26s | 2 |
| Conduit | 11/11 | 11/11 | 7/7 | 10/10 | 7/7 | 10/10 | 4/4 | 3/3 | 63/63 | completed | 51m19s | 2 |

**No beat anywhere ended `stalled`, `blocked` or `skipped`, and no stall was raised.**

## The purchases

Time, the run's own Forest level and Global Mastery at the purchase, and how long the
purchase's shards farm stood (0 s: the wallet already covered it, the beat was skipped).

| Class | Lean | Verb | The verb then reads |
|---|---|---|---|
| Striker | Quick Wrist, 12m26s (Forest 2, GM 8, farm 55 s) | Opening Lunge, 23m22s (Forest 6, GM 18, farm 151 s) | Your first hit on each new target lands twice. |
| Squire | Keen Edge, 12m51s (Forest 2, GM 8, farm 125 s) | Flurry, 23m38s (Forest 6, GM 18, farm 40 s) | Every 6th hit is a lunge for double damage. |
| Slinger | Quick Wrist, 11m29s (Forest 2, GM 8, farm 41 s) | Opening Lunge, 23m52s (Forest 6, GM 18, farm 166 s) | Your first hit on each new target lands twice. |
| Spirit | Keen Edge, 10m40s (Forest 2, GM 8, farm 64 s) | Flurry, 17m43s (Forest 6, GM 18, farm 0 s) | Every 6th hit is a lunge for double damage. |
| Apprentice | Envenomed, 16m00s (Forest 2, GM 8, farm 84 s) | Opening Lunge, 29m40s (Forest 6, GM 18, farm 176 s) | Your first hit on each new target leaves a heavy poison or bleed, a whole swing over 4 s. |
| Conduit | Quick Wrist, 10m28s (Forest 2, GM 8, farm 35 s) | Opening Lunge, 18m56s (Forest 6, GM 18, farm 131 s) | Your first hit on each new target lands twice. |

- Every lean was bought at Forest 2 and every verb at Global Mastery 18 — the end of the
  Swamp leg — exactly where the script places them. The verb's walk back to the Forest
  cost 40–176 s; the Spirit's max-ed Forest had already paid for Flurry.
- **The Flash Rapier was in the weapon slot at both purchases for all six** (equip events).
- **How long the verb was live**: from its purchase to the Cave's weapon swap, 4.6–8.6 min
  and 28–37 kills (Spirit 4.6 min / 31, Conduit 6.4 / 33, Slinger 7.2 / 28, Squire 7.3 / 30,
  Striker 7.3 / 28, Apprentice 8.6 / 37). The lean was live 11.6–22.2 min. After the swap
  both are inert for the rest of the script, including every boss fight (designer call).
- The bot records no per-card firing counts, so this sweep does not show the verb firing;
  the firing and its readout are pinned by the server's lineage wiring tests.

## Seals and gate

| Class | GM 30 | Plains seal | Mountain seal | Greatbear (gate, 3 kills) | Tier 2 | gate paid |
|---|---|---|---|---|---|---|
| Striker | 32m56s | 1/1, 54 s fight | **1/3**, 67 s (lost twice at 8%) | 3/5, 30–32 s | 53m41s | 68m41s |
| Squire | 33m36s | 1/1, 51 s | 1/1, 77 s | 3/5, 34–35 s | 46m04s | 61m54s |
| Slinger | 33m19s | 1/1, 43 s | 1/1, 48 s | 3/5, 27–28 s | 43m12s | 58m38s |
| Spirit | 23m38s | 1/1, 50 s | 1/1, 51 s | 3/5, 29 s | 33m23s | 47m25s |
| Apprentice | 40m30s | 1/1, 47 s | 1/1, 54 s | 3/5, 33–34 s | 52m38s | 69m25s |
| Conduit | 27m17s | 1/1, 54 s | 1/1, 76 s | 3/5, 32–35 s | 37m28s | 51m18s |

## Deaths

| Class | Where | Killer | Count |
|---|---|---|---|
| all six | the Forest dungeon's guard, during the gate's Greatbear rounds | Young Wolf / Forest Sentinel (not the boss) | 2 each |
| Striker | the Mountain seal | Crag Behemoth (boss), left at 8% both times | 2 |

The gate chapter's cost is still the Forest guard pack, two deaths per three kills for every
class, as in the 2026-10-02 evening sweep. The Striker's two Mountain losses are new against
that sweep (1/1 there); one replica each, on a saturated box, with the seal kit (Chaotic
Axe, no lineage cards) — a boss-lab question, not a tutorial one.

## Against the 2026-10-02 evening sweep (same harness shape, `637ce2f5`)

| Class | GM 30 | Tier 2 | gate paid | deaths |
|---|---|---|---|---|
| Striker | 34m25s → 32m56s | 52m30s → 53m41s | 67m39s → 68m41s | 2 → 4 |
| Squire | 34m51s → 33m36s | 52m38s → 46m04s | 68m30s → 61m54s | 2 → 2 |
| Slinger | 29m38s → 33m19s | 44m25s → 43m12s | 63m14s → 58m38s | 2 → 2 |
| Spirit | 27m00s → 23m38s | 40m24s → 33m23s | 54m38s → 47m25s | 2 → 2 |
| Apprentice | 40m52s → 40m30s | 62m07s → 52m38s | 77m27s → 69m25s | 2 → 2 |
| Conduit | 29m24s → 27m17s | 44m37s → 37m28s | 58m12s → 51m18s | 2 → 2 |

The route is shorter (60–65 beats against 78–85: no upgrade beats, two purchases instead of
one) and five of six classes pay the gate sooner, by 4.6–8.0 min (the Striker 1.0 min later); the verb's Forest detour (up to 3 min)
is inside that.

## The first-hour checklist, measured

The checklist's ideas (`TutorialBeat.teaches`, `shared/src/tutorial/concepts.ts`) placed at
the level each run was ACTUALLY at when the beat started, leaving out farm beats that were
already satisfied (the guide never shows those):

- **Plains → Gate (this sweep): no level showed more than two new ideas, for any class.**
- **Skipped lines that carried an idea**, now moved to lines that always show: the verb's
  shards farm for the Spirit (the verb's idea now rides on the purchase line), and the gate
  chapter's farm for all six (Tier 2 arrives with the essence and Gale Shards in hand; the
  capstone line now says the chapter is optional, the gate idea rides on the gate beat).
- **The opening (this sweep, old order)**: the ten Wisps of the tier-0 quest carry the
  Clearing to level 3 by themselves, so with the quest first the club's and the armor's farm
  beats were skipped and the class, the gear, the armor and the charm reached the player
  within ~15 s of the tier-up. Fixed on the branch (`81d5f79e`, `bb85fc6b`): the club and the
  Bark Wrap are made during the quest, the boots' idea rides on their craft line.
- **The opening (smoke run, `8b74cd4a`, Striker, 8 min, its own fresh character on the Spirit's
  server while that bot was in the Cave)**: club at 45 s (Clearing 2), Bark Wrap at 85 s, tier-up
  at 102 s (the old order: 118–128 s), class and charm at Clearing 3, boots and Runes at
  Clearing 4. No level showed more than two new ideas, and no idea-bearing line was skipped.
  Clearing 11/11, Plains 10/11 when the time box ended in `max:plains`.

## What this sweep does not cover

- One replica per class: a 3/5 gate or a 1/3 seal is one sample, not a rate.
- The client: the director's `setActive`, the lesson (ring on the bought card, then on its
  readout ring) and the panel showing a finished beat's lesson line are not exercised by the
  bot and were not checked in a live client.
- Whether the verb fired: the bot records no card firings.
- The farewell, the Swamp and Cave bosses (never fought by the script).
- The new opening beyond its first 8 minutes, and the copy-only commits after `1297b206`.
