# Codebase Cleanup Plan (pre-polish runway)

Source: architecture audit, 2026-07-05. Goal: a verified, trustworthy base before
the polish/playtest phase (biome ecology T2+, skills rework, gauntlet/boss
iteration, cores/stances/rites maturation). The new systems were sprint-implemented
with little testing; this plan prioritizes *verification* over beautification.

## Rules for the implementing agent

- One task per session/PR. Read this section plus your task only.
- No behavior changes unless the task says so. No balance-number edits ever.
- Run `pnpm typecheck` before finishing. If a task adds tests, run them.
- If an existing test FAILS when first wired up, do not silently "fix" code or
  test to make it green. Diagnose: stale test vs. real regression. Report the
  finding in the PR description; only update the test if you can explain why
  the current game behavior is the intended one.
- Follow CLAUDE.md axioms (server authority, component presence gates behavior,
  shared package import restrictions).

## Task 1 — Wire up the test suite + CI  [DONE 2026-07-05] [model: Sonnet | size: S | do first]

There are ~13 test files (`server/test/*.test.ts`, `shared/src/**/*.test.ts`)
written as plain tsx scripts with hand-rolled `assert` functions. Nothing runs
them except the ad-hoc `test:spatial` script. There is no CI.

Do NOT migrate to vitest/jest — keep the tsx-script style (it needs
`--conditions=development` and boots real World instances).

1. Add `scripts/run-tests.mjs`: glob `server/test/*.test.ts` and
   `shared/src/**/*.test.ts`, run each sequentially via
   `pnpm --filter @mmo-idle/server exec tsx --conditions=development <file>`
   (match the working invocations in `.claude/settings.local.json` and the
   `test:spatial` script). Print per-file pass/fail summary, exit nonzero if
   any fail. Skip files starting with `_` (throwaway sanity scripts).
2. Root `package.json`: add `"test": "node scripts/run-tests.mjs"`.
   Keep `test:spatial` as-is.
3. Add `.github/workflows/ci.yml`: on push + PR to `develop`/`master`;
   pnpm install (respect `packageManager` field), `pnpm typecheck`, `pnpm test`.
   No docker services needed — verify first that the test files don't touch
   Postgres/Redis (they construct `World` directly; if one does need infra,
   exclude it from CI with a comment).
4. Add a short "Tests" section to CLAUDE.md: how to run, the script style,
   where tests live, and "new mechanics get a wiring smoke test".

Acceptance: `pnpm test` runs all suites locally; CI green on a trivial branch.

**Result:** Added `scripts/run-tests.mjs` (discovers `server/test/*.test.ts` +
`shared/src/**/*.test.ts`, skips `_`-prefixed files, runs each via
`pnpm --filter @mmo-idle/server exec tsx --conditions=development <file>`,
prints pass/fail summary, exits nonzero on failure). Added root `"test"`
script; kept `test:spatial` as-is. Added `.github/workflows/ci.yml`
(push/PR to develop/master: pnpm install --frozen-lockfile, typecheck, test;
no docker services — confirmed no test file touches Postgres/Redis). Added a
"Tests" section to CLAUDE.md. All 13 existing test files pass locally;
`pnpm typecheck` clean. CI has not yet been verified green on GitHub itself
(no push done as part of this task).

## Task 2 — Dead code sweep  [DONE 2026-07-05] [model: Sonnet | size: S]

`client/src/ui/RunesPanel.tsx` (847 lines) is superseded by `BuildRunesTab.tsx`
and imported nowhere (verify with grep before deleting). Delete it and fix the
two stale doc-comments in `client/src/hudBus.ts` that still say "Called by
RunesPanel".

Then hunt for siblings: run `npx knip` (or ts-prune) at repo root for
unimported modules. CAUTION — false positives: tools/, server/bench/,
server/test/, db migrations, vite/express entrypoints, and `shared/src/*.ts`
re-export shims (those are intentional). Delete only files that are clearly
superseded UI/system copies; list ambiguous candidates in the PR description
instead of deleting them.

Acceptance: `pnpm typecheck` and `pnpm build` pass.

