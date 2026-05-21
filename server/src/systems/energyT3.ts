import type { PlayerState, MonsterState } from '@mmo-idle/shared';
import { registerCombatListener } from './combatPipeline';
import {
  getResource, setResource,
  getFlag, setFlag,
} from './combatState';
import {
  gainResource, spendResource, resetResource,
  setMaxResource, isResourceFull, getResourcePercent,
} from './resourceMechanics';
import { isEmpoweredAttack, setEmpoweredAttack } from './empoweredAttacks';
import {
  applyStatusEffect, removeStatusEffect, getStatusEffect, getTotalStacks,
} from './statusEffects';
import { grantMonsterRewards } from './rewards';
import type { CombatState } from './combatState';
import type { World } from '../world/World';

// ── Shared constants (must match energyPrototype.ts) ─────────────────────────
const ENERGY_KEY = 'energy';
const ENERGY_MAX = 100;

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
const AC_CHARGE_FLAG        = 'ac-charge-phase';
const AC_DISCHARGE_MS_KEY   = 'ac-discharge-ms';
const AC_TICK_NEXT_KEY      = 'ac-tick-next';
const AC_SPEED_BASE_KEY     = 'ac-speed-base';
const AC_SPEED_ACTIVE       = 'ac-speed-active';

// ── Balanced: Harmonic Equilibrium (energy-balanced-t3-b) ────────────────────
const HE_DMG_MULT       = 1.6;
const HE_LOW_THRESHOLD  = 0.40;
const HE_HIGH_THRESHOLD = 0.60;

// ── Balanced: Capacitor Shunt (energy-balanced-t3-c) ─────────────────────────
const CS_SPLIT_RATIO     = 0.5;
const CS_RESERVOIR_KEY   = 'cs-reservoir';
export const CS_RESERVOIR_MAX   = 500;
const CS_RESERVOIR_SCALE = 250; // at max reservoir: (1 + 500/250) = 3× on base mult

// ── Heavy: Singularity Execute (energy-heavy-t3-a) ───────────────────────────
export const SE_ENERGY_MAX = 200;
const SE_ACCEL_SCALE     = 0.5;  // gain *= (1 + fillPct × SE_ACCEL_SCALE)
const SE_INITIALIZED     = 'se-initialized';

// ── Heavy: Cascading Induction (energy-heavy-t3-b) ───────────────────────────
const CI_TAG_FX    = 'energy-ci-tag';
const CI_TAG_MS    = 15_000;
const CI_BASE_MULT = 1.3; // burst = player.attack × 1.3^tagCount

// ── Heavy: Superconducting Mass (energy-heavy-t3-c) ──────────────────────────
// Normal hits deal 0 damage but store raw player.attack into a charge pool.
// Discharge: standard empMult × (base hit) + all stored charge (bypasses plating).
const SM_CHARGE_KEY = 'sm-charge-pool';

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasPassive(player: PlayerState, key: string): boolean {
  return (player.passives[key] ?? 0) > 0;
}

