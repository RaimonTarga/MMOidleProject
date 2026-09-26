# Abilities — Current State

Living truth for the active **Ability** system (Technique / Guard). Design authority is
`design_docs/ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md`; the superseded plans live in
`docs/archive/abilities-plan.md`, `docs/archive/abilities-evolution-implementation-plan.md`
and `design_docs/archive/abilities-evolution-plan-updated.md`.

**Shipped:** the full **T1–T4 roster of 22 abilities** on authored per-tier ranks, the
control ladder (slow / root / stun), ability **engagement range**, the **affliction
toolkit** (Contagion / Detonate, reading the shared DoT inventory), the **charge-based
window** (Imbue Lightning, on the new `self-cast` shape), **Sweep Tempo** (T2+, on the
shared attack-equivalent seam), **Slam** (the T2 area counterpart to Power Strike), and
bespoke in-world FX for every ability.

> **Name collision (kept distinct).** The passive talent tree (`UsesSkills`, `skillTree/`) is
> class progression and is **untouched**. "Abilities" is the active system (Technique / Guard).

**All numbers are FIRST-PASS SEEDS** — the balance pass owns the values. They express
relative roles; changing them is expected, and should preserve each ability's role.

---

## Active build state

See [Runic attunement](runic-attunement-current-state.md) for the current budget, migration, validation and UI contract. `knownAbilities` records permanent learning. `attunedAbilities: AttunedAbilities` holds ordered Technique and Guard lists. There is no tier or family count cap; each ability reserves its authored RP cost independently of rank. Global Mastery controls capacity.

Legacy singular/array loadouts and slot-indexed Rune rules migrate through `attunementMigration.ts`, preserving real targets and learned progression. Over-budget saves remain active and visible until the player reduces their reservation.

## Progression is AUTHORED, not scaled

`scalePerTierPct` is **gone**. Every ability owns one authored `AbilityRank` per player tier
from its home tier onward:

```ts
rank = clamp(playerTier - homeTier + 1, 1, ranks.length)
```

A rank authors the whole picture — `effect`, `cooldownMs`, `castMs`, `rangeBonus` — so a rank
may deepen a completely different axis from the one before it. That is the point: **once a
mechanic reaches its natural ceiling, the next rank deepens something else.** Sweep reaches
100% splash at rank III and buys **frequency** from rank II onward instead of inventing 120%
splash — as Tempo rather than as a shorter authored cooldown, see below; Brace's DR stops at
45% and rank IV buys duration; Cleanse's stack/affliction counts are discrete and never run
through a percentage multiplier.

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
  beyond normal reach, closes, and lands the empowered blow. Its gap gate
  (`CHARGE_MIN_GAP_PX`, 70px) stops it auto-firing at something already in contact. It is no longer an instant
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
- **Abilities have no built-in trigger.** An ability auto-fires only while a `use-ability`
  Rune rule naming it (`targetAbilityId`) is active; active targets arbitrate in Rune order.
  With no rule it is manual-only (hotbar).

### Wiring and pricing
Each `attunementCost` is priced **net of its reference wiring** (`shared/src/abilityWiring.ts`,
`referenceAbilityRule`): ability + that rule reserves exactly what the ability alone cost when it
had a built-in trigger. The Abilities panel lists the rules that fire each ability; an attuned,
unwired ability offers a "Use default timing" button that equips this rule. `abilityWiring.test.ts` pins the arithmetic.

| Reference wiring | RP | Abilities |
| --- | --- | --- |
| In Combat → Use Ability | 2 | every Technique except Charge and Disengage; Second Wind, Brace, Endure, Recuperate (fire off cooldown — a default, not their old 50–70% thresholds) |
| When Debuffed → Use Ability | 2 | Cleanse |
| Surrounded → Use Ability | 3 | Bramble Guard |
| When Controlled → Use Ability | 2 | Break Free |
| Enemy in Contact → Use Ability | 2 | Disengage |
| Always → Use Ability | 1 | Charge (its gap gate makes it charge the next enemy once one is in charge range) |

**Execution gates** (not triggers — they apply to automatic firing whatever rule fires it):
Charge needs a target at least `CHARGE_MIN_GAP_PX` (70px) beyond contact; Break Free needs hard
control or a root (`abilityActsWhileControlled` lets it execute while stunned); Cleanse needs a cleanseable
debuff; a Recovery Guard needs missing HP. Disengage has no gate — `Enemy in Contact` decides when.

Benches (`resolveSurveyPackage`, `canonicalLoadout`) and the bot (`applyBuild`) append reference
wiring for any attuned ability a package does not wire itself (`withReferenceAbilityWiring`), after
the explicit rules — the arbitration order the retired defaults had.

### Summoner ability ownership

