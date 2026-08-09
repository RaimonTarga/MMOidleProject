# Stances Rework — Design & Implementation Handoff

> **Archived 2026-08-09.** This is the frozen design rationale for the implemented rework.
> Use `docs/stances-current-state.md` for shipped behavior and
> `docs/stances-authoring-guide.md` for future Stance design and implementation.

**Status:** Approved design direction for implementation planning
**Purpose:** Source document for an implementation agent.
**Scope:** Rework the existing stance system around modal, rune-driven combat states and replace/expand the placeholder stance catalog.

---

## 1. Core Design Goal

Stances are **modal combat states**.

Their defining feature is not passive stat selection. Their defining feature is that the player can use the Rune system to automatically move between combat modes as circumstances change.

The intended mental model is:

> **Stances define combat states. Runes define the transitions between those states. Runic Points limit how complex the resulting state machine can become.**

A build should be able to express patterns such as:

```text
Predator -> Berserker -> Enraged
```

or:

```text
Berserker -> Tanking
```

or:

```text
Recuperating -> Perfection
```

or:

```text
Brawler -> another offensive stance as enemy count falls
```

The important design space is therefore not simply "which stance is strongest?" It is:

- Which combat states does this build care about?
- Which stance is best in each state?
- Which transitions are worth spending Runic Points to automate?
- How elaborate a combat-state graph can the build afford?

Stances should become an **amplifier of the Rune system**, not a separate subsystem with its own independent resource budget.

---

## 2. System Identity

Stances must remain clearly distinct from the other build systems.

### Abilities
Discrete automated combat plays.

### Runes
Conditional logic and automation: **when** something happens.

### Cores
Continuous amplification of an existing class/build engine.

### Gear
Equipment mechanics, biome identity, matchup tools, and persistent stat/mechanic packages.

### Stances
**Temporary combat modes with meaningful tradeoffs whose value changes as combat state changes.**

A stance should usually create a reason to both **enter** and **leave** it.

---

## 3. Fundamental Design Rules

### 3.1 Stances should be modal, not passive bonuses

A stance is strongest when its usefulness changes during the fight.

Good examples:

- Tanking becomes attractive when survival matters more than DPS.
- Enraged becomes attractive at dangerous low HP.
- Brawler is strongest when surrounded and naturally loses value as enemies die.
- Predator is strongest before the first engagement and wants to be abandoned after the opener.
- Execute becomes attractive late in the enemy's HP bar.
- Recuperating becomes attractive when healing is worth sacrificing pressure.

Avoid designs that are simply permanent encounter tags.

Bad examples:

- "Boss stance: deal more damage to bosses."
- "Single-target stance: deal more damage when only one enemy exists."
- "AoE stance: deal more damage against groups."

Those usually have an obvious always-correct use for an entire encounter and therefore fail to create meaningful modality.

---

### 3.2 A good stance contains a tradeoff

Stances should not generally be free conditional bonuses.

Prefer:

```text
Gain major defense
Lose major offense
```

over:

```text
When low HP, gain defense
```

The Rune system already owns the condition.

The stance should define **what mode the character enters**.

---

### 3.3 Runes own conditions whenever practical

Do not duplicate rune logic inside stance definitions unless the condition is absolutely necessary to the mechanic.

Example:

Prefer:

```text
Enraged Stance:
large offensive benefit

Rune:
HP below X% -> switch to Enraged
```

over:

```text
Enraged Stance:
only works below X% HP
```

This preserves the clean split:

> Rune = condition<br>
> Stance = mode

It also allows unconventional combinations if they become useful later.

---

### 3.4 Stances should interact with combat trajectories

The strongest stance designs either:

1. **Exploit a state**
   - Perfection exploits high HP.
   - Enraged exploits low HP.
   - Execute exploits low enemy HP.
   - Brawler exploits high enemy count.

2. **Push the character toward another state**
   - Berserker pushes the character toward low HP.
   - Recuperating pushes the character toward high HP.
   - Tanking slows HP loss.
   - Fleeting changes exposure and engagement state.

This is what allows stances to form loops and branching state graphs rather than isolated toggles.

---

### 3.5 Do not add a separate stance resource

Do **not** introduce:

- stance points,
- stance energy,
- stance capacity,
- stance charges,
- a second stance-specific automation budget.

