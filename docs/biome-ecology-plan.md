# Biome Identity / Combat Ecology — Program Plan (Step 12)

**Companion to:** `docs/biome-ecology-current-state.md` (the audit).
**Roadmap:** `docs/system-rework-roadmap.md` Step 12. **Status doc:** `docs/system-rework-status.md`.

Step 12 turns each biome into a **combat ecology** (spawn pattern · grouping · aggro/pull ·
attack profile · terrain/hazard · dungeon/boss expression) rather than a stat package. It is a
**multi-session program**, not one session.

---

## Decisions locked (2026-06-24 Q&A)

| Axis | Decision |
|------|----------|
| **Deliverable** | **Full program design** — primitives + every biome's ecology outlined now (5 starters + 6 advanced). |
| **Primitives (first pass)** | **All three** — packs+call-allies, fixed patrol routes, swarm convergence. |
| **Behavior change** | **Retrofit existing mobs now** — current biome mobs adopt the new behaviors, not opt-in-only. |
| **Telegraphing** | **Add light telegraphs** — networked hints (alpha indicator, call-allies ping, patrol/alert state) the player can read. |

Standing constraints (from CLAUDE.md / architecture):
- **Server-authoritative.** All ecology logic is server-side; client only renders telegraphs.
- **Determinism scope.** Combat *outcomes* stay deterministic (no RNG in damage/aggro resolution).
  The **spawn/world layer already uses `Math.random()`** — group spawning & patrol-anchor placement
  may use it like the rest of spawning. Coordination *decisions* (assist, alert, converge) are
  derived from positions/state, not RNG.
- **Component presence gates behavior.** Even with "retrofit", behavior is driven by attached
  components / monster-data fields, never by `false`/`0`/empty sentinels. "Retrofit" = we author
  those fields onto existing mobs in this program, not gate behind a flag.
- **Monsters are ephemeral** (node freeze/thaw). No pack/patrol/alert state is ever persisted.
  New networked monster fields are runtime-only → **no DB migration**, just allowlist + invariant.
- **`mutateSlice`/`markSliceDirty`** for any in-place networked-slice change.

---

## Part A — AI primitives (build first; one or two sessions)

Three reusable primitives, authored once, consumed by every biome. Built **before** any biome
session. Each is component-gated so a mob without the component behaves exactly as today (the
retrofit is then authoring those components onto the right mobs).

### A1. Packs + call-allies

**Goal:** alpha↔follower grouping; followers assist the alpha & each other; aggroing/hurting one
member alerts nearby allies (shared aggro / call-allies).

**Data (monster def, `shared/src/data/monsters/types.ts`):**
```ts
/** Pack behavior. Presence opts the mob into grouped AI. */
pack?: {
  role: 'alpha' | 'follower';
  /** Followers stay within this radius of their alpha; alpha ignores. */
  cohesionRange?: number;
  /** A member taking aggro alerts un-aggroed allies within this radius. 0/omit = no call. */
  callRange?: number;
  /** Followers that lose their alpha (dead) do this. */
  onAlphaDeath?: 'disperse' | 'enrage' | 'hold';
}
```

**Spawn (`spawning/index.ts`):** new `spawnPack(world, nodeId, packSpec, anchor)` that places one
alpha + N followers in a loose formation around an anchor (reuses the min-spacing placement).
Biome spawn config (below) decides when a top-up spawns a pack vs a lone mob. Pack membership is
assigned at spawn time into a **server-only** runtime link.

**Runtime state — new server-only component `inPack` (NOT networked-persisted):**
```ts
interface InPack {
  packId: string;          // shared id minted at spawn
  role: 'alpha' | 'follower';
  alphaEntityId?: string;  // followers point at their alpha
}
```
Mint `packId` per `spawnPack`. Stored like other runtime monster state; cleared on death/despawn.

**System — `ai/packs.ts` → `updatePacks(world)` (runs before `updateMonsters`):**
- **Assist / shared aggro:** when any pack member has an aggro target and an idle member is within
  `cohesionRange`, set the idle member's aggro to the same target (via `setAggroTarget`). This is
  the "followers assist the alpha" rule — deterministic (position + state derived).
- **Call-allies:** when a member *acquires* aggro (edge-triggered) or *takes a hit*, alert
  un-aggroed allies within `callRange` → they aggro the same target. Edge-trigger via a
  `lastAlertTick` guard on `inPack` to avoid per-tick re-alerts.
