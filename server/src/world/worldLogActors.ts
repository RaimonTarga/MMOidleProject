import { classKitFor, type WorldLogActor } from '@mmo-idle/shared';
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
    name: rosterPieceName(minion.isMinion.slotId) ?? minionDisplayName(minion.isMinion.monsterTypeId),
    actorType: 'minion',
    ownerPlayerId,
  };
}

/**
 * The Conduit piece a class-first roster slot fields (`<pieceId>#<n>`): its own name
 * (Thrall, Plains Warden, a Soul's name...), so the log never says "Your Summon".
 */
function rosterPieceName(slotId: string | undefined): string | null {
  if (!slotId) return null;
  const pieceId = slotId.split('#')[0];
  const kit = classKitFor('summoner');
  return kit.pieces.find((piece) => piece.id === pieceId)?.name
    ?? kit.trophies.find((trophy) => trophy.id === pieceId)?.name
    ?? null;
}

/** The pre-rework body names, for a slot that names no kit piece. */
function minionDisplayName(monsterTypeId: MinionMonsterType): string {
  switch (monsterTypeId) {
    case 'conduit-summon':
      return 'Summon';
    case 'conduit-summon-splinter':
      return 'Splinter';
    case 'conduit-summon-inquisitor':
      return 'Inquisitor';
    case 'conduit-summon-kilnmaster':
      return 'Kilnmaster';
    case 'conduit-summon-iconoclast':
      return 'Iconoclast';
    case 'conduit-summon-consort':
      return 'Consort';
    case 'conduit-summon-marshal':
      return 'Marshal';
    case 'conduit-summon-chorister':
      return 'Chorister';
    case 'conduit-summon-ritualist':
      return 'Ritualist';
    case 'conduit-summon-effigy':
      return 'Effigy';
    case 'conduit-summon-covenanter-offense':
      return 'Covenanter Offense';
    case 'conduit-summon-covenanter-defense':
      return 'Covenanter Defense';
    case 'conduit-summon-champion':
      return 'Champion';
    case 'conduit-summon-idolwright':
      return 'Idolwright';
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
