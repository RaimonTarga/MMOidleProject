# CQ5-UI report
**Agent:** Grok   **Branch:** rw/cq5-ui   **Last commit:** 5bcbdb4e (this report is the commit after it)

## Done

- **Editor.** `client/src/ui/class/ResponsesEditor.tsx`, rendered by `ClassSystemEditor` when `view.systemKind === 'responses'`. It calls `composeResponsesView` with the screen's config and the same player fields the shell already reads.
  - One row per response: icon, name, rank, family, `when {answers}`, every line, and `{cost} → {refund} pips`.
  - The toggle sends `withRule(config, pieceId, { enabled })`.
  - Conditions are listed and not editable. Each has a "remove" that sends `withRule` with that condition dropped.
  - Ground telegraphs are two buttons, "Hold (guard and keep swinging)" (`hold`) and "Step out" (`step-out`), via `withGroundTelegraphs`.
  - The slam rule is read-only: its lines, or "No slam rule" when none are set.
  - The slam slot shows `view.slam`. A trophy uses its icon and name. With none equipped, the slot is the plain Slam piece. Equipping stays on the shell's relic section.
  - `view.problems`, when any, use the panel's danger style.
  - An edit sends `class:setConfig`. The helpers set the mode to custom.
- **Resolve pips.** `client/src/hud/mechanics/ResolvePips.tsx` replaces the cooldown dial for a player whose `classConfig.system.kind` is `responses`. A cooldown player without Response rules still gets the dial. There are `resolveMax` pips. The next pip is filled by the fraction of `resolve`. The row pulses when the bar rises by a pip or more. A hidden tab and reduced motion skip that pulse. The slam marker is lit while `executionReady`. The numbers come off `localPlayerViewAtom`, which the HUD sync already stores. On the one-line mobile strip the same bar reads `Resolve {n} / {max}`, or `SLAM` when it is armed.
- **Trophy slam callout.** `announceTrophySlam` in `client/src/render/combatFx.ts`. An execution hit from a Squire with a trophy in `classConfig.relic` calls that trophy's name out over the player, for the whole node, through `spawnSkillCallout`. A plain slam, with no trophy, does not. Ordinary ripostes are proc hits with `execution: false`, so they do not call out.

## Checks

- pnpm typecheck: clean (exit 0, including bench and test projects)
- pnpm --filter @mmo-idle/client build: succeeded (`tsc && vite build`, built in 36.40s)
- pnpm test -- orderView classScreenView responsesView: 3/3 passed in 3s

```
PASS  shared/src/classKits/responsesView.test.ts  (2.5s)
PASS  shared/src/classKits/classScreenView.test.ts  (2.6s)
PASS  shared/src/classKits/orderView.test.ts  (2.6s)
3/3 passed in 3s
```

- Browser: not run. This session has no browser tools, and the brief says not to start a server.

## Not done, or unsure

- **GUARDED** is not shown. `squireGuarded` is set on the server exchange when a braced hit lands. `monster-hit` has no field for it (`targetId`, position, `empowered`, `execution`, damage, and the mitigation hints). The client cannot tell a caught blow from any other hit.
- **INTERRUPTED** is not shown. A landed Shield Bash aborts the wind-up through `abortMonsterCast`, which emits `monster-cast-end` with `fired: false`. That same event is every other abort (out of range, target lost, a different stun). The client cannot tell a Shield Bash from those.
- The empty slam rule reads "No slam rule". The brief did not give that sentence. It follows the Striker editor's "No hold rule".
- The panel, the pips, and the callout were not exercised in a browser.

## Files outside the brief I needed (not edited)

- `shared/src/protocol/combatEvents.ts`. A `squireGuarded` bit on `monster-hit` is what GUARDED needs. Not edited.
- `server/src/systems/classes/archetypes/cooldown/squire.ts`. Shield Bash does not emit an event that names itself. Not edited.
- `client/src/hud/atoms.ts`. `resolve` and `resolveMax` are already on the player view, and `localPlayerViewAtom` already receives that view. No new atoms.
