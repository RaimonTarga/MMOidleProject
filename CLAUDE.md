# MMO Idle — Project Context for Claude Code

Read this file before touching any code. It is the single source of truth for
day-to-day conventions, gameplay tuning, and current project state.

For the high-level architecture (package boundaries, ECS model, component
naming, composability rules, where to put new mechanics), read
[`design_docs/architecture.md`](design_docs/architecture.md) first. This file
assumes that document as background and focuses on the specifics.

---

## What this project is

A browser-based hobbyist MMORPG / idle game. Target: ~100 concurrent players (friends).
No PvP. Combat is automatic — the player builds the character and makes strategic decisions.

Key design axioms:
- **Server is authoritative.** All game logic runs in the server tick. The client renders state it receives.
- **Split-tick architecture.** Logic runs at 10 Hz; broadcasts go out at 5 Hz. Combat events are queued between broadcasts so animations are never lost.
- **Simplicity over cleverness.** Hobby project maintained with LLM help. Prefer readable, obvious code.

---

## Monorepo layout

```
/
├── CLAUDE.md                 ← you are here
├── design_docs/architecture.md ← high-level architecture reference
├── map-editor.html           ← standalone biome editor (open in browser)
├── shared/src/
│   ├── index.ts              ← shared types, socket event maps, constants
│   ├── components/           ← ECS slice + marker component shapes
│   │   ├── core/             ← networked slice shapes (HasPosition, HasHealth, ...)
│   │   ├── combat/           ← TracksCombat, StatusEffect, PlayerBuff
│   │   ├── targeting/        ← HasAttackTarget, HasAggroTarget, ScriptsBoss, ...
│   │   └── archetypes/       ← cadence/, cooldown/, dot/, energy/, reload/
│   ├── protocol/             ← DeltaSnapshot, NetworkedEntity, PlayerView/MonsterView
│   ├── systems/              ← pure formulas (stats, damage, skills, spatial)
│   ├── registries/effects.ts ← EFFECT_DEFS, EFFECT_BY_ID
│   ├── passives.ts           ← typed PassiveKey union
│   ├── quests/               ← QUEST_DATABASE
│   ├── skillTree.ts          ← SKILL_TREE map (T0–T3 hand-authored, T4–T7 generated)
│   ├── biomeDatabase.ts      ← BiomeDefinition, BIOME_DATABASE, bossPoolByTier
│   ├── monsterDatabase.ts    ← MonsterDefinition (isBoss?, isRanged?, dotEffect?, chargeOnAggro?, slowEffect?, evadeEvery?, bossScript?)
│   ├── itemDatabase.ts, items.ts, recipeDatabase.ts
├── client/src/
│   ├── main.ts               ← Phaser bootstrap
│   ├── hudBus.ts             ← reactive event bus for HUD state
│   ├── scenes/GameScene.ts   ← thin: lifecycle + per-frame schedule
│   ├── net/                  ← socket.ts, deltaApplier.ts, intents.ts
│   ├── render/               ← per-concern Maps + render systems (sprites, hp, fx)
│   ├── fx/                   ← one file per attack style
│   ├── input/                ← clickToMove, autoPath, keyboard, debug
│   ├── hud/                  ← HUD.tsx, BuffBar.tsx, StatPanel.tsx, MenuButtons.tsx
│   └── ui/                   ← SkillTree, Inventory, Crafting, Quest, Map panels
└── server/src/
    ├── index.ts              ← Express + Socket.IO + game loop
    ├── ecs/                  ← entity.ts, world.ts, dirtyTracker.ts, deltaEncoder.ts,
    │                            markerHelpers.ts, archetypeSliceSync.ts
    ├── world/
    │   ├── world.ts          ← World class: queries, tick(), buildNodeDelta()
    │   ├── nodeRegistry.ts   ← 11×11 node grid from NODE_BIOMES
    │   └── nodeDelta.ts, monsterLifecycle.ts, playerLifecycle.ts, testRoom.ts
    ├── systems/
    │   ├── classes/          ← registry.ts + archetypes/{cadence,cooldown,dot,energy,reload}/
    │   ├── combat/           ← engine/, ai/, damage/, buffs/
    │   ├── defense/          ← regen/, shields/, mitigation/, core/
    │   ├── player/           ← economy/ (inventory, crafting), progression/ (skills, rewards, quests)
    │   └── world/            ← movement, spawning, transitions, testRoomInteract
    └── db/                   ← Drizzle + Postgres (pg), component-shaped persistence
```

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript everywhere | Strict mode on |
| Client framework | Phaser 3 | Sprites/scenes/camera/tweens |
| Client HUD | React 18 + inline CSS | Overlaid on Phaser canvas |
| Client build | Vite 5 | Dev server on port 3000 |
| Server runtime | Node.js + tsx (dev) / compiled `node dist` (prod) | tsx in dev; prod runs compiled JS |
| Realtime | Socket.IO 4 | One room per node instance |
| Database | Postgres + Drizzle ORM (`pg` / node-postgres) | `server/src/db/` — connects via `DATABASE_URL`; local Postgres via docker-compose |
| Package manager | pnpm workspaces (pinned `pnpm@8.15.1`) | Always `pnpm install` from repo root |

---

## Running the project

```bash
pnpm install              # once, or after adding deps (Docker must be installed/running)
pnpm dev:server           # auto-starts the Postgres container, then runs the server (http://localhost:4000)
pnpm dev:client           # http://localhost:3000
pnpm play                 # build client + start server (LAN / production mode)
# map-editor.html — open directly in browser
```

**Database (Postgres):** the server requires a player/game Postgres reachable via
`DATABASE_URL` and a separate operational log Postgres reachable via `LOG_DATABASE_URL`.
Local instances for both are defined in `docker-compose.yml` so dev "just works":

```bash
pnpm db:up                # start just Postgres (docker compose, waits until healthy)
pnpm db:down              # stop containers
pnpm db:reset             # wipe the local db volume and restart fresh
pnpm db:logs              # tail Postgres logs
pnpm docker:up            # build + run the FULL app + Postgres in containers (mirrors Railway)
pnpm docker:down          # stop the full stack
```

`pnpm dev:server` runs `pnpm db:up` first (Docker must be running). When `DATABASE_URL`
is unset in dev, `db/index.ts` falls back to the local compose game Postgres
(`postgresql://postgres:postgres@localhost:5432/gamedb`). When `LOG_DATABASE_URL` is unset
in dev, `logdb/index.ts` falls back to the local compose log Postgres
(`postgresql://postgres:postgres@localhost:5433/logdb`). In production both env vars must
be set. On Railway, attach two Postgres services and set
`DATABASE_URL=${{gamedb.DATABASE_URL}}` and `LOG_DATABASE_URL=${{logdb.DATABASE_URL}}` on
the app service. Log retention is capped at 7 days (`LOG_RETENTION_DAYS`, default 7) so
high-volume operational logs never flood the player database.

Game DB migrations live in `server/src/db/migrations`; log DB migrations live in
`server/src/logdb/migrations`. Both run automatically at boot.

---

## Shared package (`@mmo-idle/shared`)

Everything that crosses the client/server boundary lives here. Start here for any new entity, socket event, or shared formula.

