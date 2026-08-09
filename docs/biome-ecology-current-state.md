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

## 11. Corpse registry + raises (Pass 2, Session 3 — SHIPPED)

The wasteland necromancer no longer conjures its swarm from nothing — it raises **the
player's own kills**.

- **Corpse registry** — `server/src/systems/world/corpses.ts`. `world.corpses:
  Map<nodeId, RuntimeCorpse[]>` (`{ monsterTypeId, pos, diedAtMs }`), a per-node ring buffer
  capped at `MAX_CORPSES_PER_NODE` (16) with a `CORPSE_TTL_MS` (15 s) sweep in `updateCorpses`,
  ticked beside `updateGroundZones` and cleared by `freezeNode`. Runtime-only, never persisted.
  Recorded from the centralized `onKill` listener, so every kill path (attack, AoE, proc, DoT,
  beam, laser) feeds it. **Bosses and risen mobs leave no corpse** — that is what stops a tide
  from re-raising itself forever.
- **`MonsterDefinition.raisesDead`** — `{ intervalMs, initialDelayMs?, corpseRange, maxAlive,
  hpMult?, damageMult? }`. `updateRaisers` (`server/src/systems/combat/ai/raiseDead.ts`) runs
  before `updateMonsters` with the other ecology coordinators: it only creates entities and
  sets intent. A raiser works **only while it holds an aggro target**, and the cadence is keyed
  to that aggro SESSION — leashing out and re-pulling restarts the initial delay instead of
  firing a banked timer on re-engage. No corpse in `corpseRange` means no raise.
- **`isRaised { raiserId }`** — server-only marker (not in any networked allowlist). Its
  presence is the reward gate: `grantMonsterRewards` returns null for a risen mob, which zeroes
  essence, biome XP, catalyst progress, quest credit, party share and dungeon credit in one
  place because every kill path funnels through it. It also keys the raiser's `maxAlive` cap
  and the crumble sweep.
- **Client tell without new protocol** — the risen copy is renamed `Risen <Name>` on the
  already-networked `isMonster` slice, and the raise emits a `raise-dead` ecology pulse
  (plague-green ring, deliberately a different family from the purple `death-empower` surge).
- **`onRaiserDead`** runs from the same centralized `onKill` listener and *removes* (never
  kills) every risen mob owned by the dead raiser — mirroring `onPackAlphaDead`, so the sweep
  can never become a reward path.

`gravewright` is re-authored off its old `spawn-adds` boss script onto the real raise
(placeholder numbers: 5 s cadence, 2.5 s initial delay, 280 px reach, 4 alive, 0.7 HP / 0.8
damage). Risen mobs count toward node density like any other monster, so the tide suppresses
ambient respawn while it is up. Pinned by `server/test/corpseRaise.test.ts`.

## 12. Jungle brush trees (Pass 2 art follow-up — SHIPPED)

Four 1254×1254 transparent jungle trees now live under
`art/src/files/environment/trees/jungle/`: kapok, strangler fig, palm cluster, and a
liana-draped emergent. They were generated with ChatGPT image generation using the forest
sheet as the style/scale reference; PixelLab was not used.

`shared/src/world/jungleTrees.ts` scatters trees deterministically on open ground only. Each
candidate must clear every authored brush radius by an additional 490 px, keeping the large
tree art and thicket art out of the same depth stack entirely. Open-world nodes target at most
three trees (and may use fewer when the brush layout leaves less room); dungeons target two
and also preserve the altar clearing. Each tree uses the
forest trees' split canopy/root render treatment and a smooth trunk ellipse blocking both
players and monsters. `shared/src/collision/collision.test.ts` checks the one-or-two density,
brush clearance, both collision targets, and one connected walkable region for every T2–T4
jungle node and dungeon.

Everything the remaining Pass 2 biomes need beyond sections 9–12 (terrain, ranged/kite,
charge, DoT, boss scripts, gauntlet) **already exists** and is authored, not engineered. The
remaining primitives — player damage amplifiers (P3) and the ambient node ramp (P4) — are
scoped in `docs/biome-ecology-pass2-plan.md`.

## 13. Swamp dead trees (Pass 2 art follow-up — SHIPPED)

Four 1254×1254 transparent dead-tree sprites now live under
`art/src/files/environment/trees/swamp/`: a hollow cypress snag, twisted mangrove, split
swamp oak, and leaning drowned snag. They were generated with ChatGPT image generation using
the forest tree sheet as the rendering reference and the swamp ground as a palette reference;
PixelLab was not used.

