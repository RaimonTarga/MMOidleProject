# T3 Progression Economy — Architecture Proposal

**Date:** 2026-08-30
**Status:** PROPOSAL — for designer approval. **Nothing in this document has been implemented.** No game or source file was modified to produce it; the only artefact written is this brief.
**Builds on:** `docs/briefs/T3_PROGRESSION_ECONOMY_BASELINE_2026-08-29.md` (audit), anchored on the two shipped ledgers `docs/briefs/T1_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-28.md` and `docs/briefs/T2_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-29.md`.
**Method:** every load-bearing number below was re-derived from live source via throwaway read-only `tsx` scripts against `RECIPE_DATABASE` / `NODE_BIOMES` / `BIOME_DATABASE` / `QUEST_DATABASE` / `MONSTER_DATABASE` (scripts deleted after use), not copied from the audit's prose. Where source and audit disagreed the source wins and it is noted.

Scope guards observed throughout: **Core economy untouched** (decision 11 of the T3 rework brief / task constraint), **no T3 Runes designed** (§7 below), **no T4 economy redesign** (§13 states implications only), **no bot routes** (§14), **no combat stat or mechanic changes anywhere** — every number moved is essence, catalyst, or a GM/mastery gate.

---

## 1. Proposed biome-retirement / mastery architecture

### 1.1 The defect being fixed

`biomeLevelCap(playerTier, group)` (`shared/src/config/gameConfig.ts:256-263`) is:

```ts
const startTier = BIOME_START_TIER_BY_GROUP[biomeGroup] ?? 1;
return Math.max(0, (playerTier - startTier + 1) * BIOME_LEVELS_PER_TIER);
```

It knows when a biome **starts** but not when it **ends**, so it keeps granting six more levels of headroom per player tier forever. `maxGlobalMasteryAtTier` (`gameConfig.ts:302-309`) sums that over every group, and `globalMasteryRequiredForUpgrade` (`shared/src/systems/itemUpgrades.ts:26-31`) builds the item-upgrade GM band on top of it. The result is the audit's D1: at T3 the ceiling counts Plains 18 and Forest 18 against biomes that have **no T3 nodes at all** (`shared/src/world/map/regionT3.ts:16` — the region's biomes are `tundra, mountain, cave, jungle, desert, volcanic, swamp`).

`BIOME_START_TIER_BY_GROUP` is already **derived** from the authored map (`gameConfig.ts:215-224` — the minimum `biomeTier` over `kind === 'normal' | 'dungeon'` nodes). The fix is symmetric and requires no new authored constant.

### 1.2 Proposed change (generic, not a T3 patch)

**P1.1 — Add `BIOME_FINAL_TIER_BY_GROUP`, derived the same way as the start-tier map.** Same loop, `Math.max` instead of `Math.min`, in the same IIFE in `gameConfig.ts`.

```ts
/** Highest tier at which a biome has authored progression nodes. Derived, never authored:
 *  a biome's contribution to mastery stops expanding when its content does. */
export const BIOME_FINAL_TIER_BY_GROUP: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  for (const { biomeGroup, biomeTier, kind } of Object.values(NODE_BIOMES)) {
    if (kind !== 'normal' && kind !== 'dungeon') continue;
    if (map[biomeGroup] === undefined || biomeTier > map[biomeGroup]) map[biomeGroup] = biomeTier;
  }
  return map;
})();
```

**P1.2 — `biomeLevelCap` clamps the player's tier to the biome's final tier.**

```ts
export function biomeLevelCap(playerTier: number, biomeGroup: string): number {
  if (biomeGroup === 'clearing') return 4;
  const startTier = BIOME_START_TIER_BY_GROUP[biomeGroup] ?? 1;
  const finalTier = BIOME_FINAL_TIER_BY_GROUP[biomeGroup] ?? startTier;
  const effectiveTier = Math.min(playerTier, finalTier);
  return Math.max(0, (effectiveTier - startTier + 1) * BIOME_LEVELS_PER_TIER);
}
```

`maxGlobalMasteryAtTier` and `globalMasteryRequiredForUpgrade` need **no edit** — they compose over `biomeLevelCap` and inherit the fix. That is the whole point of doing it here rather than special-casing T3.

Because both maps are derived from `NODE_BIOMES`, **the class of bug the audit found cannot recur**: give Plains a T3 node and its cap grows on the same commit; delete Cave's T4 nodes and its cap stops on the same commit. The invariant is structural, not a test. (§12 still proposes tests, for the derived *consequences*.)

### 1.3 Derived caps and mastery ceilings (verified against live `NODE_BIOMES`)

| Biome | start tier | final tier (derived) | cap @T1 | cap @T2 | **cap @T3** | cap @T4 |
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
| *(live today)* | | | *30* | *72* | *126* | *192* |

The T3 column reproduces the designer's intended roster **exactly** — Plains 12, Forest 12, Mountain/Swamp/Cave 18, Jungle/Desert 12, Tundra/Volcanic 6, ceiling **114**. T1 and T2 are **bit-identical to today**, which is essential: the shipped T1 and T2 item-upgrade gates (6/12/18/24/30 and 38/47/55/64/72) are unchanged by this proposal.

### 1.4 Existing saves — no player is broken or regressed

Verified by reading every consumer of `biomeLevelCap` (repo-wide grep, 2026-08-30):

- **`server/src/systems/player/progression/rewards.ts:107-111`** uses the cap only as a *gain stop* (`if (prevLevel >= levelCap) return { xpGain: 0, ... }`). It never writes a lower level. A legacy character sitting at Plains 15 keeps 15 and keeps the GM it confers — `globalMastery()` (`gameConfig.ts:283-291`) sums raw `biomeLevel` and has no ceiling. **No negative progression, no lost upgrade level, no refund needed.**
- **`shared/src/systems/itemUpgrades.ts:36-43`** (`upgradeCeilingFromGlobalMastery`) walks upward from the live GM; a GM above 114 simply returns 5. Over-cap players are strictly advantaged, never clipped.
- **`shared/src/systems/biomeProgress.ts:36-39`** (`isBiomeLevelCapped`) returns `true` for such a biome, so auto-traverse correctly treats Plains/Forest as finished. Desired behaviour.
- **Cosmetic only:** `client/src/hud/BiomeXpBar.tsx:18`, `client/src/ui/map/NodeInfo.tsx:289` and `client/src/ui/MasteryPanel.tsx:241` render `level / cap` and would display `15 / 12` for such a save. **P1.3 — display the denominator as `Math.max(cap, currentLevel)`** in those three call sites. Presentation-only, no gameplay effect.

**Verified: no recipe of any kind is stranded by the new caps.** A sweep over `RECIPE_DATABASE`, `ABILITY_RECIPE_DATABASE`, `RUNE_RECIPE_DATABASE`, `STANCE_RECIPE_DATABASE` and `RITE_RECIPE_DATABASE` found **zero** entries whose `requiredBiomeLevel` exceeds the new cap for its group at its own tier, and **zero** recipes authored above their biome's final tier. `recipeGates.test.ts` will still pass with an empty `RETIRED_BIOME_DEBT`.

---

## 2. Resulting T3 GM / +N gates

The live derivation is unchanged (`shared/src/systems/itemUpgrades.ts:26-31`):

```ts
const base = maxGlobalMasteryAtTier(tier - 1);
const band = maxGlobalMasteryAtTier(tier) - base;
return base + Math.round((band * plus) / MAX_UPGRADE);   // MAX_UPGRADE = 5
```

For T3 under the new architecture: `base = 72`, `band = 114 − 72 = 42`.

| `+N` | derivation | **proposed gate** | live today | Δ |
|--:|---|--:|--:|--:|
| +1 | 72 + round(42×1/5) = 72 + round(8.4) = 72 + 8 | **80** | 83 | −3 |
| +2 | 72 + round(16.8) = 72 + 17 | **89** | 94 | −5 |
| +3 | 72 + round(25.2) = 72 + 25 | **97** | 104 | −7 |
| +4 | 72 + round(33.6) = 72 + 34 | **106** | 115 | −9 |
| +5 | 72 + round(42.0) = 72 + 42 | **114** | 126 | −12 |

**+5 now lands exactly at "every biome a T3 player can actually play, maxed."** The ~2,200-kill retired-biome debt (audit §2.4) disappears entirely; nothing about Plains or Forest is required to finish a T3 item.

Two consequences worth stating for approval:

- **T1/T2 gates are untouched** (bands 0–30 and 30–72 are unchanged, §1.3), so no shipped item's upgrade ceiling moves. This is the reason for clamping rather than re-banding.
- **RP budget is unaffected in practice.** `runeBudgetForGlobalMastery = 8 + floor(GM/10)` (`shared/src/runeDatabase.ts:769-771`) gives **19** at GM 114 — the same figure a realistic T3 player already reached. Only the unreachable GM-126 → 20 RP case is removed. Decision 6 explicitly does not want RP costs redesigned around the Rite set, so this is left as-is: all six Rites (20 RP) still do not co-exist, by design.
- The T3 band width stays 42 GM, identical to T2's — a pleasing accident of the roster that makes the tier-to-tier pacing uniform.

---

## 3. Exact proposed T2→T3 lineage map

Rule applied: a lineage exists where the **mechanic identity** is continuous, verified by reading `mechanicEffects` / `weaponDot` / stat keys on both recipes — not by slot-and-biome coincidence.

### 3.1 Direct continuing-biome lineages (20)

Mountain, Cave, Swamp, Jungle and Desert all run T2→T3 with the same four slots and the same mechanic keys.

| T2 predecessor (id) | → T3 successor (id) | Slot | Mechanic continuity verified |
|---|---|---|---|
| `quake-hammer` | `mountain-avalanche-maul` | weapon | `empowered-mult-bonus`, aps 0.55 both |
| `mountain-vest-t2` | `mountain-vest-t3` | armor | `guard.potency-pct` + damage cap |
| `mountain-charm-t2` | `mountain-charm-t3` | recovery | `barrier-pct` |
| `mountain-boots-t2` | `mountain-boots-t3` | mobility | `approach-speed-pct` |
| `ruinous-axe` | `cave-cataclysm-axe` | weapon | `dead-swing-interval` |
| `cave-vest-t2` | `cave-vest-t3` | armor | flat `damageReduction` + plating |
| `cave-charm-t2` | `cave-charm-t3` | recovery | `absorb-pct` |
| `cave-boots-t2` | `cave-boots-t3` | mobility | stealth |
| `swamp-mirebrand` | `swamp-blightbrand` | weapon | `weaponDot` element **poison**, convPct 0.50, same effect shape (`swamp.recipes.ts:129` vs `:218`) |
| `swamp-vest-t2` | `swamp-vest-t3` | armor | DoT resist / hit-to-DoT |
| `swamp-charm-t2` | `swamp-charm-t3` | recovery | recovery pulse |
| `swamp-boots-t2` | `swamp-boots-t3` | mobility | slow resist |
| `jungle-stinger-rapier` | `jungle-venomthorn-rapier` | weapon | `onHitDamage`, aps 1.65 both |
| `jungle-vest-t2` | `jungle-vest-t3` | armor | `evasion` |
| `jungle-charm-t2` | `jungle-charm-t3` | recovery | ramping Recovery |
| `jungle-boots-t2` | `jungle-boots-t3` | mobility | speed line |
| `desert-sunsteel-cross` | `desert-solar-cross` | weapon | first-strike multiplier |
| `desert-vest-t2` | `desert-vest-t3` | armor | cheat-death + cleanse + debuff resist |
| `desert-charm-t2` | `desert-charm-t3` | recovery | cleanse / empty-heal |
| `desert-boots-t2` | `desert-boots-t3` | mobility | kite-speed |

### 3.2 Explicit cross-biome handoffs (2)

Both verified against source, both real:

| T2 predecessor | → T3 successor | Verdict and evidence |
|---|---|---|
| `plains-vest-t2` (Enduring Robe, `maxHp` + **`plating`**, `plains.recipes.ts:155-164`) | `volcanic-vest-t3` (Emberforge Plate, `maxHp: 90`, **`plating: 20`**, plus `defense.hardening-*`, `volcanic.recipes.ts:25-40`) | **REAL LINEAGE.** Plating is carried forward literally, on the same stat key, and matured with the hardening ramp. This is the documented Plains→Volcanic plating handoff (`design_docs/archive/tier3-design-plan.md §1`) and the data backs it. |
| `plains-charm-t2` (Stalwart Heart, **`defense.recovery-on-kill-pct`** 0.32, `plains.recipes.ts:176`) | `volcanic-charm-t3` (Magmaheart Stone, **`defense.recovery-on-kill-pct`** 0.04 + `defense.recovery-active-pct` 0.06, `volcanic.recipes.ts:47`) | **REAL LINEAGE.** Identical mechanic key, extended with an always-active half. Kill-chain Recovery is the item's identity in both. |

### 3.3 Genuinely new T3 items — no predecessor (7)

| Item | Why new |
|---|---|
| `tundra-permafrost-maul` | brittle-stack weapon (`weapon.brittle-*`), aps 0.50; no T2 item carries brittle |
| `tundra-rimebrand` | `weaponDot` element **`frost`**, convPct **0.70** (`tundra.recipes.ts:34`). See §4 — this is *not* a Swamp relocation in the data. |
| `tundra-vest-t3` | stationary-ramp DR + damage cap; new axis |
| `tundra-charm-t3` | barrier + absorb pairing; new axis |
| `tundra-boots-t3` | `momentum`/ramp-speed; new axis |
| `volcanic-cinderlash` | `weapon.flurry-pct` / `flurry-stacks` (`volcanic.recipes.ts:13`); no T2 weapon has flurry |
| `volcanic-boots-t3` | `mobility.passive-speed-pct` + `suppress-ms` (`volcanic.recipes.ts:66`) |

**Counts: 20 continuing + 2 cross-biome handoff + 7 new = 29 T3 gear items.** Matches the live census exactly.

---

## 4. Explicit dead-end lineages and rationale

Seven T2 item identities end at T2 and get **no** T3 successor. This is deliberate — the goal is continuity where it is real, not immortal gear chains.

