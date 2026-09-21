import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { NODE_BIOMES, SKILL_TREE } from '@mmo-idle/shared';
import { BREADTH_CELLS, assertBreadthDefinitions } from '../bench/balance/playerBreadthSpec';
import { fastPassReadback } from '../bench/balance/playerFastPassSpec';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { teardownArena } from '../bench/balance/arena';
import { prepareConduitRecorder } from '../bench/balance/conduitRecorder';
import { hydrateHitboxCacheFromArtifact } from '../src/hitbox/cache';
import { checkpointDefinitionsHash } from '../src/admin/progressionCheckpoint';

const args = Object.fromEntries(process.argv.slice(2).map(x => { const i=x.indexOf('='); return [x.slice(2,i),x.slice(i+1)]; }));
assert(args.out && args.hitboxes);
hydrateHitboxCacheFromArtifact(args.hitboxes);
assertBreadthDefinitions();
const out=resolve(args.out); mkdirSync(out,{recursive:true});
const write=(name:string,value:unknown)=>writeFileSync(join(out,name),JSON.stringify(value,null,2)+'\n');
const receipts: unknown[] = [], errors: {caseId:string;error:string}[] = [];
for(const cell of BREADTH_CELLS) {
  const world=createBalanceWorld();
  try {
    // No thaw, wake tick, combat or respawn. Production unlock/equipment/ability APIs only.
    const {bot,view}=prepareSurveyBot(world,cell,{x:2400,y:2400});
    const recorder=prepareConduitRecorder(world,bot,cell);
    const conduitProfile=recorder?.profileReceipt() ?? null;
    receipts.push({caseId:cell.id,playerTreatment:cell.playerTreatment,controlCaseId:cell.controlCaseId,
      fixture:{nodeId:cell.nodeId,biome:NODE_BIOMES[cell.nodeId],seed:101003,dtMs:100,capMs:300000},
      packageReadback:fastPassReadback(cell,bot,view.globalMastery),effectiveStats:view,conduitProfile,worldTicks:0});
    recorder?.finish('zero-tick-qualification');
  } catch(e) { errors.push({caseId:cell.id,error:String(e)}); }
  finally {teardownArena(world);}
}
write('resolved-builds.json',receipts); write('legality.json',{planned:204,qualified:receipts.length,worldTicks:0,definitionsHash:checkpointDefinitionsHash(),errors});
const controls=BREADTH_CELLS.filter(c=>c.playerTreatment==='untreated');
const identities=[...new Set(controls.map(c=>c.identityId))].map(id=>({id,packages:controls.filter(c=>c.identityId===id)}));
write('catalogue.json',{schema:1,mainIdentities:90,rangeExtensionIdentities:3,observations:204,identities,
  omissions:[...SKILL_TREE.values()].filter(n=>n.description.includes('[Placeholder]')).map(n=>({id:n.id,reason:'Generated future placeholder, outside reachable public T4 path layer.'})),
  historicalReuse:[],candidateCases:BREADTH_CELLS.filter(c=>c.controlCaseId)});
write('cases.json',BREADTH_CELLS);
write('effective-profiles.json',receipts.filter((r:any)=>r.conduitProfile).map((r:any)=>({caseId:r.caseId,...r.conduitProfile})));
const rows=identities.map(i=>{ const farm=i.packages[0],boss=i.packages[1];return `| ${i.id} | ${farm.pathName} | ${farm.range??'none'} | ${farm.build.gearItemIds.weapon} | ${farm.build.gearItemIds.core} / ${boss.build.gearItemIds.core} | ${farm.build.gearItemIds.relic??'none'} | ${farm.abilities!.techniques.join(', ')} | ${boss.stance} |`; });
writeFileSync(join(out,'catalogue.md'),'# Player breadth 01 catalogue\n\n90 main identities plus three T3 Conduit far-range identities. Farm and boss have separate declared packages in catalogue.json; exact RP, stats and legal upgrades are in resolved-builds.json. No combat used to choose these packages.\n\n| Identity | Path/frame | Range | Weapon | Core farm / boss | Relic | Farm priority | Boss stance |\n|---|---|---|---|---|---|---|---|\n'+rows.join('\n')+'\n');
if(errors.length) {console.error(JSON.stringify(errors));process.exitCode=1;} else console.log('204 loadouts qualified with zero World ticks.');
