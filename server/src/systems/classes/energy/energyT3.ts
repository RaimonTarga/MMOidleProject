import type { PlayerSnapshot, PassiveKey } from '@mmo-idle/shared';
import { defineBuff, type BuffDescriptor } from '../../registry/buffs';
import { registerCombatListener } from '../../combatPipeline';
import { isEmpoweredAttack, setEmpoweredAttack } from '../../empoweredAttacks';
import {
  applyStatusEffect, removeStatusEffect, getStatusEffect, getTotalStacks,
} from '../../statusEffects';
import { grantMonsterRewards } from '../../rewards';
import type { CombatState } from '../../combatState';
import type { World } from '../../../world/World';
import type { EnergyComponent } from '../../../ecs/components/energy';
import type { PlayerEntity } from '../../../ecs/components/player';

// ── Light: Accumulator (energy-light-t3-a) ────────────────────────────────────
const ACC_BASE_DRAIN_PER_SEC = 8;   // energy drained/sec at 0 stacks
const ACC_DRAIN_PER_STACK    = 3;   // extra drain/sec per stack
const ACC_FLAT_ATK_PER_STACK = 2;   // flat attack bonus per stack
const ACC_MAX_STACKS         = 10;
const ACC_BUFF_FX            = 'energy-acc-buff';

// ── Light: Micro-Venting (energy-light-t3-b) ──────────────────────────────────
const MV_ENERGY_COST = 15;   // energy consumed per vent
const MV_FLAT_DAMAGE = 20;   // flat bonus damage when venting
const MV_THRESHOLD   = 0.5; // must be strictly above 50%

// ── Light: Polarity Decay (energy-light-t3-c) ─────────────────────────────────
const PD_DISCHARGE_MULT   = 0.7;
const PD_OVERCHARGE_COUNT = 5;
const PD_OVERCHARGE_MS    = 8_000;
const PD_STACK_FLAT_DMG   = 12;
const PD_OVERCHARGE_FX    = 'energy-overcharge';

// ── Balanced: Alternating Currents (energy-balanced-t3-a) ────────────────────
const AC_CHARGE_DMG_MULT    = 1.2;
const AC_ENERGY_GAIN_MULT   = 2.0;
const AC_DISCHARGE_TOTAL_MS = 3_000;
const AC_TICK_INTERVAL_MS   = 500;
const AC_TICK_DAMAGE_MULT   = 0.5;
const AC_SPEED_FACTOR       = 2 / 3; // 1.5× attacks/s during discharge

// ── Balanced: Harmonic Equilibrium (energy-balanced-t3-b) ────────────────────
const HE_DMG_MULT       = 1.6;
const HE_LOW_THRESHOLD  = 0.40;
const HE_HIGH_THRESHOLD = 0.60;

// ── Balanced: Capacitor Shunt (energy-balanced-t3-c) ─────────────────────────
const CS_SPLIT_RATIO     = 0.5;
export const CS_RESERVOIR_MAX   = 500;
const CS_RESERVOIR_SCALE = 250; // at max reservoir: (1 + 500/250) = 3× on base mult

// ── Heavy: Singularity Execute (energy-heavy-t3-a) ───────────────────────────
export const SE_ENERGY_MAX = 200;
const SE_ACCEL_SCALE     = 0.5;  // gain *= (1 + fillPct × SE_ACCEL_SCALE)

// ── Heavy: Cascading Induction (energy-heavy-t3-b) ───────────────────────────
const CI_TAG_FX    = 'energy-ci-tag';
const CI_TAG_MS    = 15_000;
const CI_BASE_MULT = 1.3; // burst = player.attack × 1.3^tagCount

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasPassive(player: PlayerSnapshot | PlayerEntity, key: PassiveKey): boolean {
  const passives = 'entityId' in player ? player.usesSkills.passives : player.passives;
  return (passives[key] ?? 0) > 0;
}

function endACDischarge(player: PlayerEntity, energy: EnergyComponent): void {
  if (energy.acSpeedActive && energy.acSpeedBase > 0) {
    player.performsAttack.attackCooldown = energy.acSpeedBase;
    energy.acSpeedActive = false;
  }
  energy.acChargePhase = true;
  energy.acDischargeMs = 0;
  energy.acTickNext    = 0;
  console.log(`[AltCurrents] ${player.isPlayer.id}: discharge → charge phase`);
}

