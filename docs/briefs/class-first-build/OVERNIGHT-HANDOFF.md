# Overnight polish session: handoff (written 2026-10-16)

You are the conductor of a long, autonomous session. The class-first rework is **built** for all six
classes through T4; nothing past T1 has been played. Your job tonight is to get it **ready for the
designer's first full-game playtest**: run experiments, find what is broken or badly out of balance,
fix it, and leave a clear report. The designer is asleep: do not wait for answers (decisions already
taken are below; for anything else pick the simplest reading, mark it PLACEHOLDER, and list it).

## Where things are

- Branch `rework/class-first`, worktree `C:\Users\osaif\Documents\Claude\Projects\mmo-rework`
  (the main checkout `MMO idle` is on `develop` and must not be touched).
- Suite 390/390 (`pnpm test`; `pnpm typecheck` clean) at the last commit. Read first:
  `docs/briefs/class-first-build/STATUS.md` (board, live-smoke notes), then the per-task reports in
  `docs/briefs/class-first-build/reports/` (T2-*, T2W2-*, T3-*, T3W2-*, T4-*, T4W2-*: each has a
  status table `wired | missing | stand-in`), the bible `design_docs/class-first-bible.md`
  (sections 7-12 are the six classes; the T-by-T tables are x.16), `CLAUDE.md` (repo rules) and
  `docs/briefs/class-first-build/AGENT-RULES.md` (rules for any agent you spawn).
- Memory: `project_class_first_build_2026-10-14.md` and the index. Many traps are recorded there.

## Decisions already taken (do not re-ask)

1. **Tune freely**: change any placeholder number (kit `params`, `configs/`, gear files, tuning
   constants) to hit the targets. Log each change with its evidence. Do not change designs or rules.
   If a mechanic is plainly broken, fix it minimally and list it for review.
2. **Pass bar** ("polished enough to playtest"): for each class, a bot on the intended route with
   the **auto config** clears each tier's seal and tier bosses within a few tries, with **no death
   loops, stalls or crashes**, T1 to T4. No parity target; the Striker is the reference class.
3. **Verdict does not execute bosses** (already done: a boss takes a x2 blow, `VERDICT_BOSS_MULT`).
4. **Git**: commit small on `rework/class-first`, **and push that branch to the remote at the end**
   (and once mid-session as a backup). Never push `develop`/`master`, never merge to them, never tag,
   never bump a version, never run `/release`. No force-push.
5. The designer owns art; use existing icon ids, generate nothing.

## What is known to be wrong or unverified (start here)

Balance and flow (all numbers are placeholders):
- **Striker** could not beat the Plains boss with the T1 kit (boss 43-52% HP at death) before gear
  steps; with gear it still lost four attempts. Bible §12: the base kit must win the first boss.
- **Squire** dies a lot in the Mountain; **Apprentice, Slinger, Spirit** died 16-21 times in 30
  minutes in T1 (six bots in one world, so partly contention). **Conduit** summons: check the early
  game and the Command pips.
- No route past the T1 seals has ever run live. The `-t2/-t3/-t4` routes (Striker has 9 per tier)
  are statically tested only: promotion waits that farm a "cleared" node may stall.
- Order techniques firing in a real fight is not verified by telemetry for any class.

Wiring gaps (from the reports; each is a stand-in or missing):
- Numb II (Apprentice): needs a core hook in `monsterMechanics.ts` / `groundZones.ts`.
- Harpoon / Tether (Slinger) and Undertow (Squire) should stop a dive or burrow outright:
  needs a check in `bossPatterns.ts`.
- Spirit Tide positioning drift and Reservoir's "nearly untouchable" are not implemented;
  Conduit: Pack Strike's early order, Colossus "grow huge", the second Soul's cost, husks are
  invisible strikers; Crescendo has no "target staggered" moment; Squire Intercept / Challenge are
  stand-ins; Anchor looks ahead locally because `drag-or-push` fires too late.
- Apprentice default Payoff placements cover T2 plus Melt / Frostcrack / Pyre only.
- Many `ACCEPTED_GAPS` lines in `server/scripts/statusAudit.ts` exist because the audit cannot
  tell a summon from a player; a "summon carrier" rule would replace them (nice to have).