- **Cohesion (followers):** a follower with no aggro target biases its wander/return anchor toward
  the alpha's position instead of its own `spawn` (reuses the existing wander machinery — just
  swaps the anchor). Alphas are unaffected.
- **onAlphaDeath:** on alpha death, surviving followers run the configured behavior (disperse =
  normal solo AI; enrage = small stat-buff via existing buff; hold = freeze in place briefly).

`updateMonsters` stays the executor: `updatePacks` only *sets intent* (aggro target + anchor),
then `updateMonsters` moves/attacks as today. Keeps the movement/leash/kite logic single-sourced.

**Telegraph (networked):** alpha gets a visible marker; a member that just called allies emits a
**transient pushEvent** ("alerted"/"howl") for a one-shot client animation (reuse
`world.pushEvent(nodeId, …)` like hit/dodge events — NO per-tick boolean). Alpha-ness is stable →
add a small networked field (see "Telegraph plumbing").

### A2. Fixed patrol routes

**Goal:** elites/sentinels hold predictable territory on a repeating path (Cave brutes, Mountain
sentinels) instead of random wander.

**Data (monster def):**
```ts
/** Replaces random wander with a deterministic patrol path while un-aggroed. */
patrol?: {
  /** Waypoints RELATIVE to spawn (so one def works at any spawn anchor). */
  waypoints: Vec2[];
  /** 'loop' = ...→last→first; 'pingpong' = ...→last→...→first. */
  mode: 'loop' | 'pingpong';
  /** Pause at each waypoint. */
  holdMinMs?: number; holdMaxMs?: number;
}
```

**System:** fold into the disengaged branch of `updateMonsters` (the `idle/wandering` arm). When a
mob has `patrol`, the wander state is replaced by patrol-route advancement: head to the next
waypoint (`spawn + relativeWaypoint`), hold, advance the index. `controlsMonster` gains
`patrolIndex` + `patrolDir` scratch (server-only). Aggro still interrupts normally; on return +
re-idle, the mob resumes the route from its nearest/last waypoint. Movement uses the existing
`setEntityMotion` + A* (routes around `nodeFeatures` chokepoints for free).

**Determinism:** waypoint advancement is index-based (no RNG); the hold time may use the existing
random idle-timer (cosmetic, same as wander today).

**Telegraph:** patrol mobs surface their `state` already (`wandering` vs `chasing`). Optionally add
a "patrolling" awareness sub-state + high-detection visual cue for Cave elites (detection range is
already `pullRange` — author it larger; the telegraph is making that legible). Patrol-path
preview lines are a **Step 14 UI** concern, not here.

### A3. Swarm convergence

**Goal:** many weak mobs create many-body pressure — they cluster and converge rather than each
peeling off solo (Plains).

**Data (monster def):**
```ts
/** Light flocking while aggroed: converge toward the shared target as a group. */
swarm?: {
  /** Bias strength toward the group's mean approach vector (0..1). */
  cohesion: number;
  /** Min separation kept from swarm-mates (avoids stacking on one pixel). */
  separation: number;
}
```
Plus a biome **spawn-config** knob: swarm mobs spawn in clusters and at higher density (reuse
`getMobDensity` + a cluster-spawn like `spawnPack` without an alpha).

**System — `ai/swarm.ts` → `updateSwarm(world)` (before `updateMonsters`):** for swarm mobs sharing
a target in a node, nudge each one's *chase destination* with a small cohesion+separation offset
(boids-lite, position-derived → deterministic). It only adjusts the destination passed to
`setMonsterTarget`; `updateMonsters` still does the actual movement/attack. Keep the offset small so
it never overrides leash or makes mobs uncatchable.

**Telegraph:** swarm pressure is self-evident (many bodies). No bespoke telegraph beyond the
existing render; optionally a subtle "rallying" pushEvent when a cluster first converges.

### Telegraph plumbing (shared by A1–A3)

Two channels, matching existing patterns:
- **Stable state → networked field.** Add a tiny networked monster component (e.g.
  `hasPackRole { isAlpha: boolean }`) or extend `hasAwareness` with an optional `role`/`alert`
  flag. Update `NETWORKED_MONSTER_KEYS`, pass the dev-boot invariant (fix the invariant, not the
  check), add a `PlayerView`/monster-view field if the client reads it, render in
  `client/src/render/monsters.ts` (e.g. alpha outline/crown).
