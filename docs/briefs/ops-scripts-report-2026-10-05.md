# Ops scripts report — 2026-10-05

Branch: `ops/logdb-backup`, based on develop `20b34088`, in
`C:/Users/osaif/Documents/Claude/Projects/mmo-lin-w2b`.
Initial `Get-Location`, `git status --short`, `git branch --show-current`
verified the requested clean checkout on `feat/cc-icons-art` before branch creation.
The command working directory was verified; worker title-bar verification is unavailable
through this interface.

## Delivered

- `scripts/logdb-backup.mjs`: reads `LOG_DATABASE_URL`, custom-format gzip level-6
  `pg_dump`, UTC ISO timestamp filename with Windows-safe colons, directory from
  `LOGDB_BACKUP_DIR` (default `./backups/logdb`), retention from
  `LOGDB_BACKUP_KEEP_DAYS` (default 14). Positive retention is required.
  Exclusive partial-file creation, archive magic validation and exclusive publication
  prevent publishing failed dumps or replacing an existing archive. On dump failure
  the partial is removed, exit is nonzero, and retention is skipped. Pruning only
  recognizes this script's ISO-named regular `.dump` files; unmanaged files and
  symlinks are left alone. Age is measured from the filename's timestamp.
- `scripts/logdb-restore.mjs`: requires `--file`, `--to` and `--yes` for writes.
  `--dry-run` is read-only and does not require `--yes`. Uses
  `pg_restore --exit-on-error --single-transaction` into an existing empty target;
  never creates/drops databases. No `--clean` or blanket destructive restoration.
- Both support optional `--docker-container <name>` for local Docker Desktop
  PostgreSQL tools. Loopback URLs retain their host-published port and use
  `host.docker.internal` from the container. Password is supplied through the
  subprocess environment, omitted from progress output, and not part of the
  pg_dump/restore connection argument. Connection timeout defaults to ten seconds.
  Native `pg_dump`/`pg_restore` remain the default.
- `scripts/db-inventory.mjs`: one read-only transaction on localhost:5432/postgres,
  matching `gamedb%` or `logdb%`, with byte/pretty size, current connections,
  current-session activity, statistics reset time and exact live/scratch labels.
  Uses the existing server `pg` dependency; no installation or dependency changes.
  `PGUSER`/`PGPASSWORD` may override local compose defaults. No drop code.
- Root aliases: `pnpm logdb:backup`, `pnpm logdb:restore`, `pnpm db:inventory`.
- `docs/release-flow.md#backups` documents configuration, restore and responsibility.
  Gameplay telemetry item 5 now links the scripts. Scheduling, off-host storage and
  Railway volume backups remain operator tasks.

## Mechanical specification limitation

