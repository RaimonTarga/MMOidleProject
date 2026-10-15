# CL5-UI, CL6-ROUTE, CL7-CLEANUP: the Slinger's delegate tasks

The Slinger's versions of CS5-UI/CQ5-UI/CD6-UI, CS6/CQ6/CD7-ROUTE and CS7/CQ7/CD8-CLEANUP. **Read the
Striker brief of the same number first** (`CS5-striker-ui.md`, `CS6-striker-route.md`,
`CS7-striker-cleanup.md`) and `CD-conduit-delegates.md`: the rules, the "edit only" shape, the checks
and the report are the same; only what differs is written here. Also read `C-slinger.md` and bible
§10.2–§10.4, §10.13. The conductor's runtime is in (`0d3e7ad6`); `server/test/slingerLoadout.test.ts`
shows every behaviour you will present.

| Task | Agent | Worktree · branch | Needs |
|---|---|---|---|
| **CL5-UI** | Grok | `../mmo-rw-cl5-ui` · `rw/cl5-ui` | `composeLoadoutView` (done, `shared/src/classKits/loadoutView.ts`) |
| **CL6-ROUTE** | Codex or Grok | `../mmo-rw-cl6-route` · `rw/cl6-route` | — |
| **CL7-CLEANUP** | Codex or Grok | `../mmo-rw-cl7-cleanup` · `rw/cl7-cleanup` | server/shared only |

## CL5-UI: the Loadout editor and the ammo ring

- **Editor** (`client/src/ui/class/LoadoutEditor.tsx`, rendered by `ClassSystemEditor` when
  `view.systemKind === 'loadout'`, beside the Order, Response and Formation editors), from
  `composeLoadoutView` (copy `ResponsesEditor` / `OrderEditor` for how a hook feeds it and how an
  edit goes out through the existing class config intent):
  - **The rack** as slot pips (`rack.used` of `rack.slots`); each racked clip a card in its ring
    colour (`color`) with name, family and text, a remove button (`withRack`); **the clips you own**
    below, with an add button. The plain clip is shown as always loaded, not as a slot. Adding past
    the slots is allowed to be tried: show the validator's reason from `problems` as it is.
  - **The rules**: one row per rack clip with its conditions in words (read-only editing is fine:
    a "remove" per rule via `withoutClipRule`), a "switch early" toggle (`withClipRule(...,
    { switchEarly })`), and "none matching loads the plain clip" as the footer line.
  - **The two free rules** as toggles (`withFreeRules`): reload early when nothing threatens you;
    never start a reload inside a telegraph.
  - **The last round**: the trophy round's name and line, or the plain-last-round text.
- **Ammo ring** (find what renders the Slinger's ammo: `client/src/hud/mechanics/` reload widget and
  `client/src/render/players.ts` for the world ring): colour the ring by the loaded clip type
  (`PlayerView.reloadClip`, a kit piece id; the colours are the kit's `color`, ICONS-T1's: plain
  gunmetal, Scatter amber, Snare teal, Venom acid green, Stopping cobalt, Breaching ember red), mark
  the last round gold (`#f5c542`, the kit's `SLINGER_LAST_ROUND_COLOR`), and show the next clip's
  colour beside it (`reloadNextClip`). The reload bar fills around the ring (`reloadRemainingMs` of
  `reloadDurationMs`, already on the view). **Callouts** only for the trophy round (by its name when
  the last round fires: a `player-hit` with the last-round flag if one exists; if the client cannot
  tell, say so in the report) — clip switches show on the ring with no callout.
- The reload is **stationary**: while `reloadRemainingMs > 0` the client's own movement input for a
  Slinger should not predict movement (find the prediction code that handles roots and treat a
  Slinger's reload like one; the server stops the player and Quickdraw's walk speed is its own).
  If the prediction code can't tell Quickdraw from nothing, don't predict at all during a reload.
- Icons: clips are class pieces (`classPieceIconSource(id)`), trophy rounds `trophyIconSource(id)`.
  Do not make art.

## CL6-ROUTE: the Slinger's guided tutorial and bot route

- **Tutorial** `shared/src/tutorial/scripts/slinger.ts` registered in
  `TUTORIAL_CLASS_BEATS['reload-root']`, on the seal route's structure (see `striker.ts`, `squire.ts`).
  Beats (bible §10.4): after the class pick, the plain pistol, the ammo ring and the stationary
  reload ("you stand still while you reload"); the Plains teaches Scatter around minute 6 with its
  default rule (three or more enemies near you); one line as each zone teaches its clip (Snare,
  Venom, Stopping, Breaching); the first boss is won with a plain last round and gives Stampede
  Round as the last round of every clip. Keep lines under the script cap (170 characters).
- **Bot route** `bot/src/routes/slingerT1.ts` (`slinger-t1`), like `striker-t1`, with a
  `classConfig` step in `auto` mode (the §10.13 default Loadout); register it in `ROUTES` and
  `CONTROLLED_ROUTE_IDS`.

## CL7-CLEANUP: delete the Slinger's old frame, range and T3 content

The Loadout runtime is in. The old reload machinery is inert for a character with a Loadout.
Delete it.

- **Delete:** `server/src/systems/classes/archetypes/reload/frameLoop.ts` and `reload/t3/`
  (Duelist, Laser, Snipe, Cannon, Blunderbuss, Kill chain, Death Mark, Momentum...), their
  buffs and `reload.*` passive keys and labels nothing else reads (keep `reload.max-ammo` and
  `reload.reload-time-ms`: the guns use them), the `UsesReload` fields only they used
  (`laserHeat`, `laserOverheated`, `chainRounds`, `clipSpeedStacks`, `clipBaseAttackCooldownMs`,
  `momentum*`, `cannon*`, `deathMark*`) with their readouts in the views, the relic-profile path
  (`resolveReloadRelicProfile` and its callers), status ids only they wrote (the status audits tell
  you), and the tests that pin them.
- **Also remove:** the old half-plating branch in `reload/reloadPrototype.ts` (`ctx.platingMult`
  is 1 for everyone now), the `reload.snipe` / `reload.laser` branches in
  `shared/src/systems/stats.ts` §3b and `classSecondaryDamage.ts`, and `slingerDirectAttack
  Effectiveness` if nothing reads it after that.
- **Keep:** `reloadPrototype.ts` (the clip, ammo and reload bookkeeping), `reloadLifecycle.ts`
  (`registerReloadLifecycleHook`, `startReloadTimer`, `emitReloadStart`, `completeReload`),
  `slinger.ts`, `usesReload.clipId` / `nextClipId`, and the manual reload request.
- **These must stay green:** `slingerLoadout.test.ts`, `slingerKit.test.ts`, `loadoutView.test.ts`,
  `statusRegistry.test.ts` (Venom and Rot must keep their writers), `classAffinity.test.ts`.
  If a test pins a deleted behaviour, delete that test and say so in the report.
