import { useState } from 'react';
import type { PlayerView } from '@mmo-idle/shared';
import type { ConnectionStatus } from '../../hudBus';
import { BuffBar, CadenceTimeline, DefensePassivesSection, StatRow } from './components';

interface Props {
  player: PlayerView | null;
  status: ConnectionStatus;
}

export function StatPanel({ player, status }: Props) {
  const [expanded, setExpanded] = useState(false);

  const hpPct       = player && player.maxHp > 0 ? (player.hp / player.maxHp) * 100 : 0;
  const hpBarColor  = hpPct > 50 ? '#44ee44' : hpPct > 25 ? '#eeaa22' : '#ee3322';
  const totalShield = player?.shields.reduce((s, sh) => s + sh.amount, 0) ?? 0;
  const shieldPct   = player && player.maxHp > 0 ? Math.min(100 - hpPct, (totalShield / player.maxHp) * 100) : 0;
  const cdSec       = player ? (player.attackCooldown / 1000).toFixed(2) : '—';
  const aps         = player ? (1000 / player.attackCooldown).toFixed(2) : '—';
  const isFlash     = player ? (player.passives['energy.flash'] ?? 0) > 0 : false;
  const flashShiftLabel = player && player.flashShiftPct >= 50 ? 'Red Shift' : 'Blue Shift';
  const flashShiftColor = player
    ? `rgb(${Math.round(70 + player.flashShiftPct * 1.85)}, ${Math.round(130 - player.flashShiftPct * 0.65)}, ${Math.round(255 - player.flashShiftPct * 1.95)})`
    : '#66aaff';

  return (
    <div className="sidebar-panel">
      <div className="panel-title">Character</div>

      {/* Name + connection dot */}
      <div className="stat-row name-row">
        <span>{player?.name ?? '—'}</span>
        <span className={`status-dot ${status}`} title={status} />
      </div>

      {/* HP bar */}
      <div className="stat-section">
        <div className="stat-row">
          <span className="stat-label">HP</span>
          <span className="stat-value">
            {player
              ? totalShield > 0
                ? `${Math.ceil(player.hp)} / ${player.maxHp}  (+${Math.ceil(totalShield)} shield)`
                : `${Math.ceil(player.hp)} / ${player.maxHp}`
              : '— / —'}
          </span>
        </div>
        <div className="hp-bar-track">
          <div className="hp-bar-fill" style={{ width: `${hpPct}%`, background: hpBarColor }} />
          {shieldPct > 0 && (
            <div className="shield-bar-fill" style={{ width: `${shieldPct}%`, left: `${hpPct}%` }} />
          )}
        </div>
      </div>

      {/* Core combat stats */}
      <div className="stat-section">
        <StatRow label="Attack"     value={player?.attack    ?? '—'} />
        <StatRow label="Plating"    value={player?.plating   ?? '—'} />
        {player && player.damageReduction > 0 && (
          <StatRow label="Dmg Reduc." value={`${Math.round(player.damageReduction * 100)}%`} />
        )}
        <StatRow label="Atk Speed"  value={player ? `${aps} APS (${cdSec}s)` : '—'} />
        <StatRow label="Atk Range"  value={player ? `${player.attackRange}px` : '—'} />
        <StatRow label="Move Speed" value={player ? `${player.speed}px/s` : '—'} />
        <StatRow label="HP Regen"   value={player ? `${player.hpRegen}/s` : '—'} />
      </div>

      {/* Ammo / Heat bar — reload archetype */}
      {player?.combatArchetype === 'reload' && (player.passives['reload.laser'] ?? 0) > 0 && (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">Heat</span>
            <span className={`stat-value${player.laserOverheated ? ' mech-label--empowered' : ''}`}>
              {player.laserOverheated ? `OVERHEAT - Cooling (${player.heatPct}%)` : `${player.heatPct}%`}
            </span>
          </div>
          <div className="ammo-bar-track">
            <div
              className={`ammo-bar-fill ammo-bar-fill--heat${player.laserOverheated ? ' ammo-bar-fill--overheated' : ''}`}
              style={{ width: `${player.heatPct}%` }}
            />
          </div>
        </div>
      )}

      {player?.combatArchetype === 'reload' && (player.passives['reload.laser'] ?? 0) <= 0 && player.ammoMax > 0 && (
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

      {/* Cadence hit timeline */}
      {player?.combatArchetype === 'cadence' && player.cadenceThreshold > 0 && (
        <div className="stat-section">
          <span className="stat-label">Cadence</span>
          <CadenceTimeline count={player.cadenceCount} threshold={player.cadenceThreshold} armed={player.cadenceEmpoweredArmed} />
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
            <span className="stat-label">{isFlash ? flashShiftLabel : 'Energy'}</span>
            <span
              className={`stat-value${player.empoweredReady && !isFlash ? ' mech-label--empowered' : ''}`}
              style={isFlash ? { color: flashShiftColor } : undefined}
            >
              {isFlash
                ? `${Math.round(player.energyCount)} / 100`
                : player.empoweredReady ? 'EMPOWERED' : `${player.energyCount} / 100`}
            </span>
          </div>
          <div className="mech-bar-track">
            <div
              className={`mech-bar-fill mech-bar-fill--energy${player.empoweredReady && !isFlash ? ' mech-bar-fill--empowered' : ''}`}
              style={isFlash
                ? {
                  width: `${player.flashShiftPct}%`,
                  background: 'linear-gradient(90deg, #4488ff 0%, #aa88ff 50%, #ff4433 100%)',
                  boxShadow: `0 0 ${6 + player.flashSpeedBonusPct / 2}px ${flashShiftColor}`,
                }
                : { width: `${player.empoweredReady ? 100 : player.energyCount}%` }}
            />
          </div>
        </div>
      )}

      {/* DoT stacks — dot archetype, path-aware */}
      {player?.combatArchetype === 'dot' && (() => {
        const p = player.passives ?? {};
        const isPoison = (p['dot.poison-explosion'] ?? 0) > 0
          || (p['dot.eternal-doom'] ?? 0) > 0
          || (p['dot.invigorating-toxins'] ?? 0) > 0;
        const isFire   = (p['dot.fan-the-flames'] ?? 0) > 0
          || (p['dot.smoldering-ember'] ?? 0) > 0
          || (p['dot.conflagration'] ?? 0) > 0;
        const isFrost  = (p['dot.permafrost'] ?? 0) > 0
          || (p['dot.freezing-cold'] ?? 0) > 0
          || (p['dot.glacial-fracture'] ?? 0) > 0;
        const path = isPoison ? 'poison' : isFire ? 'fire' : isFrost ? 'frost' : 'default';

        const dotMax = (p['dot.poison-explosion'] ?? 0) > 0 ? 20
          : (p['dot.eternal-doom'] ?? 0) > 0 ? 50
          : (p['dot.conflagration'] ?? 0) > 0 ? 8
          : (p['dot.permafrost'] ?? 0) > 0 ? 1
          : Math.round(p['dot.max-stacks'] ?? 5);

        const stackLabel = isFire ? 'Burn Stacks'
          : isFrost ? 'Frost Stacks'
          : isPoison ? 'Poison Stacks'
          : 'Target Stacks';

        const pipClass = path !== 'default' ? ` dot-pip--${path}` : '';
        const usePips  = dotMax <= 10;

        return (
          <div className="stat-section">
            <div className="stat-row">
              <span className="stat-label">{stackLabel}</span>
              <span className={`stat-value${!player.attackTargetId ? ' dim' : ''}`}>
                {player.attackTargetId ? `${player.targetDotStacks} / ${dotMax}` : 'No target'}
              </span>
            </div>

            {usePips ? (
              <div className="dot-pips">
                {Array.from({ length: dotMax }, (_, i) => (
                  <div
                    key={i}
                    className={`dot-pip${pipClass}${i < player.targetDotStacks ? ` dot-pip--active${pipClass}` : ''}`}
                  />
                ))}
              </div>
            ) : (
              <div className="dot-stack-bar-track">
                <div
                  className={`dot-stack-bar-fill dot-stack-bar-fill--${path}`}
                  style={{ width: `${Math.min(100, (player.targetDotStacks / dotMax) * 100)}%` }}
                />
              </div>
            )}

            {/* Frost path — chill stacks + frozen indicator */}
            {isFrost && (p['dot.freezing-cold'] ?? 0) > 0 && (
              <>
                <div className="stat-row" style={{ marginTop: 6 }}>
                  <span className="stat-label">Chill</span>
                  <span className="stat-value">
                    {player.attackTargetId ? `${player.targetChillStacks ?? 0} / 3` : '—'}
                  </span>
                </div>
                <div className="chill-pips">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className={`chill-pip${i < (player.targetChillStacks ?? 0) ? ' chill-pip--active' : ''}`}
                    />
                  ))}
                </div>
                {(player.targetChillStacks ?? 0) >= 3 && (
                  <div className="chill-frozen-label">— FROZEN —</div>
                )}
              </>
            )}
          </div>
        );
      })()}

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

      {/* Expand / collapse toggle */}
      <button
        className={`auto-btn${expanded ? ' active' : ''}`}
        onClick={() => setExpanded(v => !v)}
        style={{ marginTop: 8 }}
      >
        {expanded ? '▲ LESS' : '▼ MORE STATS'}
      </button>

      {/* ── Expanded section ─────────────────────────────────────────────── */}
      {expanded && (
        <>
          {/* Evasion */}
          {player && player.evasion > 0 && (
            <div className="stat-section">
              <div className="stat-section-title">Evasion</div>
              <StatRow label="Trigger" value={`every ${player.evasion} hits`} />
              <div className="stat-row">
                <span className="stat-label">Progress</span>
                <span className="stat-value">{player.evasionCount} / {player.evasion}</span>
              </div>
              <div className="mech-bar-track">
                <div
                  className="mech-bar-fill mech-bar-fill--evasion"
                  style={{ width: `${(player.evasionCount / player.evasion) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Defense passives */}
          {player && <DefensePassivesSection passives={player.passives ?? {}} />}

        </>
      )}
    </div>
  );
}
