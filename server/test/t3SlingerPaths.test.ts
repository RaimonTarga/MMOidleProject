/**
 * The Slinger's re-homed T3 paths (design §22.5, the T3 path review; ability-pass
 * run W1-E).
 *
 *   Duelist    Kill chain. Every kill loads a round on top of the clip, past its
 *              size, until the next reload; a reload returns the authored clip.
 *              Distinct from the Kill chain keystone Refund (a kill completes the
 *              reload): with Refund the Duelist gets the refill AND the round.
 *   Warmonger  Tempo. The Artillerist frame owns the per-clip ramp; a reload now
 *              HALVES it instead of resetting it, and the barrel glow holds at the
 *              carried value through the reload. The top damage and the glow
 *              measure against ONE clip (design §22.12), so the first clip is the
 *              Artillerist's own; only the attack speed climbs past one clip in a
 *              sustained fight. The halving is paid once per reload, however the
 *              clip comes back (a Refund kill included).
 *
 * WHAT THIS PINS. The rule's wiring and its bounds, through the real ammo pipeline
 * (`beforeAttack` spends the round and tags its clip position, `afterHit` runs the
 * reload-start hooks, `onKill` runs the kill listeners in registration order) —
 * not balance. Every number is read back out of the authored nodes.
 *
 * Run: node --conditions=development --import tsx test/t3SlingerPaths.test.ts
 */
import {
  GAME_CONFIG,
  SKILL_TREE,
  baseRecoveryForTier,
  composePlayerView,
  emptyEquipment,
  keystoneFxKey,
  resolveEmpoweredMultiplier,
  setFlag,
  setLineageRuntime,
  type CombatEvent,
  type ResolvedLineageCard,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { emitCombatEvent, type CombatContext } from '../src/systems/combat/engine/combatPipeline';
import { proxyEmpoweredMultiplier } from '../src/systems/combat/engine/empoweredAttacks';
import { refundMechanic } from '../src/systems/combat/keystones';
import { RUNE_TACTICAL_RELOAD_FLAG } from '../src/systems/combat/ai/runeConfig';
import { updateReloadArchetype } from '../src/systems/classes/archetypes/reload/reloadPrototype';
import { requestManualReload } from '../src/systems/classes/archetypes/reload/reloadLifecycle';
import {
  reloadFrameRampCap,
  reloadFrameRampFill,
  reloadFramePositionMult,
  reloadRampCarry,
} from '../src/systems/classes/archetypes/reload/frameLoop';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function close(actual: number, expected: number, message: string, epsilon = 1e-9): void {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

const NODE = 'node-clearing';

function makeSlices(id: string, unlockedSkills: string[]): PersistedPlayerSlices {
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
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 3,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: { ...emptyEquipment() }, itemUpgrades: {} },
    usesSkills: {
      unlockedSkills,
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: null,
    },
  };
}

initCombatSystems();
const world = new World();

/**
 * A Slinger wearing one frame and the given T3 path, its authored `mechanicEffects`
 * resolved into passives the way a live unlock resolves them, and its clip sized by
 * one reload tick (the slice initialiser does not know the frame's magazine).
 */
function slinger(id: string, subVariant: 'light' | 'heavy', path: string[]): PlayerEntity {
  const player = world.attachPlayerEntity(
    makeSlices(id, ['reload-root', `reload-${subVariant}`, ...path]),
    id,
  );
  player.usesSkills.combatArchetype = 'reload';
  player.usesSkills.selectedClass = 'reload-root';
  player.usesSkills.selectedSubVariant = subVariant;
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  updateReloadArchetype(world, 0);
  return player;
}

/** The Kill chain keystone (Refund), seeded on the runtime cache as keystones.test does. */
function withRefund(player: PlayerEntity): void {
  const card: ResolvedLineageCard = {
    card: {
      id: `seed-refund-${player.isPlayer.id}`,
      lineageId: 'axe', tier: 3, row: 'keystone', lane: 'kill-chain',
      name: 'Refund', description: 'A kill readies your class mechanic.',
      fx: keystoneFxKey('kill-chain'),
      trigger: 'kill', payoff: 'recovery-window',
    },
    requiredBiomeGroup: 'forest',
    requiredBiomeLevel: 14,
    requiredGlobalMastery: 0,
    cost: { essence: {}, shards: {} },
    trigger: { kind: 'kill' },
    payoff: { kind: 'recovery-window', magnitude: 0.5 },
  };
  setLineageRuntime(player.tracksCombat, { cards: [card], capstones: [] });
}

