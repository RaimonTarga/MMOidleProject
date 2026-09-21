import { createHash, timingSafeEqual } from 'node:crypto';

/** Production fails closed. Tokens are runtime secrets, never Vite variables. */
export function adminAuthorized(token: unknown, expected = process.env.ADMIN_TOKEN, production = process.env.NODE_ENV === 'production'): boolean {
  if (!expected) return !production;
  if (expected.length < 32 || typeof token !== 'string' || token.length > 512) return false;
  return timingSafeEqual(createHash('sha256').update(token).digest(), createHash('sha256').update(expected).digest());
}
