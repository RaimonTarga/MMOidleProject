# MMO Idle — Project Context for Claude Code

Read this file before touching any code. It is the single source of truth for
architecture decisions and conventions.

---

## What this project is

A browser-based hobbyist MMORPG / idle game. Target: ~100 concurrent players
(friends). No PvP. Combat is automatic — the player builds the character and
makes strategic decisions; no twitch input required.

Key design axioms:
- **Server is authoritative.** All game logic (movement, combat, damage, spawn)
  runs in the server tick. The client renders state it receives.
- **Split-tick architecture.** Logic runs at 10 Hz; broadcasts go out at 5 Hz.
  Combat events are queued between broadcasts so animations and combat-log entries
  are never lost to timing gaps.
- **Simplicity over cleverness.** This is a hobby project maintained with LLM
  help. Prefer readable, obvious code over clever abstractions.

---

## Monorepo layout

```
/
├── CLAUDE.md               ← you are here
├── map-editor.html         ← standalone biome editor (open in browser, no build needed)
├── package.json            ← root (scripts only, no runtime deps)
├── pnpm-workspace.yaml     ← three packages: client, server, shared
├── tsconfig.base.json      ← shared TS compiler base
├── shared/
│   └── src/
│       ├── index.ts        ← ALL shared types, socket event maps, constants
│       ├── skillTree.ts    ← SKILL_TREE map (tiers 0-3 hand-authored, 4-7 generated)
│       ├── biomeDatabase.ts  ← BiomeDefinition, BIOME_DATABASE, bossPoolByTier
│       ├── monsterDatabase.ts ← MonsterDefinition (isBoss?), MONSTER_DATABASE
│       ├── itemDatabase.ts
│       └── recipeDatabase.ts
├── client/
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── main.ts         ← Phaser bootstrap (Game config + scene list)
│       ├── hudBus.ts       ← reactive event bus for HUD state
│       ├── hud/
│       │   ├── HUD.tsx / hud.css   ← sidebars, StatPanel, BuffBar, EssencePanel
│       │   └── MenuButtons.tsx     ← right sidebar panel toggles + debug range overlay toggles
│       ├── ui/
│       │   ├── SkillTreePanel.tsx / skillTree.css
│       │   ├── InventoryPanel.tsx / inventory.css
│       │   ├── CraftingPanel.tsx / crafting.css
│       │   ├── QuestPanel.tsx      ← quest progress display
│       │   └── MapPanel.tsx / map.css  ← 11×11 tile grid, dungeon tile visuals, boss info
│       └── scenes/
│           └── GameScene.ts ← main scene: socket connection, entity rendering, debug overlays
└── server/
    └── src/
        ├── index.ts        ← Express + Socket.IO + game loop
        ├── world/
        │   ├── World.ts        ← mutable state + tick() + ensureBoss() for dungeons
        │   └── nodeRegistry.ts ← 11×11 node grid built from NODE_BIOMES
        └── systems/
            ├── combat.ts, combatPipeline.ts, combatState.ts, attackCounter.ts
            ├── stats.ts, movement.ts, ai.ts, autoTarget.ts, transitions.ts
            ├── aoeDamage.ts    ← applyPlayerAoe / applyMonsterAoe helpers
            ├── rewards.ts, statusEffects.ts, defenseSystems.ts, weaponEffects.ts
            ├── questSystem.ts  ← kill-count quest system + XP leveling
            ├── cadencePrototype.ts   ← all 9 cadence T3 mechanics live here
            ├── cooldownPrototype.ts, cooldownT3.ts
            ├── energyPrototype.ts, energyT3.ts, reloadPrototype.ts
            ├── dotPrototype.ts, dotT3.ts
            └── buffSync.ts     ← populates player.activeBuffs each tick
```

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript everywhere | Strict mode on |
| Client framework | Phaser 3 | Sprites/scenes/camera/tweens |
| Client HUD | React 18 + inline CSS | Overlaid on Phaser canvas |
| Client build | Vite 5 | Dev server on port 3000 |
| Server runtime | Node.js + tsx | tsx for dev (no compile step); `tsc` for prod build |
| HTTP / API | Express 4 | Auth routes, health check |
| Realtime | Socket.IO 4 | One room per node instance |
| Database | SQLite + Drizzle ORM | Not yet wired up |
| Auth | Discord OAuth | Not yet wired up |
| Package manager | pnpm workspaces | Always run `pnpm install` from repo root |

---

## Running the project

```bash
# Install (run once, or after adding deps)
pnpm install

# Dev — run in two separate terminals
pnpm dev:server   # http://localhost:4000
pnpm dev:client   # http://localhost:3000

# Map editor — open directly in browser (no server needed)
# open map-editor.html
```

---

## Shared package (`@mmo-idle/shared`)

**Everything that crosses the client/server boundary lives here.**

- Entity shapes: `PlayerState`, `MonsterState`, `NodeSnapshot`
- `CombatEvent` union type — `player-hit` and `player-kill` events queued per-node between broadcasts
- Databases (read-only): `ITEM_DATABASE`, `MONSTER_DATABASE`, `BIOME_DATABASE`, `RECIPE_DATABASE`, `SKILL_TREE`
- Socket event maps: `ServerToClientEvents`, `ClientToServerEvents`
- Game constants: `GAME_CONFIG`
- `NODE_BIOMES`: record keyed by `node-{row}-{col}` mapping to `{ biomeGroup, biomeTier, isDungeon? }`
- `QUEST_DATABASE`: `Map<string, QuestDefinition>` with populated tier-0 through tier-4 quests
- `XP_PER_LEVEL = 100`: XP required per progression level; each level grants 1 skill point

The package exports TypeScript source directly (`main: ./src/index.ts`).
Both Vite and tsx resolve it without a build step.

**When adding a new entity or socket event, always start in `shared/src/index.ts`
and propagate outward.** Never define entity shapes inline on client or server.

---

## Socket event conventions

