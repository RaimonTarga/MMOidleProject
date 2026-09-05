# Boss Encounters (T1–T4) — Current State

**Status:** IMPLEMENTED 2026-08-23 — structure and mechanics only. Numbers are inherited,
not re-pitched.
**Design authority:** [`design_docs/BOSS_ENCOUNTER_REWORK_HANDOFF_T1_T4_2026-08-23.md`](../design_docs/BOSS_ENCOUNTER_REWORK_HANDOFF_T1_T4_2026-08-23.md)
**Code:** `shared/src/data/monsters/bossesT1..T4.ts`
**Tests:** `server/test/bossEncounterRework.test.ts` (new seams + per-lineage identity),
`server/test/bossRework.test.ts` (the earlier structural pass, updated).

If this doc and the code disagree, the code wins.

---

## 1. What changed, in one sentence

Every dungeon boss was rebuilt around **one biome idea that deepens across its tiers**,
the shared T2/T3/T4 phase template was deleted, and the anti-summon cleave that every
slow boss carried was replaced by a targeting rule.

The guiding principle from the handoff: *do not make bosses more complicated, make them
more specific.*

---

## 2. The active roster

26 dungeon bosses across 11 lineages. `void-overlord` (and its wardens / void adds) is
soft-discarded legacy and was **not** touched.

| Biome | Identity in one sentence | Tiers |
|---|---|---|
| Plains | Swarm commander — the herd is half the encounter | T1–T2 |
| Forest | Relentless cadence duel | T1–T2 |
| Swamp | Rot / attrition / hazardous arena | T1–T3 |
| Mountain | Telegraphed catastrophic impacts | T1–T4 |
| Cave | Endurance — your defensive shell erodes | T1–T3 |
| Desert | Mark and execution | T2–T4 |
| Jungle | Pursuit and failed escape | T2–T4 |
| Tundra | The Chill check — Deep Freeze then Shatter | T3–T4 |
| Volcanic | Heat, Vent, and the choice to stand in it | T3–T4 |
| Wasteland | The dead refuse to stay dead | T4 |
| Trench | One enormous Devour-focused duel | T4 |

---

## 3. Global changes

### 3.1 The anti-summon cleave is gone

Every slow boss used to carry `aoeAttack` for exactly one reason: a wall of summons could
body-block it, so the boss needed to periodically wipe them to reach its intended target.
That was a technical workaround wearing a mechanic's clothes.

Replaced by **`MonsterDefinition.targeting.prefersPlayers`** (`shared/src/data/monsters/types.ts`,
consumed in `server/src/systems/combat/ai/monsterTargeting.ts`):

- while **any player** is inside the monster's pull range, minions are not aggro
  candidates at all;
- with no player in reach it falls back to minions normally;
- a `prefersPlayers` boss that was pulled by a scouting minion **re-acquires** the moment
  a player comes into range (`server/src/systems/combat/ai/ai.ts`) — otherwise the whole
  rule is defeated by sending the summons in first;
- minions are still hit by anything area-shaped the boss does.

All 26 active bosses carry the flag. Exactly one keeps `aoeAttack`: the **Elder Trench
Serpent**, because it is the size of the arena and a body slam from it plausibly catches
everything nearby. Every other boss's AoE now lives in a charged attack, a pool, or an
aftershock — i.e. it exists because the encounter wants it.

**The "periodic sweep" contract.** The user's chosen policy was *prefer players, but
periodically sweep* — the boss stays on its target and still has a beat that punishes a
summon wall for standing in it. In practice each boss's charged attack is that beat, and
the two bosses that had none (Desert T2, Jungle T3) gained one as part of their identity
work (Scouring Sandburst, Bramble Pounce).

### 3.2 The generic phase template is gone

Removed tier-wide, with no replacement:

