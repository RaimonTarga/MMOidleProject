import { atom, getDefaultStore } from 'jotai';
import { generateGuestName } from '@mmo-idle/shared';
import type {
  CharacterActionResult,
  CharacterCreateResult,
  CharacterSummary,
  AccountCharactersPayload,
  AccountSummary,
  SpectateStatus,
} from '@mmo-idle/shared';
import type { GameSocket } from '../net/socket';
import { resolveCinematicSession } from '../scenes/game/cinematic/mode';
import {
  clearSession,
  createGuestSession,
  hasGuestFirstRun,
  hasPlayerCredential,
  linkDiscord,
  takeGuestFirstRun,
} from '../net/session';

export type AuthPhase = 'login' | 'connecting' | 'select' | 'entering' | 'in-world';

const hasCredential = hasPlayerCredential();

if (!hasCredential) document.documentElement.dataset.spectator = 'true';

export const authPhaseAtom = atom<AuthPhase>(hasCredential ? 'connecting' : 'login');
export const charactersAtom = atom<CharacterSummary[]>([]);
export const accountSummaryAtom = atom<AccountSummary | null>(null);
export const guestFirstRunPendingAtom = atom(hasGuestFirstRun());
export const characterActionBusyAtom = atom(false);
export const authMessageAtom = atom<string | null>(null);
export const spectatorStatusAtom = atom<SpectateStatus | null>(null);
/**
 * True once the live spectator is visually finished enough to replace the
 * prerecorded landing loop. Never resets: the handoff is one-way, and a later
 * hiccup in the live layer is not a reason to fade a video back over it.
 */
export const spectatorVisualReadyAtom = atom(false);

let socket: GameSocket | null = null;
let guestCreationPending = false;
let autoCreatePending = false;
let pendingAutoSelectCharacterId: string | null = null;
const store = getDefaultStore();

/**
 * Dev-only footage capture drives the lobby itself: it needs a character in the
 * world (the anchor that holds the filmed node thawed) with no human to click
 * "Enter World". Null in every normal session and every production build.
 */
const cinematicCapture = resolveCinematicSession() !== null;
let cinematicCreatePending = false;

export function bindLobbySocket(next: GameSocket): void {
  socket = next;
}

export function unbindLobbySocket(bound: GameSocket): void {
  if (socket === bound) socket = null;
}

export function handleSocketConnected(): void {
  if (store.get(authPhaseAtom) === 'login' && hasCredential) {
    store.set(authPhaseAtom, 'connecting');
  }
}

export function handleSocketUnauthorized(): void {
  clearSession();
  store.set(accountSummaryAtom, null);
  store.set(charactersAtom, []);
  store.set(characterActionBusyAtom, false);
  store.set(authMessageAtom, 'Your session has expired. Sign in again to continue.');
  store.set(authPhaseAtom, 'login');
  window.location.reload();
}

export function handleCharacterList(payload: AccountCharactersPayload): void {
  // Capture mode keeps the spectator chrome suppression it set at scene create:
  // a recording wants no sidebars, whatever the session is authenticated as.
  if (!cinematicCapture) delete document.documentElement.dataset.spectator;
  const { account, characters } = payload;
  store.set(accountSummaryAtom, account);
  store.set(charactersAtom, characters);
  store.set(characterActionBusyAtom, false);

  if (cinematicCapture) {
    const anchor = characters[0];
    if (anchor) {
      selectLobbyCharacter(anchor.id);
    } else if (!cinematicCreatePending) {
      cinematicCreatePending = true;
      createLobbyCharacter(generateGuestName());
    }
    return;
  }

  const firstRun = takeGuestFirstRun();

  if (pendingAutoSelectCharacterId) {
    const characterId = pendingAutoSelectCharacterId;
    pendingAutoSelectCharacterId = null;
    window.setTimeout(() => selectLobbyCharacter(characterId), 0);
    return;
  }

  if (account.isGuest && characters.length === 0 && firstRun) {
    store.set(authPhaseAtom, 'entering');
    autoCreatePending = true;
    createLobbyCharacter(firstRun.requestedName ?? generateGuestName());
    return;
  }

  store.set(guestFirstRunPendingAtom, false);
  store.set(authPhaseAtom, 'select');
}

