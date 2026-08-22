# T1 Item Design Philosophy — Base Cast Rework

**Status:** Locked design philosophy for the Clearing + five Tier 1 biome item cast  
**Scope:** Clearing, Plains, Forest, Swamp, Mountain, Caverns  
**Purpose:** Source-of-truth for the upcoming numerical item rebalance and implementation planning  
**Out of scope:** economy/crafting costs, final numerical item tuning, later-biome item redesign, core/relic balance, skill-number/evolution balance

---

## 1. Why this rework exists

The item system is being rebuilt around a clearer division of responsibility between character systems:

> **Gear establishes raw magnitude. Classes establish shape and affinity.**

The class tree is moving away from repeatedly adding large flat attack/HP/plating values and toward percentage-based class affinities. Equipment should therefore become the main source of the character's raw combat shell:

- weapons establish most raw offensive magnitude;
- armor establishes most raw defensive magnitude;
- charms establish the recovery/sustain shell;
- boots establish the movement/positioning shell.

Classes then amplify or reshape those item-provided stats according to their identity.

The current recipe cast already contains many strong identities, but the numbers and several mechanics were authored before the current class, skill, progression, and +0…+5 upgrade systems were finalized. The goal is to preserve the strongest identities, replace weaker or redundant ones, and establish a clean base vocabulary that later biomes can expand.

---

# 2. Scope: rebuild the base cast first

This pass covers only:

- **Clearing / Tier 0 tutorial**
- **Plains**
- **Forest**
- **Swamp**
- **Mountain**
- **Caverns**

Later-biome casts such as Jungle, Desert, Tundra, Volcano, Deep Sea Trench, and Wasteland are intentionally deferred.

The Clearing + five T1 biomes should establish the game's foundational item vocabulary. Later biomes should expand, recombine, specialize, or challenge those foundations rather than being used to define the basics retroactively.

Existing later-tier versions of the T1 item lineages are useful references for intended themes, but their current numbers are **not** authoritative for this rebalance.

---

# 3. Progression and upgrade philosophy

## 3.1 Same-tier baseline budget

With one deliberate exception, normal items belonging to the five Tier 1 biomes should have approximately the **same total power budget at +0**.

Biome order should not function as a hidden item-level ladder where Caverns +0 is automatically much stronger than Forest +0.

Instead, biome identity determines **where the budget is spent**.

Examples:

- Plains armor spends heavily on plating.
- Forest armor spends heavily on evasion.
- Swamp armor spends heavily on DoT defense.
- Mountain armor spends part of its budget on defensive-skill support.
- Cave armor spends on broadly applicable damage reduction.

The later biome may be encountered later, but that does not justify a larger baseline item budget by itself.

## 3.2 Plains weapon exception

The Plains weapon is a deliberate exception to equal-budget weapon design.

It should be:

- cheaper/easier to obtain;
- mechanically simple;
- broadly usable;
- somewhat below the normal raw weapon budget;
- relevant partly because of its generalist Technique support.

Its lower budget is intentional and acceptable because it is the earliest T1 weapon, Plains only remains a primary lineage for a limited number of tiers, and the weapon is meant to be an accessible all-purpose option rather than an optimized specialist.

Do not normalize the Plains weapon upward merely to make all weapons mathematically identical.

## 3.3 Linear +0 to +5 combat-power curve

The combat-power budget of an item increases linearly with upgrade level:

| Upgrade | Total power budget |
|---|---:|
| **+0** | 100% |
| **+1** | 110% |
| **+2** | 120% |
| **+3** | 130% |
| **+4** | 140% |
| **+5** | 150% |

This describes **combat power**, not crafting cost.

The economy may make later upgrades progressively more expensive, creating economic diminishing returns, but the combat-power progression itself should remain approximately linear.

Economy and upgrade costs are explicitly deferred.

## 3.4 Tier transitions

The final vertical progression rule must ensure that a new-tier +0 item is a genuine progression step beyond the previous tier's +5 item.