| Removed | Where it was | Why |
|---|---|---|
| `apply-soft-cap` + `shed-defense` | Mountain T4, Tundra T4, Volcanic T4, Trench T4 | Existed because "T4 needs a defensive layer". The Tundra case actively fought its own design — a generic anti-burst clip in the one encounter that is explicitly about rewarding burst. |
| `modify-ramp-debuff` to 85% move / 70% attack | Tundra T4 | The player should feel increasingly suppressed, never functionally unable to play. |
| `rampOnCombat` | Volcanic T4 | A private damage ramp running in parallel with the biome-level Heat that is now the encounter. |
| `attack ×4` at 25% | Swamp T3 | Turned the tier's attrition boss into its biggest direct hitter for the last quarter. |
| `cadenceFinisher` | Jungle T4, Trench T4 | Tier-template pressure that said nothing about a predator or a leviathan. Kept on Mountain T4 (see §5). |
| self-`enrage` | Plains T1 + T2 | Plains escalates by concurrency, never by the boss becoming a better duellist. |
| timed `shield` at 50% | Mountain T1, Cave T1 | A generic stall that taught nothing about either encounter. |
| `spawn-adds` | Desert T2 | Desert compresses the biome's controller/dealer pairing into ONE duellist; outsourcing to adds made it a weaker Plains fight. |
| `spawn-adds` | Mountain T2, Cave T2, Cave T3, Jungle T2, Wasteland T4 opener | **Second pass (see §4a).** Each was replaced by a casted beat the boss performs itself. Adds are now Plains' and Wasteland's identity rather than a default escalation any lineage can reach for. |
| self-`enrage` | Forest T1 (added 2026-08-29, after the rework shipped) | Designer call: the pre-50% attack-speed ramp alone carries the T1 fight's identity; T2 `apex-timberclaw` keeps its own frequency-surge enrage. |

The default replacement is **escalate the thing the encounter is already about** — see
`empower-charged` and `empower-shred` below.

---

## 4a. Adds → casted beats (second pass)

`spawn-adds` had become the generic escalation: five encounters outside the two lineages that
*are about* adds reached for another body when the design called for the boss to do something.
Each was converted to a `cast` action — a visible wind-up the boss performs itself, on the
existing scripted-cast primitive, so it arrives with a cast bar and a `target-casting` condition.

| Boss | Was | Now |
|---|---|---|
| `stoneplate-juggernaut` (Mountain T2) | 2× `peak-archer` | **Stoneplate Lock** — 1.4s cast, `plating ×1.5` for 5s. The "position" half of the identity, escalated. |
| `chitinous-dreadbore` (Cave T2) | 1× `cave-troll` | **Carapace Seal** — 1.4s cast, `+15%` DR for 5.5s. |
| `deep-core-burrow-gorger` (Cave T3) | 1× `cavern-troll` | **Deep Burrow** — 1.6s cast, `+18%` DR for 6s. A defensive climax to the corrosion, without a second body. |
| `jungle-dread-gorger` (Jungle T2) | 2× `jungle-snake` + 1× `jungle-ape` | **Canopy Hunt** — 1.4s cast, `+25%` speed and attack speed for 7s. T2 now teaches "it jumps you, then hunts you". |
| `charnel-crown-sovereign` (Wasteland T4) | `hpPct: 1.0` opener entourage + 2 more crawlers inside Mass Resurrection | Removed. The corpse tide **is** the attrition; a pre-seeded entourage just gave the resurrection something free to work with. |

Volcanic T3/T4's `spawn-pool` was likewise wrapped in a `cast` (**Vent Rupture** /
**Caldera Vent**) — the arena floor giving way is now announced rather than instant.

⚠ `BossAction.cast.fx` gained `'shield'` alongside `'roar'` / `'frenzy'` for the defensive
casts above.

---

## 4. New runtime seams

All five are generic data-driven actions/fields. No boss-ID hardcoding was added.

### `targeting.prefersPlayers` — anti-body-block
See §3.1.

### `empower-charged` (boss action)
Scales the boss's `chargedAttack` at runtime: `multiplierMult`, `cooldownMult`,
`radiusMult`, `castMsMult`, `aftershockRayCountAdd`, `aftershockDamageMult`.

Stored as **multipliers** on `ScriptsBoss.chargedOverride`, so:
- repeated phases **compose** (two phases each passing `cooldownMult: 0.8` land at 0.64);
- the authored definition remains the single source of the base numbers.

Read by `effectiveChargedAttack()` in `server/src/systems/combat/engine/combat.ts` — one
lookup site, so every downstream consumer (slam resolution, aftershock, telegraph, cast
bar) sees the scaled version for free.

### `empower-shred` (boss action) — Cave
Deepens `appliesPlatingShred` mid-fight: `platingPerStackAdd`, `maxStacksAdd`,
`extraThresholds` (additional stack counts at which the threshold poison fires).

⚠ **Trap handled:** `applyStatusEffect` keeps an *existing* effect's cap and data, so a
deepening that lands mid-corrosion has to be written onto the live stack before the
increment. Otherwise a raised ceiling would only take effect on a fresh pull. The test
covers exactly this.

### `raise-dead` (boss action) — Wasteland
Burst resurrection: claims up to `count` corpses within `corpseRange` from the node's
corpse registry and raises each as a risen copy. `maxAliveAdd` permanently lifts the
boss's `raisesDead.maxAlive` ceiling.

