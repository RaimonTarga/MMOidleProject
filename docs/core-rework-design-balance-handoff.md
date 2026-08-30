# Core Rework — Design & Balance Handoff

**Status:** Approved design direction for implementation planning  
**Purpose:** Source document for Codex/Sol to produce an implementation plan, followed by implementation with a smaller coding model.  
**Basis:** `cores-current-state-and-rework-context.md` plus the design decisions locked in the follow-up review.  
**Scope:** Rebalance and selectively redesign the existing Core cast so the Core slot delivers a true capstone power spike. Preserve the existing magnifier philosophy. Do not implement the full evolution system in this pass unless required by the planner for scaffolding.

---

## 1. Core Role

Cores are **capstone equipment**.

They are supposed to create a major, immediately noticeable power spike and strongly reinforce the build the player has already chosen.

The defining rule is:

> **Cores magnify an existing build engine. They should usually increase the magnitude, reliability, frequency, duration, reach, recovery, or situational effectiveness of mechanics the character already has.**

Cores should generally **not** create a new active payoff layer.

That space already belongs to:
- Techniques / abilities;
- class paths/specs;
- relics where appropriate;
- stances and their rune-driven modal logic;
- other dedicated combat systems.

Rare transformative Cores may exist later, but they should remain exceptions.

---

## 2. Core Arithmetic Philosophy

### 2.1 Core bonuses should be multiplicative with the class chassis

This is a locked design rule.

The current stat pipeline already supports the desired behavior for major stat multipliers:

```text
finished base/gear stats
× class affinity multiplier
× stance multiplier
× archetype-specific layer
× Core multiplier
```

This is the correct model.

Core bonuses should **not** be merged into the same additive percentage bucket as class bonuses.

Example:

```text
Class damage multiplier: ×1.80
Core damage multiplier:  ×1.30

Final combined multiplier:
1.80 × 1.30 = 2.34
```

not:

```text
1 + 0.80 + 0.30 = 2.10
```

The Core must preserve the real marginal impact advertised by its own percentage.

### 2.2 Cores should magnify investment

Cores are intentionally allowed to be "rich get richer" within a specialization.

A character that already invested heavily into:
- damage;
- recovery;
- mitigation;
- on-hit;
- abilities;
- debuffs;
- mobility;
- range;

should often gain **more absolute value** from the matching Core.

That is not a balance failure.

That is the purpose of a capstone magnifier.

### 2.3 Defensive Cores should also use multiplicative layers

The same philosophy applies defensively.

The existing Juggernaut second DR layer is a good precedent:

```text
damage taken
× normal DR layer
× Core DR layer
```

rather than summing everything into one DR bucket.

Defensive capstone Cores should be allowed to meaningfully amplify an already-defensive build.

### 2.4 Do not invent one universal "Core potency" stat

Use semantic multiplier axes.

Examples:
- attack multiplier;
- recovery multiplier;
- ability potency;
- ability cooldown;
- debuff potency/duration;
- on-hit potency;
- movement/range;
- mitigation;
- future buff potency.

Do not create one generic `corePowerPct` abstraction that means unrelated things across every build.

---

## 3. Target Power Bands

The current cast is structurally healthy but numerically too conservative for a capstone slot.

Use these as first-pass target bands.

### T2 introductory Cores

Target:

> **~15–25% effective total power**

These Cores can remain simple.

They introduce the slot and should be immediately noticeable without being as specialized as later Cores.

### T3 specialist Cores

Target in ordinary relevant use:

> **~25–35% effective power**

Target in the Core's ideal intended scenario:

> **~35–50% effective power**

This can come from one very large multiplier or several compounded effects.

Do not interpret this as "every Core needs +40% attack."

Examples:
- Juggernaut can reach the band through effective survivability;
- Arcanist through cooldown + potency;
- Controller through stronger/longer debuffs;
- Catalyst through high on-hit amplification;
- Sniper through extreme offense-for-fragility tradeoff.

### Future evolved / T4+ Cores

Transformative late Cores may exceed:

> **50% effective power in their specialization**

when the opportunity cost, specialization requirement, or downside justifies it.

