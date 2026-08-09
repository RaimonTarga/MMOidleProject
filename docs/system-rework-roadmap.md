# System Rework — Implementation Roadmap

**Status:** Active planning. Source brainstorm: `design_docs/archive/system-rework-brainstorming-final.md`.
**Companion doc:** `docs/system-rework-status.md` tracks what is implemented vs. pending.
**Origin:** results of the post-T4 playtest. The prior `design_docs/archive/roadmap-2026-06.md`
(T4-playable milestone) is **complete**; this roadmap supersedes it as the active plan.

---

## How to use this doc

- The rework is split into **steps**. Each step is at least one dedicated session.
- Steps are ordered **dependency-first**: each builds on a stable base below it.
- Every step carries an **Open Questions** block. These are resolved up front in a Q&A
  pass and the answers are folded back into the step before its session begins.
  A step is not "ready to implement" until its Open Questions are marked resolved.
- When a step's session starts, spin its detailed design into its own paired docs
  following the existing convention: `docs/<feature>-plan.md` + `docs/<feature>-current-state.md`.
- This doc is the index and the order. `system-rework-status.md` is the scoreboard.

**Q&A legend:** `[ ]` open · `[~]` partially answered · `[x]` resolved

---

## Guiding axioms (from the brainstorm)

```text
Recipes unlock access.
Essence/catalysts pay for power.
Global Mastery opens caps.
Tier unlocks major system structure.
```

```text
deterministic · automated by default · solo-complete · party-incentivized · build-preparation focused
```

Target shift:

```text
FROM: Farm one biome → craft a few strong items → kill one boss → next tier
TO:   Explore biome-shaped problems → unlock recipes → craft answers → prepare a build/rune setup → clear biome trials → advance tiers
```

---

## Dependency graph

```text
1 Aspect Essence economy ─┬─> 3 Recipe system + Biome Mastery ─┬─> 4 Global Mastery ─> 5 Rune sourcing
2 Biome Catalysts ────────┘                                    │
                                                               ├─> 6 Gear evolution
                                                               ├─> 7 Skills rework ──┐
                                                               └─> 8 Charms/recovery ┘
6,7,8 (build base) ─> 9 Cores (T2+)
5 + 3 ─────────────> 10 Stances (T2)
3 + 4 ─────────────> 11 Rites/Disciplines/Protocols (T3)
(largely independent) 12 Biome identity / combat ecology
12 + 1,2 + 5 ──────> 13 Dungeons/Guardians/Bosses as exams
(all systems) ─────> 14 UI / clarity / failure diagnosis
(cross-cutting) ───> 15 Balance + simulation tooling pass

PARKED: Relics (T4+) · map traversal · world events · group content
```

**Tier-gated structure (target):** T1 = skills · T2 = cores, basic stances · T3 = rites/protocols/disciplines · T4 = relics.
Gear and runes are baseline (all tiers). Skill slots tie to tier, not Global Mastery.

---

# Cross-cutting concerns (apply to EVERY step — check at each session)

These were surfaced in a post-Q&A review. They are not steps; they are a checklist that
several steps repeatedly touch. Ignoring them is how a "data-only" change breaks the live game.

- **Persistence + migration.** New `TracksProgression` fields (catalysts), the 5th `core`
  equipment slot, retired rune-capacity recipes, and the essence rename all touch persisted
  player state. Game is pre-release → clean cutover is usually acceptable, but each session must
  decide: migrate existing saves, or reset? (`server/src/db/migrations`, `playerRepo.ts`).
- **Networked-slice allowlists + dev-boot invariants.** Anything added to a networked slice
  (catalysts, GM, core slot) must update `NETWORKED_PLAYER_KEYS` and pass the marker/network
  invariants. *Fix the invariant, not the check.*
- **Protocol / `PlayerView`.** New player-facing state needs view fields + composers
  (`shared/src/protocol/views.ts`). Don't hand-write parallel socket types — update shared first.
- **Admin dashboard.** Admin views surface essences/biomeLevel/etc.; `admin/` + `gameActions.ts`
  have reset/grant actions. New currencies/slots/systems need admin read + grant/reset support, or
  ops loses visibility/control. (Never tracked in the per-step plans — add per step.)
- **combatBootstrap parity.** New combat listeners (Abilities, Cores, Stances) MUST register in
  `initCombatSystems()` so the live server and benchmarks stay identical (CLAUDE.md invariant).
- **Rune-action catalog (shared hub).** Steps 7 (fire ability) and 10 (switch stance) both add rune
  actions. One owner for the catalog; coordinate so RP costs and channels stay coherent.
- **Onboarding / quests (low priority).** New systems (catalysts, cores, abilities) want a quest/
  tutorial introduction; the brainstorm wants skills early enough to *help solve* a biome
  (`shared/src/quests/`, starter-kit fragments).

---

# Foundation — economic & progression spine

These four (+5) define how power is gated and paid for. Almost everything downstream
references them, so they land first and stabilize before build/content work.

## Step 1 — Aspect Essence economy

**Goal:** Confirm/re-scope the **5 generic essences** as all-tier aspect currencies; add
**advanced-biome mixtures** and **tier drop-volume scaling**. This step is mostly already
built — it is a smaller delta than the brainstorm implied.

**Current state (audited 2026-06-23):**
- `shared/src/items.ts` already defines **5 generic essences** `red|blue|green|yellow|purple`
  (`EssenceType`, `ESSENCE_TYPES`, `ESSENCE_COLORS`) — **flat across all tiers**, not per-tier.
- `BIOME_PRIMARY_ESSENCE` maps every biome (incl. advanced) to **one** essence.
- Each monster drops a **single** `essenceType` + flat `essence` amount (`monsters/types.ts`
  `rewards`). No mixtures today.
