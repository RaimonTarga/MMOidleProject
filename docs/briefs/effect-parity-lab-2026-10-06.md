# Effect parity lab — brief (2026-10-06, one short Opus session)

**The question:** on the three weapons whose Effect lean scales a per-firing payload (the
Rapier's Flurry echo, the Axe's Chopping Rhythm echo, the Broadsword's Set Piece refund),
what payload scale makes **rank I Effect worth rank I Attack** on the boss lab? Design
§26.5 (2026-10-06): the rule stands, the number is wrong. The legibility report's matrix
(docs/briefs/legibility-report-2026-10-05.md, "The composition matrix") measured Effect at
roughly a third of Attack on those weapons: Broadsword +5.8% vs +11.8%, Rapier +14.4% vs
+19.4% (the verb alone is +13.0%), Axe +12.8% vs +19.1% (verb alone +11.4%).

**Where:** `../mmo-lin-w1a` (clean, on `audit/status-registry`, merged): `pwd`, `git
status`, then `git checkout -b lab/effect-parity develop`. Never `pnpm install`, never
push, never merge; strip CR on touched files only. Leave the branch for the designer.

**The seam:** `STAT_UNIT.payloadScale` in `shared/src/data/lineages/magnitudes.ts` is one
number (0.10) for every weapon. Add a per-lineage override table
`EFFECT_PAYLOAD_UNIT_BY_LINEAGE: Partial<Record<string, number>>` read by
`leanRankValue` for `payloadScale` cards (fallback to `STAT_UNIT.payloadScale`), with a
test in `composition.test.ts` that rank I/II/III still follow `LEAN_RANK_VALUE_SCALE`
and that the Dagger and Hammer (not `payloadScale`) are untouched. No other code change.

**Measure** (`server/scripts/_t1BossPlan.ts --matrix=composition`, 10 seeds, the
tutorial kit, six classes, five T1 bosses — the legibility run's own instrument;
`reports/legibility/after-composition.jsonl` is the baseline):

1. Rank I Attack and rank I Effect per weapon, per class, DPS uplift over no cards. The
   Dagger and Hammer rows must reproduce the baseline byte for byte (the override does not
   touch them).
2. Candidates for the three weapons: payload unit 0.15 / 0.20 / 0.25 / 0.30. For each,
   rank I Effect's median uplift over classes against rank I Attack's.
3. **Criterion:** the smallest unit at which rank I Effect is within ±2 pp of rank I
   Attack (median over classes), per weapon; report rank III too (it follows by the scale
   table) and check it does not exceed rank III Attack by more than 3 pp.
4. One sanity row: the tutorial-pair plan (`--matrix=tutorial-pair`, 30 seeds) at the
   chosen units, the four Axe classes' kit uplift and Mountain seal win rate against the
   legibility report's table (Striker +14.7% / 99.3%).

**Report** `docs/briefs/effect-parity-lab-report-2026-10-06.md`: the grid, the three
proposed units with the rows that justify them, the sanity row, and anything that did not
reproduce. Put the proposed units in the data file as PROVISIONAL with the measured
alternatives in the comment, the way the boss pass did. The designer applies or reverts
per row and merges.

**Prompt** (open the session in `../mmo-lin-w1a`):
```
pwd, git status, git branch --show-current: you must be in ../mmo-lin-w1a, clean, on
audit/status-registry. Then git checkout -b lab/effect-parity develop. Read
docs/briefs/effect-parity-lab-2026-10-06.md and do exactly that: one override table, one
test, the grid, the report. No other code. Do not merge or push.
```
