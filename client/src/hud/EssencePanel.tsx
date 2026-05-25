import type { PlayerSnapshot } from '@mmo-idle/shared';
import { ESSENCE_TYPES, ESSENCE_COLORS } from '@mmo-idle/shared';
import './essence.css';

interface Props {
  player: PlayerSnapshot | null;
}

export function EssencePanel({ player }: Props) {
  return (
    <div className="sidebar-panel">
      <div className="panel-title">Essence</div>
      <div className="essence-list">
        {ESSENCE_TYPES.map(type => (
          <div key={type} className="essence-row">
            <span className="essence-dot" style={{ background: ESSENCE_COLORS[type] }} />
            <span className="essence-name">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            <span className="essence-value" style={{ color: ESSENCE_COLORS[type] }}>
              {player?.essences[type] ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
