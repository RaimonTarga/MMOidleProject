# Progression Rework — Status Index

> Class-first rework (2026-10-15): lineage trees, shards, capstones, ability node rows, and evolve/reconstruct removed; see the bible.

**Status:** the lineage trees this index used to call shipped are gone. This page
points at what remains and at the archive. The phase-by-phase build log is
[`archive/progression-rework-plan.md`](archive/progression-rework-plan.md). The
removed trees are [`archive/lineages-current-state.md`](archive/lineages-current-state.md).

## Where the truth lives now

| Area | Current-state page |
| --- | --- |
| Families and blends (no shard payment) | [variants-current-state.md](variants-current-state.md) |
| Frame loops and range mechanics | [frames-current-state.md](frames-current-state.md) |
| Recovery: the flat model and the pool raise | [recovery-current-state.md](recovery-current-state.md) |
| Lineage trees, shards, ability node rows | [archive/lineages-current-state.md](archive/lineages-current-state.md) — removed |

## Phase scoreboard

| Phase | What it covers | Status |
| --- | --- | --- |
| 0 | Coarse HP/recovery pass; flat recovery; player pool raise | The flat recovery and the pool raise remain — see `recovery-current-state.md` |
| 1 | Weapon lineage tree, T1, five lineages; card runtime; bot profiles/lane bench | Removed (class-first rework) |
| 2 | Variants, shards, removal of the old economy (catalysts, node modifiers, weapon `+N`) | Families and blends remain. Shards were removed. Catalysts, node-modifier math, and the weapon `+N` ladder were already gone |
| 3 | Frame loops and range-node mechanics | Frame loops remain — see `frames-current-state.md` |
| 4 | Armor, charm, boots trees at T1 (fifteen defensive lineages); T1 third mobs | The defensive trees were removed. T1 third mobs and the family review remain with the blends |
| 5 | T2 band, keystones, ability nodes, T2–T4 families and blends | The bands, keystones, and ability nodes were removed. T2–T4 families and blends remain |

## Still open (designer-owned, not implementation gaps)

- The Mountain/Cave/Swamp T1 family review and a second T1 source for Engagement-type
  gaps on other packets (design bible open decisions 2–3).
- Every T3/T4 family assignment is still marked provisional in
  `variants-current-state.md`. The `drops` field those assignments used to set is gone.
- The Consort (balanced Conduit) frame loop — ships with its stat skew only.
- The player pool raise's factors (1.25/1.30/1.35/1.40) are PROVISIONAL: only the boss
  half of their acceptance criterion discriminates, and the normal-node half was already
  breached before the raise — see `reports/progression-phase0/pool-raise-run3.md`.
## Cross-cutting rules (still binding)

- **Server authority.** The client sends intents and renders slice deltas.
- **Component presence.** Windows and charge are attached/detached components or
  `TracksCombat` timed flags, never booleans on networked slices.
- **No per-tick animation flags.** All signatures go through `pushEvent`.
- **Docs.** When a phase ships, fold it into the current-state pages named above; update
  `docs/README.md` in the same commit.

The card, form, shard, and `coverage.test` rules were removed with the lineage trees.