The scarcity mechanism should remain **Runic Points**.

The player may know/equip powerful stances freely, but automating access to them should consume Rune budget.

---

## 4. Rune Integration

The Rune system is central to the stance design.

The current flat-cost `switch-stance` action should be reconsidered.

### Preferred direction

Each stance should contribute a **stance-specific RP cost** when used as the destination of an automated switch.

Conceptually:

```text
Rule cost =
    condition cost
  + base stance-switch cost
  + destination stance cost
```

Exact values are not part of this document and require balance tuning.

### Why stance-specific costs are desirable

A weak introductory stance should not consume the same automation budget as a highly transformative late-game stance.

Variable costs allow:

- stronger stances to remain meaningfully strong;
- simple stance graphs to be cheap;
- sophisticated stance loops to consume substantial RP;
- Rune progression to increase the complexity of the player's automated combat logic;
- stance power to be balanced partly through automation opportunity cost rather than only through numerical nerfs.

### Important implementation principle

The cost should belong to the **destination stance**, not to a new stance resource.

Initial implementation can use a simple static field such as:

```ts
runeCost?: number
```

or equivalent on the stance definition.

Do not build more complicated upkeep/maintenance costs unless future design explicitly requires them.

---

## 5. Introductory Stances

The generic early stances are intentionally simpler than the later catalog.

Their purpose is pedagogical.

They teach:

1. a stance creates a tradeoff;
2. only one stance is active;
3. a Rune can switch the current posture;
4. switching modes can be more valuable than simply picking one permanent bonus.

They do not need to remain competitive forever.

### Offensive Stance

**Role:** introductory offensive posture.

Concept:

- modest increase to damage and/or attack speed;
- modest durability penalty.

Purpose:

- teaches offense-for-defense tradeoffs;
- simple baseline for early automated switching.

This should have deliberately restrained values.

---

### Defensive Stance

**Role:** introductory defensive posture.

Concept:

- modest durability increase;
- modest offensive penalty.

Purpose:

- teaches defense-for-offense tradeoffs;
- serves as an intuitive first reactive stance.

This should also have deliberately restrained values.

---

## 6. Confirmed Main Stance Roster

The following stance concepts are approved for the new design direction.

Exact percentages, thresholds, recipe costs, tier positions, and stat formulas remain subject to implementation planning and balance testing.

---

### 6.1 Tanking Stance

**Identity:** extreme survival mode.

Core concept:

- drastically reduce incoming damage;
- drastically reduce outgoing damage.

Possible secondary properties may include:

- increased threat;
- reduced movement speed;

but these are not required for the initial design and should not obscure the primary identity.

#### Intended use

When survival becomes more valuable than ending the fight quickly.

Typical transitions may include:

```text
Low HP -> Tanking
Many attackers -> Tanking
Dangerous enemy action -> Tanking
```

#### Build expression

Especially useful for builds that gain value from time:

- ramping builds;
- DoT builds;
- summon builds;
- sustain builds;
- other attrition strategies.

This creates the **turtle/outlast branch** of the stance graph.

---

### 6.2 Enraged Stance

**Identity:** convert a dangerous state into finishing power.

Core concept:

- large offensive increase;
- intended primarily for low-HP use.

Do not automatically bake the HP condition into the stance unless implementation requires it.

Preferred use:

```text
HP below threshold -> Enraged
```

The exact threshold is **not locked**.

25% is an existing Rune threshold and may be convenient, but a somewhat higher threshold may produce a more meaningful low-health phase depending on actual time-to-kill and incoming damage.

#### Strategic role

Enraged creates the aggressive answer to low HP:

> "I am already in danger; kill the enemy before it kills me."

This should contrast directly with Tanking and Recuperating.

---

### 6.3 Perfection Stance

**Identity:** reward a build that maintains near-perfect control.

Core concept:

- modest offensive/efficiency bonus;
- intended for very high HP states, approximately near full HP.

Likely Rune usage:

```text
HP above ~90% -> Perfection
```

Exact threshold is not locked.

#### Important balance rule

The benefit should be deliberately restrained.

Perfection is inherently a **win-more** stance because it is easiest to maintain in content the character already handles comfortably.

Its purpose is to:

- make stances relevant during ordinary/easy farming;
- reward highly stable builds;
- provide a high-HP endpoint in stance loops.

