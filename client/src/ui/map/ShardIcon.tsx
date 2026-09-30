import type { PacketId } from '@mmo-idle/shared';
import { packetDefinition, shardName } from '@mmo-idle/shared';

/**
 * A lane's shard material, as a glyph.
 *
 * Shards are keyed by packet, not by biome (design §12), so the icon is the lane's
 * colour plus its two letters — the same plain-signifier language `ModifierIcon`
 * used for the node modifiers it replaces. Real shard art is an art-pipeline job.
 */
const SHARD_ABBREVIATIONS: Record<PacketId, string> = {
  tempo: 'TE',
  empowered: 'EM',
  affliction: 'AF',
  control: 'CO',
  'kill-chain': 'KC',
  engagement: 'EN',
  bulwark: 'BW',
  'barrier-tempo': 'BT',
};

interface ShardIconProps {
  packet: PacketId;
  size?: number;
  className?: string;
}

export function ShardIcon({ packet, size = 16, className }: ShardIconProps) {
  const color = packetDefinition(packet)?.color ?? '#d4d1df';
  return (
    <span
      className={`pace-icon shard-icon${className ? ` ${className}` : ''}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(7, Math.round(size * 0.5)),
        background: color,
      }}
      title={shardName(packet)}
    >
      {SHARD_ABBREVIATIONS[packet]}
    </span>
  );
}
