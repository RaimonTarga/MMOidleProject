import { io, type Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  NodeSnapshot,
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
  onSnapshot(snapshot: NodeSnapshot): void;
  onCraftResult(result: { success: boolean; reason?: string }): void;
  onPlayerDied(): void;
  onPlayerAscended(tier: number): void;
}

export function wireSocketHandlers(
  socket: GameSocket,
  h: SocketHandlers,
): void {
  socket.on('connect', () => h.onConnect(socket));
  socket.on('disconnect', () => h.onDisconnect());
  socket.on('state:sync', (s) => h.onSnapshot(s));
  socket.on('node:state', (s) => h.onSnapshot(s));
  socket.on('crafting:result', (r) => h.onCraftResult(r));
  socket.on('player:died', () => h.onPlayerDied());
  socket.on('player:ascended', (t) => h.onPlayerAscended(t));
}
