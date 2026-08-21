import {
  CAVE_LOCKDOWN_EFFECT_ID,
  getFlag,
  getStatusEffects,
  setFlag,
  summonerSpecializationFor,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';
import type { World } from '../../../world/World';
import { setRooted } from '../../world/rooted';
import { STUN_EFFECT } from './stun';

const OWNS_ROOT_FLAG = 'caveLockdownOwnsRoot';
const OWNS_ATTACK_LOCK_FLAG = 'caveLockdownOwnsAttackLock';

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
 */
export function syncPlayerControlLockout(
  world: World,
  player: PlayerEntity,
): void {
  const state = player.tracksCombat;
  const active =
    getStatusEffects(state, CAVE_LOCKDOWN_EFFECT_ID).length > 0 ||
    getStatusEffects(state, STUN_EFFECT).length > 0;

  if (active) {
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
