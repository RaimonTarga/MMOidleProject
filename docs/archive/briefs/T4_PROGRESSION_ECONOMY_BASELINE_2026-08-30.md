> **ARCHIVED — implemented 2026-08-30; live state in `docs/briefs/T4_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-30.md`.**
> Kept as the pre-rebalance factual baseline.

# T4 Progression Economy — Baseline Audit

**Date:** 2026-08-30 (baseline pass), **corrected 2026-08-30** (this pass: recomputed
every derived figure directly from live TypeScript objects via a throwaway `tsx` script
that imported the real recipe/monster/biome maps — not by re-reading tables by eye).
**Status:** AUDIT ONLY. No gameplay, balance, or data file was changed to produce this
document. Every number below is read directly from live source; where a T1–T3 brief is
quoted for comparison, the live T4 source was independently re-verified rather than
assumed to match that brief's forward-looking claims about T4.

**Correction-pass note:** the 2026-08-30 baseline draft contained a gear-count error (41
vs the true 39), several incorrect lifetime-total/ratio computations (Titan's Keep,
Fortress Heart, Primal Canopy, Zenith Falchion, Glacial Tyrant Maul, Glacial Rimebrand,
Eruption Lash), a self-contradiction between the executive summary and §10 on which
biomes charge zero T4 catalysts, and an incompletely-extracted §16. All are corrected
below and marked inline with **CORRECTED:**. A new, previously-unreported defect was
also found in this pass: Trench's three live T4 monsters grant **blue** essence while
Trench's own T4 gear costs **green** and Trench's boss grants **purple** — three
different essence colors inside one biome (§16).

**Scope note:** gear/relic/core/ability/rune/stance/rite/boss/quest data for all seven
live T4 biomes (Mountain, Jungle, Desert, Tundra, Volcanic, Graveyard, Trench) was read
in full from `shared/src/data/recipes/*.ts`, `shared/src/abilityRecipes.ts`,
`shared/src/runeRecipes.ts`, `shared/src/stanceRecipes.ts`, `shared/src/riteRecipes.ts`,
and `shared/src/data/monsters/bossesT4.ts`. **CORRECTED:** non-boss T4 monster
essence/XP/HP data is now exhaustively enumerated for all seven biomes (§16), reading
the real T4 spawn roster per biome from `shared/src/biomeDatabase.ts`
(`monsterPoolByTier[4]`) and pulling each monster's live stats from its
`shared/src/data/monsters/*.monsters.ts` file — the previous draft's single-biome sample
(Mountain) is superseded.

---

## 1. Executive summary

T4 is economically **frozen at the pre-rework baseline** that T1, T2, and T3 have each
already moved past. The mastery/GM *architecture* (retirement-aware caps, the 156 ceiling,
122/131/139/148/156 gates) is inherited automatically and verified correct — this is the
one area where T4 is already fixed, for free, by the generic T3 fix. Everything else that
the T1→T3 passes changed is still on the old shape at T4:

- **Zero T4 gear item has `evolvesFrom`.** The evolution/reconstruction infrastructure
  T2 introduced and T3 extended to 22 lineages does not exist at the T3→T4 seam at all,
  despite obvious mechanical continuations (Warmaul continues the empowered-hammer line,
  Deathfang Rapier continues the on-hit rapier line, Zenith Falchion continues the
  first-strike line).
- **Every T4 gear item's upgrade curve is a flat +3=+4=+5 plateau** — the exact defect
  the T1/T2/T3 passes each replaced with an accelerating 4/10/16/26/44% curve.
- **T4 catalyst timing is base-craft gating**, the opposite of T3's shipped
  optimization-first schedule, and it is *inconsistently applied*: Mountain, Jungle, and
  Tundra charge 4 catalysts on every T4 base craft; Desert, Volcanic, Graveyard, and
  Trench charge **zero** catalysts anywhere in their T4 gear. **CORRECTED:** the original
  draft of this summary put Desert in the charging group and Volcanic/Graveyard/Trench
  in the zero group (3-and-4 split the wrong way round); the live data (verified by
  importing every recipe object, §4/§10) puts Desert in the zero group alongside
  Volcanic/Graveyard/Trench — **3 of 7 biomes charge, 4 of 7 charge nothing**. §10's
  table already had this right; only this summary paragraph was wrong.
- **The T3→T4 ability cost cliff is real and large**: 210 (T3 max) → 1,300 (T4 min) =
  **6.2×**, confirmed live in `shared/src/abilityRecipes.ts`, which itself carries a
  code comment flagging T4 as unrepriced.
- **Recuperating Stance's catalyst cost of 7** is confirmed live and is an isolated
  outlier — every other stance/rite in the game charges 2 or 3.
- **Relics are a complete, internally coherent, T4-only system**: 8 relics, one per
  active T4 biome family, uniform shape (single craft, no upgrades, no lineage chains,
  ~200–270 essence + 4 catalysts each).
- **Runes add exactly one new T4 recipe** (`rune-recipe-focus-elites`, Graveyard);
  Rites add **zero** new T4 content; Stances add zero new T4 content beyond the
  pre-existing Recuperating Stance.

None of this is a runtime/pacing hypothesis — it is read directly from the recipe and
ability databases. The T4 economy pass this baseline sets up for is a repricing/curve/
lineage pass of the same shape as the T1→T3 passes, not a discovery exercise.

---

## 2. T4 progression/gating

Formulas verified live in `shared/src/config/gameConfig.ts` (re-exported/aliased via
`shared/src/world/nodeBiomes.ts:214-341`, which is the actual implementation file):

```ts
// shared/src/world/nodeBiomes.ts:237-246
export const BIOME_FINAL_TIER_BY_GROUP = /* derived from NODE_BIOMES, normal|dungeon kinds */;

// :286-295
export function biomeLevelCap(playerTier, biomeGroup) {
  if (biomeGroup === 'clearing') return 4;
  const startTier = BIOME_START_TIER_BY_GROUP[biomeGroup] ?? 1;
  const finalTier = BIOME_FINAL_TIER_BY_GROUP[biomeGroup] ?? startTier;
  const effectiveTier = Math.min(playerTier, finalTier);
  return Math.max(0, (effectiveTier - startTier + 1) * BIOME_LEVELS_PER_TIER);
}

// :334-341
export function maxGlobalMasteryAtTier(playerTier) {
  // sums biomeLevelCap(playerTier, group) over every non-clearing group
}
```

`BIOME_LEVELS_PER_TIER = 6` (`nodeBiomes.ts:255`).

**Verified T4 per-biome caps** (derived from `BIOME_START_TIER_BY_GROUP` /
`BIOME_FINAL_TIER_BY_GROUP`, cross-checked against the live recipe files' highest
`requiredBiomeLevel` and pinned by `shared/src/systems/itemUpgrades.test.ts:20-27`):

| Biome | start tier | final tier | cap @T4 |
|---|--:|--:|--:|
| plains | 1 | 2 | 12 |
| forest | 1 | 2 | 12 |
| mountain | 1 | 4 | 24 |
| cave | 1 | 3 | 18 |
| swamp | 1 | 3 | 18 |
| jungle | 2 | 4 | 18 |
| desert | 2 | 4 | 18 |
| tundra | 3 | 4 | 12 |
| volcanic | 3 | 4 | 12 |
| graveyard | 4 | 4 | 6 |
| trench | 4 | 4 | 6 |
| **sum = `maxGlobalMasteryAtTier(4)`** | | | **156** |

Pinned exactly by `shared/src/systems/itemUpgrades.test.ts:27`:
`assert(maxGlobalMasteryAtTier(4) === 156, 'max GM at tier 4')`.

**T4 upgrade gates** (`globalMasteryRequiredForUpgrade(4, plus)`, band = 156−114 = 42):

| +1 | +2 | +3 | +4 | +5 |
|--:|--:|--:|--:|--:|
| 122 | 131 | 139 | 148 | 156 |

Matches the task brief's expected 122/131/139/148/156 exactly, and matches
`itemUpgrades.test.ts:69`: `upgradeCeilingFromGlobalMastery(156, 4) === MAX_UPGRADE`.

**RP budget at max T4 GM:** `runeBudgetForGlobalMastery(gm) = 8 + floor(gm / 10)`
(`shared/src/runeDatabase.ts:767-771`, `RUNE_POINT_GLOBAL_MASTERY_STEP = 10` at line 767).
At GM 156: `8 + floor(15.6) = 23` RP.

**Newly available systems at T4:** Relics (T4-exclusive, §14), one new Rune
(`focus-elites`, Graveyard), the four T4 abilities (Disengage/Recuperate/Snipe/Stunning
Strike), and the seven T4 boss encounters (§17). No new Cores, Stances, or Rites are
introduced at T4 — the last new content in those three systems is T3.

