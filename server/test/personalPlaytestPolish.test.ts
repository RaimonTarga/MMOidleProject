import { fleeDestination } from '../src/systems/combat/ai/bossFlee';
import { inflateShape, segmentEntryT } from '@mmo-idle/shared';
import { navigationPadForEntity } from '../src/systems/world/movement';
import { updateMovement } from '../src/systems/world/movement';
import { setMovePath } from '../src/systems/world/pathMotion';
import { getCounter, GAME_CONFIG, MONSTER_DATABASE, STARTER_RUNE_IDS, emptyEquipment, STANCE_RECIPE_DATABASE } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { attachComponent } from '../src/ecs/markerHelpers';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { bossPatternFor, chargeInstinct, escapeInstinct, clearBossPatternState, endPattern, updateBossPatterns } from '../src/systems/combat/ai/bossPatterns';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { sourceBarrierRemaining } from '../src/systems/combat/engine/sourceBarriers';
import { applyEnemyShield } from '../src/systems/combat/engine/monsterMechanics';
import { applyStun } from '../src/systems/combat/status/stun';
function assert(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
const NODE = 'node-5-5';
function playerSlices(id: string, x = 405, y = 400, nodeId = NODE): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x, y }, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      attunedAbilities: { technique: null, guard: null }, knownStances: [],
      equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

initCombatSystems();
function setup(id: string) {
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('test', 2400, 2400), 'test');
  attachComponent(world, player, 'cannotAttack', {});
  player.mitigatesDamage.plating = 0;
  player.mitigatesDamage.damageReduction = 0;
  const boss = world.createMonster(NODE, id, { x: 2440, y: 2400 });
  assert(boss, `${id}: monster must spawn`);
  setAggroTarget(world, boss, { id: 'test', kind: 'player' }, 1000);
  boss.hasAwareness.state = 'attacking';
  const pattern = MONSTER_DATABASE.get(id)!.bossPattern!;
  const now = 1100 + (pattern.initialCooldownMs ?? pattern.cooldownMs);
  return { world, player, boss, pattern, now };
}

// Breaks which also stun used to take the generic interrupt exit and lose Instinct.
for (const id of ['jungle-dread-gorger', 'apex-bramble-slasher', 'verdant-crown-predator']) {
  const { world, player, boss, pattern, now } = setup(id);
  updateBossPatterns(world, 100, now);
  updateBossPatterns(world, 100, now + 100);
  const guard = pattern.steps.find(s => s.kind === 'escape-guard')!;
  assert(guard.kind === 'escape-guard' && guard.flee, 'escape should flee');
  const initialSpeed = boss.hasPosition.speed;
  const remaining = sourceBarrierRemaining(boss, 'jungle-escape');
  assert(remaining > 0, `${id}: shield raised`);
  applyEnemyShield(boss, MONSTER_DATABASE.get(id), remaining, 0);
  applyStun(boss.tracksCombat, 500, 'test');
  world.tick(100, now + 200);
  assert(escapeInstinct(boss) === 1, `${id}: shield-breaking stun banks Instinct`);
  assert(boss.recoversFromPattern?.fromStagger, `${id}: break buys recovery`);
  assert(!boss.isMoving && !boss.isConcealed, `${id}: broken escape stops in the open`);
  assert(boss.hasStatus.bossEffectStacks?.['escape-instinct'] === 1, `${id}: live tick publishes stack`);
  // Script status rebuilds must not erase the stack on the following tick.
  world.tick(100, now + 300);
  assert(boss.hasStatus.bossEffects?.includes('escape-instinct'), `${id}: visible across ticks`);
  for (let t = now + 400; t < now + 1000; t += 100) world.tick(100, t);
  const next = now + pattern.cooldownMs + 100;
  updateBossPatterns(world, 100, next);
  updateBossPatterns(world, 100, next + 100);
  assert(boss.hasPosition.speed > initialSpeed, `${id}: next flee moves faster`);
  assert(boss.runsBossPattern!.stepEndsAtMs - (next + 100) === guard.castMs, `${id}: Instinct never shortens the fleeing deadline`);
  boss.hasPosition.current = { x: player.hasPosition.current.x + guard.flee.escapeDistance + 10, y: player.hasPosition.current.y };
  updateBossPatterns(world, 100, boss.runsBossPattern!.stepEndsAtMs);
  assert(escapeInstinct(boss) === 0, `${id}: successful escape clears stacks`);
  clearBossPatternState(world, boss);
  assert(!boss.isConcealed && !boss.isMoving, `${id}: reset cleans motion and concealment`);
}

