# Dungeon Current State and Gauntlet Migration Plan

This document summarizes the dungeon system that exists today, then maps the
new gauntlet design in `docs/dungeon-gauntlet-implementation-plan.md` onto the
current repo.

The goal is to replace dungeon nodes as "normal node plus stronger mobs plus a
standing boss" with short altar-started gauntlets:

1. The dungeon node contains an altar and fixed guardians.
2. Guardians can be killed before activation.
3. Activating the altar converts surviving guardians into phase 1.
4. Later fixed phases spawn, if authored for that tier.
5. The boss spawns only after the gauntlet clears.
6. Boss death completes the dungeon and starts a short altar cooldown.

## T1 Dungeon Rule — IMPLEMENTED (pre-encounter + boss)

T1 dungeons deliberately do **not** run the multi-phase gauntlet wave system.
A T1 dungeon is just **pre-encounter + boss fight**:

1. Idle guardians (biome-specific pre-threats) stand around the altar.
2. The player may clear some/all guardians before activating the altar.
3. Activating the altar (the explicit altar/activation flow is unchanged) checks
   which guardians are still alive, then goes **straight to boss awakening** — no
   wave to grind through.
4. Surviving (uncleared) guardians make the boss fight harder via a single,
   data-driven, biome-authored hook. Clearing them first removes the hook.
5. There are **no bonus rewards** for leaving threats alive (killing a guardian
   gives the same normal monster reward whenever you kill it; uncleared guardians
   consumed by an "empower"/"adds"/"hazard" hook simply forfeit their loot).

### The uncleared-threat hook (`DungeonGauntletDef.unclearedThreat`)

`shared/src/dungeons/gauntletTypes.ts` defines `UnclearedThreatEffect` with four
modes; `gauntletDatabase.ts` resolves one per dungeon
(`content.unclearedThreat` → `BIOME_UNCLEARED_THREAT[biome]` → default `join`):

- `join` — surviving guardians keep fighting alongside the boss (default; needs
  no tuning numbers).
- `empower` — the boss gains stats per surviving guardian
  (`empowerPerGuardian`, additive-per-guardian).
- `extra-adds` — extra adds spawn with the boss, scaled by surviving count
  (`extraAddsPerGuardian`, capped by `maxExtraAdds`).
- `hazard` — enables an extra hazard (**placeholder** — concrete biome hazard
  wiring is a later pass; currently only emits a flavor message).

Only `mountain` T1 carries a worked placeholder (`empower`, untuned numbers) so
every concrete code path has at least one consumer; all other biomes default to
`join`. Per-biome identity tuning is deferred.

### Server wiring (`server/src/systems/world/dungeons/gauntlet.ts`)

- `isPreEncounterDungeon(def)` = `def.biomeTier === 1`. T2+ keep the existing
  wave path (`convertSurvivingGuardians` → phases → boss) untouched.
- T1 activation calls `beginPreEncounterBoss`: records `unclearedThreatCount`,
  applies the hook, then `startBossAwakening` immediately.
  - `join`: surviving guardians are re-tagged `tracksDungeon.source =
    "preEncounterThreat"` and tracked in a dedicated `state.preEncounterThreatIds`
    list (kept separate from the wave-gating `activeMonsterIds`, which the
    awakening/boss transitions reset).
  - `empower`/`extra-adds`/`hazard`: surviving guardians are despawned now and
    folded into the boss at `spawnGauntletBoss` via `applyUnclearedThreatToBoss`.
- `preEncounterThreat` monsters **never gate the boss** (`requiredKills` stays 1 =
  the boss), grant only normal rewards, and don't suppress boss respawn. They are
  despawned by the reset/cooldown/freeze paths like any other gauntlet monster.
- The compact `DungeonGauntletView` gained `unclearedThreatMode` /
  `unclearedThreatCount`, and the view's `activeMonsterIds` now also surfaces the
  pre-encounter threats for client display.

### Cleared/respawn/reset semantics

- Cleared guardians do **not** respawn for that boss attempt; they only come back
  via the existing reset paths (idle pre-clear timeout, node wipe, freeze/thaw,
  cooldown completion).
- **Failure = node wipe = reset to initial idle stage.** This already works and
  needs no new code:
  - On player death, `resetGauntletIfNodeWiped` resets the dungeon to idle (and
    respawns guardians) when no live players remain in the node — regardless of
    party membership.
  - `freezeNode` (the node empties) discards the gauntlet runtime via
    `clearDungeonGauntletRuntime`; `thawNode` rebuilds a fresh idle state with
    guardians. So a freeze also returns the dungeon to its initial stage.

### Recent ability/combat compatibility

The pre-encounter rule is independent of the empowered-attack changes: empowered
attacks no longer carry inherent AoE (Sweep is the basic AoE Technique), and the
"trigger an ability before an empowered attack" rune path is untouched. Dungeon
guardians/boss only use the existing monster modifier + `openingStrikeMult` knobs.

### Smoke test

`server/test/dungeonPreEncounter.test.ts` proves uncleared pre-threat state
affects boss start: a cleared baseline boss vs. an empowered boss (HP/atk scale
with surviving count) on mountain T1, plus the `join` path (guardians persist
through boss spawn, never gate the boss, killing one doesn't complete the trial,
boss death starts cooldown).

## Per-biome T1 dungeons (authored)

### Authoring transition: `preEncounter` replaces generated guardian rings

Forward T1 content should use `DungeonGauntletDef.preEncounter`: authored packs,
dens, basins, or other local pre-boss groups. `guardianPhase` remains as a
migration fallback for old/generated guardian rings and for higher-tier phase
scaffolding, but it should not be the authoring surface for new T1 biome exams.

