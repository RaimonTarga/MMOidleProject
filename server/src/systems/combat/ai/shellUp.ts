import {
  MONSTER_DATABASE,
  applyStatusEffect,
  getCounter,
  getStatusEffect,
  setCounter,
  type MonsterDefinition,
} from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';
import { setRooted } from '../../world/rooted';
import { stopEntity } from '../../world/movement';
import { publishToxicPool } from '../../world/groundZones';

/**
 * SHELL UP — the Snapper lineage's signature, and the one defensive state in the
 * roster that takes a monster OUT of the fight for a moment.
 *
 * The first time a shelled monster drops to or below `shellUp.atHpPct` of its max
 * HP it retracts: it stops moving, stops attacking, and incoming DIRECT damage is
 * multiplied down hard. When the timer runs out it comes back out and fights
 * normally for the rest of its life.
 *
 * Three properties make this a beat rather than a stall:
 *   • ONCE PER LIFE, not per combat session — it can never loop.
 *   • DoTs keep ticking at full strength (this only gates the direct-hit path), so
 *     any damage-over-time build simply keeps working through the shell. That is
 *     the authored counterplay, and the reason the state has a hard exit even
 *     against a pure-burst build that chooses to wait it out.
 *   • It cannot start below 0 HP — a hit that would kill it, kills it.
 *
 * The evolved Snapper adds `pool`: retracting also contaminates the ground it is
 * standing on, so the later shell is defense AND space denial.
 *
 * State lives on the monster's `tracksCombat` scratch (runtime-only, freed on
 * despawn). Keys are private to this module.
 */
const SHELL_USED_KEY = 'shellUpUsed';
const SHELL_ENDS_KEY = 'shellUpEndsAt';
const SHELL_CAST_ENDS_KEY = 'shellUpCastEndsAt';
/** Earliest time a `repeatIntervalMs` shell may close again (0 = no cycle armed). */
const SHELL_NEXT_KEY = 'shellUpNextAt';

export const SHELLED_EFFECT_ID = 'shelled';

/** True while the monster is retracted into its shell. */
export function isShelled(monster: MonsterEntity, now: number): boolean {
  return getCounter(monster.tracksCombat, SHELL_ENDS_KEY) > now;
}

/** True while the Snapper is winding up its Shell Up cast. */
export function isShellCasting(monster: MonsterEntity, now: number): boolean {
  return getCounter(monster.tracksCombat, SHELL_CAST_ENDS_KEY) > now;
}

/**
 * Multiplier on incoming DIRECT damage for a shelled monster (1 when it is not
 * shelled). Read on the player -> monster path only; DoT ticks deliberately do not
 * consult it.
 */
export function shellDamageMult(monster: MonsterEntity, now: number): number {
  if (!isShelled(monster, now)) return 1;
  const effect = getStatusEffect(monster.tracksCombat, SHELLED_EFFECT_ID);
  const mult = effect?.data['directDamageMult'];
  return mult === undefined ? 1 : Math.max(0, mult);
}

/**
 * Open and close shells. Runs BEFORE `updateMonsters` alongside the other ecology
 * coordinators: it only attaches/detaches the markers that stop movement and
 * attacks, and `updateMonsters` stays the single executor.
 */
