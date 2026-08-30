> **ARCHIVED — implemented and merged 2026-08-21 (`45783e1`+`5080393`).** No dedicated
> current-state doc exists for this system; live behavior is
> `shared/src/data/skillTree/rootsAndFrames.ts`.

# Class Stat Affinity Rework — T1–T3 Implementation Handoff

**Prepared:** 2026-08-21  
**Scope:** class roots, frame choices, and range choices only  
**Source context:** `rootsAndFrames.ts` as provided in the design session  
**Out of scope:** Tier 4 / Path 1 and all later branches; those will be reviewed separately before implementation.

---

## 1. Goal

Replace the current progression model where class nodes repeatedly add large **flat combat stats**
with a cleaner model where:

> **Gear establishes raw magnitude. Class progression establishes ratios and identity.**

The current roots/frames/range choices have good design identities, but many of those identities are
expressed with flat values such as `+attack`, `+maxHp`, and `+plating`. Their relative importance
changes substantially as equipment scales, especially now that equipment upgrades run from `+0` to
`+5`.

The new model should make a class remain recognizably itself across progression.

Examples:

- Squire should remain the heaviest, toughest, slowest chassis even when item stats grow.
- Spirit should remain the lightest, fastest, highest-output chassis.
- A melee Spirit should become survivable enough to function in melee without turning into a Squire.
- A ranged Squire should gain the value of distance without losing the identity of being a heavy class.

This is intentionally a major mathematical change. **Do not attempt to preserve exact current player
power.** A full player/item balance pass will follow after this architecture is implemented.

---

## 2. Core architecture

Use the following conceptual split:

- **Gear = raw stat magnitude**
- **Root = permanent class chassis / affinity**
- **Frame = light / balanced / heavy expression of that class mechanic**
- **Range choice = positional conversion**
- **Later branches = specialization and transformation, increasingly less generic stat growth**

The root should provide the strongest generic stat identity.

Frames should provide a smaller secondary skew.

Range choices should mostly compensate for or exploit positional value rather than recreating the
whole character.

---

## 3. Critical stacking rule: additive affinity, applied once

Generic percentage bonuses from class-tree nodes should **not compound multiplicatively tier by tier**.

Instead, each node contributes percentage points into a shared affinity bucket.

Example:

```text
Squire root       +30% max HP
Bulwark frame     +22% max HP
Vanguard range    +10% max HP
--------------------------------
Total affinity    +62% max HP
```

Then apply the total once:

```text
finalMaxHp = rawMaxHp * (1 + 0.62)
```

Do **not** calculate:

```text
rawMaxHp * 1.30 * 1.22 * 1.10
```

The same principle applies to attack, attack speed, movement speed, plating affinity, and generic
damage-taken affinity.

### Suggested conceptual fields

Exact implementation naming is up to the codebase, but the model should support values equivalent to:

```text
attackPct
maxHpPct
platingPct
attackSpeedPct
moveSpeedPct
damageTakenPct
```

Examples:

```text
attackPct: +0.18       -> +18% attack
attackSpeedPct: -0.15  -> -15% attack speed
damageTakenPct: -0.04  -> take 4% less damage
```

All contributions from the class tree are summed before being applied.

### Important distinction: damage-taken affinity is NOT additive DR

Do not implement `-4% damage taken` by blindly adding four percentage points to the game's existing
`damageReduction` stat.

The intended generic class affinity is conceptually an incoming-damage multiplier applied once after
summing class-tree contributions.

For example:

```text
root  -4%
frame -3%
----------------
total -7%

classDamageTakenMult = 0.93
```

Preserve existing defensive mechanics and their normal stacking rules separately.

---

## 4. What should remain non-generic / mechanically authored

Do not convert every percentage or number in the tree into the generic affinity system.

The following are class mechanics or positional rules and should remain explicitly authored unless
implementation requires a representation change:

- attack range
- evasion
- shield percentage / interval / duration
- DoT resistance
- hit-to-DoT conversion
- max-hit mechanics
- regen burst mechanics
- in-combat regen mechanics
- evade mitigation
- reload ammo / reload timing
- cadence thresholds and empowered multipliers
- cooldown empowered timing and multipliers
- DoT stack/tick/conversion mechanics
- energy generation and empowered multipliers
- summon formation rules
- class-specific range-choice mechanics
- `shared.damage-mult` or equivalent mechanic multipliers already intentionally authored

The purpose of this pass is to replace **generic flat stat growth**, not flatten class mechanics.

---

# 5. Tier 1 — Roots
## Code tier: `0`

The root is the permanent chassis. These are the strongest generic identity modifiers in this pass.

| Root | Attack | Max HP | Plating gained | Attack speed | Move speed | Damage taken | Intended chassis |
|---|---:|---:|---:|---:|---:|---:|---|
| **Squire / Cooldown** | **+18%** | **+30%** | **+30%** | **-15%** | **-10%** | **-4%** | Heavy hitter / tank |
| **Striker / Cadence** | +8% | +18% | +15% | **+6%** | +4% | -2% | Bruiser |
| **Apprentice / DoT** | +10% | +12% | +8% | +2% | +3% | — | Middle chassis |
| **Slinger / Reload** | +10% | +7% | — | **+10%** | **+10%** | — | Light / evasive |
| **Spirit / Energy** | **+15%** | +3% | — | **+12%** | **+12%** | — | Glassier high-output |
| **Conduit / Summoner** | +8% | +8% | — | +4% | +5% | — | Formation-dependent |

### Preserve existing root mechanics

The current root mechanics are intentional identity and should be preserved during this pass.

Examples include:

- **Striker:** regen burst and max-hit interaction
- **Squire:** in-combat regen
- **Apprentice:** DoT resistance and hit-to-DoT conversion
- **Slinger:** evasion / evade mitigation / reload acquisition behavior
- **Spirit:** periodic shield
- **Conduit:** summon-system behavior

Do not rebalance these mechanic values as part of the generic stat conversion unless required to keep
the code functional.

### Intended heavy-to-light spectrum

The five conventional combat chassis should read approximately as:

```text
Squire -> Striker -> Apprentice -> Slinger -> Spirit
heavy                                      light
defensive                                  offensive / mobile
slow                                       fast
```

Conduit should **not** be forced onto this line. Its effective offense and survival depend heavily on
summon interception, formation size, reconstruction cost, and summon behavior.

---

# 6. Tier 2 — Frames
## Code tier: `1`

Frames express light / balanced / heavy versions of each root.

The generic stat budget is deliberately smaller than the root budget because the frame mechanics
already supply substantial power and identity.

---

## Cadence

| Frame | Attack | HP | Plating | Attack speed | Move | Damage taken |
|---|---:|---:|---:|---:|---:|---:|
| **Flurry** | +6% | +4% | — | **+12%** | +10% | — |
| **Skirmisher** | +7% | +10% | +10% | +4% | +3% | — |
| **Breaker** | +5% | **+18%** | **+20%** | -10% | -10% | -2% |

Preserve the current cadence mechanic identities:

- Flurry: frequent smaller empowered finisher
- Skirmisher: balanced cadence
- Breaker: slower, much larger empowered finisher

Do not turn the light frame into an "on-hit frame." Its identity is **tempo**, represented mainly by
attack speed.

---

## Cooldown

| Frame | Attack | HP | Plating | Attack speed | Move | Damage taken |
|---|---:|---:|---:|---:|---:|---:|
| **Warrior** | +7% | +5% | +5% | **+12%** | +10% | — |
| **Knight** | +8% | +12% | +15% | +3% | -2% | -2% |
| **Bulwark** | **+10%** | **+22%** | **+25%** | -12% | -12% | -3% |

