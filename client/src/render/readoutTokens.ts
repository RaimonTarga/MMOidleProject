/**
 * The combat readout's tokens: every size, colour, duration and threshold the damage
 * numbers, bars and frames draw with. One module, so the later skin track (design
 * §26.4) can restyle the readout without touching its logic. Plain data only — the
 * rules that read it live in `readoutModel.ts`; the drawing lives in `combatText.ts`,
 * `fx/particles.ts` (`spawnDamageNumber`), `healthBars.ts` and the HUD frames.
 */
import type { DamageElement } from '@mmo-idle/shared';

export type NumberBand = 'chip' | 'hit' | 'heavy' | 'swing';
export type NumberMotion = 'hit' | 'crit' | 'dot';

export interface NumberBandToken {
  band: NumberBand;
  /** Smallest share of the target's max HP that draws at this band. */
  minShare: number;
  /** Font size in screen px at camera zoom 1. */
  sizePx: number;
}

export interface NumberMotionToken {
  /** Scale the number starts at, settling to 1 over `popMs` (1 = no pop). */
  popScale: number;
  popMs: number;
  /** Screen px risen over the whole life. */
  risePx: number;
  lifeMs: number;
  /** Phaser ease for the rise: a hit decelerates, a DoT tick rises steadily. */
  ease: 'Quad.easeOut' | 'Linear';
}

export const NUMBER_TOKENS = {
  /**
   * Numbers say share, not digits: a floater's size is the hit's share of the
   * target's max HP. Ascending; the last band whose `minShare` the hit reaches wins.
   */
  bands: [
    { band: 'chip', minShare: 0, sizePx: 12 },
    { band: 'hit', minShare: 0.04, sizePx: 15 },
    { band: 'heavy', minShare: 0.12, sizePx: 19 },
    { band: 'swing', minShare: 0.3, sizePx: 25 },
  ] as const satisfies readonly NumberBandToken[],
  /** A damage-over-time number never draws above this band: it rises small. */
  dotMaxBand: 'hit' as NumberBand,
  /** Size when the target's pool is unknown (its view already gone). */
  unknownShareBand: 'hit' as NumberBand,
  color: {
    /** An ordinary outgoing hit. */
    direct: '#ffffff',
    /** An untyped damage-over-time tick. */
    dot: '#c9a7eb',
    /** Damage absorbed by a barrier, ward or shell (matches the bars' absorb cyan). */
    shield: '#44ccdd',
    /** Damage taken by the local player. */
    takenOwn: '#ff4444',
    /** Damage taken by another player. */
    takenOther: '#ff8844',
    /** Damage taken by a summon. */
    takenMinion: '#ffd1d1',
    /** A hit the damage cap clamped. */
    capped: '#9aa6bf',
    /** A partly evaded (grazing) hit. */
    graze: '#bcd2ff',
    outline: '#000000',
  },
  /**
   * Element colours for NUMBERS. The fx keep their own (`ELEMENT_STYLE`), except that
   * the bleed red is lifted here: the fx's #c41e1e vanishes on a dark field as text.
   */
  element: {
    poison: '#5fd35f',
    fire: '#ff8c2b',
    frost: '#5fd0ff',
    lightning: '#c77dff',
    bleed: '#ec4b40',
    doom: '#9d4dff',
  } satisfies Record<DamageElement, string>,
  /**
   * The crit look is one look: an `empowered` (or execution) hit moves up the band
   * ladder, draws gold with a '!' and flashes the body. Nothing else is gold. An
   * elemental crit keeps its element's colour and takes only the size and the flash.
   */
  crit: {
    color: '#ffd23f',
    bandSteps: 1,
    suffix: '!',
    bodyFlashMs: 110,
    bodyFlashAlpha: 0.85,
  },
  glyph: {
    shield: '🛡',
    capped: '▼',
    graze: '~',
    untypedDot: '•',
  },
  motion: {
    hit: { popScale: 1.25, popMs: 90, risePx: 26, lifeMs: 850, ease: 'Quad.easeOut' },
    crit: { popScale: 1.6, popMs: 120, risePx: 30, lifeMs: 1050, ease: 'Quad.easeOut' },
    dot: { popScale: 1, popMs: 0, risePx: 18, lifeMs: 900, ease: 'Linear' },
  } satisfies Record<NumberMotion, NumberMotionToken>,
  /** The last share of a floater's life spent fading out. */
  fadeTail: 0.3,
  stroke: { px: 3 },
  /** Per-target lane stack: live floaters per target, newest at the base. */
  lane: { cap: 5, gapPx: 2, liftMs: 80 },
  /** Most floaters one delta may start, across every target. */
  batchCap: 120,
  /** DoT ticks on one target (per element) coalesce into one number per window. */
  dotWindowMs: 1000,
  /**
   * Phone camera floor: a floater keeps its SCREEN size (times this) instead of
   * shrinking with the camera, so it reads at the 0.4 zoom floor (design §26.4 open
   * item: the camera floor itself is not changed by the readout).
   */
  screenFloor: 0.85,
};

/** Body size classes the overhead bars are cut to. */
export type BodySizeClass = 'small' | 'medium' | 'large' | 'boss';

export const BAR_TOKENS = {
  /** Overhead bar width (world px) by body size class. */
  width: { small: 24, medium: 32, large: 44, boss: 72 } satisfies Record<BodySizeClass, number>,
  height: { small: 4, medium: 4, large: 4, boss: 5 } satisfies Record<BodySizeClass, number>,
  /** Minions and summons: a slimmer bar. */
  minion: { width: 24, height: 2 },
  /** Displayed body size (world px): below `small` is small, from `large` up is large. */
  sizeClassPx: { small: 60, large: 80 },
  /** Health colour by thirds: above `high` / above `mid` / below. */
  thirds: { high: 0.5, mid: 0.25 },
  color: {
    high: '#44ee44',
    mid: '#eeaa22',
    low: '#ee3322',
    trough: '#1a1a1a',
    outline: '#000000',
    /** The damage chip: the last hit, held for a beat and drained. */
    chip: '#fff1cf',
    /** A player's barrier and wards: one band riding the fill. */
    absorbPlayer: '#44ccdd',
    /** An enemy shell: its own band above the bar. */
    absorbEnemy: '#55d9f2',
    absorbEnemyTrough: '#102d38',
    segment: '#000000',
  },
  alpha: { outline: 0.75, chip: 0.9, absorbPlayer: 0.9, absorbEnemy: 0.95, segment: 0.7 },
  /**
   * The chip holds `holdMs` after a fresh hit, then drains in `drainMs`. A drop of at
   * least `reholdShare` of the pool (or any drop onto a caught-up chip) restarts the
   * hold; a smaller one while the chip is out (a DoT tick) only keeps it draining.
   */
  chip: { holdMs: 400, drainMs: 500, reholdShare: 0.04 },
  /** Elites and bosses: a thin segment at every quarter of the bar. */
  segmentEvery: 0.25,
  segmentPx: 1,
  /** The enemy shell band: height and gap above the bar (world px). */
  enemyShell: { height: 2, gap: 1 },
};
