// Draws the identity-accent props (Stage 3): 18 head rings, 6 classes x 3 ranges.
//
// Run from repo root:
//   node art/workbench/accents/build.mjs
//
// AUTHORED IN CODE, NOT GENERATED. PixelLab produced all 24 player bodies but
// could not produce a 32px standalone ornament: asked for a "crest" with
// "helmet, head, face" banned, every candidate came back as a complete horned
// helmet. Asking for a PART of a character summons the whole character. At
// 12-20px a prop is a few dozen pixels — the scale where hand-placed pixels beat
// any generator, and where iteration costs seconds instead of review cycles.
// (art/manifests/accents.json is retired and records that limit.)
//
// ── The model: SHAPE LANGUAGE (class) x TREATMENT (range) ───────────────────
// Every prop is a forged ring worn at the head. The RANGE decides how much of
// the ring survives; the CLASS decides what kind of object it is:
//
//   range   close = heavy solid band   mid = open ring   far = shattered ring
//   class   striker  geometric facets (regular polygon, faceted ticks)
//           squire   squared (hard corners, corner blocks)
//           apprentice  wild (irregular radius, uneven thorns)
//           slinger  regular (true ellipse, evenly spaced ticks)
//           spirit   spiky (radiating thin spikes)
//           conduit  solemn (plain, unadorned)
//
// Class was previously a small mark stuck on a shared ring; that read as texture
// rather than identity. Driving the OUTLINE itself per class is what makes six
// rosters feel like six different forges.
//
// ── Constraints learned the hard way, do not re-break ────────────────────────
// * Body glow is the AURA channel (fx/aura.ts) for transient combat state, so
//   accents must not glow; and they must not cover the bodies the overhaul
//   exists to show off. Hence: small, seated on the crown.
// * At ~20px only SILHOUETTE CLASS reads — solid vs open vs broken. Three
//   attempts to differentiate by detail (3px sighting ring, shallow crescent,
//   thin arcs) all collapsed into "antennae" or "a bar".
// * Protrusions at exactly 0/180 deg are the antenna trap. Additions at the
//   sides must go DOWNWARD (mass) or stay FLUSH (surface), never outward.
// * Curves need pixels: an ellipse reads as a ring, a 3px arc does not.
//
// Frames are 32x32 with the prop's base on the BOTTOM ROW: the client puts the
// frame's bottom-centre on the baked head anchor (shared/src/sprites/
// headAnchors.ts), so props seat on the crown with no per-body offsets.
import sharp from '../../../server/node_modules/sharp/lib/index.js';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'art/src/sprites/accents';
const S = 32;
const BASELINE = S - 1;
const CX = S / 2;

// Three value steps, near-white so the per-class tint (a multiply) colours them.
const LIT = [252, 253, 255];
const MID = [214, 220, 232];
const EDGE = [150, 158, 176];

fs.mkdirSync(OUT, { recursive: true });

const px = () => new Uint8Array(S * S * 4);
const put = (buf, x, y, [r, g, b], a = 255) => {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= S || y >= S) return;
  const i = (y * S + x) * 4;
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
};
/** Knock a pixel out — used to punch dents into an already-drawn rim. */
const clear = (buf, x, y) => {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= S || y >= S) return;
  buf[(y * S + x) * 4 + 3] = 0;
};

async function save(name, buf) {
  const file = path.join(OUT, name);
  await sharp(Buffer.from(buf), { raw: { width: S, height: S, channels: 4 } })
    .png().toFile(file);
  return file;
}

// ── Class shape languages ───────────────────────────────────────────────────
// Each returns a radius MULTIPLIER for a given angle, deforming the base
// ellipse into that class's kind of object.
const SHAPE = {
  // Striker — geometric: a regular hexagon's radius profile. Flat facets and
  // hard vertices instead of a smooth curve.
  cadence: (a) => {
    const n = 6, seg = (2 * Math.PI) / n;
    return Math.cos(Math.PI / n) / Math.cos(((a % seg) + seg) % seg - Math.PI / n);
  },
  // Squire — squared: a superellipse. n=4 gives hard shoulders and straight runs.
  cooldown: (a) => 1 / (Math.abs(Math.cos(a)) ** 4 + Math.abs(Math.sin(a)) ** 4) ** 0.25,
  // Apprentice — wild, but the RING ITSELF STAYS REGULAR. An earlier version
  // deformed the radius and the result read as a badly drawn ellipse rather
  // than as chaos. The wildness is damage applied to a clean ring (dents and
  // uneven spikes, see DECOR) — same principle as the Spirit, just disorderly.
  dot: () => 1,
  // Slinger — regular: a true ellipse, deliberately unmodified.
  reload: () => 1,
  // Spirit — spiky: base stays clean; the spikes are decoration (below).
  energy: () => 1,
  // Conduit — solemn: plain and unadorned.
  summoner: () => 1,
};
const CLASSES = Object.keys(SHAPE);

