import { createHash, randomBytes } from 'crypto';
import { and, eq, isNull, lte } from 'drizzle-orm';
import type { DB } from '../db/playerRepo';
import { sessions } from '../db/schema';

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_LAST_SEEN_TOUCH_MS = 5 * 60 * 1000;

const SESSION_TOKEN_BYTES = 32;
const SESSION_TOKEN_LENGTH = 43;
const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/;

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString('base64url');
}

export function isPlausibleSessionToken(token: string): boolean {
  return token.length === SESSION_TOKEN_LENGTH && SESSION_TOKEN_PATTERN.test(token);
}

export function sessionHasExpired(expiresAt: number | null, now: number): boolean {
  return expiresAt !== null && expiresAt <= now;
}

export type SessionLifetime = 'standard' | 'persistent';

export async function mintSession(
  db: DB,
  accountId: string,
  lifetime: SessionLifetime = 'standard',
): Promise<string> {
  const token = generateSessionToken();
  const now = Date.now();
  await db.insert(sessions).values({
    tokenHash: hashSessionToken(token),
    accountId,
    createdAt: now,
    expiresAt: lifetime === 'persistent' ? null : now + SESSION_TTL_MS,
    lastSeenAt: now,
  });
  return token;
}

export async function validateSessionToken(
  db: DB,
  token: string,
): Promise<string | null> {
  if (!isPlausibleSessionToken(token)) return null;

  const tokenHash = hashSessionToken(token);
  const rows = await db.select().from(sessions)
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);
  const session = rows[0];
  if (!session) return null;

  const now = Date.now();
  if (sessionHasExpired(session.expiresAt, now)) {
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
    return null;
  }

  if (now - session.lastSeenAt >= SESSION_LAST_SEEN_TOUCH_MS) {
    await db.update(sessions)
      .set({ lastSeenAt: now })
      .where(eq(sessions.tokenHash, tokenHash));
  }

  return session.accountId;
}

/** Convert permanent guest credentials into ordinary Discord session lifetimes. */
export async function expirePersistentSessionsForAccount(
  db: DB,
  accountId: string,
  now = Date.now(),
): Promise<void> {
  await db.update(sessions)
    .set({ expiresAt: now + SESSION_TTL_MS })
    .where(and(
      eq(sessions.accountId, accountId),
      isNull(sessions.expiresAt),
    ));
}

export async function revokeSessionToken(db: DB, token: string): Promise<void> {
  if (!isPlausibleSessionToken(token)) return;
  await db.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token)));
}

export async function pruneExpiredSessions(db: DB, now = Date.now()): Promise<number> {
  const deleted = await db.delete(sessions)
    .where(lte(sessions.expiresAt, now))
    .returning({ tokenHash: sessions.tokenHash });
  return deleted.length;
}
