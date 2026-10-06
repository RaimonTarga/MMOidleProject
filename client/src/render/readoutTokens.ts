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

/** The HUD readouts (DOM): the boss frame, the target frame's bar, the vitals. */
export type ReadoutBarSize = 'boss' | 'target' | 'vitals' | 'strip';

export const FRAME_TOKENS = {
  /** One bar module, every DOM use: height and inside-number size by use. */
  bar: {
    height: { boss: 16, target: 14, vitals: 12, strip: 10 } satisfies Record<ReadoutBarSize, number>,
    numberPx: { boss: 11, target: 10, vitals: 10, strip: 8 } satisfies Record<ReadoutBarSize, number>,
    trough: 'rgba(0, 0, 0, 0.55)',
    edge: 'rgba(255, 255, 255, 0.14)',
    number: '#ffffff',
    /** The fill smooths the 5 Hz broadcast; the chip does the rest. */
    fillMs: 180,
    /** A shell narrower than this share of the bar still shows a sliver. */
    absorbMinShare: 0.04,
  },
  /**
   * The boss bar's quarter markers (the Kill chain's four firings, future-plans): the
   * boundaries already LOST are lit, the next one is white, so the third lit pip says
   * the fourth firing is next.
   */
  quarter: {
    lost: '#f0c35a',
    next: '#ffffff',
    tick: 'rgba(0, 0, 0, 0.6)',
    lostTrough: 'rgba(240, 195, 90, 0.13)',
    pipEmpty: '#6d6553',
    tickPx: 2,
  },
  /** The boss's cast / telegraph line. */
  cast: {
    fill: '#ff8f6b',
    trough: 'rgba(255, 143, 107, 0.18)',
    label: '#ffb6a0',
    /** Its next hit is empowered (the server's `primed` mirror). Not gold: gold is the player's crit. */
    primed: '#ff5a3c',
    /** Keep a finished cast up this long waiting for its cast-end. */
    graceMs: 250,
  },
  boss: {
    edge: 'rgba(200, 70, 70, 0.5)',
    shadow: 'rgba(120, 20, 20, 0.45)',
    tag: '#ff8a8a',
    tagBg: 'rgba(180, 30, 30, 0.25)',
    /** Desktop frame: width and the fixed height the target frame steps under. */
    width: 440,
    heightPx: 70,
    /** Phone: the top strip's row, the ring row's height. */
    rowPx: 26,
  },
  /** The elite mark: the overhead outline's yellow (render/monsters.ts ELITE_OUTLINE). */
  elite: { tag: '#ffdd33', edge: 'rgba(255, 221, 51, 0.4)' },
  portrait: { px: 38, phonePx: 26, bg: '#11161d' },
  /** Low health on the vitals: a steady edge glow at a quarter. No flash, no pulse. */
  lowHealth: { at: 0.25, glow: '#ff2a2a', glowPx: 8 },
  /** Frames stay up this long after their subject clears, faded. */
  linger: { ms: 800, staleOpacity: 0.55 },
};

/**
 * The tokens as CSS custom properties, set on each readout's root so its stylesheet
 * draws from the same source as the Phaser bars.
 */
export function readoutCssVars(): Record<string, string> {
  const f = FRAME_TOKENS;
  const sizes: Record<string, string> = {};
  for (const [size, px] of Object.entries(f.bar.height)) sizes[`--ro-h-${size}`] = `${px}px`;
  for (const [size, px] of Object.entries(f.bar.numberPx)) sizes[`--ro-num-${size}`] = `${px}px`;
  return {
    ...sizes,
    '--ro-trough': f.bar.trough,
    '--ro-edge': f.bar.edge,
    '--ro-number': f.bar.number,
    '--ro-fill-ms': `${f.bar.fillMs}ms`,
    '--ro-chip': BAR_TOKENS.color.chip,
    '--ro-chip-alpha': String(BAR_TOKENS.alpha.chip),
    '--ro-absorb': BAR_TOKENS.color.absorbEnemy,
    '--ro-q-lost': f.quarter.lost,
    '--ro-q-next': f.quarter.next,
    '--ro-q-tick': f.quarter.tick,
    '--ro-q-trough': f.quarter.lostTrough,
    '--ro-q-pip-empty': f.quarter.pipEmpty,
    '--ro-q-tick-px': `${f.quarter.tickPx}px`,
    '--ro-segment': BAR_TOKENS.color.segment,
    '--ro-cast-fill': f.cast.fill,
    '--ro-cast-trough': f.cast.trough,
    '--ro-cast-label': f.cast.label,
    '--ro-cast-primed': f.cast.primed,
    '--ro-boss-edge': f.boss.edge,
    '--ro-boss-shadow': f.boss.shadow,
    '--ro-boss-tag': f.boss.tag,
    '--ro-boss-tag-bg': f.boss.tagBg,
    '--ro-boss-width': `${f.boss.width}px`,
    '--ro-boss-h': `${f.boss.heightPx}px`,
    '--ro-boss-row': `${f.boss.rowPx}px`,
    '--ro-elite-tag': f.elite.tag,
    '--ro-elite-edge': f.elite.edge,
    '--ro-portrait-bg': f.portrait.bg,
    '--ro-low-glow': f.lowHealth.glow,
    '--ro-low-glow-px': `${f.lowHealth.glowPx}px`,
    '--ro-stale': String(f.linger.staleOpacity),
  };
}
