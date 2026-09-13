/**
 * The control ladder, end to end.
 *
 * Slow / root / stun are three STRUCTURALLY different effects, not three
 * strengths of one status, and the whole roster leans on that: Hamstring is a
 * cheap low-cooldown Technique because it only degrades movement, Stunning
 * Strike is an expensive cast because it takes actions away. This asserts the
 * distinction actually exists at runtime rather than only in the design doc.
 *
 * Covers composed slow multipliers, actual movement, authored stat preservation,
 * overlapping root ownership, and the movement tick preceding stunned AI.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/abilityControl.test.ts
 */
import {
  ABILITY_DATABASE,
  applyStatusEffect,
  ABILITY_ROOT_EFFECT_ID,
  ABILITY_SLOW_EFFECT_ID,
  GAME_CONFIG,
  composeMonsterView,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { updateCombatState } from "../src/systems/combat/engine/combatState";
import { runMonsterAttack, runPlayerAttack } from "../src/systems/combat/engine/combat";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import {
  applyMonsterRoot,
  applyMonsterSlow,
  updateMonsterSlows,
} from "../src/systems/combat/status/monsterControl";
import { setEntityMotion, updateMovement } from "../src/systems/world/movement";
import { hasIndependentRoot, setRooted } from "../src/systems/world/rooted";
import { resolveCastPayload } from "../src/systems/player/abilities/abilityEffects";
import { monsterAttackCooldown } from "../src/systems/combat/engine/monsterMechanics";
import { updateMonsters } from "../src/systems/combat/ai/ai";
import { attachMarker } from "../src/ecs/markerHelpers";
import { CHILL_EFFECT } from "../src/systems/classes/archetypes/dot/t3/core/constants";
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
      attunedAbilities: { techniques: [...abilities], guards: [] },
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
  player.usesAutocombat.auto = true;
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
    composeMonsterView(target).speed < baseSpeed,
    `slow should cut the monster's speed (${composeMonsterView(target).speed} vs ${baseSpeed})`,
  );
  // The rung's whole identity: it is still allowed to fight back.
  assert(target.isRooted === undefined, "a SLOW must never root the target");
  assert(target.cannotAttack === undefined, "a SLOW must never stop the target attacking");
  assert(runMonsterAttack(world, target, player, 1100) !== "cancelled",
    "a slowed monster can still land an attack");

  // Reconciling twice in a row must not compound the multiplier.
  const afterOne = composeMonsterView(target).speed;
  updateMonsterSlows(world);
  assert(
    composeMonsterView(target).speed === afterOne,
    "repeated reconciliation must not ratchet the slow deeper",
  );

  // And it must fully restore once the window lapses.
  updateCombatState(world, slow!.remainingMs + 100);
  updateMonsterSlows(world);
  assert(
    composeMonsterView(target).speed === baseSpeed,
    `speed should return to base once the slow expires (${composeMonsterView(target).speed} vs ${baseSpeed})`,
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
  player.usesAutocombat.auto = true;
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
  const rootedAt = { ...target.hasPosition.current };
  setEntityMotion(world, target, { x: 800, y: 400 });
  updateMovement(world, 100, 1100);
  assert(target.hasPosition.current.x === rootedAt.x && target.hasPosition.current.y === rootedAt.y,
    "Binding Strike blocks actual movement");
  assert(runMonsterAttack(world, target, player, 1100) !== "cancelled",
    "a rooted monster can still attack in reach");

  updateCombatState(world, root!.remainingMs + 100);
  updateMonsterSlows(world);
  assert(target.isRooted === undefined, "root must lift when its effect expires");
  assert(target.hasAbilityRoot === undefined, "the root marker must clear with the effect");
}

// ── 3. Strongest slow source ───────────────────────────────────────────
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
  const halfSpeed = composeMonsterView(target).speed;
  assert(halfSpeed === base * 0.5, "50% slow halves speed");

  // A weaker second source must not deepen it, and must not be added on top.
  applyMonsterSlow(world, target, 0.2, 4000, "tester");
  updateMonsterSlows(world);
  assert(
    composeMonsterView(target).speed === halfSpeed,
    "a weaker slow refreshing the same source must not change the magnitude",
  );

  // A slow can never become a silent root.
  applyMonsterSlow(world, target, 5, 4000, "tester");
  updateMonsterSlows(world);
  assert(composeMonsterView(target).speed > 0, "a slow must leave the monster able to move at all");
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

