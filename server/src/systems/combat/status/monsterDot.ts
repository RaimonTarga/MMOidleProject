import {
  MONSTER_DATABASE,
  applyStatusEffect,
  resolveMonsterDotDebuff,
  type MonsterDefinition,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import { attachMarker } from '../../../ecs/markerHelpers';
import type { World } from '../../../world/World';
import { harmfulStatusDurationMult, harmfulStatusPotencyMult } from './harmfulStatus';
import { playerRefusesAffliction } from './debuffGuard';
import { applyMonsterDotToMinion } from './minionAfflictions';
import { buildKillerFromMonster } from '../../world/deathCause';

function nearestLivingSummon(world: World, player: PlayerEntity) {
  let best;
  let bestSq = Infinity;
  for (const id of player.summonsMinions?.minionIds ?? []) {
    const minion = id ? world.getMinionEntity(id) : undefined;
    if (!minion || minion.hasHealth.hp <= 0) continue;
    const dx = minion.hasPosition.current.x - player.hasPosition.current.x;
    const dy = minion.hasPosition.current.y - player.hasPosition.current.y;
    if (dx * dx + dy * dy < bestSq) { bestSq = dx * dx + dy * dy; best = minion; }
  }
  return best;
}

/** Apply one definition-shaped monster DoT stack through the canonical status path. */
export function applyMonsterDotToPlayer(
  world: World,
  monster: MonsterEntity,
  player: PlayerEntity,
  dotEffect: NonNullable<MonsterDefinition['dotEffect']>,
  abilityName?: string,
): void {
  const monsterDef = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  const debuff = resolveMonsterDotDebuff({ monster: monsterDef, dotEffect });
  // Conduit, Poison Shift: poison aimed at you lands on a summon instead.
  if ((debuff.element === 'poison' || debuff.statusEffectId.includes('poison')) && (player.usesSkills.passives['conduit.poison-shift'] ?? 0) > 0) {
    const summon = nearestLivingSummon(world, player);
    if (summon) {
      applyMonsterDotToMinion(world, monster, summon, dotEffect);
      return;
    }
  }
  // Cleanse's Immunity keystone (design §22.4): a stripped kind does not come back.
  if (playerRefusesAffliction(player, debuff.statusEffectId)) return;
  // Status resistance (mobility tenacity + the Warding posture) lands HERE, at the
  // single place a monster DoT enters a player, so no caller has to remember it.
  // Both halves apply: a resisted DoT ticks for less AND stops sooner.
  const durationMs = Math.max(
    1,
    Math.round((dotEffect.durationMs ?? 5_000) * harmfulStatusDurationMult(player)),
  );
  const damagePerStack = Math.max(
    1,
    Math.round(dotEffect.damagePerStack * harmfulStatusPotencyMult(player)),
  );
  const effect = applyStatusEffect(player.tracksCombat, {
    id: debuff.statusEffectId,
    maxStacks: dotEffect.maxStacks,
    instanced: false,
    sourceId: monster.isMonster.id,
    damageSource: { killer: buildKillerFromMonster(monster), abilityName, effectName: debuff.label, effectColor: debuff.color },
    remainingMs: durationMs,
    refreshable: true,
    data: {
      damagePerStack,
      nextTickIn: dotEffect.tickIntervalMs,
      tickIntervalMs: dotEffect.tickIntervalMs,
      tickOnExpire: 1,
      totalMs: durationMs,
      flavorCode: debuff.code,
      isDot: 1,
      bypassBarrier: dotEffect.bypassBarrier ? 1 : 0,
    },
  });
  effect.data.damagePerStack = damagePerStack;
  effect.data.tickIntervalMs = dotEffect.tickIntervalMs;
  effect.data.tickOnExpire = 1;
  effect.data.totalMs = durationMs;
  effect.data.flavorCode = debuff.code;
  effect.data.isDot = 1;
  effect.data.bypassBarrier = dotEffect.bypassBarrier ? 1 : 0;
  attachMarker(world, player, 'hasDot');
}
