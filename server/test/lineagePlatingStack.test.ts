/**
 * A `plating-stack` card must not compound against its own output.
 *
 * `runReactivePlating` adds the plating its stacks are worth onto
 * `mitigatesDamage.plating` IN PLACE. The card resolved its per-stack value from
 * that same stat, so every refresh multiplied a figure that already contained the
 * previous refresh — and six of the defensive lineages put this payoff on
 * `standing` or `guard-cast`, which refresh on a 1500 ms clock. The card now
 * carries its FRACTION and `reactivePlating` resolves it against the plating with
 * its own contribution removed.
 *
 * What is pinned here is the invariant, not a balance number: holding the window
 * open across many refreshes must converge on one stack's worth of plating, not
 * climb without bound.
 *
 * Run: node --conditions=development --import tsx test/lineagePlatingStack.test.ts
 */
import assert from 'node:assert/strict';
import {
  GAME_CONFIG,
  baseRecoveryForTier,
  emptyEquipment,
  getResource,
  setCooldown,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { resetReactivePlating, runReactivePlating } from '../src/systems/defense/mitigation/reactivePlating';
import { recalculatePlayerStatsPreservingCombatState } from '../src/ecs/playerEntityFormulas';
import { lineagePlatingStackFraction } from '../src/systems/combat/lineageCards';
import { applyStatusEffect } from '@mmo-idle/shared';

const NODE = 'node-5-5';
const BASE_PLATING = 100;
const FRACTION = 0.15;

function makeSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: 'Plating Tester' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1_000, maxHp: 1_000, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      shards: {}, capstones: {},
      biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null },
  } as unknown as PersistedPlayerSlices;
}

initCombatSystems();

const world = new World();
const player: PlayerEntity = world.attachPlayerEntity(makeSlices('plating'), 'plating');
world.takeNodeEvents(NODE);

player.mitigatesDamage.plating = BASE_PLATING;

/** Re-apply the card's window the way a `standing` or `guard-cast` card does. */
function refreshWindow(): void {
  const effect = applyStatusEffect(player.tracksCombat, {
    id: 'lineage.plating-stack',
    instanced: false,
    remainingMs: 4_000,
    sourceId: player.isPlayer.id,
    data: { totalMs: 4_000, magnitude: FRACTION, perStackFraction: FRACTION },
  });
  effect.data.perStackFraction = FRACTION;
}

refreshWindow();
assert.equal(
  lineagePlatingStackFraction(player.tracksCombat),
  FRACTION,
  'the card should carry its fraction, not a resolved flat value',
);

// One stack held open: hold the fade off so stacks persist, and let the sync run.
setResource(player.tracksCombat, 'reactivePlatingStacks', 1);
setCooldown(player.tracksCombat, 'reactivePlatingHold', 10_000);

const expectedPerStack = Math.round(BASE_PLATING * FRACTION);
const seen: number[] = [];
for (let i = 0; i < 12; i += 1) {
  refreshWindow();
  runReactivePlating(world, player, 100);
  seen.push(Math.round(getResource(player.tracksCombat, 'reactivePlatingApplied')));
}

const final = seen[seen.length - 1]!;
assert.equal(
  final,
  expectedPerStack,
  `one held stack must stay worth one stack's plating (${expectedPerStack}); `
    + `applied went ${seen.join(' -> ')}`,
);
assert.equal(
  player.mitigatesDamage.plating,
  BASE_PLATING + expectedPerStack,
  'the plating stat should carry exactly one stack of the card on top of the base',
);

// A state-preserving recalc (stance switch, core swap, the tier-up kill) unwinds
// the bonus and rebuilds the base, then restores `resources`. The restored
// `reactivePlatingApplied` must NOT describe a bonus that is no longer on the
// stat, or the next fade subtracts it from the fresh base (review finding P2).
{
  recalculatePlayerStatsPreservingCombatState(world, player);
  const rebuiltBase = player.mitigatesDamage.plating;
  assert.equal(
    Math.round(getResource(player.tracksCombat, 'reactivePlatingApplied')),
    0,
    'after a preserving recalc the applied bookkeeping is zero, like the bonus it described',
  );
  assert.equal(
    getResource(player.tracksCombat, 'reactivePlatingStacks'),
    1,
    'the stacks themselves survive the recalc',
  );
  resetReactivePlating(player);
  assert.equal(
    player.mitigatesDamage.plating,
    rebuiltBase,
    'fading the stacks after a preserving recalc never drops plating below the rebuilt base',
  );
}
assert(
  new Set(seen).size === 1,
  `the applied plating must not climb across refreshes; went ${seen.join(' -> ')}`,
);

console.log('lineagePlatingStack: ok');

function setResource(cs: Parameters<typeof getResource>[0], key: string, value: number): void {
  // Local alias so the import list stays the public shared surface.
  (cs.resources as Record<string, number>)[key] = value;
}
