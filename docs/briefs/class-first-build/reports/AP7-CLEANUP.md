# AP7-CLEANUP report

**Agent:** Codex   **Branch:** rw/ap7-cleanup   **Last commit:** `8a3690e3` (this report follows)

## Done

Implementation: `127ed480`; final retained-Tundra fixture alignment: `8a3690e3`.

- Removed `dot/frameLoop.ts` and all of `dot/t3/`: conversion, frame/range delivery, path listeners, tick drivers, buffs, old effect projections and the relic delivery profile. The `dot.*` passive registry and its obsolete help text are gone.
- Removed the T3 listener that still reduced direct-hit damage even for Payoff characters; the sigil regression now asserts full direct damage.
- Kept `sigils.ts`, `index.ts`, the class tick loop and the monster-to-player DoT listener. `DOT_EFFECT_ID` now lives in `server/src/systems/classes/archetypes/dot/constants.ts`. The existing sigil parameters and payoff rules are unchanged; the old `data.sigil` discriminator is gone.
- Class ticks, the DoT inventory, AI projections and environmental stack ticks use `computeLinearDotDamage`. Removed `computeScaledDotDamage` and Eternal Doom's formula. `tickDamage.ts` keeps no plating, half DR, monster DoT resistance, shared debuffs and final damage.
- Removed the old range spread/cap/lifetime extensions; old AppliesDots bookkeeping; the ChillsTarget, HasConflagration and HasSmolder components; chill network/view/bot fields; T3 status tiles and FX. Shared control consumers import the retained chill/freeze readers from `combat/status/frost.ts`.
- The HUD cap now reads the class budget plus the existing weapon cap passive. The legacy DPS panel/report shows full direct hits and explicitly says sigils/payoffs are omitted, instead of estimating the removed conversion paths. The root's raw magic uses the existing violet `doom` tint; elemental tint fallback remains.
- Added real ticker/inventory regression checks for linear below-cap damage, the removed flag, no plating, half DR plus DoT resistance, and expiry/marker cleanup. Direct-hit coverage now asserts the unconverted hit. The Converge fixture stays low but survives that full hit.

### Change inventory

Counts exclude this report. Each file's additions/deletions are recorded below; deleted runtime files are included.

| Area | Files | Added lines | Deleted lines |
|---|---:|---:|---:|
| Tests and fixtures | 16 | 61 | 265 |
| Bench, bot and diagnostic readouts | 5 | 4 | 140 |
| Client readouts and retired FX | 19 | 12 | 548 |
| ECS declarations | 5 | 0 | 30 |
| Apprentice runtime | 22 | 19 | 2059 |
| Server callers and control helpers | 15 | 44 | 254 |
| Shared data, state and protocol | 24 | 18 | 408 |
| **Total** | **106** | **158** | **3704** |

### Tests deleted or revised for retired behavior

- Deleted the whole `shared/src/systems/dotClassProfile.test.ts` (70 lines): old frame profiles and hit-to-stack conversion.
- Removed the Apprentice full-stack `mechanic-fired` block from `server/test/mechanicFired.test.ts` (56 lines including obsolete imports). Payoffs use the existing target moments instead.
- Removed Winter Warden's freeze writer/preview assertions from `server/test/relicMechanicEffectCoverage.test.ts`.
- Removed Apprentice relic delivery/cap/Chill/Frenzy cases from `server/test/coreRelicIntegration.test.ts` and the DoT delivery block from `shared/src/systems/relics.test.ts`.
- Removed the retired Chill magnitude fixture from `shared/src/systems/mechanicEffectScaling.test.ts`; other live scaling checks remain.
- Replaced conversion-based DPS assertions in `shared/src/systems/dpsEstimate.test.ts` with full direct-hit output and explicit omitted-channel checks.
- `server/test/tundraDeepFreeze.test.ts` keeps every player control/expiry assertion and the `debuff-frozen` tile, and now requires the removed Apprentice target tile to be absent.
- `server/test/statusRegistry.test.ts` now uses sigils for its owed-damage example and checks that retired target help/badges are absent. `attackProgression.test.ts` drops the nine removed Apprentice animations from its count and checks that none return. The Sweep test keeps its Apprentice coverage with a root/config fixture. Other changed tests only migrate control imports or remove the retired chill field.

