import { randomBytes } from 'crypto';
import type { Express, Request } from 'express';
import type { DB } from '../db/playerRepo';
import {
  findAccountByDiscordId,
  findAccountById,
  mergeGuestAccount,
  stampGuestDiscordIdentity,
  upsertDiscordAccount,
} from '../db/playerRepo';
import { log } from '../log';
import {
  expirePersistentSessionsForAccount,
  generateSessionToken,
  hashSessionToken,
  mintSession,
  revokeSessionToken,
  validateSessionToken,
  SESSION_TTL_MS,
} from './sessionRepo';
import { decideDiscordLink } from './linkDecision';

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

type PendingOAuthState = {
  expiresAt: number;
  mode: 'login';
} | {
  expiresAt: number;
  mode: 'link';
  accountId: string;
};

type NewOAuthState =
  | { mode: 'login' }
  | { mode: 'link'; accountId: string };

export interface AccountLinkCoordinator {
  withQuiescedAccounts<T>(
    accountIds: readonly string[],
    work: () => Promise<T>,
  ): Promise<T>;
}

const pendingStates = new Map<string, PendingOAuthState>();

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
  for (const [state, pending] of pendingStates) {
    if (pending.expiresAt <= now) pendingStates.delete(state);
  }
}

function issueOAuthState(
  pending: NewOAuthState,
): string | null {
  const now = Date.now();
  pruneOAuthStates(now);
  if (pendingStates.size >= OAUTH_STATE_LIMIT) return null;

  const state = randomBytes(24).toString('base64url');
  pendingStates.set(state, { ...pending, expiresAt: now + OAUTH_STATE_TTL_MS });
  return state;
}

function consumeOAuthState(state: string): PendingOAuthState | null {
  const pending = pendingStates.get(state);
  pendingStates.delete(state);
  return pending && pending.expiresAt > Date.now() ? pending : null;
}

function stringQueryParam(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function tokenFromRequest(req: Request): string | null {
  const authorization = req.header('authorization');
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim() || null;
  }
  const body = req.body as { token?: unknown } | undefined;
  return typeof body?.token === 'string' ? body.token : null;
}

function buildAuthorizeUrl(config: DiscordAuthConfig, state: string): string {
  const authorizeUrl = new URL(DISCORD_AUTHORIZE_URL);
  authorizeUrl.search = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    scope: 'identify',
    state,
  }).toString();
  return authorizeUrl.toString();
}

