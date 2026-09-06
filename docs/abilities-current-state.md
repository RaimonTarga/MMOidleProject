# Abilities — Current State

Living truth for the active **Ability** system (Technique / Guard). Design authority is
`design_docs/ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md`; the superseded plans live in
`docs/archive/abilities-plan.md`, `docs/archive/abilities-evolution-implementation-plan.md`
and `design_docs/archive/abilities-evolution-plan-updated.md`.

**Shipped:** the full **T1–T4 roster of 21 abilities** on authored per-tier ranks, the
control ladder (slow / root / stun), ability **engagement range**, the **affliction
toolkit** (Contagion / Detonate, reading the shared DoT inventory), the **charge-based
window** (Imbue Lightning, on the new `self-cast` shape), and bespoke in-world FX for
every ability.

> **Name collision (kept distinct).** The passive talent tree (`UsesSkills`, `skillTree/`) is
> class progression and is **untouched**. "Abilities" is the active system (Technique / Guard).

**All numbers are FIRST-PASS SEEDS** — the balance pass owns the values. They express
relative roles; changing them is expected, and should preserve each ability's role.

---

## Data model — state rides `TracksProgression` (like runes)

Ability state lives on `TracksProgression`, NOT a separate component: it is build/loadout
data exactly like runes, which avoids a DB migration, a new networked slice, a new
`ServerEntity` key, and fixture churn. Two fields
(`shared/src/components/core/networkedSlices.ts`):
- `knownAbilities: string[]` — abilities learned (crafted); the slottable pool.
- `equippedAbilities: EquippedAbilities` — **ordered lists per slot kind**:
  `{ techniques: string[]; guards: string[] }`. **List order is fire priority.**

### Slots are tier-gated
`abilitySlotCount(playerTier)` (`shared/src/abilities.ts`) independently defines Ability slots:
T1–T2 → 1 Technique / 1 Guard, **T3 → 2/1**, **T4+ → 2/2**. Keyed on **player tier**, not
Global Mastery — Biome Mastery owns ability *unlocks*, tier owns *slots*. Projected on
`PlayerView` as `abilitySlots`.

### Migration (no SQL)
`normalizeEquippedAbilities` accepts the legacy Step 7 `{technique, guard}` shape and coerces
it to lists, dropping unknown ids, slot mismatches and duplicates. Applied in `playerRepo`
hydrate — the column is whole-slice JSON, so no schema migration was needed.
`RENAMED_ABILITY_IDS` maps ids that changed after shipping (`heavy-strike` →
`expose-weakness`, **`charged-strike` → `power-strike`**); it is **additive-only**, since
removing an entry silently strips the ability from affected saves.

---

## Progression is AUTHORED, not scaled

`scalePerTierPct` is **gone**. Every ability owns one authored `AbilityRank` per player tier
from its home tier onward:

```ts
rank = clamp(playerTier - homeTier + 1, 1, ranks.length)
```

A rank authors the whole picture — `effect`, `cooldownMs`, `castMs`, `rangeBonus` — so a rank
may deepen a completely different axis from the one before it. That is the point: **once a
mechanic reaches its natural ceiling, the next rank deepens something else.** Sweep reaches
100% splash at rank III and rank IV buys frequency instead of inventing 120% splash; Brace's
DR stops at 45% and rank IV buys duration; Cleanse's stack/affliction counts are discrete and
never run through a percentage multiplier.

It is the **same learned ability** throughout — one id, one lineage, one loadout entry. The
UI shows the rank numeral (`Sweep III`) so a player who just tiered up sees the acknowledgement.

Clamping matters at **both** ends: past the last authored rank an ability holds (the T5+
story until bespoke ranks are written), and below its home tier it reads rank I rather than
indexing `ranks[-1]` on a de-levelled or admin-edited character.

Helpers: `abilityRankAt`, `abilityRankNumber`, `abilityMaxRank`, `abilityCooldownMs`,
`abilityCastMs`, `abilityRangeBonus`, `abilityRankNumeral`, `abilityDisplayName`.

### The scaling seam — `resolveAbilityEffect`
**Every consumer must resolve effects through this.** Reading a rank's `effect` raw silently
opts an ability out of Technique Power. It applies the authored rank, then Technique Power —
only on fields listed in `TECHNIQUE_POWER_FIELDS`, i.e. offensive payloads. Control
durations, dash distances, Snipe's reach and Expose Weakness's vulnerability are absent by
design: a damage stat must never buy control or range.

