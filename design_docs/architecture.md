# MMO Idle Architecture

This is the standing reference for how the codebase is structured. Read it end-to-end the first time, then use it as a lookup when adding new mechanics.

The architectural axioms that all rules below derive from:

1. **The server is authoritative.** All gameplay outcomes (HP, damage, rewards, progression, persistence) are decided server-side. The client renders what it is told.
2. **Components describe behavior; systems define it.** Component presence on an entity is the contract that says "this behavior applies." A system iterates the components it cares about and implements the behavior.
3. **Compose, do not branch.** Adding a burn effect to a new skill must reuse the DoT system. Adding a shield to a new class must reuse the shield system. New mechanics ship as new components attached to existing systems, not as new systems.
4. **The minimum subset of systems.** Fewer systems means fewer balancing knobs to tune in parallel. A new "system" is a last resort, taken only when no existing system fits.
5. **Verb naming.** Component names are two-word verb phrases (`AppliesDots`, `HasHealth`, `TracksCombat`, `IsMoving`, `UsesCadence`, `ChillsTarget`). The key on `ServerEntity` is the lower-camel form (`appliesDots`, `hasHealth`). The name describes what the entity *does*, not what category it belongs to.

---

## Package boundaries

```mermaid
flowchart LR
  shared["shared/ — contracts, pure formulas, registries"]
  server["server/ — authoritative ECS simulation"]
  client["client/ — thin renderer + input"]
  db["SQLite persistence"]
  proto["Socket.IO transport"]

  shared --> server
  shared --> client
  server --> db
  server --> proto
  proto --> client
  client -->|intent events| proto
```

| Package | Owns | Imports from |
| --- | --- | --- |
| `shared/` | component shapes, pure formulas, protocol DTOs, static databases, registries | nothing in the workspace |
| `server/` | authoritative ECS world, all gameplay systems, persistence | `shared/` |
| `client/` | Phaser rendering, React HUD, input → intent translation | `shared/` |

Hard rules:

- `shared/` must not import from `server/`, `client/`, Phaser, Socket.IO, SQLite, Express, miniplex, or any Node-only API.
- `client/` must not import from `server/`.
- `server/` must not import from `client/`.
- Anything stateful, mutable, or time-dependent lives in `server/`. Anything pure and deterministic that both sides need lives in `shared/`.

---

## What goes in `shared/`

```text
shared/src/
  components/
    core/networkedSlices.ts        ← HasPosition, HasHealth, DealsDamage, ...
    combat/                         ← TracksCombat, StatusEffect, PlayerBuff, ...
    targeting/                      ← HasAttackTarget, HasAggroTarget, ScriptsBoss, ...
    archetypes/
      cadence/                      ← UsesCadence, HasDetonation, HasHemorrhage
      cooldown/                     ← UsesCooldown, IsChanneling, HasOverdrive, HasAlignment, HasEntropy
      dot/                          ← AppliesDots, ChillsTarget, HasDot, HasChill, HasFrozen, HasConflagration, HasAshbrandBurn
      energy/                       ← UsesEnergy, InAcChargePhase, InAcDischarge
      reload/                       ← UsesReload
  protocol/
    delta.ts                        ← EntityDelta, DeltaSnapshot
    networkedEntity.ts              ← NETWORKED_PLAYER_KEYS, NETWORKED_MONSTER_KEYS, NetworkedEntity
    views.ts                        ← composePlayerView, composeMonsterView
    combatEvents.ts, socketEvents.ts
  registries/effects.ts             ← EFFECT_DEFS, EFFECT_BY_ID
  systems/                          ← pure formulas: stats, damage, skills, spatial
  passives.ts                       ← typed PassiveKey union
  skillTree.ts, items.ts, recipeDatabase.ts, monsterDatabase.ts,
  biomeDatabase.ts, world/nodeBiomes.ts
```

Responsibilities:

- **Component interfaces.** Every component shape is declared here, in a small file colocated with the feature it belongs to. Components are data; no logic.
- **Pure formula helpers.** Stat recalculation, damage computation, skill unlock validation, biome XP curves, vector math. Same code runs on the server (for authority) and on the client (for tooltips/previews).
- **Networked slice allowlist.** `NETWORKED_PLAYER_KEYS` / `NETWORKED_MONSTER_KEYS` is the *only* place that decides what components cross the wire.
- **Static databases.** Skill tree, items, recipes, monsters, biomes, effect descriptors, buff IDs.

