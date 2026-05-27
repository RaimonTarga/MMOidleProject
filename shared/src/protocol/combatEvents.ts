import type { EssenceType } from '../items';
import type { Vec2 } from '../systems/spatial';

/**
 * Discrete combat events accumulated between broadcast ticks.
 * Bundled with each DeltaSnapshot so the client can fire animations and log
 * entries reliably even when logic ticks outrun broadcast ticks.
 */
export type CombatEvent =
  | { kind: 'player-hit';  playerId: string; targetId: string; targetName: string; damage: number; empowered: boolean; execution: boolean; effects?: string[]; playerPos?: Vec2; targetPos?: Vec2 }
  | { kind: 'player-kill'; playerId: string; targetId: string; targetName: string; damage: number; biomeXpGained: number; essenceGained: number; essenceType: EssenceType }
  | { kind: 'monster-dodge'; monsterId: string; targetPos?: Vec2 };
