/** Focused wiring coverage for the Apprentice and Slinger Sweep adapters. */
import {
  ABILITY_SWEEP_FX,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { syncArchetypeSlices } from "../src/ecs/archetypeSliceSync";
import { updateReloadArchetype } from "../src/systems/classes/archetypes/reload/reloadPrototype";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { runPlayerAttack } from "../src/systems/combat/engine/combat";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import {
  SLINGER_SWEEP_CLIP_BUDGET_MULT,
} from "../src/systems/player/abilities/abilityEffects";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import { takeWorldLogEvents } from "../src/world/worldLog";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

type SweepArchetype = "dot" | "reload" | null;

function makePlayerSlices(id: string, archetype: SweepArchetype): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 1,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: ["sweep"],
      equippedAbilities: { techniques: ["sweep"], guards: [] },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: {
      inventory: [],
      equipment: emptyEquipment(),
      itemUpgrades: {},
    },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: "balanced",
      selectedRange: null,
      combatArchetype: archetype,
    },
  };
}

function createDurableMonster(world: World, x: number) {
  const monster = world.createMonster(
    "node-5-5",
    "plains-slime",
    { x, y: 400 },
  );
  if (!monster) throw new Error("failed to create Sweep target");
  monster.hasHealth.hp = 10_000;
  monster.hasHealth.maxHp = 10_000;
  monster.mitigatesDamage.plating = 0;
  monster.mitigatesDamage.damageReduction = 0;
  return monster;
}

function armSweep(world: World, playerId: string, targetId: string): void {
  const player = world.getPlayerEntity(playerId);
  if (!player) throw new Error("missing Sweep player");
  setAttackTarget(world, player, targetId);
  updateAbilityFiring(world, 1_000);
  assert(
    player.hasArmedAbility?.abilityId === "sweep",
    "Sweep should arm while the player is in combat",
  );
}

initCombatSystems();

// Apprentice: one real root DoT stack on each secondary; no generic direct cleave.
{
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("apprentice-sweep", "dot"),
    "apprentice-sweep",
  );
  syncArchetypeSlices(world, player);
  assert(!!player.appliesDots, "Apprentice fixture should attach AppliesDots");
  player.dealsDamage.attack = 100;

  const primary = createDurableMonster(world, 430);
  const secondary = createDurableMonster(world, 470);
  const outside = createDurableMonster(world, 800);
  const secondaryHpBefore = secondary.hasHealth.hp;

  armSweep(world, player.isPlayer.id, primary.isMonster.id);
  const outcome = runPlayerAttack(world, player, primary, 1_100, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: "player" },
  });
  assert(outcome === "hit", "Apprentice Sweep attack should land");
  assert(player.hasArmedAbility === undefined, "Apprentice Sweep should consume on hit");

  const primaryDot = getStatusEffect(primary.tracksCombat, "dot");
  const secondaryDot = getStatusEffect(secondary.tracksCombat, "dot");
  assert(primaryDot?.stacks === 1, "the primary should receive its normal DoT stack");
  assert(
    secondaryDot?.stacks === 1,
    "a valid secondary should receive exactly one Apprentice DoT stack",
  );
  assert(
    secondaryDot?.data.damagePerStack === primaryDot?.data.damagePerStack,
    "Sweep secondary stacks should use the authoritative class stack damage",
  );
  assert(
    secondary.hasHealth.hp === secondaryHpBefore,
    "Apprentice Sweep should not also deal the generic direct cleave",
  );
  assert(
    getStatusEffect(outside.tracksCombat, "dot") === undefined,
    "targets outside Sweep radius should receive no DoT stack",
  );

  const adapterEvents = takeWorldLogEvents(world, player.isPlayer.id).filter(
    (event) => event.kind === "technique-adapter",
  );
  assert(
    adapterEvents.length === 1
      && adapterEvents[0]?.adapter === "apprentice-sweep"
      && adapterEvents[0]?.event === "apprentice-secondary-target"
      && adapterEvents[0]?.stacksApplied === 1,
    "Apprentice Sweep should report exactly one secondary-target adapter event with a real stack count",
  );
}

