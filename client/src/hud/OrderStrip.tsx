import type { OrderBeatView, OrderView } from '@mmo-idle/shared';
import { GameIcon } from '../ui/GameIcon';
import { classPieceIconSource, trophyIconSource } from '../ui/conceptIcons';
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

function BeatCell({ beat, phase, icon }: { beat: OrderBeatView; phase: Phase; icon: number }) {
  const name = beat.pieceName ?? 'Plain swing';
  return (
    <span
      className="order-strip__cell"
      data-tone={beatTone(beat)}
      data-phase={phase}
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
  compact = false,
}: {
  order: OrderView;
  count: number;
  armed: boolean;
  compact?: boolean;
}) {
  const finisherName = order.finisher.trophyId ? order.finisher.name : 'Finisher';
  const icon = compact ? 14 : 18;
  return (
    <div
      className={`order-strip${compact ? ' order-strip--compact' : ''}`}
      role="group"
      aria-label={stripLabel(order, count, armed)}
    >
      {order.beats.map((beat) => (
        <BeatCell key={beat.index} beat={beat} phase={beatPhase(beat.index, count, armed)} icon={icon} />
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
}
