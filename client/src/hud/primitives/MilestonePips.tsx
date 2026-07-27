import type { CSSProperties } from 'react';
import './kit.css';

/** `blocked` is not merely unfinished — it is unreachable from here. */
export type PipState = 'done' | 'pending' | 'blocked';

export interface MilestonePipsProps {
  states: PipState[];
  /**
   * What the set means, e.g. "Might: 2 of 3 milestones". The pips are decoration;
   * this is the only thing a screen reader gets, so it must say the count.
   */
  label: string;
  tone?: 'primary' | 'success' | 'warning';
  size?: 'sm' | 'md';
  className?: string;
  style?: CSSProperties;
}

/**
 * A countable status readout that replaces textual markers like 'OK' / '--'
 * (§15 de-texting rule). Shape carries the count, so the same component serves a
 * milestone tally and a cost of N points.
 */
export function MilestonePips({
  states,
  label,
  tone = 'primary',
  size = 'md',
  className,
  style,
}: MilestonePipsProps) {
  const classes = [
    'milestone-pips',
    tone !== 'primary' && `milestone-pips--${tone}`,
    size === 'sm' && 'milestone-pips--sm',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} style={style} role="img" aria-label={label}>
      {states.map((state, index) => (
        <i
          key={index}
          className={`milestone-pips__pip milestone-pips__pip--${state}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