`ABILITY_MULTIHIT_MODE` declares, per effect kind, whether a Reload magazine distributes the
payload or lands it on the first hit only — deliberately per-effect so a 1.5 s stun can't
become five 0.3 s stuns.

`validateAbilities()` + `validateAbilityRecipes()` run at dev boot: they catch a rank that
changes effect kind (a different ability wearing one id), a cast with no wind-up, an ability
with no recipe (unlearnable), and two recipes teaching one ability (a dead reward slot).

---

## Engagement range — why Charge and Snipe work

`hasAttackTarget` is written by the combat loop from `bestTargetInReach(..., attackRange)`, so
it only ever names a monster the player can **already hit**. An ability driven off that target
can never act at a distance — which is exactly why Charge used to be pointless (by the time it
could fire, the gap it exists to close was already closed) and why a melee build could never
open with a cast.

So abilities resolve their own target, through their own reach
(`abilityTargeting.ts`):

```
engagementRange = player.attackRange + rank.rangeBonus
```

- **Charge** carries `rangeBonus: 300` (its rush distance): it engages a target up to 300px
  beyond normal reach, closes, and lands the empowered blow. Its `target-beyond-reach`
  trigger stops it firing at something already in contact. It is no longer an instant
  reposition — it is a `charge`: a 400ms wind-up, then a real 4× rush that the target can
  move during and that hard control can break. `isChargingAbility.speedMult` is a temporary
  movement layer in `playerSpeedMults`, never a mutation of the player's position speed, so
  stat recalculation and ordinary movement resume cleanly when the component detaches.
- **Snipe** carries `rangeBonus: 300`: the cast opens on something the player cannot touch,
  and `holdsPositionWhileCasting` stops auto-combat closing for the wind-up — which is what
  makes it a standoff tool rather than a slow opener you immediately walk out of. Casts with
  no range bonus (Power Strike, Stunning Strike) still walk with the fight.

The player's `attackRange` is **never modified**. A melee character equipping Snipe gains a
ranged *tool*; their basic attacks stay melee.

---

## Firing — `abilityFiring.ts`

`updateAbilityFiring(world, now)` runs each tick after rune flags + target acquisition,
before combat resolves.

- **Cooldowns are per ABILITY** (`ability.cd.<abilityId>`), not per slot — a loadout swap
  must not dodge a cooldown, and two equipped abilities must not share a rhythm.
- **Techniques share ONE offensive channel** (`hasArmedAbility` and `isCastingAbility`,
  mutually exclusive and singular). The driver walks the list in order and stops at the first
  ability that CLAIMS the channel. A loser is *not* put on cooldown — it stays eligible.
  An **`instant` Technique (Frenzy) claims nothing**: it is self-facing, so it neither blocks
  nor is blocked by an armed charge sitting on the channel.
- **Guards** activate independently but at most **one activation per decision window**
  (`ability.guard.window`, one tick). Already-active buffs layer freely.
- **Situational Guards hold their cooldown**: Break Free will not fire with nothing holding
  the player, Cleanse will not fire with nothing to strip, a Recovery Guard will not fire at
  full HP, and a reposition with nowhere to go declines rather than dashing into space.
- **Rune overrides are per slot INDEX**: `fire-technique`/`fire-guard` drive slot 0,
  `fire-technique-2`/`fire-guard-2` drive slot 1.

### Triggers
`in-combat` · `hp-below` · `n-aggro` · `has-debuff` · **`has-hard-control`** (Break Free —
the one trigger that must work while the player cannot act) · **`target-beyond-reach`**
(Charge) · **`enemy-within`** (Disengage).

## Execution shapes

| Shape | Mechanism | Worked by |
|---|---|---|
| `armed` | attaches `hasArmedAbility`; rider lands in `abilityEffects.ts` on the next hit | Sweep, Expose Weakness, Hamstring, Binding Strike, Quick Strike |
| `cast` | attaches `isCastingAbility`; see below | Power Strike, Snipe, Stunning Strike |
| `charge` | winds up as a `cast`, then attaches `isChargingAbility` and **rushes** the target at `chargeSpeedMult` until contact, interruption or `chargeMaxMs`; hands the armed-hit rider back to the pipeline on arrival | Charge |
| `reposition` | resolves immediately by moving the player; optionally also arms | Disengage |
| `self-cast` | winds up like a `cast` but resolves on the PLAYER — no target to acquire and none to lose | Imbue Lightning |
| `instant` | immediate self-facing effect | Brace, Cleanse, Second Wind, Bramble Guard, Endure, Break Free, Recuperate, **Frenzy (a Technique)** |