**Champion** (`summoner-heavy-t3-b`, Tier 3, `battle-bond`) is the direct-attacking
exception: targeted casts use the owner's body/range, armed Techniques are held
for the owner's next hit, and Charge moves the owner. The bonded summon cannot
consume an owner-armed Technique. The following formation rules apply to the
other Summoner paths; self-buffs and Guards remain owner-cast on every path.

- **Sweep, Expose Weakness, Hamstring, Binding Strike, Quick Strike:** the owner
  arms one formation Technique; snapshotted summons deliver it through their hits.
  Damage riders share one normalized budget rather than multiplying by body count.
- **Power Strike, Slam, Snipe, Stunning Strike, Contagion, Detonate:** prefer one
  living engaged summon in slot order. That physical summon holds position and
  basic attacks during the wind-up; other summons continue attacking. Its range
  plus the ability's range bonus determines reach. The cast delivers one full
  payload using owner stats, with owner cooldown/control rules. Death, removal,
  hard control, range/node/leash loss, or a formation move command aborts without
  cooldown; replacements cannot inherit the cast. With no eligible summon, normal
  owner targeting remains available. Contagion/Detonate still require owned DoTs
  (and Contagion a recipient). Cast events identify the physical summon for FX.
- **Frenzy:** the summoner owns the buff. Minion attack timing reads the owner's
  temporary haste bonus, so the haste actually affects the formation;
  the stored base cooldown is never mutated.
- **Imbue Lightning:** the summoner performs the self-cast and owns the shared
  charge window. Summon hits consume it; summons do not cast the buff individually.
  Each physical hit deliberately spends one whole charge while damage remains
  formation-weighted. The smaller burst on large formations is accepted; there
  is no fractional-charge adapter or extra per-summon charge pool.
- **Second Wind, Recuperate, Brace, Endure, Cleanse, Break Free, Bramble Guard:**
  summoner-owned defenses, fired by Rune conditions on the owner's health, debuffs,
  hard control, or incoming aggro. They do not heal, cleanse, or shield each summon.
- **Disengage:** moves the summoner away from a threat (fired by `Enemy in Contact`
  by default); target selection covers that distance even for a short-range
  owner.
- **Charge:** the summoner winds up one command, then eligible living summons
  rush toward the selected target while the owner stays in place. Each physical
  summon delivers its share of one formation-wide empowered rider on arrival.
  Rush movement uses the authored speed/duration, ordinary collision, and the
  formation leash. Dead, controlled, out-of-reach, or replaced bodies cannot
  transfer unpaid shares; target loss, move commands, timeout, and owner death
  cancel unfinished rushes. Champion retains the ordinary owner Charge instead.

## Execution shapes

| Shape | Mechanism | Worked by |
|---|---|---|
| `armed` | attaches `hasArmedAbility`; rider lands in `abilityEffects.ts` on the next hit | Sweep, Expose Weakness, Hamstring, Binding Strike, Quick Strike |
| `cast` | attaches `isCastingAbility`; see below | Power Strike, Slam, Snipe, Stunning Strike |
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

`monsterControl.ts` is the **single writer for a monster's slowed speed**. Chill and Freeze can
slow both movement and attack cadence; an ability slow affects movement only. Before this
reconciler, the sources overwrote `hasPosition.speed` and `performsAttack.attackCooldown` with
absolute values read back from `MONSTER_DATABASE`; two independent writers each treating the
other's output as "the clean base" ratcheted against each other every tick. Every source
registers here and `updateMonsterSlows` applies the **strongest of each axis** once per tick
(never the sum — summing a chill onto a Hamstring would pin the target, and pinned is *root*,
a different rung with a different cost), restoring the database values when no source remains.
`updateChillAndFreeze` was reduced to marker lifecycle only.

Root uses `isRooted` plus an ownership flag, so an expiring 1.5 s Binding Strike can never
clear a root a boss script installed. Stun goes through the existing `applyStun`, so post-stun
immunity keeps chain-locking off the table.

**Player-side hard control** is one list: `combat/status/playerHardControl.ts`. It defines what
breaks a cast, what satisfies Break Free's gate, and what Break Free removes. Cleanse
deliberately does **not** answer it. The same file lists status-owned **roots**
(`PLAYER_ROOT_EFFECTS`, today the lair drag's speed-0 root); `isPlayerControlled` (hard control,
`isRooted`, or a root effect) is what `When Controlled` means. One Break Free activation removes the
worst hard control **and** every root, and removing the lair-drag root ends the drag.

---

## Guard buffs are explicit, with stable ability identities

Guard boons go through the buff system (icon + timer in the buff bar), not raw shields.
Brace and Endure retain the DR effect IDs `ability-guard` and `ability-guard-2`.
Second Wind and Recuperate retain `ability-second-wind` and `ability-second-wind-2`.
These IDs belong to the authored abilities, independent of attunement order.

