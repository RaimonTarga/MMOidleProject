# Cores — Current State

Living truth for the **Core** equipment slot. Design source is
`design_docs/CORE_DESIGN_PHILOSOPHY.md` (the locked foundation) and
`docs/core-rework-design-balance-handoff.md` (the 2026-08-29 capstone balance pass).
The structural rework that produced the slot is
`docs/archive/cores-rework-implementation-plan.md`.

The values below are the implemented first-pass capstone tuning. They remain subject
to bench and playtest iteration, but are no longer the conservative placeholder cast.

---

## What a core is

The fifth equipment slot, one at a time, alongside weapon / armor / recovery /
mobility. A core **magnifies what a build already does**. It does not add a new
attack, resource, or payoff loop — those belong to Techniques and Paths.

Effects are authored as `mechanicEffects` on an ordinary recipe. Most are percentage
multipliers on the **final summed stat**, applied once in the core-multiplier pass of
`recalculatePlayerStats`. Sources add (two +10% → +20%); negative values are
tradeoffs.

The stat order is deliberately:

`base + gear → class affinity × stance × archetype layer × Core`

Core multipliers never join the class-affinity percentage bucket. Tests cover the
attack ordering, Reload's hard-set Snipe cadence followed by Core attack speed, and
normal DR multiplied by the independent Core DR layer.

## Eligibility

`coreEligibility: 'melee' | 'ranged' | 'unrestricted'` on the recipe, carried to
`ItemDefinition`, gated by `coreIsActive` in `shared/src/systems/cores.ts` — the
single authority, read by both the server stat rebuild and the client indicators.

| Category | Active for | Notes |
|---|---|---|
| `melee` | close builds | Dedicated tanking is melee-exclusive |
| `ranged` | **mid and far** builds | One shared pool, not maximum distance |
| `unrestricted` | every build | Lower ceiling, no commitment |

**Binary.** An ineligible core contributes nothing — not its upsides and *not its
tradeoffs*. The equipment loop skips it entirely.

Two things that look like bugs and are not:
- `selectedRange` holds the **full tier-2 skill id** (`cadence-range-close`), never a
  bare word, so the gate matches by `endsWith('-range-…')`. Comparing by equality
  once made every restricted core permanently inert while the server and both client
  indicators agreed with each other. Covered by `coreRangeGate.test.ts`.
- A missing `coreEligibility` **fails open** (treated as unrestricted) so a bad recipe
  cannot brick a save. It is an authoring bug, forbidden by `coreAuthoring.test.ts`,
  not a design state.

## Tier placement is load-bearing

A range is not chosen until **player tier 3** (skill-tree tier 2). A restricted core
placed in a T2 biome-level band is therefore craftable, equippable, and permanently
inert. The original placeholder cast shipped three such cores. `coreAuthoring.test.ts`
now asserts every restricted core is unreachable at T2 and reachable at T3.

| Band | Reachable at |
|---|---|
| T1 biome, level 7–12 | player tier 2 — **starters only** |
| T1 biome, level 13–18 | player tier 3 |
| T2 biome (jungle, desert), level 7–12 | player tier 3 |
| T3 biome (tundra, volcanic), level 1–6 | player tier 3 |

## The cast — 12 cores, one per biome (three biomes carry two)

**T2 unrestricted starters** — introduce the slot before a range exists.

| Core | Biome (level) | Shape |
|---|---|---|
| Tempered | plains (7) | The benchmark: even attack + HP, no drawback |
| Survivalist | forest (7) | Recovery + HP |
| Force | cave (8) | Damage bought with HP — the first real tradeoff |

**T3 melee** — close-range only.

| Core | Biome (level) | Shape |
|---|---|---|
| Juggernaut | mountain (14) | HP + plating + DR layer; slower attacks and movement |
| Bruiser | jungle (9) | Damage, bulk, speed; kills refund mobility cooldown |
| Duelist | cave (15) | All-round base + Focus ramp on consecutive direct hits to one target |

**T3 ranged** — mid and far.

