/**
 * The packet keystones, wired (progression rework, design §4 as amended
 * 2026-10-01; nine of them since §22's Technique packet).
 *
 * WHAT THIS PINS. Not balance — every magnitude here is fabricated, because the
 * real ones come from the magnitude table and move with every tuning pass. What
 * it pins is that each rule is CONNECTED to the seam it claims, and that each
 * rule's own BOUND holds:
 *
 *   Chain       links on, and stops on a dodge and on an empty neighbourhood
 *   Shockwave   lands inside the footprint and nowhere else
 *   Festering   holds a duration while hits land, and resumes decay when they stop
 *   Ladder      slow → root → stun, one rung per hit, once per rung per target
 *   Refund      readies each of the five roots through its own slice
 *   Always First one emission per body, and never the empowered flag
 *   Immovable   refuses a knockback while a bulwark stance is standing
 *   Unbroken    keeps the recharge delay from restarting above half health
 *   Signature   one emission per landed Technique, never for a Guard, never the flag
 *
 * Keystone cards are seeded straight onto the runtime cache rather than bought:
 * the T3 band's cards are authored by a separate task, and the rules are owed
 * whether or not a particular lineage has authored its flavour of them yet
 * (`coverage.test.ts` pins the authoring half).
 *
 * Run: node --conditions=development --import tsx test/keystones.test.ts
 */
import {
  ABILITY_DATABASE,
  ABILITY_ROOT_EFFECT_ID,
  GAME_CONFIG,
  KEYSTONE_DEFINITIONS,
  PACKET_IDS,
  applyStatusEffect,
  baseRecoveryForTier,
  emptyEquipment,
  getFlag,
  getStatusEffect,
  initAppliesDots,
  initUsesCadence,
  initUsesCooldown,
  initUsesEnergy,
  initUsesReload,
  keystoneFxKey,
  lineageUnit,
  setCounter,
  setLineageRuntime,
  tickCooldowns,
  type CombatEvent,
  type PacketId,
  type ResolvedLineageCard,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { attachComponent } from '../src/ecs/markerHelpers';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { emitCombatEvent, type CombatContext } from '../src/systems/combat/engine/combatPipeline';
import { registerMechanicFiredListener } from '../src/systems/combat/engine/mechanicFired';
import { updateCombatState } from '../src/systems/combat/engine/combatState';
import { applyMonsterSlow } from '../src/systems/combat/status/monsterControl';
import { STUN_EFFECT } from '../src/systems/combat/status/stun';
import { pushPlayer } from '../src/systems/combat/damage/forcedMovement';
import {
  KEYSTONE_MODULES, keystoneModule, refundedDotFillPending,
} from '../src/systems/combat/keystones';
import { onTechniqueResolved } from '../src/systems/combat/techniqueResolved';
import { DOT_EFFECT_ID } from '../src/systems/classes/archetypes/dot/t3/core/constants';
import { applyClassDotStack } from '../src/systems/classes/archetypes/dot/dotPrototype';
import {
  getUndamagedMs, runBarrierRecharge, stampBarrierDamage, syncBarrier,
} from '../src/systems/defense/barrier/barrier';
import { getReactivePlatingStacks, runReactivePlating } from '../src/systems/defense/mitigation/reactivePlating';
import { runStationaryDr } from '../src/systems/defense/mitigation/stationaryDr';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

function makeSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: baseRecoveryForTier(0),
    },
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
    holdsInventory: { inventory: [], equipment: { ...emptyEquipment() }, itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

initCombatSystems();
const world = new World();

let nextId = 0;

/**
 * The player's active keystone card of a lane, as the runtime sees it: row
 * `keystone`, the lane's own fx key, and the payoff kind the keystone definition
 * names (so `keystoneShare` reads the magnitude off the card, which is the live
 * contract).
 */
function keystoneCard(lane: PacketId, magnitude = 0.5): ResolvedLineageCard {
  const definition = KEYSTONE_DEFINITIONS.get(lane)!;
  const payoffKind = definition.payoff ?? 'echo-hit';
  return {
    card: {
      id: `seed-keystone-${lane}-${++nextId}`,
      lineageId: 'rapier', tier: 3, row: 'keystone', lane,
      name: definition.name, description: definition.rule,
      fx: keystoneFxKey(lane),
      trigger: 'hit-nth', payoff: payoffKind,
    },
    requiredBiomeLevel: 14,
    requiredGlobalMastery: 0,
    cost: { essence: {}, shards: {} },
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: payoffKind, magnitude },
  };
}

