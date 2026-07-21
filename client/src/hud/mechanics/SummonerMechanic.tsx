import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { MechanicFrame } from './MechanicFrame';
import type { SummonerMechanicModel } from './types';

type SummonSlot = SummonerMechanicModel['slots'][number];
type SlotState = 'active' | 'respawning' | 'waiting';
type SlotTransition = 'arrived' | 'lost' | null;

function stateFor(slot: SummonSlot): SlotState {
  if (slot.active) return 'active';
  return slot.respawnRemainingMs > 0 ? 'respawning' : 'waiting';
}

function SummonConduit({ slot, index }: { slot: SummonSlot; index: number }) {
  const state = stateFor(slot);
  const previousState = useRef<SlotState>(state);
  const [transition, setTransition] = useState<SlotTransition>(null);
  const hpPct = slot.health && slot.health.maxHp > 0
    ? Math.max(0, Math.min(100, (slot.health.hp / slot.health.maxHp) * 100))
    : slot.active ? 100 : 0;
  const progress = slot.active ? hpPct : slot.respawnPct;
  const description = slot.active
    ? `Summon ${index + 1}, active, ${Math.round(hpPct)} percent health`
    : state === 'respawning'
      ? `Summon ${index + 1}, respawning, ${Math.round(slot.respawnPct)} percent complete`
      : `Summon ${index + 1}, waiting to spawn`;

  useLayoutEffect(() => {
    const previous = previousState.current;
    previousState.current = state;
    if (previous === state) return;
    if (document.visibilityState === 'hidden' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTransition(null);
      return;
    }
    const nextTransition = state === 'active' ? 'arrived' : previous === 'active' ? 'lost' : null;
    setTransition(nextTransition);
    if (!nextTransition) return;
    const timeout = window.setTimeout(() => setTransition(null), 440);
    return () => window.clearTimeout(timeout);
  }, [state]);

  return (
    <div
      className={`mechanic-summon mechanic-summon--${state}${transition ? ` mechanic-summon--${transition}` : ''}`}
      style={{
        '--summon-health': `${hpPct}%`,
        '--summon-progress': `${progress}%`,
        '--summon-index': index,
      } as CSSProperties}
      aria-label={description}
    >
      <span className="mechanic-summon__socket" aria-hidden="true">
        <span className="mechanic-summon__ring" />
        <span className="mechanic-summon__vessel">
          <span className="mechanic-summon__charge" />
          <span className="mechanic-summon__core" />
          <span className="mechanic-summon__glint" />
        </span>
        <span className="mechanic-summon__contact" />
        <span className="mechanic-summon__impact" />
      </span>
      <span className="mechanic-summon__track" aria-hidden="true">
        <span className="mechanic-summon__fill" />
      </span>
    </div>
  );
}

export function SummonerMechanic({ model }: { model: SummonerMechanicModel }) {
  return (
    <MechanicFrame kind="summoner" title="Summons">
      <div className="mechanic-summons" aria-label={`${model.activeCount} of ${model.slotCount} summons active`}>
        <span className="mechanic-summons__bus" aria-hidden="true" />
        {model.slots.map((slot, index) => (
          <SummonConduit key={index} slot={slot} index={index} />
        ))}
      </div>
    </MechanicFrame>
  );
}
