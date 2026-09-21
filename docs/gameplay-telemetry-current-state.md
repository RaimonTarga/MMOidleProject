# Gameplay telemetry

Server-owned balance evidence for deployed human play. Source: `server/src/analytics/gameplayRecorder.ts`, `gameplayWriter.ts`, `server/src/logdb/gameplayRepo.ts`, and `admin/src/tabs/GameplayTab.tsx`.

## Storage and Railway setup

The existing separate PostgreSQL **logdb** service holds `gameplay_events` and `gameplay_daily`. Keep its private Railway URL in `LOG_DATABASE_URL`. Both game and logdb migrations run at server boot. Game saves remain in the game database. Redis is not a durable telemetry store.

1. Provision the existing required game database, logdb and Redis services. Use private networking for databases.
2. Set `ADMIN_TOKEN` to a random secret of at least 32 characters on the game server. Open `/admin` and enter it there. Never use a Vite variable, URL parameter, or committed file for this secret. Production admin sockets reject absent, short and incorrect tokens. Development without a configured token keeps local access. Static admin assets are public; all admin data/actions require an authorized socket.
3. `GAMEPLAY_TELEMETRY_ENABLED=1` is the default; `0` disables recording. `GAMEPLAY_TELEMETRY_COHORT=test` isolates a dedicated testing deployment. Development is always test. Production normally records human data.
4. Set a unique `GAME_VERSION` for each balance release/configuration. Otherwise `RAILWAY_GIT_COMMIT_SHA` is used; outside Railway, package version is a fallback. A reward multiplier change must not be pooled with ordinary play.
5. Enable scheduled Railway volume backups for logdb. Retention jobs do not configure backups; old records may remain in backups until those backups expire. Provisioning, deployment and restore verification remain operator tasks.

Open **Gameplay** in admin. Filter by version, cohort, class and progression tier. The export button downloads the selected dashboard view as JSON; the detailed section is limited to the latest 200 records, not a full database export.

## Data boundary

Each character receives a random `telemetry_id` in the **game DB**. Reconnects keep that ID and get a new random session ID. A per-session sequence preserves event order when timestamps tie. The identity-to-character mapping never enters telemetry. These identifiers are pseudonymous, not anonymous.

Recorder payloads explicitly project gameplay fields. No account IDs, socket IDs, Discord IDs, names, chat, email, IP addresses, browser/device data, request bodies, credentials or arbitrary metadata are copied. Actor names/IDs in world logs are not serialized into gameplay records. Deaths retain monster **type** and authored ability names only.

Production stops writing the old account-linked `analytics_events` and per-viewer `world_log_entries`; live player world-log delivery remains intact. Existing historical rows expire under their existing retention rules. Operational server logs and authentication storage remain separate systems and are not claimed to be anonymous or gameplay-only.

The optional development human-playtest filesystem recorder is unchanged. Bot/bench worlds have no production recorder installed. Admin actions conservatively mark affected characters as test **before** mutation and persist that exclusion in the game DB. Global admin actions mark all currently connected characters; already active encounters close as interrupted before mutation. If exclusion persistence fails a warning is logged, and the current session remains test. Dedicated admin testing should use a test deployment; world mutations may outlast a connection.

## Recorded facts

- Session start/end; disconnect and shutdown have separate reasons.
- Time alive and combat time, sampled at one second and flushed in 30-second summaries, or at transitions/build boundaries/death/disconnect. A sample gap contributes at most two seconds; process stalls are not assumed to be playtime. Dead time is excluded. This measures connected simulation exposure, including idle/autocombat, not human attention.
- Accepted skill, equipment, upgrade, craft/evolution, rune, ability, stance, rite, targeting, automation and navigation decisions. Rejected changes are excluded. Each record includes before/after build and relevant owned/unlocked option pools; skill eligibility uses the real unlock validator. Recipe pools describe unlocks, not guaranteed affordability. A decision after death/retreat is labeled until the next boss attempt.
- Essence/catalyst wallet gains and spends, observed at sampling and immediately around decisions. Totals are wallet deltas, not a full economic transaction ledger.
- Boss encounter start/end with starting class/frame/range/skills/gear/upgrades/loadout, tier, level, biome levels, effective stats, same-node live party size, boss type, HP fraction, duration, outgoing boss damage and incoming damage during the attempt. Start is observed target acquisition or direct player/owned-minion damage involving a boss. Party members receive outcomes only when they participated, not merely because they saw the log.
- Death context captured **before** cleanup: build, node, position, cause, authored ability, killer type, status IDs/stacks, and up to 32 recent incoming damage records from the preceding ten seconds. Damage sources already despawned can be unknown; the authoritative killing cause still carries its source snapshot.
- Biome/tier milestones with elapsed session time.

## Interpretation

Victory closes when the authoritative kill event names an engaged boss, including a teammate's killing blow. Death closes before state resets. Leaving the node or ten seconds without target/damage engagement closes a retreat. A missing boss without a kill event is interrupted, never silently a victory. Disconnects and server shutdown do not count as deaths or retreats. One shared boss fight may produce one participant attempt per character; rates are participant outcomes.

The dashboard shows event counts and denominators. Win rate uses victories + deaths + retreats, excluding disconnects/interruption. Death rates divide by observed time alive. Skill selection divides chosen occurrences by eligible decision points, not by all players. Daily totals have no character/session IDs and cannot report unique-player counts.

First-clear analysis uses un-cleared-at-start encounters in the selected detailed window (maximum 90 days), grouped by boss, class and tier, retaining groups with a victory. Earlier history and other class/tier groups are not included. It is an observed count, not a guaranteed lifetime attempt count. Milestone times are within the current session; exposure-by-tier gives an additional bottleneck view. Builds and detailed events support further analysis of equipment/rune differences; aggregate outcome tables group by starting class/tier/frame/range/party size.

## Reliability and retention

Database work runs asynchronously outside the simulation tick. The writer is single-flight, batches 100 records, catches up through at most ten batches per timer pass, and retains failed batches with exponential backoff (1–30 seconds). Queue capacity is 10,000 events and maximum age is ten minutes. Overflow/expiry are counted as dropped. Stable event IDs plus a transaction ensure daily totals are updated only for newly inserted rows, even if a committed insert is retried after an ambiguous network error.

The queue is in memory: a hard crash can lose unflushed events, including encounter ends. Graceful shutdown closes attempts as interrupted and tries to drain the queue within a ten-second process deadline. Delivery failures/drops also emit a payload-free operational warning. Dashboard writer counters are for the current server process and reset on restart; they are not a lifetime completeness guarantee. Gameplay continues during telemetry insert failures. Missing data must not be interpreted as zero failures.

Detailed events expire after 90 days; identity-free daily totals expire after 365 days. Cleanup runs at boot and hourly. Backup expiry is separately configured in Railway. This implementation is intended for the current single authoritative server deployment; multiple game instances would need shared operational health reporting and independently verified session ownership.

## Verification

`gameplayTelemetry.test.ts` exercises actual socket decision handlers, world-log fanout, death cleanup, boss outcomes, pseudonymous reconnects, privacy projection, test exclusion, retry/backoff/overflow, and production admin-token validation without a database.

`gameplayPersistence.test.ts` is optional: set `TEST_GAMEPLAY_DATABASE_URL` to an **empty disposable database named `codex_telemetry_test_*`**. It checks both migrations, stable random identity, persisted test exclusion, transactional rollback, duplicate protection, cohort queries and retention. It skips without that explicit URL so ordinary CI remains database-independent.
