# CS5-UI report
**Agent:** Grok   **Branch:** rw/cs5-ui   **Last commit:** 0307465a

## Done

- **Order editor** (`client/src/ui/class/OrderEditor.tsx`), rendered by `ClassSystemEditor` when `view.systemKind === 'order'`. Other classes still get the placeholder.
  - A row from `composeOrderView`: the opener, the middle beats, the wind-up, then the finisher. Each beat shows the technique icon and name, or "Plain swing". The opener and the wind-up are marked "Opener · cast" and "Wind-up · cast". A mastered beat is gold.
  - Clicking a beat opens a picker: "Plain swing", plus every owned technique whose `allowedBeats` includes that beat (icon, name, rank, family, lines). Picking sends `setClassConfig(withBeat(config, index, pieceId))`.
  - The counter reads "Techniques: {used} of {open} beats", and ", {mastered} mastered" once that count is not zero.
  - When every open beat is used, picking a technique that is not already placed onto a plain beat shows "Every open beat is used." and does not send. A technique already on another beat moves. Clearing a beat to "Plain swing" still sends.
  - The finisher slot shows the trophy icon and name, or "Finisher". Clicking it scrolls to the shell's relic section (`#class-panel-relic`).
  - The hold rule is read-only: each `view.holdFinisher` line, or "No hold rule".
  - `view.problems`, when any, use the panel's danger colour with `role="alert"`.
- **Beat strip** (`client/src/hud/OrderStrip.tsx`). Data is `composeOrderView` plus `cadenceCount` / `cadenceEmpoweredArmed`.
  - On the desktop stat panel, `CadenceMechanic` renders the strip instead of the hit pips when the player has an Order. The frame title is "Order". A cadence player with no Order still gets the old pips.
  - On mobile, the pips are not on screen (`#left-sidebar` is hidden). `CompactMechanic` is the cadence readout there, so it renders the same strip as one 20px row inside the existing 24px mechanic slot.
  - One cell per beat, then the finisher. Landed beats are dim, the next beat is highlighted, and beats still to come are normal. Beat `cadenceCount` is next. `cadenceEmpoweredArmed` means the finisher is next, because arming wraps the counter back to 0.
  - A technique cell uses `classPieceIconSource`. A plain beat is a short mark. Grey is plain, the class colour (`--hud-mechanic-cadence`) is a technique, gold (`#f1d689`) is mastered. The finisher cell is the trophy icon, or a heavier plain mark when no trophy is equipped.
- **Trophy finisher callout** in `client/src/render/combatFx.ts` (`announceTrophyFinisher`). An empowered `player-hit` for a cadence player whose Order has a real trophy calls out that trophy's name over the player, through `abilityCallout` and `spawnSkillCallout`. Plain finishers and ordinary beats do not call out. A cast already names itself on the cast bar.

## Checks

- pnpm typecheck: clean (exit 0, including bench and test projects)
- pnpm --filter @mmo-idle/client build: succeeded (`tsc && vite build`, built in 14.64s)
- pnpm test -- orderView classScreenView: 2/2 passed in 3s

```
PASS  shared/src/classKits/classScreenView.test.ts  (3.0s)
PASS  shared/src/classKits/orderView.test.ts  (3.1s)
2/2 passed in 3s
```

- Browser: not run. This session has no browser tools, and the brief says not to start a server. The editor, the strip, and the callout are unverified on screen.

## Not done, or unsure

- Moving a technique that is already placed onto a plain beat still sends while every open beat is used, because the move does not take another slot. Only a technique that is not placed is refused, with "Every open beat is used."
- The client hit event only has `empowered`. A mechanic-proxy payoff sets that too, and there is no flag here that separates it from the finisher, so a proxy hit names the equipped trophy as well.
- Skyfall is both a cast and a trophy finisher. The cast bar names it during the wind-up, and the landing callout names it again.
- Escape still closes the class panel. The picker closes when a choice is taken, when the finisher is clicked, or when the pointer goes outside the editor.
- The mobile strip is fitted to the existing 24px row. Whether seven beats (Light) stay readable there is unverified.

## Files outside the brief I needed (not edited)

- `client/src/hud/hud.css`. `.mhud-mech` caps the mobile mechanic at 24px. The compact strip is built to that height. Making the row taller would be an edit outside the brief.
- `client/src/hud/primitives/GameDialog.tsx` and `client/src/ui/class/ClassPanel.tsx`. Escape closes the dialog. Keeping the panel open while a picker is up would mean teaching the dialog about the picker from `ClassPanel`.
