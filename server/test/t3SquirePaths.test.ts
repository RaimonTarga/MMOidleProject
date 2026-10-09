/**
 * The Squire's re-homed T3 paths (design §22.5; ability-pass run W1-D).
 *
 *   Reverb    the execution echoes: it lands now and lands again at the authored
 *             share of its own multiplier when the recharge reaches the halfway
 *             mark, on whatever the player is hitting then — and is LOST, not
 *             held, when nothing is in reach. The echo is a mechanic hit
 *             (`mechanicConsumed`, one `mechanic-fired`) that never restarts the
 *             recharge and never spends an execution that is already waiting.
 *   Destroyer the execution is delivered by the player's Techniques: primed, it
 *             waits through ordinary (damaging) regular hits; the next Technique
 *             that LANDS fires it with its shape — the armed hit itself (Sweep
 *             cleaves it), a cast's target or area (Slam's circle, Snipe's
 *             range). An evaded armed hit did not land, so it stays primed. With
 *             the Signature keystone too, the one execution counts once.
 *
 * The Techniques used are the ones the ability pass keeps (Sweep armed, Slam and
 * Snipe cast; Imbue as the targetless self-cast).
 *
 * WHAT THIS PINS is the wiring and the shape, never a balance number: every
 * magnitude is read off `SKILL_TREE` or resolved through the same function the
 * runtime uses, so a designer's hand edit moves this test with it.
 *
 * Run: node --conditions=development --import tsx test/t3SquirePaths.test.ts
 */
import {
  ABILITY_DATABASE,
  COOLDOWN_REVERB_ECHO_FX,
  GAME_CONFIG,
  KEYSTONE_DEFINITIONS,
  SKILL_TREE,
  baseRecoveryForTier,
  emptyEquipment,
  keystoneFxKey,
  mergePassives,
  setCounter,
  setLineageRuntime,
  type CombatEvent,
  type ResolvedLineageCard,
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
import { attachComponent } from '../src/ecs/markerHelpers';
import { armTechnique } from '../src/systems/player/abilities/abilityArming';
import { updateAbilityCasts } from '../src/systems/player/abilities/abilityCasting';
import { castStrikeArea, resolveCastPayload } from '../src/systems/player/abilities/abilityEffects';
import { onTechniqueResolved } from '../src/systems/combat/techniqueResolved';
import { MONSTER_EVADE_ACC } from '../src/systems/defense/mitigation/evasion';

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
  assert(drawn[0].effects?.includes(COOLDOWN_REVERB_ECHO_FX) === true,
    'tagged as the echo, so the path draws the bell answering rather than a second execution');

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

// ══ Destroyer ════════════════════════════════════════════════════════════════

const DESTROYER = 'cooldown-heavy-t3-b';
const SWEEP = ABILITY_DATABASE.get('sweep')!;
const SLAM = ABILITY_DATABASE.get('slam')!;
const SNIPE = ABILITY_DATABASE.get('snipe')!;
const IMBUE = ABILITY_DATABASE.get('imbue-lightning')!;
const SECOND_WIND = ABILITY_DATABASE.get('second-wind')!;
assert(SWEEP?.shape === 'armed' && SWEEP.slot === 'technique', 'fixture: Sweep is an armed Technique');
assert(SLAM?.shape === 'cast' && SLAM.slot === 'technique', 'fixture: Slam is a cast Technique');
assert(SNIPE?.shape === 'cast' && SNIPE.slot === 'technique', 'fixture: Snipe is a cast Technique');
assert(IMBUE?.shape === 'instant' && IMBUE.slot === 'technique', 'fixture: Imbue is an instant Technique (design §22.9)');
assert(SECOND_WIND?.slot === 'guard', 'fixture: Second Wind is a Guard');

/** A sturdy body at an absolute position on the test node. */
function bodyAt(x: number, y: number, typeId = 'plains-slime'): MonsterEntity {
  const m = world.createMonster(NODE, typeId, { x, y });
  if (!m) throw new Error(`failed to spawn ${typeId}`);
  m.hasHealth.maxHp = 1_000_000;
  m.hasHealth.hp = 1_000_000;
  return m;
}

/** A finished wind-up, resolved by the real cast loop on this tick. */
function castNow(player: PlayerEntity, abilityId: string, target: MonsterEntity): void {
  now += 100;
  attachComponent(world, player, 'isCastingAbility', {
    abilityId, endsAt: now - 1, castMs: 1000, targetId: target.isMonster.id,
  });
  updateAbilityCasts(world, now);
  assert(player.isCastingAbility === undefined, `${abilityId}: the cast should have resolved`);
}

/** The Signature keystone, seeded the way keystones.test.ts seeds it. */
function signatureCard(): ResolvedLineageCard {
  const definition = KEYSTONE_DEFINITIONS.get('technique')!;
  const payoffKind = definition.payoff ?? 'echo-hit';
  return {
    card: {
      id: 'seed-keystone-technique', lineageId: 'rapier', tier: 3, row: 'keystone', lane: 'technique',
      name: definition.name, description: definition.rule,
      fx: keystoneFxKey('technique'), trigger: 'hit-nth', payoff: payoffKind,
    },
    requiredBiomeGroup: 'forest', requiredBiomeLevel: 14, requiredGlobalMastery: 0,
    cost: { essence: {}, shards: {} },
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: payoffKind, magnitude: 0.5 },
  };
}

