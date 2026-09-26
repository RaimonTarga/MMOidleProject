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
- **Volcanic T3 was a survival problem, not a pacing one.** A follow-up difficulty pass (branch
  `balance/volcanic-t3-nerf`) takes it from 12/12 bot deaths to 3/18, all of them Spirit, with a
  30.6–32.0 min median after a ×0.75 XP factor. See the last section.

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

## Volcanic T3 (difficulty pass, branch `balance/volcanic-t3-nerf`)

### Diagnosis

At the shipped values every bot dies at T3 Volcanic: 6/6 on node 02 and 6/6 on node 04, most
inside 2 minutes. Damage attribution (`probe-damage.ts`, world-log damage events, 1 s aggro
samples) shows two phases:

- **Opening pull.** A Cinder Hound arrives with about four Ember Scuttlers, roughly 175 raw DPS.
  It takes a full-HP 480–520 HP player to 0 in 3–5 s after 3–4 kills. Environment/DoT is under 5%.
  Density near spawn is normal (3 monsters within 700 px).
- **Heat late.** When the opening is survived, auto-farming never leaves combat, so Heat climbs to
  27–50 stacks: +36–42% damage taken even after the soft cap. Two or three bodies (Tortoise +
  Salamander, or Hound + Salamander) then burst a full-HP player in about 4 s.

### Variants (runtime overlays via `patched-harness.ts`; deaths out of 6 per node)

| Variant | Node 02 | Node 04 |
|---|---:|---:|
| Baseline | 6 | 6 |
| A: Scuttler attack 45 → 34 | 5 | – |
| B: smaller packs | 5 | – |
| C: Heat 3.5% → 2% (all tiers) | 5 | – |
| A+B | 4 | – |
| B+D: B, Scuttler 30, Salamander 55, Hound 65 | 4 | 4 |
| E1: B+D, Scuttler HP 500 | 3 | 4 |
| E2: E1, Tortoise 95, T3 Heat 2.5% | 2 | 5 |
| E3: B, Scuttler 500/30, Salamander 50, Hound 55, Tortoise 90, T3 Heat 2% | 1 | 2 |
| G: across-the-board ×0.7 attack, B, Scuttler HP 500, T3 Heat 2.5% | 2 | 3 |
| E4: E3, T3 Heat cap 20 | 1 | 2 |
| **E5: E3, T3 Heat cap 15** | **0** | **2** |
| E6: E3 at 3.5% Heat, cap 15 | 1 | 3 |

### Shipped on the branch (E5, authored in data, then re-measured without overlays)

- Packs: Tortoise 1 + 2 Scuttlers + one of {Scuttler, Salamander} = 4 (was 5–6).
  Hound 1 + 1 Scuttler + one of {Scuttler, Salamander} = 3 (was 4–5). Density is unchanged,
  so the same bodies arrive in smaller pulls.
- Ember Scuttler 650/45 → 500/30. Cinder Hound attack 80 → 55. Magma Tortoise 116 → 90.
  Ash Salamander 70 → 50.
- T3 Heat: 2% taken per stack, capped at 15 (`volcanicHeat(id, biomeTier)`). T4 keeps 3.5%, uncapped.
  Outgoing +3% per stack is unchanged but now also stops at 15.
- T3 Volcanic mastery XP factor ×0.75, since survivors mastered in about 23 min.

| Final (no overlays) | Deaths | Median mastery (min) |
|---|---:|---:|
| Node 02, seed 101051 | 1/6 (Spirit) | 30.6 |
| Node 04, seed 101063 | 1/6 (Spirit) | 31.2 |
| Node 05, seed 101077 (fresh holdout) | 1/6 (Spirit) | 32.0 |

Spirit is the lightest frame (441 HP) and also dies in T3 Jungle and Swamp in these sweeps. That
is class fragility, not a Volcanic outlier. The T3 Volcanic dungeon uses the same Heat feature, so
its boss fight also gets the capped T3 Heat. It has not been re-measured.

## Reproduce

From `reports/reward-mastery-study-2026-09-25`:

```bash
TIERS=2,3 WORKERS=10 node xp-sweep-2026-09-26/run.mjs <out>                 # T2+T3, calibration nodes
TIERS=2,3 NODE=04 SEED=101063 node xp-sweep-2026-09-26/run.mjs <out>        # holdout
TIERS=4 WALL=1500000 node xp-sweep-2026-09-26/run.mjs <out> 'mountain|jungle'
TIERS=3 VOLC_VARIANT=BD node xp-sweep-2026-09-26/run.mjs <out> volcanic      # letter variants
xp-sweep-2026-09-26/volc-batch.sh E5 "$(cat xp-sweep-2026-09-26/v-E5.patch.json)"  # JSON overlay, nodes 02+04
node xp-sweep-2026-09-26/summarize.cjs <out>
node xp-sweep-2026-09-26/volc-compare.cjs <out>...                            # volcanic deaths/mastery table
```

The overlay variants only reproduce against pre-pass data (develop `6e2838d6`). On this branch
the authored values already include E5.

`run.mjs` reads baked hitboxes from the main checkout (`../MMO idle/server/dist/hitbox`).
