# Node Modifiers — Current State

**Living truth for what node modifiers do today.** Design authority for the map as a
whole is [map-variety-plan.md](map-variety-plan.md), but that doc's §1.2 (five *pace*
families) and §1.6 (a separate density overlay) were superseded on 2026-08-21 — read
this doc and the code for modifier behavior.

Code: [`shared/src/world/nodeModifiers.ts`](../shared/src/world/nodeModifiers.ts)
(all math), [`nodeModifierTypes.ts`](../shared/src/world/nodeModifierTypes.ts)
(vocabulary, bans, natives), [`nodeModifierMap.ts`](../shared/src/world/nodeModifierMap.ts)
(the authored per-node assignment).

> All magnitudes are PLACEHOLDER pending a balance/playtest pass. They live in one
> block at the top of `nodeModifiers.ts` and are meant to be retuned there.

## 1. The five modifiers

Every non-excluded node carries **exactly one** modifier, which is both its
personality and its catalyst key. There is no second axis and no mechanic overlay:
each modifier is plain scalars plus a spawn count, baked into the entity at spawn.

| Modifier | Identity | Reshapes |
|---|---|---|
| **Alacrity** | Faster attacks and movement, damage untouched | Offence tempo |
| **Heavy** | Slower attacks that land much harder | Offence shape |
| **Swarming** | Far more monsters, stats untouched | Population |
| **Dominion** | Fewer monsters, each stronger in every respect | Population + all stats |
| **Fortified** | Armoured well past its kind — the same fight, twice as long | Defence only |

All five are **net difficulty increases** over an unmodified node, paid for with a
per-kill reward premium. Since every combat node carries one, the unmodified baseline
is never actually played — it is only the reference the multipliers measure against.

## 2. The math

One magnitude `M` per node tier drives everything:

| | T1 | T2 | T3 | T4 |
|---|---|---|---|---|
| **M** | 0.05 | 0.10 | 0.15 | 0.20 |

Modifiers are deliberately a **small distinction in T1 that grows into a real one by
T4**: a new player should barely notice which node they picked, a late player should
plan around it. Tiers outside this table resolve fully neutral.

`modifierStatScalars(family, tier)` — applied to non-boss monsters at spawn:

| Modifier | Attack | Attack interval | Move | HP | Plating | Damage taken |
|---|---|---|---|---|---|---|
| Alacrity | — | ×(1−M) | ×(1+M) | — | — | — |
| Heavy | ×(1+2M) | ×(1+M) | — | — | — | — |
| Swarming | — | — | — | — | — | — |
| Dominion | ×(1+2M) | — | ×(1+M/2) | ×(1+M) | ×(1+M) | ×(1−M/2) |
| Fortified | — | — | — | — | ×(1+2M) | ×(1−M) |

Two of these factors are load-bearing rather than flavour:

- **Heavy's ×(1+2M) attack** against a ×(1+M) cadence is what makes it net
  DPS-positive — bigger bites, slower tempo, more damage overall.
- **Dominion's ×(1+2M) attack** covers the bodies it removes. Sustained pressure is
  `d(N+1)/2`, so cutting the count drags pressure *down* before any stat rise; at
  ×(1+M) Dominion was quietly the safest modifier in the game.

Damage taken folds into damage reduction multiplicatively as
`DR' = 1 − (1 − DR) × incomingDamageMult`, clamped to `[0, 0.95]`, so it works from
`DR 0` where a naive `DR × k` cannot.

**DoT** rides the modifier's *net damage* multiplier (`attackMult / cooldownMult`),
not `attackMult` alone — see `modifiedDotDamagePerStack`. Without this, DoT-heavy
biomes like Swamp barely felt their modifiers at all.

### Population and rewards

Both scale by tier alongside `M`:

| Tier | Swarming count | Dominion count | Alacrity | Heavy | Swarming | Dominion | Fortified |
|---|---|---|---|---|---|---|---|
| T1 | +8% | −5% | +5% | +4% | +1% | +10% | +6% |
| T2 | +12% | −8% | +10% | +8% | +2% | +20% | +13% |
| T3 | +16% | −12% | +15% | +12% | +3% | +30% | +19% |
| T4 | +20% | −15% | +20% | +16% | +4% | +40% | +25% |

(Left pair: `modifierSpawnFactor`. Right five: `modifierRewardMult`, computed as
`1 + factor × M` with per-family factors 1.0 / 0.8 / 0.2 / 2.0 / 1.25, rounded to the
nearest whole percent.)

Population changes stay timid on purpose. Damage taken from a pull is **quadratic** in
the number of concurrent attackers, and population enters sustained pressure through
`(N+1)/2` — far more sensitive than any stat multiplier. A spread wider than the ×1.20
progression step between biomes lets a Swarming Plains out-pressure a Dominion Forest
and the biome order stops being readable.

Rewards pay the difficulty back on essence, biome XP, and catalyst progress alike.
**Swarming pays near-nothing per kill** because it already pays per hour by providing
more bodies; **Dominion pays most** because it removes bodies *and* strengthens what
remains, so each kill carries the whole increase.

## 3. Where it is wired

| Seam | File |
|---|---|
| Stat reshaping at spawn (bosses immune) | `server/src/systems/world/spawning/index.ts` |
| Node headcount — the only population seam | `World.getMobDensity` |
| Per-kill reward premium + catalyst key | `server/src/systems/player/progression/rewards.ts` |
| Monster DoT scaling | `server/src/systems/combat/engine/monsterMechanics.ts` |
| Map badge + detail rows | `client/src/ui/map/NodeInfo.tsx`, `ModifierIcon.tsx` |
| Per-monster preview stats | `client/src/ui/map/monsterInfo.ts` |
| Progression readout under modifiers | `tools/tier-table.ts` |

`modifierDetails()` is a **readout of the runtime, not a second authoring of the
numbers** — every numeric row it emits must equal what spawning applies. The shared
test asserts that row-by-row at all four tiers; it exists because Dominion once
displayed `+M` attack while spawning `+2M`.

## 4. Exclusions and authoring rules

Excluded from the system entirely (no modifier, no reshaping): the Clearing, the dev
test room, non-combat nodes (`mobDensity: 0`), and **all dungeon nodes** — dungeons are
static hand-designed exams. **Bosses are immune to stat reshaping** everywhere, though
the node's reward identity still applies to them.

Each biome bans one modifier it could never express (Forest/Jungle ban Heavy,
Mountain/Desert/Tundra ban Alacrity) and most carry a **native** modifier on one extra
node, making it that biome's most common flavour and its catalyst identity — Forest and
Jungle Alacrity, Mountain and Tundra Heavy, Swamp Fortified, Cave/Desert/Trench
Dominion, Volcanic and Wasteland Swarming. Plains is deliberately neutral: no native,
no extra node.

> ⚠ **The ban table controls the map's node count.** `buildRegionNodes` emits one node
> per non-banned modifier plus one extra for the native, so a biome needs
> `(5 − bans) + (native ? 1 : 0)` cells and the hand-cut region masks fit exactly.
> Changing a ban breaks that biome's mask.

`validateNodeModifiers()` enforces coverage, ban compliance, per-tier supply of all
five, and that each native strictly outnumbers every other modifier in its biome. It
runs in the shared test suite.
