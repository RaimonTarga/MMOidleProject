import { GAME_CONFIG } from '@mmo-idle/shared';
import type { MinionMonsterType } from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import type { MinionEntity, PlayerEntity } from '../../../../../../ecs/entity';

export function livingMinions(world: World, owner: PlayerEntity): MinionEntity[] {
  const ids = owner.summonsMinions?.minionIds ?? [];
  const out: MinionEntity[] = [];
  for (const id of ids) {
    if (!id) continue;
    const m = world.getMinionEntity(id);
    if (m && m.hasHealth.hp > 0) out.push(m);
  }
  return out;
}

export function livingMinionsOfType(
  world: World,
  owner: PlayerEntity,
  type: MinionMonsterType,
): MinionEntity[] {
  return livingMinions(world, owner).filter(m => m.isMinion.monsterTypeId === type);
}

export function isInCombat(owner: PlayerEntity, now: number): boolean {
  const last = owner.tracksEngagement;
  return last !== undefined && (now - last) < GAME_CONFIG.COMBAT_REGEN_DELAY;
}
