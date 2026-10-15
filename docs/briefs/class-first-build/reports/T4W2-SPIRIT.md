# T4W2-SPIRIT report
**Agent:** Claude   **Branch:** rw/t4w2-spirit   **Last commit:** see `git log -1` (report committed with the code)

## Done
### 1. T4 state visible (client)
- `composeThresholdsView` now takes an optional `unlockedSkills` and returns `leaves` (the picked leaves under the discipline, with their rules) and `leafChoices` (the discipline's leaves not yet taken). `useThresholdsView` passes `unlockedSkillsAtom`. The Thresholds editor lists each picked leaf under the specialization line, and at tier 4 with no leaf yet shows "Tier 4: choose X, Y, Z in the Passive Tree."
- The five T4 pieces and Stray Bolts / Depth Charge need nothing new: piece cards and the trophy line are driven by the kit, and the concept icons already exist (sleet, ground-charge, dust-wall, thunderstorm, maelstrom).
- Statuses: the Spirit adds none; `statusRegistry` lists no Spirit id.
- Passive Tree panel: already lists the discipline's leaves (T4-SPIRIT checked it); no change.
### 2. Tutorial T4 stretch
`buildSpiritT4Beats()` in `shared/src/tutorial/scripts/spirit.ts`, appended after the T3 stretch: seven zones in the bible's T4 order (Mountain, Tundra, Jungle, Desert, Volcanic, Wasteland, Trench), each a zone beat, a lesson beat (to the tier-4 cap) and a boss beat naming the trophy rank-up or the new trophy (Stray Bolts, Depth Charge). The first line is the leaf pick. Existing step types only.
### 3. Bot route
`bot/src/routes/spiritT4.ts` (`spirit-t4`): the T3 route, a wait for the tier-4 promotion, `unlockSkill` of `spirit-wading` (Tide, swarm; placeholder), then per T4 zone travel, farm to `biomeLevelCap(4, biome)`, attempt the boss. Registered in `ROUTES`, NOT in `CONTROLLED_ROUTE_IDS`. The Wasteland is the `graveyard` biome group.

## Checks
- pnpm typecheck: clean
- pnpm test -- tutorial spirit thresholdsView classKits: 24/24 passed (spiritT4 server and bot, tutorial, thresholdsView among them)
- pnpm test -- statusRegistry: fails only on other classes' ids (conduit-fall-back, conduit-ice-shell, conduit-last-stand, conduit-seal, conduit-withdraw, debuff-immune); no Spirit id.

## Not done, or unsure
- The route's leaf pick (Wading) is a placeholder; the route has not run live. It also keeps the T3 route's `classConfig`/Tide discipline and Spring Tide specialization.
- Ice Storm's glaze is still not drawn (not networked), as noted at T3.

## Files outside the brief I needed (edited, please confirm)
- `shared/src/tutorial/tutorial.test.ts`: Spirit tail assertions (T3 slice bounds, T4 stretch, resume past T3 now lands on `t4:mountain`).
- `shared/src/classKits/thresholdsView.ts` (+test): the leaf fields.
