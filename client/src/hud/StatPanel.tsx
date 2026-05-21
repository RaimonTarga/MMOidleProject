import type { PlayerState } from '@mmo-idle/shared';
import { NODE_BIOMES, BIOME_DATABASE } from '@mmo-idle/shared';
import type { ConnectionStatus } from '../hudBus';
import { hudBus } from '../hudBus';

const CADENCE_TICKS = 8;

function CadenceTimeline({ count, threshold, armed }: { count: number; threshold: number; armed: boolean }) {
  // When armed=true the empowered is queued — the very next hit (index 0) is
  // the finisher regardless of count (which was reset to 0 at arm time).
  // When armed=false, compute normally: (threshold-1) - count remaining hits.
  const hitsUntilFinisher = armed ? 0 : (threshold - 1) - count;

  return (
    <div className="cadence-timeline">
      {Array.from({ length: CADENCE_TICKS }, (_, i) => {
        const delta      = i - hitsUntilFinisher;
        const isFinisher = delta >= 0 && delta % threshold === 0;
        return (
          <div
            key={i}
            className={`cadence-tick${isFinisher ? ' cadence-tick--finisher' : ''}${i === 0 ? ' cadence-tick--next' : ''}`}
          />
        );
      })}
    </div>
  );
}

interface Props {
  player: PlayerState | null;
  status: ConnectionStatus;
}

export function StatPanel({ player, status }: Props) {
  const hpPct = player && player.maxHp > 0 ? (player.hp / player.maxHp) * 100 : 0;
  const hpBarColor = hpPct > 50 ? '#44ee44' : hpPct > 25 ? '#eeaa22' : '#ee3322';
  const totalShield = player?.shields.reduce((s, sh) => s + sh.amount, 0) ?? 0;
  const shieldPct   = player && player.maxHp > 0 ? Math.min(100 - hpPct, (totalShield / player.maxHp) * 100) : 0;
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

      {/* Combat stats */}
      <div className="stat-section">
        <StatRow label="Attack"     value={player?.attack    ?? '—'} />
        <StatRow label="Plating"    value={player?.plating   ?? '—'} />
        {player && player.damageReduction > 0 && (
          <StatRow label="Dmg Reduc." value={`${Math.round(player.damageReduction * 100)}%`} />
        )}
        {player && player.evasion > 0 && (
          <StatRow label="Evasion" value={`every ${player.evasion} hits`} />
        )}
        <StatRow label="Atk Speed"  value={player ? `${aps} APS (${cdSec}s)` : '—'} />
        <StatRow label="Atk Range"  value={player ? `${player.attackRange}px` : '—'} />
        <StatRow label="Move Speed" value={player ? `${player.speed}px/s` : '—'} />
        <StatRow label="HP Regen"   value={player ? `${player.hpRegen}/s` : '—'} />
      </div>

      {/* Evasion progress bar — only when player has evasion stat */}
      {player && player.evasion > 0 && (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">Dodge</span>
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