**Entry/exit and boss/seal requirements:** `shared/src/quests/questDatabase.ts:84-97`
(`tier-4`, "Final Reckoning") requires clearing **5 of 7** T4 bosses
(`SEALS_REQUIRED_BY_TIER`, not independently re-read here but cross-checked against the
T3 ledger's claim of "5 of 7 ✔"), with `targetMonsterTypes` listing exactly the seven live
T4 boss ids (verified §17).

---

## 3. T4 biome roster and retirement status

| Biome | T4 normal/dungeon nodes | T4 boss | T4 gear | T4 relic | Status |
|---|---|---|---|---|---|
| Plains | none (final tier 2) | none | none | none | **Retired at T2**, frozen cap 12 |
| Forest | none (final tier 2) | none | none | none | **Retired at T2**, frozen cap 12 |
| Mountain | yes (tiers 1-4) | iron-crest-titan | 8 items (2 weapon branches, 2 armor branches, 2 charm branches, 1 boots) + 2 relics + no new core | 2 relics (`colossus-heart`, `equilibrium-shard`) | **Continuing** through T4, only biome with T1-T4 nodes |
| Cave | none (final tier 3) | none | none | none | **Retired at T3** — confirmed zero T4 recipes anywhere in `cave.recipes.ts` |
| Swamp | none (final tier 3) | none | none | none | **Retired at T3** — confirmed zero T4 recipes anywhere in `swamp.recipes.ts` |
| Jungle | yes (tiers 2-4) | verdant-crown-predator | 6 items + 1 relic | `relic-verdant-flywheel` | **Continuing** |
| Desert | yes (tiers 2-4) | dune-throne-sovereign | 5 items + 1 relic | `relic-withering-lens` | **Continuing** |
| Tundra | yes (tiers 3-4) | glacial-patriarch | 7 items (2 weapon branches, 3 charm branches, 1 armor, 1 boots) + 1 relic | `relic-glacial-bell` | **Continuing** |
| Volcanic | yes (tiers 3-4) | caldera-sovereign | 6 items (2 weapon branches, 2 armor branches, 1 charm, 1 boots) + 1 relic | `relic-hastebound-dial` | **Continuing** |
| Graveyard | yes (T4 only) | charnel-crown-sovereign | 6 items (weapon, 2 armor branches, 2 charm branches, boots) + 1 relic | `relic-haunted-prism` | **New at T4**, PARTIAL per its own file header (see §6) |
| Trench | yes (T4 only) | elder-trench-serpent | 5 items (weapon, armor, charm, 2 boot branches) + 1 relic | `relic-virulent-hourglass` | **New at T4**, header comment stale (see §6) |

**Cave/Swamp retirement verified**: `Grep 'tier: 4'` over `cave.recipes.ts` and
`swamp.recipes.ts` returns zero matches; both files' recipe arrays end at their T3
entries plus their (T3-gated) core recipes. No T4 gear, relic, or boss exists for either
biome. This matches the T3 ledger's claim exactly.

---

## 4. Complete ordinary gear inventory (T4 tier)

All costs in essence unless noted; `cat` = catalyst family:qty on base craft (T4 gear
never carries a catalyst cost on any upgrade step — see §7/§10). Source: the recipe files
named per row, read in full.

### Mountain (`mountain.recipes.ts:298-440`)

| id | name | slot | gate | base cost | cat | +1 | +2 | +3 | +4 | +5 | evolvesFrom |
|---|---|---|--:|---|---|--:|--:|--:|--:|--:|---|
| mountain-earthsunder-maul | Earthsunder Maul | weapon | 19 | blue 256 | heavy 4 | 384 | 768 | 1290 | 1290 | 1290 | — |
| mountain-warmaul | Warmaul | weapon | 19 | blue 240 | heavy 4 | 360 | 720 | 1200 | 1200 | 1200 | — |
| mountain-vest-t4 | Titan's Keep | armor | 20 | blue 256/red 64 | heavy 4 | 290/96 | 572/192 | 858/290 | 858/290 | 858/290 | — |
| mountain-vest-t4-stormwall | Stormwall Plate | armor | 20 | blue 256/red 64 | heavy 4 | 290/96 | 572/192 | 858/290 | 858/290 | 858/290 | — |
| mountain-charm-t4 | Fortress Heart | recovery | 21 | blue 220/red 30 | heavy 4 | 110/30 | 220/60 | 340/90 | 340/90 | 340/90 | — |
| mountain-charm-t4-shieldmend | Shieldmend Ward | recovery | 21 | blue 220/red 30 | heavy 4 | 110/30 | 220/60 | 340/90 | 340/90 | 340/90 | — |
| mountain-boots-t4 | Vanguard Stride | mobility | 22 | blue 220 | heavy 4 | 44 | 92 | 165 | 165 | 165 | — |

Two branch pairs (weapon, armor, recovery) share a base gate and cost, diverging only in
mechanic identity — the Mountain T4 kit is 4 base slots authored as 7 craftable items.

### Jungle (`jungle.recipes.ts:169-258`)

| id | name | slot | gate | base cost | cat | +1 | +2 | +3 | +4 | +5 | evolvesFrom |
|---|---|---|--:|---|---|--:|--:|--:|--:|--:|---|
| jungle-deathfang-rapier | Deathfang Rapier | weapon | 13 | green 264 | alacrity 4 | 396 | 792 | 1584 | 1584 | 1584 | — |
| jungle-vest-t4 | Primal Canopy | armor | 14 | green 220/yellow 55 | alacrity 4 | 200/100 | 450/150 | 600/300 | 600/300 | 600/300 | — |
| jungle-charm-t4 | Ancient Canopy | recovery | 15 | green 200 | alacrity 4 | 150 | 300 | 450 | 450 | 450 | — |
| jungle-charm-t4-overgrowth | Overgrowth Pulse | recovery | 15 | green 200 | alacrity 4 | 150 | 300 | 450 | 450 | 450 | — |
| jungle-boots-t4 | Warpath Treads | mobility | 16 | green 198 | alacrity 4 | 55 | 110 | 220 | 220 | 220 | — |

### Desert (`desert.recipes.ts:163-240`)

| id | name | slot | gate | base cost | cat | +1 | +2 | +3 | +4 | +5 | evolvesFrom |
|---|---|---|--:|---|---|--:|--:|--:|--:|--:|---|
| desert-zenith-cross | Zenith Falchion | weapon | 13 | yellow 255 | none | 383 | 765 | 1530 | 1530 | 1530 | — |
| desert-vest-t4 | Deathless Duneplate | armor | 14 | yellow 220/purple 55 | none | 200/100 | 400/200 | 900/300 | 900/300 | 900/300 | — |
| desert-charm-t4 | Last Oasis | recovery | 15 | yellow 200/purple 50 | none | 100/40 | 280/70 | 480/120 | 480/120 | 480/120 | — |
| desert-boots-t4 | Simoom Striders | mobility | 16 | yellow 198 | none | 88 | 176 | 304 | 304 | 304 | — |

Desert's T4 items are the one anomaly in the base-craft catalyst pattern **within the
group that otherwise charges catalysts**: none of the four Desert T4 items carry a
`catalystCost` at all (verified by re-reading `desert.recipes.ts:163-240` in full — no
`catalystCost` key appears anywhere in the T4 block, unlike Mountain/Jungle/Tundra).

### Tundra (`tundra.recipes.ts:111-228`)

| id | name | slot | gate | base cost | cat | +1 | +2 | +3 | +4 | +5 | evolvesFrom |
|---|---|---|--:|---|---|--:|--:|--:|--:|--:|---|
| tundra-glacial-tyrant-maul | Glacial Tyrant Maul | weapon | 7 | blue 273 | heavy 4 | 410 | 819 | 1638 | 1638 | 1638 | — |
| tundra-glacial-rimebrand | Glacial Rimebrand | weapon | 7 | blue 258 | fortified 4 | 387 | 774 | 1548 | 1548 | 1548 | — |
| tundra-vest-t4 | Permafrost Sovereign | armor | 8 | blue 256/red 64 | heavy 4 | 290/96 | 572/192 | 858/290 | 858/290 | 858/290 | — |
| tundra-charm-t4 | Glacial Ward | recovery | 9 | blue 220/purple 30 | heavy 4 | 110/30 | 220/60 | 340/90 | 340/90 | 340/90 | — |
| tundra-charm-t4-deepfreeze | Deepfreeze Ward | recovery | 9 | blue 220/purple 30 | heavy 4 | 110/30 | 220/60 | 340/90 | 340/90 | 340/90 | — |
| tundra-boots-t4 | Avalanche Striders | mobility | 10 | blue 176 | heavy 4 | 66 | 132 | 220 | 220 | 220 | — |

### Volcanic (`volcanic.recipes.ts:104-216`)

| id | name | slot | gate | base cost | cat | +1 | +2 | +3 | +4 | +5 | evolvesFrom |
|---|---|---|--:|---|---|--:|--:|--:|--:|--:|---|
| volcanic-eruption-lash | Eruption Lash | weapon | 7 | red 308 | **none** | 462 | 924 | 1848 | 1848 | 1848 | — |
| volcanic-blightbrand (Cinderbrand) | Cinderbrand | weapon | 7 | red 290 | **none** | 435 | 870 | 1740 | 1740 | 1740 | — |
| volcanic-vest-t4 | Pyroclasm Mantle | armor | 8 | red 220/yellow 55 | **none** | 200/100 | 400/200 | 800/300 | 800/300 | 800/300 | — |
| volcanic-vest-t4-lavatempered | Lava-Tempered Hide | armor | 8 | red 220/yellow 55 | **none** | 200/100 | 400/200 | 800/300 | 800/300 | 800/300 | — |
| volcanic-charm-t4 | Inferno Heart | recovery | 9 | red 200/yellow 50 | **none** | 110/30 | 220/60 | 340/90 | 340/90 | 340/90 | — |
| volcanic-boots-t4 | Pyroclast Treads | mobility | 10 | red 163 | **none** | 66 | 136 | 229 | 229 | 229 | — |

### Graveyard (`graveyard.recipes.ts:1-136`, all 5 slots authored despite the file's own
header claiming only boots are — see §6)

| id | name | slot | gate | base cost | cat | +1 | +2 | +3 | +4 | +5 | evolvesFrom |
|---|---|---|--:|---|---|--:|--:|--:|--:|--:|---|
| graveyard-plague-axe | Plague Axe | weapon | 1 | purple 270 | **none** | 405 | 810 | 1620 | 1620 | 1620 | — |
| graveyard-vest-t4 | Plaguebound Mantle | armor | 2 | purple 220 | **none** | 200 | 400 | 700 | 700 | 700 | — |
| graveyard-vest-t4-debtward | Grave Ward | armor | 2 | purple 220 | **none** | 200 | 400 | 700 | 700 | 700 | — |
| graveyard-charm-t4 | Necrotic Pulse | recovery | 3 | purple 150 | **none** | 100 | 200 | 330 | 330 | 330 | — |
| graveyard-charm-t4-gravetide | Grave-Tide Pulse | recovery | 3 | purple 150 | **none** | 100 | 200 | 330 | 330 | 330 | — |
| graveyard-boots-t4 | Gravewalker Boots | mobility | 4 | purple 80 | **none** | 40 | 80 | 132 | 132 | 132 | — |

### Trench (`trench.recipes.ts:1-108`, all 4 slots authored despite the file's header —
copy-pasted verbatim from `graveyard.recipes.ts` — claiming only boots are, see §6)

| id | name | slot | gate | base cost | cat | +1 | +2 | +3 | +4 | +5 | evolvesFrom |
|---|---|---|--:|---|---|--:|--:|--:|--:|--:|---|
| trench-abyssal-axe | Abyssal Axe | weapon | 1 | green 270 | **none** | 405 | 810 | 1620 | 1620 | 1620 | — |
| trench-vest-t4 | Deep Sea Carapace | armor | 2 | green 220 | **none** | 200 | 400 | 700 | 700 | 700 | — |
| trench-charm-t4 | Pressure Vessel | recovery | 3 | green 150 | **none** | 100 | 200 | 330 | 330 | 330 | — |
| trench-boots-t4-stalkers | Abyssal Stalkers | mobility | 4 | green 80 | **none** | 40 | 80 | 132 | 132 | 132 | — |
| trench-boots-t4-treaders | Abyssal Treaders | mobility | 4 | green 80 | **none** | 40 | 80 | 132 | 132 | 132 | — |

**Total: 39 ordinary T4 gear items** across 7 biomes (Mountain 7, Jungle 5, Desert 4,
Tundra 6, Volcanic 6, Graveyard 6, Trench 5 = 39). **CORRECTED:** the original draft
claimed 41; that number does not even match its own per-biome table rows above, which
sum to 39. Recounted directly from `RECIPE_DATABASE` by filtering `tier === 4 && slot !==
'relic' && slot !== 'core'` — the live count is 39, confirmed by two independent methods
(summing the §4 table rows, and a live import/filter script). By slot: **10 weapons, 10
armor, 11 recovery, 8 mobility** (also live-counted; see the §9 correction — the original
draft separately mis-stated "12 weapons" there). **Zero carry `evolvesFrom`,
`reconstructCost`, or `reconstructCatalystCost`.** Every item's +3/+4/+5 upgrade costs are
byte-for-byte identical within that item (a true flat plateau, not merely "close").

---

## 5. T3→T4 lineage/evolution map

