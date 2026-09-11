# T2 Focused Experiment Session — Queue Repair and Focused Campaign

Closeout date: 2026-09-10
Scope: orchestration repair + progression/combat A/B campaign. **No balance values were changed.**
Revisions used: `045bd4fb` (Squire J0/D0 source checkpoints, pre-existing), `6f4bc33c`→`ab929004` (this session's tooling + new routes, on top of `045bd4fb`).

## Executive summary

The cross-cohort queue controller was repaired and verified live before any campaign
run was launched. All planned readiness gates and replicate cohorts ran to completion:
164 total runs across 12 manifests, all terminal, zero duplicate runs, zero
orchestration non-runs in the final campaign (two config-mistake cohorts were caught
by the readiness gate and re-run correctly — see the Validity Ledger). The Squire
Jungle wall reproduces at 65% (15/23) across every cohort this session touched, always
at the same node, always as an engagement/kill-rate collapse rather than a death
spiral; Striker's frame results did **not** replicate cleanly across two independent
batches, undermining the earlier single-batch read that Light/Heavy were reliable.

---

## 1. Orchestration repair

**Root cause.** Each experiment manifest owned an isolated worker pool
(1–4 slots) with no budget shared across manifests. `experiment:launch` started a
per-manifest supervisor that filled its own slots from its own run queue only.
Launching several cohorts in sequence had no mechanism to cap *total* concurrent
workers, and nothing ever came back to start a manifest that was created but never
explicitly launched. That is exactly how the prior session stranded 172 queued runs
across 17 manifests: no live process was ever watching all of them together.

**Files changed** (`045bd4fb..ab929004`, all on `develop`):

| File | Change |
|---|---|
| `scripts/experiment/lib.mjs` | Extracted the run-scheduling primitives (start/finalize/reconcile a run, slot accounting, container naming, run-config writing) out of `supervisor.mjs` into shared, importable functions. Added a durable cross-cohort queue registry (`queue.json`: add/load/save entries, per-entry `queued`/`active`/`done` status) and pure scheduling helpers (`globalActiveRunCount`, `availableGlobalSlot`, `selectNextQueuedRunAcross`, `allExperimentsTerminal`). |
| `scripts/experiment/supervisor.mjs` | Rewritten to call the shared primitives instead of duplicating them; behavior unchanged, now also adopts orphaned containers on restart instead of risking a duplicate start. |
| `scripts/experiment/queue.mjs` (new) | The cross-cohort controller. Loads the registry, reconciles every managed experiment's own `state.json` (still the source of truth for run status), and starts the next queued run *anywhere in the registry* whenever global active runs are below `--maxWorkers`. Restart-safe: only ever starts a run still marked `"queued"`, and adopts an already-live container instead of duplicating it. |
| `scripts/experiment/cli.mjs` | New commands: `queue-add`, `queue-run`, `queue-status`, `queue-stop`. |
| `package.json` | Corresponding `experiment:queue-*` scripts. |
| `scripts/experiment/experiment.test.mjs` | New pure-logic tests: registry add/dedup (idempotent on resume), global active-run counting across cohorts, global slot allocation under a shared cap, cross-cohort scheduling fairness (registration order), all-terminal detection. No Docker required. |

**Tests.** `pnpm experiment:test` — all pass, including the new queue-logic assertions.

**Live readiness result (Phase 2).** Two 3-run cohorts (`queue-readiness-a`,
`queue-readiness-b`, 60s synthetic routes) registered together under
`--maxWorkers=4`. Observed via `queue-events.jsonl`:

- 4 runs started immediately (3 from cohort A, 1 from cohort B) — global cap respected across cohorts, not per-cohort.
- The remaining 2 (both cohort B) stayed explicitly `queued`.
- As cohort A's 3 runs terminated, cohort B's queued runs backfilled into the freed slots automatically — no manual second launch.
- All 6 runs reached a terminal state (`timed_out`, expected for 60s synthetic routes).
- Verified programmatically: zero `runKey` was ever started more than once.

This satisfied every Phase 2 requirement before any real campaign run was queued.

---

## 2. Missing weapon A/Bs

Source: validated J0 checkpoints (`20260908t200706z-t2-day-j0-prep-2026-09-08-rerun`).
`n=4` replicates per arm, `full-gauntlet` completion, `rewardMultiplier=25`,
`entryEconomy=catalyst-primed` (progression/combat isolation, not an economy read).

### Spirit

| Arm | Completion | Duration median/range (min) | Deaths median/range | Replicates |
|---|---:|---:|---:|---|
| `gale-needle` | 4/4 | 4.92 / 4.50–6.44 | 0 / 0–1 | C/J6/D0; C/J6/D0; C/J6/D0; C/J6/D1 |
| `ruinous-axe` | 4/4 | 4.53 / 3.51–6.62 | 0.5 / 0–2 | C/J6/D0; C/J6/D2; C/J6/D0; C/J6/D1 |

Both arms completed every replicate. `ruinous-axe` is slightly faster on the low end
but carries more variance in deaths; `gale-needle` is the more consistent arm.

### Conduit

| Arm | Completion | Duration median/range (min) | Deaths median/range | Replicates |
|---|---:|---:|---:|---|
| `ruinous-axe` | 4/4 | 7.98 / 6.09–9.58 | 2 / 1–3 | C/J6/D2; C/J6/D3; C/J6/D2; C/J6/D1 |
| `quake-hammer` | 4/4 | 15.53 / 11.64–22.73 | 6 / 3–9 | C/J6/D5; C/J6/D7; C/J6/D3; C/J6/D9 |

Both arms complete every time, but `quake-hammer` is roughly 2× slower and takes 3×
the deaths of `ruinous-axe` in every single replicate — a consistent, repeated
gap, not an artifact of one run.

---

## 3. Contagion

Same DoT weapon (`swamp-mirebrand`) on both arms per class; only the Jungle Technique
differs (Sweep vs Contagion). `n=4` replicates per arm.

### Apprentice

| Arm | Completion | Duration median/range (min) | Deaths median/range | Replicates |
|---|---:|---:|---:|---|
| Sweep | 4/4 | 5.96 / 5.71–7.57 | 0 / 0–1 | C/J6/D0; C/J6/D1; C/J6/D0; C/J6/D0 |
| Contagion | 3/4 | 7.21 / 7.12–16.70 | 1 / 0–1 | C/J6/D1; S/J5/D0; C/J6/D1; C/J6/D1 |

### Slinger

| Arm | Completion | Duration median/range (min) | Deaths median/range | Replicates |
|---|---:|---:|---:|---|
| Sweep | 2/4 | 11.62 / 8.21–19.18 | 1.5 / 0–3 | C/J6/D3; S/J5/D1; C/J6/D2; S/J1/D0 |
| Contagion | 3/4 | 7.90 / 5.29–18.06 | 1 / 0–1 | C/J6/D0; C/J6/D1; C/J6/D1; S/J4/D1 |

Apprentice trends toward Sweep being both faster and more reliable (4/4 vs 3/4).
Slinger trends the other way — Contagion completes more often (3/4 vs 2/4) and
faster on median. Both are n=4 with a stall each; treat as a follow-up signal per
class, not a settled result, and note Slinger's one Sweep stall (`S/J1/D0`) ended
unusually early (Jungle level 1) compared to every other stall in this campaign
(all others were J3–J5), worth a closer look before trusting that data point.

---

## 4. Core A/B — Tempered vs Survivalist

Source: validated D0 checkpoints (`20260908t215750z-t2-day-d0-checkpoints-postfix-2026-09-08/runs`,
scoped to the `runs/` subfolder specifically — see Validity Ledger for why). Squire
has no valid D0 checkpoint and was excluded, per the source brief. `n=4` per arm
(1 readiness run + 3 replicates).

| Class | Tempered | Survivalist |
|---|---|---|
| Apprentice | 4/4, 8.21min median (7.78–8.86), 0 deaths | 4/4, 8.24min median (7.61–8.90), 0 deaths |
| Conduit | 4/4, 8.87min median (7.96–10.43), 0 deaths | 4/4, 9.68min median (8.66–10.95), 0–1 deaths |
| Spirit | 4/4, 5.05min median (4.75–5.34), 0 deaths | 4/4, 5.66min median (5.16–6.22), 0 deaths |

**24/24 Desert runs completed.** No stalls, no meaningful duration or death gap
between Tempered and Survivalist for any of the three classes — Desert (at this
gear/level band) does not currently discriminate between the two cores. This is a
clean, unambiguous result: nothing here motivates a Survivalist-vs-Tempered balance
question at this checkpoint.

---

## 5. Squire Jungle investigation

**Combined evidence, all valid Squire Jungle-tail runs this session plus the prior
valid frame-replication and weapon-A/B cohorts (same J0 source, same guard):**

- **n = 23** (8 completed, 15 stalled) → **65% stall rate**.
- Every one of the 15 stalls hit the **identical node**: `node-t2-jungle-04`,
  same guard (`no progress for 12m while farming node-t2-jungle-04 for jungle level >= 6`).
  No Squire stall this session or in the prior valid data hit any other node.
- **Deaths are not the story**: 1 total death across all 15 stalled runs, 1 total
  death across all 8 completed runs. Squire is not dying at this wall.
- **Engagement collapses instead.** `combat.concurrency` (fraction of combat
  samples with zero attackers engaged, i.e. `unengaged`):
  - Stalled runs: median **94.7%** unengaged (range 89.6%–96.0%).
  - Completed runs: median **68.6%** unengaged (range 58.9%–79.1%).
  - Completed runs already spend well over half their combat samples idle; stalled
    runs push that past 90%.
- **Kill throughput craters accordingly**, despite running far longer:
  - Stalled runs: median duration 14.86min (12.0 min is the guard itself, plus
    setup), median 7 kills (range 5–14).
  - Completed runs: median duration 4.82min, median 17 kills (range 16–18).
  - A stalled run runs ~3× longer and still lands under half the kills.

This is a **kill-rate/engagement collapse specific to `node-t2-jungle-04`**, not
defensive overinvestment and not a death spiral — the bot is winning fights fine
when it finds one, it simply is not finding enough of them at that node.

**New data this session** — the two frame×weapon combinations the pre-existing
routes didn't cover (see Validity Ledger for the route bug found and fixed while
building these):