The exact handoff multiplier is **not locked in this document** because it should be calibrated against the monster curve and later-tier progression.

The structural invariant is locked:

> **Tier N+1 +0 must be meaningfully stronger than Tier N +5 within the same lineage/power role.**

The current recipes were not designed around +4/+5 and frequently violate this rule. The numerical pass must rebuild tier transitions rather than patching individual recipes.

---

# 4. Upgrade allocation philosophy

A +10% increase in total item budget does **not** mean every stat on the item must increase by 10%.

Upgrades should reinforce item identity.

> **Universal baseline stats grow across upgrades, while the item's signature stat/mechanic receives the strongest identity growth.**

For armor, Max HP is the main universal bulk stat and should generally improve across upgrades.

Percentage-based defenses such as evasion, damage reduction, and DoT resistance do not need to scale linearly with total item budget. Their marginal value can increase nonlinearly at high values, so they may grow more cautiously while HP or other raw stats absorb more of the upgrade budget.

Do not force mechanically different stats into identical upgrade curves.

---

# 5. Locked T1 item identity matrix

| Biome | Weapon | Armor | Charm / Recovery | Boots |
|---|---|---|---|---|
| **Plains** | Cheap generalist; Technique frequency/support | **Plating** | **Kill-chain Recovery** | **Speed after kill** |
| **Forest** | **Fast weapon** | **Evasion** | **Recovery / Recovery-skill specialist** | **Traversal / OOC mobility** |
| **Swamp** | **DoT-conversion weapon** | **DoT resistance / attrition defense** | **Periodic Recovery pulse** | **Slow resistance** |
| **Mountain** | **Slow heavy / empowered weapon** | **Defensive-skill amplification** | **Barrier** | **Gap closing toward target** |
| **Caverns** | **Chaotic high-output weapon with drawback** | **Generalist %DR armor** | **Absorb** | **Stealth / reduced detection** |

This matrix is the core design contract for the base cast.

---

# 6. Clearing / Tier 0 philosophy

Clearing items are tutorials.

They should be:

- easy to understand;
- mostly raw-stat based;
- mechanically low-complexity;
- clearly replaceable by Tier 1 specialization;
- useful for teaching what each equipment slot broadly does.

Conceptually:

- weapon: primitive raw offense;
- armor: simple general defense;
- charm: simple Recovery;
- boots: simple movement speed.

Clearing is allowed to be deliberately boring because its job is literacy, not build specialization.

---

# 7. Weapon philosophy

Weapons are the primary source of raw offensive magnitude and the main equipment avenue for investing harder into offensive/Technique play.

## 7.1 Plains — affordable generalist / Technique support

The Plains weapon should remain the accessible general-purpose weapon.

Identity:

- below normal specialist raw budget;
- simple and reliable;
- no highly restrictive class/build requirement;
- supports offensive Techniques in a broadly useful way.

Preferred support axis:

> **Technique cooldown recovery / Technique frequency**

This also matches Plains progression because the biome introduces an offensive AoE Technique.

Avoid making the Plains weapon the strongest raw-DPS choice.

## 7.2 Forest — attack-speed weapon

Forest owns the fast-weapon niche.

The weapon should emphasize:

- high attack cadence;
- lower damage per individual hit;
- natural synergy with mechanics that care about attack frequency;
- no requirement that the player build specifically around on-hit damage.

> **Fast does not mean on-hit-only.**

The weapon should support basic attacks, on-hit, class-resource generation, DoT application, and other attack-frequency mechanics naturally.

## 7.3 Swamp — DoT-conversion weapon

Swamp owns the foundational DoT-conversion weapon.

The weapon should:

- convert part of its attack into persistent damage;
- teach the player the DoT weapon archetype;
- remain usable outside the native DoT class;
- establish an equipment-based route into DoT gameplay.

The exact DoT formula and numerical conversion belong to the numerical balance pass.

## 7.4 Mountain — slow heavy / empowered weapon