- Recipe/upgrade costs are already `Partial<Record<EssenceType, number>>`.

**Scope (the actual delta):**
- Optional rename/re-theme to aspects (Might/Wild/Rot/Stone/Deep) — or keep colors.
- Advanced biomes drop **themed mixtures** (needs a multi-essence reward shape on monsters
  or a biome-level drop table — currently single-valued).
- Tier **drop-volume scaling** (higher tier = much more per time).

**Depends on:** nothing (foundation).

**Out of scope:** boss-specific materials, elite currency (explicitly deferred).

**Resolved decisions (2026-06-23 Q&A):**
- `[x]` Current model? → **5 flat generic essences already exist**; single-essence drops; no mixtures.
- `[x]` **Rename to aspect names** (Might/Wild/Rot/Stone/Deep) across data + UI. Mapping derived
  from current `BIOME_PRIMARY_ESSENCE` + brainstorm biome assignments:

  | Aspect | Current color key | Starter biome |
  |--------|-------------------|---------------|
  | Might  | `yellow` | Plains |
  | Wild   | `green`  | Forest |
  | Rot    | `purple` | Swamp |
  | Stone  | `blue`   | Mountain |
  | Deep   | `red`    | Cave |

- `[x]` **Mixtures = vary essence per mob.** Keep single-essence drops; different mobs in a biome
  drop different essences so the biome's mixture emerges from its spawn pool. **No reward-shape change.**
- `[x]` **Drop volume → deferred to balance pass (user-owned, Step 15).** No structural change here.
- `[x]` **Fold into Step 2/3** — no standalone session. The rename + per-mob essence assignment ride
  along with the catalyst/recipe work.

**Implementation note:** decide rename strategy at session time — full key rename vs. keeping internal
keys + aspect display names. The Q&A picked "rename to aspects"; if a full data-key rename is risky,
the display-name-only fallback achieves the same player-facing result. Flag this when the session starts.

**⚠️ Magnitude (added post-review):** the `EssenceType` keys (`red`/`blue`/…) are referenced across
monsters, all recipe files, `ESSENCE_COLORS`, admin views, `PlayerView`, and client UI. A full key
rename is a sizable mechanical refactor **plus** a player-balance migration. **Recommendation: prefer the
display-name-only approach** (keep internal keys, show aspect names + colors in UI) unless there's a
strong reason to churn the data layer.

## Step 2 — Biome Catalysts

**Goal:** Per-biome deterministic special currency earned by kill-progress, layered on top
of generic essence.

**Scope:**
- One catalyst (or catalyst counter) per biome; kill fills progress → 1 catalyst.
- Enemy weight tiers (normal < tanky < elite < guardian < boss-first-clear bundle).
- Define what catalysts buy (biome skills, evolutions, core branches, advanced runes, relic
  fragments T4+).

**Depends on:** none strictly, but pairs with Step 1 (recipes will require both).

**Current state (audited 2026-06-23):**
- No catalyst system exists. Player currency/progression lives in the `TracksProgression`
  networked slice (`shared/src/components/core/networkedSlices.ts`): `essences`, `biomeXP`,
  `biomeLevel`, `unlockedRecipes`, `bossesCleared`, rune fields, etc. — persisted.
- Catalysts will add fields here (e.g. `catalysts: Record<biomeGroup, number>` +
  `catalystProgress: Record<biomeGroup, number>`), persisted like essences.
- Reward granting (incl. party same-node sharing) flows through `grantMonsterRewards` (server).

**Resolved decisions (2026-06-23 Q&A):**
- `[x]` **One catalyst per biome group** — a single e.g. Forest catalyst earned in any Forest
  node across all tiers. Higher-tier recipes just cost more. Keeps the currency list small.
  → catalyst wallet keyed by biome group: `catalysts: Record<biomeGroup, number>`.
- `[x]` **Progress weighted by a designed field on the monster** (normal/tanky/elite/guardian
  weight tiers). Add a catalyst-weight to monster defs (`monsters/types.ts` rewards or a sibling
  field). Guardians/boss-first-clear grant large one-time bundles.
- `[x]` **Extend `Recipe.cost` (and `UpgradeStep.cost`) with a parallel catalyst-cost axis** —
  essence dict + catalyst dict, both `Partial<Record<…, number>>`. Crafting reads both.
- `[x]` **Uncapped**, like essence.
- `[~]` Party same-node sharing → mirror `grantMonsterRewards` essence/XP sharing (default;
  revisit if it feels too generous).

**Session payload:** add `catalysts` (+ `catalystProgress`) to `TracksProgression`; add a
catalyst-weight field to monster rewards; add a catalyst cost axis to `Recipe`/`UpgradeStep`;
grant progress in `grantMonsterRewards`; name the per-biome catalysts (brainstorm has placeholders).

## Step 3 — Recipe system + Biome Mastery recipe-unlock track

**Goal:** Biome Mastery unlocks **recipes** (access), not direct power. Crafting pays with
essence/catalysts. Includes the biome-level reward layout and the possible 4→5/6 level
expansion per tier segment.

**Scope:**
- Recipe entity: known/unknown state, unlock source (biome mastery level / boss / global).
- Biome Mastery track grants recipe unlocks per level.
- Decide biome levels per tier segment (current ~4 → proposed 5/6) and the reward layout.
- Catch-up recipes (replace obsolete catalyst reqs with higher essence cost).

**Depends on:** Steps 1, 2 (recipes reference essences/catalysts as costs).

**Current state (audited 2026-06-23):**
- A real recipe system exists: `shared/src/data/recipes/` with `Recipe` (`types.ts`).
- Recipes already gate on **`requiredBiomeLevel`** (per `recipeGroup`) and **`requiredBossClear`**
  (a boss-clear token). So "biome unlocks recipes" + "boss unlocks recipes" are *partly built* —
  but keyed on biome **level (XP)**, not catalysts/mastery as a separate track.