For authored pre-encounters, only the configured uncleared role counts as the
boss-start threat (for example Plains callers, Forest alpha, Swamp keepers).
Leftover weak followers alone do not make the boss start harder.

### Plains T1 - herd swarm / body-pressure (`node-4-3`, Tusked Razorback)

Plains's T1 exam is **concentrated swarm/body pressure**. It is intentionally
not a generic ring of renamed guardians.

**Pre-encounter - three local herds:**
- `preEncounter.id = "plains-herds"` authors three separate local packs around
  the arena.
- Each herd has one `prairie-wolf` caller (`Prairie Caller`) plus weak bodies
  (3 `plains-slime`, 1 `boar`). Members keep a shared `inPack` link so existing
  call-allies pulls the herd together.
- Callers have a small local damage aura (placeholder 1.08x) for nearby herd
  members. Herds have short wander/leash ranges so they read as local groups,
  not one node-wide blob.

**Activation rule (`extra-adds`):**
- Only living callers count as uncleared threats. If callers are killed first,
  leftover weak bodies do not make the boss start harder.
- Uncleared callers are consumed at activation and add capped extra bodies to
  the boss start. There are no extra rewards for leaving callers alive.

**Boss changes (Tusked Razorback):**
- Periodically tops up a small capped slime trickle.
- At 50% HP, calls a larger modest herd (slimes + one boar) and lightly enrages.
- Add counts are capped through `spawn-adds.maxAlive` to avoid uncontrolled
  swarm growth.

**Smoke test:** `server/test/dungeonPlains.test.ts` checks authored herd
spawning, caller-only uncleared counting, clean start after caller clear,
uncleared callers adding boss-start pressure, boss add script wiring, and boss
clear/cooldown.

### Forest T1 — alpha-priority / predator-burst (`node-6-7`, Gnarled Greatbear)

Forest's T1 exam is **target-priority + burst + Brace timing**, deliberately
*not* another Plains-style swarm.

**Current authoring note:** Forest uses `preEncounter.id = "forest-alpha-den"`
(an authored pre-encounter pack). The den is one `wolf` alpha plus two
`young-wolf` followers, but only the alpha is the uncleared threat that affects
boss start; leftover pups alone do not.

**Pre-encounter — one alpha den (not a ring of bodies):**
- `preEncounter.groups[0]` is a single `kind: "pack"` group: the `wolf` pack
  alpha (`leaderName: "Pack Alpha"`) + two authored `young-wolf` followers
  (3 bodies total). Server `spawnPreEncounterPack` (in `gauntlet.ts`) tags every
  member as `idleDungeonGuardian`, links them with a shared `inPack` id (so the
  existing call-allies pounce works), and pins the alpha to its post
  (`localWanderRadius: 0`, reduced `pullRange`) so it reads **territorial /
  stationary near the den**, not like an ambient forest pack.
- Only the **alpha** is buffed (`leaderModifiers`: faster attacks + move speed)
  and renamed — the alpha is the danger; the pups stay modest bodies.
- **Predator howl (damage aura).** The alpha carries `aura: { kind: "damage",
  range: 220, mult: 1.18 }` (the same machinery as the Plains caller): while a
  living alpha is near, its young wolves hit harder. Killing the alpha **first
  defangs the pups** — reinforcing the alpha-priority lesson. Placeholder numbers.
- **Aura buff indicator.** The aura SOURCE (the alpha) is stamped with a
  display-only `pre-encounter-aura` status (`PRE_ENCOUNTER_AURA_EFFECT_ID`) so the
  HUD target frame shows a **"Rally"** buff tile — the readable "this one is
  buffing its allies, kill it first" signal. It rides the existing `targetStatus`
  mirror (no new networked field) and is purely cosmetic; the aura mechanic itself
  rides `TracksDungeon.preEncounterAura`. (The Plains caller shows the same tile.)
- The den anchors across the arena from the altar, so the player can choose to
  clear it first or leave it.

**Activation rule (reuses the shared T1 uncleared-threat hook, mode `join`):**
- Clear the den before activating → clean boss start (no join).
- Leave any den member alive → it joins the boss fight (becomes
  `preEncounterThreat`, persists through boss spawn, never gates the boss, normal
  rewards only — no bonus for leaving it). The uncleared **alpha** is the counted
  threat; leftover pups alone do not make the boss start harder. (`join` is the
  shipped choice; the spec's alternative — empower the boss's first mark/pounce —
  remains an open option, see playtest doc.)

**Boss changes (Gnarled Greatbear) — the Marked-Prey predator, single-target:**
- **Marked Prey → Savage Maul** is now the boss's whole identity, a readable
  two-beat sequence built on existing mechanics:
  1. **Scent of Blood (the mark).** The charged Maul carries
     `chargedAttack.marksTarget: { durationMs: 1800 }`. When the charge **begins**,
     the boss paints the shared "MARKED" debuff (`sun-mark`) on its target — a
     distinct readable tell shown in the player buff bar throughout the wind-up,
     plus the marker pulse. **Cleanse strips it early.**
  2. **The charged pounce.** After the ~1.2s wind-up cast bar (`fx: strong-kick`),
     the Maul lands a ×2.4 single-target spike with a short pounce-shove knockback.
     It resolves through the full player defensive pipeline, so **Brace reduces
     both the hit and the knockback**, and a **stun/freeze in the wind-up
     interrupts** the pounce. The mark is **consumed** when the pounce lands (and
     otherwise expires harmlessly if the cast was interrupted).
  Tests Brace timing + burst, *not* AoE. Placeholder numbers.
