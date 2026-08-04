# Conduit / Summoner — Core Implementation Context

> Implementation handoff for a separate ChatGPT design session. This document describes the current code, its cross-system behavior, and its known temporary seams. It deliberately does not recommend a class redesign or theorycraft a replacement.

## 1. Scope and status

The player-facing class is named **Conduit**. Internally, nearly every identifier still calls it **summoner**:

- skill root: `summoner-root`
- combat archetype: `summoner`
- runtime player component: `summonsMinions`
- class passive namespace: `summoner.*`
- server implementation directory: `server/src/systems/classes/archetypes/summoner/`

The class is explicitly feature-incomplete and is hidden from production playtests by default. It is enabled automatically in development. Production requires both sides to opt in:

- client: `VITE_ENABLE_CONDUIT=true`
- server: `CONDUIT_ENABLED=true`

The server rejects acquiring `summoner-root` when disabled. Existing characters are not migrated or stripped merely because the flag is off; persisted skill state can still reconstruct the archetype and its runtime components.

This document treats the implementation as temporary. Where code comments, authored data, and runtime behavior disagree, runtime behavior is described as authoritative and the discrepancy is called out.

## 2. Executive implementation summary

Conduit is not implemented as a conventional attacking player with cosmetic pets. It is implemented as a non-attacking player that owns several server-authoritative minion ECS entities.

The defining proxy contract is:

1. Selecting the summoner archetype attaches `summonsMinions` and `cannotAttack` to the player.
2. The summoner system creates, synchronizes, commands, moves, and respawns minion entities.
3. A minion's AI chooses a monster and decides when its own attack cooldown is ready.
4. The minion then calls the normal **player attack pipeline**, passing the owner as the attacker and the minion as `aggroSource`.
5. Damage, passives, on-hit listeners, kill credit, rewards, and combat tracking mostly see a player attack by the owner.
6. retaliation, visuals/log attribution, minion position, target selection, and attack cadence still see the physical minion.

That split is the source of most integration complexity. There are effectively three identities in play:

| Concern | Identity used today |
|---|---|
| base attack stat and most attacker passives | owner player |
| combat-pipeline `attacker` / `attackerType` | owner / `player` |
| target choice and range check | minion |
| attack cooldown | minion |
| retaliation target | minion |
| hit origin and world-log source actor | minion when resolvable |
| kill credit, rewards, contribution | owner player |
| active ability storage and cooldowns | owner player |
| owner combat/rune target | owner player, often absent |

The class therefore benefits automatically from generic player attack hooks, but systems that inspect the player's own target, aggro, attack timer, position, or cast state frequently do not describe what the minions are doing.

## 3. Runtime entity model

### 3.1 Player markers and state

Stat recalculation returns `cannotAttack: true` whenever `usesSkills.combatArchetype === 'summoner'`. The server wrapper materializes this as the presence-only `cannotAttack` component. Direct player combat checks that marker, clears `hasAttackTarget`, and skips normal attacks.

Archetype slice synchronization also attaches `summonsMinions`. Its current shape is a fixed slot model:

```ts
interface SummonsMinions {
  minionIds: string[];
  respawnTimers: number[];
  targetCount: number;
}
```

Each array index is a stable summon slot. The value is either the current minion ID or an empty string. Respawn progress is stored per slot. Resizing the desired army reconciles these arrays.

The player also owns all generic state used by proxied attacks: `dealsDamage`, `performsAttack`, `tracksCombat`, equipment, skill passives, active abilities, runes, and rewards/progression.

### 3.2 Minion entities

Each living summon is a real server ECS entity. Its networked identity is `isMinion`, which includes the owner player ID, slot, and monster-type presentation ID. A minion also has ordinary position, movement, hitbox, health, damage, attack, mitigation, target, status, and combat-tracking components.

`controlsMinion` is server-only AI state. It contains such things as the current target, command state, charge cooldown, and Acid Brood lifetime/detonation state.

Minions are not monsters and are not players. Code that queries only either of those sets will not see them unless it contains an explicit minion path.

### 3.3 Authority, persistence, and lifecycle

The server owns minion existence, stats, targeting, commands, movement, attacks, damage, death, and respawn. Clients send only player intent, including the summon-command position.

