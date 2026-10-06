/**
 * The Squire's re-homed T3 paths (design §22.5; ability-pass run W1-D).
 *
 *   Reverb    the execution echoes: it lands now and lands again at the authored
 *             share of its own multiplier when the recharge reaches the halfway
 *             mark, on whatever the player is hitting then — and is LOST, not
 *             held, when nothing is in reach. The echo is a mechanic hit
 *             (`mechanicConsumed`, one `mechanic-fired`) that never restarts the
 *             recharge and never spends an execution that is already waiting.
 *
 * WHAT THIS PINS is the wiring and the shape, never a balance number: every
 * magnitude is read off `SKILL_TREE` or resolved through the same function the
 * runtime uses, so a designer's hand edit moves this test with it.
 *
 * Run: node --conditions=development --import tsx test/t3SquirePaths.test.ts
 */
import {
  GAME_CONFIG,
  SKILL_TREE,
  baseRecoveryForTier,
  emptyEquipment,
  mergePassives,
  type CombatEvent,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { registerCombatListener } from '../src/systems/combat/engine/combatPipeline';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import {
  proxyEmpoweredMultiplier,
  setEmpoweredAttack,
} from '../src/systems/combat/engine/empoweredAttacks';
import { registerMechanicFiredListener } from '../src/systems/combat/engine/mechanicFired';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import {
  resolveExecutionCooldownMs,
  updateCooldownArchetype,
} from '../src/systems/classes/archetypes/cooldown/cooldownPrototype';
import { getFrameCharge } from '../src/systems/classes/shared/frameLoop';
import { COOLDOWN_T3_BUFFS } from '../src/systems/classes/archetypes/cooldown/t3';
import {
  getReverbEchoClock,
  reverbEchoDueAtMs,
  reverbEchoPending,
} from '../src/systems/classes/archetypes/cooldown/t3/core/selectors';
import { updateReverbEcho } from '../src/systems/classes/archetypes/cooldown/t3/ticks/balanced/reverbEcho';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
let now = 1_000_000;

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

// ── Observers ────────────────────────────────────────────────────────────────

/** Every player hit that reached `afterHit`, with its final metadata. */
interface SeenHit { attackerId: string; targetId: string; damage: number; metadata: Record<string, unknown> }
const hits: SeenHit[] = [];
registerCombatListener('afterHit', (ctx) => {
  if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
  hits.push({
    attackerId: ctx.attacker.isPlayer.id,
    targetId: ctx.defender.isMonster.id,
    damage: ctx.damage,
    metadata: { ...ctx.metadata },
  });
});
const fires: string[] = [];
registerMechanicFiredListener((_world, player) => { fires.push(player.isPlayer.id); });

// ── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * A Squire wearing one frame and one T3 path, with both nodes' AUTHORED effects
 * folded into its passives the way `recalculatePlayerStats` folds them.
 */
function spawn(id: string, frameNodeId: string, pathNodeId: string): PlayerEntity {
  const player = world.attachPlayerEntity(makeSlices(id), id);
  player.usesSkills.combatArchetype = 'cooldown';
  player.dealsDamage.attack = 100;
  for (const nodeId of [frameNodeId, pathNodeId]) {
    const node = SKILL_TREE.get(nodeId);
    assert(node, `${nodeId}: node is missing from the skill tree`);
    player.usesSkills.selectedSubVariant = node.subVariantId ?? null;
    mergePassives(player.usesSkills.passives, node.mechanicEffects);
  }
  syncArchetypeSlices(world, player);
  assert(player.usesCooldown, `${id}: the cooldown slice should be attached`);
  updateCooldownArchetype(world, 0); // first pass starts the preparation cycle
  return player;
}

/** A sturdy target standing in the player's reach. */
function monster(player: PlayerEntity, dx = 24): MonsterEntity {
  const m = world.createMonster(NODE, 'plains-slime', {
    x: player.hasPosition.current.x + dx,
    y: player.hasPosition.current.y,
  });
  if (!m) throw new Error('failed to spawn a target');
  m.hasHealth.maxHp = 1_000_000;
  m.hasHealth.hp = 1_000_000;
  return m;
}

function swing(player: PlayerEntity, target: MonsterEntity, metadata: Record<string, unknown> = {}): void {
  now += 100;
  runPlayerAttack(world, player, target, now, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
    metadata,
  });
}

const authored = (nodeId: string, key: string): number => {
  const value = (SKILL_TREE.get(nodeId)?.mechanicEffects as Record<string, number> | undefined)?.[key];
  assert(typeof value === 'number', `${nodeId} must author ${key}`);
  return value as number;
};

function playerHits(events: CombatEvent[], playerId: string): Array<Extract<CombatEvent, { kind: 'player-hit' }>> {
  return events.filter((e): e is Extract<CombatEvent, { kind: 'player-hit' }> =>
    e.kind === 'player-hit' && e.playerId === playerId);
}

const REVERB = 'cooldown-balanced-t3-a';

// ── Reverb: the node ─────────────────────────────────────────────────────────

