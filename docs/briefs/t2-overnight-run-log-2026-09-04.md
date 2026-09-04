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
| 3 per-route snapshot resolution | done | `--tierEntrySnapshotDir`, median-wallet per class, `clean` fallback |
| Conduit quake-hammer probe arm | done | `conduit-hammer-t2-progression`, kept OUT of the 6-class cohort |
| 4 response-map aggregation | TODO | analysis-side; can land while the cohort runs |
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

### F3 — the +5 gate was NOT the dominant cause of expensive Tier-2 gear

Decision 1 (`EVOLUTION_REQUIRED_PLUS` 5 -> 3) was expected to convert most of the
22-of-50 reconstructions into cheap evolves. Measured across all 18 templates,
before and after, by re-running `bot:t2-reachability` with the constant flipped:

| path | +5 (old) | +3 (new) | delta |
|---|---:|---:|---:|
| CRAFT (plain recipe) | 66 | 66 | 0 |
| EVOLVE (predecessor in bag) | 7 | **19** | **+12** |
| EVOLVE after unequip | 24 | 24 | 0 |
| **RECONSTRUCT** | **95** | **83** | **-12** |

Only **12 of 95** reconstructions flip — a 13% reduction, not the wholesale fix
the hypothesis implied. The reason is visible in the per-item dump: most
reconstructions are **"predecessor ABSENT"** (`cave-vest-t1 absent`,
`forest-vest-t1 absent`, `heavy-hammer absent`, `ashbrand-blade absent`), i.e.
the canonical T1 route never owned the predecessor at all. No gate change can
help those; only the "held at +3/+4" cases flip, such as Striker's
`flash-rapier +4` now evolving into both `gale-needle` and `thorn-needle`.

**This substantially weakens ledger hypothesis T2-H06** ("the +5 evolution gate,
not Tier-2 costs, is what makes Tier-2 gear expensive"). The dominant cause is
predecessor ABSENCE in the Tier-1 routes, which is a route-coverage question, not
a gate question. Worth a designer look, but not tonight and not by me.

Notably, this is also an argument that decision 1 was cheap rather than wrong:
it removes a real tax on genuinely-invested items without moving the bulk of the
economy.

---

## Incident — worktree relocated mid-session

The worktree was originally created under
`C:/Users/osaif/AppData/Local/Temp/claude/t2wt`. Partway through Phase A, every
package's `node_modules/typescript` disappeared (root `node_modules` emptied to 0
entries while `node_modules/.pnpm` survived with 26), breaking `pnpm typecheck`
where it had passed minutes earlier. Source files and git commits were unharmed.

Cause not conclusively established — most likely temp-directory cleanup. Rather
than fight it during an unattended overnight run, the worktree was **relocated to
`C:/Users/osaif/Documents/Claude/Projects/mmo-idle-t2wt`**, a sibling of the
project directory. Deliberately a sibling and NOT inside it: the docker container
bind-mounts `.../Projects/MMO idle` specifically, so a sibling is invisible to
the running server and to the T1 launcher.

Because the branch commits live in the shared `.git` object store, the move was a
`git worktree remove` + `git worktree add` on the same branch, with zero work
lost. Deps reinstalled (11.2s), and `shared`/`server`/`bot` all typecheck clean;
`admin` deps are incomplete in the worktree and are irrelevant to this work, so
`pnpm typecheck` (which includes admin) is not the right gate here -- per-package
`tsc --noEmit` is.

**Lesson for future unattended runs: do not put a worktree under `Temp`.**

---

## Phase B — executed 01:42

Replicate 3's batch spawned at 01:42:19. Launcher PID 8568 verified by
CommandLine (`run-t1-candidate-f.ps1 ... -Replicates 5`) and killed. All ten
`replicate-03` processes confirmed alive and unchanged after the kill, so
replicate 3 continues as an orphan and replicate 4 is never created — the
intended race-free stop. Phase-C monitor armed for the tree exiting (~04:45).

## Launch readiness

Verified offline (no server contact, so the T1 cohort is undisturbed):

- `controlledBatchSettings` accepts `isolated-parallel` / `maxConcurrency 6` /
  `staggerMs 60000` for the cohort;
- all 7 routes are controlled-admitted, `count=2` permitted for an all-T2 cohort;
- **13 runs** = 6 classes x 2 replicates + 1 Conduit hammer probe;
- every route reports `startsFromTierEntry=2`, `completion=globalMasteryAtLeast`,
  `attemptBoss=0`;
- 18/18 entry templates still validate under the new +3 gate.

---