Minions and their AI state are ephemeral. Persisted character skill data reconstructs `summonsMinions`, but individual minion IDs, HP, targets, commands, and respawn state are not durable character state. They are recreated at runtime.

All minions are despawned on relevant owner teardown paths such as disconnect/death/reset. Gate transitions relocate active minions to the owner and preserve their current HP ratio rather than persisting them independently. Removing or changing the summoner slice also cleans up the owned entities.

## 4. World tick placement

The ordering matters because Conduit crosses generic systems. The relevant world sequence is:

```text
combat-state update
shield update
rune-derived configuration
all class mechanics
  ...other archetypes...
  summoner tier-3 effects
  summoner base reconciliation and minion AI/attacks
weapon-effect ticking
boss/encounter systems
party follow / traversal / auto-targeting
active-ability firing
active cast advancement/resolution
movement and transitions
monster AI
normal player/monster combat
defensive ticking and ability healing
buff/view synchronization
```

Consequences of that order:

- Minions can attack before active abilities are evaluated for the current tick.
- An armed Technique left from an earlier tick can be consumed by a minion attack during the summoner phase.
- A Technique armed during the current ability phase cannot be consumed until a later attack/tick.
- Rune-derived flags are calculated before summoner AI updates targets.
- Conduit direct combat later clears the owner's `hasAttackTarget`; minion-local targets survive in `controlsMinion`.
- A player cast only suppresses attacks inside normal player combat. Summoner AI runs earlier and does not check `owner.isCastingAbility`, so minions continue attacking during the owner's wind-up.
- Tier-3 summoner effects tick before base summon reconciliation. A newly spawned minion normally begins projecting its tier-3 aura on the next tick.

Within the class registry, summoner is deliberately ticked after the other archetype mechanics.

## 5. Army construction and stat formulas

### 5.1 Desired count

The desired slot count is effectively:

```text
floor((summoner.minion-count, default 3)
      × (summoner.minion-count-mult, default 1))
```

It is clamped to at least one. Stone Sentinel can impose a minimum count. A passive cap is supported if authored.

Count multipliers compose through the shared passive merge semantics. Light starts at double count; Swarm doubles again, producing 12 from the three-minion root. Heavy uses `0.5`, so the base three floors to one.

### 5.2 Type resolution

The runtime selects a presentation/behavior type from an ordered passive check. Current renderable types are:

- `slime`
- `cave-lurker`
- `plains-slime`
- `boar`
- `mud-toad`
- `cliff-hopper`
- `ridge-archer`
- `crag-behemoth`

Not every renderable type currently has an authored node. A resolved type change despawns incompatible existing minions and creates the new type rather than mutating the old entity in place.

### 5.3 Spawn, speed, size, and health

Defaults and current formulas:

```text
respawn = 5000 ms × summoner.minion-respawn-mult

speed = max(180,
            round((owner movement speed + 40)
                  × summoner.minion-speed-mult))

size = max(0.1, summoner.minion-size-mult)

max HP = max(10,
             round(owner max HP
                   × summoner.minion-hp-pct
                   ÷ desired minion count))
```

The HP formula divides the pool across the desired army size. When max HP is resynchronized, living minions retain their HP ratio.

`summoner.minion-hp-mult` is authored on Heavy but is not consumed by the current health formula. Heavy's displayed/expected `1.5` minion-health multiplier therefore has no runtime effect through that key.

Stat-sharing paths can add owner-derived plating and damage reduction to a minion. Guardian currently shares 20% of each.

### 5.4 Attack range and cadence

```text
minion attack range = max(8, summoner.minion-range, default 12)

minion attack cooldown = max(200 ms,
                             summoner.minion-attack-cooldown,
                             default 1000 ms)
```

The minion range also acts as the base radius for several summon auras.

Minion cadence is independent of the owner's `performsAttack.attackCooldown`. Owner attack-speed stats and effects therefore do not normally make minions bite faster. Predator's Howl directly rewrites allied players' attack cooldowns, so it speeds ordinary allied player attacks but does not rewrite minion cooldowns. The Conduit owner can receive the banner status while gaining no direct-attack benefit.

### 5.5 Two competing damage fields