/** A target that cannot die, so a kill is only ever the one the test emits. */
function punchbag(x: number, y = 400): MonsterEntity {
  const monster = world.createMonster(NODE, 'plains-slime', { x, y });
  assert(monster !== null, 'the test target must exist in the monster database');
  monster.hasHealth.maxHp = 10_000_000;
  monster.hasHealth.hp = 10_000_000;
  monster.mitigatesDamage.plating = 0;
  monster.mitigatesDamage.damageReduction = 0;
  return monster;
}

const BASE_DAMAGE = 1000;

function makeCtx(player: PlayerEntity, target: MonsterEntity): CombatContext {
  return {
    attacker: player, attackerType: 'player',
    defender: target, defenderType: 'monster',
    damage: BASE_DAMAGE, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext;
}

/** One shot through the real ammo pipeline, up to its damage. */
function landShot(player: PlayerEntity, target: MonsterEntity): CombatContext {
  const ctx = makeCtx(player, target);
  emitCombatEvent('beforeAttack', ctx, world);
  if (ctx.cancelled) return ctx;
  ctx.damage = BASE_DAMAGE;
  emitCombatEvent('onHit', ctx, world);
  return ctx;
}

/** The shot's tail: the deferred reload-start hooks run here, as on the live server. */
function finishShot(ctx: CombatContext): CombatContext {
  emitCombatEvent('afterHit', ctx, world);
  return ctx;
}

function fireShot(player: PlayerEntity, target: MonsterEntity): CombatContext {
  return finishShot(landShot(player, target));
}

/** A kill, through every `onKill` listener in the order the live server registered them. */
function kill(player: PlayerEntity, target: MonsterEntity): void {
  emitCombatEvent('onKill', makeCtx(player, target), world);
}

/** Run the reload timer out through the reload tick (the timed completion). */
function finishReload(player: PlayerEntity): void {
  const reload = player.usesReload!;
  assert(reload.reloadingMs > 0, 'precondition: a reload should be running');
  updateReloadArchetype(world, reload.reloadingMs);
  assert(reload.reloadingMs === 0, 'the reload tick should have finished the reload');
}

/** The ONE multiplier this exchange resolved (the Scout frame folds its opener there). */
function empoweredMult(ctx: CombatContext): number {
  return Number(ctx.metadata['empoweredMultiplier'] ?? 1);
}

// Read through a function so an assertion on the live field cannot narrow its type
// for the rest of a block (every block mutates the clip between reads).
function ammoOf(player: PlayerEntity): number {
  return player.usesReload!.ammo;
}
function chainOf(player: PlayerEntity): number {
  return player.usesReload!.chainRounds;
}

// ── Duelist: the node ────────────────────────────────────────────────────────

const DUELIST = 'reload-light-t3-a';
{
  const node = SKILL_TREE.get(DUELIST);
  assert(node, 'the Duelist node must exist');
  assert(node.packet === 'kill-chain', `Duelist is the Kill chain path (design §22.5), got '${node.packet}'`);
  const effects = (node.mechanicEffects ?? {}) as Record<string, number>;
  assert((effects['reload.kill-chain'] ?? 0) === 1, 'Duelist authors one round per kill');
  assert(effects['reload.exploding-clip'] === undefined, 'the exploding last bullet is retired');
  assert(effects['reload.empowered-mult'] === undefined, 'the last-bullet multiplier is retired');
  assert(effects['reload.max-ammo'] === undefined, 'the +1 round is retired: the clip grows with kills');
  assert(
    effects['reload.mechanic-proxy-mult'] === 3.5,
    'the Empowered proxy is ×3.5 again, on a key only the proxy reads (design §22.12)',
  );
}

// ── Duelist: an Empowered-lane proxy lands at ×3.5; the openers do not move ──

{
  const duelist = slinger('t3s-duelist-proxy', 'light', [DUELIST]);
  const scout = slinger('t3s-scout-proxy', 'light', []);
  assert(proxyEmpoweredMultiplier(world, duelist) === 3.5, `the Duelist's proxy is ×3.5, got ${proxyEmpoweredMultiplier(world, duelist)}`);
  assert(
    proxyEmpoweredMultiplier(world, scout) === undefined,
    'a reload spec without the key has no multiplier to proxy (it takes the table\'s fallback)',
  );
  assert(
    resolveEmpoweredMultiplier(duelist.usesSkills.passives, 'reload') === null,
    'the HUD and the Stats panel\'s DPS estimate still see no empowered reload shot (no ×3.5 last round)',
  );

  // The openers: a whole fresh clip on each, round for round the Scout frame's own —
  // the proxy's key arms nothing and folds into no real shot.
  const duelistTarget = punchbag(780);
  const scoutTarget = punchbag(800);
  const clip = duelist.usesReload!.ammoMax;
  const duelistMults: number[] = [];
  const scoutMults: number[] = [];
  for (let round = 1; round <= clip; round++) {
    const duelistShot = fireShot(duelist, duelistTarget);
    assert(duelistShot.metadata['mechanicConsumed'] !== true, `round ${round}: no real empowered shot fired`);
    duelistMults.push(empoweredMult(duelistShot));
    scoutMults.push(empoweredMult(fireShot(scout, scoutTarget)));
  }
  const openerMult = duelist.usesSkills.passives['reload.frame-opener-mult'] ?? 0;
  assert(openerMult === 1.3, `fixture: the Scout frame's openers are ×1.3, got ${openerMult}`);
  assert(
    duelistMults.every((mult, i) => mult === scoutMults[i] && mult === (i < 2 ? openerMult : 1)),
    `the Duelist's clip is the Scout's, openers and all: ${duelistMults.join(', ')} against ${scoutMults.join(', ')}`,
  );
  assert(duelist.hasEmpoweredAttack === undefined, 'and no empowered flag is armed');
  finishReload(duelist);

  // An Empowered-lane `mechanic-proxy` through the real card seam, on a round past
  // the openers, lands at ×3.5.
  for (let round = 1; round <= 2; round++) fireShot(duelist, duelistTarget);
  const proxyCard: ResolvedLineageCard = {
    card: {
      id: 'seed-proxy-duelist', lineageId: 'rapier', tier: 1, row: 'payoff', lane: 'empowered',
      name: 'Seeded proxy', description: '', fx: 'empowered.mechanic-flash',
    },
    requiredBiomeGroup: 'forest', requiredBiomeLevel: 4, requiredGlobalMastery: 0,
    cost: { essence: {}, shards: {} },
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'mechanic-proxy', magnitude: 1.5 },
    payoffFx: 'empowered.mechanic-flash',
    composition: { verbLane: 'empowered', pure: false },
  };
  setLineageRuntime(duelist.tracksCombat, { cards: [proxyCard], capstones: [] });
  const proxied = fireShot(duelist, duelistTarget);
  assert(proxied.metadata['mechanicProxy'] === true, 'fixture: the seeded card proxied the hit');
  close(empoweredMult(proxied), 3.5, 'the Duelist\'s Empowered proxy lands at ×3.5');
  assert(proxied.damage === Math.floor(BASE_DAMAGE * 3.5), `and the hit carries it, got ${proxied.damage}`);
  assert(duelist.hasEmpoweredAttack === undefined, 'a proxy neither arms nor spends the root\'s charge');
  setLineageRuntime(duelist.tracksCombat, { cards: [], capstones: [] });
}