## Checks

- `pnpm typecheck`: clean, exit 0, no TypeScript errors across packages, benches and tests; rerun before each commit.
- Focused cleanup run: `pnpm test -- apprentice payoffs status hudStatus classAffinity abilitySweep recovery bleed relic Relic dpsEstimate Affliction striker cadence`: **`21/21 passed in 86s`**.
- Legacy fixture follow-up: `pnpm test -- attackProgression mechanicFired`: **`2/2 passed in 14s`**.
- Final full suite in this worktree, at the final code tree (`8a3690e3`), with `TEST_JOBS=8`: **`349/349 passed in 417s`**, exit 0, no FAIL. This includes Apprentice sigils/kit/Payoff views, Sweep, status/HUD audits, Deep Freeze, monster poison, damage mitigation and every other class's regression coverage.
- The first full run was `347/349 passed in 653s`: it identified the old 36-animation count and target-facing Frozen tile requirement. Both obsolete assertions were revised, then the entire suite was rerun clean as above. No failures are being waived or pooled into the final count.
- `git diff --check`: clean. Per-file newline audit against the starting commit `93ba0920`: **80 modified existing files, zero newline-style changes**. `git diff --numstat` shows focused removals, not whole-file line-ending churn.
- No dependency installation, live server/bot startup, art changes, push, branch switch or other-worktree edits.

## Not done, or unsure

- The brief requests the full suite in `../mmo-rw-verify`; the user explicitly restricted work to the approved `mmo-rw-ap7-cleanup` folder. The full suite is run here instead. No other checkout is changed.
- Kept shared chill/freeze IDs, control markers/queries, control-policy membership and their AI/control readers. They remain used by generic hard-control handling and boss/control tests; their old Apprentice writers are removed. `combat/status/frost.ts` retains their existing constants and `isMonsterFrozen`, without any old path registration or tick loop. Further pruning is the conductor's call.
- The source sweep has no imports of deleted APIs/directories or retired chill fields. `server/scripts/statusAudit.ts` still has a harmless historical `/dot/t3/paths/` source-classification predicate; it imports none of the deleted code and no current producer reaches it.
- Kept icon assets/registry keys reused by live monster burns, Deep Freeze, brittle and weapon reservoirs; only retired status aliases and unused Frenzy/Vigor keys were removed.
- Kept the generic affliction toolkit and weapon reservoirs. The single-record sigil ownership model, later discipline mechanics, tuning, AP5 UI additions and AP6 routes are outside this cleanup.
- No browser playtest or live server/bot run was performed. Living design/current-state docs and the conductor's STATUS.md are unchanged.

## Files outside the brief I needed (not edited)

None left requiring an edit. The user explicitly authorized dependent caller cleanup after review of the scope: combat AI/engine/status, ECS declarations, buff synchronization, shared status contracts and related tests. The inventory below includes those edits, plus the inherited brief's client/bench/bot readouts.

### Per-file line inventory

