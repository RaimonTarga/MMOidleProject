/**
 * Dev-only cinematic capture mode.
 *
 * `?cinematic=<clipId>` runs an authored clip from `clips.ts`.
 * `?cinematicNode=<nodeId>[&cinematicAt=x,y]` parks the camera in one node
 * without moving it — the scouting mode the node-comparison sweep uses.
 *
 * Both are gated on DEV_TOOLS_ENABLED, so a production build resolves them to
 * null and every consumer falls through to normal gameplay. Nothing here runs on
 * the shipped landing page: visitors get the ENCODED VIDEO, never a live render.
 */

import { GAME_CONFIG, NODE_BIOMES } from '@mmo-idle/shared';
import { DEV_TOOLS_ENABLED } from '../../../devTools';
import { cinematicClipById, type CinematicClip } from './clips';

export interface CinematicSession {
  clip: CinematicClip;
  /** Scouting parks the camera and never advances the path. */
  scout: boolean;
  /**
   * How far along the path ONE RENDERED FRAME advances, in ms.
   *
   * The path is stepped per frame rather than per millisecond because the
   * recorder samples the compositor on a fixed grid, and real frame deltas are
   * not on that grid. A late frame used to carry its extra milliseconds into
   * the camera, which the recorder then sampled as a double-length jump right
   * after a stalled one — the measured stutter. One frame, one step: an
   * unevenly-timed frame costs a repeat, never a lurch.
   *
   * Paired with the matching `fps.limit` on the Phaser game (see `main.ts`), so
   * a frame really is 1/fps of wall clock and the clip runs at its authored
   * length.
   */
  frameStepMs: number;
}

/** Capture frame rate: the recorder's rate, which the render must match. */
const DEFAULT_CAPTURE_FPS = 25;

/**
 * The frame-rate cap a capture run needs on the Phaser game itself, or null in
 * any normal session. Read by `main.ts` before the game is constructed, so it
 * cannot go through the scene's own session object.
 */
export function cinematicRenderFps(): number | null {
  if (!DEV_TOOLS_ENABLED || typeof window === 'undefined') return null;
  if (!param('cinematic')) return null;
  return captureFps();
}

function captureFps(): number {
  const raw = Number(param('cinematicFps'));
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CAPTURE_FPS;
}

/**
 * Progress beacon the capture driver polls. Deliberately a plain object on
 * `window` rather than an event: Playwright can `waitForFunction` against it
 * without a subscription, and a stalled run reports WHY it stalled.
 */
export interface CinematicBeacon {
  clipId: string;
  nodeId: string;
  /** Coarse stage, for diagnosing a run that never reaches `ready`. */
  phase: 'booting' | 'lobby' | 'entering' | 'staging' | 'ready' | 'running' | 'done';
  /** Assets painted, node correct, camera armed — safe to start recording. */
  ready: boolean;
  /** The path finished. */
  done: boolean;
  /** 0..1 through the path. */
  progress: number;
  /** Last thing that changed the phase, shown when a run times out. */
  note: string;
  /**
   * Node coords of the invisible anchor player. Authoring a path means keeping
   * the camera off it, so the capture tool prints it rather than leaving you to
   * discover a character in frame after the encode.
   */
  anchor: { x: number; y: number } | null;
  /**
   * Camera steps taken since the path started — one per RENDERED frame.
   *
   * The capture driver compares this against the frames it actually collected.
   * One step is one frame, so a shortfall is a paint that went missing between
   * the renderer and the recorder, and lands in the clip as a jump.
   */
  frames: number;
  /** Monsters currently rendered in the node. */
  monsters: number;
  /**
   * Where those monsters are, in node coords.
   *
   * A zoom-1 frame is about 4% of a node, so a path authored against a mental
   * image of "the forest" films empty ground: the shot has to be routed at the
   * population, not at the scenery. The capture tool turns this into a density
   * map while scouting.
   */
  monsterPoints: { x: number; y: number }[];
}

declare global {
  interface Window {
    __cinematic?: CinematicBeacon;
  }
}

function param(name: string): string | null {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

export function resolveCinematicSession(): CinematicSession | null {
  if (!DEV_TOOLS_ENABLED || typeof window === 'undefined') return null;

  const scoutNode = param('cinematicNode');
  if (scoutNode) {
    const at = (param('cinematicAt') ?? '').split(',').map(Number);
    const x = Number.isFinite(at[0]) ? at[0] : 2400;
    const y = Number.isFinite(at[1]) ? at[1] : 2400;
    return {
      scout: true,
      frameStepMs: 1000 / captureFps(),
      clip: {
        id: `scout:${scoutNode}`,
        nodeId: scoutNode,
        travelMs: 0,
        path: [{ x, y }],
      },
    };
  }

  const clipId = param('cinematic');
  if (!clipId) return null;
  const clip = cinematicClipById(clipId);
  if (!clip) {
    console.error(`[cinematic] unknown clip '${clipId}'`);
    return null;
  }
  const problem = validateClip(clip);
  if (problem) {
    // Refuse rather than film something wrong. The capture tool forwards console
    // errors, so this surfaces as a clear failure instead of a silently clamped
    // camera or a three-minute boot into the wrong node.
    console.error(`[cinematic] clip '${clip.id}' is invalid: ${problem}`);
    return null;
  }
  return { clip, scout: false, frameStepMs: 1000 / captureFps() };
}

/**
 * Guard the two mistakes an authored clip actually makes: naming a node that a
 * world-map regeneration has since renamed, and a waypoint outside the node —
 * which the camera's bounds clamp would silently rewrite into a different shot.
 */
export function validateClip(clip: CinematicClip): string | null {
  if (!NODE_BIOMES[clip.nodeId]) return `unknown node '${clip.nodeId}'`;
  if (clip.path.length < 2) return 'a path needs at least two waypoints';
  for (const [index, point] of clip.path.entries()) {
    const outOfBoundsX = point.x < 0 || point.x > GAME_CONFIG.NODE_WIDTH;
    const outOfBoundsY = point.y < 0 || point.y > GAME_CONFIG.NODE_HEIGHT;
    if (outOfBoundsX || outOfBoundsY) {
      return `waypoint ${index} (${point.x}, ${point.y}) is outside the node`;
    }
  }
  return null;
}

export function initBeacon(session: CinematicSession): CinematicBeacon {
  const beacon: CinematicBeacon = {
    clipId: session.clip.id,
    nodeId: session.clip.nodeId,
    phase: 'booting',
    ready: false,
    done: false,
    progress: 0,
    note: 'client booted',
    anchor: null,
    frames: 0,
    monsters: 0,
    monsterPoints: [],
  };
  window.__cinematic = beacon;
  return beacon;
}

export function setPhase(
  beacon: CinematicBeacon | null,
  phase: CinematicBeacon['phase'],
  note: string,
): void {
  if (!beacon || beacon.phase === phase) return;
  beacon.phase = phase;
  beacon.note = note;
  console.log(`[cinematic] ${phase}: ${note}`);
}
