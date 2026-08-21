import type { EssenceType } from '@mmo-idle/shared';
import { ESSENCE_TYPES, NODE_MODIFIER_FAMILIES } from '@mmo-idle/shared';
import {
  catalystMaterial,
  essenceMaterial,
  MaterialChip,
  materialKey,
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
}

/**
 * The player's spendable balance. Both wallets appear together because a recipe
 * can charge either, so judging affordability from one of them is misleading.
 * Catalyst families the player has never held are omitted rather than shown as
 * zero — they arrive with the biomes that grant them.
 */
export function WalletSummary({ essences, catalysts }: WalletSummaryProps) {
  const ownedFamilies = NODE_MODIFIER_FAMILIES.filter((family) => (catalysts?.[family] ?? 0) > 0);

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
