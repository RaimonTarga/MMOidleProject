// Read-only production connectivity check. Never prints tokens or event payloads.
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const url = new URL(process.env.MMO_TELEMETRY_MCP_URL || 'https://telemetry-mcp-production.up.railway.app/mcp');
const token = process.env.MMO_TELEMETRY_MCP_TOKEN;
if (!token) throw new Error('MMO_TELEMETRY_MCP_TOKEN is required');
const client = new Client({ name: 'mmo-telemetry-connectivity-check', version: '1.0.0' });
try {
  const unauthorized = await fetch(url, { method: 'POST' });
  assert.equal(unauthorized.status, 401, 'Unauthenticated requests must be rejected');
  await client.connect(new StreamableHTTPClientTransport(url, { requestInit: { headers: { Authorization: `Bearer ${token}` } } }));
  const catalog = await client.listTools();
  assert.deepEqual(catalog.tools.map(tool => tool.name).sort(), ['telemetry_coverage', 'telemetry_daily', 'telemetry_events']);
  assert.ok(catalog.tools.every(tool => tool.annotations?.readOnlyHint));
  const to = new Date(), from = new Date(to.getTime() - 86400000);
  const window = { from: from.toISOString(), to: to.toISOString(), cohort: 'human' };
  const invoke = async (name, args) => {
    const response = await client.callTool({ name, arguments: args });
    if (response.isError) throw new Error(`${name} failed (details withheld)`);
    return JSON.parse(response.content[0].text);
  };
  const coverage = await invoke('telemetry_coverage', window);
  const sample = await invoke('telemetry_events', { ...window, limit: 1 });
  const today = Date.parse(to.toISOString().slice(0, 10));
  const daily = await invoke('telemetry_daily', {
    from: new Date(today - 86400000).toISOString(), to: new Date(today + 86400000).toISOString(), limit: 1,
  });
  console.log(JSON.stringify({ endpoint: url.href, authenticated: true, unauthorizedStatus: unauthorized.status,
    tools: catalog.tools.map(tool => tool.name), window,
    storedHumanEvents: coverage.groups.reduce((sum, group) => sum + BigInt(group.events), 0n).toString(),
    groups: coverage.groups, coverageTruncated: coverage.truncated,
    detailRead: sample.events.length, dailyRead: daily.rows.length,
  }, null, 2));
} catch (error) {
  console.error(`Live check failed: ${error instanceof assert.AssertionError ? error.message : 'connection or query error; inspect service health and credentials'}`);
  process.exitCode = 1;
} finally { await client.close(); }
