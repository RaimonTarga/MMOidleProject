/**
 * The Tempo moment counts LANDED hits on the Chaotic Axe (course-correction W3-A,
 * the defect W2-C found).
 *
 * The Chaotic Axe whiffs on a fixed schedule — every 3rd swing carries
 * `ctx.metadata.chaoticMiss` (`weapon.dead-swing-interval` 3) — and the Tempo
 * moment fires on every 6th hit. While `hit-nth` counted swings, every firing
 * landed on a whiff (swings 6, 12, 18, 24 are all whiffs), so the Axe's Tempo verb
 * (Chopping Rhythm) never paid a hit-shaped payload and its pure echo echoed a
 * miss. A whiff now neither advances nor fires the counter.
 *
 * WHAT THIS PINS, with a real World and real swings (`runPlayerAttack`):
 *
 *   - 24 swings whiff exactly 8 times (the schedule is what the test assumes);
 *   - the verb fires on the 6th and 12th LANDED swing — twice, never on a whiff;
 *   - with a hit-shaped payload (Hewing Arc's `mechanic-proxy`) it now PAYS, where
 *     before every firing was a whiff the payload refused;
 *   - the counter the rhythm readout shows is the counter the server keeps
 *     (16 landed swings → 4 toward the next firing), on both.
 *
 * And the same rule for the other three hit moments (verbs-that-fire C, the
 * report's "latent, not fixed"): `first-hit`, `hit-afflicted` and `hit-held`
 * neither fire on a whiff nor spend their latch or cap on it, so the first LANDED
 * hit after the whiff is the one that pays. No T1 Axe lane carries these moments,
 * so each is seeded onto the Axe-wielder's runtime as its T1 pure pair (the lunge,
 * the redose, the knockdown) and swung for real; before the fix the whiff spent
 * the latch or started the cap, and the landed swing after it paid nothing.
 *
 * Run: node --conditions=development --import tsx test/lineageChaoticMiss.test.ts
 */
