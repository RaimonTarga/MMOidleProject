# Cores — Current-State and Rework Context Export

**Purpose of this document:** a self-contained export of the Core equipment-slot
system for an external design pass. It is an **audit, not a proposal** — nothing
here recommends new values or a new design. Where source material disagrees, this
document says so explicitly and defers to current code.

**Source hierarchy used below:**
1. **Current code** (`shared/`, `server/`, `client/`) — authoritative for every
   implementation fact, formula, and number.
2. **`docs/cores-current-state.md`** — the project's own living-truth doc for this
   system; cross-checked against code throughout.
3. **`design_docs/CORE_DESIGN_PHILOSOPHY.md`** (locked design foundation) and
   **`design_docs/CORE_CAST_REVIEW_DRAFT.md`** (roster + evolution directions) —
   historical/planned design intent, not implementation fact. Numbers in these
   docs are **design bands**, frequently different from what actually shipped.
4. **`docs/archive/cores-rework-implementation-plan.md`** — historical plan for
   the rework that produced the current cast; referenced but not the source of
   truth for present behavior.

Every section below is labeled so you can tell current behavior from historical
intent from placeholder/under-tuned content at a glance.

---

## 1. Executive Summary

**What the Core slot is (current code).** Core is the fifth equipment slot —
alongside weapon, armor, recovery, mobility, one core at a time — defined in
`EQUIPMENT_SLOTS`/`EquipmentSlot` (`shared/src/items.ts`). A Core is not a
separate item type: it is an ordinary `Recipe`/`ItemDefinition` with
`slot: 'core'`, distinguished from other gear by two things:

- `coreEligibility?: 'melee' | 'ranged' | 'unrestricted'` — a binary gate on the
  player's chosen combat range (`shared/src/systems/cores.ts`).
- Its effects live entirely in `mechanicEffects` (percentage-style passive keys),
  not `statModifiers` — every current core has `stats: {}`.

**When it unlocks (current code).** The slot opens at player tier 2 with three
unrestricted T2 capstone cores (Tempered / Survivalist / Force), before the player
has chosen a combat range. Melee and ranged (restricted) cores are gated to be
reachable only at player tier 3 or later, after range selection — because
eligibility is checked against `usesSkills.selectedRange`, which doesn't exist
until tier 3. The three T2 cores are deliberately late within their respective
T2 mastery bands: Cave L12, Jungle L6, and Desert L6. Six T3 cores are separately
gated late in their T3 bands; three mature T4 cores occupy the later Mountain,
Volcanic, and Graveyard bands and use the premium T4 economy.
This gating is deliberately enforced by `server/test/coreAuthoring.test.ts`,
because the original placeholder cast shipped three restricted cores that were
craftable at tier 2 and therefore **permanently inert** until the player reached
tier 3 anyway — a real historical bug, now guarded against.

**How Cores are acquired (current code).** Cores are crafted like any recipe:
essence cost + catalyst-family cost, gated by a biome level requirement
(`requiredBiomeLevel`) inside a specific biome's node band. There is no
boss-clear requirement on any current core. Once crafted, a core is an inventory
item like any other — equip/unequip through the normal equipment system, no
special cost.

**How many may be equipped.** Exactly one, in the single `core` equipment slot.

**Intended role (design intent, `design_docs/CORE_DESIGN_PHILOSOPHY.md`).** Cores
are meant to be **capstone, build-defining items that magnify an existing
combat archetype** — scale, frequency, duration, reliability, or situational
strength of stats/abilities/mechanics the build already has — and should **not**
normally add a new active payoff loop (that's Techniques' and Paths' job). Rare
"transformative" exceptions are allowed but should stay rare.

**Does current content actually succeed at being a capstone / major power
spike?** No, by the project's own admission. `docs/cores-current-state.md` states
outright: *"All numbers are PLACEHOLDERS inside the design doc's bands — the
balance pass is the user's."* Cross-referencing the authored values against the
design doc's own power bands (§9 of the philosophy doc, reproduced in §12 below)
shows most current cores sit at or below the **low** end of their intended band,
and every core's numeric bonus is folded into the *same* additive/multiplicative
machinery as ordinary skill-tree and equipment bonuses (see §4) rather than into
any dedicated "capstone" arithmetic layer. Structurally the slot exists, is
reachable, is gated correctly, and is wired into combat — but the numbers do not
yet read as a capstone power spike; they read as another item slot.

**Major implementation seams relevant to a redesign:**
- **The Core multiplier layer already exists and is already the *last*
  multiplicative stage in the stat rebuild** (`shared/src/systems/stats.ts`,
  §3c, "system rework Step 9") — a clean seam already separated from the class
  affinity layer, the stance layer, and the reload archetype's final multiplier.
  Making Cores hit harder or scale differently is mostly a numbers change in one
  well-isolated function, not new infrastructure.
- **Evolution is scaffolding-only.** Every core carries a `lineageId` and the
  generic `evolvesFrom` mechanism exists (used elsewhere, e.g. weapon
  lineages), but **zero cores currently have an evolution branch authored.**
  This is the single biggest gap between current state and design intent — the
  entire "Tier 4 / Later Tiers" progression described in the philosophy doc is
  unbuilt.
- **No dedicated Core-specific multiplicative infrastructure exists beyond the
  one hard-coded block in `stats.ts`.** There is no generic "Core multiplier"
  type distinct from any other passive; if the redesign wants Cores to multiply
  *against* class multipliers (rather than just being the last additive-then-
  multiply stage), that is new work, detailed in §6.
- **Class-mechanic coverage is uneven and mostly incidental**, not deliberately
  designed per class (§5) — most cores boost the single stat `dealsDamage.attack`,
  which every class reads from at different points, so classes inherit core
  power unevenly with no adapters correcting for it.
- **No admin surface, no client "effective value" preview, no evolution UI** —
  purely additive engineering debt that a larger numbers pass will surface (§8,
  §10).

---

## 2. Complete Core Catalog

**Status: current code, cross-checked against `docs/cores-current-state.md`.**
There is no `coreDatabase.ts` — cores are `Recipe` entries with `slot: 'core'`,
authored inline in each biome's recipe file (`shared/src/data/recipes/*.recipes.ts`),
and merged into `ITEM_DATABASE` (a `Map<string, ItemDefinition>`) by
`shared/src/itemDatabase.ts`. All 12 currently-defined cores are listed below —
there are no hidden/deprecated/test-only cores; every core in the data files is
reachable and live.

### Recipe/Item shape relevant to cores

```ts
// shared/src/items.ts
type CoreEligibility = 'melee' | 'ranged' | 'unrestricted';
type EquipmentSlot = 'weapon' | 'armor' | 'recovery' | 'mobility' | 'core' | 'relic';

interface ItemDefinition {
  // ...shared item fields...
  slot: EquipmentSlot;
  coreEligibility?: CoreEligibility;   // required iff slot === 'core'; forbidden otherwise
  statModifiers: Record<string, number>;  // always {} for current cores
  mechanicEffects: Record<string, number>; // where all core power lives
}

// shared/src/data/recipes/types.ts
interface Recipe {
  // ...
  slot: EquipmentSlot;
  coreEligibility?: CoreEligibility;
  lineageId?: string;      // required on every core recipe — hook for future evolution branches
  evolvesFrom?: string;    // generic mechanism; NOT set on any core recipe today
  requiredBiomeLevel: number;
  cost: Record<string, number>;         // essence colors
  catalystCost?: Record<string, number>; // node-modifier-family costs
}
```

Enforced invariants (`server/test/coreAuthoring.test.ts`):
- Every `slot: 'core'` recipe declares `coreEligibility`; no non-core recipe
  declares it. Eligibility survives the recipe→item copy.
- `getMaxUpgrade(item) === 0` for every core — **cores have no `+N` upgrade
  track.** Core "progression" is entirely the (currently unbuilt) evolution
  chain, not the upgrade-step system every other item uses.
- Every restricted (melee/ranged) core is reachable only at player tier 3+
  (`biomeLevelCap(core.tier, group)`), never before its authored tier — this is the fix for the
  historical "permanently inert core" bug described in §1.
- Every tier-2 core is unrestricted and reachable at tier 2, with the three
  current rewards gated late in their respective T2 biome bands.
- Every core carries a `lineageId`.

### The 12 cores

All values quoted verbatim from source. "Cost" = essence-color cost; "Catalyst"
= node-modifier-family cost (a gate, not a currency spent per unit — see §7).
No core has `stats` (statModifiers) — every effect is a `mechanicEffects` key.

| id | name | biome (req. level) | tier | eligibility | cost | catalyst | mechanicEffects (exact values) |
|---|---|---|---|---|---|---|---|
| `core-tempered` | Tempered Core | cave (12) | 2 | unrestricted | `{red:500}` | `{dominion:4}` | `core.attack-mult: 0.12`, `core.maxhp-mult: 0.12` |
| `core-survivalist` | Survivalist Core | jungle (6) | 2 | unrestricted | `{green:500}` | `{fortified:4}` | `core.recovery-mult: 0.30`, `core.maxhp-mult: 0.15` |
| `core-force` | Force Core | desert (6) | 2 | unrestricted | `{yellow:500}` | `{dominion:4}` | `core.attack-mult: 0.22`, `core.maxhp-mult: -0.12` |
| `core-duelist` | Duelist Core | cave (18) | 3 | melee | `{red:1350}` | `{dominion:6}` | `core.attack-mult: 0.12`, `core.maxhp-mult: 0.10`, `core.elite-damage-mult: 0.15` |
| `core-juggernaut` | Juggernaut Core | mountain (22) | 4 | melee | `{blue:2200}` | `{heavy:7}` | `core.maxhp-mult: 0.30`, `core.plating-mult: 0.40`, `core.dr-layer-pct: 0.14`, `core.attack-speed-mult: -0.25`, `core.speed-mult: -0.10` |
| `core-arcanist` | Arcanist Core | mountain (18) | 3 | unrestricted | `{blue:1200}` | `{swarming:5}` | `technique.cooldown-reduction-pct: 0.18`, `technique.power-pct: 0.08` |
| `core-controller` | Controller Core | graveyard (4) | 4 | unrestricted | `{purple:2100}` | `{fortified:7}` | `core.debuff-duration-mult: 0.35`, `core.debuff-potency-mult: 0.25` |
| `core-scout` | Scout Core | tundra (6, T3 biome) | 3 | ranged | `{blue:1200}` | `{heavy:5}` | `core.attack-mult: 0.14`, `core.speed-mult: 0.16`, `core.mobility-cooldown-reduction-pct: 0.20`, `core.maxhp-mult: -0.15` |
| `core-sniper` | Sniper Core | desert (12) | 3 | ranged | `{yellow:1300}` | `{dominion:6}` | `core.attack-mult: 0.26`, `core.maxhp-mult: -0.20`, `core.plating-mult: -0.15` |
| `core-bruiser` | Bruiser Core | jungle (11) | 3 | melee | `{green:1350}` | `{alacrity:6}` | `core.attack-mult: 0.20`, `core.maxhp-mult: 0.15`, `core.speed-mult: 0.12`, `core.mobility-refund-on-kill-pct: 0.40` |
| `core-accelerant` | Accelerant Core | jungle (12) | 3 | unrestricted | `{green:1150}` | `{alacrity:5}` | `core.attack-speed-mult: 0.25`, `core.attack-mult: -0.12` |
| `core-catalyst` | Catalyst Core | volcanic (10) | 4 | unrestricted | `{red:2300}` | `{swarming:8}` | `core.onhit-mult: 1.15`, `core.attack-mult: -0.15` |

The locked 2026-09-04 T3 → T4 pass changes only the affected recipe placement,
essence, catalyst, and tier fields. All 12 Cores keep their IDs, eligibility and
mechanic definitions; none gains a boss-clear requirement.

Flavor text (`description` field) for each, verbatim:

- **Tempered**: "Balanced for any hand. It asks no commitment, and rewards none in particular."
- **Survivalist**: "Wound-knit heartwood. It does not stop the blow — it shortens the time you spend regretting it."
- **Force**: "It gives you the strike you wanted and takes the margin you were counting on."
- **Duelist**: "Nothing here helps against a crowd. Against the one thing worth killing, it is everything."
- **Juggernaut**: "The mountain does not dodge. It simply outlasts whatever is thrown at it, and so will you."
- **Arcanist**: "Thin air, long thoughts. The gap between what you can do and how often shrinks."
- **Controller**: "The swamp never kills quickly. It simply makes sure nothing leaves the way it came in."
- **Scout**: "Open ground and a long horizon. Nothing here helps you win a stand — only avoid one."
- **Sniper**: "Focuses the eye to a needlepoint, and leaves the body that much more exposed."
- **Bruiser**: "Kill, and the jungle opens. Stop, and it closes. The core only knows how to do the first one."
- **Accelerant**: "The canopy keeps a fast rhythm. Match it, and you will find you are swinging before you decide to."
- **Catalyst**: "Heat finds the seams that force cannot. Armour is no comfort against something already inside it."

### Roster/biome-home notes (current code + one historical relocation)

Design roster comment in `plains.recipes.ts` maps: plains→none, forest→none,
cave→Tempered+Duelist, mountain→Arcanist+Juggernaut (T4), swamp→none,
tundra→Scout, jungle→Survivalist+Bruiser+Accelerant, desert→Force+Sniper,
volcanic→Catalyst (T4), graveyard→Controller (T4), trench→none. The T2 core
homes were redistributed on 2026-09-04; the T3 Accelerant relocation and the
T3 → T4 capstone moves are reflected in the live recipe files.
The relocation is documented in-file: Accelerant moved off Forest on
2026-08-22 because Forest has no biome nodes past tier 2, so a level-15 gate
there would have cost a tier-3 character roughly 1,000 grind-kills of outgrown
content; Jungle's native catalyst family (Alacrity) also matches Accelerant's
authored family tag, where Forest's didn't. Cost/amounts were carried over
unchanged.

Per-biome design intent comments (why each core lives where it does):
Forest = sustain / where Second Wind is learned · Volcanic = the strike itself
(burn weapons, heat) · Desert = distance/sightlines, teaches Charge and the
kiting boot · Swamp = affliction and control, teaches Cleanse · Tundra =
movement, its boot ramps speed over travel · Cave = single-target pressure,
teaches Expose Weakness · Mountain = endurance/preparation, Brace and Charged
Strike · Jungle = momentum, dense packs and ambushes.

### No unused/deprecated/hidden cores

Every one of the 12 core recipes above is live, reachable, and (per
`recipeGates.test.ts`) verified reachable at its authored biome/tier. The
project's own reachability regression list (`RETIRED_BIOME_DEBT` in
`shared/src/data/recipeGates.test.ts`) is currently **empty** — its comment
states the 2026-08-22 pass re-homed all eleven previously-stranded recipes
across the whole game, of which **exactly one was a core** (almost certainly
Accelerant, matching the relocation above). There is no dead/placeholder core
sitting in the data files today.

