import type { WorldLogActor } from '@mmo-idle/shared';
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
  switch (monsterTypeId) {
    case 'conduit-summon':
      return 'Summon';
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
