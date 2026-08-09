> **ARCHIVED (2026-08-09) — fulfilled.** Relics shipped 2026-08-04; live state in
> `docs/relics-current-state.md`, design in `design_docs/relics-design.md`. Kept for the
> seam-by-seam architecture audit, whose `file:line` citations are from 2026-08-02 and have drifted.

# D2 Relics — Seam Audit (2026-08-02)

Companion to `docs/archive/briefs/d2-relics.md`. Read-only audit of whether the six
archetype systems expose clean, writable seams for mechanic-level relics.
Every claim below is cited `file:line` against the current tree
(branch `feat/ui-info-layer`, commit 3267209).

---

## Verdict

**Relics as specified are buildable against the current architecture, and the
dominant implementation route already exists end-to-end:** an equipped item's
`mechanicEffects` merge additively into `usesSkills.passives`
(`shared/src/systems/stats.ts:224`), and every archetype's tuning numbers —
threshold, multiplier, cooldown, energy-per-hit, ammo, reload time, DoT
profile, minion count/respawn/shares — are already read from that passive map
at runtime with constants only as fallbacks. A relic that says "cadence
counter 5→4, empowered ×2→×1.6" is literally
`{ 'cadence.threshold-mod': -1, 'cadence.empowered-mult': -0.4 }` on an item —
zero new plumbing. The risk is concentrated in three places: (1) a **real
ordering bug** — equipment-sourced cadence-threshold keys are folded into
passives *after* the threshold is computed during recalc, so that one hook is
currently dead for items (`shared/src/systems/stats.ts:201-206` vs `:208-236`);
(2) reload's half-damage/double-speed sub-identity is **hardcoded literals**
(`0.65` / `0.5`, `shared/src/systems/stats.ts:296-312`), not passive-driven;
and (3) the brief's "generic per-archetype effect resolver" is a **stated
design rule, not shipped code** — if relics adopt one-id-many-behaviors, that
resolver layer is new (small) machinery. Everything else a relic catalogue
plausibly wants that isn't passive-driven (empowered-attack *shape* changes,
DoT stack cash-outs) is honest new-listener work, and the pipeline seams for it
are clean.

---

## Per-archetype table

