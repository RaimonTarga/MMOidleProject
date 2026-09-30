import type { EssenceType, PacketId } from '@mmo-idle/shared';
import { ESSENCE_TYPES, PACKET_IDS } from '@mmo-idle/shared';
import {
  capstoneMaterial,
  essenceMaterial,
  MaterialChip,
  materialKey,
  shardMaterial,
} from '../MaterialChip';

interface WalletSummaryProps {
  essences: Record<EssenceType, number>;
  /** Lineage shard wallet, keyed by packet (progression rework Phase 1). */
  shards?: Partial<Record<PacketId, number>>;
  /** Boss capstone wallet, keyed by biome. */
  capstones?: Record<string, number>;
}

/**
 * The player's spendable balance. Every wallet appears together because a
 * recipe or a lineage card can charge any of them, so judging affordability
 * from one alone is misleading. Shards and capstones the player has never
 * held are omitted rather than shown as zero — they arrive with the lanes
 * that grant them.
 */
export function WalletSummary({ essences, shards, capstones }: WalletSummaryProps) {
  const ownedShards = PACKET_IDS.filter((packet) => (shards?.[packet] ?? 0) > 0);
  const ownedCapstones = Object.entries(capstones ?? {}).filter(([, amount]) => (amount ?? 0) > 0);

  return (
    <div className="craft-wallet material-chip-strip">
      {ESSENCE_TYPES.map((type) => (
        <MaterialChip
          key={type}
          material={essenceMaterial(type)}
          held={essences[type] ?? 0}
        />
      ))}
      {ownedShards.length > 0 && <span className="craft-wallet__split" aria-hidden="true" />}
      {ownedShards.map((packet) => (
        <MaterialChip
          key={packet}
          material={shardMaterial(packet)}
          held={shards?.[packet] ?? 0}
          size={18}
        />
      ))}
      {ownedCapstones.length > 0 && <span className="craft-wallet__split" aria-hidden="true" />}
      {ownedCapstones.map(([biome, amount]) => (
        <MaterialChip
          key={biome}
          material={capstoneMaterial(biome)}
          held={amount}
          size={18}
        />
      ))}
    </div>
  );
}

interface CostDisplayProps {
  cost: Partial<Record<EssenceType, number>>;
  essences: Record<EssenceType, number>;
}

/** Every price in the game — gear, upgrades, techniques — renders through this. */
export function CostDisplay({ cost, essences }: CostDisplayProps) {
  const entries = (Object.entries(cost) as [EssenceType, number][])
    .map(([type, amount]) => ({
      material: essenceMaterial(type),
      amount,
      held: essences[type] ?? 0,
    }));

  return (
    <div className="craft-cost material-chip-strip">
      {entries.map(({ material, amount, held }) => (
        <MaterialChip
          key={materialKey(material)}
          material={material}
          required={amount}
          held={held}
        />
      ))}
    </div>
  );
}
