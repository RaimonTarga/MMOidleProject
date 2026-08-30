# T3 Progression Economy — Implementation Ledger

**Date:** 2026-08-30
**Status:** IMPLEMENTED. This is the "what actually shipped" record; treat it as authoritative over `T3_PROGRESSION_ECONOMY_PROPOSAL_2026-08-30.md` and `T3_PROGRESSION_ECONOMY_BASELINE_2026-08-29.md` on any figure the three disagree on.
**Implements:** the T3 progression/economy proposal *plus the designer's corrections layered on top of it* (see §17 for every point where the corrections overrode the proposal). Anchored on the shipped T1 (`T1_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-28.md`) and T2 (`T2_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-29.md`) ledgers for curve shape, evolution architecture, and catalyst philosophy.

Nothing here touches combat stats, `attacksPerSecond`, `mechanicEffects`, monster/boss numbers, biome XP curves, RP formulas, Core economy, Rune content, or quest advancement logic. Every number moved is an essence cost, a catalyst cost, or a mastery/GM gate — plus one genuinely structural change (`biomeLevelCap` becoming retirement-aware) and one data-integrity correction (dead quest monster IDs).

---

## 1. Files Changed

**Formulas — `shared/`**
- `shared/src/config/gameConfig.ts` — new derived `BIOME_FINAL_TIER_BY_GROUP`; `biomeLevelCap` now clamps the player tier by it.
- `shared/src/systems/itemUpgrades.ts` — **doc comment only**, no code change. `globalMasteryRequiredForUpgrade` composes over `maxGlobalMasteryAtTier` and inherited the fix for free.

