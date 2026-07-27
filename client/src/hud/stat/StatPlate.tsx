import type { HTMLAttributes, ReactNode } from 'react';
import { EngravedMeter } from '../primitives/EngravedMeter';
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

/** A bar is only honest where the underlying value has a real 0-100% ceiling. */
export interface PlateMeter {
  label: string;
  /** 0-1. Damage reduction and dodge are fractions; attack and DPS are not. */
  fraction: number;
  value: string;
}

/**
 * The plate's figures are `GlyphTile`s, so this is a projection of that contract
 * rather than a parallel one — the cell recipe cannot drift away from the
 * primitive that draws it.
 */
export type PlateFigure = Pick<GlyphTileProps, 'value' | 'label' | 'watch'>;

export interface StatPlateProps {
  crown?: PlateCrown;
  figures: PlateFigure[];
  /** Secondary readouts, shown small beneath the figures. */
  lines?: ReactNode[];
  meters?: PlateMeter[];
}

/**
 * One engraved housing carrying the whole character readout. Static at rest —
 * a stat only moves when the player changes it, so idle motion would be noise.
 * Each figure labels itself, so the plate needs no section headings.
 */
export function StatPlate({ crown, figures, lines, meters }: StatPlateProps) {
  // A trough that can never fill reads as a broken bar, so a stat the player
  // has none of is omitted rather than drawn empty. Enforced here so no caller
  // can render one by forgetting its own guard.
  const activeMeters = (meters ?? []).filter((meter) => meter.fraction > 0);

  return (
    <section className="stat-plate" aria-label="Character stats">
      {crown && <Crown crown={crown} />}

      <div className="stat-plate__figures">
        {figures.map((figure) => (
          <GlyphTile key={figure.label} {...figure} />
        ))}
      </div>

      {lines && lines.length > 0 && (
        <div className="stat-plate__lines">
          {lines.map((line, index) => (
            <span key={index} className="stat-plate__line">{line}</span>
          ))}
        </div>
      )}

      {activeMeters.map((meter) => (
        <div key={meter.label} className="stat-plate__meter-row">
          <span className="stat-plate__meter-label">{meter.label}</span>
          {/* Engraved grammar: these sit still between gear swaps, so they get
              the flat counter-grammar rather than the conduit's motion. */}
          <EngravedMeter
            className="stat-plate__meter"
            fraction={meter.fraction}
            label={`${meter.label}: ${meter.value}`}
          />
          <span className="stat-plate__meter-value">{meter.value}</span>
        </div>
      ))}
    </section>
  );
}
