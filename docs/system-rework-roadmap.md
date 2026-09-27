# System Rework — Implementation Roadmap

**Audited:** 2026-09-27
**Status:** The original construction sequence is complete for the authored T1–T4
systems. The active program is polish, balance evidence, release hygiene, and
deliberately scoped follow-up work; it is not a request to restart the old
step-by-step build plan.

The detailed historical roadmap is
[archived](archive/system-rework-roadmap.md). Source code and the current-state
pages are authoritative.

## Current order of work

1. **Source/document consistency.** Keep current-state pages, code comments,
   protocol descriptions, and operator commands aligned with shared and server
   authority.
2. **Balance instruments.** Use focused benches, frozen bot runs, telemetry,
   and human playtests with explicit matchup, source revision, and canonical
   status. Do not turn synthetic or accelerated runs into economy claims.
3. **T1–T4 playtest follow-up.** Work from the active
   [playtest command center](briefs/playtest-followup-command-center-2026-09-25.md)
   and the scoped packets it names. Keep implementation, measurement, and
   adopt/hold decisions separate.
4. **Release and operational proof.** Use
   [release-flow.md](release-flow.md), current health checks, and telemetry
   interpretation rules before calling a change shipped.
5. **Deferred content.** T5+ world authoring, broader terrain, art gaps, and
   other ideas remain in [future-plans.md](future-plans.md) or their explicit
   design authority until separately scoped.

## Structural status

| Area | Current status | Living record |
| --- | --- | --- |
| Essence and modifier-family catalysts | Shipped; weights/costs remain tuning inputs | [aspects-catalysts-current-state.md](aspects-catalysts-current-state.md) |
| Biome Mastery and Global Mastery | Shipped; derived GM drives rune capacity and upgrade ceilings | [global-mastery-current-state.md](global-mastery-current-state.md) |
| Runes and attunement | Shipped; current action/loadout contract is source-backed | [rune-system-current-state.md](rune-system-current-state.md) |
| Gear evolution/reconstruction | Shipped; ordinary predecessor gate is +3, Core/Relic rank-up is +0 | [gear-evolution-current-state.md](gear-evolution-current-state.md) |
| Abilities, Stances, Rites, Charms, Cores, Relics | Shipped systems with ongoing content/balance work | their current-state pages in the documentation index |
| Biome ecology and monster combat | Shipped structure for authored T1–T4 content; numbers remain evidence work | [biome-ecology-current-state.md](biome-ecology-current-state.md), [monster-combat-rework-current-state.md](monster-combat-rework-current-state.md) |
| Bosses and dungeons | Shipped encounter structure for T1–T4; cleanup/tuning follow-up remains scoped | [boss-encounter-rework-current-state.md](boss-encounter-rework-current-state.md), [dungeon-current-state.md](dungeon-current-state.md) |
| Regions and node modifiers | Shipped T1–T4 sparse world and modifier families | [map-variety-plan.md](map-variety-plan.md), [node-modifiers-current-state.md](node-modifiers-current-state.md) |
| UI and presentation | Incremental maintenance and readability work | [ui-redesign-plan.md](ui-redesign-plan.md), current client docs |
| Balance/release tooling | Active; evidence quality is part of the feature | [balance-lab-current-state.md](balance-lab-current-state.md), [bot-experience-command-center.md](bot-experience-command-center.md) |

## What is not current

Do not plan from the archived phase tables, old four-level mastery assumptions,
old biome-keyed catalyst assumptions, old +5 evolution-gate packets, or old
11×11 map descriptions. Those statements remain only as historical provenance
in the archive or in explicitly labelled evidence sections of current tooling
documents.
