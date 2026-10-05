/**
 * One damage-over-time record per weapon (design §26.2), wired.
 *
 * WHAT THIS PINS — wiring and invariants, not balance:
 *
 *   A. THE ONE LINEAGE BLEED. Every lineage DoT source on a weapon with no
 *      reservoir — the heavy `hemorrhage` payload, `poison-stack`, the re-dose,
 *      the Affliction lean's light bleed — ADDS what it owes to ONE record,
 *      `lineage.bleed`. No ratchet (design §18.1): the total owed is the sum of the
 *      firings and it runs out; the card never touches the cadence root's record;
 *      the one driver ticks both and the marker leaves only when both have.
 *   B. THE DAGGER (a reservoir weapon), REAL ECONOMY. With the Affliction lean and
 *      the Affliction verb bought, the target carries exactly ONE damage-over-time
 *      record and it is the weapon's own reservoir: the verb re-doses that pool,
 *      and no `lineage.*` record is ever created.
 *   C. THE DAGGER, EVERY PAYLOAD. The composed heavy bleed and `poison-stack` on a
 *      reservoir weapon add to its pool too.
 *   D. THE RAPIER (no reservoir) WITH THE T2 AFFLICTION LEAN, REAL ECONOMY. The
 *      light bleed and the composed heavy bleed are exactly one record,
 *      `lineage.bleed`.
 *   E. EVERY READER SEES THE ONE ID. The DoT inventory (so the Affliction moment,
 *      the re-dose), Contagion's copier and Detonate.
 *
 * Run: node --conditions=development --import tsx test/lineageDots.test.ts
 */
