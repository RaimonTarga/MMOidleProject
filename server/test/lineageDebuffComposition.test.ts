/**
 * Design §18.1: a card's multiplier-type payoff SHARES the class mechanic's debuff
 * record and never weakens it. The stronger magnitude wins, the longer window
 * stands, the higher stack count stands.
 *
 * Both halves of this were live bugs. `applyStatusEffect` never updates `data` on
 * an existing entry, so whichever source landed FIRST owned the magnitude forever
 * — a card's weaker vulnerability silently swallowed a Cursed Finale's +30%. And
 * it DOES reset `remainingMs` for a refreshable config, so a four-second card
 * turned the finisher's PERMANENT plating strip into a four-second one and
 * dropped its stack count to one.
 *
 * Every magnitude here is seeded rather than read from authored data, so trigger-
 * rate normalisation can change the real cards without making this test lie. Each
 * case asserts a `card-fx` was pushed first: without that, "the record was not
 * weakened" would pass simply because the card never fired.
 *
 * Run: node --conditions=development --import tsx test/lineageDebuffComposition.test.ts
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
import { emitMechanicFired } from '../src/systems/combat/engine/mechanicFired';
import { effectivePlatingAfterShred } from '../src/systems/combat/damage/effectivePlating';

const NODE = 'node-5-5';
let nextId = 0;

function makeSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: 'Composition Tester' },
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
  const lane = opts.lane ?? 'empowered';
  return {
    card: {
      id: `seed-card-${++nextId}`,
      lineageId: 'hammer', tier: 1, row: 'payoff', lane,
      name: 'Seeded', description: '',
      fx: opts.fx ?? 'empowered.weak-point',
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

function spawn(id: string, cards: ResolvedLineageCard[]): PlayerEntity {
  const player = world.attachPlayerEntity(makeSlices(id), id);
  player.dealsDamage.attack = 100;
  setLineageRuntime(player.tracksCombat, { cards, capstones: [] });
  world.takeNodeEvents(NODE);
  return player;
}

function monster(x: number): MonsterEntity {
  const m = world.createMonster(NODE, 'plains-slime', { x, y: 400 });
  if (!m) throw new Error('failed to spawn a target');
  m.hasHealth.maxHp = 100_000;
  m.hasHealth.hp = 100_000;
  m.mitigatesDamage.plating = 100;
  return m;
}

function hit(player: PlayerEntity, defender: MonsterEntity): CombatContext {
  const ctx = {
    attacker: player, attackerType: 'player',
    defender, defenderType: 'monster',
    damage: 200, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext;
  emitCombatEvent('onHit', ctx, world);
  return ctx;
}

function cardFxCount(): number {
  return world.takeNodeEvents(NODE).filter((e) => e.kind === 'card-fx').length;
}

// ── vulnerability: a weaker card must not lower a stronger class brand ────────
{
  const player = spawn('comp-vuln', [seededCard({
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'vulnerability', magnitude: 0.12, durationMs: 4_000 },
  })]);
  const target = monster(600);

  applyStatusEffect(target.tracksCombat, {
    id: 'vulnerability',
    instanced: false,
    refreshable: true,
    remainingMs: 8_000,
    sourceId: player.isPlayer.id,
    data: { damageMultiplier: 1.3 },
  });

  world.takeNodeEvents(NODE);
  hit(player, target);
  assert.equal(cardFxCount(), 1, 'the card must actually fire, or this case proves nothing');

  const vuln = getStatusEffect(target.tracksCombat, 'vulnerability');
  assert.equal(vuln?.data.damageMultiplier, 1.3, 'a weaker card must not lower the brand');
  assert(
    (vuln?.remainingMs ?? 0) >= 8_000,
    `the longer window must stand, got ${vuln?.remainingMs}`,
  );
}

// ── vulnerability: a stronger card raises a weaker pre-existing record ────────
{
  const player = spawn('comp-vuln2', [seededCard({
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'vulnerability', magnitude: 0.5, durationMs: 4_000 },
  })]);
  const target = monster(640);

  applyStatusEffect(target.tracksCombat, {
    id: 'vulnerability',
    instanced: false,
    refreshable: true,
    remainingMs: 500,
    sourceId: player.isPlayer.id,
    data: { damageMultiplier: 1.01 },
  });

  world.takeNodeEvents(NODE);
  hit(player, target);
  assert.equal(cardFxCount(), 1, 'the card must actually fire');

  const vuln = getStatusEffect(target.tracksCombat, 'vulnerability');
  assert.equal(
    vuln?.data.damageMultiplier,
    1.5,
    `the card's stronger multiplier must land on the shared record, got ${vuln?.data.damageMultiplier}`,
  );
}

// ── plating-shred: a timed card never shortens the permanent strip ────────────
{
  const player = spawn('comp-shred', [seededCard({
    trigger: { kind: 'mechanic-fired' },
    payoff: { kind: 'plating-shred', magnitude: 0.05, durationMs: 4_000 },
    fx: 'empowered.plating-crack',
  })]);
  const target = monster(680);

  const brand = applyStatusEffect(target.tracksCombat, {
    id: 'plating-shred',
    instanced: false,
    maxStacks: 4,
    remainingMs: -1,
    sourceId: player.isPlayer.id,
    data: { platingReduction: 12 },
  });
  brand.stacks = 3;

  world.takeNodeEvents(NODE);
  const ctx = hit(player, target);
  emitMechanicFired(world, player, ctx);
  assert.equal(cardFxCount(), 1, 'the mechanic-fired card must actually fire');

  const shred = getStatusEffect(target.tracksCombat, 'plating-shred');
  assert.equal(shred?.remainingMs, -1, 'a timed card must not un-permanent the brand');
  assert((shred?.stacks ?? 0) >= 3, `the stack count must stand, got ${shred?.stacks}`);
  assert(
    (shred?.data.platingReduction ?? 0) >= 12,
    `the stronger per-stack strip must stand, got ${shred?.data.platingReduction}`,
  );
  assert((shred?.maxStacks ?? 0) >= 4, `the stack cap must stand, got ${shred?.maxStacks}`);
}

// ── a card on a clean target still applies its own value ─────────────────────
{
  const player = spawn('comp-clean', [seededCard({
    trigger: { kind: 'mechanic-fired' },
    payoff: { kind: 'plating-shred', magnitude: 0.2, durationMs: 4_000 },
    fx: 'empowered.plating-crack',
  })]);
  const target = monster(720);

  world.takeNodeEvents(NODE);
  const ctx = hit(player, target);
  emitMechanicFired(world, player, ctx);
  assert.equal(cardFxCount(), 1, 'the card must fire on a clean target');

  const shred = getStatusEffect(target.tracksCombat, 'plating-shred');
  assert(shred !== undefined, 'the card must apply on a clean target');
  assert(
    (shred?.data.platingReduction ?? 0) > 0,
    'the card should resolve a real plating reduction of its own',
  );
  assert.notEqual(shred?.remainingMs, -1, "the card's own application is timed, not permanent");
}

// ── plating-shred: the card's TOTAL is not multiplied by the record's stacks ──
//
// `effectivePlatingAfterShred` reads the shared record as stacks × platingReduction.
// A card's fraction resolves to the whole strip it promises, so writing that total
// into `platingReduction` made the cadence finisher's three-stack brand strip three
// times what the card authored — the record's stack count silently amplifying a
// number that was never per-stack.
{
  const player = spawn('comp-shred-total', [seededCard({
    trigger: { kind: 'mechanic-fired' },
    payoff: { kind: 'plating-shred', magnitude: 0.3, durationMs: 4_000 },
    fx: 'empowered.plating-crack',
  })]);
  const target = monster(760); // 100 plating

  // A three-stack brand that strips little per stack, so the CARD is the stronger
  // source here and its own total is what has to land.
  const brand = applyStatusEffect(target.tracksCombat, {
    id: 'plating-shred',
    instanced: false,
    maxStacks: 4,
    remainingMs: -1,
    sourceId: player.isPlayer.id,
    data: { platingReduction: 2 },
  });
  brand.stacks = 3;

  world.takeNodeEvents(NODE);
  const ctx = hit(player, target);
  emitMechanicFired(world, player, ctx);
  assert.equal(cardFxCount(), 1, 'the card must actually fire, or this case proves nothing');

  assert.equal(
    effectivePlatingAfterShred(target.mitigatesDamage.plating, target.tracksCombat),
    70,
    '30% of 100 plating is a 30-point strip however many stacks the shared record carries',
  );
}

// ── and a card weaker than the whole brand leaves the brand's total alone ─────
{
  const player = spawn('comp-shred-weak', [seededCard({
    trigger: { kind: 'mechanic-fired' },
    payoff: { kind: 'plating-shred', magnitude: 0.05, durationMs: 4_000 },
    fx: 'empowered.plating-crack',
  })]);
  const target = monster(800); // 100 plating

  const brand = applyStatusEffect(target.tracksCombat, {
    id: 'plating-shred',
    instanced: false,
    maxStacks: 4,
    remainingMs: -1,
    sourceId: player.isPlayer.id,
    data: { platingReduction: 12 },
  });
  brand.stacks = 3;

  world.takeNodeEvents(NODE);
  const ctx = hit(player, target);
  emitMechanicFired(world, player, ctx);
  assert.equal(cardFxCount(), 1, 'the card must actually fire');

  assert.equal(
    effectivePlatingAfterShred(target.mitigatesDamage.plating, target.tracksCombat),
    100 - 36,
    "a 5-point card must not lower the brand's 3 × 12 strip",
  );
}

console.log('lineageDebuffComposition: ok');
