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
- reset-on-participant-death behavior,
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

Migration-safe option:

- Add a feature switch such as `ENABLE_DUNGEON_GAUNTLETS`.
- Start enabled only for the pilot dungeon.
- Other dungeon nodes keep old behavior until definitions exist.

This avoids breaking every dungeon while Mountain T1 is being proven.

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

### Milestone 10 - Failure reset and participant tracking

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

- On player death, if the player is a participant and the gauntlet is `active`
  or `boss`, reset the dungeon to idle.
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
  - verify participant death resets,
  - verify node freeze/thaw resets runtime state.

