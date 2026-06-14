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
  DEATH_MARK_DETONATE_DELAY_MS,
  DEATH_MARK_BLAST_EFFECT,
  DEFAULT_MOMENTUM_MAX_STACKS,
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
    clientEffects: [DEATH_MARK_BLAST_EFFECT], // small explosion on the target
    empowered: true,                          // crit (yellow "!") styling, no AoE
  });
}

/**
 * Per-tick: fire any armed Death Mark detonations once their delay elapses.
 * Reloading arms the blast (see onStart); it goes off DEATH_MARK_DETONATE_DELAY_MS
 * later on the captured target (re-fetched at fire time; skipped if it's gone).
 */
export function updateDeathMarkDetonation(world: World, dt: number): void {
  for (const player of world.reloadPlayers) {
    const reload = player.usesReload;
    if (reload.deathMarkDetonateMs <= 0) continue;

    reload.deathMarkDetonateMs -= dt;
    if (reload.deathMarkDetonateMs > 0) continue;

    const targetId = reload.deathMarkTargetId;
    reload.deathMarkDetonateMs = 0;
    reload.deathMarkTargetId = null;
    if (targetId) detonateDeathMark(world, player, targetId);
  }
}

export function registerReloadLifecycleHandlers(): void {
  registerReloadLifecycleHook({
    onStart(world, player) {
      if (!player.usesReload) return;
      const passives = player.usesSkills.passives;
      const reload = player.usesReload;

      if ((passives['reload.death-mark'] ?? 0) > 0) {
        const targetId = player.hasAttackTarget?.targetId;
        if (targetId) {
          // Arm a delayed detonation instead of firing immediately on reload.
          reload.deathMarkTargetId = targetId;
          reload.deathMarkDetonateMs = DEATH_MARK_DETONATE_DELAY_MS;
        }
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
      const reload = player.usesReload;
      const passives = player.usesSkills.passives;
      removeStatusEffect(player.tracksCombat, COVER_FIRE_EFFECT_ID);

      if ((passives['reload.hair-trigger'] ?? 0) > 0) {
        reload.clipBaseAttackCooldownMs = 0;
        markSliceDirty(world, player, 'usesReload');
      }

      // Momentum: each reload grants a stack (decays out of combat). The attack-speed
      // reduction is (re)applied every tick in updateReloadMomentum so a recalc can't
      // silently wipe it; here we only bump the stack count.
      if ((passives['reload.momentum'] ?? 0) > 0) {
        const maxStacks = Math.round(passives['reload.momentum-max-stacks'] ?? DEFAULT_MOMENTUM_MAX_STACKS);
        if (reload.momentumStacks < maxStacks) {
          reload.momentumStacks++;
          reload.momentumDecayMs = 0;
          markSliceDirty(world, player, 'usesReload');
        }
      }

    },
  });
}
