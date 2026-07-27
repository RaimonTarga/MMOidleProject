import type { CSSProperties, ReactNode } from 'react';
import { GameIcon, type IconSource } from '../../ui/GameIcon';
import { useChangeFlash } from './useChangeFlash';
import './kit.css';

export interface GlyphTileProps {
  /** Formatted headline, e.g. "141" or "82%". */
  value: ReactNode;
  /** What the figure is, e.g. "DPS". Drawn beneath it, so the tile self-labels. */
  label: string;
  icon?: IconSource | null;
  /** Stands in until the glyph exists, in the same footprint. */
  fallback?: ReactNode;
  /**
   * The raw number behind `value`, used only to notice a genuine change — a gear
   * swap, a stance flip — and mark it once. Omit for figures that should never
   * flash, and for anything the server updates continuously.
   */
  watch?: number;
  size?: 'sm' | 'lg';
  /** Drops the figure to body colour where it is a secondary readout. */
  muted?: boolean;
  title?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * The figure cell: a value over its own caption, optionally icon-led. Extracted
 * from the shipped `StatPlate` figure so the plate, the mastery summaries, and
 * any later readout are one implementation rather than three lookalikes.
 *
 * Static at rest. The only motion is a one-shot mark when the value genuinely
 * changed, and the delta is reported as text so the change is legible rather
 * than merely animated.
 */
export function GlyphTile({
  value,
  label,
  icon = null,
  fallback,
  watch,
  size = 'lg',
  muted,
  title,
  className,
  style,
}: GlyphTileProps) {
  const { flashKey, delta } = useChangeFlash(watch);
  const classes = [
    'glyph-tile',
    size === 'sm' && 'glyph-tile--sm',
    muted && 'glyph-tile--muted',
    flashKey > 0 && `glyph-tile--flash-${flashKey % 2 === 1 ? 'a' : 'b'}`,
    className,
  ].filter(Boolean).join(' ');

  const figure = (
    <>
      <span className="glyph-tile__value">
        {value}
        {delta !== null && delta !== 0 && (
          <span className={`glyph-tile__delta glyph-tile__delta--${delta > 0 ? 'up' : 'down'}`}>
            {delta > 0 ? '+' : ''}
            {Number.isInteger(delta) ? delta : delta.toFixed(1)}
          </span>
        )}
      </span>
      <span className="glyph-tile__label">{label}</span>
    </>
  );

  return (
    <div className={classes} style={style} title={title}>
      {icon ? (
        <div className="glyph-tile__row">
          <GameIcon
            source={icon}
            size={size === 'sm' ? 14 : 18}
            fallback={fallback ?? label.charAt(0)}
            className="glyph-tile__icon"
            decorative
          />
          <span>{figure}</span>
        </div>
      ) : (
        figure
      )}
    </div>
  );
}
