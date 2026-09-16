import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,appendFileSync,createWriteStream} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {verifySurvey} from './ttk-survey-verify.mjs';
import {night5ChildArgs} from './night5-child-args.mjs';
const args=Object.fromEntries(process.argv.slice(2).map(s=>{const i=s.indexOf('=');return [s.slice(2,i),s.slice(i+1)];}));
const source=resolve(fileURLToPath(new URL('..',import.meta.url)));
assert(args.out&&args.revision&&args.tree&&args.definitions&&args.hitboxes&&args['hitbox-hash'],'All identity inputs required');
const root=resolve(args.out);assert(!existsSync(root),'NEW output root required; no retries');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim(),args.revision);
assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:source,encoding:'utf8'}).trim(),'','Dirty source');
assert.equal(createHash('sha256').update(readFileSync(args.hitboxes)).digest('hex'),args['hitbox-hash'].toLowerCase());
assert.equal(execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:source,encoding:'utf8'}).trim(),args.tree);
mkdirSync(root,{recursive:true});
const started=Date.now(),blocks=['mountain','t4a','weapons','t4b','sustain','t4c'];
writeFileSync(join(root,'batch-manifest.json'),JSON.stringify({source,...args,blocks,started:new Date().toISOString(),ceilingHours:8},null,2));
const run=(script,argv,log,limitMs)=>new Promise((resolveRun,reject)=>{
 const stream=createWriteStream(log);const child=spawn(process.execPath,night5ChildArgs(source,script,argv),{cwd:source,stdio:['ignore','pipe','pipe'],windowsHide:true});
 child.stdout.pipe(stream);child.stderr.pipe(stream);let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;child.kill();},limitMs);child.on('error',reject);
 child.on('close',code=>{clearTimeout(timer);stream.end(()=>resolveRun({code,timedOut}));});
});
for(const block of blocks){
 const remaining=8*3600000-(Date.now()-started);if(remaining<=0)break;
 const out=join(root,block),start=new Date().toISOString();
 const result=await run('server/scripts/ttkSurvey.ts',['--trial=night5',`--block=${block}`,'--mode=run',`--out=${out}`,`--revision=${args.revision}`,`--hitboxes=${args.hitboxes}`],join(root,`${block}.log`),Math.min(remaining,80*60000));
 appendFileSync(join(root,'operator-ledger.jsonl'),JSON.stringify({block,start,end:new Date().toISOString(),...result})+'\n');
 if(existsSync(join(out,'index.json'))){
  for(const script of ['scripts/ttk-survey-report.mjs','scripts/night5-audit.mjs']){
   const report=await run(script,[out],join(root,`${block}-${script.split('/').pop()}.log`),120000);
   assert.equal(report.code,0,'Report/audit failure; preserve partials');
  }
 }
 if(result.timedOut){writeFileSync(join(root,'stopped.json'),JSON.stringify({reason:'watchdog',block}));break;}
 assert.equal(result.code,0,'Runner failure; stop without retry');
 if(existsSync(join(out,'budget-exhausted.json'))){appendFileSync(join(root,'operator-ledger.jsonl'),JSON.stringify({block,status:'block-budget-partial-not-verified'})+'\n');continue;}
 const expectedCells={mountain:80,t4a:84,weapons:144,t4b:84,sustain:48,t4c:84}[block];
 const verified=verifySurvey(out,{trial:'night5',revision:args.revision,mode:'run',definitionsHash:args.definitions,hitboxesSha256:args['hitbox-hash'],cells:expectedCells,runs:expectedCells*3,seeds:[26003,28001,30011],allowCensored:true});
 writeFileSync(join(out,'verification.json'),JSON.stringify(verified,null,2));
 console.log(block,JSON.stringify(verified));
}
writeFileSync(join(root,'batch-ended.json'),JSON.stringify({ended:new Date().toISOString(),wallMs:Date.now()-started,blocksStarted:blocks.filter(b=>existsSync(join(root,b,'manifest.json')))}));
