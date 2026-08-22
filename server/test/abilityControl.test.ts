/**
 * The control ladder, end to end.
 *
 * Slow / root / stun are three STRUCTURALLY different effects, not three
 * strengths of one status, and the whole roster leans on that: Hamstring is a
 * cheap low-cooldown Technique because it only degrades movement, Stunning
 * Strike is an expensive cast because it takes actions away. This asserts the
 * distinction actually exists at runtime rather than only in the design doc.
 *
 * Also covers the reconciler that owns a slowed monster's stats — chill, freeze
 * and an ability slow all write the same two fields, and the failure mode when
 * two writers each cache "the clean base" is a cooldown that ratchets toward
 * zero over a few ticks, which no single-tick test would catch.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/abilityControl.test.ts
 */
import {
  ABILITY_ROOT_EFFECT_ID,
  ABILITY_SLOW_EFFECT_ID,
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { updateCombatState } from "../src/systems/combat/engine/combatState";
import { runPlayerAttack } from "../src/systems/combat/engine/combat";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import {
  applyMonsterRoot,
  applyMonsterSlow,
  updateMonsterSlows,
} from "../src/systems/combat/status/monsterControl";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(id: string, abilities: string[]): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Controller" },
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
      playerTier: 4,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [...abilities],
      equippedAbilities: { techniques: [...abilities], guards: [] },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: null,
    },
  };
}

initCombatSystems();

// ── 1. Hamstring: movement degraded, actions untouched ───────────────────────

{
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("hamstring-player", ["hamstring"]),
    "hamstring-player",
  );
  const target = world.createMonster("node-5-5", "plains-slime", { x: 410, y: 400 });
  if (!target) throw new Error("failed to create target");
  setAttackTarget(world, player, target.isMonster.id);

  const def = MONSTER_DATABASE.get(target.isMonster.monsterTypeId)!;
  const baseSpeed = def.stats.speed;

  updateAbilityFiring(world, Date.now());
  assert(
    player.hasArmedAbility?.abilityId === "hamstring",
    "Hamstring should arm the next attack",
  );

  runPlayerAttack(world, player, target, 1_000, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: "player" },
  });

  const slow = getStatusEffect(target.tracksCombat, ABILITY_SLOW_EFFECT_ID);
  assert(!!slow, "a landed Hamstring should apply the slow");
  assert(target.hasAbilitySlow !== undefined, "the slow marker must be attached");

  updateMonsterSlows(world);
  assert(
    target.hasPosition.speed < baseSpeed,
    `slow should cut the monster's speed (${target.hasPosition.speed} vs ${baseSpeed})`,
  );
  // The rung's whole identity: it is still allowed to fight back.
  assert(target.isRooted === undefined, "a SLOW must never root the target");
  assert(target.cannotAttack === undefined, "a SLOW must never stop the target attacking");

  // Reconciling twice in a row must not compound: absolute writes from the
  // database are what make repeated application safe.
  const afterOne = target.hasPosition.speed;
  updateMonsterSlows(world);
  assert(
    target.hasPosition.speed === afterOne,
    "repeated reconciliation must not ratchet the slow deeper",
  );

  // And it must fully restore once the window lapses.
  updateCombatState(world, slow!.remainingMs + 100);
  updateMonsterSlows(world);
  assert(
    target.hasPosition.speed === baseSpeed,
    `speed should return to base once the slow expires (${target.hasPosition.speed} vs ${baseSpeed})`,
  );
  assert(target.hasAbilitySlow === undefined, "the slow marker must clear with the effect");
}

// ── 2. Binding Strike: movement stopped, actions still allowed ───────────────

{
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("binding-player", ["binding-strike"]),
    "binding-player",
  );
  const target = world.createMonster("node-5-5", "plains-slime", { x: 410, y: 400 });
  if (!target) throw new Error("failed to create target");
  setAttackTarget(world, player, target.isMonster.id);

  updateAbilityFiring(world, Date.now());
  runPlayerAttack(world, player, target, 1_000, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: "player" },
  });

  const root = getStatusEffect(target.tracksCombat, ABILITY_ROOT_EFFECT_ID);
  assert(!!root, "a landed Binding Strike should apply the root");
  assert(target.isRooted !== undefined, "root must stop the target moving");
  // This is what separates root from stun. Collapsing the two would delete a
  // whole rung of the ladder.
  assert(target.cannotAttack === undefined, "a ROOT must not stop the target attacking");

  updateCombatState(world, root!.remainingMs + 100);
  updateMonsterSlows(world);
  assert(target.isRooted === undefined, "root must lift when its effect expires");
  assert(target.hasAbilityRoot === undefined, "the root marker must clear with the effect");
}

// ── 3. One writer for slowed stats ───────────────────────────────────────────
// Two sources on one monster take the STRONGEST per axis, never the sum: adding
// a 45% chill to a 50% Hamstring would pin the target in place, and "pinned in
// place" is root — a different rung with a different cost.

{
  const world = new World();
  const target = world.createMonster("node-5-5", "plains-slime", { x: 500, y: 400 });
  if (!target) throw new Error("failed to create target");
  const base = MONSTER_DATABASE.get(target.isMonster.monsterTypeId)!.stats.speed;

  applyMonsterSlow(world, target, 0.5, 4000, "tester");
  updateMonsterSlows(world);
  const halfSpeed = target.hasPosition.speed;
  assert(halfSpeed === Math.max(10, Math.round(base * 0.5)), "50% slow halves speed");

  // A weaker second source must not deepen it, and must not be added on top.
  applyMonsterSlow(world, target, 0.2, 4000, "tester");
  updateMonsterSlows(world);
  assert(
    target.hasPosition.speed === halfSpeed,
    "a weaker slow refreshing the same source must not change the magnitude",
  );

  // A slow can never become a silent root.
  applyMonsterSlow(world, target, 5, 4000, "tester");
  updateMonsterSlows(world);
  assert(target.hasPosition.speed >= 10, "a slow must leave the monster able to move at all");
  assert(target.isRooted === undefined, "an extreme slow is still not a root");
}

// ── 4. A boss-owned root is not stolen by an ability root expiring ───────────

{
  const world = new World();
  const target = world.createMonster("node-5-5", "plains-slime", { x: 500, y: 400 });
  if (!target) throw new Error("failed to create target");

  // Something else roots it first and owns that root.
  target.isRooted = {};
  applyMonsterRoot(world, target, 500, "tester");
  updateCombatState(world, 800);
  updateMonsterSlows(world);
  assert(
    target.isRooted !== undefined,
    "an expiring ability root must not clear a root it did not install",
  );
}

console.log("abilityControl: ok");
