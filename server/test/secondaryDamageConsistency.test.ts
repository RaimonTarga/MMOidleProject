import {
  GAME_CONFIG,
  BURN_FAMILY,
  SLINGER_DIRECT_ATTACK_EFFECTIVENESS,
  emptyEquipment,
  getStatusEffect,
  resolveSummonerProfile,
  type SummonerProfile,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { PlayerEntity } from '../src/ecs/entity';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { setEmpoweredAttack } from '../src/systems/combat/engine/empoweredAttacks';
import { updateWeaponEffects } from '../src/systems/combat/damage/weaponEffects';
import type { CombatContext, FormationAttackContribution } from '../src/systems/combat/engine/combatPipeline';
import { playerOnHitDamage } from '../src/systems/combat/engine/onHitDamage';
import { consumeWeightedProc } from '../src/systems/classes/archetypes/summoner/formationAttack';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function close(actual: number, expected: number, message: string): void {
  if (Math.abs(actual - expected) > 1e-9) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

const NODE = 'node-clearing';

function slices(id: string, archetype: 'reload' | 'summoner' | null): PersistedPlayerSlices {
  const equipment = emptyEquipment();
  equipment.weapon = 'ashbrand-blade';
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1_000, maxHp: 1_000, recovery: 5 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 1, currentSkillTier: 1,
      bossesCleared: [], clearedNodes: [], runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: ['ashbrand-blade'], equipment, itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: archetype === 'reload' ? ['reload-root'] : archetype === 'summoner' ? ['summoner-root'] : [],
      passives: {},
      selectedClass: archetype === 'reload' ? 'reload-root' : archetype === 'summoner' ? 'summoner-root' : null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: archetype,
    },
  };
}

function attach(world: World, id: string, archetype: 'reload' | 'summoner' | null): PlayerEntity {
  const player = world.attachPlayerEntity(slices(id, archetype), id);
  syncArchetypeSlices(world, player);
  return player;
}

function attackOnce(world: World, player: PlayerEntity, effectId = 'poison-dagger-burn') {
  const target = world.createMonster(NODE, 'plains-slime', { x: 450, y: 400 });
  if (!target) throw new Error('failed to create reservoir target');
  target.hasHealth.maxHp = 10_000;
  target.hasHealth.hp = 10_000;
  target.mitigatesDamage.plating = 0;
  target.mitigatesDamage.damageReduction = 0;
  const before = target.hasHealth.hp;
  const outcome = runPlayerAttack(world, player, target, 1_000, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });
  assert(outcome === 'hit', `${player.isPlayer.id} reservoir attack should land`);
  return {
    target,
    damage: before - target.hasHealth.hp,
    pool: getStatusEffect(target.tracksCombat, effectId)?.data.pool ?? 0,
  };
}

function formationContribution(
  profile: SummonerProfile,
  slotIndex: number,
): FormationAttackContribution {
  const slot = profile.slots[slotIndex]!;
  return {
    ownerId: 'conduit', physicalEntityId: `summon-${slotIndex}`, slotId: slot.slotId,
    directDamageWeight: profile.formationOffenseMult * slot.offenseWeight,
    onHitMagnitudeWeight: slot.procWeight * profile.secondaryEffectMult,
    secondaryEffectMult: profile.secondaryEffectMult,
    procWeight: slot.procWeight * profile.secondaryEffectMult,
    targetId: 'target', cycleSerial: 0, cycleCompleted: false, side: 'summon',
  };
}

initCombatSystems();

// Slinger stat rebuild still owns the existing 65% direct Attack treatment.
{
  const world = new World();
  const player = attach(world, 'slinger-stat', null);
  player.holdsInventory.equipment.weapon = null;
  player.holdsInventory.inventory = [];
  player.usesSkills.combatArchetype = 'reload';
  recalculatePlayerEntityStats(world, player);
  assert(
    player.dealsDamage.attack === Math.floor(GAME_CONFIG.PLAYER_ATTACK * SLINGER_DIRECT_ATTACK_EFFECTIVENESS),
    'Slinger direct Attack must retain the existing 0.65 final stat layer',
  );
}

