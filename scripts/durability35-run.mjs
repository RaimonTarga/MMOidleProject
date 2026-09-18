import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,appendFileSync,createWriteStream} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {verifySurvey} from './ttk-survey-verify.mjs';
import {night5ChildArgs} from './night5-child-args.mjs';
import {isGlobalIdentityFailure} from './block-gate.mjs';
const args=Object.fromEntries(process.argv.slice(2).map(s=>{const i=s.indexOf('=');return [s.slice(2,i),s.slice(i+1)];}));
const source=resolve(fileURLToPath(new URL('..',import.meta.url)));
assert(args.out&&args.revision&&args.tree&&args.definitions&&args.hitboxes&&args['hitbox-hash'],'All identity inputs required');
const root=resolve(args.out);assert(!existsSync(root),'NEW output root required; no retries');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim(),args.revision);
assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:source,encoding:'utf8'}).trim(),'','Dirty source');
assert.equal(createHash('sha256').update(readFileSync(args.hitboxes)).digest('hex'),args['hitbox-hash'].toLowerCase());
assert.equal(execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:source,encoding:'utf8'}).trim(),args.tree);
mkdirSync(root,{recursive:true});
const started=Date.now();
// Both blocks are INDEPENDENT: neither gates the other, so a failure in one
// never costs the other its allocation. The navigation gate runs on the Jungle
// block as a REGRESSION WATCH, not as a scheduling dependency - Durability33
// already answered the navigation question, and a new trapped or unexplained row
// here invalidates that block's balance interpretation rather than skipping work.
const BLOCKS=[
 {name:'mountain-pressure',cells:24,seeds:[75011,77003,79001],limitMs:35*60000},
];
writeFileSync(join(root,'batch-manifest.json'),JSON.stringify({source,...args,blocks:BLOCKS.map(b=>b.name),started:new Date().toISOString(),ceilingHours:3},null,2));
const run=(script,argv,log,limitMs)=>new Promise((resolveRun,reject)=>{
 const stream=createWriteStream(log);const child=spawn(process.execPath,night5ChildArgs(source,script,argv),{cwd:source,stdio:['ignore','pipe','pipe'],windowsHide:true});
 child.stdout.pipe(stream);child.stderr.pipe(stream);let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;child.kill();},limitMs);child.on('error',reject);
 child.on('close',code=>{clearTimeout(timer);stream.end(()=>resolveRun({code,timedOut}));});
});
const state={};
const note=entry=>appendFileSync(join(root,'operator-ledger.jsonl'),JSON.stringify(entry)+'\n');
for(const block of BLOCKS){
 const remaining=3*3600000-(Date.now()-started);
 if(remaining<=0){writeFileSync(join(root,'stopped.json'),JSON.stringify({reason:'batch-ceiling',block:block.name}));break;}
 const out=join(root,block.name),start=new Date().toISOString();
 const result=await run('server/scripts/ttkSurvey.ts',['--trial=durability35',`--block=${block.name}`,'--mode=run',`--out=${out}`,`--revision=${args.revision}`,`--hitboxes=${args.hitboxes}`],join(root,`${block.name}.log`),Math.min(remaining,block.limitMs));
 note({block:block.name,start,end:new Date().toISOString(),...result});
 state[block.name]={artifactVerified:false};
 if(existsSync(join(out,'index.json'))){
  for(const script of ['scripts/ttk-survey-report.mjs','scripts/night5-audit.mjs']){
   const report=await run(script,[out],join(root,`${block.name}-${script.split('/').pop()}.log`),120000);
   assert.equal(report.code,0,'Report/audit failure; preserve partials');
  }
  // Derived, read-only audits alongside the batch. They resolve arms from the
  // manifest, so an undeclared arm fails here rather than silently pooling.
  for(const script of ['scripts/charged-cast-audit.mjs','scripts/guard-window-audit.mjs']){
   const derived=await run(script,[`--block=${out}`,`--out=${join(root,'audits')}`,`--name=${block.name}`],join(root,`${block.name}-${script.split('/').pop()}.log`),180000);
   if(derived.code!==0) note({block:block.name,status:'derived-audit-failed',script});
  }
 }
 if(result.timedOut){writeFileSync(join(root,'stopped.json'),JSON.stringify({reason:'watchdog',block:block.name}));continue;}
 if(result.code!==0){note({block:block.name,status:'runner-failed-no-retry'});continue;}
 if(existsSync(join(out,'budget-exhausted.json'))){note({block:block.name,status:'block-budget-partial-not-verified'});continue;}
 try {
  const check=verifySurvey(out,{trial:'durability35',revision:args.revision,mode:'run',definitionsHash:args.definitions,hitboxesSha256:args['hitbox-hash'],cells:block.cells,runs:block.cells*3,seeds:block.seeds,allowCensored:true});
  writeFileSync(join(out,'verification.json'),JSON.stringify(check,null,2));
  state[block.name].artifactVerified=check.verified===true;
  console.log(block.name,JSON.stringify({artifactVerified:true}));
 } catch(error) {
  const detail=String(error?.message??error);
  writeFileSync(join(out,'verification.json'),JSON.stringify({verified:false,error:detail},null,2));
  note({block:block.name,status:'verification-failed',detail});
  if(isGlobalIdentityFailure(detail)){
   writeFileSync(join(root,'stopped.json'),JSON.stringify({reason:'identity-verification',block:block.name,detail}));
   break;
  }
  console.log(block.name,'verification failed; preserved without retry');
 }
}
writeFileSync(join(root,'batch-ended.json'),JSON.stringify({ended:new Date().toISOString(),wallMs:Date.now()-started,state,blocksStarted:BLOCKS.filter(b=>existsSync(join(root,b.name,'manifest.json'))).map(b=>b.name)},null,2));
