# Rites Rework — Design & Implementation Handoff

> **Archived 2026-08-09.** This is the frozen design rationale for the implemented rework.
> Use `docs/rites-current-state.md` for shipped behavior and
> `docs/rites-authoring-guide.md` for future Rite design and implementation.

**Status:** Approved first-pass design direction for implementation planning
**Purpose:** Source document for an implementation agent.
**Scope:** Rework the existing Rite system around combat-boundary rule manipulation, a small six-Rite base cast, and shared Runic Point budgeting as the sole loadout constraint.

---

## 1. Core Design Goal

Rites are **passive rule modifiers that change what happens between combats**.

They are not another generic passive-stat layer.

Their primary purpose is to modify:

- when combat is considered finished;
- how quickly out-of-combat systems become available;
- what negative state is cleared between engagements;
- what class-mechanic readiness is restored;
- what ability readiness is restored;
- what recovery happens at a kill transition.

The intended mental model is:

> **Rites rewrite the rules governing transitions from one fight to the next.**

They mostly increase effectiveness outside direct combat, at combat boundaries, or immediately after a kill.

The first implementation should remain deliberately small and understandable. The design space is large, but this rework should establish the system's identity rather than attempt to fill every possible niche. The six-Rite cast is a content scope decision, not an equip-limit.

---

## 2. System Identity

Rites must remain distinct from adjacent systems.

### Abilities
Discrete automated combat plays.

### Runes
Conditional logic and automation: **when** actions and stance transitions occur.

### Stances
Modal combat states used during fights.

### Cores
Continuous amplification of the character's class/build engine.

### Gear
Biome-linked stats, mitigation, recovery, mobility, and combat mechanics.

### Rites
**Persistent rules that modify combat boundaries, between-fight recovery, readiness, and continuity.**

A useful future-content test is:

> **Does this effect meaningfully change the state the character carries from one fight into the next?**

If not, it probably belongs elsewhere.

---

## 3. Runic Points as the Shared Metasystem Budget

Rites should **cost Runic Points to equip**.

This is a locked design direction for the rework.

Runic Points should become the broad budget governing automated and rule-changing character behavior across:

- Rune conditions/actions;
- automated stance switching;
- stance-specific automation costs;
- equipped Rites.

The conceptual role of RP is therefore:

> **Runic Points are the character's budget for automation and rule manipulation.**

Do not introduce a separate Rite currency or Rite power resource.

---

## 4. Runic Points Are the Sole Rite Loadout Constraint

Rites vary substantially in impact.

A small quality-of-life Rite that slightly changes the combat timeout should not have to compete on equal terms with a Rite that materially restores ability cooldowns.

Therefore Rites should **not use a slot limit at all**.

The player may equip any number of learned Rites as long as the total shared Runic Point cost remains legal.

Each Rite has an RP cost reflecting its impact.

Conceptually:

```ts
interface RiteDef {
  ...
  runeCost: number;
}
```

Small or situational Rites can be cheap and coexist with several other effects.

More transformative Rites naturally consume a larger share of the total RP budget and therefore limit what else the player can afford.

This is the only Rite loadout budget.

There should be:

- no Rite slots;
- no Rite capacity stat;
- no Global Mastery-based Rite slot progression;
- no separate Rite resource.

This lets the player choose between, for example:

```text
several cheap utility Rites
```

or:

```text
one or two expensive transformative Rites
```

or:

```text
a mixed Rite package plus stance / Rune automation
```

All of those compete through the same shared Runic Point budget.

---

## 5. RP Design Philosophy

RP should price **rule-changing power and behavioral sophistication**, not character power in general.

Do not begin charging RP for ordinary:

- gear;
- Cores;
- base class nodes;
- passive stats;
- abilities merely being equipped.

RP is appropriate when the character is changing or automating gameplay rules.

Examples:

- conditional ability automation;
- stance transitions;
- expensive destination stances;
- Rite effects.

### Balance principle

Equal RP costs do not need to produce equal raw DPS.

For example:

- a defensive stance contingency;
- an ability-reset Rite;
- a farming-efficiency Rite;

can all be worth similar RP for different reasons.

RP efficiency should be assessed through playtesting in terms of **strategic value**, not only throughput.

---

## 6. Core Rite Design Rules

### 6.1 Rites should primarily manipulate transitions

