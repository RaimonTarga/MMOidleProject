# CL7-CLEANUP report

**Agent:** Grok   **Branch:** rw/cl7-cleanup   **Last commit:** `0227aca8` (this report is committed on top of it)

One implementation commit, with `pnpm typecheck` clean before it:
`0227aca8` delete the old reload frame, range, and T3 paths.

**It is one commit, not the brief's list as separate commits.** Deleting `frameLoop.ts` and `reload/t3/` also deleted the buff ids only they wrote, and shrinking `RELOAD_KEYS` fails `tsc` anywhere a removed key is still indexed. The status audit fails on a tile without a writer and on a writer without a tile. Writers, tiles, keys, and readers land together so the tree typechecks. Same reason CS7 and CQ7 pulled the status ids into the deletion commit; this tree could not be split and still typecheck between the pieces.

Branch total before this report: 80 files changed, +161 / −2,734; 20 files deleted.

The full suite ran in this worktree. `../mmo-rw-verify` was left on `rw/verify`.

## Done

| Area | Files | Lines |
|---|---|---|
| Server reload module (`server/src/systems/classes/archetypes/reload/`) | 21 (17 deleted) | +43 / −1,584 |
| Shared (keys, slice, buff ids, protocol, previews, estimate) | 14 (1 deleted) | +28 / −351 |
| Server elsewhere (range, plating estimate, buff text, tempo, comments) | 7 | +13 / −68 |
| Client (HUD, FX, copy, icons) | 23 (2 deleted) | +19 / −457 |
| Bot, bench, tools | 3 | +12 / −119 |
| Tests | 12 | +46 / −155 |

`slinger.ts` stays. `slingerLoadout.test.ts`, `slingerKit.test.ts`, and `loadoutView.test.ts` pass.

### The frame loop and the T3 paths (`0227aca8`)

- Deleted `reload/frameLoop.ts` and `reload/t3/` (16 files): Duelist, Laser, Snipe, Cannon, Blunderbuss, Kill chain, Death Mark, Momentum, and the rest of that tree (`core/`, `pipeline/`, `ticks/`, `lifecycleHandlers.ts`).
- `reload/index.ts` inits `initReloadArchetype` and `registerSlinger`. The tick runs `updateReloadArchetype`, then `updateSlinger`. Buffs are `[]`.
- `reloadPrototype.ts` keeps the ammo gate, the clip metadata (`reloadClipShot`, `reloadClipSize`, `reloadClipIndex` written after the ammo decrement — `slinger.ts` reads the index for the last-round seam), `pendingReloadStart`, and the empowered-multiplier registration (`RELOAD_PROXY_MULT` 3.5, the old exploding-clip fallback). Gone: the frame and T3 inits, the half-plating assignment, blunderbuss pellet scaling, relic magazine math, and `chainRounds`.
- `reloadLifecycle.ts` keeps `registerReloadLifecycleHook`, `startReloadTimer`, `emitReloadStart`, `completeReload`, `requestManualReload`, and `registerReloadAfterHitListener`. Reload time is `max(100, round(reload.reload-time-ms ?? 1600))`. No reload-time multiplier, no momentum, no relic profile. `startReloadTimer` zeros ammo only. `completeReload` fills ammo to `ammoMax`. The laser early-return on a manual reload is gone.
- Ammo max is `max(1, round(reload.max-ammo ?? 10))`.
- What only those paths wrote, removed with them:
  - Buff ids `reload-snipe-ready`, `reload-cover-fire`, `reload-momentum`, `reload-cannon`, `reload-frame-ramp`.
  - Effect ids `death-mark` and `reload-suppress-shred` (the `mechanicEffectScaling` entry and the plating-shred term).
  - Their tiles and help (`statusHelp.ts`, `targetStatusMeta.ts`) and their concept-icon ids. Venom (`slinger-venom`) and Rot (`slinger-rot`) stay, writers included. `statusRegistry.test.ts` passes.
  - `resolveReloadRelicProfile`, `ReloadRelicProfile`, `shared/src/systems/laserProfile.ts`, and the `laser` / `reload` arms of `ResolvedRelicProfile`. `relicPreview` returns null for `'reload'`. `RelicArchetype` still includes `'reload'`, and `RELIC_COEFFICIENTS.reload` stays, so the record type does not force a union change.
  - The `reload.snipe` / `reload.laser` final layer in `stats.ts` §3b, including the Dualslinger alt-on-hit block.
  - `slingerDirectAttackEffectiveness` (nothing read it after that). The constant `SLINGER_DIRECT_ATTACK_EFFECTIVENESS` (1) stays. Weapon DoT basis for reload is `basis * 0.85` (`SLINGER_WEAPON_DOT_EFFECTIVENESS`).
  - Range readers that only the old reload nodes used: at-bay slow keys, `applyLongShot`, Deadeye. Cadence, cooldown, energy, and dot range stay.
  - The half-plating branch. `ctx.platingMult` is no longer set to 0.5 for a reload attack. `targetPriority`'s estimated player damage and glancing check use `platingMult: 1`. Breaching still sets its own `platingMult` (0.25) on the clip; the AI estimate does not model that exception. Formation packets in `combat.ts` still set `platingMult = 0.5` for a formation hit. The comment there no longer claims live reload half plating.
