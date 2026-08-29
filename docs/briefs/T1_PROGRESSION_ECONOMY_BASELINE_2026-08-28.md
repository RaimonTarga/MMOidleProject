# T1 Progression Economy Baseline
**Date:** 2026-08-28
**Purpose:** Source-of-truth extraction of the current Tier 1 progression/economy, for the upcoming economy redesign session. This is an audit, not a balance patch. No gameplay numbers were changed to produce this document.

**Method:** Five parallel research passes read live source directly (not docs/comments) and reported findings with `file:line` citations. This document compiles and cross-references those passes and adds a coherence audit on top. Every claim is tagged:
- **SOURCE FACT** — found directly in code, citation given
- **DERIVED** — computed from SOURCE FACTs (e.g. summed upgrade costs); may carry rounding/assumption risk, flagged where relevant
- **DESIGN/ECONOMY CONCERN** — a diagnostic observation, not a proposed fix
- **UNKNOWN / NEEDS DESIGN DECISION** — searched, not resolvable from source alone

Where a live-code fact contradicts CLAUDE.md, an old report, or a route comment, both are reported and the **live value is treated as current truth**. Two such contradictions were found and are flagged prominently in §1 and §3.

---

## 1. Executive Summary

- T1 spans five biomes farmed in a fixed order — **Forest, Mountain, Plains, Swamp, Cave** in the live biome database (`shared/src/biomeDatabase.ts:72-168`), farmed by canonical bot routes in the order **Plains → Forest → Swamp → Mountain → Cave** (`bot/src/routes/t1RouteBuilder.ts:15-21`) — and ends in a fixed boss gauntlet fought in the order **Plains, Forest, Mountain, Swamp, Cave** (`t1RouteBuilder.ts:23-29`), which is neither the DB order nor the progression order. Three different "T1 biome order" concepts exist simultaneously in the live system; see §8.
- **CLAUDE.md is stale on the biome level cap.** It documents 4 levels/tier; live code (`shared/src/config/gameConfig.ts:232`) caps at **6**, per an explicit "expanded 4→6" migration comment. This document uses 6 throughout. Flagged as a doc-fix action item, not a balance question.
- The RP-by-GM formula (`8 + floor(GM/10)`) and the specific GM/RP checkpoints claimed in `docs/t1-route-normalization-handoff-2026-08-28.md` were independently verified against live code and are **correct** (`shared/src/runeDatabase.ts:739-755`).
- **Catalysts have supply but no T1 demand.** The catalyst accrual system is fully live and active during ordinary T1 farming (any kill on a modifier-bearing node grants catalyst progress), but **zero T1 recipes across all five biomes spend a catalyst** — catalyst cost fields only start appearing at T2 (§6). T1 catalyst stockpiles accumulate for a system players don't touch until they leave T1.
- **Route gear demand is not resource-symmetric across biomes.** The Slinger canonical route never crafts a Cave weapon (no `chaotic-axe`), so it spends far less red essence than the other five canonical routes even though the player must fully level Cave and beat its boss regardless of class (§7, §9). This is a quantified asymmetry to validate with real playtime/pacing data (§10), not a defect established by the cost table alone.
- Six canonical + two Brace-tank experimental T1 bot routes exist and are code-generated from one shared builder (`makeT1Route`) plus a small per-class gear-plan diff — this is a stronger, more centralized architecture than the normalization handoff document (written the same day) suggests still needs building; see §8's note reconciling the two documents.

---

## 2. Progression Gate Timeline

### 2.1 Core formulas (all SOURCE FACT)

| Mechanic | Formula | Source |
|---|---|---|
| Biome XP to reach level *n* (cumulative) | `round(25 × n^2.8)` | `gameConfig.ts:143-199` (`BIOME_XP_BASE=25`, `BIOME_XP_EXPONENT=2.8`) |
| Biome level cap at T1 | `playerTier × 6 = 6` (Clearing fixed at 4) | `gameConfig.ts:232, 256-263` |
| Global Mastery (GM) | sum of every non-`clearing`/`sanctuary` biome level | `gameConfig.ts:286-291` |
| Max GM at tier 1 | `30` (sum of 5 biome caps of 6) | `gameConfig.ts:302-309`, tested at `itemUpgrades.test.ts:44` |
| Item upgrade GM gate (tier-1 items) | `+1@GM6, +2@GM12, +3@GM18, +4@GM24, +5@GM30` | `itemUpgrades.ts:21-31` |
| Item upgrade biome-level gate | per-item, from each recipe's own `upgrades[]` array (not a generic formula for T1 items — all T1 recipes author explicit `requiredBiomeLevel` per step) | `itemUpgrades.ts:79-84`, recipe files |
| Runic Point budget | `8 + floor(GM / 10)` | `runeDatabase.ts:739-755` |

**Biome XP table (DERIVED from the formula above):**

| Level | Cumulative XP | Increment |
|---|---|---|
| 1 | 25 | 25 |
| 2 | 174 | 149 |
| 3 | 542 | 368 |
| 4 | 1,176 | 634 |
| 5 | 2,117 | 941 |
| 6 | 3,402 | 1,285 |

Note: the doc-comment example inside `gameConfig.ts:187-192` uses stale constants that don't match the live formula — the code, not its own comment, is authoritative here.

