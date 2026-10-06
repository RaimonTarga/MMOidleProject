# Documentation Index

**Last audited:** 2026-10-01
**Lifecycle refreshed:** 2026-10-05 (tutorial fold and shipped-plan review)

This is the navigation page for documentation that is useful in the current
repository. It is deliberately not a dump of every dated report. Source code
wins over every document: shared rules and server behavior are the evidence
for implementation claims.

## The four kinds of documentation

1. **Current state** — what the checked-in code and data do now.
2. **Design authority** — intended behavior, constraints, and vocabulary in
   design_docs/.
3. **Active plans and operations** — scoped work that is still open or an
   operating procedure that is still used.
4. **Historical evidence** — completed plans, handoffs, experiment packets,
   reports, and superseded decisions under docs/archive/, design_docs/archive/,
   docs/briefs/, or reports/.

A current-state page should say when it was audited, name the owning source
paths, distinguish shipped behavior from placeholder balance, and link focused
tests where they exist. A dated packet or report is not a current rule merely
because it is detailed.

## Start here

- [Project README](../README.md) — setup, repository shape, auth boundaries,
  common commands, and the current world/progression summary.
- [Architecture](../design_docs/architecture.md) — source ownership,
  authoritative boundaries, tick schedule, persistence, and system seams.
- [Playtest command center](briefs/playtest-followup-command-center-2026-09-25.md)
  — active release/playtest scope and evidence rules.
- [Release flow](release-flow.md) — local, Docker, and Railway-shaped delivery.
- [Gameplay telemetry](gameplay-telemetry-current-state.md) — log database,
  event contract, retention, admin queries, and interpretation limits.
- [Bot experience command center](bot-experience-command-center.md) — live
  route/economy experiment procedure and evidence boundaries.

## Systems — current state

### Runtime, world, and combat

| System | Current-state record |
| --- | --- |
| Abilities | [abilities-current-state.md](abilities-current-state.md) |
| Barrier and ward | [barrier-ward-current-state.md](barrier-ward-current-state.md) |
| Biome ecology | [biome-ecology-current-state.md](biome-ecology-current-state.md) |
| Boss encounters | [boss-encounter-rework-current-state.md](boss-encounter-rework-current-state.md) |
| Conduit | [conduit-current-state.md](conduit-current-state.md) |
| Damage over time | [dot-systems-current-state.md](dot-systems-current-state.md) |
| Dungeons | [dungeon-current-state.md](dungeon-current-state.md) |
| Monster behavior | [monster-behavior-current-state.md](monster-behavior-current-state.md) |
| Monster combat rework | [monster-combat-rework-current-state.md](monster-combat-rework-current-state.md) |
| Monster targeting | [monster-targeting-current-state.md](monster-targeting-current-state.md) |
| Node variants (family blends) | [variants-current-state.md](variants-current-state.md) |
| Frame loops and range mechanics | [frames-current-state.md](frames-current-state.md) |
| Area banners and danger previews | [area-information-current-state.md](area-information-current-state.md) |
| Map, Crafting, Upgrade, Inventory and Passive Tree panels | [map-crafting-panels-current-state.md](map-crafting-panels-current-state.md) |
| Player movement | [player-movement-current-state.md](player-movement-current-state.md) |
| Recovery | [recovery-current-state.md](recovery-current-state.md) |

### Progression, economy, and equipment

| System | Current-state record |
| --- | --- |
| Lineage trees (the weapon tree live; armor/charm/boots parked), the T1 lean and verb, keystones, ability nodes, the weapon page and the rhythm readout | [lineages-current-state.md](lineages-current-state.md) |
| Charms | [charms-current-state.md](charms-current-state.md) |
| Cores | [cores-current-state.md](cores-current-state.md) |
| Global Mastery | [global-mastery-current-state.md](global-mastery-current-state.md) |
| Relics | [relics-current-state.md](relics-current-state.md) |
| Rites | [rites-current-state.md](rites-current-state.md) |
| Runes | [rune-system-current-state.md](rune-system-current-state.md) |
| Runic attunement | [runic-attunement-current-state.md](runic-attunement-current-state.md) |
| Seals and tier advancement | [seals-current-state.md](seals-current-state.md) |
| Stances | [stances-current-state.md](stances-current-state.md) |
| T1 item rework | [t1-item-rework-current-state.md](t1-item-rework-current-state.md) |
| Tier balance | [tier-balance-current-state.md](tier-balance-current-state.md) |

### Client, auth, and presentation