Prefer effects involving:

- combat start/end;
- OOC timing;
- recovery;
- cleansing;
- resets;
- readiness;
- kill-to-next-fight state.

Avoid generic permanent combat modifiers.

Bad Rite examples:

```text
+10% attack
+15% DR
+20% movement speed at all times
```

Those belong in other systems.

---

### 6.2 Prefer rule changes over additional proc stacking

The game already contains many layered combat effects.

Do not turn Rites into another large collection of:

- damage procs;
- kill explosions;
- temporary damage buffs;
- first-hit class riders;
- stacking offensive triggers.

Those ideas may be revisited later or placed in other systems.

The launch cast should remain focused.

---

### 6.3 Do not overfill the catalog

The initial cast is intentionally only **six Rites**.

This is sufficient to:

- prove the slot model;
- prove RP budgeting;
- establish the between-fight identity;
- generate real loadout decisions;
- provide playtest data.

Future Rites should be authored after playtesting reveals missing behaviors.

---

### 6.4 Overlap with gear is allowed but should be deliberate

Rites may occasionally touch mechanics also represented in equipment.

The key distinction is:

> **Gear supplies equipped combat/recovery mechanics. Rites modify universal transition rules.**

For example, heal-on-kill already exists in recovery gear.

A Rite may still provide heal-on-kill in the first cast because kills are natural combat-transition events, but this overlap should be watched during playtesting.

Do not use this exception as justification for turning the entire Rite catalog into duplicated gear effects.

---

## 7. Confirmed Base Cast

The first implementation should contain exactly the following six core Rite concepts. Any number of them may be equipped simultaneously if the player can afford their combined Runic Point cost.

Exact names may be adjusted during implementation if needed for theme consistency, but the mechanics and roles should remain recognizable.

Exact percentages, cooldown refunds, RP costs, mastery gates, and other magnitudes are **not locked** by this document.

---

### 7.1 Lingering Battle

**Identity:** delay the end of combat.

Core concept:

- increase the amount of time the character remains considered **in combat** after the last qualifying hostile interaction.

#### Purpose

This helps builds that benefit from combat continuity.

Potential benefits include making it easier to preserve:

- combat-only buffs;
- ramping mechanics;
- combat-state effects;
- other systems that reset or disable after leaving combat.

The Rite should modify the actual shared combat-state boundary rather than implementing separate fake timers for each supported system.

#### Strategic identity

Lingering Battle says:

> "Treat nearby consecutive engagements as one longer combat."

This should naturally oppose Swift Repose.

#### RP expectation

Likely low-to-moderate cost depending on how many systems benefit from prolonged combat state.

---

### 7.2 Swift Repose

**Identity:** end combat sooner.

Core concept:

- reduce the amount of time before the character is considered **out of combat** after the last qualifying hostile interaction.

#### Purpose

This allows OOC systems to begin earlier.

Potential beneficiaries include:

- HP regeneration;
- other OOC recovery;
- OOC-triggered effects;
- future Rites or mechanics that care about leaving combat.

#### Strategic identity

Swift Repose says:

> "Make every encounter end cleanly and begin recovery immediately."

This is intentionally opposed to Lingering Battle.

Neither should be universally superior.

#### Important implementation rule

Swift Repose should modify the shared combat-state definition where practical.

Avoid the current situation where different systems effectively use different definitions of "out of combat" unless a deliberate design exception exists.

---

### 7.3 Purification

**Identity:** begin the next fight clean.

Core concept:

- when combat ends, remove harmful debuffs and damage-over-time effects from the player.

The preferred first-pass model is an explicit **combat-end transition effect**, rather than repeated cleansing pulses throughout OOC time.

#### Purpose

Purification protects the state carried from fight A into fight B.

It does **not** replace an active Cleanse ability.

The distinction is:

```text
Cleanse ability:
remove a dangerous effect during combat.

Purification Rite:
ensure lingering harmful state does not contaminate the next combat.
```

#### Implementation requirements

Use a shared authoritative definition of qualifying harmful effects.

The implementation plan must explicitly resolve:

- stacked effects;
- instanced DoTs;
- anti-heal;
- slows;
- control/debuff effects;
- node hazards;
- effects that intentionally persist outside combat.

Do not silently preserve historical implementation quirks.

---

### 7.4 Mechanic Renewal

