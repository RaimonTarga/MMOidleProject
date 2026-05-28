import type { HasHitbox, HitboxDef, HitboxRect } from '@mmo-idle/shared';
import {
  BOSS_DISPLAY_SIZE,
  FALLBACK_BOSS_AABB,
  FALLBACK_MONSTER_AABB,
  FALLBACK_PLAYER_AABB,
  MINION_BASE_DISPLAY_SIZE,
  MONSTER_DISPLAY_SIZE,
  PLAYER_DISPLAY_SIZE,
  resolveMonsterFrame,
  resolvePlayerFrame,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../ecs/entity';
import { getHitboxDef } from './cache';

export function scaleHitboxDef(def: HitboxDef, displaySize: number): HitboxRect[] {
  const scale = displaySize / def.sourceW;
  return scaleHitboxRects(def.rects, scale);
}

export function scaleHitboxRects(rects: HitboxRect[], scale: number): HitboxRect[] {
  return rects.map(r => ({
    offsetX: r.offsetX * scale,
    offsetY: r.offsetY * scale,
    halfW: r.halfW * scale,
    halfH: r.halfH * scale,
  }));
}

export function resolveMonsterHitbox(
  monsterTypeId: string,
  isBoss: boolean,
): HasHitbox {
  const frame = resolveMonsterFrame(monsterTypeId);
  const displaySize = isBoss ? BOSS_DISPLAY_SIZE : MONSTER_DISPLAY_SIZE;
  if (frame) {
    const def = getHitboxDef(frame);
    if (def) return { rects: scaleHitboxDef(def, displaySize) };
  }
  return { rects: [isBoss ? FALLBACK_BOSS_AABB : FALLBACK_MONSTER_AABB] };
}

export function resolveMinionHitbox(
  monsterTypeId: string,
  sizeMult: number,
): HasHitbox {
  const mult = Math.max(0.1, sizeMult);
  const displaySize = MINION_BASE_DISPLAY_SIZE * mult;
  const frame = resolveMonsterFrame(monsterTypeId);
  if (frame) {
    const def = getHitboxDef(frame);
    if (def) return { rects: scaleHitboxDef(def, displaySize) };
  }
  const fallbackScale = displaySize / MONSTER_DISPLAY_SIZE;
  return { rects: scaleHitboxRects([FALLBACK_MONSTER_AABB], fallbackScale) };
}

export function resolvePlayerHitbox(entity: PlayerEntity): HasHitbox {
  const frame = resolvePlayerFrame({
    combatArchetype: entity.usesSkills?.combatArchetype ?? null,
    unlockedSkills: entity.usesSkills?.unlockedSkills ?? [],
  });
  if (frame) {
    const def = getHitboxDef(frame);
    if (def) return { rects: scaleHitboxDef(def, PLAYER_DISPLAY_SIZE) };
  }
  return { rects: [FALLBACK_PLAYER_AABB] };
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
