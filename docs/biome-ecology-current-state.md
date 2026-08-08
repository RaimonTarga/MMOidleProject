# Biome Identity / Combat Ecology — Current State (audited 2026-08-08)

**Companion to:** `docs/archive/biome-ecology-plan.md` (the Step 12 program plan) and
`docs/biome-ecology-pass2-plan.md` (the in-flight Pass 2 program).
**Roadmap step:** 12. **Status:** ✅ Step 12 primitives shipped; Pass 2 in progress.

Read source when it disagrees with this doc.

> **Audit note 2026-08-08:** this doc previously claimed "spec'd, primitives not yet built".
> That was stale by roughly six weeks — packs/call-allies, fixed patrol routes and swarm
> convergence had all shipped, and `server/test/biomeEcology.test.ts` pins them. Sections 2,
> 3 and 8 are corrected accordingly; the old "net-new for Step 12" list is now an inventory
> of what exists.

> **Update 2026-06-28:** monster attack-mode was refactored — `ranged`/`kite` are no longer
> separate booleans but derive from a single `behavior: 'melee' | 'ranged' | 'kiter'` field, and
> mountain chokepoint-holding is now an explicit `holdsChokepoints` flag (was inferred from
> `isRanged`). See `docs/monster-behavior-current-state.md`. Where this doc says "ranged/kite",
> read it as the `behavior` field.

---

## 1. Monster AI loop

`server/src/systems/combat/ai/ai.ts` → `updateMonsters(world, dt, now)` is a single flat
per-monster loop over `world.monsterEntities`. There is **no inter-monster coordination**.

Per monster, each tick:

1. **CC gates** — `isMonsterStunned` halts; `isMonsterKnockedBack` yields position control.
2. **Aggro acquisition** — only when `!hasAggroTarget`: `selectMonsterAggroCandidate` scans
   pull-range candidates. Retaliation aggro (set by the combat system) is preserved.
3. **Target resolve/validate** — `resolveAggroTarget`; drops on node-leave / death / disconnect.
4. **Leash** — past `leashRange` from `spawn` → drop aggro, `state="returning"`, head home.
5. **Engaged** — in-reach + line-of-sight → `attacking` (kiters call `maintainKiteStandoff`);
   else `chasing` (charge burst / kite-ramp speed handling).
6. **Disengaged** — state machine `chasing/attacking → returning → idle → wandering → idle`.
   Wander picks a **random** point within `wanderRadius` of `spawn` after a random idle delay.

State lives in two components:
- `hasAwareness` (`{ state, pullRange, leashRange }`) — **networked** (drives client render of
  idle/chasing/attacking).
- `controlsMonster` (`ControlsMonster`, `shared/src/components/targeting/controlsMonster.ts`) —
  **server-only scratch**: `spawn`, `wanderRadius`, `leashRange`, idle timers, `baseSpeed`,
  `kiteTimer`, charge/ramp accumulators. This is where new per-monster AI scratch belongs.

Tick order (`World.tick`, `server/src/world/World.ts:337`): `updateBossScripts` →
`updateUltimateEncounters` → … → `updateMonsters` (357) → `updateCombat` → … The new
coordination systems slot **before `updateMonsters`** (they set intent that `updateMonsters` reads)
or are folded into it.

## 2. Aggro / targeting

`server/src/systems/combat/ai/monsterTargeting.ts`:
- `selectMonsterAggroCandidate` → `candidatesInPullRange` scans `livePlayersInNode` +
  `minionEntitiesInNode` within `hasAwareness.pullRange` (× `playerDetectionMult(player)` from
  mobility boots — stealth already reduces effective pull). `bestCandidate` picks by
  `targeting.mode` (`closest` | `lowest-hp`).
- **Call-allies SHIPPED** (`ai/packs.ts`): `updatePacks` propagates a pack alpha's aggro target
  onto nearby un-aggroed followers and emits an `ecology-pulse` (`pulse: 'pack-call'`) telegraph.
  Monsters outside a pack still aggro independently.
- `targeting.ignoresTaunts` exists as a hook; taunt system partial.

`setAggroTarget` / `setAttackTarget` (`ai/targeting.ts`) are the only sanctioned mutators.

## 3. Spawning / population

`server/src/systems/world/spawning/index.ts`:
- `createMonster(world, nodeId, typeId, pos)` — builds the entity, sets `controlsMonster.spawn = pos`.
- `spawnMonster(world, nodeId)` — picks **one** random type from the biome pool
  (`biome.monsterPoolByTier[tier]`), tries 15 random positions respecting `MONSTER_MIN_SPAWN_DIST`.
- `ensurePopulation` — tops up to `getMobDensity(nodeId)` one mob at a time.
- Uses `Math.random()` freely — **the world/spawn layer is NOT deterministic** (only combat
  *outcomes* are deterministic: evasion accumulator, cadence counters, etc.). So group spawning
  and patrol-anchor placement may use RNG like the rest of spawning.
