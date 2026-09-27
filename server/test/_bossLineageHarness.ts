/**
 * Shared fixtures for the boss-lineage redesign tests (bossLineage*.test.ts).
 * `_`-prefixed so the test runner does not execute it on its own.
 */
import {
  emptyEquipment,
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  type Vec2,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { World } from '../src/world/World';

export const NODE = 'node-5-5';

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function playerSlices(id: string, x: number, y: number, hp = 1_000_000, nodeId = NODE): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x, y }, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp, maxHp: hp, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      attunedAbilities: { technique: null, guard: null }, knownStances: [],
      equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

export interface Arena {
  world: World;
  boss: MonsterEntity;
  player: PlayerEntity;
  /** Wall clock the next tick runs at. */
  now: number;
  nodeId: string;
}

/** A boss aggroed onto a (very durable) player, ready for its first pattern. */
export function arena(bossId: string, bossAt: Vec2, playerAt: Vec2, hp?: number, nodeId = NODE): Arena {
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices(`${bossId}-p`, playerAt.x, playerAt.y, hp, nodeId), `${bossId}-p`);
  const boss = world.createMonster(nodeId, bossId, bossAt);
  assert(boss, `${bossId} should spawn`);
  setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  boss.hasAwareness.state = 'attacking';
  const pattern = MONSTER_DATABASE.get(bossId)!.bossPattern;
  const now = 1_000 + (pattern ? (pattern.initialCooldownMs ?? pattern.cooldownMs) : 0) + 100;
  return { world, boss, player, now, nodeId };
}

/** Full world ticks until `until` holds or `maxMs` passes; returns whether it held. */
export function runUntil(a: Arena, until: () => boolean, maxMs: number, dt = 100): boolean {
  for (let t = 0; t < maxMs; t += dt) {
    a.world.tick(dt, a.now);
    a.now += dt;
    if (until()) return true;
  }
  return false;
}

/** Hold the player still (world ticks otherwise let auto-combat move them). */
export function pin(player: PlayerEntity, at: Vec2): void {
  player.hasPosition.current = { ...at };
}
