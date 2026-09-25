const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=__dirname,hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const runs=['baseline','desert-dr','jungle-frequency','jungle-strength','fresh-baseline','fresh-jungle-frequency','fresh-jungle-strength','fixed-threat','bunker','bunker-burst','diagnostic-replay','reversal-baseline','reversal-frequency'];
const rows={},receipts=[];
for(const run of runs){const dir=path.join(root,run),done=JSON.parse(fs.readFileSync(path.join(dir,'complete.json')));rows[run]=fs.readFileSync(path.join(dir,'rows.jsonl'),'utf8').trim().split('\n').map(JSON.parse);assert.equal(done.completed,done.expected);assert.equal(rows[run].length,done.expected);receipts.push({run,...done,rowsSha256:hash(path.join(dir,'rows.jsonl')),manifestSha256:hash(path.join(dir,'manifest.json'))});}
assert.equal(receipts.reduce((n,r)=>n+r.completed,0),1282);
const key=r=>r.id+'/'+r.seed;
const compare=(a,b)=>{const map=new Map(rows[b].map(r=>[key(r),r]));for(const r of rows[a]){const old=map.get(key(r));assert(old);for(const field of ['outcome','elapsedMs','kills','hpEnd','hpLost','hpHealed','hitCount','evades','damage'])assert.equal(r[field],old[field],key(r)+' '+field);}};
compare('diagnostic-replay','baseline');compare('reversal-baseline','fresh-baseline');compare('reversal-frequency','fresh-jungle-frequency');
fs.writeFileSync(path.join(root,'RECEIPTS.json'),JSON.stringify({observations:1282,diagnosticParity:true,reversalParity:true,runs:receipts},null,2)+'\n');
const files=['server/src/systems/combat/engine/combat.ts','server/src/systems/combat/engine/combatPipeline.ts','server/src/systems/combatBootstrap.ts','server/src/systems/defense/index.ts','server/bench/defenseIteration03.ts','server/bench/defenseThreat03.ts','server/bench/defenseBunker03.ts','server/bench/defenseBurst03.ts','server/test/defenseMeasurements.test.ts'];
fs.writeFileSync(path.join(root,'SOURCE-FILES.json'),JSON.stringify(files.map(file=>({file,sha256:hash(path.resolve(root,'../..',file))})),null,2)+'\n');
console.log('1282 observations reconciled; diagnostic and reversal parity passed.');
