/**
 * Apprentice T3 paths re-homed by the T3 path review (design §22.5) — Pyromancer.
 *
 * Pyromancer (dot-balanced-t3-a) keeps two burn stacks per hit at 55% and loses
 * the max-stack direct bonus (the Ember Mage frame owns "intensifies"). Its payoff
 * is RADIANT: a burn tick on a target at max stacks also strikes every adjacent
 * body for the tick's damage. What this file pins is the SHAPE, never a balance
 * number:
 *
 *   - the hit: two stacks per hit, and a hit into a full bar leaves the burn's
 *     clock alone (design §22.12) and adds no direct bonus of the path's own (only
 *     the frame's multiplier); Radiant fires on the ticks while the stacks last;
 *   - at max a tick damages an adjacent body and lays no stack on it; below max it
 *     does not; a body out of reach is never touched;
 *   - the splash pays the DoT rules (no plating, half DR), so an adjacent body
 *     with plating takes the same as one without;
 *   - no recursion: two adjacent bodies both at max, one tick each, is exactly one
 *     splash per ticking body;
 *   - not a hit: no combat-pipeline hit event runs during the tick, and a body the
 *     splash kills dies once, as a DoT-tick kill.
 *
 * Run: node --conditions=development --import tsx test/t3ApprenticePaths.test.ts
 */
import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  SKILL_TREE,
  baseRecoveryForTier,
  computeScaledDotDamage,
  emptyEquipment,
  getStatusEffect,
  getTotalStacks,
  lineageUnit,
  mergePassives,
  type CombatEvent,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import {
  emitCombatEvent,
  registerCombatListener,
  type CombatContext,
  type CombatEventName,
} from '../src/systems/combat/engine/combatPipeline';
import { updateDotArchetype } from '../src/systems/classes/archetypes/dot/dotPrototype';
import { updateCombatState } from '../src/systems/combat/engine/combatState';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
const BASE_DAMAGE = 100;
const PYROMANCER = 'dot-balanced-t3-a';

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

// ── The probe: every combat-pipeline event, counted only while a tick runs ─────
const EVENTS: CombatEventName[] = ['beforeAttack', 'onAttack', 'onHit', 'onDamageTaken', 'afterHit', 'onKill'];
let probing = false;
const seen: Array<{ event: CombatEventName; defenderId: string; killSource: unknown }> = [];
for (const event of EVENTS) {
  registerCombatListener(event, (ctx) => {
    if (!probing || ctx.defenderType !== 'monster') return;
    seen.push({ event, defenderId: ctx.defender.isMonster.id, killSource: ctx.metadata['killSource'] });
  });
}

/** A fresh world with one Pyromancer: frame folded, then the path, as recalc folds nodes. */
function setup(): { world: World; player: PlayerEntity } {
  const world = new World();
  const player = world.attachPlayerEntity(makeSlices('pyro'), 'pyro');
  player.usesSkills.combatArchetype = 'dot';
  const frame = SKILL_TREE.get('dot-balanced');
  const path = SKILL_TREE.get(PYROMANCER);
  assert(frame && path, 'the Ember Mage frame and the Pyromancer path must exist');
  player.usesSkills.selectedSubVariant = frame.subVariantId ?? null;
  mergePassives(player.usesSkills.passives, frame.mechanicEffects);
  mergePassives(player.usesSkills.passives, path.mechanicEffects);
  syncArchetypeSlices(world, player);
  return { world, player };
}

/** A sturdy body, so a splash in these shape tests never kills by accident. */
function body(world: World, x: number, y: number): MonsterEntity {
  const m = world.createMonster(NODE, 'plains-slime', { x, y });
  if (!m) throw new Error('failed to spawn a monster');
  m.hasHealth.maxHp = 100_000;
  m.hasHealth.hp = 100_000;
  return m;
}

