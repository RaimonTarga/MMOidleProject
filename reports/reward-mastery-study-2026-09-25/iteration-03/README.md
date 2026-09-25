# Iteration 03 — T4 fast-end mastery near 50 minutes

The user changed the T4 calibration priority: aim the **fast end** around 50 minutes and accept that slower builds take longer. This supersedes interpreting 60 minutes as a central target across all tested builds. T1–T3 remain at 1,750 / 3,750 / 42,000 XP.

First tested T4 budget: **600,000 XP per six-level segment**, increased from 108,000. Historical surviving Volcanic balanced Striker sustained 24.3 kills/min in its last measured interval versus 14.7 for the heavy Striker tested in iteration 02. Combining that relative rate with the measured 15–17-minute heavy-Striker cap motivates an initial 600,000 candidate; this is a selection heuristic, not proof of current throughput.

Ten fresh runs: balanced Striker, heavy Striker and light Apprentice in Volcanic, balanced Conduit in Tundra, and heavy Squire in Desert; seeds 101009 and 101033. All use the original validated historical packages and current isolated candidate mechanics. The mature gear/known-ability assumptions and target-biome reset remain as in iteration 02. No build is weakened to force a desired result.

Each run stops on mastery, first death, six simulated hours, or its runtime limit. Soft wall limit is 15 minutes checked after completed ticks; the supervisor terminates its owned process tree after 16 wall minutes. Progress snapshots are retained. Stopping on mastery deliberately measures completion time and income at cap, not post-cap survival or actual +5 purchases. These selected builds cannot establish a universal fastest-player lower bound.

T4 catalyst weight changes from 1/12 to **3/200 = 9,000/600,000**, preserving the earlier experiment's intended catalyst opportunity per XP segment. Essence and prices initially stay unchanged so the increased income at mastery is measured explicitly. No other gameplay changes are introduced; the defense study is not incorporated.

All runs execute in `C:/Users/osaif/Documents/Claude/Projects/mmo-reward-candidate`, never the mutable main checkout. Each batch records gameplay/harness/hitbox hashes before running and checks them on completion. Earlier observations are retained, not overwritten. Source tests, report, final decision and patch accompany completed results. No deployment or migration is authorized by this experiment.

Independent holdout: the same balanced Striker was also tested on fresh seeds 101051 and 101063, with identical stopping rules and source. See [results](RESULTS.md).