| Event | Direction | Description |
|---|---|---|
| `state:sync` | S→C | Full node snapshot sent to a newly connected player |
| `node:state` | S→C | Authoritative world snapshot broadcast every server tick |
| `player:died` | S→C | Sent to the player whose HP reached zero (before respawn) |
| `crafting:result` | S→C | Success or failure response to a craft attempt |
| `player:move` | C→S | Client requests movement to (x, y) |
| `player:setAuto` | C→S | Enable/disable server-side auto-targeting |
| `player:unlockSkill` | C→S | Unlock a skill tree node by ID |
| `inventory:equipItem` | C→S | Equip an item from inventory |
| `inventory:unequip` | C→S | Move equipped item back to inventory |
| `crafting:craftRecipe` | C→S | Attempt to craft a recipe |

New events must be typed in `ServerToClientEvents` or `ClientToServerEvents`
before being emitted. Player join/leave is communicated implicitly — players
that appear in or disappear from `node:state` snapshots are added/removed by
the client's `applySnapshot`, so no dedicated events are needed.

---

## Server architecture

`server/src/index.ts` is intentionally flat. It contains:

1. **Express setup** — CORS, JSON body parser, health endpoint at `GET /health`
2. **Socket.IO setup** — typed with shared event maps
3. **Combat mechanics registration** — class archetypes and weapon effects registered at startup
4. **Game loop** — two decoupled intervals:
   - **Logic tick** at `GAME_CONFIG.LOGIC_TICK_RATE` (10 Hz / 100 ms): calls `world.tick(dt, now)` and drains `world.pendingDeaths`.
   - **Broadcast tick** at `GAME_CONFIG.BROADCAST_TICK_RATE` (5 Hz / 200 ms): calls `world.buildSnapshot(nodeId)` once per occupied node and emits `node:state` to each player in that node. Building once per node ensures the combat-event queue is flushed exactly once so all players see the same events.
5. **Socket handlers** — `connection`, `disconnect`, and all `ClientToServerEvents`

`server/src/world/World.ts` owns all mutable state and orchestrates system calls in `tick()`.
`server/src/systems/` contains one file per system (combat, movement, AI, transitions, etc.).

### Combat pipeline

All damage flows through `combatPipeline.ts` — a simple event bus with phases:
`beforeAttack` → `onAttack` → `onHit` → `onDamageTaken` → `afterHit` → `onKill`

Register listeners via `registerCombatListener`. Class archetypes and weapon effects
hook into these phases. `CombatContext` is a mutable bag that flows through all handlers
for a single attack; handlers can read and write `ctx.damage`, `ctx.cancelled`, and
`ctx.metadata` freely.

**Combat event queue:** Per-tick boolean flags on `PlayerState` were replaced by a
`CombatEvent` queue to avoid events being lost between the 10 Hz logic tick and the
5 Hz broadcast tick.

- `world.pushEvent(nodeId, event)` — called by `combat.ts` after every player attack.
  Emits a `player-hit` event (with exact damage, `empowered`, `execution` flags) and a
  `player-kill` event on monster death.
- `world.buildSnapshot(nodeId)` — returns queued events for the node and clears the queue.
  Called once per node per broadcast cycle so every player in the node sees the same flush.
- `NodeSnapshot.events: CombatEvent[]` — sent to the client alongside players/monsters.
- Client `processCombatEvent()` — fires after `upsertPlayer` in each `applySnapshot` call.
  Logs damage-out/empowered/execution to the combat log, spawns the correct attack effect,
  and triggers the melee lunge — all with the exact flags from the server event.
- Own player's attack animation comes entirely from events; other players' attacks still
  use the `lastAttackAt > prevLastAttackAt` trigger (no empowered flags for others).

Do **not** re-introduce per-tick booleans on `PlayerState` for animation signaling. Use
`pushEvent` instead. `empoweredReady`/`executionReady` are HUD display fields only.

**Retaliation aggro:** When a player hits a monster that has no current aggro target,
`combat.ts` immediately sets `ai.aggroTargetId = player.id`. This fires even when the
player attacked from outside the monster's pull range. The `ai.ts` system preserves this
aggro (it only calls `findAggro` to acquire new targets, never to clear existing ones).

### AoE damage (`aoeDamage.ts`)

Two helpers exist for circle-area damage:
- `applyPlayerAoe(world, attacker, centerX, centerY, radius, baseDamage, excludeId?)` —
  hits all monsters in the node within `radius` of the center, applying per-target plating
  and DR. Kills are cleaned up immediately.
- `applyMonsterAoe(world, attacker, centerX, centerY, radius, baseDamage, excludeId?)` —
  hits all players in the node within `radius`, respawning on lethal hits.

AoE **bypasses the combat pipeline** intentionally — it is a bonus effect, not a primary
attack, and skipping the pipeline prevents recursive AoE chains.

**Empowered AoE:** Every empowered hit (cadence finisher, energy discharge, cooldown
execution, reload empowered) automatically triggers `applyPlayerAoe` centered on the
primary target. Constants in `GAME_CONFIG`:
- `EMPOWERED_AOE_RADIUS: 80` — blast radius in pixels
- `EMPOWERED_AOE_MULT: 0.5` — splash damage = `player.attack * 0.5` (raw stat, not
  the empowered-multiplied damage, to keep splash proportional to base power)

### Monster AI (`ai.ts`)

**Aggro acquisition vs. retention** — these are separate concerns:
- **Acquisition**: `findAggro` scans pull range and runs only when `ai.aggroTargetId === null`.
  This means retaliation aggro set by the combat system is never overwritten by a failed
  pull-range scan.
- **Retention**: existing aggro is kept as long as the target is in the same node and the
  monster hasn't exceeded its leash range. Only node change, disconnect, or leash break
  clears aggro.

**Kite prevention** — `MonsterAI` carries two extra fields:
- `baseSpeed: number` — speed from `MONSTER_DATABASE`, never modified by buffs
- `kiteTimer: number` — ms spent chasing without reaching attack range

