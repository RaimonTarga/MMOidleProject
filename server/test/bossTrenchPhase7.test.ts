// BOSS ENCOUNTER REDESIGN — Phase 7: forced movement, pull, and the Trench duel.
//
// The primitive claim: push and pull are ONE concept to the player, so they share one
// resistance stat, one clamping path and one reason-tagged event. A stat called
// "knockback resistance" that helps when a boss shoves you and does nothing when one
// drags you would be a lie in the item text.
//
// The encounter claim: Undertow catches a disengaged player WITHOUT permanent speed
// or teleportation. A boss that permanently outruns you deletes ranged builds; one
// that blinks to you cannot be read at all.

import {
  ABILITY_GUARD_EFFECT_IDS,
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  applyStatusEffect,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { updateBossPatterns } from '../src/systems/combat/ai/bossPatterns';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { pullPlayer, pushPlayer } from '../src/systems/combat/damage/forcedMovement';
import { World } from '../src/world/World';
import type { PlayerEntity } from '../src/ecs/entity';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-t4-trench-01';

function playerSlices(id: string, x = 405, y = 400): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x, y }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
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

initCombatSystems();

function gap(player: PlayerEntity, anchor: { x: number; y: number }): number {
  return Math.hypot(
    player.hasPosition.current.x - anchor.x,
    player.hasPosition.current.y - anchor.y,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The forced-movement primitive.
// ─────────────────────────────────────────────────────────────────────────────

// Push moves AWAY, pull moves TOWARD, and both actually move the player.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('fm-dir', 800, 400), 'fm-dir');
  const anchor = { x: 400, y: 400 };

  const before = gap(player, anchor);
  const pushed = pushPlayer(world, player, anchor, 200);
  assert(!!pushed, 'a push should land');
  assert(gap(player, anchor) > before, 'push opens distance');

  const mid = gap(player, anchor);
  const pulled = pullPlayer(world, player, anchor, 200);
  assert(!!pulled, 'a pull should land');
  assert(gap(player, anchor) < mid, 'pull closes distance');
}

// A pull never OVERSHOOTS through the anchor. Dragging a player past the boss and out
// the other side would be worse than not dragging them at all.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('fm-overshoot', 500, 400), 'fm-overshoot');
  const anchor = { x: 400, y: 400 };
  // Ask for far more distance than the gap.
  pullPlayer(world, player, anchor, 2_000);
  assert(
    gap(player, anchor) < 200,
    'a pull should bring the player to the anchor, not fling them past it',
  );
}

// ONE RESISTANCE FOR BOTH DIRECTIONS. This is the load-bearing claim: a player geared
// against being shoved must be equally geared against being dragged.
{
  function movedDistance(kind: 'push' | 'pull', resistPct: number | undefined): number {
    const world = new World();
    const player = world.attachPlayerEntity(playerSlices('fm-resist', 800, 400), 'fm-resist');
    if (resistPct !== undefined) {
      applyStatusEffect(player.tracksCombat, {
        id: ABILITY_GUARD_EFFECT_IDS[0],
        maxStacks: 1,
        remainingMs: 10_000,
        refreshable: true,
        sourceId: 'test',
        data: { knockbackResistPct: resistPct, totalMs: 10_000 },
      });
    }
    const anchor = { x: 400, y: 400 };
    const before = gap(player, anchor);
    const result = kind === 'push'
      ? pushPlayer(world, player, anchor, 200)
      : pullPlayer(world, player, anchor, 200);
    return result ? Math.abs(gap(player, anchor) - before) : 0;
  }

  const pushBare = movedDistance('push', undefined);
  const pushGuarded = movedDistance('push', 0.5);
  const pullBare = movedDistance('pull', undefined);
  const pullGuarded = movedDistance('pull', 0.5);

  assert(pushGuarded < pushBare, 'resistance should reduce a push');
  assert(pullGuarded < pullBare, 'and reduce a pull by the same rule');
  assert(
    Math.abs(pushBare - pullBare) < 2 && Math.abs(pushGuarded - pullGuarded) < 2,
    `push and pull must be resisted identically ` +
      `(push ${pushBare}/${pushGuarded}, pull ${pullBare}/${pullGuarded})`,
  );
}

// Resistance NEVER reaches immunity: a player who cannot be repositioned at all is
// immune to every mechanic built on repositioning.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('fm-cap', 800, 400), 'fm-cap');
  applyStatusEffect(player.tracksCombat, {
    id: ABILITY_GUARD_EFFECT_IDS[0],
    maxStacks: 1,
    remainingMs: 10_000,
    refreshable: true,
    sourceId: 'test',
    data: { knockbackResistPct: 5, totalMs: 10_000 },
  });
  const anchor = { x: 400, y: 400 };
  const before = gap(player, anchor);
  pullPlayer(world, player, anchor, 400);
  assert(
    gap(player, anchor) < before,
    'even absurd resistance must not make the player immovable',
  );
}

