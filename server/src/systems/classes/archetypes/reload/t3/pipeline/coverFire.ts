import { getStatusEffect } from '@mmo-idle/shared';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import {
  COVER_FIRE_DR_CAP,
  COVER_FIRE_EFFECT_ID,
  DEFAULT_COVER_FIRE_DR,
} from '../core/constants';

export function registerCoverFire(): void {
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.attackerType !== 'monster') return;

    const player = ctx.defender;
    if ((player.usesSkills.passives['reload.cover-fire'] ?? 0) <= 0) return;

    const buff = getStatusEffect(player.tracksCombat, COVER_FIRE_EFFECT_ID);
    if (!buff || buff.remainingMs <= 0) return;

    const dr = Math.min(
      COVER_FIRE_DR_CAP,
      buff.data['drAdd'] ?? DEFAULT_COVER_FIRE_DR,
    );
    ctx.damage = Math.max(0, Math.round(ctx.damage * (1 - dr)));
  });
}