| Core | Biome (level) | Shape |
|---|---|---|
| Sniper | desert (9) | Biggest raw damage, paid in HP and plating |
| Scout | tundra (3) | Damage + movement + mobility cooldown; less HP |

**T3 unrestricted specialists.**

| Core | Biome (level) | Shape |
|---|---|---|
| Arcanist | mountain (17) | Technique cooldown + power |
| Controller | swamp (15) | Debuff duration + potency |
| Accelerant | jungle (11) | Attack speed for attack damage |
| Catalyst | volcanic (3) | On-hit potency for attack damage |

Accelerant moved off Forest on 2026-08-22: Forest has no nodes past T2, so its
level-15 gate cost a T3 character roughly 1,000 extra kills of outgrown content.
Jungle carries Alacrity — the core's authored family tag — past T2, so the home and
the family tag agree (Jungle also drops green).

### Implemented first-pass values

| Core | Effects |
|---|---|
| Tempered | +12% attack, +12% max HP |
| Survivalist | +30% Recovery, +15% max HP |
| Force | +22% attack, −12% max HP |
| Duelist | +18% attack, +10% max HP; direct same-target hits gain +5% direct attack damage each, max 5 Focus |
| Juggernaut | +30% max HP, +40% plating, 14% independent DR; −25% attack speed, −10% movement |
| Arcanist | 20% Technique cooldown reduction, +20% Technique power |
| Controller | +35% debuff duration, +25% debuff potency |
| Scout | +24% attack, +25% movement, 25% mobility cooldown reduction; −20% max HP |
| Sniper | +40% attack; −30% max HP, −25% plating |
| Bruiser | +28% attack, +20% max HP, +18% movement; kills refund 50% of a mobility cooldown |
| Accelerant | +55% attack speed, −18% attack |
| Catalyst | +115% existing on-hit damage, −15% attack; provides no on-hit damage itself |

## Passive keys and their consumers

Stat-rebuild multipliers (`shared/src/systems/stats.ts`): `core.attack-mult`,
`core.maxhp-mult`, `core.plating-mult`, `core.speed-mult`, `core.attack-speed-mult`.

Everything else has its own consumer:

| Key | Consumer |
|---|---|
| `core.dr-layer-pct` | Combat pipeline. A **separate** multiplicative DR layer: `base × (1−DR) × (1−layer)`. Clamped 0.9. |
| `core.recovery-mult` | Stat rebuild **only**, on the `recovery` stat (`stats.ts`). Because every in-combat regen effect activates a fraction of that rate, scaling the rate covers all of them exactly once. Deliberately NOT re-applied in `applyHealToPlayer` — that would compound it. Absorb and the cheat-death HoT are not Recovery-derived and do not scale with it. |
| `core.focus-{damage-per-hit-mult,max-stacks}` | Direct player `onHit` listener in `server/src/systems/combat/cores.ts`. The current hit earns and uses a stack; changing target resets to one. |
| `core.onhit-mult` | `runPlayerAttack`, folded into the existing `onHitMult` so it composes with reload's Alternating Cadence. |
| `core.debuff-{duration,potency}-mult` | `applyPlayerDebuff`, via the `SCALABLE_DEBUFFS` registry. |
| `core.mobility-cooldown-reduction-pct` | `techniqueCooldownMs`, for abilities tagged `mobility`. Summed with technique CDR before one 0.9 cap. |
| `core.mobility-refund-on-kill-pct` | `onKill` listener; refunds a fraction of the **full** cooldown. |

Arcanist needs no core key at all — it authors the existing `technique.*` keys.

### Summons and event ownership

Owner stat magnifiers continue to flow through summon scaling. In particular,
Catalyst magnifies the owner's existing on-hit stat before formation weights are
applied. Explicit owner-event hooks do not inherit summon attribution: summon hits
cannot build Duelist Focus, and summon kills cannot trigger Bruiser's cooldown
refund. Formation attacks and summon-owned AoE/procs carry physical-source metadata
so `attackerType: 'player'` alone is never treated as proof that the player struck.

### Core swaps during combat

