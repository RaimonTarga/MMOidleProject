import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  type Vec2,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { db, runMigrations } from "../src/db/index";
import {
  hydrateHitboxCacheFromDb,
  initHitboxCache,
} from "../src/hitbox/cache";
import { getAtlasPaths } from "../src/hitbox/paths";
import { syncArchetypeSlices } from "../src/ecs/archetypeSliceSync";
import { recalculatePlayerEntityStats } from "../src/ecs/playerEntityFormulas";
import type { BenchScenario } from "./scenarios";

/**
 * Registers the combat pipeline for the bench. Delegates to the shared
 * `initCombatSystems` (the same bootstrap the live server uses) so the
 * simulation can never drift from in-game combat behavior. `initCombatSystems`
 * is itself idempotent, so calling this once per bench world is safe.
 */
export function initBenchMechanics(): void {
  initCombatSystems();
}

let hitboxReady = false;

/**
 * Populate the sprite-hitbox cache so the bench resolves the SAME baked hitboxes
 * the live server uses. Combat range/positioning (`inAttackRange`, `hitboxGap`)
 * reads these via `getHitboxDef`; with an empty cache every entity falls back to
 * a square AABB, which diverges from in-game reach (most visibly for the large
 * baked Void Overlord).
 *
 * The live server bakes at boot (`initHitboxCache`). Here we prefer the fast
 * path — hydrate the already-baked rows from `game.db` — and only fall back to a
 * full atlas rebake when the DB has never been baked (fresh checkout). Run once
 * per bench process; idempotent thereafter.
 *
 * NOTE: keep this in sync with the server's hitbox bootstrap in
 * `server/src/index.ts` (`initHitboxCache`). Bench stdout is JSONL/CSV, but the
 * TUI tolerantly skips non-JSON lines, so the `[db]`/`[hitbox]` logs are benign.
 */
export async function ensureBenchHitboxCache(): Promise<void> {
  if (hitboxReady) return;
  hitboxReady = true;

  // The hitbox table must exist before we can read it; migrations are idempotent.
  await runMigrations();

  if ((await hydrateHitboxCacheFromDb(db)) > 0) return;

  // Fresh DB that was never baked — bake from the atlas exactly like server boot.
  const { atlasPng, atlasJson } = getAtlasPaths();
  await initHitboxCache(db, atlasPng, atlasJson);
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
  equipment.weapon = "primordial-club";
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
      equippedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null, reactive: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment, itemUpgrades: {} },
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
    Object.assign(entity.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, {
      auto: scenario.autoCombat,
      engageUltimateBosses: true,
    });
  }
}

export const BENCH_DT_MS = Math.round(1000 / GAME_CONFIG.LOGIC_TICK_RATE);
export const BENCH_BROADCAST_MS = Math.round(
  1000 / GAME_CONFIG.BROADCAST_TICK_RATE,
);
