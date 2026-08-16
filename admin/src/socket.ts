import { getDefaultStore } from 'jotai';
import { io, type Socket } from 'socket.io-client';
import type {
  AdminAction,
  AdminAnalyticsQuery,
  AdminClientToServerEvents,
  AdminLogQuery,
  AdminServerToClientEvents,
  AdminWorldLogQuery,
} from '@mmo-idle/shared';
import {
  actionResultsAtom,
  analyticsAtom,
  charactersAtom,
  connectedAtom,
  connectionErrorAtom,
  logsAtom,
  playersAtom,
  telemetryAtom,
  worldLogAtom,
  balanceLabAtom,
} from './state';

type AdminSocket = Socket<AdminServerToClientEvents, AdminClientToServerEvents>;

const SERVER_URL = import.meta.env.DEV ? 'http://localhost:4000/admin' : '/admin';
const MAX_LIVE_LOGS = 2_000;
let socket: AdminSocket | null = null;

export function connectAdminSocket(): void {
  disconnectAdminSocket();
  const store = getDefaultStore();
  store.set(connectionErrorAtom, null);

  socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
  }) as AdminSocket;

  socket.on('connect', () => {
    store.set(connectedAtom, true);
    store.set(connectionErrorAtom, null);
  });
  socket.on('disconnect', () => {
    store.set(connectedAtom, false);
  });
  socket.on('connect_error', (err) => {
    store.set(connectedAtom, false);
    store.set(connectionErrorAtom, err.message);
  });
  socket.on('admin:players', (players) => store.set(playersAtom, players));
  socket.on('admin:balanceLab', (snapshot) => store.set(balanceLabAtom, snapshot));
  socket.on('admin:logs', (logs) => store.set(logsAtom, logs));
  socket.on('admin:worldLog', (entries) => store.set(worldLogAtom, entries));
  socket.on('admin:analytics', (snapshot) => store.set(analyticsAtom, snapshot));
  socket.on('admin:log', (entry) => {
    store.set(logsAtom, (prev) => [...prev, entry].slice(-MAX_LIVE_LOGS));
  });
  socket.on('admin:telemetry', (snapshot) => store.set(telemetryAtom, snapshot));
  socket.on('admin:characters', (characters) => store.set(charactersAtom, characters));
  socket.on('admin:actionResult', (result) => {
    store.set(actionResultsAtom, (prev) => [result, ...prev].slice(0, 20));
  });
  socket.on('admin:error', (payload) => store.set(connectionErrorAtom, payload.message));
}

export function disconnectAdminSocket(): void {
  socket?.disconnect();
  socket = null;
  getDefaultStore().set(connectedAtom, false);
}

export function requestPlayers(): void {
  socket?.emit('admin:requestPlayers');
}

export function requestBalanceLab(): void {
  socket?.emit('admin:requestBalanceLab');
}

export function requestCharacters(): void {
  socket?.emit('admin:requestCharacters');
}

export function requestLogs(query: AdminLogQuery): void {
  socket?.emit('admin:requestLogs', query);
}

export function requestWorldLog(query: AdminWorldLogQuery): void {
  socket?.emit('admin:requestWorldLog', query);
}

export function requestAnalytics(query: AdminAnalyticsQuery): void {
  socket?.emit('admin:requestAnalytics', query);
}

export function sendAdminAction(action: AdminAction): void {
  socket?.emit('admin:action', crypto.randomUUID(), action);
}
