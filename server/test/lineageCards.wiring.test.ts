/**
 * The lineage card runtime, wired (progression rework Phase 1c).
 *
 * WHAT THIS PINS. Not balance — every magnitude here is fabricated, because the
 * real ones come from the magnitude table and move with every tuning pass. What it
 * pins is that the vocabulary is CONNECTED:
 *
 *   - one active card per trigger kind fires on the event it names;
 *   - each payoff reaches the hook it claims (a status is present, a flag is set,
 *     HP moved, a window is readable);
 *   - an evade that blocks debuffs blocks every on-target payoff;
 *   - exactly ONE `card-fx` per application, and none at all for a payoff that
 *     refused — a card must never draw an effect that says it did something.
 *
 * The cards are seeded straight onto the runtime cache rather than bought through
 * the economy. That is deliberate: the T1 band only authors four of the ten
 * triggers (design §6 is the vocabulary the runtime owes, not the vocabulary T1
 * happens to spend), and `lineageEconomy.test.ts` already covers the buying path.
 *
 * Run: node --conditions=development --import tsx test/lineageCards.wiring.test.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ABILITY_DATABASE,
  ABILITY_NODE_DATABASE,
  ABILITY_SLOW_EFFECT_ID,
  GAME_CONFIG,
  LINEAGE_DATABASE,
  PACKET_DEFINITIONS,
  PAYOFF_KINDS,
  applyStatusEffect,
  baseRecoveryForTier,
  emptyEquipment,
  getCooldown,
  getStatusEffect,
  lineageStatusEffectId,
  setCooldown,
  setLineageRuntime,
  type CombatEvent,
  type LineageFxKey,
  type LineagePayoff,
  type LineageTrigger,
  type PacketId,
  type PayoffKind,
  type ResolvedLineageCapstone,
  type ResolvedLineageCard,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import {
  emitCombatEvent, type CombatContext,
} from '../src/systems/combat/engine/combatPipeline';
import { emitMechanicFired } from '../src/systems/combat/engine/mechanicFired';
import { LINEAGE_BLEED_ID, LINEAGE_POISON_ID } from '../src/systems/combat/damage/bleedIds';
import {
  lineagePlatingStackFraction, onLineageGuardCast, updateLineageCards,
} from '../src/systems/combat/lineageCards';
import { onTechniqueResolved } from '../src/systems/combat/techniqueResolved';
import {
  beginAbilityCast, updateAbilityCasts,
} from '../src/systems/player/abilities/abilityCasting';
import { abilityCooldownKey } from '../src/systems/player/abilities/abilityCooldowns';
import { attackHasteBonus } from '../src/systems/combat/engine/attackCadence';
import { runMonsterAttack } from '../src/systems/combat/engine/combat';
import { activeRecoveryFraction } from '../src/systems/defense/regen/recovery';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';

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

let nextId = 0;

/** A resolved card with the numbers a real one would carry, minus the table. */
function seededCard(opts: {
  trigger: LineageTrigger;
  payoff: LineagePayoff;
  fx?: LineageFxKey;
  lane?: PacketId;
}): ResolvedLineageCard {
  const lane = opts.lane ?? 'tempo';
  return {
    card: {
      id: `seed-card-${++nextId}`,
      lineageId: 'rapier', tier: 1, row: 'payoff', lane,
      name: 'Seeded', description: '',
      fx: opts.fx ?? 'tempo.ghost-strike',
      trigger: opts.trigger.kind, payoff: opts.payoff.kind,
    },
    requiredBiomeGroup: 'forest',
    requiredBiomeLevel: 1,
    requiredGlobalMastery: 0,
    cost: { essence: {}, shards: {} },
    trigger: opts.trigger,
    payoff: opts.payoff,
  };
}

function seededCapstone(opts: {
  trigger: LineageTrigger;
  payoff: LineagePayoff;
  fx: LineageFxKey;
}): ResolvedLineageCapstone {
  return {
    capstone: {
      id: `seed-capstone-${++nextId}`,
      name: 'Seeded Crown', description: '',
      fx: opts.fx, lane: 'tempo',
      trigger: opts.trigger.kind, payoff: opts.payoff.kind,
    },
    form: { recipeId: 'gale-needle', tier: 2, biome: 'forest' },
    trigger: opts.trigger,
    payoff: opts.payoff,
  };
}

/** A player carrying exactly the seeded cards, and nothing else. */
function spawn(
  id: string,
  cards: ResolvedLineageCard[],
  capstones: ResolvedLineageCapstone[] = [],
): PlayerEntity {
  const player = world.attachPlayerEntity(makeSlices(id), id);
  player.dealsDamage.attack = 100;
  setLineageRuntime(player.tracksCombat, { cards, capstones });
  world.takeNodeEvents(NODE);
  return player;
}

function monster(x: number): MonsterEntity {
  const m = world.createMonster(NODE, 'plains-slime', { x, y: 400 });
  if (!m) throw new Error('failed to spawn a target');
  m.hasHealth.maxHp = 100_000;
  m.hasHealth.hp = 100_000;
  return m;
}

function hit(
  player: PlayerEntity,
  defender: MonsterEntity,
  metadata: Record<string, unknown> = {},
  damage = 200,
): CombatContext {
  const ctx = {
    attacker: player, attackerType: 'player',
    defender, defenderType: 'monster',
    damage, platingMult: 1, drPierce: 0, cancelled: false, metadata,
  } as unknown as CombatContext;
  emitCombatEvent('onHit', ctx, world);
  return ctx;
}

