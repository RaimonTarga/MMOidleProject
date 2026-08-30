# T3 Progression Economy Baseline

**Date:** 2026-08-29
**Purpose:** Source-of-truth audit of the current Tier 3 progression/economy, to ground a T3 redesign now that T1 (`docs/briefs/T1_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-28.md`) and T2 (`docs/briefs/T2_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-29.md`) have shipped. **Extraction and diagnosis only — no game data was changed to produce this document.**

**Method.** Direct source reads with `file:line` citations, plus throwaway read-only `tsx` scripts against the live `RECIPE_DATABASE` / `MONSTER_DATABASE` / `BIOME_DATABASE` / `NODE_BIOMES` / `NODE_MODIFIERS` / config functions (scripts deleted after use; no bots, no benches run). Anchors are the two shipped implementation ledgers — **not** the T1/T2 *baseline* documents, which record pre-rebalance figures.

Every claim is tagged:
- **SOURCE FACT** — read directly out of code/data
- **DERIVED** — computed from SOURCE FACTs
- **CONCERN** — diagnostic observation, no fix proposed
- **DESIGNER DECISION** — not resolvable from source

---

## 1. Executive Summary

1. **T3 gear can never reach +5 — and, on a normal route, never reaches +4 either.** The T3 item-tier GM band is `(72, 126]`, so +1..+5 open at Global Mastery **83 / 94 / 104 / 115 / 126** (`shared/src/systems/itemUpgrades.ts:39-45`, verified by evaluation). But the T3 world region contains only 7 biomes — **Plains and Forest have no T3 nodes at all** (`shared/src/world/map/regionT3.ts:16`). Maxing every biome a T3 player actually plays yields **GM 114** (DERIVED). GM 115 (+4) and GM 126 (+5) are reachable *only* by grinding Plains and Forest from level 12 → 18 in retired T2 nodes: **55,510 biome XP each**, ≈ 2,200 kills of outgrown T2 content (DERIVED, §2.4). This is the exact "retired-biome debt" that `shared/src/data/recipeGates.test.ts:46-57` calls "brutal" and holds at zero for recipes — the GM ceiling re-imposes it invisibly, and no test covers it.
2. **The evolution/reconstruction system stops dead at T2.** A repo-wide grep for `evolvesFrom` across `shared/src/data/recipes/*.ts` returns **21 hits, every one of them a tier-2 recipe**. Not a single T3 or T4 item carries `evolvesFrom`, `reconstructCost`, or a shared `lineageId` (cores/relics aside). Every T3 item is an independent `craftRecipe`; a player who took a T2 item to +5 gets **zero credit** at T3. The architecture the T2 pass built and proved across 21 lineages is dormant from T3 onward.
3. **T3 abilities cost 650–760 essence against T2's freshly-set 70–90 — a 7.2–10.9× cliff**, the same defect the T2 pass just fixed (T2 was 320–380 against T1's 25–90 and was cut by ~78%). `shared/src/abilityRecipes.ts:181,193,205,215`. Only 4 T3 abilities exist, both pairs homed in the two *new* biomes (Tundra, Volcanic); the five returning T3 biomes get no new ability at all.
4. **Catalyst payment inverts the T2 rule.** T2 shipped "base/evolution craft is catalyst-free; +4 costs 1, +5 costs 2" (T2 ledger §6). Every T3 gear item **except Volcanic's** charges **3 catalysts on the base craft and 0 on every upgrade step** — 12 catalysts per 4-slot biome kit, all up front. Volcanic's four T3 items charge **zero catalysts anywhere** (`shared/src/data/recipes/volcanic.recipes.ts:9-77`), an unexplained hole in an otherwise uniform rule.
5. **Two systems that were previously catalyst-light explode at T3, and one system vanishes.** T3 Stances charge **5** catalysts (T2 stances were normalised to exactly 1 by the T2 pass); T3 Rites — an entirely new system, all six of them tier 3 — charge **4–6** catalysts each plus 2–5 Runic Points from the same pool the Runes use. Meanwhile **there are zero tier-3 Rune recipes**: `shared/src/runeRecipes.ts` runs T1 (11) → T2 (4) → **nothing** → T4 (1).

Additional headline, resolving a T2 open question: **boss catalyst bundles no longer exist anywhere in the game.** `catalystBundle` has been removed from `MonsterDefinition` (`shared/src/data/monsters/types.ts`, uncommitted working-tree change), stripped from all five T1 bosses (`bossesT1.ts`), and the granting code is gone from `server/src/systems/player/progression/rewards.ts`. The only surviving reference is stale build output in `shared/dist/`. Per-kill `catalystWeight` accumulation is now the sole catalyst source in the game.

---

## 2. T3 Progression / Gating

### 2.1 Formulas and their T3 values (SOURCE FACT unless noted)

| Mechanic | Source | T2 value | T3 value |
|---|---|---|---|
| `BIOME_LEVELS_PER_TIER` | `gameConfig.ts:225` | 6 | 6 |
| `biomeLevelCap(3, group)` = `(3 − startTier + 1) × 6` | `gameConfig.ts:249-259` | — | mountain/cave/forest/plains/swamp **18**; jungle/desert **12**; tundra/volcanic **6** |
| `maxGlobalMasteryAtTier(t)` | `gameConfig.ts:302-309` | 72 | **126** |
| T3 item GM gates (+1..+5) | `itemUpgrades.ts:39-45` | T2: 38/47/55/64/72 | **83 / 94 / 104 / 115 / 126** |
| RP budget `8 + floor(GM/10)` | `runeDatabase.ts:769-771` | GM 72 → **15** | GM 114 → **19**; GM 126 → **20** |
| Seals to advance | `tierAdvancement.ts:33` | T2→T3: **3 of 7** | T3→T4: **4 of 7** |
| `BIOME_ESSENCE_TIER_MULT[tier]` | `gameConfig.ts:150-152` | 0.85 | **0.70** |
| `BIOME_XP_REWARD_MULT_BY_TIER[tier]` | `gameConfig.ts:146-148` | 1.25 | **1.00** |
| `MODIFIER_MAGNITUDE_BY_TIER[tier]` | `nodeModifiers.ts:93-98` | 0.10 | **0.15** |
| Technique slots | `abilities.ts:295-300` | 1 | **2** (opens at player tier 3) |
| Guard slots | `abilities.ts:295-300` | 1 | 1 (2 at T4) |
| Rites UI/system visibility | `systems/systemVisibility.ts:133-136` | hidden | **visible at playerTier ≥ 3** |
| Range node (melee/ranged core eligibility) | `systems/skills.ts:27-46` + all skill costs = 1 + 1 skill point per tier-up (`questSystem.ts:23`) | not yet chosen | **chosen at player tier 3** (3rd skill point buys the tier-2 range node) |
| `CATALYST_PROGRESS_PER_UNIT` | `gameConfig.ts:158` | 100 | 100 (tier-independent) |

### 2.2 T3 biome roster (SOURCE FACT: `shared/src/world/map/regionT3.ts:16`, `shared/src/biomeDatabase.ts`)

The T3 region's seven biomes, in the difficulty order **locked with the user 2026-08-23** (`docs/tier-balance-current-state.md:31`):

`swamp → mountain → cave → jungle → desert → tundra → volcanic`

| Biome | Start tier | Cap at T3 | T3 band | Native catalyst | Banned | T3 boss | Boss essence | Boss XP |
|---|---|---|---|---|---|---|---|---|
| Swamp | 1 | 18 | L13–18 | fortified | — | Rot-Spore Croc Behemoth | 345 purple | 518 |
| Mountain | 1 | 18 | L13–18 | heavy | alacrity | Crag-Gorged Horn Behemoth | 340 blue | 510 |
| Cave | 1 | 18 | L13–18 | dominion | — | Deep-Core Burrow Gorger | 355 red | 530 |
| Jungle | 2 | 12 | L7–12 | alacrity | heavy | Apex Bramble Slasher | 340 green | 510 |
| Desert | 2 | 12 | L7–12 | dominion | alacrity | Dune-Carapace Monarch | 345 yellow | 518 |
| **Tundra** (debuts T3) | 3 | 6 | L1–6 | heavy | alacrity | Frost-Plated Rime Mammoth | 350 blue | 525 |
| **Volcanic** (debuts T3) | 3 | 6 | L1–6 | swarming | — | Cinder-Shell Magma Salamander | 360 red | 540 |
| ~~Plains~~ | 1 | 18 (nominal) | **no T3 nodes** | none | — | none | — | — |
| ~~Forest~~ | 1 | 18 (nominal) | **no T3 nodes** | alacrity | heavy | none | — | — |

`bossPoolByTier[3]` is empty for plains and forest, and `monsterPoolByTier[3]` is absent for both (`biomeDatabase.ts:77-131`). No T3 boss grants a catalyst bundle — no boss anywhere does (§1, §15).

### 2.3 Chronological T3 unlock table (SOURCE FACT)

Gate = `recipeGroup` + `requiredBiomeLevel`. All 38 tier-3 item recipes plus abilities/stances/rites.

| Biome level | Unlock | Category | Base cost | Base catalyst |
|---|---|---|---|---|
| **Enter T3** | 3 of 7 T2 boss seals | tier gate | — | — |
| Tundra L1 | Permafrost Maul | weapon | blue 124 | heavy 3 |
| Volcanic L1 | Cinderlash | weapon | red 140 | **none** |
| Tundra L2 | Glacial Bulwark | armor | blue 100 / red 25 | heavy 3 |
| Volcanic L2 | Emberforge Plate | armor | red 120 / yellow 30 | **none** |
| Tundra L3 | Rimebrand (2nd weapon), Frostward Charm, **Scout Core**, **Binding Strike** | weapon/charm/core/Technique | blue 120 · blue 75/purple 25 · blue 110 · **blue 650** | fortified 3 · heavy 3 · heavy 3 · none |
| Volcanic L3 | Magmaheart Stone, **Catalyst Core**, **Frenzy** | charm/core/Technique | red 75/yellow 25 · red 90 · **red 650** | none · swarming 2 · none |
| Tundra L4 | Glacier Striders | mobility | blue 80 | heavy 3 |
| Volcanic L4 | Magma Walkers | mobility | red 74 | **none** |
| Tundra L5 | **Break Free** (Guard) | Guard | **blue 760** | none |
| Tundra L5 | **Mechanic Renewal** (Rite) | Rite | blue 160 / yellow 60 | **heavy 6** |
| Volcanic L5 | **Quick Strike** (Technique) | Technique | **red 760** | none |
| Volcanic L5 | **Blood Offering** (Rite), **Brawler Stance** | Rite/Stance | red 130/green 40 · yellow 130/red 50 | **swarming 5** · **swarming 5** |
| Desert L7 | Solar Falchion | weapon | yellow 116 | dominion 3 |
| Jungle L7 | Venomthorn Rapier | weapon | green 120 | alacrity 3 |
| Desert L8 | Eternal Duneplate | armor | yellow 120 / purple 30 | dominion 3 |
| Jungle L8 | Wildgrowth Weave | armor | green 90 / yellow 30 | alacrity 3 |
| Desert L9 | Oasis Heart, **Sniper Core** | charm/core | yellow 100/purple 25 · yellow 110 | dominion 3 · dominion 3 |
| Jungle L9 | Worldvine Heart, **Bruiser Core** | charm/core | green 100 · green 110 | alacrity 3 · alacrity 3 |
| Desert L10 | Mirage Striders | mobility | yellow 90 | dominion 3 |
| Jungle L10 | Canopy Striders | mobility | green 90 | alacrity 3 |
| Desert L11 | **Berserker Stance**, **Ability Reprieve** (Rite) | Stance/Rite | red 140/purple 40 · red 160/purple 60 | **dominion 5** · **dominion 6** |
| Jungle L11 | **Predator Stance**, **Accelerant Core** | Stance/core | green 130/red 50 · green 90 | **alacrity 5** · alacrity 2 |
| Mountain L13 | Avalanche Maul | weapon | blue 116 | heavy 3 |
| Cave L13 | Cataclysm Axe | weapon | red 120 | swarming 3 |
| Swamp L13 | Plague Fang | weapon | purple 116 | fortified 3 |
| Swamp L13 | **Execute Stance** | Stance | purple 130 / red 50 | **fortified 5** |
| Mountain L14 | Summit Aegis, **Juggernaut Core** | armor/core | blue 116/red 29 · blue 110 | heavy 3 · heavy 3 |
| Cave L14 | Deepscale Hide | armor | red 116 / yellow 29 | swarming 3 |
| Swamp L14 | Plaguebound Shroud | armor | purple 140 | fortified 3 |
| Mountain L15 | Bastion Heart | charm | blue 100 / red 25 | heavy 3 |
| Cave L15 | Echo Geode, **Duelist Core**, **Swift Repose** (Rite) | charm/core/Rite | red 100/green 25 · red 110 · red 120 | swarming 3 · dominion 3 · **dominion 4** |
| Swamp L15 | Sorrow Eye, **Controller Core**, **Purification** (Rite) | charm/core/Rite | purple 100 · purple 90 · purple 120/green 40 | fortified 3 · fortified 2 · **fortified 4** |
| Mountain L15 | **Lingering Battle** (Rite) | Rite | blue 130 / yellow 40 | **heavy 5** |
| Mountain L16 | Peak Stride | mobility | blue 100 | heavy 3 |
| Cave L16 | Echostep Treads | mobility | red 100 | swarming 3 |
| Swamp L16 | Mire Striders | mobility | purple 100 | fortified 3 |
| Mountain L17 | **Arcanist Core** | core | blue 90 | swarming 2 |
| — | **No tier-3 Rune recipe exists.** | — | — | — |
| **Leave T3** | 4 of 7 T3 boss seals | tier gate | — | — |

