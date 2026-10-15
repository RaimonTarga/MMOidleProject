import type { CSSProperties } from 'react';
import type { OrderBeatView, OrderView } from '@mmo-idle/shared';
import { GameIcon } from '../ui/GameIcon';
import { classPieceIconSource, trophyIconSource } from '../ui/conceptIcons';
import { orderResourceFill, orderResourceText, type OrderResource } from './orderResource';
import './orderStrip.css';

type Phase = 'landed' | 'next' | 'coming';
type Tone = 'plain' | 'technique' | 'mastered';

/**
 * `count` is the next beat. Arming the finisher wraps the counter back to 0,
 * so the armed flag, not the count, is what makes the finisher next.
 */
function beatPhase(index: number, count: number, armed: boolean): Phase {
  if (armed || index < count) return 'landed';
  if (index === count) return 'next';
  return 'coming';
}

function beatTone(beat: OrderBeatView): Tone {
  if (beat.mastered) return 'mastered';
  if (beat.pieceId) return 'technique';
  return 'plain';
}

function stripLabel(order: OrderView, count: number, armed: boolean): string {
  const finisher = order.finisher.trophyId ? order.finisher.name : 'Finisher';
  if (armed) return `Order. Finisher next: ${finisher}.`;
  const beat = order.beats[count];
  const name = beat?.pieceName ?? 'Plain swing';
  const at = (beat?.index ?? count) + 1;
  return `Order. Beat ${at} of ${order.beats.length} next: ${name}. Finisher: ${finisher}.`;
}

function BeatCell({ beat, phase, icon, lit }: { beat: OrderBeatView; phase: Phase; icon: number; lit: boolean }) {
  const name = beat.pieceName ?? 'Plain swing';
  return (
    <span
      className="order-strip__cell"
      data-tone={beatTone(beat)}
      data-phase={phase}
      data-lit={lit ? 'true' : undefined}
      title={name}
    >
      {beat.pieceId ? (
        <GameIcon
          source={classPieceIconSource(beat.pieceId)}
          size={icon}
          fallback={name.charAt(0)}
          decorative
        />
      ) : (
        <i className="order-strip__mark" aria-hidden="true" />
      )}
    </span>
  );
}

/** The Striker's combo: landed beats dim, the next one highlighted, the rest still to come. */
export function OrderStrip({
  order,
  count,
  armed,
  resource = null,
  compact = false,
}: {
  order: OrderView;
  count: number;
  armed: boolean;
  /** The discipline's resource (T2): Light's shine, Balanced's edge, Heavy's Momentum. */
  resource?: OrderResource | null;
  compact?: boolean;
}) {
  const finisherName = order.finisher.trophyId ? order.finisher.name : 'Finisher';
  const icon = compact ? 14 : 18;
  const beats = order.beats.length;
  const resourceText = resource ? orderResourceText(resource, beats) : null;
  const fill = resource ? orderResourceFill(resource, beats) : 0;
  const lit = resource?.kind === 'light' && resource.lit;
  const strip = (
    <div
      className={`order-strip${compact ? ' order-strip--compact' : ''}`}
      data-resource={resource?.kind}
      style={resource ? ({ '--order-fill': fill } as CSSProperties) : undefined}
      role="group"
      aria-label={resourceText ? `${stripLabel(order, count, armed)} ${resourceText}.` : stripLabel(order, count, armed)}
    >
      {order.beats.map((beat) => (
        <BeatCell key={beat.index} beat={beat} phase={beatPhase(beat.index, count, armed)} icon={icon} lit={lit} />
      ))}
      <span
        className="order-strip__cell order-strip__cell--finisher"
        data-tone={order.finisher.trophyId ? 'technique' : 'plain'}
        data-phase={armed ? 'next' : 'coming'}
        title={finisherName}
      >
        {order.finisher.trophyId ? (
          <GameIcon
            source={trophyIconSource(order.finisher.trophyId)}
            size={icon}
            fallback={finisherName.charAt(0)}
            decorative
          />
        ) : (
          <i className="order-strip__mark order-strip__mark--finisher" aria-hidden="true" />
        )}
      </span>
    </div>
  );
  if (!resourceText || compact) return strip;
  return (
    <div className="order-strip__stack">
      {strip}
      <div className="order-strip__resource" data-resource={resource?.kind} aria-hidden="true">
        <span className="order-strip__resource-bar"><i style={{ width: `${Math.round(fill * 100)}%` }} /></span>
        <span className="order-strip__resource-text">{resourceText}</span>
      </div>
    </div>
  );
}
