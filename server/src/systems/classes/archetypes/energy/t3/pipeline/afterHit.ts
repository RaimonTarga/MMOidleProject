import { registerCombatListener } from "../../../../../combat/engine/combatPipeline";
import { setEmpoweredAttack } from "../../../../../combat/engine/empoweredAttacks";
import {
  attachComponent,
  detachComponent,
} from "../../../../../../ecs/markerHelpers";
import { hasPassive, energyPercent } from "../core/helpers";
import { applyFlashSpeedGain } from "../ticks/flash";
import {
  AC_ENERGY_GAIN_MULT,
  AC_DISCHARGE_TOTAL_MS,
  AC_TICK_INTERVAL_MS,
  AC_SPEED_FACTOR,
  CS_SPLIT_RATIO,
  CS_RESERVOIR_MAX,
  SE_ENERGY_MAX,
  SE_ACCEL_SCALE,
  BINARY_CHARGE_GAIN_MULT,
  CRITICAL_MASS_GAIN_PER_STACK,
} from "../core/constants";

/**
 * Energy T3 afterHit listener — custom energy gain for T3 mechanics.
 *
 * Fires BEFORE the base `energyPrototype` afterHit (which is registered
 * after this). Each branch sets `ctx.metadata['energyHandled']` so the base
 * handler skips. Empowered hits never generate energy.
 *
 * Paths:
 *   - Flash                   — slow energy gain, scaling attack speed, no discharge
 *   - Micro-Venting           — gain energy (capped, no discharge)
 *   - Alternating Currents    — 2× gain in charge phase; flip to discharge at cap
 *   - Capacitor Shunt         — split gain 50/50 between bar and reservoir
 *   - Singularity Execute     — doubled max; accelerating gain
 */
