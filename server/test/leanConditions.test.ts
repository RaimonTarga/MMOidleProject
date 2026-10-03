/**
 * The leans that seed their lane's condition (design §24.9), wired.
 *
 * WHAT THIS PINS — wiring and invariants, not balance:
 *
 *   A. THE AFFLICTION LEAN, A STRIKER. Envenomed puts a light bleed on every
 *      landed hit for a class with no DoT of its own, so the Affliction moment has
 *      something to find: Venom Point fires — at its cap, from the second hit —
 *      for a Striker swinging the real attack at its real cadence. Before §24.9 it
 *      fired only for the Apprentice.
 *   B. THE LIGHT BLEED'S RULES. It is a reservoir every hit ADDS to (a share of
 *      the hit before any empowered multiplier), on its own id: it never
 *      overwrites, truncates or extends a heavy bleed still owed, and the heavy one
 *      never erases it; a blocking evade seeds nothing; the DoT inventory counts it
 *      (so a re-dose doubles it); the one bleed driver ticks it out and the marker
 *      leaves with it.
 *   C. THE APPRENTICE. The same stat still adds into its DoT multiplier.
 *
 * Run: node --conditions=development --import tsx test/leanConditions.test.ts
 */
import {
  GAME_CONFIG,
  baseRecoveryForTier,
  dotClassProfileForSubVariant,
  emptyEquipment,
  getLineageRuntime,
  getStatusEffect,
  setLineageRuntime,
  tickCooldowns,
  tickStatusEffectDurations,
  type CombatEvent,
  type ResolvedLineageCard,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { emitCombatEvent, type CombatContext } from '../src/systems/combat/engine/combatPipeline';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { equipItem } from '../src/systems/player/economy/inventory';
import { unlockLineageCard } from '../src/systems/player/economy/lineages';
import { unlockSkill } from '../src/systems/player/progression/skills';
import { playerDotsOnMonster } from '../src/systems/combat/damage/dotInventory';
import { updateHemorrhages } from '../src/systems/classes/archetypes/cadence/t3/ticks/hemorrhage';
import { LEAN_BLEED_ID, LINEAGE_BLEED_ID } from '../src/systems/combat/damage/bleedIds';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
initCombatSystems();
const world = new World();
let clock = 1_000_000;
const realNow = Date.now;
Date.now = () => clock;

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
      level: 0, skillPoints: 1,
      essences: { red: 99_999, blue: 99_999, green: 99_999, yellow: 99_999, purple: 99_999 },
      shards: {
        tempo: 999, affliction: 999, engagement: 999, empowered: 999, control: 999, 'kill-chain': 999, technique: 999,
      },
      capstones: {},
      biomeXP: {}, biomeLevel: { plains: 6, forest: 6, mountain: 6, swamp: 6, cave: 6 },
      unlockedRecipes: [], questProgress: {}, playerTier: 2, currentSkillTier: 0,
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

/** A player wearing `weapon` (optionally of a class), with `cardIds` bought through the economy. */
function wielder(id: string, weapon: string, lineageId: string, cardIds: string[], classRoot?: string): PlayerEntity {
  const slices = makeSlices(id);
  slices.holdsInventory.inventory = [weapon];
  const player = world.attachPlayerEntity(slices, id);
  if (classRoot) assert(unlockSkill(world, player, classRoot), `${id}: ${classRoot} unlocks`);
  assert(equipItem(world, player, weapon), `${id}: wears ${weapon}`);
  for (const cardId of cardIds) {
    const bought = unlockLineageCard(world, player, lineageId, cardId);
    assert(bought.success, `${id}: ${cardId}: ${bought.reason}`);
  }
  world.takeNodeEvents(NODE);
  return player;
}

let nextX = 600;
function dummy(): MonsterEntity {
  nextX += 500;
  const m = world.createMonster(NODE, 'plains-slime', { x: nextX, y: 400 });
  assert(m, 'the dummy spawned');
  m!.hasHealth.maxHp = 10_000_000;
  m!.hasHealth.hp = 10_000_000;
  return m!;
}

/** One real swing at `target`; returns the `card-fx` events it drew for `cardId`. */
function swing(player: PlayerEntity, target: MonsterEntity, cardId: string): Array<Extract<CombatEvent, { kind: 'card-fx' }>> {
  player.hasPosition.current = { x: target.hasPosition.current.x - 30, y: 400 };
  setAttackTarget(world, player, target.isMonster.id);
  runPlayerAttack(world, player, target, clock, {
    attackOrigin: { ...player.hasPosition.current },
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });
  return world.takeNodeEvents(NODE)
    .filter((e): e is Extract<CombatEvent, { kind: 'card-fx' }> => e.kind === 'card-fx' && e.cardId === cardId);
}

/** The swing interval the 10 Hz loop actually runs this player at. */
function realStep(player: PlayerEntity): number {
  return Math.ceil(player.performsAttack.attackCooldown / 100) * 100;
}

/** What a bleed record still owes: remaining ticks × per-tick. */
function owed(target: MonsterEntity, id: string): number {
  const bleed = getStatusEffect(target.tracksCombat, id);
  return bleed ? bleed.stacks * (bleed.data['damagePerTick'] ?? 0) : 0;
}

const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;

// ══ A. THE AFFLICTION LEAN ON A STRIKER — the Affliction moment fires ═════════

{
  const LEAN = 'rapier-t1-affliction-stat'; // Envenomed
  const VERB = 'rapier-t1-affliction-payoff'; // Venom Point
  const player = wielder('lean-afl-striker', 'flash-rapier', 'rapier', [LEAN, VERB], 'cadence-root');
  assert(player.usesSkills.combatArchetype === 'cadence' && player.appliesDots === undefined,
    'a real Striker, with no DoT of its own');
  const share = player.usesSkills.passives['shared.bleed-on-hit-pct'] ?? 0;
  assert(near(share, 0.1), `the lean's DoT potency is also the on-hit bleed share, got ${share}`);
  const verb = getLineageRuntime(player.tracksCombat)?.cards.find((c) => c.card.id === VERB);
  assert(verb?.trigger?.kind === 'hit-afflicted' && verb.trigger.capMs === 5_000, 'Venom Point: the Affliction moment, capped');
  assert(verb?.payoff?.kind === 'redose', 'Envenomed on Venom Point is the pure pair (the re-dose)');

  const target = dummy();
  const first = swing(player, target, VERB);
  assert(first.length === 0, 'the hit that first afflicts is not on an afflicted target');
  assert(owed(target, LEAN_BLEED_ID) > 0, 'but it leaves the light bleed: a Striker\'s hit now afflicts');
  assert(getStatusEffect(target.tracksCombat, LEAN_BLEED_ID)?.stacks === 4, 'over 4 ticks (4 s)');

  const STEP = realStep(player);
  const firedAt: number[] = [];
  let swings = 1;
  for (let t = STEP; t <= 30_000; t += STEP) {
    clock += STEP;
    tickCooldowns(player.tracksCombat, STEP);
    tickStatusEffectDurations(target.tracksCombat, STEP);
    updateHemorrhages(world, STEP);
    if (swing(player, target, VERB).length > 0) firedAt.push(t);
    swings += 1;
  }
  assert(firedAt[0] === STEP, `the second swing finds the bleed and fires, got ${firedAt[0]}`);
  for (let i = 1; i < firedAt.length; i++) {
    const gap = firedAt[i] - firedAt[i - 1];
    assert(gap >= 5_000 && gap < 5_000 + STEP, `fires at the 5 s cap, reliably (gap ${gap})`);
  }
  assert(firedAt.length >= 5, `a Striker's Venom Point fires through a 30 s fight: ${firedAt.length} of ${swings} swings`);
  console.log(`  A striker  step ${STEP} ms  swings ${swings}  Venom Point fired ${firedAt.length}`);
}

// ══ B. THE LIGHT BLEED'S RULES ═════════════════════════════════════════════════

/** A player whose lean is seeded straight onto its passives. */
function seeded(id: string, cards: ResolvedLineageCard[] = []): PlayerEntity {
  const player = world.attachPlayerEntity(makeSlices(id), id);
  player.usesSkills.passives['shared.bleed-on-hit-pct'] = 0.1;
  player.dealsDamage.attack = 100;
  setLineageRuntime(player.tracksCombat, { cards, capstones: [] });
  world.takeNodeEvents(NODE);
  return player;
}

function hit(player: PlayerEntity, defender: MonsterEntity, damage: number, metadata: Record<string, unknown> = {}): CombatContext {
  const ctx = {
    attacker: player, attackerType: 'player',
    defender, defenderType: 'monster',
    damage, platingMult: 1, drPierce: 0, cancelled: false, metadata,
  } as unknown as CombatContext;
  emitCombatEvent('onHit', ctx, world);
  return ctx;
}

{
  const player = seeded('lean-bleed-rules');
  const target = dummy();

  hit(player, target, 200);
  assert(near(owed(target, LEAN_BLEED_ID), 20), `a tenth of a 200 hit, got ${owed(target, LEAN_BLEED_ID)}`);
  hit(player, target, 200);
  assert(near(owed(target, LEAN_BLEED_ID), 40), `a reservoir: the second hit ADDS, got ${owed(target, LEAN_BLEED_ID)}`);
  assert(getStatusEffect(target.tracksCombat, LEAN_BLEED_ID)?.stacks === 4, 're-spread over one window');

  // One multiplier per hit: the share is of the hit before the empowered multiplier.
  hit(player, target, 400, { empoweredMultiplier: 2 });
  assert(near(owed(target, LEAN_BLEED_ID), 60), `an empowered 400 (×2) seeds a tenth of 200, got ${owed(target, LEAN_BLEED_ID)}`);

  // A blocking evade seeds nothing.
  hit(player, target, 200, { evadeBlocksDebuffs: true });
  assert(near(owed(target, LEAN_BLEED_ID), 60), 'a blocking evade applies no bleed');

  // A HEAVY bleed still owed is never touched by the light one…
  const heavy = getStatusEffect(target.tracksCombat, LINEAGE_BLEED_ID);
  assert(heavy === undefined, 'the light bleed is not the heavy record');
  const heavyHolder = seeded('lean-bleed-heavy', [{
    card: {
      id: 'seed-heavy', lineageId: 'rapier', tier: 1, row: 'payoff', lane: 'affliction',
      name: 'Seeded heavy', description: '', fx: 'affliction.heavy-drip',
    },
    requiredBiomeGroup: 'forest', requiredBiomeLevel: 1, requiredGlobalMastery: 0,
    cost: { essence: {}, shards: {} },
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'hemorrhage', magnitude: 1, durationMs: 4_000 },
  }]);
  const both = dummy();
  hit(heavyHolder, both, 200);
  const heavyOwed = owed(both, LINEAGE_BLEED_ID);
  const lightOwed = owed(both, LEAN_BLEED_ID);
  assert(near(heavyOwed, 200), `the heavy payload: a whole swing, got ${heavyOwed}`);
  assert(near(lightOwed, 20), `and the light one alongside it, got ${lightOwed}`);
  hit(heavyHolder, both, 200);
  assert(near(owed(both, LEAN_BLEED_ID), 40), 'the heavy refresh never erases the light reservoir');
  assert(near(owed(both, LINEAGE_BLEED_ID), 200), 'and the light hit never adds to, or cuts, the heavy record');

  // The DoT inventory counts it: it afflicts, and a re-dose doubles it.
  const entries = playerDotsOnMonster(world, player, target);
  assert(entries.some((e) => e.effect.id === LEAN_BLEED_ID), 'the light bleed is an affliction to the DoT inventory');
  const redoser = seeded('lean-bleed-redose', [{
    card: {
      id: 'seed-redose', lineageId: 'rapier', tier: 1, row: 'payoff', lane: 'affliction',
      name: 'Seeded redose', description: '', fx: 'affliction.double-dose',
    },
    requiredBiomeGroup: 'forest', requiredBiomeLevel: 1, requiredGlobalMastery: 0,
    cost: { essence: {}, shards: {} },
    trigger: { kind: 'hit-nth', n: 2 },
    payoff: { kind: 'redose', magnitude: 1, durationMs: 4_000 },
  }]);
  const doubled = dummy();
  hit(redoser, doubled, 200);
  assert(near(owed(doubled, LEAN_BLEED_ID), 20) && owed(doubled, LINEAGE_BLEED_ID) === 0, 'one hit: the light bleed alone');
  hit(redoser, doubled, 200);
  // The 2nd hit's re-dose runs in the card runtime, BEFORE this hit's own seed:
  // it doubles the 20 owed into the heavy record, then the seed adds its 20.
  assert(owed(doubled, LINEAGE_BLEED_ID) >= 19 && owed(doubled, LINEAGE_BLEED_ID) <= 21,
    `the re-dose doubles what the light bleed owed, got ${owed(doubled, LINEAGE_BLEED_ID)}`);
  assert(near(owed(doubled, LEAN_BLEED_ID), 40), 'and leaves the light reservoir to keep filling');
  world.takeNodeEvents(NODE);

  // The one bleed driver ticks it out; the marker leaves with it.
  const solo = dummy();
  hit(player, solo, 200);
  assert(solo.hasHemorrhage !== undefined, 'a bleeding body carries the marker');
  const before = solo.hasHealth.hp;
  updateHemorrhages(world, 1_000);
  assert(solo.hasHealth.hp < before, 'the light bleed ticks through the one driver');
  assert(getStatusEffect(solo.tracksCombat, LEAN_BLEED_ID)?.stacks === 3, 'one tick spent');
  for (let i = 0; i < 3; i++) updateHemorrhages(world, 1_000);
  assert(getStatusEffect(solo.tracksCombat, LEAN_BLEED_ID) === undefined, 'four ticks and it is gone');
  assert(solo.hasHemorrhage === undefined, 'and so is the marker');

  // No lean, no seed.
  const plain = seeded('lean-bleed-none');
  plain.usesSkills.passives['shared.bleed-on-hit-pct'] = 0;
  const clean = dummy();
  hit(plain, clean, 200);
  assert(getStatusEffect(clean.tracksCombat, LEAN_BLEED_ID) === undefined, 'a player with no Affliction lean seeds nothing');
}

// ══ C. THE APPRENTICE — DoT potency still feeds its DoT ════════════════════════

{
  const player = wielder('lean-afl-apprentice', 'flash-rapier', 'rapier', ['rapier-t1-affliction-stat'], 'dot-root');
  assert(player.appliesDots !== undefined, 'a real Apprentice');
  const base = dotClassProfileForSubVariant(player.usesSkills.selectedSubVariant).dotMechanicMultiplier;
  const mult = player.usesSkills.passives['dot.mechanic-mult'] ?? 0;
  assert(near(mult, base + 0.1), `DoT potency adds +0.10 onto the root's ${base}, got ${mult}`);
  assert(near(player.usesSkills.passives['shared.bleed-on-hit-pct'] ?? 0, 0.1),
    'and the same stat bleeds its hit: the two halves partition the DoT root\'s damage');
}

Date.now = realNow;
console.log('leanConditions: ok');
