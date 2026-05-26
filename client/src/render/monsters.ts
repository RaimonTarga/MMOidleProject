import type { MonsterView } from '@mmo-idle/shared';
import { getMonsterShadowOffset } from '../sprites';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { ensureSprite } from './sprites';
import { ensureShadow } from './shadows';
import { ensureLabel } from './labels';
import { ensureHpBar } from './healthBars';
import { ensureCdBar } from './cooldownBars';
import { applyLunge } from './interpolation';

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
      x: monster.x,
      y: monster.y,
      targetX: monster.targetX,
      targetY: monster.targetY,
      speed: monster.speed,
    });
    state.interpolation.set(monster.id, {
      baseX: monster.x,
      baseY: monster.y,
      lungeOffsetX: 0,
      lungeOffsetY: 0,
    });

    state.debugRanges.set(monster.id, {
      pullRange: monster.pullRange,
      leashRange: monster.leashRange,
      attackRange: monster.attackRange,
    });

    ensureShadow(state, monster.id, monster.x, monster.y, shadowOffsetY, scene, {
      width: shadowW,
      height: shadowH,
      depth: 0,
      fillColor: 0x000000,
      fillAlpha: monster.isBoss ? 0.55 : 0.45,
    });
    ensureSprite(state, monster.id, monster, scene, {
      displayW: spriteSize,
      displayH: spriteSize,
      fallbackColor: monster.color,
      depth: 1,
      isPlayer: false,
    });
    ensureLabel(state, monster.id, monster, scene);
    ensureHpBar(state, monster.id, scene, 2);
    ensureCdBar(state, monster.id, scene, 2);
    return;
  }

  const prev = state.view.get(monster.id) as MonsterView | undefined;
  const prevAttackAt = prev?.lastAttackAt ?? 0;
  const prevHp = prev?.hp ?? monster.hp;

  const interp = state.interpolation.get(monster.id);
  if (interp) {
    const snapDx = monster.x - interp.baseX;
    const snapDy = monster.y - interp.baseY;
    if (snapDx * snapDx + snapDy * snapDy > 80 * 80) {
      interp.baseX = monster.x;
      interp.baseY = monster.y;
    }
  }

  state.view.set(monster.id, monster);
  const transform = state.transform.get(monster.id);
  if (transform) {
    transform.targetX = monster.targetX;
    transform.targetY = monster.targetY;
    transform.speed = monster.speed;
  }

  if (monster.hp < prevHp) {
    const sprite = state.sprite.get(monster.id);
    const meta = state.spriteMeta.get(monster.id);
    if (sprite && meta) {
      scene.spawnDamageNumber(
        sprite.x,
        sprite.y,
        meta.barOffsetY,
        Math.round(prevHp - monster.hp),
        '#ffffff',
      );
    }
  }

  const meta = state.spriteMeta.get(monster.id);
  if (monster.lastAttackAt > prevAttackAt && monster.attackTargetId) {
    const vmSprite = state.sprite.get(monster.id);
    const targetInterp = state.interpolation.get(monster.attackTargetId);
    const targetSprite = state.sprite.get(monster.attackTargetId);
    if (vmSprite && targetInterp && targetSprite) {
      scene.spawnAttackEffect(
        monster.attackStyle,
        vmSprite.x,
        vmSprite.y,
        targetSprite.x,
        targetSprite.y,
      );

      if (meta?.monsterBehavior === 'melee') {
        applyLunge(state, monster.id, targetInterp.baseX, targetInterp.baseY, scene);
      }
    }
  }
}
