# Tier 2 (M2) plan: make every class playable through T2

Written 2026-10-15. Goal: a player of any of the six classes can go T1 → T2 on the class-first
framework, with every T2 lesson, discipline, trophy rank-up and gear job doing what the bible
says. No T1 polish and no playtest before all tiers exist (designer, 2026-10-15).

## What already exists

- The kits (`shared/src/classKits/<class>/kit.ts`) are **data-complete through T4**: lessons,
  trophies, disciplines, specializations and leaves.
- The T2 *moments* the classes react to (charging, burrowing, ranged attacker, frozen target,
  out of reach and back, ambush, ally threatened) are in (`1247353b`).
- The T2 monsters, zone modifiers, tiers and map stay as they are.

## What T2 still needs (per class, "T2-RT")

For every T2 item in the class's bible sections (§N.5 disciplines, §N.8 pieces, §N.16 T2
table): check whether the **runtime does it**. If the kit names it but nothing executes it,
implement it, following the pattern of the T1 runtime of the same class. Cover:

1. T2 lessons (techniques, pieces, clips, responses, sigil/payoff rules...).
2. The three disciplines: the mechanic each one adds and the rule it changes.
3. T2 trophy rank-ups and the new T2 trophies (Jungle, Desert).
4. T2 gear jobs (weapon / armor / charm effect keys): passives, labels, gear file entries.
5. A wiring smoke test per item group: attach, tick, assert observable state.

Out of scope for every T2-RT: client UI, art and icons (the designer owns art), bot routes,
balance numbers (copy the bible's; mark placeholders), T3/T4 content, deleting anything.

## Waves

| Wave | Who | What |
|---|---|---|
| 1 | six agents in parallel, one per class | T2-RT (below) |
| 1 | conductor | Conduit bandwidth diet and summon cap, merge, suite |
| 2 | agents | T2 UI/tutorial pieces and the six T2 bot routes (after Wave 1 merges) |
| 3 | the same for T3, then T4 | |

## Collision rules

All six touch `shared/src/passives.ts`, `mechanicLabels.ts` and the kit files. Each agent
adds only its own class's keys, in a block named for the class, and never reformats shared
files. The conductor resolves merge conflicts by keeping both sides.

## The six tasks

| ID | Class | Bible sections | Worktree · branch |
|---|---|---|---|
| T2-STRIKER | Striker | §12.5, §12.8, §12.16 (T2) | `../mmo-rw-t2-striker` · `rw/t2-striker` |
| T2-SQUIRE | Squire | §8.5, §8.8, §8.16 (T2) | `../mmo-rw-t2-squire` · `rw/t2-squire` |
| T2-CONDUIT | Conduit | §7.5, §7.8, §7.16 (T2) | `../mmo-rw-t2-conduit` · `rw/t2-conduit` |
| T2-SLINGER | Slinger | §10.5, §10.8, §10.16 (T2) | `../mmo-rw-t2-slinger` · `rw/t2-slinger` |
| T2-SPIRIT | Spirit | §11.5, §11.8, §11.16 (T2) | `../mmo-rw-t2-spirit` · `rw/t2-spirit` |
| T2-APPRENTICE | Apprentice | §9.5, §9.8, §9.16 (T2) | `../mmo-rw-t2-apprentice` · `rw/t2-apprentice` |

## Shared brief (each task)

**Allowed paths:** `shared/src/classKits/<class>/**`, `shared/src/data/classGear/<class>.ts`,
your class's block in `shared/src/passives.ts` and `mechanicLabels.ts`, the class's runtime
under `server/src/systems/classes/archetypes/**` (only your class's folder), new files under
`server/src/systems/classes/<class>/`, new tests `server/test/<class>T2*.test.ts`,
`shared/src/classKits/*View.ts` only to add the T2 data a view already composes.
For a mechanic that truly needs a new moment or a core combat hook, **stop and put it in the
report** (the conductor owns `moments/` and the combat pipeline).

**Steps:**
1. Read the bible's sections above and the class's T1 runtime and tests.
2. Write a table in your report: every T2 item, status `wired | missing | stand-in`.
3. Implement the missing ones, smallest change first, T1 pattern of the same class.
4. One wiring test file per class. `pnpm typecheck` clean; `pnpm test -- <class>` green.
5. Anything the bible leaves open: pick the simplest reading, mark it PLACEHOLDER, list it.

**Report:** `docs/briefs/class-first-build/reports/T2-<CLASS>.md` (shape in AGENT-RULES.md),
including the status table and every stand-in.
