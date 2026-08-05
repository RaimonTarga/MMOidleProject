import type { SummonerSlotRole } from '../../../data/summoner';

/**
 * Networked identity slice for a summoner minion entity.
 *
 * `monsterTypeId` drives client sprite lookup via `frameMaps.ts` and server
 * hitbox resolution via `resolveMinionHitbox`.
 *
 * Summons used to borrow wildlife sprites (hare, boar, frog, goat, a T1 boss).
 * They now use the Conduit's own conjured body. Per-frame and per-spec bodies
 * land in phase 7 of `docs/summoner-flavor-pass-plan.md`; until then every slot
 * shares one skull, differentiated by `sizeMult`.
 */
export type MinionMonsterType = 'conduit-summon';

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
    monsterTypeId: args.monsterTypeId ?? 'conduit-summon',
    sizeMult:      args.sizeMult ?? 1.0,
  };
}
