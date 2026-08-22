# Damage Over Time Systems: Current State

This document captures the current implementation of MMO Idle's damage-over-time
systems after the first rework pass. It is meant as the baseline for the next
phase of work.

## Scope

The codebase now has three explicit DoT contracts:

- Player class DoTs: the DoT combat archetype and its T3 paths.
- Monster DoTs: monster-applied pressure DoTs on players.
- Weapon DoTs: generic DoT-conversion weapons using a reservoir/pool model.

There are also special DoT-like mechanics, such as Hemorrhage and Energy Storm.
Those are not part of the core class or weapon formulas, but player-owned lethal
ticks now participate in the same on-kill hook flow.

## Main Files

- `shared/src/systems/damage.ts`
- `shared/src/systems/dotClassProfile.ts`
- `shared/src/systems/dotElements.ts`
- `shared/src/systems/weaponFamilies.ts`
- `shared/src/components/combat/statusEffects.ts`
- `server/src/systems/classes/archetypes/dot/dotPrototype.ts`
- `server/src/systems/classes/archetypes/dot/t3/`
- `server/src/systems/combat/damage/weaponEffects.ts`
- `server/src/systems/combat/damage/dotTickEvent.ts`
- `server/src/systems/combat/damage/killHooks.ts`
- `client/src/hud/stat/mechanics.tsx`
- `client/src/ui/crafting/itemDisplay.ts`

## Shared Status Model

DoTs are stored in `TracksCombat.statusEffects` as `StatusEffect` entries.
Status effect `data` remains `Record<string, number>`.

Common data fields:

- `damagePerStack`: class, monster, and special stack DoTs.
- `pool`: weapon reservoir DoTs.
- `nextTickIn`: time until the next tick.
- `tickIntervalMs`: reset value after a tick.
- `drainDurationMs`: weapon reservoir drain window.
- `ticksLeft`: finite burst DoTs such as Conflagration.
- `bypassShield`: monster DoTs that ignore player shields.
- `totalMs`: UI clock support for some status effects.

Tick timers are owned by each system. Global combat-state ticking handles status
duration expiry, but individual DoT systems decrement `nextTickIn`, deal damage,
and reset the tick timer.

Tick-driven DoTs that should fire on an exact expiry boundary set
`data.tickOnExpire = 1`. During `updateCombatState()`, an effect that newly
reaches `remainingMs = 0` is kept only if its `nextTickIn` is due within the same
`dt`. The owning DoT system then fires that final tick and removes the effect if
the target survives. This prevents duration/tick-interval pairs such as
`3000 ms / 1500 ms` from losing their final tick.

## Damage Formulas

`shared/src/systems/damage.ts` exposes the active formulas:

- `computeScaledDotDamage(effect)`: front-loaded stack curve for player class
  DoTs and some special player DoTs.
- `computeLinearDotDamage(effect)`: linear monster DoT damage,
  `stacks * damagePerStack`.
- `computeReservoirDotTick(pool, tickIntervalMs, drainDurationMs)`: drains a
  slice of a weapon DoT pool each tick.
- `computeEternalDoomDamage(stacks, basePerStack)`: Eternal Doom's separate
  diminishing formula.

The scaled class curve is:

```text
if maxStacks > 0:
  round(damagePerStack * sqrt(stacks * maxStacks))
else:
  round(stacks * damagePerStack)
```

At full stacks this equals linear full-stack damage. Below full stacks it is
stronger than linear, preserving class DoT pressure in short fights.

## ECS Markers And Queries

Status effects live in `tracksCombat`, while markers gate efficient queries:

- `hasDot`: core `dot` effect on monsters or players.
- `hasAshbrandBurn`: generic burn/reservoir weapon effects.
- `hasVoidCorruption`: Edge of Oblivion corruption.
- `hasConflagration`, `hasChill`, `hasFrozen`, `hasSmolder`: T3 DoT path effects.
- `hasHemorrhage`: Cadence Hemorrhage.

Relevant world queries:

- `world.dotPlayers`
- `world.chillingPlayers`
- `world.dottedMonsters`
- `world.dottedPlayers`
- `world.ashbrandMonsters`
- `world.voidCorruptionMonsters`
- T3-specific marker queries such as `world.conflagrationMonsters`

## Tick Order

`World.tick()` runs the relevant systems in this broad order:

1. `updateCombatState()` decrements cooldowns and status durations.
2. `tickAllMechanics()` runs class modules. The DoT module runs T3 ticks first,
   then core DoT ticks.
