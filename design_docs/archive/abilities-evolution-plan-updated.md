> **ARCHIVED (2026-08-22) — HISTORICAL.** Superseded by
> `design_docs/ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md`, which replaced this document's
> percentage tier-scaling model with authored per-tier ranks. Live state in
> `docs/abilities-current-state.md`. Kept for rationale — do not treat as current.

# Abilities Evolution Plan — Planning Baseline

**STATUS:** design direction substantially locked; ready for implementation planning.

This document supersedes the earlier brainstorm draft for the active **Ability** system.
It is intended to be handed to an agent operating inside the project so it can inspect the
existing implementation, produce an implementation plan, and then stage the work safely.
Numbers are deliberately not final unless stated otherwise. The important commitments here
are the progression model, slot progression, ability shapes, roster direction, and system
boundaries.

---

## 1. Scope and terminology

“Skills” in casual discussion still refers to two separate systems and they must not be
conflated:

- **Skill tree** (`shared/src/data/skillTree/`, `UsesSkills`) — passive class progression.
  Out of scope here.
- **Abilities** (`shared/src/abilities.ts`, `TracksProgression.knownAbilities` /
  `equippedAbilities`) — active automatic-combat Techniques and Guards. This document is
  entirely about this system.

Abilities are not manually pressed during combat. The player equips abilities and uses the
**rune/trigger system** to define when they should fire. This trigger layer already exists and
is a central part of the design rather than new work for this plan.

Examples already intended by the rune system include:

- fire a defensive ability below an HP threshold;
- Cleanse when debuffed;
- use an AoE Technique when enough enemies are nearby;
- use a single-target Technique against an elite/high-value target;
- Mountain-associated trigger logic that can react to an enemy beginning a **charged attack**,
  allowing abilities such as Brace or eventually Parry to respond automatically to telegraphed
  attacks.

The clean responsibility split is therefore:

> **Runes decide when an ability should fire. The ability defines what combat action occurs.**

---

## 2. Existing shipped baseline

The implementation agent should verify exact current code before changing it, but the known
baseline is:

- Two equipped ability fields today: one `technique` and one `guard`.
- Five existing abilities: **Sweep, Brace, Cleanse, Expose Weakness, Second Wind**.
- Ability recipes/unlocks are already tied to **Biome Mastery**.
- Guard-side item modifiers already exist on the recovery/charm slot via `GUARD_KEYS`.
- Technique-side equivalent itemization does not yet exist.
- Monster charged-attack infrastructure already provides a proven wind-up -> telegraph ->
  resolve -> interrupt lifecycle that should be reused where sensible for player casted
  Techniques.
- Player channeling infrastructure also exists elsewhere, but is not currently the Ability
  system.

The existing T1 system is the baseline to extend rather than replace wholesale.

---

## 3. Locked design principles

### 3.1 Biome Mastery owns ability unlocks

Biome Mastery remains the ability progression gate. **Global Mastery does not gate abilities.**

Abilities should reinforce biome identity in the same way gear and enemy design do.

### 3.2 Abilities remain class-agnostic

No ability is locked to a range, frame, or combat archetype.

Where the same Technique needs to resolve differently for an archetype, use a small generic
resolver layer rather than creating separate ability IDs.

The clearest launch adapter remains **Reload**: an armed Technique may need to apply across a
magazine rather than literally one projectile. Do not attempt to pre-solve every archetype/
ability combination. Add explicit adapters only where the base semantics genuinely break.

### 3.3 Offense and defense budgets stay separated

No defensive/recovery ability may scale from damage dealt or other offensive output. The
rejected Leech Strike concept remains rejected for this reason.

Likewise, Technique-oriented item stats should live on the offensive side of itemization,
while Guard potency remains on the defensive/recovery side.

### 3.4 Runes provide conditional automation

The ability roster does **not** need to encode bespoke trigger logic into every ability.
Conditions belong to the rune/trigger layer.

This is especially important for specialized abilities such as Parry and Stun Strike: they can
be valuable because the player has multiple slots and can give each one a narrow trigger.

### 3.5 Specialized abilities are desirable once multiple slots exist

With one Technique and one Guard, every ability competes to be the single best general-purpose
choice. Later slot unlocks deliberately change that.

