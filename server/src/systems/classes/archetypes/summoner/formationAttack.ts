import type { SummonerSlotProfile } from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { runPlayerAttack, type PlayerAttackOutcome } from '../../../combat/engine/combat';
import type { CombatContext, FormationAttackContribution } from '../../../combat/engine/combatPipeline';
import { summonerProfileFor } from './profile';
import {
  commitSpecializationAttack,
  prepareSpecializationAttack,
} from './specs';

function livingLogicalSlotIds(world: World, owner: PlayerEntity): string[] {
  if (!owner.summonsMinions) return [];
  const living: string[] = [];
  for (let index = 0; index < owner.summonsMinions.targetCount; index++) {
    const entityId = owner.summonsMinions.minionIds[index];
    const minion = entityId ? world.getMinionEntity(entityId) : undefined;
    if (minion && minion.hasHealth.hp > 0) living.push(owner.summonsMinions.slotIds[index]!);
  }
  return living;
}

function prepareCycle(
  world: World,
  owner: PlayerEntity,
  slotId: string,
  targetId: string,
): { contribution: string[]; completed: boolean; serial: number } {
  const controls = owner.controlsSummons;
  if (!controls) return { contribution: [slotId], completed: true, serial: 1 };
  const living = new Set(livingLogicalSlotIds(world, owner));
  const previous = controls.cycleContributorsByTarget[targetId] ?? [];
  const contribution = previous.filter((id) => living.has(id));
  if (!contribution.includes(slotId)) contribution.push(slotId);
  const completed = living.size > 0 && [...living].every((id) => contribution.includes(id));
  return {
    contribution,
    completed,
    serial: (controls.cycleSerialByTarget[targetId] ?? 0) + (completed ? 1 : 0),
  };
}

function commitCycle(
  owner: PlayerEntity,
  targetId: string,
  prepared: { contribution: string[]; completed: boolean; serial: number },
): void {
  const controls = owner.controlsSummons;
  if (!controls) return;
  controls.cycleContributorsByTarget[targetId] = prepared.completed ? [] : prepared.contribution;
  if (prepared.completed) controls.cycleSerialByTarget[targetId] = prepared.serial;
}

function slotProfileFor(owner: PlayerEntity, minion: MinionEntity): SummonerSlotProfile {
  const profile = summonerProfileFor(owner);
  return profile.slots.find((slot) => slot.slotId === minion.isMinion.slotId)
    ?? profile.slots[minion.isMinion.slot]
    ?? profile.slots[0]!;
}

export function runFormationAttack(
  world: World,
  owner: PlayerEntity,
  minion: MinionEntity,
  target: MonsterEntity,
  now: number,
  metadata?: Record<string, unknown>,
): PlayerAttackOutcome {
  const profile = summonerProfileFor(owner);
  const slot = slotProfileFor(owner, minion);
  const cycle = prepareCycle(world, owner, slot.slotId, target.isMonster.id);
  const specialization = owner.summonsMinions && owner.controlsSummons
    ? prepareSpecializationAttack(
      world,
      owner as PlayerEntity & {
        summonsMinions: NonNullable<PlayerEntity['summonsMinions']>;
        controlsSummons: NonNullable<PlayerEntity['controlsSummons']>;
      },
      minion,
      target,
      now,
      cycle,
    )
    : { damageMult: 1, directDamageBonusWeight: 0, openingStrike: false, consumeRitualCharge: false };
  const formation: FormationAttackContribution = {
    ownerId: owner.isPlayer.id,
    physicalEntityId: minion.isMinion.id,
    slotId: slot.slotId,
    directDamageWeight: profile.formationOffenseMult * (
      slot.offenseWeight * specialization.damageMult + specialization.directDamageBonusWeight
    ),
    onHitMagnitudeWeight: slot.procWeight,
    procWeight: slot.procWeight,
    targetId: target.isMonster.id,
    cycleSerial: cycle.serial,
    cycleCompleted: cycle.completed,
    side: 'summon',
  };
  const resultMetadata: Record<string, unknown> = {};
  const outcome = runPlayerAttack(world, owner, target, now, {
    attackOrigin: minion.hasPosition.current,
    aggroSource: { id: minion.isMinion.id, kind: 'minion' },
    metadata,
    resultMetadata,
    formation,
  });
  if (outcome !== 'cancelled' && outcome !== 'dodged') {
    commitCycle(owner, target.isMonster.id, cycle);
    if (owner.summonsMinions && owner.controlsSummons) {
      commitSpecializationAttack(
        world,
        owner as PlayerEntity & {
          summonsMinions: NonNullable<PlayerEntity['summonsMinions']>;
          controlsSummons: NonNullable<PlayerEntity['controlsSummons']>;
        },
        minion,
        target,
        now,
        resultMetadata.chaoticMiss === true
          ? { ...specialization, consumeRitualCharge: false }
          : specialization,
      );
    }
  }
  return outcome;
}

export function formationProcWeight(ctx: CombatContext): number {
  return ctx.formation?.procWeight ?? 1;
}

/**
 * Deterministically converts fractional formation contributions into whole
 * generic proc triggers. Normal player attacks always return one trigger.
 */
export function consumeWeightedProc(
  ctx: CombatContext,
  key: string,
  options: { targetSpecific?: boolean } = {},
): number {
  if (!ctx.formation || ctx.attackerType !== 'player') return 1;
  const controls = ctx.attacker.controlsSummons;
  if (!controls) return 1;
  const progressKey = options.targetSpecific
    ? `${key}:${ctx.formation.targetId}`
    : key;
  const next = (controls.procProgress[progressKey] ?? 0) + ctx.formation.procWeight;
  const triggers = Math.floor(next + 1e-9);
  controls.procProgress[progressKey] = next - triggers;
  return triggers;
}