3. `updateWeaponEffects()` runs weapon reservoir ticks.
4. Later systems update monsters, combat, defenses, buffs, forecasts, and deltas.

Combat listeners are registered in `initCombatSystems()` with class mechanics
before weapon mechanics. That matters because weapon DoT conversion is intended
to see the remaining direct damage after class DoT conversion.

## Class DoT Profiles

Class DoT configuration lives in `shared/src/systems/dotClassProfile.ts`.

Current profiles:

| Path | Subvariant | Element | Conversion | Max stacks | Tick | Duration | DoT multiplier |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| Poison | `light` | poison | 30% | 8 | 1000 ms | 4500 ms | 1.05x |
| Fire | `balanced` | fire | 50% | 6 | 1500 ms | 5000 ms | 1.10x |
| Frost | `heavy` | frost | 70% | 3 | 2000 ms | 6000 ms | 1.20x |

`resolveDotClassProfile(passives, subVariant)` applies existing passive overrides
for conversion, max stacks, tick interval, and duration. The
`dotMechanicMultiplier` remains profile-owned.

`computeDotClassDamagePerStack(attackBase, profile)` derives class DoT stack
damage from the attack stat, not from final modified hit damage:

```text
round(
  attackBase
  * conversionPct
  * dotMechanicMultiplier
  / maxStacks
  * tickIntervalMs / 1000
)
```

This prevents empowered hits, vulnerability windows, full-HP bonuses, and other
final hit multipliers from snapshotting into class DoT stacks.

## Core Class DoT Application

The DoT class listens to player-to-monster `onHit`.

Guards:

- Attacker is a player.
- Defender is a monster.
- Player has `appliesDots`.
- T3 has not set `ctx.metadata["dotHandled"]`.
- `evadeBlocksDebuffs(ctx)` is false.

On hit:

1. Resolve the class profile.
2. Compute `damagePerStack` from `attacker.dealsDamage.attack`.
3. Unless T3 already applied conversion, reduce direct hit damage by
   `profile.conversionPct`.
4. Apply or refresh the target's `dot` status.
5. Attach `hasDot`.

The status effect stores:

- `id: "dot"`
- `maxStacks: profile.maxStacks`
- `refreshable: true`
- `remainingMs: profile.durationMs`
- `sourceId: player id`
- `data.damagePerStack`
- `data.nextTickIn`
- `data.tickIntervalMs`

## Class DoT Ticking

`updateDotArchetype()` handles normal player-applied `dot` ticks on monsters.
It skips `data.t3Perm` effects, which are handled by Permafrost.

On each due tick:

1. Compute damage with `computeScaledDotDamage()` or Eternal Doom's formula.
2. Apply Smoldering Ember and Frozen multipliers.
3. Record damage as `dot`.
4. Subtract monster HP.
5. Push a `dot-tick` combat event with the source element.
6. If lethal, emit player `onKill`, grant rewards, log the kill, push
   `player-kill`, and remove the monster.

The tick element comes from `dotElementForSource()`: poison, fire, frost, or
doom.

## Monster-Applied DoTs

Monsters with `MonsterDefinition.dotEffect` apply a monster DoT status id to
players. Boss scripts may override this through `scriptsBoss.dotEffectOverride`.
The status id is resolved from `dotEffect.debuffId` as
`monster-dot:<debuffId>`. If `debuffId` is omitted but `label` is authored, the
label is normalized and used as the identity. Effects with the same resolved id
stack together; effects with different ids are separate debuffs and tick
independently. Legacy `dot` player-side effects are still recognized for
compatibility.

Guards:

- Attacker is a monster.
- Defender is a player.
- Monster definition or boss override provides `dotEffect`.
- `canApplyPlayerDebuff(player)` allows it.
- `evadeBlocksDebuffs(ctx)` is false.

Monster DoT fields:

- `damagePerStack`
- `maxStacks`
- `tickIntervalMs`
- optional `durationMs`, defaulting to `4500`
- optional `debuffId`, the mechanical stacking identity
- optional `label`, the player-facing buff/debuff label
- optional `color`, the player-facing icon color
- optional `bypassShield`
- optional `element`

When a monster applies a DoT, `resolveMonsterDotDebuff()` resolves the authored
debuff id and presentation. If the monster does not author these fields, the
server falls back to biome/element/attack-style flavor inference. Current fallback
flavors include Poison for swamp and jungle, Decay for graveyard/necropolis, Burn
for volcanic/fire, Frost for tundra/frost, and Void for abyss/trench/doom.

Status effect data is numeric only, so the server stores `flavorCode` for durable
fallback presentation. The runtime status id carries the string identity.