**Simultaneous Guard mitigation**:
the `onDamageTaken` reader combines active effects **multiplicatively** — each is a separate
reduction of what got through — capped at `GUARD_DR_CAP` 0.9. Additive stacking would hit the
cap far too easily and make a second Guard strictly the best defensive pairing. Knockback
resist takes the **best** active effect rather than stacking.

**Recovery sources also follow ability identity** (`skill` for Second Wind and `skill-2`
for Recuperate in the Recovery engine). Second Wind (strong/short) and Recuperate
(weak/long) are deliberate opposites and may be attuned
together; sharing one source would let the stronger fraction ride the longer window — strictly
better than either ability as authored.

---

## Technique itemization — `TECHNIQUE_KEYS`

The offensive sibling of `GUARD_KEYS`, riding the existing equipment
`mechanicEffects → usesSkills.passives` pipeline (no new state, slice, or migration):
- `technique.power-pct` — scales opted-in offensive payloads only
- `technique.cooldown-reduction-pct` (capped 0.9)
- `technique.cast-speed-pct` (capped 0.6)

Carried by **weapons**; Guard potency comes from Mountain armor. The budgets are
deliberately not interchangeable.

## Scaling / potency rules

| Stat | Touches | Never touches |
|---|---|---|
| Technique Power | Sweep splash, Power Strike / Slam / Snipe / Stunning Strike damage, Hamstring & Binding Strike hit riders, Charge's strike rider, Quick Strike | movement distance, slow/root/stun durations, Snipe's reach, Frenzy's duration, Expose Weakness's vulnerability |
| `guard.potency-pct` / `guard.duration-pct` | Mitigation Guards: Brace/Endure DR and resistance, Bramble plating/reflect, plus buff duration | Cleanse counts, Break Free's discrete removal, Recovery skills |
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

## Roster — 22 abilities, 15 Techniques + 7 Guards

The roster offers different offensive, positional, control and defensive roles. RP prices express opportunity cost.

Each ability is its biome's "answer tool", placed **mid-band** so the player meets the
challenge before earning the response. A biome owning two abilities staggers them at level 3
and level 5 of its own native band.

### T1 — the fundamentals (3 Techniques + 3 Guards)
Teaches the whole decision space before adding a new verb: distribute damage / amplify damage
/ deal burst, and prevent / recover / remove.

