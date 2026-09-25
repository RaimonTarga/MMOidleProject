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
| 4 | XP / mastery pacing | **First pass shipped to develop**; recalibrate after #2, #3, #6 | `feat/xp-pacing` (merged) | none (decided 2026-09-25, see section 4) |
| 5 | Essence / upgrade economy | T2-T4 rescale committed locally (unpushed); campaign 02 prep uncommitted | branch `codex/economy-v2`, worktree `../mmo-economy-v2` | run after #4 is stable |
| 6 | T4 class balance | **Shipped to develop**: Voidwalker fix + Berserker 30 + Juggernaut log knee (numbers signed off); Melter/Invoker held | [screen](../../reports/t4-balance-2026-09-25/SCREEN.md) | none (Melter/Invoker revivable later) |

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
`iteration-05/stall-probe/`. This is an auto-combat AI fix, not balance.

**Fixed on branch `fix/volcano-approach-stall`** (worktree `../mmo-volcano-stall`),
pending merge approval.
- **Cause:** the Striker had no attack target. It was approaching an Ember Skink that
  stood inside the (1316, 3033) lava pool. At some rim positions the Skink failed the
  safe-pull check (`no-safe-contact-or-pull`). Selection then flipped to a far mob for
  one tick, about every 1.3 s. That one tick hit `steerTowardTarget`'s
  `!hasApproachAttempt → clearApproachAttempt` branch, which reset the Skink's 15 s
  hazard-approach budget. The Skink was never deferred, so the player kept walking the
  rim and into the hazard envelope, where the escape pushed it back out.
- **Fix, part 1 (the load-bearing one):** hazard-approach budgets are now kept per
  target in `blockedApproach.ts`. A budget lapses only after 30 s untouched (the
  deferral window).
- **Fix, part 2:** selection holds a target through a failed safe-path check for up to
  1 s (`PATH_LOSS_GRACE_MS` in `targetPriority.ts`), which removes the one-tick flicker.
  On its own this does NOT prevent the stall: the probe still stalls permanently
  from about 340 s. No balance numbers changed.
- **Slinger T4 seed 101009** (the Volcano study's 237.1 s gap, rerun of
  `volcanoAreaStudy.ts`): same cause. Pre-fix reproduces 145 kills / 237.1 s exactly;
  fixed gives 280 kills / 10.4 s.
- **Known leftover:** the Striker probe still has 19 gaps of 15-28 s over 30 minutes
  (24 with part 1 only). These are likely the 15 s budget being spent again on the
  pool mob after each 30 s deferral, but that is not confirmed. Shortening them means
  changing the 15 s / 30 s tunables, which is your call.
- **Repro (develop at `7094727e`, same job file, damage-to-monsters progress signal):**
  the seed stalls from 348.6 s to 830.6 s (482 s), then again from 1151 s until the
  30-minute cutoff. With the fix, no gap reaches 60 s in 30 minutes. Guarded by
  `server/test/hazardApproachTargetFlicker.test.ts` (mutation-checked).

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
- **Session 2026-09-25 (`feat/t4-balance`):**
  - **Adopted:** Voidwalker mitigation fix; Berserker 60→30; Juggernaut **logarithmic knee**. The
    user chose the knee over the hard cap. Its tunables are `CRESCENDO_KNEE_MULT` 1.0 and
    `CRESCENDO_KNEE_SCALE` 0.1.
  - **Held:** Melter and Invoker, per the study's weak evidence grading. Each is a one-constant or
    one-helper port from `codex/t4-scaling-candidate-01` if revived.
  - **Screen:** 37-spec paired screen against develop, with sentinels bit-identical. Results are in
    [SCREEN.md](../../reports/t4-balance-2026-09-25/SCREEN.md). Voidwalker at +0 no longer kills
    the Titan. The user accepted this, since +0 is a sensitivity case.
  - **Sign-off:** the user signed off on 30 / 1.0 / 0.1 and approved the merge.
  - **Port fixes:** the Codex snapshot had dropped an import that Flash teleport still used, so the
    candidate would have thrown at runtime. It also carried CRLF whole-file churn in 6 files
    (normalized to LF).
