# Steps 3 + 4 — Current State (audited 2026-06-23)

Paired with `docs/global-mastery-plan.md`. Covers **Step 3 (Recipe system + Biome Mastery,
incl. the biome-levels-per-tier 4→6 expansion)** and **Step 4 (Global Mastery)**, planned and
built together because GM derives from the biome-level track Step 3 reshapes.

This is a *what exists in code today* snapshot. Source files win over this doc if they diverge.

---

## Biome-level / recipe machinery (Step 3)

- **`BIOME_LEVELS_PER_TIER = 4`** (`shared/src/config/gameConfig.ts:158`). The single constant
  encoding "a tier segment is 4 biome levels." Consumed by:
  - `biomeLevelOffset(group) = (startTier-1) * BIOME_LEVELS_PER_TIER` — shifts the XP curve for
    biomes that first appear above T1 (e.g. volcanic@T2).
  - `biomeLevelCap(playerTier, group) = (playerTier-startTier+1) * BIOME_LEVELS_PER_TIER` — the
    **live** cap on how high a biome can be leveled. `clearing` is special-cased to a flat `4`.
- **`BIOME_LEVEL_CAP_BY_TIER = [5,5,9,13,…]`** (`gameConfig.ts:106`). Pattern `4t+1`. **Appears to
  have no code consumer** — only referenced in its own definition + a `types.ts` doc comment. The
  authoritative cap is the `biomeLevelCap()` *function*. To re-confirm (`grep`) and either delete or
  rederive when the constant changes.
- **`requiredBiomeLevelForUpgrade`** (`shared/src/systems/itemUpgrades.ts:34`) — generic fallback for
  items without an explicit `upgrades[]` array hardcodes `(item.tier - 1) * 4 + 1 + targetPlus`. The
  `* 4` is the same "4 per tier" assumption, **not** routed through the constant.

### How recipe levels are numbered (critical)

`Recipe.requiredBiomeLevel` and `UpgradeStep.requiredBiomeLevel` are **biome-local absolute** levels
that span tier segments. Example — `volcanic.recipes.ts` (volcanic startTier = **T3**; verified via
`biomeLevelCap`):
- its T3-segment gear is authored at `requiredBiomeLevel` 1–4.
- its T4-segment gear is authored at 5–8.
- gated by `biomeLevelCap(playerTier, 'volcanic')` = `(playerTier-2)*4` → 4 at T3, 8 at T4.

So levels are dense in 4-wide bands: band *k* (0-based) = levels `[4k+1 … 4k+4]` = the (startTier+k)
tier segment. **Consequence:** naively flipping `BIOME_LEVELS_PER_TIER` to 6 grows the cap to 6/tier,
so each band's next-tier recipes become reachable **one tier early** — a gating regression. The fix is
a level **remap** (see plan). Verified start tiers: jungle/desert = T2, volcanic/tundra = T3,
graveyard/trench = T4; the remap is start-tier-independent so it preserves gating for all of them.

### Recipe / item surface to remap

`requiredBiomeLevel` literal counts (per `grep`):

| File | count | | File | count |
|---|---|---|---|---|
| mountain | 76 | | jungle | 52 |
| swamp | 56 | | cave | 48 |
| desert | 48 | | volcanic | 40 |
| tundra | 40 | | forest | 32 |
| plains | 32 | | graveyard | 24 |
| trench | 20 | | clearing | 16 |
| abyssUltimate | 4 | | trenchUltimate | 4 |
| items.ts | 1 | | **total** | **≈ 493** |

All under `shared/src/data/recipes/*` plus one in `shared/src/items.ts`. Volume → script the remap,
don't hand-edit. `requiredBiomeLevel:` is a unique key prefix → a `requiredBiomeLevel:\s*(\d+)` regex
remap is safe (won't touch essence costs etc.).

### Gating / traverse interactions (already correct, do not regress)

- `craftRecipe` / `upgradeItem` compare `requiredBiomeLevel` against the live `biomeLevel[group]`.
- `areAllBiomeRecipesUnlocked` (`biomeProgress.ts:38`) filters recipes by `requiredBiomeLevel > cap`
  using the live `biomeLevelCap`. Auto-derives from the constant.
- `isBiomeFullyDoneAtTier` (`biomeProgress.ts:95`) **explicitly does not require maxing biome level**
  — auto-traverse advances once all *reachable* recipes are unlocked + nodes/boss cleared. So adding
  empty top levels (5, 6) does **not** create grind. This is why an expansion with empty new levels
  is benign for traversal.

---

## Global Mastery (Step 4) — does not exist yet

- **No account/global aggregate.** Confirmed via `grep globalMastery` → only the roadmap docs.
  Biome levels live per-group in `TracksProgression.biomeLevel: Record<string, number>`
  (`shared/src/components/core/networkedSlices.ts:227`), persisted.

### Formula #1 — Rune-point budget (tier-driven today)

- `runeBudgetForTier(playerTier, runePointBonus) = 8 + max(0,playerTier)*2 + max(0,runePointBonus)`
  (`shared/src/runeDatabase.ts:421`).
- Call sites (3 + def): server `playerLifecycle.ts:33` (on attach), server `index.ts:846`
  (`rune:setLoadout`), client `RunesPanel.tsx:191`. `sanitizeRuneLoadout` trims the loadout to the
  budget, so a **lower** budget silently drops equipped rune rules.
- `runePointBonus` = sum of crafted `increase-rune-points` recipes. **Stays** in Step 4's formula
  (Step 5 retires those recipes — out of scope here).

### Formula #2 — Item upgrade cap (flat today)

- `MAX_UPGRADE = 3`; per-item structural max `getMaxUpgrade(item) = item.upgrades?.length ?? 3`
  (`itemUpgrades.ts:5,29`). All current items cap at +3.
- `checkUpgrade` (`itemUpgrades.ts:106`) is the shared authority (server applies, client gates the
  button). No GM input today. Server caller `itemUpgrade.ts:46`; client caller `UpgradeTab.tsx`.

### Protocol / client

- `PlayerView` (`shared/src/protocol/views.ts`) carries `biomeLevel` (line 297 in composer) but **no**
  `globalMastery`. Client has `biomeLevel` via atoms, so GM is client-derivable.
- Admin `CharactersTab` surfaces essences/biomeLevel; no GM column.

---

## Cross-cutting checklist status for this step

- **Persistence/migration:** GM is **derived** (sum of `biomeLevel`) → no new persisted field, no
  migration. Existing `biomeLevel` values are untouched by the 4→6 change (a level-4 biome is still
  level 4, now mid-segment). Pre-release clean cutover for recipe-gating shifts.
- **Networked allowlists / dev-boot invariants:** none — `PlayerView.globalMastery` is a view field,
  not a networked *slice*. `NETWORKED_PLAYER_KEYS` unchanged.
- **Protocol/views:** add `globalMastery` to `PlayerView` + composer (1 field).
- **Admin:** add GM (read-only, derived) to the player summary / CharactersTab.
- **combatBootstrap parity:** N/A — no new combat listener (RP budget + upgrade cap are not
  combat-pipeline listeners).
- **Rune-action catalog:** N/A this step.