/** An ordinary payoff row, for the cards a keystone changes the behaviour of. */
function payoffCard(lane: PacketId, payoff: 'echo-hit', magnitude: number): ResolvedLineageCard {
  return {
    card: {
      id: `seed-payoff-${lane}-${++nextId}`,
      lineageId: 'rapier', tier: 1, row: 'payoff', lane,
      name: 'Seeded', description: '',
      fx: 'tempo.ghost-strike',
      trigger: 'hit-nth', payoff,
    },
    requiredBiomeLevel: 4,
    requiredGlobalMastery: 0,
    cost: { essence: {}, shards: {} },
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: payoff, magnitude },
  };
}

function spawn(id: string, cards: ResolvedLineageCard[] = []): PlayerEntity {
  const player = world.attachPlayerEntity(makeSlices(id), id);
  player.dealsDamage.attack = 100;
  if (cards.length > 0) setLineageRuntime(player.tracksCombat, { cards, capstones: [] });
  world.takeNodeEvents(NODE);
  return player;
}

function monster(x: number, y = 400, typeId = 'plains-slime'): MonsterEntity {
  const m = world.createMonster(NODE, typeId, { x, y });
  if (!m) throw new Error(`failed to spawn ${typeId}`);
  m.hasHealth.maxHp = 100_000;
  m.hasHealth.hp = 100_000;
  return m;
}

function hit(
  player: PlayerEntity,
  defender: MonsterEntity,
  metadata: Record<string, unknown> = {},
  damage = 200,
): CombatContext {
  const ctx = {
    attacker: player, attackerType: 'player',
    defender, defenderType: 'monster',
    damage, platingMult: 1, drPierce: 0, cancelled: false, metadata,
  } as unknown as CombatContext;
  emitCombatEvent('onHit', ctx, world);
  return ctx;
}

