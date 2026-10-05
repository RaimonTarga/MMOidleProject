# Retired-ladder remnants — 2026-10-05

Task 5 of `sol-mechanical-tasks-2026-10-05.md`. Started clean on
`feat/vf-tutorial`, then created `chore/ladder-remnants` from `develop`
`20b34088a9d495e15fd7519ddf70a57d7362c042` in `../mmo-lin-w1d2`.
Read `CLAUDE.md` fully. Every command used this explicit worktree directory;
desktop title-bar verification was unavailable through the enabled tools.

## Result and scope

Removed four exported helpers with zero callers/importers, two configuration
properties read only by those helpers, four unused catalyst CSS selectors, and
comments that described the retired ladder/catalyst economy as a current action.
No authored stats, costs, forms, protocol declarations, handlers, save fields,
refunds, or tests changed. No files in the four protected trees changed.
Historical source annotations that explain numerical values remain, as do past
release-note pages and all documentation hits. No install, push, or merge.

One commit each for the shared, server and client packages; the client commit
also contains this final report. Shared: `7f0c2a27`; server: `0a97508c`.
No admin/tools package changes were justified.

## Classification and removals

Line numbers below refer to the complete baseline inventory, before deletions.
Where a file contains mixed hits, this table overrides its retained-file default
in the inventory. Removal of a selector includes its associated nested styles
even when those nested selectors do not themselves match a search term.

| Baseline file:line | Class | Action and evidence |
|---|---|---|
| `shared/src/systems/evolution.ts:25-27,30-33` | dead code | Removed `requiredPlusFor` and `isEvolvedRecipe`. Exact identifier searches outside this file found zero imports/calls, including tests. The barrel's `export *` alone is not a reader. |
| `shared/src/config/gameConfig.ts:239-250,291-298` | dead code | Removed `CATALYST_PROGRESS_PER_UNIT`, `CATALYST_PROGRESS_REWARD_MULT_BY_TIER`, `catalystProgressPerUnit`, and `catalystProgressRewardMult`. The properties were read only by those exported helpers; the helpers had zero identifier readers. A historical fixture field named `catalystProgressPerUnitT1` is a different identifier and remains. |
| `shared/src/config/gameConfig.ts:218,303` | dead copy | Removed claims about current catalyst payouts/progress from XP and debug-reward comments. Essence and XP configuration unchanged. |
| `shared/src/protocol/socketEvents.ts:191-192,291-295` | dead copy | Removed current catalyst-progress and consume-predecessor/apply-upgrade comments. All protocol events, payloads and results retained. |
| `shared/src/data/recipes/types.ts:91-93,98-100` | dead copy | Removed claims that `evolvesFrom` makes an item craftable by consuming a predecessor and that reconstruction is an available path. Both fields and the branch relationship remain. |
| `shared/src/data/recipes/forest.recipes.ts:30-31,110,113-115,134-136` | dead copy | Removed obsolete +3 predecessor/reconstruction/catalyst action instructions. Recipe values and the weapon form graph unchanged. Dated numerical calibration records elsewhere remain. |
| `shared/src/data/recipes/plains.recipes.ts:193-196` | dead copy | Removed the obsolete instruction that cores gain power by evolving instead of upgrading. No core recipe or effect changed. |
| `shared/src/data/recipes/clearing.recipes.ts:6-7` | dead copy | Removed the claim that an empty upgrade array alone distinguishes tutorial equipment or causes crafting to refuse it. Kept the fixed-power heading. |
| `client/src/hud/essence.css:9,33-38,50-52,83-95,123-131` | dead code / dead copy | Removed `.catalyst-icon`, `.essence-progress`, `.essence-progress__meter`, `.essence-progress__value` and obsolete catalyst-wallet/progress comments. Selector search across client/admin/tools found no readers outside these definitions. `MaterialsPanel.tsx:21,77-87,157-205` renders essences, shards and capstones with other classes. |
| `client/src/ui/crafting.css:115-116,1631-1633` | dead copy | Removed obsolete catalyst-wallet and unshipped-slot evolve guidance. CSS declarations unchanged. |
| `server/src/world/World.ts:263` | dead copy | Removed catalyst progress from the reward-multiplier comment. Runtime property unchanged. |
| `server/src/admin/gameActions.ts:516` | dead copy | Removed catalyst credit from the dev despawn comment. Despawn implementation unchanged. |

## Listed and retained

| Source / representative baseline file:line | Class | Reader or reason to retain |
|---|---|---|
| `shared/src/protocol/socketEvents.ts:144,294,296`; `server/src/net/playerHandlers.ts:468-477,591-605` | live | Both handlers remain registered and emit refusal results. The current visual client has no upgrade/evolve emit, but `bot/src/net/intents.ts:116-124` sends both requests and awaits results. The protocol pair therefore fails the brief's both-sides-dead removal condition. |
| `server/src/systems/player/economy/itemEvolution.ts:20-27`; `itemUpgrade.ts:21-26` | live | Imported by the socket handlers and directly asserted by `server/test/slotRetirement.test.ts:141-175`. These paths refuse with no spend or item movement; removal would break an exercised compatibility response. |
| `shared/src/systems/evolution.ts:22,29,35-62` | live | `EVOLUTION_REQUIRED_PLUS` is read by protected `bot/src/routes/t2Acquisition.ts:75,83` and `bot/src/tools/t2Reachability.ts:36-43`. `EvolveMode` is imported by protocol, server and bot callers. Both checks and the refusal reason are tested. Historical retirement explanation retained. |
| `shared/src/systems/itemUpgrades.ts:22-206` | live | `globalMasteryRequiredForUpgrade` / `MAX_UPGRADE` price lineage gates in protected `shared/src/data/lineages/magnitudes.ts:23,777-782`. Cost/ceiling helpers have bot, bench and economy-test readers; total-effect helpers have DPS/EHP tool readers. `shared/src/systems/stats.ts:209` calls `effectiveAttacksPerSecond(weapon, 0)`. These readers do not re-enable the ladder. |
| `server/src/db/playerRepo.ts:483-512,571-572,610-613,640,651-659,801`; refund modules | live | Hydration sanitizes, migrates, refunds and clears stale save levels. Migration SQL and journal are recorded database history. Deleting a persisted field/refund would change returning-player behavior. |
| `shared/src/components/core/networkedSlices.ts:357,439`; protocol views/snapshots; `client/src/hud/atoms.ts:222,909,1037`; `client/src/ui/inventory/StatSheet.tsx:11,31,52-54` | live | The compatibility field is serialized, observed and passed into equipment preview. `equipmentPreview.ts:41` constructs an inventory slice with it; this is an actual reader even though stat rebuild ignores stale levels. |
| Recipe `evolvesFrom`, `reconstructCost`, `upgrades` and historical numerical notes | live / historical source evidence | `shared/src/itemDatabase.ts:27` copies the weapon form predecessor. `weaponCurve.test.ts:107-110` asserts predecessor strength; bot acquisition/reference and bench paths read legacy shape/cost data. Dated economy/normalization comments explain authored values and the full-power fold, rather than advertise a current UI action. Kept verbatim unless a direct obsolete action instruction is itemized above. |
| `shared/src/data/recipes/volcanic.recipes.ts:171-183`, icons and skill-tree core entries | live | Catalyst Core is an equipped core with an active combat effect, not the retired catalyst currency. Retained its name, ID, icon and effect. |
| Monster/ability descriptions containing `evolved`/`evolution`; e.g. `shared/src/data/monsters/swamp.monsters.ts:180-226` | live | Describes monster-family evolution or mechanics, not equipment evolution. The monster database consumes those definitions. |
| Numeric `+5` matches, `revolver`/`revolution` substrings, lockfile version strings, Rust formatting | live / benign search collision | The broad case-insensitive search matches unrelated strings and numerical deltas, e.g. Cave boss hazard +5% damage and histogram numeric formatting. None is evidence of the retired equipment ladder. |
| Tests and JSON fixtures in the inventory | live | Assertions exercise retirement, refund, GM, equipment, routes or historical experiment/report behavior. Fixed historical telemetry/manifests are retained evidence. `server/runs/**` is recorded experiment evidence, not current game copy. |
| `shared/src/data/lineages/**`, `shared/src/tutorial/**`, `server/src/systems/combat/**`, `bot/src/routes/**` | live / protected list only | Every baseline matching line is listed below. The task explicitly forbids edits here, including stale route prose. |
| `docs/**`, `design_docs/**`, repository/package Markdown, `updates/v0.5/changelog.md`, `updates/v0.6/changelog.md`, `updates/v0.6.1/changelog.md` | docs | Listed only. Task 4 owns folding; past release-note pages stay as history. No rewrite or archive performed here. |

## Method and validation

The baseline used `rg --json -n -i` over the explicit `.` path with this regex:
`itemUpgrades|upgradeLevel|upgradeCostFor|upgradeItem|inventory:upgradeItem|upgradeResult|evolve|evolution|catalyst|\+5|plus5`.
Excluded `docs/archive/**`, `design_docs/archive/**`, `reports/**`, `art/**` and
this newly-created report (to avoid recursively counting the audit). Standard rg
ignore behavior also excludes generated dependencies/build products. Aggregated
each JSON match's path, line and submatch count into the complete inventory below.
Exact identifier and selector searches were then made across source, scripts,
tools and tests; call sites and handler emits above were inspected before removal.

No test filename contains any of the four removed helper identifiers. Added
`gameConfig` and `equippedEvolutionAbilityTags` to the required substring suite,
and `slotRetirement` to verify the preserved refusal contracts. The report records
the final checks below before package commits. Validation is focused, not a full
runtime-suite result.

TypeScript AST printing with comments removed confirmed identical executable
code for the recipe, protocol and server comment-only files. Removed declarations
are confined to the zero-reader helpers/properties above. Active client CSS
declarations outside the unused selectors are unchanged. All touched files are
LF-only, with one trailing newline; staged whitespace checks precede each commit.

Final grep reconciliation: **6,265 occurrences in 780 files** after cleanup,
plus **55 removed occurrences** = the **6,320** baseline occurrences. The complete
baseline appendix contains **784 file rows**. The difference includes dead-copy
comments; occurrence counts are not a count of removed functions.

| Package commit | Required test sequence immediately before commit | Typecheck |
|---|---|---|
| Shared `7f0c2a27` | `pnpm test -- lineage item recipe crafting durability gameConfig equippedEvolutionAbilityTags slotRetirement`: **64/64 passed in 52s** | passed, workspace + bench + test |
| Server `0a97508c` | Same 64-file suite: **64/64 passed in 63s** | passed, workspace + bench + test |
| Client + report | Same 64-file suite: **64/64 passed in 58s** | passed, workspace + bench + test |

An earlier 63-file run (before adding `slotRetirement` and the last two comment
corrections) also passed 63/63 in 62s; the final shared receipt above supersedes it.

## Complete baseline hit inventory

Source develop 20b34088. 6320 case-insensitive symbol occurrences in 784 files. Numbers identify every matching source line at baseline, before removal. Historical data is documentation/evidence, preserved. Protected code is list only. Retained source rows include contextual/historical comments and benign word collisions, with detailed exceptions in the classification table.