`shared/src/world/swampTrees.ts` scatters one to three trees deterministically on dry open
ground (up to two in dungeons). Every trunk anchor must clear each authored rot pool radius by
an additional 490 px, which conservatively keeps the complete rendered sprite — branches and
roots included — off the pool art. The densely pooled T2/T3 dungeon layouts intentionally
receive no tree when no position can also preserve the altar clearing and image bounds. Trees
reuse the split canopy/root depth treatment and smooth dual-target trunk collision.
`shared/src/collision/collision.test.ts` pins pool clearance, collision ownership, sparse
density, and a connected walkable region across every canonical swamp node.

## 18. Player damage amplifiers + Desert pairs (Pass 2, Session 4 — SHIPPED)

P3, the last shared primitive, plus its first consumer. Volcano (Session 5) takes a
dependency on both halves, so they land here proven against Desert first.

**The amplifiers** — `shared/src/systems/playerAmplifiers.ts`. Two capped, status-driven
multipliers on the player, the mirror of `getAntiHealMult`:

- Neither is owned by a status id. **Any** status on the player contributes by carrying
  `damageTakenPct` / `damageDealtPct` in its `data` (`Record<string, number>` only, so a
  per-stack fraction is all it can be). That genericity is the point: one Volcano heat
  effect can drive both dimensions at once, exactly as `frost-ramp` carries move-slow and
  attack-slow together.
- `playerIncomingDamageMult` is read by an `onDamageTaken` listener
  (`server/src/systems/combat/damage/playerAmplifiers.ts`) registered in `combatBootstrap`
  **before `initDefenseSystems()`**. ⚠ That order is load-bearing: the amplifier runs ahead
  of evasion, the damage-cap and shields, so an amplified spike is still clipped by the cap
  the player paid for and the shield absorbs the amplified amount. Registering it after the
  cap would walk a stacking vulnerability straight through the one layer that answers spikes.
- `playerOutgoingDamageMult` is read **once**, inline in `runPlayerAttack` next to
  `shared.damage-mult`, as a plain outgoing layer that never touches empowered/charge
  metadata. It has no authored consumer until Volcano; the seam is live and tested.
- A pipeline listener rather than an inline read in `runMonsterAttack` on purpose: every
  path that resolves a player hit through the pipeline is covered, and
  `ctx.metadata.incomingGross` stays honest as "what the monster swung for" (Avenger /
  Vengeance scale off it and shouldn't be paid twice for a debuff).
- Caps are `MAX_DAMAGE_TAKEN_PCT` (1.0) and `MAX_DAMAGE_DEALT_PCT` (0.5). Placeholders.

**`MonsterDefinition.appliesVulnerability`** — `{ damageTakenPct, maxStacks, durationMs }`.
Stacks the cleansable `sundered` status on every landed hit, applied next to
`appliesAntiheal` with the standard `canApplyPlayerDebuff` + `evadeBlocksDebuffs` +
`mobilityTenacityDurationMult` gates. Feeds a `debuff-sundered` buff tile.

**Desert re-authored into controller/dealer pairs.** The biome was three independent
debuff-appliers plus a Sun Mark duel; it is now one relationship, tiered:

| Role | Line | Shape |
|------|------|-------|
| Controller (pack alpha) | basilisk | High HP, low offense, full root, sunders from T3 |
| Dealer (pack follower) | scarab | Low HP, fast, `kiter`, high damage |
| Harasser (solo) | scorpion | Unchanged — catches you when you disengage |

The exam is target priority, which the biome previously lacked: burst the squishy dealer and
the controller is a harmless rock; kill the controller instead and `onPackAlphaDead` scatters
the dealers with **no rewards** — fast, but you leave essence on the sand. `dune-tyrant` is
the T4 apex controller and inverts the trade: a light sunder behind a real slam, so its
cooldown spike lands into its own sundering, straight at the damage cap.

**Sun Mark is gone from every desert trash mob** (locked decision 3). The engine survives on
the T2 boss, which now **paints its own mark** — the phase-2 `dust-djinn` adds used to be the
only painters, so `markedStrike` could never fire before 50% HP and never at all if the adds
died on arrival. This is the one boss line Session 4 touched.

⚠ Self-marking exposed an engine ordering bug that is now closed: `markedStrike` consumes the
mark *before* damage while `appliesMark` repaints *after* it, so a monster carrying both
would have repainted on the very hit that cashed the mark and landed every hit from the
second onward amplified, forever. The applier now skips when `ctx.metadata.sunMarkConsumed`
is set, making a self-marker **alternate** — paint, cash, paint, cash.

Every desert number is a placeholder; the stat *shapes* (controller HP↑/attack↓, dealer
HP↓/attack↑/speed↑) are the authored intent. Pinned by `server/test/desertPairs.test.ts`.