export function registerAfterHit(): void {
  registerCombatListener("afterHit", (ctx, world) => {
    if (ctx.attackerType !== "player") return;

    const entity = ctx.attacker;
    if (!entity?.usesEnergy) return;

    if (ctx.metadata["empoweredAttack"]) return;

    const player = entity;
    const passives = player.usesSkills.passives;
    const energy = entity.usesEnergy;

    if (energy.energyMax === 0) energy.energyMax = 100;

    const baseGain = Math.round(passives["energy.per-hit"] ?? 14);

    if (hasPassive(player, "energy.flash")) {
      applyFlashSpeedGain(world, player);
      ctx.metadata["energyHandled"] = true;
      return;
    }

    if (hasPassive(player, "energy.micro-venting")) {
      energy.energy = Math.min(energy.energy + baseGain, energy.energyMax);
      ctx.metadata["energyHandled"] = true;
      return;
    }

    if (hasPassive(player, "energy.alternating-currents")) {
      if (!player.inAcDischarge && !player.inAcChargePhase) {
        attachComponent(world, player, "inAcChargePhase", {});
      }
      if (player.inAcChargePhase) {
        const gain = Math.round(baseGain * AC_ENERGY_GAIN_MULT);
        const newEnergy = Math.min(energy.energy + gain, energy.energyMax);
        energy.energy = newEnergy;
        if (newEnergy >= energy.energyMax) {
          energy.energy = 0;
          detachComponent(world, player, "inAcChargePhase");
          const baseCd = player.performsAttack.attackCooldown;
          player.performsAttack.attackCooldown = Math.max(
            200,
            Math.round(player.performsAttack.attackCooldown * AC_SPEED_FACTOR),
          );
          attachComponent(world, player, "inAcDischarge", {
            remainingMs: AC_DISCHARGE_TOTAL_MS,
            tickNext: AC_TICK_INTERVAL_MS,
            baseCd,
          });
          console.log(
            `[AltCurrents] ${player.isPlayer.id}: charge -> discharge (speed boosted)`,
          );
        }
      }
      ctx.metadata["energyHandled"] = true;
      return;
    }

    if (hasPassive(player, "energy.capacitor-shunt")) {
      const activeGain = Math.round(baseGain * CS_SPLIT_RATIO);
      const reservoirGain = Math.round(baseGain * CS_SPLIT_RATIO);
      energy.energy = Math.min(energy.energy + activeGain, energy.energyMax);
      energy.csReservoir = Math.min(
        energy.csReservoir + reservoirGain,
        CS_RESERVOIR_MAX,
      );
      if (energy.energy >= energy.energyMax) {
        energy.energy = 0;
        setEmpoweredAttack(world, player);
        console.log(
          `[CapacitorShunt] ${player.isPlayer.id}: discharge armed (reservoir=${Math.round(energy.csReservoir)})`,
        );
      }
      ctx.metadata["energyHandled"] = true;
      return;
    }

    if (hasPassive(player, "energy.singularity-execute")) {
      if (energy.energyMax !== SE_ENERGY_MAX) {
        energy.energyMax = SE_ENERGY_MAX;
        energy.seInitialized = true;
      }
      const fillPct = energyPercent(energy);
      const scaledGain = Math.round(baseGain * (1 + fillPct * SE_ACCEL_SCALE));
      energy.energy = Math.min(energy.energy + scaledGain, energy.energyMax);
      if (energy.energy >= energy.energyMax) {
        energy.dischargeEnergy = energy.energyMax; // captured for discharge scaling
        energy.energy = 0;
        setEmpoweredAttack(world, player);
        console.log(
          `[SingularityExec] ${player.isPlayer.id}: max energy (${SE_ENERGY_MAX}) - discharge armed`,
        );
      }
      ctx.metadata["energyHandled"] = true;
      return;
    }

    // ── T4 specs ───────────────────────────────────────────────────────────────

    // Overdrive: build energy; at max, enter the +ATK% mode (held at max, then the
    // tick decays it 100→0). While active, attacks add no energy.
    if (hasPassive(player, "energy.overdrive")) {
      if (!energy.overdriveActive) {
        energy.energy = Math.min(energy.energy + baseGain, energy.energyMax);
        if (energy.energy >= energy.energyMax) {
          energy.overdriveActive = true;
          energy.energy = energy.energyMax;
        }
      }
      ctx.metadata["energyHandled"] = true;
      return;
    }

    // Energy Upkeep: build energy; never discharges (the upkeep timer + on-hit
    // scaling and continuous decay are handled in the tick / normalHit).
    if (hasPassive(player, "energy.upkeep")) {
      energy.energy = Math.min(energy.energy + baseGain, energy.energyMax);
      ctx.metadata["energyHandled"] = true;
      return;
    }

    // Binary Cycle: Charge State gains energy faster; discharge arms at max.
    if (hasPassive(player, "energy.binary-cycle")) {
      const gain = energy.binaryDischargeState ? baseGain : Math.round(baseGain * BINARY_CHARGE_GAIN_MULT);
      energy.energy = Math.min(energy.energy + gain, energy.energyMax);
      if (energy.energy >= energy.energyMax) {
        energy.dischargeEnergy = energy.energyMax;
        energy.energy = 0;
        setEmpoweredAttack(world, player);
      }
      ctx.metadata["energyHandled"] = true;
      return;
    }

    // Critical Mass: resets the no-damage gap and gains energy faster per stack.
    if (hasPassive(player, "energy.critical-mass")) {
      energy.criticalMassGapMs = 0;
      const gain = Math.round(baseGain * (1 + energy.criticalMassStacks * CRITICAL_MASS_GAIN_PER_STACK));
      energy.energy = Math.min(energy.energy + gain, energy.energyMax);
      if (energy.energy >= energy.energyMax) {
        energy.dischargeEnergy = energy.energyMax;
        energy.energy = 0;
        setEmpoweredAttack(world, player);
      }
      ctx.metadata["energyHandled"] = true;
      return;
    }
  });
}
