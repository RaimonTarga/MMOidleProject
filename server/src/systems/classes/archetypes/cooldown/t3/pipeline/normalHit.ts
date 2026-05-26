import {
  applyStatusEffect, getStatusEffect,
} from '@mmo-idle/shared';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { hasPassive } from '../core/helpers';
import {
  ETERNAL_CHARGE_DURATION_MS, ETERNAL_FLAT_PER_STACK,
  TEMPORAL_FLAT_DMG, TEMPORAL_MAX_MS, TEMPORAL_EXTEND_MS,
  BATTERY_ATK_PER_STACK,
  EC_CHARGE_FX, TE_BUFF_FX, BAT_CHARGE_FX,
} from '../core/constants';

/**
 * onHit listener for cooldown T3 normal (non-empowered) attacks. Each
 * mechanic that builds toward or modifies the empowered cycle runs here.
 *
 * Path order (all are additive — no early returns):
 *   1. Eternal Cycle           — flat bonus from stacks, then add a stack
 *   2. Temporal Extension      — flat bonus + extend buff duration if active
 *   3. Acceleration            — each hit shaves a fixed ms off execution CD
 *   4. Battery                 — flat bonus from stacks
 *   5. Singular Extraction     — zero direct damage (charges empowered instead)
 */
export function registerNormalHit(): void {
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.metadata['empoweredAttack']) return;

    const player = ctx.attacker;
    if (!player.usesCooldown) return;

    const passives = player.usesSkills.passives;
    const state  = player.tracksCombat;
    const cd     = player.usesCooldown;

    if (hasPassive(player, 'cooldown.eternal-cycle')) {
      const existing = getStatusEffect(state, EC_CHARGE_FX);
      if (existing && existing.stacks > 0) {
        ctx.damage += Math.round(existing.stacks * ETERNAL_FLAT_PER_STACK);
      }
      applyStatusEffect(state, {
        id:          EC_CHARGE_FX,
        instanced:   false,
        remainingMs: ETERNAL_CHARGE_DURATION_MS,
        refreshable: true,
        sourceId:    player.isPlayer.id,
        data:        {},
      });
    }

    if (hasPassive(player, 'cooldown.temporal-extension')) {
      const buff = getStatusEffect(state, TE_BUFF_FX);
      if (buff && buff.remainingMs > 0) {
        ctx.damage += Math.round(buff.data['flatDamagePerHit'] ?? TEMPORAL_FLAT_DMG);
        const maxMs = buff.data['maxDurationMs'] ?? TEMPORAL_MAX_MS;
        buff.remainingMs = Math.min(buff.remainingMs + TEMPORAL_EXTEND_MS, maxMs);
      }
    }

    const accelMs = passives['cooldown.acceleration-ms'] ?? 0;
    if (accelMs > 0 && cd.executionCooldownMs > 0) {
      cd.executionCooldownMs = Math.max(0, cd.executionCooldownMs - accelMs);
    }

    if (hasPassive(player, 'cooldown.battery')) {
      const charge = getStatusEffect(state, BAT_CHARGE_FX);
      if (charge && charge.stacks > 0) {
        ctx.damage += Math.round(charge.stacks * BATTERY_ATK_PER_STACK);
      }
    }

    if (hasPassive(player, 'cooldown.singular-extraction')) {
      ctx.damage = 0;
    }
  });
}
