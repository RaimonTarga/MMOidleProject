/**
 * The frame-charge weapon glow actually draws — progression rework Phase 3.
 *
 * `combatFx.ts` is a chain of `if`s with no unknown-kind warning, so a missing
 * handler for a new event kind is SILENT: the server emits, the client drops it,
 * and a typecheck is perfectly happy. That is exactly how this feature shipped
 * half-built in Wave 1, so a typecheck is not evidence here and this file drives
 * the real module.
 *
 * The module is loaded the way `remotePlayerAttack.test.ts` loads `combatFx.ts`:
 * transpiled and run in a vm with its imports injected. That is not ceremony. It
 * imports `GameScene` as a type, exactly as its sibling `fx/aura.ts` does, and a
 * plain `import` would pull that whole scene graph — audio included — into the
 * SERVER test program, where `tsconfig.test.json`'s module setting makes
 * `import.meta` in `audio/audioEngine.ts` a type error. Transpiling erases the
 * type-only import instead, so the production module stays idiomatic with its
 * siblings and `pnpm typecheck` stays clean. `createRenderState` is imported
 * normally; `render/state.ts` carries no such graph (the same test proves it).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as shared from '@mmo-idle/shared';
import { createRenderState } from '../../client/src/render/state';
import { DEPTH } from '../../client/src/render/depth';

const glowSrc = readFileSync(
  new URL('../../client/src/fx/frameChargeGlow.ts', import.meta.url),
  'utf8',
);
const glowExports: Record<string, any> = {};
runInNewContext(
  ts.transpileModule(glowSrc, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  {
    exports: glowExports, console, performance,
    require(name: string) {
      if (name === '@mmo-idle/shared') return shared;
      if (name === '../render/depth') return { DEPTH };
      throw new Error(`frameChargeGlow asked for an unexpected module: ${name}`);
    },
  },
);
const recordFrameCharge = glowExports.recordFrameCharge as (
  state: ReturnType<typeof createRenderState>,
  playerId: string, stacks: number, max: number, allowBurst: boolean,
) => void;
const updateFrameChargeGlows = glowExports.updateFrameChargeGlows as (
  state: ReturnType<typeof createRenderState>, scene: unknown, dt: number,
) => void;
assert.equal(typeof recordFrameCharge, 'function', 'recordFrameCharge should be exported');
assert.equal(typeof updateFrameChargeGlows, 'function', 'updateFrameChargeGlows should be exported');

interface Circle { r: number; alpha: number }

function makeGraphics(circles: Circle[]) {
  let alpha = 1;
  const g: Record<string, unknown> = {
    x: 0, y: 0, scaleX: 1, scaleY: 1, alpha: 1,
    destroyed: false,
    setDepth() { return g; },
    clear() { circles.length = 0; return g; },
    fillStyle(_c: number, a = 1) { alpha = a; return g; },
    lineStyle(_w: number, _c: number, a = 1) { alpha = a; return g; },
    fillCircle(_x: number, _y: number, r: number) { circles.push({ r, alpha }); return g; },
    strokeCircle(_x: number, _y: number, r: number) { circles.push({ r, alpha }); return g; },
    beginPath() { return g; },
    moveTo() { return g; },
    lineTo() { return g; },
    strokePath() { return g; },
    destroy() { g.destroyed = true; return g; },
  };
  return g;
}

/**
 * The persistent glow and the one-shot release burst must be recorded SEPARATELY
 * or they cannot be told apart: the burst draws its own bright circles at the same
 * moment the glow is supposed to be empty, and a single shared array would let the
 * burst's flash masquerade as a glow that never went out. The module distinguishes
 * them itself — the glow is `add.graphics()` with no config, the burst
 * `add.graphics({ x, y })` — so the stub keys off exactly that.
 */
function makeScene() {
  const circles: Circle[] = [];
  const burstCircles: Circle[] = [];
  const created: Record<string, unknown>[] = [];
  const tweens: Record<string, unknown>[] = [];
  const scene = {
    add: {
      graphics(cfg?: unknown) {
        const g = makeGraphics(cfg === undefined ? circles : burstCircles);
        created.push(g);
        return g;
      },
    },
    tweens: { add(cfg: Record<string, unknown>) { tweens.push(cfg); return cfg; } },
  };
  return { scene, circles, burstCircles, created, tweens };
}

/** A live, visible player the glow can attach to. */
function seed(state: ReturnType<typeof createRenderState>, id: string): void {
  state.view.set(id, { id, isDead: false } as never);
  state.sprite.set(id, { x: 200, y: 300, depth: 12 } as never);
  state.kind.set(id, 'player');
}

/**
 * Peak radius drawn at a VISIBLE alpha in the last pass — what the player
 * actually sees. Alpha matters: every radius in this glow scales from a non-zero
 * base, so at a bank of zero the module still issues its circle commands, just
 * at alpha 0. Measuring geometry alone would call an invisible glow a visible one.
 */
function peakRadius(circles: Circle[]): number {
  return circles.reduce((max, c) => (c.alpha > 0.001 ? Math.max(max, c.r) : max), 0);
}

const FRAME = 1 / 60;