### Cast lifecycle — `abilityCasting.ts`
Mirrors the proven monster `chargedAttack` machine: arm → wind-up → resolve, aborting on hard
CC, on a lost target, or on drifting outside the ability's reach. Two deliberate differences:
- **An aborted cast costs nothing.** The cooldown is charged only on resolve.
- **Movement is held only for a RANGED cast** (see engagement range above).

`technique.cast-speed-pct` shortens the wind-up (capped at 60% — the telegraph is the cost
that makes the payoff fair). Node events `player-cast-start` / `player-cast-end` drive the
client; `player-cast-end` carries `targetPos` when it fired, because a cast resolves on its
own target and has no `player-hit` to hang its FX on.

---

## The control ladder — `combat/status/monsterControl.ts`

Three deliberately different levels, kept **structurally** distinct rather than as three
numbers of one status:

| Ability | Movement | Actions | Cast required | Cooldown profile |
|---|---|---|---|---|
| **Hamstring** | slowed | allowed | no | low |
| **Binding Strike** | stopped | allowed | no | medium |
| **Stunning Strike** | stopped | **stopped** | **yes** | high |

`monsterControl.ts` is the **single writer for a monster's slowed speed**. Chill, Freeze and
an ability slow all overwrite `hasPosition.speed` and `performsAttack.attackCooldown` with
absolute values read back from `MONSTER_DATABASE`; two independent writers each treating the
other's output as "the clean base" ratchet against each other every tick. Every source
registers here and `updateMonsterSlows` applies the **strongest of each axis** once per tick
(never the sum — summing a chill onto a Hamstring would pin the target, and pinned is *root*,
a different rung with a different cost), restoring the database values when no source remains.
`updateChillAndFreeze` was reduced to marker lifecycle only.

Root uses `isRooted` plus an ownership flag, so an expiring 1.5 s Binding Strike can never
clear a root a boss script installed. Stun goes through the existing `applyStun`, so post-stun
immunity keeps chain-locking off the table.

**Player-side hard control** is one list: `combat/status/playerHardControl.ts`. It defines what
breaks a cast, what satisfies Break Free's trigger, and what Break Free removes. Cleanse
deliberately does **not** answer it.

---

## Guard buffs are EXPLICIT buffs, one id per slot

Guard boons go through the buff system (icon + timer in the buff bar), not raw shields.
Because two Guards can be equipped, per-slot ids exist for both the DR buff (`ability-guard`,
`ability-guard-2`) and the Recovery window (`ability-second-wind`, `ability-second-wind-2`).
This shape is forced: `BUFF_IDS` is a fixed const list and status-effect `data` is
numbers-only, so the owning slot cannot live in effect data.

**Simultaneous Guard mitigation** (the global rule the T4 double-Guard loadout depends on):
the `onDamageTaken` reader sums active slots **multiplicatively** — each is a separate
reduction of what got through — capped at `GUARD_DR_CAP` 0.9. Additive stacking would hit the
cap far too easily and make a second Guard strictly the best defensive pairing. Knockback
resist takes the **best** active slot rather than stacking.

**Recovery sources are per slot too** (`skill` / `skill-2` in the Recovery engine). Second
Wind (strong/short) and Recuperate (weak/long) are deliberate opposites and may be held
together; sharing one source would let the stronger fraction ride the longer window — strictly
better than either ability as authored.

---

## Technique itemization — `TECHNIQUE_KEYS`

The offensive sibling of `GUARD_KEYS`, riding the existing equipment
`mechanicEffects → usesSkills.passives` pipeline (no new state, slice, or migration):
- `technique.power-pct` — scales opted-in offensive payloads only
- `technique.cooldown-reduction-pct` (capped 0.9)
- `technique.cast-speed-pct` (capped 0.6)

Carried by **weapons**; Guard potency stays on the recovery/charm slot. The budgets are
deliberately not interchangeable.

## Scaling / potency rules

