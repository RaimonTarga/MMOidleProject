# Relic System Design

**Status:** implemented; live behavior in `docs/relics-current-state.md`.  
**Decided:** 2026-08-03.  
**Historical implementation plan:** `docs/archive/relics-implementation-plan.md`.  
**Design inputs:** `docs/archive/briefs/d2-relics.md` and
`docs/archive/briefs/d2-relics-seam-audit.md`.

## Identity

Relics are a single late-game equipment slot that reshapes the player's root
class mechanic.

> Cores amplify the player's role. Relics transform the rhythm and expression
> of the player's class mechanic.

Relics do not provide ordinary attack, health, plating, recovery, movement, or
attack-speed stats. Their shared vocabulary is mechanic frequency, mechanic
potency, mechanic buff effect, and mechanic debuff effect. Every relic is
universal: the same item works for all six root classes, but the universal stats
resolve differently for each mechanic.

The system becomes available at Tier 4. In the live progression domain this is
`playerTier: 4`, because `playerTier: 0` is the Clearing tutorial. The shipped
system centralizes this in `RELIC_UNLOCK_PLAYER_TIER` and `relicIsUnlocked()`.

## Locked decisions

| Question | Decision |
|---|---|
| State model | A sixth equipment slot named `relic` |
| Equipped count | Exactly one, permanently |
| Class eligibility | Universal; never class-locked |
| Core stats | Mechanic Frequency and Mechanic Potency |
| Secondary stats | Mechanic Buff Effect and Mechanic Debuff Effect |
| Negative values | Frequency and potency may be negative and are the principal trade-off axes |
| Unlock | Tier 4 / live `playerTier: 4` |
| Acquisition | One unique mastery-gated recipe in each participating biome; not every biome must ship a relic |
| Item upgrades | No `+0…+5` enhancement track |
| Long-term progression | Named evolution lineages, consuming the predecessor at `+0` |
| Launch scope | Eight base relics; Cave, Volcanic, and Trench may receive later lines |

## Design principles

### One item, six interpretations

A relic stores generic `relic.*` ratings rather than six sets of class keys.
The equipped character's archetype resolves those ratings into concrete mechanic
changes. This is the reason relics can remain universal without becoming generic
stat sticks.

The item card always shows its universal ratings. When a character can resolve
the item, the tooltip also shows the concrete before/after mechanic values for
that character.

Example:

```text
Mechanic Frequency: +35%
For Striker: Finisher every 4 hits (normally 5)
```

### Frequency and potency are ratings

The four relic values are normalized design ratings, not a promise that every
class receives the same literal percentage. An extra summon is not comparable
to a 10% shorter cooldown, and discrete mechanics have breakpoints. Each
archetype therefore owns coefficients, rounding, and safety floors while using
the same universal input.

Rate-shaped mechanics should use a consistent starting model:

```text
effective interval = base interval / (1 + frequency rating × class coefficient)
effective gain     = base gain × (1 + frequency rating × class coefficient)
```

The resolver applies relics after root, frame, specialization, skill, and other
equipment mechanic changes. It then clamps and rounds once. This makes a relic
transform the mechanic the build actually has instead of replacing it with a
hardcoded baseline.

### Empowered potency scales the bonus portion

For Cadence and Cooldown empowered attacks, potency scales damage above a normal
hit rather than multiplying the whole hit:

```text
effective multiplier = 1 + (base multiplier - 1) × potency factor
```

A ×2.0 empowered attack with a `+40%` potency factor becomes ×2.4, not ×2.8.
This avoids paying the relic bonus again on the ordinary ×1 portion of the hit.

### Real costs, including negative core stats

The primary relic design space is a strong advantage paired with a meaningful
frequency or potency loss. Negative ratings are supported intentionally.

- High frequency / low potency creates many smaller mechanic events.
- Low frequency / high potency creates fewer, larger mechanic events.
- Secondary-focused relics still pay a cost on the two core axes.

A negative secondary value cannot serve as a relic's principal downside because
some builds do not produce an eligible buff or debuff and would ignore the cost.

### Relics change mechanics; runes decide behavior

Relics change what the root mechanic is: its cadence, payload, or effects. They
do not add condition-to-action rules, choose targets, or decide when abilities
fire. Those remain rune responsibilities.

