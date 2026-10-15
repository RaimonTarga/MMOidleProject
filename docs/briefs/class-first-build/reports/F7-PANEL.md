# F7-PANEL report
**Agent:** Grok   **Branch:** rw/f7-panel   **Last commit:** 6fce4ae3

## Done

- **State.** `classConfigAtom` is set and reset from the player view, the same way `disciplineIdAtom` is. Identical configs compare with `sameClassConfig`, so a sync that repeats the setup does not redraw the screen. `classOpenAtom` is the primary overlay `'class'`.
- **Intent.** `setClassConfig` is on the intent bus, `hudBus.requestSetClassConfig` emits it, and `sendSetClassConfig` emits `class:setConfig`. `class:configResult` is registered and removed in `wireSocketHandlers`. When `ok` is false, the reasons are shown in `RecipeToastLayer` the same way a loadout error is (one line each, red).
- **Header.** Dialog title is the class name. Once a discipline is picked, its name and one-line fantasy show, with the discipline icon. The mode reads "Auto" with "(the class sets itself up)", or "Custom". "Back to auto" sends the current config with `mode: 'auto'`. It is disabled in auto, and when there is no config to send.
- **Budget.** The section is `view.budget.text` only ("Techniques 2, next at Mastery 30" and the other classes' own wording). Global Mastery is not shown on its own.
- **Relic.** Each equipped trophy is a card: icon, name, kind, rank as "II", and every line. An empty slot reads "Beat a boss to earn a trophy". Two slots when `view.relic.slots` is 2. Under that, every owned trophy. Clicking one sends the current config with `relic: [id]` and `mode: 'custom'`.
- **Editor.** `ClassSystemEditor` shows "The {systemName} editor arrives with this class's track." A class track replaces that file.
- **Pieces.** One card each: icon, name, family, rank, every line, "in use" when placed, "NEW" when `isNew`.
- **Coming this tier.** `view.upcoming`: piece name, "Plains level 8" (whatever `where` says), its text, greyed. The section is omitted when nothing is coming.
- **Rail.** First button in the desktop character-systems nav, labelled with the system name ("Order", "Response rules", …), class crest as the icon. Shown only once a class is picked. Badged with the count of new pieces and trophies.
- **Mobile.** A row in the More sheet, same label, with NEW on the row and a badge on the More tab. It opens the same panel.
- **New badges.** Seen ids live in `localStorage` under `class-screen-seen:<playerId>`. Every read and write is in try/catch. If storage throws, the seen set is omitted and nothing is new. Closing the panel adds every piece and trophy id that panel showed. The write stays on the character who opened it, so a switch does not stamp the next character. Escape, the backdrop, and the close button all unmount the panel, which is what records the ids.
- **Toasts.** `ClassUnlockToasts` sits in the recipe toast column. It keeps the last archetype, biome levels, boss clears, and discipline. The first snapshot, a character switch, and a class change produce no toasts. Otherwise each `classUnlockNotices` entry is "Learned: Sweep", "Sweep rank II", "Trophy: Wide Arc", or "Wide Arc rank II", with its `text` underneath.
- **Icons.** `classPieceIconSource`, `trophyIconSource`, and `disciplineIconSource` point at `concept-icons/class-pieces`, `trophies`, and `disciplines`, each with a `?v=` revision. A missing file uses `GameIcon`'s fallback (the name's first letter) inside the same footprint.

## Checks

- pnpm typecheck: clean (exit 0, including bench and test projects)
- pnpm --filter @mmo-idle/client build: succeeded (`tsc && vite build`, built in 20.61s)
- pnpm test -- classScreenView classKits: 8/8 passed in 5s

```
PASS  shared/src/classKits/conduit/conduitKit.test.ts  (2.9s)
PASS  shared/src/classKits/apprentice/apprenticeKit.test.ts  (3.1s)
PASS  shared/src/classKits/spirit/spiritKit.test.ts  (3.5s)
PASS  shared/src/classKits/classScreenView.test.ts  (3.5s)
PASS  shared/src/classKits/slinger/slingerKit.test.ts  (3.5s)
PASS  shared/src/classKits/classKits.test.ts  (4.7s)
PASS  shared/src/classKits/squire/squireKit.test.ts  (2.4s)
PASS  shared/src/classKits/striker/strikerKit.test.ts  (2.3s)
8/8 passed in 5s
```

- Browser: not run. This session has no browser tools, and the brief says not to start a server for this task.

## Not done, or unsure

- A click equips with `relic: [id]`, the payload the brief writes. With two slots that replaces both with the one trophy. It does not append into the empty slot or ask which slot to fill. If Two Souls should keep the other trophy, that needs a call.
- The panel was not exercised in a browser, so focus order, the mobile More row, and a missing icon's fallback are unverified on screen. Typecheck and the client build did compile them.

## Files outside the brief I needed (not edited)

- `client/src/input/hudEvents.ts`. The `setClassConfig` listener lives in `wireSocketHandlers` and calls `sendSetClassConfig`, so the button still reaches the socket. If that listener is later moved into `hudEvents.ts`, remove the one in `socket.ts` or the setup is sent twice.
- `client/src/scenes/game/sceneSetup.ts`. `class:configResult` is handled in `socket.ts`, which the brief names, and forwarded as `hud:classConfigResult`.
- `client/src/main.ts`. `ClassUnlockToasts` is mounted inside `RecipeToastLayer`, next to the recipe toasts, so the toast root did not need a new mount.