**Recipe data — `shared/src/data/recipes/`** (all 29 T3 gear items repriced; 22 gained lineage)
- `mountain.recipes.ts` — Avalanche Maul, Summit Aegis, Bastion Heart, Peak Stride (T3 block only)
- `cave.recipes.ts` — Cataclysm Axe, Deepscale Hide, Echo Geode, Echostep Treads
- `swamp.recipes.ts` — Plague Fang, Plaguebound Shroud, Sorrow Eye, Mire Striders (+ purity comments)
- `jungle.recipes.ts` — Venomthorn Rapier, Wildgrowth Weave, Worldvine Heart, Canopy Striders (+ purity comment, + dead-end note)
- `desert.recipes.ts` — Solar Falchion, Eternal Duneplate, Oasis Heart, Mirage Striders
- `volcanic.recipes.ts` — Cinderlash, Emberforge Plate, Magmaheart Stone, Magma Walkers (+ the game's first cross-biome lineage, + first-ever catalyst families, + a new file header stating the home/splash colour rule)
- `tundra.recipes.ts` — Permafrost Maul, Rimebrand, Glacial Bulwark, Frostward Charm, Glacier Striders (repriced; no lineage — Tundra debuts at T3) (+ reworded frost-DoT header)
- `plains.recipes.ts` — **comment only** (Accelerant Core cast correction). No cost change.
- `forest.recipes.ts` — **untouched.**
- `types.ts` — **untouched.** No evolution schema change was needed or made.

**Other data — `shared/`**
- `shared/src/abilityRecipes.ts` — the four T3 ability costs; the stale "roughly double per tier" policy comment replaced.
- `shared/src/stanceRecipes.ts` — `catalystCost` on the four T3 stances. T4 Recuperating untouched.
- `shared/src/riteRecipes.ts` — `catalystCost` on all six rites. **All six essence costs untouched.**
- `shared/src/quests/questDatabase.ts` — `targetMonsterTypes` on `tier-2` / `tier-3` / `tier-4`.
- `shared/src/runeRecipes.ts` — **untouched.** Zero T3 rune recipes is intentional; T3's RP layer is Rites.

**Server**
- `server/src/systems/player/progression/rewards.ts` — **comment only**, documenting that the cap is a gain stop and never rewrites a stored level.

**Client — presentation only**
- `client/src/hud/BiomeXpBar.tsx`, `client/src/ui/map/NodeInfo.tsx`, `client/src/ui/MasteryPanel.tsx` — display denominator is `Math.max(cap, currentLevel)` so a legacy over-cap save renders sensibly.

**Tests**
- `server/test/t3ProgressionEconomy.test.ts` — **NEW**, see §15.
- `server/test/questMonsterIds.test.ts` — **NEW**, generic guard written against the databases.
- `shared/src/systems/itemUpgrades.test.ts` — three stale pins updated (126→114, 192→156, the GM-198 T4 ceiling case → 156, plus a 155→+4 boundary case).

**Docs**
- `docs/system-rework-status.md` — the "+5 lands at full tier mastery" line (126/198 → 114/156).
- `docs/gear-evolution-current-state.md` — same figures, plus a note that the cap is now retirement-aware.
- `docs/global-mastery-current-state.md` — a stale-warning header with the live figures (a full rewrite of that doc is still overdue and out of scope).
- `docs/README.md` — indexed this ledger.
- `design_docs/economy-philosophy.md` — **deliberately NOT edited.** It is historical design archaeology; the current rule is recorded in §11 below instead.

No server crafting/evolution logic changed. `crafting.ts`, `itemEvolution.ts` and `itemUpgrade.ts` are fully generic over recipe data — the T2 architecture absorbed 22 new lineages with **zero code changes**, exactly as the T2 pass predicted.

---

## 2. Final Mastery Architecture

The defect: `biomeLevelCap(playerTier, group)` knew when a biome **started** but not when it **ended**, so it granted six more levels of headroom per player tier forever. At T3 the ceiling counted Plains 18 and Forest 18 against biomes with no T3 nodes at all — a ~2,200-kill "retired-biome debt" required to reach a T3 item's +4 and +5.

The fix is generic and derived, not a T3 patch and not a hand-maintained retirement table:

```ts
export const BIOME_FINAL_TIER_BY_GROUP: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  for (const { biomeGroup, biomeTier, kind } of Object.values(NODE_BIOMES)) {
    if (kind !== 'normal' && kind !== 'dungeon') continue;
    if (map[biomeGroup] === undefined || biomeTier > map[biomeGroup]) map[biomeGroup] = biomeTier;
  }
  return map;
})();

export function biomeLevelCap(playerTier: number, biomeGroup: string): number {
  if (biomeGroup === 'clearing') return 4;
  const startTier = BIOME_START_TIER_BY_GROUP[biomeGroup] ?? 1;
  const finalTier = BIOME_FINAL_TIER_BY_GROUP[biomeGroup] ?? startTier;
  const effectiveTier = Math.min(playerTier, finalTier);
  return Math.max(0, (effectiveTier - startTier + 1) * BIOME_LEVELS_PER_TIER);
}
```

`maxGlobalMasteryAtTier` and `globalMasteryRequiredForUpgrade` needed **no edit** — they compose over `biomeLevelCap` and inherit the fix. That is the point of doing it here rather than special-casing T3, and it means the bug class cannot recur: give Plains a T3 node and its cap grows on the same commit.

### 2.1 The node-kind question, resolved from data (designer correction 1)

The correction asked whether `normal | dungeon` genuinely describes a biome's *progression lifespan* — i.e. whether an optional/side dungeon could exist after a biome retires and wrongly buy it another six mastery levels.

**Investigated and answered from the live map: it cannot, today.** Dungeons are not authored independently — `buildRegionNodes` (`shared/src/world/map/authoring.ts`) carves `dungeonCells` out of a region's own mask and assigns them from that region's own biome list, so every dungeon inherits its region's tier. Enumerated over `NODE_BIOMES`, **each group's dungeon tiers are exactly its normal tiers**:

```
mountain normal:[1,2,3,4]  dungeon:[1,2,3,4]     tundra    normal:[3,4]  dungeon:[3,4]
cave     normal:[1,2,3]    dungeon:[1,2,3]       volcanic  normal:[3,4]  dungeon:[3,4]
forest   normal:[1,2]      dungeon:[1,2]         graveyard normal:[4]    dungeon:[4]
plains   normal:[1,2]      dungeon:[1,2]         trench    normal:[4]    dungeon:[4]
swamp    normal:[1,2,3]    dungeon:[1,2,3]
jungle   normal:[2,3,4]    dungeon:[2,3,4]
desert   normal:[2,3,4]    dungeon:[2,3,4]
```

So the `normal`-only and `normal | dungeon` derivations are **identical**, and there is one data-driven source of truth with no duplicated table. The derivation was left symmetric with `BIOME_START_TIER_BY_GROUP` (which uses the same kind set), and the hazard the correction flagged is now **pinned by a regression test** (§15, test 1b): if a side dungeon is ever authored past its biome's normal content, that test fails loudly and tells the next author to narrow the derivation to `kind === 'normal'`. This is deliberately a failing test rather than a silent behaviour change, because "a later dungeon should/shouldn't extend mastery" is a design call, not an implementation detail.

---

## 3. Biome Final-Tier Table (derived, verified against live `NODE_BIOMES`)

| Biome | start tier | **final tier** | cap @T1 | cap @T2 | **cap @T3** | cap @T4 |
|---|--:|--:|--:|--:|--:|--:|
| plains | 1 | **2** | 6 | 12 | **12** | 12 |
| forest | 1 | **2** | 6 | 12 | **12** | 12 |
| mountain | 1 | 4 | 6 | 12 | **18** | 24 |
| cave | 1 | **3** | 6 | 12 | **18** | 18 |
| swamp | 1 | **3** | 6 | 12 | **18** | 18 |
| jungle | 2 | 4 | 0 | 6 | **12** | 18 |
| desert | 2 | 4 | 0 | 6 | **12** | 18 |
| tundra | 3 | 4 | 0 | 0 | **6** | 12 |
| volcanic | 3 | 4 | 0 | 0 | **6** | 12 |
| graveyard | 4 | 4 | 0 | 0 | 0 | 6 |
| trench | 4 | 4 | 0 | 0 | 0 | 6 |
| **`maxGlobalMasteryAtTier`** | | | **30** | **72** | **114** | **156** |
| *(was, before this pass)* | | | *30* | *72* | *126* | *192* |

---

## 4. Max GM and Upgrade Gates, T1–T4

`globalMasteryRequiredForUpgrade` is unchanged: `base = maxGlobalMasteryAtTier(tier-1)`, `band = maxGlobalMasteryAtTier(tier) - base`, `base + round(band × plus / 5)`.

| Tier | max GM | +1 | +2 | +3 | +4 | +5 | band width |
|---|--:|--:|--:|--:|--:|--:|--:|
| T1 | **30** | 6 | 12 | 18 | 24 | 30 | 30 |
| T2 | **72** | 38 | 47 | 55 | 64 | 72 | 42 |
| **T3** | **114** *(was 126)* | **80** *(83)* | **89** *(94)* | **97** *(104)* | **106** *(115)* | **114** *(126)* | 42 |
| **T4** | **156** *(was 192)* | **122** *(139)* | **131** *(152)* | **139** *(166)* | **148** *(179)* | **156** *(192)* | 42 |

**T1 and T2 are bit-identical to what shipped** — that is why the fix clamps rather than re-bands, and it is asserted explicitly in the test suite. T3's +5 now lands exactly at "every biome a T3 player can actually play, maxed"; the retired-biome debt is gone. Band width becomes a uniform 42 GM for T2/T3/T4, so tier pacing is consistent for the first time (it was 30/42/54/66).

RP is unaffected in practice: `runeBudgetForGlobalMastery = 8 + floor(GM/10)` gives **19** at GM 114 — the figure a realistic T3 player already reached. Only the unreachable GM-126 → 20 RP case is removed.

---

## 5. Full T2 → T3 Lineage Map (22)

Evolution requires the predecessor at **+5** (`EVOLUTION_REQUIRED_PLUS = 5`, unchanged from the T2 pass). Evolving pays the successor's normal base `cost` with **no catalyst**; Reconstruction pays **3.5×** that essence (split preserved per colour) plus **3 catalysts** of the item's family.

### 5.1 Continuing-biome lineages (20)

| T2 predecessor | → T3 successor | Slot | Continuity |
|---|---|---|---|
| `quake-hammer` | `mountain-avalanche-maul` | weapon | `empowered-mult-bonus`, aps 0.55 |
| `mountain-vest-t2` | `mountain-vest-t3` | armor | `guard.potency-pct` + damage cap |
| `mountain-charm-t2` | `mountain-charm-t3` | recovery | `barrier-pct` |
| `mountain-boots-t2` | `mountain-boots-t3` | mobility | `approach-speed-pct` |
| `ruinous-axe` | `cave-cataclysm-axe` | weapon | `dead-swing-interval` |
| `cave-vest-t2` | `cave-vest-t3` | armor | flat `damageReduction` + plating |
| `cave-charm-t2` | `cave-charm-t3` | recovery | `absorb-pct` |
| `cave-boots-t2` | `cave-boots-t3` | mobility | stealth |
| `swamp-mirebrand` | `swamp-blightbrand` | weapon | poison `weaponDot`, convPct 0.50 |
| `swamp-vest-t2` | `swamp-vest-t3` | armor | DoT resist / hit-to-DoT |
| `swamp-charm-t2` | `swamp-charm-t3` | recovery | recovery pulse |
| `swamp-boots-t2` | `swamp-boots-t3` | mobility | slow resist |
| `jungle-stinger-rapier` | `jungle-venomthorn-rapier` | weapon | `onHitDamage`, aps 1.65 |
| `jungle-vest-t2` | `jungle-vest-t3` | armor | `evasion` |
| `jungle-charm-t2` | `jungle-charm-t3` | recovery | ramping Recovery |
| `jungle-boots-t2` | `jungle-boots-t3` | mobility | speed line |
| `desert-sunsteel-cross` | `desert-solar-cross` | weapon | first-strike multiplier |
| `desert-vest-t2` | `desert-vest-t3` | armor | cheat-death + cleanse + debuff resist |
| `desert-charm-t2` | `desert-charm-t3` | recovery | cleanse / empty-heal |
| `desert-boots-t2` | `desert-boots-t3` | mobility | kite-speed |

### 5.2 Cross-biome handoffs (2) — the game's first

| T2 predecessor | → T3 successor | Why it is real |
|---|---|---|
| `plains-vest-t2` (Enduring Robe) | `volcanic-vest-t3` (Emberforge Plate) | `plating` is carried forward **literally, on the same stat key** (9 → 20) and matured with the hardening ramp. |
| `plains-charm-t2` (Stalwart Heart) | `volcanic-charm-t3` (Magmaheart Stone) | Identical `defense.recovery-on-kill-pct` key, extended with an always-active half. Kill-chain Recovery is the item's identity in both. |

### 5.3 Genuinely new T3 items (7) — no `evolvesFrom`, no `reconstructCost`

`tundra-permafrost-maul` (brittle stacks — no T2 item carries brittle) · `tundra-rimebrand` (frost `weaponDot`, convPct 0.70) · `tundra-vest-t3` (stationary-ramp DR) · `tundra-charm-t3` (barrier + absorb pairing) · `tundra-boots-t3` (ramp-speed momentum) · `volcanic-cinderlash` (`weapon.flurry-*` — no T2 weapon has flurry) · `volcanic-boots-t3` (`passive-speed-pct` + `suppress-ms`).

**20 + 2 + 7 = 29**, matching the live census exactly.

### 5.4 Multi-parent evolution: REJECTED, not deferred

`Recipe.evolvesFrom` remains a **single string** and `shared/src/data/recipes/types.ts` was not modified. No `evolvesFromAny`, no `lineageId` matching, no change to `evolution.ts` / `itemEvolution.ts` / `MakeTab.tsx`. `jungle-venomthorn-rapier` evolves **only** from `jungle-stinger-rapier` — same biome, same mechanic keys, same cadence, which is the stronger claim than the Forest needles' thematic one. Forest players reach it via Reconstruction, which is exactly the on-ramp Reconstruction exists to be. A test asserts the field does not exist anywhere in `RECIPE_DATABASE`, so it cannot creep in.

---

## 6. Explicit Dead-End Lineages (7)

No T3 item points at any of these. All were investigated against mechanic keys, not slot-and-biome coincidence.

| T2 item | Why it ends here |
|---|---|
| **Knight's Steelsword** (plains weapon) | Its entire identity is `technique.cooldown-reduction-pct` (every upgrade step adds 0.01 of it). Cinderlash is a flurry attack-speed weapon with **no CDR key anywhere**. The generalist Technique-CDR identity was deliberately retired to the **Arcanist Core**, not to a weapon. |
| **Gale Boots** (plains mobility) | `mobility.kill-speed-pct` + `kill-speed-ms` — a burst *earned by killing*. Magma Walkers are `mobility.passive-speed-pct` + `suppress-ms` — a standing bonus *removed by being hit*. Opposite shapes. Kill momentum genuinely stops at T2. |
| **Gale Needle**, **Thorn Needle** (forest weapons) | The game's only branched T1→T2 lineage ends at T2. Their fast on-hit rapier mechanic does continue, but into a Jungle line that has its own unambiguous T2 predecessor (§5.4). |
| **Phantom Bindings** (forest armor) | Jungle's evasion armor already runs `jungle-vest-t2 → jungle-vest-t3`. A second parent would be a many-to-one merge, which is rejected. |
| **Ancient Heartroot Amulet** (forest recovery) | Same — `jungle-charm-t2 → jungle-charm-t3` is the live Recovery line. |
| **Windstep Wraps** (forest mobility) | Same — `jungle-boots-t2 → jungle-boots-t3`. |

**Forest→Jungle, stated plainly:** the *mechanics* were re-housed (evasion, the Recovery foundation, traversal speed, and the green colour all went to Jungle) but the *items* were not, because Jungle authored its own complete T2 kit at the same time. **Zero Forest→Jungle lineages exist.** This is not an oversight to fix later.

**Swamp DoT → Tundra Rimebrand is NOT a relocation.** `tundra.recipes.ts` used to claim Tundra "owns the FROST DoT weapon line (relocated from Swamp)", which reads as an item chain moving. The data says otherwise: Swamp's poison DoT line is fully intact and continues inside Swamp (`ashbrand-blade → swamp-mirebrand → swamp-blightbrand`, all `element: 'poison'`, convPct 0.50). Rimebrand is `element: 'frost'`, convPct 0.70, with its own T4 successor. What relocated was a **design slot** (a second DoT flavour), not an item chain. Comment reworded in both files.

---

## 7. Final T3 Gear Costs

Method: continuing lineages are **2.00×** the finalized T2 predecessor's lifetime total; the two Plains→Volcanic handoffs are **2.2×** (Plains' T2 costs are deliberately depressed for early-game accessibility, so a flat 2.0× would land them below every other T3 item in their slot); genuinely-new items are priced into their slot's T3 band. Post-base spend `P` splits **4 / 10 / 16 / 26 / 44 %** across +1..+5 with residual rounding on +5, so **+4/+5 hold exactly ~70% of post-base spend on every one of the 29 items** — replacing the universal `+3 = +4 = +5` flat plateau, the flattest possible violation of the shipped curve grammar. **Base craft costs were left where they were** (74–140); all movement is in the upgrade track.

