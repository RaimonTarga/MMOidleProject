# Biome Identity / Combat Ecology — Current State (audited 2026-08-08)

**Companion to:** `docs/archive/biome-ecology-plan.md` (the Step 12 program plan) and
`docs/archive/biome-ecology-pass2-plan.md` (the completed Pass 2 program).
**Roadmap step:** 12. **Status:** ✅ Step 12 primitives shipped; Pass 2 complete (all six
sessions, 2026-08-08/09) — see §§9–11 and 18–20.

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
per-monster loop over `world.monsterEntities`. `updatePacks` coordinates group encounters before it; see section 22 for the current pursuit and return rules.

Per monster, each tick:

1. **CC gates** — `isMonsterStunned` halts; `isMonsterKnockedBack` yields position control.
2. **Aggro acquisition** — only when `!hasAggroTarget`: `selectMonsterAggroCandidate` scans
   pull-range candidates. Retaliation aggro (set by the combat system) is preserved.
3. **Target resolve/validate** — `resolveAggroTarget`; drops on node-leave / death / disconnect.
4. **Leash** — solos use their personal leash; groups share the pursuit anchor and attack-grace check described in section 22.
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
- **Shared encounters** (`ai/packs.ts`): `updatePacks` coordinates targets, pursuit and return for pack members and bounded local swarms. New alerts emit an `ecology-pulse` (`pulse: 'pack-call'`) telegraph; see section 22.
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
- `spawnPack(world, nodeId, alphaTypeId, pos)` — clustered alpha + typed followers sharing
  a `packId` via the `inPack` component. **No scatter**: `onPackAlphaDead` was deleted in
  the T1–T4 monster rework, so every follower survives its alpha and is killable for full
  rewards. Followers ring the alpha at a radius that GROWS with pack size, so five- and
  six-body packs read as a ring rather than a pile.
- `packFollowerGroups(packDef, pickVariant?)` — the composition one spawn actually fields:
  the fixed `pack.followers` core plus, when `pack.followerVariants` is authored, exactly
  ONE rolled add-on group. This is what keeps a biome's packs from being the same formation
  forever. **Non-recursive by construction**: every member is built with `createMonster`,
  never with a nested `spawnPack`, so naming an alpha as somebody's follower yields one
  monster and no cascade.
- Packs REPLACE loose spawns rather than adding to them, because `ensurePopulation`
  re-reads the node count each iteration instead of assuming +1 per roll. The only legal
  overshoot is the last roll being the biggest authored pack, minus one. `biomeEcologyPolish`
  pins this bound; a naive `+1` accounting tripled Volcano's population in a mutation check.
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
- Guarded-altar dungeons (altar / killable guardians / per-biome guard posture) —
  `docs/dungeon-current-state.md`. The guard postures are built ON these ecology primitives
  (packs, `holdPost`/`holdPatrol`), not on dungeon-only AI.
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

1. **Packs + shared encounters** — `inPack`, `spawnPack`, `updatePacks`.
   Members pursue and return together; surviving companions remain after leader death (section 22).
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
  `drawGroundZones` per frame). Originally lifted from `render/dungeonHazards.ts`, which was
  deleted with the gauntlet's swamp rot pools; ground zones now own this rendering outright.
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
scoped in `docs/archive/biome-ecology-pass2-plan.md`.

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

## 14. Sparse plains trees (Pass 2 art follow-up — SHIPPED)

Four 1254×1254 transparent plains trees now live under
`art/src/files/environment/trees/plains/`: a windswept elm, old pasture oak, twin-trunk
aspen, and compact field hawthorn. ChatGPT image generation used the forest tree sheet for
rendering and the plains ground/shrub art for a deliberately dry palette of tan bark, muted
sage, khaki olive, and straw-gold. PixelLab was not used.

`shared/src/world/plainsTrees.ts` places exactly three deterministic trees in each normal
plains node and two in each plains dungeon, matching the swamp's sparse upper bounds while
preserving the central dungeon combat clearing. Trees reuse the split canopy/root depth
treatment and smooth trunk collision for players and monsters. Collision tests pin density,
dungeon clearance, dual-target blocking, and a connected walkable region across every
canonical plains node.

## 15. Mountain ledge polish (Pass 2 art follow-up — SHIPPED)

