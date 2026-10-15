# CS7-CLEANUP report

**Agent:** Claude (Opus 5.5)   **Branch:** rw/cs7-cleanup   **Last commit:** `657dca90` (this report is committed on top of it)

Commits, in order, each with `pnpm typecheck` clean:
`5ab648d1` move the bleed driver · `8c655dee` delete the frame loop and the nine T3 paths ·
`e93f5303` slice fields and their readouts · `7f3b522b` passive keys and labels ·
`657dca90` three comments that still named the deleted paths.

**The order differs from the brief's list.** Deleting `frameLoop.ts` and `t3/` (items 1, 2, 3) also
deleted the buff descriptors and FX tags only they wrote, so the status ids, tiles, copy and icons
(item 5) went in the same commit: the status audit fails on a tile without a writer, and every
commit is test-green this way. The slice fields (item 4) and the passive keys (items 1, 2) came
after, once nothing wrote them.

Branch total before this report: 55 files changed, +94 / −1,971; 15 files deleted, 1 renamed.

## Done

| Area | Files | Lines |
|---|---|---|
| Server cadence module (`server/src/systems/classes/archetypes/cadence/`) | 13 (11 deleted) | +12 / −1,029 |
| Bleed driver and `combat/damage/` | 3 (1 renamed) | +23 / −17 |
| Shared (keys, slice, buff ids, protocol, previews, recalc) | 10 | +16 / −161 |
| Server elsewhere (recalc, buff text, status audit, a comment) | 4 | +4 / −32 |
| Client (HUD, FX, copy, icons) | 12 (2 deleted) | +8 / −384 |
| Bot, bench, tools | 4 | +15 / −122 |
| Tests | 9 (1 deleted) | +16 / −226 |

### The bleed driver: where it lives now

`server/src/systems/combat/damage/bleedTicks.ts`, `updateHemorrhages(world, dt)` (moved with
`git mv` from `cadence/t3/ticks/hemorrhage.ts`; the body is unchanged, only the imports and a header).
The cadence module's tick (`cadence/index.ts`) calls it first, then `updateStrikerGear`. It still
ticks every id in `BLEED_EFFECT_IDS` (`cadence-hemorrhage` for Rend, `striker-rot` for Festering
Cut); the `hasHemorrhage` marker and `world.hemorrhagedMonsters` are unchanged.
`strikerOrder.test.ts` and `strikerGear.test.ts` pass at every commit.

### 1–3. The frame loop, the T3 paths, the relic threshold path (`8c655dee`)

- Deleted `cadence/frameLoop.ts` (188) and `cadence/t3/` (10 files, 805): `core/buffs.ts` (191),
  `core/constants.ts` (49), `core/crescendo.ts` (40), `core/rampage.ts` (54), `index.ts` (23),
  `pipeline/empoweredHit.ts` (186), `normalHit.ts` (72), `swiftblade.ts` (77), `verdict.ts` (70),
  `ticks/cadenceState.ts` (43). With them `CADENCE_FRAME_BUFFS` and `CADENCE_T3_BUFFS`.
- `cadence/index.ts`: the tick runs the bleed driver and the gear; the buffs are the Order's only.
- `cadencePrototype.ts` keeps the empowered multiplier, the mechanic-fired listener and the beat
  counter (`runStrikerBeat` / `advanceStrikerBeat`). Gone: the frame and T3 inits, the empty
  `updateCadenceArchetype`, and the relic-profile threshold fallback. The fallback is now
  `if (threshold === 0) threshold = 5` (the recalc sets it, the Order resets it before every swing).
  `resolveCadenceRelicProfile` and `relicRatingsFromPassives` stay: other code uses them (below).