It should improve farming efficiency without becoming a major multiplier that excessively widens the gap between already-winning and struggling builds.

---

### 6.4 Fleeting Stance

**Identity:** escape, disengagement, and exposure reduction.

Core concept:

- large movement-speed increase;
- possible defensive/evasion benefit;
- significant offensive penalty.

#### Important distinction

Fleeting is **not Tanking**.

Tanking says:

> "Stay here and survive."

Fleeting says:

> "Reduce exposure, reposition, or escape."

Potential Rune conditions:

```text
Low HP -> Fleeting
Surrounded -> Fleeting
Dangerous enemy action -> Fleeting
Debuffed -> Fleeting
```

The exact behavior can evolve with the game's movement and aggro systems.

---

### 6.5 Berserker Stance

**Identity:** deliberately destabilize the character in exchange for tempo.

Core concept:

- substantial offensive increase;
- applies self-damage over time while in combat.

The self-DoT is an important part of the identity.

Without it, Berserker risks becoming merely a stronger generic Offensive Stance.

#### State-graph role

Berserker actively pushes the player down the HP axis.

Example:

```text
Start fight
  -> Berserker
  -> HP becomes low
      -> Enraged
```

But the same opening can support different builds:

```text
Berserker -> Tanking
Berserker -> Recuperating
Berserker -> Fleeting
```

The stance therefore creates a **trajectory**, not just a static stat package.

#### Design caution

Do not overcomplicate the first version with extra healing penalties or multiple drawbacks unless needed for balance.

The self-DoT plus the stance's offensive payoff may already provide enough identity.

---

### 6.6 Recuperating Stance

**Identity:** sacrifice pressure to recover during combat.

Core concept:

- severe offensive penalty;
- substantially increased recovery;
- allows some portion of normally out-of-combat recovery to function during combat.

Potential implementation components:

- increased recovery potency;
- conversion of some OOC regeneration into in-combat regeneration;
- possibly additional defensive/recovery modifiers.

#### Tiering

This should be a **later stance**, approximately T4 or similar, rather than an introductory stance.

#### Why later placement matters

At low tiers, strong in-combat recovery can create an easy infinite survival loop:

```text
Low HP
 -> Recuperating
 -> heal
 -> return to offense
 -> repeat
```

At later tiers, enemies increasingly have structural answers:

- overwhelming DPS;
- damage ramps over time;
- DoT pressure;
- healing reduction / anti-heal;
- burst windows;
- other mechanics that punish indefinite stalling.

This is desirable.

The game should be allowed to give the player increasingly powerful tools as enemy mechanics become sophisticated enough to answer them.

#### Design philosophy

Do not solve Recuperating primarily with arbitrary hard restrictions if monster mechanics can provide the natural counterplay.

Recuperating should be powerful against steady non-escalating pressure and weaker against enemies that punish long fights or suppress healing.

---

### 6.7 Predator Stance

**Identity:** premium pre-engagement / initiation posture.

Core concept:

- reduce enemy detection / aggro acquisition;
- increase first-strike effectiveness;
- potentially increase movement speed.

Predator is primarily an **out-of-combat or pre-contact stance**.

Its combat value should be strongly front-loaded.

#### Intended sequence

```text
Out of combat
 -> Predator
 -> approach target
 -> land first hit
 -> switch to combat stance
```

This opens an engagement-state axis that is distinct from HP-based stance logic.

#### Design caution

Do not allow Predator to become "Offensive Stance plus stealth."

Its benefits should be concentrated around:

- approach;
- initiation;
- the first hit or very short opening window.

Once combat is established, another stance should usually be more attractive.

---

### 6.8 Brawler Stance

**Identity:** survive being surrounded.

Core concept:

- defensive benefit scales with the number of enemies currently engaging/surrounding the player.

The benefit should likely be capped or use diminishing returns rather than scale infinitely linearly.

#### Why this works

Its usefulness naturally changes over the fight.

Example:

```text
5 enemies alive -> Brawler is highly valuable
3 enemies alive -> still useful
1 enemy alive   -> weak / worth leaving
```

Therefore Brawler creates a natural mid-fight reason to transition into another posture.

This is preferable to a generic "AoE stance" because it is not simply correct for an entire high-density encounter.

#### Important distinction

