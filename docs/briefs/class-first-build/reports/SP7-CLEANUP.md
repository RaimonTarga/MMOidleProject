# SP7-CLEANUP report

**Agent:** Codex   **Branch:** rw/sp7-cleanup   **Last commit:** `94cdc273` (implementation; this report is committed on top)

## Done

- Removed `energy/frameLoop.ts`, the entire `energy/t3/` tree and `energyPrototype.ts`. The energy module now registers `registerSpirit` and ticks `updateSpirit` only. No per-hit gain, full-bar discharge, energy empowered-multiplier registration, old mechanic-fired emitter or Thresholds bypass remains.
- Preserved the storm runtime in `energy/spirit.ts` without behaviour or number changes (only obsolete comments removed). `UsesEnergy` now contains only `energy` and `energyMax`; `PlayerView.energyCount` / `energyMax` stay. Storm sizing remains in `stormMaxFor` / `updateSpirit`; recalc no longer clamps the bottle using the old Voidwalker/relic calculation.
- Deleted shared `energyMax.ts` and `energyUpkeep.ts`, their exports and the energy relic profile, preview, secondary-effect scaling and empowered-multiplier readouts. Removed unused energy passive keys and old buff ids. The two keys with readers outside the allowed paths are listed below.
- Removed Flash wire fields, HUD atoms, shift presentation, afterimages, old energy aura/bespoke-path readers and orphaned status help/icon registrations. The existing meter still renders the authoritative storm pool. Its label/help no longer describe per-hit charging or an empowered discharge. Thresholds editing and floor/band overlays belong to SP5 and were not added here.
- Removed the obsolete Spirit energy-cycle and T3 calculations, frequency text and formula notes from `tools/dps-report.ts` (a DPS bench readout under the inherited readout scope). Its output now states that Threshold spends are not modeled. No reporting test was removed.
- Removed the fictitious per-hit discharge cycle from the DPS estimate; its caveat says that Threshold spends depend on flow, floor and bands. Removed energy relic readouts from crafting, the bench and bot snapshots. Historical T4 bench labels remain inert, with removed state columns reported as null/zero rather than accessing deleted fields.
- Added storm regression assertions for recalc preserving the live pool, no hit gain even without Thresholds, no empowered registration/proxy and no legacy relic/multiplier readout. Added a DPS readout assertion against a fictitious discharge cycle.

### Files and lines by area

Counts below are the implementation diff against the clean starting commit `8e43ce0f`, excluding this report. Each modified file retains its original LF or CRLF endings.

| Area | Files | Lines added | Lines deleted |
| --- | ---: | ---: | ---: |
| Bench and bot readouts | 5 | 18 | 213 |
| Client readouts and FX | 21 | 21 | 595 |
| Server runtime | 19 | 4 | 1992 |
| Server tests | 7 | 34 | 101 |
| Shared state, profiles and views | 17 | 27 | 430 |

### Removed test assertions

No test file was deleted. These tests retain their other coverage:

- `server/test/attackProgression.test.ts`: removed the two legacy Spirit attack replacements and nine Spirit specialization FX entries from the retained-path count (36 to 27).
- `server/test/combatTextCoverage.test.ts`: removed the Alternating Currents tick/text block and its import.
- `server/test/coreRelicIntegration.test.ts`: removed energy per-hit/capacity profile, frequency-to-DPS, Flash preview and Surge buff-preview assertions. Other classes and generic secondary-rating attribution remain.
- `server/test/describeText.test.ts`: replaced the removed Overdrive flag fixture with the existing `dot.frenzy` flag; kept the same Enabled assertion.
- `server/test/mechanicFired.test.ts`: removed the old energy-discharge emission block.
- `server/test/relicMechanicEffectCoverage.test.ts`: removed Tempest / Endless Storm damage, duration, extension and preview scaling assertions; kept the other classes.
- `shared/src/systems/relics.test.ts`: removed the energy frequency, capacity and discharge profile block.
- `shared/src/systems/mechanicEffectScaling.test.ts`: replaced retired Overdrive fixtures with retained Frenzy / attack-speed fraction fixtures; all generic scaling and unregistered-field assertions remain.
- `shared/src/systems/dpsEstimate.test.ts`: removed energy per-hit passives and its retired discharge premium over ordinary attacks; preserved generic estimator checks and added the Threshold-spend caveat check.