- **50% wolf call (reduced — no add spam).** The single 50% phase now calls a
  small `young-wolf` **pair** (count `2`, `maxAlive` `2`) + a light enrage, **once**,
  to split focus (target-priority test). There is no `repeating` add beat — the
  Maul, not the adds, is the threat. Adds despawn on boss death.
- No `aoeAttack` (Forest boss stays single-target by the T1 design).

**Smoke test:** `server/test/dungeonForest.test.ts` — def wiring (den is a pack
with a damage aura; the Maul has `marksTarget`; the 50% call is a capped pair ≤2
with no repeating beat); den spawns (1 alpha + 2 young, alpha is the standout and
carries the "Rally" aura indicator, pups do not); cleared den → clean boss start;
uncleared alpha joins + boss still clearable; and the Maul drives `updateCombat`
to prove it **marks the player at cast-start**, opens a readable cast bar
(`monster-cast-start` "Savage Maul"), deals no damage during the wind-up, then
lands a spike on resolve and **consumes the mark**.

### Swamp T1 - rot basins / attrition-positioning (`node-7-4`, Grave Toadeater)

Swamp's T1 exam is **rot, attrition, and positioning**. It rewards hazard-aware
movement, dot resistance, sustain, and cleanse without making hazard avoidance
mandatory.

**Pre-encounter - three rot basins:**
- `preEncounter.id = "swamp-rot-basins"` authors three basin groups around the
  arena.
- Each basin has one nearby `Rot Keeper` (`mud-toad` with light placeholder
  modifiers). The keeper is the clearable control point for that basin.

**Activation rule (`hazard`):**
- Only living keepers count as uncleared threats.
- Cleared keepers disable their basin for that boss attempt.
- Uncleared keepers seed temporary boss rot pools at boss start. No extra rewards
  are added for leaving keepers alive.

**Boss changes (Grave Toadeater):**
- While the boss is active, dungeon runtime periodically creates capped temporary
  rot pools with short lifetimes. These pools slow and poison players, then expire.
- Temporary pools are server-owned runtime hazards surfaced through
  `DungeonGauntletView.temporaryHazards`; the client draws them with a brighter
  pulsing outline so they are visually distinct from permanent swamp terrain pools.
- The existing 50% beat remains a modest `bog-witch` call + light enrage.

**Smoke test:** `server/test/dungeonSwamp.test.ts` checks basin/keeper spawning,
clean start after keeper clear, uncleared keepers seeding temporary pools,
periodic pool maintenance/expiry, boss script wiring, and boss clear/cooldown.

### Cave T1 — sparse-elite / careful-pulling (`node-3-6`, Obsidian Broodmother)

Cave's T1 exam is **the sparse-elite / careful-pulling fight**: dangerous because
each enemy matters, not because there are many. It is deliberately *not* a swarm
(Plains) and *not* a ring of bodies — three patrolling elite guardians that circle
the altar.

**Pre-encounter — the Deep Watch (3 elites orbiting the altar):**
- `preEncounter.id = "cave-deep-watch"` authors **3 `cave-brute` "Cave Sentinel"
  guardians**, each a solo single-mob "pack" leader (no follower bodies). Total
  live density = 3.
- The sentinels **orbit the altar** on a bespoke absolute patrol ring (300px
  radius, 8 waypoints, `mode: loop`), evenly phase-offset so the three circle the
  altar **separated by 120°** in formation. This `patrolOverride` is applied to
  the leader at spawn and **replaces the brute's open-world patrol loop**, so the
  dungeon route reads differently from the overworld one. `localWanderRadius = 0`:
  the orbit, not random wander, supplies their movement.
- They keep the **high-detection pull range** (240, the Cave overpull-risk
  identity). The 300px orbit sits just outside that 240 pull from the altar
  center, so a careful player can reach the altar between passes; a sloppy
  approach drags a sentinel in.
- Light placeholder guardian buffs (`hpMult 1.2 / atkMult 1.1 / drAdd 0.05`).
  Generous idle leash (760) so an aggroed sentinel can chase across the orbit
  without snapping back mid-fight (active leash widens to the gauntlet default
  once the trial starts).

**Activation rule (shared T1 hook, mode `join`):**
- `unclearedRole = "leader"` — every sentinel is a leader, so **any left alive
  joins the boss fight** (`preEncounterThreat`: persists through boss spawn, never
  gates the boss, normal rewards only — no bonus for leaving them).
- Clear all three before activating → clean boss start.

**Boss changes (Obsidian Broodmother) — single adds, never a swarm:**
- The boss stays a **durable %DR sponge** (high plating/DR, charge, cleave).
- **Repeating beat:** infrequently (`intervalMs 24s`, `initialDelayMs 12s`)
  hatches **one `cave-lurker`**, hard-capped at `maxAlive 1` (one lurker at a
  time, only replaced after it dies).
- **50% beat:** digs in (timed `shield drAdd 0.25`) and hatches **one stronger
  `giant-spider` brood add** (was a 2-spider mini-swarm — reduced to a single
  capped add). Adds despawn on boss death.
- The sparse, predictable single adds keep the fight about grinding a defended
  elite: **Heavy Strike** (single-target burst) and **Second Wind** (sustain) both
  pay off. Numbers are placeholders.