function taken(
  player: PlayerEntity,
  attacker: MonsterEntity,
  metadata: Record<string, unknown> = {},
  damage = 50,
): CombatContext {
  const ctx = {
    attacker, attackerType: 'monster',
    defender: player, defenderType: 'player',
    damage, platingMult: 1, drPierce: 0, cancelled: false, metadata,
  } as unknown as CombatContext;
  emitCombatEvent('onDamageTaken', ctx, world);
  return ctx;
}

/** Drain the node and keep only the card effects. */
function cardFx(): Array<Extract<CombatEvent, { kind: 'card-fx' }>> {
  return world.takeNodeEvents(NODE)
    .filter((e): e is Extract<CombatEvent, { kind: 'card-fx' }> => e.kind === 'card-fx');
}

// ── A player with no tree costs nothing and draws nothing ─────────────────────

{
  const player = world.attachPlayerEntity(makeSlices('lc-bare'), 'lc-bare');
  const target = monster(460);
  hit(player, target);
  taken(player, target);
  updateLineageCards(world, 100);
  assert(cardFx().length === 0, 'a player with no lineage cards draws no card effects');
}

// ── hit-nth: every nth landed hit, and echo-hit reaches the proc seam ─────────

{
  const player = spawn('lc-nth', [seededCard({
    trigger: { kind: 'hit-nth', n: 2 },
    payoff: { kind: 'echo-hit', magnitude: 0.5 },
  })]);
  const target = monster(480);

  hit(player, target);
  assert(cardFx().length === 0, 'an interval of 2 must not fire on the first hit');

  const before = target.hasHealth.hp;
  hit(player, target);
  const events = cardFx();
  assert(events.length === 1, `the second hit should fire exactly once, got ${events.length}`);
  assert(events[0].targetId === target.isMonster.id, 'an on-target effect names its target');
  assert(events[0].targetPos !== undefined, 'an on-target effect carries the target position');
  assert(events[0].pos.x === player.hasPosition.current.x, 'the effect is anchored on the player');
  assert(target.hasHealth.hp < before, 'echo-hit should have dealt damage through the proc seam');

  hit(player, target);
  assert(cardFx().length === 0, 'the counter should have reset');
  hit(player, target);
  assert(cardFx().length === 1, 'the interval should keep its cadence');
}

// ── one multiplier per hit: the echo scales the PRE-empowered hit ─────────────

{
  const player = spawn('lc-echo-basis', [seededCard({
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'echo-hit', magnitude: 1 },
  })]);
  const plain = monster(500);
  const plainBefore = plain.hasHealth.hp;
  hit(player, plain, {}, 200);
  const plainEcho = plainBefore - plain.hasHealth.hp;
  cardFx();

  const empowered = monster(505);
  const empBefore = empowered.hasHealth.hp;
  // The same 200 damage, but the empowered multiplier already took it there.
  hit(player, empowered, { empoweredMultiplier: 2 }, 200);
  const empEcho = empBefore - empowered.hasHealth.hp;
  cardFx();
  assert(
    empEcho < plainEcho,
    `an echo on an empowered hit must scale the hit as it was BEFORE the multiplier`
      + ` (plain ${plainEcho}, empowered ${empEcho})`,
  );
}

// ── evade blocks every on-target payoff ──────────────────────────────────────

{
  const player = spawn('lc-evade-block', [
    seededCard({
      trigger: { kind: 'hit-nth', n: 1 },
      payoff: { kind: 'vulnerability', magnitude: 0.3, durationMs: 4000 },
      fx: 'empowered.weak-point', lane: 'empowered',
    }),
    seededCard({
      trigger: { kind: 'hit-nth', n: 1 },
      payoff: { kind: 'hemorrhage', magnitude: 0.4, durationMs: 4000 },
      fx: 'affliction.bleed-pips', lane: 'affliction',
    }),
  ]);
  const target = monster(520);

  hit(player, target, { evadeBlocksDebuffs: true });
  assert(
    getStatusEffect(target.tracksCombat, 'vulnerability') === undefined,
    'a blocking evade must apply no vulnerability',
  );
  assert(
    getStatusEffect(target.tracksCombat, 'cadence-hemorrhage') === undefined,
    'a blocking evade must apply no bleed',
  );
  assert(cardFx().length === 0, 'a blocked payoff must draw no effect');

  // The same two cards land on an ordinary hit, so the block above was the evade
  // and not the wiring.
  hit(player, target);
  assert(
    getStatusEffect(target.tracksCombat, 'vulnerability') !== undefined,
    'vulnerability should reach the monster debuff seam',
  );
  // Its own id (design §18.1), ticked by the same driver as the cadence root's.
  const bleed = getStatusEffect(target.tracksCombat, LINEAGE_BLEED_ID);
  assert(bleed !== undefined, 'hemorrhage should apply the lineage bleed');
  assert(
    getStatusEffect(target.tracksCombat, 'cadence-hemorrhage') === undefined,
    "a card bleed must not write the cadence root's record",
  );
  assert((bleed?.data.damagePerTick ?? 0) > 0, 'a bleed with no per-tick damage is not a bleed');
  assert(target.hasHemorrhage !== undefined, 'the bleed marker drives the tick loop');
  assert(cardFx().length === 2, 'two cards firing is two effects, one per application');
}

// ── mechanic-fired: plating-shred, and the capstone rides the same dispatch ───

