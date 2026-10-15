# CQ5-UI, CQ6-ROUTE, CQ7-CLEANUP: the Squire's delegate tasks

Three tasks, the Squire's versions of CS5-UI, CS6-ROUTE and CS7-CLEANUP. **Read the Striker brief
of the same number first** (`CS5-striker-ui.md`, `CS6-striker-route.md`, `CS7-striker-cleanup.md`):
the rules, the "edit only" shape, the checks and the report are the same; only what differs is
written here. Also read `C-squire.md` and the bible §8.2–§8.4, §8.13.

| Task | Agent | Worktree · branch | Needs |
|---|---|---|---|
| **CQ5-UI** | Grok | `../mmo-rw-cq5-ui` · `rw/cq5-ui` | F7-PANEL merged (the conductor creates the worktree then) |
| **CQ6-ROUTE** | Codex or Grok | `../mmo-rw-cq6-route` · `rw/cq6-route` | — |
| **CQ7-CLEANUP** | Codex or Grok | `../mmo-rw-cq7-cleanup` · `rw/cq7-cleanup` | — |

## CQ5-UI: the Response rules editor, the Resolve pips, the callouts

- **Editor** (`client/src/ui/class/ResponsesEditor.tsx`, rendered by `ClassSystemEditor` when
  `view.systemKind === 'responses'`), from `composeResponsesView` (`shared/src/classKits/responsesView.ts`):
  one row per response (icon, name, family, "when …" from `answers`, its lines, cost → refund in
  pips); a toggle per rule (`withRule(..., { enabled })`); its conditions listed (editing them can
  wait: list them read-only, with a "remove" per condition via `withRule(..., { conditions })`);
  the ground-telegraph choice as two buttons, "Hold (guard and keep swinging)" / "Step out"
  (`withGroundTelegraphs`); the slam rule read-only; the slam slot showing `view.slam`; `problems`.
- **Resolve pips** on the HUD for a Squire, replacing the cooldown dial (find what renders
  `executionCooldownPct`): `resolveMax` pips, filled to `resolve` (fractional fill on the next
  pip), a pulse when it rises by a refund (a jump of a pip or more at once), the slam marker lit
  when `executionReady`. The player view carries `resolve` and `resolveMax`.
- **Callouts**: "GUARDED" when a hit lands with `squireGuarded` (find how the client learns of a
  monster hit on the player: the `monster-hit` event; if it can't carry the flag, say so),
  "INTERRUPTED" when a Shield Bash lands, and the slam trophy's name when a trophy slam lands.
  Ordinary ripostes never call out.

## CQ6-ROUTE: the Squire's guided tutorial and bot route

- **Tutorial** `shared/src/tutorial/scripts/squire.ts` registered in
  `TUTORIAL_CLASS_BEATS['cooldown-root']`, on the seal route's structure. Beats (bible §8.4): after
  the class pick, Resolve (4 pips filling as you are hit, plus a trickle) and the slam at a full
  bar; the Plains teaches Shove around minute 6 (its default rule: three or more enemies on you);
  one line as each zone teaches its response (Riposte, Steel Will, Guard, Shield Bash); the first
  boss is won with the base kit and its trophy (Muster) changes how Resolve flows. The Toadeater
  meets three answers before its fight (Steel Will, Iron Gut, Purifying Breath): say so before the
  Swamp boss.
- **Bot route** `bot/src/routes/squireT1.ts` (`squire-t1`), like `striker-t1`, with a `classConfig`
  step in `auto` mode (the §8.13 default).

## CQ7-CLEANUP: delete the Squire's old frame and path content

- **Keep:** `squire.ts`, `squireBuffs.ts`; in `cooldownPrototype.ts` the empowered multiplier
  (`EXECUTION_MULTIPLIER`, the slam's), the restart listener that emits `mechanic-fired`, and
  `initSquire()`. The 7 s timer in `updateCooldownArchetype` only runs for a cooldown player
  without Response rules: after F2 every Squire has them, so delete the timer and
  `resolveExecutionCooldownMs` if nothing else reads them (the HUD dial reads
  `executionCooldownPct`, which `addResolve` now writes: keep that field).
- **Delete:** `cooldown/frameLoop.ts`, `cooldown/t3/` (Warrior, Bulwark, Destroyer, Reverb,
  Overdrive, Battery, Channeled Beam...), `registerDestroyerHold`, their buffs and passive keys
  (`cooldown.*` keys nothing else reads) and labels, the relic-profile path, the `UsesCooldown`
  fields only they used (`batteryTimerAcc`, `vengeanceDamageTaken`, `ruptureWindowMs`) with their
  readouts, status ids only they wrote (the status audits tell you), and the tests that pin them.
- `server/test/squireResponses.test.ts` and `server/test/squireGear.test.ts` must stay green.
