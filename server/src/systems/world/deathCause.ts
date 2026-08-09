import { MONSTER_DATABASE } from "@mmo-idle/shared";
import type {
  DeathCause,
  DeathKiller,
  PlayerDeathPayload,
} from "@mmo-idle/shared";
import type { MonsterEntity, PlayerEntity } from "../../ecs/entity";
import type { World } from "../../world/World";

export function buildKillerFromMonster(m: MonsterEntity): DeathKiller {
  const def = MONSTER_DATABASE.get(m.isMonster.monsterTypeId);
  return {
    monsterEntityId: m.isMonster.id,
    monsterTypeId: m.isMonster.monsterTypeId,
    monsterName: m.isMonster.name,
    isBoss: def?.isBoss ?? m.isMonster.isBoss ?? false,
    nodeId: m.hasPosition.nodeId,
  };
}

export function buildKillerFromStoredStrings(
  typeId: string | undefined,
  name: string | undefined,
  nodeId: string,
  isBoss: boolean,
  entityId?: string,
): DeathKiller | undefined {
  if (!typeId || !name) return undefined;
  return {
    monsterEntityId: entityId,
    monsterTypeId: typeId,
    monsterName: name,
    isBoss,
    nodeId,
  };
}

export function buildKillerFromSourceId(
  world: World,
  sourceId: string,
  fallbackNodeId: string,
): DeathKiller {
  const monster = world.getMonsterEntity(sourceId);
  if (monster) return buildKillerFromMonster(monster);

  return {
    monsterTypeId: "unknown",
    monsterName: "Unknown",
    isBoss: false,
    nodeId: fallbackNodeId,
  };
}

export function buildPlayerDeathPayload(
  player: PlayerEntity,
  cause: DeathCause,
  graveFrame: number,
): PlayerDeathPayload {
  const diedAtNodeId =
    cause.kind === "debt"
      ? cause.nodeId
      : (cause.kind === "stance" ? player.hasPosition.nodeId : cause.killer.nodeId);
  return {
    cause,
    diedAtNodeId,
    graveFrame,
    deathPos: { ...player.hasPosition.current },
  };
}

export function readDebtKillerFromStrings(
  strings: Record<string, string>,
  fallbackNodeId: string,
): DeathKiller | undefined {
  return buildKillerFromStoredStrings(
    strings["debtSourceTypeId"],
    strings["debtSourceName"],
    strings["debtSourceNodeId"] ?? fallbackNodeId,
    strings["debtSourceIsBoss"] === "1",
    strings["debtSourceEntityId"],
  );
}
