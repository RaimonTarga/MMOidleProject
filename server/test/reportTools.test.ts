import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { ITEM_DATABASE } from '@mmo-idle/shared';

const root = resolve(__dirname, '../..');
const outputs = ['dps', 'ehp'].map(kind => resolve(root, `reports/${kind}-llm-packet-t1.md`));
const previous = outputs.map(file => existsSync(file) ? readFileSync(file) : null);
try {
  for (const kind of ['dps', 'ehp']) {
    execFileSync(process.execPath, ['--conditions=development', '--import', 'tsx',
      resolve(root, `tools/${kind}-report.ts`), '--llm-packet', '--tier=1'],
    { cwd: resolve(root, 'server'), env: { ...process.env, TSX_TSCONFIG_PATH: resolve(root, 'tools/tsconfig.json') } });
  }
  const [dps, ehp] = outputs.map(file => readFileSync(file, 'utf8'));
  for (const [id, attack] of [['ashbrand-blade', 18], ['chaotic-axe', 29], ['flash-rapier', 12],
    ['heavy-hammer', 38], ['iron-broadsword', 19]] as const) {
    const name = ITEM_DATABASE.get(id)!.name;
    const rows = dps.split('\n').filter(line => line.startsWith(`| ${name} | attack=`));
    assert.equal(rows.length, 1, `${id}: exactly one full-power input row`);
    assert(rows[0].includes(`attack=${attack}.0`), `${id}: weaponCurve pin`);
  }
  for (const report of [dps, ehp]) {
    assert(!report.includes('| Plus |'), 'no upgrade column');
    assert(!/\+0|\+3|\+5/.test(report), 'no retired upgrade levels');
  }
  assert(ehp.includes('Current full power vs current mobs'));
  assert(!ehp.includes('(geared)'), 'no duplicate upgrade checkpoint');
} finally {
  outputs.forEach((file, index) => {
    const original = previous[index];
    if (original) writeFileSync(file, original);
    else if (existsSync(file)) unlinkSync(file);
  });
}
console.log('reportTools: ok');
