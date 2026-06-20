import type { DamageElement } from '@mmo-idle/shared';
import type { DamageNumberHint } from './state';
import {
  EMPOWERED_DAMAGE_COLOR,
  EMPOWERED_DAMAGE_SIZE_PX,
  type DamageNumberStyle,
} from '../fx/particles';

/**
 * Per-element damage-number flavor (color + glyph). `lightning` and `bleed` have no
 * DoT source wired yet — scaffolding so a future DoT of that element renders with no
 * further changes to the damage-number system.
 */
export const ELEMENT_STYLE: Record<DamageElement, { color: string; symbol: string }> = {
  poison: { color: '#5fd35f', symbol: '☠' },
  fire: { color: '#ff8c2b', symbol: '🔥' },
  frost: { color: '#5fd0ff', symbol: '❄' },
  lightning: { color: '#c77dff', symbol: '⚡' },
  bleed: { color: '#c41e1e', symbol: '🩸' }, // deep red, deeper than fire's orange
  doom: { color: '#9d4dff', symbol: '☠' },   // Cultist eternal-doom — purple death
};

export interface ResolvedDamageStyle {
  color: string;
  style?: DamageNumberStyle;
}

/**
 * Shield-absorbed damage flavor — a separate blue number with a shield glyph,
 * matching the shield segment color on the HP bar (healthBars.ts, 0x44ccdd).
 * Spawned alongside (not instead of) the HP-delta number, so a fully absorbed
 * hit still produces a visible number.
 */
export const SHIELD_DAMAGE_COLOR = '#44ccdd';
export const SHIELD_DAMAGE_SYMBOL = '🛡';

/** Damage-cap trip — desaturated slate with a "clamped" down-marker. */
const CAPPED_DAMAGE_COLOR = '#9aa6bf';
/** Partial evade (glancing blow) — pale blue with a "graze" tilde. */
const PARTIAL_EVADE_COLOR = '#bcd2ff';

/**
 * Shared mitigation styling applied to the HP-delta number, ahead of the
 * empowered/element/base tiers. Capped beats partial-evade (a clamp is the more
 * notable read, and capped hits are usually the big empowered ones). Returns
 * undefined when neither mitigation fired.
 */
function resolveMitigationStyle(
  hint: DamageNumberHint | undefined,
): ResolvedDamageStyle | undefined {
  if (hint?.capped) {
    return { color: CAPPED_DAMAGE_COLOR, style: { symbol: '▼' } };
  }
  if (hint?.evadedPartial) {
    return { color: PARTIAL_EVADE_COLOR, style: { suffix: '~' } };
  }
  return undefined;
}

/** Monster-facing: capped/glancing > empowered crit > direct hit (white) > elemental DoT > white. */
export function resolveMonsterDamageStyle(
  hint: DamageNumberHint | undefined,
): ResolvedDamageStyle {
  const mitigation = resolveMitigationStyle(hint);
  if (mitigation) return mitigation;
  if (hint?.empowered || hint?.execution) {
    return {
      color: EMPOWERED_DAMAGE_COLOR,
      style: { sizePx: EMPOWERED_DAMAGE_SIZE_PX, suffix: '!' },
    };
  }
  // Element tint only when the damage wasn't a direct hit this snapshot (a direct
  // hit landing in the same window takes precedence and stays white).
  if (!hint?.hasDirectHit && hint?.dotElement) {
    const e = ELEMENT_STYLE[hint.dotElement];
    return { color: e.color, style: { symbol: e.symbol } };
  }
  return { color: '#ffffff' };
}

/**
 * Player-facing: elemental DoT tint+glyph, else the base damage-taken color
 * (red for self / orange for others). Incoming damage has no empowered tier, and
 * there's no direct-hit event for monster→player attacks, so DoT element wins when
 * a tick lands this snapshot.
 */
export function resolvePlayerDamageStyle(
  hint: DamageNumberHint | undefined,
  baseColor: string,
): ResolvedDamageStyle {
  const mitigation = resolveMitigationStyle(hint);
  if (mitigation) return mitigation;
  // Incoming "crit" (future monster-empowered hit): enlarge + '!' but keep the
  // damage-taken color, so it reads as a heavy hit rather than an outgoing crit.
  // Tune the color/size here if you want a distinct incoming-crit look.
  if (hint?.empowered || hint?.execution) {
    return { color: baseColor, style: { sizePx: EMPOWERED_DAMAGE_SIZE_PX, suffix: '!' } };
  }
  // Element tint only when not a direct hit this snapshot (direct takes precedence).
  if (!hint?.hasDirectHit && hint?.dotElement) {
    const e = ELEMENT_STYLE[hint.dotElement];
    return { color: e.color, style: { symbol: e.symbol } };
  }
  return { color: baseColor };
}