// Slows must act on the current authored speed, survive AI writes, and agree
// with the renderer. Include a speed below the former hardcoded 10 px/s floor.
for (const speed of [0, 5, 200, 600]) {
  const world = new World();
  const target = world.createMonster("node-5-5", "plains-slime", { x: 400, y: 400 })!;
  target.controlsMonster.baseSpeed = speed;
  target.controlsMonster.idleUntil = Number.MAX_SAFE_INTEGER;
  target.hasPosition.speed = speed;
  target.performsAttack.attackCooldown = 777;
  applyMonsterSlow(world, target, 0.5, 4000, "tester");
  for (let tick = 0; tick < 3; tick++) {
    updateMonsterSlows(world);
    updateMonsters(world, 100, 1000 + tick * 100);
    const before = target.hasPosition.current.x;
    setEntityMotion(world, target, { x: before + 100, y: 400 });
    updateMovement(world, 100, 1000 + tick * 100);
    const moved = target.hasPosition.current.x - before;
    assert(Math.abs(moved - speed * 0.5 * 0.1) < 0.001,
      `slow must reduce actual movement at speed ${speed}: moved ${moved}`);
    assert(composeMonsterView(target).speed === speed * 0.5, "client speed agrees with movement");
    assert(target.hasPosition.speed === speed, "slow must not corrupt authored speed");
    assert(monsterAttackCooldown(target) === Math.round(777 * 1.5), "slow preserves authored cadence");
  }
  updateCombatState(world, 4100);
  updateMonsterSlows(world);
  assert(composeMonsterView(target).speed === speed, "expiry preserves custom speed");
  assert(monsterAttackCooldown(target) === 777, "expiry preserves custom cadence");
}

// First contact deliberately preloads a ready attack, including slowed cadence.
{
  const world = new World();
  world.attachPlayerEntity(makePlayerSlices("contact", []), "contact");
  const target = world.createMonster("node-5-5", "plains-slime", { x: 410, y: 400 })!;
  applyMonsterSlow(world, target, 0.5, 4000, "tester");
  updateMonsterSlows(world);
  updateMonsters(world, 100, 10000);
  assert(target.hasAwareness.state === "attacking", "monster enters attack range");
  assert(10000 - target.performsAttack.lastAttackAt >= monsterAttackCooldown(target),
    "first-contact preload uses effective cooldown");
}

// Independent sources combine by strongest axis and fall back after expiry.
{
  const world = new World();
  const target = world.createMonster("node-5-5", "plains-slime", { x: 400, y: 400 })!;
  applyMonsterSlow(world, target, 0.5, 500, "tester");
  applyStatusEffect(target.tracksCombat, {
    id: CHILL_EFFECT, maxStacks: 1, remainingMs: 2000, refreshable: true,
    data: { moveSlowPerStack: 0.3, attackSlowPerStack: 0.2, totalMs: 2000 },
  });
  attachMarker(world, target, "hasChill");
  updateMonsterSlows(world);
  assert(target.hasStatus.monsterMoveSpeedMult === 0.5, "strongest source wins");
  updateCombatState(world, 600);
  updateMonsterSlows(world);
  assert(target.hasStatus.monsterMoveSpeedMult === 0.7, "remaining chill survives Hamstring expiry");
}

// Root ownership survives either application order and either expiry order.
for (const abilityFirst of [false, true]) {
  for (const abilityEndsFirst of [false, true]) {
    const world = new World();
    const target = world.createMonster("node-5-5", "plains-slime", { x: 400, y: 400 })!;
    if (abilityFirst) applyMonsterRoot(world, target, 500, "tester");
    assert(!hasIndependentRoot(target), "script can own an ability-only root");
    setRooted(world, target, true);
    if (!abilityFirst) applyMonsterRoot(world, target, 500, "tester");
    if (abilityEndsFirst) {
      updateCombatState(world, 600);
      updateMonsterSlows(world);
      assert(!!target.isRooted, "ability expiry must preserve the scripted root");
      setRooted(world, target, false);
    } else {
      setRooted(world, target, false);
      assert(!!target.isRooted, "script release must preserve the ability root");
      updateCombatState(world, 600);
      updateMonsterSlows(world);
    }
    assert(!target.isRooted, "both owners ending must release the root");
  }
}

// Stunning Strike must halt an existing movement order before the next AI pass.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices("stunner", ["stunning-strike"]), "stunner");
  const target = world.createMonster("node-5-5", "plains-slime", { x: 410, y: 400 })!;
  target.hasHealth.hp = target.hasHealth.maxHp = 10000;
  setEntityMotion(world, target, { x: 800, y: 400 });
  resolveCastPayload(world, player, ABILITY_DATABASE.get("stunning-strike")!, target);
  assert(!!getStatusEffect(target.tracksCombat, "stunned"), "Stunning Strike lands its stun");
  const before = { ...target.hasPosition.current };
  updateMovement(world, 100, 1000);
  assert(target.hasPosition.current.x === before.x && target.hasPosition.current.y === before.y,
    "stun must block the movement tick before AI runs");
  assert(!target.isMoving, "stun clears stale motion");
  assert(runMonsterAttack(world, target, player, 1100) === "cancelled",
    "Stunning Strike blocks enemy attacks");
  updateCombatState(world, 1600);
  assert(runMonsterAttack(world, target, player, 2700) !== "cancelled",
    "enemy attacks resume after stun expiry");
}

console.log("abilityControl: ok");
