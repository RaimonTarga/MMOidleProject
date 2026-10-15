import type { CSSProperties } from 'react';
import { MechanicFrame } from './MechanicFrame';
import { useMechanicHelp } from './mechanicHelp';
import type { EnergyMechanicModel } from './types';

export function EnergyMechanic({ model }: { model: EnergyMechanicModel }) {
  const help = useMechanicHelp(model);
  const displayedPct = model.pct;
  const style = {
    '--energy-pct': `${displayedPct}%`,
  } as CSSProperties;

  return (
    <MechanicFrame
      kind="energy"
      help={help}
      title="Storm"
    >
      <div
        className="mechanic-capacitor"
        role="meter"
        aria-label="Storm"
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
