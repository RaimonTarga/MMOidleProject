# MMO Idle Agent Guide

Compact context for coding agents. Prefer source files over this doc when they disagree.
For deeper architecture rules, read `design_docs/architecture.md`.

## Product

MMO Idle is an automatic-combat idle RPG. Players build characters, choose skills,
gear, runes, parties, and traversal strategy; the server decides all gameplay
outcomes.

Hard axioms:
- Server authoritative: damage, HP, progression, rewards, deaths, persistence.
- Split tick: logic runs at 10 Hz, node deltas broadcast at 5 Hz.
- Component presence gates behavior. Attach/detach components; do not encode absence
  as false flags, zero durations, empty arrays, or string switches.
- Keep features simple and local. Reuse existing formulas, components, and systems.

## Repo Shape

```text
client/   Phaser + React player app, Vite on :3000
admin/    React ops dashboard, Vite on :3001, served at /admin in prod
server/   Express + Socket.IO + authoritative ECS simulation
shared/   Cross-boundary types, protocol, components, formulas, static data
tools/    Balance TUI and supporting tools
```

Important entrypoints:
- `server/src/index.ts` boots HTTP, sockets, migrations, logs, admin namespace,
  combat bootstrap, and loops.
- `server/src/world/World.ts` owns the miniplex ECS, canonical queries, tick order,
  deltas, deaths, boss respawn markers, and telemetry.
- `server/src/systems/combatBootstrap.ts` is the only place to register combat
  listeners for live server and benches.
- `shared/src/protocol/socketEvents.ts` and `shared/src/protocol/admin.ts` define
  socket contracts.
- `client/src/net/deltaApplier.ts` is the inbound network state seam.
- `client/src/scenes/game/` contains the real Phaser scene; `client/src/scenes/GameScene.ts`
  is a compatibility re-export.
- `admin/src/App.tsx`, `admin/src/socket.ts`, and `admin/src/tabs/` make up the ops UI.

## Commands

Use pnpm from repo root.

```bash
pnpm install
pnpm dev:server      # starts db, logdb, redis, then server on :4000
pnpm dev:client      # player app on :3000
pnpm dev:admin       # admin app on :3001
pnpm build           # shared, client, admin, server
pnpm typecheck       # all packages, no emit
pnpm play            # build player client, enable ops map, start server
```

Docker and data:

```bash
pnpm db:up           # postgres game DB, postgres log DB, redis
pnpm db:down
pnpm db:reset
pnpm db:logs
pnpm docker:dev      # hot-reload full dev stack
pnpm docker:rebuild  # rebuild dev image after dependency changes
pnpm docker:up       # production-like full stack
pnpm docker:down
```

Other useful checks:

```bash
pnpm bench:server
pnpm bench:balance
pnpm bench:tui
pnpm test:spatial
pnpm bake:hitboxes
pnpm size:check
```

Art pipeline (PixelLab): `pnpm art:import|seed|generate|review|pack|status`.
`art/src/` is the committed source of truth; the atlases in
`client/public/assets` are build output of `art:pack`. Read
`tools/pixellab/README.md` before touching sprites/icons; never edit packed
atlas PNG/JSON by hand. `art:generate` spends real API credits — always
`--dry-run` first.

## Tests

Tests are plain tsx scripts, not a test framework (no vitest/jest). Each file
constructs real `World`/component state and throws via a hand-rolled `assert`
on failure; a trailing `console.log("<name>: ok")` marks completion.

- Locations: `server/test/*.test.ts` and `shared/src/**/*.test.ts`.
- Run everything: `pnpm test` (runs `scripts/run-tests.mjs`, which discovers
  and runs every file via
  `pnpm --filter @mmo-idle/server exec tsx --conditions=development <file>`,
  prints a per-file pass/fail summary, and exits nonzero on any failure).
- Run a single file the same way, e.g.
  `pnpm --filter @mmo-idle/server exec tsx --conditions=development test/dungeonPlains.test.ts`.
- `pnpm test:spatial` remains a narrower legacy alias for the two spatial/collision suites.
- CI (`.github/workflows/ci.yml`) runs `pnpm typecheck` then `pnpm test` on
  push/PR to `develop`/`master`. No Postgres/Redis services are provisioned —
  tests must not depend on them (construct `World` directly instead).
- New mechanics should ship with a wiring smoke test: attach the component,
  tick the world, assert observable invariants (component presence, state
  transitions, no throw) — not balance numbers.
- Files prefixed with `_` are throwaway sanity scripts and are skipped by the
  runner.

## Runtime Dependencies

Local compose starts:
- `db` at `postgresql://postgres:postgres@localhost:5432/gamedb`
- `logdb` at `postgresql://postgres:postgres@localhost:5433/logdb`
- `redis` at `redis://localhost:6379`

