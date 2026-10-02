/**
 * The range-node mechanics, wired (progression rework Phase 3, brief §2).
 *
 * WHAT THIS PINS. Not balance — every magnitude here comes off the node and the
 * designer hand-edits those after the bench. What it pins is the GEOMETRY and the
 * wiring, because both failure modes are silent:
 *
 *   - the at-bay band collapsing into "every hit" (no upper or lower edge), which
 *     turns a positional mechanic into a flat stat and looks identical in any test
 *     that only asserts "the slow happened";
 *   - a Far payoff that fires at any distance, same reason;
 *   - the at-bay slow leaking onto a root that did not buy it.
 *
 * So every case here pairs a POSITIVE with the two negatives that bound it, and
 * the distances are derived from the measured `hitboxGap` rather than assumed, so
 * a hitbox change cannot quietly move a band.
 *
 * `onHit` is emitted through the real pipeline (`initCombatSystems()`), so the
 * class mechanics run exactly as they do live. The damage cases deliberately use a
 * player with NO archetype slice, so the only thing that can touch `ctx.damage` is
 * the mechanic under test.
 *
 * Run: node --conditions=development --import tsx test/rangeMechanics.test.ts
 */
import {
  ABILITY_SLOW_EFFECT_ID,
  GAME_CONFIG,
  SKILL_TREE,
  applyStatusEffect,
  baseRecoveryForTier,
  emptyEquipment,
  getStatusEffect,
  hitboxGap,
  posHitboxFromEntity,
  type PassiveMap,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import {
  emitCombatEvent, type CombatContext,
} from '../src/systems/combat/engine/combatPipeline';
import { isAtBay } from '../src/systems/combat/rangeMechanics';
import { STUN_EFFECT } from '../src/systems/combat/status/stun';
import { DOT_EFFECT_ID } from '../src/systems/classes/archetypes/dot/t3/core/constants';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
/** Node ids, so a case reads its mechanic off the authored node, never a literal. */
const LANCER = 'cadence-range-mid';
const PHALANX = 'cooldown-range-mid';
const WARLOCK = 'dot-range-mid';
const ENFORCER = 'reload-range-mid';
const SHADE = 'energy-range-mid';
const PHANTOM_BLADE = 'cadence-range-far';
const SENTINEL = 'cooldown-range-far';
const HARBINGER = 'dot-range-far';
const DEADEYE = 'reload-range-far';
const WISP = 'energy-range-far';

/** The node's own authored keys — the test can never drift from the authoring. */
function authored(nodeId: string): PassiveMap {
  const node = SKILL_TREE.get(nodeId);
  assert(node, `${nodeId} is missing from the skill tree`);
  const effects = node!.mechanicEffects;
  assert(effects && Object.keys(effects).length > 0, `${nodeId} authors no mechanicEffects`);
  return { ...effects } as PassiveMap;
}

function makeSlices(id: string, x: number, y: number): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x, y }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
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

type Archetype = PlayerEntity['usesSkills']['combatArchetype'];

/**
 * A player carrying exactly these passives, at this position, with this
 * archetype's slice (null = none, so nothing but the mechanic under test can
 * touch the exchange).
 */
function spawn(
  id: string,
  at: { x: number; y: number },
  passives: PassiveMap,
  archetype: Archetype = null,
): PlayerEntity {
  const player = world.attachPlayerEntity(makeSlices(id, at.x, at.y), id);
  player.dealsDamage.attack = 100;
  player.usesSkills.passives = { ...passives };
  player.usesSkills.combatArchetype = archetype;
  syncArchetypeSlices(world, player);
  world.takeNodeEvents(NODE);
  return player;
}

function monster(x: number, y: number): MonsterEntity {
  const m = world.createMonster(NODE, 'plains-slime', { x, y });
  if (!m) throw new Error(`failed to spawn a target at ${x},${y}`);
  m.hasHealth.maxHp = 100_000;
  m.hasHealth.hp = 100_000;
  return m;
}

