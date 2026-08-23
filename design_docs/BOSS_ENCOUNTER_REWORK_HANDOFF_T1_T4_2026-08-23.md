# Boss Encounter Rework Handoff — T1–T4

**Date:** 2026-08-23  
**Purpose:** implementation-facing design handoff for Gotuus.  
**Scope:** boss encounter structure and mechanics only.  
**Out of scope:** final numerical balance, reward/economy tuning, Cores/Relics, normal-mob redesign.

This pass happens immediately before the main balance/playtest phase. The goal is **not** to reinvent every boss. Preserve the good existing work, remove generic template mechanics, and make each biome’s boss line feel like the apex expression of that biome.

---

# 1. Core design direction

## 1.1 Bosses may be more bespoke than normal mobs

Normal monsters were intentionally simplified around clear roles. Bosses are allowed to have multiple signature mechanics, phases, adds, special targeting/arena behavior, and mechanics unique to bosses.

However, complexity must reinforce the boss’s identity.

Avoid:
> generic slam + generic enrage + generic speed-up + generic shield + generic soft-cap simply because the boss is high tier.

Prefer:
> one core encounter identity that gains depth over tiers.

## 1.2 Each boss is the apex exam for its biome

Replace the old implicit T4 philosophy of:
> “every boss should test every spec/item/range choice”

with:

> **Each boss should be the strongest expression of its biome’s combat idea.**

Boss counters should remain systemic: Guard, Barrier, Break Free, Cleanse, Recovery, movement, burst, AoE, stealth/routing, etc. Do not create bespoke gear checks such as `+X% vs this boss`.

---

# 2. Global anti-summon cleanup

The existing boss files explicitly use `aoeAttack` on many slow bosses as an anti-summon/body-block measure.

That technical workaround should be removed as a general design rule.

Bosses should **not** repeatedly deal broad AoE damage merely so summons cannot body-block them.

Solve summon/body-blocking at the movement/targeting layer where practical. Bosses should be able to maintain access to their intended player target rather than needing to periodically wipe summons.

Local cleave is fine when it naturally fits the boss. Boss AoE is also fine when it is a real encounter mechanic, such as Mountain Earthshatter, Volcano Eruption, or Swamp pools.

> **AoE should exist because the boss wants an AoE mechanic, not because summons exist.**

Do not blindly delete every `aoeAttack`; review each use and retain it only where it fits the encounter.

---

# 3. Existing original-biome boss lineages

The T1 bosses are the strongest existing design anchor. Preserve their encounter identities and make later versions evolve them.

## 3.1 Plains — swarm commander

### Identity
The boss itself is only part of the encounter. The swarm is the other half.

Existing T1/T2 direction is good:
- T1 `Tusked Razorback` summons/replenishes weak adds.
- T2 `Gorging Razortusk` deepens this with larger waves, boars, and rally/roar behavior.

### LOCK
Keep this lineage.

Progression should deepen add composition, reinforcement timing, and the boss’s support of the swarm. Do not turn later Plains bosses into generic bruisers.

> Plains boss pressure comes from **concurrency and followers**, not from making the boss itself the strongest personal attacker in the tier.

## 3.2 Forest — relentless duel

### Identity
Fast, frequent pressure. No need for adds.

Existing T1/T2 direction is good:
- multi-hit claw cadence;
- attack-speed ramp during combat;
- T2 adds a compact stunning swipe and stronger cadence escalation.

### LOCK
Keep. Forest retires after T2, so no further lineage work is required.

> Forest boss = **clean sustained cadence pressure**.

Avoid unrelated defenses or add phases.

## 3.3 Swamp — rot / attrition

### Identity
Direct hits are secondary. Poison, pools, and prolonged exposure are the fight.

Existing line:
- T1 poison + Bile Pool.
- T2 stronger venom + Corrosive Pool.
- T3 larger rot package + pool vulnerability/detonation.

### REFINE T3
Remove the generic T3 final-phase `attack ×4` spike. It does not deepen the Swamp identity.

Replace it with a rot-focused escalation, such as:
- stronger/faster pool detonation;
- modest poison-cap/cadence escalation;
- one final large Rot Bloom / hazardous pulse;
- increased hazard persistence.

Keep it simple.

> Swamp escalation should make **the rot harder to survive**, not suddenly turn the boss into a high-direct-hit bruiser.

## 3.4 Mountain — telegraphed catastrophic impact

### Identity
Huge deliberate hits with readable wind-up.