Built on the existing necromancy system (`server/src/systems/combat/ai/raiseDead.ts`),
so all its invariants come along unchanged: risen units are worth **zero rewards**, leave
**no corpse of their own** (the tide cannot feed itself), are population-capped, and
**crumble the instant the raiser dies**.

It can only ever give back what the player already killed — an empty registry raises
nothing.

`CORPSE_TTL_MS` was raised **15s → 30s**. Mass Resurrection fires on an HP threshold, not
a timer, so at 15s a phase burst routinely found an empty registry and did nothing at all.
30s still cannot bank a pile from a previous pull.

### `stoke-ramp` (boss action) — Volcanic
Bends the node's ambient ramp (`NodeFeatureSpec.ambientRamp`) for **everyone in the node**:
`rampMsMult` (accumulate *and* decay cadence), `minStacks` (a floor it can no longer cool
below), `maxStacksAdd` (a raised ceiling).

Node-scoped rather than per-player, held in `world.ambientRampOverrides`, so someone
arriving late walks into the same caldera. Merged multiplicatively so phases compose.
Cleared when the boss dies (`monsterDeathEffects.ts`) and on node freeze
(`nodeLifecycle.ts`) — the room cools with it.

### `spawn-pool` (boss action)
Lays a hazard pool centred on the boss, publishing the same ground zone the charged-attack
`pool` rider and `onDeath.spawnHazard` already use. Used for Swamp's Rot Bloom and
Volcanic's floor collapse. Like the charged-attack rider it stamps an `ownerId`, so the
pool is cleared when the boss leaves the world; only `onDeath.spawnHazard` corpse pools
stay ownerless and outlive their maker.

### `apply-shield.shatter` (boss action rider)
The runtime barrier granted mid-fight can now carry the brittle-shell `shatter` rider, so
Tundra's Ice Armor is *thickened by a phase* rather than needing a second definition.
`applyIceShatter` reads the override first, then the static def.

### `chargedAttack.healsSelfPct` — Trench
The caster restores this fraction of its own maxHp when the charged hit **lands**. Never on
a miss, an evade, or an aborted wind-up.

⚠ Only resolves on the **direct-hit** path: a charged attack with an `aoe` goes through
`resolveChargedSlam` and returns before the heal. That is why Devour is authored without
`aoe` — which is also correct for a bite.

### `shellUp.repeatIntervalMs` — Volcanic T3
Turns the once-per-life retract into a cycle: after the shell opens it re-arms, and every
shell after the first ignores `atHpPct` and simply returns on the clock. Gated on holding
an aggro target, so it never spends its life retracted in an empty room.

---

## 5. Per-lineage state

### Plains — swarm commander (T1–T2)
- **T1** `tusked-razorback`: repeating slime trickle + a 50% RALLY (wave + `roar`).
  The old self-enrage is gone.
- **T2** `gorging-razortusk`: trickle plus two rally beats (50% wave + boar, 25% boar pair
  + slimes), all with roars. No self-enrage at either tier.

Contrast Wasteland deliberately: here new creatures keep **arriving**.

### Forest — relentless cadence duel (T1–T2)
Two-hit claw combo and attack-speed ramp, apart from `prefersPlayers`. At T2 a compact
stunning swipe. Forest retires after T2.

> **2026-08-29 — T1 enrage removed.** The T1 `gnarled-greatbear`'s 50% enrage (a
> frequency surge) was previously LOCKED as surviving the generic-enrage cull because
> it read as this boss's whole idea. Designer direction removed it entirely at T1:
> the pre-50% attack-speed ramp alone carries the fight's identity now, and no phase
> fires at 50%. T2 `apex-timberclaw` is unaffected and still carries its own 50%
> frequency-surge enrage (`bossesT2.ts`) — this change is T1-only.

### Swamp — rot / attrition (T1–T3)
Swamp pools are **fight-length hazards**: `durationMs` is 600 000 (10 min) on T1's Bile
Pool, T2's Corrosive Pool and T3's Rot Bloom, so the arena only ever shrinks during an
encounter. They are retired by `clearToxicPoolsByOwner` when the owning boss dies or
despawns (`removeMonsterEntity`), never by expiry. T3's *Spore Pool* is the deliberate
exception — it keeps a short duration because its payoff is the detonation on expiry.
- **T1** `grave-toadeater`: 50% → pools come far sooner and wider (`empower-charged`). The
  slap stays trivial.
- **T2** `mire-gorged-behemoth`: pool leaves Corrosion. 50% → cadence-only enrage (venom
  stacks faster) + pool escalation.
