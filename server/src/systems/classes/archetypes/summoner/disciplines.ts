/**
 * The Conduit's discipline (the T2 pick, bible §7.5) as the runtime reads it. The pick is
 * `usesSkills.disciplineId`; only the Conduit's own three count. The Command arithmetic lives
 * in shared (`disciplineCommandCost`), the stat step in `profile.ts`, Pack Strike and Elite's
 * extra in `summonPiecesT2.ts`.
 */
import { CONDUIT_KIT } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../ecs/entity';

export type ConduitDiscipline = 'conduit-swarm' | 'conduit-pack' | 'conduit-elite';

export function disciplineOf(owner: PlayerEntity): ConduitDiscipline | null {
  const picked = owner.usesSkills.disciplineId;
  return picked === 'conduit-swarm' || picked === 'conduit-pack' || picked === 'conduit-elite' ? picked : null;
}

/**
 * What a slot's rebuild costs the Conduit, as a share of the usual: Swarm's 1-cost summons
 * rebuild for free (§7.5), everything else (and every other discipline) pays in full.
 */
export function rebuildCostMult(owner: PlayerEntity, slotId: string): number {
  if (disciplineOf(owner) !== 'conduit-swarm') return 1;
  const piece = CONDUIT_KIT.pieces.find((candidate) => candidate.id === slotId.split('#')[0]);
  return piece?.command === 1 ? 0 : 1;
}