{
  const node = SKILL_TREE.get(REVERB)!;
  assert(node.packet === 'empowered', `Reverb stays Empowered (design §22.5), got ${node.packet}`);
  assert(authored(REVERB, 'cooldown.reverb-echo-strength') > 0, 'Reverb authors its echo strength on the node');
  assert(
    !('cooldown.reverb-bonus-per-attack' in (node.mechanicEffects as Record<string, number>)),
    'the bank is gone: no per-attack charge into the next execution',
  );
}

// ── Reverb: the execution echoes at the halfway mark ─────────────────────────

{
  const player = spawn('sq-reverb', 'cooldown-balanced', REVERB);
  const target = monster(player);
  setAttackTarget(world, player, target.isMonster.id);
  assert(
    world.collision.canReach(player, target, player.performsAttack.attackRange),
    'fixture: the target stands in reach',
  );
  const cycleMs = resolveExecutionCooldownMs(player);
  const dueAtMs = reverbEchoDueAtMs(player);
  assert(dueAtMs === cycleMs * 0.5, `the echo is due at the halfway mark (${dueAtMs} of ${cycleMs})`);

  // A regular hit first: the reference damage, and the Knight bank's first charge.
  hits.length = 0;
  swing(player, target);
  assert(hits.length === 1 && hits[0].metadata['empoweredAttack'] !== true, 'a regular hit is not empowered');
  assert(!reverbEchoPending(player), 'a regular hit owes no echo');
  const bankBefore = getFrameCharge(player.tracksCombat, 'cooldown');

  // The execution.
  hits.length = 0;
  fires.length = 0;
  setEmpoweredAttack(world, player);
  swing(player, target);
  assert(hits.length === 1 && hits[0].metadata['mechanicConsumed'] === true, 'the execution spends its charge');
  assert(fires.length === 1, `the execution announces the mechanic once, got ${fires.length}`);
  assert(reverbEchoPending(player), 'the execution marks its echo due');
  assert(player.usesCooldown!.executionCooldownMs === cycleMs, 'the execution restarts the recharge');

  // The HUD clock: a full half-cycle to run, read off the recharge itself.
  const reverbBuff = COOLDOWN_T3_BUFFS.find((buff) => buff.id === 'cooldown-reverb');
  assert(reverbBuff, 'the Reverb tile is registered');
  const tile = reverbBuff.project({ player, playerCs: player.tracksCombat, world, now });
  assert(tile, 'the pending echo shows on the buff bar');
  assert(tile.durationPct === 100 && tile.remainingMs === cycleMs - dueAtMs,
    `the clock starts full at ${cycleMs - dueAtMs}ms, got ${tile.durationPct}% / ${tile.remainingMs}ms`);
  player.usesCooldown!.executionCooldownMs = dueAtMs + (cycleMs - dueAtMs) / 2;
  assert(getReverbEchoClock(player)!.remainingMs === (cycleMs - dueAtMs) / 2, 'the clock follows the recharge');

  // Not yet.
  player.usesCooldown!.executionCooldownMs = dueAtMs + 1;
  hits.length = 0;
  updateReverbEcho(world, now);
  assert(hits.length === 0, 'no echo before the halfway mark');
  assert(reverbEchoPending(player), 'and the echo is still due');

  // The halfway mark: the echo lands on the target in reach.
  player.usesCooldown!.executionCooldownMs = dueAtMs;
  world.takeNodeEvents(NODE);
  hits.length = 0;
  fires.length = 0;
  now += 100;
  updateReverbEcho(world, now);
  assert(hits.length === 1, `the echo lands once at the halfway mark, got ${hits.length}`);
  const echo = hits[0];
  assert(echo.targetId === target.isMonster.id, 'on whatever the player is hitting');
  assert(echo.metadata['reverbEcho'] === true, 'the echo is tagged as the echo');
  assert(echo.metadata['empoweredAttack'] === true, 'the echo is an empowered hit');
  assert(echo.metadata['mechanicConsumed'] === true, 'the echo records mechanicConsumed like every mechanic hit');
  const expected = proxyEmpoweredMultiplier(world, player)! * authored(REVERB, 'cooldown.reverb-echo-strength');
  assert(
    Math.abs(Number(echo.metadata['empoweredMultiplier']) - expected) < 1e-9,
    `ONE multiplier: the execution's own times the echo strength (${expected}), got ${String(echo.metadata['empoweredMultiplier'])}`,
  );
  assert(fires.length === 1, `the echo announces the mechanic exactly once, got ${fires.length}`);
  assert(player.usesCooldown!.executionCooldownMs === dueAtMs, 'the echo never restarts the recharge');
  assert(getFrameCharge(player.tracksCombat, 'cooldown') === 0, 'the execution spent the bank; the echo neither spends nor banks');
  assert(bankBefore > 0, 'fixture: the regular hit banked a charge for the execution to spend');
  assert(!reverbEchoPending(player), 'the echo is spent');
  assert(
    reverbBuff.project({ player, playerCs: player.tracksCombat, world, now }) === null,
    'and its clock leaves the buff bar',
  );
  const drawn = playerHits(world.takeNodeEvents(NODE), player.isPlayer.id);
  assert(drawn.length === 1 && drawn[0].empowered === true, 'the client draws the echo as an empowered hit');

  // Only once: the next tick owes nothing.
  hits.length = 0;
  updateReverbEcho(world, now + 100);
  assert(hits.length === 0, 'one execution, one echo');
}

