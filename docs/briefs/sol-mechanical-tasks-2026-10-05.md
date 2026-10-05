# Sol mechanical tasks (2026-10-05)

Six independent worker tasks for cheap OpenAI (Sol 6.1) sessions. Every task has a right
answer and no design call in it. Each worker runs in its OWN worktree, opened in that
folder (the title bar must show it), and never touches another worktree. Rules for all:

- `pwd`, `git status` and `git branch --show-current` first. The worktree must be clean and
  on the branch named below. If it is not, STOP and report; do not fix it.
- Never `pnpm install`. Never push. Never merge. Never kill a process by image name. Strip
  CR only on files you create or edit. Never edit a file outside the paths your task names.
- Before every commit: the related tests the task names, then `pnpm typecheck`.
- Finish with the report file the task names. Where you could not do something
  mechanically, say so; do not guess.
- If a file you need is being changed by someone else (unexpected entries in `git
  status`), stop and report. That is a live session.

The designer merges every branch. Nothing here is merged by the worker.

---

## 1. Full suite on the tooling-repair branch — `../mmo-lin-w2a`

Branch: stay on `fix/tooling-repair` (do not branch, do not commit). Astra's report
(`docs/briefs/tooling-repair-report-2026-10-03.md`) says the related tests passed and the
full runtime suite was not run.

1. `pnpm typecheck`.
2. `pnpm test` (the whole suite, ~5–6 min). Record the pass count, the fail list and the
   slowest files as the runner prints them. The baseline on develop is **379/379**
   (verbs-that-fire report). This branch adds `reportTools`, `bakedHitboxArtifact`,
   `benchNodeShards`, `liveRouteActions` additions and re-includes `conduitPlayerBodies`,
   so the count should be higher, never lower.
3. If anything fails, rerun that file alone once (`pnpm test -- <substring>`) to separate
   flaky from real, and include both outputs. Fix nothing.
4. Write `reports/tooling-repair-2026-10-03/full-suite.md` (untracked; do not commit):
   counts, fail list with the assertion text, the flaky/real split, wall time. Nothing else
   changes on disk.

## 2. Status registry audit — `../mmo-lin-w1a`

Branch: `git checkout -b audit/status-registry develop`. Read-only on code; the output is
one document.

Build the complete table of status-effect ids the server can put on a player or a monster,
and what the client can show for each.

- Sources of ids: every `applyStatusEffect(` / `applyMonsterSlow(` / bleed-driver / DoT
  call in `server/src/systems/**`, the id constants in
  `server/src/systems/combat/damage/bleedIds.ts` and siblings, monster ability `status`
  fields in `shared/src/data/monsters/**`, lineage payloads in `shared/src/data/lineages/**`
  and `shared/src/systems/lineages.ts`, ability/rune effects in `shared/src/data/**`.
- Client tables: `client/src/hud/statusHelp.ts` (label + help), `targetStatusMeta.ts`
  (target badge label + colour), `BuffBar.tsx` / `buffTransitions.ts` (buff-bar tile),
  `client/src/ui/conceptIcons.ts` and any icon lookup the buff bar uses, `statusTooltips.ts`.
- For each id: where it is applied (file:line), who carries it (player / monster / both),
  which of label / help / badge / icon / tooltip exist, and whether it stores `totalMs`
  when it is a slow or root (CLAUDE.md rule). Flag ids applied but never shown, and
  entries shown but never applied (dead copy).
- Pin the method: a throwaway script under `server/scripts/_statusAudit.ts` (underscore =
  skipped by the runner) that greps the id sources and the client tables and prints the
  gap table, so the audit can be rerun. Commit it with the document.

Report: `docs/briefs/status-registry-audit-2026-10-05.md` — the table, the gap list first,
the method. Tests: none to run beyond `pnpm typecheck`. One commit.

## 3. Four-tier audit — `../mmo-lin-w1b`

Branch: `git checkout -b audit/four-tier develop`. Read-only on code; the output is one
document.

List every place the code assumes the game has exactly four tiers (T1–T4, with T0 the
Clearing), and what would break if a fifth appeared. Known starting points:
`TIER_SCALAR` and `ROW_SCALAR` in `shared/src/data/lineages/magnitudes.ts` (four entries),
the band/row model (`T4 cross` is the last row; `shared/src/data/lineages/types.ts`,
`index.ts`), `biomeLevelCap(playerTier, biomeGroup)` and `biomeXpForLevel` in
`shared/src/**`, `monsterPoolByTier` / `bossPoolByTier` in `shared/src/biomeDatabase.ts`,
the region files and `shared/src/world/map/regions.ts` / `registry.ts` / `validation.ts`,
the map panel's region masks (`client/src/ui/map/**` or wherever `regionT4` is read),
the player tier cap and ascension (`shared/src/systems/**`, `server/src/systems/player/**`),
the recovery per-tier base table (`docs/recovery-current-state.md` names it), the pool-raise
factors, `TutorialBeat` / tutorial `playerTierAtLeast`, the bot route builders
(`bot/src/routes/t*RouteBuilder.ts`), and every test that enumerates `[1, 2, 3, 4]` or
`tier <= 4`.