**Identity:** prepare the class mechanic for the next engagement.

Core concept:

- when combat ends, partially restore or advance the player's core class mechanic toward a useful next-fight state.

This should be implemented through **generic Rite semantics with class-specific interpretation**, rather than creating six different Rites.

Examples may include:

- **Cooldown:** reduce remaining class-mechanic cooldown.
- **Energy:** restore part of the resource.
- **Reload:** restore ammunition / advance reload readiness.
- **Cadence:** advance or restore appropriate mechanic progress.
- **Summoner:** restore whatever persistent preparation state is appropriate.
- **DoT:** requires special consideration because much of its state exists on enemies rather than the player.

These mappings must follow the actual redesigned class mechanics at implementation time.

#### Important rule

Do not force identical arithmetic onto classes whose mechanics fundamentally behave differently.

The Rite should provide comparable **next-fight readiness**, not necessarily identical percentages or formulas.

#### Scope

This Rite replaces the need for a separate Residual Momentum concept in the first pass.

**Residual Momentum is explicitly not part of the base cast.**

Do not implement separate mechanic-persistence Rites unless a later design pass reintroduces them.

---

### 7.5 Ability Reprieve

**Identity:** restore ability readiness between fights.

Core concept:

- when combat ends, reduce remaining cooldowns and/or restore some readiness to equipped abilities.

The initial implementation should choose one clear, understandable rule.

Possible forms include:

- reduce remaining cooldowns by a percentage;
- reduce remaining cooldowns by a fixed amount;
- restore partial charge progress;
- restore a charge where the ability model supports charges.

Do not combine several of these in the first implementation.

#### Purpose

Ability Reprieve supports builds that want discrete abilities available more reliably across repeated encounters.

It changes the **fight-to-fight cadence** of abilities rather than directly buffing their damage or effects.

#### RP expectation

Likely one of the more expensive base Rites because it directly modifies another major build system.

---

### 7.6 Blood Offering

**Identity:** recover health from finishing an enemy.

Core concept:

- recover HP when the player receives kill credit.

This is the only on-kill Rite in the initial cast.

#### Why it remains

It overlaps partially with existing recovery gear, but:

- kills are natural combat-transition events;
- it is easy to understand;
- it gives the base Rite catalog one direct kill-transition option;
- it provides useful playtest information about whether simple on-kill effects belong in the system.

#### Design caution

Do not use Blood Offering as precedent for immediately adding many other on-kill Rites.

The following are intentionally **not** part of the current cast:

- cooldown refund on kill;
- class resource on kill;
- buff extension on kill;
- kill-chain engines;
- enemy explosions;
- offensive on-kill procs.

Those ideas may be revisited later.

---

## 8. Base Cast Summary

| Rite | Core Role | Transition Axis | Initial Status |
|---|---|---|---|
| **Lingering Battle** | Stay in combat longer | Combat-state timing | Confirmed |
| **Swift Repose** | Leave combat sooner | Combat-state timing | Confirmed |
| **Purification** | Remove harmful carryover | Debuff persistence | Confirmed |
| **Mechanic Renewal** | Restore class-mechanic readiness | Class state | Confirmed |
| **Ability Reprieve** | Restore ability readiness | Ability state | Confirmed |
| **Blood Offering** | Recover HP on kill | Kill/recovery transition | Confirmed |

This six-Rite roster is the implementation target.

Do not expand the cast during the implementation pass unless required for testing infrastructure.

---

## 9. Deliberately Deferred / Removed Ideas

The following concepts were discussed but should **not** ship in this first pass.

### Residual Momentum

Do not implement.

The first pass does not need separate class-mechanic persistence and class-mechanic renewal systems.

Mechanic Renewal is sufficient to establish this design axis.

---

### Buff extension / Afterglow / Lingering Boons

Do not implement for now.

Extending beneficial buffs across fights may be excessively powerful and can create difficult interactions with:

- short-duration class buffs;
- equipment buffs;
- stance effects;
- ability-generated buffs;
- future combat chains.

Keep this design space reserved for later experimentation.

---

### Additional on-kill effects

Do not implement for now.

Specifically defer:

- mechanic refund on kill;
- ability cooldown refund on kill;
- buff extension on kill;
- kill streaks;
- enemy death explosions;
- generic offensive kill procs.