**Result:** Deleted `client/src/ui/RunesPanel.tsx` (847 lines, superseded by
`BuildRunesTab.tsx`, zero code imports — only two stale doc-comments in
`hudBus.ts`, fixed to say `BuildRunesTab`). Ran `npx knip` at repo root; it
flagged 48 "unused files." Verified each cluster before acting:
- False positives (kept, do not re-attempt deleting): `client/src/ui/crafting/`,
  `client/src/ui/inventory/`, `client/src/ui/map/` + `ItemIcon.tsx` — knip
  doesn't follow the re-export shim pattern (`client/src/ui/CraftingPanel.tsx`
  etc. do `export { X } from './crafting'`), so it misreads the real
  implementation directories as dead. Same false-positive shape as
  `server/src/scenes` style compat shims noted in CLAUDE.md.
  `client/public/death-notification-sw.js` (registered by string path, not
  import). `server/scripts/netcode-baseline.ts` (standalone perf tool, run
  manually via tsx, same pattern as `tools/*`). `tools/*.ts` and
  `server/test/*.test.ts` / `shared/src/**/*.test.ts` — exactly the
  false-positive categories the task description warned about.
- Genuinely dead, deleted after confirming zero importers repo-wide:
  `server/src/systems/classes/shared/resources.ts` (getMaxResource/
  setMaxResource, unused duplicate of resource helpers — real code uses
  `getResource`/`setResource` from `@mmo-idle/shared`),
  `server/src/systems/combat/engine/attackCounter.ts` (a generic "every N
  hits" listener scaffold that was never wired to `registerCombatListener`
  by anything; unrelated to the `getCounter`/`setCounter` used everywhere,
  which come from `@mmo-idle/shared`), `server/src/systems/player/progression/
  stats.ts` (back-compat re-export shim for `recalculatePlayerStats`; every
  current caller now imports directly from `@mmo-idle/shared`, so the shim
  had zero remaining consumers), `server/src/utils/math.ts` (`clamp` helper,
  zero importers; the directory is now gone since it was the only file in it).
- **Flagged, NOT deleted — needs your call:** `shared/src/data/monsters/
  advancedBiomesB.ts` and `shared/src/data/recipes/trenchUltimate.ts` are
  disabled Trench-themed content (the import in `monsters/index.ts` is
  commented out; the recipe entries aren't registered in `recipes/index.ts`
  at all). This lines up with the "Trench deferred, may scrap" note from the
  mobility-boots work — it's a content/design decision, not dead code, so I
  left both files in place rather than deleting.
- Also noticed but out of this task's scope (file-level dead code only):
  knip's "unused dependencies" list for `admin/package.json`
  (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `echarts-gl`,
  and devDeps `autoprefixer`/`postcss`) and 176 "unused exports." Not touched;
  flagging here in case a future pass wants them.

`pnpm typecheck`, `pnpm build` (all 4 packages), and `pnpm test` (13/13) all
pass after the deletions.

## Task 3 — Wiring smoke tests for sprint-built systems  [DONE 2026-07-06] [model: Sonnet | size: M | after Task 1]

Highest-value task. The recent systems (abilities, stances, rites, cores,
biome ecology primitives, elite targeting) were implemented fast with no tests.
Add wiring smoke tests in the existing style — copy the structure of
`server/test/dungeonPlains.test.ts` / `targetPriority.test.ts`: construct a
`World`, attach a player with the relevant loadout via the same persisted-slices
path the tests already use, tick N times, assert observable invariants.

Test WIRING, not balance: "component attaches", "status effect appears",
"state machine advances", "no throw over 200 ticks". Never assert damage
numbers. Read `docs/<system>-current-state.md` before writing each test.
One file per system, each < ~200 lines:

- `abilities.test.ts` — equipped ability fires when its rune condition is met;
  cooldown state advances (there are existing `abilitySecondWind`/
  `abilityTechniqueRune` tests — extend the pattern, don't duplicate).
- `stances.test.ts` — stance switch triggers via `updateStanceSwitch`, stat
  layer applies/removes cleanly on switch.
- `rites.test.ts` — a rite recipe applies its effect; persistence slice shape
  survives a snapshot/restore round-trip.
- `cores.test.ts` — core attach/recalc produces expected passive keys.
- `biomeEcology.test.ts` — one test per primitive against a real tier-1 node:
  pack spawns linked, patrol moves, swarm triggers, ambush spawner fires,
  telegraph appears. (Some coverage may exist in dungeon tests — check first.)
- `eliteTargeting.test.ts` — elite-tagged monster + focus-elites rune changes
  `selectAutoCombatAction` choice (extend `targetPriority.test.ts`).

If a system turns out to be broken or half-wired when tested, STOP on that
system, write down exactly what's broken, and move to the next one. Surfacing
breakage is the point of this task; fixing it is a separate decision.

Acceptance: all new tests pass under `pnpm test`; PR description lists any
systems found broken.

**Result:** Added all 6 files. `pnpm test` is 19/19 (13 existing + 6 new);
`pnpm typecheck` clean.

- `stances.test.ts` — default posture activates on first check; anti-thrash
  cooldown blocks an early switch; the reactive posture takes over once its
  rune condition holds AND the cooldown clears; stat deltas apply/remove
  cleanly on each switch (verified via `player.dealsDamage.attack` /
  `mitigatesDamage.damageReduction`, not balance numbers — this is the same
  precedent `abilityTechniqueRune.test.ts` already set).
- `rites.test.ts` — equipped rites fold their `rite.*` passives; Cleansing
  Breath strips a debuff stack on its own pulse cooldown (not every tick);
  Lingering Momentum's net OOC buff decay matches `(1 - slowdown) * dt`;
  Quickened Breath halves the OOC regen delay; a persistence round-trip via
  `validRiteIds` (the exact filter `playerRepo.ts` hydrate uses) drops a
  stale/retired rite id. Real DB hydrate/save is out of scope (tests must stay
  DB-free), so this exercises the filter function directly rather than a full
  Postgres round-trip.
- `cores.test.ts` — a directional core's `core.*` mechanicEffects fold in when
  `selectedRange` matches its `rangeTag`, and fold to NOTHING (not even a
  zeroed passive) the moment `selectedRange` no longer matches — the one
  genuinely new mechanic per `docs/cores-current-state.md`. A universal core
  applies regardless of range.
- `eliteTargeting.test.ts` — extends `targetPriority.test.ts`'s pattern.
  Baseline "nearest" picks the closer non-elite; equipping `focus-elites`
  (condition `in-combat`) makes the farther elite-tagged mob win instead.
  **Gotcha for future test authors:** `attachPlayerEntity` re-derives
  `runesOwned` from `runeRecipesCrafted` (starter runes ∪ crafted-recipe
  unlocks) and silently drops any equipped rule it doesn't own, falling back
  to `DEFAULT_RUNE_LOADOUT` — a T2+ rune like `focus-elites` needs its unlock
  recipe id (`rune-recipe-focus-elites`) in `runeRecipesCrafted`, not just the
  rule in `runesEquipped`, or the test silently exercises the wrong loadout.
- `biomeEcology.test.ts` — tested against real T1 nodes (forest `node-5-6`,
  mountain `node-4-4`, plains `node-5-4`) per the task's instruction. Packs:
  `spawnPack` links alpha+followers, `updatePacks` propagates aggro onto
  un-aggroed followers within call range and telegraphs a `pack-call`
  ecology-pulse; `onPackAlphaDead` scatters (removes) surviving followers.
  Patrol: a freshly spawned sentinel starts idle/stationary, then
  `updateMonsters`+`updateMovement` cycle it into `wandering` and it moves off
  its spawn point. Swarm: two crowded swarm-tagged mobs chasing the same
  target start with near-identical headings; `updateSwarm`'s separation force
  measurably bends them apart while keeping the direction vector normalized.
  Note: the current-state doc's "ambush spawner" phrase doesn't correspond to
  a real separate primitive — the actual Step 12 primitives are packs/patrol
  /swarm/telegraphs (confirmed against `system-rework-status.md` and the
  source), so ambush spawning was not tested as its own thing.
- `abilities.test.ts` (new file, siblings to the existing
  `abilitySecondWind.test.ts` / `abilityTechniqueRune.test.ts`) — covers what
  those two don't: a Guard ability (Brace) firing on its plain built-in
  trigger with no rune override, and the FULL cooldown lifecycle — fires,
  cooldown blocks a same-window refire without resetting, cooldown fully
  decays via `updateCombatState`, ability fires again.

No broken/half-wired systems were found — abilities, stances, rites, cores,
biome-ecology primitives, and elite targeting all behaved exactly per their
current-state docs once the tests accounted for the rune-ownership gotcha above.

## Task 4 — Extract player socket handlers from index.ts  [DONE 2026-07-06] [model: Opus preferred | size: M]

`server/src/index.ts` is 1,078 lines: boot + 36 inline `socket.on` handlers +
7 intervals. Mirror the admin pattern (`server/src/admin/namespace.ts`).

- Create `server/src/net/playerHandlers.ts` exporting
  `registerPlayerHandlers(socket, deps)` where `deps` explicitly carries what
  the closures currently capture (world, the accountId→socket map, hidden-socket
  set, save helpers, …). No module-level mutable state in the new file unless
  it moves wholesale with all its readers.
- MOVE-ONLY refactor: no validation changes, no renaming of events, no
  "improvements". `sanitizeAutocombatConfig`/`clampNumber` move with their
  only callers.
- Boot sequence, intervals, HTTP routes stay in index.ts.

Acceptance: `pnpm typecheck`; manual smoke — `pnpm dev:server` + `pnpm dev:client`,
log in, move, equip an item, join a party, background/foreground the tab
(resync path), die and ack. Target: index.ts < ~600 lines.

**Result:** Created `server/src/net/playerHandlers.ts` (534 lines) exporting
`registerPlayerHandlers(socket, deps)`. Pure MOVE-ONLY: all 36 `socket.on`
handlers (28 player + 7 dev debug + `disconnect`) moved verbatim — no validation,
event-name, or behavior changes. `deps` is an explicit `PlayerHandlerDeps`
interface carrying exactly what the closures captured: `world`, `db`, `accId`,
`adminControls`, the three connection-tracking maps/sets (`socketByAccount`,
`inactiveSockets`, `sessionStartedAtBySocket`), and the two boot helpers the
handlers call (`recordSessionEnd`, `emitBossFelledState`). No module-level
mutable state in the new file. `sanitizeAutocombatConfig` / `clampNumber` /
`AUTOCOMBAT_PRIORITY_MODES` moved with their only caller
(`player:setAutocombatConfig`). Boot sequence, intervals, HTTP routes, and the
per-connection setup (account login, entity attach, initial `state:sync`,
session-start analytics) all stayed in index.ts; the connection callback now
ends by calling `registerPlayerHandlers`.

- index.ts: **1,078 → 617 lines**. (Slightly over the ~600 target; the remaining
  gap is pre-existing dead imports left untouched — see below. Removing those
  would land it ~610.)
- `pnpm typecheck` clean; `pnpm test` 19/19.
- The two helper closures `liveSelf` and `teleportLiveSelfToNode` moved into
  `registerPlayerHandlers`.

**Flagged, NOT changed (move-only scope):**
- `teleportLiveSelfToNode` is DEAD — grep finds zero callers anywhere in the
  repo. Moved verbatim (with a `// NOTE: unused` comment) to keep this a pure
  move; it drags in ~4 imports used nowhere else. Safe to delete in a follow-up.
- index.ts already had **pre-existing dead imports** before this task (verified
  count-1 in HEAD): `checkRecipeUnlocks`, `grantDevLoadout`, `ensurePopulation`,
  `ensureBoss`, `initDeadPlayerGuard`, plus shared `emptyEquipment`,
  `pointInNodeFeatureShape`, `resetTracksCombat`, `RESOLVED_NODE_FEATURES`,
  `RUNE_ALTAR_FEATURE_ID`. Left in place (out of scope), but worth a look —
  `initDeadPlayerGuard` / `ensurePopulation` / `ensureBoss` sound like boot
  wiring that may have been dropped in an earlier refactor. Candidate for a
  future dead-import sweep.

**Manual smoke NOT run:** the login/move/equip/party/background/die-ack flow
needs the full docker stack (db + logdb + redis) plus dev client and is
interactive. Static verification is strong (typecheck + 19/19 tests + verified
all 36 event names present and dep wiring exact), but a live smoke pass is still
recommended before merge.

## Task 5 — Doc hygiene  [DONE 2026-07-06] [model: Sonnet | size: S]

1. `biome-refactor-playtest.md` exists in BOTH `docs/` and `design_docs/` with
   different content. Diff them, merge/keep the current one in `docs/`
   (git log both to see which is newer), delete the other, grep for references.
2. Make CLAUDE.md the single source of truth. Replace AGENTS.md body with a
   pointer: "All project rules live in CLAUDE.md — read it fully before
   working." (preserve the "Imported Claude Cowork project instructions"
   section if tooling depends on it).