Mountain nodes keep their existing authored ledge rings and receive no added terrain props.
The procedural renderer now adds deterministic face highlights, cracks, and loose scree chips
so the same geometry reads with more depth and less repetition. The blocking band is tightened
from 96 px to 64 px, bringing collision closer to the visible cliff face while preserving two
navigation cells of continuous wall. Collision tests pin both the narrower authored geometry
and a valid route around the inner ledge corner.

## 16. Sparse biome tall props (Pass 2 art follow-up — SHIPPED)

Eighteen 1254×1254 transparent sprites now live under
`art/src/files/environment/tall-props/`: three cave formations, three desert formations,
three volcanic formations, three trench formations, three snow-covered tundra dead trees,
and three wasteland dead trees. They were generated with ChatGPT image generation using the
forest tree sheet for rendering language and each biome's ground/rock art for palette; PixelLab
was not used.

`shared/src/world/tallProps.ts` places exactly three formations in normal cave, desert,
volcanic, and trench nodes and two in their dungeons. Every candidate stays outside a 320 px
radius around each center-to-gate route, clears authored features by 260 px, preserves dungeon
combat space, and uses a very small smooth base ellipse despite the tall display art. Tundra and
wasteland nodes similarly receive three dead trees (two in dungeons) through
`shared/src/world/deadTrees.ts`. All props reuse split base/upper rendering for correct
walk-behind depth and block both players and monsters. Collision tests pin counts, palettes,
compact rock bases, route clearance, collision ownership, and connected navigation for every
affected canonical node.

## 17. Biome dungeon altars (art follow-up — SHIPPED)

Every canonical dungeon family now has a dedicated 1254×1254 transparent encounter altar
under `art/src/files/environment/dungeon-altars/`: forest, plains, mountain, cave, swamp,
jungle, desert, tundra, volcanic, wasteland (`graveyard` internally), and trench. Each sprite
uses its accepted ground sheet as the palette/material reference while retaining a consistent
compact footprint and three-quarter top-down camera. ChatGPT image generation produced the
sprites; PixelLab was not used.

`client/src/sprites.ts` maps every typed `DungeonBiomeGroup` to its altar texture, and the
dungeon overlay resolves that mapping from the node's canonical biome. Clearing and sanctuary
passive resets continue using their separate pale-stone reset shrine. The shared canonical
dungeon-biome list is checked against authored dungeon nodes so a future biome cannot be added
without extending the altar-art contract.

## 18. Player damage amplifiers + Desert pairs (Pass 2, Session 4 — SHIPPED)

P3, the last shared primitive, plus its first consumer. Volcano (Session 5) takes a
dependency on both halves, so they land here proven against Desert first.

**The amplifiers** — `shared/src/systems/playerAmplifiers.ts`. Two uncapped, status-driven
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
- The former global +100% taken / +50% dealt caps were removed. Status contributions
  sum without a global ceiling; individual effects retain their authored stack limits.
  Heat alone authors a logarithmic stack curve. Stances remain separate multiplicative
  layers, and equipment's per-hit damage-cap mechanic is unchanged.

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

## 19. Ambient node ramp + the move-slow clamp (Pass 2, Session 5 — SHIPPED)

P4, the last shared primitive, plus its first consumer and a standing hazard cleaned up.

**`NodeFeatureSpec.ambientRamp`** — `{ effectId, maxStacks, rampMs, payload }`, the
generalization of the old volcano-only `ambientHeat` (which only knew how to burn). One
per node, non-positional (its shape is a formality). `updateAmbientRamp` in
`server/src/systems/world/nodeFeatures.ts` owns the COUNTER only: a stack every `rampMs`
while the player is in the node AND in combat, one shed per `rampMs` out of combat
(faster at high stacks when `coolingScaleStacks` is authored),
cleared at zero. Biome exit (including admin teleport) and death clear the effect and
its buff icon immediately. Moving within the same biome preserves its ramp.

What a stack DOES is entirely the authored payload (`AmbientRampPayload` in
`shared/src/systems/ambientRamp.ts`), read by systems that key off status `data` rather
than status ids:

| Payload key | Read by |
|-------------|---------|
| `incomingDamagePct` | P3 `playerIncomingDamageMult` |
| `outgoingDamagePct` | P3 `playerOutgoingDamageMult` |
| `moveSlowPct` | `playerMoveSpeedMult`, via `ambientRampMoveMult` |
| `attackSlowPct` | `attackCadenceMult`, via `ambientRampAttackSlowPct` |