// ── Duelist: the clip grows by one per kill, past max, and the HUD sees it ───

{
  const player = slinger('t3s-duelist-grow', 'light', [DUELIST]);
  const target = punchbag(500);
  const reload = player.usesReload!;
  const passives = player.usesSkills.passives;
  const clip = reload.ammoMax;
  const openerRounds = Math.round(passives['reload.frame-opener-rounds'] ?? 0);
  const openerMult = passives['reload.frame-opener-mult'] ?? 0;

  assert(clip === 5, `the Duelist keeps Scout's authored 5-round clip, got ${clip}`);
  assert(openerRounds === 2 && openerMult > 1, 'Scout\'s openers are untouched by the path');

  const first = fireShot(player, target);
  close(empoweredMult(first), openerMult, 'round 1 of a fresh clip is an opener');
  assert(ammoOf(player) === clip - 1, 'a shot spends a round');

  world.dirty.drain();
  kill(player, target);
  assert(ammoOf(player) === clip, `a kill loads one round: expected ${clip}, got ${ammoOf(player)}`);
  assert(chainOf(player) === 1, 'and the chain counts it');
  const drained = world.dirty.drain();
  assert(
    drained.patched.get('t3s-duelist-grow')?.has('usesReload') === true,
    'the round must mark the networked ammo slice dirty, or the HUD never sees it',
  );

  kill(player, target);
  kill(player, target);
  assert(ammoOf(player) === clip + 2, `three kills load three rounds, two past max: got ${ammoOf(player)}`);
  assert(chainOf(player) === 3, 'three kills, a chain of three');
  assert(reload.ammoMax === clip, 'the clip grows in CURRENT ammo; the authored max never moves');

  // The HUD contract: the networked slice carries current and max, and the view
  // projects both untouched, so the counter reads "7 / 5".
  const view = composePlayerView(player);
  assert(view !== null, 'the player view must compose');
  assert(view.ammoCount === clip + 2 && view.ammoMax === clip, `the HUD should read ${clip + 2} / ${clip}, got ${view.ammoCount} / ${view.ammoMax}`);

  // More rounds, same opener: round 2 of the clip is still an opener, and every
  // round the chain loaded after it is an ordinary one.
  const second = fireShot(player, target);
  close(empoweredMult(second), openerMult, 'round 2 of the clip is still an opener');
  assert(
    second.metadata['reloadClipSize'] === clip,
    'Tempo and Sweep normalise by the AUTHORED clip, never the grown one',
  );
  let fired = 2;
  while (ammoOf(player) > 1) {
    const ctx = fireShot(player, target);
    fired++;
    close(empoweredMult(ctx), 1, `round ${fired} is past the openers and must be ordinary`);
  }
  const last = landShot(player, target);
  fired++;
  close(empoweredMult(last), 1, 'the grown clip\'s last round is ordinary');
  assert(fired === clip + 3, `the grown clip is ${clip + 3} rounds long, fired ${fired}`);
  assert(ammoOf(player) === 0 && reload.reloadingMs > 0, 'the grown clip ran dry and started a reload');
  assert(chainOf(player) === 0, 'starting the reload ends the chain');
  finishShot(last);

  // A reload returns the clip to its authored size, and a fresh clip opens again.
  finishReload(player);
  assert(ammoOf(player) === clip, `a reload returns the authored ${clip} rounds, got ${ammoOf(player)}`);
  close(empoweredMult(fireShot(player, target)), openerMult, 'the next fresh clip opens again');
}