Existing lineage is strong:
- T1: big Ground Slam.
- T2: stronger Earthshatter + defended position/ranged pressure.
- T3: charge → lock → charged Slam.
- T4: Earthshatter plus delayed radial fault-line aftershock.

### LOCK / REFINE
Keep the evolving Slam lineage. The T4 radial fault-line aftershock is a good evolution and should stay.

### REMOVE / QUESTION
The generic T4 enemy soft-cap is not core to the encounter and can be removed. Likewise avoid generic mechanics whose main purpose is only to counter slow weapons, counter burst, or inflate T4 complexity.

Desired lineage:
- T1 = circle Slam.
- T2 = stronger Slam + defended position.
- T3 = charge-lock-Slam.
- T4 = charge-lock-Earthshatter → delayed fault lines.

> Mountain tests whether the player can **survive and answer enormous telegraphed spikes**.

## 3.5 Cave — endurance / defensive erosion

### Identity
A durable opponent that gradually dismantles the player’s defenses.

Existing direction is coherent:
- plating + DR durability;
- plating shred;
- later threshold effects from accumulated shred;
- armored support/add escalation.

### LOCK
Keep this lineage.

T3 `Deep-Core Burrow-Gorger` already evolves plating shred into threshold Corrosive Venom. That is a good example of deepening an existing mechanic.

Remove generic anti-summon AoE if it exists only for body-block prevention. Do not add more mechanics simply because later Cave bosses need “something else.”

> Cave boss = **the longer the fight lasts, the more your defensive shell gets ground down**.

---

# 4. Newer-biome boss lineages

These are the main redesign targets.

## 4.1 Desert — setup/control → punishment

The strongest existing idea is in T2 `Dune-Stalker Emperor`: opening strike, self-applied Sun Mark cycle, marked heavy strike, slow/control, and later escalation.

Use that as the lineage anchor.

### T2
Keep the current basic duel:
1. boss marks/setup pressure;
2. player has a response window;
3. marked strike cashes out the setup.

The player can use Cleanse, defensive automation, or positioning as systemic answers.

### T3
Keep the existing range-morph idea, but integrate the mark identity:
- Phase 1: melee/controller mode applies/setup Sun Mark.
- At ~50%: boss transitions into ranged/kiting mode.
- Ranged attacks or a signature ranged attack become the punishment/cash-out.
- Do not abandon the mark mechanic because the boss changes range.

### T4
Keep the existing three-act melee → ranged → melee structure, reframed as:

**Act I — Setup / control**  
Boss applies pressure and prepares punishment.

**Act II — Ranged punishment**  
Boss backs off and cashes out the setup from range.

**Act III — Close execution**  
Boss stops controlling space and commits to finishing the player.

> Desert compresses the biome’s controller/dealer pairing into a **single duelist boss**.

## 4.2 Jungle — ambush/evasion → exposed frenzy

Current Jungle bosses lack a strong through-line after T2.

Use this lineage:

> **The predator is difficult to pin down until it finally commits, becoming easier to hit but much more dangerous.**

### T2
Keep:
- opening pounce / ambush;
- one jungle add wave around mid-fight.

### T3
Introduce the predator/evasion identity:
- modest evasion;
- strong opening pounce;
- at mid-fight, briefly reset/re-arm an ambush or perform another committed leap.

Avoid solving the phase with generic attack-speed escalation only.

### T4
Formalize two states:

**Hunt**
- high mobility;
- meaningful evasion;
- venom or other light pressure;
- difficult to pin down.

**Frenzy**
- evasion drops heavily or to zero;
- attack pressure rises;
- boss commits and stays on the player;
- this becomes a dangerous but clean damage window.

The current T4 idea where evasion drops to zero and offense/speed rise is good. Keep that finale concept.

The generic cadence finisher is not necessary unless playtesting proves the boss lacks pressure.

> Jungle boss = **hard to catch, then voluntarily exposes itself for a lethal commitment phase**.

## 4.3 Tundra — Chill + Ice Armor/Shatter

The T3 boss already contains the correct core identity:
- escalating Chill-like movement/attack suppression;
- periodic Frost/Ice Armor;
- breaking the armor triggers a Shatter payoff;
- large telegraphed Slam.

### T3
Keep moderate Chill accumulation, periodic Ice Armor, meaningful Shatter payoff, and the large Slam.

