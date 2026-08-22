# Ability Cast & Authored Tier Progression Plan — T1–T4

**Status:** Planning baseline / ready for implementation planning  
**Source roster:** current `abilities.ts`, expanded with the locked ability ideas from the design session  
**Scope:** ability roster, biome placement, first-pass base numbers, and authored per-tier upgrades through T4  
**Out of scope:** final balance, T5+ progression, item tuning, exact FX/audio, biome unlock costs

---

## 1. Core decisions

### 1.1 Slots stay simple

There are still only two active-ability slot families:

- **Technique** — offensive/tactical active ability.
- **Guard** — defensive/recovery/status active ability.

Execution shape remains independent:

- `armed`
- `cast`
- `reposition`
- `instant`

Important clarification:

> A Technique does **not** have to be enemy-facing or modify the next attack.

An instant offensive self-buff such as Frenzy is still a Technique because its job is offensive.

### 1.2 No abilities in Clearing

Clearing teaches basic combat and equipment only.

The ability system begins in **Tier 1**.

### 1.3 Ability progression is authored, not percentage-scaled

Remove the assumption that every ability can be adequately represented by:

```ts
scalePerTierPct
```

Every ability instead owns an authored rank for each player tier from its home tier onward.

Example:

```text
Sweep I   — T1
Sweep II  — T2
Sweep III — T3
Sweep IV  — T4
```

This is the **same learned ability**, not four separate loadout entries.

The UI may display the Roman numeral/rank, but the implementation should preserve one lineage/ability identity.

Conceptually:

```text
rank = playerTier - homeTier + 1
```

clamped to the authored ranks available.

### 1.4 Every owned ability deepens when the player tiers up

If an ability already exists when the player advances a tier, it receives one authored upgrade.

The upgrade can improve whichever axis still makes sense:

- damage;
- splash;
- debuff potency;
- duration;
- cooldown;
- cast time;
- control duration;
- Recovery fraction;
- movement-related rider;
- etc.

There is no requirement that the same field improve every tier.

> **Once a mechanic reaches its natural ceiling, deepen another axis rather than scaling it forever.**

Examples:

- Sweep can reach 100% splash, then begin reducing cooldown.
- Cleanse can gain discrete removal capability rather than `+10% stacks`.
- Brace should not scale DR indefinitely toward immunity.
- Charge distance should not grow forever.
- Snipe range should not increase every tier without limit.

---

## 2. Ability home tiers / biomes

The supplied biome progression used for **home placement** is:

### Tier 1
- Plains
- Forest
- Swamp
- Mountain
- Caverns

### Tier 2
- Jungle
- Desert

### Tier 3
- Tundra
- Volcano

### Tier 4
- Deep Sea Trench
- Wasteland

Biome retirement does not remove already learned abilities and does not stop their rank progression.

The supplied biome map currently ends at T4, so this document authors ranks only through T4. T5+ ranks should continue using the same bespoke-progression philosophy when those tiers are designed.

---

## 3. Full unlock map

### Tier 1 — fundamentals

| Biome | Ability | Slot | Role |
|---|---|---|---|
| **Plains** | Sweep | Technique | AoE |
| **Forest** | Second Wind | Guard | Recovery |
| **Swamp** | Cleanse | Guard | Debuff removal |
| **Mountain** | Brace | Guard | Burst mitigation |
| **Mountain** | Power Strike | Technique | Casted single-target burst |
| **Caverns** | Expose Weakness | Technique | Damage amplification |

T1 deliberately grants **3 Techniques + 3 Guards**.

It teaches the fundamental decisions:

#### Techniques
- distribute damage;
- amplify damage;
- deal direct burst.

#### Guards
- prevent damage;
- recover damage;
- remove harmful statuses.

### Tier 2 — positioning, soft control, sustained mitigation

| Biome | Ability | Slot | Role |
|---|---|---|---|
| **Jungle** | Hamstring | Technique | Slow / soft control |
| **Jungle** | Bramble Guard | Guard | Anti-swarm defense |
| **Desert** | Charge | Technique | Gap closing |
| **Desert** | Endure | Guard | Sustained mitigation |

### Tier 3 — tempo and hard movement/control counterplay

