// Voidwalker (Singularity Execute) discharge resolves through normal target mitigation,
// and the early execute projects with that same mitigated damage.
import { GAME_CONFIG, STARTER_RUNE_IDS, emptyEquipment } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { setEmpoweredAttack, isEmpoweredAttack } from '../src/systems/combat/engine/empoweredAttacks';

initCombatSystems();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function voidwalker() {
  const world = new World();
  const slices: PersistedPlayerSlices = {
    isPlayer: { id: 'vw', name: 'vw' },
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
      unlockedSkills: ['energy-root', 'energy-heavy', 'energy-heavy-t3-a'],
      passives: {}, selectedClass: 'energy-root',
      selectedSubVariant: 'heavy', selectedRange: null, combatArchetype: 'energy',
    },
  };
  const player = world.attachPlayerEntity(slices, 'vw');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  assert(player.usesSkills.passives['energy.singularity-execute'] === 1, 'Voidwalker passive resolved');
  assert(player.usesEnergy, 'energy slice attached');
  return { world, player };
}

function target(world: World, armored: boolean, hp = 1e7) {
  const t = world.createMonster('node-clearing', 'plains-slime', { x: 410, y: 400 });
  assert(t, 'target spawned');
  t.hasHealth.hp = t.hasHealth.maxHp = hp;
  t.mitigatesDamage.plating = armored ? 50 : 0;
  t.mitigatesDamage.damageReduction = armored ? 0.4 : 0;
  t.mitigatesDamage.evasion = 0;
  return t;
}

let now = 1000;
function hit(world: World, player: ReturnType<typeof voidwalker>['player'], t: ReturnType<typeof target>): number {
  const before = t.hasHealth.hp;
  now += 5000;
  runPlayerAttack(world, player, t, now, { attackOrigin: player.hasPosition.current, aggroSource: { id: player.isPlayer.id, kind: 'player' } });
  return before - t.hasHealth.hp;
}

function discharge(armored: boolean): { ordinary: number; discharge: number } {
  const { world, player } = voidwalker();
  const t = target(world, armored);
  player.usesEnergy!.energy = 0;
  const ordinary = hit(world, player, t);
  player.usesEnergy!.energy = 0;
  player.usesEnergy!.dischargeEnergy = 100;
  setEmpoweredAttack(world, player);
  const dmg = hit(world, player, t);
  assert(!isEmpoweredAttack(player), 'discharge consumed the empowered charge');
  return { ordinary, discharge: dmg };
}

// 1. Mitigation applies to the discharge, in the same proportion as an ordinary hit.
const open = discharge(false);
const armored = discharge(true);
assert(open.ordinary > 0 && armored.ordinary > 0, 'ordinary hits land');
assert(armored.ordinary < open.ordinary, 'armor mitigates the ordinary hit');
assert(armored.discharge < open.discharge, `armor mitigates the discharge (${armored.discharge} vs ${open.discharge})`);
const ordinaryRatio = armored.ordinary / open.ordinary;
const dischargeRatio = armored.discharge / open.discharge;
assert(Math.abs(ordinaryRatio - dischargeRatio) < 0.02,
  `discharge mitigated like an ordinary hit (ordinary ${ordinaryRatio.toFixed(3)}, discharge ${dischargeRatio.toFixed(3)})`);

// 2. Early execute: a lethal projection spends stored energy on this hit and kills.
{
  const { world, player } = voidwalker();
  const probe = target(world, true);
  player.usesEnergy!.energy = 0;
  const base = hit(world, player, probe);
  const t = target(world, true, base * 3); // survives an ordinary hit; dies to a 6x/100-energy discharge
  player.usesEnergy!.energy = 100;
  const dealt = hit(world, player, t);
  assert(player.usesEnergy!.energy === 0, `execute spent stored energy (left ${player.usesEnergy!.energy})`);
  assert(!isEmpoweredAttack(player), 'execute charge consumed on the same hit');
  assert(dealt >= base * 3 || t.hasHealth.hp <= 0, 'execute discharge killed the target');
}

// 3. No execute when the mitigated projection would not kill.
{
  const { world, player } = voidwalker();
  const t = target(world, true);
  player.usesEnergy!.energy = 50;
  hit(world, player, t);
  assert(player.usesEnergy!.energy >= 50, 'non-lethal hit keeps stored energy');
}

console.log('voidwalkerDischarge: ok');
