# CL6-ROUTE report
**Agent:** Grok   **Branch:** rw/cl6-route   **Last commit:** dab0b8854f330fad500adc09e1e77bd567b7987a (this report is the commit after it; the tutorial commit is dd1c143a)

## Done

- `shared/src/tutorial/scripts/slinger.ts` is the `reload-root` builder. `tutorialScriptFor` still puts the shared opening in front of it. Apprentice, Spirit and Conduit still get the seal route.
- A beat only shows while its step is unfinished, and the next line shows when the previous step becomes true. Zone farms that used to run to the tier cap now stop at lesson level 2 (`LESSON_ZONE_LEVEL`), and the next beat carries on to that cap. That is how a line lands when the zone teaches the clip, without a new step or condition type.
- The seal beats keep their ids, chapters, order, seals and farewell. `open:plains` still teaches `zones` at Plains 0. `zone:swamp` still teaches `poison` at Swamp 0. `boss:plains` still teaches `seals` and `boss-altar` at the Plains cap.

### Beats, in the order they sit in the seal route

Levels on the continued farms are `biomeLevelCap(1, biome)`, not a written-in number. Lesson level is 2.

1. `open:plains` — was the Plains farm to the cap. Now farms to level 2. This is the card after the class is picked (the opening's charm and boots are already on). Say: "A plain pistol, and the ammo ring around you. You reload when the clip is empty, and you stand still while you reload. The Plains first."
2. `slinger:scatter` — new, between the Plains open and the Plains boss. Shows at Plains level 2, then farms to the cap. Say: "Scatter is on: three or more enemies near you, and each round nicks the ones beside your target. Keep fighting until their boss is open."
3. `boss:plains` — same fight. The say is the plain last round plus the seal instructions (167 characters): "The Plains boss is open. A plain last round still ends the clip. Clear the guards, wake it at the altar, and take the first seal. Falling is normal; we just try again."
4. `zone:forest` — now farms to level 2, so this card comes up when the Plains boss dies. Say starts with the trophy, then the seal line: "Its trophy, Stampede Round, is the last round of every clip now. It was equipped for you. The Forest fights in fast packs. Cut through it."
5. `slinger:snare` — new. Shows at Forest level 2, farms to the cap. "Snare is on: a fast enemy closing on you, and each round slows its movement and attacks a little."
6. `zone:swamp` — say unchanged, farm now ends at level 2.
7. `slinger:venom` — new. Shows at Swamp level 2, farms to the cap. "Venom is on: an elite or a boss, and each round poisons the target."
8. `zone:cave` — say unchanged, farm now ends at level 2.
9. `slinger:breaching` — new. Shows at Cave level 2, farms to the cap. "Breaching is on: a plated target, and each round ignores most of its plating."
10. `slinger:mountain` — new. The seal route does not walk the Mountain (it is the second seal). This farms to level 2 so Stopping is learned before the boss. Say: "The Mountain hits the hardest. Fight up it." The until is `anyOf(Mountain level 2, Mountain boss cleared)` so a resume that already holds the seal is not sent back up the mountain. A guided run has not cleared it, so it farms.
11. `boss:mountain` — same fight. The say is Stopping plus the seal instructions, and it shows at Mountain level 2: "Stopping is on: a charge coming at you, and each round shoves it back a little. The Mountain boss is the second seal. Clear the guards, then the altar."
12. `farewell` — unchanged.

### Bot route `slinger-t1`

Registered in `ROUTES` and in `CONTROLLED_ROUTE_IDS`. Not class-agnostic: `--class` for any class but the Slinger is rejected. Steps:

1. Travel to the Clearing. Farm until tier 1.
2. `chooseClass` `reload-root`.
3. `classConfig` with `mode: 'auto'`, no trophy, an empty rack, no clip rules, no double loads, `reloadEarlyWhenSafe: true` and `neverReloadInTelegraph: true`. That is the fresh Loadout: the plain clip is always loaded and takes no slot, and nothing else is owned yet. It validates, and `resolveClassConfig` returns `defaultClassConfig` for a fresh Slinger. `auto` then rebuilds the §10.13 default as each clip and trophy arrives (Scatter on three or more, Snare on a fast enemy closing, Venom on an elite or a boss, Stopping on a charge, Breaching on a plated target, newest trophy in the relic slot).
4. Plains to the tier cap, then `attemptBoss` Plains tier 1.
5. Forest, Swamp, Cave, each to the tier cap. That is `T1_BIOME_ORDER` with the two seals placed where the guide fights them (Plains after its farm, Mountain after Cave).
6. Mountain to level 2, then `attemptBoss` Mountain tier 1.
7. Farm the Mountain until tier 2. If the second seal already promoted, the step is already done.

Completion is both boss clears and `playerTierAtLeast` 2. Milestones: tier 1, class chosen, each zone's lesson (level 2) when the farm goes past it, each zone's terminal level, `plains-seal`, `mountain-seal`, tier 2.

## Checks

- pnpm typecheck: clean
- pnpm test -- tutorial slingerT1 smokeT1 harness.test: 5/5 passed
  - PASS shared/src/tutorial/tutorial.test.ts (12.4s)
  - PASS bot/src/routes/smokeT1.test.ts (24.5s)
  - PASS server/test/tutorialAnchors.test.ts (31.2s)
  - PASS bot/src/harness.test.ts (32.5s)
  - PASS bot/src/routes/slingerT1.test.ts (38.5s)
  - 5/5 passed in 39s
- The `tutorial` filter also selected `tutorialAnchors.test.ts`. It passed. `harness.test` was added because the route joined the registry that file walks. No server and no bot were started.

## Not done, or unsure

- The pistol, the ammo ring and the stationary reload share `open:plains`, not an id of their own. A separate beat in front of it would have to take the only farm before level 2, and then `open:plains` (the beat that teaches zones at Plains 0) would not show.
- Stampede Round and the Forest intro share `zone:forest`, because that card is the one that comes up when the Plains boss dies. The plain last round is `boss:plains`, which stays up until that kill.
- Stopping and the Mountain boss share one card, because the next action after the lesson is the boss. The old sentence "Two seals open the next tier." is not on that card: with it, the line was 181 characters and the script cap is 170. The first seal still teaches seals. The plain-last-round line is 167, under the cap.
- The lines say "three or more", and each later clip's natural rule (a fast enemy closing, an elite or a boss, a charge, a plated target). Those are §10.4 and §10.13. The pistol's round count (8) and Scatter's nick count (two) are not in the lines.
- `slinger-t1` is on `CONTROLLED_ROUTE_IDS`, as the brief asks, so a clean controlled batch now runs it next to `smoke-t1`, `striker-t1` and `squire-t1`.
- No live client or bot run. The brief says neither is required. The Striker resume walk in `tutorial.test.ts` still runs on `cadence-root` only. The Mountain farm uses the same `anyOf` so a resume that already holds the seal is not sent back.

## Files outside the brief I needed (not edited)

- `shared/src/tutorial/tutorial.test.ts` was edited, not left alone. The brief's check runs it, and it asserted that the class map was exactly `cadence-root,cooldown-root`. The seal-route assertions still cover Apprentice, Spirit, Conduit, the classless script, and an unknown class. The Squire still only checks that its opening is the shared opening. The Slinger assertions check the tail ids, the lesson split at level 2, and the lines named above.
- `docs/guided-tutorial-current-state.md` still says no class builder is registered.
- `docs/bot-experiment-runner-current-state.md` still shows `smoke-t1` as the only registered route in the experiment examples.
