import { createRequire } from 'node:module';

const SQL = `
SELECT d.datname AS database,
       pg_database_size(d.oid)::text AS size_bytes,
       pg_size_pretty(pg_database_size(d.oid)) AS size,
       s.numbackends AS connections,
       s.stats_reset,
       a.latest_visible_activity,
       CASE WHEN d.datname IN ('gamedb', 'logdb') THEN 'live'
            ELSE 'scratch candidate' END AS classification
FROM pg_database d
LEFT JOIN pg_stat_database s ON s.datid = d.oid
LEFT JOIN (
  SELECT datid, max(greatest(backend_start, xact_start, query_start, state_change)) AS latest_visible_activity
  FROM pg_stat_activity
  GROUP BY datid
) a ON a.datid = d.oid
WHERE d.datname LIKE 'gamedb%' OR d.datname LIKE 'logdb%'
ORDER BY d.datname;`;

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--dry-run')) throw new Error('Usage: db-inventory.mjs [--dry-run]');
  console.log('Inventory: local game PostgreSQL server localhost:5432 (read only).');
  console.log('pg_stat_database has no last-activity timestamp. latest_visible_activity is the newest timestamp among currently visible pg_stat_activity sessions; null does not mean unused. stats_reset is only the cumulative-statistics reset time.');
  console.log('This inventories one PostgreSQL cluster. The separate compose logdb server on :5433 is outside this cluster. Scratch candidate is a review label, not permission to drop.');
  if (args.includes('--dry-run')) { console.log(`DRY RUN: would execute a read-only query in postgres:\n${SQL}`); return; }
  const require = createRequire(new URL('../server/package.json', import.meta.url));
  const { Client } = require('pg');
  const client = new Client({ host: 'localhost', port: 5432, database: 'postgres', user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres', application_name: 'mmo-db-inventory', connectionTimeoutMillis: 5000, statement_timeout: 10000 });
  try {
    await client.connect();
    await client.query('BEGIN READ ONLY');
    const { rows } = await client.query(SQL);
    console.log(['database', 'size', 'bytes', 'connections', 'latest_visible_activity', 'stats_reset', 'classification'].join('\t'));
    for (const row of rows) console.log([row.database, row.size, row.size_bytes, row.connections ?? 'unknown', row.latest_visible_activity?.toISOString() ?? 'unavailable', row.stats_reset?.toISOString() ?? 'unavailable', row.classification].join('\t'));
    console.log(`${rows.length} database(s); no databases changed or dropped.`);
    await client.query('COMMIT');
  } finally { await client.end(); }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