Brawler should primarily alter **survivability under crowd pressure**, not simply provide an AoE damage multiplier.

Abilities and gear already own much of the game's AoE damage expression.

---

### 6.9 Execute Stance

**Identity:** finishing posture against wounded enemies.

Core concept:

- significantly increases damage against low-HP targets;
- should have an actual tradeoff so it is not merely a passive execute affix.

A likely structure is:

- reduced effectiveness against healthy targets;
- sharply increased effectiveness against wounded targets.

#### State axis

Execute is keyed to **enemy HP**, whereas Enraged is keyed to **player HP**.

This is a distinct and useful transition channel.

Typical use:

```text
Target HP below threshold -> Execute
```

Exact threshold is not locked.

#### Design caution

Avoid making Execute universally correct for the entire final portion of every fight without meaningful opportunity cost.

The strength of the payoff, the penalty outside the execute window, and the RP cost should be tuned together.

---

## 7. Current Confirmed Roster Summary

| Stance | Purpose | Primary State Axis | Expected Complexity |
|---|---|---|---|
| Offensive | Intro DPS tradeoff | Generic | Low |
| Defensive | Intro survival tradeoff | Generic | Low |
| Tanking | Extreme survival | Danger / own HP / pressure | Medium |
| Enraged | Low-HP finishing power | Own HP | Medium |
| Perfection | Safe-farming efficiency | Own HP high | Medium |
| Fleeting | Escape/reposition | Exposure / movement | Medium |
| Berserker | Self-destabilizing offense | Own HP trajectory | High |
| Recuperating | In-combat recovery | Own HP trajectory | High / later-tier |
| Predator | Pre-engagement initiation | Engagement state | Medium |
| Brawler | Surrounded survival | Enemy count | Medium |
| Execute | Finishing damage | Enemy HP | Medium |

This is the approved working cast.

Do not add new stance designs during implementation unless required to complete the system.

---

## 8. Progression Philosophy

Stances should grow in conceptual complexity as tiers increase.

### Early T2: teach posture switching

Likely introductory content:

- Offensive
- Defensive
- possibly Tanking

The player learns:

```text
stance = tradeoff
rune = automatic switch
```

Do not overwhelm the first stance unlock with complex state loops.

---

### Later T2 / T3: introduce dynamic state graphs

This is where more specialized states can emerge:

- Enraged
- Perfection
- Fleeting
- Berserker
- Predator
- Brawler
- Execute

The player begins to build actual branching behavior rather than a simple default/reactive pair.

Exact tier placement is not locked and should account for biome progression and implementation constraints.

---

### T4+: introduce powerful state manipulation

Recuperating belongs approximately here.

Later stance content may become more transformative because:

- Rune budgets are larger;
- the player's build has more moving parts;
- enemies have more structural mechanics;
- state loops can be stronger without automatically trivializing combat.

The stance system should participate in the game's general rule:

> player capability expands as enemy capability expands.

---

## 9. Design Filter for Future Stances

Any future stance proposal should be evaluated using the following questions.

### A. Does its value change during the fight?

If it is always optimal for an entire boss fight, biome, or enemy category, it is probably too binary.

---

### B. Is there a plausible reason to leave it?

Strong stance concepts contain their own exit pressure.

Examples:

- Predator loses value after the opener.
- Brawler loses value as enemies die.
- Execute is useless before the target is wounded.
- Berserker keeps damaging the player.
- Recuperating sacrifices offensive pressure.
- Tanking heavily slows kill speed.

---

### C. Does it create or exploit a combat state?

Prefer mechanics tied to:

- own HP;
- enemy HP;
- enemy count;
- engagement state;
- movement/exposure;
- recovery state;
- combat trajectory.

Avoid simple encounter tags.

---

### D. Does another system already own this mechanic?

Do not create stances that primarily duplicate:

- active ability effects;
- Core class amplification;
- gear biome counters;
- generic AoE mechanics;
- passive equipment affixes.

A stance should meaningfully change **how the character is currently fighting**.

---

### E. Is the tradeoff meaningful?

A stance should not simply be a conditional pile of free stats.

If a stance is exceptionally powerful, it can also be balanced by a higher RP automation cost.

---

### F. Does it expand the Rune system?

Strong stance designs create interesting possible Rune rules.

If there is only one obvious condition under which the stance would ever be used, inspect the design carefully.