export function setSpectatorVisualReady(): void {
  store.set(spectatorVisualReadyAtom, true);
  // The live pane is the Phaser canvas itself, which lives outside React in
  // `#game-wrapper`. A root data attribute is how CSS gets told it may now be
  // revealed — see `html[data-spectator-ready]` in authGate.css.
  document.documentElement.dataset.spectatorReady = 'true';
}

export function handleSpectateStatus(status: SpectateStatus): void {
  store.set(spectatorStatusAtom, status);
}

export function handleSpectateError(reason: string): void {
  store.set(authMessageAtom, reason);
}

export function handleCreateResult(result: CharacterCreateResult): void {
  store.set(characterActionBusyAtom, false);
  if (autoCreatePending) {
    autoCreatePending = false;
    if (result.success && result.characterId) {
      pendingAutoSelectCharacterId = result.characterId;
      store.set(authMessageAtom, null);
      return;
    }
    store.set(guestFirstRunPendingAtom, false);
    store.set(authPhaseAtom, 'select');
  }
  store.set(
    authMessageAtom,
    result.success ? 'Character created.' : (result.reason ?? 'Unable to create character.'),
  );
}

export async function beginGuestPlay(characterName = ''): Promise<void> {
  if (guestCreationPending) return;
  guestCreationPending = true;
  store.set(characterActionBusyAtom, true);
  store.set(authMessageAtom, null);
  try {
    await createGuestSession(characterName);
  } catch (err) {
    guestCreationPending = false;
    store.set(characterActionBusyAtom, false);
    store.set(
      authMessageAtom,
      err instanceof Error ? err.message : 'Unable to start guest play.',
    );
  }
}

export async function beginDiscordLink(): Promise<void> {
  store.set(characterActionBusyAtom, true);
  store.set(authMessageAtom, null);
  try {
    await linkDiscord();
  } catch (err) {
    store.set(characterActionBusyAtom, false);
    store.set(
      authMessageAtom,
      err instanceof Error ? err.message : 'Unable to link Discord.',
    );
  }
}

export function handleDeleteResult(result: CharacterActionResult): void {
  store.set(characterActionBusyAtom, false);
  store.set(
    authMessageAtom,
    result.success ? 'Character deleted.' : (result.reason ?? 'Unable to delete character.'),
  );
}

export function handleSelectResult(result: CharacterActionResult): void {
  if (result.success) return;
  if (cinematicCapture) {
    // The server emits `character:createResult` and the refreshed roster BEFORE
    // clearing its own mutation guard, so a capture that selects the instant the
    // roster lands can be refused for a few milliseconds. Retry rather than
    // stranding the run in character select with nobody to click the button.
    const anchor = store.get(charactersAtom)[0];
    if (anchor) {
      window.setTimeout(() => selectLobbyCharacter(anchor.id), 250);
      return;
    }
  }
  store.set(characterActionBusyAtom, false);
  store.set(guestFirstRunPendingAtom, false);
  store.set(authMessageAtom, result.reason ?? 'Unable to enter the world.');
  store.set(authPhaseAtom, 'select');
}

export function handleInitialStateSync(): void {
  store.set(characterActionBusyAtom, false);
  store.set(authMessageAtom, null);
  store.set(guestFirstRunPendingAtom, false);
  store.set(authPhaseAtom, 'in-world');
}

export function createLobbyCharacter(name: string): void {
  if (!socket?.connected) {
    store.set(authMessageAtom, 'Still connecting to the server.');
    return;
  }
  store.set(characterActionBusyAtom, true);
  store.set(authMessageAtom, null);
  socket.emit('character:create', { name });
}

export function deleteLobbyCharacter(characterId: string): void {
  if (!socket?.connected) {
    store.set(authMessageAtom, 'Still connecting to the server.');
    return;
  }
  store.set(characterActionBusyAtom, true);
  store.set(authMessageAtom, null);
  socket.emit('character:delete', { characterId });
}

export function selectLobbyCharacter(characterId: string): void {
  if (!socket?.connected) {
    store.set(authMessageAtom, 'Still connecting to the server.');
    return;
  }
  store.set(characterActionBusyAtom, true);
  store.set(authMessageAtom, null);
  store.set(authPhaseAtom, 'entering');
  socket.emit('character:select', { characterId });
}
