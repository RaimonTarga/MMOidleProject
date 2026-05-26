import { EFFECT_BY_ID, EFFECT_DEFS, EFFECT_FRAME_COUNT, EFFECT_GRID, type Vec2 } from '@mmo-idle/shared';
import type { GameScene } from '../GameScene';

export function initParticleTextures(scene: GameScene): void {
  const dotG = scene.make.graphics({ x: 0, y: 0 }, false);
  dotG.fillStyle(0xffffff, 1);
  dotG.fillCircle(8, 8, 8);
  dotG.generateTexture('ptx-dot', 16, 16);
  dotG.destroy();

  const sparkG = scene.make.graphics({ x: 0, y: 0 }, false);
  sparkG.fillStyle(0xffffff, 1);
  sparkG.fillRect(0, 0, 12, 3);
  sparkG.generateTexture('ptx-spark', 12, 3);
  sparkG.destroy();
}

export function initEffectFrames(scene: GameScene): void {
  const cols = EFFECT_GRID;
  for (const def of EFFECT_DEFS) {
    if (!def.rowSlices) continue;
    const texture = scene.textures.get(def.key);
    if (!texture) continue;
    for (let row = 0; row < def.rowSlices.length; row++) {
      const { y, h } = def.rowSlices[row];
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const name = `${idx}`;
        if (texture.has(name)) continue;
        texture.add(name, 0, col * def.frameSize, y, def.frameSize, h);
      }
    }
  }
}

export function burstFx(
  scene: GameScene,
  texture: string,
  x: number,
  y: number,
  count: number,
  lifespan: number,
  config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig,
): void {
  const emitter = scene.add.particles(x, y, texture, {
    ...config,
    lifespan,
    quantity: count,
    emitting: false,
  });
  emitter.setDepth(12);
  emitter.explode(count);
  scene.time.delayedCall(lifespan + 200, () => { if (emitter.active) emitter.destroy(); });
}

export function playOneShotEffect(scene: GameScene, id: string, pos: Vec2, opts?: { scale?: number; depth?: number }): void {
  const def = EFFECT_BY_ID.get(id);
  if (!def) return;

  const size = (def.baseSize ?? 96) * (opts?.scale ?? def.scale ?? 1.5);
  const startFrame = def.startFrame ?? 0;
  const endFrame = def.endFrame ?? EFFECT_FRAME_COUNT - 1;
  const sprite = scene.add
    .sprite(pos.x, pos.y + (def.anchorYPx ?? 0), def.key)
    .setDepth(opts?.depth ?? def.depth ?? 12)
    .setDisplaySize(size, size)
    .setFrame(startFrame);
  const proxy = { frame: startFrame };

  scene.tweens.add({
    targets: proxy,
    frame: endFrame,
    duration: def.durationMs,
    ease: 'Linear',
    onUpdate: () => {
      sprite.setFrame(Math.max(startFrame, Math.min(endFrame, Math.floor(proxy.frame))));
    },
    onComplete: () => sprite.destroy(),
  });
}

export function spawnDamageNumber(scene: GameScene, pos: Vec2, barOffsetY: number, amount: number, color: string): void {
  const jitter = (Math.random() - 0.5) * 18;
  const startY = pos.y - barOffsetY - 6;
  const text = scene.add
    .text(pos.x + jitter, startY, String(amount), {
      color,
      fontSize: '14px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    })
    .setDepth(15)
    .setOrigin(0.5, 1);

  scene.tweens.add({
    targets: text,
    y: startY - 40,
    alpha: 0,
    duration: 900,
    ease: 'Power2',
    onComplete: () => text.destroy(),
  });
}