function energyPercent(energy: EnergyComponent): number {
  if (energy.energyMax <= 0) return 0;
  return energy.energy / energy.energyMax;
}

// ── Init ──────────────────────────────────────────────────────────────────────

/**
 * Register all energy T3 combat pipeline listeners.
 * Called from initEnergyArchetype() BEFORE registerEmpoweredMultiplier so that:
 *   - beforeAttack suppression fires early in the phase
 *   - onHit (empowered) handlers fire first and check isEmpoweredAttack(state)
 *     directly (flag is still set; registerEmpoweredMultiplier hasn't consumed it)
 *   - afterHit handlers set ctx.metadata['energyHandled'] to skip the base handler
 */
export function initEnergyT3(): void {

  // ── 1. beforeAttack ────────────────────────────────────────────────────────
  registerCombatListener('beforeAttack', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;

    const entity = ctx.attacker;
    if (!entity?.energy) return;

    const state  = entity.combatState;
    const player = entity;
    const passives = player.usesSkills.passives;

    // Suppress the standard empowered multiplier for mechanics with custom discharge.
    if (isEmpoweredAttack(state) && (
      hasPassive(player, 'energy.polarity-decay')       ||
      hasPassive(player, 'energy.cascading-induction')  ||
      hasPassive(player, 'energy.superconducting-mass') ||
      hasPassive(player, 'energy.capacitor-shunt')
    )) {
      ctx.metadata['suppressEmpoweredMult'] = true;
    }

    // Singularity Execute: force discharge early if the target would die from it.
    if (
      hasPassive(player, 'energy.singularity-execute') &&
      ctx.defenderType === 'monster' &&
      !isEmpoweredAttack(state)
    ) {
      const empMult   = passives['energy.empowered-mult'] ?? 6.0;
      const projected = Math.floor(player.dealsDamage.attack * empMult);
      if (ctx.defender.hasHealth.hp <= projected) {
        setEmpoweredAttack(state);
        console.log(`[SingularityExec] ${player.isPlayer.id}: execute — ${ctx.defender.hasHealth.hp} HP <= ${projected} projected`);
      }
    }
  });

  // ── 2. onHit — empowered discharge handlers ────────────────────────────────
  // Fires BEFORE registerEmpoweredMultiplier. The empowered flag is still set
  // at this point, so isEmpoweredAttack(state) === true for empowered hits.
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;

    const entity = ctx.attacker;
    if (!entity?.energy) return;

    const state  = entity.combatState;
    if (!isEmpoweredAttack(state)) return;

    const player = entity;
    const passives = player.usesSkills.passives;
    const energy = entity.energy;

    // Polarity Decay: reduced-damage discharge + grant overcharge stacks.
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

    // Cascading Induction: exponential burst from tag count; consumes all tags.
    if (hasPassive(player, 'energy.cascading-induction') && ctx.defenderType === 'monster') {
      const monsterState = ctx.defender.combatState;
      const tags = getTotalStacks(monsterState, CI_TAG_FX);
      removeStatusEffect(monsterState, CI_TAG_FX);
      ctx.damage = tags > 0
        ? Math.max(1, Math.floor(player.dealsDamage.attack * Math.pow(CI_BASE_MULT, tags)))
        : player.dealsDamage.attack;
      console.log(`[CascadeInduct] ${player.isPlayer.id}: ${tags} tags -> ${ctx.damage} burst on ${ctx.defender.isMonster.id}`);
      return;
    }

    // Superconducting Mass: standard multiplier on base hit + stored charge as bonus.
    // suppressEmpoweredMult lets us apply the multiplier ourselves so we can add the pool.
    if (hasPassive(player, 'energy.superconducting-mass')) {
      const empMult = passives['energy.empowered-mult'] ?? 6.0;
      const pool    = energy.smChargePool;
      // ctx.damage is already the plating/DR-reduced base; pool bypasses those.
      ctx.damage = Math.floor(ctx.damage * empMult) + pool;
      energy.smChargePool = 0;
      console.log(`[SuperconductM] ${player.isPlayer.id}: ${empMult}x base + ${pool} stored charge -> ${ctx.damage} total`);
      return;
    }

    // Capacitor Shunt: discharge amplified by accumulated reservoir.
    if (hasPassive(player, 'energy.capacitor-shunt')) {
      const empMult   = passives['energy.empowered-mult'] ?? 2.0;
      const reservoir = energy.csReservoir;
      const ampFactor = 1 + reservoir / CS_RESERVOIR_SCALE;
      ctx.damage      = Math.max(1, Math.floor(player.dealsDamage.attack * empMult * ampFactor));
      console.log(`[CapacitorShunt] ${player.isPlayer.id}: ${empMult}xbase x ${ampFactor.toFixed(2)} (res=${Math.round(reservoir)}) -> ${ctx.damage}`);
      return;
    }
  });

  // ── 3. onHit — normal hit handlers ────────────────────────────────────────
  // Skip empowered hits (flag still set). registerEmpoweredMultiplier fires after this.
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;

    const entity = ctx.attacker;
    if (!entity?.energy) return;

    const state = entity.combatState;
    if (isEmpoweredAttack(state)) return; // skip empowered hits

    const player = entity;
    const energy = entity.energy;

    // Accumulator: flat damage bonus from active buff stacks.
    if (hasPassive(player, 'energy.accumulator')) {
      const buff = getStatusEffect(state, ACC_BUFF_FX);
      if (buff) ctx.damage += buff.stacks * ACC_FLAT_ATK_PER_STACK;
    }

    // Micro-Venting: consume energy for flat bonus while above the threshold.
    if (hasPassive(player, 'energy.micro-venting')) {
      if (energyPercent(energy) > MV_THRESHOLD && energy.energy >= MV_ENERGY_COST) {
        energy.energy = Math.max(0, energy.energy - MV_ENERGY_COST);
        ctx.damage += MV_FLAT_DAMAGE;
        console.log(`[MicroVenting] ${player.isPlayer.id}: vent -> +${MV_FLAT_DAMAGE} dmg`);
      }
    }

    // Polarity Decay: consume one overcharge stack for flat bonus.
    if (hasPassive(player, 'energy.polarity-decay')) {
      const oc = getStatusEffect(state, PD_OVERCHARGE_FX);
      if (oc && oc.stacks > 0) {
        ctx.damage += PD_STACK_FLAT_DMG;
        oc.stacks   = Math.max(0, oc.stacks - 1);
        if (oc.stacks === 0) removeStatusEffect(state, PD_OVERCHARGE_FX);
        console.log(`[PolarityDecay] ${player.isPlayer.id}: 1 overcharge consumed -> +${PD_STACK_FLAT_DMG} dmg`);
      }
    }

    // Alternating Currents: bonus damage during charge phase.
    if (hasPassive(player, 'energy.alternating-currents') && energy.acChargePhase) {
      ctx.damage = Math.round(ctx.damage * AC_CHARGE_DMG_MULT);
    }

    // Harmonic Equilibrium: bonus while energy is strictly 40–60%.
    if (hasPassive(player, 'energy.harmonic-equilibrium')) {
      const pct = energyPercent(energy);
      if (pct > HE_LOW_THRESHOLD && pct < HE_HIGH_THRESHOLD) {
        ctx.damage = Math.round(ctx.damage * HE_DMG_MULT);
      }
    }

    // Cascading Induction: near-zero damage + plant induction tag.
    if (hasPassive(player, 'energy.cascading-induction') && ctx.defenderType === 'monster') {
      ctx.damage = 1;
      const monsterState = ctx.defender.combatState;
      applyStatusEffect(monsterState, {
        id: CI_TAG_FX, instanced: false,
        remainingMs: CI_TAG_MS, refreshable: true,
        sourceId: player.isPlayer.id, data: {},
      });
      console.log(`[CascadeInduct] ${player.isPlayer.id}: tag planted -> ${getTotalStacks(monsterState, CI_TAG_FX)} on ${ctx.defender.isMonster.id}`);
    }

    // Superconducting Mass: zero damage; accumulate raw attack into charge pool.
    if (hasPassive(player, 'energy.superconducting-mass')) {
      ctx.damage = 0;
      energy.smChargePool += player.dealsDamage.attack;
      console.log(`[SuperconductM] ${player.isPlayer.id}: +${player.dealsDamage.attack} stored (pool=${energy.smChargePool})`);
    }
  });

  // ── 4. afterHit — custom energy gain for T3 mechanics ─────────────────────
  // Fires BEFORE the base energyPrototype afterHit (which is registered after this).
  // Sets ctx.metadata['energyHandled'] so the base handler skips.
  registerCombatListener('afterHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;

    const entity = ctx.attacker;
    if (!entity?.energy) return;

    if (ctx.metadata['empoweredAttack']) return; // empowered hits never generate energy

    const player = entity;
    const passives = player.usesSkills.passives;
    const state  = entity.combatState;
    const energy = entity.energy;

    if (energy.energyMax === 0) energy.energyMax = 100;

    const baseGain = Math.round(passives['energy.per-hit'] ?? 14);

    // Accumulator: gain energy (capped, no discharge); grant one buff stack per hit.
    if (hasPassive(player, 'energy.accumulator')) {
      energy.energy = Math.min(energy.energy + baseGain, energy.energyMax);
      const existing = getStatusEffect(state, ACC_BUFF_FX);
      if (!existing || existing.stacks < ACC_MAX_STACKS) {
        applyStatusEffect(state, {
          id: ACC_BUFF_FX, instanced: false, maxStacks: ACC_MAX_STACKS,
          remainingMs: -1, refreshable: false, sourceId: player.isPlayer.id, data: {},
        });
      }
      ctx.metadata['energyHandled'] = true;
      return;
    }

    // Micro-Venting: gain energy (capped, no discharge).
    if (hasPassive(player, 'energy.micro-venting')) {
      energy.energy = Math.min(energy.energy + baseGain, energy.energyMax);
      ctx.metadata['energyHandled'] = true;
      return;
    }

    // Alternating Currents: doubled gain in charge phase; no gain in discharge phase.
    if (hasPassive(player, 'energy.alternating-currents')) {
      // Always start in charge phase until something flips us into discharge.
      // (acChargePhase defaults to false in makeEnergyComponent — flip it on first hit.)
      if (energy.acDischargeMs <= 0 && !energy.acChargePhase) {
        energy.acChargePhase = true;
      }
      if (energy.acChargePhase) {
        const gain      = Math.round(baseGain * AC_ENERGY_GAIN_MULT);
        const newEnergy = Math.min(energy.energy + gain, energy.energyMax);
        energy.energy   = newEnergy;
        if (newEnergy >= energy.energyMax) {
          energy.energy        = 0;
          energy.acChargePhase = false;
          if (!energy.acSpeedActive) {
            energy.acSpeedBase   = player.performsAttack.attackCooldown;
            player.performsAttack.attackCooldown = Math.max(200, Math.round(player.performsAttack.attackCooldown * AC_SPEED_FACTOR));
            energy.acSpeedActive = true;
          }
          energy.acDischargeMs = AC_DISCHARGE_TOTAL_MS;
          energy.acTickNext    = AC_TICK_INTERVAL_MS;
          console.log(`[AltCurrents] ${player.isPlayer.id}: charge -> discharge (speed boosted)`);
        }
      }
      ctx.metadata['energyHandled'] = true;
      return;
    }

    // Capacitor Shunt: split gain 50/50 between active bar and reservoir.
    if (hasPassive(player, 'energy.capacitor-shunt')) {
      const activeGain    = Math.round(baseGain * CS_SPLIT_RATIO);
      const reservoirGain = Math.round(baseGain * CS_SPLIT_RATIO);
      energy.energy      = Math.min(energy.energy + activeGain, energy.energyMax);
      energy.csReservoir = Math.min(energy.csReservoir + reservoirGain, CS_RESERVOIR_MAX);
      if (energy.energy >= energy.energyMax) {
        energy.energy = 0;
        setEmpoweredAttack(state);
        console.log(`[CapacitorShunt] ${player.isPlayer.id}: discharge armed (reservoir=${Math.round(energy.csReservoir)})`);
      }
      ctx.metadata['energyHandled'] = true;
      return;
    }

    // Singularity Execute: doubled max; gain accelerates as pool fills.
    if (hasPassive(player, 'energy.singularity-execute')) {
      if (energy.energyMax !== SE_ENERGY_MAX) {
        energy.energyMax = SE_ENERGY_MAX;
        energy.seInitialized = true;
      }
      const fillPct    = energyPercent(energy);
      const scaledGain = Math.round(baseGain * (1 + fillPct * SE_ACCEL_SCALE));
      energy.energy    = Math.min(energy.energy + scaledGain, energy.energyMax);
      if (energy.energy >= energy.energyMax) {
        energy.energy = 0;
        setEmpoweredAttack(state);
        console.log(`[SingularityExec] ${player.isPlayer.id}: max energy (${SE_ENERGY_MAX}) - discharge armed`);
      }
      ctx.metadata['energyHandled'] = true;
      return;
    }

  });
}

