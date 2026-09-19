import {
  getFlag,
  setFlag,
  summonerSpecializationFor,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';
import type { World } from '../../../world/World';
import { setRooted } from '../../world/rooted';
import { isHardControlled } from './playerHardControl';

const OWNS_ROOT_FLAG = 'hardControlOwnsRoot';
const OWNS_ATTACK_LOCK_FLAG = 'hardControlOwnsAttackLock';

function hasIntrinsicAttackLock(player: PlayerEntity): boolean {
  const frame = player.usesSkills.selectedSubVariant ?? 'root';
  const battleBond =
    summonerSpecializationFor(frame, player.usesSkills.unlockedSkills) ===
    'battle-bond';
  return player.usesSkills.combatArchetype === 'summoner' && !battleBond;
}

/**
 * Reconcile status-owned ECS markers without stealing ownership from another
 * mechanic. This is called both immediately on application and after status
 * durations tick, so movement and combat observe the same authoritative lock.
 *
 * WHAT LOCKS is `PLAYER_HARD_CONTROL_EFFECTS`, not a second list maintained here.
 * Hard control is defined as the class of effect that takes actions away, and this
 * is the code that actually takes them: the two drifting apart is how Tundra's
 * Deep Freeze came to satisfy Break Free's trigger, break casts, and still leave
 * the player free to walk and swing. One authority, so a new hard control is
 * locking the moment it joins that list.
 */
export function syncPlayerControlLockout(
  world: World,
  player: PlayerEntity,
): void {
  const state = player.tracksCombat;

  if (isHardControlled(state)) {
    if (!player.isRooted) {
      setRooted(world, player, true);
      setFlag(state, OWNS_ROOT_FLAG, true);
    }
    if (!player.cannotAttack) {
      attachComponent(world, player, 'cannotAttack', {});
      setFlag(state, OWNS_ATTACK_LOCK_FLAG, true);
    }
    return;
  }

  if (getFlag(state, OWNS_ROOT_FLAG)) {
    setRooted(world, player, false);
    setFlag(state, OWNS_ROOT_FLAG, false);
  }
  if (
    getFlag(state, OWNS_ATTACK_LOCK_FLAG) &&
    !hasIntrinsicAttackLock(player)
  ) {
    detachComponent(world, player, 'cannotAttack');
  }
  setFlag(state, OWNS_ATTACK_LOCK_FLAG, false);
}

export function updatePlayerControlLockouts(world: World): void {
  for (const player of world.livePlayers) {
    syncPlayerControlLockout(world, player);
  }
}
