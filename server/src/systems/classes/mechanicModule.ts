import type { World } from '../../world/World';
import type { BuffDescriptor } from '../combat/buffs/descriptor';

export interface MechanicModule<TId extends string = string> {
  readonly id: TId;
  readonly init: () => void;
  readonly tick: (world: World, dt: number, now: number) => void;
  readonly buffs: readonly BuffDescriptor[];
}

export function defineMechanic<const Id extends string>(
  module: MechanicModule<Id>,
): MechanicModule<Id> {
  return module;
}
