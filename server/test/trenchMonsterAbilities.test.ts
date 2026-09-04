import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { updateCombat } from '../src/systems/combat/engine/combat';
import { chargedCastEndsAt, monsterAbilityCastEndsAt } from '../src/systems/combat/engine/monsterMechanics';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-t4-trench-01';

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

function prepareMonster(
  world: World,
  monsterTypeId: string,
  abilityId: string,
): { player: PlayerEntity; monster: MonsterEntity } {
  const player = world.attachPlayerEntity(playerSlices(`${monsterTypeId}-${abilityId}-target`), `${monsterTypeId}-${abilityId}-target`);
  const monster = world.createMonster(NODE, monsterTypeId, { x: 400, y: 400 });
  assert(monster, `${monsterTypeId} should spawn for ${abilityId}`);
  const abilities = MONSTER_DATABASE.get(monsterTypeId)?.monsterAbilities ?? [];
  setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  monster.hasAwareness.state = 'attacking';
  monster.performsAttack.lastAttackAt = 2_000;
  // Seed every ability's session so this test can select one beat at a time
  // without depending on the authored initial-cooldown ordering.
  for (const ability of abilities) {
    monster.tracksCombat.counters[`monsterAbilitySession:${ability.id}`] = 1_000;
    monster.tracksCombat.counters[`monsterAbilityCdNext:${ability.id}`] = ability.id === abilityId ? 0 : Number.MAX_SAFE_INTEGER;
  }
  return { player, monster };
}

initCombatSystems();

for (const id of ['abyssal-serpent', 'hadal-stalker', 'elder-leviathan']) {
  const def = MONSTER_DATABASE.get(id);
  assert(!!def?.monsterAbilities && def.monsterAbilities.length === 3, `${id} should expose three generic elite abilities`);
  assert(new Set(def.monsterAbilities.map(ability => ability.id)).size === 3, `${id} abilities should have unique ids`);
  assert(new Set(def.monsterAbilities.map(ability => ability.name)).size === 3, `${id} abilities should have unique names`);
}

// Each elite has a repeatable medium attack with a cast bar and a player rider.
for (const [monsterTypeId, abilityId, effectId] of [
  ['abyssal-serpent', 'undertow-lunge', 'slow'],
  ['hadal-stalker', 'depth-bolt', 'slow'],
  ['elder-leviathan', 'lantern-pulse', 'slow'],
] as const) {
  const world = new World();
  const { player, monster } = prepareMonster(world, monsterTypeId, abilityId);
  const ability = MONSTER_DATABASE.get(monsterTypeId)!.monsterAbilities!.find(candidate => candidate.id === abilityId)!;
  updateCombat(world, 0, 2_000);
  assert(world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === ability.name), `${ability.name} should start a visible cast`);
  const hpBefore = player.hasHealth.hp;
  updateCombat(world, 0, 2_000 + ability.castMs);
  const events = world.takeNodeEvents(NODE);
  assert(events.some(event => event.kind === 'monster-cast-end' && event.fired && event.fx === ability.fx), `${ability.name} should publish its resolve cue`);
  assert(player.hasHealth.hp < hpBefore, `${ability.name} should deal damage through the monster attack pipeline`);
  assert(getStatusEffect(player.tracksCombat, effectId) !== undefined, `${ability.name} should apply its player rider`);
  assert(monster.tracksCombat.counters['monsterAbilityCdNext:' + abilityId] > 2_000 + ability.castMs, `${ability.name} should enter its recurring cooldown`);
}

// Area abilities plant a warning at cast start and still resolve at that point.
for (const [monsterTypeId, abilityId] of [
  ['abyssal-serpent', 'tail-sweep'],
  ['hadal-stalker', 'silt-mine'],
  ['elder-leviathan', 'body-sweep'],
] as const) {
  const world = new World();
  const { player, monster } = prepareMonster(world, monsterTypeId, abilityId);
  const ability = MONSTER_DATABASE.get(monsterTypeId)!.monsterAbilities!.find(candidate => candidate.id === abilityId)!;
  const area = ability.actions.find(action => action.type === 'area-hit');
  assert(area?.type === 'area-hit', `${abilityId} should be an area ability`);
  updateCombat(world, 0, 2_000);
  const telegraph = [...(world.groundZones.get(NODE) ?? [])].find(zone => zone.kind === 'slam-telegraph');
  assert(telegraph?.radius === area.radius && telegraph?.fx === ability.fx, `${abilityId} should publish a distinct ground telegraph`);
  const hpBefore = player.hasHealth.hp;
  updateCombat(world, 0, 2_000 + ability.castMs);
  const events = world.takeNodeEvents(NODE);
  assert(events.some(event => event.kind === 'monster-cast-end' && event.fired && event.radius === area.radius), `${abilityId} should resolve with its impact radius`);
  assert(player.hasHealth.hp < hpBefore, `${abilityId} should hit the player inside its planted circle`);
  assert((world.groundZones.get(NODE) ?? []).every(zone => zone.kind !== 'slam-telegraph'), `${abilityId} telegraph should clear on resolve`);
}