import {
  ABILITY_DATABASE,
  GAME_CONFIG,
  cardRank,
  STARTER_RUNE_IDS,
  applyStatusEffect,
  baseRecoveryForTier,
  emptyAttunedAbilities,
  emptyEquipment,
  getLineageRuntime,
  getStatusEffect,
  isAfflictionStatusId,
  setLineageRuntime,
  tickCooldowns,
  type CombatEvent,
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
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { equipItem } from '../src/systems/player/economy/inventory';
import { unlockLineageCard } from '../src/systems/player/economy/lineages';
import { unlockSkill } from '../src/systems/player/progression/skills';
import { updateHemorrhages } from '../src/systems/classes/archetypes/cadence/t3/ticks/hemorrhage';
import { playerDotsOnMonster } from '../src/systems/combat/damage/dotInventory';
import { CADENCE_BLEED_ID, LINEAGE_BLEED_ID } from '../src/systems/combat/damage/bleedIds';
import { copyPlayerDotOnto, resolveDetonate } from '../src/systems/player/abilities/abilityAffliction';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
const RETIRED = ['lineage.hemorrhage', 'lineage.lean-bleed', 'lineage.poison'];
let nextId = 0;
let nextX = 400;

initCombatSystems();
const world = new World();

function makeSlices(id: string, tier = 2): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 1,
      essences: { red: 99_999, blue: 99_999, green: 99_999, yellow: 99_999, purple: 99_999 },
      shards: {
        tempo: 999, affliction: 999, engagement: 999, empowered: 999, control: 999, 'kill-chain': 999, technique: 999,
      },
      capstones: {},
      biomeXP: {},
      biomeLevel: { plains: 99, forest: 99, mountain: 99, swamp: 99, cave: 99, jungle: 99, desert: 99 },
      unlockedRecipes: [], questProgress: {}, playerTier: tier, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: ['detonate'],
      attunedAbilities: { ...emptyAttunedAbilities(), techniques: ['detonate'] },
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

/** A player wearing `weapon` (optionally of a class), with `cardIds` bought through the real economy. */
function wielder(opts: {
  id: string; weapon: string; lineageId: string; cardIds: string[];
  classRoot?: string; tier?: number; inventory?: string[];
}): PlayerEntity {
  const slices = makeSlices(opts.id, opts.tier);
  slices.holdsInventory.inventory = opts.inventory ?? [opts.weapon];
  const player = world.attachPlayerEntity(slices, opts.id);
  if (opts.classRoot) assert(unlockSkill(world, player, opts.classRoot), `${opts.id}: ${opts.classRoot} unlocks`);
  assert(equipItem(world, player, opts.weapon), `${opts.id}: wears ${opts.weapon}`);
  for (const cardId of opts.cardIds) {
    const bought = unlockLineageCard(world, player, opts.lineageId, cardId);
    assert(bought.success, `${opts.id}: ${cardId}: ${bought.reason}`);
  }
  world.takeNodeEvents(NODE);
  return player;
}

function seededCard(opts: {
  trigger: LineageTrigger;
  payoff: LineagePayoff;
  fx?: LineageFxKey;
  lane?: PacketId;
  composed?: boolean;
}): ResolvedLineageCard {
  return {
    card: {
      id: `seed-dot-${++nextId}`,
      lineageId: 'rapier', tier: 1, row: 'payoff', lane: opts.lane ?? 'affliction',
      name: 'Seeded', description: '',
      fx: opts.fx ?? 'affliction.bleed-pips',
    },
    requiredBiomeGroup: 'forest', requiredBiomeLevel: 1, requiredGlobalMastery: 0,
    cost: { essence: {}, shards: {} },
    trigger: opts.trigger,
    payoff: opts.payoff,
    ...(opts.composed ? { composition: { verbLane: 'tempo' as const, leanLane: 'affliction' as const, pure: false } } : {}),
  } as unknown as ResolvedLineageCard;
}

/** A player whose lineage runtime is seeded straight in, optionally wearing `weapon`. */
function seeded(id: string, cards: ResolvedLineageCard[], weapon?: string): PlayerEntity {
  const slices = makeSlices(id);
  if (weapon) slices.holdsInventory.inventory = [weapon];
  const player = world.attachPlayerEntity(slices, id);
  if (weapon) assert(equipItem(world, player, weapon), `${id}: wears ${weapon}`);
  player.dealsDamage.attack = 200;
  setLineageRuntime(player.tracksCombat, { cards, capstones: [] });
  world.takeNodeEvents(NODE);
  return player;
}

function monster(): MonsterEntity {
  nextX += 400;
  const m = world.createMonster(NODE, 'plains-slime', { x: nextX, y: 400 });
  if (!m) throw new Error('failed to spawn a target');
  m.hasHealth.maxHp = 10_000_000;
  m.hasHealth.hp = 10_000_000;
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

let clock = 1_000_000;
/** One real swing; returns the `card-fx` events it drew. */
function swing(player: PlayerEntity, target: MonsterEntity): Array<Extract<CombatEvent, { kind: 'card-fx' }>> {
  player.hasPosition.current = { x: target.hasPosition.current.x - 30, y: 400 };
  setAttackTarget(world, player, target.isMonster.id);
  runPlayerAttack(world, player, target, clock, {
    attackOrigin: { ...player.hasPosition.current },
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });
  clock += 2_000;
  tickCooldowns(player.tracksCombat, 2_000);
  return world.takeNodeEvents(NODE)
    .filter((e): e is Extract<CombatEvent, { kind: 'card-fx' }> => e.kind === 'card-fx');
}

/** What a ticks-mode bleed record still owes: remaining ticks × per-tick. */
function owed(target: MonsterEntity, id = LINEAGE_BLEED_ID): number {
  const bleed = getStatusEffect(target.tracksCombat, id);
  return bleed ? bleed.stacks * (bleed.data['damagePerTick'] ?? 0) : 0;
}

/** Every damage-over-time record on the target, by id. */
function afflictions(target: MonsterEntity): string[] {
  return target.tracksCombat.statusEffects.map((e) => e.id).filter(isAfflictionStatusId);
}

function lineageRecords(target: MonsterEntity): string[] {
  return target.tracksCombat.statusEffects.map((e) => e.id).filter((id) => id.startsWith('lineage.'));
}

function noRetiredIds(target: MonsterEntity, what: string): void {
  const retired = target.tracksCombat.statusEffects.map((e) => e.id).filter((id) => RETIRED.includes(id));
  assert(retired.length === 0, `${what}: a retired lineage id came back: ${retired.join(', ')}`);
}

const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;

// ══ A. THE ONE LINEAGE BLEED ══════════════════════════════════════════════════

{
  // Every source adds; nothing ratchets. A big firing and a chip firing owe their
  // SUM — the chip never maintains the big one's rate — and the record runs out.
  const player = seeded('dot-sum', [seededCard({
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'hemorrhage', magnitude: 0.5, durationMs: 4_000 },
  })]);
  const target = monster();
  hit(player, target, 1_000);
  assert(near(owed(target), 500), `the first firing owes half the hit, got ${owed(target)}`);
  hit(player, target, 10);
  assert(near(owed(target), 505), `a chip firing ADDS its own share and nothing more, got ${owed(target)}`);
  assert(getStatusEffect(target.tracksCombat, LINEAGE_BLEED_ID)?.stacks === 4, 'over one window, never extended past it');
  for (let i = 0; i < 4; i++) updateHemorrhages(world, 1_000);
  assert(getStatusEffect(target.tracksCombat, LINEAGE_BLEED_ID) === undefined, 'and it runs out: no ratchet');
  noRetiredIds(target, 'A');
}

{
  // The card never writes the cadence root's record; one driver ticks both.
  const player = seeded('dot-separate', [seededCard({
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'hemorrhage', magnitude: 0.4, durationMs: 4_000 },
  })]);
  const target = monster();
  const brand = applyStatusEffect(target.tracksCombat, {
    id: CADENCE_BLEED_ID, instanced: false, remainingMs: -1, sourceId: player.isPlayer.id,
    data: { damagePerTick: 999, nextTickIn: 1_000, tickIntervalMs: 1_000 },
  });
  brand.stacks = 4;
  hit(player, target, 100);
  assert(getStatusEffect(target.tracksCombat, CADENCE_BLEED_ID)?.data.damagePerTick === 999,
    'the card must not touch the cadence bleed');
  assert(getStatusEffect(target.tracksCombat, LINEAGE_BLEED_ID) !== undefined, 'the card writes the lineage bleed alongside it');
  const before = target.hasHealth.hp;
  updateHemorrhages(world, 1_000);
  assert(target.hasHealth.hp < before, 'both bleeds tick through the one driver');
  assert(target.hasHemorrhage !== undefined, 'the marker stays while a bleed remains');
}

