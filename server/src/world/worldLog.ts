import type { WorldLogEvent, WorldLogEventInput } from '@mmo-idle/shared';
import type { World } from './World';
import { getPartyMemberIds } from '../systems/player/party/partySystem';

export const WORLD_LOG_JOURNAL_MAX = 2000;

export type WorldLogRecordOpts = {
  visibility: 'combat' | 'node' | 'death';
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
  if (world.worldLogJournal.length > WORLD_LOG_JOURNAL_MAX) {
    world.worldLogJournal.shift();
  }

  for (const playerId of resolveWorldLogRecipients(world, opts)) {
    let q = world.worldLogByPlayer.get(playerId);
    if (!q) {
      q = [];
      world.worldLogByPlayer.set(playerId, q);
    }
    q.push(event);
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

  return out;
}
