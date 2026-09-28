# Map, Crafting, Upgrade, Inventory and Passive Tree panels

Audited 2026-09-28. Implemented, not yet released or committed; in-game review pending. Client
presentation only: no server, protocol, balance or save changes. The sections
below record the design decisions; "Implementation notes" records calls made
while building. Owning source is listed per panel.

Mockup (throwaway, real world/recipe data): https://claude.ai/artifact/5zXv4dz3knZpWA1Tsn7f89

## Why

All three panels are overloaded. The map tile carries up to six badges and its
side panel is a wiki; Crafting has ~30 controls before the first recipe; Upgrade
is a long scroll of large cards. The map also does not show the danger bands from
`shared/src/data/areaDanger.ts` (see [area-information-current-state.md](area-information-current-state.md)).

## Map — plan + navigate

Owners: `client/src/ui/map/MapPanel.tsx`, `NodeInfo.tsx`, `constants.ts`, `client/src/ui/map.css`.

- **Fog: tier gate.** Nodes with `biomeTier <= playerTier` (plus T0) are charted.
  Higher tiers render as **silhouettes**: same position and routes, no biome,
  danger, dungeon or name; a faint `?`. Every node stays clickable and routable.
  No new save data (`visitedNodes` is not needed for this model).
- **Region labels** stay visible over fog as `Region N · Uncharted`.
- **Tile:** fill = biome color (today's `tileColor`), **border = danger band**
  (thick, 1–4 → Low/Medium/High/Very High colors). Sanctuary/T0 keep a neutral
  "safe" border. Glyphs kept: biome icon, dungeon/boss marker (incl. felled
  state), YOU. Dropped from tiles: tier chip, name text, modifier chip
  (modifiers may be removed later).
- **Selection summary (first view):** name, region · tier, danger pill with
  skulls (same vocabulary as the arrival banner), dungeon/boss line with felled
  timer, biome level + next unlock, Travel button. Monsters, drops, modifier
  numbers and the full unlock ladder move behind one "Details" expansion.
- **Uncharted selection:** "Uncharted — reach Tier N to chart this region",
  Travel still offered.
- Danger colors must never show for above-tier nodes (bands are within-tier, so
  T4 Mountain "Low" would mislead a T1 player). Tier gate guarantees this.

## Crafting — category rail

Owners: `client/src/ui/crafting/MakeTab.tsx`, `makeEntries.ts`, `useMakeEntries.ts`, `client/src/ui/crafting.css`, `panelFilters.ts`.

- Replace the toolbar (search, toggles, sort, kind/biome/tier chips) with a
  **left rail of categories**: Weapon, Armor, Recovery, Boots, Core, Relic,
  divider, Technique, Stance, Rite, Rune. Flat list, no group headers.
- Each rail item shows counts: `N ready · N new`.
- **A category appears only when its first recipe unlocks** (the biome level at
  which it becomes craftable), and arrives with a NEW badge. Derived from recipe
  unlock state already on the client — not from `resolveSystemVisibility`, whose
  "knows one" gates are circular for crafting. Current data gives: Weapon T1 Lv1;
  Armor, Technique, Rune T1 Lv2; Recovery Lv3; Boots Lv4; Core T2; Stance T2;
  Rite T3; Relic T4.
- List per category, sectioned **New → Ready to craft → Need materials**; short
  rows say what is missing (`need 20 green`). Owned/learned recipes stay removed.
- **"Show N locked"** link at the bottom of each category; locked rows show the
  biome + level that unlocks them.
- **Detail pane shows full detail**: stats, mechanic effects, relic/core
  profile, technique/stance/rite/rune lines for this character, description,
  evolution preview, cost vs wallet, one action button with the blocking reason.
- Keep the wallet strip. The two success beats (stamp / T3+ ceremony) are out of
  scope for this pass.

## Inventory — stat sheet

Owners: `client/src/ui/inventory/StatSheet.tsx`, `statSheetModel.ts`, `useFocus.ts`
(`useComparePin`), `BackpackGrid.tsx`, `EquipmentSlots.tsx`, `client/src/ui/inventory.css`.
Layout unchanged (equipped · backpack with filters · stats); only the stats column
and click behaviour changed. Mockup: https://claude.ai/artifact/Y3TEibLwYU8q7A2hEUr4zd (option F).

- **Click pins, hover previews.** Clicking a backpack or equipped item pins it to
  the sheet; hovering another item previews it (dashed frame) without losing the
  pin. Equipping is the sheet's button. On phones, pinning jumps to the Stats tab.
- **Three modes** (`buildStatSheet`): nothing pinned → your character; bag item →
  what equipping it changes (vs the item it replaces); equipped item → what it
  contributes (you with it vs without it; absolute amounts, not percentages).
- **Headline:** Est. DPS and Toughness tiles. Toughness = max HP ÷ ((1 − DR) ×
  final damage taken × (1 − dodge rate × damage avoided per dodge)); plating and
  recovery stay as rows because they depend on the enemy and fight length.
- **Stable sheet:** Offense / Defense / Utility groups; the pinned stats (attack,
  attacks/sec, max HP, DR) always show, others show when non-neutral or changed.
  Rows never appear/disappear while comparing; unchanged rows dim, changed rows
  get was → now, a signed delta chip, and a magnitude hairline.
- **Effect accounting is measured.** `formatMechanicEffectEntries` tags each
  effect line with its mechanic keys; the model re-runs the preview with those keys
  omitted (`omitItemEffects`, a preview-only input to `recalculatePlayerStats`).
  If any reported number moves the line is "counted", else "not in the estimate".
  Swapping lists "you would lose" lines. Relics get a class-mechanic
  before → after table (`resolvedRelicProfileRows`).
- Known finding: the DPS estimate models `weapon.dead-swing-interval` only for
  laser builds, so the sheet reports Chaotic Axe's dead swing as not in the
  estimate for other classes (and their DPS is overstated).
- **Backpack:** sorted highest tier first, then name. Filters are slot (all six,
  including Core and Relic) and tier only; the biome filter is gone. A chip exists
  only while you carry a matching item, and a row only when it has 2+ choices.
- The pin note and Equip / Replace / Unequip button sit in a sticky footer at the
  bottom of the stats column, so long effect lists (relics) scroll behind it.
- Test: `server/test/inventoryStatSheet.test.ts`.

## Passive tree

Owner: `client/src/ui/SkillTreePanel.tsx`, `client/src/ui/skillTree.css`.
Mockup: https://claude.ai/artifact/9JnX1uup6LV1p91BGZWSpp (branch diagram chosen).

- One screen, no tabs. "Your build" and "Compare choices" (and `skillBuildSummary`)
  are gone; the tree-data guards from their test live in `server/test/skillTreeData.test.ts`.
- **Player-facing tiers are 1-based:** Class = Tier 1, Style = Tier 2, Range =
  Tier 3, Path = Tier 4 (internal tiers 0–3). Internal tiers 4–7 are placeholders
  and fold into one "Tier 5+ · in development" step.
- **Journey track** across the top: each passed tier shows what you took (click
  to review that tier; untaken choices read as roads not taken), the current tier
  says "Choose now".
- **Compact cards** for the current choice: crest, name, style/kind + cost, first
  sentence, top three stats. Character sprites appear only in the detail pane.
- **Style step branch diagram:** every style and the three Tier 4 paths it opens;
  the selected style's branch lights up, and clicking a path previews it
  ("Preview · opens at Tier 4"). The detail pane for a style also lists its paths.
- **Inline comparison:** detail-pane stat rows note sibling values where they
  differ ("+8% vs +6% / +7%").
- Unlocking still only happens from the detail pane's button.

## Upgrade — light touch only

Upgrading is expected to change substantially soon; spend minimal effort.

- Compact rows (icon, name, `+N`, ready dot), **equipped first**, then bag.
- Diff, cost and biome-level / GM requirements move to a detail pane.
- Drop the biome/slot/tier filter rows.

## Implementation notes (2026-09-28)

- **Fog helper:** `isNodeCharted(biomeTier, playerTier)` in `client/src/ui/map/constants.ts`.
  A tier-0 character (Clearing) is treated as tier 1, so a new player sees
  Tier 1 instead of a map of silhouettes.
- **Map toolbar:** the tier and biome selects are gone; search stays but never
  matches uncharted nodes (that would leak what is there).
- **Danger border:** `::after` ring in `--map-danger` so selection/current/path
  glows keep working. Colors in `mapDangerColor` (green → red); the arrival
  banner keeps its own cream → red palette.
- **Details:** collapsed by default; holds modifier numbers, boss rows, monsters,
  biome XP bar and the unlock ladder (the old panel content, unchanged).
- **Rail visibility:** `unlockedMakeKinds()` in `makeEntries.ts` checks the same
  unlock predicates as the entries but ignores ownership, so a crafted-out
  category stays. A category shows NEW while every unlocked recipe in it is
  still unseen (derived from the existing `craft` newness, no new storage).
- **Readiness:** evolutions count as ready only if `checkEvolve` or
  `checkReconstruct` passes; the list sections are New / Ready to craft /
  Not ready yet / Locked. Rows say what is missing (`-20` per material, or
  `needs Flash Rapier +3`). Rows that were new stay in New until the panel
  closes, so hovering does not move them.
- **Mobile:** the rail becomes a horizontal strip above the list.
- **Upgrade:** `BrowserPane` gained optional `groupOf` (section headings) and
  `listFooter`; Upgrade uses it with Equipped / In your bag sections. The
  upgrade filter atom and dead card/filter CSS were removed.
- **Test:** `server/test/craftingRailAndMapFog.test.ts`.

## Validation

`pnpm typecheck`; client build; a wiring test for the category-visibility helper
(pure function over recipe unlock state); `tools/uishot` screenshots at desktop
and 390/768 widths for all three panels; in-game review.
