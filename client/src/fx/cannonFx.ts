import type { PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import type { RenderState } from '../render/state';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';

/**
 * Cannoneer charge-up: while the networked `cannonChargePct` climbs (0→100) over the
 * first half of a reload, draw a tightening, brightening ring of orange energy on the
 * own player — the cannon winding up before it fires. No target needed; the burst's
 * own blast FX (fxCannonBlast) plays at the target when it goes off.
 */
export function updateCannonCharge(state: RenderState, scene: GameScene): void {
  const g = ensureGraphics(state, scene);
  if (!g) return;

  const player = state.ownId
    ? (state.view.get(state.ownId) as PlayerView | undefined)
    : undefined;
  const ownSprite = state.ownId ? state.sprite.get(state.ownId) : undefined;
  const pct = player?.cannonChargePct ?? 0;

  if (!player || !ownSprite || pct <= 0) {
    g.clear();
    return;
  }

  const t = Math.min(1, pct / 100);
  const now = Date.now();
  const x = ownSprite.x;
  const y = ownSprite.y;
  // Ring tightens from 30→10 as it charges; flickers faster near full.
  const radius = 30 - 18 * t + Math.sin(now / (90 - 50 * t)) * 2;
  const alpha = 0.35 + 0.5 * t;

  g.clear();
  g.lineStyle(2 + 2 * t, 0xff7733, alpha);
  g.strokeCircle(x, y, radius);
  g.fillStyle(0xffcc66, 0.15 + 0.35 * t);
  g.fillCircle(x, y, 4 + 5 * t);
}

function ensureGraphics(state: RenderState, scene: GameScene): Phaser.GameObjects.Graphics | null {
  if (!state.cannonCharge.graphics) {
    state.cannonCharge.graphics = scene.add.graphics().setDepth(DEPTH.FX);
  }
  return state.cannonCharge.graphics;
}

/**
 * Cannoneer burst — a big, heavy explosion on the target when the stored pool fires.
 * White-hot core, double orange shockwave rings, and a wide spark blast.
 */
export function fxCannonBlast(scene: GameScene, x: number, y: number): void {
  if (document.hidden) return;
  const orange = 0xff7722;
  const core   = 0xfff2d0;

  const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  flash.fillStyle(core, 0.95);
  flash.fillCircle(0, 0, 16);
  flash.fillStyle(orange, 0.5);
  flash.fillCircle(0, 0, 28);
  scene.tweens.add({ targets: flash, alpha: 0, scaleX: 2, scaleY: 2, duration: 260, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });

  // Two staggered shockwave rings for weight.
  for (let k = 0; k < 2; k++) {
    const ring = scene.add.graphics().setDepth(DEPTH.FX);
    const s = { r: 8, alpha: 0.9 };
    scene.tweens.add({
      targets: s, r: 58 + k * 16, alpha: 0, duration: 360 + k * 120, delay: k * 90, ease: 'Cubic.Out',
      onUpdate: () => {
        ring.clear();
        ring.lineStyle(4 - k, orange, s.alpha);
        ring.strokeCircle(x, y, s.r);
      },
      onComplete: () => ring.destroy(),
    });
  }

  burstFx(scene, 'ptx-spark', x, y, 18, 380, {
    tint: orange,
    speed: { min: 140, max: 380 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.3, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}
