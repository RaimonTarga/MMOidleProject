import { timingSafeEqual, createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import express from 'express';
import pg from 'pg';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { filterShape, eventShape, dailyShape, eventQuery, dailyQuery, coverageQuery, readQuery } from './queries.mjs';

const digest = value => createHash('sha256').update(value).digest();
const notes = 'Pseudonymous character IDs are not people. Detail retention: 90 days; daily: 365 days. Missing records are not zero outcomes. Separate versions and human/test cohorts. Exposure measures connected simulation time, not attention. Daily counts are additive events, not unique players; values are metric-specific sums. Encounter outcomes are per participant; win-rate denominator is victory + death + retreat. Wallet deltas are not a transaction ledger. These reads cannot report the live writer queue or dropped events.';

export function createApp({ token, pool, host }) {
  if (!token || token.length < 32) throw new Error('TELEMETRY_MCP_TOKEN must contain at least 32 characters');
  if (!host) throw new Error('TELEMETRY_MCP_HOST is required');
  const app = express();
  app.disable('x-powered-by');
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  let active = 0;
  app.use('/mcp', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (req.headers.host !== host || (req.headers.origin && req.headers.origin !== `https://${host}`)) return res.sendStatus(403);
    const supplied = req.headers.authorization ?? '';
    if (!timingSafeEqual(digest(supplied), digest(`Bearer ${token}`))) return res.sendStatus(401);
    if (active >= 8) return res.status(429).json({ error: 'Busy; retry later' });
    active++;
    res.once('close', () => active--);
    next();
  });
  app.post('/mcp', express.json({ limit: '64kb' }), async (req, res) => {
    const server = new McpServer({ name: 'mmo-telemetry', version: '1.0.0' }, { instructions: notes });
    const register = (name, description, inputSchema, queryBuilder, format) => {
      server.registerTool(name, { description, inputSchema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async input => {
        try {
          const query = queryBuilder(input);
          const rows = await readQuery(pool, query);
          const result = { generatedAt: new Date().toISOString(), filters: query.args, notes, ...format(rows, query.args) };
          const serialized = JSON.stringify(result);
          if (Buffer.byteLength(serialized) > 2_000_000) throw new Error('Result too large');
          return { content: [{ type: 'text', text: serialized }] };
        } catch {
          return { isError: true, content: [{ type: 'text', text: 'Query failed. Check UTC window boundaries (detail <=90 days, daily <=365 days), reduce window/page size, or check database permissions and availability. No credentials or raw database errors are returned.' }] };
        }
      });
    };
    register('telemetry_coverage', 'Count stored events by version/kind within a filtered window (max 90 days). Storage coverage, not writer health. At most 500 groups; narrow filters if truncated.', filterShape, coverageQuery, rows => ({ groups: rows.slice(0, 500), truncated: rows.length > 500 }));
    register('telemetry_events', 'Read detailed events, including builds, deaths and boss outcomes. Max 90-day window. Ascending ts/id pagination; pass next as after with identical filters. Late inserts may require a fresh export.', eventShape, eventQuery, (rows, args) => {
      const page = rows.slice(0, args.limit), last = page.at(-1);
      return { events: page.map(row => row.event), next: rows.length > args.limit ? { ts: last.ts, id: last.id } : null };
    });
    register('telemetry_daily', 'Read additive daily metrics. UTC midnight boundaries required, max 365 days. Keep filters fixed and pass nextOffset as offset. Live daily rows may change during pagination; closed days are preferable for studies.', dailyShape, dailyQuery, (rows, args) => ({ rows: rows.slice(0, args.limit), nextOffset: rows.length > args.limit ? args.offset + args.limit : null }));
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.once('close', () => { void transport.close(); void server.close(); });
    try { await server.connect(transport); await transport.handleRequest(req, res, req.body); }
    catch { if (!res.headersSent) res.status(500).json({ error: 'MCP request failed' }); }
  });
  app.all('/mcp', (_req, res) => res.sendStatus(405));
  app.use((error, _req, res, _next) => { res.status(error.status === 413 ? 413 : 400).json({ error: 'Invalid request' }); });
  return app;
}

export async function verifyReader(pool) {
  const { rows } = await pool.query(`SELECT current_user AS name, rolsuper, rolcreaterole, rolcreatedb, rolreplication, rolbypassrls FROM pg_roles WHERE rolname = current_user`);
  const role = rows[0];
  if (!role || role.name !== 'telemetry_reader' || Object.entries(role).some(([key, value]) => key !== 'name' && value)) throw new Error('Restricted telemetry_reader role required');
  const memberships = await pool.query('SELECT 1 FROM pg_auth_members WHERE member = (SELECT oid FROM pg_roles WHERE rolname = current_user)');
  if (memberships.rowCount) throw new Error('Reader must not have role memberships');
  const rights = await pool.query(`SELECT c.relname, n.nspname,
    has_table_privilege(c.oid, 'SELECT') AS readable,
    has_table_privilege(c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS writable
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r','p','v','m','f') AND n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%'`);
  const allowed = new Set(['gameplay_events', 'gameplay_daily']);
  for (const row of rights.rows) {
    if (row.writable || (row.readable && (row.nspname !== 'public' || !allowed.has(row.relname)))) throw new Error('Reader has excessive table privileges');
  }
  for (const table of allowed) if (!rights.rows.some(row => row.nspname === 'public' && row.relname === table && row.readable)) throw new Error('Telemetry table permission missing');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let pool;
  try {
    if (!process.env.TELEMETRY_DATABASE_URL) throw new Error('Missing database URL');
    pool = new pg.Pool({ connectionString: process.env.TELEMETRY_DATABASE_URL, max: 2, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000, application_name: 'mmo-telemetry-mcp' });
    pool.on('error', () => console.error('Telemetry database connection error'));
    const app = createApp({ token: process.env.TELEMETRY_MCP_TOKEN, host: process.env.TELEMETRY_MCP_HOST, pool });
    await verifyReader(pool);
    const listener = app.listen(Number(process.env.PORT || 8080), '0.0.0.0', () => console.log('Telemetry MCP listening'));
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
      listener.close(() => { void pool.end().then(() => process.exit(0)); });
      setTimeout(() => process.exit(1), 10000).unref();
    });
  } catch { console.error('Telemetry MCP startup failed: check required configuration and restricted database grants'); await pool?.end(); process.exitCode = 1; }
}
