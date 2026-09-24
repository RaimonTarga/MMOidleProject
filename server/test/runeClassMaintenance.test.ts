import assert from "node:assert/strict";
import {
  ACTION_DATABASE, DEFAULT_AUTOCOMBAT_CONFIG, DEFAULT_RUNE_LOADOUT, GAME_CONFIG,
  STARTER_RUNE_IDS, RUNE_RECIPE_DATABASE, deriveAutoConfigFromRunes, emptyEquipment,
  getFlag, sanitizeRuneLoadout, type CombatArchetype, type RuneContext,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import { syncArchetypeSlices } from "../src/ecs/archetypeSliceSync";
import { updateAutoTargets } from "../src/systems/combat/ai/autoTarget";
import { markEngaged } from "../src/systems/combat/ai/engagement";
import { setAggroTarget, setAttackTarget } from "../src/systems/combat/ai/targeting";
import { RUNE_WAIT_FOR_SUMMONS_FLAG, updateRuneDerivedConfig } from "../src/systems/combat/ai/runeConfig";
import { updateReloadArchetype } from "../src/systems/classes/archetypes/reload/reloadPrototype";
import { updateCooldownArchetype } from "../src/systems/classes/archetypes/cooldown/cooldownPrototype";
import { updateSummonerArchetype } from "../src/systems/classes/archetypes/summoner/summonerPrototype";
import { driveMinion } from "../src/systems/classes/archetypes/summoner/ai";
import { setEntityMotion } from "../src/systems/world/movement";
import { updateAutoIntent } from "../src/systems/world/autoIntent";
import { craftRuneRecipe } from "../src/systems/player/economy/runeCrafting";

function makeReloadPlayerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP / 2,
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
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      attunedAbilities: { technique: null, guard: null },
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
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: "reload",
    },
  };
}

const actions = [
  ["tactical-reload", "reload", "tacticalReload"],
  ["wait-for-execution", "cooldown", "waitForExecution"],
  ["wait-for-summons", "summoner", "waitForSummons"],
] as const;
for (const [actionId, archetype, result] of actions) {
  const rule = { conditionId: "always", actionId };
  assert(STARTER_RUNE_IDS.includes(actionId));
  assert(!DEFAULT_RUNE_LOADOUT.some(r => r.actionId === actionId));
  assert.equal(ACTION_DATABASE.get(actionId)?.cost, 1);
  const ctx: RuneContext = { hpPct: 1, inCombat: true, activelyEngaged: false, inParty: false, aggroCount: 0, combatArchetype: archetype };
  assert(deriveAutoConfigFromRunes([rule], ctx)[result], `${actionId}: Always holds during grace`);
  assert(!deriveAutoConfigFromRunes([rule], { ...ctx, activelyEngaged: true, aggroCount: 1 })[result]);
  const idle = { ...rule, conditionId: "when-idle" };
  assert(!deriveAutoConfigFromRunes([idle], ctx)[result]);
  assert(deriveAutoConfigFromRunes([idle], { ...ctx, inCombat: false })[result]);
  assert.equal(sanitizeRuneLoadout([rule], new Set(STARTER_RUNE_IDS), 100, "cadence").length, 0);
  assert.equal(sanitizeRuneLoadout([rule], new Set(STARTER_RUNE_IDS), 100, archetype).length, 1);
  const composed = deriveAutoConfigFromRunes([rule, { conditionId: "always", actionId: "wait-for-regen" }, { conditionId: "always", actionId: "wait-it-out" }], ctx);
  assert(composed[result] && composed.waitForRegen && composed.waitItOut);
}

function scenario(archetype: CombatArchetype, actionId: string) {
  const world = new World();
  world.suppressRepopulation = true;
  const saved = makeReloadPlayerSlices(`class-${archetype}`);
  saved.usesSkills.combatArchetype = archetype;
  // Simulate an existing save without ownership of the newly baseline runes.
  saved.tracksProgression.runesOwned = [];
  const player = world.attachPlayerEntity(saved, saved.isPlayer.id);
  syncArchetypeSlices(world, player);
  assert(player.tracksProgression.runesOwned.includes(actionId));
  assert.equal(player.tracksProgression.runesEquipped.length, 0);
  Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true, focusLeaderTarget: false });
  player.tracksProgression.runesEquipped = [{ conditionId: "always", actionId }];
  markEngaged(world, player, 1000);
  return { world, player };
}

