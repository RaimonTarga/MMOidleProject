# CS7-CLEANUP: delete the Striker's old frame and path content

**Agent:** Codex or Grok · **Worktree:** `../mmo-rw-cs7-cleanup` · **Branch:** `rw/cs7-cleanup` ·
**Size:** M · **Starts any time** (the Order runtime it must keep is merged)

**Read first:** `AGENT-RULES.md`; `C-striker.md` (this folder, "What exists and what it becomes");
the bible §12.14 (salvage: keep / remove) in `design_docs/class-first-bible.md`; the D1, D2 and D3
reports in `reports/` (how earlier removals were done and reported).

## Why

The Striker now runs on the Order (`server/src/systems/classes/archetypes/cadence/order.ts`,
`strikerGear.ts`). The old cadence content is dead weight: the frame loop (Flurry / Skirmisher /
Breaker windows and banks) and the nine T3 paths (Swiftblade, Verdict, Rampage, Crescendo,
Hemorrhage, Aftershock, Metronome, Resonance, Echo...). The Passive Tree no longer has the frame
and path nodes that granted their passives (F4), so none of it can fire; it still registers
listeners, ticks, buffs and networked fields.

## Keep (do not delete)

- `order.ts`, `strikerGear.ts`, and in `cadencePrototype.ts` the empowered multiplier, the
  mechanic-fired listener and the beat counter that calls `runStrikerBeat` / `advanceStrikerBeat`.
- **The bleed tick driver.** `t3/ticks/hemorrhage.ts` (`updateHemorrhages`) ticks Rend's bleed
  and Festering Cut's rot (`BLEED_EFFECT_IDS` in `server/src/systems/combat/damage/bleedIds.ts`).
  **Move it** out of `t3/` (to `server/src/systems/combat/damage/bleedTicks.ts`) and keep calling
  it from the cadence module's tick, before deleting `t3/`.
- `usesCadence.count`, `threshold`, `sparkTrophyId`, `coiled`; the `cadence-hemorrhage` and
  `vulnerability` statuses and their client tiles (the Order writes them).

## Delete

1. `cadence/frameLoop.ts` and its init, buffs and helpers; the `cadence.frame-*` passive keys
   and their labels if nothing else reads them.
2. `cadence/t3/` entirely (after moving the bleed driver), its init and tick calls and
   `CADENCE_T3_BUFFS`; the `cadence.*` passive keys only those read, and their labels.
3. The relic-profile threshold path in `cadencePrototype.ts` (`resolveCadenceRelicProfile`,
   `relicRatingsFromPassives`): the Order sets the threshold. Delete the shared helpers if
   nothing else uses them.
4. `UsesCadence` fields only the paths used (`speedStacks`, `charge`, `echo`, `aftershockCharges`,
   `metronome*`, `resonanceStacks`, `rampage*`, `crescendoTimerMs`, `verdictStored`), with their
   readouts: `shared/src/protocol/views.ts` (`cadenceSpeedStacks`...), the client HUD and FX
   that read them (`client/src/fx/bespoke/striker.ts` and others), the recalc's
   `resetCadenceCounters` parts for them, admin and bot readouts.
5. Status ids and client tiles that only the paths wrote (check with
   `server/test/statusRegistry.test.ts` and `server/test/hudStatusTooltips.test.ts`: they fail
   on a writer without a tile and on a tile without a writer).
6. Tests that pin the removed content; list each.

When unsure whether something is still reachable, keep it and list it in your report.

## Edit only

`server/src/systems/classes/archetypes/cadence/` (not `order.ts` or `strikerGear.ts` beyond
imports), `server/src/systems/combat/damage/` (the bleed driver's new home), the shared passive
keys and labels, `shared/src/components/archetypes/cadence/`, the views/protocol fields above,
the client HUD/FX files that read removed fields or statuses, bench/bot/admin readouts of them,
the tests that pin them, and your report.

## Checks

- `pnpm typecheck` clean after every commit.
- `pnpm test -- striker cadence status hudStatus recovery bleed` pass (`strikerOrder.test.ts`
  and `strikerGear.test.ts` must stay green: they prove the Order and the bleed still work).
- Then the full suite in `../mmo-rw-verify`, as `AGENT-RULES.md` says (`N/M passed`).

## Report

`docs/briefs/class-first-build/reports/CS7-CLEANUP.md` (AGENT-RULES shape): per area, files and
lines deleted; where the bleed driver lives now; every kept-but-unsure item; every test deleted.
