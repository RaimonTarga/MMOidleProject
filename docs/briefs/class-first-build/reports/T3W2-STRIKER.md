# T3W2-STRIKER report
**Agent:** Claude (Sonnet 5.5)   **Branch:** rw/t3w2-striker   **Last commit:** 9f4804f7 (code commit; this report follows)

## Done
**1. T3 state visible**
- Networking (minimal): `UsesCadence` gained `held` (Afterimage's slashes), `fightFinishers` and `frenzyArmed` (Frenzy); `PlayerView` gained `cadenceHeld/FightFinishers/FrenzyArmed`; `syncResourceSlice` in `strikerT2.ts` copies them with `markSliceDirty` only on change. Test block 28 in `strikerT3.test.ts`.
- `client/src/hud/orderResource.ts`: the resource carries a `note`; Afterimage reads "3 slashes held", Frenzy reads "Frenzy 1 of 2" / "Frenzy ready" / "Frenzy: second finisher armed" on the strip's resource line (view model passes the spec id and fields). Test: `server/test/strikerT3Hud.test.ts`. Crescendo's uncapped Momentum already shows as "Momentum +N%".
- `OrderEditor.tsx` (+ new `specializationIdAtom` in `atoms.ts`): shows the picked specialization (name + rule text) under the discipline, or a hint at tier 3 to pick one in the Passive Tree.
- Overheat split out of `striker-focus` into its own status `striker-overheated` (own buff def, orange tile, help text, icon lookup to the existing `striker-overheat` class-piece icon; removed at the finisher). The audit allowed it; `strikerT3.test.ts` block 7 pins it. Haste reads the generic data key, so no other code changed.
- Passive Tree pick: `SkillTreePanel.tsx` already lists the picked discipline's three real specializations (tree tier 2 filtered by `disciplineId`) and gates through `canUnlockSkill`; no fix needed (read, not browser-run).
- Statuses owed to Striker: none other. `statusRegistry` has no Striker row open.

**2. Tutorial T3 stretch** (`shared/src/tutorial/scripts/striker.ts`): `buildStrikerTierThreeBeats()` after the T2 stretch, same three beats per zone over Mountain, Swamp, Cave, Jungle, Desert, Tundra, Volcanic (ids `striker3:<zone>[-lesson|-boss]`). First line points at the specialization pick; boss lines name Skyfall III, Festering Cut III (last), Sunder III, Pounce II, Verdict II and the new Hoarfrost and Eruption; Jungle/Volcanic arrive lines mention the moved gear jobs. T2 builder generalised (`buildTierBeats`); T2 ids and text unchanged. Tests updated in `tutorial.test.ts` and `strikerT1.test.ts` (skips `striker3:`).

**3. Bot routes** (`bot/src/routes/strikerT3.ts`, registered in `routes/index.ts`): `striker-t3-<spec>` x9 (one per specialization). Steps = the discipline's `striker-t2-*` route, a wait for the tier-3 promotion, `unlockSkill <specialization>`, then per T3 zone travel, farm to `biomeLevelCap(3, zone)`, `attemptBoss` tier 3. Not in `CONTROLLED_ROUTE_IDS`. Test `strikerT3.test.ts` (steps, farm levels equal the guide's, milestones, registration, not controlled).

## Checks
- pnpm typecheck: clean
- `pnpm test -- strikerT3Hud striker cadence classKits statusRegistry tutorial classFirst orderView smoke`: 27/28 passed. The one failure, `statusRegistry.test.ts`, lists only other classes' ids (conduit-*, squire-frostward/rampage, slinger-*, and so on); no Striker or `striker-overheated` row is open.
- Not run in a browser; client verified by typecheck only.

## Not done, or unsure
- Afterglow's "fading" shine (lit past a break) and Crescendo's release rule are not shown on the strip (server-only; the shine still reads lit).
- Tier-3 promotion wait in the route farms Desert at tier 2; it is already satisfied after the T2 route (three T2 seals), as in the T1 route's farewell step. Unverified live.
- No T3 gear crafting in the route (Tundra/Volcanic recipes not in reach), Order stays auto.
- Overheat wears the Overheat technique's icon (class-pieces); designer may swap.
- Frenzy mirror constant (`FRENZY_AFTER_FINISHERS` = 2) is duplicated in the client; placeholder like the Momentum cap.
- The farewell/"Guided Tier 1" panel conflict from T2-W2 still stands (TutorialPanel untouched).

## Files outside the brief I needed (edited, minimal)
- `shared/src/components/combat/buffs.ts` (BUFF_IDS entry for `striker-overheated`), `client/src/hud/statusHelp.ts`, `client/src/ui/conceptIcons.ts` (status entries), `client/src/hud/atoms.ts` (`specializationIdAtom`).