// ── Duelist: the last round's own kill is owed, and the timer forfeits it ────

{
  const player = slinger('t3s-duelist-owed', 'light', [DUELIST]);
  const target = punchbag(520);
  const reload = player.usesReload!;
  const clip = reload.ammoMax;

  while (ammoOf(player) > 1) fireShot(player, target);
  const last = landShot(player, target);
  finishShot(last);
  assert(reload.reloadingMs > 0, 'the last round started the reload');
  kill(player, target);
  assert(ammoOf(player) === 0, 'an empty clip mid-reload has nowhere to load the round');
  assert(chainOf(player) === 1, 'the round is owed to the clip');
  finishReload(player);
  assert(ammoOf(player) === clip, `the timer brings back the authored clip, got ${ammoOf(player)}`);
  assert(chainOf(player) === 0, 'and forfeits what the chain was owed');
}

// ── Duelist: a manual (R) and a tactical reload both return the authored clip ─

{
  const player = slinger('t3s-duelist-manual', 'light', [DUELIST]);
  const target = punchbag(540);
  const reload = player.usesReload!;
  const clip = reload.ammoMax;

  fireShot(player, target);
  fireShot(player, target);
  fireShot(player, target);
  kill(player, target);
  assert(ammoOf(player) === clip - 2 && chainOf(player) === 1, 'a chain round mid-clip');
  const result = requestManualReload(world, player);
  assert(result.state === 'activated', 'a part-spent clip can be reloaded by hand');
  assert(ammoOf(player) === 0 && chainOf(player) === 0, 'a manual reload dumps the clip and the chain');
  finishReload(player);
  assert(ammoOf(player) === clip, `a manual reload returns the authored clip, got ${ammoOf(player)}`);

  // Past max, there is nothing for R to give back: the request is a no-op.
  kill(player, target);
  assert(ammoOf(player) === clip + 1, 'a kill on a full clip loads past max');
  const refused = requestManualReload(world, player);
  assert(refused.state === undefined && reload.reloadingMs === 0, 'a clip past max is not reloaded by hand');
  assert(ammoOf(player) === clip + 1, 'and keeps its rounds');
}

