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
const started=Date.now();
// Order is A -> B -> C. C is GATED on Block A: Jungle breadth is only interpretable
// once the diagnosed navigation trap is gone. B is independent and must keep its
// allocation even if a Jungle block fails.
const BLOCKS=[
 {name:'jungle-repair',cells:4,seeds:[44017,46021,48017],limitMs:20*60000},
 {name:'mountain-powershot',cells:24,seeds:[51001,53017,55009],limitMs:35*60000},
 {name:'jungle-breadth',cells:12,seeds:[51001,53017,55009],limitMs:35*60000,requires:'jungle-repair'},
];
writeFileSync(join(root,'batch-manifest.json'),JSON.stringify({source,...args,blocks:BLOCKS.map(b=>b.name),started:new Date().toISOString(),ceilingHours:3},null,2));
const run=(script,argv,log,limitMs)=>new Promise((resolveRun,reject)=>{
 const stream=createWriteStream(log);const child=spawn(process.execPath,night5ChildArgs(source,script,argv),{cwd:source,stdio:['ignore','pipe','pipe'],windowsHide:true});
 child.stdout.pipe(stream);child.stderr.pipe(stream);let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;child.kill();},limitMs);child.on('error',reject);
 child.on('close',code=>{clearTimeout(timer);stream.end(()=>resolveRun({code,timedOut}));});
});
const verified={};
for(const block of BLOCKS){
 const remaining=3*3600000-(Date.now()-started);
 if(remaining<=0){writeFileSync(join(root,'stopped.json'),JSON.stringify({reason:'batch-ceiling',block:block.name}));break;}
 if(block.requires&&verified[block.requires]!==true){
  appendFileSync(join(root,'operator-ledger.jsonl'),JSON.stringify({block:block.name,status:'skipped-gate',requires:block.requires})+'\n');
  continue;
 }
 const out=join(root,block.name),start=new Date().toISOString();
 const result=await run('server/scripts/ttkSurvey.ts',['--trial=durability32',`--block=${block.name}`,'--mode=run',`--out=${out}`,`--revision=${args.revision}`,`--hitboxes=${args.hitboxes}`],join(root,`${block.name}.log`),Math.min(remaining,block.limitMs));
 appendFileSync(join(root,'operator-ledger.jsonl'),JSON.stringify({block:block.name,start,end:new Date().toISOString(),...result})+'\n');
 if(existsSync(join(out,'index.json'))){
  for(const script of ['scripts/ttk-survey-report.mjs','scripts/night5-audit.mjs']){
   const report=await run(script,[out],join(root,`${block.name}-${script.split('/').pop()}.log`),120000);
   assert.equal(report.code,0,'Report/audit failure; preserve partials');
  }
 }
 if(result.timedOut){writeFileSync(join(root,'stopped.json'),JSON.stringify({reason:'watchdog',block:block.name}));continue;}
 // A block-level failure stops that block without a retry. Blocks that do not
 // depend on it still run, which is what keeps Block B's allocation safe.
 if(result.code!==0){appendFileSync(join(root,'operator-ledger.jsonl'),JSON.stringify({block:block.name,status:'runner-failed-no-retry'})+'\n');continue;}
 if(existsSync(join(out,'budget-exhausted.json'))){appendFileSync(join(root,'operator-ledger.jsonl'),JSON.stringify({block:block.name,status:'block-budget-partial-not-verified'})+'\n');continue;}
 // verifySurvey throws. A block-local failure (counts, outcome labels) must not
 // cost an independent block its allocation, but an identity failure is a global
 // fault: every remaining block would be measuring the wrong source.
 try {
  const check=verifySurvey(out,{trial:'durability32',revision:args.revision,mode:'run',definitionsHash:args.definitions,hitboxesSha256:args['hitbox-hash'],cells:block.cells,runs:block.cells*3,seeds:block.seeds,allowCensored:true});
  writeFileSync(join(out,'verification.json'),JSON.stringify(check,null,2));
  verified[block.name]=check.verified===true;
  console.log(block.name,JSON.stringify(check));
 } catch(error) {
  const detail=String(error?.message??error);
  writeFileSync(join(out,'verification.json'),JSON.stringify({verified:false,error:detail},null,2));
  appendFileSync(join(root,'operator-ledger.jsonl'),JSON.stringify({block:block.name,status:'verification-failed',detail})+'\n');
  verified[block.name]=false;
  if(/\b(trial|revision|definitionsHash|hitboxesSha256)\b/.test(detail)){
   writeFileSync(join(root,'stopped.json'),JSON.stringify({reason:'identity-verification',block:block.name,detail}));
   break;
  }
  console.log(block.name,'verification failed; preserved without retry');
 }
}
writeFileSync(join(root,'batch-ended.json'),JSON.stringify({ended:new Date().toISOString(),wallMs:Date.now()-started,verified,blocksStarted:BLOCKS.filter(b=>existsSync(join(root,b.name,'manifest.json'))).map(b=>b.name)}));
