# AP5-UI report

**Agent:** Codex   **Branch:** rw/ap5-ui   **Last commit:** bc610a18 (implementation; this report is committed separately)

## Done

- `client/src/ui/class/PayoffsEditor.tsx` renders the shared `composePayoffsView` through `usePayoffsView`. `ClassSystemEditor` selects it for `payoffs`.
- The enemy silhouette sits inside a violet ring of `sigils.cap` pips, labelled "Sigils N". The owned moments surround it on desktop and stack below it on narrow screens. Each moment uses the view's text and lists its placements in priority order, with the payoff icon/name, poison/fire/frost colour, conditions in words, and remove control.
- Owned payoff cards show name, family, rank and text. Their moment pickers offer only the moments the view exposes. Add appends through `withPlacement`; remove uses the placement's global config index through `withoutPlacement`.
- The optional "Only with three or more enemies near" toggle uses `withPlacementConditions`. It replaces an existing nearby-enemy condition with the three-enemy preset, preserves unrelated conditions, and removes the preset when turned off. All edits use `hudBus.requestSetClassConfig` and become Custom through the shared helpers; the UI waits for authoritative config state.
- The relic's icon, name, kind and line are read-only here; the shell remains the place to equip trophies. View validation problems appear verbatim in the existing panel error style.
- `client/src/hud/sigilWorldRing.ts` draws violet pips around the current enemy's ground shadow, hooked into `client/src/render/effectOverlays.ts`. Filled pips use the published `PlayerView.targetDotStacks`; room is the shared mastery budget plus the resolved `apprentice.cap-extra` weapon bonus. Ring geometry grows with the cap and follows the shadow's position in the ground depth band. No tweens or gameplay decisions are added.
- The world ring clears on target loss, concealment, death, node mismatch or leaving Payoffs, and is destroyed through the existing entity-overlay cleanup. Over-cap counts fill the available ring; the HUD retains the full numeric count.
- `client/src/hud/SigilReadout.tsx` and `SigilRing.tsx` replace the legacy stack presentation for Payoff characters in the desktop `DotMechanic` and mobile `CompactMechanic`. They say "Sigils N" and "Target X / N", use the weapon cap bonus, and explain sigils rather than the old conversion mechanic. Other characters keep their existing presentation.
- Work stayed in `mmo-rw-ap5-ui` after the user confirmed the worktree correction. No shared/server source, existing art, dependency files or other worktrees were edited; no install command was run.

## Checks

- `pnpm typecheck`: clean, including bench and test projects.
- `pnpm --filter @mmo-idle/client build`: succeeded. Vite reported its large-chunk warning.
- `pnpm test -- orderView payoffsView classScreenView apprenticeSigils`:

```text
PASS  shared/src/classKits/classScreenView.test.ts  (5.6s)
PASS  shared/src/classKits/payoffsView.test.ts  (6.1s)
PASS  shared/src/classKits/orderView.test.ts  (7.0s)
PASS  server/test/apprenticeSigils.test.ts  (57.6s)
4/4 passed in 58s
```

- An isolated Chromium fixture bundled the actual editor and both HUD components, without a server. It passed starter gating (one moment, one payoff, four pips), T1 gating (three moments, six payoffs), the seven-pip weapon-bonus readouts, add/remove/preset intent payloads, Custom mode, waiting for a simulated server acknowledgement, Enter-key toggle activation, and verbatim validation errors. At 390 px, document width and scroll width were both 390 px; no browser exceptions occurred.
- Inspected the fixture's desktop and 390 px screenshots by eye: the enemy card, numbered priority chips, payoff cards, relic and both HUD readings render; narrow screens stack the moments and keep controls within the viewport. Asset requests were blocked in the fixture, so icon fallbacks were exercised. The temporary fixture and screenshots were removed.
- A simulated Graphics adapter exercised the actual world-ring function: seven pips with three filled at the target shadow, hiding for concealment, clamping visual fill for an over-cap count, clearing after target loss, and destroying the graphics on target cleanup.
- `git diff --check`: clean. Existing edited files retain LF endings; numstat shows small changes rather than whole-file conversions.

## Not done, or unsure

- Trophy-payoff and three-or-more-chain callouts are skipped as AP5-UI permits: `sigils.ts` publishes no identifying payoff/chain event, and generic damage/status changes do not establish which trophy fired. Plain ticks and spreads gain no callouts.
- The ring follows the local player's current target. The client does not receive reliable owner-specific sigil counts for every affected enemy: `targetStatus` is mirrored only for targeted monsters and carries no source id. Rendering rings on all affected enemies requires additional shared/server data.
- Live combat, network persistence/progression, the world ring's appearance over actual terrain/sprites, and real icon loading remain unverified. No game server or bot was started, as the agent rules require. The isolated browser/Graphics checks above are presentation evidence, not a live playtest.

## Files outside the brief I needed (not edited)

- None for the delivered editor and target ring.
- A future all-enemy ring needs the shared monster/status contract and server status mirroring to expose owner-specific counts. Identifying trophy/chain callouts similarly needs shared combat-event data and server emission; neither was changed in this client-only task.
