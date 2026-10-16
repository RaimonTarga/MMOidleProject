# System Rework — Current Status

**Audited:** 2026-10-16 (OV-DOCS) against `rework/class-first`.

**The class-first rework replaces most of this scoreboard.** The post-T4 system rework this
page used to track (lineage trees, shards, ability node rows, frame loops and range rows, the
shared abilities, Runic Points, stances, rites, cores, relic items, gear evolution) is gone:
removed by the class-first rework or rebuilt inside each class. The design authority is
[class-first-bible.md](../design_docs/class-first-bible.md); the build's own board, with every
stand-in and open follow-up, is [briefs/class-first-build/STATUS.md](briefs/class-first-build/STATUS.md).
This page keeps the short view: what the rework built, what it removed, and which older rows
still stand. The old ledger is [archive/system-rework-status.md](archive/system-rework-status.md).

## Built by the class-first rework

All of it on `rework/class-first`, not yet released; no full playtest yet, and every class
number is a placeholder.

| Area | Status | Source of detail |
| --- | --- | --- |
| Six classes, each with its own class system and budget | Built T1–T4: kits, runtimes, class screens and HUD state (the Order, Response rules, Payoff rules, the Loadout, Thresholds, Formation) | bible §7–§12; `CLAUDE.md` "Classes"; `shared/src/classKits/`, `server/src/systems/classes/` |
| Class config | One `configuresClass` slice per character (`auto` or `custom`, the relic slot, the system), `class:setConfig`, migration 0010 | `shared/src/classKits/config.ts`, `server/src/systems/player/progression/classConfig.ts` |
| Moments | One trigger vocabulary for every class system; the server registry and fight snapshot | `shared/src/classKits/moments.ts`, `server/src/systems/combat/moments/` |
| Passive Tree | Class, then discipline (T2), specialization (T3), leaves (T4+), built from the kits; nodes carry no stats | `shared/src/data/skillTree/classFirst.ts` |
| Class gear | Class weapons, class lines on shared armor and charm bases (second bases for moved lines), smart loot | `shared/src/data/classGear/` |
| Relic slot | Holds the class boss trophy, ranked by the lineage's next-tier boss | bible §4 |
| Recovery and wards | An always-on in-combat Recovery share for every class (S4); timed wards on the Mountain and Tundra charms instead of their barrier (S7) | [recovery-current-state.md](recovery-current-state.md) (not yet updated for S4), STATUS.md |
| Guided tutorial | The opening, then per-class beats from the Clearing through Tier 4 | [guided-tutorial-current-state.md](guided-tutorial-current-state.md) |
| Bot routes | `<class>-t1` to `-t4` for every class, plus `smoke-t1`; isolated lanes | [bot/README.md](../bot/README.md) |

## Removed by the class-first rework

| Workstream | Removed by | History |
| --- | --- | --- |
| Lineage trees (all 20), lineage shards, ability node rows | D1 | [archive/lineages-current-state.md](archive/lineages-current-state.md) |
| Runic Points, crafted rune recipes, stances, rites, the core slot | D2 | [archive/runic-attunement-current-state.md](archive/runic-attunement-current-state.md), [archive/stances-current-state.md](archive/stances-current-state.md), [archive/rites-current-state.md](archive/rites-current-state.md), [archive/cores-current-state.md](archive/cores-current-state.md) |
| The shared abilities' player surface (learning, attunement, the hotbar, Use Ability) | D3 (the 19 definitions and the engine remain as an internal effect library) | [abilities-current-state.md](abilities-current-state.md) |
| Relic items (the slot stays, for trophies) | F5 | [archive/relics-current-state.md](archive/relics-current-state.md) |
| Frame loops, frames and range rows | each class's cleanup (CS7, CQ7, CL7, SP7, AP7, CD8) | [frames-current-state.md](frames-current-state.md) (stale: still describes them as shipped) |
| The old class and campaign bot routes, tutorial routes | D5 | [archive/t2-bot-testing-infrastructure.md](archive/t2-bot-testing-infrastructure.md) |

Weapon evolve and reconstruct went earlier, in the progression rework (2026-10-01):
[archive/gear-evolution-current-state.md](archive/gear-evolution-current-state.md).

## Older rows that still stand

| Workstream | Status | Current source of detail |
| --- | --- | --- |
| Biome Mastery and Global Mastery | Shipped; six levels per tier segment, derived GM. GM now also steps each class's budget | [global-mastery-current-state.md](global-mastery-current-state.md) |
| Runes | Loadouts remain as standing orders (movement, targeting, hazards); a class owns the runes it may use | [rune-system-current-state.md](rune-system-current-state.md) |
| Charms and recovery | Machinery shipped; item identities and numbers continue to evolve | [charms-current-state.md](charms-current-state.md), [recovery-current-state.md](recovery-current-state.md) |
| Biome ecology | T1–T4 ecology primitives and authored identities shipped | [biome-ecology-current-state.md](biome-ecology-current-state.md) |
| Monster combat | T1–T4 combat identity shipped; numerical tuning is separate | [monster-combat-rework-current-state.md](monster-combat-rework-current-state.md) |
| Boss encounters and dungeons | T1–T4 structure shipped; cleanup and tuning remain bounded work | [boss-encounter-rework-current-state.md](boss-encounter-rework-current-state.md), [dungeon-current-state.md](dungeon-current-state.md) |
| Sparse regions and family blends | T1–T4 registry shipped; node modifiers survive only as authoring identity; every normal node of the eleven monster-bearing biomes carries a family blend, PROVISIONAL at T3/T4 and at Mountain/Cave/Swamp | [variants-current-state.md](variants-current-state.md), [archive/node-modifiers-current-state.md](archive/node-modifiers-current-state.md), [map-variety-plan.md](map-variety-plan.md) |
| Authentication and characters | Guest, Discord linking, character roster, admin token boundary shipped | [auth-and-characters-current-state.md](auth-and-characters-current-state.md) |
| Bot and telemetry instrumentation | Available; evidence semantics remain part of every experiment | [bot-experience-command-center.md](bot-experience-command-center.md), [gameplay-telemetry-current-state.md](gameplay-telemetry-current-state.md) |

## Active follow-up

- The class-first build: the overnight tuning toward the first full T1–T4 playtest, then
  release prep (a wipe migration). See STATUS.md.
- Bring the stale living docs listed in the OV-DOCS report
  ([briefs/class-first-build/reports/OV-DOCS.md](briefs/class-first-build/reports/OV-DOCS.md))
  in line with the code.
- Author T5+ content only through a new scoped plan. The world registry is the T0 Clearing
  plus authored T1–T4 regions; future-tier fallback formulas do not mean future regions exist.

## Interpretation rule

A row marked shipped or built means the machinery and data path exist. It does not mean that
every number is final, every biome or class is balanced, every art asset is complete, or every
experiment has qualified a production change. Those claims belong to the relevant current-state
page and its evidence.