// ── Reverb: nothing in reach at the halfway mark — the echo is lost ─────────

{
  const player = spawn('sq-reverb-lost', 'cooldown-balanced', REVERB);
  const target = monster(player, 60);
  setAttackTarget(world, player, target.isMonster.id);
  const dueAtMs = reverbEchoDueAtMs(player);

  setEmpoweredAttack(world, player);
  swing(player, target);
  assert(reverbEchoPending(player), 'fixture: the execution owes an echo');

  // The player is hitting nothing when the halfway mark arrives.
  setAttackTarget(world, player, null);
  player.usesCooldown!.executionCooldownMs = dueAtMs;
  hits.length = 0;
  updateReverbEcho(world, now);
  assert(hits.length === 0, 'with nothing in reach the echo lands nowhere');
  assert(!reverbEchoPending(player), 'and is LOST, not held');

  // A target coming back afterwards finds no echo waiting for it.
  setAttackTarget(world, player, target.isMonster.id);
  player.usesCooldown!.executionCooldownMs = dueAtMs - 500;
  updateReverbEcho(world, now);
  assert(hits.length === 0, 'a lost echo never comes back');

  // Out of reach is the same as nothing: a target held but too far away.
  setEmpoweredAttack(world, player);
  swing(player, target);
  assert(reverbEchoPending(player), 'fixture: a second execution owes a second echo');
  target.hasPosition.current = { x: player.hasPosition.current.x + 2_000, y: player.hasPosition.current.y };
  assert(
    !world.collision.canReach(player, target, player.performsAttack.attackRange),
    'fixture: the target has walked out of reach',
  );
  player.usesCooldown!.executionCooldownMs = dueAtMs;
  hits.length = 0;
  updateReverbEcho(world, now);
  assert(hits.length === 0 && !reverbEchoPending(player), 'an out-of-reach target loses the echo too');
}

// ── Reverb: the echo never spends an execution that is already waiting ──────

{
  const player = spawn('sq-reverb-hold', 'cooldown-balanced', REVERB);
  const target = monster(player, -24);
  setAttackTarget(world, player, target.isMonster.id);

  setEmpoweredAttack(world, player);
  swing(player, target);
  assert(reverbEchoPending(player), 'fixture: the execution owes an echo');

  // A Refund kill (or anything else) readies the execution on the echo's beat.
  player.usesCooldown!.executionCooldownMs = 0;
  setEmpoweredAttack(world, player);
  hits.length = 0;
  updateReverbEcho(world, now);
  assert(hits.length === 1 && hits[0].metadata['reverbEcho'] === true, 'the echo still lands');
  assert(player.hasEmpoweredAttack !== undefined, 'and the waiting execution is still waiting');
}

// ── Reverb: wired into the live tick ─────────────────────────────────────────
//
// The real path: the node bought through `unlockedSkills`, passives from the
// recalc, auto-attacks from the combat loop, the echo from the module tick.

{
  const live = new World();
  const slices = makeSlices('sq-reverb-live');
  slices.hasPosition.nodeId = 'node-clearing';
  slices.hasHealth.hp = slices.hasHealth.maxHp = 1_000_000;
  slices.usesSkills = {
    unlockedSkills: ['cooldown-root', 'cooldown-balanced', REVERB],
    passives: {}, selectedClass: 'cooldown-root',
    selectedSubVariant: 'balanced', selectedRange: null, combatArchetype: 'cooldown',
  };
  const player = live.attachPlayerEntity(slices, 'sq-reverb-live');
  syncArchetypeSlices(live, player);
  recalculatePlayerEntityStats(live, player);
  assert(
    player.usesSkills.passives['cooldown.reverb-echo-strength'] === authored(REVERB, 'cooldown.reverb-echo-strength'),
    'the recalc folds the authored echo strength into the passives',
  );
  const target = live.createMonster('node-clearing', 'plains-slime', { x: 420, y: 400 });
  if (!target) throw new Error('failed to spawn a target');
  target.hasHealth.hp = target.hasHealth.maxHp = 10_000_000;

  hits.length = 0;
  let t = 0;
  for (let i = 0; i < 260; i++) { t += 100; live.tick(100, t); } // 26 s
  const mine = hits.filter((h) => h.attackerId === 'sq-reverb-live');
  const executions = mine.filter((h) => h.metadata['mechanicConsumed'] === true && h.metadata['reverbEcho'] !== true);
  const echoes = mine.filter((h) => h.metadata['reverbEcho'] === true);
  assert(executions.length >= 2, `the live loop fires executions, got ${executions.length}`);
  assert(echoes.length >= 2, `and each one echoes at the halfway mark, got ${echoes.length}`);
  assert(echoes.length <= executions.length, 'never more echoes than executions');
}

console.log('t3SquirePaths.test.ts: ok');
