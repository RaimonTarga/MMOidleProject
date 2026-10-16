# MMO Idle Agent Guide

Compact context for coding agents. Prefer source files over this doc when they disagree.
For deeper architecture rules, read `design_docs/architecture.md`.

## Product

MMO Idle is an automatic-combat idle RPG. Players pick one of six classes, set up
its class system, and choose gear, parties, and traversal strategy; the server
decides all gameplay outcomes.

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
  every file and runs them in parallel — `TEST_JOBS`, default half the cores —
  as `node --conditions=development --import tsx <file>`, prints per-file
  pass/fail with timings plus the slowest files, and exits nonzero on any failure).
- Run a subset by path substring: `pnpm test -- boss summoner`.
- Run a single file directly, e.g. from `server/`:
  `node --conditions=development --import tsx test/dungeonPlains.test.ts`
  (the `tsx` CLI works too but starts a second node, ~2 s slower per file).
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
  `/admin` Socket.IO namespace. Production requires `ADMIN_TOKEN` (32+ characters);
  the dashboard accepts it at runtime and does not persist it in browser storage.

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
- DoT ticks and player procs skip plating and pay `GAME_CONFIG.DOT_DR_SHARE` (half) of the
  target's DR, both directions; monster `dotResistance` stacks on top (`mitigatePlayerTickOnMonster`).
- One multiplier per hit: a mechanic that multiplies a hit records it in
  `ctx.metadata.empoweredMultiplier` (helpers in `server/src/systems/classes/shared/frameLoop.ts`),
  so a rider reading it sees the hit as it was before the multiplier.
- Archetype runtime state lives on archetype slices, not in `TracksCombat`.
- Summons pay half plating (`ctx.formation`). The Slinger pays full plating; its Breaching
  rounds set `ctx.platingMult`.

Important formula conventions:
- Attack speed skill stat is `attackSpeedPct`; sum additively, then apply once.
- `biomeXpForLevel` is the only biome XP threshold function.
- `biomeLevelCap(playerTier, biomeGroup)` takes exactly two args.
- Evasion is a fraction from 0 to 1, not old `1/N` notation.
- Every on-hit debuff/DoT/status applier must early-return on `evadeBlocksDebuffs(ctx)`
  (respects monster `appliesThroughEvade` / player `shared.applies-through-evade`). It is
  true when a monster evades a player hit, but on the PLAYER side only for a full dodge
  (evade mitigation >= 1): a graze still applies the monster's ailments. Unlike a
  chaotic miss (`ctx.metadata.chaoticMiss`), which always applies them.
- Use the shared melee/ranged helpers (`isMeleeArchetype`, `isRangedCombatant`) from
  `shared/src/data/skillTree/roots.ts`.

## Classes (class-first rework)

Design authority: `design_docs/class-first-bible.md` (§1–§6 shared rules, §7–§12 one Locked
section per class). The archetype id is the persisted key; content ids use the class name
(`striker-sweep`, trophies `<class>-relic-<biome>`).