const deliveries = (): SeenHit[] => hits.filter((h) => h.metadata['destroyerDelivery'] === true);

// ── Destroyer: the node ──────────────────────────────────────────────────────

{
  const node = SKILL_TREE.get(DESTROYER)!;
  const effects = node.mechanicEffects as Record<string, number>;
  assert(node.packet === 'technique', `Destroyer is the Technique lane's path (design §22.5), got ${node.packet}`);
  assert(effects['cooldown.technique-execution'] > 0, 'Destroyer authors its rule key');
  assert(!('cooldown.singular-extraction' in effects), 'the no-damage rule is gone');
  assert(!('cooldown.empowered-cd-ms' in effects), 'the 5 s recharge override is gone');
  assert(!('cooldown.singular-no-target-ms' in effects), 'the out-of-combat priming (Always First) is gone');
}

// ── Destroyer: regular hits deal normal damage and never spend it ────────────

{
  const player = spawn('sq-destroyer-regular', 'cooldown-heavy', DESTROYER);
  assert(
    resolveExecutionCooldownMs(player) === authored('cooldown-heavy', 'cooldown.empowered-cd-ms'),
    "the recharge is the heavy frame's own again",
  );
  const target = monster(player);
  hits.length = 0;
  swing(player, target);
  const plain = hits[0].damage;
  assert(plain > 0, 'a regular hit deals damage again');

  setEmpoweredAttack(world, player); // primed
  hits.length = 0;
  fires.length = 0;
  for (let i = 0; i < 3; i++) swing(player, target);
  assert(hits.length === 3, 'fixture: three regular swings');
  assert(
    hits.every((h) => h.damage === plain && h.metadata['mechanicConsumed'] !== true),
    `a primed Destroyer's regular hits are ordinary hits, got ${hits.map((h) => h.damage).join(', ')} against ${plain}`,
  );
  assert(player.hasEmpoweredAttack !== undefined, 'and the execution waits, primed');
  assert(fires.length === 0, 'nothing announced the mechanic');
  assert(getFrameCharge(player.tracksCombat, 'cooldown') > 0, 'the Bulwark bank still fills while it waits');

  // A Technique with no target — Imbue's instant (design §22.9) — has no shape to carry it.
  onTechniqueResolved(world, player, IMBUE, { now });
  assert(player.hasEmpoweredAttack !== undefined, 'a targetless Technique leaves it primed');
  // A Guard never fires it.
  onTechniqueResolved(world, player, SECOND_WIND, { target, now });
  assert(player.hasEmpoweredAttack !== undefined, 'a Guard never fires it');
  assert(deliveries().length === 0, 'and neither delivered anything');
}

// ── Destroyer: an armed Technique lands it on the armed hit ──────────────────

{
  const player = spawn('sq-destroyer-armed', 'cooldown-heavy', DESTROYER);
  const target = monster(player);
  const neighbour = bodyAt(target.hasPosition.current.x + 40, target.hasPosition.current.y + 20);
  const cycleMs = resolveExecutionCooldownMs(player);
  const rootMult = proxyEmpoweredMultiplier(world, player)!;
  assert(
    rootMult === authored('cooldown-heavy', 'cooldown.empowered-mult') + authored(DESTROYER, 'cooldown.empowered-mult'),
    `the execution is the root's own: frame + the path's authored delta, got ${rootMult}`,
  );

  setEmpoweredAttack(world, player);
  armTechnique(world, player, 'sweep');
  const neighbourHp = neighbour.hasHealth.hp;
  hits.length = 0;
  fires.length = 0;
  swing(player, target);
  const armed = hits.find((h) => h.targetId === target.isMonster.id);
  assert(armed?.metadata['mechanicConsumed'] === true, 'the armed hit IS the execution');
  assert(Number(armed.metadata['empoweredMultiplier']) === rootMult, `at the root's multiplier (empty bank), got ${String(armed.metadata['empoweredMultiplier'])}`);
  assert(player.hasEmpoweredAttack === undefined, 'the execution is spent');
  assert(player.hasArmedAbility === undefined, 'and the Technique landed');
  assert(fires.length === 1, `one execution, one mechanic-fired, got ${fires.length}`);
  assert(player.usesCooldown!.executionCooldownMs === cycleMs, 'the execution restarts the recharge');
  assert(neighbour.hasHealth.hp < neighbourHp, "Sweep's shape: the cleave carries the execution to the neighbour");
}

