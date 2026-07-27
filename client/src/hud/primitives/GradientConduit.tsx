import type { CSSProperties, ReactNode } from 'react';
import './kit.css';

/** Hue per meaning, never one signature colour. */
export type ConduitRamp =
  | 'arcane'
  | 'gold'
  | 'amber'
  | 'vital'
  | 'caution'
  | 'critical';

/** A ceiling reached, which swaps the ramp and adds a slow pulse. */
export type ConduitState = 'max' | 'capped';

/**
 * Shared by both bar grammars. A bar that merely restates adjacent text is
 * decoration and should say so; a bar that is the only carrier of its value owes
 * a name, and `valueText` where the raw percentage would be less use than
 * "3 of 8".
 */
export type BarAccessibility =
  | { decorative: true; label?: never; valueText?: never }
  | { decorative?: false; label: string; valueText?: string };

interface GradientConduitCommonProps {
  /** 0-1. Clamped, so a server value past its own maximum cannot overflow. */
  fraction: number;
  ramp?: ConduitRamp;
  state?: ConduitState;
  /** Equal divisions drawn over the track. 0 leaves it unsegmented. */
  segments?: number;
  height?: number;
  /**
   * True while the value resets rather than advances — a level-up, a biome
   * change. Without it the fill animates backwards across the whole track as
   * though the player had lost the progress.
   */
  snap?: boolean;
  /** Extra marks inside the track: a shield band, a regen or incoming preview. */
  layers?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export type GradientConduitProps = GradientConduitCommonProps & BarAccessibility;

function clampFraction(fraction: number): number {
  if (!Number.isFinite(fraction)) return 0;
  return Math.min(1, Math.max(0, fraction));
}

/**
 * The bar grammar for live accumulation — the things that grow. A directional
 * gradient brightening toward the leading edge, a slow shimmer, and tick marks
 * for scale.
 *
 * Deliberately scarce: continuous motion is information here because the value
 * is genuinely moving. A stat that only changes on a gear swap gets an
 * `EngravedMeter` instead, and a bar must never invent a ceiling the underlying
 * value does not have.
 */
export function GradientConduit({
  fraction,
  ramp = 'arcane',
  state,
  segments = 0,
  height,
  snap,
  layers,
  className,
  style,
  ...accessibility
}: GradientConduitProps) {
  const value = clampFraction(fraction);
  const classes = [
    'gradient-conduit',
    `gradient-conduit--${ramp}`,
    state && `gradient-conduit--${state}`,
    snap && 'gradient-conduit--snap',
    className,
  ].filter(Boolean).join(' ');

  const dividers = Math.max(0, Math.floor(segments) - 1);

  return (
    <span
      className={classes}
      style={height ? ({ '--conduit-height': `${height}px`, ...style } as CSSProperties) : style}
      {...(accessibility.decorative
        ? { 'aria-hidden': true }
        : {
          role: 'progressbar',
          'aria-label': accessibility.label,
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': Math.round(value * 100),
          ...(accessibility.valueText ? { 'aria-valuetext': accessibility.valueText } : {}),
        })}
    >
      <span className="gradient-conduit__track">
        <span className="gradient-conduit__fill" style={{ width: `${value * 100}%` }} />
        {layers && <span className="gradient-conduit__layers">{layers}</span>}
        {dividers > 0 && (
          <span className="gradient-conduit__ticks">
            {Array.from({ length: dividers }, (_, index) => (
              <span
                key={index}
                className="gradient-conduit__tick"
                style={{ left: `${((index + 1) / segments) * 100}%` }}
              />
            ))}
          </span>
        )}
      </span>
    </span>
  );
}