The long-term goal is a small deterministic combat script/toolbelt:

- Technique A for situation A;
- Technique B for situation B;
- Guard A for danger A;
- Guard B for danger B.

This is a major reason to keep abilities such as **Parry** and **Stun Strike** rather than
cutting them for being too situational.

---

## 4. Ability progression model

The earlier question of gear-style upgrades versus free upgrades is resolved.

### 4.1 Numeric tier deepening is automatic

An owned ability automatically improves as the player advances through the relevant tier/
progression checkpoint. There is no repeated `+1/+2/+3` ability-upgrade ritual and no separate
“Sweep II” item in the loadout.

Example:

```text
Sweep
T1: baseline splash magnitude
T2: larger splash magnitude
T3+: further numeric scaling as authored
```

The UI may communicate improved ranks if useful, but mechanically this remains the **same
ability ID/form**.

### 4.2 Identity evolutions are separate selectable forms

A true mechanical transformation is an **evolution**, not an automatic numeric rank.

Example:

```text
Sweep
  -> Whirlwind
  -> Contagion
```

These are mechanically distinct selectable forms. Unlocking a later evolution does **not**
destroy or permanently replace the earlier form. Earlier forms remain available because they
may be better for different biome shapes or rune conditions.

Implementation planning may reuse lineage concepts such as `lineageId` / `evolvesFrom`, but
ability evolution should not blindly copy gear replacement semantics.

A light one-time biome/recipe resource cost for true identity evolutions is acceptable if it
fits the existing economy, but routine numeric tier scaling must remain automatic and
frictionless.

---

## 5. Ability shapes

The old definition “Technique = next-hit effect, Guard = duration buff” is too narrow for the
future roster. Keep the two **slots/categories**, but allow several execution shapes inside
Technique.

### 5.1 Armed Technique

Arms/modifies the next qualifying attack cycle.

Examples:

- Sweep
- Expose Weakness
- Whirlwind
- Frost Bite
- Stun Strike
- Contagion
- Weakening Strike

These stay closely coupled to the normal class attack engine.

### 5.2 Casted Technique

Temporarily enters an explicit wind-up/cast, then resolves an ability effect. These should
reuse proven charged-attack lifecycle concepts where possible: arm -> telegraph/cast ->
resolve -> interruption rules.

Examples:

- Charged Strike
- Detonate
- at least one additional later offensive cast should exist by roughly T4 so cast-oriented
  itemization is a real build axis rather than a stat for only one or two abilities.

Not every Technique should be casted. The target roster should remain weighted toward armed/
instant Techniques; roughly **one quarter to one third** of offensive Techniques being true
casts is a healthy initial direction.

### 5.3 Reposition Technique / Guard

Some abilities primarily move the character:

- Charge — close distance / engage;
- Disengage — create distance / escape.

These remain Technique/Guard abilities rather than creating a third “mobility ability” slot.
The existing `mobility` gear slot is a separate concept and should not be conflated with this.

### 5.4 Guard

Activates a temporary defensive, recovery, utility, or tempo state.

Examples:

- Brace
- Cleanse
- Second Wind
- Bramble Guard
- Ward
- Frenzy
- Parry
- Abyssal Ward

A Guard can be offensive in theme (for example Frenzy) if its mechanical shape is a temporary
state rather than an armed attack.

---

## 6. Cast stats and Technique itemization

The casted Technique system deliberately opens two new offensive build stats.

### 6.1 Cast Speed

- Only affects abilities with a real `castTime`.
- Reduces wind-up/cast duration.
- Should not become a universal attack-speed replacement.

### 6.2 Technique Power / Technique Potency

Prefer a name such as **Technique Power** over a universal “ability damage multiplier.”

It scales explicit offensive Technique payloads where appropriate:

- Charged Strike ability damage;
- Sweep/Whirlwind splash component;
- Detonate's authored burst/conversion payload;
- future casted ability damage.

It must **not** blindly scale utility semantics such as stun duration, movement distance, or
slow percentage unless that effect explicitly opts into potency scaling.

Guard potency remains a separate defensive stat family. Do not introduce one universal ability
stat that simultaneously raises offensive damage and defensive survivability.

### 6.3 Technique-side gear modifiers

