# T4 Progression Economy — Implementation Ledger

**Date:** 2026-08-30
**Status:** IMPLEMENTED. This is the "what actually shipped" record; treat it as
authoritative over `T4_PROGRESSION_ECONOMY_PROPOSAL_2026-08-30.md` and
`T4_PROGRESSION_ECONOMY_BASELINE_2026-08-30.md` on any figure the three disagree on.
**Implements:** the approved T4 progression/economy proposal exactly as specified —
no numbers were redesigned during implementation; two transcription corrections were
made and are documented in §8 below.

This pass is economy-only. No combat stat, `attacksPerSecond`, `mechanicEffects`
value, monster/boss HP/attack/plating, biome XP curve, RP formula, or Core mechanic
was touched anywhere.

---

## 1. Files Changed

**Recipe data — `shared/src/data/recipes/`** (all 39 T4 gear items repriced; 36
gained lineage)
- `mountain.recipes.ts` — Earthsunder Maul, Warmaul, Titan's Keep, Stormwall Plate,
  Fortress Heart, Shieldmend Ward, Vanguard Stride (all 7 T4 items).
- `jungle.recipes.ts` — Deathfang Rapier, Primal Canopy, Ancient Canopy, Overgrowth
  Pulse, Warpath Treads (all 5 T4 items).
- `desert.recipes.ts` — Zenith Falchion, Deathless Duneplate, Last Oasis, Simoom
  Striders (all 4 T4 items; new `catalystCost` fields — Desert previously charged 0
  T4 catalysts anywhere).
- `tundra.recipes.ts` — Glacial Tyrant Maul, Glacial Rimebrand, Permafrost Sovereign,
  Glacial Ward, Deepfreeze Ward, Avalanche Striders (all 6 T4 items); resolved the
  Glacial Rimebrand comment contradiction.
- `volcanic.recipes.ts` — Eruption Lash, Cinderbrand, Pyroclasm Mantle,
  Lava-Tempered Hide, Inferno Heart, Pyroclast Treads (all 6 T4 items; new
  `catalystCost` fields).
- `graveyard.recipes.ts` — Plague Axe, Plaguebound Mantle, Grave Ward, Necrotic
  Pulse, Grave-Tide Pulse, Gravewalker Boots (all 6 T4 items; new `catalystCost`
  fields; replaced the stale "only boots authored" header; resolved the axe
  "VERIFY in budget pass" comment).
- `trench.recipes.ts` — Abyssal Axe, Deep Sea Carapace, Pressure Vessel, Abyssal
  Stalkers, Abyssal Treaders (all 5 T4 items; new `catalystCost` fields; replaced the
  copy-pasted "Graveyard (T4)" header; resolved the axe "VERIFY" comment).
- `cave.recipes.ts`, `swamp.recipes.ts` — **no change.** Predecessors are read, not
  edited; both retire at T3 and stay exactly as the T3 pass left them.
- `types.ts` — **no change.** Single-string `evolvesFrom` was sufficient; no
  multi-parent schema was introduced (Cataclysm Axe's two children each carry their
  own single `evolvesFrom: 'cave-cataclysm-axe'`, not a shared array field).

**Abilities / Stances — `shared/`**
- `shared/src/abilityRecipes.ts` — repriced Disengage/Snipe/Recuperate/Stunning
  Strike; replaced the stale "T4 has NOT yet been repriced" comment.
- `shared/src/stanceRecipes.ts` — Recuperating Stance's `catalystCost` only (7 → 3).

**No change** — `shared/src/runeRecipes.ts`, `shared/src/riteRecipes.ts`, any Core
recipe file, `shared/src/quests/questDatabase.ts`, any relic recipe entry.

**Monster data — `shared/src/data/monsters/`**
- `trench.monsters.ts` — 3 `rewards.essenceType` edits: `hadal-stalker`,
  `abyssal-serpent`, `elder-leviathan` (all blue → green). Quantities/XP/HP untouched.
- `bossesT4.ts` — 1 `rewards.essenceType` edit: `elder-trench-serpent` (purple →
  green). `elder-trench-serpent-warden` explicitly left untouched (still purple).

**Tests**
- `server/test/t4ProgressionEconomy.test.ts` — **new**, see §11.
- `server/test/t3ProgressionEconomy.test.ts` — one stale pin updated: the T3 pass's
  regression guard asserted Recuperating Stance's catalyst stayed at the pre-T4-pass
  value of 7 ("explicitly out of scope for the T3 pass"). That guard now pins the new
  authoritative value (3) and points at this ledger and the new T4 test as the source
  of truth going forward. This is the only test-suite change needed anywhere in the
  114-file suite; no other existing test referenced a T4 economy figure.