/** Edge-to-edge gap, the same measure the mechanics and the attack gate use. */
function gap(player: PlayerEntity, target: MonsterEntity): number {
  return hitboxGap(posHitboxFromEntity(player), posHitboxFromEntity(target));
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
  world.takeNodeEvents(NODE);
  return ctx;
}

const slowOn = (target: MonsterEntity) =>
  getStatusEffect(target.tracksCombat, ABILITY_SLOW_EFFECT_ID);
const stunOn = (target: MonsterEntity) => getStatusEffect(target.tracksCombat, STUN_EFFECT);
const dotOn = (target: MonsterEntity) => getStatusEffect(target.tracksCombat, DOT_EFFECT_ID);
const vulnOn = (target: MonsterEntity) => getStatusEffect(target.tracksCombat, 'vulnerability');

/** Put `target` in the at-bay band for `player`: inside our reach, outside its own. */
function holdAtBay(player: PlayerEntity, target: MonsterEntity): number {
  const d = gap(player, target);
  player.performsAttack.attackRange = d + 40;
  target.performsAttack.attackRange = Math.max(0, d - 20);
  return d;
}

/** Put `target` in the OUTER `fracKey` band of our reach (a "max reach" hit). */
function holdAtMaxReach(player: PlayerEntity, target: MonsterEntity, frac: number): void {
  // reach ∈ [gap, gap / frac] satisfies gap >= reach × frac and gap <= reach.
  // Halfway through that window, so neither edge is being tested by accident.
  const d = gap(player, target);
  player.performsAttack.attackRange = (d + d / frac) / 2;
}

/** Inside reach but well inside the inner band — a close-quarters hit. */
function holdClose(player: PlayerEntity, target: MonsterEntity, frac: number): void {
  const d = gap(player, target);
  player.performsAttack.attackRange = d / (frac / 2);
}

// ── The at-bay band has both edges ───────────────────────────────────────────

{
  const player = spawn('rm-bay-in', { x: 400, y: 400 }, authored(LANCER));
  const target = monster(520, 400);
  const d = holdAtBay(player, target);
  assert(isAtBay(player, target), `a target ${d}px out, reach ${d + 40}, should be at bay`);

  hit(player, target);
  const slow = slowOn(target);
  assert(slow !== undefined, 'Lancer should slow a target held at bay');
  assert(slow!.data.moveSlowPct === 0.2, `the slow should be the authored 20%, got ${slow!.data.moveSlowPct}`);
  assert(slow!.data.totalMs === 1200, `the slow should carry totalMs for the buff clock, got ${slow!.data.totalMs}`);
}

{
  // Beyond our reach: nothing is being held off, so there is no at-bay hit at all.
  const player = spawn('rm-bay-far', { x: 700, y: 400 }, authored(LANCER));
  const target = monster(820, 400);
  const d = gap(player, target);
  player.performsAttack.attackRange = Math.max(1, d - 20);
  target.performsAttack.attackRange = 0;
  assert(!isAtBay(player, target), 'a target outside our reach is not at bay');

  hit(player, target);
  assert(slowOn(target) === undefined, 'a target outside our reach must not be slowed');
}

{
  // Its own reach covers the distance: it can hit back, so it is not held off.
  const player = spawn('rm-bay-armed', { x: 1000, y: 400 }, authored(LANCER));
  const target = monster(1120, 400);
  const d = gap(player, target);
  player.performsAttack.attackRange = d + 40;
  target.performsAttack.attackRange = d + 20;
  assert(!isAtBay(player, target), 'a target whose own reach covers the gap is not at bay');

  hit(player, target);
  assert(slowOn(target) === undefined, 'a target that can reach us back must not be slowed');
}