/** Point on a class-shaped ring at `deg`. */
function pt(cls, deg, { cy, rx, ry }, scale = 1) {
  const a = (deg * Math.PI) / 180;
  const k = SHAPE[cls](a) * scale;
  return [CX + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
}

// ── Class decorations ───────────────────────────────────────────────────────
// Applied after the ring treatment. Kept small: at this size decoration adds
// character, but silhouette class is what actually reads.
const DECOR = {
  // Striker — a tick at each hexagon vertex: regular, constructed, geometric.
  cadence: (buf, g) => {
    for (let i = 0; i < 6; i++) {
      const d = i * 60 + 30;
      const [x, y] = pt('cadence', d, g, 1.14);
      put(buf, x, y, i % 2 ? MID : LIT);
    }
  },
  // Squire — solid 2x2 blocks at the four squared corners.
  cooldown: (buf, g) => {
    for (const d of [45, 135, 225, 315]) {
      const [x, y] = pt('cooldown', d, g, 1.0);
      put(buf, x, y, LIT); put(buf, x + (d > 180 ? 1 : -1), y, MID);
      put(buf, x, y + (d > 90 && d < 270 ? -1 : 1), MID);
    }
  },
  // Apprentice — chaotic damage on a regular ring: uneven spikes at irregular
  // angles AND dents punched inward. Spike lengths and dent depths deliberately
  // do not repeat, so no two arcs look alike.
  dot: (buf, g) => {
    for (const [d, len, droop] of [[26, 3, 0], [71, 2, 1], [112, 4, 0],
                                   [201, 3, 0], [247, 2, 1], [329, 3, 0]]) {
      const a = (d * Math.PI) / 180;
      const [x, y] = pt('dot', d, g);
      for (let k = 1; k <= len; k++) {
        put(buf, x + Math.cos(a) * k, y + Math.sin(a) * k * 0.55 + droop * k * 0.7,
            k === len ? EDGE : LIT);
      }
    }
    // Dents: clear the rim and push a pixel inward so the ring looks struck.
    for (const [d, depth] of [[48, 0.80], [143, 0.86], [172, 0.78], [268, 0.84], [306, 0.88]]) {
      for (const off of [-4, -2, 0, 2, 4]) {
        const [ex, ey] = pt('dot', d + off, g);
        clear(buf, ex, ey);
        clear(buf, ex, ey + 1);
      }
      const [ix, iy] = pt('dot', d, g, depth);
      put(buf, ix, iy, MID);
      const [ix2, iy2] = pt('dot', d + 3, g, depth + 0.06);
      put(buf, ix2, iy2, EDGE);
    }
  },
  // Slinger — evenly spaced ticks every 45 deg: measured, metronomic.
  // NOTE: nothing at 0/180 — a horizontal spur there is the antenna trap, and
  // an earlier version of this mark reproduced exactly that artifact.
  reload: (buf, g) => {
    for (const d of [45, 90, 135, 225, 270, 315]) {
      const [x, y] = pt('reload', d, g, 1.13);
      put(buf, x, y, d === 90 ? LIT : MID);
    }
  },
  // Spirit — many thin spikes radiating outward, uneven brightness: unstable.
  energy: (buf, g) => {
    for (let d = 15; d < 360; d += 30) {
      const a = (d * Math.PI) / 180;
      const [x, y] = pt('energy', d, g);
      const len = d % 60 === 15 ? 3 : 2;
      for (let k = 1; k <= len; k++) {
        put(buf, x + Math.cos(a) * k, y + Math.sin(a) * k * 0.6, k === len ? EDGE : LIT);
      }
    }
  },
  // Conduit — solemn: nothing at all. The absence is the character.
  summoner: () => {},
};

// ── Per-class treatment tweaks ──────────────────────────────────────────────
// The shared treatments do not land identically on every shape language, so a
// few classes get overrides:
//  * Striker: its hexagon swallowed the default notch width, so mid had no
//    visible gaps at all. Notches are widened and moved onto the flats.
//  * Squire: reads best heavy, so mid and far get an extra band row and far's
//    breaks are narrowed — chunkier and more complete than the other classes.
const TWEAK = {
  cadence:  { notchHalfDeg: 13, notches: [30, 150, 210, 330] },
  cooldown: { extraThick: true, gapDeg: 16 },
};

// ── Range treatments ────────────────────────────────────────────────────────
/** Open ring outline, with optional notches and front/back break gaps. */
function outline(buf, cls, g, { gapDeg = 0, notches = [], thick = false } = {}) {
  const t = TWEAK[cls] ?? {};
  const halfDeg = t.notchHalfDeg ?? 6;
  const cuts = t.notches ?? notches;
  const gap = gapDeg ? (t.gapDeg ?? gapDeg) : 0;
  for (let d = 0; d < 360; d += 1.5) {
    if (gap) {
      const d90 = Math.min(Math.abs(d - 90), 360 - Math.abs(d - 90));
      const d270 = Math.min(Math.abs(d - 270), 360 - Math.abs(d - 270));
      if (d90 < gap || d270 < gap) continue;
    }
    if (cuts.some((n) => Math.abs(((d - n + 540) % 360) - 180) > 180 - halfDeg)) continue;
    const [x, y] = pt(cls, d, g);
    const front = Math.sin((d * Math.PI) / 180) > 0;
    put(buf, x, y, front ? LIT : MID);
    if (thick && front) put(buf, x, y + 1, EDGE);
    if (t.extraThick) {
      if (front) put(buf, x, y + 2, EDGE);
      else put(buf, x, y + 1, EDGE);
    }
  }
}

/** CLOSE — a heavy solid band. Thickness is built on the FRONT arc, where there
 *  is vertical room; the sides never have the pixels for it (an earlier version
 *  filled between two ellipses and just looked like a fatter outline). */
function drawClose(buf, cls, g) {
  for (let d = 0; d < 360; d += 1.5) {
    const [x, y] = pt(cls, d, g);
    const front = Math.sin((d * Math.PI) / 180) > 0;
    if (front) {
      const taper = Math.abs(Math.sin((d * Math.PI) / 180));
      const thickness = 1 + Math.round(2.2 * taper);
      for (let k = 0; k < thickness; k++) {
        put(buf, x, y - k, k === 0 ? LIT : k === 1 ? MID : EDGE);
      }
    } else {
      put(buf, x, y, EDGE);
    }
  }
  // Sides: blunt fangs angled DOWN and slightly inward — the band clamps the
  // head rather than resting on it. Downward, never outward (antenna trap).
  for (const s of [-1, 1]) {
    const [fx, fy] = pt(cls, s < 0 ? 180 : 0, g);
    put(buf, fx, fy + 1, LIT);
    put(buf, fx - s * 0.5, fy + 2, LIT);
    put(buf, fx - s, fy + 3, MID);
    put(buf, fx - s, fy + 4, EDGE);
  }
}

/** MID — an open, notched ring. */
function drawMid(buf, cls, g) {
  outline(buf, cls, g, { thick: true, notches: [20, 160, 200, 340] });
}

/** FAR — a shattered ring: narrow breaks front and back, jagged shard tips.
 *  Gaps stay NARROW; at 68 deg the remnants read as insect antennae. */
function drawFar(buf, cls, g) {
  outline(buf, cls, g, { gapDeg: 26, thick: true });
  for (const d of [64, 116, 244, 296]) {
    const [x, y] = pt(cls, d, g);
    const ox = Math.cos((d * Math.PI) / 180) > 0 ? 1 : -1;
    const oy = Math.sin((d * Math.PI) / 180) > 0 ? 1 : -1;
    put(buf, x, y, LIT);
    put(buf, x + ox, y + oy * 0.7, LIT);
    put(buf, x + ox * 2, y + oy * 1.2, MID);
  }
}

// Diameters differ per range so the set reads heavy / medium / light.
const RANGES = {
  close: { draw: drawClose, geom: { cy: BASELINE - 3, rx: 8.6, ry: 3.5 } },
  mid:   { draw: drawMid,   geom: { cy: BASELINE - 3, rx: 9.8, ry: 3.9 } },
  far:   { draw: drawFar,   geom: { cy: BASELINE - 3, rx: 10.2, ry: 4.1 } },
};

let n = 0;
for (const [range, { draw, geom }] of Object.entries(RANGES)) {
  for (const cls of CLASSES) {
    const buf = px();
    draw(buf, cls, geom);
    DECOR[cls](buf, geom);
    await save(`crest-${range}-${cls}.png`, buf);
    n++;
  }
}
console.log(`v7: ${n} props — shape language per class x treatment per range.`);
console.log('  striker geometric / squire squared / apprentice wild / slinger regular / spirit spiky / conduit solemn');
console.log('Next: pnpm art:pack --atlas=sprites');
