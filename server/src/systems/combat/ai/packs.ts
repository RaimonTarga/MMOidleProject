import { distanceSq, MONSTER_DATABASE, type InPack, type Vec2 } from "@mmo-idle/shared";
import type { MonsterEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { attachComponent, detachComponent } from "../../../ecs/markerHelpers";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import { setAggroTarget, setAttackTarget } from "./targeting";
import { selectMonsterAggroCandidate } from "./monsterTargeting";

type Coordination = NonNullable<InPack["coordination"]>;
/** Brief gaps between attacks must not break a kited group encounter. */
export const PACK_ATTACK_GRACE_MS = 5_000;

function compareId(a: MonsterEntity, b: MonsterEntity): number {
  return a.isMonster.id.localeCompare(b.isMonster.id);
}

export function createPackCoordination(leader: MonsterEntity): Coordination {
  return {
    home: { ...leader.controlsMonster.spawn },
    pursuitAnchor: { ...leader.controlsMonster.spawn },
    leashRange: leader.controlsMonster.leashRange,
    followRadius: MONSTER_DATABASE.get(leader.isMonster.monsterTypeId)?.pack?.followRadius ?? 120,
    leaderId: leader.isMonster.id,
  };
}

function resolveTarget(world: World, member: MonsterEntity, target: Coordination["target"]) {
  if (!target) return undefined;
  const entity = target.kind === "player"
    ? world.getPlayerEntity(target.id)
    : world.getMinionEntity(target.id);
  return entity && !entity.isDead && entity.hasHealth.hp > 0 &&
    entity.hasPosition.nodeId === member.hasPosition.nodeId ? entity : undefined;
}

/** Cast-selected allies share pursuit until they have all returned home. */
export function coordinateRally(world: World, leader: MonsterEntity, allies: MonsterEntity[], now: number): void {
  const aggro = leader.hasAggroTarget;
  if (!aggro || leader.inPack || !allies.length) return;
  const coordination = createPackCoordination(leader);
  coordination.target = { id: aggro.targetId, kind: aggro.targetKind };
  coordination.pursuitAnchor = { ...leader.hasPosition.current };
  coordination.lastAttackedAt = now;
  coordination.temporaryEncounter = {};
  const packId = `${leader.isMonster.id}:rally:${now}`;
  for (const member of [leader, ...allies]) {
    attachComponent(world, member, "inPack", {
      packId, role: member === leader ? "alpha" : "follower", coordination,
    });
  }
}

/** Bounded, one-hop Plains recruitment. Membership stays stable for this encounter. */
function recruitSwarms(world: World, now: number): void {
  const candidates = [...world.monsterEntities].sort(compareId);
  for (const seed of candidates) {
    if (seed.hasHealth.hp <= 0 || seed.inPack || seed.isMonster.isBoss || seed.controlsMonster.bossSpawnerId ||
        seed.tracksDungeon || seed.hasAwareness.state === "returning") continue;
    const def = MONSTER_DATABASE.get(seed.isMonster.monsterTypeId);
    const range = def?.swarm?.recruitRange;
    if (!range) continue;
    const pulled = seed.hasAggroTarget ? undefined : selectMonsterAggroCandidate(world, seed);
    const target: Coordination["target"] = seed.hasAggroTarget
      ? { id: seed.hasAggroTarget.targetId, kind: seed.hasAggroTarget.targetKind }
      : pulled ? { id: pulled.kind === "player" ? pulled.entity.isPlayer.id : pulled.entity.isMinion.id, kind: pulled.kind } : undefined;
    if (!resolveTarget(world, seed, target)) continue;
    const mates = candidates.filter(m => m !== seed && m.hasHealth.hp > 0 && !m.inPack && !m.isMonster.isBoss &&
      !m.controlsMonster.bossSpawnerId && !m.tracksDungeon &&
      m.hasAwareness.state !== "returning" && m.hasPosition.nodeId === seed.hasPosition.nodeId &&
      MONSTER_DATABASE.get(m.isMonster.monsterTypeId)?.biome === def?.biome &&
      !!MONSTER_DATABASE.get(m.isMonster.monsterTypeId)?.swarm?.recruitRange &&
      (!m.hasAggroTarget || (m.hasAggroTarget.targetId === target!.id && m.hasAggroTarget.targetKind === target!.kind)) &&
      distanceSq(seed.hasPosition.current, m.hasPosition.current) <= range ** 2)
      .sort((a, b) => distanceSq(seed.hasPosition.current, a.hasPosition.current) -
        distanceSq(seed.hasPosition.current, b.hasPosition.current) || compareId(a, b))
      .slice(0, Math.max(0, (def?.swarm?.maxMembers ?? 4) - 1));
    if (!mates.length) continue;
    const coordination = createPackCoordination(seed);
    coordination.target = target;
    // The seed may have been hit before recruitment. Give the newly formed
    // encounter one full attack window rather than dropping it on its first tick.
    coordination.lastAttackedAt = now;
    coordination.temporaryEncounter = {};
    const packId = `${seed.isMonster.id}:swarm:${now}`;
    for (const m of [seed, ...mates]) {
      attachComponent(world, m, "inPack", { packId, role: m === seed ? "alpha" : "follower", coordination });
    }
  }
}

/** One encounter decision per group; updateMonsters remains the movement executor. */
export function updatePacks(world: World, now: number): void {
  recruitSwarms(world, now);
  const groups = new Map<string, MonsterEntity[]>();
  for (const e of world.monsterEntities) {
    if (!e.inPack || e.hasHealth.hp <= 0) continue;
    const key = `${e.hasPosition.nodeId}:${e.inPack.packId}`;
    const members = groups.get(key) ?? [];
    members.push(e);
    groups.set(key, members);
  }
  for (const members of groups.values()) {
    members.sort(compareId);
    const leader = members.find(m => m.inPack!.role === "alpha") ?? members[0]!;
    const state = members.find(m => m.inPack!.coordination)?.inPack!.coordination ?? createPackCoordination(leader);
    if (state.pendingAttack) {
      state.lastAttackedAt = now;
      delete state.pendingAttack;
    }
    if (!members.some(m => m.isMonster.id === state.leaderId)) state.leaderId = leader.isMonster.id;
    for (const m of members) {
      m.inPack!.coordination = state;
      if (m.hasAwareness.leashRange !== state.leashRange) {
        m.hasAwareness.leashRange = state.leashRange;
        markSliceDirty(world, m, "hasAwareness");
      }
    }

    if (state.returning) {
      if (members.every(m => distanceSq(m.hasPosition.current, m.controlsMonster.holdPost ?? m.controlsMonster.spawn) <= 28 ** 2)) {
        delete state.returning;
        state.pursuitAnchor = { ...state.home };
        delete state.lastAttackedAt;
        for (const m of members) {
          m.hasAwareness.state = "idle";
          markSliceDirty(world, m, "hasAwareness");
          if (state.temporaryEncounter) {
            detachComponent(world, m, "inPack");
            m.hasAwareness.leashRange = m.controlsMonster.leashRange;
          }
        }
        continue;
      }
      returnTogether(world, members, state, now);
      continue;
    }

    // Retain the encounter target instead of letting iteration order retarget it.
    if (state.target && !resolveTarget(world, leader, state.target)) {
      returnTogether(world, members, state, now);
      continue;
    }
    if (!state.target) {
      for (const m of members) {
        const held = m.hasAggroTarget;
        const candidate = held ? { id: held.targetId, kind: held.targetKind } : undefined;
        if (resolveTarget(world, m, candidate)) { state.target = candidate; break; }
      }
      if (!state.target) {
        for (const m of members) {
          const candidate = selectMonsterAggroCandidate(world, m);
          if (!candidate) continue;
          state.target = { id: candidate.kind === "player" ? candidate.entity.isPlayer.id : candidate.entity.isMinion.id, kind: candidate.kind };
          break;
        }
      }
    }
    if (!state.target) continue;
    const target = resolveTarget(world, leader, state.target);
    if (!target) {
      returnTogether(world, members, state, now);
      continue;
    }
    const recentlyAttacked = state.lastAttackedAt !== undefined && now - state.lastAttackedAt < PACK_ATTACK_GRACE_MS;
    if (!recentlyAttacked && distanceSq(target.hasPosition.current, state.pursuitAnchor) > state.leashRange ** 2) {
      returnTogether(world, members, state, now);
      continue;
    }
    for (const m of members) {
      if (m.hasAggroTarget?.targetId === state.target.id && m.hasAggroTarget.targetKind === state.target.kind) continue;
      const newlyAlerted = !m.hasAggroTarget;
      setAggroTarget(world, m, state.target, now);
      if (newlyAlerted) world.pushEvent(m.hasPosition.nodeId, {
        kind: "ecology-pulse", monsterId: m.isMonster.id,
        pos: { ...m.hasPosition.current }, pulse: "pack-call",
      });
    }
  }
}

function returnTogether(world: World, members: MonsterEntity[], state: Coordination, now: number): void {
  state.returning ??= { sinceMs: now };
  delete state.target;
  for (const m of members) {
    setAggroTarget(world, m, null, now);
    setAttackTarget(world, m, null);
    m.hasAwareness.state = "returning";
    markSliceDirty(world, m, "hasAwareness");
  }
}

/** Idle followers keep formation; combat positioning remains owned by their role. */
export function packFollowDestination(world: World, member: MonsterEntity): Vec2 | undefined {
  const state = member.inPack?.coordination;
  if (!state || state.target || state.returning || state.temporaryEncounter ||
      state.leaderId === member.isMonster.id || member.controlsMonster.holdPost ||
      member.controlsMonster.patrolOverride ||
      MONSTER_DATABASE.get(member.isMonster.monsterTypeId)?.patrol) return undefined;
  const leader = world.getMonsterEntity(state.leaderId);
  if (!leader || leader.hasPosition.nodeId !== member.hasPosition.nodeId) return undefined;
  const dx = member.controlsMonster.spawn.x - state.home.x;
  const dy = member.controlsMonster.spawn.y - state.home.y;
  const length = Math.hypot(dx, dy) || 1;
  const offset = Math.min(length, state.followRadius * 0.5);
  return { x: leader.hasPosition.current.x + dx / length * offset,
    y: leader.hasPosition.current.y + dy / length * offset };
}
