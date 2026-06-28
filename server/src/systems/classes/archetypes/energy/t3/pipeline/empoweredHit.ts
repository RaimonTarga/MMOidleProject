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
      return;
    }

    if (hasPassive(player, 'energy.cascading-induction') && ctx.defenderType === 'monster') {
      const monsterState = ctx.defender.tracksCombat;
      const tags = getTotalStacks(monsterState, CI_TAG_FX);
      removeStatusEffect(monsterState, CI_TAG_FX);
      ctx.damage = tags > 0
        ? Math.max(1, Math.floor(player.dealsDamage.attack * Math.pow(CI_BASE_MULT, tags)))
        : player.dealsDamage.attack;
      return;
    }

    if (hasPassive(player, 'energy.superconducting-mass')) {
      const empMult = passives['energy.empowered-mult'] ?? 6.0;
      const pool    = energy.smChargePool;
      // ctx.damage is already plating/DR-reduced base; pool bypasses both.
      ctx.damage = Math.floor(ctx.damage * empMult) + pool;
      energy.smChargePool = 0;
      return;
    }

    if (hasPassive(player, 'energy.capacitor-shunt')) {
      const empMult   = passives['energy.empowered-mult'] ?? 2.0;
      const reservoir = energy.csReservoir;
      const ampFactor = 1 + reservoir / CS_RESERVOIR_SCALE;
      ctx.damage      = Math.max(1, Math.floor(player.dealsDamage.attack * empMult * ampFactor));
      return;
    }

    // ── T4 specs ───────────────────────────────────────────────────────────────

    // Binary Cycle: alternating big/small discharge, then flip state. Base mult
    // still applies on top (not suppressed).
    if (hasPassive(player, 'energy.binary-cycle')) {
      const chargeMult = Math.max(0, passives['energy.binary-charge-discharge-mult'] ?? BINARY_CHARGE_DISCHARGE_MULT);
      const dischargeMult = Math.max(0, passives['energy.binary-discharge-discharge-mult'] ?? BINARY_DISCHARGE_DISCHARGE_MULT);
      const mult = energy.binaryDischargeState ? dischargeMult : chargeMult;
      ctx.damage = Math.max(1, Math.round(ctx.damage * mult));
      energy.binaryDischargeState = !energy.binaryDischargeState;
      return;
    }

    // Stormbringer: the discharge is the FIRST of N uniform 1.5× empowered strikes
    // (base mult suppressed in beforeAttack, so this applies exactly 1.5×). It's a real
    // empowered hit; arm the remaining N−1 strikes (handled in normalHit).
    if (hasPassive(player, 'energy.awakened-lightning')) {
      const damageMult = Math.max(0, passives['energy.awakened-damage-mult'] ?? AWAKENED_MULT);
      const strikeCount = Math.max(1, Math.round(passives['energy.awakened-strike-count'] ?? AWAKENED_N));
      ctx.damage = Math.max(1, Math.round(ctx.damage * damageMult));
      energy.awakenedCharges = strikeCount - 1;
      return;
    }

    // Critical Mass: consecutive discharges stack a discharge-damage multiplier.
    if (hasPassive(player, 'energy.critical-mass')) {
      const maxStacks = Math.max(1, Math.round(passives['energy.critical-mass-max-stacks'] ?? CRITICAL_MASS_MAX));
      const damagePerStack = Math.max(0, passives['energy.critical-mass-discharge-per-stack'] ?? CRITICAL_MASS_DMG_PER_STACK);
      energy.criticalMassStacks = Math.min(maxStacks, energy.criticalMassStacks + 1);
      energy.criticalMassGapMs = 0;
      ctx.damage = Math.round(ctx.damage * (1 + energy.criticalMassStacks * damagePerStack));
      return;
    }

    // Endless Storm: discharge deals normal damage AND applies/refreshes a storm DoT.
    if (hasPassive(player, 'energy.endless-storm') && ctx.defenderType === 'monster') {
      // Discharge deals NORMAL damage (mult suppressed in beforeAttack) — the entire
      // empowered payload is the storm DoT: total = attack × TOTAL_MULT over the base
      // duration, captured per-tick at cast time. Extending the storm = more total.
      const tickMs = Math.max(100, Math.round(passives['energy.endless-storm-tick-ms'] ?? ENDLESS_STORM_TICK_MS));
      const durationMs = Math.max(100, Math.round(passives['energy.endless-storm-duration-ms'] ?? ENDLESS_STORM_DURATION_MS));
      const maxMs = Math.max(durationMs, Math.round(passives['energy.endless-storm-max-ms'] ?? ENDLESS_STORM_MAX_MS));
      const totalMult = Math.max(
        0,
        passives['energy.endless-storm-total-mult'] ?? ENDLESS_STORM_TOTAL_MULT,
      );
      const damagePerTick = Math.max(1, Math.round(
        player.dealsDamage.attack * totalMult * tickMs / durationMs,
      ));
      applyStatusEffect(ctx.defender.tracksCombat, {
        id: STORM_FX, instanced: false, maxStacks: 1, refreshable: true,
        remainingMs: durationMs, sourceId: player.isPlayer.id,
        data: { damagePerTick, nextTickIn: tickMs, tickIntervalMs: tickMs, totalMs: maxMs },
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