| Stat | Touches | Never touches |
|---|---|---|
| Technique Power | Sweep splash, Power Strike / Snipe / Stunning Strike damage, Hamstring & Binding Strike hit riders, Charge's strike rider, Quick Strike | movement distance, slow/root/stun durations, Snipe's reach, Frenzy's duration, Expose Weakness's vulnerability |
| `guard.potency-pct` / `guard.duration-pct` | Brace and Endure DR + duration | Cleanse counts, Break Free's discrete removal, Recovery skills |
| `defense.recovery-skill-potency` | Second Wind, Recuperate (the `recovery` tag) | passive Recovery access, Barrier, Absorb, Cleanse, mitigation Guards |

---

### Why `self-cast` exists
`cast` and `instant` each get a self-buff wind-up half wrong. A `cast` resolves against a
monster and **aborts when that monster dies or drifts out of reach** — correct for a
strike, absurd for buffing your own hands. An `instant` has no wind-up at all, and
`validateAbilities()` rightly refuses `castMs` on one. `self-cast` is the third thing: a
real, hard-CC-interruptible telegraph with nothing to lose. It shares `isCastingAbility`
(and therefore the single offensive channel, the cast bar, and the pay-on-resolve
cooldown rule) with an **empty `targetId`** standing for "no target". The lifecycle
branches on shape rather than on `targetId` being blank, so a future targeted shape that
forgets to set it cannot silently skip target validation.

---

## Roster — 21 abilities, 14 Techniques + 7 Guards

The count imbalance is deliberate: later progression grants the second Technique slot before
the second Guard slot, and the Technique space naturally has more positional/control/offensive
variants. **The Clearing deliberately teaches basic combat and equipment only** — the ability
system begins in Tier 1.

Each ability is its biome's "answer tool", placed **mid-band** so the player meets the
challenge before earning the response. A biome owning two abilities staggers them at level 3
and level 5 of its own native band.

### T1 — the fundamentals (3 Techniques + 3 Guards)
Teaches the whole decision space before adding a new verb: distribute damage / amplify damage
/ deal burst, and prevent / recover / remove.

| Ability | Slot / shape | Biome (level) | Job |
|---|---|---|---|
| **Sweep** | Technique / armed | Plains (3) | Next attack cleaves — the density answer |
| **Expose Weakness** | Technique / armed | Cave (3) | Elite damage amplification |
| **Power Strike** | Technique / **cast** | Mountain (5) | The reference all-damage cast |
| **Second Wind** | Guard / instant | Forest (3) | Strong/short Recovery access |
| **Cleanse** | Guard / instant | Swamp (3) | Discrete affliction removal |
| **Brace** | Guard / instant | Mountain (3) | Burst mitigation + knockback footing |

### T2 — positioning, soft control, sustained mitigation

