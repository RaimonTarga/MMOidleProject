# Progression Rework — Status Index

**Status:** SHIPPED (first slice of every phase). This page is now a short index, not the
implementation record — the full phase-by-phase build log, with every task's divergences
from the original sketch, is archived at
[`archive/progression-rework-plan.md`](archive/progression-rework-plan.md). Read that
only for history or rationale; the pages below are the living truth.
**Design authority:** [`design_docs/progression-rework-design.md`](../design_docs/progression-rework-design.md).

## Where the truth lives now

| Area | Current-state page |
| --- | --- |
| Lineages: bands/rows, keystones, cross-lane, re-homed forms, ability nodes | [lineages-current-state.md](lineages-current-state.md) |
| Variants: families, blends, shards, capstones, the drops rule | [variants-current-state.md](variants-current-state.md) |
| Frame loops and range mechanics | [frames-current-state.md](frames-current-state.md) |
| Recovery: the flat model and the pool-raise pointer | [recovery-current-state.md](recovery-current-state.md) |

## Phase scoreboard

| Phase | What it covers | Status |
| --- | --- | --- |
| 0 | Coarse HP/recovery pass; flat recovery; player pool raise | Shipped (0a/0b); the per-tier pool raise is a concurrent run-3 task (`feat/pool-raise`) and is PROVISIONAL once it lands — see `recovery-current-state.md` |
| 1 | Weapon lineage tree, T1, five lineages; card runtime; bot profiles/lane bench | Shipped |
| 2 | Variants, shards, removal of the old economy (catalysts, node modifiers, weapon `+N`) | Shipped |
| 3 | Frame loops and range-node mechanics | Shipped (Consort's loop is the one open piece — see `frames-current-state.md`) |
| 4 | Armor, charm, boots trees at T1 (fifteen defensive lineages); T1 third mobs | Shipped (authoring half); the Mountain/Cave/Swamp family *review* (design bible open decision 2) is still open |
| 5 | T2 band (amplifier row), band collapse/stat absorption, form re-homing, T3 keystone / T4 cross rows, ability nodes, T2–T4 families and blends | Shipped |

## Still open (designer-owned, not implementation gaps)

- The Mountain/Cave/Swamp T1 family review and a second T1 source for Engagement-type
  gaps on other packets (design bible open decisions 2–3).
- Every T3/T4 family assignment, every provisional magnitude, and every `drops` value a
  concurrent bench pass may remap — see `variants-current-state.md` §6 and
  `reports/progression-phase1/lane-matrix-run3.md`.
- The Consort (balanced Conduit) frame loop — ships with its stat skew only.
- The player pool raise's picked factors, once `feat/pool-raise` lands — see
  `reports/progression-phase0/pool-raise-run3.md`.
- The T3 class-path review (Pyromancer/Ember Mage overlap, Warmonger/Artillerist overlap,
  the PROVISIONAL `packet` tags on all 54 T3 paths).

## Cross-cutting rules (still binding)

- **Server authority.** Card, form, and material state are mutated only by the server
  handlers; the client sends intents and renders `card-fx` events and slice deltas.
- **Component presence.** Windows and charge are attached/detached components or
  `TracksCombat` timed flags, never booleans on networked slices.
- **No per-tick animation flags.** All signatures go through `pushEvent`.
- **Numbers.** Any literal magnitude in a card file fails `coverage.test`. Tuning is the
  magnitude table plus the packet budget.
- **Docs.** When a phase ships, fold it into the current-state pages named above; update
  `docs/README.md` in the same commit.
