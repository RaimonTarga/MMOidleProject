/**
 * The tier 3 moments (class-first build plan §6): the Chill reaching its threshold, a fire
 * attack coming at you, and something dragging or pushing you. Wiring only.
 */
import assert from 'node:assert/strict';
import { applyStatusEffect, emptyEquipment, type MomentId } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { attachComponent } from '../src/ecs/markerHelpers';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { pushPlayer } from '../src/systems/combat/damage/forcedMovement';
import { momentActive, momentImplemented, updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const slices = {
  isPlayer: { id: 'p', name: 'p' },
  hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
  hasHealth: { hp: 1000, maxHp: 1000, recovery: 0 },
  tracksProgression: {
    level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
    biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
    playerTier: 3, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
    runesOwned: [], runesEquipped: [],
  },
  holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
  usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null },
} as PersistedPlayerSlices;

for (const id of ['chill-threshold', 'fire-attack', 'drag-or-push', 'risen'] as MomentId[]) {
  assert(momentImplemented(id), `${id} is implemented`);
}

const world = new World();
const player = world.attachPlayerEntity(slices, 'p');
const active = (id: MomentId) => momentActive(world, player, id, undefined, 1000);
const tick = () => { world.tickCounter += 1; updatePlayerMoments(world, player, 1000 + world.tickCounter * 100); };

tick();
assert(!active('chill-threshold') && !active('fire-attack') && !active('drag-or-push'), 'nothing yet');

for (let i = 0; i < 3; i++) applyStatusEffect(player.tracksCombat, { id: 'tundra-chill', maxStacks: 6, remainingMs: 4000, refreshable: true, sourceId: 'm', data: {} });
tick();
assert(active('chill-threshold'), 'three stacks of Chill reach the threshold');

const salamander = world.createMonster(NODE, 'bone-crawler', { x: 460, y: 400 })!;
setAggroTarget(world, salamander, { kind: 'player', id: 'p' }, 0);
tick();
assert(!active('fire-attack'), 'a plain attacker is not a fire attack');

pushPlayer(world, player, { x: 300, y: 400 }, 80);
assert(active('drag-or-push'), 'a push is the drag-or-push moment');

assert(!active('risen'), 'nothing has risen');
attachComponent(world, salamander, 'isRaised', { raiserId: 'necromancer' } as never);
tick();
assert(active('risen'), 'a raised enemy near you is the risen moment (T4)');

console.log('momentsT3: ok');