This is intentionally aggressive.

A capstone system should not be tuned like a normal equipment slot.

---

## 4. Tradeoff Philosophy

Existing Core tradeoffs are conceptually healthy.

Do not redesign tradeoff Cores merely because they contain downsides.

However, the rework may push tradeoffs somewhat further if needed to support a stronger primary axis.

Specialist Cores are allowed to be polarized.

A Core can reasonably say:

> "Become dramatically better at the thing this build wants, and meaningfully worse elsewhere."

This is preferable to timid bonuses that fail to create a capstone moment.

---

## 5. Summoner Interaction Rule

Generic stat amplification should propagate naturally through summons when summons scale from the owner's stats.

That is desirable.

However:

> **Event-specific Core effects should not automatically count minion attacks/kills as player events unless that interaction is explicitly designed.**

The current behavior where some on-hit/on-kill Core hooks inherit minion events through generic `attackerType: "player"` attribution should be treated as an implementation issue to review.

Default rule:
- owner stat multiplier -> summons inherit normally;
- explicit event-trigger Core effect -> summons only inherit if authored intentionally.

Do not balance the base Core cast around accidental attribution.

---

## 6. Current Cast — Design Direction

The shipped cast contains 12 Cores:

1. Tempered
2. Survivalist
3. Force
4. Duelist
5. Juggernaut
6. Arcanist
7. Controller
8. Scout
9. Sniper
10. Bruiser
11. Accelerant
12. Catalyst

The first-pass goal is to preserve the recognizable identity of this cast while raising impact substantially and selectively fixing narrow or binary mechanics.

Exact values should be proposed during implementation planning and then validated in benches/playtests.

---

## 7. Tempered Core

### Role
Introductory unrestricted generalist.

### Current concept
- attack multiplier;
- max HP multiplier.

### Rework direction
Keep it simple.

Raise its total impact into the T2 introductory band.

It should communicate:

> "This is what a Core feels like: the entire character just became noticeably stronger."

Do not turn Tempered into a complex specialist.

It should remain broadly useful but intentionally less efficient than a correctly matched specialist Core.

---

## 8. Survivalist Core

### Role
Introductory unrestricted durability/recovery Core.

### Current concept
- recovery multiplier;
- max HP multiplier.

### Rework direction
Keep the identity.

Increase its effective survivability/recovery enough to clearly feel like a capstone.

This Core is an important precedent for future recovery-focused Core designs.

Recovery should remain multiplicative with the finished recovery stat.

---

## 9. Force Core

### Role
Introductory aggressive tradeoff Core.

### Current concept
- attack multiplier;
- max HP penalty.

### Rework direction
Keep it simple and aggressive.

The attack benefit can move substantially upward while the survivability downside may also become somewhat more meaningful.

It does not need a large evolution family in the first pass.

Force may remain a deliberately straightforward starter Core.

---

## 10. Duelist Core

### Current issue
The current elite/boss-specific damage multiplier is too binary.

It creates an obvious encounter tag:

```text
fighting boss/elite -> Duelist
otherwise -> not Duelist
```

That is less expressive than the rest of the cast.

### Rework direction
Preserve the identity of **focused pressure against one important opponent**, but make it more generally useful than a literal `elite/isBoss` flag.

The implementation planner should explore a mechanic that rewards sustained focus or single-opponent pressure without simply checking the monster's category.

Potential design territory:
- increasing effectiveness while maintaining the same target;
- increasing damage as focus on one target continues;
- stronger direct pressure under a condition that can occur against ordinary tough enemies as well as bosses;
- another deterministic "focused combat" rule.

Do not turn Duelist into a generic permanent damage Core.

Do not lock the exact mechanic until the implementation planner inspects available combat-state hooks.

The reworked Duelist should still be especially attractive in long single-target fights, including bosses, without being a binary boss-only item.

---

## 11. Juggernaut Core

### Role
Heavy defensive capstone.

### Current concept
- max HP;
- plating;
- independent DR layer;
- attack-speed penalty;
- movement penalty.

### Rework direction
This is one of the strongest concepts in the current cast.

