# Documentation Index

Map of every living doc, what it is for, and where history goes.
Last sorted: 2026-08-13.

**If code and any doc disagree, the code wins — fix the doc.**

## The four kinds of doc

| Kind | Lives in | Job |
|---|---|---|
| **Design authority** | `design_docs/` | What a system *should* be. Intent, invariants, bands. Survives implementation. |
| **Current state** | `docs/<system>-current-state.md` | What the code *does* today. The living truth. Updated whenever the system changes. |
| **Implementation plan** | `docs/<system>-*-plan.md` | How and in what order to build it. **Archived once shipped.** |
| **History** | `docs/archive/`, `design_docs/archive/` | Shipped plans and superseded brainstorms. Every file carries an `ARCHIVED` header naming its live successor. Never trust as current. |

**Lifecycle:** a plan ships → fold anything still true into the paired
`*-current-state.md` → `git mv` the plan into `archive/` → stamp a one-line
`> **ARCHIVED (date) — implemented; live state in X.**` header → repoint inbound
references. New feature ideas start in `docs/future-plans.md`, not a fresh
top-level doc.

---

## Start here

| Doc | Why |
|---|---|
| [system-rework-status.md](system-rework-status.md) | **The scoreboard.** What is designed / in progress / done across all 15 rework steps, with a dated session log. |
| [system-rework-roadmap.md](system-rework-roadmap.md) | The step ordering and dependency graph behind that scoreboard. |
| [polish-and-balance-roadmap.md](polish-and-balance-roadmap.md) | **The current program.** Seven workstreams and their ordering for the polish + balance phase, then T5/T6 as an extrapolation. |
| [next-playtest-implementation-plan.md](next-playtest-implementation-plan.md) | Phases superseded; still the reference for the tooling audit (§5), defect list (§5.7), and the auto-combat wedge (§5.8). |
| [future-plans.md](future-plans.md) | Parking lot for decided-in-spirit, not-yet-scheduled features. |
| [../design_docs/architecture.md](../design_docs/architecture.md) | How the codebase is structured. Read end to end once. |
| [../design_docs/design-bible.md](../design_docs/design-bible.md) | The combat/design invariants nothing may violate. |

## Systems — current state

