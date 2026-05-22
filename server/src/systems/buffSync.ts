import type { PlayerBuff } from '@mmo-idle/shared';
import { getCounter, getResource } from './combatState';
import { getTotalStacks } from './statusEffects';
import { getDefenseAbsorbPool, getDefenseBurstPool, getDefenseDebtPool } from './defenseSystems';
import {
  getOverdrivePct,
  getEternalChargeStacks,
  getTemporalExtPct,
  getBatteryStacks,
  getAlignmentPct,
} from './cooldownT3';
import {
  getAccumulatorStacks,
  getOverchargeStacks,
  getACPhase,
  getACDischargePct,
  getCapacitorReservoirPct,
  getSMChargePool,
} from './energyT3';
import {
  getTargetChillStacks,
  isTargetFrozen,
  getTargetFrozenPct,
  getConflagrationPct,
  isConflagrationActive,
} from './dotT3';
import type { World } from '../world/World';

// Must match the key used in cadencePrototype.ts
const CADENCE_ECHO_KEY = 'cadenceEcho';

/**
 * Run once per world tick (after all combat systems) to populate
 * player.activeBuffs from current player state and server-side CombatState.
 *
 * Add new buffs here as they are implemented — the client renders the array
 * as-is without knowing about specific mechanics.
 */
