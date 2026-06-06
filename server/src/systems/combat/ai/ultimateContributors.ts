import type { MonsterEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";

/** Record a player as having contributed damage during an active ultimate fight. */
export function markUltimateContributor(
  _world: World,
  monster: MonsterEntity,
  playerId: string,
): void {
  if (monster.isMonster.monsterTypeId !== "void-overlord") return;
  if (!monster.scriptsUltimate?.engaged) return;
  const ids = monster.scriptsUltimate.contributorIds;
  if (!ids.includes(playerId)) ids.push(playerId);
}
