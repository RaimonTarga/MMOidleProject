import {
  ITEM_DATABASE,
  type DamageElement,
  type PlayerView,
} from '@mmo-idle/shared';
import { ELEMENT_STYLE } from '../render/damageNumberStyle';

/**
 * Cosmetic elemental tinting for basic-attack animations.
 *
 * Nothing here touches gameplay. A weapon's `element` tag, the Apprentice's own
 * DoT path, and transient effects like Imbue Lightning each contribute a hue;
 * this module decides what colors the attack FX actually draw with.
 *
 * ── Weight is expressed as LAYER, not as an average ─────────────────────────
 * The obvious implementation — weighted average of the contributing colors —
 * does not work, for two separate measured reasons.
 *
 * 1. A weighted average in RGB collapses toward grey. It does not rotate hue;
 *    the midpoint of two colors runs straight through the middle of the cube,
 *    and grey lives in the middle of the cube. On this palette a 50/50 RGB mix
 *    of fire and frost lands on #afae95 at 14% saturation (khaki), and poison
 *    mixed with lightning gives #93a8af at 15%. Hue-adjacent pairs survive
 *    (frost+doom keeps full saturation), which is why the older `lerpColor` in
 *    aura.ts gets away with it: it only ramps red -> orange -> yellow.
 *
 * 2. Fixing that by taking the median on the HUE CIRCLE instead (OkLCh) removes
 *    the mud, but a single channel still cannot say "green AND violet". Between
 *    near-opposite hues the shorter arc is ambiguous, so poison nudged 30%
 *    toward lightning came out #0fd277 — a spring green, which communicates
 *    nothing about lightning.
 *
 * So each contributor gets its OWN channel, and its weight decides which:
 *
 *   core      the archetype's own color (and the empowered surge). NEVER tinted
 *             — color is how empowered reads, and that tell has to survive.
 *   glow      the widest, softest layer, plus the contact flash. The heaviest
 *             contributor wins it: the class element if there is one, else the
 *             weapon. This is the "what am I swinging" read.
 *   particles the sparks. The lighter contributors land here, so a violet
 *             crackle reads ON a green blade instead of averaging into it.
 *
 * {@link blendTints} is still the fallback, for the one case where two
 * contributors genuinely collide on the particle layer (an elemental weapon AND
 * an active Imbue on an Apprentice). Both are secondary by then, and secondary
 * hues are usually compatible, so a hue-circle median is the right answer there.
 */

export interface AttackTint {
  /** Wide/soft layers and the contact flash: the dominant element. */
  glow: number;
  /** Spark/particle tint: the lighter contributors. */
  particles: number;
}

export interface Contribution {
  color: number;
  weight: number;
}

// ── Palette ────────────────────────────────────────────────────────────────
// Numeric mirror of ELEMENT_STYLE (which holds CSS strings, for text). Derived
// rather than re-authored, so damage numbers and FX can never drift apart.
const ELEMENT_COLOR: Record<DamageElement, number> = Object.fromEntries(
  Object.entries(ELEMENT_STYLE).map(([element, style]) => [
    element,
    parseInt(style.color.slice(1), 16),
  ]),
) as Record<DamageElement, number>;

/** The canonical colour for one element, shared by tints, ticks and numbers. */
export function elementColor(element: DamageElement): number {
  return ELEMENT_COLOR[element];
}

/**
 * One element's colour at three lightnesses.
 *
 * A single flat hue is a surprisingly weak colour cue: a translucent wash of one
 * value over busy terrain averages toward the terrain, which is exactly why
 * Detonate's element tint was hard to see even though it was always there. Three
 * values of the SAME hue read as colour far more strongly than one does, because
 * the contrast between the layers survives whatever is underneath them.
 * `fxPoisonExplosion` already hand-authored deep/mid/bright greens for this
 * reason; this derives the same structure for every element instead.
 *
 * Lightness is moved in OkLCh, not by scaling RGB channels. Scaling RGB drags
 * saturation along with it (halving `#5fd35f` gives a muddy olive, not a deep
 * green), whereas moving `l` alone keeps the hue and chroma the element is
 * recognised by — the same reason {@link blendTints} works in this space.
 */
