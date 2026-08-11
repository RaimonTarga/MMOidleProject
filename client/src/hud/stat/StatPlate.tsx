import type { HTMLAttributes, ReactNode } from 'react';
import { GlyphTile, type GlyphTileProps } from '../primitives/GlyphTile';
import { GradientConduit, type ConduitRamp } from '../primitives/GradientConduit';
import './statPlate.css';

/**
 * Identity and health, folded into the top of the plate rather than stacked
 * above it as separate sections (§14.1). One apparatus: who you are, how much
 * of you is left, and what is about to change that.
 */
export interface PlateCrown {
  name: string;
  /** Connection status, rendered as the dot beside the name. */
  status: string;
  hp: number;
  maxHp: number;
  /** Total absorb across all shields; drawn as a capping band and a chip. */
  shield: number;
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
  const shieldPct = pct(crown.shield);

  return (
    <div className="stat-crown">
      <div className="stat-crown__identity">
        <span className="stat-crown__name">{crown.name}</span>
        <span className={`status-dot ${crown.status}`} title={crown.status} />
      </div>

      <div className="stat-crown__readout" {...(crown.hpTip?.handlers ?? {})}>
        <span className="stat-crown__hp">
          {Math.ceil(crown.hp)}<span className="stat-crown__max"> / {crown.maxHp}</span>
        </span>
        {crown.shield > 0 && (
          <span className="stat-crown__shield" title="Shield absorb">
            +{Math.ceil(crown.shield)}
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
        valueText={crown.shield > 0
          ? `${Math.ceil(crown.hp)} of ${crown.maxHp}, plus ${Math.ceil(crown.shield)} shield`
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
            {shieldPct > 0 && (
              <span
                className="stat-crown__layer stat-crown__layer--shield"
                style={{ width: `${shieldPct}%` }}
              />
            )}
          </>
        }
      />
    </div>
  );
}

/**
 * The plate's figures are `GlyphTile`s, so this is a projection of that contract
 * rather than a parallel one — the cell recipe cannot drift away from the
 * primitive that draws it.
 */
export interface PlateFigure extends Pick<GlyphTileProps, 'value' | 'label' | 'watch' | 'title'> {
  /**
   * Stable identity. Not called `key`: spreading a prop named `key` into a
   * component is a React footgun, and several of these figures are conditional,
   * so a positional key would re-key the whole grid when one appears.
   */
  id: string;
}

export interface StatPlateProps {
  crown?: PlateCrown;
  /**
   * The one figure that answers "how is my character doing" without reading
   * anything else. Drawn alone, at roughly twice the grid's weight.
   */
  hero: PlateFigure;
  /**
   * Every other stat, all at EXACTLY the same weight. That equality is the
   * point, not a default: the panel used to promote DPS and Plating into big
   * tiles and demote attack, APS, range, regen and speed into a run of small
   * grey text, which said Plating outranks Damage reduction. It does not.
   */
  figures: PlateFigure[];
}

/**
 * One engraved housing carrying the whole character readout. Static at rest —
 * a stat only moves when the player changes it, so idle motion would be noise.
 * Each figure labels itself, so the plate needs no section headings.
 *
 * NOTE there is deliberately no meter here any more. Damage reduction used to be
 * the plate's one bar, and the bar came with a guard that dropped any meter at
 * zero — so a player with no damage reduction saw the stat vanish from the panel
 * entirely rather than read "0%". A core stat has to be legible when it is zero;
 * that is exactly when you most want to know.
 */
export function StatPlate({ crown, hero, figures }: StatPlateProps) {
  const { id: heroId, ...heroTile } = hero;

  return (
    <section className="stat-plate" aria-label="Character stats">
      {crown && <Crown crown={crown} />}

      <GlyphTile key={heroId} {...heroTile} className="stat-plate__hero" />

      <div className="stat-plate__grid">
        {figures.map(({ id, ...tile }) => (
          <GlyphTile key={id} {...tile} size="sm" />
        ))}
      </div>
    </section>
  );
}
