import type { MonsterEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import {
  emitCombatEvent,
  makeCombatContext,
} from "../engine/combatPipeline";

export function emitPlayerMonsterOnKill(
  world: World,
  playerId: string,
  monster: MonsterEntity,
  damage: number,
  sourceKind: string,
): void {
  const player = world.getPlayerEntity(playerId);
  if (!player) return;

  const ctx = makeCombatContext(player, "player", monster, "monster");
  ctx.damage = Math.max(0, Math.round(damage));
  ctx.metadata["killSource"] = sourceKind;
  emitCombatEvent("onKill", ctx, world);
}