There is substantial conceptual overlap between:

```text
combat ends -> recover readiness
```

and:

```text
kill -> recover readiness
```

The first implementation should avoid filling the catalog with near-neighbor variations before playtesting shows that they are needed.

---

### Class-specific offensive Rites

Do not add class-specific effects such as:

- extra DoT stacks on first strike;
- special class openers;
- direct class damage modifiers.

These belong more naturally in class nodes, Cores, relics, abilities, or another future system.

---

## 10. Progression Model

### Unlock tier

Rites remain a later progression system, approximately T3 as in the current implementation unless broader progression changes require otherwise.

### No Rite slot progression

Rites do **not** gain slots through Global Mastery.

The existing `riteSlotCount(globalMastery)` model should be removed or retired from the Rite loadout architecture.

There is no fixed maximum number of equipped Rites.

### Progression through Runic Points

Rite loadout breadth and power are both governed by the character's total Runic Point budget.

As the RP budget grows, the player can afford:

- more cheap Rites;
- more expensive Rites;
- more complex Rune automation;
- more stance switching;
- or some combination of all of them.

This is intentional.

The progression axis is:

```text
Runic Points -> total automation / rule-changing complexity
```

Global Mastery may still unlock Rite recipes or content if desired elsewhere in the progression design, but it should **not** determine Rite loadout capacity.

---

## 11. Combat-State Semantics Must Be Unified

The current Rite implementation has inconsistent definitions of "out of combat."

For example, existing HP regeneration timing and existing Rite OOC readers do not all begin at the same transition.

The rework should define one authoritative combat-state model wherever possible.

At minimum, systems must be able to reason about:

```text
IN_COMBAT
LEAVING / POST_COMBAT TIMER
OUT_OF_COMBAT
```

A more elaborate phase model is not required unless implementation discovers a real need.

Lingering Battle and Swift Repose should modify the shared transition timer.

Do not make each Rite maintain its own unrelated OOC clock.

---

## 12. Combat-End Event

Several approved Rites need a clean notion of:

```text
combat was active
-> combat is now over
```

The implementation should strongly consider introducing or formalizing a server-authoritative **combat-end transition event**.

Likely consumers:

- Purification;
- Mechanic Renewal;
- Ability Reprieve.

This is preferable to every Rite independently polling combat state and trying to infer whether a transition occurred.

The event must remain server-authoritative and deterministic.

---

## 13. Kill Attribution

Blood Offering requires reliable player kill attribution.

It should trigger on kills that the game considers credited to the player, including relevant indirect player-owned damage where appropriate.

The implementation plan should verify behavior for:

- direct attacks;
- player DoTs;
- summons;
- ability damage;
- other player-owned damage sources.

Do not accidentally grant recovery for unrelated world deaths.

---

## 14. Recovery Scaling — Keep Semantics Flexible

There is an open broader design question around making **HP regeneration** the central stat governing multiple recovery effects.

Potential future examples:

- heal-on-kill as a multiple of HP regen;
- Recuperating Stance using a percentage of HP regen in combat;
- periodic recovery effects scaling from HP regen.

This is **not locked for the Rite implementation**.

### Implementation guidance

Define Blood Offering semantically as:

> recover HP on kill

without hard-wiring the system architecture to one irreversible scaling model.

Its initial magnitude may be:

- flat HP;
- percentage of max HP;
- derived from HP regen;
- another tunable formula.

Prefer an implementation that can be changed later without rewriting the Rite system.

### Design caution

Using HP regen as a shared recovery stat could create elegant synergy, but making every recovery mechanic scale from one stat may collapse distinct recovery archetypes into a single binary stacking strategy.

Do not solve this broader recovery-system question inside the Rite rework.

---

## 15. Interaction with Existing Gear

The current game already has recovery and mobility equipment that may overlap with Rite effects.

The implementation and later balance pass should specifically test:

### Blood Offering vs heal-on-kill gear

Determine whether:

- they stack additively;
- they scale from the same recovery stat;
- one modifies the other;
- diminishing returns are needed.

Do not create hidden same-ID status collisions.

### Swift Repose vs recovery gear

This combination is expected to be legitimate:

```text
recovery gear improves OOC recovery
+
Swift Repose makes OOC begin sooner
```

That is healthy cross-system synergy unless tuning makes it dominant.

