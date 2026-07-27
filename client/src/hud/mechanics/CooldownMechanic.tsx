import { useLayoutEffect, useRef, useState } from 'react';
import { MechanicFrame } from './MechanicFrame';
import { useMechanicHelp } from './mechanicHelp';
import type { CooldownMechanicModel } from './types';

const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CooldownMechanic({ model }: { model: CooldownMechanicModel }) {
  const help = useMechanicHelp(model);
  const previousReady = useRef(model.executionReady);
  const [impact, setImpact] = useState(false);

  useLayoutEffect(() => {
    const wasReady = previousReady.current;
    previousReady.current = model.executionReady;
    if (
      !wasReady ||
      model.executionReady ||
      model.isChanneling ||
      document.visibilityState === 'hidden' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;

    setImpact(true);
    const timeout = window.setTimeout(() => setImpact(false), 420);
    return () => window.clearTimeout(timeout);
  }, [model.executionReady, model.isChanneling]);

  const pct = model.isChanneling ? model.channelRemainingPct : model.executionPct;
  const displayedPct = impact ? 0 : pct;
  const label = model.isChanneling ? 'Channel' : 'Execution';
  const status = model.isChanneling
    ? `${Math.round(model.channelRemainingPct)}% remaining`
    : model.executionReady
      ? 'Ready'
      : `${Math.round(model.executionPct)}%`;

  return (
    <MechanicFrame
      kind="cooldown"
      help={help}
      title="Execution"
      state={impact ? 'fired' : model.isChanneling ? 'channeling' : model.executionReady ? 'ready' : undefined}
    >
      <div className={`mechanic-cooldown${impact ? ' mechanic-cooldown--fired' : ''}`}>
        <span className="mechanic-cooldown__wing mechanic-cooldown__wing--left" aria-hidden="true" />
        <span className="mechanic-cooldown__wing mechanic-cooldown__wing--right" aria-hidden="true" />
        <svg className="mechanic-cooldown__dial" viewBox="0 0 60 60" role="img" aria-label={`${label}: ${status}`}>
          <circle className="mechanic-cooldown__backplate" cx="30" cy="30" r="29" />
          <circle className="mechanic-cooldown__rim" cx="30" cy="30" r="28" />
          <path className="mechanic-cooldown__notches" d="M30 1v5 M30 54v5 M1 30h5 M54 30h5" />
          <circle className="mechanic-cooldown__track" cx="30" cy="30" r={RADIUS} />
          <circle
            className="mechanic-cooldown__progress-glow"
            cx="30"
            cy="30"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - displayedPct / 100)}
          />
          <circle
            className="mechanic-cooldown__progress"
            cx="30"
            cy="30"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - displayedPct / 100)}
          />
          <circle className="mechanic-cooldown__seal" cx="30" cy="30" r="18" />
          <path className="mechanic-cooldown__cleave" d="M30 15 27 27l3 3-3 3 3 12" />
          <circle className="mechanic-cooldown__core" cx="30" cy="30" r="3" />
          <circle className="mechanic-cooldown__impact" cx="30" cy="30" r={RADIUS} />
          <circle className="mechanic-cooldown__impact-inner" cx="30" cy="30" r="16" />
        </svg>
      </div>
    </MechanicFrame>
  );
}
