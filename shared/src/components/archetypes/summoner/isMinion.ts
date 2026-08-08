import type { SummonerSlotRole } from '../../../data/summoner';

/**
 * Networked identity slice for a summoner minion entity.
 *
 * `monsterTypeId` drives client sprite lookup via `frameMaps.ts` and server
 * hitbox resolution via `resolveMinionHitbox`.
 *
 * Summons used to borrow wildlife sprites (hare, boar, frog, goat, a T1 boss).
 * The root formation keeps the baseline Conduit summon, while each frame and
 * specialization resolves to its own conjured familiar body.
 */
export type MinionMonsterType =
  | 'conduit-summon'
  | 'conduit-summon-splinter'
  | 'conduit-summon-inquisitor'
  | 'conduit-summon-kilnmaster'
  | 'conduit-summon-iconoclast'
  | 'conduit-summon-consort'
  | 'conduit-summon-marshal'
  | 'conduit-summon-chorister'
  | 'conduit-summon-ritualist'
  | 'conduit-summon-effigy'
  | 'conduit-summon-covenanter-offense'
  | 'conduit-summon-covenanter-defense'
  | 'conduit-summon-champion'
  | 'conduit-summon-idolwright';

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