| Ability | Slot / shape | Biome (level) | Job |
|---|---|---|---|
| **Sweep** | Technique / armed | Plains (2) | Next attack cleaves — the density answer (Tempo from rank II) |
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
| **Contagion** | Technique / **cast** | Swamp (9) | Copy afflictions outward — the DoT breadth answer |
| **Slam** | Technique / **cast** | Mountain (9) | Power Strike's area counterpart — half the multiple, to everything nearby |
| **Bramble Guard** | Guard / instant | Jungle (5) | Temporary plating + flat thorns |
| **Endure** | Guard / instant | Desert (5) | Sustained mitigation (Brace's opposite) |

### T3 — tempo and hard movement/control counterplay

| Ability | Slot / shape | Biome (level) | Job |
|---|---|---|---|
| **Binding Strike** | Technique / armed | Tundra (3) | Root — rung two |
| **Frenzy** | Technique / **instant** | Volcanic (3) | Attack speed, and nothing else |
| **Quick Strike** | Technique / armed | Volcanic (5) | The spam-technique archetype |
| **Detonate** | Technique / **cast** | Swamp (17) | Cash afflictions in now, with a cut |
| **Break Free** | Guard / instant | Tundra (5) | Hard-CC and root counter, fires while held |

### T4 — advanced range, escape, hard CC, long sustain
Only rank I is authored: these debut at the end of the supplied biome map.

| Ability | Slot / shape | Biome (level) | Job |
|---|---|---|---|
| **Disengage** | Technique / reposition | Trench (3) | Create distance |
| **Snipe** | Technique / **cast** | Graveyard (3) | Long-range deliberate strike (+300px) |
| **Stunning Strike** | Technique / **cast** | Graveyard (5) | Stun — rung three |
| **Imbue Lightning** | Technique / **self-cast** | Jungle (15) | A window spent in HITS, not seconds |
| **Recuperate** | Guard / instant | Trench (5) | Weak/long Recovery access |

### Sweep Tempo, and the attack-equivalent seam (2026-09-15)

From **rank II** (player tier 2) Sweep's authored cleave carries `tempoRefundMs: 1000`, and
its base cooldown moves from 6 s to **7 s**. Every accumulated **attack-equivalent** of
ordinary basic-attack delivery takes 1000 ms off Sweep's *remaining* cooldown. Rank I is
deliberately untouched — 60 % splash, 90 px, 6 s, no Tempo — because rank I is the rank that
teaches "arm, then hit", and a second mechanic on top would blur the lesson.

**Why Tempo and not a shorter cooldown.** A flat cut pays every build the same, which is
backwards for a swarm answer: the builds that most need Sweep are the slow, heavy ones that
land the fewest attacks between activations. Tempo pays per landed attack, so a 2 s-swing
bruiser roughly keeps the old ~6 s cadence while a fast build genuinely earns more
activations.

**The minimum cycle.** `TECHNIQUE_TEMPO_MIN_CYCLE_MS = 3000` (shared). Sweep can never
become ready sooner than 3 s after its previous *activation*, no matter how many attacks
land. Implemented as a second, ordinary cooldown key (`ability.tempo.floor.<id>`) that ticks
down with real time and that Tempo never touches — so it is an honest record of time since
the activation rather than a wall-clock timestamp. It is capped to the already-reduced
cooldown, so it can never *lengthen* a cooldown that equipment shortened past it. Ordinary
`technique.cooldown-reduction-pct` applies first, as always; Tempo then works on what is
left.

**Attack-equivalents** (`server/src/systems/player/abilities/attackTempo.ts`) are the shared
normalization seam, deliberately generic rather than Sweep's: any ability authoring
`tempoRefundMs` picks it up with no server change. One qualifying landed basic attack is
worth exactly **1.0**, and every multi-body, multi-projectile or continuous delivery is
normalized back down to its share of one:

| Delivery | Contribution | Why |
|---|---|---|
| Ordinary player attack | 1.0 | The reference |
| Empowered attack | 1.0 | A multiplier changes how hard you hit, not how often you swung |
| Slinger ammo-backed shot | `1 / ammoMax` | One **nominal** magazine is one attack |
| Blunderbuss volley pellet | `1 / ammoMax` each | A full-clip volley is still one clip |
| Conduit formation body | slot `procWeight` over the **authored** formation total | One complete formation cycle is one attack |
| Bonded Conduit's own swing | same scale | Battle Bond's conduit is one more body |
| Laser / channelled-beam tick | its authored damage-per-tick fraction | A channel is not a discrete attack cycle |
| Chaotic dead swing | 0 | Delivers nothing — same rule that stops it spending ammo |

Most of the exclusion list is **free rather than filtered**: DoT ticks, Sweep's own splash,
Slam's and Power Strike's cast payloads, thorns/retaliation and secondary proc damage all
apply damage *without emitting an attack event at all* (they go through `applyPlayerAoe`,
the DoT tick systems, or direct HP writes), so none can reach the seam even in principle. A
single attack that splashes five monsters is still ONE event, so breadth never multiplies
Tempo either.

Two deliberate normalization calls:

- **Slinger uses `ammoMax`, never live ammo.** A tactical reload that dumps two rounds
  contributes 2/`ammoMax`, so firing deliberately tiny clips can never promote each bullet
  to a larger share of an attack. The fractional remainder carries across clips and across
  activations, so a part-finished magazine is never silently discarded.
- **Conduit normalizes over the AUTHORED formation, not the living one.** More bodies means
  more events each worth proportionally less, so a relic-expanded army earns exactly the
  same Tempo per cycle as a 2-body Colossus formation. A formation fighting bodies down
  simply never delivers the missing shares — the survivors are *not* scaled up to cover for
  the dead. This is why Tempo reads raw `slot.procWeight` through `formationTempoWeight()`
  rather than `FormationAttackContribution.procWeight`: that number carries the formation's
  damage/secondary-effect coefficients, and Tempo equalizes logical **cadence**, not damage.

Registered on **`afterHit`** from `initCombatSystems()`: it runs only for attacks that
actually landed, and after the armed-Technique rider has resolved. The attack that
*delivers* Sweep counts toward the next Sweep for free — the cooldown it feeds started when
Sweep **armed**, so it is already running when the delivering blow connects.

**Known presentation gap.** The HUD cooldown ring is a client-side prediction from the arm
event times the *authored* cooldown (`AbilityBar.computeStatus`); it does not model Tempo.
Under auto-combat Sweep re-arms the tick it is ready, which restamps the ring, so it reads
as "came back early" rather than as a stall — but a manual player can see a still-sweeping
ring on a Sweep that is actually ready. Making it exact needs live remaining-ms on the wire.

### Slam — the area counterpart to Power Strike (2026-09-15)

A new T2 `cast` Technique, 6 RP, reusing the existing `cast-strike` effect and its
AoE-radius support. Ranks: **1.75x / 2.0x / 2.25x** Attack at 150 px, 10 s cooldown,
1.6 s wind-up, at player tiers 2 / 3 / 4.

The relationship with Power Strike is arithmetic and load-bearing: **Slam deals exactly half
Power Strike's multiplier per target at the same tier** (T2 1.75 vs 3.5, T3 2.0 vs 4.0, T4
2.25 vs 4.5). One target clearly favours Power Strike, two targets tie on raw Attack
multiple, three or more clearly favour Slam. That crossover must survive every later tier.