Production must set `DATABASE_URL`, `LOG_DATABASE_URL`, and `REDIS_URL`.
Game DB migrations live in `server/src/db/migrations`; operational log migrations
live in `server/src/logdb/migrations`. Both run at boot. Log retention defaults to
7 days via `LOG_RETENTION_DAYS`.

Discord login additionally uses `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`,
`DISCORD_REDIRECT_URI`, and `CLIENT_URL`. `AUTH_DEV_BYPASS=1` enables explicit
`devAccountId` socket auth only when `NODE_ENV !== production`; production always
requires an opaque session token.
Set `VITE_AUTH_DEV_ACCOUNT_ID` to the same development account ID when the browser
should use that explicit bypass instead of Discord login.

## Package Boundaries

- `shared/` contains component shapes, protocol DTOs, socket maps, pure formulas,
  static databases, registries, and constants. It must not import server, client,
  Node-only APIs, Phaser, Socket.IO, Express, or miniplex.
- `server/` owns all mutable world state, time, randomness, persistence, combat,
  rewards, AI, spawning, transitions, admin actions, telemetry, and logging.
- `client/` renders authoritative deltas and sends intent events only.
- `admin/` observes logs/telemetry/analytics and sends admin actions through the
  `/admin` Socket.IO namespace. Admin auth is currently a TODO; keep it trusted-dev
  only until fixed.

Feature flow: shared contract/data -> server authority -> client/admin presentation.

## ECS Rules

- `ServerEntity` in `server/src/ecs/entity.ts` lists optional component keys.
- Canonical queries live on `World`: `playerEntities`, `livePlayers`, `monsterEntities`,
  `minionEntities`, archetype queries, marker queries.
- Use `attachComponent`, `detachComponent`, marker helpers, `setEntityMotion`,
  `stopEntity`, `setAttackTarget`, and `setAggroTarget`.
- Mutating networked slices in place requires `mutateSlice` or `markSliceDirty`
  from `server/src/ecs/dirtyHelpers.ts`.
- Network allowlists are `NETWORKED_PLAYER_KEYS` and `NETWORKED_MONSTER_KEYS` in
  `shared/src/protocol/networkedEntity.ts`.
- Dev boot runs marker/network invariants. Fix the invariant, not the check.

Component naming uses verb phrases: `HasHealth`, `UsesSkills`, `TracksCombat`,
`AppliesDots`, `ControlsMonster`, `ScriptsBoss`, `SummonsMinions`, etc.

## Combat And Mechanics

- Combat pipeline: `beforeAttack -> onAttack -> onHit -> onDamageTaken -> afterHit -> onKill`.
- Register listeners in `initCombatSystems()` so live and benchmark harnesses stay
  identical.
- `CombatContext` is the mutable exchange record. Handlers may adjust damage,
  cancellation, metadata, plating multiplier, and proc context.
- Use `world.pushEvent(nodeId, event)` for hit/kill/dodge animation events. Do not
  add per-tick booleans to networked slices for animations.
- `TracksCombat` is server-only scratch state: counters, resources, cooldowns,
  flags, strings, status effects. Use helper APIs, not raw map spelunking.
- Status effect `data` is `Record<string, number>` only.
- Archetype runtime state lives on archetype slices, not in `TracksCombat`.

Current class roots include cadence, cooldown, dot, reload, energy, and summoner.
Summoner owns minions through `SummonsMinions`/minion systems; command intent is
`player:commandSummons`.

Important formula conventions:
- Attack speed skill stat is `attackSpeedPct`; sum additively, then apply once.
- Reload's half-damage/double-speed multiplier is a final stat layer.
- Reload plating compensation belongs in the reload listener via `ctx.platingMult`.
- DoT damage-per-stack is derived from attack, conversion percent, and max stacks.
- `biomeXpForLevel` is the only biome XP threshold function.
- `biomeLevelCap(playerTier, biomeGroup)` takes exactly two args.
- Evasion is a fraction from 0 to 1, not old `1/N` notation.
- An evaded hit applies no debuffs/DoT: every on-hit debuff/DoT/status applier must
  early-return on `evadeBlocksDebuffs(ctx)` (respects monster `appliesThroughEvade` /
  player `shared.applies-through-evade`). Unlike a chaotic-axe miss, which still applies them.
- Use shared melee/ranged helpers from `shared/src/data/skillTree/rootsAndFrames.ts`.

## World, Progression, And Persistence

- World is an 11x11 node grid from `NODE_BIOMES`; center is the clearing.
- Node freeze/thaw makes monsters ephemeral. Never persist monster combat state,
  aggro, movement, boss runtime state, status effects, or minions.
- Boss respawn markers are runtime/client-facing; the Void Overlord cooldown is
  persisted through `worldStateRepo`.
- Player persistence is component-shaped JSON columns in Postgres. Persisted slices
  include player identity/progression/inventory/skills/position/health; runtime slices
  and passives are rebuilt on attach/recalc.