### T4
Deepen those same mechanics:
- stronger or more frequent Ice Armor;
- Shatter creates a larger stagger/vulnerability window;
- signature Glacial Collapse/Slam becomes more dangerous when the player has accumulated Chill.

### REMOVE
Remove the enemy soft-cap.

Remove extreme near-total suppression caps such as ~85% movement slow / ~70% attack slow. The player should feel increasingly suppressed, not functionally unable to play.

> Tundra boss controls **tempo**, and the player creates offense by breaking Ice Armor at the right time.

Do not counter burst, chip, movement, and attack speed all at once.

## 4.4 Volcano — Heat is the boss mechanic

The current Volcano bosses add personal combat ramps that duplicate the newly locked biome-level Heat identity.

Refactor them so the bosses manipulate **Heat**, rather than creating a parallel private ramp.

### T3 — Cinder-Shell Magma Salamander

Suggested identity: shell / hardening cycle.

- Boss periodically hardens into a protective shell.
- The shell can be broken or expires.
- Breaking/ending the shell leads into Eruption or another obvious punishment/window.

Keep the encounter focused.

### T4 — Caldera Sovereign

Make this the ultimate Heat race.

**100–50%**
- normal Heat rules;
- boss uses Eruption / burn pressure.

**~50%**
- boss increases Heat accumulation or raises the minimum Heat floor.

**~25%**
- shell/defense permanently cracks;
- Heat can no longer cool normally, or the fight enters a final high-Heat state;
- both sides become increasingly lethal.

Heat should continue to make **both player and boss** more dangerous. This creates a risk/reward race rather than a one-sided enrage.

Remove/reduce duplicate personal attack ramp, generic enrage stacking, and generic shield + shed-defense + huge attack multiplier if they only exist to make T4 complex.

> Volcano boss = **the fight gets hotter and deadlier for everyone**.

## 4.5 Wasteland / Graveyard — resurrection and corpse persistence

Current T4 `Charnel-Crown Sovereign` is too close to poison boss + add waves + enrage. That overlaps Plains and the old Graveyard ecology.

Rebuild around the current Wasteland rule:

> **death does not cleanly remove enemies.**

### New encounter identity

The boss begins with or summons a **small, controlled entourage** of undead.

When those enemies die:
- they leave real corpses if appropriate;
- corpses become resources for the boss.

The boss periodically uses **Raise Dead**:
- resurrect a limited number of available corpses;
- risen/summoned copies give zero rewards;
- risen copies do not recursively create more usable corpses;
- all boss-controlled risen units collapse/despawn when the boss dies.

### Phase evolution

**Base**
- boss fights with a small undead entourage;
- periodic Raise Dead.

**~50%**
- raise cadence improves, or a stronger Mass Resurrection occurs.

**~25%**
- one final resurrection wave;
- or risen adds return temporarily empowered.

Keep simultaneous add count controlled. Wasteland is no longer an extreme starting-density biome.

The boss does not need a huge personal poison/DoT package if the persistent entourage already creates attrition.

Contrast:
- Plains: new creatures keep arriving.
- Wasteland: **the creatures you already killed refuse to stay dead.**

## 4.6 Deep-Sea Trench — one enormous duel

The Trench boss should express the biome’s defining failure condition: this is one gigantic opponent and the player does not want a second problem.

Use the `Elder Trench Serpent` as the active Trench boss design target.

### Desired identity
A slow, extremely durable elite duel built around a massive telegraphed **Devour** or equivalent signature attack.

Suggested structure:
- slow/heavy ordinary pressure;
- strong bulk;
- periodic Barrier or shell;
- enormous predictable Devour;
- Devour may restore HP/Barrier or otherwise reward the boss if it lands.

The player answers through Guard, Barrier, Target Casting automation, burst windows, and sustain.

### Remove/reduce
Simplify the current generic package:
- cadence finisher;
- generic enrage;
- generic shed-defense;
- generic Slam if Devour replaces it.

> Trench boss = **a deliberate single-target duel against one enormous predator**.

---

# 5. Void Overlord — IGNORE COMPLETELY

The `Void Overlord` / staged apex encounter is **soft-discarded legacy design**.

For this pass:
- do not redesign it;
- do not balance it;
- do not implement new support for it;
- do not use it as inspiration for the active T4 Trench boss;
- do not spend time fixing its encounter stages/adds/flood;
- do not treat its presence in `bossesT4.ts` as evidence that it is part of the intended current game.

Leave it untouched unless removal is trivially necessary for compile/runtime cleanup.