## Checks

- `pnpm typecheck`: clean (workspace, bench and test typechecks; exit 0).
- `TEST_JOBS=2 pnpm test -- spirit energy thresholdsView status hudStatus recovery bleed classAffinity`: **`9/9 passed in 95s`**. This includes `spiritStorm`, `spiritKit`, `thresholdsView`, `statusRegistry`, `classAffinity`, `hudStatusTooltips` and recovery checks.
- Final `pnpm test`: **`348/348 passed in 584s`** (exit 0, no FAIL). Run here, not in `../mmo-rw-verify`, because the user explicitly restricted work to this folder.
- `git diff --check`: clean. All 51 modified source/test files retain their original LF/CRLF endings. A TypeScript AST comparison with comments removed confirms that `energy/spirit.ts` has unchanged executable source.
- First full run: **`346/348 passed in 933s`**. Its failures were `reportTools.test.ts` (a removed max-energy helper still used by the DPS bench readout) and `mechanicEffectScaling.test.ts` (generic scaling fixtures still using removed Overdrive). Both were repaired; targeted and final results supersede this intermediate run.
- Targeted reporting check after the tool cleanup: **`1/1 passed in 41s`**. Combined `pnpm test -- reportTools mechanicEffectScaling`: **`2/2 passed in 33s`**.
- Initial focused pass was 8/9: only the status audit failed on orphaned energy icon registrations. Those registrations were removed; the final results above supersede that intermediate failure.
- No install, dependency changes, server/bot run, merge or push. No browser or balance claim.

## Not done, or unsure

- Kept `energy.flash`: the ranged-combatant predicate and server AI still read it. The shared view still supplies `flashActive` to that predicate. No current skill-tree node authors this key and the removed energy runtime cannot activate Flash. Removing this compatibility branch requires the files in the next section.
- Kept `energy.range-mid-discharge-stagger-ms`: `combat/rangeMechanics.ts` still reads it. No current skill-tree node authors it and Spirit no longer produces the empowered-discharge trigger. The old far-range key had no remaining code reader and was removed.
- Kept the server-only `InAcChargePhase` / `InAcDischarge` shapes, exports, entity slots, expiry invariant and lifecycle detaches: their writer was removed with `energy/t3/`, but removing the unused markers crosses into ECS/world lifecycle files outside the allowed paths.
- Kept the generic `PlayerView.aura` contract (now null from the view composer), generic aura renderer and empty server-aura registry, because other/future class presentation can use the same channel. Reload momentum still uses the buff-aura path.
- Kept physical artwork and reusable lightning FX primitives (`fxLightning`, `arcDischarge`, `lightningDagger`, `equinoxArc`, etc.). The `energy-overcharge` icon asset registration remains because the generic attack-buff icon aliases it. This does not retain its old buff id or writer.
- Kept historical packet/fixture ids, inert T4 bench arm labels and raw column names. They are historical declarations, not current balance evidence. The generic empowered helpers keep their shared flags/API for other classes.

## Files outside the brief I needed (not edited)

