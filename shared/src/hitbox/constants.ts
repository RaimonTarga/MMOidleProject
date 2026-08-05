import type { HitboxRect } from './types';

/** Display width/height for standard monsters and player sprites. */
export const MONSTER_DISPLAY_SIZE = 64;
export const BOSS_DISPLAY_SIZE = 80;
export const PLAYER_DISPLAY_SIZE = 64;

/** Base display size for summoner minions before `sizeMult` is applied. */
/**
 * Base on-screen size of a Conduit summon, before the formation's `sizeMult`.
 * Drives sprite scale AND hitbox (`resolveMinionHitbox`), so changing it is a
 * balance-visible change, not only a cosmetic one.
 *
 * Dropped 48 -> 32 -> 28 (2026-08-05) when summons stopped borrowing wildlife
 * sprites: a conjured skull should read as a small hovering thing, not as a
 * creature standing next to the player.
 *
 * 28 is close to the floor. Kilnmaster (8 summons at 0.52x) lands at ~15px,
 * below the ~18px readability threshold, so that spec needs its own size floor
 * or a deliberately simplified body — see docs/summoner-flavor-pass-plan.md.
 */
export const MINION_BASE_DISPLAY_SIZE = 28;

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