- `requiredBiomeLevel` cap is gated by `GAME_CONFIG.BIOME_LEVEL_CAP_BY_TIER`.
- Recipes are **gear-only** today (`slot: EquipmentSlot`); no skill/rune/core recipes.
- **`BIOME_LEVELS_PER_TIER = 4`** is a core constant (`gameConfig.ts`) used by `biomeLevelCap`,
  `biomeLevelOffset`, XP-curve mapping, and all recipe `requiredBiomeLevel` authoring. Expanding
  it to 5/6 ripples through those — architectural, not a config tweak.
- ⚠️ **Tension with brainstorm:** essence income is already tier-scaled, but *downward*
  (`BIOME_ESSENCE_TIER_MULT` dampens late-game flooding). The brainstorm wants higher tiers to
  give *more* per time. Deferred to the balance pass (Step 15, user-owned) per Step 1 decision.
- "Biome Mastery" in the brainstorm ≈ the existing **biome level/XP track** (it already gates
  recipe unlocks). The rework reframes + extends it, not necessarily a new parallel track.

**Open Questions:**
- `[x]` Recipe known/unknown exists? → **Yes, level- and boss-gated unlocks already exist** (gear only);
  `TracksProgression.unlockedRecipes` tracks explicitly-unlocked recipes.
- `[x]` **"Biome Mastery" = the existing biome level system. KEEP IT AS-IS.** The brainstorm
  over-described this. No new local-mastery track. The *only* net-new foundation piece is
  **Global Mastery = an aggregate of all biome levels** → see Step 4.
- `[x]` Biome levels per tier (4 → 5/6)? → **Decide at session time.** Prototype the T1 reward
  layout first; pick the count based on how cramped it feels. Changing `BIOME_LEVELS_PER_TIER`
  ripples through curves/caps/recipe authoring.
- `[x]` Skills/runes/cores via one recipe system vs parallel? → **Decide per system later**
  (Steps 5/6/7/9). Runes already have their own unlock fields.
- `[x]` Catch-up recipes shape? → **Deferred to Step 6** (gear evolution/reconstruction).

**Net effect:** Step 3 has **no standalone session** — recipe system + biome levels already exist
and are kept. Catalyst cost axis is Step 2; Global Mastery is Step 4; per-system recipe extensions
ride with their own steps. The biome-level-count question reopens at the first content-layout session.

## Step 4 — Global Mastery

**Goal:** Derived from total biome mastery; grants **system-depth caps**, not direct stats.

**Scope:**
- Define the derivation (sum/threshold of biome mastery).
- Caps it controls: item upgrade caps, runic point cap, maybe core/relic rank caps,
  maybe rite/discipline/protocol slot caps, maybe evolution depth reqs.
- Catch-up logic (rush next tier with low GM → farm current tier to recover; don't force
  full completion of retired content).

**Depends on:** Step 3 (biome levels exist to derive from). This is the **only net-new foundation
piece** per the Step 3 Q&A.

**Current state (audited 2026-06-23):**
- No global/account aggregate exists. Biome levels live per-group in `TracksProgression.biomeLevel`.
- **Item upgrade cap:** `MAX_UPGRADE = 3` constant (`systems/itemUpgrades.ts`); per-item max =
  `item.upgrades.length ?? MAX_UPGRADE`. (Note: current cap is +3, not +5 — the brainstorm's +5
  is a Step 6 extension.)
- **RP budget:** `runeBudgetForTier(tier, bonus) = 8 + tier*2 + bonus` (`runeDatabase.ts`), where
  bonus comes from crafted capacity recipes (`runePointBonus`). RP currently scales with **tier**.

**Resolved decisions (2026-06-23 Q&A):**
- `[x]` Global aggregate exists? → **No.** GM is new.
- `[x]` **GM = simple sum of all biome levels.** Transparent, rewards breadth, live (rises as any
  biome is farmed). Likely a derived value (computed from `biomeLevel`), not separately persisted.
- `[x]` **v1 caps = item upgrade cap + RP cap only.** Core/relic/rite slot/rank caps get wired to
  GM when those systems are built (Steps 9/11, relics later).
