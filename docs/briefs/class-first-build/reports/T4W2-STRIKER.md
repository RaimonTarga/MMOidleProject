# T4W2-STRIKER report
**Agent:** Claude (Sonnet 5.5)   **Branch:** rw/t4w2-striker   **Last commit:** ac6a3fc0 (code commit; this report follows)

## Done
- **Visible:** `OrderEditor.tsx` shows the picked leaf (name and text, from `unlockedSkillsAtom` and `STRIKER_KIT.leaves`) under the specialization, or a hint to pick one in the Passive Tree at tier 4. No new status ids (T4 Task 1 added none), so no client status entries; `statusRegistry` lists no Striker row. `SkillTreePanel` already lists the discipline's three leaves at tree tier 3 (read, not browser-run).
- **Tutorial:** `buildStrikerTierFourBeats()` after the T3 stretch (ids `striker4:<zone>[-lesson|-boss]`) over mountain, tundra, jungle, desert, volcanic, graveyard (Wasteland), trench. First line points at the leaf pick; lessons name the seven T4 techniques; boss lines name Skyfall/Hoarfrost/Pounce/Verdict/Eruption ranks and the new Grave Toll and Deep Pressure. Existing step types only.
- **Routes:** `bot/src/routes/strikerT4.ts`, `striker-t4-<leaf>` x9: the discipline's first-specialization T3 route, wait for the tier-4 promotion, `unlockSkill <leaf>`, then each T4 zone travel, farm to `biomeLevelCap(4, zone)`, `attemptBoss` tier 4. Registered; not in `CONTROLLED_ROUTE_IDS`.
- Tests: `bot/src/routes/strikerT4.test.ts`; `tutorial.test.ts` and `strikerT1.test.ts` updated for the `striker4:` stretch.

## Checks
- pnpm typecheck: clean
- `pnpm test -- strikerT4 tutorial strikerT1 strikerT2 strikerT3`: 10/10 passed; `shared/src/tutorial`: passed.
- `statusRegistry` fails only on other classes' ids (conduit-*, debuff-immune); no Striker row.

## Not done, or unsure
- The leaf does not depend on the specialization, so each route takes the discipline's first specialization; the other 2 specializations x 3 leaves are not separate arms.
- Immovable's knockback hook (conductor, from T4-STRIKER) is untouched. No Unbreakable/Ghoststep HUD callout; Bloodrush still shares the Focus tile.
- Route not run live; the tier-4 promotion wait farms Volcanic at tier 3 (assumed satisfied after the T3 zones).
- Client verified by typecheck only.

## Files outside the brief I needed (not edited)
- none