// ── Destroyer: an evaded armed hit did not land — the execution stays primed ─

{
  const player = spawn('sq-destroyer-evaded', 'cooldown-heavy', DESTROYER);
  const wolf = bodyAt(player.hasPosition.current.x + 24, player.hasPosition.current.y, 'wolf');
  // The dodge clock is deterministic: one more swing tips it over.
  setCounter(wolf.tracksCombat, MONSTER_EVADE_ACC, 0.99);

  setEmpoweredAttack(world, player);
  armTechnique(world, player, 'sweep');
  hits.length = 0;
  fires.length = 0;
  swing(player, wolf);
  const evaded = hits.find((h) => h.targetId === wolf.isMonster.id);
  assert(evaded?.metadata['evaded'] === true, 'fixture: the armed hit was evaded');
  assert(evaded.metadata['mechanicConsumed'] !== true, 'an evaded hit is not the execution');
  assert(player.hasEmpoweredAttack !== undefined, 'the execution stays primed for the next Technique');
  assert(fires.length === 0, 'and nothing was announced');
  assert(player.hasArmedAbility === undefined, 'the Technique itself was spent by its own rules');

  armTechnique(world, player, 'sweep');
  hits.length = 0;
  swing(player, wolf);
  const landed = hits.find((h) => h.targetId === wolf.isMonster.id);
  assert(landed?.metadata['evaded'] !== true && landed?.metadata['mechanicConsumed'] === true,
    'the next Technique that lands fires it');
  assert(player.hasEmpoweredAttack === undefined, 'and spends it');
}

// ── Destroyer: a cast lands it on the cast's target and across Slam's area ───

{
  const player = spawn('sq-destroyer-slam', 'cooldown-heavy', DESTROYER);
  const a = monster(player);
  const radius = castStrikeArea(player, SLAM);
  assert(radius !== undefined && radius > 60, `fixture: Slam strikes an area, got ${String(radius)}`);
  const b = bodyAt(a.hasPosition.current.x + 50, a.hasPosition.current.y + 20);
  const c = bodyAt(a.hasPosition.current.x + radius + 400, a.hasPosition.current.y);
  const loss = (m: MonsterEntity, before: number): number => before - m.hasHealth.hp;

  // Control: nothing primed, so Slam is only Slam.
  let hpA = a.hasHealth.hp, hpB = b.hasHealth.hp, hpC = c.hasHealth.hp;
  hits.length = 0;
  castNow(player, 'slam', a);
  const slamOnB = loss(b, hpB);
  assert(slamOnB > 0, "fixture: B stands in Slam's circle");
  assert(loss(c, hpC) === 0, "fixture: C stands outside Slam's circle");
  assert(deliveries().length === 0, 'nothing primed, nothing delivered');
  const slamOnA = loss(a, hpA);

  // Primed: the same Slam delivers the execution.
  setEmpoweredAttack(world, player);
  hpA = a.hasHealth.hp; hpB = b.hasHealth.hp; hpC = c.hasHealth.hp;
  hits.length = 0;
  fires.length = 0;
  castNow(player, 'slam', a);
  const delivered = deliveries();
  assert(delivered.length === 1, `the cast delivers the execution once, got ${delivered.length}`);
  assert(delivered[0].targetId === a.isMonster.id, "on the cast's own target");
  assert(delivered[0].metadata['mechanicConsumed'] === true, 'as the execution, through the pipeline');
  assert(delivered[0].metadata['evaded'] !== true, 'a cast-delivered execution is never dodged');
  assert(player.hasEmpoweredAttack === undefined, 'spent');
  assert(fires.length === 1, `one execution, one mechanic-fired, got ${fires.length}`);
  assert(loss(a, hpA) > slamOnA, 'the target takes Slam and the execution');
  assert(loss(b, hpB) > slamOnB, "Slam's shape: the execution reaches every body in the circle");
  assert(loss(c, hpC) === 0, 'and nothing outside it');
}

// ── Destroyer: a single-target cast lands it from range (Snipe) ──────────────

