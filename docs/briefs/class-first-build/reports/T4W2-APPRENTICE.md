# T4W2-APPRENTICE report
**Agent:** Claude (Sonnet 5.5)   **Branch:** rw/t4w2-apprentice   **Last commit:** see `git log -1` (report committed with it)
## Done
- **Leaf card** in the Payoff rules editor. `composePayoffsView` takes an optional `leafId` (new on `ClassScreenInput`) and returns `leaf` (id, name, column charger/ambusher/shooter, rule text), only when the leaf sits under the picked school. `usePayoffsView` derives the id from `unlockedSkillsAtom` (the leaf the player unlocked under their school); `PayoffsEditor` shows it as a card under the specialization card. Transference gets a natural moment (full bar) so its card has a place; Frostcrack and Pyre name their own moments. No new atom.
- **Statuses.** No Apprentice status is owed (`statusRegistry` lists only other classes' ids; it still fails on the Conduit/Slinger/Squire gaps owned by their branches, none for Apprentice).
- **Leaf pick check.** The Passive Tree lists the nine leaves as nodes under their school and `canUnlockSkill` opens only the picked school's; pinned in the route test. No panel change.
- **Tutorial T4 stretch** (`shared/src/tutorial/scripts/apprentice.ts`): `T4_ZONES` through the existing `buildTierBeats(4, ...)`: Mountain (leaf pick line, Seize III), Tundra (Frostcrack), Jungle (Spread II), Desert (Recoil II), Volcanic (Cinderfall II), Wasteland (`graveyard`: Pyre, Dirge) and Trench (Transference, Pressure Fuse), each with a farm to the real unlock level, a lesson line and a boss line. Existing step types only.
- **Route `apprentice-t4`** (`bot/src/routes/apprenticeT4.ts`, registered, NOT in `CONTROLLED_ROUTE_IDS`): the T3 route (Fire, Afterburn), a wait for the tier-4 promotion, `unlockSkill apprentice-tinderbox`, the seven T4 zones to their cap, Payoff rules adding Frostcrack (ahead of Sear), Pyre (on `risen`) and Transference (on `debuff-landed`), then the seven T4 bosses. Test `apprenticeT4.test.ts` (route shape, guide levels, rules validate server-side, guide resolves lesson by lesson).
- `apprenticeT3.test.ts` now cuts its guide slice at the first T4 beat.
## Checks
- pnpm typecheck: clean
- pnpm test -- apprentice payoffs tutorial classKits: 24/24 passed (includes `payoffsView`, `apprenticeT4` route, `apprenticeT3` route, `tutorialAnchors`)
## Not done, or unsure
- Pyre has no live effect through the `risen` moment (conductor: `risen` moment not implemented); the route places it anyway so the rules are ready.
- Transference's placement on `debuff-landed` is my choice (the bible gives it no moment); easy to move.
- Tinderbox is the leaf the route picks (Fire/ambusher); unrun live.
- The tier-4 wait farms the Volcanic T3 node; if it is cleared at run time the `uncleared` pick may stall (same as the T3 route's wait).
- Not browser tested.
## Files outside the brief I needed (not edited)
- None. (`shared/src/classKits/view.ts` got one optional field, `leafId`.)
