/**
 * The tier 2 moments (class-first build plan §6): charging at you, burrowing at you, a ranged
 * attacker, a frozen or brittle target, a target out of reach and back, an ambush leaping out
 * of cover, and an ally under threat. Wiring only.
 */
import assert from 'node:assert/strict';
import { applyStatusEffect, emptyEquipment, FROZEN_STATUS_ID, type MomentId } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { attachComponent, detachComponent } from '../src/ecs/markerHelpers';
import { performAmbushLunge } from '../src/systems/combat/ai/ambushLunge';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { momentActive, momentImplemented, updatePlayerMoments } from '../src/systems/combat/moments/moments';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';

function slices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 1000, maxHp: 1000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier: 2, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null },
  } as PersistedPlayerSlices;
}

for (const id of ['charging-at-me', 'burrow-at-me', 'ranged-attacker', 'target-frozen', 'target-out-of-reach', 'target-resurfaces', 'ambush', 'ally-threatened'] as MomentId[]) {
  assert(momentImplemented(id), `${id} is implemented`);
}

const world = new World();
const player = world.attachPlayerEntity(slices('p'), 'p');
const active = (id: MomentId) => momentActive(world, player, id, undefined, 1000);
const tick = () => { world.tickCounter += 1; updatePlayerMoments(world, player, 1000 + world.tickCounter * 100); };

const brute = world.createMonster(NODE, 'bone-crawler', { x: 520, y: 400 })!;
setAggroTarget(world, brute, { kind: 'player', id: 'p' }, 0);
setAttackTarget(world, player, brute.isMonster.id);
brute.performsAttack.attackRange = 30;
tick();
assert(!active('charging-at-me') && !active('ranged-attacker') && !active('target-frozen'), 'nothing yet');

// Charging at you.
brute.controlsMonster.chargeRemainingMs = 400;
tick();
assert(active('charging-at-me'), 'a charging enemy reads');
brute.controlsMonster.chargeRemainingMs = 0;

// A ranged attacker, not touching.
brute.performsAttack.attackRange = 220;
tick();
assert(active('ranged-attacker'), 'a shooter reads');
brute.performsAttack.attackRange = 30;

// Frozen: the target.
applyStatusEffect(brute.tracksCombat, { id: FROZEN_STATUS_ID, maxStacks: 1, remainingMs: 2000, refreshable: true, sourceId: 'p', data: { totalMs: 2000 } });
tick();
assert(active('target-frozen'), 'a frozen target reads');

// Out of reach and back.
attachComponent(world, brute, 'isConcealed', { targetable: false } as never);
tick();
assert(active('target-out-of-reach'), 'a burrowed target is out of reach');
detachComponent(world, brute, 'isConcealed');
tick();
assert(!active('target-out-of-reach') && active('target-resurfaces'), 'it resurfaces');

// An ambush leaping out of cover.
performAmbushLunge(world, brute, player);
assert(active('ambush'), 'the leap is the ambush moment');

// An ally under a telegraph or low on HP.
const ally = world.attachPlayerEntity(slices('ally'), 'ally');
attachComponent(world, player, 'inParty', { leaderId: 'p', members: [{ id: 'p', name: 'p' }, { id: 'ally', name: 'ally' }] } as never);
attachComponent(world, ally, 'inParty', { leaderId: 'p', members: [{ id: 'p', name: 'p' }, { id: 'ally', name: 'ally' }] } as never);
tick();
assert(!active('ally-threatened'), 'a healthy ally is fine');
ally.hasHealth.hp = 100;
tick();
assert(active('ally-threatened'), 'a low ally is threatened');

console.log('momentsT2: ok');
