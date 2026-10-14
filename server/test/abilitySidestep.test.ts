/**
 * SIDESTEP — the Avoid Guard (the ability pass, design §22.8).
 *
 * Wiring, not balance: the window's numbers are `sidestepWindow`'s, so the test
 * reads them from there rather than pinning them.
 * Pins:
 *   1. it is a T1 Forest-5 instant Guard, wired In Combat, with no number of its
 *      own in its rank;
 *   2. firing it opens ONE status carrying the evasion window and the move-speed
 *      burst, and the evade roll reads it;
 *   3. the speed burst is real movement, and it ends WITH the window;
 *   4. it does not fire with nothing in reach (no fire out of combat).
 *
 * Run: node --conditions=development --import tsx test/abilitySidestep.test.ts
 */
import {
  ABILITY_DATABASE,
  ABILITY_RECIPE_DATABASE,
  ABILITY_SIDESTEP_EFFECT_ID,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  baseRecoveryForTier,
  emptyEquipment,
  getStatusEffect,
  referenceAbilityRule,
  sidestepWindow,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import type { PlayerEntity } from '../src/ecs/entity';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { updateCombatState } from '../src/systems/combat/engine/combatState';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { evasionWindowBonus } from '../src/systems/defense/mitigation/evasion';
import { requestManualAbilityUse } from '../src/systems/player/abilities/abilityFiring';
import { setEntityMotion, updateMovement } from '../src/systems/world/movement';
import { World } from '../src/world/World';
import { fireWithReferenceWiring } from './fixtures/abilityWiring';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const SIDESTEP = ABILITY_DATABASE.get('sidestep')!;

function slices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-5-5', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier: 1, currentSkillTier: 1, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runesEquipped: [],
      knownAbilities: ['sidestep'], attunedAbilities: { techniques: [], guards: ['sidestep'] },
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

function spawn(id: string): { world: World; player: PlayerEntity } {
  const world = new World();
  const player = world.attachPlayerEntity(slices(id), id);
  player.usesAutocombat.auto = true;
  syncArchetypeSlices(world, player);
  return { world, player };
}

/** Distance the player covers in one 100 ms step toward a far point. */
function stride(world: World, player: PlayerEntity, now: number): number {
  const before = { ...player.hasPosition.current };
  setEntityMotion(world, player, { x: before.x, y: before.y + 2_000 });
  updateMovement(world, 100, now);
  return Math.hypot(player.hasPosition.current.x - before.x, player.hasPosition.current.y - before.y);
}

initCombatSystems();

// ── 1. A T1 Forest instant Guard, wired In Combat, authoring no number ──────
{
  assert(SIDESTEP.slot === 'guard' && SIDESTEP.shape === 'instant' && SIDESTEP.tier === 1,
    'Sidestep is a T1 instant Guard');
  const recipe = [...ABILITY_RECIPE_DATABASE.values()].find((r) => r.abilityId === 'sidestep');
  assert(recipe?.recipeGroup === 'forest' && recipe.requiredBiomeLevel === 5 && recipe.tier === 1,
    'Sidestep is learned at Forest 5');
  assert(recipe!.cost.green !== undefined, "Sidestep's recipe is paid in the Forest's own essence colour");
  assert(referenceAbilityRule('sidestep')?.conditionId === 'in-combat', 'Sidestep is wired In Combat -> Use Ability');
  for (const rank of SIDESTEP.ranks) {
    assert(Object.keys(rank.effect).join() === 'kind', 'the rank authors only its shape — no magnitude');
  }
  // The window grows with the rank.
  const t1 = sidestepWindow(SIDESTEP, 1);
  const t4 = sidestepWindow(SIDESTEP, 4);
  assert(t1.durationMs > 0, 'the window has a clock');
  assert(t1.evasionPct > 0 && t1.moveSpeedPct > 0, 'both halves carry a magnitude');
  assert(t4.evasionPct > t1.evasionPct, 'a later rank reads a later row');
}

// ── 2. The window opens on one status, and the evade roll reads it ──────────
{
  const { world, player } = spawn('sidestep-open');
  const monster = world.createMonster('node-5-5', 'plains-slime', { x: 430, y: 400 })!;
  setAttackTarget(world, player, monster.isMonster.id);
  assert(evasionWindowBonus(player.tracksCombat) === 0, 'no window before firing');
  fireWithReferenceWiring(world, 1_000);
  const status = getStatusEffect(player.tracksCombat, ABILITY_SIDESTEP_EFFECT_ID);
  assert(!!status, 'Sidestep must open its window');
  const window = sidestepWindow(SIDESTEP, 1);
  assert(status!.data['evasionPct'] === window.evasionPct && status!.data['moveSpeedPct'] === window.moveSpeedPct,
    'the status carries both halves of the window');
  assert(status!.remainingMs === window.durationMs && status!.data['totalMs'] === window.durationMs,
    'one clock for both halves');
  assert(Math.abs(evasionWindowBonus(player.tracksCombat) - window.evasionPct) < 1e-9,
    'the player evade roll reads the Sidestep window');
  assert(world.takeNodeEvents('node-5-5').some((e) => e.kind === 'player-guard' && e.ability === 'sidestep'),
    'the Guard announces itself for its fx');
}

// ── 3. The burst is real movement, and it ends with the window ──────────────
{
  const { world, player } = spawn('sidestep-speed');
  const monster = world.createMonster('node-5-5', 'plains-slime', { x: 430, y: 400 })!;
  setAttackTarget(world, player, monster.isMonster.id);
  const base = stride(world, player, 1_000);
  fireWithReferenceWiring(world, 1_100);
  assert(!!getStatusEffect(player.tracksCombat, ABILITY_SIDESTEP_EFFECT_ID), 'the window must be open');
  const burst = stride(world, player, 1_200);
  const { moveSpeedPct, durationMs } = sidestepWindow(SIDESTEP, 1);
  assert(Math.abs(burst - base * (1 + moveSpeedPct)) < 0.01,
    `the burst must speed the stride by the window's share (${burst} vs ${base})`);

  updateCombatState(world, durationMs + 100);
  assert(getStatusEffect(player.tracksCombat, ABILITY_SIDESTEP_EFFECT_ID) === undefined, 'the window closes on its clock');
  assert(evasionWindowBonus(player.tracksCombat) === 0, 'the evade bonus ends with the window');
  const after = stride(world, player, 4_000);
  assert(Math.abs(after - base) < 0.01, `the speed burst ends with the window (${after} vs ${base})`);
}

// ── 4. Nothing in reach, no fire ─────────────────────────────────────────────
{
  const { world, player } = spawn('sidestep-empty');
  // Out of combat: no monster anywhere, so neither the rule nor a press fires it.
  fireWithReferenceWiring(world, 1_000);
  assert(getStatusEffect(player.tracksCombat, ABILITY_SIDESTEP_EFFECT_ID) === undefined,
    'Sidestep must not fire out of combat');
  const pressed = requestManualAbilityUse(world, player, 'sidestep', 1_000);
  assert(getStatusEffect(player.tracksCombat, ABILITY_SIDESTEP_EFFECT_ID) === undefined && pressed.state !== 'activated',
    'a manual press with nothing in reach must not spend it either');
  assert((player.tracksCombat.cooldowns['ability.cd.sidestep'] ?? 0) <= 0, 'a declined Sidestep keeps its cooldown');

  // A monster far outside reach is still nothing to dodge.
  world.createMonster('node-5-5', 'plains-slime', { x: 2_000, y: 400 });
  requestManualAbilityUse(world, player, 'sidestep', 1_100);
  assert(getStatusEffect(player.tracksCombat, ABILITY_SIDESTEP_EFFECT_ID) === undefined,
    'a monster out of reach does not open the window');
}

console.log('abilitySidestep: ok');
