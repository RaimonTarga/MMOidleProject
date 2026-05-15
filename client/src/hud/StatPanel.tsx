import type { PlayerState } from '@mmo-idle/shared';
import { GAME_CONFIG } from '@mmo-idle/shared';
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
        <StatRow label="Move Speed" value={`${GAME_CONFIG.PLAYER_SPEED}px/s`} />
      </div>

      {/* World */}
      <div className="stat-section">
        <StatRow label="Level"      value={player?.level      ?? 0} />
        <StatRow label="Skill Pts"  value={player?.skillPoints ?? 0} />
        <StatRow label="Essence"    value={player?.essence    ?? 0} />
        <StatRow label="Zone"       value={player?.nodeId     ?? '—'} />
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