It favours heavy, slow builds **without ever asking about attack speed** — no inverse-speed
multiplier, no weapon tags, no cadence query. It scales from Attack, its wind-up ignores
attack cadence, and casting stops ordinary attacking, so the faster the build the more real
damage the 1.6 s commitment costs it. `technique.cast-speed-pct` still shortens the wind-up
through the ordinary seam; that is a separate, intended synergy.

Slam **does not** replace, consume, evolve or disable Power Strike — both stay learnable and
attunable at once, and only the RP budget makes them compete. Technique Power scales
`damageMult` and never `radius` (the same rule that keeps it off Snipe's reach), so the
radius is authored flat across all three ranks for this first pass.

**Acquisition: Mountain, biome level 9** — its T2 band's own level 3, the same placement rule
every other ability follows and the same level Contagion sits at in the swamp's T2 band. It
is a *theme* deviation of exactly the kind Contagion already makes: every other T2 ability
lives in jungle or desert, but Mountain is the game's wind-up biome — Brace (L3) teaches you
to READ a telegraph, Power Strike (L5) teaches you to PERFORM one — so the tier that widens
that blow into an area belongs there. Mountain has nodes at T1-T4, so nothing was re-homed
and no band was reshuffled. Cost 90 blue: the top of the T2 ability band (70-90), priced as
an optional power tool rather than as required counterplay.

**Presentation:** reuses `fxSlam` (the boss ground-slam) with the stone `impact` palette,
driven off `player-cast-end` like every other cast. It already speaks the game's "an area
just got hit" vocabulary — cracks, expanding shock rings, debris — and takes the kill radius
as an argument, so the ring lands exactly on the circle the server damaged (read from the
authored rank, never a client constant). **No icon art**: Slam is not in the concept-icon
set or the approved atlas allowlist, so it renders the placeholder glyph until art is
generated and accepted.

### Where the affliction pair lives — and why it breaks the biome pattern

Every other ability sits in a biome its OWN tier introduces (T2 abilities in jungle/desert,
T3 in tundra/volcanic, T4 in trench/graveyard). **Contagion (T2) and Detonate (T3) are
deliberate exceptions, homed in the swamp by THEME**: the swamp is the game's
attrition-by-damage-over-time biome and where the brand weapons live, so it is the one
place a player has both the afflictions to manipulate and a reason to want them
manipulated. Homing them in the tier's "correct" biome would be arbitrary. Imbue Lightning
(T4, jungle) and **Slam (T2, mountain)** are the same kind of deliberate exception — each
homed by theme in a biome that owns the idea rather than in the biome its tier introduces.
**Designer's call.**

The pair is split across TIERS rather than staggered inside one band: Contagion at swamp
level 9 (its T2 band), Detonate at level 17 (its T3 band). That is load-bearing — T2 grants
RP-based attunement; Contagion and Detonate compete with the rest of the active build for that budget.

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
  `detonateMult` (5.0x / 5.5x since 2026-09-26, 1.2s cast; it was 1.2x / 1.4x with a 2s cast and lost
  to Power Strike on every weapon), single-target. Effects are stripped **before** the damage lands: if the
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

**Its buff tile is a COUNTDOWN, not a clock.** `ability-imbue` projects
`durationPct: -1` (no timer — a clock would misrepresent a window spent in hits) and puts
the remaining attack count in `stacks`. Because that number counts DOWN, it needs
`PlayerBuff.showSingleStack`: the buff bar otherwise hides the badge at one stack, which
would blank the counter exactly one hit before the resource is actually gone. That flag is
generic rather than an id check, so the next charge-based effect gets it for free.

### Bramble Guard — `abilityBramble.ts`
Plating folds into `mitigatesDamage.plating` per tick from the status effect (same pattern as
reactive plating) and unwinds exactly once. Reflect is **flat, never a fraction of damage
taken** — a percentage would scale with incoming damage and turn "get hit harder" into "deal
more damage", the exact offence/defence leak the design forbids. It fires on `afterHit` (a
resolved hit), skips DoT ticks, and is unmitigated.

---

## Rune timing and client

The Rune board targets named attuned abilities. Rules cost only their logic; ability reservation is paid once. An ability with no active rule does not auto-fire. Ordinary Techniques retain a shared offensive opportunity; instant Techniques remain non-blocking. Guards retain their one-activation decision window.

