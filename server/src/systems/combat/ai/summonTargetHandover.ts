import { distanceSq } from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { selectMonsterAggroCandidate } from './monsterTargeting';
import { setAggroTarget, setAttackTarget } from './targeting';

/** A dead physical target need not end an engagement its formation is continuing. */
export function handoverLostSummonTarget(world: World, monster: MonsterEntity, now: number): boolean {
  const aggro=monster.hasAggroTarget;
  if(aggro?.targetKind!=='minion' || monster.inPack?.coordination?.returning || monster.hasAwareness.state==='returning') return false;
  const lost=world.getMinionEntity(aggro.targetId);
  if(!lost || lost.hasHealth.hp>0 || lost.hasPosition.nodeId!==monster.hasPosition.nodeId) return false;
  const owner=world.getPlayerEntity(lost.isMinion.ownerPlayerId);
  if(!owner || owner.isDead || owner.hasHealth.hp<=0 || owner.hasPosition.nodeId!==monster.hasPosition.nodeId || owner.hasSummonerCommand?.kind==='move') return false;
  const territory=monster.inPack?.coordination;
  if(distanceSq(monster.hasPosition.current,territory?.pursuitAnchor??monster.controlsMonster.spawn)>(territory?.leashRange??monster.controlsMonster.leashRange)**2) return false;
  // Preserve the existing targeting policy and pull radius. No new pursuit or
  // session is granted for idle nearby bodies, another owner, or a live dismissal.
  const next=selectMonsterAggroCandidate(world,monster);
  if(!next) return false;
  if(next.kind==='player' ? next.entity!==owner : next.entity.isMinion.ownerPlayerId!==owner.isPlayer.id) return false;
  if(next.entity.hasAttackTarget?.targetId!==monster.isMonster.id) return false;
  const id=next.kind==='player'?next.entity.isPlayer.id:next.entity.isMinion.id;
  setAggroTarget(world,monster,{id,kind:next.kind},now);
  setAttackTarget(world,monster,null);
  return true;
}
