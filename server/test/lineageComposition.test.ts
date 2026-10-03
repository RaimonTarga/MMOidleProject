/**
 * The T1 lean-and-verb payloads and moments, wired (design §24.2, course-correction
 * run W1-A).
 *
 * WHAT THIS PINS — wiring and invariants, not balance:
 *
 *   - `big-hit` and the load of `heal-and-load` multiply the hit IN FLIGHT and
 *     fold into `ctx.metadata.empoweredMultiplier` — one multiplier per hit;
 *   - `mechanic-proxy` (rule 3) lands the root's own empowered multiplier, sets
 *     `mechanicConsumed` + `mechanicProxy`, never emits `mechanic-fired`, never
 *     walks a frame loop, never spends the root's charge, and does nothing on a
 *     hit that already spent the real mechanic;
 *   - `root` goes through the control rules (an immune boss refuses it);
 *   - `redose` doubles what the target's player DoTs still owe;
 *   - the echo carries the weapon's on-hit;
 *   - a composed firing pushes its PAYLOAD's fx.
 *
 * The cards are seeded straight onto the runtime cache, like
 * `lineageCards.wiring.test.ts`; `composition.test.ts` pins the resolve half.
 *
 * Run: node --conditions=development --import tsx test/lineageComposition.test.ts
 */
