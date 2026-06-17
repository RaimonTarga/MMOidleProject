# Damage Over Time Systems: Current State

This document captures the current implementation of the damage-over-time class
systems and the DoT weapon family as a baseline for future rework.

## Scope

The current code has several DoT-like mechanics:

- The DoT combat archetype, keyed by the player `appliesDots` component and the
  target-side `dot` status effect.
- Monster-applied DoTs, which also use the `dot` status effect but apply to
  players.
- The burn weapon family, which uses distinct status effect ids such as
  `ashbrand-burn` and `rimebrand-burn`.
- Edge of Oblivion corruption, which is a separate weapon DoT and slow effect.
- Other class DoTs such as Hemorrhage and Entropy exist, but are outside this
  baseline except where they share status-effect/mirroring infrastructure.

## Main Files

- `shared/src/components/archetypes/dot/appliesDots.ts`
- `shared/src/components/archetypes/dot/chillsTarget.ts`
- `shared/src/components/combat/statusEffects.ts`
- `shared/src/components/combat/effects.ts`
- `shared/src/components/combat/tracksCombat.ts`
- `shared/src/systems/damage.ts`
- `shared/src/systems/dotElements.ts`
- `shared/src/systems/weaponFamilies.ts`
- `server/src/ecs/archetypeSliceSync.ts`
- `server/src/systems/classes/archetypes/dot/dotPrototype.ts`
- `server/src/systems/classes/archetypes/dot/index.ts`
- `server/src/systems/classes/archetypes/dot/t3/`
- `server/src/systems/combat/damage/weaponEffects.ts`
- `server/src/systems/combat/damage/dotTickEvent.ts`
- `server/src/systems/combat/engine/combatState.ts`
- `server/src/world/World.ts`

## Shared Status Model

DoTs are stored in `TracksCombat.statusEffects` as `StatusEffect` entries. The
status-effect API supports two application modes:

- Stacked effects: one entry per `id`; reapplication increments `stacks` up to
  `maxStacks` and can refresh `remainingMs`.
- Instanced effects: every application creates a separate entry with independent
  timers.

The DoT class and current burn weapons use stacked, non-instanced effects. The
comments still mention Ashbrand-style independent instances, but the runtime burn
family currently passes `instanced: false`.

Tick timers are not globally processed. Each owner system decrements
`effect.data.nextTickIn`, deals damage when it reaches zero, then resets it from
`effect.data.tickIntervalMs`. Duration expiry is global: `updateCombatState()`
runs at the top of each world tick and calls `tickStatusEffectDurations()` for
players and monsters.

Important numeric `data` fields:

- `damagePerStack`
- `nextTickIn`
- `tickIntervalMs`
- `ticksLeft` for finite burst effects
- `totalMs` for UI clocks
- `bypassShield` for monster DoTs that ignore player shields

Status effect `data` is number-only by convention.

## ECS Markers And Queries

Status effects live in `tracksCombat`, but marker components gate efficient
queries:

- `hasDot`: entities with the core `dot` effect.
- `hasAshbrandBurn`: monsters with any burn-family weapon effect.
- `hasVoidCorruption`: monsters with Edge of Oblivion corruption.
- `hasConflagration`, `hasChill`, `hasFrozen`, `hasSmolder`: T3 DoT path effects.

Relevant `World` queries:

- `world.dotPlayers`: live players with `appliesDots`.
- `world.chillingPlayers`: live players with `chillsTarget`.
- `world.dottedMonsters`: monsters with `hasDot`.
- `world.dottedPlayers`: live players with `hasDot`.
- `world.ashbrandMonsters`: monsters with `hasAshbrandBurn`.
- `world.voidCorruptionMonsters`: monsters with `hasVoidCorruption`.

`syncArchetypeSlices()` attaches `appliesDots` when
`usesSkills.combatArchetype === "dot"`. It attaches `chillsTarget` only for DoT
players with the `dot.freezing-cold` passive.

## Tick Order

`World.tick()` currently runs the relevant systems in this order:

1. `updateCombatState()` decrements cooldowns and status durations.
2. `tickAllMechanics()` runs class modules. The DoT module runs
   `updateDotT3()` first, then `updateDotArchetype()`.