- `shared/src/data/skillTree/roots.ts`, `server/src/systems/combat/ai/targetPriority.ts`: remaining Flash-aware ranged-classification inputs.
- `server/src/systems/combat/rangeMechanics.ts`: remaining legacy mid-range stagger reader and old energy frame-loop comment.
- `server/src/ecs/entity.ts`, `server/src/ecs/markerInvariants.ts`, `server/src/admin/gameActions.ts`, `server/src/systems/world/spawning/index.ts`, `server/src/systems/world/playerIncapacitation.ts`: remaining AC marker slots/invariant/cleanup; shared marker shapes and exports were kept with them.
- `server/scripts/night3Preflight.ts`, `server/scripts/volcanoFinishPreflight.ts`: historical scripts outside typecheck still import removed energy relic/max helpers. They already contain imports retired by earlier rework tasks; they were not run or repaired.
- `server/scripts/statusAudit.ts`: obsolete `frame.energy.window` alias is ignored now that its descriptor is gone; left outside scope. The audit is still required to pass.
- `server/src/systems/combat/engine/mechanicFired.ts`: historical comment still names `energyPrototype.ts`; its energy emitter was deleted. No dispatch behaviour changed.
- Living design/state docs and `docs/briefs/class-first-build/STATUS.md`: left for the conductor/documentation pass.

### Complete implementation file inventory

