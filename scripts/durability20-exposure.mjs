import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

// Report exposure limits without turning gameplay deaths/stalls into tooling
// failures or deleting them from the raw experiment. Verify identity separately.
const dir=process.argv[2];
assert(dir,'Provide the completed Durability20 output directory');
const read=name=>JSON.parse(readFileSync(join(dir,name),'utf8'));
const manifest=read('manifest.json'),index=read('index.json');
const cells=new Map(manifest.cells.map(c=>[c.id,c]));
const groups=new Map();
const rows=index.map(row=>{
  const cell=cells.get(row.cell); assert(cell?.treatment);
  const samples=readFileSync(join(dir,`${row.cell}-s${row.seed}`,'samples.jsonl'),'utf8')
    .trim().split('\n').map(line=>JSON.parse(line));
  assert(samples.length>0);
  let maxQuietMs=0,previous=-1000,blockedSamples=0;
  for(const sample of samples) {
    assert.equal(sample.atMs-previous,1000,'Missing or unordered exposure samples');
    previous=sample.atMs;
    assert(Number.isFinite(sample.lastOutgoingDamageMs)&&sample.lastOutgoingDamageMs<=sample.atMs);
    maxQuietMs=Math.max(maxQuietMs,sample.atMs-sample.lastOutgoingDamageMs);
    if(sample.blockedApproach) blockedSamples++;
  }
  assert(row.elapsedMs-previous<=1000,'Missing terminal exposure samples');
  const lastDamage=Math.max(0,...row.targets.map(t=>t.lastDamageMs??0));
  const terminalQuietMs=row.elapsedMs-lastDamage;
  maxQuietMs=Math.max(maxQuietMs,terminalQuietMs);
  const result={cell:row.cell,seed:row.seed,treatment:cell.treatment,outcome:row.outcome,
    maxQuietMs,terminalQuietMs,blockedSamples,hasLongQuiet:maxQuietMs>=30000};
  const key=row.cell.slice(0,-cell.treatment.length-1)+'-s'+row.seed;
  if(!groups.has(key)) groups.set(key,[]);
  groups.get(key).push(result);
  return result;
});
const matchedSets=[...groups].map(([key,arms])=>{
  assert.equal(arms.length,1,'Incomplete matched treatment set');
  assert.equal(new Set(arms.map(r=>r.treatment)).size,1);
  return {key,allArmsWithoutLongQuiet:arms.every(r=>!r.hasLongQuiet),
    affectedArms:arms.filter(r=>r.hasLongQuiet).map(r=>r.treatment)};
});
const result={rows,matchedSets,longQuietRuns:rows.filter(r=>r.hasLongQuiet).length,
  deaths:rows.filter(r=>r.outcome==='player-died').length};
writeFileSync(join(dir,'exposure-audit.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({runs:rows.length,matchedSets:matchedSets.length,
  longQuietRuns:result.longQuietRuns,deaths:result.deaths}));
