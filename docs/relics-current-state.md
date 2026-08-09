# Relics — Current State

**Implemented:** 2026-08-04  
**Living design:** `design_docs/relics-design.md`  
**Historical build plan:** `docs/archive/relics-implementation-plan.md`

## Shipped contract

Relics are the sixth equipment slot. A player may equip one universal Relic,
and its generic ratings are interpreted by the selected root combat archetype.
Relics strengthen the class mechanic rather than ordinary character stats,
remain equipped across class changes, and immediately resolve for the new class.

The slot unlocks at `playerTier: 4`, matching the live progression domain where
`playerTier: 0` is the Clearing tutorial and Tier 4 world content uses tier 4.
The server rejects early equips; inventory and equipment UI use the same shared
policy. The test room bypasses the gate.

Relics:

- carry item tier 4 and occupy `equipment.relic`;
- persist and network through the existing inventory slice;
- have no ordinary stats or `+N` upgrades;
- evolve through named lineages by consuming a `+0` predecessor;
- use mastery-only acquisition, with no boss-clear requirement or random drop;
- use the internal biome key `graveyard` for the display biome Wasteland.

Old saves are normalized through `normalizeEquipment()`, which adds
`relic: null` without altering existing equipment.

## Universal ratings

| Rating | Passive key | Meaning |
|---|---|---|
| Frequency | `relic.mechanic-frequency` | How often the root mechanic is delivered |
| Potency | `relic.mechanic-potency` | Strength or capacity of the root mechanic |
| Buff effect | `relic.mechanic-buff-effect` | Magnitude of approved mechanic-origin buffs |
| Debuff effect | `relic.mechanic-debuff-effect` | Magnitude of approved mechanic-origin debuffs |

Ratings are signed and clamped to `[-0.75, 2]`. Interval resolvers have explicit
floors, discrete values are rounded deterministically, and multiplier scaling
changes only the bonus above `1`.

`shared/src/systems/relics.ts` is the formula authority for server combat, HUD
values, Forge previews, and item details:

| Root | Frequency | Potency |
|---|---|---|
| Cadence | Lower empowered-hit threshold | Higher empowered multiplier |
| Cooldown | Shorter execution cooldown | Higher empowered multiplier |
| Reload | Shorter reload | Larger magazine |
| DoT | Shorter tick interval | Higher stack cap, preserving the pre-Relic damage reference |
| Energy | More energy per qualifying hit | More capacity and proportional discharge power |
| Summoner | Shorter respawn | More active summons within the safety cap |

## Mechanic-origin effect scaling

Secondary ratings are explicit opt-ins, not blanket status scaling.
`SCALABLE_MECHANIC_BUFFS` and `SCALABLE_MECHANIC_DEBUFFS` list eligible effect ids,
fields, and numeric shapes. Durations, timing, trigger conditions, stack caps,
healing, shielding, recovery, and defensive magnitudes are excluded from v1.

Mechanic debuffs pass `{ origin: 'mechanic' }` through the player-debuff funnel,
so Controller Core scaling composes with Relic scaling while weapon, ability,
monster, and ally effects do not inherit it. State-backed class buffs use the
same registry through `playerMechanicBuffMagnitude()`.

## T4 base cast

Every recipe is unreachable at `playerTier: 3` and reachable at `playerTier: 4`
under `biomeLevelCap()`.

| Relic | Biome | Mastery | Frequency | Potency | Buff | Debuff |
|---|---|---:|---:|---:|---:|---:|
| Hastebound Dial | Forest | 24 | +35% | -25% | — | — |
| Colossus Heart | Mountain | 24 | -30% | +40% | — | — |
| Equilibrium Shard | Plains | 24 | +10% | +10% | — | — |
| Verdant Flywheel | Jungle | 18 | +20% | -20% | +25% | — |
| Glacial Bell | Tundra | 12 | -20% | +25% | +25% | — |
| Virulent Hourglass | Swamp | 24 | +20% | -20% | — | +25% |
| Withering Lens | Desert | 18 | -20% | +25% | — | +25% |
| Haunted Prism | Wasteland (`graveyard`) | 6 | -10% | -10% | +35% | +35% |

Cave, Volcanic, and Trench intentionally have no launch Relic.

## Presentation

The equipment panel always shows one Relic socket and disables it before the
unlock tier. Backpack equip actions are likewise disabled early. Forge and item
details show the signed universal ratings plus exact before/after values for the
current root class using the shared resolver.

The launch cast ships bespoke PixelLab icons in `art/src/items/relics/`, wired
through `art:wire`. The slot has its own visual language: a **square blackened-iron
plate** whose centre opening holds one biome-coloured working part. This is
deliberately the opposite of the Core slot's circular cut gemstone — no gem, bezel,
or facet may appear on a Relic, and those bans are what keep the two fifth/sixth-slot
item classes apart at 32px.

The plate's **frame encodes the trade shape**, so the rating spread is legible before
the tooltip:

| Frame | Trade | Relics |
|---|---|---|
| Finely ticked, narrow | Frequency-forward | Hastebound Dial, Verdant Flywheel, Virulent Hourglass |
| Thick, one blunt block per corner | Potency-forward | Colossus Heart, Glacial Bell, Withering Lens |
| Smooth, unbroken, even | No trade | Equilibrium Shard |
| Cracked open with gaps | Both ratings down | Haunted Prism |

Corner caps are reserved as the T5/T6 escalation lever, since the frame is spent.

## Verification and deferred work

Automated coverage includes legacy-save normalization, `+0` evolution, resolver
math and safety clamps, all six root profiles, effect-field inclusion/exclusion,
the exact eight-item cast and T4 mastery placement, equip authority, passive
folding, test-room bypass, and a real world tick for every launch Relic.

Still deferred:

- final balance coefficients, costs, and mastery placement after playtesting;
- an in-game legibility check on Haunted Prism and Hastebound Dial, the two
  lowest-contrast icons of the eight (both are a cheap re-roll if they don't read
  against the real backpack background);
- T5/T6 named evolutions and branches;
- future lines for currently unrepresented biomes;
- balance-bench Relic axis sweeps.
