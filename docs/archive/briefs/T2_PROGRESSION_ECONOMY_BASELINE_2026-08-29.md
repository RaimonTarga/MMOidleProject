> **ARCHIVED — implemented 2026-08-29; live state in `docs/briefs/T2_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-29.md`.**
> Kept as the pre-rebalance factual baseline.

# T2 Progression Economy Baseline
**Date:** 2026-08-29
**Purpose:** Source-of-truth audit of the current Tier 2 progression/economy, to ground the upcoming T2 redesign now that T1's economy has shipped (`docs/briefs/T1_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-28.md`). Extraction and diagnosis only — no numbers were changed to produce this document.

**Method.** Direct source reads with `file:line` citations, cross-checked against `docs/briefs/T1_PROGRESSION_ECONOMY_BASELINE_2026-08-28.md` (pre-rebalance T1 facts) and the IMPLEMENTATION ledger (post-rebalance T1 facts, the actual comparison anchor). Every claim is tagged:
- **SOURCE FACT** — found directly in code/data
- **DERIVED** — computed from SOURCE FACTs
- **CONCERN** — diagnostic observation, not a fix
- **UNKNOWN / DESIGNER DECISION** — not resolvable from source

---

## 1. Executive Summary

1. **T2 gear/stances/cores charge catalysts on the base craft, not just at +5.** T1 (post-rebalance) spends zero catalysts below +5, and even at +5 only 9 of 20 items spend exactly 1 unit. Every T2 weapon/armor/charm/boots/stance/core recipe examined (`jungle.recipes.ts`, `desert.recipes.ts`, the T2 sections of `plains/forest/swamp/mountain/cave.recipes.ts`, `stanceRecipes.ts`) spends 1–3 catalyst units to even *craft* the base item, before any upgrade. This is a structural, tier-wide change in when catalysts become mandatory, not a numbers tweak.
2. **Ability/Technique costs jump roughly 4–15x from T1 to T2, essence-for-essence.** Rebalanced T1 Techniques/Guards cost 25–90 essence (`shared/src/abilityRecipes.ts:57,70,83,95,107,121`). The two T2 biomes' Techniques/Guards cost 320–380 essence each (`abilityRecipes.ts:134,145,156,167`), climbing to 650–1500 by T3/T4. Nothing in `docs/README.md`'s tracked work touched these numbers after the T1 pass — they read as pre-rebalance-era figures left behind.
3. **Gear evolution/reconstruction exists as a system but has exactly one live lineage.** `evolvesFrom` appears only on `gale-needle` and `thorn-needle` (both children of `flash-rapier`, `forest.recipes.ts:125,145`) — confirmed by a repo-wide grep. Every other T1→T2 gear transition, in all four other biomes and both new T2 biomes, is a plain independent `craftRecipe` with no lineage link, no discount, and no credit for prior +1..+5 investment (`docs/gear-evolution-current-state.md`).
4. **No T2 canonical bot route exists.** `bot/src/routes/` contains only `*T1.ts` files (`bot/src/routes/index.ts`); there is no T2 equivalent of `t1RouteBuilder.ts`/`t1GearPlans.ts`. Section 8 below extracts the closest live authoritative behavior (recipe/GM gates) instead of inventing a route.
5. **No T2 boss grants a catalyst bundle.** All five T1 bosses set `catalystBundle: 5` (`shared/src/data/monsters/bossesT1.ts`, confirmed in the T1 baseline). None of the seven T2 bosses (`bossesT2.ts`) sets `catalystBundle` at all — a first-clear catalyst grant that existed at T1 disappears exactly where per-craft catalyst demand becomes mandatory.

---

## 2. T2 Progression/Gating Timeline

### 2.1 Formulas that change value between T1 and T2 (SOURCE FACT, `shared/src/config/gameConfig.ts`)

| Mechanic | Formula | T1 value | T2 value |
|---|---|---|---|
| `BIOME_LEVELS_PER_TIER` | constant | 6 | 6 (same constant governs every tier) |
| Biome level cap, T1-spanning biomes (plains/forest/swamp/mountain/cave) | `biomeLevelCap(tier, group)` = `(tier - startTier + 1) * 6` | 6 (tier 1, start 1) | **12** (tier 2, start 1) |
| Biome level cap, T2-native biomes (jungle, desert) | same formula, `startTier = 2` | 0 (unreachable) | **6** (tier 2, start 2) |
| Max Global Mastery at tier | `maxGlobalMasteryAtTier(tier)` (`gameConfig.ts:302-309`) | 30 (5 biomes × 6) | **72** (5×12 + 2×6) |
| Item-tier GM band (`itemUpgrades.ts:17-30`) | `(maxGM(itemTier-1), maxGM(itemTier)]`, +1..+5 spread evenly | T1 items: 0–30 → +1@6…+5@30 | **T2 items: 30–72 → +1@38, +2@47, +3@55, +4@64, +5@72** (DERIVED, `round(42*plus/5)+30`) |
| RP budget | `runeBudgetForGlobalMastery(gm) = 8 + floor(gm/10)` (`runeDatabase.ts:769-771`) | GM30 → **11 RP** | GM72 (T2 maxed) → **15 RP** |
| Seals to advance | `SEALS_REQUIRED_BY_TIER` (`shared/src/systems/tierAdvancement.ts:33`) | T1→T2: 2 of 5 bosses | **T2→T3: 3 of 7 bosses** (Plains, Forest, Swamp, Mountain, Cave, Jungle, Desert) |

