> **ARCHIVED (2026-08-09) — implemented; live state in `docs/biome-ecology-current-state.md` (§§8–11, 18–20).**
> All six sessions shipped 2026-08-08/09 on `feat/biome-ecology-pass2`. Kept for the session-by-session
> rationale and the record of which numbers are placeholders.

# Biome Ecology Pass 2 — Implementation Plan

**Status:** ✅ COMPLETE — all six sessions shipped (1–3 on 2026-08-08, 4–6 on 2026-08-09).
**Start here: §10** (the closing handover) — or go straight to the current-state doc, which
is now the living truth for everything below.
**Companion:** `docs/biome-ecology-current-state.md` (refreshed through Session 6; its
sections 8–11 and 18–20 are the living record of the shipped primitives and consumers).
**Predecessor:** `docs/archive/biome-ecology-plan.md` (Step 12 program plan).

Scope: deepen the T2+ biomes past the "gloss-over" pass — Cave, Desert, Jungle, Volcano,
Tundra, Wasteland. Trench is out of scope (reviewed separately after a playtest).

---

## 0. Verdict

Most of this is authoring on primitives that already exist. Four asks are already satisfied
by shipped code:

| Ask | Verdict |
|-----|---------|
| Knockback interrupts the charge | **Already works.** `applyKnockback` sets `hasAwareness.state = 'knocked-back'`; the cast loop aborts on any state ≠ `attacking` ([combat.ts:1096](../server/src/systems/combat/engine/combat.ts#L1096)). Needs a test, not a feature. |
| Stun interrupts the charge | **Already works** ([combat.ts:1128](../server/src/systems/combat/engine/combat.ts#L1128)). Untestable only because no monster can stun a player — sidestepped by the locked root decision. |
| Jungle bushes count as hazards for `avoid-hazards` | **Already true.** `hazardAvoidanceShapesForMover` includes any feature with a `statusWhileInside` targeting the mover ([staticRegions.ts:156](../shared/src/collision/staticRegions.ts#L156)). |
| Desert controller/dealer pairs | **Nearly free.** `pack` already does alpha + typed followers, clustered spawn, and call-allies. |

The real cost is **four engine primitives** (§2). Everything else is data authoring.

---

## 1. Locked decisions

| # | Decision | Locked answer |
|---|----------|---------------|
| 1 | Volcano heat decay / cap | **Gradual decay** at the ramp cadence, **both effects capped**, damage-taken% climbs faster than damage-dealt% so the greed is self-limiting. |
| 2 | Cave T2 lockdown | **Root + attack lockout** (`isRooted` + `cannotAttack`), not a new player stun state. |
| 3 | Sun Mark (`appliesMark`/`markedStrike`) | **Keep the engine for bosses**, strip from desert trash. No boss re-authoring. |
| 4 | Jungle bush ambush spawner | **Remove it.** The large aggro radius is the whole mechanic. |
| 5 | Tundra chill-scaling enemies | **One T4 elite only** — a capstone tell, not a roster-wide ramp. |
| 6 | Wasteland raised mobs | **No rewards, capped raises.** Killing the necromancer is the only way to stop the tide. |
| 7 | Session shape | **Group by shared primitive** — build each primitive once, then its consumers. |

Two standing concerns carried into the work, not open questions:

- **Multiplicative slows.** Player speed is `slow.speedMult × frostRampMult × bootMult`
  ([movement.ts:289](../server/src/systems/world/movement.ts#L289)). Same effect id
  overwrites; **different ids multiply**. Tundra chill is a fourth source, so
  Session 5 ships a clamped `playerMoveSlowMult()` helper (floor ≈ 0.35) that all sources
  route through.
- **Volcano is a farm-rate risk.** The heat's +damage-dealt multiplies with the
  `rampOnCombat` already on volcano mobs. The taken/dealt asymmetry from decision 1 is the
  guard; verify it against `pnpm bench:balance` before calling volcano done.

---

## 2. The four primitives

### P1 — Ground zones (runtime networked circles)
**Consumers:** Cave slam telegraph, Wasteland death pools.

A node-scoped runtime list of circles in two modes: **telegraph** (cosmetic, fills over
`castMs`, resolves server-side into damage) and **hazard** (ticks damage/status while
inside). Generalize, don't invent — `RuntimeDungeonHazard`
([gauntlet.ts:59](../server/src/systems/world/dungeons/gauntlet.ts#L59)) and
[`dungeonHazards.ts`](../client/src/render/dungeonHazards.ts) already do this inside the
gauntlet view.

- Server: `world.groundZones: Map<nodeId, RuntimeGroundZone[]>`, ticked beside
  `updateNodeFeatures`, cleared on node freeze (runtime-only, never persisted).
- Protocol: new networked surface → **update the allowlists and pass the dev-boot
  invariant** (fix the invariant, not the check). This is the program's main unknown.
- Client: `render/groundZones.ts`, lifted from `dungeonHazards.ts`.

### P2 — `chargedAttack.aoe` rider
**Consumer:** Cave.

`aoe?: { radius: number; damageMult?: number }` on `chargedAttack`
([types.ts:538](../shared/src/data/monsters/types.ts#L538)). Publishes a P1 telegraph on
cast start; resolves through the existing `applyMonsterAoe` on completion. A rider on the
*charge* specifically — reusing the def-level `aoeAttack` would splash every normal attack.

### P3 — Player damage amplifiers ✅ SHIPPED (Session 4)
**Consumers:** Desert vulnerability debuff, Volcano heat.

Two status-driven multipliers with helper accessors mirroring `getAntiHealMult`:
`incomingDamageMult(player)` read in the player `onDamageTaken` path, and
`outgoingDamageMult(player)` read once in the player attack path. Both capped; both feed
buff-UI tiles (status `data` is `Record<string, number>` only — store `pct` and `totalMs`).
There is no monster→player damage-taken amplifier today; `vulnerability` is player→monster.

### P4 — Ambient node ramp ✅ SHIPPED (Session 5)
**Consumers:** Volcano, Tundra.

Generalize the hard-coded `ambientHeat`
([nodeFeatures.ts:197](../server/src/systems/world/nodeFeatures.ts#L197)) into `ambientRamp`:
a node-wide, in-combat-gated stack counter with a per-stack payload of
`{ incomingDamagePct?, outgoingDamagePct?, moveSlowPct?, burn? }`, a `maxStacks` cap, and a
decay cadence. Volcano and Tundra then become pure data. Volcano's `burn` payload is
dropped per the user's ask.

Plus one net-new subsystem that isn't shared: **P5 — corpse registry + raises**
(Wasteland only, §Session 3). ✅ shipped — see §7.

---

## 3. Sessions

Grouped so each primitive is built once, proven against one consumer, then reused. Six
sessions. Order is load-bearing: **P1 before Cave/Wasteland, P3 before Volcano, Desert
before Volcano.**

### Session 1 — P1 + P2 + Cave T1 slam ✅ SHIPPED 2026-08-08

> **Outcome.** Landed as specced, with three deviations worth carrying forward:
>
> 1. **The protocol was not the unknown.** The allowlists (`NETWORKED_*_KEYS`) govern
>    *entity components*; ground zones are node-scoped and ride `DeltaSnapshot` next to
>    the existing `dungeonGauntlet` / `voidOverlordRespawn` payloads. **No allowlist change,
>    no dev-boot invariant work.** Session 1 did not spill — the schedule risk in §4 is
>    retired, and Session 2's Cave T2 sequence can compress forward if wanted.
> 2. **Resolution does NOT use `applyMonsterAoe`.** That path applies only plating + flat DR
>    and bypasses the combat pipeline, which would make a cap-tripping cave slam ignore the
>    exact mountain/tundra gear authored to answer it. Each victim resolves through
>    `runMonsterAttack` instead, where `chargeMult` already folds into the empowered-spike
>    path so damage-cap / Brace / shields all apply.
> 3. **The committed slam needed an AI change too.** Suppressing the combat loop's
>    out-of-range abort was not enough: `updateMonsters` would flip the mob to `chasing`
>    when the target fled, and the combat loop aborts on any state ≠ `attacking`. A mid-slam
>    hold in `ai.ts` keeps the mob planted for the wind-up.
>
> P1 shipped **telegraph mode only** — the ticking `hazard` mode moves to Session 2 with its
> first real consumer. All slam numbers are placeholders for the balance pass.
>
> **Deferred out of this session:** the jungle bush art probe. `art/pixellab.lock.json` is
> the append-only spend ledger every `art:generate` writes to, and a concurrent art agent
> holds it modified — generating now would interleave writes on a file that tracks real
> money. Jungle is schedule-flexible and isn't wired until Session 6, so nothing stalls.
*Front-loaded housekeeping:* branch fresh off `master` (park the `feat/conduit-flavor-pass`
art tree first); refresh the stale `biome-ecology-current-state.md`; **kick off jungle bush
art generation** (`art:generate --dry-run` first — real credits) so it sits in the review
gallery while engine work proceeds. Generate and hand off; never self-accept candidates.

Then: the ground-zone system, the `chargedAttack.aoe` rider, and `cave-brute` /
`cave-troll` / `cavern-troll` authored with a wide slow slam (long `castMs`, generous
`initialCooldownMs` so it isn't the opener).

Tests: knockback mid-cast aborts, emits `monster-cast-end { fired: false }`, and clears the
zone; stun mid-cast likewise; a completed cast damages every player in radius.

> **Keep this session alone.** It is the only one adding networked surface, and the
> allowlist + dev-boot invariant is where the surprises live. Do not pad it.

### Session 2 — Cave T2 sequence + Wasteland death triggers ✅ SHIPPED 2026-08-08
Both are pure consumers of P1 with no new protocol, which is why they share a session.

- Cave T2: gap-close charge → root + attack lockout (~1s) → the Session-1 slam. A small
  sequence driver on `tracksCombat` scratch, interruptible at every step, reusing the
  existing abort paths.
- Wasteland: `onDeath?: { spawnHazard?, empowerAllies? }` on `MonsterDefinition`, fired
  from the existing `onKill` pipeline
  ([killHooks.ts:21](../server/src/systems/combat/damage/killHooks.ts#L21)). Toxic pool =
  P1 hazard mode; ally-empower = a radius buff on death.

> **Outcome.** The cave opener is session-keyed on `tracksCombat` and hands its final beat
> to the existing committed slam. Its instanced lockdown owns only the ECS markers it added,
> so interruption/expiry cannot strip an intrinsic Summoner `cannotAttack`. Wasteland death
> effects run from one centralized `onKill` listener; proc, player-AoE, and Alternating
> Currents kill paths were closed so they cannot bypass the hooks. Toxic pools are expiry-
> owned and survive their monster's removal; charnel-brute death empowerment is a timed,
> capped stacking damage status. `pnpm typecheck` and all 68 tests passed.

### Session 3 — P5: corpse registry + raises ✅ SHIPPED 2026-08-08
Own session — the only monster-lifecycle work in the program, and the only place a rewards
exploit can appear.

Per-node corpse ring buffer (`{ typeId, pos, diedAt }`, short TTL, runtime-only). A
`raisesDead` monster consumes the nearest corpse on its timer. Raised mobs carry an
`isRaised` marker → **zero essence, XP, and catalyst**, and count against a `maxAlive` cap.
Fold the existing `gravewright` off `spawn-adds` onto the real raise.

> **Do not merge into Session 2.** Death triggers and the corpse registry both touch
> monster death and rewards; combined they make a diff that can't be reviewed cleanly.

> **Outcome.** Landed as specced. Three things worth carrying forward:
>
> 1. **The rewards exploit closes in exactly one line**, because every kill path in the game
>    funnels through `grantMonsterRewards`. An `isRaised` early-return there zeroes essence,
>    biome XP, catalyst progress, quest credit, the party share and dungeon-gauntlet credit
>    at once. Do not add a second gate anywhere else — there is no other reward entry point.
> 2. **The loop has to be proven to terminate, not just capped.** Bosses and risen mobs leave
>    no corpse, and a risen necromancer never raises. Without those three gates a tide can
>    re-raise itself forever — zero-reward, but permanent.
> 3. **No new protocol.** The risen copy is renamed `Risen <Name>` on the already-networked
>    `isMonster` slice, which is the whole client tell, plus a `raise-dead` ecology pulse.
>    `isRaised` itself stays a server-only marker and trips no invariant.

### Session 4 — P3 + Desert pairs ✅ SHIPPED 2026-08-09
The amplifiers, proven against one consumer before Volcano takes a dependency on them.

- P3 incoming/outgoing multipliers + an `appliesVulnerability` monster field.
- Re-author the desert roster into pairs via `pack`: controller = alpha (high HP, low
  offense, slow/root, +damage-taken at higher tiers); dealer = follower (low HP, fast,
  `kiter`, high damage).
- Strip `appliesMark`/`markedStrike` from desert trash; leave the T2 boss untouched.

### Session 5 — P4 + Volcano ✅ SHIPPED 2026-08-09
The ambient ramp plus its first payload, and the slow-clamp cleanup.

- `ambientRamp` generalization; volcano payload ≈ `{ outgoingDamagePct: 0.05,
  incomingDamagePct: 0.08 }`, gradual decay, both capped, burn removed.
- The clamped `playerMoveSlowMult()` helper from §1, with all existing slow sources routed
  through it — landing here so Tundra's new source arrives into a clamped world.
- Buff-UI tiles for the heat.
- Verify farm rate against `pnpm bench:balance`.

> **Outcome.** Landed as specced. The clamp helper shipped as `playerMoveSpeedMult` (it
> returns the full speed multiplier, not just the slow half) and is called by BOTH the server
> movement pass and the client's own-player extrapolation, so the two cannot drift. The
> farm-rate verification came back with a real +8–24% lift on volcano — measured, attributed,
> and left for the balance pass. See §9.

### Session 6 — Tundra + Jungle ✅ SHIPPED 2026-08-09
The lightest pair, and where the async art lands.

- Tundra: `ambientRamp` payload `{ moveSlowPct }`, capped, no upside; plus **one T4 elite**
  that scales damage off chill stacks.
- Jungle: ~~wire the accepted bush art as node decor~~ **DONE in Session 1** (see §5).
  ~~Add a detection multiplier to the bush and teach `playerDetectionMult` to read it;
  remove the dormant-ambush spawner~~ **DONE mid-pass** (`d3632c3`, `bf50ffe`) — as a
  feature field rather than status data, and the packs went with it.
  Still open: test that the bush is still returned by `hazardAvoidanceShapesForMover` so
  `avoid-hazards` routes around it. ~~reduce the slow~~ — dropped: the user playtested and
  tuned the thicket radii directly, and balance numbers are theirs, not an agent's.

> **Jungle is schedule-flexible.** It shares nothing with the other biomes and is gated
> only on art acceptance. Pull it forward into any earlier session with room as soon as the
> gallery review clears; it is parked in Session 6 only because that's the latest the art
> can arrive without stalling anything.

> **Outcome.** Tundra's half was pure data exactly as §9 predicted — one feature factory,
> one branch, one buff tile — and the only engine surface the whole session added was
> `MonsterDefinition.scalesWithAmbientRamp` for the capstone. Jungle's half was already
> live except the routing test. See §10 and §20 of the current-state doc.

---

## 4. Scoping notes

**What must not share a session**
- Session 1 with anything extra — new networked surface plus invariant work.
- Session 2 with Session 3 — both touch monster death and rewards.
- Desert with Volcano — P3 needs one proven consumer before the second depends on it.

**What can compress if things go well**
- Session 2's Cave T2 sequence can slide into Session 1 if the ground-zone protocol lands
  clean, leaving Session 2 as Wasteland-only.
- Session 6 is the lightest; Jungle can move earlier, and Tundra can absorb leftovers.

**Where it can grow**
- P1's protocol surface is the single biggest unknown; if the dev-boot invariant fights
  back, Session 1 spills and everything shifts one slot.
- Desert re-authoring is data-heavy across four tiers — if pack tuning needs iteration,
  Session 4 grows rather than Session 5 shrinking.

**Per-session definition of done:** shared contract → server authority → client
presentation → a wiring smoke test (`server/test/*.test.ts`, plain tsx + hand-rolled
assert: attach the component, tick the world, assert observable invariants — not balance
numbers). `pnpm typecheck` and `pnpm test` green before the session closes.


---

## 5. Handover — state at the end of Session 1 (2026-08-08)

**Next session is Session 2** (Cave T2 sequence + Wasteland death triggers). Nothing about
Session 2–5 changed; §3 still describes them accurately.

### What is on the branch

Branch `feat/biome-ecology-pass2`, cut from `feat/conduit-flavor-pass` (that branch was fully
pushed and owned by another agent, so this work was kept off it). Its history therefore
carries the Conduit commits as ancestors — diff against `feat/conduit-flavor-pass`, not
`master`, to see only this work.

`pnpm typecheck` clean, `pnpm test` 66/66 at hand-off.

### Jungle slice, pulled forward out of Session 6

Session 6 said Jungle was schedule-flexible and could move earlier. It did:

- **Ambush bush art** — 4 accepted variants in `art/src/files/environment/jungle/`, packed.
- **Feature scatter** — `FEATURE_SCATTER` in `client/src/sprites.ts` +
  `buildFeatureScatterImages` in `client/src/scenes/game/overlays.ts`. Fills a feature
  footprint with many overlapping props on a jittered grid, instead of `NODE_DECOR`'s single
  stretched sprite. Suppresses the toxic-green placeholder for any feature it covers.
- **Ground/feature coupling** — `routeDiscsAroundFeatures` in
  `client/src/render/groundLayout.ts` pushes the jungle's open-floor discs clear of the
  authored thickets (40px pad), shrinking only at a node edge and dropping only if it cannot
  fit. Verified: **0 overlapping disc/bush pairs out of 450** across all 18 jungle nodes,
  disc counts unchanged (pushed, never deleted).
  Gated behind `GroundStyleConfig.avoidsFeatures`, set **only** on jungle — swamp rot pools
  are painted BY the functional Wang sheet and need the ground to cover them, not dodge them.

**Why the coupling had to be real, not cosmetic:** the discs are client-only decoration but
the thickets are authoritative `NODE_FEATURES` carrying slow + concealment + the ambush
spawner. Hiding bush props over the path would have left an invisible slow/ambush zone on
visibly clear ground — worse than the original overlap.

**Tuning knobs**, all in the `FEATURE_SCATTER` entry in `client/src/sprites.ts`:
`spacing` (0.7, density), `displayW/H` (150), `alpha` (0.95), `ySort` (true).
Known issue from the in-game look: the bushes read **too bright** against the near-black
overgrowth sheet — they sit on top of the floor rather than in it. Cheapest fix is alpha/tint;
the proper fix is a regen with the interior shadow pushed much harder.

### Jungle trees — DO NOT retry with PixelLab

PixelLab was abandoned on evidence. **The replacement ChatGPT-generated tree set is now shipped.**

PixelLab cannot produce this asset class:

1. Hard endpoint caps — pixflux 400², bitforge 200²; `generationScale` clamps to them. The
   forest cells are **1024px**. No subscription tier changes this; it is an API limit.
2. The forest sheet was never PixelLab output. `trees.png` landed 2026-06-14 in `acf2922`
   as a finished external drop; `tools/pixellab/` did not exist until 2026-07-10. Both
   `trees` and `trees_hitbox` manifest entries are `draft` with empty prompts — `art:seed`
   placeholders for an asset it never made.
3. The largest single detailed object PixelLab has gotten accepted in this repo is **256px**,
   and those are tiling ground sheets. Everything it excels at here is ≤200px.

The failed batch cost $0.15 and came back 100% opaque (pixflux ignored `no_background` at
400px — every prior use in this repo is ≤96px), with grass tufts baked in, flat cel shading
and hard outlines despite `outline: lineless`. **The scale/pixel-density mismatch is the
disqualifier**, not the wording: 400px of detail cannot sit beside 1024px art.

The four replacement entries are `accepted` at 1254×1254 under
`art/src/files/environment/trees/jungle/`. They were generated with ChatGPT image generation
using the forest sheet as the style/scale reference, then locally chroma-keyed to alpha.

### Tree code work — SHIPPED

`getNodeTrees` now dispatches jungle placement to `shared/src/world/jungleTrees.ts`. Trees are
deterministically scattered on open ground, with a 490 px clearance beyond every authored
brush radius so tree and thicket art never share a depth stack. Open-world nodes target at
most three trees (fewer where the dense brush layout leaves less room); dungeons target two
and also preserve the altar clearing.
The client reuses the forest split canopy/root y-sort treatment; shared smooth trunk ellipses
block both players and monsters with no network traffic.

> **Connectivity probe passed.** `shared/src/collision/collision.test.ts` now checks every
> canonical T2–T4 jungle node and dungeon after tree collision is added. Each remains exactly
> one connected walkable region for the player navigation body.

### Unrelated bug found, not fixed

`server/package.json`'s `dev` script is broken: `tsx --env-file=../.env watch …` puts the flag
ahead of the subcommand, so tsx resolves `server/watch` as the entry module and dies. Docker
runs `dev:docker` (nodemon) instead, which is why it has gone unnoticed — but `pnpm dev:server`
fails on the host. Left alone as out of scope.

---

## 6. Handover — state at the end of Session 2 (2026-08-08)

**Next session is Session 3** (P5 corpse registry + raises). Keep it isolated as §3 requires:
death triggers are now stable, while corpse recording/consumption and zero-reward raised mobs
are the only new lifecycle/reward surface.

Session 2 landed on `feat/biome-ecology-pass2` as two implementation commits after the
Session-1/Jungle/housekeeping tip:

- `feat(biome-ecology): add monster death effects`
- `feat(biome-ecology): complete cave and wasteland session`

The working tree was clean at handoff. Verification after rebasing over the concurrent Jungle
commit: `pnpm typecheck` green; `pnpm test` **68/68**; focused cave-sequence, committed-slam,
and monster-death-effect tests green again after integration.

The original persistent-zone ownership distinction is load-bearing for future work:
`slam-telegraph` circles die with their cast owner, while `toxic-pool` circles die only on
expiry or node freeze. Do not reintroduce a blanket owner cleanup when extending P1.

---

## 7. Handover — state at the end of Session 3 (2026-08-08)

**Next session is Session 4** (P3 player damage amplifiers + Desert pairs). §3 still describes
Sessions 4–6 accurately; nothing about them changed. Session 4 must land P3 against the Desert
consumer **before** Session 5's Volcano takes a dependency on it — that ordering constraint in
§4 is still live.

Session 3's work sits on `feat/biome-ecology-pass2` on top of the Session-2 tip.
`pnpm typecheck` green; `pnpm test` **69/69** (Session 2 closed at 68 — the new file is
`server/test/corpseRaise.test.ts`).

### What shipped

Shared contract → server authority → client presentation, as §4 requires:

- `MonsterRaisesDead` on `MonsterDefinition`, `IsRaised { raiserId }` marker,
  `'raise-dead'` ecology pulse, and a bestiary mechanic line.
- `server/src/systems/world/corpses.ts` (registry) and
  `server/src/systems/combat/ai/raiseDead.ts` (`updateRaisers`, `onRaiserDead`,
  `countRaisedBy`), wired into `World.tick` next to `updateGroundZones` / `updatePacks` and
  into `freezeNode`.
- The `isRaised` reward gate in `grantMonsterRewards`, and corpse recording +
  raiser-death cleanup added to the Session-2 centralized `onKill` listener.
- `gravewright` re-authored off `spawn-adds`. **All numbers are placeholders** — cadence,
  reach, cap and the risen HP/damage scalars belong to the balance pass, and they interact
  with wasteland's authored EXTREME density.

Full mechanical detail lives in §11 of `docs/biome-ecology-current-state.md`.

### Judgement calls a later session should know about

- **Risen mobs count toward node density.** They suppress ambient respawn while the tide is
  up, exactly as the old `spawn-adds` swarm did. That is a deliberate keep, not an oversight:
  it bounds total node pressure. If a playtest says the wasteland feels starved of *rewarding*
  mobs mid-fight, excluding `isRaised` from `getMonsterCountInNode` is the one-line lever.
- **The raise is instant — no cast, no telegraph beyond the pulse.** A wind-up would make the
  necromancer interruptible mid-raise, which is a nicer fight but a bigger diff; it was left
  out deliberately. `chargedAttack` / `engageSequence` are the precedents if it is ever wanted.
- **A corpse claimed by a failed spawn is lost.** `takeNearestCorpse` removes before
  `createMonster` runs, so a terrain-blocked spawn burns the corpse. Harmless in practice (the
  corpse sits where a monster legally stood) and TTL-bounded, but it is not a bug if observed.

### Not touched, still open

The Session-1 handover's two loose ends are unchanged and still worth a later session:

- `server/package.json`'s `dev` script is broken (`tsx --env-file=... watch` puts the flag
  ahead of the subcommand, so `pnpm dev:server` dies on the host; Docker's nodemon path hides
  it).
- Jungle trees shipped through the ChatGPT image-generation track; PixelLab remains the wrong
  tool for this asset class. Density, dual-target collision, brush clearance, and jungle
  connectivity are pinned in `shared/src/collision/collision.test.ts`.

---

## 8. Handover — state at the end of Session 4 (2026-08-09)

**Next session is Session 5** (P4 ambient ramp + Volcano + the slow clamp). §3 still describes
Sessions 5–6 accurately. The §4 ordering constraint that gated Session 4 is now **discharged**:
P3 exists and has a proven consumer, so Volcano may depend on it.

Session 4 sits on `feat/biome-ecology-pass2` on top of the Session-3 tip. `pnpm typecheck`
green; `pnpm test` **72/72**. Session 3 closed at 69 — one of the three new files is
`server/test/desertPairs.test.ts`, the other two came from the concurrent art/altar track
that landed in the same working tree.

### What shipped

Full mechanical detail is in §18 of `docs/biome-ecology-current-state.md`. In short: the two
capped amplifier helpers, an `appliesVulnerability` monster field and its `sundered` status +
buff tile, the Desert roster re-authored into controller/dealer packs across T2–T4, and Sun
Mark stripped from all desert trash.

### Judgement calls a later session should know about

- **The incoming amplifier registers BEFORE `initDefenseSystems()`.** This is the single
  fragile thing in P3. If it ever drifts after the damage-cap registration, a stacking
  vulnerability bypasses the cap entirely. `server/test/desertPairs.test.ts` asserts the
  order, not just the effect — it sets `defense.max-hit-mult` to 0 so a clipped-then-amplified
  pipeline would read differently from an amplified-then-clipped one. Note that
  `defense.max-hit-pct` alone does nothing: `max-hit-mult` defaults to 1, so the "cap" is a
  no-op until a reduction multiplier is set. That surprised this session; it will surprise
  the next one.
- **Amplifiers are keyed off status `data`, not status id.** Volcano should therefore author
  ONE heat status carrying both `damageTakenPct` and `damageDealtPct` rather than two effects.
  No new engine work is needed for it — Session 5's P4 payload just has to write those keys.
- **The outgoing multiplier currently has no authored consumer.** It is read live in
  `runPlayerAttack` and covered by a synthetic-status test. Do not "clean it up" as dead code;
  it is Volcano's landing pad.
- **The T2 Emperor was re-authored** (self-marks) against locked decision 3's "no boss
  re-authoring", with the user's explicit call. The decision assumed desert trash and the boss
  were separable; they were not, because the boss's phase-2 adds *are* desert trash.
- **Self-marking exposed a real engine bug**, now fixed: `appliesMark` skips the repaint when
  `ctx.metadata.sunMarkConsumed` is set. Before this, any monster with both fields would have
  perma-amplified. No shipped monster had both, so nothing was previously broken.
- **Killing a desert controller destroys its dealers' rewards.** `onPackAlphaDead` removes
  followers without granting anything. That is the intended target-priority trade, not an
  oversight — but it is the first biome where the tanky mob is the alpha AND the squishy mobs
  carry the essence, so it is the biome most likely to generate "my rewards vanished" reports.
- **Desert density interacts with the packs.** `mobDensity` is 8 and a controller pull is 3
  bodies, so a node is roughly two packs plus two harassers. If desert feels crowded after the
  balance pass, the lever is density, not the follower counts.

### Not touched, still open

- `debuff-sundered` has **no icon art**. Every other id in `conceptIcons.ts`'s `DEBUFF_IDS`
  has a PNG, so it is deliberately left out of that set and renders as the orange diamond
  shape fallback. An art pass should generate it into
  `client/public/assets/concept-icons/statuses/debuffs/` in the same family as the others.
- Both long-standing loose ends from earlier handovers are unchanged: `server/package.json`'s
  `dev` script is still broken (`tsx --env-file=... watch` puts the flag ahead of the
  subcommand), and PixelLab remains the wrong tool for tree-class assets.

---

## 9. Handover — state at the end of Session 5 (2026-08-09)

**Next session is Session 6** (Tundra + Jungle) — the last one. §3 still describes it
accurately, and P4 landed exactly so that Tundra's half is **pure data**: a
`payload: { moveSlowPct }` on a `tundra` branch in `canonicalFeaturesForNode`, plus one
`debuff-tundra-chill` buff descriptor and a `T4` elite that scales damage off the ramp's
stacks. No server code. The move-slow clamp Session 5 shipped is what makes that new slow
source safe to add.

Session 5 sits on `feat/biome-ecology-pass2` on top of the Session-4 tip. `pnpm typecheck`
green; `pnpm test` **73/73** (Session 4 closed at 72 — the new file is
`server/test/ambientRamp.test.ts`).

### What shipped

Full mechanical detail is in §19 of `docs/biome-ecology-current-state.md`. In short: the
`ambientRamp` node-feature primitive with a data-authored payload, Volcano re-authored from
a burn into a capped greed ramp (+damage dealt AND +damage taken, taken climbing faster),
and `playerMoveSpeedMult` — one shared collapse of every speed multiplier, with a floor on
the compounded slows, used by the server and the client alike.

### Judgement calls a later session should know about

- **Volcano's farm rate went UP 8–24%, and it is the greed ramp, not the burn removal.** A
  control run with `payload: {}` reproduced the old burn heat within ±0.6% on every class
  root, which means the burn had **no measurable farm-rate effect at all** — a fact worth
  keeping, because it retires the §1 worry that the burn was load-bearing. The lift is
  entirely `outgoingDamagePct`, and that is the single knob to turn. Left untouched per the
  standing rule that numerical balance passes are the user's, not an agent's.
- **The taken side does not bite in the bench, and it structurally can't.** Bench bots are
  geared for their tier and rarely die (T4 summoner deaths actually fell 12/hr → 9/hr), so
  the +48% incoming converts into nothing while the +30% outgoing converts into kills every
  fight. Do NOT read "deaths didn't rise" as "the asymmetry works" — that has to come from a
  human playtest on an under-geared character.
- **Summoner is flat (±1%) on volcano at both tiers.** Not a structural exclusion: minion
  attacks route through `runPlayerAttack` (they carry `aggroSource.kind === 'minion'`), so
  they DO get the outgoing amplifier, and they DO mark the owner engaged so the ramp builds.
  Its runs are also the noisiest in the sweep (a death appears and disappears between runs).
  If volcano gets retuned, re-measure summoner rather than assuming it scales with the rest.
- **A root is not a slow, and the clamp knows it.** Roots ride the shared `slow` id at
  `speedMult: 0` (desert basilisk, cave lockdown, ground zones). `playerMoveSpeedMult`
  short-circuits on 0 — without that, the 0.35 floor would have handed every rooted player a
  third of their speed back. That case is pinned by a test; do not "simplify" the
  short-circuit away.
- **The client calls the same shared collapse.** `client/src/render/players.ts` no longer
  multiplies `PlayerBuff.speedMult` locally. Any NEW server-side slow must publish a buff
  carrying `speedMult` or own-player prediction will over-extrapolate and snap back — that is
  why the volcano heat tile publishes `speedMult` even though its payload has no move slow
  (it reads 1, and Tundra's will not).
- **`ambientRamp` is one-per-node by construction.** The pass takes the FIRST feature
  carrying one, and `ambientRampStatus` finds the FIRST ramp status on the player. A node
  authoring two ramps would silently run only one. That is deliberate — a second ramp is
  another payload key, not another feature.

### Not touched, still open

- `debuff-sundered` still has no icon art (Session 4's loose end); `debuff-volcanic-heat`
  has the same gap and now shows a very different effect, so an art pass should treat them
  together.
- Both long-standing loose ends are unchanged: `server/package.json`'s `dev` script is still
  broken (`tsx --env-file=... watch` puts the flag ahead of the subcommand), and PixelLab
  remains the wrong tool for tree-class assets.

---

## 10. Handover — Pass 2 CLOSED (2026-08-09)

**There is no Session 7.** Every session in §3 has shipped; the living record is
`docs/biome-ecology-current-state.md` §§9–11, 18–20. This plan is now history and should
be moved to `docs/archive/` with the usual header once someone is doing a docs pass.

Session 6 sits on `feat/biome-ecology-pass2` on top of the Session-5 tip. `pnpm typecheck`
green; `pnpm test` **74/74** (Session 5 closed at 73 — the new file is
`server/test/tundraChill.test.ts`).

### What shipped

Full mechanical detail is in §20 of the current-state doc. In short: the Tundra chill
(P4 with an all-cost payload, on every tundra node including dungeons), one new monster
field `scalesWithAmbientRamp` carried by exactly one mob, and the `avoid-hazards` routing
test that was Jungle's last open item.

### Judgement calls a later session should know about

- **The capstone is the existing apex, not a new mob.** `permafrost-behemoth` was already
  `elite: true`, already the T4 weapon-matchup exam (plating 20 + soft-cap + a 9s slam),
  and already in the T4 pool. Giving the chill scaling to a NEW mob would have cost a
  sprite and a roster slot to say the same thing. The consequence is that the apex now
  carries four mechanics at once — if it plays as overloaded, `scalesWithAmbientRamp` is
  the newest and the cheapest to move to `glacial-direbear`.
- **A test pins the carrier count at exactly one.** That is locked decision 5 made
  mechanical: a second chill-scaling mob fails `tundraChill.test.ts` rather than silently
  becoming the roster-wide ramp the decision rules out. If a later design genuinely wants
  two, change the assertion deliberately — do not delete it.
- **The chill deliberately carries no damage dimension.** Volcano proved (§19) that
  `outgoingDamagePct` is the farm-rate knob; putting one on tundra would have re-run that
  experiment on a biome whose identity is control, not greed. The elite scaling is the
  damage expression, and it is scoped to one fight.
- **Numbers are placeholders and were not benched.** `{ moveSlowPct: 0.05 } × 6` (−30%
  movement at full) and the apex's `{ 0.06, 0.36 }` (+36% at full chill, on a mob whose
  cooldown slam is already 300) are authored, not measured. The volcano lift in §19 says
  the honest read on a damage amplifier only comes from a human playtest on an
  under-geared character — bench bots do not die. Per the standing rule, the balance pass
  is the user's.
- **`ambientRampScalingMult` reads the generic ramp marker, not `tundra-chill`.** So a
  chill-scaling mob dropped into a volcanic node would feed on heat instead. That is
  intended ("it grows on whatever the room is doing to you") and is safe because a node
  authors one ramp and mobs stay in their biome — but it is a real coupling if a future
  biome ever gives a mob to another biome's node.
- **The jungle slow was left at 0.55.** §3 listed "reduce the slow" as a Session 6 item;
  the user playtested the thickets and tuned their radii directly in between sessions, so
  the slow is where they want it. The new hazard-avoidance test exists precisely because
  that number is user-owned: if a later pass drops the slow to zero, the thicket stops
  being a hazard for autopathing and the test says so instead of the bug shipping.

### Not touched, still open

- **Debuff icon art**: `debuff-tundra-chill` has none (it renders the fallback glyph,
  like `debuff-sundered`), and `debuff-volcanic-heat`'s existing icon still depicts the
  burn that Session 5 deleted. Three tiles, one art pass.
- **Trench** was out of scope for the whole pass and is still unreviewed.
- Both long-standing loose ends are unchanged: `server/package.json`'s `dev` script is
  still broken (`tsx --env-file=... watch` puts the flag ahead of the subcommand), and
  PixelLab remains the wrong tool for tree-class assets.