### 7.1 Mountain / Cave / Swamp

| Item | Slot | **Total** | Base | +1 | +2 | +3 | +4 | +5 |
|---|---|--:|---|---|---|---|---|---|
| Avalanche Maul | weapon | **2,444** | b116 | b93 | b233 | b372 | b605 | b1,025 |
| Summit Aegis | armor | **2,228** | b116/r29 | b66/r17 | b166/r42 | b266/r67 | b434/r108 | b734/r183 |
| Bastion Heart | recovery | **936** | b100/r25 | b26/r6 | b65/r16 | b104/r26 | b169/r42 | b286/r71 |
| Peak Stride | mobility | **658** | b100 | b22 | b56 | b89 | b145 | b246 |
| Cataclysm Axe | weapon | **2,328** | r120 | r88 | r221 | r353 | r574 | r972 |
| Deepscale Hide | armor | **2,418** | r116/y29 | r73/y18 | r182/y45 | r291/y73 | r473/y118 | r800/y200 |
| Echo Geode | recovery | **1,006** | r100/g25 | r28/g7 | r70/g18 | r113/g28 | r183/g46 | r310/g78 |
| Echostep Treads | mobility | **666** | r100 | r23 | r57 | r91 | r147 | r248 |
| Plague Fang | weapon | **2,444** | p116 | p93 | p233 | p372 | p605 | p1,025 |
| Plaguebound Shroud | armor | **2,358** | p140 | p89 | p222 | p355 | p577 | p975 |
| Sorrow Eye | recovery | **988** | p100 | p36 | p89 | p142 | p231 | p390 |
| Mire Striders | mobility | **688** | p100 | p24 | p59 | p94 | p153 | p258 |