| Biome | Ability | Slot | Role |
|---|---|---|---|
| **Tundra** | Binding Strike | Technique | Root |
| **Tundra** | Break Free | Guard | Hard-CC removal |
| **Volcano** | Frenzy | Technique | Attack-speed burst |
| **Volcano** | Quick Strike | Technique | Low-CD spam Technique |

### Tier 4 — advanced range, escape, hard CC, long sustain

| Biome | Ability | Slot | Role |
|---|---|---|---|
| **Deep Sea Trench** | Disengage | Technique | Create distance |
| **Deep Sea Trench** | Recuperate | Guard | Long Recovery window |
| **Wasteland** | Snipe | Technique | Long-range cast |
| **Wasteland** | Stunning Strike | Technique | Hard control |

---

# 4. T1 ability ranks

## 4.1 Sweep — Plains

**Slot:** Technique  
**Shape:** Armed  
**Role:** AoE  
**Core rule:** the next qualifying attack splashes a percentage of its damage around the primary target.

| Rank | Player tier | Splash | Radius | Cooldown |
|---|---:|---:|---:|---:|
| **Sweep I** | T1 | 60% | 90 px | 6.0s |
| **Sweep II** | T2 | 80% | 90 px | 6.0s |
| **Sweep III** | T3 | 100% | 90 px | 6.0s |
| **Sweep IV** | T4 | 100% | 90 px | **5.0s** |

### Progression logic

Sweep's primary axis has an intuitive ceiling:

> 100% splash = secondary targets receive a full-strength copy of the distributed attack payload.

Once it reaches that ceiling at T3, T4 improves frequency instead.

Do not keep scaling splash to 120%, 140%, etc. merely because more tiers exist.

Technique Power may scale Sweep's offensive payload according to the existing Technique-power rules.

---

## 4.2 Second Wind — Forest

**Slot:** Guard  
**Shape:** Instant  
**Tags:** Recovery  
**Role:** short, strong sustain

Second Wind activates part of the player's Recovery rate.

| Rank | Tier | Recovery active | Duration | Cooldown |
|---|---:|---:|---:|---:|
| **Second Wind I** | T1 | 50% | 4s | 12s |
| **Second Wind II** | T2 | 60% | 4s | 12s |
| **Second Wind III** | T3 | 70% | 4s | 12s |
| **Second Wind IV** | T4 | 70% | 4s | **10.5s** |

At base Recovery 10:

- Rank I = 20% max HP over the full window before antiheal/overheal.
- Rank III = 28% max HP over the full window.

Recovery Skill Potency scales the Recovery fraction.

Generic Guard/defensive potency should **not** also scale Second Wind; its dedicated scaling axis is Recovery Skill Potency.

Suggested default trigger:

> HP at or below roughly 60%.

Do not auto-fire it simply because the player entered combat.

---

## 4.3 Cleanse — Swamp

**Slot:** Guard  
**Shape:** Instant  
**Role:** harmful-status removal

Cleanse receives **no DR rider**.

The current accidental post-cleanse DR is removed.

| Rank | Tier | Removal | Cooldown |
|---|---:|---|---:|
| **Cleanse I** | T1 | Remove **1 stack from 1 eligible debuff** | 10s |
| **Cleanse II** | T2 | Remove **2 stacks from 1 eligible debuff** | 10s |
| **Cleanse III** | T3 | Remove **2 stacks from up to 2 eligible debuffs** | 10s |
| **Cleanse IV** | T4 | Remove **3 stacks from up to 2 eligible debuffs** | 10s |

### Important implementation rule

Cleanse progression is discrete.

Do not run `stacks` through a generic percentage multiplier and round it.

If several debuffs are present, automatic Cleanse should use a deterministic cleanse-priority rule rather than arbitrary map/order behavior.

Exact status taxonomy can continue evolving in the dedicated status pass.

Hard control is primarily handled by **Break Free**, not by turning Cleanse into a universal answer.

---

## 4.4 Brace — Mountain

**Slot:** Guard  
**Shape:** Instant  
**Role:** short, strong mitigation

| Rank | Tier | DR | Duration | Knockback resistance | Cooldown |
|---|---:|---:|---:|---:|---:|
| **Brace I** | T1 | 35% | 3.0s | 50% | 10s |
| **Brace II** | T2 | 40% | 3.0s | 55% | 10s |
| **Brace III** | T3 | 45% | 3.0s | 60% | 10s |
| **Brace IV** | T4 | 45% | **3.5s** | 65% | 10s |