export interface ElementShades {
  /** Underlay: the widest, dimmest body. */
  deep: number;
  /** The element's own authored colour — the one damage numbers use. */
  mid: number;
  /** Cores, sparks and leading edges. */
  bright: number;
}

const SHADE_STEP = 0.16;
const shadeCache = new Map<DamageElement, ElementShades>();

function shiftLightness(rgb: number, delta: number): number {
  const lch = rgbToLch(rgb);
  return lchToRgb({ ...lch, l: Math.max(0, Math.min(1, lch.l + delta)) });
}

export function elementShades(element: DamageElement): ElementShades {
  const cached = shadeCache.get(element);
  if (cached) return cached;
  const mid = ELEMENT_COLOR[element];
  const shades: ElementShades = {
    deep: shiftLightness(mid, -SHADE_STEP),
    mid,
    bright: shiftLightness(mid, SHADE_STEP),
  };
  shadeCache.set(element, shades);
  return shades;
}

/**
 * Relative pull of the two SECONDARY contributors when they have to share the
 * particle layer. The transient effect is heavier because it is the thing that
 * just happened; the weapon is a constant the player already knows about.
 *
 * Class-vs-weapon precedence is deliberately NOT a number here — it is the
 * layer assignment in {@link resolveAttackTint}. The class element takes the
 * big soft wash, the weapon takes the sparks.
 */
const TRANSIENT_WEIGHT = 0.6;
const WEAPON_WEIGHT = 0.4;

/**
 * Escape hatch for a specific pair that still reads badly in-game. The
 * realistic space is small, so pinning a bad pair by hand beats bending the
 * math around one case. Keyed `<heavier>+<lighter>`. Empty by design — add
 * entries only from what you actually see.
 */
const BLEND_OVERRIDES = new Map<string, number>();

// ── OkLCh ──────────────────────────────────────────────────────────────────

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

interface Lch {
  l: number;
  c: number;
  /** Hue in radians. */
  h: number;
}

function rgbToLch(rgb: number): Lch {
  const r = srgbToLinear(((rgb >> 16) & 0xff) / 255);
  const g = srgbToLinear(((rgb >> 8) & 0xff) / 255);
  const b = srgbToLinear((rgb & 0xff) / 255);

  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  return {
    l: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    c: Math.hypot(a, bb),
    h: Math.atan2(bb, a),
  };
}

/** OkLCh -> linear sRGB, unclamped, so gamut can be tested before rounding. */
function lchToLinearRgb({ l, c, h }: Lch): [number, number, number] {
  const a = Math.cos(h) * c;
  const b = Math.sin(h) * c;

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const lc = l_ * l_ * l_;
  const mc = m_ * m_ * m_;
  const sc = s_ * s_ * s_;

  return [
    4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
  ];
}

function inGamut(lch: Lch): boolean {
  return lchToLinearRgb(lch).every((v) => v >= -1e-4 && v <= 1 + 1e-4);
}

/**
 * Convert to sRGB, reducing chroma until the color fits.
 *
 * Rotating a hue at fixed chroma can leave the sRGB gamut, and naive clamping
 * of the out-of-range channel shifts the hue — the exact artifact this module
 * exists to avoid. Walking chroma down instead preserves hue and lightness and
 * only gives up saturation, which is the cheapest thing to lose.
 */
function lchToRgb(lch: Lch): number {
  let { c } = lch;
  if (!inGamut(lch)) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut({ ...lch, c: mid })) lo = mid;
      else hi = mid;
    }
    c = lo;
  }
  const to8 = (v: number): number =>
    Math.max(0, Math.min(255, Math.round(linearToSrgb(Math.max(v, 0)) * 255)));
  const [r, g, b] = lchToLinearRgb({ ...lch, c });
  return (to8(r) << 16) | (to8(g) << 8) | to8(b);
}

