import { SERVER_URL } from './serverUrl';

const SESSION_STORAGE_KEY = 'mmo_session_token';
const GUEST_FIRST_RUN_KEY = 'mmo_guest_first_run';
const GUEST_FIRST_RUN_NAME_KEY = 'mmo_guest_first_run_name';

export interface SessionNotice {
  tone: 'success' | 'error';
  message: string;
}

let pendingSessionNotice: SessionNotice | null = null;

function consumeSessionFragment(): void {
  const fragment = window.location.hash.slice(1);
  if (!fragment) return;

  const params = new URLSearchParams(fragment);
  const token = params.get('session');
  if (token) localStorage.setItem(SESSION_STORAGE_KEY, token);

  const linkOutcome = params.get('link');
  if (linkOutcome === 'linked') {
    pendingSessionNotice = {
      tone: 'success',
      message: 'Discord linked. Your progress is now protected.',
    };
  } else if (linkOutcome === 'merged') {
    pendingSessionNotice = {
      tone: 'success',
      message: 'Discord linked. Your characters have been merged.',
    };
  } else if (linkOutcome === 'already_linked') {
    pendingSessionNotice = {
      tone: 'success',
      message: 'This account is already linked to Discord.',
    };
  } else if (linkOutcome === 'error') {
    pendingSessionNotice = {
      tone: 'error',
      message: 'Discord linking failed. Your guest progress is unchanged.',
    };
  }

  if (params.has('session') || params.has('link')) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }
}

consumeSessionFragment();

export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_STORAGE_KEY);
}

export function hasPlayerCredential(): boolean {
  const devAccountId = import.meta.env.VITE_AUTH_DEV_ACCOUNT_ID as string | undefined;
  return Boolean(getSessionToken() || devAccountId);
}

export function isSpectatorSession(): boolean {
  return !hasPlayerCredential();
}

export function loginWithDiscord(): void {
  window.location.assign(`${SERVER_URL}/auth/discord/login`);
}

export async function createGuestSession(characterName = ''): Promise<void> {
  const response = await fetch(`${SERVER_URL}/auth/guest`, { method: 'POST' });
  const payload = await response.json().catch(() => ({})) as {
    token?: unknown;
    error?: unknown;
  };
  if (!response.ok || typeof payload.token !== 'string') {
    throw new Error(
      typeof payload.error === 'string' ? payload.error : 'Unable to start guest play.',
    );
  }
  localStorage.setItem(SESSION_STORAGE_KEY, payload.token);
  sessionStorage.setItem(GUEST_FIRST_RUN_KEY, '1');
  const requestedName = characterName.trim();
  if (requestedName) sessionStorage.setItem(GUEST_FIRST_RUN_NAME_KEY, requestedName);
  else sessionStorage.removeItem(GUEST_FIRST_RUN_NAME_KEY);
  window.location.reload();
}

export function hasGuestFirstRun(): boolean {
  return sessionStorage.getItem(GUEST_FIRST_RUN_KEY) === '1';
}

export interface GuestFirstRunRequest {
  requestedName: string | null;
}

export function takeGuestFirstRun(): GuestFirstRunRequest | null {
  if (!hasGuestFirstRun()) return null;
  const requestedName = sessionStorage.getItem(GUEST_FIRST_RUN_NAME_KEY)?.trim() || null;
  sessionStorage.removeItem(GUEST_FIRST_RUN_KEY);
  sessionStorage.removeItem(GUEST_FIRST_RUN_NAME_KEY);
  return { requestedName };
}

export async function linkDiscord(): Promise<void> {
  const token = getSessionToken();
  if (!token) throw new Error('No guest session is available to link.');

  const response = await fetch(`${SERVER_URL}/auth/discord/link/start`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => ({})) as {
    authorizeUrl?: unknown;
    error?: unknown;
  };
  if (!response.ok || typeof payload.authorizeUrl !== 'string') {
    throw new Error(
      typeof payload.error === 'string' ? payload.error : 'Unable to start Discord linking.',
    );
  }
  window.location.assign(payload.authorizeUrl);
}

export function takeSessionNotice(): SessionNotice | null {
  const notice = pendingSessionNotice;
  pendingSessionNotice = null;
  return notice;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