3. Add one line to CLAUDE.md's Data Authoring section noting that root-level
   `shared/src/*.ts` database files are legacy shims/entrypoints and NEW static
   data goes in `shared/src/data/`.

**Result:** The two `biome-refactor-playtest.md` files turned out to be
genuinely different documents, not two versions of the same one: `design_docs/`
held Step 1/2-era ambient biome-tuning playtest notes (mobDensity numbers, pack/
patrol/swarm behavior, swamp rot pools — last touched `3bd901a`/`deeb141`,
2026-06-25), while `docs/` holds the current Step 13 per-biome *dungeon boss*
playtest notes (Forest/Plains/Swamp/Cave T1 exams — last touched `4e3c476`,
2026-06-29). Grepped all references repo-wide: every existing reference
(`docs/system-rework-status.md` x3) points at the `docs/` version already; the
`design_docs/` copy was orphaned. Its ambient-tuning content is superseded at
the architecture level by `docs/biome-ecology-current-state.md` +
`docs/monster-behavior-current-state.md` (the exact tuning numbers are balance
content, out of scope to port per the "no balance-number edits" rule). Deleted
`design_docs/biome-refactor-playtest.md` via `git rm`; kept the `docs/` version
as-is (no merge needed — no surviving unique, still-accurate, non-balance
content to fold in).

