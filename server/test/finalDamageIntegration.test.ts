import { baseRecoveryForTier } from '@mmo-idle/shared';
import { GAME_CONFIG, STARTER_RUNE_IDS, emptyEquipment, applyStatusEffect, estimatePlayerDps, SUNLIGHT_EFFECT_ID, FINAL_DAMAGE_DEALT_PCT_KEY } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { applyPlayerProcDamage } from '../src/systems/combat/damage/procDamage';
import { applyPlayerAoe } from '../src/systems/combat/damage/aoeDamage';
import { updateDotArchetype } from '../src/systems/classes/archetypes/dot/dotPrototype';
import { updateReloadT3Ticks } from '../src/systems/classes/archetypes/reload/t3/ticks/laser';
import { attachComponent } from '../src/ecs/markerHelpers';
initCombatSystems();
let serial = 0;
function fixture(archetype: 'cadence' | 'cooldown' | 'reload' | 'dot' | 'energy' | 'summoner' | null) {
  const id = `audit-${serial++}`;
  const world = new World();
  const slices: PersistedPlayerSlices = {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1000, maxHp: 1000, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [],
      questProgress: {}, playerTier: 4, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: archetype ? [`${archetype}-root`, `${archetype}-balanced`] : [],
      passives: {}, selectedClass: archetype ? `${archetype}-root` : null,
      selectedSubVariant: 'balanced', selectedRange: null, combatArchetype: archetype,
    },
  };
  const player = world.attachPlayerEntity(slices, id);
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  return { world, player };
}
function targetFor(world: World) {
  const target = world.createMonster('node-clearing', 'plains-slime', { x: 410, y: 400 });
  if (!target) throw new Error('missing target');
  target.hasHealth.hp = target.hasHealth.maxHp = 1000000;
  target.mitigatesDamage.plating = target.mitigatesDamage.damageReduction = 0;
  return target;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function eq(actual: number, expected: number, message: string) {
  assert(Math.abs(actual - expected) < 1e-8, `${message}: got ${actual}, expected ${expected}`);
}
const attack = (world: World, player: ReturnType<typeof fixture>['player'], target: ReturnType<typeof targetFor>) =>
  runPlayerAttack(world, player, target, 1000, { attackOrigin: player.hasPosition.current, aggroSource: { id: player.isPlayer.id, kind: 'player' } });


for (const mode of ['direct', 'proc', 'aoe', 'dot', 'laser'] as const) {
  const { world, player } = fixture(mode === 'dot' ? 'dot' : mode === 'laser' ? 'reload' : null);
  const target = targetFor(world);
  player.dealsDamage.attack = 100;
  player.dealsDamage.onHitDamage = 20;
  // The final damage-dealt layer's one source since the cores went (class-first
  // rework D2) is the Sunlight window.
  player.usesSkills.passives = {};
  applyStatusEffect(player.tracksCombat, { id: SUNLIGHT_EFFECT_ID, sourceId: player.isPlayer.id, remainingMs: 60000,
    data: { [FINAL_DAMAGE_DEALT_PCT_KEY]: 0.4 } });
  const before = target.hasHealth.hp;
  if (mode === 'direct') attack(world, player, target);
  if (mode === 'proc') applyPlayerProcDamage(world, player, target, 120);
  if (mode === 'aoe') applyPlayerAoe(world, player, target.hasPosition.current, 100, 120);
  if (mode === 'laser') {
    Object.assign(player.usesSkills.passives, { 'reload.laser': 1, 'reload.laser-damage-per-tick-pct': 1 });
    updateReloadT3Ticks(world, 100, 1000);
  }
  if (mode === 'dot') {
    applyStatusEffect(target.tracksCombat, { id: 'dot', sourceId: player.isPlayer.id, maxStacks: 1,
      remainingMs: 5000, data: { damagePerStack: 120, tickIntervalMs: 1000, nextTickIn: 0 } });
    attachComponent(world, target, 'hasDot', {});
    updateDotArchetype(world, 100);
  }
  eq(before - target.hasHealth.hp, 168, `${mode}: 120 × final 1.4, once`);
}
{
  for (const archetype of ['cadence', 'cooldown', 'reload', 'dot', 'energy', 'summoner']) {
    const { player: p } = fixture(archetype as any);
    const base = { attack: 100, onHitDamage: 20, attackCooldownMs: 1000, archetype, passives: p.usesSkills.passives,
      summoner: { activeCount: 5, profileInput: p.usesSkills } };
    const before = estimatePlayerDps(base).total;
    const after = estimatePlayerDps({ ...base, finalDamageDealtMult: 1.4 }).total;
    assert(Math.abs(after - before * 1.4) < 0.3, `${archetype}: DPS multiplies all included channels once`);
  }
}
console.log('finalDamageIntegration: ok');
