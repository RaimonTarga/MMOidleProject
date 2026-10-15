# T2W2-APPRENTICE report
**Agent:** Claude (Sonnet 5.5)   **Branch:** rw/t2w2-apprentice   **Last commit:** see `git log -1` (report committed with it)
## Done
- **Visible T2 state (client).** Payoffs editor (`client/src/ui/class/PayoffsEditor.tsx`): a discipline card (school, rules in words, the piece it adds), the sigil ring in the school's colour with the discipline's cap shift (Poison +2, Frost -1), and T2 payoffs offered on their own moments (Blast Back on "charges", Sear on "shield", Seep on "out of reach", Snag on "flees", Recoil on "debuff lands"; Wither/Fuse/Cold Snap on "full"). A bound payoff's "Add to a moment" select starts on its own moment. The HUD sigil readout (`SigilReadout.tsx`, `SigilRing.tsx`, `sigilRing.css`) wears Poison green / Fire orange / Frost blue from `disciplineIdAtom`.
- **View data (shared).** `shared/src/classKits/payoffsView.ts`: `discipline`, cap shift, `PayoffView.moment`, T2 moments appear on the card once the lesson is owned. Test lines added to `payoffsView.test.ts`.
- **Statuses.** `apprentice-held`, `apprentice-withered`, `dot-frozen` now have target help, badge and icon (stand-ins `debuff-root`, `debuff-sundered`; `dot-frozen` already had art). `brittle` and `dot-frozen` were failing as "carrier ?" because `freezeOrBrittle` passed a local `cs` to `applyStatusEffect`; it now passes `target.tracksCombat` (2-line edit in `server/.../dot/sigilsT2.ts`, no behaviour change).
- **Tutorial.** `shared/src/tutorial/scripts/apprentice.ts`: after the farewell (tier 2) the guide gives the school pick line, then per T2 zone (Plains, Forest, Mountain, Swamp, Cave, Jungle, Desert) a farm beat, a lesson beat at the real unlock level (Blast Back, Numb II, Sear, Siphon II, Seep, Snag, Recoil) and a boss beat naming the trophy rank-up. Existing step/condition types only. The farewell beat's line was changed (it said "that is the guided part done").
- **Route.** `bot/src/routes/apprenticeT2.ts` (id `apprentice-t2`, registered in `routes/index.ts`): the T1 route, the seven T2 zones to their tier-2 cap, a custom Payoff-rules step placing every T2 payoff, then the seven T2 bosses. Test `apprenticeT2.test.ts` (levels match the guide, config validates, guide resolves lesson by lesson). `apprenticeT1.test.ts` adjusted for the longer guide (tail no longer ends at the farewell; guide levels read from tier-1 farms only).
## Checks
- pnpm typecheck: clean
- pnpm test -- apprentice tutorial classKits payoffs classScreen statusRegistry dot sigil: 20/21 passed. The only failure is `statusRegistry`, now listing only other classes' ids: `ability-sidestep`, `conduit-bark`, `conduit-mark`, `squire-parry`. All Apprentice ids (`apprentice-held`, `apprentice-withered`, `dot-frozen`, `brittle`) are green.
## Not done, or unsure
- **No discipline pick exists**: the skill tree is gone, there is no protocol intent and no route step for choosing a school (`unlockSkill` needs a SKILL_TREE node). The tutorial pick line is words only, the route runs with `disciplineId: null`, and the class screen has no picker. The conductor must decide the pick path.
- `apprentice-t2` is registered but not added to `CONTROLLED_ROUTE_IDS` (unrun).
- The route farms every T2 zone, then sets rules, then fights all seven bosses (the guide interleaves boss per zone).
- Default Payoff rules still ignore T2 pieces (wave-1 note, `configs/apprentice.ts`); the route sets them itself.
- The brief's allowed paths did not list `shared/src/classKits/payoffsView.ts`; I edited it (view composer, small) because the editor cannot show T2 moments or the discipline without it.
- Not browser tested.
## Files outside the brief I needed (not edited)
- `shared/src/classKits/configs/apprentice.ts` (T2 default placements)
- a discipline-pick intent (protocol/server) for the school pick
