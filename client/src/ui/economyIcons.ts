import type { EssenceType, NodeModifierFamily } from '@mmo-idle/shared';
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

/**
 * The catalyst crystals are still the five PNGs authored for the previous modifier
 * set, matched to the new names by colour: cyan→Alacrity, red→Heavy, amber→Swarming,
 * purple→Dominion. Only Fortified is mismatched — it wears the green crystal while
 * its badge colour is steel. TODO(art): recolour a steel crystal for Fortified and
 * rename the source files to the current family names.
 */
const CATALYST_ICON_SOURCES: Record<NodeModifierFamily, AtlasIconSource> = {
  alacrity: atlasIcon('UI_icons/catalysts/alacrity.png'),
  heavy: atlasIcon('UI_icons/catalysts/brutality.png'),
  swarming: atlasIcon('UI_icons/catalysts/predation.png'),
  dominion: atlasIcon('UI_icons/catalysts/volatility.png'),
  fortified: atlasIcon('UI_icons/catalysts/blight.png'),
};

export function catalystIconSource(family: NodeModifierFamily): AtlasIconSource {
  return CATALYST_ICON_SOURCES[family];
}
