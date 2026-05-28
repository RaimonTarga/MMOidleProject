import type { PartyMember } from '@mmo-idle/shared';
import type { World } from '../../../world/World';
import type { PlayerEntity } from '../../../ecs/entity';
import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';
import { clearAutoTraversePath } from '../../world/autoTraverse';

/**
 * Single-level parties: one leader + N followers. The `inParty` slice on each
 * player entity is the source of truth — there is no separate manager. A party's
 * members are derived by scanning for everyone sharing a `leaderId`.
 */

/** True when the player is a non-leader member of a party (a follower). */
export function isPartyFollower(player: PlayerEntity): boolean {
  return player.inParty !== undefined && player.inParty.leaderId !== player.isPlayer.id;
}

/** Every player currently in the party led by `leaderId` (leader included). */
function partyMemberEntities(world: World, leaderId: string): PlayerEntity[] {
  const members: PlayerEntity[] = [];
  for (const p of world.playerEntities) {
    if (p.inParty?.leaderId === leaderId) members.push(p);
  }
  return members;
}

export function joinParty(world: World, self: PlayerEntity, targetId: string): void {
  if (targetId === self.isPlayer.id) return;
  const target = world.getPlayerEntity(targetId);
  if (!target) return;

  // Resolve the target's party root — joining anyone joins their leader's party.
  const leaderId = target.inParty?.leaderId ?? target.isPlayer.id;
  // Joining your own follower (or party) resolves back to you — no-op, no cycles.
  if (leaderId === self.isPlayer.id) return;
  if (self.inParty?.leaderId === leaderId) return;

  const affectedLeaders = new Set<string>();

  if (self.inParty?.leaderId === self.isPlayer.id) {
    // Self was a leader: disband the old group — followers become solo.
    for (const follower of partyMemberEntities(world, self.isPlayer.id)) {
      if (follower === self) continue;
      detachComponent(world, follower, 'inParty');
    }
  } else if (self.inParty) {
    // Self was a follower elsewhere — that party needs a re-sync after we leave.
    affectedLeaders.add(self.inParty.leaderId);
  }

  const leader = world.getPlayerEntity(leaderId);
  if (!leader) return;
  if (!leader.inParty) {
    attachComponent(world, leader, 'inParty', { leaderId, members: [] });
  }

  attachComponent(world, self, 'inParty', { leaderId, members: [] });
  clearAutoTraversePath(world, self);

  affectedLeaders.add(leaderId);
  for (const id of affectedLeaders) syncPartyRoster(world, id);
}

export function leaveParty(world: World, self: PlayerEntity): void {
  const party = self.inParty;
  if (!party) return;
  const leaderId = party.leaderId;

  if (leaderId === self.isPlayer.id) {
    // Leader leaving disbands the whole party.
    for (const member of partyMemberEntities(world, leaderId)) {
      detachComponent(world, member, 'inParty');
    }
    return;
  }

  detachComponent(world, self, 'inParty');
  syncPartyRoster(world, leaderId);
}

/**
 * Recompute the roster for a party and stamp it onto every member. Dissolves the
 * party (detaches `inParty`) when fewer than two members remain.
 */
export function syncPartyRoster(world: World, leaderId: string): void {
  const members = partyMemberEntities(world, leaderId);
  if (members.length <= 1) {
    for (const m of members) detachComponent(world, m, 'inParty');
    return;
  }
  // Leader first, then followers.
  members.sort((a, b) =>
    a.isPlayer.id === leaderId ? -1 : b.isPlayer.id === leaderId ? 1 : 0,
  );
  const roster: PartyMember[] = members.map((m) => ({
    id: m.isPlayer.id,
    name: m.isPlayer.name,
  }));
  for (const m of members) {
    attachComponent(world, m, 'inParty', { leaderId, members: roster });
  }
}

/** Clean up party state for a player who is about to disconnect. */
export function handlePartyDisconnect(world: World, playerId: string): void {
  const self = world.getPlayerEntity(playerId);
  if (!self?.inParty) return;
  leaveParty(world, self);
}
