# DOC-1 report

**Agent:** Grok   **Branch:** rw/doc-1   **Last commit:** `591dd0cf` (this report is committed on top of it)

Commits, in order: `221bd142` archive the removed-system docs · `e5a37fba` retire the class-route bot docs · `591dd0cf` living docs no longer describe those systems as present.

The branch was cut at `45362460`. `rework/class-first` has since moved (`21f28790`: D3, class gear, F6, ICONS-2B, and the overnight status notes). This branch was not merged or rebased onto that tip. `git diff 45362460` is markdown only. `git diff rework/class-first` is not, because it also contains that later work.

## Done

### Archived (15)

Header on the first line, links inside the moved file retargeted. Bible link from `docs/archive/` is `../../design_docs/class-first-bible.md`; from `design_docs/archive/` it is `../class-first-bible.md`.

- `docs/archive/lineages-current-state.md` — D1
- `docs/archive/relics-current-state.md` — F5
- `docs/archive/cores-current-state.md` — D2
- `docs/archive/core-rework-design-balance-handoff.md` — D2
- `docs/archive/stances-current-state.md` — D2
- `docs/archive/stances-authoring-guide.md` — D2
- `docs/archive/stances-future-design-notes.md` — D2
- `docs/archive/rites-current-state.md` — D2
- `docs/archive/rites-authoring-guide.md` — D2
- `design_docs/archive/CORE_DESIGN_PHILOSOPHY.md` — bible §4
- `design_docs/archive/CORE_T4_CAST.md` — bible §4
- `design_docs/archive/CORE_CAST_REVIEW_DRAFT.md` — bible §4
- `design_docs/archive/relics-design.md` — bible §4
- `docs/archive/t2-bot-testing-infrastructure.md` — D5. Most of it is the removed class and campaign routes.
- `docs/archive/bot-harness-capability-audit.md` — D5. Same reason.

### Bot docs kept and cut

- `docs/bot-experiment-runner-current-state.md` — only `smoke-t1` is registered. Unknown flags the runner can still forward are named. Canonical mode still refuses synthetic `--tierEntry`. A route that declares `progressionEntry` still reads one `--tierEntrySnapshot`. `lib.mjs` still requires a snapshot for an id containing `-t2`, and no such route exists.
- `docs/bot-experience-command-center.md` — same route fact. The two checked-in examples still name retired routes; the doc says a launch will not run until class routes return. `experiment:plan` checks JSON shape only.

### Living docs

Each current-state page that changed has one class-first line under the title. Removed systems are described as removed. The relic slot still holds the class boss trophy. `rune:setLoadout` stays.

- `docs/README.md` — archived docs moved to the removed-systems list; dropped from the current-state and design-authority lists.
- `docs/system-rework-status.md` — lineages, shards, ability nodes, gear evolution, cores, relic items, stances, and rites marked removed. Abilities and charms stay.
- `docs/system-rework-roadmap.md` — same rows. Catalyst wallet marked removed. The node-modifier link now points at the archive.
- `CLAUDE.md` — socket highlights add `class:configResult` and `class:setConfig`. `rune:setLoadout` kept. Nothing else changed.
- `docs/variants-current-state.md` — families and blends stay; shard payment, capstones, and `drops` are gone.
- `docs/rune-system-current-state.md` — loadouts remain; no Runic Point budget, forge, or stance channel.
- `docs/guided-tutorial-current-state.md` — the live route is the opening plus the seal route. Weapon-page tables are labeled pre-rework.
- `docs/map-crafting-panels-current-state.md` — Make rail is weapon, armor, recovery, mobility, relic, technique. No evolve or reconstruct check.
- `docs/gameplay-telemetry-current-state.md` — decision actions match the handlers. No lineage payload, stance, rite, or catalyst wallet.
- `docs/recovery-current-state.md` — `core.recovery-mult`, Recuperating Stance, and the reconstruction queue heal are gone. Squire's `defense.recovery-active-pct` remains (`cooldown-root`).
- `docs/global-mastery-current-state.md` — Global Mastery does not size a rune budget. `getMaxUpgrade` returns 0. The +1..+5 helper is labeled historical.
- `docs/combat-animation-current-state.md` — lineage payload FX and ability-node flavor FX are gone. `fx/abilityRank.ts` remains.
- `docs/progression-rework-plan.md` — the trees this index called shipped are gone. Families, blends, frames, and recovery remain.
- `docs/future-plans.md` — lineage parking lot and relic-item plans marked removed. The old ability-node bullets stay under a "not a plan to build" header.
- `docs/balance-lab-current-state.md` — the next farm-bench slice no longer names a catalyst wallet.
- `docs/balance/t1-numerical-balance-packet-2026-08-27.md` — the RP table is the 2026-08-27 catalog. Summoner reconstruction cost in the observations is the live minion payment.
- `docs/biome-ecology-current-state.md` — risen mobs do not zero a catalyst wallet. Combat stances are not a damage layer.
- `docs/map-variety-plan.md` — stance, rite, and reconstruct catalyst sinks are not live costs. Modifier links point at the archive. Region layout stays.
- `docs/named-progression-checkpoints.md` — checkpoints store essence, abilities, and rune loadout. The volcano demonstration routes are not in the registry.
- `docs/tier-balance-current-state.md` — Defensive, Offensive, and Berserker numbers are a past measurement.
- `docs/ui-redesign-plan.md` — one note: stance, rite, catalyst, rune-recipe, and evolve surfaces in this plan were removed. The 2026-07 log is unchanged.
- `design_docs/architecture.md` — stance, rite, and core how-tos removed. Catalyst wallet called gone. The tick listing dropped `updateStanceSwitch`. The rest of that listing was not refreshed.
- `design_docs/game-overview.md` — five slots, no core, no stance or rite, no gear evolution. Global Mastery does not size a rune budget.
- `design_docs/economy-philosophy.md` — shard, capstone, and +N ladder sentences labeled retired. No new costs.
- `design_docs/t5-t8-endgame-suggestions.md` — relic-item depth and the +3 fork labeled as removed assumptions. Not a trophy design. Graveyard and Execute lineages left (monster lines).
- `design_docs/visual_and_aesthetics_design/item-aesthetic-bible.md` — §13 and §14 marked pre-rework. No trophy art invented.
- `design_docs/visual_and_aesthetics_design/item-icon-generation-plan.md` — cores and crafted relics are excluded because they are gone.
- `design_docs/visual_and_aesthetics_design/openai-icon-generation.md` — stance dropped from the icon prompt and the size table. Frame "lineage" left (art series).

