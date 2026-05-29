import type { World } from "../../../world/World";
import type {
  MinionEntity,
  MonsterEntity,
  PlayerEntity,
} from "../../../ecs/entity";
import {
  distanceSq,
  inAttackRange,
  MONSTER_DATABASE,
  pointFromMotion,
  posHitboxFromEntity,
  type AggroTargetKind,
  type Vec2,
} from "@mmo-idle/shared";
import { NODE_REGISTRY } from "../../../world/nodeRegistry";
import { isMonsterFrozen } from "../../classes/archetypes/dot/t3";
import { isMonsterStunned } from "../status/stun";
import { isMonsterKnockedBack } from "../damage/knockback";
import { setEntityMotion, stopEntity } from "../../world/movement";
import { setAggroTarget, setAttackTarget } from "./targeting";

const KITE_GRACE_MS = 500; // ms chasing before speed ramp begins
const KITE_RAMP_RATE = 1.5; // speed multiplier gain per second past grace (no cap — ramps forever)
const KITE_MIN_SPEED = 150; // absolute floor once ramp is active (beats base player speed of 120)
const KITE_DECAY_RATE = 2.0; // drains 2× faster than it builds while monster is in attack range
const RETURN_SPEED_MULT = 1.6; // how fast monsters snap back to spawn

type AggroCandidate =
  | { kind: "player"; entity: PlayerEntity }
  | { kind: "minion"; entity: MinionEntity };

/**
 * Split-aggro pull-range scan: the closest of any player OR minion within
 * the monster's pull range. Minions are valid aggro targets for the summoner
 * archetype — they tank for the player.
 */
function findAggro(
  monster: MonsterEntity,
  world: World,
): AggroCandidate | null {
  const pullSq = monster.hasAwareness.pullRange ** 2;
  let best: AggroCandidate | null = null;
  let bestDist = Infinity;

  for (const p of world.livePlayersInNode(monster.hasPosition.nodeId)) {
    const d = distanceSq(p.hasPosition.current, monster.hasPosition.current);
    if (d < pullSq && d < bestDist) {
      bestDist = d;
      best = { kind: "player", entity: p };
    }
  }
  for (const m of world.minionEntitiesInNode(monster.hasPosition.nodeId)) {
    if (m.hasHealth.hp <= 0) continue;
    const d = distanceSq(m.hasPosition.current, monster.hasPosition.current);
    if (d < pullSq && d < bestDist) {
      bestDist = d;
      best = { kind: "minion", entity: m };
    }
  }

  return best;
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

    if (isMonsterFrozen(world, id) || isMonsterStunned(world, id)) {
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
      const pulled = findAggro(e, world);
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
        e.hasPosition.speed = ai.baseSpeed;
        e.hasAwareness.state = "returning";
        setAttackTarget(world, e, null);
        setMonsterTarget(world, e, ai.spawn);
        continue;
      }

      const monsterPH = posHitboxFromEntity(e);
      const targetPH = posHitboxFromEntity(target.entity);

      if (inAttackRange(monsterPH, targetPH, e.performsAttack.attackRange)) {
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
        e.hasAwareness.state = "attacking";
        setAttackTarget(world, e, aggroAttackTargetId(target));
        stopMonster(world, e);
      } else {
        const charge = MONSTER_DATABASE.get(
          e.isMonster.monsterTypeId,
        )?.chargeOnAggro;
        if (charge && (ai.chargeRemainingMs ?? 0) > 0) {
          ai.chargeRemainingMs = Math.max(0, (ai.chargeRemainingMs ?? 0) - dt);
          e.hasPosition.speed = Math.round(ai.baseSpeed * charge.speedMult);
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
        setMonsterTarget(world, e, aggroPosition(target));
      }
    } else {
      // No valid aggro target — reset kite state and return/wander.
      ai.kiteTimer = 0;
      ai.chargeRemainingMs = 0;
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
