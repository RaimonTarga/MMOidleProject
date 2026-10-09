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
 *      the hit before any empowered multiplier), on the ONE lineage bleed
 *      (`lineage.bleed`, design §26.2): the heavy payload adds to the same record
 *      and neither truncates the other; a blocking evade seeds nothing; the DoT
 *      inventory counts it (so a re-dose doubles it, into the same record); the
 *      one bleed driver ticks it out and the marker leaves with it.
 *   C. THE APPRENTICE. The same stat still adds into its DoT multiplier. On a
 *      weapon that owns a reservoir it seeds no bleed: it is the reservoir's
 *      potency (design §26.2).
 *   D. THE CONTROL LEAN, A HAMMER STRIKER WITH NO MID RANGE. Crushing Weight
 *      "hobbles" on every landed hit (`slowOnHit`, its own id `lineage.hobbled`),
 *      long enough to bridge the Hammer's own swing, so the Control verb fires at
 *      its cap from the second hit on the real attack at the real cadence. The
 *      slow is max-wins (and the strongest slow across ids is what moves the
 *      body), a blocking evade lays none, a knockdown is a hold, and a
 *      control-immune boss still refuses the knockdown it feeds.
 *   E. THE HEAVY PAYLOAD. Every heavy bleed — composed or a legacy card — adds
 *      to what the one record still owes (an event per firing).
 *
 * Since design §26.1 (legibility run) the T1 band is the ranked lean trio and the
 * weapon's one verb: the Hammer's Effect lean IS its slow and Easy Prey its verb
 * (D), and the lane-named Affliction lean is a T2 card, so A and C wear the Rapier's
 * T2 form (Deeper Brew, Deep Bloodletting). Values are read off the resolved cards.
 *
 * Run: node --conditions=development --import tsx test/leanConditions.test.ts
 */