The movement stat panel includes the same temporary buff speed multipliers and slow
floor as client movement. Base position speed remains unchanged. Transition/death
cleanup also refreshes the displayed attack cadence and damage multipliers immediately.

**Adding a biome ramp is therefore pure data.** Tundra's chill (Session 6) needs a
`payload: { moveSlowPct }` and a `canonicalFeaturesForNode` branch — no server code. The
status carries a generic `isAmbientRamp` marker in its `data`, which is how the pass finds
a stale ramp to clear when the destination does not author the same effect, and how
`isHarmfulPlayerStatusEffect` counts any future ramp as cleansable without an edit.

**Volcano is a GREED ramp, not a burn.** Stacks are uncapped (`maxStacks: 0`).
Combat starts at one stack and adds one every 3000 ms, accelerated 3x in boss vents.
The first ten stacks give +3% damage dealt / +4.5% damage taken each: +30% / +45% at ten.
Above ten, effective damage stacks are `10 + 5 * ln(1 + (stacks - 10) / 5)`;
multiply by 0.03 / 0.045 for the respective bonuses. Every stack still matters,
but marginal gains decrease continuously. Combat and HUD share the same formula;
the Heat tile shows actual stacks and bonuses to one decimal, with no maximum-fill ring.
Out of combat the next stack takes `1500 / max(1, stacks / 10)` ms to cool
(`coolingRateMult: 2` doubles cooling at every stack count without changing buildup),
recomputed after each lost stack, preserving elapsed remainder. Growth and cooling
use separate clocks, reset on direction changes; neither can bank the other's progress.
Ten or fewer stacks cool at one per 1.5 seconds. Biome exit and death clear Heat.
Heat and Chill emit an `ambient-stack-gain` event for each actual gained stack,
including the first. The client applies a 360 ms red (Heat) or light-blue
(Chill) sprite tint at 85% peak strength, holding for 60 ms before fading into
the current aura/Flash Shift tint. Gains retrigger
the pulse without queued tweens; boss vents naturally repeat Heat pulses about
once per second. Cooling and capped Chill emit no gain cues. Death, removal,
node changes, full sync and render pauses discard transient flashes.
The burn is gone entirely (`tickHeatBurn` deleted) — positional fire damage stays where it
always was, on the lava vents. One status carries both dimensions, exactly as §18 predicted
it should.

**The move-slow clamp** — `playerMoveSpeedMult` in `shared/src/systems/playerMoveSpeed.ts`,
the single authority collapsing every speed multiplier on a player:

- Slows multiply against each other and the product is floored at
  `MIN_PLAYER_MOVE_SLOW_MULT` (0.35, placeholder). Hastes multiply on top of the floor, so
  mobility boots still help a fully-slowed player.
- A **root is not a slow**: `speedMult` 0 short-circuits and passes straight through, or
  the clamp would hand rooted players 35% of their speed back. Roots ride the shared `slow`
  id at `speedMult: 0`, so this case is live today, not hypothetical.
- The reason it exists: same-id effects overwrite, but DIFFERENT ids multiply, and the
  ecology pass keeps adding ids. A hazard slow, a frost ramp and an ambient chill at 0.6
  each compound to 0.216 — a soft root nobody authored, from three effects each of which
  reads as "slowed a bit" in the HUD.
- `server/src/systems/world/movement.ts` collects its inputs in `playerSpeedMults`;
  `client/src/render/players.ts` calls the SAME shared function over `PlayerBuff.speedMult`,
  so own-player extrapolation cannot drift from the server the way a locally-inlined clamp
  would.

**Farm-rate measurement** (`pnpm bench:balance --mode farm --biome volcanic`, 1 sim hour,
scale 2, one build per class root). Essence/hr vs the pre-session burn heat:

| Root | T3 Δ | T4 Δ |
|------|------|------|
| cadence | +8.9% | +15.2% |
| cooldown | +7.4% | +11.9% |
| reload | +24.1% | +11.9% |
| energy | +18.0% | +17.7% |
| dot | +9.2% | +3.8% |
| summoner | −1.0% | −0.4% |

