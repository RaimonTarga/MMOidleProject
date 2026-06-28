# Conduit Current State

Objective snapshot of the current Conduit implementation. This is not a balance
assessment or a rework proposal.

## Source Identity And Availability

Conduit is the in-game name for the summoner class. Its root skill id is
`summoner-root`, and choosing it sets `usesSkills.combatArchetype` to
`summoner`.

Conduit is currently gated by feature flags:

- Client: `client/src/featureFlags.ts` exposes `CONDUIT_ENABLED`.
- Server: `server/src/env.ts` exposes `CONDUIT_ENABLED`.
- In dev, Conduit is enabled.
- In production, the client hides it as unavailable unless
  `VITE_ENABLE_CONDUIT=true`, and the server rejects new `summoner-root`
  unlocks unless `CONDUIT_ENABLED=true`.

The skill tree still contains the nodes, and existing Conduit characters keep
their persisted skills/components according to the normal player load path.

## Runtime Model

Conduit is server-authoritative like the rest of combat. The client renders
summons and sends intents, but the server owns spawning, movement, attacks,
damage, respawns, commands, and all aura/status effects.

When a player has the `summoner` combat archetype:

- `syncArchetypeSlices` attaches `summonsMinions`.
- `recalculatePlayerStats` returns `cannotAttack: true`.
- The server wrapper attaches the `CannotAttack` marker, so the player does not
  attack directly.
- `World.summonerPlayers` queries live players with `summonsMinions`.
- The summoner mechanic tick runs `updateSummonerT3` first, then
  `updateSummonerArchetype`.

Minions are full ECS entities with these important slices:

- `isMinion`: networked identity, owner player id, slot index, monster sprite
  type, and size multiplier.
- `controlsMinion`: server-only AI state, follow offset, current target, boar
  charge state, and Acid Brood lifetime state.
- `hasPosition`, `hasHitbox`, `hasHealth`, `dealsDamage`, `performsAttack`,
  `mitigatesDamage`, `tracksCombat`, and `hasStatus`.

Minions are bound to fixed slots on the owner. `summonsMinions.minionIds[slot]`
stores the live minion id or an empty string. `respawnTimers[slot]` counts down
while the slot is empty. The player view projects this into summon slots for the
HUD, including active count and respawn progress.

## Core Summon Loop

Each summoner tick:

1. Reconciles desired slot count from passives.
2. Syncs live minion type, speed, size, max HP, HP regen, hitbox, and owner stat
   sharing.
3. Validates any active summoner command.
4. For each slot, either drives live minion AI, starts/continues respawn, or
   spawns a replacement when the timer reaches zero.

If a live minion changes expected monster type because passives changed, it is
despawned and later respawned with the new type.

Minions are kept in the owner's current node. Gate transitions relocate live
minions to the owner's new node, preserve HP and slot bindings, stop movement,
and clear their attack target.

## Spawn And Stat Formulas

Desired minion count:

- Base: `summoner.minion-count`, defaulting to 3.
- Multiplied by `summoner.minion-count-mult`, defaulting to 1.
- Floored and clamped to at least 1.
- Stone Sentinel ensures at least `summoner.stone-sentinel-count`, default 2.
- `summoner.minion-count-cap`, when present and positive, caps the result.

Respawn:

- Base: `summoner.minion-respawn-ms`, defaulting to 5000 ms.
- Stone Sentinel multiplies this by `summoner.sentinel-respawn-mult`, default
  0.5.
- Stone Sentinel allows only one empty sentinel slot to run a respawn timer at a
  time, so sentries respawn sequentially.

Minion movement:

- Normal minion speed is `(owner speed + 40) * summoner.minion-speed-mult`.
- It is clamped to at least 180.
- Stone Sentinel minions have speed 0.

Minion size:

- `summoner.minion-size-mult`, defaulting to 1.
- Clamped to at least 0.1.
- Used for sprite scale and hitbox sync.

Minion HP:

- `owner max HP * summoner.minion-hp-pct / target slot count`.
- Rounded and clamped to at least 10.
- `summoner.minion-hp-pct` defaults to 1 if absent.
- The authored key `summoner.minion-hp-mult` exists on Heavy Frame, but the
  current HP formula does not read it.