### 7.2 Jungle / Desert

| Item | Slot | **Total** | Base | +1 | +2 | +3 | +4 | +5 |
|---|---|--:|---|---|---|---|---|---|
| Venomthorn Rapier | weapon | **2,090** | g120 | g79 | g197 | g315 | g512 | g867 |
| Wildgrowth Weave | armor | **2,070** | g90/y30 | g59/y19 | g146/y49 | g234/y78 | g380/y127 | g644/y214 |
| Worldvine Heart | recovery | **1,008** | g100 | g36 | g91 | g145 | g236 | g400 |
| Canopy Striders | mobility | **660** | g90 | g23 | g57 | g91 | g148 | g251 |
| Solar Falchion | weapon | **2,540** | y116 | y97 | y242 | y388 | y630 | y1,067 |
| Eternal Duneplate | armor | **2,520** | y120/p30 | y76/p19 | y190/p47 | y303/p76 | y493/p123 | y834/p209 |
| Oasis Heart | recovery | **1,310** | y100/p25 | y38/p9 | y95/p24 | y152/p38 | y246/p62 | y417/p104 |
| Mirage Striders | mobility | **864** | y90 | y31 | y77 | y124 | y201 | y341 |

### 7.3 Volcanic / Tundra

| Item | Slot | **Total** | Base | +1 | +2 | +3 | +4 | +5 |
|---|---|--:|---|---|---|---|---|---|
| Cinderlash | weapon | **2,540** | r140 | r96 | r240 | r384 | r624 | r1,056 |
| Emberforge Plate | armor | **2,112** | r120/y30 | r58/y20 | r146/y50 | r234/y80 | r380/y130 | r646/y218 |
| Magmaheart Stone | recovery | **1,100** | r75/y25 | r30/y10 | r75/y25 | r120/y40 | r195/y65 | r330/y110 |
| Magma Walkers | mobility | **680** | r74 | r24 | r61 | r97 | r158 | r266 |
| Permafrost Maul | weapon | **2,450** | b124 | b93 | b233 | b372 | b605 | b1,023 |
| Rimebrand | weapon | **2,444** | b120 | b93 | b232 | b372 | b604 | b1,023 |
| Glacial Bulwark | armor | **2,200** | b100/r25 | b66/r17 | b166/r42 | b266/r66 | b432/r108 | b730/r182 |
| Frostward Charm | recovery | **1,050** | b75/p25 | b28/p10 | b71/p24 | b114/p38 | b185/p62 | b314/p104 |
| Glacier Striders | mobility | **670** | b80 | b24 | b59 | b94 | b153 | b260 |

### 7.4 Largest changes (before → after)

| Item | Before | **After** | Δ | Why |
|---|--:|--:|--:|---|
| Peak Stride (mtn boots) | 387 | **658** | **+70%** | its base/+1 was inverted (base 100, then +1 costs **20**); the whole lifetime track cost less than three base crafts |
| Glacier Striders (tundra boots) | 470 | **670** | **+43%** | badly under the T3 boots band |
| Magma Walkers (volc boots) | 478 | **680** | **+42%** | same |
| Canopy Striders (jungle boots) | 465 | **660** | **+42%** | same |
| Glacial Bulwark (tundra armor) | 1,545 | **2,200** | **+42%** | the cheapest T3 armor by 20% against a band of 2,070–2,520 |
| Mirage Striders (desert boots) | 624 | **864** | **+38%** | Desert's T2 boots are the priciest; 2.0× carries through |
| Mire Striders (swamp boots) | 505 | **688** | **+36%** | boots band |
| Echostep Treads (cave boots) | 505 | **666** | **+32%** | boots band |
| Venomthorn Rapier (jungle wpn) | 1,650 | **2,090** | **+27%** | flattest curve in the game (1.50/1.33 ratios); Jungle was ~40% cheap overall |
| Cinderlash (volcanic wpn) | 3,140 | **2,540** | **−19%** | stood 24% above every other T3 weapon with no stated reason |
| Sorrow Eye (swamp charm) | 1,225 | **988** | **−19%** | part of the Swamp correction |
| Plaguebound Shroud (swamp armor) | 2,840 | **2,358** | **−17%** | most expensive T3 item, single colour, in the biome that is **first** by difficulty |
| Permafrost Maul (tundra wpn) | 2,914 | **2,450** | **−16%** | above the heavy-weapon band |
| Rimebrand (tundra wpn) | 2,820 | **2,444** | **−13%** | above the DoT-weapon parity point |
| Emberforge Plate (volc armor) | 2,400 | **2,112** | **−12%** | handoff anchor |