### Deliberately absent content (design decision, not oversight)

Documented directly in code comments (`shared/src/passives.ts`) and in
`docs/cores-current-state.md`:

- **No DoT-potency core.** DoT damage-per-stack derives from
  `dealsDamage.attack`, which `core.attack-mult` already multiplies — a
  dedicated DoT core would be a second multiplier stacked on the exact same
  number, which the team judged would be "either a trap or a mandatory pick"
  for DoT builds. `docs/archive/cores-rework-implementation-plan.md` is cited
  as carrying the full reasoning (not independently re-verified in this pass).
- **No taunt/threat core.** No taunt system exists in current code beyond a
  single rune effect; this is called a blocked dependency, not a deferred
  choice.
- **No AoE, summon, or party-scoped core.** Explicitly deferred per philosophy
  §13, pending those underlying systems maturing.
- **No additional tier-4 cores.** The shipped T4 Core cast is the three mature
  capstones Juggernaut, Controller, and Catalyst. The design draft's Amplifier,
  Heavy, Advanced Survivalist, and Affliction remain unshipped; Amplifier
  specifically needs a buff-potency passive layer that does not exist in any
  form yet (see §6).
- **`'party'` eligibility category** existed at some point and was removed —
  it gated nothing functionally.

---

## 3. Core Variants / Evolution System

**Status: designed in detail, not implemented at all.** This is the largest
gap between design intent and shipped content.

### What exists in code

- `lineageId` — every one of the 12 core recipes carries this field
  (`Recipe.lineageId`, `shared/src/data/recipes/types.ts`), required by
  `coreAuthoring.test.ts`. It exists **only** as a placeholder anchor for
  future evolution branches to attach to; it currently does nothing functional.
- `evolvesFrom` — a generic field on `Recipe` used elsewhere in the game (e.g.
  weapon lineages) via `shared/src/systems/evolution.ts` and
  `EVOLUTION_REQUIRED_PLUS`. **No core recipe sets `evolvesFrom`.** A grep of
  every core recipe for this field returns zero matches.
- `requiredPlusFor()` (`shared/src/systems/evolution.ts`) special-cases
  `recipe.slot === 'core'` to always return `0` — meaning if/when a core
  evolution chain is authored, the predecessor core only needs to be **owned**
  (in the bag), not upgraded to any `+N` level, before the next rank can be
  crafted. This is consistent with cores having no upgrade track at all.
- Icons: all 12 core icons already have `-variant-2`/`-variant-3` art frames
  pre-generated and packed into the client icon atlas (per client-UI research;
  see §10) — art asset staging is ahead of evolution-branch data authoring.

### What is only in design documents (NOT implemented)

`design_docs/CORE_CAST_REVIEW_DRAFT.md` §"Evolution Directions" lists a full
evolution tree — 3-6 named branches per base core, e.g.:

- **Survivalist** → Regenerator / Guardian / Second Wind / Enduring
- **Juggernaut** → Fortress / Warden / Bulwark / Colossus / Unyielding
- **Bruiser** → Charger / Reaver / Mauler / Pursuer / Rampager
- **Duelist** → Champion / Executioner / Stalwart / Focused / Pursuer
- **Sniper** → Longshot / Deadeye / Artillery / Entrenched / Glass Cannon
- **Scout** → Skirmisher / Pathfinder / Harrier / Elusive / Pursuit
- **Arcanist** → Invoker / Overcharger / Technique Specialist / Guard Specialist / Resonant
- **Controller** → Suppressor / Binder / Hexer / Persistent / Intensifier / Saturation
- **Accelerant** → Flurry / Rampage / Tempo / Overclock / Precision Engine
- **Tempered** → Harmonized (single branch, deliberately kept simple)
- **Force** → Potent / Relentless (explicitly noted as possibly staying a starter-only core, not developing a large family)
- A design-only **Affliction** core (tier 3, DoT-focused — contradicts the
  "no DoT core" decision above; not reconciled anywhere in the doc set) with
  branches Potent / Lingering / Saturating / Concentrated / Patient / Virulent.
- A design-only tier-4 **Amplifier** core (buff potency) with branches Exalted
  / Sustained / Fortified / Resonant.
- A design-only tier-4 **Catalyst** evolution set (note: the design draft's
  "Catalyst" describes the same on-hit theme as the now-shipped T4 base
  `core-catalyst`; no evolution branches are authored) with branches Resonant /
  Shattering / Leeching / Charged.
- A design-only tier-4 **Heavy** core with branches Crusher / Executioner /
  Titan / Siege.

None of this is wired: no code reads any of these branch names, no recipe
references them, no passive key exists for most of the mechanics they'd need
(see §6 for which passive infrastructure would need to exist first — buff
potency, taunt duration, distance-band damage, same-target amplification, and
several others named explicitly in the philosophy doc §14 as **not yet
built**).

### Direct answers to the requested evolution-concept checklist

| Concept | Status |
|---|---|
| Skill/ability cooldown refund under conditions | **Partially shipped**, generically: Bruiser's `core.mobility-refund-on-kill-pct` refunds cooldown on kill (mobility-tagged abilities only). No conditional/evolved version exists. |
| Skill amplification under conditions | Not shipped. Arcanist's `technique.power-pct` is unconditional. No "amplify while X is true" core exists. |
| Range-based amplification | Not shipped at all — a design-only Sniper→Longshot/Entrenched branch idea. No distance-band passive infrastructure exists in current code. |
| Buff-potency amplification | Not shipped — no buff-potency passive key exists anywhere in the current passive system (confirmed absent from `CORE_KEYS`/other passive-key sets). This blocks the entire design-only Amplifier core family. |
| Class-mechanic amplification | Not shipped as a deliberate axis — see §5; any class-mechanic benefit today is incidental (derives from `dealsDamage.attack`), not an authored "amplify this class's mechanic" passive. |

**Because evolution is entirely unbuilt**, every sub-question in the original
brief about evolution persistence shape, reversibility, mutual exclusivity of
branches, and evolution UI is currently moot at the implementation level:
there is no evolution state to persist (see §8), no UI (see §10), and no
runtime behavior to trace (see §9). All of it is open design space.

---

## 4. Exact Arithmetic and Stacking Order

This is the single most load-bearing section for a redesign that plans to
introduce or expand multiplicative layers. All of it is read directly from
`shared/src/systems/stats.ts`, function `recalculatePlayerStats` (the one full
player stat rebuild — called on equip/unequip, level-up, skill unlock, stance
switch, etc.), plus the combat-time hooks in `server/src/systems/combat/`.

### 4.1 The full ordered pipeline (`recalculatePlayerStats`)

Numbered stages as they execute, **in actual execution order** (note: the
code's own inline stage labels — `2a`, `3a`, `3b`, `3c`, `3d`, `3e` — do not
appear in that lexical order in the file; the list below is corrected to real
execution order):

