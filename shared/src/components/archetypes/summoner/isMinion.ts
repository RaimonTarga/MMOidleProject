/**
 * Networked identity slice for a summoner minion entity.
 *
 * `monsterTypeId` drives client sprite lookup via `frameMaps.ts` and server
 * hitbox resolution via `resolveMonsterHitbox`.
 */
export type MinionMonsterType =
  | 'slime'
  | 'cave-lurker'
  | 'plains-slime'
  | 'boar'
  | 'mud-toad'
  | 'cliff-hopper'
  | 'ridge-archer'
  | 'mountain-sentinel';

export interface IsMinion {
  id: string;
  ownerPlayerId: string;
  slot: number;
  monsterTypeId: MinionMonsterType;
  sizeMult: number;
}

export function initIsMinion(args: {
  id: string;
  ownerPlayerId: string;
  slot: number;
  sizeMult?: number;
  monsterTypeId?: MinionMonsterType;
}): IsMinion {
  return {
    id:            args.id,
    ownerPlayerId: args.ownerPlayerId,
    slot:          args.slot,
    monsterTypeId: args.monsterTypeId ?? 'slime',
    sizeMult:      args.sizeMult ?? 1.0,
  };
}