// A fleeing boss must spend its whole movement budget across short path segments.
{
  const { world, boss, now } = setup('apex-bramble-slasher');
  updateBossPatterns(world, 100, now);
  updateBossPatterns(world, 100, now + 100);
  const start = { ...boss.hasPosition.current };
  const goal = { x: start.x + 200, y: start.y };
  setMovePath(world, boss, goal, [10, 20, 200].map(dx => ({ x: start.x + dx, y: start.y })), 'monster');
  for (let tick = 1; tick <= 4; tick++) {
    updateMovement(world, 100, now + 100 + tick * 100);
    assert(Math.abs(boss.hasPosition.current.x - start.x - boss.hasPosition.speed * 0.1 * tick) < 0.01,
      'fleeing carries unused movement across waypoints instead of pausing at each one');
  }
}

// Fleeing preserves a working route, but turns away when the pursuer changes sides.
{
  const { world, player, boss, now } = setup('apex-bramble-slasher');
  player.hasPosition.current.y += 40;
  updateBossPatterns(world, 100, now);
  updateBossPatterns(world, 100, now + 100);
  const endpoint = boss.runsBossPattern!.capturedEndpoint!;
  assert(!boss.hasMovePath && boss.isMoving, 'flee uses a direct outward line');
  for (let tick = 1; tick <= 8; tick++) {
    world.tick(100, now + 100 + tick * 100);
    assert(!boss.hasMovePath && boss.isMoving, 'flee never detours through a path around the player');
    assert(boss.runsBossPattern!.capturedEndpoint === endpoint, 'escape destination stays fixed while the player stays put');
  }
  player.hasPosition.current = { x: boss.hasPosition.current.x + 150, y: boss.hasPosition.current.y };
  updateBossPatterns(world, 100, now + 1400);
  const redirected = boss.runsBossPattern!.capturedEndpoint!;
  assert(redirected.x < boss.hasPosition.current.x && boss.isMoving, 'crossing ahead redirects the fleeing boss away without stopping it');
}

// Being across the player from the spawn must not turn fleeing into circling them.
{
  const { world, player, boss } = setup('apex-bramble-slasher');
  boss.hasPosition.current = { x: 2600, y: 2400 };
  player.hasPosition.current = { x: 2500, y: 2400 };
  const straight = fleeDestination(world, boss, player)!;
  assert(straight && straight.x > boss.hasPosition.current.x && Math.abs(straight.y - 2400) < 0.01,
    'retreat follows the boss-to-player axis, regardless of spawn position');
  const blockShapes = world.collision.blockShapes.bind(world.collision);
  const wall = { kind: 'rect' as const, x: 2700, y: 2400, halfW: 10, halfH: 80 };
  world.collision.blockShapes = () => [wall];
  const detour = fleeDestination(world, boss, player)!;
  assert(detour && detour.x > boss.hasPosition.current.x && Math.abs(detour.y - 2400) > 1,
    'a blocked retreat takes an outward detour, not a route through the player');
  assert(segmentEntryT(boss.hasPosition.current, detour, inflateShape(wall, navigationPadForEntity(boss))) === null,
    'detour segment is clear for the whole boss body');
  world.collision.blockShapes = blockShapes;
  boss.hasPosition.current.x = boss.controlsMonster.spawn.x + boss.controlsMonster.leashRange - 2;
  player.hasPosition.current = { x: boss.hasPosition.current.x - 100, y: boss.hasPosition.current.y };
  assert(fleeDestination(world, boss, player) === null, 'at the leash edge, do not reverse through the player');
}

