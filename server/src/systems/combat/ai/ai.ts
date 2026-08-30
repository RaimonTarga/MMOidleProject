import type { World } from "../../../world/World";
import type {
  MinionEntity,
  MonsterEntity,
  PlayerEntity,
} from "../../../ecs/entity";
import {
  distanceSq,
  getJungleBushes,
  MONSTER_DATABASE,
  monsterKites,
  RESOLVED_NODE_FEATURES,
  pointFromMotion,
  type AggroTargetKind,
  type MonsterDefinition,
  type Vec2,
} from "@mmo-idle/shared";
import type { ControlsMonster } from "@mmo-idle/shared";
import { NODE_REGISTRY } from "../../../world/nodeRegistry";
import { isMonsterStunned } from "../status/stun";
import { isMonsterFrozen } from "../../classes/archetypes/dot/t3/core/selectors";
import {
  chargedCastEndsAt,
  isChargeAoePlanted,
} from "../engine/monsterMechanics";
import { isMonsterKnockedBack } from "../damage/knockback";
import { setEntityMotion, stopEntity } from "../../world/movement";
import { resolveObstaclesForNode } from "../../world/nodeFeatures";
import { setAggroTarget, setAttackTarget } from "./targeting";
import {
  selectMonsterAggroCandidate,
  type MonsterAggroCandidate,
} from "./monsterTargeting";
import {
  abortEngageSequence,
  beginEngageLock,
  engageSequenceStage,
} from './engageSequence';

const KITE_GRACE_MS = 500; // ms chasing before speed ramp begins
const KITE_RAMP_RATE = 1.5; // speed multiplier gain per second past grace (no cap — ramps forever)
const KITE_MIN_SPEED = 150; // absolute floor once ramp is active (beats base player speed of 120)
const KITE_DECAY_RATE = 2.0; // drains 2× faster than it builds while monster is in attack range
const RETURN_SPEED_MULT = 1.6; // how fast monsters snap back to spawn

// Kiter (isRanged + kite:true) standoff band, as fractions of the kiter's own
// attackRange (center-to-center). Back away once the player presses inside
// RETREAT; retreat out to STANDOFF. The gap between them is the hysteresis that
// stops stop/move churn at the 5 Hz broadcast. A kiter never ramps speed (it must
// stay below player base 120) and never retreats past its leash — see updateMonsters.
const KITE_RETREAT_FRAC = 0.6;
const KITE_STANDOFF_FRAC = 0.8;
const HOLD_POST_ARRIVE_SQ = 28 * 28;
const MOUNTAIN_WANDER_SAMPLES = 8;
const MOUNTAIN_WANDER_SEPARATION_RANGE = 620;
const CAVE_LURKER_WANDER_SAMPLES = 8;
const CAVE_LURKER_BRUTE_AVOID_RANGE = 560;
// A flyer's idle circuit is wider and lazier than a walker's: it is not picking its
// way around terrain, it is riding over it. Multiplies the def's own wanderRadius so
// authoring still controls the scale.
const FLYER_WANDER_RADIUS_MULT = 1.8;

/**
 * In-combat offensive ramp. While engaged, the configured stat grows by
 * perTickPct every tickIntervalMs up to maxPct. We capture the unmodified attack
 * once (baseAttack) and mutate dealsDamage.attack so the damage-number breakdown
 * stays consistent — mirrors how chargeOnAggro mutates hasPosition.speed.
 */
function tickCombatRamp(monster: MonsterEntity, dt: number): void {
  const ramp = MONSTER_DATABASE.get(
    monster.isMonster.monsterTypeId,
  )?.rampOnCombat;
  if (!ramp) return;
  const ai = monster.controlsMonster;
  if (ramp.stat === "attack" && ai.baseAttack === undefined) {
    ai.baseAttack = monster.dealsDamage.attack;
  }
  if ((ai.rampPct ?? 0) < ramp.maxPct) {
    ai.rampAccumMs = (ai.rampAccumMs ?? 0) + dt;
    while (ai.rampAccumMs >= ramp.tickIntervalMs) {
      ai.rampAccumMs -= ramp.tickIntervalMs;
      ai.rampPct = Math.min(ramp.maxPct, (ai.rampPct ?? 0) + ramp.perTickPct);
      if ((ai.rampPct ?? 0) >= ramp.maxPct) {
        ai.rampAccumMs = 0;
        break;
      }
    }
  }
  if (ramp.stat === "attack" && ai.baseAttack !== undefined) {
    monster.dealsDamage.attack = Math.round(ai.baseAttack * (1 + (ai.rampPct ?? 0)));
  }
}