This does not automatically invalidate it, but the stance should still justify its RP cost and create a meaningful state transition.

---

## 10. Implementation Requirements

The existing stance machinery can be reused, but the implementation should be adapted to support the new design.

### 10.1 Preserve server authority

All stance state and switching must remain server-authoritative.

The client:

- selects loadout/configuration;
- selects Rune automation;
- renders authoritative stance state.

The client must not decide when a stance switch occurs.

---

### 10.2 Revisit the current default + reactive limitation

The current implementation supports:

```ts
{
  default: stanceId | null,
  reactive: stanceId | null
}
```

with one Rune action that chooses the reactive stance.

That architecture was appropriate for the original simple design, but the new stance system is explicitly about **state graphs with multiple possible destinations**.

Examples include:

```text
Predator -> Berserker -> Enraged
```

and:

```text
Berserker -> Tanking
```

A system limited to one default + one reactive stance is likely insufficient.

The implementation plan should therefore evaluate a Rune model where a stance-switch action can identify its **destination stance**.

The resulting rule concept may need to become approximately:

```ts
{
  conditionId,
  actionId: "switch-stance",
  targetStanceId
}
```

or another clean equivalent.

Do not blindly preserve the historical `{ conditionId, actionId }` limitation if it prevents the approved stance graph design.

---

### 10.3 Rune cost must support destination stance cost

The new Rune calculation should be able to account for:

- condition cost;
- base switch action cost;
- target stance cost.

The exact schema is an implementation decision, but the cost must remain easy to display and reason about in the UI.

---

### 10.4 Switching must preserve unrelated combat state

The current stance switch performs a full stat rebuild that can reset unrelated runtime mechanics.

The new design expects intentional stance switching to happen repeatedly during combat.

Therefore stance switching **must not reset unrelated combat progress** such as:

- class counters;
- cadence progress;
- ramping effects;
- defensive ramps;
- class resources;
- unrelated buffs;
- other combat-state machinery.

Refactor stance application if necessary so a legal posture change changes only the state that is logically derived from the stance.

This is a design requirement, not merely an optimization.

---

### 10.5 Define max-HP transition semantics

If any stance changes max HP:

- switching away from it must not leave invalid HP state;
- switching into it must have explicit current-HP behavior.

The simplest safe rule is likely:

```text
Current HP percentage is preserved when max HP changes.
```

or:

```text
Current HP is clamped to the new maximum and otherwise unchanged.
```

The implementation plan should choose one explicitly and use it consistently.

Do not leave the current accidental behavior in place.

---

### 10.6 Switching cadence / anti-thrash behavior

A stance graph may intentionally loop.

That is allowed.

Examples:

```text
Berserker -> Recuperating -> Berserker
```

or:

```text
Brawler -> offense -> Brawler
```

The system therefore needs stable transition semantics.

The current 1.5-second switch lockout may remain as a starting point, but it should be treated as an actual gameplay rule rather than merely a performance hack.

Consider:

- minimum dwell time;
- switch cooldown;
- threshold hysteresis;
- preventing same-tick repeated switches.

Do not accidentally eliminate intentional loops.

The goal is to prevent jitter, not to prevent state-machine behavior.

---

### 10.7 Add conditions needed by approved stances

The Rune condition vocabulary must support the approved stance designs.

Likely needs include:

- own HP below threshold;
- own HP above threshold;
- target HP below threshold;
- number of enemies currently engaging / surrounding;
- out of combat;
- first engagement / first hit / opener state;
- possibly debuffed;
- possibly dangerous enemy action / target casting.

Reuse existing conditions where appropriate.

Do not add every conceivable condition at once. Add what is needed for the implemented stance cast.

---

### 10.8 Predator requires engagement-state support

Predator needs a reliable notion of:

- out of combat;
- enemy detection / aggro acquisition;
- first strike or first attack after entering engagement.

The implementation should avoid brittle time-based approximations if an explicit engagement transition can be represented cleanly.

---

### 10.9 Brawler requires authoritative enemy-count semantics

Define exactly what counts as "surrounding" or "engaging" the player.

Prefer an existing authoritative aggro/engagement concept rather than raw nearby-monster count.

The effect should use a capped or diminishing scaling model.

---

### 10.10 Berserker self-damage must be deterministic

