/**
 * Frame loops — Striker, Squire, Apprentice (progression rework Phase 3; brief
 * `docs/briefs/frame-loops-2026-10-01.md` §1).
 *
 * WHAT THIS FILE HOLDS. The SHAPE of each loop, never its balance numbers:
 *
 *   - a window is strictly shorter than one cycle (otherwise the loop collapses
 *     into a flat stat, design §10) and its uptime RISES with attack speed;
 *   - a bank is capped at threshold−1 and is emptied by the mechanic that spends
 *     it, folding into the hit's ONE multiplier rather than a second one;
 *   - the Heavy riders land: the Striker staggers through the stun ladder, the
 *     Squire strips plating through the shared record;
 *   - the Apprentice's three verbs fire exactly when their element says they do —
 *     the Venom opener once per fresh target, Ember's bonus only at max burn, and
 *     Frost's chill scaling one stack per frost stack.
 *
 * The authored magnitudes come from `SKILL_TREE` rather than being retyped here,
 * so a designer hand-editing a frame after the bench moves this test with it
 * instead of breaking it.
 *
 * Run: node --conditions=development --import tsx test/frameLoops.test.ts
 */
import {
  GAME_CONFIG,
  SKILL_TREE,
  baseRecoveryForTier,
  emptyEquipment,
  getStatusEffect,
  getTotalStacks,
  hasStatusEffect,
  mergePassives,
  removeStatusEffect,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { emitCombatEvent, type CombatContext } from '../src/systems/combat/engine/combatPipeline';
import { setEmpoweredAttack } from '../src/systems/combat/engine/empoweredAttacks';
import { updateCooldownArchetype } from '../src/systems/classes/archetypes/cooldown/cooldownPrototype';
import { updateMonsterSlows } from '../src/systems/combat/status/monsterControl';
import {
  frameWindowEffect,
  getFrameCharge,
} from '../src/systems/classes/shared/frameLoop';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
const BASE_DAMAGE = 100;

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

/**
 * A player wearing exactly one frame, with that frame's AUTHORED effects folded
 * into its passives the same way `recalculatePlayerStats` folds a skill node's.
 */
function spawn(id: string, archetype: string, frameNodeId: string): PlayerEntity {
  const player = world.attachPlayerEntity(makeSlices(id), id);
  player.usesSkills.combatArchetype = archetype as PlayerEntity['usesSkills']['combatArchetype'];
  const frame = SKILL_TREE.get(frameNodeId);
  assert(frame, `${frameNodeId}: frame node is missing from the skill tree`);
  player.usesSkills.selectedSubVariant = frame.subVariantId ?? null;
  mergePassives(player.usesSkills.passives, frame.mechanicEffects);
  syncArchetypeSlices(world, player);
  return player;
}

function monster(x: number): MonsterEntity {
  const m = world.createMonster(NODE, 'plains-slime', { x, y: 400 });
  if (!m) throw new Error('failed to spawn a target');
  return m;
}

/** One exchange, run through both phases the frame loops listen on. */
function hit(
  player: PlayerEntity,
  defender: MonsterEntity,
  metadata: Record<string, unknown> = {},
): CombatContext {
  const ctx = {
    attacker: player, attackerType: 'player',
    defender, defenderType: 'monster',
    damage: BASE_DAMAGE, platingMult: 1, drPierce: 0, cancelled: false, metadata,
  } as unknown as CombatContext;
  emitCombatEvent('beforeAttack', ctx, world);
  emitCombatEvent('onHit', ctx, world);
  return ctx;
}

const authored = (nodeId: string, key: string): number => {
  const value = (SKILL_TREE.get(nodeId)?.mechanicEffects as Record<string, number> | undefined)?.[key];
  assert(typeof value === 'number', `${nodeId} must author ${key}`);
  return value as number;
};

// ── Striker / Flurry: the window is shorter than the cycle, and its uptime ─────
// rises with attack speed.

{
  const player = spawn('fl-flurry', 'cadence', 'cadence-light');
  const target = monster(500);

  /** Fire a finisher and report (window, cycle) at the given attack cooldown. */
  function windowAtCooldown(cooldownMs: number): { windowMs: number; cycleMs: number } {
    player.performsAttack.attackCooldown = cooldownMs;
    // A regular hit first: the cadence counter resolves `threshold` lazily, and
    // the cycle length is read off it.
    hit(player, target);
    const threshold = player.usesCadence!.threshold;
    assert(threshold === 4, `Flurry's cycle should be 4 hits, got ${threshold}`);
    setEmpoweredAttack(world, player);
    const ctx = hit(player, target);
    assert(ctx.metadata['empoweredAttack'] === true, 'the finisher should have fired');
    const effect = frameWindowEffect(player, 'cadence');
    assert(effect, 'the finisher must open the frame window');
    return { windowMs: effect!.remainingMs, cycleMs: threshold * cooldownMs };
  }

  const slow = windowAtCooldown(1_000);
  assert(
    slow.windowMs > 0 && slow.windowMs < slow.cycleMs,
    `the window (${slow.windowMs}ms) must be strictly shorter than one cycle (${slow.cycleMs}ms)`,
  );
  assert(
    slow.windowMs === authored('cadence-light', 'cadence.frame-window-ms'),
    `an unclamped window should be exactly as authored, got ${slow.windowMs}ms`,
  );

  const fast = windowAtCooldown(700);
  assert(
    fast.windowMs < fast.cycleMs,
    `the window must stay shorter than the cycle at speed, got ${fast.windowMs}/${fast.cycleMs}`,
  );
  assert(
    fast.windowMs / fast.cycleMs > slow.windowMs / slow.cycleMs,
    `uptime must rise with attack speed: ${fast.windowMs}/${fast.cycleMs} vs ${slow.windowMs}/${slow.cycleMs}`,
  );

  // A window that would outlast its cycle is clamped, not trusted.
  const squeezed = windowAtCooldown(600);
  assert(
    squeezed.windowMs < squeezed.cycleMs,
    `a clamped window must still be shorter than the cycle, got ${squeezed.windowMs}/${squeezed.cycleMs}`,
  );
  assert(
    squeezed.windowMs < authored('cadence-light', 'cadence.frame-window-ms'),
    'a cycle shorter than the authored window must clamp it',
  );

  // And the window is what makes a regular hit bigger — through the ONE multiplier.
  player.performsAttack.attackCooldown = 1_000;
  const inWindow = hit(player, target);
  const windowMult = authored('cadence-light', 'cadence.frame-window-mult');
  assert(
    inWindow.metadata['empoweredMultiplier'] === windowMult,
    `a hit inside the window records one multiplier (${windowMult}), got ${String(inWindow.metadata['empoweredMultiplier'])}`,
  );
  assert(
    inWindow.damage === Math.floor(BASE_DAMAGE * windowMult),
    `a hit inside the window should scale by the window, got ${inWindow.damage}`,
  );

  // The HUD contract: the window IS a status effect with that id, carrying the
  // full duration its clock needs (a remaining fraction cannot be turned back
  // into seconds).
  const wired = getStatusEffect(player.tracksCombat, 'frame.cadence.window');
  assert(wired, 'the window must be a `frame.<root>.window` status effect');
  assert(
    wired!.data['totalMs'] === authored('cadence-light', 'cadence.frame-window-ms'),
    `the window must carry totalMs for the buff clock, got ${wired!.data['totalMs']}`,
  );

  const effect = frameWindowEffect(player, 'cadence')!;
  effect.remainingMs = 0;
  const outOfWindow = hit(player, target);
  assert(
    outOfWindow.metadata['empoweredMultiplier'] === undefined && outOfWindow.damage === BASE_DAMAGE,
    'a hit outside the window must be an ordinary hit',
  );
}

// ── Striker / Breaker: the bank caps at threshold−1, the finisher empties it ───

{
  const player = spawn('fl-breaker', 'cadence', 'cadence-heavy');
  const target = monster(520);
  const perStack = authored('cadence-heavy', 'cadence.frame-charge-per-stack');
  const staggerMs = authored('cadence-heavy', 'cadence.frame-stagger-ms');

  world.takeNodeEvents(NODE); // start from a clean slate for the glow events below
  let highest = 0;
  let finishers = 0;
  let spentFrom = 0;
  // Three full cycles of the REAL loop: the counting handler arms the finisher on
  // its own, so this is the live rhythm rather than a hand-placed empowered hit.
  for (let i = 0; i < 18; i++) {
    const before = getFrameCharge(player.tracksCombat, 'cadence');
    const ctx = hit(player, target);
    const after = getFrameCharge(player.tracksCombat, 'cadence');
    highest = Math.max(highest, before, after);
    if (ctx.metadata['empoweredAttack']) {
      finishers++;
      spentFrom = before;
      assert(after === 0, `the finisher must empty the bank, left ${after}`);
      assert(
        ctx.metadata['empoweredMultiplier'] ===
          authored('cadence-heavy', 'cadence.empowered-mult') + before * perStack,
        `the bank must fold into ONE multiplier, got ${String(ctx.metadata['empoweredMultiplier'])}`,
      );
    }
    const cap = player.usesCadence!.threshold - 1;
    assert(after <= cap, `the bank must never pass threshold−1 (${cap}), got ${after}`);
  }
  assert(finishers >= 2, `three cycles should contain at least two finishers, got ${finishers}`);
  assert(
    highest === player.usesCadence!.threshold - 1,
    `the bank should reach exactly threshold−1, peaked at ${highest}`,
  );
  assert(spentFrom > 0, 'a finisher should have had charge to spend');

  // The weapon glow's beat. One event per real change — never per hit — carrying
  // the cap authoritatively, and a `stacks: 0` as the finisher spends the bank.
  const charges = world.takeNodeEvents(NODE).filter((event) => event.kind === 'frame-charge');
  assert(charges.length > 0, 'banking charge must tell the node about it');
  assert(
    charges.every((event) =>
      event.kind === 'frame-charge' &&
      event.playerId === 'fl-breaker' &&
      event.max === player.usesCadence!.threshold - 1 &&
      event.stacks <= event.max),
    'every frame-charge must carry this player, the real cap, and a bank inside it',
  );
  assert(
    charges.some((event) => event.kind === 'frame-charge' && event.stacks === 0),
    'the spend must be announced too, or the glow never goes out',
  );

  // The rider. Through `applyStun`, so the stun-immunity window applies to it like
  // any other control — which is why only the FIRST finisher staggers.
  assert(
    hasStatusEffect(target.tracksCombat, 'stunned') ||
      hasStatusEffect(target.tracksCombat, 'stun-immune'),
    'the Breaker finisher must stagger what it hits',
  );
  const fresh = monster(540);
  player.tracksCombat.resources['frame.cadence.charge'] = 2;
  setEmpoweredAttack(world, player);
  const staggered = hit(player, fresh);
  assert(staggered.metadata['empoweredAttack'] === true, 'the finisher should have fired');
  const stun = getStatusEffect(fresh.tracksCombat, 'stunned');
  assert(stun, 'a fresh target must be staggered by the finisher');
  assert(
    stun!.remainingMs === staggerMs,
    `the stagger should be the authored ${staggerMs}ms, got ${stun!.remainingMs}`,
  );
}

// ── Squire / Warrior: the window shortens the next recharge, never past the floor ─

{
  const player = spawn('fl-warrior', 'cooldown', 'cooldown-light');
  const target = monster(560);
  const cycleMs = authored('cooldown-light', 'cooldown.empowered-cd-ms');
  const refundMs = authored('cooldown-light', 'cooldown.frame-refund-ms');
  updateCooldownArchetype(world, 0); // first pass starts the preparation cycle

  setEmpoweredAttack(world, player);
  const execution = hit(player, target);
  assert(execution.metadata['empoweredAttack'] === true, 'the execution should have fired');
  const window = frameWindowEffect(player, 'cooldown');
  assert(window, 'the execution must open the frame window');
  assert(
    window!.remainingMs < cycleMs,
    `the window (${window!.remainingMs}ms) must be shorter than the recharge (${cycleMs}ms)`,
  );
  assert(
    player.usesCooldown!.executionCooldownMs === cycleMs,
    'the execution restarts the recharge before the window opens',
  );

  hit(player, target);
  assert(
    player.usesCooldown!.executionCooldownMs === cycleMs - refundMs,
    `a hit in the window must cut exactly ${refundMs}ms, got ${player.usesCooldown!.executionCooldownMs}`,
  );

  // The floor: the last quarter of a recharge is always paid in real time.
  player.usesCooldown!.executionCooldownMs = cycleMs * 0.25 + 10;
  hit(player, target);
  assert(
    player.usesCooldown!.executionCooldownMs === cycleMs * 0.25,
    `the refund must stop at the floor, got ${player.usesCooldown!.executionCooldownMs}`,
  );
  hit(player, target);
  assert(
    player.usesCooldown!.executionCooldownMs === cycleMs * 0.25,
    'at the floor, further hits refund nothing',
  );

  // Outside the window it is an ordinary hit.
  player.usesCooldown!.executionCooldownMs = cycleMs;
  frameWindowEffect(player, 'cooldown')!.remainingMs = 0;
  hit(player, target);
  assert(
    player.usesCooldown!.executionCooldownMs === cycleMs,
    'a hit outside the window must not touch the recharge',
  );
}

// ── Squire / Bulwark: the authored bank, and the plating-shred rider ──────────

{
  const player = spawn('fl-bulwark', 'cooldown', 'cooldown-heavy');
  const target = monster(580);
  const cap = authored('cooldown-heavy', 'cooldown.frame-charge-cap');
  const perStack = authored('cooldown-heavy', 'cooldown.frame-charge-per-stack');
  const shredPct = authored('cooldown-heavy', 'cooldown.frame-shred-pct');
  updateCooldownArchetype(world, 0);

  for (let i = 0; i < cap + 4; i++) hit(player, target);
  assert(
    getFrameCharge(player.tracksCombat, 'cooldown') === cap,
    `the bank should sit at its authored cap ${cap}, got ${getFrameCharge(player.tracksCombat, 'cooldown')}`,
  );
  assert(
    frameWindowEffect(player, 'cooldown') === undefined,
    'a Heavy frame authors no window, so none should open',
  );

  const plating = target.mitigatesDamage.plating;
  setEmpoweredAttack(world, player);
  const execution = hit(player, target);
  assert(execution.metadata['empoweredAttack'] === true, 'the execution should have fired');
  assert(
    getFrameCharge(player.tracksCombat, 'cooldown') === 0,
    'the execution must empty the bank',
  );
  assert(
    execution.metadata['empoweredMultiplier'] ===
      authored('cooldown-heavy', 'cooldown.empowered-mult') + cap * perStack,
    `the bank must fold into ONE multiplier, got ${String(execution.metadata['empoweredMultiplier'])}`,
  );
  const shred = getStatusEffect(target.tracksCombat, 'plating-shred');
  assert(shred, 'the Bulwark execution must strip plating');
  assert(
    shred!.data['platingReduction'] === Math.max(1, Math.round(plating * shredPct)),
    `the strip should be ${shredPct} of the target's plating, got ${shred!.data['platingReduction']}`,
  );
}

// ── Apprentice / Venom vessel: opens hard, once per fresh target ──────────────

{
  const player = spawn('fl-venom', 'dot', 'dot-light');
  const opener = authored('dot-light', 'dot.frame-opener-stacks');
  const target = monster(600);

  hit(player, target);
  assert(
    getTotalStacks(target.tracksCombat, 'dot') === opener,
    `the opener should land ${opener} stacks, got ${getTotalStacks(target.tracksCombat, 'dot')}`,
  );

  hit(player, target);
  assert(
    getTotalStacks(target.tracksCombat, 'dot') === opener + 1,
    `a second hit adds one ordinary stack, got ${getTotalStacks(target.tracksCombat, 'dot')}`,
  );
  hit(player, target);
  assert(
    getTotalStacks(target.tracksCombat, 'dot') === opener + 2,
    'the opener must not fire again while poison is on the target',
  );

  // A second target is its own opening.
  const other = monster(620);
  hit(player, other);
  assert(
    getTotalStacks(other.tracksCombat, 'dot') === opener,
    `a fresh target opens hard too, got ${getTotalStacks(other.tracksCombat, 'dot')}`,
  );

  // And once the poison is gone, so is the memory of having opened.
  removeStatusEffect(other.tracksCombat, 'dot');
  hit(player, other);
  assert(
    getTotalStacks(other.tracksCombat, 'dot') === opener,
    'a target that lost its poison is a fresh target again',
  );
}

// ── Apprentice / Ember mage: intensifies, only at max burn ────────────────────

{
  const player = spawn('fl-ember', 'dot', 'dot-balanced');
  const mult = authored('dot-balanced', 'dot.frame-max-stack-mult');
  const maxStacks = authored('dot-balanced', 'dot.max-stacks');
  const target = monster(640);

  let belowMaxDamage = 0;
  for (let i = 0; i < maxStacks; i++) {
    const ctx = hit(player, target);
    assert(
      ctx.metadata['empoweredMultiplier'] === undefined,
      `a hit below max burn must not be amplified (stack ${i + 1})`,
    );
    belowMaxDamage = ctx.damage;
  }
  assert(
    getTotalStacks(target.tracksCombat, 'dot') === maxStacks,
    `the burn should be at its cap, got ${getTotalStacks(target.tracksCombat, 'dot')}`,
  );

  const atMax = hit(player, target);
  assert(
    atMax.metadata['empoweredMultiplier'] === mult,
    `a hit into max burn records the frame's multiplier, got ${String(atMax.metadata['empoweredMultiplier'])}`,
  );
  assert(
    atMax.damage === Math.floor(belowMaxDamage * mult),
    `a hit into max burn should scale by ${mult}: ${belowMaxDamage} → ${atMax.damage}`,
  );
}

// ── Apprentice / Rime-Bound: chills, one chill stack per frost stack ──────────

{
  const player = spawn('fl-rime', 'dot', 'dot-heavy');
  const perStack = authored('dot-heavy', 'dot.chill-move-slow-per-stack');
  const chillCap = authored('dot-heavy', 'dot.chill-max-stacks');
  const target = monster(660);

  const slows: number[] = [];
  for (let i = 0; i < chillCap; i++) {
    hit(player, target);
    const frost = getTotalStacks(target.tracksCombat, 'dot');
    const chill = getStatusEffect(target.tracksCombat, 'dot-chill');
    assert(chill, `every frost stack must chill (hit ${i + 1})`);
    assert(
      chill!.stacks === frost,
      `chill mirrors frost: ${chill!.stacks} chill vs ${frost} frost`,
    );
    assert(target.hasChill !== undefined, 'a chilled monster carries the hasChill marker');
    updateMonsterSlows(world);
    slows.push(1 - (target.hasStatus.monsterMoveSpeedMult ?? 1));
  }

  assert(
    slows.every((slow, index) => Math.abs(slow - (index + 1) * perStack) < 1e-9),
    `the slow must scale per stack (${perStack} each), got ${slows.join(', ')}`,
  );
  assert(slows[slows.length - 1] > slows[0], 'a deeper chill must slow more');

  // Winter Warden owns the chill at T3 — the frame stands down rather than
  // advancing the same record twice per hit (and never duplicates the freeze).
  const warden = spawn('fl-warden', 'dot', 'dot-heavy');
  mergePassives(warden.usesSkills.passives, SKILL_TREE.get('dot-heavy-t3-b')!.mechanicEffects);
  const wardenTarget = monster(680);
  hit(warden, wardenTarget);
  const wardenChill = getStatusEffect(wardenTarget.tracksCombat, 'dot-chill');
  assert(
    wardenChill === undefined || wardenChill.stacks === 1,
    `Winter Warden's own chill must advance once per hit, got ${wardenChill?.stacks ?? 0}`,
  );
  // The deepened record is the SAME chill, resolved from frame + path.
  assert(
    (warden.usesSkills.passives['dot.chill-max-stacks'] ?? 0) === 9,
    `Winter Warden should still resolve to 9 chill stacks, got ${warden.usesSkills.passives['dot.chill-max-stacks']}`,
  );
  assert(
    Math.abs((warden.usesSkills.passives['dot.chill-move-slow-per-stack'] ?? 0) - 0.05) < 1e-9,
    'Winter Warden should still resolve to a 5% move slow per chill stack',
  );
}

console.log('frameLoops: ok');
