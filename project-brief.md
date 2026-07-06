# Project Brief — MMO Idle

Brief overview for opening a new conversation. For agent context, the main reference
is `CLAUDE.md`. For design context, see `design_docs/game-overview.md`.

---

## What this is

A browser-based hobbyist MMORPG / idle game for a small group of friends (~100 players).
Characters fight automatically in a 2D top-down world. No twitch input — you build the
character and make strategic decisions, the server resolves all outcomes.

- Fully cooperative, no PvP
- Mobile and tablet friendly (portrait-first HUD)
- Server authoritative ECS, split tick: 10 Hz logic / 5 Hz broadcast

## Tech stack (current)

- **Language:** TypeScript (strict, everywhere)
- **Client:** Phaser 3 + React 19 HUD + Vite on :3000
- **Admin:** React ops dashboard + Vite on :3001
- **Server:** Node.js + Express + Socket.IO + miniplex ECS on :4000
- **Database:** PostgreSQL (game DB :5432, log DB :5433) + Drizzle ORM
- **Cache:** Redis :6379
- **Auth:** localStorage UUID (Discord OAuth is a TODO)
- **Packages:** pnpm workspaces monorepo

## Repo shape

```
client/   Phaser + React player app
admin/    React ops dashboard
server/   Express + Socket.IO + authoritative ECS simulation
shared/   Cross-boundary types, protocol, pure formulas, static data
tools/    Balance reports (dps-report, ehp-report, mob-report) + Rust TUI
```

## Current state (June 2026)

- Content authored through T4 (11×11 grid, 11 biomes, T0–T4 monsters + bosses + recipes)
- 6 class archetypes: Cadence, Energy, DoT, Cooldown, Reload, Summoner
- T0–T3 skill tree fully implemented; T4 specs in progress
- Rune loadout system live; rune balance pass pending
- Mobile HUD shell done; panel internals redesign in progress
- Railway-style deployment in progress; admin auth not yet implemented

## Key design documents

- `design_docs/game-overview.md` — what the game is and how it plays (start here)
- `design_docs/design-bible.md` — core invariants, biome roster, weapon archetypes, math baseline
- `design_docs/player-power-curve.md` — stat bands, eHP/DPS lookup tables, monster tuning guide
- `design_docs/boss-design.md` — boss philosophy, per-tier layer curve, stat anchors
- `docs/system-rework-roadmap.md` + `docs/system-rework-status.md` — current roadmap and live scoreboard (post-T4 system rework). The old `design_docs/archive/roadmap-2026-06.md` (T4 milestone) is archived/historical.
- `CLAUDE.md` — agent coding guide (architecture rules, commands, ECS conventions)