**Smoke test:** `server/test/dungeonCave.test.ts` checks def wiring (tier-1
pre-encounter, no waves, `join`, zero follower bodies, the infrequent capped lurker
beat), Deep Watch spawning (3 brutes, each with the absolute altar-orbit patrol
override + high pull range, sitting on the orbit ring and mutually separated),
clean start after clearing, all 3 uncleared elites joining the boss (and clearing
on boss death), boss clear/cooldown, and — by driving `updateBossScripts` — that
the periodic lurker beat fires and stays capped at one alive (no swarm growth).

## Locked Decisions From Pre-Implementation Review

- Mountain T1 is the prototype dungeon for the first implementation and tuning
  pass.
- Do not keep the old dungeon model alive in production only to support the
  prototype. Use Mountain T1 to prove the code path, then propagate gauntlet
  definitions to the other normal dungeons before removing/gating old dungeon
  spawning for them.
- Idle guardians give regular monster rewards.
- Guardians should be buffed versions of regular biome mobs, not a separate loot
  category.
- Guardians should read visually and textually as guardians:
  - replace their display names with `<biome> guardian`, such as
    `mountain guardian` or `forest guardian`,
  - add a yellow/gold outline or aura,
  - use biome-specific stat modifiers that accentuate the biome profile.
- Cleared idle guardians should not immediately respawn. They should stay
  cleared long enough for players to activate the altar, then reform after the
  idle pre-clear reset timer.
- Gauntlet failure is a node wipe, not a participant death. The dungeon resets
  only when all live players in the node are dead, whether or not they are in
  the initiating party.
- Gauntlet bosses keep current boss rewards and progression credit. Balance can
  be adjusted later.
- The Void Overlord dungeon is excluded from this rework for now. Its throne,
  hazards, persistence, and ultimate encounter logic remain separate.

## Current Dungeon Implementation

### Static node identity

Dungeon identity is currently a static world-map flag:

- `shared/src/world/nodeBiomes.ts`
  - `NodeBiomeInfo.isDungeon?: boolean` marks dungeon nodes.
  - `NodeBiomeInfo.bossTypeId?: string` optionally overrides the biome boss
    pool for a unique encounter.
  - `NodeBiomeInfo.mobDensity?: number` can override normal biome density.
  - The Void Overlord throne is a dungeon node with
    `bossTypeId: "void-overlord"` and `mobDensity: 0`.
- `server/src/world/nodeRegistry.ts`
  - Builds runtime `NodeDefinition` records from `NODE_BIOMES`.
  - Defaults `isDungeon` to `false`.
- `shared/src/biomeDatabase.ts`
  - `monsterPoolByTier` supplies normal ambient monsters for a biome/tier.
  - `bossPoolByTier` supplies dungeon bosses for a biome/tier.

There is no dungeon runtime object today. A dungeon is just a normal node with
`isDungeon` set.

### Population and boss spawning

Population is driven from `World.tick()` in `server/src/world/World.ts`.
Periodically, for each unfrozen occupied node, the server calls:

1. `ensurePopulationInWorld(world, nodeId)`
2. `ensureBossInWorld(world, nodeId)`

Node thaw also calls the same two functions immediately from
`server/src/world/nodeLifecycle.ts`.

Current behavior:

- `ensurePopulation()` fills the node up to `world.getMobDensity(nodeId)`.
- `spawnMonster()` picks a random monster from the biome's
  `monsterPoolByTier[biomeTier]`.
- Dungeon nodes still run normal ambient spawning.
- `ensureBoss()` runs only when `nodeDef.isDungeon` is true.
- `ensureBoss()` maintains exactly one boss in each dungeon node.
- A boss spawns only if the node has no boss and its boss respawn cooldown has
  expired.
- Boss type selection is:
  - `nodeDef.bossTypeId`, if present.
  - Otherwise a random entry from `biome.bossPoolByTier[biomeTier]`.
- Boss spawn position is near the node center with a small random offset.

The practical current dungeon loop is:

```txt
Player enters / node thaws
-> normal ambient monsters spawn
-> one dungeon boss spawns near center
-> player kills ambient mobs and/or boss
-> boss death starts a 30s respawn marker
-> ensureBoss respawns the boss after the marker expires
```

### Dungeon monster scaling

`server/src/systems/world/spawning/index.ts` applies dungeon scaling inside
`createMonster()`:

- Non-boss monsters in dungeon nodes receive:
  - `DUNGEON_HP_MULT = 2.0`
  - `DUNGEON_ATK_MULT = 1.6`
- Boss monsters do not receive the dungeon multiplier.
- Dungeon monsters otherwise use their normal `MONSTER_DATABASE` stats and AI.

This means current dungeon ambient enemies are not authored as guardians. They
are just the biome's regular monster pool with stronger HP and attack.

### Monster lifecycle and node freeze

`server/src/world/nodeLifecycle.ts` freezes a node when the last player leaves:

- All monsters in that node are removed.
- `nextMonsterIdByNode` is reset for that node.
- monster/boss counts are reconciled.
- node feature spawn state and suppressed feature blocks for that node are
  cleared.
- node deltas, events, and telemetry are cleared.

Thawing reverses this by:

- marking the node as unfrozen,
- syncing telemetry,
- calling `ensurePopulation()`,
- calling `ensureBoss()`,
- reconciling monster counts,
- forcing a fresh node delta.

Boss respawn maps are not cleared by normal freeze. The Void Overlord respawn is
also persisted through `overlordRespawnPersist`.

### Boss death, rewards, and progression

Monster kills flow through `grantMonsterRewards()` in
`server/src/systems/player/progression/rewards.ts`.

Current reward behavior:

- The killer receives monster rewards from `MONSTER_DATABASE`.
- Same-node party members also receive rewards.
- `registerKillForQuests()` checks the killed `monsterTypeId` against the
  current tier quest in `shared/src/quests/questDatabase.ts`.