// Distance, not a timer, gates escape. Exercise stationary, pursued and clean retreats.
for (const id of ['jungle-dread-gorger', 'apex-bramble-slasher', 'verdant-crown-predator']) {
  for (const mode of ['stationary', 'pursued', 'escaped', 'break-at-distance']) {
    const { world, player, boss, pattern, now } = setup(id);
    updateBossPatterns(world, 100, now);
    updateBossPatterns(world, 100, now + 100);
    const guard = pattern.steps.find(s => s.kind === 'escape-guard')!;
    assert(guard.kind === 'escape-guard' && guard.flee, 'distance escape authored');
    assert(boss.isMoving && !boss.isRooted, `${id}: flee starts visible movement immediately`);
    const deadline = boss.runsBossPattern!.stepEndsAtMs;
    if (mode === 'stationary') {
      // Even the player running away cannot turn a stationary boss's cast into escape.
      player.hasPosition.current.x -= 600;
    } else {
      boss.hasPosition.current.x += guard.flee.escapeDistance;
      if (mode === 'pursued') player.hasPosition.current.x = boss.hasPosition.current.x - 40;
      if (mode === 'break-at-distance') applyEnemyShield(boss, MONSTER_DATABASE.get(id), sourceBarrierRemaining(boss, guard.sourceId), 0);
    }
    updateBossPatterns(world, 100, mode === 'escaped' || mode === 'break-at-distance' ? now + 200 : deadline + 1);
    if (mode === 'escaped') {
      assert(boss.isConcealed, `${id}: real distance succeeds before the deadline`);
      assert(sourceBarrierRemaining(boss, guard.sourceId) === 0, `${id}: successful escape clears shield`);
    } else {
      assert(!boss.isConcealed && !boss.runsBossPattern, `${id}/${mode}: failed escape never enters stealth`);
      assert(!boss.isMoving && boss.hasPosition.speed === MONSTER_DATABASE.get(id)!.stats.speed, `${id}/${mode}: failure restores movement`);
      assert(sourceBarrierRemaining(boss, guard.sourceId) === 0, `${id}/${mode}: no stranded shield`);
      if (mode === 'break-at-distance') assert(boss.recoversFromPattern?.fromStagger && escapeInstinct(boss) === 1, `${id}: shield break wins over distance success`);
      else assert(escapeInstinct(boss) === 1, `${id}/${mode}: failed distance escape banks Instinct, including T2`);
    }
  }
}

// T2 failed pursuits accumulate visibly without a cap, then reset after actual escape.
{
  const { world, player, boss, pattern, now } = setup('jungle-dread-gorger');
  const guard = pattern.steps.find(s => s.kind === 'escape-guard')!;
  assert(guard.kind === 'escape-guard' && guard.flee, 'T2 fleeing config');
  let clock = now;
  for (let attempt = 1; attempt <= 12; attempt++) {
    updateBossPatterns(world, 100, clock);
    updateBossPatterns(world, 100, clock + 100);
    assert(Math.abs(boss.hasPosition.speed - guard.flee.speed * (1 + (attempt - 1) * guard.instinctSpeedPct!)) < 1e-6,
      'T2 Instinct accelerates the next retreat');
    updateBossPatterns(world, 100, clock + 100 + guard.castMs);
    updateBossPatterns(world, 100, clock + 200 + guard.castMs);
    assert(boss.hasStatus.bossEffectStacks?.['escape-instinct'] === attempt,
      'T2 timeout stacks are visible beyond the old cap');
    clock += pattern.cooldownMs + 1000;
  }
  updateBossPatterns(world, 100, clock);
  updateBossPatterns(world, 100, clock + 100);
  boss.hasPosition.current = { x: player.hasPosition.current.x + guard.flee.escapeDistance + 10, y: player.hasPosition.current.y };
  updateBossPatterns(world, 100, clock + 200);
  assert(boss.isConcealed && escapeInstinct(boss) === 0, 'T2 actual escape clears all timeout-earned stacks');
}

// A real chase must move gradually, surface near the player, and bite with all venom stacks.
for (const [id, stacks] of [['apex-bramble-slasher', 3], ['verdant-crown-predator', 4]] as const) {
  const { world, player, boss, now } = setup(id);
  let concealed = false;
  let poisoned = false;
  for (let t = now; t < now + 14000; t += 100) {
    const before = { ...boss.hasPosition.current };
    const wasHidden = !!boss.isConcealed;
    world.tick(100, t);
    if (boss.isConcealed) {
      if (!wasHidden) {
        const flee = MONSTER_DATABASE.get(id)!.bossPattern!.steps.find(s => s.kind === 'escape-guard')!;
        assert(flee.kind === 'escape-guard' && flee.flee, 'flee config');
        assert(Math.hypot(before.x - player.hasPosition.current.x, before.y - player.hasPosition.current.y) >= flee.flee.escapeDistance, `${id}: live movement earned the escape gap`);
      }
      concealed = true;
      assert(boss.hasPosition.speed <= 300, `${id}: prowl speed stays readable`);
    }
    if (wasHidden && boss.isConcealed) {
      const travelled = Math.hypot(boss.hasPosition.current.x - before.x, boss.hasPosition.current.y - before.y);
      assert(travelled <= 30.01, `${id}: no stealth teleport (${travelled})`);
    }
    const venom = player.tracksCombat.statusEffects.find(e => e.sourceId === boss.isMonster.id && e.data.isDot === 1);
    if (venom) {
      assert(venom.stacks === stacks, `${id}: bite applies all ${stacks} stacks`);
      assert(player.hasDot, `${id}: poison is attached to the canonical DoT tick`);
      poisoned = true;
      break;
    }
  }
  assert(concealed && poisoned, `${id}: flee -> prowl -> venomous bite runs in the world`);
}