/** Restore the base stat and clear ramp state when the monster disengages. */
function resetCombatRamp(monster: MonsterEntity): void {
  const ai = monster.controlsMonster;
  if (ai.baseAttack !== undefined) monster.dealsDamage.attack = ai.baseAttack;
  ai.rampPct = 0;
  ai.rampAccumMs = 0;
}

/**
 * Kiter standoff: back directly away from the target to restore the standoff gap
 * when the player presses inside the close band, but never retreat past the leash
 * boundary. When backing away would breach the leash, the kiter holds at the edge
 * (cornered) and keeps firing — so a charging player can always catch it and the
 * leash-break check never trips mid-kite. Called only while in attack range and in
 * the "attacking" state, so the kiter keeps firing as it backpedals.
 */
function maintainKiteStandoff(
  world: World,
  monster: MonsterEntity,
  targetPos: Vec2,
): void {
  const ai = monster.controlsMonster;
  const range = monster.performsAttack.attackRange;
  const dx = monster.hasPosition.current.x - targetPos.x;
  const dy = monster.hasPosition.current.y - targetPos.y;
  const dist = Math.hypot(dx, dy);

  // Comfortable standoff (or exactly on top — no retreat direction): hold and fire.
  if (dist === 0 || dist >= range * KITE_RETREAT_FRAC) {
    stopEntity(world, monster);
    return;
  }

  const desired = range * KITE_STANDOFF_FRAC;
  const dest: Vec2 = {
    x: targetPos.x + (dx / dist) * desired,
    y: targetPos.y + (dy / dist) * desired,
  };

  // Leash clamp: retreat only if the destination stays inside the leash circle.
  // Otherwise the kiter is cornered against its territory edge — hold and fire.
  if (distanceSq(dest, ai.spawn) <= ai.leashRange * ai.leashRange) {
    setEntityMotion(world, monster, dest);
  } else {
    stopEntity(world, monster);
  }
}

type ResolvedAggroTarget =
  | { kind: "player"; entity: PlayerEntity }
  | { kind: "minion"; entity: MinionEntity };

function resolveAggroTarget(
  world: World,
  monster: MonsterEntity,
): ResolvedAggroTarget | null {
  const aggro = monster.hasAggroTarget;
  if (!aggro) return null;
  if (aggro.targetKind === "player") {
    const p = world.getPlayerEntity(aggro.targetId);
    if (!p || p.isDead || p.hasPosition.nodeId !== monster.hasPosition.nodeId) {
      if (p?.isDead) setAggroTarget(world, monster, null, Date.now());
      return null;
    }
    return { kind: "player", entity: p };
  }
  // minion
  const m = world.getMinionEntity(aggro.targetId);
  if (!m || m.hasPosition.nodeId !== monster.hasPosition.nodeId) return null;
  if (m.hasHealth.hp <= 0) return null;
  return { kind: "minion", entity: m };
}

function aggroAttackTargetId(target: ResolvedAggroTarget): string {
  return target.kind === "player"
    ? target.entity.isPlayer.id
    : target.entity.isMinion.id;
}

function aggroPosition(target: ResolvedAggroTarget): Vec2 {
  return target.entity.hasPosition.current;
}

function aggroSourceFromCandidate(c: MonsterAggroCandidate): {
  id: string;
  kind: AggroTargetKind;
} {
  return c.kind === "player"
    ? { id: c.entity.isPlayer.id, kind: "player" }
    : { id: c.entity.isMinion.id, kind: "minion" };
}

function setMonsterTarget(
  world: World,
  entity: MonsterEntity,
  target: Vec2,
): void {
  setEntityMotion(world, entity, target);
}

function stopMonster(world: World, entity: MonsterEntity): void {
  stopEntity(world, entity);
}

/**
 * Boss-script adds are encounter bodies, not independent ambient monsters. Keep
 * their aggro exactly aligned with their living summoner so they neither retarget
 * nor wander off while the boss is still fighting.
 */
