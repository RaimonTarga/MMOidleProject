# Monster Combat Rework (T1–T4) — Current State

> **🔨 IMPLEMENTED 2026-08-22** — structure, behavior and primitives are in.
> **Numbers are NOT.** Every magnitude added by this pass is a placeholder; the balance
> pass is a separate, user-owned task.
>
> **Design authority:** [`design_docs/MONSTER_COMBAT_REWORK_HANDOFF_T1_T4_2026-08-22.md`](../design_docs/MONSTER_COMBAT_REWORK_HANDOFF_T1_T4_2026-08-22.md)
> — the locked designs. That doc stays flat in `design_docs/` (it is what the system
> *should* be); this doc is what the code *does*. If they disagree, the code wins and
> this doc is the one to fix.
>
> Related living docs: [`monster-behavior-current-state.md`](monster-behavior-current-state.md)
> (the `behavior` field), [`biome-ecology-current-state.md`](biome-ecology-current-state.md)
> (density, terrain, node features).

## TL;DR

The rework's thesis is **not** "later enemies have more mechanics" — it is *later enemies
express their biome's rules more deliberately*. In practice the pass **deleted more fields
than it added**: blanket evasion, roster-wide DoT, per-mob ramps, per-hit slow spam and
universal anti-heal all came off, and each biome got a small number of authored identities
in their place.

Two things that sound like new systems were **already built** and only needed extending:

- **Volcano Heat** and **Tundra Chill** are the existing node-wide `ambientRamp` node
  features ([`shared/src/world/nodeFeatures.ts`](../shared/src/world/nodeFeatures.ts)).
  Chill gained an attack-speed term; Heat was already damage-dealt + damage-taken.
- **Non-recursive corpses** were already enforced — `recordCorpse` skips `isRaised` mobs
  ([`server/src/systems/world/corpses.ts`](../server/src/systems/world/corpses.ts)), so
  corpse → raise → kill → corpse can never loop.

---

## 1. What was removed

Removals are the load-bearing half of this pass. Do not reintroduce any of these.

| Removed | Where | Why |
|---|---|---|
| `evasion` on the Cave roaming line | cave-lurker, giant-spider, deep-spider | Random misses are not an identity; roaming is. **Not** replaced with DR. |
| `evasion` | apex-silverback, emerald-constrictor | Clutter on mobs that already had a headline. |
| `rampOnCombat` (all 9 Volcano mobs) | volcano | Global Heat already owns "the fight gets more dangerous". Nine per-mob ramps on top were a second difficulty knob doing one job. |
| `rampDebuff` + per-hit `slowEffect` | all Tundra | The environment owns baseline slow. Every mob reapplying it made the roster one monster and stacked an unauthored root. |
| `dotEffect` on 5 of 6 Wasteland mobs | graveyard | The biome is corpses/necromancy, not universal plague. Only the Plague Hound keeps it. |
| `dotEffect` | bog-witch, mire-hex-spitter, jungle-stalker, thornback-lizard | Those lineages are support / speed / volley, not a fourth poison source. |
| `appliesAntiheal` | hadal-stalker, elder-leviathan | Reached ~75–90% suppression on deliberately long elite fights. |
| `enemySoftCap` | permafrost-behemoth, elder-leviathan | Heavy plating is already enough defensive identity; a second weapon-matchup layer was kitchen sink. |
| 4-stack `appliesVulnerability` | desert basilisks | Replaced by ONE nonstacking Sunder. `dune-tyrant` lost it entirely. |
| `slowEffect` on every Desert dealer | dust-djinn, sandweaver, sandspitter-cobra | A dealer carries no CC. |
| Ordinary-hit `speedMult: 0` | desert basilisks | Replaced by the telegraphed Petrifying Gaze. |
| `openingStrike` on the Ape line | jungle-ape, silverback, apex-silverback | Charge + ramp was already the whole idea. |
| Sentinel `patrol` | cliff-hopper | Wrong fantasy: a caprine traverses terrain, it does not guard a post. |
| Mixed wolf + ranged pack | ancient-wolf | Pure wolves now, baseline 3 Young Wolves. |
| **`onPackAlphaDead` (the whole function)** | `server/src/systems/combat/ai/packs.ts` | See §5. |

**`charnel-brute` is deferred to T5**: removed from graveyard's T4 `monsterPoolByTier`, its
definition deliberately kept in [`graveyard.monsters.ts`](../shared/src/data/monsters/graveyard.monsters.ts)
for a future tier to pick up. Nothing spawns it today.

---

## 2. New behavior primitives

All authored on `MonsterDefinition` ([`shared/src/data/monsters/types.ts`](../shared/src/data/monsters/types.ts)).
Every one is deterministic (session tokens / counters off the authoritative clock, no RNG).

### Ecology / movement

