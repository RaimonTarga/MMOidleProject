# Volcano nerf experiment — local develop, 2026-09-25

Current candidate applies all six study values. No commit, push or deployment was performed.

## Assessment

The results corroborate a targeted damage reduction, but not a claim that Volcano is now balanced for every class. Keep the applied six-value candidate for local playtesting. Do not add the proposed fallback pack-size reduction from these results alone.

- Ten-minute Volcano survival improves from 5/12 original to 7/12 full. T3 improves 1/6 to 2/6; T4 improves 4/6 to 5/6. The original T3 survivor stops making damage progress for its final 348.8 seconds; both full T3 survivors make progress through the final minute.
- T3 Striker survival increases from 56.4 to 382.3 seconds and 35.4 to 577.5 seconds. Heat-only reaches just 81.2 and 37.3 seconds, so reducing Ash Salamander attack contributes substantially in these two matched packages.
- T4 full survival beats Heat-only (5/6 versus 3/6). Full takes less HP damage than original in all six equal-observation windows, but those trajectories include changed targeting and a recovered stall, so this is not a direct estimate of the coefficient's isolated effect.
- T3 Conduit dies in both seeds under every arm; one full run kills zero enemies versus three originally, and the other dies slightly earlier despite more kills. T4 Conduit still dies in one full seed, although survival rises from 51.1 to 417.0 seconds. Conduit remains a follow-up diagnostic, not a solved outcome.
- More total work is completed (1,048 original versus 1,512 full kills), partly because lives last longer. This is not a 44% equal-duration farming-rate improvement. T4 Slinger seed 101009 loses work (263 to 145 kills) while experiencing a 237.1-second no-HP-progress gap; it later resumes. The gap is measured; its navigation cause is not established here.
- Same-package Tundra controls survive 5/6 at T3 and 6/6 at T4. This is contextual evidence that Volcano remains demanding, not a universal biome ranking: ecology, modifiers, encounter counts and build matchups differ.
- Boss outcomes do not change: T3 Striker dies at 14.2/17.2 seconds; T4 Striker kills the boss at 28.0 seconds in both arms. This narrow boundary does not validate every class or boss strategy.

Next useful investigation: inspect T3 Conduit owner/summon damage and target delivery in the failing seeds, and separately diagnose the long no-progress windows. Arrival builds, additional classes/modifiers, and longer endurance remain untested.

## Design

52 planned sequential fresh-process observations: 36 Volcano farming lives (12 matched baseline / Heat-only / full triples), 12 same-package Tundra contextual controls, and four Striker Volcano boss boundaries. Farming cap 600 seconds; boss cap 300 seconds; 100 ms ticks; seeds 101009 and 101021. Mature balanced Striker, Slinger, Conduit; T4 specialization b. Starting HP/barrier full, native fresh summons, no rites and no Manage Heat rule. Equipment, skills, behavior and starting geometry match within each treatment comparison. Mastery is fixed to prevent a progression feedback treatment. These are synthetic prepared packages, not measured arrival builds.

Baseline restores only the six old values in memory before world construction; Heat-only restores the five monster values. Full uses the applied local source. All farming arms retain native repopulation, movement, hazards and pack behavior. Boss setup wakes the native boss without fighting guardians. Source hashes, actual player/equipment/RP readbacks, hitboxes and initial geometry are retained in the external raw directory.

## Farming outcomes

Kills below are total observed work, including death-shortened lives; they are not equal-duration throughput. Progress survivor means the cap was reached and owner/summon HP damage occurred in the final minute.

| Tier / biome | Arm | Valid | Survived 10 min | Progress survivors | Deaths | Kills | Observed seconds |
|---|---|---:|---:|---:|---:|---:|---:|
| T3 volcanic | baseline | 6 | 1 | 0 | 5 | 110 | 993.3 |
| T3 volcanic | heat | 6 | 2 | 2 | 4 | 267 | 1451.5 |
| T3 volcanic | full | 6 | 2 | 2 | 4 | 459 | 2299.2 |
| T3 tundra | baseline | 6 | 5 | 5 | 1 | 202 | 3144.3 |
| T4 volcanic | baseline | 6 | 4 | 4 | 2 | 938 | 2857.8 |
| T4 volcanic | heat | 6 | 3 | 2 | 3 | 890 | 2542.4 |
| T4 volcanic | full | 6 | 5 | 5 | 1 | 1053 | 3417.0 |
| T4 tundra | baseline | 6 | 6 | 6 | 0 | 261 | 3600.0 |

## Individual Volcano comparisons

| Case | Original seconds / kills | Heat-only seconds / kills | Full seconds / kills |
|---|---:|---:|---:|
| T3 striker 101009 | 56.4 / 19 | 81.2 / 24 | 382.3 / 92 |
| T3 striker 101021 | 35.4 / 9 | 37.3 / 9 | 577.5 / 133 |
| T3 slinger 101009 | 600.0 / 42 (cap) | 600.0 / 105 (cap) | 600.0 / 117 (cap) |
| T3 slinger 101021 | 170.5 / 27 | 600.0 / 116 (cap) | 600.0 / 101 (cap) |
| T3 conduit 101009 | 14.5 / 3 | 14.5 / 3 | 27.3 / 0 |
| T3 conduit 101021 | 116.5 / 10 | 118.5 / 10 | 112.1 / 16 |
| T4 striker 101009 | 406.7 / 134 | 548.3 / 188 | 600.0 / 213 (cap) |
| T4 striker 101021 | 600.0 / 164 (cap) | 600.0 / 118 (cap) | 600.0 / 209 (cap) |
| T4 slinger 101009 | 600.0 / 263 (cap) | 600.0 / 284 (cap) | 600.0 / 145 (cap) |
| T4 slinger 101021 | 600.0 / 244 (cap) | 600.0 / 259 (cap) | 600.0 / 255 (cap) |
| T4 conduit 101009 | 600.0 / 119 (cap) | 141.3 / 30 | 600.0 / 139 (cap) |
| T4 conduit 101021 | 51.1 / 14 | 52.8 / 11 | 417.0 / 92 |