Bulwark intentionally still receives meaningful attack affinity. The class fantasy is **large
individual hits**, not merely "maximum defense." Its sustained basic-attack throughput is constrained
by its low attack speed.

Preserve the existing empowered-cooldown identities.

---

## DoT

| Frame | Attack | HP | Plating | Attack speed | Move | Damage taken |
|---|---:|---:|---:|---:|---:|---:|
| **Venom Vessel** | +6% | +4% | — | **+10%** | +10% | — |
| **Ember Mage** | +7% | +10% | +10% | +3% | — | — |
| **Rime-Bound** | +8% | **+18%** | **+20%** | -10% | -10% | -3% |

Preserve the authored mechanic spectrum:

```text
Venom -> many fast stacks / fast ticks
Ember -> middle
Rime  -> few slower, heavier stacks
```

The frame stats should support this mechanic identity rather than replace it.

---

## Reload

| Frame | Attack | HP | Plating | Attack speed | Move | Additional evasion |
|---|---:|---:|---:|---:|---:|---:|
| **Scout** | +8% | +4% | — | **+10%** | +10% | **+7 percentage points** |
| **Marksman** | +8% | +8% | — | +4% | +4% | **+4 percentage points** |
| **Artillerist** | **+10%** | +14% | +12% | -4% | -5% | — |

The current implementation gives very large frame-level evasion bonuses. For this first pass, reduce
them to the values above and let simulation/playtesting determine whether avoidance needs to rise
again.

Preserve current magazine-size and reload-time identities.

---

## Energy

| Frame | Attack | HP | Plating | Attack speed | Move | Damage taken |
|---|---:|---:|---:|---:|---:|---:|
| **Spark** | +7% | +3% | — | **+12%** | **+12%** | — |
| **Wraith** | +8% | +7% | +6% | +6% | +6% | — |
| **Phantasm** | **+10%** | +14% | +12% | -10% | -8% | -2% |

Preserve energy generation / empowered-hit differences. Those mechanics carry a large portion of the
frame's specialization.

---

## Summoner

Summoner should use a conservative generic stat budget because formation size and reconstruction
already create unusual offense and defense scaling.

| Frame | Attack | HP | Plating | Attack speed | Move | Damage taken |
|---|---:|---:|---:|---:|---:|---:|
| **Splinter** | — | +4% | — | +6% | +8% | — |
| **Consort** | — | +8% | +6% | — | +2% | — |
| **Effigy** | — | +16% | +12% | -6% | -6% | -1% |

If attack speed multiplies the entire formation in a way that makes Splinter disproportionately
powerful, remove or reduce Splinter's `+6%` attack-speed affinity before changing its core formation
mechanic.

---

# 7. Tier 3 — Range choices
## Code tier: `2`

The range tier changes how the existing chassis interacts with positioning.

General philosophy:

- **Close:** gives up distance as defense; receives the largest raw defensive compensation and keeps a
  class-specific defensive payoff.
- **Mid:** safe/default all-around growth.
- **Far:** receives minimal raw combat stats because range, first-hit advantage, and movement are
  already forms of defense.

Do not make every class receive an identical Close/Mid/Far stat package.

A naturally ranged/light chassis should receive **more Close compensation** than a naturally
melee/heavy chassis, while retaining its original defensive identity.

---

## Cadence

| Range | Attack | HP | Plating | Attack speed | Move |
|---|---:|---:|---:|---:|---:|
| **In-Fighter / Close** | +4% | **+12%** | +10% | +6% | — |
| **Lancer / Mid** | +6% | +8% | +6% | +4% | +2% |
| **Phantom-Blade / Far** | +3% | +3% | — | +2% | +8% |

Preserve Close's existing stronger healing-pulse behavior and its authored damage mechanic.

---

## Cooldown

| Range | Attack | HP | Plating | Attack speed | Move |
|---|---:|---:|---:|---:|---:|
| **Vanguard / Close** | +4% | +10% | **+12%** | +5% | — |
| **Phalanx / Mid** | +6% | +8% | +8% | +3% | — |
| **Sentinel / Far** | +3% | +3% | +3% | +2% | +6% |

