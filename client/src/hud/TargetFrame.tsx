import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { MONSTER_DATABASE, NODE_BIOMES, dotElementForPlayer, weaponDotProfileForEffect, type StatusValue } from '@mmo-idle/shared';
import { targetFrameAtom, combatArchetypeAtom, passivesAtom, playerNodeIdAtom, selectedSubVariantAtom, type TargetFrameData } from './atoms';
import { statusMeta, bossEffectMeta } from './targetStatusMeta';
import { GameIcon } from '../ui/GameIcon';
import { bossEffectIconSource, targetStatusIconSource } from '../ui/conceptIcons';
import { TARGET_HOMES, homeBadgeNumber, targetHomeOf, type TargetHome } from './targetHomes';
import { BossFrameView, useLingeringBoss } from './BossFrame';
import { useIsMobile } from './useIsMobile';
import { ReadoutBar } from './ReadoutBar';
import { MonsterSprite } from './bestiary/MonsterSprite';
import { FRAME_TOKENS, readoutCssVars } from '../render/readoutTokens';
import { targetMark } from '../render/readoutModel';

// The base DoT stack ('dot') tile should reflect YOUR chosen element instead of a
// fixed green — green (poison/light), red (fire/balanced), light-blue (frost/heavy).
const DOT_ELEMENT_COLOR: Record<string, string> = {
  poison: '#7ac74f',
  fire:   '#ff5a2c',
  frost:  '#6fd0ff',
  doom:   '#9d4dff',
};
import { TooltipCard, useStatusStrip, type StripEntry, type StripTileProps } from './primitives';
import { bossEffectTooltipContent, bossPhaseTooltipContent, targetStatusTooltipContent } from './statusTooltips';
import './targetFrame.css';

// Keep the frame up briefly after the target dies/clears so fast auto-retargeting
// doesn't strobe it.
const LINGER_MS = FRAME_TOKENS.linger.ms;

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
  /** Damage still owed, for a damage-over-time record (the server's DoT inventory). */
  owed?: number;
  /** Which fixed home the tile lives in; absent for the ordinary strip below. */
  home?: TargetHome;
}

const DOT_ELEMENT_ICON: Record<string, string> = {
  poison: 'debuff-poison',
  fire: 'dot-conflag',
  frost: 'dot-chill',
  doom: 'debuff-antiheal',
};

/** Key of the announced-phase tile (`BossPhase.name`), always first on a boss. */
const PHASE_TILE_KEY = 'phase';
/** Tile id the phase tile resolves its icon/colour through. */
const BOSS_PHASE_TILE_ID = 'boss-phase';

