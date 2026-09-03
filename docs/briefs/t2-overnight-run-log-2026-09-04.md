# T2 bossless campaign — overnight run log, 2026-09-04

Running log for the unattended session. Written as it happens, including
failures. Companion to `t2-bossless-progression-campaign-2026-09-03.md`.

---

## Setup

- **Main tree** `c:/Users/osaif/Documents/Claude/Projects/MMO idle` — untouched
  while the T1 cohort runs. The `mmo-server-dev` container **bind-mounts it at
  `/app`** and runs a hot-reload dev server, so any edit to `shared/` or
  `server/` there would have hot-reloaded the live server mid-cohort and
  corrupted the canonical 1x runs. This is why all work is in a worktree.
- **Worktree** `C:/Users/osaif/AppData/Local/Temp/claude/t2wt`, branch
  `feat/t2-bossless-campaign`, seeded from develop HEAD `cb5b2c8d` **plus a
  transplant of the main tree's 64 modified + 13 untracked files** — the entire
  T2 infrastructure is uncommitted in the main tree, so a plain worktree off
  develop would not have had it.
- Baseline commit `57cdef78`; work commit `9fb86c92`.

## Designer decisions being implemented

Recorded in section 12 of the plan doc. 1: `EVOLUTION_REQUIRED_PLUS` 5 -> 3.
2: 25x. 3: completion on GM 72. 4: one extra arm (Conduit quake-hammer probe).
5: narrow `focus-elites`. 6: branch API deferred. 7: Conduit keeps `ranged-orbit`
(premise was wrong — `orbit` already is stand-back). 8: `clean` fallback for any
class with no snapshot B.

---

## Phase A — implementation (done)

| Item | State | Notes |
|---|---|---|
| 0a `EVOLUTION_REQUIRED_PLUS` 5 -> 3 | done | plus the stale forest.recipes.ts comment |
| 0b `focus-elites` engaged-set narrowing | done, mutation-checked | see finding F1 |
| 1 T2 routes admitted to controlled batch | done | unlocks isolated-parallel leases; replicates allowed for all-T2 cohorts |
| 2 bossless route family | done, mutation-checked | 6 routes, 124–137 steps each, `attemptBoss=0`, completion `globalMasteryAtLeast 72` |
| per-leg dwell brackets | done | `<group>-t2-entered` / `<group>-t2-leg-complete` |
| 3 per-route snapshot resolution | TODO | `--tierEntrySnapshotDir` |
| 4 response-map aggregation | TODO | |
| 5 missing metrics | TODO | TTK, kills/min, adoption timing, disengagement |

`pnpm typecheck` clean. `t2Routes.semantic.test.ts` ok. `eliteTargeting.test.ts` ok.

---

## Findings

### F1 — `focus-elites` never had a legal out-of-combat reach

The old exemption was justified as "reach the necromancer before it raises the
dead". But `focus-elites` is a TARGETING rune, and TARGETING actions accept only
`in-combat` / `in-party` / `n-aggro-3` (`TARGETING_CONDITIONS`,
shared/src/runeDatabase.ts:161). There is no legal loadout in which it fires out
of combat. The only reach the exemption actually bought was the **bad** case:
already fighting one mob, pulled onto a different, unengaged one across the node.

This makes decision 5 straightforwardly correct rather than a trade-off. Both
halves are now pinned in `eliteTargeting.test.ts`, and the fix is
mutation-checked (case 2 fails without it, case 1 passes either way).

### F2 — Slinger and Conduit are BOSS-walled in Tier 1, not economy-walled

Both reach **GM 30 — full Tier-1 mastery** — and still never advance to
playerTier 2, so they produce no `tier2-handoff` snapshot.

| Run | Bosses | Deaths | Outcome |
|---|---|---|---|
| Conduit rep1 | 0 wins / 1 attempt | 9 | timed out at the 3h `maxRunMs` wall, 98/120 steps |
| Slinger rep1 | 1 win / 7 attempts | 15 | timed out at the 3h wall, 111/126 steps |
| Conduit rep2 | 0 / 0 | 11 | **stalled: "timed out waiting for arrive at node-t1-forest-03"**, GM 7 |

Two distinct causes:

1. **Boss wall (both classes).** Farming is fine; the T1 boss gauntlet is not
   clearable inside the 3-hour budget. Slinger's 1-for-7 with 15 deaths is a
   class repeatedly throwing itself at a wall. This is consistent with the same
   reworked-boss problem that put T2 bosses out of scope in the first place.
2. **Travel stall (Conduit rep2).** `timed out waiting for arrive at
   node-t1-forest-03` is an automation/pathing defect, not balance — a different
   failure from the same class, and worth its own investigation.

**Consequence for the T2 campaign:** decision 8's `clean` fallback is confirmed
necessary for both classes. But note the caveat — a `clean` template is derived
from the canonical T1 route's *intended* end state, so for Slinger and Conduit
the T2 cohort will enter from a character state **this cohort never actually
produced**. That is a real limitation on their results and must be stated in
every table they appear in, not just recorded here.

---

## Phase B/C — cohort stop point

Plan: let replicate 3 run, then stop. Launcher is PowerShell **PID 8568**
(`run-t1-candidate-f.ps1`), which spawns one `pnpm bot:batch` per replicate and
would otherwise continue to replicate 5 (~11:00).

Chosen mechanism, race-free: wait until replicate 3's batch has **spawned**, then
kill the launcher. Replicate 3 continues as an orphan to completion and replicate
4 is never created — no partial run to discard, no kill-mid-batch. A persistent
Monitor watches for `replicate-03/batch-*` to appear and also alarms if
replicate 4 ever starts (overshoot) or the launcher dies early.

Replicate timings: rep1 19:33 -> 22:37 (3h04, exit 1 — hit the 3h wall).
rep2 started 22:37.

---

## Phase D/E — to follow