## Archetype resolution

| Root class | Mechanic Frequency | Mechanic Potency |
|---|---|---|
| Cadence / Striker | Reduces attacks required for a finisher | Increases the finisher multiplier |
| Cooldown / Squire | Reduces execution cooldown | Increases the execution multiplier |
| Reload / Slinger | Reduces reload duration | Increases maximum ammunition / magazine size |
| Damage over Time | Reduces DoT tick interval | Increases maximum DoT stacks |
| Energy | Increases energy gained per attack | Increases maximum energy and proportionally increases discharge multiplier |
| Summoner | Reduces minion resummon time | Increases maximum summons |

### Discrete mechanics

Cadence thresholds, ammunition, DoT stacks, energy capacity where displayed as
an integer, and summon counts must be authored around real breakpoints. The
resolver must guarantee that a non-zero authored rating produces the intended
change for the base frame or the relic must not claim that change in its text.

Suggested hard floors for the first implementation:

- Cadence threshold: at least 2 attacks.
- Cooldown, reload, DoT tick, and resummon intervals: explicit per-mechanic
  floors, never zero or negative.
- Energy gain and maximum energy: at least 1.
- Ammunition and maximum summons: at least 1.
- Empowered multipliers: never below ×1 unless a future named relic explicitly
  designs a non-damaging mechanic.

Exact coefficients and interval floors belong to the balance pass and must live
in the shared resolver, not at scattered read sites.

### Energy coupling

Energy potency deliberately changes both capacity and discharge strength. More
capacity takes longer to fill at unchanged gain, so Energy receives a natural
frequency cost inside potency. Mechanic Frequency can offset or exaggerate that
relationship by changing gain per attack.

The discharge multiplier grows from the ratio between effective and pre-relic
maximum energy, using the same “bonus above ×1” rule as other empowered attacks.

### DoT throughput rule

The current DoT formula normalizes damage per stack around tick interval and max
stacks, making both changes DPS-neutral. Relics intentionally break that
normalization:

- Frequency shortens the effective tick interval without reducing the damage
  of each tick.
- Potency raises the effective stack cap without reducing damage per stack.

Damage per stack is calculated from the fully resolved pre-relic DoT profile;
the relic then changes delivery rate and stack ceiling. This makes both relic
stats genuine throughput axes while preserving frame and specialization
identity.

## Mechanic buff and debuff effect

`Mechanic Buff Effect` increases the magnitude of registered beneficial effects
emitted directly by a root mechanic or one of its specializations.

`Mechanic Debuff Effect` increases the magnitude of registered harmful effects
emitted directly by a root mechanic or one of its specializations.

These stats modify magnitude only. They do not modify:

- duration;
- trigger frequency;
- maximum stacks;
- proc conditions;
- effects from abilities, gear, cores, stances, rites, runes, allies, or
  monsters;
- healing or shielding derived from offensive output.

Eligibility is explicit, not inferred from whether a status effect happens to
be positive or negative. Implementation uses registered mechanic-origin effect
ids and magnitude fields. A mechanic debuff may include DoT damage-per-stack
only when that field is explicitly registered; it is never a blanket multiplier
over every harmful status.

Existing global player-debuff scaling, such as the Controller Core, composes
with relic scaling. Core scaling applies to its approved player-debuff registry;
relic scaling additionally requires mechanic origin. Defensive and recovery
fields are excluded by default and require an explicit later budget decision.

## T4 base cast

Names and numbers are initial authoring targets. They define identities and
trade shapes; the balance pass owns final coefficients.

