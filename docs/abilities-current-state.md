# Abilities — Current State

Living truth for the active **Ability** system (Technique / Guard). Design authority is
`design_docs/ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md`; the superseded plans live in
`docs/archive/abilities-plan.md`, `docs/archive/abilities-evolution-implementation-plan.md`
and `design_docs/archive/abilities-evolution-plan-updated.md`.

**Shipped:** the full **T1–T4 roster of 19 abilities** (11 Techniques, 8 Guards) on
authored per-tier ranks, the control ladder (slow / root / stun), ability **engagement
range**, the **affliction toolkit** (Contagion / Detonate, reading the shared DoT
inventory), the **charge-based window** (Imbue Lightning, instant), **Sweep Tempo** (T2+, on
the shared attack-equivalent seam), **Slam** (the T1 burst cast that absorbed Power
Strike), and bespoke in-world FX for every ability except the two additions (Sidestep,
Cull), which wear placeholder tiles and the generic fx until art is generated.

**The ability pass (design §22.2, §22.8–§22.10; implemented 2026-10-06, W1-A of
`docs/briefs/ability-pass-run-2026-10-02.md`)** cut Expose Weakness, Power Strike,
Hamstring, Frenzy and Quick Strike (each one's job moved to a lane payoff; Power Strike
merged into Slam), re-homed Slam (T1 Mountain 5), Charge (T1 Cave 3), Binding Strike (T2
Jungle 3), Snipe (T2 Desert 3) and Imbue Lightning (T3 Volcanic 3), made Contagion
**armed** and Imbue Lightning **instant** (§22.9: a cast iff the ability deals its own
damage), and added **Sidestep** (T1 Forest 5, the Avoid Guard) and **Cull** (T3 Tundra 3,
the kill-shaped cast). Each ability also has four node rows, 18 of the 19 first keystone
verbs are live, the §22.10 fire-shapes are live, and five T3 paths were re-homed (W1-B/D/E/F,
W2-A/B/E). **Implemented on `feat/ability-pass`, NOT merged to develop.** See "The ability
pass" below for saves, the tutorial kit, the Slam parity number, the keystone table and the
fire-shape table.

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
durations, dash distances, Snipe's reach and Cull's threshold are absent by
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
  no range bonus (Slam, Stunning Strike, Cull) still walk with the fight.

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
  An **`instant` Technique (Imbue Lightning) claims nothing**: it is self-facing, so it
  neither blocks nor is blocked by an armed charge sitting on the channel.
- **Guards** activate independently but at most **one activation per decision window**
  (`ability.guard.window`, one tick). Already-active buffs layer freely.
- **Situational Guards hold their cooldown**: Break Free will not fire with nothing holding
  the player, Cleanse will not fire with nothing to strip, a Recovery Guard will not fire at
  full HP, Sidestep will not fire with no monster in the player's reach, and a reposition
  with nowhere to go declines rather than dashing into space. Armed Contagion declines to
  ARM with nothing to spread (or nobody to spread it to), the rule its cast had before the
  wind-up.
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
| In Combat → Use Ability | 2 | every Technique except Charge and Disengage (Sweep, Slam, Binding Strike, Contagion, Snipe, Imbue Lightning, Detonate, Cull, Stunning Strike); Second Wind, Brace, Endure, Recuperate (fire off cooldown — a default, not their old 50–70% thresholds), Sidestep (its reach gate keeps it off an empty field) |
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

- **Sweep, Binding Strike, Contagion:** the owner arms one formation Technique;
  snapshotted summons deliver it through their hits. Damage riders share one
  normalized budget rather than multiplying by body count. Armed Contagion copies
  full stacks, so it is not divisible: the FIRST summon hit spreads the owner's DoTs
  from its target once, and the later deliveries carry nothing
  (`abilityConduitTechniqueAdapter.test.ts`).
- **Slam, Snipe, Stunning Strike, Detonate, Cull:** prefer one
  living engaged summon in slot order. That physical summon holds position and
  basic attacks during the wind-up; other summons continue attacking. Its range
  plus the ability's range bonus determines reach. The cast delivers one full
  payload using owner stats, with owner cooldown/control rules. Death, removal,
  hard control, range/node/leash loss, or a formation move command aborts without
  cooldown; replacements cannot inherit the cast. With no eligible summon, normal
  owner targeting remains available. Detonate still requires owned DoTs. Cast
  events identify the physical summon for FX.
- **Imbue Lightning:** the summoner activates it (instant) and owns the shared
  charge window. Summon hits consume it; summons do not cast the buff individually.
  Each physical hit deliberately spends one whole charge while damage remains
  formation-weighted. The smaller burst on large formations is accepted; there
  is no fractional-charge adapter or extra per-summon charge pool.