- **Component slices** — `HasPosition`, `HasHealth`, `DealsDamage`, `PerformsAttack`, `MitigatesDamage`, `HasStatus`, `TracksProgression`, `HoldsInventory`, `UsesSkills`, archetype slices (`UsesCadence`, `UsesCooldown`, `UsesEnergy`, `UsesReload`, `AppliesDots`, `ChillsTarget`), and status markers. See `shared/src/components/`.
- **Wire protocol** — `DeltaSnapshot`, `EntityDelta`, `NetworkedEntity`, `NETWORKED_PLAYER_KEYS`, `NETWORKED_MONSTER_KEYS`, `composePlayerView`, `composeMonsterView`. See `shared/src/protocol/`.
- **Combat events** — `CombatEvent` (`player-hit`, `player-kill`, `monster-dodge`) queued per-node between broadcasts.
- **Databases (read-only)** — `ITEM_DATABASE`, `MONSTER_DATABASE`, `BIOME_DATABASE`, `RECIPE_DATABASE`, `SKILL_TREE`, `EFFECT_DEFS`, `BUFF_IDS`.
- **Socket event maps** — `ServerToClientEvents`, `ClientToServerEvents`.
- **Tuning** — `GAME_CONFIG`, `NODE_BIOMES` (record `node-{row}-{col}` → `{ biomeGroup, biomeTier, isDungeon? }`).
- **Pure formulas** (`shared/src/systems/`) — stat recalculation, damage, skill validation, spatial vector math. Run on both server (for authority) and client (for tooltips).
- **Quests** — `QUEST_DATABASE`, `XP_PER_LEVEL = 100`.
- **Biome XP** — `biomeXpForLevel(n)` from `BIOME_XP_BASE` + `BIOME_XP_EXPONENT` in `GAME_CONFIG`.
- **Biome level cap** — `biomeLevelCap(playerTier, biomeGroup)`; clearing is always capped at 4, other biomes use `Math.max(4, playerTier * 4)`.
- **Boss scripting types** — `BossAction`, `BossPhase`, `RepeatingAction`, `BossScript` (in `monsterDatabase.ts`).

---

## Socket events

| Event | Direction | Description |
|---|---|---|
| `state:sync` | S→C | Full component resync on connect / reconnect / node transition (`DeltaSnapshot` with `full: true`) |
| `node:delta` | S→C | Authoritative component-delta broadcast every 200 ms |
| `player:died` | S→C | Player HP hit zero; corpse stays at death site (`isDead` + grave frame in delta) |
| `player:ackDeath` | C→S | Acknowledge death overlay — triggers respawn at clearing |
| `crafting:result` | S→C | Craft success/failure |
| `player:move` | C→S | Movement request |
| `player:setAuto` | C→S | Toggle auto-targeting |
| `player:unlockSkill` | C→S | Unlock skill tree node |
| `inventory:equipItem` / `inventory:unequip` | C→S | Equipment changes |
| `crafting:craftRecipe` | C→S | Craft attempt |
| `party:join` | C→S | Join a target player's party (their leader becomes your leader) |
| `party:leave` | C→S | Leave your party (disbands it if you are the leader) |

---

## Server architecture

`server/src/index.ts`: Express setup → Socket.IO setup → mechanic / weapon / defense / debuff `init*` calls → two decoupled intervals:
- **Logic tick** 10 Hz (100 ms): `world.tick(dt, now)` + drain `world.pendingDeaths`
- **Broadcast tick** 5 Hz (200 ms): `world.beginBroadcast()` drains the dirty tracker; then `world.buildNodeDelta(nodeId, dirty)` once per occupied node → emits `node:delta`

`server/src/world/world.ts` (`World` class) owns all mutable state via a miniplex ECS. Each system lives under `server/src/systems/<area>/` and queries the components it needs (`world.dottedMonsters`, `world.cadencePlayers`, etc.).

### Combat pipeline

`beforeAttack` → `onAttack` → `onHit` → `onDamageTaken` → `afterHit` → `onKill`

Register via `registerCombatListener`. `CombatContext` is a mutable bag — handlers read/write `ctx.damage`, `ctx.cancelled`, `ctx.metadata`.

**Combat event queue:** `world.pushEvent(nodeId, event)` queues `player-hit`/`player-kill` after each attack. `buildNodeDelta` calls `world.takeNodeEvents(nodeId)` once per node per broadcast. Do **not** use per-tick booleans on entity slices for animation — use `pushEvent`.

**Retaliation aggro:** On player hit, if the monster has no `hasAggroTarget` component, `combat.ts` attaches one immediately. `ai.ts` never overwrites existing aggro.

### AoE damage (`aoeDamage.ts`)

- `applyPlayerAoe(world, attacker, x, y, radius, damage, excludeId?)` — hits monsters
- `applyMonsterAoe(world, attacker, x, y, radius, damage, excludeId?)` — hits players

AoE bypasses the combat pipeline intentionally. Every empowered hit auto-triggers `applyPlayerAoe` at `EMPOWERED_AOE_RADIUS: 80` px, `EMPOWERED_AOE_MULT: 0.5 × dealsDamage.attack`.

### Monster AI (`ai.ts`)

Aggro acquisition (`findAggro`) only runs when `hasAggroTarget` is absent — retaliation aggro is never overwritten. Retention: cleared only on node change, disconnect, or leash break.

**Kite prevention:** `kiteTimer` accumulates while chasing. After `KITE_GRACE_MS` (500 ms) speed ramps at `KITE_RAMP_RATE` (1.5×/s) up to `KITE_MAX_MULT` (6.0×), floored at `KITE_MIN_SPEED` (150). Timer decays at `KITE_DECAY_RATE` (2.0×) while monster is in attack range. Resets on attack range entry or aggro drop.

**Auto-target stop distance:** `attackRange * 0.70` to prevent stutter-stepping.

### Combat state

`TracksCombat` (server-only, never networked): `counters`, `resources`, `resourceMaxes`, `cooldowns`, `flags`, `strings`, `statusEffects`. Always use accessor helpers — never raw field access. All cooldowns decremented by `updateCombatState` each tick.

Per-archetype runtime state (cadence count, energy charge, reload ammo, DoT bookkeeping, etc.) lives on its own component slice (`usesCadence`, `usesEnergy`, `usesReload`, `appliesDots`, …), not on `tracksCombat`. Slice presence gates archetype behavior. `tracksCombat` is reserved for cross-archetype scratch state (cooldown timers, status effects, lookup-only counters).

**StatusEffect API:** `applyStatusEffect` (stacking — adds 1 stack per call, `data` only set on creation), `removeStatusEffect`, `getTotalStacks`, `hasStatusEffect`. `data` is `Record<string, number>` — numeric flags only.

For "every N hits do X" use `registerAttackThreshold` from `attackCounter.ts`.

### `buffSync.ts` and buff descriptors

Buffs are declared via `defineBuff(...)` in the system file that owns them (see `server/src/systems/combat/buffs/descriptor.ts`). Each descriptor is `{ id, label, color, project(ctx) }`; `project` reads slices and returns a `PlayerBuff | null`. `syncPlayerBuffs` runs at the end of every tick, iterates `ALL_BUFFS` (mechanic-owned + weapon + defense), and writes the result to `hasStatus.activeBuffs`.

To add a buff: add the `BuffId` literal to `BUFF_IDS` in `shared/src/components/combat/buffs.ts`, then add a `defineBuff(...)` in the owning module's descriptor array. The HUD renders it with no client changes.

---

## Client architecture

`GameScene.ts` is thin: scene lifecycle, scene-level Phaser setup, and a fixed per-frame schedule that iterates per-concern render systems. The network seam is `client/src/net/deltaApplier.ts` — the only module that mutates render state from inbound `DeltaSnapshot` payloads.

**Render state** (`client/src/render/state.ts`) is a set of per-concern `Map<NetworkId, T>` registries (sprite, shadow, label, hpBar, cdBar, effectOverlays, interpolation, debugRanges, …). An entity exists in a given map iff that visual concern currently applies. No `Visual` god record; each render module owns ensure/update/destroy for its own concern.

