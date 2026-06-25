# MMO Idle

Browser-based hobbyist MMORPG / idle game built for a small group of friends (~100 players max). Characters fight automatically — you build the character, choose a class, and make strategic decisions. No twitch input required.

---

## Concept

- **2D top-down**, sprite-based world made up of an 11×11 grid of zones (nodes).
- Players in the same zone see each other in real time.
- **Idle / automatic combat** — your character walks around the zone and fights monsters without clicking. You influence outcomes through gear, class mechanics, and the skill tree.
- **Fully cooperative** — no PvP.
- **Mobile and tablet friendly** — portrait-first HUD with responsive layout.

---

## Tech stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict, everywhere) |
| Client | Phaser 3 + React 19 HUD + Vite on :3000 |
| Admin | React ops dashboard + Vite on :3001 |
| Server | Node.js + Express + Socket.IO on :4000 |
| Realtime | Socket.IO rooms (one per node) |
| ECS | miniplex (server-side entity/component model) |
| Database | PostgreSQL (game DB :5432, log DB :5433) + Drizzle ORM |
| Cache / pub-sub | Redis :6379 |
| Auth | localStorage UUID (Discord OAuth is a TODO) |
| Packages | pnpm workspaces monorepo |

---

## Project layout

```
/
├── shared/   Cross-boundary types, protocol DTOs, pure formulas, static databases
├── client/   Phaser 3 canvas + React HUD overlays + Vite build
├── admin/    React ops dashboard (logs, analytics, world map, player inspect)
├── server/   Express + Socket.IO + authoritative ECS simulation + persistence
└── tools/    Balance reports (DPS / eHP / mob), Rust balance TUI
```

Everything that crosses the network boundary is defined in `shared/` first. The server is fully authoritative — the client only renders what the server sends.

---

## Getting started

**Prerequisites:** Node.js 20+, pnpm, Docker (for the local database stack).

```bash
npm install -g pnpm
git clone <repo-url>
cd mmo-idle
pnpm install
```

### Development (three terminals)

```bash
pnpm dev:server   # spins up db/logdb/redis via Docker, then server on :4000
pnpm dev:client   # player app on :3000
pnpm dev:admin    # ops dashboard on :3001
```

The server starts the Docker services automatically on `dev:server`. If you prefer to manage them separately:

```bash
pnpm db:up        # postgres game DB, postgres log DB, redis (detached)
pnpm db:down
pnpm db:reset     # wipe volumes and restart
pnpm db:logs      # tail compose logs
```

### Full dev stack in Docker (hot-reload)

```bash
pnpm docker:dev   # builds dev image and starts everything with hot-reload
pnpm docker:rebuild   # rebuild the dev image after dependency changes
pnpm docker:down
```

### Production-like stack

```bash
pnpm docker:up    # full stack build + run (--profile full)
pnpm docker:down
```

### LAN / playtesting (production build)

```bash
pnpm play   # builds client with ops map enabled, starts server in production mode
```

Friends on the same network connect to `http://<your-lan-ip>:4000`.

---

## Build and type-check

```bash
pnpm build        # shared → client → admin → server (in dependency order)
pnpm typecheck    # tsc --noEmit across all packages
```

---

## Architecture

### Tick loop

The server runs two decoupled intervals:

- **Logic tick — 10 Hz (100 ms):** movement, combat pipeline, AI, DoT ticks, defense systems, archetype mechanics
- **Broadcast tick — 5 Hz (200 ms):** builds a node delta and emits `node:delta` to all players in that node

Combat events (hits, kills) are queued between broadcasts so the client never misses an animation.

### ECS

Server world is a miniplex ECS. Entities have typed component bags; component presence gates behavior (no string discriminators). Canonical queries live on the `World` class. Networked components are allowlisted in `NETWORKED_PLAYER_KEYS` / `NETWORKED_MONSTER_KEYS` and serialized as add/patch/remove deltas.

### Combat pipeline

`beforeAttack → onAttack → onHit → onDamageTaken → afterHit → onKill`

All class mechanics register as pipeline listeners. The server is the single source of truth for all damage, HP, and state.

### Persistence

On connect the server loads the player from PostgreSQL (or creates one). Characters are saved on disconnect and every 30 seconds. Persisted slices: identity, progression, inventory, skills, position, health. Runtime state (archetype slices, passives, combat state) is rebuilt from the persisted data on attach.

DB migrations run at boot from `server/src/db/migrations` (game DB) and `server/src/logdb/migrations` (log DB).