{
  const player = slinger('t3s-duelist-tactical', 'light', [DUELIST]);
  const target = punchbag(560);
  const reload = player.usesReload!;
  const clip = reload.ammoMax;

  fireShot(player, target);
  fireShot(player, target);
  kill(player, target);
  assert(chainOf(player) === 1 && ammoOf(player) < clip, 'a part-spent clip holding a chain round');
  setFlag(player.tracksCombat, RUNE_TACTICAL_RELOAD_FLAG, true);
  updateReloadArchetype(world, 0);
  assert(reload.reloadingMs > 0, 'out of combat, the tactical-reload rune starts a reload');
  assert(chainOf(player) === 0, 'which ends the chain');
  setFlag(player.tracksCombat, RUNE_TACTICAL_RELOAD_FLAG, false);
  finishReload(player);
  assert(ammoOf(player) === clip, `a tactical reload returns the authored clip, got ${ammoOf(player)}`);
}

// ── Duelist with Refund: the refill AND the round ────────────────────────────

{
  // Mid-clip: Refund completes the reload, the Duelist adds the kill's round on top,
  // and the chain keeps growing kill by kill.
  const player = slinger('t3s-duelist-refund', 'light', [DUELIST]);
  withRefund(player);
  const target = punchbag(580);
  const reload = player.usesReload!;
  const clip = reload.ammoMax;
  const openerMult = player.usesSkills.passives['reload.frame-opener-mult'] ?? 0;

  fireShot(player, target);
  fireShot(player, target);
  fireShot(player, target);
  assert(ammoOf(player) === clip - 3, 'three rounds spent');
  kill(player, target);
  assert(reload.reloadingMs === 0, 'Refund completed the reload');
  assert(ammoOf(player) === clip + 1, `the refill AND the round: expected ${clip + 1}, got ${ammoOf(player)}`);
  kill(player, target);
  assert(ammoOf(player) === clip + 2, `the clip grows by one per kill with Refund too, got ${ammoOf(player)}`);
  assert(chainOf(player) === 2, 'a Refund refill does not break the chain');
  close(
    empoweredMult(fireShot(player, target)),
    openerMult,
    'a refilled clip is a fresh clip: its first round is an opener',
  );

  // The last round's own kill: the reload had started; Refund cuts it short and pays
  // the owed round.
  while (ammoOf(player) > 1) fireShot(player, target);
  const last = landShot(player, target);
  finishShot(last);
  assert(reload.reloadingMs > 0 && chainOf(player) === 0, 'the dry clip started a reload and ended the chain');
  kill(player, target);
  assert(reload.reloadingMs === 0, 'Refund cut the reload short');
  assert(ammoOf(player) === clip + 1, `the last round's kill still pays its round: expected ${clip + 1}, got ${ammoOf(player)}`);
}

{
  // Order independence. The live server registers the Duelist's kill listener (a
  // class mechanic) before Refund (a lineage keystone). Running the refill FIRST and
  // the Duelist second must land on the same clip.
  for (const lastRound of [false, true]) {
    const live = slinger(`t3s-order-live-${lastRound}`, 'light', [DUELIST]);
    withRefund(live);
    const swapped = slinger(`t3s-order-swapped-${lastRound}`, 'light', [DUELIST]);
    const target = punchbag(lastRound ? 600 : 620);
    for (const player of [live, swapped]) {
      if (lastRound) {
        while (ammoOf(player) > 1) fireShot(player, target);
        finishShot(landShot(player, target));
      } else {
        fireShot(player, target);
        fireShot(player, target);
      }
    }
    kill(live, target);
    refundMechanic(world, swapped);
    kill(swapped, target);
    assert(
      ammoOf(live) === ammoOf(swapped) && chainOf(live) === chainOf(swapped),
      `${lastRound ? 'last-round' : 'mid-clip'} kill: Refund-first ${ammoOf(swapped)}/${chainOf(swapped)} must equal Duelist-first ${ammoOf(live)}/${chainOf(live)}`,
    );
    assert(ammoOf(live) === live.usesReload!.ammoMax + 1, 'both orders land on the refill plus the round');
  }
}

