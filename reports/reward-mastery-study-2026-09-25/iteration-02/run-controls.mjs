import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../../../..','mmo-reward-baseline'),out=resolve(here,'frozen-controls-final');
if(existsSync(out))throw Error('Fresh output required');
mkdirSync(resolve(out,'jobs'),{recursive:true});
const expected=JSON.parse(readFileSync(resolve(here,'source-screen.json'))).sources.baseline.files;
// The main hazard file had already drifted by source-screen capture. Use the frozen candidate's original non-economic hazard source as the control reference.
expected['shared/src/world/nodeFeatures.ts']=JSON.parse(readFileSync(resolve(here,'source-before.json'))).sources.candidate.files['shared/src/world/nodeFeatures.ts'];
const actual=Object.fromEntries(Object.keys(expected).map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]));
const differences=Object.keys(expected).filter(p=>expected[p]!==actual[p]);
writeFileSync(resolve(out,'source-parity.json'),JSON.stringify({root,differences,files:actual},null,2));
if(differences.length)throw Error('Baseline source differs: '+differences.join(', '));
const harness=resolve(root,'reports/reward-mastery-study-2026-09-25/run-bot-survivors.ts');mkdirSync(dirname(harness),{recursive:true});copyFileSync(resolve(here,'../run-bot-survivors.ts'),harness);
const byId=new Map();
for(const batch of ['screen','confirmation'])for(const j of JSON.parse(readFileSync(resolve(here,batch,'manifest.json'))).jobs) {
 if(j.arm!=='baseline'||!existsSync(j.output))continue;
 const result=JSON.parse(readFileSync(j.output));
 byId.set(j.id,{...j,output:resolve(out,j.id+'.json'),controlReplaces:j.output});
}
const jobs=[...byId.values()];
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),root,jobs},null,2));
for(const j of jobs)writeFileSync(resolve(out,'jobs',j.id+'.json'),JSON.stringify(j,null,2));
let next=0;const results=[];
async function worker(){while(next<jobs.length){const j=jobs[next++];const result=await new Promise(done=>{
 const child=spawn(process.execPath,[resolve(root,'server/node_modules/tsx/dist/cli.mjs'),'--conditions=development',harness,resolve(out,'jobs',j.id+'.json')],{cwd:root,windowsHide:true});let log='';child.stdout.on('data',x=>log+=x);child.stderr.on('data',x=>log+=x);child.on('error',x=>log+=String(x));child.on('close',code=>{writeFileSync(resolve(out,j.id+'.log'),log);done({id:j.id,code,outputExists:existsSync(j.output)});});
 });results.push(result);writeFileSync(resolve(out,'status.json'),JSON.stringify({done:results.length,total:jobs.length,results},null,2));console.log(results.length+'/'+jobs.length+' '+JSON.stringify(result));}}
await Promise.all(Array.from({length:4},worker));
const after=Object.fromEntries(Object.keys(expected).map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]));
writeFileSync(resolve(out,'complete.json'),JSON.stringify({done:results.length,total:jobs.length,failures:results.filter(r=>r.code!==0||!r.outputExists),sourceDrift:Object.keys(expected).filter(p=>expected[p]!==after[p])},null,2));
