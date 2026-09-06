/**
 * Apex Timberclaw (Forest T2) — Stunning Swipe wiring.
 *
 * Covers the three things the 2026-09-06 pass added, as observable invariants
 * rather than balance numbers:
 *   1. the swipe's tell shortens with Bestial Frenzy stacks, and is floored;
 *   2. the slam resolves with its OWN broadcast cue instead of the generic
 *      shockwave every other AoE charge draws;
 *   3. Bestial Frenzy outranks the swipe — a scripted cast preempts an in-flight
 *      charged wind-up, and the two telegraphs are never live at once.
 */
import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { ActiveBossEffect } from '@mmo-idle/shared';
import type { MonsterEntity } from '../src/ecs/entity';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { updateCombat } from '../src/systems/combat/engine/combat';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
const AGGRO_AT = 1_000;

function playerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 405, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      equippedAbilities: { technique: null, guard: null }, knownStances: [],
      equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

/** A boss standing in melee range of a player, engaged and due an attack. */
function engagedTimberclaw(id: string): { world: World; boss: MonsterEntity } {
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices(id), id);
  const boss = world.createMonster(NODE, 'apex-timberclaw', { x: 400, y: 400 });
  assert(!!boss, 'Apex Timberclaw should spawn');
  setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, AGGRO_AT);
  boss.hasAwareness.state = 'attacking';
  boss.performsAttack.lastAttackAt = 0;
  return { world, boss };
}

/** Stack Bestial Frenzy the way its `stat-buff` action does, without the cast. */
function stackFrenzy(boss: MonsterEntity, count: number): void {
  const state = boss.scriptsBoss;
  assert(!!state, 'Apex Timberclaw should carry boss-script state');
  for (let i = 0; i < count; i++) {
    const effect: ActiveBossEffect = { type: 'bestial-frenzy', remainingMs: -1, totalMs: -1 };
    state.activeEffects.push(effect);
  }
}

function swipeCastMs(world: World): number | undefined {
  for (const event of world.takeNodeEvents(NODE)) {
    if (event.kind === 'monster-cast-start' && event.label === 'Stunning Swipe') return event.castMs;
  }
  return undefined;
}

initCombatSystems();

// 1a. With no frenzy stacks the tell is exactly the authored wind-up.
{
  const { world } = engagedTimberclaw('swipe-baseline');
  updateCombat(world, 0, 5_000);
  assert(swipeCastMs(world) === 700, 'an unstacked Stunning Swipe should use its authored 700ms tell');
}

// 1b. Every Bestial Frenzy stack tightens it multiplicatively (0.88 per stack).
{
  const { world, boss } = engagedTimberclaw('swipe-hastened');
  stackFrenzy(boss, 4);
  updateCombat(world, 0, 5_000);
  const expected = Math.round(700 * 0.88 ** 4);
  assert(
    swipeCastMs(world) === expected,
    `four Bestial Frenzy stacks should cut the tell to ${expected}ms`,
  );
}

// 1c. ...but never below the authored floor, so the tell stays readable.
{
  const { world, boss } = engagedTimberclaw('swipe-floored');
  stackFrenzy(boss, 40);
  updateCombat(world, 0, 5_000);
  assert(swipeCastMs(world) === 300, 'the hastened tell should clamp at its 300ms floor');
}

// 2. The slam pays off with its bespoke cue, anchored on the planted circle, and
//    does NOT also fire the generic shockwave.
{
  const { world } = engagedTimberclaw('swipe-impact');
  updateCombat(world, 0, 5_000);
  assert(swipeCastMs(world) === 700, 'the swipe should begin winding up');

  updateCombat(world, 0, 5_700);
  const events = world.takeNodeEvents(NODE);
  const resolved = events.find(
    event => event.kind === 'monster-cast-end' && event.fired && event.fx === 'timberclaw-swipe',
  );
  assert(!!resolved, 'the swipe should resolve with its own impact cue');
  assert(
    resolved.kind === 'monster-cast-end' && resolved.pos !== undefined && resolved.radius === 90,
    'the impact cue should carry the planted point and the circle it resolved at',
  );
  assert(
    !events.some(event => event.kind === 'boss-fx' && event.fx === 'slam'),
    'a slam with its own impact cue must not also draw the generic shockwave',
  );
}