- `[x]` **GM replaces the tier component** of those formulas:
  - RP budget: `8 + tier*2 + bonus` → `8 + f(GM) + bonus` (tier term removed; crafted `runePointBonus` stays).
  - Upgrade cap: the flat `MAX_UPGRADE` driver → GM-derived ceiling (interacts with Step 6's +4/+5 extension).
  - **Intentional consequence:** a high-tier / low-GM rusher is under-capped until they farm —
    this *is* the brainstorm's catch-up mechanism, not a bug.
- `[~]` Retroactive un-cap falls out for free (GM is a live sum). Confirm at session.

**Session payload:** add a `globalMastery` derived getter (sum of `biomeLevel`); rewrite
`runeBudgetForTier` to use GM instead of tier; make the upgrade cap GM-derived; surface GM + its
"next unlock" in views for the UI step. Re-tunes existing progression — coordinate with balance (Step 15).

**⚠️ Sequencing note:** because GM replaces tier in RP (Step 5) and the upgrade cap (Step 6), GM
should land before or with those. It is the keystone of the foundation.

## Step 5 — Rune reward sourcing & RP budget

**Goal:** Re-source rune progression: Biome Mastery = basic/biome-problem conditions &
actions; Bosses = advanced/signature/reactive rune tech; Global Mastery = more runic points.

**Scope:**
- Move rune fragment unlocks onto the biome-mastery / boss reward channels.
- Wire RP cap to Global Mastery.
- Keep RP as the main constraint (no hard automation count limit unless forced).

**Depends on:** Steps 3 (biome levels), 4 (RP cap), and the existing rune system
(`docs/rune-system-*.md`).

**Current state (audited 2026-06-23):**
- Rune fragments are unlocked by **crafting rune recipes**: `runesOwned` is derived from
  `runeRecipesCrafted` (`runeIdsFromCraftedRecipes`). Starter set = `STARTER_RUNE_IDS` (free).
- `RuneRecipe` (`shared/src/runeRecipes.ts`) gates on **`requiredBossClear`** (e.g. `"forest:1"`)
  + essence `cost`. **No biome-level gating exists on runes today** — all non-starter runes are boss-gated.
- RP capacity also comes from boss-gated `increase-rune-points` recipes (`runePointBonus`).
- RP base = `runeBudgetForTier` (Step 4 moves this to GM).

**Resolved decisions (2026-06-23 Q&A):**
- `[x]` How unlocked today? → crafted recipes; **boss-gated** + essence; starter set free. No biome gating.
- `[x]` RP formula / GM? → resolved in Step 4 (GM replaces the tier term).
- `[x]` **Add biome-level gating to `RuneRecipe`** (mirror gear's `recipeGroup` + `requiredBiomeLevel`).
  **Move *some* runes onto biome-level unlocks**; **bosses keep specific/advanced rune unlocks**
  (and possibly some cores — undecided, revisit in Steps 9/13).
- `[x]` **Retire the `increase-rune-points` capacity recipes.** RP comes solely from GM. Removes a
  crafting sink; `runePointBonus` / `runePointBonusFromCraftedRecipes` become dead — clean them up.
  Pre-release, so a clean cutover is acceptable (no balance migration needed; confirm at session).
- `[x]` **Re-categorize the existing boss-gated rune recipes**: audit the list, move the basic ones
  to biome-mastery gating, keep genuinely advanced ones on bosses. Per-recipe call at session time
  with the full list in view.

**Session payload:** add `recipeGroup` + `requiredBiomeLevel` to `RuneRecipe`; re-tag basic recipes
off `requiredBossClear` onto biome gating; delete `increase-rune-points` recipes + dead RP-bonus code;
verify `runesOwned` derivation still holds once sources are mixed (biome + boss).

**⬆ Forward dependency (from Step 7):** the Abilities system needs a **new rune action** to fire
Technique/Guard abilities. Either add it here or in Step 7, but keep the rune-action catalog the owner.

---

# Build & power layer

Depends on the foundation. These are how the player turns currency into a build.

## Step 6 — Gear evolution & reconstruction

**Goal:** Lineages with branching evolved forms; evolution gated at **+3**, +5 is comfort/
premium (never mandatory, never assumed by early boss balance); direct reconstruction path
so players don't rebuild whole chains.

**Scope:**
- Lineage data model; branches as alternate evolved forms (reversible/relearnable).
- Upgrade vs evolution separation (+3 evolution-ready, +4 comfort, +5 premium).
- +5 rewards (cheaper evolution/branch-switch, partial refund, easier reconstruction, maybe
  early alternate-branch recipe). No permanent inherited combat bonus.
- Direct reconstruction recipe (lineage known + essence + catalyst, higher cost, skip chain).

**Depends on:** Steps 1–4 (esp. 4 — GM drives the upgrade cap).

**Current state (audited 2026-06-23):**
- **No evolution/lineage mechanic.** "lineage" appears only in recipe *comments* (flavor). Items
  are crafted **standalone from essence** (recipe `cost` + `requiredBiomeLevel`) — not from a predecessor.
- Upgrades: `MAX_UPGRADE = 3` (`systems/itemUpgrades.ts`); per-item cap = `upgrades.length ?? 3`.
  Upgrade cost/stat/biome-level all per-step (`UpgradeStep`). `checkUpgrade` is the shared authority.
- So +4/+5, lineages, branches, and reconstruction are all net-new.

**Resolved decisions (2026-06-23 Q&A):**
- `[x]` Evolution today? → **none.** Items are standalone crafts; cap is +3.
- `[x]` **All four slots** get lineages/evolution in this step (consistent rollout). Large content
  authoring — expect this to span more than one session in practice.
- `[x]` **Extend cap to +5 now.** `MAX_UPGRADE 3→5`, ceiling **GM-gated** (Step 4); structure =
  +3 evolution-ready / +4 comfort / +5 premium. **Note:** the actual +4/+5 *numbers* are balance
  work the user owns directly — Claude builds the structure (raise cap, GM gate, authoring slots);
  generic fallback or placeholders until the user tunes.
- `[x]` **Evolve consumes the +3 predecessor** (+ recipe + essence + catalyst); **evolved item starts
  at +0** and re-climbs. Makes +3 the meaningful gate; reconstruction path (below) is the anti-grind escape.
- `[x]` Branch switching + direct reconstruction representation → **decide at session time** with the
  lineage data model in view. (Direction from brainstorm: reconstruction = higher-cost recipe needing
  lineage-known + essence + catalyst, skipping the chain.)

**Session payload:** lineage/evolution data model (graph linking predecessor→branches, likely on
`Recipe`); raise + GM-gate the upgrade cap; evolution craft path (consume predecessor, validate +3);
+4/+5 authoring slots (placeholder numbers); reconstruction recipe shape; re-climb-from-+0 UX consideration.
⚠️ Depends on Step 4 (GM) landing first.

**⬇ Forward dependency (for Step 7):** design the lineage/evolution machinery to **generalize beyond
gear** — abilities (Step 7) will reuse it. Avoid hard-coding it to `EquipmentSlot`/item shapes.

## Step 7 — Skills rework

**Goal:** Two slots — **Technique** (offensive/enemy-facing) + **Guard** (defensive/self-
facing); **Mobility** is a tag, not a slot. Most offensive skills **arm/modify the next
attack** rather than being free casts. Skills evolve through families (behavior, not bigger
numbers). Skill recipes tie to Biome Mastery.

**Scope:**
- Slot structure (T1 = 1 Technique + 1 Guard; Guard expands cautiously, if ever).
- "Arm next attack" skill model + which effects stay separate actions (self-buff, aura, field).
- Mobility tag taxonomy.
- Skill evolution families (Sweep→Sweep II→Whirlwind/Shockwave, etc.).
- Skill recipes per biome.

**Depends on:** Step 3 (recipes), Step 5 (rune hooks for "when intervention fires").

**Current state (audited 2026-06-23) — ⚠️ NAME COLLISION:**
- The existing "skill" system is a **passive talent tree** (`skillTree/types.ts`, `systems/skills.ts`).
  `UsesSkills` = `unlockedSkills`, `selectedClass`, `selectedSubVariant`, `selectedRange`. Nodes
  unlock sequentially by tier (0 root mechanic → 1 light/balanced/heavy → **2 range close/mid/far** →
  3–7 path), applying permanent stat/`mechanicEffects` deltas. Driven by `skillPoints` + `currentSkillTier`.
- **There is NO active-ability / timed-intervention system.** The brainstorm's "skills" (Technique/
  Guard, arm-next-attack, Sweep/Brace/Execute) are **entirely new** and clash in name with the talent tree.
- **`selectedRange` already exists** (close/mid/far) — Step 9 (Cores) inherits this; range is not new.
- Runes are condition→action but currently have **no "use skill/ability" action** (nothing to fire yet).

**Resolved decisions (2026-06-23 Q&A):**
- `[x]` Current model? → passive talent tree; no active abilities; name collision.
- `[x]` **New "Abilities" system, keep the talent tree.** Build a separate active system for
  Technique/Guard interventions; the existing passive tree stays as class progression. Two distinct
  systems, no migration. (Exact name — "Abilities" working title — can finalize at session.)
- `[x]` **Auto-fire by default, runes refine.** Abilities fire automatically when ready + contextually
  sensible (Guard when threatened, Technique on cooldown); runes override/refine timing. Requires
  **default firing heuristics** + a **new rune action** ("use Technique/Guard ability") → extends Step 5.
- `[x]` **Build system + T1 ability content together** as one step deliverable (will likely span
  multiple sessions in practice). Slots: T1 = 1 Technique + 1 Guard; Mobility = a tag.
- `[x]` **Ability evolution reuses Step 6's gear-evolution machinery** (lineage + recipe + essence +
  catalyst). ⚠️ **Cross-dependency:** Step 6's evolution model must be designed to **generalize beyond
  gear** so abilities can ride it.