- DB work should stay out of hot ticks. Snapshot synchronously before async saves.
- Parties are runtime-only and represented by the networked `InParty` slice.
- Rewards for same-node party members are applied in `grantMonsterRewards`.

## Client Rules

- Client never decides gameplay. It sends intents and renders `state:sync` /
  `node:delta`.
- Outbound player socket emits go through intent helpers, not random UI calls.
- React HUD state flows through `hudBus` and Jotai atoms.
- Phaser render state is split by concern maps; avoid a god visual object.
- Use shared view composers/types for tooltips and presentation.
- Depth ordering uses `DEPTH` bands and y-sort, not raw depth integers.
- Background-tab protections matter: capped `dt`, visibility resync, and no queued
  tweens while hidden.

## Admin And Ops

- Admin protocol lives in `shared/src/protocol/admin.ts`.
- Server namespace is `server/src/admin/namespace.ts`; actions route through
  `server/src/admin/actions.ts` and `gameActions.ts`.
- Admin tabs cover logs, analytics, world log, ops map, players, characters, debug.
- Structured logs use `server/src/log.ts` and persist/query via `server/src/logdb/`.
- Telemetry is published through `server/src/broker/` using Redis and consumed by
  clients/admin as `world:telemetry` / `admin:telemetry`.
- Discord player authentication does not cover `/admin` or the `/admin` Socket.IO
  namespace. Keep them behind trusted access until separate admin auth exists.

## Socket Surface

Do not hand-write parallel socket types. Update shared protocol first.

Player server-to-client highlights:
- `state:sync`, `node:delta`, `node:preparing`
- `account:characters`, `character:createResult`, `character:deleteResult`,
  `character:selectResult`
- `crafting:result`, `inventory:upgradeResult`
- `player:died`, `player:ascended`, `overlord:felled`
- `world:events`, `world:telemetry`, `world:bossFelled`
- `session:kicked`

Player client-to-server highlights:
- Lobby: `character:create`, `character:select`, `character:delete`
- Movement/AI: `player:move`, `player:navigateTo`, `player:setAuto`,
  `player:setAutoTraverse`, `player:setAutocombatConfig`, `player:commandSummons`
- Sync/session: `player:requestSync`, `player:setActive`, `player:ackDeath`
- Progression/economy: `player:unlockSkill`, `player:resetClass`, `rune:setLoadout`,
  `inventory:equipItem`, `inventory:unequip`, `inventory:upgradeItem`,
  `crafting:craftRecipe`
- Social/flavor: `party:join`, `party:leave`, `player:emote`
- Dev-only debug events are guarded server-side and ignored in production.

## Data Authoring

- Static data lives in `shared/src/data/`, `shared/src/quests/`, and registries.
- Use explicit `new Map<string, T>(...)` generics for large typed maps.
- Recipe upgrade steps are incremental and belong next to recipe definitions.
- `upgradeCostFor` returns multi-essence cost records.
- Ranged monsters with generic impact should use `gunshot`; thematic styles can stay.
- Monster `evasion` is a per-hit dodge fraction (0–1), the same notation as the player evasion stat (0.2 ≈ 1 in 5); keep it ≤ 0.25 (≈ 1 in 4).
- Slow/root effects must store `totalMs` in status effect data for buff UI clocks.
- Root-level `shared/src/*.ts` files (e.g. `monsterDatabase.ts`, `itemDatabase.ts`) are legacy
  shims/entrypoints, not authoring locations; NEW static data goes in `shared/src/data/`.

## Docs

- Living design/architecture docs live flat in `docs/` and `design_docs/`. The
  `docs/archive/` and `design_docs/archive/` subdirs are HISTORICAL — implemented
  plans and superseded brainstorms. Do not trust `archive/` as current; every
  archived file carries a header pointing to its live successor.
- Each reworked system has a paired `docs/<system>-current-state.md` (the living
  truth) and an archived `docs/archive/<system>-plan.md` (the original plan, kept
  for rationale). `docs/system-rework-status.md` is the scoreboard; if it and a
  current-state doc disagree, read the code.
- When a plan ships: fold anything still true into the `*-current-state.md`, then
  git-move the plan into `archive/` with a one-line "ARCHIVED — implemented; live
  state in X" header. Don't leave shipped plans flat next to living docs.
- New feature ideas start in `docs/future-plans.md`, not a fresh top-level doc.
- If code and any doc disagree, the code wins — fix the doc.

## Current Priority / Known Gaps

Keep this short; check source/issues before acting.
- Finish/verify Railway-style deployment with game DB, log DB, and Redis.
- Admin auth is not implemented; do not expose admin beyond trusted dev use.
- Continue balance/playtest passes.
- Some late-tier mechanics and T3+ monster balance may still be placeholders.