- **T3** `rot-spore-croc-behemoth`: pools carry vulnerability + detonation. 50% → cadence +
  pool escalation; **25% → ROT BLOOM**: the spores thicken (`morph` on the DoT: 13×6 → 17×8)
  and a large long-lived pool floods the arena. This replaces the `attack ×4`.

### Mountain — telegraphed catastrophic impact (T1–T4)
The lineage arc the handoff asked for, intact:

**The whole lineage now runs ORDERED PATTERNS** (`MonsterDefinition.bossPattern`),
converted 2026-09-04. Every tier is one committed sequence — tell, payoff, recovery —
rather than a charged attack plus independent script beats firing over the top of it.

| Tier | Pattern | Phases |
|---|---|---|
| T1 `crag-behemoth` | lane → charge → recovery | 50% charge harder + sooner |
| T2 `stoneplate-juggernaut` | plate up → **breakable barrier** → lane → charge → recovery | 50% charge harder + sooner |
| T3 `crag-gorged-horn-behemoth` | lane → charge → **Cragbreaker on the captured endpoint** → recovery | 50% harder/wider, 25% sooner + faster |
| T4 `iron-crest-titan` | lane → charge → Earthshatter → **delayed fault lines** → long reset | 50% +3 rays & harder aftershock, 25% whole sequence sooner |

A running pattern OWNS its boss: it is rooted, its ordinary attacks are suppressed,
and the AI skips it entirely, so nothing can land underneath the sequence. Every exit
— completion, interrupt, target loss, leash, death, node teardown — goes through one
`endPattern` teardown that releases the lane, the pattern's barriers, and both locks
together.

**`empower-charged` still drives these.** Patterns share `chargedOverride` with
`chargedAttack` deliberately: `multiplierMult` scales pattern damage, `cooldownMult`
its cooldown, `castMsMult` its wind-ups, `radiusMult` its impact circles, and the
aftershock scalars its fault lines. Without that, converting a boss would have
silently turned its authored 50% phase into a no-op.

**Removed across the lineage:** `chargeOnAggro` at every tier (a speed burst on aggro
is not a charge), the T3/T4 `engageSequence` charge-lock opener (a second, worse copy
of the charge the pattern now owns), T2's pre-cast stun (it removed the player's
answer and then asked the question — the breakable barrier replaced it), T2's
repeating flat-DR shield and Stoneplate Lock, and T4's `cadenceFinisher`.

`cadenceFinisher` was **kept on T4 only** under the 2026-08-23 rework, on the argument
that a deterministic every-4th heavy hit was the small version of the same reading
skill the Earthshatter tests. **That call was reversed on 2026-09-04**: once the
Earthshatter became an ordered pattern the boss commits to, an independent cadence
beat competing with it for the player's attention was the exact accumulation the
redesign exists to undo. T4's pressure is now the sequence itself plus its long reset.

**Why a lane at all.** The Behemoth's old circular Ground Slam asked the same question
the Cave slam already asks — *leave the circle* — so Mountain had no question of its
own at T1. The charge asks *read a direction, get off the line, then punish*: a
corridor is painted from the boss along the bearing to its target, it tracks for the
first part of the wind-up, then **commits** and never re-aims. Moving perpendicular
after the lock always works, and the lock is a visible state change rather than a
hidden timer. Damage, cast time and cooldown carried over untouched from the slam.

**The boss really travels it.** The charge step moves the boss along the locked
segment at an authored px/s, damaging each body it runs over at most once, stopping
early on terrain, and bounded by a `maxTravelMs` guard. Speed is absolute rather than
a multiple of base speed: base speeds FALL across the tiers (22 at T1 to 16 at T4), so
a shared multiplier would have made each successive Mountain boss charge slower than
the last — the opposite of the lineage's arc.

**Recovery is a step, not cooldown residue.** It roots the boss, blocks its attacks,
and publishes `pattern-recovery` onto the networked boss-effect slice so the punish
window is visible. `server/test/bossGeometryPhase1.test.ts` pins a *dodgeability
invariant*: the committed window plus travel time must exceed the distance to cross
the lane at base player speed, so no retuning can quietly remove the answer.

### Cave — endurance / defensive erosion (T1–T3)
Every phase is the corrosion going further:
- **T1** `obsidian-broodmother`: ordinary hits shave one stack of plating; the
  telegraphed **Breach** (`monsterAbilities`, `plating-shred` action) shaves a larger
  dose of the SAME corrosion. One resource at two rates, so the lesson is "read the
  cast", not "learn a second keyword". 50% → `empower-shred maxStacksAdd: 3`.
  **Converted 2026-09-04**; the circular Obsidian Slam it replaced was a generic
  damage circle that taught nothing about erosion and duplicated the question
  Mountain's lane asks better. `chargeOnAggro` removed with it.