Add a Technique-oriented stat family, likely on weapons/offensive gear. It does not have to be
a literal mirror of `GUARD_KEYS`.

Candidate axes:

- Technique Power / potency;
- Technique cooldown reduction;
- Cast Speed for cast-enabled builds.

Duration is not inherently a Technique stat and should only exist where a particular effect
needs it.

---

## 7. Multi-slot progression — locked direction

Multiple ability slots are an intended progression reward.

### Slot roadmap

| Tier | Technique slots | Guard slots | Design purpose |
|---|---:|---:|---|
| T1 | 1 | 1 | Learn ability + rune fundamentals |
| T2 | 1 | 1 | Add casting/reposition complexity without increasing orchestration load |
| **T3** | **2** | 1 | First true offensive repertoire / conditional Technique toolbelt |
| **T4** | **2** | **2** | Midpoint unlock: full 2-Technique / 2-Guard tactical loadout |
| T5+ | 2 initially | 2 initially | Add a third slot only when roster/balance proves it useful |

A third Technique/Guard slot is deliberately **not** assumed immediately. `2 + 2` may remain the
sweet spot for several tiers because rune conditions multiply the effective loadout space.

### 7.1 Techniques cannot stack into one nuke

Multiple equipped Techniques share one offensive execution/arming channel.

- Only one Technique may be armed, casting, or resolving at a time.
- If multiple rune conditions become valid simultaneously, deterministic arbitration chooses
  one.
- The other Technique remains eligible and may fire afterward if its condition still holds.
- Priority should be explicit and deterministic (for example configured priority, then slot
  order as stable tie-breaker).

This prevents combinations such as Sweep + Charged Strike + Expose Weakness all being armed on
one hit.

### 7.2 Guard overlap policy

The exact Guard concurrency rule is still an implementation/balance decision, but the preferred
starting model is:

- multiple Guards may be equipped;
- only one new Guard activation resolves in the same decision/resolution window;
- already-active duration effects may overlap unless a specific incompatibility says otherwise.

This prevents instant defensive combo-dumping while still allowing meaningful layered state,
for example Ward already being active when Brace later responds to a charged attack.

This rule should be tested before adopting a stricter global “only one Guard may exist at all”
lock.

---

## 8. Roster size target

Because T3/T4 introduce additional slots, the roster should be larger than the earlier
16-form proposal.

### Target cadence

- **T1:** 5 total baseline abilities.
- **T2:** roughly +3 to +4.
- **T3:** roughly +5 to +6, coinciding with the second Technique slot.
- **T4:** roughly +5 to +6, coinciding with the second Guard slot.

The target at the T4 midpoint is approximately **20–22 selectable ability forms**, not because
the player needs a hotbar, but because four automated slots benefit from both general-purpose
and specialized options.

Longer-term T5–T8 design should add fewer basic verbs and increasingly focus on evolutions,
specialized reactions, party utility, cast interactions, and combinations of established
mechanics. A final T8 library around **30–35 forms** is a reasonable ceiling to evaluate later,
not a quota.

---

## 9. T1–T4 ability roadmap

This section is the current planning baseline. Numerical tuning is intentionally deferred.

### T1 — teach the base vocabulary

| Ability | Role / shape | Biome | Core job |
|---|---|---|---|
| **Sweep** | Armed Technique | Plains | Next attack splashes/AoEs; teaches density response |
| **Second Wind** | Guard | Forest | Temporary sustain/recovery |
| **Brace** | Guard | Mountain | Temporary anti-burst protection; pairs naturally with charged-attack trigger runes |
| **Cleanse** | Guard | Swamp | Remove/answer harmful effects and attrition debuffs |
| **Expose Weakness** | Armed Technique | Cave | Single-target/elite damage amplification |

T1 deliberately contains no true casted Technique. It teaches the core Technique/Guard + rune
trigger model first.

### T2 — introduce new execution shapes

| Ability | Role / shape | Biome | Core job |
|---|---|---|---|
| **Bramble Guard** | Guard | Jungle | Temporary Plating/hardening-style protection plus flat Thorns/reflect; strongest into frequent attackers |
| **Charge** | Instant reposition Technique | Desert | Close distance and convert engagement into an empowered/alpha strike |
| **Charged Strike** | **Casted Technique** | Mountain | First player Ability cast: wind up, then deliver a large Technique-powered heavy strike |