{
  // `poison-stack` was its own intensity record (`lineage.poison`); it now adds
  // what one application promises — magnitude × the hit per tick, over its
  // window — to the one bleed, and a second application adds again.
  const player = seeded('dot-poison', [seededCard({
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'poison-stack', magnitude: 0.2, durationMs: 6_000 },
    fx: 'affliction.venom-pips',
  })]);
  const target = monster();
  hit(player, target, 100);
  const first = owed(target);
  assert(first > 0, 'poison-stack lands on the lineage bleed');
  hit(player, target, 100);
  assert(near(owed(target), first * 2), `a second application adds the same again, ${first} -> ${owed(target)}`);
  assert(lineageRecords(target).length === 1 && lineageRecords(target)[0] === LINEAGE_BLEED_ID,
    'and it is the only lineage record on the target');
  noRetiredIds(target, 'A poison');
}

// ══ B. THE DAGGER, REAL ECONOMY — one record, the weapon's own ════════════════

for (const rank of [1, 3]) {
  // The Dagger's T1 Effect lean is DoT potency (design §26.1) and its fixed verb
  // Into the Wound. Bought through the real economy, at rank I and at rank III
  // (buying the card again buys its next rank): whatever the rank, the target
  // carries exactly one damage-over-time record — the Poison Dagger's own.
  const LEAN = 'dagger-t1-effect';
  const VERB = 'dagger-t1-affliction-payoff'; // Into the Wound
  const player = wielder({
    id: `dot-dagger-r${rank}`, weapon: 'ashbrand-blade', lineageId: 'dagger',
    cardIds: [...Array(rank).fill(LEAN), VERB], classRoot: 'cadence-root',
  });
  assert(cardRank(player.holdsInventory.lineages!.dagger!, LEAN) === rank, `the Effect lean is at rank ${rank}`);
  assert(player.usesSkills.combatArchetype === 'cadence' && player.appliesDots === undefined,
    'a Striker: no class DoT, so the reservoir is the only affliction in play');
  assert((player.usesSkills.passives['shared.bleed-on-hit-pct'] ?? 0) === 0, 'the lean seeds no light bleed on a reservoir weapon');
  assert((player.usesSkills.passives['weapon.reservoir-potency-pct'] ?? 0) > 0, 'it raises the reservoir instead');
  const verb = getLineageRuntime(player.tracksCombat)?.cards.find((c) => c.card.id === VERB);
  assert(verb?.trigger?.kind === 'hit-afflicted', 'Into the Wound: the Affliction moment');
  assert(verb?.payoff?.kind === 'redose', 'with the Effect lean, the re-dose');

  const target = monster();
  assert(swing(player, target).every((e) => e.cardId !== VERB), 'the first swing is not on an afflicted target');
  const pool1 = getStatusEffect(target.tracksCombat, 'poison-dagger-burn')?.data.pool ?? 0;
  assert(pool1 > 0, "the first swing fills the Poison Dagger's reservoir");
  assert(lineageRecords(target).length === 0, 'and leaves no lineage record');

  const fired = swing(player, target).filter((e) => e.cardId === VERB);
  assert(fired.length === 1, `the second swing finds the poison and re-doses, got ${fired.length} firings`);
  const pool2 = getStatusEffect(target.tracksCombat, 'poison-dagger-burn')?.data.pool ?? 0;
  assert(pool2 > pool1 * 2.5, `the re-dose ADDS to the reservoir (a feed alone doubles it): ${pool1} -> ${pool2}`);
  assert(fired[0].durationMs === 4_500, "the firing reports the reservoir's drain window");

  for (let i = 0; i < 8; i++) swing(player, target);
  const dots = playerDotsOnMonster(world, player, target);
  assert(dots.length === 1 && dots[0].effect.id === 'poison-dagger-burn',
    `rank ${rank}: exactly ONE damage-over-time record, the weapon's reservoir: ${dots.map((d) => d.effect.id).join(', ')}`);
  assert(afflictions(target).length === 1, `rank ${rank}: one affliction id on the target: ${afflictions(target).join(', ')}`);
  assert(lineageRecords(target).length === 0, `rank ${rank}: no lineage.* record, ever: ${lineageRecords(target).join(', ')}`);
  noRetiredIds(target, `B rank ${rank}`);
}