The game is deterministic.

Berserker self-damage must therefore be:

- fixed periodic damage;
- fixed continuous-rate damage;
- or another deterministic formula.

No random proc chance.

It should be clearly identified as self-inflicted stance damage so unrelated combat systems can decide whether it interacts with:

- on-damage triggers;
- shields;
- mitigation;
- healing;
- kill attribution.

The implementation plan must define this explicitly.

---

### 10.11 Recuperating must integrate with existing recovery systems

Recuperating should reuse the game's recovery vocabulary rather than invent an unrelated healing engine.

It must interact coherently with:

- OOC regeneration;
- in-combat regeneration;
- anti-heal / healing reduction;
- recovery gear;
- DoT pressure;
- existing recovery caps or diminishing returns.

It should not silently bypass healing-reduction mechanics.

---

## 11. UI / Player Feedback Requirements

The player needs to understand their stance state graph.

At minimum, expose:

- currently active stance;
- equipped/available stances;
- each stance's tradeoffs;
- stance-specific Rune cost;
- Rune rule destination stance;
- total RP cost of the rule.

A stance switch should have visible feedback.

Possible surfaces:

- HUD stance indicator;
- brief stance-change animation or icon pulse;
- combat-log entry;
- world feedback where appropriate.

The player should be able to tell:

> what stance is active<br>
> why it changed<br>
> what tradeoff is now active

The UI does not need to literally render a graph in the first implementation.

---

## 12. Migration / Existing Placeholder Content

The current live stance catalog contains placeholder:

- Offensive Stance;
- Defensive Stance;
- Tanking Stance.

These IDs can be reused if convenient, provided their definitions are updated to the approved design.

Offensive and Defensive remain useful as introductory content.

Tanking should be redesigned toward the much more extreme identity described above.

Any ID changes must be normalized during persistence hydration so stale equipped/active stance IDs cannot survive.

---

## 13. Balance Guidance

Do not lock final numerical values during structural implementation.

Use provisional values that clearly express each stance's identity.

Priorities:

1. The stance should visibly change combat behavior.
2. Its drawback should be meaningful.
3. The intended transition should make sense.
4. RP cost should roughly reflect how transformative the stance is.
5. Final tuning should be performed after the system can be simulated/playtested.

Avoid timid placeholder values on identity-defining stances.

For example:

- Tanking should feel dramatically safer and dramatically slower.
- Berserker should meaningfully accelerate both damage output and self-risk.
- Recuperating should visibly alter the survival trajectory.
- Predator should make the opener meaningfully distinct.
- Brawler should visibly react to enemy count.

The implementation should make the identities testable before fine balance is attempted.

---

## 14. Acceptance Criteria

The rework is successful when all of the following are true:

### System

- Multiple stance destinations can participate in one build.
- Rune rules can select a target stance.
- Target stance power can contribute to RP cost.
- Switching preserves unrelated combat state.
- Anti-thrash behavior is stable but intentional loops remain possible.
- The client clearly displays the active stance and automation cost.

### Content

The implemented catalog contains the approved cast:

- Offensive
- Defensive
- Tanking
- Enraged
- Perfection
- Fleeting
- Berserker
- Recuperating
- Predator
- Brawler
- Execute

If implementation is staged by tier, later-tier stances may be authored but gated.

### Design behavior

At least several distinct stance graphs should be viable in tests, for example:

```text
Predator -> Berserker -> Enraged
```

```text
Berserker -> Tanking
```

```text
Recuperating -> Perfection
```

```text
Brawler -> offensive stance as enemy count falls
```

There must not be one obviously universal stance sequence that dominates all builds and encounters.

---

## 15. Non-Goals

Do not use this rework to add:

- a separate stance currency/resource;
- manual real-time stance micromanagement;
- random stance procs;
- generic boss-only stance bonuses;
- generic single-target stance bonuses;
- generic AoE damage stance;
- large unrelated Rune redesigns;
- final production balance numbers.

The goal is to make Stances a deep **Rune-driven modal combat system**, not to expand scope into every adjacent system.

---

## 16. One-Sentence Design Rule

When evaluating future stance content, use this test:

> **A good stance creates a temporary combat mode with a meaningful tradeoff, whose value changes as the fight changes, and which creates an interesting Rune-driven reason to enter or leave it.**
