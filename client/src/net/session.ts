import { SERVER_URL } from './serverUrl';

const SESSION_STORAGE_KEY = 'mmo_session_token';

function consumeSessionFragment(): void {
  const fragment = window.location.hash.slice(1);
  if (!fragment) return;

  const params = new URLSearchParams(fragment);
  const token = params.get('session');
  if (token) localStorage.setItem(SESSION_STORAGE_KEY, token);

  if (params.has('session')) {
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

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
