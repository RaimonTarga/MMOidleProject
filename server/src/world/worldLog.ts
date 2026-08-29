import type { WorldLogEvent, WorldLogEventInput } from '@mmo-idle/shared';
import type { World } from './World';
import { getPartyMemberIds } from '../systems/player/party/partySystem';

export const WORLD_LOG_JOURNAL_MAX = 2000;

export type WorldLogRecordOpts = {
  visibility: 'combat' | 'node' | 'death' | 'global';
  relatedPlayerIds: string[];
  nodeId: string;
};

export function recordWorldLogEvent(
  world: World,
  partial: WorldLogEventInput,
  opts: WorldLogRecordOpts,
): void {
  const event = {
    ...partial,
    id: world.nextWorldLogId++,
    tick: world.tickCounter,
    serverTime: Date.now(),
  } as WorldLogEvent;

  world.worldLogJournal.push(event);
  const maxLen = world.worldLogJournalMax ?? WORLD_LOG_JOURNAL_MAX;
  if (world.worldLogJournal.length > maxLen) {
    world.worldLogJournal.shift();
  }

  for (const playerId of resolveWorldLogRecipients(world, opts)) {
    let q = world.worldLogByPlayer.get(playerId);
    if (!q) {
      q = [];
      world.worldLogByPlayer.set(playerId, q);
    }
    q.push(event);
    // The human recorder observes exactly the same authoritative event stream
    // delivered to this player. It never drains or changes the normal log queue.
    world.humanPlaytests?.recordWorldEvent(playerId, event);
  }
}

export function takeWorldLogEvents(
  world: World,
  playerId: string,
): WorldLogEvent[] {
  const events = world.worldLogByPlayer.get(playerId) ?? [];
  world.worldLogByPlayer.set(playerId, []);
  return events;
}

function resolveWorldLogRecipients(
  world: World,
  opts: WorldLogRecordOpts,
): Set<string> {
  const out = new Set<string>();

  for (const id of opts.relatedPlayerIds) out.add(id);

  if (opts.visibility === 'combat' || opts.visibility === 'death') {
    for (const id of opts.relatedPlayerIds) {
      for (const memberId of getPartyMemberIds(world, id)) out.add(memberId);
    }
  }

  if (
    opts.visibility === 'node' ||
    opts.visibility === 'death' ||
    opts.visibility === 'combat'
  ) {
    for (const p of world.livePlayersInNode(opts.nodeId)) {
      out.add(p.isPlayer.id);
    }
  }

  if (opts.visibility === 'global') {
    for (const p of world.playerEntities) {
      out.add(p.isPlayer.id);
    }
  }

  return out;
}
