// Anchor session for landing-cinematic capture runs.
//
// A capture needs a real authenticated character standing in the filmed node:
// `onNodeOccupancyChange` freezes a node the moment occupancy hits zero and
// destroys every monster in it, so a spectator session cannot film anything.
//
// Guest accounts are the cheapest credential that requires no Discord round
// trip, but `/auth/guest` rate-limits to 5 per IP per hour — which a normal
// afternoon of clip iteration would burn through in minutes. So the token is
// minted once and cached; every later run reuses the same account and the same
// anchor character.

import fs from 'node:fs';
import path from 'node:path';

export interface AnchorSession {
  token: string;
  mintedAt: number;
  server: string;
}

export async function anchorSessionToken(
  server: string,
  cachePath: string,
): Promise<string> {
  const cached = readCache(cachePath);
  if (cached && cached.server === server) return cached.token;

  const response = await fetch(`${server}/auth/guest`, { method: 'POST' });
  const payload = (await response.json().catch(() => ({}))) as {
    token?: unknown;
    error?: unknown;
  };

  if (!response.ok || typeof payload.token !== 'string') {
    const reason = typeof payload.error === 'string' ? payload.error : response.statusText;
    throw new Error(
      `could not mint an anchor session against ${server}: ${reason}\n`
      + '  (/auth/guest allows 5 per hour per IP — delete the cache only when you must)',
    );
  }

  const session: AnchorSession = {
    token: payload.token,
    mintedAt: Date.now(),
    server,
  };
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, `${JSON.stringify(session, null, 2)}\n`, 'utf8');
  return session.token;
}

function readCache(cachePath: string): AnchorSession | null {
  try {
    const raw = JSON.parse(fs.readFileSync(cachePath, 'utf8')) as AnchorSession;
    return typeof raw?.token === 'string' ? raw : null;
  } catch {
    return null;
  }
}