Spawn writes a minion-local attack value:

```text
minion.dealsDamage.attack = owner attack × summoner.minion-damage-pct
```

Normal minion strikes do not use that field as their base damage. They call `runPlayerAttack`, whose effective base is:

```text
owner.dealsDamage.attack × summoner.minion-damage-mult
```

The result then travels through the player attack pipeline and monster mitigation. This means:

- root `summoner.minion-damage-pct` is written onto the entity but is not the operative normal-strike multiplier;
- Light and Heavy's `summoner.minion-damage-mult` do affect normal strikes;
- any UI, inspection, or future subsystem reading only `minion.dealsDamage.attack` can disagree with actual combat damage.

This is a current implementation mismatch, not a recommended contract.

## 6. Movement, targeting, leash, and commands

### 6.1 Leash

The general leash is:

```text
max(40, owner attack range × summoner.minion-leash-mult)
```

The root multiplier defaults to `2`. Far-range nodes expand the owner's attack range and therefore indirectly expand the leash. Stone Sentinel has its own tether behavior.

### 6.2 Autonomous targeting

Mobile minions select nearby valid monsters within the owner's leash, move into their own range, attack on their own cooldown, and otherwise return to a slot-dependent follow ring around the owner.

Swarm changes selection so minions spread across targets rather than all taking the same nearest target. Sentinels use stationary placement and their own extended range rules.

The owner's auto-target priority is not the minion AI's target selector. Auto-targeting deliberately continues moving `CannotAttack` players toward enemies so a Conduit can enter engagement distance, but it does not turn the owner into an attacker. Minions still choose through summoner AI. A rune-prioritized monster can therefore influence where the owner walks without being a hard guarantee that every minion selects that exact target.

### 6.3 Manual command channel

While the client's hold-still input is active, a click sends `player:commandSummons` instead of a normal move. The server interprets the clicked point as:

- a focus command if it resolves to a valid monster; or
- a ground move command otherwise.

Ground destinations are clamped to the leash. Focus is cleared if the monster becomes invalid. A group move clears after all applicable mobile minions arrive. Stationary sentinel behavior is handled separately.

The command is server-only transient state and is neither persisted nor networked as a durable component.

## 7. The proxy attack pipeline

### 7.1 What a minion strike actually calls

When a minion is ready, AI calls approximately:

```ts
runPlayerAttack(world, owner, target, now, {
  aggroSource: { id: minionId, kind: 'minion' },
  // optional minion-specific metadata, e.g. boarCharge
});
```

`CannotAttack` is not checked inside `runPlayerAttack`; callers enforce it for normal player swings. Summoner AI is therefore allowed to use the function even though its owner carries the marker.

### 7.2 What is inherited from the owner

The combat context uses the owner as `ctx.attacker` and `attackerType: 'player'`. As a result, a minion strike can participate in generic player hooks for:

- owner attack stat and generic damage multipliers;
- equipment and weapon listeners that key off a player attacker;
- on-hit damage and player passives;
- armed active-ability riders;
- attacker-side counters/resources stored on `tracksCombat`;
- debuff application that reads owner passives;
- kill hooks, credit, contribution, rewards, and progression;
- marking the owner engaged in combat.

Class-specific hooks that require another archetype component still will not exist on a pure Conduit. However, any generic hook that assumes one player attack cadence may be triggered once per minion strike. More minions can therefore accelerate shared owner counters or proc frequency unless the hook explicitly distinguishes `metadata.aggroSource.kind === 'minion'`.

### 7.3 What remains minion-specific

The minion chooses the target, supplies the physical source, owns the cooldown, and becomes the retaliation target. Hit events and world logs can resolve the source actor to the minion. Monster aggro is set to the minion rather than the owner.

This is why owner-facing queries can be blind to active combat: monsters may be attacking minions, and the owner may have no `hasAttackTarget`, even though the owner's combat pipeline and progression are receiving the strikes and kills.

### 7.4 Evasion, death, and rewards

Minion strikes go through normal target evasion and mitigation. Chaotic weapon misses and related owner combat counters are still evaluated through the owner pipeline. A successful kill credits the owner. Retaliation is directed at the minion source.

