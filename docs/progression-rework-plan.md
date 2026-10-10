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
| Recovery: the flat model and the pool raise | [recovery-current-state.md](recovery-current-state.md) |

## Phase scoreboard

| Phase | What it covers | Status |
| --- | --- | --- |
| 0 | Coarse HP/recovery pass; flat recovery; player pool raise | Shipped (0a/0b); the per-tier pool raise landed in run 3 at 1.25/1.30/1.35/1.40, PROVISIONAL — see `recovery-current-state.md` |
| 1 | Weapon lineage tree, T1, five lineages; card runtime; bot profiles/lane bench | Shipped |
| 2 | Variants, shards, removal of the old economy (catalysts, node modifiers, weapon `+N`) | Shipped |
| 3 | Frame loops and range-node mechanics | Shipped (Consort's loop is the one open piece — see `frames-current-state.md`) |
| 4 | Armor, charm, boots trees at T1 (fifteen defensive lineages); T1 third mobs | Shipped (authoring half); the Mountain/Cave/Swamp family *review* (design bible open decision 2) is still open |
| 5 | T2 band (amplifier row), band collapse/stat absorption, form re-homing, T3 keystone / T4 cross rows, ability nodes, T2–T4 families and blends | Shipped |

## Still open (designer-owned, not implementation gaps)

- The Mountain/Cave/Swamp T1 family review and a second T1 source for Engagement-type
  gaps on other packets (design bible open decisions 2–3).
- Every T3/T4 family assignment and every provisional magnitude — see
  `variants-current-state.md` §6.
- **Every `drops` value is still unsettled, and run 4 explains why.** No `drops` field
  moved: `reports/progression-phase1/family-contracts-run4.md` measured all 33 family
  contracts on nodes forced to 100% the family under test and found exactly one decisive
  inversion (Cave Brute at T1), which then failed to reproduce on four more nodes of the
  same composition — pooled margin −0.6% against a host half-spread of +5.1%
  (`family-contracts-run4-cave-brute-hosts.md`). The host node moves a contract's margin
  as much as the lane does, so the twelve still-inverted rows AND the four decisive holds
  were each measured on one host and none of them is settled. The next pass is
  `FAM_HOSTS_ALL=1` over those sixteen families.
- The Consort (balanced Conduit) frame loop — ships with its stat skew only.
- The player pool raise's factors (1.25/1.30/1.35/1.40) are PROVISIONAL: only the boss
  half of their acceptance criterion discriminates, and the normal-node half was already
  breached before the raise — see `reports/progression-phase0/pool-raise-run3.md`.
- The PROVISIONAL `packet` tags on all 54 T3 paths (the Pyromancer and Warmonger overlaps
  were closed by the ability pass, design §22.5).

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
