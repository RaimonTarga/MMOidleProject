import { defineBuff, type BuffDescriptor } from '../../../../../combat/buffs/descriptor';
import {
  CADENCE_SPEED_PER_STACK_MS,
  MOMENTUM_ECHO_BONUS,
  RAMPAGE_MAX_STACKS,
  RAMPAGE_MULT_PER_STACK,
} from './constants';
import { crescendoMultiplier } from './crescendo';
import { playerMechanicBuffMagnitude } from '../../../../shared/applyPlayerMechanicBuff';

export const CADENCE_T3_BUFFS = [
  defineBuff(
    'cadence-accelerando',
    ({ player }) => {
      const stacks = player.usesCadence?.speedStacks ?? 0;
      return stacks > 0
        ? {
            id: 'cadence-accelerando',
            label: 'Accel',
            stacks,
            durationPct: -1,
            color: '#00ffaa',
            logDetail: `-${stacks * CADENCE_SPEED_PER_STACK_MS}ms attack cooldown`,
          }
        : null;
    },
    { label: 'Accel', color: '#00ffaa', category: 'cadence', shape: 'square' },
  ),
  defineBuff(
    'cadence-echo',
    ({ player }) => {
      const echo = player.usesCadence?.echo ?? 0;
      const echoBonus = playerMechanicBuffMagnitude(
        player,
        'cadence-echo',
        'damageBonus',
        player.usesSkills.passives['cadence.momentum-echo-bonus'] ?? MOMENTUM_ECHO_BONUS,
      );
      return echo > 0
        ? {
            id: 'cadence-echo',
            label: 'Echo',
            stacks: echo,
            durationPct: -1,
            color: '#4488ff',
            logDetail: `next ${echo} hits echo +${Math.round(echoBonus * 100)}% damage`,
          }
        : null;
    },
    { label: 'Echo', color: '#4488ff', category: 'cadence', shape: 'square' },
  ),
  defineBuff(
    'cadence-resonance',
    ({ player }) => {
      const stacks = player.usesCadence?.resonanceStacks ?? 0;
      const perHit = player.usesSkills.passives['cadence.momentum-buildup'] ?? 0;
      return stacks > 0
        ? {
            id: 'cadence-resonance',
            label: 'Reson',
            stacks,
            durationPct: -1,
            color: '#22ddcc',
            logDetail: `finisher +${Math.round(stacks * perHit * 100)}% damage`,
          }
        : null;
    },
    { label: 'Reson', color: '#22ddcc', category: 'cadence', shape: 'square' },
  ),
  defineBuff(
    'cadence-aftershock',
    ({ player }) => {
      const charges = player.usesCadence?.aftershockCharges ?? 0;
      return charges > 0
        ? {
            id: 'cadence-aftershock',
            label: 'Shock',
            stacks: charges,
            durationPct: -1,
            color: '#bb66ff',
            logDetail: `next ${charges} attacks fire on-hit twice`,
          }
        : null;
    },
    { label: 'Shock', color: '#bb66ff', category: 'cadence', shape: 'square' },
  ),
  defineBuff(
    'cadence-metronome',
    ({ player }) => {
      const stacks = player.usesCadence?.metronomeStacks ?? 0;
      const bonus = player.usesCadence?.metronomeBonus ?? 0;
      return stacks > 0
        ? {
            id: 'cadence-metronome',
            label: 'Metro',
            stacks,
            durationPct: -1,
            color: '#ffcc44',
            logDetail: `+${bonus} damage to next hits`,
          }
        : null;
    },
    { label: 'Metro', color: '#ffcc44', category: 'cadence', shape: 'square' },
  ),
  defineBuff(
    'cadence-rampage',
    ({ player }) => {
      const stacks = player.usesCadence?.rampageStacks ?? 0;
      if (stacks <= 0) return null;
      const maxStacks  = player.usesSkills.passives['cadence.rampage-max-stacks'] ?? RAMPAGE_MAX_STACKS;
      const multPerStk = player.usesSkills.passives['cadence.rampage-mult-per-stack'] ?? RAMPAGE_MULT_PER_STACK;
      const atCap = stacks >= maxStacks;
      return {
        id: 'cadence-rampage',
        label: 'Rage',
        stacks,
        durationPct: -1,
        // Flash brighter at the cap — the next finisher overloads and resets.
        color: atCap ? '#ffdd22' : '#ff3322',
        logDetail: atCap
          ? `MAX — next finisher overloads (resets)`
          : `+${Math.round(stacks * multPerStk * 100)}% finisher (${stacks}/${maxStacks})`,
      };
    },
    { label: 'Rage', color: '#ff3322', category: 'cadence', shape: 'square' },
  ),
  defineBuff(
    'cadence-crescendo',
    ({ player }) => {
      if ((player.usesSkills.passives['cadence.crescendo'] ?? 0) <= 0) return null;
      const ms = player.usesCadence?.crescendoTimerMs ?? 0;
      const mult = crescendoMultiplier(ms, player.usesSkills.passives);
      if (mult <= 0) return null;
      const pct = Math.round(mult * 100);
      return {
        id: 'cadence-crescendo',
        label: 'Cresc',
        // Stack badge doubles as the current finisher bonus % (infinite scaler).
        stacks: pct,
        durationPct: -1,
        color: '#ff8800',
        logDetail: `+${pct}% finisher damage`,
      };
    },
    { label: 'Cresc', color: '#ff8800', category: 'cadence', shape: 'square' },
  ),
  defineBuff(
    'cadence-verdict',
    ({ player }) => {
      const stored = player.usesCadence?.verdictStored ?? 0;
      if (stored <= 0) return null;
      return {
        id: 'cadence-verdict',
        label: 'Verdict',
        // Stack badge doubles as the banked execution-power readout. No timer —
        // the pool persists until a target drops within it and gets executed.
        stacks: Math.round(stored),
        durationPct: -1,
        color: '#ff5544',
        logDetail: `executes targets at or below ${Math.round(stored)} HP`,
      };
    },
    { label: 'Verdict', color: '#ff5544', category: 'cadence', shape: 'square' },
  ),
] as const satisfies readonly BuffDescriptor[];