- **Second Wind, Recuperate, Brace, Endure, Cleanse, Break Free, Bramble Guard, Sidestep:**
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
| `armed` | attaches `hasArmedAbility`; rider lands in `abilityEffects.ts` on the next hit | Sweep, Binding Strike, Contagion |
| `cast` | attaches `isCastingAbility`; see below | Slam, Snipe, Stunning Strike, Detonate, Cull |
| `charge` | winds up as a `cast`, then attaches `isChargingAbility` and **rushes** the target at `chargeSpeedMult` until contact, interruption or `chargeMaxMs`; hands the armed-hit rider back to the pipeline on arrival | Charge |
| `reposition` | resolves immediately by moving the player; optionally also arms | Disengage |
| `self-cast` | winds up like a `cast` but resolves on the PLAYER — no target to acquire and none to lose | none since the ability pass (the shape stays supported) |
| `instant` | immediate self-facing effect | Brace, Cleanse, Second Wind, Bramble Guard, Endure, Break Free, Recuperate, Sidestep, **Imbue Lightning (a Technique)** |

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
| **Slow** (the lineage `slow` payoff and ability-node slows, the Mid range at-bay tap; Hamstring until the ability pass cut it) | slowed | allowed | no | low |
| **Binding Strike** | stopped | allowed | no | medium |
| **Stunning Strike** | stopped | **stopped** | **yes** | high |

`monsterControl.ts` is the **single writer for a monster's slowed speed**. Chill and Freeze can
slow both movement and attack cadence; an ability slow affects movement only. Before this
reconciler, the sources overwrote `hasPosition.speed` and `performsAttack.attackCooldown` with
absolute values read back from `MONSTER_DATABASE`; two independent writers each treating the
other's output as "the clean base" ratcheted against each other every tick. Every source
registers here and `updateMonsterSlows` applies the **strongest of each axis** once per tick
(never the sum — summing a chill onto a slow would pin the target, and pinned is *root*,
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
| Technique Power | Sweep splash, Slam / Snipe / Stunning Strike damage, both ends of Cull's curve, Binding Strike's hit rider, Charge's strike rider, Detonate's multipliers, Imbue's on-hit | movement distance, slow/root/stun durations, Snipe's reach, Cull's threshold, Contagion's breadth and reach |
| `guard.potency-pct` / `guard.duration-pct` | Mitigation Guards: Brace/Endure DR and resistance, Bramble plating/reflect, plus buff duration | Cleanse counts, Break Free's discrete removal, Recovery skills, Sidestep (its window is the magnitude table's) |
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

## Roster — 19 abilities, 11 Techniques + 8 Guards (the ability pass, 2026-10-06)

The roster offers different offensive, positional, control and defensive roles. RP prices express opportunity cost.

Each ability is its biome's "answer tool", placed **mid-band** so the player meets the
challenge before earning the response. A biome owning two abilities staggers them at level 3
and level 5 of its own native band.

A re-homed ability gained exactly ONE authored rank at its new home tier and re-indexed
nothing: a player at the old home tier and above reads exactly the rank they read before.
The new ranks copy the next rank's numbers (no new number), except Slam rank I, the one
number the pass authored (see "The ability pass"). A re-homed recipe took the slot it moved
into — biome, level, that biome's essence colour and the price the economy passes set for
the slot. Sidestep's and Cull's prices and numbers are PROVISIONAL (marked in the code).

### T1 — the fundamentals (3 Techniques + 4 Guards)
Teaches the whole decision space before adding a new verb: distribute damage / close the
gap / deal burst, and recover / remove / endure / avoid.

| Ability | Slot / shape | Biome (level) | Job |
|---|---|---|---|
| **Sweep** | Technique / armed | Plains (2) | Next attack cleaves — the density answer (Tempo from rank II) |
| **Charge** | Technique / charge | Cave (3) | Gap-closer with real extended reach (T2 Desert 3 before the pass) |
| **Slam** | Technique / **cast** | Mountain (5) | The burst cast: rank I leans single-target (absorbed Power Strike; T2 Mountain 9 before) |
| **Second Wind** | Guard / instant | Forest (2) | Strong/short Recovery access |
| **Sidestep** | Guard / instant | Forest (5) | The Avoid Guard: an evasion window + a move-speed burst that ends with it (new) |
| **Cleanse** | Guard / instant | Swamp (3) | Discrete affliction removal |
| **Brace** | Guard / instant | Mountain (3) | Burst mitigation + knockback footing |

### T2 — positioning, soft control, sustained mitigation

