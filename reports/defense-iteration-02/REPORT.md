# Defense iteration 02 — experimental, unmerged

Retain the Plaguebound Mantle anti-swarm candidate for further playtesting. Hold the Desert duration and Jungle evade-strength candidates. This iteration does not establish that the broad defense redesign is ready to ship.

## Matched bot results

Each row is one fixed class/loadout, environment and seed, ending at first death or 180 seconds. All use the latest candidate cores and the same imported Volcano nerfs. Six classes were screened at T3 and with Graveyard/Trench T4; Jungle T4 covers Squire and Slinger only. These are synthetic mature-mastery, +3 equipment farming fixtures, not acquisition, boss or human-play evidence.

| Armor candidate | Initial deaths | Fresh-seed deaths | Initial kills | Fresh-seed kills | Decision |
|---|---:|---:|---:|---:|---|
| Desert T3: opening 6 to 10 seconds | 18 → 16 / 24 | 30 → 32 / 48 | 203 → 247 | 375 → 403 | Hold |
| Jungle T3: evade mitigation +25 to +30 points | 16 → 14 / 24 | 24 → 25 / 48 | 257 → 272 | 565 → 548 | Hold |
| Jungle T4: evade mitigation +30 to +35 points | 2 → 0 / 8 | 3 → 3 / 16 | 169 → 179 | 306 → 327 | Hold pending broader class coverage |
| Plaguebound Mantle: reactive plating up to 10 | 7 → 4 / 24 | 16 → 10 / 48 | 747 → 828 | 1421 → 1573 | Retain isolated candidate |

Initial Cave and Trench controls reproduced their outcomes and kill totals exactly. The first comparison contains 128 rows per arm; the four-fresh-seed comparison contains 160 per arm. There are 576 comparison observations. Another 128-row baseline completed before fixing mutable status-effect snapshots in the diagnostic sampler; that earlier run is preserved but excluded from analysis. `RESULTS.json` includes individual survival reversals rather than hiding them in totals.

## Interpretation

Graveyard's failing Squire trace ended on a normal Bone Rat hit of 31.45 damage at 29.9 seconds. The preceding direct hits were small and frequent; remaining debt was modest. Restoring a bounded anti-swarm response rescued both initial failing Squire home runs and three additional home failures on fresh seeds. Across the two comparisons the Mantle improves 23 to 14 deaths and 2168 to 2401 kills. Some Volcano and Conduit rows regress: this is encouraging evidence, not universal superiority.

The original Graveyard source comment claimed +30 reactive plating, but actual baseline authoring was +1 per hit capped at five stacks. Its ordinary armor plating and upgrade plating supplied much of its old power. The new candidate has no unconditional armor plating, retains the prior prototype's HP/DR/debt/ailment resistance, and earns +2 per direct damaging hit up to five stacks for four seconds. The existing runtime does not multiply this temporary bonus by class plating multipliers. Grave Ward remains the separate debt specialist.

Desert's six-second opening has low uptime in sustained engagements. Extending it alone did not reliably solve this: fresh-seed deaths increased even as kills increased. Next design work should compare a modest sustained defensive foundation against a deliberately limited opening burst, measuring engagement uptime. Target switching must not provide free permanent protection.

Jungle's five-point strength increase does not address every failure between evades. T3 fresh seeds worsened slightly; T4 is promising but sampled only two classes. Keep current values while testing evasion frequency and survivability between evades separately. Forest was not changed or tested this iteration. Do not generalize these outcomes to all armor tiers.

## Volcano and scope

Imported the other agent's exact Heat and monster changes in commit 92acfd3, before both arms. Heat incoming scaling is 3.5% per effective stack; T3 Ash Salamander attack is 70; T4 Ember Skink attack/Burn is 60/8; T4 Ashspitter Salamander attack/Burn is 95/12. Final Eruption is unchanged. These tests measure armor choices inside the revised Volcano; they do not measure the nerf against the old Volcano or qualify its boss.

No core, class, damage-cap, debt-pipeline or monster changes were added by this armor iteration. Desert/Jungle experiment source is preserved under `candidate-source`, but reverted in gameplay source. Only the Mantle change is retained in the isolated candidate worktree. Nothing was merged, pushed or deployed.

## Reproduction and validation

`server/bench/defenseIteration.ts` creates isolated in-memory Worlds, seeds randomness and simulation time, captures the runner/source diff in each manifest, refuses existing output directories, and writes terminal completion receipts. `DEFENSE_FRESH_SEEDS=1` selects four fresh seeds; `DEFENSE_CASE_PATTERN` selects armor cases. `DEFENSE_PREFLIGHT=1` validates fixture construction without fights. `node reports/defense-iteration-02/analyze.cjs` regenerates matched summaries from preserved local raw runs.

Passed: defenseRedesign, ambientRamp, coreAuthoring; workspace typecheck including bench typecheck; server build. Full suite, browser, production telemetry and human playtests were not run. No defense bot remained running after interruption recovery; all four comparison runs had complete receipts.