{
  // Contact: a body with no authored reach still threatens what it stands on.
  const player = spawn('rm-bay-contact', { x: 1300, y: 400 }, authored(LANCER));
  const target = monster(1300, 400);
  player.performsAttack.attackRange = 60;
  target.performsAttack.attackRange = 0;
  assert(gap(player, target) === 0, 'overlapping hitboxes should measure a zero gap');
  assert(!isAtBay(player, target), 'a target in contact is never at bay, whatever its reach');
}

// ── Only the three roots that bought it ──────────────────────────────────────

{
  const cases: Array<[string, string, Archetype]> = [
    ['rm-slow-lancer', LANCER, 'cadence'],
    ['rm-slow-phalanx', PHALANX, 'cooldown'],
    ['rm-slow-enforcer', ENFORCER, 'reload'],
  ];
  let x = 1600;
  for (const [id, nodeId, archetype] of cases) {
    const player = spawn(id, { x, y: 400 }, authored(nodeId), archetype);
    const target = monster(x + 120, 400);
    holdAtBay(player, target);
    hit(player, target);
    assert(slowOn(target) !== undefined, `${nodeId} should apply the at-bay slow`);
    x += 300;
  }
}

{
  // Shade and Warlock are Mid nodes too, and neither bought the slow.
  const cases: Array<[string, string, Archetype]> = [
    ['rm-noslow-shade', SHADE, 'energy'],
    ['rm-noslow-warlock', WARLOCK, 'dot'],
  ];
  let x = 2500;
  for (const [id, nodeId, archetype] of cases) {
    const player = spawn(id, { x, y: 400 }, authored(nodeId), archetype);
    const target = monster(x + 120, 400);
    holdAtBay(player, target);
    hit(player, target);
    assert(
      slowOn(target) === undefined,
      `${nodeId} must not apply the at-bay slow — only Lancer, Phalanx and Enforcer did`,
    );
    x += 300;
  }
}

{
  // No range node: the hit seam must be inert, damage included.
  const player = spawn('rm-none', { x: 3100, y: 400 }, {});
  const target = monster(3220, 400);
  holdAtBay(player, target);
  const ctx = hit(player, target, {}, 200);
  assert(slowOn(target) === undefined, 'a player with no range node slows nothing');
  assert(ctx.damage === 200, `a player with no range node changes no damage, got ${ctx.damage}`);
  assert(ctx.metadata['empoweredMultiplier'] === undefined, 'and records no multiplier');
}

// ── A blocking evade stops the whole layer ───────────────────────────────────

{
  const player = spawn('rm-evade', { x: 3400, y: 400 }, authored(LANCER));
  const target = monster(3520, 400);
  holdAtBay(player, target);
  hit(player, target, { evadeBlocksDebuffs: true });
  assert(slowOn(target) === undefined, 'an evade that blocks debuffs blocks the at-bay slow');
  hit(player, target);
  assert(slowOn(target) !== undefined, 'and the next landed hit still slows');
}

// ── Phalanx: the execution staggers a target at bay ──────────────────────────

{
  const player = spawn('rm-phalanx', { x: 3700, y: 400 }, authored(PHALANX), 'cooldown');
  const target = monster(3820, 400);
  holdAtBay(player, target);

  hit(player, target);
  assert(stunOn(target) === undefined, 'a regular Phalanx hit does not stagger');

  hit(player, target, { empoweredAttack: true, mechanicConsumed: true });
  const stun = stunOn(target);
  assert(stun !== undefined, 'a Phalanx execution on a target at bay staggers it');
  assert(stun!.remainingMs === 750, `the stagger is the ladder's shortest rung, got ${stun!.remainingMs}`);
}

{
  const player = spawn('rm-phalanx-close', { x: 400, y: 1000 }, authored(PHALANX), 'cooldown');
  const target = monster(520, 1000);
  const d = gap(player, target);
  player.performsAttack.attackRange = d + 40;
  target.performsAttack.attackRange = d + 20; // not at bay
  hit(player, target, { empoweredAttack: true, mechanicConsumed: true });
  assert(stunOn(target) === undefined, 'an execution on a target that can reach back does not stagger');
}

