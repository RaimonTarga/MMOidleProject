import { createElement } from 'react';
import type { EssenceType, PacketId } from '@mmo-idle/shared';
import { packetDefinition, shardName } from '@mmo-idle/shared';
import { atlasIcon, nodeIcon, type AtlasIconSource, type IconSource } from './GameIcon';
import { ITEM_ICON_ATLAS } from './iconAtlas';

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
 * The nine shards' art (course-correction W1-E, designer-approved 2026-10-03): one
 * crystal per packet in the essence-icon language, packed into the item atlas at
 * `items/materials/<shard>.png`. Keyed by packet, never by name, so renaming a
 * shard (design §24.2) cannot point at a missing frame.
 */
const SHARD_ICON_FRAMES: Record<PacketId, string> = {
  'tempo': 'items/materials/gale-shard.png',
  'empowered': 'items/materials/anvil-shard.png',
  'affliction': 'items/materials/venom-shard.png',
  'control': 'items/materials/shackle-shard.png',
  'kill-chain': 'items/materials/bone-shard.png',
  'engagement': 'items/materials/spark-shard.png',
  'technique': 'items/materials/sigil-shard.png',
  'bulwark': 'items/materials/iron-shard.png',
  'barrier-tempo': 'items/materials/glass-shard.png',
};

/** A shard's icon. Every consumer goes through this one function. */
export function shardIconSource(packet: PacketId): IconSource {
  const frame = SHARD_ICON_FRAMES[packet];
  if (frame) return atlasIcon(frame, ITEM_ICON_ATLAS);
  // A packet with no art yet: a lane-tinted initial, never another frame.
  const color = packetDefinition(packet)?.color ?? '#a99e8a';
  const letter = shardName(packet).charAt(0).toUpperCase();
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

// Boss capstones have no authored art yet: a plain gold glyph stands in rather
// than reaching for atlas frames that mean something else.
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
