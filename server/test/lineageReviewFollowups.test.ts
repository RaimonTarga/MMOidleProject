// Wiring tests for two "fix before playtest" findings of the 2026-10-02 branch
// review (docs/briefs/lineage-branch-review-findings-2026-10-02.md):
//   P1 — `mechanicConsumed` is the "the class mechanic spent its charge" flag;
//        `empoweredAttack` alone (crit styling on several T3 paths) must not fire
//        the energy mechanic-fired emitter.
//   P3 — evolving an EQUIPPED non-weapon form moves the lineage's worn form with
//        the slot, so the tree stays lit.
// (P7 lives in abilityControl.test.ts, P2 in lineagePlatingStack.test.ts.)
//
// Run: node --conditions=development --import tsx test/lineageReviewFollowups.test.ts

import {
  GAME_CONFIG, LINEAGE_DATABASE, RECIPE_DATABASE, baseRecoveryForTier, emptyEquipment,
  initUsesEnergy, requiredPlusFor, resolveLineageCard, setLineageRuntime,
} from '@mmo-idle/shared';
import type { LineageRuntime } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { attachComponent } from '../src/ecs/markerHelpers';
import { emitCombatEvent, type CombatContext } from '../src/systems/combat/engine/combatPipeline';
import { equipItem } from '../src/systems/player/economy/inventory';
import { evolveItem } from '../src/systems/player/economy/itemEvolution';
import { unlockLineageCard } from '../src/systems/player/economy/lineages';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-t1-forest-01';

function makeSlices(id: string, inventory: string[]): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 100000, blue: 100000, green: 100000, yellow: 100000, purple: 100000 },
      shards: { tempo: 999, affliction: 999, engagement: 999, bulwark: 999, 'barrier-tempo': 999, control: 999, empowered: 999, 'kill-chain': 999, technique: 999 },
      capstones: { forest: 99 },
      biomeXP: {}, biomeLevel: { forest: 99, plains: 99 },
      unlockedRecipes: [], questProgress: {}, playerTier: 2, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory, equipment: { ...emptyEquipment() }, itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

initCombatSystems();

// ─── P1: crit styling is not the mechanic firing ─────────────────────────────

{
  const world = new World();
  const player = world.attachPlayerEntity(makeSlices('p1', ['flash-rapier']), 'p1');
  equipItem(world, player, 'flash-rapier');
  attachComponent(world, player, 'usesEnergy', initUsesEnergy());
  const rapier = LINEAGE_DATABASE.get('rapier')!;
  const payoffCard = rapier.cards.find((c) => c.id === 'rapier-t1-tempo-payoff')!;
  const resolved = resolveLineageCard(payoffCard, rapier);
  const runtime: LineageRuntime = {
    cards: [{ ...resolved, trigger: { kind: 'mechanic-fired' }, payoff: { kind: 'echo-hit', magnitude: 0.5 } }],
    capstones: [],
  };
  setLineageRuntime(player.tracksCombat, runtime);
  const target = world.createMonster(NODE, 'plains-slime', { x: 420, y: 400 })!;
  target.hasHealth.maxHp = 100_000; target.hasHealth.hp = 100_000;
  world.takeNodeEvents(NODE);

  const hit = (metadata: Record<string, unknown>) => {
    const ctx = {
      attacker: player, attackerType: 'player', defender: target, defenderType: 'monster',
      damage: 50, platingMult: 1, drPierce: 0, cancelled: false, metadata,
    } as unknown as CombatContext;
    emitCombatEvent('onHit', ctx, world);
    return world.takeNodeEvents(NODE).filter((e) => e.kind === 'card-fx').length;
  };
  assert(hit({ empoweredAttack: true }) === 0,
    'a hit flagged empowered for styling only (Surge in Overdrive) must not fire mechanic-fired cards');
  assert(hit({ empoweredAttack: true, mechanicConsumed: true }) === 1,
    'a hit on which the mechanic spent its charge fires the mechanic-fired card once');
}

// ─── P3: evolving the equipped vest keeps the bindings tree lit ──────────────

{
  const world = new World();
  const recipe = RECIPE_DATABASE.get('forest-vest-t2')!;
  assert(recipe.evolvesFrom === 'forest-vest-t1', 'fixture: the Forest vest evolves from its T1');
  const player = world.attachPlayerEntity(makeSlices('p3', ['forest-vest-t1']), 'p3');
  player.tracksProgression.unlockedRecipes.push(recipe.id);
  player.holdsInventory.itemUpgrades['forest-vest-t1'] = requiredPlusFor(recipe);
  assert(equipItem(world, player, 'forest-vest-t1'), 'fixture: wears the T1 vest');
  const lineage = LINEAGE_DATABASE.get('bindings')!;
  const card = lineage.cards.find((c) => c.id === 'bindings-t1-tempo-payoff')!;
  const bought = unlockLineageCard(world, player, 'bindings', card.id);
  assert(bought.success, `fixture: bought a bindings card: ${bought.reason}`);
  assert(player.holdsInventory.lineages?.bindings?.wornForm === 'forest-vest-t1', 'fixture: the T1 vest is the worn form');

  const evolved = evolveItem(world, player, recipe.id, 'evolve');
  assert(evolved.success, `evolve succeeds: ${evolved.reason}`);
  assert(player.holdsInventory.equipment.armor === recipe.id, 'the slot moved to the T2 vest');
  const tree = player.holdsInventory.lineages?.bindings;
  assert(tree?.wornForm === recipe.id, `the worn form followed the slot, got ${tree?.wornForm}`);
  assert(tree?.ownedForms.includes(recipe.id), 'and the evolved form is owned');
}

console.log('lineageReviewFollowups: ok');