function hit(world: World, player: PlayerEntity, defender: MonsterEntity): CombatContext {
  const ctx = {
    attacker: player, attackerType: 'player',
    defender, defenderType: 'monster',
    damage: BASE_DAMAGE, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext;
  emitCombatEvent('beforeAttack', ctx, world);
  emitCombatEvent('onHit', ctx, world);
  return ctx;
}

const authored = (nodeId: string, key: string): number => {
  const value = (SKILL_TREE.get(nodeId)?.mechanicEffects as Record<string, number> | undefined)?.[key];
  assert(typeof value === 'number', `${nodeId} must author ${key}`);
  return value as number;
};

const MAX_STACKS = authored('dot-balanced', 'dot.max-stacks');
const STACKS_PER_HIT = authored(PYROMANCER, 'dot.fan-the-flames-stacks-per-hit');
const REACH = lineageUnit('contagionRadius');

/** Hit until the burn is full. */
function fillBurn(world: World, player: PlayerEntity, target: MonsterEntity): void {
  for (let i = 0; i < MAX_STACKS && getTotalStacks(target.tracksCombat, 'dot') < MAX_STACKS; i++) {
    hit(world, player, target);
  }
  assert(getTotalStacks(target.tracksCombat, 'dot') === MAX_STACKS, `the burn should be full at ${MAX_STACKS}`);
}

/** Make the burn on `target` due this tick and report the raw tick it will deal. */
function dueNow(target: MonsterEntity): number {
  const effect = getStatusEffect(target.tracksCombat, 'dot');
  assert(effect, 'the target must be burning');
  effect.data.nextTickIn = 0;
  return computeScaledDotDamage(effect);
}

/** Every DoT damage instance (a burn's own tick or a Radiant strike) that landed, by target, in the last pass. */
let landed = new Map<string, number>();

/** One DoT pass with the probe armed; returns the Radiant strikes (`special` dot-ticks) by target. */
function tick(world: World): Map<string, number[]> {
  world.takeNodeEvents(NODE);
  probing = true;
  try {
    updateDotArchetype(world, 100);
  } finally {
    probing = false;
  }
  const strikes = new Map<string, number[]>();
  landed = new Map();
  for (const ev of world.takeNodeEvents(NODE) as CombatEvent[]) {
    if (ev.kind !== 'dot-tick') continue;
    landed.set(ev.targetId, (landed.get(ev.targetId) ?? 0) + 1);
    if (ev.sourceType !== 'special') continue;
    assert(ev.element === 'fire', `Radiant strikes in the burn's element, got ${ev.element}`);
    // The client draws the fire leaping from the burning body (W2-D's arc).
    assert(!!ev.fromId && ev.fromId !== ev.targetId, 'a Radiant strike names the body it radiated from');
    strikes.set(ev.targetId, [...(strikes.get(ev.targetId) ?? []), ev.amount]);
  }
  return strikes;
}

// The path no longer authors the bonus it gave up.
assert(
  !('dot.fan-the-flames-max-stack-bonus-mult' in (SKILL_TREE.get(PYROMANCER)!.mechanicEffects ?? {})),
  'Pyromancer must not author the max-stack direct bonus any more',
);
assert(SKILL_TREE.get(PYROMANCER)!.packet === 'affliction', 'Pyromancer stays an Affliction path');

// ── The hit: two stacks; a full bar is left alone, with no bonus of its own ────
{
  const { world, player } = setup();
  const target = body(world, 1000, 1000);

  const first = hit(world, player, target);
  assert(
    getTotalStacks(target.tracksCombat, 'dot') === STACKS_PER_HIT,
    `one hit lays ${STACKS_PER_HIT} burn stacks, got ${getTotalStacks(target.tracksCombat, 'dot')}`,
  );
  const belowMaxDamage = first.damage;
  fillBurn(world, player, target);

  const effect = getStatusEffect(target.tracksCombat, 'dot')!;
  effect.remainingMs = 100;
  const perStack = effect.data.damagePerStack;
  const atMax = hit(world, player, target);
  assert(getTotalStacks(target.tracksCombat, 'dot') === MAX_STACKS, 'a hit into a full bar keeps it at the cap');
  assert(
    effect.remainingMs === 100,
    `a hit at max leaves the burn's clock alone (design §22.12), remainingMs ${effect.remainingMs}`,
  );
  assert(effect.data.damagePerStack === perStack, 'and leaves its per-stack value alone');
  assert(atMax.metadata['empoweredAttack'] === undefined, 'the path no longer flags a max-stack bonus hit');
  const frameMult = authored('dot-balanced', 'dot.frame-max-stack-mult');
  assert(
    atMax.damage === Math.floor(belowMaxDamage * frameMult),
    `at max only the Ember frame intensifies (×${frameMult}): ${belowMaxDamage} → ${atMax.damage}`,
  );
}

// ── At max: the tick strikes the adjacent body and lays no stack on it ─────────
{
  const { world, player } = setup();
  const burning = body(world, 1000, 1000);
  const adjacent = body(world, 1000 + REACH / 2, 1000);
  const distant = body(world, 1000 + REACH * 8, 1000);
  fillBurn(world, player, burning);
  dueNow(burning);

  const adjacentHp = adjacent.hasHealth.hp;
  const distantHp = distant.hasHealth.hp;
  const strikes = tick(world);

  assert(adjacent.hasHealth.hp < adjacentHp, 'a max-burn tick must strike the adjacent body');
  assert((strikes.get(adjacent.isMonster.id)?.length ?? 0) === 1, 'exactly one Radiant strike on the adjacent body');
  assert(adjacentHp - adjacent.hasHealth.hp === strikes.get(adjacent.isMonster.id)![0], 'the event carries the HP actually lost');
  assert(getStatusEffect(adjacent.tracksCombat, 'dot') === undefined, 'Radiant applies no stacks to the adjacent body');
  assert(adjacent.hasDot === undefined, 'the adjacent body is not marked as burning');
  assert(distant.hasHealth.hp === distantHp, 'a body out of reach is untouched');
  assert(!strikes.has(burning.isMonster.id), 'the burning body never strikes itself');
  assert(seen.length === 0, `a tick is not a hit: no pipeline event may run, saw ${seen.map((s) => s.event).join(', ')}`);
}

// ── Radiant fires while the stacks last; hits at max never keep the burn alive ─
{
  const { world, player } = setup();
  const burning = body(world, 1000, 1000);
  const adjacent = body(world, 1000 + REACH / 2, 1000);
  fillBurn(world, player, burning);
  const durationMs = getStatusEffect(burning.tracksCombat, 'dot')!.remainingMs;
  assert(durationMs > 0, 'fixture: the filling hit lit the burn for its whole duration');

  let radiant = 0;
  let elapsed = 0;
  // Keep hitting the full bar once a second; the burn still runs out on its own
  // clock. One 100 ms world step: the hit, the DoT pass, then the duration decay
  // (the next step's top, `updateCombatState`).
  while (getStatusEffect(burning.tracksCombat, 'dot') !== undefined && elapsed <= durationMs * 3) {
    if (elapsed % 1000 === 0) {
      const before = getStatusEffect(burning.tracksCombat, 'dot')!.remainingMs;
      hit(world, player, burning);
      const after = getStatusEffect(burning.tracksCombat, 'dot')?.remainingMs;
      assert(after === before, `t=${elapsed}: a hit at max leaves the burn's clock alone, ${before} → ${after}`);
      assert(getTotalStacks(burning.tracksCombat, 'dot') === MAX_STACKS, `t=${elapsed}: the bar is still full`);
    }
    radiant += tick(world).get(adjacent.isMonster.id)?.length ?? 0;
    elapsed += 100;
    updateCombatState(world, 100);
  }
  assert(
    getStatusEffect(burning.tracksCombat, 'dot') === undefined && elapsed <= durationMs + 100,
    `the full burn lapses within its own ${durationMs} ms, hits or no hits (took ${elapsed} ms)`,
  );
  assert(radiant >= 2, `Radiant fired on the burn's ticks while the stacks lasted, got ${radiant}`);
  hit(world, player, burning);
  assert(
    getTotalStacks(burning.tracksCombat, 'dot') === STACKS_PER_HIT,
    'once it lapses, the next hit builds the burn again',
  );
}

// ── Below max: the tick does not radiate ──────────────────────────────────────
{
  const { world, player } = setup();
  const burning = body(world, 1000, 1000);
  const adjacent = body(world, 1000 + REACH / 2, 1000);
  hit(world, player, burning);
  assert(getTotalStacks(burning.tracksCombat, 'dot') < MAX_STACKS, 'the burn must be below max here');
  dueNow(burning);

  const adjacentHp = adjacent.hasHealth.hp;
  const burningHp = burning.hasHealth.hp;
  const strikes = tick(world);
  assert(burning.hasHealth.hp < burningHp, 'the burn itself still ticks below max');
  assert(adjacent.hasHealth.hp === adjacentHp, 'a tick below max must not strike the adjacent body');
  assert(strikes.size === 0, 'no Radiant strike below max');
}

// ── DoT rules: plating is skipped, half DR is paid ────────────────────────────
{
  const { world, player } = setup();
  const burning = body(world, 1000, 1000);
  const bare = body(world, 1000 + REACH / 2, 1000);
  const plated = body(world, 1000 - REACH / 2, 1000);
  const dr = 0.4;
  for (const m of [bare, plated]) m.mitigatesDamage.damageReduction = dr;
  bare.mitigatesDamage.plating = 0;
  plated.mitigatesDamage.plating = 10_000;
  fillBurn(world, player, burning);
  const rawTick = dueNow(burning);

  const strikes = tick(world);
  const bareHit = strikes.get(bare.isMonster.id)?.[0] ?? 0;
  const platedHit = strikes.get(plated.isMonster.id)?.[0] ?? 0;
  assert(bareHit > 0, 'the bare body is struck');
  assert(platedHit === bareHit, `plating must not touch the splash: plated ${platedHit} vs bare ${bareHit}`);
  const dotResist = Math.min(0.9, MONSTER_DATABASE.get('plains-slime')?.dotResistance ?? 0);
  const expected = Math.max(1, Math.round(rawTick * (1 - dr * GAME_CONFIG.DOT_DR_SHARE) * (1 - dotResist)));
  assert(bareHit === expected, `the splash pays the DoT share of DR on the raw tick: expected ${expected}, got ${bareHit}`);
}

// ── No recursion: two adjacent bodies at max, one tick each → one splash each ──
{
  const { world, player } = setup();
  const a = body(world, 1000, 1000);
  const b = body(world, 1000 + REACH / 2, 1000);
  const bystander = body(world, 1000 + REACH / 4, 1000 + REACH / 4);
  fillBurn(world, player, a);
  fillBurn(world, player, b);
  dueNow(a);
  dueNow(b);

  const strikes = tick(world);
  assert((strikes.get(a.isMonster.id)?.length ?? 0) === 1, `a takes exactly one splash (from b), got ${strikes.get(a.isMonster.id)?.length ?? 0}`);
  assert((strikes.get(b.isMonster.id)?.length ?? 0) === 1, `b takes exactly one splash (from a), got ${strikes.get(b.isMonster.id)?.length ?? 0}`);
  assert(
    (strikes.get(bystander.isMonster.id)?.length ?? 0) === 2,
    `a body beside both takes one splash per ticking body, got ${strikes.get(bystander.isMonster.id)?.length ?? 0}`,
  );
  for (const m of [a, b]) {
    const effect = getStatusEffect(m.tracksCombat, 'dot')!;
    assert(effect.stacks === MAX_STACKS, 'a splash never adds a stack to a burning body');
    assert(effect.data.nextTickIn === effect.data.tickIntervalMs, 'each burn ticked once, on its own clock');
  }
  assert(getStatusEffect(bystander.tracksCombat, 'dot') === undefined, 'the bystander was never set alight');
}

// ── A splash kill is a DoT-tick kill, exactly once ────────────────────────────
// Both bodies burn at max and both tick this pass; the fragile one dies to
// whichever lands first, its own tick or its neighbour's fire. Run once with each
// body fragile, so whatever order the pass visits them in, one run has the fire
// kill a body whose own tick is still to come.
for (const fragileIndex of [0, 1]) {
  const { world, player } = setup();
  const pair = [body(world, 1000, 1000), body(world, 1000 + REACH / 2, 1000)];
  for (const m of pair) fillBurn(world, player, m);
  for (const m of pair) dueNow(m);
  const fragile = pair[fragileIndex];
  fragile.hasHealth.hp = 1;
  const fragileId = fragile.isMonster.id;

  seen.length = 0;
  tick(world);
  const kills = seen.filter((s) => s.event === 'onKill' && s.defenderId === fragileId);
  assert(kills.length === 1, `body ${fragileIndex}: dies exactly once, saw ${kills.length} kills`);
  assert(kills[0].killSource === 'dot', `body ${fragileIndex}: dies as a DoT-tick kill, got ${String(kills[0].killSource)}`);
  assert(world.getMonsterEntity(fragileId) === undefined, `body ${fragileIndex}: the dead body is removed`);
  // The lethal instance is the last one: a body the fire killed does not go on to
  // tick (and radiate) its own burn as a corpse, and a body its own tick killed is
  // not struck again by the fire.
  assert(
    landed.get(fragileId) === 1,
    `body ${fragileIndex}: exactly one DoT instance lands on the dying body, got ${landed.get(fragileId) ?? 0}`,
  );
  assert(
    seen.every((s) => s.event === 'onKill'),
    `no hit event runs during the tick, saw ${seen.map((s) => s.event).join(', ')}`,
  );
  seen.length = 0;
}

// ── A splash alone (the struck body has no burn of its own) can kill ──────────
{
  const { world, player } = setup();
  const a = body(world, 1000, 1000);
  const b = body(world, 1000 + REACH / 2, 1000);
  fillBurn(world, player, a);
  dueNow(a);
  b.hasHealth.hp = 1;
  const bId = b.isMonster.id;

  seen.length = 0;
  tick(world);
  const kills = seen.filter((s) => s.event === 'onKill' && s.defenderId === bId);
  assert(kills.length === 1 && kills[0].killSource === 'dot', 'the splash kills as a DoT tick does, once');
  assert(world.getMonsterEntity(bId) === undefined, 'the body the splash killed is removed');
  seen.length = 0;
}

// ── The gate is the path, not the element: the Ember Mage frame alone never radiates ──
{
  const world = new World();
  const player = world.attachPlayerEntity(makeSlices('ember'), 'ember');
  player.usesSkills.combatArchetype = 'dot';
  const frame = SKILL_TREE.get('dot-balanced')!;
  player.usesSkills.selectedSubVariant = frame.subVariantId ?? null;
  mergePassives(player.usesSkills.passives, frame.mechanicEffects);
  syncArchetypeSlices(world, player);
  const burning = body(world, 1000, 1000);
  const adjacent = body(world, 1000 + REACH / 2, 1000);
  for (let i = 0; i < MAX_STACKS; i++) hit(world, player, burning);
  assert(getTotalStacks(burning.tracksCombat, 'dot') === MAX_STACKS, 'the frame-only burn is full');
  dueNow(burning);
  const adjacentHp = adjacent.hasHealth.hp;
  const strikes = tick(world);
  assert(adjacent.hasHealth.hp === adjacentHp && strikes.size === 0, 'a burn without the Pyromancer path never radiates');
}

console.log('t3ApprenticePaths: ok');