import {
  ABILITY_SLOW_EFFECT_ID,
  LINEAGE_SLOW_STATUS_ID,
  VERB_SEED_SLOW_PCT,
  GAME_CONFIG,
  LINEAGE_DATABASE,
  resolveLineageCardFor,
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
import { LINEAGE_BLEED_ID } from '../src/systems/combat/damage/bleedIds';
import { leanSlowMs } from '../src/systems/combat/leanConditions';
import { applyMonsterSlow, monsterIsHeld, updateMonsterSlows } from '../src/systems/combat/status/monsterControl';
import { applyStun, STUN_EFFECT } from '../src/systems/combat/status/stun';
import { monsterIgnoresControl } from '../src/systems/combat/status/controlImmunity';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
initCombatSystems();
const world = new World();
let clock = 1_000_000;
const realNow = Date.now;
Date.now = () => clock;

/** `level` is every T1 biome's level: 6 (Global Mastery 30) is T1 complete, 12 reaches the T2 band. */
function makeSlices(id: string, level = 6): PersistedPlayerSlices {
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
      biomeXP: {}, biomeLevel: { plains: level, forest: level, mountain: level, swamp: level, cave: level },
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

/** As `wielder`, wearing the lineage's T2 form (its band opens two-lane leans). */
function wielderT2(
  id: string, t1Form: string, t2Form: string, lineageId: string, cardIds: string[], classRoot?: string,
): PlayerEntity {
  const slices = makeSlices(id, 12);
  slices.holdsInventory.inventory = [t1Form, t2Form];
  const player = world.attachPlayerEntity(slices, id);
  if (classRoot) assert(unlockSkill(world, player, classRoot), `${id}: ${classRoot} unlocks`);
  assert(equipItem(world, player, t1Form), `${id}: wears ${t1Form}`);
  assert(equipItem(world, player, t2Form), `${id}: wears ${t2Form}`);
  for (const cardId of cardIds) {
    const bought = unlockLineageCard(world, player, lineageId, cardId);
    assert(bought.success, `${id}: ${cardId}: ${bought.reason}`);
  }
  world.takeNodeEvents(NODE);
  return player;
}

/** A card's resolved stat value on this player's tree. */
function leanValue(player: PlayerEntity, lineageId: string, cardId: string): number {
  const lineage = LINEAGE_DATABASE.get(lineageId)!;
  const card = lineage.cards.find((c) => c.id === cardId)!;
  const progress = player.holdsInventory.lineages![lineageId]!;
  return Object.values(resolveLineageCardFor(lineage, progress, card).statEffects ?? {})[0] ?? 0;
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
  const LEAN = 'rapier-t2-affliction-stat'; // Deeper Brew
  const VERB = 'rapier-t2-affliction-payoff'; // Deep Bloodletting
  const player = wielderT2('lean-afl-striker', 'flash-rapier', 'gale-needle', 'rapier', [LEAN, VERB], 'cadence-root');
  assert(player.usesSkills.combatArchetype === 'cadence' && player.appliesDots === undefined,
    'a real Striker, with no DoT of its own');
  const share = player.usesSkills.passives['shared.bleed-on-hit-pct'] ?? 0;
  assert(near(share, leanValue(player, 'rapier', LEAN)), `the lean's DoT potency is also the on-hit bleed share, got ${share}`);
  const verb = getLineageRuntime(player.tracksCombat)?.cards.find((c) => c.card.id === VERB);
  assert(verb?.trigger?.kind === 'hit-afflicted' && verb.trigger.capMs === 5_000, 'Deep Bloodletting: the Affliction moment, capped');
  assert(verb?.payoff?.kind === 'redose', 'Deeper Brew on Deep Bloodletting is the pure pair (the re-dose)');

  const target = dummy();
  const first = swing(player, target, VERB);
  assert(first.length === 0, 'the hit that first afflicts is not on an afflicted target');
  assert(owed(target, LINEAGE_BLEED_ID) > 0, 'but it leaves the light bleed: a Striker\'s hit now afflicts');
  assert(getStatusEffect(target.tracksCombat, LINEAGE_BLEED_ID)?.stacks === 4, 'over 4 ticks (4 s)');

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
  assert(firedAt.length >= 5, `a Striker's Deep Bloodletting fires through a 30 s fight: ${firedAt.length} of ${swings} swings`);
  console.log(`  A striker  step ${STEP} ms  swings ${swings}  Deep Bloodletting fired ${firedAt.length}`);
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
  assert(near(owed(target, LINEAGE_BLEED_ID), 20), `a tenth of a 200 hit, got ${owed(target, LINEAGE_BLEED_ID)}`);
  hit(player, target, 200);
  assert(near(owed(target, LINEAGE_BLEED_ID), 40), `a reservoir: the second hit ADDS, got ${owed(target, LINEAGE_BLEED_ID)}`);
  assert(getStatusEffect(target.tracksCombat, LINEAGE_BLEED_ID)?.stacks === 4, 're-spread over one window');

  // One multiplier per hit: the share is of the hit before the empowered multiplier.
  hit(player, target, 400, { empoweredMultiplier: 2 });
  assert(near(owed(target, LINEAGE_BLEED_ID), 60), `an empowered 400 (×2) seeds a tenth of 200, got ${owed(target, LINEAGE_BLEED_ID)}`);

  // A blocking evade seeds nothing.
  hit(player, target, 200, { evadeBlocksDebuffs: true });
  assert(near(owed(target, LINEAGE_BLEED_ID), 60), 'a blocking evade applies no bleed');

  // ONE record (design §26.2): the heavy payload and the light lean add to the
  // same `lineage.bleed`, and neither cuts what the other still owes.
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
  assert(near(owed(both, LINEAGE_BLEED_ID), 220), `a whole swing (200) and a tenth (20), one record, got ${owed(both, LINEAGE_BLEED_ID)}`);
  assert(both.tracksCombat.statusEffects.filter((e) => e.id.startsWith('lineage.')).length === 1,
    'exactly one lineage record on the target');
  hit(heavyHolder, both, 200);
  assert(near(owed(both, LINEAGE_BLEED_ID), 440), `the second firing ADDS both again, got ${owed(both, LINEAGE_BLEED_ID)}`);
  assert(getStatusEffect(both.tracksCombat, LINEAGE_BLEED_ID)?.stacks === 4, 'over one window, never shortened');

  // The DoT inventory counts it: it afflicts, and a re-dose doubles it.
  const entries = playerDotsOnMonster(world, player, target);
  assert(entries.some((e) => e.effect.id === LINEAGE_BLEED_ID), 'the light bleed is an affliction to the DoT inventory');
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
  assert(near(owed(doubled, LINEAGE_BLEED_ID), 20), 'one hit: the light bleed alone');
  hit(redoser, doubled, 200);
  // The 2nd hit's re-dose runs in the card runtime, BEFORE this hit's own seed:
  // it doubles the 20 owed (into the same record), then the seed adds its 20.
  const redosed = owed(doubled, LINEAGE_BLEED_ID);
  assert(redosed >= 59 && redosed <= 61, `the re-dose doubles what the bleed owed, then the seed adds: got ${redosed}`);
  assert(doubled.tracksCombat.statusEffects.filter((e) => e.id.startsWith('lineage.')).length === 1,
    'still one lineage record');
  world.takeNodeEvents(NODE);

  // The one bleed driver ticks it out; the marker leaves with it.
  const solo = dummy();
  hit(player, solo, 200);
  assert(solo.hasHemorrhage !== undefined, 'a bleeding body carries the marker');
  const before = solo.hasHealth.hp;
  updateHemorrhages(world, 1_000);
  assert(solo.hasHealth.hp < before, 'the light bleed ticks through the one driver');
  assert(getStatusEffect(solo.tracksCombat, LINEAGE_BLEED_ID)?.stacks === 3, 'one tick spent');
  for (let i = 0; i < 3; i++) updateHemorrhages(world, 1_000);
  assert(getStatusEffect(solo.tracksCombat, LINEAGE_BLEED_ID) === undefined, 'four ticks and it is gone');
  assert(solo.hasHemorrhage === undefined, 'and so is the marker');

  // No lean, no seed.
  const plain = seeded('lean-bleed-none');
  plain.usesSkills.passives['shared.bleed-on-hit-pct'] = 0;
  const clean = dummy();
  hit(plain, clean, 200);
  assert(getStatusEffect(clean.tracksCombat, LINEAGE_BLEED_ID) === undefined, 'a player with no Affliction lean seeds nothing');
}

// ══ D. THE CONTROL LEAN ON A HAMMER STRIKER, NO MID RANGE ══════════════════════

{
  const LEAN = 'hammer-t1-effect'; // the Hammer's Effect: its slow
  const VERB = 'hammer-t1-control-payoff'; // Easy Prey
  const player = wielder('lean-ctl-striker', 'heavy-hammer', 'hammer', [LEAN, VERB], 'cadence-root');
  assert(player.usesSkills.combatArchetype === 'cadence', 'a real Striker');
  assert(player.usesSkills.selectedRange === null, 'with no range node: no at-bay slow to borrow');
  const slow = player.usesSkills.passives['shared.slow-on-hit-pct'] ?? 0;
  const SLOW = leanValue(player, 'hammer', LEAN);
  assert(SLOW > 0 && near(slow, SLOW), `the Effect lean is a ${SLOW * 100}% slow on hit, got ${slow}`);
  assert(player.dealsDamage.attack === wielder('lean-ctl-attack', 'heavy-hammer', 'hammer', [], 'cadence-root').dealsDamage.attack,
    'and no longer the placeholder +3 Attack');
  const verb = getLineageRuntime(player.tracksCombat)?.cards.find((c) => c.card.id === VERB);
  assert(verb?.trigger?.kind === 'hit-held' && verb.trigger.capMs === 5_000, 'Easy Prey: the Control moment, capped');
  assert(verb?.payoff?.kind === 'stun', 'the Effect lean on Easy Prey is the pure pair (the knockdown)');

  // The slow outlasts the Hammer's own swing, so the next swing finds it.
  const STEP = realStep(player);
  assert(STEP > 1_500, `a Hammer Striker swings slower than the authored 1.5 s (${STEP} ms)`);
  assert(leanSlowMs(player) > STEP, `the lean slow (${leanSlowMs(player)} ms) bridges one swing (${STEP} ms)`);

  const target = dummy();
  assert(swing(player, target, VERB).length === 0, 'the first hit lands on a free target');
  const laid = getStatusEffect(target.tracksCombat, LINEAGE_SLOW_STATUS_ID);
  assert(laid !== undefined && near(laid.data['moveSlowPct'] ?? 0, SLOW), 'and leaves the lean slow, "Hobbled"');
  assert(getStatusEffect(target.tracksCombat, ABILITY_SLOW_EFFECT_ID) === undefined,
    'on its own id, not Hamstring\'s');
  assert((laid?.data['totalMs'] ?? 0) === leanSlowMs(player), 'with the clock the buff UI needs');

  const firedAt: number[] = [];
  let swings = 1;
  for (let t = STEP; t <= 30_000; t += STEP) {
    clock += STEP;
    tickCooldowns(player.tracksCombat, STEP);
    tickStatusEffectDurations(target.tracksCombat, STEP);
    const fx = swing(player, target, VERB);
    if (fx.length > 0) {
      firedAt.push(t);
      assert(fx[0].fx === 'control.knockdown', 'the pure Control payload: the knockdown');
    }
    swings += 1;
  }
  assert(firedAt[0] === STEP, `the second swing finds the target held and fires, got ${firedAt[0]}`);
  for (let i = 1; i < firedAt.length; i++) {
    const gap = firedAt[i] - firedAt[i - 1];
    assert(gap >= 5_000 && gap < 5_000 + STEP, `fires at the 5 s cap, never chaining (gap ${gap})`);
  }
  assert(firedAt.length >= 5, `a Hammer Striker's Easy Prey fires through a 30 s fight: ${firedAt.length} of ${swings} swings`);
  console.log(`  D hammer striker  step ${STEP} ms  slow ${leanSlowMs(player)} ms  swings ${swings}  Easy Prey fired ${firedAt.length}`);
}

// ══ F. THE HAMMER'S FIXED VERB SEEDS ITS OWN SLOW (design §26.5, 2026-10-06) ═══
// Under the Attack lean nothing slows — and Easy Prey still fires, because a fixed
// T1 verb carries a light version of its own condition (`seeds: 'slow'`,
// `VERB_SEED_SLOW_PCT`). The Effect lean's deeper slow wins where both apply.

{
  const VERB = 'hammer-t1-control-payoff';
  const player = wielder('verb-seed-striker', 'heavy-hammer', 'hammer', ['hammer-t1-attack', VERB], 'cadence-root');
  assert((player.usesSkills.passives['shared.slow-on-hit-pct'] ?? 0) === 0, 'the Attack lean slows nothing');
  const verb = getLineageRuntime(player.tracksCombat)?.cards.find((c) => c.card.id === VERB);
  assert(verb?.card.seeds === 'slow' && verb.trigger?.kind === 'hit-held', 'Easy Prey seeds its own hold');
  const STEP = realStep(player);

  const target = dummy();
  assert(swing(player, target, VERB).length === 0, 'the first hit lands on a free target');
  const laid = getStatusEffect(target.tracksCombat, LINEAGE_SLOW_STATUS_ID);
  assert(laid !== undefined && near(laid.data['moveSlowPct'] ?? 0, VERB_SEED_SLOW_PCT),
    `and leaves the verb's own light slow (${VERB_SEED_SLOW_PCT}), got ${laid?.data['moveSlowPct']}`);
  assert((laid?.data['totalMs'] ?? 0) === leanSlowMs(player), 'on the lean seed\'s window');

  clock += STEP;
  tickCooldowns(player.tracksCombat, STEP);
  tickStatusEffectDurations(target.tracksCombat, STEP);
  const fx = swing(player, target, VERB);
  assert(fx.length > 0 && fx[0].fx === 'control.knockdown', 'the second swing finds the target held and knocks it down');

  // With the Effect lean the deeper slow wins (max-wins), never the lighter seed.
  const deep = wielder('verb-seed-effect', 'heavy-hammer', 'hammer', ['hammer-t1-effect', VERB], 'cadence-root');
  const DEEP = leanValue(deep, 'hammer', 'hammer-t1-effect');
  assert(DEEP >= VERB_SEED_SLOW_PCT, `Effect rank I (${DEEP}) is at least the seed (${VERB_SEED_SLOW_PCT})`);
  const t2 = dummy();
  swing(deep, t2, VERB);
  const deepLaid = getStatusEffect(t2.tracksCombat, LINEAGE_SLOW_STATUS_ID);
  assert(deepLaid !== undefined && near(deepLaid.data['moveSlowPct'] ?? 0, DEEP), 'the Effect lean\'s slow is what lands');
  console.log(`  F hammer attack-lean  seed ${VERB_SEED_SLOW_PCT}  effect ${DEEP}  Easy Prey fires on swing 2`);
}

{
  // The slow rules: max-wins (a stronger slow is never weakened or shortened), a
  // blocking evade lays none, and a knockdown on its own is a hold.
  const player = seeded('lean-ctl-rules');
  player.usesSkills.passives['shared.bleed-on-hit-pct'] = 0;
  player.usesSkills.passives['shared.slow-on-hit-pct'] = 0.15;
  const target = dummy();
  assert(leanSlowMs(player) < 10_000, 'the lean slow is the shorter one here');
  applyMonsterSlow(world, target, 0.4, 10_000, 'someone', LINEAGE_SLOW_STATUS_ID);
  hit(player, target, 200);
  const held = getStatusEffect(target.tracksCombat, LINEAGE_SLOW_STATUS_ID)!;
  assert(near(held.data['moveSlowPct'] ?? 0, 0.4), 'a stronger slow keeps its depth');
  assert(held.remainingMs === 10_000, 'and its clock');

  // The ability-family slow (the `slow` payoff, the at-bay tap; Hamstring's id
  // before the ability pass cut it) and the lean's are the same rung on two ids: both stay on
  // the target (each names its own source), and the strongest is what moves it.
  const both = dummy();
  applyMonsterSlow(world, both, 0.4, 10_000, 'at-bay');
  hit(player, both, 200);
  assert(getStatusEffect(both.tracksCombat, ABILITY_SLOW_EFFECT_ID) !== undefined
    && getStatusEffect(both.tracksCombat, LINEAGE_SLOW_STATUS_ID) !== undefined, 'Slowed and Hobbled side by side');
  updateMonsterSlows(world);
  assert(near(both.hasStatus.monsterMoveSpeedMult ?? 1, 0.6), `the strongest slow wins, got ${both.hasStatus.monsterMoveSpeedMult}`);

  const dodged = dummy();
  hit(player, dodged, 200, { evadeBlocksDebuffs: true });
  assert(getStatusEffect(dodged.tracksCombat, LINEAGE_SLOW_STATUS_ID) === undefined, 'a blocking evade lays no slow');

  const knocked = dummy();
  assert(!monsterIsHeld(knocked), 'a free body is not held');
  assert(applyStun(knocked.tracksCombat, 1_500, 'someone'), 'knocked down');
  assert(monsterIsHeld(knocked), 'a knockdown (a stun) counts as held (design §24.9)');

  // A control-immune boss takes the slow like any slow, and refuses the
  // knockdown it feeds — the immunity holds where control enters.
  const pinned = wielder('lean-ctl-immune', 'heavy-hammer', 'hammer',
    ['hammer-t1-effect', 'hammer-t1-control-payoff'], 'cadence-root');
  const boss = world.createMonster(NODE, 'cinder-shell-magma-salamander', { x: nextX += 500, y: 400 })!;
  boss.hasHealth.maxHp = 10_000_000;
  boss.hasHealth.hp = 10_000_000;
  assert(monsterIgnoresControl(boss), 'the test boss really is control-immune');
  let knockdowns = 0;
  for (let i = 0; i < 4; i++) {
    clock += 2_000;
    tickCooldowns(pinned.tracksCombat, 2_000);
    knockdowns += swing(pinned, boss, 'hammer-t1-control-payoff').length;
  }
  assert(knockdowns === 0, 'an immune boss is never knocked down');
  assert(getStatusEffect(boss.tracksCombat, STUN_EFFECT) === undefined, 'and carries no stun');
}

// ══ E. THE HEAVY PAYLOAD NEVER CUTS ITS OWN PREDECESSOR ════════════════════════

{
  // A heavy payload is an event: each firing is a whole swing, so a second
  // firing inside the first one's 4 s window adds to what is still owed (a Tempo
  // verb on a fast Rapier fires every ~3.6 s). Since design §26.2 a legacy card
  // adds too: every lineage DoT is a source of the one record.
  const heavyCard = (composed: boolean): ResolvedLineageCard => ({
    card: {
      id: `seed-heavy-${composed}`, lineageId: 'rapier', tier: 1, row: 'payoff', lane: 'tempo',
      name: 'Seeded heavy', description: '', fx: 'tempo.ghost-strike',
    },
    requiredBiomeGroup: 'forest', requiredBiomeLevel: 1, requiredGlobalMastery: 0,
    cost: { essence: {}, shards: {} },
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'hemorrhage', magnitude: 1, durationMs: 4_000 },
    payoffFx: 'affliction.heavy-drip',
    ...(composed ? { composition: { verbLane: 'tempo' as const, leanLane: 'affliction' as const, pure: false } } : {}),
  });
  for (const composed of [true, false]) {
    const player = seeded(`heavy-merge-${composed}`, [heavyCard(composed)]);
    player.usesSkills.passives['shared.bleed-on-hit-pct'] = 0;
    const target = dummy();
    hit(player, target, 200);
    assert(near(owed(target, LINEAGE_BLEED_ID), 200), `a whole swing, got ${owed(target, LINEAGE_BLEED_ID)}`);
    updateHemorrhages(world, 1_000);
    assert(near(owed(target, LINEAGE_BLEED_ID), 150), 'one tick spent, three still owed');
    hit(player, target, 200);
    const after = owed(target, LINEAGE_BLEED_ID);
    assert(after >= 349 && after <= 352, `the ${composed ? 'composed' : 'legacy'} payload adds: 150 still owed + 200, got ${after}`);
    world.takeNodeEvents(NODE);
  }
}

// ══ C. THE APPRENTICE — DoT potency still feeds its DoT ════════════════════════

{
  const player = wielderT2('lean-afl-apprentice', 'flash-rapier', 'gale-needle', 'rapier', ['rapier-t2-affliction-stat'], 'dot-root');
  assert(player.appliesDots !== undefined, 'a real Apprentice');
  const potency = leanValue(player, 'rapier', 'rapier-t2-affliction-stat');
  const base = dotClassProfileForSubVariant(player.usesSkills.selectedSubVariant).dotMechanicMultiplier;
  const mult = player.usesSkills.passives['dot.mechanic-mult'] ?? 0;
  assert(potency > 0 && near(mult, base + potency), `DoT potency adds +${potency} onto the root's ${base}, got ${mult}`);
  assert(near(player.usesSkills.passives['shared.bleed-on-hit-pct'] ?? 0, potency),
    'and the same stat bleeds its hit: the two halves partition the DoT root\'s damage');

  // On a weapon that owns a reservoir (design §26.2) the lean is that reservoir's
  // potency, and seeds no second record.
  // The Dagger's T1 Effect lean is that potency (design §26.1).
  const dagger = wielder('lean-afl-dagger', 'ashbrand-blade', 'dagger', ['dagger-t1-effect'], 'dot-root');
  const effect = leanValue(dagger, 'dagger', 'dagger-t1-effect');
  const daggerBase = dotClassProfileForSubVariant(dagger.usesSkills.selectedSubVariant).dotMechanicMultiplier;
  const daggerMult = dagger.usesSkills.passives['dot.mechanic-mult'] ?? 0;
  assert(effect > 0 && near(daggerMult, daggerBase + effect), `on the Dagger too, DoT potency feeds the class DoT, got ${daggerMult}`);
  assert(near(dagger.usesSkills.passives['weapon.reservoir-potency-pct'] ?? 0, effect), 'and the reservoir banks that much more');
  assert((dagger.usesSkills.passives['shared.bleed-on-hit-pct'] ?? 0) === 0, 'and no light bleed is seeded');
}

Date.now = realNow;
console.log('leanConditions: ok');