**Inbound flow:** `socket.on('node:delta' | 'state:sync')` → `applyDelta(state, snapshot, scene)` → applies `add`/`patch`/`remove` deltas to local `NetworkedEntity` state → composes `PlayerView` / `MonsterView` via shared formulas → dispatches per-concern upserts → drains combat events into `combatFx` dispatcher → publishes local-player view to `hudBus`.

**Outbound flow:** All `socket.emit(...)` calls go through `client/src/net/intents.ts`. React HUD CustomEvents call the same intent helpers.

**React HUD** is a separate `<div>` in index.html, not inside Phaser. Uses `hudBus.ts` (pub/sub singleton) for state.

Components: `HUD.tsx` (sidebars, StatPanel, BuffBar, EssencePanel), `BuffBar.tsx` (52px icon tiles, clock-sweep overlay, stack badges), `StatPanel.tsx` (DoT pip display, chill/frozen indicators), `MapPanel.tsx` (11×11 grid, dungeon tiles, boss info), `QuestPanel.tsx` (kill counts, XP/level), `CraftingPanel.tsx` (two-tab: Biome Progress + Forge).

**Crafting panel:** Two sidebar buttons — BIOME PROGRESS and OPEN FORGE — open `CraftingPanel` at the corresponding tab. `craftTab: 'biome' | 'forge' | null` state lives in `MenuButtons.tsx` (parent); clicking the active tab's button closes. Biome tab shows biome-level XP bars and recipe unlock paths using `biomeXpForLevel`. Forge tab has filter chips (by biome / slot) and lists unlocked recipes only.

**Mobile/tablet layout (≤ 1100px):** Sidebars hidden; `MobileHUD` takes over — `position: fixed` top bar (HP, name, zone), large AUTO COMBAT button fixed at bottom, right-side slide-out drawer for SKILL/BAG/FORGE/MAP/QUEST. All mobile bars use `position: fixed` (not `absolute`) to avoid being hidden by browser chrome on Android/iOS. Map panel stacks vertically and scales tile size to `(100vw - 68px) / 5`. `clientAuth.ts` falls back from `crypto.randomUUID()` to `crypto.getRandomValues()` so account IDs generate over plain HTTP (LAN play).

**Y-sort draw order:** `GameScene.ts` uses a `DEPTH` constant object (BG/SHADOW/SPRITE/FX_OVERLAY/UI/FLOATER/FX/GATE/DEBUG/MINIMAP/XP_BAR/SCREEN) with bands spaced 3000 units apart (wider than NODE_HEIGHT=2400). Every frame in `stepEntities`, each entity calls `setDepth(BAND + entity.baseY)` so southern entities render in front of northern ones. Never use raw integer depths — always reference `DEPTH.*`.

**Tab-switch desync:** Three-part fix — `dt` capped to 100 ms in `update()`; `document.visibilitychange` listener snaps all entity positions to target and clears lunge offsets on tab return; all tween-creating functions (`playMeleeLunge`, `playOneShotEffect`, `spawnAttackEffect`, `spawnDamageNumber`, `spawnKillRewards`) are guarded with `if (document.hidden) return` to prevent animation queue buildup while the tab is backgrounded.

**Debug range overlay:** `debugGraphics` layer (`DEPTH.DEBUG`). `debugPlayerRange` = yellow-green, `debugEnemyRanges` = orange/blue/red per monster. Toggled via Debug panel via `CustomEvent`.

---

## World map / dungeon

**11×11 grid**, center `node-5-5` is T0 clearing. Chebyshev distance → tier (0=T0, 1–2=T1, 3=T2, 4=T3, 5=T4). `nodeRegistry.ts` auto-generates all 121 nodes from `NODE_BIOMES`; exits computed from coordinates.

