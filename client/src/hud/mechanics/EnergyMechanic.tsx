import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { MechanicFrame } from './MechanicFrame';
import type { EnergyMechanicModel } from './types';

export function EnergyMechanic({ model }: { model: EnergyMechanicModel }) {
  const previousEmpowered = useRef(model.empowered);
  const [discharging, setDischarging] = useState(false);

  useLayoutEffect(() => {
    const wasEmpowered = previousEmpowered.current;
    previousEmpowered.current = model.empowered;
    if (
      !wasEmpowered ||
      model.empowered ||
      model.isFlash ||
      document.visibilityState === 'hidden' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;

    setDischarging(true);
    const timeout = window.setTimeout(() => setDischarging(false), 430);
    return () => window.clearTimeout(timeout);
  }, [model.empowered, model.isFlash]);

  const displayedPct = discharging ? 0 : model.empowered && !model.isFlash ? 100 : model.pct;
  const style = {
    '--energy-pct': `${displayedPct}%`,
    ...(model.isFlash ? { '--mechanic-energy-shift': model.shiftColor } : {}),
  } as CSSProperties;

  return (
    <MechanicFrame
      kind="energy"
      title={model.isFlash ? model.shiftLabel : 'Energy'}
      state={discharging ? 'discharging' : model.empowered && !model.isFlash ? 'empowered' : undefined}
    >
      <div
        className={`mechanic-capacitor${model.isFlash ? ' mechanic-capacitor--shift' : ''}${discharging ? ' mechanic-capacitor--discharging' : ''}`}
        role="meter"
        aria-label={model.isFlash ? model.shiftLabel : 'Energy'}
        aria-valuemin={0}
        aria-valuemax={model.max}
        aria-valuenow={model.value}
        style={style}
      >
        <span className="mechanic-capacitor__field" aria-hidden="true" />
        <span className="mechanic-capacitor__ward mechanic-capacitor__ward--upper" aria-hidden="true" />
        <span className="mechanic-capacitor__ward mechanic-capacitor__ward--lower" aria-hidden="true" />
        <span className="mechanic-capacitor__channel">
          <span className="mechanic-capacitor__fill" style={{ width: `${displayedPct}%` }} />
          <span className="mechanic-capacitor__wake" aria-hidden="true" />
          <span className="mechanic-capacitor__lock" aria-hidden />
          <span className="mechanic-capacitor__discharge" aria-hidden />
        </span>
        <span className="mechanic-capacitor__runes" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => <i key={index} />)}
        </span>
        <span className="mechanic-capacitor__impact" aria-hidden="true" />
      </div>
    </MechanicFrame>
  );
}
