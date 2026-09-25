/**
 * Wiring smoke test for the `When Controlled` and `Enemy in Contact` rune
 * conditions, and for the abilities that default to them (Break Free, Disengage).
 */
import { getCooldown, referenceAbilityRule } from "@mmo-idle/shared";
import { setAggroTarget } from "../src/systems/combat/ai/targeting";
import { getAbilityRuneTargets, updateRuneDerivedConfig } from "../src/systems/combat/ai/runeConfig";
import { applyStun } from "../src/systems/combat/status/stun";
import { isHardControlled } from "../src/systems/combat/status/playerHardControl";
import { abilityCooldownKey } from "../src/systems/player/abilities/abilityCooldowns";
import { World } from "../src/world/World";
import { fireAbilities, wireReferenceAbilities } from "./fixtures/abilityWiring";
import { gameplayPlayerSlices } from "./fixtures/gameplayPlayer";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(referenceAbilityRule("break-free")?.conditionId === "controlled", "Break Free defaults to When Controlled");
assert(referenceAbilityRule("disengage")?.conditionId === "enemy-contact", "Disengage defaults to Enemy in Contact");

// ── When Controlled -> Break Free ────────────────────────────────────────────
{
  const world = new World();
  const slices = gameplayPlayerSlices("controlled-player");
  slices.tracksProgression.playerTier = 3;
  slices.tracksProgression.knownAbilities = ["break-free"];
  slices.tracksProgression.attunedAbilities = { techniques: [], guards: ["break-free"] };
  const player = world.attachPlayerEntity(slices, "controlled-player");
  player.usesAutocombat.auto = true;
  wireReferenceAbilities(player);

  updateRuneDerivedConfig(world, 1_000);
  assert(!getAbilityRuneTargets(player).includes("break-free"), "When Controlled must be false while free");

  assert(applyStun(player.tracksCombat, 3_000, "test-source"), "stun fixture");
  fireAbilities(world, 1_100);
  assert(getCooldown(player.tracksCombat, abilityCooldownKey("break-free")) > 0, "Break Free must fire through its When Controlled rule");
  assert(!isHardControlled(player.tracksCombat), "Break Free must remove the stun");
}

// ── Enemy in Contact -> Disengage ────────────────────────────────────────────
{
  const world = new World();
  const slices = gameplayPlayerSlices("contact-player");
  slices.tracksProgression.playerTier = 4;
  slices.tracksProgression.knownAbilities = ["disengage"];
  slices.tracksProgression.attunedAbilities = { techniques: ["disengage"], guards: [] };
  const player = world.attachPlayerEntity(slices, "contact-player");
  player.usesAutocombat.auto = true;
  wireReferenceAbilities(player);
  const playerId = { id: player.isPlayer.id, kind: "player" as const };

  // A ranged enemy targeting you from its standoff range is not contact.
  const shooter = world.createMonster("node-5-5", "cave-gargoyle", { x: 560, y: 400 });
  assert(shooter, "ranged monster fixture");
  setAggroTarget(world, shooter, playerId, 1_000);
  updateRuneDerivedConfig(world, 1_000);
  assert(!getAbilityRuneTargets(player).includes("disengage"), "a ranged attacker must not count as contact");

  // A melee enemy far away is not contact either.
  const hare = world.createMonster("node-5-5", "plains-slime", { x: 700, y: 400 });
  assert(hare, "melee monster fixture");
  setAggroTarget(world, hare, playerId, 1_000);
  updateRuneDerivedConfig(world, 1_000);
  assert(!getAbilityRuneTargets(player).includes("disengage"), "a distant melee attacker must not count as contact");

  // In reach: contact, and Disengage fires.
  hare.hasPosition.current = { x: 425, y: 400 };
  fireAbilities(world, 1_100);
  assert(getCooldown(player.tracksCombat, abilityCooldownKey("disengage")) > 0, "Disengage must fire through its Enemy in Contact rule");
}

console.log("runeControlContact: ok");
