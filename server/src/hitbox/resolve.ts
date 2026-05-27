import type { HasHitbox, HitboxDef, HitboxRect } from '@mmo-idle/shared';
import {
  FALLBACK_BOSS_AABB,
  FALLBACK_MONSTER_AABB,
  FALLBACK_PLAYER_AABB,
  resolveMonsterFrame,
  resolvePlayerFrame,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../ecs/entity';
import { getHitboxDef } from './cache';

export function scaleHitboxDef(def: HitboxDef, displaySize: number): HitboxRect[] {
  const scale = displaySize / def.sourceW;
  return def.rects.map(r => ({
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
  const displaySize = isBoss ? 80 : 64;
  if (frame) {
    const def = getHitboxDef(frame);
    if (def) return { rects: scaleHitboxDef(def, displaySize) };
  }
  return { rects: [isBoss ? FALLBACK_BOSS_AABB : FALLBACK_MONSTER_AABB] };
}

export function resolvePlayerHitbox(entity: PlayerEntity): HasHitbox {
  const frame = resolvePlayerFrame({
    combatArchetype: entity.usesSkills?.combatArchetype ?? null,
    unlockedSkills: entity.usesSkills?.unlockedSkills ?? [],
  });
  if (frame) {
    const def = getHitboxDef(frame);
    if (def) return { rects: scaleHitboxDef(def, 64) };
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
