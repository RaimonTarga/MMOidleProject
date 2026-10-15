# T2W2-SPIRIT report
**Agent:** Claude   **Branch:** rw/t2w2-spirit   **Last commit:** see `git log -1` (report committed with the code)

## Done
### 1. T2 state visible (client)
- **Overflow above 100%:** `StormGauge` no longer clamps. When the storm is above `energyMax` the bar rescales so the whole storm stays on it, the old 100% is drawn as a white brim mark, floor and band marks move with the scale, and the readout/tooltip say "N past the brim". `StormBottle` (editor) shows an overflow glow and its meter's `aria-valuenow` is no longer clamped.
- **Tide phase:** new optional `usesEnergy.tide?: 'ebb' | 'surge'` (present only for a Tide Spirit), written by `publishTide` in `spirit.ts` through `mutateSlice`; `PlayerView.tidePhase` (`''` when absent), `tidePhaseAtom`, shown on the gauge readout ("Ebb" / "Surge") and in the gauge text. The editor hides the gather/hover picker for Tide ("the tide sets the phase") and shows Storm Surge as "fires by itself" instead of band buttons.
- **Reservoir depth:** the bottle is already deeper (`energyMax` doubles), so the gauge shows it; the editor adds a "Deep bottle: N" readout and the discipline rule line.
- `ThresholdsView` (shared view model) gains `discipline` and per-piece `automatic` (Storm Surge). `stormRule()` words each discipline's rule in one place for the gauge and editor.
- Statuses: none owed for the Spirit; none of the failing `statusRegistry` ids are Spirit's.
### 2. T2 guided steps
`buildSpiritT2Beats()` in `shared/src/tutorial/scripts/spirit.ts`, appended after the farewell beat: seven zones in the bible table order, each a zone beat (to the lesson level, read from the kit), a lesson beat (to the tier-2 cap), and a boss beat (T2 boss, line names the trophy rank-up). The first line is the discipline pick (Overflow/Tide/Reservoir, via the Passive Tree). Existing step and condition types only; every line under 170 chars. Resume lands on `t2:plains` at tier 2; the closing farewell panel now shows after the last T2 boss.
### 3. Bot route
`bot/src/routes/spiritT2.ts` (`spirit-t2`): the T1 route's steps, an `unlockSkill` of the discipline (the runner has no dedicated discipline step; disciplines are tier-1 Passive Tree nodes with the discipline's id), then per zone travel, farm to `biomeLevelCap(2, biome)` (= the guide's level), attempt the T2 boss. Completion: discipline piece learned plus all seven T2 bosses. Registered in `ROUTES`, deliberately NOT in `CONTROLLED_ROUTE_IDS` (never run live). Test: `bot/src/routes/spiritT2.test.ts`.

## Checks
- pnpm typecheck: clean
- pnpm test -- spirit tutorial classKits thresholdsView harness.test smokeT1 strikerT1: 23/23 passed (includes spiritT2 server + route, spiritT1, tutorial, thresholdsView)
- pnpm test -- statusRegistry: FAILS on ids that are other classes' wave-1 statuses (ability-sidestep, apprentice-held, apprentice-withered, brittle, conduit-bark, conduit-mark, dot-frozen, squire-parry); no Spirit id is in the list.
- No browser/live check of the client changes (static typecheck only).

## Not done, or unsure
- Placeholder choice: the route picks Tide (balanced); change `SPIRIT_T2_DISCIPLINE` for another arm.
- Overflow's rescaling bar is my reading of "must allow > 100%"; the designer may prefer a fixed extension segment.
- The T2 guide's chapter strip still says "Tier 1 route" in `TutorialPanel` (aria-label); not touched.
- Tide's drift and Reservoir's untouchable shield are still wave-1 stand-ins; the HUD only shows the phase.

## Files outside the brief I needed (edited, please confirm)
- `shared/src/tutorial/tutorial.test.ts`: the Spirit tail assertion assumed the farewell was the last beat; updated to the first 12 ids, plus T2 assertions and a resume check.
- `bot/src/routes/spiritT1.test.ts`: its tutorial-parity helper now looks only at tier-1 farms (otherwise T2 farm gates break it).
- `shared/src/classKits/thresholdsView.ts` (+test), `shared/src/protocol/views.ts`, `shared/src/components/archetypes/energy/usesEnergy.ts`, `server/src/systems/classes/archetypes/energy/spirit.ts`, `server/test/spiritT2.test.ts`: the minimal networking and view-model fields above.
