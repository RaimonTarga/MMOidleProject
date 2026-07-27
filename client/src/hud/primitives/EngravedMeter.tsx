import type { CSSProperties } from 'react';
import type { BarAccessibility } from './GradientConduit';
import './kit.css';

export type MeterTone = 'primary' | 'success' | 'warning' | 'danger';

interface EngravedMeterCommonProps {
  /** 0-1. Clamped; a zero fraction draws no fill at all. */
  fraction: number;
  tone?: MeterTone;
  /**
   * Spent past the budget. Reads as danger regardless of tone, so callers do not
   * need a sentence of warning text beside the bar.
   */
  over?: boolean;
  height?: number;
  className?: string;
  style?: CSSProperties;
}

export type EngravedMeterProps = EngravedMeterCommonProps & BarAccessibility;

/**
 * The bar grammar for every bounded meter that is not live accumulation: inset
 * track, flat fill, no shimmer, no ticks.
 *
 * The flatness is the point — it is what keeps `GradientConduit`'s motion
 * meaningful. Use this wherever the value has a genuine 0-100% ceiling but sits
 * still between player decisions: a budget, a resistance, a stored progress
 * count. A value with no real maximum should not be a bar in either grammar.
 */
export function EngravedMeter({
  fraction,
  tone = 'primary',
  over,
  height,
  className,
  style,
  ...accessibility
}: EngravedMeterProps) {
  const value = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;
  const classes = [
    'engraved-meter',
    tone !== 'primary' && `engraved-meter--${tone}`,
    over && 'engraved-meter--over',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      style={height ? ({ '--meter-height': `${height}px`, ...style } as CSSProperties) : style}
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
      {/* An empty trough is honest; a 2px minimum on nothing is not. */}
      {value > 0 && (
        <span className="engraved-meter__fill" style={{ width: `${value * 100}%` }} />
      )}
    </span>
  );
}
