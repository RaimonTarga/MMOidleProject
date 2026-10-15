/**
 * What the Conduit's tier 4 runtime shares (T4-CONDUIT; bible §7.7, §7.16): the status ids it
 * adds and the leaf the character picked. Imports nothing from the other Conduit files, so the
 * T2/T3 listeners, the Souls and the T4 code can all use it without a cycle.
 */
import { type ConduitLeafId } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../ecs/entity';

/** Icewarden's shell on a summon: `shield` is the damage it still absorbs. */
export const ICE_SHELL_EFFECT_ID = 'conduit-ice-shell';
/** The Obsidian Tortoise withdrawn into its shell: it takes almost no damage while it lasts. */
export const WITHDRAW_EFFECT_ID = 'conduit-withdraw';
/** Last Stand: an elite held at 1 HP for a few seconds. */
export const LAST_STAND_EFFECT_ID = 'conduit-last-stand';
/** Fall Back: a hurt summon retreating behind the tanks to mend. */
export const FALL_BACK_EFFECT_ID = 'conduit-fall-back';
/** Pressure Seal: a body that will ignore the next debuff it receives. */
export const SEAL_EFFECT_ID = 'conduit-seal';

/** The summoner tick's clock, kept on the owner so an echoed or doubled ability can read it. */
export const TICK_NOW = 'tick.now';

/** Whether the character picked this leaf (a leaf is a skill-tree pick, `player:unlockSkill`). */
export function hasLeaf(owner: PlayerEntity, id: ConduitLeafId): boolean {
  return owner.usesSkills.unlockedSkills.includes(id);
}
