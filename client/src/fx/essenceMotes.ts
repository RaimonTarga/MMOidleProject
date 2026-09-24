import { ESSENCE_COLORS, type EssenceType, type PlayerView, type Vec2 } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { shouldRunClientFx } from './guard';
import { essenceMoteProfile, MAX_ESSENCE_MOTES } from './essenceMoteProfile';

interface Mote {
  image: Phaser.GameObjects.Image;
  active: boolean;
  playerId: string;
  nodeId: string;
  age: number;
  delay: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  tier: number;
  phase: number;
}

const pools = new WeakMap<GameScene, Mote[]>();
const FLIGHT_MS = 520;

// Bake once: no live Graphics geometry, per-mote emitters, timers or tweens.
function initTextures(scene: GameScene): void {
  for (let tier = 0; tier <= 4; tier++) {
    const key = `essence-mote-${tier}`;
    if (scene.textures.exists(key)) continue;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    for (let r = 15; r >= 5; r -= 2) {
      g.fillStyle(0xffffff, 0.035 + (15 - r) * 0.008);
      g.fillCircle(16, 16, r);
    }
    g.fillStyle(0xffffff, 1);
    if (tier === 0) g.fillCircle(16, 16, 5);
    else {
      g.fillPoints([{ x: 16, y: 5 }, { x: 21, y: 16 }, { x: 16, y: 27 }, { x: 11, y: 16 }], true);
      if (tier >= 2) g.fillPoints([{ x: 6, y: 16 }, { x: 16, y: 12 }, { x: 26, y: 16 }, { x: 16, y: 20 }], true);
      if (tier >= 3) {
        g.lineStyle(1, 0xffffff, 0.65);
        g.strokeCircle(16, 16, 12);
      }
    }
    g.generateTexture(key, 32, 32);
    g.destroy();
  }
}

function release(mote: Mote): void {
  mote.active = false;
  mote.image.setVisible(false).setActive(false);
}

export function clearEssenceMotes(scene: GameScene): void {
  for (const mote of pools.get(scene) ?? []) release(mote);
}

export function spawnEssenceMotes(scene: GameScene, playerId: string, pos: Vec2, amount: number, type: EssenceType): void {
  if (!shouldRunClientFx() || scene.transitioning) return;
  const profile = essenceMoteProfile(amount);
  if (!profile.count || !scene.state.sprite.has(playerId)) return;
  let pool = pools.get(scene);
  if (!pool) {
    initTextures(scene);
    pool = [];
    pools.set(scene, pool);
    const onHidden = () => { if (document.hidden) clearEssenceMotes(scene); };
    document.addEventListener('visibilitychange', onHidden);
    scene.events.once('shutdown', () => {
      document.removeEventListener('visibilitychange', onHidden);
      for (const mote of pool!) mote.image.destroy();
      pools.delete(scene);
    });
  }
  const color = Number.parseInt(ESSENCE_COLORS[type].slice(1), 16);
  const phase = Math.random() * Math.PI * 2;
  for (let i = 0; i < profile.count; i++) {
    let mote = pool.find(entry => !entry.active);
    if (!mote) {
      if (pool.length >= MAX_ESSENCE_MOTES) break; // Drop cosmetics under burst load.
      mote = { image: scene.add.image(0, 0, 'essence-mote-0').setDepth(DEPTH.FX),
        active: false, playerId: '', nodeId: '', age: 0, delay: 0,
        x: 0, y: 0, dx: 0, dy: 0, size: 0, tier: 0, phase: 0 };
      pool.push(mote);
    }
    const angle = phase + i * 2.399963;
    const radius = 16 + Math.random() * (18 + profile.tier * 7);
    Object.assign(mote, { active: true, playerId, nodeId: scene.state.ownNodeId,
      age: 0, delay: 340 + i * 16, x: pos.x, y: pos.y - 8,
      dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius * 0.55,
      size: profile.size, tier: profile.tier, phase: angle });
    mote.image.setTexture(`essence-mote-${profile.tier}`).setTint(color)
      .setPosition(mote.x, mote.y).setDisplaySize(profile.size, profile.size)
      .setRotation(0).setAlpha(1).setActive(true).setVisible(true);
  }
}

export function updateEssenceMotes(scene: GameScene, delta: number): void {
  const pool = pools.get(scene);
  if (!pool) return;
  if (!shouldRunClientFx() || scene.transitioning || delta > 250) {
    clearEssenceMotes(scene);
    return;
  }
  const dt = Math.max(0, Math.min(delta, 50));
  for (const mote of pool) {
    if (!mote.active) continue;
    const target = scene.state.sprite.get(mote.playerId);
    const player = scene.state.view.get(mote.playerId) as PlayerView | undefined;
    if (mote.nodeId !== scene.state.ownNodeId || !target || !player || player.isDead) {
      release(mote);
      continue;
    }
    mote.age += dt;
    const flight = Math.max(0, (mote.age - mote.delay) / FLIGHT_MS);
    if (flight >= 1) { release(mote); continue; }
    let x: number;
    let y: number;
    if (flight === 0) {
      const burst = Math.min(1, mote.age / 220);
      const spread = 1 - (1 - burst) ** 3;
      x = mote.x + mote.dx * spread;
      y = mote.y + mote.dy * spread - Math.sin(burst * Math.PI) * 22;
    } else {
      const t = flight * flight; // Gather slowly, then accelerate into the moving player.
      const curl = Math.sin(flight * Math.PI) * (12 + mote.tier * 5);
      x = (mote.x + mote.dx) * (1 - t) + target.x * t + Math.cos(mote.phase) * curl;
      y = (mote.y + mote.dy) * (1 - t) + (target.y - 10) * t - curl;
    }
    const pulse = mote.tier >= 2 ? 1 + 0.12 * Math.sin(mote.age * 0.016 + mote.phase) : 1;
    const size = mote.size * pulse * (1 - 0.65 * flight ** 6);
    mote.image.setPosition(x, y).setDisplaySize(size, size)
      .setAlpha(1 - flight ** 8).setRotation(mote.tier >= 1 ? mote.age * 0.002 : 0);
  }
}