- What only the paths wrote:
  - The eight buff ids `cadence-accelerando`, `-echo`, `-resonance`, `-verdict`, `-aftershock`,
    `-metronome`, `-rampage`, `-crescendo` (`shared/src/components/combat/buffs.ts`).
  - Their effect text in `buffSync.ts`, their copy in `client/src/hud/statusHelp.ts` and seven icon
    ids in `conceptIcons.ts`. `cadence-rampage` stays there, commented, because boss enrage,
    frenzy and attack-speed buffs wear its art (`BOSS_EFFECT_ALIASES`).
  - The `frame.cadence.window` alias in `server/scripts/statusAudit.ts`.
  - The FX tags `CADENCE_OVERLOAD_FX`, `CADENCE_CURSED_FINALE_FX` and `CADENCE_VERDICT_EXECUTE_FX`
    (`shared/src/protocol/clientEffects.ts`), their combatFx handlers, and their cues
    `fxVerdictExecute`, `fxRampageOverload`, `fxCursedFinale` (`client/src/fx/t4Triggers.ts`, −142).
  - The `aftershock` client effect and `client/src/fx/aftershock.ts` (73).
  - The Echo and Rampage entries in `SCALABLE_MECHANIC_BUFFS` (`mechanicEffectScaling.ts`).
- `tools/dps-report.ts` imported `crescendoMultiplier` from `t3/`, so `pnpm dps:report` would have
  crashed on load. Its cadence estimate is now the plain combo; the nine path estimates and
  `averageCrescendoBonus` went (+11 / −112).

### 4. `UsesCadence` fields and their readouts (`e93f5303`)

- `usesCadence` keeps `count`, `threshold`, `sparkTrophyId`, `coiled`. Gone: `speedStacks`, `charge`,
  `echo`, `aftershockCharges`, `metronomeBonus`, `metronomeStacks`, `resonanceStacks`,
  `rampageStacks`, `rampageDecayMs`, `rampageCdReduction`, `crescendoTimerMs`, `verdictStored`.
- Readouts: the view's `cadenceSpeedStacks` (`views.ts`) and the Rampage aura it computed; the T1
  snapshot's `cadenceSpeedStacks` (`tier1Snapshot.ts`, `bot/src/telemetry/t1Snapshots.ts`); the HUD
  atom and the debug panel row; the client `rampage-1..3` aura colours (`client/src/fx/aura.ts`).
- The recalc (`server/src/ecs/playerEntityFormulas.ts`): `resetCadenceCounters` sets only the
  threshold and the count; the preserving recalc no longer re-applies a Rampage cooldown reduction.
- `relicPreview.ts` loses its `rampageStacks` option (no caller passed it).
- `server/bench/balance/t4ScalingStudy.ts` (frozen study): its Rampage and Crescendo arms
  (`speed30`, `threshold3`, `cap100`) are inert labels and its `rampage` column reads null, the way
  D2 and D3 left frozen bench fields.

### Passive keys and labels (`7f3b522b`)

- `CADENCE_KEYS` keeps `cadence.empowered-threshold`, `-empowered-mult`, `-threshold-mod`,
  `-damage-mult-add` (the recalc, the empowered multiplier, the relic preview and dps-report read
  them) and the four range-node keys (below). The other 37 keys went: the four `frame-*` keys and
  the 33 path keys.
- Their readers and labels: 14 help lines in `client/src/hud/stat/statHelp.ts`; in
  `passiveText.ts` the `cadence.momentum-buildup` percent rule and the `cadence.debuff-vuln-pct`
  whole-points rule; the stat rebuild's Shockblade per-tier on-hit (`shared/src/systems/stats.ts`);
  the cadence lines of `relicEffectPreview.ts`; four bench relic-scorer entries
  (`server/bench/balance/progression.ts`); the client's Hemomancer finisher wound (combatFx's
  `isBleedOpen` and `client/src/fx/bleedOpen.ts`, 85).

### Comments (`657dca90`)