- **T2** `chitinous-dreadbore`: **erosion delivered from underneath**, as an ordered
  pattern — burrow → surface near you → erupt. 50% → `platingPerStackAdd: 1`.
- **T3** `deep-core-burrow-gorger`: the evolved burrow, bigger. Threshold poison at 3
  and 6; 50% → ceiling +4 with new threshold rungs at 9 and 12; 25% → deeper bite.

**Burrow means UNTARGETABLE, not flat damage reduction (2026-09-04).** The old T2/T3
"burrow" and Carapace Seal were `shield drAdd` casts wearing the burrow's name: the
boss took less damage for a few seconds and the player could ignore it by continuing
to swing. Now it is genuinely out of reach (`IsConcealed`) and the emergence
circle is what the player reads. Step Back avoids it, Guard absorbs it, tanking stays
legal.

**The burrow TRAVELS, and it is visible while it does (2026-09-05).** Three defects
were fixed together after the first playtest of the T2 Dreadbore, because they were
one design failure wearing three coats:

- `IsConcealed` was **server-only** — not on `NETWORKED_MONSTER_KEYS`, no view field,
  nothing. The client drew the body standing in the open and then jumped it across the
  arena; the ground marker this document previously claimed had never been built. It
  now rides `HasStatus.concealed` (the `hardControlled` precedent), reconciled from
  component presence at the tail of `updateBossPatterns` so no teardown path can
  strand it, and `client/src/render/burrow.ts` draws the underground state: a dirt
  cloud over each transition, the body sunk and dimmed (or swapped to a burrowed
  sprite where `MONSTER_BURROW_FRAMES` has one), and the nameplate and HP bar kept
  but faded — "there, out of reach" rather than despawned.
- The relocation **teleported** the boss the moment it went under, deciding the whole
  sequence ~2.6s before the telegraph it was supposed to be read from. The conceal
  step now takes `travelSpeed` and WALKS, with the destination tracking the target
  for the whole burrow. The mound crossing the arena toward you is the tell.

  **Underground speed is nothing like walking speed** (500 at T2, 520 at T3, against
  walks of ~20), and it sits deliberately in the same family as the Mountain charges
  (470–540). Both Cave burrowers are far slower than a player, so the burrow is their
  ONLY means of closing: measured at the first-draft 190px/s, the T3 gorger surfaced
  **606px** from a player kiting at full sprint, and telegraphed an eruption onto
  empty floor. It now arrives ~136px away, inside its own 155px radius.

  An earlier draft locked the emergence point partway through the burrow
  (`commitAtPct`). It was **removed after measurement**: the dodge window is the
  telegraph that FOLLOWS the burrow, so an early lock buys the player no reading
  time — it only lets a running character drift out of a circle aimed where they
  used to be. At every value actually shipped it changed no outcome at all, so it
  was an untested knob rather than a design lever.
- `emergeGap` sat OUTSIDE the eruption radius at both tiers (150 vs 140; 165 vs 155),
  and circles resolve on point containment — so a player who never moved could not be
  hit by the payoff of the entire pattern. Gaps are now inside the radius, and
  `bossConcealmentPhase4.test.ts` machine-checks the invariant.

The `near-target` angle sweep also fanned from world-east and took the first standable
candidate, so in open ground the boss surfaced to the player's right every single time.
It now fans from the boss's own bearing — still deterministic, but it follows from what
the player watched go under.

Removed across the lineage: the circular Obsidian/Chitin/Deep-Core slams,
`chargeOnAggro` at every tier, Carapace Seal, and the DR-only Deep Burrow.

### Desert — mark and execution (T2–T4)
**Rebuilt as ordered patterns, 2026-09-04.** All three tiers run the same visible
sequence — **Death Sting** paints the mark, a real answer window, then **Execution** —
with one mark source and one thing that consumes it.

The mark decides **how hard** the Execution lands, never **whether** it lands.
Cleansing strips the amplification and the Execution still arrives at its unmarked
value, to be answered with position, Guard or armour. That is the deliberate middle
path between the two failure shapes: a cleanse that cancels the attack (so the
sequence never resolves and the encounter has no teeth) and a cleanse that does
nothing (so reading the setup is pointless).

**Removed at every tier:** the `appliesMark`/`markedStrike` pair on ordinary swings —
an INVISIBLE second mark source competing with the visible one, appearing and
vanishing on plain hits with no cast bar — plus the per-hit slow, `openingStrike`,
`chargeOnAggro`, and the generic Sandburst/Rupture circles used as filler.

