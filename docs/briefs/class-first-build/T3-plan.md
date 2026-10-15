# Tier 3 (M3) plan: make every class playable through T3

Written 2026-10-15, after T2 (wave 1 runtimes, wave 2 UI/tutorial/routes) merged. Same shape as
`T2-plan.md` and `T2-wave2.md`; read both for the pattern and for what a good report looks like
(`reports/T2-*.md`, `reports/T2W2-*.md`).

## What T3 adds

- The **specializations** (bible §N.6): the second Passive Tree choice, built on the discipline.
- The **T3 lessons, trophy rank-ups and new trophies** (bible §N.16, the T3 table), including the
  two new biomes, **Tundra** and **Volcanic** (new lineages, new gear jobs), and the jobs that
  **move** when the Plains and Forest retire.
- The T3 gear effect keys (weapon / armor / charm per new biome and moved job).

The kits are data-complete through T4 already; the work is runtime, as in T2.

## Task 1: T3-<CLASS> (runtime, data, tests)

IDs: T3-STRIKER, T3-SQUIRE, T3-CONDUIT, T3-SLINGER, T3-SPIRIT, T3-APPRENTICE.

For every T3 item in §N.6, §N.8 and the T3 table of §N.16 (N = 12 Striker, 8 Squire, 7 Conduit,
10 Slinger, 11 Spirit, 9 Apprentice): check whether the runtime does it; implement what is
missing, following the same class's T1/T2 runtime. Wire the specialization's rule, each T3 lesson,
trophy ranks and the new Tundra/Volcanic trophies, and the gear jobs. **Fill the T3/T4 copies of
the gear jobs T2 left empty `{}`** (Conduit, Slinger rifles) so no item is dead. One wiring test
file `server/test/<class>T3*.test.ts`. Put a status table (`wired | missing | stand-in`) in the
report.

Allowed paths: as in `T2-plan.md` (your class's kit, gear file, your passives/labels block, your
class's runtime folder, new tests, the class's `*View.ts` data). A new moment or a core combat
hook: stop and put it in the report (the conductor owns `moments/` and the pipeline). Out of
scope: UI, art and icons, bot routes, balance numbers (copy the bible; placeholders marked), T4.

Worktree `../mmo-rw-t3-<class>` · branch `rw/t3-<class>`. Report `reports/T3-<CLASS>.md`.

## Task 2: T3-W2-<CLASS> (visible, teachable, testable), after Task 1 merges

As `T2-wave2.md`: the T3 state in the class's editor and HUD (every new status gets its client
entries with an existing icon id; never generate art), the tutorial's T3 stretch (appended after
the T2 stretch; existing step types only), and the `<class>-t3` bot route (the T2 route, then the
specialization unlock via `unlockSkill`, then the T3 zones to their caps and bosses; register it,
leave it out of `CONTROLLED_ROUTE_IDS` until it has run live). Worktree
`../mmo-rw-t3w2-<class>` · branch `rw/t3w2-<class>`. Report `reports/T3W2-<CLASS>.md`.

## Carry-overs the agents should handle

- `TutorialPanel` shows the farewell only when the script runs out; do not touch it (conductor).
- Network a HUD field the minimal way: add it to the existing slice, `mutateSlice`, one test.
- Keep edits to shared files (`passives.ts`, `mechanicLabels.ts`, tutorial index, routes index)
  to your own block; the conductor resolves merge conflicts keeping both sides.

## Wave 2 addenda (conductor, after Task 1 merged)

- The T3 moments now exist: `chill-threshold`, `fire-attack`, `drag-or-push` (`server/test/momentsT3.test.ts`).
  Squire (Anchor, Frostward, Backdraft), Apprentice (Melt, Ice Veil, Ashguard) and Spirit
  (Tailwind, Foehn) read local stand-ins today: **switch each to the real moment**
  (`momentActive` / `recordMoment` consumers) and delete the stand-in, keeping the tests green.
- The class context now carries `specializationId` (Colossus +1 Command, Two Souls two relic slots).
  The Conduit's Formation view and editor must show both.
- Status ids owed a client entry (tile / label / help / badge / icon lookup; run
  `pnpm test -- statusRegistry`): Slinger `slinger-burn`, `slinger-deathmark`, `slinger-entrenched`,
  `slinger-fan-the-hammer`; Squire `squire-frostward`, `squire-rampage`; Conduit `conduit-horn`,
  `conduit-burn-bright`, `conduit-spore`, `conduit-hibernate`, `conduit-hunt`; Striker: split
  Overheat out of `striker-focus` into its own id only if the audit allows; others: check the test.
- Visible state owed (from the T3 reports): Striker held slashes / Frenzy arming (server-only
  today: network them); the Squire's Resolve dial past budget (Deep Winter / Bastion); Spirit
  specialization rules in the Thresholds editor; Slinger specialization marks and the Rime ground
  (draw it); Apprentice specialization card.
- The specialization pick: players choose through the Passive Tree panel
  (`client/src/ui/SkillTreePanel.tsx`, `player:unlockSkill`). Check it lists the class's real
  specializations under the picked discipline and fix it if not (your class only).