While a monster is in `chasing` state, `kiteTimer` accumulates. After `KITE_GRACE_MS`
(3 000 ms) the monster's speed ramps at `KITE_RAMP_RATE` (25%/s) up to `KITE_MAX_MULT`
(2.5×). When the monster enters attack range or drops aggro, both timer and speed reset
to baseline.

**Auto-target positioning** (`autoTarget.ts`) — players stop at `attackRange * 0.70`
rather than `attackRange - 1`. The 30% buffer prevents stutter-stepping at the range
edge when the target is moving.

### Combat state

Per-entity server-only state lives in `CombatState` (`combatState.ts`). It has typed
buckets: `counters`, `resources`, `resourceMaxes`, `cooldowns`, `flags`, `stacks`, `strings`, `statusEffects`.
Use the accessor helpers — never read/write the raw object fields directly. All cooldowns
are decremented by `updateCombatState` at the top of every tick.

**StatusEffect API:** `applyStatusEffect` (stacking mode — adds 1 stack per call, data only
set on creation), `removeStatusEffect`, `getTotalStacks`, `hasStatusEffect`. The `data` field
is `Record<string, number>` — use numeric flags, not strings.

For "every N hits do X" mechanics, use `registerAttackThreshold` from `attackCounter.ts`
rather than rolling custom counter logic.

### `buffSync.ts`

Runs at the end of every tick. Reads player and monsterCombatState to populate
`player.activeBuffs: PlayerBuff[]`, which the client renders as-is without knowing
specific mechanics. Add new buff entries here as mechanics are implemented.

---

## Client architecture

`GameScene.ts` is the main (and currently only) Phaser scene.

- Connects to `http://localhost:4000` via Socket.IO on `create()`
- Maintains `Map<string, Visual>` for players and monsters
- `Visual` holds the sprite, labels, HP/CD bars, interpolation targets, and
  `playerState?: PlayerState` (the latest authoritative snapshot for player visuals).
  Monster visuals also carry `pullRange`, `leashRange`, `monsterAttackRange`.
- `applySnapshot()` is called on both `state:sync` and `node:state`. Order: remove
  gone players → upsert players → **process `snapshot.events`** → remove gone monsters
  → upsert monsters. Events are processed after player upsert so `playerState` is current.
- Click-to-move: sends `player:move`, updates local target optimistically for smooth feel
- Boss monsters render at 54×54 with a `⚠ {name}` label in bold `#ffcc44`
- **Debug range overlay**: `debugGraphics` layer (depth 8) redrawn every frame.
  Two flags — `debugPlayerRange` (own attack range, yellow-green) and `debugEnemyRanges`
  (per-monster: pull=orange, leash=dim blue, attack=red). Toggled via the Debug panel
  in the right sidebar; HUD dispatches `CustomEvent`s that GameScene listens for.

**The React HUD** is overlaid on the Phaser canvas (positioned absolutely). It uses
`hudBus.ts` (a simple pub/sub singleton) for state. It is **not** React roots inside
Phaser — it is a separate `<div>` in index.html rendered by ReactDOM.

**BuffBar.tsx** — renders `player.activeBuffs` as 52 px colored icon tiles anchored to the
top-left corner (not bottom-left). Each icon shows a clock-sweep overlay: a conic-gradient
darkens the icon clockwise from 12 o'clock as the buff elapses (`durationPct` 100→0).
Stack count shows as a badge in the bottom-right corner. A short label sits below each icon.
Buff categories (`cadence`, `cooldown`, `energy`, `dot-poison`, `dot-fire`, `dot-frost`,
`dot-frozen`, `weapon`) get distinct CSS animation classes (`buff-cat-{category}`) and shapes
via inline `borderRadius`/`clipPath`. Category is inferred from the buff ID at render time.

**StatPanel.tsx** — The DoT section detects the player's active T3 path from `player.passives`
keys and renders path-appropriate pip colors (green/orange/blue) and correct max stacks.
Frost path also shows `player.targetChillStacks` with chill pips + "FROZEN" indicator.

**MapPanel.tsx** — 11×11 tile grid (center node-5-5 = clearing). Dungeon tiles
(`NODE_BIOMES[id].isDungeon === true`) receive the `map-tile--dungeon` class (red border,
darkened filter) and show a "DUNGEON" badge. The hover info panel shows a boss section
from `biome.bossPoolByTier` when the node is a dungeon, plus a warning line with the
stat multipliers (×2 HP · ×1.6 ATK).

**QuestPanel.tsx** — always-visible panel in the right sidebar showing current quest
progress (kill counts) and XP/level toward the next skill point.

---

## Map editor

`map-editor.html` at the repo root is a standalone browser tool — open directly, no build.
It renders an 11×11 tile grid that mirrors `NODE_BIOMES` in `shared/src/index.ts`.
Use it to visually design biome assignments, then copy the generated `NODE_BIOMES` output
back into `shared/src/index.ts`. The server and client both read `NODE_BIOMES` to derive
node properties (exits, biome, tier, dungeon flag), so the editor is the canonical
way to plan map layout without hand-editing the raw record.

---

## Art / assets

Placeholder colored rectangles only. Real sprites to be decided later.
Do not introduce an asset pipeline or loader until art is decided.

- Own player: green `0x44ff88`
- Other players: blue `0x4488ff`
- Monsters: color defined per-monster in `MONSTER_DATABASE`

---

## World map layout

The world is an **11×11 grid** of nodes. Center `node-5-5` is the starting clearing (T0).
Chebyshev distance from center determines tier band:

| Distance | Tier | Content |
|---|---|---|
| 0 | T0 | Starting clearing |
| 1–2 | T1 | Basic biomes (forest, mountain, plains, cave, swamp, jungle) |
| 3 | T2 | Harder biomes + first dungeons (tundra, desert, volcanic, etc.) |
| 4 | T3 | Elite biomes + tier-3 dungeons |
| 5 | T4 | Edge — T4 biomes (content partially planned) |

