import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

// Conservative exposure gate. Failing it is a request for diagnosis, not a
// balance verdict. Run artifact verification separately before this gate.
const dir=process.argv[2];
assert(dir,'Provide the completed movement output directory');
const rows=JSON.parse(readFileSync(join(dir,'index.json'),'utf8'));
assert.equal(rows.length,15);
const results=rows.map(row=>{
  const samples=readFileSync(join(dir,`${row.cell}-s${row.seed}`,'samples.jsonl'),'utf8')
    .trim().split('\n').map(line=>JSON.parse(line));
  assert(samples.length>0);
  let maxQuietMs=0;
  for(const sample of samples) {
    assert(Number.isFinite(sample.lastOutgoingDamageMs),'Missing exposure telemetry');
    assert(sample.lastOutgoingDamageMs<=sample.atMs);
    maxQuietMs=Math.max(maxQuietMs,sample.atMs-sample.lastOutgoingDamageMs);
  }
  const last=samples.at(-1);
  const pass=row.outcome==='window-ended'&&row.elapsedMs===300000&&last.atMs>=299900&&maxQuietMs<30000;
  return {cell:row.cell,seed:row.seed,outcome:row.outcome,maxQuietMs,pass};
});
const result={passed:results.every(r=>r.pass),results};
writeFileSync(join(dir,'engagement-gate.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
if(!result.passed) process.exitCode=1;
