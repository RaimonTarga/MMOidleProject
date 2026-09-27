# MMO Idle

MMO Idle is a solo-first, server-authoritative idle RPG. The client renders a
shared world, while the server owns movement, combat, progression, crafting,
equipment, and persistence. The repository is a pnpm workspace containing the
game client, operations UI, server, shared rules, bot harness, and asset tools.

The source code is authoritative. Documentation explains the current system,
design intent, or historical evidence; if a document disagrees with shared/ or
server/, fix the document rather than inferring behavior from it.

## Current shape

- **World:** Clearing is the T0 tutorial hub. Playable region data is authored
  for T1 through T4 in shared/src/world/map/; the current registry contains
  170 sparse nodes in a 16-row by 14-column bounding box. Normal nodes carry
  one of the five node modifiers (alacrity, heavy, swarming, dominion, or
  fortified), and each authored biome/tier has a guarded dungeon.
- **Progression:** biome mastery uses six levels per normal tier segment;
  Clearing has its separate four-level tutorial curve. Global Mastery is a
  derived sum of real biome levels and excludes Clearing. It drives rune-point
  capacity and the item upgrade ceiling.
- **Builds:** the six root mechanics are Cadence, Cooldown, Reload, Energy,
  DoT, and Conduit. The skill tree adds frame, range, and specialization
  choices as authored by the current tree data. Abilities, Runes, Stances,
  Rites, Cores, Relics, Charms, and gear are separate build layers.
- **Equipment:** the slots are weapon, armor, recovery, mobility, core, and
  relic. Ordinary upgradeable items can reach +5 when their definition permits
  it; Cores and Relics use named evolution rules instead of the ordinary +N
  track.
- **Runtime:** the server runs a 10 Hz logic loop and 5 Hz broadcast loop.
  Connected characters autosave every 30 seconds and save again on disconnect.
  Gameplay telemetry is written to the separate log database when enabled.

The current world and content counts are intentionally described at the level
of the registry and data loaders. Re-run the source-level checks when adding a
region or tier instead of treating this paragraph as a second configuration
file.

## Repository layout

| Path | Responsibility |
| --- | --- |
| client/ | Phaser rendering, React HUD, auth/lobby, input, effects, and presentation state |
| admin/ | React operations dashboard and admin Socket.IO client |
| server/ | ECS world, authoritative simulation, auth, persistence, admin namespace, and telemetry |
| shared/ | Shared types, protocol views, world authoring, item/recipe data, progression, and pure rules |
| bot/ | Headless route executor, policy experiments, telemetry recorder, and run dashboard |
| scripts/ | Build, release, experiment, report, art, and environment tooling |
| art/ | Source assets, manifests, and generated/packed art inputs |
| reports/ | Generated analysis and QA artifacts; not the live source of game rules |
| docs/ | Current-state records, active operations notes, briefs, and archived evidence |
| design_docs/ | Design and architecture authority; historical material is under design_docs/archive/ |

## Local development

Prerequisites are Node.js 22+ and pnpm 8.15.1 (the version pinned in
package.json). Docker is required for the local PostgreSQL and Redis services.

~~~powershell
pnpm install
Copy-Item .env.example .env        # PowerShell; fill in only what you need
pnpm db:up
pnpm dev:server                    # http://localhost:4000
pnpm dev:client                    # http://localhost:3000
pnpm dev:admin                     # http://localhost:3001
~~~

The three development commands can run concurrently in separate terminals.
pnpm dev:server starts the game database, log database, and Redis first. The
Docker development stack is an alternative:

~~~bash
pnpm docker:dev
pnpm docker:down
~~~

For a production-shaped local container, use pnpm docker:up. It builds the
application image, runs the server on port 4000, and starts the database and
Redis dependencies. pnpm db:reset is destructive to local Docker volumes; use
it only when deliberately resetting local data.

## Authentication and local access

Guest play creates a real account with a persistent-until-linked guest session.
Discord OAuth creates a normal 30-day session. Linking a guest to Discord keeps
the account and characters, then converts the guest session to the ordinary
30-day lifetime. Session tokens are stored by the client and sent to the player
Socket.IO namespace; they are not admin credentials.

Production admin HTTP/Socket.IO access is separately protected by ADMIN_TOKEN.
The server rejects short or missing production tokens; do not put the token in a
VITE_* variable or commit it. Development-only identity bypass is controlled by
AUTH_DEV_BYPASS=1 plus VITE_AUTH_DEV_ACCOUNT_ID, and is refused in production.
Anonymous spectator and bot-watch flows are development tooling, not production
player auth.

Copy .env.example to .env for the complete variable list. The core local
services use:

- game PostgreSQL on localhost:5432 (DATABASE_URL),
- telemetry/log PostgreSQL on localhost:5433 (LOG_DATABASE_URL), and
- Redis on localhost:6379 (REDIS_URL).

Discord variables are optional for guest-only local work. ADMIN_TOKEN is
required for production admin access. Telemetry details and retention policy
live in [docs/gameplay-telemetry-current-state.md](docs/gameplay-telemetry-current-state.md).

## Useful commands

The root package.json is the command index. The most common checks are:

~~~bash
pnpm typecheck
pnpm test
pnpm build
pnpm play                         # build and serve the client/server locally
pnpm bot:preflight                # validate bot prerequisites before a long run
pnpm test:spatial                 # focused spatial/world checks
pnpm size:check
~~~

Focused families include `pnpm bench:server`, `pnpm bench:balance`, the
`pnpm bot:t2-*` catalogue/route/validation commands, `pnpm experiment:*`,
`pnpm dps:report`, `pnpm ehp:report`, `pnpm mob:report`, `pnpm tier:table`,
and `pnpm art:*` commands. Read the relevant
current-state or operator document before treating a bot run, report, or
accelerated reward run as balance evidence.

Release preparation and deployment checks are documented in
[docs/release-flow.md](docs/release-flow.md). Do not infer production health
from a local build; verify the deployed /healthz and the intended live URL
when doing release work.

## Documentation map

Start with the [documentation index](docs/README.md). It distinguishes four
categories:

1. **Current state** — implementation facts cross-checked against source.
2. **Design authority** — intended behavior and design constraints in
   [design_docs/](design_docs/).
3. **Active plans and briefs** — scoped work that is explicitly still open.
4. **Historical evidence** — completed plans, handoffs, experiment packets,
   reports, and superseded decisions under docs/archive/, design_docs/archive/,
   or the evidence index in docs/briefs/.

High-value entry points:

- [Architecture](design_docs/architecture.md)
- [Current-state documentation](docs/README.md#systems--current-state)
- [Playtest command center](docs/briefs/playtest-followup-command-center-2026-09-25.md)
- [Release flow](docs/release-flow.md)
- [Bot command center](docs/bot-experience-command-center.md)
- [Telemetry current state](docs/gameplay-telemetry-current-state.md)

When a shipped plan is no longer needed for active work, fold its durable
facts into the relevant current-state document and move the plan to the
appropriate archive with an ARCHIVED header. Keep dated experiment results
and raw receipts as evidence; they are not promises about current behavior.

## License and project status

This is a private, active project. The package version is currently 0.5; the
version and release records describe delivery state, not a promise that every
design document in the repository is current.