- **T2** `dune-stalker-emperor`: the plain cycle. 50% → closes faster, cash-out sooner.
- **T3** `dune-carapace-monarch`: the same sequence carried ACROSS a posture change —
  melee at first, ranged kiter from 50%. The mark persists through the morph unless
  cleansed, and that pairing is the point of the tier.
- **T4** `dune-throne-sovereign`: three acts (melee hunter → ranged kiter → cornered
  melee). The acts change the boss's posture; they do not change the question it asks.
  By now the player knows the sequence, and the tier tests whether they can keep
  answering it while the fight moves around them.

### Jungle — pursuit and failed escape (T2–T4)
**Rebuilt as ordered patterns, 2026-09-04.** One loop, run by all three tiers:

> Escape Guard appears and the boss bolts for the far edge of its leash.
> **Break the guard** → the retreat fails, it stumbles, and it banks one capped stack
> of **Escape Instinct** so the next attempt is quicker.
> **Let it finish** → it vanishes into cover, resets Instinct, picks a valid re-entry
> point, and comes back with an ambush.

**Barrier damage — not physical contact — is the test.** That is load-bearing: a boss
whose whole idea is running away from you would otherwise be answerable only by melee,
and ranged builds would have no counterplay at all. Instinct is capped, so repeated
failures speed it to a ceiling and no further; a successful escape wipes it, because
it records failure rather than progress.

- **T2** `jungle-dread-gorger`: the plain cycle.
- **T3** `apex-bramble-slasher`: a successful ambush adds a **venom burst** — letting
  it get away costs you for several seconds, not only in the moment.
- **T4** `verdant-crown-predator`: the full cycle **until it is cornered**. Below 50%
  the pattern stops arming (`armAboveHpPct: 0.5`) and the wounded frenzy takes over.

> **Passive `evasion` is GONE at all three tiers.** A flat miss chance is a texture,
> not a decision: it made every build's damage read as unreliable rather than making
> the boss hard to catch. Being hard to catch is now something the boss DOES, in a
> sequence the player can answer. The T3 evasion surge and T4's permanent
> evasion-to-zero went with the stat they modified.
>
> Also removed: `openingStrike` at every tier (an unanswerable alpha strike before the
> fight has taught anything), Canopy Hunt, Bramble Pounce, Killing Leap, T4's always-on
> `dotEffect` (venom now follows a successful ambush, so it means something), and
> `chargeOnAggro`.

**The capstone's low-health state is the ABSENCE of the lineage's mechanic**, not a
fourth one. That is what `armAboveHpPct` is for.

### Tundra — the Chill check (T3–T4)
**Rebuilt as ordered patterns, 2026-09-04.** The ROOM builds Chill; the boss asks
whether you let it get too deep.

**Deep Freeze** is unavoidable and targeted, and it CHECKS your stacks. The gate is
evaluated at cast start, so the question was decided *before* the cast — by whether
you cleansed and kept moving. Below the threshold the step is skipped outright; above
it you are Frozen, and a large dodgeable **Shatter** follows.

A Frozen player still has answers: Frozen is hard control, so Break Free strips it and
Step Back then clears the circle, and guarding or tanking stays legal. Cleanse
*reduces* Chill rather than deleting it (`statusPolicy: 'partial'`) — the room
re-applies it continuously, so a full strip would be true for a second and read as the
button not working.

- **T3** `frost-plated-rime-mammoth`: base Deep Freeze → Shatter.
- **T4** `glacial-patriarch`: larger Glacial Collapse, same response chain. 25% →
  Collapse wider and sooner.

