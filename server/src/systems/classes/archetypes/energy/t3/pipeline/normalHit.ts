import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { isEmpoweredAttack } from '../../../../../combat/engine/empoweredAttacks';
import { evadeBlocksDebuffs } from '../../../../../defense/mitigation/evasion';
import {
  applyStatusEffect, removeStatusEffect, getStatusEffect, getTotalStacks,
} from '@mmo-idle/shared';
import { hasPassive, energyPercent } from '../core/helpers';
import {
  FLASH_MAX_DAMAGE_SHIFT_PCT,
  MV_THRESHOLD, MV_ENERGY_COST, MV_FLAT_DAMAGE,
  PD_OVERCHARGE_FX, PD_STACK_FLAT_DMG,
  AC_CHARGE_DMG_MULT,
  HE_LOW_THRESHOLD, HE_HIGH_THRESHOLD, HE_DMG_MULT,
  CI_TAG_FX, CI_TAG_MS,
  ENERGY_OVERDRIVE_ATK_PCT, UPKEEP_ONHIT_SCALE,
  BINARY_CHARGE_ATK_BONUS, BINARY_DISCHARGE_ONHIT_BONUS,
  CHARGE_STATE_MIN, AWAKENED_MULT,
} from '../core/constants';

/**
 * Energy T3 non-empowered onHit listener.
 *
 * Skips empowered hits (handled by the empowered-hit pipeline). Each path may
 * read/write `ctx.damage` cumulatively; some paths are mutually compatible
 * (Micro-Venting + Harmonic Equilibrium, for instance), and a few paths are
 * mutually exclusive in practice but applied independently here.
 *
 * Paths:
 *   - Flash                   — blue/red shift damage curve
 *   - Micro-Venting           — consume energy for flat bonus
 *   - Polarity Decay          — consume overcharge stack for flat bonus
 *   - Alternating Currents    — bonus damage during charge phase
 *   - Harmonic Equilibrium    — bonus while energy is strictly 40–60%
 *   - Cascading Induction     — 1 damage + plant induction tag
 *   - Superconducting Mass    — 0 damage; accumulate raw attack into charge pool
 */
export function registerNormalHit(): void {
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;

    const entity = ctx.attacker;
    if (!entity?.usesEnergy) return;
    if (isEmpoweredAttack(entity)) return;

    const player = entity;
    const state  = entity.tracksCombat;
    const energy = entity.usesEnergy;

    if (hasPassive(player, 'energy.flash')) {
      const fillPct = energyPercent(energy);
      const damageMult = 1 + FLASH_MAX_DAMAGE_SHIFT_PCT - fillPct * FLASH_MAX_DAMAGE_SHIFT_PCT * 2;
      ctx.damage = Math.max(1, Math.round(ctx.damage * damageMult));
      return;
    }

    if (hasPassive(player, 'energy.micro-venting')) {
      if (energyPercent(energy) > MV_THRESHOLD && energy.energy >= MV_ENERGY_COST) {
        energy.energy = Math.max(0, energy.energy - MV_ENERGY_COST);
        ctx.damage += MV_FLAT_DAMAGE;
        console.log(`[MicroVenting] ${player.isPlayer.id}: vent -> +${MV_FLAT_DAMAGE} dmg`);
      }
    }

    if (hasPassive(player, 'energy.polarity-decay')) {
      const oc = getStatusEffect(state, PD_OVERCHARGE_FX);
      if (oc && oc.stacks > 0) {
        ctx.damage += PD_STACK_FLAT_DMG;
        oc.stacks   = Math.max(0, oc.stacks - 1);
        if (oc.stacks === 0) removeStatusEffect(state, PD_OVERCHARGE_FX);
        console.log(`[PolarityDecay] ${player.isPlayer.id}: 1 overcharge consumed -> +${PD_STACK_FLAT_DMG} dmg`);
      }
    }

    if (hasPassive(player, 'energy.alternating-currents') && player.inAcChargePhase) {
      ctx.damage = Math.round(ctx.damage * AC_CHARGE_DMG_MULT);
    }

    if (hasPassive(player, 'energy.harmonic-equilibrium')) {
      const pct = energyPercent(energy);
      if (pct > HE_LOW_THRESHOLD && pct < HE_HIGH_THRESHOLD) {
        ctx.damage = Math.round(ctx.damage * HE_DMG_MULT);
      }
    }

    if (hasPassive(player, 'energy.cascading-induction') && ctx.defenderType === 'monster') {
      ctx.damage = 1;
      // The damage-to-1 is the mechanic; only the induction tag is the debuff, so
      // an evaded hit keeps damage=1 but plants no tag.
      if (!evadeBlocksDebuffs(ctx)) {
        const monsterState = ctx.defender.tracksCombat;
        applyStatusEffect(monsterState, {
          id: CI_TAG_FX, instanced: false,
          remainingMs: CI_TAG_MS, refreshable: true,
          sourceId: player.isPlayer.id, data: {},
        });
        console.log(`[CascadeInduct] ${player.isPlayer.id}: tag planted -> ${getTotalStacks(monsterState, CI_TAG_FX)} on ${ctx.defender.isMonster.id}`);
      }
    }

    if (hasPassive(player, 'energy.superconducting-mass')) {
      ctx.damage = 0;
      energy.smChargePool += player.dealsDamage.attack;
      console.log(`[SuperconductM] ${player.isPlayer.id}: +${player.dealsDamage.attack} stored (pool=${energy.smChargePool})`);
    }

    // ── T4 specs ───────────────────────────────────────────────────────────────

    // Overdrive: +ATK% while the mode is active (energy decaying in the tick).
    if (hasPassive(player, 'energy.overdrive') && energy.overdriveActive) {
      ctx.damage = Math.round(ctx.damage * (1 + ENERGY_OVERDRIVE_ATK_PCT));
    }

    // Energy Upkeep: on-hit DAMAGE scales with how long energy has been maintained.
    if (hasPassive(player, 'energy.upkeep')) {
      const upkeepSec = energy.upkeepTimerMs / 1000;
      ctx.metadata['onHitDamageMult'] = 1 + upkeepSec * UPKEEP_ONHIT_SCALE;
    }

    // Binary Cycle: Charge State boosts attack damage; Discharge State boosts on-hit.
    // TODO(engine): the per-state APS swing is not yet applied (needs a buff layer).
    if (hasPassive(player, 'energy.binary-cycle')) {
      if (energy.binaryDischargeState) {
        ctx.metadata['onHitDamageMult'] = 1 + BINARY_DISCHARGE_ONHIT_BONUS;
      } else {
        ctx.damage = Math.round(ctx.damage * (1 + BINARY_CHARGE_ATK_BONUS));
      }
    }

    // Charge State: attack damage scales linearly with the energy pool (0.5×→1.0×).
    if (hasPassive(player, 'energy.charge-state')) {
      const fillPct = energyPercent(energy);
      ctx.damage = Math.max(1, Math.round(ctx.damage * (CHARGE_STATE_MIN + (1 - CHARGE_STATE_MIN) * fillPct)));
    }

    // Awakened Lightning: spend an empowered charge from the last discharge.
    if (hasPassive(player, 'energy.awakened-lightning') && energy.awakenedCharges > 0) {
      ctx.damage = Math.round(ctx.damage * AWAKENED_MULT);
      energy.awakenedCharges--;
    }
  });
}