| T2 item (+5 investment ends here) | Rationale |
|---|---|
| `knight-steelsword` (Knight's Steelsword, Plains) | **DEAD END. Investigated: Plains weapon → Cinderlash is NOT continuous.** Knight's Steelsword's entire identity is `technique.cooldown-reduction-pct` (`plains.recipes.ts:139-146`, every upgrade step adds 0.01 of it). Cinderlash is a flurry attack-speed weapon (`volcanic.recipes.ts:13`) with no CDR key anywhere. The generalist Technique-CDR identity was deliberately retired to the **Arcanist Core** (`mountain.recipes.ts:465`, `tier3-design-plan.md §5`), not to a weapon. Linking them would be a slot-and-biome coincidence with zero mechanical truth. Confirm as a dead end. |
| `plains-boots-t2` (Gale Boots) | **DEAD END. Investigated: Plains boots → Volcanic boots is NOT continuous.** Gale Boots are `mobility.kill-speed-pct` + `kill-speed-ms` (`plains.recipes.ts:107-116`). Magma Walkers are `mobility.passive-speed-pct` + `mobility.suppress-ms` (`volcanic.recipes.ts:66`) — a different mechanic with an opposite shape (a standing bonus that gets *suppressed* on being hit, vs. a burst earned by killing). Kill momentum genuinely stops at T2 (audit H2). **Flagged for the designer:** this is the one place where the Plains→Volcanic handoff is incomplete. Re-homing kill-momentum would be a *combat-mechanic* change and is therefore out of this proposal's scope; if the designer wants the lineage, the boots' mechanic must change first and this document should then be amended. |
| `gale-needle`, `thorn-needle` (Forest branch weapons) | **DEAD END** — see the blocker in §5.3. Their mechanic (fast on-hit rapier) does continue, but into a Jungle line that already has its own unambiguous T2 predecessor. |
| `forest-vest-t2` (Phantom Bindings) | **DEAD END.** Jungle's evasion armor already runs `jungle-vest-t2 → jungle-vest-t3`. Creating a second parent would be a many-to-one merge; per the task's instruction, Forest is not merged into Jungle's existing lineage. |
| `forest-charm-t2` (Ancient Heartroot Amulet) | **DEAD END**, same reason — `jungle-charm-t2 → jungle-charm-t3` is the live recovery line. |
| `forest-boots-t2` (Windstep Wraps) | **DEAD END**, same reason — `jungle-boots-t2 → jungle-boots-t3`. |

**Forest→Jungle verdict, stated plainly:** the *mechanics* were re-housed (evasion, Recovery foundation, traversal speed, and the green essence colour all went to Jungle, audit §6) but the *items* were not, because Jungle authored its own complete T2 kit at the same time. All five Forest T2 items are dead-ends. Zero Forest→Jungle lineages are proposed.

**Swamp DoT weapon → Tundra Rimebrand: investigated, verdict NOT a relocation.** `tundra.recipes.ts:5-6` claims Tundra "owns the FROST DoT weapon line (relocated from Swamp)", but the live data contradicts the word *relocated*: the Swamp DoT weapon line is fully intact and continues inside Swamp (`ashbrand-blade` → `swamp-mirebrand` → `swamp-blightbrand`, all `element: 'poison'`, convPct 0.50). Rimebrand is `element: 'frost'`, convPct **0.70**, and has its own T4 successor (`tundra-glacial-rimebrand`, `tundra.recipes.ts:126-131`). What was relocated was a *design slot* (the second DoT flavour), not an item chain. **Rimebrand is a genuinely new T3 item and Swamp keeps its own lineage.** The stale comment should be reworded (§11).

---

## 5. Proposed evolve / reconstruct rules

### 5.1 Rules (unchanged grammar, extended one tier)

- **Evolution still requires the predecessor at +5.** `EVOLUTION_REQUIRED_PLUS = 5` (`shared/src/systems/evolution.ts`) stays as the T2 pass set it; `requiredPlusFor()` applies it uniformly, so **no code change is needed to extend evolution to T3** — this is data-only, exactly as the T2 ledger §1 proved (19 lineages absorbed with zero code changes).
- **Evolve** consumes the +5 predecessor and pays the successor's normal base `cost`, **no catalyst**.
- **Reconstruct** (no predecessor, or predecessor below +5) pays `reconstructCost` = **3.5× the evolve essence cost**, preserving the item's colour split, plus **3 catalysts** of the item's established family (T2 charged 2; the step to 3 is §7's schedule).
- Reconstruction remains the skip / build-switching path, exactly as at T2.
- The 7 genuinely-new T3 items (§3.3) stay plain `craftRecipe` entries with no `evolvesFrom` and no `reconstructCost`, exactly as Jungle/Desert's 8 T2 debut items do.

### 5.2 Proposed reconstruct costs (3.5× base, split preserved)

| T3 item | Evolve cost (= base) | **Reconstruct** | Catalyst |
|---|---|---|--:|
| `mountain-avalanche-maul` | b116 | b406 | heavy 3 |
| `mountain-vest-t3` | b116 / r29 | b406 / r102 | heavy 3 |
| `mountain-charm-t3` | b100 / r25 | b350 / r88 | heavy 3 |
| `mountain-boots-t3` | b100 | b350 | heavy 3 |
| `cave-cataclysm-axe` | r120 | r420 | swarming 3 |
| `cave-vest-t3` | r116 / y29 | r406 / y102 | swarming 3 |
| `cave-charm-t3` | r100 / g25 | r350 / g88 | swarming 3 |
| `cave-boots-t3` | r100 | r350 | swarming 3 |
| `swamp-blightbrand` | p116 | p406 | fortified 3 |
| `swamp-vest-t3` | p140 | p490 | fortified 3 |
| `swamp-charm-t3` | p100 | p350 | fortified 3 |
| `swamp-boots-t3` | p100 | p350 | fortified 3 |
| `jungle-venomthorn-rapier` | g120 | g420 | alacrity 3 |
| `jungle-vest-t3` | g90 / y30 | g315 / y105 | alacrity 3 |
| `jungle-charm-t3` | g100 | g350 | alacrity 3 |
| `jungle-boots-t3` | g90 | g315 | alacrity 3 |
| `desert-solar-cross` | y116 | y406 | dominion 3 |
| `desert-vest-t3` | y120 / p30 | y420 / p105 | dominion 3 |
| `desert-charm-t3` | y100 / p25 | y350 / p88 | dominion 3 |
| `desert-boots-t3` | y90 | y315 | dominion 3 |
| `volcanic-vest-t3` | r120 / y30 | r420 / y105 | **alacrity 3** (§7.2) |
| `volcanic-charm-t3` | r75 / y25 | r263 / y88 | **alacrity 3** (§7.2) |

### 5.3 ARCHITECTURAL BLOCKER — single `evolvesFrom` cannot express the rapier merge

`Recipe.evolvesFrom` is a single string (`shared/src/data/recipes/types.ts`). The T1→T2 architecture only ever needed **one-to-many** (Flash Rapier → Gale Needle *or* Thorn Needle), which a single field expresses fine by putting the fork on the children.

T2→T3 needs the inverse. `jungle-venomthorn-rapier` (on-hit, aps 1.65) is the mechanical heir of **both**:

- `jungle-stinger-rapier` (same biome, same keys, same aps — the unambiguous parent), and
- `gale-needle` / `thorn-needle` (Forest, the game's only branched lineage, whose fast on-hit rapier identity is documented as re-housed to Jungle in `tier3-design-plan.md §1`).

**Recommendation (implementable today):** set `evolvesFrom: 'jungle-stinger-rapier'` and let the Forest needles dead-end (§4). Same-biome, same-keys continuity is the stronger claim, and Reconstruction already exists as the Forest player's on-ramp.

**Blocker requiring designer input:** if the designer wants a Forest player's +5 Gale/Thorn Needle to *actually convert*, the data model must change — an `evolvesFromAny: string[]` (or a `lineageId` match, which cores and relics already carry) — with a matching change in `checkEvolve` (`shared/src/systems/evolution.ts:82-160`), the server's `itemEvolution.ts` consumption path, and the client's `MakeTab.tsx` "Evolves from X +5" copy. That is a genuine schema + code change and I am flagging it rather than picking arbitrarily. **The rest of this proposal is data-only and does not depend on the answer.**

A second, milder instance of the same limitation: `volcanic-vest-t3` and `volcanic-charm-t3` name Plains parents in a Volcanic file. That *is* expressible today (one parent each) and needs no schema change — only a clear inline comment, since it is the first cross-biome lineage in the game.

---

## 6. Complete proposed T3 gear cost table

### 6.1 Anchoring method

- **Ordinary continuing lineage:** T3 lifetime total = **2.0 ×** the finalized T2 predecessor's lifetime total (task band 1.8–2.2×). T2 figures below are read live from `RECIPE_DATABASE`, i.e. post-T2-pass, not from the T2 baseline.
- **Genuinely new item:** priced into the T3 band for its own slot, alongside comparable T3 items.
- **Cross-biome handoff from a retired *starter* biome:** **2.2 ×**, a justified exception — Plains' T2 costs are deliberately depressed for early-game accessibility (its T2 kit is 2,520 against Desert's 3,617), so a flat 2.0× would land Volcanic's armor and charm *below* every other T3 item in their slot. 2.2× puts them at the bottom of the T3 band instead of under it.
- **Curve shape:** the shipped grammar, verified byte-for-byte against the live T2 data (e.g. `ruinous-axe`: base r60, steps 44/110/177/287/486 on a post-base of 1,104 = exactly 4/10/16/26/44%). Post-base spend `P` is split **4 / 10 / 16 / 26 / 44 %** across +1..+5, with residual rounding pushed onto +5 so totals are exact. **+4/+5 = 70% of post-base spend** on every item, inside the 65–75% target. This replaces the current universal `+3 = +4 = +5` flat plateau (step ratio 1.00, the flattest possible violation of `economy-philosophy.md §3`).
- **Base craft costs are left where they are** (74–140), preserving `economy-philosophy.md §3`'s "base craft stays accessible" and minimising churn. All movement is in the upgrade track.
- **Slot ordering preserved:** weapon/armor largest, recovery/charm medium, mobility cheapest, per biome.
- **No combat stat, `attacksPerSecond`, `mechanicEffects` or `requiredBiomeLevel` value is changed** by this section. Only `cost` and `catalystCost`.

### 6.2 Continuing lineages — Mountain, Cave, Swamp

| Item | Slot | T2 pred. total | **T3 total** | Base | +1 | +2 | +3 | +4 | +5 |
|---|---|--:|--:|---|---|---|---|---|---|
| Avalanche Maul | weapon | 1,222 | **2,444** | b116 | b93 | b233 | b372 | b605 | b1,025 |
| Summit Aegis | armor | 1,114 | **2,228** | b116/r29 | b66/r17 | b166/r42 | b266/r67 | b434/r108 | b734/r183 |
| Bastion Heart | recovery | 468 | **936** | b100/r25 | b26/r6 | b65/r16 | b104/r26 | b169/r42 | b286/r71 |
| Peak Stride | mobility | 329 | **658** | b100 | b22 | b56 | b89 | b145 | b246 |
| Cataclysm Axe | weapon | 1,164 | **2,328** | r120 | r88 | r221 | r353 | r574 | r972 |
| Deepscale Hide | armor | 1,209 | **2,418** | r116/y29 | r73/y18 | r182/y45 | r291/y73 | r473/y118 | r800/y200 |
| Echo Geode | recovery | 503 | **1,006** | r100/g25 | r28/g7 | r70/g18 | r113/g28 | r183/g46 | r310/g78 |
| Echostep Treads | mobility | 333 | **666** | r100 | r23 | r57 | r91 | r147 | r248 |
| Plague Fang | weapon | 1,222 | **2,444** | p116 | p93 | p233 | p372 | p605 | p1,025 |
| Plaguebound Shroud | armor | 1,179 | **2,358** | p140 | p89 | p222 | p355 | p577 | p975 |
| Sorrow Eye | recovery | 494 | **988** | p100 | p36 | p89 | p142 | p231 | p390 |
| Mire Striders | mobility | 344 | **688** | p100 | p24 | p59 | p94 | p153 | p258 |

### 6.3 Continuing lineages — Jungle, Desert

| Item | Slot | T2 pred. total | **T3 total** | Base | +1 | +2 | +3 | +4 | +5 |
|---|---|--:|--:|---|---|---|---|---|---|
| Venomthorn Rapier | weapon | 1,045 | **2,090** | g120 | g79 | g197 | g315 | g512 | g867 |
| Wildgrowth Weave | armor | 1,035 | **2,070** | g90/y30 | g59/y19 | g146/y49 | g234/y78 | g380/y127 | g644/y214 |
| Worldvine Heart | recovery | 504 | **1,008** | g100 | g36 | g91 | g145 | g236 | g400 |
| Canopy Striders | mobility | 330 | **660** | g90 | g23 | g57 | g91 | g148 | g251 |
| Solar Falchion | weapon | 1,270 | **2,540** | y116 | y97 | y242 | y388 | y630 | y1,067 |
| Eternal Duneplate | armor | 1,260 | **2,520** | y120/p30 | y76/p19 | y190/p47 | y303/p76 | y493/p123 | y834/p209 |
| Oasis Heart | recovery | 655 | **1,310** | y100/p25 | y38/p9 | y95/p24 | y152/p38 | y246/p62 | y417/p104 |
| Mirage Striders | mobility | 432 | **864** | y90 | y31 | y77 | y124 | y201 | y341 |

### 6.4 Cross-biome handoffs and new items — Volcanic, Tundra

| Item | Slot | Anchor | **T3 total** | Base | +1 | +2 | +3 | +4 | +5 |
|---|---|---|--:|---|---|---|---|---|---|
| Emberforge Plate | armor | `plains-vest-t2` 960 × **2.2** | **2,112** | r120/y30 | r58/y20 | r146/y50 | r234/y80 | r380/y130 | r646/y218 |
| Magmaheart Stone | recovery | `plains-charm-t2` 500 × **2.2** | **1,100** | r75/y25 | r30/y10 | r75/y25 | r120/y40 | r195/y65 | r330/y110 |
| Cinderlash | weapon | new — T3 weapon band top | **2,540** | r140 | r96 | r240 | r384 | r624 | r1,056 |
| Magma Walkers | mobility | new — T3 boots band | **680** | r74 | r24 | r61 | r97 | r158 | r266 |
| Permafrost Maul | weapon | new — heavy-weapon band | **2,450** | b124 | b93 | b233 | b372 | b605 | b1,023 |
| Rimebrand | weapon | new — priced at parity with the other T3 DoT weapon (Plague Fang) | **2,444** | b120 | b93 | b232 | b372 | b604 | b1,023 |
| Glacial Bulwark | armor | new — T3 armor band | **2,200** | b100/r25 | b66/r17 | b166/r42 | b266/r66 | b432/r108 | b730/r182 |
| Frostward Charm | recovery | new — T3 charm band | **1,050** | b75/p25 | b28/p10 | b71/p24 | b114/p38 | b185/p62 | b314/p104 |
| Glacier Striders | mobility | new — T3 boots band | **670** | b80 | b24 | b59 | b94 | b153 | b260 |

**Justifications for the non-2.0× calls**, as required:
- *Emberforge Plate / Magmaheart Stone at 2.2×* — cross-biome handoff from the starter biome; see §6.1.
- *Cinderlash at 2,540* — the T3 signature flurry weapon in the biome that sits **last** in the locked T3 difficulty order (`docs/tier-balance-current-state.md:31`). Priced at the top of the T3 weapon band, equal to Solar Falchion, rather than the current 3,140 which stands 24% above every other T3 weapon with no stated reason.
- *Rimebrand at 2,444* — it is an **alternative** to Permafrost Maul, not an addition. Pricing it below the Maul would make the second weapon strictly the efficient pick; parity with the game's other T3 DoT weapon (Plague Fang, 2,444) is the neutral call.

### 6.5 Material corrections — before / after

Sorted by magnitude. "Before" figures were computed live from `RECIPE_DATABASE`; note two disagree with the audit's §4.2 prose (Mountain armor is 2,233 not 2,233→"1,676/557" summed inconsistently, and Jungle armor is 1,920 not 1,315+605 read as separate) — **source wins**.

| Item | Before | **After** | Δ | Why |
|---|--:|--:|--:|---|
| Glacier Striders (tundra boots) | 470 | **670** | **+43%** | badly under the T3 boots band (658–864) |
| Magma Walkers (volcanic boots) | 478 | **680** | **+42%** | same |
| Glacial Bulwark (tundra armor) | 1,545 | **2,200** | **+42%** | **the largest single defect** — the cheapest T3 armor by 20% against a band of 2,070–2,520 |
| Mirage Striders (desert boots) | 624 | **864** | **+38%** | Desert's T2 boots are the priciest (432); 2.0× carries through |
| Venomthorn Rapier (jungle wpn) | 1,650 | **2,090** | **+27%** | flattest curve in the game (1.50/1.33 ratios); Jungle was ~40% cheap overall |
| Cinderlash (volcanic wpn) | 3,140 | **2,540** | **−19%** | 24% above every other T3 weapon |
| Sorrow Eye (swamp charm) | 1,225 | **988** | **−19%** | part of the Swamp correction |
| Plaguebound Shroud (swamp armor) | 2,840 | **2,358** | **−17%** | most expensive T3 item, in a single colour, in the biome that is **first** by difficulty |
| Permafrost Maul (tundra wpn) | 2,914 | **2,450** | **−16%** | above the heavy-weapon band |
| Rimebrand (tundra wpn) | 2,820 | **2,444** | **−13%** | above the DoT-weapon parity point |
| Emberforge Plate (volcanic armor) | 2,400 | **2,112** | **−12%** | handoff anchor |
| Plague Fang (swamp wpn) | 2,714 | **2,444** | **−10%** | Swamp correction |
| Mountain armor / charm | 2,233 / 1,025 | **2,228 / 936** | ~flat / −9% | mostly reshape, not repricing |
| Desert armor / weapon | 2,400 / 2,336 | **2,520 / 2,540** | +5% / +9% | 2.0× on the priciest T2 kit |

Every other item moves by less than 10% and is primarily a **curve reshape**, not a repricing.

### 6.6 Kit totals — the Swamp-vs-Jungle disparity, resolved

| Biome | T2 kit (finalized) | T3 kit before | **T3 kit after** | T3/T2 |
|---|--:|--:|--:|--:|
| Mountain | 3,133 | 6,047 | **6,266** | 2.00× |
| Cave | 3,209 | 6,496 | **6,418** | 2.00× |
| Swamp | 3,239 | 7,284 | **6,478** | 2.00× |
| Jungle | 2,914 | 5,035 | **5,828** | 2.00× |
| Desert | 3,617 | 6,770 | **7,234** | 2.00× |
| Tundra (Maul route) | — | 6,154 | **6,370** | n/a |
| Volcanic | — | 7,243 | **6,432** | n/a |

**Swamp : Jungle was 1.45×; it becomes 1.11×.** Kit spread across all seven biomes tightens from 1.45× to **1.24×**, and every continuing biome lands on a clean 2.00× tier step. Desert becomes the most expensive kit — explainable and defensible, since its T2 kit already was.

Against the §14.3 income figure (~7,450 essence of the home colour per 6-level band), every kit now sits comfortably inside one band's yield, which was **inverted for Swamp** before this change.

---

## 7. Catalyst schedule

### 7.1 Proposed schedule (uniform, no exceptions)

| Step | Weapon / Armor | Recovery / Mobility |
|---|--:|--:|
| Base craft **or** evolution | **0** | **0** |
| +1 | 0 | 0 |
| +2 | 0 | 0 |
| +3 | 0 | 0 |
| +4 | **2** | 0 |
| +5 | **3** | **2** |
| **Per item** | **5** | **2** |
| Reconstruction | **3** | **3** |

**Per 4-slot kit: 14 catalysts**, up from T2's 8 and paid at optimization rather than at the door. This reverses the current T3 rule (3 on base craft, 0 on every upgrade — audit §9.1) and continues the T2 grammar one tier up: escalation, not inversion.

**Applies uniformly, including Volcanic.** The audit's D2 (Volcanic's four items charge zero catalysts anywhere, `volcanic.recipes.ts:9-77`, with no explanatory comment) is closed by this schedule, not preserved.

### 7.2 Family assignment — follows item identity, not biome

Existing family tags are preserved unchanged for all 25 items that carry one. The four Volcanic items need families assigned for the first time, and the rule is the repo's own ("family follows the item, not the biome" — `recipes/types.ts:44-49`):

| Volcanic item | Proposed family | Reason |
|---|---|---|
| Emberforge Plate | **alacrity** | inherits its parent `plains-vest-t2`'s tag verbatim (`plains.recipes.ts:155` — *"plating answers frequent light hits → Alacrity"*). Following the mechanic, not the biome, is the rule. |
| Magmaheart Stone | **alacrity** | same, inherits `plains-charm-t2`'s established family |
| Cinderlash | **swarming** | genuinely new item → Volcanic's native family |
| Magma Walkers | **swarming** | same |

Other deviations from the biome's native family are left exactly as authored and already carry comments: Cave's whole kit on `swarming` (native `dominion`), Rimebrand on `fortified` (native `heavy`).

### 7.3 Supply check against the new demand

Node counts from `NODE_BIOMES × NODE_MODIFIERS` in the T3 region (audit §9.3, re-confirmed): alacrity **4**, heavy **8**, swarming **8**, dominion **9**, fortified **8**.

| Family | Gear (new schedule) | Cores (unchanged, out of scope) | Stances (§9) | Rites (§9) | **T3 total** | was |
|---|--:|--:|--:|--:|--:|--:|
| heavy | mountain 14 + tundra 14 = 28 | 6 | 0 | 5 | **39** | 38 |
| fortified | swamp 14 + Rimebrand 5 = 19 | 2 | 2 | 2 | **25** | 26 |
| dominion | desert 14 | 6 | 2 | 5 | **27** | 33 |
| alacrity | jungle 14 + volcanic vest 5 + charm 2 = 21 | 5 | 2 | 0 | **28** | 22 |
| swarming | cave 14 + Cinderlash 5 + Magma Walkers 2 = 21 | 4 | 2 | 2 | **29** | 26 |

**No family is under-supplied.** Catalyst income at T3 is roughly 1–4 kills per unit (audit §9.5: `catalystWeight` defaults to the mob's `essence`, is *not* multiplied by `BIOME_ESSENCE_TIER_MULT`, and `CATALYST_PROGRESS_PER_UNIT` is a flat 100). The largest family demand, heavy at 39 units, is ~47 kills of Mountain trash against a kit bill of thousands of kills' worth of essence. The schedule is a **payment-timing shape, not a scarcity wall** — as intended.

**One family to watch (flagged, not blocking):** **alacrity** is the scarcest by node count (4 T3 nodes, banned in Mountain, Tundra and Desert) and this proposal raises its demand from 22 to 28 units. It stays comfortable because supply and demand are co-located: Jungle hosts 2 of the 4 alacrity nodes and Volcanic hosts a third, so both biomes that spend alacrity can farm it locally. If the designer prefers zero added alacrity pressure, the alternative is to tag Emberforge Plate and Magmaheart Stone `swarming` (Volcanic's native, 2 local nodes) — which would move alacrity to 21 and swarming to 36. I recommend against it: it breaks the family-follows-mechanic rule for no real supply gain.

**Core economy interaction (confirmation only, nothing changed):** the nine T3 Cores draw 2–3 catalysts each on their existing families (`Scout` heavy 3, `Catalyst` swarming 2, `Sniper` dominion 3, `Bruiser` alacrity 3, `Accelerant` alacrity 2, `Juggernaut` heavy 3, `Duelist` dominion 3, `Controller` fortified 2, `Arcanist` swarming 2). Total core demand is 23 units against a five-family supply that comfortably carries 148. **No family is contended into scarcity by gear + stance + rite demand**, so the Core economy is unaffected and stays out of scope, exactly as instructed.

---

## 8. Ability costs

### 8.1 What the four T3 abilities actually do (verified, `shared/src/abilityRecipes.ts:174-220`, `shared/src/abilities.ts`)

| Ability | Slot | Effect kind | Framing |
|---|---|---|---|
| Binding Strike | Technique | `root-strike` — arms the next attack to pin the target (`abilities.ts:669-677`) | **Counterplay tool.** Tundra is the hard-control biome; pinning is the symmetric answer. The recipe's own comment says so. |
| Break Free | Guard | `break-free` — removes the current hard control, optionally granting `controlResistPct` for `controlResistMs` (`abilities.ts:124-125, 140`) | **Required counterplay.** The only escape from hard control in the game. |
| Frenzy | Technique | attack-speed burst window (`ABILITY_FRENZY_EFFECT_ID`) | Broadly useful burst; optional. |
| Quick Strike | Technique | low-cooldown filler opening | Specialised; genuinely optional. |

The task's framing is **confirmed correct** on all four.

### 8.2 Proposed costs

Anchored on the finalized T2 band (Technique 70, Guard 90) at the same ~2.1× tier step the rest of this proposal uses. This pulls T3 off the legacy "roughly double per tier" ladder (`abilityRecipes.ts:41`) that T1 and T2 were each already pulled off.

| Ability | Biome / gate | Before | **After** | ×T2 | Rationale |
|---|---|--:|--:|--:|---|
| **Binding Strike** | Tundra L3, Technique | blue 650 | **blue 150** | 2.14× | ordinary/important counterplay Technique; must be affordable when Tundra first roots you |
| **Frenzy** | Volcanic L3, Technique | red 650 | **red 175** | 2.50× | broadly useful but optional; a small premium over the counterplay tool |
| **Break Free** | Tundra L5, Guard | blue 760 | **blue 190** | 2.11× | required counterplay, but a Guard and one tier's only escape — top of the Technique band, bottom of the strong-tool band |
| **Quick Strike** | Volcanic L5, Technique | red 760 | **red 210** | 3.00× | genuinely optional specialised filler; the priciest of the four |

All four land inside the task's bands (ordinary/important Technique 140–180; required/strong Guard or advanced tool 170–220). Relative ordering within each biome is preserved (L3 < L5). **No catalysts on abilities** (unchanged — none of the four has any). **No combat-effect, gate, tier or `recipeGroup` change.**

For scale, the correction is real: Break Free currently costs 760 blue against a Tundra boots track of 470 — it is priced as gear. At 190 it costs roughly one +2 upgrade step.

**Flagged, explicitly out of scope:** T4 abilities remain at 1,300 / 1,500 (`abilityRecipes.ts`), so this pass moves the cliff from T2→T3 to T3→T4 (210 → 1,300 = 6.2×). The T4 economy pass must fix it; the same is true of every other axis this proposal touches (§13).

---

## 9. Stance and Rite costs

### 9.1 Stances — catalysts only

The 1 → 5 jump is a scoping artefact: the T2 pass normalised every T2-accessible stance to exactly 1 catalyst (T2 ledger §9) and explicitly left T3/T4 out of scope. Essence grew 1.8× across the same step; catalysts grew 5×.

| Stance | Biome / gate | Essence (unchanged) | Catalyst before | **After** |
|---|---|---|--:|--:|
| Berserker | desert L11 | red 140 / purple 40 | dominion 5 | **dominion 2** |
| Predator | jungle L11 | green 130 / red 50 | alacrity 5 | **alacrity 2** |
| Brawler | volcanic L5 | yellow 130 / red 50 | swarming 5 | **swarming 2** |
| Execute | swamp L13 | purple 130 / red 50 | fortified 5 | **fortified 2** |

**No item-identity reason was found to deviate from 2 on any of the four** — all four already charge their biome's native family, all four sit at the same essence tier (180 combined), and none carries a comment claiming a premium. A uniform 2 is the honest reading: T2 = 1, T3 = 2. Essence, gates and mechanic identities untouched.

### 9.2 Rites — catalysts, plus one essence outlier

**RP costs are NOT redesigned.** Six Rites totalling 20 RP against a 19-RP budget at GM 114 is intended: limited RP forcing a build choice, and Rites competing with Rune rules for one pool (`shared/src/runicPoints.ts:10-12`, `docs/rites-current-state.md:8-20`). This proposal does not touch `RiteDef.runeCost`.

| Rite | Biome / gate | RP | Essence before | **Essence after** | Catalyst before | **After** |
|---|---|--:|---|---|--:|--:|
| Swift Repose | cave L15 | 2 | red 120 | red 120 *(unchanged)* | dominion 4 | **dominion 2** |
| Lingering Battle | mountain L15 | 2 | blue 130 / yellow 40 (**170**) | **blue 105 / yellow 35 (140)** | heavy 5 | **heavy 2** |
| Purification | swamp L15 | 3 | purple 120 / green 40 (160) | unchanged | fortified 4 | **fortified 2** |
| Blood Offering | volcanic L5 | 3 | red 130 / green 40 (170) | unchanged | swarming 5 | **swarming 2** |
| Mechanic Renewal | tundra L5 | 5 | blue 160 / yellow 60 (220) | unchanged | heavy 6 | **heavy 3** |
| Ability Reprieve | desert L11 | 5 | red 160 / purple 60 (220) | unchanged | dominion 6 | **dominion 3** |

Catalysts follow the decision-6 rule exactly: ordinary/low-mid-RP Rite → **2**, premium 5-RP Rite → **3**. All six keep their biome's native family (`riteRecipes.ts:20-24`).

**The one essence outlier, with its analysis:** Rite essence otherwise scales cleanly with RP (2 RP → 120, 3 RP → 160/170, 5 RP → 220/220). Lingering Battle breaks monotonicity — at **2 RP it costs 170**, *more* than Purification and equal to Blood Offering, both of which are **3 RP**. It is the only genuine inversion in the set. Dropping it to 140 (blue 105 / yellow 35, splash ratio preserved at 25%) restores a monotone ladder: 120, 140 | 160, 170 | 220, 220. No other Rite needs adjustment.

---

## 10. Hybrid essence normalization

### 10.1 Rules affirmed

Preserved as authored in `design_docs/economy-philosophy.md §4` and confirmed against live data:

- **Weapons and mobility stay pure.** Live: 8/8 weapons pure, 7/7 boots pure. This proposal keeps all 15 pure.
- **Armor and recovery/charm may be hybrid.** Live: 8 of 14 are.
- **Home essence dominant; splash colour = the colour of the mechanic the piece borrows.**
- **Target ~75/25 lifetime split; splash never above ~33%.**

### 10.2 SUPERSEDED RULE — "a retiring biome's colour moves wholesale with its mechanic"

`economy-philosophy.md §2` says *"when a biome retires, its colour is re-housed in whichever successor inherits its mechanic"*, and names `yellow = plating/utility (Plains → Desert)`. Live, the *plating mechanic* went to **Volcanic** (a red biome) while the *colour* went to **Desert**. The audit logged this as a contradiction (H4).

**This proposal explicitly supersedes that rule.** Under the hybrid-item model — which did not exist when the colour-follows-mechanic rule was written — Volcanic being **red** while paying a **yellow** splash for its Plains-derived plating/hardening and kill-chain-Recovery mechanics is not a defect. It is the hybrid model working exactly as intended: *the splash colour is the colour of the borrowed mechanic*, and Volcanic genuinely borrows two Plains mechanics. A biome's home colour follows the **biome**; a splash follows the **mechanic**. Both rules can hold at once, and §4 of the philosophy doc is the one that survives.

**Action:** amend `design_docs/economy-philosophy.md §2` to record the supersession, rather than "fixing" Volcanic's colour.

### 10.3 Normalized lifetime splits

The audit's finding was that splash drifts *upward* through the curve and never downward — every hybrid starts at 75–80% home on the base craft and ends at 67–79% home over its lifetime, with five items pinned at the 32–33% ceiling. The mechanism is the flat `+3 = +4 = +5` plateau repeating the +3 step's (splash-heavy) ratio three times. **§6's curve reshaping fixes this structurally**, and the per-step splits in §6.2–§6.4 were computed to land the lifetime ratio on target.

| Hybrid item | Base split | Lifetime split BEFORE | **Lifetime split AFTER** | Target | Status |
|---|---|---|---|---|---|
| Summit Aegis | 80/20 | 75.0 / 25.0 | **80.0 / 20.0** | 80/20 | ✔ |
| Bastion Heart | 80/20 | 68.3 / 31.7 | **80.1 / 19.9** | 80/20 | ✔ fixed (was drifting 12 pts) |
| Deepscale Hide | 80/20 | 75.3 / 24.7 | **80.0 / 20.0** | 80/20 | ✔ |
| Echo Geode | 80/20 | 78.4 / 21.6 | **79.9 / 20.1** | 80/20 | ✔ |
| Eternal Duneplate | 80/20 | 73.8 / 26.2 | **80.0 / 20.0** | 80/20 | ✔ |
| Oasis Heart | 80/20 | 79.1 / 20.9 | **80.0 / 20.0** | 80/20 | ✔ |
| Wildgrowth Weave | 75/25 | 68.5 / 31.5 | **75.0 / 25.0** | 75/25 | ✔ fixed |
| Emberforge Plate | 80/20 | 67.5 / 32.5 | **75.0 / 25.0** | 75/25 | ✔ fixed (was at ceiling) |
| Magmaheart Stone | 75/25 | 67.4 / 32.6 | **75.0 / 25.0** | 75/25 | ✔ fixed (was at ceiling) |
| Frostward Charm | 75/25 | 67.3 / 32.7 | **75.0 / 25.0** | 75/25 | ✔ fixed (was at ceiling) |
| Glacial Bulwark | 80/20 | 76.4 / 23.6 | **80.0 / 20.0** | 80/20 | ✔ |

**Every hybrid lands on target; no item is left needing a bespoke fix.** Splash tops out at 25%, well under the ~33% ceiling.

### 10.4 The three pure hybrid-eligible items — justified, not flattened

The audit flagged Plaguebound Shroud, Sorrow Eye and Worldvine Heart as the only pure items in hybrid-eligible slots, with no comment explaining it. Investigated: **all three are correct as pure**, and the reason should be written into the files rather than the items being hybridized.

- **Plaguebound Shroud** (swamp armor) — DoT resist + hit-to-DoT + debuff resist. Debuff-resist/cleanse is *itself* the purple identity (it is what Eternal Duneplate borrows purple **for**). A swamp item borrowing purple from swamp is not a hybrid.
- **Sorrow Eye** (swamp charm) — recovery pulse is swamp-native; nothing is borrowed.
- **Worldvine Heart** (jungle charm) — the ramping-Recovery foundation is the *Forest→Jungle* inheritance, and green already followed it (audit §6). The mechanic and the colour are now the same colour, so there is nothing to splash.

Forcing a splash onto these three would be exactly the "arbitrary cross-colour tax" the philosophy doc forbids. **P10.1 — add a one-line comment to each explaining the purity**, so the next audit doesn't re-raise it.

---

## 11. Data-integrity cleanup

### 11.1 Quest monster IDs (the real fix)

`shared/src/quests/questDatabase.ts` names monster IDs that do not exist in `MONSTER_DATABASE`. Verified live on 2026-08-30 — **14 dead IDs across three tiers**, not just T3's:

| Quest | Dead IDs | Count |
|---|---|--:|
| `tier-2` | `glacial-colossus` | 1 |
| `tier-3` | `elder-gnarled-greatbear`, `plains-warlord`, `lich-king` | 3 |
| `tier-4` | `glacial-titan`, `mountain-titan`, `elder-treant-lord`, `stampede-emperor`, `desert-eternal`, `jungle-ancient-lord`, `inferno-lord`, `undying-lord`, `cave-titan`, `swamp-sovereign` | 10 |

These no longer gate tier advancement (seals do, `questSystem.ts:35-45`) but the counters still drive **auto-combat target priority** and **HUD unlock gating** (`questSystem.ts:40-44`), so they are live-path dead weight. The two dead Plains/Forest T3 IDs are fossils of the pre-retirement roster.

**Proposed correction — each quest's list becomes exactly its tier's `bossPoolByTier` entries**, which is what the file's own header comment already claims it is (*"Boss list matches bossPoolByTier entries in biomeDatabase for that biomeTier"*). Canonical pools read live from `BIOME_DATABASE`:

| Quest | **Proposed `targetMonsterTypes`** | n | Seals required |
|---|---|--:|---|
| `tier-1` | `gnarled-greatbear`, `crag-behemoth`, `tusked-razorback`, `grave-toadeater`, `obsidian-broodmother` | 5 | 2 of 5 ✔ |
| `tier-2` | `apex-timberclaw`, `stoneplate-juggernaut`, `gorging-razortusk`, `mire-gorged-behemoth`, `chitinous-dreadbore`, `jungle-dread-gorger`, `dune-stalker-emperor` | 7 | 3 of 7 ✔ |
| `tier-3` | `frost-plated-rime-mammoth`, `crag-gorged-horn-behemoth`, `dune-carapace-monarch`, `apex-bramble-slasher`, `cinder-shell-magma-salamander`, `deep-core-burrow-gorger`, `rot-spore-croc-behemoth` | 7 | 4 of 7 ✔ |
| `tier-4` | `iron-crest-titan`, `verdant-crown-predator`, `glacial-patriarch`, `dune-throne-sovereign`, `caldera-sovereign`, `charnel-crown-sovereign`, `elder-trench-serpent` | 7 | 5 of 7 ✔ |

`tier-1` is already correct. After the fix each list's length matches `SEALS_REQUIRED_BY_TIER`'s denominator exactly (`shared/src/systems/tierAdvancement.ts:33`), which is a satisfying cross-check. **No quest progression is redesigned — `killsRequired`, `tierRequired`, names and descriptions are untouched.** Guarded by a regression test (§12.5).

### 11.2 Low-risk comment / doc cleanups

| # | Fix | Location |
|---|---|---|
| C1 | The canonical core-cast comment homes **Accelerant** under Forest; it lives in Jungle. Move it to the Jungle column. | `shared/src/data/recipes/plains.recipes.ts:239` vs `jungle.recipes.ts:273` |
| C2 | "+5 lands at full tier mastery (T1 @ GM 30, T2 @ 72, T3 @ **126**, T4 @ **198**)" — the T4 figure disagrees with live code even today (`maxGlobalMasteryAtTier(4) = 192`), and both T3 and T4 change under §1. Update to **T1 @ 30, T2 @ 72, T3 @ 114, T4 @ 156**. | `docs/system-rework-status.md:153` |
| C3 | Reword `tundra.recipes.ts:5-6` — "Tundra owns the FROST DoT weapon line (relocated from Swamp)" reads as an item relocation, but Swamp's poison DoT line is fully intact (§4). State that a *second DoT flavour* was homed in Tundra. | `shared/src/data/recipes/tundra.recipes.ts:5-6` |
| C4 | Record the colour-follows-mechanic supersession (§10.2). | `design_docs/economy-philosophy.md §2` |
| C5 | Add purity-rationale comments to the three pure hybrid-eligible items (§10.4). | `swamp.recipes.ts`, `jungle.recipes.ts` |

**Explicitly NOT proposed (decision 11):** `catalystBundle` is not restored. Its removal from `MonsterDefinition`, from all five T1 bosses, and from `rewards.ts` is treated as authoritative and final. Per-kill `catalystWeight` on modifier-bearing nodes remains the sole catalyst supply model. The surviving occurrences in `shared/dist/**/*.d.ts` are **stale build output and are not a source of design truth**; they will vanish on the next `pnpm build` and require no action.

---

## 12. Tests / invariants required

New file, mirroring the T2 pass's `server/test/t2ProgressionEconomy.test.ts`: **`server/test/t3ProgressionEconomy.test.ts`**, plus targeted additions to two existing suites. All are plain `tsx` scripts with a hand-rolled `assert`, per `CLAUDE.md`.

### 12.1 The retirement invariant (the bug class the audit found)

The load-bearing one. Both maps are derived from `NODE_BIOMES`, so this asserts the *derivation*, not a hand-copied table:

1. **`BIOME_FINAL_TIER_BY_GROUP[g]` equals the max `biomeTier` over `g`'s `normal`/`dungeon` nodes**, for every group.
2. **For every biome group and every player tier 1..MAX, `biomeLevelCap(t, g) > 0` implies the biome has at least one authored node at tier `min(t, finalTier)`.** *No biome may ever contribute mastery headroom for a tier it has no content at.* This is the direct guard against the GM-ceiling debt.
3. **`maxGlobalMasteryAtTier(t)` equals the sum of `biomeLevelCap(t, g)` over exactly the groups with authored nodes** — no phantom groups.
4. **Regression pins:** `maxGlobalMasteryAtTier` = 30 / 72 / 114 / 156 for tiers 1–4. (Replaces the 126/192 assertions in `shared/src/systems/itemUpgrades.test.ts:24-25`.)
5. **T1 and T2 gates are unmoved:** `globalMasteryRequiredForUpgrade(1, 1..5)` = 6/12/18/24/30 and `(2, 1..5)` = 38/47/55/64/72. This is the backward-compatibility guard.
6. **T3 gates:** `globalMasteryRequiredForUpgrade(3, 1..5)` = **80/89/97/106/114**.
7. **Reachability:** for every tier, `globalMasteryRequiredForUpgrade(t, 5) <= maxGlobalMasteryAtTier(t)` — i.e. **+5 is always attainable within the tier's own playable content.** Generic, and it is the assertion whose absence caused D1.

### 12.2 Save safety

8. A `TracksProgression` with a biome level **above** its new cap yields a `globalMastery` ≥ that level's contribution and an `upgradeCeilingFromGlobalMastery` of 5 — **no clamp, no regression** for legacy characters.
9. `applyBiomeXP` on an over-cap biome returns `xpGain: 0` and leaves `biomeLevel` **unchanged** (not lowered).

### 12.3 Gear economy

10. Every T3 gear item's upgrade curve is **strictly non-decreasing and strictly accelerating** (`+5 > +4 > +3 > +2 > +1`) — this alone kills the flat plateau.
11. **+4 and +5 together hold 65–75% of post-base spend** on all 29 items.
12. Every proposed lifetime total matches §6's table exactly (pins the 2.0× anchoring).
13. **Slot ordering per biome:** weapon and armor totals exceed recovery, which exceeds mobility.
14. **Hybrid rules:** all 8 weapons and all 7 mobility items are single-colour; every hybrid's lifetime home share is in **[0.73, 0.82]** and its splash never exceeds 0.33.
15. **Catalyst schedule:** base/evolve craft has no `catalystCost` on any of the 29 items; weapon/armor +1..+3 = 0, +4 = 2, +5 = 3; recovery/mobility +1..+4 = 0, +5 = 2; every reconstruct = 3.

### 12.4 Lineage

16. Exactly **22** T3 items carry `evolvesFrom`, matching §3's map by id, and `requiredPlusFor()` returns **5** for each.
17. The **7** genuinely-new T3 items carry no `evolvesFrom` and no `reconstructCost`.
18. Every `evolvesFrom` target **resolves** in `RECIPE_DATABASE`, is exactly one tier below, and occupies the **same slot**.
19. A +4 predecessor cannot evolve; a +5 one can (spot-checked on one continuing lineage and on the Plains→Volcanic handoff).
20. Every `reconstructCost` is within ±1 essence of 3.5× the base cost, per colour.

### 12.5 Abilities / stances / rites / quests

21. The four T3 ability costs and gates match §8; none carries a catalyst.
22. All four T3 stances charge exactly **2** catalysts of their biome's native family.
23. Rite catalysts are 2 for RP ≤ 3 and 3 for RP = 5; Rite essence totals are **monotone non-decreasing in RP cost**.
24. **`questMonsterIds.test.ts` (new, generic):** every `targetMonsterTypes` entry of every `QUEST_DATABASE` quest resolves in `MONSTER_DATABASE`, **and** each tier's list equals the union of `bossPoolByTier[tier]` across `BIOME_DATABASE`. This is the permanent guard against D3 recurring — it is deliberately written against the *databases*, not a hardcoded list.
25. `shared/src/data/recipeGates.test.ts` still passes with `RETIRED_BIOME_DEBT` **empty** (already verified as true under the new caps, §1.4).

---

## 13. T4 implications of the architecture

**The generic model transfers cleanly. No T4-specific addendum to the mastery architecture is needed.**

Under §1's change, T4's caps come out as: plains 12, forest 12, **cave 18, swamp 18** (both retire after T3 — `regionT4.ts:16` lists `mountain, tundra, jungle, desert, volcanic, graveyard, trench`), mountain 24, jungle 18, desert 18, tundra 12, volcanic 12, graveyard 6, trench 6 → **`maxGlobalMasteryAtTier(4) = 156`**, down from 192.

| | live today | **under §1** |
|---|--:|--:|
| max GM at T4 | 192 | **156** |
| T4 band | (126, 192], width 66 | **(114, 156], width 42** |
| T4 `+1..+5` gates | 139 / 152 / 166 / 179 / 192 | **122 / 131 / 139 / 148 / 156** |

Four points for the designer:

1. **T4's equivalent retired-biome problem is fixed automatically.** Today T4's ceiling counts 36 GM from Plains+Forest (no T3 *or* T4 nodes) and would count full T4 headroom for Cave and Swamp (no T4 nodes). All of that stops being demanded.
2. **No new grind is introduced.** Cave and Swamp contribute 18 each at T4 — levels the player already earned during T3. Retirement is clean.
3. **The band width becomes a uniform 42 GM for T2, T3 and T4**, which makes tier pacing consistent for the first time (it is 30/42/54/66 today).
4. **Verified: no T4 recipe is stranded.** The sweep in §1.4 covered tier-4 recipes too — zero over-cap, zero authored above a biome's final tier. Cave and Swamp have **no** tier-4 recipes at all, which is why `recipeGates.test.ts` was already green.

**T4's *economy* is not redesigned here** and inherits every discontinuity this pass creates on the T3→T4 seam: abilities (210 → 1,300), stance catalysts (2 → 7 on Recuperating), gear curve shape (T4 items were never checked for the plateau), and the absence of T3→T4 lineages. A T4 pass in this series' shape is the natural follow-up.

---

## 14. Exact implementation scope

A punch-list for a future implementation pass. **None of this has been done.**

### 14.1 Formulas — `shared/`

| File | Change |
|---|---|
| `shared/src/config/gameConfig.ts` | Add derived `BIOME_FINAL_TIER_BY_GROUP` (new IIFE beside `BIOME_START_TIER_BY_GROUP`, ~line 215). Modify `biomeLevelCap` (line 256) to clamp `playerTier` by the final tier. `maxGlobalMasteryAtTier` (line 302) needs **no** edit. |
| `shared/src/systems/itemUpgrades.ts` | **No code change.** `globalMasteryRequiredForUpgrade` composes over `maxGlobalMasteryAtTier`. Update the doc-comment at lines 19-24 with the new T3/T4 examples. |

### 14.2 Recipe data — `shared/src/data/recipes/`

All seven T3 biome files. Per file, per item: rewrite `cost` and each `upgrades[].cost` per §6; set `catalystCost` per §7 (removing every base-craft `catalystCost` on the 25 items that have one, adding `+4`/`+5` entries); add `evolvesFrom` and `reconstructCost` per §3/§5 where applicable.

- `mountain.recipes.ts` — 4 items, all gain lineage
- `cave.recipes.ts` — 4 items, all gain lineage
- `swamp.recipes.ts` — 4 items, all gain lineage; +C5 comment
- `jungle.recipes.ts` — 4 items, all gain lineage; +C5 comment
- `desert.recipes.ts` — 4 items, all gain lineage
- `volcanic.recipes.ts` — 4 items; 2 gain **cross-biome** lineage + first-ever catalyst families; 2 new-item repricings
- `tundra.recipes.ts` — 5 items, all repriced, none gains lineage; +C3 comment
- `plains.recipes.ts` — **comment only** (C1). No cost change.
- `forest.recipes.ts` — **untouched.**

`shared/src/data/recipes/types.ts` — untouched, **unless** the designer resolves §5.3 in favour of multi-parent evolution, in which case `evolvesFrom` becomes `evolvesFromAny?: string[]` and `shared/src/systems/evolution.ts` + `server/src/systems/player/economy/itemEvolution.ts` + `client/src/ui/crafting/MakeTab.tsx` all need matching work.

### 14.3 Other data — `shared/`

| File | Change |
|---|---|
| `shared/src/abilityRecipes.ts` | 4 cost values (lines ~185, 197, 207, 217). Also correct the stale "roughly double per tier" rule statement at line 41. |
| `shared/src/stanceRecipes.ts` | `catalystCost` on the 4 tier-3 stances (lines 41-49). T4 Recuperating untouched. |
| `shared/src/riteRecipes.ts` | `catalystCost` on all 6; `cost` on Lingering Battle only. |
| `shared/src/quests/questDatabase.ts` | `targetMonsterTypes` on `tier-2`, `tier-3`, `tier-4` per §11.1. |
| `shared/src/runeRecipes.ts` | **UNTOUCHED — see §7 of the decision list: zero T3 Rune recipes is intentional, not a bug.** T3's RP layer is Rites. No new Rune content is designed by this proposal. |

### 14.4 Client — presentation only

| File | Change |
|---|---|
| `client/src/hud/BiomeXpBar.tsx:18` | display denominator `Math.max(cap, currentLevel)` |
| `client/src/ui/map/NodeInfo.tsx:289` | same |
| `client/src/ui/MasteryPanel.tsx:241` | same |

`client/src/ui/QuestPanel.tsx:214` reads `maxGlobalMasteryAtTier` and follows automatically.

### 14.5 Server / bench — no logic changes expected

- `server/src/systems/player/economy/itemUpgrade.ts` — no change (passes live GM into the generic `checkUpgrade`).
- `server/src/systems/player/economy/crafting.ts`, `itemEvolution.ts` — no change; already fully generic over `evolvesFrom`/`reconstructCost` (proved by the T2 pass absorbing 19 lineages with zero code changes).
- `server/src/systems/player/progression/rewards.ts` — no change; the new cap flows through `biomeLevelCap` at line 107.
- `server/bench/balance/botFactory.ts:73` — no change; `canonicalBiomeLevels` calls `biomeLevelCap`, so the canonical T3 bot **automatically drops from GM 126 to GM 114**. Worth re-running `pnpm bench:balance` afterwards, since every balance baseline shifts. ⚠ `server/bench/` and `tools/` are outside `tsconfig` and are not typechecked by CI — check them by hand.
- `tools/mob-report.ts:625-626` — reads `maxGlobalMasteryAtTier` for its GM band display; follows automatically, verify output.

### 14.6 Tests

| File | Change |
|---|---|
| `server/test/t3ProgressionEconomy.test.ts` | **NEW** — §12.1–§12.4 |
| `server/test/questMonsterIds.test.ts` | **NEW** — §12.5 item 24 |
| `shared/src/systems/itemUpgrades.test.ts:24-25` | update the 126/192 pins to **114/156** |
| `server/test/coreAuthoring.test.ts`, `server/test/relics.test.ts` | call `biomeLevelCap`; re-run — expected green, since no recipe is over-cap (§1.4), but verify |
| `shared/src/data/recipeGates.test.ts` | no change expected; `RETIRED_BIOME_DEBT` must stay empty |
| `server/test/catalystRekey.test.ts` | **check for stale assertions** — this suite broke on the T2 pass for exactly this reason (T2 ledger §11) |
| Full suite | `pnpm typecheck` + `node scripts/run-tests.mjs` as the pre-commit gate |

### 14.7 Docs

`docs/system-rework-status.md:153` (C2), `design_docs/economy-philosophy.md §2` (C4), `docs/global-mastery-current-state.md` (already fully stale — a rewrite is overdue and this change makes it more so), and a `T3_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-XX-XX.md` ledger + `docs/README.md` index row when the pass ships.

### 14.8 Deliberately out of scope

- **Core economy** — no core cost, family, availability or lineage change. Confirmed in §7.3 that the proposed gear/stance/rite schedule does not contend with Core catalyst families.
- **T3 Runes** — none authored (§7 of the decisions; §14.3).
- **T4 economy** — implications only (§13).
- **Combat stats and mechanics** — nothing outside `cost` / `catalystCost` / GM gates is touched anywhere in this proposal.
- **Boss catalyst bundles** — not restored (§11.2).
- **Canonical bot routes** — *route authoring for T2 and T3 is a later validation-infrastructure task that should follow this economy architecture actually being implemented, so the routes measure the shipped numbers rather than the current ones.*

---

## 15. Open items requiring designer input

1. **[BLOCKER] Multi-parent evolution.** `evolvesFrom` is a single string and cannot express `jungle-venomthorn-rapier` inheriting from **both** `jungle-stinger-rapier` and the Forest `gale-needle`/`thorn-needle` branch. Recommendation: name the Jungle parent and let the Forest needles dead-end. Overriding that requires a schema + code change across `types.ts`, `evolution.ts`, `itemEvolution.ts` and `MakeTab.tsx`. **The rest of the proposal is data-only and does not depend on the answer.** (§5.3)
2. **[Design call, not a blocker] Plains' kill-momentum boots have no heir.** `mobility.kill-speed-pct` genuinely stops at T2; Volcanic's boots run a different mechanic. Re-housing it would be a combat-mechanic change and is outside this proposal's authority. Confirm the dead-end, or open a separate mechanic task. (§4)
3. **[Confirm] The two non-2.0× anchors** — Volcanic's armor and charm at 2.2× off a starter-biome predecessor (§6.1), and Cinderlash priced at the T3 weapon band top rather than derived from a predecessor it does not have (§6.4).
4. **[Confirm] Alacrity family for Volcanic's two Plains-derived items** (§7.2) — mechanically correct under the family-follows-the-item rule, and it raises alacrity demand 22 → 28 units against the scarcest family by node count. Supply is comfortable and co-located; the alternative (tag them `swarming`) is stated for comparison.
5. **[Note only] Rite RP costs are untouched by design.** All six Rites remain 20 RP against a 19-RP budget at GM 114. This is decision 6's intent — limited RP forcing a build choice — recorded here so it is not mistaken for an oversight. (§9.2)
