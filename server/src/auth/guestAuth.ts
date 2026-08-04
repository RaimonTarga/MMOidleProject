import type { Express, Request } from 'express';
import type { DB } from '../db/playerRepo';
import { createGuestAccount } from '../db/playerRepo';
import { log } from '../log';
import { mintSession } from './sessionRepo';

const GUEST_CREATION_LIMIT = 5;
const GUEST_CREATION_WINDOW_MS = 60 * 60 * 1_000;
const GUEST_RATE_LIMIT_BUCKETS = 10_000;

export class GuestCreationRateLimiter {
  private readonly attemptsByIp = new Map<string, number[]>();

  allow(ip: string, now = Date.now()): boolean {
    const cutoff = now - GUEST_CREATION_WINDOW_MS;
    const recent = (this.attemptsByIp.get(ip) ?? []).filter((value) => value > cutoff);
    if (recent.length >= GUEST_CREATION_LIMIT) {
      this.attemptsByIp.set(ip, recent);
      return false;
    }
    if (!this.attemptsByIp.has(ip) && this.attemptsByIp.size >= GUEST_RATE_LIMIT_BUCKETS) {
      this.prune(cutoff);
      if (this.attemptsByIp.size >= GUEST_RATE_LIMIT_BUCKETS) return false;
    }
    recent.push(now);
    this.attemptsByIp.set(ip, recent);
    return true;
  }

  private prune(cutoff: number): void {
    for (const [ip, attempts] of this.attemptsByIp) {
      const recent = attempts.filter((value) => value > cutoff);
      if (recent.length === 0) this.attemptsByIp.delete(ip);
      else this.attemptsByIp.set(ip, recent);
    }
  }
}

function requestIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function registerGuestAuthRoute(app: Express, db: DB): void {
  const limiter = new GuestCreationRateLimiter();

  app.post('/auth/guest', async (req, res) => {
    if (!limiter.allow(requestIp(req))) {
      res.status(429).json({ error: 'Too many guest accounts created. Please try again later.' });
      return;
    }

    try {
      const account = await createGuestAccount(db);
      const token = await mintSession(db, account.id, 'persistent');
      res.status(201).json({ token });
    } catch (err) {
      log.warn({ err }, 'guest account creation failed');
      res.status(503).json({ error: 'Unable to start guest play right now.' });
    }
  });
}
