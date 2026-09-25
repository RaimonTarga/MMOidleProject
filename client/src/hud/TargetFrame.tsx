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
import { TooltipCard, useStatusStrip, type StripTileProps } from './primitives';
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

/** The card for one tile, live or held after it ended. */
function tileTooltipContent(t: TileData, ended: boolean, targetName: string) {
  const content = t.key.startsWith('b-')
    ? bossEffectTooltipContent(t.id, t.label, t.stacks)
    : targetStatusTooltipContent(
      { id: t.id, stacks: t.stacks, remainingMs: t.remainingMs, totalMs: t.totalMs, values: t.values },
      t.label,
    );
  if (ended) content.ended = { label: 'Ended', note: `no longer on ${targetName}` };
  return content;
}

function StatusTile({
  id, iconId, label, color, stacks, remainingMs, totalMs, bossEffect = false, ended = false, stripProps,
}: Omit<TileData, 'key' | 'values'> & {
  bossEffect?: boolean;
  /** Ended while the strip is frozen for inspection: held in a spent state. */
  ended?: boolean;
  /** Hover/focus handlers from the strip, which owns the tooltip. */
  stripProps: StripTileProps | Record<string, never>;
}) {
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
  const icon = bossEffect ? bossEffectIconSource(id) : targetStatusIconSource(iconId ?? id);

  return (
    <div
      className={`tf-tile-wrap${ended ? ' tf-tile-wrap--ended' : ''}`}
      tabIndex={0}
      role="img"
      aria-label={`${label}${stacks > 1 ? `, ${stacks} stacks` : ''}${ended ? ', ended' : ''}`}
      {...stripProps}
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
    </div>
  );
}

function buildTiles(
  shown: TargetFrameData,
  combatArchetype: string | null,
  passives: Record<string, number>,
  subVariant: string | null,
): TileData[] {
  // Local player's DoT element drives the base 'dot' tile color.
  const dotColor = combatArchetype === 'dot'
    ? DOT_ELEMENT_COLOR[dotElementForPlayer(passives, subVariant)]
    : undefined;

  return [
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
          label: shown.enemyBarrier.amount > 0 ? 'Barrier' : 'Reforming',
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
}

export function TargetFrame() {
  const live = useAtomValue(targetFrameAtom);
  const boss = useAtomValue(zoneBossAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const passives = useAtomValue(passivesAtom);
  const subVariant = useAtomValue(selectedSubVariantAtom);
  const [shown, setShown] = useState<TargetFrameData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tiles = shown ? buildTiles(shown, combatArchetype, passives, subVariant) : [];
  // The strip owns hover inspection so a card survives its status ending or its
  // neighbours reflowing. A new target is a new strip.
  const strip = useStatusStrip({
    items: tiles,
    keyOf: (t) => t.key,
    enabled: true,
    resetKey: shown?.id,
    renderTip: ({ item, ended }) => (
      <TooltipCard content={tileTooltipContent(item, ended, shown?.name ?? 'the target')} />
    ),
  });

  useEffect(() => {
    if (live) {
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
      setShown(live);
    } else if (!strip.frozen) {
      // A card being read keeps the frame up; the linger starts once it closes.
      timer.current = setTimeout(() => setShown(null), LINGER_MS);
    }
    return () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  }, [live, strip.frozen]);

  // Hide while an ultimate boss bar owns the top of the screen.
  if (boss || !shown) return null;

  const hpPct = shown.maxHp > 0 ? Math.max(0, Math.min(100, (shown.hp / shown.maxHp) * 100)) : 0;
  const hpColor = hpPct > 50 ? '#44ee44' : hpPct > 25 ? '#eeaa22' : '#ee3322';
  const stale = !live; // lingering after death/clear

  // Active absorb only: amount 0 is a broken barrier reforming, and the Reforming
  // tile already owns that clock — the bar must never show absorb that isn't there.
  const shieldAmount = Math.max(0, shown.enemyBarrier?.amount ?? 0);
  // Sized against max HP so the band answers "how much of this enemy's health
  // pool is shielded", the same question the HP fill answers. A tiny shell still
  // gets a visible sliver rather than rounding away to nothing.
  const shieldPct = shieldAmount > 0 && shown.maxHp > 0
    ? Math.max(4, Math.min(100, (shieldAmount / shown.maxHp) * 100))
    : 0;
  // The shell starts where health ends — it is the layer damage chews through
  // first — and slides back inside the bar when it would run off the end, so a
  // shielded enemy at full HP still shows its shell instead of nothing.
  const shieldLeft = Math.max(0, Math.min(hpPct, 100 - shieldPct));

  return (
    <div className={`target-frame${stale ? ' target-frame--stale' : ''}${shown.isBoss ? ' target-frame--boss' : ''}`}>
      <div className="target-frame__name-row">
        <span className="target-frame__name">{shown.name}</span>
        {shown.isBoss && <span className="target-frame__boss-tag">BOSS</span>}
      </div>

      <div className="target-frame__track">
        <div className="target-frame__fill" style={{ width: `${hpPct}%`, background: hpColor }} />
        {shieldPct > 0 && (
          <>
            <div
              className="target-frame__shield"
              style={{ left: `${shieldLeft}%`, width: `${shieldPct}%` }}
              role="img"
              aria-label={`Barrier absorbing ${Math.round(shieldAmount)}`}
            />
            <span className="target-frame__shield-amount">{Math.round(shieldAmount)}</span>
          </>
        )}
        <span className="target-frame__hp-text">{Math.ceil(shown.hp)} / {shown.maxHp}</span>
      </div>

      <div className="target-frame__stats">
        <span>ATK <b>{shown.attack}</b></span>
        <span>DR <b>{Math.round(shown.damageReduction * 100)}%</b></span>
        <span>PLT <b>{shown.plating}</b></span>
      </div>

      {strip.entries.length > 0 && (
        <div className="target-frame__tiles">
          {strip.entries.map(({ key, item: t, ended }) => (
            <StatusTile
              key={key}
              label={t.label}
              id={t.id}
              iconId={t.iconId}
              color={t.color}
              stacks={t.stacks}
              remainingMs={t.remainingMs}
              totalMs={t.totalMs}
              bossEffect={t.key.startsWith('b-')}
              ended={ended}
              stripProps={strip.tileProps(key)}
            />
          ))}
        </div>
      )}
      {strip.node}
    </div>
  );
}
