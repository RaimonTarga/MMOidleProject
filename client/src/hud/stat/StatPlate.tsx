import type { HTMLAttributes, ReactNode } from 'react';
import { GameIcon, atlasIcon } from '../../ui/GameIcon';
import { useHoverTooltip } from '../primitives/HelpTooltip';
import { useChangeFlash } from '../primitives/useChangeFlash';
import { GradientConduit, type ConduitRamp } from '../primitives/GradientConduit';
import './statPlate.css';

/**
 * Identity and health, folded into the top of the plate rather than stacked
 * above it as separate sections (§14.1). One apparatus: who you are, how much
 * of you is left, and what is about to change that.
 */
export interface PlateCrown {
  name: string;
  /** Current combat posture, kept visible even while details are collapsed. */
  stance: string;
  /** Connection status, rendered as the dot beside the name. */
  status: string;
  hp: number;
  maxHp: number;
  /**
   * The permanent barrier and its ceiling. Unlike a ward it has a known max, so it
   * gets its own conduit on its own scale rather than a variable-width band — an
   * empty barrier still shows the pool that is missing.
   */
  barrier: number;
  barrierMax: number;
  barrierRecharging: boolean;
  /** Total absorb across all temporary wards; drawn as a capping band. */
  ward: number;
  /** Damage already committed against current HP. */
  incomingDot: number;
  /** Regeneration/absorb owed, drawn past current HP. */
  pendingHeal: number;
  /** Hover-tooltip plumbing for the HP readout, owned by the caller. */
  hpTip?: { handlers: HTMLAttributes<HTMLElement>; node: ReactNode };
}

/** Health is the one bar whose colour carries meaning beyond its fill. */
function hpRamp(fraction: number): ConduitRamp {
  if (fraction > 0.5) return 'vital';
  if (fraction > 0.25) return 'caution';
  return 'critical';
}

function Crown({ crown }: { crown: PlateCrown }) {
  const max = Math.max(0, crown.maxHp);
  const pct = (value: number) => (max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0);

  const hpPct = pct(crown.hp);
  // Pending DoT eats the right edge of current HP rather than extending it, so
  // the bar shows what you will have, not what you have.
  const dotPct = Math.min(hpPct, pct(crown.incomingDot));
  const safePct = Math.max(0, hpPct - dotPct);
  const healPct = Math.min(100 - hpPct, pct(crown.pendingHeal));
  // The capping band on the HP track is the effective-HP read: everything that
  // absorbs before health does, measured against max HP like the other layers.
  const absorb = crown.barrier + crown.ward;
  const absorbPct = pct(absorb);
  const barrierFill = crown.barrierMax > 0 ? crown.barrier / crown.barrierMax : 0;

  return (
    <div className="stat-crown">
      <div className="stat-crown__identity">
        <span className="stat-crown__name">{crown.name}</span>
        <span className="stat-crown__state">
          <span className="stat-crown__stance" title={`Active stance: ${crown.stance}`}>
            {crown.stance}
          </span>
          <span className={`status-dot ${crown.status}`} title={crown.status} />
        </span>
      </div>

      <div className="stat-crown__readout" {...(crown.hpTip?.handlers ?? {})}>
        <span className="stat-crown__hp">
          {Math.ceil(crown.hp)}<span className="stat-crown__max"> / {crown.maxHp}</span>
        </span>
        {absorb > 0 && (
          <span className="stat-crown__shield" title="Absorbed before health">
            +{Math.ceil(absorb)}
          </span>
        )}
        {crown.hpTip?.node}
      </div>

      <GradientConduit
        className="stat-crown__track"
        fraction={safePct / 100}
        ramp={hpRamp(hpPct / 100)}
        height={9}
        label={`Health ${Math.ceil(crown.hp)} of ${crown.maxHp}`}
        valueText={absorb > 0
          ? `${Math.ceil(crown.hp)} of ${crown.maxHp}, plus ${Math.ceil(absorb)} absorbed`
          : `${Math.ceil(crown.hp)} of ${crown.maxHp}`}
        layers={
          <>
            {healPct > 0 && (
              <span
                className="stat-crown__layer stat-crown__layer--regen"
                style={{ left: `${hpPct}%`, width: `${healPct}%` }}
              />
            )}
            {dotPct > 0 && (
              <span
                className="stat-crown__layer stat-crown__layer--dot"
                style={{ left: `${safePct}%`, width: `${dotPct}%` }}
              />
            )}
            {absorbPct > 0 && (
              <span
                className="stat-crown__layer stat-crown__layer--shield"
                style={{ width: `${absorbPct}%` }}
              />
            )}
          </>
        }
      />

      {crown.barrierMax > 0 && (
        <GradientConduit
          className={`stat-crown__barrier${crown.barrierRecharging ? ' is-recharging' : ''}`}
          fraction={barrierFill}
          ramp="arcane"
          height={5}
          label="Barrier"
          valueText={crown.barrierRecharging
            ? `Barrier ${Math.ceil(crown.barrier)} of ${crown.barrierMax}, recharging`
            : `Barrier ${Math.ceil(crown.barrier)} of ${crown.barrierMax}`}
        />
      )}
    </div>
  );
}

