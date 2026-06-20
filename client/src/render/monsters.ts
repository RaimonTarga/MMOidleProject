import type { MonsterView } from '@mmo-idle/shared';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { ensureSprite, updateSpriteFrame } from './sprites';
import { ensureShadow } from './shadows';
import { ensureLabel, destroyLabel } from './labels';
import { ensureHpBar } from './healthBars';
import { ensureCdBar } from './cooldownBars';
import { applyLunge } from './interpolation';
import { spawnAttackEffect } from './combatFx';
import { spawnDamageNumber } from '../fx/particles';
import {
  resolveMonsterDamageStyle,
  SHIELD_DAMAGE_COLOR,
  SHIELD_DAMAGE_SYMBOL,
} from './damageNumberStyle';
import { applySpriteTint, resetSpriteTint } from './sprites';
import { VOID_OVERLORD_DISPLAY } from '../sprites/voidOverlordSheet';
import {
  ensureVoidOverlordBossSprite,
  ensureVoidOverlordMinionSprite,
  shouldUseVoidOverlordSheet,
} from './ultimateBossSprites';

const THRONE_HEAL_TINT = 0xbb66ff;
const GUARDIAN_TINT = 0xffcc44;

function syncMonsterThroneTint(
  state: RenderState,
  monster: MonsterView,
): void {
  const sprite = state.sprite.get(monster.id);
  if (!sprite) return;
  if (state.dungeonGuardianIds.has(monster.id)) {
    applySpriteTint(sprite, GUARDIAN_TINT);
  } else if (monster.throneHealing) {
    applySpriteTint(sprite, THRONE_HEAL_TINT);
  } else {
    resetSpriteTint(sprite, monster.color);
  }
}

export function refreshMonsterTints(state: RenderState): void {
  for (const id of state.ids) {
    if (state.kind.get(id) !== "monster") continue;
    const monster = state.view.get(id) as MonsterView | undefined;
    if (monster) syncMonsterThroneTint(state, monster);
  }
}

function defaultBarOffsetY(monster: MonsterView): number {
  return monster.isBoss ? 50 : 40;
}

function defaultSpriteSize(monster: MonsterView): number {
  return monster.isBoss ? 128 : 64;
}

function upsertSheetMonsterSprite(
  state: RenderState,
  monster: MonsterView,
  scene: GameScene,
): void {
  const meta = state.spriteMeta.get(monster.id);
  if (!meta) return;

  if (monster.monsterTypeId === 'void-overlord') {
    meta.barOffsetY = VOID_OVERLORD_DISPLAY['void-overlord'].barOffsetY;
    ensureVoidOverlordBossSprite(state, monster.id, monster.pos, scene);
    return;
  }

  if (shouldUseVoidOverlordSheet(monster.monsterTypeId)) {
    meta.barOffsetY = VOID_OVERLORD_DISPLAY[monster.monsterTypeId].barOffsetY;
    meta.visualOffsetY = undefined;
    ensureVoidOverlordMinionSprite(state, monster.id, monster, scene);
    return;
  }

  const spriteSize = defaultSpriteSize(monster);
  meta.barOffsetY = defaultBarOffsetY(monster);
  meta.skipFrameRefresh = false;
  meta.isAnimated = false;
  meta.visualOffsetY = undefined;
  ensureSprite(state, monster.id, monster, scene, {
    displayW: spriteSize,
    displayH: spriteSize,
    fallbackColor: monster.color,
    isPlayer: false,
  });
}