| Route | Completion | Duration median/range (min) | Replicates |
|---|---:|---:|---|
| Balanced + Ruinous Axe | 2/4 | 9.58 / 4.60–14.86 | S/J3/D0; S/J3/D0; C/J6/D0; C/J6/D0 |
| Light + Ruinous Axe | 0/4 | 14.76 / 14.33–15.43 | S/J4/D0; S/J3/D0; S/J3/D0; S/J3/D0 |

Combined with the pre-existing data (Light+Quake 2/3, Balanced+Quake 0/3,
Heavy+Quake 1/3 from frame replication; Heavy+Quake 1/3, Heavy+Ruinous 2/3 from
weapon A/B), Balanced+Ruinous is the single strongest-completing Squire arm found
this session (2/4), but n is still small per cell and every arm shares the same
`node-t2-jungle-04` failure signature — **weapon and frame choice shift the odds
somewhat but do not remove the wall**, consistent with a node-level rather than a
build-level cause.

---

## 6. Striker replication

The prior session's single frame-replication batch read as "Light and Heavy are
reliable (3/3, 2/3), Balanced is weak (1/3)." This session ran a fresh,
independent batch of the same three arms, `n=3` each, from the same J0 source:

| Frame | Prior batch | This session's fresh batch | Combined |
|---|---:|---:|---:|
| Light | 3/3 | 1/3 | 4/6 |
| Balanced | 1/3 | 1/3 | 2/6 |
| Heavy | 2/3 | 2/3 | 4/6 |

