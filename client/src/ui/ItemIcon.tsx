import { atlasIcon, GameIcon } from './GameIcon';
import { ITEM_ICON_ATLAS } from './iconAtlas';
import './atlasSprite.css';

interface ItemIconProps {
  frameName: string | null;
  scale?: number;
  className?: string;
  label?: string;
}

/** Renders a layout-stable 32x32 item-atlas slot. */
export function ItemIcon({ frameName, scale = 1, className, label }: ItemIconProps) {
  return (
    <GameIcon
      source={frameName ? atlasIcon(frameName, ITEM_ICON_ATLAS) : null}
      size={32 * scale}
      fallback={null}
      className={`item-icon${className ? ` ${className}` : ''}`}
      {...(label ? { label } : { decorative: true })}
    />
  );
}
