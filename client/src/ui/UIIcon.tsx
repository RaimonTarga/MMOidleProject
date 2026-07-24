import type { CSSProperties, ReactNode } from 'react';
import {
  atlasIcon,
  GameIcon,
  type IconAccessibility,
  type IconSize,
} from './GameIcon';

type UIIconProps = IconAccessibility & {
  frameName: string;
  size?: IconSize;
  fallback?: ReactNode;
  className?: string;
  style?: CSSProperties;
  title?: string;
  as?: 'div' | 'span';
};

/** UI-atlas compatibility wrapper over the Phase 10 icon-source contract. */
export function UIIcon({ frameName, ...props }: UIIconProps) {
  return <GameIcon source={atlasIcon(frameName)} {...props} />;
}
