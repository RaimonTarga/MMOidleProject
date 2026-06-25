import type { EssenceType } from '@mmo-idle/shared';
import { ESSENCE_TYPES, ESSENCE_COLORS, catalystLabel } from '@mmo-idle/shared';

/** True when the player holds enough of every catalyst the cost requires. */
export function affordsCatalysts(
  catalystCost: Partial<Record<string, number>> | undefined,
  catalysts: Record<string, number>,
): boolean {
  return (Object.entries(catalystCost ?? {}) as [string, number][]).every(
    ([group, amount]) => (catalysts[group] ?? 0) >= amount,
  );
}

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
  /** Optional biome-catalyst cost, keyed by biome group. */
  catalystCost?: Partial<Record<string, number>>;
  /** Player's catalyst wallet, keyed by biome group. */
  catalysts?: Record<string, number>;
}

export function CostDisplay({ cost, essences, catalystCost, catalysts }: CostDisplayProps) {
  const entries = Object.entries(cost) as [EssenceType, number][];
  const catalystEntries = Object.entries(catalystCost ?? {}) as [string, number][];
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
      {catalystEntries.map(([group, amount]) => {
        const held = catalysts?.[group] ?? 0;
        const ok = held >= amount;
        return (
          <span
            key={group}
            className={`craft-cost__chip craft-cost__chip--catalyst${ok ? ' craft-cost__chip--ok' : ' craft-cost__chip--low'}`}
            title={catalystLabel(group)}
          >
            <span className="craft-cost__catalyst-name">{catalystLabel(group)}</span>
            <span className="craft-cost__amount">{amount}</span>
            <span className="craft-cost__held">({held})</span>
          </span>
        );
      })}
    </div>
  );
}
