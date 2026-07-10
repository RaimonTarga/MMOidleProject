import type { GameScene } from '../scenes/GameScene';
import type { RenderState } from './state';
import { getOwnView } from './state';
import { DEPTH } from './depth';

const RING_COLOR = 0xff4433;
const RING_PAD = 1.3; // ring sits just outside the mob's ground shadow
const PULSE_MS = 1100;
const PULSE_GROW = 0.08;

/**
 * Red ground ring under the own player's current attack target — hugs the
 * target's shadow ellipse (sized by drawShadows earlier in the frame) with a
 * gentle alpha/size breathe. Time-based sin pulse, no tweens, so it is safe
 * across background tabs.
 */
export function drawTargetIndicator(state: RenderState, scene: GameScene): void {
  const g = ensureGraphics(state, scene);

  const targetId = getOwnView(state)?.attackTargetId;
  const shadow =
    targetId && state.kind.get(targetId) === 'monster'
      ? state.shadow.get(targetId)
      : undefined;

  g.clear();
  if (!shadow) return;

  const t = (Math.sin((Date.now() / PULSE_MS) * Math.PI * 2) + 1) / 2;
  const pad = RING_PAD + PULSE_GROW * t;
  const w = shadow.width * pad;
  const h = shadow.height * pad;

  g.fillStyle(RING_COLOR, 0.05 + 0.05 * t);
  g.fillEllipse(shadow.x, shadow.y, w, h);
  g.lineStyle(3, RING_COLOR, 0.5 + 0.35 * t);
  g.strokeEllipse(shadow.x, shadow.y, w, h);
  // Just above the target's own shadow, still below every sprite band.
  g.setDepth(DEPTH.SHADOW + shadow.y + 1);
}

function ensureGraphics(state: RenderState, scene: GameScene): Phaser.GameObjects.Graphics {
  if (!state.targetIndicator.graphics) {
    state.targetIndicator.graphics = scene.add.graphics().setDepth(DEPTH.SHADOW);
  }
  return state.targetIndicator.graphics;
}