**RP checkpoints (SOURCE FACT, cross-checked against the normalization handoff's claims — all confirmed correct):**

| GM | RP budget |
|---|---|
| 20 (Mountain L2, per handoff) | 10 |
| 21 (Mountain L3, per handoff) | 10 |
| 30 (all T1 biomes maxed) | 11 |

### 2.2 Player tier gates

- **T0 → T1**: quest `tier-0`, "First Blood" — kill 10 `tiny-slime` in Clearing (`shared/src/quests/questDatabase.ts:28-35`). Advancement executed by `advanceTier` (`server/src/systems/player/progression/questSystem.ts:17-30,46-66`): `playerTier += 1`, `skillPoints += 1`. This is the only tier transition still gated by a kill-quest.
- **T1 → T2**: **not** a quest gate. Gated by "seals" — first-time boss kills. `SEALS_REQUIRED_BY_TIER[1] = 2 of 5` (`shared/src/systems/tierAdvancement.ts:33-42`) — a player needs to clear **2 of the 5 T1 dungeon bosses** (one per biome) to advance out of T1, not all 5.
- **No explicit class-selection gate was found in code.** Class choice appears to be an emergent effect of the skill-point economy (first skill point is granted only on T0→T1 advance), not a directly coded gate — flagged **UNKNOWN / inference only**, `questSystem.ts:23` and surrounding files.

### 2.3 T1 biome roster (SOURCE FACT, `biomeDatabase.ts:72-168`)

| Biome | Mob density | T1 boss |
|---|---|---|
| Forest | 36 | `gnarled-greatbear` |
| Mountain | 24 | `crag-behemoth` |
| Plains | 48 | `tusked-razorback` |
| Swamp | 20 | `grave-toadeater` |
| Cave | 16 | `obsidian-broodmother` |

All five share the identical level-cap formula (6) and XP curve; only mob density and boss roster differ per-biome at the data level — this is the DB's own storage order, distinct from the two route orders discussed in §1 and §8.

### 2.4 Clearing (tutorial)

- Level cap fixed at 4 regardless of player tier (`gameConfig.ts:257`).
- Grants 4 fixed-power items, all with `upgrades: []` — permanently un-upgradeable "literacy gear" (`shared/src/data/recipes/clearing.recipes.ts:4-54`): `primordial-club` (weapon, lvl1), `clearing-vest-t1` (armor, lvl2), `clearing-charm-t1` (recovery, lvl3), `clearing-boots-t1` (mobility, lvl4).
- Monster: `tiny-slime` ("Tiny Wisp"), 22 HP, 43 biome XP/kill (`shared/src/data/monsters/tutorial.ts:5-11`).

### 2.5 Unlock timeline (chronological, SOURCE FACT)

| Stage | Unlock | Category | Biome / gate | Source |
|---|---|---|---|---|
| 0 | Clearing set (4 items) | item recipe | Clearing L1-4 | `clearing.recipes.ts` |
| 0→1 | Class selection (inferred) | gate | 1st skill point on T0→T1 | `questSystem.ts:23` |
| 1 | T1 dungeon access | tier gate | `playerTier ≥ 1` | `advanceTier`, `tierAdvancement.ts` |
| Plains L1-6 | Iron Broadsword, Survivor's Robe, Plains Stone, Fleet Boots + upgrades | item recipe/upgrade | Plains | `plains.recipes.ts` |
| Plains L3 | Sweep | Technique | Plains | `abilityRecipes.ts:44-54` |
| Forest L1-6 | Flash Rapier, Shaded Bindings, Heartroot Amulet, Sprinter Wraps + upgrades | item recipe/upgrade | Forest | `forest.recipes.ts` |
| Forest L3 | Second Wind | Guard | Forest | `abilityRecipes.ts:55-65` |
| Forest L2 | Out of Combat, Reload Safely | Rune | Forest | `runeRecipes.ts:42-65` |
| Forest L3 | Ready Execution | Rune | Forest | `runeRecipes.ts:66-77` |
| Forest L4 | Focus Highest HP | Rune | Forest | `runeRecipes.ts:78-89` |
| Swamp L1-6 | Poison Dagger (`ashbrand-blade`), Arcane Wrappings, Murk Eye, Marsh Treads + upgrades | item recipe/upgrade | Swamp | `swamp.recipes.ts` |
| Swamp L2 | Avoid Hazards | Rune | Swamp | `runeRecipes.ts:102-113` |
| Swamp L3 | Cleanse | Guard | Swamp | `abilityRecipes.ts:66-76` |
| Mountain L1-6 | Heavy Hammer, Fallen Knight Plate, Granite Barrier, Iron Treads + upgrades | item recipe/upgrade | Mountain | `mountain.recipes.ts` |
| Mountain L2 | Step Back | Rune | Mountain | `runeRecipes.ts:150-161` |
| Mountain L3 | Brace | Guard | Mountain | `abilityRecipes.ts:77-87` |
| Mountain L3 | Orbit (Keep Distance) | Rune | Mountain | `runeRecipes.ts:162-173` |
| Mountain L5 | Power Strike | Technique | Mountain | `abilityRecipes.ts:88-99` (not used by any T1 canonical route — see §8) |
| Cave L1-6 | Chaotic Axe, Bestial Hide, Pulse Stone, Bat Wing Boots + upgrades | item recipe/upgrade | Cave | `cave.recipes.ts` |
| Cave L2 | HP Below 25%, Careful Pulling | Rune | Cave | `runeRecipes.ts:90-101,126-137` |
| Cave L3 | Recover First (Wait for Regen), Expose Weakness | Rune / Technique | Cave | `runeRecipes.ts:138-149`, `abilityRecipes.ts:100-110` |
| Boss gauntlet | 2 of 5 T1 boss clears required | tier gate | all 5 | `tierAdvancement.ts:33-42` |

**Timing flag:** Power Strike (Mountain L5, blue190) is the only T1 Technique recipe not used by any canonical route — every route keeps Sweep through the Mountain leg and only swaps to Expose Weakness at Cave. This is either dead content or an intentionally-unused optional branch; flagged **UNKNOWN / NEEDS DESIGN DECISION**.

---

## 3. Complete T1 Cost Table

All figures SOURCE FACT unless noted; `upgrades[]` arrays are authored per-item, not generic — no T1 recipe falls back to the generic formula in `itemUpgrades.ts`. **No T1 recipe anywhere carries a catalyst cost** (confirmed by full reads of all five biome recipe files) — catalysts enter the cost model at T2 (e.g. `core-tempered`, `plains.recipes.ts:218-227`).

### Plains (yellow essence)
| Item | Base | +1 | +2 | +3 | +4 | +5 | Total→+5 |
|---|--:|--:|--:|--:|--:|--:|--:|
| Iron Broadsword (weapon) | 10 | 20 | 30 | 60 | 60 | 60 | 240 |
| Survivor's Robe (armor) | 20 | 30 | 60 | 120 | 120 | 120 | 470 |
| Plains Stone (recovery) | 10 | 12 | 24 | 48 | 48 | 48 | 190 |
| Fleet Boots (mobility) | 10 | 10 | 20 | 40 | 40 | 40 | 160 |

### Forest (green essence)
| Item | Base | +1 | +2 | +3 | +4 | +5 | Total→+5 |
|---|--:|--:|--:|--:|--:|--:|--:|
| Flash Rapier (weapon) | 20 | 30 | 60 | 120 | 240 | 480 | 950 |
| Shaded Bindings (armor) | 20 | 30 | 60 | 120 | 120 | 120 | 470 |
| Heartroot Amulet (recovery) | 15 | 15 | 30 | 60 | 60 | 60 | 240 |
| Sprinter Wraps (mobility) | 10 | 10 | 20 | 40 | 40 | 40 | 160 |

### Swamp (purple essence)
| Item | Base | +1 | +2 | +3 | +4 | +5 | Total→+5 |
|---|--:|--:|--:|--:|--:|--:|--:|
| Poison Dagger / `ashbrand-blade` (weapon) | 22 | 30 | 60 | 120 | 120 | 120 | 472 |
| Arcane Wrappings (armor) | 22 | 30 | 60 | 120 | 120 | 120 | 472 |
| Murk Eye (recovery) | 18 | 15 | 33 | 63 | 63 | 63 | 255 |
| Marsh Treads (mobility) | 18 | 10 | 22 | 42 | 42 | 42 | 176 |

### Mountain (blue essence)
| Item | Base | +1 | +2 | +3 | +4 | +5 | Total→+5 |
|---|--:|--:|--:|--:|--:|--:|--:|
| Heavy Hammer (weapon) | 22 | 30 | 66 | 126 | 126 | 126 | 496 |
| Fallen Knight Plate (armor) | 22 | 30 | 66 | 126 | 126 | 126 | 496 |
| Granite Barrier (recovery) | 18 | 15 | 33 | 63 | 63 | 63 | 255 |
| Iron Treads (mobility) | 18 | 10 | 22 | 42 | 42 | 42 | 176 |

### Cave (red essence)
| Item | Base | +1 | +2 | +3 | +4 | +5 | Total→+5 |
|---|--:|--:|--:|--:|--:|--:|--:|
| Chaotic Axe (weapon) | 26 | 30 | 66 | 126 | 126 | 126 | 500 |
| Bestial Hide (armor) | 22 | 50 | 100 | 150 | 150 | 150 | 622 |
| Pulse Stone (recovery) | 18 | 15 | 33 | 63 (no stat gain) | 63 | 63 | 255 |
| Bat Wing Boots (mobility) | 18 | 10 | 22 | 42 | 42 | 42 | 176 |

### Techniques / Guards (`shared/src/abilityRecipes.ts`) — single essence cost, no catalyst field
| Ability | Kind | Gate | Cost |
|---|---|---|---|
| Sweep | Technique | Plains L3 | yellow 160 |
| Second Wind | Guard | Forest L3 | green 150 |
| Cleanse | Guard | Swamp L3 | purple 150 |
| Brace | Guard | Mountain L3 | blue 150 |
| Power Strike | Technique | Mountain L5 | blue 190 (unused by canonical routes) |
| Expose Weakness | Technique | Cave L3 | red 150 |

### Runes used by canonical routes (`shared/src/runeRecipes.ts`) — essence only, no catalyst field
| Rune | Gate | Cost |
|---|---|---|
| Avoid Hazards | Swamp L2 | purple 90 |
| Step Back | Mountain L2 | blue 180, yellow 80 |
| Orbit (Keep Distance) | Mountain L3 | blue 180, yellow 80 |
| Recover First (Wait for Regen) | Cave L3 | red 140, green 100 |

`avoid-hazards` and `step-back` are explicitly `craftRune` steps in the route ledgers (§7); `wait-for-regen` appears in every route's final Rune configuration but **no explicit craft step for it was found in the route ledger extraction** — flagged **UNKNOWN**, needs direct verification of whether `wait-for-regen` (and the base `auto-path-enemy`/`chase-enemy` rules) are free/default rules versus recipes the route silently craft-skips. Six other T1 runes exist (Out of Combat, Reload Safely, Ready Execution, Focus Highest HP, HP Below 25%, Careful Pulling, Flee) but are not used by any of the 8 canonical/experimental routes — out of scope for the route ledgers in §7 but present in the full cost table above's timeline (§2.5).

### Guards / Rites — not a T1 system
`shared/src/stanceRecipes.ts` (combat Stances: Offensive/Defensive/Tanking etc.) and `shared/src/riteRecipes.ts` (Rites) contain **zero T1 entries** — both systems start at tier 2/3. If "Guard" in this document's scope was meant to include the Stance system, note that Second Wind/Cleanse/Brace (the things routes call "Guard") are `AbilityRecipe`s, a different data system from `StanceRecipe`s. **DESIGN/ECONOMY CONCERN**: this is a naming collision worth resolving before the redesign session — "Guard" is used informally for two different underlying systems.

### Reconstruction/evolution
No T1 recipe has `evolvesFrom`/`reconstructCost` — the first evolution point in any lineage is its own T2 recipe (e.g. `gale-needle` evolves from `flash-rapier`, `forest.recipes.ts:112-128`). T1 is a pure linear +1..+5 track with no branching.

---

## 4. Reward / Resource Supply Table

Reward shape: `{ essence, essenceType, level, biomeXp?, catalystWeight?, catalystBundle? }` (`shared/src/data/monsters/types.ts:390-406`). **No T1 normal monster sets `catalystWeight` explicitly** — it defaults to the monster's own `essence` value (`server/src/systems/player/progression/rewards.ts:206-207`). Only the five T1 bosses set `catalystBundle: 5` (a one-time grant on first clear).

### Plains (yellow)
| Monster | Essence | Biome XP |
|---|--:|--:|
| Field Hare (`plains-slime`) | 2 | 10 |
| Boar | 3 | 18 |
| Prairie Yearling (T2, pack-only) | 3 | 18 |
| Prairie Wolf (T2) | 6 | 35 |
| Stampede Bull (T2) | 7 | 40 |
| Savanna Hawk (T2) | 7 | 38 |

### Forest (green, one exception)
| Monster | Essence (type) | Biome XP |
|---|--:|--:|
| Moss Rat (`forest-slime`) | 3 (green) | 18 |
| Wolf | 4 (green) | 25 |
| Young Wolf (pack-only) | 2 (green) | 12 |
| Ancient Wolf (T2) | 8 (green) | 45 |
| Dire Whelp (T2, pack-only) | 3 (green) | 20 |
| Ironclaw Badger (T2, `ironwood-golem`) | 10 (**blue**) | 58 |
| Thorn Spitter (`canopy-sprite`, T2) | 9 (green) | 50 |

### Swamp (purple, one exception)
| Monster | Essence (type) | Biome XP |
|---|--:|--:|
| Mire Ooze (`bog-slime`) | 5 (purple) | 35 |
| Mud Toad | 6 (**green**) | 42 |
| Swamp Hydra (T2) | 12 (purple) | 68 |
| Bog Witch (T2) | 11 (purple) | 62 |
| Mire Stalker (T2) | 13 (purple) | 75 |

### Mountain (blue, one exception at T1-adjacent)
| Monster | Essence (type) | Biome XP |
|---|--:|--:|
| Cliff Hopper | 6 (**yellow**) | 42 |
| Ridge Archer | 8 (blue) | 52 |
| Granite Titan (T2) | 14 (blue) | 80 |
| Stone Eagle (T2) | 12 (blue) | 68 |
| Peak Archer (T2) | 13 (blue) | 75 |

### Cave (red, one exception at T2)
| Monster | Essence (type) | Biome XP |
|---|--:|--:|
| Cave Lurker | 10 (red) | 70 |
| Cave Brute (elite) | 13 (red) | 90 |
| Giant Spider (T2, elite) | 15 (red) | 85 |
| Cave Troll (T2, elite) | 23 (red) | 145 |
| Cave Gargoyle (T2, elite) | 18 (**blue**) | 100 |

### T1 bosses (all lvl 5, all `catalystBundle: 5`)
| Boss | Biome | Essence (type) | Biome XP |
|---|---|--:|--:|
| Tusked Razorback | Plains | 100 (yellow) | 150 |
| Gnarled Greatbear | Forest | 100 (green) | 150 |
| Crag Behemoth | Mountain | 105 (blue) | 158 |
| Grave Toadeater | Swamp | 100 (purple) | 150 |
| Obsidian Broodmother | Cave | 110 (red) | 165 |

Boss `catalystBundle` fires only on the player's **first** clear of that biome's boss, and only if the node carries a modifier (`rewards.ts:229-237`).

### Quests
T1-relevant quests (`shared/src/quests/questDatabase.ts`) are `tier-0` (kill 10 Tiny Wisps) and `tier-1` (kill any one T1 dungeon boss). **`QuestDefinition` carries no reward fields at all** (no essence/XP/catalyst) — quests are pure gates, not a resource-supply source.

### DESIGN/ECONOMY CONCERN — off-color rewards
Every T1 biome has at least one monster rewarding a **different** essence color than its biome's nominal color (Forest's Ironclaw Badger → blue; Swamp's Mud Toad → green; Mountain's Cliff Hopper → yellow; Cave's Cave Gargoyle → blue). This is likely intentional light cross-color bleed, but it means "farm biome X for color X" is not strictly true — flag as a fact the designer should be aware of when reasoning about color scarcity.

### Rewards/hour — cannot be derived statically
Deriving essence/catalyst/XP per hour requires simulating spawn density × kill time × concurrent-attacker curve, none of which resolve to a closed formula in source (damage from a pull is explicitly non-linear in attacker count per `nodeModifiers.ts:125-133`). **This document does not attempt that derivation** — see §10 for what a runtime run should measure instead.

---

## 5. Catalyst System Audit

### 5.1 Live mechanics (all SOURCE FACT)

- **Families**: exactly the 5 node-modifier families — `alacrity`, `heavy`, `swarming`, `dominion`, `fortified` (`shared/src/world/nodeModifierTypes.ts:17-22`, comment: "one catalyst per modifier"). There is no separate catalyst taxonomy from the modifier system.
- **Family selection is modifier-based, not biome-based.** `NODE_MODIFIERS[nodeId]?.modifier` (`rewards.ts:201-204`) determines which catalyst a kill grants, "regardless of biome." Each biome has one statistically **native** modifier (`NATIVE_MODIFIER`, `nodeModifierTypes.ts:60-78`: Forest→alacrity, Mountain→heavy, Swamp→fortified, Cave→dominion, Plains→none), plus a ban table (`MODIFIER_BANS`, `nodeModifierTypes.ts:51-57`: Forest bans heavy, Mountain bans alacrity at T1) — but this only biases which modifier is *likely* underfoot in a biome, it never restricts which catalyst family a specific node produces.
- **Accrual is threshold-based, not chance-based.** Every qualifying kill adds `catalystWeight` to a running per-family total (`grantCatalystProgress`, `rewards.ts:44-58`); crossing `CATALYST_PROGRESS_PER_UNIT = 100` (`gameConfig.ts:158`) mints one catalyst, remainder carries over.
- **Zero-modifier nodes grant zero catalyst progress** — Clearing, the test room, and (via `isModifierExcludedNode`, `nodeModifiers.ts:421-429`) dungeon/boss nodes and sanctuary nodes are excluded. Boss `catalystBundle` is the one exception, granted flatly.
- **Modifier magnitude is tiny at T1.** `MODIFIER_MAGNITUDE_BY_TIER` = 0.05 at T1, scaling to 0.2 at T4 (`nodeModifiers.ts:93-98`) — every modifier's stat/reward effect is deliberately near-imperceptible at T1.
- **Reward multiplier by modifier at T1** (`modifierRewardMult`, `rewards.ts:301-309`; applies identically to essence, biome XP, and catalyst progress):

| Modifier | Reward mult (T1) | Spawn/population | Other levers |
|---|---|---|---|
| alacrity | ×1.05 | unchanged | faster attack/cooldown/move on monsters |
| heavy | ×1.04 | unchanged | bigger, slower hits |
| swarming | ×1.01 | **×1.08 population** | reward mult deliberately near-zero — "already pays more per hour by providing more bodies" |
| dominion | ×1.10 (highest) | ×0.95 (fewer, tougher) | HP/plating/attack all up ~5-10% |
| fortified | ×1.06 | unchanged | plating ×1.10, incoming damage ×0.95 (pure time-to-kill tax) |

`swarming` is the only modifier with a static population/spawn-rate change; the others reshape monster stats or flat reward, not kill rate — meaning their true rewards/hour impact is not resolvable without simulation (§10).

### 5.2 Catalyst family × recipe demand matrix

**Reading this table:** catalyst family is determined by a node's assigned **modifier**, not by its biome (§5.1) — a biome is never itself "the source" of a catalyst family. The "biomes whose nodes may carry this modifier" column below lists which biomes are legal hosts for that modifier per the ban table (`MODIFIER_BANS`), with the biome's statistical "native" modifier noted where one exists; it is not a biome-to-catalyst mapping, and any biome not excluded by a ban can produce that family on the node(s) that happen to carry it.

| Catalyst family | T1 recipes requiring it | T1 canonical-route demand | Biomes whose nodes may carry this modifier | Accessibility |
|---|---|---|---|---|
| alacrity | **none** | 0 | Forest (native), Plains, Swamp, Cave (Mountain banned) | supply-only, unused at T1 |
| heavy | **none** | 0 | Mountain (native), Plains, Swamp, Cave (Forest banned) | supply-only, unused at T1 |
| swarming | **none** | 0 | Plains, Forest, Swamp, Mountain, Cave (no bans found; no native biome) | supply-only, unused at T1 |
| dominion | **none** | 0 | Cave (native), Plains, Forest, Swamp, Mountain (no bans found) | supply-only, unused at T1 |
| fortified | **none** | 0 | Swamp (native), Plains, Forest, Mountain, Cave (no bans found) | supply-only, unused at T1 |

**No recipe-centric matrix is meaningful for T1** — every cell would read "no catalyst requirement, no earliest-supply constraint" because zero T1 recipes carry a catalyst cost (§3). This is the single largest catalyst finding for this tier.

### 5.3 Catalyst findings

- **DESIGN/ECONOMY CONCERN — supply/demand inversion.** The full catalyst-accrual machinery (weight accumulation, 100-unit threshold, per-family bundles) is live and actively running throughout ordinary T1 play, but has literally nothing to spend on until T2. Every T1 hour a player spends farming a modifier-bearing node is quietly stockpiling 5 separate catalyst-family counters that sit idle until the player leaves T1. Whether this is intended ("catalysts are a T2+ economy, T1 is essence-only by design") or an oversight (a designer may have meant some T1 recipe to consume catalysts and it was never wired) is a genuine **NEEDS DESIGN DECISION**.
- **DESIGN/ECONOMY CONCERN — dungeon/boss nodes are catalyst-dead zones.** `isModifierExcludedNode` zeroes catalyst progress on dungeon nodes. Combined with the point above, a player who only farms bosses/dungeons for XP efficiency accrues **zero** catalyst progress the entire tier, while a player who farms open nodes accrues a large, currently-unusable stockpile. If catalysts become T1-relevant later, farming-style choice would suddenly matter a lot more than it currently does.
- **Exact per-node modifier assignment is UNKNOWN** — which specific T1 node IDs carry which modifier lives in map/registry data (`shared/src/world/map/registry.ts` and region files) that was not fully read in this pass. The lookup *mechanism* is confirmed; the concrete assignment (e.g. "which Cave nodes are dominion vs fortified") was not extracted. Needed before any 1× validation run can report which catalyst families a given route actually banked.

---

## 6. Canonical Class-Route Economic Demand

### 6.1 Architecture note

The 8 controlled routes (`bot/src/routes/index.ts:36-45`, `T1_CONTROLLED_ROUTE_IDS`) are **not** hand-authored step lists. All 8 are generated by one function, `makeT1Route()` (`bot/src/routes/t1RouteBuilder.ts:260-301`), from: a shared opening (Clearing) → a loop over `T1_PROGRESSION_ORDER = [plains, forest, swamp, mountain, cave]` → a fixed boss loop over `T1_BOSS_ORDER = [plains, forest, mountain, swamp, cave]`. The only true per-class content is: `classRoot`, `movementProfile` (`melee-chase` | `ranged-orbit`), `bossDefenseProfile` (`dodge-counterplay` | `brace-tank`), a per-biome gear plan (`t1GearPlans.ts`), and boss armor selection. Ability/Guard learn order and Rune-rule construction are identical code paths for all 8 routes.

**Route registry integrity — confirmed clean.** `T1_CONTROLLED_ROUTE_IDS` contains exactly the 8 intended routes; a semantic test (`t1Routes.semantic.test.ts:222-243`) programmatically asserts no V2/HeavyHammer/MurkEyeOnly/LetDotsFinish route id can appear in that list. This directly closes the registry-drift risk the normalization handoff flagged as a concern.

### 6.2 Shared spine (identical structure, all 8 routes)

1. Travel to Clearing → farm until `playerTier ≥ 1` → choose class → craft/equip 4 Clearing items.
2. Plains: gear plan → **learn Sweep** (Plains L3) → max biome (L6).
3. Forest: gear plan → **learn Second Wind** → max biome.
4. Swamp: gear plan → craft `Avoid Hazards` rune → **learn Cleanse** (replaces Second Wind) → max biome.
5. Mountain: gear plan → **profile branch** (see 6.3) → max biome.
6. Cave: gear plan → **learn Expose Weakness** (replaces Sweep) → max biome.
7. Boss gauntlet, fixed order Plains/Forest/Mountain/Swamp/Cave: equip boss loadout → set Technique/Guard → configure final Rune set → attempt (max 6 attempts) → milestone.

### 6.3 Mountain-leg branch

- **`dodge-counterplay`** (6 non-Brace routes): craft `Step Back` rune (Mountain L2) → **if `ranged-orbit`**: craft `Orbit` rune (Mountain L3), swap `chase-enemy` for `orbit` in the final Rune set.
- **`brace-tank`** (Striker/Squire Brace only): learn `Brace` (Mountain L3, replaces Second Wind in the Guard slot) → **never crafts Step Back**. Code hard-throws if `ranged-orbit` + `brace-tank` are combined — no ranged Brace route exists or can exist as currently built.

### 6.4 Boss Technique/Guard matrix (SOURCE FACT, `t1RouteBuilder.ts:104-122`)

| Boss (fight order) | Technique (all routes) | Guard — 6 dodge routes | Guard — 2 Brace routes |
|---|---|---|---|
| Plains | Sweep | Second Wind | Second Wind |
| Forest | Expose Weakness | Second Wind | Second Wind |
| Mountain | Expose Weakness | Second Wind | **Brace** |
| Swamp | Expose Weakness | Cleanse | Cleanse (unchanged) |
| Cave | Expose Weakness | Cleanse | **Brace** |

Final equipped Rune sets, quoted directly from the generator:
- **Melee dodge** (Striker, Squire, Apprentice), all bosses: `[auto-path-enemy, step-back, chase-enemy, avoid-hazards, wait-for-regen]`.
- **Ranged dodge** (Slinger, Spirit, Conduit), all bosses: `[auto-path-enemy, step-back, orbit, avoid-hazards, wait-for-regen]` — no `chase-enemy` present after Orbit unlocks; `step-back` always ordered above `orbit`.
- **Brace-tank**, Mountain/Cave: `[auto-path-enemy, chase-enemy, avoid-hazards, wait-for-regen, target-casting→fire-guard]` — `step-back` absent; `fire-guard` present and legal only because Guard = Brace (code hard-throws `fire-guard` under any other Guard).
- **Flee is never equipped** by any of the 8 routes — asserted by a semantic test (`t1Routes.semantic.test.ts:259`).

These match the normalization handoff's intended target matrix exactly (§6 of that doc) — the routes as currently generated already satisfy the handoff's own acceptance criteria for Guard/Technique assignment, Step Back/Orbit ordering, and flee exclusion.

### 6.5 Per-route gear ledger and essence totals (DERIVED — see caveat)

**Caveat:** the underlying route-extraction pass summarized `t1GearPlans.ts` rather than quoting every upgrade-target line verbatim, so a few per-item final-plus-level assignments (especially for Slinger and Apprentice, which diverge from the shared gear plan) required reconstruction from a partial summary. Totals below are **DERIVED, approximate**, and should be re-verified against `t1GearPlans.ts` directly before being used to set numeric targets. They are precise enough to support the comparative/coherence findings in §6.6 and §9, which is their purpose here.

**Striker, Squire (dodge canonical) — durable-melee gear plan, 12 crafts / 23 upgrade steps (SOURCE FACT counts):**

| Essence color | Gear total | + Techniques/Guards/Runes | Route total |
|---|--:|--:|--:|
| yellow | 706 | Sweep 160, Step Back 80 | 946 |
| green | 470 | Clearing 14, Second Wind 150 | 634 |
| purple | 129 | Cleanse 150, Avoid Hazards 90 | 369 |
| blue | 496 | Step Back 180 | 676 |
| red | 500 | Expose Weakness 150 | 650 |

Iron Broadsword and Flash Rapier are each replaced mid-track by a later weapon before reaching +5 (iron-broadsword stops at +1 once Flash Rapier replaces it; Flash Rapier stops at +4 once Chaotic Axe replaces it at Cave). Whether the essence spent on their un-pushed upgrade levels represents a meaningful pacing cost, or is simply the expected shape of a weapon-refresh progression, is not established by the cost table alone — it is a question for the timing evidence in §10, discussed further in §9.

**Striker, Squire (Brace-tank) — same gear plan, no Step Back, adds Brace:**

| Essence color | Route total |
|---|--:|
| yellow | 866 (no Step Back yellow) |
| green | 634 (unchanged) |
| purple | 369 (unchanged) |
| blue | 646 (496 gear + 150 Brace, no Step Back blue) |
| red | 650 (unchanged) |

Note Second Wind (150 green) is still learned at Forest for Brace-tank routes even though it's later replaced by Brace at Mountain — the ability cost is not refunded or avoided. This is expected for an A/B experiment branch that shares its early-route structure with the canonical dodge routes by design; noted for completeness, not as a defect.

**Spirit, Conduit (ranged dodge canonical)** — `genericRangedProgression` is confirmed (agent finding) to be **functionally identical** to the Striker/Squire gear plan despite being documented as a distinct "ranged identity" — same items, same colors. Add Orbit (blue180, yellow80) on top of the Striker/Squire dodge total:

| Essence color | Route total |
|---|--:|
| yellow | 1,026 |
| green | 634 |
| purple | 369 |
| blue | 856 |
| red | 650 |

**DESIGN QUESTION — comment vs. data mismatch**: the gear plan's own code comment describes a distinct "Chaotic Axe gear identity" for Spirit/Conduit, but the authored data crafts and upgrades the exact same weapon/armor set as the melee classes, including `chaotic-axe`, a melee weapon. This is a mismatch between stated intent and live data worth a designer look, not itself evidence that the shared itemization is wrong — intentional shared T1 itemization and an unfinished ranged gear track are both plausible readings.

**Slinger** — the one route with a genuinely distinct gear plan (13 crafts / 24 upgrades):

| Essence color | Route total (DERIVED) |
|---|--:|
| yellow | 1,026 |
| green | 864 |
| purple | 967 |
| blue | 856 |
| red | **150** (Expose Weakness only — no Cave gear item crafted at all) |

**Apprentice** — adds an extra Swamp armor piece (`swamp-vest-t1`) on top of the shared plan; exact final upgrade allocation for Swamp/Mountain/Cave gear is **UNKNOWN precision** (agent summary was ambiguous on whether `mountain-vest-t1` is fully dropped in favor of `swamp-vest-t1` mid-route) — flagged for direct source re-check rather than estimated further. What is confirmed: 13 crafts, 25 upgrade steps, and Swamp boss armor is `swamp-vest-t1` (unique among all 8 routes — every other route uses `mountain-vest-t1` for Mountain/Swamp/Cave boss fights).

### 6.6 Route-total comparison

| Route | yellow | green | purple | blue | red | Crafts | Upgrades |
|---|--:|--:|--:|--:|--:|--:|--:|
| Striker/Squire dodge | 946 | 634 | 369 | 676 | 650 | 12 | 23 |
| Striker/Squire Brace | 866 | 634 | 369 | 646 | 650 | 12 | 23 |
| Spirit/Conduit | 1,026 | 634 | 369 | 856 | 650 | 12 | 23 |
| Slinger | 1,026 | 864 | 967 | 856 | **150** | 13 | 24 |
| Apprentice | ~similar to dodge + 1 item | | | | | 13 | 25 |

**PACING QUESTION TO VALIDATE — red essence, Slinger vs. the other 5 routes.** Every route except Slinger spends ~650 red essence on Cave gear (weapon + partial armor/ability); Slinger spends 150 (ability only) — roughly 1/4 the red-essence demand of every other canonical route — while still being required to fully level Cave (biome cap 6) and clear the Cave boss to progress. This is a quantified asymmetry in *what Slinger spends its Cave-earned red essence on*, not by itself proof that Slinger's Cave leg plays faster, slower, or differently — a route with a lighter gear sink for a color still farms that color's biome for XP/mastery/boss access regardless. It should be checked against §10's timing telemetry before being treated as an imbalance.

**PACING QUESTION TO VALIDATE — mid-track weapon replacement.** The shared gear plan crafts and upgrades two weapons (Iron Broadsword, Flash Rapier) that are each replaced before reaching +5, in favor of a later weapon, with no reclaim mechanic found in source for the essence already spent on them. Whether this represents a real pacing cost worth redesigning, or is simply the intended shape of a weapon-refresh progression with no measurable downside, is a **NEEDS DESIGN DECISION** — resolving it needs timing evidence (§10), not the cost table alone.

---

## 7. Canonical Route Assumption Verification

Cross-checked against `docs/t1-route-normalization-handoff-2026-08-28.md`'s stated intent (written the same day as this task):

| Handoff assumption | Verified against live route generator |
|---|---|
| Biome order Plains→Forest→Swamp→Mountain→Cave | **Confirmed** — `T1_PROGRESSION_ORDER`, `t1RouteBuilder.ts:15-21` |
| Sweep learned in Plains, kept through Mountain | **Confirmed** — Technique slot unchanged until Cave |
| Expose Weakness learned in Cave, used for all single-target bosses after Plains | **Confirmed** |
| Second Wind → Cleanse swap happens in Swamp | **Confirmed** |
| Step Back crafted at Mountain L2, ordered above chase/orbit | **Confirmed**, exact rule order matches |
| Orbit crafted at Mountain L3, ranged-only, replaces chase-enemy | **Confirmed** |
| No route falls back to chase-enemy after Orbit unlocks | **Confirmed** — ranged routes' final Rune set has no `chase-enemy` entry |
| Flee never used in canonical routes | **Confirmed** by semantic test |
| Brace-tank never crafts Step Back, uses `target-casting→fire-guard` only with Brace equipped | **Confirmed**, and the code hard-throws to enforce this — not just a convention |
| Apprentice uses Chase, not Orbit | **Confirmed** — Apprentice's `movementProfile` is `melee-chase` |
| Registry contains only the 8 intended routes, no V2/experimental drift | **Confirmed** by a dedicated semantic test scanning for the exact substrings previously flagged as risky |

**No discrepancies found between the normalization handoff's intent and the live route generator.** This suggests the normalization work described in that handoff document was already substantially implemented (centralized `makeT1Route` builder, semantic tests, clean registry) by the time this economy audit ran — worth flagging to the user since the handoff document reads as a forward-looking task list, but several of its "deliverables" (§16 of that doc: standardized routes, controlled registry, semantic tests, RP legality checks) already exist in source. One item from that list is **not** fully delivered: RP-budget legality is enforced only in the **test suite** (`t1Routes.semantic.test.ts:178-181`), not at runtime in `bot/src/route/executor.ts` — an illegal Rune configuration would only be caught by running the test suite, not by the bot itself at run time.

One further biome-order ambiguity found in this pass (not covered by the handoff): **the boss fight order (Plains/Forest/Mountain/Swamp/Cave) does not match the leveling order (Plains/Forest/Swamp/Mountain/Cave)** — Mountain is fought before Swamp despite being leveled after it. This is presumably intentional (difficulty ordering vs. leveling ordering can differ) but was not addressed by the handoff and should be confirmed as intended.

---

## 8. Economic Coherence Audit

### Unlock-vs-affordability
- Nothing in this audit found a case of "unlocks far earlier than affordable" or "affordable long before unlock" at T1 — the linear biome-by-biome structure and matched essence-color-per-biome design largely prevents this by construction. No action flagged here.

### Cost-curve
- Every T1 item's upgrade curve roughly doubles per step from +2 onward, then plateaus at +3/+4/+5 (e.g. Iron Broadsword: 30/60/**60/60**; Chaotic Axe: 66/126/**126/126**) — a consistent, deliberate-looking flattening after +2, present across all 20 gear items. This reads as intentional design, not incoherence — flagged as **coherent, leave unchanged** in the summary.
- Flash Rapier is the one outlier that does **not** flatten (120/240/480, doubling all the way to +5) — every other weapon/armor item in the tier plateaus after +2/+3. Worth a designer look: possibly intentional (it's abandoned before +5 anyway per §6.5), but it's the only curve shape that differs from its 19 siblings.

### Resource-color
- Per §6.6, Slinger's red-essence gear demand is markedly lower than every other route's (~150 vs. ~650) — a resource-color asymmetry worth validating against real playtime (§10), not a confirmed imbalance on the cost data alone.
- No route was found needing resources from a biome it has no other reason to visit — the biome-locked essence-color design keeps this from happening structurally.

### Catalyst
- Already covered in full in §5: catalyst supply is fully live at T1, demand is zero. This is a structural fact (zero T1 recipes spend any catalyst family, at all, regardless of amount) rather than a matter of degree — it does not require timing evidence to establish, unlike the essence-total asymmetries above.

### Route inequality
- Slinger's lighter red-essence gear demand (§6.6) is the main quantified asymmetry between routes; treat it as a pacing/efficiency question to validate, not a settled inequality.
- Apprentice carries one extra mandatory craft (`swamp-vest-t1`) that no other route requires — a real, source-confirmed asymmetry in crafts/upgrades (13/25 vs. 12/23 for the melee baseline); whether it meaningfully changes pacing is untested.

### Timing (hypotheses only, not validated)
- **Likely short wait**: Clearing (fixed 4-item literacy gear, small XP curve) — low risk.
- **Likely medium wait**: Plains→Forest, where essence color changes and the player restarts a fresh craft/upgrade cycle each biome.
- **Possible severe block**: red essence for non-Slinger routes converges with the Cave-only red supply (§4) at exactly the point (Cave, final biome) where the player also needs to hit +4/+5 GM gates (GM24/30) simultaneously — this stacks a resource constraint and a mastery-gate constraint at the same leg, which is worth flagging as the most likely real bottleneck point, pending §10 validation.

---

## 9. Unknowns / Design Decisions Needed

1. Is the zero-T1-catalyst-demand design intentional, or should some T1 recipe consume catalysts? (§5)
2. Is Spirit/Conduit's identical-to-melee T1 gear plan intentional shared itemization, or an unfinished "ranged identity" that should diverge? (§6.5)
3. Is Slinger's lighter Cave-leg gear demand (~150 vs. ~650 red essence for the other 5 routes) an intentional class-identity choice, and does it actually change Cave-leg pacing in practice, or is the essence total alone a poor proxy for time spent? Needs §10 timing data, not just the cost table. (§6.6)
4. Is replacing Iron Broadsword (stops at +1) and Flash Rapier (stops at +4) with a later weapon intended progression flavor, or a pacing cost worth addressing? Needs §10 timing data to distinguish these. (§6.5, §8)
5. Why does Flash Rapier's upgrade curve not flatten like every other T1 item's does? (§8)
6. Is Power Strike (Mountain L5 Technique, blue190) genuinely unused dead content at T1, or missing from the canonical routes by omission? (§2.5)
7. Precise per-node modifier assignment for the five T1 biomes was not extracted — needed before a 1× run can report which catalyst families were actually banked. (§5.3)
8. Exact Apprentice Mountain/Swamp gear-plan allocation needs direct re-verification against `t1GearPlans.ts` — the extraction summary was ambiguous. (§6.5)
9. Whether `wait-for-regen` (and base movement runes) are free/default versus silently un-crafted in the route ledgers needs direct verification. (§3)
10. CLAUDE.md's biome-level-cap documentation (4) should be corrected to match live code (6) — a doc-fix, not a design question, but flagged since it will mislead anyone reading project docs during the redesign session.

### What appears coherent and should probably stay as-is
- The GM/RP formula chain (biome XP → GM → RP budget → upgrade gates) is internally consistent and was independently verified correct against the normalization handoff's own claims — no changes indicated.
- The per-biome essence-color-locked, linear +1..+5 cost curve (with its consistent post-+2 plateau) is uniform across 19 of 20 T1 gear items — a deliberately coherent shape.
- The route-generation architecture (`makeT1Route`, shared Rune-profile builder, semantic tests, clean registry) is already solid and matches the normalization handoff's target state closely — no rework indicated here.
- Guard/Technique boss assignment (§6.4) exactly matches documented design intent with no drift found.

---

## 10. Proposed 1× Validation Measurements

Per-run telemetry needed to answer *"what did the bot actually spend its time farming"* and *"which resource determined progression speed"*:

- Real elapsed time, and elapsed time **per biome leg** and **per route step** (craft/upgrade/learn/travel/boss-attempt individually timestamped).
- Biome mastery level over time, per biome (to correlate XP-bound vs. resource-bound waits).
- Essence gained and spent, by color, as a running balance (not just totals) — to see whether a color ever hits zero and blocks a craft (a "blocked-on-resource" state).
- Catalyst gained (and, since T1 has no sink, simply accumulated) by family, to validate the §5 supply/demand-inversion finding empirically.
- Kill count while farming each resource objective, to compute realized essence/catalyst/XP-per-kill against the theoretical values in §3/§4.
- Exact timestamp of every craft, every upgrade step, every ability/Guard/Rune unlock, every biome level-up, and each boss attempt (win/loss), plus GM and RP-budget-used at each `configureRunes` step.
- A first-class "blocked" state: explicitly log when the bot is farming solely because it's essence/catalyst-poor versus because it hasn't hit an XP/GM gate yet — these are different bottleneck types and the current telemetry vocabulary doesn't obviously distinguish them (recommend adding this distinction if it doesn't already exist, without implementing it now).
- Per-node modifier identity actually farmed, to resolve unknown #7 above empirically if static map data isn't read first.

Do not invent target times; this section defines instrumentation only.

---

## 11. Contention-Aware Routing Feasibility (planning only)

*(Full findings from a dedicated architecture-feasibility pass; nothing in this section is implemented.)*

**Likely implementation locations**: a new `onWorldTelemetry` hook in `bot/src/net/connection.ts` (currently `world:telemetry` is broadcast server-side to every socket but the bot harness never subscribes to it); a new `Observation.worldOccupancy()` accessor; a new `pick: "uncontested"` strategy or policy override in `bot/src/route/conditions.ts`'s `resolveNode`; and a new `Policy` implementation for the wait/accept/fallback behavior, mirroring existing `Policy.autocombat`-style parameterization. This should be a new policy layered on the *same* route step data — not a new route file, and not a change to `t1Common.ts`/`t1RouteBuilder.ts`, which must stay as the canonical solo-baseline generator.

**Already available**: same-node occupancy/contention is already tracked (`Observation.otherPlayers()`, `Recorder.trackContention`, surfaced in `RunSummary.world.contestedFraction`) but only for the bot's *current* node and only for "same attack target," not pre-arrival decisions. World-wide per-node player counts already exist on the wire (`world:telemetry`, `NodeTelemetryRow.players/.occupied`) but the bot harness doesn't currently listen for that event at all. Enumerating alternate nodes for the *same essence/recipe group* is trivial via `normalNodesFor(biomeGroup, tier)`, since essence color and item-recipe group are biome-locked. **Correction to the original feasibility pass:** that pass additionally claimed catalyst family "maps 1:1 to biome group," which contradicts §5.1's sourced finding that catalyst family is determined by a node's assigned **modifier**, independent of biome. `normalNodesFor(biomeGroup, tier)` is only a valid alternate-node enumeration for an essence/recipe-driven objective; for a catalyst-family objective it is not sufficient on its own — the policy would additionally need per-node modifier assignment data, which §5.3 already flags as not extracted in this pass (`shared/src/world/map/registry.ts` and region files).

**Missing**: the bot-side wiring to consume `world:telemetry`; a node-selection strategy that composes "enumerate same-objective alternates" (same biome group for essence/recipe objectives; same node-modifier for catalyst objectives, once per-node modifier data is available) + "filter by occupancy" + "BFS to nearest" (the BFS piece, `nearestNodeId`, already exists and is reusable); a precise definition of "contested" usable *before* the bot arrives at a node (existing signal is coarse headcount, not "farming the same thing I am"); and a named concept for the "farm a secondary resource" fallback, which doesn't exist in the route/condition vocabulary today.

**Major risks**: (1) because catalyst family is node-modifier-based rather than biome-based (§5.1), a naive fallback built on biome/recipe-group substitution alone could silently change *which catalyst family* is being farmed without the policy itself treating that as a resource change — this is a sharper risk than "same biome, different node" would be, and must be logged explicitly as a family substitution, not folded into ordinary node-choice telemetry; (2) this feature is fundamentally meaningless without concurrent bots in a shared world, which directly conflicts with the T1 normalization handoff's mandate that clean validation runs be strictly sequential/isolated — it needs its own separate, clearly-tainted execution mode (analogous to the existing `NON_CANONICAL_*` telemetry taint pattern), never folded into the canonical batch; (3) reproducible A/B comparison requires controlling the other-player population too, which is a materially bigger harness investment than the routing logic itself; (4) `world:telemetry`'s aggregation window is coarse/throttled and not designed for real-time routing decisions — using it as-is risks decision lag that would itself need to be logged.

---

## 12. Authoritative Source Map

| Topic | File(s) |
|---|---|
| Biome XP, level caps, GM, upgrade GM-gates | `shared/src/config/gameConfig.ts` |
| Runic Point budget | `shared/src/runeDatabase.ts:739-755` |
| Per-item upgrade cost/gate logic | `shared/src/systems/itemUpgrades.ts` |
| Player tier / seal advancement | `server/src/systems/player/progression/questSystem.ts`, `shared/src/systems/tierAdvancement.ts` |
| T1 biome roster | `shared/src/biomeDatabase.ts:72-168` |
| T1 recipes (5 biomes + Clearing) | `shared/src/data/recipes/{clearing,plains,forest,swamp,mountain,cave}.recipes.ts` |
| Techniques / Guards (abilities) | `shared/src/abilityRecipes.ts` |
| Runes | `shared/src/runeRecipes.ts` |
| (Not T1) Stances, Rites | `shared/src/stanceRecipes.ts`, `shared/src/riteRecipes.ts` |
| T1 monster rewards | `shared/src/data/monsters/{plains,forest,swamp,mountain,cave,tutorial}.monsters.ts`, `bossesT1.ts`, reward shape at `types.ts:390-406` |
| Catalyst grant/threshold logic | `server/src/systems/player/progression/rewards.ts` |
| Node modifier mechanics/effects | `shared/src/world/nodeModifiers.ts`, `nodeModifierTypes.ts`, `nodeModifierMap.ts` |
| Quests | `shared/src/quests/questDatabase.ts` |
| Canonical route generator | `bot/src/routes/t1RouteBuilder.ts`, `t1Common.ts`, `t1GearPlans.ts` |
| Route registry | `bot/src/routes/index.ts` |
| Route semantic tests | `bot/src/routes/t1Routes.semantic.test.ts` |
| Route step execution / RP legality | `bot/src/route/executor.ts`, `bot/src/route/conditions.ts` |
| World telemetry protocol | `shared/src/protocol/nodeTelemetry.ts`, `shared/src/protocol/socketEvents.ts` |
| Bot observation/telemetry | `bot/src/state/observation.ts`, `bot/src/telemetry/recorder.ts`, `bot/src/telemetry/summary.ts` |
