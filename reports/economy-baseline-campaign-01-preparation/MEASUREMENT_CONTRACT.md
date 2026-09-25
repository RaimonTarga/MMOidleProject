# Measurement and reporting contract

## Fixed-state rate comparison

Each matched actor/stage starts from an independent clone of one exact authoritative input. Hash full persistent state and verify a restore readback before each arm, including mastery, inventory, upgrades, currencies and fractional catalyst progress, skills, ordered Rune rules, abilities, stances, Rites, class specialization and summoner logical slots. Never mutate or overwrite the source artifact. Preserve declared normal fresh-runtime initialization. Do not manufacture ready minions or cooldowns.

“Fixed state” means identical **starting** state and no purchases/build changes. Natural earned progression during the window is recorded. Do not freeze mastery through `world.fixedBiomeMasteryPlayers`: that disables biome XP grants in the production reward path and invalidates the XP comparison. A truly frozen stat experiment would need a separately specified measurement contract; it cannot be substituted here.

Travel/setup is outside the R rate clock, but ordinary travel attrition and any acquired rewards must be recorded. Verify measurement-start state equality; if travel causes unequal persistent starting state, the pair is not qualified until the adapter has a declared, validated solution. Do not silently teleport or normalize wallets. Window start is an explicit ledger marker; use 1,200,000 simulated ms for R1 and 3,600,000 for R3. Ordinary repopulation, deaths, respawns, recovery and return travel consume the rate denominator. A first-death stop is not an equivalent rate window.

## Live ledger metrics

Use `grantMonsterRewards` and authoritative events, not expected rewards calculated from tables. Bot `kill` events expose essence and biome XP; wallet snapshots expose catalyst units and partial progress. These are useful existing instruments, but a qualified R adapter must demonstrate their completeness at exact boundaries.

For elapsed simulated hours H:

- kills/H; deaths/H; actual essence credited/H by colour and total; HP damage actually received/H (exclude shields from HP damage).
- Catalyst equivalents for each family = `(endUnits - startUnits + unitsSpent + (endProgress-startProgress)/100) / H`. R has zero spending. P must include every spend; inherited units/progress are initial balances, never newly earned income.
- Biome XP credited/H by biome; record starting/ending cumulative XP, levels and cap. At cap, zero XP is a real cap condition, not proof of poor farming. Report pre-cap rate separately if the window crosses cap.
- Hours-to-cap is a **rate-based projection**, remaining production XP threshold divided by observed uncapped XP/hour. Do not call it a measured completion time. Already capped = 0 with explicit label; uncapped zero rate = unbounded; missing exposure = null.
- Authored density and modifier/spawn factor are configuration. Also sample actual live monster population/area to report experienced density; do not label a spawn factor as measured density.
- Dead/recovery/travel/idle time and unfinished/low-productivity periods with availability flags. Missing telemetry is null, never zero.

Reconcile each colour/family: `initial + earned - spent = final`, retaining fractional catalyst progress and all other declared ledger sources. A mismatch invalidates that metric until explained. Currency earned during approach is not included in the measured rate window. Full-lifecycle P accounting includes ordinary travel and all acquisition.

## R2 and R3

For each identical actor/stage/input hash, compare the best eligible lower-tier node against the best eligible current-tier node, separately for each same biome XP stream, relevant essence colour, and required catalyst family. Production route purchase plans determine relevance. Keep node IDs and both actual rates next to the ratio, deaths/hour and downtime. Never combine colours/families into a universal reward score.

For ratio `lower/current`, red >1.10, yellow 0.90 through 1.10 inclusive, green <0.90. Positive lower / zero current is red/unbounded; zero/zero is uninformative. Missing/invalid members produce unavailable comparisons, not favourable zeros. At-cap XP pairs are not tested inversions. Both current and lower availability must pass reachability and ledger checks.

Select all red pairs, up to eight yellow pairs ranked by largest current-minus-lower deaths/hour (then ratio descending, then cell ID), and any positive same-biome XP inversion (>1) not already included. Missing safety ranks after observed safety. Deduplicate identical actor/input/node pairs across metric reasons. R3 repeats those exact two arms from the same input/source for 60 minutes; no adaptive build or source change. Keep screen and confirmation results separate and preserve regression/disagreement. Selection is predetermined here; no confirmation launches during preparation.

## P milestones and bottlenecks

Record tier entry, every biome entry/leg completion, every mastery level and resulting recipe unlock, craft/evolution/reconstruction, every upgrade step +1..+5, ability learned/attuned, planned stance/Rite/Rune acquisition, catalyst mint, boss readiness/attempt/clear/seal, tier advance and authored terminal milestone. Attach wallet, partial catalyst progress, GM, mastery, gear and RP reservation state. Use elapsed time from that tier's entry; keep restore/setup and inherited/skipped preparation costs separate and unknown rather than zero.

Existing instruments include `node-enter`, `milestone`, `biome-level-up` (with unlocked recipe IDs), `tier-up`, `kill`, `craft`, `upgrade`, ability/Rune craft, `build-change`, `wallet-snapshot`, `blocked-on-resource`, boss events, death, respawn and damage events. Verify that all required stance/Rite/evolution and attunement details actually emit in an instrument qualification; event types alone are not proof of complete coverage.

For the route's **next declared purchase/milestone**, log failed affordability and gate predicates on every change. Partition time into exclusive classes: essence, catalyst, biome mastery/recipe gate, GM/upgrade gate, boss/seal, combat failure, travel/route, other. Preserve simultaneous blockers in a separate multi-label field. For exclusive accounting, use precedence: combat failure/death recovery, travel, boss/seal gate, biome/recipe gate, GM gate, catalyst, essence, other. Report that convention with percentages; correlated constraints do not establish causal attribution. Do not classify active progress as “blocked” merely because a future purchase remains unaffordable; retain a productive/unblocked category in the total-time denominator. Uninstrumented spans are other/unknown.

Record the earliest time the intended encounter package is both affordable and legally usable, the time it is actually purchased/equipped, and every later encounter outcome. “Could not afford the package” and “owned the package but lost” remain separate. Repeated boss failure with paid equipment is not evidence for a reward increase.

Per tier/profile show duration and censoring, each biome leg, first +1/+3/+5, first current-tier weapon, first planned Core/relic, each planned ability/stance/Rite, boss readiness and seals, all earned/spent/left currencies, and bottleneck percentages. Two replicas support descriptive spread only. Give each result plus median/min/max among completions with censored counts prominently beside them; do not treat capped/infrastructure-failed runs as completed duration or claim a precise population median. Do not pool tiers/classes.

Gameplay deaths remain observations. Distinguish ordinary completion, cap censoring, route/step stall, invalid provenance, telemetry failure and infrastructure failure. Preserve every failed/not-run row. No automatic retries or extending a sealed cap.
