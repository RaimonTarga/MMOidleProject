import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';
const root=process.cwd(), out=resolve(process.argv[2]);
if(existsSync(out))throw Error('Fresh output directory required');
mkdirSync(out,{recursive:true});
const sourceFiles=[];
function walk(dir){for(const x of readdirSync(join(root,dir),{withFileTypes:true})){const p=dir+'/'+x.name;if(x.isDirectory())walk(p);else if(/\.(ts|json)$/.test(p))sourceFiles.push(p);}}
for(const p of ['server/src','shared/src','server/bench','bot/src'])walk(p);
const digest=()=>Object.fromEntries(sourceFiles.sort().map(p=>[p,createHash('sha256').update(readFileSync(join(root,p))).digest('hex')]));
const hashes=digest();
const cases=[];
for(const tier of [3,4])for(const className of ['striker','slinger','conduit'])for(const seed of [101009,101021]) {
  for(const arm of ['baseline','heat','full'])cases.push({tier,className,seed,arm,mode:'farm',biome:'volcanic',durationMs:600000});
  cases.push({tier,className,seed,arm:'baseline',mode:'farm',biome:'tundra',durationMs:600000});
}
for(const tier of [3,4])for(const arm of ['baseline','full'])cases.push({tier,className:'striker',seed:101009,arm,mode:'boss',biome:'volcanic',durationMs:300000});
cases.forEach(c=>c.id=`${c.mode}-t${c.tier}-${c.biome}-${c.className}-${c.seed}-${c.arm}`);
const hitboxes='D:/mmo-idle/volcano-heat-management-01/hitboxes.json';
const manifest={id:'volcano-area-nerf-01',out,root,revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  synthetic:true,economyEligible:false,dtMs:100,description:'Mature balanced packages, T4 path b; fixed mastery, no extra Heat-management Rune. Three Volcano arms; Tundra contextual controls; four Striker boss boundaries. Baseline restored in memory from pre-edit values.',
  hitboxes,hitboxesSha256:createHash('sha256').update(readFileSync(hitboxes)).digest('hex'),sourceHashes:hashes,cases};
writeFileSync(join(out,'manifest.json'),JSON.stringify(manifest,null,2));
writeFileSync(join(out,'working.diff'),execFileSync('git',['diff'],{encoding:'utf8',maxBuffer:20000000}));
const results=[];
for(let i=0;i<cases.length;i++){
  if(JSON.stringify(digest())!==JSON.stringify(hashes))throw Error('Source changed during experiment');
  const r=spawnSync(process.execPath,[join(root,'server/node_modules/tsx/dist/cli.mjs'),'--conditions=development',join(root,'server/bench/balance/volcanoAreaStudy.ts'),join(out,'manifest.json'),String(i)],{cwd:root,encoding:'utf8',timeout:180000,maxBuffer:5000000,windowsHide:true});
  writeFileSync(join(out,cases[i].id+'.log'),(r.stdout??'')+'\n'+(r.stderr??''));
  const path=join(out,cases[i].id,'result.json');
  const row=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{...cases[i],outcome:'execution-failed',error:r.error?.message??r.stderr,exitCode:r.status};
  results.push(row);writeFileSync(join(out,'results.json'),JSON.stringify(results,null,2));
  console.log(`${i+1}/${cases.length} ${cases[i].id}: ${row.outcome}, kills=${row.work?.kills??'unavailable'}`);
}
if(JSON.stringify(digest())!==JSON.stringify(hashes))throw Error('Source changed during experiment');
writeFileSync(join(out,'complete.json'),JSON.stringify({completed:results.length,planned:cases.length,failures:results.filter(r=>r.outcome==='execution-failed').length},null,2));