| archetype | state location | mutable fields | already passive-driven | hardcoded | pipeline stages hooked | external-modification risk |
|---|---|---|---|---|---|---|
| **cadence** | `UsesCadence` slice (`shared/src/components/archetypes/cadence/usesCadence.ts:2-28`), networked | `count`, `threshold`, `speedStacks`, plus T3/T4 spec fields (aftershock/metronome/resonance/rampage/crescendo/verdict) | threshold (`cadence.empowered-threshold` + `cadence.threshold-mod`), multiplier (`cadence.empowered-mult` + `cadence.damage-mult-add`), all rampage/crescendo/hemorrhage tuning (`shared/src/passives.ts:82-134`) | fallback threshold 5 / mult 2.0 (`cadencePrototype.ts:6-7`); threshold floor 2 (`stats.ts:205`) | `onHit` (multiplier via `registerEmpoweredMultiplier`, then counter advance — `cadencePrototype.ts:12-51`); T3 adds `onHit`/`afterHit`; tick for rampage/crescendo decay | **`threshold` is overwritten on every recalc** from a mid-recalc passive snapshot that excludes equipment (`playerEntityFormulas.ts:39-49`, `stats.ts:201-206`) — item threshold keys are dead until the fold is reordered. `count` is safe to write between hits but resets on recalc. |
| **cooldown** | `UsesCooldown` slice (`shared/src/components/archetypes/cooldown/usesCooldown.ts:2-17`), networked | `executionCooldownMs`, `executionCooldownPct` (mirror), `initialized`, reverb/vengeance/rupture fields | cd duration (`cooldown.empowered-cd-ms`), multiplier (`cooldown.empowered-mult`), all T3/T4 tuning incl. rupture window/pierce, reverb, vengeance (`passives.ts:136-187`) | fallback 7000ms / ×2.0 (`cooldownPrototype.ts:8-9`) | world tick (arm timer — `cooldownPrototype.ts:26-56`); `onHit` (multiplier, then cooldown restart `:89-101`); T3 `beforeAttack` (channeled-beam suppress, rupture plating/DR — `cooldown/t3/pipeline/beforeAttack.ts:16-40`), `onHit`, `onDamageTaken` | Low. `executionCooldownMs` is decremented per tick and restarted only on execution — an external write mid-window persists and is honored. `executionCooldownPct` is a mirror, clobbered every tick (`cooldownPrototype.ts:51-54`) — never write it. |
| **energy** | `UsesEnergy` slice (`shared/src/components/archetypes/energy/usesEnergy.ts:2-32`), networked | `energy`, `energyMax`, plus flash/overdrive/binary/critical-mass/awakened fields | gain (`energy.per-hit`), multiplier (`energy.empowered-mult`), max via `energy.max-bonus` (per-tier only, `shared/src/systems/energyMax.ts:16-23`), full T4 spec key families (`passives.ts:258-320`) | fallback 14/hit, ×2.0, max 100 (`energyPrototype.ts:8-12`); **discharge-at-exactly-max semantics** (`energyPrototype.ts:71-74`) | `afterHit` (gain + arm — `energyPrototype.ts:50-76`); `onHit` (multiplier); T3 `beforeAttack`/`onHit`/`afterHit` (specs claim hits via `ctx.metadata['energyHandled']`) | Low-medium. `energy` is safe to write. `energyMax` is recomputed on **every recalc** (`playerEntityFormulas.ts:59-68` — comment names "future relics" explicitly); write the passive, not the field. Discharge threshold ≠ max would need code. |
| **reload** | `UsesReload` slice (`shared/src/components/archetypes/reload/usesReload.ts:2-31`), networked | `ammo`, `ammoMax`, `reloadingMs`, laser heat, clip/momentum/cannon/death-mark fields | max ammo (`reload.max-ammo`), reload time (`reload.reload-time-ms`, `reload.reload-time-mult`), duelist mult (`reload.empowered-mult`), full spec families incl. momentum reload reduction (`passives.ts:189-256`; `reloadLifecycle.ts:25-48`) | fallback 10 ammo / 1600ms (`reloadPrototype.ts:22`, `reloadLifecycle.ts:11`); **the ×0.65 damage / ×0.5 cooldown identity layer** (`stats.ts:296-312`); plating compensation 0.5 (`reloadPrototype.ts:92`) | `beforeAttack` (ammo spend, cancel-while-reloading, duelist arm, blunderbuss — `reloadPrototype.ts:83-159`); `afterHit` (deferred reload-start hooks — `reloadLifecycle.ts:88-95`); world tick (reconcile + timer — `reloadPrototype.ts:24-66`) | Low. `ammoMax` is **reconciled from the passive every tick** (`reloadPrototype.ts:28-36`) — direct writes are clobbered; write `ammo` or the passive. Bonus seam: `registerReloadLifecycleHook` (`reloadLifecycle.ts:13-23`) gives relics reload-start/complete callbacks with no pipeline work. |
| **dot** | Split: `AppliesDots` slice is a **HUD mirror only** (`shared/src/components/archetypes/dot/appliesDots.ts:2-12`); the real state is the `'dot'` status effect on the *defender's* `tracksCombat` (`dotPrototype.ts:340-359`) | on defender: `effect.stacks`, `effect.remainingMs`, `effect.data.{damagePerStack,nextTickIn,tickIntervalMs}` | the whole profile: `dot.max-stacks`, `dot.conversion-pct`, `dot.tick-interval-ms`, `dot.duration-ms`, `dot.mechanic-mult` (frame-authored, `rootsAndFrames.ts:233-267`; resolved per hit at `dotClassProfile.ts:74-87`), plus every T3/T4 element family (`passives.ts:322-370`) | fallbacks only (`dot/t3/core/constants.ts:6-12`); per-element vuln constants (SE_VULN_PER_STACK etc., `:22-31`) | `onHit` ×2 (player→monster stack apply `dotPrototype.ts:315-360`; monster→player `:364-416`); world tick (tick damage + kills + mirror — `:71-298`); T3 `onHit`/`onDamageTaken` | Low for profile changes: `damagePerStack`/`tickIntervalMs` are **refreshed on every hit** (`dotPrototype.ts:355-358`), so passive changes propagate next swing with no stale state. Don't write the `AppliesDots` mirror (overwritten per tick, `:279-297`). Direct edits to the defender's status effect are fine via the shared status helpers. |
| **summoner** | `SummonsMinions` slice on owner (`shared/src/components/archetypes/summoner/summonsMinions.ts:10-23`), networked; minions are full entities | `minionIds[]`, `respawnTimers[]`, `targetCount` | count (`summoner.minion-count`/`-mult`/`-cap`), respawn (`summoner.minion-respawn-ms`), damage/HP/speed/range/cooldown shares, sponge (`summoner.damage-sponge-pct`), guardian plating/DR shares — all of `passives.ts:410-468` | fallback respawn 5000ms (`summonerPrototype.ts:38`), count 3 (`:46`), minion speed/HP floors (`spawn.ts:31-32`) | world tick only for the core loop (reconcile slots + respawn + spawn — `summonerPrototype.ts:184-253`); `onDamageTaken` (sponge — `damageSponge.ts:55-72`, **must stay registered after defense**, `combatBootstrap.ts:33-37,62-64`); minion attacks run the full pipeline *as the owner* (`summonerPrototype.ts:178-182`) | Low. Slot count and respawn are **live-reconciled from passives every tick** (`:83-103`) — a relic key takes effect immediately, including despawning excess minions. Caveat: minion `attack` (× `minion-damage-pct`) is baked at spawn (`spawn.ts:139`) and NOT in the live re-sync (`:105-134` syncs speed/size/HP/regen/shares only) — damage changes reach live minions only on respawn. |

