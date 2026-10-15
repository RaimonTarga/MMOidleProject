# CS6-ROUTE report
**Agent:** Grok   **Branch:** rw/cs6-route   **Last commit:** 757237106d4d9f37d2b401254526762d5df3339e (this report is the commit after it; the tutorial commit is a91067ab)

## Done

- `shared/src/tutorial/scripts/striker.ts` is the `cadence-root` builder. `tutorialScriptFor` still puts the shared opening in front of it. The other five classes still get the seal route.
- A beat only shows while its step is unfinished, and the next line shows when the previous step becomes true. Zone farms that used to run to the tier cap now stop at lesson level 2, and the next beat carries on to that cap. That is how a line lands when the zone teaches the technique, without a new step or condition type.
- The seal beats keep their ids, chapters, order, seals and farewell. `open:plains` still teaches `zones` at Plains 0. `zone:swamp` still teaches `poison` at Swamp 0. `boss:plains` still teaches `seals` and `boss-altar` at the Plains cap.

### Beats, in the order they sit in the seal route

Levels on the continued farms are `biomeLevelCap(1, biome)`, not a written-in number. Lesson level is 2.

1. `open:plains` — was the Plains farm to the cap. Now farms to level 2. This is the card after the class is picked (the opening's charm and boots are already on). Say: "Four plain swings, then a heavy last hit: your combo. The strip shows it, and the Order on your class screen sets it. The Plains first."
2. `striker:sweep` — new, between the Plains open and the Plains boss. Shows at Plains level 2, then farms to the cap. Say: "Sweep is on a beat now. A technique beat swings a bit lighter and hits every enemy around you. Keep fighting until their boss is open."
3. `boss:plains` — unchanged.
4. `zone:forest` — now farms to level 2, so this card comes up when the Plains boss dies. Say starts with the trophy, then the seal line: "Its trophy is your finisher now. The Order equipped it for you. The Forest fights in fast packs. Cut through it."
5. `striker:hamstring` — new. Shows at Forest level 2, farms to the cap. "Hamstring is on a beat now. That swing slows the enemy down."
6. `zone:swamp` — say unchanged, farm now ends at level 2.
7. `striker:rend` — new. Shows at Swamp level 2, farms to the cap. "Rend is on a beat now. That swing leaves a bleed."
8. `zone:cave` — say unchanged, farm now ends at level 2.
9. `striker:focus` — new. Shows at Cave level 2, farms to the cap. "Focus is on a beat now. It opens the combo, and that beat is the cast, not a swing."
10. `striker:mountain` — new. The seal route does not walk the Mountain (it is the second seal). This farms to level 2 so Coil is learned before the boss. Say: "The Mountain hits the hardest. Fight up it." The until is `anyOf(Mountain level 2, Mountain boss cleared)` so a resume that already holds the seal is not sent back up the mountain. A guided run has not cleared it, so it farms.
11. `boss:mountain` — same fight. The say is Coil plus the seal instructions, and it shows at Mountain level 2: "Coil is on a beat now: you wind up, and that beat is the cast, not a swing. The Mountain boss is the second seal. Clear the guards, then the altar."
12. `farewell` — unchanged.

### Bot route `striker-t1`

Registered in `ROUTES` and in `CONTROLLED_ROUTE_IDS`. Not class-agnostic: `--class` for any class but the Striker is rejected. Steps:

1. Travel to the Clearing. Farm until tier 1.
2. `chooseClass` `cadence-root`.
3. `classConfig` with `mode: 'auto'`, no relic, and four plain beats (`strikerComboLength(null) - 1`) and an empty hold list. That list is what the Order's check accepts before any lesson. `auto` resolves to the §12.13 default, and the server rebuilds it when a lesson or a trophy arrives.
4. Plains to the tier cap, then `attemptBoss` Plains tier 1.
5. Forest, Swamp, Cave, each to the tier cap. That is `T1_BIOME_ORDER` with the two seals placed where the guide fights them (Plains after its farm, Mountain after Cave).
6. Mountain to level 2, then `attemptBoss` Mountain tier 1.
7. Farm the Mountain until tier 2. If the second seal already promoted, the step is already done.

Completion is both boss clears and `playerTierAtLeast` 2. Milestones: tier 1, class chosen, each zone's lesson (level 2) when the farm goes past it, each zone's terminal level, `plains-seal`, `mountain-seal`, tier 2.

## Checks

- pnpm typecheck: clean
- pnpm test -- tutorial strikerT1 smokeT1: 4/4 passed
  - PASS shared/src/tutorial/tutorial.test.ts (3.0s)
  - PASS bot/src/routes/strikerT1.test.ts (5.5s)
  - PASS bot/src/routes/smokeT1.test.ts (5.7s)
  - PASS server/test/tutorialAnchors.test.ts (6.0s)
  - 4/4 passed in 6s
- Also ran `pnpm test -- harness.test` because the route joined the registry that file walks: 1/1 passed (7.4s). No server and no bot were started.

## Not done, or unsure

- The combo is the Plains open beat's line, not its own id. A separate beat in front of it would have to take the only farm before level 2, and then `open:plains` would not show. Say if you want the id `striker:combo` on that beat instead.
- Coil and the Mountain boss share one card, because the next action after the lesson is the boss. The old sentence "Two seals open the next tier." is not on that card: with it, the line was 177 characters and the script cap is 170. The first seal still teaches seals.
- The trophy and the Forest intro share `zone:forest`, because that card is the one that comes up when the Plains boss dies.
- `striker-t1` is on `CONTROLLED_ROUTE_IDS`, so a clean controlled batch now runs it next to `smoke-t1`. The registry comment says a class route joins that list when it is rebuilt. Say if batches should stay smoke-only until the other five exist.
- No live client or bot run. The brief says neither is required.

## Files outside the brief I needed (not edited)

- `shared/src/tutorial/tutorial.test.ts` was edited, not left alone. The brief's check runs it, and it asserted that no class builder was registered and that every class tail, including `cadence-root`, was the seal route line for line. The seal-route assertions still cover the other five classes, the classless script, and an unknown class. The Striker assertions check the tail ids, the lesson split at level 2, and resume through the Mountain farm.
- `docs/guided-tutorial-current-state.md` still says no class has its own beats.
- `docs/bot-experiment-runner-current-state.md` still says `smoke-t1` is the only registered route.