function syncBossSpawnedAddTarget(
  world: World,
  add: MonsterEntity,
  now: number,
): boolean {
  const bossId = add.controlsMonster.bossSpawnerId;
  if (!bossId) return false;

  const boss = world.getMonsterEntity(bossId);
  const target = boss?.hasAggroTarget;
  if (boss && target && boss.hasPosition.nodeId === add.hasPosition.nodeId) {
    if (
      add.hasAggroTarget?.targetId !== target.targetId ||
      add.hasAggroTarget.targetKind !== target.targetKind
    ) {
      setAggroTarget(world, add, { id: target.targetId, kind: target.targetKind }, now);
    }
  } else if (add.hasAggroTarget) {
    setAggroTarget(world, add, null, now);
    setAttackTarget(world, add, null);
  }
  return true;
}

export function updateMonsters(world: World, dt: number, now: number) {
  for (const e of world.monsterEntities) {
    const ai = e.controlsMonster;
    const id = e.isMonster.id;
    const monsterDef = MONSTER_DATABASE.get(e.isMonster.monsterTypeId);
    const isBossSpawnedAdd = syncBossSpawnedAddTarget(world, e, now);

    // Stun is full CC (movement halt). Frozen is only a severe slow (handled via
    // reduced speed/attack-cooldown in updateChillAndFreeze), so frozen monsters
    // keep pathing normally — they just crawl.
    if (isMonsterStunned(world, id)) {
      abortEngageSequence(world, e);
      stopMonster(world, e);
      e.performsAttack.lastAttackAt = now;
      ai.kiteTimer = 0;
      continue;
    }

    // Knockback owns position, target, speed, and state for the duration of the
    // slide. AI resumes naturally once the component clears.
    if (isMonsterKnockedBack(world, id)) {
      abortEngageSequence(world, e);
      e.performsAttack.lastAttackAt = now;
      ai.kiteTimer = 0;
      continue;
    }

    // Freeze normally remains a severe slow, but it interrupts every beat of
    // the cave opener just as it interrupts the final charged wind-up.
    if (isMonsterFrozen(world, id)) {
      abortEngageSequence(world, e);
    }

    // Only scan for pull-range aggro when we have no current target.
    // This preserves retaliation aggro set by the combat system when a
    // player attacks from outside pull range.
    if (!e.hasAggroTarget) {
      if (!isBossSpawnedAdd) {
        // Future taunt override should run before normal policy acquisition here.
        const pulled = selectMonsterAggroCandidate(world, e);
        if (pulled) {
          setAggroTarget(world, e, aggroSourceFromCandidate(pulled), now);
        }
      }
    } else if (
      e.hasAggroTarget.targetKind === "minion" &&
      MONSTER_DATABASE.get(e.isMonster.monsterTypeId)?.targeting?.prefersPlayers
    ) {
      // A `prefersPlayers` boss that got pulled by a scouting minion re-acquires the
      // moment a player is actually in reach. Without this the whole anti-body-block
      // rule is defeated by sending the summons in first.
      const repulled = selectMonsterAggroCandidate(world, e);
      if (repulled && repulled.kind === "player") {
        setAggroTarget(world, e, aggroSourceFromCandidate(repulled), now);
      }
    }

    // Resolve and validate the current aggro target.
    // Drop it only if the target left the node, disconnected, or (for minions) died.
    const target = resolveAggroTarget(world, e);
    if (e.hasAggroTarget && !target) {
      abortEngageSequence(world, e);
      setAggroTarget(world, e, null, now);
    }

    if (target) {
      ai.lastAggroAt = now;

      // Leash check: if too far from spawn, give up and return.
      if (
        distanceSq(e.hasPosition.current, ai.spawn) >
        ai.leashRange * ai.leashRange
      ) {
        abortEngageSequence(world, e);
        setAggroTarget(world, e, null, now);
        ai.kiteTimer = 0;
        resetCombatRamp(e);
        e.hasPosition.speed = ai.baseSpeed;
        e.hasAwareness.state = "returning";
        setAttackTarget(world, e, null);
        setMonsterTarget(world, e, ai.spawn);
        continue;
      }

      // The configured offensive ramp advances while a target is held.
      tickCombatRamp(e, dt);

      // COMMITTED GROUND SLAM: while a planted `chargedAttack.aoe` wind-up is
      // pending the monster is locked in its swing — it neither chases nor
      // re-standoffs, and it holds the "attacking" state so the combat loop
      // resolves the cast instead of aborting it. Without this hold, a player
      // stepping out of the telegraph would flip the mob to "chasing" and
      // cancel the very slam they were supposed to be dodging.
      if (isChargeAoePlanted(e) && chargedCastEndsAt(e) > 0) {
        e.hasAwareness.state = "attacking";
        stopMonster(world, e);
        continue;
      }

      // A boss 'morph' action can flip the kite flag at runtime.
      const isKiter =
        e.scriptsBoss?.kiteOverride ??
        (monsterDef ? monsterKites(monsterDef) : false);
      const targetPos = aggroPosition(target);
      const inReach = world.collision.canReach(
        e,
        target.entity,
        e.performsAttack.attackRange,
      );
      const hasLine =
        inReach
        && (e.isMonster.isRanged ||
          resolveObstaclesForNode(
            world,
            e.hasPosition.nodeId,
            e.hasPosition.current,
            targetPos,
            'monster',
          ) === targetPos);

      const sequenceStage = engageSequenceStage(e, monsterDef, now);
      if (sequenceStage === 'charge') {
        if (target.kind !== 'player') {
          abortEngageSequence(world, e);
        } else if (hasLine) {
          beginEngageLock(
            world,
            e,
            target.entity,
            monsterDef!.engageSequence!.lockoutMs,
            now,
          );
          e.hasPosition.speed = ai.baseSpeed;
          e.hasAwareness.state = 'attacking';
          setAttackTarget(world, e, target.entity.isPlayer.id);
          stopMonster(world, e);
          continue;
        } else {
          e.hasPosition.speed = Math.round(
            ai.baseSpeed * monsterDef!.engageSequence!.speedMult,
          );
          e.hasAwareness.state = 'chasing';
          setAttackTarget(world, e, target.entity.isPlayer.id);
          setMonsterTarget(world, e, targetPos);
          continue;
        }
      }

      if (sequenceStage === 'lock') {
        e.hasPosition.speed = ai.baseSpeed;
        e.hasAwareness.state = 'attacking';
        setAttackTarget(world, e, aggroAttackTargetId(target));
        stopMonster(world, e);
        continue;
      }

      if (sequenceStage === 'slam-ready') {
        if (hasLine) {
          e.hasPosition.speed = ai.baseSpeed;
          e.hasAwareness.state = 'attacking';
          setAttackTarget(world, e, aggroAttackTargetId(target));
          stopMonster(world, e);
          continue;
        }
        abortEngageSequence(world, e);
      }

      if (hasLine) {
        // Only pre-load the attack timer when first stumbling onto a target (idle/wander/return),
        // not on every re-entry during a kite chase — that caused cooldown bypass via oscillation.
        if (
          e.hasAwareness.state === "idle" ||
          e.hasAwareness.state === "wandering" ||
          e.hasAwareness.state === "returning"
        ) {
          e.performsAttack.lastAttackAt = now - e.performsAttack.attackCooldown;
        }
        ai.kiteTimer = Math.max(0, ai.kiteTimer - dt * KITE_DECAY_RATE);
        e.hasPosition.speed = ai.baseSpeed;
        // Stay "attacking" even while a kiter backpedals so it keeps firing — the
        // monster→player loop only strikes in this state.
        e.hasAwareness.state = "attacking";
        setAttackTarget(world, e, aggroAttackTargetId(target));
        if (isKiter) {
          maintainKiteStandoff(world, e, targetPos);
        } else {
          stopMonster(world, e);
        }
      } else {
        const charge = monsterDef?.chargeOnAggro;
        if (charge && (ai.chargeRemainingMs ?? 0) > 0) {
          ai.chargeRemainingMs = Math.max(0, (ai.chargeRemainingMs ?? 0) - dt);
          e.hasPosition.speed = Math.round(ai.baseSpeed * charge.speedMult);
        } else if (isKiter) {
          // Kiters re-close at base speed only — the player-kite ramp below would
          // push them past player base speed (120) and make them uncatchable.
          ai.kiteTimer = 0;
          e.hasPosition.speed = ai.baseSpeed;
        } else {
          ai.kiteTimer += dt;
          const excess = Math.max(0, ai.kiteTimer - KITE_GRACE_MS);
          const mult = 1 + (excess / 1000) * KITE_RAMP_RATE;
          const rawSpeed = ai.baseSpeed * mult;
          e.hasPosition.speed = Math.round(
            excess > 0 ? Math.max(rawSpeed, KITE_MIN_SPEED) : rawSpeed,
          );
        }

        e.hasAwareness.state = "chasing";
        setAttackTarget(world, e, aggroAttackTargetId(target));
        // Path toward the target center so A* routes around trees. A geometric
        // standoff point can sit inside trunk collision and strand the monster.
        setMonsterTarget(world, e, targetPos);
      }
    } else {
      // No valid aggro target — reset kite state and return/wander.
      ai.kiteTimer = 0;
      ai.chargeRemainingMs = 0;
      resetCombatRamp(e);
      // Run at boosted speed while returning so the re-engage window is small.
      e.hasPosition.speed =
        e.hasAwareness.state === "returning"
          ? Math.round(ai.baseSpeed * RETURN_SPEED_MULT)
          : ai.baseSpeed;
      setAttackTarget(world, e, null);

      // Fixed patrol route (if any) replaces random wander while un-aggroed.
      const patrol = ai.patrolOverride ?? monsterDef?.patrol;
      const holdPost = ai.holdPost;
      if (holdPost) {
        const holdPatrol = ai.holdPatrol;
        switch (e.hasAwareness.state) {
          case "chasing":
          case "attacking":
          case "returning":
            if (distanceSq(e.hasPosition.current, holdPost) > HOLD_POST_ARRIVE_SQ) {
              e.hasAwareness.state = "returning";
              setMonsterTarget(world, e, holdPost);
            } else {
              e.hasAwareness.state = "idle";
              ai.idleUntil = now + randBetween(ai.idleMinMs, ai.idleMaxMs);
              stopMonster(world, e);
            }
            break;

          case "wandering": {
            const targetPoint = e.isMoving
              ? pointFromMotion(e.hasPosition.current, e.isMoving.motion)
              : e.hasPosition.current;
            if (distanceSq(e.hasPosition.current, targetPoint) < 16) {
              e.hasAwareness.state = "idle";
              ai.idleUntil = now + randBetween(ai.idleMinMs, ai.idleMaxMs);
              stopMonster(world, e);
            }
            break;
          }

          case "idle":
          default:
            if (holdPatrol && holdPatrol.length > 0 && now >= ai.idleUntil) {
              const idx = ai.holdPatrolIndex ?? 0;
              const targetPoint = holdPatrol[idx % holdPatrol.length];
              ai.holdPatrolIndex = (idx + 1) % holdPatrol.length;
              e.hasAwareness.state = "wandering";
              setMonsterTarget(world, e, targetPoint);
            } else if (distanceSq(e.hasPosition.current, holdPost) > HOLD_POST_ARRIVE_SQ) {
              e.hasAwareness.state = "returning";
              setMonsterTarget(world, e, holdPost);
            } else {
              stopMonster(world, e);
            }
            break;
        }
        continue;
      }

      switch (e.hasAwareness.state) {
        case "chasing":
        case "attacking":
          e.hasAwareness.state = "returning";
          setMonsterTarget(world, e, ai.spawn);
          break;

        case "returning": {
          if (distanceSq(e.hasPosition.current, ai.spawn) < 16) {
            e.hasPosition.current = { x: ai.spawn.x, y: ai.spawn.y };
            e.hasPosition.speed = ai.baseSpeed;
            e.hasAwareness.state = "idle";
            ai.idleUntil = now + randBetween(ai.idleMinMs, ai.idleMaxMs);
            stopMonster(world, e);
          } else {
            setMonsterTarget(world, e, ai.spawn);
          }
          break;
        }

        case "wandering": {
          const targetPoint = e.isMoving
            ? pointFromMotion(e.hasPosition.current, e.isMoving.motion)
            : e.hasPosition.current;
          if (distanceSq(e.hasPosition.current, targetPoint) < 16) {
            e.hasAwareness.state = "idle";
            // Patrol mobs hold at the waypoint per their patrol timing; otherwise
            // use the normal random idle window.
            ai.idleUntil =
              now +
              (patrol
                ? randBetween(
                    patrol.holdMinMs ?? ai.idleMinMs,
                    patrol.holdMaxMs ?? ai.idleMaxMs,
                  )
                : randBetween(ai.idleMinMs, ai.idleMaxMs));
            stopMonster(world, e);
          }
          break;
        }

        case "idle":
        default:
          if (now >= ai.idleUntil) {
            const node = NODE_REGISTRY.get(e.hasPosition.nodeId);
            if (patrol && patrol.waypoints.length > 0) {
              // Deterministic patrol leg toward the next waypoint.
              e.hasAwareness.state = "wandering";
              setMonsterTarget(world, e, advancePatrol(ai, patrol, node));
            } else {
              e.hasAwareness.state = "wandering";
              setMonsterTarget(
                world,
                e,
                idleWanderTarget(world, e, monsterDef, node),
              );
            }
          } else {
            stopMonster(world, e);
          }
          break;
      }
    }
  }
}

