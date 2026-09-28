# Area information

Audited 2026-09-28. Informational client presentation; no combat, movement,
map-panel, balance, or persistence changes.

## Danger vocabulary

`shared/src/data/areaDanger.ts` owns the authored progression bands. These describe
the biome within the **destination tier**, not personal readiness or measured
survival. Modifiers do not alter the band. Dungeons get their own fifth band,
`Boss fight`, regardless of biome. Sanctuaries and the tutorial have their own
labels without a skull. Unknown future content says `Uncharted danger`.

Each band shows **one** skull (the `dungeon-skull-icon`), tinted by an SVG
colour-matrix filter so the bone climbs bone → gold → orange → red →
blood-crimson; `Boss fight` also glows and pulses (off under reduced motion).
The world map uses the same five bands as tile-border colours.

| Tier | Low danger (bone) | Medium danger (gold) | High danger (orange) | Very High danger (red) |
| --- | --- | --- | --- | --- |
| 1 | Plains, Forest | Swamp | Mountain | Cave |
| 2 | Plains, Forest | Swamp, Mountain | Cave, Jungle | Desert |
| 3 | Swamp, Mountain | Cave, Jungle | Desert, Tundra | Volcano |
| 4 | Mountain, Jungle | Desert, Tundra | Volcano, Wasteland (`graveyard`) | Deep Sea Trench |

## Arrival and approach

- `areaInformationState.ts` observes the authoritative player view before HUD atoms
  update, using the previous character visit history. No additional save schema.
- First biome/tier arrival: 5 seconds; new node within a familiar biome/tier:
  2.8 seconds; revisited node: 1.6 seconds. Initial login is a baseline, not discovery.
- Full/new-node banners explain the modifier; returns retain its name.
- State sync, death, background tabs and reconnects suppress announcements.
  Rapid arrivals replace the current banner, never queue. Reduced motion disables
  the fade while preserving the expiry timer. All presentation is click-through.
- `areaInformationModel.ts` selects only open gates from shared gate geometry.
  Show within 460 world pixels; retain until 560 pixels away to avoid flicker.
  At baseline 120 px/s this gives roughly 3.5 seconds before the server's 40 px
  travel crossing threshold; faster movement gives less warning.
- Each nearby open exit is shown, including both sides at corners. Each sign has
  independent retention distance. Labels sit inside the corresponding viewport
  edge; compact viewports pair corner signs in separate columns to avoid overlap.
- Preview is suppressed for 2.2 seconds after a node change and while an arrival
  banner is visible. No travel pause or confirmation is introduced.
- `AreaInformation.tsx` and `areaInformation.css` own layout, copy and styling.
  The overlay is mounted inside the game viewport, above world rendering.

## Validation and remaining review

- `pnpm test -- areaInformation nodeModifiers`: authored coverage, every canonical
  gate destination/sealed edge, visit classification, tier relativity and hysteresis.
- `node tools/uishot/area-information-audit.mjs`: real React/observer with synthetic
  local state, no socket or saved-character mutations. Desktop, phone and landscape
  bounds, skull rendering, return expiry, death/sync suppression, visibility cleanup,
  and border-preview destinations. Screenshots: `.uishot/area-information/`.
- Typecheck and client production build. Browser fixtures are not live travel or
  combat evidence. In-game visual review (HUD overlap, travel feel, final spacing,
  colors and timings) remains a follow-up. The world map draws the same bands as
  tile borders on charted nodes; see [map-crafting-panels-current-state.md](map-crafting-panels-current-state.md).
