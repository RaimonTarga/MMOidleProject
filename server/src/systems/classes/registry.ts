import type { BuffDescriptor } from '../combat/buffs/descriptor';
import type { World } from '../../world/World';
import cadenceModule  from './archetypes/cadence';
import cooldownModule from './archetypes/cooldown';
import energyModule   from './archetypes/energy';
import reloadModule   from './archetypes/reload';
import dotModule      from './archetypes/dot';
import summonerModule from './archetypes/summoner';

/**
 * Order matches the legacy World.tick() ordering so that any cross-module
 * tick interactions stay byte-for-byte identical. Inside each module's tick
 * body, "T3 before base" sequencing is preserved.
 *
 * Summoner ticks last so other modules' state changes for the owner have
 * already settled by the time minions read passives / dispatch attacks.
 */
export const MODULES = [
  cooldownModule,
  energyModule,
  reloadModule,
  dotModule,
  cadenceModule,
  summonerModule,
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