| Class | Archetype · slice | Class system · budget | Core loop | T2 disciplines |
|---|---|---|---|---|
| Striker | `cadence` · `usesCadence` | the Order · Techniques | a combo of beats (plain swings, techniques, casts on the opener and wind-up); the finisher is the empowered hit | Light, Balanced, Heavy |
| Squire | `cooldown` · `usesCooldown` | Response rules · Resolve | hits taken and pressure fill Resolve pips; responses answer enemy moments and refund when they land; a full bar arms the slam | Avenger, Bulwark, Juggernaut |
| Apprentice | `dot` · `appliesDots` | Payoff rules · Sigils | hits lay sigils (stacks of the class DoT, linear ticks, damage from the weapon's potency, not the hit); payoffs spend them at moments on the enemy | Poison, Fire, Frost |
| Slinger | `reload` · `usesReload` | the Loadout · Rack | clips at the gun's own fire rate (never attack speed); rules pick the clip type at each reload; the reload is stationary | Gunslinger, Siege, Trickshot |
| Spirit | `energy` · `usesEnergy` | Thresholds · Storm | the storm is one bar, damage and shield: a constant flow fills it, hits drain it before HP; spends fire in bands above a floor | Overflow, Tide, Reservoir |
| Conduit | `summoner` · `summonsMinions`, `controlsSummons` | Formation · Command | never strikes; fields a roster of summons within Command, with orders and Recall; rebuilds cost HP | Swarm, Pack, Elite |

- Kits: `shared/src/classKits/<class>/kit.ts` (pieces, lessons, trophies, budget,
  disciplines, specializations, leaves). Every number in kit `params`,
  `shared/src/classKits/configs/<class>.ts` and class gear is a placeholder.
- Progress is derived, never stored: lessons from biome levels (`LESSON_ZONE_LEVEL`),
  trophies from boss clears (ranked by the lineage's next-tier boss), the budget from
  Global Mastery (`classBudget`). The relic slot holds one trophy (the finisher, the slam's
  twist, the last round, a Soul...).
- Passive Tree nodes are built from the kits (`shared/src/data/skillTree/classFirst.ts`):
  class (T1), discipline (T2), specialization (T3), leaves (T4+), all `player:unlockSkill`;
  runtimes read `usesSkills.disciplineId` / `specializationId` / `unlockedSkills`. Nodes carry
  no stats.
- The config is the `configuresClass` slice (`ClassConfig`: `auto` | `custom`, the relic
  slot, the system), set by `class:setConfig` and checked by `validateClassConfig`. `auto`
  rebuilds `defaultClassConfig` whenever a lesson, trophy or budget step arrives
  (`refreshClassConfig`).
- Moments are the one trigger vocabulary (`shared/src/classKits/moments.ts`, server registry
  `server/src/systems/combat/moments/`). Add a new trigger there before a class reads it.
- Runtimes: `server/src/systems/classes/archetypes/<archetype>/` (per-tier files, the
  Slinger also `classes/slinger/`), ticked in `classes/registry.ts` order. Class gear:
  `shared/src/data/classGear/<class>.ts` (smart loot). Class screens use the shared
  `compose*View` composers in `shared/src/classKits/`.
- Rules cost nothing; power comes from owned pieces and the budget. No abilities outside
  the class system. Runes remain only as standing orders (movement, targeting, hazards).

## World, Progression, And Persistence

- World is an authored sparse node registry from `shared/src/world/map/`, with
  the Clearing as T0 and current playable region content spanning T1–T4. Do not
  assume a rectangular grid; use the registry and region definitions.
- Node freeze/thaw makes monsters ephemeral. Never persist monster combat state,
  aggro, movement, boss runtime state, status effects, or minions.
- Boss respawn markers are runtime/client-facing and not persisted.
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
- Telemetry is published through `server/src/broker/` using Redis and forwarded only to the admin
  namespace as `admin:telemetry` (never to player sockets; it is ~58 KB per 2 s).
- The `/admin` Socket.IO namespace uses a separate `ADMIN_TOKEN`; production fails
  closed when it is missing/short. Static dashboard assets contain no secrets.
- Gameplay telemetry uses dedicated gameplay tables in logdb, random character IDs,
  and 90-day detail / 365-day daily retention. See `docs/gameplay-telemetry-current-state.md`.

## Socket Surface

Do not hand-write parallel socket types. Update shared protocol first.

Player server-to-client highlights:
- `state:sync`, `node:delta`, `node:preparing`
- `account:characters`, `character:createResult`, `character:deleteResult`,
  `character:selectResult`
- `crafting:result`, `inventory:upgradeResult`
- `player:died`, `player:ascended`
- `class:configResult`
- `world:events`, `world:bossFelled`
- `session:kicked`

Player client-to-server highlights:
- Lobby: `character:create`, `character:select`, `character:delete`
- Movement/AI: `player:move`, `player:navigateTo`, `player:setAuto`,
  `player:setAutoTraverse`, `player:setAutocombatConfig`, `player:recallSummons` (Conduit),
  `player:manualReload` (Slinger); `player:commandSummons` is a no-op left in the protocol
- Sync/session: `player:requestSync`, `player:setActive`, `player:ackDeath`
- Progression/economy: `player:unlockSkill` (class, discipline, specialization, leaf),
  `player:resetClass`, `class:setConfig`, `rune:setLoadout` (standing orders),
  `inventory:equipItem`, `inventory:unequip`, `inventory:upgradeItem`, `crafting:craftRecipe`
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

- `docs/README.md` is the index: every living doc, what it is for, and the
  archive lifecycle. Update it when you add, move, or archive a doc.
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
- Design authority (what a system *should* be) lives in `design_docs/`; state and
  implementation plans live in `docs/`. A shipped system keeps its design doc flat
  in `design_docs/` and archives its implementation plan.
- New feature ideas start in `docs/future-plans.md`, not a fresh top-level doc.
- If code and any doc disagree, the code wins — fix the doc.

## Current Priority / Known Gaps

Keep this short; check source/issues before acting.
- Finish/verify Railway-style deployment with game DB, log DB, and Redis.
- Configure `ADMIN_TOKEN` and logdb backups before production use.
- The class-first rework is built T1–T4 on `rework/class-first` and not yet playtested;
  board and stand-ins: `docs/briefs/class-first-build/STATUS.md`.
- Continue balance/playtest passes; class numbers and T3+ monster balance are placeholders.