| System | Doc | Design authority |
|---|---|---|
| Abilities (Technique / Guard) | [abilities-current-state.md](abilities-current-state.md) | [ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md](../design_docs/ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md) |
| Aspects + catalysts | [aspects-catalysts-current-state.md](aspects-catalysts-current-state.md) | — |
| Audio | [audio-current-state.md](audio-current-state.md) | — |
| Auth + characters | [auth-and-characters-current-state.md](auth-and-characters-current-state.md) | — |
| Balance Lab | [balance-lab-current-state.md](balance-lab-current-state.md) | [player-power-curve.md](../design_docs/player-power-curve.md) |
| Barrier & Ward | [barrier-ward-current-state.md](barrier-ward-current-state.md) | — |
| Biome identity / ecology | [biome-ecology-current-state.md](biome-ecology-current-state.md) | — |
| Charms (Guard amplifiers) | [charms-current-state.md](charms-current-state.md) | — |
| Conduit (summoner) | [conduit-current-state.md](conduit-current-state.md) | [summoner-overhaul-design-source.md](../design_docs/summoner-overhaul-design-source.md) |
| Cores | [cores-current-state.md](cores-current-state.md) | [CORE_DESIGN_PHILOSOPHY.md](../design_docs/CORE_DESIGN_PHILOSOPHY.md), [CORE_CAST_REVIEW_DRAFT.md](../design_docs/CORE_CAST_REVIEW_DRAFT.md) |
| DoT systems | [dot-systems-current-state.md](dot-systems-current-state.md) | — |
| Dungeons (guarded altar) | [dungeon-current-state.md](dungeon-current-state.md) | [dungeon-design-brainstorm.md](../design_docs/archive/dungeon-design-brainstorm.md) (historical) |
| Gear evolution | [gear-evolution-current-state.md](gear-evolution-current-state.md) | — |
| Global mastery + recipes | [global-mastery-current-state.md](global-mastery-current-state.md) | — |
| Monster behavior | [monster-behavior-current-state.md](monster-behavior-current-state.md) | [boss-design.md](../design_docs/boss-design.md) |
| Monster combat rework (T1-T4) | [monster-combat-rework-current-state.md](monster-combat-rework-current-state.md) | [MONSTER_COMBAT_REWORK_HANDOFF_T1_T4_2026-08-22.md](../design_docs/MONSTER_COMBAT_REWORK_HANDOFF_T1_T4_2026-08-22.md) |
| Boss encounters (T1-T4) | [boss-encounter-rework-current-state.md](boss-encounter-rework-current-state.md) | [BOSS_ENCOUNTER_REWORK_HANDOFF_T1_T4_2026-08-23.md](../design_docs/BOSS_ENCOUNTER_REWORK_HANDOFF_T1_T4_2026-08-23.md) |
| Monster targeting | [monster-targeting-current-state.md](monster-targeting-current-state.md) | — |
| Node modifiers | [node-modifiers-current-state.md](node-modifiers-current-state.md) | [map-variety-plan.md](map-variety-plan.md) (map design authority; its §1.2/§1.6 are superseded) |
| Player sprites | [player-sprites-current-state.md](player-sprites-current-state.md) | [player-visual-identity-bible.md](../design_docs/visual_and_aesthetics_design/player-visual-identity-bible.md) |
| Recovery | [recovery-current-state.md](recovery-current-state.md) | [T1_ITEM_DESIGN_PHILOSOPHY.md](../design_docs/T1_ITEM_DESIGN_PHILOSOPHY.md), [RECOVERY_REGEN_REWORK_HANDOFF.md](../design_docs/archive/RECOVERY_REGEN_REWORK_HANDOFF.md) (historical) |
| Tier balance (T1-T4 numbers) | [tier-balance-current-state.md](tier-balance-current-state.md) | [briefs/t2-t4-numerical-baseline-handoff-2026-08-23.md](briefs/t2-t4-numerical-baseline-handoff-2026-08-23.md) (fulfilled), [briefs/t1-balance-context-2026-08-18.md](briefs/t1-balance-context-2026-08-18.md) |
| Relics | [relics-current-state.md](relics-current-state.md) | [relics-design.md](../design_docs/relics-design.md) |
| Rites | [rites-current-state.md](rites-current-state.md) | — |
| Runes | [rune-system-current-state.md](rune-system-current-state.md) | — |
| Tier seals | [seals-current-state.md](seals-current-state.md) | — |
| Spectator landing | [spectator-landing-current-state.md](spectator-landing-current-state.md) | — |
| Stances | [stances-current-state.md](stances-current-state.md) | — |
| T1 item rework | [t1-item-rework-current-state.md](t1-item-rework-current-state.md) | [T1_ITEM_DESIGN_PHILOSOPHY.md](../design_docs/T1_ITEM_DESIGN_PHILOSOPHY.md), [T1_ITEM_NUMERICAL_BASELINE.md](../design_docs/T1_ITEM_NUMERICAL_BASELINE.md) |

`rites-current-state.md` and `stances-current-state.md` double as external-review
handoffs: both systems have complete machinery and thin, placeholder content.

## In-flight plans

