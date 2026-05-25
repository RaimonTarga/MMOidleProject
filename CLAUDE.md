# MMO Idle — Project Context for Claude Code

Read this file before touching any code. It is the single source of truth for
architecture decisions and conventions.

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
├── CLAUDE.md               ← you are here
├── map-editor.html         ← standalone biome editor (open in browser, no build needed)
├── shared/src/
│   ├── index.ts            ← ALL shared types, socket event maps, constants
│   ├── skillTree.ts        ← SKILL_TREE map (tiers 0-3 hand-authored, 4-7 generated)
│   ├── biomeDatabase.ts    ← BiomeDefinition (mobDensity?), BIOME_DATABASE, bossPoolByTier
│   ├── monsterDatabase.ts  ← MonsterDefinition (isBoss?, dotEffect?, chargeOnAggro?, slowEffect?, evadeEvery?, bossScript?), MONSTER_DATABASE; BossAction/BossPhase/BossScript types
│   ├── itemDatabase.ts
│   └── recipeDatabase.ts
├── client/src/
│   ├── main.ts             ← Phaser bootstrap
│   ├── hudBus.ts           ← reactive event bus for HUD state
│   ├── hud/                ← HUD.tsx, hud.css, MenuButtons.tsx
│   ├── ui/                 ← SkillTreePanel, InventoryPanel, CraftingPanel, QuestPanel, MapPanel
│   └── scenes/GameScene.ts ← main scene: socket, entity rendering, debug overlays
└── server/src/
    ├── index.ts            ← Express + Socket.IO + game loop
    ├── world/
    │   ├── World.ts        ← mutable state + tick() + ensureBoss()
    │   └── nodeRegistry.ts ← 11×11 node grid from NODE_BIOMES
    └── systems/
        ├── combat.ts, combatPipeline.ts, combatState.ts, attackCounter.ts
        ├── stats.ts, movement.ts, ai.ts, autoTarget.ts, transitions.ts
        ├── aoeDamage.ts, rewards.ts, statusEffects.ts, defenseSystems.ts, weaponEffects.ts
        ├── bossScripts.ts
        ├── questSystem.ts
        ├── cadencePrototype.ts
        ├── cooldownPrototype.ts, cooldownT3.ts
        ├── energyPrototype.ts, energyT3.ts
        ├── reloadPrototype.ts
        ├── dotPrototype.ts, dotT3.ts
        └── buffSync.ts