The ability panel shows learned tools, RP prices and each ability's Rune timing (or that it is manual-only), with attune/unattune controls. The combat hotbar renders every attuned ability in a fixed-size tile with its rank, configurable number-key binding, cooldown/cast state, and click activation. `ability:use` carries only the requested ability id; `requestManualAbilityUse` validates the id and attunement, then enters the same cooldown, Technique/Guard arbitration, cast, targeting and effect path used by automatic/Rune firing. Manual enemy-facing abilities require the player's current combat target and never use automatic firing's nearest-target fallback. If a valid manual request is temporarily blocked (including by cooldown, missing target, control, channel ownership, or execution-gate conditions), the server keeps that ability in a networked one-shot queue and the hotbar shows a lit border. Pressing the queued ability again cancels it. Its first legal activation consumes the entry, so the resulting cooldown does not re-queue it; death clears the queue and loadout edits prune newly unattuned entries. Rejected combat-control messages render in the global toast layer rather than changing the hotbar stack's geometry. Rune ability activation runs only while Auto Combat is enabled or while Fight Back temporarily owns travel combat; manual hotbar requests and their queued intents remain available in either state and do not cancel an already-started cast/charge/armed Technique. `R` is a rebindable Slinger-only manual reload: the client ignores it for every other archetype, and the server revalidates that ownership before a partial magazine enters the existing reload timer and lifecycle hooks. Full magazines, active reloads and Laser heat are harmless no-ops. Server loadout edits validate the complete RP budget and return an acknowledgement; unattuning removes dependent rules.

