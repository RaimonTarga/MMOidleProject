# T1 Item Numerical Baseline — Clearing + Five Starter Biomes

**Status:** First-pass tuning baseline  
**Companion document:** `T1_ITEM_DESIGN_PHILOSOPHY.md`  
**Scope:** Clearing/T0 equipment and the full Plains / Forest / Swamp / Mountain / Caverns T1 cast  
**Purpose:** Seed implementation, simulation, and playtest iteration  
**Not a claim of final balance:** every number in this document is expected to move

---

# 1. How to use this document

This document deliberately does **not** try to perfectly solve balance before the items exist in the reworked combat model.

The objective is to provide:

- a coherent first implementation target;
- a complete +0…+5 numerical cast;
- values that respect the locked item identities;
- a sane bridge from the tutorial into Plains;
- a baseline that can be fed into the game's balance tools.

The accompanying philosophy document is authoritative on **what each item is supposed to do**.

This document is authoritative only as the **first numerical proposal**.

If simulation contradicts these numbers, change the numbers before changing the philosophy.

---

# 2. Reference player baseline

The numerical baseline assumes the current naked player:

| Stat | Base |
|---|---:|
| Max HP | 100 |
| Attack | 15 |
| Plating | 2 |
| Attack range | 12 px |
| Unarmed attack interval | 3000 ms |
| Recovery | 10 |

Recovery definition:

> **1 Recovery = 1% max HP restored per second while 100% Recovery is active.**

Weapons add raw Attack and replace the unarmed cadence with their authored attacks-per-second value.

Class affinities then reshape/amplify the raw character according to the separate class-stat design.

---

# 3. Upgrade rule

Normal T1 equipment follows the locked total-power progression:

| Upgrade | Target item budget |
|---|---:|
| +0 | 100% |
| +1 | 110% |
| +2 | 120% |
| +3 | 130% |
| +4 | 140% |
| +5 | 150% |

The tables below list **total values at that upgrade level**, not upgrade deltas.

Because stats have different nonlinear value, individual numbers do not need to increase exactly 10% per level.

The package as a whole should roughly follow the 100→150 power budget.

Crafting/economy costs are not part of this document.

---

# 4. Clearing / tutorial equipment

## 4.1 Locked tutorial rule

Clearing equipment is **fixed-power equipment**.

It does **not** use the +0…+5 upgrade system.

Its purpose is to:

1. teach the four basic equipment slots;
2. make Clearing trivial once the set is assembled;
3. provide enough raw shell to establish a foothold in early Plains;
4. be clearly replaced by T1 specialist gear.

Do not add a special Global Mastery exception allowing tutorial items to upgrade.

---

## 4.2 Clearing numerical baseline

| Item | Slot | Proposed stats | Mechanic |
|---|---|---|---|
| **Primordial Club** | Weapon | +8 Attack, **0.75 APS** | none |
| **Bark Wrap** | Armor | +20 Max HP, +4 Plating | none |
| **Herb Pouch** | Charm | +2 Recovery | none |
| **Soft Boots** | Boots | +12 Speed | none |

### Clearing sanity check

With Bark Wrap equipped before class affinity:

- Max HP: `100 → 120`
- Plating: `2 → 6`

Against the current early Plains reference enemies:

- Plains Slime hit: `12 → ~6` before other mitigation
- Boar hit: `18 → ~12`

With Primordial Club:

- raw attack per hit: `15 + 8 = 23`
- basic throughput: `23 × 0.75 = 17.25 raw DPS`

A 50-HP Plains Slime takes three clean Club hits.

That is intentional:

> Clearing gear should make early Plains **possible**, not trivial.

If the player still dies immediately because many Plains mobs aggro simultaneously, tune Plains concurrency/pull behavior rather than inflating the tutorial set until it can facetank an accidental swarm.

---

# 5. T1 weapons

## 5.1 Weapon design goals

The specialist weapons do **not** need identical raw autoattack DPS.

Their equal-budget target is expressed through different shapes:

- Forest spends heavily on attack cadence.
- Swamp spends budget on DoT conversion.
- Mountain spends budget on heavy hits and empowered attacks.
- Caverns receives attractive raw output in exchange for dead swings.
- Plains is intentionally cheaper and below the normal specialist ceiling, partly compensated by Technique frequency.

The innate 15 player Attack matters greatly here: a fast weapon multiplies that baseline even when the weapon itself adds little Attack.

---

## 5.2 Plains — Iron Broadsword

**Identity:** cheap generalist + Technique frequency  
**Intentional status:** below normal specialist weapon budget

Proposed mechanic:

> `Technique Cooldown Recovery`

| Upgrade | Attack | APS | Technique CDR |
|---|---:|---:|---:|
| **+0** | +10 | 0.80 | 6% |
| **+1** | +11 | 0.80 | 7% |
| **+2** | +12 | 0.80 | 8% |
| **+3** | +13 | 0.80 | 9% |
| **+4** | +14 | 0.80 | 10% |
| **+5** | +15 | 0.80 | 11% |

### Notes

- The Broadsword should not win a pure weapon-DPS comparison.
- Its Technique CDR is the reason it remains a legitimate generalist option.
- CDR is multiplicatively powerful; 6–11% is intentionally conservative.
- The final CDR stacking formula should be checked when the skill pass is done.

Approximate naked-root raw basic throughput:

- +0: `(15 + 10) × 0.80 = 20.0 DPS`
- +5: `(15 + 15) × 0.80 = 24.0 DPS`

---

## 5.3 Forest — Flash Rapier

**Identity:** attack frequency / fast weapon  
**No extra proc required**

Upgrades reinforce the identity partly through APS rather than simply piling on Attack.

| Upgrade | Attack | APS |
|---|---:|---:|
| **+0** | +5 | 1.50 |
| **+1** | +5 | 1.52 |
| **+2** | +6 | 1.54 |
| **+3** | +6 | 1.56 |
| **+4** | +7 | 1.58 |
| **+5** | +8 | 1.60 |

Approximate naked-root raw basic throughput:

- +0: `(15 + 5) × 1.50 = 30.0 DPS`
- +5: `(15 + 8) × 1.60 = 36.8 DPS`

### Major simulation watchpoint

This weapon is intentionally the raw autoattack-throughput leader because it multiplies the innate 15 Attack at high frequency.

That also means it can become disproportionately strong with:

- on-hit;
- Energy gain;
- Cadence building;
- rapid DoT application;
- other attack-count mechanics.

Do **not** automatically nerf it merely because its tooltip DPS is high. First compare full class-mechanic throughput.

If it dominates too many unrelated systems, the first lever should be modest APS/Attack reduction rather than adding a special downside.

---

## 5.4 Swamp — Poison Dagger

**Identity:** equipment-based DoT conversion

For the first implementation, preserve the current fundamental DoT weapon shape:

- `convPct: 0.50`
- `tickIntervalMs: 1000`
- `drainDurationMs: 4500`
- `dotMultiplier: 1.50`
- element: poison

Do **not** attempt to rebalance the underlying DoT formula in this item pass.

Scale the weapon primarily through Attack; the converted DoT naturally becomes stronger as its source Attack grows.

| Upgrade | Attack | APS | DoT conversion |
|---|---:|---:|---:|
| **+0** | +10 | 0.90 | 50% |
| **+1** | +11 | 0.90 | 50% |
| **+2** | +12 | 0.90 | 50% |
| **+3** | +13 | 0.90 | 50% |
| **+4** | +14 | 0.90 | 50% |
| **+5** | +15 | 0.90 | 50% |

Raw direct basic throughput before the weapon DoT:

- +0: `(15 + 10) × 0.90 = 22.5 DPS`
- +5: `(15 + 15) × 0.90 = 27.0 DPS`

### Major simulation watchpoint

The **combined direct + DoT** throughput must be compared against the other weapons.

If the current 50% / 1.50 DoT package makes this weapon exceed budget, change the weapon-DoT package during the DoT balance pass rather than disguising the problem by gutting its raw Attack.

---

## 5.5 Mountain — Heavy Hammer

**Identity:** slow, hard individual hits + empowered-attack specialization

`weapon.empowered-mult-bonus` should be treated as a multiplicative bonus to the empowered attack's normal multiplier, consistent with the newer class/item philosophy.

| Upgrade | Attack | APS | Empowered multiplier bonus |
|---|---:|---:|---:|
| **+0** | +26 | 0.55 | +15% |
| **+1** | +28 | 0.55 | +16% |
| **+2** | +30 | 0.55 | +17% |
| **+3** | +32 | 0.55 | +18% |
| **+4** | +34 | 0.55 | +20% |
| **+5** | +36 | 0.55 | +22% |

Raw basic throughput before empowered attacks:

- +0: `(15 + 26) × 0.55 = 22.55 DPS`
- +5: `(15 + 36) × 0.55 = 28.05 DPS`

Individual raw hit:

- +0: 41
- +5: 51

### Notes

The Hammer is **supposed** to look mediocre in an ordinary autoattack DPS comparison.

Its budget is buying:

- much larger individual hits;
- better performance against defenses that punish many light hits;
- empowered-attack amplification;
- compatibility with later Technique-heavy Mountain weapon branches.

First simulator question:

> Does empowered scaling bring the Hammer into a healthy total-output band for every class without making naturally high-multiplier empowered classes absurd?

---

## 5.6 Caverns — Chaotic Axe

**Identity:** above-curve offense paid for through dead swings

Preserve:

> Every third swing is a dead swing.

Assuming this means exactly 2/3 of attacks connect over long samples:

| Upgrade | Attack | APS | Dead swing |
|---|---:|---:|---|
| **+0** | +24 | 1.10 | every 3rd |
| **+1** | +26 | 1.10 | every 3rd |
| **+2** | +28 | 1.10 | every 3rd |
| **+3** | +30 | 1.10 | every 3rd |
| **+4** | +33 | 1.10 | every 3rd |
| **+5** | +36 | 1.10 | every 3rd |

Approximate long-run raw basic throughput after dead-swing tax:

- +0: `(15 + 24) × 1.10 × 2/3 ≈ 28.6 DPS`
- +5: `(15 + 36) × 1.10 × 2/3 ≈ 37.4 DPS`

### Important behavioral note

The dead swing is not equivalent to simply multiplying DPS by 2/3 in every build.

It can be more punishing when:

- a dead swing wastes a valuable timing window;
- attack-count mechanics count attempts rather than landed hits;
- target switching causes unfortunate sequencing.

It can be less punishing when:

- some resources advance on attempts;
- missing a swing has little consequence beyond raw DPS.

The implementation must be explicit about which combat events a dead swing triggers.

---

# 6. Weapon summary table

| Item | +0 Attack | +5 Attack | APS +0→+5 | Core mechanic |
|---|---:|---:|---|---|
| Iron Broadsword | 10 | 15 | 0.80 | Technique CDR 6→11% |
| Flash Rapier | 5 | 8 | 1.50→1.60 | raw frequency |
| Poison Dagger | 10 | 15 | 0.90 | 50% poison DoT conversion |
| Heavy Hammer | 26 | 36 | 0.55 | Empowered bonus 15→22% |
| Chaotic Axe | 24 | 36 | 1.10 | every 3rd swing dead |

---

# 7. T1 armor

## 7.1 Armor goals

Every armor receives enough general bulk to remain functional outside its perfect matchup.

The signature defense is where the package differentiates:

- Plains: plating
- Forest: evasion
- Swamp: DoT resistance
- Mountain: defensive-skill potency
- Cave: percentage DR

Max HP grows on every armor.

The exact package equivalence should be calibrated against real monster probes rather than forcing a fake universal conversion rate between plating/evasion/DR/etc.

---

## 7.2 Plains — Survivor's Robe

**Identity:** plating / swarm defense

| Upgrade | Max HP | Plating |
|---|---:|---:|
| **+0** | +24 | +7 |
| **+1** | +27 | +8 |
| **+2** | +30 | +9 |
| **+3** | +33 | +10 |
| **+4** | +36 | +11 |
| **+5** | +39 | +12 |

Reference before class affinity:

### +0
- player HP: 124
- total plating: 9

Against T1 Plains:
- Plains Slime 12 hit → ~3
- Boar 18 hit → ~9

### +5
- player HP: 139
- total plating: 14

This is deliberately extremely strong against small Plains hits.

That is the point of the armor.

### Simulation watchpoint

Because Plains is a swarm biome, flat mitigation compounds with concurrency.

Check minimum-damage rules and make sure +5 plating does not reduce whole categories of later same-tier attacks to literal zero unless that behavior is intentional.

---

## 7.3 Forest — Shaded Bindings

**Identity:** evasion / frequent-hit defense

| Upgrade | Max HP | Plating | Evasion |
|---|---:|---:|---:|
| **+0** | +28 | +3 | 16% |
| **+1** | +31 | +3 | 17% |
| **+2** | +34 | +4 | 18% |
| **+3** | +37 | +4 | 19% |
| **+4** | +40 | +5 | 20% |
| **+5** | +43 | +5 | 22% |

### Notes

The armor starts with a meaningful avoidance value immediately.

+0 16% evasion is approximately one avoided attack in every 6.25 attempts over a large sample.

+5 reaches 22%, not the ~38% produced by the current placeholder +4pp-per-upgrade curve.

This is intentional: percentage avoidance should scale cautiously.

### Simulation watchpoint

Check separately against:

- one Forest Slime;
- wolf pack;
- rapid-attack Forest enemies;
- large slow Mountain hits.