Mountain owns the heavy-hit weapon archetype.

The weapon should emphasize:

- high damage per attack;
- low attack speed;
- strong interaction with empowered attacks / heavy class payoffs;
- deliberate, high-impact tempo.

Later lineage branches may divide this identity into different specializations, including a Technique-focused heavy weapon.

Technique cast speed is thematically appropriate because Mountain teaches a charged offensive skill, but final Technique-support magnitudes are deferred.

## 7.5 Caverns — chaotic high-output weapon

Caverns owns the high-output weapon with a structural drawback.

The weapon should offer:

- attractive above-normal offensive potential;
- a real reliability/tempo drawback;
- an identity that feels dangerous rather than simply efficient.

The existing dead-swing concept is a valid example: the weapon can be statistically attractive because some attacks fail structurally.

The final drawback and numbers will be validated in simulation.

---

# 8. Armor philosophy

Armor should provide meaningful defensive specialization without turning equipment into mandatory hard counters.

Every armor should retain enough universal bulk to function outside its best matchup.

Specialized armor is allowed to be clearly better in the environment it was designed to answer.

The armors are not required to provide identical effective HP against every monster profile.

## 8.1 Plains armor — plating

Plains armor teaches flat damage mitigation.

Identity:

- high plating;
- enough HP to remain functional;
- excellent against many small hits;
- weaker against rare very large attacks.

## 8.2 Forest armor — evasion

Forest armor teaches avoidance.

Identity:

- meaningful evasion from the moment the item is obtained;
- moderate universal bulk;
- particularly effective against frequent attacks and on-hit riders.

Evasion should start at a meaningful baseline rather than requiring several upgrades before the identity exists.

Upgrade scaling for evasion should be cautious because high evasion becomes increasingly powerful.

## 8.3 Swamp armor — DoT/attrition defense

Swamp armor is the specialist answer to persistent damage.

Identity:

- meaningful DoT resistance;
- enough HP/general defense to avoid becoming useless outside DoT encounters;
- later tiers may add broader attrition mechanics.

It is acceptable for this armor to be substantially more valuable in DoT-heavy environments.

The later hit-to-DoT conversion mechanic is intentionally **not** part of the T1 baseline. It is powerful and should remain a later specialization if retained.

## 8.4 Mountain armor — defensive-skill amplification

The current T1 max-hit/damage-cap armor mechanic is removed from the T1 design.

Reason:

- T1 does not yet contain enough truly enormous hits for the mechanic to be a natural foundational defense;
- the mechanic is interesting but better suited to a later tier where extreme spike damage is common enough to justify it.

The damage-cap / max-hit concept should be preserved as a candidate later-tier defensive mechanic.

The new T1 Mountain armor identity is:

> **Defensive-skill amplification**

Mountain teaches the strong temporary defensive Guard, so its armor should reinforce deliberate defensive windows.

Preferred generic axes include:

- defensive/Guard skill potency;
- potentially a smaller amount of defensive-skill cooldown recovery.

Do not hard-code the armor specifically to one named skill such as Brace.

Use skill categories/tags so future defensive skills can benefit where appropriate.

Cooldown recovery is a powerful throughput stat and should be treated more cautiously than potency.

## 8.5 Cave armor — premium generalist %DR

Caverns owns the broad all-rounder defensive armor.

Identity:

- good HP;
- some plating;
- meaningful percentage damage reduction;
- reliable performance across many incoming-damage profiles;
- rarely the absolute best specialist answer, but rarely bad.

"Premium all-rounder" means **breadth**, not a higher total budget.

Cave armor should not receive extra total item budget merely because Caverns is the final T1 biome.

---

# 9. Recovery as a canonical stat

Recovery is the canonical HP-restoration rate.

> **1 Recovery = 1% of maximum HP restored per second when Recovery is operating at 100% effectiveness.**

Examples:

- 5 Recovery at 100% activity = 5% max HP per second.
- 10 Recovery at 50% activity = 5% max HP per second.

