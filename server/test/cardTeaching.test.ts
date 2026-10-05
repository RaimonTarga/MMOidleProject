/**
 * The teaching counter and the ring's away count (design §26.4; legibility run,
 * Contract 2), wired through real swings.
 *
 * WHAT THIS PINS — wiring and invariants, not balance:
 *
 *   - a card's first three ON-SCREEN firings carry `card-fx.teach`, the fourth and
 *     every later one do not, and `TracksProgression.cardFiringsTaught` counts
 *     them (stops at 3);
 *   - a firing while the client is away (`setFightOnScreen(false)`, the hidden
 *     tab) never teaches and never counts; it raises the card's away count on its
 *     `ShowsRhythm` moment instead, which survives the readout's own syncs and is
 *     cleared by the next on-screen firing;
 *   - the counter is persisted state: it survives the save's JSON round trip and
 *     hydration normalises it (absent → `{}`, counts clamped to 0..3);
 *   - `resetPlayerProgress` wipes it.
 *
 * Run: node --conditions=development --import tsx test/cardTeaching.test.ts
 */
import {
  CARD_TEACHING_FIRINGS,
  GAME_CONFIG,
  LINEAGE_DATABASE,
  baseRecoveryForTier,
  emptyEquipment,
  normalizeFiringsTaught,
  type CombatEvent,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { equipItem } from '../src/systems/player/economy/inventory';
import { unlockLineageCard } from '../src/systems/player/economy/lineages';
import { setFightOnScreen, syncRhythmReadout } from '../src/systems/combat/rhythmReadout';
import { resetPlayerProgress } from '../src/admin/gameActions';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

initCombatSystems();
const world = new World();

// The Rapier's Tempo verb — a `hit-nth` moment, so a known number of swings
// fires it. Found by shape rather than id, so a renamed card id still resolves.
const rapier = LINEAGE_DATABASE.get('rapier');
assert(rapier, 'fixture: the rapier lineage');
const VERB = rapier!.cards.find((c) => c.tier === 1 && c.row === 'payoff' && c.lane === 'tempo')?.id;
assert(VERB, 'fixture: the rapier T1 Tempo verb');

function makeSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
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
    holdsInventory: { inventory: ['flash-rapier'], equipment: { ...emptyEquipment() }, itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

function spawn(id: string): { player: PlayerEntity; target: MonsterEntity } {
  const player = world.attachPlayerEntity(makeSlices(id), id);
  equipItem(world, player, 'flash-rapier');
  const bought = unlockLineageCard(world, player, 'rapier', VERB!);
  assert(bought.success, `${VERB}: ${bought.reason}`);
  assert(player.showsRhythm?.moments[VERB!], 'the verb has a moment on the readout');
  const target = world.createMonster(NODE, 'plains-slime', { x: 600, y: 400 });
  if (!target) throw new Error('failed to spawn a monster');
  target.hasHealth.maxHp = 1_000_000;
  target.hasHealth.hp = 1_000_000;
  setAttackTarget(world, player, target.isMonster.id);
  world.takeNodeEvents(NODE);
  return { player, target };
}

type CardFx = Extract<CombatEvent, { kind: 'card-fx' }>;

/** Swing until the verb fires once; return its card-fx. */
function fireOnce(player: PlayerEntity, target: MonsterEntity): CardFx {
  for (let swing = 0; swing < 40; swing++) {
    runPlayerAttack(world, player, target, Date.now(), {
      attackOrigin: { ...player.hasPosition.current },
      aggroSource: { id: player.isPlayer.id, kind: 'player' },
    });
    const fired = world.takeNodeEvents(NODE)
      .filter((e): e is CardFx => e.kind === 'card-fx' && e.cardId === VERB);
    if (fired.length > 0) {
      assert(fired.length === 1, 'one card-fx per firing');
      return fired[0];
    }
  }
  throw new Error('the verb never fired in 40 swings');
}

// ── On screen: three firings teach, then never ───────────────────────────────

{
  const { player, target } = spawn('teach-on-screen');
  assert(player.isAway === undefined, 'a player with no client report is on screen (never away)');
  assert(player.tracksProgression.cardFiringsTaught === undefined, 'nothing taught yet');
  for (let n = 1; n <= CARD_TEACHING_FIRINGS; n++) {
    const fx = fireOnce(player, target);
    assert(fx.teach === true, `firing ${n} teaches`);
    assert(player.tracksProgression.cardFiringsTaught?.[VERB!] === n, `the counter reads ${n}`);
  }
  for (let n = 0; n < 3; n++) {
    const fx = fireOnce(player, target);
    assert(fx.teach === undefined, 'after the third, a firing never teaches');
  }
  assert(player.tracksProgression.cardFiringsTaught?.[VERB!] === CARD_TEACHING_FIRINGS, 'the counter stops at 3');
}

// ── Away: no teaching, an away count on the ring, cleared on return ──────────

{
  const { player, target } = spawn('teach-away');
  setFightOnScreen(world, player, false);
  assert(player.isAway !== undefined, 'a hidden tab attaches the away marker');

  for (let n = 1; n <= 2; n++) {
    const fx = fireOnce(player, target);
    assert(fx.teach === undefined, `away firing ${n} does not teach`);
    assert(player.showsRhythm?.moments[VERB!]?.away === n, `the away count reads ${n}`);
  }
  assert(player.tracksProgression.cardFiringsTaught?.[VERB!] === undefined, 'an unseen firing is not counted');

  // The readout's own syncs keep the away count (it is not a runtime counter).
  syncRhythmReadout(world, player);
  assert(player.showsRhythm?.moments[VERB!]?.away === 2, 'a sync keeps the away count');

  setFightOnScreen(world, player, true);
  assert(player.isAway === undefined, 'a visible tab detaches it');
  assert(player.showsRhythm?.moments[VERB!]?.away === 2, 'returning alone does not clear the count');

  const fx = fireOnce(player, target);
  assert(fx.teach === true, 'the first on-screen firing teaches');
  assert(player.showsRhythm?.moments[VERB!]?.away === undefined, 'and clears the away count');
  assert(player.tracksProgression.cardFiringsTaught?.[VERB!] === 1, 'and is the first one counted');
}

// ── Persistence: the save round trip and hydration's normaliser ──────────────

{
  const { player, target } = spawn('teach-save');
  fireOnce(player, target);
  fireOnce(player, target);
  const saved = JSON.parse(JSON.stringify(player.tracksProgression)) as { cardFiringsTaught?: unknown };
  const loaded = normalizeFiringsTaught(saved.cardFiringsTaught);
  assert(loaded[VERB!] === 2, 'the counter survives the save');

  assert(Object.keys(normalizeFiringsTaught(undefined)).length === 0, 'an old save has none: {}');
  assert(Object.keys(normalizeFiringsTaught([1, 2])).length === 0, 'a malformed map reads {}');
  const clamped = normalizeFiringsTaught({ a: 7, b: -1, c: 1.6, d: 'x', e: 0 });
  assert(clamped.a === CARD_TEACHING_FIRINGS, 'counts clamp to 3');
  assert(clamped.c === 1, 'and floor to whole firings');
  assert(!('b' in clamped) && !('d' in clamped) && !('e' in clamped), 'and zero or junk entries drop');
}

// ── Reset wipes it ────────────────────────────────────────────────────────────

{
  const { player, target } = spawn('teach-reset');
  fireOnce(player, target);
  assert(player.tracksProgression.cardFiringsTaught?.[VERB!] === 1, 'one taught');
  resetPlayerProgress(world, player);
  assert(Object.keys(player.tracksProgression.cardFiringsTaught ?? {}).length === 0, 'a progress reset wipes the counter');
}

console.log('cardTeaching: ok');
