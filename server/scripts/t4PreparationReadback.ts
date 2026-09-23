import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {ABILITY_DATABASE, abilityRankNumber, runicPointBreakdown, runeRuleCost} from '@mmo-idle/shared';
import {T4_CELLS,T4_SNAPSHOT} from '../bench/balance/t4SpecializationSpec';
import {createFarmWorld} from '../bench/balance/worldFactory';
import {prepareSurveyBot} from '../bench/balance/ttkSurveySpec';
import {fastPassReadback} from '../bench/balance/playerFastPassSpec';
import {hydrateHitboxCacheFromArtifact} from '../src/hitbox/cache';
const dest=resolve(process.argv[2]);mkdirSync(dest,{recursive:true});
hydrateHitboxCacheFromArtifact(process.argv[3]);
const rows=[];
for(const cell of T4_CELLS.filter(c=>c.seed===101009)){
 const world=createFarmWorld();
 world.tick=()=>{throw Error('Preparation must never tick World');};
 const {bot,view}=prepareSurveyBot(world,cell,{x:2400,y:2400});
 const applied=fastPassReadback(cell,bot,view.globalMastery);
 for(const [slot,id] of Object.entries(cell.build.gearItemIds))assert.equal(bot.holdsInventory.itemUpgrades[id!],['core','relic'].includes(slot)?0:4,`${cell.id}: silent upgrade clamp ${id}`);
 const abilities=[...cell.abilities!.techniques,...cell.abilities!.guards].map(id=>{const a=ABILITY_DATABASE.get(id)!;return{id,rank:abilityRankNumber(a,4),rp:a.attunementCost,trigger:a.trigger,rankDefinition:a.ranks[abilityRankNumber(a,4)-1]};});
 rows.push({identityId:cell.identityId,context:cell.block,definition:cell,applied,view,abilities,
  rules:cell.runeRules!.map(rule=>({...rule,rp:runeRuleCost(rule)})),
  rp:runicPointBreakdown({rules:cell.runeRules!,abilities:cell.abilities!,stances:[cell.stance!],rites:[]}),
  initialOwnership:{bossesCleared:bot.tracksProgression.bossesCleared},
  notes:'Zero ticks. Package construction only; final source qualification, ecology and boss initialization receipts remain required.'});
}
writeFileSync(resolve(dest,'draft-applied-builds.json'),JSON.stringify({status:'draft-unsealed',snapshot:T4_SNAPSHOT,combatObservations:0,rows},null,2)+'\n');
writeFileSync(resolve(dest,'draft-manifest.json'),JSON.stringify({status:'draft-unsealed',planned:432,completed:0,dead:0,failed:0,omitted:0,notRun:432,cases:T4_CELLS},null,2)+'\n');
console.log(`Constructed ${rows.length} packages; zero ticks, no seal.`);
