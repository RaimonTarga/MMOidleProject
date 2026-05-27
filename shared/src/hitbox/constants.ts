import type { HitboxRect } from './types';

export const HITBOX_MAX_RECTS = 6;
export const HITBOX_MIN_COVERAGE = 0.95;
export const HITBOX_ALPHA_THRESHOLD = 32;
export const HITBOX_MIN_RECT_AREA = 16;

export const FALLBACK_MONSTER_AABB: HitboxRect = {
  offsetX: 0,
  offsetY: 0,
  halfW: 28,
  halfH: 28,
};

export const FALLBACK_BOSS_AABB: HitboxRect = {
  offsetX: 0,
  offsetY: 0,
  halfW: 40,
  halfH: 40,
};

export const FALLBACK_PLAYER_AABB: HitboxRect = {
  offsetX: 0,
  offsetY: 0,
  halfW: 32,
  halfH: 32,
};
