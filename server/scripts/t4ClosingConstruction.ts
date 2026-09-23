import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { T4_CELLS,PATHS,ALTERNATIVES } from '../bench/balance/t4ClosingSpec';
import { T4_CELLS as OLD } from '../bench/balance/t4SpecializationSpec';
import { createFarmWorld } from '../bench/balance/worldFactory';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { fastPassReadback } from '../bench/balance/playerFastPassSpec';
import { teardownArena } from '../bench/balance/arena';
const out=process.argv[2];assert(out);
const builds=[];
for(const c of T4_CELLS.filter(c=>c.seed===101009)){
 const world=createFarmWorld();world.tick=()=>{throw Error('Construction cannot tick World');};
 try{const {bot,view}=prepareSurveyBot(world,c,{x:2400,y:2800});builds.push({id:c.id,readback:fastPassReadback(c,bot,view.globalMastery)});}finally{teardownArena(world);}
}
for(const c of T4_CELLS.slice(432)){
 const p=T4_CELLS.find(x=>x.id===c.referenceObservationId)!;const alt=ALTERNATIVES.find(x=>x.spec===c.build.skillPath.at(-1))!;
 const norm=(x:typeof c)=>({...x,id:'',referenceObservationId:'',referenceSource:'',preparationNotes:[],build:{...x.build,id:'',gearItemIds:{...x.build.gearItemIds,[alt.slot]:''}}});assert.deepEqual(norm(c),norm(p));
}
writeFileSync(out,JSON.stringify({combatObservations:0,worldTicks:0,uniqueSeedPackages:builds.length,planned:T4_CELLS.length,paths:PATHS,alternatives:ALTERNATIVES,builds},null,2)+'\n');
console.log(JSON.stringify({worldTicks:0,legalPackages:builds.length,primary:432,optional:28}));
