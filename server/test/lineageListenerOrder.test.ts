/**
 * The lineage triggers that read what DEFENSE did to an incoming hit must be
 * registered after the defense stack.
 *
 * Two of them depend on it and both failed silently when they were registered
 * with the rest of the card runtime:
 *
 * - `hit-taken` gates on `ctx.damage > 0`. Registered ahead of evasion, the cap,
 *   wards and the barrier, it read the PRE-mitigation figure and so fired on
 *   hits that were fully dodged or fully absorbed.
 * - `barrier-break` reads the `barrierEmptied` / `wardBrokenMax` metadata that
 *   `defense/barrier/barrier.ts` sets from its own `onDamageTaken` listener.
 *   Registered first it could never see a break at all, which made every
 *   barrier-break card dead data.
 *
 * `lineageCards.wiring.test.ts` cannot catch this: it injects that metadata by
 * hand, so it passes whatever the order is. This asserts the order itself,
 * through the measurement-observer seam, which reports one entry per listener
 * tagged with its registration label, in registration order.
 *
 * Run: node --conditions=development --import tsx test/lineageListenerOrder.test.ts
 */
import assert from 'node:assert/strict';
import {
  GAME_CONFIG,
  baseRecoveryForTier,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { CombatContext } from '../src/systems/combat/engine/combatPipeline';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import {
  emitCombatEvent,
  setCombatMeasurementObserver,
} from '../src/systems/combat/engine/combatPipeline';

const NODE = 'node-5-5';

function makePlayerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: 'Order Tester' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1_000, maxHp: 1_000, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
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

const player = world.attachPlayerEntity(makePlayerSlices('order'), 'order');
const attacker = world.createMonster(NODE, 'plains-slime', { x: 420, y: 400 });
assert(attacker !== null, 'failed to spawn the attacker');
world.takeNodeEvents(NODE);

const layers: string[] = [];
setCombatMeasurementObserver(world, (m) => {
  if (m.event === 'onDamageTaken') layers.push(m.layer);
});

const ctx = {
  attacker, attackerType: 'monster',
  defender: player, defenderType: 'player',
  damage: 50, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
} as unknown as CombatContext;
emitCombatEvent('onDamageTaken', ctx, world);
setCombatMeasurementObserver(world, undefined);

const indexOf = (label: string): number => layers.indexOf(label);

assert(
  indexOf('registerLineageIncomingCards') >= 0,
  `the lineage incoming pass did not run on onDamageTaken; layers were: ${layers.join(', ')}`,
);

for (const defenceLayer of ['registerEvasion', 'registerDamageCap', 'registerBarrierAbsorb']) {
  const defence = indexOf(defenceLayer);
  assert(defence >= 0, `${defenceLayer} registered no onDamageTaken listener; layers: ${layers.join(', ')}`);
  assert(
    defence < indexOf('registerLineageIncomingCards'),
    `${defenceLayer} must run BEFORE the lineage incoming pass, or hit-taken reads `
      + `pre-mitigation damage and barrier-break never sees a break. Order was: ${layers.join(', ')}`,
  );
}

// Only the incoming pass moved; the rest of the card runtime stays ahead of defense.
const mainPass = indexOf('registerLineageCards');
if (mainPass >= 0) {
  assert(
    mainPass < indexOf('registerBarrierAbsorb'),
    `the main lineage pass should still register before defense; order was: ${layers.join(', ')}`,
  );
}

console.log('lineageListenerOrder: ok');
