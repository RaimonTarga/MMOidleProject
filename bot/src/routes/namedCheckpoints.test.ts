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
  const captureRoute=NAMED_CHECKPOINT_ROUTES.find(r=>r.id.endsWith('-capture'))!;
  assert.equal(captureRoute.steps[0].type,'moveWithinNode','Gate spawn must walk before capture');
  const localStep=captureRoute.steps[0];if(localStep.type!=='moveWithinNode')throw new Error('Missing movement');
  const self={pos:{x:4795,y:2400},target:{x:4795,y:2400},auto:false,autoTraverse:false,isDead:false};
  const observed={self,nodeId:localStep.nodeId};let requested=false;
  const localRunner=new RouteExecutor({route:captureRoute,obs:observed,aborted:()=>false,startedAt:Date.now(),
    intents:{setAuto:()=>{},setAutoTraverse:()=>{},moveTo:(point:{x:number;y:number})=>{
      assert.deepEqual(self.pos,{x:4795,y:2400},'Executor does not rewrite observed position');
      requested=true;self.pos={...point};self.target={...point}; // simulated authoritative acknowledgement
    }},recorder:{now:()=>0,emit:()=>{}},
  } as unknown as ExecutorDeps);
  await (localRunner as unknown as {doMoveWithinNode(step:typeof localStep):Promise<void>}).doMoveWithinNode(localStep);
  assert(requested,'Ordinary movement intent was issued');assert.deepEqual(self.pos,localStep.position);
  observed.nodeId='node-clearing';
  await assert.rejects(()=>(localRunner as unknown as {doMoveWithinNode(step:typeof localStep):Promise<void>}).doMoveWithinNode(localStep),/declared starting node/);
  console.log('named checkpoint continuation: ok');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