| Field | Effect | Implementation |
|---|---|---|
| `flies` | Ignores mountain ledges for pathing **and** roams a wide, lazy aerial circuit while idle. Client draws it hovering. | [`pathMotion.ts`](../server/src/systems/world/pathMotion.ts), `aerialWanderTarget` in [`ai.ts`](../server/src/systems/combat/ai/ai.ts) |
| `staticSentry` | Never roams: holds its spawn point, activates on pull range, returns after. The generalisation of `holdsChokepoints` past Mountain (needs no authored terrain). | `createMonster` in [`spawning/index.ts`](../server/src/systems/world/spawning/index.ts) |
| `idleAnchor` | `'jungle-bush'` / `'swamp-pool'` — idles **inside** the terrain feature instead of roaming past it. | `bushIdleTarget` / `poolIdleTarget` in [`ai.ts`](../server/src/systems/combat/ai/ai.ts) |
| `concealedWhileIdle` | Purely presentational camouflage for a monster with no terrain anchor: the client subdues it while idle and reveals it on engage. Deliberately separate from `idleAnchor` so camouflage never moves the monster. | `isConcealingType` in [`monsters.ts`](../client/src/render/monsters.ts) |

`flies` and `vaultsMountainLedges` are deliberately separate despite sharing the pathing
consequence: the caprine climbs the terrain, the flyer is above it, and only the flyer
gets the aerial idle and the hover presentation.

⚠ `idleAnchor: 'swamp-pool'` replaced a hardcoded `biome === "swamp"` 65% roll that applied
to *every* swamp mob. It is now authored on the one monster whose identity is living in the pool.

### Attack shapes

| Field | Effect |
|---|---|
| `openingVolley: { hits }` | The first beat of each combat session fires N pipeline hits (reveal-and-fire). Re-arms on fresh aggro. **Supported but currently unauthored** — the Chameleon line moved to a recurring `castedAttackSpeedBuff` barrage, which is visible and repeatable rather than a one-time burst. |
| `cadenceVolley: { everyNAttacks, hits }` | Every Nth beat fires N hits (periodic burst). |
| `dotEffect.openerStacks` | The first landed hit of a session applies N stacks — the ambush as poison *alpha* rather than a damage spike. Consumed on the hit that actually lands, so an evaded opener is not burned. |
| `cadenceFinisher.rootMs` | The boosted cadence beat also roots (Constrict). |

Precedence for hit count is **highest wins, never multiply** (`monsterVolleyHits`): a mob
stacking an opening volley on a cadence volley would fire a wall of projectiles on one beat.

### `chargedAttack` riders — the "periodic ability" answer

Rather than each locked design getting its own subsystem, they hang off the one telegraphed
cast primitive that already exists. Every one therefore arrives with a **cast bar** the player
can see and a `target-casting` rune condition that can react to it.

| Rider | Used by |
|---|---|
| `rootMs` | Petrifying Gaze, Frostbind / Deep Freeze |
| `appliesAntiheal: { reduction, durationMs }` | Wither (Bog Witch / Mire Hexer), Abyssal Bite |
| `refreshesPlayerDots: { extendMs, maxTotalMs }` | Plague Hex (Mire Hexer) |
| `requiresAmbientStacks` | Frostbind — gated on the node's Chill |

**Root is movement-only.** It reuses the shared `slow` status at `speedMult: 0`, so the buff
HUD renders ROOT, Cleanse strips it, and mobility tenacity shortens it — but the player can
still *fight* while rooted. That is what keeps these solvable by configuration rather than
reflex. Hard control (movement **and** attacks) remains the Cave Troll's `engageSequence`
lockdown alone.

**Plague Hex creates nothing.** It extends monster DoTs already on the player; no new stacks,
no new effect. Against a lone Hexer it does nothing at all — correct, because it is a *support*
creature.

### `monsterAbilities` — the generic elite rotation

An ordered list of independent cast-time abilities on `MonsterDefinition`, each owning its own
cooldown, so an elite can have a readable rotation without another bespoke subsystem. The first
*ready* ability in the list is selected. Scheduler:
[`updateMonsterAbilities`](../server/src/systems/combat/engine/combat.ts); per-ability runtime
state lives in `TracksCombat` counters keyed by ability id
([`monsterMechanics.ts`](../server/src/systems/combat/engine/monsterMechanics.ts)).

| Action | Effect |
|---|---|
| `hit` | One full-pipeline hit at `multiplier`, with an optional player rider and knockback. |
| `area-hit` | A committed circle: planted at cast start, resolves at that point whether or not the target is still standing in it. Hits players **and** minions. |
| `attack-speed-buff` | Self haste, either for a duration or as N primed attacks. |
| `shield` | Self absorb ward as a fraction of max HP, with the optional `shatter` rider. Drained ahead of any periodic `enemyShield` by `applyCastedMonsterWard`. |

