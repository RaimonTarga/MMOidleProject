import type { MonsterView } from '@mmo-idle/shared';
import { getMonsterShadowOffset } from '../sprites';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { ensureSprite, updateSpriteFrame } from './sprites';
import { ensureShadow, destroyShadow } from './shadows';
import { ensureLabel, destroyLabel } from './labels';
import { ensureHpBar } from './healthBars';
import { ensureCdBar } from './cooldownBars';
import { applyLunge } from './interpolation';
import { spawnAttackEffect } from './combatFx';
import { spawnDamageNumber } from '../fx/particles';

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

    const spriteSize = monster.isBoss ? 80 : 64;
    const shadowW = monster.isBoss ? 64 : 52;
    const shadowH = monster.isBoss ? 18 : 14;
    const shadowOffsetY = getMonsterShadowOffset(monster.monsterTypeId);

    state.spriteMeta.set(monster.id, {
      currentFrame: null,
      shadowOffsetY,
      barOffsetY: monster.isBoss ? 50 : 40,
      entityName: monster.name,
      monsterBehavior: monster.behavior,
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

    ensureShadow(state, monster.id, monster.pos, shadowOffsetY, scene, {
      width: shadowW,
      height: shadowH,
      fillColor: 0x000000,
      fillAlpha: monster.isBoss ? 0.55 : 0.45,
    });
    ensureSprite(state, monster.id, monster, scene, {
      displayW: spriteSize,
      displayH: spriteSize,
      fallbackColor: monster.color,
      isPlayer: false,
    });
    ensureLabel(state, monster.id, monster, scene);
    ensureHpBar(state, monster.id, scene);
    ensureCdBar(state, monster.id, scene);
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
    meta.barOffsetY = monster.isBoss ? 50 : 40;
    meta.entityName = monster.name;
    meta.monsterBehavior = monster.behavior;
    meta.shadowOffsetY = getMonsterShadowOffset(monster.monsterTypeId);
  }
  if (typeChanged) {
    state.debugRanges.set(monster.id, {
      pullRange: monster.pullRange,
      leashRange: monster.leashRange,
      attackRange: monster.attackRange,
    });
    destroyShadow(state, monster.id);
    destroyLabel(state, monster.id);
    const shadowW = monster.isBoss ? 64 : 52;
    const shadowH = monster.isBoss ? 18 : 14;
    ensureShadow(state, monster.id, monster.pos, meta?.shadowOffsetY ?? 0, scene, {
      width: shadowW,
      height: shadowH,
      fillColor: 0x000000,
      fillAlpha: monster.isBoss ? 0.55 : 0.45,
    });
    ensureLabel(state, monster.id, monster, scene);
  }
  const spriteSize = monster.isBoss ? 80 : 64;
  updateSpriteFrame(state, monster.id, monster, scene, {
    displayW: spriteSize,
    displayH: spriteSize,
    fallbackColor: monster.color,
    isPlayer: false,
  });

  if (monster.hp < prevHp) {
    const sprite = state.sprite.get(monster.id);
    if (sprite && meta) {
      spawnDamageNumber(
        scene,
        { x: sprite.x, y: sprite.y },
        meta.barOffsetY,
        Math.round(prevHp - monster.hp),
        '#ffffff',
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

      if (meta?.monsterBehavior === 'melee') {
        applyLunge(state, monster.id, { ...targetInterp.base }, scene);
      }
    }
  }
}
