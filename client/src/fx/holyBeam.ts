import type { PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import type { RenderState } from '../render/state';
import { DEPTH } from '../render/depth';

/**
 * Devout Priest channeled beam — a holy variant of the laser beam. Activated by
 * the server's `channel-beam` hit effect each beam tick, and kept on screen for
 * the whole channel by gating render on the networked `isChanneling` flag (the
 * per-tick `until` is just a fallback between broadcasts).
 *
 * Visual: a broad soft-gold halo, a warm cream mid-glow, and a bright white core,
 * with a radiant sunburst + drifting motes at the impact point — "holy" where the
 * laser reads "industrial".
 */
/**
 * One-shot holy flash — plays on the execution "cast" that starts the channel,
 * replacing the normal melee lunge/ring. An expanding gold ring with a white core
 * and a radiant cross.
 */
export function fxHolyFlash(scene: GameScene, x: number, y: number, scale = 1): void {
  if (document.hidden) return;
  const g = scene.add.graphics().setDepth(DEPTH.FX);
  const s = { r: 4 * scale, alpha: 1 };
  scene.tweens.add({
    targets: s,
    r: 34 * scale,
    alpha: 0,
    duration: 340,
    ease: 'Cubic.Out',
    onUpdate: () => {
      g.clear();
      g.lineStyle(3, 0xffe066, s.alpha * 0.85);
      g.strokeCircle(x, y, s.r);
      g.fillStyle(0xffffff, s.alpha * 0.5);
      g.fillCircle(x, y, s.r * 0.4);
      g.lineStyle(2, 0xfff2b0, s.alpha * 0.7);
      const rl = s.r * 1.35;
      g.lineBetween(x - rl, y, x + rl, y);
      g.lineBetween(x, y - rl, x, y + rl);
    },
    onComplete: () => g.destroy(),
  });
}

export function activateHolyBeam(state: RenderState, scene: GameScene, targetId: string): void {
  state.holyBeam.targetId = targetId;
  // Beam ticks land every 500ms; keep the beam alive comfortably across them and
  // across the ~200ms broadcast cadence.
  state.holyBeam.until = Date.now() + 700;

  if (!state.holyBeam.graphics) {
    state.holyBeam.graphics = scene.add.graphics().setDepth(DEPTH.FX);
  }
}

export function updateHolyBeam(state: RenderState, scene: GameScene): void {
  const beam = state.holyBeam;
  if (!beam.graphics) return;

  const now = Date.now();
  const ownSprite = state.ownId ? state.sprite.get(state.ownId) : undefined;
  const targetSprite = beam.targetId ? state.sprite.get(beam.targetId) : undefined;
  const player = state.ownId
    ? (state.view.get(state.ownId) as PlayerView | undefined)
    : undefined;

  // Primary gate is the networked channel flag so the beam persists for the whole
  // channel; `until` covers the brief gap if a hit event hasn't refreshed targetId.
  if (
    !player ||
    !player.isChanneling ||
    !ownSprite ||
    !targetSprite ||
    now > beam.until
  ) {
    beam.graphics.clear();
    if (!player?.isChanneling) beam.targetId = null;
    return;
  }

  const fromX = ownSprite.x;
  const fromY = ownSprite.y;
  const toX = targetSprite.x;
  const toY = targetSprite.y;
  const pulse = 0.78 + Math.sin(now / 90) * 0.16;
  const shimmer = 0.85 + Math.sin(now / 38) * 0.15;

  beam.graphics.clear();
  // Broad soft-gold halo
  beam.graphics.lineStyle(14, 0xffe066, 0.12 * pulse);
  beam.graphics.lineBetween(fromX, fromY, toX, toY);
  // Warm cream mid-glow
  beam.graphics.lineStyle(7, 0xfff2b0, 0.32 * pulse);
  beam.graphics.lineBetween(fromX, fromY, toX, toY);
  // Bright white core
  beam.graphics.lineStyle(2.5, 0xffffff, 0.95 * shimmer);
  beam.graphics.lineBetween(fromX, fromY, toX, toY);

  // Radiant sunburst at the impact point
  const burst = 6 + Math.sin(now / 70) * 2;
  beam.graphics.fillStyle(0xfff6cc, 0.8);
  beam.graphics.fillCircle(toX, toY, burst);
  beam.graphics.fillStyle(0xffe066, 0.22);
  beam.graphics.fillCircle(toX, toY, burst * 2.6);

  // Rotating sun rays for the holy read
  const rayLen = burst * 2.2;
  beam.graphics.lineStyle(2, 0xffffff, 0.55 * shimmer);
  for (let i = 0; i < 4; i++) {
    const a = now / 320 + (i * Math.PI) / 4;
    beam.graphics.lineBetween(
      toX + Math.cos(a) * burst, toY + Math.sin(a) * burst,
      toX + Math.cos(a) * rayLen, toY + Math.sin(a) * rayLen,
    );
  }

  // Drifting ascending motes along the beam
  beam.graphics.fillStyle(0xffffe0, 0.7);
  for (let i = 0; i < 3; i++) {
    const t = ((now / 700) + i / 3) % 1;
    const mx = fromX + (toX - fromX) * t;
    const my = fromY + (toY - fromY) * t - Math.sin(t * Math.PI) * 6;
    beam.graphics.fillCircle(mx, my, 1.6);
  }
}
