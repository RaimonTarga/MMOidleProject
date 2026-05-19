# MMO Idle — Project Context for Claude Code

Read this file before touching any code. It is the single source of truth for
architecture decisions and conventions.

---

## What this project is

A browser-based hobbyist MMORPG / idle game. Target: ~100 concurrent players
(friends). No PvP. Combat is automatic — the player builds the character and
makes strategic decisions; no twitch input required.

Key design axioms:
- **Server is authoritative.** All game logic (movement, combat, damage, spawn)
  runs in the server tick. The client renders state it receives.
- **Low tick rate is fine.** 2 Hz server tick is the baseline; auto-combat means
  we don't need fast netcode.
- **Simplicity over cleverness.** This is a hobby project maintained with LLM
  help. Prefer readable, obvious code over clever abstractions.

---

## Monorepo layout

```
/
├── CLAUDE.md               ← you are here
├── package.json            ← root (scripts only, no runtime deps)
├── pnpm-workspace.yaml     ← three packages: client, server, shared
├── tsconfig.base.json      ← shared TS compiler base
├── shared/
│   └── src/index.ts        ← ALL shared types, socket event maps, constants
├── client/
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── main.ts         ← Phaser bootstrap (Game config + scene list)
│       └── scenes/
│           └── GameScene.ts ← main scene: socket connection, entity rendering
└── server/
    └── src/
        └── index.ts        ← Express + Socket.IO + game loop (single file for now)
```

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript everywhere | Strict mode on |
| Client framework | Phaser 3 | Sprites/scenes/camera/tweens |
| Client build | Vite 5 | Dev server on port 3000 |
| Server runtime | Node.js + tsx | tsx for dev (no compile step); `tsc` for prod build |
| HTTP / API | Express 4 | Auth routes, health check |
| Realtime | Socket.IO 4 | One room per node instance |
| Database | SQLite + Drizzle ORM | Not yet wired up |
| Auth | Discord OAuth | Not yet wired up |
| Package manager | pnpm workspaces | Always run `pnpm install` from repo root |

---

## Running the project

```bash
# Install (run once, or after adding deps)
pnpm install

# Dev — run in two separate terminals
pnpm dev:server   # http://localhost:4000
pnpm dev:client   # http://localhost:3000
```

---

## Shared package (`@mmo-idle/shared`)

**Everything that crosses the client/server boundary lives here.**

- Entity shapes: `PlayerState`, `MonsterState`, `NodeSnapshot`
- Databases (read-only): `ITEM_DATABASE`, `MONSTER_DATABASE`, `BIOME_DATABASE`, `RECIPE_DATABASE`, `SKILL_TREE`
- Socket event maps: `ServerToClientEvents`, `ClientToServerEvents`
- Game constants: `GAME_CONFIG`

The package exports TypeScript source directly (`main: ./src/index.ts`).
Both Vite and tsx resolve it without a build step.

**When adding a new entity or socket event, always start in `shared/src/index.ts`
and propagate outward.** Never define entity shapes inline on client or server.

---

## Socket event conventions

| Event | Direction | Description |
|---|---|---|
| `state:sync` | S→C | Full node snapshot sent to a newly connected player |
| `node:state` | S→C | Authoritative world snapshot broadcast every server tick |
| `player:died` | S→C | Sent to the player whose HP reached zero (before respawn) |
| `crafting:result` | S→C | Success or failure response to a craft attempt |
| `player:move` | C→S | Client requests movement to (x, y) |
| `player:setAuto` | C→S | Enable/disable server-side auto-targeting |
| `player:unlockSkill` | C→S | Unlock a skill tree node by ID |
| `inventory:equipItem` | C→S | Equip an item from inventory |
| `inventory:unequip` | C→S | Move equipped item back to inventory |
| `crafting:craftRecipe` | C→S | Attempt to craft a recipe |

New events must be typed in `ServerToClientEvents` or `ClientToServerEvents`
before being emitted. Player join/leave is communicated implicitly — players
that appear in or disappear from `node:state` snapshots are added/removed by
the client's `applySnapshot`, so no dedicated events are needed.

---

## Server architecture

