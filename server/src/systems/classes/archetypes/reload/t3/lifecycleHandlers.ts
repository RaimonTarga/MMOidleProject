import {
  applyStatusEffect,
  getStatusEffect,
  removeStatusEffect,
} from '@mmo-idle/shared';
import type { World } from '../../../../../world/World';
import type { PlayerEntity } from '../../../../../ecs/entity';
import { markSliceDirty } from '../../../../../ecs/dirtyHelpers';
import { registerReloadLifecycleHook } from '../reloadLifecycle';
import { applyPlayerProcDamage } from '../../../../combat/damage/procDamage';
import {
  COVER_FIRE_EFFECT_ID,
  DEFAULT_COVER_FIRE_DR,
  DEFAULT_DEATH_MARK_DETONATE_MULT,
  DEATH_MARK_EFFECT_ID,
} from './core/constants';

function detonateDeathMark(
  world: World,
  player: PlayerEntity,
  targetId: string,
): void {
  const target = world.getMonsterEntity(targetId);
  if (!target) return;

  const effect = getStatusEffect(target.tracksCombat, DEATH_MARK_EFFECT_ID);
  if (!effect || effect.stacks <= 0) return;

  const mult =
    player.usesSkills.passives['reload.death-mark-detonate-mult'] ??
    DEFAULT_DEATH_MARK_DETONATE_MULT;
  const dmg = Math.max(
    1,
    Math.round(player.dealsDamage.attack * effect.stacks * mult),
  );

  removeStatusEffect(target.tracksCombat, DEATH_MARK_EFFECT_ID);
  applyPlayerProcDamage(world, player, target, dmg, {
    tags: ['death-mark'],
  });
}

export function registerReloadLifecycleHandlers(): void {
  registerReloadLifecycleHook({
    onStart(world, player) {
      if (!player.usesReload) return;
      const passives = player.usesSkills.passives;
      const reload = player.usesReload;

      if ((passives['reload.death-mark'] ?? 0) > 0) {
        const targetId = player.hasAttackTarget?.targetId;
        if (targetId) detonateDeathMark(world, player, targetId);
      }

      if ((passives['reload.cover-fire'] ?? 0) > 0) {
        const drAdd = passives['reload.cover-fire-dr'] ?? DEFAULT_COVER_FIRE_DR;
        const totalMs = reload.reloadingMs;
        applyStatusEffect(player.tracksCombat, {
          id: COVER_FIRE_EFFECT_ID,
          refreshable: false,
          remainingMs: totalMs,
          sourceId: player.isPlayer.id,
          data: { drAdd, totalMs },
        });
      }

      if ((passives['reload.hair-trigger'] ?? 0) > 0) {
        reload.clipSpeedStacks = 0;
        if (reload.clipBaseAttackCooldownMs > 0) {
          player.performsAttack.attackCooldown = reload.clipBaseAttackCooldownMs;
          markSliceDirty(world, player, 'performsAttack');
        }
        markSliceDirty(world, player, 'usesReload');
      }
    },

    onComplete(world, player) {
      if (!player.usesReload) return;
      removeStatusEffect(player.tracksCombat, COVER_FIRE_EFFECT_ID);

      if ((player.usesSkills.passives['reload.hair-trigger'] ?? 0) > 0) {
        player.usesReload.clipBaseAttackCooldownMs = 0;
        markSliceDirty(world, player, 'usesReload');
      }
    },
  });
}
