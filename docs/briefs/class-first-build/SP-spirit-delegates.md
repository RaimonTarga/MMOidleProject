# SP5-UI, SP6-ROUTE, SP7-CLEANUP: the Spirit's delegate tasks

The Spirit's versions of CS5-UI/CL5-UI, CS6/CL6-ROUTE and CS7/CL7-CLEANUP. **Read the Striker brief
of the same number first** (`CS5-striker-ui.md`, `CS6-striker-route.md`, `CS7-striker-cleanup.md`)
and `CL-slinger-delegates.md`: the rules, the "edit only" shape, the checks and the report are the
same; only what differs is written here. Also read bible §11.2–§11.4, §11.13. The conductor's
runtime is in (`e60d8053`); `server/test/spiritStorm.test.ts` shows every behaviour you will present.

| Task | Agent | Worktree · branch | Needs |
|---|---|---|---|
| **SP5-UI** | Grok | `../mmo-rw-sp5-ui` · `rw/sp5-ui` | `composeThresholdsView` (done, `shared/src/classKits/thresholdsView.ts`) |
| **SP6-ROUTE** | Codex or Grok | `../mmo-rw-sp6-route` · `rw/sp6-route` | — |
| **SP7-CLEANUP** | Codex or Grok | `../mmo-rw-sp7-cleanup` · `rw/sp7-cleanup` | server/shared only |

## SP5-UI: the Thresholds editor and the storm gauge

- **Editor** (`client/src/ui/class/ThresholdsEditor.tsx`, rendered by `ClassSystemEditor` when
  `view.systemKind === 'thresholds'`, beside the Order, Response, Formation and Loadout editors),
  from `composeThresholdsView` (copy `ResponsesEditor` / `OrderEditor` for the hook and the way an
  edit goes out through the existing class config intent). The bible's picture is **a vertical gauge,
  the storm's bottle**:
  - the gauge from empty to full with **the floor** as a draggable (or stepped) line
    (`withFloor`, 0–95) and **the bands** as marks above it: each spend and strike a chip you place
    at a height (`withBand`; a button row of 30/50/80/100 is fine if dragging is hard); calms that
    sit at the floor (`atFloor`) are drawn on the floor line and are not placed;
  - the pieces you know as cards (name, family: strike / squall / calm, text, "waits for ..." from
    `waitsFor`), and **the phase** as two buttons, gather and hover (`withPhase`);
  - **Storm** as pips (`storm.pips`), the relic's name and line (`relic`), and `problems` as they are.
- **HUD gauge** (find where the Spirit's energy shows: `client/src/hud/mechanics/` energy widget,
  `PlayerView.energyCount` / `energyMax`): the gauge beside the HP bar, filled to `energyCount` of
  `energyMax`, with the floor line from the class config (the same hook as the editor) drawn on it
  and each band mark drawn at its height. Spends never call out; only the relic's moments would
  (none yet). **The crackle around the character thins as the storm drains** is an FX nice-to-have:
  skip unless it is trivial (an alpha on the existing aura).
- The storm is **a shield**: hits drain it before HP. If the player HP bar can show an absorbed
  segment (the barrier or ward overlay), use that overlay for the storm instead of a new widget.
- Icons: pieces use `classPieceIconSource(id)`, trophies `trophyIconSource(id)`. Do not make art.

## SP6-ROUTE: the Spirit's guided tutorial and bot route

- **Tutorial** `shared/src/tutorial/scripts/spirit.ts` registered in
  `TUTORIAL_CLASS_BEATS['energy-root']`, on the seal route's structure (see `striker.ts`, `squire.ts`).
  Beats (bible §11.4): after the class pick, the plain rod, the Storm 4 gauge filling by itself, the
  floor at 30% and one Bolt band, gather ("it gathers to full, then breaks down to the floor"); the
  Plains teaches Chain Lightning around minute 6; one line as each zone teaches its piece
  (Thunderclap, Downpour, Eye of the Storm, Thunderbolt); the first boss is won with the base kit and
  gives Crosswind. Say plainly that hits drain the storm before HP. Keep lines under 170 characters.
- **Bot route** `bot/src/routes/spiritT1.ts` (`spirit-t1`), like `striker-t1`, with a `classConfig`
  step in `auto` mode (the §11.13 default); register it in `ROUTES` and `CONTROLLED_ROUTE_IDS`.

## SP7-CLEANUP: delete the Spirit's old frame, range and T3 content

The storm runtime is in. The old energy machinery is inert for a character with Thresholds
(`energyPrototype`'s per-hit gain returns early for them). Delete it.

- **Delete:** `server/src/systems/classes/archetypes/energy/frameLoop.ts` and `energy/t3/`
  (Overdrive, Binary Cycle, Critical Mass, Awakened Lightning, Singularity, Flash, Alternating
  Currents, Upkeep...), their buffs and `energy.*` passive keys and labels nothing else reads, the
  `UsesEnergy` fields only they used (`csReservoir`, `smChargePool`, `seInitialized`, `flash*`,
  `overdriveActive`, `upkeepTimerMs`, `binary*`, `criticalMass*`, `awakenedCharges`,
  `dischargeEnergy`) with their readouts in the views, `systems/energyUpkeep.ts` and the relic
  profile path (`resolveEnergyRelicProfile`, `resolveEnergyMaxBeforeRelic` and their callers), the
  empowered-multiplier registration for energy, status ids only they wrote, and the tests that pin them.
- **Also remove** the Thresholds early return in `energyPrototype.ts`'s hit listener once the old
  per-hit gain is gone, so the file is only what the storm needs (or delete the file if nothing
  remains and move `initEnergyArchetype`'s job into `energy/index.ts`).
- **Keep:** `energy/spirit.ts`, `energy/index.ts` (the module, `registerSpirit`, `updateSpirit`),
  `UsesEnergy.energy` / `energyMax`, and the views' `energyCount` / `energyMax`.
- **These must stay green:** `spiritStorm.test.ts`, `spiritKit.test.ts`, `thresholdsView.test.ts`,
  `statusRegistry.test.ts`, `classAffinity.test.ts`. If a test pins a deleted behaviour, delete it and
  say so in the report.
