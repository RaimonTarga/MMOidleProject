import assert from 'node:assert/strict';
import { RouteExecutor, type ExecutorDeps } from '../route/executor';
import { NAMED_CHECKPOINT_ROUTES } from './namedCheckpoints';
import { requirePolicy } from '../policy/profiles';
async function main() {
  const names:string[]=[];const actions:string[]=[];
  const baseline=NAMED_CHECKPOINT_ROUTES.find(r=>r.id.endsWith('-baseline'))!;
  assert(!baseline.steps.some(s=>['chooseClass','unlockSkill','craft','upgrade','attemptBoss'].includes(s.type)),'No skipped prefix in continuation');
  const route={...baseline,completion:{type:'elapsedMs' as const,ms:0},steps:[{type:'captureCheckpoint' as const,boundaryId:'first'},{type:'captureCheckpoint' as const,boundaryId:'second'}]};
  const runner=new RouteExecutor({route,policy:requirePolicy('intended'),aborted:()=>false,startedAt:Date.now(),obs:{self:null},
    recorder:{now:()=>0,emit:()=>{}},captureCheckpoint:async (id: string)=>{names.push(id);},
    intents:{setAuto:()=>actions.push('auto-off'),setAutoTraverse:()=>actions.push('traverse-off')},
  } as unknown as ExecutorDeps);
  await runner.run();assert.deepEqual(names,['first','second']);assert.equal(actions.length,4);
  assert.equal(runner.outcomes.length,2,'Pre-satisfied completion must not skip named capture');
  console.log('named checkpoint continuation: ok');
}
main().catch(error=>{console.error(error);process.exitCode=1;});

