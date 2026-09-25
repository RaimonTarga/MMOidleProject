Completed results: [Results and revised recommendation](RESULTS.md).

# Iteration 02 — original T1 XP and historical surviving loadouts

Requested 2026-09-25. T1's XP segment is restored to **1,750** in the isolated candidate; its existing local shares and XP rewards are unchanged. T2–T4 begin this iteration at 18,000 / 42,000 / 108,000. The first screen keeps candidate essence, catalyst and price changes constant to separate the XP correction from later economic decisions.

## Setup selection

The local historical campaigns contain surviving setups. `select-setups.mjs` reads the original manifests/results from `D:/mmo-idle/overnight-t1-t3-progression-01/run-01` and `D:/mmo-idle/t4-overnight-closing-pass-01/run-01`. It retains primary/control farming setups that survived their horizon in both original seeds and maintained at least two kills/minute in the last reported interval. The original campaigns are read-only and are not being replayed or modified.

The new screen selects eight setups before observing its outcomes: T1 Plains Striker; T2 Jungle balanced Squire and Desert heavy Striker; T3 Swamp balanced Squire and Tundra heavy Squire; T4 Tundra balanced Conduit, Desert heavy Striker and Volcanic heavy Striker. These cover different encounters and supported loadouts rather than every class or biome. Each has baseline/candidate arms and seeds 101009/101033: 32 new simulations. Horizons are 15/45/90/150 simulated minutes by tier, with first-death termination and no retries within the screen.

## What changes from the historical fixture

`prepareSurveyBot` restores and validates the exact historical equipment, upgrades, skills, stance, guards and Rune rules against the current source before measurement. This uses safe navigation-grid spawning as in the original campaign, rather than substituting native gear or the default Rune loadout.

The old fixture froze biome mastery. The new harness removes that freeze, resets only the tested biome to the start of its current-tier segment, initializes XP consistently for every biome, and checks that the preserved loadout still fits the resulting RP budget. Other biome levels remain the historical snapshot, not universal mastery. Gear/ability ownership is retained even where the reset target level could not earn it from scratch. The result is a **conditional throughput screen with a mature supported build**, not proof of an earned entry route. Every output retains the pre-reset readback and actual measured initial state.

Essence funding is compared against the same four-piece native reference set used in the first study. That reference set differs from the historical mixed-biome equipped gear. All five colors must meet their own required balance; surplus colors are not interchangeable. No upgrades are bought in this screen, and funding does not prove catalyst, ownership or Global Mastery gates are satisfied.

Historical survival does not guarantee survival after source changes or longer horizons. Preserve deaths and stalls. Baseline and candidate are paired on the same setup and seed; this selected sample is not a population distribution. New runtime measurements supersede historical timing for this iteration.

## Files

- `screen/manifest.json`, `selected-setups.json`, individual run JSON/logs and `complete.json`: exact inputs, retained outputs and completion status.
- `screen/summary.json`: compact observed timings, funding, death and source file paths.
- `historical-survivors.json`: qualified historical selection pool with original source paths.
- `source-before.json`: candidate 01 identity before this iteration.
- `source-screen.json`: gameplay and harness hashes for this screen.
- `../run-bot-survivors.ts`, `run.mjs`, `summarize.mjs`: reproducible harness and dispatcher.

Do not interpret the older candidate 01 report or price file as the current XP configuration. Its raw runs remain unchanged. No deployment, database changes or production telemetry queries are part of this iteration.

## Runtime amendments

The four Jungle jobs became prohibitively slow in pathfinding/collision work. They were stopped after approximately 15 wall minutes and are operationally censored, not player deaths. Two separate diagnostics and an interrupted CPU profile are retained. Future jobs use a three-minute wall budget checked after each completed tick, and save progress every ten simulated seconds. A single expensive tick can exceed that soft budget. The unchanged original harness is preserved as run-bot-survivors-original.ts.txt. This is an explicitly adaptive diagnostic iteration, not a replay of a sealed campaign.

Before remaining jobs started, horizons were reduced to 30 minutes for T2 Desert, 60 for T3, and 90 for T4. The prospective change is recorded in screen/horizon-amendment.json. Gameplay budgets and behavior were not changed during the screen. Rows can now end at death, simulated horizon, or runtime ceiling; interpret each separately.