- **Transient events → `world.pushEvent(nodeId, event)`.** Call-allies "howl", swarm "rally" =
  one-shot animation events (new event kind in the world-events union), consumed by the client
  render exactly like hit/dodge/kill events. **No per-tick booleans on networked slices.**

**Cross-cutting per the roadmap:** networked-allowlist + invariant (done above), protocol/view
fields for any client-read state, admin visibility is optional (monsters aren't in the admin
character views; world-log/ops-map could show pack/patrol if cheap), `combatBootstrap` parity only
if any primitive registers a *combat listener* (call-allies-on-hit could be an `onDamageTaken`
listener → if so, register in `initCombatSystems()` for live/bench parity; the alternative is a
position-scan in `updatePacks`, no listener — **prefer the scan** to avoid bench divergence).

---

## Part B — Retrofit map (which existing mobs get which primitive)

Authored alongside / right after the primitives. Numbers (ranges, counts, hold times) are
**placeholders → user balance pass (Step 15)**.

| Biome | Primitive | Applied to | Intent |
|-------|-----------|------------|--------|
| **Plains** | swarm + call-allies | `plains-slime`, `boar`, `prairie-wolf` cluster; `savanna-hawk` caller | many-body pressure; some mobs call the swarm |
| **Forest** | packs (alpha+followers) | `ancient-wolf`=alpha, `wolf`=followers (callRange); `canopy-sprite` ranged support | fast coordinated packs hunt the player |
| **Swamp** | terrain (existing) + light call-allies | `bog-witch`/`mire-stalker` pool-makers; `mud-toad` callers | attrition; mobs reinforce on bad terrain |
| **Mountain** | patrol (sentinels) + chokepoint terrain | `granite-titan`/sentinels patrol chokepoints; `ridge-archer`/`peak-archer` hold behind | break a defended position |
| **Cave** | patrol (elites) + high detection | `cave-brute`/`cave-troll` fixed routes, large `pullRange`; overpull risk | choose fights, avoid overpulling |

Advanced biomes (Part C) layer the same primitives + existing hazards.

---

## Part C — Per-biome ecology specs (full program outline)

Each biome = one focused session (after primitives). Each authors: **spawn pattern · grouping ·
aggro/pull · attack profile · terrain features · dungeon/boss hook**. Boss authoring folds in per
the Step 13 scaffolding (exam template + reward bundle + tell conditions). One-sentence teaching
goal in brackets.

### Starters

1. **Plains — Swarm Field** *[survive the swarm]*: clustered high-density spawns; swarm convergence;
   callers pull more; weak individuals. Terrain: open. Boss: many-body + add-summon exam.
2. **Forest — Predator Packs** *[survive the pack]*: alpha+1–2 follower packs; call-allies; fast
   pursuit (existing wolf charge). Terrain: tree pathing (exists). Boss: alpha pack leader.
3. **Swamp — Attrition Terrain** *[survive the rot]*: pool-maker mobs + on-death pools (nodeFeatures
   `damage`/`statusWhileInside`); light reinforcement. Boss: hazard-field exam.
4. **Mountain — Guarded Ascent** *[survive the impact / guarded position]*: sentinel patrols holding
   `blocksMovement` chokepoints; ranged behind frontline; telegraphed slams (existing). Boss: defended position.
5. **Cave — Patrolled Elite Territory** *[survive the elite]*: sparse durable elites on fixed
   patrols, high detection, overpull risk. Boss: single hard target.

### Advanced (reuse primitives + hazards; thematic layer)

6. **Jungle** — ambush ecology: hidden/low-detection-until-close packs + overgrowth chokepoints.
7. **Desert** — lethal duels: marked-target duelists (existing mark mechanics) in open space; sparse.
8. **Volcanic** — escalating heat: `rampOnCombat` + lava vents (`nodeFeatures damage`) + enrage soft-timer.
9. **Tundra** — frozen tempo: chill/slow zones + frost-ramp; shatter windows; patrols.
10. **Graveyard** — recursive horde: swarm + revival adds (boss `spawn-adds`) + curses.
11. **Trench** — abyssal pressure: rare super-elite patrols; environmental DoT pressure.

Each advanced biome's exact mob assignments are decided at its own session against the live data set.

---

## Session sequencing

1. **Primitives session(s)** — A1 packs+call-allies, A2 patrols, A3 swarm, + telegraph plumbing.
   Likely two sessions (A1 is the biggest; A2+A3 can pair). Verify with the combat bench (no
   regression to solo mobs) before authoring biomes.
