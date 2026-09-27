/**
 * Arena-level boss state that must be torn down from OUTSIDE the script runtime
 * (the kill listener), kept free of the bossScripts -> combat import chain.
 */
import { removeStatusEffect } from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';

/**
 * The room clears with the boss (Swamp Rot Bloom): strip every DoT the boss put on
 * the players in its node and stop the affliction.
 */
export function clearRoomAffliction(world: World, monster: MonsterEntity): void {
  const state = monster.scriptsBoss;
  if (!state?.roomAffliction) return;
  for (const player of world.livePlayersInNode(monster.hasPosition.nodeId)) {
    const debuffIds = player.tracksCombat.statusEffects
      .filter(effect => effect.sourceId === monster.isMonster.id && effect.data.isDot === 1)
      .map(effect => effect.id);
    for (const id of debuffIds) removeStatusEffect(player.tracksCombat, id);
  }
  state.roomAffliction = undefined;
}