| Area | File | Added | Deleted |
| --- | --- | ---: | ---: |
| Bench and bot readouts | bot/src/telemetry/t1Snapshots.ts | 0 | 4 |
| Bench and bot readouts | server/bench/balance/progression.ts | 0 | 4 |
| Bench and bot readouts | server/bench/balance/t4ScalingMitigationProbe.ts | 1 | 2 |
| Bench and bot readouts | server/bench/balance/t4ScalingStudy.ts | 3 | 3 |
| Bench and bot readouts | tools/dps-report.ts | 14 | 200 |
| Client readouts and FX | client/src/fx/aura.ts | 4 | 48 |
| Client readouts and FX | client/src/fx/bespoke/spirit.ts | 0 | 237 |
| Client readouts and FX | client/src/fx/bespokePaths.ts | 0 | 2 |
| Client readouts and FX | client/src/hud/atoms.ts | 0 | 12 |
| Client readouts and FX | client/src/hud/mechanics/CompactMechanic.tsx | 3 | 3 |
| Client readouts and FX | client/src/hud/mechanics/EnergyMechanic.tsx | 5 | 26 |
| Client readouts and FX | client/src/hud/mechanics/mechanicHelp.tsx | 3 | 6 |
| Client readouts and FX | client/src/hud/mechanics/types.ts | 0 | 4 |
| Client readouts and FX | client/src/hud/mechanics/useMechanicViewModel.ts | 2 | 15 |
| Client readouts and FX | client/src/hud/stat/statHelp.ts | 0 | 19 |
| Client readouts and FX | client/src/hud/statusHelp.ts | 0 | 17 |
| Client readouts and FX | client/src/hud/targetStatusMeta.ts | 0 | 2 |
| Client readouts and FX | client/src/render/combatFx.ts | 0 | 35 |
| Client readouts and FX | client/src/render/destroy.ts | 0 | 2 |
| Client readouts and FX | client/src/render/movementEffects.ts | 0 | 125 |
| Client readouts and FX | client/src/render/players.ts | 2 | 13 |
| Client readouts and FX | client/src/render/state.ts | 0 | 2 |
| Client readouts and FX | client/src/scenes/game/sceneSetup.ts | 0 | 2 |
| Client readouts and FX | client/src/ui/conceptIcons.ts | 0 | 18 |
| Client readouts and FX | client/src/ui/crafting/itemDisplay.ts | 0 | 5 |
| Client readouts and FX | client/src/ui/describe/passiveText.ts | 2 | 2 |
| Server runtime | server/src/ecs/playerEntityFormulas.ts | 1 | 11 |
| Server runtime | server/src/systems/classes/archetypes/energy/energyPrototype.ts | 0 | 145 |
| Server runtime | server/src/systems/classes/archetypes/energy/frameLoop.ts | 0 | 282 |
| Server runtime | server/src/systems/classes/archetypes/energy/index.ts | 2 | 16 |
| Server runtime | server/src/systems/classes/archetypes/energy/spirit.ts | 1 | 5 |
| Server runtime | server/src/systems/classes/archetypes/energy/t3/core/buffs.ts | 0 | 223 |
| Server runtime | server/src/systems/classes/archetypes/energy/t3/core/constants.ts | 0 | 106 |
| Server runtime | server/src/systems/classes/archetypes/energy/t3/core/helpers.ts | 0 | 42 |
| Server runtime | server/src/systems/classes/archetypes/energy/t3/core/selectors.ts | 0 | 41 |
| Server runtime | server/src/systems/classes/archetypes/energy/t3/index.ts | 0 | 56 |
| Server runtime | server/src/systems/classes/archetypes/energy/t3/pipeline/afterHit.ts | 0 | 188 |
| Server runtime | server/src/systems/classes/archetypes/energy/t3/pipeline/beforeAttack.ts | 0 | 115 |
| Server runtime | server/src/systems/classes/archetypes/energy/t3/pipeline/empoweredHit.ts | 0 | 189 |
| Server runtime | server/src/systems/classes/archetypes/energy/t3/pipeline/normalHit.ts | 0 | 180 |
| Server runtime | server/src/systems/classes/archetypes/energy/t3/ticks/alternatingCurrents.ts | 0 | 100 |
| Server runtime | server/src/systems/classes/archetypes/energy/t3/ticks/energyState.ts | 0 | 125 |
| Server runtime | server/src/systems/classes/archetypes/energy/t3/ticks/flash.ts | 0 | 147 |
| Server runtime | server/src/systems/combat/buffs/buffSync.ts | 0 | 12 |
| Server runtime | server/src/systems/combat/engine/empoweredAttacks.ts | 0 | 9 |
| Server tests | server/test/attackProgression.test.ts | 1 | 3 |
| Server tests | server/test/combatTextCoverage.test.ts | 1 | 13 |
| Server tests | server/test/coreRelicIntegration.test.ts | 4 | 17 |
| Server tests | server/test/describeText.test.ts | 1 | 1 |
| Server tests | server/test/mechanicFired.test.ts | 0 | 17 |
| Server tests | server/test/relicMechanicEffectCoverage.test.ts | 3 | 49 |
| Server tests | server/test/spiritStorm.test.ts | 24 | 1 |
| Shared state, profiles and views | shared/src/components/archetypes/energy/usesEnergy.ts | 3 | 47 |
| Shared state, profiles and views | shared/src/components/combat/buffs.ts | 0 | 15 |
| Shared state, profiles and views | shared/src/index.ts | 0 | 2 |
| Shared state, profiles and views | shared/src/passives.ts | 2 | 89 |
| Shared state, profiles and views | shared/src/protocol/tier1Snapshot.ts | 0 | 4 |
| Shared state, profiles and views | shared/src/protocol/views.ts | 1 | 43 |
| Shared state, profiles and views | shared/src/systems/dpsEstimate.test.ts | 6 | 2 |
| Shared state, profiles and views | shared/src/systems/dpsEstimate.ts | 3 | 20 |
| Shared state, profiles and views | shared/src/systems/empoweredMult.ts | 6 | 17 |
| Shared state, profiles and views | shared/src/systems/energyMax.ts | 0 | 35 |
| Shared state, profiles and views | shared/src/systems/energyUpkeep.ts | 0 | 84 |
| Shared state, profiles and views | shared/src/systems/mechanicEffectScaling.test.ts | 5 | 5 |
| Shared state, profiles and views | shared/src/systems/mechanicEffectScaling.ts | 0 | 3 |
| Shared state, profiles and views | shared/src/systems/relicEffectPreview.ts | 0 | 7 |
| Shared state, profiles and views | shared/src/systems/relicPreview.ts | 1 | 16 |
| Shared state, profiles and views | shared/src/systems/relics.test.ts | 0 | 8 |
| Shared state, profiles and views | shared/src/systems/relics.ts | 0 | 33 |