Minion death itself is generally detected and finalized on the next summoner tick. That pass triggers applicable death effects, clears the slot, removes the entity, and starts its respawn timer.

## 8. Incoming damage and defensive interactions

### 8.1 Normal monster attacks on minions

Monsters can acquire minions as aggro targets. Normal monster attacks against them use the minion's plating and damage reduction. Minions have their own HP and can die independently.

### 8.2 Root damage sponge

The root authors 50% damage redirection. Close range adds 10 percentage points, producing 60% with the current additive passive merge.

The sponge is an `onDamageTaken` listener for attacks whose defender is the owner player. It runs late in registered defense order, after shields/absorption, general defense systems, debuff/vulnerability handling, and ability Guard reduction. It selects a random living owned minion, removes the percentage from the remaining player damage, and subtracts that amount directly from minion HP.

Redirected damage does **not** re-enter the combat pipeline. It therefore does not use the selected minion's plating/DR, does not trigger normal minion-defender hooks, and is not an attack attributed to the original source. A minimum of one point is redirected when the percentage applies.

### 8.3 Rockslide cover

Rockslide is also a late `onDamageTaken` redirect, registered immediately before the owner's root sponge. It searches all summoner owners for the first living eligible cliff hopper whose aura covers the damaged player. It redirects 30% of the then-current damage as raw hopper HP loss.

It is not party-filtered. Any player in the same node and radius can be protected. Only the first matching hopper returned by world iteration handles a hit. If the victim is also a Conduit with a sponge, the remaining damage can then be redirected again by the owner's sponge. With default percentages the two reductions are sequential, not simply additive.

### 8.4 Active Guards

Guard abilities are owned by and applied to the player. HP-threshold, harmful-debuff, cleanse, heal, and player damage-reduction behavior can operate normally on the Conduit owner.

Important limits:

- aggro-count triggers count monsters targeting the **player**, not owned minions;
- defensive buffs protect the player, not minion entities;
- heals and cleanses target the player unless a class feature explicitly includes minions;
- Bramble-style retaliation responds to hits on the player and does not respond to raw sponge/Rockslide HP subtraction on a minion;
- Guard reduction occurs before Rockslide and the root sponge in the current listener order.

## 9. Active abilities and the pending adapter seam

This is the most important cross-system limitation for the current class.

Active abilities live on the owner. The generic firing context derives:

```text
attackTargetId = owner.hasAttackTarget?.targetId

aggroCount = monsters whose aggro target kind is player
             and whose target ID is this owner

inCombat = owner has a live monster attack target OR aggroCount > 0
```

That model fits a normal attacker. It does not fit a proxy attacker whose direct target is cleared and whose enemies commonly aggro minions.

### 9.1 Current compatibility matrix

| Ability behavior | Current Conduit behavior |
|---|---|
| built-in Technique trigger: `in-combat` | can remain false during minion-only combat because owner target/aggro are absent |
| Technique rune trigger | depends on rune-derived flags, many of which have the same owner-target/owner-aggro blindness |
| armed next-hit Technique | if it manages to arm, the next qualifying minion strike sees the owner as attacker and consumes it |
| Sweep / cleave rider | originates from whichever minion consumes the shared charge; splash is owner credited |
| empower rider | multiplies that one minion strike; one shared charge, not one per minion |
| Expose Weakness rider | the consuming minion hit applies the owner-sourced debuff |
| casted Technique | cannot begin without `owner.hasAttackTarget`; normally unavailable in ordinary minion-only combat |
| reposition / Charge | cannot resolve without the owner's target; if it resolves, it moves the owner, then its strike rider is shared with the next minion hit |
| Guard: HP below / harmful debuff | works from owner state |
| Guard: N enemies aggroed | misses enemies targeting minions |
| Guard effects | affect owner only unless explicitly implemented otherwise |

### 9.2 Shared charge semantics

`hasArmedAbility` is a single owner component. Since every minion attack enters the pipeline as that owner, the first qualifying strike from any minion consumes it. A twelve-minion Swarm does not receive twelve empowered attacks. It receives one owner-level charge, claimed nondeterministically by whichever minion lands first according to tick/world iteration and cooldown readiness.

