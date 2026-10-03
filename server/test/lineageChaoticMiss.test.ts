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
 * Run: node --conditions=development --import tsx test/lineageChaoticMiss.test.ts
 */
import {
  GAME_CONFIG,
  baseRecoveryForTier,
  emptyEquipment,
  getCounter,
  getLineageRuntime,
  type CombatEvent,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { equipItem } from '../src/systems/player/economy/inventory';
import { unlockLineageCard } from '../src/systems/player/economy/lineages';
import { nthCounter } from '../src/systems/combat/lineageKeys';

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

console.log('lineageChaoticMiss: ok');
