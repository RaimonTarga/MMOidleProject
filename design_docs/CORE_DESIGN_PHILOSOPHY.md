# Core Design Philosophy

## Status

**Locked design foundation for implementation.**

This document defines the role, eligibility rules, progression model, evolution boundaries, and balancing principles for Core items. It does not lock final formulas or balance values.

> **Tier terminology:** This document uses player-facing tiers. Internal progression references may be one tier lower because implementation begins at Tier 0. Player-facing Tier 2 is Frame selection, Tier 3 is Range selection, and Tier 4 is Path selection.

---

## 1. Purpose of Cores

Cores are build-defining equipment items that **multiply and magnify an existing combat archetype**.

A Core should improve the scale, frequency, duration, reliability, or situational strength of stats, abilities, and mechanics the build already possesses. It should not normally add a separate active payoff layer.

Techniques provide active combat payoffs. Paths define mechanical specialization. Cores reinforce and reshape the value of those systems.

Every specialized Core should answer:

1. What does this build become unusually good at?
2. Which existing stats, skills, or mechanics does it magnify?
3. What weakness, limitation, or opportunity cost remains?
4. Which deterministic automated behavior does it reward?

---

## 2. Magnifier Rule

The default rule is:

> **A Core may alter the magnitude, duration, frequency, cooldown, targeting condition, or stat scaling of an existing mechanic. It should not normally create a new attack, detonation, resource loop, active payoff, or standalone combat subsystem.**

Healthy Core effects include:

- Increasing damage, eHP, recovery, movement, or attack speed
- Increasing buff, debuff, DoT, on-hit, shield, guard, or healing potency
- Increasing the duration of an existing effect
- Reducing the cooldown of an existing ability
- Partially refunding or resetting an existing skill under a deterministic condition
- Increasing damage at greater range
- Increasing effectiveness against the same target over time
- Amplifying an existing effect while a buff, defensive skill, or mobility skill is active
- Strengthening an existing AoE or spreading mechanic without creating one

Effects normally reserved for Techniques or Paths include:

- Consuming DoTs to create a new explosion
- Creating a new projectile, nova, summon, or counterattack
- Adding a new mark-and-detonate loop
- Adding a new resource and payoff cycle
- Adding a new active action the build did not previously possess

Rare transformative Cores may break this rule, but they are exceptions and must be checked carefully for overlap with Techniques and Paths.

---

## 3. Core Eligibility Categories

### 3.1 Melee Cores

**Eligibility:** Close-range builds only.

Melee Cores compensate for the structural cost of remaining in contact range. They may combine offense, durability, mobility, threat control, and sustained-contact benefits more aggressively than unrestricted Cores.

Protected melee design space includes:

- Dedicated tanking
- High contact durability
- Taunt and threat support
- Gap-closing and target-to-target momentum
- Benefits from sustained enemy pressure
- Single-target commitment against elites and bosses
- Melee offense combined with enough bulk to maintain uptime

Dedicated tanking remains melee-only. Other ranges may improve survivability through unrestricted Cores, but should not reproduce the full mitigation and threat-control package of a melee tank.

### 3.2 Ranged Cores

**Eligibility:** Mid-range and far-range builds.

“Ranged” means non-melee positional combat, not exclusively maximum distance. Mid- and far-range builds may use the same Cores, while their operating distance and class behavior determine how effectively they exploit them.

Ranged design space includes:

- High positional damage
- Sacrificing eHP for offense
- Mobility and spacing
- Safe damage uptime
- Distance-dependent amplification
- Trading peak damage against reliability

### 3.3 Unrestricted Cores

**Eligibility:** All ranges.

Unrestricted Cores support systems that do not inherently belong to one range.

Their design space includes:

- Generalist stats
- Recovery and defensive abilities
- Ability cooldowns and potency
- Attack speed
- Buff potency and duration
- Debuff potency and duration
- DoT potency and duration
- On-hit potency
- Heavy-hit amplification
- Summons and AoE later, where supported

Unrestricted Cores normally have a lower raw-stat ceiling than restricted Cores, but may still be strongly build-defining through synergy.

---

## 4. Binary Eligibility

Core eligibility is binary.

- An eligible Core applies its full effect.
- An ineligible Core applies no effect.
- There is no half-strength or quarter-strength off-range scaling.