Minion attack range:

- `summoner.minion-range`, defaulting to 12.
- Clamped to at least 8.
- Also used by several T3 buff/heal/cover aura radii.

Minion attack cooldown:

- `summoner.minion-attack-cooldown`, defaulting to 1000 ms.
- Clamped to at least 200 ms.

Minion damage:

- Spawn fills the minion entity's `dealsDamage.attack` as
  `owner attack * summoner.minion-damage-pct`, defaulting to 1.0.
- The normal minion attack AI calls `runPlayerAttack(world, owner, target, ...)`
  with `aggroSource.kind = "minion"`.
- In that path, effective damage is computed from the owner's attack and
  `summoner.minion-damage-mult`, defaulting to 1.0, then target plating and
  damage reduction are applied.

Mountain Guardian owner stat sharing:

- `summoner.guardian-plating-share-pct` copies that fraction of owner plating to
  the minion.
- `summoner.guardian-dr-share-pct` copies that fraction of owner damage
  reduction to the minion.
- This is generic in the code but currently authored by Mountain Guardian.

## Targeting, Leash, And Commands

The default leash radius is:

- `owner attack range * summoner.leash-mult`.
- `summoner.leash-mult` defaults to 2.
- The result is clamped to at least 40 px.

Normal mobile minions:

- Pick a monster in the owner's node within the owner's leash.
- Move toward the target, clamped inside the leash boundary.
- Stop and attack when collision range permits.
- Return to an even-ring follow offset around the owner if no target is valid.

Swarm targeting:

- Used when `summoner.swarm` is present.
- Chooses among in-leash monsters by the fewest already-assigned minions.
- Breaks ties by distance from the minion.
- Keeps the current target while it remains valid.

Summoner commands:

- Client sends `player:commandSummons` from hold-still click input.
- Server applies the command only if the owner has `summonsMinions` and the
  `summoner` combat archetype.
- Clicking a monster creates a `focus` command.
- Clicking the ground creates a `move` command.
- Move commands are clamped to leash.
- Focus commands clear if the target dies, disappears, or leaves the owner's
  node.
- Move commands clear when every live mobile minion arrives within 10 px.
- Stone Sentinel ridge-archers ignore move arrival checks and use their own
  stationary targeting.

## How Minions Take Damage

Minion damage is intentionally not the full player combat pipeline.

Current sources include:

- Conduit damage sponge redirect from damage taken by the owner.
- Rockslide Cover redirect from damage taken by nearby allies.
- Monster AoE/splash damage.
- Monster attacks against minion aggro targets, such as Mountain Guardian taunt.

Damage sponge and Rockslide Cover subtract raw HP from the chosen minion. Monster
attacks against minions use monster attack minus minion plating, then minion
damage reduction. Minion death is observed by the summoner tick, which despawns
the entity and starts the slot respawn flow.

## Skill Tree Nodes

### Tier 0: Class Root

`summoner-root` - Conduit

Player stat effects:

- `attack: 10`
- `maxHp: 20`
- `attackRange: 150`
- `speed: 5`

Mechanic effects:

- `summoner.minion-count: 3`
- `summoner.minion-damage-pct: 1.0`
- `summoner.minion-hp-pct: 0.45`
- `summoner.minion-respawn-ms: 5000`
- `summoner.minion-range: 12`
- `summoner.minion-attack-cooldown: 1000`
- `summoner.damage-sponge-pct: 0.50`
- `summoner.leash-mult: 2.0`

Current result: three baseline slime slots, owner direct attacks disabled,
summon attacks through the owner combat pipeline, and 50% of incoming owner
damage redirects to a random living minion.

### Tier 1: Frames

`summoner-light` - Light Frame

- Player stat effects: `speed: 12`
- Mechanic effects:
  - `summoner.minion-count-mult: 2.0`
  - `summoner.minion-damage-mult: 0.5`
  - `summoner.minion-size-mult: 0.5`

Current result: doubles slot count, halves effective minion damage in the owner
attack path, and halves minion size.