{
  const player = spawn(
    'lc-mechanic',
    [seededCard({
      trigger: { kind: 'mechanic-fired' },
      payoff: { kind: 'plating-shred', magnitude: 0.5, durationMs: 4000 },
      fx: 'empowered.plating-crack', lane: 'empowered',
    })],
    [seededCapstone({
      trigger: { kind: 'mechanic-fired' },
      payoff: { kind: 'stun', magnitude: 1, durationMs: 750 },
      fx: 'empowered.quake-ring',
    })],
  );
  const target = monster(540);
  target.mitigatesDamage.plating = 40;

  const ctx = hit(player, target);
  emitMechanicFired(world, player, ctx);

  const shred = getStatusEffect(target.tracksCombat, 'plating-shred');
  assert(shred !== undefined, 'plating-shred should reach the effective-plating seam');
  assert(
    (shred?.data.platingReduction ?? 0) > 0,
    'a fraction of the target plating should resolve to a flat reduction',
  );
  assert(
    getStatusEffect(target.tracksCombat, 'stunned') !== undefined,
    'the capstone stun should reach the control ladder',
  );

  const events = cardFx();
  assert(events.length === 2, `one effect per application, got ${events.length}`);
  assert(
    events.some((e) => e.fx === 'empowered.plating-crack'),
    "the card's own fx key should be drawn",
  );
  assert(
    events.some((e) => e.fx === 'empowered.quake-ring'),
    "the capstone's own fx key should be drawn",
  );
}

// ── first-hit: the opening of an engagement, and damage-window reads back ─────

{
  const player = spawn('lc-first', [seededCard({
    trigger: { kind: 'first-hit' },
    payoff: { kind: 'damage-window', magnitude: 0.5, durationMs: 2000 },
    fx: 'engagement.opening-flash', lane: 'engagement',
  })]);
  const target = monster(560);

  const opener = hit(player, target, {}, 100);
  assert(cardFx().length === 1, 'the opening hit should fire once');
  const window = getStatusEffect(player.tracksCombat, lineageStatusEffectId('damage-window'));
  assert(window !== undefined, 'a timed payoff is carried as its own status effect');
  assert(window?.data.totalMs === 2000, 'the clock needs totalMs');
  assert(window?.data.magnitude === 0.5, 'the reader needs the magnitude');

  // The window was applied DURING the opener, so the opener itself may or may not
  // already carry it depending on listener order; what matters is the next hit.
  void opener;
  const next = hit(player, target, {}, 100);
  assert(next.damage > 100, `the window should scale the hit, got ${next.damage}`);
  assert(
    Number(next.metadata['empoweredMultiplier'] ?? 1) > 1,
    'damage-window folds itself into empoweredMultiplier, never a second multiplier',
  );
  assert(cardFx().length === 0, 'first-hit must not fire again inside the same engagement');
}

// ── kill: speed-window reaches the one attack-haste seam ─────────────────────