function endACDischarge(player: PlayerState, state: CombatState): void {
  if (getFlag(state, AC_SPEED_ACTIVE)) {
    player.attackCooldown = getResource(state, AC_SPEED_BASE_KEY) || player.attackCooldown;
    setFlag(state, AC_SPEED_ACTIVE, false);
  }
  setFlag(state, AC_CHARGE_FLAG, true);
  setResource(state, AC_DISCHARGE_MS_KEY, 0);
  setResource(state, AC_TICK_NEXT_KEY, 0);
  console.log(`[AltCurrents] ${player.id}: discharge → charge phase`);
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
  registerCombatListener('beforeAttack', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'energy') return;

    const state = world.playerCombatState.get(ctx.attacker.id);
    if (!state) return;
    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    if (!player) return;

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
      const monster   = ctx.defender as MonsterState;
      const empMult   = player.passives['energy.empowered-mult'] ?? 6.0;
      const projected = Math.floor(player.attack * empMult);
      if (monster.hp <= projected) {
        setEmpoweredAttack(state);
        console.log(`[SingularityExec] ${player.id}: execute — ${monster.hp} HP ≤ ${projected} projected`);
      }
    }
  });

  // ── 2. onHit — empowered discharge handlers ────────────────────────────────
  // Fires BEFORE registerEmpoweredMultiplier. The empowered flag is still set
  // at this point, so isEmpoweredAttack(state) === true for empowered hits.
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'energy') return;

    const state = world.playerCombatState.get(ctx.attacker.id);
    if (!state || !isEmpoweredAttack(state)) return;

    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    if (!player) return;

    // Polarity Decay: reduced-damage discharge + grant overcharge stacks.
    if (hasPassive(player, 'energy.polarity-decay')) {
      ctx.damage = Math.max(1, Math.floor(player.attack * PD_DISCHARGE_MULT));
      removeStatusEffect(state, PD_OVERCHARGE_FX);
      for (let i = 0; i < PD_OVERCHARGE_COUNT; i++) {
        applyStatusEffect(state, {
          id: PD_OVERCHARGE_FX, instanced: false,
          maxStacks: PD_OVERCHARGE_COUNT, remainingMs: PD_OVERCHARGE_MS,
          refreshable: false, sourceId: player.id, data: {},
        });
      }
      console.log(`[PolarityDecay] ${player.id}: discharge ${ctx.damage} dmg → ${PD_OVERCHARGE_COUNT} overcharge`);
      return;
    }

    // Cascading Induction: exponential burst from tag count; consumes all tags.
    if (hasPassive(player, 'energy.cascading-induction') && ctx.defenderType === 'monster') {
      const monsterState = world.monsterCombatState.get(ctx.defender.id);
      if (monsterState) {
        const tags = getTotalStacks(monsterState, CI_TAG_FX);
        removeStatusEffect(monsterState, CI_TAG_FX);
        ctx.damage = tags > 0
          ? Math.max(1, Math.floor(player.attack * Math.pow(CI_BASE_MULT, tags)))
          : player.attack;
        console.log(`[CascadeInduct] ${player.id}: ${tags} tags → ${ctx.damage} burst on ${ctx.defender.id}`);
      }
      return;
    }

    // Superconducting Mass: standard multiplier on base hit + stored charge as bonus.
    // suppressEmpoweredMult lets us apply the multiplier ourselves so we can add the pool.
    if (hasPassive(player, 'energy.superconducting-mass')) {
      const empMult   = player.passives['energy.empowered-mult'] ?? 6.0;
      const pool      = getResource(state, SM_CHARGE_KEY);
      // ctx.damage is already the plating/DR-reduced base; pool bypasses those.
      ctx.damage = Math.floor(ctx.damage * empMult) + pool;
      setResource(state, SM_CHARGE_KEY, 0);
      console.log(`[SuperconductM] ${player.id}: ${empMult}× base + ${pool} stored charge → ${ctx.damage} total`);
      return;
    }

    // Capacitor Shunt: discharge amplified by accumulated reservoir.
    if (hasPassive(player, 'energy.capacitor-shunt')) {
      const empMult   = player.passives['energy.empowered-mult'] ?? 2.0;
      const reservoir = getResource(state, CS_RESERVOIR_KEY);
      const ampFactor = 1 + reservoir / CS_RESERVOIR_SCALE;
      ctx.damage      = Math.max(1, Math.floor(player.attack * empMult * ampFactor));
      console.log(`[CapacitorShunt] ${player.id}: ${empMult}×base × ${ampFactor.toFixed(2)} (res=${Math.round(reservoir)}) → ${ctx.damage}`);
      return;
    }
  });

  // ── 3. onHit — normal hit handlers ────────────────────────────────────────
  // Skip empowered hits (flag still set). registerEmpoweredMultiplier fires after this.
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'energy') return;

    const state = world.playerCombatState.get(ctx.attacker.id);
    if (!state || isEmpoweredAttack(state)) return; // skip empowered hits

    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    if (!player) return;

    // Accumulator: flat damage bonus from active buff stacks.
    if (hasPassive(player, 'energy.accumulator')) {
      const buff = getStatusEffect(state, ACC_BUFF_FX);
      if (buff) ctx.damage += buff.stacks * ACC_FLAT_ATK_PER_STACK;
    }

    // Micro-Venting: consume energy for flat bonus while above the threshold.
    if (hasPassive(player, 'energy.micro-venting')) {
      if (getResourcePercent(state, ENERGY_KEY) > MV_THRESHOLD) {
        if (spendResource(state, ENERGY_KEY, MV_ENERGY_COST)) {
          ctx.damage += MV_FLAT_DAMAGE;
          console.log(`[MicroVenting] ${player.id}: vent → +${MV_FLAT_DAMAGE} dmg`);
        }
      }
    }

    // Polarity Decay: consume one overcharge stack for flat bonus.
    if (hasPassive(player, 'energy.polarity-decay')) {
      const oc = getStatusEffect(state, PD_OVERCHARGE_FX);
      if (oc && oc.stacks > 0) {
        ctx.damage += PD_STACK_FLAT_DMG;
        oc.stacks   = Math.max(0, oc.stacks - 1);
        if (oc.stacks === 0) removeStatusEffect(state, PD_OVERCHARGE_FX);
        console.log(`[PolarityDecay] ${player.id}: 1 overcharge consumed → +${PD_STACK_FLAT_DMG} dmg`);
      }
    }

    // Alternating Currents: bonus damage during charge phase.
    if (hasPassive(player, 'energy.alternating-currents') && getFlag(state, AC_CHARGE_FLAG)) {
      ctx.damage = Math.round(ctx.damage * AC_CHARGE_DMG_MULT);
    }

    // Harmonic Equilibrium: bonus while energy is strictly 40–60%.
    if (hasPassive(player, 'energy.harmonic-equilibrium')) {
      const pct = getResourcePercent(state, ENERGY_KEY);
      if (pct > HE_LOW_THRESHOLD && pct < HE_HIGH_THRESHOLD) {
        ctx.damage = Math.round(ctx.damage * HE_DMG_MULT);
      }
    }

    // Cascading Induction: near-zero damage + plant induction tag.
    if (hasPassive(player, 'energy.cascading-induction') && ctx.defenderType === 'monster') {
      ctx.damage = 1;
      const monsterState = world.monsterCombatState.get(ctx.defender.id);
      if (monsterState) {
        applyStatusEffect(monsterState, {
          id: CI_TAG_FX, instanced: false,
          remainingMs: CI_TAG_MS, refreshable: true,
          sourceId: player.id, data: {},
        });
        console.log(`[CascadeInduct] ${player.id}: tag planted → ${getTotalStacks(monsterState, CI_TAG_FX)} on ${ctx.defender.id}`);
      }
    }

    // Superconducting Mass: zero damage; accumulate raw attack into charge pool.
    if (hasPassive(player, 'energy.superconducting-mass')) {
      ctx.damage = 0;
      setResource(state, SM_CHARGE_KEY, getResource(state, SM_CHARGE_KEY) + player.attack);
      console.log(`[SuperconductM] ${player.id}: +${player.attack} stored (pool=${getResource(state, SM_CHARGE_KEY)})`);
    }
  });

  // ── 4. afterHit — custom energy gain for T3 mechanics ─────────────────────
  // Fires BEFORE the base energyPrototype afterHit (which is registered after this).
  // Sets ctx.metadata['energyHandled'] so the base handler skips.
  registerCombatListener('afterHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'energy') return;
    if (ctx.metadata['empoweredAttack']) return; // empowered hits never generate energy

    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    if (!player) return;
    const state = world.playerCombatState.get(ctx.attacker.id);
    if (!state) return;

    const baseGain = Math.round(player.passives['energy.per-hit'] ?? 14);

    // Accumulator: gain energy (capped, no discharge); grant one buff stack per hit.
    if (hasPassive(player, 'energy.accumulator')) {
      if (state.resourceMaxes[ENERGY_KEY] === undefined) setMaxResource(state, ENERGY_KEY, ENERGY_MAX);
      setResource(state, ENERGY_KEY, Math.min(getResource(state, ENERGY_KEY) + baseGain, ENERGY_MAX));
      const existing = getStatusEffect(state, ACC_BUFF_FX);
      if (!existing || existing.stacks < ACC_MAX_STACKS) {
        applyStatusEffect(state, {
          id: ACC_BUFF_FX, instanced: false, maxStacks: ACC_MAX_STACKS,
          remainingMs: -1, refreshable: false, sourceId: player.id, data: {},
        });
      }
      ctx.metadata['energyHandled'] = true;
      return;
    }

    // Micro-Venting: gain energy (capped, no discharge).
    if (hasPassive(player, 'energy.micro-venting')) {
      if (state.resourceMaxes[ENERGY_KEY] === undefined) setMaxResource(state, ENERGY_KEY, ENERGY_MAX);
      setResource(state, ENERGY_KEY, Math.min(getResource(state, ENERGY_KEY) + baseGain, ENERGY_MAX));
      ctx.metadata['energyHandled'] = true;
      return;
    }

    // Alternating Currents: doubled gain in charge phase; no gain in discharge phase.
    if (hasPassive(player, 'energy.alternating-currents')) {
      if (state.resourceMaxes[ENERGY_KEY] === undefined) {
        setMaxResource(state, ENERGY_KEY, ENERGY_MAX);
        setFlag(state, AC_CHARGE_FLAG, true); // always start in charge phase
      }
      if (getFlag(state, AC_CHARGE_FLAG)) {
        const gain      = Math.round(baseGain * AC_ENERGY_GAIN_MULT);
        const newEnergy = Math.min(getResource(state, ENERGY_KEY) + gain, ENERGY_MAX);
        setResource(state, ENERGY_KEY, newEnergy);
        if (newEnergy >= ENERGY_MAX) {
          resetResource(state, ENERGY_KEY);
          setFlag(state, AC_CHARGE_FLAG, false);
          // Apply attack speed boost
          if (!getFlag(state, AC_SPEED_ACTIVE)) {
            setResource(state, AC_SPEED_BASE_KEY, player.attackCooldown);
            player.attackCooldown = Math.max(200, Math.round(player.attackCooldown * AC_SPEED_FACTOR));
            setFlag(state, AC_SPEED_ACTIVE, true);
          }
          setResource(state, AC_DISCHARGE_MS_KEY, AC_DISCHARGE_TOTAL_MS);
          setResource(state, AC_TICK_NEXT_KEY, AC_TICK_INTERVAL_MS);
          console.log(`[AltCurrents] ${player.id}: charge → discharge (speed boosted)`);
        }
      }
      ctx.metadata['energyHandled'] = true;
      return;
    }

    // Capacitor Shunt: split gain 50/50 between active bar and reservoir.
    if (hasPassive(player, 'energy.capacitor-shunt')) {
      if (state.resourceMaxes[ENERGY_KEY] === undefined) setMaxResource(state, ENERGY_KEY, ENERGY_MAX);
      const activeGain    = Math.round(baseGain * CS_SPLIT_RATIO);
      const reservoirGain = Math.round(baseGain * CS_SPLIT_RATIO);
      gainResource(state, ENERGY_KEY, activeGain);
      const reservoir = Math.min(getResource(state, CS_RESERVOIR_KEY) + reservoirGain, CS_RESERVOIR_MAX);
      setResource(state, CS_RESERVOIR_KEY, reservoir);
      if (isResourceFull(state, ENERGY_KEY)) {
        resetResource(state, ENERGY_KEY);
        setEmpoweredAttack(state);
        console.log(`[CapacitorShunt] ${player.id}: discharge armed (reservoir=${Math.round(reservoir)})`);
      }
      ctx.metadata['energyHandled'] = true;
      return;
    }

    // Singularity Execute: doubled max; gain accelerates as pool fills.
    if (hasPassive(player, 'energy.singularity-execute')) {
      if (!getFlag(state, SE_INITIALIZED)) {
        setMaxResource(state, ENERGY_KEY, SE_ENERGY_MAX);
        setFlag(state, SE_INITIALIZED, true);
      }
      const fillPct    = getResourcePercent(state, ENERGY_KEY);
      const scaledGain = Math.round(baseGain * (1 + fillPct * SE_ACCEL_SCALE));
      gainResource(state, ENERGY_KEY, scaledGain);
      if (isResourceFull(state, ENERGY_KEY)) {
        resetResource(state, ENERGY_KEY);
        setEmpoweredAttack(state);
        console.log(`[SingularityExec] ${player.id}: max energy (${SE_ENERGY_MAX}) — discharge armed`);
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
  for (const player of world.players.values()) {
    if (player.combatArchetype !== 'energy') continue;
    if (!hasPassive(player, 'energy.accumulator')) continue;

    const state = world.playerCombatState.get(player.id);
    if (!state || state.resourceMaxes[ENERGY_KEY] === undefined) continue;

    const stacks      = getStatusEffect(state, ACC_BUFF_FX)?.stacks ?? 0;
    const drainPerSec = ACC_BASE_DRAIN_PER_SEC + stacks * ACC_DRAIN_PER_STACK;
    const newEnergy   = Math.max(0, getResource(state, ENERGY_KEY) - drainPerSec * (dt / 1000));
    setResource(state, ENERGY_KEY, newEnergy);

    if (newEnergy === 0 && stacks > 0) {
      removeStatusEffect(state, ACC_BUFF_FX);
      console.log(`[Accumulator] ${player.id}: energy drained to 0 — ${stacks} stacks cleared`);
    }
  }
}

// ── Alternating Currents: discharge phase tick ────────────────────────────────

function updateAlternatingCurrents(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const player of world.players.values()) {
    if (player.combatArchetype !== 'energy') continue;
    if (!hasPassive(player, 'energy.alternating-currents')) continue;

    const state = world.playerCombatState.get(player.id);
    if (!state) continue;

    // Nothing to do during charge phase or before first hit
    const dischargeMs = getResource(state, AC_DISCHARGE_MS_KEY);
    if (dischargeMs <= 0) continue;

    const newMs = Math.max(0, dischargeMs - dt);
    setResource(state, AC_DISCHARGE_MS_KEY, newMs);

    // Drain energy proportionally over the discharge duration
    setResource(state, ENERGY_KEY, Math.max(0,
      getResource(state, ENERGY_KEY) - ENERGY_MAX * (dt / AC_DISCHARGE_TOTAL_MS),
    ));

    // Tick damage on the player's current attack target
    const tickNext = getResource(state, AC_TICK_NEXT_KEY) - dt;
    if (tickNext <= 0) {
      setResource(state, AC_TICK_NEXT_KEY, tickNext + AC_TICK_INTERVAL_MS);
      const targetId = player.attackTargetId;
      if (targetId) {
        const monster = world.monsters.get(targetId);
        if (monster && monster.nodeId === player.nodeId) {
          const tickDmg = Math.max(1, Math.round(player.attack * AC_TICK_DAMAGE_MULT));
          monster.hp   -= tickDmg;
          console.log(`[AltCurrents] ${player.id}: ${tickDmg} discharge tick on ${targetId}, hp=${Math.max(0, monster.hp)}`);
          if (monster.hp <= 0) toKill.push({ monsterId: targetId, sourceId: player.id });
        }
      }
    } else {
      setResource(state, AC_TICK_NEXT_KEY, tickNext);
    }

    // End discharge phase when timer expires
    if (newMs <= 0) endACDischarge(player, state);
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.monsters.get(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.monsters.delete(monsterId);
    world.monsterAI.delete(monsterId);
    world.monsterCombatState.delete(monsterId);
  }
}

// ── buffSync helpers ──────────────────────────────────────────────────────────

export function getAccumulatorStacks(state: CombatState): number {
  return getStatusEffect(state, ACC_BUFF_FX)?.stacks ?? 0;
}

export function getOverchargeStacks(state: CombatState): number {
  return getStatusEffect(state, PD_OVERCHARGE_FX)?.stacks ?? 0;
}

export function getACPhase(state: CombatState): 'charge' | 'discharge' | 'idle' {
  if (getResource(state, AC_DISCHARGE_MS_KEY) > 0) return 'discharge';
  if (getFlag(state, AC_CHARGE_FLAG)) return 'charge';
  return 'idle';
}

export function getACDischargePct(state: CombatState): number {
  const ms = getResource(state, AC_DISCHARGE_MS_KEY);
  if (ms <= 0) return 0;
  return Math.round(((AC_DISCHARGE_TOTAL_MS - ms) / AC_DISCHARGE_TOTAL_MS) * 100);
}

export function getCapacitorReservoirPct(state: CombatState): number {
  return Math.min(100, Math.round((getResource(state, CS_RESERVOIR_KEY) / CS_RESERVOIR_MAX) * 100));
}

export function getSMChargePool(state: CombatState): number {
  return Math.round(getResource(state, SM_CHARGE_KEY));
}
