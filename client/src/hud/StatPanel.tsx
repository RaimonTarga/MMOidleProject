import type { PlayerState } from '@mmo-idle/shared';
import { NODE_BIOMES, BIOME_DATABASE } from '@mmo-idle/shared';
import type { ConnectionStatus } from '../hudBus';
import { hudBus } from '../hudBus';

interface Props {
  player: PlayerState | null;
  status: ConnectionStatus;
}

export function StatPanel({ player, status }: Props) {
  const hpPct = player && player.maxHp > 0 ? (player.hp / player.maxHp) * 100 : 0;
  const hpBarColor = hpPct > 50 ? '#44ee44' : hpPct > 25 ? '#eeaa22' : '#ee3322';
  const cdSec = player ? (player.attackCooldown / 1000).toFixed(1) : '—';

  const zoneLabel = (() => {
    if (!player) return '—';
    const info = NODE_BIOMES[player.nodeId];
    if (!info) return player.nodeId;
    const biome = BIOME_DATABASE.get(info.biomeGroup);
    const name = biome?.name ?? info.biomeGroup;
    return `${name} T${info.biomeTier}`;
  })();

  return (
    <div className="sidebar-panel">
      <div className="panel-title">Character</div>

      <div className="stat-row name-row">
        <span>{player?.name ?? '—'}</span>
        <span className={`status-dot ${status}`} title={status} />
      </div>

      {/* HP */}
      <div className="stat-section">
        <div className="stat-row">
          <span className="stat-label">HP</span>
          <span className="stat-value">
            {player ? `${player.hp} / ${player.maxHp}` : '— / —'}
          </span>
        </div>
        <div className="hp-bar-track">
          <div
            className="hp-bar-fill"
            style={{ width: `${hpPct}%`, background: hpBarColor }}
          />
        </div>
      </div>

      {/* Combat stats */}
      <div className="stat-section">
        <StatRow label="Attack"     value={player?.attack    ?? '—'} />
        <StatRow label="Defense"    value={player?.defense   ?? '—'} />
        <StatRow label="Atk Speed"  value={`${cdSec}s cd`} />
        <StatRow label="Atk Range"  value={player ? `${player.attackRange}px` : '—'} />
        <StatRow label="Move Speed" value={player ? `${player.speed}px/s` : '—'} />
        <StatRow label="HP Regen"   value={player ? `${player.hpRegen}/s` : '—'} />
      </div>

      {/* World */}
      <div className="stat-section">
        <StatRow label="Level"      value={player?.level      ?? 0} />
        <StatRow label="Skill Pts"  value={player?.skillPoints ?? 0} />
        <StatRow label="Zone"       value={zoneLabel} />
        {player?.selectedClass && (
          <StatRow label="Class" value={player.selectedClass} />
        )}
      </div>

      <button
        className={`auto-btn${player?.auto ? ' active' : ''}`}
        onClick={() => hudBus.requestAutoToggle()}
        title="Toggle server-side auto combat"
      >
        AUTO: {player?.auto ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}

function StatRow({
  label,
  value,
  dim,
}: {
  label: string;
  value: string | number;
  dim?: boolean;
}) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className={`stat-value${dim ? ' dim' : ''}`}>{value}</span>
    </div>
  );
}