Player-side monster DoTs now use the linear formula:

```text
base = computeLinearDotDamage(effect)
damage = round(base * (1 - player.damageReduction * 0.5) * (1 - dotResist))
```

Player DoTs bypass plating. Normal damage reduction applies at half value, then
`defense.dot-resistance` applies. Shields absorb DoT damage unless
`data.bypassShield = 1`.

If lethal, cheat death gets a chance. Otherwise `world.killPlayer()` receives a
death cause of kind `dot`.

The player buff bar emits one `debuff-dot` icon per active monster DoT status.
Each entry uses `iconKey = effect.id` so multiple monster DoTs can render and log
separately while sharing the protocol buff family id. The icon shows the resolved
label/color and always displays the current stack count, including one stack.

## T3 DoT Paths

`initDotT3()` registers before the base DoT class handler. Its `onHit` listener
applies class conversion first and sets `ctx.metadata["dotConvApplied"]`.
Individual paths may set `ctx.metadata["dotHandled"]` to suppress base stacking.

Dispatch order:

1. Invigorating Toxins
2. Poison Explosion
3. Eternal Doom
4. Fan the Flames
5. Ignition
6. Smoldering Ember
7. Conflagration
8. Permafrost
9. Rimeshatter
10. Shatter Strike
11. Freezing Cold
12. Glacial Fracture

The T3 paths now use the shared class profile helpers for stack damage where
they participate in the class DoT model.

Special T3 tick drivers:

- `updateConflagration()` handles `dot-conf`.
- `updatePermafrost()` handles permanent `data.t3Perm` frost DoTs.

Both emit player `onKill` before reward/removal when their ticks kill a monster.

## Weapon Reservoir DoTs

Generic DoT-conversion weapons are configured in
`shared/src/systems/weaponFamilies.ts` as `BURN_FAMILY`. Despite the legacy name,
this list now represents weapon reservoir DoTs, including Edge of Oblivion.

Current entries:

| Weapon | Effect id | Conversion | Tick | Drain | Multiplier | Element |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| `ashbrand-blade` | `ashbrand-burn` | 30% | 1000 ms | 4500 ms | 1.15x | fire |
| `swamp-mirebrand` | `swamp-mirebrand-burn` | 30% | 1000 ms | 4500 ms | 1.15x | fire |
| `swamp-blightbrand` | `swamp-blightbrand-burn` | 30% | 1000 ms | 4500 ms | 1.15x | fire |
| `swamp-frostbrand` | `swamp-frostbrand-burn` | 45% | 1000 ms | 4500 ms | 1.15x | frost |
| `swamp-rimebrand` | `swamp-rimebrand-burn` | 45% | 1000 ms | 4500 ms | 1.15x | frost |
| `tundra-glacial-rimebrand` | `rimebrand-burn` | 45% | 1000 ms | 4500 ms | 1.15x | frost |
| `volcanic-blightbrand` | `blightbrand-burn` | 30% | 1000 ms | 4500 ms | 1.15x | fire |
| `edge-of-oblivion` | `void-corruption` | 40% | 1000 ms | 4500 ms | 1.35x | doom |

`weaponDotProfileForWeapon(weaponId)` resolves the equipped weapon's reservoir
profile.

## Weapon Reservoir Application

`initWeaponEffects()` registers one generic player-to-monster `onHit` listener
for reservoir DoTs.

Guards:

- Attacker is a player.
- Defender is a monster.
- Equipped weapon resolves to a weapon DoT profile.
- `evadeBlocksDebuffs(ctx)` is false.

On hit:

1. Resolve the weapon profile.
2. Remove `ctx.metadata["empoweredBonus"]` from the reservoir basis if present.
3. Add `basis * conversionPct * dotMultiplier` to `effect.data.pool`.
4. Apply/refresh the weapon status effect.
5. Attach `hasAshbrandBurn` or `hasVoidCorruption`.
6. Reduce direct hit damage by the weapon conversion percent.

Because class listeners register before weapon listeners, class DoT conversion
happens first. Weapon conversion only sees the remaining direct damage. Generic
weapon reservoirs do not inherit empowered bonus damage.

Weapon reservoir status effects do not stack. Internally they use
`maxStacks: 1`; repeated hits refresh duration and add to `data.pool`.

Weapon status data includes:

- `pool`
- `nextTickIn`
- `tickIntervalMs`
- `drainDurationMs`
- `dotMultiplier`
- optional `slowPerStack`

Edge of Oblivion no longer uses corruption stacks for slow behavior. Movement
code applies an active corruption slow from `slowPerStack`.

