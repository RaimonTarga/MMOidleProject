# CQ7-CLEANUP report

**Agent:** Grok   **Branch:** rw/cq7-cleanup   **Last commit:** `b00f9505` (this report is committed on top of it)

Commits, in order, each with `pnpm typecheck` clean:
`9262d834` delete the frame loop and the T3 paths ·
`31c3d347` slice fields ·
`72ac0c3f` passive keys and labels ·
`b00f9505` comments that still named the deleted paths.

**The order differs from the brief's list.** Deleting `frameLoop.ts` and `t3/` also deleted the
buff descriptors and FX tags only they wrote, so the status ids, tiles, copy and icons went in
the same commit: the status audit fails on a tile without a writer, and every commit is
test-green this way. The slice fields and the passive keys came after, once nothing wrote them.

Branch total before this report: 57 files changed, +114 / −2,176; 18 files deleted.

The full suite ran in this worktree. `../mmo-rw-verify` was left on `rw/verify`.

## Done

| Area | Files | Lines |
|---|---|---|
| Server cooldown module (`server/src/systems/classes/archetypes/cooldown/`) | 19 (17 deleted) | +24 / −1,630 |
| Shared (keys, slice, buff ids, protocol, previews, estimate) | 8 | +25 / −120 |
| Server elsewhere (audit, buff text, tempo, comments) | 8 | +17 / −49 |
| Client (HUD, FX, copy, icons) | 12 (1 deleted) | +11 / −257 |
| Bench and tools | 2 | +7 / −87 |
| Tests | 9 | +30 / −34 |

`squire.ts` and `squireBuffs.ts` are untouched. `squireResponses.test.ts` and
`squireGear.test.ts` pass.

### The frame loop, the T3 paths, the 7s clock (`9262d834`)

- Deleted `cooldown/frameLoop.ts` (167) and `cooldown/t3/` (16 files, 1,313): Warrior, Bulwark,
  Destroyer, Reverb, Overdrive, Battery, Channeled Beam, and the rest of that tree.
- `cooldown/index.ts` ticks `updateSquire` only. Buffs are `SQUIRE_BUFFS` only.
- `cooldownPrototype.ts` keeps `EXECUTION_MULTIPLIER`, the `mechanic-fired` listener, and
  `initSquire()`. Gone: `updateCooldownArchetype`, `resolveExecutionCooldownMs`,
  `EXECUTION_COOLDOWN_MS`, the frame and T3 inits, and `registerDestroyerHold`.
- What only those paths wrote:
  - Ten buff ids: `cooldown-overdrive`, `-eternal-charge`, `-temporal-ext`, `-battery`,
    `-reverb`, `-alignment`, `-rupture`, `-patience`, `-vengeance`, `-channel`.
  - The shared tiles `frame-window` and `frame-charge`. Other roots wear their own frame buff
    ids. The `frame-charge` combat event and the weapon glow stay; they are not that tile.
  - Their effect text in `buffSync.ts`, their copy in `statusHelp.ts`, and their concept icons.
    Aura colours `cooldown-overdrive` and `cooldown-patience` went.
  - The `cooldown-temporal-ext` accepted gap and the `frame.cooldown.window` alias in
    `server/scripts/statusAudit.ts`.
  - FX tags `COOLDOWN_SUNDER_FX` and `COOLDOWN_REVERB_ECHO_FX`, `fxSunderShatter`, and the holy
    beam client (`client/src/fx/holyBeam.ts`, `state.holyBeam`, `updateHolyBeam`, the
    channel-beam / holy-flash playback filter).
- `onTechniqueResolved` no longer calls Destroyer. The seam stays.
- The character-panel estimate no longer adds an execution every 7s. Cooldown DPS is regular
  attacks, with a caveat that the slam (Resolve) is not included.

### `UsesCooldown` fields (`31c3d347`)

The slice keeps `executionCooldownPct` (the HUD dial; `addResolve` writes it), `resolve`, and
`resolveMax`. Gone: `executionCooldownMs`, `initialized`, `batteryTimerAcc`,
`vengeanceDamageTaken`, `ruptureWindowMs`. No view, snapshot, or HUD readout carried those five.

### Passive keys and labels (`72ac0c3f`)

`COOLDOWN_KEYS` keeps `cooldown.empowered-mult` (the slam), `cooldown.empowered-cd-ms` (the relic
preview still reads it), and the six `cooldown.range-*` keys. The other path and frame keys went,
with their stat-help lines, the two percent-key exceptions in `passiveText.ts`, the Overdrive
line in `relicEffectPreview.ts`, the `cooldown-overdrive` scalable-buff entry, the bench relic
scorer entry, and the beam branch in `attackTempo.ts` (nothing sets `channelBeam` now).