## 2026-09-04 morning — merged, server restarted, smoke-tested

### What the overnight automation actually did: nothing

Reported in full because it is the most important failure of the session.

1. **My Phase-C monitor matched itself.** It polled for processes whose command
   line contained `replicate-03` — and the monitor's own bash process command
   line contains that string. The count never reached zero, so the trigger never
   fired and the loop never advanced past waiting. Nothing was merged, restarted
   or launched overnight.
2. **Independently, replicate 3 died at 02:40**, ~58 minutes into a 3-hour
   budget. All six bots stopped writing `events.jsonl` at 02:40:32, held zero
   sockets to `:4000`, never reconnected despite `reconnection: true`, and wrote
   no `summary.json` (so: not a graceful timeout, no stall record). The server
   was healthy throughout. No Windows sleep or reboot events; main-tree
   `node_modules` intact, so the worktree install was not the cause. Six bots
   losing sockets simultaneously and never recovering looks like a
   disconnect/reconnect defect in the harness — handed to the stall
   investigation rather than chased here.

### Merge

`feat/t2-bossless-campaign` merged to develop. The main tree's uncommitted WIP
was checkpointed first (source paths only — `bot/runs/` and `server/runs/`
artifacts deliberately excluded). Four files conflicted purely because the
worktree checkout normalised line endings to CRLF; each was verified byte-identical
to the branch baseline ignoring `` before taking the branch version, so nothing
was lost.

Server restarted; all dev boot invariants pass (`networked components OK`,
`node modifiers OK`, `tier advancement OK`, `abilities OK`).

### F4 — three tests pinned the +5 gate

`t2/t3/t4ProgressionEconomy.test.ts` hardcoded `EVOLUTION_REQUIRED_PLUS === 5`
plus a `+4`-fails/`+5`-passes spot check. Retuned to `+3` and `+2`/`+3`. The
comments now state that the SHAPE is the invariant — one step below the gate
must fail, the gate itself must pass — rather than restating a literal level, so
the next gate change moves one constant instead of hunting literals.
**132/132 tests pass.**

### F5 — the smoke test caught a silent path bug

A 3-minute 1x smoke run of `striker-t2-progression` reported
*"NO usable T1 handoff for cadence-root"* and fell back to the clean template —
despite two Striker snapshots existing.

Cause: `pnpm --filter` runs the bot from `bot/`, so the repo-root-relative
`bot/runs/<cohort>` a human passes resolves to `bot/bot/runs/<cohort>`. `walk()`
then finds nothing and **every class silently falls back to a synthetic
template while the run looks completely healthy.** `t2Report.ts` already handled
this; the new resolver did not.

Had this shipped, the entire 13-run cohort would have run on synthetic entry
states and reported itself as fine — the single most expensive failure available
to this campaign, and invisible in the output. Fixed with the same
root-or-parent resolution, and the reason is written into the code.

### Entry path proven end to end

After the fix, re-run against real data:

```
real T1 handoff for cadence-root (essence 2813) -> .../snapshot-b.json
T2_ENTRY_TEMPLATE_VALIDATION[profile]: PASS (profile=snapshot-...-b, 122 checks, 0 errors)
T2_ENTRY_TEMPLATE_VALIDATION[spawn]:   PASS (profile=snapshot-...-b,  89 checks, 0 errors)
```

Snapshot resolution across the cohort, confirmed: **real handoffs for
`cadence-root` (Striker), `cooldown-root` (Squire), `energy-root` (Spirit) and
`dot-root` (Apprentice); `reload-root` (Slinger) and `summoner-root` (Conduit)
fall back to clean templates**, exactly as F2 predicted. 0 snapshots rejected.

### Ready to launch, not launched

Per the designer: a boss rework session comes first. The cohort command is

```
pnpm bot:batch --controlled=true --executionMode=isolated-parallel   --maxConcurrency=6 --staggerMs=60000 --policies=intended --count=2   --rewardMultiplier=25 --fresh=true   --routes=striker-t2-progression,squire-t2-progression,apprentice-t2-progression,slinger-t2-progression,spirit-t2-progression,conduit-t2-progression   --tierEntrySnapshotDir=bot/runs/t1-candidate-f-final-2026-09-03   --out=bot/runs/t2-bossless-<date>
```

plus `conduit-hammer-t2-progression` as a separate single run. **Open question
before launching: the T1 cohort's own bots hung at 02:40 with no reconnect. If
that is a harness defect rather than a one-off, a 13-run T2 cohort will hit it
too.** Worth waiting on the stall investigation's verdict.
