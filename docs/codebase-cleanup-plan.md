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

## Task 4 — Extract player socket handlers from index.ts  [model: Opus preferred | size: M]

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

## Task 5 — Doc hygiene  [model: Sonnet | size: S]

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

## Task 6 — architecture.md refresh  [model: Opus | size: M | needs care]

`design_docs/architecture.md` predates the entire system rework (last touched
2026-05-29) but CLAUDE.md sends every agent there. Verify every existing claim
against current code (do not trust the doc), then add short sections for the
post-rework systems by reading `docs/*-current-state.md`: abilities, stances,
rites, cores, aspects/catalysts, biome ecology primitives, elite system,
dungeon gauntlets, mobility boots. Keep it architecture-level (where state
lives, who owns what, extension points) — no balance content. If a
current-state doc contradicts code, code wins; note the discrepancy.

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