### Purification vs cleanse gear / Cleanse ability

These may overlap intentionally but serve different timing needs.

The Rite should not make active in-combat cleansing irrelevant.

---

## 16. Persistence and Loadout Requirements

Persist:

```ts
knownRites: string[];
equippedRites: string[];
```

The implementation should normalize loaded state.

On hydration:

- remove invalid Rite IDs;
- deduplicate equipped IDs;
- ensure every equipped Rite is learned;
- validate the combined shared RP budget.

There is no Rite slot cap to enforce.

Malformed or legacy saves must not receive Rite effects that would place the character above the legal shared RP budget.

---

## 17. Shared RP Validation

Because Rites now consume the same RP pool as Runes and stance automation, there must be one authoritative total-cost calculation.

Conceptually:

```text
TOTAL_USED_RP =
    rune rule costs
  + stance automation / destination costs
  + equipped Rite costs
```

The server must reject loadout changes that exceed the character's available RP.

This validation should be shared across:

- Rune edits;
- stance automation edits;
- Rite loadout edits.

Do not allow one subsystem to validate only its own local cost and accidentally overspend the global budget.

---

## 18. UI Requirements

The player should be able to understand that **Runic Points are the only Rite loadout constraint**.

The Rite loadout UI should show:

- learned Rites;
- equipped Rites;
- each Rite's effect;
- each Rite's RP cost;
- current total RP used;
- remaining RP.

Do not show Rite slots or a Rite capacity meter.

When equipping or removing a Rite, the player should be able to see how it changes their shared Runic Point budget.

The UI should make it obvious that RP is shared with other Rune-driven systems.

Avoid presenting Rite RP as if it were an unrelated second currency.

---

## 19. Suggested First-Pass RP Tiers

Exact numbers are **not locked**, but the implementation should support differentiated costs from the beginning.

Conceptual categories:

### Cheap
Small/situational rule changes.

Potential examples:

- Lingering Battle;
- Swift Repose.

### Moderate
Meaningful transition improvements.

Potential examples:

- Purification;
- Blood Offering.

### Expensive
Effects that directly restore major build-system readiness.

Potential examples:

- Mechanic Renewal;
- Ability Reprieve.

These categories are only directional.

Final values require simulation and playtesting.

---

## 20. Acceptance Criteria

The rework is successful when:

### System

- Rites have no slot cap.
- Any number of learned Rites may be equipped if the shared RP budget allows it.
- Every Rite has an RP cost.
- Rite costs consume the same global RP budget as Rune/stance automation.
- Server-side validation prevents global RP overspending.
- Combat-state timing is authoritative and coherent.
- Combat-end effects fire exactly once per actual combat transition.
- Hydration enforces legal Rite state.

### Content

Exactly these six base Rite concepts exist:

1. Lingering Battle
2. Swift Repose
3. Purification
4. Mechanic Renewal
5. Ability Reprieve
6. Blood Offering

No Residual Momentum.

No buff-extension Rite.

No additional on-kill Rite in the first cast.

### Gameplay

The six Rites produce meaningfully different loadout priorities.

Examples:

```text
continuous/ramping farmer:
Lingering Battle
```

```text
recovery-oriented farmer:
Swift Repose
```

```text
debuff-heavy biome:
Purification
```

```text
class-mechanic opener build:
Mechanic Renewal
```

```text
ability-centric repeated fights:
Ability Reprieve
```

```text
high kill-rate sustain:
Blood Offering
```

The player should not automatically equip all six unless their combined RP cost is actually worth sacrificing the Rune and stance automation that uses the same budget.

---

## 21. Non-Goals

Do not use this rework to add:

- Residual Momentum;
- buff-duration extension;
- Afterglow;
- kill-chain systems;
- offensive enemy explosions;
- class-specific offensive Rites;
- generic permanent combat stats;
- Rite slots or Rite capacity;
- Global Mastery-based Rite slot progression;
- a Rite-specific resource currency;
- final production balance values;
- a large expansion of the Rite catalog.

The purpose of the first pass is to establish a **clean, testable six-Rite foundation**.

---

## 22. One-Sentence Design Rule

When evaluating future Rite content, use this test:

> **A good Rite changes the rules governing how one combat ends and the next begins, and its opportunity cost is paid entirely through the character's shared Runic Point budget.**
