import type { EssenceType, PacketId } from '@mmo-idle/shared';
import { ESSENCE_TYPES, NODE_MODIFIER_FAMILIES, PACKET_IDS } from '@mmo-idle/shared';
import {
  capstoneMaterial,
  catalystMaterial,
  essenceMaterial,
  MaterialChip,
  materialKey,
  shardMaterial,
} from '../MaterialChip';

/** True when the player holds enough of every catalyst the cost requires. */
export function affordsCatalysts(
  catalystCost: Partial<Record<string, number>> | undefined,
  catalysts: Record<string, number>,
): boolean {
  return (Object.entries(catalystCost ?? {}) as [string, number][]).every(
    ([family, amount]) => (catalysts[family] ?? 0) >= amount,
  );
}

interface WalletSummaryProps {
  essences: Record<EssenceType, number>;
  /** Catalyst wallet keyed by node modifier. */
  catalysts?: Record<string, number>;
  /** Lineage shard wallet, keyed by packet (progression rework Phase 1). */
  shards?: Partial<Record<PacketId, number>>;
  /** Boss capstone wallet, keyed by biome. */
  capstones?: Record<string, number>;
}

/**
 * The player's spendable balance. Every wallet appears together because a
 * recipe or a lineage card can charge any of them, so judging affordability
 * from one alone is misleading. Catalyst families, shards and capstones the
 * player has never held are omitted rather than shown as zero — they arrive
 * with the biomes/lanes that grant them.
 */
export function WalletSummary({ essences, catalysts, shards, capstones }: WalletSummaryProps) {
  const ownedFamilies = NODE_MODIFIER_FAMILIES.filter((family) => (catalysts?.[family] ?? 0) > 0);
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
      {ownedFamilies.length > 0 && <span className="craft-wallet__split" aria-hidden="true" />}
      {ownedFamilies.map((family) => (
        <MaterialChip
          key={family}
          material={catalystMaterial(family)}
          held={catalysts?.[family] ?? 0}
          size={18}
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
  /** Optional catalyst cost, keyed by node modifier. */
  catalystCost?: Partial<Record<string, number>>;
  /** Player's catalyst wallet, keyed by node modifier. */
  catalysts?: Record<string, number>;
}

/** Every price in the game — gear, upgrades, techniques — renders through this. */
export function CostDisplay({ cost, essences, catalystCost, catalysts }: CostDisplayProps) {
  const entries = (Object.entries(cost) as [EssenceType, number][])
    .map(([type, amount]) => ({
      material: essenceMaterial(type),
      amount,
      held: essences[type] ?? 0,
    }));
  const catalystEntries = (Object.entries(catalystCost ?? {}) as [string, number][])
    .map(([family, amount]) => ({
      material: catalystMaterial(family),
      amount,
      held: catalysts?.[family] ?? 0,
    }));

  return (
    <div className="craft-cost material-chip-strip">
      {[...entries, ...catalystEntries].map(({ material, amount, held }) => (
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
