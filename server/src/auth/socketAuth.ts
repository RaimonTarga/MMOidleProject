import type { DB } from '../db/playerRepo';
import { validateSessionToken } from './sessionRepo';

export type SocketAuthKind = 'session' | 'dev' | 'spectator';

export type SocketIdentity = {
  accountId: string;
  kind: 'session' | 'dev';
} | {
  kind: 'spectator';
};

interface SocketAuthPayload {
  token?: unknown;
  devAccountId?: unknown;
  spectate?: unknown;
}

export async function authenticateSocketHandshake(
  db: DB,
  rawAuth: unknown,
): Promise<SocketIdentity | null> {
  const auth = (rawAuth && typeof rawAuth === 'object'
    ? rawAuth
    : {}) as SocketAuthPayload;

  if (typeof auth.token === 'string') {
    const accountId = await validateSessionToken(db, auth.token);
    return accountId ? { accountId, kind: 'session' } : null;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  if (
    !isProduction &&
    process.env.AUTH_DEV_BYPASS === '1' &&
    typeof auth.devAccountId === 'string' &&
    auth.devAccountId.length > 0
  ) {
    return {
      accountId: auth.devAccountId.slice(0, 128),
      kind: 'dev',
    };
  }

  // Anonymous spectating is scrapped for production: the landing page no
  // longer opens a socket, and refusing the handshake here guarantees no
  // spectator snapshots are ever built or sent. Dev keeps it for the bot
  // dashboard's `?watch=` link (DEV_TOOLS mirrors IS_DEV in ../env.ts).
  const spectatingAllowed = !isProduction || process.env.DEV_TOOLS === 'true';
  if (auth.spectate === true && spectatingAllowed) return { kind: 'spectator' };

  return null;
}