- `[~]` Arm-next-attack via the combat pipeline (`beforeAttack→onAttack→onHit`), armed state on
  `TracksCombat`; self-buff/aura/field stay as separate actions. Confirm exact hook at session.

**Session payload:** `Abilities` component/slots (Technique + Guard + mobility tag); armed-attack
state in `TracksCombat` + pipeline hook; auto-fire heuristics; new rune action to fire abilities
(coordinate with Step 5); T1 ability set per biome; evolution via Step 6 machinery. ⚠️ Depends on
Steps 5 and 6.

**⚠️ Design risk (added post-review):** the "arm-the-next-attack" model must work across **all 6 class
archetypes** — cadence, cooldown, dot, reload, energy, summoner. It collides with archetype-specific
attack math: reload's half-damage/double-speed final layer, summoner's minion attacks, energy's Flash
state, dot conversion. Validate the armed-attack model per archetype before authoring the full set;
expect per-archetype edge cases.

## Step 8 — Charms & recovery layers

**Goal:** Charm becomes recovery engine + recovery specialization + Guard-skill amplifier.
Formalize the recovery layer map (class baseline / charm / guard skill / armor / core /
rite / rune).

**Scope:**
- Charm slot as recovery school; preserve existing class baseline recovery rhythms.
- Charm → Guard-skill amplification hooks.
- Per-biome charm identities (existing T1 ones kept; later biomes added).

**Depends on:** Steps 6 (gear/charm slot), 7 (Guard abilities to amplify).

**Current state (audited 2026-06-23):**
- Charm = the **`recovery` equipment slot** (`EQUIPMENT_SLOTS`). Already implemented as recovery
  items: `hpRegen` stat + recovery `mechanicEffects` (e.g. `defense.kill-burst-pct` = heal-on-kill).
- **Biome charm identities already exist** (Plains = kill-burst, etc.) — the brainstorm's "old
  charm identities still work" is literally true.
- So "recovery engine + specialization" is **already built**; the net-new is the **Guard-ability amplifier**.
- ⚠️ **Naming collision:** current charm *items* are named "Plains **Core**" / "Stalwart **Core**".
  The brainstorm's new **Core** system (Step 9) reuses that word. Resolve naming before Step 9.

**Resolved decisions (2026-06-23 Q&A):**
- `[x]` Charm today? → `recovery` slot, recovery stats + biome `mechanicEffects`; identities exist.
- `[x]` Class baseline recovery (Squire/Striker/etc.)? → **strictly preserved** per brainstorm.
- `[x]` **Guard-ability amplifier = a mix, via named `mechanicEffects` keys** (e.g.
  `guard.cooldown-reduction`, `guard.potency`, `guard.extra-effect`); different charms pick different
  levers. Reuses the existing passive/`mechanicEffects` pipeline. Exact keys depend on Step 7 ability shape.
- `[x]` **Keep existing charm identities, add the amplifier dimension** (charms now do recovery *and*
  Guard amplification).
- `[x]` **Rename the "X Core" charm items in this step** to free "Core" for Step 9. New charm noun TBD
  at session (default "Charm"; or Talisman/Heart).