import {
  ABILITY_DATABASE,
  ABILITY_ROOT_EFFECT_ID,
  GAME_CONFIG,
  baseRecoveryForTier,
  emptyEquipment,
  getCooldown,
  getStatusEffect,
  initAppliesDots,
  initUsesCadence,
  initUsesEnergy,
  setCooldown,
  setLineageRuntime,
  tickCooldowns,
  tickStatusEffectDurations,
  type CombatEvent,
  type LineageFxKey,
  type LineagePayoff,
  type LineageTrigger,
  type PacketId,
  type ResolvedLineageCard,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { attachComponent } from '../src/ecs/markerHelpers';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { emitCombatEvent, type CombatContext } from '../src/systems/combat/engine/combatPipeline';
import { registerMechanicFiredListener } from '../src/systems/combat/engine/mechanicFired';
import {
  proxyEmpoweredMultiplier, setEmpoweredAttack,
} from '../src/systems/combat/engine/empoweredAttacks';
import { monsterIgnoresControl } from '../src/systems/combat/status/controlImmunity';
import { applyMonsterRoot, applyMonsterSlow } from '../src/systems/combat/status/monsterControl';
import { onTechniqueResolved } from '../src/systems/combat/techniqueResolved';
import { abilityCooldownKey } from '../src/systems/player/abilities/abilityCooldowns';
import { LINEAGE_BLEED_ID } from '../src/systems/combat/damage/bleedIds';
import { getFrameCharge, isFrameWindowLive } from '../src/systems/classes/shared/frameLoop';

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
      unlockedRecipes: [], questProgress: {}, playerTier: 1, currentSkillTier: 0,
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

let mechanicFiredCount = 0;
registerMechanicFiredListener(() => { mechanicFiredCount += 1; });

let nextId = 0;

/**
 * A composed T1 verb as the runtime sees it: a payoff-row card authored with no
 * trigger/payoff, carrying the trigger and payload `composeVerb` resolved and the
 * payload's own fx.
 */
function verb(opts: {
  trigger: LineageTrigger;
  payoff: LineagePayoff;
  fx: LineageFxKey;
  lane?: PacketId;
  perTarget?: boolean;
}): ResolvedLineageCard {
  const lane = opts.lane ?? 'tempo';
  return {
    card: {
      id: `cmp-verb-${++nextId}`,
      lineageId: 'rapier', tier: 1, row: 'payoff', lane,
      name: 'Seeded verb', description: '', fx: 'tempo.ghost-strike',
    },
    requiredBiomeGroup: 'forest',
    requiredBiomeLevel: 4,
    requiredGlobalMastery: 0,
    cost: { essence: {}, shards: {} },
    trigger: opts.trigger,
    payoff: opts.payoff,
    payoffFx: opts.fx,
    ...(opts.perTarget ? { perTargetTrigger: true } : {}),
    composition: { verbLane: lane, pure: false },
  };
}

function spawn(id: string, cards: ResolvedLineageCard[] = []): PlayerEntity {
  const player = world.attachPlayerEntity(makeSlices(id), id);
  player.dealsDamage.attack = 100;
  player.dealsDamage.onHitDamage = 0;
  setLineageRuntime(player.tracksCombat, { cards, capstones: [] });
  world.takeNodeEvents(NODE);
  return player;
}

let nextX = 500;
function monster(typeId = 'plains-slime'): MonsterEntity {
  nextX += 400;
  const m = world.createMonster(NODE, typeId, { x: nextX, y: 400 });
  if (!m) throw new Error(`failed to spawn ${typeId}`);
  m.hasHealth.maxHp = 100_000;
  m.hasHealth.hp = 100_000;
  return m;
}

function exchange(player: PlayerEntity, defender: MonsterEntity, damage: number, metadata: Record<string, unknown>) {
  return {
    attacker: player, attackerType: 'player',
    defender, defenderType: 'monster',
    damage, platingMult: 1, drPierce: 0, cancelled: false, metadata,
  } as unknown as CombatContext;
}

function hit(player: PlayerEntity, defender: MonsterEntity, metadata: Record<string, unknown> = {}, damage = 200) {
  const ctx = exchange(player, defender, damage, metadata);
  emitCombatEvent('onHit', ctx, world);
  return ctx;
}

function cardFx(): Array<Extract<CombatEvent, { kind: 'card-fx' }>> {
  return world.takeNodeEvents(NODE)
    .filter((e): e is Extract<CombatEvent, { kind: 'card-fx' }> => e.kind === 'card-fx');
}

const EVERY_HIT: LineageTrigger = { kind: 'hit-nth', n: 1 };

// ── big-hit: the lunge folds into the one multiplier record ──────────────────

{
  const player = spawn('cmp-lunge', [verb({
    trigger: EVERY_HIT, payoff: { kind: 'big-hit', magnitude: 2 }, fx: 'engagement.lunge', lane: 'engagement',
  })]);
  const target = monster();
  const ctx = hit(player, target, {}, 200);
  assert(ctx.damage === 400, `a ×2 lunge doubles the hit in flight, got ${ctx.damage}`);
  assert(ctx.metadata['empoweredMultiplier'] === 2, 'and records ×2 as the hit\'s one multiplier');
  const fx = cardFx();
  assert(fx.length === 1 && fx[0].fx === 'engagement.lunge', 'a composed firing pushes its PAYLOAD\'s fx');

  // A hit that already carries a multiplier (a damage window, the real mechanic)
  // is folded, never layered: one record, the product of both.
  const empowered = hit(player, monster(), { empoweredMultiplier: 1.5 }, 300);
  assert(empowered.damage === 600, `the lunge multiplies the hit as it stands, got ${empowered.damage}`);
  assert(empowered.metadata['empoweredMultiplier'] === 3, 'one record: 1.5 × 2');
  cardFx();

  // A chaotic miss deals no direct damage: nothing to lunge with, nothing drawn.
  const whiff = hit(player, monster(), { chaoticMiss: true }, 200);
  assert(whiff.damage === 200 && whiff.metadata['empoweredMultiplier'] === undefined, 'a whiff is not lunged');
  assert(cardFx().length === 0, 'and draws nothing');
}

// ── mechanic-proxy: counts as the mechanic, never recurses (rule 3) ──────────

function cadencePlayer(id: string, cards: ResolvedLineageCard[]): PlayerEntity {
  const player = spawn(id, cards);
  attachComponent(world, player, 'usesCadence', initUsesCadence({ threshold: 5 }));
  player.usesSkills.passives['cadence.empowered-mult'] = 2;
  // A frame that banks on regular hits and spends on the finisher, so a frame
  // loop that walked a proxied hit would show it.
  player.usesSkills.passives['cadence.frame-charge-per-stack'] = 0.1;
  player.usesSkills.passives['cadence.frame-window-ms'] = 2_000;
  return player;
}

const proxyCard = (): ResolvedLineageCard => verb({
  trigger: EVERY_HIT, payoff: { kind: 'mechanic-proxy', magnitude: 1.5 }, fx: 'empowered.mechanic-flash',
  lane: 'tempo',
});

{
  const player = cadencePlayer('cmp-proxy-cadence', [proxyCard()]);
  const target = monster();
  const expected = proxyEmpoweredMultiplier(world, player);
  assert(expected !== undefined && expected >= 2, `cadence proxies its own empowered multiplier, got ${expected}`);
  const firedBefore = mechanicFiredCount;
  const bankBefore = getFrameCharge(player.tracksCombat, 'cadence');

  const ctx = hit(player, target, {}, 200);
  assert(ctx.damage === Math.floor(200 * expected!), `the proxy lands the root's multiplier, got ${ctx.damage}`);
  assert(ctx.metadata['mechanicConsumed'] === true, 'a proxied hit counts as the mechanic (mechanicConsumed)');
  assert(ctx.metadata['mechanicProxy'] === true, 'and says it is a proxy');
  assert(ctx.metadata['empoweredAttack'] === true, 'and is styled as the mechanic hit');
  assert(ctx.metadata['empoweredMultiplier'] === expected, 'one multiplier: the root\'s own');
  assert(mechanicFiredCount === firedBefore, 'a proxy NEVER emits mechanic-fired');
  assert(player.hasEmpoweredAttack === undefined, 'the root\'s charge was neither consumed nor created');
  assert(!isFrameWindowLive(player, 'cadence'), 'the frame loop did not run its finisher branch');
  assert(
    getFrameCharge(player.tracksCombat, 'cadence') === bankBefore + 1,
    'the frame loop saw only the ordinary hit it was (one banked charge), never a finisher',
  );
  const fx = cardFx();
  assert(fx.length === 1 && fx[0].fx === 'empowered.mechanic-flash', 'the proxy draws the mechanic flash');
}

{
  // The guard itself: an exchange ALREADY proxied before the root's listeners run
  // (a seam ordering that does not exist today) walks no frame loop and announces
  // nothing — the emitters, the cadence counter and the bank all treat it right.
  const player = cadencePlayer('cmp-proxy-guard', []);
  const target = monster();
  const firedBefore = mechanicFiredCount;
  const bankBefore = getFrameCharge(player.tracksCombat, 'cadence');
  const countBefore = player.usesCadence!.count;
  hit(player, target, { empoweredAttack: true, mechanicConsumed: true, mechanicProxy: true, empoweredMultiplier: 2 });
  assert(mechanicFiredCount === firedBefore, 'a proxied exchange never reaches mechanic-fired');
  assert(getFrameCharge(player.tracksCombat, 'cadence') === bankBefore, 'no frame loop walks a proxied hit');
  assert(!isFrameWindowLive(player, 'cadence'), 'and none opens its window');
  assert(player.usesCadence!.count === countBefore + 1, 'the cadence counter counts it as the ordinary hit it was');
  cardFx();
}

{
  // The real mechanic and a proxy on the same hit: the real one wins, alone.
  const player = cadencePlayer('cmp-proxy-real', [proxyCard()]);
  const target = monster();
  // Bank a charge so the finisher has something to spend.
  hit(player, target, {}, 10);
  cardFx();
  setEmpoweredAttack(world, player);
  const firedBefore = mechanicFiredCount;
  const ctx = hit(player, target, {}, 200);
  assert(ctx.metadata['mechanicProxy'] !== true, 'a hit that spent the real mechanic is not proxied');
  assert(mechanicFiredCount === firedBefore + 1, 'the real mechanic announces itself, once');
  const multiplier = Number(ctx.metadata['empoweredMultiplier']);
  assert(ctx.damage === Math.floor(200 * multiplier), 'one multiplier per hit: the real one, not real × proxy');
  assert(isFrameWindowLive(player, 'cadence'), 'the real finisher runs the frame loop');
  assert(cardFx().every((e) => e.fx !== 'empowered.mechanic-flash'), 'the refused proxy draws nothing');
}

{
  // A root with no damage-multiplier mechanic (the DoT root) takes the proxy's
  // fallback from the magnitude table.
  const player = spawn('cmp-proxy-dot', [proxyCard()]);
  attachComponent(world, player, 'appliesDots', initAppliesDots());
  assert(proxyEmpoweredMultiplier(world, player) === undefined, 'the DoT root has no multiplier to proxy');
  const firedBefore = mechanicFiredCount;
  const ctx = hit(player, monster(), {}, 200);
  assert(ctx.metadata['empoweredMultiplier'] === 1.5, 'it falls back to the table\'s 1.5');
  assert(ctx.metadata['mechanicProxy'] === true, 'and is still a proxy');
  assert(mechanicFiredCount === firedBefore, 'which never announces mechanic-fired, even at max stacks');
  cardFx();
}

{
  // A proxied hit spent no energy charge, so it builds energy like the ordinary
  // hit it was; a real discharge does not.
  const player = spawn('cmp-proxy-energy', [proxyCard()]);
  attachComponent(world, player, 'usesEnergy', initUsesEnergy());
  player.usesEnergy!.energy = 0;
  player.usesEnergy!.energyMax = 100;
  const ctx = hit(player, monster(), {}, 200);
  assert(ctx.metadata['mechanicProxy'] === true, 'the energy player\'s hit was proxied');
  emitCombatEvent('afterHit', ctx, world);
  assert(player.usesEnergy!.energy > 0, `a proxied hit still builds energy, got ${player.usesEnergy!.energy}`);
  cardFx();
}

// ── heal-and-load ────────────────────────────────────────────────────────────

{
  const player = spawn('cmp-heal-load', [verb({
    trigger: EVERY_HIT,
    payoff: { kind: 'heal-and-load', magnitude: 0.1, loadMultiplier: 1.5 },
    fx: 'kill-chain.heal-load', lane: 'kill-chain',
  })]);
  player.hasHealth.hp = Math.round(player.hasHealth.maxHp / 2);
  const before = player.hasHealth.hp;
  const ctx = hit(player, monster(), {}, 200);
  assert(
    player.hasHealth.hp - before === Math.round(player.hasHealth.maxHp * 0.1),
    `heals a tenth of the pool, got ${player.hasHealth.hp - before}`,
  );
  assert(ctx.damage === 300, `and the hit lands loaded (+50%), got ${ctx.damage}`);
  assert(ctx.metadata['empoweredMultiplier'] === 1.5, 'folded into the one multiplier record');
  const fx = cardFx();
  assert(fx.length === 1 && fx[0].fx === 'kill-chain.heal-load', 'one heal-and-load effect');
}

// ── root: the control ladder's root rung, refused by the immune ──────────────

{
  const player = spawn('cmp-root', [verb({
    trigger: EVERY_HIT, payoff: { kind: 'root', magnitude: 1, durationMs: 2_000 },
    fx: 'control.shackle', lane: 'control',
  })]);
  const target = monster();
  hit(player, target);
  const root = getStatusEffect(target.tracksCombat, ABILITY_ROOT_EFFECT_ID);
  assert(root?.data['totalMs'] === 2_000, 'a 2 s root, with the clock the buff UI needs');
  assert(target.isRooted !== undefined, 'the body is rooted');
  assert(cardFx().length === 1, 'one shackle');

  const immune = monster('cinder-shell-magma-salamander');
  assert(monsterIgnoresControl(immune), 'the test boss really is control-immune');
  hit(player, immune);
  assert(getStatusEffect(immune.tracksCombat, ABILITY_ROOT_EFFECT_ID) === undefined, 'an immune boss refuses the root');
  assert(cardFx().length === 0, 'and a refused root draws nothing');

  hit(player, monster(), { evadeBlocksDebuffs: true });
  assert(cardFx().length === 0, 'a blocking evade blocks the root like every on-target payoff');
}

// ── redose: doubles what the target's player DoTs still owe ──────────────────

{
  const player = spawn('cmp-redose', [verb({
    trigger: EVERY_HIT, payoff: { kind: 'hemorrhage', magnitude: 1, durationMs: 4_000 },
    fx: 'affliction.heavy-drip', lane: 'affliction',
  })]);
  const target = monster();
  hit(player, target, {}, 200);
  const bleed = getStatusEffect(target.tracksCombat, LINEAGE_BLEED_ID);
  assert(bleed?.data['damagePerTick'] === 50 && bleed.stacks === 4, 'the heavy bleed: a whole swing (200) over 4 ticks');
  cardFx();

  setLineageRuntime(player.tracksCombat, {
    cards: [verb({
      trigger: EVERY_HIT, payoff: { kind: 'redose', magnitude: 1, durationMs: 4_000 },
      fx: 'affliction.double-dose', lane: 'affliction',
    })],
    capstones: [],
  });
  hit(player, target, {}, 200);
  const doubled = getStatusEffect(target.tracksCombat, LINEAGE_BLEED_ID);
  assert(
    (doubled?.data['damagePerTick'] ?? 0) * (doubled?.stacks ?? 0) === 400,
    `a redose of 1.0 doubles the 200 still owed, got ${(doubled?.data['damagePerTick'] ?? 0) * (doubled?.stacks ?? 0)}`,
  );
  const fx = cardFx();
  assert(fx.length === 1 && fx[0].fx === 'affliction.double-dose', 'one double-dose effect');

  hit(player, monster(), {}, 200);
  assert(cardFx().length === 0, 'an unafflicted target has nothing to double, and nothing is drawn');
}

// ── the echo carries on-hit ──────────────────────────────────────────────────

{
  const echo = (): ResolvedLineageCard => verb({
    trigger: EVERY_HIT, payoff: { kind: 'echo-hit', magnitude: 1 }, fx: 'tempo.ghost-strike',
  });
  const plain = spawn('cmp-echo-plain', [echo()]);
  const plainTarget = monster();
  const plainBefore = plainTarget.hasHealth.hp;
  hit(plain, plainTarget, {}, 200);
  const plainEcho = plainBefore - plainTarget.hasHealth.hp;

  const onHit = spawn('cmp-echo-onhit', [echo()]);
  onHit.dealsDamage.onHitDamage = 40;
  const onHitTarget = monster();
  const onHitBefore = onHitTarget.hasHealth.hp;
  hit(onHit, onHitTarget, {}, 200);
  const onHitEcho = onHitBefore - onHitTarget.hasHealth.hp;
  assert(
    onHitEcho > plainEcho,
    `a whole echo is a whole second swing, on-hit included (plain ${plainEcho}, with on-hit ${onHitEcho})`,
  );
  cardFx();
}

// ── The moments: caps, holds, the kill carry, the landed Technique ───────────

/** A full exchange's front half: the probe in `beforeAttack`, then `onHit`. */
function fullHit(player: PlayerEntity, defender: MonsterEntity, damage = 200): CombatContext {
  const ctx = exchange(player, defender, damage, {});
  emitCombatEvent('beforeAttack', ctx, world);
  emitCombatEvent('onHit', ctx, world);
  return ctx;
}

function kill(player: PlayerEntity, defender: MonsterEntity): void {
  emitCombatEvent('onKill', exchange(player, defender, 200, {}), world);
}

{
  // hit-afflicted on the DoT root: every hit after the first lands on an
  // afflicted target, so the moment is satisfied on nearly every hit — and still
  // fires AT the cap, reliably, never more often (design §24.2 rule 2).
  const player = spawn('cmp-afflicted-cap', [verb({
    trigger: { kind: 'hit-afflicted', capMs: 5_000 },
    payoff: { kind: 'big-hit', magnitude: 2 }, fx: 'engagement.lunge', lane: 'affliction',
  })]);
  attachComponent(world, player, 'appliesDots', initAppliesDots());
  const target = monster();

  const first = fullHit(player, target);
  assert(first.metadata['empoweredMultiplier'] === undefined, 'the hit that FIRST afflicts is not on an afflicted target');
  assert(cardFx().length === 0, 'so nothing fires on it');

  const STEP_MS = 600;
  const firedAt: number[] = [];
  for (let t = STEP_MS; t <= 30_000; t += STEP_MS) {
    tickCooldowns(player.tracksCombat, STEP_MS);
    fullHit(player, target);
    if (cardFx().length > 0) firedAt.push(t);
  }
  assert(firedAt[0] === STEP_MS, `the second hit lands on an afflicted target and fires, got ${firedAt[0]}`);
  for (let i = 1; i < firedAt.length; i++) {
    assert(firedAt[i] - firedAt[i - 1] >= 5_000, `two firings ${firedAt[i] - firedAt[i - 1]} ms apart — the cap is 5000`);
    assert(firedAt[i] - firedAt[i - 1] < 5_000 + STEP_MS, 'and it fires again on the first hit the cap allows');
  }
  assert(firedAt.length === 6, `50 hits over 30 s fire 6 times at the cap, got ${firedAt.length}`);

  // An unafflicted target never satisfies it, cap or no cap.
  const clean = spawn('cmp-afflicted-none', [verb({
    trigger: { kind: 'hit-afflicted', capMs: 5_000 },
    payoff: { kind: 'big-hit', magnitude: 2 }, fx: 'engagement.lunge', lane: 'affliction',
  })]);
  for (let i = 0; i < 5; i++) fullHit(clean, monster());
  assert(cardFx().length === 0, 'a non-DoT player hitting fresh bodies never afflicts, so never fires');
}

{
  // hit-held: only on a slowed or rooted body, and capped the same way.
  const player = spawn('cmp-held', [verb({
    trigger: { kind: 'hit-held', capMs: 5_000 },
    payoff: { kind: 'stun', magnitude: 1, durationMs: 1_500 }, fx: 'control.knockdown', lane: 'control',
  })]);
  const target = monster();
  fullHit(player, target);
  fullHit(player, target);
  assert(cardFx().length === 0, 'a free target is not held');

  applyMonsterSlow(world, target, 0.2, 20_000, player.isPlayer.id);
  fullHit(player, target);
  const fx = cardFx();
  assert(fx.length === 1 && fx[0].fx === 'control.knockdown', 'a slowed target is held: the knockdown fires');
  fullHit(player, target);
  assert(cardFx().length === 0, 'and the cap stops it chaining');
  tickCooldowns(player.tracksCombat, 5_000);
  // The stun ladder's post-stun immunity (2x the stun) has to lapse too.
  tickStatusEffectDurations(target.tracksCombat, 5_000);
  fullHit(player, target);
  assert(cardFx().length === 1, 'once the cap runs out, the next held hit fires again');

  const rooted = monster();
  applyMonsterRoot(world, rooted, 2_000, 'someone-else');
  tickCooldowns(player.tracksCombat, 5_000);
  fullHit(player, rooted);
  assert(cardFx().length === 1, 'a rooted target is held too, whoever rooted it');
}

{
  // The kill carry: the kill arms, the next landed hit pays, once.
  const player = spawn('cmp-carry', [verb({
    trigger: { kind: 'kill', carry: true },
    payoff: { kind: 'heal-and-load', magnitude: 0.1, loadMultiplier: 1.5 },
    fx: 'kill-chain.heal-load', lane: 'kill-chain',
  })]);
  const target = monster();
  hit(player, target);
  assert(cardFx().length === 0, 'no kill yet, nothing armed');

  kill(player, monster());
  assert(cardFx().length === 0, 'the kill itself pays nothing — it arms');
  const loaded = hit(player, target, {}, 200);
  assert(loaded.damage === 300, `the next hit lands loaded, got ${loaded.damage}`);
  assert(cardFx().length === 1, 'and pays once');
  const after = hit(player, target, {}, 200);
  assert(after.damage === 200 && cardFx().length === 0, 'the hit after that is ordinary');

  kill(player, monster());
  kill(player, monster());
  hit(player, target);
  hit(player, target);
  assert(cardFx().length === 1, 'two kills before the next hit still pay once');

  kill(player, monster());
  const corpse = monster();
  corpse.hasHealth.hp = 0;
  hit(player, corpse);
  assert(cardFx().length === 0, 'a hit on a body already dead is not "the next hit"');
  hit(player, target, { chaoticMiss: true });
  assert(cardFx().length === 0, 'nor is a whiff');
  hit(player, target);
  assert(cardFx().length === 1, 'the carry waited for a real landed hit');
}

{
  // A composed Technique verb refunds THE Technique that landed; a legacy card
  // at the same moment refunds every attuned one.
  const techniques = [...ABILITY_DATABASE.values()].filter((a) => a.slot === 'technique').slice(0, 2);
  assert(techniques.length === 2, 'two Techniques to tell apart');
  const [landed, other] = techniques;
  const refundCard = (composed: boolean): ResolvedLineageCard => {
    const card = verb({
      trigger: { kind: 'technique-cast' },
      payoff: { kind: 'technique-refund', magnitude: 0.5 }, fx: 'technique.refund-flash', lane: 'technique',
    });
    if (!composed) delete card.composition;
    return card;
  };

  for (const composed of [true, false]) {
    const player = spawn(`cmp-refund-${composed}`, [refundCard(composed)]);
    player.tracksProgression.attunedAbilities.techniques = [landed.id, other.id];
    setCooldown(player.tracksCombat, abilityCooldownKey(landed.id), 6_000);
    setCooldown(player.tracksCombat, abilityCooldownKey(other.id), 6_000);
    onTechniqueResolved(world, player, landed);
    const landedLeft = getCooldown(player.tracksCombat, abilityCooldownKey(landed.id));
    const otherLeft = getCooldown(player.tracksCombat, abilityCooldownKey(other.id));
    assert(landedLeft === 3_000, `${composed ? 'composed' : 'legacy'}: the landed Technique gets half back, got ${landedLeft}`);
    assert(
      otherLeft === (composed ? 6_000 : 3_000),
      `${composed ? 'a composed verb refunds only that Technique' : 'a legacy card refunds every attuned one'}, got ${otherLeft}`,
    );
    cardFx();
  }
}

{
  // The engagement moment latches per BODY: the first hit on each new target.
  const player = spawn('cmp-first-per-body', [verb({
    trigger: { kind: 'first-hit' }, payoff: { kind: 'big-hit', magnitude: 2 },
    fx: 'engagement.lunge', lane: 'engagement', perTarget: true,
  })]);
  const a = monster();
  const b = monster();
  assert(hit(player, a, {}, 100).damage === 200, 'the first hit on a body is a lunge');
  assert(hit(player, a, {}, 100).damage === 100, 'the second is not');
  assert(hit(player, b, {}, 100).damage === 200, 'a new body is a new opening');
  cardFx();
}

console.log('lineageComposition: ok');