For each: file:line, the kind of assumption (array length / literal 4 / enum / switch
default / test pin), and the consequence class: *silently wrong*, *throws*, *typecheck
fails* (good: the compiler finds it), *test fails*. Group by package. No code changes.

Report: `docs/briefs/four-tier-audit-2026-10-05.md`. One commit. `pnpm typecheck` only.

## 4. Docs folding — `../mmo-lin-w1c`

Branch: `git checkout -b docs/fold-2026-10-05 develop`. Docs only (`docs/**`,
`design_docs/**`). Follow CLAUDE.md "Docs" exactly. One commit per item.

1. **The tutorial.** `docs/guided-tutorial-plan.md` is a shipped plan still flat
   (status "ACTIVE PLAN", shipped v0.6.2, three validation records since). Create
   `docs/guided-tutorial-current-state.md` holding everything in it that is still true
   (what it is, where things live, director behaviour, scripts, the weapon-page lessons, the
   first-hour checklist, running the validation, findings and open questions), then
   `git mv` the plan to `docs/archive/guided-tutorial-plan.md` with the one-line
   "ARCHIVED — implemented; live state in guided-tutorial-current-state.md" header. Keep the
   validation records in the current-state page (they are the evidence).
2. **The stray block above the design doc's title.** `design_docs/progression-rework-design.md`
   has a block of decision items (numbered 9–13) above its `#` title; the verbs-that-fire
   report (item 14) found 9 and 10 duplicate §18.9/§18.10 and 11–13 exist nowhere else.
   Move 11–13 VERBATIM to the end of §18 as new numbered amendments (continue §18's
   numbering), delete 9 and 10 only if their text is contained in §18.9/§18.10 (quote both
   in the commit message to prove it), and remove the block from above the title. Change no
   wording. This is the designer's document: a move, not an edit.
3. **Shipped plans flat in `docs/`.** Check the status line of `map-variety-plan.md`,
   `terrain-variance-plan.md`, `ui-redesign-plan.md`,
   `boss-encounter-redesign-implementation-plan-2026-09-04.md`. Archive only those whose
   own status line says implemented/shipped AND that already have a paired current-state
   page (fold nothing new; if truths would be lost, leave it flat and list it in the
   report). For each archived file add the header and fix every link that pointed at it
   (`grep -rn` the filename across `docs/`, `design_docs/`, `CLAUDE.md`, memory is not
   yours).
4. **`docs/README.md`** index updated in each commit above. `docs/system-rework-status.md`
   scoreboard: mark the tutorial row.

Report: `docs/briefs/docs-fold-report-2026-10-05.md`: what moved, what was left flat and
why. No tests; `pnpm typecheck` is not needed for docs but run it anyway.

## 5. Retired-ladder remnants — `../mmo-lin-w1d2`

Branch: `git checkout -b chore/ladder-remnants develop`. The `+N` upgrade ladder, the
evolve path and catalysts are retired on every slot (design §23, §24.5; Astra's fold
`feat/cc-fold`; tooling repair item 2). Find what survived.

- Grep (case-insensitive, whole repo minus `docs/archive`, `design_docs/archive`,
  `reports/`, `art/`): `itemUpgrades`, `upgradeLevel`, `upgradeCostFor`, `upgradeItem`,
  `inventory:upgradeItem`, `upgradeResult`, `evolve`, `evolution`, `catalyst`, `+5`, `plus5`.
- Classify each hit: **live** (a reader exists: a call site, a socket handler the client
  emits, a test that asserts behaviour), **dead code** (exported, zero importers; a handler
  nothing emits; a protocol event nothing sends), **dead copy** (strings, help text,
  tooltips, release notes that describe the ladder as present; release-notes PAGES for past
  versions stay as history), **docs** (list only; task 4 owns docs).
- Remove only dead code and dead copy. The protocol pair (`inventory:upgradeItem` /
  `inventory:upgradeResult`) is removed only if BOTH the client emit and the server handler
  are dead; otherwise list it. Do not touch `shared/src/data/lineages/**`,
  `shared/src/tutorial/**`, `server/src/systems/combat/**`, `bot/src/routes/**` (Astra just
  rewrote those; list hits there instead).
