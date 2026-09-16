import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function verifySurvey(dir, expected) {
  const failures = [];
  const check = (label, actual, wanted) => {
    try { assert.deepEqual(actual, wanted); }
    catch { failures.push(`${label}: expected ${JSON.stringify(wanted)}, got ${JSON.stringify(actual)}`); }
  };
  const read = name => JSON.parse(readFileSync(join(dir,name),'utf8'));
  const manifest = read('manifest.json'), complete = read('complete.json'), index = read('index.json');
  for (const key of ['trial','revision','mode']) check(key,manifest[key],expected[key]);
  for (const key of ['definitionsHash','hitboxesSha256']) check(key,String(manifest[key]).toLowerCase(),expected[key].toLowerCase());
  check('seeds',manifest.seeds,expected.seeds);
  check('complete.mode',complete.mode,expected.mode);
  check('complete.cells',complete.cells,expected.cells);
  check('complete.runs',complete.runs,expected.runs);
  check('failed.json exists',existsSync(join(dir,'failed.json')),false);
  check('index length',index.length,expected.runs);
  check('manifest cell count',manifest.cells.length,expected.cells);
  const ids = new Set(manifest.cells.map(c=>c.id));
  check('unique manifest cells',ids.size,expected.cells);
  const seen = new Set();
  for(const row of index) {
    const key = `${row.cell}-s${row.seed}`;
    check(`${key} declared cell`,ids.has(row.cell),true);
    check(`${key} declared seed`,expected.seeds.includes(row.seed),true);
    check(`${key} duplicate`,seen.has(key),false); seen.add(key);
    check(`${key} outcome`,['window-ended','player-died'].includes(row.outcome),true);
    for(const file of ['ready.json','summary.json','events.jsonl','samples.jsonl'])
      check(`${key}/${file} exists`,existsSync(join(dir,key,file)),true);
  }
  for(const id of ids) for(const seed of expected.seeds) check(`${id}-s${seed} present`,seen.has(`${id}-s${seed}`),true);
  if(failures.length) throw Error('Survey verification failed:\n'+failures.join('\n'));
  return { trial: manifest.trial, cells: complete.cells, runs: index.length, verified: true };
}

if(process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args=Object.fromEntries(process.argv.slice(2).map(s=>{const i=s.indexOf('=');return [s.slice(2,i),s.slice(i+1)];}));
  try {
    console.log(JSON.stringify(verifySurvey(args.out,{
      trial:args.trial,revision:args.revision,definitionsHash:args.definitions,
      hitboxesSha256:args.hitboxes,mode:'run',cells:Number(args.cells),runs:Number(args.runs),
      seeds:args.seeds.split(',').map(Number),
    })));
  } catch(error) { console.error(String(error)); process.exitCode=1; }
}