**Docs**
- `docs/gear-evolution-current-state.md` — added a note that T4 gear gained real
  lineage on this date (36/39, 26 predecessors, 10 branch groups), closing the
  omission the baseline flagged.
- `docs/briefs/T4_PROGRESSION_ECONOMY_BASELINE_2026-08-30.md` — corrected two
  remaining stale "~24 excess GM" mentions in §22/§24 to the accurate 36 (its own
  §19 had already corrected the main figure; these two summary-table references were
  missed in that pass).
- `docs/README.md` — indexed this ledger, following the T3 entry's format.
- `design_docs/economy-philosophy.md` — **deliberately not edited**, per T3
  precedent (historical archaeology).

No server crafting/evolution logic changed. `crafting.ts`, `itemEvolution.ts`, and
`itemUpgrade.ts` are fully generic over recipe data — the T2/T3 architecture absorbed
36 new T4 lineages with **zero code changes**.

---

## 2. Final 39-Item Census

| Biome | Items | With lineage | Genuinely new |
|---|--:|--:|--:|
| Mountain | 7 | 7 | 0 |
| Jungle | 5 | 5 | 0 |
| Desert | 4 | 4 | 0 |
| Tundra | 6 | 6 | 0 |
| Volcanic | 6 | 6 | 0 |
| Graveyard | 6 | 5 | 1 (Gravewalker Boots) |
| Trench | 5 | 3 | 2 (Pressure Vessel, Abyssal Treaders) |
| **Total** | **39** | **36** | **3** |

The 3 genuinely-new items (no `evolvesFrom`, no reconstruction, plain base craft):
Gravewalker Boots (Graveyard mobility, `mobility.kill-stack-speed-pct`/
`-tenacity-pct` — matches neither Cave's stealth line nor Swamp's slow-resistance
line), Pressure Vessel (Trench recovery, blends Cave's `defense.absorb-pct` and
Swamp's `defense.recovery-pulse-pct` with neither dominant — the tie-break rule's
explicit "ambiguous blend becomes new" case), Abyssal Treaders (Trench mobility,
`mobility.tenacity-pct` — the item's own pre-existing comment already self-identifies
as distinct from Graveyard's kill-stack tenacity).

---

## 3. 36 Successors / 26 Predecessors

Exactly 26 distinct T3 (or Cave/Swamp) predecessor ids anchor the 36 lineaged
successors. 10 of those 26 predecessors branch into 2 children each (20 successors);
the remaining 16 predecessors map 1:1.

### 10 branch groups

Seven continuing-biome groups:

| Parent (T3, +5) | → T4 children |
|---|---|
| Avalanche Maul | Earthsunder Maul, Warmaul |
| Summit Aegis (`mountain-vest-t3`) | Titan's Keep, Stormwall Plate |
| Bastion Heart (`mountain-charm-t3`) | Fortress Heart, Shieldmend Ward |
| Worldvine Heart (`jungle-charm-t3`) | Ancient Canopy, Overgrowth Pulse |
| Frostward Charm (`tundra-charm-t3`) | Glacial Ward, Deepfreeze Ward |
| Cinderlash | Eruption Lash, Cinderbrand |
| Emberforge Plate (`volcanic-vest-t3`) | Pyroclasm Mantle, Lava-Tempered Hide |

Three retired-biome handoff groups:

| Parent (Cave/Swamp, T3, +5) | → T4 children |
|---|---|
| Cataclysm Axe (Cave) | Plague Axe (Graveyard), Abyssal Axe (Trench) — spans two biomes |
| Plaguebound Shroud (`swamp-vest-t3`) | Plaguebound Mantle, Grave Ward (both Graveyard) |
| Sorrow Eye (`swamp-charm-t3`) | Necrotic Pulse, Grave-Tide Pulse (both Graveyard) |

### 16 direct 1:1 lineages

Peak Stride→Vanguard Stride, Venomthorn Rapier→Deathfang Rapier, Wildgrowth
Weave→Primal Canopy, Canopy Striders→Warpath Treads, Solar Falchion→Zenith Falchion,
Eternal Duneplate→Deathless Duneplate, Oasis Heart→Last Oasis, Mirage
Striders→Simoom Striders, Permafrost Maul→Glacial Tyrant Maul, Rimebrand→Glacial
Rimebrand, Glacial Bulwark→Permafrost Sovereign, Glacier Striders→Avalanche
Striders, Magmaheart Stone→Inferno Heart, Magma Walkers→Pyroclast Treads (14
continuing-biome), plus the 2 Cave/Swamp→Trench handoffs: Deepscale Hide (Cave)→Deep
Sea Carapace, Echostep Treads (Cave)→Abyssal Stalkers.

14 + 2 = 16 direct, + 20 branch-children = 36. 14 (direct) + 7×2 (continuing
branches) + 3×2 (handoff branches, excluding the axe's cross-biome spread already
counted) = matches the proposal's 14+14+8 grouping exactly (14 direct, 14 branch
from the 7 continuing groups, 8 handoff items from the 3 handoff groups: 2+2+2+2 =
8, i.e. Plague/Abyssal Axe (2) + Deep Sea Carapace (1) + Abyssal Stalkers (1) +
Plaguebound Mantle/Grave Ward (2) + Necrotic Pulse/Grave-Tide Pulse (2) = 8).