`classes/shared/debuffs.ts` (vulnerability, credited to Cursed Finale), `combat/damage/effectivePlating.ts`
(the plating-shred sum) and `client/src/fx/dotTick.ts` (credited Hemomancer's bleed) now name their
live writers.

## Checks

- `pnpm typecheck`: clean after every commit (exit 0, 0 `error TS`).
- `pnpm test -- striker cadence status hudStatus recovery bleed`: **`8/8 passed in 7s`**
  (strikerOrder, strikerGear, cadenceClassSelection, recovery, hudStatusTooltips, statusRegistry,
  strikerKit, recoveryFormat). Wider runs during the work, the last one:
  `21/21 passed in 19s` (adds relic, skillTree, skillPreview, describeText, dpsEstimate, stat,
  attackProgression, progressionCheckpoint).
- Full suite in `../mmo-rw-verify` (`git checkout --detach rw/cs7-cleanup` → `pnpm test` →
  `git checkout rw/verify`), at `657dca90`: **`335/335 passed in 159s`**, no FAIL. Baseline 336;
  the deleted `crescendoKnee.test.ts` is the difference. `biomeEcology` passed first time.
- `git diff --numstat b314c4ac HEAD`: no whole-file line-ending churn; every touched file is LF
  before and after.
- `tools/dps-report.ts` is not in `pnpm typecheck`. Checked alone with its own tsconfig: no error at
  or near the edit; the errors it reports (Node types, `import.meta`, nullability) predate it.
- Grep of `swiftblade|verdict|rampage|crescendo|hemomancer|metronome|resonance|aftershock|accelerando|
  wavecrest|maestro|juggernaut|berserker|justicar|shockblade|scrapper|cursed finale|cadence/t3|
  frameLoop` over `shared/src server client admin bot tools`: what is left is monster and boss
  words (Stoneplate Juggernaut, boss aftershock fault lines, monster rampage, `squire-rampage`), the
  class kit's new pieces (Crescendo leaf, Verdict trophy), history comments in other classes'
  code, the kept `cadence-rampage` icon, and the kept Striker bespoke FX (below).

## Tests deleted or rewritten

- **Deleted:** `server/test/crescendoKnee.test.ts` (Juggernaut's Crescendo curve).
- **Blocks removed:** `relicMechanicEffectCoverage.test.ts`, the whole Berserker Rampage block
  (buff-effect scaling, stacks, overload, decay, penalty, potency, preview; −157) and its imports;
  `coreRelicIntegration.test.ts`, the "relic transforms the ramped threshold" block;
  `_coreRelicAudit.ts` (throwaway), its RAMPAGE print; `hudStatusTooltips.test.ts`, the Rampage
  copy checks and the Aftershock and Crescendo description rows; `skillTreeData.test.ts`, the two
  `cadence.debuff-vuln-pct` format pins.
- **Rewritten to live examples:** `mechanicEffectScaling.test.ts` (`cadence-echo` → `energy-overdrive`);
  `coreRelicIntegration.test.ts` (the attributed buff line and the unrated relic use Overdrive
  instead of Echo); `describeText.test.ts` (flag row `cadence.detonation` → `cooldown.overdrive`);
  `skillPreview.test.ts` (`cadence.extra-trigger-damage-mult` → `cadence.empowered-mult`).

## Not done, or unsure

Kept, each the conductor's call:

- **`client/src/fx/bespoke/striker.ts` is untouched, and so is combatFx's Swiftblade branch.** The
  brief names this file as a reader to clean; bible §12.14 keeps it ("the Striker slash, its bespoke
  effects ... `fx/bespoke/striker.ts`"). The bible wins on a disagreement, so I kept it and
  am raising it here. Its `STRIKER_PATHS` table is keyed by `cadence-*-t3-*` ids that no node grants since F4,
  so none of it can fire. It reads the deleted buff ids (`cadence-crescendo`, `-verdict`, `-echo`,
  `-aftershock`) as plain strings and the `rampage-N` aura the view no longer sends; it compiles.
  Its Hemomancer comment names `fxBleedOpen`, which is deleted. `fxSwiftbladeStrike` is drawn on a
  `swiftblade` tag nothing emits now. `server/test/attackProgression.test.ts` pins 45 covered
  specializations, these nine included. To delete them: remove the table and the Swiftblade branch,
  then lower that count.
- **Client FX art not named by the bible was deleted** (the three Verdict/Rampage/Cursed Finale
  cues, `aftershock.ts`, `bleedOpen.ts`, the Rampage aura colours). It is recoverable at `b314c4ac`
  or the tag `pre-rework-2026-10-13`. The art PNGs of the seven removed buff tiles stay in
  `client/public/assets/concept-icons/statuses/buffs/` (the art pipeline owns them).
- **The `HasDetonation` marker** (`shared/src/components/archetypes/cadence/hasDetonation.ts`,
  "Delayed Verdict detonation fuse") has had no writer since before this task. It stays: removing it reaches
  `entity.ts`, `markerHelpers.ts`, `markerInvariants.ts` (`cadence-detonation`),
  `World.detonatedMonsters` and the DoT class's `dot/t3/core/mirroring.ts`.
- **The range nodes.** `cadence.range-*` keys and `server/src/systems/combat/rangeMechanics.ts`
  (Lancer's at-bay slow, Phantom-Blade's opener) are outside the brief and stay. Nothing authors the
  keys. Bible §12.14 lists "range nodes" under remove.
- **The relic threshold math outside `cadencePrototype.ts`.** The recalc (`shared/src/systems/stats.ts`)
  still sets the threshold through `resolveCadenceRelicProfile` (the ratings read zero without
  relic items), `empoweredAttacks.ts` uses it for relic potency on the finisher multiplier, and
  `relicPreview.ts` / `empoweredMult.ts` preview it. The Order overrides the threshold before every
  swing. Not in the brief's paths; kept.
- **The bible's §12.14 Keep row "the frame loop's containers ... `cadence/frameLoop.ts`"**: deleted
  as the brief and `C-striker.md` say ("return at T2 as Light's shine and Heavy's Momentum");
  recoverable at `b314c4ac`. The shared container helpers (`classes/shared/frameLoop.ts`) and the
  `frame-window` / `frame-charge` tiles stay; the Squire uses them.
- **Frozen data:** `server/test/fixtures/v1d-earned-t1-state.json` and `v1m-earned-t3-snapshot.json`
  still hold `cadenceSpeedStacks: 0` in `classResources` (like D2's `riteSlots`); the checkpoint test
  casts the JSON, so it is inert. The T4 scaling study's `Arm` type still lists the inert arms.
- `buffSync.ts`'s `buffSourceName` still maps a `cadence-` prefix to "Cadence"; no buff has it now.
- Docs are untouched (outside the brief): `docs/*-current-state.md` and others still describe the
  frames and paths.

## Files outside the brief I needed (edited)

- `tools/dps-report.ts`: imported `crescendoMultiplier` from the deleted `t3/` (it would crash on load).
- `shared/src/systems/stats.ts`, `relicEffectPreview.ts`: read removed keys (typecheck).
  `relicPreview.ts`: the Rampage option. `mechanicEffectScaling.ts` (+ its test): the Echo and Rampage
  buff entries.
- `server/src/systems/combat/buffs/buffSync.ts`: switches on `BuffId` (typecheck).
- `server/src/ecs/playerEntityFormulas.ts`: the recalc the brief names ("the recalc's
  `resetCadenceCounters` parts").
- `server/scripts/statusAudit.ts`: the `frame.cadence.window` alias the cadence frame loop produced.
- `server/src/systems/classes/shared/debuffs.ts`: one comment.
- `bot/src/telemetry/t1Snapshots.ts`: copied `cadenceSpeedStacks` (the brief's "bot readouts").
- `docs/briefs/class-first-build/STATUS.md` was not updated: it is the conductor's.