T2's main purpose is not raw roster growth. It introduces **reflect, repositioning, and
casting** while all T1 abilities continue to auto-scale numerically.

There is room for one additional T2 ability if implementation/playtesting shows the roster is
too sparse, but no speculative fourth T2 ability is locked merely to hit a quota.

### T3 — unlock second Technique; specialists become valuable

| Ability | Role / shape | Biome | Core job |
|---|---|---|---|
| **Whirlwind** | Armed Technique; Sweep-line evolution | Volcanic | Radial close-density version of Sweep with Volcanic tempo/burn/ramp flavor |
| **Frost Bite** | Armed Technique | Tundra | Apply a stacking freeze/slow affecting both attack speed and movement speed |
| **Ward** | Guard | Tundra | Temporary absorb shield; predecessor to Abyssal Ward |
| **Detonate** | **Casted Technique** | Swamp | Cash out caster-owned stored DoT damage into immediate burst; trades future efficiency/tempo for now-damage |
| **Stun Strike** | Armed Technique | Cave | Specialized hard-control strike; now worthwhile because it can occupy a conditional second Technique slot |
| **Parry** | Guard | Mountain | Negate the next qualifying major hit and reward success with immediate offensive initiative / attack-timer reset |

**Parry is intentionally supported by the rune system:** a Mountain trigger can react to an
enemy beginning a charged attack, producing deterministic automated “parry the telegraphed
hit” behavior rather than requiring manual reflex input.

**Stun Strike is a separate option from Expose Weakness**, not a mandatory replacement.
Expose = kill the elite faster; Stun Strike = control the elite.

### T4 — unlock second Guard; full tactical loadout

| Ability | Role / shape | Biome | Core job |
|---|---|---|---|
| **Frenzy** | Guard | Volcanic | Temporary attack-speed/tempo state; intentionally competes with defensive Guards |
| **Disengage** | Instant reposition Guard | Desert | Create distance from the current target; complements Charge without creating a mobility slot |
| **Contagion** | Armed Technique; Sweep-line evolution | Graveyard/Wasteland | Spread the caster's active DoTs through dense packs; density becomes propagation |
| **Abyssal Ward** | Guard; Ward-line evolution | Trench | Redirect incoming heal/regen into temporary shielding, answering Abyssal Pressure-style anti-heal |
| **Weakening Strike** | Armed Technique | placement to validate during biome pass | Apply a temporary enemy outgoing-damage reduction; defensive/party-oriented Technique specialist |
| **Additional casted offensive Technique** | **Casted Technique** | placement to validate | Ensure cast-speed/Technique-Power builds have at least ~3 meaningful offensive cast choices by T4 |

The additional casted Technique is a **real roster requirement**, but its final fantasy/name is
not yet locked. A working example is a heavy AoE cast such as **Seismic Slam**: stop attacking,
wind up, then deal a large Technique-powered hit around the player. The implementation/design
planning pass should validate whether that effect duplicates Whirlwind too closely or whether a
different biome/cast identity is stronger.

This leaves the T4 target at roughly **20–21 forms**, depending on whether the optional T2 slot
is eventually filled.

---

## 10. Locked evolution lineages

### Sweep lineage

```text
Sweep — Plains
  -> Whirlwind — Volcanic
       -> Contagion — Graveyard/Wasteland
```

These are selectable siblings/descendants, not destructive replacements.

- **Sweep:** simple targeted splash / broad generalist density answer.
- **Whirlwind:** radial close-range density answer with Volcanic tempo/ramp flavor.
- **Contagion:** extreme-density propagation form that spreads caster-owned DoTs.

“Contagion” should be treated as the current T4 capstone of this lineage, not necessarily the
literal final form for a game that runs to T8.

### Ward lineage

```text
Ward — Tundra
  -> Abyssal Ward — Trench
```

- **Ward:** simple temporary absorb shield.
- **Abyssal Ward:** converts incoming healing/regen into temporary shielding while active,
  allowing recovery investment to function under Trench's anti-heal pressure in a transformed
  way rather than simply bypassing the biome mechanic.

### Abilities deliberately without forced evolution