| Doc | State |
|---|---|
| [ui-redesign-plan.md](ui-redesign-plan.md) | Phased desktop HUD redesign with review gates; Part III (apparatus wave) still ahead. |
| [map-variety-plan.md](map-variety-plan.md) | Design authority for the world map (layout, regions, catalyst economy). Both stages shipped. Its node-modifier sections (§1.2 pace families, §1.6 density overlay) were superseded 2026-08-21 — live modifier behavior is in [node-modifiers-current-state.md](node-modifiers-current-state.md). |
| [terrain-variance-plan.md](terrain-variance-plan.md) | **Living record of the biome visual pass (CLOSED 2026-08-17).** SS8-9 are the levers and the per-biome log — every biome's generators, measured numbers and open dials. S10 records what was deferred. SS1-7 are an earlier, PARKED gameplay-terrain plan; do not start on those. |
| [biome-refactor-playtest.md](biome-refactor-playtest.md) | Open playtest notes and unanswered questions from the per-biome T1 dungeon pass. |
| [briefs/t1-boss-numbers-2026-08-21.md](briefs/t1-boss-numbers-2026-08-21.md) | **Open brief.** The T1 boss numerical pass: all five calibrated to one end-of-tier band (5.5x cost spread -> 1.11x). Records two tooling defects it found — `--mode boss` never fought a boss, and the tier table ignored `consecutiveHits` — and why the Gnarled Greatbear cannot be tuned off the plating cliff until the mitigation pass lands. |
| [briefs/mitigation-rebalance-handoff-2026-08-18.md](briefs/mitigation-rebalance-handoff-2026-08-18.md) | **Open brief.** Why T1 difficulty spans 16x instead of ~2x: flat plating means each biome's native armour answers its own monsters unequally. The next balance pass starts here. |
| [briefs/t1-balance-context-2026-08-18.md](briefs/t1-balance-context-2026-08-18.md) | Self-contained Tier 1 context pack (formulas, method, biome data, every monster's stat block) for reasoning about balance without codebase access. Regenerate its figures with `pnpm tier:table --tier=1`. **Two things in it are now stale:** its node-modifier magnitudes (it says M = 0.15-0.30; the code says 0.05-0.20) and its T1 Mountain/Caverns figures, which moved 2026-08-23 when the tier table learned to see charged attacks. |
| [briefs/t2-t4-numerical-baseline-handoff-2026-08-23.md](briefs/t2-t4-numerical-baseline-handoff-2026-08-23.md) | **FULFILLED 2026-08-23** — live state in [tier-balance-current-state.md](tier-balance-current-state.md). Kept for its measurement of where T2-T4 sat before the pass, and for the instrument-gap list it set. Its SS3 ordering questions are answered; its SS2 method was revised (per-tier geometric-mean anchoring does not work — see the current-state SS4). |
| [briefs/tier-by-tier-monster-balance-handoff-2026-08-13.md](briefs/tier-by-tier-monster-balance-handoff-2026-08-13.md) | Fresh-session roadmap and locked decisions for collaborative tier-by-tier monster authoring and Balance Lab instrumentation. |
| [briefs/biome-visual-pass-handoff-2026-08-16.md](briefs/biome-visual-pass-handoff-2026-08-16.md) | HISTORICAL now the pass is closed, but still the best reference for **traps 1–22** (the mistakes that cost time: paint-path splits, edgeJitter eating thin shapes, clumpy seeded rng, blend modes that silently no-op) and the test-subset timings. Read before touching biome visuals or ground rendering. |
| [briefs/biome-visual-pass-handoff-2026-08-14.md](briefs/biome-visual-pass-handoff-2026-08-14.md) | Earlier brief for the node resize + biome visual pass, superseded by the 08-16 one but still the reference for the tint/decor/trail/pool systems and traps 1–8. |
| [briefs/d3-t5-t6.md](briefs/d3-t5-t6.md) | Self-contained brief for an external design session on tiers 5–6. Not yet fulfilled. |

## Reference

| Doc | Job |
|---|---|
| [release-flow.md](release-flow.md) | Branch model and Railway deployment configuration. |
| [map-variety-regions-atlas.md](map-variety-regions-atlas.md) | Human-readable view of the runtime map. Canonical coordinates live in `shared/src/world/map/`. |
| [ui-redesign-baseline/](ui-redesign-baseline/) | Pre-redesign HUD screenshots + capture matrix. |

## design_docs/

Design authority and pinned session context. `visual_and_aesthetics_design/`
holds the art bibles, the overhaul roadmap, and the icon-generation workflows.

| Doc | Job |
|---|---|
| [architecture.md](../design_docs/architecture.md) | Standing structural reference for the codebase. |
| [design-bible.md](../design_docs/design-bible.md) | Core invariants. Paste at the top of a design session. |
| [game-overview.md](../design_docs/game-overview.md) | What the game is and how it plays today. |
| [economy-philosophy.md](../design_docs/economy-philosophy.md) | Reasoning behind XP / essence / crafting cost. |
| [player-power-curve.md](../design_docs/player-power-curve.md) | Target power bands T0–T4. Pair with the generated `reports/` packets. |
| [boss-design.md](../design_docs/boss-design.md) | Boss philosophy and per-tier layer curve. |
| [t5-t8-endgame-suggestions.md](../design_docs/t5-t8-endgame-suggestions.md) | Proposals for the back half. Not canon. |
| [CORE_T4_CAST.md](../design_docs/CORE_T4_CAST.md) | T4 core cast — design draft, not implemented. |
| [ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md](../design_docs/ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md) | The T1–T4 ability roster, biome placement and authored per-tier ranks. **Implemented** — live state in `docs/abilities-current-state.md`. |

Generated balance packets (`reports/dps-*`, `ehp-*`, `mob-*`,
`*-mechanics-packet.md`) are build output of `pnpm dps:report` / `ehp:report` /
`mob:report`, not authored docs — regenerate rather than edit.