/**
 * Where a disengaged monster wanders next.
 *
 * Precedence, most specific first:
 *   1. `idleAnchor`  — the mob LIVES in a terrain feature (thicket, bog pool) and
 *                      idles in and around it rather than roaming past it. This is
 *                      what turns an "ambusher" into an ambush: the player meets it
 *                      by entering the terrain, not by being unlucky.
 *   2. `flies`       — a wide, lazy aerial circuit that ignores ground spacing.
 *   3. cave lurker   — chaotic roaming that avoids the brutes' patrol territory, so
 *                      the biome reads as "roamer wanders into the brute's fight".
 *   4. mountain      — spread scoring, so the low-density biome does not clump.
 *   5. plain random wander.
 *
 * The swamp-pool case used to be a hardcoded `biome === "swamp"` 65% roll applied
 * to EVERY swamp mob. It is now `idleAnchor: 'swamp-pool'`, authored on the one
 * monster whose identity is living in the pool.
 */
function idleWanderTarget(
  world: World,
  monster: MonsterEntity,
  def: MonsterDefinition | undefined,
  node: { width: number; height: number } | undefined,
): Vec2 {
  const ai = monster.controlsMonster;

  const anchor = def?.idleAnchor;
  if (anchor) {
    const anchored =
      anchor === "swamp-pool"
        ? poolIdleTarget(monster, node)
        : bushIdleTarget(monster, node);
    if (anchored) return anchored;
  }

  if (def?.flies === true) return aerialWanderTarget(ai, node);
  if (isCaveLurker(monster)) return caveLurkerWanderTarget(world, monster, node);
  if (def?.biome === "mountain") return mountainSpreadWanderTarget(world, monster, node);
  return randomWanderTarget(ai, node);
}

