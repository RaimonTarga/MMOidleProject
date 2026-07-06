# Biome Identity / Combat Ecology — Current State (audited 2026-06-24)

**Companion to:** `docs/archive/biome-ecology-plan.md` (the program plan).
**Roadmap step:** 12. **Status:** 📋 spec'd, primitives not yet built.

This captures what exists in code today before the Step 12 program touches it. Read source
when it disagrees with this doc.

> **Update 2026-06-28:** monster attack-mode was refactored — `ranged`/`kite` are no longer
> separate booleans but derive from a single `behavior: 'melee' | 'ranged' | 'kiter'` field, and
> mountain chokepoint-holding is now an explicit `holdsChokepoints` flag (was inferred from
> `isRanged`). See `docs/monster-behavior-current-state.md`. Where this doc says "ranged/kite",
> read it as the `behavior` field.

---

## 1. Monster AI loop

`server/src/systems/combat/ai/ai.ts` → `updateMonsters(world, dt, now)` is a single flat
per-monster loop over `world.monsterEntities`. There is **no inter-monster coordination**.

Per monster, each tick:

1. **CC gates** — `isMonsterStunned` halts; `isMonsterKnockedBack` yields position control.
2. **Aggro acquisition** — only when `!hasAggroTarget`: `selectMonsterAggroCandidate` scans
   pull-range candidates. Retaliation aggro (set by the combat system) is preserved.
3. **Target resolve/validate** — `resolveAggroTarget`; drops on node-leave / death / disconnect.
4. **Leash** — past `leashRange` from `spawn` → drop aggro, `state="returning"`, head home.
5. **Engaged** — in-reach + line-of-sight → `attacking` (kiters call `maintainKiteStandoff`);
   else `chasing` (charge burst / kite-ramp speed handling).
6. **Disengaged** — state machine `chasing/attacking → returning → idle → wandering → idle`.
   Wander picks a **random** point within `wanderRadius` of `spawn` after a random idle delay.

State lives in two components:
- `hasAwareness` (`{ state, pullRange, leashRange }`) — **networked** (drives client render of
  idle/chasing/attacking).
- `controlsMonster` (`ControlsMonster`, `shared/src/components/targeting/controlsMonster.ts`) —
  **server-only scratch**: `spawn`, `wanderRadius`, `leashRange`, idle timers, `baseSpeed`,
  `kiteTimer`, charge/ramp accumulators. This is where new per-monster AI scratch belongs.

Tick order (`World.tick`, `server/src/world/World.ts:337`): `updateBossScripts` →
`updateUltimateEncounters` → … → `updateMonsters` (357) → `updateCombat` → … The new
coordination systems slot **before `updateMonsters`** (they set intent that `updateMonsters` reads)
or are folded into it.

## 2. Aggro / targeting

`server/src/systems/combat/ai/monsterTargeting.ts`:
- `selectMonsterAggroCandidate` → `candidatesInPullRange` scans `livePlayersInNode` +
  `minionEntitiesInNode` within `hasAwareness.pullRange` (× `playerDetectionMult(player)` from
  mobility boots — stealth already reduces effective pull). `bestCandidate` picks by
  `targeting.mode` (`closest` | `lowest-hp`).
- **No "call allies" / shared aggro / alert propagation.** Each monster aggros independently.
- `targeting.ignoresTaunts` exists as a hook; taunt system partial.

`setAggroTarget` / `setAttackTarget` (`ai/targeting.ts`) are the only sanctioned mutators.

## 3. Spawning / population

`server/src/systems/world/spawning/index.ts`:
- `createMonster(world, nodeId, typeId, pos)` — builds the entity, sets `controlsMonster.spawn = pos`.
- `spawnMonster(world, nodeId)` — picks **one** random type from the biome pool
  (`biome.monsterPoolByTier[tier]`), tries 15 random positions respecting `MONSTER_MIN_SPAWN_DIST`.
- `ensurePopulation` — tops up to `getMobDensity(nodeId)` one mob at a time.
- Uses `Math.random()` freely — **the world/spawn layer is NOT deterministic** (only combat
  *outcomes* are deterministic: evasion accumulator, cadence counters, etc.). So group spawning
  and patrol-anchor placement may use RNG like the rest of spawning.