Brace is the **burst** mitigation Guard.

Its DR should approach a safe ceiling rather than growing every tier forever.

Later improvements should favor duration/cooldown/secondary mitigation axes rather than pushing toward immunity.

Mitigation/Guard Potency may amplify its DR using the standardized defensive-skill rules.

---

## 4.5 Power Strike — Mountain

**Former working name:** Charged Strike  
**Slot:** Technique  
**Shape:** Cast  
**Role:** raw single-target burst

Power Strike moves from T2 to **T1**.

| Rank | Tier | Damage | Cast time | Cooldown |
|---|---:|---:|---:|---:|
| **Power Strike I** | T1 | 3.0× Attack | 1.6s | 10s |
| **Power Strike II** | T2 | 3.5× | 1.6s | 10s |
| **Power Strike III** | T3 | 4.0× | 1.6s | 10s |
| **Power Strike IV** | T4 | 4.5× | 1.6s | 10s |

This is the reference **all-damage cast**.

Other cast Techniques such as Snipe and Stunning Strike spend part of their budget on range/control and should therefore have less raw damage than Power Strike at comparable progression.

Hard control interrupts the cast.

Technique Power scales the damage payload.

---

## 4.6 Expose Weakness — Caverns

**Slot:** Technique  
**Shape:** Armed  
**Role:** target amplification

| Rank | Tier | Damage taken increase | Duration | Cooldown |
|---|---:|---:|---:|---:|
| **Expose Weakness I** | T1 | +15% | 4s | 12s |
| **Expose Weakness II** | T2 | +17.5% | 4s | 12s |
| **Expose Weakness III** | T3 | +20% | 4s | 12s |
| **Expose Weakness IV** | T4 | +20% | **5s** | 12s |

The vulnerability magnitude is deliberately capped early because multiplicative enemy-damage-taken effects scale extremely well with the whole build and with multiple attackers.

Once potency reaches the desired band, improve duration/frequency rather than scaling vulnerability indefinitely.

Technique Power should **not** increase the vulnerability unless that is separately and deliberately designed later.

---

# 5. T2 ability ranks

## 5.1 Hamstring — Jungle

**Slot:** Technique  
**Shape:** Armed  
**Role:** soft movement control

The next attack gains modest damage and applies a slow.

| Rank | Tier | Hit damage | Slow | Slow duration | Cooldown |
|---|---:|---:|---:|---:|---:|
| **Hamstring I** | T2 | 1.15× | 40% | 3.0s | 6.0s |
| **Hamstring II** | T3 | 1.20× | 45% | 3.5s | 6.0s |
| **Hamstring III** | T4 | 1.25× | 50% | 4.0s | **5.5s** |

Slow prevents neither attacking nor casting.

It exists primarily for:

- kiting;
- maintaining range;
- chasing fleeing/moving targets;
- controlling approach speed.

Control consumes part of the skill's power budget, so its damage remains far below Power Strike.

---

## 5.2 Bramble Guard — Jungle

**Slot:** Guard  
**Shape:** Instant  
**Role:** anti-swarm / retaliation

Gain temporary plating and deal flat retaliation damage when a monster lands a direct hit.

| Rank | Tier | Plating | Flat retaliation | Duration | Cooldown |
|---|---:|---:|---:|---:|---:|
| **Bramble Guard I** | T2 | +6 | 6 | 5s | 12s |
| **Bramble Guard II** | T3 | +8 | 10 | 5s | 12s |
| **Bramble Guard III** | T4 | +10 | 14 | 5s | 12s |

Retaliation remains **flat**.

Do not make it scale from:

- attack;
- damage dealt;
- damage taken.

This preserves the rule that foundational defense should not automatically scale from offensive investment.

Bramble Guard is strongest in high-density environments where many direct hits occur.

---

## 5.3 Charge — Desert

**Slot:** Technique  
**Shape:** Reposition  
**Tags:** Mobility  
**Role:** gap closing / offensive positioning

Charge moves the player toward the current target and empowers the next attack.

| Rank | Tier | Distance | Next-hit multiplier | Cooldown |
|---|---:|---:|---:|---:|
| **Charge I** | T2 | 220 px | 1.50× | 9.0s |
| **Charge II** | T3 | 220 px | 1.70× | 9.0s |
| **Charge III** | T4 | 220 px | 1.90× | **8.5s** |