This absorbed two older primitives that hid their beat from the player: `cadenceFinisher`
(an every-Nth-attack spike with no tell) became a named cast on its own cooldown for the
Tundra/Volcano anchors, and the periodic `enemyShield` on the Volcano anchors and
`elder-leviathan` became a casted `shield` — the barrier now costs a visible wind-up instead
of reforming on a hidden timer. `enemyShield` itself is unchanged and still used elsewhere.

⚠ Like `enemyShield`, a casted ward is only drained by `runPlayerAttack`. **DoT ticks bypass
it entirely** — that is the long-standing "shell rewards burst over chip" rule, not an
oversight, but it means a `shield` action is worth nothing against a DoT build.

`target` says where an `area-hit` **plants** — `'self'` at the caster's feet, `'player'` at the
target's cast-start position. It does **not** say who the ability hurts: a `target: 'self'` body
sweep still lands on the player. Presentation must read the *action*, not the ability target
(`describeMonsterAbility` in [`bestiaryMechanics.ts`](../shared/src/systems/bestiaryMechanics.ts)
is the one composer for both the bestiary and the map panel).

Player riders (`slow` / `antiheal` / `vulnerability`) reuse the shared player statuses rather
than new ids, and go through `applyStrongestPlayerRider`: `applyStatusEffect` keeps the
**existing** `data` when the status is already on the target, so a rider that loses the race to
another source would otherwise refresh a clock and apply no magnitude at all. The harsher of the
two values wins. Every rider is skipped on an evaded hit, per the global evade rule.

⚠ **ONE CAST PER MONSTER.** The scheduler yields while a `chargedAttack`, `castedAttackSpeedBuff`
or `lowHealthWard` wind-up is pending. Two invariants depend on it: `publishGroundZone` clears
telegraphs by `ownerId` (a second cast would **erase** the first one's committed circle) and the
client's cast bar is keyed by monster id (a second cast-start steals the bar, and the first
cast-end closes it early). Without the guard an ability could open mid-Devour and leave the slam
to land unannounced. A cast also stamps `performsAttack.lastAttackAt`, so a self-only beat costs
the swing it replaced instead of resolving and immediately swinging for free.

### `castedAttackSpeedBuff.rallyNearby`

A capped, visible alternative to passive pack membership: on cast completion, up to `maxTargets`
**unaggroed, non-boss, un-leashed** monsters in `radius` are handed the caster's current target.
One rally per aggro session by default, and a rallied monster is stamped so it cannot relay the
call into a second wave. This is the Jungle Ape's Chestbeat, and the single sanctioned exception
to Jungle's no-pack rule — the biome still groups fights through terrain, not coordination.

### Defensive states

| Field | Effect |
|---|---|
| `shellUp` | **Once per life** (not per session), at an authored HP threshold: retracts, cannot move or attack, direct damage multiplied down hard. **DoTs keep ticking at full strength** — that is the counterplay and the reason it can never stall a fight. `pool` (evolved Snapper) contaminates the ground on retract. |
| `enemyShield.rechargeAfterCleanMs` | The barrier returns only after N ms *without being hit*; any hit restarts the timer. Hard to kill without being generically tanky. |
| `enemyShield.shatter.vulnerability` | Breaking the shell opens a damage window on the monster. **Replaces** the old "shatter freezes nearby enemies" rider, which paid out most in exactly the crowded fights Tundra is not supposed to have. |
| `empowersAllies` | Periodic attack-speed haste to nearby monsters while engaged (Necrotic Screech). Attack speed only — never speed *and* damage. |
| `scalesWithAmbientRamp.chargedOnly` | Restricts the ramp feed to charged hits, so the Tundra apex's *slam* scales with Chill while its ordinary swings stay flat. |

New tick systems: [`shellUp.ts`](../server/src/systems/combat/ai/shellUp.ts) and
[`allyEmpower.ts`](../server/src/systems/combat/ai/allyEmpower.ts), both registered in
`World.tick` **before** `updateMonsters` with the other ecology coordinators — they set state
only; `updateMonsters` stays the single executor.

---

## 3. Biome-global mechanics

Both are node features, not monster fields.

- **Volcano Heat** (`volcanicHeat`): +5% damage dealt, +8% damage taken per stack, 6 stacks,
  3 s ramp. Unchanged by this pass — but it is now the *only* ramp in the biome.
- **Tundra Chill** (`tundraChill`): 5% move slow **+ 4% attack cooldown** per stack, 6 stacks,
  4 s ramp. The attack-slow term is new (`AmbientRampPayload.attackSlowPct`), read at the
  player attack gate in [`combat.ts`](../server/src/systems/combat/engine/combat.ts) **additively**
  with frost-ramp so the two cannot compound into an unauthored stun. Hard-clamped at a doubled
  cooldown; max Chill must still leave you fighting.

