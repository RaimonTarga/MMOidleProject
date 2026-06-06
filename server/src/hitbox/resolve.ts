import type { HasHitbox, HitboxRect } from '@mmo-idle/shared';
import {
  BOSS_DISPLAY_SIZE,
  buildHasHitboxFromDef,
  FALLBACK_BOSS_AABB,
  FALLBACK_MONSTER_AABB,
  FALLBACK_PLAYER_AABB,
  isVoidOverlordSheetMonster,
  MINION_BASE_DISPLAY_SIZE,
  MONSTER_DISPLAY_SIZE,
  PLAYER_DISPLAY_SIZE,
  resolveMonsterFrame,
  resolvePlayerFrame,
  resolveVoidOverlordBossFrameName,
  resolveVoidOverlordMinionFrameName,
  VOID_OVERLORD_DISPLAY,
} from '@mmo-idle/shared';
import type { PlayerEntity, ServerEntity } from '../ecs/entity';
import type { World } from '../world/World';
import { attachComponent } from '../ecs/markerHelpers';
import { getHitboxDef } from './cache';

export function resolveHitboxByFrame(
  frameName: string | null,
  displayW: number,
  displayH: number,
  fallback: HitboxRect,
): HasHitbox {
  const def = frameName ? getHitboxDef(frameName) : undefined;
  return buildHasHitboxFromDef({ frameName, def, displayW, displayH, fallback });
}

export function syncEntityHitbox(
  world: World,
  entity: ServerEntity,
  args: {
    frameName: string | null;
    displayW: number;
    displayH: number;
    fallback: HitboxRect;
  },
): void {
  const next = resolveHitboxByFrame(
    args.frameName,
    args.displayW,
    args.displayH,
    args.fallback,
  );
  if (!hitboxEqual(entity.hasHitbox?.rects, next.rects)) {
    attachComponent(world, entity, 'hasHitbox', next);
  }
}

export function syncEntityHitboxScale(
  world: World,
  entity: ServerEntity,
  scaleMult: number,
  fallback: HitboxRect,
): void {
  const hb = entity.hasHitbox;
  if (hb?.displayW === undefined || hb.displayH === undefined) return;
  const mult = Math.max(0.1, scaleMult);
  syncEntityHitbox(world, entity, {
    frameName: hb.frameName ?? null,
    displayW: hb.displayW * mult,
    displayH: hb.displayH * mult,
    fallback,
  });
}

export function resolveMonsterHitbox(
  monsterTypeId: string,
  isBoss: boolean,
  entityId?: string,
): HasHitbox {
  if (isVoidOverlordSheetMonster(monsterTypeId)) {
    const display = VOID_OVERLORD_DISPLAY[monsterTypeId];
    const frameName =
      monsterTypeId === 'void-overlord'
        ? resolveVoidOverlordBossFrameName()
        : entityId
          ? resolveVoidOverlordMinionFrameName(monsterTypeId, entityId)
          : null;
    const fb = isBoss ? FALLBACK_BOSS_AABB : FALLBACK_MONSTER_AABB;
    if (display) {
      return resolveHitboxByFrame(
        frameName,
        display.displayW,
        display.displayH,
        fb,
      );
    }
  }

  const frame = resolveMonsterFrame(monsterTypeId);
  const displaySize = isBoss ? BOSS_DISPLAY_SIZE : MONSTER_DISPLAY_SIZE;
  const fb = isBoss ? FALLBACK_BOSS_AABB : FALLBACK_MONSTER_AABB;
  return resolveHitboxByFrame(frame, displaySize, displaySize, fb);
}

export function resolveMinionHitbox(
  monsterTypeId: string,
  sizeMult: number,
): HasHitbox {
  const mult = Math.max(0.1, sizeMult);
  const displaySize = MINION_BASE_DISPLAY_SIZE * mult;
  const frame = resolveMonsterFrame(monsterTypeId);
  return resolveHitboxByFrame(
    frame,
    displaySize,
    displaySize,
    FALLBACK_MONSTER_AABB,
  );
}

export function resolvePlayerHitbox(entity: PlayerEntity): HasHitbox {
  const frame = resolvePlayerFrame({
    combatArchetype: entity.usesSkills?.combatArchetype ?? null,
    unlockedSkills: entity.usesSkills?.unlockedSkills ?? [],
  });
  return resolveHitboxByFrame(
    frame,
    PLAYER_DISPLAY_SIZE,
    PLAYER_DISPLAY_SIZE,
    FALLBACK_PLAYER_AABB,
  );
}

export function hitboxEqual(a: HitboxRect[] | undefined, b: HitboxRect[]): boolean {
  if (!a || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x.offsetX !== y.offsetX ||
      x.offsetY !== y.offsetY ||
      x.halfW !== y.halfW ||
      x.halfH !== y.halfH
    ) {
      return false;
    }
  }
  return true;
}
