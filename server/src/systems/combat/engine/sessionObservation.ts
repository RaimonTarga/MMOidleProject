import type { MonsterEntity } from '../../../ecs/entity';

/** Opt-in read-only bench observation, absent in live Worlds. */
const observers = new WeakMap<MonsterEntity, (kind: string, now: number) => void>();
export function observeMonsterSession(monster: MonsterEntity, observer: (kind: string, now: number) => void) {
  observers.set(monster, observer);
}
export function emitMonsterSession(monster: MonsterEntity, kind: string, now: number) {
  observers.get(monster)?.(kind, now);
}