// ── 1. The glow grows with the bank, and only after a frame runs ─────────────
{
  const state = createRenderState();
  seed(state, 'p1');
  const { scene, circles, created } = makeScene();

  recordFrameCharge(state, 'p1', 1, 8, true);
  assert.equal(created.length, 0, 'recording must not touch Phaser — the draw pass owns that');

  // Settle toward a small bank, then toward a nearly-full one, and compare.
  for (let i = 0; i < 120; i++) updateFrameChargeGlows(state, scene, FRAME);
  const atOne = peakRadius(circles);
  assert(atOne > 0, 'a charged bank should draw a glow');

  recordFrameCharge(state, 'p1', 8, 8, true);
  for (let i = 0; i < 120; i++) updateFrameChargeGlows(state, scene, FRAME);
  const atFull = peakRadius(circles);
  assert(
    atFull > atOne,
    `the glow must grow with the bank: 8/8 drew ${atFull}, 1/8 drew ${atOne}`,
  );
}

// ── 2. The spend snaps out and releases, rather than easing away ─────────────
{
  const state = createRenderState();
  seed(state, 'p1');
  const { scene, circles, tweens } = makeScene();

  recordFrameCharge(state, 'p1', 8, 8, true);
  for (let i = 0; i < 120; i++) updateFrameChargeGlows(state, scene, FRAME);
  assert(peakRadius(circles) > 0, 'the bank should be glowing before the spend');
  const tweensBefore = tweens.length;

  recordFrameCharge(state, 'p1', 0, 8, true);
  updateFrameChargeGlows(state, scene, FRAME);
  assert(
    tweens.length > tweensBefore,
    'the spend is the payoff: it must release a burst, not fade quietly',
  );
  // ONE pass, not a long ease: the charge is gone the instant the mechanic fires.
  assert.equal(
    peakRadius(circles), 0,
    'the glow must snap out on the spend, inside a single frame',
  );
}

// ── 3. A hidden tab queues nothing ──────────────────────────────────────────
{
  const state = createRenderState();
  seed(state, 'p1');
  const { scene, tweens } = makeScene();

  recordFrameCharge(state, 'p1', 8, 8, true);
  for (let i = 0; i < 120; i++) updateFrameChargeGlows(state, scene, FRAME);
  const tweensBefore = tweens.length;

  // The spend arrives while hidden: `allowBurst` false. Nothing may be queued for
  // when the tab returns — the repo's background-tab rule.
  recordFrameCharge(state, 'p1', 0, 8, false);
  for (let i = 0; i < 10; i++) updateFrameChargeGlows(state, scene, FRAME);
  assert.equal(
    tweens.length, tweensBefore,
    'a spend received while hidden must drop its burst, never queue it',
  );
  // The bank is still authoritative, so the glow reads empty once drawn again.
  assert.equal(
    state.frameChargeGlow.get('p1')?.stacks, 0,
    'the bookkeeping stays current even while hidden',
  );
}

// ── 4. The ramp: one event per shot must not queue per-event animation ──────
{
  const state = createRenderState();
  seed(state, 'p1');
  const { scene, tweens } = makeScene();

  // The Artillerist's ramp advances every shot of a 20-round clip. All twenty
  // land between two rendered frames here, the worst case for a per-event tween.
  for (let s = 1; s <= 20; s++) recordFrameCharge(state, 'p1', s, 20, true);
  assert.equal(tweens.length, 0, 'twenty bank changes must queue zero tweens');
  assert.equal(
    state.frameChargeGlow.get('p1')?.stacks, 20,
    'the newest value wins; earlier ones are not animated in turn',
  );
  updateFrameChargeGlows(state, scene, FRAME);
  assert.equal(tweens.length, 0, 'drawing a rising bank still queues nothing');
}

// ── 5. Degenerate inputs cannot throw ───────────────────────────────────────
{
  const state = createRenderState();
  seed(state, 'p1');
  const { scene, circles } = makeScene();

  // A frame with no cap: nothing to draw a fraction against.
  recordFrameCharge(state, 'p1', 3, 0, true);
  updateFrameChargeGlows(state, scene, FRAME);
  assert.equal(peakRadius(circles), 0, 'max 0 must draw nothing rather than divide by zero');

  // An event for a player this client has never seen, then one for a dead one.
  recordFrameCharge(state, 'ghost', 4, 8, true);
  updateFrameChargeGlows(state, scene, FRAME);
  assert(!state.frameChargeGlow.has('ghost'), 'an unknown player is pruned, not drawn');

  seed(state, 'p2');
  recordFrameCharge(state, 'p2', 4, 8, true);
  for (let i = 0; i < 60; i++) updateFrameChargeGlows(state, scene, FRAME);
  state.view.set('p2', { id: 'p2', isDead: true } as never);
  updateFrameChargeGlows(state, scene, FRAME);
  assert(!state.frameChargeGlow.has('p2'), 'a dead player loses its glow and its entry');
}

// ── 6. A remote player glows too ────────────────────────────────────────────
{
  const state = createRenderState();
  state.ownId = 'self';
  seed(state, 'self');
  seed(state, 'friend');
  const { scene, circles } = makeScene();

  recordFrameCharge(state, 'friend', 6, 8, true);
  for (let i = 0; i < 120; i++) updateFrameChargeGlows(state, scene, FRAME);
  assert(
    peakRadius(circles) > 0,
    "an ally's bank is information too — the event is node-wide and must draw",
  );
}

console.log('frameChargeGlow.test.ts: ok');
