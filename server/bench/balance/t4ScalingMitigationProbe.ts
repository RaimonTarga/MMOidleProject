import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createFarmWorld } from './worldFactory';
import { BREADTH_CELLS } from './playerBreadthSpec';
import { prepareSurveyBot } from './ttkSurveySpec';
import { runPlayerAttack } from '../../src/systems/combat/engine/combat';
import { setEmpoweredAttack } from '../../src/systems/combat/engine/empoweredAttacks';
import { hydrateHitboxCacheFromArtifact } from '../../src/hitbox/cache';
assert(hydrateHitboxCacheFromArtifact('D:/mmo-idle/volcano-heat-management-01/hitboxes.json')>0);
const rows:unknown[]=[];
for(const path of ['energy-heavy-t3-a','energy-heavy-t3-b'])for(const armored of [false,true])for(const empowered of [false,true]) {
  const world=createFarmWorld();world.suppressRepopulation=true;
  const cell=structuredClone(BREADTH_CELLS.find(c=>c.role==='farm'&&c.playerTreatment==='untreated'&&c.build.skillPath.includes(path))!);
  cell.build.gearItemIds.weapon='mountain-earthsunder-maul';cell.abilities={techniques:[],guards:[]};cell.runeRules=[];cell.stance=null;
  const {bot}=prepareSurveyBot(world,cell,{x:2400,y:2400});
  const target=world.createMonster(cell.nodeId,'plains-slime',{x:2424,y:2400});assert(target);
  Object.assign(target.hasHealth,{hp:1e8,maxHp:1e8,recovery:0});
  Object.assign(target.mitigatesDamage,{plating:armored?50:0,damageReduction:armored?0.4:0});
  if(empowered) { bot.usesEnergy!.dischargeEnergy=200;setEmpoweredAttack(world,bot); }
  const before=target.hasHealth.hp;
  runPlayerAttack(world,bot,target,1800000000000,{attackOrigin:bot.hasPosition.current,aggroSource:{id:bot.isPlayer.id,kind:'player'}});
  rows.push({path,armored,empowered,hpDamage:before-target.hasHealth.hp,attack:bot.dealsDamage.attack,onHit:bot.dealsDamage.onHitDamage,passives:bot.usesSkills.passives});
  world.detachPlayerEntity(bot.isPlayer.id);
}
writeFileSync('../reports/t4-scaling-study-2026-09-25/mitigation-probe.json',JSON.stringify(rows,null,2));
console.log(JSON.stringify(rows.map(({passives,...row}:any)=>row),null,2));process.exit(0);
