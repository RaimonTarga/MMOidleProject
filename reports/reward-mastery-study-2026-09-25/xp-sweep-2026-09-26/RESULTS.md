# Mastery pacing sweep, all biomes T2–T4 (2026-09-26)

Trigger: a live playtest where Conduit mastered T2 Mountain in about 6 minutes (target 15).
Targets are T2 15, T3 30 and T4 60 minutes per biome segment.

## Verdict

- **The problem is T2, and it covers every biome, not just Mountain or Conduit.** At the shipped
  values, six of seven T2 biomes master in 5–11 minutes (median of 6 classes). Only Desert is
  on target. The bot run reproduces the report exactly: Conduit on T2 Mountain takes **5.98 min**.
- **T3 is roughly on target but spread 18–42 min.** Swamp is fast (18), Jungle and Desert slow (40–42).
- **T4 was only calibrated for Tundra/Desert.** Mountain, Jungle, Graveyard and Trench project
  to 140–250 min for Striker, the build the Tundra/Desert factors were tuned on.
- **Candidate:** per-biome mastery XP factors at T2, T3 and T4. No budget change. After the
  change, every non-Volcanic biome lands within about ±15% of target, on both the calibration
  nodes and a holdout (different node and seed).
- **Volcanic T3 is a survival problem, not a pacing one.** See the last section.

## Method

- Harness: `../run-bot-t4-cross.ts` (the iteration-05 harness, unchanged), driven by `run.mjs`.
  Mature "established"/"developed" survivor loadouts from `iteration-02/historical-survivors.json`,
  one per class: Striker, Conduit, Squire, Slinger, Spirit, Apprentice. The target biome is reset
  to the segment entry level, rewards are 1×, and each run stops at mastery, first death, a
  3-minute no-XP plateau, or 3× target (150 min for T4).
- Source: develop `6e2838d6` in a clean worktree, without the main tree's uncommitted combat edits.
- Calibration uses node `-02` and seed 101051. Holdout uses node `-04` and seed 101063.
- T4 uses only Striker and Conduit, the reference builds of iterations 04/05.
- A projected time (`*`) is elapsed time ÷ segment fraction for runs that ended early.
- Raw per-run JSON is not committed (~330 MB). `tables.txt` has every table, and each
  `*/summary.json` holds per-run rows.

## Results (median minutes to mastery across classes)

| T2 biome | Before | Candidate (calib) | Candidate (holdout) | Factor |
|---|---:|---:|---:|---:|
| Cave | 5.1 | 14.3 | 14.9 | 0.35 |
| Swamp | 5.3 | 15.3 | 14.9 | 0.35 |
| Plains | 6.9 | 15.5 | 15.4 | 0.45 |
| Mountain | 8.0 | 15.0 | 12.4 | 0.55 |
| Forest | 9.4 | 13.8 | 13.0 | 0.65 |
| Jungle | 11.3 | 15.0 | 15.4 | 0.75 |
| Desert | 15.3 | 15.3 | 15.1 | – |

| T3 biome | Before | Candidate (calib) | Candidate (holdout) | Factor |
|---|---:|---:|---:|---:|
| Swamp | 18.3 | 31.4 | 32.8 | 0.6 |
| Cave | 26.5 | 29.7 | 28.9 | 0.9 |
| Mountain | 27.4 | 30.8 | 34.7 | 0.9 |
| Tundra | 35.6 | 29.6 | 30.8 | 1.2 |
| Desert | 40.1 | 31.4 | 31.5 | 1.3 |
| Jungle | 42.3 | 30.2 | 29.1 | 1.4 |
| Volcanic | deaths | – | – | – |

| T4 biome (Striker / Conduit) | Before | Candidate (calib) | Candidate (holdout) | Factor |
|---|---:|---:|---:|---:|
| Tundra | 58.0 / 67.8 | unchanged | – | 1.8 (existing) |
| Desert | 53.9 / 81.9 | unchanged | – | 2.4 (existing) |
| Volcanic | 54.0 / 76.4 | unchanged | – | – |
| Mountain | 149* / 181* | 55* / 65.5 | 54.8 / 69.4 | 2.7 |
| Jungle | 189* / 246* | 55.4 / 73.5 | 53.5 / 72.1 | 3.4 |
| Graveyard | 157* / 204* | 54.8 / 71.5 | 55.2 / 77*(D) | 2.85 |
| Trench | 142 / 216* | 55.5 / 80.3 | 63.7 / 96.7 | 2.6 |

Conduit on T2 Mountain goes from 6.0 to 10.9 min (holdout 10.5). Conduit and Spirit remain the
fastest T2 classes (10–14 min) and Squire/Striker the slowest (16–23). That spread is class
balance, not biome pacing, so it is not corrected here.

T4 Volcanic now reaches mastery in 54–76 min, so the approach stall recorded in iteration 05 no
longer reproduces on node 02. With no factor it already sits near target.

### Why factors below 1 rather than a bigger T2 budget