| Ability | Slot / shape | Biome (level) | Job |
|---|---|---|---|
| **Binding Strike** | Technique / armed | Jungle (3) | Root — the T2 control (T3 Tundra 3 before the pass) |
| **Snipe** | Technique / **cast** | Desert (3) | The ranged opener, +300px reach (T4 Graveyard 3 before) |
| **Contagion** | Technique / **armed** | Swamp (9) | Your next hit spreads the target's afflictions — the DoT breadth answer |
| **Bramble Guard** | Guard / instant | Jungle (5) | Temporary plating + flat thorns |
| **Endure** | Guard / instant | Desert (5) | Sustained mitigation (Brace's opposite) |

### T3 — tempo and hard movement/control counterplay

| Ability | Slot / shape | Biome (level) | Job |
|---|---|---|---|
| **Imbue Lightning** | Technique / **instant** | Volcanic (3) | A window spent in HITS, not seconds (T4 Jungle 15 before) |
| **Cull** | Technique / **cast** | Tundra (3) | The kill-shaped strike: harder the lower the target; a kill refunds it (new) |
| **Detonate** | Technique / **cast** | Swamp (17) | Cash afflictions in now, with a cut |
| **Break Free** | Guard / instant | Tundra (5) | Hard-CC and root counter, fires while held |

### T4 — advanced range, escape, hard CC, long sustain
Only rank I is authored: these debut at the end of the supplied biome map.

| Ability | Slot / shape | Biome (level) | Job |
|---|---|---|---|
| **Disengage** | Technique / reposition | Trench (3) | Create distance |
| **Stunning Strike** | Technique / **cast** | Graveyard (5) | Stun — rung three |
| **Recuperate** | Guard / instant | Trench (5) | Weak/long Recovery access |

**Cut by the ability pass** (design §22.2; their jobs belong to lane payoffs now):
Expose Weakness (the Empowered `vulnerability` payoff), Power Strike (merged into Slam),
Hamstring (the Control `slow` payoff and the at-bay slow), Frenzy and Quick Strike (Tempo
and Kill chain `speed-window` / per-hit payoffs, the light frames' windows).

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
Slam's and Cull's cast payloads, thorns/retaliation and secondary proc damage all
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

### Slam — the burst cast (T1 since the ability pass; first shipped 2026-09-15 at T2)

A `cast` Technique, 6 RP gross (4 + In Combat wiring), reusing the existing
`cast-strike` effect and its AoE-radius support. Ranks: **2.2x** (rank I, T1 — the
ability pass's parity number) / **1.75x / 2.0x / 2.25x** Attack (ranks II–IV, unchanged) at
150 px, 10 s cooldown, 1.6 s wind-up. Rank I is the single-target-leaning rank in Power
Strike's place; the history below is the T2 Slam's.

(Historical, until the ability pass merged Power Strike into Slam.) The relationship with Power Strike was arithmetic and load-bearing: **Slam deals exactly half
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

**Acquisition (historical; since the ability pass: Mountain 5, blue 190, Power Strike's slot):
Mountain, biome level 9** — its T2 band's own level 3, the same placement rule
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
deliberate exceptions, homed in the swamp by THEME** (and Slam and Charge, at T1, are in
T1 biomes since the ability pass): the swamp is the game's
attrition-by-damage-over-time biome and where the brand weapons live, so it is the one
place a player has both the afflictions to manipulate and a reason to want them
manipulated. Homing them in the tier's "correct" biome would be arbitrary. (Imbue Lightning,
T4 jungle, and Slam, T2 mountain, were the same kind of exception until the ability pass
re-homed them to T3 Volcanic 3 and T1 Mountain 5.) **Designer's call.**

The pair is split across TIERS rather than staggered inside one band: Contagion at swamp
level 9 (its T2 band), Detonate at level 17 (its T3 band). That is load-bearing — T2 grants
RP-based attunement; Contagion and Detonate compete with the rest of the active build for that budget.

### The affliction toolkit — `abilityAffliction.ts`
Contagion and Detonate act on damage-over-time the player **already owns** — since design
§26.2 that is ONE record per weapon (the weapon's reservoir, or the single `lineage.bleed`)
plus the class families. Contagion is **armed** since the ability pass: firing it arms the
next attack, and the hit that lands spreads what its target carries (no wind-up); Detonate
stays a cast. Neither knows
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
  a per-family multiplier, single-target: weapon reservoirs × `detonateMult` (5.0x / 5.5x, 1.2s
  cast; a reservoir drains in ~4.5s so it owes little), every other family (class stacks,
  Permafrost, Conflagration) × `classDotMult` (2.0x). A single 5x once applied to class stacks
  too and made T4 Apprentice specs 2-3x the tier median on any weapon (fixed 2026-09-26). Effects are stripped **before** the damage lands: if the
  burst kills, the monster is removed inside `applyPlayerAoe`, and spent effects left on a
  corpse could be billed twice on the way out.
- Both are **ownership-scoped by `sourceId`** — you act on your own damage over time and
  nobody else's.
- Both **decline before they commit** — Contagion before it arms, Detonate before its
  wind-up — when there is nothing to act on (`afflictionTechniqueHasWork`), the same rule that stops Break Free firing while
  uncontrolled. Detonate's 15 s cooldown is what makes this the difference between an
  ability and a trap.
- A **permanent** DoT (Permafrost) owes unbounded damage, so "the rest of its duration" is
  not a number. The inventory projects a bounded window for it instead — long enough that
  detonating a ramped Permafrost is worth doing, short enough that never ending cannot
  out-earn a timed DoT.

### Imbue Lightning — `abilityImbue.ts`
**Instant** since the ability pass (design §22.9: a self-buff needs no telegraph): the
charge window opens on activation, and like every instant Technique it claims no
channel. A window spent in **charges, not seconds** (`remainingMs: -1`; `data.charges` counts down
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

**Buff-bar feedback** (`BuffBar.tsx` + `buffTransitions.ts`), loudness tiered quietest first: tiles pop in and fade out; a boon gaining stacks gets a gentle glow; the high-impact stacking debuffs (`SURGE_DEBUFF_IDS`: Heat, Chill, Rot, Frost, Sundered, Corroded plating) surge hot on every gained stack and their resting glow deepens with the count; a cleansed debuff shatters (white flash, burst ring, shards); `CRITICAL_BUFF_IDS` (Marked, Stunned, Frozen) sort to the front at a larger size with a permanent bright halo. Cleanse vs expiry comes from the server: `player-cleansed` is emitted by the Cleanse guard and Break Free only when a stack actually came off, and the client attributes it to debuff tiles that shrank or vanished within 700 ms of it (`server/test/cleanseEvent.test.ts`).

**Status tooltips survive their status** (`client/src/hud/primitives/useStatusStrip.tsx`, used by the buff bar and the target frame). The strip, not each tile, owns hover inspection. While a card is open the strip's layout is frozen: tiles keep their slots, a status that ends stays in place as a greyed tile whose card switches to an ENDED / CLEANSED banner with its CURRENT block relabelled "Last known", and new statuses (critical ones included) join at the end. The card follows its tile, closes 200 ms after the pointer leaves (so crossing the gap between tiles moves it instead of blinking it), and the row reflows once it closes. The target frame also stays up while a card is open after its target is gone; a new target resets the strip.

### FX — one bespoke module per ability
`client/src/fx/`, dispatched from `render/combatFx.ts` through four tables:
`GUARD_FX_BY_ABILITY`, `TECHNIQUE_SELF_FX_BY_ABILITY` (Imbue Lightning's arrival — a
Technique with no target to draw on), `CAST_FX_BY_ABILITY`, `REPOSITION_FX_BY_ABILITY`, plus
the on-hit rider tags in the `player-hit` effects loop. The cut abilities' fx modules
(`heavyStrike`, `powerStrike`, `hamstring`, `frenzy`, `quickStrike`) went with them.

The visual language carries the mechanics, so abilities that are easy to confuse read
differently at a glance:
- **Brace** snaps up cold and blue; **Endure** eases in warm and low — strong/brief vs
  modest/long.
- **Binding Strike** plays at ground level (movement only); **Stunning Strike** plays at the
  head with circling stars (actions too).
- **Charge** is a hot forward trail ending in a braced landing; **Disengage** is its cold
  mirror, emphasising the space left behind.
- **Snipe** draws the whole distance it crossed — the length of that tracer *is* the ability.
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
  activation, and a much quieter per-hit crackle on the ATTACKER as each charge is spent (up
  to five in quick succession — at cast volume it would bury everything else). There is
  deliberately **no timed aura**: the window is spent in hits, so a fading ring would lie
  about how long it lasts.

### Two new node events
`dot-spread` (source point + one link per victim × element) and `dot-detonate` (impact
point + dominant element). Both are needed because the copies and the consumed effects are
**status effects — server-only state that is never networked**, so the client cannot
reconstruct any of it from the delta. `player-technique-armed` also carries an optional
`durationMs` for a TIMED window-opening instant Technique (Frenzy until the ability pass;
none today — Imbue's window is spent in hits, so it sends none).

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

## Frenzy — measured, and the finding is an AUTHORING one (historical: Frenzy was cut by the ability pass)

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

- **Ability keystones:** the second and third verb of every trio are silhouettes
  (Sidestep's Afterimage, now its second, waits on a decoy target kind; see the verb
  table). The ability pass is implemented on
  `feat/ability-pass` and NOT merged to develop; its T1 parity constraint (±5% per class
  per T1 boss) fails structurally: the best Slam rank I leaves 12 of 30 kit cells outside
  ±5%, the worst at +8.9%. It awaits the designer.
- **Sidestep and Cull have no art** (the ability pass's additions): they render the
  placeholder glyph, and Sidestep's buff tile borrows the lineage Slip (`lineage-evasion`)
  art. Their prices and Cull's curve are PROVISIONAL.
- **Icons for thirteen abilities are drafted but not generated.** Contagion, Detonate and
  Imbue Lightning were added to `art/manifests/ability-icons.json` as `status: "draft"`
  prompts (nothing generated, no credits spent) and render the placeholder glyph until
  generated and accepted in the gallery. The new `target-max-stacks` rune condition
  temporarily aliases to the `has-debuff` crest.
- **Icons for earlier abilities are drafted but not generated.** `art/manifests/ability-icons.json`
  carries `status: "draft"` prompts for endure, binding-strike, break-free, disengage,
  recuperate, snipe and stunning-strike (and for the cut power-strike, hamstring, frenzy and
  quick-strike, now moot); they are not in the approved allowlist, so those abilities render
  the placeholder glyph until art is generated and accepted in the gallery. The concept art
  for the cut Expose Weakness and Hamstring stays in the concept set because statuses still
  borrow it (`vulnerability`, the `ability-slowed` slow).
- Ability **evolution presentation** (`lineageId` grouping in the panel) is not built — the
  field exists and Sweep and Slam each carry their own self-named lineage, but nothing
  consumes it yet.
- **Slam's concept icon** is in the concept-icon set (`client/public/assets/concept-icons/abilities/`);
  the approved atlas allowlist in `abilityIcons.ts` does not list it.
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

## The ability pass (2026-10-06)

Design §22 (§22.2 roster, §22.8 additions, §22.9 casts, §22.10 second review), run brief
`docs/briefs/ability-pass-run-2026-10-02.md` (W1-A). What changed beyond the roster
tables above:

- **Saves.** `RETIRED_ABILITY_IDS` (`abilities.ts`) names the five cut ids.
  `migrateAttunement` drops every known, attuned, wired (`use-ability` rules naming one)
  or node-progress entry for them silently; `retiredAbilityEntries` reports what was
  there, and the live load path (`playerRepo.ts`, the load that keeps the result) logs
  one line per character that had any. A renamed id that resolves to a cut one
  (`heavy-strike`, `charged-strike`) drops the same way. A re-homed ability keeps its id,
  so nothing else migrates (`attunement.test.ts`).
- **The tutorial kit.** `plans.ts`'s boss kits wear Slam where they wore Expose Weakness
  (Forest, Mountain, Swamp, Cave; Plains keeps Sweep). The Cave leg's end-of-leg learn is
  Charge, and Slam is learned right after it — nothing else would teach the Slam the
  seals and the gate wear (`tutorial.test.ts` refuses a kit that attunes an unlearned
  ability).
- **Slam rank I = 2.2** — the one number the pass authored, by the T1 lab parity rule
  (§22.1: every class within ±5% of the old kit on every T1 boss). No single value holds
  every cell: the Slinger, Spirit and Striker lose ~5–8% and the Conduit, Apprentice and
  Squire gain ~5–9% (Slam's value depends on attack cadence and on the Conduit casting
  through one summon while the others keep attacking; Expose Weakness paid every class the
  same share). 2.2 minimises the worst cell (+8.9%, Conduit on the Behemoth); the matrix and
  the candidate ladder are `reports/ability-pass/w1a*.md`.
- **Fire-shapes** (§22.10, LOCKED): `ABILITY_FIRE_SHAPES` in
  `data/abilityNodes/offers.ts` says where and when each ability's packet payoff fires,
  from the closed list, each shape mapped to an existing trigger seam
  (`ABILITY_FIRE_SHAPE_SEAM`); `ABILITY_KILL_TRIGGER_OFFERS` tags the Technique Kill chain
  offers (Charge, Contagion, Disengage, Snipe, Cull) as firing on the kill
  (`abilityFireShapes.test.ts`). **Live** (W2-E, `server/src/systems/combat/abilityNodes.ts`;
  `abilityFireShapesRuntime.test.ts`): packet and cross payoffs fire through each shape's
  seam, same payoffs and shares —
  - *on land* at the resolution (Binding Strike, Snipe, Detonate, Cull, Stunning Strike);
    Disengage on the body it broke from (`departedFrom` on the resolution site); Charge on
    its target on arrival only — the rush has no contact seam (players move through
    monster bodies), so "the first body the rush touches" is not wired;
  - *on every body hit* once per body: Sweep's cleave (first delivery on a formation),
    Slam's circle (`applyPlayerAoe`'s victims; a Conduit's one summon cast), Contagion's
    recipients after the copies land. The exchange's own body fires on the exchange; every
    other body on the owner's Attack, with no evade of its own. Only a BODY payoff fires per
    body: a self payoff (the Technique refund) fires once per resolution (design §22.12);
  - *on each hit of a window*: each Imbue charge spent, on that hit's target;
  - *on cast* (Second Wind) and *on the break* (Break Free) on guard-cast; *per hit
    absorbed* (Brace, Bramble Guard: a direct hit not dodged outright while the window is
    up) and *per hit dodged* (Sidestep) on their own `onDamageTaken` listener after
    defense; *per tick while active* (Endure, Recuperate) once per pulse while the
    window is up, from `World.tick`; *on strip* (Cleanse) once per strip that removed
    anything.
  - The three rate guards of design §22.12 ("fire-shapes keep their rate"): a self payoff
    fires once per resolution; a node's ward refreshes the one ward it owns; every Guard
    route on per hit absorbed, per hit dodged, per tick while active or on strip is capped
    at its packet's `capMs`, else Control's 5 s. Imbue's window keeps its packet's own
    `capMs` (Affliction 5 s, Empowered 4 s). Details and rates under "Fire-shapes as
    implemented" below.
  - Disengage's Kill chain route still never fires: nothing dies at a departure.
- **Offers** (§22.10): Binding Strike's Technique refund became an Affliction bleed;
  Snipe's Technique refund the Kill chain on-kill refund; Detonate's Empowered brand a
  Control slow; Charge, Contagion and Disengage's Kill chain speed window the on-kill
  refund; Cull's Kill chain offer is the speed window (it refunds natively).
- **Statuses.** Expose Weakness's `expose-weakness` and Frenzy's `ability-frenzy` lost
  their only writers and their registry entries. The `ability-slowed` id ("Slowed")
  is KEPT: the lineage `slow` payoff (every ability-node slow) and the at-bay tap still
  write it; it read "Hamstrung" until design §22.12 renamed it. Sidestep's `ability-sidestep`
  carries the evasion window and the speed burst on one clock.

### Node rows, the tier rule and the cast axis (design §22.1, §22.9, §22.10)

Every one of the 19 abilities has a four-row node tree (`shared/src/data/abilityNodes/`;
the data model and state are in `lineages-current-state.md` §7):

| Row | Tier | What it does |
|---|---|---|
| packet | home + 0 | fires one of the ability's three offered payoffs at `ABILITY_NODE_SHARE.packet` |
| amplifier | home + 1 | moves one axis of the active packet's route: a FREE choice among `targets`, `duration`, `magnitude` and, on a `cast` or `charge` ability, `cast` |
| keystone | home + 2 | one of three bespoke verbs (table below), paid in the active packet's shard |
| cross | home + 3 | borrows one of the OTHER two offers at `ROW_SCALAR.cross`; never the active packet's own lane |

**The tier rule** (`abilityNodeRowTier`, `abilityNodeBandTier` in `resolve.ts`): a row's
own tier is home + {0,1,2,3}, unclamped (a T1 ability reads 1/2/3/4, a T4 one 4/5/6/7).
Nothing above `MAX_LINEAGE_TIER` (4) exists yet, so those rows FOLD into the T4 band
(gated and priced there) and unfold, with no save touched, when a tier ships.

**The cast axis.** An amplifier on a wind-up ability can shorten the wind-up instead of
moving a payoff. Its size is derived, never authored: `abilityNodeCastSpeedPct()` =
1 - 1/(1 + `ABILITY_NODE_SHARE.amplifier`). The cast lifecycle SUMS it with
`technique.cast-speed-pct` and caps the total once at `TECHNIQUE_CAST_SPEED_CAP` (60%),
so the cap holds against every source combined (`abilityCasting.ts`, through
`abilityNodeCastSpeedPctFor`).

### Keystones: the verb table (design §22.4, §22.11)

Shared owns each verb's identity (`ABILITY_KEYSTONE_TRIOS` in `keystones.ts`: name, rule,
fx key, delivery body, `live`); the server owns behaviour, one module per verb under
`server/src/systems/combat/keystones/ability/` (header table in that folder's
`index.ts`). **Delivery body**: `owner`, `delivering-body` (the summon or formation body
that landed the ability on a Conduit; the owner everywhere else) or `formation`. The
trios (three verbs each, 57 in all, pick one at home + 2) are in design §22.11; a verb
with no module is `live: false`, shown as a silhouette and refused at purchase
(`abilityKeystones.test.ts` keeps the two in step). **All 19 first verbs are live** (design
§22.12 made Flow Sidestep's first verb, ahead of Afterimage, which needs a decoy target kind
the game does not have):

| Ability | Verb | Delivery | Seam it rides | Status / marker |
|---|---|---|---|---|
| Sweep | Whirlwind | owner | channelled-beam tick machinery + `applyPlayerAoe` around the owner, broken by hard control | none |
| Slam | Aftershock | owner | one delayed `applyPlayerAoe` at the resolved cast position | none |
| Charge | Breakthrough | delivering body | shortest control-ladder rung (`applyStun`) on the arrival blow | stun |
| Binding Strike | Dragnet | delivering body | `applyMonsterRoot` on every body within `contagionRadius` of the target | root (`ability-rooted`) |
| Contagion | Outbreak | delivering body | tags bodies Contagion copies onto; `copyPlayerDotOnto` on the tagged body's death | `keystone.outbreak.<id>` tag |
| Detonate | Chain Reaction | delivering body | a Detonate kill runs `resolveDetonate` on every afflicted body in reach (no re-chain) | none |
| Snipe | Pierce | delivering body | `applyPlayerAoeTo` on every body on the line behind the target, inside Snipe's reach | none |
| Cull | Harvest | delivering body | a Cull kill re-strikes the nearest body below the same health share, while it kills, at most the lineage `chainMaxLinks` strikes (design §22.12) | none |
| Imbue Lightning | Fork | delivering body | the charge consumer (`onChargeSpent`): each imbued hit arcs a share to the nearest other body | none |
| Stunning Strike | Relay | delivering body | the landed stun is watched; at expiry `applyStun` jumps to the nearest body not yet stunned this fight | stun; per-fight set cleared out of combat |
| Disengage | Vanish | owner | `setAggroTarget(null)` (and `abortMonsterCast`, a boss's pattern ended `target-lost`) on every monster near the departure point, bosses, boss adds and dungeon monsters included (design §22.12); nothing acquires the marked player until their next hit or the out-of-combat reset: the pull scan, the add mirroring and `bindBossAdd` / `inheritBossTarget` / raise-dead, the dungeon force-aggro, the fissure's victim pick. A dropped encounter body HOLDS (`holdsForVanished`): it stands, keeps its ramp, does not regen, runs its script, and takes the player back in the same aggro session when the mark clears; its adds hold with it | `keystone.vanish` flag; `holdsForVanished` on the monster |
| Break Free | Backlash | owner | shortest stun rung on every body adjacent to the player | stun |
| Brace | Riposte | owner | `afterHit` on a melee hit taken while Braced: shortest rung on the attacker, once per attacker per Brace | stun |
| Bramble Guard | Entangle | owner | the thorns' `afterHit` moment: `applyMonsterSlow` under its own id | `ability-entangled` (a member of `MONSTER_SLOW_STATUS_IDS`) |
| Endure | Unyielding | owner | `ability-unyielding` on Endure's clock; hard-control appliers refuse | `ability-unyielding` |
| Cleanse | Immunity | owner | each stripped status id becomes a refused kind for the `engagement-dr` unit's window, 3 s (design §22.12) | `ability-immunity` |
| Second Wind | Shared Breath | formation | the Recovery engine's skill source on same-node party members; summons mended in the summoner's owner-to-summon pass | none |
| Recuperate | Overflow | owner | the overheal-ward hook on `applyHealToPlayer`: ANY spill past full, mend or not (design §22.12; out-of-combat regen at full fills it before a pull, accepted), tops up one ward to the ward payoff's cap; spill at the cap keeps the full shell from lapsing | none |
| Sidestep | Flow | owner | the evade seam (`onDamageTaken`) while Sidestep's window is up: a dodge (a graze counts) winds the window back to the `evasion-window` unit Sidestep reads (`sidestepWindow`; a refresh, never a stack); the first hit that lands removes it, the speed burst with it | `ability-sidestep` (its own window) |

Verb magnitudes that are shares of a hit (`paysShare`) resolve from the magnitude table
at `ROW_SCALAR.keystone`; the few timings (Whirlwind's one-second spin, Aftershock's
one-second delay) are `ABILITY_KEYSTONE_UNITS`, PROVISIONAL. The second and third verbs
of each trio, and their designer notes ("probably broken", "watch for power"), are in
design §22.11.

**Names, icons and animations deepen with the rows** (design §22.7, grammar §22.10;
W2-D). `abilityDisplayName(ability, tier, parts, form)` (`shared/src/abilities.ts`, on the
grammar in `shared/src/data/abilityNodes/flavor.ts`) is the one entry point every naming surface
reads (hotbar and mobile bar as the noun, the Abilities panel and tooltips as the full
name with `abilityLineageLine` beneath a keystone's rename, the buff bar, the cast
callout, the tutorial director): "Bleeding Whirlwind of Many I, with Echoes". The icon is
composed at runtime from existing concept art by `abilityIconLayers` (base glyph; lane
frame for the packet; cross edge; keystone border plus a silhouette glyph; amplifier
axis glyph), drawn by `client/src/ui/ComposedAbilityIcon.tsx`, with no new PNG. Every
live keystone owns one bespoke animation keyed by its id
(`client/src/fx/abilityKeystoneFx.ts`; no first verb is a stub any more); the
table is in [`combat-animation-current-state.md`](combat-animation-current-state.md).

### Fire-shapes as implemented (design §22.10, §22.12)

`ABILITY_FIRE_SHAPES` (`offers.ts`) is the closed table; `ABILITY_FIRE_SHAPE_SEAM` maps
each shape to an existing trigger seam; the runtime is
`server/src/systems/combat/abilityNodes.ts`.

| Shape | Abilities | Seam |
|---|---|---|
| on land | Charge (see the exception), Binding Strike, Snipe, Detonate, Cull, Disengage, Stunning Strike | hit |
| on every body hit | Sweep, Slam, Contagion | hit |
| on each hit of a window | Imbue Lightning | hit |
| on the kill | the Kill chain offer of Charge, Contagion, Disengage, Snipe and Cull (`ABILITY_KILL_TRIGGER_OFFERS`) | kill |
| on cast | Second Wind | guard-cast |
| on the break | Break Free | break-free |
| per hit absorbed | Brace, Bramble Guard | hit-taken |
| per hit dodged | Sidestep | evade |
| per tick while active | Endure, Recuperate | pulse |
| on strip | Cleanse | cleanse |

**Charge is the one exception.** The §22.10 row reads "on the first body the rush
touches, and the target on arrival"; players move through monster bodies (they collide
only with terrain), so there is no contact seam and Charge fires on its TARGET on arrival
only. Disengage fires on the body it broke from (`departedFrom`), and its Kill chain
route never fires (nothing dies at a departure).

**The three rate guards (design §22.12, "fire-shapes keep their rate").** The shapes move
the moment a payoff fires, never its rate:

1. **A self payoff fires once per resolution.** A payoff that lands on the player or on
   the ability itself (Technique refund, speed/damage/Technique window, ward, plating
   stack, Recovery window, damage reduction, evasion window) fires once however many
   bodies the resolution hit; a payoff that lands on a body (bleed, poison, slow, brand,
   plating shred, echo) still fires on each. The split is the resolver's own:
   `applyPayoff` lands a payoff on a body exactly when `payoffLandsOnTarget(kind)`
   (shared `ON_TARGET_PAYOFF_KINDS`), and `landsOnBody` in `abilityNodes.ts` reads the
   same predicate, so there is no second list. On *every body hit* the self payoffs ride
   the exchange's own body (else the first); a Slam over four bodies refunds its cooldown
   once. Cleanse's strip is one resolution too: it fires once per strip, not once per
   affliction kind removed (every Guard offer is a self payoff, so "sized by what it
   removed" now reads "fires when it removed anything").
2. **A node's ward refreshes, not stacks.** A ward an ability node fires (packet or cross)
   carries the owner key `abilityNode.<abilityId>` (`abilityNodeOwner`); `applyWard`'s
   optional `owner` refreshes that owner's one live ward in place, topped up to the
   payoff's size (never shrunk) with its window renewed, and marks `holdsWards` dirty.
   Ownership is a server-only `WeakMap` keyed by the ward object (`ownedWardOf`), never
   on the networked `WardState`; a ward that broke, expired or went with a death is not
   found again, so the next firing mints a fresh one. Every other source (lineage cards,
   overheal, the Overflow keystone) passes no owner, so its wards stack as before.
3. **Every per-hit and per-tick Guard route is capped.** The *per hit absorbed*, *per
   hit dodged*, *per tick while active* and *on strip* routes always carry a `capMs`
   (`abilityNodeRouteCapMs`): the packet's own where it has one (only Control's 5 s, on
   Brace's damage-reduction route), otherwise the existing Control lane cap,
   `PACKET_HALF_NUMBERS.control.moment.capMs` (5 s), read through `packetMoment('control')`
   (`GUARD_FALLBACK_CAP_LANE`). So every Guard route fires at most once per 5 s per
   (player, ability, route), applied by `fire()` on `capCd(<option id>)` exactly as for a
   card. A per-tick pulse that every route's cap would refuse waits for the cap rather
   than being spent, so Endure and Recuperate pulse every 5 s (the cap is longer than
   the 4 s `pulseMs`). Imbue's *on each hit of a window* keeps its packet's own `capMs`
   only (Affliction 5 s, Empowered 4 s; its Tempo echo is uncapped, as before).

**Rates** (`server/test/_fireShapeRates.ts`: one monster hitting every 1.5 s through
`runMonsterAttack` for a minute; *held* keeps the Guard's window up the whole minute,
*duty* casts it on its own cooldown). Firings per minute, W2-E (`feat/ability-pass`
9463f1d4) → with the guards:

| Guard | Shape | Route(s) | Held | Duty | Casts/min, window up |
|---|---|---|---|---|---|
| Brace | per hit absorbed | Control / damage reduction | 10 → 10 | 6 → 6 | 6, 21 s |
| Brace | per hit absorbed | Barrier tempo / ward; Bulwark / plating stack | 40 → 10 | 14 → 6 | 6, 21 s |
| Bramble Guard | per hit absorbed | all three | 40 → 10 | 20 → 5 | 5, 25 s |
| Sidestep | per hit dodged | Engagement / evasion window | 9 → 9 | 2 → 2 | 6, 15 s |
| Sidestep | per hit dodged | Kill chain / Recovery; Bulwark / plating stack | 8 → 8 | 2 → 2 | 6, 15 s |
| Endure | per tick while active | all three | 15 → 12 | 13 → 9 | 5, 44 s |
| Recuperate | per tick while active | all three | 15 → 12 | 12 → 8 | 4, 40 s |
| Second Wind | on cast | all three | — | 6 → 6 | 6 |
| Cleanse | on strip (2 kinds per cast) | all three | — | 12 → 6 | 6 |
| Break Free | on the break | all three | — | 5 → 5 | 5 |

Duty cycle, every Guard now fires its node at or near its cast rate (5–9 a minute); held
up the whole minute, at most 12 (the 5 s cap). Sidestep is unchanged: its 2.5 s window is
shorter than the cap, and a dodge is rarer than a hit.

### T3 path re-homes (design §22.5)

Five T3 class paths moved onto the mechanics the ability pass and the frame loops gave
them, and one was retagged (no effect change):

| Path | Class | Now |
|---|---|---|
| Reverb | Squire (cooldown), packet Empowered | the execution lands again at half strength at the recharge's halfway mark, on whatever is in reach then (lost if nothing is); the bank is gone |
| Destroyer | Squire (cooldown), packet **Technique** | the execution waits primed and rides the next Technique that lands, with that Technique's shape (an armed Technique's hit, a cast's target, Slam's whole area) at the Bulwark frame's own ×3.5 (the path's −0.5 dropped, design §22.12; the other heavy paths sit at 2.5×), and the bank the regular hits fill while it waits takes it above; regular hits deal damage again |
| Justicar | Striker (cadence), retagged **Empowered** | unchanged: the Verdict is banked and spent by the finisher |
| Duelist | Slinger (reload light), packet **Kill chain** | every kill loads a round past the clip until the next reload; the exploding last bullet and the +1 round are retired (`reload.exploding-clip` and `reload.empowered-mult` have no author); the Empowered `mechanic-proxy` is ×3.5 again (design §22.12) through `reload.mechanic-proxy-mult`, which only the proxy reads, so the Scout openers and the HUD/DPS readers do not move; every other reload spec takes the proxy's 1.5 fallback |
| Warmonger | Slinger (reload heavy), packet Tempo | the Artillerist frame owns the ramp; `reload.ramp-carry-pct` 0.5 keeps half of it through a reload (`frames-current-state.md`); the top damage and the glow measure against one clip, so the first clip is the Artillerist's own, and only the attack-speed climb carries past it (design §22.12); Hair Trigger is retired |
| Pyromancer | Apprentice (dot balanced), packet Affliction | 2 burn stacks at 55% each; a hit at max burn lays nothing and does not refresh the burn (design §22.12, the old path's rule), so Radiant fires while the stacks last; the max-stack direct bonus is gone (the Ember Mage frame owns it); Radiant: a burn tick at max stacks also strikes every adjacent body as damage over time (no plating, half DR, no stacks, never recurses) |

The skill-tree data is `shared/src/data/skillTree/t3CombatA.ts` / `t3CombatB.ts`;
tests `t3SquirePaths`, `t3SlingerPaths`, `t3ApprenticePaths`.

### Migration of the cut abilities, in one place

The five cut ids live in `RETIRED_ABILITY_IDS` (`shared/src/abilities.ts`). On load,
`migrateAttunement` silently drops every known, attuned, wired (`use-ability` rule) or
node-progress entry naming one, the load path logs one line per affected character, and a
legacy rename that resolves to a cut id (`heavy-strike` to expose-weakness,
`charged-strike` to power-strike) drops the same way. A re-homed ability keeps its id
and its progress. Anything a cut ability produced that is still a live concept keeps its
status id and art: `ability-slowed` ("Slowed", design §22.12) is written by the lineage `slow` payoff
and the at-bay tap; its help text no longer names Hamstring.

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

**Charm Guard hooks (2026-09-26).** Charms react to their biome's Guard: Mitigation Guards restore the Mountain barrier; Cleanse and Break Free fire the Swamp/Graveyard pulse; any Guard advances the Jungle ramp; Break Free restores the Tundra barrier; Cave absorb is higher while a Mitigation Guard buff is up. The Trench charm adds `recovery.cooldown-reduction-pct` for Recovery-tagged abilities, under the same 90% cap. Techniques never trigger these. The code is `server/src/systems/defense/charmHooks.ts` (called from `maybeFireGuard`); the per-line table is in `docs/gear-evolution-current-state.md`; the test is `server/test/charmHooks.test.ts`.

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
