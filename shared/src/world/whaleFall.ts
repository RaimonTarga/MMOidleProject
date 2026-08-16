import { GAME_CONFIG } from "../config/gameConfig";

/**
 * TRENCH WHALE FALL — the dungeon layout for the deep-sea trench boss node.
 *
 * A whale fall is the iconic deep-sea landmark: a carcass that sinks to the abyssal floor
 * and feeds an entire ecosystem for decades. The boss arena is built around one.
 *
 * The shape is a LINE, which is the point. Every other special dungeon in the game resolves
 * inward on the middle — cave's standing-stone ring, jungle's cut clearing, mountain's
 * circular wall, wasteland's grid of graves. A spine laid across the node is the only one
 * that has a direction, so a trench boss room reads differently the instant it is on screen.
 *
 * Rendered from the existing `trench_whale_vertebra` art (used at count 3 in the ordinary
 * scatter), scaled up and ROTATED to follow the spine — a vertebra that does not turn with
 * the curve reads as a row of unrelated stones. There is no rib art in the biome, so the
 * skeleton is the spine alone; the vertebrae taper toward the tail to sell it as one animal
 * rather than a line of identical props.
 *
 * Lives in `shared/` so the node's rock formations can clear it. The bones themselves are
 * decoration and carry no collision — you walk over the carcass.
 */

export interface WhaleVertebra {
  x: number;
  y: number;
  /** Radians, along the spine — the sprite is rotated to this. */
  angle: number;
  /** Multiplier on the base display size: largest at the ribcage, tapering to the tail. */
  scale: number;
}

/** Spine length as a fraction of the node. It should run most of the way across. */
const SPINE_LENGTH = GAME_CONFIG.NODE_WIDTH * 0.78;
/** Gap between vertebrae. */
const VERTEBRA_STEP = GAME_CONFIG.NODE_WIDTH * 0.06;
/**
 * The altar sits amid the carcass, so the spine opens around it rather than burying it.
 * Small — the spine has to visibly pass THROUGH the arena, not stop at its edge.
 */
const ALTAR_GAP = GAME_CONFIG.NODE_WIDTH * 0.082;
/**
 * How far the spine wanders off a straight line, so the animal reads as settled rather than
 * laid out.
 *
 * The curve is an S (`sin`), not a bow (`cos`), and that is a correctness matter rather than
 * a taste one. A bow peaks at the CENTRE, which is exactly where `ALTAR_GAP` removes the
 * vertebrae — so its maximum curvature landed inside the gap and the spine came out as two
 * straight arms meeting at a visible 20-degree kink across the altar. An S is straight
 * through the middle and does its bending out at the flanks, so the carcass reads as
 * continuous no matter how wide the gap is.
 */
const CURVE = GAME_CONFIG.NODE_WIDTH * 0.042;

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

function range(rng: () => number, lo: number, hi: number): number {
  return lo + rng() * (hi - lo);
}

const cache = new Map<string, WhaleVertebra[]>();

/** The vertebrae of a trench dungeon's whale fall, skull end first. */
export function getWhaleFall(nodeId: string): WhaleVertebra[] {
  const hit = cache.get(nodeId);
  if (hit) return hit;

  const rng = mulberry32(hashString(`${nodeId}:whale-fall:v1`));
  const cx = GAME_CONFIG.NODE_WIDTH / 2;
  const cy = GAME_CONFIG.NODE_HEIGHT / 2;
  const heading = rng() * Math.PI * 2;
  const ax = Math.cos(heading);
  const ay = Math.sin(heading);
  const nx = -ay;
  const ny = ax;
  // Which side the ribcage sits on, so the carcass is not symmetric about the altar.
  const skullAt = rng() < 0.5 ? -1 : 1;
  const bow = range(rng, 0.7, 1.3) * (rng() < 0.5 ? -1 : 1);

  const out: WhaleVertebra[] = [];
  const half = SPINE_LENGTH / 2;
  for (let t = -half; t <= half; t += VERTEBRA_STEP) {
    if (Math.abs(t) < ALTAR_GAP) continue;
    const f = t / half;
    // A full-wave S: zero at the centre AND at both ends. See CURVE for why not a bow.
    const offset = Math.sin(f * Math.PI) * CURVE * bow;
    // Tangent of the curve, so each vertebra turns with the spine.
    const slope = (Math.cos(f * Math.PI) * Math.PI * CURVE * bow) / half;
    const angle = heading + Math.atan(slope);
    // Big at the ribcage end, tapering to the tail — one animal, not a row of props.
    const fromSkull = (f * skullAt + 1) / 2;
    const scale = 1.45 - fromSkull * 0.72;
    out.push({
      x: cx + ax * t + nx * offset + range(rng, -22, 22),
      y: cy + ay * t + ny * offset + range(rng, -22, 22),
      angle,
      scale: scale * range(rng, 0.94, 1.06),
    });
  }

  cache.set(nodeId, out);
  return out;
}

/**
 * Whether a point sits on the carcass. Used so the node's rock formations do not stand in
 * the middle of the skeleton — the bones are decoration, but a boulder growing out of the
 * spine breaks the one image the room is built on.
 */
export function isOnWhaleFall(
  nodeId: string,
  x: number,
  y: number,
  pad = 0,
): boolean {
  for (const v of getWhaleFall(nodeId)) {
    const rr = GAME_CONFIG.NODE_WIDTH * 0.03 * v.scale + pad;
    const dx = x - v.x;
    const dy = y - v.y;
    if (dx * dx + dy * dy < rr * rr) return true;
  }
  return false;
}
