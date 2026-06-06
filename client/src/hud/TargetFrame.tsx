import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { targetFrameAtom, zoneBossAtom, type TargetFrameData } from './atoms';
import { statusMeta, bossEffectMeta } from './targetStatusMeta';
import { useHoverTooltip } from './stat/tooltip';
import './targetFrame.css';

// Keep the frame up briefly after the target dies/clears so fast auto-retargeting
// doesn't strobe it.
const LINGER_MS = 800;

interface TileData {
  key: string;
  label: string;
  color: string;
  stacks: number;
  remainingMs: number;
  totalMs: number;
}

function StatusTile({ label, color, stacks, remainingMs, totalMs }: Omit<TileData, 'key'>) {
  const permanent = remainingMs < 0;
  const durationPct = !permanent && totalMs > 0
    ? Math.max(0, Math.min(100, (remainingMs / totalMs) * 100))
    : -1;
  const elapsed = durationPct >= 0 ? 100 - durationPct : 0;
  const secs = permanent
    ? ''
    : remainingMs >= 1000 ? `${Math.ceil(remainingMs / 1000)}s`
    : remainingMs > 0 ? '<1s' : '';

  const tip = `${label}${stacks > 1 ? ` ×${stacks}` : ''}`
    + (permanent ? ' — permanent' : secs ? ` — ${secs} left` : '');
  const { handlers, node } = useHoverTooltip(tip);

  return (
    <div className="tf-tile-wrap" {...handlers}>
      <div className="tf-tile" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}88` }}>
        {durationPct >= 0 && (
          <div
            className="tf-tile__sweep"
            style={{ background: `conic-gradient(from -90deg, rgba(0,0,0,0.66) ${elapsed}%, transparent ${elapsed}%)` }}
          />
        )}
        {durationPct < 0 && !permanent && secs && <span className="tf-tile__secs">{secs}</span>}
        {permanent && <span className="tf-tile__secs">∞</span>}
        {stacks > 1 && <span className="tf-tile__stacks">{stacks}</span>}
      </div>
      <span className="tf-tile__label" style={{ color }}>{label}</span>
      {node}
    </div>
  );
}

export function TargetFrame() {
  const live = useAtomValue(targetFrameAtom);
  const boss = useAtomValue(zoneBossAtom);
  const [shown, setShown] = useState<TargetFrameData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (live) {
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
      setShown(live);
    } else {
      timer.current = setTimeout(() => setShown(null), LINGER_MS);
    }
    return () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  }, [live]);

  // Hide while an ultimate boss bar owns the top of the screen.
  if (boss || !shown) return null;

  const hpPct = shown.maxHp > 0 ? Math.max(0, Math.min(100, (shown.hp / shown.maxHp) * 100)) : 0;
  const hpColor = hpPct > 50 ? '#44ee44' : hpPct > 25 ? '#eeaa22' : '#ee3322';
  const stale = !live; // lingering after death/clear

  const tiles: TileData[] = [
    ...shown.statuses.map((s) => ({
      key: `s-${s.id}`,
      ...statusMeta(s.id),
      stacks: s.stacks,
      remainingMs: s.remainingMs,
      totalMs: s.totalMs,
    })),
    ...(shown.isBoss
      ? shown.bossEffects.map((b) => ({
          key: `b-${b}`,
          ...bossEffectMeta(b),
          stacks: 1,
          remainingMs: -1,
          totalMs: 0,
        }))
      : []),
  ];

  return (
    <div className={`target-frame${stale ? ' target-frame--stale' : ''}${shown.isBoss ? ' target-frame--boss' : ''}`}>
      <div className="target-frame__name-row">
        <span className="target-frame__name">{shown.name}</span>
        {shown.isBoss && <span className="target-frame__boss-tag">BOSS</span>}
      </div>

      <div className="target-frame__track">
        <div className="target-frame__fill" style={{ width: `${hpPct}%`, background: hpColor }} />
        <span className="target-frame__hp-text">{Math.ceil(shown.hp)} / {shown.maxHp}</span>
      </div>

      <div className="target-frame__stats">
        <span>ATK <b>{shown.attack}</b></span>
        <span>DR <b>{Math.round(shown.damageReduction * 100)}%</b></span>
        <span>PLT <b>{shown.plating}</b></span>
      </div>

      {tiles.length > 0 && (
        <div className="target-frame__tiles">
          {tiles.map((t) => (
            <StatusTile
              key={t.key}
              label={t.label}
              color={t.color}
              stacks={t.stacks}
              remainingMs={t.remainingMs}
              totalMs={t.totalMs}
            />
          ))}
        </div>
      )}
    </div>
  );
}