Forbidden in `shared/`:

- Functions that mutate world state.
- Anything that reads `Date.now()`, randomness, or filesystem.
- Imports from `phaser`, `miniplex`, `socket.io`, `better-sqlite3`, `express`.

---

## ECS model

The server world is a single `miniplex` `World<ServerEntity>`. An entity is just an id with a bag of attached components.

### `ServerEntity` is the universe

`server/src/ecs/entity.ts` lists every possible component key as an optional field. This is the only place that knows the full list — feature modules still own each component's *shape*, but the union of keys lives here so miniplex's typed queries (`world.with('appliesDots', 'tracksCombat')`) can resolve.

```ts
export interface ServerEntity {
  entityId: EntityId;
  hasPosition?: HasPosition;
  hasHealth?: HasHealth;
  tracksCombat?: TracksCombat;
  appliesDots?: AppliesDots;
  hasDot?: HasDot;
  // ... every component lives here as an optional field
}
```

Two derived "shape" types are convenient for systems that always operate on a player or monster:

- `PlayerEntity` — `ServerEntity` narrowed to require `isPlayer`, `hasPosition`, `hasHealth`, `usesSkills`, `tracksCombat`, etc.
- `MonsterEntity` — `ServerEntity` narrowed to require `isMonster`, `controlsMonster`, `hasAwareness`, etc.

These types are populated by canonical queries on `World` (`world.playerEntities`, `world.monsterEntities`), so any code that iterates them is guaranteed the required slices exist.

### Component categories

| Category | Examples | Notes |
| --- | --- | --- |
| **Identity** | `IsPlayer`, `IsMonster` | Presence determines entity kind. |
| **Networked state** | `HasPosition`, `HasHealth`, `DealsDamage`, `PerformsAttack`, `MitigatesDamage`, `HasStatus`, `TracksProgression`, `HoldsInventory`, `UsesSkills` | Allowlisted in `NETWORKED_*_KEYS`; serialized as deltas. |
| **Archetype slices** | `UsesCadence`, `UsesCooldown`, `UsesEnergy`, `UsesReload`, `AppliesDots`, `ChillsTarget` | Networked. Presence gates archetype behavior. |
| **Target / link** | `HasAttackTarget`, `HasAggroTarget` | Presence means "currently has a target." Detach when target is dropped. |
| **Transient state markers** | `IsMoving`, `IsChanneling`, `IsBossEngaged`, `InAcChargePhase`, `InAcDischarge`, `HasEmpoweredAttack` | Presence is the sub-state. No "disabled = true" sentinel. |
| **Status effect markers** | `HasDot`, `HasChill`, `HasFrozen`, `HasSmolder`, `HasConflagration`, `HasDetonation`, `HasHemorrhage`, `HasEntropy`, `HasAshbrandBurn`, `HasAlignment`, `HasOverdrive` | Attached when the matching `statusEffects` entry exists; iterated by tick drivers. |
| **Server-only runtime** | `ControlsMonster` (AI), `HasKnockback`, `ScriptsBoss`, `TracksCombat`, `HoldsShields`, `EvadesHits` | Never networked. |
| **Lookup-only effects** | `plating-shred`, `vulnerability`, energy/cooldown counters | Live inside `tracksCombat.statusEffects`, not as components. Promoted to markers only when a system needs to *iterate* the set. |

**Heuristic for adding a new status effect.** If any tick loop needs to iterate every entity with the effect, add a `hasX` marker (attach on apply, detach in a once-per-tick sweep). If the effect is only read by id from one or two call sites that already have the entity, stay in `tracksCombat.statusEffects`. Stacking semantics, refreshable duration, and `sourceId` tracking always live in `statusEffects` regardless of marker presence.

### Presence is the contract

Behavior is gated by component presence, never by string discriminators:

```ts
if (entity.usesCadence) { ... }          // good
if (entity.combatArchetype === 'cadence') { ... }  // banned

if (entity.isMoving) advanceMotion(...);  // good
if (entity.speed > 0) advanceMotion(...); // banned
```

When behavior starts, attach the component. When behavior stops, detach the component. There is no "zero-duration" or "false-flag" representation of absence:

| Lifecycle | API |
| --- | --- |
| Attach with a value | `attachComponent(world, entity, 'usesCadence', initUsesCadence(...))` |
| Attach a marker (empty value) | `attachMarker(world, entity, 'hasDot')` |
| Detach | `detachComponent(world, entity, 'usesCadence')` |
| Detach a marker when its effect ends | `detachMarkerIfNoEffect(world, entity, 'hasDot', state, 'dot')` |
| Motion | `setEntityMotion(world, entity, target)` / `stopEntity(world, entity)` |
| Targets | `setAttackTarget`, `setAggroTarget` |

All of these automatically mark the slice dirty for delta serialization. Never assign to `entity.someComponent = value` directly for a networked slice — use the helpers above.

### Verb naming taxonomy

Every component name is a two-word verb phrase. The key on `ServerEntity` is the lower-camel form of the same name.

| Verb stem | Meaning | Examples |
| --- | --- | --- |
| `Is*` | identity / sub-state presence | `IsPlayer`, `IsMonster`, `IsMoving`, `IsChanneling`, `IsBossEngaged` |
| `Has*` | possession / active condition | `HasPosition`, `HasHealth`, `HasAttackTarget`, `HasDot`, `HasFrozen`, `HasKnockback` |
| `Uses*` | opted-in archetype with runtime state | `UsesCadence`, `UsesCooldown`, `UsesEnergy`, `UsesReload`, `UsesSkills`, `UsesAutocombat` |
| `Applies*` | applies an effect outward each hit | `AppliesDots` |
| `Tracks*` | accumulates / books long-running state | `TracksCombat`, `TracksProgression`, `TracksEngagement` |
| `Holds*` | container of items / values | `HoldsInventory`, `HoldsShields` |
| `Deals*`, `Performs*`, `Mitigates*`, `Evades*` | role in the damage exchange | `DealsDamage`, `PerformsAttack`, `MitigatesDamage`, `EvadesHits` |
| `Controls*` | server-only behavior owner | `ControlsMonster` |
| `Scripts*` | scripted behavior owner | `ScriptsBoss` |
| `In*` | inside a finite sub-state | `InAcChargePhase`, `InAcDischarge` |
| `Shows*`, `Chills*` | observable side-effect on others | `ShowsSacred`, `ChillsTarget` |

When you introduce a new component, pick the verb that already encodes the behavior. If you find yourself reaching for a noun (`Cadence`, `Burn`), reframe: who does what to whom?

---

## Composability: reusing components across mechanics

This is the most important architectural rule for new feature work.

> A new mechanic attaches existing components to entities that don't have them. It almost never defines a new system.

### Worked example: a "burn-on-crit" weapon

Goal: a weapon that applies a fire-style burn DoT on critical hits, regardless of the wielder's class.

There is no "burn system" — the DoT system already covers it. The procedure is:

1. The DoT system iterates `world.dottedMonsters` (the `hasDot` marker) and ticks damage from `tracksCombat.statusEffects['dot']`.
2. Attach `appliesDots` to the player when the weapon is equipped (in the inventory/equip path).
3. In an `onHit` combat listener registered by the weapon module, call `applyStatusEffect(defender.tracksCombat, { id: 'dot', ... })` and `attachMarker(world, defender, 'hasDot')`.
4. Nothing else changes. The DoT tick loop, expiry, HUD overlay, and combat events all work because the same components are now attached.

`AppliesDots` lives in the DoT archetype folder, but it is not "the DoT class component." It is "the component that says *this entity applies DoT stacks on hit*." Anything that wants that behavior — a class root, a T3 path, a weapon, a buff, a status effect — attaches `AppliesDots`. The DoT system doesn't care where the component came from.

### When to add a new component vs. reuse existing ones

| Need | Action |
| --- | --- |
| New flavor of an existing behavior (a different DoT, a different shield) | Reuse the component, vary the data inside it. |
| Same behavior gated by a new condition | Attach an existing component, gate the attach. |
| A *new behavior* that some entities have and others don't | New component, attached by the system that owns the behavior. |
| A new tick loop that scans all entities for a condition | Stop — add a marker component instead and iterate `world.<marker>Entities`. |

### When to add a new system

Almost never. Add a new system only when:

- The behavior is genuinely periodic and doesn't fit any existing tick (movement, AI, combat, defense, archetype tick, buff sync, broadcast).
- No existing combat-pipeline event (`beforeAttack`, `onAttack`, `onHit`, `onDamageTaken`, `afterHit`, `onKill`) is a fit.
- The behavior cannot be expressed as "attach component X, system Y already handles X."

If you do add a new system, register it through the same patterns existing systems use:

- Archetype-like ticks register through the **mechanic registry** in `server/src/systems/classes/registry.ts`. Don't edit `World.tick()` directly.
- Combat reactions register through `registerCombatListener(...)`.
- Buffs register through `defineBuff(...)` in the owning module's `BUFFS` array, which gets picked up by `syncPlayerBuffs`.

---

## Server: authoritative simulation

```text
server/src/
  ecs/
    world.ts                  ← createEcsWorld()
    entity.ts                 ← ServerEntity (the union of all components)
    dirtyTracker.ts           ← per-entity per-slice dirty bits
    deltaEncoder.ts           ← entity → EntityDelta (add / patch / remove)
    markerHelpers.ts          ← attach/detach component + marker helpers
    dirtyHelpers.ts           ← markSliceDirty / markSliceDetached
    archetypeSliceSync.ts     ← attach/detach archetype slices on class change
    playerEntityFormulas.ts   ← entity-native wrappers for shared formulas
    markerInvariants.ts       ← [marker-invariants] / [network-invariants] dev checks
  world/
    world.ts                  ← World class: queries, tick(), buildNodeDelta()
    nodeRegistry.ts, nodeDelta.ts, monsterLifecycle.ts, playerLifecycle.ts, testRoom.ts
  systems/
    classes/
      registry.ts             ← MODULES list + tickAllMechanics + collectMechanicBuffs
      mechanicModule.ts       ← MechanicModule / defineMechanic
      archetypes/
        cadence/  cooldown/  dot/  energy/  reload/
      shared/                 ← cross-archetype helpers: classActive, debuffs, resources
    combat/
      engine/                 ← combat, combatPipeline, combatState, attackCounter, empoweredAttacks
      ai/                     ← ai, autoTarget, bossScripts, engagement, targeting
      damage/                 ← aoeDamage, knockback, weaponEffects
      buffs/                  ← buffSync, descriptor
    defense/                  ← regen/, shields/, mitigation/, core/
    player/
      economy/                ← inventory, crafting
      progression/            ← skills, rewards, quests
    world/                    ← movement, spawning, transitions, testRoomInteract
  db/                         ← Drizzle + SQLite, component-shaped persistence
  index.ts                    ← Express + Socket.IO + game loop wiring
```

### Tick schedule

`World.tick(dt, now)` runs at 10 Hz and is the only place that orders systems:

```ts
updateCombatState(world, dt);          // decrement durations, statusEffect lifecycle
updateShields(world, dt);
tickAllMechanics(world, dt, now);      // class registry: cooldown → energy → reload → dot → cadence
updateWeaponEffects(world, dt);
updateBossScripts(world, dt);
updateAutoTargets(world);
updateKnockback(world, dt);
updateMovement(world, dt);
updateTransitions(world);
updateMonsters(world, dt, now);
updateCombat(world, dt, now);          // emits combat pipeline events
updateDefensiveSystems(world, dt, now);
syncPlayerBuffs(world);                // populates hasStatus.activeBuffs
```

Each system iterates a narrow miniplex query (`world.dottedMonsters`, `world.cadencePlayers`, …). Archetypes register themselves through the mechanic registry; `World.tick()` itself never grows when an archetype, T3 path, or buff is added.

### Combat pipeline

`combatPipeline.ts` exposes a six-phase mutable event:

```
beforeAttack → onAttack → onHit → onDamageTaken → afterHit → onKill
```

Listeners read/write `CombatContext.damage`, `metadata`, and `cancelled`. The pipeline is the canonical extension point: weapon effects, defense (evasion, shields, hit-to-DoT), archetype hits, and debuff multipliers all register listeners rather than mutating the attack inline. Listener ordering by registration is meaningful — more specific handlers register first and can claim a hit via `ctx.metadata['dotHandled']` (or equivalent flags) so the generic handler skips.

### Networked snapshot

Broadcast runs at 5 Hz. `World.buildNodeDelta(nodeId, dirty, opts)` produces a `DeltaSnapshot`:

```ts
type EntityDelta =
  | { kind: 'add';    netId, entityKind, components }
  | { kind: 'patch';  netId, components, removed? }
  | { kind: 'remove'; netId };
```

Component attach/detach automatically marks the slice dirty; the encoder reads `NETWORKED_PLAYER_KEYS` / `NETWORKED_MONSTER_KEYS` to know what's serializable. Server-only components (`controlsMonster`, `tracksCombat`, `hasKnockback`, `scriptsBoss`, marker components, lookup-only effects) never appear on the wire.

