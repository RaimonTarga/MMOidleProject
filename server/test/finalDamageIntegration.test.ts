import { GAME_CONFIG, STARTER_RUNE_IDS, emptyEquipment, applyStatusEffect, compareEquipmentStats, previewEquipmentStats, estimatePlayerDps, composePlayerView } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runPlayerAttack, runMonsterAttack } from '../src/systems/combat/engine/combat';
import { applyPlayerProcDamage } from '../src/systems/combat/damage/procDamage';
import { applyPlayerAoe, applyMonsterAoe } from '../src/systems/combat/damage/aoeDamage';
import { updateDotArchetype } from '../src/systems/classes/archetypes/dot/dotPrototype';
import { updateReloadT3Ticks } from '../src/systems/classes/archetypes/reload/t3/ticks/laser';
import { mirrorHpForecast } from '../src/systems/defense/core/hpForecast';
import { playerFinalDamageMultipliers } from '../src/systems/combat/damage/finalDamage';
import { attachComponent } from '../src/ecs/markerHelpers';
initCombatSystems();
let serial = 0;
function fixture(archetype: 'cadence' | 'cooldown' | 'reload' | 'dot' | 'energy' | 'summoner' | null) {
  const id = `audit-${serial++}`;
  const world = new World();
  const slices: PersistedPlayerSlices = {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1000, maxHp: 1000, recovery: GAME_CONFIG.PLAYER_RECOVERY },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [],
      questProgress: {}, playerTier: 4, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
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
  player.usesSkills.passives = { 'core.damage-dealt-pct': 0.4 };
  player.tracksProgression.activeStance = 'offensive-stance';
  const before = target.hasHealth.hp;
  if (mode === 'direct') attack(world, player, target);
  if (mode === 'proc') applyPlayerProcDamage(world, player, target, 120);
  if (mode === 'aoe') applyPlayerAoe(world, player, target.hasPosition.current, 100, 120);
  if (mode === 'laser') {
    Object.assign(player.usesSkills.passives, { 'reload.laser': 1, 'reload.laser-damage-per-tick-pct': 1 });
    updateReloadT3Ticks(world, 100, 1000);
  }
  if (mode === 'dot') {
    applyStatusEffect(target.tracksCombat, { id: 'dot', sourceId: player.isPlayer.id, stacks: 1, maxStacks: 1,
      remainingMs: 5000, data: { damagePerStack: 120, tickIntervalMs: 1000, nextTickIn: 0 } });
    attachComponent(world, target, 'hasDot', {});
    updateDotArchetype(world, 100);
  }
  eq(before - target.hasHealth.hp, 193, `${mode}: 120 × Core 1.4 × stance 1.15, once`);
}
// Incoming direct, AoE and DoT use the same independent layers.
for (const mode of ['direct', 'aoe', 'dot'] as const) {
  const { world, player } = fixture(null);
  const monster = targetFor(world);
  player.hasHealth.hp = player.hasHealth.maxHp = 10000;
  player.mitigatesDamage.plating = 0;
  player.mitigatesDamage.damageReduction = 0.5;
  if (player.evadesHits) player.evadesHits.dodgeRate = 0;
  player.usesSkills.passives = { 'core.damage-taken-pct': -0.2 };
  player.tracksProgression.activeStance = 'tanking-stance';
  monster.dealsDamage.attack = 100;
  const hp = player.hasHealth.hp;
  if (mode === 'direct') runMonsterAttack(world, monster, player, 1000);
  else if (mode === 'aoe') applyMonsterAoe(world, monster, player.hasPosition.current, 100, 100);
  else {
    applyStatusEffect(player.tracksCombat, { id: 'monster-dot:test', sourceId: monster.isMonster.id, stacks: 1, maxStacks: 1,
      remainingMs: 5000, data: { damagePerStack: 100, tickIntervalMs: 1000, nextTickIn: 0 } });
    attachComponent(world, player, 'hasDot', {});
    updateDotArchetype(world, 100);
  }
  eq(hp - player.hasHealth.hp, mode === 'dot' ? 45 : 30, `${mode}: 100 × .5 normal DR × .8 Core × .75 stance`);
  mirrorHpForecast(world);
  eq(composePlayerView(player)!.finalDamageTakenMult, 0.6, 'sheet includes independent taken layers');
}
{
  const { player } = fixture(null);
  const input = { usesSkills: player.usesSkills, equipment: emptyEquipment(), itemUpgrades: {}, playerTier: 4 };
  const normal = previewEquipmentStats(input);
  const core = compareEquipmentStats(input, 'core', 'core-force');
  eq(core.after.stats.attack, normal.stats.attack, 'broad Core no longer changes Attack');
  assert(core.after.stats.damageDealtMult > 1 && core.after.stats.dps > normal.stats.dps, 'Core modifies final damage and DPS');
  assert(core.relevant.includes('damageDealtMult') && core.relevant.includes('maxHp'), 'inventory includes both Core upside and cost');
  assert(!core.relevant.includes('attackRange') && !core.relevant.includes('dodgeRate'), 'inventory omits unrelated class stats');
  const same = compareEquipmentStats({ ...input, equipment: { ...input.equipment, core: 'core-force' } }, 'core', 'core-force');
  assert(same.relevant.includes('damageDealtMult'), 'equal replacements keep relevant unchanged values');
  eq(same.before.stats.dps, same.after.stats.dps, 'equal swap cannot invent DPS');
  const removed = compareEquipmentStats({ ...input, equipment: { ...input.equipment, core: 'core-force' } }, 'core', null);
  eq(removed.after.stats.dps, normal.stats.dps, 'unequip returns to rebuilt baseline');
  for (const hpFraction of [1, 0.5]) {
    const p = previewEquipmentStats({ ...input, activeStance: 'perfection-stance', hpFraction });
    eq(p.stats.damageDealtMult, hpFraction === 1 ? 1.2 : 1, 'HP gate identical on both comparison sides');
  }
  for (const archetype of ['cadence', 'cooldown', 'reload', 'dot', 'energy', 'summoner']) {
    const { player: p } = fixture(archetype as any);
    const base = { attack: 100, onHitDamage: 20, attackCooldownMs: 1000, archetype, passives: p.usesSkills.passives,
      summoner: { activeCount: 5, profileInput: p.usesSkills } };
    const before = estimatePlayerDps(base).total;
    const after = estimatePlayerDps({ ...base, passives: { ...base.passives, 'core.damage-dealt-pct': 0.4 } }).total;
    assert(Math.abs(after - before * 1.4) < 0.3, `${archetype}: DPS multiplies all included channels once`);
  }
}
console.log('finalDamageIntegration: ok');
