import {
  BIOME_DATABASE,
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { updateCombat } from '../src/systems/combat/engine/combat';
import { monsterAttackCooldown } from '../src/systems/combat/engine/monsterMechanics';
import { mirrorTargetStatus } from '../src/systems/combat/targetStatus';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-t2-jungle-01';

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

initCombatSystems();

// Duplicate pool entries are the current per-monster weighting mechanism. T2
// Apes are intentionally 1/4 of Jungle's pool instead of an even 1/3 share.
{
  const jungleT2Pool = BIOME_DATABASE.get('jungle')?.monsterPoolByTier[2] ?? [];
  assert(jungleT2Pool.filter(id => id === 'jungle-ape').length === 1, 'Jungle T2 should weight Apes once');
  assert(jungleT2Pool.length === 4, 'Jungle T2 weighted pool should have four entries');
}

// Chestbeat is a local, casted rally: haste reaches the whole authored radius,
// but only two idle non-boss monsters are pulled onto the Ape's live target.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('chestbeat-target'), 'chestbeat-target');
  const ape = world.createMonster(NODE, 'jungle-ape', { x: 400, y: 400 });
  const nearest = world.createMonster(NODE, 'jungle-snake', { x: 500, y: 400 });
  const second = world.createMonster(NODE, 'jungle-blowdarter', { x: 600, y: 400 });
  const capped = world.createMonster(NODE, 'jungle-snake', { x: 700, y: 400 });
  const distant = world.createMonster(NODE, 'jungle-snake', { x: 760, y: 400 });
  assert(ape && nearest && second && capped && distant, 'Chestbeat test monsters should spawn');

  setAggroTarget(world, ape, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  ape.hasAwareness.state = 'attacking';
  ape.performsAttack.lastAttackAt = 0;

  updateCombat(world, 0, 5_000);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === 'Chestbeat' && event.castMs === 1_300),
    'Chestbeat should start as a 1.3-second cast after its initial cooldown',
  );

  updateCombat(world, 0, 6_300);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-end' && event.fired && event.fx === 'chest-beat'),
    'Chestbeat should publish its dedicated resolve cue',
  );
  assert(getStatusEffect(ape.tracksCombat, 'monster-ape-chestbeat')?.remainingMs === 4_500, 'Chestbeat should haste the caster for 4.5 seconds');
  assert(getStatusEffect(nearest.tracksCombat, 'monster-ape-chestbeat') !== undefined, 'Chestbeat should haste the nearest ally');
  assert(getStatusEffect(second.tracksCombat, 'monster-ape-chestbeat') !== undefined, 'Chestbeat should haste the second nearby ally');
  assert(getStatusEffect(capped.tracksCombat, 'monster-ape-chestbeat') !== undefined, 'Chestbeat should haste every ally in its radius, even beyond the rally cap');
  assert(getStatusEffect(distant.tracksCombat, 'monster-ape-chestbeat') === undefined, 'Chestbeat should not haste distant allies');
  assert(monsterAttackCooldown(ape) === Math.round(ape.performsAttack.attackCooldown / 1.3), `Chestbeat should raise the Ape attack speed by exactly 30% (got ${monsterAttackCooldown(ape)})`);

  assert(nearest.hasAggroTarget?.targetId === player.isPlayer.id, 'Chestbeat should pull its nearest idle ally onto the Ape target');
  assert(second.hasAggroTarget?.targetId === player.isPlayer.id, 'Chestbeat should pull its second idle ally onto the Ape target');
  assert(!capped.hasAggroTarget, 'Chestbeat should cap its rally at two monsters');
  assert(!distant.hasAggroTarget, 'Chestbeat should not pull a monster outside its radius');

  setAttackTarget(world, player, ape.isMonster.id);
  mirrorTargetStatus(world);
  const tile = ape.hasStatus.targetStatus?.find(status => status.id === 'monster-ape-chestbeat');
  assert(tile?.totalMs === 4_500, 'Chestbeat should project a timed target-frame buff tile');
  assert(tile.values?.some(value => value.label === 'Attack speed' && value.value === '+30%'), 'Chestbeat tile should expose its live magnitude');

  // A second Chestbeat in the same aggro session may refresh haste, but must not
  // discover and pull a new wave of monsters.
  const late = world.createMonster(NODE, 'jungle-snake', { x: 650, y: 400 });
  assert(late, 'late Chestbeat candidate should spawn');
  updateCombat(world, 0, 18_300);
  updateCombat(world, 0, 19_600);
  assert(!late.hasAggroTarget, 'Chestbeat should rally only once per Ape combat session');
}

function testChameleonBurst(
  monsterTypeId: string,
  expectedName: string,
  effectId: string,
  expectedAttacks: number,
): void {
  const def = MONSTER_DATABASE.get(monsterTypeId);
  assert(def?.concealedWhileIdle === true, `${monsterTypeId} should remain concealed while idle`);
  assert(!def.openingVolley, `${monsterTypeId} should no longer use the one-time opening volley`);

  const world = new World();
  const player = world.attachPlayerEntity(playerSlices(`${monsterTypeId}-target`), `${monsterTypeId}-target`);
  const chameleon = world.createMonster(NODE, monsterTypeId, { x: 400, y: 400 });
  assert(chameleon, `${monsterTypeId} should spawn`);
  setAggroTarget(world, chameleon, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  chameleon.hasAwareness.state = 'attacking';
  chameleon.performsAttack.lastAttackAt = 0;

  updateCombat(world, 0, 5_000);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === expectedName && event.castMs === 1_000),
    `${monsterTypeId} should telegraph its recurring Barrage cast`,
  );
  updateCombat(world, 0, 6_000);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-end' && event.fired && event.fx === 'barrage'),
    `${monsterTypeId} should use the Barrage resolve cue`,
  );
  assert(getStatusEffect(chameleon.tracksCombat, effectId)?.stacks === expectedAttacks, `${monsterTypeId} should prime ${expectedAttacks} hasted attacks`);
  assert(monsterAttackCooldown(chameleon) === Math.round(chameleon.performsAttack.attackCooldown / 3), `${monsterTypeId} should use the Barrage +200% attack-speed window`);

  updateCombat(world, 0, 6_001);
  assert(getStatusEffect(chameleon.tracksCombat, effectId)?.stacks === expectedAttacks - 1, `${monsterTypeId} should consume one Barrage charge on its first attack`);
}

testChameleonBurst('canopy-harrier', 'Canopy Barrage', 'canopy-chameleon-barrage', 2);
testChameleonBurst('thornback-lizard', 'Thorn Barrage', 'thornback-chameleon-barrage', 3);

console.log('jungleCastedAbilities.test.ts: ok');
