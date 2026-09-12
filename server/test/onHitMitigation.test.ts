import { GAME_CONFIG, STARTER_RUNE_IDS, emptyEquipment, ABILITY_DATABASE, estimatePlayerDps, estimatePlayerHitDamage, mitigateOnHitDamage } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { setEmpoweredAttack } from '../src/systems/combat/engine/empoweredAttacks';
import { resolveCastPayload } from '../src/systems/player/abilities/abilityEffects';
import { updateReloadT3Ticks } from '../src/systems/classes/archetypes/reload/t3/ticks/laser';
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



function damage(onHit: number, plating: number, dr: number, mode = 'normal', catalyst = 0): number {
  const { world, player } = fixture(mode === 'empowered' ? 'cadence' : mode === 'laser' ? 'reload' : null);
  const target = targetFor(world);
  target.mitigatesDamage.plating = plating;
  target.mitigatesDamage.damageReduction = dr;
  player.dealsDamage.attack = 100;
  player.dealsDamage.onHitDamage = onHit;
  player.usesSkills.passives['core.onhit-mult'] = catalyst;
  const hp = target.hasHealth.hp;
  if (mode === 'empowered') {
    player.usesSkills.passives['cadence.empowered-mult'] = 3;
    setEmpoweredAttack(world, player);
  }
  if (mode === 'power-strike') resolveCastPayload(world, player, ABILITY_DATABASE.get('power-strike')!, target);
  else if (mode === 'laser') {
    player.usesSkills.passives['reload.laser'] = 1;
    player.usesSkills.passives['reload.laser-damage-per-tick-pct'] = 1;
    updateReloadT3Ticks(world, 100, 1000);
  } else attack(world, player, target);
  return hp - target.hasHealth.hp;
}
for (const [plating, dr, expected] of [[40, 0.5, 40], [110, 0.5, 5], [140, 0.5, 1], [0, 0, 120]]) {
  eq(damage(20, plating, dr), expected, 'attack and on-hit share target defenses');
  eq(estimatePlayerHitDamage({ attack: 100, onHitDamage: 20, targetPlating: plating, targetDamageReduction: dr, platingMult: 1 }), expected, 'hit estimator matches combat');
}
for (const mode of ['normal', 'empowered', 'laser']) {
  eq(damage(20, 40, 0.5, mode) - damage(0, 40, 0.5, mode), 10, `${mode}: DR halves flat bonus without empowered scaling`);
}
eq(damage(20, 40, 0.5, 'power-strike'), damage(0, 40, 0.5, 'power-strike'), 'Power Strike is an independent cast and does not multiply on-hit');
eq(damage(20, 40, 0.5, 'normal', 1), 50, 'Catalyst scales the bonus before defenses');
eq(mitigateOnHitDamage(20, 100, 110, 0.5), 4, 'remaining plating absorbs part of on-hit; the existing glancing floor is paid once');
for (const root of ['cadence', 'cooldown', 'reload', 'dot', 'energy', 'summoner']) {
  const { player } = fixture(root as any);
  const input = { attack: 100, onHitDamage: 20, attackCooldownMs: 1000, archetype: root, passives: player.usesSkills.passives,
    target: { plating: 0, damageReduction: 0.5 }, summoner: { activeCount: 5, profileInput: player.usesSkills } };
  const defendedBonus = estimatePlayerDps(input).total - estimatePlayerDps({ ...input, onHitDamage: 0 }).total;
  const openBonus = estimatePlayerDps({ ...input, target: undefined }).total - estimatePlayerDps({ ...input, onHitDamage: 0, target: undefined }).total;
  assert(Math.abs(defendedBonus - openBonus / 2) < 0.3, `${root}: DPS applies DR to the on-hit contribution`);
}
console.log('onHitMitigation: ok');
