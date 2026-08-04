import type { SummonerSlotRole } from '../../../data/summoner';

/**
 * Networked identity slice for a summoner minion entity.
 *
 * `monsterTypeId` drives client sprite lookup via `frameMaps.ts` and server
 * hitbox resolution via `resolveMinionHitbox`.
 */
export type MinionMonsterType =
  | 'slime'
  | 'cave-lurker'
  | 'plains-slime'
  | 'boar'
  | 'mud-toad'
  | 'cliff-hopper'
  | 'ridge-archer'
  | 'crag-behemoth';

export interface IsMinion {
  id: string;
  ownerPlayerId: string;
  slot: number;
  slotId: string;
  role: SummonerSlotRole;
  monsterTypeId: MinionMonsterType;
  sizeMult: number;
}

export function initIsMinion(args: {
  id: string;
  ownerPlayerId: string;
  slot: number;
  slotId?: string;
  role?: SummonerSlotRole;
  sizeMult?: number;
  monsterTypeId?: MinionMonsterType;
}): IsMinion {
  return {
    id:            args.id,
    ownerPlayerId: args.ownerPlayerId,
    slot:          args.slot,
    slotId:        args.slotId ?? `normal:${args.slot}`,
    role:          args.role ?? 'normal',
    monsterTypeId: args.monsterTypeId ?? 'slime',
    sizeMult:      args.sizeMult ?? 1.0,
  };
}