// ── Component presence: a Scout without the path loads nothing on a kill ─────

{
  const player = slinger('t3s-scout-plain', 'light', []);
  const target = punchbag(640);
  fireShot(player, target);
  const before = ammoOf(player);
  kill(player, target);
  assert(ammoOf(player) === before, 'a kill loads no round without the Duelist path');
  assert(chainOf(player) === 0, 'and starts no chain');
}

// ── Warmonger: the node ──────────────────────────────────────────────────────

const WARMONGER = 'reload-heavy-t3-b';
{
  const node = SKILL_TREE.get(WARMONGER);
  assert(node, 'the Warmonger node must exist');
  assert(node.packet === 'tempo', `Warmonger keeps the Tempo tag (design §22.5), got '${node.packet}'`);
  const effects = (node.mechanicEffects ?? {}) as Record<string, number>;
  assert(effects['reload.ramp-carry-pct'] === 0.5, 'Warmonger authors the carry at a half');
  for (const key of ['reload.hair-trigger', 'reload.hair-trigger-pct-per-shot', 'reload.hair-trigger-max-stacks']) {
    assert(effects[key] === undefined, `the path's own ramp is retired: ${key} must be gone`);
  }
}

/** Every shot of the clip but the last, fired whole (the ramp climbs, nothing reloads). */
function fireAllButLast(player: PlayerEntity, target: MonsterEntity): void {
  while (ammoOf(player) > 1) fireShot(player, target);
}

function stacksOf(player: PlayerEntity): number {
  return player.usesReload!.clipSpeedStacks;
}

function frameCharges(playerId: string): Array<Extract<CombatEvent, { kind: 'frame-charge' }>> {
  return world.takeNodeEvents(NODE).filter(
    (e): e is Extract<CombatEvent, { kind: 'frame-charge' }> =>
      e.kind === 'frame-charge' && e.playerId === playerId,
  );
}

// ── Warmonger: a reload halves the ramp, the glow holds, the climb goes on ───

