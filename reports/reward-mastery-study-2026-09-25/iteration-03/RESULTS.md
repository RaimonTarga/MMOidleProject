# T4 iteration 03 — fast-end mastery

Latest follow-up: [iteration 04 — separate build, biome and recovery/stance effects](../iteration-04/RESULTS.md). Earlier configurations and evidence below are retained.

**Working recommendation: 600,000 XP per T4 six-level segment**, up from iteration 02's 108,000. Applied in the isolated candidate only. T1 stays at its original 1,750; T2/T3 stay at 3,750/42,000. The latest user priority is the fast end near 50 minutes, accepting slower builds taking longer.

The balanced Striker completed in **55.88 and 57.41 minutes** across two of four seeds. The other two stopped gaining XP and reached their wall limit. Thus this is a promising candidate, not a demonstrated universal 50-minute floor or a robust four-seed success. No further XP increase is justified by the completed samples. About 525k–537k would project to exactly 50 minutes at those two observed average rates; 600k deliberately keeps headroom toward the higher end. That projection is not another measured run.

## All 12 runs

| Setup and seed | Mastery minutes | Observed minutes | Endpoint |
|---|---:|---:|---|
| apprentice-light-c-V-s101009 | Incomplete | 234.97 | Runtime limit; XP plateau |
| apprentice-light-c-V-s101033 | Incomplete | 258.48 | Runtime limit; XP plateau |
| conduit-balanced-a-T-s101009 | 139.06 | 139.06 | Mastery |
| conduit-balanced-a-T-s101033 | 138.78 | 138.78 | Mastery |
| squire-heavy-b-D-s101009 | 275.52 | 275.52 | Mastery |
| squire-heavy-b-D-s101033 | 269.96 | 269.96 | Mastery |
| striker-balanced-c-V-s101009 | 55.88 | 55.88 | Mastery |
| striker-balanced-c-V-s101033 | Incomplete | 164.00 | Runtime limit; XP plateau |
| striker-heavy-c-V-s101009 | Incomplete | 162.90 | Runtime limit; XP plateau |
| striker-heavy-c-V-s101033 | Incomplete | 152.36 | Runtime limit; XP plateau |
| striker-balanced-c-V-s101051 | Incomplete | 81.15 | Runtime limit; XP plateau |
| striker-balanced-c-V-s101063 | 57.41 | 57.41 | Mastery |

Six mastered, six runtime-censored, no deaths before endpoints. Heavy Striker and Apprentice have no measured completion at this budget. Conduit takes 138.78–139.06 minutes; Squire takes 269.96–275.52 minutes (about 4.5 hours). These costs are material even when faster-build pacing is prioritized. A shared XP budget cannot compress the large build/node throughput spread.

## Censored runs

The incomplete Volcanic rows show long flat XP tails while alive, not merely slower sustained farming. Minute-resolution snapshots put the balanced Striker plateaus near minutes 24 and 9, heavy Striker near 67 and 66, and Apprentice much earlier than its endpoint. See [progress diagnostics](progress-diagnostics.json) and raw snapshots. Root cause is not established by these reward-only observations; do not label them combat deaths, infer completion times, or silently remove them. No retries, navigation changes, or replacement seeds were used to repair these rows. The two additional holdout seeds were separately declared, and both outcomes are retained.

## Essence consequence

Completed runs earned **49,306–49,781 essence**, against **8,485–9,645** summed native four-piece +3 acquisition/upgrade costs: roughly 5.1–5.8 times the target. +5 totals are 12,728–14,468. Keeping current essence supply would undermine the user's one-biome +3 / 50%-extra-time +5 goal after this XP increase.

A next T4 supply screen around **0.085–0.095** instead of the current **0.495** multiplier is reasonable: 0.0891 preserves the previous nominal income per segment (0.495 × 108k/600k). At unchanged kill mix, that range projects roughly 8.5k–9.6k total essence, before per-kill rounding. **Not applied or bot-tested.** It also does not solve currency colors: the pure biome income never funded every required color in these reference sets, so all actual per-color +3/+5 funding times stayed null. No actual purchases or +5 timing were tested here.

## Configuration and evidence

T4 catalyst progress scalar is now **0.015 = 9,000/600,000**, preserving intended nominal opportunity per segment. Other tiers' catalyst and essence controls are unchanged. Prices remain the experimental candidate-01 schedules, which already miss T1/T2 affordability. The entire economy package remains on hold.

Exact historical gear, abilities and runes were validated through the existing survey setup. Mature +4 equipment and other-biome mastery were retained; tested biome mastery was reset to the previous cap. These are conditional supported-build throughput measurements, not earned arrival or real-player telemetry. No defense-study changes were incorporated. Stop: mastery, first death, six simulated hours, or 15-minute soft/16-minute hard wall limit.

Both batches completed with no process failures and no recorded gameplay/harness source drift: [primary receipt](xp600k/complete.json), [holdout receipt](holdout600k/complete.json). Raw jobs, logs and snapshots remain beside the receipts. [Primary summary](xp600k/summary.json), [holdout summary](holdout600k/summary.json), [configuration metadata](candidate-final.json).

Focused gameConfig and rewardMultiplier tests and full typecheck passed. All **117 recipes / 585 production upgrade debits** matched the final configuration metadata. Diff whitespace checks passed. Earlier full regression remains 271/275 with four old price-contract failures; not rerun or relabeled green. No browser, production or telemetry proof.

No merge, deployment or saved-XP migration. T5+ uses the last explicit budget's 1.2× extrapolation, so the larger T4 also raises uncalibrated future tiers. Review that before adoption. [Complete candidate tracked-file patch](candidate-iteration-03.patch) includes prior experimental prices and other candidate changes; it is not a T4-only deployment patch.
