# Tier 2 wave 2: make T2 visible, teachable and testable

Written 2026-10-15, after wave 1 (the T2 runtimes) merged. One task per class, **T2-W2-<CLASS>**,
branch `rw/t2w2-<class>`, worktree `../mmo-rw-t2w2-<class>`. Read `AGENT-RULES.md`, `T2-plan.md`,
your class's wave-1 report (`reports/T2-<CLASS>.md`), and the T1 briefs for the same three jobs
(`CS5-striker-ui.md`, `CS6-striker-route.md` are the pattern; `CS5` = UI, `CS6` = tutorial + route).

## The three jobs

1. **Make the T2 state visible (client).** The wave-1 report lists the T2 state the HUD and
   class screen cannot show yet. Add it where the T1 version of the same thing already lives
   (the class editor in `client/src/ui/class/`, the class HUD strip in `client/src/hud/`).
   Also give every status your class's wave 1 added its client entry (tile, label, help, badge,
   icon lookup: see `server/test/statusRegistry.test.ts` for what is checked). **Never generate
   or edit art.** Use an existing icon id that fits; the designer swaps icons later.
   Statuses owed: Striker `ability-sidestep` (Close In stand-in); Conduit `conduit-bark`,
   `conduit-mark`; Squire `squire-parry`. Others: none known.
2. **The T2 guided steps (tutorial).** After the T1 seals, the tutorial's T2 stretch: one short
   plain line per new lesson / discipline pick / trophy rank-up at the moment the player gets
   it (bible §N.16 T2 table, §N.5 for the discipline choice). Existing step and condition types
   only; if you need a new one, stop and say so.
3. **The T2 bot route** (`bot/src/routes/<class>T2.ts`, registered in `routes/index.ts`):
   continue the T1 route through promotion to T2, pick a discipline (via `classConfig` /
   the discipline step the runner already has; if there is none, say so), farm the T2 biomes to
   the tutorial levels, and attempt the T2 bosses. Modelled on the class's `<class>T1.ts`.
   Add a route test modelled on its T1 test. No server or bot run needed.

## Allowed paths

Your class's client files (`client/src/ui/class/*`, `client/src/hud/**` for your class's strip,
the status registry files the audit test reads), `shared/src/tutorial/scripts/<class>.ts` (+ the
one registration line in `scripts/index.ts`), `bot/src/routes/<class>T2.ts` (+ `routes/index.ts`
registration), and **the minimal networking** a HUD field needs: add the field to the existing
networked slice (shared component type + `NETWORKED_*` allowlist if needed), write it with
`mutateSlice` / `markSliceDirty`, and add a one-line test. Nothing else under `server/`.

## Checks

`pnpm typecheck` clean; `pnpm test -- <class> tutorial statusRegistry classKits` pass
(`statusRegistry` must be green for your class's ids). Report: `reports/T2W2-<CLASS>.md`
(AGENT-RULES shape).

## Per class

| Class | Visible T2 state to show (from the wave-1 report) |
|---|---|
| Striker | shine (lit beats), edge step, Momentum on the beat strip; the six T2 techniques and discipline pick in the Order editor |
| Squire | the T2 responses in the Responses editor, discipline pick, Last Breath bar use |
| Conduit | the seven T2 pieces and the discipline's price in the Formation editor (piece cards show the discipline cost, not base), Soul rank on the relic, the Command pips |
| Slinger | the T2 clips in the Loadout editor, twin guns / shell bank / called shot on the clip strip |
| Spirit | overflow above the bottle's max (the storm bar must allow > 100%), Tide's ebb/surge phase, Reservoir depth |
| Apprentice | the T2 payoff pieces and the discipline's rules in the Payoffs editor, Fire/Frost/Poison sigil colours |