Core swapping remains allowed in combat. Its semantics are explicit: the stat rebuild
preserves unrelated counters, resources, cooldowns, flags, strings, status effects,
and cadence ramps. It clears only Core-owned Duelist target/stack state, so Focus
cannot be banked across a swap. Other equipment slots retain their existing rebuild
semantics.

### The debuff registry

`shared/src/systems/debuffScaling.ts` names which effect ids a core may scale and
which `data` fields count as potency. It is deliberately not a blanket multiplier:
`applyStatusEffect` has ~69 call sites and most are not debuffs (class resource
clocks, self buffs, monster-applied effects). Same fencing pattern as
`TECHNIQUE_POWER_FIELDS`.

Two rules, both enforced by tests:
- **Player → monster only.** `slow` is the trap — it reads like a control debuff, but
  monsters and dungeon hazards apply it, so registering it would have a player's core
  strengthen the thing hitting them.
- **Field encoding matters.** `vulnerability` stores `1 + magnitude`, so scaling the
  raw number turns a +12% core into a +34% debuff. Each field is tagged `fraction` or
  `multiplier`; multiplier fields scale only their excess over 1.

Call sites that write values back after applying (the weapon brittle listener) must
use `playerDebuffConfig()` and write back the **scaled** numbers, or they silently
undo the core one tick later.

## Progression

- **No `+N` upgrades.** `getMaxUpgrade` returns 0 for the core slot.
- **Growth is by evolution into named branches at the next tier** — one evolve, one
  decision. Every core carries a `lineageId` for those branches to hang from.
  `requiredPlusFor` returns 0 for cores, so evolving needs the predecessor owned (in
  the bag, not equipped), not upgraded.
- **No branches are authored yet.** That is the next content pass.

## Deliberately absent

- **No DoT core.** DoT damage per stack derives from `dealsDamage.attack`, which
  `core.attack-mult` already multiplies, so a DoT-potency core is a second multiplier
  on the same number — either a trap or mandatory. `dot.max-stacks` is in the
  denominator and is a ramp-shape lever, not a damage lever. Full reasoning in the
  plan doc; revisit only on the duration or conversion axis.
- **No taunt/threat core.** No taunt system exists beyond the `taunt-current-target`
  rune; the monster types call it a "future taunt hook". Blocked, not just deferred.
- **No AoE, summon, or party cores**, per philosophy §13.
- **No T4 cores** (Amplifier, Heavy, Advanced Survivalist). Amplifier needs a
  buff-potency layer that does not exist in any form.
- **`party` eligibility was removed.** It gated nothing.

## Presentation

All twelve cores have bespoke PixelLab icons in `art/src/items/cores/`, wired to
their recipes and packed into the client icon atlas. The slot uses a circular cut
gemstone set in metal as its shared visual language, with material T2 designs and
an added arcane cue at T3.

## Known gaps

- **Bruiser and Scout's mobility clauses are inert without a mobility ability**, and
  Charge is the only one tagged today. Both cores keep an always-on stat base, and
  the clauses widen for free as more are authored.
- **Catalyst's audience is thin** — `onHitDamage` exists on only two weapon lineages
  (a forest T2 weapon and the jungle rapier chain) plus a few T4 class specs.
  Widening it is a weapon-recipe balance decision.
- **Bench Core selection is an estimate, not an encounter optimizer.** It now scores
  signed effective output, defense, Technique throughput, and only build-relevant
  debuff/on-hit channels. It exercises unrestricted specialists and Catalyst on
  on-hit loadouts, but has no encounter target with which to value mobility or
  fight-length conditions exactly.

## Tests

`cores` (gate + rebuild integration), `classAffinity` (class × stance × archetype ×
Core ordering and hard-set cadence), `coreRangeGate` (eligibility matrix + build-aware bench
loadout), `coreAuthoring` (authoring invariants + tier placement), `coreMechanics`
(debuff scaler, pure), `coreCombat` (recovery funnel, Duelist Focus, summon event
ownership, Core-swap preservation, layered DR, and both mobility clauses against a
real `World`).