Replaced `AGENTS.md`'s body (which was a verbatim duplicate of CLAUDE.md) with
a one-line pointer to CLAUDE.md, preserving the trailing empty "Imported Claude
Cowork project instructions" header verbatim.

Added a line to CLAUDE.md's Data Authoring section (with a real example,
`monsterDatabase.ts`/`itemDatabase.ts`, verified against `shared/src/*.ts`)
noting root-level `shared/src/*.ts` files are legacy shims/entrypoints and new
static data goes in `shared/src/data/`.

`pnpm typecheck` clean (docs-only change; no code touched).

## Task 6 — architecture.md refresh  [DONE 2026-07-06] [model: Opus | size: M | needs care]

`design_docs/architecture.md` predates the entire system rework (last touched
2026-05-29) but CLAUDE.md sends every agent there. Verify every existing claim
against current code (do not trust the doc), then add short sections for the
post-rework systems by reading `docs/*-current-state.md`: abilities, stances,
rites, cores, aspects/catalysts, biome ecology primitives, elite system,
dungeon gauntlets, mobility boots. Keep it architecture-level (where state
lives, who owns what, extension points) — no balance content. If a
current-state doc contradicts code, code wins; note the discrepancy.

**Result:** Ran this with Sonnet (not Opus as tagged) via parallel research
agents (verification of existing claims + one pass each over abilities/
stances/rites/cores and over aspects-catalysts/biome-ecology/elite-targeting/
dungeon-gauntlets/mobility-boots), then hand-wrote/synthesized every doc edit
myself so voice and detail level stayed consistent; spot-checked the agents'
highest-impact claims (tick order, DB driver, a couple of component names)
directly against source before trusting them.

Verified-and-fixed drift from the pre-rework doc (code wins, corrected in place):
- Persistence is Postgres via Drizzle (`pg`/`drizzle-orm`), not SQLite — fixed
  in the mermaid diagram, the shared/ import-boundary rules, the forbidden-
  imports list, and the Persistence section.
