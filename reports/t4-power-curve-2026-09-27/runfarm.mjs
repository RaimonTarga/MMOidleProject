import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
const [plan, out, n = '10'] = process.argv.slice(2);
rmSync(out, { force: true });
const cwd = 'C:/Users/osaif/Documents/Claude/Projects/mmo-integration/server';
const hb = 'C:/Users/osaif/AppData/Local/Temp/claude/t4/hitboxes.json';
let done = 0; const N = Number(n);
for (let i = 0; i < N; i++) {
  const p = spawn(process.execPath, ['--conditions=development', '--import', 'tsx', 'scripts/_t1BossLab.ts', `--plan=${plan}`, `--out=${out}`, `--hitboxes=${hb}`, `--shard=${i}`, `--shards=${N}`], { cwd, stdio: ['ignore', 'ignore', 'inherit'] });
  p.on('exit', (c) => { done++; if (c) console.error('shard', i, 'exit', c); if (done === N) console.log('all shards done'); });
}