| Relic id | Display name | Biome | Frequency | Potency | Buff effect | Debuff effect | Identity |
|---|---|---|---:|---:|---:|---:|---|
| `relic-hastebound-dial` | Hastebound Dial | Forest | +35% | -25% | — | — | Frequent, weaker mechanic activations |
| `relic-colossus-heart` | Colossus Heart | Mountain | -30% | +40% | — | — | Fewer but enormous mechanic activations |
| `relic-equilibrium-shard` | Equilibrium Shard | Plains | +10% | +10% | — | — | Lower-budget safe generalist |
| `relic-verdant-flywheel` | Verdant Flywheel | Jungle | +20% | -20% | +25% | — | Frequent mechanics with stronger mechanic buffs |
| `relic-glacial-bell` | Glacial Bell | Tundra | -20% | +25% | +25% | — | Deliberate, powerful mechanics with stronger buffs |
| `relic-virulent-hourglass` | Virulent Hourglass | Swamp | +20% | -20% | — | +25% | Rapid mechanics with stronger mechanic debuffs |
| `relic-withering-lens` | Withering Lens | Desert | -20% | +25% | — | +25% | Heavy mechanics with stronger debuffs |
| `relic-haunted-prism` | Haunted Prism | Wasteland (`graveyard`) | -10% | -10% | +35% | +35% | Sacrifices the core mechanic to specialize in its secondary effects |

This cast covers the pure poles, a safe generalist, frequency/potency versions
of both secondary axes, and one secondary specialist. Eight universal relics
produce up to 48 root-class interpretations before frames and specializations
are considered.

Cave, Volcanic, and Trench do not need a launch relic merely to fill a matrix.
They are reserved for later lines whose identities are genuinely distinct.

## Acquisition

Each participating biome owns one unique relic recipe. The recipe unlocks in
that biome's T4 mastery band and uses the existing forge, essence, and catalyst
machinery. Exact mastery levels and costs are a content-balance decision, but
the following rules are fixed:

- no boss-clear requirement for the base cast;
- no random relic drops;
- mastering a biome reveals its specific recipe;
- the recipe remains visible as a future mastery reward where the existing UI
  supports locked-recipe previews;
- a biome may intentionally have no relic until a distinct design exists.

## Progression and evolution

Relics do not use the ordinary `+0…+5` enhancement track. Small upgrade steps
interact badly with discrete thresholds and multiply the six-class balance
matrix without adding meaningful identity.

Instead, relics use named evolution lineages. Evolution consumes the predecessor
at `+0`, costs the evolved recipe's essence/catalysts, and grants the successor.
Later tiers may branch a lineage.

An evolution should deepen the original choice rather than erase its downside:

```text
Hastebound Dial (T4)
  → Accelerating Dial (T5): more frequency, a larger potency cost, small buff effect
    → Perpetual Engine (T6): extreme frequency branch
    → Harmonic Engine (T6): moderate frequency plus stronger mechanic buffs
```

Evolution directions include:

- making the original trade more extreme;
- adding a secondary effect that reinforces the original rhythm;
- branching between pure specialization and a less extreme hybrid.

Evolution must not converge toward “all positive stats with no downside.” The
one-slot constraint is permanent across later tiers.

## Presentation requirements

- Inventory and forge surfaces label the sixth slot `Relic`.
- Before the unlock tier, the UI may show a locked Relic socket; it must not
  imply that a second slot will unlock later.
- Relic tooltips show signed universal ratings and a character-specific resolved
  preview with before/after values.
- Discrete previews use exact integers; interval previews use seconds or
  milliseconds consistently with the existing mechanic UI.
- A relic remains equippable after a class reset and immediately resolves for
  the new root class.
- Missing or disabled Summoner support must degrade to an honest unavailable
  preview, never a fabricated effect.

## Non-goals for the first implementation

- More than one equipped relic.
- Class-restricted relic ids.
- Random procs.
- Condition-to-action behavior.
- Ordinary item stats.
- Relic-specific persistence outside equipment.
- `+N` enhancement steps.
- T5/T6 evolved content beyond proving that the lineage plumbing works.
- Filling every biome with a relic for symmetry.

## Balance obligations

Universal does not mean equally valuable without tuning. Every authored relic
must be simulated against all six roots and representative frames/specs. The
highest-risk interactions are stacking/ramping specializations, discrete summon
and magazine breakpoints, DoT frequency × stack-cap multiplication, and any
build where a secondary effect scales an already compounding buff or debuff.

The first balance pass should include, at minimum:

- each relic × each root baseline;
- frequency and potency extremes on every frame;
- DoT sustained and short-fight scenarios;
- Summoner count and respawn breakpoints;
- Reload small-clip and large-clip specializations;
- Cadence ramping thresholds;
- mechanic buff/debuff relics against every registered scalable effect.