| System | Current-state record |
| --- | --- |
| Authentication and characters | [auth-and-characters-current-state.md](auth-and-characters-current-state.md) |
| Audio | [audio-current-state.md](audio-current-state.md) |
| Guided T1 tutorial | [guided-tutorial-current-state.md](guided-tutorial-current-state.md) |
| Combat animation (mobs and players) | [combat-animation-current-state.md](combat-animation-current-state.md) |
| Landing cinematic | [landing-cinematic-current-state.md](landing-cinematic-current-state.md) |
| Player sprites | [player-sprites-current-state.md](player-sprites-current-state.md) |
| Spectator landing | [spectator-landing-current-state.md](spectator-landing-current-state.md) |

### Operations, telemetry, and bot tooling

| Area | Current-state record |
| --- | --- |
| Balance lab | [balance-lab-current-state.md](balance-lab-current-state.md) |
| Bot experience experiments | [bot-experience-command-center.md](bot-experience-command-center.md) |
| Frozen bot runner | [bot-experiment-runner-current-state.md](bot-experiment-runner-current-state.md) |
| Bot capability audit | [bot-harness-capability-audit.md](bot-harness-capability-audit.md) |
| Tier-2 bot infrastructure | [t2-bot-testing-infrastructure.md](t2-bot-testing-infrastructure.md) |
| Gameplay telemetry | [gameplay-telemetry-current-state.md](gameplay-telemetry-current-state.md) |
| Telemetry MCP | [telemetry-mcp-setup.md](telemetry-mcp-setup.md) |

## Active plans and operational records

These pages are not all implementation truth. Each has a status at its top;
read the linked current-state page before using it to describe shipped
behavior.

- [Future plans](future-plans.md) — backlog and deliberately deferred ideas.
- [Progression rework plan](progression-rework-plan.md) — now a short status index:
  **Phases 0–5 all shipped** (at least their first slice) as of run 3, 2026-10-01. Live
  state is [lineages-current-state.md](lineages-current-state.md) (all twenty lineages,
  rows, keystones, cross, re-homed forms, ability nodes),
  [variants-current-state.md](variants-current-state.md) (families/blends through T4),
  [frames-current-state.md](frames-current-state.md) (frame loops, range mechanics), and
  [recovery-current-state.md](recovery-current-state.md) (flat recovery, pool-raise
  pointer). The full phase-by-phase build log is archived at
  [archive/progression-rework-plan.md](archive/progression-rework-plan.md). Design
  authority is
  [`design_docs/progression-rework-design.md`](../design_docs/progression-rework-design.md).
