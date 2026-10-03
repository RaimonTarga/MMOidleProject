# Boss reach run — brief (2026-10-03, overnight)

Implements design §25: a reach channel for the Crag Behemoth (Rockfall) and the Obsidian
Broodmother (Tremor). **Opus**, single session, in `../mmo-lineages`: `pwd` and `git status`
first (clean, on feat/lineage-data-model), then `git checkout -b feat/boss-reach develop`.
Never `pnpm install`, never push, strip CR only on files you touch, never kill processes by
image name. This run touches ONLY: `shared/src/data/monsters/bossesT1.ts`, the monster
types/runtime needed for the channel, boss FX, the boss lab plan, tests and the report. The
verbs-that-fire run is live in other worktrees on lineage/combat/client/tutorial files —
stay out of them; if the channel needs a combat-engine seam, add a new file.

Read first: design §25, §24.1 (perceptibility), the boss pass report §3, §6, §8 and §12
(docs/briefs/t1-boss-pass-report-2026-10-02.md), `design_docs/boss-design.md` (anti-kite
rule, stat anchors), the Behemoth and Broodmother blocks in bossesT1.ts with their comments,
and `server/scripts/_t1BossLab.ts` / `_t1BossMatrix.ts` / `_t1BossPlan.ts` (the `bp`
override path, `fromBoss` per class, seeded approach).

## The channel

Pick the engine seam by reading what exists before adding anything: the boss pattern
`impact` step with a target anchor, a `MonsterAbility` with `castWhileOutOfRange`, the T3
range-flip phase override, or a new small `reach` field on the boss definition. Prefer the
smallest addition that gives BOTH bosses their channel from one piece of code; document the
choice. Rules: lightly telegraphed (≤ 600 ms tell, its own fx, never a tint), respects the
monster-hit pipeline (plating, DR, evade, `evadeBlocksDebuffs`), pushes events through
`world.pushEvent`, and never fires while the boss is in its pattern (cast, charge, conceal,
recovery) — the pattern is the exam, the channel is the budget.

- **Behemoth — Rockfall:** fires only while the current target is beyond melee reach;
  cadence = basic attackCooldown (3500 ms); lands at the target's position with radius ~70
  and a ≤ 600 ms tell; damage share of `attack` provisional **0.65**.
- **Broodmother — Tremor:** periodic pulse centred on the boss, radius provisional **320**
  (orbit sits ~250–400 from the target: measure the lab's orbit distance first and set the
  radius to cover it), cadence provisional **5000 ms**, damage share **0.4**, no tell beyond
  the shake fx itself (ambient).

All four numbers are the designer's; implement as data on the definition, flag them.

## Measure

1. Baseline: the boss pass plan (`reports/t1-boss-pass/plan-base.json`, six classes × five
   bosses, tutorial kit, 30 seeds) → incoming HP/s per class per boss (`fromBoss`/duration)
   and win rates. Confirm the §25 table reproduces.
2. Candidates: Behemoth share 0.5 / 0.65 / 0.8 and Broodmother share 0.3 / 0.4 / 0.5 ×
   radius 280 / 320 / 380, same seeds through `bp`.
3. Criterion (§25): spread ≤ 2.5× on each boss; melee incoming within ±5% of baseline;
   every class ≥ 70% win on the tutorial kit; the other three bosses untouched and
   byte-identical in the lab.
4. Adopt the smallest candidate meeting the criterion; one commit per boss; comments in the
   data file state the numbers, the alternatives measured and the revert.
5. Canonical 1x tutorial sweep is NOT needed (the tutorial never fights the Broodmother and
   fights the Behemoth as the Mountain seal): run the Striker, Squire and Slinger tutorial
   routes at 1x, one server + DB each, and report the Mountain seal attempt counts against
   the boss pass sweep (1/1 for all six).

## Report

`docs/briefs/boss-reach-report-2026-10-03.md`: the seam chosen and why; before/after
incoming HP/s and win-rate matrices; the candidate grid; the three-route sweep rows; FX
screenshots via the client repro harness (one per channel); what could not be verified;
every number picked. Merge `feat/boss-reach` → develop (no push) only if the criterion is
met for both bosses; otherwise leave the branch unmerged and say so in the report.
