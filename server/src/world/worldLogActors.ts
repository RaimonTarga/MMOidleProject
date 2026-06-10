import type { WorldLogActor } from '@mmo-idle/shared';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import type { MinionMonsterType } from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../ecs/entity';
import type { World } from './World';

export function actorFromPlayer(player: PlayerEntity): WorldLogActor {
  return {
    id: player.isPlayer.id,
    name: player.isPlayer.name,
    actorType: 'player',
  };
}

export function actorFromMonster(monster: MonsterEntity): WorldLogActor {
  return {
    id: monster.isMonster.id,
    name: monster.isMonster.name,
    actorType: 'monster',
  };
}

export function actorFromMinion(
  minion: MinionEntity,
  ownerPlayerId: string,
): WorldLogActor {
  return {
    id: minion.isMinion.id,
    name: minionDisplayName(minion.isMinion.monsterTypeId),
    actorType: 'minion',
    ownerPlayerId,
  };
}

function minionDisplayName(monsterTypeId: MinionMonsterType): string {
  const monsterName = MONSTER_DATABASE.get(monsterTypeId)?.name;
  if (monsterName) return monsterName;
  switch (monsterTypeId) {
    case 'slime':
      return 'Slime';
    case 'plains-slime':
      return 'Plains Slime';
    case 'cave-lurker':
      return 'Cave Lurker';
    case 'boar':
      return 'Boar';
    case 'mud-toad':
      return 'Mud Toad';
    case 'cliff-hopper':
      return 'Cliff Hopper';
    case 'ridge-archer':
      return 'Ridge Archer';
    case 'crag-behemoth':
      return 'Crag Behemoth';
  }
}

export function actorFromSourceId(
  world: World,
  sourceId: string,
  fallbackName = 'Unknown',
): WorldLogActor {
  const player = world.getPlayerEntity(sourceId);
  if (player) return actorFromPlayer(player);
  const monster = world.getMonsterEntity(sourceId);
  if (monster) return actorFromMonster(monster);
  return { id: sourceId, name: fallbackName, actorType: 'monster' };
}