3. `updateWeaponEffects()` runs weapon DoT ticks after class DoT ticks.
4. Later systems update monsters, combat, defenses, buffs, HP forecasts, etc.

Combat listeners are registered in `initCombatSystems()`:

1. `initAllMechanics()` registers class listeners, including DoT and DoT T3.
2. `initWeaponEffects()` registers weapon listeners.
3. Defense and debuff listeners register after that.

Registration order matters because combat pipeline listeners run in order.

## Core DoT Class Application

The DoT class listens to `onHit` for player-to-monster attacks in
`initDotArchetype()`.

Guards:

- Attacker must be a player.
- Defender must be a monster.
- `ctx.metadata["dotHandled"]` must not already be set by a T3 path.
- `evadeBlocksDebuffs(ctx)` must be false.
- Attacker must have `appliesDots`.

The base values come from passives, with code defaults:

- `dot.max-stacks`: default `6`
- `dot.conversion-pct`: default `0.40`
- `dot.tick-interval-ms`: default `1000`
- `dot.duration-ms`: default `4500`

The tier 1 subvariants override the important values:

- Light / poison: 8 stacks, 30% conversion.
- Balanced / fire: 6 stacks, 50% conversion.
- Heavy / frost: 3 stacks, 70% conversion.

On hit, the system computes:

```text
damagePerStack =
  round(attacker.attack * convPct / maxStacks * tickIntervalMs / DOT_TICK_MS)
```

`DOT_TICK_MS` is `1000`. This means faster configured tick intervals reduce
per-tick damage so total damage over time stays roughly normalized.

Unless a T3 handler already applied the conversion cut, direct hit damage is
reduced by `convPct`:

```text
ctx.damage = round(ctx.damage * (1 - convPct))
```

Then it applies or refreshes the target's `dot` effect:

- `id: "dot"`
- `maxStacks`
- `instanced: false`
- `refreshable: true`
- `remainingMs: durationMs`
- `sourceId: attacker player id`
- `data.damagePerStack`, `data.nextTickIn`, `data.tickIntervalMs`

The target gets the `hasDot` marker.

## Core DoT Class Ticking

`updateDotArchetype()` handles normal `dot` ticks on monsters. It skips effects
with `data.t3Perm`, because Permafrost has its own tick driver.

For each `world.dottedMonsters` entity:

1. Skip invulnerable monsters.
2. Get the first `dot` effect.
3. If missing, detach `hasDot` when appropriate.
4. Decrement `nextTickIn`.
5. When due, compute damage.
6. Apply Smoldering Ember and Frozen multipliers.
7. Record world log damage as `dot`.
8. Subtract HP and push a `dot-tick` event.
9. If lethal, grant rewards to `sourceId` and remove the monster.

The normal stack damage formula is shared:

```text
if maxStacks > 0:
  round(damagePerStack * sqrt(stacks * maxStacks))
else:
  round(stacks * damagePerStack)
```

At full stacks this equals linear full-stack damage. Below full stacks it is
boosted above linear scaling, which helps DoT builds in short fights.

Eternal Doom uses a separate formula:

```text
full damage for first 8 stacks
50% damage per stack beyond 8
```

The tick event element is derived from the source player's DoT passives via
`dotElementForSource()`: poison, fire, frost, or doom.

## Monster-Applied DoTs

The DoT archetype also registers an `onHit` listener for monster-to-player hits.
Monsters with `MonsterDefinition.dotEffect` apply the same `dot` status id to
players. Boss scripts may override the monster definition with
`scriptsBoss.dotEffectOverride`.

Guards:

- Attacker must be a monster.
- Defender must be a player.
- Monster definition or boss override must provide `dotEffect`.
- `canApplyPlayerDebuff(player)` must allow it.
- `evadeBlocksDebuffs(ctx)` must be false.

Monster DoT fields come from the monster definition:

- `damagePerStack`
- `maxStacks`
- `tickIntervalMs`
- optional `durationMs`, defaulting to `4500`
- optional `bypassShield`
- optional `element`

Player-side ticking happens in `updateDotArchetype()` over
`world.dottedPlayers`.

Player-side DoT damage:

```text
base = computeScaledDotDamage(effect)
dotResist = min(0.9, player.passives["defense.dot-resistance"] ?? 0)
drForDot = player.damageReduction * 0.5
damage = round(base * (1 - drForDot) * (1 - dotResist))
```

Player DoTs bypass plating by identity. They apply half value of normal damage
reduction, then the dedicated `defense.dot-resistance`.

By default player shields absorb DoT damage. A monster DoT can opt out by setting
`bypassShield`, stored as `data.bypassShield = 1`.

If lethal, cheat death gets a chance. Otherwise `world.killPlayer()` receives a
death cause of kind `dot`.

## DoT Class T3 Paths

`initDotT3()` registers before the base DoT class handler. Its `onHit` listener
always applies the conversion cut and sets `ctx.metadata["dotConvApplied"]`.
Individual path handlers may set `ctx.metadata["dotHandled"]` to suppress the
base stack application.

Current path dispatch order:

1. `applyInvigoratingToxins()` always falls through.
2. `tryPoisonExplosion()`
3. `tryEternalDoom()`
4. `tryFanTheFlames()`
5. `tryIgnition()`
6. `trySmolderingEmber()`
7. `tryConflagration()`
8. `tryPermafrost()`
9. `tryRimeshatter()`
10. `tryShatterStrike()`
11. `tryFreezingCold()`
12. `tryGlacialFracture()`

Because the first claiming path returns, overlapping passives would be resolved
by this order.

### Poison T3

Poison Explosion:

- Overrides stack cap to 10.
- Applies normal `dot` stacks.
- At 10 stacks, adds burst direct damage equal to:
  `10 * damagePerStack * 10`.
- Clears the `dot` effect and marker.
- Marks the hit as empowered for client styling and standard empowered AoE.

Eternal Doom:

- Uses `maxStacks: 50` as a safety ceiling.
- Sets `data.isEternalDoom = 1`.
- T3 skill data also sets `dot.tick-interval-ms` to `500`.
- Tick damage uses the Eternal Doom formula rather than `computeScaledDotDamage`.

Invigorating Toxins:

- Adds flat direct hit damage based on current target `dot` stacks:
  `stacks * 2`.
- Falls through to base stack application.
- `mirrorDotT3PlayerSlices()` also reduces the player's attack cooldown based on
  current target stacks: 2% per stack, capped at 40%.

Zealot Frenzy:

- Separate `onHit` listener.
- If the target is at max `dot` stacks, applies or refreshes player status
  `dot-frenzy` for 6000 ms.
- While active, adds flat on-hit damage: `10 * tierMult`.
- `updateFrenzy()` handles the attack-speed portion.

### Fire T3

Fan the Flames:

- Applies 2 stacks per hit.
- Each stack has 50% normal `damagePerStack`.
- At max stacks, does bonus direct damage:
  `maxStacks * damagePerStack * 2`.
- Marks the hit as empowered for styling but suppresses empowered AoE.

Ignition:

- On a fresh target, front-loads all stacks at 60% tick value.
- On a partial target, applies one normal stack.
- At max stacks, undoes the conversion cut so the direct hit lands at full
  damage, and only refreshes the existing burn duration.

Smoldering Ember:

- Applies normal `dot` stacks.
- Mirrors current burn stacks into `dot-smolder`.
- `dot-smolder` increases damage taken by 3% per stack.
- The direct-attack multiplier is applied in an `onDamageTaken` listener.
- DoT tick multipliers are applied in `updateDotArchetype()`.

Conflagration:

- While `dot-conf` is active, normal stacking is suppressed.
- At max stacks, clears normal `dot` and applies `dot-conf`.
- `dot-conf` ticks 10 times every 250 ms.
- Each tick deals `maxStacks * damagePerStack`.
- Ticks are driven by `updateConflagration()`, not the normal `dot` updater.
- Tick events use fire element plus `fx: "conflagration"`.

### Frost T3

Rimeshatter:

- Below max stacks, applies normal `dot` stacks.
- At max stacks, undoes the conversion cut so direct hits land at full damage.
- Keeps existing stacks alive by refreshing duration only.
- Applies the shared `brittle` effect with `drPerStack = 0.08` for 2000 ms.

