import {
  distanceSq,
  MONSTER_DATABASE,
  type MonsterTargetingMode,
} from "@mmo-idle/shared";
import type {
  MinionEntity,
  MonsterEntity,
  PlayerEntity,
} from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { playerDetectionMult } from "../../world/mobility/mobilityBoots";

export type MonsterAggroCandidate =
  | { kind: "player"; entity: PlayerEntity }
  | { kind: "minion"; entity: MinionEntity };

interface ScoredCandidate {
  candidate: MonsterAggroCandidate;
  distSq: number;
  hpPct: number;
}

export function monsterIgnoresTaunts(monster: MonsterEntity): boolean {
  return (
    MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.targeting
      ?.ignoresTaunts === true
  );
}

export function selectMonsterAggroCandidate(
  world: World,
  monster: MonsterEntity,
): MonsterAggroCandidate | null {
  const targeting = MONSTER_DATABASE.get(
    monster.isMonster.monsterTypeId,
  )?.targeting;
  let candidates = candidatesInPullRange(world, monster);

  // ANTI-BODY-BLOCK (`targeting.prefersPlayers`). A wall of summons standing between
  // a boss and its owner used to win the positioning argument outright, which is why
  // every slow boss carried an anti-summon cleave. Drop the minions from the pool
  // whenever a player is in reach instead; the minions are still legal targets when
  // the player genuinely is not.
  if (targeting?.prefersPlayers) {
    const players = candidates.filter((c) => c.candidate.kind === "player");
    if (players.length > 0) candidates = players;
  }

  return bestCandidate(candidates, targeting?.mode ?? "closest")?.candidate ?? null;
}

function candidatesInPullRange(
  world: World,
  monster: MonsterEntity,
): ScoredCandidate[] {
  const pullRange = monster.hasAwareness.pullRange;
  const pullSq = pullRange * pullRange;
  const nodeId = monster.hasPosition.nodeId;
  const monsterPos = monster.hasPosition.current;
  const candidates: ScoredCandidate[] = [];

  for (const player of world.livePlayersInNode(nodeId)) {
    const effPull = pullRange * playerDetectionMult(player);
    const distSqToPlayer = distanceSq(player.hasPosition.current, monsterPos);
    if (distSqToPlayer >= effPull * effPull) continue;
    candidates.push({
      candidate: { kind: "player", entity: player },
      distSq: distSqToPlayer,
      hpPct: player.hasHealth.hp / Math.max(1, player.hasHealth.maxHp),
    });
  }

  for (const minion of world.minionEntitiesInNode(nodeId)) {
    if (minion.hasHealth.hp <= 0) continue;
    const distSqToMinion = distanceSq(minion.hasPosition.current, monsterPos);
    if (distSqToMinion >= pullSq) continue;
    candidates.push({
      candidate: { kind: "minion", entity: minion },
      distSq: distSqToMinion,
      hpPct: minion.hasHealth.hp / Math.max(1, minion.hasHealth.maxHp),
    });
  }

  return candidates;
}

function bestCandidate(
  candidates: ScoredCandidate[],
  mode: MonsterTargetingMode,
): ScoredCandidate | null {
  let best: ScoredCandidate | null = null;
  for (const candidate of candidates) {
    if (!best) {
      best = candidate;
      continue;
    }
    if (mode === "lowest-hp") {
      if (
        candidate.hpPct < best.hpPct ||
        (candidate.hpPct === best.hpPct && candidate.distSq < best.distSq)
      ) {
        best = candidate;
      }
      continue;
    }
    if (candidate.distSq < best.distSq) best = candidate;
  }
  return best;
}