- **No group/pack spawning, no patrol-route anchors, no formation placement.**

## 4. Terrain / hazards (already built — do NOT rebuild)

`server/src/systems/world/nodeFeatures.ts` + `NodeFeatureSpec` (`shared/.../world/nodeFeatures.ts`):
- `blocksMovement` → chokepoints / walls (A* routes around them; `resolveObstaclesForNode` is the LoS gate).
- `damage` → positional DoT pools (poison/rot/lava).
- `statusWhileInside` → slow/chill zones.
- Runtime toggle via boss `set-feature-block`. `updateNodeFeatures` ticks them.

Swamp pools, Mountain chokepoints, Volcanic vents = **authoring on this**, not new tech.

## 5. Boss / encounter expression (already built)

- `bossScript` (`BossScript`: phases + repeating; actions incl. `summon`/`spawn-adds`/`morph`/
  `slam`/`enrage`/`shield`…) — `ai/bossScripts.ts`.
- `ultimateEncounter` (`UltimateEncounter`: objective-gated stages, waves, environmental DoT) —
  `ai/ultimateEncounter.ts`.
- Gauntlet dungeon rework (altar / killable guardians / surviving-guardians-empower) designed +
  Mountain pilot — `docs/dungeon-current-state-and-gauntlet-plan.md`. Step 13 scaffolding owns this.
- `target-casting` rune condition exists (telegraphed cast window) for boss tells.

## 6. Networking surface (for telegraphs)

`shared/src/protocol/networkedEntity.ts`:
- `NETWORKED_MONSTER_KEYS` = `isMonster, hasPosition, hasHitbox, isMoving, hasAttackTarget,
  hasHealth, dealsDamage, performsAttack, mitigatesDamage, hasAwareness, hasStatus`.
- Monsters are **ephemeral** (node freeze/thaw) — never persisted. So any new networked monster
  field is runtime-only: **no DB migration**, just allowlist + dev-boot invariant + client render.
- Dev boot runs marker/network invariants — adding a networked component means updating the
  allowlist and passing the invariant (fix the invariant, not the check).

## 7. Existing starter-biome mobs (retrofit targets)

| Biome | Mobs (id) | Notable existing mechanics |
|-------|-----------|----------------------------|
| Plains | `plains-slime`, `boar`, `prairie-wolf`, `stampede-bull`, `savanna-hawk` | bull charge; hawk ranged |
| Forest | `forest-slime`, `wolf`, `ancient-wolf` (chargeOnAggro 3×), `ironwood-golem`, `canopy-sprite` | wolf charge; golem tank; sprite ranged |
| Swamp | `bog-slime`, `mud-toad`, `swamp-hydra`, `bog-witch`, `mire-stalker` | witch caster; hydra; pools via dotEffect |
| Mountain | `cliff-hopper`, `ridge-archer`, `granite-titan`, `stone-eagle`, `peak-archer`/Boulder Thrower | archers ranged; titan tank |
| Cave | `cave-lurker`, `cave-brute`, `giant-spider`, `cave-troll`, `cave-gargoyle` | brute bruiser; gargoyle ranged |

Advanced biomes exist as data sets: Jungle, Desert, Volcano, Tundra, Graveyard, Trench
(`shared/src/data/monsters/*.monsters.ts`, `advancedBiomesB.ts`).

## 8. Net-new for Step 12

Only **coordinated multi-monster AI** + its **telegraphs** are new:
1. **Packs + call-allies** — alpha↔follower grouping, assist, alert propagation / shared aggro.
2. **Fixed patrol routes** — deterministic-path patrol vs random wander.
3. **Swarm convergence** — group spawning + clustering / convergence pressure.
4. **Light telegraphs** — networked hints (alpha indicator, call-allies ping, patrol state) so
   players can read & counter the ecology.

Everything else the biomes need (terrain, hazards, ranged/kite, charge, DoT, boss scripts,
gauntlet) **already exists** and is authored, not engineered.