// A rooted player is not dragged — the existing root contract is unchanged.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('fm-root', 800, 400), 'fm-root');
  const anchor = { x: 400, y: 400 };
  const before = { ...player.hasPosition.current };
  world.ecs.addComponent(player, 'isRooted', {});
  pullPlayer(world, player, anchor, 300);
  assert(
    player.hasPosition.current.x === before.x && player.hasPosition.current.y === before.y,
    'a rooted player should not be moved by a pull',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The Elder Trench Serpent.
// ─────────────────────────────────────────────────────────────────────────────

const SERPENT = MONSTER_DATABASE.get('elder-trench-serpent')!;
const PATTERN = SERPENT.bossPattern!;

// The authored sequence: Wound, then the catch, then the bite.
{
  const kinds = PATTERN.steps.map(step => step.kind);
  assert(kinds.includes('apply-status'), 'the sequence should open with the Wound');
  assert(kinds.includes('pull'), 'and drag a disengaged target back');
  assert(kinds.includes('payoff'), 'before the Devour');
  assert(kinds.includes('recovery'), 'and end in a punishable recovery');
  assert(
    kinds.indexOf('pull') < kinds.indexOf('payoff'),
    'Undertow catches BEFORE the bite, or it catches nothing',
  );

  // No permanent speed and no teleport anywhere in the sequence.
  assert(SERPENT.chargeOnAggro === undefined, 'no aggro speed burst');
  assert(SERPENT.engageSequence === undefined, 'and no legacy engage charge');
}

function armedSerpent(world: World, playerId: string) {
  const monster = world.createMonster(NODE, 'elder-trench-serpent', { x: 400, y: 400 })!;
  assert(!!monster, 'the Serpent should spawn');
  setAggroTarget(world, monster, { id: playerId, kind: 'player' }, 1_000);
  monster.hasAwareness.state = 'attacking';
  return {
    monster,
    armedAt: 1_000 + (PATTERN.initialCooldownMs ?? PATTERN.cooldownMs) + 1_000,
  };
}

/** Advance until `predicate` holds. Returns the clock it stopped at. */
function advanceUntil(world: World, from: number, predicate: () => boolean, max = 300): number {
  let now = from;
  for (let i = 0; i < max && !predicate(); i++) {
    now += 100;
    updateBossPatterns(world, 100, now);
  }
  return now;
}

// UNDERTOW ACTUALLY CATCHES a disengaged player — by dragging them, not by the boss
// suddenly moving or blinking to them.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('undertow', 405, 400), 'undertow');
  const { monster, armedAt } = armedSerpent(world, 'undertow');

  updateBossPatterns(world, 100, armedAt);
  assert(!!monster.runsBossPattern, 'the sequence should begin');

  // Disengage well out of reach and remember where the boss is standing.
  player.hasPosition.current = { x: 1_400, y: 400 };
  const bossBefore = { ...monster.hasPosition.current };
  const gapBefore = gap(player, bossBefore);

  advanceUntil(
    world, armedAt,
    () => gap(player, monster.hasPosition.current) < gapBefore - 50,
  );

  assert(
    gap(player, monster.hasPosition.current) < gapBefore,
    'Undertow should close the gap on a disengaged player',
  );
  assert(
    monster.hasPosition.current.x === bossBefore.x &&
      monster.hasPosition.current.y === bossBefore.y,
    'and it closes by dragging the PLAYER, not by the boss teleporting to them',
  );
}

// DEVOUR HEALS ONLY ON A HIT. Denying it is what makes the long tell worth reading.
{
  function devourHeal(dodge: boolean): number {
    const world = new World();
    const player = world.attachPlayerEntity(playerSlices('devour', 405, 400), 'devour');
    const { monster, armedAt } = armedSerpent(world, 'devour');
    monster.hasHealth.hp = Math.round(monster.hasHealth.maxHp * 0.5);
    const hpBefore = monster.hasHealth.hp;

    updateBossPatterns(world, 100, armedAt);
    let now = armedAt;
    for (let i = 0; i < 300 && !monster.recoversFromPattern; i++) {
      now += 100;
      // A dodging player leaves the node entirely, which is the cleanest way to be
      // unhittable without also cancelling the sequence through some other path.
      if (dodge) player.hasPosition.nodeId = 'node-0-0';
      updateBossPatterns(world, 100, now);
    }
    return monster.hasHealth.hp - hpBefore;
  }

  const healedOnHit = devourHeal(false);
  const healedOnMiss = devourHeal(true);
  assert(healedOnHit > 0, 'a landed Devour should feed the serpent');
  assert(healedOnMiss <= 0, 'a Devour that never lands must heal it nothing');
}

// BLOOD IN THE WATER tightens the gaps and adds no attacks.
{
  const lowHealth = (SERPENT.bossScript?.phases ?? []).find(phase => phase.hpPct === 0.25);
  assert(!!lowHealth, 'the Serpent should have a low-health beat');
  assert(
    lowHealth.actions.every(
      action => action.type === 'empower-charged' || action.type === 'stat-buff',
    ),
    'Blood in the Water should only tighten what exists — no new attacks',
  );
  assert(
    !lowHealth.actions.some(action => action.type === 'apply-shield'),
    'and it should not armour up: the fight ends by landing the kill',
  );
}

console.log('bossTrenchPhase7: ok');