PostgreSQL 16's `pg_stat_database` has no newest/last activity timestamp.
Its `stats_reset` reports reset time, not last use; `session_time` and
`active_time` are accumulated durations, not timestamps. Confirmed against the
local view columns and the
[PostgreSQL 16 reference](https://www.postgresql.org/docs/16/monitoring-stats.html#MONITORING-PG-STAT-DATABASE-VIEW).
The inventory therefore explicitly names `latest_visible_activity` from
`pg_stat_activity` (max backend/query/transaction/state-change timestamp),
and calls absent values unavailable. This is not historical last use or safe-drop evidence.

As prescribed, the inventory connects to the game cluster on :5432. The compose
logdb on :5433 is a separate PostgreSQL cluster, so it cannot appear in that cluster's
`pg_database`. This boundary is printed and documented. No scratch candidates were
dropped. Only the newly created, explicitly requested restore-check database was dropped.

## Validation

- `node --check` passed for all **three** scripts (the brief says "both files",
  but names three).
- Each script's `--dry-run` passed; backup/inventory first, restore after creating
  the dump. Dry run was also verified to leave an expired backup intact.
- Deliberately nonexistent source database: dump exited 1, expired sentinel survived,
  no partial remained.
- Restore without `--yes`: exited nonzero before any target mutation.
- Small successful dump of the local cluster's `postgres` database validated
  completed-file publication after the exclusive-file change: expired managed dump
  pruned; unmanaged dump retained. Temporary probes removed afterwards.
- `pnpm typecheck` passed (all packages plus bench/test configurations).
- `git diff --check` passed.
- No test suite, `pnpm install`, source-server changes, push, merge, process kill by
  image name, deployment or scheduling. Existing compose services were already up;
  no restart or `db:up` was necessary.

## Local logdb rehearsal transcript

Host source: `postgresql://postgres:postgres@localhost:5433/logdb` (compose defaults).
Existing container tools: `pg_dump (PostgreSQL) 16.14`; native tools were absent on PATH.
The source database was approximately 4035 MB. One full logdb backup was taken:

```text
> mmo-idle@0.6.2 logdb:backup C:\Users\osaif\Documents\Claude\Projects\mmo-lin-w2b
> node scripts/logdb-backup.mjs "--docker-container" "mmo-logdb"

Dumping localhost:5433/logdb to C:\Users\osaif\AppData\Local\mmo-idle\backups\logdb\logdb-2026-10-05T06-37-24.661Z.dump (custom format, gzip level 6; Docker mmo-logdb).
Will prune after a successful dump 0 backup(s) older than 14 days.
Backup complete: C:\Users\osaif\AppData\Local\mmo-idle\backups\logdb\logdb-2026-10-05T06-37-24.661Z.dump (56527578 bytes).
```

Backup retained outside Git at `C:\Users\osaif\AppData\Local\mmo-idle\backups\logdb\logdb-2026-10-05T06-37-24.661Z.dump`.
Size: **56527578 bytes**.
SHA-256: `4f89f5549e4b3164462f44e205cf11e0eb760b9305162d579b50ab7895260709`.

Before creation, queried `pg_database` and verified `logdb_restore_check` absent,
then `docker exec mmo-logdb createdb -U postgres logdb_restore_check`.

```text
> mmo-idle@0.6.2 logdb:restore C:\Users\osaif\Documents\Claude\Projects\mmo-lin-w2b
> node scripts/logdb-restore.mjs "--file" "C:\\Users\\osaif\\AppData\\Local\\mmo-idle\\backups\\logdb\\logdb-2026-10-05T06-37-24.661Z.dump" "--to" "postgresql://postgres:postgres@localhost:5433/logdb_restore_check" "--dry-run" "--docker-container" "mmo-logdb"

DRY RUN: would restore C:\Users\osaif\AppData\Local\mmo-idle\backups\logdb\logdb-2026-10-05T06-37-24.661Z.dump into localhost:5433/logdb_restore_check; Docker mmo-logdb. Target must already exist and be empty.

> mmo-idle@0.6.2 logdb:restore C:\Users\osaif\Documents\Claude\Projects\mmo-lin-w2b
> node scripts/logdb-restore.mjs "--file" "C:\\Users\\osaif\\AppData\\Local\\mmo-idle\\backups\\logdb\\logdb-2026-10-05T06-37-24.661Z.dump" "--to" "postgresql://postgres:postgres@localhost:5433/logdb_restore_check" "--yes" "--docker-container" "mmo-logdb"

Restoring C:\Users\osaif\AppData\Local\mmo-idle\backups\logdb\logdb-2026-10-05T06-37-24.661Z.dump into localhost:5433/logdb_restore_check; Docker mmo-logdb. Target must already exist and be empty.
Restore complete.
public.gameplay_daily: source=10075; restored=10075
logdb_restore_check dropped; verified absent.

Algorithm       Hash                                                                   Path
---------       ----                                                                   ----
SHA256          4F89F5549E4B3164462F44E205CF11E0EB760B9305162D579B50AB7895260709       C:\Users\osaif\AppData\Local\mm…
```

The count queries were `SELECT COUNT(*) FROM public.gameplay_daily` on both
databases. Counts matched at **10075/10075**. Cleanup was
`docker exec mmo-logdb dropdb -U postgres logdb_restore_check`, followed by an
absence query against `pg_database`. This is a local restore rehearsal with a
one-table count check, not Railway/off-host restore verification.

## Inventory transcript

```text
> mmo-idle@0.6.2 db:inventory C:\Users\osaif\Documents\Claude\Projects\mmo-lin-w2b
> node scripts/db-inventory.mjs

Inventory: local game PostgreSQL server localhost:5432 (read only).
pg_stat_database has no last-activity timestamp. latest_visible_activity is the newest timestamp among currently visible pg_stat_activity sessions; null does not mean unused. stats_reset is only the cumulative-statistics reset time.
This inventories one PostgreSQL cluster. The separate compose logdb server on :5433 is outside this cluster. Scratch candidate is a review label, not permission to drop.
database	size	bytes	connections	latest_visible_activity	stats_reset	classification
gamedb	13 MB	13196311	0	unavailable	unavailable	live
gamedb_ccfx	8383 kB	8584215	0	unavailable	unavailable	scratch candidate
gamedb_ccpage	8255 kB	8453143	0	unavailable	unavailable	scratch candidate
gamedb_ccreadout	8527 kB	8731671	0	unavailable	unavailable	scratch candidate
gamedb_reach1	8287 kB	8485911	0	unavailable	unavailable	scratch candidate
gamedb_reach2	8271 kB	8469527	0	unavailable	unavailable	scratch candidate
gamedb_reach3	8279 kB	8477719	0	unavailable	unavailable	scratch candidate
gamedb_reachshot	7999 kB	8190999	0	unavailable	unavailable	scratch candidate
gamedb_tut1	8359 kB	8559639	0	unavailable	unavailable	scratch candidate
gamedb_tut2	8303 kB	8502295	0	unavailable	unavailable	scratch candidate
gamedb_tut3	8543 kB	8748055	0	unavailable	unavailable	scratch candidate
gamedb_tut4	8255 kB	8453143	0	unavailable	unavailable	scratch candidate
gamedb_tut5	8351 kB	8551447	0	unavailable	unavailable	scratch candidate
gamedb_vftut1	8287 kB	8485911	0	unavailable	unavailable	scratch candidate
gamedb_vftut2	8287 kB	8485911	0	unavailable	unavailable	scratch candidate
gamedb_vftut3	8279 kB	8477719	0	unavailable	unavailable	scratch candidate
gamedb_vftut4	8263 kB	8461335	0	unavailable	unavailable	scratch candidate
gamedb_vftut5	8287 kB	8485911	0	unavailable	unavailable	scratch candidate
gamedb_vftut6	8287 kB	8485911	0	unavailable	unavailable	scratch candidate
19 database(s); no databases changed or dropped.
```

**19 matching databases: 1 live, 18 scratch candidates.** No visible sessions for
the listed databases at the snapshot; activity/reset values were unavailable.
No conclusion about historical use is justified by that absence.

## Failure/retention checks

```text
Dumping localhost:5433/logdb_backup_failure_probe to C:\Users\osaif\AppData\Local\Temp\logdb-backup-failure-5b4cf170-b3be-4b65-82d3-b297dbcdba0e\logdb-2026-10-05T06-41-04.685Z.dump (custom format, gzip level 6; Docker mmo-logdb).
Will prune after a successful dump 1 backup(s) older than 14 days.
pg_dump: error: connection to server at "host.docker.internal" (192.168.65.254), port 5433 failed: FATAL:  database "logdb_backup_failure_probe" does not exist
pg_dump failed (exit 1).
Failure check passed: exit=1; expired sentinel preserved; no partial remains.
Restore requires --yes.
Restore without --yes rejected before mutation.

> mmo-idle@0.6.2 typecheck C:\Users\osaif\Documents\Claude\Projects\mmo-lin-w2b
> pnpm -r exec tsc --noEmit && pnpm run typecheck:bench && pnpm run typecheck:test


> mmo-idle@0.6.2 typecheck:bench C:\Users\osaif\Documents\Claude\Projects\mmo-lin-w2b
> pnpm --filter @mmo-idle/server exec tsc --noEmit -p tsconfig.bench.json


> mmo-idle@0.6.2 typecheck:test C:\Users\osaif\Documents\Claude\Projects\mmo-lin-w2b
> pnpm --filter @mmo-idle/server exec tsc --noEmit -p tsconfig.test.json
DRY RUN: would dump localhost:5433/postgres to C:\Users\osaif\AppData\Local\Temp\logdb-backup-retention-a8c3dbc4-8115-47f2-9ce6-40966d97470e\logdb-2026-10-05T06-42-15.231Z.dump (custom format, gzip level 6; Docker mmo-logdb).
Would prune 1 backup(s) older than 14 days.
Would remove C:\Users\osaif\AppData\Local\Temp\logdb-backup-retention-a8c3dbc4-8115-47f2-9ce6-40966d97470e\logdb-2000-01-01T00-00-00.000Z.dump
Dumping localhost:5433/postgres to C:\Users\osaif\AppData\Local\Temp\logdb-backup-retention-a8c3dbc4-8115-47f2-9ce6-40966d97470e\logdb-2026-10-05T06-42-15.313Z.dump (custom format, gzip level 6; Docker mmo-logdb).
Will prune after a successful dump 1 backup(s) older than 14 days.
Backup complete: C:\Users\osaif\AppData\Local\Temp\logdb-backup-retention-a8c3dbc4-8115-47f2-9ce6-40966d97470e\logdb-2026-10-05T06-42-15.313Z.dump (1032 bytes).
Pruned C:\Users\osaif\AppData\Local\Temp\logdb-backup-retention-a8c3dbc4-8115-47f2-9ce6-40966d97470e\logdb-2000-01-01T00-00-00.000Z.dump
Success retention check passed: dry run preserved files; successful dump pruned only expired managed backup; unmanaged dump preserved.
```
