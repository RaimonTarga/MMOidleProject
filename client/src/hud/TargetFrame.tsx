import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { dotElementForPlayer, weaponDotProfileForEffect, type StatusValue } from '@mmo-idle/shared';
import { targetFrameAtom, zoneBossAtom, combatArchetypeAtom, passivesAtom, selectedSubVariantAtom, type TargetFrameData } from './atoms';
import { statusMeta, bossEffectMeta } from './targetStatusMeta';
import { GameIcon } from '../ui/GameIcon';
import { bossEffectIconSource, targetStatusIconSource } from '../ui/conceptIcons';

// The base DoT stack ('dot') tile should reflect YOUR chosen element instead of a
// fixed green — green (poison/light), red (fire/balanced), light-blue (frost/heavy).
const DOT_ELEMENT_COLOR: Record<string, string> = {
  poison: '#7ac74f',
  fire:   '#ff5a2c',
  frost:  '#6fd0ff',
  doom:   '#9d4dff',
};
import { useHoverTooltip } from './stat/tooltip';
import { TooltipCard } from './primitives';
import { bossEffectTooltipContent, targetStatusTooltipContent } from './statusTooltips';
import './targetFrame.css';

// Keep the frame up briefly after the target dies/clears so fast auto-retargeting
// doesn't strobe it.
const LINGER_MS = 800;

interface TileData {
  key: string;
  id: string;
  label: string;
  color: string;
  stacks: number;
  remainingMs: number;
  totalMs: number;
  iconId?: string;
  /** Server-resolved magnitudes, when this effect publishes any. */
  values?: StatusValue[];
}

const DOT_ELEMENT_ICON: Record<string, string> = {
  poison: 'debuff-poison',
  fire: 'dot-conflag',
  frost: 'dot-chill',
  doom: 'debuff-antiheal',
};

function StatusTile({ id, iconId, label, color, stacks, remainingMs, totalMs, values, bossEffect = false }: Omit<TileData, 'key'> & { bossEffect?: boolean }) {
  const permanent = remainingMs < 0;
  const durationPct = !permanent && totalMs > 0
    ? Math.max(0, Math.min(100, (remainingMs / totalMs) * 100))
    : -1;
  const elapsed = durationPct >= 0 ? 100 - durationPct : 0;
  const secs = permanent
    ? ''
    : remainingMs >= 1000 ? `${Math.ceil(remainingMs / 1000)}s`
    : remainingMs > 0 ? '<1s' : '';

  const isWeaponReservoir = weaponDotProfileForEffect(id) !== undefined;
  // Target tiles get the same explanation grammar the buff bar does. Where the
  // server has no resolved magnitude for an effect, the card still carries its
  // name, its authored explanation and the stacks/clock the tile already knew.
  const content = bossEffect
    ? bossEffectTooltipContent(id, label, stacks)
    : targetStatusTooltipContent({ id, stacks, remainingMs, totalMs, values }, label);
  const { handlers, node } = useHoverTooltip(<TooltipCard content={content} />);
  const icon = bossEffect ? bossEffectIconSource(id) : targetStatusIconSource(iconId ?? id);

  return (
    <div
      className="tf-tile-wrap"
      tabIndex={0}
      role="img"
      aria-label={`${label}${stacks > 1 ? `, ${stacks} stacks` : ''}`}
      {...handlers}
    >
      <div
        className={`tf-tile${icon ? ' tf-tile--art' : ''}`}
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}66` }}
      >
        <GameIcon
          source={icon}
          size={28}
          fit="cover"
          fallback={null}
          className="tf-tile__art"
          decorative
        />
        {durationPct >= 0 && (
          <div
            className="tf-tile__sweep"
            style={{ background: `conic-gradient(from -90deg, rgba(0,0,0,0.66) ${elapsed}%, transparent ${elapsed}%)` }}
          />
        )}
        {durationPct < 0 && !permanent && secs && <span className="tf-tile__secs">{secs}</span>}
        {permanent && !isWeaponReservoir && stacks <= 1 && <span className="tf-tile__secs">∞</span>}
        {((isWeaponReservoir && stacks > 0) || (!isWeaponReservoir && stacks > 1)) && (
          <span className="tf-tile__stacks">{stacks}</span>
        )}
      </div>
      <span className="tf-tile__label" style={{ color }}>{label}</span>
      {node}
    </div>
  );
}

export function TargetFrame() {
  const live = useAtomValue(targetFrameAtom);
  const boss = useAtomValue(zoneBossAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const passives = useAtomValue(passivesAtom);
  const subVariant = useAtomValue(selectedSubVariantAtom);
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

  // Local player's DoT element drives the base 'dot' tile color.
  const dotColor = combatArchetype === 'dot'
    ? DOT_ELEMENT_COLOR[dotElementForPlayer(passives, subVariant)]
    : undefined;

  const tiles: TileData[] = [
    ...shown.statuses.map((s) => {
      const meta = statusMeta(s.id);
      return {
        key: `s-${s.id}`,
        id: s.id,
        iconId: s.id === 'dot'
          ? DOT_ELEMENT_ICON[dotElementForPlayer(passives, subVariant)]
          : s.id,
        ...meta,
        color: s.id === 'dot' && dotColor ? dotColor : meta.color,
        stacks: s.stacks,
        remainingMs: s.remainingMs,
        totalMs: s.totalMs,
        values: s.values,
      };
    }),
    ...(shown.isBoss
      ? shown.bossEffects.map((b) => ({
          key: `b-${b}`,
          id: b,
          ...bossEffectMeta(b),
          stacks: shown.bossEffectStacks[b] ?? 1,
          remainingMs: shown.bossEffectDurations[b]?.remainingMs ?? -1,
          totalMs: shown.bossEffectDurations[b]?.totalMs ?? 0,
        }))
      : []),
    ...(shown.enemyBarrier
      ? [{
          key: 'enemy-barrier',
          id: 'enemy-barrier',
          ...statusMeta('enemy-barrier'),
          label: shown.enemyBarrier.amount > 0 ? 'BARRIER' : 'REFORMING',
          stacks: 1,
          remainingMs: shown.enemyBarrier.amount > 0
            ? shown.enemyBarrier.remainingMs
            : shown.enemyBarrier.rechargeRemainingMs ?? 0,
          totalMs: shown.enemyBarrier.amount > 0
            ? shown.enemyBarrier.totalMs
            : shown.enemyBarrier.rechargeTotalMs ?? 0,
          values: [{
            label: 'Absorb remaining',
            value: String(Math.max(0, Math.round(shown.enemyBarrier.amount))),
            good: false,
          }],
        }]
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
              id={t.id}
              iconId={t.iconId}
              color={t.color}
              stacks={t.stacks}
              remainingMs={t.remainingMs}
              totalMs={t.totalMs}
              values={t.values}
              bossEffect={t.key.startsWith('b-')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
