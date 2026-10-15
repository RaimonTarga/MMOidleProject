# F7-PANEL: the class screen's shell (client)

**Agent:** Grok · **Worktree:** `../mmo-rw-f7-panel` · **Branch:** `rw/f7-panel` · **Size:** M ·
**Phase 0, last task** (the conductor's half, the view model, is merged: `e97f7bde`)

**Read first:** `AGENT-RULES.md` (this folder); `CLAUDE.md` ("Client Rules"); the view model
`shared/src/classKits/view.ts` and its test `shared/src/classKits/classScreenView.test.ts`;
the build plan §3.3 and §3.4 (`docs/briefs/class-first-build-plan-2026-10-14.md`); the bible §2
and §3 (`design_docs/class-first-bible.md`). For the look, an existing panel such as
`client/src/ui/SkillTreePanel.tsx` or `client/src/ui/BuildPanel.tsx` and the primitives in
`client/src/hud/primitives`.

## Why

Every class gets one screen for its class system (the Striker's Order, the Squire's Response
rules, ...). The six editors come with the class tracks. This task builds the **shell they all
sit in**: what every class shows the same way. The server and the view model already exist:
the player view carries `classConfig`, `combatArchetype`, `biomeLevel`, `bossesCleared`,
`disciplineId` and `playerTier`; `composeClassScreenView(input, seen)` turns them into
everything below; `classUnlockNotices(before, after)` turns two snapshots into toasts; the
server takes one intent, `class:setConfig`, and answers `class:configResult`
(`shared/src/protocol/socketEvents.ts`).

## Build

1. **State.** A `classConfigAtom` in `client/src/hud/atoms.ts`, fed from the player view like
   `disciplineIdAtom` (set, reset). Everything else the screen needs already has an atom
   (`bossesClearedAtom`, `biomeLevelAtom`, `disciplineIdAtom`, the archetype and tier ones).
2. **Intent.** `setClassConfig: ClassConfig` in `client/src/intents.ts`, emitted as
   `class:setConfig` in `client/src/net/intents.ts`; a `hudBus` helper like the craft one. Handle
   `class:configResult` in `client/src/net/socket.ts` (on and off): when `ok` is false, show
   its `reasons` the way `RecipeToastLayer` shows a loadout or combat error.
3. **The panel** (`client/src/ui/class/ClassPanel.tsx` + `classPanel.css`), a primary overlay
   `'class'` (`client/src/input/overlayStack.ts`), opened from a rail button in
   `MenuButtons.tsx` labelled with the class's system name ("Order", "Response rules"...), and
   from the mobile destinations in `MobileHUD.tsx`. Shown only once a class is picked.
   Sections, top to bottom:
   - **Header:** class name, the discipline (name and its one-line fantasy) once picked, and the
     mode: "Auto" (the class sets itself up) or "Custom". A "Back to auto" button sends the
     current config with `mode: 'auto'` (the server rebuilds the default).
   - **Budget:** `view.budget.text` ("Techniques 2, next at Mastery 30"). Never show Global
     Mastery itself.
   - **Relic slot:** the equipped trophy as a card (icon, name, kind, rank "II", its lines), or
     an empty slot reading "Beat a boss to earn a trophy". Below it, every owned trophy; clicking
     one equips it: send the config with `relic: [id]` and `mode: 'custom'`. Two slots when
     `view.relic.slots` is 2.
   - **The class editor:** a `ClassSystemEditor` component that, for now, shows one line: "The
     {systemName} editor arrives with this class's track." Each class track replaces it.
   - **Pieces:** a card per owned piece: icon, name, family, rank, every line in `lines`, a
     small "in use" mark when `placed`, a "NEW" badge when `isNew`.
   - **Coming this tier:** `view.upcoming`: piece name, "Plains level 8", its text, greyed.
4. **"New" badges.** Keep the ids this character has seen in `localStorage` under
   `class-screen-seen:<playerId>` (wrap every read and write in try/catch; with no storage,
   nothing is new). Pass that set to `composeClassScreenView`; when the panel closes, add every
   shown piece and trophy id to it. Badge the rail button while anything is new.
5. **Toasts.** A `ClassUnlockToasts` layer mounted next to `RecipeToastLayer`: keep the last
   `ClassStateInput` (archetype, biome levels, boss clears, discipline) in a ref; when it changes,
   toast every `classUnlockNotices(previous, current)` entry: "Learned: Sweep", "Sweep rank II",
   "Trophy: Wide Arc", "Wide Arc rank II", with its `text` underneath. No toasts on the first
   snapshot or after a character switch.
6. **Icons.** In `client/src/ui/conceptIcons.ts`: `classPieceIconSource(id)`
   (`concept-icons/class-pieces/<id>.png`), `trophyIconSource(id)` (`concept-icons/trophies/<id>.png`),
   `disciplineIconSource(id)` (`concept-icons/disciplines/<id>.png`), each with a cache-busting
   revision like the others. Some icons don't exist yet (T2+ art is being drawn; Conduit pieces
   have none): `GameIcon`'s own fallback covers a missing file; check it renders cleanly.

Follow the existing panels' style, tokens, depth bands and accessibility (focus, Escape closes).
Client never decides gameplay: the panel only renders the view model and sends the intent.

## Edit only

`client/src/hud/atoms.ts`, `client/src/intents.ts`, `client/src/net/intents.ts`,
`client/src/net/socket.ts`, `client/src/hudBus.ts`, `client/src/input/overlayStack.ts`,
`client/src/hud/MenuButtons.tsx`, `client/src/hud/MobileHUD.tsx`, `client/src/hud/RecipeToastLayer.tsx`
(or wherever toast layers mount), `client/src/ui/conceptIcons.ts`, new files under
`client/src/ui/class/`, and your report. If you need anything else (shared, server, protocol),
stop and say so.

## Checks

- `pnpm typecheck` clean.
- `pnpm --filter @mmo-idle/client build` succeeds.
- `pnpm test -- classScreenView classKits` passes (they cover the view model you render).
- If you can run the client (`pnpm dev:server` on your own port is not needed for this; skip if
  not), describe what you checked. Otherwise say it is unverified in a browser.

## Report

`docs/briefs/class-first-build/reports/F7-PANEL.md` in the AGENT-RULES shape: what each section
renders, where the rail button and mobile entry are, how "new" is tracked, and anything you left.