| Ability | Slot / shape | Biome (level) | Job |
|---|---|---|---|
| **Hamstring** | Technique / armed | Jungle (3) | Slow — rung one of the ladder |
| **Charge** | Technique / charge | Desert (3) | Gap-closer with real extended reach |
| **Bramble Guard** | Guard / instant | Jungle (5) | Temporary plating + flat thorns |
| **Endure** | Guard / instant | Desert (5) | Sustained mitigation (Brace's opposite) |

### T3 — tempo and hard movement/control counterplay

| Ability | Slot / shape | Biome (level) | Job |
|---|---|---|---|
| **Binding Strike** | Technique / armed | Tundra (3) | Root — rung two |
| **Frenzy** | Technique / **instant** | Volcanic (3) | Attack speed, and nothing else |
| **Quick Strike** | Technique / armed | Volcanic (5) | The spam-technique archetype |
| **Contagion** | Technique / **cast** | Swamp (15) | Copy afflictions outward — the DoT breadth answer |
| **Detonate** | Technique / **cast** | Swamp (17) | Cash afflictions in now, with a cut |
| **Break Free** | Guard / instant | Tundra (5) | Hard-CC counter, fires while held |

### T4 — advanced range, escape, hard CC, long sustain
Only rank I is authored: these debut at the end of the supplied biome map.

| Ability | Slot / shape | Biome (level) | Job |
|---|---|---|---|
| **Disengage** | Technique / reposition | Trench (3) | Create distance |
| **Snipe** | Technique / **cast** | Graveyard (3) | Long-range deliberate strike (+300px) |
| **Stunning Strike** | Technique / **cast** | Graveyard (5) | Stun — rung three |
| **Imbue Lightning** | Technique / **self-cast** | Jungle (15) | A window spent in HITS, not seconds |
| **Recuperate** | Guard / instant | Trench (5) | Weak/long Recovery access |

### The affliction toolkit — `abilityAffliction.ts`
Contagion and Detonate act on damage-over-time the player **already owns**. Neither knows
what a "poison" or a "reservoir" is: both read the **DoT inventory**
(`server/src/systems/combat/damage/dotInventory.ts`, see
`dot-systems-current-state.md`), which is the single seam that enumerates every DoT family.
A future T4 DoT path registers one family and picks up both abilities — and the rune
condition — for free.

- **Contagion COPIES** at full strength: full stacks, full reservoir pool, original target
  keeps its own. `maxTargets` is therefore the only bound on the multiplication and is the
  number to tune; the radius only makes the cap easier to fill. Victims are chosen
  **nearest-first**, so the same cast is repeatable and can be aimed by positioning.
- A copy **can never weaken** what the receiver already had: each axis takes the better of
  the two. `applyStatusEffect` INCREMENTS an existing stack as a side effect of returning
  it, so the merge reads the stack count captured **before** the call — reading
  `applied.stacks` instead hands out a free stack to everything Contagion touches (caught
  by `abilityAffliction.test.ts`).
- **Detonate CONSUMES** every detonatable DoT and pays out what they still owed ×
  `detonateMult`, single-target. Effects are stripped **before** the damage lands: if the
  burst kills, the monster is removed inside `applyPlayerAoe`, and spent effects left on a
  corpse could be billed twice on the way out.
- Both are **ownership-scoped by `sourceId`** — you act on your own damage over time and
  nobody else's.
- Both **decline before the wind-up** when there is nothing to act on
  (`afflictionTechniqueHasWork`), the same rule that stops Break Free firing while
  uncontrolled. Detonate's 15 s cooldown is what makes this the difference between an
  ability and a trap.
- A **permanent** DoT (Permafrost) owes unbounded damage, so "the rest of its duration" is
  not a number. The inventory projects a bounded window for it instead — long enough that
  detonating a ramped Permafrost is worth doing, short enough that never ending cannot
  out-earn a timed DoT.

### Imbue Lightning — `abilityImbue.ts`
A window spent in **charges, not seconds** (`remainingMs: -1`; `data.charges` counts down
on each landed hit). Every other offensive window in the game races a clock, which quietly
pays the most to whoever was already attacking fastest; a charge window pays every build
the same. **One charge per landed hit**, which for a Reload magazine means one per bullet —
consistent with how the `onHitDamage` stat already behaves per shot. A chaotic-weapon whiff
does not spend a charge. The bonus is added on `onHit`, so it passes through the target's
plating/DR like any other damage rather than being unmitigated true damage. It rides
`TracksCombat`, which is never persisted, so it evaporates on death and logout with no
teardown.

### Bramble Guard — `abilityBramble.ts`
Plating folds into `mitigatesDamage.plating` per tick from the status effect (same pattern as
reactive plating) and unwinds exactly once. Reflect is **flat, never a fraction of damage
taken** — a percentage would scale with incoming damage and turn "get hit harder" into "deal
more damage", the exact offence/defence leak the design forbids. It fires on `afterHit` (a
resolved hit), skips DoT ticks, and is unmitigated.

---

## Rune layer

Each ability slot index has its own single-claim channel: `TECHNIQUE`, `TECHNIQUE_2`,
`GUARD`, `GUARD_2` (+ `STANCE`, `CONTROL`). Actions `fire-technique[-2]` / `fire-guard[-2]`,
all in `STARTER_RUNE_IDS` — the override is a timing preference for an ability you already had
to unlock. The `-2` actions are inert until the tier grants that slot.

Conditions available to ability channels: `in-combat`, `hp-below-25`, `has-debuff`,
`n-aggro-3`, `target-casting`, `before-empowered`, and `target-elite`.

## Protocol + client

- `ability:craftRecipe`, `ability:setLoadout`, `ability:craftResult`.
  **`ability:setLoadout` carries the WHOLE loadout** — equip, clear and re-prioritise are one
  intent, and the server validates learned / slot-type / slot-count / duplicates, rejecting
  the whole request rather than silently dropping entries.
- Node events: `player-guard`, `player-technique-armed`, **`player-reposition`** (carries both
  endpoints — a dash is an instant server-side move, and without the old position the sprite
  just blinks), `player-cast-start`, `player-cast-end` (carries `targetPos` when it fired).
