# CD6-UI report
**Agent:** Grok   **Branch:** rw/cd6-ui   **Last commit:** b4257b7e (this report is the commit after it)

## Done

- **Editor.** `client/src/ui/class/FormationEditor.tsx`, rendered by `ClassSystemEditor` when `view.systemKind === 'formation'`. `useFormationView` calls `composeFormationView`. An edit sends `class:setConfig` through `hudBus.requestSetClassConfig`. `withRoster` and `withOrders` set the mode to custom.
  - Command is pips, `command.used` of `command.total`, with the line `Command: {used} of {total}`. The pip count is the total. When used is past the total, every pip is spent and the line uses the panel's danger colour.
  - The roster is grouped Front, Middle, Back. Each body is a card: piece icon (`classPieceIconSource`), name, family, mode, text, `{command} Command`, and remove. Bound summons sit under that as cards with add. Add is always sent, including past Command. The editor keeps that tried roster as a pending config and composes it, so `problems` show while the panel is open. Each problem string is shown as the view gives it, in a list with `role="alert"`.
  - Attack first, Tanks guard, and Rebuild first are choice buttons. The label on each button is the view's `option.label`.
  - Recall is listed read-only. An empty `recallWhen` shows the sentence "Never". The "never" button sets `recallWhen: []`. The "when my HP is low" button sets `[{ id: 'hp-low' }]`.
  - The Soul card shows the view's name and line. A trophy uses `trophyIconSource`. With none, the card shows the view's own "No Soul yet" text. Equipping stays on the shell's relic section (`#class-panel-relic`), above this editor. There is no scroll button.
- **HUD.** When `useFormationView()` returns a formation, `SummonerMechanic` titles the frame "Formation", shows Command pips and `{used} / {total}`, and names each body alive or fallen. The rebuild queue is the slots with `queuePosition >= 0`, in order. The line is `Next rebuild: {name}`, and `Waiting: {names}` when more than one is queued. The help text says a rebuild is paid from HP and names the next body. A summoner with no formation config still gets the old Summons widget, with the same descriptions as before.
  - On the mobile strip, `CompactMechanic` reads `Command` and `{used} / {total}`, plus ` · {n} fallen` when any body is down, with the existing track. The named queue and the drawn pips stay on the desktop frame. `.mhud-mech` caps that row at 24px.
- **Shift-click.** `sendCommandSummons` is gone from `client/src/net/intents.ts`. Hold-still in `clickToMove.ts` cancels auto, marks the point, and returns. Recall stays on R (`class.recall`, `sendRecallSummons`). No separate player-facing hint string was in the client.
- Command pip and queue styles are in `client/src/hud/mechanics/mechanics.css`, where the summoner HUD styles already live. The editor's own styles are `formationEditor.css`.

## Checks

- pnpm typecheck: clean (exit 0, including bench and test projects)
- pnpm --filter @mmo-idle/client build: succeeded (`tsc && vite build`, built in 34.68s). Vite's chunk-size notice is the existing one; the build exited 0.
- pnpm test -- orderView classScreenView formationView: 3/3 passed in 3s

```
PASS  shared/src/classKits/classScreenView.test.ts  (2.5s)
PASS  shared/src/classKits/orderView.test.ts  (2.5s)
PASS  shared/src/classKits/formationView.test.ts  (2.6s)
3/3 passed in 3s
```

- Browser: not run. The brief says not to start a server. The editor, the HUD, and the shift-click removal were not exercised in a browser.

## Not done, or unsure

- The next rebuild's HP cost is absent from `SummonSlotView` and the player view. The server computes it in `reconstruction.ts`. The HUD names who is next and says the rebuild is paid from HP. Showing the number needs a networked `costHp` (for example on the active reconstruction). Shared and server were left as they are.
- The weapon's Command is absent from the client's total. `formationView.ts` says the weapon's Command is already in the total. `composeFormationView` uses `classConfigContextFromState`, which leaves `budgetBonus` at 0. The server's `classConfigContextOf` adds `mechanicEffects['conduit.command']`. The editor and the HUD show the view's total. A roster the weapon pays for can show `this formation needs N Command; you have M` on the pending roster and again after the server stores it, because the stored view still uses the short total. The sentence is shown as the view gives it.
- The server stores a config only when `validateClassConfig` accepts it, so an over-Command add never lands in the atom. The pending draft is how the panel still shows that reason. It clears when the stored JSON matches the pending JSON, or when the stored JSON differs from the snapshot taken at send time. While the panel stays open after a refusal, the editor can show a roster the HUD is not using. `class:configResult` still toasts the server's reasons through the existing listener.
- Empty recall reads "Never". The brief did not give that sentence. It follows the Striker editor's "No hold rule" and the Squire editor's "No slam rule". The view's own line for `hp-low` is "when your HP is low".
- The mobile row is the existing 24px strip: text and a track, plus a fallen count. The named queue is on the desktop Formation frame.
- A character still on a frame can have a formation config while the live slots use the old ids. `bodyName` then shows the slot id. CD8 removes that gate.
- Hold-still still drops a move marker for every class. It no longer sends a summon command.

## Files outside the brief I needed (not edited)

- `shared/src/protocol/socketEvents.ts`. The comment on `player:commandSummons` still says "Summoner: shift+click command — focus a clicked enemy or move minions to a point." The server handler stays.
- `client/src/render/moveMarker.ts`. `MoveMarkerKind` still includes `'summon'`. Nothing passes that kind now.
- `shared/src/classKits/config.ts` (`classConfigContextFromState`) and `server/src/systems/player/progression/classConfig.ts`. The weapon bonus is only on the server context.
- `shared/src/systems/summonerHud.ts`. Slots have `queuePosition` and no HP cost.
- `client/src/hud/hud.css`. `.mhud-mech` caps the mobile mechanic at 24px. The compact row is built to that height.
- `client/src/ui/class/ClassPanel.tsx`. The relic section (`#class-panel-relic`) is where a Soul is equipped, above the system editor.