export function upsertMonster(
  state: RenderState,
  monster: MonsterView,
  scene: GameScene,
): void {
  const isNew = !state.sprite.has(monster.id);

  if (isNew) {
    state.ids.add(monster.id);
    state.kind.set(monster.id, 'monster');
    state.view.set(monster.id, monster);

    state.spriteMeta.set(monster.id, {
      currentFrame: null,
      barOffsetY: defaultBarOffsetY(monster),
      entityName: monster.name,
      monsterBehavior: monster.behavior,
      monsterIsRanged: monster.isRanged,
    });

    state.transform.set(monster.id, {
      pos:    { ...monster.pos },
      target: { ...monster.target },
      speed:  monster.speed,
    });
    state.interpolation.set(monster.id, {
      base:        { ...monster.pos },
      lungeOffset: { x: 0, y: 0 },
    });

    state.debugRanges.set(monster.id, {
      pullRange: monster.pullRange,
      leashRange: monster.leashRange,
      attackRange: monster.attackRange,
    });

    ensureShadow(state, monster.id, monster.pos, scene, {
      fillColor: 0x000000,
      fillAlpha: monster.isBoss ? 0.55 : 0.45,
    });
    upsertSheetMonsterSprite(state, monster, scene);
    ensureLabel(state, monster.id, monster, scene);
    ensureHpBar(state, monster.id, scene);
    ensureCdBar(state, monster.id, scene);
    syncMonsterThroneTint(state, monster);
    return;
  }

  const prev = state.view.get(monster.id) as MonsterView | undefined;
  const prevAttackAt = prev?.lastAttackAt ?? 0;
  const prevHp = prev?.hp ?? monster.hp;

  const interp = state.interpolation.get(monster.id);
  if (interp) {
    const snapDx = monster.pos.x - interp.base.x;
    const snapDy = monster.pos.y - interp.base.y;
    if (snapDx * snapDx + snapDy * snapDy > 80 * 80) {
      interp.base = { ...monster.pos };
    }
  }

  state.view.set(monster.id, monster);
  const transform = state.transform.get(monster.id);
  if (transform) {
    transform.target = { ...monster.target };
    transform.speed = monster.speed;
  }

  // Entity IDs can collide across node snapshots after a server restart —
  // each node's saved snapshot has its own monster-N namespace, so the same
  // client sprite ID can flip between monster types on a zone transition.
  // Mirror players.ts: always refresh the sprite frame on patch (cheap
  // early-out when the frame is unchanged), and rebuild type-dependent
  // render state when the type actually changed.
  const meta = state.spriteMeta.get(monster.id);
  const typeChanged = prev !== undefined && prev.monsterTypeId !== monster.monsterTypeId;
  if (typeChanged && meta) {
    meta.entityName = monster.name;
    meta.monsterBehavior = monster.behavior;
    meta.monsterIsRanged = monster.isRanged;
    meta.skipFrameRefresh = false;
    meta.isAnimated = false;
    state.sprite.get(monster.id)?.destroy();
    state.sprite.delete(monster.id);
    upsertSheetMonsterSprite(state, monster, scene);
  }
  if (typeChanged) {
    state.debugRanges.set(monster.id, {
      pullRange: monster.pullRange,
      leashRange: monster.leashRange,
      attackRange: monster.attackRange,
    });
    state.shadow.get(monster.id)?.setFillStyle(0x000000, monster.isBoss ? 0.55 : 0.45);
    destroyLabel(state, monster.id);
    ensureLabel(state, monster.id, monster, scene);
  }

  if (!meta?.skipFrameRefresh) {
    const spriteSize = defaultSpriteSize(monster);
    updateSpriteFrame(state, monster.id, monster, scene, {
      displayW: spriteSize,
      displayH: spriteSize,
      fallbackColor: monster.color,
      isPlayer: false,
    });
  }

  const hint = state.damageStyleHints.get(monster.id);
  if (monster.hp < prevHp) {
    const sprite = state.sprite.get(monster.id);
    if (sprite && meta) {
      const { color, style } = resolveMonsterDamageStyle(hint);
      spawnDamageNumber(
        scene,
        { x: sprite.x, y: sprite.y },
        meta.barOffsetY,
        Math.round(prevHp - monster.hp),
        color,
        style,
      );
    }
  }

  // Shield-absorbed damage renders as a separate blue number, independent of the
  // HP delta — so a fully absorbed hit (no HP loss) still shows feedback.
  if (hint?.shieldAbsorbed && hint.shieldAbsorbed > 0) {
    const sprite = state.sprite.get(monster.id);
    if (sprite && meta) {
      spawnDamageNumber(
        scene,
        { x: sprite.x, y: sprite.y },
        meta.barOffsetY,
        Math.round(hint.shieldAbsorbed),
        SHIELD_DAMAGE_COLOR,
        { symbol: SHIELD_DAMAGE_SYMBOL },
      );
    }
  }

  if (monster.lastAttackAt > prevAttackAt && monster.attackTargetId) {
    const vmSprite = state.sprite.get(monster.id);
    const targetInterp = state.interpolation.get(monster.attackTargetId);
    const targetSprite = state.sprite.get(monster.attackTargetId);
    if (vmSprite && targetInterp && targetSprite) {
      spawnAttackEffect(
        scene,
        monster.attackStyle,
        { x: vmSprite.x, y: vmSprite.y },
        { x: targetSprite.x, y: targetSprite.y },
      );

      if (!meta?.monsterIsRanged) {
        applyLunge(state, monster.id, { ...targetInterp.base }, scene);
      }
    }
  }

  syncMonsterThroneTint(state, monster);
}
