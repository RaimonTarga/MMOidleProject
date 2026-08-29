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
| T1 numerical balance packet | [balance/t1-numerical-balance-packet-2026-08-27.md](balance/t1-numerical-balance-packet-2026-08-27.md) | — |
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
| [headless-bot-harness-plan.md](headless-bot-harness-plan.md) | **Open plan — the headless progression bot harness (W5d, the parked agent harness minus the LLM).** Stage A audit + Stage B build done 2026-08-25; live `bot/` package with a Striker T1 route (usage: [bot/README.md](../bot/README.md)). Records that no new gameplay protocol is needed (every route primitive maps to a shipped intent), that `NETWORKED_PLAYER_KEYS` already *is* the observable-information boundary, and that `world:events` already carries the whole death trace. Six traps: guest auth rate-limits to 5 accounts/hour so bots use `AUTH_DEV_BYPASS`; the live server has NO time scaling; `tools/` is not typechecked so the harness is its own workspace package; the lobby emits `character:*Result` BEFORE clearing its mutation guard (fatal to any client acting at machine speed); `composePlayerView` needs all six player slices or returns null; and craft/upgrade spend cannot be a wallet diff because the wallet only moves on the next 5 Hz delta. |
| [../reports/bot-route-reference.md](../reports/bot-route-reference.md) | **GENERATED (`pnpm bot:reference`) — the route-authoring knowledge packet.** Self-contained: gating rules, all six class roots with affinities, the world-map shape + T1 node/modifier table, every T1 monster stat block, the T0/T1 gear catalogue with +5 cost totals, T1 abilities, the full rune condition/action tables with starter-vs-recipe flags, and the route DSL with the designer's Striker baseline as a worked example. Regenerate rather than edit. |
| [ui-redesign-plan.md](ui-redesign-plan.md) | Phased desktop HUD redesign with review gates; Part III (apparatus wave) still ahead. |
| [map-variety-plan.md](map-variety-plan.md) | Design authority for the world map (layout, regions, catalyst economy). Both stages shipped. Its node-modifier sections (§1.2 pace families, §1.6 density overlay) were superseded 2026-08-21 — live modifier behavior is in [node-modifiers-current-state.md](node-modifiers-current-state.md). |
| [terrain-variance-plan.md](terrain-variance-plan.md) | **Living record of the biome visual pass (CLOSED 2026-08-17).** SS8-9 are the levers and the per-biome log — every biome's generators, measured numbers and open dials. S10 records what was deferred. SS1-7 are an earlier, PARKED gameplay-terrain plan; do not start on those. |
| [briefs/T1_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-28.md](briefs/T1_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-28.md) | **IMPLEMENTED 2026-08-28 — the T1 progression/economy rebalance, and the authoritative "what shipped" record.** Full before→after cost table for all 20 T1 gear items, the ability/Rune unlock+cost table, final catalyst assignments (+5 only, 9 items), the `wait-for-regen`/Recover-First legality finding (it's a starter rune since a 2026-08-25 call — the recipe is a no-op), the T1 node-modifier accessibility check for all four catalyst families used, and the one real bug found (Sweep's route gear-plan crafted the L3 charm before the ability's own new L2 gate, fixed in `t1GearPlans.ts`). Supersedes the proposal below on any figure the two disagree on. |
| [briefs/T1_PROGRESSION_ECONOMY_PROPOSAL_2026-08-28.md](briefs/T1_PROGRESSION_ECONOMY_PROPOSAL_2026-08-28.md) | Design proposal preceding the implementation above; kept for its philosophy/rationale writeup. The designer corrected several of its numbers before implementation (mandatory-tool costs were still too high, catalyst structure was `+4:1/+5:2` not `+4:0/+5:1`, most item totals had to be preserved rather than reshaped-and-shrunk) — read the implementation ledger for what actually shipped. |
| [briefs/T1_PROGRESSION_ECONOMY_BASELINE_2026-08-28.md](briefs/T1_PROGRESSION_ECONOMY_BASELINE_2026-08-28.md) | Source-of-truth audit of the pre-rebalance T1 economy (live-code figures, not the changed ones above) — the factual grounding for the proposal and implementation. |
| [briefs/bot-t1-testing-handover-2026-08-26.md](briefs/bot-t1-testing-handover-2026-08-26.md) | **Open brief — headless bot T1 route testing.** Six baselines + 4 experiment variants + 6 survivability-focused "v2" routes authored and validated; a chain of real bugs found and fixed along the way (nearest-node pathing, two stuck-boss-loop races, an ackDeath crash that killed whole batches, a server bug where dying mid-upgrade silently hung the client, and a rune bug where `fire-guard` was suppressing Second Wind's/Cleanse's own built-in triggers all session). Three open findings not yet acted on: an upgrade-rejection retry bug, a 235-death Mountain anomaly on `squire-v2-t1`, and an unconfirmed Granite Barrier regression signal. Exact run commands and file map included. |
| [biome-refactor-playtest.md](biome-refactor-playtest.md) | Open playtest notes and unanswered questions from the per-biome T1 dungeon pass. |
| [briefs/SONNET_BALANCE_ITERATION_HANDOFF_2026-08-23.md](briefs/SONNET_BALANCE_ITERATION_HANDOFF_2026-08-23.md) | **Open brief — the operating manual for the iterating balance agent.** What is safe to change and what must be escalated, the command set, how to read the mob report's progression walk, the eight traps, and the hard rule that no tuning starts before D1/D2 land. Start here before touching a number. |
| [briefs/BALANCE_ITERATION_PROGRESS_REPORT_2026-08-24.md](briefs/BALANCE_ITERATION_PROGRESS_REPORT_2026-08-24.md) | Superseded by the final ledger below for anything the two disagree on; kept for the death-trace methodology writeup and the full narrative. |
| [briefs/BALANCE_ITERATION_FINAL_LEDGER_2026-08-24.md](briefs/BALANCE_ITERATION_FINAL_LEDGER_2026-08-24.md) | **Open brief — the closing state of the T1-T4 numerical pass.** Autonomous sweep stopped on request. Separates T1 provisional changes, 11 verified T2-T4 monster ordinary-attack cuts, 4 charm buffs that were tried and fully reverted (disproven hypothesis — real cause was monster numbers, not item magnitude), unresolved Apprentice/Conduit class issues, and every item still needing manual playtest. Records a locked-invariant test collision (`desertPairs.test.ts`) that forced one fix (Sunshield Scarab) to land weaker than its trace-verified value. `pnpm test`: 94/94. Nothing committed. |
| [briefs/BALANCE_TOOL_AUDIT_HANDOFF_2026-08-23.md](briefs/BALANCE_TOOL_AUDIT_HANDOFF_2026-08-23.md) | **Open brief — the entry point for the numerical balance phase.** Source-verified audit for the balance-roadmap planner: instrument verdict table (KEEP/REPAIR/NARROW/RETIRE/NON-BALANCE), 6 confirmed bugs + 6 rejected suspicions, the authoritative combat formula map, current progression structure, a 12-row representative build matrix, measurement gaps with worth-doing-now calls, 12 validation fixtures, and 8 genuine designer decisions. |
| [briefs/balance-instrument-inventory-2026-08-23.md](briefs/balance-instrument-inventory-2026-08-23.md) | **Open brief.** Predecessor to the audit above — Reference sheet for the sweeping monster/boss/item/class balance patch: every balance instrument we have, what each measures, what it refuses to measure, the seven known traps (`--mode boss` never fights a boss; time-scale ceiling of 2; `damageTaken` under-reports), coverage against the four subjects, and the six gaps nothing currently measures. Its S10 is the readiness audit (2026-08-23): `monster:ref` was broken and is fixed; the eHP report claims three DR ramps it does not implement; `mob:report` is blind to charged attacks on 35% of the roster; the analytical reports model no core/relic/rune/rite/stance; and the T1 boss exam reads 0/150. |
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
