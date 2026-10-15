# T3W2-CONDUIT report
**Agent:** Claude (Sonnet)   **Branch:** rw/t3w2-conduit   **Last commit:** see `git log -1` (report committed on top of the code commits)

## Done
- **Statuses.** Client entries (help, target badge, icon alias to existing art; no art touched) for `conduit-horn`, `conduit-burn-bright`, `conduit-hibernate`, `conduit-spore`, `conduit-hunt`. Spore and Hunt sit on enemies and pass the audit cleanly. Horn, Burn Bright and Hibernate sit on SUMMONS, which the audit reads as an unknown carrier (the same read as `conduit-bark` in T2W2), so I added four `ACCEPTED_GAPS` entries each in `server/scripts/statusAudit.ts`, with reasons. The honest fix is still an audit rule for minion carriers (conductor's call).
- **Formation view and editor.** `FormationView` gains `specialization` (name and rule text, shown under the discipline line) and `souls` (one entry per relic slot, so two with Two Souls; `soul` stays the first). Piece cards are now priced with the specialization (Colossus: +1 Command per summon on its card, matching `rosterCommand`; the pip total already carried Colossus's +1 room from the class context). The client got a `specializationIdAtom` (set from `player.specializationId`) that `useFormationView` and `useClassScreen` pass through, so the client check equals the server's. The editor lists every Soul slot ("Souls" heading when two) with its rank.
- **Specialization pick.** Checked `SkillTreePanel.tsx`: tier 2 nodes (displayed Tier 3) are filtered by the picked discipline, and the tree really holds the nine Conduit specializations (3 per discipline), so no fix was needed.
- **Tutorial (job 2).** `buildConduitT3Beats()` appended after the T2 stretch: the specialization line, then per zone (Mountain, Cave, Swamp, Jungle, Desert, Tundra, Volcanic) three beats (farm to the T3 lesson level, farm to the cap with the lesson line, the T3 boss), and `t3:done`. Soul rank-ups (Mountain 3, Cave and Swamp last rank, Jungle and Desert 2) and the new Rime-Mammoth and Magma Salamander Souls are said in the beat after the boss. `t2Farm` takes an optional tier. Existing step and condition types only.
- **Bot route (job 3).** `bot/src/routes/conduitT3.ts` (`conduit-t3`): the T2 route unchanged, a wait for the tier-3 promotion, `unlockSkill` of the specialization (default `conduit-the-hunt`, under Pack; `conduitT3Route(id)` takes any of the six Pack/Swarm/Elite ones), then travel, farm to the T3 cap and `attemptBoss` tier 3 for the seven zones. Registered in `routes/index.ts`, NOT in `CONTROLLED_ROUTE_IDS`. Test `conduitT3.test.ts` (route shape, the guide's farm levels match, pick is a real tier-2 node under the discipline).
- Tests extended: `formationView.test.ts` (specialization, Colossus pricing and room, Two Souls slots), `tutorial.test.ts` (the T3 tail and gates).

## Checks
- pnpm typecheck: clean
- pnpm test -- conduit tutorial statusRegistry classKits formation classScreen harness: 28/29 passed. The one failure is `statusRegistry.test.ts`, whose open gaps are now only other classes' ids (`dot-chill`, `slinger-*`, `squire-frostward`, `squire-rampage`); no `conduit-*` line remains.
- conduitT3 (server and bot), conduitT2, conduitT1, formationView, tutorial: pass.

## Not done, or unsure
- **Two Souls second Soul's Command cost** and **Colossus "grow huge"** remain missing from T3-CONDUIT (no data); the editor shows the second Soul but cannot pick it (Soul choice is still display only, as for the first).
- **Colossus is counted twice by design of the conductor's context commit**: the budget gets +1 (`classConfigContext`) AND every summon costs +1 more in `disciplineCommandCost` (+2 under Elite). The bible says only "summons cost another +1 Command". Worth a look; I did not change it.
- **No discipline/specialization condition in the tutorial vocabulary**, so the T3 line waits only on the Mountain T3 lesson level, not on the pick (same limit as T2).
- A Conduit HUD strip for T3 state (fight clock, Hunt marks, Hibernate) was not added; the T3 reports owed none for the Conduit.
- `conduit-t3` is registered but untested live. A route-level worry: the tier-3 promotion is waited for by farming the Desert T2 zone with `pick: "uncleared"`; if all T2 nodes are cleared the picker may have nothing to choose (T2 route has the same shape at T1).
- The shared `atoms.ts` edit (`specializationIdAtom`) will likely collide with the same addition by other classes' T3W2 tasks; keep one.

## Files outside the brief I needed (edited)
- `shared/src/classKits/formationView.ts` (+ test), `shared/src/tutorial/tutorial.test.ts`, `server/scripts/statusAudit.ts`, `client/src/hud/atoms.ts`.