Levels are biome-local absolute: a T1-spanning biome's T2 content sits at `requiredBiomeLevel` 7–12 (levels 1–6 are its T1 content); Jungle/Desert start their own count at level 1 (`docs/global-mastery-current-state.md`).

### 2.2 T2 biome roster and boss essence (SOURCE FACT)

| Biome | Native catalyst family | Banned family | T2 boss | Boss essence (type) | Boss biome XP | Boss `catalystBundle` |
|---|---|---|---|---|---|---|
| Plains | none (neutral) | none | Gorging Razortusk | 150 (yellow) | 225 | **absent** |
| Forest | alacrity | heavy | Apex Timberclaw | 155 (green) | 232 | **absent** |
| Swamp | fortified | none | Mire-Gorged Behemoth | 155 (purple) | 232 | **absent** |
| Mountain | heavy | alacrity | Stoneplate Juggernaut | 160 (blue) | 240 | **absent** |
| Cave | dominion | none | Chitinous Dreadbore | 160 (red) | 240 | **absent** |
| Jungle | alacrity | heavy | Jungle Dread-Gorger | 145 (green) | 218 | **absent** |
| Desert | dominion | alacrity | Dune-Stalker Emperor | 150 (yellow) | 225 | **absent** |

(`shared/src/data/monsters/bossesT2.ts`, `docs/node-modifiers-current-state.md` for native/ban table.) T1 boss essence was 100–110 with a first-clear `catalystBundle: 5` on every boss — T2 essence is ~1.4–1.5x T1's (a plausible, coherent per-tier growth step matching the ×1.20/stage monster-pressure target in `docs/briefs/t2-t4-numerical-baseline-handoff-2026-08-23.md`), but the catalyst bundle line item vanishes entirely.

### 2.3 Chronological unlock table (SOURCE FACT, T1-spanning biomes' T2 band = level 7–10; Jungle/Desert = level 1–4)

| Stage | Unlock | Category | Gate | Catalyst on base craft? |
|---|---|---|---|---|
| T1→T2 | Player tier 2 | tier gate | 2 of 5 T1 boss seals | — |
| Plains L7 | Knight's Steelsword, Tempered Core | weapon, core | Plains L7 | weapon: no; core: 1 swarming |
| Plains L8 | Enduring Robe | armor | Plains L8 | 2 alacrity |
| Plains L8 | Perfection Stance | stance | Plains L8 | 3 alacrity |
| Forest L7 | Gale Needle / Thorn Needle (**evolutions**), Offensive/Defensive Stance, Survivalist Core | weapon(evo), stance, core | Forest L7 | weapon: 2 alacrity; stances: 2 alacrity; core: 1 fortified |
| Forest L8 | Phantom Bindings, Tanking Stance | armor, stance | Forest L8 | armor: 2 alacrity; stance: 3 alacrity |
| Swamp L7 | Venom Knife | weapon | Swamp L7 | 2 fortified |
| Swamp L8 | Bog Wrappings | armor | Swamp L8 | 2 fortified |
| Mountain L7 | Quake Hammer | weapon | Mountain L7 | 2 heavy |
| Mountain L8 | Iron Crusader Plate | armor | Mountain L8 | 2 heavy |
| Cave L7 | Ruinous Axe | weapon | Cave L7 | 2 swarming |
| Cave L8 | Dire Bestial Hide, Force Core | armor, core | Cave L8 | armor: 2 swarming; core: (see §5) |
| Jungle L1 | Stinger Rapier | weapon | Jungle L1 | 2 alacrity |
| Jungle L2 | Verdant Weave | armor | Jungle L2 | 2 alacrity |
| Desert L1 | Sunsteel Falchion | weapon | Desert L1 | 2 dominion |
| Desert L2 | Duneplate of the Last Stand | armor | Desert L2 | 2 dominion |
| Desert L3 | Charge (Technique) | Technique | Desert L3 | essence only, 320 yellow |
| Desert L5 | Endure (Guard), Enraged/Fleeting Stance | Guard, stance | Desert L5 | essence only / 3 catalyst |
| Jungle L3 | Hamstring (Technique) | Technique | Jungle L3 | essence only, 320 green |
| Jungle L5 | Bramble Guard | Guard | Jungle L5 | essence only, 380 green |
| — | **No T2 Rite exists.** All `riteRecipes.ts` entries are tier 3+ (`requiredBiomeLevel` 5 or 11–15). | — | — | — |
| Boss gauntlet | 3 of 7 T2 boss clears | tier gate | all 7 T2 biomes | no catalyst bundle on any |

**Comparison to T1:** at T1, mandatory-counterplay Techniques/Guards/Runes were deliberately dropped to 25–90 essence and zero catalyst (T1 implementation ledger §4). At T2, the same content category (Charge, Endure, Hamstring, Bramble Guard) costs 320–380 essence, and every gear/stance/core recipe now spends catalysts up front. The philosophy that shipped for T1 five days earlier does not appear to have been carried forward into T2's authored numbers.

---

## 3. Complete T2 Recipe/Cost Inventory (representative; full data in the cited files)

All costs below are per-recipe `cost`/`catalystCost`/`upgrades[]` fields, read directly. "Total→+5" sums base + all five upgrade steps' essence only (catalyst totals called out separately).

