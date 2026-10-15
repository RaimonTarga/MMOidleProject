# T3W2-SLINGER report
**Agent:** Claude (Sonnet)   **Branch:** rw/t3w2-slinger   **Last commit:** see `git log -1` (the report is committed on top of the code)

## Done
- **Statuses (client entries + tiles).** `slinger-burn`, `slinger-deathmark` (target frame: help, badge, icon alias), `slinger-fan-the-hammer`, `slinger-entrenched` (player buff-bar tiles: `BUFF_IDS`, new `reload/slingerBuffs.ts` `defineBuff` descriptors registered in the reload module, help, badge, class-piece icon stand-in). Also `dot-chill` (Frost) target help and badge, which the audit reported. Icons are existing ids (stand-ins, the designer swaps): burn -> `debuff-dot`, deathmark -> `shatter-vulnerable`, the two buffs -> the Guard class-piece icon. No art made.
- **Visible state.** Loadout editor: a specialization card under the discipline card (name, kit text, one tip line; or "pick a specialization in the Passive Tree" at tier 3+ with none picked). Rime Round's frozen ground is networked the minimal way (`UsesReload.rimeX/rimeY/rimeRadius`, written with `mutateSlice` in `syncDisciplineHud` only on change, absent when thawed; `PlayerView.reloadRime`) and drawn by `slingerRing.ts` as a pale disc on the ground band. Deathmark marks show on target frames through the new status entry; Entrenched and Fan show on the buff bar.
- **Specialization pick.** `SkillTreePanel` already lists a discipline's three specializations (tier 2 nodes filtered by `disciplineId`); the Slinger nodes come from the kit, so no change needed (checked, not edited).
- **Tutorial T3 stretch** (`shared/src/tutorial/scripts/slinger.ts`): after the T2 stretch, per T3 zone three beats (`t3:<zone>` approach, `slinger:<lesson>` farm to the tier-3 cap, `boss:<zone>:3`): Mountain (Stopping II, Quake III), Cave (Seeker, Splinter III), Swamp (Acid, Rot III), Jungle (Tracer II, Hunter's II), Desert (Tether, Bounty II), Tundra (Frost, Rime Round), Volcanic (Incendiary, Cinder Round). The specialization pick line rides `t3:mountain`. The T2 beat builder was generalised to `zoneBeats(zones, tier)`; T2 ids unchanged. Existing step/condition types only. `tutorial.test.ts` extended.
- **Bot route `slinger-t3`** (`bot/src/routes/slingerT3.ts`, registered in `routes/index.ts`, not in `CONTROLLED_ROUTE_IDS`, test `slingerT3.test.ts`): the whole T2 route, then `unlockSkill` of the specialization (route choice `slinger-specialization`, default `fan-the-hammer`), then the seven T3 zones: travel, farm to the tier-3 cap (pinned equal to the tutorial's), `attemptBoss` tier 3. For another discipline pass both choices, e.g. `--choices '{"slinger-discipline":"siege","slinger-specialization":"deathmark"}'`; the test checks every of the nine pairs resolves to one pick.
- Wiring tests added to `server/test/slingerT3.test.ts`: Rime on the view and thawing, Fan and Entrenched on the buff bar.
- Tiny audit fix: `burn.ts` and `t3.ts` now pass `target.tracksCombat` / `player.tracksCombat` inline so the status audit can tell the carrier (no behaviour change).

## Checks
- pnpm typecheck: clean
- pnpm test -- slinger tutorial classKits loadout harness: 24/24 passed (includes slingerT3 server + bot route, slingerT2/T1, tutorial.test)
- pnpm test -- statusRegistry: no Slinger id is in the gap list any more. It still FAILS on other classes' ids only: `conduit-burn-bright/hibernate/horn/hunt/spore`, `squire-frostward/rampage`.
- `git diff --numstat`: no whole-file line-ending changes.

## Not done, or unsure
- No browser or bot run; the Rime disc, the specialization card and the route are untested live. The Rime disc has no fade-out and no timer (shows until the server drops it).
- Spec tips in the editor are my own short lines (text only, no numbers); the designer may want to reword.
- The new atom is named `slingerSpecializationIdAtom` (not a generic `specializationIdAtom`) so other classes' T3-W2 branches adding a generic one do not collide on merge; the conductor can fold them.
- The T3 route's default spec only matches the default discipline; picking a different discipline without also passing a matching specialization makes the server refuse the unlock step.
- Farewell panel text is still stale after the T2/T3 stretches (conductor's `TutorialPanel`/`farewell.ts`).
- No beats for the T3 gear jobs (Frostlock Rifle, Firebrand Pistol, Warm Hands, Thaw, Asbestos Coat, Heatsink), only lessons, specialization and trophies.
- Fan the Hammer and Entrenched reuse the Guard icon; burn and deathmark reuse existing target icons (stand-ins).

## Files outside the brief I needed (edited)
- `shared/src/tutorial/tutorial.test.ts` (SLINGER_TAIL gains the T3 beats), `server/src/systems/classes/slinger/burn.ts` and `t3.ts` (audit carrier fix, one line each), `server/src/systems/classes/archetypes/reload/slinger.ts` and `server/src/systems/classes/slinger/t3.ts` (Rime HUD sync), `shared/src/protocol/views.ts` and `shared/src/components/archetypes/reload/usesReload.ts` (the networked field), `client/src/hud/atoms.ts` (the atom).
