import { abilityRangeBonus, distanceSq, posHitboxFromEntity, reachGap, type AbilityDef } from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';
import { summonerProfileFor, usesSummonTechniques } from '../../classes/archetypes/summoner/profile';
import { beginFormationTechnique } from '../../classes/archetypes/summoner/formationTechnique';
import { runFormationAttack } from '../../classes/archetypes/summoner/formationAttack';
import { isHardControlled } from '../../combat/status/playerHardControl';
import { setAttackTarget } from '../../combat/ai/targeting';
import { setEntityMotion, stopEntity } from '../../world/movement';

/** Physical participants only: neither replacements nor another owner's summons join. */
export function formationChargeMinions(world: World, owner: PlayerEntity, target: MonsterEntity, ability: AbilityDef): MinionEntity[] {
  if (!usesSummonTechniques(owner) || owner.hasSummonerCommand?.kind === 'move'
    || target.hasHealth.hp <= 0 || target.isConcealed || target.isInvulnerable
    || target.hasPosition.nodeId !== owner.hasPosition.nodeId
    || distanceSq(target.hasPosition.current, owner.hasPosition.current) > summonerProfileFor(owner).leashRadius ** 2) return [];
  return (owner.summonsMinions?.minionIds ?? []).flatMap(id => {
    const m = world.getMinionEntity(id);
    return m && m.isMinion.ownerPlayerId === owner.isPlayer.id && m.hasHealth.hp > 0
      && m.hasPosition.nodeId === owner.hasPosition.nodeId && !m.isRooted && !isHardControlled(m.tracksCombat)
      && reachGap(posHitboxFromEntity(m), posHitboxFromEntity(target))
        <= m.performsAttack.attackRange + abilityRangeBonus(ability, owner.tracksProgression.playerTier)
      ? [m] : [];
  });
}

export function formationChargeTarget(world: World, owner: PlayerEntity, ability: AbilityDef, currentOnly: boolean): MonsterEntity | null {
  const ids = [owner.hasAttackTarget?.targetId, owner.summonsMinions?.formationTargetId,
    ...(owner.summonsMinions?.minionIds ?? []).map(id => world.getMinionEntity(id)?.hasAttackTarget?.targetId)];
  if (!currentOnly) {
    ids.push(...[...world.monsterEntitiesInNode(owner.hasPosition.nodeId)]
      .sort((a, b) => distanceSq(a.hasPosition.current, owner.hasPosition.current)
        - distanceSq(b.hasPosition.current, owner.hasPosition.current)).map(m => m.entityId));
  }
  for (const id of new Set(ids)) {
    const target = id ? world.getMonsterEntity(id) : undefined;
    if (target && formationChargeMinions(world, owner, target, ability).length) return target;
  }
  return null;
}

export function formationChargeHasGap(world: World, owner: PlayerEntity, target: MonsterEntity, ability: AbilityDef, minGap: number): boolean {
  return formationChargeMinions(world, owner, target, ability).some(m =>
    reachGap(posHitboxFromEntity(m), posHitboxFromEntity(target)) >= minGap);
}

export function beginFormationCharge(world: World, owner: PlayerEntity, target: MonsterEntity, ability: AbilityDef,
  now: number, speedMult: number, durationMs: number): boolean {
  const minions = formationChargeMinions(world, owner, target, ability);
  if (!minions.length) return false;
  const rider = beginFormationTechnique(world, owner, ability.id);
  if (!rider) return false;
  const ids = minions.map(m => m.entityId);
  // Ineligible bodies forfeit their share rather than increasing survivors' damage.
  rider.pendingEntityIds = rider.pendingEntityIds.filter(id => ids.includes(id));
  const charge = { abilityId: ability.id, targetId: target.entityId, speedMult, endsAt: now + durationMs };
  attachComponent(world, owner, 'hasFormationCharge', { ...charge, pendingEntityIds: ids });
  stopEntity(world, owner);
  for (const m of minions) {
    attachComponent(world, m, 'isChargingAbility', { ...charge });
    setAttackTarget(world, m, target.entityId);
    m.controlsMinion.currentTargetId = target.entityId;
    setEntityMotion(world, m, target.hasPosition.current);
    world.pushEvent(owner.hasPosition.nodeId, { kind: 'player-reposition', playerId: owner.isPlayer.id,
      casterMinionId: m.entityId, ability: ability.id, from: { ...m.hasPosition.current }, to: { ...target.hasPosition.current } });
  }
  return true;
}

function finishMember(world: World, owner: PlayerEntity, id: string, forfeit: boolean): void {
  const m = world.getMinionEntity(id);
  if (m) {
    detachComponent(world, m, 'isChargingAbility');
    stopEntity(world, m);
  }
  const rider = owner.hasFormationTechnique;
  if (forfeit && rider && rider.abilityId === owner.hasFormationCharge?.abilityId) {
    rider.pendingEntityIds = rider.pendingEntityIds.filter(member => member !== id);
    if (!rider.pendingEntityIds.length) detachComponent(world, owner, 'hasFormationTechnique');
  }
}

export function cancelFormationCharge(world: World, owner: PlayerEntity): void {
  for (const id of owner.hasFormationCharge?.pendingEntityIds ?? []) finishMember(world, owner, id, true);
  detachComponent(world, owner, 'hasFormationCharge');
}

export function updateFormationCharge(world: World, owner: PlayerEntity, ability: AbilityDef | undefined, now: number): void {
  const charge = owner.hasFormationCharge;
  if (!charge) return;
  const target = world.getMonsterEntity(charge.targetId);
  if (!ability || !target || owner.hasHealth.hp <= 0 || isHardControlled(owner.tracksCombat)
    || !usesSummonTechniques(owner) || now >= charge.endsAt) {
    cancelFormationCharge(world, owner);
    return;
  }
  const eligible = new Set(formationChargeMinions(world, owner, target, ability).map(m => m.entityId));
  const pending: string[] = [];
  for (const id of charge.pendingEntityIds) {
    const m = world.getMinionEntity(id);
    if (!m || !eligible.has(id) || target.hasHealth.hp <= 0) { finishMember(world, owner, id, true); continue; }
    if (world.collision.canReach(m, target, m.performsAttack.attackRange)) {
      finishMember(world, owner, id, false);
      runFormationAttack(world, owner, m, target, now);
      m.performsAttack.lastAttackAt = now;
    } else {
      setEntityMotion(world, m, target.hasPosition.current);
      pending.push(id);
    }
  }
  if (pending.length) charge.pendingEntityIds = pending;
  else detachComponent(world, owner, 'hasFormationCharge');
}