{
  const player = slinger('t3s-warmonger', 'heavy', [WARMONGER]);
  const target = punchbag(700);
  const reload = player.usesReload!;
  const passives = player.usesSkills.passives;
  const perShot = passives['reload.frame-ramp-pct-per-shot'] ?? 0;
  const topMult = passives['reload.frame-ramp-top-mult'] ?? 0;
  const clip = reload.ammoMax;
  const carry = reloadRampCarry(player);
  const cap = reloadFrameRampCap(player);

  assert(perShot > 0 && topMult > 1, 'the ramp\'s numbers are the Artillerist frame\'s');
  close(carry, 0.5, 'the carry is the node\'s half');
  assert(cap === Math.round(clip / (1 - carry)), `the attack-speed climb tops out where a sustained fight settles (${clip / (1 - carry)}), got ${cap}`);
  assert(cap > clip, 'so the attack speed has room above one clip');

  // The first clip is exactly the Artillerist frame's (design §22.12): the damage
  // rides stacks over ONE clip, never over the carried ceiling, and the glow beats
  // against the clip too.
  const baseCooldown = player.performsAttack.attackCooldown;
  world.takeNodeEvents(NODE);
  const firstClip: number[] = [];
  while (ammoOf(player) > 1) firstClip.push(empoweredMult(fireShot(player, target)));
  const last = landShot(player, target);
  firstClip.push(empoweredMult(last));
  assert(firstClip.length === clip, `fixture: one whole clip, got ${firstClip.length} shots`);
  firstClip.forEach((mult, i) => close(
    mult, 1 + (topMult - 1) * (i / clip),
    `first clip, round ${i + 1}: the frame's own ramp over one clip`,
  ));
  const preReload = stacksOf(player);
  assert(preReload === clip, `one clip climbs one stack a shot: ${clip}, got ${preReload}`);
  close(reloadFrameRampFill(player), 1, 'at the clip\'s end the ramp is full');
  close(
    reloadFramePositionMult(player, 1, clip), topMult,
    `so the clip's end holds the frame's top damage (×${topMult}), as the Artillerist's does`,
  );
  const climb = frameCharges('t3s-warmonger');
  assert(
    climb.length === clip && climb.every((e, i) => e.stacks === i + 1 && e.max === clip),
    `the glow climbs a beat a shot toward one clip, got ${climb.map((e) => `${e.stacks}/${e.max}`).join(' ')}`,
  );
  assert(reload.reloadingMs > 0, 'the clip ran dry and started the reload');

  // The reload-start hooks run on the last shot's tail.
  finishShot(last);
  const carried = stacksOf(player);
  assert(
    carried === Math.floor(preReload * carry),
    `a reload halves the ramp: ${preReload} → ${Math.floor(preReload * carry)}, got ${carried}`,
  );
  assert(carried > 0, 'the ramp is carried, not reset');
  const glow = frameCharges('t3s-warmonger');
  assert(glow.length === 1, `the reload is one glow beat, got ${glow.length}`);
  assert(
    glow[0]!.stacks === carried && glow[0]!.max === clip,
    `the barrel glow holds at the carried ${carried}/${clip} (not the spend), got ${glow[0]!.stacks}/${glow[0]!.max}`,
  );
  close(player.performsAttack.attackCooldown, baseCooldown, 'the base cadence is handed back while reloading');

  finishReload(player);
  assert(stacksOf(player) === carried, `completing the reload must not halve again, got ${stacksOf(player)}`);
  close(player.performsAttack.attackCooldown, baseCooldown, 'the next clip starts off the live base, not a ramped one');

  // The next clip starts where the carry left it, and keeps climbing.
  const first = fireShot(player, target);
  close(
    empoweredMult(first),
    1 + (topMult - 1) * (carried / clip),
    'the first round of the next clip already rides the carried ramp, measured against one clip',
  );
  assert(stacksOf(player) === carried + 1, `the climb continues from the carry, got ${stacksOf(player)}`);
  close(
    player.performsAttack.attackCooldown,
    Math.max(200, Math.round(baseCooldown / (1 + (carried + 1) * perShot))),
    'the cadence is re-derived from the live base at the carried stacks plus the shot',
  );
  world.takeNodeEvents(NODE);
  const secondClip: number[] = [];
  while (ammoOf(player) > 1) secondClip.push(empoweredMult(fireShot(player, target)));
  secondClip.push(empoweredMult(landShot(player, target)));
  assert(
    stacksOf(player) === carried + clip,
    `a second clip's attack speed climbs past what one clip reaches: ${carried + clip}, got ${stacksOf(player)}`,
  );
  assert(stacksOf(player) > clip, 'a sustained fight outclimbs a single clip');
  close(
    player.performsAttack.attackCooldown,
    Math.max(200, Math.round(baseCooldown / (1 + (carried + clip) * perShot))),
    'the attack speed rides every stack past one clip',
  );
  assert(
    secondClip.every((mult) => mult <= topMult + 1e-9),
    `the damage never passes the frame's top (×${topMult}), got up to ×${Math.max(...secondClip)}`,
  );
  close(secondClip[secondClip.length - 1]!, topMult, 'past one clip the damage holds at the top');
  const pastTop = frameCharges('t3s-warmonger');
  assert(
    pastTop.every((e) => e.max === clip && e.stacks <= clip),
    'the glow never passes full',
  );
  assert(
    pastTop.length === clip - (carried + 1),
    `the glow beats only while it moves: ${clip - carried - 1} beats up to full, none past it, got ${pastTop.length}`,
  );
}

// ── Warmonger: a sustained fight settles under the attack-speed cap ──────────