## Checks

- `pnpm typecheck`: clean, before `591dd0cf` and again before this report (exit 0). No `pnpm install`.
- `pnpm test`: not run. The brief does not ask for the suite.
- Every `](...)` link in the files this commit touched resolves. No CR bytes. `git diff --numstat` against the parent is a partial edit on each file, not a whole-file rewrite.
- `git diff --name-only 45362460` is markdown only.

## Not done, or unsure

Left on purpose. The brief says these files belong to other tasks:

- `docs/abilities-current-state.md` line 872 still names `` `lineages-current-state.md` `` §7 in backticks (not a markdown link).
- `docs/runic-attunement-current-state.md` still says Runic Points reserve abilities, stances, and rites.
- `docs/frames-current-state.md`, `docs/barrier-ward-current-state.md`, `docs/conduit-current-state.md` not edited.
- `design_docs/class-first-bible.md`, `design_docs/design-bible.md` (line 92 links `../docs/lineages-current-state.md`), `design_docs/progression-rework-design.md`, the `T1_ITEM_*.md` files, and `design_docs/ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md` not edited.
- `docs/briefs/**` not edited. Stale links: `bot-balance-campaign-state.md` → `bot-harness-capability-audit.md`; `course-correction-report-2026-10-03.md` and `verbs-that-fire-report-2026-10-03.md` → `lineages-current-state.md`; `rework-audit-2026-10-13.md` → `relics-current-state.md`.

Keyword hits reviewed and left because they are not the removed system:

- Boss and monster lineage: `docs/boss-encounter-rework-current-state.md`, `docs/boss-encounter-redesign-implementation-plan-2026-09-04.md`, `docs/monster-combat-rework-current-state.md`, `design_docs/boss-lineage-redesign.md`, `design_docs/boss-design.md`, `design_docs/BOSS_ENCOUNTER_REWORK_HANDOFF_T1_T4_2026-08-23.md`, `design_docs/MONSTER_COMBAT_REWORK_HANDOFF_T1_T4_2026-08-22.md` (including "one stronger heavy shard" as a projectile), `docs/future-plans.md` gorilla lineage and the boss-lineage review note.
- `docs/t1-item-rework-current-state.md` uses lineage for item series that still exist (Chaotic Axe and the rest).
- Stance as a pose or a monster posture: `docs/player-sprites-current-state.md`, `design_docs/visual_and_aesthetics_design/player-visual-identity-bible.md`, `design_docs/visual_and_aesthetics_design/sprite-batch-methodology.md`, `docs/monster-behavior-current-state.md`.
- `docs/landing-cinematic-current-state.md` matched `score.`. `docs/ui-redesign-baseline/matrix.md` uses reconstruct for rebuilding the matrix. `docs/terrain-variance-plan.md` "rock shards" is scenery. `docs/dot-systems-current-state.md` line 514 is summoner reconstruction payment (still in `shared/src/data/summoner.ts`); line 528 is the verb "reconstructing". `CLAUDE.md` "half the cores" is CPU count. The chaotic-axe miss sentence was left.
- `docs/combat-animation-current-state.md` still says "boss-lineage grammar" and "shards burst" on summon shatter. `docs/variants-current-state.md` still says Caprine lineage for `avalanche-tyrant`. `docs/map-variety-plan.md` "biome lineage" means place. `docs/README.md` index blurbs for the completed lineage-UI briefs were left as descriptions of those briefs.
- `design_docs/architecture.md` tick block is still behind `World.tick` (wards, casts, ground zones, and others). Only the removed stance call was cut.
- `docs/guided-tutorial-current-state.md` weapon-page tables and validation records were labeled pre-rework rather than rewritten line by line. `docs/ui-redesign-plan.md` body still records the 2026-07 stance and rite UI; the new top note says those surfaces are gone.
- `docs/named-progression-checkpoints.md` still documents summoner reconstruction reset. That queue is live. The PowerShell blocks remain the 2026-09 record; they are not a runnable study (`smoke-t1` is the only registered route).

## Files outside the brief I needed (not edited)

- `scripts/experiment/examples/affordable-upgrades.json` still names route `striker-t1`.
- `scripts/experiment/examples/boss-preparation.json` still names route `striker-decisions-t1`.
- `scripts/experiment/lib.mjs` still requires a snapshot when a route id contains `-t2`.
- `scripts/experiment/experience.test.mjs` and `scripts/experiment/experiment.test.mjs` still use retired striker route ids as fixtures.