// Other classes retain the existing one-hit direct cleave.
{
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("generic-sweep", null),
    "generic-sweep",
  );
  syncArchetypeSlices(world, player);
  player.dealsDamage.attack = 100;

  const primary = createDurableMonster(world, 430);
  const secondary = createDurableMonster(world, 470);
  const secondaryHpBefore = secondary.hasHealth.hp;

  armSweep(world, player.isPlayer.id, primary.isMonster.id);
  runPlayerAttack(world, player, primary, 1_100, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: "player" },
  });
  assert(
    secondaryHpBefore - secondary.hasHealth.hp === 60,
    "non-adapted classes should retain Sweep I's 60% direct cleave",
  );
}

function runSlingerClip(ammoMax: number): number {
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices(`slinger-sweep-${ammoMax}`, "reload"),
    `slinger-sweep-${ammoMax}`,
  );
  player.usesSkills.passives["reload.max-ammo"] = ammoMax;
  syncArchetypeSlices(world, player);
  updateReloadArchetype(world, 0);
  if (!player.usesReload) throw new Error("Slinger fixture should attach UsesReload");
  assert(player.usesReload.ammo === ammoMax, "Slinger fixture should start with a full clip");
  player.dealsDamage.attack = 100;

  const primary = createDurableMonster(world, 430);
  const secondary = createDurableMonster(world, 470);
  const secondaryHpBefore = secondary.hasHealth.hp;

  armSweep(world, player.isPlayer.id, primary.isMonster.id);
  for (let shot = 0; shot < ammoMax; shot++) {
    const outcome = runPlayerAttack(world, player, primary, 1_100 + shot, {
      attackOrigin: player.hasPosition.current,
      aggroSource: { id: player.isPlayer.id, kind: "player" },
    });
    assert(outcome === "hit", `Slinger Sweep shot ${shot + 1} should land`);
    if (shot === 0) {
      assert(player.hasArmedAbility === undefined, "Slinger Sweep charge should consume on the first shot");
      assert(!!player.hasSweepClip, "the first shot should activate the Sweep clip state");
      const hit = world
        .takeNodeEvents("node-5-5")
        .find((event) => event.kind === "player-hit");
      assert(
        !!hit && hit.kind === "player-hit" && hit.effects?.includes(ABILITY_SWEEP_FX),
        "a Sweep clip shot should carry the normal Sweep hit FX",
      );
    }
  }

  assert(player.usesReload.ammo === 0, "the Sweep clip should consume the full magazine");
  assert(player.usesReload.reloadingMs > 0, "emptying the Sweep clip should start reload");
  assert(player.hasSweepClip === undefined, "reload start should end the Sweep clip state");

  const adapterEvents = takeWorldLogEvents(world, player.isPlayer.id).filter(
    (event) => event.kind === "technique-adapter",
  );
  const created = adapterEvents.filter((event) => event.event === "slinger-clip-created");
  const shots = adapterEvents.filter((event) => event.event === "slinger-clip-shot");
  const splashes = adapterEvents.filter((event) => event.event === "slinger-splash-hit");
  assert(created.length === 1, "Slinger Sweep should report exactly one clip-created event per clip");
  assert(shots.length === ammoMax, `Slinger Sweep should report one clip-shot event per shot, got ${shots.length}`);
  const reportedSplashTotal = splashes.reduce((sum, event) => sum + (event.splashDamage ?? 0), 0);
  assert(
    reportedSplashTotal === secondaryHpBefore - secondary.hasHealth.hp,
    "reported splash damage should equal the real damage dealt",
  );

  return secondaryHpBefore - secondary.hasHealth.hp;
}

// Slinger: one 1.5-shot budget spread over the clip, invariant to magazine size.
const fourShotSplash = runSlingerClip(4);
const tenShotSplash = runSlingerClip(10);
const expectedClipSplash = Math.floor(
  100 * 0.6 * SLINGER_SWEEP_CLIP_BUDGET_MULT,
);
assert(
  fourShotSplash === expectedClipSplash,
  `four-shot Sweep clip should deal its normalized ${expectedClipSplash} damage budget`,
);
assert(
  tenShotSplash === expectedClipSplash,
  "larger magazine size must not increase total Sweep damage per clip",
);

console.log("abilitySweepAdapters.test.ts: ok");
