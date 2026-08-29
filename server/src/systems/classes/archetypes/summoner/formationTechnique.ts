import { attachComponent, detachComponent } from '../../../../ecs/markerHelpers';
import type {
  HasFormationTechnique,
  PlayerEntity,
} from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import type { FormationAttackContribution } from '../../../combat/engine/combatPipeline';
import { summonerProfileFor } from './profile';
import { actorFromPlayer } from '../../../../world/worldLogActors';
import { recordWorldLogEvent } from '../../../../world/worldLog';

/** Reporting-only: Conduit formation Technique contribution for combat-run diagnostics. */
function recordConduitAdapter(
  world: World,
  owner: PlayerEntity,
  event: 'conduit-arm' | 'conduit-delivery' | 'conduit-share-lost',
  extra: { eligibleSummons?: number } = {},
): void {
  recordWorldLogEvent(
    world,
    {
      kind: 'technique-adapter',
      nodeId: owner.hasPosition.nodeId,
      player: actorFromPlayer(owner),
      adapter: 'conduit-formation',
      event,
      ...extra,
    },
    {
      visibility: 'combat',
      relatedPlayerIds: [owner.isPlayer.id],
      nodeId: owner.hasPosition.nodeId,
    },
  );
}

export interface FormationTechniqueDelivery {
  state: HasFormationTechnique;
  magnitudeWeight: number;
}

/**
 * Convert an armed Technique into one delivery per currently living summon.
 * Physical entity IDs deliberately make the snapshot reconstruction-safe: a
 * replacement summon is a new combatant and cannot inherit an old delivery.
 */
export function beginFormationTechnique(
  world: World,
  owner: PlayerEntity,
  abilityId: string,
): HasFormationTechnique | null {
  if (!owner.summonsMinions) return null;

  const profile = summonerProfileFor(owner);
  const rawWeights: Array<{ entityId: string; weight: number }> = [];
  for (let index = 0; index < owner.summonsMinions.targetCount; index++) {
    const entityId = owner.summonsMinions.minionIds[index];
    const minion = entityId ? world.getMinionEntity(entityId) : undefined;
    if (!minion || minion.hasHealth.hp <= 0) continue;
    const slot = profile.slots.find((candidate) => candidate.slotId === minion.isMinion.slotId)
      ?? profile.slots[index];
    rawWeights.push({ entityId, weight: Math.max(0, slot?.procWeight ?? 0) });
  }
  if (rawWeights.length === 0) return null;

  const totalWeight = rawWeights.reduce((sum, entry) => sum + entry.weight, 0);
  const fallbackWeight = 1 / rawWeights.length;
  const weightByEntityId: Record<string, number> = {};
  for (const entry of rawWeights) {
    weightByEntityId[entry.entityId] = totalWeight > 0
      ? entry.weight / totalWeight
      : fallbackWeight;
  }

  const state: HasFormationTechnique = {
    abilityId,
    pendingEntityIds: rawWeights.map((entry) => entry.entityId),
    weightByEntityId,
    damageRemainder: 0,
  };
  attachComponent(world, owner, 'hasFormationTechnique', state);
  recordConduitAdapter(world, owner, 'conduit-arm', { eligibleSummons: rawWeights.length });
  return state;
}

/** Remove dead/despawned snapshot members without transferring their share. */
export function pruneFormationTechnique(world: World, owner: PlayerEntity): void {
  const state = owner.hasFormationTechnique;
  if (!state) return;
  const before = state.pendingEntityIds.length;
  state.pendingEntityIds = state.pendingEntityIds.filter((entityId) => {
    const minion = world.getMinionEntity(entityId);
    return minion?.isMinion.ownerPlayerId === owner.isPlayer.id
      && minion.hasHealth.hp > 0;
  });
  const lost = before - state.pendingEntityIds.length;
  for (let i = 0; i < lost; i++) recordConduitAdapter(world, owner, 'conduit-share-lost');
  if (state.pendingEntityIds.length === 0) {
    detachComponent(world, owner, 'hasFormationTechnique');
  }
}

/** Claim this summon's single delivery, if it was present in the arm snapshot. */
export function consumeFormationTechniqueDelivery(
  world: World,
  owner: PlayerEntity,
  formation: FormationAttackContribution | undefined,
): FormationTechniqueDelivery | null {
  const state = owner.hasFormationTechnique;
  if (!state || formation?.side !== 'summon') return null;

  pruneFormationTechnique(world, owner);
  if (!owner.hasFormationTechnique) return null;
  const index = state.pendingEntityIds.indexOf(formation.physicalEntityId);
  if (index < 0) return null;

  state.pendingEntityIds.splice(index, 1);
  const delivery = {
    state,
    magnitudeWeight: state.weightByEntityId[formation.physicalEntityId] ?? 0,
  };
  recordConduitAdapter(world, owner, 'conduit-delivery');
  if (state.pendingEntityIds.length === 0) {
    detachComponent(world, owner, 'hasFormationTechnique');
  }
  return delivery;
}
