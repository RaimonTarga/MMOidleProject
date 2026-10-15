# System Rework — Current Status

**Audited:** 2026-10-01 (progression rework rows refreshed for run 3); tutorial row refreshed 2026-10-05

This is the compact scoreboard for the post-T4 system rework. The old
implementation ledger and change log are preserved in
[archive/system-rework-status.md](archive/system-rework-status.md). This page
does not replace the individual current-state records; it points to them.

## Shipped structure

| Workstream | Status | Current source of detail |
| --- | --- | --- |
| Essence and lineage shards | Removed (class-first rework). Families remain; the shard currency does not | [archive/lineages-current-state.md](archive/lineages-current-state.md), [variants-current-state.md](variants-current-state.md) |
| Lineage trees — all 20 (5 weapon + 15 defensive) | Removed (class-first rework) | [archive/lineages-current-state.md](archive/lineages-current-state.md) |
| Frame loops and range mechanics | Shipped for all six roots (Consort's loop still open) and all three range rows per root; unbenched placeholders | [frames-current-state.md](frames-current-state.md) |
| Ability nodes (packet, amplifier, keystone, cross rows) | Removed (class-first rework) | [archive/lineages-current-state.md](archive/lineages-current-state.md) |
| Biome Mastery and Global Mastery | Shipped; six normal levels per tier segment, derived GM | [global-mastery-current-state.md](global-mastery-current-state.md) |
| Rune sourcing and attunement | Loadouts remain. The shared Runic Point budget and crafted rune recipes were removed; a class owns the runes it may use | [rune-system-current-state.md](rune-system-current-state.md) |
| Gear evolution and reconstruction | Removed (class-first rework) | [archive/gear-evolution-current-state.md](archive/gear-evolution-current-state.md), [archive/lineages-current-state.md](archive/lineages-current-state.md) |
| Abilities | Ability data remains in the tree. Ability node rows were removed with the lineage trees | [abilities-current-state.md](abilities-current-state.md) |
| Charms and recovery | Machinery shipped; item identities and numbers continue to evolve | [charms-current-state.md](charms-current-state.md), [recovery-current-state.md](recovery-current-state.md) |
| Cores and Relics | Removed (class-first rework): the core slot and relic items. The relic slot remains and holds the class boss trophy | [archive/cores-current-state.md](archive/cores-current-state.md), [archive/relics-current-state.md](archive/relics-current-state.md) |
| Stances and Rites | Removed (class-first rework) | [archive/stances-current-state.md](archive/stances-current-state.md), [archive/rites-current-state.md](archive/rites-current-state.md) |
| Biome ecology | T1–T4 ecology primitives and authored identities shipped | [biome-ecology-current-state.md](biome-ecology-current-state.md) |
| Monster combat | T1–T4 combat identity/rework shipped; numerical tuning is separate | [monster-combat-rework-current-state.md](monster-combat-rework-current-state.md) |
| Boss encounters and dungeons | T1–T4 structure shipped; cleanup/tuning remains bounded work | [boss-encounter-rework-current-state.md](boss-encounter-rework-current-state.md), [dungeon-current-state.md](dungeon-current-state.md) |
| Sparse regions and node modifiers | T1–T4 registry shipped; modifier gameplay math REMOVED 2026-10-01, survives only as node authoring identity; every normal node of the eleven monster-bearing biomes (T1 25, T2 37, T3 38, T4 38 = 138 nodes) now carries a family blend instead, all PROVISIONAL at T3/T4 and at Mountain/Cave/Swamp | [variants-current-state.md](variants-current-state.md), [archive/node-modifiers-current-state.md](archive/node-modifiers-current-state.md), [map-variety-plan.md](map-variety-plan.md) |
| Guided T1 tutorial | Shipped as the opening plus the seal route. The weapon-page, shard, and rune lessons are gone | [guided-tutorial-current-state.md](guided-tutorial-current-state.md) |
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