// ── Per-tick update ───────────────────────────────────────────────────────────

export function updateEnergyT3(world: World, dt: number): void {
  updateAccumulator(world, dt);
  updateAlternatingCurrents(world, dt);
}

// ── Accumulator: time-driven energy drain ─────────────────────────────────────

function updateAccumulator(world: World, dt: number): void {
  for (const entity of world.energyPlayers) {
    if (!hasPassive(entity, 'energy.accumulator')) continue;

    const state  = entity.combatState;
    const energy = entity.energy;

    const stacks      = getStatusEffect(state, ACC_BUFF_FX)?.stacks ?? 0;
    const drainPerSec = ACC_BASE_DRAIN_PER_SEC + stacks * ACC_DRAIN_PER_STACK;
    energy.energy     = Math.max(0, energy.energy - drainPerSec * (dt / 1000));

    if (energy.energy === 0 && stacks > 0) {
      removeStatusEffect(state, ACC_BUFF_FX);
      console.log(`[Accumulator] ${entity.isPlayer.id}: energy drained to 0 - ${stacks} stacks cleared`);
    }
  }
}

// ── Alternating Currents: discharge phase tick ────────────────────────────────

function updateAlternatingCurrents(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const entity of world.energyPlayers) {
    const player = entity;
    if (!hasPassive(player, 'energy.alternating-currents')) continue;

    const energy = entity.energy;

    if (energy.acDischargeMs <= 0) continue;

    const newMs = Math.max(0, energy.acDischargeMs - dt);
    energy.acDischargeMs = newMs;

    energy.energy = Math.max(0, energy.energy - energy.energyMax * (dt / AC_DISCHARGE_TOTAL_MS));

    const tickNext = energy.acTickNext - dt;
    if (tickNext <= 0) {
      energy.acTickNext = tickNext + AC_TICK_INTERVAL_MS;
      const targetId = player.performsAttack.attackTargetId;
      if (targetId) {
        const monster = world.getMonsterEntity(targetId);
        if (monster && monster.hasPosition.nodeId === player.hasPosition.nodeId) {
          const tickDmg = Math.max(1, Math.round(player.dealsDamage.attack * AC_TICK_DAMAGE_MULT));
          monster.hasHealth.hp -= tickDmg;
          console.log(`[AltCurrents] ${player.isPlayer.id}: ${tickDmg} discharge tick on ${targetId}, hp=${Math.max(0, monster.hasHealth.hp)}`);
          if (monster.hasHealth.hp <= 0) toKill.push({ monsterId: targetId, sourceId: player.isPlayer.id });
        }
      }
    } else {
      energy.acTickNext = tickNext;
    }

    if (newMs <= 0) endACDischarge(player, energy);
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.removeMonsterEntity(monsterId);
  }
}

