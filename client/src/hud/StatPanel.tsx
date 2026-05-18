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
  const cdSec = player ? (player.attackCooldown / 1000).toFixed(2) : '—';
  const aps   = player ? (1000 / player.attackCooldown).toFixed(2) : '—';

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
            {player ? `${Math.ceil(player.hp)} / ${player.maxHp}` : '— / —'}
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
        <StatRow label="Atk Speed"  value={player ? `${aps} APS (${cdSec}s)` : '—'} />
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

      {/* Ammo bar — only for reload players */}
      {player?.combatArchetype === 'reload' && player.ammoMax > 0 && (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">Ammo</span>
            <span className="stat-value">
              {player.ammoCount === 0 ? 'Reloading…' : `${player.ammoCount} / ${player.ammoMax}`}
            </span>
          </div>
          <div className="ammo-bar-track">
            <div
              className={`ammo-bar-fill${player.ammoCount === 0 ? ' ammo-bar-fill--reloading' : ''}`}
              style={{ width: `${(player.ammoCount / player.ammoMax) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Cadence rhythm bar */}
      {player?.combatArchetype === 'cadence' && player.cadenceThreshold > 0 && (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">Cadence</span>
            <span className="stat-value">{player.cadenceCount} / {player.cadenceThreshold}</span>
          </div>
          <div className="mech-bar-track">
            <div
              className="mech-bar-fill mech-bar-fill--cadence"
              style={{ width: `${(player.cadenceCount / player.cadenceThreshold) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Execution bar — cooldown archetype */}
      {player?.combatArchetype === 'cooldown' && (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">Execution</span>
            <span className={`stat-value${player.executionReady ? ' mech-label--ready' : ''}`}>
              {player.executionReady ? 'READY' : `${player.executionCooldownPct}%`}
            </span>
          </div>
          <div className="mech-bar-track">
            <div
              className={`mech-bar-fill mech-bar-fill--cooldown${player.executionReady ? ' mech-bar-fill--ready' : ''}`}
              style={{ width: `${player.executionCooldownPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Energy bar — energy archetype */}
      {player?.combatArchetype === 'energy' && (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">Energy</span>
            <span className={`stat-value${player.empoweredReady ? ' mech-label--empowered' : ''}`}>
              {player.empoweredReady ? 'EMPOWERED' : `${player.energyCount} / 100`}
            </span>
          </div>
          <div className="mech-bar-track">
            <div
              className={`mech-bar-fill mech-bar-fill--energy${player.empoweredReady ? ' mech-bar-fill--empowered' : ''}`}
              style={{ width: `${player.empoweredReady ? 100 : player.energyCount}%` }}
            />
          </div>
        </div>
      )}

      {/* DoT stacks — dot archetype */}
      {player?.combatArchetype === 'dot' && (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">Target Stacks</span>
            <span className={`stat-value${!player.attackTargetId ? ' dim' : ''}`}>
              {player.attackTargetId ? `${player.targetDotStacks} / 5` : 'No target'}
            </span>
          </div>
          <div className="dot-pips">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={`dot-pip${i < player.targetDotStacks ? ' dot-pip--active' : ''}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sacred Cross weapon buff bar */}
      {player?.equipment.weapon === 'sacred-cross' && (
        <BuffBar
          label="Sacred Burst"
          pct={player.sacredBuffPct}
          active={player.sacredBuffActive}
          activeLabel="BURST!"
          variant="sacred"
        />
      )}

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

/**
 * Generic weapon/passive buff progress bar.
 *
 * Convention: for each new buff, add two CSS blocks in hud.css:
 *   .mech-bar-fill--{variant}         — charging/building color
 *   .mech-bar-fill--{variant}-active  — burst/active color + animation
 *   .mech-label--{variant}-active     — text highlight color when active
 */
function BuffBar({
  label,
  pct,
  active,
  activeLabel,
  variant,
}: {
  label: string;
  pct: number;
  active: boolean;
  activeLabel: string;
  variant: string;
}) {
  return (
    <div className="stat-section">
      <div className="stat-row">
        <span className="stat-label">{label}</span>
        <span className={`stat-value${active ? ` mech-label--${variant}-active` : ''}`}>
          {active ? activeLabel : `${pct}%`}
        </span>
      </div>
      <div className="mech-bar-track">
        <div
          className={`mech-bar-fill mech-bar-fill--${variant}${active ? ` mech-bar-fill--${variant}-active` : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