```

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript everywhere | Strict mode on |
| Client framework | Phaser 3 | Sprites/scenes/camera/tweens |
| Client HUD | React 18 + inline CSS | Overlaid on Phaser canvas |
| Client build | Vite 5 | Dev server on port 3000 |
| Server runtime | Node.js + tsx | No compile step in dev |
| Realtime | Socket.IO 4 | One room per node instance |
| Database | SQLite + Drizzle ORM | `server/src/db/` — wired up |
| Package manager | pnpm workspaces | Always `pnpm install` from repo root |

---

## Running the project

```bash
pnpm install              # once, or after adding deps
pnpm dev:server           # http://localhost:4000
pnpm dev:client           # http://localhost:3000
pnpm play                 # build client + start server (LAN / production mode)
# map-editor.html — open directly in browser
```

---

## Shared package (`@mmo-idle/shared`)

Everything that crosses the client/server boundary lives here. Start here for any new entity or socket event.

- `PlayerState`, `MonsterState`, `NodeSnapshot` — entity shapes
- `CombatEvent` — `player-hit`, `player-kill`, `monster-dodge` queued per-node between broadcasts
- Databases (read-only): `ITEM_DATABASE`, `MONSTER_DATABASE`, `BIOME_DATABASE`, `RECIPE_DATABASE`, `SKILL_TREE`
- `ServerToClientEvents`, `ClientToServerEvents` — socket event maps
- `GAME_CONFIG` — all tuning constants
- `NODE_BIOMES` — record `node-{row}-{col}` → `{ biomeGroup, biomeTier, isDungeon? }`
- `QUEST_DATABASE`, `XP_PER_LEVEL = 100`
- `biomeXpForLevel(n)` — XP threshold for biome level `n`; uses `BIOME_XP_BASE` + `BIOME_XP_EXPONENT` from GAME_CONFIG
- `biomeLevelCap(playerTier, biomeGroup)` — max biome level = `Math.max(4, playerTier × 4)`; clearing always 4. Two args only — no `biomeTier` param.
- `BossAction`, `BossPhase`, `RepeatingAction`, `BossScript` — boss scripting types (in `monsterDatabase.ts`)

---

## Socket events

| Event | Direction | Description |
|---|---|---|
| `state:sync` | S→C | Full snapshot on connect |
| `node:state` | S→C | Authoritative broadcast every tick |
| `player:died` | S→C | Player HP hit zero (before respawn) |
| `crafting:result` | S→C | Craft success/failure |
| `player:move` | C→S | Movement request |
| `player:setAuto` | C→S | Toggle auto-targeting |
| `player:unlockSkill` | C→S | Unlock skill tree node |
| `inventory:equipItem` / `inventory:unequip` | C→S | Equipment changes |
| `crafting:craftRecipe` | C→S | Craft attempt |

---

## Server architecture

`server/src/index.ts`: Express setup → Socket.IO setup → class mechanic registration → two decoupled intervals:
- **Logic tick** 10 Hz (100 ms): `world.tick(dt, now)` + drain `world.pendingDeaths`
- **Broadcast tick** 5 Hz (200 ms): `world.buildSnapshot(nodeId)` once per occupied node → emits `node:state`

`World.ts` owns all mutable state. `systems/` has one file per system.

### Combat pipeline

`beforeAttack` → `onAttack` → `onHit` → `onDamageTaken` → `afterHit` → `onKill`

Register via `registerCombatListener`. `CombatContext` is a mutable bag — handlers read/write `ctx.damage`, `ctx.cancelled`, `ctx.metadata`.

**Combat event queue:** `world.pushEvent(nodeId, event)` emits `player-hit`/`player-kill` after each attack. `world.buildSnapshot` flushes once per node per broadcast. Do **not** use per-tick booleans on `PlayerState` for animation — use `pushEvent`.

**Retaliation aggro:** On player hit, if monster has no aggro target, `combat.ts` sets `ai.aggroTargetId` immediately. `ai.ts` never overwrites existing aggro.

### AoE damage (`aoeDamage.ts`)

- `applyPlayerAoe(world, attacker, x, y, radius, damage, excludeId?)` — hits monsters
- `applyMonsterAoe(world, attacker, x, y, radius, damage, excludeId?)` — hits players

AoE bypasses the combat pipeline intentionally. Every empowered hit auto-triggers `applyPlayerAoe` at `EMPOWERED_AOE_RADIUS: 80` px, `EMPOWERED_AOE_MULT: 0.5 × player.attack`.

### Monster AI (`ai.ts`)

Aggro acquisition (`findAggro`) only runs when `ai.aggroTargetId === null` — retaliation aggro is never overwritten. Retention: cleared only on node change, disconnect, or leash break.

**Kite prevention:** `kiteTimer` accumulates while chasing. After `KITE_GRACE_MS` (500 ms) speed ramps at `KITE_RAMP_RATE` (1.5×/s) up to `KITE_MAX_MULT` (6.0×), floored at `KITE_MIN_SPEED` (150). Timer decays at `KITE_DECAY_RATE` (2.0×) while monster is in attack range. Resets on attack range entry or aggro drop.

**Auto-target stop distance:** `attackRange * 0.70` to prevent stutter-stepping.

### Combat state

`CombatState` (`combatState.ts`): `counters`, `resources`, `resourceMaxes`, `cooldowns`, `flags`, `stacks`, `strings`, `statusEffects`. Always use accessor helpers — never raw field access. All cooldowns decremented by `updateCombatState` each tick.

**StatusEffect API:** `applyStatusEffect` (stacking — adds 1 stack per call, `data` only set on creation), `removeStatusEffect`, `getTotalStacks`, `hasStatusEffect`. `data` is `Record<string, number>` — numeric flags only.

For "every N hits do X" use `registerAttackThreshold` from `attackCounter.ts`.

### `buffSync.ts`

Runs end of every tick; populates `player.activeBuffs: PlayerBuff[]` from combat state. Add new buff entries here when implementing new mechanics.

---

## Client architecture

`GameScene.ts`: connects to `:4000`, maintains `Map<string, Visual>`. `applySnapshot()` order: remove gone players → upsert players → **process events** → remove gone monsters → upsert monsters.

**React HUD** is a separate `<div>` in index.html, not inside Phaser. Uses `hudBus.ts` (pub/sub singleton).

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

## Monster mechanics

### Charge on aggro (`chargeOnAggro`)
`MonsterDefinition.chargeOnAggro?: { speedMult: number; durationMs: number }` — burst speed when the monster first acquires an aggro target (both pull-range and retaliation). Stored as `ai.chargeRemainingMs` in `MonsterAI`. During the charge, kite ramp does **not** accumulate (`ai.kiteTimer` stays frozen) so the ramp starts fresh from zero after the burst. Currently wired: boar (3.5×, 1.2 s), ancient-wolf (3×, 1 s), stone-eagle (3.5×, 1 s), stampede-bull (2.5×, 1 s), jungle-ape (2.8×, 1.1 s).

### Slow / root (`slowEffect`)
`MonsterDefinition.slowEffect?: { speedMult: number; durationMs: number }` — applied as a refreshing `'slow'` status effect in `playerCombatState` on every successful hit. `movement.ts` reads it and scales the player's effective speed by `speedMult`. `speedMult: 0` = full root (complete stop); `0 < speedMult < 1` = partial slow. Effect stores `{ speedMult, totalMs }` in `data` so `buffSync.ts` can compute the clock-sweep percentage. Displayed as a blue "Slow" or purple "Root" tile in the buff bar. Currently wired: sand-scorpion (0.5×, 2.5 s), stone-basilisk (root, 1.2 s).

### Deterministic evasion (`evadeEvery`)
`MonsterDefinition.evadeEvery?: number` — the monster dodges every Nth incoming player hit. Tracked in `monsterCombatState.counters['hitsTaken']`, which persists for the monster's entire lifetime and resets only on death. The evasion check runs before `makeCombatContext`; the attack cooldown is still consumed. Pushes a `{ kind: 'monster-dodge', monsterId }` event (client-side display not yet implemented — hit silently produces no damage number). Convention: `evadeEvery` must be ≥ 5 (maximum 1-in-5 dodge rate). Currently wired: giant-spider (5), mire-stalker (5), dune-asp (5).

---

## Biome XP system

Players earn biome XP for kills in a biome; XP accumulates in `player.biomeXP` (a `Record<biomeGroup, number>`). `player.biomeLevel` is the current level of the active biome.

**Power curve:** `biomeXpForLevel(n) = round(BIOME_XP_BASE × n^BIOME_XP_EXPONENT)`
- `BIOME_XP_BASE = 80`, `BIOME_XP_EXPONENT = 1.7` (both in GAME_CONFIG)
- Level table: Lv1 → 80 XP, Lv2 → 260, Lv3 → 518, Lv4 → 845, Lv6 → 1831, Lv9 → 3848

Each level-up in a biome unlocks recipes tied to that biome+level. `unlockedRecipes` on `PlayerState` is the authoritative set. XP per kill is set in `BIOME_XP_BY_NODE_TIER` in `shared/src/index.ts`.

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

**Runtime state:** `World.bossState: Map<string, BossRuntimeState>` — per-boss tracking (engaged flag, phase triggers, repeating timers, active effects). Pruned automatically when boss dies. Never serialized.

**`monster.bossEffects: string[]`** — populated each tick from active effect names; sent to client for HUD display.

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

**Defense passives** (`player.passives`, rebuilt each stat recalc):

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

**Damage debt drain** (`defenseSystems.ts`): fires once per second (via `debtTick` cooldown) — not proportionally every tick. Each second drains 25% of the current pool; `Math.round(damage) < 1` is skipped. Absorb and burst pools use proportional per-tick drain but zero out when the pool falls below 0.5 to avoid asymptotic trickle.

---

## Quest system

`QuestDefinition`: `id`, `name`, `tierRequired`, `targetMonsterTypes[]`, `killsRequired`. `registerKillForQuests` called after every kill via `grantMonsterRewards`. Awards XP on completion; `XP_PER_LEVEL = 100`, each level → 1 skill point. Quests are one-time. Add new entries to `QUEST_DATABASE` in `shared/src/index.ts`.

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

`recalculatePlayerStats()` rebuilds `player.passives` from scratch on every skill unlock or equipment change. Iterates `player.unlockedSkills` → reads `node.mechanicEffects` → accumulates additively. Archetype systems read `player.passives` at combat time — no "apply on unlock" step.

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

| Class | Light | Heavy |
|---|---|---|
| Cooldown | +14 ATK, +6 HP, high speed | +49 ATK, +98 HP, +13 PLT, +18% DR |
| Cadence | +22 ATK, −4 HP, high speed | +38 ATK, +74 HP, +11 PLT |
| DoT | +30 ATK, −4 HP, high speed | +34 ATK, +68 HP, +10 PLT, +12% DR |
| Reload | +18 ATK, −26 HP | +24 ATK, +24 HP, +5 PLT |
| Energy | +14 ATK, −27 HP, high speed | +21 ATK, +19 HP, +4 PLT |

### T2 range nodes (universal)

- **range-close**: −40 range, +5 ATK, −300ms CD, +3 PLT, +6% DR, +12 HP + class bonus
- **range-mid**: no changes
- **range-far**: +120 range, −8 ATK, +400ms CD

### Reload multiplier (final layer in `stats.ts`)

```typescript
if (player.combatArchetype === 'reload') {
  player.attack         = Math.max(1, Math.floor(player.attack * 0.5));
  player.attackCooldown = Math.max(200, Math.round(player.attackCooldown * 0.5));
}
```
Never fold the 0.5× into additive deltas.

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
Energy 0–100 fills on hits; at 100, next attack is Empowered. T1: Light (20/hit, 1.5×), Balanced (14/hit, 2×), Heavy (10/hit, 6×). **All 9 T3 paths implemented.**

- Light: The Accumulator (drain-based stacking ATK buff), Micro-Venting (energy consumed for on-hit bonus at >50%), Polarity Decay (reduced discharge → overcharge stacks)
- Balanced: Alternating Currents (charge/discharge phase loop), Harmonic Equilibrium (+60% dmg at 40–60% energy), Capacitor Shunt (reservoir amplifies discharge)
- Heavy: Singularity Execute (doubled cap, early discharge), Cascading Induction (Induction tags → exponential burst), Superconducting Mass (no basic dmg → charge pool → true dmg)

---

#### Reload (`reloadPrototype.ts`)
Magazine system — burst then reload window. T1: Light (5 rounds, 1500 ms), Balanced (8, 2500 ms), Heavy (12, 4000 ms). Reload class uses double APS / half dmg final multiplier — see above. **All 9 T3 paths designed in skillTree.ts; none implemented yet.**

- Light: Exploding Clip (last bullet 3×), Preemptive Strike (first bullet 2.5×), High Powered (3-round ramp)
- Balanced: Death Mark (stacks → reload detonation), Continuous Firing (reload speed stacks + ATK buff), Finishing Strike (last bullet scales with missing HP)
- Heavy: Momentum (per-hit ATK/speed stacks, reset on reload), Heat (reduced dmg + Heat ticks detonated on reload), Burst (post-reload ATK stacks → speed stacks)

---

#### DoT (`dotPrototype.ts`, `dotT3.ts`)

Each player hit applies 1 DoT stack; stacks tick damage at configurable intervals (default 1 s). **All 9 T3 paths implemented.**

**Conversion model:** Each hit redirects `convPct` of direct damage into DoT. The hit deals `(1 − convPct)` of normal damage; the rest becomes `damagePerStack = attack × convPct / maxStacks` per tick.
- T0 baseline: 40% (fallback `DOT_CONVERSION_PCT = 0.40` in code)
- T1 Light (Poison): `dot.conversion-pct: 0.30`, 8 stacks
- T1 Balanced (Fire): `dot.conversion-pct: 0.50`, 6 stacks
- T1 Heavy (Frost): `dot.conversion-pct: 0.70`, 3 stacks

`dot.damage-per-stack` is **gone** — never set this passive. `damagePerStack` is always derived from `player.attack × convPct / maxStacks` at hit time.

**Diminishing returns tick formula:** `computeScaledDotDamage(effect)` = `dmgPerStack × sqrt(stacks × maxStacks)`. Same damage as linear at full stacks; boosted above linear at low stacks.

**Tick rate:** `dot.tick-interval-ms` passive changes tick frequency. Faster ticks = more DPS (not normalized). Default 1000 ms.

**Max-stacks refresh:** Hitting a maxed target only refreshes `damagePerStack` and `tickIntervalMs` — `nextTickIn` is never reset by the hit handler so fast attackers don't push the tick timer indefinitely into the future. The tick timer runs independently and resets only when a tick fires.

**DoT duration:** Player-applied DoT stacks expire after `DOT_DURATION_MS = 4500 ms` of no hits. Duration is refreshed (not stacked) on every hit via `remainingMs + refreshable: true` in `applyStatusEffect`. Permafrost is the only exception (`remainingMs: -1`, truly permanent). Duration is tunable per-skill-node via `dot.duration-ms` passive; monster-applied DoTs use `monsterDef.dotEffect.durationMs ?? 4500`.

**Monster → Player DoT:** `MonsterDefinition.dotEffect?: { damagePerStack, maxStacks, tickIntervalMs, durationMs? }`. Any monster with this field applies DoT stacks on each hit. The player-side tick loop in `updateDotArchetype` processes `playerCombatState`; DoT bypasses plating but `damageReduction` (%) and `dot-resistance` both apply. Respawn clears all status effects via `resetCombatState`. Currently wired: `bog-slime` (2/3/1000), `mud-toad` (3/3/1000), `bog-sovereign` (4/4/1000), `swamp-hydra` (4/4/1000), `jungle-snake` (3/4/1000), `jungle-blowdarter` (2/5/1000).

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
- Monster charge-on-aggro (`chargeOnAggro`), player slow/root (`slowEffect`), deterministic evasion (`evadeEvery`) — see Monster mechanics section
- Boss fight scripting framework (`bossScripts.ts`) — data-driven phases, repeating timers, enrage/regen/shield/summon/stat-buff actions
- Quest system (kill-count quests → XP → skill points); QuestPanel
- All 5 class archetypes with T0 roots and T1–T2 nodes; T3 fully implemented for Cadence, Energy, DoT; Cooldown light+balanced; Reload designed only
- Defense/recovery system (5 recovery archetypes, all `defense.*` passives)
- Weapon families: Chaotic (axe + greataxe), Sacred (cross + consecrated), Burn (ashbrand + cinderfang + frostmourne); `onHitDamage` stat for flat on-hit weapons (Stinger Fang)
- T1 and T2 weapons (8 T2 weapons at biome level 9)
- Inventory/equipment (4 slots), crafting with biome XP unlock gates
- Biome XP power-curve system (`biomeXpForLevel`); two-tab crafting panel (Biome Progress + Forge)
- Skill tree T0–T7 (T4–7 generated placeholders)
- Death/respawn; node transitions
- Client HUD: stat panel, buff bar (category-distinct icons, slow/root debuff tiles), map (11×11 + dungeon/boss), skill tree, inventory, crafting, quest panel
- Mobile/tablet responsive HUD (≤ 1100px): fixed top bar, fixed AUTO button, slide-out menu drawer
- AoE framework; empowered AoE splash (80px, 0.5× ATK); debug range overlay
- Generic 5×5 spritesheet effect animation pipeline for status overlays and one-shot effects
- Split-tick loop (10 Hz logic, 5 Hz broadcast); combat event queue for animations
- Monster wander smoothing (80px hard-snap threshold)
- SQLite persistence (`server/src/db/`) — accounts + characters, load on connect, save on disconnect + 30 s auto-save
- DoT duration system — stacks expire after 4.5 s without a hit; damage debt drains once/second
- LAN play — client served as static files from Express; `pnpm play` builds + starts
- T1 density-based balance pass; full T2 monster redesign (7 biomes × 3 mobs each, all new mechanics)
- Y-sort draw order (`DEPTH` constant bands in `GameScene.ts`; per-frame `setDepth(BAND + baseY)` in `stepEntities`)
- Tab-switch desync fix (dt cap 100 ms, position snap on `visibilitychange`, `document.hidden` guards on all tween functions)

## What is NOT built (do not hallucinate these)

- [ ] Discord OAuth / login screen / character select
- [ ] Multiple World instances / node routing
- [ ] Deployment (Caddy + PM2 on Hetzner — next priority after playtesting)
- [ ] World map click-to-navigate
- [ ] Cooldown heavy T3 (Entropy Collapse, Singular Extraction, Channeled Beam)
- [ ] Reload T3 server logic (all 9 designed, none implemented)
- [ ] T4–7 mechanics (all placeholders)
- [ ] StatPanel update for evasion/shields/absorb/burst-regen display
- [ ] Client-side `monster-dodge` visual (server pushes the event; client ignores it — no floating DODGE text yet)
- [ ] T3 monster balance pass (tundra T3 mobs are placeholder stats)

---

## Project state

**Priority order:**
1. Deploy (Caddy + PM2 on Hetzner)
2. Playtest T1/T2 balance
3. Implement Reload T3
4. Implement Cooldown heavy T3
5. T3 biome/monster design

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
- **Passives are rebuilt on every stat recalc** — never apply `mechanicEffects` imperatively; they accumulate into `player.passives` during `recalculatePlayerStats()`
- **DoT damage-per-stack is derived, never hardcoded** — use `attack × dot.conversion-pct / maxStacks`; never set `dot.damage-per-stack` directly
- **Map TypeScript inference** — use explicit generics (`new Map<string, Recipe>([...])`) for `RECIPE_DATABASE`, `SKILL_TREE`, `QUEST_DATABASE`
- **Reload multiplier is a final layer** — apply `* 0.5` to `attack` and `attackCooldown` at the end of `recalculatePlayerStats()`, never additively
- **Boss script stat modifications use save-original pattern** — `ActiveBossEffect` stores the pre-buff stat value; restored on expiry. Overlapping same-stat effects from multiple sources are not supported (last write wins)
- **`biomeXpForLevel` is the only XP threshold function** — `BIOME_XP_PER_LEVEL` no longer exists; never use flat XP per level
- **`biomeLevelCap` takes two args** — `(playerTier, biomeGroup)`. No `biomeTier` parameter. Cap = `Math.max(4, playerTier * 4)`. Never pass three args.
- **Slow effect stores `totalMs` in data** — when applying `'slow'` status effect, always include `data: { speedMult, totalMs }` so `buffSync.ts` can compute the clock-sweep `durationPct`
- **`evadeEvery` minimum is 5** — never set lower; convention is max 1-in-5 dodge rate
- **Per-biome density via `mobDensity`** — never hardcode `GAME_CONFIG.MONSTERS_PER_NODE` in spawn loops; always go through `World.getMobDensity(nodeId)`