`server/src/index.ts` is intentionally flat. It contains:

1. **Express setup** — CORS, JSON body parser, health endpoint at `GET /health`
2. **Socket.IO setup** — typed with shared event maps
3. **Combat mechanics registration** — class archetypes and weapon effects registered at startup
4. **Game loop** — `setInterval` at `GAME_CONFIG.TICK_RATE` Hz; calls `world.tick(dt, now)`
   then broadcasts `node:state` per-player (each player only sees their own node)
5. **Socket handlers** — `connection`, `disconnect`, and all `ClientToServerEvents`

`server/src/world/World.ts` owns all mutable state and orchestrates system calls in `tick()`.
`server/src/systems/` contains one file per system (combat, movement, AI, transitions, etc.).

### Combat pipeline

All damage flows through `combatPipeline.ts` — a simple event bus with phases:
`beforeAttack` → `onAttack` → `onHit` → `onDamageTaken` → `afterHit` → `onKill`

Register listeners via `registerCombatListener`. Class archetypes and weapon effects
hook into these phases. `CombatContext` is a mutable bag that flows through all handlers
for a single attack; handlers can read and write `ctx.damage`, `ctx.cancelled`, and
`ctx.metadata` freely.

### Combat state

Per-entity server-only state lives in `CombatState` (`combatState.ts`). It has typed
buckets: `counters`, `resources`, `cooldowns`, `flags`, `stacks`, `strings`, `burns`.
Use the accessor helpers — never read/write the raw object fields directly. All cooldowns
are decremented by `updateCombatState` at the top of every tick.

For "every N hits do X" mechanics, use `registerAttackThreshold` from `attackCounter.ts`
rather than rolling custom counter logic.

---

## Client architecture

`GameScene.ts` is the main (and currently only) Phaser scene.

- Connects to `http://localhost:4000` via Socket.IO on `create()`
- Maintains `Map<string, Visual>` for players and monsters
- `Visual` holds the sprite, labels, HP/CD bars, interpolation targets, and
  `playerState?: PlayerState` (the latest authoritative snapshot for player visuals)
- `applySnapshot()` is called on both `state:sync` and `node:state`; it reconciles
  all entities including removing ones no longer in the snapshot
- Click-to-move: sends `player:move`, updates local target optimistically for smooth feel

**No React. All in-game UI is Phaser objects.** Login/character-select pages
will be plain HTML files served by Express.

---

## Art / assets

Placeholder colored rectangles only. Real sprites to be decided later.
Do not introduce an asset pipeline or loader until art is decided.

- Own player: green `0x44ff88`
- Other players: blue `0x4488ff`
- Monsters: color defined per-monster in `MONSTER_DATABASE`

---

## What is built

- Multi-node world (5×5 grid) with biome-specific monster pools
- Monster AI (wander / chase / attack / return)
- Player combat (attack range, cooldown, auto-targeting)
- Class system: cadence, cooldown, energy, reload, dot archetypes
- Weapon effects: Chaotic Axe, Sacred Cross, Ashbrand Blade
- Inventory and equipment (4 slots: weapon, armor, recovery, mobility)
- Crafting system with biome-kill unlock gates
- Skill tree with tier-gated unlock flow
- Node transitions (walk through gate edges)
- Death and respawn (back to clearing)
- Client: minimap, biome backgrounds, gate markers, damage numbers, attack animations

## What is NOT built yet (do not hallucinate these)

- [ ] Discord OAuth
- [ ] SQLite / Drizzle (database is wired but not used — all state is in-memory)
- [ ] Multiple World instances / node routing (current: one World with all 25 nodes)
- [ ] Character select / login screen
- [ ] Deployment (Caddy, PM2, Hetzner)
- [ ] Passive skill tree expansion (planned next)

---

## Coding conventions

- **TypeScript strict mode** — no `any`, no non-null assertions without comment
- **No build step for shared during dev** — import from `@mmo-idle/shared` directly
- **Server is the source of truth** — client never mutates game state; it only
  sends intent events and renders what the server sends back
- **One feature at a time** — implement in shared → server → client order
- **Comments on non-obvious logic** — especially tick math and network events