`nodeRegistry.ts` generates all 121 node definitions from `NODE_BIOMES` automatically.
Exits are computed from coordinates (no manual wiring needed).

---

## Dungeon system

Multiple dungeon nodes exist across the map at tiers 1–3.

**Dungeon rules:**
- Non-boss monsters in dungeon nodes have stats scaled by `DUNGEON_HP_MULT = 2.0` and
  `DUNGEON_ATK_MULT = 1.6` applied in `World.createMonster()`.
- `MonsterState.isBoss` is `true` for boss monsters and `false` for all others.
- `MonsterState.leashRange` is serialized and sent to clients (used by the debug overlay).
- `World.ensureBoss(nodeId)` maintains exactly one boss per dungeon node; called in
  both `init()` and each `tick()`. Bosses do not count toward the regular `MONSTERS_PER_NODE` cap.
- Boss monsters are defined in `MONSTER_DATABASE` with `isBoss: true` and listed
  in `BiomeDefinition.bossPoolByTier` (keyed by biomeTier).
- Notable bosses: **Glacial Colossus** (tundra T2), **Infernal Tyrant** (volcanic T2).

---

## Equipment slots

Four slots: `weapon`, `armor`, `recovery`, `mobility`.
Ring slots (`ring1`, `ring2`) were removed and do not exist anywhere in the codebase.

`EquipmentSlot = 'weapon' | 'armor' | 'recovery' | 'mobility'`

### Recovery slot archetypes

Recovery items follow five design archetypes (implemented via `mechanicEffects` passives):

| Archetype | Key passive | Example items |
|---|---|---|
| In-combat regen | `defense.in-combat-regen-pct` | Plains Core, Stalwart Core, Ember Core |
| Periodic shield | `defense.shield-pct` + `defense.shield-interval-ms` + `defense.shield-duration-ms` | Granite Barrier, Frost Barrier |
| Damage absorption | `defense.absorb-pct` | Murk Eye, Sand Golem Eye |
| Burst HP regen | `defense.regen-burst-pct` + `defense.regen-burst-interval-ms` | Pulse Stone, Resonant Gem |
| Pure OOC regen | `hpRegen` only | Heartroot Amulet, Verdant Amulet |

All recovery items also provide some base OOC `hpRegen`.

**Shield duration:** `defense.shield-duration-ms` — if set, shields expire after that many ms
even if not depleted. Set equal to `defense.shield-interval-ms` for clean 1:1 rotation
(old shield expires exactly when the next fires). Omit or set to -1 for permanent shields.

---

## Defense and recovery passive system

`defenseSystems.ts` reads `player.passives` each tick to apply recovery effects.
`player.passives` is rebuilt by `recalculatePlayerStats()` from skills + equipped items.

| Passive key | Effect |
|---|---|
| `defense.in-combat-regen-pct` | Fraction of normal OOC regen applied even while in combat |
| `defense.regen-burst-pct` | HP % restored in a burst on a timer |
| `defense.regen-burst-interval-ms` | Cooldown between burst regen ticks |
| `defense.shield-pct` | HP % applied as a shield on a timer |
| `defense.shield-interval-ms` | Cooldown between shield applications |
| `defense.shield-duration-ms` | How long a periodic shield lasts before expiring |
| `defense.absorb-pct` | Fraction of incoming damage diverted to a time-delay absorb pool |
| `defense.dot-resistance` | Fraction by which DoT damage is reduced |
| `defense.hit-to-dot-pct` | Fraction of direct damage taken that is instead dealt as DoT |
| `defense.debuff-resistance` | Reduces duration or potency of debuffs |
| `defense.cleanse-stacks` / `defense.cleanse-interval-ms` | Periodic stack removal |

---

## Quest system

Quests are fully wired and populated.

**How it works:**
- `QuestDefinition` fields: `id`, `name`, `description`, `tierRequired`, `targetMonsterTypes: string[]`, `killsRequired: number`.
- `PlayerState` tracks: `questProgress: Record<string, number>` (kill count per quest),
  `progressionXP: number`, `progressionLevel: number`.
- `registerKillForQuests(player, monsterTypeId)` in `questSystem.ts` is called after
  every monster kill via `grantMonsterRewards`. It increments progress and awards XP
  on completion. `XP_PER_LEVEL = 100` XP per progression level, each level gives 1 skill point.
- Quests are one-time — completed quests are not re-incremented.
- To add a quest: add a `QuestDefinition` entry to `QUEST_DATABASE` in `shared/src/index.ts`.

**Current quests in `QUEST_DATABASE`:**
- `tier-0` — *First Blood*: slay 10 Tiny Slimes in the Clearing
- `tier-1` — *Dungeon Delver*: defeat any T1 dungeon boss (1 kill)
- `tier-2` — *Zone Conqueror*: defeat any T2 dungeon boss (1 kill)
- `tier-3` — *Veteran's Trial*: defeat any T3 dungeon boss (1 kill)
- (Additional quests may exist — check `QUEST_DATABASE` directly)

---

## Class mechanics and skill tree

### Skill tree layout (shared/src/skillTree.ts)

```
Tier 0  — 5 class roots        (choose archetype + identity defense/recovery)
Tier 1  — 15 sub-variant nodes  (light / balanced / heavy per class)
Tier 2  — 3 universal range nodes (close / mid / far — same for ALL paths)
Tier 3  — 45 path modifier nodes  (3 per class×variant, ALL hand-authored)
Tier 4–7 — generated placeholder nodes (3 choices per path per tier)
```

Tier 3 nodes are **fully hand-authored** for all 15 paths. The generator loop only
produces tiers 4–7. When adding new T3 nodes, write them manually before the
generator block.

### How passives flow

