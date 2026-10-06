import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { BAR_TOKENS, readoutCssVars, type ReadoutBarSize } from '../render/readoutTokens';
import {
  absorbBand, chipAdvance, chipValue, healthColor, quarterModel, segmentMarks, type ChipState,
} from '../render/readoutModel';
import './readoutBar.css';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/**
 * The damage chip for a DOM bar, on the same model as the overhead bars: it holds
 * the last hit for a beat, then drains. Reduced motion: it holds, then snaps. A new
 * `subject` (another target) starts clean, so a switch never reads as damage.
 */
export function useDamageChip(fraction: number, subject?: string | null): number {
  const chip = useRef<ChipState | undefined>(undefined);
  const lastSubject = useRef(subject);
  const [shown, setShown] = useState(fraction);
  useEffect(() => {
    if (lastSubject.current !== subject) {
      lastSubject.current = subject;
      chip.current = undefined;
    }
    chip.current = chipAdvance(chip.current, fraction, performance.now());
    let raf = 0;
    const step = (): void => {
      const c = chip.current!;
      const now = performance.now();
      const value = prefersReducedMotion()
        ? (now - c.at <= BAR_TOKENS.chip.holdMs ? c.from : c.to)
        : chipValue(c, now);
      setShown(value);
      if (value > c.to + 1e-6) raf = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(raf);
  }, [fraction, subject]);
  return Math.max(shown, fraction);
}

export interface ReadoutBarProps {
  size: ReadoutBarSize;
  hp: number;
  maxHp: number;
  /** Absorb as the hatched band riding the fill (an enemy shell, a player's wards). */
  absorb?: number;
  /** The boss bar's quarter markers: lost boundaries lit, the next one white. */
  quarters?: boolean;
  /** A thin segment every quarter, without the lost/next reading (elites). */
  segments?: boolean;
  /** The number drawn inside the bar. */
  label?: string;
  /** Extra layers over the fill (the vitals' pending DoT and regen). */
  layers?: ReactNode;
  /** The vitals' low-health edge glow. */
  lowHealth?: boolean;
  /** Who the bar is for: a change resets the chip (a new target is not a hit). */
  subject?: string | null;
  ariaLabel?: string;
  className?: string;
}

/**
 * The one DOM bar the readout draws everywhere (the boss frame, the target frame,
 * the vitals): trough, chip, fill coloured by thirds, absorb band, quarters or
 * segments, the number inside. Every colour and size comes from the tokens.
 */
export function ReadoutBar({
  size, hp, maxHp, absorb = 0, quarters = false, segments = false, label, layers, lowHealth = false, ariaLabel, className,
  subject,
}: ReadoutBarProps) {
  const fraction = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  const chip = useDamageChip(fraction, subject);
  const band = absorbBand(fraction, maxHp > 0 ? absorb / maxHp : 0);
  const q = quarters ? quarterModel(hp, maxHp) : null;
  return (
    <div
      className={`ro-bar ro-bar--${size}${lowHealth ? ' ro-bar--low' : ''}${className ? ` ${className}` : ''}`}
      style={readoutCssVars() as CSSProperties}
      role="img"
      aria-label={ariaLabel ?? label}
    >
      {q && Array.from({ length: q.lost }, (_, i) => (
        <i key={`lost-${i}`} className="ro-bar__lost" style={{ left: `${(1 - (i + 1) * 0.25) * 100}%` }} />
      ))}
      {chip > fraction && <i className="ro-bar__chip" style={{ left: `${fraction * 100}%`, width: `${(chip - fraction) * 100}%` }} />}
      <i className="ro-bar__fill" style={{ width: `${fraction * 100}%`, background: healthColor(fraction) }} />
      {layers}
      {band && <i className="ro-bar__absorb" style={{ left: `${band.left}%`, width: `${band.width}%` }} />}
      {q && q.markers.map((m) => (
        <i
          key={m.at}
          className={`ro-bar__q${m.lost ? ' ro-bar__q--lost' : m.next ? ' ro-bar__q--next' : ''}`}
          style={{ left: `${m.at * 100}%` }}
        />
      ))}
      {!q && segments && segmentMarks().map((at) => <i key={at} className="ro-bar__seg" style={{ left: `${at * 100}%` }} />)}
      {label && <span className="ro-bar__num">{label}</span>}
    </div>
  );
}

/** The quarters lost, as four pips: lit for each one gone. */
export function QuarterPips({ hp, maxHp, className }: { hp: number; maxHp: number; className?: string }) {
  const { lost } = quarterModel(hp, maxHp);
  return (
    <span className={`ro-pips${className ? ` ${className}` : ''}`} style={readoutCssVars() as CSSProperties}
      role="img" aria-label={`${lost} of 4 quarters lost`}>
      {[0, 1, 2, 3].map((i) => <i key={i} className={i < lost ? 'is-lost' : undefined} />)}
    </span>
  );
}
