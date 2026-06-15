import type { World } from "../../../world/World";
import type {
  MinionEntity,
  MonsterEntity,
  PlayerEntity,
} from "../../../ecs/entity";
import {
  distanceSq,
  MONSTER_DATABASE,
  pointFromMotion,
  type AggroTargetKind,
  type Vec2,
} from "@mmo-idle/shared";
import { NODE_REGISTRY } from "../../../world/nodeRegistry";
import { isMonsterStunned } from "../status/stun";
import { isMonsterKnockedBack } from "../damage/knockback";
import { setEntityMotion, stopEntity } from "../../world/movement";
import { resolveObstaclesForNode } from "../../world/nodeFeatures";
import { setAggroTarget, setAttackTarget } from "./targeting";

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

/**
 * Volcano in-combat attack ramp. While engaged, the monster's attack grows by
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
  if (ai.baseAttack === undefined) ai.baseAttack = monster.dealsDamage.attack;
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
  monster.dealsDamage.attack = Math.round(ai.baseAttack * (1 + (ai.rampPct ?? 0)));
}

/** Restore base attack and clear ramp state when the monster disengages. */
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

type AggroCandidate =
  | { kind: "player"; entity: PlayerEntity }
  | { kind: "minion"; entity: MinionEntity };

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

function aggroSourceFromCandidate(c: AggroCandidate): {
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

export function updateMonsters(world: World, dt: number, now: number) {
  for (const e of world.monsterEntities) {
    const ai = e.controlsMonster;
    const id = e.isMonster.id;

    // Stun is full CC (movement halt). Frozen is only a severe slow (handled via
    // reduced speed/attack-cooldown in updateChillAndFreeze), so frozen monsters
    // keep pathing normally — they just crawl.
    if (isMonsterStunned(world, id)) {
      stopMonster(world, e);
      e.performsAttack.lastAttackAt = now;
      ai.kiteTimer = 0;
      continue;
    }

    // Knockback owns position, target, speed, and state for the duration of the
    // slide. AI resumes naturally once the component clears.
    if (isMonsterKnockedBack(world, id)) {
      e.performsAttack.lastAttackAt = now;
      ai.kiteTimer = 0;
      continue;
    }

    // Only scan for pull-range aggro when we have no current target.
    // This preserves retaliation aggro set by the combat system when a
    // player attacks from outside pull range.
    if (!e.hasAggroTarget) {
      const pulled = world.collision.aggroCandidate(e);
      if (pulled) {
        setAggroTarget(world, e, aggroSourceFromCandidate(pulled), now);
      }
    }

    // Resolve and validate the current aggro target.
    // Drop it only if the target left the node, disconnected, or (for minions) died.
    const target = resolveAggroTarget(world, e);
    if (e.hasAggroTarget && !target) {
      setAggroTarget(world, e, null, now);
    }

    if (target) {
      ai.lastAggroAt = now;

      // Leash check: if too far from spawn, give up and return.
      if (
        distanceSq(e.hasPosition.current, ai.spawn) >
        ai.leashRange * ai.leashRange
      ) {
        setAggroTarget(world, e, null, now);
        ai.kiteTimer = 0;
        resetCombatRamp(e);
        e.hasPosition.speed = ai.baseSpeed;
        e.hasAwareness.state = "returning";
        setAttackTarget(world, e, null);
        setMonsterTarget(world, e, ai.spawn);
        continue;
      }

      // In-combat attack ramp (Volcano) advances while a target is held.
      tickCombatRamp(e, dt);

      const monsterDef = MONSTER_DATABASE.get(e.isMonster.monsterTypeId);
      // A boss 'morph' action can flip the kite flag at runtime.
      const isKiter = (e.scriptsBoss?.kiteOverride ?? monsterDef?.kite) === true;

      const targetPos = aggroPosition(target);
      const inReach = world.collision.canReach(
        e,
        target.entity,
        e.performsAttack.attackRange,
      );
      const hasLine =
        inReach
        && resolveObstaclesForNode(
          world,
          e.hasPosition.nodeId,
          e.hasPosition.current,
          targetPos,
          'monster',
        ) === targetPos;

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
            ai.idleUntil = now + randBetween(ai.idleMinMs, ai.idleMaxMs);
            stopMonster(world, e);
          }
          break;
        }

        case "idle":
        default:
          if (now >= ai.idleUntil) {
            const angle = Math.random() * 2 * Math.PI;
            const radius = Math.random() * ai.wanderRadius;
            const node = NODE_REGISTRY.get(e.hasPosition.nodeId);
            const margin = 40;
            const minX = node ? margin : 0;
            const maxX = node ? node.width - margin : Infinity;
            const minY = node ? margin : 0;
            const maxY = node ? node.height - margin : Infinity;
            e.hasAwareness.state = "wandering";
            setMonsterTarget(world, e, {
              x: Math.max(
                minX,
                Math.min(maxX, ai.spawn.x + Math.cos(angle) * radius),
              ),
              y: Math.max(
                minY,
                Math.min(maxY, ai.spawn.y + Math.sin(angle) * radius),
              ),
            });
          } else {
            stopMonster(world, e);
          }
          break;
      }
    }
  }
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
