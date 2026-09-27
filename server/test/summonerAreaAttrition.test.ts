/**
 * Formation attrition: one area hit over N summons is shared (N^-0.5 per body),
 * and fallen slots rebuild faster out of combat than in it.
 */
import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  SUMMONER_CORE_TUNING,
  emptyEquipment,
  summonAreaShareMult,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { applyMonsterAoe } from '../src/systems/combat/damage/aoeDamage';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function persisted(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1_000, maxHp: 1_000, recovery: 5 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 1, currentSkillTier: 1,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['summoner-root'],
      passives: {},
      selectedClass: 'summoner-root',
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: 'summoner',
    },
  };
}

function setup(id: string) {
  const world = new World();
  const owner = world.attachPlayerEntity(persisted(id), id);
  syncArchetypeSlices(world, owner);
  owner.mitigatesDamage.plating = 0;
  owner.mitigatesDamage.damageReduction = 0;
  updateSummonerArchetype(world, 0, 1_000);
  const minions = () => owner.summonsMinions!.minionIds.map((mid) => world.getMinionEntity(mid));
  assert(minions().length === 4 && minions().every(Boolean), 'root formation should spawn four summons');
  return { world, owner, minions };
}

// ── Area share ───────────────────────────────────────────────────────────────
assert(summonAreaShareMult(1) === 1, 'a lone body takes the full hit');
assert(summonAreaShareMult(4) === 0.5, 'four bodies take half each');

{
  const { world, owner, minions } = setup('area');
  const monster = world.createMonster('node-clearing', 'boar', { x: 900, y: 900 })!;
  assert(monster !== undefined, 'fixture monster');
  const center = { x: 1_500, y: 1_500 };
  for (const m of minions()) m!.hasPosition.current = { ...center };
  // Keep the owner out of the circle so only summons are hit.
  owner.hasPosition.current = { x: 200, y: 200 };

  const before = minions().map((m) => m!.hasHealth.hp);
  applyMonsterAoe(world, monster, center, 60, 40);
  const taken = minions().map((m, i) => before[i]! - m!.hasHealth.hp);
  assert(taken.every((t) => t === 20), `four caught bodies take 40 x 0.5 each, got ${taken.join(',')}`);

  // A body caught alone still takes the whole hit.
  for (const m of minions().slice(1)) m!.hasPosition.current = { x: 3_000, y: 3_000 };
  const lone = minions()[0]!;
  const loneBefore = lone.hasHealth.hp;
  applyMonsterAoe(world, monster, center, 60, 40);
  assert(loneBefore - lone.hasHealth.hp === 40, 'a lone body takes the full area hit');
}

// ── Out-of-combat reconstruction ─────────────────────────────────────────────
function msToRebuild(inCombat: boolean): number {
  const { world, owner, minions } = setup(inCombat ? 'rebuild-combat' : 'rebuild-calm');
  const deadId = owner.summonsMinions!.minionIds[0];
  minions()[0]!.hasHealth.hp = 0;
  let now = 2_000;
  for (let elapsed = 0; elapsed <= 10_000; elapsed += 100) {
    if (inCombat) owner.tracksEngagement = now;
    updateSummonerArchetype(world, 100, now);
    now += 100;
    const id = owner.summonsMinions!.minionIds[0];
    if (id && id !== deadId && (world.getMinionEntity(id)?.hasHealth.hp ?? 0) > 0) return elapsed;
  }
  return Infinity;
}

const calm = msToRebuild(false);
const fighting = msToRebuild(true);
const base = SUMMONER_CORE_TUNING.reconstructionIntervalMs;
assert(fighting >= base - 100 && fighting <= base + 200, `in-combat rebuild takes the base ${base}ms, got ${fighting}`);
assert(calm <= base / SUMMONER_CORE_TUNING.outOfCombatReconstructionSpeedMult + 200,
  `out-of-combat rebuild runs ${SUMMONER_CORE_TUNING.outOfCombatReconstructionSpeedMult}x faster, got ${calm}ms`);

console.log('summonerAreaAttrition: ok');
