import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CONDUIT_KIT, type FormationView } from '@mmo-idle/shared';
import { useFormationView } from '../../ui/class/useFormationView';
import { MechanicFrame } from './MechanicFrame';
import { useMechanicHelp } from './mechanicHelp';
import type { SummonerMechanicModel } from './types';

type SummonSlot = SummonerMechanicModel['slots'][number];
type SlotState = 'active' | 'respawning' | 'waiting';
type SlotTransition = 'arrived' | 'lost' | null;

const BODY_NAMES = new Map<string, string>([
  ...CONDUIT_KIT.pieces.map((piece) => [piece.id, piece.name] as const),
  ...CONDUIT_KIT.trophies.map((trophy) => [trophy.id, trophy.name] as const),
]);

function bodyName(slotId: string): string {
  const id = slotId.split('#')[0] ?? slotId;
  return BODY_NAMES.get(id) ?? id;
}

function stateFor(slot: SummonSlot): SlotState {
  if (slot.active) return 'active';
  return slot.queuePosition === 0 ? 'respawning' : 'waiting';
}

function describe(slot: SummonSlot, index: number, state: SlotState, hpPct: number, name: string | null): string {
  const marks = `${slot.marked ? ', marked for detonation' : ''}${slot.ritualCharges > 0 ? `, ${slot.ritualCharges} ritual charges` : ''}`;
  if (!name) {
    const who = `${slot.role} summon ${index + 1}`;
    if (slot.active) return `${who}, active, ${Math.round(hpPct)} percent health${marks}`;
    if (state === 'respawning') return `${who}, reconstructing, ${Math.round(slot.respawnPct)} percent complete`;
    if (slot.queuePosition > 0) return `${who}, waiting at queue position ${slot.queuePosition}`;
    return `${who}, waiting to spawn`;
  }
  if (slot.active) return `${name}, alive, ${Math.round(hpPct)} percent health${marks}`;
  if (state === 'respawning') return `${name}, fallen, rebuilding, ${Math.round(slot.respawnPct)} percent complete`;
  if (slot.queuePosition > 0) return `${name}, fallen, waiting at queue position ${slot.queuePosition}`;
  return `${name}, fallen, waiting to spawn`;
}

function rebuildQueue(slots: readonly SummonSlot[]): SummonSlot[] {
  return slots.filter((slot) => slot.queuePosition >= 0).sort((a, b) => a.queuePosition - b.queuePosition);
}

function formationHelp(formation: FormationView, alive: number, fallen: number, next: string | null): ReactNode {
  return (
    <>
      <div>
        {`Command is the budget. ${formation.command.used} of ${formation.command.total} is in the formation.`}
      </div>
      <div style={{ marginTop: 6 }}>
        {`${alive} alive, ${fallen} fallen. A lit body is standing. A dark one has fallen.`}
      </div>
      <div style={{ marginTop: 6 }}>
        {next
          ? `${next} is next in the rebuild queue. One body rebuilds at a time, paid from your HP.`
          : 'The rebuild queue is empty. One body rebuilds at a time, paid from your HP.'}
      </div>
    </>
  );
}

function CommandPips({ used, total }: { used: number; total: number }) {
  const pipCount = Math.max(0, total);
  return (
    <div className="mechanic-command" role="img" aria-label={`Command ${used} of ${total}`}>
      {Array.from({ length: pipCount }, (_, index) => (
        <span
          key={index}
          className={`mechanic-command__pip${index < used ? ' mechanic-command__pip--spent' : ''}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function SummonConduit({ slot, index, name }: { slot: SummonSlot; index: number; name: string | null }) {
  const state = stateFor(slot);
  const previousState = useRef<SlotState>(state);
  const [transition, setTransition] = useState<SlotTransition>(null);
  const hpPct = slot.health && slot.health.maxHp > 0
    ? Math.max(0, Math.min(100, (slot.health.hp / slot.health.maxHp) * 100))
    : slot.active ? 100 : 0;
  const progress = slot.active ? hpPct : slot.respawnPct;
  const description = describe(slot, index, state, hpPct, name);

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
      className={`mechanic-summon mechanic-summon--${state}${slot.marked ? ' mechanic-summon--marked' : ''}${transition ? ` mechanic-summon--${transition}` : ''}`}
      data-role={slot.role}
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
        {slot.ritualCharges > 0 && <span className="mechanic-summon__ritual" aria-hidden="true">{slot.ritualCharges}</span>}
      </span>
      <span className="mechanic-summon__track" aria-hidden="true">
        <span className="mechanic-summon__fill" />
      </span>
    </div>
  );
}

export function SummonerMechanic({ model }: { model: SummonerMechanicModel }) {
  const formation = useFormationView();
  const help = useMechanicHelp(model);
  const specializationClass = model.specialization
    ? ` mechanic-summons--${model.specialization}`
    : '';
  const alive = model.slots.filter((slot) => slot.active).length;
  const fallen = model.slots.length - alive;
  const queue = formation ? rebuildQueue(model.slots) : [];
  const next = queue[0];
  const waiting = queue.slice(1).map((slot) => bodyName(slot.slotId));
  const queueLine = next
    ? waiting.length > 0
      ? `Next rebuild: ${bodyName(next.slotId)}. Waiting: ${waiting.join(', ')}`
      : `Next rebuild: ${bodyName(next.slotId)}`
    : null;

  return (
    <MechanicFrame
      kind="summoner"
      title={formation ? 'Formation' : 'Summons'}
      help={formation ? formationHelp(formation, alive, fallen, next ? bodyName(next.slotId) : null) : help}
      status={formation ? `${formation.command.used} / ${formation.command.total}` : undefined}
    >
      {formation && <CommandPips used={formation.command.used} total={formation.command.total} />}
      <div
        className={`mechanic-summons${specializationClass}`}
        data-specialization={model.specialization ?? 'baseline'}
        aria-label={formation
          ? `Command ${formation.command.used} of ${formation.command.total}, ${alive} alive, ${fallen} fallen`
          : `${model.activeCount} of ${model.slotCount} summons active${model.specialization ? `, ${model.specialization.replace(/-/g, ' ')}` : ''}`}
      >
        <span className="mechanic-summons__crest" aria-hidden="true" />
        <span className="mechanic-summons__bus" aria-hidden="true" />
        {model.slots.map((slot, index) => (
          <SummonConduit
            key={slot.slotId}
            slot={slot}
            index={index}
            name={formation ? bodyName(slot.slotId) : null}
          />
        ))}
      </div>
      {queueLine && <p className="mechanic-formation__queue">{queueLine}</p>}
    </MechanicFrame>
  );
}
