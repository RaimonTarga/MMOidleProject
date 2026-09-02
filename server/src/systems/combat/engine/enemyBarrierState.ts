import {
  MONSTER_DATABASE,
  type HasStatus,
} from '@mmo-idle/shared';
import type { World } from '../../../world/World';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import { refreshEnemyShieldState } from './monsterMechanics';

type EnemyBarrierView = NonNullable<HasStatus['enemyBarrier']>;

function sameBarrier(
  a: EnemyBarrierView | undefined,
  b: EnemyBarrierView | undefined,
): boolean {
  return (
    a?.amount === b?.amount &&
    a?.maxAmount === b?.maxAmount &&
    a?.remainingMs === b?.remainingMs &&
    a?.totalMs === b?.totalMs &&
    a?.rechargeRemainingMs === b?.rechargeRemainingMs &&
    a?.rechargeTotalMs === b?.rechargeTotalMs
  );
}

/** Mirror authoritative monster absorb pools to the client after combat resolves. */
export function syncEnemyBarrierState(world: World, now: number): void {
  for (const monster of world.monsterEntities) {
    let next: EnemyBarrierView | undefined;

    const ward = monster.tracksCombat.statusEffects.find(effect =>
      effect.remainingMs > 0 &&
      effect.data.monsterWard === 1 &&
      (effect.data.wardAmount ?? 0) > 0,
    );
    if (ward) {
      next = {
        amount: Math.max(0, Math.round(ward.data.wardAmount ?? 0)),
        maxAmount: Math.max(1, Math.round(ward.data.wardMaxAmount ?? ward.data.wardAmount ?? 1)),
        remainingMs: ward.remainingMs,
        totalMs: Math.max(1, Math.round(ward.data.totalMs ?? ward.remainingMs)),
      };
    } else if (monster.hasAggroTarget) {
      const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
      const runtime = refreshEnemyShieldState(monster, def, now);
      if (runtime) {
        const active = runtime.amount > 0 && now < runtime.expiresAt;
        const cleanMs = runtime.shield.rechargeAfterCleanMs;
        const rechargeAt = cleanMs !== undefined
          ? Math.max(runtime.expiresAt, runtime.lastHitAt + cleanMs)
          : runtime.nextAt;
        next = {
          amount: active ? runtime.amount : 0,
          maxAmount: Math.max(1, Math.round(monster.hasHealth.maxHp * runtime.shield.shieldPct)),
          remainingMs: active ? Math.max(0, runtime.expiresAt - now) : 0,
          totalMs: runtime.shield.durationMs,
          ...(!active && rechargeAt > now
            ? {
                rechargeRemainingMs: rechargeAt - now,
                rechargeTotalMs: cleanMs ?? runtime.shield.intervalMs,
              }
            : {}),
        };

        if (runtime.activated) {
          world.pushEvent(monster.hasPosition.nodeId, {
            kind: 'boss-fx',
            monsterId: monster.isMonster.id,
            pos: { ...monster.hasPosition.current },
            fx: 'shield',
          });
        }
      }
    }

    if (sameBarrier(monster.hasStatus.enemyBarrier, next)) continue;
    monster.hasStatus.enemyBarrier = next;
    markSliceDirty(world, monster, 'hasStatus');
  }
}