{
  const player = spawn('lc-kill', [seededCard({
    trigger: { kind: 'kill' },
    payoff: { kind: 'speed-window', magnitude: 0.4, durationMs: 2500 },
    fx: 'kill-chain.kill-pulse', lane: 'kill-chain',
  })]);
  const victim = monster(580);

  assert(attackHasteBonus(player.tracksCombat) === 0, 'no haste before the kill');
  emitCombatEvent('onKill', {
    attacker: player, attackerType: 'player',
    defender: victim, defenderType: 'monster',
    damage: 999, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext, world);

  assert(cardFx().length === 1, 'a kill should fire once');
  assert(
    attackHasteBonus(player.tracksCombat) === 0.4,
    `speed-window should sum into attackHasteBonus, got ${attackHasteBonus(player.tracksCombat)}`,
  );
}

// ── guard-cast: evasion-window reaches the player evade seam ────────────────
// Design §6 (added 2026-10-01): "applied through the evasion stat the way
// speed-window touches speed." The fixture carries no base `evadesHits`
// component at all, so a dodge here can only have come from the window's own
// accumulator (`defense/mitigation/evasion.ts`'s `rollEvadeWindowAccumulator`),
// not the gear-derived one `evasion.test.ts` already pins.

{
  const player = spawn('lc-evasion-window', [seededCard({
    trigger: { kind: 'guard-cast' },
    payoff: { kind: 'evasion-window', magnitude: 1, durationMs: 3000 },
    fx: 'engagement.brace-sparks', lane: 'engagement',
  })]);
  const attacker = monster(700);
  assert(player.evadesHits === undefined, 'the fixture carries no base evasion');

  const baselineBefore = player.hasHealth.hp;
  runMonsterAttack(world, attacker, player, 1_000);
  const baselineDamage = baselineBefore - player.hasHealth.hp;
  assert(baselineDamage > 0, 'an unguarded hit should land in full');
  cardFx();

  onLineageGuardCast(world, player);
  assert(cardFx().length === 1, 'a Guard cast should fire once');
  const window = getStatusEffect(player.tracksCombat, lineageStatusEffectId('evasion-window'));
  assert(window !== undefined, 'a timed payoff is carried as its own status effect');
  assert(window?.data.totalMs === 3000, 'the clock needs totalMs');
  assert(window?.data.magnitude === 1, 'the reader needs the magnitude');

  const windowedBefore = player.hasHealth.hp;
  runMonsterAttack(world, attacker, player, 2_000);
  const windowedDamage = windowedBefore - player.hasHealth.hp;
  assert(
    windowedDamage < baselineDamage,
    `a magnitude-1 evasion window should mitigate the next hit, got ${windowedDamage} vs unguarded ${baselineDamage}`,
  );
}

// ── evade: the trigger, and slow reaching the control ladder ─────────────────

{
  const player = spawn('lc-evade', [seededCard({
    trigger: { kind: 'evade' },
    payoff: { kind: 'slow', magnitude: 0.3, durationMs: 2500 },
    fx: 'control.frost-drag', lane: 'control',
  })]);
  const attacker = monster(600);

  taken(player, attacker, {});
  assert(cardFx().length === 0, 'an ordinary hit taken is not an evade');

  // A hit with no successful roll at all is what the trigger must refuse. The
  // metadata flag is the roll, so an absent flag is no evade however the hit was
  // mitigated.
  taken(player, attacker, { evadeMitigation: 1 });
  assert(cardFx().length === 0, 'mitigation without a successful roll is not an evade');
  assert(
    getStatusEffect(attacker.tracksCombat, ABILITY_SLOW_EFFECT_ID) === undefined,
    'and so it must not have paid out its payoff either',
  );

  // A GRAZE is the dodge this game ships: `EVADE_MITIGATION_BASE` is 0.5 and the
  // best authored sources add +0.1 and +0.3, so `evadeMitigation >= 1` is
  // unreachable in authored content. Gating the card on a FULL avoid made every
  // `evade` card inert, which is why the trigger reads the successful roll and
  // leaves full-dodge-only to `evadeBlocksDebuffs`. Firing alongside `hit-taken`
  // is correct here — a grazed hit did land.
  taken(player, attacker, { evaded: true, evadeMitigation: 0.5 });
  assert(cardFx().length === 1, 'a successful dodge roll should fire, graze or not');
  const slow = getStatusEffect(attacker.tracksCombat, ABILITY_SLOW_EFFECT_ID);
  assert(slow !== undefined, 'slow should reach the monster control ladder');
  assert((slow?.data.totalMs ?? 0) > 0, 'a slow must store totalMs for the buff clock');
}

// ── hit-taken: ward reaches the absorb pool ─────────────────────────────────

{
  const player = spawn('lc-taken', [seededCard({
    trigger: { kind: 'hit-taken' },
    payoff: { kind: 'ward', magnitude: 0.2, durationMs: 5000 },
    fx: 'engagement.brace-sparks', lane: 'engagement',
  })]);
  const attacker = monster(620);

  // A scratch, deliberately: the ward is applied and the absorb listeners drain it
  // inside the SAME exchange, so a full-size hit would leave nothing to look at.
  taken(player, attacker, {}, 1);
  assert(cardFx().length === 1, 'a direct hit taken should fire once');
  assert(player.holdsWards !== undefined, 'ward should reach the ward pool');
  assert((player.holdsWards?.wards[0]?.maxAmount ?? 0) > 0, 'an empty ward is not a ward');

  taken(player, attacker, { isDot: true });
  assert(cardFx().length === 0, 'a DoT tick is not a direct hit taken');
}

// ── guard-cast: recovery-window activates a fraction of the one rate ─────────

{
  const player = spawn('lc-guard', [seededCard({
    trigger: { kind: 'guard-cast' },
    payoff: { kind: 'recovery-window', magnitude: 0.5, durationMs: 3000 },
    fx: 'kill-chain.steel-vigil', lane: 'kill-chain',
  })]);

  assert(activeRecoveryFraction(player, true) === 0, 'no Recovery access before the Guard');
  onLineageGuardCast(world, player);
  assert(cardFx().length === 1, 'a Guard cast should fire once');
  assert(
    activeRecoveryFraction(player, true) === 0.5,
    `recovery-window should switch on its fraction, got ${activeRecoveryFraction(player, true)}`,
  );
  assert(
    getStatusEffect(player.tracksCombat, lineageStatusEffectId('recovery-window')) !== undefined,
    'the window also carries its own clock',
  );
}

// ── technique-cast: the two Technique payoffs (design §22) ───────────────────
//
// The trigger is not a listener — it is a call the one Technique resolution seam
// makes — so what is pinned here is that the seam reaches the cards, exactly once
// per cast, never from a Guard, and that each payoff lands on the hook it claims.

const SWEEP = ABILITY_DATABASE.get('sweep')!;
const SECOND_WIND = ABILITY_DATABASE.get('second-wind')!;
assert(SWEEP?.slot === 'technique', 'fixture: Sweep is a Technique');
assert(SECOND_WIND?.slot === 'guard', 'fixture: Second Wind is a Guard');

/** A player with Sweep attuned and its cooldown part-run. */
function withSweepOnCooldown(
  id: string,
  cards: ResolvedLineageCard[],
  remainingMs = 4000,
): PlayerEntity {
  const player = spawn(id, cards);
  player.tracksProgression.attunedAbilities.techniques = ['sweep'];
  setCooldown(player.tracksCombat, abilityCooldownKey('sweep'), remainingMs);
  return player;
}

{
  // `technique-refund` takes its share off what is LEFT of each attuned
  // Technique's cooldown — the lane pays in readiness, not in damage.
  const player = withSweepOnCooldown('lc-tech-refund', [seededCard({
    trigger: { kind: 'technique-cast' },
    payoff: { kind: 'technique-refund', magnitude: 0.25 },
    fx: 'technique.cast-flare', lane: 'technique',
  })]);

  onTechniqueResolved(world, player, SWEEP);
  assert(cardFx().length === 1, 'a resolved Technique should fire once');
  const left = getCooldown(player.tracksCombat, abilityCooldownKey('sweep'));
  assert(
    Math.abs(left - 3000) < 1,
    `a quarter should come off what is left of 4000ms, got ${left}`,
  );

  // Once per cast, not once per pull.
  onTechniqueResolved(world, player, SWEEP);
  assert(cardFx().length === 1, 'each cast that resolves fires again');
  assert(
    Math.abs(getCooldown(player.tracksCombat, abilityCooldownKey('sweep')) - 2250) < 1,
    'and takes its share off the new remainder',
  );
}

{
  // Nothing on cooldown is nothing refunded, so the card draws no effect saying
  // it did something.
  const player = withSweepOnCooldown('lc-tech-refund-ready', [seededCard({
    trigger: { kind: 'technique-cast' },
    payoff: { kind: 'technique-refund', magnitude: 0.25 },
    fx: 'technique.cast-flare', lane: 'technique',
  })], 0);
  onTechniqueResolved(world, player, SWEEP);
  assert(cardFx().length === 0, 'a refund with nothing to refund draws nothing');
}

{
  // NEVER from a Guard. A Guard has `guard-cast`; firing an offensive lane off a
  // defensive cast would be defence scaling offence (design-bible §1).
  const player = withSweepOnCooldown('lc-tech-guard', [seededCard({
    trigger: { kind: 'technique-cast' },
    payoff: { kind: 'technique-refund', magnitude: 0.25 },
    fx: 'technique.cast-flare', lane: 'technique',
  })]);
  onTechniqueResolved(world, player, SECOND_WIND);
  assert(cardFx().length === 0, 'a Guard never fires technique-cast');
  assert(
    getCooldown(player.tracksCombat, abilityCooldownKey('sweep')) === 4000,
    'and refunds nothing',
  );
  // The Guard's own seam still works, and still does not reach this trigger.
  onLineageGuardCast(world, player);
  assert(cardFx().length === 0, 'and guard-cast does not reach a technique-cast card');
}

{
  // THE ORDER OF THE SEAM, through the real cast path rather than a direct call.
  //
  // `technique-refund` takes its share off what is LEFT of a cooldown, so the
  // resolution has to run AFTER the firing ability's own cooldown is charged. The
  // three non-`armed` shapes resolved first, which meant the cast's own cooldown
  // was still zero when the card read it: Slam, Snipe, Stunning Strike, Detonate
  // and the Broadsword's `Set and Reset` refunded nothing at all, while the armed
  // shapes — the ones the bench's reference wiring attunes — worked, so nothing
  // measured it. Driven here through `beginAbilityCast` + `updateAbilityCasts` so
  // the ordering is what is under test, not the helper.
  const CAST = ABILITY_DATABASE.get('power-strike');
  assert(CAST?.shape === 'cast', 'power-strike should be the cast-shape Technique');
  const player = spawn('lc-tech-refund-cast', [seededCard({
    trigger: { kind: 'technique-cast' },
    payoff: { kind: 'technique-refund', magnitude: 0.25 },
    fx: 'technique.cast-flare', lane: 'technique',
  })]);
  player.tracksProgression.attunedAbilities.techniques = ['power-strike'];
  const target = monster(560);
  setAttackTarget(world, player, target.isMonster.id);

  assert(beginAbilityCast(world, player, CAST!, 1_000), 'the cast should begin');
  updateAbilityCasts(world, 1_000 + 60_000); // well past the wind-up

  assert(cardFx().length === 1, 'a resolved cast Technique should fire the card once');
  const left = getCooldown(player.tracksCombat, abilityCooldownKey('power-strike'));
  assert(left > 0, 'the cast should be on cooldown after it resolves');
  const full = CAST!.ranks[0]!.cooldownMs;
  assert(
    left < full,
    `the refund should have come off the cast's own cooldown: ${left} vs a full ${full}`,
  );
  assert(
    Math.abs(left - full * 0.75) < full * 0.02,
    `a quarter of ${full}ms should be gone, got ${left}`,
  );
}

{
  // `technique-window` from a `technique-cast` card: the trigger reaches the
  // payoff and the window carries its own clock, which is the HUD tile's feed.
  const player = withSweepOnCooldown('lc-tech-window', [seededCard({
    trigger: { kind: 'technique-cast' },
    payoff: { kind: 'technique-window', magnitude: 0.5, durationMs: 4000 },
    fx: 'technique.cast-flare', lane: 'technique',
  })]);
  onTechniqueResolved(world, player, SWEEP);
  assert(cardFx().length === 1, 'the window opens once per cast');
  const opened = getStatusEffect(player.tracksCombat, lineageStatusEffectId('technique-window'));
  assert(opened !== undefined && opened.remainingMs > 0, 'the window carries its own clock');
  assert((opened?.data.magnitude ?? 0) === 0.5, 'and the magnitude the reader multiplies by');
}

/**
 * A window OPENED by a Guard, so the Technique resolution that spends it has no
 * card of its own to re-open it. Isolating the two halves is the only way to see
 * the spend: a `technique-cast` window card closes and immediately re-opens its own
 * window on the same cast, which is correct and unobservable.
 */
function withWindowFromGuard(id: string): PlayerEntity {
  const player = withSweepOnCooldown(id, [seededCard({
    trigger: { kind: 'guard-cast' },
    payoff: { kind: 'technique-window', magnitude: 0.5, durationMs: 4000 },
    fx: 'technique.cast-flare', lane: 'technique',
  })]);
  onLineageGuardCast(world, player);
  cardFx();
  return player;
}

{
  // The next Technique to ride an exchange spends it, folded into
  // `empoweredMultiplier` — one multiplier per hit (design §6), never a second
  // multiplicative layer and never a second metadata key.
  const player = withWindowFromGuard('lc-tech-window-spend');
  const target = monster(720);

  const ctx = hit(player, target, {}, 200);
  // A plain hit neither opens nor spends it: only a resolution does.
  cardFx();
  assert(ctx.metadata['empoweredMultiplier'] === undefined, 'a plain hit does not spend the window');
  const before = ctx.damage;

  onTechniqueResolved(world, player, SWEEP, { ctx, target });
  assert(
    ctx.damage === Math.floor(before * 1.5),
    `the window should scale the landing Technique's hit, ${before} -> ${ctx.damage}`,
  );
  assert(
    Number(ctx.metadata['empoweredMultiplier'] ?? 1) === 1.5,
    'through empoweredMultiplier, which is the ONE multiplier slot',
  );
  const spent = getStatusEffect(player.tracksCombat, lineageStatusEffectId('technique-window'));
  assert(
    spent === undefined || spent.remainingMs === 0,
    'and the window closes — it empowers the NEXT Technique, once',
  );

  // A second Technique gets nothing: the window was spent, not merely read.
  const second = hit(player, target, {}, 200);
  cardFx();
  const secondBefore = second.damage;
  onTechniqueResolved(world, player, SWEEP, { ctx: second, target });
  assert(
    second.damage === secondBefore,
    'a spent window empowers nothing',
  );
}

{
  // A resolution with no exchange has no hit to empower, so the window waits
  // rather than being silently eaten.
  const player = withWindowFromGuard('lc-tech-window-nohit');
  onTechniqueResolved(world, player, SWEEP);
  const held = getStatusEffect(player.tracksCombat, lineageStatusEffectId('technique-window'));
  assert(
    held !== undefined && held.remainingMs > 0,
    'a self-facing resolution leaves the window standing for a hit that can use it',
  );
}

// ── barrier-break: cleanse, and a refused payoff draws nothing ───────────────

{
  const player = spawn('lc-break', [seededCard({
    trigger: { kind: 'barrier-break' },
    payoff: { kind: 'cleanse', magnitude: 1 },
    fx: 'engagement.brace-sparks', lane: 'engagement',
  })]);
  const attacker = monster(640);

  taken(player, attacker, { barrierEmptied: true });
  assert(
    cardFx().length === 0,
    'a cleanse with nothing to strip did nothing, so it must draw nothing',
  );

  applyStatusEffect(player.tracksCombat, {
    id: 'antiheal', maxStacks: 1, remainingMs: 5000, refreshable: true,
    sourceId: attacker.isMonster.id, data: { totalMs: 5000 },
  });
  taken(player, attacker, { barrierEmptied: true });
  assert(
    getStatusEffect(player.tracksCombat, 'antiheal') === undefined,
    'cleanse should strip a harmful, cleanseable effect',
  );
  assert(cardFx().length === 1, 'a cleanse that worked draws exactly one effect');
}

// ── standing and pulse: the two clock-driven triggers ────────────────────────

{
  const player = spawn('lc-clock', [
    seededCard({
      trigger: { kind: 'standing' },
      payoff: { kind: 'engagement-dr', magnitude: 0.4, durationMs: 3000 },
      fx: 'engagement.brace-sparks', lane: 'engagement',
    }),
    seededCard({
      trigger: { kind: 'pulse' },
      payoff: { kind: 'plating-stack', magnitude: 0.5, durationMs: 4000 },
      fx: 'engagement.trail', lane: 'engagement',
    }),
  ]);
  player.mitigatesDamage.plating = 20;
  const target = monster(660);
  setAttackTarget(world, player, target.isMonster.id);

  // One short tick: the pulse is due immediately, standing is not.
  updateLineageCards(world, 100);
  let events = cardFx();
  assert(events.length === 1, `only the pulse is due on the first tick, got ${events.length}`);
  assert(events[0].fx === 'engagement.trail', 'the pulse card drew its own effect');
  assert(
    lineagePlatingStackFraction(player.tracksCombat) > 0,
    'plating-stack should carry its per-stack fraction for reactive plating to resolve',
  );

  // Long enough to have been holding still.
  updateLineageCards(world, 2_000);
  events = cardFx();
  assert(events.length === 1, `standing should fire once it has been held, got ${events.length}`);
  assert(events[0].fx === 'engagement.brace-sparks', 'the standing card drew its own effect');

  const dr = getStatusEffect(player.tracksCombat, lineageStatusEffectId('engagement-dr'));
  assert(dr !== undefined, 'engagement-dr is carried as its own window');
  const incoming = taken(player, target, {}, 100);
  assert(incoming.damage < 100, `the opening window should reduce the hit, got ${incoming.damage}`);
  cardFx();

  // Still standing, still in combat: neither trigger may spam while its own window
  // is live.
  updateLineageCards(world, 100);
  assert(cardFx().length === 0, 'neither clock-driven trigger may fire every tick');
}

// ── poison-stack and contagion reach the DoT inventory ──────────────────────

{
  const player = spawn('lc-affliction', [seededCard({
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'poison-stack', magnitude: 0.3, durationMs: 5000 },
    fx: 'affliction.venom-pips', lane: 'affliction',
  })]);
  const target = monster(680);

  hit(player, target);
  const stack = getStatusEffect(target.tracksCombat, LINEAGE_POISON_ID);
  assert(stack !== undefined, 'poison-stack should apply the lineage poison');
  assert(
    getStatusEffect(target.tracksCombat, 'dot') === undefined,
    "a card poison must not write the player's class DoT record",
  );
  assert((stack?.data.damagePerTick ?? 0) > 0, 'a stack with no damage is not a stack');
  const events = cardFx();
  assert(events.length === 1, 'one stack applied is one effect');
  assert(events[0].stacks === stack?.stacks, 'a counting payoff reports its stack count');

  // A neighbour within reach receives a share of what the first target carries.
  const neighbour = world.createMonster(NODE, 'plains-slime', {
    x: target.hasPosition.current.x + 20, y: target.hasPosition.current.y,
  });
  assert(neighbour !== null, 'failed to spawn a contagion neighbour');
  setLineageRuntime(player.tracksCombat, {
    cards: [seededCard({
      trigger: { kind: 'kill' },
      payoff: { kind: 'contagion', magnitude: 0.5, durationMs: 4000 },
      fx: 'kill-chain.spread-arc', lane: 'kill-chain',
    })],
    capstones: [],
  });
  world.takeNodeEvents(NODE);
  // The monster is DEAD when onKill fires. Firing this with a live target is
  // what let a broken contagion guard pass: the payoff reads the corpse it
  // spreads off, so the corpse must be a corpse here too.
  target.hasHealth.hp = 0;
  emitCombatEvent('onKill', {
    attacker: player, attackerType: 'player',
    defender: target, defenderType: 'monster',
    damage: 1, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext, world);
  assert(
    getStatusEffect(neighbour!.tracksCombat, LINEAGE_POISON_ID) !== undefined,
    'contagion should copy the affliction onto a neighbour',
  );
  const spread = cardFx();
  assert(spread.length === 1, `contagion draws exactly one effect, got ${spread.length}`);
  assert(spread[0].targetId === neighbour!.isMonster.id, 'the spread names where it landed');
}

// ── What an amplifier's fold leaves for the runtime to honour ────────────────
//
// `composeAmplifiers` (shared) never emits an amplifier as a card of its own; it
// moves the modified payoff's numbers, and on two of its four axes it leaves
// something the RUNTIME has to act on. `lineageAmplifiers.test.ts` proves the fold
// itself; these two prove the runtime does not ignore what it produced, which is
// the half that decides whether 53 of the 60 shipped amplifiers do anything.

// `trigger`: the SAME payoff fires on the amplifier's moment as well as its own.
{
  const base = seededCard({
    trigger: { kind: 'hit-taken' },
    payoff: { kind: 'speed-window', magnitude: 0.2, durationMs: 2000 },
  });
  const control = spawn('lc-amp-trigger-control', [base]);
  const victim = monster(560);
  taken(control, victim);
  assert(cardFx().length === 1, 'the control fires on its own trigger');
  hit(control, victim);
  assert(
    cardFx().length === 0,
    'and NOT on another kind — otherwise the next assertion proves nothing',
  );

  const amped = seededCard({
    trigger: { kind: 'hit-taken' },
    payoff: { kind: 'speed-window', magnitude: 0.2, durationMs: 2000 },
  });
  // Exactly what an active `trigger`-axis amplifier leaves behind.
  amped.extraTriggers = [{ kind: 'hit-nth', n: 1 }];
  const player = spawn('lc-amp-trigger', [amped]);
  const target = monster(600);

  taken(player, target);
  assert(cardFx().length === 1, 'the base trigger must still fire');
  hit(player, target);
  assert(
    cardFx().length === 1,
    'the added moment must fire the SAME payoff, or a `trigger` amplifier does nothing',
  );
}

// `trigger` naming the trigger it already fires on: `first-hit` re-scopes from
// once per ENGAGEMENT to once per BODY (Rapier's Fresh Opening).
{
  const control = seededCard({
    trigger: { kind: 'first-hit' },
    payoff: { kind: 'damage-window', magnitude: 0.2, durationMs: 2000 },
    fx: 'engagement.opening-flash',
    lane: 'engagement',
  });
  const plain = spawn('lc-amp-opener-control', [control]);
  const a = monster(720);
  const b = monster(760);
  hit(plain, a);
  assert(cardFx().length === 1, 'the opener fires on the first body of an engagement');
  hit(plain, b);
  assert(
    cardFx().length === 0,
    'and NOT again on a second body — the latch is per engagement, which is the baseline this amplifier changes',
  );

  const amped = seededCard({
    trigger: { kind: 'first-hit' },
    payoff: { kind: 'damage-window', magnitude: 0.2, durationMs: 2000 },
    fx: 'engagement.opening-flash',
    lane: 'engagement',
  });
  // What `composeAmplifiers` leaves when the amplifier names `first-hit` itself.
  amped.perTargetTrigger = true;
  const duellist = spawn('lc-amp-opener', [amped]);
  const c = monster(800);
  const d = monster(840);
  hit(duellist, c);
  assert(cardFx().length === 1, 'the per-body opener still fires on the first body');
  hit(duellist, d);
  assert(
    cardFx().length === 1,
    'every new body counts as a fresh opening hit — the whole content of Fresh Opening',
  );
  hit(duellist, c);
  assert(
    cardFx().length === 0,
    'but a body already opened on does not re-open, or it would be an every-hit card',
  );
}

// `targets`: an on-target payoff also lands on a nearby body.
{
  const card = seededCard({
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'poison-stack', magnitude: 0.3, durationMs: 4000, extraTargets: 1 },
    fx: 'affliction.bleed-pips',
    lane: 'affliction',
  });
  const player = spawn('lc-amp-targets', [card]);
  const target = monster(660);
  const neighbour = monster(690);

  hit(player, target);
  assert(
    getStatusEffect(target.tracksCombat, LINEAGE_POISON_ID) !== undefined,
    'the primary must still take the payoff',
  );
  assert(
    getStatusEffect(neighbour.tracksCombat, LINEAGE_POISON_ID) !== undefined,
    'an extra target must take the SAME payoff on a neighbour',
  );
  assert(
    cardFx().length === 1,
    'an amplified payoff is ONE effect on more bodies, not two effects',
  );
}

