# T3W2-SPIRIT report
**Agent:** Claude   **Branch:** rw/t3w2-spirit   **Last commit:** see `git log -1` (report committed with the code)

## Done
### 1. T3 state visible (client)
- `PlayerView.specializationId` already existed; the client now has `specializationIdAtom` (set in the player sync, reset on logout) and `useThresholdsView` passes it in.
- `ThresholdsView` gains `specialization` (id, name, rule text) and `specializationChoices` (the picked discipline's three). The specialization counts only if it belongs to the picked discipline. The Thresholds editor shows the picked specialization's rule under the discipline line, or "Tier 3: choose X, Y, Z in the Passive Tree" before the pick.
- Piece cards: `waitsFor` words now fall back to the shared moment vocabulary, so Downburst, Tailwind and Foehn read "something drags or pushes you" etc. instead of a raw id.
- Spring Tide's double bottle needs nothing new: the storm bar already rescales past 100%.
- Statuses: the Spirit adds none (Ice Storm's glaze is server-only), and no `statusRegistry` gap is a Spirit id.
- Passive Tree panel: lists the real specializations under the picked discipline (it filters tier-2 nodes by `disciplineId`; nodes come from the kit); no fix needed.
### 2. Stand-ins to real moments
The Spirit has none: its Tailwind and Foehn already read `waitsFor` through `conditionsHold`. The T3 report's "moment missing" is stale. New live test in `server/test/spiritT3.test.ts`: `drag-or-push` fires Tailwind and `chill-threshold` fires Foehn through a band.
### 3. Tutorial T3 stretch
`buildSpiritT3Beats()` in `shared/src/tutorial/scripts/spirit.ts`, appended after the T2 stretch: seven zones in the bible's T3 order (Mountain, Cave, Swamp, Jungle, Desert, Tundra, Volcanic), each a zone beat, a lesson beat (to the tier-3 cap) and a boss beat naming the trophy rank-up (Ice Storm and Pyrocumulus as new). The first line is the specialization pick. Existing step types only; lines under 170 chars.
### 4. Bot route
`bot/src/routes/spiritT3.ts` (`spirit-t3`): the T2 route, a wait for the tier-3 promotion, `unlockSkill` of `spirit-spring-tide` (placeholder, under Tide), then per T3 zone travel, farm to `biomeLevelCap(3, biome)`, attempt the boss. Registered in `ROUTES`, NOT in `CONTROLLED_ROUTE_IDS`.

## Checks
- pnpm typecheck: clean
- pnpm test -- thresholdsView statusRegistry spirit tutorial classKits: 22/23 passed in the last full run; the only failure is `statusRegistry`, whose gaps are other classes' ids (conduit-burn-bright/hibernate/horn/hunt/spore, dot-chill, slinger-burn/deathmark/entrenched/fan-the-hammer, squire-frostward/rampage). `thresholdsView` was fixed and re-run green; `spiritT3` (server and bot) and `tutorial` pass.

## Not done, or unsure
- The Ice Storm glaze is not drawn (not networked). Showing it needs a ground-patch effect in the client; left for the conductor.
- `thresholdsOf` still reads the specialization from `unlockedSkills`, not `usesSkills.specializationId` (server file, outside my paths); both are set by the same unlock, so they agree.
- The route's specialization pick (Spring Tide) is a placeholder; the route has not run live.
- Spring Tide's "the surge spends it all" is still the T3 stand-in.

## Files outside the brief I needed (edited, please confirm)
- `shared/src/tutorial/tutorial.test.ts`: the Spirit tail assertions (T2 slice bounds, T3 stretch, resume past T2 now lands on `t3:mountain`).
- `client/src/hud/atoms.ts`: `specializationIdAtom` (other classes will likely add the same; keep one).
- `shared/src/classKits/thresholdsView.ts` (+test), `server/test/spiritT3.test.ts`: view fields and the live moment test.
