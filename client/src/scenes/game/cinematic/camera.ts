/**
 * The scripted capture camera.
 *
 * Deliberately not a general cinematic engine: a polyline through node space, a
 * hold at any waypoint, and one global ease. No zoom (anything below 1 softens
 * linear-filtered pixel art), no per-waypoint easing (it makes a slow drift
 * stutter), no target tracking (monster positions differ every capture).
 *
 * The path advances by one fixed step per RENDERED FRAME (`frameStepMs`), not by
 * the frame's real delta. The recorder samples the compositor on a fixed grid, so
 * charging a late frame its extra milliseconds put the camera somewhere the grid
 * then read as a lurch. Per-frame stepping makes an unevenly-timed frame cost a
 * repeat instead. The game is capped to the capture rate to match (`main.ts`).
 */

import { GAME_CONFIG, peekSceneBounds } from '@mmo-idle/shared';
import { cameraWorldViewSize } from '../../../render/cameraZoom';
import type { GameScene } from '../GameScene';
import type { CinematicWaypoint } from './clips';
import { setPhase, type CinematicBeacon, type CinematicSession } from './mode';
import { planPopulationRoute } from './route';

/** Frames the painted node must hold before the capture driver is told to roll. */
const STABLE_FRAMES = 12;
/** Give the node this long to produce a monster before filming an empty one. */
const POPULATION_GRACE_MS = 6_000;

interface Segment {
  fromX: number;
  fromY: number;
  dx: number;
  dy: number;
  length: number;
  /** Hold at the segment's START, in ms. */
  holdMs: number;
}

export interface CinematicCameraState {
  session: CinematicSession;
  beacon: CinematicBeacon;
  segments: Segment[];
  totalLength: number;
  /** Elapsed travel time (holds excluded), ms. */
  travelled: number;
  /** Remaining hold at the current waypoint, ms. */
  holdLeft: number;
  /** Index of the next hold to consume. */
  holdIndex: number;
  stableFrames: number;
  elapsedMs: number;
  started: boolean;
  /**
   * Scouting only: the camera position (and survey zoom) the capture tool last
   * asked for. Zoom is a SCOUTING affordance for authoring a path against a
   * whole node — clips always film at zoom 1, because anything below it softens
   * linear-filtered pixel art.
   */
  scoutPoint: { x: number; y: number; zoom: number } | null;
  /** The path chosen from the live roster, once one has been. */
  routedPath: CinematicWaypoint[] | null;
}

/** Travel distance of a routed path, world px. About 1.3 frame widths. */
const DEFAULT_ROUTE_LENGTH = 1_700;
/** Hold at each of a routed path's two richest waypoints, ms. */
const DEFAULT_ROUTE_HOLD_MS = 900;

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/**
 * Scouting hook: re-park the camera without rebooting the client. Node
 * comparison needs many frames from many positions, and a cold boot costs
 * minutes, so the capture tool moves the camera in an already-staged session
 * instead of launching a browser per still. Scout sessions only.
 */
export function armScoutParking(state: CinematicCameraState, scene: GameScene): void {
  if (!state.session.scout) return;
  (window as unknown as { __cinematicPark?: (x: number, y: number, zoom: number) => void })
    .__cinematicPark = (x: number, y: number, zoom: number) => {
      state.scoutPoint = { x, y, zoom: zoom > 0 ? zoom : 1 };
      scene.cameras.main.setZoom(state.scoutPoint.zoom);
      centreCamera(scene, x, y);
    };
}

function buildSegments(points: readonly CinematicWaypoint[]): Segment[] {
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    segments.push({
      fromX: a.x,
      fromY: a.y,
      dx,
      dy,
      length: Math.hypot(dx, dy),
      holdMs: a.holdMs ?? 0,
    });
  }
  return segments;
}

/**
 * Replace the authored path with one routed at the node's live population.
 *
 * Deferred to the ready transition on purpose: the roster is only complete and
 * settled by then, and it is the positions AT ROLL TIME that the shot has to be
 * built from. Falls back to the authored path when the node has nothing to film,
 * so a clip always produces footage.
 */
