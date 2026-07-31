// Builds the tier-3 player bodies deterministically from the accepted tier-2
// frames. NO GENERATION: 45 frames (5 classes x 3 frames x 3 specs) produced in
// code, reviewed as one contact sheet instead of ~90 gallery candidates.
//
// Run from repo root:
//   node art/workbench/roster/t3.mjs [--preview]   # --preview writes t3-preview/
//
// ── Why this instead of generating 15 T3 bodies ─────────────────────────────
// A generated T3 body would be img2img from its own T2 frame, and we measured
// what that produces: at strength ~150 it reprints the source with a small
// delta. Hours of gallery review to get "the same silhouette, slightly fancier",
// seen at 64px by a player who never views their T2 and T3 selves side by side.
// The 11 BESPOKE specs (Assassin, Devout Priest, Voidwalker, Hemomancer,
// Cultist, Berserker, Sniper, Desperado, Melter, Destroyer, + one frost pick)
// still get real generated bodies — that is where body art earns its keep,
// because the fantasy genuinely breaks the class-frame silhouette (bible §25).
//
// ── The visual grammar this implements ──────────────────────────────────────
//   body silhouette = class + frame        (already shipped)
//   body colour     = class hue, INTENSIFIED at T3, ROTATED per spec
//   head ring       = range                (already shipped)
//   aura            = live combat state only
// Rotating hue per spec means a trio only has to separate three ways, which is
// perceptually easy — unlike encoding 45 specs in aura colour, which is not.
//
// ── Two modes, because the roster is not uniform ────────────────────────────
// Most classes carry a saturated identity hue, so their specs ROTATE it. The
// Spirit is deliberately monochrome (94-99% neutral pixels after the colour
// pass), so rotation is a no-op on it: its specs COLOURISE instead, which also
// gives that class a nice progression — monochrome at T2, taking on a nature at
// T3, with the white/grey/black value ramp preserved because value is untouched.
import sharp from '../../../server/node_modules/sharp/lib/index.js';
import fs from 'node:fs';
import path from 'node:path';

const PREVIEW = process.argv.includes('--preview');
const SRC = 'art/src/sprites/classes';
const OUT = PREVIEW ? 'art/workbench/roster/t3-preview' : SRC;

// Conduit is EXCLUDED on purpose: the class is a placeholder pending a major
// rework, so no T3 art is produced for it.
// ── Every class colourises to ABSOLUTE per-spec hues ────────────────────────
// v1 rotated each sprite's existing hue by a delta. Two problems: the middle
// spec (delta 0) barely changed at all, and classes with little colour to begin
// with — the Squire is 41% neutral steel — had nothing to rotate. Colourising
// assigns the hue outright, so every spec lands somewhere deliberate and the
// three read as dramatically different rather than as three shades of one thing.
// Saturation is max(existing, floor), which keeps garment/trim contrast intact,
// and value is never rewritten, so silhouette and shading survive untouched.
const CLASSES = {
  // Striker — crimson root, pushed wider: blood / ember / imperial violet.
  cadence:  { sat: 0.52, spec: [352, 26, 300] },
  // Squire — bible §17's iron/white/blue/pale gold, taken far apart because
  // steel alone gives this class the least to work with.
  cooldown: { sat: 0.42, spec: [205, 45, 148] },
  // Slinger — amber root: amber / crimson / violet.
  reload:   { sat: 0.50, spec: [35, 355, 265] },
  // Spirit — bible §19's cyan / violet / pale blue. Unchanged; it already read
  // as the best of the set.
  energy:   { sat: 0.34, spec: [198, 272, 158], val: 0.88 },
  // Apprentice — hues must stay INSIDE the frame's element, because the colour
  // pass already made its frames elemental (light venom, balanced ember, heavy
  // rime). Each trio is a spread within that element, not a departure from it.
  dot: {
    sat: 0.58,
    byFrame: {
      light:    { hues: [100, 72, 142] },                    // venom: green / acid / jade
      // Ember needs its OWN value and saturation: orange at 80% value is brown
      // by definition, so the default darkening turned this whole trio to mud.
      // Fire has to be bright to read as fire, and the hues are spread wider
      // because reds-through-oranges are where hue discrimination is weakest.
      balanced: { hues: [355, 24, 45], val: 0.99, sat: 0.78 },
      heavy:    { hues: [190, 216, 168] },                   // rime: cyan / blue / frost-teal
    },
  },
};
const FRAMES = { light: 'light_', balanced: 'medium_', heavy: 'heavy_' };
const SPECS = ['a', 'b', 'c'];

// T3 reads DARKER and richer, not brighter. Lifting value produced pastels
// (pink Strikers, pale gold Squires) which looked toy-like against a roster
// whose whole palette is muted. Pulling value down while raising saturation
// gives deep jewel tones instead, and keeps the sprites sitting in the same
// tonal range as the rest of the game.
const T3_VAL = 0.80;   // value multiplier
const T3_VMAX = 0.88;  // ceiling, so nothing blows out to near-white

function rgb2hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, mx ? d / mx : 0, mx];
}
function hsv2rgb(h, s, v) {
  h = ((h % 360) + 360) % 360;
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255].map(Math.round);
}

async function build(srcFile, outFile, cfg, specIdx, variant) {
  // A frame may override hue/sat/val — the Apprentice's elements do not tolerate
  // one uniform treatment (see the ember note above).
  const frame = cfg.byFrame?.[variant];
  const target = (frame?.hues ?? cfg.spec)[specIdx];
  const sat = frame?.sat ?? cfg.sat;
  const val = frame?.val ?? cfg.val ?? T3_VAL;
  const { data, info } = await sharp(srcFile).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  let touched = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 10) continue;
    const [, s, v] = rgb2hsv(data[i], data[i + 1], data[i + 2]);
    // Leave the darkest shadows and brightest speculars alone: they carry the
    // form, and recolouring them muddies the silhouette and flattens the read.
    if (v < 0.14 || v > 0.95) continue;

    // Hue is assigned outright; saturation only ever rises, so already-coloured
    // trim stays more saturated than the garment and the contrast survives.
    const [r, g, b] = hsv2rgb(target, Math.max(s, sat), Math.min(T3_VMAX, v * val));
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
    touched++;
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  await sharp(data, { raw: info }).png().toFile(outFile);
  return touched;
}

let n = 0;
for (const [cls, cfg] of Object.entries(CLASSES)) {
  for (const [variant, prefix] of Object.entries(FRAMES)) {
    const srcFile = path.join(SRC, `${prefix}${cls}.png`);
    if (!fs.existsSync(srcFile)) { console.warn('missing', srcFile); continue; }
    for (const [si, spec] of SPECS.entries()) {
      const outFile = path.join(OUT, `${prefix}${cls}_t3${spec}.png`);
      const touched = await build(srcFile, outFile, cfg, si, variant);
      n++;
      if (variant === 'balanced') {
        console.log(`${cls} ${variant} t3${spec}`.padEnd(26), `${touched} px`);
      }
    }
  }
}
console.log(`\nwrote ${n} T3 frames to ${OUT}${PREVIEW ? '  (preview only)' : ''}`);
console.log('Conduit excluded: placeholder class pending rework.');
