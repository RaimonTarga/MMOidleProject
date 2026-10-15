# CS5-UI: the Striker's Order editor and beat strip (client)

**Agent:** Grok · **Worktree:** `../mmo-rw-cs5-ui` · **Branch:** `rw/cs5-ui` · **Size:** M ·
**Needs:** F7-PANEL merged (the class screen shell this editor sits in). The conductor creates
the worktree once it is.

**Read first:** `AGENT-RULES.md`; `C-striker.md` (this folder: the Striker track); the bible
§12.2–§12.4 (`design_docs/class-first-bible.md`); the view model
`shared/src/classKits/orderView.ts` and its test; the shell's `client/src/ui/class/` (F7-PANEL)
and its report `reports/F7-PANEL.md`; `CLAUDE.md` ("Client Rules").

## Why

The Striker's class system is the Order: what each beat of the combo does, and the finisher.
The server runs it (`server/src/systems/classes/archetypes/cadence/order.ts`). The player needs
to see it and set it: an editor on the class screen, and the strip on the HUD that shows the
combo playing out. The bible: "the strip of beats (landed, next, to come) with each beat's
technique ... The strip reads grey → coloured → gold: plain punches, special moves, signature
moves." Callouts only for the announced moves: a cast (it already gets a cast bar and its name)
and the trophy finisher, by name.

## Build

1. **The Order editor** (`client/src/ui/class/OrderEditor.tsx`), rendered by the shell's
   `ClassSystemEditor` for a Striker (`view.systemKind === 'order'`):
   - A row of beat slots from `composeOrderView(input).beats`: the opener, the middle beats,
     the wind-up, then the finisher slot. Each shows the technique's icon and name, or "Plain
     swing"; the opener and wind-up are marked as cast positions; a mastered beat is gold.
   - Clicking a beat opens a picker: "Plain swing" plus every owned technique whose
     `allowedBeats` includes that beat (icon, name, family, its lines). Picking sends
     `setClassConfig(withBeat(config, index, pieceId))`.
   - The slot counter: "Techniques: {used} of {open} beats" (and "{mastered} mastered" once
     non-zero). When every open beat is used, picking a technique for a plain beat says so
     instead of sending.
   - The finisher slot shows `view.finisher` (trophy icon and name, or "Finisher"); clicking it
     scrolls to or opens the shell's relic section (one place equips trophies).
   - The hold rule, read-only for now: `view.holdFinisher` lines, or "No hold rule".
   - `view.problems`, if any, in the panel's error style.
2. **The beat strip** on the HUD (`client/src/hud/OrderStrip.tsx`), for a Striker only, where
   the cadence readout's hit pips are today (find the component that renders
   `cadenceCount` / `cadenceThreshold`; the strip replaces it for a player with an Order).
   One cell per beat plus the finisher: landed beats dim, the next beat highlighted, beats to
   come normal; each cell the technique's icon (`classPieceIconSource`) or a plain mark;
   colours grey (plain), class colour (technique), gold (mastered); the finisher cell the
   trophy icon. Data: `classConfig` and `cadenceCount` / `cadenceThreshold` from the player view
   (beat `cadenceCount` is next; `cadenceEmpoweredArmed` means the finisher is next).
3. **The trophy finisher callout.** When a Striker's finisher lands with a trophy equipped, show
   the trophy's name as a callout over the player, the way a cast shows its name (find how
   `mechanic-fired` or the finisher hit is rendered for cadence today, and the callout helper
   `abilityCallout` in `client/src/fx/abilityRank.ts`). Plain finishers and ordinary beats never
   call out.

Follow the shell's and HUD's existing style, depth bands and mobile layout.

## Edit only

New files under `client/src/ui/class/` and `client/src/hud/` for the editor and strip; the
shell's `ClassSystemEditor`; the HUD component that renders the cadence pips (to swap in the
strip for a Striker); the cadence finisher FX/callout site in `client/src/` you identify; and
your report. Nothing in `shared/` or `server/`: if you need data the view model lacks, stop and
say what.

## Checks

- `pnpm typecheck` clean; `pnpm --filter @mmo-idle/client build` succeeds.
- `pnpm test -- orderView classScreenView`.
- Describe what you verified by eye, or say it is unverified in a browser.

## Report

`docs/briefs/class-first-build/reports/CS5-UI.md` (AGENT-RULES shape): where the editor, strip
and callout live, what each renders, and anything left.
