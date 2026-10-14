/**
 * CULL — the kill-shaped Technique (the ability pass, design §22.8).
 *
 * Wiring, not balance: no authored number is asserted except where the mechanic
 * IS the number. Pins:
 *   1. it is a T3 Tundra-3 cast Technique on an execute curve, wired In Combat;
 *   2. its multiplier RISES as the target's health share falls (flat above the
 *      threshold, climbing below it), and Technique Power scales the strike;
 *   3. it resolves through the real cast lifecycle, damaging its target once;
 *   4. a KILL refunds its own cooldown; a landing that does not kill keeps it.
 *
 * Run: node --conditions=development --import tsx test/abilityCull.test.ts
 */
import {
  ABILITY_DATABASE,
  ABILITY_RECIPE_DATABASE,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  abilityRankAt,
  baseRecoveryForTier,
  emptyEquipment,
  getCooldown,
  referenceAbilityRule,
  resolveAbilityEffect,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import type { MonsterEntity } from '../src/ecs/entity';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { updateAbilityCasts } from '../src/systems/player/abilities/abilityCasting';
import { abilityCooldownKey } from '../src/systems/player/abilities/abilityCooldowns';
import { cullMultiplier } from '../src/systems/player/abilities/abilityEffects';
import { World } from '../src/world/World';
import { fireWithReferenceWiring } from './fixtures/abilityWiring';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const CULL = ABILITY_DATABASE.get('cull')!;

function slices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-5-5', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier: 3, currentSkillTier: 3, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runesEquipped: [],
      knownAbilities: ['cull'], attunedAbilities: { techniques: ['cull'], guards: [] },
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

function spawn(id: string) {
  const world = new World();
  const player = world.attachPlayerEntity(slices(id), id);
  player.usesAutocombat.auto = true;
  syncArchetypeSlices(world, player);
  player.dealsDamage.attack = 100;
  return { world, player };
}

function monsterAt(world: World, x: number, hp: number, maxHp = 10_000): MonsterEntity {
  const monster = world.createMonster('node-5-5', 'plains-slime', { x, y: 400 });
  if (!monster) throw new Error('failed to create Cull target');
  monster.hasHealth.maxHp = maxHp;
  monster.hasHealth.hp = hp;
  monster.mitigatesDamage.plating = 0;
  monster.mitigatesDamage.damageReduction = 0;
  if (monster.evadesHits) monster.evadesHits.dodgeRate = 0;
  return monster;
}

/** Begin Cull through its reference wiring and run the wind-up to resolution. */
function castCull(world: World, player: ReturnType<typeof spawn>['player'], target: MonsterEntity, now: number): void {
  setAttackTarget(world, player, target.isMonster.id);
  fireWithReferenceWiring(world, now);
  assert(player.isCastingAbility?.abilityId === 'cull', 'Cull must begin its wind-up');
  updateAbilityCasts(world, player.isCastingAbility!.endsAt);
  assert(player.isCastingAbility === undefined, 'the wind-up must resolve');
}

initCombatSystems();

// ── 1. A T3 Tundra cast on an execute curve, wired In Combat ─────────────────
{
  assert(CULL.slot === 'technique' && CULL.shape === 'cast' && CULL.tier === 3, 'Cull is a T3 cast Technique');
  const recipe = [...ABILITY_RECIPE_DATABASE.values()].find((r) => r.abilityId === 'cull');
  assert(recipe?.recipeGroup === 'tundra' && recipe.requiredBiomeLevel === 3 && recipe.tier === 3,
    'Cull is learned at Tundra 3');
  assert(recipe!.cost.blue !== undefined, "Cull's recipe is paid in the Tundra's own essence colour");
  assert(referenceAbilityRule('cull')?.conditionId === 'in-combat', 'Cull is wired In Combat -> Use Ability');
  for (const tier of [3, 4]) {
    assert(abilityRankAt(CULL, tier).effect.kind === 'execute-strike', 'every rank is the execute curve');
  }
}

// ── 2. The multiplier rises as the target's health falls ─────────────────────
{
  const effect = resolveAbilityEffect(CULL, { playerTier: 3 });
  assert(effect.kind === 'execute-strike', 'Cull resolves as an execute strike');
  if (effect.kind === 'execute-strike') {
    const shares = [1, effect.thresholdPct, effect.thresholdPct * 0.75, effect.thresholdPct * 0.5, effect.thresholdPct * 0.25, 0];
    const mults = shares.map((share) => cullMultiplier(effect, share));
    assert(mults[0] === mults[1], 'above the threshold the strike is flat');
    for (let i = 2; i < mults.length; i++) {
      assert(mults[i]! > mults[i - 1]!, `below the threshold the multiplier must rise as health falls (${mults.join(' > ')})`);
    }
    assert(mults.at(-1) === effect.executeMult, 'at zero health the strike reaches its execute end');

    // Technique Power scales the strike: both ends of the curve, never the threshold.
    const powered = resolveAbilityEffect(CULL, { playerTier: 3, techniquePowerPct: 0.5 });
    assert(powered.kind === 'execute-strike', 'Technique Power keeps the kind');
    if (powered.kind === 'execute-strike') {
      assert(Math.abs(powered.damageMult - effect.damageMult * 1.5) < 1e-9, 'Technique Power scales the base strike');
      assert(Math.abs(powered.executeMult - effect.executeMult * 1.5) < 1e-9, 'Technique Power scales the execute end');
      assert(powered.thresholdPct === effect.thresholdPct, 'a damage stat never moves the threshold');
    }
  }
}

// ── 3. Through the real cast: a wounded target takes more than a healthy one ──
{
  const healthy = spawn('cull-healthy');
  const fresh = monsterAt(healthy.world, 430, 10_000);
  castCull(healthy.world, healthy.player, fresh, 1_000);
  const dealtHealthy = 10_000 - fresh.hasHealth.hp;

  const wounded = spawn('cull-wounded');
  const low = monsterAt(wounded.world, 430, 2_000);
  castCull(wounded.world, wounded.player, low, 1_000);
  const dealtWounded = 2_000 - low.hasHealth.hp;

  assert(dealtHealthy > 0, 'Cull must damage its target');
  assert(dealtWounded > dealtHealthy, `Cull must hit a wounded target harder (${dealtWounded} vs ${dealtHealthy})`);
  assert(getCooldown(healthy.player.tracksCombat, abilityCooldownKey('cull')) > 0,
    'a Cull that does not kill keeps its cooldown');
}

// ── 4. A kill refunds Cull's own cooldown ────────────────────────────────────
{
  const { world, player } = spawn('cull-kill');
  const dying = monsterAt(world, 430, 50);
  world.takeNodeEvents('node-5-5');
  castCull(world, player, dying, 1_000);
  assert(dying.hasHealth.hp <= 0, 'the fixture strike must kill');
  assert(getCooldown(player.tracksCombat, abilityCooldownKey('cull')) <= 0,
    'a Cull kill must refund its own cooldown');
  const samples = world.takeNodeEvents('node-5-5').flatMap((e) =>
    e.kind === 'player-ability-cooldown' && e.ability === 'cull' ? [e] : []);
  assert(samples.length >= 2 && samples.at(-1)!.remainingMs === 0,
    'the HUD hears the charge and then the refund');

  // Ready again at once: the next body can be culled on the very next decision.
  const next = monsterAt(world, 440, 10_000);
  setAttackTarget(world, player, next.isMonster.id);
  fireWithReferenceWiring(world, 2_000);
  assert(player.isCastingAbility?.abilityId === 'cull', 'a refunded Cull winds up again immediately');
}

console.log('abilityCull: ok');
