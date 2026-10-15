# T2W2-SQUIRE report
**Agent:** Claude   **Branch:** rw/t2w2-squire   **Last commit:** see `git log -1` (report committed with the code)

## Done
- **Visible T2 state (client).**
  - `client/src/ui/class/ResponsesEditor.tsx`: a Discipline section. Picked: its name and what it changes (kit text). Not picked at tier 2+: "Pick a discipline" with the three names and fantasies, pointing at the Passive Tree. The discipline's piece (Parry, Intercept, Unbowed) carries a "discipline" tag. Last Breath reads "Spends the whole bar" instead of "0 -> 0 pips". All other T2 responses (Stand Fast, Unshaken, Splitting Blow, Steel Will II, Earthstamp, Watchful, Challenge) already render through the existing rule list with rank and cost from the rank params; nothing else was needed.
  - `client/src/hud/mechanics/ResolvePips.tsx`: the Resolve help adds a Last Breath line when the rule is on (reads `classConfigAtom`).
- **Status `squire-parry`.** Buff id (`shared/src/components/combat/buffs.ts`), tile descriptor (`squireBuffs.ts`, the Guard descriptor's twin), help copy (`statusHelp.ts`), icon lookup (`conceptIcons.ts`, wears the existing `squire-guard` icon). No art made.
- **Tutorial (`shared/src/tutorial/scripts/squire.ts`).** `buildSquireTierTwoBeats()` appended after the farewell beat: the discipline line, then per T2 zone (Plains, Forest, Mountain, Swamp, Cave, Jungle, Desert) an entry farm to the lesson level, the lesson line while farming to the tier cap, and the boss beat naming the trophy rank-up (Muster II, Relentless II, Faultline II, Rot-Eater II, Corrode II, Strangler Vine, Executioner's Oath). Existing step and condition types only. Lines under the 170 limit, no numbers.
- **Bot route (`bot/src/routes/squireT2.ts`, registered in `routes/index.ts` and `CONTROLLED_ROUTE_IDS`).** `squire-t2`: the whole T1 route, then `unlockSkill` on the discipline node (default `squire-avenger`; `squireT2Route(id)` takes another), then each T2 zone farmed to `biomeLevelCap(2, zone)` and its boss. Completion: all seven T2 bosses cleared. Test `bot/src/routes/squireT2.test.ts` (modelled on the T1 test, also checks the farm level equals the tutorial's last gate and the lesson level is below it).

## Checks
- pnpm typecheck: clean
- pnpm test -- squire tutorial statusRegistry classKits responsesView: 20/22 passed. The two failures:
  - `squireT1.test.ts`: my new T2 beats broke its "last farm gate for the zone" helper (it did not filter by tier). Fixed by one added `step.at.tier === 1` line; now passes (`pnpm test -- squireT1 squireT2 tutorial`: 5/5).
  - `statusRegistry.test.ts`: still fails, but no `squire-*` gap remains. Open gaps are other classes' ids (`conduit-bark`, `conduit-mark`, `apprentice-held`, `apprentice-withered`, `brittle`, `dot-frozen`); `squire-parry` was the only Squire one and is closed.

## Not done, or unsure
- **Discipline step in the guide:** the tutorial has no step or condition that reads the discipline pick (`TutorialView` has no `disciplineId`), so the pick line rides on a plain farm beat and shows when tier 2 lands, not when the pick is made. A real "discipline chosen" step needs a new step type; not added.
- **Tutorial panel:** `TutorialPanel` shows the farewell only when the script has run out (or the player presses its button), so with the T2 beats appended the farewell card now appears after the last T2 boss. Panel not edited (outside the brief); the conductor may want to move the farewell.
- **Bot T2 route:** no T2 gear crafting (the T2 weapon/armor/charm recipes were not wired into craft steps; the route relies on drops). The discipline default (Avenger) is a choice; the bible's bot plan names defaults for all three, so the route can be forked per discipline with `squireT2Route(id)`.
- **Tile for Parry** wears the Guard icon (art owed by the designer). The tile descriptor is in `server/src/systems/classes/archetypes/cooldown/squireBuffs.ts`; the audit reads the server tile from there, so I edited it (no gameplay code touched).
- Last Breath lockout is not shown (it lives in server-only `TracksCombat`); only the "whole bar" cost and the help line.
- Not verified in a browser; client build not run (typecheck clean).

## Files outside the brief I needed (not edited)
- `client/src/tutorial/TutorialPanel.tsx` (farewell timing, above). No others.