Shatter Strike:

- Adds flat direct damage per active frost stack:
  `stacks * 10 * tierMult`.
- While below max, applies or refreshes a normal stack.
- At max, intentionally does not refresh duration; stacks tick down naturally.

Permafrost:

- Uses one permanent `dot` stack with `remainingMs = -1`.
- Marks the effect with `data.t3Perm = 1`.
- Each hit increments `data.hits` up to 35.
- `updatePermafrost()` ticks it separately.
- Tick damage is based on the source player's current attack:
  `source.attack * hits * 0.01`, capped at 35% attack.
- Smolder and Frozen multipliers also affect Permafrost ticks.

Freezing Cold:

- Applies normal `dot` stacks plus a `dot-chill` stack.
- Chill max is 9 stacks.
- Each chill stack reduces monster movement speed by 5% and increases attack
  cooldown by 5%.
- At 9 chill stacks, chill is removed and `dot-frozen` is applied for 2000 ms.
- Frozen is a severe slow, not a hard stun: -80% movement speed and +200%
  attack cooldown.
- Frozen also gives +35% damage taken.

Glacial Fracture:

- At max stacks, deals burst direct damage:
  `maxStacks * maxStacks * damagePerStack`.
- Clears the normal `dot`.
- Queues `glacial-fracture` client effect.
- Applies knockback away from the player.
- Then applies a fresh normal stack.

## T3 Mirroring And UI Surface

The class DoT status effects are not sent directly to the client. The server
mirrors selected state into networked slices:

- `appliesDots.targetDotStacks`: current attack target's total `dot` stacks.
- `chillsTarget.targetChillStacks`: current target's chill stacks.
- `hasStatus.activeEffects`: currently includes `dot-frozen` mapped to `freeze`.
- `hasStatus.activeEffectFrames`: frame overlays for Glacial Fracture and
  Permafrost.
- `targetStatus`: mirrored by `mirrorTargetStatus()`.

`composePlayerView()` exposes `targetDotStacks` and `targetChillStacks` to the
HUD. `composeMonsterView()` exposes `activeEffects`, `activeEffectFrames`, and
`targetStatus`.

Damage number styling uses `dot-tick` combat events. The client reads those in
`deltaApplier.ts` before HP-delta rendering and stores an element hint for the
damage number.

## DoT Weapon Family

The burn weapon family is defined in `shared/src/systems/weaponFamilies.ts` as
`BURN_FAMILY`.

Current entries:

| Weapon | Effect id | Conversion | Stacks | Element |
| --- | ---: | ---: | ---: | --- |
| `ashbrand-blade` | `ashbrand-burn` | 30% | 5 | fire |
| `swamp-mirebrand` | `swamp-mirebrand-burn` | 30% | 5 | fire |
| `swamp-blightbrand` | `swamp-blightbrand-burn` | 30% | 5 | fire |
| `swamp-frostbrand` | `swamp-frostbrand-burn` | 45% | 3 | frost |
| `swamp-rimebrand` | `swamp-rimebrand-burn` | 45% | 3 | frost |
| `tundra-glacial-rimebrand` | `rimebrand-burn` | 45% | 3 | frost |
| `volcanic-blightbrand` | `blightbrand-burn` | 30% | 5 | fire |

Shared burn constants:

- `ASHBRAND_TICK_MS = 1000`
- `ASHBRAND_DURATION_MS = 4500`

Recipes for these weapons also include mechanic effects such as
`weapon.dot-conversion-pct` and `weapon.dot-stacks`, but the runtime burn
behavior does not currently read those passives. It checks the equipped weapon
id and uses the hardcoded `BURN_FAMILY` entry.

### Burn Application

`initWeaponEffects()` registers one `onHit` listener per `BURN_FAMILY` entry.

Guards:

- Attacker must be a player.
- Defender must be a monster.
- Equipped weapon id must match the entry.
- `evadeBlocksDebuffs(ctx)` must be false.

On hit:

```text
damagePerStack = round(player.attack * convPct / maxStacks)
ctx.damage = round(ctx.damage * (1 - convPct))
```

Then it applies a stacked status effect with the weapon-specific effect id:

