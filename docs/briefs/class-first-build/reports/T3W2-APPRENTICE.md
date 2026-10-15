# T3W2-APPRENTICE report
**Agent:** Claude (Sonnet 5.5)   **Branch:** rw/t3w2-apprentice   **Last commit:** see `git log -1` (report committed with it)
## Done
- **Real moments replace the stand-ins** (`server/src/systems/classes/archetypes/dot/sigilsT3.ts`). Melt and Ice Veil's edge is now `momentActive('chill-threshold')` (the local `CHILL_THRESHOLD` constant and stack read are gone; `tundra-chill` is still read only to melt it off). Ashguard now asks `momentActive('fire-attack')` on the hit (the local `isFireAttack` and the `MONSTER_DATABASE` import are deleted). `apprenticeT3.test.ts` stays green unchanged.
- **Specialization card** (Payoff rules editor). `composePayoffsView` returns `specialization` (id, name, rule text), only when the pick sits under the picked school; the editor shows it as a card under the school card. T3 payoffs sit on their moments (Melt names `chill-threshold` itself; Spore Burst, Signal Fire and Cinderfall default to the full bar). New `specializationIdAtom` in `client/src/hud/atoms.ts`, set from the player view (which already carried `specializationId`) and read in `usePayoffsView`. Test lines in `payoffsView.test.ts`.
- **Statuses.** No Apprentice status is owed: `statusRegistry` lists only other classes' ids and `dot-chill` (Slinger's Chill). Nothing added.
- **Specialization pick check.** The Passive Tree panel needed no change: the nine Apprentice specializations are tier-2 nodes under their school (`classFirst.ts`), the panel filters tier-2 choices by `disciplineId`, and `canUnlockSkill` opens only the picked school's. Pinned in `apprenticeT3.test.ts`.
- **Tutorial T3 stretch** (`shared/src/tutorial/scripts/apprentice.ts`). `buildT2Beats` became `buildTierBeats(tier, zones)`; the seven T3 zones (Mountain, Cave, Swamp, Jungle, Desert, Tundra, Volcanic) each get a farm to the lesson at its real unlock level, a lesson line (farm on to the T3 cap) and a boss line naming the trophy rank-up; the Mountain intro carries the specialization pick line. Existing step types only.
- **Route `apprentice-t3`** (`bot/src/routes/apprenticeT3.ts`, registered, NOT in `CONTROLLED_ROUTE_IDS`): the T2 route with the Fire school picked (`apprenticeT2Route` takes an optional discipline id; default `null` keeps `apprentice-t2` unchanged), a wait for the tier-3 promotion, `unlockSkill apprentice-afterburn`, the seven T3 zones to their cap, a Payoff rules step with Cinderfall (full bar, 3+ enemies), Spore Burst (target low) and Melt (chill threshold) added to the T2 rules, then the seven T3 bosses. Test `apprenticeT3.test.ts` (route shape, guide levels match, rules validate server-side, guide resolves lesson by lesson).
## Checks
- pnpm typecheck: clean
- pnpm test -- payoffsView apprentice: 8/8 passed. Earlier run `apprentice payoffs tutorial statusRegistry classKits harness momentsT3`: all pass except `statusRegistry`, which lists only other classes' ids (conduit-*, slinger-*, squire-*, dot-chill).
## Not done, or unsure
- Fire-attack granularity: `fire-attack` is a state of the fight ("some aggroed enemy attacks with fire"), so Ashguard lays its sigil on whichever monster hit you while a fire attacker is on you, not strictly on the fire shooter. Exporting `isFireAttacker` from `fightSnapshot.ts` (conductor's folder) would restore that.
- `apprentice-t2` still picks no school (unchanged); only T3 passes one. The brief's "T2 route" for Apprentice therefore gains a pick only through `apprenticeT2Route("apprentice-fire")`.
- The tier-3 promotion wait farms the Desert T2 node; if all T2 nodes are cleared at run time the `uncleared` pick may stall. Unrun live.
- `specializationIdAtom` may collide with the same atom added by other classes' branches (resolve by keeping one).
- Carried over, untouched: Numb II and Siphon II runtimes, default Payoff rules ignoring T2/T3 pieces.
- Not browser tested.
## Files outside the brief I needed (not edited)
- `server/src/systems/combat/moments/fightSnapshot.ts` (export `isFireAttacker` for exact Ashguard)
