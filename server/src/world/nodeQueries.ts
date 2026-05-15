import type { World } from './World';
import type { PlayerState, MonsterState } from '@mmo-idle/shared';

/**
 * Returns all players currently in the given node.
 * Systems must use this instead of iterating world.players directly
 * to ensure node isolation between zones.
 */
export function getNodePlayers(world: World, nodeId: string): PlayerState[] {
  const out: PlayerState[] = [];
  for (const p of world.players.values()) {
    if (p.nodeId === nodeId) out.push(p);
  }
  return out;
}

/**
 * Returns all monsters currently in the given node.
 * Systems must use this instead of iterating world.monsters directly
 * to ensure node isolation between zones.
 */
export function getNodeMonsters(world: World, nodeId: string): MonsterState[] {
  const out: MonsterState[] = [];
  for (const m of world.monsters.values()) {
    if (m.nodeId === nodeId) out.push(m);
  }
  return out;
}