## Weapon Reservoir Ticking

`updateWeaponEffects()` ticks reservoir DoTs after class mechanics.

Burn-family reservoir ticks iterate `world.ashbrandMonsters`.
Edge corruption ticks iterate `world.voidCorruptionMonsters`.

On each due tick:

1. Compute tick damage with `computeReservoirDotTick(pool, tickIntervalMs,
   drainDurationMs)`.
2. Subtract the tick damage from `pool`.
3. Record damage.
4. Subtract monster HP.
5. Push a `dot-tick` event with the profile element.
6. If lethal, emit player `onKill`, grant rewards, log the kill, and remove the
   monster.

Weapon reservoir ticks are logged as `weapon-dot`. They emit the same
`dot-tick` visual event with `sourceType: "weapon"`.

## On-Kill Behavior

Direct attack kills already emit `onKill` from the combat pipeline.

Player-owned DoT-like tick kills now also emit `onKill` through
`emitPlayerMonsterOnKill()` before rewards/removal:

- Core class DoT ticks.
- Conflagration ticks.
- Permafrost ticks.
- Weapon reservoir ticks.
- Edge corruption ticks.
- Hemorrhage ticks.
- Energy Storm ticks.

This means on-kill systems such as on-kill Recovery (`defense.recovery-on-kill-pct`)
and mobility kill buffs refresh from player-credited DoT kills.

Monster DoTs that kill players do not emit player `onKill`; they route through
normal player death handling instead.

## UI Surface

The class DoT status effects are not sent directly to the client. The server
mirrors selected state into networked slices:

- `appliesDots.targetDotStacks`
- `chillsTarget.targetChillStacks`
- `hasStatus.activeEffects`
- `hasStatus.activeEffectFrames`
- `targetStatus`

The HUD mechanics area now includes a DoT stat panel for DoT class players. It
shows direct damage percent, DoT conversion percent, profile multiplier, tick
interval, duration, stack damage, max tick estimate, DoT DPS estimate, and target
stacks. These values use the shared class profile helpers.

The DoT stat panel uses the existing hover tooltip framework to explain each
stat.

Inventory/crafting tooltip text for reservoir weapons now describes:

- remaining direct damage conversion,
- reservoir storage multiplier,
- drain timing,
- class DoT conversion happening first,
- empowered bonus damage not increasing reservoir storage,
- Edge corruption slow.

For weapon reservoir debuffs, the target tile's numeric badge is not a stack
count. The server mirrors `round(effect.data.pool)` into the `stacks` field of
`TargetStatusView` for those effect ids, so the badge shows current stored
damage waiting to drain.

Target status metadata includes `void-corruption` as `Corrupt`.

Damage number styling uses `dot-tick` combat events. The client consumes those
events in `deltaApplier.ts` and applies element-specific styling.

`dot-tick` events include:

- `element`: visual damage flavor.
- `amount`: server tick amount, used for event context while HP deltas still
  drive the visible damage number.
- `sourceType`: `class`, `weapon`, `monster`, or `special`.
- optional `fx`: dedicated per-tick animation such as `conflagration`.

Current source-type mapping:

- Core DoT class ticks: `class`.
- DoT class T3 ticks such as Conflagration and Permafrost: `class`.
- Monster DoTs ticking on players: `monster`.
- Weapon reservoir ticks, including Edge corruption: `weapon`.
- Hemorrhage and Energy Storm: `special`.

## Evasion And Miss Semantics

All checked DoT and debuff application paths early-return on
`evadeBlocksDebuffs(ctx)`, so an evaded hit applies no DoT stacks or related
debuffs.

Chaotic weapon misses are different from evades. Chaotic misses can still apply
on-hit effects unless blocked by evade logic.

## Current Friction Points

- The same `dot` status id is still used for player class DoTs and monster DoTs;
  context comes from owning entity and source.
- `BURN_FAMILY` is now a reservoir profile list, but the name is legacy.
- Weapon recipe keys such as `weapon.dot-conversion-pct` and
  `weapon.dot-stacks` remain display mirrors; runtime reservoir values come from
  `weaponFamilies.ts`.
- T3 DoT paths still mix multiple behavior styles: stack mutation, conversion,
  separate tick drivers, target debuffs, cooldown mutation, and client mirroring.
- Class, monster, special, and weapon DoT-like ticks now emit `dot-tick` events
  with explicit source types. Weapon reservoirs log as `weapon-dot`.
- Special DoTs such as Hemorrhage and Energy Storm are still outside the core
  class/weapon formulas, though their lethal ticks now trigger player on-kill
  hooks.