| File | Matching baseline lines | Classification / disposition | Occurrences |
|---|---|---|---|
| `bot/README.md` | 95, 174, 176-177, 184, 196-197, 201-203 | docs | 13 |
| `bot/ROUTE-AUTHORING.md` | 89, 99, 182 | docs | 3 |
| `bot/src/batch.ts` | 37, 444 | live / retained; exceptions itemized above | 4 |
| `bot/src/botRun.ts` | 14, 366, 508, 595, 773, 1095, 1124, 1127-1128 | live / retained; exceptions itemized above | 14 |
| `bot/src/harness.test.ts` | 274-275, 308, 876-877, 883, 885, 894-895, 897 | live / retained; exceptions itemized above | 12 |
| `bot/src/net/intents.ts` | 6, 116, 118, 122-124 | live / retained; exceptions itemized above | 7 |
| `bot/src/reference.ts` | 27, 91, 100, 203, 249, 270, 278, 414, 453, 457 | live / retained; exceptions itemized above | 10 |
| `bot/src/route/conditions.ts` | 15, 78-79, 147, 280, 385 | live / retained; exceptions itemized above | 7 |
| `bot/src/route/executor.ts` | 33, 365-366, 692, 694, 799, 1105, 1108, 1203, 1216, 1218, 1235, 1239, 1242, 1463, 2159-2160, 2170-2171, 2175, 2179, 2187, 2510, 2716 | live / retained; exceptions itemized above | 25 |
| `bot/src/route/readiness.semantic.test.ts` | 58 | live / retained; exceptions itemized above | 1 |
| `bot/src/route/types.ts` | 1, 51, 86-87, 96, 99, 101 | live / retained; exceptions itemized above | 11 |
| `bot/src/routes/campaignBoss.ts` | 56, 72, 90 | live / protected; list only | 3 |
| `bot/src/routes/campaignOvernight.ts` | 13, 48, 67 | live / protected; list only | 3 |
| `bot/src/routes/campaignT2Boss.test.ts` | 150, 154-155, 182 | live / protected; list only | 5 |
| `bot/src/routes/campaignT2Boss.ts` | 51 | live / protected; list only | 1 |
| `bot/src/routes/campaignT2Expansion.ts` | 6, 31 | live / protected; list only | 2 |
| `bot/src/routes/campaignT2V1k.ts` | 27 | live / protected; list only | 1 |
| `bot/src/routes/campaignT3V1p.ts` | 19 | live / protected; list only | 1 |
| `bot/src/routes/campaignT3V1u.ts` | 29, 31, 33 | live / protected; list only | 6 |
| `bot/src/routes/campaignT4V1y.ts` | 13, 16, 32 | live / protected; list only | 5 |
| `bot/src/routes/squireHeavyHammerT1.ts` | 28 | live / protected; list only | 1 |
| `bot/src/routes/t1Common.ts` | 19, 204 | live / protected; list only | 2 |
| `bot/src/routes/t1EconomyCompatibility.test.ts` | 9, 74, 136, 146 | live / protected; list only | 4 |
| `bot/src/routes/t2Acquisition.ts` | 2, 15, 17-18, 20, 27, 29, 33-34, 44, 64, 69, 75, 78, 83, 86, 89, 99, 108, 135, 139, 141, 143, 146, 156, 160, 163, 165, 167, 174 | live / protected; list only | 33 |
| `bot/src/routes/t2Common.ts` | 51 | live / protected; list only | 1 |
| `bot/src/routes/t2RouteBuilder.ts` | 150, 364-365, 396 | live / protected; list only | 4 |
| `bot/src/routes/t2Routes.semantic.test.ts` | 2, 116, 130, 132-133, 193 | live / protected; list only | 9 |
| `bot/src/state/observation.ts` | 12, 16, 141, 158-159, 171, 175, 181, 205, 209 | live / retained; exceptions itemized above | 14 |
| `bot/src/telemetry/bossTimeline.test.ts` | 46 | live / retained; exceptions itemized above | 1 |
| `bot/src/telemetry/economyInstrumentation.test.ts` | 21, 23, 35-36, 47, 58, 130, 134 | live / retained; exceptions itemized above | 8 |
| `bot/src/telemetry/events.ts` | 49-50, 55-56, 173, 412, 415, 434-436, 456 | live / retained; exceptions itemized above | 11 |
| `bot/src/telemetry/experience.test.ts` | 9 | live / retained; exceptions itemized above | 1 |
| `bot/src/telemetry/formationAttrition.test.ts` | 23 | live / retained; exceptions itemized above | 1 |
| `bot/src/telemetry/productiveActivity.test.ts` | 46, 131, 134 | live / retained; exceptions itemized above | 3 |
| `bot/src/telemetry/recorder.ts` | 70, 105, 223, 405, 502, 517 | live / retained; exceptions itemized above | 9 |
| `bot/src/telemetry/requiredTelemetry.test.ts` | 128, 174, 176 | live / retained; exceptions itemized above | 3 |
| `bot/src/telemetry/summary.ts` | 257, 260, 372, 657, 686 | live / retained; exceptions itemized above | 6 |
| `bot/src/telemetry/t1Snapshots.test.ts` | 73, 152, 155, 213, 240, 244 | live / retained; exceptions itemized above | 9 |
| `bot/src/telemetry/t1Snapshots.ts` | 87 | live / retained; exceptions itemized above | 2 |
| `bot/src/tierEntry/economy.ts` | 27-28, 30, 36-37, 52, 83, 92, 105 | live / retained; exceptions itemized above | 10 |
| `bot/src/tierEntry/laneProfiles.test.ts` | 272 | live / retained; exceptions itemized above | 1 |
| `bot/src/tierEntry/profiles.ts` | 103, 158, 470-471, 474-475, 491, 511-512, 526, 844-847, 856 | live / retained; exceptions itemized above | 17 |
| `bot/src/tierEntry/snapshotDir.ts` | 21 | live / retained; exceptions itemized above | 1 |
| `bot/src/tierEntry/validate.ts` | 179, 197-198, 377-378 | live / retained; exceptions itemized above | 6 |
| `bot/src/tools/t1FinalReport.ts` | 22, 38, 47, 94-95, 97, 109, 162, 184, 186, 201-204, 271, 276-278, 285-287, 306, 324, 327, 330, 334-336, 359, 364-366, 373-375 | live / retained; exceptions itemized above | 68 |
| `bot/src/tools/t2Catalogue.ts` | 36 | live / retained; exceptions itemized above | 1 |
| `bot/src/tools/t2Reachability.ts` | 1, 8-9, 27, 29, 34, 36-39, 43 | live / retained; exceptions itemized above | 12 |
| `bot/src/tools/t2Report.ts` | 138 | live / retained; exceptions itemized above | 1 |
| `bot/src/tools/t2ResponseMap.ts` | 196 | live / retained; exceptions itemized above | 1 |
| `bot/src/tools/t2Templates.ts` | 18 | live / retained; exceptions itemized above | 1 |
| `CLAUDE.md` | 249, 260, 270 | docs | 3 |
| `client/public/assets/icons.json` | 4759, 4780, 4801 | live / retained; exceptions itemized above | 3 |
| `client/public/assets/UI_icons.json` | 265, 286, 307, 328, 349, 370 | live / retained; exceptions itemized above | 6 |
| `client/src/fx/bespoke/slinger.ts` | 106, 143 | live / retained; exceptions itemized above | 2 |
| `client/src/fx/detonateWindup.ts` | 49 | live / retained; exceptions itemized above | 1 |
| `client/src/hud/atoms.ts` | 222, 909, 1037 | live / retained; exceptions itemized above | 4 |
| `client/src/hud/essence.css` | 9, 33, 35, 50, 83, 85 | live / retained; exceptions itemized above | 7 |
| `client/src/net/spectatorSnapshot.ts` | 42 | live / retained; exceptions itemized above | 1 |
| `client/src/render/stunOrbit.ts` | 30 | live / retained; exceptions itemized above | 1 |
| `client/src/ui/crafting.css` | 115, 1631-1632 | live / retained; exceptions itemized above | 3 |
| `client/src/ui/crafting/itemDisplay.ts` | 23, 488 | live / retained; exceptions itemized above | 2 |
| `client/src/ui/crafting/MakeTab.tsx` | 382 | live / retained; exceptions itemized above | 1 |
| `client/src/ui/inventory/StatSheet.tsx` | 11, 31, 52, 54 | live / retained; exceptions itemized above | 5 |
| `client/src/ui/lineage/LineageTreePanel.tsx` | 40, 362, 448, 453 | live / retained; exceptions itemized above | 5 |
| `design_docs/ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md` | 531 | docs | 1 |
| `design_docs/architecture.md` | 338, 390, 392, 394, 396-400, 458, 465 | docs | 18 |
| `design_docs/BOSS_ENCOUNTER_REWORK_HANDOFF_T1_T4_2026-08-23.md` | 59, 129, 156, 331, 458, 493 | docs | 6 |
| `design_docs/boss-lineage-redesign.md` | 61, 64, 241 | docs | 3 |
| `design_docs/CORE_CAST_REVIEW_DRAFT.md` | 1, 83, 111, 130, 132, 233 | docs | 6 |
| `design_docs/CORE_DESIGN_PHILOSOPHY.md` | 7, 163, 178, 182, 184, 418 | docs | 6 |
| `design_docs/CORE_T4_CAST.md` | 6, 16-17, 117 | docs | 4 |
| `design_docs/design-bible.md` | 90, 171 | docs | 2 |
| `design_docs/economy-philosophy.md` | 14, 16, 21, 55, 97, 99 | docs | 6 |
| `design_docs/game-overview.md` | 9, 25-26, 29, 39, 41 | docs | 9 |
| `design_docs/MONSTER_COMBAT_REWORK_HANDOFF_T1_T4_2026-08-22.md` | 38, 169, 269, 273, 306, 343, 389, 419, 462, 544, 591, 598, 624, 662, 729, 870, 1015, 1021, 1028, 1034, 1172, 1474, 1502 | docs | 23 |
| `design_docs/progression-rework-design.md` | 47, 56, 98, 210, 222, 391, 394, 594-595, 761, 1114, 1120, 1126, 1212, 1289, 1291 | docs | 19 |
| `design_docs/relics-design.md` | 39-40, 226, 237, 239, 243-244, 247, 256, 262, 288 | docs | 13 |
| `design_docs/summoner-overhaul-design-source.md` | 590 | docs | 1 |
| `design_docs/T1_ITEM_DESIGN_PHILOSOPHY.md` | 6, 25, 84, 95, 105, 111, 113, 429, 505, 617, 619, 634, 880, 886, 905-906, 942 | docs | 18 |
| `design_docs/T1_ITEM_NUMERICAL_BASELINE.md` | 18, 65, 83, 166, 178, 191-192, 196, 201, 244, 249, 272, 277, 282, 318, 323, 348, 359, 363, 401, 413, 425, 439-440, 448, 473-474, 476, 508-509, 513, 539-540, 542, 554, 560, 563-565, 606, 642-643, 684, 722, 756, 776, 779, 809, 828, 849, 879-881, 907, 919, 922, 935, 937, 942, 944, 947-949, 981, 1151, 1156, 1170, 1197 | docs | 80 |
| `design_docs/visual_and_aesthetics_design/item-aesthetic-bible.md` | 293, 320, 936 | docs | 3 |
| `design_docs/visual_and_aesthetics_design/item-icon-generation-plan.md` | 159 | docs | 1 |
| `design_docs/visual_and_aesthetics_design/player-visual-identity-bible.md` | 803, 887 | docs | 2 |
| `design_docs/visual_and_aesthetics_design/world-and-presentation-bible.md` | 28 | docs | 1 |
| `docs/abilities-current-state.md` | 5-6, 447, 738, 742, 786, 793, 812, 814 | docs | 9 |
| `docs/balance-lab-current-state.md` | 68 | docs | 1 |
| `docs/balance/t1-numerical-balance-packet-2026-08-27.md` | 31, 121, 145, 147, 153-154, 161, 163, 165 | docs | 10 |
| `docs/biome-ecology-current-state.md` | 240, 378 | docs | 2 |
| `docs/boss-encounter-redesign-implementation-plan-2026-09-04.md` | 281 | docs | 1 |
| `docs/boss-encounter-rework-current-state.md` | 510 | docs | 1 |
| `docs/bot-experience-command-center.md` | 96 | docs | 1 |
| `docs/briefs/biome-mastery-progression-redesign-2026-09-11.md` | 17, 28, 189, 191, 207, 238 | docs | 6 |
| `docs/briefs/bot-balance-autonomous-night-plan.md` | 58 | docs | 1 |
| `docs/briefs/bot-balance-boss-reference-operator-packet.md` | 69 | docs | 1 |
| `docs/briefs/bot-balance-boss1-operator-packet.md` | 114, 151 | docs | 2 |
| `docs/briefs/bot-balance-boss1-stance-declaration-audit.md` | 70, 94 | docs | 2 |
| `docs/briefs/bot-balance-boss2-operator-packet.md` | 153 | docs | 1 |
| `docs/briefs/bot-balance-boss3-operator-packet.md` | 149 | docs | 1 |
| `docs/briefs/bot-balance-boss4-operator-packet.md` | 207 | docs | 1 |
| `docs/briefs/bot-balance-boss4-report.md` | 443, 445 | docs | 2 |
| `docs/briefs/bot-balance-boss5-operator-packet.md` | 107 | docs | 1 |
| `docs/briefs/bot-balance-campaign-state.md` | 575, 644, 647, 718, 848, 1628, 1816-1817, 1878, 1898, 1914, 1918, 1920, 2126, 2159, 2182-2183, 2187, 2203 | docs | 19 |
| `docs/briefs/bot-balance-durability1-operator-packet.md` | 27, 34-38 | docs | 6 |
| `docs/briefs/bot-balance-durability1-report.md` | 24, 91, 211-213, 428 | docs | 6 |
| `docs/briefs/bot-balance-durability10-operator-packet.md` | 60, 82 | docs | 2 |
| `docs/briefs/bot-balance-durability11-operator-packet.md` | 33 | docs | 1 |
| `docs/briefs/bot-balance-durability12-operator-packet.md` | 47 | docs | 1 |
| `docs/briefs/bot-balance-durability15-operator-packet.md` | 26 | docs | 1 |
| `docs/briefs/bot-balance-durability15-report.md` | 326-327, 330, 333-334, 395 | docs | 6 |
| `docs/briefs/bot-balance-durability16-operator-packet.md` | 37 | docs | 1 |
| `docs/briefs/bot-balance-durability16-report.md` | 26, 295-296 | docs | 3 |
| `docs/briefs/bot-balance-durability17-operator-packet.md` | 39 | docs | 1 |
| `docs/briefs/bot-balance-durability17-report.md` | 72, 146, 349 | docs | 3 |
| `docs/briefs/bot-balance-durability18-operator-packet.md` | 33 | docs | 1 |
| `docs/briefs/bot-balance-durability18-report.md` | 68, 260 | docs | 2 |
| `docs/briefs/bot-balance-durability19-operator-packet.md` | 30 | docs | 1 |
| `docs/briefs/bot-balance-durability19-report.md` | 24, 161 | docs | 2 |
| `docs/briefs/bot-balance-durability20-operator-packet.md` | 50 | docs | 1 |
| `docs/briefs/bot-balance-durability20-report.md` | 42 | docs | 1 |
| `docs/briefs/bot-balance-durability21-operator-packet.md` | 33 | docs | 1 |
| `docs/briefs/bot-balance-durability22-operator-packet.md` | 40 | docs | 1 |
| `docs/briefs/bot-balance-durability22-report.md` | 95, 221-222, 250, 278, 282, 292-293, 316, 322, 329, 347, 353, 371, 391, 395, 405-406, 414, 592 | docs | 41 |
| `docs/briefs/bot-balance-durability23-operator-packet.md` | 48 | docs | 1 |
| `docs/briefs/bot-balance-durability23-report.md` | 96 | docs | 1 |
| `docs/briefs/bot-balance-durability24-operator-packet.md` | 29 | docs | 1 |
| `docs/briefs/bot-balance-durability24-report.md` | 103, 168, 178, 185 | docs | 4 |
| `docs/briefs/bot-balance-durability25-operator-packet.md` | 31 | docs | 1 |
| `docs/briefs/bot-balance-durability25-report.md` | 83, 89, 231, 247 | docs | 4 |
| `docs/briefs/bot-balance-durability26-operator-packet.md` | 30 | docs | 1 |
| `docs/briefs/bot-balance-durability26-report.md` | 69, 75, 156 | docs | 3 |
| `docs/briefs/bot-balance-durability27-operator-packet.md` | 32 | docs | 1 |
| `docs/briefs/bot-balance-durability27-report.md` | 70 | docs | 1 |
| `docs/briefs/bot-balance-durability28-operator-packet.md` | 29 | docs | 1 |
| `docs/briefs/bot-balance-durability28-report.md` | 102 | docs | 1 |
| `docs/briefs/bot-balance-durability29-operator-packet.md` | 27 | docs | 1 |
| `docs/briefs/bot-balance-durability3-operator-packet.md` | 82 | docs | 1 |
| `docs/briefs/bot-balance-durability3-report.md` | 234, 240, 251 | docs | 4 |
| `docs/briefs/bot-balance-durability30-operator-packet.md` | 25 | docs | 1 |
| `docs/briefs/bot-balance-durability31-operator-packet.md` | 37 | docs | 1 |
| `docs/briefs/bot-balance-durability31-report.md` | 33 | docs | 1 |
| `docs/briefs/bot-balance-durability32-operator-packet.md` | 31, 52, 107 | docs | 3 |
| `docs/briefs/bot-balance-durability32-report.md` | 62, 262 | docs | 2 |
| `docs/briefs/bot-balance-durability32-review-and-next-steps.md` | 41, 251 | docs | 2 |
| `docs/briefs/bot-balance-durability33-operator-packet.md` | 98 | docs | 1 |
| `docs/briefs/bot-balance-durability33-review-and-next-steps.md` | 200, 206 | docs | 2 |
| `docs/briefs/bot-balance-durability34-report.md` | 61, 209 | docs | 2 |
| `docs/briefs/bot-balance-durability34-review-and-next-steps.md` | 82, 156 | docs | 2 |
| `docs/briefs/bot-balance-durability35-report.md` | 107 | docs | 1 |
| `docs/briefs/bot-balance-durability4-operator-packet.md` | 45 | docs | 1 |
| `docs/briefs/bot-balance-durability5-operator-packet.md` | 12 | docs | 1 |
| `docs/briefs/bot-balance-durability6-operator-packet.md` | 38 | docs | 1 |
| `docs/briefs/bot-balance-durability6-report.md` | 70, 196, 198 | docs | 3 |
| `docs/briefs/bot-balance-durability7-operator-packet.md` | 28 | docs | 1 |
| `docs/briefs/bot-balance-durability7-report.md` | 134 | docs | 1 |
| `docs/briefs/bot-balance-durability8-operator-packet.md` | 16, 26 | docs | 2 |
| `docs/briefs/bot-balance-durability8-report.md` | 120 | docs | 1 |
| `docs/briefs/bot-balance-durability9-operator-packet.md` | 57 | docs | 1 |
| `docs/briefs/bot-balance-durability9-report.md` | 129 | docs | 1 |
| `docs/briefs/bot-balance-next-steps-2026-09-18.md` | 184 | docs | 1 |
| `docs/briefs/bot-balance-night1-assessment.md` | 99 | docs | 1 |
| `docs/briefs/bot-balance-night1-operator-packet.md` | 41, 45, 60, 87, 89 | docs | 9 |
| `docs/briefs/bot-balance-night1-report.md` | 60, 74-75 | docs | 7 |
| `docs/briefs/bot-balance-night2-a-operator-packet.md` | 34 | docs | 1 |
| `docs/briefs/bot-balance-night2-b-operator-packet.md` | 9 | docs | 1 |
| `docs/briefs/bot-balance-night2-b-report.md` | 41 | docs | 1 |
| `docs/briefs/bot-balance-night2-d-operator-packet.md` | 26 | docs | 1 |
| `docs/briefs/bot-balance-night2-d-report.md` | 36-37, 50 | docs | 7 |
| `docs/briefs/bot-balance-night2-ledger.md` | 62 | docs | 1 |
| `docs/briefs/bot-balance-night3-operator-packet.md` | 59, 64, 66 | docs | 4 |
| `docs/briefs/bot-balance-night3-report.md` | 72 | docs | 4 |
| `docs/briefs/bot-balance-night4-operator-packet.md` | 40 | docs | 1 |
| `docs/briefs/bot-balance-night5-operator-packet.md` | 20, 45 | docs | 3 |
| `docs/briefs/bot-balance-night5-r1-operator-packet.md` | 36, 61 | docs | 3 |
| `docs/briefs/bot-balance-q0-template-qualification.md` | 78 | docs | 1 |
| `docs/briefs/bot-balance-q1-operator-packet.md` | 20-21, 40, 55 | docs | 5 |
| `docs/briefs/bot-balance-q1-report.md` | 37 | docs | 1 |
| `docs/briefs/bot-balance-q2-operator-packet.md` | 53, 70 | docs | 2 |
| `docs/briefs/bot-balance-q2-report.md` | 43 | docs | 1 |
| `docs/briefs/bot-balance-q2b-operator-packet.md` | 17, 58 | docs | 2 |
| `docs/briefs/bot-balance-q2b-report.md` | 41 | docs | 1 |
| `docs/briefs/bot-balance-q2c-operator-packet.md` | 22, 73, 77, 81, 85, 89 | docs | 6 |
| `docs/briefs/bot-balance-q2c-report.md` | 36, 49, 81 | docs | 3 |
| `docs/briefs/bot-balance-q2d-assessment.md` | 65-66 | docs | 2 |
| `docs/briefs/bot-balance-q2d-operator-packet.md` | 17, 55, 63 | docs | 3 |
| `docs/briefs/bot-balance-q2d-report.md` | 37, 53 | docs | 2 |
| `docs/briefs/bot-balance-t2-boss-benchmark-gap-2026-09-18.md` | 97, 143 | docs | 3 |
| `docs/briefs/bot-balance-theorycrafting-reference.md` | 156, 192, 207, 232, 367, 371 | docs | 8 |
| `docs/briefs/bot-balance-ttk-survey-operator-packet.md` | 103 | docs | 1 |
| `docs/briefs/bot-balance-v1a-assessment.md` | 17-18, 20-21, 23, 26-27, 60-61 | docs | 9 |
| `docs/briefs/bot-balance-v1a-operator-packet.md` | 15 | docs | 1 |
| `docs/briefs/bot-balance-v1a-report.md` | 66, 68, 75-79 | docs | 7 |
| `docs/briefs/bot-balance-v1b-assessment.md` | 10, 17, 25 | docs | 3 |
| `docs/briefs/bot-balance-v1b-operator-packet.md` | 9, 19-20, 25, 70-71, 73 | docs | 9 |
| `docs/briefs/bot-balance-v1b-report.md` | 12-14, 90-93, 102, 115, 125-126, 129, 136, 143, 146, 197 | docs | 22 |
| `docs/briefs/bot-balance-v1c-assessment.md` | 6 | docs | 1 |
| `docs/briefs/bot-balance-v1c-operator-packet.md` | 9, 16-17, 20, 59 | docs | 7 |
| `docs/briefs/bot-balance-v1c-report.md` | 16-17, 98-101, 110, 125-126, 137-138, 152, 190 | docs | 19 |
| `docs/briefs/bot-balance-v1d-assessment.md` | 6, 35, 39, 41, 49 | docs | 8 |
| `docs/briefs/bot-balance-v1d-operator-packet.md` | 22 | docs | 1 |
| `docs/briefs/bot-balance-v1d-report.md` | 14-15, 17, 95, 109-112, 130, 155-156, 158, 160, 182, 184, 189, 221, 223 | docs | 29 |
| `docs/briefs/bot-balance-v1e-operator-packet.md` | 13, 17-18, 49 | docs | 7 |
| `docs/briefs/bot-balance-v1e-report.md` | 76-79, 91, 96, 105-106, 200-201 | docs | 12 |
| `docs/briefs/bot-balance-v1f-operator-packet.md` | 8, 58, 60, 73-74, 95 | docs | 8 |
| `docs/briefs/bot-balance-v1f-report.md` | 77, 79-81, 125 | docs | 8 |
| `docs/briefs/bot-balance-v1g-assessment.md` | 21, 26, 35, 37, 45, 65 | docs | 7 |
| `docs/briefs/bot-balance-v1g-operator-packet.md` | 56, 74 | docs | 5 |
| `docs/briefs/bot-balance-v1g-report.md` | 90, 92, 138-139 | docs | 9 |
| `docs/briefs/bot-balance-v1h-assessment.md` | 26, 36, 59 | docs | 4 |
| `docs/briefs/bot-balance-v1h-operator-packet.md` | 45-46, 56, 63, 85, 94, 110-111, 113 | docs | 10 |
| `docs/briefs/bot-balance-v1h-report.md` | 94, 99-102, 163-164, 193, 208-210, 215, 220, 223, 248, 251, 308 | docs | 19 |
| `docs/briefs/bot-balance-v1i-operator-packet.md` | 56, 79, 102 | docs | 3 |
| `docs/briefs/bot-balance-v1i-report.md` | 131, 143-144, 210-211 | docs | 10 |
| `docs/briefs/bot-balance-v1j-assessment.md` | 18 | docs | 2 |
| `docs/briefs/bot-balance-v1j-operator-packet.md` | 38, 50, 52 | docs | 4 |
| `docs/briefs/bot-balance-v1j-report.md` | 113-114, 150-151 | docs | 6 |
| `docs/briefs/bot-balance-v1k-operator-packet.md` | 39, 41, 54, 64 | docs | 10 |
| `docs/briefs/bot-balance-v1k-report.md` | 113-116 | docs | 16 |
| `docs/briefs/bot-balance-v1l-operator-packet.md` | 49 | docs | 1 |
| `docs/briefs/bot-balance-v1l-report.md` | 120-121, 231, 310 | docs | 6 |
| `docs/briefs/bot-balance-v1m-assessment.md` | 16 | docs | 1 |
| `docs/briefs/bot-balance-v1m-operator-packet.md` | 45 | docs | 1 |
| `docs/briefs/bot-balance-v1m-report.md` | 263, 268 | docs | 5 |
| `docs/briefs/bot-balance-v1n-biome-audit.md` | 171 | docs | 1 |
| `docs/briefs/bot-balance-v1n-operator-packet.md` | 25 | docs | 1 |
| `docs/briefs/bot-balance-v1n-report.md` | 65, 198, 265 | docs | 7 |
| `docs/briefs/bot-balance-v1o-operator-packet.md` | 50-51 | docs | 2 |
| `docs/briefs/bot-balance-v1o-report.md` | 159-160 | docs | 2 |
| `docs/briefs/bot-balance-v1p-operator-packet.md` | 60, 125, 129 | docs | 4 |
| `docs/briefs/bot-balance-v1p-report.md` | 129, 132, 196, 200-203, 344, 346, 354-356, 361, 452, 474, 483 | docs | 24 |
| `docs/briefs/bot-balance-v1q-operator-packet.md` | 41, 51 | docs | 2 |
| `docs/briefs/bot-balance-v1q-report.md` | 137, 140, 147-150 | docs | 10 |
| `docs/briefs/bot-balance-v1r-operator-packet.md` | 57, 64, 66, 75 | docs | 7 |
| `docs/briefs/bot-balance-v1r-report.md` | 111, 121, 123, 127, 138, 240, 242 | docs | 10 |
| `docs/briefs/bot-balance-v1s-operator-packet.md` | 17-18, 20, 24 | docs | 6 |
| `docs/briefs/bot-balance-v1s-report.md` | 12, 90, 107-108, 111, 268 | docs | 9 |
| `docs/briefs/bot-balance-v1t-operator-packet.md` | 55 | docs | 4 |
| `docs/briefs/bot-balance-v1t-report.md` | 120-123, 282, 285, 287, 290 | docs | 8 |
| `docs/briefs/bot-balance-v1u-operator-packet.md` | 18-19, 33-35, 87-89, 93-94, 119, 170, 174 | docs | 20 |
| `docs/briefs/bot-balance-v1u-report.md` | 51, 72, 81, 83-86, 90, 112 | docs | 12 |
| `docs/briefs/bot-balance-v1u2-operator-packet.md` | 72-73, 75, 81, 90 | docs | 5 |
| `docs/briefs/bot-balance-v1u2-report.md` | 8, 110, 113-116, 120, 127, 263, 265 | docs | 10 |
| `docs/briefs/bot-balance-v1v-operator-packet.md` | 46-47 | docs | 4 |
| `docs/briefs/bot-balance-v1v-report.md` | 71, 229, 231, 233 | docs | 7 |
| `docs/briefs/bot-balance-v1w-operator-packet.md` | 53-54 | docs | 3 |
| `docs/briefs/bot-balance-v1w-report.md` | 56, 212 | docs | 4 |
| `docs/briefs/bot-balance-v1x-operator-packet.md` | 56 | docs | 3 |
| `docs/briefs/bot-balance-v1x-report.md` | 106-109, 111, 241 | docs | 6 |
| `docs/briefs/bot-balance-v1y-operator-packet.md` | 22, 53, 58-60, 64, 70, 161, 186 | docs | 11 |
| `docs/briefs/bot-balance-v1y-report.md` | 7-8, 96-99, 101, 110-112, 115-116, 219 | docs | 17 |
| `docs/briefs/bot-balance-v1z-operator-packet.md` | 52, 76, 78 | docs | 4 |
| `docs/briefs/bot-balance-v1z-report.md` | 8, 99, 101, 103, 162, 167, 180 | docs | 9 |
| `docs/briefs/bot-balance-validation-exit-operator-packet.md` | 108-109 | docs | 2 |
| `docs/briefs/bot-balance-volcano-finish-operator-packet.md` | 52-53 | docs | 2 |
| `docs/briefs/bot-balance-volcano-finish-report.md` | 69 | docs | 1 |
| `docs/briefs/bot-t1-testing-handover-2026-08-26.md` | 64-65 | docs | 2 |
| `docs/briefs/cc-fold-report-2026-10-03.md` | 7, 32, 36, 59, 82, 99, 114, 139, 177, 194, 217, 230, 247 | docs | 13 |
| `docs/briefs/course-correction-report-2026-10-03.md` | 16, 212, 216, 219-220, 228, 232, 357-358, 360, 364-365, 368, 370, 378, 424, 552, 597 | docs | 21 |
| `docs/briefs/course-correction-run-2026-10-03.md` | 60, 149, 153-154, 156-157, 160, 169, 173 | docs | 11 |
| `docs/briefs/d3-t5-t6.md` | 35, 113, 133 | docs | 4 |
| `docs/briefs/day-run-report-2026-10-01.md` | 210-211 | docs | 2 |
| `docs/briefs/lineage-branch-review-findings-2026-10-02.md` | 104-105, 167-168, 253-255, 409, 500 | docs | 12 |
| `docs/briefs/mitigation-rebalance-handoff-2026-08-18.md` | 98, 149, 186 | docs | 3 |
| `docs/briefs/named-checkpoint-acceptance.md` | 136, 145-146, 184, 187 | docs | 7 |
| `docs/briefs/overnight-progression-2026-09-30.md` | 10, 128, 154, 188-191, 197, 201, 204-205 | docs | 16 |
| `docs/briefs/overnight-report-2026-10-01.md` | 122-123, 126-127, 182, 197, 208, 274-275, 279, 326, 338 | docs | 14 |
| `docs/briefs/player-balance-fast-pass-operator-packet.md` | 41 | docs | 1 |
| `docs/briefs/player-breadth-01-operator-packet.md` | 84, 91 | docs | 2 |
| `docs/briefs/player-package-fit-operator-packet.md` | 77 | docs | 1 |
| `docs/briefs/playtest-followup-command-center-2026-09-25.md` | 216, 244, 246, 270 | docs | 4 |
| `docs/briefs/run3-report-2026-10-01.md` | 193, 195-196 | docs | 3 |
| `docs/briefs/run4-report-2026-10-02.md` | 196-197, 238, 522, 535, 550-551, 559-560, 636 | docs | 14 |
| `docs/briefs/sol-mechanical-tasks-2026-10-05.md` | 128, 132-133, 139-140 | docs | 15 |
| `docs/briefs/T1_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-28.md` | 6, 38, 40, 63, 95, 136, 142, 144, 146, 159, 167, 170, 180, 192-193, 232 | docs | 29 |
| `docs/briefs/t1-balance-context-2026-08-18.md` | 42, 116, 220, 227, 237, 300, 365, 409, 449, 486, 522 | docs | 12 |
| `docs/briefs/t1-boss-numbers-2026-08-21.md` | 15 | docs | 1 |
| `docs/briefs/t1-boss-pass-report-2026-10-02.md` | 82, 232-234, 237, 514 | docs | 6 |
| `docs/briefs/t1-economy-candidate-c-2026-08-31.md` | 17-19, 31-32, 37, 42, 65, 74, 79, 82, 85-86, 92-93, 97, 99, 106-107, 123, 126, 150-152, 159, 171, 179, 185, 195-197, 211, 214, 216-217, 220, 222, 225, 227, 229, 234-235, 258, 260-262, 268-269, 299, 314, 317, 322, 325-326, 332 | docs | 65 |
| `docs/briefs/T2_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-29.md` | 4, 8-9, 19, 39, 46-47, 52, 54-55, 59, 64, 70, 72, 96, 100, 102, 104-107, 114, 116, 118-119, 127, 133, 135-140, 153, 166, 172, 174, 193, 195, 197, 204-210, 212, 215, 224 | docs | 91 |
| `docs/briefs/t2-bossless-progression-campaign-2026-09-03.md` | 26-27, 34-35, 50-52, 59, 124, 128-129, 135, 155, 204, 208, 295, 298, 323, 325, 349, 430-431, 465-466, 505, 507 | docs | 33 |
| `docs/briefs/t2-canonical-validation-2026-09-10.md` | 35, 113 | docs | 2 |
| `docs/briefs/t2-day-experiment-closeout-2026-09-09.md` | 10, 151 | docs | 2 |
| `docs/briefs/t2-economy-pacing-analysis-2026-09-10.md` | 9, 18, 20, 27-28, 44-45, 56-57, 81, 87, 129, 137, 139, 141, 147, 149, 151, 155, 164-165, 176-177, 179, 200, 205, 216, 219, 221, 225, 227, 231-233, 235, 249-250, 275, 282, 284, 288-290, 292, 305, 308, 310, 314, 316, 328, 336, 339, 351-353 | docs | 79 |
| `docs/briefs/t2-focused-experiment-2026-09-10.md` | 62 | docs | 1 |
| `docs/briefs/t2-overnight-experiment-2026-09-07.md` | 12, 32-33, 77-78, 80, 84, 90-91, 98, 102, 132, 134, 275, 295 | docs | 17 |
| `docs/briefs/t2-overnight-experiment-night2-2026-09-08.md` | 14, 28, 95, 119 | docs | 4 |
| `docs/briefs/t2-overnight-run-log-2026-09-04.md` | 24, 36, 114, 116-117, 120, 123-124, 135, 227, 229-230 | docs | 13 |
| `docs/briefs/t2-postfix-revalidation-2026-09-10.md` | 29 | docs | 1 |
| `docs/briefs/t2-route-theorycraft-2026-08-30.md` | 19, 38, 40-41, 90, 93-95, 97, 103-104, 115, 150, 168, 214, 216-217, 246, 249, 251-254, 257-260, 293, 299, 375, 377, 385, 398-400, 408, 412, 421-422, 431-432, 442, 498, 514, 547, 562, 570, 592, 624, 661-662, 677, 714-715, 728, 758, 770, 782, 788, 806, 808, 829, 832-833, 862-863 | docs | 79 |
| `docs/briefs/T3_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-30.md` | 8, 10, 18, 26, 30, 34-35, 48, 51-52, 57, 63, 132, 139, 147, 181, 187, 189, 214, 218, 235, 248, 298, 302, 304, 308, 311, 315, 326, 328, 334, 351, 362, 373, 446, 464, 466, 486, 488, 490, 492, 498-499, 504, 516, 529 | docs | 73 |
| `docs/briefs/T4_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-30.md` | 26-27, 33, 35, 39, 43, 45, 50, 64, 71, 82, 101, 122, 134, 172, 175, 187, 193, 197, 200, 203, 207, 212, 250, 257, 283, 286, 299-301, 331-333, 336, 343, 354, 370, 373, 376, 378-379, 381 | docs | 45 |
| `docs/briefs/tier-by-tier-monster-balance-handoff-2026-08-13.md` | 71, 82, 172, 219, 258-259, 263, 292, 361, 364, 370, 412 | docs | 12 |
| `docs/briefs/tooling-repair-2026-10-03.md` | 13-14, 25 | docs | 3 |
| `docs/briefs/verbs-that-fire-report-2026-10-03.md` | 20, 122, 275, 285, 287-288, 291-292, 302, 348, 351, 358-359 | docs | 20 |
| `docs/conduit-current-state.md` | 393 | docs | 1 |
| `docs/core-rework-design-balance-handoff.md` | 6, 160, 163, 230, 296, 457, 461, 466, 479, 544, 557, 563, 572, 620, 622, 624, 626, 628, 638, 646, 648, 654, 767, 798, 825, 850, 857 | docs | 27 |
| `docs/cores-current-state.md` | 84, 92, 99, 106, 113, 117, 131, 138-139, 163, 200, 233, 238, 253, 272 | docs | 16 |
| `docs/future-plans.md` | 15, 59, 147, 275 | docs | 5 |
| `docs/gameplay-telemetry-current-state.md` | 33-34, 57, 59 | docs | 5 |
| `docs/global-mastery-current-state.md` | 5, 94, 97, 118 | docs | 4 |
| `docs/guided-tutorial-plan.md` | 175, 574, 817 | docs | 4 |
| `docs/lineages-current-state.md` | 24, 74, 160, 226, 409, 462, 489, 495, 500-501, 503, 509-510, 521 | docs | 17 |
| `docs/map-crafting-panels-current-state.md` | 60, 146 | docs | 3 |
| `docs/map-variety-plan.md` | 11, 19, 32-33, 36, 68-70, 75, 83-84, 92-93, 103-104, 119, 172, 227, 237, 242, 267, 269, 272, 274, 277, 279, 281-282, 284-286, 289-290, 294, 296, 298, 300, 308, 310, 318-321, 324-325, 327-328, 332, 361, 390, 410, 419, 429, 441, 443-444, 446, 448, 459, 463, 481, 490 | docs | 69 |
| `docs/monster-combat-rework-current-state.md` | 252, 286 | docs | 2 |
| `docs/named-progression-checkpoints.md` | 19, 44, 56 | docs | 3 |
| `docs/player-sprites-current-state.md` | 17, 20, 390 | docs | 3 |
| `docs/progression-rework-plan.md` | 25, 40 | docs | 2 |
| `docs/README.md` | 127, 129 | docs | 2 |
| `docs/recovery-current-state.md` | 129, 392 | docs | 2 |
| `docs/relics-current-state.md` | 24, 108, 140, 151, 171 | docs | 5 |
| `docs/rites-current-state.md` | 80, 94 | docs | 2 |
| `docs/rune-system-current-state.md` | 109 | docs | 1 |
| `docs/stances-authoring-guide.md` | 166 | docs | 1 |
| `docs/stances-current-state.md` | 77, 217, 222, 224, 255 | docs | 5 |
| `docs/stances-future-design-notes.md` | 166, 266 | docs | 2 |
| `docs/system-rework-roadmap.md` | 36, 39, 50 | docs | 9 |
| `docs/system-rework-status.md` | 14-15, 20, 22 | docs | 8 |
| `docs/t1-item-rework-current-state.md` | 24, 107, 113, 125, 142, 150, 152, 155 | docs | 9 |
| `docs/t2-bot-testing-infrastructure.md` | 65, 68, 72, 85, 140, 146, 151-152, 154, 156, 158, 166, 168, 232, 240, 261, 263, 265, 272, 274, 278, 280-281, 285, 290-292, 298, 300-301, 308, 319-320, 324, 471-474, 479, 482, 515, 567 | docs | 54 |
| `docs/terrain-variance-plan.md` | 1426 | docs | 1 |
| `docs/tier-balance-current-state.md` | 201 | docs | 1 |
| `docs/ui-redesign-plan.md` | 251, 352, 541, 569, 575, 578, 818, 851, 853, 896, 899, 903, 905, 935, 1013, 1083-1084, 1223, 1356, 1383, 1540, 1542 | docs | 24 |
| `pnpm-lock.yaml` | 380, 856, 872, 2032, 2460, 2637, 3437, 4376, 4532, 4536, 5258, 5279 | live / retained; exceptions itemized above | 12 |
| `project-brief.md` | 37, 39 | docs | 2 |
| `README.md` | 28-29 | docs | 2 |
| `scripts/boss-reference-preflight.mjs` | 86, 106, 130 | live / retained; exceptions itemized above | 5 |
| `scripts/boss-verify.mjs` | 169-170 | live / retained; exceptions itemized above | 3 |
| `scripts/boss3-arms.mjs` | 76, 80 | live / retained; exceptions itemized above | 4 |
| `scripts/boss4-arms.mjs` | 77, 81 | live / retained; exceptions itemized above | 4 |
| `scripts/boss5-arms.mjs` | 112, 116 | live / retained; exceptions itemized above | 4 |
| `scripts/coreStrengthReport.mjs` | 18, 20 | live / retained; exceptions itemized above | 2 |
| `scripts/defenseBeforeAfter.ts` | 6, 19 | live / retained; exceptions itemized above | 2 |
| `scripts/defenseInventory.ts` | 11-12, 16-17 | live / retained; exceptions itemized above | 7 |
| `scripts/durability36-preflight.mjs` | 47 | live / retained; exceptions itemized above | 2 |
| `scripts/experiment/cli.mjs` | 81 | live / retained; exceptions itemized above | 1 |
| `scripts/experiment/experience.mjs` | 21, 113 | live / retained; exceptions itemized above | 3 |
| `scripts/experiment/lib.mjs` | 210-211 | live / retained; exceptions itemized above | 2 |
| `scripts/volcano-heat-management.mjs` | 31 | live / retained; exceptions itemized above | 1 |
| `server/bench/balance/boss1Spec.ts` | 196, 302 | live / retained; exceptions itemized above | 2 |
| `server/bench/balance/boss3Spec.ts` | 204 | live / retained; exceptions itemized above | 2 |
| `server/bench/balance/boss4Spec.ts` | 328 | live / retained; exceptions itemized above | 2 |
| `server/bench/balance/boss5Spec.ts` | 169, 299, 484, 588 | live / retained; exceptions itemized above | 5 |
| `server/bench/balance/bossReferenceSpec.ts` | 74, 135-136, 138, 206 | live / retained; exceptions itemized above | 8 |
| `server/bench/balance/botFactory.ts` | 217, 245, 272, 276-277 | live / retained; exceptions itemized above | 6 |
| `server/bench/balance/conduitStudy.ts` | 45 | live / retained; exceptions itemized above | 1 |
| `server/bench/balance/durability32Spec.ts` | 38, 45, 49-50, 62 | live / retained; exceptions itemized above | 6 |
| `server/bench/balance/durability33Spec.ts` | 53 | live / retained; exceptions itemized above | 1 |
| `server/bench/balance/durability34Spec.ts` | 81 | live / retained; exceptions itemized above | 1 |
| `server/bench/balance/durability35Spec.ts` | 54 | live / retained; exceptions itemized above | 1 |
| `server/bench/balance/durability36Spec.ts` | 45 | live / retained; exceptions itemized above | 1 |
| `server/bench/balance/farmingSustainSpec.ts` | 61, 64, 73-74 | live / retained; exceptions itemized above | 6 |
| `server/bench/balance/farmMatrix.ts` | 85, 92 | live / retained; exceptions itemized above | 2 |
| `server/bench/balance/farmTargets.ts` | 11, 48, 50, 53 | live / retained; exceptions itemized above | 4 |
| `server/bench/balance/overnightProgressionSpec.ts` | 47 | live / retained; exceptions itemized above | 1 |
| `server/bench/balance/playerBreadthSpec.ts` | 20, 95, 106, 119 | live / retained; exceptions itemized above | 4 |
| `server/bench/balance/playerFastPassSpec.ts` | 38 | live / retained; exceptions itemized above | 1 |
| `server/bench/balance/progressionSnapshot.ts` | 5, 61, 67, 70-71 | live / retained; exceptions itemized above | 5 |
| `server/bench/balance/runFarm.ts` | 53, 119, 140, 231 | live / retained; exceptions itemized above | 5 |
| `server/bench/balance/t4ScalingStudy.ts` | 36, 49, 102, 108 | live / retained; exceptions itemized above | 4 |
| `server/bench/balance/ttkSurveySpec.ts` | 35, 37, 40, 120-121, 148, 153, 168, 174 | live / retained; exceptions itemized above | 11 |
| `server/bench/balance/tundraClassFrameSpec.ts` | 95 | live / retained; exceptions itemized above | 1 |
| `server/bench/balance/types.ts` | 118, 264 | live / retained; exceptions itemized above | 2 |
| `server/bench/balance/volcanoHeatCases.json` | 12, 133, 258, 384, 513, 646, 780, 833, 905, 962, 1034, 1092, 1164, 1285, 1410, 1536, 1665, 1798, 1932, 1985, 2057, 2114, 2186, 2244, 2316, 2441, 2566, 2691, 2851, 2959, 3067, 3175 | live / retained; exceptions itemized above | 32 |
| `server/bench/balance/volcanoHeatReferences.json` | 46, 54, 62, 70, 78, 86, 94, 104, 112, 120, 130, 138, 146, 154, 165, 176, 185, 194, 203, 214, 225, 234, 243, 252, 260, 270, 278, 286, 294, 302, 312, 325, 339, 445, 450, 469, 557, 565, 573, 581, 589, 597, 607, 615, 623, 631, 641, 649, 657, 665, 676, 687, 696, 705, 714, 725, 736, 745, 754, 763, 771, 781, 789, 797, 805, 813, 823, 836, 852, 966, 971, 990, 1077, 1085, 1093, 1101, 1109, 1117, 1125, 1135, 1143, 1151, 1159, 1169, 1177, 1185, 1193, 1204, 1215, 1224, 1233, 1242, 1253, 1264, 1273, 1282, 1291, 1299, 1309, 1317, 1325, 1333, 1336, 1341, 1351, 1364, 1379, 1491, 1496, 1512, 1515, 1520, 1603, 1611, 1619, 1627, 1635, 1643, 1651, 1661, 1669, 1677, 1687, 1695, 1703, 1711, 1722, 1733, 1742, 1751, 1760, 1771, 1782, 1791, 1800, 1809, 1817, 1827, 1835, 1843, 1851, 1859, 1869, 1882, 1896, 2002, 2007, 2026, 2114, 2122, 2130, 2138, 2146, 2154, 2164, 2172, 2180, 2188, 2198, 2206, 2214, 2222, 2233, 2244, 2253, 2262, 2271, 2282, 2293, 2302, 2311, 2320, 2328, 2338, 2346, 2354, 2362, 2370, 2380, 2393, 2409, 2523, 2528, 2547, 2634, 2642, 2650, 2658, 2666, 2674, 2682, 2692, 2700, 2708, 2716, 2726, 2734, 2742, 2750, 2761, 2772, 2781, 2790, 2799, 2810, 2821, 2830, 2839, 2848, 2856, 2866, 2874, 2882, 2890, 2893, 2898, 2908, 2921, 2936, 3048, 3053, 3069, 3072, 3077, 3160, 3168, 3176, 3184, 3192, 3200, 3208, 3216, 3226, 3234, 3242, 3250, 3260, 3268, 3276, 3284, 3295, 3306, 3315, 3324, 3333, 3344, 3355, 3364, 3373, 3382, 3390, 3400, 3408, 3416, 3424, 3432, 3442, 3455, 3470, 3585, 3590, 3609, 3698, 3706, 3714, 3722, 3730, 3738, 3746, 3754, 3764, 3772, 3780, 3788, 3798, 3806, 3814, 3822, 3833, 3844, 3853, 3862, 3871, 3882, 3893, 3902, 3911, 3920, 3928, 3938, 3946, 3954, 3962, 3970, 3980, 3993, 4008, 4123, 4128, 4147, 4223, 4231, 4239, 4247, 4255, 4265, 4273, 4281, 4289, 4299, 4307, 4315, 4323, 4334, 4345, 4354, 4363, 4372, 4382, 4392, 4400, 4408, 4416, 4424, 4434, 4442, 4450, 4458, 4466, 4479, 4494, 4591, 4596, 4614, 4684, 4692, 4700, 4708, 4716, 4726, 4734, 4742, 4750, 4760, 4768, 4776, 4784, 4795, 4806, 4815, 4824, 4833, 4843, 4853, 4861, 4869, 4877, 4885, 4895, 4903, 4911, 4919, 4927, 4940, 4955, 5052, 5057, 5075 | live / retained; exceptions itemized above | 368 |
| `server/bench/balanceRun.ts` | 347, 451 | live / retained; exceptions itemized above | 2 |
| `server/bench/compositionLanes.ts` | 103 | live / retained; exceptions itemized above | 1 |
| `server/bench/coreStudy.ts` | 29, 50, 69 | live / retained; exceptions itemized above | 3 |
| `server/bench/defenseBunker03.ts` | 30 | live / retained; exceptions itemized above | 1 |
| `server/bench/defenseBurst03.ts` | 30 | live / retained; exceptions itemized above | 1 |
| `server/bench/defenseFinitePack04.ts` | 63, 92 | live / retained; exceptions itemized above | 2 |
| `server/bench/defenseIteration.ts` | 29, 47 | live / retained; exceptions itemized above | 2 |
| `server/bench/defenseIteration03.ts` | 41, 57 | live / retained; exceptions itemized above | 2 |
| `server/bench/defenseMatrix05.ts` | 82 | live / retained; exceptions itemized above | 1 |
| `server/bench/defenseStudy.ts` | 29, 60, 80 | live / retained; exceptions itemized above | 3 |
| `server/bench/defenseThreat03.ts` | 30 | live / retained; exceptions itemized above | 1 |
| `server/bench/harness.ts` | 113 | live / retained; exceptions itemized above | 1 |
| `server/bench/lineage/laneBot.ts` | 127-128 | live / retained; exceptions itemized above | 3 |
| `server/bench/lineage/laneMeasure.ts` | 165 | live / retained; exceptions itemized above | 1 |
| `server/bench/lineage/viabilityFloor.ts` | 44 | live / retained; exceptions itemized above | 1 |
| `server/bench/phase0Recovery.ts` | 69, 80, 87 | live / retained; exceptions itemized above | 3 |
| `server/bench/phase0Ttd.ts` | 69 | live / retained; exceptions itemized above | 1 |
| `server/runs/human-playtests/human-2026-08-29T16-13-31-917Z-12d693ac/events.jsonl` | 2, 37, 49, 73, 185, 393, 395, 404, 411, 562, 571, 582, 896, 1025, 1052, 1069, 1090, 1259, 1430, 1502, 1510, 1512, 1514, 1518, 1520, 1522, 1525, 1651, 1699, 1956, 2120, 2280, 2454, 2584, 2595, 2599, 2601, 2611, 2638, 2669, 2695, 2699, 2721, 2894, 3012, 3076, 3090, 3116, 3173, 3184, 3202, 3223, 3262, 3296, 3339, 3453, 3510, 3658, 3970, 4019, 4040, 4157, 4382, 4945, 5063, 5115, 5294, 5416, 5583, 5775, 5955, 6136, 6233 | docs (historical evidence) | 73 |
| `server/runs/human-playtests/human-2026-08-29T16-13-31-917Z-12d693ac/summary.json` | 104 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-08-29T16-45-38-899Z-b53726f3/events.jsonl` | 2, 1100 | docs (historical evidence) | 2 |
| `server/runs/human-playtests/human-2026-08-29T16-45-38-899Z-b53726f3/summary.json` | 122 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-08-29T16-58-39-255Z-d81f9630/events.jsonl` | 2, 39 | docs (historical evidence) | 2 |
| `server/runs/human-playtests/human-2026-08-29T16-58-39-255Z-d81f9630/summary.json` | 78 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-08-30T08-42-57-679Z-46acfc30/events.jsonl` | 2, 28, 34, 59, 97, 202, 318, 320, 324, 442, 868, 875, 917, 1005, 1007, 1009, 1011, 1016, 1020, 1114, 1140, 1173, 1270, 1385, 1453, 1455, 1460, 1815, 1880, 1900, 1971, 1990, 2003, 2049, 2134, 2214, 2248, 2259, 2323, 2332, 2382, 2396, 2401, 2424, 2427, 2477, 2600, 2777, 2941, 3006, 3008, 3011, 3017, 3120, 3125, 3580, 3752, 3937, 4045, 4059, 4072, 4734, 4930, 5106, 5437, 5688, 5881, 6101, 9893 | docs (historical evidence) | 69 |
| `server/runs/human-playtests/human-2026-08-30T08-42-57-679Z-46acfc30/summary.json` | 320 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-08-30T09-08-47-961Z-b5c532a1/events.jsonl` | 2, 36, 39, 62, 176, 229, 313, 332, 335, 383, 580, 584, 590, 592, 729, 742, 754, 766, 820, 822, 828, 833, 837, 849, 1070, 1075, 1088, 1103, 1138, 1146, 1356, 1374, 1376, 1378, 1381, 1409, 1417, 1461, 1502, 2250, 2319, 2756, 2762, 2764, 2767, 2770, 2772, 2774, 2778, 2782, 2785, 2861, 2910, 2943, 2972, 2981, 3035, 3125, 3328, 3470, 3536, 3935, 4063, 4262, 5420, 6191, 6273, 6532, 6552, 6571, 7110, 7112, 7114, 7116, 7996, 8801 | docs (historical evidence) | 76 |
| `server/runs/human-playtests/human-2026-08-30T09-08-47-961Z-b5c532a1/summary.json` | 290 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-08-30T09-50-05-282Z-7c3acaaa/events.jsonl` | 2, 135, 211, 214, 220, 222, 308, 407, 419, 431, 514, 527, 549, 836, 838, 843, 1006, 1067, 1072, 1546, 1550, 1554, 1558, 1563, 1577, 1579, 1587, 1590, 1592, 1648, 1661, 1676, 1690, 1712, 1927, 1929, 1931, 1934, 1967, 1969, 1974, 1978, 1992, 2003, 2196, 2325, 2364, 2368, 2376, 2380, 2496, 2499, 2506, 2511, 2521, 2553, 2612, 2804, 2930, 2948, 2951, 2956, 2960, 2965, 2969, 3000, 3008, 3027, 3038, 3046, 3074, 3087, 3097, 3108, 3277, 3450, 3607, 3643, 3656, 3669, 3677, 3690, 3703, 3711, 3722, 3739, 3743, 3914, 4084, 4240, 4266, 4285, 4301, 4313, 4330, 4371, 4398, 4426, 4551, 4720, 4843, 4878, 4936, 4963, 4987, 5002, 5013, 5028, 5038, 5068, 5071, 5092, 5098, 5118, 5134, 5143, 5158, 5263, 5375, 5395, 5422, 5442, 5456, 5467, 5479, 5529, 5542, 5637, 5733, 5787, 5877, 5978, 6071, 6260, 6521, 6636, 6711, 6752, 6784, 6998, 7146, 7270, 7400, 7411, 7431, 7446, 7462, 7480, 7983, 8101 | docs (historical evidence) | 150 |
| `server/runs/human-playtests/human-2026-08-30T09-50-05-282Z-7c3acaaa/summary.json` | 326 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-08-30T12-14-04-796Z-c6c66ded/events.jsonl` | 2, 41, 44, 69, 185, 319, 356, 368, 380, 450, 463, 486, 879, 881, 895, 901, 1060, 1074, 1117, 1133, 1455, 1467, 1484, 2065, 2075, 2079, 2342, 3253, 3268, 3280, 3285, 3439, 3471, 3491, 3511, 3529, 3664, 3689, 3714, 3835, 3901, 3905, 3916, 4031, 4164, 4175, 4185, 4200, 4211, 4223, 4226, 5086, 5148, 5150, 5152, 5161, 5165, 5783, 6673, 6966, 7244, 7876, 8315, 8321, 8333, 8339, 8344, 9394 | docs (historical evidence) | 68 |
| `server/runs/human-playtests/human-2026-08-30T12-14-04-796Z-c6c66ded/summary.json` | 317 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-08-30T13-55-19-227Z-15862945/events.jsonl` | 2, 46, 56, 64, 134, 140, 143, 196, 269, 273, 278, 345, 540, 543, 553, 724, 729, 731, 745, 861, 867, 876, 896, 903, 914, 1052, 1064, 1074, 1077, 1489, 1507, 1655, 1685, 1695, 1698, 1708, 1988, 2050, 2073, 2075, 2077, 2082, 2086, 2110, 2135, 2194, 2491, 2505, 2524, 2536, 2551, 2584, 2605, 2638, 2644, 2667, 2688, 2806, 2822, 2839, 2987, 3134, 3465, 3718, 3725, 4150, 4327, 4505, 4619, 4930, 5008, 5023, 5399, 5403, 5412, 5418, 5424, 5432, 6402, 6411, 8513 | docs (historical evidence) | 81 |
| `server/runs/human-playtests/human-2026-08-30T13-55-19-227Z-15862945/summary.json` | 338 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-08-30T14-43-08-200Z-4ae4d9bb/events.jsonl` | 2, 125, 130, 133, 212, 258, 263, 330, 334, 383, 396, 604, 608, 614, 624, 908, 927, 1128, 1344, 1575, 1633, 1641, 1648, 1666, 1674, 1685, 1688, 2037, 2040, 2042, 2044, 2157, 2307, 2318, 2339, 2347, 2376, 2403, 2471, 2483, 2490, 2496, 2504, 2529, 2536, 2544, 2564, 2572, 2670, 2872, 2892, 2896, 2923, 3225, 3425, 3735, 4074, 4336, 4518, 4840, 4889, 5335, 5506, 5701, 6187, 6387, 6588, 6731, 7142, 7318, 7533 | docs (historical evidence) | 71 |
| `server/runs/human-playtests/human-2026-08-30T14-43-08-200Z-4ae4d9bb/summary.json` | 97 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-08-31T20-32-28-175Z-74e6c209/events.jsonl` | 2, 33, 48, 82, 92, 617, 744, 753, 768, 778, 785, 808, 817, 832, 843, 1353 | docs (historical evidence) | 16 |
| `server/runs/human-playtests/human-2026-08-31T20-32-28-175Z-74e6c209/summary.json` | 151 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-01T20-08-06-127Z-04ef4721/events.jsonl` | 2, 1488, 1534, 1550, 1587, 1624, 4426, 5493, 6346, 16943, 16963, 17067, 17148, 17175, 17177, 18696, 18749, 18778, 18811, 18826, 19539, 19729, 21985, 22486, 25884, 42928 | docs (historical evidence) | 26 |
| `server/runs/human-playtests/human-2026-09-01T20-08-06-127Z-04ef4721/summary.json` | 87 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-02T11-30-52-087Z-53f56d7f/events.jsonl` | 2, 557, 1202, 1964, 2012, 2017, 2021, 2024, 2027, 2029, 2033, 2037, 2042, 2146, 2162, 2376, 2381, 2388, 2395, 2402, 2409, 2773, 3648, 3747, 3827, 3891, 5121, 5132, 5151, 5180, 5662, 6787, 7127, 7824, 8209, 8227, 8446, 8715, 8724, 9189, 9191, 9193, 9403, 9420, 9445, 9453, 9463, 9555, 9559, 9673, 9875, 10787, 10871, 10878, 10921, 10951, 11000, 11044, 11118, 11145, 11188, 11262, 11305, 11327, 11364, 11414, 11500, 12328, 12530, 12744, 12750, 12772, 12791, 12808, 15801, 17802, 50243 | docs (historical evidence) | 77 |
| `server/runs/human-playtests/human-2026-09-02T11-30-52-087Z-53f56d7f/summary.json` | 502 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-06T10-43-39-408Z-83d6b178/events.jsonl` | 2, 541, 571, 590, 621, 626, 648, 672, 2004, 2009, 2012, 2069, 2088, 2093, 2100, 2107, 2112, 2256, 2938, 2984, 4696, 4700, 4704, 4710, 4730, 4754, 4977, 7491, 8446, 8451, 8462, 8466, 8470, 8478, 8649, 9397, 9409, 9439, 9442, 9459, 9538, 10170 | docs (historical evidence) | 42 |
| `server/runs/human-playtests/human-2026-09-06T10-43-39-408Z-83d6b178/summary.json` | 543 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-06T17-45-52-039Z-2cc758cd/events.jsonl` | 2, 10, 82, 143, 147, 247, 375, 419, 491, 721, 1424 | docs (historical evidence) | 11 |
| `server/runs/human-playtests/human-2026-09-06T17-45-52-039Z-2cc758cd/summary.json` | 76 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-10T11-44-15-986Z-cc0540ad/events.jsonl` | 2, 275, 294, 362, 826, 829, 1442, 2541, 2850, 5522, 5524, 5526, 5530, 6097, 6571, 7035, 8067, 11732, 14884, 24945, 31628, 32322, 32595, 44452, 52754, 53577, 55827, 60075, 60102, 60115, 60128, 60453, 60867, 61080, 61886, 62142, 63353, 64192, 65149, 65386, 66018, 66142 | docs (historical evidence) | 42 |
| `server/runs/human-playtests/human-2026-09-10T11-44-15-986Z-cc0540ad/summary.json` | 85 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-11T11-03-51-481Z-063add25/events.jsonl` | 2, 35, 205, 422, 815, 827, 2339, 4767 | docs (historical evidence) | 8 |
| `server/runs/human-playtests/human-2026-09-11T11-03-51-481Z-063add25/summary.json` | 75 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-11T13-15-23-512Z-1d06bd17/events.jsonl` | 2, 12 | docs (historical evidence) | 2 |
| `server/runs/human-playtests/human-2026-09-11T13-15-23-512Z-1d06bd17/summary.json` | 70 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-11T13-59-33-589Z-844f61fd/events.jsonl` | 2, 167, 229, 247, 764, 778, 1395, 1465, 1475, 2377 | docs (historical evidence) | 10 |
| `server/runs/human-playtests/human-2026-09-11T13-59-33-589Z-844f61fd/summary.json` | 76 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-11T14-09-00-263Z-a8f17d8b/events.jsonl` | 2, 41, 55, 65, 1870, 1924, 1961, 3187, 3817 | docs (historical evidence) | 9 |
| `server/runs/human-playtests/human-2026-09-11T14-09-00-263Z-a8f17d8b/summary.json` | 78 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-11T14-17-20-024Z-51e23cc3/events.jsonl` | 2, 365, 385, 437, 475, 524, 535, 706, 917, 1098, 1101, 1118, 1121, 1128, 1243, 1534, 1719, 1802, 1989, 2154, 2156, 2563 | docs (historical evidence) | 22 |
| `server/runs/human-playtests/human-2026-09-11T14-17-20-024Z-51e23cc3/summary.json` | 82 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-11T14-22-29-289Z-06737352/events.jsonl` | 2, 209, 876, 1363 | docs (historical evidence) | 4 |
| `server/runs/human-playtests/human-2026-09-11T14-22-29-289Z-06737352/summary.json` | 80 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-11T14-26-46-324Z-af102531/events.jsonl` | 2, 544, 615, 1421, 1758 | docs (historical evidence) | 5 |
| `server/runs/human-playtests/human-2026-09-11T14-26-46-324Z-af102531/summary.json` | 202 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-12T21-23-29-443Z-39ea6cbe/events.jsonl` | 2, 35, 47, 87, 95, 193, 247, 254, 259, 281, 287, 385, 395, 403, 465, 476, 494, 504, 512, 670, 673, 675, 679, 701, 708, 751, 756, 791, 805, 807, 812, 883, 959, 965, 972, 1024, 1136, 1249, 1261, 1271, 1273, 1282, 1294, 1306, 1309, 1312, 1347, 1371, 1389, 1449, 1453, 1510, 1721, 1725, 1742, 1751, 1765, 1840, 2011, 2137, 2241, 2409, 2687, 2895, 3067, 3150, 3155, 3162, 3188, 3422, 3551, 3817, 3944, 4053, 4160, 4329, 4817, 4914, 4925, 7036, 7110, 11156, 11164, 11169, 11173, 11176, 11178, 11573, 11575, 11577, 13560, 13579, 13590, 13594, 13599, 13616, 13638, 14084, 14094, 14896, 14913, 16136, 17257, 23943 | docs (historical evidence) | 104 |
| `server/runs/human-playtests/human-2026-09-12T21-23-29-443Z-39ea6cbe/summary.json` | 416 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-12T22-45-23-893Z-adefdd08/events.jsonl` | 2, 2281, 2286, 2292, 4207, 5308, 5330, 5346, 5365, 5384, 6434, 6445, 6466, 6473, 6478, 6486, 6524, 6531, 6536, 6542, 6557, 6564, 6571, 6577, 6591, 6604, 6609, 6616, 6867, 6872, 6882, 6889, 6896, 6904, 6912, 6920, 6923, 6926, 6929, 6941, 6980, 6990, 6997, 7002, 7136, 7143, 7150, 7157, 7162, 7283, 7297, 7303, 7309, 7315, 7318, 7321, 7332, 7337, 7344, 7351, 7356, 7366, 7385, 7392, 7398, 7457, 7475, 7485, 7494, 7886, 7906, 7915, 7924, 7990, 8009, 8023, 8037, 8434, 8472, 8484, 8494, 8499, 8504, 8519, 8528, 8536, 8545, 8828, 8844, 8862, 8871, 8880, 8900, 8910, 8918, 9681, 9726, 9733, 9740, 9746, 9870, 9879, 9886, 9903, 10129, 10148, 10164, 10183, 10219, 10230, 10241, 10244, 10251, 10805, 10811, 10818, 10826, 10972, 10981, 10988, 10995, 11019, 11030, 11037, 11045, 11219, 11226, 11231, 11237, 11305, 11309, 11317, 11365, 11383, 11390, 11399, 11536, 11545, 11557, 11590, 11599, 11609, 11737, 11744, 11751, 11758, 11796, 11804, 11814, 11828, 12189, 12200, 12204, 12217, 12225, 12231, 12241, 12259, 12266, 12356, 12584, 12671, 12677, 12690, 12704, 12715, 12795, 12797, 12812, 12814, 12816, 12818, 12820, 12822, 12824, 12832, 12835, 12840, 12845, 12850, 12852, 12876, 12884, 12896, 12920, 12936, 13110, 13124, 13130, 13139, 13152, 13175, 13187, 13365, 13386, 13393, 13408, 13421, 13434, 13446, 13455, 13465, 13597, 13623, 13637, 13661, 13679, 13717, 13727, 13773, 13787, 13799, 14110, 14143, 14156, 14315, 14328, 14340, 14366, 14378, 14614, 14655, 14667, 14849, 14918, 14925, 14930 | docs (historical evidence) | 227 |
| `server/runs/human-playtests/human-2026-09-12T22-45-23-893Z-adefdd08/summary.json` | 999 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-13T09-31-14-904Z-03209be7/events.jsonl` | 2, 31, 33, 41, 46, 179, 275, 280, 283, 307, 432, 437, 442, 518, 646, 663, 686, 699, 716, 924, 944, 953, 1308, 1321, 1327, 1334, 1339, 1344, 1349, 1352, 1355, 1357, 1359, 1361, 1364, 1370, 1428, 1435, 1441, 1463, 1745, 1850, 2040, 2322, 2433, 2501 | docs (historical evidence) | 46 |
| `server/runs/human-playtests/human-2026-09-13T09-31-14-904Z-03209be7/summary.json` | 95 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-13T09-40-41-268Z-2c67f5f7/events.jsonl` | 2, 13, 121, 223, 332, 426, 505, 548, 642, 753, 836, 944, 1027, 1125, 1240, 1337, 1428, 1544, 1586, 1730, 1800, 1883, 2013, 2145, 2312, 2444, 2575, 2709 | docs (historical evidence) | 28 |
| `server/runs/human-playtests/human-2026-09-13T09-40-41-268Z-2c67f5f7/summary.json` | 104 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-13T09-52-43-955Z-cd14f94c/events.jsonl` | 2, 53, 180, 312, 577 | docs (historical evidence) | 5 |
| `server/runs/human-playtests/human-2026-09-13T09-52-43-955Z-cd14f94c/summary.json` | 88 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-13T09-57-25-047Z-a5e4b88f/events.jsonl` | 2, 68, 202, 332, 502, 636, 770, 901, 1295 | docs (historical evidence) | 9 |
| `server/runs/human-playtests/human-2026-09-13T09-57-25-047Z-a5e4b88f/summary.json` | 98 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-13T10-03-57-319Z-2df62694/events.jsonl` | 2, 90, 222, 354, 488, 586 | docs (historical evidence) | 6 |
| `server/runs/human-playtests/human-2026-09-13T10-03-57-319Z-2df62694/summary.json` | 89 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-13T16-53-11-299Z-e1f16cb8/events.jsonl` | 2, 17, 19, 49, 1043 | docs (historical evidence) | 5 |
| `server/runs/human-playtests/human-2026-09-13T16-53-11-299Z-e1f16cb8/summary.json` | 167 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-16T10-03-13-867Z-337bd54d/events.jsonl` | 2, 1652, 1665, 1674, 2227, 2229 | docs (historical evidence) | 6 |
| `server/runs/human-playtests/human-2026-09-16T10-03-13-867Z-337bd54d/summary.json` | 301 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-19T16-02-28-876Z-123061cb/events.jsonl` | 2, 127, 427, 1251, 1257, 1265, 1269, 1274, 1278, 1286, 1334, 1445, 1612, 1792, 1961, 2076, 2156, 2163, 2483, 2672, 2711, 2734, 2796, 3056, 3058, 3731, 3744, 3750, 3757, 3763, 3770, 3780, 3800, 3848, 3905, 3962, 4060, 4170, 4224, 4249, 4294, 4324, 4414, 4557, 4757, 5005, 5191, 5258, 5332, 5465, 5613, 5645, 5652, 5655, 5657, 5659, 5661, 5663, 5667, 5669, 5673, 5687, 5696, 5705, 6744, 6751, 8480, 8703, 11743, 11768, 11798, 11843, 11889, 11947, 11969, 12317, 12335, 13389, 13655, 13768, 14118, 14122, 14124, 14126, 14128, 14130, 14135, 14141, 14150, 14156, 14160, 16267, 16279, 16281, 16288, 16310, 16325, 16337, 16348, 16359-16360, 16376, 16740, 16748, 16752, 16757, 17986, 17994, 18203, 18302, 18614, 19152, 19333, 19379, 19381, 19426, 19441, 19480, 19506, 19518, 19555, 21081, 21286, 21302, 21309, 21318, 21329, 21346, 21365, 21387, 21409, 21433, 21449, 21464, 21721, 21739, 21765, 21783, 21803, 21813, 21837, 21872, 21893, 21909, 21929, 24310 | docs (historical evidence) | 161 |
| `server/runs/human-playtests/human-2026-09-19T16-02-28-876Z-123061cb/summary.json` | 910, 913 | docs (historical evidence) | 2 |
| `server/runs/human-playtests/human-2026-09-19T17-02-25-882Z-64a3319c/events.jsonl` | 2, 41, 53, 69, 71, 300, 379, 384, 386, 397, 769, 771, 775, 1138, 1143, 1146, 1197, 1291, 1307, 1312, 1314, 1316, 1318, 1320, 1323, 1325, 1330, 1334, 1337, 1340, 1346, 1351, 1522, 1622, 1624, 1626, 1630, 1665, 2042, 2049, 2074, 2093, 2097, 2115, 2267, 2624, 2804, 2963, 3163, 3476, 3482, 3495, 3498, 4715, 5576, 5632, 5674, 5686, 5697, 5707, 5714, 5721, 5730, 5777, 5786, 5797, 5804, 5811, 5817, 7868, 7886, 7899, 7915, 7937, 7959, 8011, 8103, 8343, 8362, 8429, 8448, 8451, 8467, 8481, 8496, 8513, 8581, 8597, 8613, 8616, 8635, 8645, 8660, 8674, 8677, 8694, 8697, 8700, 8730, 8748, 8764, 8782, 8794, 8878, 8894, 8897, 8916, 8932, 8952, 8971, 8984, 8990, 9008, 9020, 9024, 9041, 9058, 9077, 9097, 9119, 9140, 9174, 9269, 9282, 9285, 9303, 9320, 9337, 9352, 9369, 9383, 9397, 9430, 9476, 9485, 9491, 9499, 9505, 9507, 9513, 9515, 9517, 9519, 9521, 9523, 9525, 9538, 9542, 9544, 9548, 9572, 9577, 9583, 9590, 9594, 9615, 9623, 9630, 9633, 9643, 9651, 9658, 9685, 9693, 9698, 9708, 9716, 9740, 9746, 9755, 9770, 9788, 9805, 9825, 9846, 9866, 9888, 9994, 10012, 10014, 10032, 10042, 10056, 10068, 10082, 10097, 10123, 10132, 10143, 10173, 10184, 10196, 10217, 10237, 10247, 10255, 10312, 10331, 10335, 10346, 10355, 10374, 10394, 10408, 10415, 10434, 10446, 10456, 10468, 10494, 10515, 10519, 10537, 10557, 10578, 10590, 10605, 10625, 10640, 10646, 10666, 10680, 10689, 10699, 10712, 10734, 10749, 10755, 10774, 10787, 10797, 10809, 10834, 10855, 10861, 10877, 10897, 10918, 10933, 10949, 10971, 10999, 11014, 11070, 11075, 11085, 11097, 11113, 11136, 11155, 11177, 11196, 11687, 11767, 11782, 11786, 11800, 11810, 11819, 11830, 11853, 11890, 11901, 11910, 11929, 11949, 11962, 11972, 11984, 11995, 12023, 12041-12042, 12051, 12065, 12079, 12100, 12112, 12122, 12173, 12190, 12192, 12209, 12218, 12236, 12260, 12273, 12282, 12312, 12365, 12373, 12376, 12390, 12404, 12416, 12425, 12444, 12456, 12466, 12685, 12713, 12723-12724, 12732, 12738, 12743, 12762, 12765, 12769, 12775, 12783, 12800, 12808, 12817, 12822, 12872, 12892, 12901, 12916, 12929, 12954, 13005, 13007, 13010, 13030, 13034, 13075, 13086-13087, 13095, 13110, 13119, 13125, 13131, 13142, 13156, 13190, 13204, 13230, 13237, 13302, 13308, 13329, 13337, 13354, 13371, 13443, 13945, 13976, 13979, 13998, 14004, 14012, 14014, 14029, 14056, 14060, 14062, 14070, 14091, 14107, 14111, 14119, 14133, 14148, 14152, 14165, 14183, 14197, 15008, 15028, 15034, 15051, 15074, 15098, 15121, 15143, 15163, 15198, 15257, 15271, 15279, 15288-15289, 15306, 15317, 15329, 15345, 15369, 15390, 15409, 15433, 16060, 16084, 16089, 16124, 16144, 16146, 16156, 16166, 16176, 16185, 16195, 16204, 16220, 16571, 16582, 16590, 16600, 16611, 16624, 16633, 16647, 16668, 16673, 16688, 16709, 16724, 16735, 16745, 16761, 16780, 16894, 16916, 16924, 16935, 16944, 16956, 16966, 16975, 16985, 17007, 17017, 17026, 17047, 17072, 17136, 17144, 17146, 17157, 17174, 17185, 17194, 17204, 17213, 19861, 19897, 19900, 19913, 19922, 19937, 19966, 19976, 19981, 19993, 20006, 20020, 20028, 20048, 20060, 20070, 20784, 20862, 20872, 20876, 20885, 20897, 20911, 20928, 20943, 20961, 20974, 21661, 21671, 21684, 21688, 21697, 21711, 21728, 21744, 21760, 21779, 21790, 23715, 23744, 23750, 23761, 23775, 23785, 23798, 23804, 23824, 23836, 23846, 24550, 24619, 24629, 24640, 24649, 24659, 24668, 24687, 24715, 24726, 24736, 24749, 24762, 24783, 24794, 24806, 24814, 24850, 24869, 24874, 24888, 24897, 24911, 24933, 24947, 24958, 24966, 25003, 25021, 25028, 25040, 25051, 25066, 25086, 25096, 25107, 25115, 25163, 25178, 25182, 25197, 25206, 25225, 25245, 25257, 25266, 25309, 25330, 25336, 25350, 25362, 25374, 25395, 25408, 25419, 25428, 25476, 25493-25494, 25513, 25522, 25540, 25561, 25574, 25583, 25591, 25631, 25651, 25654, 25671, 25682, 25698, 25719, 25730, 25739, 25756, 25778, 25790, 25798, 25817, 25835, 25860, 25880, 25883 | docs (historical evidence) | 578 |
| `server/runs/human-playtests/human-2026-09-19T17-02-25-882Z-64a3319c/summary.json` | 615 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-23T17-13-48-816Z-7306a370/events.jsonl` | 2, 22, 28, 257, 312, 322, 468 | docs (historical evidence) | 7 |
| `server/runs/human-playtests/human-2026-09-23T17-13-48-816Z-7306a370/summary.json` | 72 | docs (historical evidence) | 1 |
| `server/runs/human-playtests/human-2026-09-23T17-17-43-249Z-00c29028/events.jsonl` | 2, 611, 631, 997, 1733 | docs (historical evidence) | 5 |
| `server/runs/human-playtests/human-2026-09-23T17-17-43-249Z-00c29028/summary.json` | 76 | docs (historical evidence) | 1 |
| `server/scripts/_gear.ts` | 11 | live / retained; exceptions itemized above | 1 |
| `server/scripts/_t1BossLab.ts` | 41, 304, 398, 467 | live / retained; exceptions itemized above | 4 |
| `server/scripts/_t1BossPlan.ts` | 8 | live / retained; exceptions itemized above | 1 |
| `server/scripts/_t4Ladder.ts` | 13 | live / retained; exceptions itemized above | 4 |
| `server/scripts/_t4PowerLab.ts` | 204 | live / retained; exceptions itemized above | 1 |
| `server/scripts/bossScreen.ts` | 464, 483 | live / retained; exceptions itemized above | 4 |
| `server/scripts/botStaticLavaDiagnostic.ts` | 25, 36 | live / retained; exceptions itemized above | 3 |
| `server/scripts/netcode-baseline.ts` | 62-63 | live / retained; exceptions itemized above | 2 |
| `server/scripts/night3Preflight.ts` | 23-24, 33, 42, 45, 50, 52, 75 | live / retained; exceptions itemized above | 12 |
| `server/scripts/t4ValidationExitPreflight.ts` | 70-71, 91 | live / retained; exceptions itemized above | 3 |
| `server/scripts/v1oDiagnostics.ts` | 40, 45, 89 | live / retained; exceptions itemized above | 4 |
| `server/scripts/v1pDiagnostics.ts` | 24, 44, 49, 82, 113 | live / retained; exceptions itemized above | 6 |
| `server/scripts/v1rPreflight.ts` | 12, 29-30, 41, 53 | live / retained; exceptions itemized above | 8 |
| `server/scripts/v1tPreflight.ts` | 21-22, 31 | live / retained; exceptions itemized above | 4 |
| `server/scripts/v1u2Preflight.ts` | 16-17, 32-33, 42, 61, 65-67, 73, 103, 110, 112 | live / retained; exceptions itemized above | 19 |
| `server/scripts/v1uPreflight.ts` | 15-16, 31-32, 41, 60, 64-66, 72, 89, 96, 98 | live / retained; exceptions itemized above | 19 |
| `server/scripts/v1vPreflight.ts` | 22-23, 32 | live / retained; exceptions itemized above | 4 |
| `server/scripts/v1wPreflight.ts` | 23-24, 33 | live / retained; exceptions itemized above | 4 |
| `server/scripts/v1xPreflight.ts` | 21-22, 31 | live / retained; exceptions itemized above | 4 |
| `server/scripts/v1yPreflight.ts` | 12-13, 27-28, 37, 54, 56, 89 | live / retained; exceptions itemized above | 11 |
| `server/scripts/v1zPreflight.ts` | 11, 23-24, 33, 44, 71-72, 77 | live / retained; exceptions itemized above | 9 |
| `server/scripts/volcanoFinishPreflight.ts` | 24-25, 34, 45, 48, 53, 55, 86 | live / retained; exceptions itemized above | 12 |
| `server/src/admin/gameActions.ts` | 129, 357-358, 452, 516 | live / retained; exceptions itemized above | 6 |
| `server/src/admin/progressionCheckpoint.ts` | 106, 111 | live / retained; exceptions itemized above | 2 |
| `server/src/analytics/gameplayRecorder.ts` | 9, 20 | live / retained; exceptions itemized above | 2 |
| `server/src/db/gearUpgradeRefund.ts` | 7-8, 16, 24 | live / retained; exceptions itemized above | 4 |
| `server/src/db/migrations/0002_wipe_catalyst_wallets.sql` | 1, 7-8 | live / retained; exceptions itemized above | 3 |
| `server/src/db/migrations/0009_progression_rework.sql` | 1, 7, 16 | live / retained; exceptions itemized above | 4 |
| `server/src/db/migrations/meta/_journal.json` | 23 | live / retained; exceptions itemized above | 1 |
| `server/src/db/playerRepo.ts` | 483, 502, 512, 571-572, 610, 612-613, 640, 651, 655-657, 659, 801 | live / retained; exceptions itemized above | 19 |
| `server/src/db/weaponUpgradeRefund.ts` | 7, 14 | live / retained; exceptions itemized above | 3 |
| `server/src/ecs/entity.ts` | 147 | live / retained; exceptions itemized above | 1 |
| `server/src/net/playerHandlers.ts` | 37, 54, 468, 475, 477, 591, 594, 603, 605 | live / retained; exceptions itemized above | 10 |
| `server/src/playtest/humanPlaytestRecorder.ts` | 281 | live / retained; exceptions itemized above | 2 |
| `server/src/systems/combat/ai/runeConfig.ts` | 51 | live / protected; list only | 1 |
| `server/src/systems/combat/ai/shellUp.ts` | 34 | live / protected; list only | 1 |
| `server/src/systems/combat/cores.ts` | 34 | live / protected; list only | 1 |
| `server/src/systems/combat/damage/knockback.ts` | 139 | live / protected; list only | 1 |
| `server/src/systems/combat/engine/combat.ts` | 1717, 1793, 2393 | live / protected; list only | 3 |
| `server/src/systems/player/abilities/abilityBramble.ts` | 5 | live / retained; exceptions itemized above | 1 |
| `server/src/systems/player/economy/crafting.ts` | 30 | live / retained; exceptions itemized above | 1 |
| `server/src/systems/player/economy/itemEvolution.ts` | 1-2, 12, 20, 24, 27 | live / retained; exceptions itemized above | 6 |
| `server/src/systems/player/economy/itemUpgrade.ts` | 5, 16, 21, 25-26 | live / retained; exceptions itemized above | 5 |
| `server/src/systems/player/economy/lineages.ts` | 212 | live / retained; exceptions itemized above | 1 |
| `server/src/systems/player/economy/lineageSync.ts` | 84 | live / retained; exceptions itemized above | 1 |
| `server/src/systems/player/progression/rewards.ts` | 71 | live / retained; exceptions itemized above | 1 |
| `server/src/world/World.ts` | 263 | live / retained; exceptions itemized above | 2 |
| `server/test/_bossLineageHarness.ts` | 40 | live / retained; exceptions itemized above | 1 |
| `server/test/_coreRelicAudit.ts` | 38, 104, 119-120 | live / retained; exceptions itemized above | 4 |
| `server/test/_falchionSanity.ts` | 40 | live / retained; exceptions itemized above | 1 |
| `server/test/_sweepTempoMeasure.ts` | 63 | live / retained; exceptions itemized above | 1 |
| `server/test/abilities.test.ts` | 68 | live / retained; exceptions itemized above | 1 |
| `server/test/abilityAffliction.test.ts` | 96 | live / retained; exceptions itemized above | 1 |
| `server/test/abilityBramble.test.ts` | 2, 79 | live / retained; exceptions itemized above | 2 |
| `server/test/abilityCast.test.ts` | 3, 77 | live / retained; exceptions itemized above | 2 |
| `server/test/abilityCharge.test.ts` | 77 | live / retained; exceptions itemized above | 1 |
| `server/test/abilityConduitTechniqueAdapter.test.ts` | 80 | live / retained; exceptions itemized above | 1 |
| `server/test/abilityControl.test.ts` | 89 | live / retained; exceptions itemized above | 1 |
| `server/test/abilityGuardsAndReach.test.ts` | 98 | live / retained; exceptions itemized above | 1 |
| `server/test/abilityKata.test.ts` | 51 | live / retained; exceptions itemized above | 1 |
| `server/test/abilityMultiSlot.test.ts` | 2, 82 | live / retained; exceptions itemized above | 2 |
| `server/test/abilityNodes.test.ts` | 228, 346 | live / retained; exceptions itemized above | 2 |
| `server/test/abilitySecondWind.test.ts` | 67 | live / retained; exceptions itemized above | 1 |
| `server/test/abilitySlam.test.ts` | 107, 387 | live / retained; exceptions itemized above | 2 |
| `server/test/abilitySweepAdapters.test.ts` | 126 | live / retained; exceptions itemized above | 1 |
| `server/test/abilityTechniqueRune.test.ts` | 67 | live / retained; exceptions itemized above | 1 |
| `server/test/abilityTelegraphEvents.test.ts` | 59 | live / retained; exceptions itemized above | 1 |
| `server/test/abilityTempo.test.ts` | 95 | live / retained; exceptions itemized above | 1 |
| `server/test/alphaWindow.test.ts` | 14, 71, 145, 153-156 | live / retained; exceptions itemized above | 9 |
| `server/test/ambientRamp.test.ts` | 86 | live / retained; exceptions itemized above | 1 |
| `server/test/approachGoalStandable.test.ts` | 62 | live / retained; exceptions itemized above | 1 |
| `server/test/attunementRuntime.test.ts` | 59 | live / retained; exceptions itemized above | 1 |
| `server/test/autoCollisionRecovery.test.ts` | 58 | live / retained; exceptions itemized above | 1 |
| `server/test/autoIntent.test.ts` | 63 | live / retained; exceptions itemized above | 1 |
| `server/test/autoMovementSmoothness.test.ts` | 47 | live / retained; exceptions itemized above | 1 |
| `server/test/barrier.test.ts` | 64 | live / retained; exceptions itemized above | 1 |
| `server/test/biomeEcologyPolish.test.ts` | 920 | live / retained; exceptions itemized above | 1 |
| `server/test/bogLurkerDeathroll.test.ts` | 481 | live / retained; exceptions itemized above | 1 |
| `server/test/boss2Concealment.test.ts` | 60 | live / retained; exceptions itemized above | 1 |
| `server/test/boss2Matrix.test.ts` | 51 | live / retained; exceptions itemized above | 2 |
| `server/test/boss3Cleanse.test.ts` | 113 | live / retained; exceptions itemized above | 1 |
| `server/test/boss3Matrix.test.ts` | 75, 103 | live / retained; exceptions itemized above | 4 |
| `server/test/boss4Matrix.test.ts` | 91 | live / retained; exceptions itemized above | 2 |
| `server/test/bossConcealmentPhase4.test.ts` | 61 | live / retained; exceptions itemized above | 1 |
| `server/test/bossCorpsesPhase6.test.ts` | 67 | live / retained; exceptions itemized above | 1 |
| `server/test/bossDeclaration.test.ts` | 30, 37 | live / retained; exceptions itemized above | 4 |
| `server/test/bossEncounterRework.test.ts` | 65 | live / retained; exceptions itemized above | 1 |
| `server/test/bossGeometryPhase1.test.ts` | 90 | live / retained; exceptions itemized above | 1 |
| `server/test/bossLineageSeams.test.ts` | 61 | live / retained; exceptions itemized above | 1 |
| `server/test/bossReferenceMatrix.test.ts` | 42 | live / retained; exceptions itemized above | 1 |
| `server/test/bossRework.test.ts` | 73 | live / retained; exceptions itemized above | 1 |
| `server/test/bossStatusPayoffPhase3.test.ts` | 66 | live / retained; exceptions itemized above | 1 |
| `server/test/bossTrenchPhase7.test.ts` | 51 | live / retained; exceptions itemized above | 1 |
| `server/test/bossVolcanoPhase5.test.ts` | 63 | live / retained; exceptions itemized above | 1 |
| `server/test/botBuildPreflight.test.ts` | 65 | live / retained; exceptions itemized above | 1 |
| `server/test/cadenceClassSelection.test.ts` | 56 | live / retained; exceptions itemized above | 1 |
| `server/test/caveEngageSequence.test.ts` | 66 | live / retained; exceptions itemized above | 1 |
| `server/test/caveGroundSlam.test.ts` | 75 | live / retained; exceptions itemized above | 1 |
| `server/test/characterIsolation.test.ts` | 53 | live / retained; exceptions itemized above | 1 |
| `server/test/chargeOnAggroVisual.test.ts` | 46 | live / retained; exceptions itemized above | 1 |
| `server/test/charmHooks.test.ts` | 2, 35, 43, 48, 152 | live / retained; exceptions itemized above | 5 |
| `server/test/classAffinity.test.ts` | 52, 109, 120 | live / retained; exceptions itemized above | 3 |
| `server/test/cleanseEvent.test.ts` | 72 | live / retained; exceptions itemized above | 1 |
| `server/test/clearingMastery.test.ts` | 56 | live / retained; exceptions itemized above | 1 |
| `server/test/combatTextCoverage.test.ts` | 49 | live / retained; exceptions itemized above | 1 |
| `server/test/combatTextResync.test.ts` | 66 | live / retained; exceptions itemized above | 1 |
| `server/test/compositionPairs.test.ts` | 100, 313 | live / retained; exceptions itemized above | 2 |
| `server/test/concurrencySampler.test.ts` | 56 | live / retained; exceptions itemized above | 1 |
| `server/test/conduitManualAbilities.test.ts` | 42 | live / retained; exceptions itemized above | 1 |
| `server/test/conduitPathFx.test.ts` | 49 | live / retained; exceptions itemized above | 1 |
| `server/test/coreAuthoring.test.ts` | 59, 114 | live / retained; exceptions itemized above | 2 |
| `server/test/coreCombat.test.ts` | 63, 79, 223, 227, 229, 242, 252 | live / retained; exceptions itemized above | 8 |
| `server/test/coreRangeGate.test.ts` | 159-162 | live / retained; exceptions itemized above | 9 |
| `server/test/coreRecoveryMult.test.ts` | 78 | live / retained; exceptions itemized above | 1 |
| `server/test/coreRelicIntegration.test.ts` | 39, 135, 167, 192, 196 | live / retained; exceptions itemized above | 5 |
| `server/test/cores.test.ts` | 56 | live / retained; exceptions itemized above | 1 |
| `server/test/corpseRaise.test.ts` | 56, 224 | live / retained; exceptions itemized above | 2 |
| `server/test/day2Packet.test.ts` | 8 | live / retained; exceptions itemized above | 1 |
| `server/test/day2SessionLifecycle.test.ts` | 59 | live / retained; exceptions itemized above | 1 |
| `server/test/deathAttribution.test.ts` | 62 | live / retained; exceptions itemized above | 1 |
| `server/test/deathCancelsOrders.test.ts` | 50 | live / retained; exceptions itemized above | 1 |
| `server/test/desertPairs.test.ts` | 61 | live / retained; exceptions itemized above | 1 |
| `server/test/desertStrategyPacket.test.ts` | 16, 21 | live / retained; exceptions itemized above | 3 |
| `server/test/dungeons.test.ts` | 84 | live / retained; exceptions itemized above | 1 |
| `server/test/durability32Matrix.test.ts` | 82, 97-98 | live / retained; exceptions itemized above | 5 |
| `server/test/durability33Matrix.test.ts` | 70, 78, 89 | live / retained; exceptions itemized above | 5 |
| `server/test/durability34Matrix.test.ts` | 76 | live / retained; exceptions itemized above | 2 |
| `server/test/durability35Matrix.test.ts` | 47 | live / retained; exceptions itemized above | 2 |
| `server/test/durability36Matrix.test.ts` | 60 | live / retained; exceptions itemized above | 3 |
| `server/test/eliteTargeting.test.ts` | 84 | live / retained; exceptions itemized above | 1 |
| `server/test/empoweredCap.test.ts` | 66 | live / retained; exceptions itemized above | 1 |
| `server/test/equippedEvolutionAbilityTags.test.ts` | 60, 93, 97-98, 189, 225, 244 | live / retained; exceptions itemized above | 7 |
| `server/test/evasion.test.ts` | 76 | live / retained; exceptions itemized above | 1 |
| `server/test/farmingStance.test.ts` | 15 | live / retained; exceptions itemized above | 1 |
| `server/test/farmLoop.test.ts` | 167 | live / retained; exceptions itemized above | 1 |
| `server/test/fastBossRetry.test.ts` | 64 | live / retained; exceptions itemized above | 1 |
| `server/test/finalDamageIntegration.test.ts` | 35, 115 | live / retained; exceptions itemized above | 2 |
| `server/test/fixtures/gameplayPlayer.ts` | 12 | live / retained; exceptions itemized above | 1 |
| `server/test/fixtures/packTestPlayer.ts` | 21 | live / retained; exceptions itemized above | 1 |
| `server/test/fixtures/v1d-earned-t1-state.json` | 95, 99, 124 | live / retained; exceptions itemized above | 3 |
| `server/test/fixtures/v1m-earned-t3-snapshot.json` | 24-27, 30, 282, 289, 320 | live / retained; exceptions itemized above | 8 |
| `server/test/forestT2BossSwipe.test.ts` | 51 | live / retained; exceptions itemized above | 1 |
| `server/test/forestT2CastedAbilities.test.ts` | 39, 83 | live / retained; exceptions itemized above | 2 |
| `server/test/formationPlatingCompensation.test.ts` | 59 | live / retained; exceptions itemized above | 1 |
| `server/test/frameLoops.test.ts` | 76 | live / retained; exceptions itemized above | 1 |
| `server/test/frameLoopsRanged.test.ts` | 92 | live / retained; exceptions itemized above | 1 |
| `server/test/guardCoveragePacket.test.ts` | 16 | live / retained; exceptions itemized above | 1 |
| `server/test/heatManagement.test.ts` | 90 | live / retained; exceptions itemized above | 1 |
| `server/test/hudStatusTooltips.test.ts` | 393 | live / retained; exceptions itemized above | 1 |
| `server/test/humanPlaytestRecorder.test.ts` | 23 | live / retained; exceptions itemized above | 1 |
| `server/test/instrumentParity.test.ts` | 88 | live / retained; exceptions itemized above | 1 |
| `server/test/inventoryStatSheet.test.ts` | 12 | live / retained; exceptions itemized above | 1 |
| `server/test/itemReachability.test.ts` | 6, 10, 15, 37 | live / retained; exceptions itemized above | 6 |
| `server/test/itemSourceOutliers.test.ts` | 35, 166, 174 | live / retained; exceptions itemized above | 3 |
| `server/test/jungleBushDetection.test.ts` | 62 | live / retained; exceptions itemized above | 1 |
| `server/test/jungleCastedAbilities.test.ts` | 43 | live / retained; exceptions itemized above | 1 |
| `server/test/keepDistanceRing.test.ts` | 76 | live / retained; exceptions itemized above | 1 |
| `server/test/keystones.test.ts` | 102 | live / retained; exceptions itemized above | 1 |
| `server/test/leanConditions.test.ts` | 96 | live / retained; exceptions itemized above | 1 |
| `server/test/legacyItemMigration.test.ts` | 21, 26-27, 35, 39, 41, 53 | live / retained; exceptions itemized above | 9 |
| `server/test/lineageCards.wiring.test.ts` | 98 | live / retained; exceptions itemized above | 1 |
| `server/test/lineageChaoticMiss.test.ts` | 92 | live / retained; exceptions itemized above | 1 |
| `server/test/lineageComposition.test.ts` | 96, 376 | live / retained; exceptions itemized above | 2 |
| `server/test/lineageDebuffComposition.test.ts` | 65 | live / retained; exceptions itemized above | 1 |
| `server/test/lineageDots.test.ts` | 63 | live / retained; exceptions itemized above | 1 |
| `server/test/lineageEconomy.test.ts` | 79 | live / retained; exceptions itemized above | 1 |
| `server/test/lineageListenerOrder.test.ts` | 57 | live / retained; exceptions itemized above | 1 |
| `server/test/lineageMaterials.test.ts` | 209 | live / retained; exceptions itemized above | 1 |
| `server/test/lineageParked.test.ts` | 105 | live / retained; exceptions itemized above | 1 |
| `server/test/lineagePayloadEvents.test.ts` | 74 | live / retained; exceptions itemized above | 1 |
| `server/test/lineagePersistence.test.ts` | 71, 82, 104, 124, 127, 134, 137-138, 142, 216, 257 | live / retained; exceptions itemized above | 11 |
| `server/test/lineagePlatingStack.test.ts` | 56 | live / retained; exceptions itemized above | 1 |
| `server/test/lineageReviewBlockers.test.ts` | 48 | live / retained; exceptions itemized above | 1 |
| `server/test/lineageReviewFollowups.test.ts` | 50 | live / retained; exceptions itemized above | 1 |
| `server/test/manualCombatControls.test.ts` | 99 | live / retained; exceptions itemized above | 1 |
| `server/test/manualPlayerMovement.test.ts` | 49 | live / retained; exceptions itemized above | 1 |
| `server/test/mechanicFired.test.ts` | 70 | live / retained; exceptions itemized above | 1 |
| `server/test/mobilityBoots.test.ts` | 86, 207, 211 | live / retained; exceptions itemized above | 3 |
| `server/test/monsterDeathEffects.test.ts` | 58 | live / retained; exceptions itemized above | 1 |
| `server/test/monsterDotBuffIcons.test.ts` | 58, 107 | live / retained; exceptions itemized above | 2 |
| `server/test/monsterEmpoweredBeat.test.ts` | 58 | live / retained; exceptions itemized above | 1 |
| `server/test/monsterMobileCast.test.ts` | 75 | live / retained; exceptions itemized above | 1 |
| `server/test/mountainT2ChargedDefenses.test.ts` | 39 | live / retained; exceptions itemized above | 1 |
| `server/test/navWaypointWedge.test.ts` | 61 | live / retained; exceptions itemized above | 1 |
| `server/test/nodeFeatureRegenSuppression.test.ts` | 75 | live / retained; exceptions itemized above | 1 |
| `server/test/onHitMitigation.test.ts` | 31, 62, 69, 91 | live / retained; exceptions itemized above | 4 |
| `server/test/overnightEndurance.test.ts` | 16 | live / retained; exceptions itemized above | 1 |
| `server/test/personalPlaytestPolish.test.ts` | 36 | live / retained; exceptions itemized above | 1 |
| `server/test/phase0RecoveryArms.test.ts` | 54-55 | live / retained; exceptions itemized above | 4 |
| `server/test/plainsHawkDiveBomb.test.ts` | 37 | live / retained; exceptions itemized above | 1 |
| `server/test/playerPoolFactor.test.ts` | 76 | live / retained; exceptions itemized above | 1 |
| `server/test/progressionCheckpoint.test.ts` | 58 | live / retained; exceptions itemized above | 1 |
| `server/test/rangeMechanics.test.ts` | 96 | live / retained; exceptions itemized above | 1 |
| `server/test/recovery.test.ts` | 95 | live / retained; exceptions itemized above | 1 |
| `server/test/regionalRespawn.test.ts` | 53 | live / retained; exceptions itemized above | 1 |
| `server/test/relicMechanicEffectCoverage.test.ts` | 84, 137 | live / retained; exceptions itemized above | 2 |
| `server/test/relics.test.ts` | 45, 76 | live / retained; exceptions itemized above | 2 |
| `server/test/resetProgress.test.ts` | 64, 137 | live / retained; exceptions itemized above | 2 |
| `server/test/rewardMultiplier.test.ts` | 71 | live / retained; exceptions itemized above | 1 |
| `server/test/rhythmReadout.test.ts` | 83 | live / retained; exceptions itemized above | 1 |
| `server/test/rites.test.ts` | 35 | live / retained; exceptions itemized above | 1 |
| `server/test/runeClassMaintenance.test.ts` | 63 | live / retained; exceptions itemized above | 1 |
| `server/test/runeDynamicHazardAvoidance.test.ts` | 81 | live / retained; exceptions itemized above | 1 |
| `server/test/runeFormationBroken.test.ts` | 33 | live / retained; exceptions itemized above | 1 |
| `server/test/runeMaintenance.test.ts` | 69 | live / retained; exceptions itemized above | 1 |
| `server/test/runeRecipeDeprecation.test.ts` | 65 | live / retained; exceptions itemized above | 1 |
| `server/test/runeTargetingPreference.test.ts` | 89 | live / retained; exceptions itemized above | 1 |
| `server/test/runeTelegraphEvasion.test.ts` | 77 | live / retained; exceptions itemized above | 1 |
| `server/test/runeWaitItOut.test.ts` | 90 | live / retained; exceptions itemized above | 1 |
| `server/test/sanctuaryAltar.test.ts` | 58 | live / retained; exceptions itemized above | 1 |
| `server/test/secondaryDamageConsistency.test.ts` | 53 | live / retained; exceptions itemized above | 1 |
| `server/test/slotRetirement.test.ts` | 2, 5, 7, 12, 14, 22-23, 52, 93, 106, 113, 121, 124, 131-132, 136, 141, 144, 161, 164, 170, 172, 174, 188, 215 | live / retained; exceptions itemized above | 31 |
| `server/test/spectatorManager.test.ts` | 148 | live / retained; exceptions itemized above | 1 |
| `server/test/spectatorSnapshot.test.ts` | 54 | live / retained; exceptions itemized above | 1 |
| `server/test/stances.test.ts` | 54 | live / retained; exceptions itemized above | 1 |
| `server/test/stancesUnplaced.test.ts` | 93 | live / retained; exceptions itemized above | 1 |
| `server/test/summonerAreaAttrition.test.ts` | 39 | live / retained; exceptions itemized above | 1 |
| `server/test/summonerMitigation.test.ts` | 32 | live / retained; exceptions itemized above | 1 |
| `server/test/summonerOverhaul.test.ts` | 51 | live / retained; exceptions itemized above | 1 |
| `server/test/summonerRuneBehaviors.test.ts` | 59 | live / retained; exceptions itemized above | 1 |
| `server/test/summonerRuneTargeting.test.ts` | 37 | live / retained; exceptions itemized above | 1 |
| `server/test/summonerSpecializations.test.ts` | 67 | live / retained; exceptions itemized above | 1 |
| `server/test/summonerSprites.test.ts` | 64 | live / retained; exceptions itemized above | 1 |
| `server/test/t2ProgressionEconomy.test.ts` | 7, 25, 57, 66, 69, 77, 80, 82, 85, 90, 93, 96, 101-103, 168, 172, 177 | live / retained; exceptions itemized above | 22 |
| `server/test/t3ProgressionEconomy.test.ts` | 8, 27, 162, 167, 177, 191, 245, 259, 261, 269, 277-278, 281, 284-285, 287-289, 293, 300-301, 304, 313-314, 317, 321, 323, 325, 343-344, 360-361, 390, 438, 441-446, 478, 481-487 | live / retained; exceptions itemized above | 55 |
| `server/test/t4ProgressionEconomy.test.ts` | 6, 42, 95, 97, 107, 109, 177, 187-188, 205, 249, 268, 370, 402 | live / retained; exceptions itemized above | 19 |
| `server/test/targetPriority.test.ts` | 57 | live / retained; exceptions itemized above | 1 |
| `server/test/tier2SkillPropagation.test.ts` | 25, 30 | live / retained; exceptions itemized above | 2 |
| `server/test/tierEntryBootstrap.test.ts` | 21, 52, 105, 160, 177-178, 181, 227-229 | live / retained; exceptions itemized above | 11 |
| `server/test/tierUpRecalc.test.ts` | 57 | live / retained; exceptions itemized above | 1 |
| `server/test/tombstones.test.ts` | 54 | live / retained; exceptions itemized above | 1 |
| `server/test/travelDiscovery.test.ts` | 66 | live / retained; exceptions itemized above | 1 |
| `server/test/travelFightBack.test.ts` | 70 | live / retained; exceptions itemized above | 1 |
| `server/test/trenchMonsterAbilities.test.ts` | 53 | live / retained; exceptions itemized above | 1 |
| `server/test/tundraChill.test.ts` | 77 | live / retained; exceptions itemized above | 1 |
| `server/test/tundraClassFramePacket.test.ts` | 19 | live / retained; exceptions itemized above | 1 |
| `server/test/tundraDeepFreeze.test.ts` | 66 | live / retained; exceptions itemized above | 1 |
| `server/test/upgradeRefundMigration.test.ts` | 3, 38, 52-54, 66, 71, 80, 88 | live / retained; exceptions itemized above | 9 |
| `server/test/viabilityFloor.test.ts` | 118 | live / retained; exceptions itemized above | 2 |
| `server/test/voidwalkerDischarge.test.ts` | 35 | live / retained; exceptions itemized above | 1 |
| `server/test/wave1AbilityReadability.test.ts` | 47 | live / retained; exceptions itemized above | 1 |
| `server/test/weaponPage.test.ts` | 179, 267 | live / retained; exceptions itemized above | 2 |
| `server/test/weaponReachability.test.ts` | 4, 6, 44, 46, 58 | live / retained; exceptions itemized above | 5 |
| `server/test/weaponReservoirAbilities.test.ts` | 54 | live / retained; exceptions itemized above | 1 |
| `server/tsconfig.test.json` | 6, 50, 52 | live / retained; exceptions itemized above | 3 |
| `shared/src/abilities.ts` | 253 | live / retained; exceptions itemized above | 2 |
| `shared/src/components/core/networkedSlices.ts` | 357, 439 | live / retained; exceptions itemized above | 4 |
| `shared/src/components/targeting/isRaised.ts` | 5 | live / retained; exceptions itemized above | 1 |
| `shared/src/config/gameConfig.ts` | 218, 239, 241-242, 244, 246, 248, 250, 291-293, 296-298, 303, 438 | live / retained; exceptions itemized above | 16 |
| `shared/src/data/lineages/axe.ts` | 32 | live / protected; list only | 1 |
| `shared/src/data/lineages/broadsword.ts` | 47 | live / protected; list only | 1 |
| `shared/src/data/lineages/capstones.ts` | 4 | live / protected; list only | 1 |
| `shared/src/data/lineages/composition.test.ts` | 96-97, 459-460 | live / protected; list only | 4 |
| `shared/src/data/lineages/dagger.ts` | 42 | live / protected; list only | 1 |
| `shared/src/data/lineages/hammer.ts` | 42 | live / protected; list only | 1 |
| `shared/src/data/lineages/index.ts` | 100 | live / protected; list only | 1 |
| `shared/src/data/lineages/magnitudes.ts` | 23, 766-768, 772, 780, 793 | live / protected; list only | 7 |
| `shared/src/data/lineages/packets.ts` | 51 | live / protected; list only | 1 |
| `shared/src/data/lineages/rapier.ts` | 52 | live / protected; list only | 1 |
| `shared/src/data/lineages/resolve.ts` | 199 | live / protected; list only | 1 |
| `shared/src/data/lineages/types.ts` | 564, 622, 664 | live / protected; list only | 3 |
| `shared/src/data/monsters/bossesT1.ts` | 10, 254 | live / retained; exceptions itemized above | 2 |
| `shared/src/data/monsters/bossesT3.ts` | 7 | live / retained; exceptions itemized above | 1 |
| `shared/src/data/monsters/cave.monsters.ts` | 121, 243 | live / retained; exceptions itemized above | 2 |
| `shared/src/data/monsters/forest.monsters.ts` | 123 | live / retained; exceptions itemized above | 1 |
| `shared/src/data/monsters/jungle.monsters.ts` | 81, 137, 155, 166 | live / retained; exceptions itemized above | 4 |
| `shared/src/data/monsters/mountain.monsters.ts` | 190, 276, 285 | live / retained; exceptions itemized above | 3 |
| `shared/src/data/monsters/swamp.monsters.ts` | 180, 188, 200, 203, 211, 226 | live / retained; exceptions itemized above | 7 |
| `shared/src/data/monsters/trench.monsters.ts` | 128 | live / retained; exceptions itemized above | 1 |
| `shared/src/data/monsters/tundra.monsters.ts` | 215, 236, 243 | live / retained; exceptions itemized above | 3 |
| `shared/src/data/monsters/types.ts` | 897, 918, 1400 | live / retained; exceptions itemized above | 3 |
| `shared/src/data/monsters/volcano.monsters.ts` | 200, 218, 225, 240, 253, 273 | live / retained; exceptions itemized above | 6 |
| `shared/src/data/recipeGates.test.ts` | 11-12, 64, 84, 86, 90 | live / retained; exceptions itemized above | 6 |
| `shared/src/data/recipes/cave.recipes.ts` | 25, 27, 31, 44, 51-52, 65-66, 83, 93, 97, 101-103, 111, 123-124, 136, 151-154 | live / retained; exceptions itemized above | 29 |
| `shared/src/data/recipes/clearing.recipes.ts` | 6 | live / retained; exceptions itemized above | 1 |
| `shared/src/data/recipes/desert.recipes.ts` | 26-27, 31, 40-41, 79, 90-92, 115, 149, 158-159, 161-162, 167-168, 191, 230 | live / retained; exceptions itemized above | 20 |
| `shared/src/data/recipes/forest.recipes.ts` | 19, 21, 25, 30, 47, 55-56, 61, 68-69, 90, 99, 105, 108-111, 113-115, 119, 122-123, 134-136, 150, 161 | live / retained; exceptions itemized above | 38 |
| `shared/src/data/recipes/graveyard.recipes.ts` | 9, 17-18, 25, 81, 89, 95 | live / retained; exceptions itemized above | 7 |
| `shared/src/data/recipes/jungle.recipes.ts` | 21-22, 26, 58, 69, 71, 74-75, 113, 122-124, 129-130, 178 | live / retained; exceptions itemized above | 16 |
| `shared/src/data/recipes/mountain.recipes.ts` | 41, 43, 47, 57, 62-63, 75-76, 91, 104, 108, 112-113, 117, 127, 139, 151, 163, 165-166, 170-171, 216-217, 219, 226-227, 237-238 | live / retained; exceptions itemized above | 37 |
| `shared/src/data/recipes/plains.recipes.ts` | 18, 28, 33, 35, 39, 55-56, 69-70, 88-89, 101, 105-107, 112, 116-117, 130, 143, 155, 194, 209 | live / retained; exceptions itemized above | 29 |
| `shared/src/data/recipes/recipeCurve.test.ts` | 1, 35, 41 | live / retained; exceptions itemized above | 3 |
| `shared/src/data/recipes/swamp.recipes.ts` | 28, 30, 34, 47, 52-53, 67-68, 83, 96, 100, 105-106, 117, 134, 146, 163, 166-168 | live / retained; exceptions itemized above | 28 |
| `shared/src/data/recipes/trench.recipes.ts` | 10, 17-18, 24, 51, 69, 77, 85 | live / retained; exceptions itemized above | 8 |
| `shared/src/data/recipes/tundra.recipes.ts` | 13-15, 22, 32, 36, 67, 75-76, 84-85, 102-103, 106, 155 | live / retained; exceptions itemized above | 16 |
| `shared/src/data/recipes/types.ts` | 75, 87, 91-92, 94, 96, 98-99 | live / retained; exceptions itemized above | 9 |
| `shared/src/data/recipes/volcanic.recipes.ts` | 8, 16, 29, 40, 57, 73, 81-83, 92-93, 107-108, 112, 159, 171, 174-175, 177, 183 | live / retained; exceptions itemized above | 21 |
| `shared/src/data/recipes/weaponCurve.test.ts` | 4-6, 10, 15, 37, 107, 110, 120 | live / retained; exceptions itemized above | 9 |
| `shared/src/data/skillTree/rootsAndFrames.ts` | 59, 464 | live / retained; exceptions itemized above | 2 |
| `shared/src/data/skillTree/t3CombatA.ts` | 139, 185 | live / retained; exceptions itemized above | 2 |
| `shared/src/index.ts` | 38, 40 | live / retained; exceptions itemized above | 2 |
| `shared/src/itemDatabase.ts` | 27 | live / retained; exceptions itemized above | 2 |
| `shared/src/items.ts` | 207-208 | live / retained; exceptions itemized above | 3 |
| `shared/src/passives.ts` | 668, 754 | live / retained; exceptions itemized above | 2 |
| `shared/src/protocol/socketEvents.ts` | 4, 144, 191, 291-292, 294, 296 | live / retained; exceptions itemized above | 10 |
| `shared/src/protocol/tier1Snapshot.test.ts` | 48 | live / retained; exceptions itemized above | 1 |
| `shared/src/protocol/tier1Snapshot.ts` | 10, 22, 25, 130, 292-293, 334 | live / retained; exceptions itemized above | 8 |
| `shared/src/protocol/tierEntry.ts` | 73, 101 | live / retained; exceptions itemized above | 2 |
| `shared/src/protocol/views.ts` | 116, 402 | live / retained; exceptions itemized above | 3 |
| `shared/src/riteRecipes.ts` | 14-15, 19, 28 | live / retained; exceptions itemized above | 4 |
| `shared/src/runeDatabase.ts` | 66 | live / retained; exceptions itemized above | 1 |
| `shared/src/sprites/frameMaps.ts` | 3 | live / retained; exceptions itemized above | 1 |
| `shared/src/stanceRecipes.ts` | 23-24 | live / retained; exceptions itemized above | 3 |
| `shared/src/systems/balanceLab.ts` | 11, 436, 440, 460 | live / retained; exceptions itemized above | 4 |
| `shared/src/systems/equipmentPreview.ts` | 13, 41 | live / retained; exceptions itemized above | 3 |
| `shared/src/systems/evolution.ts` | 5, 7-8, 13, 15, 18, 22, 26, 29, 31-32, 35, 41, 43, 45-46, 50, 53, 62 | live / retained; exceptions itemized above | 23 |
| `shared/src/systems/itemUpgrades.test.ts` | 10, 23, 61, 69, 71, 99 | live / retained; exceptions itemized above | 6 |
| `shared/src/systems/itemUpgrades.ts` | 10, 12-14, 22, 37-40, 43-44, 163, 166, 171, 205-206 | live / retained; exceptions itemized above | 17 |
| `shared/src/systems/lineages.test.ts` | 3, 88 | live / retained; exceptions itemized above | 2 |
| `shared/src/systems/lineages.ts` | 5-6, 285 | live / retained; exceptions itemized above | 3 |
| `shared/src/systems/relicEquipment.test.ts` | 1, 3, 28, 38, 40, 42-43, 45, 47 | live / retained; exceptions itemized above | 10 |
| `shared/src/systems/stats.ts` | 16, 204, 327 | live / retained; exceptions itemized above | 3 |
| `shared/src/systems/t1EconomyExperiment.ts` | 17, 23-24, 52, 60, 68, 76, 95-97, 102-103, 105, 107, 112, 127 | live / retained; exceptions itemized above | 16 |
| `shared/src/tutorial/conditions.ts` | 27 | live / protected; list only | 1 |
| `shared/src/tutorial/scripts/classScript.ts` | 77 | live / protected; list only | 1 |
| `shared/src/tutorial/scripts/plans.ts` | 11 | live / protected; list only | 2 |
| `shared/src/tutorial/tutorial.test.ts` | 64 | live / protected; list only | 1 |
| `shared/src/world/map/types.ts` | 35 | live / retained; exceptions itemized above | 1 |
| `shared/src/world/nodeModifierMap.ts` | 5 | live / retained; exceptions itemized above | 1 |
| `shared/src/world/nodeModifiers.test.ts` | 18, 24 | live / retained; exceptions itemized above | 2 |
| `shared/src/world/nodeModifiers.ts` | 19 | live / retained; exceptions itemized above | 1 |
| `shared/src/world/nodeModifierTypes.ts` | 10, 60 | live / retained; exceptions itemized above | 2 |
| `tools/balance-tui/src/ui/histogram.rs` | 122 | live / retained; exceptions itemized above | 1 |
| `tools/dps-report.ts` | 464, 2350 | live / retained; exceptions itemized above | 3 |
| `tools/ehp-report.ts` | 472, 475, 492 | live / retained; exceptions itemized above | 3 |
| `tools/mob-report.ts` | 409, 413, 433, 618 | live / retained; exceptions itemized above | 4 |
| `tools/pixellab/README.md` | 77 | docs | 1 |
| `tools/pixellab/seed.ts` | 71 | live / retained; exceptions itemized above | 1 |
| `tools/telemetry-mcp/pnpm-lock.yaml` | 494, 570, 575, 761 | live / retained; exceptions itemized above | 4 |
| `tools/tier-table.ts` | 496, 580, 603 | live / retained; exceptions itemized above | 4 |
| `updates/v0.5/changelog.md` | 105, 162, 183, 221, 224, 226, 268, 284 | docs (historical evidence) | 9 |
| `updates/v0.6.1/changelog.md` | 51 | docs (historical evidence) | 2 |
| `updates/v0.6/changelog.md` | 129, 133-134, 141-142, 224 | docs (historical evidence) | 6 |