`recalculatePlayerStats()` in `stats.ts` rebuilds `player.passives` from scratch on
every skill unlock or equipment change. It iterates `player.unlockedSkills`, reads
`node.mechanicEffects`, and accumulates values additively into `player.passives`.
The archetype systems then read `player.passives` at combat time — no separate
"apply on unlock" step.

Stat deltas (`node.statEffects`) are also summed during this rebuild, along with
base constants, weapon APS override, range-close class bonus, and equipped item modifiers.

### Class root identities (Tier 0)

Each root grants archetype selection + a signature recovery/defense mechanic:

| Class | Stats (root) | Identity passive |
|---|---|---|
| **Cooldown** | +6 ATK, +28 HP, +3 PLT, +5% DR, −10 SPD | `defense.in-combat-regen-pct: 0.12` |
| **Cadence** | +8 ATK, +18 HP, +2 PLT, +3% DR | `defense.regen-burst-pct: 0.08` every 10 s |
| **DoT** | +6 ATK, +18 HP, +2 PLT, +3% DR, +1 hpRegen, +50 range | `defense.dot-resistance: 0.12`, `defense.hit-to-dot-pct: 0.10` |
| **Reload** | +12 SPD, −8 HP, +105 range, +10 evasion | Evasion/avoidance identity; ranged baseline |
| **Energy** | +5 ATK, +14 SPD, −200ms CD, −5 HP, +115 range, +1 PLT | `defense.shield-pct: 0.06` every 14 s |

Energy and Reload are **ranged baseline** — they start with +115/+105 attack range at the root. DoT is **mid-range baseline** — +50 range at root puts it between melee and ranged. Cooldown and Cadence are **melee** — no built-in range bonus.

### T1 stat profiles (cumulative with root)

Heavy frames are the tankiest; light frames sacrifice durability for speed/offense.

| Class | Light net (root+variant) | Heavy net (root+variant) |
|---|---|---|
| Cooldown | +14 ATK, +6 HP, 0 PLT, +3% DR, high speed | +49 ATK, +98 HP, +13 PLT, +18% DR, +14 hpRegen |
| Cadence | +22 ATK, −4 HP, +2 PLT, +3% DR, high speed | +38 ATK, +74 HP, +11 PLT, +7% DR, +5 hpRegen |
| DoT | +30 ATK, −4 HP, +2 PLT, +3% DR, high speed | +34 ATK, +68 HP, +10 PLT, +12% DR, +7 hpRegen |
| Reload | +18 ATK, −26 HP, 0 PLT, +15 evasion | +24 ATK, +24 HP, +5 PLT, +4 hpRegen |
| Energy | +14 ATK, −27 HP, +2 PLT, high speed | +21 ATK, +19 HP, +4 PLT, +8% DR, +3 hpRegen |

### Tier 2 — Range nodes

Three universal nodes available to all classes at tier 2 (only one can be chosen):
- **range-close**: −40 range, +5 ATK, −300ms CD, +3 PLT, +6% DR, +12 maxHP,
  plus a class-specific bonus (more plating for heavier classes, more hpRegen for lighter).
- **range-mid**: no stat changes — neutral baseline.
- **range-far**: +120 range, −8 ATK, +400ms CD.

### Reload multiplier layer

The reload class uses **double attack speed / half damage** as a final multiplier applied
*after* all additive bonuses (skills + items + range node). In `stats.ts`:
```typescript
if (player.combatArchetype === 'reload') {
  player.attack         = Math.max(1, Math.floor(player.attack * 0.5));
  player.attackCooldown = Math.max(200, Math.round(player.attackCooldown * 0.5));
}
```
This means weapons, skills, and items use their normal values; the 0.5× factor scales
the final result. Do not add the halving additively into any stat delta.

### Archetype mechanics

#### Cadence (`cadencePrototype.ts`)
Hit counter with a finisher trigger. `cadenceCount` increments each hit;
at `cadenceThreshold` it fires an empowered attack at `cadence.empowered-mult` ×.

**Tier 1 variants set the base threshold and multiplier:**
- Light: threshold 4, mult 1.5×, +speed, −HP, −CD
- Balanced: threshold 5, mult 2.0×, modest all-round stats
- Heavy: threshold 6, mult 4.0×, major bulk, −speed, +CD

**T3 paths — all 9 implemented in `cadencePrototype.ts`:**

*Light path:*
- `cadence-light-t3-a` — **Accelerando**: each finisher grants a permanent
  attack-speed stack (up to 5). Shown as `Accel` buff. Key: `cadence.speed-stack`.
- `cadence-light-t3-b` — **Cursed Finale**: finisher applies 25% vulnerability
  (5 s) and −5 permanent plating shred to the target. The finisher itself benefits.
  Keys: `cadence.debuff-vuln-pct`, `cadence.debuff-vuln-ms`, `cadence.debuff-plating-shred`.
- `cadence-light-t3-c` — **Double Time**: finisher strikes twice (both at full mult).
  Key: `cadence.trigger-count: 2`.

*Balanced path:*
- `cadence-balanced-t3-a` — **Rapid Tempo**: shortens combo by 2 hits.
  Key: `cadence.threshold-mod: -2`.
- `cadence-balanced-t3-b` — **Rising Tide**: each pre-finisher hit amplifies the
  finisher by 20%; after finisher the next 5 attacks deal +50% damage (Echo counter).
  Keys: `cadence.momentum-buildup: 0.20`, `cadence.momentum-echo: 5`.
- `cadence-balanced-t3-c` — **Delayed Verdict**: finisher tags the target; after 3 s
  it explodes for the sum of all pre-finisher hits. Re-tagging resets the fuse.
  Key: `cadence.detonation: 1`.

*Heavy path:*
- `cadence-heavy-t3-a` — **Overwhelming Force**: +2 to threshold, +1× to multiplier.
  Keys: `cadence.threshold-mod: 2`, `cadence.damage-mult-add: 1`.