**Session payload:** define `guard.*` amplifier `mechanicEffects` keys (after Step 7); add amplifier
hooks to charm recipes; rename charm items off "Core"; preserve class baseline recovery untouched.
⚠️ Depends on Step 7 (Guard abilities). Hand the chosen charm noun to Step 9 so "Core" is unambiguous.

---

# New tier-gated systems

## Step 9 — Cores (T2+)

**Goal:** Role/range amplifier slot. Primary job: fix ranged-safety dominance and make
melee/bruiser/tank durable; give mid-range a real role; support party identities.

**Scope:**
- Range tags (Close/Mid/Far full-effect-only, Universal weaker, Party role-based).
- Core families per range (Bastion/Predator/Duelist; Sniper/Artillery/Skirmisher;
  Arcanist/Harbinger/Warden/Banner).
- Shallow same-tier ranks (1/2/3). No +5-style enhancement.
- Unlock ramp: T2 simple role cores → T3 range-specific evolution → T4+ morphs.

**Depends on:** build base (Steps 6–8); ties to range model. "Core" name freed by Step 8 charm rename.

**Current state (audited 2026-06-23):**
- **Range already exists**: `selectedRange` (close/mid/far), chosen at talent-tree tier 2. It already
  affects combat AI (`isRangedAutoPlayer` in `targetPriority.ts` → kiting vs melee positioning). Cores
  hook into this, not invent it.
- Equipment is **4 slots** (`weapon/armor/recovery/mobility`). No core slot exists. No core system at all.
- "Core" the *word* is currently used by charm item names → freed by Step 8's charm rename.

**Resolved decisions (2026-06-23 Q&A):**
- `[x]` Range concept exists? → **yes** (`selectedRange`, partly mechanical via combat AI).
- `[x]` **Core = a 5th equipment slot.** Add `core` to `EQUIPMENT_SLOTS` (weapon/armor/recovery/
  mobility/core); reuse existing equip/unequip/persistence/UI flow.
- `[x]` **Range gates full effect — only on match.** Close/Mid/Far cores deliver full effect only
  when `selectedRange` matches; Universal = weaker but any range; Party = role-based across ranges.
  Makes the range choice meaningful and is the lever against ranged-safety dominance.
- `[x]` Ranks (1/2/3) mechanic → **decide at session time** (recipe rank-up vs capped upgrade track).
- `[x]` **Gating = T2 tier flag + biome-mastery core recipes** (some possibly boss-granted per Step 5).
  Ramp: T2 simple role cores → T3 range-specific → T4+ morphs.

**Session payload:** add `core` to `EQUIPMENT_SLOTS` (+ `emptyEquipment`, persistence, networked keys,
UI); core data shape with a range tag + role; full-effect-on-range-match resolution (reads
`selectedRange`); T2 gate + core recipes; rank mechanic (TBD). ⚠️ Confirm "Core" name is free
(Step 8 charm rename done first).

## Step 10 — Stances (T2)

**Goal:** Persistent combat postures; free to equip; one active default; automated switching
costs runic points. Biome Mastery unlocks stance recipes; bosses unlock signature variants.

**Scope:**
- Stance as posture modifier (stat/behavior deltas).
- Default selection + rune-driven auto-switch (RP cost).
- Stance recipes via biome mastery.

**Depends on:** Step 5 (runic points for auto-switch), Step 3 (recipes).

**Current state (audited 2026-06-23):**
- **No player stance system.** "stance" appears only in flavor comments and a *monster* mechanic
  (`bestiaryMechanics.ts` — bosses flip ranged/melee mid-fight). Net-new for players.
- Stances would naturally reuse the existing `StatEffects` / `mechanicEffects` delta pipeline,
  applied while the stance is active.

**Resolved decisions (2026-06-23 Q&A):**
- `[x]` Existing stance concept? → **none** for players (monster-only flavor).
- `[x]` Stance effect model → **decide at session time** (after enumerating what Offensive/Defensive/
  Tanking/Evasive actually need — likely reuse `StatEffects`/`mechanicEffects` deltas, escalate to
  bespoke only if behavior changes are required).
- `[x]` **Auto-switch = a new rune action ("switch to stance X") with a switch cost/cooldown** to
  prevent per-tick thrashing. RP-costed in the loadout. Extends the rune-action catalog (cf. Step 5/7).
- `[~]` Storage: `ownedStances` + `activeStance`; free to equip, one active default. Confirm at session.

**Session payload:** stance data shape + effect application (model TBD); `ownedStances`/`activeStance`
state; stance recipes (biome mastery, T2 gate); new RP-costed stance-switch rune action with anti-thrash
cost. ⚠️ Another addition to the rune-action catalog — keep it coordinated with Steps 5 and 7.

## Step 11 — Rites (T3)  *(name locked: "Rites")*

**Goal:** Between-fight / long-rhythm passive behaviors (OOC regen delay, debuff decay, target
acquisition, party regroup, etc.). Naming unsettled.

**Scope:**
- Slot(s) for rites; recipes via biome mastery; GM may grant extra slots/rank caps.
- Effect catalog (Quickened Breath, Cleansing Breath, Lingering Momentum, etc.).

**Depends on:** Steps 3, 4. (Also leans on out-of-combat state machinery.)

**Current state (audited 2026-06-23):**
- **Clean OOC/between-fight machinery exists**: in-combat/out-of-combat engagement state
  (`combat/ai/engagement.ts`), OOC + in-combat regen (`defense/regen/`), `when-idle` rune condition.
  Rites can attach to these transitions. No rite/discipline system itself exists.
- Effects (reduce OOC regen delay, debuff decay, target acquisition, etc.) fit the existing
  `mechanicEffects` passive pipeline, scoped to OOC behavior.

