# CS6-ROUTE: the Striker's guided tutorial and bot route

**Agent:** Codex or Grok · **Worktree:** `../mmo-rw-cs6-route` · **Branch:** `rw/cs6-route` ·
**Size:** M

**Read first:** `AGENT-RULES.md`; `C-striker.md` (this folder); the bible §12.4 ("The first ten
minutes") and §12.13 (bot plan) in `design_docs/class-first-bible.md`; the tutorial engine
(`shared/src/tutorial/types.ts`, `scripts/index.ts`, `scripts/sealRoute.ts`, `scripts/plans.ts`,
`scripts/opening.ts`) and `docs/guided-tutorial-current-state.md`; the bot routes
(`bot/src/routes/smokeT1.ts`, `routes/index.ts`, `bot/src/route/types.ts`, the `classConfig`
step in `bot/src/route/executor.ts`) and `docs/bot-experiment-runner-current-state.md`.

## Why

The Striker's runtime exists (the Order: techniques on beats, the opener and wind-up casts, the
trophy finisher). A fresh Striker needs its guided T1, and the balance pipeline needs a Striker
bot route that plays T1 to both seals.

## 1. The tutorial (`shared/src/tutorial/scripts/striker.ts`)

Register a builder in `TUTORIAL_CLASS_BEATS['cadence-root']` (`scripts/index.ts`). It returns the
Striker's beats after the shared opening and **keeps the seal route's structure** (build on
`buildSealRouteBeats()`: same zones, order, seals and farewell), adding the Striker's own beats
at the right moments (bible §12.4):

- After the class is picked: the combo. Five beats, four plain swings and a finisher; the strip
  on the HUD shows it; the Order on the class screen sets it.
- When the Plains teaches Sweep (Plains level 2, around minute 6): Sweep is on a beat now (the
  auto Order placed it); a technique beat swings a bit lighter and hits every enemy around you.
- When each T1 zone teaches its technique (Forest Hamstring, Swamp Rend, Mountain Coil, Cave
  Focus, each at that zone's level 2): one line each; Coil and Focus are casts that take their
  beat (the wind-up and the opener).
- After the first boss kill: its trophy is your finisher now (the auto Order equipped it).

Plain words, short lines, no numbers, the voice of the existing opening and seal route. Use
only the existing step and condition types (`farm`, `travel`, `attemptBoss`, `biomeLevelAtLeast`,
`bossCleared`, ...); if the script needs a new one, stop and say so.

## 2. The bot route (`bot/src/routes/strikerT1.ts`)

A `striker-t1` route registered in `bot/src/routes/index.ts`, built like `smoke-t1`: the tier-0
quest, `chooseClass` `cadence-root`, a `classConfig` step with `mode: 'auto'` (the server
resolves the §12.13 default: techniques in family order, Coil once owned), then the T1 zones in
`T1_BIOME_ORDER` farmed to the levels the tutorial uses, the Plains seal boss and the Mountain
seal boss (`attemptBoss`), and completion at both seals (tier 2 promotion if a condition
exists). Milestones per zone and per seal. Read how `smoke-t1` threads the class and how the
runner picks routes; don't change the runner.

## Edit only

`shared/src/tutorial/scripts/striker.ts` (new), `shared/src/tutorial/scripts/index.ts` (the one
registration), `bot/src/routes/strikerT1.ts` (new), `bot/src/routes/index.ts`, a new
`bot/src/routes/strikerT1.test.ts` modelled on `smokeT1.test.ts`, and your report. Nothing in
`server/` or `client/`.

## Checks

- `pnpm typecheck` clean.
- `pnpm test -- tutorial strikerT1 smokeT1` pass (`tutorial.test.ts` checks every script's
  steps resolve).
- No server or bot run is needed; if you do run one, use your own port and database, never
  4000.

## Report

`docs/briefs/class-first-build/reports/CS6-ROUTE.md` (AGENT-RULES shape): the beats you added
and where they sit in the seal route, the route's steps, and anything left.