---

## What's implemented

### World

- 11×11 node grid; Chebyshev distance from center determines tier (T0–T4 today; T5–T8 designed, not authored)
- Biomes: Plains, Forest, Mountain, Swamp, Cave (starters); Desert, Jungle (T2+); Tundra, Volcanic, Graveyard, Trench (T3–T4)
- Dungeon nodes (one per biome per tier) — monsters at ×2 HP / ×1.6 ATK; boss per dungeon
- Node transitions, leash-break returns, kite-prevention AI

### Combat

- Automatic aggro, retaliation aggro, auto-targeting
- AoE splash on empowered hits; boss AoE cleave
- Death / respawn in the Clearing

### Class system — 6 archetypes

Each archetype has a T0 root, T1 sub-variant (light / balanced / heavy), T2 universal range node, and T3 path modifiers. T4 specs designed and partially implemented.

| Class | Mechanic | T3 status | T4 status |
|---|---|---|---|
| Cadence | Hit counter → empowered finisher | All 9 implemented | Specs designed |
| Energy | 0–100 energy → empowered discharge | All 9 implemented | Specs designed |
| DoT | Stacking damage-over-time conversion | All 9 implemented | Specs designed |
| Cooldown | Countdown timer → execution | All 9 implemented | Specs designed |
| Reload | Magazine burst → reload window | All 9 implemented | Specs designed |
| Summoner | Minion command and scaling | Root + frames | Specs designed |

### Defense and recovery

Five recovery archetypes via equipment passives: in-combat regen, periodic shield, damage absorption (HoT pool), burst regen, and out-of-combat regen. DoT resistance, debuff cleanse, evasion (deterministic counter model).

### Equipment and crafting

- 4 equipment slots: weapon, armor, recovery, mobility
- Rune loadout system
- Crafting unlocked by biome kill-count thresholds; essences as currency
- Upgrade system (+0 to +3 per item)

### Progression

- Skill tree T0–T3 fully implemented; T4 nodes in progress; T5–T7 placeholders
- Skill points from quest XP (tier quests gated on dungeon boss kills)
- Biome XP → biome level → recipe unlocks

### Parties

- Runtime party system (not persisted); party members in the same node share rewards

### Client HUD

- **Desktop:** left sidebar (stats, buffs, essences), right sidebar (skill tree, inventory, crafting, map, quests)
- **Mobile / tablet:** portrait-first fixed top strip + chip bar + tab bar + bottom sheets; ongoing panel-internals pass
- Buff bar with clock-sweep overlays and stack badges
- 11×11 world map with dungeon markers, boss status, and click-to-navigate

### Admin dashboard

- Tabs: logs, analytics, world log, ops map, players, characters, debug
- Structured operational log (PostgreSQL log DB, 7-day retention)
- Redis-backed telemetry (`world:telemetry` / `admin:telemetry`)

---

## Balance tools

All tools output to `reports/`. HTML reports are browser-viewable; `--llm-packet` produces a Markdown version for pasting into balance sessions.

```bash
pnpm dps:report             # player DPS × class × gear sweep → reports/dps-report.html
pnpm ehp:report             # player survivability sweep → reports/ehp-report.html
pnpm mob:report             # monster stat/threat analysis → reports/mob-report.html
pnpm dps:llm [--tier=N]     # Markdown LLM packet for DPS session
pnpm ehp:llm [--tier=N]     # Markdown LLM packet for eHP session
pnpm mob:llm [--tier=N]     # Markdown LLM packet for monster balance session

pnpm bench:server           # server-side combat benchmarks
pnpm bench:balance          # balance benchmarks
pnpm bench:tui              # Rust balance TUI (requires Cargo)
pnpm test:spatial           # spatial hitbox unit tests
pnpm bake:hitboxes          # pre-compute hitboxes
pnpm size:check             # bundle size check
```

---

## Production environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL game DB connection string |
| `LOG_DATABASE_URL` | PostgreSQL log DB connection string |
| `REDIS_URL` | Redis connection string |
| `LOG_RETENTION_DAYS` | Log retention (default 7) |

---

## Known gaps / next priorities

- Finish and verify Railway-style deployment (game DB + log DB + Redis)
- Admin auth not implemented — keep admin behind trusted-dev access only
- Continue T4 balance and playtest passes
- Some T3+ monster balance still placeholder
- Discord OAuth / login screen / character select
- Mobile HUD panel internals (desktop-styled panels need portrait redesign)