- Tier quests require killing any one dungeon boss for that tier.
- On eligible boss death:
  - boss respawn is scheduled,
  - `bossRespawnAt` and `bossRespawnMarkers` are populated,
  - `world:bossFelled` is broadcast for map UI,
  - the biome/tier boss clear key is added to `tracksProgression.bossesCleared`,
  - Void Overlord special clear/persistence hooks run when applicable.

Important coupling:

- Boss completion is currently defined by a boss monster death.
- The boss respawn marker is also scheduled by boss monster death.
- The gauntlet system should preserve progression credit but replace or bypass
  the old 30s boss respawn marker for gauntlet bosses.

### Client presentation today

Current dungeon client behavior is mostly map and monster presentation:

- `client/src/ui/map/MapPanel.tsx`, `OverviewMap.tsx`, `NodeInfo.tsx`,
  `map.css`
  - dungeon tiles use different styling and a `DUNGEON` badge.
  - the Void Overlord node uses a `THRONE` badge.
  - node info shows boss candidates from `bossPoolByTier`.
  - node info warns: `Enemies: x2 HP * x1.6 ATK`.
- `client/src/render/monsters.ts`, `labels.ts`, `TargetFrame.tsx`
  - bosses render larger and get boss label treatment because
    `isMonster.isBoss` is networked.
- `client/src/hud/atoms.ts`, socket wiring, and map UI
  - consume `world:bossFelled` markers for boss respawn state.

There is no current dungeon-specific HUD state, altar button, phase progress,
or guardian count.

### Existing altar/decor support

The repo already has a client decor path that can render world features:

- `shared/src/world/nodeFeatures.ts`
  - defines static `NODE_FEATURES`.
  - includes the clearing `rune_altar` and the Void Overlord `abyssal_throne`.
- `client/src/sprites.ts`
  - `NODE_DECOR` maps node feature ids to client image assets.
- `client/src/scenes/game/sceneSetup.ts`
  - preloads decor images.
- `client/src/scenes/game/overlays.ts`
  - places decor images at their shared node feature coordinates.
  - supports alternate open/closed texture keys for the abyssal throne.

This is a useful starting point for dungeon altars, but the gauntlet altar will
need to exist on every dungeon node and expose state, not only static art.

## Current Gaps Relative To The Gauntlet Design

The current implementation lacks:

- runtime gauntlet state per dungeon node,
- altar activation validation,
- a client-to-server altar activation socket event,
- a client-visible altar state payload,
- fixed guardian spawn definitions,
- server-only monster source tags,
- guardian tether / no-wander behavior,
- phase progression tracking,
- participant tracking,
- reset-on-node-wipe behavior,
- reset-on-freeze behavior that restores dungeon idle state,
- boss spawning gated by phase completion,
- short altar cooldown after success,
- dungeon-specific UI for activation, cooldown, guardian count, and phase
  progress.

The current implementation also has behavior that must be removed or gated:

- normal ambient spawning in dungeon nodes,
- `ensureBoss()` maintaining standing dungeon bosses,
- non-boss dungeon blanket scaling as the only dungeon difficulty layer,
- map/UI copy that describes dungeons as `x2 HP * x1.6 ATK`.

## Proposed Implementation Plan

### Verification Findings

The implementation is feasible, but there are a few important seams to handle
deliberately.

#### Kill finalization is not centralized enough yet

Monster deaths currently happen through several paths:

- direct combat in `server/src/systems/combat/engine/combat.ts`,
- AoE in `server/src/systems/combat/damage/aoeDamage.ts`,
- proc damage in `server/src/systems/combat/damage/procDamage.ts`,
- weapon effects in `server/src/systems/combat/damage/weaponEffects.ts`,
- DoT ticks in `server/src/systems/classes/archetypes/dot/`,
- T3 archetype ticks such as laser, beams, hemorrhage, energy ticks, and
  alternating currents.

Most paths call `grantMonsterRewards()` and then `world.removeMonsterEntity()`
directly. A small `killHooks.ts` exists, but it only emits an `onKill` context
for some player-owned kill sources.

Gauntlet progress should not be patched into every kill site independently.
Before implementing phases, add or expand a shared monster kill finalizer that:

1. emits `onKill` when appropriate,
2. grants rewards,
3. records kill log / kill event data,
4. notifies dungeon gauntlet logic,
5. removes the monster.

This is the main code-health prerequisite for reliable gauntlet progress.

#### Boss rewards and boss respawn must be separated

`grantMonsterRewards()` currently does two jobs for bosses:

1. grants rewards, quest progress, boss clear keys, party sharing, and special
   Void Overlord clear handling,
2. schedules old standing-boss respawn markers.

Gauntlet bosses need the first behavior but not the second. Split the reward
path so gauntlet boss death can apply current rewards/progression while starting
altar cooldown instead of the old 30s boss respawn marker.

#### Old dungeon spawning can be removed for normal dungeons

Because the final rework should replace the old model, the migration should not
land as a permanent dual dungeon system.

Recommended flow:

1. Build and test the gauntlet system with Mountain T1 as the first content
   definition.
2. Add generated/default gauntlet definitions for the other normal dungeon
   nodes.
3. Disable old ambient dungeon spawning and old standing-boss maintenance for
   all gauntlet-defined non-Void dungeon nodes.
4. Keep the Void Overlord node on its existing separate system.

#### Guardian visuals fit current client architecture

Guardian naming can be handled server-side by stamping
`isMonster.name = "<biome> guardian"` after `createMonster()`.