Distance does not scale automatically.

The movement itself is part of the skill budget.

Technique Power scales the offensive rider, not the movement distance.

---

## 5.4 Endure — Desert

**Slot:** Guard  
**Shape:** Instant  
**Role:** sustained mitigation

Endure is the deliberate counterpart to Brace.

| Rank | Tier | DR | Duration | Cooldown |
|---|---:|---:|---:|---:|
| **Endure I** | T2 | 18% | 8s | 14s |
| **Endure II** | T3 | 20% | 8s | 14s |
| **Endure III** | T4 | 20% | **10s** | 14s |

Brace:
> high mitigation / short window.

Endure:
> lower mitigation / much longer window.

When multiple Guards become equipable, overlapping Guard DR needs a global stacking rule.

Preferred direction:

> combine mitigation as multiplicative damage-taken layers or apply only the strongest authored Guard-DR effect, rather than adding raw DR percentages without bound.

This must be finalized before T4 double-Guard loadouts are relied upon.

---

# 6. T3 ability ranks

## 6.1 Binding Strike — Tundra

**Slot:** Technique  
**Shape:** Armed  
**Role:** root / hard movement control

The next attack deals modest bonus damage and roots the target.

| Rank | Tier | Hit damage | Root duration | Cooldown |
|---|---:|---:|---:|---:|
| **Binding Strike I** | T3 | 1.20× | 1.5s | 8s |
| **Binding Strike II** | T4 | 1.30× | 2.0s | 8s |

Root means:

- target cannot move;
- target may still attack if a valid target is in range;
- target may still cast/use non-movement actions unless another effect prevents it.

This distinguishes root from stun.

---

## 6.2 Break Free — Tundra

**Slot:** Guard  
**Shape:** Instant  
**Role:** hard-CC counter

Break Free must be allowed to activate **while the player is hard-controlled**.

| Rank | Tier | Effect | Cooldown |
|---|---:|---|---:|
| **Break Free I** | T3 | Remove the current hard-control effect | 14s |
| **Break Free II** | T4 | Remove hard control, then gain **50% Control Resistance for 3s** | 12s |

This is intentionally situational.

That is not a flaw.

It should be extremely valuable in control-heavy content without making those encounters mathematically impossible without it.

Suggested auto-trigger:

> `has-hard-control`

This requires a new trigger/exception because ordinary ability execution may be blocked while stunned.

---

## 6.3 Frenzy — Volcano

**Slot:** Technique  
**Shape:** Instant  
**Role:** short offensive tempo window

| Rank | Tier | Attack Speed | Duration | Cooldown |
|---|---:|---:|---:|---:|
| **Frenzy I** | T3 | +30% | 4s | 10s |
| **Frenzy II** | T4 | +35% | 5s | 10s |

Frenzy grants **Attack Speed only**.

Do not also add:

- damage;
- crit;
- on-hit;
- movement speed;

unless a future evolution explicitly transforms it.

Attack speed already interacts with many class engines and is sufficient identity.

---

## 6.4 Quick Strike — Volcano

**Slot:** Technique  
**Shape:** Armed  
**Role:** low-impact / high-frequency Technique

Quick Strike intentionally establishes the "spam skill" archetype.

| Rank | Tier | Next-hit damage | Cooldown |
|---|---:|---:|---:|
| **Quick Strike I** | T3 | 1.25× | 3.0s |
| **Quick Strike II** | T4 | 1.30× | 2.5s |

This is deliberately much less impactful per activation than normal Techniques.

Its value is frequency.

It provides a natural build option for systems that care about:

- Technique use;
- frequent active attacks;
- low downtime between ability activations.

Do not allow general cooldown scaling to push it toward effectively zero cooldown without an explicit later transformation.

---

# 7. T4 abilities

These abilities are introduced at the current end of the supplied biome map, so only Rank I is authored here.

Future T5+ design must add a bespoke upgrade for each of them.

## 7.1 Disengage — Deep Sea Trench

**Slot:** Technique  
**Shape:** Reposition  
**Tags:** Mobility  
**Role:** kiting / create distance

| Rank | Tier | Distance away | Cooldown |
|---|---:|---:|---:|
| **Disengage I** | T4 | 180 px | 8s |

Disengage has no required damage rider.

The reposition is the effect.

It is a Technique because its tactical purpose is to preserve offensive spacing/range, not because every Technique must directly deal damage.