### 2.4 The Global Mastery ceiling (DERIVED — the load-bearing finding)

`maxGlobalMasteryAtTier(3) = 126` sums `biomeLevelCap(3, group)` over **all** biome groups, including plains (18) and forest (18) — biomes with no T3 nodes.

| Scenario | Plains | Forest | Mtn | Cave | Swamp | Jungle | Desert | Tundra | Volc | **GM** | Highest T3 `+N` |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Every T3-playable biome maxed, Plains/Forest left at their T2 cap | 12 | 12 | 18 | 18 | 18 | 12 | 12 | 6 | 6 | **114** | **+3** (needs 104) |
| Same, plus Plains/Forest ground to 18 in T2 nodes | 18 | 18 | 18 | 18 | 18 | 12 | 12 | 6 | 6 | **126** | **+5** |

Cost of that last step: `biomeXpForBiomeLevel('plains', 18) − (…,12)` = `81,791 − 26,281` = **55,510 XP**, identically for forest. T2 Plains trash grants 35–40 `biomeXp` × `BIOME_XP_REWARD_MULT_BY_TIER[2] = 1.25` × a node-modifier premium ≈ 50/kill ⇒ **≈ 1,100 kills per biome, ≈ 2,200 total**, purely to unlock the top two upgrade steps on gear from an entirely different region.

`server/src/systems/player/economy/itemUpgrade.ts:53` passes the live `globalMastery(...)` into `checkUpgrade`, so this ceiling is enforced, not advisory. `docs/system-rework-status.md:153` states the intent plainly — "+5 lands at full tier mastery (T1 @ GM 30, T2 @ 72, T3 @ 126, T4 @ 198)" — apparently written before Plains/Forest were retired from T3, and its T4 figure (198) already disagrees with the live `maxGlobalMasteryAtTier(4) = 192`.

**CONCERN.** `shared/src/data/recipeGates.test.ts` enforces exactly this class of problem for *recipes* (rule 1: "a recipe must sit in a biome that has nodes at its own tier") and keeps `RETIRED_BIOME_DEBT` empty. The GM ceiling reintroduces the same debt through a different door and has no equivalent invariant.

---

## 3. T3 Biome Roster and Retirement Status

`design_docs/archive/tier3-design-plan.md §1` is the design intent: *"Active T3 biomes (7): Mountain, Swamp, Cave, Desert, Jungle, Volcano (new), Tundra (new). Retire at T2: Plains, Forest. No mechanic is orphaned."* **Live source matches this exactly** — this is a cleanly executed retirement, not drift.

| Biome | T3 gear | T3 core | T3 ability | T3 Rune | T3 Stance | T3 Rite | T3 monsters/boss | Mechanic re-housed to | Practical status |
|---|--:|--:|--:|--:|--:|--:|---|---|---|
| Swamp | 4 | 1 (Controller) | 0 | 0 | 1 (Execute) | 1 (Purification) | 3 + boss | — (persists) | **Active** |
| Mountain | 4 | 2 (Juggernaut, Arcanist) | 0 | 0 | 0 | 1 (Lingering Battle) | 3 + boss | — (persists) | **Active** |
| Cave | 4 | 1 (Duelist) | 0 | 0 | 0 | 1 (Swift Repose) | 3 + boss | — (persists) | **Active** |
| Jungle | 4 | 2 (Bruiser, Accelerant) | 0 | 0 | 1 (Predator) | **0** | 3 + boss | inherits Forest | **Active** (only T3 biome with no Rite) |
| Desert | 4 | 1 (Sniper) | 0 | 0 | 1 (Berserker) | 1 (Ability Reprieve) | 2 + boss | — (persists) | **Active** |
| Tundra | **5** (2 weapons) | 1 (Scout) | **2** | 0 | 0 | 1 (Mechanic Renewal) | 3 + boss | inherits Swamp's frost-DoT line | **Active** (debut) |
| Volcanic | 4 | 1 (Catalyst) | **2** | 0 | 1 (Brawler) | 1 (Blood Offering) | 4 + boss | inherits Plains | **Active** (debut) |
| **Plains** | **0** | 0 (Tempered is T2, L7) | 0 | 0 | 0 (Perfection is T2, L8) | 0 | **none** | → Volcanic | **Retired**, except as a GM/essence-XP source (§2.4) |
| **Forest** | **0** | 0 (Survivalist is T2, L7) | 0 | 0 | 0 (3 T2 stances at L7–8) | 0 | **none** | → Jungle | **Retired**, same caveat |

**Progression-support only:** Plains and Forest remain the sole route to GM 115+ (§2.4) and remain the only source of tier-2-rate yellow/green essence, but produce no T3 content of any kind.

---

## 4. Complete Recipe / Cost Inventory

### 4.1 Content census (SOURCE FACT, counted from the live databases)

| System | T1 | T2 | **T3** | T4 |
|---|--:|--:|--:|--:|
| Item — weapon | 5 | 8 | **8** | 10 |
| Item — armor | 5 | 7 | **7** | 10 |
| Item — recovery | 5 | 7 | **7** | 11 |
| Item — mobility | 5 | 7 | **7** | 8 |
| Item — core | 0 | 3 | **9** | 0 |
| Item — relic | 0 | 0 | **0** | 8 |
| Ability (Technique/Guard) | 6 | 4 | **4** | 4 |
| Rune | 11 (2 deprecated) | 4 | **0** | 1 |
| Stance | 0 | 6 | **4** | 1 |
| Rite | 0 | 0 | **6** | 0 |

### 4.2 T3 ordinary equipment — full cost table (SOURCE FACT)

Essence keys: b=blue, r=red, g=green, y=yellow, p=purple. "Total→+5" = base + all five steps. No T3 item has a predecessor, so `evolvesFrom` / `reconstructCost` are absent throughout (§5).

| Biome | Item | Slot | Gate | Base essence | Base catalyst | +1 | +2 | +3 | +4 | +5 | Upgrade catalyst | **Total→+5** | Total catalyst |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tundra | Permafrost Maul | weapon | L1 | b124 | heavy 3 | b186 | b372 | b744 | b744 | b744 | none | **b2,914** | 3 heavy |
| Tundra | Rimebrand | weapon | L3 | b120 | **fortified 3** | b180 | b360 | b720 | b720 | b720 | none | **b2,820** | 3 fortified |
| Tundra | Glacial Bulwark | armor | L2 | b100/r25 | heavy 3 | b90/r40 | b180/r60 | b270/r80 | b270/r80 | b270/r80 | none | **b1,180 / r365** | 3 heavy |
| Tundra | Frostward Charm | recovery | L3 | b75/p25 | heavy 3 | b50/p25 | b100/p50 | b200/p100 | b200/p100 | b200/p100 | none | **b825 / p400** | 3 heavy |
| Tundra | Glacier Striders | mobility | L4 | b80 | heavy 3 | b30 | b60 | b100 | b100 | b100 | none | **b470** | 3 heavy |
| Volcanic | Cinderlash | weapon | L1 | r140 | **none** | r200 | r400 | r800 | r800 | r800 | none | **r3,140** | **0** |
| Volcanic | Emberforge Plate | armor | L2 | r120/y30 | **none** | r100/y50 | r200/y100 | r400/y200 | r400/y200 | r400/y200 | none | **r1,620 / y780** | **0** |
| Volcanic | Magmaheart Stone | recovery | L3 | r75/y25 | **none** | r50/y25 | r100/y50 | r200/y100 | r200/y100 | r200/y100 | none | **r825 / y400** | **0** |
| Volcanic | Magma Walkers | mobility | L4 | r74 | **none** | r30 | r62 | r104 | r104 | r104 | none | **r478** | **0** |
| Desert | Solar Falchion | weapon | L7 | y116 | dominion 3 | y170 | y340 | y570 | y570 | y570 | none | **y2,336** | 3 dominion |
| Desert | Eternal Duneplate | armor | L8 | y120/p30 | dominion 3 | y100/p50 | y200/p100 | y450/p150 | y450/p150 | y450/p150 | none | **y1,770 / p630** | 3 dominion |
| Desert | Oasis Heart | recovery | L9 | y100/p25 | dominion 3 | y35/p25 | y140/p35 | y280/p70 | y280/p70 | y280/p70 | none | **y1,115 / p295** | 3 dominion |
| Desert | Mirage Striders | mobility | L10 | y90 | dominion 3 | y40 | y80 | y138 | y138 | y138 | none | **y624** | 3 dominion |
| Jungle | Venomthorn Rapier | weapon | L7 | g120 | alacrity 3 | g180 | g270 | g360 | g360 | g360 | none | **g1,650** | 3 alacrity |
| Jungle | Wildgrowth Weave | armor | L8 | g90/y30 | alacrity 3 | g100/y50 | g225/y75 | g300/y150 | g300/y150 | g300/y150 | none | **g1,315 / y605** | 3 alacrity |
| Jungle | Worldvine Heart | recovery | L9 | g100 | alacrity 3 | g75 | g150 | g225 | g225 | g225 | none | **g1,000** | 3 alacrity |
| Jungle | Canopy Striders | mobility | L10 | g90 | alacrity 3 | g25 | g50 | g100 | g100 | g100 | none | **g465** | 3 alacrity |
| Mountain | Avalanche Maul | weapon | L13 | b116 | heavy 3 | b174 | b348 | b588 | b588 | b588 | none | **b2,402** | 3 heavy |
| Mountain | Summit Aegis | armor | L14 | b116/r29 | heavy 3 | b130/r44 | b260/r88 | b390/r132 | b390/r132 | b390/r132 | none | **b1,676 / r557** | 3 heavy |
| Mountain | Bastion Heart | recovery | L15 | b100/r25 | heavy 3 | b50/r25 | b100/r50 | b150/r75 | b150/r75 | b150/r75 | none | **b700 / r325** | 3 heavy |
| Mountain | Peak Stride | mobility | L16 | b100 | heavy 3 | b20 | b42 | b75 | b75 | b75 | none | **b387** | 3 heavy |
| Cave | Cataclysm Axe | weapon | L13 | r120 | **swarming 3** | r174 | r348 | r588 | r588 | r588 | none | **r2,406** | 3 swarming |
| Cave | Deepscale Hide | armor | L14 | r116/y29 | swarming 3 | r135/y45 | r270/y90 | r450/y150 | r450/y150 | r450/y150 | none | **r1,871 / y614** | 3 swarming |
| Cave | Echo Geode | recovery | L15 | r100/g25 | swarming 3 | r50/g25 | r112/g38 | r200/g50 | r200/g50 | r200/g50 | none | **r862 / g238** | 3 swarming |
| Cave | Echostep Treads | mobility | L16 | r100 | swarming 3 | r30 | r60 | r105 | r105 | r105 | none | **r505** | 3 swarming |
| Swamp | Plague Fang | weapon | L13 | p116 | fortified 3 | p170 | p340 | p696 | p696 | p696 | none | **p2,714** | 3 fortified |
| Swamp | Plaguebound Shroud | armor | L14 | p140 | fortified 3 | p180 | p360 | p720 | p720 | p720 | none | **p2,840** | 3 fortified |
| Swamp | Sorrow Eye | recovery | L15 | p100 | fortified 3 | p75 | p150 | p300 | p300 | p300 | none | **p1,225** | 3 fortified |
| Swamp | Mire Striders | mobility | L16 | p100 | fortified 3 | p30 | p60 | p105 | p105 | p105 | none | **p505** | 3 fortified |

Sources: `shared/src/data/recipes/{tundra,volcanic,desert,jungle,mountain,cave,swamp}.recipes.ts`, tier-3 blocks.

### 4.3 Full-kit totals per biome (DERIVED, one weapon each)