import {
  GAME_CONFIG,
  applyStatusEffect,
  baseRecoveryForTier,
  emptyEquipment,
  getCounter,
  getLineageRuntime,
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
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { equipItem } from '../src/systems/player/economy/inventory';
import { unlockLineageCard } from '../src/systems/player/economy/lineages';
import { nthCounter } from '../src/systems/combat/lineageKeys';
import { LINEAGE_BLEED_ID } from '../src/systems/combat/damage/bleedIds';
import { applyMonsterSlow } from '../src/systems/combat/status/monsterControl';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
const VERB = 'axe-t1-tempo-payoff'; // Chopping Rhythm: every 6th hit
const SWINGS = 24;

initCombatSystems();
const world = new World();

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
      essences: { red: 99_999, blue: 99_999, green: 99_999, yellow: 99_999, purple: 99_999 },
      shards: { tempo: 999, 'kill-chain': 999, empowered: 999 },
      capstones: {},
      biomeXP: {}, biomeLevel: { cave: 99, forest: 99 },
      unlockedRecipes: [], questProgress: {}, playerTier: 4, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: ['chaotic-axe'], equipment: { ...emptyEquipment() }, itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

function axeWielder(id: string, cardIds: string[]): PlayerEntity {
  const player = world.attachPlayerEntity(makeSlices(id), id);
  assert(equipItem(world, player, 'chaotic-axe'), 'the Chaotic Axe is worn');
  assert(
    player.usesSkills.passives['weapon.dead-swing-interval'] === 3,
    `the Axe whiffs every 3rd swing, got ${player.usesSkills.passives['weapon.dead-swing-interval']}`,
  );
  for (const cardId of cardIds) {
    const bought = unlockLineageCard(world, player, 'axe', cardId);
    assert(bought.success, `${cardId}: ${bought.reason}`);
  }
  return player;
}

interface SwingLog {
  whiffs: number[];
  firings: number[];
  firingFx: string[];
}

/** Swing `SWINGS` times at one durable body; note which swings whiffed and which fired the verb. */
function swingAt(player: PlayerEntity, x: number): SwingLog {
  const target = world.createMonster(NODE, 'plains-slime', { x, y: 400 });
  assert(target, 'the target spawned');
  target!.hasHealth.maxHp = 1_000_000;
  target!.hasHealth.hp = 1_000_000;
  player.hasPosition.current = { x: x - 30, y: 400 };
  setAttackTarget(world, player, target!.isMonster.id);
  world.takeNodeEvents(NODE);
  const log: SwingLog = { whiffs: [], firings: [], firingFx: [] };
  for (let swing = 1; swing <= SWINGS; swing++) {
    runPlayerAttack(world, player, target!, Date.now(), {
      attackOrigin: { ...player.hasPosition.current },
      aggroSource: { id: player.isPlayer.id, kind: 'player' },
    });
    const events: CombatEvent[] = world.takeNodeEvents(NODE);
    if (events.some((e) => e.kind === 'player-miss' && e.playerId === player.isPlayer.id)) log.whiffs.push(swing);
    for (const e of events) {
      if (e.kind === 'card-fx' && e.cardId === VERB) {
        log.firings.push(swing);
        log.firingFx.push(e.fx);
      }
    }
  }
  return log;
}

const EXPECTED_WHIFFS = [3, 6, 9, 12, 15, 18, 21, 24];
// Landed swings are every swing that is not a whiff; the 6th and 12th of them.
const EXPECTED_FIRINGS = [8, 17];

function checkReadout(player: PlayerEntity, label: string): void {
  // 24 swings − 8 whiffs = 16 landed; 16 mod 6 = 4 toward the next firing.
  const serverCount = getCounter(player.tracksCombat, nthCounter(VERB));
  assert(serverCount === 4, `${label}: 16 landed hits leave the counter at 4, got ${serverCount}`);
  const shown = player.showsRhythm?.moments[VERB]?.count ?? 0;
  assert(shown === serverCount, `${label}: the readout shows ${shown}, the server keeps ${serverCount}`);
}

// ── The pure pair: Chopping Rhythm alone — every 6th hit strikes twice ───────

{
  const player = axeWielder('chaos-pure', [VERB]);
  const resolved = getLineageRuntime(player.tracksCombat)?.cards.find((c) => c.card.id === VERB);
  assert(resolved?.trigger?.kind === 'hit-nth' && resolved.trigger.n === 6, 'Chopping Rhythm fires on every 6th hit');
  assert(resolved?.payoff?.kind === 'echo-hit', 'with no lean it pays its own lane: the echo');

  const log = swingAt(player, 900);
  assert(
    JSON.stringify(log.whiffs) === JSON.stringify(EXPECTED_WHIFFS),
    `the Axe whiffs on swings ${EXPECTED_WHIFFS.join(',')}, got ${log.whiffs.join(',')}`,
  );
  assert(
    JSON.stringify(log.firings) === JSON.stringify(EXPECTED_FIRINGS),
    `the echo fires on the 6th and 12th LANDED swing (${EXPECTED_FIRINGS.join(',')}), got ${log.firings.join(',') || 'none'}`,
  );
  for (const swing of log.firings) {
    assert(!log.whiffs.includes(swing), `the echo fired on swing ${swing}, which was a whiff — it echoed a miss`);
  }
  checkReadout(player, 'pure');
}

// ── A hit-shaped payload: Hewing Arc × Chopping Rhythm (mechanic-proxy) ──────
//
// The payload refuses a whiff (`liveExchange`), so before the fix this pair drew
// NOTHING in 24 swings: all four firings were whiffs.

{
  const player = axeWielder('chaos-proxy', ['axe-t1-empowered-stat', VERB]);
  const resolved = getLineageRuntime(player.tracksCombat)?.cards.find((c) => c.card.id === VERB);
  assert(resolved?.payoff?.kind === 'mechanic-proxy', 'with Hewing Arc, the 6th hit counts as the mechanic');

  const log = swingAt(player, 1_500);
  assert(
    JSON.stringify(log.firings) === JSON.stringify(EXPECTED_FIRINGS),
    `the proxy pays on the 6th and 12th landed swing, got ${log.firings.join(',') || 'none'}`,
  );
  assert(log.firingFx.every((fx) => fx === 'empowered.mechanic-flash'), `drawn as the mechanic flash, got ${log.firingFx.join(',')}`);
  checkReadout(player, 'proxy');
}

// ── first-hit, hit-afflicted, hit-held: a whiff is not a landed hit either ───
//
// Each moment is seeded as its T1 pure pair onto a fresh Axe-wielder (whose 3rd
// swing whiffs), and the swings are arranged so the 3rd lands on the body the
// moment is waiting for. Before the fix that whiff spent the opener latch or
// started the 5 s cap, so the 4th swing — the first LANDED hit — paid nothing.

let seededCards = 0;
/** A T1 pure pair as the runtime sees it (cf. `lineageComposition.test.ts`). */
function seededVerb(
  lane: PacketId, trigger: LineageTrigger, payoff: LineagePayoff, fx: LineageFxKey, perTarget = false,
): ResolvedLineageCard {
  return {
    card: {
      id: `chaos-seeded-${++seededCards}`,
      lineageId: 'axe', tier: 1, row: 'payoff', lane,
      name: 'Seeded verb', description: '', fx,
    },
    requiredBiomeGroup: 'cave',
    requiredBiomeLevel: 4,
    requiredGlobalMastery: 0,
    cost: { essence: {}, shards: {} },
    trigger,
    payoff,
    payoffFx: fx,
    ...(perTarget ? { perTargetTrigger: true } : {}),
    composition: { verbLane: lane, pure: true },
  };
}

function seededAxe(id: string, card: ResolvedLineageCard): PlayerEntity {
  const player = axeWielder(id, []);
  setLineageRuntime(player.tracksCombat, { cards: [card], capstones: [] });
  return player;
}

let nextBodyX = 2_500;
function body(): MonsterEntity {
  nextBodyX += 400;
  const target = world.createMonster(NODE, 'plains-slime', { x: nextBodyX, y: 400 });
  assert(target, 'the target spawned');
  target!.hasHealth.maxHp = 1_000_000;
  target!.hasHealth.hp = 1_000_000;
  return target!;
}

/** One real swing at `target`: did it whiff, and did `card` pay on it? */
function swing(player: PlayerEntity, target: MonsterEntity, card: ResolvedLineageCard): { whiff: boolean; fired: boolean } {
  player.hasPosition.current = { x: target.hasPosition.current.x - 30, y: 400 };
  setAttackTarget(world, player, target.isMonster.id);
  world.takeNodeEvents(NODE);
  runPlayerAttack(world, player, target, Date.now(), {
    attackOrigin: { ...player.hasPosition.current },
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });
  const events: CombatEvent[] = world.takeNodeEvents(NODE);
  return {
    whiff: events.some((e) => e.kind === 'player-miss' && e.playerId === player.isPlayer.id),
    fired: events.some((e) => e.kind === 'card-fx' && e.cardId === card.card.id),
  };
}

// first-hit, per BODY (the Engagement verb's latch): the whiff on a new body is
// not its opening; the first landed hit is.
{
  const card = seededVerb('engagement', { kind: 'first-hit' }, { kind: 'big-hit', magnitude: 2 }, 'engagement.lunge', true);
  const player = seededAxe('chaos-first-body', card);
  const a = body();
  const b = body();
  const s1 = swing(player, a, card);
  const s2 = swing(player, a, card);
  assert(!s1.whiff && s1.fired, 'swing 1 lands on A: its opening lunge');
  assert(!s2.whiff && !s2.fired, 'swing 2 on A is not an opening');
  const s3 = swing(player, b, card);
  assert(s3.whiff, 'fixture: swing 3 whiffs');
  assert(!s3.fired, 'first-hit: a whiff on a new body does not fire');
  const s4 = swing(player, b, card);
  assert(
    !s4.whiff && s4.fired,
    'first-hit: the first LANDED hit on B is its opening — the whiff did not spend the per-body latch',
  );
}

// first-hit, per ENGAGEMENT: a whiff after a lull does not open the new pull.
{
  const card = seededVerb('engagement', { kind: 'first-hit' }, { kind: 'big-hit', magnitude: 2 }, 'engagement.lunge');
  const player = seededAxe('chaos-first-engagement', card);
  const target = body();
  assert(swing(player, target, card).fired, 'swing 1 opens the engagement');
  assert(!swing(player, target, card).fired, 'swing 2 is mid-engagement');
  tickCooldowns(player.tracksCombat, 60_000); // a lull: the engagement lapses
  const s3 = swing(player, target, card);
  assert(s3.whiff && !s3.fired, 'first-hit: a whiff after a lull does not open the next pull');
  const s4 = swing(player, target, card);
  assert(
    !s4.whiff && s4.fired,
    'first-hit: the first LANDED hit opens it — the whiff neither re-armed the clock nor spent the latch',
  );
}

// hit-afflicted (the Affliction pure pair: redose, capped 5 s).
{
  const card = seededVerb(
    'affliction', { kind: 'hit-afflicted', capMs: 5_000 },
    { kind: 'redose', magnitude: 1, durationMs: 4_000 }, 'affliction.double-dose',
  );
  const player = seededAxe('chaos-afflicted', card);
  const clean = body();
  const afflicted = body();
  const bleed = applyStatusEffect(afflicted.tracksCombat, {
    id: LINEAGE_BLEED_ID, sourceId: player.isPlayer.id, remainingMs: -1,
    data: { damagePerTick: 10, nextTickIn: 1_000, tickIntervalMs: 1_000, bleedMode: 0 },
  });
  bleed.stacks = 100;
  assert(!swing(player, clean, card).fired, 'swing 1 on a clean body is not on an afflicted target');
  assert(!swing(player, clean, card).fired, 'nor is swing 2');
  const s3 = swing(player, afflicted, card);
  assert(s3.whiff, 'fixture: swing 3 whiffs');
  assert(!s3.fired, 'hit-afflicted: a whiff on an afflicted target does not fire');
  const s4 = swing(player, afflicted, card);
  assert(!s4.whiff && s4.fired, 'hit-afflicted: the next LANDED hit fires — the whiff did not start the cap');
  assert(!swing(player, afflicted, card).fired, 'and the cap runs from the landed hit');
}

// hit-held (the Control pure pair: the knockdown, capped 5 s).
{
  const card = seededVerb(
    'control', { kind: 'hit-held', capMs: 5_000 },
    { kind: 'stun', magnitude: 1, durationMs: 1_500 }, 'control.knockdown',
  );
  const player = seededAxe('chaos-held', card);
  const free = body();
  const held = body();
  applyMonsterSlow(world, held, 0.2, 60_000, 'someone-else');
  assert(!swing(player, free, card).fired, 'swing 1 on a free body is not on a held target');
  assert(!swing(player, free, card).fired, 'nor is swing 2');
  const s3 = swing(player, held, card);
  assert(s3.whiff, 'fixture: swing 3 whiffs');
  assert(!s3.fired, 'hit-held: a whiff on a held target does not fire');
  const s4 = swing(player, held, card);
  assert(!s4.whiff && s4.fired, 'hit-held: the next LANDED hit fires — the whiff did not start the cap');
  assert(!swing(player, held, card).fired, 'and the cap runs from the landed hit');
}

console.log('lineageChaoticMiss: ok');