`tools/dps-report.ts` no longer estimates Destroyer, the beam, Overdrive, Battery, Patience,
Reverb, Vengeance, Eternal Cycle, or Rupture, and it no longer quotes a 7s frequency. The slam
is noted as not modeled. `pnpm typecheck` does not cover this file. Checked with
`tools/tsconfig.json`: no error at the edit. The errors it reports (Node types, `import.meta`,
nullability) predate it.

### Comments (`b00f9505`)

`combat.ts` (cast-delivered dodge skip, hit-multiplier handoff, channel lock),
`empoweredAttacks.ts` (the empowered hold), and `abilityEffects.ts` (`castStrikeArea`) no longer
name Destroyer, Reverb, or Channeled Beam as live writers. The lock, the hold, and the helper stay.

## Checks

- `pnpm typecheck`: clean after every commit (exit 0, including `typecheck:bench` and `typecheck:test`).
- `pnpm test -- squire describeText coreRelic dpsEstimate skillTree statusRegistry`: **`10/10 passed in 11s`**
  (squireKit, skillTreeData, skillTreeMechanicCopy, describeText, classFirstTree, coreRelicIntegration,
  squireResponses, squireGear, dpsEstimate, statusRegistry).
- `pnpm test -- statusRegistry hudStatus`: **`2/2 passed in 31s`** after the frame tiles went.
- `pnpm test -- squire mechanicFired`: **`4/4 passed in 6s`**.
- Full suite in this worktree, at `b00f9505`: **`337/338 passed in 208s`**. The one failure was
  `server/test/biomeEcology.test.ts` (`a patrol sentinel should have moved away from its spawn point
  while un-aggroed`). Rerun alone: **`1/1 passed in 3s`**. Baseline before this work was 338; no
  test file was deleted. `squireResponses.test.ts` and `squireGear.test.ts` passed in the suite.
- `git diff --numstat 09760c74..b00f9505`: no whole-file line-ending churn.

## Tests rewritten

No test file was deleted.

- `coreRelicIntegration.test.ts`: the cooldown case no longer pins `executionCooldownMs`. Cooldown
  is out of the "DPS reflects frequency" loop. The attributed buff line and the unrated relic use
  Surge (`energy.overdrive`) instead of Overdrive.
- `dpsEstimate.test.ts`: cooldown is regular attacks and must say the slam is omitted.
- `describeText.test.ts`: flag row `cooldown.overdrive` → `energy.overdrive`.
- `hudStatusTooltips.test.ts`: description and icon pins moved from the deleted tiles to `squire-guard`.
- `itemSourceOutliers.test.ts`: the beam mode of the dead-hit loop went. Normal and laser stay.
- `heatManagement.test.ts`: the beam "must not acquire a target" block went. The laser assertion stays.
- `remotePlayerAttack.test.ts`: the `channel-beam` fixture went. The teleport guard stays.
- `runeClassMaintenance.test.ts`: dropped the call to the deleted `updateCooldownArchetype`. The
  Squire scenario still uses `updateSquire` and `addResolve`.
- `mechanicFired.test.ts` and `_coreRelicAudit.ts`: the hand-built slice matches the live fields.

## Not done, or unsure

Kept, each the conductor's call:

- **Bible §8.14 Keep vs this brief.** §8.14 Keep names `cooldown/frameLoop.ts` (Juggernaut bank /
  Deep Winter), `cooldown/t3/ticks/cooldownState.ts` (incoming gross / Avenger), and the old path
  mechanics in `cooldown/t3/` (Reverb echo, Devout Priest channel, Assassin burst, Sunderer plating
  bypass, Destroyer charge). The brief and `C-squire.md` say those are inert since F4 and CQ.7
  deletes them. Deleted, same call CS7 made for the Striker frame loop. Recoverable at `09760c74`.
  The shared helpers (`classes/shared/frameLoop.ts`) and the other roots' frame loops stay.
- **`client/src/fx/bespoke/squire.ts` stays, including `SQUIRE_PATHS`.** Bible §8.14 keeps the
  bespoke slam, the brace pose, and the mechanic flash. The table is keyed by `cooldown-*-t3-*`
  ids no node grants since F4, so none of it can fire. It still reads deleted buff ids
  (`cooldown-battery`, `-reverb`, `-overdrive`, `-eternal-charge`) as plain strings, and a local
  `'reverb-echo'` because nothing emits that tag now. One comparison was cast so the file
  typechecks after `cooldown-reverb` left `BuffId`. To delete the table: remove it and lower
  whatever count pins the covered specializations.