- **Abilities panel** renders one row per unlocked slot, shows each ability's rank numeral,
  says when it next deepens, labels slot 2+ with its priority meaning, and explains rather
  than hides an ability already used in another slot.
- **Ability bar** renders every equipped ability with its rank numeral. Fired/cooldown
  timestamps are keyed by **ability id** so the right tile pulses; a casting tile shows a
  *filling* sweep.
- Admin `CharactersTab` lists both loadout lists.

### FX — one bespoke module per ability
`client/src/fx/`, dispatched from `render/combatFx.ts` through four tables:
`GUARD_FX_BY_ABILITY`, `TECHNIQUE_SELF_FX_BY_ABILITY` (Frenzy — a Technique with no target to
draw on), `CAST_FX_BY_ABILITY`, `REPOSITION_FX_BY_ABILITY`, plus the on-hit rider tags in the
`player-hit` effects loop.

The visual language carries the mechanics, so abilities that are easy to confuse read
differently at a glance:
- **Brace** snaps up cold and blue; **Endure** eases in warm and low — strong/brief vs
  modest/long.
- **Binding Strike** plays at ground level (movement only); **Stunning Strike** plays at the
  head with circling stars (actions too).
- **Hamstring** cuts low across the legs, never at chest height.
- **Charge** is a hot forward trail ending in a braced landing; **Disengage** is its cold
  mirror, emphasising the space left behind.
- **Snipe** draws the whole distance it crossed — the length of that tracer *is* the ability.
- **Quick Strike** is deliberately the quietest FX in the set; at a 2.5 s cooldown a Sweep-
  sized flourish would bury every other cue on screen.
- **Contagion** draws one *sinuous* tendril per (victim × element), tinted from the shared
  `ELEMENT_STYLE` palette — spread a burn and a poison and you see an orange line and a
  green line reach each new host. Curved, not straight: a straight line reads as a
  projectile (something fired), a wavering one reads as something spreading.
- **Detonate** is the loud sibling — white core flash, element-tinted body, shock ring and
  radial shards, with no lingering field, because the afflictions are GONE and the visual
  has to say so. Its tint is the element that was owed the most damage, resolved
  server-side, so it tells the player which DoT source actually mattered.
- **Imbue Lightning** has two separate cues, because it has two moments: a loud arrival on
  the cast, and a much quieter per-hit crackle on the ATTACKER as each charge is spent (up
  to five in quick succession — at cast volume it would bury everything else). There is
  deliberately **no timed aura**: the window is spent in hits, so a fading ring would lie
  about how long it lasts.

### Two new node events
`dot-spread` (source point + one link per victim × element) and `dot-detonate` (impact
point + dominant element). Both are needed because the copies and the consumed effects are
**status effects — server-only state that is never networked**, so the client cannot
reconstruct any of it from the delta. `player-technique-armed` also gained an optional
`durationMs`, carried only by a window-opening instant Technique (Frenzy).

---

## Verified

`pnpm typecheck` clean (4 packages + bench); `pnpm build` clean; `pnpm test` **141/141**.
Ability coverage: `abilities`, `abilityRanks`, `abilityControl`, `abilityGuardsAndReach`,
`abilityMultiSlot`, `abilityCast`, `abilityCharge`, `abilityBramble`, `abilitySecondWind`,
`abilityTechniqueRune`, `abilityTelegraphEvents`, **`abilityAffliction`**, `describeText`.

`abilityAffliction.test.ts` was mutation-checked: reverting the stack-merge fix, the target
cap, Detonate's consume step, the situational guard, the reservoir `stackCap: 0` rule, and
Imbue's charge decrement each fail the suite.

---

## Frenzy — measured, and the finding is an AUTHORING one

Reported as "does not grant attack speed, and has no animation". Both halves were
investigated by ticking a real `World` rather than by reading the code.

**The attack-speed mechanism is correct.** Forcing a +100% window took the player from 8 to
14 swings over the same 20 s — the buff applies, the cadence gate at `combat.ts` reads it,
and `updateAbilityFiring` fires it unprompted in the real tick loop.

**But at the authored numbers it is close to a no-op for slow builds.** Attack speed is a
RATE multiplier, and a 4-second window rounds a rate increase down to zero whole swings
unless you already attack fast:

| Frenzy rank | base swing 3000 ms | 2000 ms | 1500 ms | 1000 ms | 600 ms |
|---|---|---|---|---|---|
| **I (T3)** — +30%, 4 s | **+0 attacks** | **+0** | +1 | +1 | +2 |
| **II (T4)** — +35%, 5 s | +1 | +1 | +1 | +1 | +3 |

End-to-end with the authored rank I, a 3000 ms swing timer measured **20 attacks without
Frenzy and 22 with** over 60 s — about +10%, which is 40% uptime × 30% haste, exactly as
authored and essentially imperceptible in play.

**This is a balance number, which is the designer's to set, so it has NOT been changed.**
The structural observation is that Frenzy I's window is shorter than the thing it
accelerates; lengthening the window buys far more than raising the percentage does
(rank II already gets to +1 at every swing speed purely by being 5 s instead of 4 s).

### The stat sheet never moved — fixed

The other half of "it doesn't grant attack speed" was that **nothing on screen said it
did**. The Attack Speed row computed APS straight from `attackCooldown`, the stat every
temporary modifier deliberately avoids writing — so it displayed base cadence forever.

This was never Frenzy-specific. The same cadence gate applies **frost ramp**, the
**ambient node ramp (Tundra Chill)**, **Reaper momentum** and **Powering Up's released
charge**, and none of them showed either. Being chilled looked identical to not being
chilled.

The maths now lives in one place, `server/src/systems/combat/engine/attackCadence.ts`, read
by BOTH the gate and a per-tick HUD mirror, so a modifier cannot reach one without reaching
the other:
- `attackCadenceMult(cs)` — slow multiplier × haste multiplier. Below 1 is faster.
- Mirrored onto `HasStatus.attackCadenceMult` in `mirrorHpForecast` (the established
  precedent for a derived display value), projected on `PlayerView`, and shown as
  `2.10 APS (0.48s) +30% · base 1.61`.
- Base is shown alongside so a buffed number reads as *temporary* rather than as a
  permanently changed stat, and the percentage tag only appears when something is actually
  active.

**The animation half is fixed too.** `fxFrenzy` was firing correctly and was simply too small
and too brief to notice — a ~320 ms burst standing in for a four-second buff. It now lands
harder (12 streaks reaching 58 px, a shock ring, three flares) **and** sustains an aura that
rides the sprite for the buff's real duration and fades over its last third, so "am I still
frenzied?" is answerable in-world instead of only from the buff bar. The duration reaches
the client on `player-technique-armed.durationMs`, since the client cannot resolve an
authored rank itself.

## Known gaps

- **Frenzy's window length is an open balance call** — see the measurement above. The
  ability works, is now visible both in-world and on the stat sheet, and is still authored
  too small to feel at slow attack speeds. That last part is a number, not a bug.
- **Icons for thirteen abilities are drafted but not generated.** Contagion, Detonate and
  Imbue Lightning were added to `art/manifests/ability-icons.json` as `status: "draft"`
  prompts (nothing generated, no credits spent) and render the placeholder glyph until
  generated and accepted in the gallery. The new `target-max-stacks` rune condition
  temporarily aliases to the `has-debuff` crest.
- **Icons for ten earlier abilities are drafted but not generated.** `art/manifests/ability-icons.json`
  carries `status: "draft"` prompts for power-strike, hamstring, endure, binding-strike,
  break-free, frenzy, quick-strike, disengage, recuperate, snipe and stunning-strike; they are
  not in the approved allowlist, so those abilities render the placeholder glyph until art is
  generated and accepted in the gallery. Power Strike temporarily borrows the Charged Strike
  art through `ABILITY_ICON_ALIASES` (same ability, re-homed a tier earlier).
- Ability **evolution presentation** (`lineageId` grouping in the panel) is not built — the
  field exists and Sweep carries `lineageId: "sweep"`, but nothing consumes it yet.
- **T5+ ranks are not authored.** Every ability clamps at its last rank; the design rule is
  one bespoke authored upgrade per tier, never a resumption of percentage growth.
- **Disengage's trigger needs a balance call.** `enemy-within: 90px` is an ABSOLUTE gap, so for a
  melee build (attack range 12px) it is true whenever they are fighting at all — the ability would
  fire every 8s and push them out of their own reach. Ranged builds read it correctly. The two
  obvious fixes are making the threshold relative to the player's own reach (the way
  `target-beyond-reach` already is) or gating it on incoming pressure; both are design calls, so the
  authored seed was left as written.
- All numbers are first-pass seeds.
