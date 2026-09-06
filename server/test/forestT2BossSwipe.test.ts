/**
 * Apex Timberclaw (Forest T2) — Stunning Swipe wiring.
 *
 * Covers the three things the 2026-09-06 pass added, as observable invariants
 * rather than balance numbers:
 *   1. the swipe's tell shortens with Bestial Frenzy stacks, and is floored;
 *   2. the slam resolves with its OWN broadcast cue instead of the generic
 *      shockwave every other AoE charge draws;
 *   3. Bestial Frenzy outranks the swipe — a scripted cast preempts an in-flight
 *      charged wind-up, and the two telegraphs are never live at once.
 */
import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { ActiveBossEffect } from '@mmo-idle/shared';
import type { MonsterEntity } from '../src/ecs/entity';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { updateCombat } from '../src/systems/combat/engine/combat';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
const AGGRO_AT = 1_000;

function playerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 405, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      equippedAbilities: { technique: null, guard: null }, knownStances: [],
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

/** A boss standing in melee range of a player, engaged and due an attack. */
function engagedTimberclaw(id: string): { world: World; boss: MonsterEntity } {
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices(id), id);
  const boss = world.createMonster(NODE, 'apex-timberclaw', { x: 400, y: 400 });
  assert(!!boss, 'Apex Timberclaw should spawn');
  setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, AGGRO_AT);
  boss.hasAwareness.state = 'attacking';
  boss.performsAttack.lastAttackAt = 0;
  return { world, boss };
}

/** Stack Bestial Frenzy the way its `stat-buff` action does, without the cast. */
function stackFrenzy(boss: MonsterEntity, count: number): void {
  const state = boss.scriptsBoss;
  assert(!!state, 'Apex Timberclaw should carry boss-script state');
  for (let i = 0; i < count; i++) {
    const effect: ActiveBossEffect = { type: 'bestial-frenzy', remainingMs: -1, totalMs: -1 };
    state.activeEffects.push(effect);
  }
}

function swipeCastMs(world: World): number | undefined {
  for (const event of world.takeNodeEvents(NODE)) {
    if (event.kind === 'monster-cast-start' && event.label === 'Stunning Swipe') return event.castMs;
  }
  return undefined;
}

initCombatSystems();

// 1a. With no frenzy stacks the tell is exactly the authored wind-up.
{
  const { world } = engagedTimberclaw('swipe-baseline');
  updateCombat(world, 0, 5_000);
  assert(swipeCastMs(world) === 700, 'an unstacked Stunning Swipe should use its authored 700ms tell');
}

// 1b. Every Bestial Frenzy stack tightens it multiplicatively (0.88 per stack).
{
  const { world, boss } = engagedTimberclaw('swipe-hastened');
  stackFrenzy(boss, 4);
  updateCombat(world, 0, 5_000);
  const expected = Math.round(700 * 0.88 ** 4);
  assert(
    swipeCastMs(world) === expected,
    `four Bestial Frenzy stacks should cut the tell to ${expected}ms`,
  );
}

// 1c. ...but never below the authored floor, so the tell stays readable.
{
  const { world, boss } = engagedTimberclaw('swipe-floored');
  stackFrenzy(boss, 40);
  updateCombat(world, 0, 5_000);
  assert(swipeCastMs(world) === 300, 'the hastened tell should clamp at its 300ms floor');
}

// 2. The slam pays off with its bespoke cue, anchored on the planted circle, and
//    does NOT also fire the generic shockwave.
{
  const { world } = engagedTimberclaw('swipe-impact');
  updateCombat(world, 0, 5_000);
  assert(swipeCastMs(world) === 700, 'the swipe should begin winding up');

  updateCombat(world, 0, 5_700);
  const events = world.takeNodeEvents(NODE);
  const resolved = events.find(
    event => event.kind === 'monster-cast-end' && event.fired && event.fx === 'timberclaw-swipe',
  );
  assert(!!resolved, 'the swipe should resolve with its own impact cue');
  assert(
    resolved.kind === 'monster-cast-end' && resolved.pos !== undefined && resolved.radius === 90,
    'the impact cue should carry the planted point and the circle it resolved at',
  );
  assert(
    !events.some(event => event.kind === 'boss-fx' && event.fx === 'slam'),
    'a slam with its own impact cue must not also draw the generic shockwave',
  );
}

// 3. Bestial Frenzy preempts an in-flight swipe, and does so in an order that
//    leaves exactly one live cast bar on the node.
{
  const { world, boss } = engagedTimberclaw('swipe-preempted');
  updateCombat(world, 0, 5_000);
  assert(swipeCastMs(world) === 700, 'the swipe should be winding up before the frenzy comes due');

  updateBossScripts(world, 5_000);
  const events = world.takeNodeEvents(NODE);
  const endIdx = events.findIndex(event => event.kind === 'monster-cast-end' && !event.fired);
  const startIdx = events.findIndex(
    event => event.kind === 'monster-cast-start' && event.label === 'Bestial Frenzy',
  );
  assert(endIdx >= 0, 'the frenzy should retire the swipe wind-up it preempts');
  assert(startIdx >= 0, 'the frenzy should open its own cast');
  assert(endIdx < startIdx, 'the swipe must be cleared BEFORE the frenzy bar opens, not after');
  assert(!!boss.cannotAttack, 'a scripted cast should hold the boss off its attacks');

  // The combat tick that follows must not emit a second cast-end: the client keys
  // cast bars by monster, so one would silently wipe the frenzy telegraph.
  updateCombat(world, 0, 5_100);
  assert(
    !world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-end'),
    'the frenzy cast bar must survive the combat tick that sees `cannotAttack`',
  );
  assert(!!boss.scriptsBoss?.scriptedCast, 'the frenzy cast should still be running');
}

console.log('forestT2BossSwipe.test.ts: ok');
