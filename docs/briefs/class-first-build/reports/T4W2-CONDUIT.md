# T4W2-CONDUIT report
**Agent:** Claude (Sonnet)   **Branch:** rw/t4w2-conduit   **Last commit:** see `git log -1`

## Done
- **Statuses.** Client entries (help, badge, icon alias to existing art; no art touched) for `conduit-ice-shell`, `conduit-withdraw`, `conduit-last-stand`, `conduit-fall-back`, `conduit-seal`. All carry on summons (the seal also on you), so each got four `ACCEPTED_GAPS` lines in `server/scripts/statusAudit.ts`, same reason as `conduit-bark`. The player-side Pressure Seal has no tile (stated in its gap line).
- **Formation view/editor.** `FormationView.leaf` (name and rule of the picked T4 leaf, from a new optional `unlockedSkills` on `ClassScreenInput`); `useFormationView` passes `unlockedSkillsAtom`; the editor shows it under the specialization. Test added to `formationView.test.ts`.
- **Leaf pick.** `SkillTreePanel` already lists tier-3 nodes (the T4 leaves) filtered by the picked discipline (`LAST_TIER = 3`), and the tree holds the nine Conduit leaves under their disciplines; no fix needed.
- **Tutorial.** `buildConduitT4Beats()` after the T3 stretch: the leaf line, then per zone (Mountain, Tundra, Jungle, Desert, Volcanic, Graveyard, Trench) three beats (farm to the T4 lesson, farm to the cap with the lesson line, the boss), and `t4:done`. Soul rank-ups and the two new Souls (Charnel-Crown, Elder Serpent) are said in the beat after the boss. Existing step types only. `tutorial.test.ts` extended.
- **Bot route.** `bot/src/routes/conduitT4.ts` (`conduit-t4`): the T3 route unchanged, a wait for the tier-4 promotion, `unlockSkill` of the leaf (default `conduit-avenge`, under Pack; `conduitT4Route(leafId)` takes any), then travel, farm to the T4 cap and `attemptBoss` tier 4 for the seven zones. Registered in `routes/index.ts`, not in `CONTROLLED_ROUTE_IDS`. Test `conduitT4.test.ts`.

## Checks
- pnpm typecheck: clean
- pnpm test -- conduit tutorial statusRegistry classKits formation classScreen: 28/30 before the fixes below; after: `conduitT4`, `conduitT3`, `formation`, `tutorial`, `classScreen` 11/11 passed. `statusRegistry` still fails, only on Slinger's `debuff-immune` (not mine; no `conduit-*` line remains).

## Not done, or unsure
- Biome name: the kit and tutorial use `graveyard` (the plan says Wasteland), as in T4-CONDUIT.
- No discipline/leaf condition in the tutorial vocabulary, so the T4 line waits only on the Mountain T4 lesson level, not on the pick.
- The Mirage, husks and Burst waves have no body or FX; no HUD strip for Fall Back, Last Stand or seals beyond help text.
- Colossus double-count and the missing Two Souls cost remain as noted before. `conduit-t4` is untested live; the promotion wait farms Volcanic T3 with `pick: "uncleared"` (same worry as T3).

## Files outside the brief I needed (edited)
- `shared/src/classKits/view.ts` (`unlockedSkills` on the input), `shared/src/classKits/formationView.ts` (+ test), `shared/src/tutorial/tutorial.test.ts`, `server/scripts/statusAudit.ts`.
