# Balance Lab — Current State

Status: read-only MVP implemented 2026-08-12.

The Balance Lab is the trusted local Admin surface for seeing authored balance data as
one coherent game-wide picture. It is deliberately a view over shared formulas and
server-provided data, not a second balance model inside React.

## What exists

- A typed `BalanceLabSnapshot` built in `shared/src/systems/balanceLab.ts`.
- Delivery through the existing trusted-dev `/admin` Socket.IO namespace.
- A **Balance Lab** tab in the Admin app with:
  - tier switching across T1–T4;
  - fixed-tier biome threat/reward comparison;
  - sibling-relative threat indices and deviation-signal counts;
  - entry-reference context and blocker counts;
  - searchable encounter roster;
  - authored stat, reward, mechanic, TTL and planning-TTK inspection.
  - machine-readable progression intent and current-fit views, beginning with the
    T1 starter path `Plains -> Forest -> Swamp -> Mountain -> Cave`.
- A wiring/invariant test that checks all four tiers, reference profiles, duplicate pool
  weighting, finite metrics and encounter coverage.

## Metric contract

The overview uses the same analytical reference philosophy as the generated monster
report: an entry player of the next player tier, wearing previous-tier +3 gear, measured
against each biome tier. Incoming pressure accounts for plating, damage reduction and
evasion; it does not model healing or simultaneous attackers. Planning TTK uses the
shared class-aware DPS estimator over concrete class builds.

Threat indices and deviation counts are discovery tools, not target bands. They compare
one biome to its same-tier siblings and must never become automatic pass/fail gates.

## Progression authoring contract

`shared/src/data/balanceProgression.ts` records designer-approved constraints separately
from authored monster numbers. The initial draft policy locks Plains T1 as the baseline,
requires every following starter biome to exceed its predecessor, and gives Cave a
minimum of 1.5x Plains. It intentionally does not invent intermediate multipliers.
Each step also carries a hand-authoring brief: biome identity, the player skill being
tested, legal base-stat and mechanic levers, anti-goals, and a distinct purpose for each
normal monster. These briefs follow the Desert controller/dealer precedent: authored stat
shapes and readable relationships first, numerical magnitude second.

The Lab currently assesses this policy with `encounter-burden-v1`: estimated damage
received while an analytical reference build kills an average pool-weighted normal mob.
It combines incoming pressure and durability, while the table keeps incoming DPS, TTK,
spike and density visible as separate pressure lanes. This is a diagnostic proxy, not an
acceptance metric; runtime farm/fight results must replace or corroborate it.

The intended loop is:

1. State or revise the machine-readable progression policy, including locked baselines.
2. Generate a proposal with each monster's role, counterplay, base-stat budget, mechanic
   additions/compositions, and per-field before/after values; do not mutate canonical data yet.
3. Hand-author or review each monster so its biome identity and mechanics survive.
4. Run analytical tables plus fight/farm benches across representative builds.
5. Inspect ordering, clear time, survival, deaths, rewards and build-specific failures.
6. Accept a small source-data batch, regenerate reports, and repeat.

Agents may generate and analyze proposals. They must not treat one composite score as
truth, edit locked content, or apply generated values without a reviewable diff.

## Next slices

1. Integrate persisted farm-bench results: kills, deaths, essence, catalyst and biome XP
   per simulated hour.
2. Add reference-build comparison and dominance views using layered sweeps.
3. Add a reversible experiment overlay at the existing authored-data seam, with
   original/experimental deltas and export-to-source-patch support.
4. Add the scripted T0→cap route runner and progression timeline.

The Lab remains read-only until the experiment overlay has explicit validation and a
safe reset path. Canonical TypeScript data stays the source of truth.