- The `World` class lives in `server/src/world/World.ts` (capital W), not
  `world.ts` (that file is `ecs/world.ts`'s unrelated `createEcsWorld()`).
- `World.tick()` runs ~29 ordered calls now, not 13 — rewrote the tick-schedule
  block with the real current order (read directly from `World.ts:340-372`)
  and explained why it grows by one line per genuinely new system instead of a
  branch inside an existing one.
- Named `server/src/systems/combatBootstrap.ts` / `initCombatSystems()` as the
  actual single combat-listener registration point (old doc never named it).
- Fixed the stale buff code sample (real `BuffOptions.category` is required;
  the example buff id it used, `cooldown-execution`, no longer exists anywhere
  in the codebase).
- Updated the client directory tree: new rework-era panels/render files, and
  `scenes/GameScene.ts` is now a compat re-export (real lifecycle file moved to
  `scenes/game/GameScene.ts`).

Added a new "Post-rework systems" section (architecture-level only — state
location, mechanic owner, extension point, composition-vs-new-system call) for
all 9 requested systems: Abilities, Stances, Rites, Cores, Aspects & Biome
Catalysts economy, biome ecology AI primitives (packs/patrol/swarm/telegraphs),
elite-tag targeting, dungeon gauntlets/boss exams, and mobility boots. Flagged
one current-state doc as stale in-place: `docs/aspects-catalysts-current-state.md`
is still written as a pre-implementation audit ("catalysts don't exist") even
though catalysts are fully implemented — noted in the new section rather than
edited (that doc is Task 7's territory, out of scope here). Added matching rows
to the "quick reference: where to put things" table and a `Status: current as
of 2026-07-06` header with a "code wins on disagreement" pointer.

`pnpm typecheck` clean (docs-only change; no code touched).

**Verification pass (Opus, 2026-07-06):** re-checked the load-bearing claims against
source. The 29-line tick schedule matches `World.ts` verbatim; persistence/Drizzle,
all component names (`HasArmedAbility`/`InPack`/`TracksDungeon`), all
`TracksProgression` loadout fields, client panels, `gauntletDatabase.ts`, the
`elite?: boolean` flag, and the `aspects-catalysts` stale-doc call-out all verified
accurate. Fixed two Sonnet-era slips: (1) `gauntlet.ts` path was `server/src/world/
dungeons/` in both the tree and the gauntlets "Owner" line — real path is
`server/src/systems/world/dungeons/gauntlet.ts`; (2) the buff code sample used
`category: 'ability'`, not a valid `BuffCategory` — changed to `'neutral'` (the real
`ability-guard` descriptor's value). Also nested `combatBootstrap.ts` under `systems/`
in the tree. Both slips were path/label-level, not conceptual.

## Task 7 — Docs lifecycle: archive retired docs, add status headers  [model: Sonnet | size: M | needs care]

There are ~53 docs (~16.5k lines) across `docs/` and `design_docs/`. Volume is
not the problem; the problem is that implemented plan docs and historical
brainstorms sit flat next to living docs, so greps and doc-reading agents can
mistake stale intent for current truth.

1. Create `docs/archive/` and `design_docs/archive/`. Git-move (preserve
   history), don't delete.
2. Archive rules — verify each candidate against `docs/system-rework-status.md`
   and the matching `*-current-state.md` before moving:
   - `docs/*-plan.md` whose plan is IMPLEMENTED (per status doc) → archive.
     Before archiving, check the matching current-state doc captures anything
     still true/valuable from the plan; if not, note it in the PR, don't move.
     Likely candidates: dot-systems-rework-plan, rune-system-plan,
     dungeon-gauntlet-implementation-plan, abilities-plan, stances-plan,
     cores-plan, rites-plan, charms-plan, gear-evolution-plan,
     global-mastery-plan, aspects-catalysts-plan, biome-ecology-plan.
   - `design_docs/` historical items: roadmap-2026-06 (explicitly marked done),
     *-brainstorm docs, design-audit-2026-06, t4-* docs (T4 shipped),
     tier3-design-plan → archive with a one-line "HISTORICAL — superseded
     by/implemented as X" header prepended.
   - NEVER archive: design-bible, game-overview, economy-philosophy,
     player-power-curve, BALANCE_REFERENCE, boss-design, architecture,
     system-rework-roadmap/status, t5-t8-endgame-suggestions, release-flow,
     all *-current-state docs, codebase-cleanup-plan, future-plans.
   - When unsure, DO NOT move — list the file in the PR description instead.
3. Add `Status: current as of YYYY-MM-DD` headers to the living docs touched.
4. Fix references: grep for each moved filename across the repo (docs,
   CLAUDE.md, code comments, memory is out of scope) and update paths.
5. Add a short "Docs" section to CLAUDE.md: living docs live in `docs/` /
   `design_docs/`; `archive/` subdirs are historical and must not be trusted
   as current; when a plan ships, fold surviving truths into the current-state
   doc and archive the plan; new feature ideas start in `docs/future-plans.md`.

Acceptance: no broken doc references (grep moved names); CLAUDE.md section
added; PR lists every move and every unsure-skip.

**Result [DONE 2026-07-07] [ran on Opus]:** Created `docs/archive/` and
`design_docs/archive/`; all moves via `git mv` (history preserved).

- **Archived to `docs/archive/` (12 implemented plans** — verified 🔨/✅ = IMPLEMENTED
  in `system-rework-status.md` scoreboard, and confirmed each has a living
  `*-current-state.md` companion): abilities, aspects-catalysts, biome-ecology,
  charms, cores, dot-systems-rework, gear-evolution, global-mastery, rites,
  rune-system, stances, dungeon-gauntlet-implementation. Each got a one-line
  `ARCHIVED … live state in docs/<system>-current-state.md` header.
- **Archived to `design_docs/archive/` (11 historical):** roadmap-2026-06,
  dungeon-design-brainstorm, information-design-brainstorm, rune-system-brainstorm,
  system-rework-brainstorming-final, design-audit-2026-06, the four t4-* docs,
  tier3-design-plan. Each got a one-line `HISTORICAL — superseded by/implemented as X`
  header.
- **Kept flat (deliberate):** all `*-current-state.md`; the hybrid
  `dungeon-current-state-and-gauntlet-plan.md` (it *is* the living dungeon
  current-state — only the pure `dungeon-gauntlet-implementation-plan.md` was
  archived); every NEVER-archive doc in both dirs.
- **Unsure → NOT moved (flagged per rules):** `design_docs/design-development-suggestions.md`
  — reads as a June-2026 forward-looking idea brainstorm (companion to the archived
  design-audit), but its filename lacks `brainstorm` and it could be a live idea
  backlog like `future-plans.md`. Left in place; its refs to now-archived docs were
  repointed to `archive/`. Recommend a human call on whether it's historical.
- **References fixed:** all living-doc navigation pointers (11 current-state
  "Companion" lines, the roadmap's source-brainstorm + prior-roadmap links, the
  status doc's Current-state-notes "Plan (…)" bullets, `design-bible.md`'s
  t4-spec ref, `project-brief.md`'s roadmap link — which was also stale
  ("current active roadmap" for a completed one), now repointed to the live
  system-rework roadmap/status) and the handful of cross-boundary refs inside
  archived docs. Intra-archive same-dir bare refs still resolve and were left.
  **Left untouched:** dated session-log prose in `system-rework-status.md` that
  mentions old plan filenames — it's append-only history, not navigation.
- **Status headers:** did NOT stamp `current as of 2026-07-07` on the current-state
  docs. I only link-touched them (mechanical ref fix), did not re-audit their
  content, and each already carries its own `audited`/`IMPLEMENTED` date — a fresh
  date would falsely imply re-verification. The living/historical split is now
  carried structurally by the `archive/` dirs + headers instead.
- CLAUDE.md: added a `## Docs` section (living vs. `archive/`, the plan↔current-state
  pairing, the ship→fold→archive workflow, future-plans.md as the idea inbox,
  code-wins-on-disagreement).

`pnpm typecheck` clean (docs-only; no code touched).

## Deferred — do NOT hand these to Sonnet/Opus now

- **`runPlayerAttack` decomposition** (`server/src/systems/combat/engine/combat.ts:140-529`).
  Ordering-sensitive core combat (evasion vs. debuffs vs. procs vs. plating).
  Revisit only after Tasks 1+3 provide a safety net, with a strong model, and
  ideally with a bench-snapshot characterization run before/after.
- **`gauntlet.ts` data-driven refactor**. Gauntlets are queued for heavy design
  iteration — refactoring code that's about to be redesigned is wasted tokens.
  Reconsider once the gauntlet design stabilizes.
- **Seedable RNG in `shared/src/systems/spatial.ts`**. Only worth it if
  deterministic bench replays become a goal.

## Suggested order

1 (test runner + CI) → 3 (smoke tests) → 2, 5, 7 anytime → 4 → 6.
Do 7 (docs archive) before 6 (architecture refresh) so the refresh only has to
reconcile living docs.
Task 3 is the one that de-risks the polish phase; everything else supports it.