A control run with an inert payload (`payload: {}`) landed within ±0.6% of the old burn
heat on every root, so **the entire lift is the greed ramp — removing the burn was worth
nothing**. The burn was never a farm-rate factor. Deaths did not rise (T4 summoner fell
12/hr → 9/hr): bench bots are geared for their tier, so the +48% taken side rarely converts
into a death, while the +30% dealt side converts into kills every fight. `outgoingDamagePct`
in `volcanicHeat()` is the one knob if that lift is too generous.

Pinned by `server/test/ambientRamp.test.ts` (ramp cadence, cap, both amplifiers, taken >
dealt, no burn damage, gradual decay, biome-exit/death cleanup, cross-biome teleport, the buff tile, the
clamp helper, and the clamp's wiring into real movement).

---

## 20. Tundra chill + Jungle thickets (Pass 2, Session 6 — SHIPPED)

The last session. Both biomes are consumers of primitives that already existed; between
them they add exactly one new engine field.

### Tundra — the chill, and the one thing that feeds on it

**The chill is P4 with the payload inverted.** `tundraChill()` in
`shared/src/world/nodeFeatures.ts` authors an `ambientRamp` with
`payload: { moveSlowPct: 0.05 }`, 6 stacks at 4000 ms — non-positional and invisible,
exactly like `volcanicHeat()`. Where the caldera pays you damage for overstaying and
charges you damage back, the tundra pays nothing: every stack is 5% of your movement and
that is the whole payload. At full chill you move at 70%, and the shared
`playerMoveSpeedMult` floor (§19) is what stops that from compounding with a roster
`slowEffect` and a `frost-ramp` into a root nobody authored.

`canonicalFeaturesForNode` gives it to **every** tundra node, dungeons included — tundra
authors no positional terrain at all, so the ramp *is* the node feature, and in a dungeon
it turns the boss exam into "kill it before the room takes your legs". No server code was
touched: this is the "adding a biome ramp is pure data" claim in §19, cashed.

**`MonsterDefinition.scalesWithAmbientRamp`** — `{ perStackPct, maxPct }`, the one new
field. The monster's outgoing damage grows with the ramp stacks **its target** is
carrying, capped. Applied in `runMonsterAttack` beside `monsterDeathEmpowerMult` as a
plain outgoing-damage layer, not an empowered spike: it does not claim
`empoweredAttack` metadata (so it never masquerades as the spike the player's damage-cap
armor is built to answer), and it is folded into `incomingGross` so Avenger/Vengeance
scale off what was actually swung. The pure read is `ambientRampScalingMult` in
`shared/src/systems/ambientRamp.ts`.

It keys off the **generic** ramp marker, not the tundra effect id — the mechanic is "this
thing grows on whatever the room is doing to you", and a node has one ramp by
construction.

**Exactly one carrier: `permafrost-behemoth`** (`{ perStackPct: 0.06, maxPct: 0.36 }`),
the T4 apex — locked decision 5's "capstone tell, not a roster-wide ramp". The pairing is
the point: the chill that takes your movement also feeds the one thing you cannot walk
away from, so Tundra's plant-and-outlast answer is precisely wrong against its capstone,
and cleansing the chill is worth more there than anywhere else in the biome. A test pins
the count at one — a second carrier is a design decision, not a data edit.

Client tell: the `debuff-tundra-chill` buff tile (stacks, fill toward full, and
`speedMult`, which own-player extrapolation reads through the same shared clamp), plus a
bestiary line on the apex — a hidden damage multiplier would be a bug.

### Jungle — the thicket broadcast (shipped mid-pass, recorded here)

Locked decision 4 was only half true in code until `d3632c3`: the dormant ambush spawner
was still there and the large aggro radius did not exist. Worse, the spawner was
*inverted* — it seeded its pack at `pullRange` 150, below the entire jungle roster's
240–290, so hidden mobs noticed the player **later** than one standing in the open.

Now `denseBush` carries `detectionMultWhileInside: 2` and no `spawns`.
`detectionMultForPoint` reads it straight off terrain and `playerDetectionMult`
multiplies each aggro candidate's pull range by it (capped at 3, so boots + thicket
cannot pull a whole node). Effective detection inside a thicket is 480–580px against a
300px bush radius: mobs standing in the open pull the moment you enter cover.

The multiplier is a **feature field, not status data**, and that is load-bearing:
`applyStatusEffect` refreshes an existing effect's duration but never replaces its
`data`, so riding the shared `slow` id would have left the thicket silently inert
whenever any other slow landed first.