- `UsesReload` keeps `ammo`, `ammoMax`, `reloadingMs`, `clipId`, `nextClipId`, `reloadDurationMs`. Gone: `laserHeat`, `laserOverheated`, `chainRounds`, `clipSpeedStacks`, `clipBaseAttackCooldownMs`, and the momentum, cannon, and death-mark fields, plus `heatPct`, `laserOverheated`, and `cannonChargePct` on the player view and the T1 snapshot.
- `RELOAD_KEYS` keeps `reload.max-ammo`, `reload.reload-time-ms`, `reload.empowered-mult`, `reload.mechanic-proxy-mult` (the empowered registration and the proxy still read the last two), and `reload.acquire-radius-mult` (below).
- Client heat HUD, the laser beam (`client/src/fx/laser.ts`), the heavy shell (`heavyShell.ts`), and the cannon charge ring are gone. The ammo ring stays. `fxCannonBlast` stays.

## Checks

- `pnpm typecheck`: clean before the commit (exit 0). Recursive `tsc`, `typecheck:bench`, and `typecheck:test`.
- Named and neighbouring tests, in this worktree: `pnpm test -- slinger loadout status hudStatus classAffinity relic dps plating secondary weaponReservoir heat itemSource finalDamage onHit manualCombat remotePlayer skillTree describeText` — **`23/23 passed in 88s`**. That includes `slingerLoadout.test.ts`, `slingerKit.test.ts`, `loadoutView.test.ts`, `statusRegistry.test.ts`, `hudStatusTooltips.test.ts`, `classAffinity.test.ts`, `dpsEstimate.test.ts`, `relics.test.ts`, `skillTreeMechanicCopy.test.ts`, `skillTreeData.test.ts`, `describeText.test.ts`, and `secondaryDamageConsistency.test.ts`. The filter is a case-sensitive path substring, so `coreRelicIntegration` does not match `relic`. Run alone: **`1/1 passed in 9s`**. No test file path contains `plating`; `formationPlatingCompensation.test.ts` passed in the full suite.
- Full suite in this worktree (`pnpm test`): **`346/346 passed in 350s`**, exit 0, no FAIL. `biomeEcology.test.ts` passed on the first run. No test file was deleted, so this is the branch's full set. `../mmo-rw-verify` was not checked out.
- `git diff --numstat` matched `git diff --ignore-cr-at-eol --numstat` on the working tree before the commit. No whole-file line-ending conversion.

## Tests deleted or rewritten

No test file was deleted. Blocks that pinned deleted behaviour:

- `shared/src/systems/relics.test.ts`: the reload relic profile block (frequency shortens reload, potency grows the magazine).
- `shared/src/systems/dpsEstimate.test.ts`: `testLaserSecondaryDamageBreakdown` deleted. `testSlingerSecondaryDamageBreakdown` now expects a flat magazine (attack 65, weapon conversion 0.5, on-hit 20, weapon DoT at 0.85) and asserts that setting `reload.empowered-mult` does not change the estimate. The `Math.round(65 * 0.5)` term is weapon conversion, not plating.
- `server/test/coreRelicIntegration.test.ts`: the Melter heat block, the reload `ammoMax` preview equality, and the Maximum-heat / "140" format rows. Added: reload DPS does not change when `relic.mechanic-frequency` is 0.35, and `resolveRelicPreview('reload', ...)` is null. The frequency loop is cadence, dot, and energy.
- `server/test/weaponReservoirAbilities.test.ts`: the "Blunderbuss pellet feeds only its penalized share" block.
- `server/test/manualCombatControls.test.ts`: the four lines that set `reload.laser` and asserted a manual reload was a no-op.
- `server/test/remotePlayerAttack.test.ts`: the remote-laser and own-laser beam cases. The pellet gunshot case stays.
- `server/test/hudStatusTooltips.test.ts`: the `reload-momentum` row.
- `server/test/itemSourceOutliers.test.ts`: the laser mode, the idle-laser block, and the laser DPS preview. The chaotic-axe block is normal hits only. The cancelled-attack block that uses `reloadingMs` stays.
- `server/test/finalDamageIntegration.test.ts` and `onHitMitigation.test.ts`: `'laser'` dropped from the mode loops.
- `server/test/heatManagement.test.ts`: the laser block that asserted a fresh monster takes no damage. The summoner block stays.
- `server/test/_coreRelicAudit.ts` (throwaway, typechecked, skipped by the runner): the `updateReloadT3Ticks` import.

## Not done, or unsure

Kept, each the conductor's call:

- **Bible §10.14 Keep vs this brief.** §10.14 Keep names `reload/frameLoop.ts` ("every shot's place in the clip; the frame loop's three shapes as references"). The brief and `C-slinger.md` say CL.7 deletes it. Deleted, the same call CS7 and CQ7 made. `reloadClipIndex` is still written in `reloadPrototype.ts`, which is what the last-round seam reads. Recoverable at `6d975cf9`. The shared helpers (`classes/shared/frameLoop.ts`) and the other roots' frame loops stay.
- **`client/src/fx/bespoke/slinger.ts` stays.** Bible §10.14 keeps the bespoke FX (Dualslinger rounds, Cannoneer blast). The file still looks up `reload-momentum`, `reload-cannon`, and `death-mark` as plain strings, and compares `reload-frame-ramp` through a string cast so `BuffId` stays exhaustive. Nothing grants those ids now, so those cues cannot fire. `fxCannonBlast` stays. CombatFx still has playback branches for the string tags `reload-alt-onhit`, `death-mark-blast`, and `reload-cannon-blast`; nothing emits them.
- **`reload.acquire-radius-mult`.** Bible §10.14 lists range nodes under remove. The reload-root in `shared/src/data/skillTree/roots.ts` still grants 2.5, and `skillTreeMechanicCopy.test.ts` pins the "×2.5" sentence (and "65% effectiveness"). Deleting the key fails `tsc` on that grant. `targetPriority` still multiplies acquire radius by it. Kept, with the root copy. The other reload range readers (at-bay, long shot, Deadeye) are gone.
- **The tactical-reload rune.** `updateReloadArchetype` still doubles the reload tick out of combat when `RUNE_TACTICAL_RELOAD_FLAG` is set. It was not in the delete list. Bible §10.14 says the runes that drove reloads become the Loadout's free rules, and `slinger.ts` already reloads early when nothing threatens. Left in place.
- **Empowered multiplier registration.** No path arms an empowered reload attack since the exploding last bullet was retired. The layer stays, fallback 3.5, and both `reload.empowered-mult` and `reload.mechanic-proxy-mult` stay because that registration reads them. The passives comment still says no path authors `reload.empowered-mult`.
- **Reload DPS no longer models an empowered last shot or a laser.** Magazine and reload time come from the two kept keys (defaults 10 and 1600, floor 100). Plating in the estimate is 1.
- **Bench relic score.** `resolveRelicPreview('reload')` is null, and `relicScore` returns negative infinity when the preview is null, so a slinger scores no relic. Relic items for the class are already gone. The crafting row falls through to "Choose a class to see this relic's effects", which is a misleading sentence for a slinger.
- **Player-facing copy not rewritten, outside this task.** `reload-root` still says weapon Attack retains 65% effectiveness. `client/src/ui/ClassIdentity.tsx` and `client/src/ui/describe/abilityText.ts` still say 65%. `server/test/secondaryDamageConsistency.test.ts` comments still name a 65% direct-attack treatment; the assertion `Math.round(65 * 0.5)` is weapon conversion and was not changed. The test passes.
- **`mechanicHelp` reload copy.** The old 65% paragraph is gone. The replacement says fire rate is the gun's own stat, and that weapon damage converted into damage over time retains 85% effectiveness. 85% is the existing `SLINGER_WEAPON_DOT_EFFECTIVENESS`. The sentence is new; change it if the wording is wrong.
- **`buffSync.ts` `buffSourceName`** still maps a `reload-` prefix to "Reload". No remaining buff has that prefix.
- **`combat.ts`** still reads `blunderbussPelletIndex` / `blunderbussPelletTotal` from metadata when present. Nothing writes them.
- **`server/bench/balance/t4ScalingStudy.ts`** still checks `ctx.metadata['reloadLaser']`. Inert string flag. Left, the way CS7 left frozen bench arms.
- **The ammo ring's "+N" overflow** for a kill chain stays in `ReloadMechanic.tsx`. Nothing fills it.
- **`MULTIPLIER_KEYS` in `passiveText.ts`** is now an empty set. The formatter still consults it. The snipe-as-to-dmg members were the only entries.
- **Fixtures** `server/test/fixtures/v1d-earned-t1-state.json` and `v1m-earned-t3-snapshot.json` were not edited. They may still carry `heatPct`, `laserOverheated`, or `cannonChargePct`. `progressionCheckpoint.test.ts` passed.
- **Docs are untouched** (outside the brief): `docs/*-current-state.md`, `design_docs/class-first-bible.md` §10.14, and `docs/briefs/class-first-build/STATUS.md`. The art PNGs of the removed buff tiles stay under `client/public/assets` (the art pipeline owns them).

