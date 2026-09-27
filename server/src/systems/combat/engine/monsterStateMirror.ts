import { MONSTER_DATABASE, type StatusEffect } from '@mmo-idle/shared';
import type { World } from '../../../world/World';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import { isShelled } from '../ai/shellUp';
import { monsterNextAttackPrimed } from './monsterMechanics';

/**
 * Mirror lasting monster STATES the renderer draws as persistent looks (premium
 * pass for mobs, 2026-09-27): a casted haste, a closed shell, and a primed
 * empowered hit (the tell before a finisher / opener lands). All live in
 * server-only scratch, and a monster's status list reaches the client only while
 * it is somebody's target — a howling pack or a retracted Snapper must read as
 * such before anyone clicks it. Reconciled from the underlying state every tick
 * after combat, so every exit (expiry, consumed charges, death) clears it.
 */
export function syncMonsterStateMirror(world: World, now: number): void {
  for (const monster of world.monsterEntities) {
    const status = monster.hasStatus;
    let dirty = false;

    // The strongest casted haste on it (Howl, Chest Beat, Barrage, Screech, a
    // boss's roar): every one carries `monsterAttackSpeedBuff`.
    let haste: StatusEffect | undefined;
    for (const effect of monster.tracksCombat.statusEffects) {
      if (effect.remainingMs === 0 || effect.data.monsterAttackSpeedBuff !== 1) continue;
      if (!haste || (effect.data.attackSpeedPct ?? 0) > (haste.data.attackSpeedPct ?? 0)) haste = effect;
    }
    if (haste) {
      if (status.hastedBy?.effectId !== haste.id || status.hastedBy.stacks !== haste.stacks) {
        status.hastedBy = { effectId: haste.id, stacks: haste.stacks };
        dirty = true;
      }
    } else if (status.hastedBy) {
      delete status.hastedBy;
      dirty = true;
    }

    const shelled = isShelled(monster, now);
    if ((status.shelled === true) !== shelled) {
      if (shelled) status.shelled = true;
      else delete status.shelled;
      dirty = true;
    }

    // Only while fighting: an idle ambusher's unspent opener is not a threat yet.
    const primed = monster.hasAggroTarget !== undefined && monster.hasHealth.hp > 0 &&
      monsterNextAttackPrimed(monster, MONSTER_DATABASE.get(monster.isMonster.monsterTypeId), now);
    if ((status.primed === true) !== primed) {
      if (primed) status.primed = true;
      else delete status.primed;
      dirty = true;
    }

    if (dirty) markSliceDirty(world, monster, 'hasStatus');
  }
}