---

## 7.2 Recuperate — Deep Sea Trench

**Slot:** Guard  
**Shape:** Instant  
**Tags:** Recovery  
**Role:** long, weak Recovery window

| Rank | Tier | Recovery active | Duration | Cooldown |
|---|---:|---:|---:|---:|
| **Recuperate I** | T4 | 25% | 10s | 16s |

Recuperate is the sustained counterpart to Second Wind.

Second Wind:
> stronger healing rate / short duration.

Recuperate:
> weaker healing rate / long duration.

It scales from Recovery and Recovery Skill Potency.

It does not scale from offense.

---

## 7.3 Snipe — Wasteland

**Slot:** Technique  
**Shape:** Cast  
**Role:** long-range deliberate strike

Snipe uses an **ability-specific cast range**.

It does not alter the player's normal attack range.

| Rank | Tier | Damage | Cast time | Ability range bonus | Cooldown |
|---|---:|---:|---:|---:|---:|
| **Snipe I** | T4 | 3.0× Attack | 2.0s | +300 px | 12s |

Snipe deliberately deals less damage than Power Strike IV because part of its budget is spent on extraordinary range.

A melee character can equip Snipe as a ranged tool without becoming a ranged basic-attacker.

Cast interruption rules match other cast Techniques.

---

## 7.4 Stunning Strike — Wasteland

**Slot:** Technique  
**Shape:** Cast  
**Role:** hard crowd control

| Rank | Tier | Damage | Cast time | Stun | Cooldown |
|---|---:|---:|---:|---:|---:|
| **Stunning Strike I** | T4 | 2.3× Attack | 1.5s | 1.5s | 14s |

Stun prevents:

- movement;
- attacks;
- casts/actions.

It is the strongest member of the early control ladder, so it pays through:

- cast commitment;
- long cooldown;
- lower damage than Power Strike.

Stun duration should scale cautiously in future ranks.

---

# 8. The control ladder

The Technique roster contains three deliberately different control levels.

| Ability | Movement | Actions | Cast required | Damage | Cooldown profile |
|---|---|---|---|---|---|
| **Hamstring** | slowed | allowed | no | modest | low |
| **Binding Strike** | stopped | allowed | no | moderate | medium |
| **Stunning Strike** | stopped | **stopped** | **yes** | moderate | high |

This distinction should remain structural.

Do not collapse Slow, Root, and Stun into different numerical strengths of the same status.

---

# 9. The Guard families

## Mitigation

### Brace
Strong / short.

### Endure
Weak / long.

## Recovery

### Second Wind
Strong / short Recovery access.

### Recuperate
Weak / long Recovery access.

## Status

### Cleanse
Ordinary harmful debuffs / DoT stacks.

### Break Free
Hard control.

## Specialized

### Bramble Guard
Anti-swarm plating + retaliation.

This creates recognizable defensive choices without making every Guard another version of "heal X HP."

---

# 10. Final T1–T4 cast

## Techniques

1. Sweep
2. Expose Weakness
3. Power Strike
4. Hamstring
5. Charge
6. Binding Strike
7. Frenzy
8. Quick Strike
9. Disengage
10. Snipe
11. Stunning Strike

## Guards

1. Brace
2. Second Wind
3. Cleanse
4. Bramble Guard
5. Endure
6. Break Free
7. Recuperate

**Total: 18 abilities**

- 11 Techniques
- 7 Guards

The imbalance in total counts is acceptable because later progression grants the second Technique slot before the second Guard slot and the Technique space naturally has more positional/control/offensive variants.

---

# 11. Suggested default auto-triggers

These are first-pass defaults only; runes can override them.

| Ability | Suggested built-in trigger |
|---|---|
| Sweep | in combat |
| Expose Weakness | in combat |
| Power Strike | in combat |
| Second Wind | HP ≤ ~60% |
| Brace | HP ≤ ~50% |
| Cleanse | has eligible debuff |
| Hamstring | in combat |
| Bramble Guard | 3+ enemies aggroed |
| Charge | in combat and target outside comfortable range |
| Endure | HP ≤ ~70% or sustained combat |
| Binding Strike | in combat |
| Break Free | has hard control |
| Frenzy | in combat |
| Quick Strike | in combat |
| Disengage | target too close / spacing condition |
| Recuperate | HP ≤ ~70% |
| Snipe | target within Snipe range and cast can begin |
| Stunning Strike | in combat |