Out of combat, after the game's normal recovery delay, the player receives **100% of their Recovery rate**.

The exact global OOC delay can be tuned later, but the conceptual rule is locked.

---

# 10. Recovery access during combat

In-combat healing effects should generally avoid independent fixed `% max HP` heal formulas.

Instead they should usually grant access to a stated fraction of the player's Recovery rate.

Conceptual formula:

```text
HP restored per second
= Max HP
× Recovery rate
× active Recovery fraction
```

Different active Recovery fractions from separate sources add together.

Example:

```text
Squire passive       10% Recovery
Plains kill buff     30% Recovery
Second Wind          50% Recovery
---------------------------------
Temporary total      90% Recovery
```

Do not multiply these fractions together.

No universal 100% cap is locked at this stage. Temporary access above 100% may be valid for highly specialized sustain builds and should be judged through simulation.

---

# 11. Recovery-based mechanics to standardize

Exact coefficients and cooldowns remain part of the numerical/skill passes.

## 11.1 Squire in-combat sustain

Squire's existing concept already fits the model:

> A small percentage of normal Recovery remains active continuously during combat.

This should remain Recovery-based.

## 11.2 Striker / Cadence recovery pulse

The current fixed-percent healing pulse should become:

> Periodically activate a fraction of Recovery for a short duration.

This preserves Striker's sustain identity while allowing Recovery investment to scale it naturally.

## 11.3 Second Wind

Second Wind should be redesigned from a fixed `% max HP over time` heal into:

> Activate a substantial fraction of the player's Recovery rate for a short duration.

Second Wind should therefore scale naturally with:

- the player's Recovery stat;
- Recovery-skill potency;
- future Recovery-related equipment.

Its exact heal fraction, duration, cooldown, and tier evolution are deferred to the dedicated skill-balance pass.

## 11.4 Plains charm — kill-chain Recovery

The Plains charm should no longer provide an instant percentage-max-HP heal on kill.

New identity:

> **A kill temporarily allows a fraction of the player's normal Recovery to remain active during combat.**

Rules:

- activates on kill;
- lasts for a limited duration;
- subsequent kills refresh the duration;
- repeated kills do **not** stack multiple copies;
- strongest in dense farming environments;
- weak against bosses and sparse single-target encounters.

## 11.5 Swamp charm — periodic Recovery pulse

The Swamp charm should inherit the periodic Recovery-burst concept previously associated with Cave.

Reason:

- Swamp's defining threat is DoT/attrition;
- the old direct-damage absorb effect does not help against DoT;
- periodic Recovery is a natural answer to persistent health loss regardless of damage source.

New identity:

> **At fixed intervals, activate a moderate fraction of Recovery for a short duration.**

This should be automatic, reliable, and weaker per activation than an active Recovery skill such as Second Wind.

---

# 12. Charm slot philosophy

The charm/recovery slot should always contribute meaningfully to sustain, but charms do not need identical amounts of raw Recovery.

> **Every charm may carry some Recovery value, but a significant part of its budget can be spent on its signature sustain mechanic.**

A charm with a powerful signature effect may have less raw Recovery than a dedicated Recovery charm.

---

# 13. Locked charm identities

## Clearing — pure Recovery tutorial

- raw Recovery;
- minimal or no special mechanic.

## Plains — chain-farming Recovery

- modest baseline Recovery;
- on-kill temporary in-combat Recovery;
- refreshes, does not stack.

Best when chaining dense encounters.

## Forest — Recovery / Recovery-skill specialist

Forest is the foundational investment into the Recovery stat itself.

Identity:

- comparatively strong raw Recovery;
- supports Recovery-tagged defensive skills;
- works broadly rather than only in one biome.

Preferred support axis:

> **Recovery Skill Potency**

Potential later evolutions may add Recovery-skill cooldown support, but exact mechanics are deferred.

Do not make this charm specifically say "Second Wind +X%."

It should support the **Recovery skill category**, allowing future Recovery skills to inherit the synergy.

