/**
 * OV-HOOKS item 3: the `target-staggered` moment (Crescendo's release, bible §12.6) and the
 * foreseen `drag-or-push` (Anchor plants before the push lands, §8.8): the event fires as the
 * push or drag starts winding up at you, once, and the push landing does not fire it again; an
 * unforeseen push still fires it as it happens. Wiring only.
 *
 * Run: node --conditions=development --import tsx test/momentsForesight.test.ts
 */
import assert from 'node:assert/strict';
import { emptyEquipment, MONSTER_DATABASE } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { attachComponent } from '../src/ecs/markerHelpers';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { pushPlayer } from '../src/systems/combat/damage/forcedMovement';
import { beginCharge } from '../src/systems/combat/engine/monsterMechanics';
import { dragOrPushLandsAt } from '../src/systems/combat/moments/fightSnapshot';
import { conditionsHold, momentActive, momentImplemented, momentTick, updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { applyStun } from '../src/systems/combat/status/stun';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-foresight-ram', {
  ...base, id: 'test-foresight-ram', evasion: 0,
  chargedAttack: { name: 'Test Ram', castMs: 2000, cooldownMs: 60_000, multiplier: 2, knockback: { distance: 180 } },
} as never);
MONSTER_DATABASE.set('test-foresight-plain', { ...base, id: 'test-foresight-plain', evasion: 0 });

const slices = {
  isPlayer: { id: 'p', name: 'p' },
  hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
  hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
  tracksProgression: {
    level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
    biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
    playerTier: 3, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
    runesOwned: [], runesEquipped: [],
  },
  holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
  usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null },
} as PersistedPlayerSlices;

let clock = 100_000;
function arena() {
  const world = new World();
  const player = world.attachPlayerEntity(slices, 'p');
  const tick = (): void => {
    clock += 100;
    world.tickCounter += 1;
    updatePlayerMoments(world, player, clock);
  };
  return { world, player, tick };
}

assert(momentImplemented('target-staggered'), 'target-staggered is implemented');

// 1. target-staggered: a stun (or knockdown) on the target, or a boss in a stopped pattern's window.
{
  const { world, player, tick } = arena();
  const target = world.createMonster(NODE, 'test-foresight-plain', { x: 440, y: 400 })!;
  setAttackTarget(world, player, target.isMonster.id);
  tick();
  assert(!momentActive(world, player, 'target-staggered', undefined, clock), 'a target on its feet is not staggered');
  applyStun(target.tracksCombat, 800, 'test');
  tick();
  assert(momentActive(world, player, 'target-staggered', undefined, clock), 'a stunned target is staggered');
  // Crescendo's release rule reads it as a condition: hold the finisher while NOT staggered.
  assert(!conditionsHold(world, player, [{ id: 'target-staggered', not: true }], clock), 'the hold lets go on the stagger');

  const boss = world.createMonster(NODE, 'test-foresight-plain', { x: 460, y: 420 })!;
  setAttackTarget(world, player, boss.isMonster.id);
  attachComponent(world, boss, 'recoversFromPattern', {
    label: 'Caught', endsAtMs: clock + 2000, totalMs: 2000, fromStagger: true, ownsRoot: false, ownsCannotAttack: false,
  });
  tick();
  assert(momentActive(world, player, 'target-staggered', undefined, clock), "a boss in its stopped pattern's window is staggered");
  boss.recoversFromPattern!.fromStagger = false;
  tick();
  assert(!momentActive(world, player, 'target-staggered', undefined, clock), "a completed pattern's short recovery is not a stagger");
}

// 2. drag-or-push is foreseen at the wind-up, once.
{
  const { world, player, tick } = arena();
  const ram = world.createMonster(NODE, 'test-foresight-ram', { x: 470, y: 400 })!;
  setAggroTarget(world, ram, { id: 'p', kind: 'player' }, clock);
  tick();
  assert(!momentActive(world, player, 'drag-or-push', undefined, clock), 'nothing is coming yet');
  beginCharge(ram, clock, 2000);
  assert.equal(dragOrPushLandsAt(world, player, clock), clock + 2000, 'the ram is a push winding up at you');
  tick();
  assert(momentActive(world, player, 'drag-or-push', undefined, clock), 'the push fires drag-or-push as it winds up');
  const foreseenAt = momentTick(player, 'drag-or-push');
  for (let i = 0; i < 19; i++) tick();
  pushPlayer(world, player, ram.hasPosition.current, 180, ram);
  assert.equal(momentTick(player, 'drag-or-push'), foreseenAt, 'the push landing is the same event: it does not fire again');

  // Long after, an unforeseen push (no wind-up) fires it as it happens.
  for (let i = 0; i < 10; i++) tick();
  pushPlayer(world, player, ram.hasPosition.current, 180, ram);
  assert(momentActive(world, player, 'drag-or-push', undefined, clock), 'an unforeseen push fires it as it lands');
  assert.notEqual(momentTick(player, 'drag-or-push'), foreseenAt, 'as a new event');
}

// 3. A boss pattern's pull step aimed at you is foreseen too.
{
  const { world, player, tick } = arena();
  const boss = world.createMonster(NODE, 'mire-gorged-behemoth', { x: 600, y: 400 })!;
  setAggroTarget(world, boss, { id: 'p', kind: 'player' }, clock);
  attachComponent(world, boss, 'runsBossPattern', {
    patternId: 'mire-lash', stepIndex: 2, stepEndsAtMs: clock + 1200, stepStarted: true, targetId: 'p', skippedStepIndexes: [],
  } as never);
  tick();
  assert(momentActive(world, player, 'drag-or-push', undefined, clock), 'a pull winding up at you fires drag-or-push');
}

console.log('momentsForesight: ok');