- `maxStacks` from `BURN_FAMILY`
- `instanced: false`
- `refreshable: true`
- `remainingMs: 4500`
- `sourceId: player id`
- `data.damagePerStack`
- `data.nextTickIn = 1000`
- `data.tickIntervalMs = 1000`

It attaches `hasAshbrandBurn` to the monster.

### Burn Ticking

`updateWeaponEffects()` calls `updateBurnEffects()` after class mechanics tick.

`updateBurnEffects()` iterates `world.ashbrandMonsters` and checks every effect id
from `BURN_FAMILY`.

For each active burn effect:

1. Skip invulnerable monsters.
2. Decrement `nextTickIn`.
3. When due, reset `nextTickIn`.
4. Deal `computeScaledDotDamage(effect)`.
5. Record world log damage as `proc`.
6. Subtract HP.
7. Push a `dot-tick` event using the weapon entry element.
8. If lethal, grant rewards and remove the monster.

If a monster has `hasAshbrandBurn` but no burn-family effects remain, the marker
is detached.

Important difference from the class DoT: burn ticks are logged as `proc`, while
class DoT ticks are logged as `dot`.

## Edge Of Oblivion Corruption

Edge of Oblivion is defined near the weapon family constants but is separate from
`BURN_FAMILY`.

On player-to-monster hit with `edge-of-oblivion` equipped:

- Applies `void-corruption`.
- Max stacks: 10.
- Default conversion: 40%.
- Default tick interval: 1000 ms.
- Default duration: 4500 ms.
- Slow per stack: 5%, with movement multiplier clamped elsewhere by consumers.

Unlike burn-family weapons, its conversion, tick interval, and duration read the
player's DoT passives when present:

- `dot.conversion-pct`
- `dot.tick-interval-ms`
- `dot.duration-ms`

Current application does not reduce `ctx.damage` by the conversion amount. It
adds corruption damage and slow on top of the direct hit.

`updateCorruptionEffects()` ticks `world.voidCorruptionMonsters`, deals
`computeScaledDotDamage(effect)`, records damage as `dot`, and removes monsters
on lethal ticks. It currently does not push a `dot-tick` combat event, so it may
not get element-specific floating-number styling.

## Evasion And Miss Semantics

All DoT/debuff application paths checked here early-return on
`evadeBlocksDebuffs(ctx)`, so an evaded hit applies no DoT stacks or related
debuffs.

Chaotic weapon misses are different from evades. The combat guide says chaotic
misses still apply on-hit effects. That means a chaotic miss can still apply DoT
unless it is also blocked by evade logic.

## Client-Facing Effects

DoT damage visualization is event-driven:

- Server emits `world.pushEvent(..., { kind: "dot-tick", element, amount })`.
- Client `deltaApplier.ts` turns that into a damage-number style hint.
- Dedicated `fx` currently supports `conflagration`.

Persistent overlays are mirrored via `hasStatus.activeEffects` and
`activeEffectFrames`, not by sending raw `tracksCombat.statusEffects`.

## Current Friction Points For Rework

- The same `dot` status id is used for player-applied class DoTs and
  monster-applied player DoTs. Context comes from the owning entity and source id.
- The class DoT and burn-family weapons use the same stack damage formula, but
  live in separate tick loops and use separate effect ids.
- Burn weapon recipes declare `weapon.dot-conversion-pct` and
  `weapon.dot-stacks`, but runtime reads hardcoded `BURN_FAMILY` values by weapon
  id.
- Comments in `statusEffects.ts` still describe Ashbrand burns as instanced, but
  current burn weapons are stacked non-instanced effects.
- T3 DoT paths mix several behavior styles: direct damage conversion, stack
  mutation, separate tick drivers, target debuffs, cooldown mutation, and client
  mirroring.
- `updateDotT3()` runs before `updateDotArchetype()`, while weapon burn ticks run
  later in `updateWeaponEffects()`.
- Class DoT lethal ticks and weapon burn lethal ticks use slightly different log
  and event paths.
- Edge of Oblivion is DoT-like but not part of `BURN_FAMILY`; it reads class DoT
  passives and currently does not reduce direct hit damage by conversion.
