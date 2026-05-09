# MMO Idle

A browser-based hobbyist MMORPG / idle game built for a small group of friends (~100 players max). Characters move and fight automatically — you build your character and make strategic decisions, but there's no twitch input required.

**Status: early development.** The game loop is being built incrementally; see the roadmap below.

---

## Concept

- **2D top-down**, sprite-based world made up of discrete nodes (zones).
- Players in the same node see each other in real time.
- **Idle / automatic combat** — your character walks around the zone and fights monsters without you clicking anything. You influence outcomes through gear, stats, and skill choices.
- **Fully cooperative** — no PvP.

---

## Tech stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict, everywhere) |
| Client | Phaser 3 + Vite |
| Server | Node.js + Express + Socket.IO |
| Realtime | Socket.IO rooms (one per node) |
| Database | SQLite + Drizzle ORM *(planned)* |
| Auth | Discord OAuth *(planned)* |
| Hosting | Hetzner VPS + Caddy + PM2 *(planned)* |
| Packages | pnpm workspaces monorepo |

---

## Project layout

```
/
├── shared/   TypeScript types, socket event maps, game constants
├── client/   Phaser 3 game + Vite dev server (port 3000)
└── server/   Express + Socket.IO + authoritative game loop (port 4000)
```

Everything that crosses the network boundary is defined in `shared/` first, then used on both sides. The server is fully authoritative — the client only renders what the server sends.

---

## Getting started

**Prerequisites:** Node.js 20+ and pnpm.

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Clone and install
git clone <repo-url>
cd mmo-idle
pnpm install
```

Run the dev servers in two separate terminals:

```bash
# Terminal 1 — game server (http://localhost:4000)
pnpm dev:server

# Terminal 2 — client (http://localhost:3000)
pnpm dev:client
```

Open `http://localhost:3000`. You'll see a dark canvas with your player (green rectangle). Open a second browser tab and a second player appears (blue). Click anywhere to move your character.

---

## Architecture notes

### Server tick

The server runs a `setInterval` game loop at 2 Hz. Each tick:
1. Advances all entities toward their current target position.
2. *(Soon)* Resolves combat between players and nearby monsters.
3. Broadcasts updated positions to all clients.

The low tick rate is intentional — automatic combat means we don't need fast netcode.

### Client interpolation

The client runs Phaser's 60 fps `update()` loop and interpolates entity positions toward the last server-authoritative target. This keeps movement visually smooth even at 2 Hz server ticks.

### Click-to-move

Clicking sends a `player:move` event to the server, which updates the player's target. The server echoes the change back on the next tick. The client also sets the local visual target immediately (client-side prediction) so movement feels instant.

---

## Roadmap

- [x] Monorepo scaffold (shared / client / server)
- [x] Phaser scene + Socket.IO connection
- [x] Server game loop (2 Hz tick)
- [x] Automatic player movement (server-driven)
- [x] Click-to-move override
- [ ] Monster entities — spawn, wander AI
- [ ] Automatic combat — proximity detection, HP, damage
- [ ] Player stats — HP bar, attack, defense
- [ ] Monster respawn
- [ ] Discord OAuth
- [ ] SQLite persistence (player data, characters)
- [ ] Character select screen
- [ ] XP and leveling
- [ ] Inventory and items
- [ ] Multiple nodes + node transitions
- [ ] Production deployment (Hetzner + Caddy + PM2)
