import { createElement } from 'react';
import type { EssenceType, NodeModifierFamily, PacketId } from '@mmo-idle/shared';
import { packetDefinition } from '@mmo-idle/shared';
import { atlasIcon, nodeIcon, type AtlasIconSource, type IconSource } from './GameIcon';

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

/**
 * Lineage shards and boss capstones (progression rework Phase 1) have no
 * authored art yet — a plain lane-tinted glyph stands in rather than reaching
 * for atlas frames that mean something else. Swap for real icons in the art
 * pass; every consumer goes through these two functions so that is a one-file
 * change.
 */
export function shardIconSource(packet: PacketId): IconSource {
  const color = packetDefinition(packet)?.color ?? '#a99e8a';
  const letter = packetDefinition(packet)?.name.charAt(0) ?? packet.charAt(0).toUpperCase();
  return nodeIcon(
    createElement(
      'span',
      {
        style: {
          display: 'grid',
          placeItems: 'center',
          width: '100%',
          height: '100%',
          borderRadius: 2,
          background: `${color}26`,
          border: `1px solid ${color}`,
          color,
          fontWeight: 700,
          fontSize: '0.8em',
        },
      },
      letter,
    ),
  );
}

const CAPSTONE_COLOR = '#d9b25c';

export function capstoneIconSource(biome: string): IconSource {
  return nodeIcon(
    createElement(
      'span',
      {
        style: {
          display: 'grid',
          placeItems: 'center',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `${CAPSTONE_COLOR}26`,
          border: `1px solid ${CAPSTONE_COLOR}`,
          color: CAPSTONE_COLOR,
          fontWeight: 700,
          fontSize: '0.8em',
        },
      },
      biome.charAt(0).toUpperCase(),
    ),
  );
}