- `cadence-heavy-t3-b` — **Hemorrhage**: finisher converts to a non-stacking DoT
  (150% finisher damage over 4 s, refreshable). Key: `cadence.hemorrhage: 1`.
- `cadence-heavy-t3-c` — **Iron Patience**: each pre-finisher hit stores 30% of its
  damage as charge; finisher adds the total stored charge as bonus damage.
  Key: `cadence.charge-buildup: 0.30`.

---

#### Cooldown (`cooldownPrototype.ts`, `cooldownT3.ts`)
Execution strike system: a countdown timer (`executionCooldown`) charges after each
execution. When the timer expires the next attack is a guaranteed heavy hit. The player
sees this as an execution-ready indicator.

**Tier 1 variants set the cooldown duration and multiplier:**
- Light: 5 000 ms, 1.5×, glass-cannon stats
- Balanced: 7 000 ms, 2.0×, sturdy stats
- Heavy: 9 000 ms, 3.0×, fortress stats

**T3 paths — all 9 designed; light and balanced fully implemented in `cooldownT3.ts`;
heavy nodes are designed but server-side logic is not yet written:**

*Light path (implemented):*
- `cooldown-light-t3-a` — **Overdrive**: execution triggers 50% attack speed burst for 2.5 s.
  `Ovrdv` buff with duration bar. Key: `cooldown.overdrive`.
- `cooldown-light-t3-b` — **Eternal Cycle**: CD stretches to 10 s; each hit builds stacks
  that add flat on-hit damage; execution deals ATK × stacks, then resets.
  `Chrge` stack buff. Key: `cooldown.eternal-cycle`.
- `cooldown-light-t3-c` — **Temporal Extension**: execution grants a flat on-hit bonus buff
  that extends 1 s per hit (keep attacking to keep it alive).
  `Xtend` buff with duration bar. Key: `cooldown.temporal-extension`.

*Balanced path (implemented):*
- `cooldown-balanced-t3-a` — **Acceleration**: each attack shaves 1 s off the cooldown.
  Key: `cooldown.acceleration-ms: 1000`.
- `cooldown-balanced-t3-b` — **Battery**: every second the CD ticks, gain a stack that
  increases attack damage; execution spends all stacks.
  `Batry` stack buff. Key: `cooldown.battery`.
- `cooldown-balanced-t3-c` — **Alignment**: after execution, 2 s attack speed surge;
  when it ends, remaining CD is halved. `Algn` buff with duration bar.
  Key: `cooldown.alignment`.

*Heavy path (designed, not yet implemented):*
- `cooldown-heavy-t3-a` — **Entropy Collapse**: execution converts to an 8 s wound that
  scales with target's missing HP (up to 4× at 90% missing).
- `cooldown-heavy-t3-b` — **Singular Extraction**: normal attacks deal no damage; execution
  fires on a greatly shortened CD for much more damage.
- `cooldown-heavy-t3-c` — **Channeled Beam**: execution becomes a 3 s channel dealing
  continuous damage; player is immobile while channeling.

---

#### Energy (`energyPrototype.ts`, `energyT3.ts`)
Energy fills on hits (0–100). At 100 the next attack is Empowered (heavy hit + drain).
T3 paths change how energy accumulates and discharges.

**Tier 1 variants set energy-per-hit and empowered multiplier:**
- Light: 20 per hit, 1.5× — fires often
- Balanced: 14 per hit, 2.0×
- Heavy: 10 per hit, 6.0× — builds slowly, hits very hard

**T3 paths — all 9 designed; all are implemented in `energyT3.ts`:**

*Light path:*
- `energy-light-t3-a` — **The Accumulator**: max-energy discharge disabled; energy drains
  over time. Each hit grants a stacking attack damage buff, each stack accelerates drain.
  Key: `energy.accumulator`.
- `energy-light-t3-b` — **Micro-Venting**: discharge disabled; while energy > 50%, each
  hit consumes energy for flat bonus on-hit damage. Key: `energy.micro-venting`.
- `energy-light-t3-c` — **Polarity Decay**: discharge fires at reduced damage and grants
  5 overcharge stacks; basic attacks consume stacks for flat bonus.
  `Overch` stack buff. Key: `energy.polarity-decay`.

*Balanced path:*
- `energy-balanced-t3-a` — **Alternating Currents**: auto-loops charge (2× energy gain,
  +20% ATK) and discharge (energy drains over 3 s as tick damage, +50% speed) phases.
  `Chrge`/`Disch` buffs. Key: `energy.alternating-currents`.
- `energy-balanced-t3-b` — **Harmonic Equilibrium**: +60% damage while energy is strictly
  between 40–60%. `Equil` buff (no timer). Key: `energy.harmonic-equilibrium`.
- `energy-balanced-t3-c` — **Capacitor Shunt**: energy gen split 50/50 between active bar
  and reservoir (cap 500); discharge amplified by reservoir total.
  `Resvr` buff. Key: `energy.capacitor-shunt`.

*Heavy path:*
- `energy-heavy-t3-a` — **Singularity Execute**: doubles max energy capacity; gen
  accelerates near-full; early discharge if projected damage exceeds target HP.
  Key: `energy.singularity-execute`.
- `energy-heavy-t3-b` — **Cascading Induction**: basic attacks deal 1 damage but plant
  Induction tags (15 s); discharge consumes all tags for exponentially scaling burst.
  Key: `energy.cascading-induction`.
- `energy-heavy-t3-c` — **Superconducting Mass**: basic attacks deal no damage but build
  a charge pool; discharge applies empowered mult + entire pool as true damage.
  Key: `energy.superconducting-mass`.

---

#### Reload (`reloadPrototype.ts`)
Magazine system: fire a burst of shots then reload. Ammo depletes each hit;
at 0 the player enters a reload window and cannot attack until it completes.
The reload class has **double attack speed and half damage** applied as a final multiplier
layer in `stats.ts` after all other bonuses — see "Reload multiplier layer" above.

