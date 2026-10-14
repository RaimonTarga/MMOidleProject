/**
 * Abilities fire only when something calls the engine: in the game, the class
 * runtimes; in tests, this helper. A test gives a player its abilities
 * (`giveAbilities`, keyed by player id, so a slices helper can do it before the
 * entity exists), then `fireAbilities` stands in for one tick of the retired
 * attunement loop: the rune fold runs first (as `World.tick` runs it), then each
 * live player fires its abilities through the kept engine API (`fireTechnique` /
 * `fireGuard`) — Techniques in order, skipping non-instant ones once one holds
 * the offensive channel, then Guards.
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

const given = new Map<string, readonly string[]>();

/** The abilities `fireAbilities` fires for this player id, in order. Replaces any earlier list. */
export function giveAbilities(playerId: string, abilityIds: readonly string[]): void {
  given.set(playerId, [...abilityIds]);
}

export function fireAbilities(world: World, now: number, options: FireTechniqueOptions = {}): void {
  updateRuneDerivedConfig(world, now);
  for (const player of world.livePlayers) {
    const ids = given.get(player.isPlayer.id) ?? [];
    let claimed = false;
    for (const id of ids) {
      const ability = ABILITY_DATABASE.get(id);
      if (ability?.slot !== "technique") continue;
      if (claimed && ability.shape !== "instant") continue;
      claimed = fireTechnique(world, player, id, now, options).claimed || claimed;
    }
    for (const id of ids) {
      if (ABILITY_DATABASE.get(id)?.slot !== "guard") continue;
      if (fireGuard(world, player, id)) break;
    }
  }
}
