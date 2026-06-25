import { distanceSq, MONSTER_DATABASE } from "@mmo-idle/shared";
import type { MonsterEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { setAggroTarget } from "./targeting";

/**
 * Pack coordination. Runs BEFORE `updateMonsters` and only sets aggro INTENT —
 * `updateMonsters` stays the single executor for movement/attack/leash. Each tick
 * we group living pack members by their shared `packId` and, if any member holds a
 * target, alert un-aggroed mates that are within `callRange` of an already-aggroed
 * member onto that same target (assist / call-allies). The alert is leash-guarded so
 * a follower dragged far from its spawn is not immediately re-pulled into an
 * oscillation against the leash drop.
 *
 * Deterministic: every decision derives from positions + aggro state, no RNG.
 */
export function updatePacks(world: World, now: number): void {
  const groups = new Map<string, MonsterEntity[]>();
  for (const e of world.monsterEntities) {
    const ip = e.inPack;
    if (!ip) continue;
    const g = groups.get(ip.packId);
    if (g) g.push(e);
    else groups.set(ip.packId, [e]);
  }

  for (const members of groups.values()) {
    if (members.length < 2) continue;

    // Shared target: any member's current aggro target. (Alpha or follower —
    // whoever engaged first leads.)
    const lead = members.find((m) => m.hasAggroTarget !== undefined)
      ?.hasAggroTarget;
    if (!lead) continue;

    const target = { id: lead.targetId, kind: lead.targetKind };
    for (const m of members) {
      if (m.hasAggroTarget) continue;
      const callRange = MONSTER_DATABASE.get(m.isMonster.monsterTypeId)?.pack
        ?.callRange ?? 0;
      if (callRange <= 0) continue;
      if (!nearAggroedMate(m, members, callRange)) continue;
      // Skip if alerting would put it past its own leash (it would just drop again).
      const ai = m.controlsMonster;
      if (
        distanceSq(m.hasPosition.current, ai.spawn) >
        ai.leashRange * ai.leashRange
      ) {
        continue;
      }
      setAggroTarget(world, m, target, now);
      // Telegraph the call-allies moment: a one-shot pulse at the newly-alerted mob.
      // Naturally edge-triggered — m now holds a target, so it's skipped next tick.
      world.pushEvent(m.hasPosition.nodeId, {
        kind: "ecology-pulse",
        monsterId: m.isMonster.id,
        pos: { ...m.hasPosition.current },
        pulse: "pack-call",
      });
    }
  }
}

/**
 * Called when a pack alpha dies. Removes all surviving followers from the world
 * without granting rewards — they scatter rather than being killed.
 */
export function onPackAlphaDead(world: World, alpha: MonsterEntity): void {
  const packId = alpha.inPack?.packId;
  if (!packId) return;
  const toRemove: string[] = [];
  for (const e of world.monsterEntities) {
    const ip = e.inPack;
    if (ip?.packId === packId && ip.role !== "alpha") {
      toRemove.push(e.isMonster.id);
    }
  }
  for (const id of toRemove) {
    if (world.hasMonster(id)) world.removeMonsterEntity(id);
  }
}

function nearAggroedMate(
  m: MonsterEntity,
  members: MonsterEntity[],
  callRange: number,
): boolean {
  const r2 = callRange * callRange;
  const nodeId = m.hasPosition.nodeId;
  for (const other of members) {
    if (other === m || !other.hasAggroTarget) continue;
    if (other.hasPosition.nodeId !== nodeId) continue;
    if (distanceSq(other.hasPosition.current, m.hasPosition.current) <= r2) {
      return true;
    }
  }
  return false;
}