| Biome | Home essence, kit→+5 | Splash essence | Catalysts (all up front) |
|---|--:|--:|--:|
| Swamp | p7,284 | — | 12 fortified |
| Mountain | b5,165 | r882 | 12 heavy |
| Cave | r5,644 | y614 + g238 | 12 swarming |
| Jungle | g4,430 | y605 | 12 alacrity |
| Desert | y5,845 | p925 | 12 dominion |
| Tundra (Maul route) | b5,389 | r365 + p400 | 9 heavy + 0 fortified |
| Tundra (Rimebrand route) | b5,295 | r365 + p400 | 6 heavy + 3 fortified |
| Volcanic | r6,063 | y1,180 | **0** |

### 4.4 Mechanic identity of each T3 item (SOURCE FACT — for lineage/handoff reading, §6)

| Biome | Weapon | Armor | Charm | Boots |
|---|---|---|---|---|
| Tundra | Permafrost Maul — brittle stacks (`weapon.brittle-*`), aps 0.50 · Rimebrand — frost DoT conv 0.70, aps 0.60 | stationary-ramp DR + damage cap | barrier 0.12 + absorb 0.08 | ramp-speed momentum |
| Volcanic | Cinderlash — flurry, aps 1.65 | hardening (per-sec/max/reset) | active Recovery + on-kill Recovery | passive-speed with suppress |
| Desert | Solar Falchion — first-strike ×2.5, aps 0.80 | cheat-death + cleanse + debuff resist | cleanse + empty-heal | kite-speed |
| Jungle | Venomthorn Rapier — on-hit 18, aps 1.65 | evasion 0.40 | ramping Recovery | aggro-pull |
| Mountain | Avalanche Maul — empowered-mult, aps 0.55 | guard potency + damage cap | barrier 0.28 | approach-speed |
| Cave | Cataclysm Axe — dead-swing, aps 1.20 | flat %DR 0.19 + plating | absorb 0.20 | stealth |
| Swamp | Plague Fang — poison DoT conv 0.50, aps 1.00 | DoT resist + hit-to-dot + debuff resist | recovery pulse | slow resist |

### 4.5 T3 Cores, Stances and Rites (separated from ordinary equipment)

**Cores** — off the `+N` track entirely (`itemUpgrades.ts:81-84`); they rank up by evolution, which is unimplemented (`evolution.ts` — `requiredPlusFor` returns 0 for cores, but no core carries `evolvesFrom`).

| Core | Biome | Gate | Eligibility | Essence | Catalyst | Economy note |
|---|---|--:|---|--:|--:|---|
| Scout | tundra | L3 | ranged | blue 110 | heavy 3 | comment notes alacrity is banned in Tundra |
| Catalyst | volcanic | L3 | unrestricted | red 90 | swarming 2 | native family |
| Sniper | desert | L9 | ranged | yellow 110 | dominion 3 | native |
| Bruiser | jungle | L9 | melee | green 110 | alacrity 3 | comment notes heavy is banned in Jungle |
| Accelerant | jungle | L11 | unrestricted | green 90 | alacrity 2 | native |
| Juggernaut | mountain | L14 | melee | blue 110 | heavy 3 | native |
| Duelist | cave | L15 | melee | red 110 | dominion 3 | native |
| Controller | swamp | L15 | unrestricted | purple 90 | fortified 2 | native |
| Arcanist | mountain | L17 | unrestricted | blue 90 | **swarming 2** | non-native (1 swarming node in Mountain) |

**Stances (tier 3)** — `shared/src/stanceRecipes.ts:44-50`

| Stance | Biome | Gate | Essence | Catalyst |
|---|---|--:|---|--:|
| Berserker | desert | L11 | red 140 / purple 40 | **dominion 5** |
| Predator | jungle | L11 | green 130 / red 50 | **alacrity 5** |
| Brawler | volcanic | L5 | yellow 130 / red 50 | **swarming 5** |
| Execute | swamp | L13 | purple 130 / red 50 | **fortified 5** |

**Rites (all tier 3)** — `shared/src/riteRecipes.ts:28-45`, RP costs from `shared/src/rites.ts:16-57`

| Rite | Biome | Gate | Essence | Catalyst | **RP** | Effect |
|---|---|--:|---|--:|--:|---|
| Swift Repose | cave | L15 | red 120 | dominion 4 | 2 | reach OOC recovery 50% sooner |
| Purification | swamp | L15 | purple 120 / green 40 | fortified 4 | 3 | strip harmful carryover at combat end |
| Lingering Battle | mountain | L15 | blue 130 / yellow 40 | heavy 5 | 2 | stay in combat state 50% longer |
| Blood Offering | volcanic | L5 | red 130 / green 40 | swarming 5 | 3 | recover 5% max HP on kill credit |
| Mechanic Renewal | tundra | L5 | blue 160 / yellow 60 | heavy 6 | 5 | partially prepare class mechanic at combat end |
| Ability Reprieve | desert | L11 | red 160 / purple 60 | dominion 6 | 5 | −30% remaining ability cooldowns at combat end |

---

## 5. T2 → T3 Lineage / Evolution Map

### 5.1 The finding: no T3 lineage exists

`grep -rn "evolvesFrom\|reconstructCost\|lineageId" shared/src/data/recipes/*.ts` returns **21 `evolvesFrom` entries, all tier 2** (the T1→T2 map from the T2 ledger §2), plus `lineageId` on cores and relics only, plus the `rapier` lineage tag on `flash-rapier`. **Zero T3 or T4 items participate.**

Consequences (SOURCE FACT + DERIVED):
- `checkEvolve` / `checkReconstruct` (`shared/src/systems/evolution.ts:82-160`) return `"This recipe is not an evolution."` for every T3 item. The evolve/reconstruct UI path never appears at T3.
- `EVOLUTION_REQUIRED_PLUS = 5` is untouched and irrelevant above T2.
- A player who took a T2 item to +5 (T2 ledger §5: an accelerating curve with ~70% of post-base spend in +4/+5, 3 catalysts) receives **no discount, no consumption path, and no essence credit** at T3.

### 5.2 Classification of every T3 item against the task's four buckets

Because no `evolvesFrom` exists, every T3 item is bucket **(4) independent replacement despite an obvious conceptual predecessor**, or bucket **(3) genuinely new** where the biome debuts. The distinction below is by *conceptual* lineage read from `attacksPerSecond`, mechanic keys and file headers (§4.4).

