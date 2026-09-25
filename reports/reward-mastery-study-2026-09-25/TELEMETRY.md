# Player-data validation plan

## Establish the cohort first

Read `gameplay_events` in logdb. Identify the actual playtest-3 version and time window, then match the deployed reward configuration to the source inventory. Start with human cohort; retain test counts separately. `GAME_VERSION` may be a label rather than a commit. The recorder does not include the global reward multiplier in each event, so a version label alone cannot prove the multiplier.

The following bounded, read-only inventory query uses PostgreSQL parameters `$1` = inclusive start epoch milliseconds and `$2` = exclusive end epoch milliseconds. Supply them through the connected tool's parameter mechanism. It has not been executed against a database.

```sql
SELECT game_version, cohort, kind,
       count(*) AS events,
       count(DISTINCT character_id) AS characters,
       min(ts) AS first_ts, max(ts) AS last_ts
FROM gameplay_events
WHERE ts >= $1 AND ts < $2
GROUP BY game_version, cohort, kind
ORDER BY game_version, cohort, kind;
```

Fetch full event JSON in chronological pages for the selected version and bounded window. Do not use the admin dashboard's latest-200-event view as the dataset. The table's `event` column holds the entire `GameplayEvent`; the payload is `event->'payload'`, and ordering within a session uses `(event->>'sequence')::bigint`. Use stable keyset pagination over `(ts, session_id, sequence, id)`, not a moving OFFSET window. Event IDs are deduplicated in storage; keep them when exporting. No account/Discord mapping is needed.

Required kinds: session-start/end, exposure, progression, decision, resource, death, encounter-start/end. Keep class, player tier, node, version, session and pseudonymous character ID. Map node IDs to biome/tier using the **matching release's** registry, not necessarily this checkout.

## Construct observations

1. Seed each character's known mastery from session-start build snapshots. Use six-level segment caps and biome start/final tiers from the matching build. Mark segments already in progress at the window/session start as left-censored. A level equal to segment entry is still compatible with partial XP toward its first level; exact entry XP is unrecorded.
2. Progression events have `milestone = biome:<group>` and the new level. A single event can cross several levels. Do not invent missing intermediate timestamps. The event's top-level tier/class comes from a sampled cached build, so cross-check tier-up boundaries rather than assuming a simultaneous tier label is exact.
3. Add living exposure in the biome while its segment is open, across visits and reconnects, preserving character identity. Report combat exposure separately. Do not subtract two `sessionElapsedMs` values from different sessions or call time since login biome mastery time.
4. Exposure flushes at roughly 30 seconds and at node/build/death/session boundaries. A mastery event does not itself force a flush. Boundary-crossing exposure buckets require an uncertainty range: fully contained buckets provide the firm contribution; ambiguous buckets provide possible additional time. Do not claim exact cap time by assigning a whole bucket solely by its ending timestamp. Sampling clips each gap to two seconds and excludes dead time; raw wall-clock interval interpolation is not exact.
5. Identify right-censored segments when the window ends before cap. Report completion counts, incomplete counts, exposure and timing ranges. Missing events and dropped writes must not be interpreted as instant mastery or zero deaths.
6. Separate biome tier from player tier, first segment from catch-up, fresh progression from overgeared returns, and ordinary farming from dungeon exposure. Report person-level medians and dispersion with sample counts. Resource events are net wallet observations; they can hide gain/spend cancellation and are not a kill ledger.

## What existing data cannot establish precisely

- No XP balance or XP-earned field in the build/exposure payload. Partial segment progress, exact overshoot and actual XP throughput are unavailable.
- No ordinary kill count or monster-type payout ledger.
- Party size is present for boss attempts, not ordinary exposure. A solo boss does not prove the preceding farm was solo. Label farming party status unknown unless independent evidence establishes it.
- Living simulation exposure measures connected play/autocombat, not human attention. Dead time is excluded; tab focus is not a reliable activity denominator.

Use existing milestones to corroborate whether mastery is far too fast, with censoring/boundary uncertainty visible. For clean future calibration, propose extending the existing periodic recorder with biome XP start/end or capped/uncapped XP gains, kills by source category, same-node reward-sharing party size, and reward/config version. Flush at mastery boundaries. Keep this batched and server-owned; no new telemetry code is part of this study.

## Decision output when data arrives

For each biome/tier: sample size, complete/incomplete/left-censored segments, median active-time range, spread, combat share, version, build distributions, known/unknown party composition, and confidence limitations. Compare with 5/15/30/60 minutes. Derive candidate budgets only from interpretable segments. Compare T3/T4 evidence with the source model, then reassess T1/T2 independently. Carry the defense study's changes into a fresh calibration because survival, recovery and equipment alter XP throughput.
