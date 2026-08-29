import { io, type Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  DeltaSnapshot,
  PlayerDeathPayload,
  WorldLogEvent,
  BossFelledMarker,
  ReleaseAnnouncementPayload,
  CharacterActionResult,
  CharacterCreateResult,
  CharacterSummary,
  AccountCharactersPayload,
  SpectateStatus,
  HumanPlaytestStatus,
} from '@mmo-idle/shared';
import { getSessionToken, watchTargetFromUrl } from './session';
import { SERVER_URL } from './serverUrl';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function connectGameSocket(): GameSocket {
  const token = getSessionToken();
  const devAccountId = import.meta.env.VITE_AUTH_DEV_ACCOUNT_ID as string | undefined;
  // An explicit `?watch=` link is always an anonymous spectator session, even
  // for a signed-in developer: authenticating would enter the character lobby
  // and there would be no camera to pin.
  const auth = watchTargetFromUrl()
    ? { spectate: true }
    : token
      ? { token }
      : devAccountId
        ? { devAccountId }
        : { spectate: true };
  return io(SERVER_URL, { auth }) as GameSocket;
}

export interface SocketHandlers {
  onConnect(socket: GameSocket): void;
  onUnauthorized(): void;
  onDisconnect(): void;
  onCharacterList(payload: AccountCharactersPayload): void;
  onCharacterCreateResult(result: CharacterCreateResult): void;
  onCharacterDeleteResult(result: CharacterActionResult): void;
  onCharacterSelectResult(result: CharacterActionResult): void;
  onStateSync(snapshot: DeltaSnapshot): void;
  onDelta(snapshot: DeltaSnapshot): void;
  onNodePreparing(payload: { nodeId: string }): void;
  onCraftResult(result: { success: boolean; reason?: string }): void;
  onRuneCraftResult(result: { recipeId: string; success: boolean; reason?: string }): void;
  onAbilityCraftResult(result: { recipeId: string; success: boolean; reason?: string }): void;
  onStanceCraftResult(result: { recipeId: string; success: boolean; reason?: string }): void;
  onRiteCraftResult(result: { recipeId: string; success: boolean; reason?: string }): void;
  onBuildLoadoutResult(result: { system: "runes" | "stances" | "rites"; success: boolean; reason?: string }): void;
  onUpgradeResult(result: { success: boolean; reason?: string; itemId: string; newLevel: number }): void;
  onPlayerDied(payload: PlayerDeathPayload): void;
  onPlayerAscended(tier: number): void;
  onOverlordFelled(): void;
  onBossFelled(markers: BossFelledMarker[]): void;
  onWorldEvents(events: WorldLogEvent[]): void;
  onUpdateAnnouncement(payload: ReleaseAnnouncementPayload): void;
  onSessionKicked(): void;
  onSpectateSnapshot(snapshot: DeltaSnapshot): void;
  onSpectateStatus(status: SpectateStatus): void;
  onSpectateError(reason: string): void;
  /** Dev-only: server-global kill-reward multiplier changed (or initial value). */
  onRewardMultiplier(multiplier: number): void;
  onHumanPlaytestStatus(status: HumanPlaytestStatus): void;
}

export function wireSocketHandlers(
  socket: GameSocket,
  h: SocketHandlers,
): () => void {
  socket.on('connect', () => h.onConnect(socket));
  socket.on('connect_error', (error) => {
    if (error.message === 'unauthorized') h.onUnauthorized();
  });
  socket.on('disconnect', () => h.onDisconnect());
  socket.on('account:characters', (p) => h.onCharacterList(p));
  socket.on('character:createResult', (r) => h.onCharacterCreateResult(r));
  socket.on('character:deleteResult', (r) => h.onCharacterDeleteResult(r));
  socket.on('character:selectResult', (r) => h.onCharacterSelectResult(r));
  socket.on('state:sync', (s) => h.onStateSync(s));
  socket.on('node:delta', (s) => h.onDelta(s));
  socket.on('spectate:snapshot', (s) => h.onSpectateSnapshot(s));
  socket.on('spectate:status', (s) => h.onSpectateStatus(s));
  socket.on('spectate:error', (p) => h.onSpectateError(p.reason));
  socket.on('node:preparing', (p) => h.onNodePreparing(p));
  socket.on('crafting:result', (r) => h.onCraftResult(r));
  socket.on('rune:craftResult', (r) => h.onRuneCraftResult(r));
  socket.on('ability:craftResult', (r) => h.onAbilityCraftResult(r));
  socket.on('stance:craftResult', (r) => h.onStanceCraftResult(r));
  socket.on('rite:craftResult', (r) => h.onRiteCraftResult(r));
  socket.on('build:loadoutResult', (r) => h.onBuildLoadoutResult(r));
  socket.on('inventory:upgradeResult', (r) => h.onUpgradeResult(r));
  socket.on('player:died', (p) => h.onPlayerDied(p));
  socket.on('player:ascended', (t) => h.onPlayerAscended(t));
  socket.on('overlord:felled', () => h.onOverlordFelled());
  socket.on('world:bossFelled', (m) => h.onBossFelled(m));
  socket.on('world:events', (e) => h.onWorldEvents(e));
  socket.on('game:updateAnnouncement', (p) => h.onUpdateAnnouncement(p));
  socket.on('debug:rewardMultiplier', (m) => h.onRewardMultiplier(m));
  socket.on('debug:playtestStatus', (s) => h.onHumanPlaytestStatus(s));
  socket.on('session:kicked', () => {
    socket.io.reconnection(false);
    h.onSessionKicked();
  });

  return () => {
    socket.off('connect');
    socket.off('connect_error');
    socket.off('disconnect');
    socket.off('account:characters');
    socket.off('character:createResult');
    socket.off('character:deleteResult');
    socket.off('character:selectResult');
    socket.off('state:sync');
    socket.off('node:delta');
    socket.off('spectate:snapshot');
    socket.off('spectate:status');
    socket.off('spectate:error');
    socket.off('node:preparing');
    socket.off('crafting:result');
    socket.off('rune:craftResult');
    socket.off('ability:craftResult');
    socket.off('stance:craftResult');
    socket.off('rite:craftResult');
    socket.off('build:loadoutResult');
    socket.off('inventory:upgradeResult');
    socket.off('player:died');
    socket.off('player:ascended');
    socket.off('overlord:felled');
    socket.off('world:bossFelled');
    socket.off('world:events');
    socket.off('game:updateAnnouncement');
    socket.off('debug:rewardMultiplier');
    socket.off('debug:playtestStatus');
    socket.off('session:kicked');
  };
}
