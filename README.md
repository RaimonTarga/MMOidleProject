# MMO Idle

A browser-based hobbyist MMORPG / idle game built for a small group of friends (~100 players max). Characters fight automatically — you build your character, choose a class, and make strategic decisions. No twitch input required.

---

## Concept

- **2D top-down**, sprite-based world made up of an 11×11 grid of zones.
- Players in the same zone see each other in real time.
- **Idle / automatic combat** — your character walks around the zone and fights monsters without clicking. You influence outcomes through gear, class mechanics, and the skill tree.
- **Fully cooperative** — no PvP.
- **Mobile and tablet friendly** — responsive layout kicks in at ≤ 1100 px (phones + tablets in landscape).

---

## Tech stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict, everywhere) |
| Client | Phaser 3 + React 18 HUD + Vite |
| Server | Node.js + Express + Socket.IO |
| Realtime | Socket.IO rooms (one per node) |
| Database | SQLite + Drizzle ORM |
| Auth | localStorage UUID (Discord OAuth planned) |
| Hosting | LAN / port-forward ready; Hetzner VPS planned |
| Packages | pnpm workspaces monorepo |

---

## Project layout

```
/
├── shared/   TypeScript types, databases, socket event maps, game constants
├── client/   Phaser 3 canvas + React HUD overlays + Vite build
└── server/   Express + Socket.IO + authoritative game loop + SQLite
```

Everything that crosses the network boundary is defined in `shared/` first. The server is fully authoritative — the client only renders what the server sends.

---

## Getting started

**Prerequisites:** Node.js 20+, pnpm, and the GitHub CLI (`gh`) for release automation.

macOS / Homebrew:

```bash
npm install -g pnpm
brew install gh
gh auth login          # one-time auth for /release PR and branch automation
```

Windows / PowerShell:

```powershell
npm install -g pnpm
winget install --id GitHub.cli
# Or, with Chocolatey:
# choco install gh
gh auth login          # one-time auth for /release PR and branch automation
```

Then clone and install:

```bash
git clone <repo-url>
cd mmo-idle
pnpm install
```

### Development (hot reload, two terminals)

```bash
pnpm dev:server   # game server on http://localhost:4000
pnpm dev:client   # client dev server on http://localhost:3000
```

### LAN / playtesting (production build)

```bash
pnpm play         # builds client, then serves it from Express on port 4000
```

Friends on the same network connect to `http://<your-lan-ip>:4000`. You'll need to forward port 4000 on your router and allow it through your firewall for internet play.

---

## Architecture

### Tick loop

The server runs two decoupled intervals:

- **Logic tick — 10 Hz (100 ms):** movement, combat pipeline, AI, DoT ticks, defense systems
- **Broadcast tick — 5 Hz (200 ms):** builds a node snapshot and emits `node:state` to all players in that node

Combat events (hits, kills) are queued between broadcasts so the client never misses an animation.

### Persistence

On connect, the server loads the player's character from SQLite (or creates one). Characters are saved on disconnect and every 30 seconds. Client identity is a UUID stored in `localStorage`; a name prompt fires on first visit.

### Combat pipeline

`beforeAttack → onAttack → onHit → onDamageTaken → afterHit → onKill`

All class mechanics are registered as pipeline listeners. The server is the single source of truth for all damage, HP, and state.

---

## What's implemented

### World

- 11×11 node grid; Chebyshev distance from center determines tier (T0–T4)
- Dungeon nodes: enemies at ×2 HP / ×1.6 ATK; one persistent boss per dungeon
- Node transitions, leash-break returns, kite-prevention AI

### Combat

- Automatic aggro, retaliation aggro, auto-targeting
- AoE splash on empowered hits (80 px radius, 0.5× ATK)
- Death / respawn

### Class system — 5 archetypes

Each archetype has a T0 root, T1 sub-variant (light / balanced / heavy), T2 universal range node, and T3 path modifiers.

| Class | Mechanic | T3 status |
|---|---|---|
| Cadence | Hit counter → empowered finisher | All 9 implemented |
| Energy | 0–100 energy → empowered discharge | All 9 implemented |
| DoT | Stacking damage-over-time conversion | All 9 implemented |
| Cooldown | Countdown timer → execution | Light + Balanced (6/9) |
| Reload | Magazine burst → reload window | Designed, not implemented |

T4–T7 nodes exist as generated placeholders.

### Defense / recovery system

Five recovery archetypes via equipment passives: in-combat regen, periodic shield, damage absorption (HoT pool), burst regen, and pure out-of-combat regen. DoT resistance and debuff cleanse also supported.

### DoT details

- Stacks expire after 4.5 s with no hits (refreshed, not stacked, on each hit)
- Damage-per-stack derived from `attack × convPct / maxStacks` at hit time — never hardcoded
- Damage debt (hit-to-DoT conversion) drains once per second to avoid sub-1 damage spam at 10 Hz
- Monsters can apply DoT on hit via `dotEffect` in their definition

### Equipment and crafting

- 4 equipment slots: weapon, armor, recovery, mobility
- Crafting unlocked by biome kill-count thresholds; essences as currency
- Skill tree T0–T7 (T4–7 are placeholders); skill points from quest XP

### Client HUD

- **Desktop (> 1100 px):** left sidebar (stats, buffs, essences), right sidebar (skill tree, inventory, crafting, map, quests), floating AUTO COMBAT button
- **Mobile/tablet (≤ 1100 px):** fixed top bar (HP, name, zone), large fixed AUTO COMBAT button at bottom, slide-out drawer on the right for all menus
- Buff bar with clock-sweep overlays and stack badges
- 11×11 world map with dungeon markers, boss info, and click-to-navigate path display

---

## Roadmap

### Done

- [x] 11×11 world, node transitions, dungeon nodes
- [x] Monster AI (aggro, kite prevention, leash)
- [x] Full combat pipeline with 5 class archetypes
- [x] Skill tree T0–T3 (T4–7 placeholders)
- [x] Equipment, inventory, crafting
- [x] Quest system → XP → skill points
- [x] Death / respawn
- [x] SQLite persistence (load on connect, save on disconnect + 30 s)
- [x] LAN play (client served from Express, dynamic `SERVER_URL`)
- [x] Mobile / tablet responsive HUD
- [x] DoT duration and damage debt tick-rate fixes

### Upcoming

- [ ] Deploy to Hetzner VPS (Caddy + PM2)
- [ ] T1 balance playtest pass
- [ ] T2 biome and monster design
- [ ] Reload T3 server logic
- [ ] Cooldown Heavy T3 (Entropy Collapse, Singular Extraction, Channeled Beam)
- [ ] Discord OAuth / login screen / character select
- [ ] Multiple server instances / node routing