// 3. Bestial Frenzy preempts an in-flight swipe, and does so in an order that
//    leaves exactly one live cast bar on the node.
{
  const { world, boss } = engagedTimberclaw('swipe-preempted');
  updateCombat(world, 0, 5_000);
  assert(swipeCastMs(world) === 700, 'the swipe should be winding up before the frenzy comes due');

  updateBossScripts(world, 5_000);
  const events = world.takeNodeEvents(NODE);
  const endIdx = events.findIndex(event => event.kind === 'monster-cast-end' && !event.fired);
  const startIdx = events.findIndex(
    event => event.kind === 'monster-cast-start' && event.label === 'Bestial Frenzy',
  );
  assert(endIdx >= 0, 'the frenzy should retire the swipe wind-up it preempts');
  assert(startIdx >= 0, 'the frenzy should open its own cast');
  assert(endIdx < startIdx, 'the swipe must be cleared BEFORE the frenzy bar opens, not after');
  assert(!!boss.cannotAttack, 'a scripted cast should hold the boss off its attacks');

  // The combat tick that follows must not emit a second cast-end: the client keys
  // cast bars by monster, so one would silently wipe the frenzy telegraph.
  updateCombat(world, 0, 5_100);
  assert(
    !world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-end'),
    'the frenzy cast bar must survive the combat tick that sees `cannotAttack`',
  );
  assert(!!boss.scriptsBoss?.scriptedCast, 'the frenzy cast should still be running');
}

// ─────────────────────────────────────────────────────────────────────────────
// BESTIAL FRENZY IS THE FIGHT'S CLOCK.
//
// It has no stack cap ON PURPOSE: each stack divides the CURRENT swing cooldown, so
// the ramp compounds until the boss out-damages anything you can survive, and the
// fight is "kill it before that". What is tunable is WHEN the wall arrives — every
// multiplier above 1.0 reaches the engine's 200ms swing floor eventually.
//
// The relationship, not the magnitudes, is what this guards: T2's wall must not
// arrive SOONER than T1's. It did (~65s against T1's ~78s) until the 2026-09-06
// nerf, which is backwards for the bigger boss with twice the health.
// ─────────────────────────────────────────────────────────────────────────────

/** Seconds until the ramp bottoms out on the engine's 200ms swing floor. */
function secondsToSwingFloor(id: string): number {
  const def = MONSTER_DATABASE.get(id)!;
  const beat = def.bossScript?.repeating?.[0];
  assert(!!beat, `${id}: should ramp on a repeating beat`);
  const cast = beat.actions.find(action => action.type === 'cast');
  assert(cast?.type === 'cast', `${id}: the ramp should be a visible cast`);
  const buff = cast.actions.find(
    action => action.type === 'stat-buff' && action.stat === 'attackSpeed',
  );
  assert(buff?.type === 'stat-buff', `${id}: the cast should grant attack speed`);
  assert(
    buff.maxStacks === undefined,
    `${id}: the ramp is the fight's time limit and must stay uncapped`,
  );

  let cooldown = def.stats.attackCooldown;
  let stacks = 0;
  while (cooldown > 200 && stacks < 500) {
    cooldown = Math.max(200, Math.round(cooldown / buff.mult));
    stacks++;
  }
  return ((beat.initialDelayMs ?? beat.intervalMs) + (stacks - 1) * beat.intervalMs) / 1_000;
}

{
  const t1 = secondsToSwingFloor('gnarled-greatbear');
  const t2 = secondsToSwingFloor('apex-timberclaw');
  assert(
    t2 >= t1,
    `the T2 Timberclaw's ramp must not out-run the T1 Greatbear's — it is the ` +
      `bigger boss and the longer fight (T2 walls at ${t2.toFixed(0)}s, T1 at ${t1.toFixed(0)}s)`,
  );
}

// Forest is the tier's damage-per-second boss and should stay so — but "highest"
// is a rank, not a licence. It opened at 2.2x-2.8x every other T2 boss before the
// 2026-09-06 nerf, which is a different claim entirely.
{
  const dps = (id: string) => {
    const def = MONSTER_DATABASE.get(id)!;
    return (def.stats.attack * (def.consecutiveHits ?? 1)) / (def.stats.attackCooldown / 1_000);
  };
  const forest = dps('apex-timberclaw');
  const others = [
    'gorging-razortusk', 'stoneplate-juggernaut', 'mire-gorged-behemoth',
    'chitinous-dreadbore', 'dune-stalker-emperor', 'jungle-dread-gorger',
  ].map(dps);
  const hardest = Math.max(...others);
  assert(forest > hardest, `Forest should still open hardest (${forest.toFixed(0)} vs ${hardest.toFixed(0)})`);
  // 1.75x of the tier's next-hardest. The pre-nerf 85 dps against Plains' 44 sat at
  // 1.96x and would slip under a 2x bound, which is exactly the value this is here
  // to reject; 1.75 still leaves plenty of room above today's 1.35x.
  assert(
    forest < hardest * 1.75,
    `but not by multiples — ${forest.toFixed(0)} dps against a tier best of ${hardest.toFixed(0)} ` +
      `is a different boss, not a faster one`,
  );
}

console.log('forestT2BossSwipe.test.ts: ok');