2. **Step 13 scaffolding** (separate, but needed before bosses) — exam template, reward bundles,
   tell conditions, structural boss-access gating. See `docs/dungeon-current-state-and-gauntlet-plan.md`.
3. **One session per biome** (5 starters first, then 6 advanced) — author spawn/grouping/pull/
   attack/terrain + the biome's boss-exam on the scaffolding. Update the status-doc scoreboard
   with per-biome progress each session.

---

## Cross-cutting checklist (apply each primitive/biome session)

- [ ] **Networked allowlist + dev-boot invariant** — any new networked monster field added to
  `NETWORKED_MONSTER_KEYS`; fix the invariant, not the check.
- [ ] **Protocol / monster view** — client-read telegraph state goes through shared view, not a
  hand-written socket type.
- [ ] **No persistence** — pack/patrol/alert/swarm state is runtime-only (monsters are ephemeral).
- [ ] **combatBootstrap parity** — only if a primitive registers a combat listener; prefer a
  position-scan system over an on-hit listener to avoid live/bench divergence.
- [ ] **Determinism** — coordination decisions derived from position/state, not RNG; RNG only where
  spawning already uses it.
- [ ] **Bench / tooling** — `monster-ref` / bestiary tooling learns pack/patrol/swarm (Step 15).
- [ ] **Single executor** — primitives set intent; `updateMonsters` stays the only mover/attacker.

---

## Red-team (carry through)

```text
Do packs/swarms make solo mobs uncatchable?   → cohesion/swarm offsets stay small; leash unchanged.
Does call-allies cascade into whole-node pulls? → callRange bounded + edge-triggered, not per-tick.
Do patrols feel predictable (good) or scripted-dead? → fixed routes + existing aggro interrupt.
Are telegraphs legible without clutter?         → alpha marker + transient howl/rally events only.
Did retrofit silently rebalance T1?             → flag to user; numbers are the Step 15 pass.
Are advanced biomes new problems or reskins?    → each must add a hazard/coordination twist, not stats.
```

---

# Biome authoring methodology (AS-BUILT — proven across all 5 starters)

> This is the reference recipe for authoring a biome, distilled from the Forest / Plains /
> Mountain / Swamp / Cave sessions. Follow it for every remaining biome (6 advanced + any
> re-pass). The primitives + terrain + telegraph machinery already exist — a biome session is
> **data authoring + a focused verification**, not engineering. All magnitudes are placeholders;
> the user owns numeric tuning (Step 15).

## 0. One sentence first
Pin the biome's **teaching goal** ("survive the X") and its **mitigation answer** (the armor/stat
that counters it). Everything below serves that one sentence. The five done:
Forest = *survive the pack* (evasion) · Plains = *survive the swarm* (plating) ·
Mountain = *break the guarded position* (damage-cap) · Swamp = *survive the rot* (dot-resist) ·
Cave = *survive the elite* (%DR).

## 1. The per-biome recipe (the loop we ran 5×)
1. **Read the biome's data** — `shared/src/biomeDatabase.ts` (the `monsterPoolByTier` + `bossPoolByTier`),
   the mob defs in `shared/src/data/monsters/<biome>.monsters.ts`, and the boss defs in
   `bossesT1.ts` / `bossesT2.ts` (+ T3/T4 if in scope). Note which mobs are already
   melee/ranged/charger/DoT — most identity is already in the stats; you're adding *coordination
   + terrain + a boss exam*, not rebuilding mobs.
2. **Pick the open-world primitive(s)** the biome needs (see toolbox §2) and tag the right mobs.
   Keep it on-identity — don't sprinkle every primitive on every mob.
3. **Author terrain ONLY where it's the core identity** (see §3). Open biomes (Forest/Plains/Cave)
   get none; terrain biomes (Mountain chokepoints, Swamp pools) get it.
4. **Author the boss exam(s)** as an ad-hoc `bossScript` (see §4) expressing the teaching sentence.
5. **Verify** (see §5): typecheck → shared rebuild → a throwaway sanity script → server tests → bench.
   Delete the sanity script after.
6. **Update the scoreboard** (`docs/system-rework-status.md`: scoreboard row + a session-log line)
   and the project memory.

