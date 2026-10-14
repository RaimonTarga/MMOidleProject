/**
 * Abilities fire only when something calls the engine: in the game, the class
 * runtimes; in tests, this helper. `fireAbilities` stands in for one tick of the
 * retired attunement loop: the rune fold runs first (as `World.tick` runs it),
 * then each live player fires its attuned abilities through the kept engine API
 * (`fireTechnique` / `fireGuard`) — Techniques in order, skipping non-instant
 * ones once one holds the offensive channel, then Guards.
 *
 * There is no Rune condition any more: an ability fires whenever its engine
 * gates allow it, in or out of combat.
 */
import { ABILITY_DATABASE } from "@mmo-idle/shared";
import type { World } from "../../src/world/World";
import { updateRuneDerivedConfig } from "../../src/systems/combat/ai/runeConfig";
import {
  fireGuard,
  fireTechnique,
  type FireTechniqueOptions,
} from "../../src/systems/player/abilities/abilityFiring";

export function fireAbilities(world: World, now: number, options: FireTechniqueOptions = {}): void {
  updateRuneDerivedConfig(world, now);
  for (const player of world.livePlayers) {
    const { techniques, guards } = player.tracksProgression.attunedAbilities;
    let claimed = false;
    for (const id of techniques) {
      if (claimed && ABILITY_DATABASE.get(id)?.shape !== "instant") continue;
      claimed = fireTechnique(world, player, id, now, options).claimed || claimed;
    }
    for (const id of guards) {
      if (fireGuard(world, player, id)) break;
    }
  }
}