1. **Reset to base constants** (`GAME_CONFIG`): `attack=15`, `maxHp=100`,
   `plating=2`, `attackCooldown=3000ms`, `recovery=10`, `attackRange=12`,
   `speed=<base>`.
2. **Weapon attack-speed**: `attackCooldown` set from the weapon's effective
   APS (base cadence + upgrade-step deltas), overriding the base constant.
3. **Skill-tree loop**: every unlocked node adds its flat `statEffects`
   (`attack`, `plating`, `damageReduction`, `maxHp`, `speed`, `recovery`,
   `attackRange`) directly onto the running totals — pure addition. Percentage
   class-affinity fields (`attackPct`, `maxHpPct`, `platingPct`,
   `moveSpeedPct`) are **not** applied here — they accumulate into a separate
   `ClassAffinities` bucket (summed, not yet multiplied). `attackSpeedPct` and
   raw evasion accumulate into their own running totals. Every node's
   `mechanicEffects` (arbitrary passive keys, `core.*` among them if a skill
   ever authored one — none currently do) merge into `usesSkills.passives` via
   `mergePassives`, which **sums** values for a given key by default (see 4.2).
4. **Stance flat-fold**: only the stance's `attackSpeedPct` and raw `evasion`
   fold in at this point (matching the skill-tree accumulators' semantics);
   the stance's percentage stat mods (`attackPct`/`platingPct`/`moveSpeedPct`)
   are deliberately deferred to stage 8. Stance `mechanicEffects` merge into
   passives here.
5. **Attack-speed resolution**: `attackCooldown = round(attackCooldown / max(0.1, 1 + attackSpeedPct))`, floored at 200ms.
6. **Equipment loop** (weapon/armor/recovery/mobility/**core**/relic, in
   `EQUIPMENT_SLOTS` order): each equipped item's flat `statModifiers` add
   directly to the running totals (same additive bucket as the skill tree —
   there is **no separation** between "skill tree attack" and "gear attack" by
   the time stage 8 runs). Each item's `mechanicEffects` merge into
   `usesSkills.passives` (this is where a Core's `core.*` keys first enter the
   passive map — see 4.3 for the eligibility gate). Item upgrade-step bonuses
   (`+N` levels; not applicable to cores, which have none) also fold in here.
7. **Class-affinity multiply** (`applyClassAffinities`) — **the first true
   multiplicative layer**: `mult(pct) = max(0.05, 1 + pct)`; applied once to
   each of `attack`, `maxHp`, `plating`, `moveSpeed` using the **summed**
   affinity bucket from stage 3. E.g. a class chain of root+frame+range worth
   `attackPct` 0.30+0.22+0.10 lands as one `attack *= 1.62`, never compounding
   tier-by-tier.
8. **Stance percentage multiply** (`applyStanceModifiers`) — a **second,
   separate** multiplicative layer, same `mult(pct)` formula, applied to the
   *already affinity-multiplied* stat: `attack *= (1 + stancePct)`. Kept
   deliberately separate from stage 7 because "a stance is a single mode with
   a single tooltip" that must read literally for every class.
9. **Cadence threshold recompute** (Cadence/Striker class only) — reads
   `passives['cadence.*']` (post-equipment) to reset combo-meter thresholds;
   not a stat multiply.
10. **Flat on-hit tier scalers** (Shockblade / Dualslinger path specs) — add
    flat `onHitDamage`, unrelated to core math.
11. **Damage-reduction clamp**: `damageReduction = clamp(0, 0.9)`.
12. **Evasion resolution**: raw evasion rating → deterministic dodge-rate curve.
13. **Reload archetype final multiplier** (Reload/Slinger class only) — a
    **third distinct multiplicative/derivation layer**, e.g. non-Snipe/Laser
    builds get `attack = floor(attack * 0.65)` (half-damage traded for
    double-speed later in this stage), Snipe converts `attackSpeedPct` into
    flat attack-damage bonus and hard-sets cadence, ignoring weapon APS
    entirely.
14. **Core multiplier layer** (`stats.ts`, explicitly labeled "system rework
    Step 9" in comments) — **the fourth and final multiplicative layer**,
    applied to the fully-resolved stat line (base + skills + equipment + class
    affinity + stance + reload-archetype). Exact code:
    ```ts
    const attackMult    = passives['core.attack-mult']       ?? 0;
    const maxHpMult     = passives['core.maxhp-mult']        ?? 0;
    const platMult      = passives['core.plating-mult']      ?? 0;
    const speedMult     = passives['core.speed-mult']        ?? 0;
    const recoveryMult  = passives['core.recovery-mult']     ?? 0;
    const atkSpeedMult  = passives['core.attack-speed-mult'] ?? 0;

    if (attackMult   !== 0) attack   = max(1, round(attack   * (1 + attackMult)));
    if (maxHpMult    !== 0) maxHp    = max(1, round(maxHp    * (1 + maxHpMult)));
    if (platMult     !== 0) plating  = max(0, round(plating  * (1 + platMult)));
    if (speedMult    !== 0) speed    = max(0, round(speed    * (1 + speedMult)));
    if (recoveryMult !== 0) recovery = max(0, round(recovery * (1 + recoveryMult)));
    if (atkSpeedMult !== 0) attackCooldown = max(100, round(attackCooldown / max(0.1, 1 + atkSpeedMult)));
    ```
    `maxHp` is multiplied here, *before* the final HP-clamp, so a new ceiling
    is immediately reflected in current HP.
15. **Range floor**: `attackRange = max(baseRange, attackRange)` — negative
    range bonuses can shrink toward melee but never below base contact reach.
16. **HP clamp**: `hp = clamp(1, maxHp)`.

### 4.2 How multiple bonuses of the same key combine

`mergePassives` (`shared/src/passives.ts`) is the single function every
`mechanicEffects` bundle (skill nodes, stance, equipment, cores) is folded
through into `usesSkills.passives`. Its default behavior for any key is
**summation**: `target[key] = (target[key] ?? 0) + value`. There is one
explicit exception — `MULTIPLICATIVE_PASSIVES = new Set(['defense.max-hit-mult'])`
— where sources instead **compound as a product**: `target[key] = (target[key] ?? 1) * value`.
**No `core.*` key is in this exception set.** Practically, since only one core
can be equipped at a time today, this matters only if/when evolution adds a
second source of the same `core.*` key (e.g. a base-core effect plus an
evolved-branch effect both writing `core.attack-mult`) — under current
`mergePassives` semantics those would **add** (two +10% sources → +20% single
multiply), not compound (which would be +21%).

### 4.3 The Core-specific eligibility gate (binary, not a stacking rule)

Before any core's `statModifiers`/`mechanicEffects` are folded in at stage 6,
`shared/src/systems/stats.ts` checks
`coreIsActive(def.coreEligibility, p.usesSkills.selectedRange)`
(`shared/src/systems/cores.ts`, the single shared authority also used by every
client UI surface). If ineligible, the **entire item is skipped** for that
stage — not scaled down, not partially applied. An ineligible restricted core
contributes zero, including its downside (e.g. a Sniper core's `-20% maxHp` is
also not applied if the player isn't in a mid/far-range build).

### 4.4 Formulas per requested axis, with exact core entry points

**Outgoing player damage** (`server/src/systems/combat/engine/combat.ts`,
`runPlayerAttack`):
```
attack = dealsDamage.attack        // ALREADY includes core.attack-mult (stat-rebuild time)
damage = round( max(0, attack*minionDamageMult - effectivePlating*platingMult) * (1 - effectiveDr) )
if shared.damage-mult > 0:  damage = round(damage * (1 + shared.damage-mult))
if outgoingMult > 1:        damage = round(damage * outgoingMult)     // status-driven amplifiers
// onHit event fires here — core.elite-damage-mult (Duelist) applies via listener, post-mitigation:
//   damage = round(damage * (1 + core.elite-damage-mult))   [only vs elite/isBoss monsters]
if onHitDamage > 0:
  coreOnHit = 1 + core.onhit-mult                    // Catalyst
  damage += round( onHitDamage * onHitDamageMult * coreOnHit * formationOnHitWeight )
  // deliberately AFTER plating/DR mitigation — unmitigated by design
```
Net effect: a Core can influence a single player hit through **up to three
separate entry points** — once pre-baked into `attack` (mitigated), once via
`core.elite-damage-mult` (post-mitigation, conditional on target flags), and
once via `core.onhit-mult` (post-mitigation, unmitigated flat-add scaling).
No single core in the current cast uses more than one of these three per item,
but the architecture allows stacking all three from different equipped
sources.

**Incoming (monster→player) damage** (`combat.ts`, `runMonsterAttack`):
```
drLayer2 = clamp(0, 0.9, target.passives['core.dr-layer-pct'])   // Juggernaut
damage = round( max(0, monsterAttack - platingAfterShred) * (1 - damageReduction) * (1 - drLayer2) )
```
`core.dr-layer-pct` is an explicit **second, independent multiplicative
mitigation layer**, stacked with (not folded into) base `damageReduction` —
code comment: "50% base + 50% layer ⇒ 25% taken, not immunity."

**DoT damage-per-stack** (`shared/src/systems/dotClassProfile.ts`):
```
damagePerStack = round( attackBase * conversionPct * dotMechanicMultiplier * tickIntervalMs / maxStacks / 1000 )
```
`attackBase` = `player.dealsDamage.attack`, i.e. **already** carries
`core.attack-mult`. There is no separate DoT-core term (by design, §2). Player-
applied DoTs additionally scale via `core.debuff-duration-mult` /
`core.debuff-potency-mult` (Controller) if the specific DoT status-effect id is
in the `SCALABLE_DEBUFFS` allow-list.

**Summon output** (`server/src/systems/classes/archetypes/summoner/summonerPrototype.ts` / `spawn.ts`):
```
minionAttack = round( owner.dealsDamage.attack * profile.formationOffenseMult * slot.offenseWeight )
```
Again reads the owner's **post-core** `attack` — no dedicated summon-core term
exists. Minion attacks are executed through the same `runPlayerAttack()` used
for the player's own hits, with `ctx.attackerType` hardcoded to `"player"`
regardless of whether the aggro source is a minion — see §5 for the
consequence this has for Duelist/Bruiser's onHit/onKill listeners.

**Healing/Recovery**: `recovery` (the HP-regeneration rate stat) is multiplied
by `core.recovery-mult` exactly once, in stage 14 of the rebuild. The heal
funnel (`applyHealToPlayer`, `server/src/systems/defense/regen/healing.ts`)
deliberately does **not** re-apply this multiplier per individual heal tick —
code comment explains every in-combat regen effect activates a *fraction* of
the `recovery` rate, so multiplying the rate once already covers all of them;
re-applying it per-heal would compound a +20% core into an effective +44%.
This is directly verified by `server/test/coreCombat.test.ts`.

**Mitigation** (plating/DR): `core.plating-mult` folds into the flat
`plating` stat exactly once (stage 14), sitting on top of base+skill+equipment
plating and the (separately-applied) class-affinity `platingPct`. `core.dr-layer-pct`
is the one Core effect that is **not** resolved in the stat rebuild at all —
it lives purely in the combat pipeline as shown above.

**Attack speed**: three sequential divisions of `attackCooldown` — stage 5
(`attackSpeedPct` from skills/stance), stage 13 (reload archetype's
double-speed/hard-set cadence, only for the Reload class), and stage 14
(`core.attack-speed-mult`, e.g. Juggernaut's -20% or Accelerant's +25%). These
are **not summed together**; each is a separate division against the
already-modified cooldown from the prior stage.

**Ability/Technique potency**: `technique.power-pct` (used by Arcanist) folds
generically wherever `TECHNIQUE_POWER_FIELDS` is read by ability-firing code —
not part of the `core.*` layer at all; Arcanist deliberately authors the
`technique.*` namespace instead of a `core.*` key (see §5).

**Ability/Technique cooldown**: `techniqueCooldownMs()`
(`server/src/systems/player/abilities/abilityCooldowns.ts`) **sums**
`technique.cooldown-reduction-pct + core.mobility-cooldown-reduction-pct`
(only for abilities tagged `mobility`) before applying one shared 90% cap, then
`finalCooldown = authoredCooldown * (1 - clampedReduction)`.

**Empowered-attack multiplier** (Cadence/Striker's signature mechanic,
`shared/src/systems/empoweredMult.ts`):
```
effective = base + archetypeAdd + sharedAdd      // sum first
if multBonus !== 0: effective *= (1 + multBonus)  // one multiplicative layer
```
**No `core.*` key participates in this formula at all.** Cores affect an
empowered hit's final damage only indirectly, by having already inflated
`dealsDamage.attack` before the empowered multiplier is applied downstream to
that (already core-boosted) base number.

**Resource generation** (energy/cadence/cooldown thresholds): no `core.*` keys
appear anywhere in `resolveCadenceRelicProfile`/`resolveEnergyRelicProfile`/
`resolveCooldownRelicProfile`. **Cores do not currently touch resource
generation at all.**

**Movement/range**: `core.speed-mult` folds into `speed` at stage 14 (final
multiplicative layer, same as attack/HP/plating). No core currently touches
`attackRange`.

### 4.5 Where a Core's displayed percentage produces less real value than authored

Because Cores sit at the **end** of the pipeline (stage 14), multiplying the
fully class-affinity-and-stance-boosted stat, a Core's own percentage is
actually the *most* reliable one in the game — it is never diluted by being
summed into a large additive bucket the way, e.g., two flat skill-tree `attack`
bonuses would be. The place dilution *does* happen is upstream of the core
layer: `core.attack-mult` multiplies a number that is itself the product of
potentially several earlier multiplicative stages (class affinity × stance ×
reload archetype), so a Core's *marginal* dollar-value in raw damage is larger
in absolute terms for a build that has already stacked those other layers —
this is a real, quantifiable "capstone multiplies everything else" effect, and
is examined with numbers in §12. The one place a Core's authored number *can*
read as smaller than expected to a player is `core.onhit-mult` and
`core.elite-damage-mult`, which only ever apply to a narrow slice of total
damage (the flat on-hit term, or only vs elite/boss targets respectively) — so
a "+28%" Catalyst or "+15%" Duelist tooltip is not +28%/+15% of total DPS, only
of that narrow slice. This is a real "authored percentage vs. effective value"
gap, but it is a scope/conditionality gap, not a stacking/dilution bug.

---

## 5. Class Interaction Matrix

**Status: current code.** The six class archetypes (`shared/src/types/combat.ts`,
`CombatArchetype`) and their associated player classes: `cadence` (Striker),
`cooldown` (Squire), `energy` (Spirit), `reload` (Slinger), `dot` (Apprentice),
`summoner` (Conduit).

**Headline finding: there are no class-specific Core adapters or normalizers
anywhere in the code.** Every core applies as a generic passive on
`usesSkills.passives`; nothing branches on `combatArchetype` for any `core.*`
effect. Class-differentiated value emerges *structurally*, from where each
class reads `dealsDamage.attack` (or doesn't), not from deliberate per-class
core design:

| Core effect | Cadence (Striker) | Cooldown (Squire) | Energy (Spirit) | Reload (Slinger) | DoT (Apprentice) | Summoner (Conduit) |
|---|---|---|---|---|---|---|
| `core.attack-mult` (7 of 12 cores) | Full value — scales base hits and (indirectly) the empowered multiplier's base | Full value | Full value | Full value, but this attack figure is *then* run through Reload's own 0.65× or Snipe conversion at stage 13 — core boosts land on the post-Reload-multiplier number, so their real damage impact compounds with Reload's structural halving in the opposite direction (a bigger pre-halved number nets the same % gain) | Full value — feeds DoT's `attackBase` term directly | Full value — feeds minion attack via `owner.dealsDamage.attack`; **inherited with no discount or bonus adjustment for having multiple minions** |
| `core.maxhp-mult` / `plating-mult` / `speed-mult` | Uniform — pure stat multiplier, no archetype branch | Uniform | Uniform | Uniform | Uniform | Uniform |
| `core.attack-speed-mult` | Direct — attack cooldown divides again | Direct | Direct | **Structurally redundant with Reload's own double-speed layer** — a Reload build already halves its cooldown at stage 13; an attack-speed core on top compounds two speed sources for one class in a way no other class experiences | Direct (affects DoT application cadence, not tick damage) | Direct on the summoner's own attack cadence, which is largely irrelevant since summoners can't attack directly outside the Battle Bond exception (`cannotAttack` marker) |
| `core.recovery-mult` | Uniform | Uniform | Uniform | Uniform | Uniform | Uniform |
| `core.dr-layer-pct` (Juggernaut) | Uniform — pure incoming-damage layer, class-agnostic | Uniform | Uniform | Uniform | Uniform | Uniform |
| `core.elite-damage-mult` (Duelist) | Fires on player-attributed hits | Fires | Fires | Fires | Fires (on DoT tick hits too, since DoT ticks are attributed the same way — not independently confirmed line-by-line in this pass) | **Fires on minion-sourced hits** — `runPlayerAttack`'s `ctx.attackerType` is hardcoded to `"player"` even when the aggro source is a minion, so Duelist's onHit listener (gated only on `attackerType === "player"`) applies its elite/boss bonus to summon damage exactly as if the player struck directly |
| `core.onhit-mult` (Catalyst) | Only relevant to builds with `onHitDamage` > 0 — currently authored on very few weapon lineages (a forest T2 weapon, the jungle rapier chain) plus a few tier-4 class specs, so most classes see near-zero benefit from this core regardless of archetype | Same narrow audience | Same | Reload's Alternating Cadence spec explicitly composes with this core (multiplicatively, not additively — deliberate) | Same narrow audience | Same narrow audience |
| `core.debuff-duration-mult` / `-potency-mult` (Controller) | Benefits only if the build applies one of the 8 allow-listed status-effect ids (`vulnerability`, `expose-weakness`, `brittle`, `dr-shatter`, `dot-chill`, `dot-frostbite`, `plating-shred`, `reload-suppress-shred`) — Cadence's Cursed Finale (vulnerability) and Technique's Expose Weakness are the named examples | Benefits if using Expose Weakness | No named benefit found | Reload-suppress-shred is Reload-specific | dot-chill/dot-frostbite are DoT-specific | No named benefit |
| `core.mobility-{cooldown-reduction,refund-on-kill}-pct` (Scout, Bruiser) | Inert unless the equipped ability is tagged `mobility` — today only "Charge" carries that tag, so **every class is equally gated** by ability choice, not archetype | same | same | same | same | **Fires on minion kills**, same hardcoded-`attackerType` mechanism as Duelist above |
| `technique.cooldown-reduction-pct` / `technique.power-pct` (Arcanist) | Benefits scale with how ability/Technique-centric the build is, which varies by class design but isn't archetype-gated in code | Cooldown-archetype classes plausibly lean more on abilities, increasing relative value, but no code enforces or measures this | same | same | same | same |

**Classes receiving disproportionately high value:** Conduit (Summoner) is the
clear outlier — it inherits every stat-multiplier core's benefit through
`owner.dealsDamage.attack` exactly like a solo attacker, *and* additionally
receives Duelist's and Bruiser's onHit/onKill combat-listener bonuses on
minion-sourced kills, because those listeners gate only on
`ctx.attackerType === "player"`, which every minion attack is hardcoded to
report. No other class gets a core bonus applied across multiple simultaneous
damage sources (its minions) the way Conduit does. This looks unintentional —
nothing in the design docs or code comments discusses Cores interacting with
summons at all, and philosophy §13 explicitly defers "summon Core" content,
implying summon interaction with the *existing* cast wasn't a deliberated
question.

**Classes receiving disproportionately low value:** Reload (Slinger) is the
most structurally constrained — its own archetype layer (stage 13) already
imposes a hard damage/speed tradeoff (0.65× damage for double speed, or a
hard-set cadence for Snipe that ignores attack-speed entirely), so
`core.attack-speed-mult` cores are partially redundant with Reload's own
mechanic, and Sniper-spec Reload builds get **zero** benefit from any core's
attack-speed term because Snipe ignores `attackSpeedPct`/`attackCooldown`
scaling from that source entirely (it hard-sets cadence from
`reload.snipe-cadence-ms`).

**Mechanics that don't interact with cores at all:** resource generation
(energy/cadence/cooldown thresholds — confirmed no `core.*` key referenced),
the empowered-multiplier formula (Cadence's core mechanic), taunt/threat (no
system exists), buff potency (no passive key exists).

**Shared abstractions found:** the closest thing to a cross-class "potency"
abstraction is `technique.power-pct` / `TECHNIQUE_POWER_FIELDS` (ability
potency, class-agnostic) and the `SCALABLE_DEBUFFS` allow-list (status-effect-
id-keyed, not class-keyed). There is **no** generic "class mechanic potency"
or "empowered multiplier" abstraction that Cores plug into — the empowered
multiplier (§4.4) is Cadence-specific and has no Core participation.

---

## 6. Current Multiplicative-Bonus Infrastructure

**Status: current code.** This section documents the "class stat affinity"
infrastructure referenced in project memory as recently shipped, and evaluates
how it relates to (and could be extended for) Cores.

### 6.1 What exists

**`ClassAffinities`** (`shared/src/systems/stats.ts`) — an in-function
accumulator, not a persisted type:
```ts
interface ClassAffinities {
  attack: number; maxHp: number; plating: number; moveSpeed: number;
}
```
Populated by summing `attackPct`/`maxHpPct`/`platingPct`/`moveSpeedPct` fields
off every unlocked skill-tree node's `StatEffects` (`addAffinities`), then
applied **once**, as a single multiply per stat, in `applyClassAffinities`
(stage 7 of §4.1): `stat = round(stat * max(0.05, 1 + summedPct))`.

**`StanceModifiers`** (`shared/src/stances.ts`) — a parallel, structurally
identical percentage layer (`attackPct`/`platingPct`/`moveSpeedPct`),
deliberately applied as its **own separate multiply** (stage 8) rather than
folded into `ClassAffinities`, specifically so a stance's advertised
percentage reads literally regardless of class.

**The Core multiplier layer itself** (stage 14, §4.1) is architecturally the
same *pattern* — a percentage read from `usesSkills.passives`, applied once as
a final multiply — but it is **hand-written as a fourth, separate block**, not
built on a shared "multiplicative layer" abstraction with `ClassAffinities`/
`StanceModifiers`. There is no common interface or type uniting the three.

**`MULTIPLICATIVE_PASSIVES`** (`shared/src/passives.ts`) is a different,
narrower piece of infrastructure: a `Set<PassiveKey>` (currently containing
only `'defense.max-hit-mult'`) that changes `mergePassives`'s behavior for a
given key from "sum" to "compound as a product" **when multiple sources write
the same key**. This is not itself a "layer" — it changes how same-key values
combine *before* being read by whatever consumer later applies them. It is
unrelated to (and orthogonal to) the four sequential stat-rebuild layers above.

### 6.2 Does something like `base × classMult × coreMult` already exist?

**Yes, effectively, today** — stages 7 and 14 of the rebuild are exactly this
shape for `attack`, `maxHp`, `plating`, and `speed`:
```
finalAttack = ((base + skillFlats + equipmentFlats)
                 × (1 + Σ classAffinityPct))      // stage 7
                 × (1 + Σ stancePct)               // stage 8, if a stance is active
                 × <reload archetype op, if Reload> // stage 13
                 × (1 + Σ coreAttackMult)          // stage 14
```
This is **already** `base × classMultiplier × coreMultiplier`-shaped, not the
"sum everything into one additive bucket then multiply once" shape the brief
asks about distinguishing. The class layer and the core layer are already
architecturally separate multiplicative stages that compound with each other
multiplicatively (stage 7's output feeds stage 14 as input), not summed
together into one shared percentage pool.

**What is missing** is not the layering itself but:
1. **A shared type/interface.** `ClassAffinities`, `StanceModifiers`, and the
   ad-hoc `core.*-mult` block are three independently hand-written blocks with
   near-identical shapes and no common abstraction — extending the pattern to
   a new stat, or adding a fifth layer, means writing another bespoke block by
   hand, not implementing an interface.
2. **Same-source-multiple-contributor compounding for cores.** Because only
   one core is ever equipped, `core.*-mult` values are never summed from two
   *different equipped cores* in practice today — but if evolution ever wants
   a base-core-effect-plus-evolved-branch-effect to compound rather than add,
   that requires either moving relevant `core.*` keys into
   `MULTIPLICATIVE_PASSIVES` (changes merge-time behavior, affects `mergePassives`
   globally for that key) or restructuring how evolution branches author their
   deltas (e.g. as a replacement value rather than an additional
   `mechanicEffects` entry — see §3, evolution is unbuilt so this is undecided
   design space, not a code constraint).
3. **Non-attack/HP/plating/speed stats.** The four-layer pattern exists only
   for the four stats stage 14 currently touches. Anything a redesign wants to
   make multiplicative that isn't one of those four (buff potency, ability
   potency beyond `technique.power-pct`, DoT potency as a separate axis, etc.)
   has no existing layer to plug into and needs new passive keys plus new
   stat-rebuild code, exactly as for any other new mechanic.

### 6.3 Difficulty assessment for a dedicated Core multiplicative layer

**Low effort** for the four stats already in stage 14 — this is a numbers/cap
change to an existing, well-isolated function. **Moderate effort** to give
Cores their own compounding-with-class-affinity layer for a *new* stat, since
that means both a new passive key and a new stat-rebuild block, following the
existing pattern closely. **The cleanest seam for a "Core gets it own final
multiplier, separate from class/stance" design is exactly where stage 14
already sits** — it is already positioned last, already separate from
`ClassAffinities`, and already documented in-code as intentionally the final
layer ("cores stay the deliberate final multiplier, a separate layer stacked
on the finished class chassis" — comment at `stats.ts` stage-7 site). A
redesign does not need to invent this seam; it needs to widen what flows
through it.

---

## 7. Core Acquisition and Progression

**Status: current code**, cross-checked against `docs/cores-current-state.md`.

- **Slot unlock**: player tier 2 (skill-tree tier 1 in some internal
  numbering — see the philosophy doc's tier-terminology note: player-facing
  T2 = Frame selection, T3 = Range selection, T4 = Path selection). Three
  unrestricted T2 capstone cores are reachable at this point, but only
  late in their biome bands (Tempered/cave-12, Survivalist/jungle-6,
  Force/desert-6).
- **Recipe gates**: each core has a `requiredBiomeLevel` inside a specific
  biome, checked against `biomeLevelCap(playerTier, biomeGroup)` by
  `shared/src/data/recipeGates.test.ts`. No core requires a boss clear.
- **Mastery requirements**: none beyond the biome-level gate above — no
  separate "mastery" stat or currency gates any core.
- **Currencies/materials**: essence-color cost (`cost`, e.g. `{yellow:110}`)
  plus a catalyst-family gate (`catalystCost`, e.g. `{dominion:3}` — this
  requires the biome node to currently roll that modifier family; it is a
  reachability gate tied to the live map's node-modifier system, not a
  separate spendable currency amount beyond the number shown).
- **Permanent unlock vs. inventory item**: a crafted core is an ordinary
  inventory item (`holdsInventory.inventory`), not a permanent unlock flag —
  it can be lost/sold/consumed like any craftable if the game ever adds such
  mechanics (none currently exist for equipment).
- **Equip/unequip rules**: standard equipment-slot rules; no core-specific
  restriction beyond the eligibility gate (§4.3), which affects whether an
  equipped core is *active*, not whether it *can be equipped* — an ineligible
  core can be equipped and simply contributes nothing until the player's
  range makes it eligible.
- **Swapping cost**: none — equip/unequip is free and instant, same as any
  other slot.
- **Number of slots**: one.
- **Evolution progression**: unbuilt (§3). `requiredPlusFor()` already returns
  0 for the core slot, meaning whenever evolution is authored, advancing a
  lineage will require owning the predecessor core (crafted, in the bag), not
  upgrading it — consistent with cores having no `+N` track.
- **Tier-specific progression**: as tabulated in `docs/cores-current-state.md`
  and reproduced here:

| Band | Reachable at player tier |
|---|---|
| T1 biome (plains/forest/cave), level 7–12 | tier 2 — late T2 capstones only |
| T1 biome, level 13–18 | tier 3 |
| T2 biome (jungle, desert), level 1–6 | tier 2 — late T2 capstones only |
| T2 biome (jungle, desert), level 7–12 | tier 3 |
| T3 biome (tundra, volcanic), level 1–6 | tier 3 |
| T1 biome, level 19–24 | tier 4 |
| T2 biome (jungle, desert), level 13–18 | tier 4 |
| T3 biome (tundra, volcanic), level 7–12 | tier 4 |
| T4 biome (graveyard, trench), level 1–6 | tier 4 |

The T4 Core cast uses Mountain L22, Volcanic L10, and Graveyard L4; no Core
requires a boss clear, and all three gates are reachable inside their T4 bands.

---

## 8. Persistence and Networking

**Status: current code.** Cores have **no dedicated persistence or protocol
structures** — they ride entirely on the generic equipment/inventory slice.

### Persistence

```ts
// shared/src/components/core/networkedSlices.ts
interface HoldsInventory {
  inventory: string[];               // owned item ids, cores included
  equipment: EquipmentMap;           // equipment.core: string | null
  itemUpgrades: Record<string, number>; // per-item +N; always 0/absent for cores
}
```
- `holdsInventory` is one of the slices in `PersistedPlayerSlices`
  (`server/src/db/playerRepo.ts`), stored as a single JSON-serialized text
  column (`holds_inventory` on the `characters` table,
  `server/src/db/schema.ts`). Per this project's persistence rules, this is a
  genuinely **persisted** slice (inventory bucket), not a runtime-rebuilt one
  — equipped core and full inventory survive reload/restart.
- **No migration has ever added a core-specific column.** All six migrations
  in `server/src/db/migrations/` (0000–0006) predate/are unrelated to cores;
  core state is carried entirely inside the existing generic JSON blob.
- **No evolution-state persistence exists**, because there is no evolution
  state to persist (§3) — a core "rank" would, if implemented as currently
  scaffolded, just be a different item id in `equipment.core`/`inventory`,
  requiring no new persisted fields at all.

### Networking / protocol

- **Zero core-specific fields** anywhere in `shared/src/protocol/`
  (`socketEvents.ts`, `networkedEntity.ts`, `admin.ts`) — grepping for
  `core`/`Core` in that directory returns no relevant matches.
- `holdsInventory` is listed whole in `NETWORKED_PLAYER_KEYS`
  (`shared/src/protocol/networkedEntity.ts`) and sent via `state:sync` /
  `node:delta` like any other player slice.
- `composePlayerView` (`shared/src/protocol/views.ts`) folds `holdsInventory`
  into the spectator/UI player view generically, with an `EMPTY_EQUIPMENT`
  fallback that includes `core: null`.
- **Client**: no bespoke core handling exists in `client/src/net/`
  (`deltaApplier.ts` or elsewhere) — the client receives `holdsInventory` like
  any other slice, and UI reads `equipment.core` generically off it.
- **Admin**: no core-specific field exists in the admin protocol
  (`shared/src/protocol/admin.ts`) or any `admin/src/` tab.

### Migration hazard for a redesign

Because core state is undifferentiated JSON inside a shared blob, **any
redesign that changes item ids** (e.g. renaming/splitting a core into
multiple evolution-rank ids) needs an explicit ID-migration step for
`holdsInventory.inventory`/`equipment.core`/`itemUpgrades` on existing saves,
or old saves will reference item ids that no longer exist in
`ITEM_DATABASE`. No such stale-ID normalization currently exists for
cores specifically (a generic pattern may exist elsewhere in the codebase for
other item reworks, but was not found scoped to cores in this research pass —
worth an explicit check before any ID-changing rework ships).

---

## 9. Runtime Hooks and Side Effects

**Status: current code.** Most cores are pure stat multipliers resolved once
per stat rebuild (§4). A handful require genuine combat-pipeline hooks,
registered from `combatBootstrap.ts` (`initCoreCombatEffects()`) so the live
server and offline benches behave identically, per this project's architecture
rule.

| System | File | Trigger | Exact behavior |
|---|---|---|---|
| Elite/boss bonus damage | `server/src/systems/combat/cores.ts`, `registerEliteDamage()` | `onHit` | Gated `attackerType==='player' && defenderType==='monster'`; reads `core.elite-damage-mult`; multiplies `ctx.damage` by `(1+mult)` only if the target monster def has `elite` or `isBoss` set. |
| Mobility refund on kill | `server/src/systems/combat/cores.ts`, `registerMobilityRefundOnKill()` | `onKill` | Same attacker/defender gate; reads `core.mobility-refund-on-kill-pct`; for every equipped ability tagged `mobility` with remaining cooldown > 0, subtracts `pct × fullCooldownMs` from the *remaining* cooldown (refund is a fraction of full cooldown, not of what's left, so late-cooldown kills aren't shortchanged). |
| Unmitigated on-hit scaling | `server/src/systems/combat/engine/combat.ts`, inside `runPlayerAttack` | Every player attack with `onHitDamage > 0` | `core.onhit-mult` multiplies into the same term as any per-shot `onHitDamageMult` metadata (e.g. Reload's Alternating Cadence) — multiplicatively composed so a zeroed shot stays zero and a doubled shot gets the core bonus on top; placed after plating/DR so it is deliberately unmitigated. |
| Second DR layer | `server/src/systems/combat/engine/combat.ts`, inside `runMonsterAttack` | Every monster attack against a player | `core.dr-layer-pct` clamped to 0.9, applied as `× (1 − layer)` after the existing `× (1 − damageReduction)` term. |
| Debuff duration/potency scaling | `server/src/systems/classes/shared/applyPlayerDebuff.ts` | Every call site that applies a player-sourced debuff to a monster, via `playerDebuffConfig()` | Reads `core.debuff-duration-mult` / `core.debuff-potency-mult`; scales only status-effect ids present in the `SCALABLE_DEBUFFS` allow-list (`shared/src/systems/debuffScaling.ts`), and only the fields tagged as scalable for that effect (fraction vs. multiplier encoding handled explicitly to avoid over-scaling fields like `vulnerability` that store `1+magnitude`). |
| Mobility ability cooldown reduction | `server/src/systems/player/abilities/abilityCooldowns.ts`, `techniqueCooldownMs()` | Cooldown computation for any `mobility`-tagged ability | Sums `technique.cooldown-reduction-pct + core.mobility-cooldown-reduction-pct`, clamps to a shared 90% cap, applies once. |
| Recovery-rate scaling | `shared/src/systems/stats.ts` stage 14 only | Stat rebuild | `core.recovery-mult` scales the `recovery` stat once; explicitly **not** re-applied in `server/src/systems/defense/regen/healing.ts`'s `applyHealToPlayer` — verified by comments in both files and by `coreCombat.test.ts`. |

### Stat rebuild: does equip/evolve reset unrelated combat state?

`recalculatePlayerEntityStats(world, entity)` (`server/src/ecs/playerEntityFormulas.ts`)
is the actual entry point `equipItem`/`unequipItem`
(`server/src/systems/player/economy/inventory.ts`) call whenever a core (or
any item) is equipped or unequipped. **Yes, this resets several pieces of
runtime mitigation/combat scratch state, by design, on every equip/unequip**:

```ts
resetHardening(entity);
resetHardeningMaxDr(entity);
resetStationaryDr(entity);
resetSustainedFightDr(entity);
resetReactivePlating(entity);
resetBramblePlating(entity);
```
and, inside `recalculatePlayerStats` itself, a `resetCadenceCounters` callback
zeroes `usesCadence.speedStacks/threshold/count/rampageStacks/rampageCdReduction`
(comment: recalculating the cooldown from base makes stale rampage-reduction
state inconsistent, so it's cleared rather than carried forward).

This is **not** the same code path as a stance switch: `recalculatePlayerStanceStats`
(a separate wrapper, used only for stance changes) explicitly snapshots and
restores `tracksCombat.{counters, resources, resourceMaxes, cooldowns, flags,
strings, statusEffects}` and `usesCadence` around the same underlying recalc
call. **Equipping/unequipping a core does not go through this preserving
wrapper** — it hits the raw recalc, so the mitigation-scratch state listed
above is wiped every time, while generic `tracksCombat` (cooldowns, status
effects, resources) is left alone only because nothing in that code path
touches it (not because it's actively protected). **Implication for a
redesign**: equipping a new/evolved core mid-fight will reset any active
Hardening/Stationary-DR/Sustained-Fight-DR/Reactive-Plating/Bramble-Plating
stacks the player had built up, and will zero Cadence rampage progress for
Striker builds — a real side effect worth deciding on deliberately if the
redesign wants core-swapping (or an evolution "upgrade" action) to feel
consequence-free mid-combat vs. a deliberate reset moment.

---

## 10. Client/UI Surface

**Status: current code.** Three real UI surfaces render core data, all
funneling through one shared formatter: `client/src/ui/crafting/itemDisplay.ts`.

- **`itemDisplay.ts`** — `MECHANIC_FMT` explicitly formats every `core.*` key
  as a signed percentage of the *raw authored fraction* (comment notes a
  "-mult" key is a fraction-on-a-stat, not a literal multiplier, e.g.
  `core.attack-mult: 0.12` renders as `"+12% attack"`). `formatMechanicEffects()`
  always renders from the item's raw authored numbers — **there is no
  "effective/resolved" value shown anywhere**: no live combination with the
  player's current stats, no preview of what the post-multiplier stat will
  actually become, and **no UI text anywhere explaining that multiple
  same-key sources add rather than compound**.
- **`StatSheet.tsx`** (item detail/tooltip pane) — shows eligibility label +
  live active/inactive state (via the shared `coreIsActive` check) plus the
  formatted mechanic-effect lines.
- **`MakeTab.tsx`** (crafting/forge browser) — for a core recipe, prepends
  `"Full effect only for melee builds only"` / `"...mid or far range builds"`
  / `"Works for any build"` ahead of the effect lines.
- **`NodeInfo.tsx`** (map-node biome-unlock preview) — same pattern, reused
  when previewing what a node teaches.
- **`EquipmentSlots.tsx`** (equipped-gear rail) — dims a core slot and shows
  an inactive tooltip (`"Inactive — melee builds only"`) when a restricted
  core is currently ineligible.

**Not present at all**: any evolution UI (no evolution exists to show — §3),
any `+N` upgrade-diff UI for cores (the shared upgrade-diff table never fires
for cores, since `getMaxUpgrade === 0` is a guarded invariant), any
comparison UI beyond the generic item-tooltip pattern shared with all
equipment, any locked-content messaging beyond the crafting recipe's normal
gate display.

**Flags for a redesign that makes core effects substantially larger or
multiplicative-against-class-bonuses**: since the client already shows raw
authored percentages with zero "effective value" computation, **numbers
getting larger or gaining a new multiplicative relationship changes nothing
about how the UI currently renders them** — the tooltip text will keep working
verbatim. What *will* become misleading if the redesign proceeds is the
implicit assumption (currently harmless because it's rarely tested) that a
core's authored "+X%" is *close to* its effective marginal value — if cores
begin compounding against a separate class multiplier rather than landing as
the final additive-then-multiply stage they already are, the gap between
"authored %" and "actual DPS delta" will grow, and the total absence of any
effective-value preview (mentioned nowhere as a planned feature) becomes a
real UX gap worth deciding on deliberately.

---

## 11. Tests and Balance Tooling

**Status: current code.** Five dedicated core test files exist in
`server/test/`, plus incidental references in two more.

| Test file | What it actually verifies |
|---|---|
| `coreAuthoring.test.ts` | Data-authoring invariants only: every core recipe declares `coreEligibility` (and no non-core recipe does); eligibility survives the recipe→item copy; `getMaxUpgrade === 0` for every core; restricted cores unreachable at tier 2 / reachable at tier 3 (the historical bug regression); tier-2 cores are unrestricted and reachable at tier 2; every core has a `lineageId`. |
| `t2ProgressionEconomy.test.ts` | Locks the current T2 stance/core placement, exact essence/catalyst costs, late-band gates, no boss requirements, and the intended economy bands. |
| `cores.test.ts` | Equip/recalc wiring integration: an eligible restricted core folds its passives; a ranged core stays active across both mid AND far range (confirms "one shared pool" semantics); switching to an ineligible range zeroes both upside and downside with no lingering effect; an unrestricted core applies regardless of range. |
| `coreCombat.test.ts` | Integration test against a real `World`: `core.recovery-mult` scales the Recovery stat exactly once and is *not* re-applied by the heal funnel (double-compounding guard); `core.elite-damage-mult` applies only vs. elite/boss monsters, not normal ones; `core.mobility-cooldown-reduction-pct` sums with `technique.cooldown-reduction-pct` under one 0.9 cap and only affects `mobility`-tagged abilities; `core.mobility-refund-on-kill-pct` refunds a fraction of *full* (not remaining) cooldown, mobility-tagged abilities only. |
| `coreRangeGate.test.ts` | Regression test for the historical strict-equality eligibility bug; asserts melee/ranged/unrestricted gating semantics against `-range-close/-mid/-far` suffixes; asserts every restricted core is reachable by some real build; cross-checks that the bench's canonical loadout only equips *active* cores. |
| `coreMechanics.test.ts` | Pure unit tests of `scaleDebuffConfig`/`SCALABLE_DEBUFFS`: duration/potency scaling math; unregistered effects pass through untouched; a `-1` "permanent" sentinel is never scaled; `fraction` vs. `multiplier` field-encoding scale correctly (guards the exact vulnerability-style over-scaling trap named in `docs/cores-current-state.md`); `totalMs` buff-clock tracking; input config never mutated; registry hygiene (`slow`/`debuff-stunned` must never appear in `SCALABLE_DEBUFFS`, guarding against a player-core amplifying a monster-applied effect). |
| `recipeGates.test.ts` (shared/src/data) | Not core-specific, but includes cores in its reachability sweep: biome-level cap, live catalyst family, not on a modifier ban list. `RETIRED_BIOME_DEBT` is currently empty; comment records exactly one core was historically stranded and has since been fixed. |
| `itemUpgrades.test.ts` | Explicitly excludes `slot !== 'core'` from its upgrade-step assertions (confirms cores are deliberately outside that system, not merely untested). |

**Bench/report tooling**: `server/bench/balance/progression.ts` is the only
place cores enter offline balance tooling. `bestCoreForBuild()` auto-equips
the best eligible core for a generated build (filters by `coreIsActive`,
prefers restricted over unrestricted, tie-broken by `coreScore()`).
`coreScore()` deliberately sums the **absolute value** of every
`mechanicEffects` entry rather than the signed sum — comment explains that
summing signed values would rank every tradeoff core (e.g. Sniper's -20%
maxHp paying for +26% attack) as worse than a pure-upside core and bias the
whole DPS matrix; this absolute-magnitude heuristic is acknowledged as an
imperfect proxy in the comment itself. This same build-enumeration logic feeds
`tools/dps-report.ts` and `tools/ehp-report.ts` (and very likely
`tools/mob-report.ts`, though no direct core reference was found there).

**Bot/reference harness (`bot/`)**: **zero core interaction.** No `bot/src`
route references any `core-*` item id, and all current bot routes are T1-only
— below the tier-2/tier-3 biome levels (7+) where any core first becomes
craftable. This means the bot-driven playtest/telemetry harness currently
provides no signal on core balance or wiring at all.

### Missing coverage relevant to a large tuning pass

- **No test exercises two same-key `core.*` sources compounding** — moot
  today (one core equipped at a time) but will matter the moment evolution
  branches can add a second `mechanicEffects` source for the same key.
- **No test asserts the exact stage-ordering** documented in §4.1 (i.e. that
  core multiplies happen strictly after class-affinity and stance multiplies)
  — current tests check *that* a core's effect lands, not *where in the
  pipeline order* it lands relative to other multiplicative layers. A
  regression that silently reordered stages 7/8/13/14 would not be caught.
- **No preview-vs-authoritative parity test** — since the client shows raw
  authored numbers with no effective-value computation (§10), there is
  nothing to test for parity yet, but a redesign that adds an effective-value
  preview will need new tests to keep it honest against the server formula.
- **No bot/telemetry coverage** at all, as noted above — a large tuning pass
  aimed at making cores feel like real capstones would have no automated
  signal on player-facing feel without extending bot routes past T1.
- **No test on the equip-time combat-state reset** documented in §9 (hardening/
  reactive-plating/bramble-plating/cadence-rampage resets on core swap) — this
  behavior is real and load-bearing but currently unverified by any test.

---

## 12. Current Core Power Assessment

**Status: derived from current code + `design_docs/CORE_DESIGN_PHILOSOPHY.md`
§9 (design bands). This is a comparison against the design doc's own stated
targets, not a fresh balance simulation — treat the "band" comparisons as
indicative, not authoritative.**

Because Cores are the **final** multiplicative layer (§4.1 stage 14), their
authored percentage is close to their *effective* percentage on the specific
stat they touch — no dilution into a larger additive bucket happens for the
core layer itself. The gap between "authored" and "actual DPS/eHP impact"
instead comes from (a) how narrow a slice of total output the stat is for a
given class/build, and (b) whether the core's bonus is conditional
(elite/boss-only, on-hit-only, mobility-tag-only).

### Design-band comparison (philosophy doc §9, reproduced in §1)

| Band | Design target | What actually shipped |
|---|---|---|
| Tier-2 unrestricted capstone | ~8–15% on a major stat, ~10–15% total effective power | Tempered: 12%/12%. Survivalist: 30% recovery / 15% maxHp. Force: 22% attack / -12% maxHp. |
| Tier-3 unrestricted specialist | ~15–25% on primary mechanic, ~15–25% effective power | Arcanist: 18% technique CDR / 8% power (below band on both axes vs. the draft's 15–20%/5–10%, though close). Accelerant: 25% attack speed / -12% attack (speed at top of the 20–30% draft band; penalty below the 10–20% ceiling). |
| Tier-3 restricted specialist | ~20–30% primary axis, sometimes +10–20% secondary, ~20–35% effective power in scenario | Duelist: 12% attack (**below** the 20–30% band entirely) + 15% elite/boss bonus — reads as under-tuned relative to its own design band. Scout: 14% attack / 16% speed / 20% mobility-CDR / -15% maxHp — attack is below the 10–18% draft band's midpoint but close; roughly on-template otherwise. Bruiser: 20% attack / 15% maxHp / 12% speed / 40% mobility-refund — attack and maxHp both land inside the 15–25%/10–20% draft bands; the 40% mobility-refund exceeds the draft's 30–50% band's midpoint but stays inside it. Sniper: 26% attack / -20% maxHp / -15% plating — attack lands mid-band (20–30%), penalties roughly match the draft's -15–25%/-10–20% bands. |
| Tier-4 mature unrestricted specialist | ~20–35% on primary mechanic, premium effective power | Controller: 35% debuff duration / 25% potency. Catalyst: 115% existing on-hit / -15% attack. |
| Tier-4 mature restricted specialist | ~20–40% primary axis, premium effective power in scenario | Juggernaut: 30% maxHp / 40% plating / 14% DR-layer / -25% attack speed / -10% speed — a deliberately multi-axis survivability package with a meaningful tempo cost. |

**Overall read**: the three T2 entries now use their live capstone values and
late-band gates (Tempered 12%/12%, Survivalist 30% recovery/15% maxHp, Force
22% attack/-12% maxHp). The remaining comparison is a historical design-band
assessment of the T3/T4 cast, not a request to change any mechanics or placement.

### Representative marginal-value examples

- **Tempered** (+12% attack, +12% maxHp, no conditions): marginal DPS gain is
  close to a literal 12%, since it's the final multiplicative stage acting on
  the fully-built `attack` stat — no dilution. This is the *cleanest* case in
  the cast precisely because it has no conditionality.
- **Duelist** (+12% attack always, +15% only vs elite/boss): against a normal
  monster, effective gain is 12%. Against an elite/boss, effective gain is
  `1.12 × 1.15 − 1 ≈ 28.8%` on that hit (the two Duelist terms apply at
  different pipeline points — attack-mult pre-mitigation, elite-mult
  post-mitigation onHit listener — but compound multiplicatively on net
  damage dealt to that target). For farming content with few/no elite or boss
  kills, a large fraction of Duelist's authored power is inert — this matches
  its own flavor text ("nothing here helps against a crowd") but means its
  *average* effective bonus across mixed content is well below its peak.
- **Catalyst** (+115% on-hit, -15% attack): because `onHitDamage` is currently
  authored on very few weapon lineages (per §5/§11 research), most builds
  equipping Catalyst pay the guaranteed -15% attack penalty for a +115%
  multiplier on a damage term that is zero or near-zero for them. For those
  builds the *net* effect is strictly negative — a real "trap" case for any
  build not specifically built around on-hit damage, and worth flagging for
  the redesign regardless of exact numbers.
- **Juggernaut** (multi-axis defense stack): eHP-style layered defense means
  its four simultaneous bonuses (maxHp, plating, DR-layer, minus attack-speed/
  move-speed) compound multiplicatively against incoming damage in a way a
  single-number "effective %" undersells — this is the one core in the current
  cast that structurally resembles the philosophy doc's stated *ambition*
  ("a dedicated Tier 3 melee tank may target roughly 40–60% greater effective
  survivability... after all layers are included" — §10 of the philosophy
  doc) more closely than its raw per-axis numbers alone suggest.

### Obvious under-tuned-for-capstone cases

- **Force** (22% attack / -12% maxHp): the original design draft explicitly
  framed Force as possibly "primarily a starter core"; the live recipe now
  places it as a premium T2 capstone, so that draft note is historical only.
- **Tempered / Survivalist**: both sit at or near the design floor for a
  tier-2 capstone, which is a premium purchase at the end of the T2 band —
  the more relevant question for a redesign is whether the tier-3+ cast
  escalates enough from this stage to read as a capstone jump.

---

## 13. System-Boundary Audit

**Status: classification against `design_docs/CORE_DESIGN_PHILOSOPHY.md` §2's
"Magnifier Rule"** — no redesign proposed here, only where current content
sits relative to the stated boundary.

The philosophy doc's own rule: *"A Core may alter the magnitude, duration,
frequency, cooldown, targeting condition, or stat scaling of an existing
mechanic. It should not normally create a new attack, detonation, resource
loop, active payoff, or standalone combat subsystem."*

Checked against every shipped core:

| Core | Classification | Reasoning |
|---|---|---|
| Tempered | Clean magnifier | Pure stat scaling, no conditions. |
| Survivalist | Clean magnifier | Pure stat scaling (recovery + maxHp). |
| Force | Clean magnifier | Pure stat trade, no conditions. |
| Juggernaut | Clean magnifier | Pure stat scaling across 5 axes, including a genuinely new *layer* (`core.dr-layer-pct`) — but that layer scales an *existing* mechanic (incoming-damage mitigation), it doesn't add a new subsystem. |
| Duelist | Clean magnifier, conditional | Targeting-condition-gated magnitude bonus (elite/boss) — explicitly one of the philosophy doc's named "healthy" patterns ("amplifying an existing effect while... a condition is active" / conditional targeting). |
| Arcanist | Clean magnifier | Cooldown reduction + potency on an *existing* ability system (Technique). Textbook "healthy" pattern per the doc's own list. |
| Controller | Clean magnifier | Duration/potency scaling on existing debuffs, allow-listed. Matches the doc's named pattern exactly ("increasing buff, debuff, DoT... potency"). |
| Scout | Clean magnifier, conditional | Cooldown reduction gated on an ability tag (`mobility`) — same pattern as Arcanist, narrower audience. |
| Sniper | Clean magnifier | Pure stat trade. |
| Bruiser | Borderline — **event-triggered partial refund, not a pure passive** | "Kills refund part of a cooldown" is explicitly named as a *healthy* pattern in the philosophy doc ("partially refunding... an existing skill under a deterministic condition"), so this is intentionally inside the rule, not a violation — flagged here only because it is the closest any current core comes to an active-payoff *feel* (something happens on an event, not just "stats are bigger"), worth the redesign being aware it's the precedent for how far event-triggered Core effects currently go. |
| Accelerant | Clean magnifier | Pure stat trade (attack speed for attack). |
| Catalyst | Clean magnifier, narrow-audience | Scales an existing on-hit mechanic; the "trap" issue flagged in §12 is a *balance* problem (thin audience), not a system-boundary violation — it doesn't create a new mechanic, it amplifies one that's under-authored elsewhere. |

**Overall finding: no shipped core currently violates the Magnifier Rule.**
Every core scales, conditions, or partially-refunds something that already
exists; none creates a new attack, detonation, resource, or standalone
subsystem. The **design-only** (unshipped) evolution roster in
`CORE_CAST_REVIEW_DRAFT.md` stays similarly disciplined in its stated
direction names (e.g. "Colossus: existing attacks or abilities scaling more
strongly from HP" — a stat-scaling reframe, not a new attack), **except** for
one explicitly-flagged self-contradiction already noted in §3: the draft's
design-only tier-3 "Affliction" core (DoT potency/duration) directly
contradicts the "no DoT core" rationale documented elsewhere in the same
project (§2) — this is a doc-vs-doc inconsistency, not a shipped-code issue,
but worth resolving explicitly before any DoT-adjacent core work begins.

---

## 14. Open Implementation Decisions for the Redesign

1. **How large should the Core capstone power spike actually be**, given that
   roughly half the current cast sits at or below its own design doc's stated
   floor (§12)? Should the philosophy doc's §9 bands be revised upward, or
   should implementation simply be brought up to the existing bands first?
2. **Which Core bonuses should become multiplicative against class bonuses**,
   given that `attack`/`maxHp`/`plating`/`speed` are *already* structurally
   multiplicative against the class-affinity layer today (§6.2) — is the ask
   to intensify that (bigger core multipliers), or to add genuinely new
   multiplicative axes (buff potency, ability potency, DoT potency) that
   don't have any layer to plug into yet?
3. **Should Core multipliers multiply separately with class multipliers, or
   should some Core effects instead widen the *class* affinity's own ceiling**
   (e.g. a Core that increases how much the class-tree affinity bucket is
   worth, rather than adding a fifth independent multiply)? Current
   architecture makes the former trivial and the latter unbuilt.
4. **Which stats/mechanics should never receive multiplicative Core scaling?**
   Worth deciding explicitly given `core.dr-layer-pct` already stacks
   multiplicatively against base damage reduction with no cap besides 0.9 —
   is that intentional as a category-wide policy, or was 0.9 chosen ad hoc for
   this one key?
5. **How should Core evolution scale the base Core** — replace the base
   effect's number, add an *additional* `mechanicEffects` entry (which sums
   under current `mergePassives` semantics — §6.2), or introduce a genuinely
   new key per branch? This decision also determines whether evolution
   branches need to be added to `MULTIPLICATIVE_PASSIVES`.
6. **Should base Cores and evolved Cores use the same power budget**, i.e. is
   an evolved core meant to be strictly stronger (a "rank up"), or a lateral
   specialization that trades breadth for a sharper edge (matching the
   "Reaver/Mauler/Pursuer" sibling-branch pattern in the design draft, which
   reads as lateral, not vertical)?
7. **Should generic (unrestricted) Cores remain viable across all classes**,
   given §5's finding that Conduit (Summoner) currently receives unintended-
   looking extra value from combat-listener cores (Duelist, Bruiser) via
   minion attacks being tagged `attackerType: "player"`? Should that be
   treated as a bug to fix, or as an acceptable/desirable summoner-scaling
   side effect worth keeping and even leaning into?
8. **Which current Cores are conceptually sound but under-tuned** — per §12,
   Duelist and Arcanist read as the clearest "right idea, low numbers" cases;
   Catalyst reads as "right idea, thin supporting content elsewhere" (few
   `onHitDamage`-bearing weapons) rather than a Core-side problem.
9. **Which current Cores require mechanical redesign rather than number
   changes** — Catalyst is the strongest candidate (its value is gated by
   content outside the Core system's own control); Scout/Bruiser's
   mobility-tag gating is similarly gated by how many abilities carry the
   `mobility` tag (currently just one, Charge) rather than by the Core's own
   design.
10. **What tests/benchmarks are needed before retuning the full catalog?**
    Per §11: same-key multi-source compounding (once evolution exists),
    explicit pipeline-stage-order regression coverage, an effective-value
    preview parity test (if the UI gains one), a test for the equip-time
    combat-state reset behavior (§9), and — most concretely actionable before
    any numbers work — extending the bot/route harness past tier 1 so core
    balance gets *any* automated playtest signal, since it currently gets
    none.

---

## 15. Implementation Blast-Radius Checklist

File-by-file map for a future Core rework, organized by layer.

### Shared definitions and data
- `shared/src/data/recipes/*.recipes.ts` — all 12 core recipes live inline in
  their biome files (`plains`, `forest`, `cave` ×2, `mountain` ×2, `swamp`,
  `tundra`, `desert`, `jungle` ×2, `volcanic`). No central `coreDatabase.ts`
  exists — a redesign that wants one would need to either create it and
  update `shared/src/recipeDatabase.ts`'s merge point, or continue the
  per-biome-file convention.
- `shared/src/data/recipes/types.ts` — `Recipe` interface: `coreEligibility`,
  `lineageId`, `evolvesFrom`.
- `shared/src/items.ts` — `ItemDefinition`, `CoreEligibility`,
  `EquipmentSlot`, `EQUIPMENT_SLOTS`.
- `shared/src/itemDatabase.ts` — recipe→item merge point.
- `shared/src/systems/cores.ts` — `coreIsActive`, `isRestrictedCore`,
  `coreEligibilityLabel`. Single source of truth for the eligibility gate.
- `shared/src/systems/evolution.ts` — generic evolution mechanism
  (`requiredPlusFor`, `EVOLUTION_REQUIRED_PLUS`) already special-cases cores;
  this is where evolution-branch logic would extend from.
- `shared/src/passives.ts` — `CORE_KEYS`, `MULTIPLICATIVE_PASSIVES`,
  `mergePassives`, `ALL_PASSIVE_KEYS`. Any new core passive key must be added
  to `CORE_KEYS` and (if it should compound rather than sum across sources)
  to `MULTIPLICATIVE_PASSIVES`.
- `shared/src/data/mechanicLabels.ts` — player-facing labels for every
  `core.*` key (13 rows currently).
- `shared/src/data/recipeGates.test.ts` — reachability gate; will need
  updating if biome/tier placement changes.
- `shared/src/systems/dotClassProfile.ts`,
  `shared/src/systems/empoweredMult.ts` — the two formula files that
  currently do **not** read any `core.*` key; either would need a new term if
  the redesign wants Cores to directly touch DoT-potency or the empowered
  multiplier as first-class axes.

### Stat/passive systems
- `shared/src/systems/stats.ts` — `recalculatePlayerStats`, the entire
  rebuild pipeline; the core-multiplier block (stage 14) is the primary edit
  surface for numeric/structural changes; `ClassAffinities`/
  `applyClassAffinities`/`applyStanceModifiers` are the pattern to mirror for
  any new layer.
- `shared/src/stances.ts` — `StanceModifiers`, the sibling pattern to
  `ClassAffinities`.

### Class adapters
- None exist today (§5) — a redesign introducing class-aware Core behavior
  would be new code, likely living alongside
  `server/src/systems/classes/archetypes/*` or as new branches inside
  `server/src/systems/combat/cores.ts`.

### Server runtime systems
- `server/src/systems/combat/cores.ts` — the two event-driven core effects
  (elite damage, mobility refund); registered via
  `server/src/systems/combatBootstrap.ts` (`initCoreCombatEffects()`).
- `server/src/systems/combat/engine/combat.ts` — `runPlayerAttack` (on-hit
  term, `core.onhit-mult`) and `runMonsterAttack` (`core.dr-layer-pct`).
- `server/src/systems/classes/shared/applyPlayerDebuff.ts` — debuff
  duration/potency scaling gateway.
- `shared/src/systems/debuffScaling.ts` — `SCALABLE_DEBUFFS` allow-list; any
  new scalable debuff (or new Core touching debuffs) registers here.
- `server/src/systems/player/abilities/abilityCooldowns.ts` —
  `techniqueCooldownMs`, mobility-tag cooldown math.
- `server/src/systems/defense/regen/healing.ts` — `applyHealToPlayer`; the
  explicit non-re-application of `core.recovery-mult` lives here.
- `server/src/ecs/playerEntityFormulas.ts` — `recalculatePlayerEntityStats`,
  the wrapper that resets mitigation-scratch state on every equip/unequip
  (§9); `recalculatePlayerStanceStats` is the sibling wrapper that
  *preserves* combat state, worth comparing against if a redesign wants
  core-swapping to stop resetting mid-fight state.
- `server/src/systems/player/economy/inventory.ts` — `equipItem`/
  `unequipItem`, the call sites that trigger the rebuild.
- `server/src/systems/classes/archetypes/summoner/spawn.ts` /
  `summonerPrototype.ts` — minion attack formula reading post-core
  `owner.dealsDamage.attack`; also where the `attackerType: "player"`
  hardcoding relevant to §5's Conduit finding lives (inside
  `runPlayerAttack`'s call context, not spawn.ts itself — verify exact
  call site before modifying).

### Persistence
- `server/src/db/schema.ts` — `holds_inventory` column (shared with all
  equipment, not core-specific).
- `server/src/db/playerRepo.ts` — `PersistedPlayerSlices` listing.
- `server/src/db/migrations/` — where any core-ID-changing migration would
  need to land, plus a data-migration step for existing `holdsInventory` blobs
  if item ids change.

### Protocol/views
- `shared/src/protocol/networkedEntity.ts` — `NETWORKED_PLAYER_KEYS`
  (`holdsInventory` generic entry).
- `shared/src/protocol/views.ts` — `composePlayerView`, `EMPTY_EQUIPMENT`.
- `shared/src/protocol/admin.ts` — currently has no core fields; would need
  additions if the redesign wants an admin surface (§8/§10 both flag this gap).

### Client UI
- `client/src/ui/crafting/itemDisplay.ts` — `MECHANIC_FMT`,
  `formatMechanicEffects`. Central formatter; touch first for any new
  `core.*` key or any presentation change (e.g. adding effective-value
  previews).
- `client/src/ui/inventory/StatSheet.tsx` — item detail/tooltip pane.
- `client/src/ui/crafting/MakeTab.tsx` — crafting browser.
- `client/src/ui/map/NodeInfo.tsx` — map-node preview.
- `client/src/ui/inventory/EquipmentSlots.tsx` — equipped-gear rail,
  active/inactive indicator.
- `client/src/net/deltaApplier.ts` — generic inbound state handling; would
  need a bespoke core section only if new networked fields are added (§8).

### Admin
- No existing files to modify — `admin/src/` and `server/src/admin/` have no
  core-specific surface today; new admin visibility is greenfield work.

### Tests
- `server/test/coreAuthoring.test.ts`, `cores.test.ts`, `coreCombat.test.ts`,
  `coreRangeGate.test.ts`, `coreMechanics.test.ts` — all five will need
  updates or additions for any structural change; see §11 for specific gaps
  (multi-source compounding, stage-order regression, equip-time reset
  coverage).
- `shared/src/data/recipeGates.test.ts`, `shared/src/systems/itemUpgrades.test.ts`
  — incidental core coverage; check both still pass after any recipe/tier
  changes.

### Benches / reports / bot
- `server/bench/balance/progression.ts` — `bestCoreForBuild`, `coreScore`;
  the only place cores are represented in offline balance tooling. The
  absolute-value `coreScore` heuristic (§11) is worth revisiting if the new
  cast has larger or more numerous tradeoff axes.
- `tools/dps-report.ts`, `tools/ehp-report.ts` (and likely `tools/mob-report.ts`)
  — consume the above via build enumeration; no core-specific code of their
  own, but their output will reflect any core rebalance automatically.
- `bot/` — **currently zero core coverage**; extending route content past
  tier 1 is the concrete prerequisite for this harness to say anything about
  core balance/feel (§11, §14 item 10).

### Design docs (update after, not during, the audit)
- `design_docs/CORE_DESIGN_PHILOSOPHY.md` — locked foundation; the redesign
  will likely revise §9's power bands and possibly §2's magnifier-rule
  exceptions.
- `design_docs/CORE_CAST_REVIEW_DRAFT.md` — roster + evolution directions;
  contains the unresolved Affliction/DoT-core contradiction (§3, §13) that
  should be reconciled explicitly.
- `docs/cores-current-state.md` — the living-truth doc; must be updated to
  match whatever ships, per this project's documentation-lifecycle rule
  (fold what's still true, archive the rest with a pointer).
- `docs/archive/cores-rework-implementation-plan.md` — historical rework
  plan; referenced by code comments for "why there is no DoT core" reasoning,
  not independently re-verified in this audit.