| File | Added | Deleted |
|---|---:|---:|
| `bot/src/telemetry/bossTimeline.test.ts` | 0 | 1 |
| `bot/src/telemetry/events.ts` | 0 | 1 |
| `bot/src/telemetry/productiveActivity.test.ts` | 0 | 1 |
| `bot/src/telemetry/recorder.ts` | 0 | 1 |
| `bot/src/telemetry/t1Snapshots.ts` | 0 | 1 |
| `client/src/fx/bespoke/apprentice.ts` | 0 | 300 |
| `client/src/fx/bespokePaths.ts` | 0 | 2 |
| `client/src/fx/conflagrationTick.ts` | 0 | 57 |
| `client/src/hud/BuffBar.tsx` | 0 | 4 |
| `client/src/hud/atoms.ts` | 0 | 3 |
| `client/src/hud/hud.css` | 0 | 32 |
| `client/src/hud/mechanics/DotMechanic.tsx` | 1 | 10 |
| `client/src/hud/mechanics/mechanicHelp.tsx` | 5 | 13 |
| `client/src/hud/mechanics/mechanics.css` | 1 | 40 |
| `client/src/hud/mechanics/types.ts` | 0 | 4 |
| `client/src/hud/mechanics/useMechanicViewModel.ts` | 4 | 19 |
| `client/src/hud/stat/statHelp.ts` | 0 | 26 |
| `client/src/hud/statusHelp.ts` | 0 | 10 |
| `client/src/hud/targetStatusMeta.ts` | 0 | 5 |
| `client/src/render/combatFx.ts` | 1 | 6 |
| `client/src/ui/conceptIcons.ts` | 0 | 6 |
| `client/src/ui/crafting/itemDisplay.ts` | 0 | 4 |
| `client/src/ui/describe/passiveText.ts` | 0 | 1 |
| `client/src/ui/stats/statsPanelModel.ts` | 0 | 6 |
| `server/bench/balance/progression.ts` | 0 | 4 |
| `server/src/ecs/archetypeSliceSync.ts` | 0 | 9 |
| `server/src/ecs/entity.ts` | 0 | 6 |
| `server/src/ecs/markerHelpers.ts` | 0 | 2 |
| `server/src/ecs/markerInvariants.ts` | 0 | 9 |
| `server/src/systems/classes/archetypes/dot/constants.ts` | 2 | 0 |
| `server/src/systems/classes/archetypes/dot/dotPrototype.ts` | 9 | 189 |
| `server/src/systems/classes/archetypes/dot/frameLoop.ts` | 0 | 183 |
| `server/src/systems/classes/archetypes/dot/index.ts` | 1 | 6 |
| `server/src/systems/classes/archetypes/dot/sigils.ts` | 6 | 11 |
| `server/src/systems/classes/archetypes/dot/t3/core/buffs.ts` | 0 | 169 |
| `server/src/systems/classes/archetypes/dot/t3/core/constants.ts` | 0 | 46 |
| `server/src/systems/classes/archetypes/dot/t3/core/helpers.ts` | 0 | 22 |
| `server/src/systems/classes/archetypes/dot/t3/core/mirroring.ts` | 0 | 132 |
| `server/src/systems/classes/archetypes/dot/t3/core/selectors.ts` | 0 | 91 |
| `server/src/systems/classes/archetypes/dot/t3/index.ts` | 0 | 187 |
| `server/src/systems/classes/archetypes/dot/t3/paths/_constants.ts` | 0 | 67 |
| `server/src/systems/classes/archetypes/dot/t3/paths/_types.ts` | 0 | 32 |
| `server/src/systems/classes/archetypes/dot/t3/paths/fire.ts` | 0 | 196 |
| `server/src/systems/classes/archetypes/dot/t3/paths/frost.ts` | 0 | 238 |
| `server/src/systems/classes/archetypes/dot/t3/paths/poison.ts` | 0 | 86 |
| `server/src/systems/classes/archetypes/dot/t3/ticks/chillFreeze.ts` | 0 | 28 |
| `server/src/systems/classes/archetypes/dot/t3/ticks/conflagration.ts` | 0 | 95 |
| `server/src/systems/classes/archetypes/dot/t3/ticks/frenzy.ts` | 0 | 44 |
| `server/src/systems/classes/archetypes/dot/t3/ticks/permafrost.ts` | 0 | 95 |
| `server/src/systems/classes/archetypes/dot/t3/ticks/radiant.ts` | 0 | 127 |
| `server/src/systems/classes/archetypes/dot/tickDamage.ts` | 1 | 15 |
| `server/src/systems/combat/ai/ai.ts` | 1 | 1 |
| `server/src/systems/combat/ai/bossPatterns.ts` | 1 | 1 |
| `server/src/systems/combat/ai/raiseDead.ts` | 1 | 1 |
| `server/src/systems/combat/ai/targetPriority.ts` | 4 | 13 |
| `server/src/systems/combat/buffs/buffSync.ts` | 0 | 10 |
| `server/src/systems/combat/damage/dotInventory.ts` | 8 | 102 |
| `server/src/systems/combat/damage/dotTickEvent.ts` | 0 | 6 |
| `server/src/systems/combat/damage/lairDrag.ts` | 1 | 1 |
| `server/src/systems/combat/engine/combat.ts` | 1 | 1 |
| `server/src/systems/combat/engine/mechanicFired.ts` | 6 | 6 |
| `server/src/systems/combat/rangeMechanics.ts` | 1 | 101 |
| `server/src/systems/combat/status/frost.ts` | 15 | 0 |
| `server/src/systems/combat/status/monsterControl.ts` | 1 | 7 |
| `server/src/systems/combat/status/playerHardControl.ts` | 1 | 1 |
| `server/src/systems/world/nodeFeatures.ts` | 3 | 3 |
| `server/src/world/World.ts` | 0 | 4 |
| `server/test/abilityControl.test.ts` | 1 | 1 |
| `server/test/abilitySweepAdapters.test.ts` | 3 | 3 |
| `server/test/apprenticeSigils.test.ts` | 35 | 3 |
| `server/test/attackProgression.test.ts` | 2 | 1 |
| `server/test/bossStatusPayoffPhase3.test.ts` | 1 | 1 |
| `server/test/coreRelicIntegration.test.ts` | 2 | 25 |
| `server/test/mechanicFired.test.ts` | 0 | 56 |
| `server/test/relicMechanicEffectCoverage.test.ts` | 2 | 42 |
| `server/test/statusRegistry.test.ts` | 7 | 10 |
| `server/test/tundraDeepFreeze.test.ts` | 2 | 3 |
| `shared/src/components/archetypes/dot/appliesDots.ts` | 0 | 10 |
| `shared/src/components/archetypes/dot/chillsTarget.ts` | 0 | 10 |
| `shared/src/components/archetypes/dot/hasConflagration.ts` | 0 | 2 |
| `shared/src/components/archetypes/dot/hasSmolder.ts` | 0 | 2 |
| `shared/src/components/combat/buffs.ts` | 1 | 14 |
| `shared/src/components/combat/effects.ts` | 1 | 2 |
| `shared/src/components/index.ts` | 0 | 3 |
| `shared/src/index.ts` | 0 | 1 |
| `shared/src/passives.ts` | 2 | 77 |
| `shared/src/protocol/combatEvents.ts` | 2 | 10 |
| `shared/src/protocol/networkedEntity.ts` | 0 | 3 |
| `shared/src/protocol/tier1Snapshot.ts` | 0 | 1 |
| `shared/src/protocol/views.ts` | 0 | 2 |
| `shared/src/systems/damage.ts` | 1 | 47 |
| `shared/src/systems/dotClassProfile.test.ts` | 0 | 70 |
| `shared/src/systems/dotClassProfile.ts` | 0 | 111 |
| `shared/src/systems/dotElements.ts` | 3 | 24 |
| `shared/src/systems/dpsEstimate.test.ts` | 6 | 23 |
| `shared/src/systems/dpsEstimate.ts` | 4 | 22 |
| `shared/src/systems/mechanicEffectScaling.test.ts` | 0 | 16 |
| `shared/src/systems/mechanicEffectScaling.ts` | 0 | 6 |
| `shared/src/systems/relicEffectPreview.ts` | 0 | 14 |
| `shared/src/systems/relicPreview.ts` | 1 | 6 |
| `shared/src/systems/relics.test.ts` | 0 | 9 |
| `shared/src/systems/relics.ts` | 0 | 33 |
| `shared/src/systems/stats.ts` | 0 | 1 |
| `shared/src/systems/statusPolicy.ts` | 1 | 1 |
| `shared/src/systems/targetConditions.ts` | 2 | 6 |
| `tools/dps-report.ts` | 4 | 133 |