// ── buffSync helpers ──────────────────────────────────────────────────────────

export function getAccumulatorStacks(state: CombatState): number {
  return getStatusEffect(state, ACC_BUFF_FX)?.stacks ?? 0;
}

export function getOverchargeStacks(state: CombatState): number {
  return getStatusEffect(state, PD_OVERCHARGE_FX)?.stacks ?? 0;
}

export function getACPhase(energy: EnergyComponent): 'charge' | 'discharge' | 'idle' {
  if (energy.acDischargeMs > 0) return 'discharge';
  if (energy.acChargePhase) return 'charge';
  return 'idle';
}

export function getACDischargeRemainingPct(energy: EnergyComponent): number {
  const ms = energy.acDischargeMs;
  if (ms <= 0) return 0;
  return Math.round((ms / AC_DISCHARGE_TOTAL_MS) * 100);
}

export function getCapacitorReservoirPct(energy: EnergyComponent): number {
  return Math.min(100, Math.round((energy.csReservoir / CS_RESERVOIR_MAX) * 100));
}

export function getSMChargePool(energy: EnergyComponent): number {
  return Math.round(energy.smChargePool);
}

// ── Buff descriptors ──────────────────────────────────────────────────────────

/**
 * Fetch the energy component from the world view. Returns null when there is
 * no world reference, no player entity, or no energy component attached.
 */
