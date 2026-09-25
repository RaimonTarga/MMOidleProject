# Conduit durability and reconstruction study — 2026-09-25

Status: complete. 224 combat observations, including 14 deterministic baseline replays; zero combat execution failures. No study bots remain running and no gameplay tuning was adopted.

The user authorized adaptive testing, beginning with Tier 1 and then upper tiers. This is not a sealed historical packet. Each stage has its own declared cases and fresh output. Completed gameplay rows are never overwritten or retried.

## Method

- Isolated source snapshot: `D:/mmo-idle/conduit-study-2026-09-25/source`. It includes the current local tracked server/shared/bot files, including pre-existing dirty gameplay edits. This is a local-source baseline, not a production-release claim.
- Real `World.tick`, production combat bootstrap, baked hitboxes, legal prepared bot packages, native Rune automation, fixed mastery, 100 ms ticks. Five-minute cap, stop at owner death or authoritative boss kill.
- Fresh OS process for every case. Matched seeds 101009 and 101033 through T3; T4 is a one-seed nine-specialization screen.
- Farming has native population renewal. Bosses awaken directly; guardian fights, approach routes, material acquisition, and full economy progression are excluded.
- `ready.json` contains applied gear, RP, mastery, owner stats, formation profile, costs and starting monsters. `conduit.json` contains formation availability, lifetimes, replacement attempts/payments and queue recovery. `events.jsonl` retains combat events.
- Results compare total completed work within a capped life, not extrapolated kills per hour from death-shortened runs. Post-terminal unobserved time is not filled with zeros.

## Treatments

| Arm | Summon HP | Replacement ratio | Timer |
|---|---:|---:|---|
| baseline | unchanged | 0.30 | unchanged |
| tax15 | unchanged | 0.15 | unchanged |
| hp25 | ×1.25 | 0.24 | unchanged |
| hp50 | ×1.50 | 0.20 | unchanged |
| hp100 | ×2.00 | 0.15 | unchanged |

The HP candidates hold expected replacement payment near baseline rather than increasing it with summon HP. Nested integer rounding can move an individual payment by 1 HP. They also increase absolute out-of-combat healing at the existing percentage rate. Owner stats, direct-offense budgets, movement and on-hit budgets are unchanged.

## Setup history and integrity

Seven first-pass qualification rows failed before combat: the existing preparation helper rechecked deprecated recipe gates for starter Runes, and the initial late-T1 ability set exceeded RP. The helper now validates only unowned, nondeprecated action recipes. Revised T1 packages retain Brace and drop Second Wind where the budget does not fit. The failures remain under `t1-qualification`; successful revised runs are under `t1-r2`.

A later optional Orbit boss package failed two zero-combat qualifications because its combined ability/Rune cost was too high. A fresh revision removes Sweep, retaining Brace and Orbit; it is a separate package diagnostic, not pooled with the original boss comparisons.

All 14 repeated Tier 1 baseline results in iteration 2 exactly reproduce iteration 1 on every recorded gameplay result field, excluding wall time. These replays are integrity checks, not additional independent observations.

The generic `treatmentNotes` string in the initial T2/T3 manifests still mentions hp25. Their explicit per-case arm is hp50, and every actual applied profile is recorded in `ready.json`; analysis uses the arm and applied receipts. T4 wording is corrected before combat. No completed manifest was rewritten.

## Files

- `study-plan.json`: scope and source provenance.
- `run.py`: process-isolated executor, refuses existing result files; timeout terminates only its owned process tree.
- `analyze.py`: compact inspection of saved results.
- Raw artifacts and original source inventory remain in the external study directory. Final results, validation and recommendation are in `REPORT.md`.
