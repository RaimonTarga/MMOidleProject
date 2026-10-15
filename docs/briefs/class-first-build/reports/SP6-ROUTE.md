# SP6-ROUTE report
**Agent:** Codex   **Branch:** rw/sp6-route   **Last commit:** 2bbb59936869905a621757bdae60127870f10e4c (implementation; this report is committed after it)

## Done

- Added `shared/src/tutorial/scripts/spirit.ts` and registered its builder for `energy-root`. The shared Clearing opening stays intact; the Spirit tail keeps the seal route's ids, chapters, zone order, seals and farewell. It uses only existing farm, boss and condition types.
- Added `bot/src/routes/spiritT1.ts` (`spirit-t1`), registered in both `ROUTES` and `CONTROLLED_ROUTE_IDS`. The route is authored for `energy-root`; another class is rejected.
- Added route coverage for registry admission, tutorial farm parity, milestones, completion, and the real config validator/resolver across fresh and learned kits. Auto starts with Bolt and no trophy, fields learned pieces, and equips each newly earned seal trophy.
- With explicit user approval, updated `shared/src/tutorial/tutorial.test.ts` beyond the brief's original file list. Its exact registry assertion needed the Spirit root. Added Spirit beat, text cap, lesson timing, shared-opening, and resume checks, including a held Mountain seal without its lesson farm.
- Used the existing `mmo-rw-sp6-route` worktree after the user clarified the initial folder mismatch. All edits are in this worktree.

### Tutorial beats

The four continued zone farms end at `biomeLevelCap(1, biome)`. Their approach farms end at `LESSON_ZONE_LEVEL` (2), so the piece's line becomes the next unfinished beat when it unlocks.

| Beat | Placement and lesson |
|---|---|
| `open:plains` | First card after the shared opening. Plain rod, Storm 4, the gauge filling itself, one Bolt band, a 30% floor, gather to full then break to the floor, and hits draining storm before HP. Farms to Plains 2. |
| `spirit:chain-lightning` | At Plains 2: Chain Lightning in the top band, leaping through the pack. Continues to the Plains cap. |
| `boss:plains` | Same first seal and altar instructions; says the base kit can win the fight. |
| `zone:forest` | After the first boss: the base kit won it, and Crosswind makes spends strike enemies near their target. Farms to Forest 2. |
| `spirit:thunderclap` | At Forest 2: waits for an enemy touching you, then staggers nearby enemies. Continues to the Forest cap. |
| `zone:swamp` | Shared Swamp line and poison introduction; farm ends at Swamp 2. |
| `spirit:downpour` | At Swamp 2: waits for poison or bleed, then washes it off. Continues to the Swamp cap. |
| `zone:cave` | Shared Cave line; farm ends at Cave 2. |
| `spirit:thunderbolt` | At Cave 2: costly, hard single-target bolt with stagger, in the top band. Continues to the Cave cap. |
| `spirit:mountain` | Approach to Mountain 2 before the second seal. An already held Mountain seal also satisfies it, so takeover does not replay that farm. |
| `boss:mountain` | Eye of the Storm sits at the floor; at or below it, hits drain storm at half cost. Then the shared second-seal fight. |
| `farewell` | Shared goodbye and tier-2 condition. |

Every Spirit `say` and `waiting` line is under 170 characters. The shared `zones`, `seals`, `boss-altar`, and `poison` teaching markers stay in place.

### Bot route steps

1. Travel to the Clearing and farm the tier-0 quest until tier 1.
2. Choose `energy-root`, then send `classConfig` in `auto` mode: no relic, Thresholds, 30% floor, one Bolt band at the floor, gather. The existing server default adds pieces and trophies as they arrive; the route does not freeze a custom kit.
3. Farm the Plains to the T1 cap, then attempt its T1 boss.
4. Farm Forest, Swamp and Cave to their T1 caps, in the seal route's order derived from `T1_BIOME_ORDER`.
5. Farm Mountain to its level-2 lesson, then attempt its T1 boss.
6. Wait for tier-2 promotion in Mountain. Completion requires both seal clears and tier 2.

Milestones cover tier 1, class choice, each zone's lesson, each longer farm's final level, both seals, and tier 2.

## Checks

- `pnpm typecheck`: clean (workspace, bench and test projects).
- `pnpm test -- tutorial spiritT1 strikerT1 smokeT1 harness.test`:

```text
PASS  shared/src/tutorial/tutorial.test.ts  (12.6s)
PASS  bot/src/routes/smokeT1.test.ts  (23.0s)
PASS  bot/src/routes/spiritT1.test.ts  (24.4s)
PASS  bot/src/routes/strikerT1.test.ts  (25.3s)
PASS  bot/src/harness.test.ts  (26.7s)
PASS  server/test/tutorialAnchors.test.ts  (29.7s)
6/6 passed in 30s
```

- `git diff --check` and staged whitespace check: clean. Existing files retain LF endings; no whole-file conversions.

## Not done, or unsure

- No outstanding implementation work. No live client, server or bot run: the brief requires model checks only. These checks do not establish live combat success, pacing or balance.
- The starter lesson uses the first Plains card after the shared Clearing gear beats, as the Striker does. Crosswind shares the Forest approach card; Eye of the Storm shares the Mountain boss card, so each line has an unfinished action and is visible to the resume engine.
- No dependency installation, server/client changes, push or merge.

## Files outside the brief I needed (not edited)

- `docs/guided-tutorial-current-state.md` still says there are no class builders, predating the already present Striker and Squire builders as well as this addition.
- `docs/bot-experiment-runner-current-state.md` still says `smoke-t1` is the only registered route. These broader documentation updates remain for the conductor.