## 2. Open-world primitive toolbox (all component-gated; tag in the mob def)
- **`pack` (A1)** — coordinated grouping. Alpha def carries `followers: [{typeId,count}, …]` (array →
  mixed packs); `callRange` makes an engaged member pull un-aggroed packmates onto the shared target.
  A mob can be BOTH an alpha-by-def (rolling it spawns a pack) AND a follower-at-spawn in a bigger
  pack. Spawned clustered via `spawnPack`. Used by: Forest predator packs, Plains caller pack
  (`prairie-wolf` alpha rallies `plains-slime` swarm). Alphas auto-get the tint telegraph +
  call-allies `ecology-pulse`.
- **`patrol` (A2)** — fixed route (`waypoints` relative to spawn, `loop`/`pingpong`, holds) replacing
  random wander while un-aggroed. For sentinels/elites holding territory. Used by: Mountain sentinels
  (`cliff-hopper`/`granite-titan`), Cave brutes (`cave-brute`/`cave-troll`/`cavern-troll`). Pair with
  a high `pullRange` for "high detection / overpull" identity (Cave).
- **`swarm` (A3)** — `{cohesion, separation}` boids steer blended into the per-tick heading while
  chasing → many mobs fan into pressure instead of stacking. Used by: Plains slimes/boars/bulls.
  Composes with `pack` on the same mob (swarm = steering, pack = aggro propagation — independent).
- **Already-existing knobs** (no new primitive needed): `dotEffect`, `slowEffect`, `aoeAttack`,
  `chargeOnAggro`, `isRanged`+`kite`, `rampOnCombat`, `evasion`, `targeting.mode`. Reach for these
  before inventing anything.

## 3. Terrain authoring (`shared/src/world/nodeFeatures.ts` → `NODE_FEATURES[nodeId]`)
- **Identify the node(s)** via `NODE_BIOMES` (`shared/src/world/nodeBiomes.ts`). Author on an
  open-world node (the worked example) and optionally the boss dungeon node (hazard-field exam).
- **Walls / chokepoints** (`blocksMovement`): **block `['player']` ONLY.** `spawnMonster` does NOT
  avoid feature shapes, so monster-blocking terrain on a populated node wedges spawns and stalls
  patrols. Player-only blocks shape the player's approach (the gameplay point) with none of that risk.
  Node is **3200×2400**, center (1600,1200); gates span the FULL edge, so leave the perimeter ring
  open → all edges stay connected. **Verify passability with `findPathForMover(nodeId,'player',pad,
  from,to)`** across every axis (it returns waypoints or null). Mountain `node-4-4` is the worked ref.
- **Hazard zones** (`damage` / `statusWhileInside`): non-blocking → no passability concern. `damage`
  DoT is mitigated by the player's `defense.dot-resistance`; slow MUST use status id `'slow'`
  (movement reads that literal id). Targets `['player']` so mobs are unaffected. Multiple discrete
  zones are safe (the runtime now does **sourceId-ownership** removal — a zone only clears the status
  it applied). Swamp `rotPool(id,x,y,r)` is the worked ref.
- **Visuals are free + automatic:** untextured features render a **placeholder** —
  `blocksMovement` → gray rock, `damage`/`status` → toxic-green splotch
  (`client/src/scenes/game/overlays.ts` `buildNodePlaceholderFeatures`). **To swap in real art later:
  add a `NODE_DECOR` entry (`client/src/sprites.ts`) for the feature id → the placeholder auto-hides,
  collision/hazard geometry unchanged.**

## 4. Boss exams (ad-hoc `bossScript` until Step 13 formalizes)
Express the teaching sentence with existing `BossAction`s — no new mechanics:
- `spawn-adds` (despawn on boss death) for "the X joins" — pack wolves, swarm slimes, ranged guards,
  elite reinforcements, broods. Prefer `spawn-adds` over `summon` (auto-cleanup).
- `shield` (timed DR) = "digs in / guarded position"; `enrage` = escalation; `stat-buff` = closes faster.
- Put the readable beat at **50%** (T1 = one beat, stays simple); T2+ add a **25%** beat and/or a
  `repeating` timer. Boss adds use `world.createMonster` (NOT `spawnPack`), so summoning an
  alpha-typed mob yields a lone elite — no recursive pack.
- ⚠ Step 13 will replace these with a shared exam template + reward bundles + tell conditions +
  structural boss-access gating. Author bosses so that migration is a reshuffle, not a rewrite.