**Tier 1 variants set clip size and reload duration:**
- Light: 5 rounds, 1500 ms reload
- Balanced: 8 rounds, 2500 ms reload
- Heavy: 12 rounds, 4000 ms reload

**T3 paths — all 9 designed in `skillTree.ts`; none are implemented yet.**
The `mechanicEffects` keys are defined but `reloadPrototype.ts` does not yet read them.

*Light path (designed only):*
- `reload-light-t3-a` — **Exploding Clip**: last bullet deals 3×.
- `reload-light-t3-b` — **Preemptive Strike**: first bullet of each clip deals 2.5×.
- `reload-light-t3-c` — **High Powered**: clip reduced to 3 rounds; shots ramp in damage
  (shot 1 normal, shot 2 +50%, shot 3 +100%). Key: `reload.max-ammo: -2` (additive).

*Balanced path (designed only):*
- `reload-balanced-t3-a` — **Death Mark**: builds stacks per hit (cap 10); reload detonates
  all for ATK × stacks × 0.5 bonus damage.
- `reload-balanced-t3-b` — **Continuous Firing**: builds up to 4 reload speed stacks;
  reloading grants a 30% ATK buff for 3 s.
- `reload-balanced-t3-c` — **Finishing Strike**: last bullet scales with target's missing HP
  (1.5× full → 3× at 90% missing).

*Heavy path (designed only):*
- `reload-heavy-t3-a` — **Momentum**: up to 8 stacks of +5% ATK and +3% speed per hit;
  reloading resets all stacks.
- `reload-heavy-t3-b` — **Heat**: attacks deal 30% less but apply Heat stacks that tick;
  reload detonates all stacks.
- `reload-heavy-t3-c` — **Burst**: after reload gain ATK stacks = clip size; each attack
  converts one to a speed stack.

---

#### DoT (`dotPrototype.ts`, `dotT3.ts`)
Each hit applies stacks to the target. Stacks tick damage at 1 s intervals.
Three paths: **Poison** (light — many low-damage stacks), **Fire** (balanced — medium
cap, burn-up mechanics), **Frost** (heavy — slow-ramp, crowd control).

**Tier 1 variants set max stacks and damage per stack:**
- Light (Poison): 8 stacks, 2 dmg/tick
- Balanced (Fire): 6 stacks, 3 dmg/tick
- Heavy (Frost): 3 stacks, 7 dmg/tick

**T3 paths — all 9 implemented in `dotT3.ts`:**

*Poison path (light):*
- `dot-light-t3-a` — **Poison Explosion**: stacks cap at 20; at cap, instantly burst for
  20 × stacks × 10 ticks of damage, clearing all stacks.
  Key: `dot.poison-explosion`.
- `dot-light-t3-b` — **Eternal Doom**: no stack limit; first 8 deal full damage, each
  beyond 8 adds at 50% effectiveness (diminishing returns). Never expires.
  Client renders a bar (too many stacks for pips). Key: `dot.eternal-doom`.
- `dot-light-t3-c` — **Invigorating Toxins**: each poison stack on the target gives +2 ATK
  and +2% speed (cap +40%). Bonus drops immediately on target switch.
  `Vigor` buff. Key: `dot.invigorating-toxins`.

*Fire path (balanced):*
- `dot-balanced-t3-a` — **Fan the Flames**: each hit applies 2 burn stacks at 50% damage.
  Hitting at max stacks instead deals burst (3× all-stack DoT damage).
  Key: `dot.fan-the-flames`.
- `dot-balanced-t3-b` — **Smoldering Ember**: each burn stack adds +3% incoming damage
  to the target (up to 18% at cap). Amplifies all damage sources.
  Key: `dot.smoldering-ember`.
- `dot-balanced-t3-c` — **Conflagration**: at max stacks, consumes all and creates a
  Conflagration: 5 ticks at 2× damage every 500 ms. `Cflag` buff with duration.
  Key: `dot.conflagration`.

*Frost path (heavy):*
- `dot-heavy-t3-a` — **Permafrost**: single permanent frostbite, ramps +3/tick up to 35.
  Never expires. Not counted in normal stack display.
  Key: `dot.permafrost`. StatusEffect flag: `data.t3Perm = 1`.
- `dot-heavy-t3-b` — **Freezing Cold**: each hit applies 1 frost + 1 chill stack.
  At 3 chill stacks, target Freezes for 2 s (immobile, +35% damage taken).
  Chill slows speed and attack rate. `Chll` + `Frzn` buffs.
  Key: `dot.freezing-cold`.
- `dot-heavy-t3-c` — **Glacial Fracture**: at max stacks, next hit shatters for
  maxStacks² × dmgPerStack bonus damage, clears stacks, applies 1 fresh stack.
  Key: `dot.glacial-fracture`.

**DoT T3 listener ordering:** `initDotT3()` registers its `onHit` listeners before
the base prototype does, so T3 handlers fire first. When a T3 handler fully processes
the hit it sets `ctx.metadata['dotHandled'] = 1` to suppress the base stack application.

**StatusEffect flags used by DoT T3:**
- `effect.data.t3Perm = 1` — Permafrost effect; skipped by `updateDotArchetype`,
  handled entirely by `updateDotT3`.
- `effect.data.isEternalDoom = 1` — uses the diminishing-returns damage formula.

---

## What is built

- Multi-node world (**11×11 grid**, 121 nodes) with biome-specific monster pools
- Monster AI (wander / chase / attack / return) with retaliation aggro, kite prevention
  (speed ramp after 3 s chasing), and leash-based aggro retention
- Player combat (attack range, cooldown, auto-targeting with 70% range stop-distance)
- Dungeon nodes across T1–T3 with scaled enemies and one persistent boss each
- Quest system with populated quests (tier-0 through tier-3 dungeon kill quests);
  XP→level→skill-point pipeline fully wired