For the yellow/gold outline or aura, the least disruptive options are:

- add a small guardian visual flag to the future client-facing
  `DungeonGauntletView` and render a client-only outline by monster id, or
- add a persistent `guardian` visual effect to `hasStatus.activeEffects` using
  the existing effect overlay system.

The first option is cleaner for non-combat identity. The second reuses existing
effect overlay machinery but treats a permanent role marker like a status effect.

MVP recommendation:

- replace the name with `<biome> guardian` immediately,
- add the outline/aura through gauntlet client view state once
  `DungeonGauntletView` exists.

#### Biome-specific guardian buffs should live in gauntlet data

The current dungeon blanket scaling is `x2 HP` and `x1.6 ATK` for all non-boss
dungeon monsters. The gauntlet should replace that with per-biome guardian
modifiers:

- Plains: more bodies or mild speed/attack-speed pressure.
- Forest: faster attacks/movement, lower durability.
- Mountain: higher attack/HP, slower movement.
- Swamp: stronger DoT pressure.
- Cave: fewer, bulkier guardians with mitigation.
- Later biomes should follow the same identity-first rule.

Keep these modifiers in `DungeonGauntletDef.guardianPhase.modifiers`, not in
generic `createMonster()` dungeon scaling.

### Milestone 1 - Shared contracts and static definitions

Add shared dungeon gauntlet definitions before server behavior.

Suggested files:

- `shared/src/dungeons/gauntletTypes.ts`
- `shared/src/dungeons/gauntletDatabase.ts`
- `shared/src/dungeons/index.ts`
- export from `shared/src/index.ts`

Define:

- `GauntletStatus = "idle" | "active" | "boss" | "cooldown"`
- `DungeonGauntletDef`
- `DungeonAltarDef`
- `GauntletPhaseDef`
- `DungeonMonsterPoolEntry`
- `DungeonMonsterModifiers`
- `GauntletBossDef`
- compact client-facing `DungeonGauntletView`

Recommended runtime addition beyond the source plan:

```ts
requiredKillsForCurrentPhase: number
```

Store this in runtime state when a phase starts. It avoids recomputing phase 1
requirements after pre-clearing guardians.

Definition strategy:

- Build definitions from `NODE_BIOMES` plus biome/tier conventions.
- Start with one pilot definition, preferably Mountain T1 (`node-3-5`).
- Keep definitions runtime-independent and pure so both server and client can
  safely import altar location and display metadata.

Do not persist gauntlet state.

### Milestone 2 - Server-only gauntlet runtime state

Add server-owned runtime state to `World`, keyed by node id:

```ts
gauntlets = new Map<string, GauntletState>();
```

Place server implementation under something like:

- `server/src/systems/world/dungeons/gauntletState.ts`
- `server/src/systems/world/dungeons/gauntletDefs.ts`
- `server/src/systems/world/dungeons/gauntletSpawn.ts`
- `server/src/systems/world/dungeons/gauntletTick.ts`
- `server/src/systems/world/dungeons/gauntletEvents.ts`

`GauntletState` should include:

- node id,
- status,
- phase index,
- kills in current phase,
- required kills for current phase,
- idle guardian ids,
- active monster ids,
- boss monster id,
- participant player ids,
- started/cooldown timestamps,
- optional last idle guardian kill timestamp.

Keep this state server-only. The client should receive a compact view, not the
raw `Set<string>` participant data.

### Milestone 3 - Monster source tagging

Add a server-only component for dungeon monster runtime metadata.

Suggested component name:

- `TracksDungeon`

Reason:

- It is server-only runtime data.
- It expresses that the monster participates in dungeon/gauntlet behavior.
- It avoids overloading networked `isMonster`, `controlsMonster`, or
  `tracksCombat`.

Shape:

```ts
type DungeonMonsterSource =
  | "idleDungeonGuardian"
  | "gauntletPhase"
  | "gauntletBoss";

interface TracksDungeon {
  source: DungeonMonsterSource;
  dungeonNodeId: string;
  gauntletPhaseIndex?: number;
  gauntletPhaseId?: string;
  guardPost?: Vec2;
  leashRadius?: number;
  forbiddenChaseRadiusAroundAltar?: number;
}
```

Implementation touch points:

- Add optional `tracksDungeon?: TracksDungeon` to `ServerEntity`.
- Add `world.dungeonMonsters = world.monsterEntities.with("tracksDungeon")`
  only if useful.
- Do not add it to networked component allowlists.
- If the client needs visual state later, expose it through a separate view/event
  rather than this component.

### Milestone 4 - Gate old dungeon spawning

Change population behavior so dungeon nodes no longer run the old model.

Server changes:

- In the periodic population loop, call gauntlet maintenance for dungeon nodes.
- In `thawNode()`, initialize or reset gauntlet state for dungeon nodes.
- Gate `ensurePopulation()` so dungeon nodes do not spawn normal ambient mobs
  once gauntlets are enabled.
- Gate `ensureBoss()` so dungeon nodes do not maintain standing bosses once
  gauntlets are enabled.

Migration shape:

- During local development, Mountain T1 can be the first gauntlet definition
  used to prove the state machine.
- Before the rework is considered complete, add definitions for all normal
  non-Void dungeon nodes.
- Then disable old dungeon ambient spawning and old standing-boss maintenance for
  all gauntlet-defined dungeon nodes.
- Keep a narrow exception for the Void Overlord node because it has a separate
  ultimate encounter system.

This avoids leaving two normal dungeon systems alive in production.

### Milestone 5 - Idle guardian spawning

