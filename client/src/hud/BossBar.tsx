import { useAtomValue } from 'jotai';
import { hazardDmgPerSecond } from '@mmo-idle/shared';
import { zoneBossAtom } from './atoms';
import './bossBar.css';

export function BossBar() {
  const boss = useAtomValue(zoneBossAtom);
  if (!boss) return null;

  const { status } = boss;
  const hpPct = boss.maxHp > 0 ? Math.max(0, boss.hp / boss.maxHp) : 0;
  const obj = status.objective;
  const objPct =
    obj?.current != null && obj.total != null && obj.total > 0
      ? Math.max(0, (obj.total - obj.current) / obj.total)
      : null;

  return (
    <div className="boss-bar">
      <div className="boss-bar__header">
        <span className="boss-bar__name">{boss.name}</span>
        <span className="boss-bar__phase">{status.stageLabel}</span>
      </div>

      <div className="boss-bar__hp-row">
        <div className="boss-bar__track">
          <div
            className={`boss-bar__fill${status.invulnerable ? ' boss-bar__fill--invuln' : ''}`}
            style={{ width: `${hpPct * 100}%` }}
          />
        </div>
        <span className="boss-bar__hp-text">
          {boss.hp} / {boss.maxHp}
        </span>
      </div>

      <div className="boss-bar__status">
        {status.invulnerable
          ? 'INVULNERABLE'
          : `VULNERABLE · ${Math.round(hpPct * 100)}%`}
      </div>

      {obj && <div className="boss-bar__objective">{obj.headline}</div>}
      {obj?.detail && <div className="boss-bar__detail">{obj.detail}</div>}

      {objPct != null && (
        <div className="boss-bar__obj-track">
          <div
            className="boss-bar__obj-fill"
            style={{ width: `${objPct * 100}%` }}
          />
        </div>
      )}

      {status.hazard && (
        <div className="boss-bar__hazard">
          {status.hazard.effectId.toUpperCase()} ·{' '}
          {hazardDmgPerSecond(status.hazard.dmgPerTick, status.hazard.tickMs)} dmg/s
          {status.hazard.hint ? ` — ${status.hazard.hint}` : ''}
        </div>
      )}
    </div>
  );
}