// ── Shade: the discharge staggers a target at bay ────────────────────────────

{
  const player = spawn('rm-shade', { x: 700, y: 1000 }, authored(SHADE), 'energy');
  const target = monster(820, 1000);
  holdAtBay(player, target);

  hit(player, target);
  assert(stunOn(target) === undefined, 'a regular Shade hit does not stagger');

  hit(player, target, { empoweredAttack: true, mechanicConsumed: true });
  assert(stunOn(target) !== undefined, 'a Shade discharge on a target at bay staggers it');
}

// ── Warlock: a stack at bay spreads one to the nearest neighbour ─────────────

{
  const player = spawn('rm-warlock', { x: 1000, y: 1000 }, authored(WARLOCK), 'dot');
  const target = monster(1120, 1000);
  const neighbour = monster(1120, 1080); // 80px from the primary, inside the 140px reach
  holdAtBay(player, target);

  hit(player, target);
  assert(dotOn(target) !== undefined, 'the primary should carry the class DoT');
  assert(dotOn(neighbour) !== undefined, 'Warlock should land one stack on the nearest neighbour');
  assert(dotOn(neighbour)!.stacks === 1, `exactly one stack spreads, got ${dotOn(neighbour)!.stacks}`);
}

{
  const player = spawn('rm-warlock-close', { x: 1600, y: 1000 }, authored(WARLOCK), 'dot');
  const target = monster(1720, 1000);
  const neighbour = monster(1720, 1080);
  const d = gap(player, target);
  player.performsAttack.attackRange = d + 40;
  target.performsAttack.attackRange = d + 20; // not at bay
  hit(player, target);
  assert(dotOn(target) !== undefined, 'the primary still takes its stack');
  assert(dotOn(neighbour) === undefined, 'a stack landed on a target NOT at bay does not spread');
}

{
  // Harbinger suppresses the spread outright (brief §2: "no spread").
  const player = spawn(
    'rm-warlock-harbinger',
    { x: 2200, y: 1000 },
    { ...authored(WARLOCK), ...authored(HARBINGER) },
    'dot',
  );
  const target = monster(2320, 1000);
  const neighbour = monster(2320, 1080);
  holdAtBay(player, target);
  hit(player, target);
  assert(dotOn(target) !== undefined, 'the primary still takes its stack');
  assert(dotOn(neighbour) === undefined, "Harbinger's single-target rule suppresses Warlock's spread");
}

// ── Harbinger: one more stack, and it lasts longer ───────────────────────────

{
  const plain = spawn('rm-dot-plain', { x: 2800, y: 1000 }, {}, 'dot');
  const plainTarget = monster(2920, 1000);
  hit(plain, plainTarget);
  const base = dotOn(plainTarget);
  assert(base !== undefined, 'the baseline Apprentice should apply its class DoT');

  const player = spawn('rm-harbinger', { x: 3100, y: 1000 }, authored(HARBINGER), 'dot');
  const target = monster(3220, 1000);
  hit(player, target);
  const deepened = dotOn(target);
  assert(deepened !== undefined, 'Harbinger should still apply the class DoT');
  assert(
    deepened!.maxStacks === base!.maxStacks + 1,
    `Harbinger holds one extra stack: ${base!.maxStacks} → expected ${base!.maxStacks + 1},`
      + ` got ${deepened!.maxStacks}`,
  );
  assert(
    deepened!.remainingMs > base!.remainingMs,
    `Harbinger's stacks last longer: base ${base!.remainingMs}, got ${deepened!.remainingMs}`,
  );

  // Idempotent: a second hit re-applies the same floor rather than ratcheting.
  const after = deepened!.remainingMs;
  hit(player, target);
  assert(dotOn(target)!.maxStacks === base!.maxStacks + 1, 'the stack cap is bumped once per record');
  assert(
    dotOn(target)!.remainingMs === after,
    `the duration floor is absolute, not compounding: ${after} → ${dotOn(target)!.remainingMs}`,
  );
}

