/**
 * Break Free's control gate: it fires only while something holds the player
 * (hard control, or a status-owned root), and breaks it.
 */
import { LAIR_DRAG_ROOT_EFFECT_ID, applyStatusEffect, getCooldown, getStatusEffect } from "@mmo-idle/shared";
import { applyStun } from "../src/systems/combat/status/stun";
import { isHardControlled } from "../src/systems/combat/status/playerHardControl";
import { abilityCooldownKey } from "../src/systems/player/abilities/abilityCooldowns";
import { World } from "../src/world/World";
import { fireAbilities } from "./fixtures/fireAbilities";
import { gameplayPlayerSlices } from "./fixtures/gameplayPlayer";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// ── Break Free on a stun ─────────────────────────────────────────────────────
{
  const world = new World();
  const slices = gameplayPlayerSlices("controlled-player");
  slices.tracksProgression.playerTier = 3;
  slices.tracksProgression.knownAbilities = ["break-free"];
  slices.tracksProgression.attunedAbilities = { techniques: [], guards: ["break-free"] };
  const player = world.attachPlayerEntity(slices, "controlled-player");
  player.usesAutocombat.auto = true;

  fireAbilities(world, 1_000);
  assert(getCooldown(player.tracksCombat, abilityCooldownKey("break-free")) === 0, "Break Free must not fire while free");

  assert(applyStun(player.tracksCombat, 3_000, "test-source"), "stun fixture");
  fireAbilities(world, 1_100);
  assert(getCooldown(player.tracksCombat, abilityCooldownKey("break-free")) > 0, "Break Free must fire while stunned");
  assert(!isHardControlled(player.tracksCombat), "Break Free must remove the stun");
}

// ── A root (the lair drag's speed-0 status) is control too, and Break Free breaks it
{
  const world = new World();
  const slices = gameplayPlayerSlices("rooted-player");
  slices.tracksProgression.playerTier = 3;
  slices.tracksProgression.knownAbilities = ["break-free"];
  slices.tracksProgression.attunedAbilities = { techniques: [], guards: ["break-free"] };
  const player = world.attachPlayerEntity(slices, "rooted-player");
  player.usesAutocombat.auto = true;
  applyStatusEffect(player.tracksCombat, {
    id: LAIR_DRAG_ROOT_EFFECT_ID, maxStacks: 1, remainingMs: 3_000, refreshable: true,
    sourceId: "test-lurker", data: { speedMult: 0, totalMs: 3_000 },
  });
  assert(!isHardControlled(player.tracksCombat), "a root is not hard control");
  fireAbilities(world, 1_100);
  assert(getCooldown(player.tracksCombat, abilityCooldownKey("break-free")) > 0, "Break Free must fire on a root");
  assert(!getStatusEffect(player.tracksCombat, LAIR_DRAG_ROOT_EFFECT_ID), "Break Free must remove the root");
}

console.log("abilityBreakFreeControl: ok");
