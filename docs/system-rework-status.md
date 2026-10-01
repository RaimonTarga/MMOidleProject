# System Rework — Current Status

**Audited:** 2026-09-27

This is the compact scoreboard for the post-T4 system rework. The old
implementation ledger and change log are preserved in
[archive/system-rework-status.md](archive/system-rework-status.md). This page
does not replace the individual current-state records; it points to them.

## Shipped structure

| Workstream | Status | Current source of detail |
| --- | --- | --- |
| Essence and lineage shards | Shipped; catalysts REMOVED 2026-10-01, replaced by family-keyed shards + boss capstones | [lineages-current-state.md](lineages-current-state.md), [variants-current-state.md](variants-current-state.md) |
| Biome Mastery and Global Mastery | Shipped; six normal levels per tier segment, derived GM | [global-mastery-current-state.md](global-mastery-current-state.md) |
| Rune sourcing and attunement | Shipped; capacity comes from Global Mastery | [rune-system-current-state.md](rune-system-current-state.md), [runic-attunement-current-state.md](runic-attunement-current-state.md) |
| Gear evolution and reconstruction | Armor/charm/boots shipped, ordinary evolution gate is +3; weapon evolution/upgrade REMOVED 2026-10-01, replaced by the lineage tree | [archive/gear-evolution-current-state.md](archive/gear-evolution-current-state.md) (historical values still live for non-weapon slots), [lineages-current-state.md](lineages-current-state.md) |
| Abilities | Shipped for the authored T1–T4 ability data | [abilities-current-state.md](abilities-current-state.md) |
| Charms and recovery | Machinery shipped; item identities and numbers continue to evolve | [charms-current-state.md](charms-current-state.md), [recovery-current-state.md](recovery-current-state.md) |
| Cores and Relics | Shipped slots and systems; balance candidates remain explicitly scoped | [cores-current-state.md](cores-current-state.md), [relics-current-state.md](relics-current-state.md) |
| Stances and Rites | Shipped systems with authoring/content follow-up | [stances-current-state.md](stances-current-state.md), [rites-current-state.md](rites-current-state.md) |
| Biome ecology | T1–T4 ecology primitives and authored identities shipped | [biome-ecology-current-state.md](biome-ecology-current-state.md) |
| Monster combat | T1–T4 combat identity/rework shipped; numerical tuning is separate | [monster-combat-rework-current-state.md](monster-combat-rework-current-state.md) |
| Boss encounters and dungeons | T1–T4 structure shipped; cleanup/tuning remains bounded work | [boss-encounter-rework-current-state.md](boss-encounter-rework-current-state.md), [dungeon-current-state.md](dungeon-current-state.md) |
| Sparse regions and node modifiers | T1–T4 registry shipped; modifier gameplay math REMOVED 2026-10-01, survives only as T2–T4 node authoring identity; T1 Plains/Forest use family blends instead | [variants-current-state.md](variants-current-state.md), [archive/node-modifiers-current-state.md](archive/node-modifiers-current-state.md), [map-variety-plan.md](map-variety-plan.md) |
| Authentication and characters | Guest, Discord linking, character roster, and admin token boundary shipped | [auth-and-characters-current-state.md](auth-and-characters-current-state.md) |
| Bot and telemetry instrumentation | Available; evidence semantics remain part of every experiment | [bot-experience-command-center.md](bot-experience-command-center.md), [gameplay-telemetry-current-state.md](gameplay-telemetry-current-state.md) |

## Active follow-up

- Keep the documentation and source contracts synchronized.
- Finish only the remaining boss cleanup/tuning items named in the active
  implementation plan.
- Run bounded balance and human-playtest packets from the current command
  center; preserve censored and not-run outcomes.
- Maintain client readability, mobile regression coverage, telemetry
  completeness, and release verification.
- Author T5+ content only through a new scoped plan. The current world registry
  is T0 tutorial plus authored T1–T4 regions; future-tier fallback formulas do
  not mean future regions exist.

## Interpretation rule

A row marked shipped means the machinery/data path exists. It does not mean
that every numeric value is final, every biome is balanced, every art asset is
complete, or every experiment has qualified a production change. Those claims
belong to the relevant current-state page and its evidence.
