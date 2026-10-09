/**
 * Disengage's **Vanish** mark (design §22.4), the one predicate monster
 * acquisition reads. Kept apart from the verb's module so the AI imports a flag
 * read and nothing else.
 *
 * The mark is server-only scratch on the player's `TracksCombat` (a flag, through
 * its helpers): set when Vanish breaks contact, cleared by the player's next
 * landed hit or the out-of-combat reset (`vanish.ts`), wiped with the rest of the
 * state on death.
 *
 * WHO SEES THROUGH IT. A boss, a boss's add and a dungeon guardian: each has a
 * script that chooses its target on its own clock (boss scripts and patterns, the
 * add mirroring its boss, the dungeon forcing its guardians' aggro every tick),
 * and dropping or refusing a target under one of those scripts is how an
 * encounter resets or wedges. They neither lose the player to Vanish nor are
 * kept from finding them.
 */
import { getFlag } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';

/** The player's Vanish mark key. */
export const VANISH_FLAG = 'keystone.vanish';

/** Whether the player stands vanished. */
export function playerVanished(player: PlayerEntity): boolean {
  return getFlag(player.tracksCombat, VANISH_FLAG);
}

/** A monster whose targeting a script owns: Vanish neither drops nor hides from it. */
export function monsterSeesThroughVanish(monster: MonsterEntity): boolean {
  return monster.isMonster.isBoss === true
    || monster.controlsMonster.bossSpawnerId !== undefined
    || monster.tracksDungeon !== undefined;
}

/** Whether `monster` may not acquire `player` right now. */
export function hiddenByVanish(player: PlayerEntity, monster: MonsterEntity): boolean {
  return playerVanished(player) && !monsterSeesThroughVanish(monster);
}