The hit rider uses the consuming minion's target and hit location. The cooldown is owner-level. This behavior is an incidental result of reusing the player attack pipeline, but it is effective for armed riders once they can be triggered.

### 9.3 Cast semantics

Casted Techniques require a live owner attack target at cast start. They store that target for the wind-up and resolve a direct owner-scaled payload. The payload intentionally does not use the normal on-hit pipeline, though target defenses and rewards still apply through the AoE damage helper.

If a target adapter or transient target allows a Conduit cast to begin, minions continue attacking through the wind-up because summoner AI does not consult `isCastingAbility`. The cast suppresses only the owner's normal combat path, which was already disabled by `CannotAttack`.

### 9.4 Reposition semantics

Reposition Techniques also require the owner's target. They reposition the player, not the army. Mobile minions respond later through leash/follow behavior; fixed sentinels follow their own placement rules. Any optional empowered strike becomes the same single owner-level armed rider described above.

### 9.5 What the pending adapter must bridge, as a statement of current requirements

No implementation of this adapter is present in the inspected code. Without prescribing a design, the current systems expose these integration questions:

- what constitutes Conduit `inCombat` when minions own targets and aggro;
- which minion target, if any, should be exposed as the owner's ability target;
- how target-required casts and repositions obtain a stable target;
- whether an armed Technique is owner-global, assigned to one minion, duplicated, or resolved by another policy;
- whether casts suppress minion attacks during wind-up;
- whether N-aggro and target-state triggers aggregate owner and minion aggro;
- whether ability origin/range/telegraphs are owner-centered or minion-centered;
- which defensive abilities affect only the owner versus the owned army;
- how multi-minion proc frequency interacts with owner-level cooldowns, counters, and resources.

These are not design recommendations; they are the unresolved identity seams that the existing generic ability contract requires somebody to define.

## 10. Runes, autocombat, equipment, and generic skill interactions

### 10.1 Rune-derived state

Rune configuration is updated before minion AI and reads the owner-facing combat model. Conditions tied to the current target, target elite/casting state, owner aggro count, or `in-combat` can be false while minions are fighting. A `before-empowered` condition is inert for baseline Conduit because the owner does not perform ordinary empowered swings.

Target-priority runes steer generic owner autocombat. They do not directly replace summoner AI's nearest/spread/focus selection. Manual summon focus is the explicit hard command path.

### 10.2 Owner stats that clearly matter

- attack: base for proxied minion strikes and several tier-3 damage effects;
- max HP: source for the divided minion HP pool;
- movement speed: source for mobile minion speed;
- attack range: source for leash distance;
- plating and damage reduction: shared by Guardian at authored percentages;
- generic damage modifiers and valid player on-hit hooks: can see proxied attacks.

### 10.3 Owner stats that do not map directly

- owner attack cooldown / attack-speed percentage does not set minion attack cadence;
- owner attack range is a leash input, not automatically every minion's attack range;
- minion-local `dealsDamage.attack` does not currently drive ordinary minion strikes;
- owner defensive buffs do not automatically cover minions;
- owner movement buffs do not automatically rewrite minion speed unless their formula is resynchronized from the owner's live speed or the minion receives its own effect.

### 10.4 Proc-frequency warning

Because the owner combat context is reused for each minion strike, equipment or shared passives that count “player attacks,” hits, crits, or kills may advance per minion. This is not uniformly wrong or right; it is simply the present pipeline behavior. Hooks can distinguish proxy strikes through `ctx.metadata.aggroSource.kind === 'minion'`, but they must opt into doing so.

## 11. Current skill tree

### 11.1 Root

The root grants approximately:

- owner attack `+10`
- owner max HP `+20`
- owner attack range `+150`
- owner movement speed `+5`
- three slimes
- minion damage-pct `1.0` (currently the spawn-local field)
- minion HP share `45%` of owner max HP, divided by count
- five-second respawn
- 12-pixel minion attack/aura range
- one-second minion attack cooldown
- 50% damage sponge
- leash multiplier `2`
- no direct owner attack through `CannotAttack`

### 11.2 Frames

**Light**

- owner speed `+12`
- count multiplier `2`
- operative minion damage multiplier `0.5`
- minion size multiplier `0.5`

This normally yields six small, half-damage minions.

