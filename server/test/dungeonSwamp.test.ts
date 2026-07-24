// Smoke test for the Swamp T1 authored dungeon encounter:
//   - rot basin keepers spawn before activation
//   - clearing keepers disables their boss effect
//   - uncleared keepers aggro and seed temporary boss rot pools
//   - boss periodic rot pools are capped and expire

import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getDungeonGauntletDef,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import {
  activateDungeonAltar,
  ensureDungeonGauntlet,
  onDungeonMonsterRewarded,
  tickDungeonGauntlets,
} from "../src/systems/world/dungeons/gauntlet";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const ALTAR = { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 };
const SWAMP_NODE = "node-t1-swamp-dungeon";

function makePlayerSlices(id: string, nodeId: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { ...ALTAR }, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 2000, maxHp: 2000, hpRegen: GAME_CONFIG.PLAYER_HP_REGEN },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], equippedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null, reactive: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null,
      selectedRange: null, combatArchetype: "cadence",
    },
  };
}

function setupSwamp(): { world: World; playerId: string } {
  const world = new World();
  const playerId = `player-${SWAMP_NODE}`;
  world.attachPlayerEntity(makePlayerSlices(playerId, SWAMP_NODE), playerId);
  world.frozenNodes.delete(SWAMP_NODE);
  ensureDungeonGauntlet(world, SWAMP_NODE);
  return { world, playerId };
}

{
  const def = getDungeonGauntletDef(SWAMP_NODE);
  assert(!!def, "expected Swamp T1 gauntlet def");
  assert(def!.preEncounter?.id === "swamp-rot-basins", "Swamp uses authored rot basins");
  assert(def!.preEncounter.groups.length === 3, "Swamp has three basins");
  assert(def!.preEncounter.groups.every((g) => g.kind === "basin"), "every group is a basin");
  assert(def!.preEncounter.bossRotPools?.kind === "rot-pool", "boss rot pool behavior is authored");
  assert(def!.unclearedThreat?.mode === "hazard", "uncleared keepers enable extra rot hazards");

  const boss = MONSTER_DATABASE.get("grave-toadeater")!;
  // T1 simplification: no adds during the boss fight (Plains is the only T1 boss
  // with adds). The 50% beat is a light enrage.
  assert(
    !boss.bossScript?.phases?.some((p) => p.actions.some((a) => a.type === "spawn-adds")),
    "the swamp boss spawns no adds (T1 simplification)",
  );
  assert(
    boss.bossScript?.phases?.[0]?.actions.some((a) => a.type === "enrage") === true,
    "50% boss beat is a light enrage",
  );
}

{
  const { world } = setupSwamp();
  const state = world.gauntlets.get(SWAMP_NODE)!;
  const keepers = state.idleGuardianIds.map((id) => world.getMonsterEntity(id)!)
    .filter((m) => m.tracksDungeon?.preEncounterRole === "keeper");
  assert(keepers.length === 3, "three rot keepers spawn");
  assert(keepers.every((m) => m.isMonster.name === "Rot Keeper"), "keepers are visibly named");
}

{
  const { world, playerId } = setupSwamp();
  const state = world.gauntlets.get(SWAMP_NODE)!;
  for (const id of [...state.idleGuardianIds]) {
    const keeper = world.getMonsterEntity(id)!;
    onDungeonMonsterRewarded(world, playerId, keeper);
    world.removeMonsterEntity(id);
  }
  const player = world.getPlayerEntity(playerId)!;
  assert(activateDungeonAltar(world, player), "altar activates after basin clear");
  assert(state.unclearedThreatCount === 0, "cleared keepers mean no uncleared rot basins");
  state.bossAwakensAtMs = Date.now() - 1;
  tickDungeonGauntlets(world, Date.now());
  assert(state.status === "boss", "boss spawns");
  assert(state.temporaryHazards.length === 0, "clean boss start has no extra basin pools");
}

{
  const { world, playerId } = setupSwamp();
  const state = world.gauntlets.get(SWAMP_NODE)!;
  const player = world.getPlayerEntity(playerId)!;
  assert(activateDungeonAltar(world, player), "altar activates with basins alive");
  assert(state.unclearedThreatCount === 3, "uncleared count tracks keepers");
  assert(state.preEncounterThreatIds.length === 3, "uncleared keepers join as optional threats");
  state.bossAwakensAtMs = Date.now() - 1;
  tickDungeonGauntlets(world, Date.now());
  assert(state.status === "boss", "boss spawns");
  assert(state.temporaryHazards.length > 0, "uncleared keepers seed temporary boss pools");

  const before = state.temporaryHazards.length;
  tickDungeonGauntlets(world, Date.now() + 4_000);
  assert(state.temporaryHazards.length >= before, "boss can maintain temporary rot pools");
  state.nextBossHazardAtMs = Date.now() + 999_999;
  tickDungeonGauntlets(world, Date.now() + 20_000);
  assert(state.temporaryHazards.length === 0, "temporary rot pools expire");

  const boss = world.getMonsterEntity(state.bossMonsterId!)!;
  const res = onDungeonMonsterRewarded(world, playerId, boss);
  assert(res.suppressBossRespawn, "gauntlet boss suppresses standing respawn");
  assert(state.status === "cooldown", "boss can still be cleared");
}

console.log("dungeonSwamp.test.ts: ok");