**Hotbar tile states** (`client/src/hud/AbilityBar.tsx`, styles in `statusFeedback.css`). Each tile has one primary state, in priority order: *casting* (accent glow, filling sweep), *armed* (fast gold pulse plus an `ARMED` tag until the consuming hit lands — driven by `player-technique-armed` via `armedAbilityIdAtom`, never set for self-facing instants), *active* (a border ring in the slot accent that drains with the boon's remaining `durationPct`), *cooling* (desaturated, dark sweep, whole seconds), *ready*. The cooldown sweep is NOT suppressed while a Guard boon is active: the ring and the sweep are two clocks drawn together. A cooling → ready transition plays a one-shot glint. An armed Technique is never dimmed as "no target".

**Buff-bar feedback** (`BuffBar.tsx` + `buffTransitions.ts`), loudness tiered quietest first: tiles pop in and fade out; a boon gaining stacks gets a gentle glow; the high-impact stacking debuffs (`SURGE_DEBUFF_IDS`: Heat, Chill, Rot, Frost, Sundered, Corroded plating) surge hot on every gained stack and their resting glow deepens with the count; a cleansed debuff shatters (white flash, burst ring, shards); `CRITICAL_BUFF_IDS` (Marked, Stunned, Frozen) sort to the front at a larger size with a permanent bright halo. Cleanse vs expiry comes from the server: `player-cleansed` is emitted by the Cleanse guard, Break Free and the passive cleanse pulse only when a stack actually came off, and the client attributes it to debuff tiles that shrank or vanished within 700 ms of it (`server/test/cleanseEvent.test.ts`).

**Hotbar tile states** (`client/src/hud/AbilityBar.tsx`, styles in `statusFeedback.css`). Each tile has one primary state, in priority order: *casting* (accent glow, filling sweep), *armed* (fast gold pulse plus an `ARMED` tag until the consuming hit lands — driven by `player-technique-armed` via `armedAbilityIdAtom`, never set for self-facing instants), *active* (a border ring in the slot accent that drains with the boon's remaining `durationPct`), *cooling* (desaturated, dark sweep, whole seconds), *ready*. The cooldown sweep is NOT suppressed while a Guard boon is active: the ring and the sweep are two clocks drawn together. A cooling → ready transition plays a one-shot glint. An armed Technique is never dimmed as "no target".

**Buff-bar feedback** (`BuffBar.tsx` + `buffTransitions.ts`), loudness tiered quietest first: tiles pop in and fade out; a boon gaining stacks gets a gentle glow; the high-impact stacking debuffs (`SURGE_DEBUFF_IDS`: Heat, Chill, Rot, Frost, Sundered, Corroded plating) surge hot on every gained stack and their resting glow deepens with the count; a cleansed debuff shatters (white flash, burst ring, shards); `CRITICAL_BUFF_IDS` (Marked, Stunned, Frozen) sort to the front at a larger size with a permanent bright halo. Cleanse vs expiry comes from the server: `player-cleansed` is emitted by the Cleanse guard, Break Free and the passive cleanse pulse only when a stack actually came off, and the client attributes it to debuff tiles that shrank or vanished within 700 ms of it (`server/test/cleanseEvent.test.ts`).

**Status tooltips survive their status** (`client/src/hud/primitives/useStatusStrip.tsx`, used by the buff bar and the target frame). The strip, not each tile, owns hover inspection. While a card is open the strip's layout is frozen: tiles keep their slots, a status that ends stays in place as a greyed tile whose card switches to an ENDED / CLEANSED banner with its CURRENT block relabelled "Last known", and new statuses (critical ones included) join at the end. The card follows its tile, closes 200 ms after the pointer leaves (so crossing the gap between tiles moves it instead of blinking it), and the row reflows once it closes. The target frame also stays up while a card is open after its target is gone; a new target resets the strip.

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
- **Detonate** is the loud sibling, and it is shaped as a **sublimation**, not an
  explosion: the afflictions are pulled IN (converging element-coloured motes, ~160 ms),
  released as an element-coloured flash, thrown off as tapered shards, and what remains
  rises off the target as vapour. The mechanic is "the poison/burn/frost inside it left
  all at once", and that reading is the one shape that holds for all six elements — which
  is why there is no per-element silhouette (flames, icicles, sparks) anywhere in it.
  Its hue is the element that was owed the most damage, resolved server-side, so it tells
  the player which DoT source actually mattered.

  **The element tint was always sent but was not legible**, and the fix is worth recording
  because it generalises. Four things were eating it: a white core flash outranked every
  tinted layer; one flat hue at 0.7 alpha on a normal blend averages toward the terrain
  behind it; nothing moved, and hue reads far better on a travelling object than on a
  static wash; and every layer fired at t=0, so no phase was ever the colour's alone. So:
  **no white fill anywhere** (white survives only as thin line-work), every coloured layer
  draws three values of one hue via `elementShades` (OkLCh lightness shifts, not RGB
  scaling, which would desaturate), the first beat moves, and the beats are staged.

  Detonate **always reads as a crit**, unconditionally — it is the payoff of the whole
  affliction pair. That tell is the existing `empowered` vocabulary and is kept strictly
  off the element: a gold ring at `EMPOWERED_AOE_RADIUS` drawn OUTSIDE every element layer,
  the gold `!` damage number, and the shared `empowered` sfx. Because colour can only say
  one thing at a time, the number keeps both reads by moving the element to its glyph
  (`4820!☠`) while gold keeps the colour.
- **Detonate's wind-up** is drawn on the **target**, not the caster, for the whole 2 s
  cast: a tightening dashed ring plus inward-spiralling shards in the element's colour.
  The cast bar says "a player is doing something"; what matters is "that monster is about
  to lose everything on it". It TRACKS the target rather than being pinned to a point,
  because two seconds outlives any position snapshot — same state-keyed-by-id, redrawn
  per frame pattern the cast bar itself uses. Its element is resolved at cast START, so a
  DoT expiring mid-cast can make the release open in a different hue than it closed in;
  that is accepted, because a wind-up that is usually right reads far better than a grey
  one that is never wrong.
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

### Presentation fields the AoE seam needed
Detonate resolves through `applyPlayerAoe`, which emits a plain `damage` event — there is
no `player-hit` for it to hang presentation on, so its biggest number used to render as a
white number with no element and no crit styling. Three additive fields fix that, and any
future payload resolving through the same seam gets them free:

- `damage.empowered?` — crit STYLING only, never a damage layer. The same aesthetic-only
  use `fire.ts`, `snipeDamage.ts`, `cannon.ts` and `channeledBeam.ts` already make of it.
- `applyPlayerAoe(..., flavor)` — an optional `{ element, empowered }` bag forwarded to
  `pushDamageEvent`. Purely cosmetic; existing callers pass nothing and are unchanged.
- `player-cast-start.targetId?` / `.element?` — what a per-ability wind-up FX needs and
  cannot derive. Both optional, so an ability with nothing to say keeps the bare cast bar
  rather than being given a default that would be a lie.

---

## Verified

`pnpm typecheck` clean (4 packages + bench); `pnpm build` clean; `pnpm test` **179/179**.
Ability coverage: `abilities`, `abilityRanks`, `abilityControl`, `abilityGuardsAndReach`,
`abilityMultiSlot`, `abilityCast`, `abilityCharge`, `abilityBramble`, `abilitySecondWind`,
`abilityTechniqueRune`, `abilityTelegraphEvents`, **`abilityAffliction`**, `manualCombatControls`, `describeText`.

`abilityAffliction.test.ts` was mutation-checked: reverting the stack-merge fix, the target
cap, Detonate's consume step, the situational guard, the reservoir `stackCap: 0` rule,
Imbue's charge decrement, and Contagion's T2 rank rung each fail the suite. The Frenzy
assertions were mutation-checked the same way (dropping `durationMs` from the event, and
pinning the cadence mirror to 1).

### Tier numbering — 1-based, and it bites
`regionT1..T4` author `tier: 1..4`, and internal tier N introduces: **1** plains / forest /
cave / mountain / swamp · **2** jungle + desert · **3** volcanic + tundra · **4** graveyard
(wasteland) + trench. There is no 0-based internal numbering anywhere; `playerTier`,
`biomeTier`, `AbilityDef.tier` and `AbilityRecipe.tier` all use this scale. Identify a tier
by the biomes it introduces before moving anything between tiers.

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
  field exists and Sweep and Slam each carry their own self-named lineage, but nothing
  consumes it yet. Slam deliberately does NOT share Power Strike's grouping: nothing in the
  code treats a lineage as exclusive today, but filing them together would read as an
  evolution, and Slam replaces nothing.
- **Slam has no icon art.** It is in neither the concept-icon set
  (`client/public/assets/concept-icons/abilities/`) nor the approved atlas allowlist in
  `abilityIcons.ts`, so it renders the placeholder glyph. Deliberately not aliased to Power
  Strike's borrowed Charged Strike art — two abilities that must read as different choices
  must not share a tile. Needs an `art/manifests/ability-icons.json` draft entry.
- **The Slinger's Tempo is quantized to whole clips.** One nominal magazine is one
  attack-equivalent, so the refund only lands when a clip completes. In the synthetic run a
  6-round and a 10-round Slinger both settled at a ~5.9 s Sweep cycle because exactly one
  clip completed per cycle in each case; firing faster only helps when it changes the
  *integer* number of clips per cycle. Correct by construction, but it makes the Slinger
  markedly Tempo-poorer than a 1 s-swing melee build — a tuning call for the eHP pass.
- **T5+ ranks are not authored.** Every ability clamps at its last rank; the design rule is
  one bespoke authored upgrade per tier, never a resumption of percentage growth.
- **Disengage on melee builds.** Its default `Enemy in Contact` rule is true whenever a melee enemy
  is on you, which for a melee build is the whole fight — it will push them out of their own reach
  every 8s. That is now a visible wiring choice rather than a hidden trigger.
- All numbers are first-pass seeds.

## Ability tags and equipment modifiers (2026-09-13)

`abilityTags` / `abilityHasTag` in shared `data/abilityTags.ts` combine authored role tags
with Technique/Guard derived from family and Armed derived from execution shape.
Cast derives from wind-up execution shapes; AoE derives from area-bearing rank payloads.
Ability details in the loadout, HUD and Forge display the same labels and help.
Tags include Recovery, Mobility, Mitigation, Control, Cleanse and Offensive Buff.

As of 2026-09-21, these labels are compact colored pills, shared with equipment
details in Inventory and Forge. `data/abilityModifierInfo.ts` maps existing equipment
passives to their matching tags and checks the rank payload before advertising a
bonus. Ability details and hotbar tooltips list equipped item names, upgraded modifier
amounts, and inactive core range requirements. Amounts are contributions before caps;
the ability numbers still use the shared authoritative formulas. Inventory effect
descriptions also include earned upgrade steps through `itemMechanicEffectsAt`.
AoE and Armed remain descriptive tags without dedicated gear bonuses.

Desert charm now supplies `cleanse.cooldown-reduction-pct`: 15% / 20% / 25% at
T2 / T3 / T4, with each upgrade adding 1 / 1 / 1.5 percentage points respectively.
It shortens both Cleanse and Break Free (both already carry the Cleanse tag), adds
to family cooldown reduction under the existing 90% cap, and leaves removal counts
and Break Free's resistance window unchanged. The charm no longer supplies periodic
cleanse, empty-cleanse healing, or per-stack healing. Desert armor retains its
independent periodic cleanse. Recipe costs and flat Recovery are unchanged.

The equipment wiring regression fires Brace and Endure with upgraded Mountain armor,
and Second Wind and Recuperate with upgraded Forest charm. Mountain Guard potency
multiplies damage reduction and Brace's knockback resistance, capped at 90% per
magnitude; it does not alter durations. Forest Recovery skill potency multiplies the
activated Recovery fraction, not max HP or duration. Both share their live resolver
with ability tooltips. Desert tests equip every charm tier at +5, fire both cleansing
abilities, and check removal, shortened cooldowns, source feedback, exclusions and caps.

`systems/abilityModifiers.ts` owns equipment cooldown and Guard/Recovery magnitude
formulas for both authoritative firing and client previews. Bramble now receives
Guard potency on both plating and reflection, with integer rounding, and Guard duration.
Recovery potency affects only the Recovery-tagged heal effect's activated Recovery fraction.
Cleanse removal counts and control durations remain discrete/authored. Guard duration is
supported but has no current item source.

Scout cooldown reduction and Bruiser kill refunds use the Mobility tag. Bruiser refunds
an authored full-cooldown fraction, clamped at zero remaining time, and ignores unrelated
abilities. Core range eligibility still applies. Armed describes delivery; it does not
imply a new equipment bonus where no such bonus is authored.
`coreCombat.test.ts` additionally equips Bruiser and verifies Charge and Step Back
refunds with cooldown reduction, zero clamping, and published HUD cooldown samples.
`abilityEquipmentFeedback.test.ts` checks source attribution, inactive core feedback,
AoE classification, and exclusions for unsupported potency/cast modifiers.

Regression coverage: `server/test/equippedEvolutionAbilityTags.test.ts` exercises actual
equipment passives, fired Bramble and Recovery, mobility cooldown/refund routing, UI tag
agreement, and equipped evolution costs, slot retention and failure atomicity.
