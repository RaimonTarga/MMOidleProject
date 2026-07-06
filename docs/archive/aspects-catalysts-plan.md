> **ARCHIVED (2026-07-07) — HISTORICAL.** Implemented; live state in `docs/aspects-catalysts-current-state.md`. Kept for design rationale — do not treat as current.

# Aspects + Catalysts — Implementation Plan

**Steps:** 1 (Aspect Essence economy) + 2 (Biome Catalysts), built together in one session.
**Companion:** `docs/aspects-catalysts-current-state.md`. **Index:** `docs/system-rework-roadmap.md`.
**Decisions locked (2026-06-23):** display-name-only rename · author all three data sets with
placeholders (user retunes).

> **Sequencing note:** the roadmap recommends Step 4 (Global Mastery) land *first* as the
> foundation keystone. Steps 1 & 2 do **not** depend on GM, so building them first is safe —
> just don't wire any catalyst/essence value to GM here (none of this touches RP or upgrade caps).

---

## Design summary

- **Aspects** = display layer over the existing 5 essence keys. No key/protocol/DB change.
  `ESSENCE_LABELS`: `yellow→Might, green→Wild, purple→Rot, blue→Stone, red→Deep`.
- **Per-mob essence variety**: keep single-essence drops, but vary which essence each mob in a
  biome drops so the biome's mixture emerges from its spawn pool. No reward-shape change.
- **Catalysts**: one per biome group, uncapped. New wallet + progress counter on
  `TracksProgression`. Kills add weighted progress; crossing a threshold mints 1 catalyst.
  Boss first-clears grant a one-time bundle. Recipes/upgrades gain a parallel catalyst cost axis.
- **Wallet keying**: `Record<biomeGroup, number>` (string key, e.g. `"forest"`), mirroring
  `biomeLevel`. Label derived from `BIOME_DATABASE` name + " Catalyst".

---

## Phase A — Shared foundation (`shared/`)

1. **`shared/src/items.ts`**
   - Add `ESSENCE_LABELS: Record<EssenceType, string>` (Might/Wild/Rot/Stone/Deep per the map).
     Optionally re-theme `ESSENCE_COLORS` to aspect palette (leave as-is if the current colors read fine).
   - Add a catalyst label helper (or `CATALYST_LABELS`): derive `${biomeName} Catalyst` from the
     biome group. Keep it pure (no server import).
   - Extend `UpgradeStep` with `catalystCost?: Partial<Record<string, number>>` (keyed by biome group).

2. **`shared/src/data/recipes/types.ts`**
   - Extend `Recipe` with `catalystCost?: Partial<Record<string, number>>`. Document it next to `cost`.

3. **`shared/src/components/core/networkedSlices.ts`**
   - Add to `TracksProgression`:
     `catalysts: Record<string, number>` and `catalystProgress: Record<string, number>`.
   - No allowlist edit needed (whole slice is networked). Confirm dev network/marker invariants pass.

4. **`shared/src/data/monsters/types.ts`**
   - Extend `MonsterDefinition.rewards` with `catalystWeight?: number` (progress per kill) and
     `catalystBundle?: number` (one-time first-clear grant for guardians/bosses).

5. **`gameConfig.ts`** (wherever `GAME_CONFIG` lives in shared)
   - Add `CATALYST_PROGRESS_PER_UNIT` (threshold to mint 1 catalyst). Placeholder value; user-tuned.