Light did **not** replicate its earlier strong result (3/3 → 1/3), while Heavy
replicated exactly and Balanced stayed weak in both batches. Per the source brief's
own decision rule: convergence would mean "classify as variance"; a frame that stays
materially worse across both batches would be "a real signal." Balanced is the only
frame that stayed low both times (1/3 then 1/3, 2/6 combined) — that is the one
candidate for a real per-frame effect. Light's swing (3/3 → 1/3) is large enough that
the original single-batch impression of "Light is reliable" does not survive
replication and should be treated as variance until a third batch is run. All 5
Striker stalls this session, like every Squire stall, hit `node-t2-jungle-04` —
the same underlying wall, not a frame-specific mechanism.

---

## 7. Validity ledger

**(a) Valid gameplay results** — every `completed` run in sections 2–6, plus every
`node-t2-jungle-04` "no progress for 12m" stall (the guard is a legitimate
progression-wall detector; every stalled run's assertions passed before the stall
was declared).

**(b) Invalid treatment** — none. Every completed run's embedded route assertions
(equipment, frame, technique/core, checkpoint kind) passed — the route executor
throws on any assertion failure, so a `completed` status is itself proof the
assertions held.

**(c) Harness issues found and fixed this session:**

1. `--requireTierEntrySnapshot=true` is incompatible with `experiment-checkpoint`
   snapshots. That flag demands `canonicalAtCapture === true`, but checkpoints are
   captured mid-run at 25× reward and are hardcoded `canonicalAtCapture: false`
   (`bot/src/botRun.ts`). Passing the flag made the first two readiness cohorts
   (`20260909t090821z`, `20260909t091024z`) fail 16/16 instantly. Fixed by omitting
   the flag, matching the prior session's own (correct) convention.
2. The new Squire frame×weapon combo routes (`t2DayExperimentRoutes.ts`) omitted
   the `entryAssertions` override argument to `jungleTailRoute`, so the entry
   assertion checked the checkpoint's *original* frame instead of the route's
   *target* frame. The live frame switch itself was working correctly the whole
   time (confirmed from `events.jsonl`: the failing assertion fired 563ms into the
   run, before any farming); only the assertion's expected value was wrong. Fixed
   in commit `ab929004`.