// Range and evasion deny the bite's venom, rather than a later status cast applying it anyway.
for (const mode of ['out-of-range', 'evaded'] as const) {
  const { world, player, boss, pattern, now } = setup('apex-bramble-slasher');
  updateBossPatterns(world, 100, now);
  boss.runsBossPattern!.stepIndex = pattern.steps.findIndex(s => s.kind === 'payoff');
  if (mode === 'out-of-range') player.hasPosition.current.x -= 1000;
  else attachComponent(world, player, 'evadesHits', { dodgeRate: 1, charge: 0, evadeMitigation: 1 });
  const hp = player.hasHealth.hp;
  updateBossPatterns(world, 100, now + 100);
  updateBossPatterns(world, 100, now + 1000);
  assert(player.hasHealth.hp === hp, `${mode}: bite deals no damage`);
  assert(!player.tracksCombat.statusEffects.some(e => e.data.isDot), `${mode}: no poison`);
}

for (const id of ['crag-behemoth', 'stoneplate-juggernaut', 'crag-gorged-horn-behemoth', 'iron-crest-titan']) {
  const { world, player, boss, pattern, now } = setup(id);
  const laterTier = id === 'crag-gorged-horn-behemoth' || id === 'iron-crest-titan';
  assert(Boolean(pattern.chargeInstinct!.cooldownReductionPct) === laterTier, `${id}: cooldown ramp exists only at T3/T4`);
  const chargeIndex = pattern.steps.findIndex(s => s.kind === 'charge');
  const cast = pattern.steps[chargeIndex - 1];
  assert(cast.kind === 'cast' && cast.lane, `${id}: charge has a tell`);
  // Aim with the player away from the starting body; then dodge the locked lane.
  player.hasPosition.current = { x: 2700, y: 2400 };
  updateBossPatterns(world, 100, now);
  boss.runsBossPattern!.stepIndex = chargeIndex - 1;
  updateBossPatterns(world, 100, now + 100);
  player.hasPosition.current = { x: 2400, y: 2700 };
  updateBossPatterns(world, 100, now + 100 + cast.castMs);
  assert(chargeInstinct(boss) === 1, `${id}: performing a charge banks Instinct`);
  endPattern(world, boss, 'completed', now + 200 + cast.castMs);
  const enhanced = bossPatternFor(boss)!;
  const nextCast = enhanced.steps[chargeIndex - 1];
  const nextCharge = enhanced.steps[chargeIndex];
  const originalCharge = pattern.steps[chargeIndex];
  assert(nextCast.kind === 'cast' && nextCast.castMs < cast.castMs, `${id}: next cast shortens`);
  assert(nextCharge.kind === 'charge' && originalCharge.kind === 'charge' && nextCharge.speed > originalCharge.speed, `${id}: next charge accelerates`);
  updateBossScripts(world, 100);
  updateBossPatterns(world, 100, now + pattern.cooldownMs + 5000);
  assert(boss.hasStatus.bossEffectStacks?.['charge-instinct'] === 1, `${id}: visible Instinct`);
  boss.runsBossPattern!.stepIndex = chargeIndex - 1;
  updateBossPatterns(world, 100, now + pattern.cooldownMs + 5100);
  player.hasPosition.current = { ...boss.hasPosition.current };
  updateBossPatterns(world, 100, now + pattern.cooldownMs + 5100 + nextCast.castMs);
  assert(chargeInstinct(boss) === 0, `${id}: a landed charge clears the ramp`);
  if (pattern.chargeInstinct!.cooldownReductionPct) {
    assert(getCounter(boss.tracksCombat, 'bossPatternCdNextAt') === now + pattern.cooldownMs + 5100 + nextCast.castMs + pattern.cooldownMs,
      `${id}: landed hit replaces the accelerated cooldown with the normal one`);
  }
  clearBossPatternState(world, boss);
  let clock = now + pattern.cooldownMs * 3;
  for (let attempt = 1; attempt <= 30; attempt++) {
    clock += pattern.cooldownMs + 5000;
    player.hasPosition.current = { x: 2700, y: 2400 };
    updateBossPatterns(world, 100, clock);
    const expectedCooldown = bossPatternFor(boss)!.cooldownMs;
    assert(getCounter(boss.tracksCombat, 'bossPatternCdNextAt') === clock + expectedCooldown, `${id}: live scheduler uses ramped cooldown`);
    boss.runsBossPattern!.stepIndex = chargeIndex - 1;
    const windup = bossPatternFor(boss)!.steps[chargeIndex - 1];
    assert(windup.kind === 'cast', 'charge wind-up remains authored');
    updateBossPatterns(world, 100, clock + 100);
    player.hasPosition.current = { x: 2400, y: 2700 };
    clock += 100 + windup.castMs;
    updateBossPatterns(world, 100, clock);
    assert(chargeInstinct(boss) === attempt, `${id}: repeated dodges accumulate without a cap`);
    const ramped = bossPatternFor(boss)!;
    const rampedCast = ramped.steps[chargeIndex - 1];
    const rampedCharge = ramped.steps[chargeIndex];
    assert(rampedCast.kind === 'cast' && rampedCast.castMs === Math.max(pattern.chargeInstinct!.minCastMs, cast.castMs * (1 - pattern.chargeInstinct!.castReductionPct) ** attempt), `${id}: wind-up shrinks to its readable minimum`);
    assert(rampedCharge.kind === 'charge' && originalCharge.kind === 'charge' &&
      Math.abs(rampedCharge.speed - originalCharge.speed * (1 + attempt * pattern.chargeInstinct!.speedPct)) < 1e-6, `${id}: speed keeps growing`);
    const cdReduction = pattern.chargeInstinct!.cooldownReductionPct ?? 0;
    assert(ramped.cooldownMs === (cdReduction ? Math.max(1000, pattern.cooldownMs * (1 - cdReduction) ** attempt) : pattern.cooldownMs), `${id}: only later tiers ramp cooldown`);
    for (let i = 0; i < pattern.steps.length; i++) {
      const original = pattern.steps[i];
      if (original.kind !== 'charge' && !(original.kind === 'cast' && original.lane)) {
        assert(JSON.stringify(ramped.steps[i]) === JSON.stringify(original), `${id}: other steps unchanged`);
      }
    }
    endPattern(world, boss, 'completed', clock);
  }
  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.24;
  updateBossScripts(world, 100);
  const phaseCast = bossPatternFor(boss)!.steps[chargeIndex - 1];
  assert(phaseCast.kind === 'cast' && phaseCast.castMs >= pattern.chargeInstinct!.minCastMs,
    `${id}: phase empowerment also respects the minimum wind-up`);
  clearBossPatternState(world, boss);
  assert(chargeInstinct(boss) === 0 && !boss.hasStatus.bossEffects?.includes('charge-instinct'), `${id}: reset clears visible Instinct`);
}