## Swamp — periodic attrition Recovery

- moderate Recovery;
- automatic periodic activation of part of Recovery during combat;
- strong against DoT and persistent attrition.

This replaces the old Swamp absorb-charm identity.

## Mountain — Barrier

- low/moderate raw Recovery as appropriate to total budget;
- grants or improves the rechargeable Barrier resource;
- specialized against intermittent burst damage rather than continuous chip/DoT.

## Cave — Absorb

- moderate raw Recovery as appropriate;
- supports the game's dedicated Absorb mechanic;
- broadly useful against direct damage and prolonged combat;
- intentionally distinct from Recovery and Barrier.

This replaces Cave's old periodic-regen-burst charm identity.

---

# 14. Recovery Skill Potency

Recovery Skill Potency is a separate multiplier from the Recovery stat.

Recovery determines the underlying healing rate.

Recovery Skill Potency modifies how strongly a **Recovery-tagged skill** accesses that rate.

Conceptual example:

```text
Second Wind activates 50% Recovery.
Player has +20% Recovery Skill Potency.

Effective Second Wind fraction:
50% × 1.20 = 60% Recovery.
```

This preserves two separate build axes:

- **Recovery** improves general healing capability.
- **Recovery Skill Potency** rewards actively building around Recovery skills.

Do not make Recovery Skill Potency improve Barrier, Cleanse, damage reduction, or unrelated defensive mechanics.

---

# 15. Skill-tag interaction philosophy

Items are allowed to invest in the skill system, but dependencies should remain generic and maintainable.

> **Items support categories of skills. Items should not normally hard-code individual named skills.**

Useful semantic categories may include:

### Offensive / Technique
Examples:
- Sweep
- Expose Weakness
- Power Strike / charged strike

Possible sub-tags:
- AoE
- Debuff
- Charged
- Damage

### Defensive / Guard
Examples:
- Brace
- Second Wind
- Cleanse

Possible sub-tags:
- Mitigation
- Recovery
- Cleanse / Utility

This enables item effects such as:

- Technique cooldown recovery;
- Technique power;
- Defensive-skill potency;
- Recovery-skill potency;

without one-off effects for every individual skill.

---

# 16. Skill balance is explicitly deferred

This item philosophy may establish tags/hooks required for equipment interactions.

It must **not** decide:

- final Second Wind healing values;
- final Brace mitigation values;
- final Cleanse behavior by tier;
- Technique cooldowns;
- Technique damage;
- how many skill slots are unlocked at later tiers;
- final skill evolution progression.

Those questions belong to a dedicated skill-balance/evolution pass.

Do not rebalance skills merely to make an item work during the item implementation pass.

---

# 17. Cleanse philosophy

Cleanse currently removes **one stack of one debuff**.

This creates useful future scaling space, but the details are not being finalized in the T1 item pass.

Locked principles:

1. **Do not make a T1 charm whose main identity is "Cleanse +1 stack."**
2. Cleanse should evolve primarily in the dedicated skill pass.
3. The status system should eventually distinguish categories such as:
   - damage-over-time;
   - soft slows;
   - hard control;
   - non-control debuffs;
   - special encounter effects.
4. A single generic Cleanse should not necessarily be the optimal answer to every harmful status.
5. Multiple counterplay routes should exist where possible:
   - Cleanse removes eligible effects.
   - DoT resistance reduces DoT damage.
   - Slow resistance reduces slow magnitude.
   - control resistance reduces hard-CC duration.
   - debuff resistance may later reduce applicable status severity/duration.
   - Recovery may allow the player to endure attrition.

Later Desert itemization may interact with status resistance, but that redesign is explicitly out of scope.

---

# 18. Barrier: persistent rechargeable secondary HP

The old periodic shield mechanic should be replaced by a first-class **Barrier** system.

Barrier is conceptually a persistent secondary health pool.

Core properties:

### Barrier Capacity
Maximum amount of Barrier available.

