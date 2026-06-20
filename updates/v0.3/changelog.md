# v0.3 - 2026-06-20

## Highlights

- **Runes reworked** — a rebuilt rune system with new targeting behavior that lays the groundwork for working taunts.
- **New dungeon system** — dungeons have been reworked from the ground up.
- **Damage-over-time overhaul** — DoT classes, DoT weapons, and monster DoTs now each behave differently, and every element reads clearly at a glance.
- **Smooth world travel** — moving between nodes now plays a sliding map transition, and forests are full of trees you actually have to path around.
- **Tier 4 combat is in** — most class paths now run end-to-end with new channeling attacks, auras, the "doom" DoT, and cosmetic crits.
- **Big visual & UI pass** — remade backgrounds and boss sprites, a new icon set, and a dedicated mobile UI.
- **Bestiary** — a new in-game bestiary for monster info.
- *(The Conduit class is temporarily unavailable this playtest while it's still in development.)*

## Player-facing changes

### Combat & classes
- The rune system was rebuilt, including a targeting rework that is the framework for working taunts, followed by several rounds of rune tuning.
- Damage-over-time was reworked: the DoT class and DoT weapons now play differently from each other, and monsters have their own dedicated DoT that isn't front-loaded like the player DoT class. Each DoT element (poison, fire, frost, doom) has its own colored damage numbers and on-hit effects, and DoTs, empowered attacks, shields, and regen all look distinct.
- Tier 4 combat specs are in: most class paths now run end-to-end with channeling attacks, aura effects, the "doom" purple DoT, and cosmetic crit visuals. (Some T4 specs are still being finished and may not all work yet.)
- A class and weapon balance pass across Tiers 1–3 normalized attack values, backed by testing and the new balance tooling. (Summoner/Conduit balance is still pending its own dedicated pass.)
- A mechanical pass on chaotic axe and evasion.
- The Abyss ultimate encounter was rewired.

### World & movement
- Travelling between nodes now plays a smooth Link's-Awakening-style map slide instead of a hard cut, with adjacent nodes pre-rendered and lightly fogged so you can peek into neighboring areas at the screen edges.
- Forest biomes are now scattered with trees that act as real obstacles: players, monsters, and minions walk around trunks instead of through them, and click-to-move/auto-path route around them.
- Movement feels more reliable near obstacles and node edges, with smoother camera follow and fewer stalls when entering a new node.
- The dungeon system was reworked.
- Two new biomes (graveyard, trench) were added alongside reorganized monster rosters for the existing biomes.

### Progression & economy
- Progression is less grindy: the biome XP curve was loosened across T2/T3/T4 so power unlocks faster, while essence drops were reduced and essence costs raised — the goal is to make essence the scarce, time-gated resource instead of XP.

### UI & visuals
- General UI rework with a large set of dedicated mobile UI rules, plus a refreshed game UI to fit the new art.
- A new in-game bestiary.
- Big art pass: most biome backgrounds were remade, boss sprites were redone through Tier 3, and missing Tier 2/Tier 3 monster sprites plus Tier 3 class sprites were added. A new UI icon set was added.
- The debug panel is back, now with a "rename character" button.

## Technical changelog

- **Conduit (summoner) is environment-gated for this release.** It stays available in dev but is disabled in production builds: the server rejects `summoner-root` unlocks and the client shows the orb as unavailable. Both sides default to the dev/prod split and expose a `CONDUIT_ENABLED` (server) / `VITE_ENABLE_CONDUIT` (client build) escape hatch to force it on later. See `server/src/env.ts` and `client/src/featureFlags.ts`.
- **DB note for this playtest:** the production database is being wiped before deploy, so no existing Conduit characters need migration.
- New shared collision package (`shared/src/collision/`) covering nav grid generation, A*-style pathfinding, slide resolution, static regions, gates, node adjacency, and projection/query helpers, with a `collision.test.ts` suite wired into `pnpm test:spatial`. Deterministic per-node tree layout and baked trunk hitboxes live in `shared/src/world/trees.ts`. Server movement, AI targeting, auto-target, AoE, and summoner AI now consult the collision index; client gains a map-transition/peek-camera/neighbor-scene rendering stack.
- New shared DoT-element system (`shared/src/systems/dotElements.ts`) resolves a player's DoT element from unlocked path passives/sub-variant; server tags `dot-tick` events and the client selects FX and damage-number styling from the same source. New shared combat helpers: `empoweredMult.ts`, `energyMax.ts`, `energyUpkeep.ts`.
- New server defense mitigations: `reactivePlating.ts`, `stationaryDr.ts`, `sustainedFightDr.ts`, `shieldBreakHeal.ts`, plus deterministic (no-RNG) T4 monster-side ports of player mechanics in `monsterMechanics.ts`.
- Archetype T3 pipelines expanded across cadence, cooldown, dot, energy, and reload trees; consolidated `*State` modules replaced the old detonation/entropyCollapse/alignment ticks.
- Monster data reorganized from grouped files into per-biome rosters under `shared/src/data/monsters/`; recipes reorganized into per-biome `*.recipes.ts` files (incl. new graveyard/trench sets). Economy/progression tuning lives in `shared/src/config/gameConfig.ts` and `shared/src/biomeDatabase.ts`.
- Added a reusable `/mmo_pr` workflow plus Claude/Cursor instructions for branch-scoped changelog notes under `updates/develop/`.
- Added a large set of design docs under `design_docs/` (T4 item/spec/monster designs, economy philosophy, roadmap, rune/dungeon brainstorms, T5–T8 endgame).

## Validation

- `pnpm typecheck`
- `pnpm test:spatial` (spatial hitbox + collision suites) — for the collision/map-transition work.