// Reservoirs use the post-mitigation direct hit, replace 65% with 85% once,
// and never include the flat on-hit term that is appended later.
{
  const world = new World();
  const slinger = attach(world, 'slinger-reservoir', 'reload');
  slinger.dealsDamage.attack = 65;
  slinger.dealsDamage.onHitDamage = 20;
  slinger.usesReload!.ammo = 1;
  slinger.usesReload!.ammoMax = 1;
  const hit = attackOnce(world, slinger);
  close(hit.pool, 65 / 0.65 * 0.85 * 0.5 * 1.5,
    'Slinger weapon reservoir applies 0.85 effectiveness exactly once');
  assert(hit.damage === Math.round(65 * 0.5) + 20,
    'Slinger flat on-hit remains full strength and outside conversion');

  const ordinary = attach(world, 'ordinary-reservoir', null);
  ordinary.dealsDamage.attack = 65;
  ordinary.dealsDamage.onHitDamage = 20;
  const ordinaryHit = attackOnce(world, ordinary);
  close(ordinaryHit.pool, 65 * 0.5 * 1.5,
    'non-Slinger weapon reservoir must remain unchanged');
}

// Every reservoir inherits the resolved empowered hit once, including its ticks.
for (const profile of BURN_FAMILY) {
  const world = new World();
  const player = attach(world, `empowered-${profile.weaponId}`, 'reload');
  player.holdsInventory.equipment.weapon = profile.weaponId;
  player.dealsDamage.attack = 100;
  player.dealsDamage.onHitDamage = 0;
  player.usesSkills.passives['reload.empowered-mult'] = 1.5;
  player.usesReload!.ammo = 10;
  player.usesReload!.ammoMax = 10;
  const normal = attackOnce(world, player, profile.effectId);
  setEmpoweredAttack(world, player);
  const empowered = attackOnce(world, player, profile.effectId);
  close(empowered.pool, normal.pool * 1.5,
    `${profile.weaponId} must store the empowered bonus exactly once`);
  close(empowered.damage, Math.max(1, Math.round(150 * (1 - profile.convPct))),
    `${profile.weaponId} retains its direct conversion fraction`);
  const hpBeforeTick = empowered.target.hasHealth.hp;
  updateWeaponEffects(world, profile.tickIntervalMs);
  const remainingPool = getStatusEffect(empowered.target.tracksCombat, profile.effectId)!.data.pool;
  const drained = empowered.pool - remainingPool;
  assert(drained > 0, `${profile.weaponId} must drain stored damage`);
  close(hpBeforeTick - empowered.target.hasHealth.hp, drained,
    `${profile.weaponId} must not empower stored damage again on tick`);
}

// Raw slot weights stay normalized; the resolved formation multiplier biases
// secondary effects without multiplying either channel by body count.
for (const test of [
  { frame: 'light' as const, skills: [] as string[], expected: 1.2, cycles: 5, triggers: 6 },
  { frame: 'light' as const, skills: ['summoner-light-t3-b'], expected: 1.3, cycles: 10, triggers: 13 },
  { frame: 'balanced' as const, skills: [] as string[], expected: 1, cycles: 3, triggers: 3 },
  { frame: 'heavy' as const, skills: [] as string[], expected: 1, cycles: 3, triggers: 3 },
]) {
  const profile = resolveSummonerProfile({
    selectedSubVariant: test.frame,
    selectedRange: null,
    unlockedSkills: test.skills,
  });
  const world = new World();
  const player = attach(world, `conduit-${test.expected}`, 'summoner');
  // 800 is divisible by both six- and eight-body weights after the authored
  // multipliers, so this assertion measures the budget rather than per-body
  // integer rounding noise.
  player.dealsDamage.onHitDamage = 800;
  let onHitBudget = 0;
  let directBudget = 0;
  let procTriggers = 0;
  for (let cycle = 0; cycle < test.cycles; cycle++) {
    for (let slotIndex = 0; slotIndex < profile.slots.length; slotIndex++) {
      const formation = formationContribution(profile, slotIndex);
      const ctx = {
        attacker: player,
        attackerType: 'player',
        defender: world.createMonster(NODE, 'plains-slime', { x: 500 + slotIndex, y: 400 }),
        defenderType: 'monster',
        metadata: {},
        formation,
      } as unknown as CombatContext;
      if (cycle === 0) {
        onHitBudget += playerOnHitDamage(ctx);
        directBudget += formation.directDamageWeight;
      }
      procTriggers += consumeWeightedProc(ctx, `test.proc.${test.expected}`);
    }
  }
  close(onHitBudget, 800 * test.expected,
    `${test.frame} formation on-hit magnitude uses one shared secondary budget`);
  close(directBudget, profile.formationOffenseMult,
    `${test.frame} direct Attack budget stays independent of secondary efficiency`);
  assert(procTriggers === test.triggers,
    `${test.frame} deterministic fractional proc accumulator expected ${test.triggers}, got ${procTriggers}`);
}

console.log('secondaryDamageConsistency.test.ts: ok');
