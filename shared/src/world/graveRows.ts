import { GAME_CONFIG } from "../config/gameConfig";

/**
 * WASTELAND GRAVE ROWS — the dungeon layout for the wasteland boss node.
 *
 * Every other special dungeon in the game is a RING or a radius: cave raises a standing-stone
 * circle, jungle cuts a ringed clearing, mountain walls a circular arena, desert runs a road
 * to the middle. A fifth ring would have read as the same idea again.
 *
 * So this one is ROWS. Regimented lines of dead trees marching across the node — the only
 * orderly thing left anywhere in the world, and the biome was literally called `graveyard`
 * before the art rename. The order is the horror: something laid these out.
 *
 * Two details carry it:
 *
 *  - **The rows fray.** Jitter grows with distance from the node centre, so the lines are
 *    crisp where the arena is and fall apart at the edges. Perfect rows everywhere would
 *    read as a texture; rows that decay read as something that was maintained and then was
 *    not.
 *  - **The arena is a GAP in the grid**, not a circle imposed on it. Markers are dropped
 *    where the court is, so the rows visibly continue on the far side — the graves were
 *    cleared here, rather than the graves being arranged around a clearing.
 *
 * Lives in `shared/` because these are dead trees, which carry trunk hitboxes and are
 * generated server-side.
 */

export interface GraveMarker {
  x: number;
  y: number;
}

/** Spacing between rows, and between markers along a row. */
const ROW_SPACING = GAME_CONFIG.NODE_WIDTH * 0.115;
const MARKER_SPACING = GAME_CONFIG.NODE_WIDTH * 0.105;
/**
 * Radius of the cleared arena. Comfortably wider than the altar court the ground paints
 * (0.115) so the boss fight is not conducted between two grave markers.
 */
const ARENA_CLEAR = GAME_CONFIG.NODE_WIDTH * 0.2;
/** Markers stay this far inside the node so a trunk never clips the border. */
const EDGE_MARGIN = GAME_CONFIG.NODE_WIDTH * 0.085;
/**
 * How far a marker may wander once the rows have fully decayed.
 *
 * Bounded well under half the marker spacing on purpose: at 0.055 the wander was comparable
 * to the gap between markers, which destroyed the row read entirely — the grid dissolved
 * into a scatter and the whole idea with it. Decay has to stay legible AS decay.
 */
const MAX_FRAY = GAME_CONFIG.NODE_WIDTH * 0.028;
/** Distance from centre at which fraying reaches full strength. */
const FRAY_REACH = GAME_CONFIG.NODE_WIDTH * 0.46;

function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map<string, GraveMarker[]>();

/**
 * Grave-marker positions for a wasteland dungeon, in reading order along each row.
 *
 * The grid is rotated by a per-node angle so the rows do not line up with the node edges —
 * a grid parallel to the border reads as a tilemap artefact rather than as a graveyard.
 */
export function getGraveRows(nodeId: string): GraveMarker[] {
  const hit = cache.get(nodeId);
  if (hit) return hit;

  const rng = mulberry32(hashString(`${nodeId}:grave-rows:v1`));
  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  const cx = W / 2;
  const cy = H / 2;

  const angle = rng() * Math.PI * 2;
  const ax = Math.cos(angle);
  const ay = Math.sin(angle);
  // Row direction and the perpendicular the rows step along.
  const px = -ay;
  const py = ax;

  const half = Math.hypot(W, H) / 2;
  const rows = Math.floor((half * 2) / ROW_SPACING);
  const perRow = Math.floor((half * 2) / MARKER_SPACING);
  const markers: GraveMarker[] = [];

  for (let r = 0; r < rows; r++) {
    const offset = (r - (rows - 1) / 2) * ROW_SPACING;
    for (let m = 0; m < perRow; m++) {
      const along = (m - (perRow - 1) / 2) * MARKER_SPACING;
      let x = cx + ax * along + px * offset;
      let y = cy + ay * along + py * offset;

      const fromCentre = Math.hypot(x - cx, y - cy);
      // Fray with distance: crisp by the arena, falling apart at the edges.
      const fray = Math.min(1, fromCentre / FRAY_REACH) * MAX_FRAY;
      x += (rng() - 0.5) * 2 * fray;
      y += (rng() - 0.5) * 2 * fray;

      // The arena is a GAP in the grid — the rows continue past it on the far side.
      if (Math.hypot(x - cx, y - cy) < ARENA_CLEAR) continue;
      if (
        x < EDGE_MARGIN ||
        y < EDGE_MARGIN ||
        x > W - EDGE_MARGIN ||
        y > H - EDGE_MARGIN
      ) {
        continue;
      }
      // Rows thin out as they decay, so the far corners are stragglers rather than a full
      // grid running to the border. Kept mild: combined with the edge margin and the
      // rotated grid overhanging the node, an aggressive cull left only 17 markers on the
      // whole node, which read as a scatter — the exact thing rows exist to avoid.
      const survives = 1 - Math.min(0.5, (fromCentre / FRAY_REACH) * 0.32);
      if (rng() > survives) continue;

      markers.push({ x, y });
    }
  }

  cache.set(nodeId, markers);
  return markers;
}