Rewards use the killed monster's node tier, and the player tier sets the cap. A T3 player can
therefore fill their T3 segment from T2 nodes. Raising the T2 budget ~3× would need Desert/Jungle
factors up to 3×, making T2 Desert farming almost as fast as T3 Desert for the T3 segment. Scaling
the fast biomes down cannot open that route.

## Side effects checked

- **Essence is unchanged per kill**, but players bank more of it before cap. In T2 Cave, Plains
  and Swamp, a full native +3 set becomes affordable at 13–14 min, just before mastery at about
  15. That matches the earlier "+3 at mastery" goal. Elsewhere +3 funding still lands after mastery.
  See `funding.txt`.
- Pre-existing, not caused by this change: T3 Swamp funds a full +3 set in 8 min and +5 in 25.
- Unit tests touching the curve, recipe gates, reward multipliers and runes pass.

## Findings outside XP pacing

1. **T4 Mountain navigation stall (bug).** On `node-t4-mountain-02`, seed 101051, Striker stops
   earning XP at 42–45 min in every run. It is at full HP, and its intent is "Nearest eligible
   target" on a Cragback Rhino 765 px away. It oscillates along y≈3536 and never reaches the rhino.
   This looks like ledge-ring pathing (`mountainPasses`), the same class of issue as the old
   Volcanic approach stall.
2. **Conduit T3 Desert stall (summon starvation).** At full HP beside damaged Dune Stalkers, the
   Conduit earns no XP for 3+ min. Only 0–2 of its 5 summons are alive, with 2–4 queued for
   reconstruction. Summons have 97 HP and Sandweavers hit for ~96, so each hit kills one summon
   and the formation never recovers. Reproduces on the holdout node (88 min projected).
3. **Formation Broken → Flee prototype.** A new Summoner-only condition, "Formation Broken":
   half or fewer summons standing. Paired with the existing Flee action, it was tested on every
   T2 and T3 biome for Conduit. It is neutral or mildly positive elsewhere (T3 Cave 30.6 → 24.5
   min, others within ±2 min). It does **not** fix the Desert stall: the bot retreats, rebuilds to
   5/5, re-engages and loses the formation before a 4,050-HP Dune Stalker dies (0 kills in
   3 min). Adding Rebuild Formation (Always) changes nothing. The Desert matchup needs
   summon survivability or a Sandweaver damage look, not a movement rune. The rune ships as an
   option on this branch. Drop commit `feat(runes)` if unwanted.
   In T2 the extra rule pushes the survivor loadout over its rune-point budget (30/28), so T2
   was not measured.

## Volcanic T3 (difficulty)

Every class dies at T3 Volcanic. On node 02 (baseline), 5/6 die, 3 of them inside the first
minute. On the holdout node 04, 6/6 die within 2 min. Damage attribution
(`probe-damage.ts`, world-log damage events) shows deaths come from **direct hits of the
pack**: Ember Scuttler swarms (43–57 per hit), Ash Salamander (68–101), Magma Tortoise (168).
Environment/DoT damage is under 5%. Monster density near spawn matches other T3 biomes
(3 within 700 px). The problem is that 3–5-body packs out-damage a 440–600 HP player.

Variants tested at runtime via `patched-harness.ts`, 6 classes each (deaths / 6):

| Variant | Node 02 | Node 04 |
|---|---:|---:|
| Baseline | 5 | 6 (all < 2 min) |
| A: Scuttler attack 45 → 34 | 5 | – |
| B: smaller packs (Tortoise 3 → 2 Scuttlers, Hound 2 → 1) | 5 | – |
| C: heat incoming 3.5% → 2% per stack | 5 | – |
| A+B | 4 | – |
| B+D: B plus Scuttler 30, Salamander 55, Hound 65 | 4 | 4 |

Heat (C) barely matters at T3: the deaths happen before it builds. Even the strongest variant
leaves only Squire (heavy) and Conduit alive. Survivors of B+D master in 22–38 min, near the
30-minute target. **Recommendation:** use B+D as the minimum floor and look at why light and
balanced frames lose the opening exchange. Candidates: Scuttler pull/aggro radius, how many packs
chain on engagement, and whether Volcanic's native T3 armour is meant to carry fire mitigation.
These loadouts use Mountain T3 gear because no Volcanic survivor cell exists. No Volcanic data
change is proposed on this branch.

## Reproduce

From `reports/reward-mastery-study-2026-09-25`:

```bash
TIERS=2,3 WORKERS=10 node xp-sweep-2026-09-26/run.mjs <out>                 # T2+T3, calibration nodes
TIERS=2,3 NODE=04 SEED=101063 node xp-sweep-2026-09-26/run.mjs <out>        # holdout
TIERS=4 WALL=1500000 node xp-sweep-2026-09-26/run.mjs <out> 'mountain|jungle'
TIERS=3 VOLC_VARIANT=BD node xp-sweep-2026-09-26/run.mjs <out> volcanic      # difficulty variants
node xp-sweep-2026-09-26/summarize.cjs <out>
```

`run.mjs` reads baked hitboxes from the main checkout (`../MMO idle/server/dist/hitbox`).
