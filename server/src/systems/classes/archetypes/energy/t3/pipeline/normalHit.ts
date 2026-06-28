import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { isEmpoweredAttack } from '../../../../../combat/engine/empoweredAttacks';
import { evadeBlocksDebuffs } from '../../../../../defense/mitigation/evasion';
import {
  applyStatusEffect, removeStatusEffect, getStatusEffect,
} from '@mmo-idle/shared';
import { resolveUpkeepConfig, upkeepStacks, upkeepOnHitBonus, UPKEEP_UNLOCK_TIER } from '@mmo-idle/shared';
import { hasPassive, energyPercent, chargeStateMult } from '../core/helpers';
import {
  FLASH_MAX_DAMAGE_SHIFT_PCT,
  MV_THRESHOLD, MV_ENERGY_COST, MV_FLAT_DAMAGE,
  PD_OVERCHARGE_FX, PD_STACK_FLAT_DMG,
  AC_CHARGE_DMG_MULT,
  HE_LOW_THRESHOLD, HE_HIGH_THRESHOLD, HE_DMG_MULT,
  CI_TAG_FX, CI_TAG_MS,
  ENERGY_OVERDRIVE_ATK_PCT,
  BINARY_DISCHARGE_ATK_BONUS, BINARY_CHARGE_ONHIT_BONUS,
  BINARY_CHARGE_ONHIT_PER_TIER, BINARY_UNLOCK_TIER,
  AWAKENED_MULT,
  CHARGE_STATE_MIN, CHARGE_STATE_MAX,
  STORM_FX, ENDLESS_STORM_EXTEND_MS, ENDLESS_STORM_MAX_MS,
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
    const passives = player.usesSkills.passives;
    const energy = entity.usesEnergy;

    if (hasPassive(player, 'energy.flash')) {
      const fillPct = energyPercent(energy);
      const maxShift = Math.max(0, passives['energy.flash-max-damage-shift-pct'] ?? FLASH_MAX_DAMAGE_SHIFT_PCT);
      const damageMult = 1 + maxShift - fillPct * maxShift * 2;
      ctx.damage = Math.max(1, Math.round(ctx.damage * damageMult));
      return;
    }

    if (hasPassive(player, 'energy.micro-venting')) {
      if (energyPercent(energy) > MV_THRESHOLD && energy.energy >= MV_ENERGY_COST) {
        energy.energy = Math.max(0, energy.energy - MV_ENERGY_COST);
        ctx.damage += MV_FLAT_DAMAGE;
      }
    }

    if (hasPassive(player, 'energy.polarity-decay')) {
      const oc = getStatusEffect(state, PD_OVERCHARGE_FX);
      if (oc && oc.stacks > 0) {
        ctx.damage += PD_STACK_FLAT_DMG;
        oc.stacks   = Math.max(0, oc.stacks - 1);
        if (oc.stacks === 0) removeStatusEffect(state, PD_OVERCHARGE_FX);
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
      }
    }

    if (hasPassive(player, 'energy.superconducting-mass')) {
      ctx.damage = 0;
      energy.smChargePool += player.dealsDamage.attack;
    }

    // ── T4 specs ───────────────────────────────────────────────────────────────

    // Overdrive: +ATK% while the mode is active (energy decaying in the tick).
    if (hasPassive(player, 'energy.overdrive') && energy.overdriveActive) {
      const attackBonus = Math.max(0, passives['energy.overdrive-attack-damage-pct'] ?? ENERGY_OVERDRIVE_ATK_PCT);
      ctx.damage = Math.round(ctx.damage * (1 + attackBonus));
      // Aesthetic-only crits while Surge is active: yellow "!" styling.
      ctx.metadata['empoweredAttack'] = true;
    }

    // Energy Upkeep (Channeler): ADD flat on-hit damage from upkeep stacks — strictly
    // on-hit (post-mitigation, no attack scaling), per tier with diminishing returns.
    if (hasPassive(player, 'energy.upkeep')) {
      const upkeep = resolveUpkeepConfig(passives);
      const stacks = upkeepStacks(energy, upkeep.stackIntervalMs);
      if (stacks > 0) {
        const tier = player.tracksProgression?.playerTier ?? UPKEEP_UNLOCK_TIER;
        ctx.damage += upkeepOnHitBonus(stacks, tier, upkeep);
      }
    }

    // Binary Cycle: Charge State boosts attack damage; Discharge State boosts on-hit.
    // TODO(engine): the per-state APS swing is not yet applied (needs a buff layer).
    if (hasPassive(player, 'energy.binary-cycle')) {
      if (energy.binaryDischargeState) {
        // Discharge: attack-damage bonus (percentage).
        const attackBonus = Math.max(0, passives['energy.binary-discharge-attack-bonus'] ?? BINARY_DISCHARGE_ATK_BONUS);
        ctx.damage = Math.round(ctx.damage * (1 + attackBonus));
      } else {
        // Charge: +on-hit% on existing on-hit AND flat on-hit per tier (shockblade-style).
        const onHitBonus = Math.max(0, passives['energy.binary-charge-onhit-bonus'] ?? BINARY_CHARGE_ONHIT_BONUS);
        const onHitPerTier = Math.max(0, passives['energy.binary-charge-onhit-per-tier'] ?? BINARY_CHARGE_ONHIT_PER_TIER);
        ctx.metadata['onHitDamageMult'] = 1 + onHitBonus;
        const tierMult = Math.max(1, (player.tracksProgression?.playerTier ?? BINARY_UNLOCK_TIER) - BINARY_UNLOCK_TIER + 1);
        ctx.damage += onHitPerTier * tierMult;
      }
    }

    // Charge State (Aetherist): attack mult oscillates with energy — 0.5× empty,
    // 1.0× at half (neutral), 2.0× full. Strongest right before discharge.
    if (hasPassive(player, 'energy.charge-state')) {
      const minMult = Math.max(0, passives['energy.charge-state-min-mult'] ?? CHARGE_STATE_MIN);
      const maxMult = Math.max(0, passives['energy.charge-state-max-mult'] ?? CHARGE_STATE_MAX);
      ctx.damage = Math.max(1, Math.round(ctx.damage * chargeStateMult(energyPercent(energy), minMult, maxMult)));
    }

    // Awakened Lightning (Stormbringer): spend a charge from the discharge. These are
    // REAL empowered attacks — set the flag so empowered-triggered gear + crit styling
    // + the empowered splash all apply, uniform with the discharge strike.
    if (hasPassive(player, 'energy.awakened-lightning') && energy.awakenedCharges > 0) {
      const damageMult = Math.max(0, passives['energy.awakened-damage-mult'] ?? AWAKENED_MULT);
      ctx.damage = Math.round(ctx.damage * damageMult);
      ctx.metadata['empoweredAttack'] = true;
      energy.awakenedCharges--;
    }

    // Endless Storm (Tempest): each normal attack extends the storm on the target,
    // capped — trivial to upkeep even with a slow weapon.
    if (hasPassive(player, 'energy.endless-storm') && ctx.defenderType === 'monster') {
      const storm = getStatusEffect(ctx.defender.tracksCombat, STORM_FX);
      const extendMs = Math.max(0, Math.round(passives['energy.endless-storm-extend-ms'] ?? ENDLESS_STORM_EXTEND_MS));
      const maxMs = Math.max(100, Math.round(passives['energy.endless-storm-max-ms'] ?? ENDLESS_STORM_MAX_MS));
      if (storm) storm.remainingMs = Math.min(maxMs, storm.remainingMs + extendMs);
    }
  });
}
