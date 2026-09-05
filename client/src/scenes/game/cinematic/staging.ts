/**
 * Server-side scene staging for a capture run, driven entirely through the
 * existing dev-only debug intents. No new protocol.
 *
 * Order matters: godmode first (the anchor is immortal before anything can reach
 * it), then teleport (which thaws the node and spawns its population), then a
 * respawn so the take starts from a full, freshly placed roster rather than
 * whatever a previous run left behind.
 */

import { sendSetAuto, sendSetAutoTraverse } from '../../../net/intents';
import type { GameSocket } from '../../../net/socket';
import type { GameScene } from '../GameScene';
import { setPhase, type CinematicBeacon, type CinematicSession } from './mode';

/** Let a freshly respawned roster spread out before the camera rolls. */
const SETTLE_MS = 2_500;

export interface CinematicStaging {
  session: CinematicSession;
  beacon: CinematicBeacon;
  enteredWorld: boolean;
  teleported: boolean;
  repopulated: boolean;
  /** Readiness is blocked until this elapsed-ms mark. */
  settleUntilMs: number;
}

export function createCinematicStaging(
  session: CinematicSession,
  beacon: CinematicBeacon,
): CinematicStaging {
  return {
    session,
    beacon,
    enteredWorld: false,
    teleported: false,
    repopulated: false,
    settleUntilMs: Number.POSITIVE_INFINITY,
  };
}

/** Called once the first `state:sync` lands, i.e. the anchor is in the world. */
export function onCinematicEnteredWorld(
  staging: CinematicStaging,
  socket: GameSocket,
): void {
  if (staging.enteredWorld) return;
  staging.enteredWorld = true;
  setPhase(staging.beacon, 'staging', 'in world; staging the node');

  // The anchor must never chase anything: it holds the node thawed and nothing else.
  sendSetAuto(socket, false);
  sendSetAutoTraverse(socket, false);

  socket.emit('debug:equipPhaseTester');
  socket.emit('debug:teleportToNode', staging.session.clip.nodeId);
  staging.teleported = true;
}

/**
 * Per-frame staging follow-up. Repopulating has to wait for the authoritative
 * node change to land, which arrives on a later delta than the teleport emit.
 */
export function tickCinematicStaging(
  scene: GameScene,
  staging: CinematicStaging,
  elapsedMs: number,
): void {
  if (staging.repopulated || !staging.teleported) return;
  if (scene.state.ownNodeId !== staging.session.clip.nodeId) return;

  staging.repopulated = true;
  staging.settleUntilMs = elapsedMs + SETTLE_MS;
  scene.socket.emit('debug:respawnNode');
  setPhase(staging.beacon, 'staging', `node ${staging.session.clip.nodeId} repopulated`);
}

export function stagingSettled(staging: CinematicStaging, elapsedMs: number): boolean {
  return staging.repopulated && elapsedMs >= staging.settleUntilMs;
}