6. **`shared/src/systems/itemUpgrades.ts`**
   - Add `upgradeCatalystCostFor(item, targetPlus)` returning `step.catalystCost ?? null`.
   - Extend `checkUpgrade` params with `catalysts: Record<string, number>` and check catalyst
     cost (using the item's `biomeGroup` for messaging). Keep essence checks intact.

## Phase B — Server authority (`server/`)

7. **`server/src/systems/player/progression/rewards.ts`**
   - In `applyKillRewardsToPlayer`: after essence/XP, resolve `biomeGroup` from
     `NODE_BIOMES[nodeId]`; add `def.rewards.catalystWeight ?? 0` to
     `tracksProgression.catalystProgress[biomeGroup]`. While progress ≥ `CATALYST_PROGRESS_PER_UNIT`,
     subtract the threshold and increment `catalysts[biomeGroup]`. `markSliceDirty` once.
   - In the existing `isBoss` first-clear branch (where `bossesCleared` is appended), also grant
     `def.rewards.catalystBundle` to `catalysts[biomeGroup]` — **only when the clear is newly added**
     (one-time). Reuse the existing newly-added guard.
   - Party sharing needs **no new code**: the same-node member loop already re-invokes
     `applyKillRewardsToPlayer`, so progress + bundles share automatically (matches essence/XP).

8. **`server/src/systems/player/economy/crafting.ts`**
   - After the essence check/spend, check + spend `recipe.catalystCost` against
     `tracksProgression.catalysts` (mirror the essence loop). Test-room path grants catalysts too
     (or skips the check, matching the essence shortcut).

9. **`server/src/systems/player/economy/itemUpgrade.ts`**
   - Pass `catalysts` into `checkUpgrade`. After essence spend, deduct `upgradeCatalystCostFor`.
   - Test-room path skips catalyst gate (mirrors essence).

10. **`server/src/db/playerRepo.ts`**
    - Add `catalysts: {}` and `catalystProgress: {}` to the new-player default (`:226`).
    - Include both in the snapshot (`:155`). On load, default missing fields to `{}`
      (pre-release, so no migration of existing rows required — confirm seed path handles absent keys).

## Phase C — Client / UI (`client/`, `admin/`)

11. **Essence label routing** — replace raw-key capitalization with `ESSENCE_LABELS[type]` in:
    `client/src/hud/EssencePanel.tsx`, `client/src/ui/crafting/shared.tsx`, `ForgeTab.tsx`,
    `UpgradeTab.tsx`, `client/src/ui/map/NodeInfo.tsx`, `RunesPanel.tsx`,
    `client/src/hud/bestiary/BestiaryDetailOverlay.tsx`, `admin/src/tabs/CharactersTab.tsx`.
    Also server reason strings in `crafting.ts` / `itemUpgrades.ts` (use the label, not the key).
    *(Grep each for raw `type` display before editing; some may already use a shared composer.)*

12. **Catalyst wallet display** — add a catalysts atom (mirror `essencesAtom` in
    `client/src/hud/atoms.ts`, fed from the `tracksProgression` sync) and a small panel/row set
    mirroring `EssencePanel`. Show per-biome catalyst count + progress toward next.

13. **Cost displays** — wherever recipe/upgrade essence cost is rendered (`ForgeTab`, `UpgradeTab`,
    `crafting/shared.tsx`), also render `catalystCost`. Reuse the shared cost-row composer.

## Phase D — Data authoring (placeholders; user retunes)

14. **Per-mob essence variety** — across the 18 monster files, assign `essenceType` so each biome's
    spawn pool yields a themed mixture (biome primary dominant + 1–2 thematic secondaries). Sensible
    defaults only.

15. **Catalyst weights** — set `catalystWeight` per mob by toughness tier
    (normal < tanky < elite < guardian) and `catalystBundle` on guardians/bosses. Placeholder numbers.

16. **Catalyst recipe costs** — populate `catalystCost` on a representative set of existing recipes
    (and `UpgradeStep.catalystCost` where appropriate) so the axis is exercised end-to-end. Amounts
    are placeholders.

## Phase E — Verify

- `pnpm typecheck` (all packages).
- Boot dev server → confirm marker/network invariants pass with the new `TracksProgression` fields.
- Manual round-trip: kill mobs → catalyst progress rises, mints at threshold; boss first-clear grants
  bundle once; craft/upgrade a catalyst-gated recipe spends both currencies; persistence survives
  a relog (new fields saved/loaded). Party same-node member receives shared progress.
- Update `docs/system-rework-status.md` (scoreboard paired-docs column + session log).

---

## Risks / watch items

- **Display routing completeness** — missing a surface leaves a raw `red`/`blue` visible. Grep-driven
  sweep + a quick UI pass mitigates.
- **Persistence of absent keys** — ensure the load path defaults `catalysts`/`catalystProgress` to `{}`
  for pre-existing rows so old characters don't crash on undefined.
- **Threshold tuning** — `CATALYST_PROGRESS_PER_UNIT` and all weights are placeholders; flagged for the
  user's balance pass (Step 15). Do not tune numerically here.
- **Essence drop-volume tension** (`BIOME_ESSENCE_TIER_MULT` dampens vs. brainstorm's growth) stays
  **parked** for the user's balance pass — out of scope for this session.
</content>