**Resolved decisions (2026-06-23 Q&A):**
- `[x]` OOC hook exists? → **yes** (engagement state + OOC regen + `when-idle`).
- `[x]` **Name locked: "Rites."** (Brainstorm favored Rites/Disciplines over Protocols.) Use this for keys/UI/recipes.
- `[x]` Slot count + GM-gating → **decide at session time** (likely start small, GM unlocks more per
  the GM cap discussion — confirm once the catalog exists).
- `[x]` Effect model → **decide at session time** (likely reuse `mechanicEffects` scoped to OOC
  transitions; escalate to bespoke hooks only for non-stat behaviors).

**Session payload:** Rite data shape + effect application (model TBD); slot(s) at T3 (count TBD,
maybe GM-gated); rite recipes (biome mastery); attach to existing OOC/engagement transitions.

---

# Content & identity

## Step 12 — Biome identity / combat ecology

**Goal:** Each biome is a combat ecology (spawn pattern, grouping, aggro/pull, attack profile,
terrain/hazard, dungeon expression, boss exam) — not just a stat package.

**Scope (per starter biome):** Plains swarm, Forest predator packs, Swamp attrition terrain,
Mountain guarded ascent, Cave patrolled elites. Encodes new monster AI/grouping/pull behaviors.

**Depends on:** largely independent of the economy steps; feeds Step 13.

