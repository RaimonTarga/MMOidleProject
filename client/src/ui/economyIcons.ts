import { createElement } from 'react';
import type { EssenceType, PacketId } from '@mmo-idle/shared';
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
