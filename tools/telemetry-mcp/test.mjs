// Real PostgreSQL + MCP HTTP integration. Uses only a fresh disposable Docker
// container; never reads deployment URLs or credentials from the environment.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createApp, verifyReader } from './src/server.mjs';
import { eventQuery, dailyQuery } from './src/queries.mjs';

const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
const name = `mmo-telemetry-test-${randomBytes(6).toString('hex')}`;
const password = randomBytes(24).toString('hex');
const token = randomBytes(32).toString('hex');
let admin, pool, listener, client, created = false;
try {
  docker('run', '--detach', '--rm', '--name', name, '-e', `POSTGRES_PASSWORD=${password}`, '-e', 'POSTGRES_DB=codex_telemetry_test_mcp', '-p', '127.0.0.1::5432', 'postgres:16-alpine');
  created = true;
  const port = Number(docker('port', name, '5432/tcp').split(':').at(-1));
  for (let i = 0; ; i++) {
    try { docker('exec', name, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres'); break; }
    catch { if (i === 60) throw new Error('Disposable database failed to start'); await new Promise(resolve => setTimeout(resolve, 500)); }
  }
  admin = new pg.Pool({ host: '127.0.0.1', port, user: 'postgres', password, database: 'codex_telemetry_test_mcp' });
  await admin.query(await readFile(new URL('../../server/src/logdb/migrations/0004_gameplay_telemetry.sql', import.meta.url), 'utf8'));
  await admin.query('CREATE TABLE private_operational_log (secret text)');
  await admin.query(await readFile(new URL('./setup-reader.sql', import.meta.url), 'utf8'));
  // Test-only random hex, never a user-provided SQL string.
  await admin.query(`ALTER ROLE telemetry_reader PASSWORD '${password}'`);
  pool = new pg.Pool({ host: '127.0.0.1', port, user: 'telemetry_reader', password, database: 'codex_telemetry_test_mcp', max: 2 });
  await verifyReader(pool);
  await assert.rejects(verifyReader(admin));
  const connection = await pool.connect();
  try {
    await connection.query('SET default_transaction_read_only = off');
    await assert.rejects(connection.query('DELETE FROM gameplay_events'), error => error.code === '42501');
    await assert.rejects(connection.query('SELECT * FROM private_operational_log'), error => error.code === '42501');
  } finally { connection.release(true); }
  await admin.query('GRANT SELECT ON private_operational_log TO telemetry_reader');
  await assert.rejects(verifyReader(pool));
  await admin.query('REVOKE SELECT ON private_operational_log FROM telemetry_reader');

  const from = '2026-09-23T00:00:00Z', to = '2026-09-24T00:00:00Z', ts = Date.parse(from);
  for (const [id, cohort, version, stamp] of [['a','human','v1',ts], ['b','human','v1',ts], ['c','test','v1',ts], ['d','human','v2',ts], ['e','human','v1',Date.parse(to)]]) {
    await admin.query('INSERT INTO gameplay_events VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)', [id,stamp,version,'pseudo','session',cohort,'node','class',1,'death',JSON.stringify({ id, ts: stamp, payload: { kind: 'death' } })]);
  }
  await admin.query("INSERT INTO gameplay_daily VALUES ('2026-09-23','v1','human','node','class',1,'deaths','unknown',2,0)");
  const window = { from, to, gameVersion: 'v1' };
  assert.throws(() => eventQuery({ ...window, to: from }));
  assert.throws(() => eventQuery({ ...window, limit: 201 }));
  assert.throws(() => dailyQuery({ ...window, from: '2026-09-23T01:00:00Z' }));
  assert.throws(() => createApp({ token: 'short', pool, host: 'localhost' }));

  // Bind first, then pass the actual ephemeral port to the app's Host allowlist.
  const { createServer } = await import('node:http');
  listener = createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const host = `127.0.0.1:${listener.address().port}`;
  listener.on('request', createApp({ token, pool, host }));
  const url = new URL(`http://${host}/mcp`);
  assert.equal((await fetch(url, { method: 'POST' })).status, 401);
  assert.equal((await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer wrong' } })).status, 401);
  assert.equal((await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Origin: 'https://evil.example' } })).status, 403);
  const { request } = await import('node:http');
  const wrongHostStatus = await new Promise((resolve, reject) => {
    const req = request(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Host: 'evil.example' } }, res => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject); req.end();
  });
  assert.equal(wrongHostStatus, 403);
  client = new Client({ name: 'telemetry-test', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(url, { requestInit: { headers: { Authorization: `Bearer ${token}` } } }));
  const tools = await client.listTools();
  assert.equal(tools.tools.length, 3);
  assert.ok(tools.tools.every(tool => tool.annotations.readOnlyHint));
  const call = async (name, args) => {
    const response = await client.callTool({ name, arguments: args });
    assert.ok(!response.isError, JSON.stringify(response));
    return JSON.parse(response.content[0].text);
  };
  const first = await call('telemetry_events', { ...window, limit: 1 });
  assert.deepEqual(first.events.map(event => event.id), ['a']);
  const second = await call('telemetry_events', { ...window, limit: 1, after: first.next });
  assert.deepEqual(second.events.map(event => event.id), ['b']);
  assert.equal(second.next, null);
  const injection = await call('telemetry_events', { ...window, classId: "' OR 1=1 --" });
  assert.equal(injection.events.length, 0);
  const coverage = await call('telemetry_coverage', window);
  assert.equal(coverage.groups[0].events, '2');
  const daily = await call('telemetry_daily', window);
  assert.equal(daily.rows[0].count, '2');
  assert.equal(daily.nextOffset, null);
  const invalid = await client.callTool({ name: 'telemetry_events', arguments: { ...window, limit: 9999 } });
  assert.equal(invalid.isError, true);
  await admin.query('REVOKE SELECT ON gameplay_events FROM telemetry_reader');
  const denied = await client.callTool({ name: 'telemetry_events', arguments: window });
  assert.equal(denied.isError, true);
  assert.ok(!JSON.stringify(denied).includes(password));
  assert.ok(!JSON.stringify(denied).includes('permission denied for table'));
  console.log('telemetry-mcp: ok (real PostgreSQL grants, production migration, authenticated MCP handshake/tools, filters, pagination, injection, validation, sanitized errors)');
} finally {
  await client?.close();
  if (listener) await new Promise(resolve => listener.close(resolve));
  await pool?.end();
  await admin?.end();
  if (created) docker('stop', name);
}
