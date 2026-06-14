import { getStatusEffect } from '@mmo-idle/shared';
import { defineBuff, type BuffDescriptor } from '../../../../../combat/buffs/descriptor';
import { getSnipeReady } from './selectors';
import {
  COVER_FIRE_EFFECT_ID,
  DEFAULT_HAIR_TRIGGER_PCT,
  DEFAULT_MOMENTUM_APS_PER_STACK,
  DEFAULT_MOMENTUM_RELOAD_REDUCTION,
  MOMENTUM_RELOAD_REDUCTION_FLOOR,
  DEFAULT_SNIPE_FULL_HP_MULT,
} from './constants';

export const RELOAD_T3_BUFFS = [
  defineBuff('reload-snipe-ready', ({ player, world }) => {
    if (player.usesSkills.combatArchetype !== 'reload') return null;
    const fullHpMult = player.usesSkills.passives['reload.snipe-fullhp-mult'] ?? DEFAULT_SNIPE_FULL_HP_MULT;
    return getSnipeReady(player, world)
      ? { id: 'reload-snipe-ready', label: 'Snipe', stacks: 1, durationPct: -1, color: '#ffcc88', logDetail: `${fullHpMult}x damage vs full HP targets` }
      : null;
  }, { category: 'neutral', shape: 'square' }),

  defineBuff('reload-hair-trigger', ({ player }) => {
    if ((player.usesSkills.passives['reload.hair-trigger'] ?? 0) <= 0) return null;
    const stacks = player.usesReload?.clipSpeedStacks ?? 0;
    if (stacks <= 0) return null;
    const pct = player.usesSkills.passives['reload.hair-trigger-pct-per-shot'] ?? DEFAULT_HAIR_TRIGGER_PCT;
    return {
      id: 'reload-hair-trigger',
      label: 'Rev',
      stacks,
      durationPct: -1,
      color: '#ffaa44',
      logDetail: `+${Math.round(stacks * pct * 100)}% attack speed`,
    };
  }, { category: 'neutral', shape: 'square' }),

  defineBuff('reload-momentum', ({ player }) => {
    if ((player.usesSkills.passives['reload.momentum'] ?? 0) <= 0) return null;
    const stacks = player.usesReload?.momentumStacks ?? 0;
    if (stacks <= 0) return null;
    const apsPct = player.usesSkills.passives['reload.momentum-aps-per-stack'] ?? DEFAULT_MOMENTUM_APS_PER_STACK;
    const reloadPer = player.usesSkills.passives['reload.momentum-reload-reduction'] ?? DEFAULT_MOMENTUM_RELOAD_REDUCTION;
    const reloadCut = Math.round((1 - Math.max(MOMENTUM_RELOAD_REDUCTION_FLOOR, 1 - stacks * reloadPer)) * 100);
    return {
      id: 'reload-momentum',
      label: 'Streak',
      stacks,
      durationPct: -1,
      color: '#ffcc44',
      logDetail: `+${Math.round(stacks * apsPct * 100)}% attack speed, -${reloadCut}% reload time`,
    };
  }, { category: 'neutral', shape: 'square' }),

  defineBuff('reload-cannon', ({ player }) => {
    if ((player.usesSkills.passives['reload.cannon'] ?? 0) <= 0) return null;
    const stored = player.usesReload?.cannonStored ?? 0;
    if (stored <= 0) return null;
    // Stack badge doubles as the stored burst damage waiting to fire on reload.
    return {
      id: 'reload-cannon',
      label: 'Cannon',
      stacks: stored,
      durationPct: -1,
      color: '#ff7733',
      logDetail: `${stored} stored — fires mid-reload`,
    };
  }, { category: 'neutral', shape: 'square' }),

  defineBuff('reload-cover-fire', ({ player }) => {
    if ((player.usesSkills.passives['reload.cover-fire'] ?? 0) <= 0) return null;
    const buff = getStatusEffect(player.tracksCombat, COVER_FIRE_EFFECT_ID);
    if (!buff || buff.remainingMs <= 0) return null;
    const totalMs = buff.data['totalMs'] ?? buff.remainingMs;
    const pct = totalMs > 0
      ? Math.round((buff.remainingMs / totalMs) * 100)
      : 0;
    return {
      id: 'reload-cover-fire',
      label: 'Cover',
      stacks: 1,
      durationPct: pct,
      color: '#88aacc',
      logDetail: 'Damage reduction while reloading',
    };
  }, { category: 'neutral', shape: 'square' }),
] as const satisfies readonly BuffDescriptor[];
