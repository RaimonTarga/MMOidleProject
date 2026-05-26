import type { PlayerBuff, BuffId } from '@mmo-idle/shared';
import type { World } from '../../../world/World';
import { collectMechanicBuffs } from '../../classes/registry';
import { DEFENSE_BUFFS } from '../../defense';
import { WEAPON_BUFFS } from '../damage/weaponEffects';
import type { BuffDescriptor } from './descriptor';

/** Compile-time guard: shared BUFF_IDS must match server descriptor ids. */
type AssertEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : never;
type _BuffIdsMatch = AssertEqual<ServerBuffId, BuffId>;

/**
 * Single source of truth for the buff list. Each entry is a BuffDescriptor with
 * a static id/label/color and a `project(ctx)` function. To add a new buff:
 * declare it in the owning system file via `defineBuff(...)` and add the array
 * to the spread below. Order here determines render order on the BuffBar.
 */
export const ALL_BUFFS = [
  ...collectMechanicBuffs(),
  ...WEAPON_BUFFS,
  ...DEFENSE_BUFFS,
] as const satisfies readonly BuffDescriptor[];

export type ServerBuffId = typeof ALL_BUFFS[number]['id'];

/**
 * Run once per world tick (after all combat systems) to populate
 * player.activeBuffs by projecting every registered BuffDescriptor.
 */
export function syncPlayerBuffs(world: World): void {
  for (const entity of world.playerEntities) {
    const playerCs = entity.tracksCombat;
    const targetId = entity.hasAttackTarget?.targetId;
    const targetCs = targetId
      ? world.getMonsterEntity(targetId)?.tracksCombat
      : undefined;

    const buffs: PlayerBuff[] = [];
    for (const descriptor of ALL_BUFFS) {
      const buff = descriptor.project({ player: entity, playerCs, targetCs, world });
      if (buff) buffs.push(buff);
    }

    entity.hasStatus.activeBuffs = buffs;
  }
}
