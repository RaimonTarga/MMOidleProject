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

/*
 * REMOVED: the pack-alpha scatter (T1-T4 monster rework, locked).
 *
 * Killing a pack alpha used to remove every surviving follower from the world with
 * no rewards. Two problems: it was a hidden "you lose essence by killing the wrong
 * thing first" rule the player was never told about, and Desert's locked design
 * needs the opposite - its Controller/Dealer duo is a TARGET-PRIORITY exam, so
 * killing the Controller must leave the Dealer alive and hurting you rather than
 * making it evaporate. Removing it globally also makes Forest/Plains packs read as
 * plain packs. Every follower is now killable for full rewards.
 */

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