Do **not** force every T1 ability to receive a named evolution at every tier.

Second Wind, Cleanse, Brace, Expose Weakness, etc. may remain evergreen primitives that simply
scale numerically until a genuinely different identity fork is worth authoring. Avoid filling a
T1->T2->T3->T4 evolution spreadsheet for symmetry's sake.

---

## 11. Important mechanic rules per ability

### Detonate

Detonate is high-risk balance-wise and should obey a conservative invariant:

> **Convert stored future DoT damage into immediate damage; do not create an extra multiplicative damage engine.**

The exact conversion percentage is a tuning problem. The core semantics should make Detonate a
burst/tempo trade rather than a way to multiply the same DoT package again.

- Consume only **caster-owned** DoTs/stacks unless party ownership semantics are intentionally
  redesigned later.
- Do not let Detonate consume another player's damage investment.
- Explicitly define how Technique Power interacts with the conversion so it cannot double-dip
  every underlying offensive modifier.

### Contagion

- Spread the caster's relevant DoT state, not another player's by accident.
- Define ownership/source preservation explicitly for party combat.
- It should express Graveyard extreme-density play rather than become a universal single-target
  damage multiplier.

### Charged Strike

- True cast/wind-up.
- Cast Speed reduces wind-up.
- Technique Power scales the authored ability-damage payload.
- Determine whether normal attack modifiers, class mechanics, and on-hit effects participate
  independently rather than assuming “everything procs.”

### Parry

- Guard, not manual input.
- Rune trigger can activate it in response to a charged-attack telegraph.
- Negates the next qualifying attack while the Guard is active.
- Successful negation resets/advances the player's attack timer to create a deterministic
  counterattack payoff.

### Charge / Disengage

These remain inside Technique/Guard loadouts. Do not create a separate reposition/mobility
ability slot during this implementation wave.

---

## 12. Multi-archetype resolver constraints

The resolver is meant to prevent class-exclusive abilities, not become a giant bespoke rules
engine.

Initial approach:

- Default armed Technique semantic = **next qualifying attack cycle**.
- Implement only explicit archetype adapters proven necessary by play behavior.
- Reload is the first likely adapter: a scalar armed payload may be distributed across the
  magazine rather than applied at full value to every bullet.

Do **not** assume all effect types can be divided mathematically.

Examples that require explicit semantics:

- scalar splash damage can potentially distribute across a magazine;
- a 1.5 s stun should not automatically become five 0.3 s stuns;
- Contagion should not spread five times simply because the Reload root fired five bullets;
- Detonate should not trigger once per bullet;
- Charged Strike is a casted action and should not be translated into “every bullet is a
  charged strike.”

Prefer per-effect compatibility/adapter rules over a universal `consumeMode` that silently does
nonsensical things.

---

## 13. Guard and Technique itemization direction

### Guard side

Existing `GUARD_KEYS` are directionally compatible with the design but should be reviewed rather
than treated as immutable prior art.

### Technique side

Create an offensive Technique stat namespace rather than blindly cloning Guard fields.

Likely useful concepts:

- Technique Power;
- Technique cooldown reduction;
- Cast Speed.

Avoid cross-budget leakage: Guard potency belongs to recovery/defensive itemization; Technique
Power belongs to weapons/offensive itemization.

Also remember multiplicative stacking: potency and cooldown reduction together increase total
throughput nonlinearly, so they should not be budgeted as independent equal-value linear stats.

---

## 14. Backlog for T5–T8

Later tiers should increasingly remix the established vocabulary rather than add endless basic
verbs.

Strong backlog candidates:

- **Battle Focus / Cooldown Reset** — refresh another equipped ability; now meaningful because
  multiple slots exist.
- **Group Ward** — party-facing defensive ability once party buff semantics are authored.
- **Multistrike / rapid-combo cast** — revisit only after the interaction with Cadence, Energy,
  Reload, DoT stacking, and other attack engines is explicitly solved.
- **Advanced Stun Strike evolution** — later small-AoE/freeze-adjacent control once it no longer
  competes directly with Tundra's introductory control identity.
- **Additional casted Techniques** — enough to support a real cross-class cast-oriented build
  without turning every Technique into a spell.