Keep the layered defensive structure.

Push the total effective survivability toward the specialist Core target band.

It should feel like:

> "My character became a wall."

The existing independent Core DR layer is philosophically correct and should remain multiplicative with the character's underlying defense.

The mobility/offense penalties may be pushed somewhat further if required to support a much stronger defensive payoff.

---

## 12. Arcanist Core

### Role
Ability / Technique amplifier.

### Current concept
- Technique cooldown reduction;
- Technique potency.

### Rework direction
Keep both axes and make them significantly stronger.

This is a textbook Core:

> "I already invested in abilities; now the Core magnifies that entire subsystem."

Arcanist does **not** need an arbitrary direct-attack penalty by default.

The opportunity cost is already the Core slot.

Target a genuinely noticeable increase in:
- ability frequency;
- ability impact.

Use multiplicative potency semantics where appropriate.

---

## 13. Controller Core

### Role
Debuff amplifier.

### Current concept
- debuff duration;
- debuff potency.

### Rework direction
Keep the identity.

Controller should be a premium amplifier for builds that already apply scalable debuffs.

It should not grant new debuffs.

Increase the magnitude enough that a debuff-centered build clearly notices the Core.

Preserve allow-list / semantic scaling so incompatible or monster-owned effects are not accidentally amplified.

---

## 14. Scout Core

### Role
Fast ranged / mobile specialist.

### Current concept
- attack;
- movement speed;
- mobility ability cooldown reduction;
- max HP penalty.

### Rework direction
Keep the current general identity.

The mobility cooldown interaction is currently narrow because only a very small ability set is tagged as mobility.

Therefore:

> **Do not budget most of Scout's power around the mobility-tag hook yet.**

Its main stat package should already justify the Core.

The mobility interaction can remain a flavorful secondary bonus that grows naturally as more mobility abilities are added.

---

## 15. Sniper Core

### Role
Extreme ranged offense-for-fragility specialist.

### Current concept
- large attack multiplier;
- max HP penalty;
- plating penalty.

### Rework direction
Keep the polarization and consider pushing it further.

Sniper should feel like a major offensive commitment.

It is acceptable for this Core to be genuinely dangerous to use.

### Future evolution design space

Do not necessarily implement these branches in this pass, but preserve support for them.

Strong future Sniper evolution directions include:

#### Increased range
Directly increase attack range.

Range is an expensive stat and therefore appropriate for an evolved capstone effect.

#### Distance scaling
Increase damage or another offensive property based on engagement distance.

This should be deterministic and use real range/distance, not a boss tag.

Example conceptual rule:

> The farther the player is from the target, the stronger the offensive amplification, up to a cap.

This is especially attractive because it magnifies the existing ranged-build commitment rather than creating a new payoff engine.

Possible evolution identities:
- Longshot;
- Entrenched;
- extreme Glass Cannon;
- range-focused specialization.

Do not implement these before the range/distance hook is designed cleanly.

---

## 16. Bruiser Core

### Role
Aggressive melee momentum Core.

### Current concept
- attack;
- max HP;
- movement speed;
- mobility cooldown refund on kill.

### Rework direction
Keep the concept.

Like Scout, the mobility hook is currently narrow.

Do not make the Core's entire budget depend on one ability tag.

The core stat package should be strong enough to carry the identity.

The on-kill mobility refund can remain a secondary magnifier for builds that support it.

Review summon kill attribution per the general Summoner rule.

---

## 17. Accelerant Core

### Role
Attack-speed specialist.

### Current concept
- strong attack-speed multiplier;
- attack penalty.

### Rework direction
Keep the tradeoff structure.

Push it toward a meaningful specialization:

> "I convert per-hit strength into dramatically higher action frequency."

Do not remove the attack penalty merely to make it universally good.

The planner should validate interaction with:
- Reload;
- attack-speed caps/floors;
- empowered mechanics;
- on-hit builds;
- class mechanics whose output responds differently to attack cadence.

Particular care is required for builds that hard-set attack cadence and therefore may not benefit normally.

---

## 18. Catalyst Core