On dungeon node thaw/init:

1. Create `GauntletState` with `status: "idle"`.
2. Spawn fixed guardians from the `guardianPhase`.
3. Tag each guardian with `tracksDungeon.source = "idleDungeonGuardian"`.
4. Add guardian ids to `state.idleGuardianIds`.

Guardian AI rules:

- fixed spawn posts around the altar,
- no random wandering,
- leash to guard post,
- optionally avoid chasing into altar inner safe radius before activation.

Implementation detail:

- Reuse `createMonster()` for base monster construction.
- Then adjust stats with phase modifiers.
- Set `controlsMonster.spawn` to the fixed guard post.
- Set `controlsMonster.wanderRadius = 0`.
- Set `hasAwareness.leashRange` and `controlsMonster.leashRange` from the
  guardian metadata.

If altar inner safe radius is used, the monster targeting/movement layer needs a
small check for `tracksDungeon.forbiddenChaseRadiusAroundAltar` while source is
`idleDungeonGuardian`.

### Milestone 6 - Idle guardian deaths and pre-clear reset

Hook monster death for dungeon-tagged monsters.

Current kills are handled in several locations, all calling
`grantMonsterRewards()` before removing the monster. The cleanest approach is a
small central kill hook used everywhere that currently kills monsters.

Suggested path:

- Extend the existing or new kill hook module under
  `server/src/systems/combat/damage/killHooks.ts`.
- After rewards and combat `onKill` events, call dungeon gauntlet death handling
  before entity removal.

For `idleDungeonGuardian`:

- remove monster id from `state.idleGuardianIds`,
- set `lastIdleGuardianKillAtMs`,
- do not advance phase progress,
- allow normal modest rewards unless balance says otherwise.

Add optional idle pre-clear reset:

- If `state.status === "idle"` and the pre-clear timeout expires, despawn
  remaining guardians and reset to full idle.

### Milestone 7 - Altar activation socket event

Add a player intent event:

- shared protocol: `player:activateDungeonAltar`
- client intent helper in `client/src/net/intents.ts`
- server handler in `server/src/index.ts`

Server validation:

- player exists and is alive,
- player is in a dungeon node with a gauntlet definition,
- node state is `idle`,
- player is within `altar.activationRadius`,
- node is not frozen,
- cooldown is not active.

Activation:

- set `status = "active"`,
- set `phaseIndex = 0`,
- set `startedAtMs` and `startedByPlayerId`,
- add activator as participant,
- convert surviving guardians into phase 1 or skip directly to the next phase /
  boss if no guardians remain.

### Milestone 8 - Guardian conversion and phase progression

When activation happens:

- Filter `idleGuardianIds` down to live monsters.
- Clear `idleGuardianIds`.
- If no guardians remain, advance immediately.
- Otherwise:
  - attach/update `TracksDungeon` to `source: "gauntletPhase"`,
  - set phase metadata,
  - optionally loosen leash,
  - set `activeMonsterIds`,
  - set `requiredKillsForCurrentPhase = survivingGuardianIds.length`,
  - set `killsInPhase = 0`.

For post-guardian phases:

- Spawn all phase monsters at fixed or generated points.
- For MVP, keep `maxAlive === requiredKills`.
- Do not add refill/sub-wave spawning yet.

On `gauntletPhase` death:

- remove id from `activeMonsterIds`,
- increment `killsInPhase`,
- add killer as participant,
- if `killsInPhase >= requiredKillsForCurrentPhase`, advance.

Advancement:

- guardian phase -> first extra phase or boss,
- extra phase -> next extra phase or boss,
- final phase -> boss.

### Milestone 9 - Boss gating and completion

Spawn the dungeon boss only after all phases clear.

Boss spawn:

- choose boss id from `GauntletBossDef`,
- use altar center or fixed boss point,
- call `createMonster()`,
- attach `TracksDungeon` with `source: "gauntletBoss"`,
- set `state.status = "boss"`,
- set `state.bossMonsterId`.

On gauntlet boss death:

- preserve existing boss reward/progression behavior:
  - quest credit,
  - boss clear key,
  - same-node party reward sharing,
  - Void Overlord special handling if that encounter is later migrated.
- prevent old 30s `scheduleBossRespawn()` from driving gauntlet boss respawn.
- start altar cooldown instead:
  - `status = "cooldown"`,
  - `cooldownEndsAtMs = now + successCooldownMs`,
  - clear active ids and boss id.

Recommended refactor:

- Split `grantMonsterRewards()` so boss progression credit can be applied
  without always scheduling old boss respawn markers.
- Old standing bosses use old respawn scheduling.
- Gauntlet bosses use altar cooldown scheduling.

### Milestone 10 - Node-wipe reset and participant tracking

Participants should be tracked when:

- a player activates the altar,
- a player damages a gauntlet monster,
- a player damages the gauntlet boss,
- a player is damaged by a gauntlet monster,
- a player is damaged by the gauntlet boss.

Implementation hooks:

- combat pipeline `onDamageTaken` can identify attacker/defender pairs,
- direct kill/death handlers can add the killer,
- monster attack handling should mark the damaged player.

Failure reset:

- On player death, if the gauntlet is `active` or `boss`, check the whole node.
  Reset the dungeon to idle only when no live players remain in that node.
- Party membership must not gate this check. Non-party players in the node keep
  the attempt alive.
- On node freeze, reset and discard gauntlet state.
- Optional safety timeout can reset stalled active attempts.

Reset should:

- despawn idle guardians, active phase monsters, and boss,
- clear participants,
- create a fresh idle state,
- respawn idle guardians unless the node is freezing and will be recreated on
  thaw.