export function syncPlayerBuffs(world: World): void {
  for (const player of world.players.values()) {
    const buffs: PlayerBuff[] = [];
    const cs = world.playerCombatState.get(player.id);

    // ── Accelerando (cadence-light-t3-a) ──────────────────────────────────────
    // Stacking attack speed from cadence finishers. Permanent until death/re-equip.
    if (player.cadenceSpeedStacks > 0) {
      buffs.push({
        id:          'cadence-accelerando',
        label:       'Accel',
        stacks:      player.cadenceSpeedStacks,
        durationPct: -1,
        color:       '#00ffaa',
      });
    }

    // ── Sacred Cross burst (weapon effect) ────────────────────────────────────
    // Active during the Sacred Cross 3× damage window. sacredBuffPct doubles as
    // the duration remaining (100 = just started, 0 = expired).
    if (player.sacredBuffActive) {
      buffs.push({
        id:          'sacred-burst',
        label:       'Burst',
        stacks:      1,
        durationPct: player.sacredBuffPct,
        color:       '#ffdd44',
      });
    }

    // ── Rising Tide echo (cadence-balanced-t3-b) ──────────────────────────────
    // Post-finisher echo: next N attacks deal +50% damage. Shown as a stack count.
    if (cs) {
      const echo = getCounter(cs, CADENCE_ECHO_KEY);
      if (echo > 0) {
        buffs.push({
          id:          'cadence-echo',
          label:       'Echo',
          stacks:      echo,
          durationPct: -1,
          color:       '#4488ff',
        });
      }
    }

    // ── Cooldown T3: Overdrive (cooldown-light-T3-a) ──────────────────────────
    if (cs) {
      const pct = getOverdrivePct(cs);
      if (pct > 0) {
        buffs.push({ id: 'cooldown-overdrive', label: 'Ovrdv', stacks: 1, durationPct: pct, color: '#ff6622' });
      }
    }

    // ── Cooldown T3: Eternal Cycle charge (cooldown-light-T3-b) ───────────────
    if (cs) {
      const stacks = getEternalChargeStacks(cs);
      if (stacks > 0) {
        buffs.push({ id: 'cooldown-eternal-charge', label: 'Chrge', stacks, durationPct: -1, color: '#ffaa00' });
      }
    }

    // ── Cooldown T3: Temporal Extension buff (cooldown-light-T3-c) ────────────
    if (cs) {
      const pct = getTemporalExtPct(cs);
      if (pct > 0) {
        buffs.push({ id: 'cooldown-temporal-ext', label: 'Xtend', stacks: 1, durationPct: pct, color: '#44ddff' });
      }
    }

    // ── Cooldown T3: Battery charge (cooldown-balanced-T3-b) ─────────────────
    if (cs) {
      const stacks = getBatteryStacks(cs);
      if (stacks > 0) {
        buffs.push({ id: 'cooldown-battery', label: 'Batry', stacks, durationPct: -1, color: '#aaffaa' });
      }
    }

    // ── Cooldown T3: Alignment speed buff (cooldown-balanced-T3-c) ───────────
    if (cs) {
      const pct = getAlignmentPct(cs);
      if (pct > 0) {
        buffs.push({ id: 'cooldown-alignment', label: 'Algn', stacks: 1, durationPct: pct, color: '#cc44ff' });
      }
    }

    // ── Cooldown T3: Channeled Beam ───────────────────────────────────────────
    if (player.isChanneling) {
      buffs.push({
        id:          'cooldown-channel',
        label:       'Beam',
        stacks:      1,
        durationPct: player.channelingPct,
        color:       '#ff44aa',
      });
    }

    // ── Energy T3: Accumulator stacks ─────────────────────────────────────────
    if (cs && player.combatArchetype === 'energy') {
      const accStacks = getAccumulatorStacks(cs);
      if (accStacks > 0) {
        buffs.push({ id: 'energy-acc', label: 'Surge', stacks: accStacks, durationPct: -1, color: '#ffdd44' });
      }

      // Polarity Decay: overcharge stacks
      const ocStacks = getOverchargeStacks(cs);
      if (ocStacks > 0) {
        buffs.push({ id: 'energy-overcharge', label: 'Overch', stacks: ocStacks, durationPct: -1, color: '#ff88ff' });
      }

      // Alternating Currents: phase indicator
      const acPhase = getACPhase(cs);
      if (acPhase === 'charge') {
        buffs.push({ id: 'energy-ac-charge', label: 'Chrge', stacks: 1, durationPct: -1, color: '#44ccff' });
      } else if (acPhase === 'discharge') {
        const pct = getACDischargePct(cs);
        buffs.push({ id: 'energy-ac-discharge', label: 'Disch', stacks: 1, durationPct: pct, color: '#ff6622' });
      }

      // Capacitor Shunt: reservoir fill
      const resPct = getCapacitorReservoirPct(cs);
      if (resPct > 0) {
        buffs.push({ id: 'energy-reservoir', label: 'Resvr', stacks: 1, durationPct: resPct, color: '#88ddff' });
      }

      // Harmonic Equilibrium: active indicator when in 40–60% energy band
      if ((player.passives['energy.harmonic-equilibrium'] ?? 0) > 0) {
        const pct = player.energyCount / 100;
        if (pct > 0.40 && pct < 0.60) {
          buffs.push({ id: 'energy-equilibrium', label: 'Equil', stacks: 1, durationPct: -1, color: '#aaffcc' });
        }
      }

      // Superconducting Mass: charge pool (raw attack accumulated between discharges)
      if ((player.passives['energy.superconducting-mass'] ?? 0) > 0) {
        const pool = getSMChargePool(cs);
        if (pool > 0) {
          buffs.push({ id: 'energy-sm-pool', label: 'Chrge', stacks: pool, durationPct: -1, color: '#ff4488' });
        }
      }
    }

    // ── DoT T3 buffs ──────────────────────────────────────────────────────────
    if (player.combatArchetype === 'dot') {
      const targetCs = player.attackTargetId
        ? world.monsterCombatState.get(player.attackTargetId)
        : undefined;

      // Invigorating Toxins: attack buff from target's poison stacks
      if ((player.passives['dot.invigorating-toxins'] ?? 0) > 0 && targetCs) {
        const stacks = player.targetDotStacks;
        if (stacks > 0) {
          buffs.push({ id: 'dot-vigor', label: 'Vigor', stacks, durationPct: -1, color: '#88ff44' });
        }
      }

      // Fan the Flames: show current burn stacks toward max
      // (Covered by the standard targetDotStacks HUD bar — no extra buff needed.)

      // Conflagration: show while active on target
      if ((player.passives['dot.conflagration'] ?? 0) > 0 && targetCs && isConflagrationActive(targetCs)) {
        buffs.push({ id: 'dot-conflag', label: 'Cflag', stacks: 1, durationPct: getConflagrationPct(targetCs), color: '#ff6600' });
      }

      // Freezing Cold: show chill stacks and frozen state
      if ((player.passives['dot.freezing-cold'] ?? 0) > 0 && targetCs) {
        const chillStacks = getTargetChillStacks(targetCs);
        if (chillStacks > 0) {
          buffs.push({ id: 'dot-chill', label: 'Chll', stacks: chillStacks, durationPct: -1, color: '#88ddff' });
        }
        if (isTargetFrozen(targetCs)) {
          buffs.push({ id: 'dot-frozen', label: 'Frzn', stacks: 1, durationPct: getTargetFrozenPct(targetCs), color: '#ffffff' });
        }
      }

      // Glacial Fracture: show current frost stacks building toward shatter
      // (Covered by targetDotStacks HUD bar — no extra buff entry needed.)
    }

    // ── Defensive system pools ─────────────────────────────────────────────────
    if (cs) {
      // Life leech HoT: healing incoming from damage taken
      if (getDefenseAbsorbPool(cs) > 0) {
        buffs.push({ id: 'defense-absorb', label: 'Absrb', stacks: 1, durationPct: -1, color: '#ff88aa' });
      }

      // Regen burst: periodic healing pool draining in
      if (getDefenseBurstPool(cs) > 0) {
        buffs.push({ id: 'defense-burst', label: 'Burst', stacks: 1, durationPct: -1, color: '#aaffaa' });
      }

      // Damage debt: delayed damage coming in (shown as a debuff-style indicator)
      if (getDefenseDebtPool(cs) > 0) {
        buffs.push({ id: 'defense-debt', label: 'Debt', stacks: 1, durationPct: -1, color: '#ff4444' });
      }
    }

    player.activeBuffs = buffs;
  }
}
