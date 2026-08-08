import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  describeMonsterMechanics,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { applyPlayerProcDamage } from '../src/systems/combat/damage/procDamage';
import { updateRaisers } from '../src/systems/combat/ai/raiseDead';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import {
  CORPSE_TTL_MS,
  MAX_CORPSES_PER_NODE,
  updateCorpses,
} from '../src/systems/world/corpses';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

function makePlayerSlices(id: string, x: number, y: number): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x, y }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, hpRegen: 0 },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null, reactive: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: null,
    },
  };
}

initCombatSystems();

function killMonster(world: World, player: PlayerEntity, monster: MonsterEntity): void {
  const outcome = applyPlayerProcDamage(world, player, monster, monster.hasHealth.maxHp * 2);
  assert(outcome === 'killed', `${monster.isMonster.monsterTypeId} should die to the test proc`);
}

function risenOf(world: World, raiser: MonsterEntity): MonsterEntity[] {
  const out: MonsterEntity[] = [];
  for (const monster of world.monsterEntitiesInNode(NODE)) {
    if (monster.isRaised?.raiserId === raiser.isMonster.id) out.push(monster);
  }
  return out;
}

// A player kill is remembered as a raisable corpse; bosses are not, and the ring
// buffer drops the oldest rather than growing without bound.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('corpse-killer', 400, 400), 'corpse-killer');

  const rat = world.createMonster(NODE, 'plague-rat', { x: 420, y: 400 });
  assert(!!rat, 'plague rat should spawn');
  const ratPos = { ...rat!.hasPosition.current };
  killMonster(world, player, rat!);

  const corpses = world.corpses.get(NODE) ?? [];
  assert(corpses.length === 1, 'a normal kill should leave exactly one corpse');
  assert(corpses[0]!.monsterTypeId === 'plague-rat', 'the corpse should remember what died');
  assert(
    corpses[0]!.pos.x === ratPos.x && corpses[0]!.pos.y === ratPos.y,
    'the corpse should be recorded where the monster fell',
  );

  const boss = world.createMonster(NODE, 'tusked-razorback', { x: 600, y: 400 });
  assert(!!boss, 'the boss used for the corpse-exclusion check should spawn');
  killMonster(world, player, boss!);
  assert(
    (world.corpses.get(NODE) ?? []).length === 1,
    'a boss must not leave a raisable corpse',
  );

  for (let i = 0; i < MAX_CORPSES_PER_NODE + 4; i++) {
    const filler = world.createMonster(NODE, 'plague-rat', { x: 300 + i * 16, y: 500 });
    if (filler) killMonster(world, player, filler);
  }
  const capped = world.corpses.get(NODE) ?? [];
  assert(
    capped.length === MAX_CORPSES_PER_NODE,
    `the corpse ring buffer should cap at ${MAX_CORPSES_PER_NODE}, got ${capped.length}`,
  );
  assert(
    !capped.some((corpse) => corpse.pos.x === ratPos.x && corpse.pos.y === ratPos.y),
    'the oldest corpse should be the one dropped when the buffer overflows',
  );

  updateCorpses(world, Date.now() + CORPSE_TTL_MS + 1);
  assert(!world.corpses.has(NODE), 'corpses past their TTL should be swept');
}