Every other item moves under 10% and is a **curve reshape**, not a repricing.

### 7.5 Kit totals — the Swamp/Jungle disparity, resolved

| Biome | T2 kit | T3 kit before | **T3 kit after** | T3/T2 |
|---|--:|--:|--:|--:|
| Mountain | 3,133 | 6,047 | **6,266** | 2.00× |
| Cave | 3,209 | 6,496 | **6,418** | 2.00× |
| Swamp | 3,239 | 7,284 | **6,478** | 2.00× |
| Jungle | 2,914 | 5,035 | **5,828** | 2.00× |
| Desert | 3,617 | 6,770 | **7,234** | 2.00× |
| Tundra (Maul route) | — | 6,154 | **6,370** | n/a |
| Volcanic | — | 7,243 | **6,432** | n/a |

Swamp : Jungle was **1.45×**; it is now **1.11×**. Spread across all seven kits tightens from 1.45× to **1.24×**, and every continuing biome lands on a clean 2.00× tier step. Desert is the most expensive kit, which is defensible since its T2 kit already was.

### 7.6 Arithmetic verification (designer correction 5)

Every row of the proposal's §6.2–§6.4 tables was re-derived before writing it into source: base + five steps against the stated total, the 4/10/16/26/44% share split, the +4/+5 share, and the per-colour lifetime hybrid split. **All 29 items checked out exactly; no arithmetic correction was needed and nothing was re-optimised.** Two *documentation* gaps in the proposal's narrative §6.5 summary are corrected here rather than silently: it omitted **Peak Stride (+70%, the single largest change in the pass)** and **Canopy Striders (+42%)** from its "material corrections" list, both of which the proposal's own cost table nonetheless specified correctly. The numbers shipped are the proposal's; only its prose undercounted them.

---

## 8. Catalyst Schedule

Applied **uniformly to all 29 T3 gear items, Volcanic included** — closing the hole where Volcanic's four items charged zero catalysts anywhere with no explanatory comment.

| Step | Weapon / Armor | Recovery / Mobility |
|---|--:|--:|
| Base craft **or** evolution | **0** | **0** |
| +1 / +2 / +3 | 0 | 0 |
| +4 | **2** | 0 |
| +5 | **3** | **2** |
| **Per item** | **5** | **2** |
| Reconstruction | **3** | **3** |

Per 4-slot kit: **14 catalysts**, up from T2's 8, and paid at *optimization* rather than at the door. This reverses the old T3 rule (3 on the base craft, 0 on every upgrade) and continues the T2 grammar one tier up: escalation, not inversion. Its real effect at T3 was never scarcity — it was a **gate on the first craft**, since a player entering a fresh T3 biome has zero of its catalysts banked.

