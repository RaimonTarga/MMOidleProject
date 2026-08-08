# Biome Ecology Pass 2 — Implementation Plan

**Status:** 🚧 in progress — Sessions 1–2 ✅ shipped 2026-08-08, plus the Jungle art/terrain
slice pulled forward out of Session 6. Sessions 3–5 not started. **Start here: §6.**
**Companion:** `docs/biome-ecology-current-state.md` (refreshed through Session 2; its
sections 8–10 are the living record of the shipped primitives and consumers).
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

### P3 — Player damage amplifiers
**Consumers:** Desert vulnerability debuff, Volcano heat.

Two status-driven multipliers with helper accessors mirroring `getAntiHealMult`:
`incomingDamageMult(player)` read in the player `onDamageTaken` path, and
`outgoingDamageMult(player)` read once in the player attack path. Both capped; both feed
buff-UI tiles (status `data` is `Record<string, number>` only — store `pct` and `totalMs`).
There is no monster→player damage-taken amplifier today; `vulnerability` is player→monster.

### P4 — Ambient node ramp
**Consumers:** Volcano, Tundra.

Generalize the hard-coded `ambientHeat`
([nodeFeatures.ts:197](../server/src/systems/world/nodeFeatures.ts#L197)) into `ambientRamp`:
a node-wide, in-combat-gated stack counter with a per-stack payload of
`{ incomingDamagePct?, outgoingDamagePct?, moveSlowPct?, burn? }`, a `maxStacks` cap, and a
decay cadence. Volcano and Tundra then become pure data. Volcano's `burn` payload is
dropped per the user's ask.

Plus one net-new subsystem that isn't shared: **P5 — corpse registry + `onDeath` hooks**
(Wasteland only, §Session 3).

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

### Session 3 — P5: corpse registry + raises
Own session — the only monster-lifecycle work in the program, and the only place a rewards
exploit can appear.

Per-node corpse ring buffer (`{ typeId, pos, diedAt }`, short TTL, runtime-only). A
`raisesDead` monster consumes the nearest corpse on its timer. Raised mobs carry an
`isRaised` marker → **zero essence, XP, and catalyst**, and count against a `maxAlive` cap.
Fold the existing `gravewright` off `spawn-adds` onto the real raise.

> **Do not merge into Session 2.** Death triggers and the corpse registry both touch
> monster death and rewards; combined they make a diff that can't be reviewed cleanly.

### Session 4 — P3 + Desert pairs
The amplifiers, proven against one consumer before Volcano takes a dependency on them.

- P3 incoming/outgoing multipliers + an `appliesVulnerability` monster field.
- Re-author the desert roster into pairs via `pack`: controller = alpha (high HP, low
  offense, slow/root, +damage-taken at higher tiers); dealer = follower (low HP, fast,
  `kiter`, high damage).
- Strip `appliesMark`/`markedStrike` from desert trash; leave the T2 boss untouched.

### Session 5 — P4 + Volcano
The ambient ramp plus its first payload, and the slow-clamp cleanup.

- `ambientRamp` generalization; volcano payload ≈ `{ outgoingDamagePct: 0.05,
  incomingDamagePct: 0.08 }`, gradual decay, both capped, burn removed.
- The clamped `playerMoveSlowMult()` helper from §1, with all existing slow sources routed
  through it — landing here so Tundra's new source arrives into a clamped world.
- Buff-UI tiles for the heat.
- Verify farm rate against `pnpm bench:balance`.

### Session 6 — Tundra + Jungle
The lightest pair, and where the async art lands.

- Tundra: `ambientRamp` payload `{ moveSlowPct }`, capped, no upside; plus **one T4 elite**
  that scales damage off chill stacks.
- Jungle: ~~wire the accepted bush art as node decor~~ **DONE in Session 1** (see §5).
  Still open: add a detection multiplier to the bush `statusWhileInside` and teach
  `playerDetectionMult` to read it; reduce the slow; **remove the dormant-ambush spawner**;
  test that the bush is still returned by `hazardAvoidanceShapesForMover` so
  `avoid-hazards` routes around it.

> **Jungle is schedule-flexible.** It shares nothing with the other biomes and is gated
> only on art acceptance. Pull it forward into any earlier session with room as soon as the
> gallery review clears; it is parked in Session 6 only because that's the latest the art
> can arrive without stalling anything.

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

Asked for, attempted, and abandoned on evidence. **The user is handling tree art elsewhere.**

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

The four entries are parked at `status: draft` **with their prompts intact** so a bare
`art:generate` cannot re-spend on them. Candidates are archived under
`art/candidates/_finished/environment/`.

### Tree code work — NOT started, and cheap when art exists

`getNodeTrees` gates on a single constant, `TREE_BIOME_GROUP = "forest"`
([trees.ts:19](../shared/src/world/trees.ts#L19)), so extending trees to a second biome is a
one-line generalization into a per-biome record of `{ sheetKey, cellPx, displayBase,
hitboxRects }`. Trees are deterministic from the node id and shared, so server movement
blocking and client rendering agree with no network traffic; trunk hitboxes bake from a mask
via `pnpm --filter @mmo-idle/server bake:tree-hitboxes`.

> **Before shipping collidable jungle trees, re-run the connectivity probe.** §5.8 of
> `docs/next-playtest-implementation-plan.md` is an OPEN blocker: auto-combat wedges forever
> when `nearestEngageableMonster` finds nothing pathable, found on a heavy-blocking-geometry
> mountain node. That probe cleared the current world ("all 140 open-world nodes have exactly
> one connected walkable region"); jungle nodes already carry 3–4 × 600px thickets, and
> adding trunks is exactly the stress that could break the invariant. Deriving jungle trees
> from the forest sheet would reuse the baked hitboxes verbatim and add no new footprints —
> the lowest-risk art route by some margin.

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
