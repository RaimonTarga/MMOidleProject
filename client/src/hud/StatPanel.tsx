import { useState } from 'react';
import type { PlayerSnapshot } from '@mmo-idle/shared';
import type { ConnectionStatus } from '../hudBus';

const CADENCE_TICKS = 8;

function CadenceTimeline({ count, threshold, armed }: { count: number; threshold: number; armed: boolean }) {
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
  player: PlayerSnapshot | null;
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

function DefensePassivesSection({ passives: p }: { passives: Record<string, number> }) {
  const rows: { label: string; value: string }[] = [];

  const inCombatRegen = p['defense.in-combat-regen-pct'] ?? 0;
  if (inCombatRegen > 0)
    rows.push({ label: 'In-combat Regen', value: `${Math.round(inCombatRegen * 100)}%` });

  const burstRegen = p['defense.regen-burst-pct'] ?? 0;
  if (burstRegen > 0) {
    const iv = ((p['defense.regen-burst-interval-ms'] ?? 0) / 1000).toFixed(0);
    rows.push({ label: 'Burst Regen', value: `${Math.round(burstRegen * 100)}% / ${iv}s` });
  }

  const shieldPct = p['defense.shield-pct'] ?? 0;
  if (shieldPct > 0) {
    const iv = ((p['defense.shield-interval-ms'] ?? 0) / 1000).toFixed(0);
    rows.push({ label: 'Shield', value: `${Math.round(shieldPct * 100)}% / ${iv}s` });
  }

  const absorb = p['defense.absorb-pct'] ?? 0;
  if (absorb > 0)
    rows.push({ label: 'Dmg Absorb', value: `${Math.round(absorb * 100)}%` });

  const dotRes = p['defense.dot-resistance'] ?? 0;
  if (dotRes > 0)
    rows.push({ label: 'DoT Resist', value: `${Math.round(dotRes * 100)}%` });

  const hitToDot = p['defense.hit-to-dot-pct'] ?? 0;
  if (hitToDot > 0)
    rows.push({ label: 'Hit→DoT', value: `${Math.round(hitToDot * 100)}%` });

  const debuffRes = p['defense.debuff-resistance'] ?? 0;
  if (debuffRes > 0)
    rows.push({ label: 'Debuff Resist', value: `${Math.round(debuffRes * 100)}%` });

  const cleanseStacks = p['defense.cleanse-stacks'] ?? 0;
  if (cleanseStacks > 0) {
    const iv = ((p['defense.cleanse-interval-ms'] ?? 0) / 1000).toFixed(0);
    rows.push({ label: 'Cleanse', value: `${cleanseStacks} stacks / ${iv}s` });
  }

  if (rows.length === 0) return null;

  return (
    <div className="stat-section">
      <div className="stat-section-title">Defense Passives</div>
      {rows.map(r => <StatRow key={r.label} label={r.label} value={r.value} />)}
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