Jungle also lost every pack declaration (`bf50ffe`) — the silverback arriving flanked by
two stalkers read in-game as a boss summoning adds. The biome groups fights through
terrain now. No mob was lost with its pack; all of them still spawn through
`monsterPoolByTier`.

The thicket remains a hazard for `avoid-hazards` routing purely through its
`statusWhileInside` slow (players only — monsters live there), which is now pinned by a
test, because dropping that slow in a balance pass would silently un-hazard the bush and
send autopathing players straight through the one place that gives them away.

Pinned by `server/test/tundraChill.test.ts` (every tundra node authors exactly one
all-cost ramp, the chill climbs/caps/sheds and drives neither damage amplifier, the slow
reaches real movement and meets the floor, the apex hits a fully chilled target harder
through the real attack path while an ordinary tundra mob does not, and the carrier count
is exactly one) and `server/test/jungleBushDetection.test.ts` (the broadcast, the cap, the
absent spawner, no jungle packs, and hazard-avoidance routing).


---

## 21. Ecology polish: Volcano packs, Wasteland packs, Tundra identity (SHIPPED 2026-09-11)

A small, targeted pass over three biomes ahead of T3/T4 bot testing. Not a rebalance — no
monster's HP, attack, rewards or a biome's `mobDensity` changed anywhere in it.

### Volcano — authored mixed packs (OVERTURNS a previous locked call)

The T1–T4 rework locked "density is the swarm, monster coordination is not" and left
Volcano a uniform field of 36 independent mobs. A high mob COUNT is not the same read as
"several weak creatures and a couple of dangerous ones came at me together", and the second
one is what the biome was supposed to be. **Plains keeps the straightforward volume swarm;
Volcano is now authored mixed packs.** The old warning comments in
`volcano.monsters.ts` are replaced, not merely contradicted.

Per tier the shape is identical, which is the point — the T4 deepening is the tier, not a
bigger formation:

| role | T3 | T4 |
|---|---|---|
| anchor alpha (5–6) | Magma Tortoise | Obsidian Tortoise |
| catcher alpha (3–5) | Cinder Hound | Infernal Direhound |
| elite alpha (3–4) | — | Magma Salamander |
| body follower | Ember Scuttler | Ember Skink |
| gunner follower | Ash Salamander | Ashspitter Salamander |