### Barrier Recharge Delay
Time after taking damage before Barrier begins recharging.

### Barrier Recharge Rate
Rate at which depleted Barrier refills after the delay.

Preferred recharge-rate representation:

> percentage of maximum Barrier restored per second.

Taking damage interrupts/resets the recharge delay.

The exact base capacity, delay, and recharge rate are deferred to the numerical/Barrier implementation pass.

---

# 19. Why Barrier belongs to Mountain

Mountain enemies are characterized by slower, heavier attacks.

Barrier naturally answers that damage rhythm:

1. a large hit depletes Barrier;
2. the enemy has a long gap before its next attack;
3. Barrier gets a chance to begin recharging;
4. the next large hit again encounters some renewed Barrier.

Continuous chip damage or persistent DoT naturally suppresses Barrier recharge more effectively.

This creates a matchup through combat rhythm rather than a hidden "Mountain damage reduction" rule.

---

# 20. Future Barrier itemization

Potential future stats/mechanics include:

- Barrier capacity;
- Barrier recharge rate;
- Barrier recharge-delay reduction;
- Barrier recharge behavior after kills;
- delayed recharge that is harder to interrupt;
- high-capacity / slow-recharge variants;
- low-capacity / rapid-recharge variants.

These are examples of future design space, not T1 commitments.

Recovery does **not** improve Barrier by default.

Barrier has its own scaling vocabulary.

---

# 21. Temporary shields / temporary Barrier

The persistent rechargeable Barrier system does not eliminate temporary shielding effects.

Treat these as separate concepts.

### Barrier
- persistent maximum;
- automatically recharges;
- no normal expiration.

### Temporary Barrier / Ward
- granted by an effect;
- absorbs damage;
- expires or is consumed;
- does not automatically recharge as part of the persistent Barrier system.

Exact naming is not locked.

A future implementation may call temporary shielding **Ward** or another term to keep player-facing language clear.

---

# 22. Absorb is a separate defensive mechanic

Absorb should become its own explicit defensive mechanic rather than being treated as a variation of Recovery or Barrier.

### Recovery
Restores HP according to the player's healing rate.

### Barrier
Prevents HP damage using rechargeable secondary HP.

### Absorb
Responds to incoming damage according to a damage-based storage/conversion/reclamation rule.

Absorb scales from **damage taken / damage processed by the mechanic**, not directly from maximum HP or Recovery.

The final Absorb formula, safe cap, and interaction with mitigation are deferred to a dedicated mechanic/numerical pass.

Do not silently make Absorb scale from Recovery.

The Cave charm is the foundational equipment hook for this mechanic.

---

# 23. Boots philosophy

Boots should primarily change how the player moves through combat/world space rather than acting as another raw-defense slot.

The revised T1 cast is:

| Biome | Boot identity |
|---|---|
| **Clearing** | raw movement speed |
| **Plains** | movement speed after kill |
| **Forest** | traversal / out-of-combat speed |
| **Swamp** | slow resistance |
| **Mountain** | gap closing toward current target |
| **Cave** | stealth / reduced detection |

## 23.1 Plains boots — kill momentum

The Plains boots should provide temporary movement speed after a kill.

This fits the dense biome and reinforces fast movement through chained packs.

## 23.2 Forest boots — traversal / OOC speed

Forest boots should be the straightforward fast-travel option.

Possible expression:
- strong OOC movement bonus;
- broadly useful exploration/traversal benefit.

This swaps the conceptual roles of the current Plains and Forest boots.

## 23.3 Swamp boots — slow resistance

Swamp boots specialize in:

> **reducing the magnitude of movement slows.**

This is Slow Resistance, distinct from generic hard-CC resistance.

## 23.4 Mountain boots — continuous gap closing

Replace the current target-acquisition-triggered proc with a clear continuous condition:

> **Gain additional movement speed while moving toward the current combat target.**

Implementation may restrict the bonus to situations where the player is beyond a minimum distance from the target so it does not become unconditional combat movement speed.