---

## 4. Per-biome identities as implemented

- **Plains** — unchanged except Savanna Hawk `flies`. Done.
- **Forest** — Dire Wolf pack is pure wolves (3); Thorn Spitter `cadenceVolley` every 3rd beat.
- **Swamp** — Snapper line `shellUp` (evolved adds a pool); Witch line Wither + Plague Hex;
  Stalker/Lurker `openerStacks` 2/3; Bog Lurker `idleAnchor: 'swamp-pool'`. DR removed where a
  mob already owns shell or evasion.
- **Mountain** — Titan line gets the reusable Ground Slam (**no** ledge vault); caprines vault +
  knockback ram; Crag Mortar and Cliffside Roc are no longer `kiter` (stationary artillery /
  aerial artillery); Boulder Thrower gets a lobbed planted circle.
- **Cave** — evasion gone from the roaming line, Deep Spider roams harder instead; Gargoyles are
  `staticSentry` with a telegraphed shot / crystal volley; Cavern Troll inherits the Troll's
  engage → control → Slam sequence.
- **Jungle** — no pack mechanics anywhere (and no Marking Dart, ever); Snake `idleAnchor:
  'jungle-bush'`; Chameleon line `openingVolley` 2 → 3; Ape line is charge + ramp only;
  Constrictor is Constrict (cadence + root).
- **Desert** — see §5.
- **Volcano** — no per-mob ramps; swarm cohesion on the small mobs; salamanders `staticSentry`.
- **Tundra** — Bear line shatter → damage window; caster line `staticSentry` + Chill-gated
  Frostbind; Behemoth simplified to plating + one telegraphed Glacial Slam that alone scales
  with Chill.
- **Wasteland** — plague only on the Plague Hound; Vulture screeches instead of poisoning;
  Gravewright's budget is resurrection alone; density 40 → 28.
- **Trench** — three separate problems: Serpent (hunter, telegraphed Bite carrying the only
  anti-Recovery left), Hadal Stalker (armored ranged kiter, no charge, HP down / plating up),
  Leviathan (anchor: Carapace + Devour, no anti-heal, no soft-cap, no enrage yet).

---

## 5. Two changes worth calling out

### The pack-alpha scatter is gone, globally

`onPackAlphaDead` used to remove every surviving follower with **no rewards**. It was a hidden
"you lose essence by killing the wrong thing first" rule, and Desert's locked design needs the
exact opposite. Deleted; every follower is now killable for full rewards. This also affects
Prairie Wolf and Dire Wolf packs, which now read as plain packs.

### Desert spawn pools list controllers only

A Desert group is an **exact 1:1 duo**. The dealers (`dust-djinn`, `sandweaver`,
`sandspitter-cobra`) were removed from `monsterPoolByTier` so a lone kiter can never spawn
without a controller. Each controller roll spawns itself + its dealer, so effective population
per roll is 2 and node density is unchanged. Both controller *families* are listed at every
tier: basilisk (hard control) and scorpion (soft control), the latter reshaped from the old
solo "harasser" line into a controller stat shape (HP up, speed down, damage well down).

---

## 6. Tests

[`server/test/monsterReworkPrimitives.test.ts`](../server/test/monsterReworkPrimitives.test.ts)
is the wiring smoke test: it registers throwaway monster types, ticks the real world, and
asserts observable invariants for volley precedence + session re-arm, opener stacks, Shell Up
(open/close/once-per-life), Necrotic Screech radius, clean-recharge barrier under pressure vs
in a lull, and the Chill attack-slow math. Deliberately **not** a balance test.

Three existing tests encoded behavior this pass deliberately changed and were updated:
`biomeEcology` and `monsterDeathEffects` (scatter removed), `desertPairs` (1:1 duo), and
`monsterDotBuffIcons` (poison-authoring floor 19 → 12, since the roster genuinely shrank).

---

## 7. Known gaps / not done

- **All balance numbers.** Explicitly out of scope. Swamp damage in particular was called out
  in playtesting as likely far too high, and Wasteland density (28) is a first guess.
- **Jungle Stalker "moves through foliage effectively"** — not implemented. Would need
  bush-aware movement costs; the ambusher identity currently rests on speed + pounce.
- **Volcano lava-pool scaling** — the doc asks for a check that lava punishes routing without
  dominating total biome damage. Not measured.
- **Client tells are minimal by design** (per the scoping decision): hover offset for flyers,
  alpha fade + reveal for camouflage, distinct pulse rings for shell/screech. No bespoke art,
  no fly-in animation, no shelled sprite state.
- **Bosses are untouched.** The handoff's scope is trash and elites.