// The raise itself: cadence-gated, corpse-consuming, aggro-inheriting, and capped.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('raise-target', 600, 400), 'raise-target');
  const gravewright = world.createMonster(NODE, 'gravewright', { x: 400, y: 400 });
  assert(!!gravewright, 'gravewright should spawn');
  const spec = MONSTER_DATABASE.get('gravewright')?.raisesDead;
  assert(!!spec, 'gravewright should author raisesDead');
  const initialDelayMs = spec!.initialDelayMs ?? spec!.intervalMs;

  const rat = world.createMonster(NODE, 'plague-rat', { x: 440, y: 400 });
  assert(!!rat, 'plague rat should spawn');
  killMonster(world, player, rat!);
  const ratMaxHp = MONSTER_DATABASE.get('plague-rat')!.stats.hp;

  const t0 = Date.now();
  updateRaisers(world, t0);
  assert(
    risenOf(world, gravewright!).length === 0,
    'an un-aggroed necromancer must not raise anything',
  );

  setAggroTarget(world, gravewright!, { id: 'raise-target', kind: 'player' }, t0);
  updateRaisers(world, t0);
  assert(
    risenOf(world, gravewright!).length === 0,
    'the first tick of an aggro session only arms the timer (initial delay)',
  );
  updateRaisers(world, t0 + initialDelayMs - 1);
  assert(risenOf(world, gravewright!).length === 0, 'the raise must wait out its initial delay');

  world.takeNodeEvents(NODE);
  updateRaisers(world, t0 + initialDelayMs);
  const risen = risenOf(world, gravewright!);
  assert(risen.length === 1, 'the necromancer should raise the corpse once its delay elapses');
  assert(
    risen[0]!.isMonster.monsterTypeId === 'plague-rat',
    'the risen mob should be a copy of whatever actually died',
  );
  assert(
    risen[0]!.isMonster.name.startsWith('Risen '),
    'the risen mob should read as risen on the client',
  );
  assert(
    risen[0]!.hasHealth.maxHp === Math.round(ratMaxHp * spec!.hpMult!),
    'the risen mob should come back diminished',
  );
  assert(
    risen[0]!.hasAggroTarget?.targetId === 'raise-target',
    'the risen mob should claw up already fighting the raiser target',
  );
  assert(!world.corpses.has(NODE), 'the raise should consume the corpse it used');
  assert(
    world.takeNodeEvents(NODE).some(
      (event) => event.kind === 'ecology-pulse' && event.pulse === 'raise-dead',
    ),
    'a raise should emit its ecology pulse',
  );

  updateRaisers(world, t0 + initialDelayMs + spec!.intervalMs);
  assert(
    risenOf(world, gravewright!).length === 1,
    'with no corpse in reach the necromancer raises nothing',
  );

  // Feed it more corpses than its cap allows and run enough cadences to use them.
  for (let i = 0; i < spec!.maxAlive + 3; i++) {
    const filler = world.createMonster(NODE, 'plague-rat', { x: 420 + i * 12, y: 430 });
    if (filler) killMonster(world, player, filler);
  }
  let t = t0 + initialDelayMs + spec!.intervalMs;
  for (let i = 0; i < spec!.maxAlive + 4; i++) {
    t += spec!.intervalMs;
    updateRaisers(world, t);
  }
  assert(
    risenOf(world, gravewright!).length === spec!.maxAlive,
    `the risen population should stop at maxAlive (${spec!.maxAlive})`,
  );

  // A risen mob is worth nothing and leaves nothing behind.
  const before = JSON.stringify(player.tracksProgression);
  const corpsesBefore = (world.corpses.get(NODE) ?? []).length;
  killMonster(world, player, risenOf(world, gravewright!)[0]!);
  assert(
    JSON.stringify(player.tracksProgression) === before,
    'killing a risen mob must grant no essence, XP, catalyst or quest progress',
  );
  assert(
    (world.corpses.get(NODE) ?? []).length === corpsesBefore,
    'a risen mob must not leave a corpse of its own',
  );

  // Killing the necromancer is the only way to stop the tide.
  assert(risenOf(world, gravewright!).length > 0, 'the tide should still be standing');
  killMonster(world, player, gravewright!);
  assert(
    risenOf(world, gravewright!).length === 0,
    'every risen mob should crumble when its raiser dies',
  );
}

// A normal kill still pays, so the reward gate is the marker and nothing else.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('reward-check', 400, 400), 'reward-check');
  const rat = world.createMonster(NODE, 'plague-rat', { x: 420, y: 400 });
  assert(!!rat, 'plague rat should spawn');
  const before = player.tracksProgression.essences.purple;
  killMonster(world, player, rat!);
  assert(
    player.tracksProgression.essences.purple > before,
    'an ordinary kill must still grant its essence',
  );
}

// Shared presentation exposes the mechanic without a server round trip.
{
  const def = MONSTER_DATABASE.get('gravewright');
  assert(!!def, 'gravewright definition should exist');
  assert(!def!.bossScript, 'the gravewright should no longer fake its raises with spawn-adds');
  assert(
    describeMonsterMechanics(def!).some((line) => line.id === 'raises-dead'),
    'the bestiary should describe the raise',
  );
}

console.log('corpseRaise: ok');