/** A wide, lazy circuit around the roost — the flyer idle. */
function aerialWanderTarget(
  ai: ControlsMonster,
  node: { width: number; height: number } | undefined,
): Vec2 {
  const angle = Math.random() * 2 * Math.PI;
  // Biased OUTWARD (sqrt distribution) so a flyer actually patrols a circuit
  // instead of hovering near its roost the way a uniform radius roll would.
  const radius =
    Math.sqrt(Math.random()) * ai.wanderRadius * FLYER_WANDER_RADIUS_MULT;
  const margin = 40;
  const minX = node ? margin : 0;
  const maxX = node ? node.width - margin : Infinity;
  const minY = node ? margin : 0;
  const maxY = node ? node.height - margin : Infinity;
  return {
    x: Math.max(minX, Math.min(maxX, ai.spawn.x + Math.cos(angle) * radius)),
    y: Math.max(minY, Math.min(maxY, ai.spawn.y + Math.sin(angle) * radius)),
  };
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomWanderTarget(
  ai: ControlsMonster,
  node: { width: number; height: number } | undefined,
): Vec2 {
  const angle = Math.random() * 2 * Math.PI;
  const radius = Math.random() * ai.wanderRadius;
  const margin = 40;
  const minX = node ? margin : 0;
  const maxX = node ? node.width - margin : Infinity;
  const minY = node ? margin : 0;
  const maxY = node ? node.height - margin : Infinity;
  return {
    x: Math.max(
      minX,
      Math.min(maxX, ai.spawn.x + Math.cos(angle) * radius),
    ),
    y: Math.max(
      minY,
      Math.min(maxY, ai.spawn.y + Math.sin(angle) * radius),
    ),
  };
}

function mountainSpreadWanderTarget(
  world: World,
  monster: MonsterEntity,
  node: { width: number; height: number } | undefined,
): Vec2 {
  let best = randomWanderTarget(monster.controlsMonster, node);
  let bestScore = mountainWanderScore(world, monster, best);

  for (let i = 1; i < MOUNTAIN_WANDER_SAMPLES; i++) {
    const candidate = randomWanderTarget(monster.controlsMonster, node);
    const score = mountainWanderScore(world, monster, candidate);
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function mountainWanderScore(
  world: World,
  monster: MonsterEntity,
  pos: Vec2,
): number {
  const separationSq =
    MOUNTAIN_WANDER_SEPARATION_RANGE * MOUNTAIN_WANDER_SEPARATION_RANGE;
  let score = 0;

  for (const other of world.monsterEntitiesInNode(monster.hasPosition.nodeId)) {
    if (other.entityId === monster.entityId) continue;
    const def = MONSTER_DATABASE.get(other.isMonster.monsterTypeId);
    if (def?.biome !== "mountain") continue;

    const d2 = distanceSq(other.hasPosition.current, pos);
    if (d2 > separationSq) continue;
    const closeness = (separationSq - d2) / separationSq;
    score += 1 + 4 * closeness;
    if (!other.controlsMonster.holdPost) {
      score += 2 * closeness;
    }
  }

  return score;
}

function isCaveLurker(monster: MonsterEntity): boolean {
  return monster.isMonster.monsterTypeId === "cave-lurker";
}

function caveLurkerWanderTarget(
  world: World,
  monster: MonsterEntity,
  node: { width: number; height: number } | undefined,
): Vec2 {
  let best = randomWanderTarget(monster.controlsMonster, node);
  let bestScore = caveLurkerWanderScore(world, monster, best);

  for (let i = 1; i < CAVE_LURKER_WANDER_SAMPLES; i++) {
    const candidate = randomWanderTarget(monster.controlsMonster, node);
    const score = caveLurkerWanderScore(world, monster, candidate);
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function caveLurkerWanderScore(
  world: World,
  monster: MonsterEntity,
  pos: Vec2,
): number {
  const avoidSq =
    CAVE_LURKER_BRUTE_AVOID_RANGE * CAVE_LURKER_BRUTE_AVOID_RANGE;
  let score = 0;

  for (const other of world.monsterEntitiesInNode(monster.hasPosition.nodeId)) {
    if (other.entityId === monster.entityId) continue;
    const def = MONSTER_DATABASE.get(other.isMonster.monsterTypeId);
    if (def?.biome !== "cave" || def.patrol === undefined) continue;

    const d2 = distanceSq(other.hasPosition.current, pos);
    if (d2 <= avoidSq) {
      score += 6 * ((avoidSq - d2) / avoidSq);
    }

    const spawnD2 = distanceSq(other.controlsMonster.spawn, pos);
    if (spawnD2 <= avoidSq) {
      score += 3 * ((avoidSq - spawnD2) / avoidSq);
    }
  }

  const travelSq = distanceSq(monster.hasPosition.current, pos);
  const wanderSq =
    monster.controlsMonster.wanderRadius * monster.controlsMonster.wanderRadius;
  score -= Math.min(1, travelSq / Math.max(1, wanderSq)) * 1.5;
  return score;
}

/**
 * IDLE ANCHOR: 'jungle-bush'. Pick a point inside the nearest thicket, so the
 * bush-lurking ambusher LIVES in the cover rather than roaming past it.
 *
 * This is the whole Jungle contract in one function: the thicket already doubles a
 * standing player's detection radius, so a snake that idles inside one means
 * "stepping into the undergrowth is what starts the fight" — terrain creates the
 * pull, not an alpha calling followers. Null when the node has no thicket (dungeon
 * arenas carry none), in which case the caller falls back to a plain wander.
 */
function bushIdleTarget(
  monster: MonsterEntity,
  node: { width: number; height: number } | undefined,
): Vec2 | null {
  const bushes = getJungleBushes(monster.hasPosition.nodeId).bushes;
  if (bushes.length === 0) return null;

  const origin = monster.controlsMonster.spawn;
  let best = bushes[0]!;
  let bestDistSq = distanceSq(origin, best);
  for (const bush of bushes.slice(1)) {
    const d2 = distanceSq(origin, bush);
    if (d2 < bestDistSq) {
      best = bush;
      bestDistSq = d2;
    }
  }

  const angle = Math.random() * 2 * Math.PI;
  const radius = Math.random() * best.radius * 0.8;
  const margin = 40;
  const minX = node ? margin : 0;
  const maxX = node ? node.width - margin : Infinity;
  const minY = node ? margin : 0;
  const maxY = node ? node.height - margin : Infinity;
  return {
    x: Math.max(minX, Math.min(maxX, best.x + Math.cos(angle) * radius)),
    y: Math.max(minY, Math.min(maxY, best.y + Math.sin(angle) * radius)),
  };
}

/**
 * IDLE ANCHOR: 'swamp-pool'. Pick a point inside (or on the lip of) the nearest bog
 * pool, so the Lurker sits half-submerged in its ambush spot rather than roaming
 * like an ordinary crocodile. Null when the node has no pool, in which case the
 * caller falls back to a plain wander.
 */
function poolIdleTarget(
  monster: MonsterEntity,
  node: { width: number; height: number } | undefined,
): Vec2 | null {
  const pools = RESOLVED_NODE_FEATURES[monster.hasPosition.nodeId]?.filter(
    (feature) =>
      feature.shape.kind === "circle" &&
      feature.damage?.targets.includes("player"),
  );
  if (!pools || pools.length === 0) return null;

  const origin = monster.controlsMonster.spawn;
  let best = pools[0];
  let bestDistSq = distanceSq(origin, best.shape);
  for (const pool of pools.slice(1)) {
    const d2 = distanceSq(origin, pool.shape);
    if (d2 < bestDistSq) {
      best = pool;
      bestDistSq = d2;
    }
  }

  const shape = best.shape;
  if (shape.kind !== "circle") return null;
  const angle = Math.random() * 2 * Math.PI;
  // INSIDE the pool (up to 85% of its radius), not orbiting outside it — the
  // difference between "lives in the bog" and "walks past the bog".
  const radius = Math.random() * shape.radius * 0.85;
  const margin = 40;
  const minX = node ? margin : 0;
  const maxX = node ? node.width - margin : Infinity;
  const minY = node ? margin : 0;
  const maxY = node ? node.height - margin : Infinity;
  return {
    x: Math.max(minX, Math.min(maxX, shape.x + Math.cos(angle) * radius)),
    y: Math.max(minY, Math.min(maxY, shape.y + Math.sin(angle) * radius)),
  };
}

type PatrolSpec = NonNullable<MonsterDefinition["patrol"]> & {
  absolute?: boolean;
};

/**
 * Compute the next patrol destination (spawn + the current relative waypoint,
 * clamped to node bounds) and advance the waypoint pointer for the following leg.
 * Index-based and deterministic — no RNG. Loop wraps; pingpong flips direction at
 * the ends. A single-waypoint route resolves to a held post.
 */
function advancePatrol(
  ai: ControlsMonster,
  patrol: PatrolSpec,
  node: { width: number; height: number } | undefined,
): Vec2 {
  const n = patrol.waypoints.length;
  const i = Math.min(ai.patrolIndex ?? 0, n - 1);
  const wp = patrol.waypoints[i];

  if (patrol.mode === "pingpong" && n > 1) {
    let dir = ai.patrolDir ?? 1;
    let next = i + dir;
    if (next >= n) {
      dir = -1;
      next = i + dir;
    } else if (next < 0) {
      dir = 1;
      next = i + dir;
    }
    ai.patrolDir = dir;
    ai.patrolIndex = Math.max(0, Math.min(n - 1, next));
  } else {
    ai.patrolIndex = (i + 1) % n;
  }

  const margin = 40;
  const minX = node ? margin : 0;
  const maxX = node ? node.width - margin : Infinity;
  const minY = node ? margin : 0;
  const maxY = node ? node.height - margin : Infinity;
  const x = patrol.absolute ? wp.x : ai.spawn.x + wp.x;
  const y = patrol.absolute ? wp.y : ai.spawn.y + wp.y;
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}