Some of these require new trigger kinds rather than forcing them into an inappropriate existing trigger.

---

# 12. Scaling / potency rules

## Technique Power

Technique Power may improve offensive payloads such as:

- Sweep splash;
- Power Strike damage;
- Hamstring hit damage;
- Charge attack rider;
- Binding Strike hit damage;
- Quick Strike damage;
- Snipe damage;
- Stunning Strike damage.

Technique Power should **not** automatically improve:

- movement distance;
- slow duration;
- root duration;
- stun duration;
- Snipe range;
- Frenzy duration;
- Expose Weakness vulnerability unless explicitly designed later.

## Defensive / Guard Potency

Generic defensive-skill potency should improve continuous defensive magnitudes where sensible, such as:

- Brace DR;
- Endure DR;
- Bramble plating/retaliation if the final stat contract includes those fields.

It should not automatically improve:

- Cleanse stack counts;
- Break Free's discrete CC removal;
- Recovery-tagged skills.

Recovery skills use **Recovery Skill Potency** instead.

## Recovery Skill Potency

Applies to:

- Second Wind
- Recuperate

It modifies the fraction of Recovery activated.

It does not modify passive Recovery access, Barrier, Absorb, Cleanse, or mitigation Guards.

---

# 13. Global defensive rule still required

Before T4's second Guard slot becomes balance-critical, define how simultaneous Guard mitigation combines.

Do not allow additive raw DR stacking to drift toward immunity.

Preferred solutions:

1. multiplicative damage-taken layers; or
2. strongest Guard DR applies, with other non-DR effects still functioning.

This is an implementation/system decision that should be locked before final T4 balance.

---

# 14. Implementation changes implied by the roster

The current ability architecture is already a good base, but this roster requires several extensions.

## Replace generic tier scaling

Replace/deprecate `scalePerTierPct` as the authoritative progression model.

Add authored per-tier/rank data or a resolver capable of returning the correct effect/cooldown/cast values for the player's tier.

## Expand tags

At minimum consider semantic tags for:

- `mobility`
- `recovery`
- `mitigation`
- `control`
- `cleanse`
- `offensive-buff`

Tags should exist because systems/items need them, not merely for taxonomy.

## New/extended payload needs

The roster needs support for:

- attack-speed temporary buff;
- slow on attack;
- root on attack;
- stun on cast strike;
- ability-specific cast range;
- hard-CC removal while controlled;
- long-duration Recovery Guard.

Do not create bespoke execution engines when the existing `armed`, `cast`, `reposition`, and `instant` shapes can carry an expanded effect payload.

## Cleanse correction

Current authored/runtime behavior must be reconciled to the intended model:

> Rank I removes **one stack of one eligible debuff**.

Remove the accidental DR rider.

## Power Strike migration

Rename/move the current `charged-strike` concept into the T1 Mountain **Power Strike** lineage.

If `charged-strike` has shipped in saves, add an ID migration rather than silently deleting the old persisted ID.

---

# 15. Future progression rule

The biome map supplied for this pass ends at T4, but ability progression does not.

When T5+ is designed:

> **Every already-owned ability receives one authored rank upgrade each tier.**

Do not resume generic percentage growth after T4.

For each rank ask:

1. What is this skill's identity?
2. Is its primary magnitude still safe to deepen?
3. Has that magnitude reached a natural cap?
4. Should the next rank improve duration, cooldown, cast time, reliability, or another existing axis instead?
5. Is the new value creating near-permanent uptime or near-zero cooldown?
6. Does the upgrade preserve the distinction between neighboring skills?

The goal is for old skills to remain relevant without becoming spammed or mechanically distorted merely because the player reached a high tier.

---

# 16. Balance status

All numbers in this document are **first-pass seeds**.

They are meant to:

- express relative roles;
- provide implementation targets;
- create a coherent starting point for simulation.

They are not intended to skip the later balance pass.

Particularly sensitive first-pass numbers:

- Expose Weakness vulnerability;
- Brace / Endure DR;
- Cleanse discrete progression;
- hard-CC durations;
- Frenzy attack speed;
- Quick Strike cooldown;
- Snipe range;
- Bramble flat retaliation.

Change these values freely after playtesting while preserving the role of each ability.
