import { useAtomValue } from 'jotai';
import { passivesAtom } from './atoms';
import { MechanicFrame } from './mechanics/MechanicFrame';
import type { DotMechanicModel } from './mechanics/types';
import { SigilRing, sigilCap } from './SigilRing';

/** Sigils belong to the enemy; the readout labels its target rather than a player resource. */
export function SigilReadout({ budget, model, compact = false }: { budget: number; model: DotMechanicModel; compact?: boolean }) {
  const passives = useAtomValue(passivesAtom);
  const cap = sigilCap(budget, passives);
  const count = model.hasTarget ? `${model.stacks} / ${cap}` : 'No target';
  const ring = (
    <div className={`sigil-readout${compact ? ' sigil-readout--compact' : ''}`}>
      {compact && <span>{`Sigils ${cap}`}</span>}
      <SigilRing cap={cap} stacks={model.hasTarget ? model.stacks : 0} enemy />
      <span className="sigil-readout__count">{model.hasTarget ? `Target ${count}` : count}</span>
    </div>
  );
  if (compact) return ring;
  return (
    <MechanicFrame
      kind="dot"
      title={`Sigils ${cap}`}
      help={<p>Your hits lay sigils on the enemy. They tick over time; your Payoff rules spend them at moments.</p>}
    >
      {ring}
    </MechanicFrame>
  );
}
