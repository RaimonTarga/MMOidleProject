import { applyStatusEffect, GAME_CONFIG } from '@mmo-idle/shared';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { applyPlayerAoe } from '../../../../../combat/damage/aoeDamage';
import { markSliceDirty } from '../../../../../../ecs/dirtyHelpers';
import {
  DEFAULT_EXPLODING_AOE_MULT,
  DEFAULT_EXPLODING_CLIP_MULT,
  DEFAULT_HAIR_TRIGGER_MAX,
  DEFAULT_HAIR_TRIGGER_PCT,
  EXPLODING_CLIP_CLIENT_EFFECT,
} from '../core/constants';

function usesStandardMagazine(passives: Record<string, number | undefined>): boolean {
  if ((passives['reload.laser'] ?? 0) > 0) return false;
  if ((passives['reload.snipe'] ?? 0) > 0) return false;
  if ((passives['reload.gatling'] ?? 0) > 0) return false;
  return true;
}

export function registerReloadLightT3(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;

    const player = ctx.attacker;
    const reload = player.usesReload;
    if (!reload) return;

    const passives = player.usesSkills.passives;
    if (!usesStandardMagazine(passives)) return;

    const blunderbuss = (passives['reload.blunderbuss'] ?? 0) > 0;
    const isLastPellet = blunderbuss
      ? ctx.metadata['blunderbussLastPellet'] === true
      : reload.ammo === 0;

    if ((passives['reload.exploding-clip'] ?? 0) > 0 && isLastPellet) {
      const mult =
        passives['reload.exploding-clip-mult'] ?? DEFAULT_EXPLODING_CLIP_MULT;
      ctx.damage = Math.max(1, Math.round(ctx.damage * mult));
      applyPlayerAoe(
        world,
        player,
        ctx.defender.hasPosition.current,
        GAME_CONFIG.EMPOWERED_AOE_RADIUS,
        Math.round(
          player.dealsDamage.attack *
            (passives['reload.exploding-aoe-mult'] ?? DEFAULT_EXPLODING_AOE_MULT),
        ),
        ctx.defender.isMonster.id,
      );
      const existing = ctx.metadata['clientEffects'];
      const effects = Array.isArray(existing)
        ? existing.filter((e): e is string => typeof e === 'string')
        : [];
      effects.push(EXPLODING_CLIP_CLIENT_EFFECT);
      ctx.metadata['clientEffects'] = effects;
      ctx.metadata['reloadExplodingClip'] = true;
    }

    if ((passives['reload.hair-trigger'] ?? 0) <= 0) return;

    if (reload.clipBaseAttackCooldownMs === 0) {
      reload.clipBaseAttackCooldownMs = player.performsAttack.attackCooldown;
    }

    const maxStacks = Math.round(
      passives['reload.hair-trigger-max-stacks'] ?? DEFAULT_HAIR_TRIGGER_MAX,
    );
    if (reload.clipSpeedStacks >= maxStacks) return;

    reload.clipSpeedStacks++;
    const pct =
      passives['reload.hair-trigger-pct-per-shot'] ?? DEFAULT_HAIR_TRIGGER_PCT;
    player.performsAttack.attackCooldown = Math.max(
      200,
      Math.round(
        reload.clipBaseAttackCooldownMs / (1 + reload.clipSpeedStacks * pct),
      ),
    );
    markSliceDirty(world, player, 'usesReload');
    markSliceDirty(world, player, 'performsAttack');
  });
}