- QuestPanel in the HUD showing live progress
- Map editor (`map-editor.html`) for visual biome layout design
- Class system: cadence, cooldown, energy, reload, dot archetypes
  - Distinct root identities with signature defense/recovery mechanics at T0
  - Energy and Reload are ranged-baseline; Reload uses a multiplier layer (not additive)
  - **Cadence T3**: all 9 paths implemented
  - **Cooldown T3**: light + balanced (6 paths) implemented; heavy (3 paths) designed only
  - **Energy T3**: all 9 paths implemented
  - **DoT T3**: all 9 paths implemented
  - **Reload T3**: all 9 paths designed in skill tree; none yet implemented on server
- Defense/recovery system: in-combat regen, periodic shields with expiry, damage absorb,
  burst regen, DoT resistance — all driven by `defense.*` passives from skills and items
- Recovery slot with 5 distinct archetypes; ring slots removed
- Weapon effects: Chaotic Axe, Sacred Cross, Ashbrand Blade
- Inventory and equipment (4 slots: weapon, armor, recovery, mobility)
- Crafting system with biome-kill unlock gates
- Skill tree with tier-gated unlock flow (tiers 0–7 defined; tiers 4–7 are generated placeholders)
- Node transitions (walk through gate edges)
- Death and respawn (back to clearing)
- Client HUD (React): stat panel, buff bar, essence display, inventory, crafting,
  map (11×11 with dungeon treatment + boss info), skill tree, quest panel
- AoE damage framework (`aoeDamage.ts`): circle splash for both players and monsters;
  empowered hits automatically deal AoE splash (radius 80 px, 0.5× base ATK)
- Client (Phaser): minimap, biome backgrounds, gate markers, damage numbers, attack animations
  (including flashier empowered variant driven by `CombatEvent` queue),
  AoE ring visual on empowered hits, boss sprite scaling,
  **debug range overlay** (player attack range + per-monster pull/leash/attack rings)
- Split-tick game loop: 10 Hz logic, 5 Hz broadcast with per-node snapshot deduplication
- Combat event queue (`CombatEvent`): `player-hit` + `player-kill` events bundled with each
  snapshot; client uses them for attack effects, lunge, and combat-log entries — no more
  per-tick booleans on `PlayerState`
- Monster wander smoothing: dead-reckoning reconciliation threshold (only hard-snap client
  position to server when error > 80 px; small drifts self-correct via interpolation)
- Ethereal glass-morphism UI theme: backdrop-blur sidebars, gradient panels, shimmer bars,
  animated buff icons with category-distinct shapes and keyframes

## What is NOT built yet (do not hallucinate these)

- [ ] Discord OAuth
- [ ] SQLite / Drizzle (database is wired but not used — all state is in-memory)
- [ ] Multiple World instances / node routing (current: one World with all 121 nodes)
- [ ] Character select / login screen
- [ ] Deployment (Caddy, PM2, Hetzner)
- [ ] World map click-to-navigate / BFS auto-traverse — planned
- [ ] Cooldown heavy T3 mechanics (Entropy Collapse, Singular Extraction, Channeled Beam)
- [ ] Reload T3 mechanics (all 9 paths designed, none implemented)
- [ ] Tiers 4–7 mechanics (all generated placeholder nodes)
- [ ] StatPanel update to reflect new defense/recovery stats (evasion, shields, absorb, burst regen)

---

## Project state & immediate priorities

### Recommended priority order
1. **Wire up SQLite persistence** (player state: stats, inventory, skills, position, quests)
2. **Deploy** (Caddy + PM2 on Hetzner, or similar)
3. **Playtest T1 balance** — numbers are a first pass; expect a tuning session after hands-on play
4. **Balance T2 biomes and monsters** — extend the same threat-profile design to T2
5. **Implement Reload T3** (all 9 designed, just needs server-side code)
6. **Implement Cooldown heavy T3** (3 paths designed)

### T1 balance (complete — pending playtesting)

**T1 biome threat profiles** — five biomes with distinct mechanical identities:

Five T1 biomes, each with a distinct mechanical identity:

| Biome | Threat profile | Plating |
|---|---|---|
| Plains | Balanced, no specialization — jack of all trades | 0 |
| Forest | Fast attacking, sustained damage, low defense — easy to burst | 0 |
| Swamp | Attrition — slow, above-average defense, poison/DoT | 2 |
| Caverns | High defense, hard slow hits — spiky damage; hardest T1 biome | 4–5 |
| Mountain | Cliff Hoppers (fast, high pull range) + Ridge Archers (long attackRange) | 0 |

T1 bosses follow the same profiles at 400–700 HP, 14–22 ATK.

Jungle first appears at T2. The 4 ex-jungle T1 nodes (SE quadrant) are now extended Plains.

---

## Coding conventions

- **TypeScript strict mode** — no `any`, no non-null assertions without comment
- **No build step for shared during dev** — import from `@mmo-idle/shared` directly
- **Server is the source of truth** — client never mutates game state; it only
  sends intent events and renders what the server sends back
- **One feature at a time** — implement in shared → server → client order
- **Comments on non-obvious logic** — especially tick math and network events
- **StatusEffect data is `Record<string, number>`** — use numeric flags (0/1), never strings
- **T3 listener ordering** — always call `initXxxT3()` before `registerCombatListener`
  inside `initXxxArchetype()` so T3 handlers fire before the base prototype
- **Passives are rebuilt on every stat recalc** — never apply `mechanicEffects` imperatively;
  they accumulate into `player.passives` during `recalculatePlayerStats()` and archetype
  systems read them at combat time
- **Map inference on TypeScript Maps** — use explicit generics (`new Map<string, Recipe>([...])`)
  to prevent TypeScript inferring union types with `undefined` from object literals with
  varying keys; applies to `RECIPE_DATABASE`, `SKILL_TREE`, `QUEST_DATABASE`
- **Reload multiplier is a final layer** — do not fold it into additive deltas; apply
  `* 0.5` to `attack` and `attackCooldown` at the end of `recalculatePlayerStats()`
  after all other bonuses