/** The card for one tile, live or held after it ended. */
function tileTooltipContent(t: TileData, ended: boolean, targetName: string, monsterTypeId?: string) {
  const content = t.key === PHASE_TILE_KEY
    ? bossPhaseTooltipContent(monsterTypeId, t.label)
    : t.key.startsWith('b-')
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
        style={{ backgroundColor: icon ? "#11161d" : color, boxShadow: `0 0 8px ${color}66` }}
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

/**
 * One effect in its home: the registry's icon, its name, and the one number that
 * matters — what it still owes, or how long it holds. A hold also draws its clock
 * as a thin bar along the badge's foot.
 */
function HomeBadge({ tile, ended, stripProps }: {
  tile: TileData;
  ended: boolean;
  stripProps: StripTileProps | Record<string, never>;
}) {
  const home = tile.home!;
  const icon = targetStatusIconSource(tile.iconId ?? tile.id);
  const number = homeBadgeNumber(home, tile);
  const clockPct = home !== 'owes' && tile.remainingMs > 0 && tile.totalMs > 0
    ? Math.max(0, Math.min(100, (tile.remainingMs / tile.totalMs) * 100))
    : -1;
  const unit = home === 'owes' ? 'damage owed' : 'left';
  return (
    <div
      className={`tf-home__badge${ended ? ' tf-home__badge--ended' : ''}`}
      style={{ '--tf-badge-color': tile.color } as React.CSSProperties}
      tabIndex={0}
      role="img"
      aria-label={`${tile.label}${number ? `, ${number} ${unit}` : ''}${ended ? ', ended' : ''}`}
      {...stripProps}
    >
      <span className="tf-home__icon">
        <GameIcon source={icon} size={18} fit="cover" fallback={null} decorative />
      </span>
      <span className="tf-home__name">{tile.label}</span>
      <span className="tf-home__value">{number}</span>
      {clockPct >= 0 && <i className="tf-home__clock" style={{ width: `${clockPct}%` }} />}
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
    // The announced phase leads the strip: a permanent tile whose card explains
    // what the phase changed and what the answer is (`BossPhase.description`).
    ...(shown.isBoss && shown.bossPhase
      ? [{
          key: PHASE_TILE_KEY,
          id: BOSS_PHASE_TILE_ID,
          ...bossEffectMeta(BOSS_PHASE_TILE_ID),
          label: shown.bossPhase,
          stacks: 1,
          remainingMs: -1,
          totalMs: 0,
        }]
      : []),
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
        owed: s.owed,
        home: targetHomeOf(s.id),
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

/**
 * The target frame, and on desktop the boss frame above it (combat readout run, item
 * 4): the two share the top centre, so they are drawn together and the target frame
 * steps under a boss frame that is up. The phone draws its boss row in the top strip.
 */
export function TargetFrame() {
  const isMobile = useIsMobile();
  const boss = useLingeringBoss();
  return (
    <>
      {!isMobile && <BossFrameView boss={boss.shown} stale={boss.stale} placement="top" />}
      <TargetFrameBody bossId={boss.shown?.id ?? null} underBoss={!isMobile && boss.shown !== null} />
    </>
  );
}

function TargetFrameBody({ bossId, underBoss }: { bossId: string | null; underBoss: boolean }) {
  const live = useAtomValue(targetFrameAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const passives = useAtomValue(passivesAtom);
  const subVariant = useAtomValue(selectedSubVariantAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);
  const isMobile = useIsMobile();
  const [shown, setShown] = useState<TargetFrameData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A boss frame for this same body owns its name, bar and phase: one channel per fact.
  const bossOwnsHead = shown !== null && shown.id === bossId;
  const tiles = shown
    ? buildTiles(shown, combatArchetype, passives, subVariant).filter((t) => !(bossOwnsHead && t.key === PHASE_TILE_KEY))
    : [];
  // The strip owns hover inspection so a card survives its status ending or its
  // neighbours reflowing. A new target is a new strip. The three homes ride the
  // same strip, so a badge that ends while its card is open is held too.
  const strip = useStatusStrip({
    items: tiles,
    keyOf: (t) => t.key,
    enabled: true,
    resetKey: shown?.id,
    renderTip: ({ item, ended }) => (
      <TooltipCard content={tileTooltipContent(item, ended, shown?.name ?? 'the target', shown?.monsterTypeId)} />
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

  if (!shown) return null;

  const stale = !live; // lingering after death/clear

  // Active absorb only: amount 0 is a broken barrier reforming, and the Reforming
  // tile already owns that clock — the bar must never show absorb that isn't there.
  // The band is sized against max HP: "how much of this pool is shielded".
  const shieldAmount = Math.max(0, shown.enemyBarrier?.amount ?? 0);
  const def = shown.monsterTypeId ? MONSTER_DATABASE.get(shown.monsterTypeId) : undefined;
  const elite = def?.elite === true;
  const mark = targetMark(shown.isGuardian, elite);
  // The target is always on the player's node (deltaApplier), so its tier is the node's.
  const tier = nodeId ? NODE_BIOMES[nodeId]?.biomeTier : undefined;
  const hpText = `${Math.ceil(shown.hp)} / ${shown.maxHp}`;

  const homed = (home: TargetHome): StripEntry<TileData>[] =>
    strip.entries.filter(({ item }) => item.home === home);
  const others = strip.entries.filter(({ item }) => item.home === undefined);

  return (
    <div
      className={`target-frame${stale ? ' target-frame--stale' : ''}${shown.isBoss ? ' target-frame--boss' : ''}${mark ? ` target-frame--${mark}` : ''}${underBoss ? ' target-frame--under-boss' : ''}`}
      style={readoutCssVars() as React.CSSProperties}
    >
      {/* The chrome (combat readout run, item 5): portrait slot, name and tier, the
          readout bar with its number and chip, the guardian / elite / boss marks. */}
      {!bossOwnsHead && (
        <div className="tf-head">
          {shown.monsterTypeId && (
            <span className="tf-portrait" aria-hidden="true">
              <MonsterSprite
                monsterTypeId={shown.monsterTypeId}
                size={isMobile ? FRAME_TOKENS.portrait.phonePx : FRAME_TOKENS.portrait.px}
                fallbackColor={def?.color ?? 0x555555}
              />
            </span>
          )}
          <div className="tf-head__body">
            <div className="tf-head__name-row">
              <span className="target-frame__name">{shown.name}</span>
              {tier !== undefined && <span className="tf-head__tier">T{tier}</span>}
              {mark && <span className={`tf-mark tf-mark--${mark}`}>{mark.toUpperCase()}</span>}
              {shown.isBoss && <span className="tf-mark tf-mark--boss">BOSS</span>}
              {shieldAmount > 0 && (
                <span className="tf-head__absorb" title="Barrier — absorbed before health">+{Math.round(shieldAmount)}</span>
              )}
            </div>
            <ReadoutBar
              size="target"
              subject={shown.id}
              hp={shown.hp}
              maxHp={shown.maxHp}
              absorb={shieldAmount}
              segments={mark !== null}
              quarters={shown.isBoss}
              label={hpText}
              ariaLabel={`${shown.name}: ${hpText}${shieldAmount > 0 ? `, barrier absorbing ${Math.round(shieldAmount)}` : ''}`}
            />
          </div>
        </div>
      )}

      <div className="target-frame__stats">
        <span>ATK <b>{shown.attack}</b></span>
        <span>DR <b>{Math.round(shown.damageReduction * 100)}%</b></span>
        <span>PLT <b>{shown.plating}</b></span>
      </div>

      {/* The three fixed homes (design §26.4): always drawn, so nothing reflows
          when a poison lands or a slow wears off. One badge per effect. */}
      <div className="tf-homes">
        {TARGET_HOMES.map(({ home, caption }) => {
          const entries = homed(home);
          return (
            <div key={home} className={`tf-home tf-home--${home}${entries.length === 0 ? ' tf-home--empty' : ''}`}>
              <span className="tf-home__caption">{caption}</span>
              {entries.length === 0
                ? <span className="tf-home__ghost" aria-hidden="true" />
                : entries.map(({ key, item, ended }) => (
                  <HomeBadge key={key} tile={item} ended={ended} stripProps={strip.tileProps(key)} />
                ))}
            </div>
          );
        })}
      </div>

      {others.length > 0 && (
        <div className="target-frame__tiles">
          {others.map(({ key, item: t, ended }) => (
            <StatusTile
              key={key}
              label={t.label}
              id={t.id}
              iconId={t.iconId}
              color={t.color}
              stacks={t.stacks}
              remainingMs={t.remainingMs}
              totalMs={t.totalMs}
              bossEffect={t.key.startsWith('b-') || t.key === PHASE_TILE_KEY}
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