## 5. Verification recipe (every biome session)
```
pnpm --filter @mmo-idle/shared build         # data lives in shared → rebuild dist first
pnpm typecheck                                # 4 packages incl. client
# throwaway sanity script in server/test/_<biome>Sanity.ts (tsx), asserting the biome's facts:
#   spawnPack composition + call-allies adoption (packs)
#   patrol present on the right mobs / absent on the others
#   updateSwarm bends a crowded chaser's heading
#   updateNodeFeatures applies DoT/slow in a pool + clears on exit (hazards)
#   findPathForMover resolves every gate-to-gate route (blocking terrain)
#   createMonster(boss) attaches scriptsBoss
pnpm --filter @mmo-idle/server exec tsx test/_<biome>Sanity.ts
pnpm --filter @mmo-idle/server exec tsx test/targetPriority.test.ts
pnpm --filter @mmo-idle/server exec tsx test/runeMaintenance.test.ts
pnpm --filter @mmo-idle/server exec tsx bench/run.ts --scenario spreadNodes --players 40
# then DELETE the sanity script.
```
The `spreadNodes` bench spreads bots across the whole grid, so it live-exercises the biome's mobs +
terrain (a crash there = a regression). Watch tick p50 (~0.3–0.5ms healthy).

## 6. Gotchas / lessons (paid for in blood — don't relearn)
- **Swarm can't nudge the nav GOAL** — a <48px offset is swallowed by `PATH_GOAL_EPSILON_SQ` (path
  reuse). `updateSwarm` bends the per-tick `motion.direction` directly instead.
- **`updateMonsters` is the SINGLE executor.** Primitives only set intent (aggro target / anchor /
  heading). Never add a second mover/attacker.
- **Monster-blocking terrain is unsafe on populated nodes** (spawn-in-wall). Player-only blocks (§3).
- **Hazard zones sharing an effectId** previously canceled each other; fixed via sourceId-ownership
  removal in `nodeFeatures.ts`. Reuse `rotPool`-style helpers; the shared `'slow'` id is fine now.
- **Sanity scripts:** force `player.hasPosition.nodeId`/`.current` after `attachPlayerEntity` (it
  default-spawns at the clearing); `isMoving.motion` is a `MotionVector` (`{direction,magnitude}`),
  not `{x,y}`; rebuild `shared` dist before any `tsx` run (data lives in dist).
- **Numbers are the user's.** Tag with placeholders + an inline "user balance pass" note; never do a
  tuning pass here.

## 7. Key file map
| Concern | File |
|---|---|
| Mob defs / primitive tags | `shared/src/data/monsters/<biome>.monsters.ts` |
| Boss defs / `bossScript` | `shared/src/data/monsters/bossesT{1,2,3,4}.ts` |
| Pools/blocks (`NODE_FEATURES`) + `rotPool` | `shared/src/world/nodeFeatures.ts` |
| Node→biome map + node ids | `shared/src/world/nodeBiomes.ts` (`NODE_BIOMES`) |
| Pools/bosses per biome | `shared/src/biomeDatabase.ts` |
| Pack/patrol/swarm types | `shared/src/data/monsters/types.ts` (`pack`/`patrol`/`swarm`) |
| AI executor + patrol fold | `server/src/systems/combat/ai/ai.ts` |
| Pack system | `server/src/systems/combat/ai/packs.ts` |
| Swarm system | `server/src/systems/combat/ai/swarm.ts` |
| Pack spawning | `server/src/systems/world/spawning/index.ts` (`spawnPack`) |
| Hazard/terrain runtime | `server/src/systems/world/nodeFeatures.ts` |
| Placeholder terrain visual | `client/src/scenes/game/overlays.ts` (`buildNodePlaceholderFeatures`) |
| Alpha tint + telegraphs | `client/src/render/monsters.ts`, `client/src/render/combatFx.ts` (`ecology-pulse`) |
| Real terrain art hook | `client/src/sprites.ts` (`NODE_DECOR`) |

## 8. Worked references (read these biomes' diffs before authoring a new one)
- **Packs (mixed):** Forest — `ancient-wolf` alpha + wolves + `canopy-sprite`; bosses summon the pack.
- **Swarm + caller:** Plains — slimes/boars/bulls `swarm`; `prairie-wolf` caller pack; bosses summon slimes.
- **Blocking terrain + sentinels:** Mountain — `node-4-4` player-only chokepoint (pathfinder-verified);
  troll/hopper patrols; "guarded position" shield bosses.
- **Hazard terrain:** Swamp — `rotPool` DoT+slow on `node-6-6`/`node-7-4`; DoT-caster bosses.
- **Patrolled elites:** Cave — brutes patrol + high `pullRange`; lurkers/spiders/gargoyles solo;
  "survive the elite" shield/brood bosses.