`summoner-balanced` - Medium Frame

- Player stat effects: `maxHp: 12`
- Mechanic effects: none

Current result: keeps the baseline Conduit minion pattern.

`summoner-heavy` - Heavy Frame

- Player stat effects: `maxHp: 25`
- Mechanic effects:
  - `summoner.minion-count-mult: 0.5`
  - `summoner.minion-damage-mult: 2.0`
  - `summoner.minion-speed-mult: 0.65`
  - `summoner.minion-size-mult: 2.0`
  - `summoner.minion-hp-mult: 1.5`

Current result: halves slot count, doubles effective minion damage in the owner
attack path, slows minion movement, doubles minion size, and authors an HP
multiplier key that is not currently read by the minion HP formula.

### Tier 2: Range Nodes

`summoner-range-close` - Close Range

- Player stat effects:
  - `attackRange: -40`
  - `attack: 6`
  - `attackSpeedPct: 0.15`
  - `plating: 5`
  - `damageReduction: 0.06`
  - `maxHp: 25`
- Mechanic effects:
  - `shared.damage-mult: 0.10`
  - `summoner.damage-sponge-pct: 0.10`

Current result: reduces player attack range, adds offensive and defensive stats,
adds shared damage multiplier, and adds 10 percentage points to the authored
damage sponge passive.

`summoner-range-mid` - Mid Range

- Player stat effects:
  - `attack: 4`
  - `attackSpeedPct: 0.10`
  - `maxHp: 18`
  - `plating: 2`
- Mechanic effects: none

Current result: all-around stat growth without Conduit-specific passive changes.

`summoner-range-far` - Far Range

- Player stat effects:
  - `attackRange: 120`
  - `speed: 30`
  - `attack: 2`
  - `maxHp: 8`
  - `attackSpeedPct: 0.05`
- Mechanic effects: none

Current result: increases player range and speed. Because leash radius derives
from owner attack range, this also extends normal minion operating distance.

## Tier 3: Light / Cave Nodes

All three Light T3 nodes replace slimes with `cave-lurker` minions.

`summoner-light-t3-a` - Predator's Howl

Mechanic effects:

- `summoner.minion-as-cave-lurker: 1`
- `summoner.predators-howl: 1`
- `summoner.minion-range: 120`
- `summoner.howl-pct-per-stack: 0.05`
- `summoner.howl-cap: 6`

Current runtime:

- Each living minion projects an attack-speed aura at its minion attack range.
- Allies inside overlapping auras receive Howl stacks, capped by
  `summoner.howl-cap`.
- The code stores each ally's base attack cooldown, then rewrites
  `performsAttack.attackCooldown` to apply the speed bonus.
- When an ally leaves all Howl auras, the base cooldown is restored and the
  status is removed.
- The HUD buff label is `Howl`.

`summoner-light-t3-b` - Swarm

Mechanic effects:

- `summoner.minion-as-cave-lurker: 1`
- `summoner.swarm: 1`
- `summoner.minion-count-mult: 2.0`
- `summoner.minion-size-mult: -0.25`
- `summoner.minion-speed-mult: 1.45`
- `summoner.overwhelmed-pct-per-attacker: 0.10`
- `summoner.overwhelmed-ms: 2000`

Current runtime:

- Adds another minion count multiplier and changes mobile targeting to spread
  assignments across monsters.
- Reprojects `summoner-overwhelmed` on monsters each tick.
- Overwhelmed stacks equal the count of this owner's attackers currently focused
  on that monster.
- On hit, monster damage taken is multiplied by
  `1 + stacks * summoner.overwhelmed-pct-per-attacker`.

`summoner-light-t3-c` - Acid Brood

Mechanic effects:

- `summoner.minion-as-cave-lurker: 1`
- `summoner.acid-brood: 1`
- `summoner.acid-cap: 10`
- `summoner.acid-plating-per-stack: 2`
- `summoner.acid-duration-ms: 8000`
- `summoner.acid-lurker-lifetime-ms: 12000`
- `summoner.acid-explosion-radius: 80`
- `summoner.acid-explosion-damage-pct: 0.80`
- `summoner.acid-explosion-corrosion-stacks: 2`

