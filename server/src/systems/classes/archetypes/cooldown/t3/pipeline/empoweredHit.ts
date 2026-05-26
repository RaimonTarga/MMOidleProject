import {
  applyStatusEffect, removeStatusEffect, getStatusEffect,
} from '@mmo-idle/shared';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { attachComponent, attachMarker } from '../../../../../../ecs/markerHelpers';
import { setAttackTarget } from '../../../../../combat/ai/targeting';
import { hasPassive } from '../core/helpers';
import {
  OVERDRIVE_BUFF_MS, OVERDRIVE_SPEED_FACTOR,
  ETERNAL_COEFF,
  TEMPORAL_INIT_MS, TEMPORAL_MAX_MS, TEMPORAL_FLAT_DMG,
  ENTROPY_BASE_DMG, ENTROPY_DURATION_MS, ENTROPY_TICK_MS,
  BEAM_DURATION_MS, BEAM_TICK_MS,
  EC_CHARGE_FX, TE_BUFF_FX, ENT_DOT_FX,
} from '../core/constants';

/**
 * onHit listener for cooldown T3 empowered attacks — each path has a unique
 * empowered effect. Runs after the base empoweredMultiplier (which is
 * suppressed for these paths by `registerBeforeAttack`).
 *
 * Path order (first match returns):
 *   1. Overdrive            — speed buff, damage unchanged
 *   2. Eternal Cycle        — replace damage with stacks × attack × coeff, reset
 *   3. Temporal Extension   — apply on-hit flat damage buff, damage unchanged
 *   4. Entropy Collapse     — apply scaling DoT, zero direct damage
 *   5. Channeled Beam       — start channel, zero direct damage (beam ticks)
 */
export function registerEmpoweredHit(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (!ctx.metadata['empoweredAttack']) return;

    const player = ctx.attacker;
    if (!player.usesCooldown) return;

    const passives = player.usesSkills.passives;
    const state  = player.tracksCombat;

    if (hasPassive(player, 'cooldown.overdrive')) {
      const active = player.hasOverdrive;
      if (!active) {
        const baseCd = player.performsAttack.attackCooldown;
        player.performsAttack.attackCooldown = Math.max(200, Math.round(player.performsAttack.attackCooldown * OVERDRIVE_SPEED_FACTOR));
        attachComponent(world, player, 'hasOverdrive', { remainingMs: OVERDRIVE_BUFF_MS, baseCd });
      } else {
        active.remainingMs = OVERDRIVE_BUFF_MS;
      }
      console.log(`[Overdrive] ${player.isPlayer.id}: speed buff started (${OVERDRIVE_BUFF_MS}ms)`);
      return;
    }

    if (hasPassive(player, 'cooldown.eternal-cycle')) {
      const chargeEffect = getStatusEffect(state, EC_CHARGE_FX);
      const stacks = chargeEffect ? chargeEffect.stacks : 0;
      ctx.damage = Math.max(1, Math.round(player.dealsDamage.attack * Math.max(1, stacks) * ETERNAL_COEFF));
      if (stacks > 0) removeStatusEffect(state, EC_CHARGE_FX);
      console.log(`[EternalCycle] ${player.isPlayer.id}: ${stacks} stacks -> ${ctx.damage} dmg`);
      return;
    }

    if (hasPassive(player, 'cooldown.temporal-extension')) {
      const initMs  = passives['cooldown.temporal-buff-init-ms'] ?? TEMPORAL_INIT_MS;
      const maxMs   = passives['cooldown.temporal-buff-max-ms']  ?? TEMPORAL_MAX_MS;
      const flatDmg = passives['cooldown.temporal-flat-dmg']     ?? TEMPORAL_FLAT_DMG;
      removeStatusEffect(state, TE_BUFF_FX);
      applyStatusEffect(state, {
        id:          TE_BUFF_FX,
        instanced:   false,
        remainingMs: initMs,
        refreshable: false,
        sourceId:    player.isPlayer.id,
        data:        { flatDamagePerHit: flatDmg, maxDurationMs: maxMs },
      });
      console.log(`[TempExt] ${player.isPlayer.id}: buff granted (${initMs}ms, +${flatDmg}/hit)`);
      return;
    }

    if (hasPassive(player, 'cooldown.entropy-collapse') && ctx.defenderType === 'monster') {
      const monsterState = ctx.defender.tracksCombat;
      const baseDmg = passives['cooldown.entropy-base-damage'] ?? ENTROPY_BASE_DMG;
      removeStatusEffect(monsterState, ENT_DOT_FX);
      applyStatusEffect(monsterState, {
        id:          ENT_DOT_FX,
        instanced:   false,
        remainingMs: ENTROPY_DURATION_MS,
        refreshable: false,
        sourceId:    player.isPlayer.id,
        data:        { baseDamagePerTick: baseDmg, nextTickIn: ENTROPY_TICK_MS, tickIntervalMs: ENTROPY_TICK_MS },
      });
      attachMarker(world, ctx.defender, 'hasEntropy');
      console.log(`[EntropyColl] ${player.isPlayer.id}: DoT applied on ${ctx.defender.isMonster.id} (${baseDmg} base/tick)`);
      ctx.damage = 0;
      return;
    }

    if (hasPassive(player, 'cooldown.channeled-beam') && ctx.defenderType === 'monster') {
      attachComponent(world, player, 'isChanneling', {
        remainingMs: BEAM_DURATION_MS,
        nextTickMs: BEAM_TICK_MS,
        targetId: ctx.defender.isMonster.id,
        pct: 0,
      });
      setAttackTarget(world, player, ctx.defender.isMonster.id);
      ctx.damage = 0;
      console.log(`[BeamChannel] ${player.isPlayer.id}: channel started on ${ctx.defender.isMonster.id}`);
      return;
    }
  });
}
