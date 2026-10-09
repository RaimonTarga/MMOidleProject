/**
 * Disengage's **Vanish** mark (design §22.4, §22.12), the few predicates the
 * monster AI reads. Kept apart from the verb's module so the AI imports a flag
 * read and nothing else.
 *
 * The mark is server-only scratch on the player's `TracksCombat` (a flag, through
 * its helpers): set when Vanish breaks contact, cleared by the player's next
 * landed hit, the out-of-combat reset, or an encounter hold that ran the reset
 * window (`vanish.ts`), wiped with the rest of the state on death.
 *
 * EVERY MONSTER RESPECTS IT (design §22.12: "Vanish works on bosses, boss adds and
 * dungeon guardians too"). Nothing ACQUIRES a vanished player — the pull scan, a
 * boss handing its target to its adds, a dungeon forcing aggro, an ordinary
 * monster's rally (design §22.13) — and a script's own victim pick passes over
 * them. A monster that already held them out of Vanish's reach keeps them, as
 * before, but never hands them on.
 *
 * AN ENCOUNTER HOLDS. A boss, a boss's add or a dungeon monster that Vanish
 * dropped does not go home: it HOLDS for the player (`holdsForVanished`) — it
 * stands, keeps its ramp, does not regenerate, runs its script — and takes them
 * back in the same aggro session once the mark clears, or once it has held for
 * the out-of-combat reset window (design §22.13), which clears the mark — so a
 * Vanish is a breather and never an encounter reset or a wedge. An ordinary
 * monster walks home as any monster that lost its target does.
 */
import { getFlag, type AggroTargetKind } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';

/** The player's Vanish mark key. */
export const VANISH_FLAG = 'keystone.vanish';

/** Whether the player stands vanished. */
export function playerVanished(player: PlayerEntity): boolean {
  return getFlag(player.tracksCombat, VANISH_FLAG);
}

/**
 * Whether `target` names a vanished player: an aggro target no body may be
 * HANDED (mirrored from its boss, inherited at spawn, forced by a dungeon).
 */
export function vanishedTarget(
  world: World,
  target: { targetId: string; targetKind: AggroTargetKind },
): boolean {
  if (target.targetKind !== 'player') return false;
  const player = world.getPlayerEntity(target.targetId);
  return player !== undefined && playerVanished(player);
}

/**
 * A monster whose fight is an ENCOUNTER — a boss, a boss's add (summoned or
 * raised: both are bound through `bossSpawnerId`), a dungeon monster: Vanish
 * makes it hold rather than walk home (see the file header).
 */
export function encounterMonster(monster: MonsterEntity): boolean {
  return monster.isMonster.isBoss === true
    || monster.controlsMonster.bossSpawnerId !== undefined
    || monster.tracksDungeon !== undefined;
}

/** Whether `monster` holds for a player Vanish hid from it. */
export function holdsForVanished(monster: MonsterEntity): boolean {
  return monster.holdsForVanished !== undefined;
}