Current runtime:

- Acid lurkers receive a lifetime timer when spawned.
- When the timer expires, the minion is killed and detonates.
- Minion death by other causes can also detonate once.
- Detonation deals player AoE damage based on owner attack and applies corrosion
  stacks to monsters in the radius.
- Minion hits apply 1 corrosion stack after hit when the hit is not blocked by
  evasion.
- Corrosion reduces effective monster plating through combat metadata before
  damage is calculated.

The cave path also contains support for `summoner-wet`: if a monster has Wet,
the next relevant hit gets extra damage and consumes Wet. No Conduit skill node
in the current tree authors Wet directly.

## Tier 3: Balanced / Plains Nodes

`summoner-balanced-t3-a` - Grazing Field

Mechanic effects:

- `summoner.minion-as-plains-slime: 1`
- `summoner.grazing-field: 1`
- `summoner.grazing-interval-ms: 2000`
- `summoner.grazing-pct: 0.04`
- `summoner.minion-range: 100`
- `summoner.grazing-ooc-mult: 2.0`

Current runtime:

- Living plains slimes pulse healing on a cooldown stored on the owner.
- Each pulse heals allies inside each slime's minion attack range.
- A player or minion can be healed once per pulse.
- Heal amount is a percent of each target's own max HP.
- Out of combat, the heal amount is multiplied by
  `summoner.grazing-ooc-mult`.

`summoner-balanced-t3-b` - Trampled Path

Mechanic effects:

- `summoner.minion-as-boar: 1`
- `summoner.trampled-path: 1`
- `summoner.minion-range: 120`
- `summoner.trample-speed-pct: 0.25`
- `summoner.trample-charge-cd-ms: 10000`
- `summoner.trample-charge-speed-mult: 3.5`
- `summoner.trample-stun-ms: 1200`

Current runtime:

- Living boars project a movement-speed aura to allies inside minion attack
  range.
- The HUD buff label is `Trail`.
- Boars track their own charge cooldowns.
- When a boar is out of attack range and charge is ready, it sprints toward the
  target at base minion speed multiplied by
  `summoner.trample-charge-speed-mult`.
- The next successful boar charge hit sets metadata that applies stun after hit
  if the hit was not blocked by evasion.

`summoner-balanced-t3-c` - Vital Burst

Mechanic effects:

- `summoner.minion-as-plains-slime: 1`
- `summoner.vital-burst: 1`
- `summoner.minion-range: 200`
- `summoner.vital-burst-immunity-ms: 3000`

Current runtime:

- The first plains-slime death during a combat window triggers Vital Burst.
- A counter on the owner prevents additional bursts until the owner leaves
  combat.
- Allies inside the dead slime's minion attack range have debuffs cleansed.
- Cleansed debuffs are effects named `slow`, effects with `damagePerStack`, and
  effects with `isDot: 1`, excluding Conduit Howl, Trail, and debuff immunity.
- Affected allies receive `summoner-debuff-immune`.
- The global player debuff application path checks this immunity before applying
  monster marks, slows, anti-heal, ramp debuffs, and DoT class debuffs.
- The HUD buff label is `Immune`.

## Tier 3: Heavy / Mountain Nodes

`summoner-heavy-t3-a` - Stone Sentinel

Mechanic effects:

- `summoner.minion-as-ridge-archer: 1`
- `summoner.stone-sentinel: 1`
- `summoner.stone-sentinel-count: 2`
- `summoner.sentinel-respawn-mult: 0.5`
- `summoner.minion-range: 180`
- `summoner.sentinel-tether-mult: 2.0`
- `summoner.sentinel-slow-speed-mult: 0.65`
- `summoner.sentinel-slow-atk-mult: 1.35`

Current runtime:

- Minions become stationary ridge-archer sentries.
- Speed is forced to 0.
- Spawn placement tries to put sentries on the combat line so monsters sit near
  the edge of sentry attack range, while avoiding overlap with other sentries.
- If no combat anchor is valid, sentries fall back to the normal follow ring.
- Sentries attack monsters in their own range, not by moving within the owner's
  leash.