// Self-support is also a casted action: it does not require a player target in
// range and uses the same cast primitive as the offensive abilities.
for (const [monsterTypeId, abilityId, effectId] of [
  ['abyssal-serpent', 'predatory-surge', 'abyssal-predatory-surge'],
  ['hadal-stalker', 'current-shift', 'hadal-current-shift'],
  ['elder-leviathan', 'carapace-renewal', 'elder-carapace-renewal'],
] as const) {
  const world = new World();
  const { monster } = prepareMonster(world, monsterTypeId, abilityId);
  const ability = MONSTER_DATABASE.get(monsterTypeId)!.monsterAbilities!.find(candidate => candidate.id === abilityId)!;
  updateCombat(world, 0, 2_000);
  updateCombat(world, 0, 2_000 + ability.castMs);
  assert(getStatusEffect(monster.tracksCombat, effectId) !== undefined, `${ability.name} should apply its self effect`);
}

// The active T4 boss uses the same primitive for its distinct secondary rotation:
// a recovery wound, a committed slow tide, and a short ordinary-bite haste.
for (const [abilityId, effectId] of [
  ['abyssal-pressure', 'antiheal'],
  ['crushing-tide', 'slow'],
  ['undertow-current', 'elder-undertow-current'],
] as const) {
  const world = new World();
  const { player, monster } = prepareMonster(world, 'elder-trench-serpent', abilityId);
  const ability = MONSTER_DATABASE.get('elder-trench-serpent')!.monsterAbilities!.find(candidate => candidate.id === abilityId)!;
  updateCombat(world, 0, 2_000);
  updateCombat(world, 0, 2_000 + ability.castMs);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-end' && event.fired && event.fx === ability.fx),
    `${ability.name} should publish its resolve cue`,
  );
  assert(getStatusEffect(effectId === 'elder-undertow-current' ? monster.tracksCombat : player.tracksCombat, effectId) !== undefined, `${ability.name} should apply its authored effect`);
}

// ONE CAST PER MONSTER. `publishGroundZone` clears telegraphs by ownerId and the
// client's cast bar is keyed by monster id, so a generic ability that started on
// top of a live charged wind-up would erase the charged attack's committed circle
// and steal its cast bar — leaving the big hit to land unannounced. Every elite
// here pairs `monsterAbilities` with a `chargedAttack`, so the scheduler must
// yield while another cast is pending.
{
  const world = new World();
  const { monster } = prepareMonster(world, 'elder-leviathan', 'body-sweep');
  // Park the ability, let Devour open, then arm the ability mid wind-up.
  monster.tracksCombat.counters['monsterAbilityCdNext:body-sweep'] = Number.MAX_SAFE_INTEGER;
  monster.tracksCombat.counters['chargeSession'] = 1_000;
  monster.tracksCombat.counters['chargeCdNextAt'] = 0;
  monster.performsAttack.lastAttackAt = 0;

  let now = 2_000;
  while (chargedCastEndsAt(monster) === 0 && now < 12_000) {
    now += 100;
    updateCombat(world, 100, now);
  }
  assert(chargedCastEndsAt(monster) > 0, 'Devour should begin winding up');
  const chargedEndsAt = chargedCastEndsAt(monster);
  monster.tracksCombat.counters['monsterAbilityCdNext:body-sweep'] = 0;

  while (now < chargedEndsAt) {
    now += 100;
    updateCombat(world, 100, now);
    assert(
      monsterAbilityCastEndsAt(monster) === 0,
      'a generic ability must not begin while a charged attack is winding up',
    );
    if (chargedCastEndsAt(monster) > now) {
      assert(
        (world.groundZones.get(NODE) ?? []).some(zone => zone.kind === 'slam-telegraph' && zone.fx === undefined),
        'the charged slam must keep its own telegraph for the whole wind-up',
      );
    }
  }
  // Once Devour is done the queued ability is free to take its turn.
  let started = false;
  for (let i = 0; i < 20 && !started; i++) {
    now += 100;
    updateCombat(world, 100, now);
    started = monsterAbilityCastEndsAt(monster) > 0;
  }
  assert(started, 'the ability should cast once the charged attack has resolved');
}

// A cast COSTS the swing it replaced: a self-only beat touches no attack, so
// without an explicit stamp it would resolve and immediately swing for free.
{
  const world = new World();
  const { monster } = prepareMonster(world, 'elder-leviathan', 'carapace-renewal');
  const ability = MONSTER_DATABASE.get('elder-leviathan')!.monsterAbilities!
    .find(candidate => candidate.id === 'carapace-renewal')!;
  updateCombat(world, 0, 2_000);
  updateCombat(world, 0, 2_000 + ability.castMs);
  assert(
    monster.performsAttack.lastAttackAt === 2_000 + ability.castMs,
    'a self-only ability should advance the attack timer instead of casting for free',
  );
}

console.log('trenchMonsterAbilities.test.ts: ok');
