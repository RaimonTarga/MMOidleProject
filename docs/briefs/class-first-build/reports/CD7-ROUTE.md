# CD7-ROUTE report
**Agent:** Grok   **Branch:** rw/cd7-route   **Last commit:** f9795f672715de528255fa60dfdc888892bc5a29 (this report is the commit after it; the tutorial commit is d176517b)

## Done

`buildConduitBeats()` is registered as `TUTORIAL_CLASS_BEATS['summoner-root']`. `tutorialScriptFor` still puts the shared opening in front of it. Apprentice, Slinger and Spirit still get the seal route. The seal beats keep their ids, chapters, order, seals and farewell. `open:plains` still teaches `zones`. `boss:plains` still teaches `seals` and `boss-altar`. `zone:swamp` still teaches `poison`.

A beat only shows while its step is unfinished, and the next line shows when the previous step becomes true. Zone farms that used to run to the tier cap now stop at lesson level 2 (`LESSON_ZONE_LEVEL`), and the next beat carries on to that cap. That is how a line lands when the zone binds its specialist. The class card is the first beat of this tail, which is after the opening's charm and boots.

Beats after the opening, in order:

1. `open:plains` — The Plains, at Plains 0. Teaches `zones`. Farm to the lesson level.
   - Say: "Command is four pips, filled by four Thralls. The roster and the orders are on your class screen, and Recall is on R. The Plains first."
2. `conduit:warden` — The Plains, at Plains 2. Farm to the tier cap.
   - Say: "The Plains Warden is bound. It taunts the enemies around it. Keep fighting until their boss is open."
3. `boss:plains` — unchanged. Teaches `seals`, `boss-altar`.
4. `zone:forest` — The Forest, at Forest 0. Farm to the lesson level.
   - Say: "Its Soul sits in the relic slot: a free extra body. The Forest fights in fast packs. Cut through it."
5. `conduit:thornrunner` — The Forest, at Forest 2. Farm to the tier cap.
   - Say: "Thornrunner is bound: a fast bruiser with little health."
6. `zone:swamp` — unchanged say (poison). Farm to the lesson level.
7. `conduit:bile-spitter` — The Swamp, at Swamp 2. Farm to the tier cap.
   - Say: "Bile Spitter is bound. Its acid strips the plating off what it hits."
8. `zone:cave` — unchanged say. Farm to the lesson level.
9. `conduit:cave-brute` — The Cave, at Cave 2. Farm to the tier cap.
   - Say: "Cave Brute is bound. It costs two Command, and it soaks the hits that come at you."
10. `conduit:mountain` — The Mountain, at Mountain 0. Farm to the lesson level. The until is `anyOf(Mountain level 2, Mountain boss cleared)`, so a resume that already holds the seal is not sent back up the mountain.
    - Say: "The Mountain hits the hardest. Fight up it."
11. `boss:mountain` — Ridge Marksman, then the second seal.
    - Say: "Ridge Marksman is bound: a heavy shot from the back row. The Mountain boss is the second seal. Two seals open the next tier. Clear the guards, then the altar."
12. `farewell` — unchanged.

`conduit-t1` is registered in `ROUTES` and `CONTROLLED_ROUTE_IDS`. It is not class-agnostic. Steps:

1. Travel to the Clearing, farm until tier 1 (the tier-0 quest).
2. `chooseClass` `summoner-root`.
3. `classConfig` with `mode: 'auto'`. The payload is `defaultClassConfig` for a fresh Conduit: no specialist bound, no Soul, Command 4, so the roster is four `conduit-thrall` and the pre-set orders (closest, tanks guard the Conduit, rebuild tanks first, Recall when HP is low). `auto` resolves to the §7.13 default, and the server rebuilds it as each specialist and the first Soul arrive.
4. Plains to the tier cap, then `attemptBoss` Plains tier 1.
5. Forest, Swamp, Cave, each to the tier cap. That is `T1_BIOME_ORDER` with the two seals placed where the guide fights them.
6. Mountain to level 2, then `attemptBoss` Mountain tier 1.
7. Farm the Mountain until tier 2. If the second seal already promoted, the step is already done.

Completion is both boss clears and `playerTierAtLeast` 2. Milestones: tier 1, class chosen, each walked zone's lesson (level 2) and its terminal level, the Mountain's lesson level, `plains-seal`, `mountain-seal`, tier 2.

## Checks

- pnpm typecheck: clean
- pnpm test -- tutorial conduitT1 smokeT1 harness.test: 5/5 passed
  - PASS shared/src/tutorial/tutorial.test.ts (17.3s)
  - PASS bot/src/routes/smokeT1.test.ts (26.7s)
  - PASS bot/src/routes/conduitT1.test.ts (37.0s)
  - PASS server/test/tutorialAnchors.test.ts (47.4s)
  - PASS bot/src/harness.test.ts (59.1s)
  - 5/5 passed in 59s

The `tutorial` filter also selected `tutorialAnchors.test.ts`. It passed. `harness.test` walks every registered route, so the new id was included. No server or bot was run.

## Not done, or unsure

- The Soul shares `zone:forest`, because that card is the one that comes up when the Plains boss dies. A beat of its own would have skipped the Forest intro.
- Ridge Marksman shares the Mountain-boss beat, because the next action after the lesson is the boss. The second-seal instructions stayed on that card. The line is under the 170-character cap.
- The lines say "four pips", "four Thralls", and "two Command". Those are the lesson, from §7.4 and the kit (`conduit-thrall` costs 1, `conduit-cave-heavy` costs 2, Command starts at 4). No other numbers were added.
- `conduit-t1` is on `CONTROLLED_ROUTE_IDS`, so a clean controlled batch now runs it next to `smoke-t1`, `striker-t1` and `squire-t1`.
- No live client or bot run. The brief says neither is required.

## Files outside the brief I needed (not edited)

- `shared/src/tutorial/tutorial.test.ts` was edited, not left alone. The brief's check runs it, and it asserted that the class map was only `cadence-root` and `cooldown-root`. Registering the Conduit builder made `pnpm test -- tutorial` fail on that pin. The change adds `summoner-root` and pins the Conduit tail the same way the Striker tail is pinned: ids, the lesson split at level 2, the seal teachings, and the farewell line. Classes without a builder still match the seal route.
- `docs/guided-tutorial-current-state.md` still says no class has its own beats.
- `docs/bot-experiment-runner-current-state.md` still says `smoke-t1` is the only registered route.
