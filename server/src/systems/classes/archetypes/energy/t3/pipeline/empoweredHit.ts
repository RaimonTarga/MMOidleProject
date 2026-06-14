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
  BINARY_CHARGE_DISCHARGE_MULT, BINARY_DISCHARGE_DISCHARGE_MULT,
  AWAKENED_N, AWAKENED_MULT,
  CRITICAL_MASS_MAX, CRITICAL_MASS_DMG_PER_STACK,
  STORM_FX, ENDLESS_STORM_TICK_MS, ENDLESS_STORM_DURATION_MS, ENDLESS_STORM_MAX_MS, ENDLESS_STORM_TOTAL_MULT,
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

    // ── T4 specs ───────────────────────────────────────────────────────────────

    // Binary Cycle: alternating big/small discharge, then flip state. Base mult
    // still applies on top (not suppressed).
    if (hasPassive(player, 'energy.binary-cycle')) {
      const mult = energy.binaryDischargeState ? BINARY_DISCHARGE_DISCHARGE_MULT : BINARY_CHARGE_DISCHARGE_MULT;
      ctx.damage = Math.max(1, Math.round(ctx.damage * mult));
      energy.binaryDischargeState = !energy.binaryDischargeState;
      return;
    }

    // Stormbringer: the discharge is the FIRST of N uniform 1.5× empowered strikes
    // (base mult suppressed in beforeAttack, so this applies exactly 1.5×). It's a real
    // empowered hit; arm the remaining N−1 strikes (handled in normalHit).
    if (hasPassive(player, 'energy.awakened-lightning')) {
      ctx.damage = Math.max(1, Math.round(ctx.damage * AWAKENED_MULT));
      energy.awakenedCharges = AWAKENED_N - 1;
      return;
    }

    // Critical Mass: consecutive discharges stack a discharge-damage multiplier.
    if (hasPassive(player, 'energy.critical-mass')) {
      energy.criticalMassStacks = Math.min(CRITICAL_MASS_MAX, energy.criticalMassStacks + 1);
      energy.criticalMassGapMs = 0;
      ctx.damage = Math.round(ctx.damage * (1 + energy.criticalMassStacks * CRITICAL_MASS_DMG_PER_STACK));
      return;
    }

    // Endless Storm: discharge deals normal damage AND applies/refreshes a storm DoT.
    if (hasPassive(player, 'energy.endless-storm') && ctx.defenderType === 'monster') {
      // Discharge deals NORMAL damage (mult suppressed in beforeAttack) with no splash —
      // the entire empowered payload is the storm DoT: total = attack × TOTAL_MULT over the
      // base duration, captured per-tick at cast time. Extending the storm = more total.
      ctx.metadata['suppressEmpoweredAoe'] = true;
      const tickMs = ENDLESS_STORM_TICK_MS;
      const damagePerTick = Math.max(1, Math.round(
        player.dealsDamage.attack * ENDLESS_STORM_TOTAL_MULT * tickMs / ENDLESS_STORM_DURATION_MS,
      ));
      applyStatusEffect(ctx.defender.tracksCombat, {
        id: STORM_FX, instanced: false, maxStacks: 1, refreshable: true,
        remainingMs: ENDLESS_STORM_DURATION_MS, sourceId: player.isPlayer.id,
        data: { damagePerTick, nextTickIn: tickMs, tickIntervalMs: tickMs, totalMs: ENDLESS_STORM_MAX_MS },
      });
      return; // discharge itself keeps its normal (suppressed) damage
    }

    // Singularity Execute: discharge scales linearly with the energy stored when it
    // was armed (captured in afterHit / the beforeAttack execute). Base mult suppressed.
    if (hasPassive(player, 'energy.singularity-execute')) {
      const empMult = passives['energy.empowered-mult'] ?? 6.0;
      const scale   = Math.max(0, energy.dischargeEnergy) / 100;
      ctx.damage    = Math.max(1, Math.floor(player.dealsDamage.attack * empMult * scale));
      // Void-themed discharge FX (client fxVoidDischarge).
      const existing = ctx.metadata['clientEffects'];
      ctx.metadata['clientEffects'] = Array.isArray(existing) ? [...existing, 'void-discharge'] : ['void-discharge'];
      return;
    }
  });
}