Tundra's two weapons (Permafrost Maul→Glacial Tyrant Maul, Rimebrand→Glacial
Rimebrand) were investigated as a possible branch and rejected — they are
mechanically distinct T3 items (brittle-stack vs frost-DoT) with distinct T4 heirs,
not one parent with two children.

### 3 Cave/Swamp T3 dead ends (no T4 continuation)

Echo Geode (Cave recovery — its `defense.absorb-pct` identity is only half of
Pressure Vessel's blend), Plague Fang (Swamp weapon — both T4 axes inherit Cave's
identity, not Swamp's), Mire Striders (Swamp mobility — neither Trench boots item
continues Swamp's `mobility.slow-resistance`).

---

## 4. Cost, Curve, and Catalyst Corrections

Every one of the 39 items now follows the shipped 4/10/16/26/44% post-base-spend
curve with +4/+5 landing in [65%, 75%] (test-verified per item, not just in
aggregate). Every one of the 36 lineaged items lands at a lifetime ratio in [1.8,
2.2] against its finalized predecessor (test-verified).

**Largest corrections** (examples; before = live pre-pass total, after = shipped
total):

| Item(s) | Before | After | Δ |
|---|--:|--:|--:|
| Gravewalker Boots / Abyssal Stalkers / Abyssal Treaders | 596 | 1,332 | +124% |
| Deep Sea Carapace | 2,920 | 4,836 | +66% |
| Plaguebound Mantle / Grave Ward | 2,920 | 4,716 | +62% |
| Vanguard Stride | 851 | 1,316 | +55% |
| Deathfang Rapier | 6,204 | 4,180 | −33% |
| Eruption Lash | 7,238 | 5,080 | −30% |
| Plague Axe / Abyssal Axe | 6,345 | 4,656 | −27% |
| Cinderbrand | 6,815 | 5,080 | −25% |

**Catalyst schedule (all 39 items, verified programmatically):**

| Step | Weapon / Armor | Recovery / Mobility |
|---|--:|--:|
| Base craft or evolution | 0 | 0 |
| +1 / +2 / +3 | 0 | 0 |
| +4 | 3 | 0 |
| +5 | 4 | 3 |
| Reconstruction (36 lineaged items only) | 4 | 4 |

Desert, Volcanic, Graveyard, and Trench previously charged 0 T4 catalysts anywhere
(4-of-7 biomes); Mountain/Jungle/Tundra previously charged a flat 4 on the base
craft only. All 7 biomes now share the one schedule above.

**Catalyst families** (native unless noted):

- Mountain → heavy (native), Jungle → alacrity (native), Tundra → heavy (native,
  except Rimebrand line → fortified, inherited verbatim from Rimebrand's own T3
  family), Desert → dominion (native, **newly assigned** — Desert charged 0
  catalysts anywhere before this pass).
- Volcanic weapon + boots → swarming (inherited from Cinderlash/Magma Walkers'
  native family); Volcanic armor + charm → alacrity (inherited from Emberforge
  Plate/Magmaheart Stone's own T3 family, itself inherited from their Plains
  ancestors) — deliberately **not** Volcanic's native swarming.
- Graveyard weapon + boots → swarming (axe inherits Cave; boots use Graveyard's own
  native family, which is also swarming); Graveyard armor + recovery → fortified
  (inherited from Plaguebound Shroud/Sorrow Eye's Swamp family) — deliberately
  **not** Graveyard's native swarming.
- Trench weapon + armor + stealth-boots → swarming (inherited from Cataclysm
  Axe/Deepscale Hide/Echostep Treads' Cave family) — deliberately **not** Trench's
  native dominion; Trench's two genuinely-new items (Pressure Vessel, Abyssal
  Treaders) → dominion (native, no inherited identity to carry).

Every assigned family was verified against `MODIFIER_BANS`/`NATIVE_MODIFIER` to
confirm it is not banned in that biome (Mountain bans alacrity, Jungle bans heavy,
Desert bans alacrity, Tundra bans alacrity; Volcanic/Graveyard/Trench ban nothing).
**No contradiction was discovered** — every family the proposal assigned has a legal
T4 node presence in its biome; no substitution was needed.

**Hybrid essence** (9 hybrid armor/recovery items; all weapons and all mobility
items remain single-colour, test-verified): home/splash ratios held constant through
every upgrade step (fixing the drift the baseline found reintroduced by the old
flat-plateau curve), splash ≤33% at every step, matching the proposal's §10 table
exactly (80/20 for most hybrids, 88/12 for Mountain's and Tundra's Heavy-family
charms).

---

## 5. Abilities

| Ability | Gate | Old | New |
|---|---|--:|--:|
| Disengage | trench L3 | green 1,300 | **green 300** |
| Snipe | graveyard L3 | purple 1,300 | **purple 320** |
| Recuperate | trench L5 | green 1,500 | **green 380** |
| Stunning Strike | graveyard L5 | purple 1,500 | **purple 420** |

No catalyst, gate, tier, or effect change on any of the four. The file's stale "T4
has NOT yet been repriced" comment is replaced.

---

## 6. Recuperating Stance

Catalyst `alacrity: 7` → `alacrity: 3`. Essence (`green 220 / blue 100`) and gate
(jungle L17) unchanged. Matches the T3-established "premium stance/rite" ceiling.

---

## 7. Trench Essence Correction

`hadal-stalker`, `abyssal-serpent`, `elder-leviathan` (`trench.monsters.ts`) and
`elder-trench-serpent` (`bossesT4.ts`) all move to `essenceType: 'green'`, matching
Trench's own gear home colour. Quantities, XP, HP, elite status, and density are
byte-for-byte unchanged (test-verified against a pre-pass snapshot). The
soft-discarded `elder-trench-serpent-warden` (Void Overlord staged encounter, not
part of the active T4 boss pool) is explicitly asserted to remain `purple` —
regression guard against an over-broad find/replace.

---

## 8. Discovered Corrections During Implementation

Two small transcription notes, neither changing any approved number, both
documented per the task's "recompute only if a transcription error is found" rule:

1. **Rimebrand comment resolution.** `tundra.recipes.ts`'s T4 Glacial Rimebrand item
   comment previously read "⚠ INHERITED (Swamp slow-DoT lineage)... not scaled from
   a T3 ancestor," directly contradicting the file's own header (Rimebrand is a
   genuinely new T3 frost-DoT line, no Swamp predecessor). The comment is replaced
   and the item now carries a real `evolvesFrom: 'tundra-rimebrand'` — the economy
   fix and the documentation fix are the same edit.
2. **Axe "VERIFY in budget pass" comments (Graveyard/Trench).** Resolved to state
   precisely that the *economy* (lineage, cost, catalyst) is now normalized by this
   pass, while explicitly **not** claiming the base `attack` combat stat was
   revalidated — that remains a separate, future balance question, per the task's
   scope boundary.

No numeric proposal figure required correction; every cost table in §7 of the
proposal was implemented verbatim (arithmetic re-verified during test-writing, not
just transcribed).

---

## 9. Relics / Runes / Rites / Cores — Confirmed Unchanged

- **8 relics**, full snapshot equality on essence/catalyst/gate/family for every
  one, pinned by `t4ProgressionEconomy.test.ts` §12. No relic gained `evolvesFrom`
  or `reconstructCost`. The test does **not** assert "catalyst family == biome
  native family" (false for at least Haunted Prism, `fortified` in a
  `swarming`-native Graveyard) — it pins the exact known-good value per relic
  instead.
