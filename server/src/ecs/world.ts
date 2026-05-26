import { World as MiniplexWorld } from 'miniplex';
import type { ServerEntity } from './entity';

/**
 * Authoritative miniplex world for the server. Entities are typed as
 * `ServerEntity` (which requires only `entityId`); feature modules attach
 * additional component keys via TypeScript intersection types.
 *
 * Server code should never import `miniplex` directly — go through this module
 * so the ECS dependency stays at one seam.
 */
export type EcsWorld = MiniplexWorld<ServerEntity>;

export function createEcsWorld(): EcsWorld {
  return new MiniplexWorld<ServerEntity>();
}