{
  const { world, player } = scenario("reload", "tactical-reload");
  player.usesReload!.ammoMax = 10;
  player.usesReload!.ammo = 5;
  for (const id of ["rune-recipe-reload-safely", "rune-recipe-ready-execution"]) {
    assert(RUNE_RECIPE_DATABASE.get(id)?.deprecated);
    const before = { ...player.tracksProgression.essences };
    assert(!craftRuneRecipe(world, player, id).success);
    assert.deepEqual(player.tracksProgression.essences, before);
  }
  updateRuneDerivedConfig(world, 1100);
  setEntityMotion(world, player, { x: 800, y: 400 });
  updateAutoTargets(world, 1100);
  assert(!player.isMoving, "partial magazine holds even before reload starts");
  updateReloadArchetype(world, 100);
  assert(player.usesReload!.reloadingMs > 0);
  updateReloadArchetype(world, 10000);
  assert.equal(player.usesReload!.ammo, player.usesReload!.ammoMax);
  world.createMonster("node-5-5", "plains-slime", { x: 800, y: 400 });
  updateRuneDerivedConfig(world, 1200);
  updateAutoTargets(world, 1200);
  assert(player.isMoving, "full magazine releases hold");
}
{
  const { world, player } = scenario("cooldown", "wait-for-execution");
  updateCooldownArchetype(world, 0);
  updateRuneDerivedConfig(world, 1100);
  setEntityMotion(world, player, { x: 800, y: 400 });
  updateAutoTargets(world, 1100);
  assert(!player.isMoving, "Squire holds during grace until ready");
  updateCooldownArchetype(world, 10000);
  assert(player.hasEmpoweredAttack);
  world.createMonster("node-5-5", "plains-slime", { x: 800, y: 400 });
  updateAutoTargets(world, 1200);
  assert(player.isMoving, "ready execution releases hold");
}
{
  const { world, player } = scenario("summoner", "wait-for-summons");
  updateSummonerArchetype(world, 0, 1000);
  const summons = player.summonsMinions!;
  const first = world.getMinionEntity(summons.minionIds[0]!)!;
  assert(first);
  first.hasHealth.hp = 1;
  updateRuneDerivedConfig(world, 1100);
  assert(!getFlag(player.tracksCombat, RUNE_WAIT_FOR_SUMMONS_FLAG), "injured living summons never hold");
  first.hasHealth.hp = 0;
  updateRuneDerivedConfig(world, 1100);
  assert(getFlag(player.tracksCombat, RUNE_WAIT_FOR_SUMMONS_FLAG), "dead slot holds even before reconstruction is queued");
  updateSummonerArchetype(world, 0, 1100);
  assert(summons.activeReconstruction);
  setEntityMotion(world, player, { x: 800, y: 400 });
  updateAutoTargets(world, 1100);
  assert(!player.isMoving);
  updateAutoIntent(world);
  assert.equal(player.hasAutoIntent?.activeRune?.actionId, "wait-for-summons");
  const enemy = world.createMonster("node-5-5", "plains-slime", { x: 440, y: 400 })!;
  // A remaining body must not autonomously pull a new enemy while a slot is missing.
  const survivor = summons.minionIds.map(id => world.getMinionEntity(id)).find(m => m && m.hasHealth.hp > 0);
  assert(survivor, "fixture must retain another living summon");
  {
    survivor.performsAttack.lastAttackAt = 100000;
    driveMinion(world, survivor, player, 1100);
    assert.equal(survivor.controlsMinion.currentTargetId, null);
    assert(!survivor.hasAttackTarget);
    assert.equal(enemy.hasHealth.hp, enemy.hasHealth.maxHp, "surviving summons do not damage the next enemy");
  }
  setAttackTarget(world, survivor, enemy.isMonster.id);
  updateRuneDerivedConfig(world, 1100);
  assert(!getFlag(player.tracksCombat, RUNE_WAIT_FOR_SUMMONS_FLAG), "an existing summon fight interrupts the hold");
  setAttackTarget(world, survivor, null);
  setAggroTarget(world, enemy, { id: survivor.isMinion.id, kind: "minion" }, 1100);
  updateRuneDerivedConfig(world, 1100);
  assert(!getFlag(player.tracksCombat, RUNE_WAIT_FOR_SUMMONS_FLAG), "attacks against summons interrupt the hold");
  setAggroTarget(world, enemy, { id: player.isPlayer.id, kind: "player" }, 1100);
  updateRuneDerivedConfig(world, 1100);
  assert(!getFlag(player.tracksCombat, RUNE_WAIT_FOR_SUMMONS_FLAG), "incoming fight interrupts rebuilding hold");
  world.removeMonsterEntity(enemy.isMonster.id);
  player.hasHealth.hp = player.hasHealth.maxHp;
  updateSummonerArchetype(world, 100000, 20000);
  updateRuneDerivedConfig(world, 20000);
  assert(!getFlag(player.tracksCombat, RUNE_WAIT_FOR_SUMMONS_FLAG), "reconstructed formation releases hold");
  player.tracksProgression.runesEquipped = [];
  const rebuilt = world.getMinionEntity(summons.minionIds[0]!)!;
  rebuilt.hasHealth.hp = 0;
  updateRuneDerivedConfig(world, 20000);
  assert(!getFlag(player.tracksCombat, RUNE_WAIT_FOR_SUMMONS_FLAG), "ownership alone does not enable hold");
}
// Full tick smoke: new maintenance participates in the normal world pipeline.
{
  const { world, player } = scenario("summoner", "wait-for-summons");
  updateSummonerArchetype(world, 0, 1000);
  const first = world.getMinionEntity(player.summonsMinions!.minionIds[0]!)!;
  first.hasHealth.hp = 0;
  world.tick(100, 1100);
  assert(player.summonsMinions!.activeReconstruction);
  assert(getFlag(player.tracksCombat, RUNE_WAIT_FOR_SUMMONS_FLAG));
  assert(!player.isMoving);
}
console.log("runeClassMaintenance: ok");