{
  const player = slinger('t3s-warmonger-sustained', 'heavy', [WARMONGER]);
  const target = punchbag(720);
  const cap = reloadFrameRampCap(player);
  const clip = player.usesReload!.ammoMax;
  const topMult = player.usesSkills.passives['reload.frame-ramp-top-mult'] ?? 0;
  const tops: number[] = [];
  let maxMult = 0;
  world.takeNodeEvents(NODE);
  for (let clipNo = 0; clipNo < 8; clipNo++) {
    while (ammoOf(player) > 1) maxMult = Math.max(maxMult, empoweredMult(fireShot(player, target)));
    const last = landShot(player, target);
    maxMult = Math.max(maxMult, empoweredMult(last));
    tops.push(stacksOf(player));
    finishShot(last);
    finishReload(player);
  }
  for (let i = 1; i < tops.length; i++) {
    assert(tops[i]! >= tops[i - 1]!, `each clip tops out at least as high as the last: ${tops.join(', ')}`);
  }
  assert(tops[tops.length - 1]! > tops[0]!, `the climb is sustained across clips: ${tops.join(', ')}`);
  assert(tops[tops.length - 1]! > clip, `the attack speed climbs past one clip: ${tops.join(', ')}`);
  assert(tops.every((top) => top <= cap), `nothing climbs past the cap of ${cap}: ${tops.join(', ')}`);
  close(maxMult, topMult, `and the damage tops out at the frame's ×${topMult}, never above it`);
  assert(
    frameCharges('t3s-warmonger-sustained').every((e) => e.max === clip && e.stacks <= clip),
    'the glow measures against one clip throughout',
  );
}

// ── Warmonger with Refund: one halving per reload, however it completes ──────

{
  // Mid-clip: a kill completes the reload without a reload ever starting. The
  // carry is paid on the completion — once.
  const player = slinger('t3s-warmonger-refund', 'heavy', [WARMONGER]);
  withRefund(player);
  const target = punchbag(740);
  const reload = player.usesReload!;
  const carry = reloadRampCarry(player);
  const baseCooldown = player.performsAttack.attackCooldown;

  for (let shot = 0; shot < 10; shot++) fireShot(player, target);
  assert(stacksOf(player) === 10, `ten shots, ten stacks, got ${stacksOf(player)}`);
  kill(player, target);
  assert(reload.reloadingMs === 0 && ammoOf(player) === reload.ammoMax, 'Refund completed the reload');
  assert(
    stacksOf(player) === Math.floor(10 * carry),
    `a Refund reload halves the ramp once: ${Math.floor(10 * carry)}, got ${stacksOf(player)}`,
  );
  close(player.performsAttack.attackCooldown, baseCooldown, 'and hands back the base, so the next clip cannot compound');
  fireShot(player, target);
  assert(stacksOf(player) === Math.floor(10 * carry) + 1, 'the climb continues from the carry');

  // The last round's own kill: the reload had started (and halved the ramp); Refund
  // cuts it short. Halving again would be the double count.
  fireAllButLast(player, target);
  const last = landShot(player, target);
  const preReload = stacksOf(player);
  finishShot(last);
  const carried = stacksOf(player);
  assert(carried === Math.floor(preReload * carry), 'the started reload halved the ramp');
  kill(player, target);
  assert(reload.reloadingMs === 0, 'Refund cut the reload short');
  assert(
    stacksOf(player) === carried,
    `a Refund completing a started reload must not halve again: ${carried}, got ${stacksOf(player)}`,
  );
}

{
  // The Artillerist alone (no carry) through a Refund kill: the ramp resets, as any
  // reload resets it, and the next clip ramps off the live base, not a ramped one.
  const player = slinger('t3s-artillerist-refund', 'heavy', []);
  withRefund(player);
  const target = punchbag(760);
  const perShot = player.usesSkills.passives['reload.frame-ramp-pct-per-shot'] ?? 0;
  const baseCooldown = player.performsAttack.attackCooldown;
  assert(reloadRampCarry(player) === 0, 'the frame alone carries nothing');

  for (let shot = 0; shot < 6; shot++) fireShot(player, target);
  kill(player, target);
  assert(stacksOf(player) === 0, `a Refund reload resets the Artillerist ramp, got ${stacksOf(player)}`);
  close(player.performsAttack.attackCooldown, baseCooldown, 'and hands the base cadence back');
  fireShot(player, target);
  close(
    player.performsAttack.attackCooldown,
    Math.max(200, Math.round(baseCooldown / (1 + perShot))),
    'the next clip\'s first stack ramps off the live base — no compounding',
  );
}

console.log('t3SlingerPaths: ok');
