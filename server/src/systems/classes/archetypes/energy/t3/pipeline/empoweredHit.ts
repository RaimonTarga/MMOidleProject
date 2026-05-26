import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { isEmpoweredAttack } from '../../../../../combat/engine/empoweredAttacks';
import {
  applyStatusEffect, removeStatusEffect, getTotalStacks,
} from '@mmo-idle/shared';
import { hasPassive } from '../core/helpers';
import {
  PD_DISCHARGE_MULT, PD_OVERCHARGE_COUNT, PD_OVERCHARGE_MS, PD_OVERCHARGE_FX,
  CI_TAG_FX, CI_BASE_MULT,
  CS_RESERVOIR_SCALE,
} from '../core/constants';

/**
 * Energy T3 empowered onHit listener.
 *
 * Fires BEFORE the base empowered multiplier registers. The empowered flag is
 * still set, so `isEmpoweredAttack(state)` returns true. Each branch returns
 * after handling its archetype so only one discharge effect runs per hit.
 *
 * Paths:
 *   - Polarity Decay         — reduced-damage discharge + grant overcharge stacks
 *   - Cascading Induction    — exponential burst from accumulated tag count
 *   - Superconducting Mass   — std multiplier on base hit + stored charge bonus
 *   - Capacitor Shunt        — discharge amplified by accumulated reservoir
 */
export function registerEmpoweredHit(): void {
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;

    const entity = ctx.attacker;
    if (!entity?.usesEnergy) return;
    if (!isEmpoweredAttack(entity)) return;

    const player = entity;
    const state  = entity.tracksCombat;
    const passives = player.usesSkills.passives;
    const energy = entity.usesEnergy;

    if (hasPassive(player, 'energy.polarity-decay')) {
      ctx.damage = Math.max(1, Math.floor(player.dealsDamage.attack * PD_DISCHARGE_MULT));
      removeStatusEffect(state, PD_OVERCHARGE_FX);
      for (let i = 0; i < PD_OVERCHARGE_COUNT; i++) {
        applyStatusEffect(state, {
          id: PD_OVERCHARGE_FX, instanced: false,
          maxStacks: PD_OVERCHARGE_COUNT, remainingMs: PD_OVERCHARGE_MS,
          refreshable: false, sourceId: player.isPlayer.id, data: {},
        });
      }
      console.log(`[PolarityDecay] ${player.isPlayer.id}: discharge ${ctx.damage} dmg -> ${PD_OVERCHARGE_COUNT} overcharge`);
      return;
    }

    if (hasPassive(player, 'energy.cascading-induction') && ctx.defenderType === 'monster') {
      const monsterState = ctx.defender.tracksCombat;
      const tags = getTotalStacks(monsterState, CI_TAG_FX);
      removeStatusEffect(monsterState, CI_TAG_FX);
      ctx.damage = tags > 0
        ? Math.max(1, Math.floor(player.dealsDamage.attack * Math.pow(CI_BASE_MULT, tags)))
        : player.dealsDamage.attack;
      console.log(`[CascadeInduct] ${player.isPlayer.id}: ${tags} tags -> ${ctx.damage} burst on ${ctx.defender.isMonster.id}`);
      return;
    }

    if (hasPassive(player, 'energy.superconducting-mass')) {
      const empMult = passives['energy.empowered-mult'] ?? 6.0;
      const pool    = energy.smChargePool;
      // ctx.damage is already plating/DR-reduced base; pool bypasses both.
      ctx.damage = Math.floor(ctx.damage * empMult) + pool;
      energy.smChargePool = 0;
      console.log(`[SuperconductM] ${player.isPlayer.id}: ${empMult}x base + ${pool} stored charge -> ${ctx.damage} total`);
      return;
    }

    if (hasPassive(player, 'energy.capacitor-shunt')) {
      const empMult   = passives['energy.empowered-mult'] ?? 2.0;
      const reservoir = energy.csReservoir;
      const ampFactor = 1 + reservoir / CS_RESERVOIR_SCALE;
      ctx.damage      = Math.max(1, Math.floor(player.dealsDamage.attack * empMult * ampFactor));
      console.log(`[CapacitorShunt] ${player.isPlayer.id}: ${empMult}xbase x ${ampFactor.toFixed(2)} (res=${Math.round(reservoir)}) -> ${ctx.damage}`);
      return;
    }
  });
}