function kill(player: PlayerEntity, defender: MonsterEntity): void {
  const ctx = {
    attacker: player, attackerType: 'player',
    defender, defenderType: 'monster',
    damage: 200, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext;
  emitCombatEvent('onKill', ctx, world);
}

function taken(
  player: PlayerEntity,
  attacker: MonsterEntity,
  damage = 50,
): CombatContext {
  const ctx = {
    attacker, attackerType: 'monster',
    defender: player, defenderType: 'player',
    damage, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext;
  emitCombatEvent('onDamageTaken', ctx, world);
  return ctx;
}

function cardFx(): Array<Extract<CombatEvent, { kind: 'card-fx' }>> {
  return world.takeNodeEvents(NODE)
    .filter((e): e is Extract<CombatEvent, { kind: 'card-fx' }> => e.kind === 'card-fx');
}

function keystoneFx(lane: PacketId): Array<Extract<CombatEvent, { kind: 'card-fx' }>> {
  return cardFx().filter((e) => e.fx === keystoneFxKey(lane));
}

// ── The registry: eight rules, one per packet ────────────────────────────────

{
  assert(
    KEYSTONE_MODULES.size === PACKET_IDS.length,
    `${KEYSTONE_MODULES.size} keystone modules for ${PACKET_IDS.length} packets`,
  );
  for (const lane of PACKET_IDS) {
    const module = keystoneModule(lane);
    assert(!!module, `packet '${lane}' has no keystone runtime`);
    const definition = KEYSTONE_DEFINITIONS.get(lane);
    assert(!!definition, `packet '${lane}' has no keystone definition`);
    assert(
      module!.id === definition!.id,
      `lane '${lane}': module '${module!.id}' against definition '${definition!.id}'`,
    );
    assert(module!.seam.length > 0, `keystone '${module!.id}': names no seam`);
  }
}

// ── A keystone card never fires as an ordinary payoff ────────────────────────
//
// Its authored trigger/payoff pair is there because every non-stat row must do
// something the moment it is bought; what a keystone does is the rule. Firing it
// through the payoff dispatch as well would pay the lane twice for one card.

{
  const player = spawn('ks-no-double', [keystoneCard('affliction', 0.5)]);
  const target = monster(1200, 1200);
  const before = target.hasHealth.hp;
  hit(player, target);
  assert(target.hasHealth.hp === before, 'a keystone row must not fire its authored payoff');
  assert(
    keystoneFx('affliction').length === 0,
    'a keystone with nothing to hold draws nothing',
  );
}

// ── TEMPO / Chain ────────────────────────────────────────────────────────────

{
  // Three bodies in a line, 60 apart: each is inside the next one's reach.
  const player = spawn('ks-chain', [
    payoffCard('tempo', 'echo-hit', 0.5),
    keystoneCard('tempo', 0.5),
  ]);
  const primary = monster(2000, 2000);
  const second = monster(2060, 2000);
  const third = monster(2120, 2000);
  player.hasPosition.current = { x: 1960, y: 2000 };

  const hp = [primary, second, third].map((m) => m.hasHealth.hp);
  hit(player, primary);
  assert(primary.hasHealth.hp < hp[0]!, 'the echo itself must still land on the primary');
  assert(second.hasHealth.hp < hp[1]!, 'Chain must jump to a fresh body in reach');
  assert(third.hasHealth.hp < hp[2]!, 'Chain must keep going while fresh bodies are in reach');
  const links = keystoneFx('tempo');
  assert(links.length === 2, `two links, two effects — got ${links.length}`);
  assert(links[0]!.stacks === 1 && links[1]!.stacks === 2, 'a link reports its index');
}

{
  // The bound: no fresh target in reach. One body, nothing to chain to.
  const player = spawn('ks-chain-alone', [
    payoffCard('tempo', 'echo-hit', 0.5),
    keystoneCard('tempo', 0.5),
  ]);
  const lone = monster(3000, 3000);
  player.hasPosition.current = { x: 2960, y: 3000 };
  hit(player, lone);
  assert(keystoneFx('tempo').length === 0, 'Chain must stop when no fresh body is in reach');
}

{
  // The bound: a miss. The one neighbour is evasive and its deterministic dodge
  // clock is primed to cross on the next roll, so the link whiffs and the chain
  // is over — the body behind it is never touched.
  const player = spawn('ks-chain-evade', [
    payoffCard('tempo', 'echo-hit', 0.5),
    keystoneCard('tempo', 0.5),
  ]);
  const primary = monster(4000, 4000);
  const dodger = monster(4060, 4000, 'mire-stalker');
  const behind = monster(4120, 4000);
  player.hasPosition.current = { x: 3960, y: 4000 };
  dodger.hasHealth.maxHp = 100_000;
  dodger.hasHealth.hp = 100_000;
  setCounter(dodger.tracksCombat, 'evadeAcc', 0.99);

  const dodgerHp = dodger.hasHealth.hp;
  const behindHp = behind.hasHealth.hp;
  hit(player, primary);
  assert(dodger.hasHealth.hp === dodgerHp, 'a dodged link deals nothing');
  assert(behind.hasHealth.hp === behindHp, 'a dodged link ends the chain');
  assert(keystoneFx('tempo').length === 0, 'a chain that landed no link draws nothing');
}

// ── EMPOWERED / Shockwave ────────────────────────────────────────────────────

{
  const player = spawn('ks-shockwave', [keystoneCard('empowered', 0.5)]);
  const target = monster(5000, 5000);
  const near = monster(5050, 5000);
  const far = monster(5600, 5000);
  player.hasPosition.current = { x: 4960, y: 5000 };

  const targetHp = target.hasHealth.hp;
  const nearHp = near.hasHealth.hp;
  const farHp = far.hasHealth.hp;
  hit(player, target, { empoweredAttack: true, empoweredMultiplier: 2 }, 400);

  assert(near.hasHealth.hp < nearHp, 'Shockwave must hit a body inside the footprint');
  assert(far.hasHealth.hp === farHp, 'Shockwave must not reach outside the footprint');
  assert(target.hasHealth.hp === targetHp, 'the primary already took the hit — it is excluded');
  const drawn = keystoneFx('empowered');
  assert(drawn.length === 1, `one area hit, one effect — got ${drawn.length}`);
  assert(drawn[0]!.targetId === target.isMonster.id, 'the ring is drawn where the area was');
}

{
  // An ordinary hit spends no mechanic, so there is no shockwave.
  const player = spawn('ks-shockwave-plain', [keystoneCard('empowered', 0.5)]);
  const target = monster(6000, 6000);
  const near = monster(6050, 6000);
  const nearHp = near.hasHealth.hp;
  hit(player, target, {}, 400);
  assert(near.hasHealth.hp === nearHp, 'only the hit that SPENT the mechanic becomes an area hit');
  assert(keystoneFx('empowered').length === 0, 'and it draws nothing on an ordinary hit');
}

{
  // One multiplier per hit: the area hit is a share of the hit as it was BEFORE
  // the empowered multiplier, exactly like every other payoff that rides one.
  const player = spawn('ks-shockwave-basis', [keystoneCard('empowered', 1)]);
  const plainTarget = monster(7000, 7000);
  const plainNear = monster(7050, 7000);
  const plainBefore = plainNear.hasHealth.hp;
  hit(player, plainTarget, { empoweredAttack: true }, 400);
  const plainSplash = plainBefore - plainNear.hasHealth.hp;
  cardFx();

  const empTarget = monster(8000, 8000);
  const empNear = monster(8050, 8000);
  const empBefore = empNear.hasHealth.hp;
  hit(player, empTarget, { empoweredAttack: true, empoweredMultiplier: 2 }, 400);
  const empSplash = empBefore - empNear.hasHealth.hp;
  cardFx();
  assert(
    empSplash < plainSplash,
    `an area hit on an empowered hit must scale the PRE-multiplier hit`
      + ` (plain ${plainSplash}, empowered ${empSplash})`,
  );
}

// ── AFFLICTION / Festering ───────────────────────────────────────────────────

function seedDot(player: PlayerEntity, target: MonsterEntity, durationMs: number): void {
  const effect = applyStatusEffect(target.tracksCombat, {
    id: DOT_EFFECT_ID,
    maxStacks: 5,
    remainingMs: durationMs,
    refreshable: true,
    sourceId: player.isPlayer.id,
    data: { damagePerStack: 1, nextTickIn: 1000, tickIntervalMs: 1000 },
  });
  effect.stacks = 3;
}

{
  // Held: a hit every tick, and the duration does not move.
  const player = spawn('ks-fester', [keystoneCard('affliction')]);
  const target = monster(9000, 9000);
  seedDot(player, target, 3000);

  for (let i = 0; i < 10; i++) {
    hit(player, target);
    updateCombatState(world, 100);
  }
  const held = getStatusEffect(target.tracksCombat, DOT_EFFECT_ID);
  assert(!!held, 'a held DoT must still be on the target after its own duration');
  assert(
    held!.remainingMs === 3000,
    `a held duration must not tick down — ${held!.remainingMs} of 3000 left`,
  );
  // One effect on the hit that OPENED the hold, and not one per tick.
  const drawn = keystoneFx('affliction');
  assert(drawn.length === 1, `one effect for the hold, not one per tick — got ${drawn.length}`);
}

{
  // The bound: the hits stop and the decay resumes.
  const player = spawn('ks-fester-stop', [keystoneCard('affliction')]);
  const target = monster(10_000, 10_000);
  seedDot(player, target, 3000);

  hit(player, target);
  updateCombatState(world, 100);
  const afterHit = getStatusEffect(target.tracksCombat, DOT_EFFECT_ID)!.remainingMs;
  assert(afterHit === 3000, `the hit must hold the first tick — got ${afterHit}`);

  // The window is the player's own DoT tick interval; past it, decay resumes.
  for (let i = 0; i < 20; i++) updateCombatState(world, 100);
  const afterLull = getStatusEffect(target.tracksCombat, DOT_EFFECT_ID)!.remainingMs;
  assert(
    afterLull < afterHit,
    `the duration must decay again once the hits stop (${afterLull} of ${afterHit})`,
  );
}

{
  // No keystone: ordinary decay, hits or no hits.
  const player = spawn('ks-fester-none');
  const target = monster(11_000, 11_000);
  seedDot(player, target, 3000);
  for (let i = 0; i < 5; i++) {
    hit(player, target);
    updateCombatState(world, 100);
  }
  const effect = getStatusEffect(target.tracksCombat, DOT_EFFECT_ID)!;
  assert(effect.remainingMs === 2500, `without the keystone the duration ticks — got ${effect.remainingMs}`);
}

// ── CONTROL / Ladder ─────────────────────────────────────────────────────────

{
  const player = spawn('ks-ladder', [keystoneCard('control')]);
  const target = monster(12_000, 12_000);
  const playerId = player.isPlayer.id;

  // Nothing on the target: the ladder has no rung to climb from.
  hit(player, target);
  assert(keystoneFx('control').length === 0, 'the ladder needs the lane\'s own slow to climb from');

  applyMonsterSlow(world, target, 0.2, 4000, playerId);
  world.takeNodeEvents(NODE);

  hit(player, target);
  const root = getStatusEffect(target.tracksCombat, ABILITY_ROOT_EFFECT_ID);
  assert(!!root && root.sourceId === playerId, 'hitting a slowed target applies the root');
  const rootFx = keystoneFx('control');
  assert(rootFx.length === 1 && rootFx[0]!.stacks === 1, 'the root rung draws once');

  hit(player, target);
  const stun = getStatusEffect(target.tracksCombat, STUN_EFFECT);
  assert(!!stun, 'hitting a rooted target applies the stun');
  const stunFx = keystoneFx('control');
  assert(stunFx.length === 1 && stunFx[0]!.stacks === 2, 'the stun rung draws once');

  // The bound: once per step per target. Both rungs are spent, so further hits
  // into the same body climb nothing, even with the slow and root still on it.
  hit(player, target);
  hit(player, target);
  assert(keystoneFx('control').length === 0, 'each rung climbs once per target');
}

{
  // A second body climbs its own ladder — the latch is per target, not per player.
  const player = spawn('ks-ladder-second', [keystoneCard('control')]);
  const first = monster(13_000, 13_000);
  const second = monster(13_400, 13_000);
  applyMonsterSlow(world, first, 0.2, 4000, player.isPlayer.id);
  applyMonsterSlow(world, second, 0.2, 4000, player.isPlayer.id);
  world.takeNodeEvents(NODE);

  hit(player, first);
  hit(player, second);
  assert(
    getStatusEffect(second.tracksCombat, ABILITY_ROOT_EFFECT_ID) !== undefined,
    'a fresh body starts at the bottom of its own ladder',
  );
  assert(keystoneFx('control').length === 2, 'one rung each, two effects');
}

// ── KILL CHAIN / Refund ──────────────────────────────────────────────────────

{
  const player = spawn('ks-refund-cadence', [keystoneCard('kill-chain')]);
  attachComponent(world, player, 'usesCadence', initUsesCadence({ threshold: 5 }));
  player.usesCadence!.count = 2;
  const target = monster(14_000, 14_000);
  kill(player, target);
  assert(player.hasEmpoweredAttack !== undefined, 'a kill readies cadence\'s finisher');
  assert(player.usesCadence!.count === 0, 'and resets its counter');
  assert(keystoneFx('kill-chain').length === 1, 'a refund draws once');
}

{
  const player = spawn('ks-refund-cooldown', [keystoneCard('kill-chain')]);
  attachComponent(world, player, 'usesCooldown', initUsesCooldown());
  player.usesCooldown!.initialized = true;
  player.usesCooldown!.executionCooldownMs = 5000;
  kill(player, monster(15_000, 15_000));
  assert(player.usesCooldown!.executionCooldownMs === 0, 'a kill clears the execution recharge');
}

{
  const player = spawn('ks-refund-energy', [keystoneCard('kill-chain')]);
  attachComponent(world, player, 'usesEnergy', initUsesEnergy());
  player.usesEnergy!.energy = 10;
  player.usesEnergy!.energyMax = 100;
  kill(player, monster(16_000, 16_000));
  assert(player.usesEnergy!.energy === 100, 'a kill fills the energy pool to its cap');
}

{
  const player = spawn('ks-refund-reload', [keystoneCard('kill-chain')]);
  attachComponent(world, player, 'usesReload', initUsesReload({ ammoMax: 6 }));
  player.usesReload!.ammo = 0;
  player.usesReload!.reloadingMs = 500;
  kill(player, monster(17_000, 17_000));
  assert(player.usesReload!.ammo === 6, 'a kill completes the reload');
  assert(player.usesReload!.reloadingMs === 0, 'and the clip is no longer coming back');
}

{
  const player = spawn('ks-refund-dot', [keystoneCard('kill-chain')]);
  attachComponent(world, player, 'appliesDots', initAppliesDots());
  kill(player, monster(18_000, 18_000));
  assert(refundedDotFillPending(player.tracksCombat), 'a kill arms a full DoT fill');

  const target = monster(18_400, 18_000);
  applyClassDotStack(world, player, target);
  const dot = getStatusEffect(target.tracksCombat, DOT_EFFECT_ID);
  assert(!!dot, 'the application still lands its stack');
  assert(dot!.stacks === dot!.maxStacks, `the next hit counts as max stacks — got ${dot!.stacks}/${dot!.maxStacks}`);
  assert(!refundedDotFillPending(player.tracksCombat), 'and the fill is spent, once');

  const fresh = monster(18_800, 18_000);
  applyClassDotStack(world, player, fresh);
  const second = getStatusEffect(fresh.tracksCombat, DOT_EFFECT_ID)!;
  assert(second.stacks === 1, `only the NEXT hit is a full fill — got ${second.stacks}`);
}

{
  // No keystone, no refund.
  const player = spawn('ks-refund-none');
  attachComponent(world, player, 'usesCooldown', initUsesCooldown());
  player.usesCooldown!.initialized = true;
  player.usesCooldown!.executionCooldownMs = 5000;
  kill(player, monster(19_000, 19_000));
  assert(player.usesCooldown!.executionCooldownMs === 5000, 'a kill refunds nothing without the keystone');
}

// ── ENGAGEMENT / Always First ────────────────────────────────────────────────

const _mechanicFires: string[] = [];
registerMechanicFiredListener((_world, player) => { _mechanicFires.push(player.isPlayer.id); });

{
  const player = spawn('ks-first', [keystoneCard('engagement')]);
  const first = monster(20_000, 20_000);
  const second = monster(20_400, 20_000);
  _mechanicFires.length = 0;

  hit(player, first);
  assert(_mechanicFires.length === 1, `the first hit on a body counts as the mechanic firing — got ${_mechanicFires.length}`);
  assert(player.hasEmpoweredAttack === undefined, 'and must NOT arm the empowered flag');
  assert(keystoneFx('engagement').length === 1, 'one opener, one effect');

  hit(player, first);
  hit(player, first);
  assert(_mechanicFires.length === 1, 'and only the first hit on that body');
  assert(keystoneFx('engagement').length === 0, 'and draws nothing after the opener');

  hit(player, second);
  assert(_mechanicFires.length === 2, 'each NEW body is a fresh opener');
  assert(keystoneFx('engagement').length === 1, 'and draws once for it');
}

{
  // A hit that genuinely fired the root's own mechanic emits once, not twice.
  const player = spawn('ks-first-latch', [keystoneCard('engagement')]);
  const target = monster(21_000, 21_000);
  _mechanicFires.length = 0;
  hit(player, target, { mechanicFired: true });
  assert(_mechanicFires.length === 0, 'the moment had already been announced on this exchange');
  assert(keystoneFx('engagement').length === 0, 'so the keystone draws nothing');
}

// ── BULWARK / Immovable ──────────────────────────────────────────────────────

/** A player holding a bulwark stance: one reactive-plating stack, earned. */
function withPlatingStack(id: string, cards: ResolvedLineageCard[]): PlayerEntity {
  const player = spawn(id, cards);
  player.usesSkills.passives['defense.hit-plating-per-stack'] = 5;
  player.usesSkills.passives['defense.hit-plating-max-stacks'] = 3;
  player.usesSkills.passives['defense.hit-plating-duration-ms'] = 3000;
  const attacker = monster(22_000 + nextId, 22_000);
  taken(player, attacker);
  world.takeNodeEvents(NODE);
  assert(getReactivePlatingStacks(player) === 1, `${id}: expected one plating stack`);
  return player;
}

{
  const player = withPlatingStack('ks-immovable', [keystoneCard('bulwark')]);
  const from = { x: player.hasPosition.current.x - 50, y: player.hasPosition.current.y };
  const before = { ...player.hasPosition.current };

  const result = pushPlayer(world, player, from, 200);
  assert(result === null, 'Immovable refuses a knockback outright');
  assert(
    player.hasPosition.current.x === before.x && player.hasPosition.current.y === before.y,
    'and the player does not move',
  );
  assert(keystoneFx('bulwark').length === 1, 'a refusal draws once');
}

{
  // The bound: no stance standing, no refusal. Same player, stacks cleared.
  const player = spawn('ks-immovable-bare', [keystoneCard('bulwark')]);
  const from = { x: player.hasPosition.current.x - 50, y: player.hasPosition.current.y };
  const before = { ...player.hasPosition.current };
  const result = pushPlayer(world, player, from, 200);
  assert(result !== null, 'with nothing standing the push lands');
  assert(player.hasPosition.current.x !== before.x, 'and the player is moved');
  assert(keystoneFx('bulwark').length === 0, 'and the keystone draws nothing');
}

{
  // And without the keystone, a bulwark stance is no protection at all.
  const player = withPlatingStack('ks-immovable-none', []);
  const from = { x: player.hasPosition.current.x - 50, y: player.hasPosition.current.y };
  const before = { ...player.hasPosition.current };
  assert(pushPlayer(world, player, from, 200) !== null, 'without the keystone the push lands');
  assert(player.hasPosition.current.x !== before.x, 'and the player is moved');
}

{
  // The OTHER half of Immovable: plating stacks persist for the grace after the
  // player moves, and then stop. Regression — the movement clock used to be kept
  // inside `runStationaryDr` below its early returns, so this player (who wears
  // no stationary-DR item) never advanced it: the hold did nothing, and a clock
  // left frozen inside the grace held the stacks against the fade forever.
  const player = withPlatingStack('ks-immovable-hold', [keystoneCard('bulwark')]);
  assert(
    player.usesSkills.passives['defense.stationary-dr-pct'] === undefined,
    'the hold must not need a stance item',
  );
  // Past the stacks' own hold window, so only the keystone can be keeping them.
  tickCooldowns(player.tracksCombat, 4000);
  const grace = lineageUnit('immovableGraceMs');

  // Moving, inside the grace: held.
  for (let elapsed = 0; elapsed < grace - 200; elapsed += 100) {
    player.hasPosition.current.x += 1;
    runStationaryDr(world, player, 100);
    runReactivePlating(world, player, 100);
  }
  assert(
    getReactivePlatingStacks(player) === 1,
    'Immovable holds the plating stack through the grace after moving',
  );

  // Still moving, past the grace: the fade runs again.
  for (let elapsed = 0; elapsed < 4000; elapsed += 100) {
    player.hasPosition.current.x += 1;
    runStationaryDr(world, player, 100);
    runReactivePlating(world, player, 100);
  }
  assert(
    getReactivePlatingStacks(player) === 0,
    'and past the grace the stack fades — the hold is a window, not immunity',
  );
}

// ── BARRIER TEMPO / Unbroken ─────────────────────────────────────────────────

function withBarrier(id: string, cards: ResolvedLineageCard[]): PlayerEntity {
  const player = spawn(id, cards);
  player.usesSkills.passives['defense.barrier-pct'] = 0.2;
  player.usesSkills.passives['defense.barrier-delay-ms'] = 4000;
  player.usesSkills.passives['defense.barrier-recharge-pct'] = 0.25;
  syncBarrier(world, player);
  assert(!!player.hasBarrier, `${id}: expected a barrier`);
  return player;
}

{
  const player = withBarrier('ks-unbroken', [keystoneCard('barrier-tempo')]);
  player.hasBarrier!.current = 0;
  // Four seconds without damage: the recharge is ready to run.
  for (let i = 0; i < 40; i++) runBarrierRecharge(world, player, 100);
  const climbing = player.hasBarrier!.current;
  assert(climbing > 0, 'the barrier should be refilling before the hit');

  stampBarrierDamage(world, player);
  assert(
    getUndamagedMs(player.tracksCombat) > 0,
    'above half health a hit must not restart the recharge delay',
  );
  runBarrierRecharge(world, player, 100);
  assert(player.hasBarrier!.current > climbing, 'and the barrier keeps recharging through it');
}

{
  // The bound: at or below half health the rule switches off.
  const player = withBarrier('ks-unbroken-low', [keystoneCard('barrier-tempo')]);
  player.hasHealth.hp = Math.floor(player.hasHealth.maxHp * 0.4);
  for (let i = 0; i < 40; i++) runBarrierRecharge(world, player, 100);
  stampBarrierDamage(world, player);
  assert(
    getUndamagedMs(player.tracksCombat) === 0,
    'below half health a hit restarts the delay as it always did',
  );
}

{
  // And without the keystone, every hit restarts it.
  const player = withBarrier('ks-unbroken-none', []);
  for (let i = 0; i < 40; i++) runBarrierRecharge(world, player, 100);
  stampBarrierDamage(world, player);
  assert(getUndamagedMs(player.tracksCombat) === 0, 'no keystone, no hold');
}

// ── Ownership: a keystone never acts on another player's work ────────────────

{
  const mine = spawn('ks-own-mine', [keystoneCard('control')]);
  const theirs = spawn('ks-own-theirs');
  const target = monster(24_000, 24_000);
  applyMonsterSlow(world, target, 0.2, 4000, theirs.isPlayer.id);
  world.takeNodeEvents(NODE);
  hit(mine, target);
  assert(
    getStatusEffect(target.tracksCombat, ABILITY_ROOT_EFFECT_ID) === undefined,
    'the ladder climbs the player\'s OWN slow, not an ally\'s',
  );
  assert(getFlag(target.tracksCombat, `keystone.ladder.root.${mine.isPlayer.id}`) === false,
    'and spends no rung doing nothing');
}

// ── TECHNIQUE / Signature (design §22) ───────────────────────────────────────
//
// The rule is a RE-LABELLING, not an effect: a landed Technique counts as the
// class mechanic firing. So what is pinned is the emission (once per cast), what
// it must never do (arm the empowered flag, fire for a Guard), and the latch.

const SWEEP = ABILITY_DATABASE.get('sweep')!;
const SECOND_WIND = ABILITY_DATABASE.get('second-wind')!;
assert(SWEEP?.slot === 'technique', 'fixture: Sweep is a Technique');
assert(SECOND_WIND?.slot === 'guard', 'fixture: Second Wind is a Guard');

{
  const player = spawn('ks-signature', [keystoneCard('technique')]);
  const target = monster(26_000, 26_000);
  _mechanicFires.length = 0;

  onTechniqueResolved(world, player, SWEEP, { target });
  assert(_mechanicFires.length === 1, `a landed Technique counts as the mechanic firing — got ${_mechanicFires.length}`);
  assert(player.hasEmpoweredAttack === undefined, 'and must NOT arm the empowered flag');
  assert(keystoneFx('technique').length === 1, 'one cast, one effect');

  // Once per cast, not once per pull: a second Technique is a second moment.
  onTechniqueResolved(world, player, SWEEP, { target });
  assert(_mechanicFires.length === 2, 'each cast that resolves is its own moment');
  assert(keystoneFx('technique').length === 1, 'and draws once for it');
}

{
  // NEVER for a Guard. A Guard has `guard-cast`; an offensive lane firing off a
  // defensive cast would be defence scaling offence (design-bible §1).
  const player = spawn('ks-signature-guard', [keystoneCard('technique')]);
  _mechanicFires.length = 0;
  onTechniqueResolved(world, player, SECOND_WIND);
  assert(_mechanicFires.length === 0, 'a Guard never fires the Technique keystone');
  assert(keystoneFx('technique').length === 0, 'and draws nothing');
}

{
  // Without the keystone, a Technique is just a Technique.
  const player = spawn('ks-signature-none');
  _mechanicFires.length = 0;
  onTechniqueResolved(world, player, SWEEP);
  assert(_mechanicFires.length === 0, 'no keystone, no re-labelling');
  assert(keystoneFx('technique').length === 0, 'and no effect');
}

{
  // A Technique landing on the very hit that spent the root's own mechanic
  // announces it once, not twice — and the keystone draws nothing, because the
  // moment had already happened.
  const player = spawn('ks-signature-latch', [keystoneCard('technique')]);
  const target = monster(27_000, 27_000);
  const ctx = {
    attacker: player, attackerType: 'player',
    defender: target, defenderType: 'monster',
    damage: 200, platingMult: 1, drPierce: 0, cancelled: false,
    metadata: { mechanicFired: true } as Record<string, unknown>,
  } as unknown as CombatContext;
  _mechanicFires.length = 0;
  onTechniqueResolved(world, player, SWEEP, { ctx, target });
  assert(_mechanicFires.length === 0, 'the moment had already been announced on this exchange');
  assert(keystoneFx('technique').length === 0, 'so the keystone draws nothing');
}

console.log('keystones.test.ts: ok');