- **Third Technique or Guard slot** — consider around T6/T7 only if `2 + 2` feels constrained
  after the roster grows. It is not a promised progression step yet.
- **Party/debuff specialists** — later abilities may trade personal output for group-wide value.

---

## 15. Rejected / deliberately descoped

- **Leech Strike / heal based on damage dealt** — violates offense/defense separation.
- **Range-exclusive abilities** — use resolver semantics instead.
- **Per-class duplicate ability IDs** — use one definition plus narrow adapters.
- **Taunt/aggro pulse as an Ability** — belongs in the rune/other systems.
- **A third reposition/mobility ability slot** — not needed; Charge/Disengage fit the existing
  Technique/Guard loadout.
- **Making every Technique casted** — rejected. Armed attacks and casted actions should coexist;
  their contrast is what makes Cast Speed and Technique Power interesting.
- **Forcing an evolution every tier** — rejected; numeric scaling is automatic and identity
  branches are authored only when they add a real new choice.
- **Immediate third Technique/Guard slots** — defer until `2 + 2` has been implemented and
  tested.

---

## 16. Adjacent future thread: cast-oriented class/archetype

A future Arcanist-like class root remains an interesting separate design project.

The Ability work in this document should make such a class possible later by establishing:

- real cast times;
- Cast Speed;
- Technique Power;
- several casted Technique choices;
- deterministic interruption and rune-trigger behavior.

Do **not** make the current Ability implementation depend on adding that class. The goal is for
casting to become a valid cross-class build axis first.

---

## 17. Implementation planning requirements

The next agent should begin with a codebase inspection and convert this design into staged work.
It should specifically locate and verify:

1. current Ability definitions, recipes, persistence, protocol, UI, rune-trigger and firing
   paths;
2. how equipped `technique` / `guard` are represented and every place that assumes exactly one
   of each;
3. the current Guard trigger arbitration path, so multi-slot priority can extend existing rune
   behavior rather than duplicate it;
4. monster charged-attack lifecycle and reusable telegraph/interruption components for player
   casted Techniques;
5. combat attack-cycle/class-mechanic hooks needed for armed Techniques and narrow archetype
   adapters;
6. healing/regen application paths needed for Abyssal Ward;
7. DoT ownership/storage paths needed for Detonate and Contagion;
8. damage-reflect/thorns infrastructure for Bramble Guard (expected to be new unless code
   inspection finds reusable support);
9. offensive gear/passive stat plumbing for Technique Power, Technique cooldown, and Cast Speed;
10. persistence/migration/UI/protocol changes for the T3 second Technique slot and T4 second
    Guard slot.

Recommended implementation sequencing:

```text
A. audit + schema plan
B. formalize ability execution shapes / cast lifecycle
C. add Technique offensive stat plumbing
D. generalize equipped ability representation for multiple slots
E. add deterministic Technique arbitration / anti-stacking channel
F. add Guard multi-slot activation policy
G. implement T2 abilities + casting pilot (Charged Strike)
H. implement T3 second Technique slot + T3 roster
I. implement T4 second Guard slot + T4 roster
J. add lineage/evolution unlock presentation and automatic numeric tier scaling
K. simulation/balance pass + resolver edge cases
```

The agent should feel free to reorder individual engineering steps after inspecting dependencies,
but should preserve the design constraints in this document.

---

## 18. Remaining decisions — narrow, not foundational

The major system questions are now resolved. The remaining questions should not block the
planning pass:

1. **Exact fourth/extra T2 ability:** not required; add only if the T2 roster feels sparse after
   implementation/playtest.
2. **Exact T4 third casted Technique:** the roster needs another meaningful cast option by around
   T4, but `Seismic Slam` is only a working example, not canon yet.
3. **Weakening Strike biome/name/details:** effect role is approved; final thematic home can be
   chosen during the biome-content pass.
4. **Guard overlap tuning:** start with one activation per resolution window while allowing
   ongoing effects to overlap; tighten only if layering proves unhealthy.
5. **Exact numbers:** cooldowns, cast times, Technique Power coefficients, DoT conversion,
   shield values, stun duration, and slot unlock mastery thresholds require simulation and
   playtesting.

Everything else in this document should be treated as the current design baseline for
implementation planning.