`state:sync` sends a full resync as a `DeltaSnapshot` with `full: true` on connect / reconnect / node transition. `node:delta` carries patches between broadcasts.

### Persistence

`server/src/db/` persists one JSON blob per long-lived player slice: `isPlayer`, `hasPosition`, `hasHealth`, `tracksProgression`, `holdsInventory`, `usesSkills`. Runtime-only slices and derived state (passives, archetype slices, combat state) are rebuilt on attach via `syncArchetypeSlices` + `recalculatePlayerEntityStats`. Save fires on disconnect and every 30 s.

### Buffs

`BuffDescriptor` (in `server/src/systems/combat/buffs/descriptor.ts`) packages everything about a buff:

```ts
defineBuff('cooldown-execution', (ctx) => {
  if (!ctx.player.hasEmpoweredAttack) return null;
  return { id: 'cooldown-execution', stacks: 1, durationPct: 1 };
}, { label: 'EXEC', color: '#ffcc44' });
```

`syncPlayerBuffs` projects every descriptor and writes the result to `hasStatus.activeBuffs`. Adding a buff is one descriptor in the owning module and requires *zero* client changes — `BuffBar.tsx` reads the wire payload and renders.

---

## Client: thin renderer

```text
client/src/
  scenes/GameScene.ts         ← lifecycle, system schedule
  net/
    socket.ts                 ← Socket.IO event registration
    deltaApplier.ts           ← applyDelta(state, snapshot, scene)
    intents.ts                ← outbound socket emits
  render/
    state.ts                  ← per-concern Maps keyed by NetworkId
    sprites.ts shadows.ts labels.ts healthBars.ts cooldownBars.ts
    interpolation.ts effectOverlays.ts combatFx.ts
    players.ts monsters.ts destroy.ts
  fx/                         ← one file per attack style
  input/                      ← clickToMove, autoPath, keyboard, debug
  hud/                        ← React HUD components (BuffBar, StatPanel, ...)
  ui/                         ← React panels (SkillTree, Inventory, Crafting, Map, Quest)
  hudBus.ts                   ← reactive event bus for HUD state
  main.ts                     ← Phaser bootstrap + React mounts
```

### Pipeline

```
Socket.IO inbound → deltaApplier → render state maps → per-frame render systems → Phaser
                  ↘ combat event queue → combatFx dispatcher → Phaser
                  ↘ hudBus.emit → React HUD
input + HUD CustomEvents → intents.ts → Socket.IO outbound
```

God objects are explicitly prohibited. Each render concern owns its own map keyed by `NetworkId`, and an entity exists in a given map iff that concern currently applies — boss decorations only for bosses, debug rings only while debug is toggled. No render module reaches into another module's Phaser handles; each module owns ensure, update, and destroy for its own concern.

`deltaApplier.ts` is the single network seam. It applies `add`/`patch`/`remove` deltas to local `NetworkedEntity` state, composes `PlayerView` / `MonsterView` via shared formulas, calls each render concern's `ensure`/`update`/`destroy`, drains combat events into the FX dispatcher, and publishes the local-player view to `hudBus`.

### Where shared formulas help

The client may import pure formulas from `shared/`:

- Tooltip math (preview stat changes from a skill unlock, equipment swap).
- `composePlayerView` / `composeMonsterView` to assemble HUD view models from networked components.
- Effect descriptors (`EFFECT_DEFS`) so the client knows how to render a server-emitted effect ID.

The client must never compute authoritative values: HP changes, damage, rewards, buffs, progression all come from the wire. There is no client-side prediction.

---

## How to add a new mechanic

A repeatable recipe for the common case.

### 1. Decide what behavior already covers this

Before writing anything, ask: which existing system would handle this if the right component were attached? Burn? → DoT. New buff? → buff descriptor. Shield-on-condition? → defense/shields. New attack timing? → an existing archetype. Most additions never reach step 2.

### 2. If you must add a component

- File: `shared/src/components/<area>/<verbName>.ts`.
- Export the interface `Verbs Object` and an `initVerbsObject(...)` factory.
- Add the lower-camel key to `ServerEntity` in `server/src/ecs/entity.ts`.
- If networked, add it to `NETWORKED_PLAYER_KEYS` / `NETWORKED_MONSTER_KEYS` and to `NetworkedEntity` in `shared/src/protocol/networkedEntity.ts`.
- Re-export from `shared/src/components/index.ts`.
- If this is a marker component (presence-only), add its key to `MarkerKey` in `server/src/ecs/markerHelpers.ts`.

