import type { BuffDescriptor } from '../registry/buffs';
import type { World } from '../../world/World';
import cadenceModule  from './cadence';
import cooldownModule from './cooldown';
import energyModule   from './energy';
import reloadModule   from './reload';
import dotModule      from './dot';

/**
 * Order matches the legacy World.tick() ordering so that any cross-module
 * tick interactions stay byte-for-byte identical. Inside each module's tick
 * body, "T3 before base" sequencing is preserved.
 */
export const MODULES = [
  cooldownModule,
  energyModule,
  reloadModule,
  dotModule,
  cadenceModule,
] as const;

export type MechanicId = typeof MODULES[number]['id'];

export function initAllMechanics(): void {
  for (const m of MODULES) m.init();
}

export function tickAllMechanics(world: World, dt: number, now: number): void {
  for (const m of MODULES) m.tick(world, dt, now);
}

export function collectMechanicBuffs(): readonly BuffDescriptor[] {
  return MODULES.flatMap(m => m.buffs);
}