// ══ C. THE DAGGER, EVERY PAYLOAD ADDS TO THE RESERVOIR ═══════════════════════

{
  for (const payoff of [
    { kind: 'hemorrhage', magnitude: 1, durationMs: 4_000 },
    { kind: 'poison-stack', magnitude: 0.15, durationMs: 5_000 },
    { kind: 'redose', magnitude: 1, durationMs: 4_000 },
  ] as LineagePayoff[]) {
    const player = seeded(`dot-dagger-${payoff.kind}`, [seededCard({
      trigger: { kind: 'hit-nth', n: 1 }, payoff, composed: payoff.kind === 'hemorrhage',
    })], 'ashbrand-blade');
    const target = monster();
    hit(player, target, 200);
    const pool = getStatusEffect(target.tracksCombat, 'poison-dagger-burn')?.data.pool ?? 0;
    // A plain feed of 200 banks 200 × 0.5 conversion × 1.5 = 150 (the redose finds
    // nothing yet on its first hit, so a second hit proves it).
    if (payoff.kind === 'redose') {
      hit(player, target, 200);
      const pool2 = getStatusEffect(target.tracksCombat, 'poison-dagger-burn')?.data.pool ?? 0;
      assert(pool2 > 300, `${payoff.kind}: the re-dose tops the reservoir up past two feeds, got ${pool2}`);
    } else {
      assert(pool > 150, `${payoff.kind}: the payload tops the reservoir up past the feed alone, got ${pool}`);
    }
    assert(lineageRecords(target).length === 0, `${payoff.kind}: no lineage record on a reservoir weapon`);
    assert(afflictions(target).length === 1, `${payoff.kind}: one affliction: ${afflictions(target).join(', ')}`);
  }
}