### 3. Attach the component from the right place

- Class root / T1 / T3 unlock → `syncArchetypeSlices` (in `server/src/ecs/archetypeSliceSync.ts`).
- Equipment → the equip / unequip path in `server/src/systems/player/economy/inventory.ts`.
- Combat reaction (e.g. burn on hit) → a `registerCombatListener('onHit', ...)` inside the owning module's `init*` function.
- Status effect → `applyStatusEffect(state, {...})` + `attachMarker(world, defender, 'hasX')`.

### 4. Let the existing system do the work

If you reused an existing component (`appliesDots`, `holdsShields`, etc.), there is no system to write. The existing tick already iterates the marker query and reads the status data.

### 5. If you need a buff icon

Add one `defineBuff(...)` descriptor in the owning module. Add the `BuffId` to `shared/src/components/combat/buffs.ts` (`BUFF_IDS`). Done. The HUD picks it up.

### 6. If you need a new visual effect

- Effect descriptor (sprite, frames, attach point): one entry in `shared/src/registries/effects.ts`.
- Combat-event-style FX (slash, gunshot, frost burst): one file in `client/src/fx/` and one entry in the dispatcher in `client/src/render/combatFx.ts`.
- Persistent overlay (chill, freeze, conflagration glow): server emits the effect ID via `hasStatus.activeEffects`; the client overlay system attaches/detaches the sprite.

### 7. Verify

- `pnpm dev:server` boots; the dev-only `[marker-invariants]` and `[network-invariants]` checks print OK.
- The new component appears in component deltas only when attached and disappears when detached.
- The mechanic behaves the same after a disconnect/reconnect (hydration rebuilds runtime slices from persisted state).

---

## Anti-patterns

| Don't | Do |
| --- | --- |
| Add a new flag to `tracksCombat.flags`/`counters`/`strings` to express "is this entity X-y?". | Attach an `IsX` / `HasX` / `UsesX` component. |
| Iterate every player and `if (player.combatArchetype === 'cadence')`. | `for (const e of world.cadencePlayers)`. |
| Write a new tick loop that scans all monsters for a status. | Promote the status to a marker component and iterate `world.<marker>Monsters`. |
| Mutate `entity.someNetworkedSlice.field = value` and assume it will broadcast. | Use `attachComponent`/`detachComponent` (auto dirty) or call `markSliceDirty(world, entity, key)` explicitly. |
| Mirror server runtime state onto a client-only field and read it from React. | Read `PlayerView` (composed from networked components) via `hudBus`. |
| Add a new system for "burn." | Attach `appliesDots` and configure the DoT data. |
| Encode "no target" as `attackTargetId = null`. | Detach `hasAttackTarget`. |
| Encode "stopped" as `motion.x === 0 && motion.y === 0`. | Detach `isMoving`. |
| Name a component `Cadence`, `Burn`, `Stunned`. | Name it `UsesCadence`, `AppliesDots`, `IsStunned`. |
| Branch a system on `combatArchetype` to add an effect. | Attach the existing archetype's component to gain the effect. |

---

## Quick reference: where to put things

| Adding... | Goes in... |
| --- | --- |
| New networked field on every player | new component in `shared/src/components/`, add to `NETWORKED_PLAYER_KEYS` |
| New archetype path (T3) | server module under `systems/classes/archetypes/<class>/`, register listeners in module `init`, add buff descriptors to module `buffs` |
| New status effect (DoT flavor, debuff) | reuse `appliesDots` + `applyStatusEffect`; if iterated, add a marker component |
| New weapon mechanic | combat listener in `systems/combat/damage/weaponEffects.ts`; never a new tick |
| New defense layer | `systems/defense/<category>/`, register via `initDefenseSystems` |
| New monster behavior | data in `MONSTER_DATABASE` (and `bossScript` for bosses); rarely new code |
| New quest | entry in `QUEST_DATABASE`; `registerKillForQuests` already iterates |
| New buff icon | `defineBuff(...)` in the owning module; add ID to `BUFF_IDS` |
| New persistent visual overlay | descriptor in `shared/src/registries/effects.ts`; server emits the ID; client overlay system picks it up |
| New attack-style FX | one file in `client/src/fx/` + one dispatcher entry |