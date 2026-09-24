import { getString, getFlag } from '@mmo-idle/shared';
import type { World } from '../../src/world/World';
import type { PlayerEntity } from '../../src/ecs/entity';
import { playerCombatPhase } from '../../src/systems/combat/ai/engagement';
export function heatObservation(world:World,p:PlayerEntity,now:number){
 const minions=[...world.minionEntities].filter(m=>m.isMinion.ownerPlayerId===p.isPlayer.id&&m.hasHealth.hp>0);
 const ids=new Set(minions.map(m=>m.isMinion.id));
 const monsters=[...world.monsterEntitiesInNode(p.hasPosition.nodeId)].filter(m=>m.hasHealth.hp>0);
 const ownerThreats=monsters.filter(m=>m.hasAggroTarget?.targetKind==='player'&&m.hasAggroTarget.targetId===p.isPlayer.id).length;
 const summonThreats=monsters.filter(m=>m.hasAggroTarget?.targetKind==='minion'&&ids.has(m.hasAggroTarget.targetId)).length;
 const summonTargets=minions.filter(m=>m.hasAttackTarget&&world.getMonsterEntity(m.hasAttackTarget.targetId)?.hasHealth.hp!>0).length;
 const heat=p.tracksCombat.statusEffects.find(e=>e.id==='volcanic-heat');
 const state=getString(p.tracksCombat,'rune.heatManagement')||'normal';
 return {heat:heat?.stacks??0,growthClock:heat?.data.rampAccum??null,coolingClock:heat?.data.coolingAccum??null,state,phase:playerCombatPhase(world,p,now),ownerThreats,summonThreats,summonTargets,ownerTarget:p.hasAttackTarget?.targetId??null,recoveryHold:getFlag(p.tracksCombat,'rune.waitForRegen'),waitHold:getFlag(p.tracksCombat,'rune.waitItOut'),blockedBy:state==='requested'?'existing-threats':state==='waiting'?'heat-above-10':getFlag(p.tracksCombat,'rune.waitForRegen')?'native-hp-recovery':null};
}