**Dungeons:** Non-boss monsters scaled ×2 HP, ×1.6 ATK in `World.createMonster()`. `World.ensureBoss(nodeId)` keeps exactly one boss per dungeon node (doesn't count toward mob density). Bosses: `isBoss: true` in `MONSTER_DATABASE`, listed in `BiomeDefinition.bossPoolByTier`.

**Mob density:** `BiomeDefinition.mobDensity?: number` sets the spawn target per node. Falls back to `GAME_CONFIG.MONSTERS_PER_NODE` (12) when absent. `World.getMobDensity(nodeId)` reads it via `NODE_BIOMES → BIOME_DATABASE`. Both `init()` and `ensurePopulation()` use it. Density values: plains 16, forest 13, swamp 10, mountain 7, cave 5, jungle 15, tundra 6, desert 14, volcanic 5, necropolis 13, abyss 5, clearing 6.

**Boss respawn timer:** Bosses respawn 30 s after death. `World.bossRespawnAt: Map<string, number>` maps `nodeId → earliest respawn timestamp`. Set in `grantMonsterRewards` on every boss kill. `ensureBoss` skips spawning until `Date.now() >= bossRespawnAt`.

---

## Party system

Single-level parties: one leader + N followers, no invites. Clicking **Join** on any
player puts you in that player's leader's party (the join target becomes the leader if they
were solo). Parties are **ephemeral runtime state** — never persisted; cleared on disconnect.

**Source of truth:** the networked `InParty { leaderId; members: PartyMember[] }` slice
(`shared/src/components/core/networkedSlices.ts`). Presence ⇔ in a party;
`leaderId === own id` ⇔ leader. `members` is the full roster (recomputed and stamped onto
every member on any change) so the client panel is correct even when a member is briefly in
another zone. Added to `NETWORKED_PLAYER_KEYS`; flows automatically through `buildNodeDelta`.
No separate manager — followers are derived by scanning `world.playerEntities` for a matching
`leaderId`.

**Membership logic** (`server/src/systems/player/party/partySystem.ts`):
- `joinParty(world, self, targetId)` — resolves the target's root leader; rejects self/cycles.
  If `self` already led a party, that group is **disbanded** (followers go solo); only the
  joiner moves. Attaches `inParty` to the leader (if solo) and to `self`, then re-syncs rosters.
- `leaveParty(world, self)` — follower leaves (re-sync); **leader leaving disbands** the party.
- `syncPartyRoster(world, leaderId)` — restamps the roster onto all members; dissolves a party
  of one. `handlePartyDisconnect` runs on socket disconnect before `detachPlayerEntity`.
- `isPartyFollower(player)` — `inParty` present and `leaderId !== own id`. Used by the auto systems.

**Follow + assist** (`server/src/systems/world/partyFollow.ts`, `updatePartyFollow` runs in
`World.tick` **before** `updateAutoTraverse`/`updateAutoTargets`): a follower with auto-combat on
trails the leader, assists against the leader's current attack target, and paths to the leader's
gate when the leader is in another zone (reuses `nodePath.ts` helpers + `updateTransitions`).
`updateAutoTargets` and `updateAutoTraverse` early-skip followers so this system owns their movement.
Approach uses the shared `steerTowardTarget(world, player, target)` extracted from `autoTarget.ts`
(ranged kite / melee close / reload-hold) — followers approach identically to solo auto-combat.

**Rewards** (`grantMonsterRewards` in `rewards.ts`): the per-player body is extracted into
`applyKillRewardsToPlayer`. On a kill, **every party member in the same node** as the kill earns
full rewards (essence, biome XP, quests, boss-clear credit). The `player-kill` floater stays keyed
to the killer; other members' essence rides their own `node:delta`. To split rewards equally later,
divide essence/biomeXp by recipient count inside `applyKillRewardsToPlayer` — single lever, not built.

**Client:** `inParty` flows into `PlayerView.partyLeaderId` / `partyMembers`. `deltaApplier.ts`
publishes `zonePlayersAtom` (same-zone players incl. `hp`/`maxHp`, for the In-Zone join list) and
`syncPlayerAtoms` sets `partyAtom` (own roster). `client/src/hud/PartyPanel.tsx` is an always-visible
**left** sidebar panel (between StatPanel and the debug panel); each roster row shows an HP bar looked
up from `zonePlayersAtom` (members in another zone show "away" since HP is only known for same-zone players). Intents route Join/Leave through
`hudBus.requestJoinParty/requestLeaveParty` → local `intents` bus → `hudEvents.ts` →
`party:join`/`party:leave` socket events.

---

## Monster mechanics

### Charge on aggro (`chargeOnAggro`)
`MonsterDefinition.chargeOnAggro?: { speedMult: number; durationMs: number }` — burst speed when the monster first acquires an aggro target (both pull-range and retaliation). Stored as `ai.chargeRemainingMs` in `MonsterAI`. During the charge, kite ramp does **not** accumulate (`ai.kiteTimer` stays frozen) so the ramp starts fresh from zero after the burst. Currently wired: boar (3.5×, 1.2 s), ancient-wolf (3×, 1 s), stone-eagle (3.5×, 1 s), stampede-bull (2.5×, 1 s), jungle-ape (2.8×, 1.1 s).

### Slow / root (`slowEffect`)
`MonsterDefinition.slowEffect?: { speedMult: number; durationMs: number }` — applied as a refreshing `'slow'` status effect in `playerCombatState` on every successful hit. `movement.ts` reads it and scales the player's effective speed by `speedMult`. `speedMult: 0` = full root (complete stop); `0 < speedMult < 1` = partial slow. Effect stores `{ speedMult, totalMs }` in `data` so `buffSync.ts` can compute the clock-sweep percentage. Displayed as a blue "Slow" or purple "Root" tile in the buff bar. Currently wired: sand-scorpion (0.5×, 2.5 s), stone-basilisk (root, 1.2 s).

### Deterministic evasion (`evadeEvery`)
`MonsterDefinition.evadeEvery?: number` — the monster dodges every Nth incoming player hit. Tracked in `monsterCombatState.counters['hitsTaken']`, which persists for the monster's entire lifetime and resets only on death. The evasion check runs before `makeCombatContext`; the attack cooldown is still consumed. Pushes a `{ kind: 'monster-dodge', monsterId }` event (client-side display not yet implemented — hit silently produces no damage number). Convention: `evadeEvery` must be ≥ 5 (maximum 1-in-5 dodge rate). Currently wired: giant-spider (5), mire-stalker (5), dune-asp (5).

### Ranged monsters (`isRanged`)
`MonsterDefinition.isRanged?: boolean` — marks a monster as ranged. Stored on `IsMonster` component and included in `MonsterView`. Client uses it to suppress the lunge animation (`!meta?.monsterIsRanged` gate in `monsters.ts`). Ranged monsters with a generic `impact` style should use `attackStyle: 'gunshot'` instead so they play the projectile FX. Monsters with a thematic special style (magic, poison, slash, etc.) keep it even when `isRanged: true`.

Currently tagged ranged monsters:
- `ridge-archer`, `canopy-sprite`, `peak-archer`, `cave-gargoyle` → `isRanged: true`, `attackStyle: 'gunshot'`
- `bog-witch` → `isRanged: true`, `attackStyle: 'magic'`
- `savanna-hawk` → `isRanged: true`, `attackStyle: 'slash'`
- `jungle-blowdarter`, `dune-asp` → `isRanged: true`, `attackStyle: 'poison'`

---

## Biome XP system

Players earn biome XP for kills in a biome; XP accumulates in `tracksProgression.biomeXP` (a `Record<biomeGroup, number>`). `tracksProgression.biomeLevel` is the current level of the active biome.

**Power curve:** `biomeXpForLevel(n) = round(BIOME_XP_BASE × n^BIOME_XP_EXPONENT)`
- `BIOME_XP_BASE = 80`, `BIOME_XP_EXPONENT = 1.7` (both in GAME_CONFIG)
- Level table: Lv1 → 80 XP, Lv2 → 260, Lv3 → 518, Lv4 → 845, Lv6 → 1831, Lv9 → 3848

Each level-up in a biome unlocks recipes tied to that biome+level. `unlockedRecipes` on `tracksProgression` is the authoritative set.

The helpers `biomeXpForLevel` and `biomeLevelCap` are exported from `@mmo-idle/shared` and used in both `rewards.ts` (level-up logic) and the client UI (`CraftingPanel`, `MapPanel`, `GameScene`). Never use `BIOME_XP_PER_LEVEL` — that constant no longer exists.

**Level cap formula:** `biomeLevelCap(playerTier, biomeGroup)` = `Math.max(4, playerTier * 4)`. The cap is a flat function of player tier only — it does not vary by the biome's native tier. Clearing is always 4. Minimum is 4 (so Tier 0 players still have a cap of 4 in non-clearing biomes). The function takes **two arguments** — there is no `biomeTier` parameter.

---

## Boss fight scripting (`bossScripts.ts`)

Bosses opt in by setting `bossScript` on their `MonsterDefinition`. The script is data-driven — no per-boss server code.

**Script shape:**
```typescript
interface BossScript {
  phases?:    BossPhase[];        // HP-threshold triggers, fire once per boss life
  repeating?: RepeatingAction[];  // periodic timers, run while engaged
}
interface BossPhase      { hpPct: number; actions: BossAction[]; }
interface RepeatingAction { intervalMs: number; initialDelayMs?: number; actions: BossAction[]; }
```

**Action types (`BossAction` discriminated union):**
| type | effect |
|---|---|
| `enrage` | Multiply attack (`atkMult`) and halve cooldown (`cdMult`); optional `durationMs` |
| `regen` | Heal `hpPctPerSec × maxHp` per second; optional `durationMs` |
| `shield` | Add `drAdd` flat damage reduction (capped at 0.95) for `durationMs` ms |
| `summon` | Spawn `count` copies of `monsterTypeId` near the boss |
| `stat-buff` | Multiply any one stat (`attack`, `speed`, `plating`, `damageReduction`); optional `durationMs` |

**Runtime state:** `entity.scriptsBoss: ScriptsBoss` — per-boss tracking on the monster entity (engaged flag, phase triggers, repeating timers, active effects). Removed when the monster entity is despawned. Never serialized.

**`hasStatus.bossEffects: string[]`** (boss monsters only) — populated each tick from active effect names; sent to client for HUD display.

Timers don't tick until a player aggros the boss (`state.engaged = true`). Active timed effects save original stat values and restore them on expiry.

---

## Equipment and defense

**Slots:** `weapon | armor | recovery | mobility`. Ring slots removed.

**Recovery archetypes** (via `mechanicEffects` passives):

| Archetype | Key passives |
|---|---|
| In-combat regen | `defense.in-combat-regen-pct` |
| Periodic shield | `defense.shield-pct` + `defense.shield-interval-ms` + `defense.shield-duration-ms` |
| Damage absorption | `defense.absorb-pct` |
| Burst HP regen | `defense.regen-burst-pct` + `defense.regen-burst-interval-ms` |
| Pure OOC regen | `hpRegen` only |

Shield `duration-ms` = `interval-ms` for clean 1:1 rotation. Omit/-1 for permanent.

**Defense passives** (`usesSkills.passives`, rebuilt each stat recalc):

| Passive key | Effect |
|---|---|
| `defense.in-combat-regen-pct` | Regen fraction applied in-combat |
| `defense.regen-burst-pct/interval-ms` | Burst HP regen on timer |
| `defense.shield-pct/interval-ms/duration-ms` | Periodic shield |
| `defense.absorb-pct` | Damage diverted to time-delay absorb pool |
| `defense.dot-resistance` | Fraction by which DoT damage is reduced |
| `defense.hit-to-dot-pct` | Fraction of incoming direct damage deferred as DoT |
| `defense.debuff-resistance` | Reduces debuff duration/potency |
| `defense.cleanse-stacks/interval-ms` | Periodic stack removal |

**Damage debt drain** (`server/src/systems/defense/mitigation/hitToDot.ts`, `runDebtDrain`): fires once per second (via `debtTick` cooldown) — not proportionally every tick. Each second drains 25% of the current pool; `Math.round(damage) < 1` is skipped. Absorb and burst pools use proportional per-tick drain but zero out when the pool falls below 0.5 to avoid asymptotic trickle.

---

## Item upgrade system

Items can be upgraded up to +3 (or however many steps are defined on that item). Upgrade state lives in `holdsInventory.itemUpgrades: Record<itemId, number>` (0 = not upgraded).

**Authoring upgrades:** Each `Recipe` in `shared/src/data/recipes/` has an optional `upgrades: UpgradeStep[]` array. The array length sets that item's max upgrade level. Each step is incremental (applied on top of all prior steps):

```typescript
interface UpgradeStep {
  stats?: Partial<ItemStats>;           // stat deltas (additive on base)
  mechanicEffects?: Record<string, number>; // mechanic effect deltas (additive)
  cost: Partial<Record<EssenceType, number>>; // can be multi-essence
  requiredBiomeLevel: number;           // biome level gate for this step
}
```

**Pipeline:** `Recipe.upgrades` → copied into `ItemDefinition.upgrades` by `itemDatabase.ts` → applied during `recalculatePlayerEntityStats` via `upgradeStatBonusTotal` + `upgradeMechanicEffectsTotal` from `shared/src/systems/itemUpgrades.ts`.

**Key functions (`shared/src/systems/itemUpgrades.ts`):**
- `getMaxUpgrade(item)` — `upgrades.length` or `MAX_UPGRADE` (3) for generic items
- `upgradeStatBonusTotal(item, plus)` — returns `Record<string, number>` of cumulative stat deltas across steps 0..plus-1
- `upgradeMechanicEffectsTotal(item, plus)` — same for mechanic effects
- `upgradeCostFor(item, targetPlus)` — returns `Partial<Record<EssenceType, number>> | null`
- `requiredBiomeLevelForUpgrade(item, targetPlus)` — reads from `item.upgrades[targetPlus-1].requiredBiomeLevel`
- `checkUpgrade({item, currentPlus, biomeLevel, essences})` — shared authority check (server + client)

Items without an `upgrades` array fall back to the old generic tier-based formula (still valid for legacy/starter items).

**Server:** `server/src/systems/player/economy/itemUpgrade.ts` handles the `inventory:upgradeItem` intent — validates via `checkUpgrade`, deducts all essence types in the cost record, increments `itemUpgrades[itemId]`, triggers stat recalc.

---

## Quest system

`QuestDefinition`: `id`, `name`, `tierRequired`, `targetMonsterTypes[]`, `killsRequired`. `registerKillForQuests` called after every kill via `grantMonsterRewards`. Awards XP on completion; `XP_PER_LEVEL = 100`, each level → 1 skill point. Quests are one-time. Add new entries to `QUEST_DATABASE` in `shared/src/quests/questDatabase.ts`.

---

## Class mechanics and skill tree

### Layout

```
T0 — 5 class roots          (archetype + identity defense mechanic)
T1 — 15 sub-variants        (light / balanced / heavy per class)
T2 — 3 universal range nodes (close / mid / far — same for ALL classes)
T3 — 45 path modifiers      (3 per class×variant, ALL hand-authored)
T4–7 — generated placeholders
```

T3 nodes are fully hand-authored. Generator produces T4–7 only.

### How passives flow

`recalculatePlayerEntityStats(world, entity)` (in `server/src/ecs/playerEntityFormulas.ts`, wrapping the shared formula) rebuilds `usesSkills.passives` from scratch on every skill unlock or equipment change. It iterates `usesSkills.unlockedSkills` → reads `node.mechanicEffects` → accumulates additively. Archetype systems read `usesSkills.passives` at combat time — no "apply on unlock" step.

### Class roots (T0)

| Class | Identity passive |
|---|---|
| Cooldown | `defense.in-combat-regen-pct: 0.12` |
| Cadence | `defense.regen-burst-pct: 0.08` every 10 s |
| DoT | `defense.dot-resistance: 0.12`, `defense.hit-to-dot-pct: 0.10` |
| Reload | Evasion identity; +105 range baseline |
| Energy | `defense.shield-pct: 0.06` every 14 s; +115 range baseline |

Energy and Reload start ranged. DoT is mid-range (+50 range). Cooldown and Cadence are melee.

### T1 stat profiles (cumulative root+variant)

Attack speed shown as `attackSpeedPct` total across root+variant. Positive = faster; values stack additively then apply as `round(baseCooldown / (1 + total))`.

| Class | Light | Heavy |
|---|---|---|
| Cooldown | +14 ATK, +6 HP, +15% AtkSpd | +49 ATK, +98 HP, +13 PLT, +18% DR, −20% AtkSpd |
| Cadence | +22 ATK, −4 HP, +20% AtkSpd | +38 ATK, +74 HP, +11 PLT, −15% AtkSpd |
| DoT | +30 ATK, −4 HP, +20% AtkSpd | +34 ATK, +68 HP, +10 PLT, +12% DR, −20% AtkSpd |
| Reload | +18 ATK, −26 HP, +15% AtkSpd | +24 ATK, +24 HP, +5 PLT, −10% AtkSpd |
| Energy | +14 ATK, −27 HP, +30% AtkSpd | +21 ATK, +19 HP, +4 PLT, +5% AtkSpd |

Energy light has +30% because the root already contributes +10% — the only T0 root with an attack speed bonus.

### T2 range nodes (universal)

- **range-close**: −40 range, +5 ATK, +15% AtkSpd, +3 PLT, +6% DR, +12 HP + class bonus
- **range-mid**: no changes
- **range-far**: +120 range, −8 ATK, −20% AtkSpd

### Reload multiplier (final layer in `shared/src/systems/stats.ts`)

```typescript
if (p.usesSkills.combatArchetype === 'reload') {
  p.dealsDamage.attack = Math.max(1, Math.floor(p.dealsDamage.attack * 0.5));
  p.performsAttack.attackCooldown = Math.max(200, Math.round(p.performsAttack.attackCooldown * 0.5));
}
```
Never fold the 0.5× into additive deltas.

**Plating compensation:** Because each shot deals half damage, flat plating would take a proportionally double bite. The `beforeAttack` listener in `reloadPrototype.ts` sets `ctx.platingMult = 0.5`, which halves the monster's effective plating in the damage formula (`player.attack - effectivePlating * ctx.platingMult`). This keeps reload throughput against plated targets equivalent to other archetypes at the same tier. `platingMult` lives on `CombatContext` (default `1.0`) — other archetypes ignore it.

---

### Archetype mechanics

#### Cadence (`cadencePrototype.ts`)
Hit counter → empowered finisher at `cadenceThreshold`. T1: Light (4 hits, 1.5×), Balanced (5, 2×), Heavy (6, 4×). **All 9 T3 paths implemented.**

- Light: Accelerando (finisher → speed stack), Cursed Finale (finisher → vuln+shred), Double Time (finisher strikes twice)
- Balanced: Rapid Tempo (−2 threshold), Rising Tide (pre-finisher momentum + echo), Delayed Verdict (detonating tag)
- Heavy: Overwhelming Force (+threshold/mult), Hemorrhage (finisher → refreshable DoT), Iron Patience (pre-finisher charge → bonus)

---

#### Cooldown (`cooldownPrototype.ts`, `cooldownT3.ts`)
Countdown timer fires empowered execution. T1: Light (5 s, 1.5×), Balanced (7 s, 2×), Heavy (9 s, 3×). **Light+Balanced T3 implemented; Heavy designed only.**

- Light: Overdrive (speed burst post-execution), Eternal Cycle (hit stacks → execution spends all), Temporal Extension (execution buff extends per hit)
- Balanced: Acceleration (each hit −1 s CD), Battery (CD ticks → damage stacks), Alignment (post-execution surge, then CD halved)
- Heavy (not implemented): Entropy Collapse, Singular Extraction, Channeled Beam

---

#### Energy (`energyPrototype.ts`, `energyT3.ts`)
Energy 0–100 fills on hits; at 100, next attack is Empowered. T1: Light (20/hit, 1.5×), Balanced (14/hit, 2×), Heavy (10/hit, 6×). Flash overrides this payoff: it builds 5 energy per hit and uses a blue/red shift curve instead of firing an empowered AoE. **All 9 T3 paths implemented.**

- Light: Flash (teleport into melee; Blue Shift at 0 energy is +45% damage, Red Shift at 100 energy is -45% damage, +45% attack speed, +45% evasion; shift decays back to Blue over 2s on disengage), Micro-Venting (energy consumed for on-hit bonus at >50%), Polarity Decay (reduced discharge → overcharge stacks)
- Balanced: Alternating Currents (charge/discharge phase loop), Harmonic Equilibrium (+60% dmg at 40–60% energy), Capacitor Shunt (reservoir amplifies discharge)
- Heavy: Singularity Execute (doubled cap, early discharge), Cascading Induction (Induction tags → exponential burst), Superconducting Mass (no basic dmg → charge pool → true dmg)

---

#### Reload (`reloadPrototype.ts`)
Magazine system — burst then reload window. T1: Light (5 rounds, 1500 ms), Balanced (8, 2000 ms), Heavy (12, 4000 ms). Reload class uses double APS / half dmg final multiplier — see above. **All 9 T3 paths implemented** in `server/src/systems/classes/archetypes/reload/t3/`.

**OOC auto-reload:** When the reload player leaves combat (`!inCombat` via `tracksEngagement` + `COMBAT_REGEN_DELAY`) with a partial clip (`ammo > 0 && ammo < ammoMax`) and no reload is already active, `updateReloadArchetype` immediately sets `ammo = 0` and starts a reload. OOC reloads (and any reload in progress when going OOC) tick at **2× speed**. Auto-combat AI (`autoTarget.ts`) stops the player from moving toward the next enemy while `usesReload.reloadingMs > 0 && !targetIsAggroed`; if an enemy aggros the player mid-reload, the normal ranged movement AI resumes immediately.

- Light: Laser (continuous heat-based beam), Hair Trigger (+5% attack speed per shot in clip, up to 5 stacks), Gatling (double mag/speed + knockback)
- Balanced: Death Mark (stacks → reload detonation), Suppressing Fire (plating shred stacks), Snipe (slow heavy shots, full-HP bonus)
- Heavy: Exploding Clip (last bullet 3× + AoE), Cover Fire (40% DR while reloading), Blunderbuss (close-range full-clip volley; knockback scales with pellets landed)

---

#### DoT (`dotPrototype.ts`, `dotT3.ts`)

Each player hit applies 1 DoT stack; stacks tick damage at configurable intervals (default 1 s). **All 9 T3 paths implemented.**

**Conversion model:** Each hit redirects `convPct` of direct damage into DoT. The hit deals `(1 − convPct)` of normal damage; the rest becomes `damagePerStack = attack × convPct / maxStacks` per tick.
- T0 baseline: 40% (fallback `DOT_CONVERSION_PCT = 0.40` in code)
- T1 Light (Poison): `dot.conversion-pct: 0.30`, 8 stacks
- T1 Balanced (Fire): `dot.conversion-pct: 0.50`, 6 stacks
- T1 Heavy (Frost): `dot.conversion-pct: 0.70`, 3 stacks

Never set a `dot.damage-per-stack` passive — `damagePerStack` is always derived from `dealsDamage.attack × convPct / maxStacks` at hit time.

**Diminishing returns tick formula:** `computeScaledDotDamage(effect)` = `dmgPerStack × sqrt(stacks × maxStacks)`. Same damage as linear at full stacks; boosted above linear at low stacks.

**Tick rate:** `dot.tick-interval-ms` passive changes tick frequency. Faster ticks = more DPS (not normalized). Default 1000 ms.

**Max-stacks refresh:** Hitting a maxed target only refreshes `damagePerStack` and `tickIntervalMs` — `nextTickIn` is never reset by the hit handler so fast attackers don't push the tick timer indefinitely into the future. The tick timer runs independently and resets only when a tick fires.

**DoT duration:** Player-applied DoT stacks expire after `DOT_DURATION_MS = 4500 ms` of no hits. Duration is refreshed (not stacked) on every hit via `remainingMs + refreshable: true` in `applyStatusEffect`. Permafrost is the only exception (`remainingMs: -1`, truly permanent). Duration is tunable per-skill-node via `dot.duration-ms` passive; monster-applied DoTs use `monsterDef.dotEffect.durationMs ?? 4500`.

**Monster → Player DoT:** `MonsterDefinition.dotEffect?: { damagePerStack, maxStacks, tickIntervalMs, durationMs? }`. Any monster with this field applies DoT stacks on each hit. The player-side tick loop in `updateDotArchetype` processes `tracksCombat`; DoT bypasses plating but `damageReduction` (%) and `dot-resistance` both apply. Respawn clears all status effects via `resetTracksCombat`. Currently wired: `bog-slime` (2/3/1000), `mud-toad` (3/3/1000), `bog-sovereign` (4/4/1000), `swamp-hydra` (4/4/1000), `jungle-snake` (3/4/1000), `jungle-blowdarter` (2/5/1000).

**T3 paths:**
- Poison: Poison Explosion (20-stack cap → 10-tick burst), Eternal Doom (no cap, diminishing returns formula), Invigorating Toxins (stacks boost player ATK+speed)
- Fire: Fan the Flames (2 stacks/hit at 50% dmg; max→burst), Smoldering Ember (stacks add % vuln), Conflagration (max stacks → 5×500ms fast ticks)
- Frost: Permafrost (1 permanent stack ramping +1% ATK/hit, max 35% at 35 hits), Freezing Cold (frost+chill; 3 chill → Freeze 2s), Glacial Fracture (max stacks → shatter burst)

**Key implementation flags:**
- `ctx.metadata['dotHandled']` — T3 handler sets this to suppress base stack application
- `ctx.metadata['dotConvApplied']` — T3 handler applies conversion reduction; base handler skips if already set
- `effect.data.t3Perm = 1` — Permafrost; skipped by `updateDotArchetype`, handled by `updateDotT3`
- `effect.data.isEternalDoom = 1` — uses `computeEternalDoomDamage` formula

---

## What is built

- 11×11 world, monster AI (aggro, kite prevention, leash), auto-targeting
- Dungeon nodes T1–T3 with scaled enemies and persistent bosses; 30 s boss respawn timer
- Per-biome mob density (`mobDensity`); `World.getMobDensity(nodeId)` helper
- Monster charge-on-aggro (`chargeOnAggro`), player slow/root (`slowEffect`), deterministic evasion (`evadeEvery`), ranged flag (`isRanged`) — see Monster mechanics section
- Boss fight scripting framework (`bossScripts.ts`) — data-driven phases, repeating timers, enrage/regen/shield/summon/stat-buff actions
- Quest system (kill-count quests → XP → skill points); QuestPanel
- Party system — single-level parties (`inParty` networked slice), click-to-join, follow + assist in auto-combat (`partyFollow`), same-zone full rewards; left-sidebar PartyPanel. See "Party system" section
- All 5 class archetypes with T0 roots and T1–T2 nodes; T3 fully implemented for Cadence, Energy, DoT, Reload; Cooldown light+balanced
- Defense/recovery system (5 recovery archetypes, all `defense.*` passives)
- Weapon families: Chaotic (axe + greataxe), Sacred (cross + consecrated), Burn (ashbrand + cinderfang + frostmourne); `onHitDamage` stat for flat on-hit weapons (Stinger Fang)
- T1 and T2 weapons (8 T2 weapons at biome level 9)
- Inventory/equipment (4 slots), crafting with biome XP unlock gates
- Item upgrade system (+1/+2/+3 per item, per-item stat+cost+biome-level defined in recipe files alongside the recipe); `UpgradeStep[]` on `Recipe` and `ItemDefinition`; `shared/src/systems/itemUpgrades.ts`
- Biome XP power-curve system (`biomeXpForLevel`); two-tab crafting panel (Biome Progress + Forge)
- Skill tree T0–T7 (T4–7 generated placeholders)
- Death/respawn split: `killPlayer` (corpse at death site, networked `isDead`) → `player:died` + grave render; `respawnPlayer` on `player:ackDeath` or 25s timeout / disconnect; `livePlayers` query excludes corpses from gameplay
- Node transitions
- Client HUD: stat panel, buff bar (category-distinct icons, slow/root debuff tiles), map (11×11 + dungeon/boss), skill tree, inventory, crafting, quest panel
- Mobile/tablet responsive HUD (≤ 1100px): fixed top bar, fixed AUTO button, slide-out menu drawer
- AoE framework; empowered AoE splash (80px, 0.5× ATK); debug range overlay
- Generic 5×5 spritesheet effect animation pipeline for status overlays and one-shot effects
- Split-tick loop (10 Hz logic, 5 Hz broadcast); combat event queue for animations
- Monster wander smoothing (80px hard-snap threshold)
- Postgres persistence (`server/src/db/`, `pg` + `drizzle-orm/node-postgres`) — accounts + characters (load on connect, save on disconnect + 30 s auto-save). All repo functions are async; DB calls happen outside the hot tick loop (boot, socket connect/disconnect, autosave). Connects via `DATABASE_URL`; local dev uses the docker-compose Postgres. Frozen nodes do not persist monster state; monsters are regenerated from biome definitions when a node thaws. Monster IDs use compound form `{nodeId}_monster-{N}` for global uniqueness.
- Railway deploy config (`railway.json`) + local Railway simulation (`Dockerfile` + `docker-compose.yml`); SQLite replaced by Postgres
- DoT duration system — stacks expire after 4.5 s without a hit; damage debt drains once/second
- DoT kills push `player-kill` combat events — `updateDotArchetype`, `updateConflagration`, and `updatePermafrost` all call `world.pushEvent('player-kill', ...)` after `grantMonsterRewards`, matching the regular-attack kill path so reward floaters and death effects display correctly on DoT kills
- LAN play — client served as static files from Express; `pnpm play` builds + starts
- T1 density-based balance pass; full T2 monster redesign (7 biomes × 3 mobs each, all new mechanics)
- Y-sort draw order (`DEPTH` constant bands in `GameScene.ts`; per-frame `setDepth(BAND + baseY)` in `stepEntities`)
- Tab-switch desync fix (dt cap 100 ms, position snap on `visibilitychange`, `document.hidden` guards on all tween functions)
- Evasion stacking fix — `evasion` stat values are combined as independent dodge probabilities (`1/N` per source, `threshold = round(1/sum)`); single-source behavior unchanged, stacking always improves evasion
- `isMeleeArchetype(archetype, unlockedSkills?)` in `shared/src/data/skillTree/rootsAndFrames.ts` — cadence/cooldown/null are melee; range nodes override (range-close forces melee, range-mid/far forces ranged); used to gate player lunge in `players.ts` and `combatFx.ts`
- Ranged monster lunge suppression — `isRanged` flag on `MonsterDefinition` flows to `MonsterView`; client skips lunge for ranged monsters; 8 monsters tagged; `gunshot` added to `ATTACK_FX_BY_STYLE`
- Reload T3 — Light/Balanced/Heavy all implemented (`reload/t3/`); lifecycle hooks via `reloadLifecycle.ts`, proc damage via `procDamage.ts`
- Reload OOC auto-reload and movement hold — see Reload archetype section
- Players start with no equipment (basic sword removed from `buildFreshSlices` in `playerRepo.ts`)

## What is NOT built (do not hallucinate these)

- [ ] Discord OAuth / login screen / character select
- [ ] Multiple World instances / node routing
- [ ] Finish Railway deployment (config + Postgres + Docker simulation are in place; remaining: provision/attach `gamedb` env var, first deploy, verify)
- [ ] World map click-to-navigate
- [ ] Cooldown heavy T3 (Entropy Collapse, Singular Extraction, Channeled Beam)
- [ ] T4–7 mechanics (all placeholders)
- [ ] StatPanel update for evasion/shields/absorb/burst-regen display
- [ ] Client-side `monster-dodge` visual (server pushes the event; client ignores it — no floating DODGE text yet)
- [ ] T3 monster balance pass (tundra T3 mobs are placeholder stats)

---

## Project state

**Priority order:**
1. Finish Railway deploy (set `DATABASE_URL=${{gamedb.DATABASE_URL}}` on the app service, deploy, verify)
2. Playtest T1/T2 balance
3. Implement Cooldown heavy T3
4. T3 biome/monster design

**T1 biome threat profiles (density-balanced):**

| Biome | Density | Threat profile | Key defense | eHP range |
|---|---|---|---|---|
| Plains | 16 | Balanced, no specialization; boar charges on aggro | none | 55–75 |
| Forest | 13 | Fast sustained attacks, low defense — burst-able | none | 60–70 |
| Swamp | 10 | Attrition — DoT on every hit, defensive stats | PLT 2–3, DR 4% | 120–175 |
| Mountain | 7 | Cliff Hoppers (fast+high pull) + Ridge Archers (130 range) | none | 175–200 |
| Caverns | 5 | High defense, hard slow hits — spikiest T1 | PLT 4–7, DR 5–10% | 230–340 |

**T2 biome threat profiles:**

| Biome | Density | Threat profile | New mechanics |
|---|---|---|---|
| Plains | 16 | Low-eHP speedsters + aerial ranged threat | stampede-bull charges, savanna-hawk (range 165) |
| Forest | 13 | Charging wolves + DR sentinel + long-range sprite | ancient-wolf charges, canopy-sprite (range 190) |
| Swamp | 10 | Multi-head DoT tank + ranged witch + evasive stalker | hydra DoT (4×4), bog-witch (range 180), mire-stalker (evade/5) |
| Mountain | 7 | DR bruiser + dive-bombing charger + extreme-range archer | peak-archer (range 240 — longest in game) |
| Caverns | 5 | Evasive spider + colossal troll + ranged gargoyle | spider (evade/5), cave-gargoyle (range 200) |
| Jungle | 15 | Dense DoT — snake, charging ape, ranged blowdarter | all three apply poison DoT |
| Desert | 14 | Control biome — scorpion slows, basilisk roots, asp evades | slowEffect + evadeEvery; tundra moved to T3 |

Tundra is T3-minimum (no T2 tundra nodes). Desert fills the control-biome slot at T2.

T1 bosses: 400–700 HP, 14–22 ATK. T2 bosses: not yet balanced (stats inherited from original design).

---

## Coding conventions

- **TypeScript strict mode** — no `any`, no non-null assertions without comment
- **No build step for shared** — import from `@mmo-idle/shared` directly
- **Server is source of truth** — client sends intent, renders what server sends
- **One feature at a time** — implement shared → server → client
- **StatusEffect data is `Record<string, number>`** — numeric flags (0/1), never strings
- **T3 listener ordering** — call `initXxxT3()` before `registerCombatListener` inside `initXxxArchetype()` so T3 handlers fire before base prototype
- **Passives are rebuilt on every stat recalc** — never apply `mechanicEffects` imperatively; they accumulate into `usesSkills.passives` during `recalculatePlayerEntityStats()`
- **DoT damage-per-stack is derived, never hardcoded** — use `attack × dot.conversion-pct / maxStacks`; never set `dot.damage-per-stack` directly
- **Map TypeScript inference** — use explicit generics (`new Map<string, Recipe>([...])`) for `RECIPE_DATABASE`, `SKILL_TREE`, `QUEST_DATABASE`
- **Reload multiplier is a final layer** — apply `* 0.5` to `dealsDamage.attack` and `performsAttack.attackCooldown` at the end of `recalculatePlayerStats()`, never additively
- **Attack speed in skill nodes is `attackSpeedPct`** — percentage modifier (e.g. `0.15` = +15%); all unlocked nodes sum additively, applied once as `round(baseCooldown / (1 + total))`. Never use flat ms deltas in `StatEffects`; flat ms only belongs in temporary runtime buffs.
- **Reload plating compensation** — `reloadPrototype.ts` sets `ctx.platingMult = 0.5` in `beforeAttack`; `combat.ts` applies `effectivePlating * ctx.platingMult`. Never add an archetype check inside the damage formula itself.
- **Upgrade steps are incremental, not cumulative** — each `UpgradeStep.stats` is the delta for that level only; `upgradeStatBonusTotal` sums steps 0..plus-1 to get the total. Never store cumulative totals in the step.
- **`upgradeStatBonusTotal` returns a record** — signature is `(item: ItemDefinition, plus: number): Record<string, number>`. It is NOT `(slot, tier, plus)`. Callers that need the primary-slot stat pick it out: `upgradeStatBonusTotal(def, plus)[UPGRADE_STAT_BY_SLOT[slot]] ?? 0`.
- **`upgradeCostFor` returns multi-essence** — `Partial<Record<EssenceType, number>> | null`, not `{ type, amount }`. The server iterates all entries to deduct; the client passes it directly to `CostDisplay`.
- **Upgrade steps belong in the recipe file** — add `upgrades: UpgradeStep[]` next to the item's other fields in `shared/src/data/recipes/`. `itemDatabase.ts` copies it through automatically. Never define upgrade data elsewhere.
- **Evasion is a fraction (0–1), higher = better** — `evasion: 0.20` means 20% of hits are deterministically evaded. In `recalculatePlayerStats`, sources add directly (`evasionChance += value`); combined into `dodgeRate` via `evasionDodgeRate()`. Single source `evasion: 0.20` → fires every 5 hits. Two sources of `0.20` → `0.40` → fires every 2.5 hits. Never use the old 1/N integer notation.
- **`isMeleeArchetype(archetype, unlockedSkills?)` is the single source of truth for melee/ranged** — defined in `shared/src/data/skillTree/rootsAndFrames.ts`, exported from `@mmo-idle/shared`. Cadence, cooldown, and null (unclassed) are melee. Range nodes override: range-close forces melee, range-mid/far forces ranged. Use this function everywhere (player lunge, future stat multipliers) — do not re-derive from attackRange or archetype name.
- **Ranged monster `attackStyle`** — ranged monsters that previously used generic `impact` should use `gunshot` instead. Monsters with a thematic style (magic, poison, slash) keep it even when `isRanged: true`.
- **Boss script stat modifications use save-original pattern** — `ActiveBossEffect` stores the pre-buff stat value; restored on expiry. Overlapping same-stat effects from multiple sources are not supported (last write wins)
- **`biomeXpForLevel` is the only XP threshold function** — there is no flat `BIOME_XP_PER_LEVEL` constant; always go through the formula
- **`biomeLevelCap` takes two args** — `(playerTier, biomeGroup)`. No `biomeTier` parameter. Cap = `Math.max(4, playerTier * 4)`. Never pass three args.
- **Slow effect stores `totalMs` in data** — when applying `'slow'` status effect, always include `data: { speedMult, totalMs }` so `buffSync.ts` can compute the clock-sweep `durationPct`.
- **`evadeEvery` minimum is 5** — never set lower; convention is max 1-in-5 dodge rate.
- **Node freeze/thaw — monsters are ephemeral** — never serialize monster combat state (`tracksCombat`, aggro, movement, status effects, boss runtime markers, etc.). When the last player leaves a node, `freezeNode` removes all live monsters; `thawNode` regenerates population via `ensurePopulation` + `ensureBoss`. Use dev `debug:respawnNode` to force a fresh spawn in the current node.
- **Per-biome density via `mobDensity`** — never hardcode `GAME_CONFIG.MONSTERS_PER_NODE` in spawn loops; always go through `World.getMobDensity(nodeId)`.

### ECS conventions (server)

- **Component shapes live in `shared/src/components/`** — slice interfaces, status helpers, marker components, and pure factories (`initUsesCadence`, etc.). Import from `@mmo-idle/shared`; do not add server re-export shims.
- **Server owns miniplex wiring** — `ServerEntity` in `server/src/ecs/entity.ts`, typed queries on `World.ts` (`playerEntities`, `dottedMonsters`, `bossScriptedMonsters`, …), and `World.buildNodeDelta()` serializes allowlisted component slices at the broadcast boundary.
- **Entity-native game logic** — systems mutate slice fields on `PlayerEntity` / `MonsterEntity` directly. No snapshot round-trip for stat recalc, archetype slice sync, DB hydrate, persistence, or monster spawn.
- **Persistence is component-shaped** — the Postgres `characters` table stores one JSON `text` column per persisted player slice (`isPlayer`, `hasPosition`, `hasHealth`, `tracksProgression`, `holdsInventory`, `usesSkills`). Runtime-only slices and `usesSkills.passives` are rebuilt on attach/recalc, not persisted. Timestamp columns are `bigint` (`Date.now()` overflows Postgres `int4`). All repo functions are async (`pg`); fire-and-forget writes (disconnect/autosave) capture the slice snapshot synchronously via `JSON.stringify` before the awaited query, so the persisted state is correct without awaiting.
- **Component presence gates behavior** — `if (entity.usesCadence)`, not `combatArchetype === 'cadence'`; `entity.isMoving` exists only while motion is active; `hasAttackTarget` / `hasAggroTarget` exist only while a target is active; shield/evasion/channel/empowered/boss-engaged states are presence components, not disabled sentinels inside always-present slices.
- **Detach absent behavior promptly** — use `attachComponent` / `detachComponent` (or focused helpers like `setEntityMotion`, `stopEntity`, `setAttackTarget`, `setAggroTarget`) when behavior starts/stops. Do not encode absence as zero motion, empty shield arrays, null target ids, false channel flags, or zero-duration sub-state.
- **Networked slice mutations mark dirty** — `attachComponent` / `detachComponent` notify the dirty tracker automatically; direct in-place networked slice writes should call `markSliceDirty` or go through `mutateSlice`.
- **Lookup-only status effects** stay in `tracksCombat.statusEffects` without markers. Add a `hasX` marker only when a tick loop must iterate every entity with the effect (see `design_docs/architecture.md` slice taxonomy).
- **`syncPlayerBuffs` is entity-native** — `BuffProjectionContext.player` is `PlayerEntity`; descriptors read slices, not assembled snapshots.
- **Dev boot checks** — `[marker-invariants]` and `[network-invariants]` run on server start in dev mode and verify status markers, archetype slice presence, and networked component allowlists.
