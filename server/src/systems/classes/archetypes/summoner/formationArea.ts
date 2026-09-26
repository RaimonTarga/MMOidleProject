import { summonAreaShareMult } from '@mmo-idle/shared';
import type { MinionEntity } from '../../../../ecs/entity';

/**
 * Per-body damage multipliers for one area hit over `caught` summons. Bodies are
 * grouped by owner so each formation shares its own hit; dead bodies don't count.
 * `summonAreaShareMult` explains why a formation shares one area hit.
 */
export function formationAreaMults(caught: Iterable<MinionEntity>): Map<string, number> {
  const byOwner = new Map<string, string[]>();
  for (const minion of caught) {
    if (minion.hasHealth.hp <= 0) continue;
    const ids = byOwner.get(minion.isMinion.ownerPlayerId) ?? [];
    ids.push(minion.isMinion.id);
    byOwner.set(minion.isMinion.ownerPlayerId, ids);
  }
  const mults = new Map<string, number>();
  for (const ids of byOwner.values()) {
    const mult = summonAreaShareMult(ids.length);
    for (const id of ids) mults.set(id, mult);
  }
  return mults;
}
