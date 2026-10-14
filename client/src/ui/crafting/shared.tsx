import type { EssenceType } from '@mmo-idle/shared';
import { ESSENCE_TYPES } from '@mmo-idle/shared';
import { essenceMaterial, MaterialChip, materialKey } from '../MaterialChip';

interface WalletSummaryProps {
  essences: Record<EssenceType, number>;
}

/** The player's spendable balance: every essence, so affordability reads at a glance. */
export function WalletSummary({ essences }: WalletSummaryProps) {
  return (
    <div className="craft-wallet material-chip-strip">
      {ESSENCE_TYPES.map((type) => (
        <MaterialChip
          key={type}
          material={essenceMaterial(type)}
          held={essences[type] ?? 0}
        />
      ))}
    </div>
  );
}

interface CostDisplayProps {
  cost: Partial<Record<EssenceType, number>>;
  essences: Record<EssenceType, number>;
}

/** Every price in the game — gear, techniques — renders through this. */
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
