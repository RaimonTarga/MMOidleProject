/**
 * PARKED 2026-09-05 — nothing currently reaches this on the landing page.
 *
 * A landing visitor no longer boots the Phaser game at all
 * (`isLandingOnlySession` in net/session.ts), so this never runs there. It is
 * kept, unchanged and working, because the readiness question it answers is the
 * hard part of the pane and is unaffected by the defect that parked it: the pane
 * rendered BLACK. See docs/landing-cinematic-current-state.md, section "PARKED:
 * the live spectator pane", for the symptom and the leading hypothesis.
 *
 * ---
 *
 * When is the live spectator actually worth showing?
 *
 * "The Phaser canvas exists" is nowhere near sufficient. `create()` runs as soon
 * as the sprite atlas and shadow definitions land — long before any world state,
 * any biome ground art, or any entity. Crossfading to it then would swap an
 * attractive prerecorded loop for an empty coloured rectangle.
 *
 * So the landing handoff waits on all six conditions below, held for a few
 * consecutive frames so a mid-retarget cannot slip through the gap. If they are
 * never all true — server at spectator capacity, a dead socket, a biome whose
 * art never arrives — nothing happens at all, and the prerecorded loop simply
 * remains the landing background. That is a supported permanent outcome, not a
 * failure path.
 */

import { setSpectatorVisualReady } from '../../auth/lobbyState';
import { DEV_TOOLS_ENABLED } from '../../devTools';
import type { GameScene } from './GameScene';

/**
 * Per-condition state, published on `window.__spectatorReady` in dev builds.
 * Six conditions that must ALL hold means a stalled handoff has six candidate
 * causes; without this you are reduced to guessing which one. `landing:verify`
 * prints it when the handoff does not happen.
 */
export interface SpectatorReadyDiagnostics {
  connected: boolean;
  notPaused: boolean;
  snapshotApplied: boolean;
  cameraScrolled: boolean;
  groundPainted: boolean;
  assetsStreamed: boolean;
  entitiesRendered: boolean;
  stableFrames: number;
  announced: boolean;
}

declare global {
  interface Window {
    __spectatorReady?: SpectatorReadyDiagnostics;
  }
}

/** Consecutive qualifying frames before the handoff is allowed. */
const STABLE_FRAMES = 8;

let stableFrames = 0;
let announced = false;

function evaluate(scene: GameScene): SpectatorReadyDiagnostics {
  return {
    // A paused stream is frozen on whatever frame it stopped at.
    connected: scene.socket?.connected === true,
    notPaused: !scene.spectatorPaused,
    // No snapshot yet means no world at all.
    snapshotApplied: scene.spectatorSnapshotNodeId !== null,
    // Without the first authoritative scroll the pane would snap into place
    // right after the reveal.
    cameraScrolled: scene.cameraScrollReady,
    // Painted ground, not the flat biome fill the slim boot starts with.
    groundPainted: scene.bgWang !== null || scene.bgTile !== null,
    // Effects, emotes and decor stream in after first paint; revealing before
    // they land means art popping in underneath the viewer.
    assetsStreamed: scene.spectatorAssetsReady,
    // A technically-correct but empty node is not worth switching to.
    entitiesRendered: scene.state.ids.size > 0,
    stableFrames: 0,
    announced: false,
  };
}

/**
 * Called once per rendered frame while spectating. Idempotent after it fires:
 * the handoff happens once, and a later hiccup is the live layer's own problem
 * rather than a reason to fade a video back over a working world.
 */
export function tickSpectatorReadiness(scene: GameScene): void {
  if (announced) return;
  const state = evaluate(scene);
  const finished = state.connected
    && state.notPaused
    && state.snapshotApplied
    && state.cameraScrolled
    && state.groundPainted
    && state.assetsStreamed
    && state.entitiesRendered;

  stableFrames = finished ? stableFrames + 1 : 0;
  if (stableFrames >= STABLE_FRAMES) {
    announced = true;
    setSpectatorVisualReady();
  }
  if (DEV_TOOLS_ENABLED) {
    state.stableFrames = stableFrames;
    state.announced = announced;
    window.__spectatorReady = state;
  }
}