**Medium / Balanced**

- owner max HP `+12`
- no additional summon behavior at the frame itself

**Heavy**

- owner max HP `+25`
- count multiplier `0.5`
- operative minion damage multiplier `2`
- minion speed multiplier `0.65`
- minion size multiplier `2`
- authored minion HP multiplier `1.5`, currently unused

The floor and minimum normally produce one large minion.

### 11.3 Range nodes

**Close** adds owner attack, attack-speed percentage, plating, damage reduction, max HP, shared damage, and another 10 percentage points of sponge, while reducing owner attack range by 40.

**Mid** is a moderate attack/speed/HP/plating package with no unique summon mechanic.

**Far** adds 120 attack range, substantial owner movement speed, and smaller attack/HP/attack-speed bonuses. Its important summon interaction is the larger leash inherited from owner range.

## 12. Tier-3 paths and cross-player effects

The helper named `alliesInNodeWithin` currently returns **every live player in the node within radius**. Party filtering is explicitly deferred. Therefore Conduit auras and saves described as “allies” are generally node-wide proximity effects, not party-only effects.

### 12.1 Light / Cave

All three nodes use `cave-lurker` minions.

**Predator's Howl**

- minion attack/aura range becomes 120;
- each overlapping living minion contributes 5% allied player attack speed, capped at six stacks;
- implementation rewrites each affected player's `performsAttack.attackCooldown` from a stored base and restores it on exit;
- affects nearby players, not minion attack cooldowns;
- multiple owners use the same non-instanced banner effect ID, so overlapping sources can overwrite/restore shared live state rather than stack independently.

**Swarm**

- adds another `2×` count multiplier, so Light typically reaches 12;
- applies an additional additive size reduction from passive merge data;
- increases minion speed;
- spreads minion targets;
- projects Overwhelmed onto monsters: 10% increased damage taken per current attacking minion/player counted for that owner.

Overwhelmed modifies all incoming hits on the affected monster, regardless of who supplies the later damage. It is refreshed from live attacker assignments each tick. The owner's own target contribution is usually absent for Conduit, leaving minion current targets as the practical count.

The effect uses one non-instanced status ID. Multiple Swarm owners can replace each other's projection during iteration rather than contributing isolated stacks.

**Acid Brood**

- lurkers have a 12-second lifetime;
- death from lifetime, combat, or redirected damage detonates once;
- explosion deals 80% of owner attack in an 80-pixel area;
- explosion adds two Corrosion stacks;
- successful minion bites add one stack;
- Corrosion caps at ten, lasts eight seconds, and shreds two plating per stack;
- evaded minion bites do not plant Corrosion.

Corrosion is read in the generic monster-defense path, so other attackers benefit from the plating shred. Wet support is present in the cave listeners, but no current Conduit node authors Wet.

### 12.2 Balanced / Plains

**Grazing Field**

- uses `plains-slime`;
- every two seconds, each slime supplies a 4% max-HP pulse inside its aura;
- out-of-combat healing is doubled;
- each entity is healed at most once per owner pulse even if several slimes overlap;
- nearby players are eligible regardless of party;
- owned minions are eligible, but other summoners' minions are not included by the owner-minion query.

**Trampled Path**

- uses boars with 120 range;
- nearby players receive a 25% movement boon;
- boars have a separate ten-second charge cooldown and charge at 3.5× speed;
- a landed charge stuns for 1.2 seconds;
- evasion prevents the stun.

The movement aura affects player entities, not minions. The charge is metadata on a proxied owner attack, with the boar as physical source.

**Vital Burst**

- uses plains slimes;
- the first applicable slime death in an owner combat window cleanses nearby players and grants three seconds of debuff immunity;
- it does not cleanse minions;
- eligibility is proximity-based across all players, not party-based;
- the per-combat limiter is stored on the owner and resets after the owner's combat-state helper considers the owner out of combat.

The immunity guard is consulted by supported monster mark, slow, anti-heal, ramp, and damage-over-time application paths. Its combat-window logic can inherit the same owner-versus-minion combat-state ambiguity.

### 12.3 Heavy / Mountain

**Stone Sentinel**

