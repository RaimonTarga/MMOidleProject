/**
 * Design §18.1: a card's DoT payoff has its OWN id and ordinary refresh, and the
 * ratchet is gone.
 *
 * The ratchet was this: the card shared `cadence-hemorrhage` and refreshed by
 * taking `Math.max` of the old and new per-tick damage, so one big hit set a
 * bleed rate that every later chip hit maintained forever. Ordinary refresh means
 * this application's numbers win.
 *
 * Also pinned: both lineage ids are ticked by the one bleed driver, a spent-stack
 * bleed counts down while an intensity poison multiplies instead, and the shared
 * `hasHemorrhage` marker only leaves when every bleed has.
 *
 * Run: node --conditions=development --import tsx test/lineageDots.test.ts
 */
import assert from 'node:assert/strict';
import {
  GAME_CONFIG,
  applyStatusEffect,
  baseRecoveryForTier,
  emptyEquipment,
  getStatusEffect,
  setLineageRuntime,
  type LineageFxKey,
  type LineagePayoff,
  type LineageTrigger,
  type PacketId,
  type ResolvedLineageCard,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import type { CombatContext } from '../src/systems/combat/engine/combatPipeline';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { emitCombatEvent } from '../src/systems/combat/engine/combatPipeline';
import { updateHemorrhages } from '../src/systems/classes/archetypes/cadence/t3/ticks/hemorrhage';
import {
  CADENCE_BLEED_ID,
  LINEAGE_BLEED_ID,
  LINEAGE_POISON_ID,
} from '../src/systems/combat/damage/bleedIds';

const NODE = 'node-5-5';
let nextId = 0;

function makeSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: 'DoT Tester' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1_000, maxHp: 1_000, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      shards: {}, capstones: {},
      biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 4, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null },
  } as unknown as PersistedPlayerSlices;
}

function seededCard(opts: {
  trigger: LineageTrigger;
  payoff: LineagePayoff;
  fx?: LineageFxKey;
  lane?: PacketId;
}): ResolvedLineageCard {
  return {
    card: {
      id: `seed-dot-${++nextId}`,
      lineageId: 'rapier', tier: 1, row: 'payoff', lane: opts.lane ?? 'affliction',
      name: 'Seeded', description: '',
      fx: opts.fx ?? 'affliction.bleed-pips',
      trigger: opts.trigger.kind, payoff: opts.payoff.kind,
    },
    requiredBiomeLevel: 1,
    requiredGlobalMastery: 0,
    cost: { essence: {}, shards: {} },
    trigger: opts.trigger,
    payoff: opts.payoff,
  } as unknown as ResolvedLineageCard;
}

initCombatSystems();
const world = new World();

function spawn(id: string, cards: ResolvedLineageCard[], attack: number): PlayerEntity {
  const player = world.attachPlayerEntity(makeSlices(id), id);
  player.dealsDamage.attack = attack;
  setLineageRuntime(player.tracksCombat, { cards, capstones: [] });
  world.takeNodeEvents(NODE);
  return player;
}

function monster(x: number): MonsterEntity {
  const m = world.createMonster(NODE, 'plains-slime', { x, y: 400 });
  if (!m) throw new Error('failed to spawn a target');
  m.hasHealth.maxHp = 1_000_000;
  m.hasHealth.hp = 1_000_000;
  m.mitigatesDamage.plating = 0;
  return m;
}

function hit(player: PlayerEntity, defender: MonsterEntity, damage: number): void {
  const ctx = {
    attacker: player, attackerType: 'player',
    defender, defenderType: 'monster',
    damage, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext;
  emitCombatEvent('onHit', ctx, world);
}

// ── the ratchet is gone: a chip hit lowers the bleed rate ─────────────────────
{
  const player = spawn('dot-ratchet', [seededCard({
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'hemorrhage', magnitude: 0.4, durationMs: 4_000 },
  })], 1_000);
  const target = monster(600);

  hit(player, target, 10_000);
  const big = getStatusEffect(target.tracksCombat, LINEAGE_BLEED_ID)?.data.damagePerTick ?? 0;
  assert(big > 0, 'the first bleed should have a real per-tick damage');

  // A much weaker hit. Under the ratchet this kept the big number forever.
  player.dealsDamage.attack = 1;
  hit(player, target, 1);
  const small = getStatusEffect(target.tracksCombat, LINEAGE_BLEED_ID)?.data.damagePerTick ?? 0;
  assert(
    small < big,
    `ordinary refresh means the new application's rate wins: ${big} -> ${small}`,
  );
}

// ── the lineage bleed is NOT the cadence record ───────────────────────────────
{
  const player = spawn('dot-separate', [seededCard({
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'hemorrhage', magnitude: 0.4, durationMs: 4_000 },
  })], 500);
  const target = monster(640);

  // A finisher's bleed already on the target, with its own rate.
  const brand = applyStatusEffect(target.tracksCombat, {
    id: CADENCE_BLEED_ID,
    instanced: false,
    remainingMs: -1,
    sourceId: player.isPlayer.id,
    data: { damagePerTick: 999, nextTickIn: 1_000, tickIntervalMs: 1_000 },
  });
  brand.stacks = 4;

  hit(player, target, 100);
  assert.equal(
    getStatusEffect(target.tracksCombat, CADENCE_BLEED_ID)?.data.damagePerTick,
    999,
    'the card must not touch the cadence bleed',
  );
  assert(
    getStatusEffect(target.tracksCombat, LINEAGE_BLEED_ID) !== undefined,
    'the card writes its own record alongside it',
  );

  // The one driver ticks both, and the marker survives while either remains.
  const before = target.hasHealth.hp;
  updateHemorrhages(world, 1_000);
  assert(target.hasHealth.hp < before, 'both bleeds should tick through the one driver');
  assert(target.hasHemorrhage !== undefined, 'the marker stays while a bleed remains');
}

// ── intensity poison: stacks multiply the tick instead of counting down ───────
{
  const player = spawn('dot-poison', [seededCard({
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'poison-stack', magnitude: 0.2, durationMs: 6_000 },
    fx: 'affliction.venom-pips',
  })], 500);
  const target = monster(680);

  hit(player, target, 100);
  const first = getStatusEffect(target.tracksCombat, LINEAGE_POISON_ID);
  assert.equal(first?.stacks, 1, 'the first application is one stack');
  const perStack = first?.data.damagePerTick ?? 0;
  assert(perStack > 0, 'the poison should carry a per-stack damage');

  hit(player, target, 100);
  const second = getStatusEffect(target.tracksCombat, LINEAGE_POISON_ID);
  assert.equal(second?.stacks, 2, 'a second application stacks intensity');

  // Two stacks tick for about twice one stack, and stacks are NOT consumed.
  const before = target.hasHealth.hp;
  updateHemorrhages(world, 10_000);
  const dealt = before - target.hasHealth.hp;
  assert(dealt >= perStack * 2, `two stacks should tick for both, dealt ${dealt}`);
  assert.equal(
    getStatusEffect(target.tracksCombat, LINEAGE_POISON_ID)?.stacks,
    2,
    'an intensity poison does not spend its stacks',
  );
}

console.log('lineageDots: ok');