### Role
Premium on-hit amplifier.

### Current issue
The current Core is extremely narrow because many builds have little or no on-hit damage.

This is acceptable **if the build system increasingly provides more on-hit sources**.

That is now an explicit design assumption.

### Locked direction
Keep Catalyst narrow.

Do **not** give it generic base damage simply to make it useful to every build.

Cores are amplifiers, not providers of the mechanic they are supposed to amplify.

A build with no on-hit investment should not want Catalyst.

A build with heavy on-hit investment should want it strongly.

The broader game is expected to add more on-hit sources across:
- equipment;
- class options;
- other build systems.

Therefore Catalyst can remain a specialist Core and should be tuned to be very strong in its intended audience.

The UI should make its specialization obvious enough that it does not become an accidental trap.

---

## 19. Future Recovery-Tank Core Family

There is approved future design space for **heavy tanking Cores centered on recovery**, especially for raid-boss and high-tier group content.

This is likely T4 or later rather than part of the immediate base-cast rebalance.

### Intended fantasy
A tank can deliberately sacrifice damage output to become capable of surviving prolonged boss pressure.

Possible axes include:
- drastically reduced damage dealt;
- very large max HP amplification;
- independent mitigation layers;
- very large recovery multiplier;
- enabling more recovery during combat;
- improving healing received;
- improving recovery efficiency under sustained boss pressure.

### Design goal
These Cores should support true tank builds for future raid bosses:

> "I am not here to kill the boss quickly. I am here to remain alive while it tries to kill me."

This is distinct from ordinary Juggernaut if Juggernaut remains a broadly defensive heavy Core.

Future recovery-tank variants can specialize more strongly around **sustain throughput**.

### Important balance principle
The game may allow these Cores to become extremely powerful defensively because later bosses can answer them through:
- escalating damage;
- anti-heal;
- DoT pressure;
- burst windows;
- defense breaks;
- mechanics that punish indefinite stalling.

Do not pre-emptively make recovery-tank Cores timid solely because indefinite sustain is theoretically possible in simpler encounters.

Their tier placement and enemy complexity are part of their balance.

---

## 20. Future Evolution Philosophy

Evolution is not the primary implementation goal of this pass.

However, future Core evolution should follow these rules.

### Evolutions should sharpen or redirect the magnifier

Healthy evolution examples:
- Sniper -> more range;
- Sniper -> stronger distance scaling;
- Arcanist -> stronger cooldown focus;
- Arcanist -> stronger potency focus;
- Juggernaut -> heavier raw mitigation;
- Juggernaut -> recovery-tank specialization;
- Controller -> duration specialization;
- Controller -> potency specialization.

### Evolution may add conditional amplification

Examples:
- more damage at longer range;
- cooldown refund under a deterministic condition;
- stronger skill under a clearly defined state;
- recovery amplification during sustained combat.

### Evolution should usually not create a new active payoff layer

Avoid turning evolution into:
- new attacks;
- detonations;
- standalone resources;
- entirely new combat minigames.

The evolution should still feel like:

> "My existing Core became a more specialized magnifier."

---

## 21. DoT Core Policy

Do not add a generic DoT potency Core in this pass.

DoT output already scales from the owner's attack, which is already amplified by attack Cores.

A second generic DoT multiplier on the same output risks becoming:
- mandatory for DoT builds;
- or intentionally weak enough to become a trap.

If future DoT-specific Core content is revisited, it should amplify a distinct DoT behavior rather than simply stack another generic damage multiplier onto the same base.

---

## 22. New Multiplier Axes

The implementation planner should only add new multiplier infrastructure where an actual Core needs it.

Likely useful future axes include:
- ability potency;
- recovery;
- debuff potency;
- buff potency;
- distance/range scaling;
- on-hit potency;
- healing received;
- sustained-combat recovery.

Do not build all possible axes preemptively.

---

## 23. Numerical Tuning Method

Do not tune only by reading authored percentages.

For every Core, estimate or benchmark **effective value in its intended build**.

### Offensive Core
Measure:

```text
DPS with Core / DPS without Core - 1
```

### Defensive Core
Measure:

```text
effective survivability with Core / baseline survivability - 1
```

using representative threat shapes where possible.

### Ability Core
Measure both:
- ability output per use;
- ability use frequency;
- resulting total contribution over representative fight lengths.

### Conditional Core
Measure:
- ordinary-use value;
- ideal-scenario value;
- uptime / applicability.

The target bands in §3 refer to **effective impact**, not tooltip arithmetic.

---

## 24. Required Implementation Review

The implementation plan should explicitly inspect and address the following.

### Multiplier ordering
Add tests that lock the intended ordering:

```text
class
× stance
× archetype-specific layer
× Core
```

for relevant stats.

### Summon attribution
Separate generic stat inheritance from explicit event-trigger ownership.

### Mid-combat equip side effects
Current generic Core equip/recalc resets several unrelated combat ramps/counters.

Decide whether:
- Core swapping should be blocked/restricted in combat;
- Core equip should intentionally reset state;
- or Core recalc should preserve unrelated state.

Do not leave this accidental.

### Bench Core selection
The current `coreScore()` absolute-magnitude heuristic may mis-rank large tradeoff Cores.

Review it before relying on automated build selection for balance reports.

### UI
Raw authored percentages are acceptable initially, but specialist conditions and tradeoffs must be explicit.

Catalyst in particular must clearly communicate that it amplifies **existing on-hit damage** and does not provide on-hit damage itself.

---

## 25. Base-Cast Implementation Priority

Recommended implementation order:

### Phase 1 — arithmetic / infrastructure safety
- lock multiplier ordering with tests;
- review Summoner event attribution;
- review equip/recalc state preservation;
- ensure all relevant Core keys have correct semantic application.

### Phase 2 — simple stat Cores
Retune:
- Tempered;
- Survivalist;
- Force;
- Juggernaut;
- Sniper;
- Accelerant.

These establish the new power bands quickly.

### Phase 3 — subsystem Cores
Retune and validate:
- Arcanist;
- Controller;
- Scout;
- Bruiser;
- Catalyst.

### Phase 4 — Duelist redesign
Replace the binary elite/boss condition with a more generally useful focused-target mechanic.

### Phase 5 — benchmark / playtest
Measure:
- T2 Core unlock power spike;
- T3 specialist value;
- intended vs unintended class interactions;
- specialist peak value;
- downside severity;
- Core choice diversity.

---

## 26. Acceptance Criteria

The pass succeeds when:

### Power
- T2 Cores create a clearly noticeable first capstone spike.
- T3 specialists feel substantially stronger than T2 generalists in the correct build.
- Correctly matched specialist Cores commonly reach roughly 35–50% effective impact in their intended scenario.

### Identity
- Every Core clearly magnifies an existing build axis.
- Catalyst remains an amplifier, not a source of on-hit damage.
- Arcanist meaningfully amplifies abilities.
- Controller meaningfully amplifies existing debuffs.
- Juggernaut feels dramatically defensive.
- Sniper feels dramatically offensive and fragile.
- Duelist no longer relies on a simple elite/boss category check.

### Arithmetic
- Core multipliers remain separate from and multiplicative with class bonuses.
- Defensive Core layers remain multiplicative where designed.
- No accidental additive dilution is introduced.

### Cross-system behavior
- summon inheritance is deliberate;
- subsystem-specific Cores do not silently benefit unrelated mechanics;
- mid-combat Core swapping has explicit semantics;
- automated balance tooling does not systematically mis-rank polarized Cores.

---

## 27. Deliberately Deferred

Do not over-expand this pass.

Deferred:
- full Core evolution implementation;
- full T4 Core roster;
- raid-tank Core implementation;
- buff-potency Core family;
- generic DoT Core;
- summon-specific Core family;
- party-specific Core family;
- all possible distance-scaling evolution branches;
- final long-term endgame power curve.

The current goal is:

> **Make the existing Core slot finally feel like a capstone system.**

---

## 28. One-Sentence Design Rule

> **A Core should take something the build already does and make it dramatically more important, with its main bonuses applied as a dedicated multiplicative capstone layer.**
