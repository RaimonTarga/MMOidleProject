# MMO Idle — Game Overview & Gameplay Loop

**Status:** Implementation-facing design overview, audited 2026-09-27.

This document describes the intended player-facing shape of MMO Idle without duplicating every implementation detail. For current numbers and runtime behavior, use the current-state documents in `docs/` and the source code. When this overview and the source disagree, the source wins.

## Elevator pitch

MMO Idle is a server-authoritative, browser-based idle RPG. Players build a class, travel through a sparse authored world, fight monsters automatically, collect equipment and progression resources, and advance through increasingly specialized biome and dungeon content. The long-term loop combines passive/automated combat with deliberate build choices: equipment, Runes, class skills, stances, rites, mastery, and tier-gated evolution.

## World structure

- The **Clearing** is the T0 tutorial and safe starting area.
- The authored world currently contains sparse T1–T4 region content. The live registry is the source of truth for node identity, coordinates, encounters, and biome assignment.
- Regions are tiered collections of authored biomes. The current region/biome mapping is documented in [`docs/map-variety-plan.md`](../docs/map-variety-plan.md) and in `shared/src/world/map/regions.ts`.
- Each authored biome/tier can expose a guarded dungeon encounter. Dungeon tuning is defined in `shared/src/config/gameConfig.ts`; it is not a substitute for checking the individual encounter data.

The world is intentionally not described here as a rectangular grid. Its current topology is a sparse registry, so systems that need traversal, encounter, or biome truth should read the node registry and region definitions.

## Core gameplay loop

1. Start in the Clearing and establish the character’s initial class and loadout.
2. Travel to an authored world node or dungeon.
3. Let server-authoritative auto combat resolve encounters while choosing targets, abilities, stance behavior, and movement priorities.
4. Receive combat rewards: equipment, essence, biome experience, and—where the node supports it—catalyst progress.
5. Improve the build through the Forge, equipment upgrades, Runes, class progression, Global Mastery, and authored evolution recipes.
6. Push toward bosses, seals, and later region tiers while adapting the build to each biome’s enemies and hazards.

The current resource and reward contracts are summarized in [`docs/aspects-catalysts-current-state.md`](../docs/aspects-catalysts-current-state.md), [`docs/global-mastery-current-state.md`](../docs/global-mastery-current-state.md), and [`docs/gear-evolution-current-state.md`](../docs/gear-evolution-current-state.md).

## Classes and build identity

The current class system is organized around class-specific root mechanics, shared frame/range choices, and authored specialization skills. The active skill families include cadence, cooldown, reload, energy, damage-over-time, and the summoner/Conduit family. The exact roster, prerequisites, and runtime behavior live in the shared skill data and class systems; the Conduit-specific living summary is [`docs/conduit-current-state.md`](../docs/conduit-current-state.md), while the broader implementation contract is tracked by the source-linked entries in [`docs/README.md`](../docs/README.md).

Abilities, Runes, stances, and rites add further build decisions. Their documentation is descriptive and source-linked rather than a second authoritative data table.

## Equipment and progression

Characters use six equipment slots: weapon, armor, recovery, mobility, core, and relic. Ordinary equipment supports authored upgrade steps; cores and relics follow their own evolution rules. Equipment costs and Global Mastery gates are defined by the shared item-upgrade and recipe data.

Global Mastery is derived from biome progression rather than being an independent spendable XP bar. It gates Rune capacity and ordinary equipment upgrades, while authored recipes gate the larger evolution milestones. See [`docs/global-mastery-current-state.md`](../docs/global-mastery-current-state.md), [`docs/cores-current-state.md`](../docs/cores-current-state.md), and [`docs/relics-current-state.md`](../docs/relics-current-state.md).

## Combat and defenses

The combat model supports physical and magical damage, plating/mitigation, evasion, maximum-hit constraints, damage-over-time resistance, hit-to-dot conversion, recovery, barriers/wards, cleansing, hard control, and movement effects. These are separate runtime mechanics, not interchangeable labels: a class or item’s identity depends on how its complete defensive and offensive package is wired in source.

Combat is simulated on the server at the authoritative logic cadence and broadcast to clients at a lower presentation cadence. Auto combat, traversal, target selection, ability execution, hazards, and rewards therefore need to be evaluated from server systems and telemetry rather than client presentation alone.

## Automation and multiplayer shape

Players can run automated combat and traversal while the server maintains authoritative state. Party and co-op systems add shared encounter context without changing the requirement that individual progression and rewards follow their server-side contracts. Authentication, guest persistence, Discord linking, character management, and admin access are separate concerns; see [`docs/auth-and-characters-current-state.md`](../docs/auth-and-characters-current-state.md).

## Documentation and source authority

- [`docs/README.md`](../docs/README.md) is the documentation command center.
- `docs/*-current-state.md` files summarize verified implementation behavior.
- `design_docs/` holds design authority and proposals; it does not override runtime source.
- `docs/archive/` and `design_docs/archive/` retain historical plans, handoffs, and context with an explicit successor where one exists.
- `shared/` is the first place to inspect for shared data and contracts; `server/` is authoritative for runtime behavior; `client/` is presentation and interaction.