## Files outside the brief I needed (edited)

The brief's "server/shared only" cell is the Needs column, not an edit ban. These had to change to compile or to drop a tile the audit would reject:

- `tools/dps-report.ts`: the reload estimate imported the deleted laser and path math. It now uses the flat magazine, full plating, and the two kept passive keys. Old Scout / Marksman / Artillerist magazine numbers were dropped rather than restated.
- `server/bench/balance/progression.ts`: relic profile factor cases `'reload'` and `'laser'`. `RELIC_DEBUFF_PASSIVES` is gone; the debuff term applies only to `dot-root`.
- `client/src/fx/bespoke/slinger.ts`: one string cast so `reload-frame-ramp` still compiles after it left `BuffId`. The file stays.
- `bot/src/telemetry/t1Snapshots.ts`: stopped copying `heatPct`, `laserOverheated`, `cannonChargePct`.
- `server/src/systems/combat/rangeMechanics.ts`, `ai/targetPriority.ts`, `damage/effectivePlating.ts`, `damage/weaponEffects.ts`, `engine/combat.ts` (comment, plus the formation 0.5 assignment stays), `buffs/buffSync.ts`, `player/abilities/attackTempo.ts`.
- Client HUD, FX, and copy listed in the table: heat atoms, laser beam, heavy shell, cannon charge ring, status tiles, concept icons, relic profile rows.
- The twelve test files above.

## Files outside the brief I needed (not edited)

- `shared/src/data/skillTree/roots.ts` and `server/test/skillTreeMechanicCopy.test.ts` (the 65% sentence, the ×2.5 sentence, and the acquire-radius grant).
- `client/src/ui/ClassIdentity.tsx`, `client/src/ui/describe/abilityText.ts`, and the comments in `secondaryDamageConsistency.test.ts`.
- `server/bench/balance/t4ScalingStudy.ts`.
- The two player-view fixtures.
- Living docs under `docs/` and `design_docs/`, and `docs/briefs/class-first-build/STATUS.md`.