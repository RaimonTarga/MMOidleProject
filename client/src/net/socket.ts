import { io, type Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  DeltaSnapshot,
  PlayerDeathPayload,
  WorldLogEvent,
  BossFelledMarker,
  ReleaseAnnouncementPayload,
} from '@mmo-idle/shared';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = import.meta.env.DEV
  ? 'http://localhost:4000'
  : window.location.origin;

export function connectGameSocket(auth: {
  accountId: string;
  displayName: string;
}): GameSocket {
  return io(SERVER_URL, { auth }) as GameSocket;
}

export interface SocketHandlers {
  onConnect(socket: GameSocket): void;
  onDisconnect(): void;
  onDelta(snapshot: DeltaSnapshot): void;
  onNodePreparing(payload: { nodeId: string }): void;
  onCraftResult(result: { success: boolean; reason?: string }): void;
  onRuneCraftResult(result: { recipeId: string; success: boolean; reason?: string }): void;
  onUpgradeResult(result: { success: boolean; reason?: string; itemId: string; newLevel: number }): void;
  onPlayerDied(payload: PlayerDeathPayload): void;
  onPlayerAscended(tier: number): void;
  onOverlordFelled(): void;
  onBossFelled(markers: BossFelledMarker[]): void;
  onWorldEvents(events: WorldLogEvent[]): void;
  onUpdateAnnouncement(payload: ReleaseAnnouncementPayload): void;
  onSessionKicked(): void;
}

export function wireSocketHandlers(
  socket: GameSocket,
  h: SocketHandlers,
): void {
  socket.on('connect', () => h.onConnect(socket));
  socket.on('disconnect', () => h.onDisconnect());
  socket.on('state:sync', (s) => h.onDelta(s));
  socket.on('node:delta', (s) => h.onDelta(s));
  socket.on('node:preparing', (p) => h.onNodePreparing(p));
  socket.on('crafting:result', (r) => h.onCraftResult(r));
  socket.on('rune:craftResult', (r) => h.onRuneCraftResult(r));
  socket.on('inventory:upgradeResult', (r) => h.onUpgradeResult(r));
  socket.on('player:died', (p) => h.onPlayerDied(p));
  socket.on('player:ascended', (t) => h.onPlayerAscended(t));
  socket.on('overlord:felled', () => h.onOverlordFelled());
  socket.on('world:bossFelled', (m) => h.onBossFelled(m));
  socket.on('world:events', (e) => h.onWorldEvents(e));
  socket.on('game:updateAnnouncement', (p) => h.onUpdateAnnouncement(p));
  socket.on('session:kicked', () => {
    socket.io.reconnection(false);
    h.onSessionKicked();
  });
}