// ── Phantom-Blade: the first hit on a fresh body, from max reach only ────────

{
  const frac = authored(PHANTOM_BLADE)['cadence.range-far-max-reach-pct']!;
  const bonus = authored(PHANTOM_BLADE)['cadence.range-far-opener-pct']!;

  const player = spawn('rm-phantom', { x: 3400, y: 1000 }, authored(PHANTOM_BLADE));
  const far = monster(3520, 1000);
  holdAtMaxReach(player, far, frac);
  const opener = hit(player, far, {}, 200);
  assert(
    opener.damage === Math.floor(200 * (1 + bonus)),
    `the opener should scale the hit by ${1 + bonus}, got ${opener.damage} from 200`,
  );
  assert(
    opener.metadata['empoweredMultiplier'] === 1 + bonus,
    'the opener records itself on empoweredMultiplier — one multiplier per hit',
  );

  const second = hit(player, far, {}, 200);
  assert(second.damage === 200, `only the FIRST hit on a body opens, got ${second.damage}`);

  // A fresh body, but struck from inside the band: no opener.
  const near = monster(3700, 1000);
  holdClose(player, near, frac);
  const close = hit(player, near, {}, 200);
  assert(close.damage === 200, `an opener must not fire from close range, got ${close.damage}`);

  // And a dodged opener is not spent: the band plus a real hit still pays it.
  const dodged = monster(4000, 1000);
  holdAtMaxReach(player, dodged, frac);
  hit(player, dodged, { evadeBlocksDebuffs: true }, 200);
  const landed = hit(player, dodged, {}, 200);
  assert(
    landed.damage === Math.floor(200 * (1 + bonus)),
    `an evaded hit must not burn the opener, got ${landed.damage}`,
  );
}

// ── Deadeye: the long shot, from max reach only ──────────────────────────────

{
  const keys = authored(DEADEYE);
  const frac = keys['reload.range-far-max-reach-pct']!;
  const bonus = keys['reload.range-far-damage-pct']!;

  const player = spawn('rm-deadeye', { x: 400, y: 1600 }, keys);
  const far = monster(520, 1600);
  holdAtMaxReach(player, far, frac);
  const long = hit(player, far, {}, 200);
  assert(
    long.damage === Math.floor(200 * (1 + bonus)),
    `a shot from max range should scale by ${1 + bonus}, got ${long.damage}`,
  );
  assert(long.metadata['empoweredMultiplier'] === 1 + bonus, 'and record itself as the multiplier');

  // Unlike the opener, it is not once per body — only once per band.
  const again = hit(player, far, {}, 200);
  assert(again.damage === Math.floor(200 * (1 + bonus)), 'every shot from max range hits harder');

  holdClose(player, far, frac);
  const close = hit(player, far, {}, 200);
  assert(close.damage === 200, `a shot from inside the band is an ordinary shot, got ${close.damage}`);
}

// ── Sentinel: an execution from max reach opens a vulnerability window ───────

{
  const keys = authored(SENTINEL);
  const frac = keys['cooldown.range-far-max-reach-pct']!;
  const pct = keys['cooldown.range-far-vuln-pct']!;
  const ms = keys['cooldown.range-far-vuln-ms']!;

  const player = spawn('rm-sentinel', { x: 700, y: 1600 }, keys, 'cooldown');
  const target = monster(820, 1600);
  holdAtMaxReach(player, target, frac);

  hit(player, target);
  assert(vulnOn(target) === undefined, 'a regular hit opens no window');

  hit(player, target, { empoweredAttack: true, mechanicConsumed: true });
  const vuln = vulnOn(target);
  assert(vuln !== undefined, 'an execution from max reach opens the vulnerability window');
  assert(
    Math.abs((vuln!.data.damageMultiplier ?? 0) - (1 + pct)) < 1e-9,
    `the window should carry ×${1 + pct}, got ${vuln!.data.damageMultiplier}`,
  );
  assert(vuln!.remainingMs === ms, `the window should run ${ms}ms, got ${vuln!.remainingMs}`);
}

