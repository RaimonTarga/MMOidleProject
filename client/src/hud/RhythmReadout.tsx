import { useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  TUTORIAL_ANCHORS,
  cardSentence,
  defensiveFaceForSubVariant,
  lineageForCardId,
  resolveActiveLineages,
  rhythmFirings,
  type LineageProgressMap,
  type PlayerBuff,
} from '@mmo-idle/shared';
import {
  activeBuffsAtom,
  attackTargetIdAtom,
  deathOverlayAtom,
  equipmentAtom,
  lineagesAtom,
  passivesAtom,
  rhythmAtom,
  selectedSubVariantAtom,
  targetFrameAtom,
} from './atoms';
import { hudBus } from '../hudBus';
import { hudServerNow } from './hudServerClock';
import {
  awayText,
  deriveRhythmRings,
  newlyReady,
  readoutBuffIds,
  ringState,
  ringStateText,
  type RhythmInput,
  type RhythmRing,
} from './rhythmReadoutModel';
import { TooltipCard, useHoverTooltip, type TooltipCardContent } from './primitives';
import { buffTooltipContent } from './statusTooltips';
import { useIsMobile } from './useIsMobile';
import { GameIcon } from '../ui/GameIcon';
import { assetIcon } from '../ui/iconSource';
import './rhythmReadout.css';

/** How long a pulse ring stays lit after its card fires. */
const PULSE_MS = 700;
/** Re-render cadence while a ring is running a clock (a cap, a re-arming latch). */
const CLOCK_TICK_MS = 200;
/** The ring's SVG geometry, in viewBox units; the CSS sets the drawn size. */
const R = 17;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * Everything the ring model reads that is not a clock or a pulse — the readout's
 * inputs off the player's atoms. The firings are resolved from the same shared
 * function the server attaches the slice by.
 */
function useRhythmBase(): Omit<RhythmInput, 'serverNow' | 'firedRecently'> {
  const equipment = useAtomValue(equipmentAtom);
  const lineages = useAtomValue(lineagesAtom);
  const subVariant = useAtomValue(selectedSubVariantAtom);
  const moments = useAtomValue(rhythmAtom);
  const attackTargetId = useAtomValue(attackTargetIdAtom);
  const buffs = useAtomValue(activeBuffsAtom);
  const passives = useAtomValue(passivesAtom);
  const target = useAtomValue(targetFrameAtom);
  const firings = useMemo(
    () => rhythmFirings(resolveActiveLineages(
      { equipment, lineages },
      defensiveFaceForSubVariant(subVariant),
    )),
    [equipment, lineages, subVariant],
  );
  // The blocked state reads the CURRENT target's statuses (design §26.4).
  const statusKey = target ? target.statuses.map((s) => s.id).join('|') : null;
  const targetStatusIds = useMemo(
    () => (target ? target.statuses.map((s) => s.id) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusKey],
  );
  return { firings, moments, attackTargetId, buffs, passives, targetStatusIds };
}

/**
 * The buff tiles the readout stands in for — the buff bar leaves these out (the
 * frame's window and bank under the frame ring, a lineage window under the ring
 * of the card that opened it). Time-free, so the bar never re-renders on a clock.
 */
export function useReadoutBuffIds(): ReadonlySet<string> {
  const base = useRhythmBase();
  return useMemo(
    () => readoutBuffIds(deriveRhythmRings({ ...base, serverNow: undefined })),
    [base.firings, base.moments, base.attackTargetId, base.buffs, base.passives],
  );
}

function cardTooltip(ring: RhythmRing, lineages: LineageProgressMap, buffs: readonly PlayerBuff[]): TooltipCardContent {
  const away = awayText(ring);
  const awayRow = away ? [{ key: 'away', label: 'Away', value: away }] : [];
  if (!ring.firing) {
    // The frame ring explains itself with its container's own copy and values.
    const buff = ring.buffId ? buffs.find((b) => b.id === ring.buffId) : undefined;
    if (buff) return buffTooltipContent(buff);
    return {
      title: 'Frame',
      kicker: 'Rhythm',
      body: 'Your frame banks charge or opens a window as your mechanic cycles.',
      current: [{ key: 'state', label: 'Now', value: ringStateText(ring) }],
    };
  }
  const lineage = lineageForCardId(ring.firing.key);
  const card = lineage?.cards.find((c) => c.id === ring.firing!.key);
  const progress = lineage ? lineages[lineage.id] : undefined;
  // One sentence per card (design §24.6 rule 5): the verb's composed sentence.
  // A legacy card or a capstone has no generated sentence, and its authored
  // description is flavour, so it shows its state only.
  const body = card && progress ? cardSentence(card, progress) : undefined;
  const window = ring.buffId ? buffs.find((b) => b.id === ring.buffId) : undefined;
  return {
    title: ring.name,
    kicker: 'Rhythm',
    ...(body ? { body } : {}),
    current: [
      { key: 'state', label: 'Now', value: ringStateText(ring) },
      ...awayRow,
      ...(window?.values ?? []).map((value, index) => ({
        key: `window:${index}`, label: value.label, value: value.value, good: value.good,
      })),
    ],
  };
}