## Equal observation windows

Both arms truncated at the earlier terminal time. Trajectories can diverge, so damage totals reflect targeting, mitigation, recovery and survival changes, not just coefficient changes. HP and absorbed amounts are separate in JSON.

| Pair | Window seconds | Original HP damage taken | Candidate HP damage taken | Original kills | Candidate kills |
|---|---:|---:|---:|---:|---:|
| T3 striker 101009 | 56.4 | 1425.8 | 1115.0 | 19 | 20 |
| T3 striker 101021 | 35.4 | 853.5 | 726.9 | 9 | 10 |
| T3 slinger 101009 | 600.0 | 2789.9 | 5011.2 | 42 | 117 |
| T3 slinger 101021 | 170.5 | 1890.5 | 1179.8 | 27 | 26 |
| T3 conduit 101009 | 14.5 | 620.0 | 0.0 | 3 | 0 |
| T3 conduit 101021 | 112.1 | 346.0 | 1203.0 | 8 | 16 |
| T4 striker 101009 | 406.7 | 13516.2 | 9814.4 | 134 | 147 |
| T4 striker 101021 | 600.0 | 15292.1 | 13270.0 | 164 | 209 |
| T4 slinger 101009 | 600.0 | 5428.2 | 1688.8 | 263 | 145 |
| T4 slinger 101021 | 600.0 | 7212.9 | 1384.5 | 244 | 255 |
| T4 conduit 101009 | 600.0 | 8805.6 | 3791.7 | 119 | 139 |
| T4 conduit 101021 | 51.1 | 1941.0 | 1094.0 | 14 | 14 |

## Progress gaps

Full HP and survival do not establish continuous farming. The following lives have at least one 60-second span without owner/summon HP damage to monsters (including a possible final tail). Some recover and resume; these are not all terminal stalls.

| Case | Longest HP-progress gap, seconds |
|---|---:|
| farm-t3-volcanic-slinger-101009-baseline | 348.8 |
| farm-t4-volcanic-striker-101021-baseline | 78.6 |
| farm-t4-volcanic-striker-101021-heat | 221.6 |
| farm-t4-volcanic-slinger-101009-full | 237.1 |

## Boss boundary

| Tier | Arm | Outcome | Seconds | Kills including adds |
|---|---|---|---:|---:|
| 3 | baseline | player-died | 14.2 | 0 |
| 3 | full | player-died | 17.2 | 0 |
| 4 | baseline | boss-killed | 28.0 | 1 |
| 4 | full | boss-killed | 28.0 | 1 |

## Limits and evidence

- Mature synthetic packages only; not acquisition or live player evidence.
- Three balanced class packages per tier; T4 path b.
- Ten-minute farming caps and one modifier fixture per biome; no isolated-pack experiment.
- Boss boundary covers Striker only, one seed per tier; guardian setup bypassed.
- Common-time damage compares evolving trajectories, not identical attack sequences.
- Death clears Heat; terminalHeat zero on a dead player is not pre-death Heat.
- Completion: 52/52; execution failures 0; wall-censored 0.
- 26 available paired geometry/player identities verified.
- Raw evidence: D:\mmo-idle\volcano-area-nerf-2026-09-25\run-01
- Source HEAD: ff98ba4513cb9fcb1e5752acfd56495268aff416, plus the working changes recorded in working.diff.
- Hitboxes SHA-256: 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83

See experiment-results.json for individual damage sources, endpoints, Heat exposure and no-progress tails. See experiment-inventory.json for raw-file paths, sizes and hashes.

## Verification and retained source

- PASS: `ambientRamp.test.ts`, `biomeEcologyPolish.test.ts`, `heatManagement.test.ts`, `bossVolcanoPhase5.test.ts`.
- PASS: `pnpm typecheck` including benches; `pnpm build` across shared/client/admin/server. Build emits the existing large-chunk warnings.
- All 406 experiment hitbox rows match the current checkout's newly baked rows; ordering is immaterial. `hitbox-current-comparison.json` retains the comparison.
- The dispatcher verified its captured source-file hashes before every observation and after the final observation; no source drift interrupted the run. Initial geometry/player identities match in all 26 available arm comparisons.
- Original mixed line endings were restored after execution, with normalized text equality asserted before writing, so the final gameplay diff remains six numeric changes plus one comment update. The raw source hash reflects the bytes at execution time.
- `executed-runner.ts` and `executed-driver.mjs` preserve the actual executed harness. After completion the runner's buffered position sample was changed to copy the coordinate object. Historical buffered coordinates are advisory and were not used for exact path diagnosis; event-based damage, kill timing, HP, Heat and initial geometry receipts are unaffected. No combat observations were rerun.
- Full test suite and browser/production playtesting were not run. All changes remain local and uncommitted on `develop`; unrelated working changes were preserved.