Slice attach/detach is centralized in `syncArchetypeSlices`
(`server/src/ecs/archetypeSliceSync.ts:34-98`), called on every equip/unequip
(`server/src/systems/player/economy/inventory.ts:28-29,40`). Dev-boot marker
invariants enforce slice presence === `combatArchetype`
(`server/src/ecs/markerInvariants.ts:55-87`) — **a relic must never attach a
foreign archetype's slice.**

---

## Why external writes are safe (the two systemic questions)

**Networking.** All six slices are in `NETWORKED_PLAYER_KEYS`
(`shared/src/protocol/networkedEntity.ts:55-68`). The delta encoder keeps a
serialized copy of every networked slice per entity and **value-diffs it every
broadcast, "regardless of whether the mutating system remembered to mark it
dirty"** (`server/src/world/nodeDelta.ts:138-153`). The archetypes themselves
rely on this — `cadence.count++` is never explicitly dirtied
(`cadencePrototype.ts:43`). So a relic listener mutating slice fields in place
needs no `markSliceDirty` for correctness (it remains good hygiene, and
`mutateSlice` in `server/src/ecs/dirtyHelpers.ts:28-38` wraps it).

**Persistence.** None of the archetype slices are persisted — `saveCharacter`
writes only `isPlayer/hasPosition/hasHealth/tracksProgression/holdsInventory/usesSkills`,
and strips `passives` on save (`server/src/db/playerRepo.ts:119-134`). Passives
are rebuilt from equipment + skills on every recalc (`stats.ts:132`), so a
relic's keys can never go stale in the DB.

**Ordering.** Listener execution within a stage is registration order
(`combatPipeline.ts:81-91,109-120`); registration order is `initCombatSystems()`
call order (`combatBootstrap.ts:38-68`), where `initAllMechanics()` runs first
(module order: cooldown, energy, reload, dot, cadence, summoner —
`server/src/systems/classes/registry.ts:18-25`). Consequences for a relic
listener registered after `initAllMechanics()`:

- Its `onHit` handlers run **after** the archetype's — they see the resolved
  hit: `ctx.metadata['empoweredAttack' | 'empoweredMultiplier' | 'empoweredBonus']`
  (`empoweredAttacks.ts:138-140`). Right place for reactive relics.
- To change what the archetype is *about* to do on the same attack, hook an
  **earlier stage** (`beforeAttack`/`onAttack` precede all `onHit` handlers
  regardless of registration order — the cooldown T3 module documents exactly
  this trick, `cooldownPrototype.ts:74-79`, and uses
  `ctx.metadata['suppressEmpoweredMult']` from `beforeAttack`
  (`cooldown/t3/pipeline/beforeAttack.ts:24-26`) to reshape the empowered hit).
- **Do not call `registerEmpoweredMultiplier` again** for an archetype that
  already has one: the first matching registration consumes the one-shot
  `hasEmpoweredAttack` flag (`empoweredAttacks.ts:103`) and later ones no-op.
  Modify the multiplier through its passive keys instead.

Values recomputed every tick / recalc that would clobber a naive write:
`cadence.threshold` (recalc), `usesEnergy.energyMax` (recalc),
`usesReload.ammoMax` (tick), `usesCooldown.executionCooldownPct` (tick, mirror),
`appliesDots.*` (tick, mirror), `summonsMinions.targetCount` (tick). In every
case the passive key is the correct write target, which is the point of the
next section.