/**
 * Weighted median on the hue circle.
 *
 * Lightness is a weighted mean, hue a weighted circular mean (so the result
 * sits between the two HUES rather than between the two RGB points), and chroma
 * a weighted mean capped at the heaviest contributor's own chroma — the cap is
 * what stops a pastel dominant from being dragged into neon by a saturated
 * minor contributor.
 */
export function blendTints(contributions: Contribution[]): number {
  const live = contributions.filter((c) => c.weight > 0);
  if (live.length === 0) return 0xffffff;
  if (live.length === 1) return live[0].color;

  const dominant = live.reduce((a, b) => (b.weight > a.weight ? b : a));
  const dominantLch = rgbToLch(dominant.color);
  const total = live.reduce((sum, c) => sum + c.weight, 0);

  let l = 0;
  let c = 0;
  let x = 0;
  let y = 0;
  for (const contribution of live) {
    const w = contribution.weight / total;
    const lch = rgbToLch(contribution.color);
    l += lch.l * w;
    c += lch.c * w;
    // Circular mean: sum weighted unit vectors. Averaging the angles directly
    // would break across the 0/2pi seam (two reds blending via cyan).
    x += Math.cos(lch.h) * w;
    y += Math.sin(lch.h) * w;
  }

  // Near-opposite hues cancel to a near-zero vector, leaving the mean angle
  // meaningless. Keep the dominant's own hue rather than inventing one.
  const h = Math.hypot(x, y) < 0.05 ? dominantLch.h : Math.atan2(y, x);
  return lchToRgb({ l, c: Math.min(c, dominantLch.c), h });
}

// ── Resolution ─────────────────────────────────────────────────────────────

/** The equipped weapon's cosmetic element, if it carries one. */
export function weaponElement(player: PlayerView): DamageElement | null {
  const weaponId = player.equipment?.weapon;
  if (!weaponId) return null;
  return ITEM_DATABASE.get(weaponId)?.element ?? null;
}

const blendCache = new Map<string, number>();

function cachedBlend(heavier: DamageElement, lighter: DamageElement): number {
  const key = `${heavier}+${lighter}`;
  const pinned = BLEND_OVERRIDES.get(key);
  if (pinned !== undefined) return pinned;
  const hit = blendCache.get(key);
  if (hit !== undefined) return hit;
  const blended = blendTints([
    { color: ELEMENT_COLOR[heavier], weight: TRANSIENT_WEIGHT },
    { color: ELEMENT_COLOR[lighter], weight: WEAPON_WEIGHT },
  ]);
  blendCache.set(key, blended);
  return blended;
}

/**
 * Resolve the tint layers for one attack.
 *
 * `classElement` is the archetype's own element — only the Apprentice has one,
 * and it always takes the wash, because a frost weapon must not paint a
 * Pyromancer's fire DoT blue. `transient` is an effect-driven element such as
 * Imbue Lightning.
 *
 * Returns null when nothing wants to tint, so callers keep their own palette.
 */
export function resolveAttackTint(
  player: PlayerView,
  classElement: DamageElement | null,
  transient: DamageElement | null,
): AttackTint | null {
  const weapon = weaponElement(player);
  if (!classElement && !weapon && !transient) return null;

  // Heaviest contributor takes the wash. With no class element the weapon is
  // the heaviest thing present, so it gets the full wash rather than a faint
  // 30% share of one — weights are normalized over what is actually there.
  const primary = classElement ?? weapon ?? transient;
  if (!primary) return null;

  // Everything that did not win the wash lands on the sparks, transient first
  // because it is the heavier of the two. When both are present they collide on
  // one channel, and only then does a hue-circle median earn its place.
  const lighter: DamageElement[] = [];
  if (transient) lighter.push(transient);
  if (weapon && weapon !== primary) lighter.push(weapon);

  const particles =
    lighter.length === 0
      ? ELEMENT_COLOR[primary]
      : lighter.length === 1
        ? ELEMENT_COLOR[lighter[0]]
        : cachedBlend(lighter[0], lighter[1]);

  return { glow: ELEMENT_COLOR[primary], particles };
}
