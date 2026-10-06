// Wiring tests for the three runtime blockers of the 2026-10-02 branch review
// (docs/briefs/lineage-branch-review-findings-2026-10-02.md, B1–B3). Each block
// failed before its fix:
//   B1 — a rejected lineage request on a lineage the player holds nothing of must
//        save no tree, and hydrating an empty tree must grant no form.
//   B2 — a respawn keeps the lineage runtime (cards stay live after a death).
//   B3 — an onHit proc that kills the target pays the kill exactly once.
//
// Run: node --conditions=development --import tsx test/lineageReviewBlockers.test.ts

import {
  GAME_CONFIG, LINEAGE_DATABASE, baseRecoveryForTier, emptyEquipment,
  getLineageRuntime, setLineageRuntime, normalizeLineageProgressMap, resolveLineageCard,
} from '@mmo-idle/shared';
import type { LineageRuntime } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { equipItem } from '../src/systems/player/economy/inventory';
import { setLineageActive, unlockLineageCard } from '../src/systems/player/economy/lineages';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-t1-forest-01';

function makeSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 100000, blue: 100000, green: 100000, yellow: 100000, purple: 100000 },
      shards: { tempo: 999, affliction: 999, engagement: 999 }, capstones: { forest: 99 },
      biomeXP: {}, biomeLevel: { forest: 99, plains: 99 },
      unlockedRecipes: [], questProgress: {}, playerTier: 1, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: ['flash-rapier'], equipment: { ...emptyEquipment() }, itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

initCombatSystems();

// ─── B1: a rejected request saves no tree; hydration grants no form ──────────

{
  const world = new World();
  const player = world.attachPlayerEntity(makeSlices('b1'), 'b1');
  // The player holds a Flash Rapier and nothing of the Hammer lineage.
  assert(!player.holdsInventory.lineages?.hammer, 'no hammer tree before any request');

  // Every handler on a lineage the player holds nothing of: a clear on an empty
  // row "succeeds" (nothing to do), the others are refused. None may save a tree.
  setLineageActive(world, player, 'hammer', 'stat', null);
  const hammer = LINEAGE_DATABASE.get('hammer')!;
  const hammerStat = hammer.cards.find((c) => c.row === 'stat' && c.tier === 1)!;
  const bought = unlockLineageCard(world, player, 'hammer', hammerStat.id);
  assert(!bought.success, 'a card on a lineage the player holds nothing of is refused');
  assert(!player.holdsInventory.lineages?.hammer, 'and no hammer tree was written by any of the requests');

  // The hydration half: a saved empty tree comes back empty, not with a base form.
  const hydrated = normalizeLineageProgressMap({ hammer: { ownedCards: [], active: {}, ownedForms: [], wornForm: '' } });
  assert(hydrated.hammer!.ownedForms.length === 0, 'hydration invents no base form');
  assert(hydrated.hammer!.wornForm === '', 'and wears nothing');

  // The lineage the player DOES hold still opens on its first purchase.
  equipItem(world, player, 'flash-rapier');
  const rapier = LINEAGE_DATABASE.get('rapier')!;
  const rapierStat = rapier.cards.find((c) => c.id === 'rapier-t1-speed')!;
  const ok = unlockLineageCard(world, player, 'rapier', rapierStat.id);
  assert(ok.success, `the held lineage still buys: ${ok.reason}`);
  assert(player.holdsInventory.lineages?.rapier?.ownedForms.includes('flash-rapier'), 'the held base form is owned');
}

// ─── B2: a respawn keeps the lineage runtime ─────────────────────────────────

{
  const world = new World();
  const player = world.attachPlayerEntity(makeSlices('b2'), 'b2');
  equipItem(world, player, 'flash-rapier');
  const rapier = LINEAGE_DATABASE.get('rapier')!;
  const payoff = rapier.cards.find((c) => c.id === 'rapier-t1-tempo-payoff')!;
  const bought = unlockLineageCard(world, player, 'rapier', payoff.id);
  assert(bought.success, `payoff bought: ${bought.reason}`);
  const before = getLineageRuntime(player.tracksCombat);
  assert(before && before.cards.length >= 1, 'the purchase built a runtime with the card in it');

  world.killPlayer('b2', { kind: 'stance', damage: 100, stanceName: 'Test' });
  world.respawnPlayer('b2');

  const after = getLineageRuntime(player.tracksCombat);
  assert(after && after.cards.length === before!.cards.length,
    `the runtime survives a respawn, got ${after?.cards.length ?? 'none'} cards against ${before!.cards.length}`);
}

// ─── B3: a lethal onHit proc pays the kill once ───────────────────────────────

{
  const world = new World();
  const player = world.attachPlayerEntity(makeSlices('b3'), 'b3');
  equipItem(world, player, 'flash-rapier');
  player.dealsDamage.attack = 50;
  // The real T1 Rapier echo card, resolved, with its trigger set to EVERY hit and
  // its echo large enough that the echo is what kills a low-HP target inside onHit.
  const rapier = LINEAGE_DATABASE.get('rapier')!;
  const payoffCard = rapier.cards.find((c) => c.id === 'rapier-t1-tempo-payoff')!;
  const resolved = resolveLineageCard(payoffCard, rapier);
  const runtime: LineageRuntime = {
    cards: [{ ...resolved, trigger: { kind: 'hit-nth', n: 1 }, payoff: { kind: 'echo-hit', magnitude: 5 } }],
    capstones: [],
  };
  setLineageRuntime(player.tracksCombat, runtime);

  const target = world.createMonster(NODE, 'plains-slime', { x: 420, y: 400 })!;
  assert(target, 'spawned a target');
  target.hasHealth.maxHp = 60;
  target.hasHealth.hp = 60;
  setAttackTarget(world, player, target.isMonster.id);
  world.takeNodeEvents(NODE);

  const outcome = runPlayerAttack(world, player, target as MonsterEntity, Date.now(), {
    attackOrigin: { ...player.hasPosition.current },
    aggroSource: { id: 'b3', kind: 'player' },
  });
  const events = world.takeNodeEvents(NODE);
  const kills = events.filter((e) => e.kind === 'player-kill').length;
  const drops = events.filter((e) => e.kind === 'essence-drop').length;
  assert(!world.hasMonster(target.isMonster.id), 'the target died');
  assert(outcome === 'killed', `the attack reports the kill, got ${outcome}`);
  assert(kills === 1, `one player-kill event, got ${kills}`);
  assert(drops <= 1, `at most one essence drop, got ${drops}`);
}

console.log('lineageReviewBlockers: ok');
