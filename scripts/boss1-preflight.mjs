import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {night5ChildArgs} from './night5-child-args.mjs';
const source=resolve(fileURLToPath(new URL('..',import.meta.url)));
const [root,hitboxes]=process.argv.slice(2);
assert(root&&hitboxes&&!existsSync(root),'NEW preflight root and hitbox artifact required');
mkdirSync(root,{recursive:true});

// Boss1 installs NOTHING -- the boss and its three escorts are authored source, so
// every `hpTreatment` must be EMPTY. The load-bearing check beyond that is that the
// PILOT actually reached the boss: `--mode boss` spent its whole history measuring
// dungeon GUARDS, so "the encounter ran" is the one thing a boss preflight must
// prove rather than assume.
const BLOCK='sovereign';
const CELLS=6, SEEDS=[94011,94019];
const BOSS_ID='charnel-crown-sovereign';
const BOSS={hp:19499,attack:115,plating:14,damageReduction:0.08};
const ESCORTS={'bone-crawler':{hp:1235,attack:85},'plague-hound':{hp:1901,attack:105},'carrion-vulture':{hp:1616,attack:95}};

for(const mode of ['qualify','pilot']){
 const out=join(root,`${BLOCK}-${mode}`);
 const result=spawnSync(process.execPath,night5ChildArgs(source,'server/scripts/bossScreen.ts',['--trial=boss1',`--block=${BLOCK}`,`--mode=${mode}`,`--out=${out}`,`--hitboxes=${hitboxes}`]),{cwd:source,encoding:'utf8',timeout:1800000,windowsHide:true});
 writeFileSync(join(root,`${BLOCK}-${mode}.log`),result.stdout+'\n'+result.stderr);
 assert.equal(result.status,0,result.stderr);
 const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
 const manifest=read('manifest.json');

 assert.equal(manifest.trial,'boss1');
 assert.equal(manifest.block,BLOCK);
 assert.equal(manifest.bossId,BOSS_ID,'boss identity drift');
 assert.equal(manifest.synthetic,true);
 assert.equal(manifest.economyEligible,false);
 assert.equal(manifest.dtMs,100);
 // Guardian access is a SEPARATE question. The guard is stripped by design, and the
 // manifest must say so rather than let a reader pool access into the boss figure.
 assert.equal(manifest.guardianAccess,'not-measured-guard-stripped');
 assert.equal(manifest.durationMs,mode==='pilot'?60000:600000,'window drift');
 assert.deepEqual(manifest.seeds,[SEEDS[0]],`${mode} runs one seed`);
 const arms=[...new Set(manifest.cells.map(c=>c.treatment))];
 assert.deepEqual(arms,['boss-baseline'],`every cell must declare its arm, got ${JSON.stringify(arms)}`);

 if(mode==='qualify'){
  assert.equal(manifest.cells.length,CELLS,'six roots must qualify');
  assert.equal(new Set(manifest.cells.map(c=>c.className)).size,CELLS,'roots must be distinct');
  // Qualify returns READY receipts in index.json without writing observation dirs.
  const index=read('index.json');
  assert.equal(index.length,CELLS,'one ready receipt per root');
  for(const ready of index){
   assert.deepEqual(ready.hpTreatment,[],`${ready.cell}: Boss1 installs nothing`);
   assert.equal(ready.synthetic,true);
   assert.equal(ready.bossId,BOSS_ID);
   // The boss must have WOKEN and be standing at its authored budget.
   assert.equal(ready.bossAuthored.hp,BOSS.hp,`${ready.cell}: boss hp drift`);
   assert.equal(ready.bossAuthored.attack,BOSS.attack,`${ready.cell}: boss attack drift`);
   assert(ready.bossRuntime.maxHp>0,`${ready.cell}: boss never woke`);
   assert(ready.initialRoster.some(m=>m.type===BOSS_ID),`${ready.cell}: boss absent from the roster`);
   // The escort receipt: the three adoption-changed species, at adopted values.
   for(const [id,want] of Object.entries(ESCORTS)){
    assert.equal(ready.escortsAuthored[id].hp,want.hp,`${ready.cell}: ${id} hp is not the adopted value`);
    assert.equal(ready.escortsAuthored[id].attack,want.attack,`${ready.cell}: ${id} attack drift`);
   }
  }
 } else {
  assert.equal(manifest.cells.length,1,'the pilot is one cell');
  const index=read('index.json');
  assert.equal(index.length,1,'one pilot observation');
  const r=index[0];
  // THE check: the pilot must have fought the real encounter and produced the
  // report outputs the packet requires, not merely exited zero.
  assert(r.bossMaxHp>=BOSS.hp,`pilot never met the boss (bossMaxHp ${r.bossMaxHp})`);
  assert(r.bossHpFractionRemoved>0,'pilot removed no boss HP; the encounter was not exercised');
  assert(r.castsStarted>0,'pilot saw no boss cast; the script never ran');
  assert(['boss-killed','bot-died','capped'].includes(r.outcome),`unexpected outcome ${r.outcome}`);
  assert(typeof r.damageFromAdds==='object','add pressure must be attributed separately');
  assert(typeof r.attackBeats==='number'&&typeof r.minionAttackBeats==='number',
   'owner and summon beats must be reported separately');
  assert(existsSync(join(out,`${r.cell}-s${r.seed}/ready.json`)),'per-observation receipt missing');
  assert(existsSync(join(out,`${r.cell}-s${r.seed}/events.jsonl`)),'event log missing');
  // Add attribution must not carry the boss's own damage, which is the pooling the
  // packet forbids; the runner resolves display names back to type ids for this.
  assert(!Object.keys(r.damageFromAdds).includes(BOSS_ID),'boss damage leaked into the adds bucket');
  writeFileSync(join(root,'pilot-evidence.json'),JSON.stringify({
   cell:r.cell,seed:r.seed,outcome:r.outcome,elapsedMs:r.elapsedMs,
   bossHpFractionRemoved:r.bossHpFractionRemoved,crossedHalfAtMs:r.crossedHalfAtMs,
   castLabels:r.castLabels,maxAddsAlive:r.maxAddsAlive,
   damageFromBoss:r.damageFromBoss,damageFromAdds:r.damageFromAdds,
  },null,2));
 }
 console.log(BLOCK,mode,'ok');
}
console.log('boss1 preflight: ok — pilot evidence at',join(root,'pilot-evidence.json'));