function applyPopulationRoute(state: CinematicCameraState, scene: GameScene): void {
  const clip = state.session.clip;
  if (clip.route !== 'population') return;
  const view = cameraWorldViewSize(scene.cameras.main);
  const routed = planPopulationRoute(state.beacon.monsterPoints, {
    nodeWidth: GAME_CONFIG.NODE_WIDTH,
    nodeHeight: GAME_CONFIG.NODE_HEIGHT,
    viewWidth: view.width,
    viewHeight: view.height,
    pathLength: clip.pathLength ?? DEFAULT_ROUTE_LENGTH,
    holdMs: clip.routeHoldMs ?? DEFAULT_ROUTE_HOLD_MS,
  });
  if (!routed) {
    console.log('[cinematic] no monsters to route at — keeping the authored path');
    return;
  }
  state.routedPath = routed;
  state.segments = buildSegments(routed);
  state.totalLength = state.segments.reduce((sum, seg) => sum + seg.length, 0);
  state.holdLeft = state.segments[0]?.holdMs ?? 0;
  const where = routed.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(' → ');
  console.log(`[cinematic] routed at ${state.beacon.monsterPoints.length} monsters: ${where}`);
}

export function createCinematicCamera(
  session: CinematicSession,
  beacon: CinematicBeacon,
): CinematicCameraState {
  const segments = buildSegments(session.clip.path);
  const totalLength = segments.reduce((sum, s) => sum + s.length, 0);
  return {
    session,
    beacon,
    segments,
    totalLength,
    travelled: 0,
    holdLeft: segments[0]?.holdMs ?? 0,
    holdIndex: 0,
    stableFrames: 0,
    elapsedMs: 0,
    started: false,
    scoutPoint: null,
    routedPath: null,
  };
}

/** Diagnostics the capture tool prints while a path is being authored. */
function reportSceneContents(scene: GameScene, state: CinematicCameraState): void {
  const ownId = scene.state.ownId;
  const base = ownId ? scene.state.interpolation.get(ownId)?.base : undefined;
  state.beacon.anchor = base ? { x: Math.round(base.x), y: Math.round(base.y) } : null;
  const points: { x: number; y: number }[] = [];
  for (const [id, kind] of scene.state.kind) {
    if (kind !== 'monster') continue;
    const at = scene.state.interpolation.get(id)?.base;
    if (at) points.push({ x: Math.round(at.x), y: Math.round(at.y) });
  }
  state.beacon.monsters = points.length;
  state.beacon.monsterPoints = points;
}

/** Camera centre at a normalised distance along the path. */
function pointAtDistance(
  state: CinematicCameraState,
  distance: number,
): { x: number; y: number } {
  const first = state.routedPath?.[0] ?? state.session.clip.path[0];
  if (state.segments.length === 0) return { x: first.x, y: first.y };

  let remaining = distance;
  for (const seg of state.segments) {
    if (remaining <= seg.length || seg === state.segments[state.segments.length - 1]) {
      const t = seg.length > 0 ? Math.min(1, remaining / seg.length) : 1;
      return { x: seg.fromX + seg.dx * t, y: seg.fromY + seg.dy * t };
    }
    remaining -= seg.length;
  }
  const last = state.segments[state.segments.length - 1];
  return { x: last.fromX + last.dx, y: last.fromY + last.dy };
}

/**
 * Centre the camera without letting a mis-typed waypoint show void: the same
 * peek bounds the gameplay camera clamps to, converted from centre to scroll.
 */
function centreCamera(scene: GameScene, x: number, y: number): void {
  const cam = scene.cameras.main;
  const view = cameraWorldViewSize(cam);
  const bounds = peekSceneBounds(scene.lastDrawnNodeId || scene.state.ownNodeId, view.width, view.height);
  const offX = (cam.width - view.width) / 2;
  const offY = (cam.height - view.height) / 2;
  const minX = bounds.x - offX;
  const minY = bounds.y - offY;
  const maxX = Math.max(minX, bounds.x + bounds.width - view.width - offX);
  const maxY = Math.max(minY, bounds.y + bounds.height - view.height - offY);
  const scrollX = Math.min(maxX, Math.max(minX, x - cam.width / 2));
  const scrollY = Math.min(maxY, Math.max(minY, y - cam.height / 2));
  cam.setScroll(scrollX, scrollY);
}