Squire needs less Close compensation because its root chassis is already designed to live in melee.

Preserve Vanguard's enhanced in-combat regen behavior.

---

## DoT

| Range | Attack | HP | Plating | Attack speed | Move |
|---|---:|---:|---:|---:|---:|
| **Hexblade / Close** | +4% | **+15%** | +8% | +6% | — |
| **Warlock / Mid** | +6% | +8% | +6% | +4% | +2% |
| **Harbinger / Far** | +3% | +3% | — | +2% | +10% |

Preserve Hexblade's class-specific absorption payoff.

Hexblade should feel like an Apprentice converted into a melee attrition/drain fighter, not like a
small Squire.

---

## Reload

| Range | Attack | HP | Plating | Attack speed | Move |
|---|---:|---:|---:|---:|---:|
| **Breacher / Close** | +4% | **+18%** | +5% | +6% | +2% |
| **Enforcer / Mid** | +6% | +8% | +3% | +4% | +4% |
| **Deadeye / Far** | +3% | +3% | — | +2% | **+12%** |

Breacher should receive much of its melee survival from **HP + evasion / evade mitigation**, rather
than becoming heavily plated.

Preserve the existing close-range evasion and evade-mitigation enhancement.

---

## Energy

| Range | Attack | HP | Plating | Attack speed | Move |
|---|---:|---:|---:|---:|---:|
| **Haunt / Close** | +4% | **+20%** | +4% | +6% | +2% |
| **Shade / Mid** | +6% | +8% | +3% | +4% | +4% |
| **Wisp / Far** | +3% | +3% | — | +2% | **+12%** |

Haunt receives the largest HP compensation because Spirit sacrifices the most natural defensive value
when forced into melee.

However, Haunt must remain recognizably Spirit:

- light armor
- high speed / attack tempo
- strong offense
- shield-driven survival

Preserve the existing Close shield enhancement.

Do **not** make Haunt defensively equivalent to a Squire path merely because it can function in melee.

---

## Summoner

Summoner intentionally inverts the normal range logic.

- Close summons can intercept and protect the Conduit.
- Far summons are more fragile / distant and provide less interception.
- Therefore more of the defensive budget stays on the Conduit when choosing Far.

| Range | Attack | HP | Plating | Attack speed | Move | Damage taken |
|---|---:|---:|---:|---:|---:|---:|
| **Vigil / Close** | — | +6% | +4% | — | — | — |
| **Procession / Mid** | — | +10% | +6% | — | +2% | — |
| **Harrier / Far** | — | **+18%** | **+12%** | — | +10% | -2% |

Preserve the formation behavior implied by the existing range variants.

---

# 8. Sanity-check examples

These are not additional rules; they illustrate the intended additive model.

## Squire -> Bulwark -> Vanguard

Approximate generic affinity totals:

| Stat | Total |
|---|---:|
| Attack | **+32%** |
| Max HP | **+62%** |
| Plating gained | **+67%** |
| Attack speed | **-22%** |
| Move speed | **-22%** |
| Damage taken | **-7%** |

This should feel like a walking fortress that attacks slowly but hits very hard.

---

## Spirit -> Spark -> Haunt

Approximate generic affinity totals:

| Stat | Total |
|---|---:|
| Attack | **+26%** |
| Max HP | **+26%** |
| Plating gained | +4% |
| Attack speed | **+30%** |
| Move speed | **+26%** |
| Shield | enhanced by existing class mechanic |

This should make melee Spirit viable without making it resemble Squire defensively.

---

# 9. Light-frame design rule

Do **not** add generic on-hit amplification to Light frames simply because faster attack speed can
support on-hit builds.

The intended rule is:

> **Light means tempo, not on-hit specialization.**

Attack speed is intentionally build-agnostic:

- basic attack builds benefit
- on-hit builds benefit
- energy generation benefits
- cadence accumulation benefits
- DoT application benefits
- reload-based builds can benefit
- future mechanics can benefit

On-hit amplification should be reserved for later specializations, items, rites, cores, or other
systems that deliberately choose that archetype.

---

# 10. Plating implementation note

A percentage bonus to plating naturally scales poorly when the character has little or no raw plating.

For this implementation pass, use the percentage affinities in the tables above.

Do **not** invent additional innate flat plating unless the existing base-stat system already requires
it or testing reveals that a class cannot express its intended armor identity without it.

If that problem appears, report it as a balance/design follow-up rather than silently adding new flat
stats.

---

# 11. Migration expectations

This is a first-pass architecture change, not a final balance pass.

Expected consequences:

- current player DPS will change
- current player eHP will change
- class gaps may widen or shrink
- +0 to +5 equipment scaling will interact very differently with class identity
- some existing balance tests may fail because their assumptions encode the old flat-stat system
- bosses and monsters should **not** be retuned inside this implementation unless required to fix a
  broken test that is purely structural

Do not compensate for unexpected class power by editing monsters, bosses, gear, or economy in the same
pass.

The next stage after implementation is to run the existing balance simulations and playtests, then
retune the new affinity values.

---

# 12. Scope boundaries

Implement only the stat architecture and table changes covered here:

1. Tier 1 roots (`code tier 0`)
2. Tier 2 frames (`code tier 1`)
3. Tier 3 range nodes (`code tier 2`)

Do **not** redesign or rebalance:

- Tier 4 / Path 1
- later class branches
- equipment
- item upgrade scaling
- monsters
- bosses
- biome mitigation
- rewards/economy
- unrelated combat systems

Tier 4 / Path 1 will be reviewed separately because those nodes substantially modify class mechanics
and may deserve little or no additional generic stat budget depending on how much power their
mechanics already provide.

---

# 13. Implementation guidance

Before editing:

1. Read project instructions.
2. Inspect the current stat aggregation pipeline.
3. Locate every consumer of `statEffects`.
4. Determine whether the existing model can represent additive percentage affinities cleanly.
5. Inspect how current `attackSpeedPct` and other percentage fields stack so the new generic affinity
   layer does not accidentally double-apply them.

Prefer a coherent centralized implementation over translating every percentage into ad-hoc node-local
logic.

The desired behavior is:

```text
raw stats from base character + equipment
        ↓
sum generic class-tree affinities
        ↓
apply each generic affinity once
        ↓
apply/preserve authored class mechanics according to their existing combat rules
```

If the current architecture makes this ordering impossible or materially unsafe, document the issue
before choosing an alternative.

---

# 14. Verification

After implementation:

1. Run typecheck.
2. Run the full test suite.
3. Run build validation.
4. Run existing class/balance simulations where available.
5. Compare representative +0 / +3 / +5 builds.
6. Verify that root identity becomes **more stable**, not less stable, as gear improves.
7. Verify that Close Spirit/Reload variants can function without converging statistically on Squire.
8. Verify that Squire remains the heaviest chassis even on Far.
9. Verify that Light frames benefit fast/basic/on-hit builds without explicitly requiring on-hit.
10. Pay special attention to Summoner because summon scaling may make generic attack-speed changes
    behave differently from other classes.

Report:

- files changed
- aggregation semantics implemented
- before/after representative stats
- tests/simulations run
- major balance outliers
- any architecture or formula concerns that should be resolved before the later balance pass

---

## Final design principle

This pass should make class identity scale with the character rather than being overwhelmed by item
progression.

The intended hierarchy is:

> **Root defines what you are.**  
> **Frame defines how you express it.**  
> **Range defines where you fight.**  
> **Later branches define what specialized build you become.**

Do not optimize these numbers to final balance during implementation. They are deliberately strong,
coherent first-pass values intended to be tested and tuned afterward.