- If a sentry gets farther from the owner than
  `owner attack range * summoner.sentinel-tether-mult`, it despawns.
- Living sentries project a monster aura. Monsters inside have movement speed
  and attack cooldown rewritten from their monster database base stats.
- When the aura no longer applies, monster speed and attack cooldown are restored
  from the monster database.

`summoner-heavy-t3-b` - Rockslide Cover

Mechanic effects:

- `summoner.minion-as-cliff-hopper: 1`
- `summoner.rockslide-cover: 1`
- `summoner.rockslide-pct: 0.30`
- `summoner.minion-range: 160`

Current runtime:

- On player damage taken, the server searches all summoner players with
  Rockslide Cover.
- If the damaged player is inside a living cliff-hopper's minion attack range,
  the first matching hopper redirects part of that damage.
- Redirected damage is raw HP subtraction on the hopper.
- This is separate from the owner's personal Conduit damage sponge.

`summoner-heavy-t3-c` - Mountain Guardian

Mechanic effects:

- `summoner.minion-as-crag-behemoth: 1`
- `summoner.mountain-guardian: 1`
- `summoner.minion-count-cap: 1`
- `summoner.minion-hp-pct: 1.0`
- `summoner.minion-size-mult: 2.5`
- `summoner.minion-speed-mult: 2.0`
- `summoner.minion-respawn-ms: 12000`
- `summoner.guardian-plating-share-pct: 0.20`
- `summoner.guardian-dr-share-pct: 0.20`

Current runtime:

- Minion count is capped to one.
- The minion becomes a crag behemoth.
- Its HP formula uses the owner's full max HP because `summoner.minion-hp-pct`
  is set to 1.0 and there is one slot.
- It receives the authored size, speed, and respawn changes.
- It receives 20% of owner plating and 20% of owner damage reduction through
  owner stat sharing.
- Each tick, monsters within the owner's normal Conduit leash are forced to
  aggro the living behemoth.

## Client And HUD Presentation

The player view exposes:

- `summonsMinions`: total slot count.
- `summonActiveCount`: live slot count.
- `summonSlots`: active/respawning state with respawn progress.
- `summonRespawnMaxMs`: max respawn duration for slot progress.

The mechanics HUD displays a `Summons` section for Conduit, showing active count
and the summon slot bar.

Rendering uses `isMinion.monsterTypeId` for sprite lookup. Current possible
minion types are:

- `slime`
- `cave-lurker`
- `plains-slime`
- `boar`
- `mud-toad`
- `cliff-hopper`
- `ridge-archer`
- `crag-behemoth`

## Current File Map

Primary skill data:

- `shared/src/data/skillTree/rootsAndFrames.ts`
- `shared/src/data/skillTree/t3Summoner.ts`

Shared summon/component/view helpers:

- `shared/src/components/archetypes/summoner/summonsMinions.ts`
- `shared/src/components/archetypes/summoner/isMinion.ts`
- `shared/src/systems/summonerHud.ts`
- `shared/src/protocol/views.ts`

Server runtime:

- `server/src/systems/classes/archetypes/summoner/index.ts`
- `server/src/systems/classes/archetypes/summoner/summonerPrototype.ts`
- `server/src/systems/classes/archetypes/summoner/spawn.ts`
- `server/src/systems/classes/archetypes/summoner/ai.ts`
- `server/src/systems/classes/archetypes/summoner/command.ts`
- `server/src/systems/classes/archetypes/summoner/damageSponge.ts`
- `server/src/systems/classes/archetypes/summoner/statShare.ts`
- `server/src/systems/classes/archetypes/summoner/range.ts`
- `server/src/systems/classes/archetypes/summoner/sentinelPlacement.ts`
- `server/src/systems/classes/archetypes/summoner/t3/`

Integration points:

- `server/src/ecs/archetypeSliceSync.ts`
- `server/src/systems/player/progression/skills.ts`
- `shared/src/systems/stats.ts`
- `server/src/systems/combat/engine/combat.ts`
- `client/src/featureFlags.ts`
- `client/src/input/clickToMove.ts`
- `client/src/hud/stat/mechanics.tsx`