**Removed at both tiers:** `chargeOnAggro`, the per-hit `rampDebuff` (the boss adding
its OWN chill on top of the room's made two sources of one resource), the Ice Armor /
vulnerability shield pair, and the generic slam circles.

> **REVERSAL of a 2026-08-23 call.** T4 used to carry `scalesWithAmbientRamp`
> (`chargedOnly`), described above as "the tell the handoff asked for", so the Collapse
> fed on how cold the room had made you. That is now **removed**: damage never
> secretly scales with Chill. The stacks decide *if* you get frozen, never how hard
> anything hits — a hidden multiplier on an already-unavoidable hit is the least
> readable escalation available. The Collapse is fed by the freeze it follows, which
> the player can see.

### Volcanic — Heat, Vent, and the choice to stand in it (T3–T4)
**Rebuilt 2026-09-04.** The shell closes and lays a visible **magma Vent**. Standing
in it accelerates the room's Heat — which raises damage *dealt* and damage *taken*
together — while you work on the shell; stepping out returns you to the node's
baseline rate and lets the Heat shed. Neither is the correct answer: **that trade is
the encounter.**

- **T3** `cinder-shell-magma-salamander`: the plain cycle. First shell at 85% HP, then
  every 16s while engaged; while shelled it cannot attack and takes 30% direct damage
  (not the roster's 15% — it repeats, so it must never stall the fight). DoTs tick
  through at full strength and the cycle is on a clock.
- **T4** `caldera-sovereign`: the same cycle, plus **Simmering Burn** (low damage, high
  cap, long duration — attrition you *can* cleanse, deliberately unlike Heat) and one
  **Cataclysm**: near the final quarter it stops attacking entirely and begins a long,
  obvious, explicitly **uninterruptible** room-wide cast. The primary answer is to kill
  it before the cast completes; a very tanky or guarded build can survive the blast
  through ordinary damage resolution and the fight simply continues. It fires
  **once per life** — repeating it would turn a decisive race into a metronome.

**A Vent is NOT auto-avoided** (`movementResponse: 'none'`). This is exactly why
avoidance keys off zone *semantics* rather than texture: staying in the vent is a
legal, rewarded choice, and a rune dragging the player out would be answering a
question the encounter meant them to answer themselves.

**The Vent ACCELERATES the room's Heat; it is not a second Heat source.** The biome's
ecology already owns what Heat is and what it does. A hazard minting its own parallel
stack counter would give the player two numbers to read where the design has one.

> **REVERSAL of a 2026-08-23 call.** The Sovereign used to hit harder per Heat stack
> (`scalesWithAmbientRamp`, defended above as "the ramp is the whole encounter"). That
> is now **removed**: Heat already raises the damage the player takes, visibly, on
> their own status bar — an invisible boss-side multiplier on top counted the same
> escalation twice and made the difficulty curve unreadable.
>
> **The Heat FLOOR is also gone** with the `stoke-ramp` beats. Consequence stated
> plainly: Heat now sheds *completely* when the player disengages, where it previously
> could not cool below the stoked minimum. That is the point — leaving is a real answer
> again — but it is a live difficulty reduction awaiting the balance pass, pulling
> against the Phase 3 Heat non-cleanse nerf which pushes the other way.

Also removed: the generic Eruption charged attacks at both tiers, the threshold Vent
Rupture / Caldera Vent casts (a second pool arriving on a health gate made the arena
unreadable rather than more dangerous), and `chargeOnAggro`.

### Wasteland — authored necromancy (T4)
**Rebuilt 2026-09-04.** `charnel-crown-sovereign`:
- arrives with ONE **opening entourage** via a `hpPct: 1.0` phase — 3 bone-crawlers
  (corpse fodder), 1 plague-hound (limited plague pressure and the fight's one
  hazard), 1 carrion-vulture (ranged support through its existing undead haste). It
  fires on engage and **never respawns**: these are the seed corpses;
- `raisesDead` on an 8s cadence, `maxAlive: 4`, 520 reach, risen at 0.75 HP / 0.80
  damage — **selective**, one at a time. A boss raising everything constantly is a
  spawner, and Plains already owns spawning;
- **50%** ONE Mass Resurrection (`raise-dead count: 3`, ceiling +2). There is no
  second wave: a low-health repeat of the headline beat makes the first mean nothing;
- risen deaths are **permanent** — a risen unit leaves no reusable corpse, so the
  tide terminates.

**THE CORPSES ARE NOW VISIBLE.** Necromancy used to be invisible bookkeeping: bodies
existed only as a server list, so a player had no way to read which of the dead were
about to get up, or that the boss was reaching for them at all. Every corpse now has a
stable id and rides the node delta and spectator snapshot, and a Raise Dead **claims
its bodies at cast start** — the claimed corpses are marked and tethered to the boss
*while the wind-up runs*, so the answer is on the floor before the payoff.

Claims are exclusive (two raisers can never tether the same body) and are released on
cancel, reset and death. That last one matters most: a claimed corpse is off limits to
everyone, so one stranded by a dead boss would be permanently marked and raisable by
nobody.

> **REVERSAL of a 2026-08-23 call.** The opening entourage was removed then under the
> rule "reinforcements are a Plains identity". That rule is still right about *waves* —
> but Wasteland's mechanic is raising the dead, and corpses come from kills. With no
> seed bodies, a solo boss pull had nothing to raise until the player happened to clear
> ambient monsters first, so the encounter could not express its own identity in the
> fight it is the boss of. The invariant was **refined rather than exempted**: no
> REPEATING add wave, with a one-shot opener at full health allowed as a starting
> condition. `bossEncounterRework.test.ts` enforces exactly that.

Also removed: the generic Charnel Burst circle, the always-on Crown Decay DoT (a
personal poison package competing with the corpse tide for the same attrition role —
it made this read as a second Swamp boss), the 25% Deathless Tide wave and its necrotic
roar, and `chargeOnAggro`.

### Trench — one enormous duel (T4)
**Rebuilt as an ordered pattern, 2026-09-04.** `elder-trench-serpent` runs one
sequence, and every step has its own answer:

> **Wound bite** → **Undertow** drags a disengaged target back → a brief
> **Constrict** if it needs one → a long, enormous **DEVOUR** that heals the serpent
> 6% of max HP *when it lands*.

Answers: Cleanse the Wound, Step Back out of the Devour, Break Free the Constrict then
Step Back, Guard it, or simply tank it. Eating the Devour hands the fight back — which
is what makes the long tell worth reading, and why the heal resolves *only* on a
landed direct hit.

**UNDERTOW IS A PULL**, not a speed buff and not a teleport. A boss that permanently
outruns you deletes ranged builds; one that blinks to you cannot be read at all. It is
a bounded, resisted, obstacle-respecting drag — clamped so it can never fling the
player *through* the serpent and out the far side.

It is resisted by the **same forced-movement stat as knockback**. Being shoved and
being dragged are one concept to the player, and a stat that helped against one but
not the other would be a lie in the item text.

- 50% → the bite lands harder and comes sooner.
- 25% → **Blood in the Water**: the gaps tighten and it closes quicker. It adds no new
  attacks and it no longer armours up — this fight should end by finally landing the
  kill, not by out-damaging a wall that appeared at 25%.

Removed: `aoeAttack` (a boss AoE riding every ordinary swing, invisible and
unanswerable), the periodic `enemyShield` and its 25% escalation, the whole
Pressure / Crushing Tide / Undertow Current rotation, `cadenceFinisher`, and
`chargeOnAggro`. The anti-heal now lives **only** on the Wound bite — the old version
applied it from ordinary hits *and* an ability, which is how the Trench reached
75-90% suppression.

### Trench teaching monsters — one lesson each
The three regular Trench slots exist to teach one piece of the Serpent before you meet
it, so each was stripped to a single readable ability (2026-09-04):

- **Abyssal Serpent** — one Wound bite. Teaches the anti-heal.
- **Hadal Stalker** — one Pressure Lance, carrying a modest slow. Teaches standoff.
  Its three former abilities were two slows and a self-haste, which together made a
  monster that *must stay catchable* progressively harder to catch.
- **Elder Leviathan** — one committed Devour, plus its carapace. §5.9 explicitly
  permits "an uncomplicated visible carapace": a defensive window is a different
  question from the bite, not a second copy of it.

A monster with four abilities teaches nothing, because the player cannot tell which
beat is the lesson.

---

## 6. Known gaps / next steps

1. **Numbers are not re-pitched.** Stat blocks are inherited. Several bosses *lost* a
   source of pressure in this pass (Jungle's cadence finisher, Volcanic's private ramp,
   Wasteland's DoT package, every anti-summon cleave) and several *gained* one (Mountain
   T1/Cave T1 traded a defensive 50% beat for an offensive one). Raw-stat compensation is
   the balance pass's call.
2. **The T1 band is stale.** `docs/briefs/t1-boss-numbers-2026-08-21.md` measured all five
   T1 bosses to one difficulty band *with* the old 50% shields and *with* cleave. Re-run
   `server/bench/bossExam.ts` before trusting it.
3. **`bench/bossExam.ts` still cannot judge absolute pitch** — the reference player
   regressed to 0/30 wins on unchanged T1 bosses after the 2026-08-22 affinity / Barrier /
   Recovery / item / ability commits. See `docs/tier-balance-current-state.md`.
4. **Corpse supply for Mass Resurrection is untuned.** `CORPSE_TTL_MS` (30s),
   `MAX_CORPSES_PER_NODE` (16), the Sovereign's `corpseRange` (520) and `maxAlive` (4)
   together decide how big the tide actually gets. Nobody has measured it.
5. **`spawn-adds` still does not leash to the boss** — pre-existing TODO in
   `bossScripts.ts`; adds use normal AI leash. Narrower after the §4a pass: **Plains (T1/T2)
   is now the only lineage using `spawn-adds` at all**; Wasteland's tide comes from
   `raise-dead` on corpses the player already made.
6. **Volcanic Heat magnitudes are placeholders** (`nodeFeatures.ts`: 6 stacks, 3s, +5%
   out / +8% in). The T4 stoke multiplies a number nobody has balanced yet.
7. **`void-overlord` is untouched legacy.** Not redesigned, not rebalanced, not part of the
   active design table.