Followers stay in `monsterPoolByTier` (unlike Desert's dealers), so a node is packs **plus**
scattered bodies rather than only formations. The gunners are already `staticSentry`, so as
followers they plant on the pack ring and shoot past the bodies for free.

Deliberate restraint: **the fodder gained nothing.** Scuttlers and Skinks still have no
ability and no telegraph. With six bodies converging, the player has to be able to tell
which thing demands attention, and that is the tortoise's cast or the elite's shell — the
existing focal mechanical events, unchanged.

The elite gets the **smallest** pack in the biome for the same reason: burying the one fight
that is genuinely about its own mechanic in bodies would hide it.

### Wasteland — the Gravewright is the pack nucleus

The resurrection mechanic was already built; what was missing was an encounter that STARTS
in a state where it can fire. A lone necromancer has to wait for an unrelated kill to
wander inside its 280px `corpseRange` before its signature beat can happen at all.

The Gravewright is now a pack alpha whose entourage is ordinary Wasteland creatures — i.e.
**valid corpse material**. Core: 2× Bone Crawler. Variants add rats (cheap corpses, teaches
the loop fastest), another crawler, a Plague Hound (the one you want dead first, which is
the trap), or a Vulture + rat. Pack of 4–5.

The tactical question this creates is the whole point: *kill the necromancer, or clear the
things pressuring you and hand it the ammunition?*

Wasteland did **not** become a second swarm biome. Density stays 28 and its packs are
capped below Volcano's — Volcano's pressure is initial pack volume, Wasteland's is a
structured pack that refuses to stay dead. Both non-recursion layers still hold: `spawnPack`
never nests, and `recordCorpse` refuses risen mobs, so an entourage is a one-time meal
rather than a generator.

### Tundra — identity pass

Audited all seven normal mobs. Five already had a signature worth keeping and were left
alone; the pass was not a mechanics quota.

| monster | outcome |
|---|---|
| Glacier Bear / Glacial Dire-Bear | **preserved** — Ice Armor → Shatter window |
| Rime Caster | **preserved** — Frostbind, Chill-gated single-target root |
| Permafrost Behemoth | **preserved** — Glacial Slam + charged-only Chill scaling |
| Frost Lurker | **new** — RIME POUNCE |
| Rime-Tusk Mastodon | **deepened** — the same commitment, now a committed circle |
| Hoarfrost Yeti | **deepened** — Deep Freeze planted instead of following you |

**Frost Lurker — Rime Pounce.** The line had literally nothing ("meaningful direct hits, and
NOTHING else"), and its stat line asked a question it never answered: how does a speed-26
ambush predator reach anybody? It now opens with a `cast-charge-strike` — a short planted
wind-up, then a burst at ~156px/s into an amplified bite, once per aggro session. Chosen
over a debuff because the biome's slow is the room's job; a committed lunge is spatial, and
it fuses with the environment in the right direction (at full Chill the player is near
84px/s, so the colder the room has made you the more surely the pounce lands). Multiplier
is a modest 1.35 and fires once per engagement, so sustained pressure — the axis the tier
ladder is measured on — barely moves.

**Rime-Tusk Mastodon.** Same colour slot and role as the Frost Lurker, so it inherits the
commitment vocabulary rather than getting an unrelated gimmick. Frost-Tusk Impact keeps its
1.6 multiplier exactly and becomes a planted `area-hit` circle with knockback: bigger
(a circle, not a shot that follows you), harder (a ram should displace), and more demanding
of positioning. Cast 1000 → 1300ms so the 110px radius is genuinely walkable at base speed
and marginal at full Chill. **Knockback, never a stun** — displacement the player's
knockback resistance answers, not removed agency.

**Hoarfrost Yeti.** Deep Freeze is now a planted circle too. This deliberately makes the T4
root MORE avoidable than the T3's: it is the only root in the entire Tundra roster, and two
yetis chaining 2.2s of unavoidable root in one pull was exactly the composition failure the
biome's own rule is written against. Now two yetis plant two circles, and circles compose.

Control budget after the pass: one root (caster line only), zero stuns, zero per-hit slows,
zero ramping debuffs. All pinned.

### Engine / primitive changes

- `MonsterDefinition.pack.followerVariants` — alternative add-on groups, one rolled per
  spawn. Small data field, no new subsystem.
- `packFollowerGroups` + a follower ring radius that scales with pack size.
- **`resolveChargedSlam` now applies charged-attack riders.** `aoe` used to swallow every
  rider (`rootMs`, `appliesSlow`, `appliesAntiheal`, `refreshesPlayerDots`) — the planted
  path returned before `applyChargedAttackRiders` ran, so authoring `aoe` + `rootMs` produced
  a circle that rooted nobody and said nothing about it. No monster or boss in the game had
  hit the combination, so this closes a capability gap rather than changing an existing
  encounter — and it is what lets a root become a circle you can step out of. **This was a
  known authoring trap; it is now covered by a mutation-checked test.**
- `MonsterAbilityAction`'s `area-hit` gets its first author (the Mastodon). The engine path,
  its ground telegraph and its bestiary text already existed and were unused.
- Client: `fxDiveBomb` takes an optional palette so a ground lunge can reuse the rush line
  without reading as talons (`rime-pounce`, frost); the committed tusk circle anchors its
  impact FX on the **planted point** rather than the victim, so walking out is not visually
  contradicted.

### Tests

[`server/test/biomeEcologyPolish.test.ts`](../server/test/biomeEcologyPolish.test.ts) —
pack composition and weak/strong mixture at both Volcano tiers, tier containment, variant
distinctness and reachability, a roster-wide "no alpha is anybody's follower" check,
`ensurePopulation` staying inside the density bound over repeated samples, Gravewright
entourage validity, the live corpse→raise loop fed by the pack's own dead, the `maxAlive`
cap under a flood, the risen-leave-no-corpse invariant, the Tundra control budget, and every
new beat firing live (Rime Pounce arms/lands/does-not-re-arm; Deep Freeze roots inside its
circle and **does not** root a player who stepped out).

`server/test/monsterMobileCast.test.ts` moved its mobile-cast exemplar from the Rime-Tusk
Mastodon to the Obsidian Tortoise — the Mastodon is now the committed half of that contract.

## 22. Shared group encounters (2026-09-21)

This section supersedes the earlier independent-leash/call-range descriptions.
`inPack` now references one ephemeral coordination state shared by the living
members, initialized when a pack or dungeon station spawns. It retains the initial
home, a moving pursuit anchor, one target, and the group return state. Leader death
chooses a surviving leader without moving either anchor or removing followers.

- Proximity acquisition or an attack on any member engages the group. Members do
  not individually drop aggro because their personal leash or alert radius differs.
- Player and summon attacks move the **shared pursuit anchor** to the struck member.
  Kiting remains effective: sustained attacks keep every companion engaged beyond
  the original spawn territory. Direct attacks, beam/laser attacks, AoE and proc
  damage renew pursuit; passive residual DoT ticks alone do not renew the attack window.
- A living target must be outside the current shared pursuit leash AND the group
  must have gone five seconds without an incoming attack before it returns. Target
  death, disconnect or node departure also ends the encounter. The five-second
  attack gap is `PACK_ATTACK_GRACE_MS`, not a combat timeout while inside the leash.
- A hit during return immediately renews pursuit for the entire group. Ordinary
  proximity alerts cannot interrupt one member's return. Otherwise early arrivals
  wait for all survivors, then restore the initial pursuit anchor and resume roaming.
- Return movement uses base speed: the old 1.6x return boost is removed for all
  ordinary monsters. Casts and combat ramps are cleaned up on coordinated return.
- Original return positions remain separate from the moving pursuit anchor.
  Dungeon altar activation still expands the group's leash and overrides return.

Authored differences use monster data rather than biome branches in the executor:

| Group | Current behavior |
| --- | --- |
| Forest wolves | Persistent packs, tight 90px idle-follow radius; followers track the living leader instead of independently wandering. |
| Plains callers | Persistent packs with a looser 180px idle-follow radius. |
| Loose Plains swarm creatures | On engagement recruit at most three nearby eligible creatures within 260px; membership stays fixed for the encounter, recruits cannot recruit again, and the group dissolves after returning. Independent nearby pulls remain possible. |
| Volcano mixed packs | Persistent groups with a 140px idle-follow radius; melee pursuit, planted casts and ranged attacks retain their existing member-specific behavior. Loose Volcano mobs do not recruit new packs. |
| Other existing packs / dungeon stations | Share the same encounter lifecycle. Default idle-follow radius is 120px; authored posts and patrols take precedence. |

Movement flocking now separates different combat targets. Pack membership does not
force identical attack positions or erase ranged/caster roles. `pack.callRange` was
removed: it no longer determines whether a known companion participates. The
bestiary describes shared pursuit and bounded local swarm recruitment.

Jungle remains terrain/cast driven in this pass. Bush detection amplification and
Chestbeat's two-ally, one-hop rally remain. Chestbeat now also replaces the obsolete
attack ramps on Silverback and Apex Silverback, sharing the early Ape's 1.3-second
cast, expanded 480px radius, 30% haste for 4.5 seconds and one rally per combat. Tests exercise
all three gorillas, including suppression of rallies from recruited gorillas.
Successful rallies now create temporary coordinated groups: the caller plus at most
two idle recruits share pursuit, attack renewal and return, then dissolve after all
survivors reach home. Caller death preserves surviving allies. Existing packs,
bosses/adds, dungeon guardians and returning mobs are excluded from recruitment;
haste alone does not grant membership. Bush pulls still acquire independently.
No density or placement changes were made; see the Jungle ecology follow-up in
`future-plans.md`. Regression coverage is in `packCoordination.test.ts`, with
existing ecology, dungeon and Jungle wiring coverage. Automated checks do not
establish live pacing or visual acceptance.

Validation (2026-09-21): workspace typecheck and shared/client/server builds passed;
focused pack, mixed-ecology, Desert, dungeon and Jungle checks passed. The full
workspace suite finished **252/263 passing**. Failures outside the pack regressions:
`biomeEcology` (unchanged Snapper balance assertion); `boss2Matrix`, `boss3Cleanse`,
`boss3Matrix`, `boss4Matrix`, `boss4Pressure`, `boss5Matrix`, `boss5Pressure` (frozen
boss attack expectations); `durability8` (floating-point equality); `tier1Snapshot`
(unsupported range branch); and the bot `harness` (invalid legacy build). Frozen
balance expectations were not rewritten. No live browser playtest was performed.
