import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { GameIcon, type IconSource } from '../../ui/GameIcon';
import './kit.css';

export interface CrestDiamondProps extends HTMLAttributes<HTMLSpanElement> {
  icon: IconSource | null;
  /** Diamond width in px. Everything else in the frame derives from it. */
  size: number;
  /**
   * Rendered art size in px. Must not exceed `size * 0.59` — past that the clip
   * starts eating subject rather than background. See the geometry note in
   * `kit.css` for where that number comes from.
   */
  art: number;
  /** Shown until the art loads, or when there is none. */
  fallback?: ReactNode;
}

/**
 * Square art in a rhomboid frame, filled so the two read as one gem.
 *
 * Shared by the stance sanctum and the character plate: the frame's three
 * measurements interlock, so having each surface size its own copy is how they
 * drift apart.
 */
export function CrestDiamond({
  icon,
  size,
  art,
  fallback = null,
  className,
  style,
  children,
  ...rest
}: CrestDiamondProps) {
  // The frame's fill is sampled from the art itself rather than named as a
  // colour: see the geometry note in `kit.css`. Atlas frames are sheets, not
  // single icons, so only a standalone asset can be its own ground — anything
  // else falls back to the flat `--crest-ground`.
  const ground = icon?.kind === 'asset' ? `url("${icon.src}")` : undefined;

  return (
    <span
      className={['crest-diamond', className].filter(Boolean).join(' ')}
      style={{
        '--crest-size': `${size}px`,
        '--crest-art': `${art}px`,
        ...(ground ? { '--crest-ground-src': ground } : null),
        ...style,
      } as CSSProperties}
      {...rest}
    >
      <GameIcon
        className="crest-diamond__art"
        source={icon}
        size={art}
        fallback={fallback}
        decorative
      />
      {children}
    </span>
  );
}
