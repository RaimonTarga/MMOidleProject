# Project Brief — MMO Idle

Short orientation for opening a new conversation. For agent rules, read
`CLAUDE.md`. For the design overview, read `design_docs/game-overview.md`; for
implementation facts, start with `docs/README.md`.

## What this is

MMO Idle is a cooperative, server-authoritative browser idle RPG. Characters
travel and fight automatically in a 2D top-down world while players make build
decisions through classes, skills, equipment, Runes, and progression systems.
The server owns movement, combat, rewards, persistence, and authentication state;
the client renders authoritative views and sends intent.

## Tech stack and local shape

- TypeScript monorepo managed by pnpm 8.15.1; Node.js 22 is the local/runtime baseline.
- Phaser 3 plus React/Vite player client on port 3000.
- React/Vite admin client on port 3001.
- Node/Express/Socket.IO authoritative server on port 4000.
- PostgreSQL game database on 5432, separate telemetry/log database on 5433, and Redis on 6379.
- Guest sessions and Discord OAuth serve player authentication; production admin access uses `ADMIN_TOKEN`.
- `shared/` owns cross-boundary data and rules, `server/` owns runtime authority,
  `client/` owns presentation, `bot/` owns headless tooling, and `scripts/` owns
  reports, experiments, releases, and asset workflows.

## Audited current state (2026-09-27)

- The Clearing is the T0 tutorial hub. The live world is an authored sparse
  T1–T4 registry of 170 nodes, not the historical 11×11 grid.
- Six class roots are authored: Cadence, Cooldown, Reload, Energy, DoT, and
  Conduit. The current skill tree has authored T0–T3 layers; T4 skill nodes are
  still target content. Conduit is enabled in all environments, while development
  tooling and auth bypasses remain independently controlled.
- Equipment has six slots: weapon, armor, recovery, mobility, core, and relic.
  Ordinary items use the authored upgrade track; Cores and Relics use named
  evolution rules.
- Global Mastery is derived from biome progression and gates Rune capacity and
  ordinary item upgrades. Catalysts are keyed by node modifier family, not biome.
- The server runs a 10 Hz logic loop and 5 Hz broadcast loop. Gameplay telemetry
  is stored in the separate log database when enabled.

## Key references

- `docs/README.md` — documentation command center and archive lifecycle.
- `design_docs/game-overview.md` — concise gameplay and system overview.
- `design_docs/design-bible.md` — design invariants and long-term vocabulary.
- `design_docs/player-power-curve.md` — target stat bands, explicitly not a runtime contract.
- `docs/system-rework-roadmap.md` and `docs/system-rework-status.md` — current
  follow-up roadmap and implementation scoreboard.
- `CLAUDE.md` — repository instructions and source-first engineering rules.
