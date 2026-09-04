/** Shared handoff from an offensive Technique execution into its hit rider. */
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { attachComponent } from "../../../ecs/markerHelpers";
import { beginFormationTechnique } from "../../classes/archetypes/summoner/formationTechnique";

/**
 * Conduit Techniques belong to the current summon formation; every other player
 * carries the ordinary one-hit marker until their next landed attack.
 */
export function armTechnique(
  world: World,
  player: PlayerEntity,
  abilityId: string,
): void {
  if (player.summonsMinions && beginFormationTechnique(world, player, abilityId)) return;
  // A Conduit with no living summons keeps the legacy armed marker. The first
  // reconstructed summon hit can convert it instead of silently wasting it.
  attachComponent(world, player, "hasArmedAbility", { abilityId });
}
