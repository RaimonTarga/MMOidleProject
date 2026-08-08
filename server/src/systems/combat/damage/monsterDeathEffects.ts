import {
  MONSTER_DATABASE,
  applyStatusEffect,
  distanceSq,
  getStatusEffect,
} from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { onPackAlphaDead } from '../ai/packs';
import { onRaiserDead } from '../ai/raiseDead';
import { registerCombatListener } from '../engine/combatPipeline';
import { publishToxicPool } from '../../world/groundZones';
import { recordCorpse } from '../../world/corpses';

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

function spawnDeathHazard(world: World, dead: MonsterEntity): void {
  const hazard = MONSTER_DATABASE.get(dead.isMonster.monsterTypeId)?.onDeath?.spawnHazard;
  if (!hazard || hazard.kind !== 'toxic-pool') return;
  const now = Date.now();
  publishToxicPool(world, dead.hasPosition.nodeId, {
    kind: 'toxic-pool',
    pos: { ...dead.hasPosition.current },
    radius: hazard.radius,
    startedAtMs: now,
    expiresAtMs: now + hazard.durationMs,
    damagePerTick: hazard.damagePerTick,
    tickIntervalMs: hazard.tickIntervalMs,
    slowSpeedMult: hazard.slowSpeedMult,
    killer: {
      monsterTypeId: dead.isMonster.monsterTypeId,
      monsterName: dead.isMonster.name,
      isBoss: dead.isMonster.isBoss,
      nodeId: dead.hasPosition.nodeId,
    },
  });
}

/** Register definition-authored monster death effects exactly once at combat bootstrap. */
export function initMonsterDeathEffects(): void {
  registerCombatListener('onKill', (ctx, world) => {
    if (ctx.defenderType !== 'monster') return;
    onPackAlphaDead(world, ctx.defender);
    onRaiserDead(world, ctx.defender);
    spawnDeathHazard(world, ctx.defender);
    empowerNearbyAllies(world, ctx.defender);
    // Last: the corpse this kill leaves behind must not be raisable by the very
    // sweep above, and a risen mob leaves nothing (`recordCorpse` gates on that).
    recordCorpse(world, ctx.defender);
  });
}