Binary eligibility keeps tooltips, simulation, automation, and build comparison clear.

---

## 5. Progression Introduction

### Tier 2: Core Introduction

The Core slot appears at Tier 2, alongside or following Frame selection.

Only a small unrestricted starter cast is available:

- Balanced general performance
- Universal survivability and recovery
- Universal offense

These Cores introduce the slot before the player has selected a range.

### Tier 3: Restricted Archetypes

Melee and Ranged Cores unlock after Range selection.

- Close-range builds may equip Melee or Unrestricted Cores.
- Mid-range builds may equip Ranged or Unrestricted Cores.
- Far-range builds may equip Ranged or Unrestricted Cores.

Tier 3 establishes broad archetypes and their main tradeoffs.

### Tier 4: Path and Mechanic Interaction

At Tier 4, Cores begin interacting more strongly with the chosen Path and established mechanics.

This may include:

- Buff, debuff, DoT, on-hit, or ability-potency specialization
- Deterministic cooldown refunds
- Conditional stat amplification
- Evolution branches
- Stronger compatibility with broad mechanic families

A bespoke Core for every Path is not required. Broad compatibility is preferred.

### Later Tiers: Specialization

Later ranks may:

- Increase the original stat emphasis
- Add a deterministic condition matching the archetype
- Amplify a related skill category
- Branch into narrower encounter or build profiles
- Upgrade partial cooldown refunds into full resets under narrow conditions

Evolution should deepen the existing archetype rather than replace it with a new minigame.

---

## 6. Evolution Levers

Core evolutions should primarily use the following levers.

### Stronger stat emphasis

Increase the established profile without changing its role.

### Conditional amplification

Reward the behavior the Core already encourages, such as:

- Greater distance
- Maintaining the same target
- Remaining in sustained combat
- Being below a fixed health threshold
- Having an existing buff active
- Using an existing mobility or defensive skill
- Killing an enemy

### Cooldown manipulation

Modify skills already equipped by the player:

- Flat cooldown reduction
- Fixed cooldown recovery
- Partial refund after a deterministic event
- Full reset under a narrow high-tier condition
- Category-specific cooldown support

### Existing-effect potency

Increase designated scalable values such as:

- Buff potency or duration
- Debuff potency or duration
- DoT potency or duration
- Defensive ability potency or duration
- Healing, regeneration, or shield potency
- Taunt duration
- Mobility effectiveness
- On-hit potency

Buff potency should apply only to explicitly scalable effect fields. It should not blindly multiply every parameter of every buff.

### Existing-stat scaling

Allow an existing attack, ability, or effect to gain more value from a stat already central to the archetype, such as health or plating for a late Juggernaut branch.

---

## 7. Idle and Deterministic Rules

The game is primarily idle and deterministic. Core mechanics must function reliably under automation.

Preferred patterns:

- Fixed multipliers
- Every N attacks
- Fixed cooldown reductions or refunds
- Deterministic stacks
- Stable distance bands
- Same-target conditions
- Fixed health thresholds
- Predictable effects after automated mobility or defensive-skill use
- Fixed-duration bonuses with reliable triggers

Avoid:

- Critical chance
- Random procs
- Chance-based resets
- Narrow reaction windows
- Manual target switching requirements
- Reflex-dependent guards or parries
- Positional demands the combat automation cannot reproduce

The main player decision occurs during build construction, not during constant manual correction.

---

## 8. Opportunity Costs

Not every specialized Core needs an explicit negative stat. Occupying the Core slot and providing little value outside its intended build may be sufficient.

Examples of structural costs:

- Juggernaut clears slowly.
- Bruiser relies on kill momentum and loses value against bosses.
- Duelist loses value against crowds.
- Sniper struggles when enemies close distance.
- Scout gives up peak damage for reliable uptime.
- Arcanist provides little value when abilities are a minor part of the build.
- Controller provides little value without meaningful debuffs.
- Survivalist survives attrition but remains vulnerable to burst.

Explicit penalties remain appropriate when they clarify or enforce the intended tradeoff, but should not be added automatically.

---

## 9. Power Budget

Restricted Cores receive a higher situational power budget than unrestricted Cores.

### Tier 2 unrestricted starter

- Roughly 8–15% on a major stat
- Roughly 10–15% total effective build power
- Minimal mechanical complexity

