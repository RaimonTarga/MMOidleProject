import { GAME_CONFIG, MONSTER_DATABASE, STARTER_RUNE_IDS, emptyEquipment, STANCE_RECIPE_DATABASE } from '@mmo-idle/shared';
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
  const { world, boss, pattern, now } = setup(id);
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
  assert(boss.runsBossPattern!.stepEndsAtMs - (next + 100) < guard.castMs, `${id}: next flee casts faster`);
  updateBossPatterns(world, 100, boss.runsBossPattern!.stepEndsAtMs);
  assert(escapeInstinct(boss) === 0, `${id}: successful escape clears stacks`);
  clearBossPatternState(world, boss);
  assert(!boss.isConcealed && !boss.isMoving, `${id}: reset cleans motion and concealment`);
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
  clearBossPatternState(world, boss);
  let clock = now + pattern.cooldownMs * 3;
  const cap = pattern.chargeInstinct!.maxStacks;
  for (let attempt = 1; attempt <= cap + 2; attempt++) {
    clock += pattern.cooldownMs + 5000;
    player.hasPosition.current = { x: 2700, y: 2400 };
    updateBossPatterns(world, 100, clock);
    boss.runsBossPattern!.stepIndex = chargeIndex - 1;
    const windup = bossPatternFor(boss)!.steps[chargeIndex - 1];
    assert(windup.kind === 'cast', 'charge wind-up remains authored');
    updateBossPatterns(world, 100, clock + 100);
    player.hasPosition.current = { x: 2400, y: 2700 };
    clock += 100 + windup.castMs;
    updateBossPatterns(world, 100, clock);
    assert(chargeInstinct(boss) === Math.min(cap, attempt), `${id}: repeated dodges respect the cap`);
    endPattern(world, boss, 'completed', clock);
  }
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