- **`cooldown.empowered-cd-ms` and the relic preview's cooldown clock.** `resolveCooldownRelicProfile`
  and `relicPreview.ts`'s cooldown case still turn that key (default 7000) into `cooldownMs`.
  Potency on `empoweredMultiplier` is live: the slam multiplier uses it. The runtime no longer
  stores a clock. The stat-help line still says "How long your execution takes to come back up."
  Not rewritten: that would invent a sentence.
- **The range nodes.** `cooldown.range-*` and `rangeMechanics.ts` (Phalanx at-bay slow and stagger,
  Sentinel vulnerability) stay. Nothing authors the keys. Bible §8.14 lists range nodes under remove.
- **`isChanneling`.** Networked, and movement, firing, heat, and the HUD still honor it. The beam
  was the writer. Nothing attaches it now. The channel lock in `combat.ts` stays.
- **`HasEntropy` / `world.entropyMonsters`.** The DoT class's `mirroring.ts` queries the marker.
  The deleted entropy-collapse path never attached it. Left in place, same shape as CS7 leaving
  `HasDetonation`.
- **`castStrikeArea` has no caller** after Destroyer. The helper stays with the cast footprint.
- **`HOLD_EMPOWERED_ATTACK`** is still honored. Destroyer and Reverb were the writers.
- **`buffSync.ts`'s `buffSourceName`** still maps a `cooldown-` prefix to "Cooldown". No remaining
  buff has that prefix (`squire-guard` does not).
- **Player-facing root copy, not touched.** `cooldown-root` in `shared/src/data/skillTree/roots.ts`
  still says "prepare a timed execution on the 7s reference cycle at ×2" and grants
  `defense.recovery-active-pct: 0.1`. `skillTreeMechanicCopy.test.ts` pins that sentence. Bible
  §8.2 moves that in-combat Recovery share to the Old Guard charm. Both are outside this task.
- **Docs and generated packets are untouched** (outside the brief): `docs/*-current-state.md`,
  `design_docs/class-first-bible.md` §8.14, and `reports/dps-llm-packet-*.md` /
  `reports/class-mechanics-packet.md` still describe the frames, the paths, and a 7s execution.
- The art PNGs of the removed buff tiles stay in
  `client/public/assets/concept-icons/statuses/buffs/` (the art pipeline owns them).

## Files outside the brief I needed (edited)

- `tools/dps-report.ts`: the cooldown estimate referenced the deleted path keys.
- `shared/src/systems/dpsEstimate.ts` (+ its test), `relicEffectPreview.ts`,
  `mechanicEffectScaling.ts`: the 7s execution and the Overdrive buff.
- `server/src/systems/player/abilities/attackTempo.ts`: read `cooldown.channeled-beam-mult`.
- `server/src/systems/combat/buffs/buffSync.ts`: switches on `BuffId`.
- `server/src/systems/combat/techniqueResolved.ts`: called the deleted Destroyer hook.
- `server/scripts/statusAudit.ts`: the cooldown frame alias and the stale temporal-ext gap.
- `server/bench/balance/progression.ts`: `RELIC_BUFF_PASSIVES` listed `cooldown.overdrive`.
- `server/src/systems/combat/engine/combat.ts`, `empoweredAttacks.ts`,
  `server/src/systems/player/abilities/abilityEffects.ts`: comments only.
- `client/src/fx/bespoke/squire.ts`: one cast so a deleted buff id still compiles. The file stays.
- `client/src/render/combatFx.ts`, `combatPlayback.ts`, `state.ts`, `scenes/game/sceneSetup.ts`,
  `fx/t4Triggers.ts`, `fx/aura.ts`, `fx/holyBeam.ts`: the beam and the deleted FX tags.
- `docs/briefs/class-first-build/STATUS.md` was not updated: it is the conductor's.

## Files outside the brief I needed (not edited)

- `shared/src/data/skillTree/roots.ts` and `server/test/skillTreeMechanicCopy.test.ts` (the 7s
  sentence and the Recovery grant).
- `shared/src/systems/relicPreview.ts` and `resolveCooldownRelicProfile` in `relics.ts`.
- `server/src/systems/combat/rangeMechanics.ts`.
- `shared/src/components/archetypes/cooldown/isChanneling.ts` and the HUD channel overlay.
- `hasEntropy` and `server/src/systems/classes/archetypes/dot/t3/core/mirroring.ts`.
- Living docs under `docs/` and `design_docs/`, and the generated packets under `reports/`.