{
  const keys = authored(SENTINEL);
  const player = spawn('rm-sentinel-close', { x: 1000, y: 1600 }, keys, 'cooldown');
  const target = monster(1120, 1600);
  holdClose(player, target, keys['cooldown.range-far-max-reach-pct']!);
  hit(player, target, { empoweredAttack: true, mechanicConsumed: true });
  assert(vulnOn(target) === undefined, 'an execution from inside the band opens no window');
}

{
  // §18.1 max-wins: never a weaker brand, never a shorter window than what stands.
  const keys = authored(SENTINEL);
  const player = spawn('rm-sentinel-maxwins', { x: 1300, y: 1600 }, keys, 'cooldown');
  const target = monster(1420, 1600);
  holdAtMaxReach(player, target, keys['cooldown.range-far-max-reach-pct']!);
  applyStatusEffect(target.tracksCombat, {
    id: 'vulnerability',
    maxStacks: 1,
    refreshable: true,
    remainingMs: 9_000,
    sourceId: 'stronger-source',
    data: { totalMs: 9_000, damageMultiplier: 1.5 },
  });
  hit(player, target, { empoweredAttack: true, mechanicConsumed: true });
  const vuln = vulnOn(target);
  assert(vuln !== undefined, 'the record survives');
  assert(vuln!.data.damageMultiplier === 1.5, `the stronger multiplier stands, got ${vuln!.data.damageMultiplier}`);
  assert(vuln!.remainingMs === 9_000, `the longer window stands, got ${vuln!.remainingMs}`);
}

// ── Wisp: the key is authored here, the consumer lives in the energy loop ────

{
  const keys = authored(WISP);
  assert(
    keys['energy.range-far-single-target'] === 1,
    'Wisp must author `energy.range-far-single-target: 1` — the energy frame loop reads it',
  );
  // The seam is the KEY, not a listener: this module deliberately does not consume
  // it, so a Wisp player's hit is otherwise untouched here.
  const player = spawn('rm-wisp', { x: 1600, y: 1600 }, keys, 'energy');
  const target = monster(1720, 1600);
  holdAtBay(player, target);
  const ctx = hit(player, target, {}, 200);
  assert(slowOn(target) === undefined, 'Wisp applies no at-bay slow');
  assert(stunOn(target) === undefined, 'Wisp staggers nothing');
  assert(
    ctx.metadata['empoweredMultiplier'] === undefined,
    'and the range layer adds no multiplier of its own for Wisp',
  );
}

// ── Close nodes and the Conduit's three are untouched ────────────────────────

{
  for (const nodeId of [
    'cadence-range-close', 'cooldown-range-close', 'dot-range-close',
    'reload-range-close', 'energy-range-close',
  ]) {
    const effects = SKILL_TREE.get(nodeId)?.mechanicEffects ?? {};
    const rangeKeys = Object.keys(effects).filter((key) => key.includes('.range-'));
    assert(
      rangeKeys.length === 0,
      `${nodeId} keeps its existing payoffs and gains no range mechanic, found ${rangeKeys.join(', ')}`,
    );
  }
  for (const nodeId of ['summoner-range-close', 'summoner-range-mid', 'summoner-range-far']) {
    const effects = SKILL_TREE.get(nodeId)?.mechanicEffects ?? {};
    assert(
      Object.keys(effects).length === 0,
      `${nodeId} is unchanged by design — the Conduit's range nodes already are their mechanic`,
    );
  }
}

console.log('rangeMechanics: ok');
