# Tier 4 (M4) plan: make every class playable through T4

Written 2026-10-15, after T3 (runtimes and wave 2) merged. Same shape as `T3-plan.md`; read it,
`T2-plan.md` and `T2-wave2.md` for the pattern, and `reports/T3-*.md`, `reports/T3W2-*.md` for what
a good report looks like.

## What T4 adds

- The **leaves** (bible §N.7): the T4 Passive Tree picks on the specialization.
- The **T4 lessons, trophy rank-ups and new trophies** (bible §N.16, the T4 table), including the
  two new biomes, **Wasteland** and **Trench** (new lineages, new gear jobs; the Swamp's and Cave's
  jobs move there), and the last rank of the old lineages.
- The T4-only gear effect keys that T3 left `{}` (for the Striker: Reaper's Scythe, Exploit,
  Deathward, Requiem, Clear Mind, Brine Mend; the other classes have their equivalents), plus any
  T4 "stronger step" a job needs.

The kits are data-complete through T4 already; the work is runtime, as in T2 and T3.

## Task 1: T4-<CLASS> (runtime, data, tests)

IDs: T4-STRIKER, T4-SQUIRE, T4-CONDUIT, T4-SLINGER, T4-SPIRIT, T4-APPRENTICE.

For every T4 item in §N.7, §N.8 and the T4 table of §N.16 (N = 12 Striker, 8 Squire, 7 Conduit,
10 Slinger, 11 Spirit, 9 Apprentice): check whether the runtime does it; implement what is missing,
following the same class's T1-T3 runtime. Wire each leaf's rule, each T4 lesson, the trophy ranks
and the new Wasteland and Trench trophies, and the T4 gear jobs. Also finish what your T3 report
left as `missing` (not the `stand-in`s: those are design calls). One wiring test file
`server/test/<class>T4*.test.ts`. Put a status table (`wired | missing | stand-in`) in the report.

Allowed paths: as in `T2-plan.md` (your class's kit, gear file, your passives/labels block, your
class's runtime folder, new tests, the class's `*View.ts` data). A new moment or a core combat hook:
stop and put it in the report (the conductor owns `moments/` and the pipeline). Out of scope: UI,
art and icons, bot routes, balance numbers (copy the bible; placeholders marked).

Worktree `../mmo-rw-t4-<class>` · branch `rw/t4-<class>`. Report `reports/T4-<CLASS>.md`.

## Task 2: T4-W2-<CLASS> (visible, teachable, testable), after Task 1 merges

As `T3-plan.md` Task 2: the T4 state in the class's editor and HUD (every new status gets its client
entries with an existing icon id; never generate art), the tutorial's T4 stretch (appended after the
T3 stretch; existing step types only), and the `<class>-t4` bot route (the T3 route, then the leaf
unlock via `unlockSkill`, then the T4 zones to their caps and bosses; register it, leave it out of
`CONTROLLED_ROUTE_IDS` until it has run live). Worktree `../mmo-rw-t4w2-<class>` · branch
`rw/t4w2-<class>`. Report `reports/T4W2-<CLASS>.md`.

## Carry-overs the agents should handle

- `TutorialPanel` shows the farewell only when the script runs out; do not touch it (conductor).
- Network a HUD field the minimal way: add it to the existing slice, `mutateSlice`, one test.
- Keep edits to shared files (`passives.ts`, `mechanicLabels.ts`, tutorial index, routes index, the
  `specializationIdAtom` family in `client/src/hud/atoms.ts`) to your own block; the conductor
  resolves merge conflicts keeping both sides.
- The leaf pick goes through the Passive Tree panel (`player:unlockSkill`); check it lists your
  class's real leaves under the picked specialization, and fix it for your class only if not.

## Wave 2 addenda (conductor, after Task 1 merged)

- Status ids owed a client entry (run `pnpm test -- statusRegistry`; ids on summons need an
  `ACCEPTED_GAPS` line in `server/scripts/statusAudit.ts` like `conduit-bark`): Conduit
  `conduit-ice-shell`, `conduit-withdraw`, `conduit-last-stand`, `conduit-fall-back`, `conduit-seal`;
  Slinger `debuff-immune` (Pressure Suit). Others: whatever the test lists for your class.
- Conductor owns these (do not touch): the `risen` moment, `knockback.ts` hooks (Immovable, Anchor,
  Steady Nerve), Numb II, the Apprentice's default Payoff placements, `TutorialPanel`.
- After your Task 2 the whole game T1 to T4 should be walkable by your class's `<class>-t4` route
  (statically; no live run is needed from you).