- Docs are stale: `docs/guided-tutorial-current-state.md`, `docs/bot-experiment-runner-current-state.md`,
  `docs/system-rework-status.md`; CLAUDE.md still describes the old class roots. A docs pass is
  wanted at the end (see `docs/README.md` rules).

## How to work (recipes that work, and traps)

- **Measure first.** Live bot lanes: one server and one database **per lane** (no shared world:
  six bots in one world crowd each other and corrupt numbers).
  `docker exec mmo-gamedb psql -U postgres -c "CREATE DATABASE gamedb_laneN"`, then from
  `mmo-rework/server`: `PORT=430N DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gamedb_laneN
  LOG_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/logdb_rework
  REDIS_URL=redis://localhost:6379/<N> AUTH_DEV_BYPASS=1 NODE_ENV=development
  node --conditions=development --import tsx src/index.ts` (background), and from the repo root
  `pnpm bot:run --route=<id> --class=<cadence|cooldown|summoner|reload|energy|dot> --policy=intended
  --controlled=false --server=http://localhost:430N --rewardMultiplier=25 --account=<unique>
  --out=<dir>` (the `-t2..-t4` routes are registered but not in `CONTROLLED_ROUTE_IDS`, hence
  `--controlled=false`). 25x rewards is a pipeline test; for boss-fight balance use a lower
  multiplier on the clean server (fresh servers boot at 1x). Output: `events.jsonl`, `deaths.jsonl`.
  Read `docs/bot-experiment-runner-current-state.md`, `docs/balance-command-center*` if present, and
  the memory notes "Isolated bot lanes" and "Bot arm isolation".
- Offline balance tools: `pnpm bench:server`, `pnpm bench:balance`, `pnpm bench:tui`,
  `tools/dps-report.ts`, the eHP report. Bench cannot always fight bosses (see memory notes).
- **Use subagents** (Agent tool, Claude) for parallel work: one worktree each via
  `node tools/worktree/agent-worktree.mjs create <id> --base rework/class-first`; brief them with
  `AGENT-RULES.md` and a task file; merge their branches yourself. Good tasks: one agent per class
  to drive a lane and tune that class's numbers; one for the missing core hooks; one for docs.
- **DISK**: the C: drive filled up once (too many worktrees, ~5 GB each). Remove merged worktrees
  with `node tools/worktree/agent-worktree.mjs remove <name without the mmo-rw- prefix>` as soon as
  their branch is merged, and check `df -h /c` before creating more. Keep logs/outputs small.
  Old folders `mmo-t4-control`, `mmo-t4-scaling-*` are not yours; leave them.
- **Traps**: write scripts with the Write tool (heredocs collapse backslashes); line endings vary
  per file (check `git diff --numstat`); `pnpm test -- <substr>` runs a subset, run the full suite
  before merging; read the `N/M passed` line, not the exit code; `biomeEcology.test` is flaky under
  load; never run `pnpm install` in a worktree; never `git checkout -b` in a shared worktree.
- Tests are plain tsx scripts; new mechanics ship with a wiring test. Keep `pnpm typecheck` clean.

## Plan for the night (suggested order)

1. Read the above; run typecheck + the suite; make sure the baseline is green.
2. Per class, in parallel lanes: run its T1 route alone on a clean server; fix whatever stops it
   (death loops first), then T2, T3, T4 in turn. Tune numbers; record before/after.
3. Fix the wiring gaps above in order of impact on the pass bar (anything that makes a class
   unplayable or a boss unbeatable first).
4. Re-run every route end to end one final time on clean servers; record results per class and tier.
5. Docs pass; update `STATUS.md` and the memory file; push the branch.

## What to leave behind

- `docs/briefs/class-first-build/OVERNIGHT-REPORT.md`: per class and tier, did the route pass the
  bar (kills, deaths, time, boss attempts); every number you changed (file, old, new, why); every
  rule you changed; what is still broken; questions for the designer (short, concrete); the exact
  command to start the playtest build.
- A green suite and clean typecheck at the last commit; the branch pushed.
- Free disk: remove merged worktrees; no servers or bots left running.

## Stop conditions

Stop and write the report if: disk is below 10 GB free; the suite cannot be made green after a
merge you cannot undo; or you have spent your budget. Do not leave half-merged state.