export function updateShellUp(world: World, now: number): void {
  for (const monster of world.monsterEntities) {
    const spec = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.shellUp;
    if (!spec) continue;
    if (monster.hasHealth.hp <= 0) continue;

    const cs = monster.tracksCombat;
    const endsAt = getCounter(cs, SHELL_ENDS_KEY);
    const castEndsAt = getCounter(cs, SHELL_CAST_ENDS_KEY);

    // The Shell Up wind-up is deliberately planted and non-defensive: it gives
    // players a short readable beat before direct-damage resistance begins.
    if (castEndsAt > 0) {
      if (now < castEndsAt) {
        stopEntity(world, monster);
        continue;
      }
      setCounter(cs, SHELL_CAST_ENDS_KEY, 0);
      closeShell(world, monster, spec, now);
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'monster-cast-end', monsterId: monster.isMonster.id, fired: true,
      });
      continue;
    }

    // Currently shelled: hold it still until the timer runs out.
    if (endsAt > 0) {
      if (now < endsAt) {
        stopEntity(world, monster);
        continue;
      }
      setCounter(cs, SHELL_ENDS_KEY, 0);
      // Boss shell CYCLE: re-arm instead of retiring. Every shell after the first
      // is on the clock, not on the HP threshold.
      if (spec.repeatIntervalMs) {
        setCounter(cs, SHELL_NEXT_KEY, now + spec.repeatIntervalMs);
      }
      detachComponent(world, monster, 'cannotAttack');
      setRooted(world, monster, false);
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'ecology-pulse',
        monsterId: monster.isMonster.id,
        pos: { ...monster.hasPosition.current },
        pulse: 'shell-open',
      });
      continue;
    }

    if (getCounter(cs, SHELL_USED_KEY) === 1) {
      // Once-per-life unless the def opts into the cycle.
      if (!spec.repeatIntervalMs) continue;
      const nextAt = getCounter(cs, SHELL_NEXT_KEY);
      if (nextAt === 0 || now < nextAt) continue;
      // A cycling shell only closes while the thing is actually in a fight —
      // otherwise it spends its life retracted in an empty room.
      if (!monster.hasAggroTarget) continue;
    } else {
      const threshold = monster.hasHealth.maxHp * spec.atHpPct;
      if (monster.hasHealth.hp > threshold) continue;
    }

    // Reserve the one use as soon as the cast begins, then leave the brief
    // wind-up fully vulnerable. No-cast specs retain the legacy instant close.
    setCounter(cs, SHELL_USED_KEY, 1);
    if (spec.castMs && spec.castMs > 0) {
      setCounter(cs, SHELL_CAST_ENDS_KEY, now + spec.castMs);
      attachComponent(world, monster, 'cannotAttack', {});
      setRooted(world, monster, true);
      stopEntity(world, monster);
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'monster-cast-start', monsterId: monster.isMonster.id,
        castMs: spec.castMs, label: 'Shell Up',
      });
      continue;
    }
    closeShell(world, monster, spec, now);
  }
}

function closeShell(
  world: World,
  monster: MonsterEntity,
  spec: NonNullable<MonsterDefinition['shellUp']>,
  now: number,
): void {
    const cs = monster.tracksCombat;
    setCounter(cs, SHELL_ENDS_KEY, now + spec.durationMs);
    attachComponent(world, monster, 'cannotAttack', {});
    // setRooted (not a raw marker attach) so the shell also clears any in-flight
    // knockback and kite ramp — a retracted Snapper is genuinely planted.
    setRooted(world, monster, true);
    applyStatusEffect(cs, {
      id: SHELLED_EFFECT_ID,
      maxStacks: 1,
      remainingMs: spec.durationMs,
      refreshable: true,
      sourceId: monster.isMonster.id,
      data: {
        directDamageMult: spec.directDamageMult,
        totalMs: spec.durationMs,
      },
    });

    // The shell closing contaminates the ground around it: rot for the Snapper,
    // a MAGMA VENT for the Volcano lineage.
    const pool = spec.pool;
    if (pool) {
      const flavor = pool.flavor ?? 'toxic';
      const isVent = flavor === 'magma-vent';
      publishToxicPool(world, monster.hasPosition.nodeId, {
        kind: 'toxic-pool',
        pos: { ...monster.hasPosition.current },
        radius: pool.radius,
        startedAtMs: now,
        expiresAtMs: now + pool.durationMs,
        damagePerTick: pool.damagePerTick,
        tickIntervalMs: pool.tickIntervalMs,
        slowSpeedMult: pool.slowSpeedMult,
        flavor,
        rampAccelMult: pool.rampAccelMult,
        // Owner-bound so the vent dies with the boss — a cleared arena must not stay
        // lethal, and a minutes-long vent would outlive the encounter that authored it.
        ownerId: monster.isMonster.id,
        sourceId: isVent ? 'magma-vent' : 'shell-pool',
        sourceLabel: isVent ? 'Magma Vent' : 'Shell Pool',
        killer: {
          monsterTypeId: monster.isMonster.monsterTypeId,
          monsterName: monster.isMonster.name,
          isBoss: monster.isMonster.isBoss,
          nodeId: monster.hasPosition.nodeId,
        },
        // A VENT IS NOT AUTO-AVOIDED. This is the whole reason avoidance keys off the
        // zone's semantics rather than its texture: standing in the vent is a legal,
        // rewarded choice, so the avoidance rune must leave the decision to the player.
        ...(isVent
          ? {
              semantics: {
                disposition: 'hostile-to-player' as const,
                persistence: 'persistent' as const,
                movementResponse: 'none' as const,
              },
            }
          : {}),
      });
    }

    world.pushEvent(monster.hasPosition.nodeId, {
      kind: 'ecology-pulse',
      monsterId: monster.isMonster.id,
      pos: { ...monster.hasPosition.current },
      pulse: 'shell-up',
    });
}
