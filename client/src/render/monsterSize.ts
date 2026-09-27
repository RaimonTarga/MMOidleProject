import { resolveMonsterDisplayScale, type MonsterView } from '@mmo-idle/shared';

const MONSTER_BASE_SIZE = 64;
const BOSS_SIZE = 128;
const BOSS_BAR_OFFSET_Y = 50;
/** Gap between the top of a regular monster's body box and its HP bar. */
const BAR_GAP_PX = 8;

/** Displayed body size. Bosses keep their fixed size; mobs scale per type. */
export function monsterSpriteSize(monster: MonsterView): number {
  if (monster.isBoss) return BOSS_SIZE;
  return MONSTER_BASE_SIZE * resolveMonsterDisplayScale(monster.monsterTypeId);
}

/** HP bar lift above the sprite center; tracks the body so big mobs don't bury it. */
export function monsterBarOffsetY(monster: MonsterView): number {
  if (monster.isBoss) return BOSS_BAR_OFFSET_Y;
  return monsterSpriteSize(monster) / 2 + BAR_GAP_PX;
}