// ── Coverage: every PayoffKind has a runtime dispatcher and a client fx ───────
//
// The per-kind blocks above prove each payoff reaches its hook by NAME, which
// only guards the kinds someone remembered to write a block for. This guards
// the vocabulary itself (`shared/src/data/lineages/types.ts`'s `PayoffKind`
// union): a kind added there with no case in either of `lineageCards.ts`'s two
// switches (`applyPayoff`'s self-window one, `applyOnTarget`'s on-monster one)
// would silently return null forever, and a kind never authored on any card,
// capstone or ability-node option would have no fx anyone could ever see
// (`shared/` cannot import `client/`, so the fx half is proven by proxy: every
// authored card's fx is already pinned to an existing `LINEAGE_FX_KEYS` entry
// with a real client case by `coverage.test.ts` and `abilityNodes.test.ts`).

{
  const source = readFileSync(
    join(__dirname, '../src/systems/combat/lineageCards.ts'),
    'utf8',
  );
  const usedByCard = new Set<PayoffKind>();
  for (const lineage of LINEAGE_DATABASE.values()) {
    for (const card of lineage.cards) {
      if (card.payoff) usedByCard.add(card.payoff);
    }
    for (const form of lineage.forms) {
      if (form.capstone) usedByCard.add(form.capstone.payoff);
    }
  }
  const usedByAbilityNode = new Set<PayoffKind>();
  for (const tree of ABILITY_NODE_DATABASE.values()) {
    for (const option of tree.options) {
      if (option.row === 'packet') usedByAbilityNode.add(option.payoff);
    }
  }
  // The T1 composition payloads (design §24.2) are authored on the PACKETS, not on
  // a card: a verb delivers its lean's payload, so a kind a packet half names is
  // reachable from every T1 band that carries the lane.
  const usedByPacket = new Set<PayoffKind>();
  for (const packet of PACKET_DEFINITIONS.values()) {
    if (!packet.halves) continue;
    usedByPacket.add(packet.halves.payload);
    usedByPacket.add(packet.halves.pure.payload);
  }

  const problems: string[] = [];
  for (const kind of PAYOFF_KINDS) {
    if (!source.includes(`case '${kind}':`)) {
      problems.push(`'${kind}': no case in lineageCards.ts's dispatch switches`);
    }
    if (!usedByCard.has(kind) && !usedByAbilityNode.has(kind) && !usedByPacket.has(kind)) {
      problems.push(`'${kind}': authored on no lineage card, capstone, packet half or ability-node option — it has no visible fx anywhere`);
    }
  }
  assert(problems.length === 0, `payoff coverage failures:\n  ${problems.join('\n  ')}`);
}

