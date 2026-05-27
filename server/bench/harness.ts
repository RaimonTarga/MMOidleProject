import { GAME_CONFIG, emptyEquipment, type Vec2 } from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import { initAllMechanics } from "../src/systems/classes/registry";
import { initWeaponEffects } from "../src/systems/combat/damage/weaponEffects";
import { initDefenseSystems } from "../src/systems/defense";
import { initDebuffMechanics } from "../src/systems/classes/shared/debuffs";
import { syncArchetypeSlices } from "../src/ecs/archetypeSliceSync";
import { recalculatePlayerEntityStats } from "../src/ecs/playerEntityFormulas";
import type { BenchScenario } from "./scenarios";

let mechanicsInitialized = false;

export function initBenchMechanics(): void {
  if (mechanicsInitialized) return;
  initAllMechanics();
  initWeaponEffects();
  initDefenseSystems();
  initDebuffMechanics();
  mechanicsInitialized = true;
}

export function createBenchWorld(): World {
  initBenchMechanics();
  return new World();
}

function buildBenchPlayer(
  id: string,
  name: string,
  nodeId: string,
  pos: Vec2,
): PersistedPlayerSlices {
  const equipment = emptyEquipment();
  equipment.weapon = "basic-sword";
  return {
    isPlayer: { id, name },
    hasPosition: { current: pos, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      hpRegen: GAME_CONFIG.PLAYER_HP_REGEN,
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
    },
    holdsInventory: { inventory: [], equipment },
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

export function spawnBenchPlayers(
  world: World,
  scenario: BenchScenario,
  count: number,
): void {
  for (let i = 0; i < count; i++) {
    const nodeId = scenario.nodeForIndex(i, count);
    const pos: Vec2 = {
      x: GAME_CONFIG.NODE_WIDTH / 2 + (i % 5) * 40,
      y: GAME_CONFIG.NODE_HEIGHT / 2,
    };
    const socketId = `bench-player-${i}`;
    const slices = buildBenchPlayer(socketId, `Bench_${i}`, nodeId, pos);
    const entity = world.attachPlayerEntity(slices, socketId);
    syncArchetypeSlices(world, entity);
    recalculatePlayerEntityStats(world, entity);
    syncArchetypeSlices(world, entity);
    entity.usesAutocombat.auto = scenario.autoCombat;
  }
}

export const BENCH_DT_MS = Math.round(1000 / GAME_CONFIG.LOGIC_TICK_RATE);
export const BENCH_BROADCAST_MS = Math.round(
  1000 / GAME_CONFIG.BROADCAST_TICK_RATE,
);
