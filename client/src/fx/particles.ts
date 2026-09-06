import { EFFECT_BY_ID, EFFECT_DEFS, EFFECT_FRAME_COUNT, EFFECT_GRID, type Vec2 } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { shouldRunClientFx } from './guard';
import { DEPTH } from '../render/depth';

type ParticleConfig = Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;

interface PooledEmitter {
  key: string;
  emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  lastUsed: number;
}

const MAX_POOLED_EMITTERS = 32;
const emitterPools = new WeakMap<GameScene, PooledEmitter[]>();
let emitterUseCounter = 0;

/** Shared empowered/"critical" damage-number styling (gold, enlarged, '!'). */
export { EMPOWERED_DAMAGE_COLOR, EMPOWERED_DAMAGE_SIZE_PX } from '../render/damageNumberConstants';

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

function emitterKey(texture: string, lifespan: number, config: ParticleConfig): string {
  // Burst configs are data-only object literals. Including the configuration in
  // the key lets overlapping bursts share an emitter without changing the ops
  // used by particles that are already alive.
  return `${texture}:${lifespan}:${JSON.stringify(config)}`;
}

function emitterPool(scene: GameScene): PooledEmitter[] {
  const existing = emitterPools.get(scene);
  if (existing) return existing;

  const pool: PooledEmitter[] = [];
  emitterPools.set(scene, pool);
  scene.events.once('shutdown', () => {
    for (const entry of pool) {
      if (entry.emitter.active) entry.emitter.destroy();
    }
    pool.length = 0;
    emitterPools.delete(scene);
  });
  return pool;
}

function acquireEmitter(
  scene: GameScene,
  texture: string,
  lifespan: number,
  config: ParticleConfig,
): Phaser.GameObjects.Particles.ParticleEmitter | null {
  const pool = emitterPool(scene);
  const key = emitterKey(texture, lifespan, config);
  const cached = pool.find((entry) => entry.key === key);
  if (cached) {
    cached.lastUsed = ++emitterUseCounter;
    return cached.emitter;
  }

  if (pool.length >= MAX_POOLED_EMITTERS) {
    let idleIndex = -1;
    let oldestUse = Number.POSITIVE_INFINITY;
    for (let i = 0; i < pool.length; i++) {
      const entry = pool[i];
      if (entry.emitter.getAliveParticleCount() === 0 && entry.lastUsed < oldestUse) {
        idleIndex = i;
        oldestUse = entry.lastUsed;
      }
    }

    // Prefer dropping a cosmetic burst under extreme load to allocating beyond
    // the cap or reconfiguring an emitter whose particles are still visible.
    if (idleIndex < 0) return null;
    const [evicted] = pool.splice(idleIndex, 1);
    evicted.emitter.destroy();
  }

  const emitter = scene.add.particles(0, 0, texture, {
    ...config,
    lifespan,
    emitting: false,
  });
  emitter.setDepth(DEPTH.FX);
  pool.push({ key, emitter, lastUsed: ++emitterUseCounter });
  return emitter;
}

export function burstFx(
  scene: GameScene,
  texture: string,
  x: number,
  y: number,
  count: number,
  lifespan: number,
  config: ParticleConfig,
): void {
  if (!shouldRunClientFx()) return;
  acquireEmitter(scene, texture, lifespan, config)?.explode(count, x, y);
}

export function playOneShotEffect(scene: GameScene, id: string, pos: Vec2, opts?: { scale?: number; depth?: number }): void {
  if (!shouldRunClientFx()) return;
  const def = EFFECT_BY_ID.get(id);
  if (!def) return;

  const size = (def.baseSize ?? 96) * (opts?.scale ?? def.scale ?? 1.5);
  const startFrame = def.startFrame ?? 0;
  const endFrame = def.endFrame ?? EFFECT_FRAME_COUNT - 1;
  const sprite = scene.add
    .sprite(pos.x, pos.y + (def.anchorYPx ?? 0), def.key)
    .setDepth(opts?.depth ?? def.depth ?? DEPTH.FX)
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

export interface DamageNumberStyle {
  /** Font size in px (default 14). */
  sizePx?: number;
  /** Trailing string appended after the amount (e.g. '!' for crits). */
  suffix?: string;
  /** Trailing glyph/symbol appended after the suffix (e.g. element marker). */
  symbol?: string;
}

export function spawnDamageNumber(
  scene: GameScene,
  pos: Vec2,
  barOffsetY: number,
  amount: number,
  color: string,
  style?: DamageNumberStyle,
): void {
  if (!shouldRunClientFx()) return;
  const jitter = (Math.random() - 0.5) * 18;
  const startY = pos.y - barOffsetY - 6;
  const label = `${amount}${style?.suffix ?? ''}${style?.symbol ?? ''}`;
  const text = scene.add
    .text(pos.x + jitter, startY, label, {
      color,
      fontSize: `${style?.sizePx ?? 14}px`,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    })
    .setDepth(DEPTH.FX)
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
