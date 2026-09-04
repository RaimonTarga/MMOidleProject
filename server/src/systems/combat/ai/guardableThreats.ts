/**
 * GUARDABLE THREATS — one query over every dangerous monster wind-up.
 *
 * `Enemy Charging` used to read `isMonsterCharging` alone, which sees ONLY the
 * `chargedAttack` state machine. A boss winding up a generic `MonsterAbility`
 * area-hit — a real, telegraphed, lethal cast with a cast bar over its head — was
 * invisible to the rune, so a Guard rule built to answer big casts silently failed
 * on half the roster. This module is the cross-cast view that closes that gap.
 *
 * GUARDABLE IS NOT "IS CASTING". A cast qualifies only when eating it is the thing
 * the player is being asked to survive. Utility casts — self-buffs, haste boons,
 * low-health wards, and (from Phase 4 on) stealth, burrow, and posture transitions —
 * are deliberately excluded: firing Guard on a boss buffing itself burns the answer
 * to the hit that follows, which is worse than not reacting at all.
 *
 * Consumers: the `target-casting` rune condition, encounter telemetry, and the
 * headless bot (through authoritative state, never its own simulation).
 */

import { MONSTER_DATABASE, type MonsterAbility } from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import {
  activeMonsterAbilityId,
  chargedCastEndsAt,
  isChargeAoePlanted,
  isMonsterAbilityAoePlanted,
  monsterAbilityCastEndsAt,
  monsterAbilityTargetId,
} from '../engine/monsterMechanics';

/** What a player-facing consumer needs to react to one incoming cast. */
export interface GuardableThreat {
  monsterId: string;
  /** Player-visible cast name, matching the label on the cast bar. */
  castName: string;
  /** Which state machine owns the wind-up — for telemetry attribution. */
  source: 'charged-attack' | 'monster-ability' | 'boss-pattern';
  /** Wall-clock ms the wind-up completes at. */
  completesAtMs: number;
  /** The player this cast is aimed at, when it has a single target. */
  targetId?: string;
  /**
   * Id of the ground zone this cast published, when it planted one. Lets a
   * consumer join "a big hit is coming" to "and here is exactly where".
   */
  zoneId?: string;
  /** Responses the encounter design considers valid answers to this cast. */
  responses: GuardableResponse[];
}

export type GuardableResponse = 'guard' | 'step-back' | 'tank';

/**
 * Whether a generic ability is something a player must answer.
 *
 * The rule is payload-driven rather than a per-ability flag so a new authored
 * ability is guardable by construction: if it damages players, it counts.
 */
export function abilityIsGuardable(ability: MonsterAbility): boolean {
  if (ability.actions.length === 0) return false;
  return ability.actions.some(
    (action) => action.type === 'area-hit' || action.type === 'hit',
  );
}

function zoneIdFor(world: World, monster: MonsterEntity): string | undefined {
  const nodeId = monster.hasPosition.nodeId;
  return (world.groundZones.get(nodeId) ?? []).find(
    (zone) => zone.kind !== 'toxic-pool' && zone.ownerId === monster.isMonster.id,
  )?.id;
}

/**
 * Every dangerous wind-up this monster is currently in, or an empty array.
 *
 * A monster can only ever have one live cast (the "ONE CAST PER MONSTER" invariant
 * in `combat.ts`), but the return type stays a list so the Phase 2 pattern layer
 * can add its own casts without changing every call site.
 */
export function guardableThreatsFor(
  world: World,
  monster: MonsterEntity,
  now: number,
): GuardableThreat[] {
  const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  if (!def) return [];
  const threats: GuardableThreat[] = [];
  const targetId =
    monster.hasAggroTarget?.targetKind === 'player'
      ? monster.hasAggroTarget.targetId
      : undefined;

  const chargedEndsAt = chargedCastEndsAt(monster);
  if (chargedEndsAt > now && def.chargedAttack) {
    threats.push({
      monsterId: monster.isMonster.id,
      castName: def.chargedAttack.name,
      source: 'charged-attack',
      completesAtMs: chargedEndsAt,
      targetId,
      zoneId: zoneIdFor(world, monster),
      // A planted circle or lane can be walked out of; a target-following power
      // shot cannot, so Step Back is not offered as an answer to it.
      responses: isChargeAoePlanted(monster)
        ? ['step-back', 'guard', 'tank']
        : ['guard', 'tank'],
    });
  }

  const abilityEndsAt = monsterAbilityCastEndsAt(monster);
  if (abilityEndsAt > now) {
    const castingId = activeMonsterAbilityId(monster);
    const ability = def.monsterAbilities?.find((candidate) => candidate.id === castingId);
    if (ability && abilityIsGuardable(ability)) {
      threats.push({
        monsterId: monster.isMonster.id,
        castName: ability.name,
        source: 'monster-ability',
        completesAtMs: abilityEndsAt,
        targetId:
          ability.target === 'player' ? monsterAbilityTargetId(monster) ?? targetId : undefined,
        zoneId: zoneIdFor(world, monster),
        responses: isMonsterAbilityAoePlanted(monster)
          ? ['step-back', 'guard', 'tank']
          : ['guard', 'tank'],
      });
    }
  }

  // An ordered pattern's own casts. Only a `cast` step qualifies, and only one
  // that has not opted out via `guardable: false` — a barrier going up or a posture
  // change is a beat the player READS, not one they spend a Guard on.
  const pattern = monster.runsBossPattern;
  if (pattern) {
    const definition = def.bossPattern;
    const step = definition?.steps[pattern.stepIndex];
    if (
      definition &&
      definition.id === pattern.patternId &&
      step?.kind === 'cast' &&
      (step.guardable ?? true) &&
      pattern.stepEndsAtMs > now
    ) {
      threats.push({
        monsterId: monster.isMonster.id,
        castName: step.name,
        source: 'boss-pattern',
        completesAtMs: pattern.stepEndsAtMs,
        targetId: pattern.targetId,
        zoneId: zoneIdFor(world, monster),
        // A lane is painted on the ground, so moving off it is a real answer.
        responses: step.lane ? ['step-back', 'guard', 'tank'] : ['guard', 'tank'],
      });
    }
  }

  return threats;
}

/** True when this monster is winding up anything a player is meant to answer. */
export function isMonsterThreatening(
  world: World,
  monster: MonsterEntity,
  now: number,
): boolean {
  return guardableThreatsFor(world, monster, now).length > 0;
}

/** Every guardable wind-up currently aimed at one player. */
export function guardableThreatsAgainstPlayer(
  world: World,
  playerId: string,
  now: number,
): GuardableThreat[] {
  const threats: GuardableThreat[] = [];
  for (const monster of world.aggroedMonsters) {
    if (
      monster.hasAggroTarget.targetKind !== 'player' ||
      monster.hasAggroTarget.targetId !== playerId
    ) {
      continue;
    }
    threats.push(...guardableThreatsFor(world, monster, now));
  }
  return threats.sort((a, b) => a.completesAtMs - b.completesAtMs);
}