- `spawnPack(world, nodeId, alphaTypeId, pos)` (spawning/index.ts:892) — clustered alpha +
  typed followers sharing a `packId` via the `inPack` component. Survivors scatter (are
  removed) when the alpha dies (`onPackAlphaDead`).
- Fixed patrol routes SHIPPED — `patrol: { waypoints, mode, holdMinMs, holdMaxMs }` on the
  monster def replaces random wander while un-aggroed. Waypoints are relative to spawn.
- Swarm convergence SHIPPED — `ai/swarm.ts` `updateSwarm`.

## 4. Terrain / hazards (already built — do NOT rebuild)

`server/src/systems/world/nodeFeatures.ts` + `NodeFeatureSpec` (`shared/.../world/nodeFeatures.ts`):
- `blocksMovement` → chokepoints / walls (A* routes around them; `resolveObstaclesForNode` is the LoS gate).
- `damage` → positional DoT pools (poison/rot/lava).
- `statusWhileInside` → slow/chill zones.
- Runtime toggle via boss `set-feature-block`. `updateNodeFeatures` ticks them.

Swamp pools, Mountain chokepoints, Volcanic vents = **authoring on this**, not new tech.

Node features are STATIC authored terrain living for the life of the node. Their runtime
counterpart is section 9's ground zones — circles spawned by combat that live for seconds.

## 5. Boss / encounter expression (already built)

- `bossScript` (`BossScript`: phases + repeating; actions incl. `summon`/`spawn-adds`/`morph`/
  `slam`/`enrage`/`shield`…) — `ai/bossScripts.ts`.
- `ultimateEncounter` (`UltimateEncounter`: objective-gated stages, waves, environmental DoT) —
  `ai/ultimateEncounter.ts`.
- Gauntlet dungeon rework (altar / killable guardians / surviving-guardians-empower) designed +
  Mountain pilot — `docs/dungeon-current-state-and-gauntlet-plan.md`. Step 13 scaffolding owns this.
- `target-casting` rune condition exists (telegraphed cast window) for boss tells.

## 6. Networking surface (for telegraphs)

`shared/src/protocol/networkedEntity.ts`:
- `NETWORKED_MONSTER_KEYS` = `isMonster, hasPosition, hasHitbox, isMoving, hasAttackTarget,
  hasHealth, dealsDamage, performsAttack, mitigatesDamage, hasAwareness, hasStatus`.
- Monsters are **ephemeral** (node freeze/thaw) — never persisted. So any new networked monster
  field is runtime-only: **no DB migration**, just allowlist + dev-boot invariant + client render.
- Dev boot runs marker/network invariants — adding a networked COMPONENT means updating the
  allowlist and passing the invariant (fix the invariant, not the check).
- **Node-scoped payloads are a different seam and touch neither.** `DeltaSnapshot`
  (`shared/src/protocol/delta.ts`) carries per-node, non-entity state alongside the entity
  deltas — `voidOverlordRespawn`, `dungeonGauntlet`, and now `groundZones`. They are built in
  `server/src/world/nodeDelta.ts` (and `spectatorSnapshot.ts`) and read straight off the
  snapshot client-side. Reach for this before inventing a component.

## 7. Existing starter-biome mobs (retrofit targets)

| Biome | Mobs (id) | Notable existing mechanics |
|-------|-----------|----------------------------|
| Plains | `plains-slime`, `boar`, `prairie-wolf`, `stampede-bull`, `savanna-hawk` | bull charge; hawk ranged |
| Forest | `forest-slime`, `wolf`, `ancient-wolf` (chargeOnAggro 3×), `ironwood-golem`, `canopy-sprite` | wolf charge; golem tank; sprite ranged |
| Swamp | `bog-slime`, `mud-toad`, `swamp-hydra`, `bog-witch`, `mire-stalker` | witch caster; hydra; pools via dotEffect |
| Mountain | `cliff-hopper`, `ridge-archer`, `granite-titan`, `stone-eagle`, `peak-archer`/Boulder Thrower | archers ranged; titan tank |
| Cave | `cave-lurker`, `cave-brute`, `giant-spider`, `cave-troll`, `cave-gargoyle`, `deep-spider`, `cavern-troll`, `crystal-gargoyle` | brute/troll GROUND SLAM (section 9); gargoyle ranged; spider evasion + venom |

Advanced biomes exist as data sets: Jungle, Desert, Volcano, Tundra, Graveyard, Trench
(`shared/src/data/monsters/*.monsters.ts`, `advancedBiomesB.ts`).

## 8. Step 12 inventory (SHIPPED — do not rebuild)

The coordinated multi-monster AI and its telegraphs all landed:

1. **Packs + call-allies** — `inPack` component, `spawnPack`, `updatePacks`, `onPackAlphaDead`.
   Alpha aggro propagates to followers; survivors scatter on alpha death.
2. **Fixed patrol routes** — `patrol` on the monster def; a deterministic route replaces random
   wander while un-aggroed.
3. **Swarm convergence** — `ai/swarm.ts`.
4. **Telegraphs** — the `ecology-pulse` combat event (`pack-call` | `sun-mark` | `frost-shatter`).

Pinned by `server/test/biomeEcology.test.ts`.

## 9. Ground zones + the charged-slam rider (Pass 2, Session 1 — SHIPPED)

The runtime counterpart to section 4's static node features: node-scoped circles spawned by
combat.

- **Shared** — `shared/src/world/groundZones.ts` defines `GroundZoneKind` and `GroundZoneView`
  (`durationMs` + `remainingMs`, so the client tweens the fill locally between 5 Hz packets
  instead of stepping four times). Rides `DeltaSnapshot.groundZones`; no allowlist change.
- **Server** — `server/src/systems/world/groundZones.ts`. `world.groundZones: Map<nodeId, ...>`,
  ticked by `updateGroundZones` beside `updateNodeFeatures`, cleared by `freezeNode`.
  Runtime-only, never persisted. Zones are keyed by OWNER so every cast-abort path retires its
  own circle; the tick is only a sweeper for owners that vanished mid-cast.
- **Client** — `client/src/render/groundZones.ts` (`syncGroundZones` on delta,
  `drawGroundZones` per frame). Lifted from `render/dungeonHazards.ts`, which stays as the
  gauntlet's own thing.
- **`'slam-telegraph'` is cast-owner-lived.** Session 2 added an expiry-owned
  `'toxic-pool'` mode; owner cleanup cannot erase a pool after its monster dies.

`chargedAttack.aoe = { radius, damageMult? }` (`shared/src/data/monsters/types.ts`) turns a
charge into a **committed ground slam**:

- The impact point is planted at the target's position when the wind-up BEGINS
  (`plantChargeAoe`, stored as counters on `tracksCombat`) and is never re-read from the target.
- The cast deliberately does **not** abort when the target leaves attack range, and
  `updateMonsters` holds the mob in `attacking` for the duration instead of letting it chase.
  Without both, stepping out of the circle would cancel the very slam you were dodging.
- Stun, freeze and knockback still interrupt it — those paths are untouched.
- Resolution goes through `runMonsterAttack` **per victim**, not `applyMonsterAoe`. That path
  applies only plating + flat DR; a cap-tripping slam has to fold `chargeMult` into the
  empowered-spike path so the player damage-cap, Brace and shields apply, exactly as they do
  for a single-target charged hit.
- Consumers: `cave-brute` (T1), `cave-troll` (T2), `cavern-troll` (T3). **Every slam number is
  a placeholder** — castMs / radius / multiplier / cooldowns belong to the balance pass.

Pinned by `server/test/caveGroundSlam.test.ts`.

## 10. Engage sequences + monster death ecology (Pass 2, Session 2 — SHIPPED)

`MonsterDefinition.engageSequence` provides the first small, server-authoritative multi-beat
monster opener. `cave-troll` authors `charge-lock-charged-attack`: it gap-closes at a fixed
speed multiplier, applies a one-second source-owned player lockdown, then immediately hands
off to the existing committed `chargedAttack.aoe` slam. State is session-keyed on
`tracksCombat`; stun, freeze, knockback, target loss and leash break abort every pre-slam
stage. Lock markers track ownership so cleanup cannot remove an intrinsic Summoner
`cannotAttack` marker. Pinned by `server/test/caveEngageSequence.test.ts`.

`MonsterDefinition.onDeath` now authors two reusable death effects through the centralized
`onKill` pipeline:

- **`spawnHazard`** — `plague-hound` leaves an expiry-owned toxic pool. The server ticks
  per-player damage/slow cadence and kill attribution; the client renders a persistent fading
  circle. The pool survives owner removal and dies on expiry or node freeze.
- **`empowerAllies`** — `charnel-brute` buffs living monsters in its death radius with a timed,
  capped stacking outgoing-damage status and emits the `death-empower` ecology pulse.

The centralized listener also wires pack-alpha cleanup in production. Player AoE, proc damage,
and Alternating Currents now emit `onKill`, closing the indirect-kill paths these effects need.
Pinned by `server/test/monsterDeathEffects.test.ts`.

Everything the remaining Pass 2 biomes need beyond sections 9–10 (terrain, ranged/kite,
charge, DoT, boss scripts, gauntlet) **already exists** and is authored, not engineered. The
remaining primitives — player damage amplifiers (P3), the ambient node ramp (P4), and the
corpse registry (P5) — are scoped in `docs/biome-ecology-pass2-plan.md`.