---

## The passive-key inventory (free relic hooks)

Everything below already flows item → `mergePassives` → read site with no new
code. Items carrying class-mechanic keys is shipped precedent
(`weapon.empowered-mult-bonus` on four mountain weapons,
`shared/src/data/recipes/mountain.recipes.ts:20,92,162,251`), and **negative
deltas are established authoring practice** ("e.g. snipe's
`reload.max-ammo: -2`", `rootsAndFrames.ts:86`). Merge is additive
(`passives.ts:628-645`), so relics author *deltas* against the frame baseline.

### The empowered-attack cluster (cadence / cooldown / energy / reload-Duelist)

`registerEmpoweredMultiplier` resolves per archetype via `passiveKey` /
`passiveAddKey` options (`empoweredAttacks.ts:39-64,114-133`):

| key | read site | meaning |
|---|---|---|
| `cadence.empowered-threshold`, `cadence.threshold-mod` | `stats.ts:201-206` (recalc), `rampage.ts:25-31` (runtime) | cycle length (⚠ item-sourced values currently dead — see Gaps #1) |
| `cadence.empowered-mult` + `cadence.damage-mult-add` | `cadencePrototype.ts:12-17` | finisher multiplier (base + T3 add) |
| `cooldown.empowered-cd-ms` | `cooldownPrototype.ts:33,51,99` | window length; read at init, mirror, and every restart — live |
| `cooldown.empowered-mult` | `cooldownPrototype.ts:80-84` | execution multiplier |
| `energy.per-hit` | `energyPrototype.ts:68` | pool gain per hit |
| `energy.empowered-mult` | `energyPrototype.ts:44-48` | discharge multiplier |
| `energy.max-bonus` | `energyMax.ts:16-23` | max energy (per-tier scaling only) |
| `reload.empowered-mult` | `reloadPrototype.ts:74-78` | Duelist last-bullet multiplier |
| `shared.empowered-mult-add` | `empoweredAttacks.ts:127` | universal additive, all four archetypes |
| `weapon.empowered-mult-bonus` | `empoweredAttacks.ts:131-132` | universal multiplicative `×(1+x)` |

The HUD mirror `resolveEmpoweredMultiplier`
(`shared/src/systems/empoweredMult.ts:49-66`) recomputes the same stack — any
**new** key layered into the server resolution must be added there too or the
tooltip lies.

### Reload magazine

`reload.max-ammo` (tick-reconciled, `reloadPrototype.ts:28-36`),
`reload.reload-time-ms`, `reload.reload-time-mult` (`reloadLifecycle.ts:25-32`),
plus the entire spec families (laser heat, snipe cadence/bonus, blunderbuss,
momentum incl. `reload.momentum-reload-reduction`, cannon, death mark —
`passives.ts:189-256`).

### DoT profile

`dot.max-stacks`, `dot.conversion-pct`, `dot.tick-interval-ms`,
`dot.duration-ms`, `dot.mechanic-mult` — frame-authored
(`rootsAndFrames.ts:239-266`), resolved fresh **on every hit**
(`dotPrototype.ts:327-333` → `dotClassProfile.ts:74-87`, floors: 1 stack,
100ms tick). Plus ~40 element keys: frenzy, ignition, conflagration,
smolder, permafrost, chill/freeze, frostbite, rimeshatter, poison explosion,
eternal doom (`passives.ts:322-370`).

**Design-relevant formula fact:** damage-per-stack =
`attack × convPct × mechMult × tickIntervalMs / maxStacks / 1000`
(`dotClassProfile.ts:89-104`). Tick interval and max stacks appear in the
formula such that changing them is **DPS-neutral by construction** — a
faster-tick relic buys smoothness/expiry-safety, not throughput; a
more-stacks relic buys ramp depth, not throughput. Throughput lives in
`dot.conversion-pct` and `dot.mechanic-mult` (conversion also shrinks the
direct hit, `dotPrototype.ts:336-338` — a built-in trade axis).

### Summoner

`summoner.minion-count` / `-count-mult` / `-count-cap` (tick-reconciled,
`summonerPrototype.ts:44-57,83-103`), `summoner.minion-respawn-ms` (`:193-195`),
`summoner.minion-damage-pct` (at spawn, `spawn.ts:130,139`),
`summoner.minion-hp-pct` (live, `spawn.ts:67-71`), `-speed-mult`, `-size-mult`,
`-range`, `-attack-cooldown`, `summoner.damage-sponge-pct`
(`damageSponge.ts:62`), `summoner.guardian-plating-share-pct` / `-dr-share-pct`
(live, `statShare.ts:9-34`), plus minion-type re-skins and all T3 path families
(`passives.ts:410-468`).

### Adjacent namespaces relics must not collide with

`core.*` (stat multipliers — the role axis relics are defined against,
`stats.ts:315-341`), `technique.*` / `guard.*` (ability amplifiers),
`mobility.*`, `rite.*`, `defense.*`. A `relic.*` namespace is one new
`as const` array + union entry in `shared/src/passives.ts:589-603` — but note
most relics won't need it: they reuse the archetype namespaces above.

---

## Gaps — what a relic design would want that the code does not expose

1. **Cadence threshold from equipment is dead (bug-grade ordering gap).** The
   recalc computes the threshold at step 2c (`stats.ts:201-206`) from a
   passive map that at that point contains only skill/stance/rite keys; the
   equipment fold happens after (`:208-236`). An item carrying
   `cadence.threshold-mod` changes nothing — except for Berserker, where
   `recomputeRampageStats` re-reads the *complete* map at finisher time
   (`rampage.ts:25-31`) and would honor it, making the bug inconsistent
   between specs. **Fix: move the 2c callback after the equipment loop (or
   re-run it) — a few lines, but it must ship with (or before) the first
   cadence relic.**
2. **Reload's ×0.65 damage / ×0.5 cooldown identity layer is hardcoded**
   (`stats.ts:296-297,308`, gatling extra ×0.5 at `:309-311`). A relic that
   trades against the sub-identity ("less discount, less speed") needs two new
   keys folded into that block. Easy, contained.
3. **Energy has no flat max-energy key and no discharge-threshold key.**
   `energy.max-bonus` only works as per-tier scaling with `perTier > 0`
   (`energyMax.ts:17-22`); "discharge arms at N%" or "hold the charge" changes
   `energyPrototype.ts:71-74` semantics. Flat max: trivial. Threshold
   semantics: a real (small) mechanic change.
4. **Empowered-attack *shape* is not data-driven.** Splash-on-finisher,
   chain, charge-banking etc. need a new listener reading
   `ctx.metadata['empoweredAttack']` at `onHit`/`afterHit` — the seam is clean
   and precedented (Duelist AoE, channeled beam), but it is per-relic listener
   code, not a key. The brief's §10 instruction ("say so plainly") applies.
5. **DoT stack cash-out / spread** (Detonate/Contagion-shaped relics) is new
   code — already scoped as ability work in
   `docs/abilities-evolution-implementation-plan.md:323,334`; a relic wanting
   it should share that primitive rather than duplicate it.
6. **Summoner minion damage doesn't live-update.** `minion-damage-pct` is
   baked at spawn (`spawn.ts:139`) and omitted from the per-tick re-sync
   (`summonerPrototype.ts:105-134`). Self-corrects within one respawn cycle;
   adding attack to the re-sync is a 3-line change if a relic needs it crisp.
   (Summoner is also under separate rework — brief D4 — so relic hooks here
   should be written against passives, not slice internals.)
7. **The "generic per-archetype effect resolver" does not exist in code.**
   It is a locked design principle in
   `design_docs/abilities-evolution-plan-updated.md:73-82` ("use a small
   generic resolver layer rather than creating separate ability IDs") with
   constraints at `:506-530` — but `abilityEffects.ts` contains no archetype
   branch today, and no Reload adapter has shipped. The *shipped* precedents
   for archetype-keyed behavior are: (a) `registerEmpoweredMultiplier`'s
   `attackerSlice` / `attackerClass` / `passiveKey` options — one registration
   point, per-archetype resolution via slice presence
   (`empoweredAttacks.ts:39-64`); (b) rune actions gated by
   `requiredArchetype` (`shared/src/runeDatabase.ts:104,754-763`, enforced at
   craft time in `server/src/systems/player/economy/runeCrafting.ts:57`). If
   Q2 chooses shared relic ids with per-archetype behavior, budget for
   building the resolver.
8. **Interval keys merge additively — mind fallback semantics.** A
   faster-window relic authors a negative delta (e.g.
   `cooldown.empowered-cd-ms: -2000`); this is safe because every archetype
   frame authors the base key (`rootsAndFrames.ts:211-229,276-294,304-322`),
   but a relic key whose base producer is absent (frameless dev characters)
   yields a negative total with no clamp at the cooldown read site
   (`cooldownPrototype.ts:33`). Cheap guard: clamp at read, or author relic
   deltas only for keys with guaranteed producers. (The regen-burst pair shows
   the pattern's known pitfall and its fix, `passives.ts:619-692`.)

---

## State/persistence cost (Q1 verification)

**Pattern A — 6th equipment slot: the cores claim still holds.**
- Equip/unequip is fully slot-generic — reads `def.slot`, no per-slot
  branching, and already triggers recalc + slice sync
  (`inventory.ts:8-42`). Zero changes.
- Persistence: equipment hydrates as `{ ...emptyEquipment(), ...stored }`
  (`playerRepo.ts:203-206`) — old rows get `relic: null` free. **No
  migration.**
- Networking: equipment is nested inside the already-networked
  `HoldsInventory`; the allowlist gates top-level slice keys only. No change.
- What a 6th slot actually touches: `EquipmentSlot`/`EQUIPMENT_SLOTS`/
  `emptyEquipment()` (`shared/src/items.ts:51-62`), the recipe→item mapping,
  one branch in `requiredPlusFor` if relics copy cores' +0 evolution
  (`shared/src/systems/evolution.ts:26-28`), and the client's hardcoded slot
  lists (ForgeTab et al. — same list cores already extended). All shared/UI;
  no server logic, exactly as the cores work found
  (`docs/cores-current-state.md:23-38,64-74`).
- One nicety: relics may not even need a hard equip gate for correctness —
  foreign-archetype keys are inert (only that archetype's systems and slice
  read them), so gating is a UX decision. If a gate is wanted, the
  `coreIsActive` range check at `stats.ts:216` is the one-line precedent for
  an archetype check.

**Pattern B — `TracksProgression`: also migration-free, but not plumbing-free.**
The slice is whole-row JSON with `?? []` defaulting on hydrate — the
abilities re-shape migration was done entirely in `hydratePlayerSlices` with
"No SQL migration needed" (`playerRepo.ts:236-239`). But Pattern B additionally
needs: a new fold in `recalculatePlayerStats` (equipped relics →
`mergePassives`, like rites at `stats.ts:177-184`), a new socket intent +
handler for equipping (Pattern A reuses `inventory:equipItem`), and new panel
UI. Its only unique win is the tier→slot-count function.

---

## Recommendations for the D2 brief before it goes out

1. **Attach (or inline) the passive-key inventory above.** §3.1 says "a relic
   can introduce its own namespace" — the stronger, catalogue-shaping fact is
   that ~150 archetype keys already exist and are the intended hook for most
   relics. Tell the designer to author relics as **deltas against frame
   baselines** (negative allowed; precedent `reload.max-ammo: -2`).
2. **Correct constraint 6's wording.** "The established fix … *has been* a
   generic per-archetype effect resolver" overstates: it is an established
   *decision* (abilities plan §3.2/§12) with **no shipped implementation**.
   The shipped precedents are slice-gated listener options and rune
   `requiredArchetype`. If Q2 picks shared relic ids, that resolver is new
   work the catalogue should budget for.
3. **Flag the two hardcoded walls so the catalogue routes around or prices
   them:** cadence-threshold-from-items needs the recalc reorder (Gaps #1 —
   schedule it with the first cadence relic), and reload's 0.65/0.5 identity
   layer needs new keys if any relic trades against it (Gaps #2).
4. **Give the designer the DoT formula fact** (tick interval and max stacks
   are DPS-neutral; conversion% self-trades against the direct hit). It
   changes which DoT relics are interesting and pre-answers part of Q2's
   "what does a DoT player get".
5. **State the rune-overlap rule in mechanic terms:** the runtime fields a
   relic may write are the slices in the table; anything expressed as
   *condition → action* belongs to runes. A relic writing `executionCooldownMs`
   on a trigger is a rune wearing a relic costume.
6. **For Summoner relics, require hooks be named as passive keys only** (not
   slice fields), since D4 may reshape the slice but the passive read sites
   (`minion-count`, `respawn-ms`, shares, sponge) are the stable contract.
7. **Note the HUD mirror obligation:** any relic key that layers into the
   empowered multiplier must also be added to `resolveEmpoweredMultiplier`
   (`shared/src/systems/empoweredMult.ts`) or the stat panel will display the
   wrong number — same class of rule as the brief's §10 "wire it" column.