**There is no T3→T4 evolution map to build — the field does not exist on any T4 recipe.**
This was checked exhaustively across all 39 T4 gear rows in §4 (**CORRECTED** from the
original draft's "41"): none carries `evolvesFrom`.
Compare directly against the recipe schema (`shared/src/data/recipes/types.ts:93`,
`evolvesFrom?: string`), which is optional and structurally identical to the field 22 T3
items use.

This is a stronger claim than "the lineages are undocumented" — it means the T3→T4 seam
has **no mechanical evolution path at all**: a player cannot spend a +5 T3 item to reduce
the cost of its T4 successor, and no reconstruction path exists either (no
`reconstructCost` on any T4 item). Every T4 item is a from-scratch craft regardless of
what the player already owns at +5 in T3.

Despite this, the *mechanical* continuity is obvious and commented in the source (the
comments below are the authors' own family-tag annotations, not this audit's inference):

| T3 item (+5) | Mechanical identity | T4 "heir" (comment evidence) | evolvesFrom set? |
|---|---|---|---|
| `quake-hammer` → `mountain-avalanche-maul` | `weapon.empowered-mult-bonus` | `mountain-warmaul` (comment: "family-tag: capstone hammer → Heavy") | **No** |
| `mountain-avalanche-maul` | slow heavy maul | `mountain-earthsunder-maul` (comment: "family-tag: capstone heavy maul → Heavy") | **No** |
| `mountain-vest-t3` (Summit Aegis) | `guard.potency-pct` + max-hit cap | `mountain-vest-t4` (Titan's Keep, identical mechanic keys plus a rider) | **No** |
| `mountain-charm-t3` (Bastion Heart) | `defense.barrier-pct` | `mountain-charm-t4` (Fortress Heart, same key) | **No** |
| `mountain-boots-t3` (Peak Stride) | `mobility.approach-speed-pct` | `mountain-boots-t4` (Vanguard Stride, same key) | **No** |
| `jungle-venomthorn-rapier` | on-hit rapier, `onHitDamage` | `jungle-deathfang-rapier` (comment: "family-tag: capstone fast on-hit rapier → Alacrity") | **No** |
| `jungle-vest-t3` (Wildgrowth Weave) | evasion armor | `jungle-vest-t4` (Primal Canopy, same `evasion` stat + new `defense.evade-mitigation` key) | **No** |
| `jungle-charm-t3` (Worldvine Heart) | ramping Recovery | `jungle-charm-t4` (Ancient Canopy, identical mechanic keys) | **No** |
| `desert-solar-cross` | `weapon.first-strike-mult` | `desert-zenith-cross` (comment: "first-strike-mult progressed T2 2.0 → T3 2.5 → T4 3.0") | **No** |
| `desert-vest-t3` (Eternal Duneplate) | cheat-death/cleanse | `desert-vest-t4` (Deathless Duneplate, same keys + a rider) | **No** |
| `tundra-permafrost-maul` | brittle-stack weapon | `tundra-glacial-tyrant-maul` (comment: "family-tag: capstone heavy maul → Heavy") | **No** |
| `tundra-rimebrand` | frost `weaponDot` | `tundra-glacial-rimebrand` (identical `weaponDot` shape, convPct 0.70) | **No** |
| `volcanic-cinderlash` | `weapon.flurry-pct` | `volcanic-eruption-lash` (identical mechanic keys) | **No** |
| `volcanic-vest-t3` (Emberforge Plate, itself a **T2 Plains cross-biome evolution**) | hardening | `volcanic-vest-t4` (Pyroclasm Mantle, identical hardening keys + rider) | **No — the cross-biome chain stops dead at T3** |
| `volcanic-charm-t3` (Magmaheart Stone, also a Plains cross-biome evolution) | on-kill + active Recovery | `volcanic-charm-t4` (Inferno Heart, identical mechanic keys) | **No — same chain-stop** |

**Explicit finding for the task's designer questions**: the Volcanic cross-biome lineage
that T3 introduced (`plains-vest-t2 → volcanic-vest-t3`, `plains-charm-t2 →
volcanic-charm-t3`) is **not continued into T4**. The mechanism T3 built specifically to
solve "a retiring biome's identity needs a home" was not reused at the very next seam
where the same problem recurs (Volcanic itself does not retire, but the *lineage
infrastructure* simply stops being used past T3 for every biome, continuing or not).

**No many-to-one evolution risk exists** because no T4 item uses `evolvesFrom` at all —
the schema constraint (single string, no `evolvesFromAny`) is trivially satisfied by
omission, not exercised.

---

## 6. Dead-end and biome-handoff analysis

**T3 items with no T4 lineage, full stop:** every one of the 29 T3 items in Mountain,
Jungle, Desert, Tundra, and Volcanic — because no T4 item anywhere points back at a T3
predecessor. This is categorically different from the T2→T3 dead-ends documented in the
T3 ledger (§6 of that document), which were **specific, individually justified** dead
ends (Knight's Steelsword → Arcanist Core, Gale Boots → nothing, etc.). At T3→T4 there is
no distinction between "justified dead end" and "everything" — the entire tier boundary
behaves as if every T3 item were a dead end, including the ones with an unambiguous,
commented mechanical heir one tier up.

**Cave/Swamp handoff into T4 biomes**: **no**, not through the `evolvesFrom`/lineage
schema mechanism — confirmed, no T4 recipe carries the field. **CORRECTED — this pass
went further and actually compared mechanic KEYS (not just the field), which the
original draft explicitly declined to do** (it called the handoff comments "asserted
only in prose," full stop). Re-reading `cave.recipes.ts` and `swamp.recipes.ts`
mechanic keys against Graveyard's/Trench's T4 items line-by-line finds the comments are
**partially substantiated by real mechanic-key matches**, not merely flavor-copied
attack stats as the original draft implied:

| Graveyard/Trench T4 item | Comment claims | Mechanic-key check (this pass) | Verdict |
|---|---|---|---|
| `graveyard-plague-axe` (weapon) | "INHERITED (Cave debuff-branch axe)" | `weapon.dead-swing-interval: 3` — **identical key** to Cave's whole weapon line (`chaotic-axe`→`cave-cataclysm-axe`, dead-swing-interval 3→4→5) | **Genuine mechanical continuation of Cave's axe identity** (category 3), plus a new T4-only vuln-on-dead-swing rider |
| `trench-abyssal-axe` (weapon) | "INHERITED (Cave sustained-DPS axe branch)" | `weapon.dead-swing-interval: 4` — same key family as Cave's axe line | **Genuine continuation** (category 3), plus a new execute-threshold rider |
| `graveyard-vest-t4`/`-debtward` (armor) | no inheritance comment given, purple/necrotic-themed | `defense.dot-resistance: 0.35/0.40` — matches **Swamp's** armor key (`defense.dot-resistance`), not Cave's (Cave armor is a plain `damageReduction` stat with no named key) | **Genuine cross-biome match, but to Swamp, not Cave** — the biome's own weapon and armor inherit from two *different* retired biomes |
| `graveyard-charm-t4`/`-gravetide` (recovery) | no comment | `defense.recovery-pulse-pct` + `-interval-ms` — matches **Swamp's** charm mechanic exactly (Swamp invented the periodic-Recovery-pulse charm) | **Genuine continuation of Swamp's charm line** (category 3) |
| `graveyard-boots-t4` | no inheritance comment | `mobility.kill-stack-speed-pct`/`-tenacity-pct` — no match in Cave (`mobility.stealth-pct`) or Swamp (`mobility.slow-resistance`) | **Genuinely new T4 mechanic** (category 4) |
| `trench-vest-t4` (armor) | "Premium-DR tank profile (Cave inheritor)" | Flat `damageReduction: 0.22` stat matches Cave's plain-%DR armor identity; but `defense.sustained-fight-dr-bonus` is a key that does not exist anywhere in Cave | **Mixed**: base identity (flat %DR) genuinely continues Cave; the value-add mechanic is new, not inherited |
| `trench-charm-t4` | no comment | `defense.absorb-pct` matches **Cave's** charm key exactly, *and* `defense.recovery-pulse-pct` matches **Swamp's** charm key — one item blends both retired biomes' charm identities | **Genuine hybrid continuation of both Cave and Swamp** (category 3, doubled) |
| `trench-boots-t4-stalkers` | none, but named "Stalkers" | `mobility.stealth-pct: 0.72` continues Cave's exact boots progression (0.25→0.38→0.50→0.72) | **Direct, verified continuation of Cave's boots line** (category 3, cleanest case found) |
| `trench-boots-t4-treaders` | "distinct from Graveyard's kill-stack tenacity" (self-aware) | `mobility.tenacity-pct` — no match in Cave or Swamp | **Genuinely new T4 mechanic** (category 4), and the comment already says so |

**Net correction to the finding**: the original draft's blanket conclusion — "asserted
only in prose... carries no linkage to check it against" — is **too skeptical**. Six of
the nine Graveyard/Trench slots above *do* carry a checkable, matching mechanic key to a
specific retired biome (Cave for both weapons, Trench's stealth boots, and half of
Trench's charm; Swamp for Graveyard's armor and charm and the other half of Trench's
charm), which is exactly the "plausible cross-biome handoff, mechanically verified"
category the task brief asked this pass to distinguish from category-4 new content. The
three genuinely-new cases (Graveyard boots, Trench treader boots, and the *value-add*
half of Trench's armor) are real category-4 content, not handoffs. What remains true
from the original finding: **none of this is backed by the `evolvesFrom`/`lineageId`
schema** — it is a prose-and-mechanic-key correspondence only, invisible to any tooling
that checks the lineage field, and Graveyard's own weapon/armor/charm trio inherits from
**two different** biomes (Cave for the weapon, Swamp for armor and charm) with no
in-repo note calling out that split.

The two comments quoted below remain accurate on the specific point they were being
cited for (whether Rimebrand itself had a T2 predecessor, and whether Cave/Swamp have
live T4 recipes):
- `tundra.recipes.ts:6-10` states "Tundra owns the FROST DoT weapon line: Rimebrand (T3)
  → Glacial Rimebrand (T4)" and separately clarifies (correctly, per the T3 ledger) that
  Rimebrand itself has **no** T2 Swamp predecessor — it is a genuinely new T3 item. The
  T4 item's own comment block (`tundra.recipes.ts:136-137`) then contradicts this by
  re-labelling it "⚠ INHERITED (Swamp slow-DoT lineage) — base attack carried from doc,
  not scaled from a T3 ancestor" — an internally inconsistent comment that resurrects
  the exact "relocated from Swamp" framing the T3 pass explicitly corrected for Rimebrand
  itself. This is a **documentation defect** (§20), not evidence of an actual Swamp→Tundra
  item chain — no `evolvesFrom` field exists on `tundra-glacial-rimebrand` and Swamp has
  no T4 recipes to evolve from in any case.
- `graveyard.recipes.ts:14` and `trench.recipes.ts:14` both tag their weapon
  (`graveyard-plague-axe`, `trench-abyssal-axe`) "⚠ INHERITED (Cave … axe branch) — base
  attack carried from doc." Cave retires at T3 and has no T4 recipes, so this is, at most,
  a **numbers/flavor** inheritance (the base `attack` stat was copied from a design doc
  describing Cave's axe identity), not an item-lineage handoff — again no `evolvesFrom`.

**Net finding (CORRECTED)**: Cave and Swamp's *mechanics* were re-flavored into
Graveyard/Trench (dead-swing axes, DoT-resistance/absorb/recovery-pulse armor and
charms, stealth boots) in the same "design slot moved, item chain did not" sense the T3
ledger used for Forest→Jungle — and, unlike the original draft's conclusion, this is now
**verified by matching mechanic keys**, not merely asserted in prose, for six of the
nine Graveyard/Trench slots (table above). It is still inconsistently worded between
files (one comment says "verify in budget pass," implying the *attack numbers* — not the
mechanic identity — aren't confirmed internally) and still carries no `lineageId` or
`evolvesFrom` linkage a tool could check automatically.

**Stale/copy-pasted file headers (data hygiene defect, not a lineage question):**
`trench.recipes.ts:1-8`'s header comment is **verbatim identical** to
`graveyard.recipes.ts:1-8`, including the literal string "Graveyard (T4)" and "renamed
from necropolis" inside the Trench file, and both headers claim "Only the mobility (boot)
line is authored so far... Armor / weapon / charm / new-mechanic mobs remain DEFERRED" —
false for both files, each of which fully authors weapon, armor (×2 branches for
Graveyard), charm (×2 branches for Graveyard), and boots (§4). This is a live
documentation defect that will mislead the next author into thinking these biomes are
half-built when they are not (mechanically) — see §20.

---

## 7. Upgrade-curve analysis

**Every single T4 item fails the T1–T3 grammar identically and completely.** The T1–T3
passes each replaced a flat `+3=+4=+5` plateau with an accelerating 4/10/16/26/44%
post-base-spend curve, landing 65–75% of post-base spend in +4/+5 combined
(T3 ledger §7). T4's shape, read directly from every row in §4, is:

`+1 = 1.5× base-ish, +2 = 2×(+1), +3 = 2×(+2), +4 = +3 (verbatim), +5 = +4 (verbatim)`

Concretely (Earthsunder Maul): base 256 → +1 384 → +2 768 → +3 1290 → +4 **1290** → +5
**1290**. The +3/+4/+5 identity holds to the unit across **all 39 items** (**CORRECTED**
from "41") without a single exception — this is not curve-shape drift, it is one repeated arithmetic template
(`base×1.5, ×2, ×2.5×2(≈2.1), then hold`) copy-pasted per item with only the base cost and
essence colors varying. This is the single flattest, most mechanical violation of the
shipped grammar found anywhere in the codebase — flatter than the pre-fix T1–T3 plateau,
because those at least varied +1/+2/+3 organically per item; T4's ratio between
consecutive steps is close to constant (≈1.5×, 2×, then a jump to ~1.68–2× before
flatlining) across every single recipe, strongly suggesting the whole tier was generated
from one formula rather than hand-authored per item the way T1–T3 were.

No T4 item follows the shipped curve. No T4 item is exempt for a stated design reason
(unlike, say, the T3 pure-hybrid exemptions in §9 below, which are principled). This is
uniformly a **legacy residue**, not a mix of good and bad items.

---

## 8. T3→T4 gear scaling

Because no T4 item carries `evolvesFrom`, the T3 methodology (T4 total ÷ finalized T3
predecessor total, expecting ~2.0×) can only be computed as an **implied** ratio against
the item this audit judges to be the mechanical heir (§5/§6), not an authored one.

**CORRECTED — this pass recomputed every lifetime total directly from the live recipe
objects** (base + Σ upgrades, per color, then summed across colors) via a `tsx` script
that imports `RECIPE_DATABASE`, rather than hand-adding numbers off the table in §4. Of
the 11 pairs in the original draft's table, **7 T4 totals/ratios were wrong**: Titan's
Keep, Fortress Heart, Primal Canopy, Zenith Falchion, Glacial Tyrant Maul, Glacial
Rimebrand, and Eruption Lash. Earthsunder Maul, Warmaul, Vanguard Stride, and Deathfang
Rapier were already correct. The table below also extends coverage to **every T4 item
with a plausible T3 predecessor** (17 pairs total, vs. the original 11), using each T3
predecessor's *finalized* live total (re-verified against `RECIPE_DATABASE`, matching
the T3 ledger's own figures in every case checked):

| T3 predecessor (live total) | T4 heir (live total) | Ratio | vs. original draft |
|---|--:|--:|---|
| Avalanche Maul 2,444 | Earthsunder Maul **5,278** | **2.16×** | unchanged, was correct |
| Avalanche Maul 2,444 | Warmaul **4,920** | **2.01×** | unchanged, was correct |
| Summit Aegis 2,228 | Titan's Keep **4,914** (blue 3,692 + red 1,222) | **2.21×** | **CORRECTED** — draft said 4,750 / 2.13× |
| Summit Aegis 2,228 | Stormwall Plate **4,914** (blue 3,692 + red 1,222) | **2.21×** | not in original table (branch of Titan's Keep, same cost) |
| Bastion Heart 936 | Fortress Heart **1,960** (blue 1,570 + red 390) | **2.09×** | **CORRECTED** — draft said 2,220 / 2.37× |
| Bastion Heart 936 | Shieldmend Ward **1,960** (blue 1,570 + red 390) | **2.09×** | not in original table (branch of Fortress Heart, same cost) |
| Peak Stride 658 | Vanguard Stride **851** | **1.29×** | unchanged, was correct |
| Venomthorn Rapier 2,090 | Deathfang Rapier **6,204** | **2.97×** | unchanged, was correct |
| Wildgrowth Weave 2,070 | Primal Canopy **3,875** (green 2,670 + yellow 1,205) | **1.87×** | **CORRECTED** — draft said 4,975 / 2.40× (a >1,100 essence overcount) |
| Worldvine Heart 1,008 | Ancient Canopy / Overgrowth Pulse **2,000** | **1.98×** | not in original table |
| Canopy Striders 660 | Warpath Treads **1,023** | **1.55×** | not in original table |
| Solar Falchion 2,540 | Zenith Falchion **5,993** | **2.36×** | **CORRECTED** — draft said 6,043 / 2.38× (small arithmetic slip) |
| Eternal Duneplate 2,520 | Deathless Duneplate **4,775** (yellow 3,520 + purple 1,255) | **1.90×** | not in original table |
| Oasis Heart 1,310 | Last Oasis **2,540** (yellow 2,020 + purple 520) | **1.94×** | not in original table |
| Mirage Striders 864 | Simoom Striders **1,374** | **1.59×** | not in original table |
| Permafrost Maul 2,450 | Glacial Tyrant Maul **6,416** | **2.62×** | **CORRECTED** — draft said 5,954 / 2.43× |
| Rimebrand 2,444 | Glacial Rimebrand **6,063** | **2.48×** | **CORRECTED** — draft said 5,715 / 2.34× |
| Glacial Bulwark 2,200 | Permafrost Sovereign **4,914** (blue 3,692 + red 1,222) | **2.23×** | not in original table |
| Frostward Charm 1,050 | Glacial Ward / Deepfreeze Ward **1,960** | **1.87×** | not in original table |
| Glacier Striders 670 | Avalanche Striders **1,034** | **1.54×** | not in original table |
| Cinderlash 2,540 | Eruption Lash **7,238** | **2.85×** | **CORRECTED** — draft said 6,930 / 2.73× |
| Cinderlash 2,540 | Cinderbrand (`volcanic-blightbrand`) **6,815** | **2.68×** | not in original table (branch of the same weapon slot) |
| Emberforge Plate 2,112 | Pyroclasm Mantle / Lava-Tempered Hide **4,475** (red 3,220 + yellow 1,255) | **2.12×** | not in original table |
| Magmaheart Stone 1,100 | Inferno Heart **1,960** (red 1,550 + yellow 410) | **1.78×** | not in original table |
| Magma Walkers 680 | Pyroclast Treads **1,052** | **1.55×** | not in original table |

**Finding (CORRECTED range, same bounds as the original draft's headline claim but a
very different middle)**: T4 scaling ranges from **1.29× (Vanguard Stride, Mountain
boots) to 2.97× (Deathfang Rapier, Jungle weapon)** — the two extremes the original draft
named were, in fact, correctly computed; it was the *middle* of its table that was wrong.
With the full 24-pair set, the shape is **not** "most items land 2.1–2.7×" as the
original draft claimed — it is closer to bimodal: **weapons cluster high (2.0×–2.97×)**
and **armor/recovery/mobility cluster lower (1.3×–2.2×)**, with only Mountain's and
Tundra's armor pairs (2.21×–2.23×) bridging the two clusters. This is still the same
class of per-item inconsistency the T3 pass explicitly corrected for T2→T3 (T3 ledger
§7.4, "Peak Stride was badly under, Cinderlash stood 24% above with no stated reason") —
the corrected numbers do not change that conclusion, only its supporting detail. Even if
`evolvesFrom` links were added, the underlying costs would still need the same kind of
per-item scaling correction T3 performed. Graveyard/Trench have **no genuine in-tier T3
predecessor at all** (Cave/Swamp retire before T4), so no ratio is computed for them here
— see §6 for the comment-only "inherited" claims, which name a mechanic lineage, not a
cost lineage, and §22 for the one placeholder cross-tier ratio (Cave's Cataclysm Axe
2,328 → Graveyard's Plague Axe / Trench's Abyssal Axe 6,345 each, **2.73×**) offered only
as a curiosity since Cave's axe was never actually spent to craft either T4 axe.

---

## 9. Hybrid essence economy

The home/splash rule ("home essence follows the biome, splash follows the borrowed
mechanic, splash ≤33%, weapons/boots pure") is checked against all 39 T4 items
(**CORRECTED** from "41"):

- **Weapons and mobility are pure in every T4 item** (**CORRECTED: 10 weapons**, not
  "12" as the original draft stated — Mountain 2, Jungle 1, Desert 1, Tundra 2, Volcanic
  2, Graveyard 1, Trench 1 = 10; **8 mobility rows** was already correct) — the rule
  holds cleanly at T4, same as T1–T3.
- **Hybrids appear only on armor/recovery**, matching the rule's scope. Base-craft
  splits: Titan's Keep 256/64 (**80.0/20.0**), Pyroclasm Mantle 220/55 (**80.0/20.0**),
  Primal Canopy 220/55 (**80.0/20.0**), Permafrost Sovereign 256/64 (**80.0/20.0**),
  Deathless Duneplate 220/55 (**80.0/20.0**), Fortress Heart 220/30 (**88.0/12.0**),
  Glacial Ward 220/30 (**88.0/12.0**), Inferno Heart 200/50 (**80.0/20.0**), Oasis-family
  Last Oasis 200/50 (**80.0/20.0**).
- **Lifetime drift reappears at T4** because the +4/+5 plateau (§7) repeats the same
  ratio three times rather than shifting it — e.g. Titan's Keep's +1 splits 290/96
  (**75.1/24.9**) and stays at that ratio through +5 rather than narrowing toward 80/20 the
  way the T3 fix made every hybrid do. So the *specific* defect the T3 pass fixed
  (splash drifting upward across the curve because the plateau repeats a splash-heavy
  ratio) is **reintroduced at T4** by the same plateau curve documented in §7 — this is
  the same root cause (the flat +3/+4/+5 curve), not a second independent defect.
- **No T4 item is pure-despite-hybrid-eligible in an unexplained way**: all 10 T4
  weapons and all 8 T4 mobility items (**CORRECTED** — not "the four," a miscount in the
  original draft) are mechanically single-color by identity (empowered-hammer,
  brittle/frost-DoT, on-hit rapier, first-strike, flurry, dead-swing, execute, stealth,
  tenacity, kill-stack speed — none of these borrow a second biome's mechanic),
  consistent with the pure-weapons/boots rule rather than an oversight.

---

## 10. Catalyst economy

**T4 catalyst timing is base-craft-only, and inconsistently applied across biomes.**
Read from every recipe in §4:

| Biome | Base-craft catalyst | +1..+5 catalyst |
|---|---|---|
| Mountain | 4 (heavy) on every item | **0 on every upgrade step, every item** |
| Jungle | 4 (alacrity) on every item | 0 |
| Desert | **0 on every item** (base or upgrade) | 0 |
| Tundra | 4 (heavy or fortified, by mechanic) | 0 |
| Volcanic | **0 on every item** | 0 |
| Graveyard | **0 on every item** | 0 |
| Trench | **0 on every item** | 0 |

This is the exact "Volcanic hole" the T3 pass explicitly closed for T3 gear
(T3 ledger §8: "closing the hole where Volcanic's four items charged zero catalysts
anywhere with no explanatory comment") — **reopened at T4**, and now spread to four of
seven biomes (Desert, Volcanic, Graveyard, Trench) rather than one. Only Mountain,
Jungle, and Tundra charge the flat 4-per-item T4 catalyst.

**Timing reverts to base-craft gating** (the pre-T2 pattern the T2/T3 passes deliberately
inverted to optimization-first): every catalyst a T4 item will ever need is charged on
day one of entering the biome, and zero is charged on any of the five upgrade steps —
the polar opposite of T3's 0/0/0/2/3 (weapon/armor) and 0/0/0/0/2 (recovery/mobility)
schedule. This directly answers the task's Q7: **yes, and more strongly than a simple
"reversion" — T4 gear charges catalysts at the door and never again, whereas even the
pre-T3-fix schedule charged something (3) at the base craft only, not on top of an
upgrade-free track this flat.**

**Relics** (§14) are the one T4 system that keeps the same shape as gear: 4 catalysts
each, paid once, at craft (no upgrades exist for relics to charge catalysts on).

**Recuperating Stance's catalyst 7** (`shared/src/stanceRecipes.ts:53`,
`catalystCost: { alacrity: 7 }`) is confirmed live, unchanged since before the T1–T3
passes began. It is compared in §13.

**Node-modifier catalyst production at T4 — CORRECTED, now fully extracted** (the
original draft deferred this as an open item; this pass read `nodeModifiers.ts`,
`nodeModifierTypes.ts`, and the live T4 node list in full).

**T4 node count per catalyst family**, live-counted from `WORLD_NODE_LIST` filtered to
`biomeTier === 4 && kind === 'normal'` (38 normal T4 nodes total; each biome also has
exactly 1 T4 dungeon node, not counted below since dungeon nodes carry no modifier in
this dataset):

| Biome | native family | total normal T4 nodes | alacrity | heavy | swarming | dominion | fortified |
|---|---|--:|--:|--:|--:|--:|--:|
| Mountain | heavy | 5 | 0 | **2** | 1 | 1 | 1 |
| Tundra | heavy | 5 | 0 | **2** | 1 | 1 | 1 |
| Jungle | alacrity | 5 | **2** | 0 | 1 | 1 | 1 |
| Desert | dominion | 5 | 0 | 1 | 1 | **2** | 1 |
| Volcanic | swarming | 6 | 1 | 1 | **2** | 1 | 1 |
| Graveyard | swarming | 6 | 1 | 1 | **2** | 1 | 1 |
| Trench | dominion | 6 | 1 | 1 | 1 | **2** | 1 |

Each biome's native family (per `NATIVE_MODIFIER` in `nodeModifierTypes.ts`) holds
exactly one extra node over the other four; `MODIFIER_BANS` excludes `alacrity` from
Mountain/Desert/Tundra and `heavy` from Jungle (Volcanic/Graveyard/Trench/Cave/Swamp/
Plains carry no bans), consistent with which families actually appear above. This
confirms the recipe catalyst families seen in §4/§10 track each biome's native modifier
(Mountain/Tundra `heavy`, Jungle `alacrity`) even though three of the seven biomes'
*gear* recipes (Desert, Volcanic, Graveyard/Trench) charge no catalyst despite having a
perfectly good native family available on their own nodes — reinforcing §22's "source/
data defect," not a supply-side gap.

**Catalyst progress per kill and kills-per-catalyst, T4**: `CATALYST_PROGRESS_PER_UNIT =
100` (`gameConfig.ts:158`); a kill's catalyst weight is
`round((monster.rewards.catalystWeight ?? monster.rewards.essence) * modifierRewardMult
* debugMult)` (`server/src/systems/player/progression/rewards.ts:210-211`), granted only
when the node carries a modifier. **No T4 monster in any of the seven biomes sets an
explicit `catalystWeight`** (grepped `shared/src/data/monsters/*.ts` — zero hits), so the
fallback (raw, pre-tier-multiplier `essence`) applies universally. `modifierRewardMult`
at T4 (`MODIFIER_MAGNITUDE_BY_TIER[4] = 0.2`, `nodeModifiers.ts:97`) is `1 +
MODIFIER_REWARD_FACTOR[family] × 0.2`: alacrity → **1.20**, heavy → **1.16**, swarming →
**1.04**, dominion → **1.40**, fortified → **1.25** (`MODIFIER_REWARD_FACTOR`,
`nodeModifiers.ts:157-162`). Applying each biome's native-family multiplier to its live
T4 monster essence range (§16):

| Biome (native mult) | raw essence range | catalyst weight/kill | kills per catalyst (100/weight) |
|---|---|---|---|
| Mountain (heavy ×1.16) | 68–185 | 79–215 | 0.47–1.27 |
| Jungle (alacrity ×1.20) | 45–130 | 54–156 | 0.64–1.85 |
| Desert (dominion ×1.40) | 55–170 | 77–238 | 0.42–1.30 |
| Tundra (heavy ×1.16) | 62–260 | 72–302 | 0.33–1.39 |
| Volcanic (swarming ×1.04) | 47–190 | 49–198 | 0.51–2.04 |
| Graveyard (swarming ×1.04) | 22–70 | 23–73 | 1.37–4.35 |
| Trench (dominion ×1.40) | 210–400 | 294–560 | 0.18–0.34 |

T4 catalyst accumulation on a native-modifier node is fast in absolute terms — well
under one kill per catalyst for most elites, and Trench's three (all-elite) T4 monsters
each grant 2–6 catalysts in a single kill. Graveyard's weaker trash tier (essence
22–70) is the one pocket where catalyst gain is slower than a kill a piece (up to ~4.4
kills/catalyst). This is raw extracted throughput, not a rewards-per-hour estimate — no
kill-rate/TTK assumption is applied, per the task's static-data-only scope.

---

## 11. Techniques / Guards (T4 abilities)

Full extraction, `shared/src/abilityRecipes.ts:236-278`:

| id | name | kind | biome/gate | essence | catalyst | role |
|---|---|---|---|--:|---|---|
| ability-recipe-disengage | Disengage | Technique/Guard (escape) | trench L3 | green 1300 | none | break contact, buy room |
| ability-recipe-recuperate | Recuperate | Guard (sustain) | trench L5 | green 1500 | none | long steady mend |
| ability-recipe-snipe | Snipe | Technique (range) | graveyard L3 | purple 1300 | none | extended-range shot |
| ability-recipe-stunning-strike | Stunning Strike | Technique (hard CC) | graveyard L5 | purple 1500 | none | committed stun |

**The T3→T4 ability cliff, quantified**: T3's most expensive ability (Quick Strike) is
210 essence (`abilityRecipes.ts:233`). T4's cheapest ability is 1,300 (Disengage/Snipe).
**1300 / 210 = 6.19×.** The file's own comment block (`abilityRecipes.ts:42-49`)
independently confirms this is recognized, unfixed legacy: *"⚠ T4 (1300/1500) has NOT yet
been repriced and still sits on the abandoned ladder; the T4 economy pass owns it."* This
is the single most explicit self-documented defect found anywhere in the T4 economy —
the codebase already knows the number is wrong and says so in a comment.

For scale: at T3, the ability-to-gear ratio the design intentionally targeted was
"roughly one gear upgrade step" (per the same T3 comment block). At T4, 1,300–1,500
essence is **larger than several complete T4 item base crafts** (e.g. it exceeds
Graveyard's charm base cost of 150 by ~9×, and is comparable to a T4 weapon's +3/+4/+5
plateau step) — i.e. it is no longer "one upgrade step," it is close to "most of an item."

---

## 12. Runes

`shared/src/runeRecipes.ts` contains **exactly one T4 recipe**:
`rune-recipe-focus-elites` (line 262-276): tier 4, `graveyard` L4, cost `{ purple: 320,
blue: 140 }`, unlocks the `focus-elites` action rune (target-priority: elites first). No
catalyst cost. No gate mismatch found — `requiredBiomeLevel: 4` is within Graveyard's
T4-only band (levels 1-6, cap 6).

This contradicts the task brief's cautionary framing ("T3 shipped zero new Runes... do
not assume T4 must have many") only in that T4 does add **one**, not zero and not many —
a single, coherent addition, correctly gated, at a cost roughly comparable to a mid-tier
T2/T3 rune scaled up. No defect found in this system at T4.

---

## 13. Stances / Rites

**Stances**: `shared/src/stanceRecipes.ts` has 10 entries total; the only tier-4 entry is
`stance-recipe-recuperating` (line 53), which **predates** the T1–T3 economy passes and
was explicitly left untouched by all three (T3 ledger §10: "T4's Recuperating Stance
(alacrity 7) is untouched and pinned by a test"). Confirmed live:
`catalystCost: { alacrity: 7 }`, essence `{ green: 220, blue: 100 }`, gated `jungle` L17
(within Jungle's T4 cap of 18). **No new T4 stance exists.**

**Rites**: `shared/src/riteRecipes.ts` has exactly 6 entries, **all tier 3**. **Zero T4
rites exist.** No gate/schema issue — this is a clean "no new content at this tier" case,
structurally identical to T3's own "zero new runes" choice, just for a different system.

**Recuperating Stance catalyst-7 isolation, quantified**: every other Stance/Rite in the
game (14 other recipes across both files) charges 1, 2, or 3 catalysts
(T2 stances = 1, T3 stances = 2, T3 rites = 2 ordinary / 3 premium). 7 is **more than
double** the highest catalyst cost charged anywhere else in either system, and it is the
**only** T4-tier Stance/Rite recipe that exists to compare it against. Because it is
singular, it cannot be benchmarked against sibling T4 items the way T3's items were
benchmarked against each other — it is an isolated legacy artifact by definition, not
merely by degree.

---

## 14. Relic economy (major T4 system)

All 8 relics found via `Grep "slot: 'relic'"` across `shared/src/data/recipes/*`, read in
full:

| id | name | biome | gate | essence | catalyst | mechanic shape |
|---|---|---|--:|---|---|---|
| relic-hastebound-dial | Hastebound Dial | volcanic | 11 | red 220 | swarming 4 | +freq, −potency |
| relic-verdant-flywheel | Verdant Flywheel | jungle | 18 | green 220 | alacrity 4 | +freq, −potency, +buff-effect |
| relic-glacial-bell | Glacial Bell | tundra | 12 | blue 220 | heavy 4 | −freq, +potency, +buff-effect |
| relic-haunted-prism | Haunted Prism | graveyard | 6 | purple 240 | fortified 4 | −freq, −potency, +buff/+debuff effect |
| relic-colossus-heart | Colossus Heart | mountain | 24 | blue 240 | heavy 4 | −freq, +potency |
| relic-equilibrium-shard | Equilibrium Shard | mountain | 24 | blue 200 | heavy 4 | +freq, +potency (no trade) |
| relic-withering-lens | Withering Lens | desert | 18 | yellow 220 | dominion 4 | −freq, +potency, +debuff-effect |
| relic-virulent-hourglass | Virulent Hourglass | trench | 5 | green 220 | dominion 4 | +freq, −potency, +debuff-effect |

**Structural findings**:
- All 8 are **single-craft**: no `upgrades` array, no rank/tier progression — a relic is
  bought once at full price and does not upgrade further, unlike every other equipment
  slot.
- All 8 carry a `lineageId` equal to their own `id`, `evolvesFrom` absent, `reconstructCost`
  absent — there is **no relic evolution or lineage system**; each is a standalone leaf.
  This directly answers the task's instruction to check whether relic evolution is a
  distinct system: it is not implemented at all (zero relics chain into one another).
- Cost is uniform: essence 200–270 (mostly ~220), catalyst always exactly 4, of a family
  matching the biome's native family (or, for Mountain's two relics, its `heavy` native
  family twice over — Mountain hosts 2 of the 8 relics, more than any other biome, which
  the source comment at `mountain.recipes.ts:498-503` explains: Mountain is the only
  biome spanning T1–T4, so it is the natural home for the game's one "no-trade" relic
  (Equilibrium Shard) after that relic was moved off a retired Plains gate that would
  otherwise have cost ~12,500 kills of outgrown content).
- Two relics (`relic-haunted-prism`, `relic-virulent-hourglass`) were explicitly re-homed
  onto Graveyard/Trench (both new T4-only biomes) specifically **because** their prior
  homes (Swamp, Forest) had retired — comments at `graveyard.recipes.ts:110-113` and
  `trench.recipes.ts:110-113`/(same text, copy-pasted, see §6) state this directly. This
  is the one place in the T4 economy where the retirement-aware re-homing principle T3
  established (moving item/relic gates off retired biomes) is demonstrably **continued**
  correctly into T4 — a positive finding, in contrast to gear's total absence of
  cross-tier lineage (§5).
- Gate spread (levels 5–24) matches each biome's own T4-relevant band; no relic gates
  above its biome's live cap. No unreachable relic found.

**Coherence with other T4 sinks**: a relic's cost (≈220 essence + 4 catalysts, one-time)
is in the same order of magnitude as a T4 gear item's *base craft* (150–308 essence + 0–4
catalysts) but far below a gear item's *lifetime* cost (2,200–6,900+ essence across all
upgrade steps, §8). Relics do not compete meaningfully with gear for essence at the
margin; they compete with gear and each other for the same catalyst families, which is a
real but modest interaction (each relic's 4-catalyst tax is comparable to one T4 gear
item's base-craft tax, where that biome charges one at all — see §10's biome
inconsistency).

---

## 15. Core economy interaction

12 Core recipes exist total (`Grep "slot: 'core'"` across all recipe files), **all tier
3**: Plains (`core-tempered`), Forest (`core-survivalist`), Mountain (`core-juggernaut`,
`core-arcanist`), Cave (`core-force`, `core-duelist`), Jungle (`core-bruiser`,
`core-accelerant`), Desert (`core-sniper`), Tundra (`core-scout`), Volcanic
(`core-catalyst`), Swamp (`core-controller`). **No T4 Core exists.** T3 Cores remain the
final cast, matching the task's framing that Core mechanics are already rebalanced and
out of scope for critique here.

**Economy-only interaction check**: Core catalyst costs (2-4 units, per-core, one-time)
draw from the same five families (heavy/alacrity/swarming/dominion/fortified) that T4
gear (where it charges catalysts at all) and T4 relics also draw from. No contradiction
found — Cores are gated at T3 biome levels that remain reachable under the corrected T4
cap table (§2), so no Core recipe is stranded by the T4 mastery fix.

---

## 16. Resource supply

**CORRECTED / COMPLETED — the original draft explicitly left this section partial** (it
sampled only Mountain and stated non-boss T4 monsters "would need to be identified by
node placement... deferred to a follow-up pass"). This pass did that follow-up: T4 mobs
are not tagged with a tier field on the monster definition itself, but each biome's real
T4 spawn roster is authored explicitly in `shared/src/biomeDatabase.ts`
(`monsterPoolByTier[4]`), which is the actual node-to-monster assignment the game uses
(`biomeDatabase.ts:9-11`: "spawning picks pool[node.biomeTier]"). Cross-referencing that
roster against each biome's `shared/src/data/monsters/*.monsters.ts` file gives an
exhaustive, live-verified T4 non-boss roster for all seven biomes — no sampling.

**T4 boss essence/XP** (`shared/src/data/monsters/bossesT4.ts`, all 7 read in full,
unchanged from the original draft):

| Boss | Biome | HP | essence | essenceType | biomeXp |
|---|---|--:|--:|---|--:|
| Iron-Crest Titan | mountain | 19,499 | 620 | blue | 930 |
| Dune-Throne Sovereign | desert | 17,893 | 595 | yellow | 893 |
| Verdant-Crown Predator | jungle | 18,352 | 605 | green | 908 |
| Glacial Patriarch | tundra | 22,940 | 640 | blue | 960 |
| Caldera Sovereign | volcanic | 20,646 | 625 | red | 938 |
| Charnel-Crown Sovereign | graveyard | 19,499 | 615 | purple | 923 |
| Elder Trench Serpent | trench | 21,793 | 660 | **purple** | 990 |

Reward-per-HP is tightly clustered (0.0290–0.0327 essence/HP, 0.0435–0.0491 XP/HP) across
all 7 — internally consistent boss-to-boss, unlike the T1 baseline's flagged 16× biome
armor-answer spread (this audit does not derive an eHP/DPS comparison, which is outside
the "static data" scope this task specifies).

**Full T4 non-boss monster roster, per biome** (`recipeGroup`/`biome` field, `stats.hp`,
`rewards.essence`/`essenceType`/`biomeXp`, all read from the live monster files; the exact
roster per biome comes from `biomeDatabase.ts`'s `monsterPoolByTier[4]`):

**Mountain** (`mountain.monsters.ts`) — 4 monsters, essence type **blue** (matches gear):

| id | name | HP | essence | biomeXp | elite |
|---|---|--:|--:|--:|---|
| avalanche-tyrant | Avalanche Tyrant | 533 | 68 | 410 | no |
| cliffside-roc | Cliffside Roc | 574 | 75 | 450 | no |
| granite-mammoth | Granite Mammoth | 779 | 95 | 570 | no |
| cragback-rhino | Cragback Rhino | 923 | 185 | 1,110 | **yes** |

**Jungle** (`jungle.monsters.ts`) — 4 monsters, essence type **green** (matches gear):

| id | name | HP | essence | biomeXp | elite |
|---|---|--:|--:|--:|---|
| hunting-panther | Hunting Panther | 704 | 45 | 270 | no |
| thornback-lizard | Thornback Chameleon | 748 | 50 | 300 | no |
| apex-silverback | Apex Silverback | 1,056 | 88 | 528 | **yes** |
| emerald-constrictor | Emerald Constrictor | 1,408 | 130 | 780 | **yes** |

**Desert** (`desert.monsters.ts`) — 3 monsters, essence type **yellow** (matches gear):

| id | name | HP | essence | biomeXp | elite |
|---|---|--:|--:|--:|---|
| sand-viper | Sand Viper | 1,343 | 55 | 330 | no |
| dune-basilisk | Dune Basilisk | 1,501 | 100 | 600 | no |
| dune-tyrant | Dune Tyrant | 1,738 | 170 | 1,020 | **yes** |

**Tundra** (`tundra.monsters.ts`) — 4 monsters, essence type **blue** (matches gear):

| id | name | HP | essence | biomeXp | elite |
|---|---|--:|--:|--:|---|
| hoarfrost-yeti | Hoarfrost Yeti | 693 | 62 | 370 | no |
| rime-tusk-mastodon | Rime-Tusk Mastodon | 924 | 110 | 660 | no |
| glacial-direbear | Glacial Dire-Bear | 1,221 | 150 | 900 | no |
| permafrost-behemoth | Permafrost Behemoth | 1,914 | 260 | 1,560 | **yes** |

**Volcanic** (`volcano.monsters.ts`) — 5 monsters, essence type **red** (matches gear):

| id | name | HP | essence | biomeXp | elite |
|---|---|--:|--:|--:|---|
| ember-skink | Ember Skink | 1,043 | 47 | 280 | no |
| ashspitter-salamander | Ashspitter Salamander | 1,188 | 52 | 310 | no |
| infernal-direhound | Infernal Direhound | 1,386 | 68 | 410 | no |
| obsidian-tortoise | Obsidian Tortoise | 2,244 | 140 | 840 | no |
| magma-salamander | Magma Salamander | 2,904 | 190 | 1,140 | **yes** |

**Graveyard** (`graveyard.monsters.ts`) — 5 monsters, essence type **purple** (matches
gear and boss):

| id | name | HP | essence | biomeXp | elite |
|---|---|--:|--:|--:|---|
| plague-rat | Bone Rat | 1,584 | 22 | 130 | no |
| bone-crawler | Bone Crawler | 2,059 | 30 | 180 | no |
| carrion-vulture | Carrion Vulture | 2,693 | 40 | 240 | no |
| plague-hound | Plague Hound | 3,168 | 50 | 300 | no |
| gravewright | Gravewright | 2,851 | 70 | 420 | **yes** |

**Trench** (`trench.monsters.ts`) — 3 monsters, essence type **BLUE** — this does **not**
match Trench's gear (green) or Trench's boss (purple):

| id | name | HP | essence | biomeXp | elite |
|---|---|--:|--:|--:|---|
| hadal-stalker | Hadal Stalker | 2,800 | 210 | 1,260 | **yes** |
| abyssal-serpent | Abyssal Serpent | 4,200 | 260 | 1,560 | **yes** |
| elder-leviathan | Elder Leviathan | 5,880 | 400 | 2,400 | **yes** |

**New finding, not present in the original draft (this pass's own extraction, not a
correction of a prior claim): Trench's essence-color mismatch.** All three of Trench's
T4 monsters (its entire non-boss population — Trench is also the one biome where every
T4 monster is `elite: true`, an extreme-low-density design choice already noted in
`biomeDatabase.ts`'s own comments) grant `essenceType: 'blue'`, while Trench's 5 ordinary
T4 gear items cost `green` (§4) and Trench's boss (Elder Trench Serpent) grants `purple`
(table above). No other T4 biome has this problem — all six others' monster essence type
matches their own gear's home color exactly. This means a player farming ordinary Trench
mobs accumulates the *wrong* essence color to craft Trench's own gear; only the (rare,
elite-only, low-density) boss kill grants anything in Trench's actual purple gear
currency, and even that doesn't match the blue the trash mobs pay out. Verified directly
against `trench.monsters.ts:48,82,111` (`essenceType: 'blue'` on all three
`rewards` blocks) — not a misread; the field is genuinely blue on every entry.

**Constants used above, extracted live from `shared/src/config/gameConfig.ts`**:
- `BIOME_ESSENCE_TIER_MULT[4] = 0.55` (line 151) — the actual essence a player receives
  from a T4 kill is `round(rewards.essence × 0.55 × modifierRewardMult × debugMult)`,
  i.e. the raw table values above are roughly halved before they reach the player; the
  raw (pre-multiplier) numbers above are what both §4/§8's gear-cost comparisons and the
  catalyst-weight calc in §10 use, since `catalystWeight` reads `rewards.essence`
  directly, not the tier-scaled amount.
- `BIOME_XP_REWARD_MULT_BY_TIER[4] = 1.0` (line 147) — T4 biome XP is granted at face
  value, unlike T4 essence.
- `CATALYST_PROGRESS_PER_UNIT = 100` (line 158) — see §10's catalyst-supply table for
  the derived kills-per-catalyst figures.

**T3→T4 non-boss reward scaling** (now derivable, where the original draft could not):
comparing each biome's weakest/strongest T4 trash essence value against its T3 range
would require a matching T3 monster-roster extraction, which is out of this pass's
explicit task list (the task calls for T4 resource supply only); flagged here as the
natural next follow-up rather than asserted.

---

## 17. Boss/tier-completion economy

**All 7 live T4 bosses** (§16 table) match **exactly** the `tier-4` quest's
`targetMonsterTypes` list (`shared/src/quests/questDatabase.ts:92-95`):
`iron-crest-titan, verdant-crown-predator, glacial-patriarch, dune-throne-sovereign,
caldera-sovereign, charnel-crown-sovereign, elder-trench-serpent`. Both lists have 7
entries and are set-identical. **The quest monster-ID repair the T3 ledger describes
(§12 of that document) held for T4** — no dead ID, no phantom boss.

`killsRequired: 1` per boss (`questDatabase.ts:96`); seal requirement is 5-of-7 per the
task brief and the T3 ledger's cross-check table (not independently re-derived here, but
consistent with the file's own `tier-4` entry structure matching `tier-1`/`tier-2`/
`tier-3`'s pattern of listing every live boss and requiring a subset).

**No T4→T5 tier exists** — `questDatabase.ts` has no `tier-5` entry (confirmed by the
grep in §2/§17's source pass returning only `tier-1` through `tier-4`), consistent with
T4 being the current top tier of live content.

**No catalyst bundle or guaranteed first-clear reward beyond the standard
essence/level/biomeXp reward block** was found on any T4 boss entry — all 7 use the same
`rewards: { essence, essenceType, level, biomeXp }` shape as ordinary monsters, just at
boss-scale numbers. No special first-clear-only reward field exists in the
`MonsterDefinition` rows read.

**Legacy content flagged, not part of the active T4 pool**: `void-overlord` and its two
staged-encounter dependents (`elder-trench-serpent-warden`, `void-horror`, `void-hulk`)
remain in `bossesT4.ts` (lines 448-566) but are explicitly commented as
"SOFT-DISCARDED... not part of the active design table" by the 2026-08-23 encounter
rework. They do not appear in the `tier-4` quest and should not be treated as an 8th T4
boss.

---

## 18. Mastery architecture verification

**End-to-end, T4 is correct.** Verified directly (not inferred from the T3 ledger's
claims):
- `BIOME_FINAL_TIER_BY_GROUP` is derived, not hand-maintained (`nodeBiomes.ts:237-246`).
- Cave/Swamp both resolve to final tier 3 (no T4 nodes exist for either — confirmed by
  the complete absence of `tier: 4` recipes in both files, §3).
- Plains/Forest both resolve to final tier 2, capped at 12 forever.
- `maxGlobalMasteryAtTier(4) === 156` is pinned by a live, passing test
  (`itemUpgrades.test.ts:27`).
- T4 gates 122/131/139/148/156 are pinned by the same test file and match the task
  brief's expected values exactly.
- **No T4 recipe (gear, ability, rune, stance, rite, or core) has a `requiredBiomeLevel`
  exceeding its own biome's T4 cap** — spot-checked against the highest gate in each
  file read (e.g. Mountain's highest T4 gate is 22, under cap 24; Graveyard's highest is
  6, at cap 6 exactly for `relic-haunted-prism`; Trench's highest is 5, under cap 6).

**Search for stale hardcoded 192/198 assumptions** (`Grep '192|198'` across `*.ts/*.tsx/
*.md`, 38 files matched): classified by sampling the non-obviously-historical hits:

| File | Classification |
|---|---|
| `docs/global-mastery-current-state.md` | **Correctly self-flagged stale doc** — carries an explicit "LARGELY STALE, read the code" warning banner (lines 1-11) with the correct live numbers restated in the banner itself. Not a bug. |
| `docs/system-rework-status.md`, `docs/README.md` | Referenced as already updated per the T3 ledger's file-change list (§1 of that ledger); not independently re-read line-by-line here, but the T3 ledger's own change list claims these were edited to 114/156. |
| `docs/briefs/T3_PROGRESSION_ECONOMY_*.md` (three files) | Historical record of the *old* 126/192 numbers, correctly presented as "before" values in a before/after table — not stale, intentional history. |
| `server/test/t3ProgressionEconomy.test.ts`, `shared/src/systems/itemUpgrades.test.ts` | Pin both the old (126/192, as regression-guard "was" values in comments) and new (114/156) numbers deliberately, per the T3 ledger's test description (§15) — not stale, intentional. |
| `reports/*-llm-packet-t*.md`, `reports/mob-llm-packet-t2.md` | **Likely stale generated bench output** — these are dated artifacts from `tools/dps-report.ts`/`tools/ehp-report.ts`-style generation and were not regenerated after the T3 mastery fix shipped. Classified as **harmless historical artifact** unless a live process reads them back in (not checked) — flagged for regeneration before being trusted as current. |
| `shared/src/data/recipes/*.recipes.ts` (mountain/tundra/desert/jungle/swamp/forest/plains) | These matches are `requiredBiomeLevel: 19`, `22`, etc. or unrelated numeric literals coincidentally containing "192"/"198" as a substring of a larger number (e.g. a cost of `1920` or `19200`) rather than the GM ceiling — **false positive**, not a real hit, confirmed by spot-checking two of these files' matched lines during this pass. |
| `design_docs/archive/BALANCE_REFERENCE.md`, `docs/archive/*.md` | Archived plans; correctly out of live scope per the docs-lifecycle rule in CLAUDE.md. Historical-only. |
| `client/src/render/proceduralGround.ts`, `tools/uishot/shot.ts`, `tools/monster-ref.ts`, `design_docs/visual_and_aesthetics_design/biome-palette-bible.md` | Unrelated to mastery — visual/pixel-dimension or unrelated numeric literals. False positives. |
| `docs/ui-redesign-plan.md`, `docs/ui-redesign-baseline/matrix.md` | Unrelated to mastery (UI layout numbers). False positives. |

**No live gameplay-path bug was found among the 38 grep hits** — the only genuinely stale
*number* still resting anywhere in the live GM path is inside doc prose that already
carries its own "read the code" warning. This is a clean result for the mastery
architecture specifically, in contrast to nearly every other system audited above.

---

## 19. Save-compatibility / grandfathered GM

The T3 ledger's save-safety analysis (§13 of that document) is architecture-level and
applies identically at T4 — verified by re-reading the same live functions rather than
re-deriving new tests:
- `biomeLevelCap` is a pure **gain stop**: it does not clamp a stored `biomeLevel`, only
  the rate at which new XP can raise it (confirmed at `nodeBiomes.ts:286-295`, no write
  path touches stored values here).
- `globalMastery()` (`nodeBiomes.ts:318-325`) sums raw stored `biomeLevel`, uncapped.

**Maximum possible grandfathered GM advantage at T4**: a legacy character that leveled
Plains/Forest past 12 or Cave/Swamp past 18 under the *pre-T3-fix* cap (which allowed
6 more levels per player tier forever — i.e. up to Plains/Forest 24 at old-T4 caps, or
Cave/Swamp 24) keeps those stored levels. Applying `globalMastery()`'s no-ceiling sum:
a save with all four retired biomes sitting at their old (pre-fix) T4 caps of 24 each
instead of the new caps (12/12/18/18) would carry **(24-12)+(24-12)+(24-18)+(24-18) = 36
excess GM** above what a fresh T4 character can ever reach. **CORRECTED**: the original
draft computed this sum as "24," which is an arithmetic error (12+12+6+6 = 36, not 24) —
recomputed directly here. Added to a legitimate 156 GM from the seven live biomes, such a
save could report **up to 192 GM** (**CORRECTED** from "~180"), which is — tellingly —
exactly the game's *old*, pre-T3-fix maximum GM ceiling (the "192" value referenced
throughout §18's stale-grep sweep): a maximally-leveled legacy character simply carries
forward the old formula's total verbatim, which is the expected and internally
consistent result once the arithmetic is done correctly. 192 is comfortably above the T4
+5 gate (156) even before touching the seven active biomes fully. This is **large enough
that a legacy save may reach +5 on every T4 item without engaging with several of the
seven currently-live T4 biomes at all** — a real, quantifiable design question, not
merely "advantageous."

**No invariant violation**: `upgradeCeilingFromGlobalMastery` simply returns `MAX_UPGRADE`
for any GM above the top gate (156) — there's no crash, no negative value, no undefined
behavior. This is a **balance/pacing question for a designer**, not a bug: is it
acceptable that a legacy character can fully gear a T4 loadout while skipping meaningful
engagement with, say, Tundra and Volcanic (whose combined 24-level band this scenario
assumes is unearned)? Classified as **designer decision required** (§22).

---

## 20. Canonical route / benchmark status

`server/bench/balance/botFactory.ts:69-73` (`canonicalBiomeLevels`) and
`server/bench/balance/runFarm.ts:139` both call the live `biomeLevelCap` function
directly — **confirmed**: the canonical T4 bot automatically inherited the GM 192 → 156
drop with no bench code change required, exactly as the T3 ledger's §14/H2 predicted.
`server/bench/balance/progression.ts:277` similarly gates recipe reachability through
`biomeLevelCap`, so no T4 bench recipe check can pass against a stale 192/198 assumption.

**No T4-specific canonical route beyond the generic bot-factory formula was found** —
`canonicalBiomeLevels` simply maxes every biome to its live cap for the target tier; it
is not a curated "this is how a real T4 player plays" route distinguishing which biomes
get farmed in what order. This matches the task brief's framing that a genuine canonical
route is a future deliverable, not an existing one.

**No bench/loadout referencing an impossible T4 item** (e.g. an evolved item that
doesn't exist) was found, consistent with §5's finding that no T4 evolution exists to be
referenced incorrectly in the first place.

`server/bench/balanceRun.ts:366` reports `result.biomeLevelCap` as an output field —
not independently re-verified for correctness beyond confirming it reads from the same
live function.

---

## 21. T3→T4 scaling comparison

| Category | T3 | T4 | T4/T3 ratio | Note |
|---|--:|--:|--:|---|
| Max GM | 114 | 156 | 1.37× | Architecture-correct |
| Band width | 42 | 42 | 1.00× | Uniform since T2 |
| Base weapon cost (typical) | 116-140 | 240-308 | ~1.9-2.2× | Inconsistent (§8) |
| Lifetime weapon (+5) | ~2,090-2,540 | **CORRECTED: 4,920-7,238** (was "4,750-6,930") | **2.01-2.97×** (CORRECTED, was "1.9-2.97×") | Wide spread, no formal lineage to anchor it |
| Lifetime, all 24 T3→T4 pairs (§8, full set) | 658-2,540 | **CORRECTED: 851-7,238** | **1.29×-2.97×** | Bimodal: weapons 2.0-2.97×, armor/rec/mobility 1.3-2.2× (§8) |
| Evolution/Reconstruction | 22 lineages, all gear | **0 lineages, no gear** | — | Total discontinuity |
| Catalyst schedule (gear) | 0/0/0/2/3 (wpn/armor), 0/0/0/0/2 (rec/mob), uniform across all 4 biomes with gear that tier | 4/0/0/0/0 in 3-of-7 biomes, 0/0/0/0/0 in 4-of-7 | — | Reverted AND inconsistent |
| Technique/Guard cost (top) | 210 | 1,300-1,500 | 6.2-7.1× | Confirmed live, self-flagged in source |
| Rune content added | 0 (T3 policy: Rites are the RP layer) | 1 | — | Coherent addition |
| Stance content added | 0 (T3 froze pre-existing T4 Recuperating) | 0 | — | No change |
| Rite content added | 6 total (all T3) | 0 | — | No new rites |
| Core economy | 12 total (all T3), catalyst 2-3/core | unchanged, 0 new | — | Stable, out of scope |
| Relic economy | 0 (system doesn't exist below T4) | **8, uniform ~220 essence + 4 catalyst each** | — | New, coherent |

**Outlier categories**: Technique/Guard cost (6-7×) and the complete absence of
evolution/lineage infrastructure are the two largest structural discontinuities. Catalyst
schedule is the most *inconsistent* category (varies biome-to-biome within the same tier,
which none of T1-T3's schedules did).

---

## 22. Economic coherence findings

| Finding | Classification |
|---|---|
| Zero T4 gear has `evolvesFrom`/`reconstructCost` | **Missing propagation** — the T2/T3 evolution mechanism was never extended past the T3→T4 seam |
| Every T4 item's +3=+4=+5 plateau | **Legacy economic residue** — literally the defect T1-T3 each fixed, present verbatim |
| T4 ability costs 1,300/1,500 | **Legacy economic residue**, self-documented in source comment as unrepriced |
| Catalyst-at-base-craft-only, T4 | **Legacy economic residue** (reverts pre-T2 pattern) |
| Catalyst presence varies by biome (Mountain/Jungle/Tundra charge 4; Desert/Volcanic/Graveyard/Trench charge 0) | **Source/data defect** — no comment anywhere explains why half the T4 biomes charge nothing; this is not a stated design choice, it reads as an authoring gap identical to the pre-fix "Volcanic hole" T3 explicitly called out and fixed |
| Recuperating Stance catalyst 7 | **Legacy economic residue**, isolated (§13) |
| T3→T4 scaling ratio spread 1.29×-2.97× | **Source/data defect** — same class of per-item inconsistency the T3 pass corrected for T2→T3 |
| Graveyard/Trench header comments claiming only boots are authored | **Source/data defect** (stale/copy-pasted documentation, actively misleading) |
| Tundra Glacial Rimebrand's "inherited from Swamp" comment contradicting its own T3 predecessor's "genuinely new, no predecessor" comment | **Source/data defect** (internally contradictory in-repo documentation) |
| Trench's 3 T4 monsters grant `blue` essence while Trench gear costs `green` and Trench's boss grants `purple` (§16) | **Source/data defect, newly found in this pass** — every other T4 biome's monster essence type matches its own gear; Trench alone pays out a color that funds nothing it owns |
| Cave/Swamp mastery retirement | **Correctly implemented** — no finding, verified clean |
| Relic system | **Intentional specialization** — new, coherent, uniformly shaped; no defect found |
| One new Rune, zero new Rites/Stances | **Intentional specialization** — consistent with each system's own established cadence |
| Quest monster-ID integrity | **Correctly implemented** — held from T3 into T4 |
| Grandfathered legacy GM (§19) | **Designer decision required** — not a bug, but large enough (36 excess GM headroom, up to a 192 legacy ceiling) to materially change what "reaching T4 +5" means for old saves |
| T3→T4 pacing (does T4 farming complete before over-optimization) | **Pacing hypothesis** — cannot be assessed from static data alone; needs the same kind of canonical-bot measurement the T3 ledger deferred (H1) |

---

## 23. Historical philosophy reconciliation

- **`design_docs/economy-philosophy.md`**: per the T3 ledger, deliberately left as
  historical archaeology and not updated for the T3 hybrid-colour rule; this audit did
  not re-read it in full, but notes it should not be trusted as a live description of
  T4's (nonexistent) hybrid/lineage treatment either — **historical-only**, per the T3
  ledger's own precedent.
- **`docs/gear-evolution-current-state.md`**: confirmed live and updated with the correct
  T3/T4 GM figures (114/156, gates 80-114/122-156) at lines 24-29 — **still
  implemented**, correctly describes the mastery-gate side of evolution even though it
  says nothing about T4 gear having zero actual evolution instances (an omission worth
  closing in a future doc pass, not a contradiction).
- **`docs/global-mastery-current-state.md`**: **superseded**, but correctly
  self-flagged with a stale-warning banner pointing at the T3 ledger as the living
  source. Exemplary of how a stale doc should be handled — not a defect.
- **T3 ledger's own H4 hypothesis** ("the T3→T4 seam is now the sharpest in the game"):
  **confirmed true by this audit**, not merely restated — every quantified discontinuity
  in §21/§22 above independently verifies that prediction against live T4 source rather
  than assuming it.

---

## 24. Designer decisions

1. **Should T4 gear gain an evolution/reconstruction lineage from T3, mirroring the
   T2→T3 pass?** This is the largest missing piece; 15+ items in §5 have an obvious,
   already-commented mechanical heir.
2. **What should the T4 gear upgrade curve be?** Replace the universal +3=+4=+5 plateau
   with the shipped 4/10/16/26/44% grammar, per-item, the same way T1-T3 each did.
3. **What is the intended T4 catalyst schedule, and should it be uniform across all
   seven T4 biomes?** Currently 3-of-7 biomes charge 4 catalysts at the door and 4-of-7
   charge none, with no documented reason for the split.
4. **Should T4 catalysts move to the optimization-first schedule (0/0/0/2/3 or similar)
   the way T2/T3 gear does**, or is base-craft-only intentional for the top tier?
5. **Reprice the four T4 abilities off the abandoned 1300/1500 ladder** — the source
   comment already asks for this; the T3 pass's method (roughly one gear-upgrade-step
   cost, premium scaled by optionality) is a ready template.
6. **Is Recuperating Stance's catalyst-7 legacy or intentional?** No comment defends it;
   every sibling recipe in both Stance and Rite tables charges 2-3.
7. **Should Cave/Swamp mechanic "inheritance" into Graveyard/Trench be formalized** (a
   `lineageId`/flavor note) or left as prose-only, given the contradictory Rimebrand
   comment found in §6?
8. **Fix the copy-pasted Graveyard/Trench file headers** — low-risk, high-value
   documentation cleanup independent of any numeric repricing.
9. **Should legacy grandfathered GM headroom (§19) be addressed** — e.g. should a
   character be required to actually hold live T4 biome levels (not just aggregate GM)
   to reach +5 on T4 gear, closing the 36-GM gap a pre-fix save could carry?
10. **Should Graveyard/Trench's `⚠ INHERITED... VERIFY in budget pass` weapon comments
    be resolved** (i.e., are their base `attack` values actually validated against the
    current formula set, or are they still placeholders copied from a design doc)?
11. **Fix Trench's monster essence-color mismatch** (§16, newly found this pass): its 3
    T4 monsters grant blue essence, its gear costs green, its boss grants purple. Trench
    trash currently funds no Trench-owned system at all. This looks like a copy/paste
    default (blue is Mountain's/Tundra's color) rather than a deliberate choice, but no
    comment states an intent either way.

---

## 25. Validation pass (this correction pass)

Explicit self-check performed before finishing this correction pass, per the task's
validation checklist:

- **Reported ordinary T4 gear count (39) equals the live database count.** Verified two
  independent ways: (a) summing the seven per-biome table rows in §4 (7+5+4+6+6+6+5=39),
  (b) a `tsx` script importing `RECIPE_DATABASE` and filtering
  `tier === 4 && slot !== 'relic' && slot !== 'core'` (`.length === 39`). Both agree.
- **Every reported lifetime total equals base + Σ(+1..+5) per color.** Computed by the
  same script, which sums `cost` and every `upgrades[].cost` key-by-key — not
  hand-added off table cells. Cross-checked by hand for Earthsunder Maul (256+384+768+
  1290+1290+1290=5,278) and Titan's Keep (blue 256+290+572+858+858+858=3,692; red
  64+96+192+290+290+290=1,222).
- **Every combined total equals the sum of colors.** Titan's Keep 3,692+1,222=4,914;
  Fortress Heart 1,570+390=1,960; Primal Canopy 2,670+1,205=3,875 — all reconciled in §8.
- **Every T3→T4 ratio uses the finalized T3 implementation value**, read from the same
  live `RECIPE_DATABASE` (not a superseded proposal) — e.g. Avalanche Maul's 2,444,
  Summit Aegis's 2,228, and Bastion Heart's 936 all matched the original draft's T3
  figures exactly, confirming those T3 totals were already correct; only the T4 side and
  the resulting ratios needed correction.
- **Catalyst summary equals actual recipe fields.** §10's per-biome catalyst table and
  §4's per-item `cat` column were both read from the same `catalystCost`/
  `upgrades[].catalystCost` fields; Desert/Volcanic/Graveyard/Trench were independently
  confirmed to carry `catalystCost: undefined` on every T4 item (script output, not a
  table read) — the executive summary's contradictory claim is the one that was wrong,
  corrected in §1.
- **Every resource-supply monster in §16 actually appears in a T4 node/pool** — sourced
  directly from `biomeDatabase.ts`'s `monsterPoolByTier[4]` per biome (the actual
  spawn-selection table the server reads), not from a name grep across monster files
  that might include off-tier or deferred entries (e.g. Graveyard's `charnel-brute` is
  explicitly commented as deferred to T5 and correctly excluded from the §16 roster).
- **All seven active T4 biomes are represented** in §4 (gear), §14 (relics), §16
  (monsters/bosses), and §10/this-section's catalyst-supply table — Mountain, Jungle,
  Desert, Tundra, Volcanic, Graveyard, Trench, each with a non-empty gear/monster/relic
  row.

## 26. Source map

**Formulas / architecture**
- `shared/src/world/nodeBiomes.ts:200-341` — `BIOME_START_TIER_BY_GROUP`,
  `BIOME_FINAL_TIER_BY_GROUP`, `BIOME_LEVELS_PER_TIER`, `biomeLevelOffset`,
  `biomeLevelCap`, `biomeXpForBiomeLevel`, `globalMastery`, `maxGlobalMasteryAtTier`.
- `shared/src/runeDatabase.ts:767-771` — `RUNE_POINT_GLOBAL_MASTERY_STEP`,
  `runeBudgetForGlobalMastery`.
- `shared/src/systems/itemUpgrades.test.ts:20-69` — live pins for GM ceilings/gates.

**Gear recipes (read in full)**
- `shared/src/data/recipes/mountain.recipes.ts`
- `shared/src/data/recipes/jungle.recipes.ts`
- `shared/src/data/recipes/desert.recipes.ts`
- `shared/src/data/recipes/tundra.recipes.ts`
- `shared/src/data/recipes/volcanic.recipes.ts`
- `shared/src/data/recipes/graveyard.recipes.ts`
- `shared/src/data/recipes/trench.recipes.ts`
- `shared/src/data/recipes/cave.recipes.ts`, `swamp.recipes.ts`, `plains.recipes.ts`,
  `forest.recipes.ts` (grepped for `tier: 4`/`slot: 'relic'`/`slot: 'core'` — confirmed
  zero T4 content in all four)
- `shared/src/data/recipes/types.ts` — `Recipe` schema (`evolvesFrom`, `catalystCost`,
  etc.)

**Abilities / Runes / Stances / Rites**
- `shared/src/abilityRecipes.ts` (full file)
- `shared/src/runeRecipes.ts` (full file)
- `shared/src/stanceRecipes.ts` (full file)
- `shared/src/riteRecipes.ts` (full file)

**Monsters / bosses / quests**
- `shared/src/data/monsters/bossesT4.ts` (full file, all 7 live bosses + legacy
  void-overlord block)
- `shared/src/quests/questDatabase.ts:84-97` (`tier-4` entry)
- `shared/src/biomeDatabase.ts` (`monsterPoolByTier[4]` for all 7 biomes — the actual
  live spawn roster, used to scope §16's monster tables to real T4 mobs only)
- `shared/src/data/monsters/mountain.monsters.ts`, `jungle.monsters.ts`,
  `desert.monsters.ts`, `tundra.monsters.ts`, `volcano.monsters.ts`,
  `graveyard.monsters.ts`, `trench.monsters.ts` (**CORRECTED: now read in full for all
  seven biomes**, not sampled — §16)

**Node modifiers / catalysts**
- `shared/src/world/nodeModifierTypes.ts` (`NATIVE_MODIFIER`, `MODIFIER_BANS`)
- `shared/src/world/nodeModifiers.ts` (`MODIFIER_MAGNITUDE_BY_TIER`,
  `MODIFIER_REWARD_FACTOR`, `modifierRewardMult`)
- `shared/src/world/map/registry.ts` (`WORLD_NODE_LIST`, live per-node modifier
  assignment for the T4 catalyst-supply table in §10)
- `server/src/systems/player/progression/rewards.ts:184-216` (live essence/catalyst
  reward formula, incl. the `BIOME_ESSENCE_TIER_MULT`/`catalystWeight` read path)

**Bench / canonical route**
- `server/bench/balance/botFactory.ts:69-73` (`canonicalBiomeLevels`)
- `server/bench/balance/runFarm.ts:139`
- `server/bench/balance/progression.ts:277`
- `server/bench/balanceRun.ts:366`

**Docs cross-checked**
- `docs/briefs/T1_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-28.md`
- `docs/briefs/T2_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-29.md`
- `docs/briefs/T3_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-30.md`
- `docs/global-mastery-current-state.md` (confirmed self-flagged stale)
- `docs/gear-evolution-current-state.md:24-29` (confirmed live-accurate on GM figures)

**Grep sweep**
- `Grep '192|198'` across `*.ts/*.tsx/*.md`, repo-wide (38 files; classified in §18)