// Both finishers arm at 25%, resolve the authored raw hit through armor, and stay spent.
for (const [id, raw] of [['cinder-shell-magma-salamander', 650], ['caldera-sovereign', 1000]] as const) {
  const { world, player, boss, now } = setup(id);
  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.26;
  updateBossPatterns(world, 100, now);
  assert(!boss.runsBossPattern, `${id}: no early finisher`);
  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.25;
  player.mitigatesDamage.plating = 100;
  player.mitigatesDamage.damageReduction = 0.2;
  const hp = player.hasHealth.hp;
  for (let t = now + 100; t <= now + 10000; t += 100) {
    if (t === now + 8100) applyStun(boss.tracksCombat, 2000, 'test');
    updateBossPatterns(world, 100, t);
  }
  assert(hp - player.hasHealth.hp === Math.round((raw - 100) * 0.8), `${id}: raw finisher respects plating and DR`);
  updateBossPatterns(world, 100, now + 100000);
  assert(!boss.runsBossPattern, `${id}: finisher is once per life`);
}
const early = [...STANCE_RECIPE_DATABASE.values()].filter(r => r.tier === 2).map(r => r.stanceId).sort();
assert(JSON.stringify(early) === JSON.stringify(['defensive-stance', 'fleeting-stance', 'offensive-stance']), 'T2 has exactly the three introductory stances');
for (const recipe of STANCE_RECIPE_DATABASE.values()) assert([2, 3, 4].includes(recipe.tier), `${recipe.id}: stance has a supported tier`);
console.log('personalPlaytestPolish: ok');