{
  const player = spawn('sq-destroyer-snipe', 'cooldown-heavy', DESTROYER);
  const far = bodyAt(player.hasPosition.current.x + 320, player.hasPosition.current.y);
  const beside = bodyAt(far.hasPosition.current.x + 30, far.hasPosition.current.y);
  assert(
    !world.collision.canReach(player, far, player.performsAttack.attackRange),
    "fixture: the target stands outside the player's own reach",
  );
  assert(castStrikeArea(player, SNIPE) === undefined, 'fixture: Snipe strikes one target');

  setEmpoweredAttack(world, player);
  const besideHp = beside.hasHealth.hp;
  hits.length = 0;
  now += 100;
  resolveCastPayload(world, player, SNIPE, far);
  onTechniqueResolved(world, player, SNIPE, { target: far, now });
  const delivered = deliveries();
  assert(delivered.length === 1 && delivered[0].targetId === far.isMonster.id, "the execution lands on Snipe's target, from range");
  assert(player.hasEmpoweredAttack === undefined, 'spent');
  assert(beside.hasHealth.hp === besideHp, 'a single-target cast carries no area');
  // The client draws the execution's own cue at the cast's target: the delivery
  // is an execution hit on the wire (the Destroyer path's payoff, W2-D).
  assert(
    playerHits(world.takeNodeEvents(NODE), player.isPlayer.id)
      .some((e) => e.execution && e.targetId === far.isMonster.id),
    "the delivered execution reaches the client as an execution hit on the cast's target",
  );
}

// ── Destroyer + Signature: the one execution fires once and counts once ──────

{
  const player = spawn('sq-destroyer-signature', 'cooldown-heavy', DESTROYER);
  setLineageRuntime(player.tracksCombat, { cards: [signatureCard()], capstones: [] });
  const target = monster(player);

  // Armed.
  setEmpoweredAttack(world, player);
  armTechnique(world, player, 'sweep');
  hits.length = 0;
  fires.length = 0;
  swing(player, target);
  assert(hits.filter((h) => h.metadata['mechanicConsumed'] === true).length === 1, 'armed: one execution');
  assert(fires.length === 1, `armed: it counts once with Signature, got ${fires.length}`);

  // Cast.
  setEmpoweredAttack(world, player);
  hits.length = 0;
  fires.length = 0;
  castNow(player, 'slam', target);
  assert(deliveries().length === 1, 'cast: one execution');
  assert(fires.length === 1, `cast: it counts once with Signature, got ${fires.length}`);

  // Control: nothing primed — Signature alone still counts the cast.
  hits.length = 0;
  fires.length = 0;
  castNow(player, 'slam', target);
  assert(deliveries().length === 0 && fires.length === 1, 'unprimed, Signature counts the cast on its own');
}

// ── Destroyer: wired into the live tick ──────────────────────────────────────
//
// Bought through the recalc, swinging through the combat loop with no Technique
// to carry it: the execution comes up, waits primed, and the swings stay ordinary.

{
  const live = new World();
  const slices = makeSlices('sq-destroyer-live');
  slices.hasPosition.nodeId = 'node-clearing';
  slices.hasHealth.hp = slices.hasHealth.maxHp = 1_000_000;
  slices.usesSkills = {
    unlockedSkills: ['cooldown-root', 'cooldown-heavy', DESTROYER],
    passives: {}, selectedClass: 'cooldown-root',
    selectedSubVariant: 'heavy', selectedRange: null, combatArchetype: 'cooldown',
  };
  const player = live.attachPlayerEntity(slices, 'sq-destroyer-live');
  syncArchetypeSlices(live, player);
  recalculatePlayerEntityStats(live, player);
  assert(player.usesSkills.passives['cooldown.technique-execution'] === 1, 'the recalc folds the rule key in');
  const target = live.createMonster('node-clearing', 'plains-slime', { x: 420, y: 400 });
  if (!target) throw new Error('failed to spawn a target');
  target.hasHealth.hp = target.hasHealth.maxHp = 10_000_000;

  hits.length = 0;
  let t = 0;
  for (let i = 0; i < 140; i++) { t += 100; live.tick(100, t); } // 14 s: past one recharge
  const mine = hits.filter((h) => h.attackerId === 'sq-destroyer-live');
  assert(mine.length > 0 && mine.every((h) => h.damage > 0), 'the swings land and deal damage');
  assert(mine.every((h) => h.metadata['mechanicConsumed'] !== true), 'no swing spent the execution');
  assert(player.hasEmpoweredAttack !== undefined, 'the execution came up and waits, primed');
}

console.log('t3SquirePaths.test.ts: ok');