The active Trench design target is the **Elder Trench Serpent**.

---

# 6. Generic phase cleanup

Review all T2–T4 bosses for generic phase logic.

Common stale pattern:
- 50% → `enrage`;
- 25% → `speed` or `attack` buff.

Do not remove phases merely because they use these actions. Ask:
> Does this phase deepen the boss’s identity?

Good identity-driven escalation:
- Mountain gains more complex Slam geometry.
- Jungle drops evasion and commits.
- Desert changes range role.
- Wasteland performs Mass Resurrection.
- Volcano raises Heat pressure.
- Tundra improves Ice Armor/Shatter.

Weak escalation:
- arbitrary `attack ×1.5`;
- arbitrary `speed ×1.3`;
- generic soft-cap;
- generic shield;
- generic cadence finisher;
when none belong to the boss’s defining idea.

Prefer fewer, clearer phase changes.

---

# 7. Tier complexity expectations

Do not use an inflexible “T1 no phase / T2 one phase / T3 two phases / T4 every defensive mechanic” template.

Use tier only as a **complexity ceiling**.

### T1
Teach the pure encounter identity.

### T2
Add one meaningful escalation or supporting mechanic.

### T3
Allow a real second layer: state change, range morph, new interaction, or deeper core mechanic.

### T4
A mature encounter may have multiple phases/mechanics, but every one should reinforce the same identity.

A simple T4 boss with one excellent mechanic is better than a kitchen-sink boss.

---

# 8. Numbers and balance

This is **not** the final boss numerical pass.

Preserve current stats where possible while restructuring mechanics, unless a removed mechanic makes the existing stat budget obviously invalid.

Do not attempt to fully solve boss HP, DPS, TTK, rewards, essence, catalyst bundles, exact DoT values, or exact phase thresholds during this refactor.

After the encounter structures are stable, dedicated balance tools and playtesting will tune them.

When removing a major source of pressure, it is acceptable to leave a TODO/comment noting that later raw-stat compensation may be required.

---

# 9. Implementation guidance

Reuse existing generic boss/runtime systems where sensible: `bossScript`, `spawn-adds`, `morph`, `chargedAttack`, pools, shields, enemy barriers, marks, and status effects.

Only add new runtime behavior when the identity genuinely requires it.

Likely new/expanded seams:
- boss-aware corpse resurrection for Wasteland;
- Volcano boss interaction with global Heat;
- Trench Devour if no sufficiently generic telegraphed heavy attack exists;
- possible summon/body-block movement/targeting fix.

Prefer reusable mechanics rather than boss-ID-specific hardcoding.

---

# 10. Validation checklist

For each active boss:

- [ ] Can its encounter identity be described in one sentence?
- [ ] Do its phases deepen that identity?
- [ ] Does it avoid generic mechanics that exist only because “bosses need mechanics”?
- [ ] Is dangerous damage readable/telegraphed where appropriate?
- [ ] Does it pressure summons without automatically deleting the Summoner class mechanic?
- [ ] Are systemic counters available?
- [ ] Does the boss avoid hard-invalidating a whole class/archetype?
- [ ] Does its later-tier version clearly evolve the earlier boss family?
- [ ] Are spawned adds cleaned up correctly on boss death/reset?
- [ ] Are zero-reward/resurrected units prevented from creating reward or corpse loops?
- [ ] Does the UI/combat log expose important boss mechanics well enough for the player to understand deaths?

---

# 11. Active design summary

| Biome | Boss identity |
|---|---|
| Plains | Swarm commander |
| Forest | Relentless cadence duel |
| Swamp | Rot / attrition / hazardous arena |
| Mountain | Telegraphed catastrophic impacts |
| Cave | Endurance + defensive erosion |
| Desert | Setup/control → punishment |
| Jungle | Ambush/evasion → exposed frenzy |
| Tundra | Chill + Ice Armor/Shatter |
| Volcano | Shared Heat escalation |
| Wasteland | Corpse resurrection / death persistence |
| Trench | One enormous Devour-focused duel |

`Void Overlord` is legacy/soft-discarded and is **not part of this active design table**.

---

# 12. Final implementation principle

> **Do not make bosses more complicated. Make them more specific.**

The existing T1 boss work demonstrates the target: a boss should feel memorable because the encounter has a clear idea, not because its definition contains the most mechanic keys.

Once this refactor is complete, freeze boss structure and move into the main numerical balance/playtesting phase.