The armor should feel best where attack count is high, without becoming mathematically superior everywhere.

---

## 7.4 Swamp — Arcane Wrappings

**Identity:** DoT / attrition defense

| Upgrade | Max HP | Plating | DoT Resistance |
|---|---:|---:|---:|
| **+0** | +30 | +4 | 20% |
| **+1** | +34 | +4 | 22% |
| **+2** | +38 | +5 | 24% |
| **+3** | +42 | +5 | 26% |
| **+4** | +46 | +6 | 28% |
| **+5** | +50 | +6 | 30% |

### Notes

T1 Swamp currently contains low direct attacks with poison stacks. This armor should be visibly better there.

The 20→30% DoT-resistance range is intentionally substantial.

The armor also receives enough HP/plating that it is not equivalent to being naked outside a DoT encounter.

Do **not** include hit-to-DoT conversion at T1.

That mechanic has already shown extremely high power in balance tooling and belongs to later-tier specialization if retained.

---

## 7.5 Mountain — Fallen Knight Plate

**New identity:** defensive-skill amplification

The old T1 max-hit / damage-cap mechanic is removed.

Do not delete that design concept globally; reserve it for a later tier.

For T1, the armor provides universal bulk plus:

> **Defensive Skill Potency**

The first implementation should use potency only. Do not add Guard/defensive-skill CDR yet; it is an easy second tuning lever if the armor later feels too narrow.

| Upgrade | Max HP | Plating | Defensive Skill Potency |
|---|---:|---:|---:|
| **+0** | +32 | +5 | +15% |
| **+1** | +36 | +5 | +17% |
| **+2** | +40 | +6 | +19% |
| **+3** | +44 | +6 | +21% |
| **+4** | +48 | +7 | +23% |
| **+5** | +52 | +7 | +25% |

### Interpretation

If a Mitigation-tagged defensive skill grants 40% DR and its mitigation value scales directly with potency, +15% potency would conceptually turn that effect into 46% before any appropriate cap/formula.

The exact consumer semantics must be standardized by the skill/tag implementation; this table only establishes the intended item magnitude.

### Why the raw bulk is high

Unlike plating, evasion, DR, or DoT resistance, skill potency can be inactive if the player is not currently benefiting from a matching Guard.

The Mountain armor therefore gets a healthy general HP/plating shell so it is not a trap before the skill fires.

---

## 7.6 Caverns — Bestial Hide

**Identity:** premium all-rounder / percentage DR

"Premium" means broadly useful, not higher total item budget.

| Upgrade | Max HP | Plating | Damage Reduction |
|---|---:|---:|---:|
| **+0** | +28 | +4 | 6% |
| **+1** | +31 | +4 | 7% |
| **+2** | +34 | +5 | 8% |
| **+3** | +37 | +5 | 9% |
| **+4** | +40 | +6 | 10% |
| **+5** | +42 | +6 | 11% |

### Notes

Cave armor should:

- rarely be a bad choice;
- not beat Plains armor at tiny-hit swarms;
- not beat Swamp armor at DoT;
- not beat a well-timed Mountain skill setup against a dangerous window;
- provide excellent broad value against Cave's mixed elite attacks.

11% DR at +5 is intentionally kept well below runaway values because percentage mitigation compounds strongly with HP, plating, class damage-taken affinities, and other defensive layers.

---

# 8. Armor summary

| Armor | +0 identity | +5 identity |
|---|---|---|
| Survivor's Robe | +24 HP, +7 plating | +39 HP, +12 plating |
| Shaded Bindings | +28 HP, +3 plating, 16% evade | +43 HP, +5 plating, 22% evade |
| Arcane Wrappings | +30 HP, +4 plating, 20% DoT res | +50 HP, +6 plating, 30% DoT res |
| Fallen Knight Plate | +32 HP, +5 plating, 15% defensive-skill potency | +52 HP, +7 plating, 25% potency |
| Bestial Hide | +28 HP, +4 plating, 6% DR | +42 HP, +6 plating, 11% DR |

---

# 9. T1 charms / Recovery slot

## 9.1 Shared assumptions

Base player Recovery = 10.

All charm Recovery values below are **additive Recovery points**.

Example:

> Base Recovery 10 + charm Recovery 2 = Recovery 12 = 12% max HP/s while 100% Recovery is active.

Recovery-based in-combat effects activate a fraction of that total Recovery.

Separate fractions add together.

Barrier and Absorb do not scale from Recovery by default.

---

## 9.2 Plains — Plains Stone

**New identity:** chain-farming Recovery

Mechanic:

> On kill, activate a fraction of Recovery during combat for 4 seconds.  
> Further kills refresh duration. The effect does not stack with itself.

| Upgrade | Recovery | Recovery activated on kill | Duration |
|---|---:|---:|---:|
| **+0** | +1.0 | 20% | 4s |
| **+1** | +1.0 | 22% | 4s |
| **+2** | +1.5 | 24% | 4s |
| **+3** | +1.5 | 26% | 4s |
| **+4** | +2.0 | 28% | 4s |
| **+5** | +2.0 | 30% | 4s |

### Example at +0

Total Recovery = 11.

Kill buff:
- `11%/s × 20% = 2.2% max HP/s`
- for four seconds = up to **8.8% max HP**

A second kill refreshes the four-second timer; it does not create another 8.8% HoT.

### Intent

Excellent in dense chain farming.

Poor against:

- bosses;
- isolated elites;
- encounters without adds.

This is intentional.

---

## 9.3 Forest — Heartroot Amulet

**New identity:** Recovery investment + Recovery-skill potency

| Upgrade | Recovery | Recovery Skill Potency |
|---|---:|---:|
| **+0** | +3 | +10% |
| **+1** | +3 | +11% |
| **+2** | +4 | +12% |
| **+3** | +4 | +13% |
| **+4** | +5 | +14% |
| **+5** | +5 | +15% |

### Intent

This is the most universally useful raw-Recovery T1 charm.

It should naturally improve:

- OOC regeneration;
- Squire's Recovery access;
- Striker Recovery pulses;
- Recovery-tagged skills such as Second Wind;
- other mechanics that explicitly use the player's Recovery stat.

Recovery Skill Potency only boosts **Recovery-tagged skills**, not every Recovery-based passive.

### Watchpoint

This charm participates in many systems.

If it becomes the default best charm for nearly every build, reduce raw Recovery before removing the skill synergy.

---

## 9.4 Swamp — Murk Eye

**New identity:** automatic periodic attrition Recovery

Mechanic:

> Every 8 seconds while in combat, activate part of Recovery for 4 seconds.

No stacking of overlapping copies from the same charm.

| Upgrade | Recovery | Periodic Recovery fraction | Duration | Interval |
|---|---:|---:|---:|---:|
| **+0** | +2 | 20% | 4s | 8s |
| **+1** | +2 | 22% | 4s | 8s |
| **+2** | +2 | 24% | 4s | 8s |
| **+3** | +3 | 26% | 4s | 8s |
| **+4** | +3 | 28% | 4s | 8s |
| **+5** | +3 | 30% | 4s | 8s |

### +0 example

Total Recovery = 12.

During pulse:
- `12% × 20% = 2.4% max HP/s`
- four seconds = **9.6% max HP** if healing is not wasted.

This is specifically useful against Swamp DoT because the heal does not depend on the source of damage.

### Watchpoint

If the fixed 8-second cadence produces awkward synchronization with encounter starts, convert the implementation to a clear combat timer rather than randomizing it.

---

## 9.5 Mountain — Granite Barrier

**New identity:** rechargeable Barrier

Barrier assumptions for this first baseline:

- Barrier sits in front of HP.
- Damage depletes Barrier first.
- Taking damage resets the recharge delay.
- After the delay, Barrier recharges automatically.
- Recharge rate is a percentage of **maximum Barrier per second**.
- DoT damage counts as damage and therefore prevents/resets recharge unless the Barrier implementation pass deliberately decides otherwise.

| Upgrade | Recovery | Barrier Capacity | Recharge Delay | Recharge Rate |
|---|---:|---:|---:|---:|
| **+0** | +1 | 12% max HP | 3.0s | 25% Barrier/s |
| **+1** | +1 | 13% max HP | 3.0s | 25% Barrier/s |
| **+2** | +1 | 14% max HP | 3.0s | 25% Barrier/s |
| **+3** | +2 | 15% max HP | 3.0s | 25% Barrier/s |
| **+4** | +2 | 16.5% max HP | 3.0s | 25% Barrier/s |
| **+5** | +2 | 18% max HP | 3.0s | 25% Barrier/s |

An empty Barrier takes four seconds of uninterrupted recharge to refill.

### Why only capacity scales here

T1 should teach the Barrier mechanic clearly.

Recharge rate and recharge delay are deliberately held constant so future items have room to specialize those axes.

---

## 9.6 Caverns — Pulse Stone

**New identity:** Absorb

The old Cave periodic Recovery pulse moves to Swamp.

Cave receives the dedicated Absorb mechanic.

For numerical authoring, define the item by an `Absorb %` coefficient and let the separate Absorb implementation own:

- storage/reclamation behavior;
- cap;
- mitigation ordering;
- payout timing.

| Upgrade | Recovery | Absorb |
|---|---:|---:|
| **+0** | +2 | 8% |
| **+1** | +2 | 9% |
| **+2** | +2 | 10% |
| **+3** | +3 | 10% |
| **+4** | +3 | 11% |
| **+5** | +3 | 12% |

### Important rule

Absorb scales from incoming/direct damage according to the Absorb system.

It does **not** scale from:

- max HP;
- Recovery;
- Barrier.

The 8→12% range assumes Absorb remains a meaningful but bounded reclamation layer.

If the actual Absorb implementation makes each percentage point more powerful than expected, reduce this table before changing Cave's identity.

---

# 10. Charm summary

| Charm | +0 | +5 |
|---|---|---|
| Plains Stone | +1 Recovery; 20% Recovery on kill for 4s | +2 Recovery; 30% for 4s |
| Heartroot Amulet | +3 Recovery; +10% Recovery Skill Potency | +5 Recovery; +15% potency |
| Murk Eye | +2 Recovery; 20% periodic Recovery | +3 Recovery; 30% periodic Recovery |
| Granite Barrier | +1 Recovery; 12% Barrier | +2 Recovery; 18% Barrier |
| Pulse Stone | +2 Recovery; 8% Absorb | +3 Recovery; 12% Absorb |

---

# 11. T1 boots

## 11.1 Boots goals

Boots should change movement/positioning behavior rather than act as another defense slot.

Every pair keeps some raw Speed so the slot remains intuitively useful.

Conditional mechanics then establish the biome identity.

---

## 11.2 Plains — Fleet Boots

**New identity:** kill momentum

| Upgrade | Speed | Speed after kill | Duration |
|---|---:|---:|---:|
| **+0** | +18 | +25% | 3s |
| **+1** | +19 | +28% | 3s |
| **+2** | +20 | +31% | 3s |
| **+3** | +21 | +34% | 3s |
| **+4** | +22 | +37% | 3s |
| **+5** | +23 | +40% | 3s |

Kills refresh the duration; the buff does not stack with itself.

This complements the Plains charm's chain-farming identity without duplicating healing.

---

## 11.3 Forest — Sprinter Wraps

**New identity:** traversal / out-of-combat speed

| Upgrade | Speed | OOC Speed Bonus |
|---|---:|---:|
| **+0** | +22 | +25% |
| **+1** | +24 | +30% |
| **+2** | +26 | +35% |
| **+3** | +28 | +40% |
| **+4** | +30 | +45% |
| **+5** | +32 | +50% |

This is the broad travel/farming-navigation boot.

It does not need a kill trigger.

---

## 11.4 Swamp — Marsh Treads

**New identity:** Slow Resistance

Slow Resistance reduces slow **magnitude**, not hard-control duration.

| Upgrade | Speed | Slow Resistance |
|---|---:|---:|
| **+0** | +18 | 25% |
| **+1** | +19 | 28% |
| **+2** | +20 | 31% |
| **+3** | +21 | 34% |
| **+4** | +22 | 37% |
| **+5** | +23 | 40% |

Example:

- incoming slow: 50%
- +0 Marsh Treads: `50% × (1 - .25) = 37.5% effective slow`

This directly answers Swamp movement hazards without becoming universal CC immunity.

---

## 11.5 Mountain — Iron Treads

**New identity:** continuous gap closing

Remove the current acquire-target proc/cooldown model.

New rule:

> Gain bonus movement speed while moving toward the current combat target and farther than the minimum gap-closing distance.

First-pass minimum distance:

> **64 px edge-to-edge / combat-distance equivalent**, subject to implementation conventions.

| Upgrade | Speed | Toward-target Speed Bonus |
|---|---:|---:|
| **+0** | +16 | +35% |
| **+1** | +17 | +40% |
| **+2** | +18 | +45% |
| **+3** | +19 | +50% |
| **+4** | +20 | +55% |
| **+5** | +21 | +60% |

### Notes

- No proc timer.
- No internal cooldown.
- No benefit when running away.
- Preferably no bonus once already within the minimum distance.

The effect should read immediately as:

> "These boots help me get to the target."

---

## 11.6 Caverns — Bat Wing Boots

**Identity:** stealth / reduced detection

| Upgrade | Speed | Stealth / Detection Reduction |
|---|---:|---:|
| **+0** | +20 | 25% |
| **+1** | +21 | 27% |
| **+2** | +22 | 29% |
| **+3** | +23 | 31% |
| **+4** | +24 | 33% |
| **+5** | +25 | 35% |

