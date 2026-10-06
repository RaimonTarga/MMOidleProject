import type { DamageElement } from '@mmo-idle/shared';
import type { DamageNumberHint } from './state';
import type { DamageNumberStyle } from '../fx/particles';
import { NUMBER_TOKENS, type NumberBand, type NumberMotion } from './readoutTokens';
import { bandSizePx, minBand, numberBandFor, shiftBand } from './readoutModel';

/**
 * Per-element damage-number flavor (color + glyph), resolved per damage instance.
 * The fx tint from these colours too (`fx/elementTint.ts`, `fx/contagion.ts`); the
 * NUMBERS draw from `NUMBER_TOKENS.element`, which lifts the bleed red for legibility.
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
 * matching the absorb colour on the bars. Spawned alongside (not instead of) the
 * HP-damage number, so a fully absorbed hit still produces a visible number.
 */
export const SHIELD_DAMAGE_COLOR = NUMBER_TOKENS.color.shield;
export const SHIELD_DAMAGE_SYMBOL = NUMBER_TOKENS.glyph.shield;

/** Shared by the tinted damage number and the GRAZE floater beside it. */
export const PARTIAL_EVADE_COLOR = NUMBER_TOKENS.color.graze;

/**
 * What a number's size is measured against: the hit's amount and the target's max
 * HP. Absent, the number draws at the unknown-share band.
 */
export interface DamageNumberShare {
  amount: number;
  maxHp?: number;
}

function look(
  color: string,
  band: NumberBand,
  motion: NumberMotion,
  extra: Pick<DamageNumberStyle, 'suffix' | 'symbol'> = {},
): ResolvedDamageStyle {
  return { color, style: { sizePx: bandSizePx(band), band, motion, ...extra } };
}

function dotBand(band: NumberBand): NumberBand {
  return minBand(band, NUMBER_TOKENS.dotMaxBand);
}

/**
 * Shared mitigation styling, ahead of the crit/element/base tiers. Capped beats
 * partial-evade (a clamp is the more notable read, and capped hits are usually the
 * big empowered ones). Undefined when neither mitigation fired.
 */
function resolveMitigationStyle(
  hint: DamageNumberHint | undefined,
  band: NumberBand,
): ResolvedDamageStyle | undefined {
  if (hint?.capped) return look(NUMBER_TOKENS.color.capped, band, 'hit', { symbol: NUMBER_TOKENS.glyph.capped });
  if (hint?.evadedPartial) return look(NUMBER_TOKENS.color.graze, band, 'hit', { suffix: NUMBER_TOKENS.glyph.graze });
  return undefined;
}

/** A damage-over-time number: the element's colour and glyph, small and steady. */
function resolveDotStyle(hint: DamageNumberHint, band: NumberBand): ResolvedDamageStyle | undefined {
  if (hint.dotElement) {
    return look(NUMBER_TOKENS.element[hint.dotElement], hint.isDot ? dotBand(band) : band, hint.isDot ? 'dot' : 'hit', {
      symbol: ELEMENT_STYLE[hint.dotElement].symbol,
    });
  }
  if (hint.isDot) return look(NUMBER_TOKENS.color.dot, dotBand(band), 'dot', { symbol: NUMBER_TOKENS.glyph.untypedDot });
  return undefined;
}

/** Monster-facing: capped/glancing > empowered crit > element > unflavored DoT > white. */
export function resolveMonsterDamageStyle(
  hint: DamageNumberHint | undefined,
  share?: DamageNumberShare,
): ResolvedDamageStyle {
  const band = numberBandFor(share?.amount ?? 0, share ? share.maxHp : undefined);
  const mitigation = resolveMitigationStyle(hint, band);
  if (mitigation) return mitigation;
  if (hint?.empowered || hint?.execution) {
    // The crit look: one band up, '!', the body flash. An elemental crit keeps its
    // element's colour and glyph — the size and the flash say "crit", so gold stays
    // the one colour that means it. Only Detonate currently produces this pair (an
    // empowered `damage` event); a `player-hit` never carries `dotElement`.
    const crit = NUMBER_TOKENS.crit;
    return hint.dotElement
      ? look(NUMBER_TOKENS.element[hint.dotElement], shiftBand(band, crit.bandSteps), 'crit', {
          suffix: crit.suffix, symbol: ELEMENT_STYLE[hint.dotElement].symbol,
        })
      : look(crit.color, shiftBand(band, crit.bandSteps), 'crit', { suffix: crit.suffix });
  }
  // An explicit DoT entry carries its own hint, so adjacent direct hits cannot
  // overwrite its element. Unflavored direct hits retain their base color.
  if (hint) {
    const dot = resolveDotStyle(hint, band);
    if (dot) return dot;
  }
  return look(NUMBER_TOKENS.color.direct, band, 'hit');
}

/** Player-facing: mitigation/empowerment, then elemental DoT or incoming base color. */
export function resolvePlayerDamageStyle(
  hint: DamageNumberHint | undefined,
  baseColor: string,
  share?: DamageNumberShare,
): ResolvedDamageStyle {
  const band = numberBandFor(share?.amount ?? 0, share ? share.maxHp : undefined);
  const mitigation = resolveMitigationStyle(hint, band);
  if (mitigation) return mitigation;
  // Incoming "crit" (a monster's empowered hit): one band up and '!', but in the
  // damage-taken colour — it reads as a heavy hit, never as the player's own crit.
  if (hint?.empowered || hint?.execution) {
    return look(baseColor, shiftBand(band, NUMBER_TOKENS.crit.bandSteps), 'crit', { suffix: NUMBER_TOKENS.crit.suffix });
  }
  // Each event retains its own element, independently of adjacent direct hits.
  if (hint) {
    const dot = resolveDotStyle(hint, band);
    if (dot) return dot;
  }
  return look(baseColor, band, 'hit');
}

/** Absorbed damage: the shield colour and glyph, sized by its share of the pool. */
export function resolveShieldDamageStyle(share?: DamageNumberShare, isDot = false): ResolvedDamageStyle {
  const band = numberBandFor(share?.amount ?? 0, share ? share.maxHp : undefined);
  return look(SHIELD_DAMAGE_COLOR, isDot ? dotBand(band) : band, isDot ? 'dot' : 'hit', { symbol: SHIELD_DAMAGE_SYMBOL });
}
