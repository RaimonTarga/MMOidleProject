# Playtest follow-up command center (2026-09-25)

The orchestration record for the v0.5 playtest follow-ups. Codex started these
workstreams and ran out of usage mid-flight. Each workstream gets **one dedicated
session**. Start each session by reading its section here, then the linked study.

Base for everything below: `develop` after the v0.5 release plus the 2026-09-25
study commits. Old Codex worktrees branch from `ff98ba45`, which is pre-v0.5. Rebase
before merging.

## Status board

| # | Workstream | State | Where the work lives | Blocking decision |
|---|---|---|---|---|
| 1 | Volcano nerf | **Shipped to develop** | `da67d907` | none (verification only) |
| 2 | Defense rework | Implemented, iterating (6 commits, unpushed) | branch `codex/defense-redesign-01`, worktree `../mmo-defense-candidate` | adopt the whole package or split it |
| 3 | Conduit buff | Maintenance runes + Rebuild Formation shipped (`ca90ec3f`); hp50 candidate **not applied** | `reports/conduit-study-2026-09-25/` (bench runner on develop) | early-only vs all tiers; how the extra HP carries through frame unlocks |
| 4 | XP / mastery pacing | XP-only candidate tested in 72 runs (iterations 04-05); **uncommitted** | worktree `../mmo-reward-xp-only` (branch `codex/reward-xp-only-validation`) | saved-XP migration policy; slow-build (defensive) target |
| 5 | Essence / upgrade economy | T2-T4 rescale committed locally (unpushed); campaign 02 prep uncommitted | branch `codex/economy-v2`, worktree `../mmo-economy-v2` | run after #4 is stable |
| 6 | T4 class balance | Candidate code written, **smoke-tested only**, uncommitted | worktree `../mmo-t4-scaling-candidate` (branch `codex/t4-scaling-candidate-01`) | which of the 5 proposals to take |

## Recommended order

