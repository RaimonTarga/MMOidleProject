/**
 * Abilities have no built-in trigger: they auto-fire only through `use-ability`
 * Rune rules, which the rune fold resolves each tick. Tests that drive
 * `updateAbilityFiring` directly use these to wire the reference timing and run
 * the fold first, exactly as `World.tick` does.
 */
import { withReferenceAbilityWiring } from "@mmo-idle/shared";
import type { PlayerEntity } from "../../src/ecs/entity";
import type { World } from "../../src/world/World";
import { updateRuneDerivedConfig } from "../../src/systems/combat/ai/runeConfig";
import { updateAbilityFiring } from "../../src/systems/player/abilities/abilityFiring";

/** Equip each attuned ability's reference rule unless a rule already names it. */
export function wireReferenceAbilities(player: PlayerEntity): void {
  const progression = player.tracksProgression;
  progression.runesEquipped = withReferenceAbilityWiring(
    progression.runesEquipped,
    progression.attunedAbilities,
  );
}

/** Rune fold, then the ability driver — the order `World.tick` runs them in. */
export function fireAbilities(world: World, now: number): void {
  updateRuneDerivedConfig(world, now);
  updateAbilityFiring(world, now);
}

/**
 * Wire every live player's reference rules, then fold and fire. The drop-in for
 * tests written against the retired built-in triggers: an ability a test already
 * wires keeps only its own rules, which is how custom rules used to suppress the
 * default.
 */
export function fireWithReferenceWiring(world: World, now: number): void {
  for (const player of world.livePlayers) wireReferenceAbilities(player);
  fireAbilities(world, now);
}