### Tier 3 unrestricted specialist

- Roughly 15–25% on the primary mechanic
- An explicit penalty only where necessary
- Roughly 15–25% effective power in the intended build

### Tier 3 restricted specialist

- Roughly 20–30% on the primary axis
- Sometimes an additional 10–20% supporting benefit
- A meaningful weakness, condition, or situational limitation
- Roughly 20–35% effective power in the intended scenario

These are design bands, not final balance targets.

---

## 10. Defensive Balance

Maximum HP, plating, ordinary damage reduction, Core-layer damage reduction, recovery, and defensive abilities may compound. Defensive Cores must be evaluated as complete survivability packages.

Use:

- Effective health against representative enemies
- Time to death
- Recovery-adjusted survival
- Burst survival
- Damage sacrificed
- Party pressure sustained

A dedicated Tier 3 melee tank may target roughly 40–60% greater effective survivability in its intended matchup after all layers are included.

An unrestricted Survivalist may target roughly 20–35% better long-duration survival, primarily through recovery and defensive abilities, while remaining substantially weaker against burst.

An isolated 20% true reduction in total incoming damage is already a major benefit.

---

## 11. Generalist Role

A straightforward generalist Core is part of the system.

It should:

- Provide a safe default
- Support hybrid or unusual builds
- Establish a balance benchmark
- Prevent specialization from being mandatory
- Offer a low-complexity option

It should never be a trap, but should not outperform a mature specialist in ideal conditions.

---

## 12. Survivalist and Tank Separation

### Melee tank

- Prevents or heavily mitigates damage
- Supports sustained enemy focus
- May improve taunt and threat control
- Sacrifices offense or tempo
- Can serve as a dedicated party tank

### Survivalist

- Recovers from damage
- Improves existing defensive abilities
- Supports attrition survival at any range
- Does not reproduce melee tank mitigation
- Remains vulnerable to burst or concentrated pressure

---

## 13. AoE, Summons, and Party Scope

Dedicated AoE, summon, and party-exclusive Core families are deferred.

When introduced, they should follow the magnifier rule:

- An AoE Core strengthens existing area size, target count, or AoE damage; it does not create AoE by itself.
- A summon Core strengthens existing summons; it does not create a new summon loop.
- A party Core strengthens existing taunts, buffs, healing, shielding, or ally effects; it does not substitute for a full support system.

---

## 14. Implementation Boundary

The current system already supports passive multipliers to attack, maximum HP, plating, movement speed, attack speed, HP regeneration, and a separate Core damage-reduction layer.

Specialized designs may require new deterministic passive keys and consumers, including:

- Ability cooldown and potency
- Defensive ability cooldown, duration, and potency
- Taunt duration or cooldown
- Mobility cooldown refund on kill
- Same-target amplification
- Distance-dependent damage
- Buff potency and duration
- Debuff potency and duration
- DoT potency and duration
- On-hit potency
- Heavy-hit support

Implementation should distinguish between:

1. Stat-only Cores using existing systems
2. Cores requiring a new passive key or formula
3. Cores requiring deterministic combat-time state or triggers
4. Numerical tuning handled during balance passes

---

## 15. Locked Summary

- Cores multiply and magnify existing combat systems.
- Techniques own active payoffs; Paths own mechanic specialization.
- New attacks, detonations, resources, and payoff loops are normally outside Core scope.
- The eligibility categories are Melee, Ranged, and Unrestricted.
- Melee Cores are Close-only.
- Ranged Cores work for Mid and Far range.
- Unrestricted Cores work for all ranges.
- Eligibility is binary.
- Cores begin at Tier 2 through unrestricted starters.
- Restricted archetypes unlock at Tier 3.
- Tier 4 begins stronger Path and mechanic interaction.
- Evolution uses stat growth, conditional amplification, cooldown manipulation, potency, duration, and existing-stat scaling.
- Full skill resets may exist at high tiers under narrow deterministic conditions.
- Dedicated tanking remains melee-exclusive.
- Survivalist emphasizes recovery and defensive skills rather than tank mitigation.
- Explicit penalties are used only when needed; opportunity cost may be sufficient.
- All designs must work under idle automation and deterministic combat.
- AoE, summons, and party-specific families remain deferred.
- Exact numerical values remain subject to implementation and balance passes.