- One commit per package (shared, server, client, admin, tools).

Tests: every test file whose name matches a removed symbol, plus `pnpm test -- lineage
item recipe crafting durability`, then `pnpm typecheck`. Report:
`docs/briefs/ladder-remnants-report-2026-10-05.md`: the classification table with
file:line, what was removed, what was listed and why.

## 6. Ops scripts: logdb backup and the scratch-DB inventory — `../mmo-lin-w2b`

Branch: `git checkout -b ops/logdb-backup develop`. Scripts and docs only; no server code.

1. **Logdb backup.** `scripts/logdb-backup.mjs`: `pg_dump` of `LOG_DATABASE_URL` (custom
   format, compressed) to a directory from `LOGDB_BACKUP_DIR` (default
   `./backups/logdb`), filename with an ISO timestamp, then prune files older than
   `LOGDB_BACKUP_KEEP_DAYS` (default 14). `--dry-run` prints what it would do. Exit non-zero
   on a failed dump and never prune after a failure. A matching
   `scripts/logdb-restore.mjs --file <dump> --to <url>` with a required `--yes`. Add
   `pnpm logdb:backup` / `logdb:restore` to the root `package.json`. Test it against the
   local compose logdb (`pnpm db:up` is allowed; `postgresql://postgres:postgres@localhost:5433/logdb`):
   dump, restore into a scratch database named `logdb_restore_check`, count rows in one
   table on both sides, drop the scratch database. Put the transcript in the report.
   Document in `docs/release-flow.md` (a short "Backups" section) and note in
   `docs/gameplay-telemetry-current-state.md` item 5 that the script exists; Railway's own
   volume backups remain the operator's.
2. **Scratch-DB inventory.** `scripts/db-inventory.mjs`: connect to the local game
   Postgres server (`localhost:5432`), list every database matching `gamedb%` or
   `logdb%` with size and the newest `pg_stat_database` activity time, mark `gamedb` and
   `logdb` as **live**, everything else as **scratch candidate**. Print only; it never drops.
   `pnpm db:inventory`. Run it once and paste the output in the report so the designer can
   approve the drop list.

Tests: none exist for scripts; `node --check` both files and run each `--dry-run`.
`pnpm typecheck`. Report: `docs/briefs/ops-scripts-report-2026-10-05.md`.

---

## Launch prompts

Open each in the named folder. Check the title bar before pasting.

**1 · `../mmo-lin-w2a`**
```
pwd, git status, git branch --show-current: you must be in ../mmo-lin-w2a, clean, on
fix/tooling-repair. Do not branch or commit. Read docs/briefs/sol-mechanical-tasks-2026-10-05.md
task 1 and do exactly that. Fix nothing.
```
**2 · `../mmo-lin-w1a`**
```
pwd, git status, git branch --show-current: you must be in ../mmo-lin-w1a, clean, on
feat/vf-conditions. Then git checkout -b audit/status-registry develop. Read
docs/briefs/sol-mechanical-tasks-2026-10-05.md: the rules at the top and task 2. Read-only
on game code; the document and the one underscore script are the output.
```
**3 · `../mmo-lin-w1b`**
```
pwd, git status, git branch --show-current: you must be in ../mmo-lin-w1b, clean, on
feat/vf-t2. Then git checkout -b audit/four-tier develop. Read
docs/briefs/sol-mechanical-tasks-2026-10-05.md: the rules at the top and task 3. No code
changes; the document is the output.
```
**4 · `../mmo-lin-w1c`**
```
pwd, git status, git branch --show-current: you must be in ../mmo-lin-w1c, clean, on
feat/vf-data. Then git checkout -b docs/fold-2026-10-05 develop. Read
docs/briefs/sol-mechanical-tasks-2026-10-05.md: the rules at the top and task 4, and
CLAUDE.md's Docs section. Docs only, one commit per item, change no wording in the design doc.
```
**5 · `../mmo-lin-w1d2`**
```
pwd, git status, git branch --show-current: you must be in ../mmo-lin-w1d2, clean, on
feat/vf-tutorial. Then git checkout -b chore/ladder-remnants develop. Read
docs/briefs/sol-mechanical-tasks-2026-10-05.md: the rules at the top and task 5. Remove only
what has no reader; list the rest. One commit per package.
```
**6 · `../mmo-lin-w2b`**
```
pwd, git status, git branch --show-current: you must be in ../mmo-lin-w2b, clean, on
feat/cc-icons-art. Then git checkout -b ops/logdb-backup develop. Read
docs/briefs/sol-mechanical-tasks-2026-10-05.md: the rules at the top and task 6. Scripts and
docs only; the inventory script never drops anything.
```