/**
 * One reading on an instrument rail: a glyph and its number, nothing else.
 *
 * The glyph IS the label. §15's de-texting rule is explicit that captions inside
 * panels are the defect, and it commissioned this exact stat set for the purpose
 * — so the word under every value is not a shorter option, it is the thing being
 * removed. `name` keeps the readout accessible and hoverable without spending
 * the rail height that spelling it out would cost.
 */
export interface PlateReading {
  id: string;
  /** Frame in the UI atlas. */
  glyph: string;
  value: string;
  /** Spelled-out stat name — hover title and screen-reader text. */
  name: string;
  /** Small rider on the same cell, e.g. an on-hit bonus beside attack. */
  rider?: string;
  /** Unit suffix carried inside the value, e.g. the "/s" on regen. */
  unit?: string;
  /**
   * Explanation shown on hover, in the same grammar the detailed rows use. The
   * glyph gets a reading recognised; this is what gets it understood, and it is
   * the whole reason dropping the printed caption costs the player nothing.
   */
  help?: ReactNode;
  /** Raw number behind `value`, so a genuine change marks itself once. */
  watch?: number;
}

/**
 * The figure that answers the glance on its own, with the rate that produced it
 * carried alongside rather than competing for a cell of its own.
 */
export interface PlateHeadline extends PlateReading {
  label: string;
  sub?: string;
}

export interface StatPlateProps {
  crown?: PlateCrown;
  headline: PlateHeadline;
  /**
   * Instrument rails, drawn in order and separated by a hairline. Grouping is
   * the point: a rail reads as one object ("my offence"), which is work no flat
   * grid of equal cells does however it is sorted.
   */
  rails: PlateReading[][];
}

function Reading({ reading }: { reading: PlateReading }) {
  const { flashKey } = useChangeFlash(reading.watch);
  // Falls back to the stat's own name when there is no authored help, so every
  // glyph can always be identified even where nobody has written copy for it.
  const tip = useHoverTooltip(reading.help ?? reading.name);
  const classes = [
    'stat-reading',
    flashKey > 0 && `stat-reading--flash-${flashKey % 2 === 1 ? 'a' : 'b'}`,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...tip.handlers}>
      {/* 16px, not smaller. The stat glyphs are 16x16 pixel art and this panel
          asks them to BE the label, so they render at 1:1 — any fractional
          downscale drops source pixels unevenly and turns a legible glyph into a
          smudge. `DetailLines` gets away with 14 because it prints the stat's
          name beside it; here there is no name to fall back on. */}
      <GameIcon
        as="span"
        source={atlasIcon(reading.glyph)}
        size={16}
        fallback={null}
        className="stat-reading__glyph"
        decorative
      />
      <span className="stat-reading__value">
        {reading.value}
        {reading.unit && <span className="stat-reading__unit">{reading.unit}</span>}
      </span>
      {reading.rider && <span className="stat-reading__rider">{reading.rider}</span>}
      <span className="stat-reading__name">{reading.name}</span>
      {tip.node}
    </span>
  );
}

/**
 * One engraved housing carrying the whole character readout. Static at rest —
 * a stat only moves when the player changes it, so idle motion would be noise.
 *
 * NOTE there is deliberately no meter here. Damage reduction used to be the
 * plate's one bar, and the bar came with a guard that dropped any meter at zero
 * — so a player with no damage reduction saw the stat vanish from the panel
 * entirely rather than read "0%". A core stat has to be legible when it is zero;
 * that is exactly when you most want to know.
 */
export function StatPlate({ crown, headline, rails }: StatPlateProps) {
  const headlineTip = useHoverTooltip(headline.help ?? headline.name);

  return (
    <section className="stat-plate" aria-label="Character stats">
      {crown && <Crown crown={crown} />}

      <div className="stat-headline" {...headlineTip.handlers}>
        <GameIcon
          as="span"
          source={atlasIcon(headline.glyph)}
          size={16}
          fallback={null}
          className="stat-headline__glyph"
          decorative
        />
        <span className="stat-headline__value">{headline.value}</span>
        {headline.sub && <span className="stat-headline__sub">{headline.sub}</span>}
        <span className="stat-headline__label">{headline.label}</span>
        {headlineTip.node}
      </div>

      {rails.map((rail, index) => (
        <div className="stat-rail" key={rail[0]?.id ?? index}>
          {rail.map((reading) => (
            <Reading key={reading.id} reading={reading} />
          ))}
        </div>
      ))}
    </section>
  );
}
