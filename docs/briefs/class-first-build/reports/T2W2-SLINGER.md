# T2-W2-SLINGER report
**Agent:** Claude (Sonnet)   **Branch:** rw/t2w2-slinger   **Last commit:** see `git log -1` (the report is committed on top of the code)

## Done
- **Visible T2 state (client).**
  - Loadout editor (`LoadoutEditor.tsx`): a discipline card above the rack (name and rule text from the kit; Gunslinger adds how the second gun is chosen; Trickshot lists the called shot's pick order, read-only, from `calledShot` or the default order). The T2 clips already appear through the kit-driven view (owned, rack, rules).
  - Clip strip / ammo ring (`ReloadMechanic.tsx`, `useMechanicViewModel.ts`, `types.ts`, `slingerClipColor.ts`, `mechanics.css`): Gunslinger's even rounds take the second gun's clip colour; Siege shows the banked shell as a number tag and an orange housing; Trickshot shows a gold "called" tag and housing when the last round is next (derived from ammo and reload state, no new data). The mobile row gets the same facts as a short tag and a second-gun swatch.
  - Minimal networking: `UsesReload` gets two optional fields, `twinClipId` (Gunslinger only) and `shellBank` (Siege only). They are absent for every other Slinger. Written with `mutateSlice` in `syncDisciplineHud` (end of `updateSlinger`), only when they change. `PlayerView` carries them as `reloadTwinClip` and `reloadShell`. `usesReload` was already in the network allowlist.
  - Statuses: Slinger wave 1 added no status ids (Snare II uses the existing slow, Tracer uses scratch state), so none owed.
- **Tutorial (`shared/src/tutorial/scripts/slinger.ts`).** After the farewell beat, the T2 stretch: per zone (Plains, Forest, Mountain, Swamp, Cave, Jungle, Desert) three beats: `t2:<zone>` (farm to the lesson level, read off the kit via `absoluteZoneLevel`), `slinger:<lesson>` (farm to the tier-2 cap; the lesson line) and `boss:<zone>:2` (tier-2 boss; the line names the trophy it ranks up or gives). The discipline pick line (Passive Tree: Gunslinger, Siege, Trickshot) rides `t2:plains`. Existing step and condition types only. All lines under the 170 cap.
- **Bot route `slinger-t2`** (`bot/src/routes/slingerT2.ts`, registered in `routes/index.ts`, test `slingerT2.test.ts`): the whole T1 route, then the discipline (`unlockSkill` of `slinger-<discipline>`, a route `choice` `slinger-discipline`, Gunslinger default, `--choices` picks others), then per T2 zone travel, farm to the tier-2 cap (same level the tutorial farms to, pinned by the test), `attemptBoss` tier 2. Loadout stays `auto`. Completion is T1 completion plus all seven tier-2 bosses. The runner has no discipline step of its own and needs none (`unlockSkill` on the tier-1 node).
- Wiring test: a block added to `server/test/slingerT2.test.ts` (twin clip, shell bank, neither without a discipline).

## Checks
- pnpm typecheck: clean
- pnpm test -- slinger tutorial classKits (plus statusRegistry, harness.test earlier): 20/20 passed for slinger/tutorial/classKits; harness.test passed in the earlier run.
- pnpm test -- statusRegistry: FAILS, but on other classes' ids (`ability-sidestep`, `conduit-bark`, `conduit-mark`, `squire-parry`, `apprentice-held`, `apprentice-withered`, `brittle`, `dot-frozen`...). No Slinger id is in the gap list. Those belong to the other wave-2 tasks.

## Not done, or unsure
- The farewell panel (the "Keep going forward ... spend it on a style" text) now shows after the T2 stretch, since the script runs on past the `farewell` beat. Its third line is stale for that moment; `farewell.ts` is outside my paths.
- The tutorial and route fight Plains..Desert bosses at tier 2 in that order. Whether T2 Jungle and Desert are reachable that early, and the real T2 boss names in the lines, are untested (no live run).
- No beat for the T2 gear jobs (Hunting Rifle, Long Rifle, Jungle and Desert lines): the brief asks for lessons, discipline and trophies.
- The called-shot order list in the editor is read-only (no edit helper in `loadoutView.ts`, outside my paths). Twin guns' second clip has no config field yet (wave-1 note), so the editor only says how it is chosen.
- The world ring (`slingerRing.ts`) was not given the discipline marks.
- `slinger-t2` is not in `CONTROLLED_ROUTE_IDS` (one-off runs need `--controlled=false`); the conductor decides.
- No browser or bot run.

## Files outside the brief I needed (edited)
- `shared/src/tutorial/tutorial.test.ts` (SLINGER_TAIL now includes the T2 beats; assertions for them) and `bot/src/routes/slingerT1.test.ts` (its tutorial-level helper now skips tier-2 farms).
