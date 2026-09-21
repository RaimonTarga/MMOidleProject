import type { PlayerEntity } from '../../../../ecs/entity';

/** Opt-in bench observation. No persisted state, global tuning mutation or live installer. */
export type SummonObservation =
  | { kind: 'attack'; id: string; targetId: string; targetType: string; targetHpFractionBefore: number; primaryHpDecrease: number; outcome: string }
  | { kind: 'spawn'; id: string; slot: number; replacement: boolean; maxHp: number }
  | { kind: 'sacrifice'; id: string }
  | { kind: 'replacement-attempt'; slotId: string; blocked: boolean; costHp: number; floorHp: number; dtMs: number }
  | { kind: 'replacement-paid'; id: string; hp: number }
  | { kind: 'queue-heal'; hp: number };
const observers = new WeakMap<PlayerEntity, (event: SummonObservation) => void>();
export function observeSummoner(owner: PlayerEntity, observer: (event: SummonObservation) => void) {
  observers.set(owner, observer);
  return () => { observers.delete(owner); };
}
export function emitSummonObservation(owner: PlayerEntity, event: SummonObservation): void {
  observers.get(owner)?.(event);
}