- **Original session goal:**
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
- **First pass** (shipped to develop from `feat/xp-pacing`, ported from `codex/reward-xp-only-validation`):
  - `BIOME_XP_SEGMENT_BUDGET_BY_TIER` goes from `[1750, 5000, 7000, 9000]` to
    `[1750, 3750, 42000, 600000]`.
  - `BIOME_XP_MULT_BY_TIER_AND_BIOME`: T4 Tundra ×1.8, Desert ×2.4. Mastery XP only;
    essence and catalysts are untouched. Combined in `biomeXpRewardMult()`.
- **Decisions (user, 2026-09-25):**
  - No saved-XP migration. Playtest saves are disposable. Old T3/T4 saves keep their
    stored levels but face the new thresholds.
  - Slow defensive builds do not have to fit 90 min in this pass. "Swap to an offensive
    farming setup" is acceptable until defense/Conduit change throughput.
  - T2 going down (5000 -> 3750) is intended: 3,750 gave 15-16 min on T2 Desert-01
    where 5,000 took 20-21 (iteration 02).
- **Evidence:**
  - Iteration 04 (48 runs): Striker 49-51 min, Offensive Squire and no-Recover-First
    Conduit 89-93 min.
  - Iteration 05 holdout (24 runs, [RESULTS](../../reports/reward-mastery-study-2026-09-25/iteration-05/RESULTS.md)):
    16 reach mastery. Striker 49-56, Conduit 66-87, Offensive Squire 84-97, Slinger
    Melter 64-66, Slinger Bounty Hunter 98-108. Spirit Stormdancer never masters
    (3 deaths, 1 censor at 120 min). All 4 Volcanic runs hit the approach stall.
- **Known gaps (for the recalibration pass after #2, #3, #6):**
  - Defensive builds (Defensive-stance Squire, Recover-First Conduit) take 110-124 min.
    Slinger Bounty Hunter in Tundra takes 98-108.
  - Spirit Stormdancer at T4 has a survival problem, not a pacing one.
  - T2/T3 are measured on one node each at most. Volcanic has no factor (stall).
  - Future tiers inherit 600k × 1.2. Economy supply over the longer T3/T4 segments is
    unbalanced; that is #5's job.
- **Rejected:** candidate 01's full package, which put T1 at 6000 XP (much too slow).

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

## Session protocol (concurrent sessions)

Wave 1 runs concurrently: Defense, XP pacing, T4 balance, and the Volcanic stall.
Conduit and Economy start after Defense and XP merge.

- **Isolation:** one branch `feat/<workstream>` off current `origin/develop`, in its own
  worktree `../mmo-<workstream>`. Never work in the main checkout. Port Codex work from
  its `codex/*` branch; all are pushed to origin as WIP snapshots.
- **Decisions first:** ask the user the blocking questions in your section before
  implementing.
- **Numbers:** build mechanisms, correctness fixes, and harnesses. Expose tunables as
  named constants with recommended values. The user signs off on final numbers.
- **Evidence budget:** declare a bounded bench screen with a stop rule before running it.
  Run at most 2 bench workers at a time, since other sessions share the machine. Raw
  output goes in `D:/mmo-idle/<workstream>-<date>/`; commit only compact results (files
  under 1 MB).
- **Stat pins:** after changing any authored stat, grep `server/test` and
  `server/bench/balance/*Spec.ts` for tests that pin the old value.
- **Merging:**
  1. Rebase on the latest `origin/develop`.
  2. Run `pnpm typecheck` and the full `pnpm test`. Check the pass count, not the exit
     code.
  3. Fast-forward push to develop, but only when the user approves the merge.
- **Close-out:** update only your own row and section here, plus the system's
  current-state doc. Add player-facing notes in `updates/develop/<workstream>.md`.

## Housekeeping

- **Codex branches:** `codex/defense-redesign-01`, `codex/economy-v2`, `codex/reward-xp-only-validation`, `codex/t4-scaling-candidate-01` are pushed to origin with WIP snapshot commits (2026-09-25).
- **Superseded:**
  - `codex/reward-mastery-candidate-01` holds candidate 01's rejected full package, with
    recipe edits.
  - The `mmo-reward-baseline`, `mmo-t4-scaling-baseline`, and `mmo-defense-control`
    worktrees are control checkouts at `ff98ba45`. Their "changes" are line-ending churn
    plus the essence-mote event that has already shipped.
  - These can be removed once their sessions no longer need a control arm.
- **Raw evidence** lives outside git: `D:/mmo-idle/*`, plus the >1 MB reward traces listed
  in `reports/reward-mastery-study-2026-09-25/.gitignore`.