1. **Defense (#2)** first. It changes the damage pipeline: charged-hit plating order,
   class/item DR grouping, Guard position, **Conduit redirection order**, debt
   installments, splash. Every later measurement of survival, Conduit, or time-to-mastery
   is stale until this lands or is rejected.
2. **Conduit (#3)** next. Its study predates the defense branch, which moves summon
   redirection. Re-measure on top of the adopted defense.
3. **T4 balance (#6)**. It is offense-side and mostly independent. The Voidwalker
   correctness fix can land at any time.
4. **XP pacing (#4)**. It measures time, so it absorbs all changes above. Exception: if
   the next playtest is soon, ship the XP-only budgets early as a first pass (lowest risk,
   and it fixes the most visible complaint), then recalibrate after #2, #3, and #6.
5. **Economy (#5)** last. It is coupled to the XP clock: essence at mastery scales with
   mastery time.

The Volcano verification (#1) and the **Volcanic approach stall** (see below) are small.
Either can join another session.

---

## 1. Volcano nerf: shipped

- **On develop:** Heat incoming 4.5%→3.5% per stack; Ash Salamander atk 84→70; Ember Skink
  atk 75→60, Burn 13→8; Ashspitter atk 110→95, Burn 16→12. The test and ecology doc are
  updated.
- **Evidence:** [EXPERIMENT.md](../../reports/volcano-area-study-2026-09-25/EXPERIMENT.md).
  10-min survival went 5/12→7/12; the T3 Striker went from ~45 s to 380-580 s. Boss outcomes
  are unchanged.
- **Open:**
  - T3 Conduit still dies in both seeds. That belongs to #3.
  - Long no-progress gaps, up to 237 s. That is the stall below.
  - Human play has not happened yet.
- **Session work:** none needed. Fold a human Volcano pass into the next playtest.

### Cross-cutting bug: Volcanic approach/avoidance oscillation

Seen in both the Volcano study and reward iteration 04 (Striker seed 101033). The player
sits at full HP inside a ~171×62 px area, alternating between the "approach" and "hazard
avoidance" intents, and earns no XP for minutes. The hazard-approach timeout is
target-specific, so target switching may reset it. Diagnostic evidence:
`reports/reward-mastery-study-2026-09-25/iteration-04/stall-diagnosis.json` and
`iteration-05/stall-probe/`. This is an auto-combat AI fix, not balance. **Suggested:**
a short standalone session, or bundle it with #4.

## 2. Defense rework

- **Code:** `codex/defense-redesign-01`, 6 commits on `ff98ba45`, not pushed. It includes
  the same Volcano values as develop (verified identical), so the rebase is clean there.
- **Read:**
  - `reports/defense-iteration-02/CONSOLIDATED-PATCH-NOTES.md` (full before/after, the best
    single summary)
  - `reports/defense-iteration-03/REPORT.md` (latest)
  - `reports/player-defense-study-2026-09-25/REDESIGN-PROPOSAL.md` (on develop)
- **What it does:**
  - Plating narrowed to specialist families.
  - General DR becomes the common layer.
  - Ranged core HP penalties removed.
  - Juggernaut trimmed.
  - Desert gets opening protection.
  - Tundra stationary DR is made multiplicative.
  - Volcano hardening shrinks.
  - Graveyard reactive plating.
  - Class roots move from plating to DR.
  - Pipeline-order fixes (listed above).
- **State:**
  - The old broad comparison was 81 vs 97 deaths in 218 cases. It has **never been
    requalified** in one fresh full matrix against the original defenses with the updated
    Volcano in both arms.
  - Iteration 03 held all Desert/Jungle coefficient variants.
  - Iteration 04 (finite-pack replay pilot) started, but only
    `reports/defense-iteration-04/pilot-*` exists, uncommitted in the worktree.
- **Session goal:**
  1. Rebase onto develop.
  2. Commit the iteration-04 pilot.
  3. Run the finite-pack replay the iteration-03 report specifies.
  4. Run **one** fresh full original-vs-candidate matrix (all classes, T1-T4, bosses).
  5. Decide adoption.
  6. Human-play check.
- **Decide with the user:** ship as one package, or split it (pipeline correctness fixes
  first, armor rebudget second).

## 3. Conduit buff

- **Already on develop:** class maintenance runes are baseline, and Rebuild Formation
  exists (`ca90ec3f`).
- **Candidate:** summon HP ×1.5 with the replacement ratio going 0.30→0.20, so per-replacement
  HP payments stay roughly flat. Timers, offense, and owner stats are unchanged.
  [REPORT.md](../../reports/conduit-study-2026-09-25/REPORT.md). T1 improves in every
  context. T2 Heavy boss goes from 0/2 to 2/2. T3 Heavy/far Volcano **regresses**. T4 is
  neutral and mixed per specialization.
- **Known gaps:**
  - The T3 normal boss hit (204) exceeds the buffed body HP (111), so hp50 does not cross
    the survival threshold.
  - T3 farming deaths are 17/20 in both arms. The owner dies with summons intact, so the
    early-game fix does not address upper tiers.
  - Reward study: Conduit spends about half its Tundra time under Recover First.
- **Session goal:**
  1. Apply hp50 gated to early tiers, or with a taper through frame/range unlocks so there
     is no durability cliff.
  2. Re-measure on top of the defense result.
  3. Diagnose T3 owner exposure and summon targeting from the recorded failing lives.
  4. Do not stack a timer cut on top to hide those failures (the study's own advice).

## 4. XP / mastery pacing

- **User targets:** T1 5 / T2 15 / T3 30 / T4 60 min per biome segment. For T4, "fast"
  builds should take about 50 min and slow viable builds about 90.
  (`design_docs/economy-philosophy.md`)
- **Candidate** (`../mmo-reward-xp-only`, uncommitted):
  - `BIOME_XP_SEGMENT_BUDGET_BY_TIER` goes from `[1750, 5000, 7000, 9000]` to
    `[1750, 3750, 42000, 600000]`.
  - New T4-only mastery XP factors: Tundra ×1.8, Desert ×2.4. Essence and catalysts are
    untouched.
- **Evidence:**
  - Iteration 04: 48 runs. Striker takes 49-51 min, offensive Squire and no-Recover-First
    Conduit take 89-93 min.
  - Iteration 05 holdout: 24/24 complete (for example Conduit Tundra-03 at about 66 min,
    Squire Desert-01 at 84-86 min). This batch is **not written up yet**:
    `reports/reward-mastery-study-2026-09-25/iteration-05/holdout/summary.json`.
- **Known gaps:**
  - The original *defensive* builds (Squire Defensive stance, Conduit with Recover First)
    still take 110-124 min.
  - T2/T3 pacing is not validated with viable fixtures.
  - Volcanic is not calibrated because of the stall.
  - Future tiers inherit 600k.
  - No saved-XP migration: raising thresholds leaves existing players above their level
    threshold. The v0.5 decision said playtest saves are disposable. Confirm that still
    holds.
- **Rejected:** candidate 01's full package, which put T1 at 6000 XP (much too slow).
- **Session goal:**
  1. Write up iteration 05.
  2. Commit the candidate on its branch.
  3. Decide the migration policy and the slow-build target.
  4. Land it on develop, optionally before #2, #3, and #6 (see order).

## 5. Essence / upgrade economy

- **Code:** `codex/economy-v2` (`aa9f7d6c`, local only): a T2-T4 price and supply rescale
  with static validation. `reports/economy-v2/README.md` shows +3 at about 0.5× mastery
  essence and +5 at about 1.2-1.4×. Campaign 02 prep (560 rate windows, 32 pacing lives)
  is uncommitted in that worktree.
- **Target:** a full +3 set affordable at mastery; +5 at about 1.5× that time.
- The reward study shows XP and essence supply are coupled. Longer mastery means more
  essence at cap. Economy-v2 was projected against the **old** XP clock.
- **Session goal:** rebase onto the adopted XP budgets, re-run the static audit, then run
  the campaign 02 dynamic check.

## 6. T4 class balance

- **Proposals** ([STUDY.md](../../reports/t4-scaling-study-2026-09-25/STUDY.md)):
  - **Voidwalker:** route the stored-energy discharge through normal target mitigation.
    This is a correctness fix and the top priority.
  - **Berserker:** `rampage-aps-per-stack-ms` 60→30.
  - **Juggernaut:** cap the Crescendo finisher bonus at +100%.
  - **Melter:** laser flat on-hit takes the first 30 at full value and the excess at 60%.
  - **Invoker:** `critical-mass-gain-per-stack` 0.20→0.10.
  - **Devout Priest / Apprentice paths:** hold.
- **Code:** all five are implemented in `../mmo-t4-scaling-candidate`, uncommitted, with only
  one smoke run. Watch two things there:
  - Two constants files were rewritten with CRLF (155-line whole-file churn for a 1-line
    change). Normalize line endings before committing.
  - The Crescendo implementation uses a **logarithmic knee** past +100%, not the hard cap
    the study proposed. Confirm which one is intended.
- **Session goal:**
  1. Clean and commit the candidate.
  2. Run the paired World-based screen (+0/+5, farm and Iron-Crest Titan) against develop.
  3. Take the proposals one at a time, Voidwalker first.
  4. Leave numbers the user wants to hand-tune as named constants (see the balance-workflow
     preference: the user edits pure numerical passes directly).

---

## Housekeeping

- **Unpushed branch work:** `codex/defense-redesign-01` (6 commits) and `codex/economy-v2`
  (1 commit) exist only on this machine. The XP-only, reward-candidate, and T4 worktrees
  have only uncommitted changes. Commit and push each one to its own branch at the start of
  its session.
- **Superseded:**
  - `codex/reward-mastery-candidate-01` holds candidate 01's rejected full package, with
    recipe edits.
  - The `mmo-reward-baseline`, `mmo-t4-scaling-baseline`, and `mmo-defense-control`
    worktrees are control checkouts at `ff98ba45`. Their "changes" are line-ending churn
    plus the essence-mote event that has already shipped.
  - These can be removed once their sessions no longer need a control arm.
- **Raw evidence** lives outside git: `D:/mmo-idle/*`, plus the >1 MB reward traces listed
  in `reports/reward-mastery-study-2026-09-25/.gitignore`.