| T2 item (+5 investment) | T3 successor | Same biome? | Conceptual continuity | Live data link |
|---|---|---|---|---|
| Quake Hammer (mountain, empowered, aps 0.55) | Avalanche Maul (aps 0.55, `empowered-mult-bonus`) | yes | **strong** — same cadence, same key | **none** |
| Iron Crusader Plate (mountain) | Summit Aegis (`guard.potency-pct`, + damage cap) | yes | strong | none |
| Iron Bulwark (mountain, barrier) | Bastion Heart (`barrier-pct` 0.28) | yes | strong | none |
| Mountain Stride | Peak Stride (`approach-speed-pct`) | yes | strong | none |
| Ruinous Axe (cave) | Cataclysm Axe (`dead-swing-interval`) | yes | strong | none |
| Dire Bestial Hide (cave) | Deepscale Hide (flat %DR) | yes | strong | none |
| Resonant Gem (cave) | Echo Geode (`absorb-pct` 0.20) | yes | strong | none |
| Cavern Sprints | Echostep Treads (stealth) | yes | strong | none |
| Venom Knife (swamp) | Plague Fang (poison DoT conv) | yes | strong | none |
| Bog Wrappings (swamp) | Plaguebound Shroud | yes | strong | none |
| Bog Eye (swamp) | Sorrow Eye (recovery pulse) | yes | strong | none |
| Wetland Wraps | Mire Striders (slow resist) | yes | strong | none |
| Stinger Rapier (jungle) | Venomthorn Rapier (on-hit, aps 1.65) | yes | strong | none |
| Verdant Weave (jungle) | Wildgrowth Weave (evasion) | yes | strong | none |
| Canopy Heart (jungle) | Worldvine Heart (ramping recovery) | yes | strong | none |
| Vine Wraps | Canopy Striders | yes | strong | none |
| Sunsteel Falchion (desert) | Solar Falchion (first-strike) | yes | strong | none |
| Duneplate of the Last Stand | Eternal Duneplate (cheat-death + cleanse) | yes | strong | none |
| Mirage Talisman | Oasis Heart (cleanse) | yes | strong | none |
| Sand Sprint | Mirage Striders (kite-speed) | yes | strong | none |
| **Gale Needle / Thorn Needle** (forest, the game's only branched lineage) | **Venomthorn Rapier** (jungle) | **no — biome handoff** | forest→jungle re-house, documented in `tier3-design-plan.md §1` | none |
| Phantom Bindings / Ancient Heartroot / Windstep (forest) | Wildgrowth Weave / Worldvine Heart / Canopy Striders (jungle) | **no** | forest→jungle | none |
| Knight's Steelsword / Enduring Robe / Stalwart Heart / Gale Boots (plains) | Cinderlash / Emberforge Plate / Magmaheart Stone / Magma Walkers (volcanic) | **no** | plains→volcanic (plating → hardening, kill-chain recovery → on-kill recovery), documented `tier3-design-plan.md §1` | none |
| *(none)* | Permafrost Maul, Glacial Bulwark, Frostward Charm, Glacier Striders (tundra) | n/a | genuinely new (bucket 3) | n/a |
| **Swamp's frost line** (relocated) | Rimebrand (tundra) — file header: *"Tundra owns the FROST DoT weapon line (relocated from Swamp)"* (`tundra.recipes.ts:5-6`) | **no** | explicit re-house | none |

**Orphan check.** No T2 mechanic is left without a T3 home: every plains and forest mechanic has a documented and *implemented* successor (§6). What is orphaned is the **investment**, not the mechanic.

**Documented vs. live.** The conceptual lineage above matches `design_docs/archive/tier3-design-plan.md §1-§3` closely, with one drift: the plan assigns Plains' *kill momentum* boots to Volcano, and Volcanic's live boots carry `mobility.passive-speed-pct` + `suppress-ms` rather than a kill-momentum key (`volcanic.recipes.ts:66-76`). The plan's Tundra weapon was to be a *frost-debuff slow*; live Tundra ships a brittle maul plus the relocated Swamp frost-DoT brand instead. Both are design-direction changes, not defects.

**Economically meaningless T2 +5 investment (DERIVED):** all 21 T2 items. This is the single largest structural difference between the T2 pass and the current T3 data. **DESIGNER DECISION** (§20.1).

---

## 6. Biome Mechanic Handoffs

| Retiring mechanic (T2 home) | Key(s) | T3 home | Live evidence |
|---|---|---|---|
| Evasion / fast on-hit rapier | `evasion`, `onHitDamage`, aps ≥1.5 | **Jungle** | `jungle-vest-t3` evasion 0.40; `jungle-venomthorn-rapier` onHit 18 @ aps 1.65 |
| Recovery-stat foundation (Forest charm) | `recovery`, recovery-skill potency | **Jungle** | `jungle-charm-t3` ramping recovery 0.05→0.14 |
| Traversal speed (Forest boots) | speed | **Jungle** | `jungle-boots-t3` speed 44 + aggro-pull |
| Plating / swarm defence (Plains armor) | `plating` | **Volcanic**, matured into hardening | `volcanic-vest-t3` plating 20 + `hardening-per-sec/max/reset` |
| Kill-chain Recovery (Plains charm) | `defense.recovery-on-kill-pct` | **Volcanic** | `volcanic-charm-t3` active 0.06 + on-kill 0.04 |
| Kill momentum (Plains boots) | `mobility.kill-speed-pct` | **not re-housed** — Volcanic boots use `passive-speed-pct` instead | `plains-boots-t2:196` vs `volcanic-boots-t3:70` |
| Technique-CDR generalist sidearm (Plains weapon) | `technique.cooldown-reduction-pct` | **Arcanist Core** (mountain L17) carries the key; no T3 *weapon* does | `mountain.recipes.ts:465`; `tier3-design-plan.md §5` explicitly retires the Broadsword |
| Frost DoT weapon | `weaponDot` element `frost` | **Swamp → Tundra** (explicit relocation) | `tundra.recipes.ts:5-6`, `tundra-rimebrand` |
| Green essence colour | — | Forest → Jungle | `economy-philosophy.md §2` colour-follows-mechanic rule; live Jungle is green |
| Yellow essence colour | — | Plains → Desert | live Desert is yellow; **but Volcanic (the actual Plains mechanic heir) is red and *charges* yellow** — see §8 |

**CONCERN (biome-handoff issue).** The colour rule and the mechanic rule disagree for the Plains handoff. `economy-philosophy.md §2` says "when a biome retires, its color is re-housed in whichever successor inherits its mechanic" and names `yellow = plating/utility (Plains → Desert → …)`. Live, the *plating* mechanic went to **Volcanic** (red), while the *colour* went to **Desert**. The consequence is a structural yellow demand on Volcanic gear (y1,180 across armor + charm, the largest single-colour splash at T3) sourced from a biome that shares none of its mechanics.

---

## 7. Upgrade-Curve Analysis

### 7.1 The T1/T2 grammar vs. live T3 shape

The shipped grammar (T1 ledger §2, T2 ledger §5): accelerating curve, roughly 4/10/16/26/44% of post-base spend across +1..+5, landing **65–75% of post-base spend in +4/+5**, step ratios ≈1.8–2.2× and never flat.

Every T3 item instead follows **`×1.5 → ×2 → ×~1.7 → flat → flat`**: +3, +4 and +5 are the *same number*, repeated three times, on all 29 T3 gear items.

| Item | Base | +1 | +2 | +3 | +4 | +5 | step ratios (+2..+5) | **+4/+5 share of post-base** |
|---|--:|--:|--:|--:|--:|--:|---|--:|
| Avalanche Maul (mtn wpn) | 116 | 174 | 348 | 588 | 588 | 588 | 2.00 / 1.69 / **1.00** / **1.00** | **51.4%** |
| Cataclysm Axe (cave wpn) | 120 | 174 | 348 | 588 | 588 | 588 | same | **51.4%** |
| Plague Fang (swamp wpn) | 116 | 170 | 340 | 696 | 696 | 696 | 2.00 / 2.05 / 1.00 / 1.00 | **53.6%** |
| Permafrost Maul (tun wpn) | 124 | 186 | 372 | 744 | 744 | 744 | 2.00 / 2.00 / 1.00 / 1.00 | **53.3%** |
| Cinderlash (volc wpn) | 140 | 200 | 400 | 800 | 800 | 800 | 2.00 / 2.00 / 1.00 / 1.00 | **53.3%** |
| Solar Falchion (des wpn) | 116 | 170 | 340 | 570 | 570 | 570 | 2.00 / 1.68 / 1.00 / 1.00 | **51.4%** |
| Venomthorn Rapier (jun wpn) | 120 | 180 | 270 | 360 | 360 | 360 | 1.50 / 1.33 / 1.00 / 1.00 | **47.1%** |
| Glacial Bulwark (tun armor, blue) | 100 | 90 | 180 | 270 | 270 | 270 | 2.00 / 1.50 / 1.00 / 1.00 | **50.0%** |
| Worldvine Heart (jun charm) | 100 | 75 | 150 | 225 | 225 | 225 | 2.00 / 1.50 / 1.00 / 1.00 | **50.0%** |
| Peak Stride (mtn boots) | 100 | 20 | 42 | 75 | 75 | 75 | 2.10 / 1.79 / 1.00 / 1.00 | **52.3%** |
| Mirage Striders (des boots) | 90 | 40 | 80 | 138 | 138 | 138 | 2.00 / 1.73 / 1.00 / 1.00 | **51.7%** |

**Every measured T3 item lands at 47–54%**, uniformly short of the 65–75% target. `economy-philosophy.md §3` independently forbids the shape: *"Upgrade curves must be smooth — step-to-step ratio ≈ 1.8-2.2×."* A ratio of exactly 1.00 at both +4 and +5 is the flattest possible violation.

This is the **same "doubling-then-flattening" pre-rebalance shape** that T1 and T2 both explicitly moved away from — the T3 data was simply never touched by either pass (both ledgers scope themselves to their own tier).

**Also:** all four Volcanic and all five Tundra items place their +3/+4/+5 `requiredBiomeLevel` at **L4** (the biome cap is 6), and Mountain/Cave/Swamp place theirs at **L16** (cap 18). Once the plateau begins, biome level stops gating entirely and the GM ceiling (§2.4) is the sole gate — which is where the +4/+5 wall lives.

### 7.2 Total cost by slot, T3 vs. T2 (DERIVED)

Anchored on Cave, the same biome the T2 baseline used.

| Slot | T2 total→+5 (Cave) | T3 total→+5 (Cave) | Ratio |
|---|--:|--:|--:|
| Weapon | 1,104 red | 2,406 red | **2.18×** |
| Armor | 1,213 red | 1,871 red + 614 yellow (2,485) | **2.05×** |
| Recovery | 483 red | 862 red + 238 green (1,100) | **2.28×** |
| Mobility | 335 red | 505 red | **1.51×** |
| **4-slot kit** | 3,135 | 6,496 | **2.07×** |

### 7.3 Outliers (extreme only, no fixes proposed)

- **Swamp is the most expensive T3 biome by a wide margin and pays entirely in one colour:** p7,284 for its kit (weapon 2,714 + armor 2,840 + charm 1,225 + boots 505), against Jungle's g4,430. Its armor alone (2,840) costs more than Jungle's entire kit's weapon+charm. Swamp is also *first* in the locked T3 difficulty order (`tier-balance-current-state.md:31`).
- **Jungle is the cheapest by ~40%** and has the flattest weapon curve (1.50/1.33 step ratios).
- **Mountain's boots invert the base/upgrade relationship:** base 100, then +1 costs **20** — a 0.2× step down. Total lifetime 387, i.e. the entire upgrade track costs less than three base crafts. (`economy-philosophy.md §3` does prescribe a ×1 boots upgrade multiplier, so this is directionally intended; the base/+1 discontinuity is not.)
- **Tundra is the only biome offering two T3 weapons** (Permafrost Maul + Rimebrand), each ~2,850 essence, on different catalyst families (heavy vs fortified).

---

## 8. Hybrid Essence Economy

`economy-philosophy.md §4` is the stated rule: *"T1-T2 are pure. Hybrid begins at T3, on armor & charms only — weapons and boots stay pure… Split 75% home / 25% splash — on base AND upgrades… keep splash ≤ ~33%."*

### 8.1 Conformance (SOURCE FACT + DERIVED)

**Weapons: 8/8 pure. Boots: 7/7 pure.** Fully compliant — no drift.

| Item | Slot | Base split | Lifetime split (home/splash) | Splash colour | Borrowed mechanic (inferred from §4.4) | Verdict |
|---|---|---|---|---|---|---|
| Glacial Bulwark | armor | 80/20 | **76.4 / 23.6** | red (cave/volcanic) | flat %DR + damage-cap pairing | ✔ |
| Summit Aegis | armor | 80/20 | **75.0 / 25.0** | red | %DR / damage-cap | ✔ |
| Deepscale Hide | armor | 80/20 | **75.3 / 24.7** | yellow (plains/desert) | plating | ✔ |
| Eternal Duneplate | armor | 80/20 | **73.8 / 26.2** | purple (swamp) | debuff resist / cleanse | ✔ |
| Wildgrowth Weave | armor | 75/25 | **68.5 / 31.5** | yellow | plating | ⚠ splash drift |
| Emberforge Plate | armor | 80/20 | **67.5 / 32.5** | yellow | plating→hardening (§6) | ⚠ at ceiling |
| **Plaguebound Shroud** | armor | **pure purple** | 100 / 0 | — | — | ✖ only pure T3 armor |
| Echo Geode | recovery | 80/20 | **78.4 / 21.6** | green (forest/jungle) | recovery-stat foundation | ✔ |
| Oasis Heart | recovery | 80/20 | **79.1 / 20.9** | purple | cleanse | ✔ |
| Bastion Heart | recovery | 80/20 | **68.3 / 31.7** | red | — (both anti-spike) | ⚠ |
| Frostward Charm | recovery | 75/25 | **67.3 / 32.7** | purple | absorb-catches-DoT (Swamp charm identity) | ⚠ at ceiling |
| Magmaheart Stone | recovery | 75/25 | **67.4 / 32.6** | yellow | Plains kill-chain recovery (§6) | ⚠ at ceiling |
| **Sorrow Eye** | recovery | **pure purple** | 100 / 0 | — | — | ✖ |
| **Worldvine Heart** | recovery | **pure green** | 100 / 0 | — | — | ✖ |

### 8.2 Diagnosis

- **The rule holds structurally** — hybrid begins exactly at T3, exactly on armor and charms, and every splash colour has a legible mechanical reading. This is one of the more coherent parts of the T3 data.
- **CONCERN — splash drifts upward through the curve, never downward.** Every hybrid starts at 75–80% home on the base craft and ends at 67–79% home over the lifetime. Five items land at **31.5–32.7%**, effectively pinned to the doc's own ≤33% ceiling; none exceeds it. The mechanism is the same plateau as §7 — the flat +3/+4/+5 steps carry the splash ratio of the +3 step three times, and every hybrid's +3 step is splash-heavier than its base.
- **CONCERN — Swamp pays no cross-colour tax at all** (3 of its 4 items pure, including both hybrid-eligible slots), while carrying the highest kit cost. Jungle's charm is likewise pure. There is no comment in either file explaining the exemption.
- **No arbitrary cross-colour tax was found.** Every splash maps to a mechanic the item actually carries, except **Bastion Heart** (blue/red), where both halves are anti-spike Mountain identity and the red splash reads as budget rather than borrowing.
- **Home colour stays dominant everywhere.** No item falls below 67% home.

### 8.3 Colour-supply pressure at T3 (DERIVED)

At T3 the essence colours are produced by exactly these biomes: **blue** = mountain + tundra; **red** = cave + volcanic; **green** = jungle only (forest retired); **purple** = swamp only; **yellow** = desert only (plains retired).

Cross-colour demand across all seven T3 kits: **yellow 2,399** (cave 614 + jungle 605 + volcanic 1,180) on top of Desert's own 5,845; **purple 1,325** (desert 925 + tundra 400) on top of Swamp's own 7,284; **red 882**; **green 238**.

Yellow and purple are single-sourced and are the two colours carrying the largest external demand. A player building Volcanic gear must farm Desert; a player building Desert or Tundra gear must farm Swamp.

---

## 9. Catalyst Economy

### 9.1 When catalysts are paid — the structural inversion (SOURCE FACT)

| Tier | Base / evolution craft | +1..+3 | +4 | +5 | Reconstruct | Per 4-slot kit |
|---|---|---|---|---|---|--:|
| T1 (shipped) | 0 | 0 | 0 | 1 (weapon/armor on 9 of 20 items only) | n/a | 0–2 |
| T2 (shipped) | **0** | 0 | 1 (weapon/armor) | 2 (weapon/armor), 1 (charm/boots) | 2 | **8** |
| **T3 (live)** | **3** (all biomes except Volcanic) | **0** | **0** | **0** | n/a | **12, all up front** |

The T2 ledger's §6 rule — *"Every T2 gear item's base/evolution craft is now catalyst-free… +4 costs 1 catalyst; +5 costs 2"* — has no T3 analogue. T3 reverses both halves: everything at the door, nothing on the way up.

### 9.2 Demand by family, T3 (DERIVED from §4.2 / §4.5)

| Family | Gear (base crafts) | Cores | Stances | Rites | **T3 total** |
|---|--:|--:|--:|--:|--:|
| heavy | 12 (mountain) + 9 (tundra) = 21 | 6 (Juggernaut 3, Scout 3) | 0 | 11 (Lingering 5, Mechanic Renewal 6) | **38** |
| fortified | 12 (swamp) + 3 (tundra Rimebrand) = 15 | 2 (Controller) | 5 (Execute) | 4 (Purification) | **26** |
| dominion | 12 (desert) | 6 (Sniper 3, Duelist 3) | 5 (Berserker) | 10 (Swift Repose 4, Ability Reprieve 6) | **33** |
| alacrity | 12 (jungle) | 5 (Bruiser 3, Accelerant 2) | 5 (Predator) | 0 | **22** |
| swarming | 12 (cave) | 4 (Catalyst 2, Arcanist 2) | 5 (Brawler) | 5 (Blood Offering) | **26** |

### 9.3 Supply at T3 (SOURCE FACT — enumerated from `NODE_BIOMES` × `NODE_MODIFIERS`)

Catalyst family comes from the **node's modifier**, never the biome (`rewards.ts:186-207`). T3-region node counts by family:

| Biome (T3 nodes) | alacrity | heavy | swarming | dominion | fortified |
|---|--:|--:|--:|--:|--:|
| cave | 1 | 1 | 1 | **2** | 1 |
| desert | **ban** | 1 | 1 | **2** | 1 |
| jungle | **2** | **ban** | 1 | 1 | 1 |
| mountain | **ban** | **2** | 1 | 1 | 1 |
| swamp | 1 | 1 | 1 | 1 | **2** |
| tundra | **ban** | **2** | 1 | 1 | 1 |
| volcanic | 1 | 1 | **2** | 1 | 1 |
| **T3 total nodes** | **4** | **8** | **8** | **9** | **8** |

All five families are farmable inside the T3 region. **No accessibility wall exists.** Alacrity is the scarcest (4 nodes, banned in three of the seven T3 biomes) and is exactly the family Jungle's own kit + both Jungle cores + Predator Stance draw on (22 units) — but Jungle itself hosts 2 of the 4 nodes, so demand and supply are co-located.

### 9.4 Are players asked to farm non-native families? (SOURCE FACT)

Mostly no — the T3 authoring convention is "the item's family-tag, which usually equals the biome's native".

| Deviation | Detail |
|---|---|
| **Cave's whole T3 kit charges `swarming`** (12 units) while Cave's native is `dominion`. Cave hosts 1 swarming node vs 2 dominion. | `cave.recipes.ts` T3 block. Inherited from the T2 tagging; the T2 baseline flagged the identical case at T2. |
| **Arcanist Core (mountain L17) charges `swarming` 2** while Mountain's native is `heavy`. Mountain hosts 1 swarming node. | `mountain.recipes.ts:463` |
| **Rimebrand (tundra) charges `fortified` 3** while Tundra's native is `heavy`. Tundra hosts 1 fortified node. | `tundra.recipes.ts:32` — deliberate: it is the relocated *Swamp* weapon and kept Swamp's family |
| **Duelist Core (cave) charges `dominion`** — native, but note Cave's *gear* charges swarming, so a Cave-focused player farms two families. | `cave.recipes.ts:281` |
| Rites: **all six charge their biome's native family** (explicitly stated in the file header, `riteRecipes.ts:20-24`). | ✔ clean |
| Stances: all four T3 stances charge their biome's native family. | ✔ clean |

### 9.5 Catalyst income (DERIVED)

`catalystWeight` defaults to the monster's base `essence` and is multiplied by the node-modifier reward premium but **not** by `BIOME_ESSENCE_TIER_MULT` (`rewards.ts:203-212`). `CATALYST_PROGRESS_PER_UNIT` is a flat **100** at every tier (`gameConfig.ts:158`).

At T3, `MODIFIER_MAGNITUDE_BY_TIER[3] = 0.15` and `MODIFIER_REWARD_FACTOR` gives dominion ×1.30, fortified ×1.19, alacrity ×1.15, heavy ×1.12, swarming ×1.03.

| Representative T3 node | mob `essence` | per-kill catalyst weight | kills per catalyst |
|---|--:|--:|--:|
| Cave, dominion (cavern-troll 83) | 83 | 108 | **~1** |
| Mountain, heavy (mountain-colossus 75) | 75 | 84 | ~1.2 |
| Swamp, fortified (plague-hydra 65) | 65 | 77 | ~1.3 |
| Jungle, alacrity (jungle-stalker 25) | 25 | 29 | ~3.5 |
| Volcanic, swarming (ember-scuttler 25) | 25 | 26 | ~3.9 |

**Verdict: catalyst escalation at T3 is a payment-timing change, not a scarcity wall.** 12 units per kit is 12–47 kills of income depending on biome — trivial against the thousands of kills the essence bill implies. The real effect of the 3-on-base rule is that it is a **gate on the first craft** rather than a cost, since a player entering a fresh T3 biome has zero of its catalysts banked.

---

## 10. Techniques / Guards / Runes

### 10.1 T3 abilities (SOURCE FACT — `shared/src/abilityRecipes.ts:174-220`)

| Ability | Kind | Biome | Gate | Cost | Catalyst | Prereq | Likely role |
|---|---|---|--:|--:|---|---|---|
| Binding Strike | Technique | tundra | L3 | **blue 650** | none | none | required counterplay (pin — Tundra is the biome that slows you) |
| Break Free | Guard | tundra | L5 | **blue 760** | none | none | **required counterplay** (escape hard control) |
| Frenzy | Technique | volcanic | L3 | **red 650** | none | none | broadly useful (burst window vs Volcanic's Heat ramp) |
| Quick Strike | Technique | volcanic | L5 | **red 760** | none | none | broadly useful / specialised (low-cooldown filler) |

Placement obeys the file's own stated rule (mid-band, staggered L3/L5, `abilityRecipes.ts:10-15`).

### 10.2 The cost cliff (DERIVED)

| Tier | Cheapest mandatory-counterplay tool | Priciest | Ratio to previous tier's cheapest |
|---|--:|--:|--:|
| T1 (shipped 2026-08-28) | Sweep / Second Wind **25** | Power Strike 190 | — |
| T2 (shipped 2026-08-29) | Hamstring / Charge **70** | Bramble Guard / Endure 90 | 2.8× |
| **T3 (live)** | Binding Strike / Frenzy **650** | Break Free / Quick Strike **760** | **9.3× – 10.9×** |
| T4 (live) | Disengage / Snipe 1,300 | Recuperate / Stunning Strike 1,500 | 2.0× |

**CONCERN — legacy economic residue.** The T3/T4 numbers form a clean internal doubling ladder (650→1300, 760→1500), which is exactly the pattern the file's own header describes: *"Costs use the biome's own essence colour and roughly double per tier"* (`abilityRecipes.ts:41`). T1 and T2 were pulled *out* of that ladder by their respective passes; T3/T4 were left on it. The cliff is an artefact of two tiers being rebalanced and two not, not a deliberate step.

For scale: Break Free (760 blue) costs more than a Tundra player's entire boots line to +5 (470 blue) and more than a third of the Permafrost Maul's full track. It is priced as gear, not as a counterplay tool, against a Tundra biome whose whole identity is hard control (`tier3-design-plan.md §3`).

### 10.3 Runes at T3 (SOURCE FACT)

**There are no tier-3 Rune recipes.** `RUNE_RECIPE_DATABASE` holds 16 entries: 11 tier-1 (2 flagged `deprecated`), 4 tier-2 (Swamp L7–10, re-gated by the T2 pass), 1 tier-4 (Focus Elites, graveyard L4). The gap between `rune-recipe-spread-dots` (swamp L10, tier 2) and `rune-recipe-focus-elites` (graveyard, tier 4) spans the whole of T3.

Consequence (DERIVED): a T3 player's Runic Point budget rises from 15 → 19–20 (§2.1) while the *supply of rune fragments to spend it on does not grow at all*. The only new RP sink introduced at T3 is Rites (§11), which is presumably the intent — but it means the extra RP is functionally reserved.

### 10.4 Metadata / gating mismatches searched for

- **Ability tier vs. home tier:** `validateAbilityRecipes` (`abilityRecipes.ts:288-317`) enforces `recipe.tier === ability.tier`, one recipe per ability, and no unteachable ability. Clean.
- **Reachability:** `shared/src/data/recipeGates.test.ts` covers item/stance/rite/rune/ability databases for retired biomes, over-cap levels, and dead/banned catalyst families, with `RETIRED_BIOME_DEBT` **empty**. Every T3 recipe passes. Clean.
- **Deprecated/no-op unlocks:** only the two T1 starter-duplicate runes (`recover-first`, `flee`) carry `deprecated: true`. No T3 recipe is deprecated or duplicated.
- **Starter-owned actions with redundant recipes at T3:** none.
- **Doc/code contradiction found:** the canonical core-cast header in `plains.recipes.ts:239-243` lists *"forest Survivalist / Accelerant"*, but Accelerant Core lives in **Jungle** (`jungle.recipes.ts:273-274`). Comment-only defect.

---

## 11. Rites

Rites are the system T3 introduces (`systemVisibility.ts:133-136` gates the panel on `playerTier >= 3`; all six recipes are `tier: 3`; `system-rework-status.md:37` records the rework). Full economy in §4.5.

### 11.1 The shared Runic Point pool (SOURCE FACT)

`shared/src/runicPoints.ts:10-12`:
```
runicPointLoadoutCost = runeLoadoutCost(rules) + riteLoadoutCost(rites)
```
Rites and Rune rules compete for **one** budget: `runeBudgetForGlobalMastery(gm) = 8 + floor(gm/10)`. `docs/rites-current-state.md:8-20` confirms: *"There are no Rite slots, ranks, or capacity stat: any learned combination may be equipped if the character's one shared Runic Point budget remains legal."*

### 11.2 Can a T3 player run the authored Rite set? (DERIVED)

| | RP |
|---|--:|
| All six T3 Rites equipped | 2+2+3+5+5+3 = **20** |
| T3 budget at realistic max GM 114 | **19** |
| T3 budget at absolute max GM 126 (retired-biome grind, §2.4) | **20** |
| Cheapest five Rites | 15 → leaves 4–5 RP for Rune rules |
| Two most expensive Rites (Mechanic Renewal + Ability Reprieve) | 10 → half the budget for two effects |

**A T3 player cannot equip all six Rites and a single Rune rule.** At GM 126 the six Rites consume the entire budget exactly; at the realistic GM 114 they do not fit at all. `server/bench/balance/botFactory.ts:124-133` already reflects this — its canonical T3 bot greedily fills from `CANONICAL_RITE_PRIORITY` and lands on **five** Rites (`system-rework-status.md:1125`).

**CONCERN — RP-budget feasibility.** Whether "you must choose 3–4 Rites and give up your Rune loadout" is the intended shape, or whether the budget was expected to grow faster, is not answerable from source. `docs/rites-current-state.md:105` lists "tune percentages/RP/gates" as a known open follow-up.

### 11.3 Cost comparability

| Thing a T3 player can buy | Essence | Catalyst | RP |
|---|--:|--:|--:|
| One Rite (median) | ~180 | 5 | 3.3 |
| One T3 Core | 90–110 | 2–3 | 0 |
| One T3 Stance | 180 | 5 | 0 (stance destinations cost RP only inside a switch rule) |
| One T3 Technique/Guard | 650–760 | 0 | 0 |
| One T3 weapon, base craft | 116–140 | 3 | 0 |
| One T3 weapon → +5 | 1,650–3,140 | 3 | 0 |

Rites are priced comparably to Cores and Stances and roughly **1/4 of a Technique**, which is internally odd given a Technique is a single equipped action and a Rite is a permanent passive.

**Is any Rite mandatory counterplay?** No Rite answers a specific biome mechanic the way Sweep answers swarm or Break Free answers root. All six are combat-*boundary* effects (out-of-combat recovery timing, post-fight cleanup, cooldown/mechanic refunds). They read as **broadly useful optimisation**, not required counterplay — with the partial exception of **Purification** (swamp), which is the only systemic answer to harmful carryover between fights in the DoT biome.

**How many can a T3 player realistically access?** All six are reachable (`recipeGates.test.ts` passes; the gates are swamp/mountain/cave L15, desert L11, tundra/volcanic L5 — all under their T3 caps). The constraint is RP, not unlocking.

---

## 12. Stances

| Stance | Tier | Biome | Gate | Essence | Catalyst | Identity | Extension of an earlier stance? |
|---|--:|---|--:|---|--:|---|---|
| Berserker | 3 | desert | L11 | red 140 / purple 40 | **dominion 5** | tempo while self-bleeding | conceptually deepens **Enraged** (T2 desert) — no data link |
| Predator | 3 | jungle | L11 | green 130 / red 50 | **alacrity 5** | stalk + empowered opener | new axis |
| Brawler | 3 | volcanic | L5 | yellow 130 / red 50 | **swarming 5** | endure many attackers | re-homed off retired Plains (comment, `stanceRecipes.ts:47-49`) |
| Execute | 3 | swamp | L13 | purple 130 / red 50 | **fortified 5** | finish wounded prey | new axis |

### 12.1 T2 → T3 stance escalation (DERIVED)

| | T2 (post-pass) | T3 | Ratio |
|---|--:|--:|--:|
| Essence, median | 90–110 | **180** | ~1.8× |
| Catalyst | **exactly 1** (all six, set by the T2 pass, ledger §9) | **exactly 5** (all four) | **5×** |
| Biomes covered | 4 of 7 (forest ×3, desert, plains, jungle) | 4 of 7 (desert, jungle, volcanic, swamp) | — |
| Biomes with no stance | mountain, cave, swamp, tundra | **mountain, cave, tundra** | — |

**CONCERN — abrupt catalyst jump.** The T2 pass deliberately normalised every T2-accessible stance to exactly 1 catalyst as part of a tier-wide catalyst-lightening. T3's stances were explicitly out of that pass's scope (T2 ledger §9: *"Tier 3/4 stances… are untouched — out of scope"*), so the 1 → 5 step is a scoping artefact, not an authored progression. Essence grew 1.8× across the same step; catalysts grew 5×.

**CONCERN — coverage.** Mountain, Cave and Tundra get no stance at T3 (Mountain and Cave get none at T2 either, so those two biomes reach the end of T3 having never produced a stance). Every one of the four T3 stances is a hybrid essence cost, while stance costs are otherwise unconstrained by the armor/charm-only hybrid rule.

---

## 13. Core Economy Interaction

`shared/src/systems/combat/cores.ts` and the twelve core recipes were reworked on 2026-08-29 (`docs/system-rework-status.md:35`, `docs/core-rework-design-balance-handoff.md`). **Live recipe data is treated as authoritative here; no older Core cost assumption from historical docs was used.** Mechanics are out of scope per the task — only economy facts follow.

### 13.1 Which Cores become available at T3 (SOURCE FACT)

Nine of the twelve Cores are tier 3 (§4.5). The three tier-2 starters (Tempered plains L7, Survivalist forest L7, Force cave L8) remain the only Cores a pre-T3 player can own.

The placement rule is authored in `plains.recipes.ts:225-231`: *"T3 cores → T1 biomes level 13-18 | T2 biomes level 7-12 | T3 biomes level 1-6. Each T3 core sits MID-band."* **Live data conforms on every one of the nine.**

### 13.2 The tier-3 eligibility unlock (SOURCE FACT + DERIVED)

Five of the nine T3 Cores are range-restricted (`melee`: Duelist, Juggernaut, Bruiser; `ranged`: Sniper, Scout). `coreIsActive` (`systems/cores.ts:25-42`) reads `selectedRange`, which is set only by unlocking a **skill-tree tier-2 node** (`systems/skills.ts:38-43`). Skill points come exclusively from tier advancement (+1 each, `questSystem.ts:23`) and every skill node costs 1, so the third point — and therefore the range choice — arrives **exactly at player tier 3**. The header comment's claim (*"A range is not chosen until PLAYER TIER 3, so a restricted core placed in a T2 biome-level band is craftable but permanently inert"*) is correct and the live placements avoid the trap.

### 13.3 Resource competition (DERIVED)

| | Essence | Catalyst | Upgrade track |
|---|--:|--:|---|
| T3 Core | 90–110 | 2–3 | **none** — cores are off the `+N` track (`itemUpgrades.ts:81-84`) and their evolution branches are unimplemented (no core carries `evolvesFrom`) |
| T3 weapon, base craft | 116–140 | 3 | 5 steps, 1,500–3,000 essence |
| T3 Rite | 120–220 | 4–6 | none |
| T3 Stance | 180 | 5 | none |

A Core costs **roughly one base weapon craft**: 2–4% of a fully-upgraded weapon's lifetime cost, and ~1.5–2% of a full 4-slot kit. **Cores do not compete materially with gear for essence at T3.** They do compete meaningfully for *catalysts* only in the sense that everything at T3 does — 2–3 units against a kit's 12.

Mountain is the only biome carrying two Cores whose families differ (Juggernaut heavy 3, Arcanist swarming 2), so a Mountain completionist farms two families for Cores plus heavy 12 for gear.

**No economy-only contradiction was found in the Core data.** The one anomaly is the stale cast-list comment (§10.4).

---

## 14. Resource Supply

### 14.1 T3 monster rewards (SOURCE FACT — `MONSTER_DATABASE` via `monsterPoolByTier[3]`)

Only T3-pool entries are listed; the returning biomes' files also hold T1/T2/T4 mobs.

| Biome | Monster | HP | Attack | Essence | biomeXp | ess/XP |
|---|---|--:|--:|--:|--:|--:|
| Mountain | Avalanche Ram | 434 | 87 | 47 blue | 280 | .168 |
| Mountain | Crag Mortar | 490 | 109 | 60 blue | 360 | .167 |
| Mountain | Mountain Colossus | 610 | 130 | 75 blue | 440 | .170 |
| Swamp | Mire Hex-Spitter | 350 | 42 | 35 purple | 210 | .167 |
| Swamp | Bog Lurker | 340 | 43 | 57 purple | 345 | .165 |
| Swamp | Plague Hydra | 400 | 37 | 65 purple | 390 | .167 |
| Cave | Deep Spider | 450 | 60 | 55 red | 330 | .167 |
| Cave | Crystal Gargoyle | 520 | 85 | 60 red | 360 | .167 |
| Cave | Cavern Troll | 700 | 124 | **83 red** | 500 | .166 |
| Jungle | Jungle Stalker | 790 | 55 | **25 green** | 150 | .167 |
| Jungle | Canopy Harrier | 720 | 45 | 27 green | 165 | .164 |
| Jungle | Silverback | 1045 | 83 | 35 green | 210 | .167 |
| Desert | Dune Stalker | 1350 | 67 | 30 yellow | 180 | .167 |
| Desert | Desert Basilisk | 1350 | 113 | 45 yellow | 270 | .167 |
| Tundra | Frost Lurker | 950 | 259 | 29 blue | 175 | .166 |
| Tundra | Rime Caster | 880 | 297 | 45 blue | 270 | .167 |
| Tundra | Glacier Bear | 1500 | 300 | 65 blue | 390 | .167 |
| Volcanic | Ember Scuttler | 1220 | 70 | 25 red | 150 | .167 |
| Volcanic | Cinder Hound | 1440 | 135 | 29 red | 175 | .166 |
| Volcanic | Ash Slinger | 1330 | 209 | 27 red | 165 | .164 |
| Volcanic | Magma Brute | 2000 | 190 | 55 red | 330 | .167 |
| **Bosses** | | | | | | |
| Mountain | Crag-Gorged Horn Behemoth | 12,418 | 204 | 340 blue | 510 | .167 |
| Swamp | Rot-Spore Croc Behemoth | 11,940 | 52 | 345 purple | 518 | .666 ⁄ 4 |
| Cave | Deep-Core Burrow Gorger | 12,895 | 196 | 355 red | 530 | .670 ⁄ 4 |
| Jungle | Apex Bramble Slasher | 11,701 | 104 | 340 green | 510 | — |
| Desert | Dune-Carapace Monarch | 11,940 | 196 | 345 yellow | 518 | — |
| Tundra | Frost-Plated Rime Mammoth | 12,895 | 204 | 350 blue | 525 | — |
| Volcanic | Cinder-Shell Magma Salamander | 11,462 | 179 | 360 red | 540 | — |

The `essence = 1/6 × biomeXp` invariant holds on **every** T3 trash mob and boss (the `economy-philosophy.md §2` rule of "0.16 × biomeXp", implemented as 1/6). This is the most consistently held economy rule in the codebase.

### 14.2 Modifiers, tier multipliers and catalyst weight (SOURCE FACT — `rewards.ts:174-215`)

```
essence  = round(base.essence × BIOME_ESSENCE_TIER_MULT[nodeTier] × modifierRewardMult × debugMult)
catalyst = round((catalystWeight ?? base.essence) × modifierRewardMult × debugMult)     // no tier mult
biomeXp  = round(base.biomeXp  × modifierRewardMult × debugMult)                        // no tier mult here;
                                                                                        // BIOME_XP_REWARD_MULT_BY_TIER applies in applyBiomeXP
```
- No T3 monster sets `catalystWeight` explicitly — all default to `essence`.
- `modifierRewardMult(family, 3)` = `1 + factor × 0.15`: dominion **1.30**, fortified 1.19, alacrity 1.15, heavy 1.12, swarming 1.03.
- Every combat node carries a modifier, so the unmodified baseline is never actually played (`nodeModifierTypes.ts:11-15`).
- **`BIOME_ESSENCE_TIER_MULT[3] = 0.70`** — effective T3 essence is 30% below the authored table.

### 14.3 Income vs. cost at the cap (DERIVED)

Every biome's tier band costs an identical **55,510 biome XP** (a property of `biomeXpForBiomeLevel`'s start-tier offset — verified for plains L12→18, jungle L6→12 and tundra L0→6). At the 1/6 essence ratio and `×0.70`, that band yields roughly:

`55,510 / 6 × 0.70 × (modifier premium ~1.15) ≈ **7,450 essence** of the biome's own colour`

against the kit costs in §4.3 (4,430 green in Jungle … 7,284 purple in Swamp, plus splash). So `economy-philosophy.md §0`'s stated tension — *"you should reach a tier's level cap before you can afford to max its gear"* — is roughly held for Jungle/Tundra/Mountain and **inverted for Swamp**, whose single-colour kit nearly exhausts its own band's entire yield. That said, the ceiling is moot in practice: §2.4 caps T3 gear at +3, which is only **~40%** of a kit's lifetime cost.

### 14.4 Quest and guaranteed rewards (SOURCE FACT)

Quests grant **no essence, no catalysts, no biome XP** — only `playerTier += 1` and `skillPoints += 1` (`questSystem.ts:17-30`), and above tier 0 even that authority moved to seals (`questSystem.ts:35-45`). There is no guaranteed-reward channel at T3.

**SOURCE DEFECT.** `QUEST_DATABASE`'s `tier-3` entry lists ten `targetMonsterTypes`, of which **three do not exist in `MONSTER_DATABASE`**: `elder-gnarled-greatbear`, `plains-warlord`, `lich-king` (`shared/src/quests/questDatabase.ts:60-72`; verified by lookup). The seven real T3 bosses are correct. The `tier-2` entry has one dead id (`glacial-colossus`) and `tier-4` has **ten**. These no longer gate advancement, but the file's own comment (`questSystem.ts:40-44`) states the counters still drive **auto-combat target priority** and **HUD unlock gating** — so the dead ids are live-path dead weight, and the two dead *plains/forest* T3 ids are fossils of the pre-retirement roster.

---

## 15. Boss / Tier-Completion Economy

### 15.1 What a T3 boss pays (SOURCE FACT)

| | T1 | T2 | **T3** | T4 |
|---|--:|--:|--:|--:|
| Boss essence | 100–110 | 145–160 | **340–360** | 595–660 |
| Boss `biomeXp` | 150–165 | 218–240 | **510–540** | 893–990 |
| Boss HP | 1,700–2,100 | 3,375–5,000 | **11,462–12,895** | 17,893–22,940 |
| **Catalyst bundle** | ~~5~~ **removed** | 0 | **0** | 0 |
| Seals to leave the tier | 2 of 5 | 3 of 7 | **4 of 7** | 5 of 7 |

### 15.2 The catalyst-bundle removal (SOURCE FACT — resolves T2 open question #3)

The `catalystBundle` field is **gone from live source**:
- removed from `MonsterDefinition.rewards` (`shared/src/data/monsters/types.ts`, uncommitted working-tree deletion of the 5-line block),
- stripped from all five T1 boss definitions (`shared/src/data/monsters/bossesT1.ts`, 5 lines changed),
- no granting code remains in `server/src/systems/player/progression/rewards.ts`,
- the only surviving occurrences repo-wide are in `shared/dist/**/*.d.ts`, stale build output.

**Per-kill `catalystWeight` on modifier-bearing nodes is now the sole catalyst source in the game.** The T2 ledger §10 recorded the bundle as "not restored, per instruction" and flagged a latent no-op bug in it; the field has since been deleted outright rather than fixed.

### 15.3 Do boss rewards participate materially in gearing? (DERIVED)

A T3 boss pays 340–360 raw essence, ×0.70 tier mult ≈ **240 effective**, once per first clear (repeat clears re-pay full rewards; bosses respawn via `scheduleBossRespawn`). Against a 4-slot kit of 4,430–7,284 essence, one boss clear is **3–5%** of a kit. Four seals ≈ 960 essence ≈ 13–22% of one kit.

**Boss rewards are a rounding error in T3 gearing.** They are a *gate* (seals) and an XP event, not an economic channel.

### 15.4 Is full +5 assumed for boss progression? (SOURCE FACT — explicit evidence only)

- No source file states a `+N` requirement for any boss.
- `economy-philosophy.md §3` states the *general* target: *"Target at the level cap: full set craftable + roughly +1 across the board (boss-ready). Full +3 requires grinding past the cap."* Written for the era of `MAX_UPGRADE = 3`; the analogous statement for `MAX_UPGRADE = 5` was never written.
- `server/bench/balance/botFactory.ts:69-77` + `progression.ts` build bench bots on the **"fully upgraded gear" assumption** with `canonicalBiomeLevels` capping *every* biome group at `biomeLevelCap(playerTier, group)` — which for T3 includes plains 18 and forest 18, i.e. **GM 126**. The bench therefore measures a character who has already paid the retired-biome debt of §2.4.
- Nothing else in source expresses a boss-readiness gear assumption. **Not resolvable further from source.**

---

## 16. Canonical Route Status

### 16.1 Bot routes (SOURCE FACT)

`bot/src/routes/` contains **only `*T1.ts` files** plus `t1Common.ts`, `t1GearPlans.ts`, `t1RouteBuilder.ts` and two T1 test suites. There is no `t2*`, no `t3*`, no `T3_CONTROLLED_ROUTE_IDS`, and no T3 gear plan.

**There is no canonical T3 bot route. There is still no canonical T2 bot route either** — the T2 baseline's §8 finding is unchanged and nothing was added by the T2 implementation pass (T2 ledger §10: *"T2 canonical bot route: not built, as instructed"*).

### 16.2 What *is* authoritative for T3 sequencing (SOURCE FACT)

Unlike T2, T3 does have a **locked biome order**:

> `docs/tier-balance-current-state.md:24-31` — *"Progression order (locked with the user 2026-08-23)… T3: swamp → mountain → cave → jungle → desert → tundra → volcanic"*, with the two-off-the-bottom rule at :33-36 described as load-bearing.

This is a **difficulty** ordering, not an economic route: it says nothing about craft sequence, gear plans per class, or which biome funds which purchase. Note the tension it creates with the recipe gates — Swamp is the *first* T3 biome by difficulty but its T3 gear opens at L13 and its Core/Rite at L15, whereas Tundra and Volcanic (last by difficulty) open their weapons at **L1**.

The bench's `canonicalLoadout(3)` / `canonicalBiomeLevels(3)` (`server/bench/balance/botFactory.ts:69-148`) is the closest thing to an authored T3 *character*: all nine biomes at their T3 caps (GM 126), the deepest-authored Techniques/Guards filling 2/1 slots, all reachable T3 stances known, and five Rites equipped by a fixed priority. It is explicitly labelled *"a CANONICAL-BASELINE CHOICE and it is balance-relevant"* — an assumption, not a measured route.

**Implication:** as at T2, there is no route to total, so no per-class T3 cost figure can be extracted. Whether a T3 route should be built before or as part of the redesign is §20.7.

---

## 17. T2 → T3 Scaling Comparison

T2 figures are the **shipped/implemented** values (T2 ledger), not its baseline.

| Metric | T2 (finalized) | T3 (live) | Ratio | Flag |
|---|--:|--:|--:|---|
| Biome XP per tier band | 55,510 | 55,510 | **1.00×** | uniform by construction |
| `BIOME_XP_REWARD_MULT_BY_TIER` | 1.25 | 1.00 | 0.80× | XP effectively 20% slower |
| `BIOME_ESSENCE_TIER_MULT` | 0.85 | 0.70 | 0.82× | essence 18% more dampened |
| Max GM at tier | 72 | 126 | 1.75× | but only **114** practically (§2.4) |
| GM band width | 42 | 54 | 1.29× | |
| RP budget at cap | 15 | 19–20 | 1.30× | with **zero** new Runes to spend it on |
| Seals to advance | 3 of 7 | 4 of 7 | 1.33× | |
| Trash essence, cheapest biome | 6–8 (plains) | 25–35 (jungle) | ~4× | |
| Trash essence, richest biome | 15–23 (cave) | 55–83 (cave) | ~3.6× | |
| Boss essence | 145–160 | 340–360 | **2.25×** | |
| Boss HP | 3,375–5,000 | 11,462–12,895 | ~3× | |
| Boss catalyst bundle | 0 | 0 | — | field deleted from the codebase |
| Base weapon craft (Cave) | red 60 | red 120 | 2.00× | |
| Base armor craft (Cave) | red 54 | red 116 + y29 | ~2.7× | |
| Weapon total→+5 (Cave) | 1,104 | 2,406 | **2.18×** | |
| Armor total→+5 (Cave) | 1,213 | 2,485 | **2.05×** | |
| Charm total→+5 (Cave) | 483 | 1,100 | **2.28×** | |
| Boots total→+5 (Cave) | 335 | 505 | **1.51×** | boots scale slowest |
| **+4/+5 share of post-base spend** | **~70%** (enforced by test) | **47–54%** | 0.72× | **✖ grammar violation** |
| Evolution cost | ≈ base craft, 0 catalyst | **n/a — no lineages** | — | **✖ system absent** |
| Reconstruction cost | 3.5–4× evolve + 2 catalyst | **n/a** | — | **✖** |
| Catalysts per 4-slot kit | 8, paid at +4/+5 | **12, all at base craft** | 1.5× and inverted timing | **✖ rule reversed** |
| Technique/Guard cost | 70 / 90 | **650 / 760** | **9.3× / 8.4×** | **✖ cliff** |
| Rune recipe cost | 70–120 purple | **none exist** | — | **✖ content gap** |
| Stance essence | 90–110 | 180 | 1.8× | |
| Stance catalyst | **1** | **5** | **5×** | **✖ abrupt** |
| Rite (new system) | n/a | 120–220 essence, 4–6 catalyst, 2–5 RP | — | new sink |
| Core essence | 45 | 90–110 | 2.2× | |
| Core catalyst | 1 | 2–3 | 2–3× | |
| Cores available | 3 | 9 | 3× | |

**Metrics far outside general tier scaling:** ability cost (9×), stance catalyst (5×), catalyst payment *timing* (inverted), evolution/reconstruction (removed), Runes (zero). Everything else — gear ~2.0–2.3×, boss essence 2.25×, core essence 2.2× — forms a coherent, believable tier step.

---

## 18. Economic Coherence Findings

### 18.1 Source / data defects (contradiction, unreachable content, no-op, bad gate)

| # | Finding | Evidence |
|---|---|---|
| D1 | **T3 gear's +4 and +5 are unreachable on a normal T3 route.** GM 115/126 required; max practical GM is 114 (§2.4). Reaching them costs ~2,200 kills in retired Plains/Forest T2 nodes. `recipeGates.test.ts` guards this class of debt for recipes and holds it at zero; no equivalent guard exists for the GM ceiling. | `itemUpgrades.ts:39-45`, `gameConfig.ts:249-309`, `regionT3.ts:16`, `itemUpgrade.ts:53` |
| D2 | **Volcanic's four T3 items charge zero catalysts** while all 25 other T3 gear items charge exactly 3 on base craft. No comment explains the exemption. | `volcanic.recipes.ts:9-77` vs. all other T3 blocks |
| D3 | **`QUEST_DATABASE` tier-3 names three non-existent monsters** (`elder-gnarled-greatbear`, `plains-warlord`, `lich-king`); tier-2 names one and tier-4 names ten. The counters still drive auto-combat target priority and HUD unlock gating. | `quests/questDatabase.ts:60-84`; `questSystem.ts:40-44` |
| D4 | **The canonical core-cast comment is wrong:** `plains.recipes.ts:239-243` homes Accelerant in Forest; it lives in Jungle. | `plains.recipes.ts:239` vs `jungle.recipes.ts:273` |
| D5 | **`docs/system-rework-status.md:153` states T4 `+5` lands at GM 198**; live `maxGlobalMasteryAtTier(4) = 192`. Its T3 figure (126) is right but assumes Plains/Forest are farmed. | doc vs `gameConfig.ts:302-309` |
| D6 | **`catalystBundle` survives only in stale build output** (`shared/dist/**`). Harmless today, but a rebuild artefact that will confuse the next reader. | `shared/dist/data/monsters/types.d.ts:340` |

### 18.2 Legacy economic residue (legal, but authored under an older structure)

| # | Finding |
|---|---|
| L1 | **T3 ability costs (650/760)** sit on the old "roughly double per tier" ladder that T1 and T2 were each explicitly pulled off. `abilityRecipes.ts:41` still states that ladder as the file's rule. |
| L2 | **The universal `+3/+4/+5 flat plateau`** on all 29 T3 gear items is the pre-rebalance curve shape that both prior passes replaced. 47–54% of post-base spend in +4/+5 vs. the 65–75% grammar. |
| L3 | **T3 stance catalysts (5)** predate the T2 pass's normalisation to 1 and were explicitly left out of scope by it. |
| L4 | **T3 upgrade `requiredBiomeLevel` values plateau** alongside the costs (all at L4 / L10 / L16), so biome level stops being a gate above +2. |
| L5 | **`design_docs/player-power-curve.md:87` anchors T3 mob HP at ~440**; live T3 mobs run 340–2,000 after the 2026-08-23 numerical baseline pass. The doc's §4 bands are self-declared as a T2 snapshot. |

### 18.3 Biome-handoff issues

| # | Finding |
|---|---|
| H1 | **All 21 T2 `+5` investments become economically meaningless.** The prior-tier *mechanics* all continue (§6), but the *items* do not, because no T3 recipe carries `evolvesFrom`. |
| H2 | **Plains' `mobility.kill-speed-pct` has no T3 successor.** Volcanic's boots carry `passive-speed-pct` instead; the mechanic simply stops. |
| H3 | **Plains' Technique-CDR generalist weapon identity moves to a Core, not a weapon.** `tier3-design-plan.md §5` retires the Broadsword deliberately, but the result is that no T3 weapon offers `technique.cooldown-reduction-pct` while a second Technique slot opens at exactly T3. |
| H4 | **The colour rule and the mechanic rule disagree on the Plains handoff** (yellow → Desert, plating → Volcanic), which is the origin of Volcanic's y1,180 external demand (§6, §8.3). |
| H5 | **Retired Plains and Forest remain load-bearing for GM** (D1), so "retirement" is economically incomplete. |

### 18.4 Pacing hypotheses (need runtime evidence; not resolvable here)

| # | Hypothesis |
|---|---|
| P1 | Whether a T3 player's rational play is to **keep +5 T2 gear** rather than craft +3 T3 gear, given D1. Requires a stat comparison plus a real run; no T3 bot route exists to produce one (§16). |
| P2 | Whether the compounding of `BIOME_XP_REWARD_MULT` 1.25→1.00 and `BIOME_ESSENCE_TIER_MULT` 0.85→0.70 (a combined ~0.66× on essence-per-XP-hour) against a 2.07× kit-cost rise leaves T3 affordable. |
| P3 | Whether Swamp — first by difficulty, most expensive by kit (p7,284), pure-colour, and gated at L13 — is a hard opening wall or a comfortable one. |
| P4 | Whether the 3-catalyst base-craft gate meaningfully delays a player's *first* craft in a fresh T3 biome (a zero-balance start, §9.5). |
| P5 | Whether 19–20 RP against 20 RP of authored Rites plus a Rune loadout is a satisfying budget or a hard squeeze (§11.2). |

### 18.5 Intentional specialisation (asymmetry with a plausible reason — do not flatten)

- **Plains/Forest retirement itself** is deliberate, documented in `tier3-design-plan.md §1`, and cleanly executed: every mechanic has an implemented successor, no recipe is stranded, and `recipeGates.test.ts` passes with an empty debt list.
- **Cave charging `swarming` against a `dominion` native**, and **Rimebrand charging `fortified` in a `heavy` Tundra**, both carry explanatory `family-tag` comments and are consistent with the repo-wide "family follows the item, not the biome" rule (`recipes/types.ts:44-49`).
- **Tundra's two weapons** (heavy-brittle and frost-DoT) is an authored choice recording the Swamp frost-line relocation, not duplication.
- **Boots being the cheapest slot by a wide margin** is prescribed by `economy-philosophy.md §3` (boots upgrade multiplier ×1).
- **Rites competing with Runes for one pool** is explicitly the design (`rites-current-state.md:8-20`), not an oversight.
- **Cores being off the `+N` track** is deliberate and enforced (`itemUpgrades.ts:81-84`).

### 18.6 Designer decision required

See §20.

---

## 19. Historical Philosophy Reconciliation

| Principle (source) | Status against live T3 |
|---|---|
| *"Active T3 biomes (7)… Retire at T2: Plains, Forest. No mechanic is orphaned"* — `archive/tier3-design-plan.md §1` | **Still matches exactly.** Roster, retirement and every re-house are implemented. The most faithfully executed old plan in this audit. |
| *"T1-T2 are pure. Hybrid begins at T3, on armor & charms only — weapons and boots stay pure"* — `economy-philosophy.md §4` | **Still matches** — 8/8 weapons and 7/7 boots pure; hybrids confined to armor/charms. |
| *"Split 75% home / 25% splash — on base AND upgrades… keep splash ≤ ~33%"* — same | **Partially implemented.** Base splits are 75–80/20–25 ✔; lifetime splits drift to 67–79% home, five items pinned at the 33% ceiling, and three hybrid-eligible items are pure. |
| *"The splash color = the color of the mechanic the piece borrows"* — same | **Holds** on 10 of 11 hybrids; Bastion Heart's red splash has no borrowed mechanic. |
| *"essence = round(0.16 × biomeXp) for every mob, every biome"* — `economy-philosophy.md §2` | **Implemented as 1/6 ≈ 0.167 and held on every T3 mob and boss.** The most reliably honoured rule found. |
| *"Drops are always pure — one color per biome"* — same | **Holds.** All cross-biome pressure is on the cost side. |
| *"Color follows the mechanic-family… yellow = plating/utility (Plains → Desert)"* — same | **Superseded / contradicted.** Plating went to Volcanic (red); only the colour went to Desert (§6, H4). |
| *"Upgrade curves must be smooth — step-to-step ratio ≈ 1.8-2.2×. No lumpy ramps"* — `economy-philosophy.md §3` | **Obsolete-in-practice / violated.** Every T3 item has 1.00× ratios at +4 and +5. |
| *"Base craft cost stays accessible; upgrade cost is the real gate"* — same | **Holds directionally** (base 90–140 vs. lifetime 400–3,100), though the real gate at T3 is the GM ceiling, not cost. |
| *"Target at the level cap: full set craftable + roughly +1 across the board"* — same | **Obsolete detail** (written for `MAX_UPGRADE = 3`); the T3 analogue was never authored. The equivalent live number is unknowable without a run. |
| *"Caps: T1→L4, T2→L8, T3→L12, T4→L16 (each tier = +4 levels)"* — `economy-philosophy.md §1` | **Obsolete.** `BIOME_LEVELS_PER_TIER` is 6; T3 caps are 18/12/6 by start tier. |
| *"Phase XP… T3 +17,836"* — same | **Obsolete.** A T3 biome band now costs 55,510 XP. |
| *"BIOME_LEVELS_PER_TIER = 4"*, *"MAX_UPGRADE = 3"*, *"GM does not exist yet"* — `docs/global-mastery-current-state.md` | **Fully obsolete**; the doc is a pre-implementation snapshot. Live: 6, 5, and GM is the central T3 gate. |
| *"T3 adds exactly one new strategic dimension: RANGE & POSITION"* — `tier3-design-plan.md §0` | **Implemented and economically load-bearing** — the range node lands at exactly player tier 3, activating five of the nine T3 Cores (§13.2). |
| *"Cave T3… wrinkle: %DR ramps over a long fight"* — `tier3-design-plan.md §3` | **Partially implemented** — `cave-vest-t3` carries flat `damageReduction: 0.19` with no ramp key. |
| *"Tundra weapon: frost-debuff slow (recommended)"* — `tier3-design-plan.md §9 open question` | **Superseded** — Tundra ships a brittle maul plus the relocated Swamp frost-DoT brand. |
| *"T3 enemy-curve anchors: mob-HP ~440"* — `tier3-design-plan.md §6`, `player-power-curve.md:87` | **Superseded** by the 2026-08-23 ladder (`tier-balance-current-state.md`); live T3 mob HP is 340–2,000. |
| Core design: *"Cores magnify an existing build engine… multiplicative capstone layer"*, *"T3 specialist ~25–35% ordinary / 35–50% ideal"* — `core-rework-design-balance-handoff.md §1-§3` | **Implemented 2026-08-29** per `system-rework-status.md:35`. Out of economy scope; the recipe data is internally consistent with a capstone slot priced at ~one base weapon craft. |
| T2 pass: *"Every T2 gear item's base/evolution craft is now catalyst-free… +4 = 1, +5 = 2"* — T2 ledger §6 | **Not extended to T3**, which reverses it (§9.1). |
| T2 pass: *"the existing Flash Rapier→Gale/Thorn architecture absorbed 19 new lineages with zero code changes"* — T2 ledger §1 | **True, and unused above T2** — the same generic machinery would absorb T3 lineages identically, and does not. |

---

## 20. Designer Decisions

Genuinely open questions that materially affect the T3 redesign and cannot be resolved from source.

1. **Should T3 gear participate in the evolution/reconstruction system at all?** Every T2 item now evolves from its T1 predecessor at +5; no T3 item evolves from anything. Either T3 inherits the 21-lineage pattern (28 new lineages, plus decisions on the Forest→Jungle and Plains→Volcanic cross-biome handoffs, which have no same-biome predecessor), or full replacement is the intended shape above T2 and the T2 pass was the exception rather than the template. (§5, §18.3 H1)

2. **How should T3's `+4`/`+5` be made reachable — and is the answer a data change, a formula change, or a route change?** `maxGlobalMasteryAtTier(3) = 126` counts 36 GM from two biomes with no T3 nodes. The options (exclude retired biomes from the max, re-band the item-tier GM gates, give Plains/Forest T3 nodes, accept the grind) are all outside an economy pass's authority. Note the same arithmetic will recur at T4 with Plains, Forest, Jungle and Desert. (§2.4, §18.1 D1)

3. **Should T3 Techniques/Guards get the same treatment T1 and T2 received?** 650/760 against T2's 70/90 is a 9× cliff; Break Free in particular reads as mandatory counterplay to Tundra's hard control at a price above a full boots track. If they are cut, T4's 1,300/1,500 immediately inherits the same discontinuity. (§10.2)

4. **Is the T3 catalyst schedule (3 on base craft, 0 on upgrades) intended, or should T3 adopt the T2 rule (free base, 1 at +4, 2 at +5)?** The two rules are structurally opposite, and the T2 rule's justification — catalysts as a late-investment cost — is undermined at T3 by the fact that +4/+5 are unreachable anyway (decision 2). And separately: **is Volcanic's zero-catalyst T3 kit deliberate?** (§9.1, §18.1 D2)

5. **Should T3 introduce Rune recipes, or is the tier's whole RP story meant to be Rites?** T3 grants +4–5 RP and zero new rune fragments; the next rune is tier 4. If Rites are the sole T3 RP content, the six of them cost 20 RP against a 19–20 budget, which forces "Rites or Runes, not both". (§10.3, §11.2)

6. **Should the T3 upgrade curves be reshaped to the shipped 65–75% grammar, given that +4/+5 may remain unreachable?** Reshaping moves cost *into* steps a player might never buy, which would make T3 gear cheaper in practice — a large effective buff that no one asked for. The curve fix and the GM fix are coupled and should be decided together. (§7.1)

7. **Should a canonical T3 route be built (bot-side, mirroring `t1RouteBuilder.ts`) before the redesign is validated?** T2 shipped without one and its pacing is still unmeasured; T3 would be the second consecutive tier tuned on cost tables alone. T3 additionally has a *locked biome difficulty order* that a route could encode, which T2 lacked. (§16)

8. **What is the intended economic role of a retired biome?** Plains and Forest currently produce no T3 content but remain (a) the only route to GM 115+, (b) the only tier-2-rate source of yellow and green, and (c) home to three T2 stances and two T2 cores a late-arriving player might still want. Is "retired" meant to mean *no reason to return*, or *a slower, lower-tier fallback that stays useful*? The answer determines whether decision 2's grind is a bug or a feature. (§3, §18.3 H5)

---

## 21. Source Map

### Configuration and progression formulas
- `shared/src/config/gameConfig.ts` — `BIOME_LEVELS_PER_TIER`, `biomeLevelCap`, `biomeLevelOffset`, `biomeXpForLevel`, `biomeXpForBiomeLevel`, `globalMastery`, `maxGlobalMasteryAtTier`, `BIOME_ESSENCE_TIER_MULT`, `BIOME_XP_REWARD_MULT_BY_TIER`, `CATALYST_PROGRESS_PER_UNIT`
- `shared/src/systems/itemUpgrades.ts` — `MAX_UPGRADE`, `MAX_ITEM_TIER`, `globalMasteryRequiredForUpgrade`, `upgradeCeilingFromGlobalMastery`, `getMaxUpgrade`, `checkUpgrade`
- `shared/src/systems/evolution.ts` — `EVOLUTION_REQUIRED_PLUS`, `requiredPlusFor`, `checkEvolve`, `checkReconstruct`
- `shared/src/systems/tierAdvancement.ts` — `SEALS_REQUIRED_BY_TIER`, `bossSealSourcesAtTier`
- `shared/src/systems/skills.ts` — `canUnlockSkill` (strict sequential skill-tier gate)
- `shared/src/abilities.ts` — `abilitySlotCount`, `abilityRankIndex`
- `shared/src/systems/systemVisibility.ts` — Rites gated on `playerTier >= 3`
- `shared/src/runeDatabase.ts` — `runeBudgetForGlobalMastery`, `RUNE_POINT_GLOBAL_MASTERY_STEP`, `runeRuleCost`
- `shared/src/runicPoints.ts` — shared Rune+Rite budget
- `shared/src/rites.ts` — `RiteDef.runeCost`, `riteLoadoutCost`

### World / biome / modifier structure
- `shared/src/world/map/regionT3.ts` — the seven T3 biomes (Plains/Forest absent)
- `shared/src/world/map/{regionT1,regionT2,regionT4}.ts` — comparison rosters
- `shared/src/world/map/authoring.ts` — `buildRegionNodes`, `allowedModifiersForBiome`
- `shared/src/world/nodeModifierTypes.ts` — `MODIFIER_BANS`, `NATIVE_MODIFIER`, families
- `shared/src/world/nodeModifiers.ts` — `MODIFIER_MAGNITUDE_BY_TIER`, `MODIFIER_REWARD_FACTOR`, `modifierRewardMult`
- `shared/src/biomeDatabase.ts` — `monsterPoolByTier`, `bossPoolByTier`, `mobDensity`

### Recipe / economy data
- `shared/src/data/recipes/types.ts` — `Recipe`, `catalystCost` semantics, `evolvesFrom`/`reconstructCost`/`lineageId`, `coreEligibility`
- `shared/src/data/recipes/tundra.recipes.ts` (T3 debut, 5 items + Scout Core)
- `shared/src/data/recipes/volcanic.recipes.ts` (T3 debut, 4 items + Catalyst Core; zero catalysts)
- `shared/src/data/recipes/{mountain,cave,swamp}.recipes.ts` (T3 bands at L13–17)
- `shared/src/data/recipes/{jungle,desert}.recipes.ts` (T3 bands at L7–11)
- `shared/src/data/recipes/plains.recipes.ts` — canonical Core-cast header; "retires after T2"
- `shared/src/data/recipes/forest.recipes.ts` — "retires after T2"; the rapier lineage
- `shared/src/abilityRecipes.ts` — T3 abilities and `validateAbilityRecipes`
- `shared/src/runeRecipes.ts` — no tier-3 entries; `deprecated` field
- `shared/src/stanceRecipes.ts` — T3 stances + placement rules header
- `shared/src/riteRecipes.ts` — all six Rites, tier 3, native-family rule
- `shared/src/data/recipeGates.test.ts` — reachability invariants, empty `RETIRED_BIOME_DEBT`

### Monsters and rewards
- `shared/src/data/monsters/{mountain,swamp,cave,jungle,desert,tundra,volcano}.monsters.ts`
- `shared/src/data/monsters/{bossesT1,bossesT2,bossesT3,bossesT4}.ts`
- `shared/src/data/monsters/types.ts` — `rewards` shape (`catalystBundle` removed)
- `shared/src/quests/questDatabase.ts` — tier quests, dead monster ids

### Server systems
- `server/src/systems/player/progression/rewards.ts` — `applyKillRewardsToPlayer`, essence/XP/catalyst scaling, seal recording, `checkRecipeUnlocks`
- `server/src/systems/player/progression/questSystem.ts` — `advanceTier`, `checkSealTierAdvance`
- `server/src/systems/player/progression/skills.ts` — `unlockSkill`, `selectedRange` assignment
- `server/src/systems/player/economy/itemUpgrade.ts` — passes live GM into `checkUpgrade`
- `server/src/systems/player/economy/riteCrafting.ts` — RP budget enforcement
- `server/src/systems/combat/cores.ts`, `shared/src/systems/cores.ts` — `coreIsActive` / eligibility

### Bench and bot
- `server/bench/balance/botFactory.ts` — `canonicalBiomeLevels`, `canonicalLoadout` (T3 = GM 126, five Rites)
- `server/bench/balance/progression.ts` — `isBenchEquippable`, `bestGearForSlot`, `MAX_IMPLEMENTED_SKILL_TIER`, `UNIMPLEMENTED_T3_IDS`
- `bot/src/routes/` — T1-only; no T2 or T3 route exists

### Documentation consulted (historical context, not live truth)
- `docs/briefs/T1_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-28.md` (anchor)
- `docs/briefs/T2_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-29.md` (anchor)
- `docs/briefs/T2_PROGRESSION_ECONOMY_BASELINE_2026-08-29.md` (structural sibling)
- `docs/tier-balance-current-state.md` — locked T3 difficulty order, tier ladder axes
- `docs/system-rework-status.md` — Cores/Rites status, GM band intent, recipe re-homing log
- `docs/rites-current-state.md`, `docs/cores-current-state.md`, `docs/core-rework-design-balance-handoff.md`
- `docs/gear-evolution-current-state.md`, `docs/global-mastery-current-state.md` (stale), `docs/node-modifiers-current-state.md`
- `design_docs/economy-philosophy.md`, `design_docs/player-power-curve.md`
- `design_docs/archive/tier3-design-plan.md` (the T3 design intent; live roster still matches it)
- `docs/briefs/t2-t4-numerical-baseline-handoff-2026-08-23.md`
