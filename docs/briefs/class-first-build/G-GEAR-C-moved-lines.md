# G-GEAR-C: every class's moved lines, on second bases

**Size:** S (data entry, 12 entries per class). **Agent:** Grok (one agent for all six classes is
fine; or split Striker/Squire/Apprentice and Slinger/Spirit/Conduit). **Worktree · branch:**
`../mmo-rw-gear-c` · `rw/gear-c`.

**Edit only** `shared/src/data/classGear/{striker,squire,apprentice,slinger,spirit,conduit}.ts`
plus your report (`reports/G-GEAR-C.md`). Never edit `recipes/*`, `classGear/index.ts`, `types.ts`
or the test. Read `AGENT-RULES.md` first.

## Why

When a biome retires, its jobs move up (bible §4, §X.16). G-GEAR-A/B entered the moved
**weapons** but skipped the moved **armor and charm lines**, because a shared base carries one
line per class and the receiving biome keeps its own. The designer decided (2026-10-15):
**the receiving biome gets a second armor and a second charm base carrying the moved lines,
for every class.** The plumbing is done (`ClassGearDef.movedLines`; `recipes/index.ts` builds
`<base>-b`, a copy of the receiving base named "<name> II", and puts each class's moved line
on it). Your job is the data.

## What to enter

Add a `movedLines` object to each class file (the Striker's file has one example entry:
`'jungle-vest-t3'`; replace it with the full set). Twelve keys per class, one line each:

| Retired biome → receiving | Tiers | Keys (armor `-vest-`, charm `-charm-`) |
|---|---|---|
| Forest → Jungle | T3, T4 | `jungle-vest-t3`, `jungle-vest-t4`, `jungle-charm-t3`, `jungle-charm-t4` |
| Plains → Volcanic | T3, T4 | `volcanic-vest-t3`, `volcanic-vest-t4`, `volcanic-charm-t3`, `volcanic-charm-t4` |
| Swamp → Graveyard | T4 | `graveyard-vest-t4`, `graveyard-charm-t4` |
| Cave → Trench | T4 | `trench-vest-t4`, `trench-charm-t4` |

Which line goes on which key is the "Moved lines skipped" table in `reports/G-GEAR-A.md`
(Striker, Squire, Apprentice) and `reports/G-GEAR-B.md` (Slinger, Spirit, Conduit): the
"Armor" line goes on the `-vest-` keys, the "Charm" line on the `-charm-` keys.

Each entry is the **origin line, copied exactly**: same `name`, same `text`, same `effects` as
the class's line on the origin biome's **last** tier (Forest and Plains: tier 2; Swamp and Cave:
tier 3). Copy from the class's own file (`'forest-vest-t2'`, `'plains-charm-t2'`,
`'swamp-vest-t3'`, `'cave-charm-t3'`, ...). Invent no numbers and no text.

The same line repeats on both tiers of a receiving biome (T3 and T4 get identical entries); the
base's own stats carry the tier.

## Checks

- `pnpm typecheck`
- `pnpm test -- classGear recipeCurve weaponCurve` (the class-gear test now checks every moved
  line: the second base exists, copies its base, and carries the line; and that it differs from
  the line the receiving base already carries).
- If an economy, slot or recipe-gate test fails because the second bases now exist
  (`<base>-b` recipes: 36 new shared recipes), do not edit it: list the test and its message in
  the report.

## Report

`docs/briefs/class-first-build/reports/G-GEAR-C.md`: what you entered (counts per class), the
checks, anything you were unsure of.