### Jungle (green essence, native alacrity) — `shared/src/data/recipes/jungle.recipes.ts`
| Item | Slot | Base cost | Base catalyst | Total→+5 (essence) | Upgrade catalyst |
|---|---|---|---|---|---|
| Stinger Rapier | weapon | green 55 | alacrity 2 | 990 | none on upgrades |
| Verdant Weave | armor | green48/yellow12 | alacrity 2 | 592g / 176y | none |
| Canopy Heart | recovery | green 45 | alacrity 2 | 384 | none |
| Vine Wraps | mobility | green 30 | alacrity 2 | 250 | none |
| Bruiser Core (T3, L9) | core | green 110 | alacrity 3 | n/a (cores don't upgrade) | — |
| Accelerant Core (T3, L11) | core | green 90 | alacrity 2 | n/a | — |

### Desert (yellow essence, native dominion) — `desert.recipes.ts`
| Item | Slot | Base cost | Base catalyst | Total→+5 (essence) |
|---|---|---|---|---|
| Sunsteel Falchion | weapon | yellow 70 | dominion 2 | 1,115 |
| Duneplate of the Last Stand | armor | yellow35/purple25 | dominion 2 | 660y / 300p |
| Mirage Talisman | recovery | yellow50/purple25 | dominion 2 | 335y / 145p |
| Sand Sprint | mobility | yellow 58 | dominion 2 | 306 |
| Sniper Core (T3, L9) | core | yellow 110 | dominion 3 | n/a |

### Returning T1 biomes' T2 segment (level 7–10 band)
| Item | Biome | Slot | Base cost | Base catalyst | Total→+5 (essence) | Evolution? |
|---|---|---|---|---|---|---|
| Knight's Steelsword | Plains | weapon | yellow 45 | **none** | 720 | no |
| Enduring Robe | Plains | armor | yellow 60 | alacrity 2 | 900 | no |
| Stalwart Heart | Plains | recovery | yellow 50 | alacrity 2 | 500 | no |
| Gale Boots | Plains | mobility | yellow 40 | alacrity 2 | 300 | no |
| **Gale Needle** | Forest | weapon | green 60 | alacrity 2 | 1,920 | **yes — evolves from flash-rapier@+3** |
| **Thorn Needle** | Forest | weapon | green50/purple20 | alacrity 2 | 1,920g / 640p | **yes — sibling branch, same predecessor** |
| Phantom Bindings | Forest | armor | green48/yellow12 | alacrity 2 | 963g/321y + 3 more alacrity on upgrades | no |
| Ancient Heartroot Amulet | Forest | recovery | green 50 | none | 500 | no |
| Windstep Wraps | Forest | mobility | green 40 | none | 340 | no |
| Venom Knife | Swamp | weapon | purple 52 | fortified 2 | 972 | no |
| Bog Wrappings | Swamp | armor | purple 54 | fortified 2 | 1,134 | no |
| Bog Eye | Swamp | recovery | purple 44 | fortified 2 | 464 | no |
| Wetland Wraps | Swamp | mobility | purple 44 | fortified 2 | 268 | no |
| Quake Hammer | Mountain | weapon | blue 52 | heavy 2 | 1,222 | no |
| Iron Crusader Plate | Mountain | armor | blue 52 | heavy 2 | 1,076 | no |
| Iron Bulwark | Mountain | recovery | blue 42 | heavy 2 | 448 | no |
| Mountain Stride | Mountain | mobility | blue 42 | heavy 2 | 314 | no |
| Ruinous Axe | Cave | weapon | red 60 | swarming 2 | 1,104 | no |
| Dire Bestial Hide | Cave | armor | red 54 | swarming 2 | 1,213 | no |
| Resonant Gem | Cave | recovery | red 44 | swarming 2 | 483 | no |
| Cavern Sprints | Cave | mobility | red 33 | swarming 2 | 335 | no |

### Cores available at T2 (SOURCE FACT — only 3 of 7 T2 biomes carry a T2-band core)
| Core | Biome | Level | Eligibility | Catalyst |
|---|---|---|---|---|
| Tempered Core | Plains | 7 | unrestricted | swarming 1 |
| Survivalist Core | Forest | 7 | unrestricted | fortified 1 |
| Force Core | Cave | 8 | unrestricted | (see `cave.recipes.ts:250-262`) |
| — | Swamp | — | — | **no T2-band core; Swamp's core sits at L15 (T3)** |
| — | Mountain | — | — | **no T2-band core; Mountain's cores sit at L14/17 (T3)** |
| — | Jungle | — | — | Jungle's cores are T3-band (L9, L11) |
| — | Desert | — | — | Desert's core is T3-band (L9) |

**CONCERN:** at T2 proper, only Plains/Forest/Cave players can equip a core at all; Swamp/Mountain players get none until T3, and Jungle/Desert (which don't even exist before T2) get none until deep into their own T3 band. Core availability is not one-per-biome-per-tier as the header comment in `plains.recipes.ts:219-224` implies for the *cast as a whole* — it implies per-biome-across-tiers, not per-tier-across-biomes, but the practical effect for a T2 player is asymmetric core access. Flagged for designer review.

### Stances (T2-accessible; Rites are not — `stanceRecipes.ts:30-38`, `riteRecipes.ts`)
| Stance | Biome | Level | Cost | Catalyst |
|---|---|---|---|---|
| Offensive | Forest | 7 | green 60 | alacrity 2 |
| Defensive | Forest | 7 | green60/blue20 | alacrity 2 |
| Tanking | Forest | 8 | green70/blue30 | alacrity 3 |
| Enraged | Desert | 5 | red80/yellow30 | dominion 3 |
| Perfection | Plains | 8 | yellow80/green30 | alacrity 3 |
| Fleeting | Jungle | 5 | blue80/green30 | alacrity 3 |

No Rite recipe exists below `requiredBiomeLevel` 5 in a T3-start biome or 11–15 in a T1-start biome — i.e. **Rites are entirely a T3+ system**, matching the T1 finding that Rites/Stances were both zero at T1 (T1 baseline §3), except Stances have since moved to T2-accessible while Rites have not.

---

## 4. T1→T2 Item Lineage / Evolution / Reconstruction Map (MAJOR SECTION)

### 4.1 The one real lineage — Forest rapier

`flash-rapier` (T1, base 20 green, total→+5 = 500 per the T1 implementation ledger) branches into two T2 siblings, both `evolvesFrom: 'flash-rapier'` (`forest.recipes.ts:125,145`):

| Path | Prerequisite | Craft/skip cost | Full track to +5 (from 0) | Catalyst to +5 |
|---|---|---|---|---|
| **Evolve → Gale Needle** | flash-rapier at **+3** (costs 20+25+50+75 = **170 green** sunk) | 60 green, 2 alacrity | 170 (flash-rapier to +3) + 1,920 (gale-needle 0→+5) = **~2,090 green** | 2 alacrity |
| **Reconstruct → Gale Needle** | none | 240 green, **5 alacrity** | 1,920 (gale-needle craft is skipped; upgrade track alone runs 60+120+240+480+960=1,860, cost table above shows base 60 already included in 1,920 total) + 240 = **~2,100 green** | **5 alacrity** |
| **Evolve → Thorn Needle** | flash-rapier at +3 (same 170 green) | 50 green/20 purple, 2 alacrity | ~170 + 1,920g/640p | 2 alacrity |
| **Reconstruct → Thorn Needle** | none | 200 green/80 purple, 5 alacrity | ~2,100g/720p | 5 alacrity |

**Finding — evolve vs. reconstruct is economically coherent here, but only just.** Essence totals land within ~1% of each other regardless of path; the entire "reward" for having leveled Flash Rapier to +3 is a **2.5x reduction in catalyst** (2 vs 5 alacrity), not an essence discount. Since T2 catalysts are also newly mandatory on nearly every other T2 recipe's base craft (§1, §5), 3 extra alacrity units is a real, non-trivial cost difference — so a rational player *does* have a reason to level Flash Rapier first rather than skip straight to reconstruction. This is the one lineage in the game that demonstrates the intended evolve/reconstruct asymmetry working as designed.

### 4.2 Every other T1→T2 transition is NOT a lineage at all

A repo-wide grep for `evolvesFrom` across `shared/src/data/recipes/*.ts` returns exactly the two Forest entries above. Every other biome's T2 weapon/armor/charm/boots is a **plain independent `Recipe`** with its own `cost`, no `lineageId` shared with its T1 predecessor, no `evolvesFrom`, and no `reconstructCost`:

| T1 item | T2 "successor" (by slot+biome, not by data link) | Link in data? |
|---|---|---|
| Iron Broadsword (Plains) | Knight's Steelsword | none — independent recipe |
| Survivor's Robe | Enduring Robe | none |
| Poison Dagger / Arcane Wrappings (Swamp) | Venom Knife / Bog Wrappings | none |
| Heavy Hammer / Fallen Knight Plate (Mountain) | Quake Hammer / Iron Crusader Plate | none |
| Chaotic Axe / Bestial Hide (Cave) | Ruinous Axe / Dire Bestial Hide | none |
| — | Stinger Rapier / Sunsteel Falchion (Jungle/Desert — no T1 predecessor, new biomes) | n/a |

**Finding — this means "does the player have a rational reason to evolve rather than reconstruct" is the wrong question for 18 of 20 T1 gear items: there is no evolve/reconstruct choice at all.** A player who fully invested in, say, Fallen Knight Plate to +5 (497 essence, T1 implementation ledger §2) gets **zero credit** when they craft Iron Crusader Plate at T2 — the T1 item is simply retired (kept in inventory, presumably still equippable but outclassed) and the T2 item is bought from scratch. This is either:
- an intentional design choice (T1 gear is "starter" gear meant to be fully obsoleted, and only Forest's rapier was chosen as the one worked lineage per `docs/gear-evolution-current-state.md`'s own "Deferred" section: *"Lineages for the other 3 slots × biomes... (user balance pass)"*), or
- unfinished authoring — the gear-evolution system shipped as "structural machinery + one worked lineage" and the remaining 18 lineages were never written.

The current-state doc is explicit that this is deferred work, not a bug — but it means **the T1→T2 transition for 90% of gear is economically indistinguishable from starting the game over in a new biome**, which is a very different shape from what "evolution" as a *concept* suggests to a player looking at the one Forest weapon that does branch. **DESIGNER DECISION NEEDED:** should more T1→T2 lineages be authored before/as part of the T2 redesign, or is full-replacement the intended shape for everything except a few showcase items?

### 4.3 Dead-end T1 items

Every T1 weapon/armor that lacks a T2 lineage becomes a dead-end the moment its biome's T2 gear is affordable — this is all 8 T1 weapons/armors outside the rapier line (Iron Broadsword, Survivor's Robe, Poison Dagger, Arcane Wrappings, Heavy Hammer, Fallen Knight Plate, Chaotic Axe, Bestial Hide). Charms and boots follow the same pattern (no lineage anywhere on any recovery/mobility item, T1 or T2). This is consistent tier-wide, not a per-item anomaly — flagged as a **coherent-but-total design choice**, not a defect, pending the designer decision in §4.2.

---

## 5. Upgrade-Curve Audit

### 5.1 Shape comparison

T1 philosophy (post-rebalance): cheap +1, cheap +2, meaningful +3, expensive +4, +5 as the major investment, ~65–75% of post-base spend in +4/+5, accelerating curve (T1 implementation ledger §2, e.g. Iron Broadsword 10/10/25/35/60/100).

T2 items **do** accelerate, but far more steeply and less evenly than T1's grammar. Representative curves (essence only):

| Item | Base | +1 | +2 | +3 | +4 | +5 | +4+5 share of post-base |
|---|--:|--:|--:|--:|--:|--:|--:|
| Knight's Steelsword | 45 | 45 | 90 | 180 | 180 | 180 | 53% |
| Gale Needle | 60 | 60 | 120 | 240 | 480 | 960 | 79% |
| Stinger Rapier | 55 | 66 | 132 | 264 | 264 | 264 | 55% |
| Ruinous Axe | 60 | 78 | 162 | 288 | 288 | 288 | 55% |
| Sunsteel Falchion | 70 | 100 | 200 | 300 | 300 | 300 | 52% |

Two different shapes coexist: most items **plateau at +3** (identical cost repeated for +3/+4/+5, e.g. Knight's Steelsword, Ruinous Axe, Sunsteel Falchion — the exact "doubling-then-flattening" T1 shape the coherence audit called out as *consistent, leave-alone* at T1). Gale Needle/Thorn Needle instead **keep doubling all the way to +5** (60/120/240/480/960) — this is precisely the Flash Rapier outlier pattern the T1 audit flagged and the T1 rebalance explicitly fixed by normalizing Flash Rapier away from a doubling-to-+5 curve. **The same non-conforming shape has re-appeared, unfixed, in that item's own T2 evolution.** This is a strong candidate for "legacy economic residue" — the T1 fix was applied to `flash-rapier` itself but not propagated to its T2 children, which still carry the old doubling-to-+5 shape T1 explicitly moved away from.

### 5.2 Total cost ratios (T2 full-investment vs. T1)

| Slot | T1 total→+5 (Cave, hardest T1 biome) | T2 total→+5 (Cave) | Ratio |
|---|--:|--:|--:|
| Weapon | 500 (Chaotic Axe) | 1,104 (Ruinous Axe) | **2.2x** |
| Armor | 622 (Bestial Hide) | 1,213 (Dire Bestial Hide) | **2.0x** |
| Recovery | 255 (Pulse Stone) | 483 (Resonant Gem) | **1.9x** |
| Mobility | 176 (Bat Wing Boots) | 335 (Cavern Sprints) | **1.9x** |

A ~2x essence jump per slot, tier-over-tier, is a plausible and even modest scaling step on its own — but it compounds with §1's new catalyst-on-craft requirement and §6's much larger ability-cost jump, so the *effective* felt cost increase crossing into T2 is larger than the essence ratio alone suggests.

---

## 6. Ability/Guard/Rune Economy

### 6.1 T2 Techniques/Guards (`shared/src/abilityRecipes.ts`)

| Ability | Kind | Biome/gate | Cost | T1-equivalent cost (rebalanced) | Ratio |
|---|---|---|---|---|--:|
| Hamstring | Technique | Jungle L3 | green 320 | Sweep: yellow 25 | **12.8x** |
| Bramble Guard | Guard | Jungle L5 | green 380 | Second Wind: green 25 | **15.2x** |
| Charge | Technique | Desert L3 | yellow 320 | — (Charge has no T1 analogue; compare to Expose Weakness 85) | 3.8x vs. the priciest T1 Technique |
| Endure | Guard | Desert L5 | yellow 380 | Brace: blue 45 | **8.4x** |

Classification: Charge and Hamstring are the *only* T2 Techniques and are each the sole Technique of their biome — both read as **required biome/mechanic counterplay** by the same logic T1 used for Sweep/Second Wind (each biome's opening Technique/Guard pair answers that biome's core mechanic). Under the T1 principle *"tools intended to let the player interact correctly with a biome mechanic should not require a large grind after they unlock,"* **T2 clearly violates it** — these are mandatory-feeling unlocks priced an order of magnitude above their T1 counterparts, with no documented rationale found in any current-state doc.

### 6.2 T2 Runes

No rune recipe found with `tier: 2` gates at a genuinely T2 biome level. Instead, four recipes are tagged `tier: 2` in their own data (`Surrounded`, `Focus Lowest HP`, `Let DoTs Finish`, `Spread DoTs` — `runeRecipes.ts:208-254`) but are all gated on **Swamp levels 2–4**, which is inside Swamp's *T1* band (levels 1–6) and reachable by a player who has never left tier 1. **CONCERN — naming/gating mismatch:** these runes are internally labeled tier-2 content but are unlockable during ordinary T1 Swamp farming; a player never actually needs to reach T2 to obtain them. Whether `tier` here is a display/GM-adjacent label unrelated to reachability, or a stale field left over from an earlier plan, needs a direct designer read — it does not affect legality (the reachability gate only checks `recipeGroup`/`requiredBiomeLevel`, not `tier`) but it is a real "recipe unlock timing doesn't match its own metadata" inconsistency.

**Separate, pre-existing discrepancy found (not new to T2):** the live `rune-recipe-step-back` (`runeRecipes.ts:178-191`) is gated on **`recipeGroup: "cave"`, cost `red 35`**, with a comment reading *"Cave's telegraphed slams are live from the moment the player enters Cave."* The T1 implementation ledger's own table (§4) describes Step Back as **Mountain L2, cost `blue 35`**. Live code is authoritative per this repo's own convention — the implementation ledger appears to be stale on this one rune, or Step Back was moved from Mountain to Cave after that ledger was written without the doc being updated. Flagged as a doc/code mismatch, not a T2-specific finding, but relevant to anyone using that ledger as ground truth going forward.

### 6.3 Obsolete/starter situations at T2

None found. The T1 `wait-for-regen`/`flee` starter-rune pattern (§T1 ledger §5/§11) has no T2 analogue — no T2 rune or ability recipe was found with a `deprecated` flag or a starter-owned action it duplicates.

---

## 7. T2 Resource Supply

### 7.1 Essence per kill (SOURCE FACT, `shared/src/data/monsters/jungle.monsters.ts`, `bossesT2.ts`)

| Monster | Tier | Essence (type) | Biome XP |
|---|--:|--:|--:|
| Jungle Snake (T2 trash) | 2 | 7 (green) | 38 |
| Jungle Ape (T2 trash) | 2 | 8 (green) | 44 |
| Vine Chameleon (T2 trash) | 2 | 7 (green) | 38 |
| Jungle Stalker (T2 elite) | 2 | 25 (green) | 150 |
| Silverback (T2 elite) | 2 | 35 (green) | 210 |
| Jungle Dread-Gorger (T2 boss) | 2 | 145 (green) | 218 |

Compared to T1's Plains anchor (Field Hare 2 essence/10 XP, Boar 3/18 — T1 baseline §4), T2 trash mobs reward **~3–4x** more essence per kill and T2 elites **~10x+** — a much steeper per-kill reward curve than the ~2x per-slot gear cost ratio in §5.2, which is directionally correct (higher-tier content should pay more per kill) but was not independently validated against runtime kill rate, spawn density, or `BIOME_ESSENCE_TIER_MULT` (`gameConfig.ts:150-152`, which **dampens** essence by ×0.85 at tier 2 — applied multiplicatively after the raw reward, so the effective T2 per-kill essence is 15% lower than the raw table above).

### 7.2 Catalyst weight

No T2 monster file sets `catalystWeight` explicitly (same convention as T1) — it defaults to the monster's own `essence` value (`server/src/systems/player/progression/rewards.ts:206-207`, unchanged mechanism from T1). Catalyst family is assigned by the **node's modifier**, not the monster or biome (§8 below); `CATALYST_PROGRESS_PER_UNIT = 100` is a flat, tier-independent threshold (`gameConfig.ts:158`) — it does not scale with tier even though per-kill essence (and therefore per-kill catalyst weight) does, meaning catalyst minting *rate* rises with tier progression naturally, but the redesign should be aware the 100-unit threshold itself has never moved.

### 7.3 Which T2 monsters are "in scope"

`jungle.monsters.ts` and `desert.monsters.ts` (not read line-by-line here beyond the excerpt above) appear to author their full tier-2 roster inline per-biome rather than mixing tiers in one file (unlike the five T1-spanning biome files, which the T1 baseline noted already contain T2-tagged monsters alongside T1 ones — e.g. Prairie Wolf, Ancient Wolf). **A T2 player's five "returning" biomes therefore mix T1 and T2 monsters in the same file/table**, while Jungle/Desert are pure T2. This structural difference (uniform new-biome files vs. mixed legacy-biome files) is a pre-existing T1-baseline finding, not new, but matters for anyone trying to isolate "T2 monsters actually encountered during T2 progression" — the returning biomes' higher-level nodes are where the T2-tagged trash (Prairie Wolf, Ancient Wolf, etc., per the T1 baseline's own table) actually spawns.

---

## 8. Canonical T2 Route Economic Demand

**No T2 canonical route exists.** `bot/src/routes/index.ts` and every file in `bot/src/routes/` is suffixed `T1` (`apprenticeT1.ts`, `conduitT1.ts`, `slingerT1.ts`, `spiritT1.ts`, `squireT1.ts`, `strikerT1.ts`, plus their `V2`/`BraceTank`/`MurkEyeOnly` variants) — there is no `t2RouteBuilder.ts`, no `t2GearPlans.ts`, and no `T2_CONTROLLED_ROUTE_IDS`. `docs/README.md`'s own index confirms the bot harness's scope is "a Striker T1 route" and lists no T2 extension.

Per the task's own instruction not to invent missing routes, the closest live authoritative behavior is the **gate structure itself** (§2, §3): a T2 character's forced path is determined entirely by `requiredBiomeLevel`/GM gates, with no authored "canonical order" or per-class gear plan analogous to `t1GearPlans.ts`. The T2-T4 numerical baseline handoff (`docs/briefs/t2-t4-numerical-baseline-handoff-2026-08-23.md` §3) independently confirms this gap at the *monster-difficulty* level: **"the exact biome ordering and exact checkpoint assigned to each T2 biome are not locked yet... Do not silently infer a canonical seven-biome order."** The placeholder order in `tools/tier-table.ts` (`plains, forest, swamp, mountain, cave, jungle, desert`) is explicitly marked non-canonical by that same document.

**Implication for the redesign:** there is no "class/route cost total" to extract for T2 because there is no authored route to total. Building a T2 canonical route (bot-side, mirroring T1's architecture) is a prerequisite for ever validating T2 pacing the way T1's 1× runs validated T1 — this is a gap the redesign should either explicitly schedule or explicitly defer, not silently inherit.

---

## 9. T1→T2 Scaling Comparison

All T1 figures are the **finalized/implemented** values (T1 implementation ledger), not the pre-rebalance baseline.

| Metric | T1 (finalized) | T2 | Ratio (T2/T1) |
|---|--:|--:|--:|
| Biome XP to reach cap (cumulative, own curve) | 3,402 (level 6) | 3,402 → level 12 costs the same *shape* re-based per `biomeXpForBiomeLevel` (Jungle/Desert level 6 = 3,402 own-curve XP) | **1.0x within a biome's own curve** — a biome's own level-6-equivalent always costs what a T1 biome's level 6 costs; the "T2 grind" is in the *number of levels* (6 more per returning biome), not curve steepness |
| Sample trash-mob essence (anchor biome) | Field Hare 2 (yellow) | Jungle Snake 7 (green) | **3.5x** |
| Sample elite/pack essence | Boar 3 | Silverback 35 | **11.7x** |
| Boss essence | 100–110 | 145–160 | **~1.45x** |
| Boss catalyst bundle | 5, on every boss | **0, on every boss** | **n/a — feature removed** |
| Base weapon cost (Cave, hardest) | 26 (Chaotic Axe) | 60 (Ruinous Axe) | **2.3x** |
| Base armor cost (Cave) | 22 (Bestial Hide) | 54 (Dire Bestial Hide) | **2.5x** |
| Total weapon →+5 (Cave) | 500 | 1,104 | **2.2x** |
| Total armor →+5 (Cave) | 622 | 1,213 | **2.0x** |
| Charm/mobility totals (Cave) | 255 / 176 | 483 / 335 | **1.9x / 1.9x** |
| Counterplay-tool cost (cheapest mandatory Technique/Guard) | 25 (Sweep, Second Wind) | 320 (Hamstring, Charge) | **12.8x** |
| Catalyst demand per weapon to +5 | 0–1 unit (only 9/20 items, +5 only) | **2 units on the base craft alone**, before any upgrade | **structural, not ratio-comparable** |
| RP availability (biome-maxed) | 11 | 15 | **1.36x** |
| Evolution/reconstruction total cost (rapier lineage only) | Flash Rapier →+5 = 500 | Gale Needle full lineage ≈ 2,090–2,100 | **~4.2x** |
| GM band width for item upgrades | 30 (0→30) | 42 (30→72) | 1.4x wider, but item costs inside it rose 2x — the GM gate widened *slower* than the essence cost did |

**The one metric that jumps far out of proportion to everything else is counterplay-tool cost (12.8–15.2x) and the catalyst-on-craft structural change** — both dwarf the otherwise-coherent ~2x gear/~1.45x boss-essence scaling that the rest of the table shows.

---

## 10. Economic Coherence Findings

**Source/data defect (contradiction or unreachable content):** none found. `recipeGates.test.ts` enforces reachability (biome-tier existence, GM-cap compliance, catalyst-family-vs-ban compliance) with an **empty debt list** — every T2 recipe checked is legally reachable. No T2 recipe was found gated above its own biome's cap, and no T2 catalyst family is banned in the biome that requires it.

**Likely legacy economic residue:**
- Ability/Technique/Guard costs at T2 (320–380 essence) were almost certainly authored against the *pre-rebalance* T1 cost scale (T1 Techniques used to cost 150–190 essence before the 2026-08-28 pass) and never revisited after T1 dropped by ~85%. This produced an accidental ~13–15x cliff that no single author likely intended as a deliberate design step (§6.1, §9).
- Gale Needle/Thorn Needle's doubling-to-+5 upgrade curve (§5.1) mirrors the exact shape the T1 pass explicitly moved Flash Rapier away from — the fix did not propagate to the T2 children of the item it fixed.
- The vanished boss `catalystBundle` at T2 (§1, §2.2, §9) looks like an omission relative to the T1 pattern rather than a deliberate removal — nothing in any current-state doc documents a decision to retire boss catalyst bundles at T2.

**Pacing hypothesis (needs runtime evidence, not resolved here):**
- Whether the ~2x per-slot gear cost jump (§5.2) is affordable given T2's ~3.5–11.7x trash/elite essence growth (§9) cannot be assessed without a real 1× run — no T2 bot route exists to produce one (§8).
- Whether `BIOME_ESSENCE_TIER_MULT`'s 0.85 dampener at T2 (§7.1) meaningfully slows gearing given the ~2x cost rise is likewise unmeasured.

**Intentional-looking specialization (asymmetry with a plausible reason — do not flatten):**
- The Forest rapier being the sole evolution lineage is explicitly documented as a deliberate "worked example" (`docs/gear-evolution-current-state.md`), not an oversight — the other 18 lineages are openly deferred, not silently missing.
- Jungle/Desert's per-item catalyst family tags matching their own native modifier (alacrity, dominion respectively) while Cave's T2 gear is tagged `swarming` against Cave's own native `dominion`, and Forest's core is tagged `fortified` against Forest's own native `alacrity`, look like **deliberate item-identity choices** (each item's family-tag comment explains its own thematic rationale) rather than errors — but see the catalyst-wall concern below, which is a real consequence regardless of intent.

**Designer decision required:**
1. Should the T1 ability/Technique/Guard cost philosophy (cheap, essence-only, no post-unlock grind for mandatory counterplay) be extended to T2's Charge/Hamstring/Endure/Bramble Guard, given they read as the same category of content T1 explicitly cheapened? (§6.1, §9)
2. Should more T1→T2 gear lineages be authored (evolve/reconstruct), or is full independent-recipe replacement the intended T2 shape for the 18 non-rapier items? (§4.2)
3. Was removing the boss `catalystBundle` at T2 a deliberate call, or should it be restored in some form now that catalysts are load-bearing on every base craft? (§1, §9)
4. Is it intended that a player farming Cave for its own T2 gear (which needs `swarming` catalysts) is drawing on a family Cave does not natively produce (Cave's native is `dominion`), while the reachability test only guarantees the family isn't *banned*, not that it's *convenient*? (§3, §10)
5. Should Swamp and Mountain get a T2-band core to match Plains/Forest/Cave, or is asymmetric core availability across T2 biomes intentional? (§3)
6. Is the `tier: 2` field on Surrounded/Focus Lowest HP/Let DoTs Finish/Spread DoTs meaningful, given all four are reachable inside T1's own Swamp band (levels 2–4)? (§6.2)
7. Is a T2 canonical bot route (mirroring `t1RouteBuilder.ts`) needed before the T2 redesign can be validated the way T1's was, or should the redesign proceed on cost-table analysis alone and defer route-building? (§8)

---

## 11. Old Assumptions vs. Live Behavior

- `docs/gear-evolution-current-state.md` (2026-07-10-era) frames the rapier lineage as "the worked example," explicitly deferring the rest — **live behavior matches this old intent exactly**; nothing has silently regressed.
- `docs/aspects-catalysts-current-state.md` documents catalysts as "one per biome group" in its oldest resolved-choices section, but a later inline update (2026-07-24, same file) correctly describes the live modifier-family-based system — the file itself already flags its own supersession; **live code matches the newer note, not the older one.**
- The T1 implementation ledger's Step Back table (Mountain L2, blue 35) does not match live code (Cave L2, red 35) — **live code is authoritative**; this reads as an unrecorded post-ledger edit rather than an old-intent-vs-new-intent conflict, since no doc claims Step Back was deliberately moved.
- `docs/briefs/t2-t4-numerical-baseline-handoff-2026-08-23.md` is explicit that no T2 biome order is locked — **this document does not attempt to invent one**, consistent with that brief's own instruction.

---

## 12. Unknowns / Designer Decisions Needed

See the seven items enumerated in §10's final subsection — they are the material, redesign-relevant open questions. Additionally:

- Exact `desert.monsters.ts` roster/essence table was not fully extracted line-by-line (only the boss and a jungle sample were pulled in depth) — a full pass should read both `jungle.monsters.ts` and `desert.monsters.ts` completely before setting T2 reward targets.
- Whether `BIOME_XP_REWARD_MULT_BY_TIER`'s tier-2 value of 1.25 (`gameConfig.ts:146-148`, front-loading tier-2 biome XP by 25%) was calibrated against the current T2 recipe costs or predates them is unresolved.
- The Force Core's exact catalyst family (`cave.recipes.ts:250-262`) was located but not transcribed into this document's tables — confirm directly before citing a number.

---

## 13. Source Map

| Topic | File(s) |
|---|---|
| Biome XP, GM, level caps, RP-adjacent config | `shared/src/config/gameConfig.ts` |
| Item upgrade cost/GM-gate logic | `shared/src/systems/itemUpgrades.ts` |
| RP budget formula | `shared/src/runeDatabase.ts:755-771` |
| Seal/tier advancement | `shared/src/systems/tierAdvancement.ts` |
| T2-native biome recipes | `shared/src/data/recipes/jungle.recipes.ts`, `desert.recipes.ts` |
| T2 segments of returning biomes | `shared/src/data/recipes/{plains,forest,swamp,mountain,cave}.recipes.ts` (search `── T2 ──`) |
| Evolution/reconstruction data model | `shared/src/data/recipes/types.ts`, `docs/gear-evolution-current-state.md` |
| Techniques/Guards | `shared/src/abilityRecipes.ts` |
| Runes | `shared/src/runeRecipes.ts` |
| Stances | `shared/src/stanceRecipes.ts` |
| Rites (T3+ only) | `shared/src/riteRecipes.ts` |
| Node modifiers / catalyst families / bans / natives | `shared/src/world/nodeModifierTypes.ts`, `nodeModifiers.ts`, `docs/node-modifiers-current-state.md` |
| Catalyst grant/threshold mechanics | `server/src/systems/player/progression/rewards.ts` |
| Recipe reachability gate | `shared/src/data/recipeGates.test.ts` |
| T2 monster data | `shared/src/data/monsters/jungle.monsters.ts`, `desert.monsters.ts`, `bossesT2.ts` |
| Bot route registry (T1-only) | `bot/src/routes/index.ts`, `t1RouteBuilder.ts`, `t1GearPlans.ts` |
| T2-T4 monster-difficulty baseline | `docs/briefs/t2-t4-numerical-baseline-handoff-2026-08-23.md`, `docs/tier-balance-current-state.md` |
| T1 comparison anchor | `docs/briefs/T1_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-28.md`, `docs/briefs/T1_PROGRESSION_ECONOMY_BASELINE_2026-08-28.md` |