// ══ D. THE RAPIER WITH THE T2 AFFLICTION LEAN, REAL ECONOMY — lineage.bleed ════

{
  const player = wielder({
    id: 'dot-rapier-t2', weapon: 'gale-needle', lineageId: 'rapier', tier: 4,
    inventory: ['flash-rapier', 'gale-needle'],
    cardIds: ['rapier-t2-affliction-stat', 'rapier-t2-tempo-payoff'],
  });
  assert((player.usesSkills.passives['shared.bleed-on-hit-pct'] ?? 0) > 0, 'the T2 Affliction lean seeds the light bleed');
  const verb = getLineageRuntime(player.tracksCombat)?.cards.find((c) => c.card.id === 'rapier-t2-tempo-payoff');
  assert(verb?.payoff?.kind === 'hemorrhage', 'and composes the Tempo verb with the heavy bleed');

  const target = monster();
  swing(player, target);
  assert(afflictions(target).join() === LINEAGE_BLEED_ID, `the first hit: the light bleed, on lineage.bleed: ${afflictions(target).join()}`);
  const light = owed(target);
  let heavy = 0;
  for (let i = 0; i < 6; i++) heavy += swing(player, target).filter((e) => e.fx === 'affliction.heavy-drip').length;
  assert(heavy >= 1, 'the Tempo verb fired its heavy bleed');
  assert(owed(target) > light * 3, `the heavy bleed ADDED to the same record: ${light} -> ${owed(target)}`);
  assert(afflictions(target).length === 1 && afflictions(target)[0] === LINEAGE_BLEED_ID,
    `exactly lineage.bleed: ${afflictions(target).join(', ')}`);
  assert(lineageRecords(target).length === 1, `one lineage record: ${lineageRecords(target).join(', ')}`);
  noRetiredIds(target, 'D');
}

// ══ E. EVERY READER SEES THE ONE ID ═══════════════════════════════════════════

{
  const player = seeded('dot-readers', [seededCard({
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'hemorrhage', magnitude: 1, durationMs: 4_000 },
  })]);
  const target = monster();
  hit(player, target, 400);
  const entries = playerDotsOnMonster(world, player, target);
  const entry = entries.find((e) => e.effect.id === LINEAGE_BLEED_ID);
  assert(entry !== undefined, 'the DoT inventory owns the one bleed (the Affliction moment and the re-dose read it)');
  assert(entry!.spreadable && entry!.detonatable, 'Contagion may copy it and Detonate may consume it');
  assert(near(entry!.remainingDamage, 400), `it owes the whole swing, got ${entry!.remainingDamage}`);

  const neighbour = monster();
  copyPlayerDotOnto(world, player, neighbour, entry!);
  assert(getStatusEffect(neighbour.tracksCombat, LINEAGE_BLEED_ID) !== undefined, 'Contagion copies it under the same id');
  assert(neighbour.hasHemorrhage !== undefined, 'with the marker its tick driver needs');

  const before = target.hasHealth.hp;
  resolveDetonate(world, player, ABILITY_DATABASE.get('detonate')!, target);
  assert(getStatusEffect(target.tracksCombat, LINEAGE_BLEED_ID) === undefined, 'Detonate consumes it');
  assert(target.hasHealth.hp < before, 'and pays out what it owed');
}

console.log('lineageDots: ok');