function getEnergyForBuff(world: World, playerId: string): EnergyComponent | null {
  return world.getPlayerEntity(playerId)?.energy ?? null;
}

export const ENERGY_T3_BUFFS = [
  defineBuff('energy-acc', ({ player, playerCs }) => {
    if (!playerCs || player.combatArchetype !== 'energy') return null;
    const stacks = getAccumulatorStacks(playerCs);
    return stacks > 0 ? { id: 'energy-acc', label: 'Surge', stacks, durationPct: -1, color: '#ffdd44' } : null;
  }),
  defineBuff('energy-overcharge', ({ player, playerCs }) => {
    if (!playerCs || player.combatArchetype !== 'energy') return null;
    const stacks = getOverchargeStacks(playerCs);
    return stacks > 0 ? { id: 'energy-overcharge', label: 'Overch', stacks, durationPct: -1, color: '#ff88ff' } : null;
  }),
  defineBuff('energy-ac-charge', ({ player, world }) => {
    if (player.combatArchetype !== 'energy') return null;
    const energy = getEnergyForBuff(world, player.id);
    if (!energy) return null;
    return getACPhase(energy) === 'charge'
      ? { id: 'energy-ac-charge', label: 'Chrge', stacks: 1, durationPct: -1, color: '#44ccff' }
      : null;
  }),
  defineBuff('energy-ac-discharge', ({ player, world }) => {
    if (player.combatArchetype !== 'energy') return null;
    const energy = getEnergyForBuff(world, player.id);
    if (!energy) return null;
    if (getACPhase(energy) !== 'discharge') return null;
    return { id: 'energy-ac-discharge', label: 'Disch', stacks: 1, durationPct: getACDischargeRemainingPct(energy), color: '#ff6622' };
  }),
  defineBuff('energy-reservoir', ({ player, world }) => {
    if (player.combatArchetype !== 'energy') return null;
    const energy = getEnergyForBuff(world, player.id);
    if (!energy) return null;
    const pct = getCapacitorReservoirPct(energy);
    return pct > 0 ? { id: 'energy-reservoir', label: 'Resvr', stacks: 1, durationPct: pct, color: '#88ddff' } : null;
  }),
  defineBuff('energy-equilibrium', ({ player, world }) => {
    if (player.combatArchetype !== 'energy') return null;
    if ((player.passives['energy.harmonic-equilibrium'] ?? 0) <= 0) return null;
    const energy = getEnergyForBuff(world, player.id);
    if (!energy) return null;
    const pct = energyPercent(energy);
    return pct > 0.40 && pct < 0.60
      ? { id: 'energy-equilibrium', label: 'Equil', stacks: 1, durationPct: -1, color: '#aaffcc' }
      : null;
  }),
  defineBuff('energy-sm-pool', ({ player, world }) => {
    if (player.combatArchetype !== 'energy') return null;
    if ((player.passives['energy.superconducting-mass'] ?? 0) <= 0) return null;
    const energy = getEnergyForBuff(world, player.id);
    if (!energy) return null;
    const pool = getSMChargePool(energy);
    return pool > 0 ? { id: 'energy-sm-pool', label: 'Chrge', stacks: pool, durationPct: -1, color: '#ff4488' } : null;
  }),
] as const satisfies readonly BuffDescriptor[];
