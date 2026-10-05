/**
 * The rhythm readout's server half, wired (design §24.6; course-correction W2-B).
 *
 * WHAT THIS PINS — wiring and invariants, not balance:
 *
 *   - `ShowsRhythm` is attached only while the player has a TRIGGERED lineage
 *     card (component presence), and detached when the last one leaves;
 *   - a `hit-nth` verb (Flurry, n = 6) counts 1..5 in the exposed state through
 *     real swings, fires on the 6th, resets, and its `card-fx` names the card;
 *   - a capped Affliction verb exposes the cap as the server time it clears,
 *     written once when it starts, dropped once it has cleared;
 *   - a per-body opener (Opening Lunge) lists the bodies it was spent on;
 *   - a kill-carry verb reads armed between the kill and the next landed hit;
 *   - the slice is NEVER written when nothing changed: not by a sync that finds
 *     the same state, not by world ticks, not by hits on a moment that has no
 *     state to move.
 *
 * Cards are bought through the real economy so the runtime cache and the slice
 * come off the same recalc a live player gets.
 *
 * Run: node --conditions=development --import tsx test/rhythmReadout.test.ts
 */
import {
  GAME_CONFIG,
  baseRecoveryForTier,
  emptyEquipment,
  initAppliesDots,
  tickCooldowns,
  type CombatEvent,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { attachComponent } from '../src/ecs/markerHelpers';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { emitCombatEvent, type CombatContext } from '../src/systems/combat/engine/combatPipeline';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { equipItem } from '../src/systems/player/economy/inventory';
import { setLineageActive, unlockLineageCard } from '../src/systems/player/economy/lineages';
import { syncRhythmReadout } from '../src/systems/combat/rhythmReadout';
import { killPlayer } from '../src/systems/world/playerIncapacitation';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

initCombatSystems();
const world = new World();

// Count every write the slice gets: a patch mark is what puts it on the wire.
let rhythmWrites = 0;
const markPatched = world.dirty.markPatched.bind(world.dirty);
world.dirty.markPatched = (netId, key) => {
  if (key === 'showsRhythm') rhythmWrites++;
  markPatched(netId, key);
};

function makeSlices(id: string, weapon: string): PersistedPlayerSlices {
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
      essences: { red: 99_999, blue: 99_999, green: 99_999, yellow: 99_999, purple: 99_999 },
      shards: { tempo: 999, affliction: 999, engagement: 999, 'kill-chain': 999, empowered: 999 },
      capstones: {},
      biomeXP: {}, biomeLevel: { forest: 99, cave: 99 },
      unlockedRecipes: [], questProgress: {}, playerTier: 4, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [weapon], equipment: { ...emptyEquipment() }, itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

function spawn(id: string, weapon: string, lineageId: string, cardIds: string[]): PlayerEntity {
  const player = world.attachPlayerEntity(makeSlices(id, weapon), id);
  equipItem(world, player, weapon);
  for (const cardId of cardIds) {
    const bought = unlockLineageCard(world, player, lineageId, cardId);
    assert(bought.success, `${cardId}: ${bought.reason}`);
  }
  world.takeNodeEvents(NODE);
  return player;
}

/**
 * As `spawn`, wearing the lineage's T2 form. Since design §26.1 (legibility run) a
 * weapon's T1 band has one verb, its own; the other verbs, and a lean of another
 * lane composing with them, are T2 cards.
 */
function spawnT2(id: string, t1Form: string, t2Form: string, lineageId: string, cardIds: string[]): PlayerEntity {
  const slices = makeSlices(id, t1Form);
  slices.holdsInventory.inventory = [t1Form, t2Form];
  const player = world.attachPlayerEntity(slices, id);
  equipItem(world, player, t1Form);
  equipItem(world, player, t2Form);
  for (const cardId of cardIds) {
    const bought = unlockLineageCard(world, player, lineageId, cardId);
    assert(bought.success, `${cardId}: ${bought.reason}`);
  }
  world.takeNodeEvents(NODE);
  return player;
}

let nextX = 500;
function monster(): MonsterEntity {
  nextX += 400;
  const m = world.createMonster(NODE, 'plains-slime', { x: nextX, y: 400 });
  if (!m) throw new Error('failed to spawn a monster');
  m.hasHealth.maxHp = 100_000;
  m.hasHealth.hp = 100_000;
  return m;
}

function fullHit(player: PlayerEntity, defender: MonsterEntity, damage = 200): CombatContext {
  const ctx = {
    attacker: player, attackerType: 'player',
    defender, defenderType: 'monster',
    damage, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext;
  emitCombatEvent('beforeAttack', ctx, world);
  emitCombatEvent('onHit', ctx, world);
  return ctx;
}

function kill(player: PlayerEntity, defender: MonsterEntity): void {
  emitCombatEvent('onKill', {
    attacker: player, attackerType: 'player',
    defender, defenderType: 'monster',
    damage: 200, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext, world);
}

function cardFx(): Array<Extract<CombatEvent, { kind: 'card-fx' }>> {
  return world.takeNodeEvents(NODE)
    .filter((e): e is Extract<CombatEvent, { kind: 'card-fx' }> => e.kind === 'card-fx');
}

const FLURRY = 'rapier-t1-tempo-payoff';

// ── Presence: attached only while a triggered card is in play ────────────────

{
  const player = spawn('rhy-presence', 'flash-rapier', 'rapier', ['rapier-t1-speed']);
  assert(player.showsRhythm === undefined, 'a lean alone is a stat — no rhythm, no slice');

  assert(unlockLineageCard(world, player, 'rapier', FLURRY).success, 'Flurry bought');
  assert(player.showsRhythm !== undefined, 'buying a verb attaches the readout');
  assert(Object.keys(player.showsRhythm!.moments).join() === FLURRY, 'one moment, keyed by the verb\'s card id');

  assert(setLineageActive(world, player, 'rapier', 'payoff', null).success, 'verb row cleared');
  assert(player.showsRhythm === undefined, 'the last triggered card gone detaches it');
  assert(setLineageActive(world, player, 'rapier', 'payoff', FLURRY).success, 'Flurry slotted again');
  assert(player.showsRhythm !== undefined, 'and slotting it back re-attaches it');
}

// ── hit-nth: Flurry counts 1..5, fires on the 6th, resets ────────────────────

{
  const player = spawn('rhy-flurry', 'flash-rapier', 'rapier', ['rapier-t1-speed', FLURRY]);
  const target = monster();
  setAttackTarget(world, player, target.isMonster.id);
  world.takeNodeEvents(NODE);
  const swing = () => runPlayerAttack(world, player, target, Date.now(), {
    attackOrigin: { ...player.hasPosition.current },
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });

  assert(player.showsRhythm!.moments[FLURRY]?.count === undefined, 'a fresh count rests at 0 (absent)');
  for (let hit = 1; hit <= 5; hit++) {
    swing();
    const count = player.showsRhythm!.moments[FLURRY]?.count;
    assert(count === hit, `hit ${hit}: the readout counts ${hit}, got ${count}`);
    assert(cardFx().length === 0, `hit ${hit}: nothing fires before the 6th`);
  }
  swing();
  assert(player.showsRhythm!.moments[FLURRY]?.count === undefined, 'the 6th hit fires and the count resets');
  const fx = cardFx();
  assert(fx.length === 1 && fx[0].cardId === FLURRY, 'its card-fx names the card that fired');
  assert(fx[0].fx === 'tempo.ghost-strike', 'and still draws the payload\'s own fx');
  swing();
  assert(player.showsRhythm!.moments[FLURRY]?.count === 1, 'and counts again from 1');
  cardFx();

  // NEVER WRITTEN WHEN NOTHING CHANGED.
  const before = rhythmWrites;
  const moments = player.showsRhythm!.moments;
  syncRhythmReadout(world, player);
  syncRhythmReadout(world, player);
  assert(rhythmWrites === before, 'a sync that finds the same state writes nothing');
  assert(player.showsRhythm!.moments === moments, 'and leaves the slice untouched');
  for (let i = 0; i < 20; i++) world.tick(100, Date.now());
  assert(rhythmWrites === before, `world ticks never write the readout (got ${rhythmWrites - before})`);
}

// ── A capped Affliction verb exposes its cap ─────────────────────────────────

{
  // The Engagement lean + the Affliction verb (the T2 band: Honed Further + Deep
  // Bloodletting): a hit on an afflicted target (once every 5 s) is a lunge. The
  // DoT root afflicts on its own hits.
  const VENOM_POINT = 'rapier-t2-affliction-payoff';
  const player = spawnT2('rhy-cap', 'flash-rapier', 'gale-needle', 'rapier', ['rapier-t2-engagement-stat', VENOM_POINT]);
  attachComponent(world, player, 'appliesDots', initAppliesDots());
  const target = monster();

  fullHit(player, target);
  assert(cardFx().length === 0, 'the hit that first afflicts does not fire');
  assert(player.showsRhythm!.moments[VENOM_POINT]?.capUntil === undefined, 'no cap before the first firing');

  const writesBefore = rhythmWrites;
  const firedAt = Date.now();
  fullHit(player, target);
  const fired = cardFx();
  assert(fired.length === 1 && fired[0].cardId === VENOM_POINT, 'the afflicted hit fires Venom Point');
  const capUntil = player.showsRhythm!.moments[VENOM_POINT]?.capUntil ?? -1;
  assert(capUntil > 0, 'the cap is exposed the moment it starts');
  assert(
    capUntil >= firedAt + 4_000 && capUntil <= Date.now() + 5_000,
    `and it clears five seconds out, got ${capUntil - firedAt} ms`,
  );
  assert(rhythmWrites === writesBefore + 1, `the cap is written once, got ${rhythmWrites - writesBefore}`);

  for (let i = 0; i < 4; i++) fullHit(player, target);
  // Only the verb's own firings: the Gale Needle's capstone (Gale Wake) answers the
  // DoT root's mechanic on its own clock and is not this moment.
  assert(cardFx().filter((e) => e.cardId === VENOM_POINT).length === 0, 'the cap holds');
  assert(rhythmWrites === writesBefore + 1, 'and its clock is never re-sent while it runs');

  tickCooldowns(player.tracksCombat, 5_000);
  syncRhythmReadout(world, player);
  assert(player.showsRhythm!.moments[VENOM_POINT]?.capUntil === undefined, 'a cleared cap leaves the moment ready');
  cardFx();
}

// ── first-hit per body: the spent list ───────────────────────────────────────

{
  const OPENING_LUNGE = 'rapier-t2-engagement-payoff';
  const player = spawnT2('rhy-lunge', 'flash-rapier', 'gale-needle', 'rapier', [OPENING_LUNGE]);
  const a = monster();
  const b = monster();
  assert(player.showsRhythm!.moments[OPENING_LUNGE]?.spentOn === undefined, 'nothing spent yet');

  fullHit(player, a);
  assert(cardFx().length === 1, 'the first hit on a body lunges');
  assert(player.showsRhythm!.moments[OPENING_LUNGE]?.spentOn?.join() === a.isMonster.id, 'spent on that body');

  const before = rhythmWrites;
  fullHit(player, a);
  assert(cardFx().length === 0 && rhythmWrites === before, 'a second hit on it changes nothing and writes nothing');

  fullHit(player, b);
  assert(cardFx().length === 1, 'a new body is a new opening');
  assert(
    player.showsRhythm!.moments[OPENING_LUNGE]?.spentOn?.join() === `${a.isMonster.id},${b.isMonster.id}`,
    'and joins the spent list',
  );
}

// ── kill carry: armed between the kill and the next landed hit ───────────────

{
  const CARRY = 'axe-t2-kill-chain-payoff';
  const player = spawnT2('rhy-carry', 'chaotic-axe', 'ruinous-axe', 'axe', [CARRY]);
  const target = monster();
  assert(player.showsRhythm!.moments[CARRY]?.armed === undefined, 'nothing armed before a kill');
  kill(player, monster());
  assert(player.showsRhythm!.moments[CARRY]?.armed === true, 'a kill arms the next hit');
  fullHit(player, target);
  assert(player.showsRhythm!.moments[CARRY]?.armed === undefined, 'the next landed hit spends it');
  const fx = cardFx();
  assert(fx.length === 1 && fx[0].cardId === CARRY, 'and fires it, by name');
}

// ── Death detaches with the card cache ───────────────────────────────────────

{
  const player = spawn('rhy-death', 'flash-rapier', 'rapier', [FLURRY]);
  assert(player.showsRhythm !== undefined, 'a verb is in play');
  killPlayer(world, player.isPlayer.id, {
    kind: 'melee',
    killer: { monsterTypeId: 'plains-slime', monsterName: 'Slime', isBoss: false, nodeId: NODE },
    damage: 1,
  });
  assert(player.showsRhythm === undefined, 'death wipes the card cache, and the readout goes with it');
  world.takeNodeEvents(NODE);
}

console.log('rhythmReadout: ok');