- [Ability pass run brief](briefs/ability-pass-run-2026-10-02.md) — the run that implements design §22 (roster 22 → 17, ability keystone + cross rows, five T3 path re-homes); starts after the T1 boss pass merges; T1 lab DPS held within ±5%.
- [Release v0.6 record](briefs/release-v0.6-2026-09-28.md) — what shipped in v0.6, merged branches, save policy, bandwidth changes, validation and the deploy check.
- [T4 power curve review](archive/briefs/t4-power-curve-review-2026-09-27.md) — ARCHIVED 2026-09-27: done; report in `reports/t4-power-curve-2026-09-27/REVIEW.md`, live state in [tier-balance-current-state.md](tier-balance-current-state.md) §6–7.
- [Boss lineage art list](briefs/boss-lineage-art-list-2026-09-27.md) — icons and ground textures the boss lineages borrow art for, with target paths and wiring.
- [Four-tier source audit](briefs/four-tier-audit-2026-10-05.md) — read-only inventory of tier ceilings, authored tables, validation pins, and fifth-tier consequences across packages; source revision and generic paths distinguished.
- [Effect parity lab brief](briefs/effect-parity-lab-2026-10-06.md) — 2026-10-06: one Opus lab session solving the Effect lean's payload unit on the Rapier, Axe and Broadsword so rank I Effect matches rank I Attack (design §26.5); branch lab/effect-parity, the designer applies.
- [Legibility run report](briefs/legibility-report-2026-10-05.md) — COMPLETE 2026-10-06, merged to develop: design §26.1–§26.4 implemented (the T1 band is a ranked Attack/Speed/Effect lean and the weapon's own verb, the choice opens at T2; one damage-over-time record per weapon and a zero-gap status registry pinned by a test; T1 nodes as rosters with one crossroads per biome; one named ring per verb under the HP bar, the proc strip removed, teaching-only floating word, the Upgrade and Stats panels, the territory line; the tutorial taught once and the bot buying ranks). Carries every number picked, the composition matrix by lean × rank, the no-band identity proof, the tutorial-kit bar, the 1x sweep ledger, the screenshots per view and the designer's open calls (the Effect lean is weakest on three weapons; the Hammer's verb needs its Effect lean). Brief: [legibility-run-2026-10-05.md](briefs/legibility-run-2026-10-05.md). Evidence: `reports/legibility/`.
- [UI prototypes run report](briefs/ui-prototypes-report-2026-10-04.md) — COMPLETE 2026-10-05, on `design/ui-prototypes` (not merged): five interactive lineage-UI prototypes (A ring, B HUD cards, C body first, D dense sidebar, E beat strip) built from one data export against the same five scenes, a live side-by-side comparison page (`reports/ui-prototypes/index.html`, opens from disk), the matrix, the reviewer's critique and pick, what to reuse, what no thesis solved and the client findings. Design only, no game code. Brief: [ui-prototypes-run-2026-10-04.md](briefs/ui-prototypes-run-2026-10-04.md).
- [Verbs-that-fire run report](briefs/verbs-that-fire-report-2026-10-03.md) — COMPLETE 2026-10-04, merged to develop: design §24.9 implemented (the Affliction and Control leans seed their condition, the Empowered moment capped, T2+ bands compose and the amplifier moves an axis of the composed pair, the eight T2–T4 nodes re-led to a family they field, parked lineages out of the boss stopgap, chaotic misses on every hit moment, the tutorial's lean and verb on the weapon each class fights with, the T1 verb at Global Mastery 10, card firings in the bot). Carries every number picked, the composition matrix rerun (12 of 45 under the floor, four that still never fire and why), the T2 matrix, the 1x sweep ledger with firings and the designer's open calls. Brief: [verbs-that-fire-run-2026-10-03.md](briefs/verbs-that-fire-run-2026-10-03.md). Evidence: `reports/verbs-that-fire/`.
- [Course-correction run report](briefs/course-correction-report-2026-10-03.md) — COMPLETE 2026-10-03, merged to develop: design §24 implemented (the T1 lean and verb compose into one generated sentence, one shard per node, non-weapon trees parked, the ladder and evolve retired on every slot, the weapon page, the rhythm readout, payload FX, the guide's two purchases). Carries every number picked, the lean × verb composition matrix (13 of 45 pairs under the viability floor, all for verbs that do not fire at T1), the boss-lab delta, the 1x sweep ledger and the designer's open calls. Brief: [course-correction-run-2026-10-03.md](briefs/course-correction-run-2026-10-03.md). Evidence: `reports/course-correction/`.
- [Tooling repair report](briefs/tooling-repair-report-2026-10-03.md) — five ordered repairs: legacy route actions, full-power reports, Conduit test inclusion, baked hitboxes and node-shard bench accounting; validation and bounded T1 smoke evidence.
- [Course-correction icons](briefs/cc-icons-report-2026-10-03.md) — W1-E: the 26 icons and nine essence-style shard replacements, designer-approved and packed; source/runtime targets and the gallery handoff.
- [Non-weapon ladder fold report](briefs/cc-fold-report-2026-10-03.md) — W1-D evidence: all 86 original +5 totals, per-field before/after values, and validation.
- [T1 boss pass report](briefs/t1-boss-pass-report-2026-10-02.md) — COMPLETE 2026-10-02: three T1 boss rows moved (Behemoth attack, Greatbear HP+attack, Toadeater HP) so every class beats every T1 boss on the guide's kit; second seal stays Mountain. Two findings outlive the numbers: a solo T1 boss fight was deterministic (24 of 30 cells), and the Behemoth/Broodmother are a 10x melee/ranged split rather than a difficulty.
- [Boss redesign implementation plan](boss-encounter-redesign-implementation-plan-2026-09-04.md)
  — IN PROGRESS: the remaining Phase 8 cleanup/tuning handoff after the shipped phases.
- [Core rework design/balance handoff](core-rework-design-balance-handoff.md) —
  approved direction for a future Core pass; implementation is not implied.
- [Map variety design](map-variety-plan.md) — living region design authority;
  retained until its region-layout/mask rules have a complete current-state successor.
  Family blends are in [variants-current-state.md](variants-current-state.md).
- [Terrain variance plan](terrain-variance-plan.md) — own status remains IN PROGRESS.
- [UI redesign plan](ui-redesign-plan.md) — approved for incremental implementation;
  presentation work and review history, not a fully shipped plan.
- [Stance future design notes](stances-future-design-notes.md) — unimplemented
  design ideas only.
- [Named progression checkpoints](named-progression-checkpoints.md) —
  command-center acceptance procedure and implementation record.
- [System rework roadmap](system-rework-roadmap.md) and [system rework
  status](system-rework-status.md) — current follow-up queue and implementation
  scoreboard after the authored T1–T4 construction pass.
- [Rite authoring guide](rites-authoring-guide.md) and [stance authoring
  guide](stances-authoring-guide.md) — authoring contracts for new content.

## Reference and authoring pages

- [Map regions atlas](map-variety-regions-atlas.md) — human-readable map view;
  source coordinates remain canonical.
- [Named progression checkpoints](named-progression-checkpoints.md) —
  acceptance and continuation procedure for named playtest states.
- [Release flow](release-flow.md) — branch, packaging, and deployment checks.
- [T1 item rework](t1-item-rework-current-state.md) — the shipped Clearing/T1
  item cast and its source-linked constraints.

## Design authority

The flat files in design_docs/ are the design and architecture source set:

- [architecture.md](../design_docs/architecture.md)
- [design-bible.md](../design_docs/design-bible.md)
- [Progression rework design](../design_docs/progression-rework-design.md) — design authority;
  the worn-form band gate, delegated monster pass and Consort loop decisions are §18.11–§18.13.
- [game-overview.md](../design_docs/game-overview.md)
- [economy-philosophy.md](../design_docs/economy-philosophy.md)
- [player-power-curve.md](../design_docs/player-power-curve.md)
- [boss-design.md](../design_docs/boss-design.md)
- [boss-lineage-redesign.md](../design_docs/boss-lineage-redesign.md) — 2026-09-27 boss contract (fight length and phases per tier) and per-lineage T1–T4 redesign; **first pass implemented 2026-09-27**, numbers pass pending; supersedes boss-design.md's fight-length target
- [relics-design.md](../design_docs/relics-design.md)
- [summoner-overhaul-design-source.md](../design_docs/summoner-overhaul-design-source.md)
- [ability cast and tier progression](../design_docs/ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md)
- [core design philosophy](../design_docs/CORE_DESIGN_PHILOSOPHY.md)
- [core cast review](../design_docs/CORE_CAST_REVIEW_DRAFT.md)
- [core T4 cast](../design_docs/CORE_T4_CAST.md)
- [T1 item design philosophy](../design_docs/T1_ITEM_DESIGN_PHILOSOPHY.md)
- [T1 item numerical baseline](../design_docs/T1_ITEM_NUMERICAL_BASELINE.md)
- [T5–T8 endgame suggestions](../design_docs/t5-t8-endgame-suggestions.md)

Some design files intentionally describe targets rather than shipped behavior.
Use the current-state table above and the source when they conflict.

## Historical material and archive lifecycle

- [Guided T1 tutorial plan](archive/guided-tutorial-plan.md) — implemented; live behavior and
  validation records are in [guided-tutorial-current-state.md](guided-tutorial-current-state.md).
- [Docs fold report](briefs/docs-fold-report-2026-10-05.md) — tutorial fold, verbatim
  progression amendments, conditional duplicate proof and retained-plan inventory.
- [Status registry audit (2026-10-05)](briefs/status-registry-audit-2026-10-05.md) — raw player/monster ids, HUD projections, presentation gaps, slow/root clocks, and the rerunnable source extractor.
- [Archive guide](archive/README.md) explains how completed plans and
  handoffs are moved without losing provenance.
- [Briefs and evidence](briefs/README.md) explains the active/history split for
  dated operator packets, reports, audits, and experiment receipts.
- [docs/archive/](archive/) contains completed or superseded project plans and
  historical current-state exports.
- [design_docs/archive/](../design_docs/archive/) contains historical design
  authority and implementation context.
- [v0.5 release readiness](archive/next-playtest-release-readiness.md) is a
  completed release record; use [release-flow.md](release-flow.md) for the live
  procedure.
- [reports/](../reports/) contains generated artifacts. Reports can support an
  observation, but they do not override current source or prove a different
  matchup than the one they measured.

When a plan ships, fold durable facts into the relevant current-state record,
add or refresh an archive header naming the successor, then move the plan.
When evidence is still useful, preserve it and label its scope, branch,
revision, and canonical/non-canonical status. Do not silently delete old
receipts merely because their conclusions are no longer current.
