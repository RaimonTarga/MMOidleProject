import { randomBytes } from 'crypto';
import type { Express, Request } from 'express';
import type { DB } from '../db/playerRepo';
import { upsertDiscordAccount } from '../db/playerRepo';
import { log } from '../log';
import { mintSession, revokeSessionToken } from './sessionRepo';

const DISCORD_AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';
const DISCORD_TOKEN_URL = 'https://discord.com/api/v10/oauth2/token';
const DISCORD_CURRENT_USER_URL = 'https://discord.com/api/v10/users/@me';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const OAUTH_STATE_LIMIT = 5_000;
const DISCORD_REQUEST_TIMEOUT_MS = 10_000;

interface DiscordAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  clientUrl: string;
}

interface DiscordTokenResponse {
  access_token: string;
}

interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
}

const pendingStates = new Map<string, number>();

function readConfig(): DiscordAuthConfig | null {
  const clientId = process.env.DISCORD_CLIENT_ID?.trim() ?? '';
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim() ?? '';
  const redirectUri = process.env.DISCORD_REDIRECT_URI?.trim()
    ?? (process.env.NODE_ENV === 'production'
      ? ''
      : 'http://localhost:4000/auth/discord/callback');
  const clientUrl = process.env.CLIENT_URL?.trim()
    ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');

  if (!clientId || !clientSecret || !redirectUri || !clientUrl) return null;

  try {
    const parsedRedirect = new URL(redirectUri);
    const parsedClient = new URL(clientUrl);
    if (!['http:', 'https:'].includes(parsedRedirect.protocol)) return null;
    if (!['http:', 'https:'].includes(parsedClient.protocol)) return null;
  } catch {
    return null;
  }

  return { clientId, clientSecret, redirectUri, clientUrl };
}

function pruneOAuthStates(now: number): void {
  for (const [state, expiresAt] of pendingStates) {
    if (expiresAt <= now) pendingStates.delete(state);
  }
}

function issueOAuthState(): string | null {
  const now = Date.now();
  pruneOAuthStates(now);
  if (pendingStates.size >= OAUTH_STATE_LIMIT) return null;

  const state = randomBytes(24).toString('base64url');
  pendingStates.set(state, now + OAUTH_STATE_TTL_MS);
  return state;
}

function consumeOAuthState(state: string): boolean {
  const expiresAt = pendingStates.get(state);
  pendingStates.delete(state);
  return expiresAt !== undefined && expiresAt > Date.now();
}

function stringQueryParam(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

async function exchangeDiscordCode(
  config: DiscordAuthConfig,
  code: string,
): Promise<string> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
  });
  const response = await fetch(DISCORD_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(DISCORD_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Discord token exchange failed (${response.status}).`);

  const payload = await response.json() as Partial<DiscordTokenResponse>;
  if (typeof payload.access_token !== 'string' || payload.access_token.length === 0) {
    throw new Error('Discord token response did not include an access token.');
  }
  return payload.access_token;
}

async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch(DISCORD_CURRENT_USER_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(DISCORD_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Discord user request failed (${response.status}).`);

  const payload = await response.json() as Partial<DiscordUser>;
  if (
    typeof payload.id !== 'string' ||
    !/^\d{5,32}$/.test(payload.id) ||
    typeof payload.username !== 'string'
  ) {
    throw new Error('Discord user response was malformed.');
  }
  return {
    id: payload.id,
    username: payload.username,
    global_name: typeof payload.global_name === 'string' ? payload.global_name : null,
  };
}

function tokenFromLogoutRequest(req: Request): string | null {
  const authorization = req.header('authorization');
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim() || null;
  }
  const body = req.body as { token?: unknown } | undefined;
  return typeof body?.token === 'string' ? body.token : null;
}

export function discordAuthIsConfigured(): boolean {
  return readConfig() !== null;
}

export function registerDiscordAuthRoutes(app: Express, db: DB): void {
  app.get('/auth/discord/login', (_req, res) => {
    const config = readConfig();
    if (!config) {
      res.status(503).send('Discord login is not configured on this server.');
      return;
    }

    const state = issueOAuthState();
    if (!state) {
      res.status(429).send('Too many login attempts. Please try again shortly.');
      return;
    }

    const authorizeUrl = new URL(DISCORD_AUTHORIZE_URL);
    authorizeUrl.search = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      scope: 'identify',
      state,
    }).toString();
    res.redirect(authorizeUrl.toString());
  });

  app.get('/auth/discord/callback', async (req, res) => {
    const config = readConfig();
    if (!config) {
      res.status(503).send('Discord login is not configured on this server.');
      return;
    }

    const state = stringQueryParam(req.query.state);
    const code = stringQueryParam(req.query.code);
    const validState = state ? consumeOAuthState(state) : false;
    if (!validState || !code) {
      res.status(400).send('Invalid or expired Discord login request. Please try again.');
      return;
    }

    try {
      const accessToken = await exchangeDiscordCode(config, code);
      const discordUser = await fetchDiscordUser(accessToken);
      const displayName = (discordUser.global_name ?? discordUser.username).trim()
        || discordUser.username;
      const accountId = await upsertDiscordAccount(
        db,
        discordUser.id,
        displayName,
      );
      const sessionToken = await mintSession(db, accountId);
      const destination = new URL(config.clientUrl);
      destination.hash = `session=${encodeURIComponent(sessionToken)}`;
      res.redirect(destination.toString());
    } catch (err) {
      log.warn({ err }, 'Discord OAuth callback failed');
      res.status(502).send('Discord login failed. Please try again.');
    }
  });

  app.post('/auth/logout', async (req, res) => {
    const token = tokenFromLogoutRequest(req);
    try {
      if (token) await revokeSessionToken(db, token);
      res.sendStatus(204);
    } catch (err) {
      log.warn({ err }, 'session logout failed');
      res.sendStatus(503);
    }
  });
}
