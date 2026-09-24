import { heatDecisionReceipts } from '../../src/systems/combat/ai/heatManagement';
import { getString, getFlag } from '@mmo-idle/shared';
import type { World } from '../../src/world/World';
import type { PlayerEntity } from '../../src/ecs/entity';
import { playerCombatPhase } from '../../src/systems/combat/ai/engagement';
export function heatObservation(world:World,p:PlayerEntity,now:number){
 const minions=[...world.minionEntities].filter(m=>m.isMinion.ownerPlayerId===p.isPlayer.id&&m.hasHealth.hp>0&&m.hasPosition.nodeId===p.hasPosition.nodeId);
 const ids=new Set(minions.map(m=>m.isMinion.id));
 const monsters=[...world.monsterEntitiesInNode(p.hasPosition.nodeId)].filter(m=>m.hasHealth.hp>0);
 const ownerThreats=monsters.filter(m=>m.hasAggroTarget?.targetKind==='player'&&m.hasAggroTarget.targetId===p.isPlayer.id).length;
 const summonThreats=monsters.filter(m=>m.hasAggroTarget?.targetKind==='minion'&&ids.has(m.hasAggroTarget.targetId)).length;
 const summonTargets=minions.filter(m=>m.hasAttackTarget&&world.getMonsterEntity(m.hasAttackTarget.targetId)?.hasHealth.hp!>0).length;
 const heat=p.tracksCombat.statusEffects.find(e=>e.id==='volcanic-heat');
 const state=getString(p.tracksCombat,'rune.heatManagement')||'normal';
 const receipts=heatDecisionReceipts(p);
 // Legacy flat fields remain for occupancy consumers, explicitly phase-labelled.
 const endOfTick={tick:world.tickCounter,serverTime:now,phase:'end-of-tick' as const,
   combatPhase:playerCombatPhase(world,p,now),ownerThreats,summonThreats,summonTargets,
   ownerTarget:p.hasAttackTarget?.targetId??null,heat:heat?.stacks??0,
   position:{...p.hasPosition.current},moving:!!p.isMoving,
   casting:!!p.isCastingAbility,lastAttackAt:p.performsAttack.lastAttackAt};
 return {...receipts,endOfTick,fieldPhases:{state:'rune-derivation',waitHold:'rune-derivation',recoveryHold:'rune-derivation',blockedBy:'auto-target',phase:'end-of-tick',heat:'end-of-tick',threats:'end-of-tick'},heat:heat?.stacks??0,growthClock:heat?.data.rampAccum??null,coolingClock:heat?.data.coolingAccum??null,state,phase:playerCombatPhase(world,p,now),ownerThreats,summonThreats,summonTargets,ownerTarget:p.hasAttackTarget?.targetId??null,recoveryHold:getFlag(p.tracksCombat,'rune.waitForRegen'),waitHold:getFlag(p.tracksCombat,'rune.waitItOut'),pendingReason:state==='requested'?'finish-latched-engagement':null,blockedBy:receipts.actionSelection?.action==='wait-it-out'?'heat-above-10':receipts.actionSelection?.action==='recover'?'native-hp-recovery':null};
}

/** atMs shares the event/sample tick clock; interval end is a separate field. */
export function heatTransition(atMs: number, dtMs: number, observation: ReturnType<typeof heatObservation>) {
 return {atMs,tickEndMs:atMs+dtMs,...observation};
}
