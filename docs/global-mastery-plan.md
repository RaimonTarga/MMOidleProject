# Steps 3 + 4 — Implementation Plan

Paired with `docs/global-mastery-current-state.md`. Builds **Step 3 (biome-levels-per-tier 4→6
expansion; recipe system otherwise kept as-is)** and **Step 4 (Global Mastery)** in one session,
because GM derives from the biome-level track Step 3 reshapes — defining GM against the final
6-level scale avoids a redefinition later.

**Decisions locked (2026-06-23 Q&A with user):**
- Step 3 = **expand `BIOME_LEVELS_PER_TIER` 4 → 6** now (not just confirm the base).
- Upgrade-cap GM ceiling = **build the seam, non-regressive** — wire `min(structural, gmCeiling)`
  with a placeholder GM curve generous enough that no current +3 item regresses; Step 6 tunes the
  numbers when +5 lands.
- RP GM-curve = **non-regressive placeholder** — RP at equivalent progression ≥ today's, so no
  equipped loadout is re-sanitized/trimmed. User retunes the exact curve in the balance pass.
- Division of labor (established): **Claude builds structure + placeholders; the user tunes all
  numbers** (RP curve, GM upgrade ceiling, XP curve for the stretched segments, new L5/L6 reward
  content, recipe re-tuning).

> ⚠️ **Consequence to keep visible:** the two new levels per tier segment (L5, L6) unlock things that
> **do not exist yet** (biome skills = Step 7, biome runes = Step 5, cores = Step 9). They are empty
> reward slots until those steps land. This is intentional sequencing — do the structural expansion
> while saves are disposable, fill the levels later. Auto-traverse ignores empty top levels
> (`isBiomeFullyDoneAtTier`), so they create no grind in the meantime.

---

## The level remap (heart of Step 3)

Map every biome-local `requiredBiomeLevel` from the 4-wide band layout to the 6-wide layout,
**preserving tier segment + within-segment position** so gating is unchanged:

```
oldS = 4, newS = 6
seg = floor((L-1) / oldS)          # which tier segment (0-based)
pos = ((L-1) mod oldS) + 1         # position within segment, 1..4
L'  = seg * newS + pos             # new level
```

Mapping table: `1→1 2→2 3→3 4→4 | 5→7 6→8 7→9 8→10 | 9→13 10→14 …`. Levels 5,6 / 11,12 / … of each
new segment are left **empty** (the future reward space). The map is monotonic, uniform, and
**start-tier-independent**, so recipe↔upgrade-step ordering and per-tier gating are preserved for every
biome (jungle/desert@T2, volcanic/tundra@T3, graveyard/trench@T4) automatically.

Apply to: all `shared/src/data/recipes/*.recipes.ts` + `abyssUltimate.ts` + `trenchUltimate.ts` +
the single `items.ts` occurrence. ~493 literals → **script it** (regex on the `requiredBiomeLevel:`
key, see Phase 1). `clearing` is a special case — see Phase 0.

---

## Phase 0 — Shared foundation (constant + GM core)

`shared/src/config/gameConfig.ts`
- `BIOME_LEVELS_PER_TIER: 4 → 6`. `biomeLevelOffset` and `biomeLevelCap` pick it up automatically.
- **Clearing:** decide — keep `biomeLevelCap('clearing') → 4` (tutorial hub stays a 4-level zone,
  its recipes are **not** remapped) **[default]**, or bump to 6 for uniformity (then remap clearing
  recipes too). Default keeps clearing self-consistent (offset 0, cap 4, independent of the change).
- `BIOME_LEVEL_CAP_BY_TIER`: confirm it's dead (grep for consumers). If unused → delete + drop the
  `types.ts` comment reference. If used → rederive as `6t+1`.

`shared/src/systems/itemUpgrades.ts`
- `requiredBiomeLevelForUpgrade` generic fallback: `(item.tier-1) * 4` → `* BIOME_LEVELS_PER_TIER`.

**Global Mastery core** (new — put in `gameConfig.ts` or `systems/biomeProgress.ts`, pure/shared):
- `globalMastery(biomeLevel: Record<string, number>): number` = sum of values. **Exclude `clearing`**
  (tutorial hub) **[default]**; document the choice.
- `runeBudgetForGlobalMastery(globalMastery: number, runePointBonus = 0): number` — replaces the
  tier term. **Implemented placeholder (non-regressive):** `8 + floor(globalMastery / 10) +
  runePointBonus`. Anchored on realistic content-complete GM (~5 biomes × ~4 content levels ≈ 20
  GM/tier — auto-traverse stops at the last unlock, skipping the empty levels 5–6) → +2 RP/cleared
  tier, matching the old `tier*2`; base 8 = old tier-0. Verified at GM 0/20/40 → 8/10/12 = old
  T0/T1/T2. **Divisor is a user lever.** `runeBudgetForTier` deleted; all 3 call sites moved to GM.