function clientDestination(
  config: DiscordAuthConfig,
  params: Record<string, string>,
): string {
  const destination = new URL(config.clientUrl);
  destination.hash = new URLSearchParams(params).toString();
  return destination.toString();
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

async function finishDiscordLink(
  db: DB,
  coordinator: AccountLinkCoordinator,
  sourceAccountId: string,
  discordUser: DiscordUser,
): Promise<{ outcome: 'linked' | 'merged' | 'already_linked'; sessionToken?: string }> {
  const displayName = (discordUser.global_name ?? discordUser.username).trim()
    || discordUser.username;
  const source = await findAccountById(db, sourceAccountId);
  if (!source) throw new Error('Link source account no longer exists.');
  let target = await findAccountByDiscordId(db, discordUser.id);
  const decision = decideDiscordLink(source.id, source.discordId, target?.id ?? null);

  if (decision === 'already_linked') {
    if (source.discordId === discordUser.id) {
      await expirePersistentSessionsForAccount(db, source.id);
    }
    return { outcome: 'already_linked' };
  }

  if (decision === 'stamp') {
    try {
      const linked = await stampGuestDiscordIdentity(
        db,
        source.id,
        discordUser.id,
        displayName,
        Date.now() + SESSION_TTL_MS,
      );
      if (linked) {
        return { outcome: 'linked' };
      }
    } catch (err) {
      // A concurrent callback may have claimed this Discord ID after our read.
      log.debug({ err, accountId: source.id }, 'Discord link stamp raced another claim');
    }
    target = await findAccountByDiscordId(db, discordUser.id);
    if (!target) throw new Error('Discord identity could not be linked.');
    // The race we lost may have been this very account's other callback. Converge
    // with it instead of falling through to a self-merge, whose early return would
    // hand the client a session token that was never inserted.
    if (target.id === source.id) {
      await expirePersistentSessionsForAccount(db, source.id);
      return { outcome: 'already_linked' };
    }
  }

  if (!target) throw new Error('Discord merge target no longer exists.');

  const sessionToken = generateSessionToken();
  await coordinator.withQuiescedAccounts([source.id, target.id], async () => {
    const now = Date.now();
    await mergeGuestAccount(db, source.id, target.id, displayName, {
      tokenHash: hashSessionToken(sessionToken),
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
      lastSeenAt: now,
    });
  });
  return { outcome: 'merged', sessionToken };
}

export function discordAuthIsConfigured(): boolean {
  return readConfig() !== null;
}

export function registerDiscordAuthRoutes(
  app: Express,
  db: DB,
  coordinator: AccountLinkCoordinator,
): void {
  app.get('/auth/discord/login', (_req, res) => {
    const config = readConfig();
    if (!config) {
      res.status(503).send('Discord login is not configured on this server.');
      return;
    }

    const state = issueOAuthState({ mode: 'login' });
    if (!state) {
      res.status(429).send('Too many login attempts. Please try again shortly.');
      return;
    }

    res.redirect(buildAuthorizeUrl(config, state));
  });

  app.post('/auth/discord/link/start', async (req, res) => {
    const config = readConfig();
    if (!config) {
      res.status(503).json({ error: 'Discord login is not configured on this server.' });
      return;
    }

    const token = tokenFromRequest(req);
    const accountId = token ? await validateSessionToken(db, token) : null;
    if (!accountId) {
      res.status(401).json({ error: 'Your session is no longer valid.' });
      return;
    }

    const account = await findAccountById(db, accountId);
    if (!account) {
      res.status(401).json({ error: 'Your account is no longer available.' });
      return;
    }
    if (account.discordId !== null) {
      res.status(409).json({ error: 'This account is already linked to Discord.' });
      return;
    }

    const state = issueOAuthState({ mode: 'link', accountId });
    if (!state) {
      res.status(429).json({ error: 'Too many link attempts. Please try again shortly.' });
      return;
    }
    res.json({ authorizeUrl: buildAuthorizeUrl(config, state) });
  });

  app.get('/auth/discord/callback', async (req, res) => {
    const config = readConfig();
    if (!config) {
      res.status(503).send('Discord login is not configured on this server.');
      return;
    }

    const state = stringQueryParam(req.query.state);
    const code = stringQueryParam(req.query.code);
    const pending = state ? consumeOAuthState(state) : null;
    if (!pending || !code) {
      res.status(400).send('Invalid or expired Discord login request. Please try again.');
      return;
    }

    try {
      const accessToken = await exchangeDiscordCode(config, code);
      const discordUser = await fetchDiscordUser(accessToken);
      const displayName = (discordUser.global_name ?? discordUser.username).trim()
        || discordUser.username;

      if (pending.mode === 'login') {
        const accountId = await upsertDiscordAccount(db, discordUser.id, displayName);
        const sessionToken = await mintSession(db, accountId);
        res.redirect(clientDestination(config, { session: sessionToken }));
        return;
      }

      const result = await finishDiscordLink(
        db,
        coordinator,
        pending.accountId,
        discordUser,
      );
      const params: Record<string, string> = { link: result.outcome };
      if (result.sessionToken) params.session = result.sessionToken;
      res.redirect(clientDestination(config, params));
    } catch (err) {
      log.warn({ err, mode: pending.mode }, 'Discord OAuth callback failed');
      if (pending.mode === 'link') {
        res.redirect(clientDestination(config, { link: 'error' }));
      } else {
        res.status(502).send('Discord login failed. Please try again.');
      }
    }
  });

  app.post('/auth/logout', async (req, res) => {
    const token = tokenFromRequest(req);
    try {
      if (token) await revokeSessionToken(db, token);
      res.sendStatus(204);
    } catch (err) {
      log.warn({ err }, 'session logout failed');
      res.sendStatus(503);
    }
  });
}