### Milestone 11 - Client-visible dungeon state

The client needs altar and phase state. Avoid encoding this in per-monster
networked components.

Reasonable options:

1. Add optional `dungeonGauntlet?: DungeonGauntletView` to `DeltaSnapshot`.
2. Add a separate server-to-client event such as `dungeon:state`.

Preferred MVP:

- Add `dungeonGauntlet?: DungeonGauntletView` to `DeltaSnapshot`.

Why:

- Deltas are already node-scoped.
- The state only matters for the node the client is viewing.
- It avoids another periodic socket stream.

The view should include:

- node id,
- status,
- altar position/radius,
- activatable boolean for local player, if computed server-side,
- cooldown remaining/end timestamp,
- guardian alive/total counts,
- current phase label,
- kills/required kills,
- boss monster id/type id if active.

If `activatable` is not computed server-side, the client can compute distance
from its authoritative local position and the shared altar definition, but the
server must still validate activation.

### Milestone 12 - Client altar interaction UI

Add a mobile-friendly altar control.

Suggested implementation:

- React HUD component under `client/src/hud/dungeon/` or similar.
- Jotai atom in `client/src/hud/atoms.ts` for `DungeonGauntletView | null`.
- Update atom from `deltaApplier.ts` when snapshots include gauntlet state.
- Button emits `player:activateDungeonAltar`.

UI states:

- `Begin Trial`
- `Move Closer to Altar`
- `Trial in Progress`
- `Boss Awakened`
- `Altar Reforming... 12s`

Placement:

- lower/bottom-center,
- at least 48px tall,
- readable on mobile,
- disabled rather than hidden during cooldown when nearby.

Also add compact progress:

- idle: `3/4 guardians remain`
- active: `Stone Guardians: 2/4 defeated`
- boss: `Boss awakened`

### Milestone 13 - Client altar world art

The current `NODE_DECOR` path can show altar art if dungeon altar features are
added to shared node features. For many dungeon nodes, manually listing a
`NODE_DECOR` entry per node will get noisy.

Recommended art integration:

- Add a generic dungeon altar feature id or derive altar decor from
  `DungeonGauntletDef.altar`.
- Extend the decor builder to render dungeon altar art for any node with a
  gauntlet definition.
- Keep `NODE_FEATURES` for collision/hazards and use gauntlet definitions for
  altar interaction where possible.

Stateful altar art options:

- one static altar image plus glow/tint by status,
- one spritesheet with frames for `idle`, `active`, `boss`, and `cooldown`,
- one spritesheet row per biome and column per status, if biome-specific altars
  are desired later.

MVP recommendation:

- one generic spritesheet,
- 4 frames:
  - idle,
  - active,
  - boss awakened,
  - cooldown/reforming,
- Phaser loads it via `scene.load.spritesheet(...)`,
- render chooses frame from `DungeonGauntletView.status`.

### Milestone 14 - Map and quest presentation updates

Update existing dungeon map copy:

- Remove or revise `Enemies: x2 HP * x1.6 ATK`.
- Show a short gauntlet description instead.
- In node info, show boss as locked behind trial phases.
- Keep quest "find dungeon" behavior, since quests still point players toward
  dungeon nodes.

The existing boss-felled marker UI should remain for old standing bosses and the
Void Overlord until those are migrated. Gauntlet altar cooldown should not reuse
`world:bossFelled` unless the semantics are deliberately changed.

### Milestone 15 - First content rollout

Pilot one dungeon first:

- Mountain T1 (`node-3-5`, boss `crag-behemoth`).

Why:

- simple slow/heavy identity,
- easy guardian tuning,
- low risk for broader tier progression,
- matches the gauntlet plan's recommended pilot.

Suggested first pass:

- 4 guardians,
- no extra phases,
- boss spawns at altar,
- 12s success cooldown,
- 90s idle pre-clear reset,
- no new rewards beyond existing monster/boss rewards.

Then expand:

1. remaining T1 dungeons,
2. T2 dungeons with one post-guardian phase,
3. T3/T4 only after the core loop, UI, and reward semantics are stable.

## Asset Generation Note

It is possible to generate altar sprites directly here later. We can create a
bitmap altar image or a multi-frame spritesheet, then add it under
`client/public/assets/environment/` and wire it into Phaser preload/render code.

You do not need to create them separately unless you want a dedicated art tool or
manual pixel-level control.

For this project, a spritesheet is probably the right direction:

- easier preload management,
- one asset path instead of many small PNGs,
- clean state-based frame selection,
- room to add biome rows later.

Suggested future art task:

1. Decide frame size and style target.
2. Generate one generic 4-frame altar spritesheet.
3. Inspect it locally for transparency, readability, and frame alignment.
4. Add constants for key/file/frame size.
5. Load with `scene.load.spritesheet`.
6. Render altar frame from gauntlet status.
7. Add a light glow/tint effect for interaction range and active state.

No sprites were generated as part of this document.

## Suggested Verification When Implementing

Run focused checks as milestones land:

- `pnpm typecheck`
- `pnpm build`
- server boot with dev marker/network invariants
- one manual playtest of Mountain T1:
  - enter node,
  - see altar and guardians,
  - pre-clear one guardian,
  - activate altar,
  - verify phase requires only survivors,
  - kill boss,
  - verify quest/boss clear credit,
  - verify 12s altar cooldown,
  - verify guardians respawn after cooldown,
  - verify one player death does not reset while another live player remains in
    the node,
  - verify full node wipe resets,
  - verify node freeze/thaw resets runtime state.
