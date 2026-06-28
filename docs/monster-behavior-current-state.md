# Monster Behavior & Combat-Mode — Current State

> **🔨 REFACTORED 2026-06-28** — `behavior` is now the single authored source of truth for a
> monster's attack mode (was a vestigial `'melee'`-only literal alongside the real `isRanged`/
> `kite` booleans). Death log now distinguishes ranged kills. Chokepoint-holding is an explicit
> flag instead of being inferred from `isRanged`.

## TL;DR

A monster def authors **one** combat-mode field — `behavior: 'melee' | 'ranged' | 'kiter'` —
and the engine derives the mechanical flags from it via helpers. Ecology *capabilities*
(swarm/pack/patrol/charge/post-holding) stay as **separate, composable, presence-gated** config
blocks — they are NOT folded into `behavior` (a mob can be a ranged patroller, etc.).

## Combat mode (`behavior`)

- **Type + helpers** ([shared/src/data/monsters/behavior.ts](../shared/src/data/monsters/behavior.ts)):
  - `MonsterBehavior = 'melee' | 'ranged' | 'kiter'`
  - `monsterIsRanged(def)` → `behavior !== 'melee'` (ranged + kiter attack from range, no lunge)
  - `monsterKites(def)` → `behavior === 'kiter'` (maintain-distance AI; kiters are always ranged)
- **Authored on** `MonsterDefinition.behavior` ([types.ts](../shared/src/data/monsters/types.ts)).
  The old authored `isRanged?` / `kite?` fields are **removed**. The boss `morph` action keeps its
  own `isRanged`/`kite` fields — that's a runtime stance flip, not authoring.
- **Runtime instance flag** `isMonster.isRanged` still exists (networked, mutable by boss
  `morph`); it's initialized at spawn from `monsterIsRanged(def)`
  ([spawning/index.ts](../server/src/systems/world/spawning/index.ts)). Kiting AI reads
  `monsterKites(def)` (plus the runtime `scriptsBoss.kiteOverride`) in
  [ai.ts](../server/src/systems/combat/ai/ai.ts).
- **Networked + view types** (`IsMonster`, `MonsterView`) are tightened to `MonsterBehavior`.
- **Display** derives from `behavior` everywhere (single source of truth): bestiary "Combat" row,
  map tooltip tags (`RANGED`/`KITER`) and mechanics lines, profile nouns
  ([monsterInfo.ts](../client/src/ui/map/monsterInfo.ts),
  [bestiary.ts](../shared/src/systems/bestiary.ts),
  [bestiaryMechanics.ts](../shared/src/systems/bestiaryMechanics.ts)).

## Death cause distinguishes ranged

`DeathCause` ([shared/src/protocol/death.ts](../shared/src/protocol/death.ts)) gained
`kind: "ranged"` → label **"Ranged attack"** (alongside `melee`/`dot`/`aoe`/`debt`). The killing
blow in [combat.ts](../server/src/systems/combat/engine/combat.ts) picks the kind from the
**live** `monster.isMonster.isRanged` flag, so an archer reads "Ranged attack", a brawler reads
"Melee attack", and a boss that morphed to ranged is correct too. Death overlay + world log
inherit it automatically (both route through `formatDeathCauseLabel`).

## Chokepoint-holding is now an explicit flag

- `MonsterDefinition.holdsChokepoints?: boolean` ([types.ts](../shared/src/data/monsters/types.ts))
  — the "archer guards the pass" tag: the mob spawns ON a terrain chokepoint and holds it (short
  leash + reduced wander) instead of roaming. Previously this was inferred from
  `biome === 'mountain' && isRanged`, which over-broadly pinned kiters too.
- Gating moved to the flag in
  [spawning/index.ts](../server/src/systems/world/spawning/index.ts) (`isChokepointHolder`,
  `mountainHoldSpawnPos`, `assignMountainHoldPost`). Chokepoint geometry
  (`mountainChokepointsForNode`) currently exists only for mountain nodes, so it takes effect
  there today; other biomes can opt in once they define chokepoint terrain.
- **Authored on:** `ridge-archer` (Ridge Archer) + `peak-archer` (Boulder Thrower)
  ([mountain.monsters.ts](../shared/src/data/monsters/mountain.monsters.ts)). Surfaced in the
  tooltip as a `HOLDS` tag + "Holds a chokepoint" line.

## Decisions & open items

- **Composable, not an enum.** Swarm/pack/patrol/charge/ledge-vaulting/post-holding remain
  independent presence-gated blocks; only the mutually-exclusive *attack mode* is the `behavior`
  enum.
- **Kiter spawn change (intentional).** `crag-mortar` (Crag Mortar) + `cliffside-roc` (Cliffside
  Roc) — boulder kiters whose defs say "backs off / KITES" — were previously pinned to posts by
  the `isRanged` inference. They no longer hold posts (no `holdsChokepoints` flag); they spawn as
  mountain wanderers and kite freely. Add the flag back if pinning was intended.
- **Still biome-string-coupled (left deliberately — these select biome terrain/route DATA, not a
  missing flag):** cave patrol brutes pull from shared `CAVE_PATROL_ROUTES`
  ([spawning/index.ts](../server/src/systems/world/spawning/index.ts) `isCavePatrolBrute`); swamp
  pool-edge spawn bias; mountain wander separation ([ai.ts](../server/src/systems/combat/ai/ai.ts)).
  Generalizing these into flags requires also generalizing the per-biome terrain/route data — a
  feature, not a cleanup.
- **Open: ranged-suspect audit.** Several `behavior: 'melee'` mobs have a ranged-looking
  `attackStyle` (fire/frost/magic/void on bears, hounds, brutes, and the desert "magic" bosses).
  These were left as melee (faithful conversion). Review case-by-case whether any should become
  `'ranged'`/`'kiter'` — the desert magic bosses are the most plausible.
