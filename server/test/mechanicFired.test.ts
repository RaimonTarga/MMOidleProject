/**
 * The `mechanic-fired` seam: one emission per root moment, never two on one hit
 * (progression rework Phase 1c).
 *
 * WHY THIS EXISTS. `mechanic-fired` is the one trigger in the closed vocabulary
 * that had no server seam, and it is shared by six roots whose moments look
 * nothing alike. The failure mode is not "it never fires" — that shows up
 * immediately — it is firing TWICE on one exchange, which doubles every payoff
 * hung off it and is invisible in any test that only asserts "something happened".
 *
 * So every assertion here is a COUNT.
 *
 * Deliberately not asserted: any magnitude, and anything a card does. This file
 * pins the seam; `lineageCards.wiring.test.ts` pins what listens to it.
 *
 * Run: node --conditions=development --import tsx test/mechanicFired.test.ts
 */
import {
  GAME_CONFIG,
  baseRecoveryForTier,
  emptyEquipment,
  getStatusEffect,
  removeStatusEffect,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import {
  emitCombatEvent, type CombatContext,
} from '../src/systems/combat/engine/combatPipeline';
import {
  registerMechanicFiredListener,
} from '../src/systems/combat/engine/mechanicFired';
import { applyClassDotStack } from '../src/systems/classes/archetypes/dot/dotPrototype';
import { completeReload } from '../src/systems/classes/archetypes/reload/reloadLifecycle';
import { applySummonerCommand } from '../src/systems/classes/archetypes/summoner/command';
import { runFormationAttack } from '../src/systems/classes/archetypes/summoner/formationAttack';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';

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
      
      biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 4, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
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

/** Every emission the seam has made, so each case can count its own. */
const seen: Array<{ playerId: string; hadCtx: boolean }> = [];
registerMechanicFiredListener((_world, player, ctx) => {
  seen.push({ playerId: player.isPlayer.id, hadCtx: ctx !== undefined });
});
const countFor = (id: string): number => seen.filter((e) => e.playerId === id).length;

function spawn(id: string, archetype: string | null): PlayerEntity {
  const player = world.attachPlayerEntity(makeSlices(id), id);
  player.usesSkills.combatArchetype = archetype as PlayerEntity['usesSkills']['combatArchetype'];
  syncArchetypeSlices(world, player);
  return player;
}

function monster(x: number) {
  const m = world.createMonster(NODE, 'plains-slime', { x, y: 400 });
  if (!m) throw new Error('failed to spawn a target');
  return m;
}

/** One exchange, reused across several emits so the per-hit latch is testable. */
function exchange(player: PlayerEntity, defender: ReturnType<typeof monster>, metadata: Record<string, unknown>): CombatContext {
  return {
    attacker: player, attackerType: 'player',
    defender, defenderType: 'monster',
    damage: 100, platingMult: 1, drPierce: 0, cancelled: false, metadata,
  } as unknown as CombatContext;
}

// ── cadence: the finisher's empowered flag being consumed ─────────────────────

{
  const player = spawn('mf-cadence', 'cadence');
  assert(player.usesCadence !== undefined, 'the cadence slice should be attached');
  const target = monster(500);

  emitCombatEvent('onHit', exchange(player, target, {}), world);
  assert(countFor('mf-cadence') === 0, 'a normal cadence hit is not the mechanic firing');

  emitCombatEvent('onHit', exchange(player, target, { empoweredAttack: true, mechanicConsumed: true }), world);
  assert(
    countFor('mf-cadence') === 1,
    `the finisher should fire exactly once, got ${countFor('mf-cadence')}`,
  );

  // The same exchange re-emitted: the latch on `ctx.metadata` is what keeps one
  // hit to one emission no matter how many listeners on it would qualify.
  const reused = exchange(player, target, { empoweredAttack: true, mechanicConsumed: true });
  emitCombatEvent('onHit', reused, world);
  emitCombatEvent('onHit', reused, world);
  assert(
    countFor('mf-cadence') === 2,
    `one exchange must never emit twice, got ${countFor('mf-cadence')} after a second hit`,
  );
  assert(seen.every((e) => e.playerId !== 'mf-cadence' || e.hadCtx), 'a cadence emission rides its hit');
}

// ── cooldown: the execution's empowered flag being consumed ───────────────────

{
  const player = spawn('mf-cooldown', 'cooldown');
  assert(player.usesCooldown !== undefined, 'the cooldown slice should be attached');
  const target = monster(520);

  emitCombatEvent('onHit', exchange(player, target, {}), world);
  assert(countFor('mf-cooldown') === 0, 'a normal cooldown hit is not the mechanic firing');

  emitCombatEvent('onHit', exchange(player, target, { empoweredAttack: true, mechanicConsumed: true }), world);
  assert(
    countFor('mf-cooldown') === 1,
    `the execution should fire exactly once, got ${countFor('mf-cooldown')}`,
  );
}

// ── never twice on one hit, even wearing two roots' slices ────────────────────
//
// A player only ever has one archetype slice, so this cannot happen in the live
// game. It is asserted anyway because the guarantee the cards depend on is a
// property of the SEAM, not of who happens to call it — and a future root that
// layers a second slice must not silently double every card hung off the trigger.

{
  const player = spawn('mf-both', 'cadence');
  syncArchetypeSlices(world, player);
  // Hand-attach the second root's slice rather than going through the sync, which
  // is deliberately exclusive.
  (player as { usesCooldown?: unknown }).usesCooldown =
    { executionCooldownPct: 0, resolve: 0, resolveMax: 0 };
  const target = monster(540);

  emitCombatEvent('onHit', exchange(player, target, { empoweredAttack: true, mechanicConsumed: true }), world);
  assert(
    countFor('mf-both') === 1,
    `cadence and cooldown must not both fire on one hit, got ${countFor('mf-both')}`,
  );
}

// ── dot: max stacks, once per target per fill ────────────────────────────────

{
  const player = spawn('mf-dot', 'dot');
  const target = monster(560);
  const application = {
    conversionPct: 0,
    durationMs: 5000,
    maxStacks: 3,
    tickIntervalMs: 1000,
    damagePerStack: 5,
  };

  applyClassDotStack(world, player, target, application);
  applyClassDotStack(world, player, target, application);
  assert(countFor('mf-dot') === 0, 'a partial stack is not the mechanic firing');

  applyClassDotStack(world, player, target, application);
  assert(countFor('mf-dot') === 1, `reaching the cap should fire once, got ${countFor('mf-dot')}`);

  // Every further hit into a capped stack is the SAME fill.
  applyClassDotStack(world, player, target, application);
  applyClassDotStack(world, player, target, application);
  assert(
    countFor('mf-dot') === 1,
    `a capped stack must not keep firing, got ${countFor('mf-dot')}`,
  );

  // A fresh fill is a fresh moment: the latch lives on the effect, so it is gone
  // with the effect.
  removeStatusEffect(target.tracksCombat, 'dot');
  applyClassDotStack(world, player, target, application);
  applyClassDotStack(world, player, target, application);
  assert(countFor('mf-dot') === 1, 'the refill has not reached the cap yet');
  applyClassDotStack(world, player, target, application);
  assert(
    countFor('mf-dot') === 2,
    `a second fill should fire again, got ${countFor('mf-dot')}`,
  );

  // Per TARGET, not per player.
  const other = monster(580);
  for (let i = 0; i < 3; i++) applyClassDotStack(world, player, other, application);
  assert(
    countFor('mf-dot') === 3,
    `a second target's fill is its own moment, got ${countFor('mf-dot')}`,
  );
  assert(
    getStatusEffect(other.tracksCombat, 'dot')?.stacks === 3,
    'the second target should be at its cap',
  );
}

// ── reload: completion ───────────────────────────────────────────────────────

{
  const player = spawn('mf-reload', 'reload');
  assert(player.usesReload !== undefined, 'the reload slice should be attached');
  player.usesReload!.ammoMax = 6;

  completeReload(world, player);
  assert(countFor('mf-reload') === 1, `a reload should fire once, got ${countFor('mf-reload')}`);
  completeReload(world, player);
  assert(countFor('mf-reload') === 2, 'a second reload is a second moment');
  assert(
    seen.some((e) => e.playerId === 'mf-reload' && !e.hadCtx),
    'a reload completes on a timer, so it carries no exchange',
  );
}

// ── summoner: the formation cycle, never the click command ───────────────────
//
// Phase 3 moved this moment. 1c hung it on `applySummonerCommand`, but a command
// is a CLICK: it never fires unattended, so a card keyed to it would never pay out
// for an idle player, and idle play is the game. The moment is now the FORMATION
// CYCLE — every living summon has hit the same target since the last fire.
//
// Driven through the real `runFormationAttack` rather than a hand-built context,
// because what is being pinned here is the CYCLE's arithmetic (one emission per
// full cycle, none per summon hit), and a context whose `cycleCompleted` the test
// set itself would pin nothing.

{
  const player = spawn('mf-summoner', 'summoner');
  assert(player.summonsMinions !== undefined, 'the summoner slice should be attached');

  // Neither flavour of command is the mechanic firing any more.
  applySummonerCommand(world, player, { x: 900, y: 900 });
  const clicked = monster(620);
  applySummonerCommand(world, player, { ...clicked.hasPosition.current });
  assert(
    countFor('mf-summoner') === 0,
    `a command intent must not fire the mechanic, got ${countFor('mf-summoner')}`,
  );

  recalculatePlayerEntityStats(world, player);
  updateSummonerArchetype(world, 0, 1_000);
  const bodies = player.summonsMinions!.minionIds
    .map((id) => (id ? world.getMinionEntity(id) : undefined))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);
  assert(bodies.length >= 2, `the formation needs several bodies to cycle, got ${bodies.length}`);

  const victim = monster(700);
  victim.hasHealth.maxHp = 10_000_000;
  victim.hasHealth.hp = 10_000_000;
  victim.mitigatesDamage.plating = 0;
  victim.mitigatesDamage.damageReduction = 0;
  // Nothing to clear for evasion: a monster's dodge fraction lives on its static
  // definition, not on the entity, and this target authors none.

  for (let i = 0; i < bodies.length - 1; i++) {
    runFormationAttack(world, player, bodies[i]!, victim, 2_000);
  }
  assert(
    countFor('mf-summoner') === 0,
    `a partial cycle is not the mechanic firing, got ${countFor('mf-summoner')}`,
  );

  runFormationAttack(world, player, bodies[bodies.length - 1]!, victim, 2_000);
  assert(
    countFor('mf-summoner') === 1,
    `a completed cycle should fire exactly once, got ${countFor('mf-summoner')}`,
  );

  // The hit after a completed cycle opens the NEXT cycle; it is not the same one
  // firing again. This is the failure mode worth a count: a cycle that re-reports
  // completion on every further hit doubles every payoff hung off the trigger.
  runFormationAttack(world, player, bodies[0]!, victim, 2_100);
  assert(
    countFor('mf-summoner') === 1,
    `the next cycle has not completed yet, got ${countFor('mf-summoner')}`,
  );
  for (let i = 1; i < bodies.length; i++) {
    runFormationAttack(world, player, bodies[i]!, victim, 2_100);
  }
  assert(
    countFor('mf-summoner') === 2,
    `the second cycle is its own moment, got ${countFor('mf-summoner')}`,
  );
  assert(
    seen.every((e) => e.playerId !== 'mf-summoner' || e.hadCtx),
    'a formation cycle completes on a hit, so it carries that exchange',
  );
}

console.log('mechanicFired: ok');
