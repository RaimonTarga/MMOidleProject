import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { OrderStrip } from '../OrderStrip';
import { useOrderView } from '../../ui/class/useOrderView';
import { MechanicFrame } from './MechanicFrame';
import { useMechanicHelp } from './mechanicHelp';
import type { CadenceMechanicModel } from './types';

type CadenceImpact = 'strike' | 'armed' | 'finisher' | null;

function orderHelp(count: number, armed: boolean, beats: number): ReactNode {
  const next = armed
    ? 'The finisher is next.'
    : `Beat ${Math.min(beats, count + 1)} of ${beats} is next.`;
  return (
    <>
      <div>
        Landed beats dim, the next beat is highlighted, and beats still to come
        stay as they are. Grey is a plain swing, the class colour a technique,
        gold a mastered one. The last cell is the finisher.
      </div>
      <div style={{ marginTop: 6 }}>{next}</div>
    </>
  );
}

export function CadenceMechanic({ model }: { model: CadenceMechanicModel }) {
  const order = useOrderView();
  const help = useMechanicHelp(model);
  const previous = useRef({ count: model.count, armed: model.armed });
  const [impact, setImpact] = useState<CadenceImpact>(null);
  const [struckIndex, setStruckIndex] = useState(-1);
  const setupHits = Math.max(1, model.threshold - 1);

  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = { count: model.count, armed: model.armed };
    if (order) return;
    if (document.visibilityState === 'hidden' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setImpact(null);
      return;
    }

    let nextImpact: CadenceImpact = null;
    let duration = 260;
    if (before.armed && !model.armed) {
      nextImpact = 'finisher';
      duration = 440;
      setStruckIndex(setupHits - 1);
    } else if (!before.armed && model.armed) {
      nextImpact = 'armed';
      duration = 360;
      setStruckIndex(setupHits - 1);
    } else if (model.count > before.count) {
      nextImpact = 'strike';
      setStruckIndex(Math.max(0, model.count - 1));
    }

    if (!nextImpact) return;
    setImpact(nextImpact);
    const timeout = window.setTimeout(() => {
      setImpact(null);
      setStruckIndex(-1);
    }, duration);
    return () => window.clearTimeout(timeout);
  }, [model.armed, model.count, order, setupHits]);

  if (order) {
    return (
      <MechanicFrame
        kind="cadence"
        help={orderHelp(model.count, model.armed, order.beats.length)}
        title="Order"
        state={model.armed ? 'empowered' : undefined}
      >
        <OrderStrip order={order} count={model.count} armed={model.armed} />
      </MechanicFrame>
    );
  }

  return (
    <MechanicFrame
      kind="cadence"
      help={help}
      title="Cadence"
      state={impact === 'finisher' ? 'fired' : model.armed ? 'empowered' : undefined}
    >
      <div
        className={`mechanic-cadence${impact ? ` mechanic-cadence--${impact}` : ''}`}
        aria-label={model.armed ? 'Empowered strike ready' : `${model.count} of ${setupHits} setup strikes`}
        style={{ '--cadence-columns': setupHits } as CSSProperties}
      >
        <span className="mechanic-cadence__bus" aria-hidden="true" />
        <span className="mechanic-cadence__impact" aria-hidden="true" />
        {Array.from({ length: setupHits }, (_, index) => {
          // The final setup chamber is taller because filling it arms the next
          // attack. The empowered attack itself is not a separate fifth slot.
          const empowered = index === setupHits - 1;
          const complete = model.armed || index < model.count;
          const next = model.armed ? empowered : index === model.count;
          const struck = index === struckIndex;
          return (
            <span
              key={index}
              className={`mechanic-cadence__segment${empowered ? ' mechanic-cadence__segment--empowered' : ''}${complete ? ' mechanic-cadence__segment--complete' : ''}${next ? ' mechanic-cadence__segment--next' : ''}${struck ? ' mechanic-cadence__segment--struck' : ''}`}
              style={{ '--cadence-index': index } as CSSProperties}
            >
              <i className="mechanic-cadence__charge" aria-hidden="true" />
              <i className="mechanic-cadence__plate" aria-hidden="true" />
              <i className="mechanic-cadence__contact" aria-hidden="true" />
            </span>
          );
        })}
      </div>
    </MechanicFrame>
  );
}