/**
 * Is the scene actually worth filming? The node has to be the one we asked for,
 * painted, with its ground art resolved — not the flat biome fill — and holding
 * still for a few frames so a late texture cannot pop into frame one.
 */
function sceneIsFilmable(scene: GameScene, state: CinematicCameraState): boolean {
  const wanted = state.session.clip.nodeId;
  if (scene.state.ownNodeId !== wanted) return false;
  if (scene.lastDrawnNodeId !== wanted) return false;
  if (scene.transitioning) return false;
  // Either painted ground counts; a node with neither is showing the flat fill.
  if (!scene.bgWang && !scene.bgTile) return false;
  if (state.session.scout) return true;
  const hasMonster = [...scene.state.kind.values()].some((k) => k === 'monster');
  return hasMonster || state.elapsedMs > POPULATION_GRACE_MS;
}

/**
 * One frame of cinematic camera. Returns nothing; owns the camera completely
 * while active, which is why `updateGameScene` early-returns past its own
 * follow logic.
 */
export function tickCinematicCamera(
  scene: GameScene,
  state: CinematicCameraState,
  deltaMs: number,
  stagingSettled: boolean,
): void {
  state.elapsedMs += deltaMs;
  reportSceneContents(scene, state);

  if (!state.beacon.ready) {
    // Park on the first waypoint so the pre-roll frames match frame one of the take.
    const start = state.scoutPoint ?? state.routedPath?.[0] ?? state.session.clip.path[0];
    centreCamera(scene, start.x, start.y);

    state.stableFrames = stagingSettled && sceneIsFilmable(scene, state)
      ? state.stableFrames + 1
      : 0;
    if (state.stableFrames >= STABLE_FRAMES) {
      // Route BEFORE declaring ready: the driver starts recording on `ready`,
      // and the pre-roll frames have to already be parked on frame one of the
      // take or the trim cuts into a moving camera.
      applyPopulationRoute(state, scene);
      if (state.routedPath) {
        centreCamera(scene, state.routedPath[0].x, state.routedPath[0].y);
      }
      state.beacon.ready = true;
      state.beacon.progress = 0;
      setPhase(state.beacon, 'ready', `node ${state.session.clip.nodeId} painted and stable`);
      if (state.session.scout) {
        state.beacon.done = true;
        armScoutParking(state, scene);
        setPhase(state.beacon, 'done', 'scouting still — camera parked');
      }
    }
    return;
  }

  if (state.beacon.done) {
    if (state.session.scout && state.scoutPoint) {
      scene.cameras.main.setZoom(state.scoutPoint.zoom);
      centreCamera(scene, state.scoutPoint.x, state.scoutPoint.y);
    }
    return;
  }

  if (!state.started) {
    state.started = true;
    setPhase(state.beacon, 'running', 'camera path started');
  }

  // ONE FRAME, ONE STEP. Not the real delta: see `frameStepMs` in mode.ts.
  state.beacon.frames += 1;
  let budget = state.session.frameStepMs;
  if (state.holdLeft > 0) {
    const spent = Math.min(state.holdLeft, budget);
    state.holdLeft -= spent;
    budget -= spent;
  }
  state.travelled = Math.min(state.session.clip.travelMs, state.travelled + budget);

  const t = state.session.clip.travelMs > 0
    ? state.travelled / state.session.clip.travelMs
    : 1;
  const distance = easeInOutSine(t) * state.totalLength;
  const point = pointAtDistance(state, distance);
  centreCamera(scene, point.x, point.y);

  // Consume the next waypoint's hold as the path reaches it.
  let walked = 0;
  for (let i = 0; i < state.segments.length; i += 1) {
    walked += state.segments[i].length;
    if (i + 1 > state.holdIndex && distance >= walked - 0.5) {
      state.holdIndex = i + 1;
      state.holdLeft = state.segments[i + 1]?.holdMs ?? 0;
    }
  }

  state.beacon.progress = t;
  if (t >= 1) {
    state.beacon.done = true;
    setPhase(state.beacon, 'done', 'camera path finished');
  }
}
