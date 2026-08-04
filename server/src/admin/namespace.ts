import type { Namespace, Server, Socket } from 'socket.io';
import type {
  AdminClientToServerEvents,
  AdminServerToClientEvents,
  ClientToServerEvents,
  NodeTelemetrySnapshot,
  ServerToClientEvents,
  AdminAction,
  AdminAnalyticsQuery,
  AdminLogQuery,
  AdminWorldLogQuery,
} from '@mmo-idle/shared';
import type { DB } from '../db/playerRepo';
import type { World } from '../world/World';
import { log, recentAdminLogs, subscribeAdminLogs } from '../log';
import { queryLogs } from '../logdb/repo';
import { queryWorldLogEntries } from '../logdb/worldLogRepo';
import { queryAnalyticsSnapshot } from '../logdb/analyticsRepo';
import { runAdminAction } from './actions';
import { buildPlayerSummaries } from './playerSummaries';
import { listCharacters } from '../db/playerRepo';
import type { PlayerSocketSession } from '../net/socketSession';

export interface AdminNamespaceControls {
  emitPlayerSummaries: () => void;
  emitTelemetry: (snapshot: NodeTelemetrySnapshot) => void;
}

export function registerAdminNamespace(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  world: World,
  gameDb: DB,
  sessionsBySocket: ReadonlyMap<string, PlayerSocketSession>,
  inactiveSockets: ReadonlySet<string>,
): AdminNamespaceControls {
  const admin = io.of('/admin') as unknown as Namespace<
    AdminClientToServerEvents,
    AdminServerToClientEvents
  >;
  let latestTelemetry: NodeTelemetrySnapshot | null = null;

  // TODO: re-add admin authentication before exposing this beyond trusted dev use.

  const emitPlayerSummaries = () => {
    admin.emit(
      'admin:players',
      buildPlayerSummaries(world, sessionsBySocket, inactiveSockets),
    );
  };

  const emitTelemetry = (snapshot: NodeTelemetrySnapshot) => {
    latestTelemetry = snapshot;
    admin.emit('admin:telemetry', snapshot);
  };

  subscribeAdminLogs((entry) => {
    admin.emit('admin:log', entry);
  });

  admin.on('connection', (socket) => {
    log.info({ adminSocketId: socket.id }, 'admin dashboard connected');
    socket.emit(
      'admin:players',
      buildPlayerSummaries(world, sessionsBySocket, inactiveSockets),
    );
    void emitCharacters(socket);
    socket.emit('admin:logs', recentAdminLogs());
    if (latestTelemetry) socket.emit('admin:telemetry', latestTelemetry);

    socket.on('admin:requestPlayers', () => {
      socket.emit(
        'admin:players',
        buildPlayerSummaries(world, sessionsBySocket, inactiveSockets),
      );
    });

    socket.on('admin:requestCharacters', () => {
      void emitCharacters(socket);
    });

    socket.on('admin:requestLogs', (query: AdminLogQuery) => {
      void queryLogs(query)
        .then((logs) => socket.emit('admin:logs', logs))
        .catch((err) => {
          log.warn({ err }, 'admin log query failed');
          socket.emit('admin:error', { message: 'Failed to query logdb.' });
        });
    });

    socket.on('admin:requestWorldLog', (query: AdminWorldLogQuery) => {
      void queryWorldLogEntries(query)
        .then((entries) => socket.emit('admin:worldLog', entries))
        .catch((err) => {
          log.warn({ err }, 'admin world log query failed');
          socket.emit('admin:error', { message: 'Failed to query world event log.' });
        });
    });

    socket.on('admin:requestAnalytics', (query: AdminAnalyticsQuery) => {
      void queryAnalyticsSnapshot(query)
        .then((snapshot) => socket.emit('admin:analytics', snapshot))
        .catch((err) => {
          log.warn({ err }, 'admin analytics query failed');
          socket.emit('admin:error', { message: 'Failed to query analytics.' });
        });
    });

    socket.on('admin:action', (requestId: string, action: AdminAction) => {
      const result = runAdminAction(world, requestId, action);
      socket.emit('admin:actionResult', result);
      emitPlayerSummaries();
    });
  });

  return { emitPlayerSummaries, emitTelemetry };

  async function emitCharacters(
    socket: Socket<AdminClientToServerEvents, AdminServerToClientEvents>,
  ): Promise<void> {
    try {
      socket.emit('admin:characters', await listCharacters(gameDb));
    } catch (err) {
      log.warn({ err }, 'admin character query failed');
      socket.emit('admin:error', { message: 'Failed to query gamedb characters.' });
    }
  }
}
