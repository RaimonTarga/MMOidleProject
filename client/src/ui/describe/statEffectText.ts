import type { StatEffects } from '@mmo-idle/shared';
import { STAT_HELP } from '../../hud/stat/statHelp';

/**
 * `StatEffects` as player-facing rows: full label, formatted value, and the same
 * explanatory copy the character sheet uses.
 *
 * Every surface that grants stat deltas — skill nodes, stances — renders through
 * this, so "+0.1 attackSpeedPct" is never what the player is asked to read.
 */

export interface StatEffectLine {
  key: keyof StatEffects;
  label: string;
  /** Signed, unit-carrying value, e.g. "+10%" or "-50 range". */
  value: string;
  /** Packed glyph frame for the stat, when one is authored. */
  glyph: string | null;
  help: string | undefined;
  /** False when the delta makes the character worse (drives the down styling). */
  good: boolean;
}

const signed = (n: number, digits = 0): string =>
  `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(digits)}`;

const signedPct = (n: number): string =>
  `${n >= 0 ? '+' : '−'}${Math.abs(Math.round(n * 1000) / 10)}%`;

interface StatEffectMeta {
  label: string;
  format: (value: number) => string;
  glyph: string | null;
  helpKey: string;
  /** Set for stats where a negative delta is the improvement. */
  lowerIsBetter?: boolean;
}

const STAT_EFFECT_META: Record<keyof StatEffects, StatEffectMeta> = {
  attack: {
    label: 'Attack',
    format: (v) => signed(v),
    glyph: 'UI_icons/stats/attack.png',
    helpKey: 'attack',
  },
  plating: {
    label: 'Plating',
    format: (v) => signed(v),
    glyph: 'UI_icons/stats/plating.png',
    helpKey: 'plating',
  },
  damageReduction: {
    label: 'Damage Reduction',
    format: signedPct,
    glyph: 'UI_icons/stats/reduction.png',
    helpKey: 'damageReduction',
  },
  evasion: {
    label: 'Evasion',
    format: signedPct,
    glyph: 'UI_icons/stats/evasion.png',
    helpKey: 'dodgeRate',
  },
  attackRange: {
    label: 'Attack Range',
    format: (v) => signed(v),
    glyph: 'UI_icons/stats/range.png',
    helpKey: 'attackRange',
  },
  attackSpeedPct: {
    label: 'Attack Speed',
    format: signedPct,
    glyph: 'UI_icons/stats/speed.png',
    helpKey: 'atkSpeed',
  },
  maxHp: {
    label: 'Max HP',
    format: (v) => signed(v),
    glyph: 'UI_icons/stats/shield.png',
    helpKey: 'hp',
  },
  hpRegen: {
    label: 'HP Regen',
    format: (v) => `${signed(v, 1)}/s`,
    glyph: 'UI_icons/stats/regen.png',
    helpKey: 'hpRegen',
  },
  speed: {
    label: 'Move Speed',
    format: (v) => signed(v),
    glyph: 'UI_icons/stats/speed.png',
    helpKey: 'speed',
  },
};

/** Canonical display order — offense, then defense, then utility. */
const STAT_EFFECT_ORDER: (keyof StatEffects)[] = [
  'attack',
  'attackSpeedPct',
  'attackRange',
  'maxHp',
  'plating',
  'damageReduction',
  'evasion',
  'hpRegen',
  'speed',
];

export function statEffectLines(effects: StatEffects | undefined): StatEffectLine[] {
  if (!effects) return [];
  const lines: StatEffectLine[] = [];
  for (const key of STAT_EFFECT_ORDER) {
    const value = effects[key];
    if (value === undefined || value === 0) continue;
    const meta = STAT_EFFECT_META[key];
    lines.push({
      key,
      label: meta.label,
      value: meta.format(value),
      glyph: meta.glyph,
      help: STAT_HELP[meta.helpKey],
      good: meta.lowerIsBetter ? value < 0 : value > 0,
    });
  }
  return lines;
}

/** The short chip form (glyph + signed number) used on dense node cards. */
export function statEffectChipValue(key: keyof StatEffects, value: number): string {
  return STAT_EFFECT_META[key].format(value);
}

export function statEffectGlyph(key: keyof StatEffects): string | null {
  return STAT_EFFECT_META[key]?.glyph ?? null;
}
