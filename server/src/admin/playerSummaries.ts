import type { AdminPlayerSummary } from '@mmo-idle/shared';
import type { World } from '../world/World';

export function buildPlayerSummaries(
  world: World,
  socketByAccount: ReadonlyMap<string, string>,
  inactiveSockets: ReadonlySet<string>,
): AdminPlayerSummary[] {
  const accountBySocket = new Map<string, string>();
  for (const [accountId, socketId] of socketByAccount) {
    accountBySocket.set(socketId, accountId);
  }

  return [...world.playerEntities].map((player) => ({
    id: player.isPlayer.id,
    accountId: accountBySocket.get(player.isPlayer.id) ?? null,
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
  }));
}