**Current state (audited 2026-06-23) — more is built than the brainstorm implies:**
- Monster AI already has: `pullRange`/`leashRange`/`wanderRadius`/idle timing, targeting modes
  (closest/lowest-hp), `chargeOnAggro` (burst speed), `dotEffect`/`slowEffect`/`aoeAttack` (splash),
  ranged **kiter** steering, `bossScript` (phases/regen/enrage/**summons**), `ultimateEncounter` (multi-stage).
- **Terrain/hazard already exists**: `NodeFeatureSpec` (`world/nodeFeatures.ts`) supports shaped zones
  with `blocksMovement` (**chokepoints**), `damage` (**poison/rot pools** = positional DoT), and
  `statusWhileInside` (**slow zones**). Swamp pools / Mountain chokepoints = authoring, not new tech.
- **Net-new AI = coordinated multi-monster behavior only:** packs (alpha + followers, follower assist,
  call-allies), **fixed patrol routes** (only random `wanderRadius` exists), swarm convergence/clustering.

**Resolved decisions (2026-06-23 Q&A):**
- `[x]` AI/terrain today? → rich; terrain via `nodeFeatures`; missing = pack/patrol/swarm coordination.
- `[x]` **Primitives first, then author.** Build reusable AI primitives once — pack/alpha-follower +
  call-allies, fixed patrol routes, swarm convergence — then author biomes on top of those + the
  existing terrain (`nodeFeatures`) and boss systems.
- `[x]` **One biome per session** (after the primitives sub-step). Each biome gets a focused session.
- `[x]` **Include advanced biomes** (Jungle/Desert/Volcanic/Tundra/Graveyard/Trench), not just starters.

**⇒ Step 12 is a multi-session PROGRAM, not one session:**
  1. AI-primitives session(s): grouping/packs (+call-allies), patrol routes, swarm convergence.
  2. One session per biome (~5 starters + ~6 advanced ≈ 11 biome sessions), each authoring spawn
     pattern / grouping / aggro-pull / attack profile / terrain features / dungeon+boss hooks.
**Session payload (primitives):** pack component (alpha↔followers, assist/call-allies), patrol-route
movement mode (vs random wander), swarm-convergence/clustering spawn+aggro behavior. Reuse `nodeFeatures`
for hazards and `bossScript` for boss expression. Track per-biome progress in the status doc.

## Step 13 — Dungeons, Guardians & Bosses as exams

**Goal:** Dungeons = conscious one-time trials; guardians = biome-specific pre-threats; bosses
= named final exams with rune-readable tells. Retarget T1 boss to ~50–60% tier prep (+3 = intended clear).

**Scope:**
- Guardian/pre-threat patterns; "alive when activated → joins/empowers" rule.
- Boss structure: core threat / add-hazard layer / 50% phase / rune-readable tell / build counter.
- One-time reward bundles (seals, recipe/signature unlocks, essence/catalyst bundles).
- T1 boss balance retarget.
- Tier complexity ramp (T1 simple → T4 multi-phase + modifiers).

**Depends on:** Step 12 (biome identity), Steps 1–2 (reward bundles), Step 5 (rune tells).
Builds on existing dungeon work (`docs/dungeon-*.md`).

**Current state (audited 2026-06-23):**
- **SUPERSEDED 2026-08-09 — the gauntlet was removed.** A dungeon is now altar + per-biome guard
  posture + boss: guardians killable pre-activation, disturbing the altar aggroes every survivor and
  wakes the boss, boss death starts the altar cooldown. No waves, no per-dungeon bonus hooks. All 26
  dungeons generate from `BIOME_GUARD_POSTURE`. Live state: `docs/dungeon-current-state.md`.
- Boss expression: `bossScript` (phases/regen/enrage/summons), `ultimateEncounter`. First-clear state
  persists via `TracksProgression.bossesCleared`; `requiredBossClear` already gates recipes.
- Rune tells: **`target-casting` rune condition already exists** (T4, telegraphed cast window).

**Resolved decisions (2026-06-23 Q&A):**
- `[x]` Gauntlet shipped? → designed + Mountain pilot; verify propagation at session.
- `[x]` **Boss authoring folds into Step 12's per-biome sessions.** Step 13 becomes a **shared
  scaffolding sub-step** built once: the boss-exam 5-part template, reward-bundle mechanism, tell
  conditions, and the structural boss-access gating (below). Each biome then authors its boss to fit.
- `[x]` **Add rune tell conditions as needed** — `target-casting` covers cast windows; author new
  conditions (boss-summoning-adds, arena-hazard-high, etc.) per boss when the existing one can't
  express the tell. Grows the rune condition catalog incrementally.
- `[x]` **Reward bundle composition → decide at session time** (with the economy from Steps 1–2 in
  place). Mechanism: one-time grant keyed off `bossesCleared`; likely seal + recipe/signature unlock +
  essence + **catalyst** bundle.
- `[x]` **T1 boss retarget needs STRUCTURAL change, not just balance.** Hitting "+3 = intended clear,
  ~50–60% prep" likely requires gating boss access behind broader engagement (multiple tools/biome
  mastery), not only tuning numbers. Design this in Step 13's scaffolding; numeric tuning still lands
  in Step 15.

**⇒ Step 13 structure:** (1) shared scaffolding session — exam template, reward bundles, tell-condition
mechanism, boss-access gating; (2) per-biome boss authoring distributed into Step 12's biome sessions.

---

# Cross-cutting (last)

## Step 14 — UI / clarity / failure diagnosis

**Goal:** Make the now-deeper systems legible. Biome identity summary, recipe-unlock
visibility, catalyst progress, pinned recipe/wishlist, boss seal progress, GM next unlock,
death/failure diagnosis with suggested answers, build-mismatch & rune hints.

**Depends on:** the systems it surfaces (rolls up after they exist).

**Current state (audited 2026-06-23):**
- **Death-cause telemetry already exists**: `PlayerDeathPayload` carries a typed `DeathCause`
  (`shared/src/protocol/death.ts`) with label/log formatters. Failure diagnosis builds on this.
- Mobile HUD shell is in progress (portrait-first shell done; panel internals still desktop-styled —
  per project memory). New panels should align with that shell.

**Resolved decisions (2026-06-23 Q&A):**
- `[x]` **MVP = (a) new-system visibility** — catalyst progress, recipe-unlock visibility, Global
  Mastery next-unlock — **and (b) boss seal / exam info** — seal progress + dungeon/boss tell visibility.
  Rationale: players must *see* the new economy/progression to engage it.
- `[x]` **Deferred to later** (not this rework's MVP): **failure/death diagnosis** and **planning aids**
  (pinned recipe/wishlist, build-mismatch hints, rune suggestion hints). Note: the brainstorm flagged
  failure diagnosis highest-value; the user reprioritized to system-visibility first.
- `[x]` Failure-diagnosis depth → **decide at session time** (when it's eventually built; `DeathCause`
  is the foundation to enrich).
- `[x]` Panel housing → **decide at session time** depending on how far the mobile HUD redesign has progressed.

**Session payload:** catalyst/recipe/GM visibility surfaces (read from `TracksProgression` + new
catalyst fields); boss seal progress + tell visibility. Failure diagnosis + planning aids = later pass.

## Step 15 — Balance + simulation tooling pass

**Goal:** Update sim/reporting for the new systems and run the implied balance pass (biome XP,
essence rates, catalyst costs, item/upgrade/evolution costs, T1 boss around +3, tier advancement
around multiple seals).

**Depends on:** everything. Ongoing, but the formal pass is last.

**Current state / workflow (known):**
- Established preference: **the user tunes balance numbers directly; Claude supports tooling** (do not
  use Claude for pure numerical balance passes). Tools today: `bench:balance` TUI, `dps-report`,
  `tools/monster-ref.ts` (new), planned **eHP report tool**.
- New systems that the sim/reporting must learn: catalysts (Step 2), Global Mastery caps (Step 4),
  the +5 cap (Step 6), Abilities (Step 7), Cores/range-matching (Step 9), stances/rites modifiers.

**Resolved decisions (2026-06-23 Q&A):**
- `[x]` **Update all four tooling areas:**
  - **dps-report + eHP report** — account for Cores (range-matching), Abilities, stances, +5 cap.
  - **Balance TUI (bench)** — combat sims include the new combat-affecting systems.
  - **New economy/progression sim** — model essence+catalyst income vs recipe/upgrade/evolution
    costs, Global Mastery growth, time-to-+3/+5. *The economy is the biggest untested surface.*
  - **monster-ref / bestiary tooling** — new biome-identity AI (packs/patrols) + boss-exam structure.
- `[x]` **Division of labor: Claude builds/updates the tooling; the user does all numeric tuning** in
  the data files. (Established balance-workflow preference.)

**Session payload:** extend the sim/report tools per the new systems; build the economy/progression sim.
Hand tuned levers to the user. This is the last formal pass but tooling can be updated incrementally as
each system lands.

---

# Parked (explicitly later, per the brainstorm)

```text
Relics (T4+)          — direction planned separately; not designed here.
Map traversal         — known unresolved problem; no solution committed.
World events          — biome affixes, roaming bosses/patrols, timed events.
Group content         — group dungeons, shared zones, role checks.
```

Baseline rule preserved: solo-complete, party-incentivized, group content optional/parallel.

---

# Integration deliverables (assembled from the steps above)

These are not separate steps but the concrete payloads the steps produce, per the brainstorm's
"Concrete Next Work":

- **T1 content package** — per biome: identity, 2–3 enemy types, guardian pattern, boss
  mechanic, weapon/armor/charm/boots, Technique + Guard skill, 1–2 rune unlocks, catalyst name,
  biome mastery reward layout.
- **T2 content package** — same, plus cores and basic stances.

---

# Red-team checklist (carry through every step)

```text
Can players still rush one biome?            Does +5 become secretly mandatory?
Does catalyst pressure become annoying?      Are old biomes useful or tedious?
Are melee cores mandatory not interesting?   Does the UI explain enough?
Do skills make gear feel irrelevant?         Does the reward map create currency bloat?
Do dungeons feel like exams or chores?       Are ranged builds still too safe?
                                             Does mid-range have a real reason to exist?
```