Avoid proc timers/cooldowns unless later testing proves them necessary.

## 23.5 Cave boots — stealth

The Cave stealth/reduced-detection niche is acceptable and intentionally situational.

No conceptual redesign is required beyond numerical calibration.

---

# 24. Status-resistance vocabulary

Preferred separation:

### Slow Resistance
Reduces the **magnitude** of soft movement slows.

Conceptual example:

```text
50% base slow
30% Slow Resistance
=> 35% effective slow
```

### Control Resistance
Reduces the **duration** of hard control such as:
- stun;
- root;
- freeze;
- similar disabling effects.

### DoT Resistance
Reduces incoming damage-over-time.

### Debuff Resistance
Potential later stat for non-control harmful statuses.

Its exact behavior is deferred.

This separation gives the game multiple defensive answers without making Cleanse mandatory.

---

# 25. Relationship to future low-density content

The Forest charm should not consume all possible out-of-combat Recovery design space.

A future low-density biome such as Deep Sea Trench can support a more extreme "prepare fully between fights" recovery item.

Potential later specialization:

- greatly reduced OOC Recovery delay;
- greatly increased OOC Recovery rate;
- strong synergy with AI/rune behavior that deliberately waits for full recovery before acquiring another target.

Therefore:

> **Forest owns broadly useful Recovery investment. A later biome may own extreme between-fight Recovery specialization.**

This distinction should be preserved when later-biome items are redesigned.

---

# 26. What this pass intentionally does NOT solve

The following are separate balance/design jobs:

- crafting costs;
- catalyst economy;
- upgrade-cost curves;
- exact T1 item numbers;
- exact T2/T3/T4 lineage numbers;
- exact tier-to-tier handoff multiplier;
- skill damage/healing/cooldowns;
- Cleanse evolution;
- final Barrier formula;
- final Absorb formula/cap;
- later-biome item casts;
- cores;
- relics;
- boss rewards;
- monster retuning.

Do not use this document as permission to rebalance those systems incidentally.

---

# 27. Numerical pass methodology

The next item-balance document should be a separate volatile tuning artifact.

It should contain:

- Clearing +0…+5 values;
- every T1 biome item +0…+5;
- proposed raw stats;
- proposed mechanic magnitudes;
- derived power comparisons;
- expected matchup strengths;
- simulation results.

Recommended tuning order:

1. **Weapons**
2. **Armor**
3. **Charms**
4. **Boots**

Armor and charms should use the actual T1 monster damage profiles as validation context.

Weapons should be tested against representative offensive archetypes rather than only raw tooltip DPS.

The class-affinity rework should be active before final integrated player simulations are trusted.

---

# 28. Horizontal versus vertical balance

## Horizontal balance

At the same tier and upgrade level:

> Why would I choose Plains vs Forest vs Swamp vs Mountain vs Cave equipment?

Answer through **identity and matchup**, not simple item-level superiority.

## Vertical balance

Within a lineage:

> How much stronger is +1 than +0, +5 than +0, and the next tier +0 than the current +5?

Answer through the universal progression budget and tier-transition rules.

Do not fix a vertical progression problem by destroying horizontal item identity.

---

# 29. Final design principles

The T1 base cast should teach a clear item language.

### Weapons
- generalist/Technique;
- fast;
- DoT;
- heavy/empowered;
- chaotic/high-output.

### Armor
- plating;
- evasion;
- DoT defense;
- defensive-skill amplification;
- generalist %DR.

### Recovery
- kill-chain Recovery;
- Recovery-skill investment;
- periodic attrition Recovery;
- Barrier;
- Absorb.

### Mobility
- kill momentum;
- traversal;
- slow resistance;
- gap closing;
- stealth.

The systems should interact, but they should not collapse into one universal optimal stat.

> **Items should provide distinct tools and build investments, while classes determine the shape of the character using those tools.**

And:

> **Upgrade level increases the strength of an item's identity; it should not erase that identity or turn every item into the same pile of stats.**
