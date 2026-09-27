import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  composeMinionView,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { runFormationAttack } from '../src/systems/classes/archetypes/summoner/formationAttack';

// CONDUIT PATH FX (client fx/conduitPaths.ts): the presentation signals the nine
// Conduit specializations draw from — a summon's specialization beat
// (`lastAttackEmpowered`), summon hits tagged `fromSummon`, and the Iconoclast's
// `summon-shatter` — plus a guard that every path has a strike layer.

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-clearing';
const FRAME: Record<string, 'light' | 'balanced' | 'heavy'> = {
  'summoner-balanced-t3-a': 'balanced',
  'summoner-light-t3-c': 'light',
};

function slices(id: string, specId: string, range: string): PersistedPlayerSlices {
  const frame = FRAME[specId]!;
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 10_000, maxHp: 10_000, recovery: 5 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 4, currentSkillTier: 4,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['summoner-root', `summoner-${frame}`, range, specId],
      passives: {}, selectedClass: 'summoner-root', selectedSubVariant: frame,
      selectedRange: range, combatArchetype: 'summoner',
    },
  };
}

function attach(world: World, id: string, specId: string, range = 'summoner-range-mid') {
  const player = world.attachPlayerEntity(slices(id, specId, range), id);
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  updateSummonerArchetype(world, 0, 1_000);
  return player;
}

function durableTarget(world: World, x = 520, y = 400) {
  const target = world.createMonster(NODE, 'plains-slime', { x, y });
  assert(target !== null, 'test target must exist');
  target.hasHealth.hp = 10_000_000;
  target.hasHealth.maxHp = 10_000_000;
  target.mitigatesDamage.plating = 0;
  target.mitigatesDamage.damageReduction = 0;
  return target;
}

// Marshal: a summon's opening strike on a new target is a specialization beat,
// the next swing is not (the flag never latches), and summon hits say so.
{
  const world = new World();
  const player = attach(world, 'marshal', 'summoner-balanced-t3-a');
  const target = durableTarget(world);
  const summon = world.getMinionEntity(player.summonsMinions!.minionIds[0]!)!;
  world.takeNodeEvents(NODE);

  runFormationAttack(world, player, summon, target, 2_000);
  assert(summon.performsAttack.lastAttackEmpowered === true, 'a Marshal opener should flag the summon swing');
  assert(composeMinionView(summon)?.lastAttackEmpowered === true, 'the minion view should carry the flag');
  const hits = world.takeNodeEvents(NODE).filter((e) => e.kind === 'player-hit');
  assert(hits.length > 0 && hits.every((e) => e.kind === 'player-hit' && e.fromSummon === true),
    'a summon hit should be tagged fromSummon');

  runFormationAttack(world, player, summon, target, 3_000);
  assert(summon.performsAttack.lastAttackEmpowered === false, 'the next ordinary swing must clear the flag');
}

// Iconoclast: the marked slot's deliberate detonation and a natural death both
// publish summon-shatter, flagged accordingly.
{
  const world = new World();
  const player = attach(world, 'icono', 'summoner-light-t3-c', 'summoner-range-far');
  const target = durableTarget(world, 700, 400);
  updateSummonerArchetype(world, 0, 7_000);
  const marked = player.summonsMinions!.volatileMarkedSlotId!;
  const markedMinion = world.getMinionEntity(player.summonsMinions!.minionIds[player.summonsMinions!.slotIds.indexOf(marked)]!)!;
  markedMinion.hasAttackTarget = { targetId: target.isMonster.id };
  world.takeNodeEvents(NODE);
  updateSummonerArchetype(world, 0, 9_000);
  const deliberate = world.takeNodeEvents(NODE).filter((e) => e.kind === 'summon-shatter');
  assert(deliberate.length === 1 && deliberate[0]!.kind === 'summon-shatter' && deliberate[0]!.deliberate,
    'the marked detonation should publish a deliberate summon-shatter');

  const natural = world.getMinionEntity(player.summonsMinions!.minionIds.find((id) => id && world.getMinionEntity(id))!)!;
  natural.hasHealth.hp = 0;
  updateSummonerArchetype(world, 0, 9_100);
  const burst = world.takeNodeEvents(NODE).filter((e) => e.kind === 'summon-shatter');
  assert(burst.length === 1 && burst[0]!.kind === 'summon-shatter' && !burst[0]!.deliberate,
    'a natural death should publish a non-deliberate summon-shatter');
}

// Every Conduit specialization summon type has a strike layer client-side.
{
  const src = readFileSync(join(__dirname, '../../client/src/fx/conduitPaths.ts'), 'utf8');
  const table = src.split('const STRIKES')[1]?.split('\n};')[0] ?? '';
  const keys = new Set([...table.matchAll(/^\s+'?([a-z-]+)'?:\s*\(s\)/gm)].map((m) => m[1]));
  for (const path of [
    'inquisitor', 'kilnmaster', 'iconoclast', 'marshal', 'chorister', 'ritualist',
    'covenanter-offense', 'covenanter-defense', 'champion', 'idolwright',
  ]) {
    assert(keys.has(path), `conduitPaths.ts should draw a strike for conduit-summon-${path}`);
  }
  const minionsSrc = readFileSync(join(__dirname, '../../client/src/render/minions.ts'), 'utf8');
  assert(minionsSrc.includes('playConduitStrike('), 'minions.ts should draw the Conduit strike layer');
}

console.log('conduitPathFx: ok');
