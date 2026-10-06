import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAtomValue } from 'jotai';
import { bossFrameAtom } from './bossFrameState';
import type { BossCast, BossFrameModel } from './bossFrameModel';
import { QuarterPips, ReadoutBar } from './ReadoutBar';
import { TooltipCard, useHoverTooltip } from './primitives';
import { bossPhaseTooltipContent } from './statusTooltips';
import { bossEffectMeta } from './targetStatusMeta';
import { GameIcon } from '../ui/GameIcon';
import { bossEffectIconSource } from '../ui/conceptIcons';
import { FRAME_TOKENS, readoutCssVars } from '../render/readoutTokens';
import './bossFrame.css';

/** The phase tile resolves its icon and colour through this boss-effect id. */
const BOSS_PHASE_TILE_ID = 'boss-phase';

function formatHp(n: number): string {
  return Math.max(0, Math.ceil(n)).toLocaleString('en-US');
}

/** The frame's subject, held for the linger after it clears so it never strobes. */
export function useLingeringBoss(): { shown: BossFrameModel | null; stale: boolean } {
  const live = useAtomValue(bossFrameAtom);
  const [shown, setShown] = useState<BossFrameModel | null>(live);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (live) setShown(live);
    else timer.current = setTimeout(() => setShown(null), FRAME_TOKENS.linger.ms);
    return () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  }, [live]);
  return { shown: live ?? shown, stale: !live };
}

/** The announced phase, first in the frame (as it was first in the target strip). */
function PhaseTile({ boss, compact }: { boss: BossFrameModel; compact: boolean }) {
  const meta = bossEffectMeta(BOSS_PHASE_TILE_ID);
  const tip = useHoverTooltip(
    boss.phase ? <TooltipCard content={bossPhaseTooltipContent(boss.monsterTypeId, boss.phase)} /> : undefined,
    'above',
  );
  if (!boss.phase) return null;
  return (
    <span
      className="boss-frame__phase"
      style={{ '--boss-phase-color': meta.color } as CSSProperties}
      tabIndex={0}
      role="img"
      aria-label={`Phase: ${boss.phase}`}
      {...tip.handlers}
    >
      <span className="boss-frame__phase-icon">
        <GameIcon source={bossEffectIconSource(BOSS_PHASE_TILE_ID)} size={compact ? 14 : 18} fit="cover" fallback={null} decorative />
      </span>
      {!compact && <span className="boss-frame__phase-name">{boss.phase}</span>}
      {tip.node}
    </span>
  );
}

/**
 * The slim cast / telegraph line: a wind-up fills over its cast time (the client's
 * cast state from `monster-cast-start`); with no cast, a primed next hit holds it full.
 */
function CastLine({ cast, primed, compact }: { cast: BossCast | null; primed: boolean; compact: boolean }) {
  const elapsed = cast ? Math.max(0, Math.min(cast.castMs, Date.now() - cast.startedAt)) : 0;
  const label = cast ? cast.label : primed ? 'Next hit empowered' : '';
  return (
    <div className={`boss-cast${compact ? ' boss-cast--compact' : ''}${cast ? ' is-casting' : primed ? ' is-primed' : ''}`}>
      {!compact && <span className="boss-cast__label">{label}</span>}
      <span className="boss-cast__track" role={cast || primed ? 'img' : undefined} aria-label={label || undefined}>
        {cast && (
          <i
            key={cast.startedAt}
            className="boss-cast__fill"
            style={{ animationDuration: `${cast.castMs}ms`, animationDelay: `-${elapsed}ms` }}
          />
        )}
        {!cast && primed && <i className="boss-cast__fill boss-cast__fill--primed" />}
      </span>
    </div>
  );
}

/**
 * The boss frame (combat readout run, item 4): up while a boss is the player's target
 * or has the player as its target; lingers like the target frame. Desktop: top
 * centre. Phone: the top strip's row under the vitals, the ring row's height.
 */
export function BossFrame({ placement }: { placement: 'top' | 'strip' }) {
  const { shown, stale } = useLingeringBoss();
  return <BossFrameView boss={shown} stale={stale} placement={placement} />;
}

/** The frame for a given subject (the target frame shares its linger with it). */
export function BossFrameView({ boss: shown, stale, placement }: {
  boss: BossFrameModel | null;
  stale: boolean;
  placement: 'top' | 'strip';
}) {
  if (!shown) return null;
  const hpLabel = `${formatHp(shown.hp)} / ${formatHp(shown.maxHp)}`;
  const ariaHp = `${shown.name}: ${hpLabel}`;

  if (placement === 'strip') {
    return (
      <div className={`boss-row${stale ? ' boss-row--stale' : ''}`} style={readoutCssVars() as CSSProperties}>
        <PhaseTile boss={shown} compact />
        <span className="boss-row__name">{shown.name}</span>
        <div className="boss-row__bars">
          <ReadoutBar size="strip" hp={shown.hp} maxHp={shown.maxHp} absorb={shown.absorb} quarters label={hpLabel} ariaLabel={ariaHp} />
          <CastLine cast={shown.cast} primed={shown.primed} compact />
        </div>
        <QuarterPips hp={shown.hp} maxHp={shown.maxHp} />
      </div>
    );
  }

  return (
    <div className={`boss-frame${stale ? ' boss-frame--stale' : ''}`} style={readoutCssVars() as CSSProperties}>
      <div className="boss-frame__head">
        <PhaseTile boss={shown} compact={false} />
        <span className="boss-frame__name">{shown.name}</span>
        <span className="boss-frame__tag">T{shown.tier} · BOSS</span>
        <span className="boss-frame__spacer" />
        <QuarterPips hp={shown.hp} maxHp={shown.maxHp} />
      </div>
      <ReadoutBar size="boss" hp={shown.hp} maxHp={shown.maxHp} absorb={shown.absorb} quarters label={hpLabel} ariaLabel={ariaHp} />
      <CastLine cast={shown.cast} primed={shown.primed} compact={false} />
    </div>
  );
}
