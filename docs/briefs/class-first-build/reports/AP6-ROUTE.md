# AP6-ROUTE report
**Agent:** Codex   **Branch:** rw/ap6-route   **Last commit:** 448e71e541831715c22bd2699c2e8efbe28f7728 (implementation; this report follows it)

## Done

- Added the Apprentice tutorial builder in `shared/src/tutorial/scripts/apprentice.ts`, registered as `TUTORIAL_CLASS_BEATS['dot-root']`.
- Built on `buildSealRouteBeats()`. The shared opening, original seal-route beat ids, zone order, chapters, two seals and farewell remain. New beat ids are kebab-case. No step or condition types were added.
- Split the Plains, Forest, Swamp and Cave farms at `LESSON_ZONE_LEVEL` (2). The payoff line appears when that lesson is learned, then the next farm continues to the original tier cap. Added a Mountain approach to learn Seize before the second seal. That approach also accepts an existing Mountain boss clear on resume.
- Every Apprentice line is shorter than 170 characters. Numb and Converge are described as learned payoffs; the copy does not claim that auto mode places either of them.

Beats after the shared opening:

| Beat | Where it sits and what it teaches |
|---|---|
| `open:plains` | First class line: plain wand, Sigils 4 as pips on enemies, full means Detonate in Payoff rules. Farms to Plains 2. |
| `apprentice-spread-lesson` | At Plains 2: full and two or more enemies near means Spread, otherwise Detonate. Continues to the Plains cap. |
| `boss:plains` | The original first-seal fight and altar instructions. No trophy is configured before this boss. |
| `zone:forest` | After the first boss: the base kit won; Outbreak makes Spread reach two neighbours. Farms to Forest 2. |
| `apprentice-numb-lesson` | At Forest 2: Numb spends sigils to slow attacks and movement. Continues to the Forest cap. |
| `zone:swamp` | Original Swamp introduction and poison concept; farms to Swamp 2. |
| `apprentice-siphon-lesson` | At Swamp 2: Siphon spends sigils to heal you when health is low. Continues to the Swamp cap. |
| `zone:cave` | Original Cave introduction; farms to Cave 2. |
| `apprentice-converge-lesson` | At Cave 2: Converge draws nearby enemies' sigils onto the target, even past its cap. Continues to the Cave cap. |
| `apprentice-mountain-approach` | Farms the Mountain to its level-2 lesson before the second seal. |
| `boss:mountain` | Seize spends sigils to break a wind-up, followed by the original second-seal and altar directions. |
| `farewell` | Original line and tier-2 wait, unchanged. |

Added `bot/src/routes/apprenticeT1.ts`: `apprentice-t1`, version `1.0.0`, class root `dot-root`, registered in `ROUTES` and `CONTROLLED_ROUTE_IDS`. Another class cannot override it.

The route has 17 steps:

1. Travel to the Clearing and farm the tier-0 quest until tier 1.
2. Choose `dot-root`, then send a `classConfig` in auto mode, with an empty Payoffs placement list and no relic. The shared validator accepts this for a fresh Apprentice; resolution gives full -> Detonate. The server adds the owned defaults as lessons arrive: Spread before Detonate with the two-enemy condition, Seize on a wind-up, and Siphon on low HP. Outbreak is equipped only after the first seal.
3. Farm Plains to the tier cap and attempt its tier-1 boss.
4. Farm Forest, Swamp and Cave to their tier caps, following `T1_BIOME_ORDER` with the seals in the guide's positions.
5. Farm Mountain to level 2, attempt its tier-1 boss, then wait for tier 2.

Completion requires both seal boss clears and tier 2. The 14 milestones cover tier 1, class selection, each zone's lesson and terminal farm level, both seals, and tier 2.

Added `bot/src/routes/apprenticeT1.test.ts` to check registration, class isolation, the controlled-route allowlist, fresh and progressively learned auto defaults, route/guide farm parity, seal order, completion, milestones, line lengths, lesson timing from the kit's own lesson sources, and resume through the farewell.

## Checks

- `pnpm typecheck`: clean, including workspace, bench and server-test compilation. Repeated before the report commit as required by AGENT-RULES.
- `pnpm test -- tutorial apprenticeT1 strikerT1 smokeT1`:

```text
PASS  shared/src/tutorial/tutorial.test.ts  (9.3s)
PASS  bot/src/routes/strikerT1.test.ts  (17.5s)
PASS  bot/src/routes/apprenticeT1.test.ts  (20.0s)
PASS  server/test/tutorialAnchors.test.ts  (23.7s)
PASS  bot/src/routes/smokeT1.test.ts  (27.4s)
5/5 passed in 27s
```

- `pnpm test -- harness.test` (the existing test walks the route registry):

```text
PASS  bot/src/harness.test.ts  (16.1s)
1/1 passed in 16s
```

- `git diff --check` and staged whitespace checks: clean. Existing files retained their LF endings; their diffs are limited to registration and the authorized assertion update.
- No dependency installation, server launch, bot run, merge or push.

## Not done, or unsure

- No live client or bot run, as permitted by the brief. These checks validate script resolution and route/config data; they do not establish combat wins, pacing or live UI acceptance. The base-kit victory line is tutorial copy, not a measured result.
- The class introduction follows the shared opening, including its charm and boots, as in the Striker reference. The shared opening still crafts/equips the generic Clearing club; class selection unlocks the Plain Wand recipe but does not equip it. The requested plain-wand introduction is present, but this task does not change opening equipment or add gear progression to the Striker-style bot route.

## Files outside the brief I needed (not edited)

- **User-authorized exception, edited:** `shared/src/tutorial/tutorial.test.ts`, one assertion only. Its exact builder list was `cadence-root,cooldown-root`; the user explicitly authorized adding `dot-root`. All existing script-resolution and checklist coverage remains in place.
- `shared/src/tutorial/scripts/opening.ts`: left unchanged; owns the generic Clearing equipment noted above.
- `docs/guided-tutorial-current-state.md` and `docs/bot-experiment-runner-current-state.md`: left unchanged. Their summaries still say no class builders / only `smoke-t1`; those statements were already stale relative to Striker and Squire before AP6.
