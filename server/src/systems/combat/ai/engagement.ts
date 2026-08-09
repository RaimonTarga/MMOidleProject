import { GAME_CONFIG } from "@mmo-idle/shared";
import { attachComponent, detachComponent } from "../../../ecs/markerHelpers";
import type { PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { applyCombatEndRites, combatExitDelay } from "../../player/rites/riteOoc";

export type PlayerCombatPhase = "ACTIVE" | "POST_COMBAT" | "OUT_OF_COMBAT";

export function markEngaged(world: World, player: PlayerEntity, now: number): void {
  attachComponent(world, player, "tracksEngagement", now);
}

export function clearEngagement(world: World, player: PlayerEntity): void {
  detachComponent(world, player, "tracksEngagement");
}

export function isPlayerActivelyInCombat(world: World, player: PlayerEntity): boolean {
  const targetId = player.hasAttackTarget?.targetId;
  if (targetId && world.hasMonster(targetId)) return true;
  for (const monster of world.aggroedMonsters) {
    if (monster.hasAggroTarget.targetKind === "player" && monster.hasAggroTarget.targetId === player.isPlayer.id) return true;
  }
  return false;
}

export function playerCombatPhase(world: World, player: PlayerEntity, now: number): PlayerCombatPhase {
  if (isPlayerActivelyInCombat(world, player)) return "ACTIVE";
  const last = player.tracksEngagement;
  if (last === undefined) return "OUT_OF_COMBAT";
  return now - last < combatExitDelay(player, GAME_CONFIG.COMBAT_REGEN_DELAY)
    ? "POST_COMBAT"
    : "OUT_OF_COMBAT";
}

export function isPlayerInCombat(player: PlayerEntity, now: number): boolean {
  if (player.hasAttackTarget !== undefined) return true;
  const last = player.tracksEngagement;
  return last !== undefined && now - last < combatExitDelay(player, GAME_CONFIG.COMBAT_REGEN_DELAY);
}

/** Finalize combat boundaries once, after combat resolution has updated targets. */
export function updateCombatTransitions(world: World, now: number): void {
  for (const player of world.livePlayers) {
    if (player.tracksEngagement === undefined) continue;
    if (playerCombatPhase(world, player, now) !== "OUT_OF_COMBAT") continue;
    applyCombatEndRites(world, player);
    clearEngagement(world, player);
  }
}
