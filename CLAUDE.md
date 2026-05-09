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

- Entity shapes: `PlayerState`, `MonsterState` (when added)
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
| `state:sync` | S→C | Full snapshot on connect |
| `state:tick` | S→C | Authoritative world state, every tick |
| `player:joined` | S→C | Another player entered the node |
| `player:left` | S→C | Another player left |
| `player:moved` | S→C | Position update (between ticks) |
| `player:move` | C→S | Client requests movement to (x, y) |

New events must be typed in `ServerToClientEvents` or `ClientToServerEvents`
before being emitted.

---

## Server architecture

`server/src/index.ts` is intentionally one file for now. It contains:

1. **Express setup** — CORS, JSON body parser, health endpoint at `GET /health`
2. **Socket.IO setup** — typed with shared event maps
3. **In-memory state** — `Map<string, PlayerState>` (will move to SQLite later)
4. **Game loop** — `setInterval` at `GAME_CONFIG.TICK_RATE` Hz; calls `tick(dt)`
   then broadcasts `state:tick` to all connected clients
5. **Socket handlers** — `connection`, `disconnect`, `player:move`

The `tick(dt)` function is where all server-side game logic goes:
movement, combat resolution, monster AI, respawns, etc.

---

## Client architecture

`GameScene.ts` is the main (and currently only) Phaser scene.

- Connects to `http://localhost:4000` via Socket.IO on `create()`
- Maintains a `Map<string, Phaser.GameObjects.Rectangle>` for player entities
- `upsertPlayer()` creates or repositions a rectangle for a given PlayerState
- Server tick snapshots (`state:tick`) reconcile all positions each tick
- Click-to-move: player can click to send `player:move` to the server,
  overriding server-driven auto-movement (Step 2 feature)

**No React. All in-game UI is Phaser objects.** Login/character-select pages
will be plain HTML files served by Express.

---

## Art / assets

Placeholder colored rectangles only. Real sprites to be decided later.
Do not introduce an asset pipeline or loader until art is decided.

- Own player: green `0x44ff88`
- Other players: blue `0x4488ff`
- Monsters (planned): red `0xff4444`

---

## What is NOT built yet (do not hallucinate these)

- [ ] Discord OAuth
- [ ] SQLite / Drizzle (database is wired but not used)
- [ ] Monsters / NPC entities
- [ ] Combat system
- [ ] Stats (HP, attack, defense)
- [ ] XP / leveling
- [ ] Inventory
- [ ] Multiple nodes / node routing
- [ ] Character select screen
- [ ] Deployment (Caddy, PM2, Hetzner)

---

## Coding conventions

- **TypeScript strict mode** — no `any`, no non-null assertions without comment
- **No build step for shared during dev** — import from `@mmo-idle/shared` directly
- **Server is the source of truth** — client never mutates game state; it only
  sends intent events and renders what the server sends back
- **One feature at a time** — implement in shared → server → client order
- **Comments on non-obvious logic** — especially tick math and network events