function Ring({
  ring,
  flash,
  interactive,
  tooltip,
}: {
  ring: RhythmRing;
  flash: number;
  interactive: boolean;
  tooltip: TooltipCardContent;
}) {
  const { handlers, node } = useHoverTooltip(interactive ? <TooltipCard content={tooltip} /> : undefined);
  const state = ringState(ring);
  const className = [
    'rhythm-ring',
    `rhythm-ring--${state}`,
    ring.windowing ? 'rhythm-ring--window' : '',
    `rhythm-ring--${ring.kind}`,
  ].filter(Boolean).join(' ');
  const away = awayText(ring);
  return (
    <div
      className={className}
      style={{ ['--ring-color' as string]: ring.color, pointerEvents: interactive ? 'auto' : 'none' }}
      role="img"
      aria-label={`${ring.name}: ${ringStateText(ring)}${away ? `. ${away}` : ''}`}
      tabIndex={interactive ? 0 : undefined}
      data-rhythm-ring={ring.key}
      data-ring-state={state}
      // The guide's verb lesson rings this (a card ring's key is its card id).
      data-tutorial-anchor={TUTORIAL_ANCHORS.rhythmRing(ring.key)}
      {...handlers}
    >
      <div className="rhythm-ring__dial">
        <svg className="rhythm-ring__svg" viewBox="0 0 40 40" aria-hidden="true">
          <circle className="rhythm-ring__track" cx="20" cy="20" r={R} />
          <circle
            className="rhythm-ring__fill"
            cx="20"
            cy="20"
            r={R}
            strokeDasharray={ring.blocked ? undefined : CIRCUMFERENCE}
            strokeDashoffset={ring.blocked ? undefined : CIRCUMFERENCE * (1 - ring.fill)}
            transform="rotate(-90 20 20)"
          />
        </svg>
        <span className="rhythm-ring__count">{ring.text}</span>
        {/* The away count: what fired while the fight was off screen. */}
        {ring.away > 0 && (
          <span className="rhythm-ring__away" aria-hidden="true">+{ring.away > 99 ? '99' : ring.away}</span>
        )}
        {/* Keyed by its counter: a new flash remounts it and the one-shot replays. */}
        {flash > 0 && <span key={flash} className="rhythm-ring__flash" aria-hidden="true" />}
      </div>
      <span className="rhythm-ring__label">
        {ring.glyph && (
          <GameIcon source={assetIcon(ring.glyph)} size={10} fallback={null} decorative />
        )}
        {ring.label}
      </span>
      {node}
    </div>
  );
}

/**
 * The rhythm readout (design §24.6, §26.4): one ring per active triggered card
 * plus the frame's window or bank, at most three, each NAMED (the verb's short
 * name under it). A ring counts toward its moment, brightens in the clock's last
 * second, shows ready, goes dashed when the moment's condition is missing on the
 * target, and carries the count of firings the player did not see. Not buff tiles.
 *
 * Placement (design §26.4: "beside the HP bar"): `rail` sits under the HP bar in
 * the desktop Character panel; `compact` is the phone top strip's second row
 * (prototype E's placement).
 */
export function RhythmReadout({ placement }: { placement: 'rail' | 'compact' }) {
  const base = useRhythmBase();
  const lineages = useAtomValue(lineagesAtom);
  const death = useAtomValue(deathOverlayAtom);
  const isMobile = useIsMobile();
  const compact = placement === 'compact';
  const interactive = !isMobile && !compact;

  // Cards that fired a beat ago: a pulse ring lights for that beat.
  const [fired, setFired] = useState<ReadonlyMap<string, number>>(new Map());
  useEffect(() => hudBus.subscribeCardFired((cardId) => {
    setFired((prev) => new Map(prev).set(cardId, performance.now()));
  }), []);
  useEffect(() => {
    if (fired.size === 0) return;
    const timer = window.setTimeout(() => {
      const cutoff = performance.now() - PULSE_MS;
      setFired((prev) => new Map([...prev].filter(([, at]) => at > cutoff)));
    }, PULSE_MS);
    return () => window.clearTimeout(timer);
  }, [fired]);

  const [, setTick] = useState(0);
  const rings = deriveRhythmRings({
    ...base,
    serverNow: hudServerNow(),
    firedRecently: new Set(fired.keys()),
  });

  // A running clock re-renders the readout until it lands; nothing else does.
  const clocked = rings.some((ring) => (ring.clockMs ?? 0) > 0);
  useEffect(() => {
    if (!clocked) return;
    const timer = window.setInterval(() => setTick((t) => t + 1), CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, [clocked]);

  // The one-shot flash when a ring BECOMES ready (or its card fires).
  const previous = useRef(new Map<string, boolean>());
  const [flashes, setFlashes] = useState<ReadonlyMap<string, number>>(new Map());
  const readyKey = rings.map((ring) => `${ring.key}:${ring.ready ? 1 : 0}`).join('|');
  useEffect(() => {
    const lit = newlyReady(previous.current, rings);
    previous.current = new Map(rings.map((ring) => [ring.key, ring.ready]));
    if (lit.length === 0) return;
    setFlashes((prev) => {
      const next = new Map(prev);
      for (const key of lit) next.set(key, (next.get(key) ?? 0) + 1);
      return next;
    });
    // `rings` is rebuilt every render; its readiness is what this watches.
  }, [readyKey]);

  if (death.active || rings.length === 0) return null;

  return (
    <div className={`rhythm-readout rhythm-readout--${placement}`}>
      {rings.map((ring) => (
        <Ring
          key={ring.key}
          ring={ring}
          flash={flashes.get(ring.key) ?? 0}
          interactive={interactive}
          tooltip={cardTooltip(ring, lineages, base.buffs)}
        />
      ))}
    </div>
  );
}
