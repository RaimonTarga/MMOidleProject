import type { EssenceType } from '@mmo-idle/shared';
import { ESSENCE_TYPES, ESSENCE_COLORS } from '@mmo-idle/shared';

interface EssenceSummaryProps { essences: Record<EssenceType, number>; }

export function EssenceSummary({ essences }: EssenceSummaryProps) {
  return (
    <div className="craft-essence-summary">
      {ESSENCE_TYPES.map(type => (
        <span key={type} className="craft-essence-chip">
          <span className="craft-essence-chip__dot" style={{ background: ESSENCE_COLORS[type] }} />
          <span className="craft-essence-chip__value" style={{ color: ESSENCE_COLORS[type] }}>
            {essences[type]}
          </span>
        </span>
      ))}
    </div>
  );
}

interface CostDisplayProps {
  cost: Partial<Record<EssenceType, number>>;
  essences: Record<EssenceType, number>;
}

export function CostDisplay({ cost, essences }: CostDisplayProps) {
  const entries = Object.entries(cost) as [EssenceType, number][];
  return (
    <div className="craft-cost">
      {entries.map(([type, amount]) => {
        const held = essences[type] ?? 0;
        const ok = held >= amount;
        return (
          <span
            key={type}
            className={`craft-cost__chip${ok ? ' craft-cost__chip--ok' : ' craft-cost__chip--low'}`}
          >
            <span className="craft-cost__dot" style={{ background: ESSENCE_COLORS[type] }} />
            <span className="craft-cost__amount">{amount}</span>
            <span className="craft-cost__held">({held})</span>
          </span>
        );
      })}
    </div>
  );
}