**Families:** all 25 pre-existing tags preserved unchanged (including the deliberate non-native ones — Cave's whole kit on `swarming`, Rimebrand on `fortified`). Volcanic's four needed families for the first time; assigned by the repo's own "family follows the ITEM, not the biome" rule:

| Volcanic item | Family | Reason |
|---|---|---|
| Emberforge Plate | **alacrity** | inherits its parent `plains-vest-t2`'s tag verbatim ("plating answers frequent light hits → Alacrity") |
| Magmaheart Stone | **alacrity** | inherits `plains-charm-t2`'s established family |
| Cinderlash | **swarming** | genuinely new item → Volcanic's native family |
| Magma Walkers | **swarming** | same |

Supply check against T3 node counts (alacrity 4, heavy 8, swarming 8, dominion 9, fortified 8): no family is under-supplied. Alacrity is the scarcest by node count and this pass raises its demand 22 → 28 units, but supply and demand are co-located — Jungle hosts 2 of the 4 alacrity nodes and Volcanic a third, so both biomes that spend it can farm it locally. At ~1–4 kills per catalyst, the largest family demand (heavy, 39 units) is ~47 kills against a kit bill of thousands of kills' worth of essence. **This is a payment-timing shape, not a scarcity wall.**

**Core catalyst costs were not touched anywhere.** The nine T3 Cores still draw 2–3 units each on their existing families (23 units total); confirmed non-contending with gear + stance + rite demand.

---

## 9. Abilities

No catalysts, no unlock/gate/effect/`recipeGroup` change — costs only.

| Ability | Biome / gate | Slot | Before | **After** |
|---|---|---|--:|--:|
| Binding Strike | Tundra L3 | Technique | blue 650 | **blue 150** |
| Frenzy | Volcanic L3 | Technique | red 650 | **red 175** |
| Break Free | Tundra L5 | Guard | blue 760 | **blue 190** |
| Quick Strike | Volcanic L5 | Technique | red 760 | **red 210** |

Ordering within each biome (L3 < L5) is preserved, and the premium tracks *how optional the tool is*: Binding Strike and Break Free are counterplay (Break Free is the game's only escape from hard control), Frenzy is broadly useful but optional, Quick Strike is specialised filler and so the priciest. For scale, Break Free previously cost 760 blue against a Tundra boots track of 470 — it was priced as gear; at 190 it costs roughly one +2 upgrade step.

The stale policy comment in `abilityRecipes.ts` ("costs … roughly double per tier") is replaced. That ladder — 25/90 → 320/380 → 650/760 → 1300/1500 — has now been abandoned by three consecutive passes and was presenting itself as current policy. **T4 (1,300/1,500) was deliberately NOT repriced** and is flagged in the file as still sitting on the obsolete ladder; this pass therefore moves the ability cliff from the T2→T3 seam to the T3→T4 seam (210 → 1,300 = 6.2×), which the T4 pass owns.

---

## 10. Stances and Rites

**Stances — catalysts only.** Essence, gates, families and mechanic identities untouched. The 1 → 5 jump was a scoping artefact: the T2 pass normalised every T2-accessible stance to exactly 1 and explicitly left T3/T4 out, so essence grew 1.8× across the step while catalysts grew 5×.

| Stance | Biome / gate | Essence (unchanged) | Before | **After** |
|---|---|---|--:|--:|
| Berserker | desert L11 | red 140 / purple 40 | dominion 5 | **dominion 2** |
| Predator | jungle L11 | green 130 / red 50 | alacrity 5 | **alacrity 2** |
| Brawler | volcanic L5 | yellow 130 / red 50 | swarming 5 | **swarming 2** |
| Execute | swamp L13 | purple 130 / red 50 | fortified 5 | **fortified 2** |

T4's Recuperating Stance (alacrity 7) is untouched and pinned by a test.

**Rites — catalysts only. ALL SIX ESSENCE COSTS ARE UNCHANGED** (designer correction 9, overriding the proposal, which wanted to cut Lingering Battle from 170 to 140 to restore monotonicity with RP).

| Rite | Biome / gate | RP | Essence (**unchanged**) | Before | **After** |
|---|---|--:|---|--:|--:|
| Swift Repose | cave L15 | 2 | red 120 | dominion 4 | **dominion 2** |
| Lingering Battle | mountain L15 | 2 | blue 130 / yellow 40 | heavy 5 | **heavy 2** |
| Purification | swamp L15 | 3 | purple 120 / green 40 | fortified 4 | **fortified 2** |
| Blood Offering | volcanic L5 | 3 | red 130 / green 40 | swarming 5 | **swarming 2** |
| Mechanic Renewal | tundra L5 | 5 | blue 160 / yellow 60 | heavy 6 | **heavy 3** |
| Ability Reprieve | desert L11 | 5 | red 160 / purple 60 | dominion 6 | **dominion 3** |

**The rule recorded, so it is not re-litigated:** *Rite essence is not required to be monotonic in RP cost.* RP is **loadout opportunity cost**; essence is **acquisition cost**. They are different currencies answering different questions, and Lingering Battle sitting at 2 RP / 170 essence is not an inversion to fix. Catalysts follow RP (ordinary/low-mid-RP → 2, premium 5-RP → 3); essence does not have to. Written into the `riteRecipes.ts` header and guarded by a test that pins all six essence costs exactly.

RP costs are untouched by design: all six rites still total 20 RP against a 19-RP budget at GM 114. Limited RP forcing a build choice is intended, not an oversight.

**No T3 Rune recipes were authored** and the shared RP formula is unchanged. Zero T3 runes is intentional — T3's RP layer is Rites. A test asserts the count stays zero so it is not "fixed" by a future pass.

---

## 11. Hybrid Economy — the current rule

> **A biome determines the HOME essence. The borrowed mechanic determines the SPLASH essence.**

Both halves hold at once, and this is what supersedes the older "when a biome retires, its colour is re-housed in whichever successor inherits its mechanic" formulation. Under the hybrid model — which did not exist when that rule was written — Volcanic being **red** while paying a **yellow** splash for its Plains-derived plating/hardening and kill-chain Recovery is not a defect; it is the model working. **Volcanic's home colour was deliberately NOT moved to yellow.**

`design_docs/economy-philosophy.md` was **deliberately left untouched** as historical design archaeology. There is no economy `*-current-state.md` doc to update, so this ledger is the record; the rule is also written into `volcanic.recipes.ts`'s header, where the first cross-biome lineage lives.

Structural rules, all now enforced by test:
- **Weapons and mobility stay pure** — 8/8 weapons and 7/7 boots are single-colour.
- **Only armor and recovery/charm may be hybrid**, and only where the item genuinely borrows another mechanic.
- **Home colour dominant, 75/25 or 80/20, splash never above 33%.**

The old defect was that splash drifted *upward* through the curve and never downward — every hybrid started at 75–80% home on the base craft and ended at 67–79% over its lifetime, with five items pinned at the 32–33% ceiling. The mechanism was the flat plateau repeating the (splash-heavy) +3 ratio three times, so §7's curve reshaping fixes it structurally:

| Hybrid item | Base split | Lifetime BEFORE | **Lifetime AFTER** | Target |
|---|---|---|---|---|
| Summit Aegis | 80/20 | 75.0 / 25.0 | **80.0 / 20.0** | 80/20 |
| Bastion Heart | 80/20 | 68.3 / 31.7 | **80.1 / 19.9** | 80/20 |
| Deepscale Hide | 80/20 | 75.3 / 24.7 | **80.0 / 20.0** | 80/20 |
| Echo Geode | 80/20 | 78.4 / 21.6 | **79.9 / 20.1** | 80/20 |
| Eternal Duneplate | 80/20 | 73.8 / 26.2 | **80.0 / 20.0** | 80/20 |
| Oasis Heart | 80/20 | 79.1 / 20.9 | **80.0 / 20.0** | 80/20 |
| Wildgrowth Weave | 75/25 | 68.5 / 31.5 | **75.0 / 25.0** | 75/25 |
| Emberforge Plate | 80/20 | 67.5 / 32.5 | **75.0 / 25.0** | 75/25 |
| Magmaheart Stone | 75/25 | 67.4 / 32.6 | **75.0 / 25.0** | 75/25 |
| Frostward Charm | 75/25 | 67.3 / 32.7 | **75.0 / 25.0** | 75/25 |
| Glacial Bulwark | 80/20 | 76.4 / 23.6 | **80.0 / 20.0** | 80/20 |

**Splash now tops out at 25%**, well under the ceiling.

**The three pure hybrid-eligible items are correct as pure**, and the reason is now written into the files rather than the items being hybridized — forcing a splash onto them would be exactly the arbitrary cross-colour tax the philosophy forbids:
- **Plaguebound Shroud** (swamp armor) — debuff-resist/cleanse *is* the purple identity; it is what Eternal Duneplate borrows purple **for**. A Swamp item borrowing purple from Swamp is not a hybrid.
- **Sorrow Eye** (swamp charm) — the recovery pulse is Swamp-native; nothing is borrowed.
- **Worldvine Heart** (jungle charm) — the ramping-Recovery foundation is the Forest→Jungle inheritance and green followed it, so mechanic and home colour are the same colour. Nothing left to splash.

---

## 12. Quest Data-Integrity Cleanup

`QUEST_DATABASE.targetMonsterTypes` named **14 monster IDs that do not exist in `MONSTER_DATABASE`**, across three tiers. These no longer gate tier advancement (boss seals do) but the counters still drive **auto-combat target priority** and **HUD unlock gating**, so they were live-path dead weight.

| Quest | Dead IDs removed | n |
|---|---|--:|
| `tier-2` | `glacial-colossus` | 1 |
| `tier-3` | `elder-gnarled-greatbear`, `plains-warlord`, `lich-king` | 3 |
| `tier-4` | `glacial-titan`, `mountain-titan`, `elder-treant-lord`, `stampede-emperor`, `desert-eternal`, `jungle-ancient-lord`, `inferno-lord`, `undying-lord`, `cave-titan`, `swamp-sovereign` | 10 |

The two dead Plains/Forest T3 IDs are fossils of the pre-retirement roster; `cave-titan`/`swamp-sovereign` were doubly wrong since Cave and Swamp retire after T3. **All of them were fixed, not just T3's.**

Each list is now exactly its tier's live `bossPoolByTier` union — which is what the file's own header comment already claimed it was:

| Quest | Final `targetMonsterTypes` | n | Seals required |
|---|---|--:|---|
| `tier-1` | `gnarled-greatbear`, `crag-behemoth`, `tusked-razorback`, `grave-toadeater`, `obsidian-broodmother` | 5 | 2 of 5 ✔ (already correct) |
| `tier-2` | `apex-timberclaw`, `stoneplate-juggernaut`, `gorging-razortusk`, `mire-gorged-behemoth`, `chitinous-dreadbore`, `jungle-dread-gorger`, `dune-stalker-emperor` | 7 | 3 of 7 ✔ |
| `tier-3` | `crag-gorged-horn-behemoth`, `rot-spore-croc-behemoth`, `deep-core-burrow-gorger`, `apex-bramble-slasher`, `frost-plated-rime-mammoth`, `dune-carapace-monarch`, `cinder-shell-magma-salamander` | 7 | 4 of 7 ✔ |
| `tier-4` | `iron-crest-titan`, `verdant-crown-predator`, `glacial-patriarch`, `dune-throne-sovereign`, `caldera-sovereign`, `charnel-crown-sovereign`, `elder-trench-serpent` | 7 | 5 of 7 ✔ |

Each list's length now matches `SEALS_REQUIRED_BY_TIER`'s denominator exactly — a satisfying cross-check. **No quest advancement logic was redesigned**: `killsRequired`, `tierRequired`, names and descriptions are untouched. Guarded permanently by the new `server/test/questMonsterIds.test.ts`, written against the databases rather than a hardcoded list.

---

## 13. Save Compatibility

**No stored player value is mutated, and no legacy character regresses.** The cap functions purely as a *gain stop*: `applyBiomeXP` early-returns `{ xpGain: 0 }` when `prevLevel >= levelCap` and never writes a lower level, and `globalMastery()` sums raw `biomeLevel` with no ceiling — so a legacy character sitting at Plains 15 or 18 keeps that level, keeps the GM it confers, and keeps every upgrade level it bought. `upgradeCeilingFromGlobalMastery` walks upward from live GM, so a GM above 114 simply returns +5; over-cap players are strictly advantaged, never clipped. `isBiomeLevelCapped` correctly reports such biomes as finished, which is the desired auto-traverse behaviour.

The only visible effect was cosmetic — three call sites rendered `level / cap` and would have shown `15 / 12`. All three now display `Math.max(cap, currentLevel)`. Presentation only, no gameplay effect. Two dedicated tests pin the no-clamp guarantee.

**No recipe of any kind is stranded** by the new caps: a sweep over `RECIPE_DATABASE`, `ABILITY_RECIPE_DATABASE`, `RUNE_RECIPE_DATABASE`, `STANCE_RECIPE_DATABASE` and `RITE_RECIPE_DATABASE` found zero entries whose `requiredBiomeLevel` exceeds its group's new cap at its own tier. `recipeGates.test.ts` still passes with `RETIRED_BIOME_DEBT` **empty**.

---

## 14. T4 Architecture Side Effects — intentional, not compensated

The generic model transfers cleanly and needs no T4-specific addendum. T4's caps come out as plains 12, forest 12, **cave 18, swamp 18** (both retire after T3), mountain 24, jungle 18, desert 18, tundra 12, volcanic 12, graveyard 6, trench 6 → **`maxGlobalMasteryAtTier(4) = 156`**, down from 192, with gates 122/131/139/148/156.

Four points:
1. **T4's equivalent retired-biome problem is fixed automatically.** Today's ceiling counts 36 GM from Plains+Forest (no T3 *or* T4 nodes) and full T4 headroom for Cave and Swamp (no T4 nodes). All of that stops being demanded.
2. **No new grind is introduced.** Cave and Swamp contribute 18 each at T4 — levels the player already earned during T3.
3. **Band width becomes a uniform 42 GM** for T2/T3/T4.
4. **No T4 recipe is stranded**; Cave and Swamp have no tier-4 recipes at all.

**Per the designer's instruction, NO T4 gear cost, combat stat, ability cost, catalyst cost or lineage was changed to compensate.** The only T4-adjacent edits are three stale *test expectations* that followed directly from the old (incorrect) mastery architecture: `maxGlobalMasteryAtTier(4)` 192 → 156, and the `upgradeCeilingFromGlobalMastery(198, 4)` case → 156 (plus a 155 → +4 boundary case added). Nothing was retuned to restore old benchmark outputs.

T4's *economy* is not redesigned here and inherits every discontinuity this pass creates on the T3→T4 seam: abilities (210 → 1,300), stance catalysts (2 → 7 on Recuperating), the gear curve shape (T4 items were never checked for the plateau), and the absence of T3→T4 lineages. A T4 pass in this series' shape is the natural follow-up.

**Balance benches:** `server/bench/balance/botFactory.ts`'s `canonicalBiomeLevels` calls `biomeLevelCap`, so the canonical T3 bot automatically drops from GM 126 to GM 114 and the T4 bot from 192 to 156. **Any bench output that moves solely because canonical T3/T4 mastery is now correct is expected and was NOT compensated for by tuning combat data.** No progression bots were run.

---

## 15. Tests and Results

### New — `server/test/t3ProgressionEconomy.test.ts`

*Mastery (§1 of the file):*
1. `BIOME_FINAL_TIER_BY_GROUP` equals the derived max normal/dungeon tier per group — asserts the *derivation*, not a hand-copied table.
2. **The hazard guard** (designer correction 1): the `normal`-only and `normal|dungeon` derivations must agree for every group, with a failure message telling the next author to narrow to `normal` if a side dungeon ever outlives its biome's normal content.
3. No biome may contribute mastery headroom for a tier it has no authored node at — the direct guard against the GM-ceiling debt.
4. A retired biome's cap freezes once its content ends, for every tier above it.
5. `maxGlobalMasteryAtTier` sums exactly the groups with authored nodes (no phantoms).
6. Ceiling pins: 30 / 72 / **114** / **156**.
7. Per-biome T3 caps match the intended roster exactly.
8. Gate pins for all four tiers, including **T1/T2 bit-identical** as the backward-compatibility guard.
9. **Generic reachability:** `globalMasteryRequiredForUpgrade(t, 5) <= maxGlobalMasteryAtTier(t)` for every tier — the assertion whose absence caused the original defect.
10. Save safety: a legacy GM-126 record keeps its full GM, legitimately exceeds the new ceiling, still yields +5, and no stored level is mutated.

*Evolution (§2):* exactly 22 lineages by id, matching the approved map; +5 required on each; predecessor exactly one tier below and in the same slot; the 7 new items carry neither `evolvesFrom` nor `reconstructCost` and 22 + 7 accounts for all 29; **the 7 confirmed dead-end T2 items have no heir**; **no `evolvesFromAny` field exists anywhere** and every `evolvesFrom` is a single resolving string; a +4 predecessor cannot evolve and a +5 one can, spot-checked on a continuing lineage *and* on both Plains→Volcanic cross-biome handoffs; every reconstruct is 3.5× base per colour (±1) plus exactly 3 catalysts.

*Gear (§3):* approved lifetime total for **all 29 items**; strictly accelerating steps; +4/+5 in the 65–75% band; weapons/mobility single-colour and hybrids inside 73–82% home with splash ≤33%; the full catalyst schedule (base craft catalyst-free; weapon/armor 0/0/0/2/3, recovery/mobility 0/0/0/0/2; one family per item); Volcanic's four new family assignments pinned; slot ordering per biome (weapon & armor > recovery > mobility).

*Abilities / stances / rites (§4):* the four ability costs, gates, tiers and catalyst-freeness; the four stance catalysts at exactly 2 of the correct family **with essence costs pinned unchanged**; T4 Recuperating pinned untouched; **all six rite essence costs pinned exactly** (the specific regression the designer's correction asked to guard) alongside their new catalyst counts; zero T3 rune recipes.

### New — `server/test/questMonsterIds.test.ts`
Generic, written against `QUEST_DATABASE` / `MONSTER_DATABASE` / `BIOME_DATABASE`: every target id resolves, no duplicates, each tier-advancement quest's list equals that tier's live `bossPoolByTier` union in both directions, and `tier-0`'s tutorial target is not a boss.

### Updated
- `shared/src/systems/itemUpgrades.test.ts` — 126→114, 192→156, GM-198→156 ceiling case, plus a new 155→+4 boundary assertion and a reworded band-derivation comment.
- `server/test/catalystRekey.test.ts` — checked for stale assertions (it broke on the T2 pass for exactly this reason); **no change needed, passes as-is**.
- `shared/src/data/recipeGates.test.ts` — **no change**; `RETIRED_BIOME_DEBT` stays empty and it passes.

### Results
- `pnpm typecheck` (shared, server, client, admin, bot, **and `typecheck:bench`**) — **clean.**
- `pnpm test` — **112/112 passed**, including both new suites, `recipeGates`, `catalystRekey`, `coreAuthoring`, `relics`, `rites`, `stances` and `t2ProgressionEconomy` (which pins the T1/T2 numbers this pass must not disturb).
- No generated artefact needed rebuilding: `pnpm typecheck` resolves `@mmo-idle/shared` through the development condition to source, not `shared/dist`, so no stale dist output was relied on and `pnpm build` was not required for validation.
- **No progression bots were run**, per instruction.

---

## 16. Remaining Runtime Hypotheses

**H1 — Pacing (needs runtime/bot validation, deliberately NOT solved by guesswork).** The 2.00× tier step was anchored on the finalized T2 predecessor totals, and against the estimated income figure (~7,450 essence of the home colour per 6-level band) every kit sits inside one band's yield — which was **inverted for Swamp** before this change. But whether biome mastery actually *completes before* full economic optimization at T3 is a live-pacing question that static arithmetic cannot answer: it depends on real kill rates, node-modifier premiums, essence-tier multipliers and how much of a band a player spends in dungeons. **Recorded as a hypothesis to measure, not a number to pre-emptively inflate or shrink.** The right instrument is a canonical T3 bot route, which should be authored *after* this economy ships so it measures the shipped numbers rather than the old ones.

**H2 — Balance bench baselines shift, and that is correct.** Canonical T3/T4 bots drop from GM 126/192 to 114/156. Any bench delta traceable solely to that is the architecture becoming correct, not a regression. Do not tune combat data to restore the old outputs.

**H3 — Alacrity demand.** This pass raises alacrity from 22 to 28 units against the scarcest family by node count (4 T3 nodes). Supply and demand are co-located and the margin is large, but it is the one family worth watching if T3 farming ever feels catalyst-gated. The alternative — tagging Emberforge Plate and Magmaheart Stone `swarming` — was considered and rejected: it breaks the family-follows-mechanic rule for no real supply gain.

**H4 — The T3→T4 seam is now the sharpest in the game.** Three consecutive tier passes have repriced T1–T3 while T4 stayed on the abandoned ladder. The discontinuities are enumerated in §14 and are the T4 pass's inheritance.

---

## 17. Where the designer's corrections overrode the proposal

Recorded so the two documents can be read together without confusion.

| # | Proposal said | **Shipped instead** |
|---|---|---|
| 1 | Derive final tier from `normal | dungeon`, no verification | Same derivation, but **verified from data** that dungeon tiers never exceed normal tiers, and **pinned by a failing-loudly regression test** so a future side dungeon cannot silently extend a retired biome |
| 3 | Flagged multi-parent evolution as a **[BLOCKER]** needing a schema change | **Explicitly rejected.** No schema change, no `evolvesFromAny`; single-parent is the design, and a test enforces it |
| 5 | — | Verified every cost row arithmetically; corrected the proposal's narrative §6.5 for two omitted large changes (Peak Stride +70%, Canopy Striders +42%) |
| 9 | Cut Lingering Battle's essence 170 → 140 to make rite essence monotonic in RP | **Not done.** All six rite essence costs unchanged; the "essence need not be monotonic in RP" rule is now written into the file |
| 12 | Amend `design_docs/economy-philosophy.md §2` to record the colour-rule supersession | **Not done.** That doc is left as historical archaeology; the current rule is recorded here and in `volcanic.recipes.ts` |
| 15 | Noted the T4 GM shift as an implication | Confirmed **intentional and not compensated**; only stale test expectations were updated |
