import Phaser from 'phaser';
import type { PlayerView } from '@mmo-idle/shared';
import { shouldRunClientFx } from '../fx/guard';
import type { GameScene } from '../scenes/GameScene';
import type { NetworkId, RenderState } from './state';

type MovementEffectKey = 'flash-afterimage';

function nextEffectAt(state: RenderState, id: NetworkId, key: MovementEffectKey): number {
  return state.movementEffectNextAt.get(`${id}:${key}`) ?? 0;
}

function setNextEffectAt(state: RenderState, id: NetworkId, key: MovementEffectKey, at: number): void {
  state.movementEffectNextAt.set(`${id}:${key}`, at);
}

export function clearMovementEffectsForEntity(state: RenderState, id: NetworkId): void {
  const prefix = `${id}:`;
  for (const key of state.movementEffectNextAt.keys()) {
    if (key.startsWith(prefix)) state.movementEffectNextAt.delete(key);
  }
}

export function flashShiftTint(player: PlayerView): number | null {
  if (player.combatArchetype !== 'energy') return null;
  if ((player.passives['energy.flash'] ?? 0) <= 0) return null;
  const t = Math.max(0, Math.min(1, player.flashShiftPct / 100));
  const r = Math.round(70 + t * 185);
  const g = Math.round(130 - t * 65);
  const b = Math.round(255 - t * 195);
  return (r << 16) | (g << 8) | b;
}

function spawnFlashAfterimage(
  state: RenderState,
  player: PlayerView,
  scene: GameScene,
  variant: 'attack' | 'move',
  offset?: { x: number; y: number },
): void {
  if (!shouldRunClientFx()) return;
  if ((player.passives['energy.flash'] ?? 0) <= 0) return;
  const sprite = state.sprite.get(player.id);
  const tint = flashShiftTint(player);
  if (!sprite || tint === null) return;

  const intensity = Math.max(0, Math.min(1, player.flashSpeedBonusPct / 45));
  const baseAlpha = variant === 'attack' ? 0.12 : 0.16;
  const alpha = baseAlpha + intensity * (variant === 'attack' ? 0.26 : 0.24);
  const duration = variant === 'attack'
    ? 180 + intensity * 180
    : 220 + intensity * 180;
  const x = sprite.x + (offset?.x ?? 0);
  const y = sprite.y + (offset?.y ?? 0);
  const afterimage = sprite instanceof Phaser.GameObjects.Image
    ? scene.add
      .image(x, y, sprite.texture.key, sprite.frame.name)
      .setDisplaySize(sprite.displayWidth, sprite.displayHeight)
    : scene.add
      .rectangle(x, y, sprite.displayWidth, sprite.displayHeight, tint);

  afterimage
    .setDepth(sprite.depth - 0.1)
    .setAlpha(alpha);
  if (afterimage instanceof Phaser.GameObjects.Image) {
    afterimage.setTint(tint);
  }
  scene.tweens.add({
    targets: afterimage,
    alpha: 0,
    scaleX: 1 + intensity * 0.18,
    scaleY: 1 + intensity * 0.18,
    duration,
    ease: 'Quad.easeOut',
    onComplete: () => afterimage.destroy(),
  });
}

export function spawnFlashAttackAfterimage(
  state: RenderState,
  player: PlayerView,
  scene: GameScene,
): void {
  spawnFlashAfterimage(state, player, scene, 'attack');
}

function updatePlayerMovementEffects(
  state: RenderState,
  player: PlayerView,
  scene: GameScene,
): void {
  if ((player.passives['energy.flash'] ?? 0) <= 0) return;

  const interp = state.interpolation.get(player.id);
  const transform = state.transform.get(player.id);
  if (!interp || !transform) return;
  const dx = transform.target.x - interp.base.x;
  const dy = transform.target.y - interp.base.y;
  const distSq = dx * dx + dy * dy;
  if (distSq <= 4) return;

  const now = scene.time.now;
  if (now < nextEffectAt(state, player.id, 'flash-afterimage')) return;

  const intensity = Math.max(0, Math.min(1, player.flashSpeedBonusPct / 45));
  const dist = Math.sqrt(distSq);
  const trailDistance = 16 + intensity * 18;
  setNextEffectAt(state, player.id, 'flash-afterimage', now + 105 - intensity * 45);
  spawnFlashAfterimage(state, player, scene, 'move', {
    x: -(dx / dist) * trailDistance,
    y: -(dy / dist) * trailDistance,
  });
}

export function updateMovementEffects(
  state: RenderState,
  scene: GameScene,
): void {
  for (const id of state.ids) {
    if (state.kind.get(id) !== 'player') continue;
    const player = state.view.get(id) as PlayerView | undefined;
    if (!player) continue;
    updatePlayerMovementEffects(state, player, scene);
  }
}
