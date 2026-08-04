import type { AdminPlayerSummary } from '@mmo-idle/shared';
import type { World } from '../world/World';
import type { PlayerSocketSession } from '../net/socketSession';

export function buildPlayerSummaries(
  world: World,
  sessionsBySocket: ReadonlyMap<string, PlayerSocketSession>,
  inactiveSockets: ReadonlySet<string>,
): AdminPlayerSummary[] {
  return [...world.playerEntities].flatMap((player) => {
    const session = sessionsBySocket.get(player.isPlayer.id);
    if (!session?.characterId) return [];
    return [{
      id: player.isPlayer.id,
      characterId: session.characterId,
      accountId: session.accountId,
      name: player.isPlayer.name,
      nodeId: player.hasPosition.nodeId,
      hp: player.hasHealth.hp,
      maxHp: player.hasHealth.maxHp,
      level: player.tracksProgression.level,
      playerTier: player.tracksProgression.playerTier,
      skillPoints: player.tracksProgression.skillPoints,
      combatArchetype: player.usesSkills.combatArchetype,
      selectedClass: player.usesSkills.selectedClass,
      selectedSubVariant: player.usesSkills.selectedSubVariant,
      selectedRange: player.usesSkills.selectedRange,
      auto: player.usesAutocombat.auto,
      autoTraverse: player.usesAutocombat.autoTraverse,
      inactive: inactiveSockets.has(player.isPlayer.id),
      isDead: !!player.isDead,
      partyLeaderId: player.inParty?.leaderId ?? null,
      partySize: player.inParty?.members.length ?? 1,
    }];
  });
}