The exact stealth formula should remain whatever the game's stealth/pull-range implementation expects.

This is intentionally niche.

Its value is avoiding unwanted Cave overpulls, not increasing combat throughput in every encounter.

---

# 12. Boots summary

| Boots | +0 | +5 |
|---|---|---|
| Fleet Boots | +18 Speed; +25% after kill | +23; +40% |
| Sprinter Wraps | +22 Speed; +25% OOC | +32; +50% |
| Marsh Treads | +18 Speed; 25% Slow Resist | +23; 40% |
| Iron Treads | +16 Speed; +35% toward target | +21; +60% |
| Bat Wing Boots | +20 Speed; 25% stealth | +25; 35% |

---

# 13. Complete +0 cast at a glance

| Biome | Weapon +0 | Armor +0 | Charm +0 | Boots +0 |
|---|---|---|---|---|
| **Clearing** | +8 ATK, .75 APS | +20 HP, +4 PLT | +2 Recovery | +12 SPD |
| **Plains** | +10 ATK, .80 APS, 6% Technique CDR | +24 HP, +7 PLT | +1 Rec; kill activates 20% Rec/4s | +18 SPD; +25% after kill |
| **Forest** | +5 ATK, 1.50 APS | +28 HP, +3 PLT, 16% evade | +3 Rec; +10% Recovery Skill Potency | +22 SPD; +25% OOC |
| **Swamp** | +10 ATK, .90 APS, 50% DoT conversion | +30 HP, +4 PLT, 20% DoT res | +2 Rec; periodic 20% Rec/4s | +18 SPD; 25% Slow Resist |
| **Mountain** | +26 ATK, .55 APS, +15% empowered | +32 HP, +5 PLT, +15% defensive-skill potency | +1 Rec; 12% Barrier | +16 SPD; +35% toward target |
| **Caverns** | +24 ATK, 1.10 APS, dead 3rd swing | +28 HP, +4 PLT, 6% DR | +2 Rec; 8% Absorb | +20 SPD; 25% stealth |

---

# 14. Complete +5 cast at a glance

| Biome | Weapon +5 | Armor +5 | Charm +5 | Boots +5 |
|---|---|---|---|---|
| **Plains** | +15 ATK, .80 APS, 11% Technique CDR | +39 HP, +12 PLT | +2 Rec; kill activates 30% Rec/4s | +23 SPD; +40% after kill |
| **Forest** | +8 ATK, 1.60 APS | +43 HP, +5 PLT, 22% evade | +5 Rec; +15% Recovery Skill Potency | +32 SPD; +50% OOC |
| **Swamp** | +15 ATK, .90 APS, 50% DoT conversion | +50 HP, +6 PLT, 30% DoT res | +3 Rec; periodic 30% Rec/4s | +23 SPD; 40% Slow Resist |
| **Mountain** | +36 ATK, .55 APS, +22% empowered | +52 HP, +7 PLT, +25% defensive-skill potency | +2 Rec; 18% Barrier | +21 SPD; +60% toward target |
| **Caverns** | +36 ATK, 1.10 APS, dead 3rd swing | +42 HP, +6 PLT, 11% DR | +3 Rec; 12% Absorb | +25 SPD; 35% stealth |

---

# 15. First simulation / playtest checklist

Do not attempt to tune every coefficient simultaneously.

The following checks should produce the first revision.

## 15.1 Tutorial → Plains entry

Test each root class with the **complete fixed Clearing set**.

Target:

> The build can establish positive progression against early Plains enemies.

It does not need to safely tank a large accidental swarm.

If every root dies before acquiring meaningful Plains gear, check:

1. simultaneous aggro / pull count;
2. Plains mob placement/density;
3. Clearing armor;
4. only then broader player/item power.

---

## 15.2 T1 weapon cross-class matrix

For every +0 and +5 weapon, test representative roots:

- Squire
- Striker
- Apprentice
- Slinger
- Spirit
- Conduit

Capture:

- raw DPS;
- total DPS;
- empowered contribution;
- DoT contribution;
- attack-count mechanics;
- time-to-kill against squishy and armored references.

Watch especially:

### Flash Rapier
High innate-Attack multiplication and attack-count synergy.

### Heavy Hammer
Risk of looking weak in raw DPS but becoming extreme on high-multiplier class mechanics.

### Poison Dagger
Unknown combined direct + weapon-DoT budget.

### Chaotic Axe
Dead-swing event semantics.

---

## 15.3 Armor damage-shape probes

Use standardized incoming profiles:

### Small / swarm
Approximately 10–15 damage hits at high concurrency.

Expected winner:
> Plains plating.

### Frequent
Approximately 10–15 damage at fast attack intervals.

Expected winner:
> Forest evasion.

### DoT
Low direct hit + sustained poison ticks.

Expected winner:
> Swamp.

### Heavy / intermittent
Large hit with several seconds between attacks.

Expected strong package:
> Mountain when an appropriate defensive skill is equipped; Mountain Barrier charm should also shine.

### Mixed elite
Moderate/large mixed direct hits.

Expected reliable performer:
> Cave DR.

Do not require each armor to have equal EHP against all five probes.

---

## 15.4 Charm tests

Test at Recovery:

- 10
- 12
- 15
- 20

Measure:

- OOC downtime;
- HP restored during 30-second combat;
- HP wasted to overhealing;
- boss value;
- dense-farming value.

Expected niches:

### Plains
High dense-farm value, low boss value.

### Forest
Highest broadly available Recovery scaling, strong with Second Wind.

### Swamp
Reliable attrition sustain.

### Mountain
Strong against damage patterns that allow recharge windows.

### Cave
Reliable direct-damage reclamation according to the finalized Absorb model.

---

## 15.5 Boots tests

Measure actual:

- time between targets;
- time spent chasing;
- combat uptime;
- accidental pulls;
- time under slow.

Movement mechanics can create significant hidden DPS/farming gains even when they do not change attack stats.

---

# 16. Expected first-round failure points

These are the numbers most likely to need revision.

## 16.1 Plains concurrency

The current Plains pull behavior may be too punishing independently of equipment.

Do not make tutorial gear absurd to solve excessive simultaneous aggro.

## 16.2 Forest Rapier

1.50–1.60 APS multiplies innate Attack and many class mechanics.

Likely first offensive outlier.

## 16.3 Defensive-skill potency

The correct value depends on how potency modifies different defensive skills.

15–25% is a placeholder band until the tag consumer is standardized.

## 16.4 Barrier

12–18% capacity with 3s delay / 25% per-second recharge is a system seed, not a solved formula.

It should be retuned after the actual Barrier implementation is playable.

## 16.5 Absorb

8–12% assumes a bounded mechanic.

Its safe coefficient depends heavily on damage-ordering and reclamation semantics.

## 16.6 Recovery stacking

Forest Recovery + Second Wind + class Recovery access may create unexpectedly strong sustain.

This is desirable as a build direction but needs simulation.

---

# 17. Explicit non-goals

Do **not** use this implementation to simultaneously rebalance:

- recipe costs;
- essence income;
- catalyst costs;
- Tier 2+ item numbers;
- cores;
- relics;
- skill cooldowns/damage;
- Cleanse evolution;
- the underlying DoT formula;
- later-biome item casts.

Those systems should receive their own passes after this baseline exists.

---

# 18. Implementation-summary block

For an implementation/planning agent, the intended changes are:

1. Make Clearing equipment fixed/non-upgradeable.
2. Replace Clearing stats with the values in §4.
3. Replace all T1 +0…+5 equipment stats with the full totals in this document.
4. Plains weapon gains generic Technique CDR.
5. Forest Rapier upgrades partly through APS.
6. Swamp Poison Dagger retains the current T1 poison-conversion structure pending DoT rebalance.
7. Mountain Hammer uses multiplicative empowered-attack bonus.
8. Mountain armor loses max-hit/damage-cap and gains generic defensive-skill potency.
9. Swamp periodic Recovery and Cave Absorb swap conceptual homes.
10. Plains charm becomes nonstacking kill-triggered Recovery access.
11. Forest charm becomes Recovery + Recovery Skill Potency.
12. Mountain charm uses the new rechargeable Barrier system.
13. Plains/Forest boots swap kill-momentum vs OOC-traversal roles.
14. Swamp boots use Slow Resistance.
15. Mountain boots become continuous toward-target gap-closing movement.
16. Cave boots retain stealth.
17. Economy/cost values should remain untouched during this implementation.
18. Treat all coefficients as first-pass values intended for immediate simulation/playtest iteration.

---

# 19. Bottom line

This cast is not trying to be mathematically perfect.

It is trying to give the balance tools something **coherent** to test.

The intended progression is:

> tutorial shell → T1 specialist choice → linear +0…+5 investment → later tier replacement

The intended horizontal choice is:

> **different tools, not progressively better recolors.**

If a number is wrong, move the number.

If an entire matchup does not exist, revisit the philosophy document rather than compensating with arbitrary stat inflation.