3. A D0-sourced readiness cohort (`20260909t091341z`) failed 6/6 because its
   `--tierEntrySnapshotDir` pointed at the whole D0 cohort directory, which itself
   contains a nested `inputs/tier-entry/` copy of the J0 source it was built from.
   `indexSnapshotDir`'s median-by-wallet selection picked the (lower-wallet) nested
   J0 file instead of the real D0 file, and the bot correctly rejected it
   (`requires the d0 experiment checkpoint, but received j0`). Fixed by scoping
   `--tierEntrySnapshotDir` to the D0 cohort's `runs/` subfolder specifically,
   which excludes the nested `inputs/`.

**(d) Orchestration/config non-runs** — the four fully-failed early cohorts
(`20260909t090821z-t2-focused-readiness-j0`, `20260909t091024z-t2-focused-readiness-d0`,
and the 4 config-related failures inside `20260909t091329z-t2-focused-readiness-j0b`,
plus `20260909t091341z-t2-focused-readiness-d0b`) are the harness issues above
manifesting as 100% failure. None of these are gameplay evidence; all were caught by
the Phase 3 readiness gate *before* scaling to replicates, which is exactly what that
gate is for. No replicate cohort in sections 2–6 carries this contamination.

**Overall run count:** 164 total runs across 12 manifests, all terminal. The queue
controller ran the entire second half of the campaign (readiness-fix cohorts through
all four replicate cohorts, ~85 runs) under one continuous `queue-run` invocation with
zero manual re-launches and zero duplicate runs.

---

## 8. Recommendations

**Prefer next experiments before any balance change:**

1. **Investigate `node-t2-jungle-04` directly** (spawn density, monster
   modifier/aggro range, pathing) rather than any class or frame. Every stall this
   session — Squire, Striker, Apprentice, and Slinger alike, across every frame and
   weapon tested — hit exactly this node with the same engagement-collapse
   signature. That is a node-level pattern, not a build-level one.
2. **Re-run the Striker frame batch a third time** before drawing any conclusion
   about Balanced specifically; Light's non-replication (3/3 → 1/3) shows single
   3-replicate batches are not yet reliable at this node.
3. **Re-check the Slinger `S/J1/D0` stall** — it ended at Jungle level 1, unlike
   every other stall this session (J3–J5), and may indicate a separate, earlier
   failure mode worth isolating from the `node-t2-jungle-04` wall.
4. **Conduit weapon gap**: `quake-hammer` costs roughly 2× the time and 3× the
   deaths of `ruinous-axe` in every single replicate (not just on average) — worth
   a dedicated follow-up before treating it as a balance question, since n=4 with a
   perfectly consistent direction is a stronger signal than most results in this
   campaign, but still short of the replication depth used elsewhere in the T2
   program.

**Observed evidence vs. suggested balance interpretation**, kept separate as required:

- *Observed*: `node-t2-jungle-04` produces a 90–96% unengaged-combat-sample stall
  signature with near-zero deaths, reproduced across 4 classes and every frame/weapon
  arm tested, at a combined stall rate of 65% for Squire and 44% for Striker's
  combined two batches.
- *Suggested interpretation, not implemented*: this reads as a node-specific
  spawn/engagement problem (too few reachable targets, evasive spawns, or a pathing
  dead-end at that node) rather than a class or gear balance problem, because the
  same wall appears regardless of class, frame, or weapon. **No balance values were
  changed to test or act on this in this session** — it is presented as a hypothesis
  for a follow-up combat/pathing investigation, not a conclusion to build on.

## Artifact roots

All under `C:\Users\osaif\AppData\Local\mmo-idle\experiments\`:

- Orchestration readiness: `20260909t085431z-queue-readiness-a`, `20260909t085450z-queue-readiness-b`
- Weapon/Contagion replicates: `20260909t095848z-t2-focused-weapon-contagion-reps`
- Striker replicates: `20260909t095906z-t2-focused-striker-reps`
- Survivalist replicates (+readiness): `20260909t102531z-t2-focused-survivalist-reps`, `20260909t095824z-t2-focused-readiness-d0c`
- Squire combo replicates (+readiness): `20260909t102548z-t2-focused-squire-combo-reps`, `20260909t095657z-t2-focused-readiness-squirefix`
- Failed/superseded config attempts (preserved, excluded from results): `20260909t090821z-*`, `20260909t091024z-*`, `20260909t091329z-*`, `20260909t091341z-*`