- uses stationary `ridge-archer` minions;
- imposes a minimum of two sentinels;
- uses extended 180 range;
- respawns empty slots sequentially at a halved interval;
- tethers placement to the owner;
- monsters in aura move at 65% speed and attack at 1.35× cooldown.

The slow implementation rewrites live monster stats from database base values and later restores those values. It uses a shared effect/flag ID. Overlapping sentinel owners can therefore be order-dependent: one owner's restore can erase live stat changes that another owner still conceptually supplies.

**Rockslide**

- uses `cliff-hopper` minions with 160 aura range;
- redirects 30% of damage from the first covered player/hopper match;
- applies globally to nearby same-node players, not only the owner or party;
- subtracts raw minion HP;
- stacks sequentially with an owner's root sponge according to listener order.

**Mountain Guardian**

- uses one `crag-behemoth`;
- sets minion HP share to a full owner-HP pool before count division;
- uses size `2.5`, speed multiplier `2`, and a 12-second respawn;
- shares 20% owner plating and 20% owner damage reduction;
- every tick, forcibly assigns every monster within the owner's leash to the behemoth.

The taunt overwrites existing monster aggro and is not party-scoped. Multiple Guardians in range are iteration-order dependent because each can replace the previous target on its pass.

## 13. Networking and client presentation

`summonsMinions` is a networked player slice. It exposes slot IDs, respawn timers, and target count. The player view derives:

- desired summon count;
- active count;
- per-slot active/respawning state;
- respawn progress and maximum duration.

Minions have their own network key set: identity, position, hitbox, movement, attack target, health, damage, attack cadence, mitigation, and status. Server-only AI/command state is excluded.

The client combines player slot data with separately received minion views to show per-slot HP and the Summoner mechanic HUD. Rendering switches on the minion monster-type ID.

The owner `cannotAttack` marker itself is server behavior, not part of the player network key list. The client infers summoner interaction from the combat archetype and summon count, notably when routing hold-still clicks to summon commands.

## 14. Known temporary seams and inconsistencies

These are implementation facts that should be kept visible during an overhaul:

1. **Ability target/combat adapter is missing.** Generic ability firing reads owner target and owner aggro, while actual combat is held by minions.
2. **Proxy identity is mixed.** The pipeline attacker is the owner, but cadence, position, target, and retaliation belong to a minion.
3. **Armed Techniques are owner-global.** The first minion to land consumes the one shared charge.
4. **Casts do not suppress minions.** Cast state is checked in normal combat, not summoner AI.
5. **Normal strike damage ignores the spawned damage field.** `minion-damage-pct` populates the entity, while `minion-damage-mult` drives runtime hits.
6. **Heavy minion HP multiplier is unused.** `summoner.minion-hp-mult` is authored but absent from the formula.
7. **Owner attack speed and Howl do not alter minion cadence.** Minions have an independent cooldown.
8. **Runes/autocombat and minion AI do not share a target contract.** Owner steering and minion selection can diverge.
9. **Owner combat-state checks can be blind.** Minion-held target/aggro is not consistently aggregated into owner `inCombat`.
10. **Raw redirects bypass minion defenses and hooks.** Sponge and Rockslide subtract HP directly.
11. **“Ally” means all nearby players today.** Party filtering has not landed in the common query.
12. **Several shared aura/debuff IDs are not source-instanced.** Multiple Conduits can overwrite or restore one another's projected effects.
13. **Guardian taunt is a hard overwrite.** Multiple sources and other aggro mechanics can be order-dependent.
14. **Per-minion attacks can accelerate owner-level procs.** Generic hooks see multiple player attacks unless they inspect minion metadata.
15. **Runtime summon state is ephemeral.** An overhaul that expects persistent individual companions would need a different persistence contract.

## 15. Invariants worth preserving or consciously replacing

This is not a design recommendation list. It is a dependency inventory: changing one item requires auditing its current consumers.

- Server authority over spawn, movement, targeting, damage, death, and commands.
- `summonsMinions` presence as the summoner query/behavior gate.
- `cannotAttack` as the direct-attack suppression gate.
- stable owner slots as the HUD and respawn identity.
- owner credit for rewards and progression.
- explicit minion source for retaliation and presentation.
- cleanup on owner lifecycle and node transitions.
- component/network separation between public minion state and private AI state.
- listener registration through the shared combat bootstrap so live server and bench behavior match.
- cross-player effects currently using same-node proximity rather than party membership.

