import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {night5ChildArgs} from './night5-child-args.mjs';
const source=resolve(fileURLToPath(new URL('..',import.meta.url)));
const [root,hitboxes]=process.argv.slice(2);assert(root&&hitboxes&&!existsSync(root));mkdirSync(root,{recursive:true});
for(const block of ['tundra','volcanic','trench'])for(const mode of ['qualify','pilot']){
 const out=join(root,`${block}-${mode}`);
 const result=spawnSync(process.execPath,night5ChildArgs(source,'server/scripts/ttkSurvey.ts',['--trial=durability21',`--block=${block}`,`--mode=${mode}`,`--out=${out}`,`--hitboxes=${hitboxes}`]),{cwd:source,encoding:'utf8',timeout:180000,windowsHide:true});
 writeFileSync(join(root,`${block}-${mode}.log`),result.stdout+'\n'+result.stderr);
 assert.equal(result.status,0,result.stderr);
 const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
 assert.equal(read('complete.json').runs,mode==='qualify'?12:6);
 const manifest=read('manifest.json');assert.equal(manifest.cells.length,12);assert(manifest.cells.every(c=>c.role===block));
 assert.deepEqual(manifest.seeds,[32003,34019,36007]);
 if(mode==='pilot'){
  assert(read('index.json').every(r=>['window-ended','player-died'].includes(r.outcome)));
  const audit=spawnSync(process.execPath,night5ChildArgs(source,'scripts/night5-audit.mjs',[out]),{cwd:source,encoding:'utf8',timeout:30000,windowsHide:true});assert.equal(audit.status,0,audit.stderr);
 }
 console.log(block,mode,'passed');
}
