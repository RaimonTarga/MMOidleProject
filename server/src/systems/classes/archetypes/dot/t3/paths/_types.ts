import type { CombatContext } from '../../../../../combat/engine/combatPipeline';
import type { MonsterEntity, PlayerEntity } from '../../../../../../ecs/entity';
import type { TracksCombat } from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';

/** CombatContext narrowed to attacker=player, defender=monster. */
export type PlayerHitsMonsterCtx = Extract<
  CombatContext,
  { attackerType: 'player'; defenderType: 'monster' }
>;

/**
 * Bag passed to every `tryFoo(pc)` path handler. Lets us add new fields once
 * (the `onHit` listener fills them in) instead of changing every path
 * signature.
 *
 * Conventions:
 *   - `tryFoo` returns true if the handler claimed the hit (caller short-circuits).
 *   - `applyFoo` returns void — caller continues to the next path.
 */
export interface DotT3PathContext {
  ctx:            PlayerHitsMonsterCtx;
  world:          World;
  player:         PlayerEntity;
  monster:        MonsterEntity;
  monsterState:   TracksCombat;
  maxStacks:      number;
  convPct:        number;
  tickIntervalMs: number;
  durationMs:     number;
  dmgPerStack:    number;
}
