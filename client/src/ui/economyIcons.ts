import type { EssenceType, PaceFamily } from '@mmo-idle/shared';
import { atlasIcon, type AtlasIconSource } from './GameIcon';

const ESSENCE_ICON_SOURCES: Record<EssenceType, AtlasIconSource> = {
  yellow: atlasIcon('UI_icons/essences/yellow.png'),
  green: atlasIcon('UI_icons/essences/green.png'),
  purple: atlasIcon('UI_icons/essences/purple.png'),
  blue: atlasIcon('UI_icons/essences/blue.png'),
  red: atlasIcon('UI_icons/essences/red.png'),
};

export function essenceIconSource(type: EssenceType): AtlasIconSource {
  return ESSENCE_ICON_SOURCES[type];
}

const CATALYST_ICON_SOURCES: Record<PaceFamily, AtlasIconSource> = {
  alacrity: atlasIcon('UI_icons/catalysts/alacrity.png'),
  brutality: atlasIcon('UI_icons/catalysts/brutality.png'),
  blight: atlasIcon('UI_icons/catalysts/blight.png'),
  volatility: atlasIcon('UI_icons/catalysts/volatility.png'),
  predation: atlasIcon('UI_icons/catalysts/predation.png'),
};

export function catalystIconSource(family: PaceFamily): AtlasIconSource {
  return CATALYST_ICON_SOURCES[family];
}
