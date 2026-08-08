import {
  MONSTER_DATABASE,
  applyStatusEffect,
  distanceSq,
  getStatusEffect,
} from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { onPackAlphaDead } from '../ai/packs';
import { registerCombatListener } from '../engine/combatPipeline';

export const DEATH_EMPOWER_EFFECT_ID = 'monster-death-empower';

/** Damage multiplier from nearby allies dying with `empowerAllies`. */
export function monsterDeathEmpowerMult(monster: MonsterEntity): number {
  const effect = getStatusEffect(monster.tracksCombat, DEATH_EMPOWER_EFFECT_ID);
  if (!effect) return 1;
  return 1 + Math.max(0, effect.data['damagePct'] ?? 0) * effect.stacks;
}

function empowerNearbyAllies(world: World, dead: MonsterEntity): void {
  const empower = MONSTER_DATABASE.get(dead.isMonster.monsterTypeId)?.onDeath?.empowerAllies;
  if (!empower) return;

  const radiusSq = empower.radius * empower.radius;
  let applied = false;
  for (const ally of world.monsterEntitiesInNode(dead.hasPosition.nodeId)) {
    if (ally === dead || ally.hasHealth.hp <= 0) continue;
    if (distanceSq(ally.hasPosition.current, dead.hasPosition.current) > radiusSq) continue;
    applyStatusEffect(ally.tracksCombat, {
      id: DEATH_EMPOWER_EFFECT_ID,
      maxStacks: empower.maxStacks ?? 3,
      remainingMs: empower.durationMs,
      refreshable: true,
      sourceId: dead.isMonster.id,
      data: { damagePct: empower.damagePct, totalMs: empower.durationMs },
    });
    applied = true;
  }

  if (applied) {
    world.pushEvent(dead.hasPosition.nodeId, {
      kind: 'ecology-pulse',
      monsterId: dead.isMonster.id,
      pos: { ...dead.hasPosition.current },
      pulse: 'death-empower',
    });
  }
}

/** Register definition-authored monster death effects exactly once at combat bootstrap. */
export function initMonsterDeathEffects(): void {
  registerCombatListener('onKill', (ctx, world) => {
    if (ctx.defenderType !== 'monster') return;
    onPackAlphaDead(world, ctx.defender);
    empowerNearbyAllies(world, ctx.defender);
  });
}