- `upgradeCeilingFromGlobalMastery(globalMastery: number): number` — GM-derived hard ceiling.
  **Placeholder non-binding:** return a value ≥ every current structural max (e.g. `5`, or
  `3 + floor(gm / BIG)`), so no current +3 item regresses. Step 6 tightens it. Document it as a
  placeholder seam.

`checkUpgrade` / `getMaxUpgrade` (`itemUpgrades.ts`)
- Thread an optional `globalMastery?: number` into `checkUpgrade`. Effective max =
  `min(getMaxUpgrade(item), upgradeCeilingFromGlobalMastery(gm))`. When `gm` is absent (old callers /
  tests) treat the ceiling as non-binding (don't regress). Add the "GM too low" reason string.

## Phase 1 — Recipe / item level remap (Step 3)

- One-off script (scratchpad, Node/ts): for each target file, regex-replace `requiredBiomeLevel:\s*(\d+)`
  applying the remap fn. Skip `clearing.recipes.ts` if clearing stays at 4 (Phase 0 default).
- Manual review of non-standard entries: `requiredBossClear`-gated recipes, `ultimate` recipes, and
  any level already > a segment boundary — the uniform map handles them, but eyeball the diff.
- Re-tuning the *content* of the freed L5/L6 slots and the recipe costs is the **user's** pass; this
  phase only relocates existing recipes so gating is preserved.

## Phase 2 — Server wiring (Step 4)

- `server/src/world/playerLifecycle.ts:33` and `server/src/index.ts:846`: compute
  `gm = globalMastery(tracksProgression.biomeLevel)` and pass to `runeBudgetForGlobalMastery`.
- `server/src/systems/player/economy/itemUpgrade.ts:46`: pass `gm` into `checkUpgrade`.
- `craftRecipe` needs no GM (it gates on `requiredBiomeLevel` vs `biomeLevel[group]`, handled by the
  remap). Verify no other `runeBudgetForTier` caller remains.
- **Admin:** add GM (read-only, derived from `biomeLevel`) to the player summary feeding
  `CharactersTab`. No grant/reset — GM follows from biome levels, which admin already controls.

## Phase 3 — Protocol / view + client (Step 4)

- `shared/src/protocol/views.ts`: add `globalMastery: number` to `PlayerView`; set it in
  `composePlayerView` via `globalMastery(progression.biomeLevel)`.
- Client `hud/atoms.ts`: add `globalMasteryAtom` (or derive from the existing `biomeLevel` atom);
  populate from sync, reset on clear.
- Client `ui/RunesPanel.tsx:191`: budget = `runeBudgetForGlobalMastery(gm, runePointBonus)`.
- Client `ui/crafting/UpgradeTab.tsx` + `ui/map/NodeInfo.tsx`: pass `gm` into `checkUpgrade` /
  effective-max so the button gate matches the server.
- `BiomeXpBar` / `BiomeTab` / `NodeInfo` read `biomeLevelCap`, which now returns 6/tier — verify the
  "level X / cap" display reads correctly (now `/6` per segment). No logic change expected.

## Phase 4 — Verify + docs

- `pnpm typecheck` (all 4 packages).
- Targeted tests: `targetPriority.test.ts`, `runeMaintenance.test.ts`. **Known pre-existing failure:**
  `runeMaintenance` fails on a "Cautious should independently claim recovery" assertion unrelated to
  this work (documented in the status log) — confirm it's the same failure, not a new one.
- Sanity checks: GM = sum of sample `biomeLevel`; RP budget at a few progressions ≥ old values (no
  loadout trimmed); a current +3 item still reaches +3 at low GM; a remapped advanced-biome recipe
  unlocks at the same player tier as before.
- Update `docs/rune-system-current-state.md` (the `runeBudgetForTier` formula line) and the
  `system-rework-status.md` scoreboard + session log (Steps 3, 4 → built).

---

## Levers handed to the user (balance pass / later steps)

| Lever | Where | Owned by |
|---|---|---|
| RP GM-curve constant `K` (and shape) | `runeBudgetForGlobalMastery` | user |
| GM upgrade-cap ceiling numbers | `upgradeCeilingFromGlobalMastery` (Step 6 tightens) | user / Step 6 |
| XP curve for stretched 6-level segments | `BIOME_XP_BASE`, `BIOME_XP_EXPONENT` | user |
| L5 / L6 reward content per biome | recipe data (needs Steps 5/7/9 content first) | user / later steps |
| Recipe cost / requiredBiomeLevel re-tuning post-remap | `data/recipes/*` | user |

## Red-team notes

- *"Empty L5/L6 feel pointless?"* — they're invisible until content fills them (auto-traverse stops
  at the last unlock; manual players see headroom but no dangling rewards). Acceptable pre-content.
- *"Does the 4→6 stretch make T1 grindier?"* — only if XP base isn't retuned; but since content stops
  at L4 today, players don't climb to L6 yet. Low immediate impact; user retunes when L5/L6 fill.
- *"GM rusher under-capped?"* — yes by design (catch-up). The non-regressive placeholder keeps it
  from biting *current* content; Step 6 makes it meaningful with +5.