## 16. Source map

### Shared data and contracts

- `shared/src/data/skillTree/rootsAndFrames.ts` — root, frames, and range nodes
- `shared/src/data/skillTree/t3Summoner.ts` — tier-3 authored nodes
- `shared/src/components/archetypes/summoner/summonsMinions.ts` — owner slot state
- `shared/src/components/archetypes/summoner/isMinion.ts` — network minion identity/types
- `shared/src/components/combat/cannotAttack.ts` — marker contract
- `shared/src/systems/stats.ts` — summoner `cannotAttack` derivation
- `shared/src/protocol/networkedEntity.ts` — player/minion network slices
- `shared/src/protocol/views.ts` — player HUD/view derivation
- `shared/src/protocol/socketEvents.ts` — summon command event
- `shared/src/systems/summonerHud.ts` — HUD slot derivation helpers
- `shared/src/abilities.ts` — active ability definitions and shapes

### Server runtime

- `server/src/ecs/archetypeSliceSync.ts` — `summonsMinions` attachment
- `server/src/ecs/playerEntityFormulas.ts` — `cannotAttack` marker synchronization
- `server/src/world/World.ts` — query sets and tick order
- `server/src/systems/classes/archetypes/summoner/summonerPrototype.ts` — base reconciliation loop
- `server/src/systems/classes/archetypes/summoner/spawn.ts` — entity creation/stat synchronization/lifecycle
- `server/src/systems/classes/archetypes/summoner/ai.ts` — target, movement, cadence, proxy attack
- `server/src/systems/classes/archetypes/summoner/command.ts` — focus/move commands
- `server/src/systems/classes/archetypes/summoner/range.ts` — minion range/aura helpers
- `server/src/systems/classes/archetypes/summoner/statShare.ts` — defensive sharing
- `server/src/systems/classes/archetypes/summoner/damageSponge.ts` — owner-to-minion redirect
- `server/src/systems/classes/archetypes/summoner/sentinelPlacement.ts` — sentinel layout/tether
- `server/src/systems/classes/archetypes/summoner/t3/paths/cave.ts` — Cave behaviors/listeners
- `server/src/systems/classes/archetypes/summoner/t3/paths/plains.ts` — Plains behaviors/listeners
- `server/src/systems/classes/archetypes/summoner/t3/paths/mountain.ts` — Mountain behaviors/listeners
- `server/src/systems/combat/engine/combat.ts` — `runPlayerAttack` and `CannotAttack` behavior
- `server/src/systems/combatBootstrap.ts` — listener registration/order
- `server/src/systems/combat/ai/autoTarget.ts` — Conduit travel targeting
- `server/src/systems/player/abilities/abilityFiring.ts` — owner fire context and triggers
- `server/src/systems/player/abilities/abilityEffects.ts` — armed rider consumption and Guard DR
- `server/src/systems/player/abilities/abilityCasting.ts` — target-required cast lifecycle
- `server/src/systems/world/queries.ts` — current all-player “ally” query
- `server/src/net/playerHandlers.ts` — summon command ingress
- `server/src/env.ts` — server feature flag

### Client

- `client/src/featureFlags.ts` — client feature flag
- `client/src/ui/SkillTreePanel.tsx` — hidden root handling
- `client/src/input/clickToMove.ts` — hold-still summon command routing
- `client/src/hud/mechanics/SummonerMechanic.tsx` — summon HUD presentation
- minion render/view code under `client/src/render/` and scene state synchronization

## 17. Confidence notes

The descriptions above are based on the current source and the existing living current-state document. Statements about exact runtime formulas, listener order, tick order, query scope, and ability consumption are direct code behavior. Statements describing a system as “blind,” “order-dependent,” or a charge as claimed by the first minion are deductions from those explicit loops and shared component identities.

There is currently no dedicated summoner/minion test suite discoverable by filename alongside the active ability tests. The class's broad behavior is therefore documented primarily from implementation tracing rather than a single executable specification. Treat the source map and the temporary-seam list as the audit checklist when the overhaul begins.