- **1 T4 rune** (`rune-recipe-focus-elites`), gate/cost pinned unchanged.
- **0 T4 rites** (still zero; 6 tier-3 rites, unchanged count).
- **12 Core recipes total, all tier ≤ 3** (no T4 Core exists; unchanged).

---

## 10. Grandfathered GM (Unchanged Behaviour)

Mastery architecture is completely untouched by this pass: `biomeLevelCap`,
`maxGlobalMasteryAtTier`, `globalMasteryRequiredForUpgrade`, and the T4 gates
122/131/139/148/156 are all pinned unchanged and verified by the new test (§11).
Grandfathered legacy GM remains unclamped by design: a save that leveled the four
retired biomes (Plains/Forest/Cave/Swamp) past their current caps under the old
formula can carry up to **36 excess GM** above what a fresh T4 character can reach
((12→24)+(12→24)+(18→24)+(18→24) headroom from the pre-T3-fix caps), for a legacy
ceiling of **192 GM** — exactly the game's old pre-fix maximum. This arithmetic was
independently re-verified during this pass (36, not the baseline draft's original
24) and two stale "~24" mentions were corrected in the baseline doc itself (§1).

---

## 11. Tests

`server/test/t4ProgressionEconomy.test.ts` (new, 14 sections): census (39/36/3),
predecessor set (26 distinct, real, T3, slot-matched), branch integrity (10 groups
of exactly 2 children, Cataclysm Axe spanning Graveyard/Trench, no multi-parent
field), lifetime ratio ([1.8, 2.2] for all 36), curve shape (no +3=+4=+5 plateau,
strictly non-decreasing, +4/+5 share in [65%, 75%] for all 39), catalyst schedule
(exact per-slot-type schedule + reconstruction=4 for all 39), catalyst family
validity (exact assignment + not-banned check for all 39), hybrid essence (splash
≤33% at every step, weapons/mobility pure), ability costs (exact 300/320/380/420,
no catalysts, gates unchanged), Recuperating Stance (catalyst=3, essence/gate
unchanged), Trench essence correction (3 monsters + boss green, warden untouched,
quantities/XP/HP unchanged), relics (8, full snapshot), no-regression (rune/rite/
core counts and fields, GM architecture constants), reachability (every T4 recipe's
gate within its biome's T4 cap).

One existing test needed an update: `server/test/t3ProgressionEconomy.test.ts` had
pinned Recuperating Stance's catalyst at 7 as "explicitly out of scope for the T3
pass" — that pin now tracks the new value (3) and defers to this ledger's test as
the authoritative source going forward.

---

## 12. Validation Results

1. `pnpm typecheck` — **clean**, no errors.
2. `server/test/t4ProgressionEconomy.test.ts` — **ok** (all assertions pass).
3. Plausibly-touched existing tests run individually — `recipeGates.test.ts`,
   `relics.test.ts`, `rites.test.ts`, `catalystRekey.test.ts`,
   `t2ProgressionEconomy.test.ts`, `t3ProgressionEconomy.test.ts` (after the one pin
   update above) — **all pass**.
4. Full `pnpm test` — **114/114 passed**, no pre-existing failures encountered or
   masked.

No progression bot was run and no canonical route was authored, per scope.

---

## 13. Runtime Pacing Hypotheses (Deferred)

Restated from the proposal, unchanged by implementation — these require a canonical
T4 bot route to answer, not authored here:

- **H1 — Pacing.** Whether biome mastery (GM 156) completes before full economic
  optimization (every T4 item at +5) is a live question this static pass cannot
  answer; needs real kill-rate/route data across all 7 active T4 biomes.
- **H2 — Expected bench/bot deltas.** Any T4 canonical bot or bench number that
  shifts solely because of the repriced costs, the new catalyst schedule, or the
  corrected Trench essence colour is the economy becoming internally consistent —
  not a regression requiring combat compensation.
- **H3 — Graveyard's tight catalyst margin.** Graveyard's trash tier is the
  weakest in the game by design; the proposal's supply check (§12) shows a full
  weapon/armor catalyst bill still clears in under 30 kills, but Graveyard is the
  first biome worth re-checking if a future runtime pass finds T4 catalyst pacing
  uneven.
- **H4 — Cross-family catalyst assignments** (Volcanic armor/recovery on alacrity,
  Graveyard armor/recovery on fortified, Trench weapon/armor/boots on swarming)
  trade "farm it where you stand" convenience for mechanical-identity honesty — an
  accepted design trade-off per the proposal, not a defect.
- **H5 — Ability repricing assumption.** 300/320/380/420 assumes Graveyard's
  dense-trash and Trench's elite-only supply shapes are intentional, not
  placeholders; if either biome's density/per-kill essence changes later, the
  kill-count sanity check behind these prices should be recomputed.

No unresolved blocker or contradiction requiring a follow-up designer decision was
found during implementation — every family assignment the proposal specified had a
legal T4 node, and no proposal number required a value change (only the two
comment-only corrections in §8).