// ── the clock pass costs nothing for a player with no clock card ──────────────
//
// `updateLineageCards` runs for every live player every tick, and
// `isPlayerActivelyInCombat` scans every aggroed monster in the world for a player
// with no live attack target. Reading it before checking for a `standing` / `pulse`
// card made every lineage-carrying player pay that scan for a loop body that then
// did nothing. Counted through the query the scan reads, because the cost IS the
// scan: there is no other observable difference.
{
  const player = spawn('lc-clock-cost', [seededCard({
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'echo-hit', magnitude: 0.5 },
  })]);
  // Aggroed ON the player and no attack target of its own, which is the shape that
  // reaches the scan rather than the early return.
  const attacker = monster(730);
  setAggroTarget(world, attacker, { id: player.isPlayer.id, kind: 'player' }, 1_000);

  const query = world.aggroedMonsters;
  let scans = 0;
  Object.defineProperty(world, 'aggroedMonsters', {
    configurable: true,
    get: () => { scans += 1; return query; },
  });

  cardFx();
  scans = 0;
  updateLineageCards(world, 100);
  const withoutClockCard = scans;

  setLineageRuntime(player.tracksCombat, {
    cards: [seededCard({
      trigger: { kind: 'pulse' },
      payoff: { kind: 'ward', magnitude: 0.2, durationMs: 4_000 },
      fx: 'engagement.brace-sparks', lane: 'engagement',
    })],
    capstones: [],
  });

  cardFx();
  scans = 0;
  updateLineageCards(world, 100);
  const withClockCard = scans;

  assert(
    withClockCard === withoutClockCard + 1,
    `the engagement scan belongs to the clock card alone: ${withoutClockCard} scans without it, ${withClockCard} with`,
  );
  assert(cardFx().length === 1, 'and the pulse still pays out, or this case proves nothing');

  Object.defineProperty(world, 'aggroedMonsters', {
    configurable: true, enumerable: true, writable: true, value: query,
  });
}

console.log('lineageCards.wiring: ok');
