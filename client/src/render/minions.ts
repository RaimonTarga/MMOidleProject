import Phaser from 'phaser';
import {
  MINION_BASE_DISPLAY_SIZE,
  isRangedSummonStyle,
  resolveSummonTint,
  type MinionView,
  type PlayerView,
} from '@mmo-idle/shared';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { ensureSprite, updateSpriteFrame } from './sprites';
import { ensureShadow } from './shadows';
import { ensureHpBar } from './healthBars';
import { ensureCdBar } from './cooldownBars';
import { applyLunge } from './interpolation';
import { spawnAttackEffect } from './combatFx';

function minionScale(minion: MinionView): number {
  return Math.max(0.1, minion.sizeMult ?? 1.0);
}

/**
 * Range's hue signature, resolved from the OWNER's unlocked skills rather than
 * sent over the wire — tint is pure presentation, so the client is the right
 * place to decide it. Falls back to untinted while the owner's view is absent
 * (spectating a node the owner is not projected into).
 */
function summonTint(state: RenderState, minion: MinionView): number {
  if (state.kind.get(minion.ownerPlayerId) !== 'player') return 0xffffff;
  const owner = state.view.get(minion.ownerPlayerId) as PlayerView | undefined;
  return owner ? resolveSummonTint(owner.unlockedSkills) : 0xffffff;
}

/** Phaser Images take a tint; the coloured-rectangle fallback does not. */
function applySummonTint(state: RenderState, minion: MinionView): void {
  const sprite = state.sprite.get(minion.id);
  if (sprite && 'setTint' in sprite) {
    (sprite as Phaser.GameObjects.Image).setTint(summonTint(state, minion));
  }
}

/**
 * Render a Conduit summon. Reuses the monster rendering primitives
 * — sprite, shadow, hp bar, cooldown bar, lunge animation — but does NOT
 * register a debug-range entry since minions don't have a pull/leash radius
 * of their own (the leash radius is rendered around the owning player in
 * `overlays.ts`).
 */
export function upsertMinion(
  state: RenderState,
  minion: MinionView,
  scene: GameScene,
): void {
  const isNew = !state.sprite.has(minion.id);
  const scale = minionScale(minion);
  const spriteSize = MINION_BASE_DISPLAY_SIZE * scale;

  if (isNew) {
    state.ids.add(minion.id);
    state.kind.set(minion.id, 'minion');
    state.view.set(minion.id, minion);

    state.spriteMeta.set(minion.id, {
      currentFrame: null,
      barOffsetY: 32,
      entityName: '',
      monsterBehavior: 'aggressive',
      monsterIsRanged: isRangedSummonStyle(minion.attackStyle),
    });

    state.transform.set(minion.id, {
      pos:    { ...minion.pos },
      target: { ...minion.target },
      speed:  minion.speed,
    });
    state.interpolation.set(minion.id, {
      base:        { ...minion.pos },
      lungeOffset: { x: 0, y: 0 },
    });

    // Per-minion attack-range pip drawn in tactical mode (see overlays.ts).
    state.debugRanges.set(minion.id, {
      attackRange: minion.attackRange,
    });

    ensureShadow(state, minion.id, minion.pos, scene, {
      fillColor: 0x000000,
      fillAlpha: 0.40,
    });
    ensureSprite(state, minion.id, minion, scene, {
      displayW: spriteSize,
      displayH: spriteSize,
      fallbackColor: 0x55cc66,
      isPlayer: false,
    });
    applySummonTint(state, minion);
    // Summons are anonymous — no label.
    ensureHpBar(state, minion.id, scene);
    ensureCdBar(state, minion.id, scene);
    return;
  }

  const prev = state.view.get(minion.id) as MinionView | undefined;
  const prevAttackAt = prev?.lastAttackAt ?? 0;

  const interp = state.interpolation.get(minion.id);
  if (interp) {
    const snapDx = minion.pos.x - interp.base.x;
    const snapDy = minion.pos.y - interp.base.y;
    if (snapDx * snapDx + snapDy * snapDy > 80 * 80) {
      interp.base = { ...minion.pos };
    }
  }

  state.view.set(minion.id, minion);
  const transform = state.transform.get(minion.id);
  if (transform) {
    transform.target = { ...minion.target };
    transform.speed = minion.speed;
  }

  updateSpriteFrame(state, minion.id, minion, scene, {
    displayW: spriteSize,
    displayH: spriteSize,
    fallbackColor: 0x55cc66,
    isPlayer: false,
  });

  applySummonTint(state, minion);

  const meta = state.spriteMeta.get(minion.id);
  if (meta) meta.monsterIsRanged = isRangedSummonStyle(minion.attackStyle);
  if (minion.lastAttackAt > prevAttackAt && minion.attackTargetId) {
    const vmSprite = state.sprite.get(minion.id);
    const targetInterp = state.interpolation.get(minion.attackTargetId);
    const targetSprite = state.sprite.get(minion.attackTargetId);
    if (vmSprite && targetInterp && targetSprite) {
      spawnAttackEffect(
        scene,
        minion.attackStyle,
        { x: vmSprite.x, y: vmSprite.y },
        { x: targetSprite.x, y: targetSprite.y },
      );
      // Only Vigil's melee summons lunge; Procession bolts and Harrier beams
      // fire from where they stand, exactly like ranged monsters.
      if (!isRangedSummonStyle(minion.attackStyle)) {
        applyLunge(state, minion.id, { ...targetInterp.base }, scene);
      }
    }
  }
}
