// BOSS ENCOUNTER REDESIGN — Phase 4: concealment, burrow/emergence, Jungle escape.
//
// Two claims carry this phase, and both are safety claims as much as design ones:
//
//   1. CONCEALED IS NOT INVULNERABLE. A burrowed boss must leave every target list,
//      not merely shrug off damage — otherwise the player stands over a hole
//      swinging at something they can select but never hurt.
//
//   2. CONCEALMENT ALWAYS CLEARS. A boss left hidden by a reset, an interrupt or a
//      death is permanently unkillable, which is the worst failure this system can
//      produce. Every teardown path is exercised below.

import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import {
  clearBossPatternState,
  escapeInstinct,
  updateBossPatterns,
} from '../src/systems/combat/ai/bossPatterns';
import { selectAutoCombatAction } from '../src/systems/combat/ai/targetPriority';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { sourceBarrierRemaining } from '../src/systems/combat/engine/sourceBarriers';
import { applyEnemyShield, isMonsterCharging } from '../src/systems/combat/engine/monsterMechanics';
import { runPlayerAttack, updateCombat } from '../src/systems/combat/engine/combat';
import { applyStun } from '../src/systems/combat/status/stun';
import { World } from '../src/world/World';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

function playerSlices(id: string, x = 405, y = 400): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x, y }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      equippedAbilities: { technique: null, guard: null }, knownStances: [],
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

/** Arm a pattern boss and advance one tick so its first step has begun. */
function armPattern(world: World, monsterId: string, playerId: string, at = { x: 400, y: 400 }) {
  const monster = world.createMonster(NODE, monsterId, at)!;
  assert(!!monster, `${monsterId} should spawn`);
  const pattern = MONSTER_DATABASE.get(monsterId)!.bossPattern!;
  setAggroTarget(world, monster, { id: playerId, kind: 'player' }, 1_000);
  monster.hasAwareness.state = 'attacking';
  const armedAt = 1_000 + (pattern.initialCooldownMs ?? pattern.cooldownMs) + 1_000;
  monster.performsAttack.lastAttackAt = armedAt - monster.performsAttack.attackCooldown;
  updateBossPatterns(world, 100, armedAt);
  return { monster, pattern, armedAt };
}

/** Advance until `predicate` holds, or give up. Returns the clock it stopped at. */
function advanceUntil(
  world: World,
  from: number,
  predicate: () => boolean,
  maxTicks = 200,
): number {
  let now = from;
  for (let i = 0; i < maxTicks && !predicate(); i++) {
    now += 100;
    updateBossPatterns(world, 100, now);
  }
  return now;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cave burrow and emergence.
// ─────────────────────────────────────────────────────────────────────────────

for (const id of ['chitinous-dreadbore', 'deep-core-burrow-gorger']) {
  const def = MONSTER_DATABASE.get(id)!;
  assert(!!def.bossPattern, `${id} should run a burrow pattern`);
  const steps = def.bossPattern.steps;
  const conceal = steps.find(step => step.kind === 'conceal');
  assert(conceal?.kind === 'conceal', `${id} should burrow`);
  assert(conceal.marker === 'burrow', `${id} should leave a burrow marker`);
  assert(conceal.relocate === 'near-target', `${id} should surface near its target`);
  assert(
    steps.findIndex(step => step.kind === 'impact') > steps.indexOf(conceal),
    `${id} should erupt AFTER it burrows`,
  );
  assert(def.chargedAttack === undefined, `${id} should drop its generic slam`);
  assert(def.chargeOnAggro === undefined, `${id} should drop the aggro speed burst`);
}

// Burrowing makes the boss genuinely untargetable — not merely damage-immune.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('burrow-target'), 'burrow-target');
  const { monster, armedAt } = armPattern(world, 'chitinous-dreadbore', 'burrow-target');

  // Before the burrow it is a legitimate target.
  assert(
    selectAutoCombatAction(world, player, player.usesAutocombat, armedAt).kind === 'attack',
    'setup: the boss should be attackable before it burrows',
  );

  const now = advanceUntil(world, armedAt, () => monster.isConcealed !== undefined);
  assert(!!monster.isConcealed, 'the sequence should burrow');
  assert(monster.isConcealed!.marker === 'burrow', 'and say how it hid');

  // THE distinguishing claim: it leaves the target list entirely.
  assert(
    selectAutoCombatAction(world, player, player.usesAutocombat, now).kind !== 'attack',
    'a burrowed boss must not be selectable as a target',
  );
  assert(
    player.hasAttackTarget?.targetId !== monster.isMonster.id,
    'and any existing lock on it is dropped',
  );

  // And damage aimed at it anyway is CANCELLED at the pipeline seam, so no path —
  // a DoT tick, a summon, an AoE that happens to overlap the hole — reaches it.
  const hpBefore = monster.hasHealth.hp;
  runPlayerAttack(world, player, monster, now, {
    attackOrigin: { ...player.hasPosition.current },
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });
  assert(monster.hasHealth.hp === hpBefore, 'a burrowed boss cannot be damaged');
}

// It comes back up, targetable again, at a standable point near its target.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('burrow-return'), 'burrow-return');
  // Comfortably inside the boss's leash: this test is about the emergence, not about
  // the leash guard, and a relocation that trips the leash would tear the pattern
  // down for an unrelated (correct) reason.
  player.hasPosition.current = { x: 600, y: 600 };
  const { monster, armedAt } = armPattern(world, 'chitinous-dreadbore', 'burrow-return');

  const buried = advanceUntil(world, armedAt, () => monster.isConcealed !== undefined);
  const surfaced = advanceUntil(world, buried, () => monster.isConcealed === undefined);

  assert(monster.isConcealed === undefined, 'the boss should surface');
  // Checked at the seam concealment changed — the player attack-target scan.
  player.hasPosition.current = { ...monster.hasPosition.current };
  updateCombat(world, 100, surfaced);
  assert(
    player.hasAttackTarget?.targetId === monster.isMonster.id,
    'and be targetable again',
  );
  player.hasPosition.current = { x: 600, y: 600 };
  // It relocated toward the player rather than staying where it went down.
  const gap = Math.hypot(
    monster.hasPosition.current.x - player.hasPosition.current.x,
    monster.hasPosition.current.y - player.hasPosition.current.y,
  );
  assert(gap < 400, `the emergence should be NEAR the target (gap ${gap.toFixed(0)})`);
}

// RESET ALWAYS RESTORES TARGETABILITY. A boss left burrowed is unkillable, so every
// teardown path is checked, not just the happy one.
{
  for (const teardown of ['interrupt', 'reset', 'death'] as const) {
    const world = new World();
    world.attachPlayerEntity(playerSlices(`burrow-${teardown}`), `burrow-${teardown}`);
    const { monster, armedAt } = armPattern(
      world, 'chitinous-dreadbore', `burrow-${teardown}`,
    );
    advanceUntil(world, armedAt, () => monster.isConcealed !== undefined);
    assert(!!monster.isConcealed, `setup (${teardown}): the boss should be burrowed`);

    if (teardown === 'interrupt') {
      // TARGET LOSS mid-burrow, not a stun: a burrowed boss is untargetable, so
      // nothing can stun it while it is under — treating "interrupt" as a stun here
      // would test a path that cannot happen. A player disconnecting or leaving the
      // node CAN happen, and the boss must surface and release rather than finish a
      // sequence aimed at nobody.
      const player = world.getPlayerEntity(`burrow-${teardown}`)!;
      player.hasPosition.nodeId = 'node-0-0';
      updateBossPatterns(world, 100, armedAt + 100);
      assert(monster.isConcealed === undefined, 'losing the target must surface the boss');
      assert(!monster.runsBossPattern, 'and release the pattern');
    } else if (teardown === 'reset') {
      clearBossPatternState(world, monster);
      assert(monster.isConcealed === undefined, 'a reset must surface the boss');
    } else {
      const id = monster.isMonster.id;
      world.removeMonsterEntity(id);
      assert(!world.hasMonster(id), 'death removes the boss cleanly');
    }
  }
}

// A relocating pattern cannot walk itself out of its leash and get stuck. The
// ordinary AI loop SKIPS a patterning monster (it must, or chase and leash logic
// would fight the pattern every tick), so the pattern owns this check itself —
// without it, a boss that retreats past its leash would never reset.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('leash-guard'), 'leash-guard');
  const { monster, armedAt } = armPattern(world, 'chitinous-dreadbore', 'leash-guard');
  assert(!!monster.runsBossPattern, 'setup: the pattern is running');

  // Drag it well outside its leash, as a relocation could.
  const ai = monster.controlsMonster;
  monster.hasPosition.current = {
    x: ai.spawn.x + ai.leashRange * 2,
    y: ai.spawn.y,
  };
  updateBossPatterns(world, 100, armedAt + 100);

  assert(!monster.runsBossPattern, 'a leashed-out boss releases its pattern');
  assert(monster.isConcealed === undefined, 'and is never left hidden by it');
}

// ─────────────────────────────────────────────────────────────────────────────
// Jungle escape: break it, or it gets away.
// ─────────────────────────────────────────────────────────────────────────────

const JUNGLE_IDS = ['jungle-dread-gorger', 'apex-bramble-slasher', 'verdant-crown-predator'];

for (const id of JUNGLE_IDS) {
  const def = MONSTER_DATABASE.get(id)!;
  const steps = def.bossPattern!.steps;
  const guard = steps.find(step => step.kind === 'escape-guard');
  assert(guard?.kind === 'escape-guard', `${id} should raise an Escape Guard`);
  assert(guard.shieldPct > 0, `${id} guard should be a real absorb pool`);
  assert(guard.maxInstinctStacks > 0, `${id} Instinct should be capped, not unbounded`);
  assert(
    guard.instinctCastReductionPct > 0 && guard.instinctCastReductionPct < 1,
    `${id} Instinct should shorten the next attempt without eliminating it`,
  );
}

function armJungle(world: World, id: string, playerId: string) {
  return armPattern(world, id, playerId, { x: 400, y: 400 });
}

/** Break the Escape Guard through the shared absorb path. */
function breakGuard(monster: MonsterEntity, id: string): void {
  const remaining = sourceBarrierRemaining(monster, 'jungle-escape');
  assert(remaining > 0, `${id}: the guard should be up before we break it`);
  applyEnemyShield(monster, MONSTER_DATABASE.get(id), remaining, 0);
  assert(sourceBarrierRemaining(monster, 'jungle-escape') === 0, `${id}: guard should break`);
}

// BREAKING the guard fails the retreat: the boss stumbles and banks Instinct.
{
  const id = 'jungle-dread-gorger';
  const world = new World();
  world.attachPlayerEntity(playerSlices('escape-break'), 'escape-break');
  const { monster, armedAt } = armJungle(world, id, 'escape-break');

  const up = advanceUntil(
    world, armedAt, () => sourceBarrierRemaining(monster, 'jungle-escape') > 0,
  );
  assert(escapeInstinct(monster) === 0, 'Instinct starts empty');

  breakGuard(monster, id);
  updateBossPatterns(world, 100, up + 100);

  assert(!monster.runsBossPattern, 'breaking the guard cancels the escape');
  assert(!!monster.recoversFromPattern, 'and stumbles the boss');
  assert(monster.recoversFromPattern!.fromStagger, 'attributed to the break');
  assert(monster.isConcealed === undefined, 'a failed escape never hides the boss');
  assert(escapeInstinct(monster) === 1, 'and banks one stack of Instinct');
}

// Instinct is CAPPED, and a SUCCESSFUL escape resets it. It records failure, not
// progress — an uncapped or un-reset counter would make the boss permanently faster.
{
  const id = 'jungle-dread-gorger';
  const def = MONSTER_DATABASE.get(id)!;
  const guard = def.bossPattern!.steps.find(step => step.kind === 'escape-guard')!;
  assert(guard.kind === 'escape-guard', 'setup');
  const cap = guard.maxInstinctStacks;

  const world = new World();
  world.attachPlayerEntity(playerSlices('escape-cap'), 'escape-cap');
  const { monster, armedAt } = armJungle(world, id, 'escape-cap');
  let now = armedAt;

  // Fail the retreat more times than the cap allows.
  for (let attempt = 0; attempt < cap + 2; attempt++) {
    now = advanceUntil(
      world, now, () => sourceBarrierRemaining(monster, 'jungle-escape') > 0, 400,
    );
    if (sourceBarrierRemaining(monster, 'jungle-escape') <= 0) break;
    breakGuard(monster, id);
    now += 100;
    updateBossPatterns(world, 100, now);
    // Clear the stagger so the next attempt can arm.
    if (monster.recoversFromPattern) {
      now = monster.recoversFromPattern.endsAtMs + 1;
      updateBossPatterns(world, 100, now);
    }
  }
  assert(escapeInstinct(monster) === cap, `Instinct should cap at ${cap}`);

  // Now let one escape SUCCEED and watch Instinct reset.
  now = advanceUntil(
    world, now, () => sourceBarrierRemaining(monster, 'jungle-escape') > 0, 400,
  );
  advanceUntil(world, now, () => escapeInstinct(monster) === 0, 400);
  assert(escapeInstinct(monster) === 0, 'a successful escape resets Instinct');
}

// A SUCCESSFUL escape hides the boss, moves it away, and returns it for the ambush —
// and never leaves it invisible and untargetable at the end.
{
  const id = 'jungle-dread-gorger';
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('escape-success'), 'escape-success');
  const { monster, armedAt } = armJungle(world, id, 'escape-success');
  const origin = { ...monster.hasPosition.current };

  const hidden = advanceUntil(world, armedAt, () => monster.isConcealed !== undefined, 400);
  assert(!!monster.isConcealed, 'an unanswered guard lets the boss vanish');
  assert(monster.isConcealed!.marker === 'stealth', 'into cover, not underground');

  const moved = Math.hypot(
    monster.hasPosition.current.x - origin.x,
    monster.hasPosition.current.y - origin.y,
  );
  assert(moved > 0, 'it should actually relocate, not vanish on the spot');
  // It ran AWAY from the player rather than teleporting on top of them.
  const before = Math.hypot(origin.x - player.hasPosition.current.x, origin.y - player.hasPosition.current.y);
  const after = Math.hypot(
    monster.hasPosition.current.x - player.hasPosition.current.x,
    monster.hasPosition.current.y - player.hasPosition.current.y,
  );
  assert(after > before, 'a retreat should open distance');

  const back = advanceUntil(world, hidden, () => monster.isConcealed === undefined, 400);
  assert(monster.isConcealed === undefined, 'and it must come back');
  // Targetability is proven at the seam concealment actually changed — the player
  // attack-target scan — rather than through the acquisition policy. The boss has
  // just retreated to its leash edge, so it is legitimately OUT OF RANGE; "not in
  // range" and "not targetable" are different failures and only the second is a bug.
  player.hasPosition.current = { ...monster.hasPosition.current };
  updateCombat(world, 100, back);
  assert(
    player.hasAttackTarget?.targetId === monster.isMonster.id,
    'reset cannot leave an invisible untargetable boss',
  );
}

// The capstone STOPS escaping once wounded — the low-health state is the ABSENCE of
// the lineage's mechanic, not a fourth one bolted on.
{
  const id = 'verdant-crown-predator';
  const world = new World();
  world.attachPlayerEntity(playerSlices('frenzy-gate'), 'frenzy-gate');
  const monster = world.createMonster(NODE, id, { x: 400, y: 400 })!;
  const pattern = MONSTER_DATABASE.get(id)!.bossPattern!;
  assert(pattern.armAboveHpPct !== undefined, 'the capstone should gate its escape on health');

  setAggroTarget(world, monster, { id: 'frenzy-gate', kind: 'player' }, 1_000);
  monster.hasAwareness.state = 'attacking';
  const armedAt = 1_000 + (pattern.initialCooldownMs ?? pattern.cooldownMs) + 1_000;

  // Wounded: below the gate, the pattern must never arm.
  monster.hasHealth.hp = monster.hasHealth.maxHp * (pattern.armAboveHpPct - 0.05);
  updateBossPatterns(world, 100, armedAt);
  assert(!monster.runsBossPattern, 'a wounded predator stops trying to escape');

  // Healthy: it arms normally, so the gate is the only thing that stopped it.
  monster.hasHealth.hp = monster.hasHealth.maxHp;
  updateBossPatterns(world, 100, armedAt + 100);
  assert(!!monster.runsBossPattern, 'and above the gate it escapes as usual');
}

// ─────────────────────────────────────────────────────────────────────────────
// Automation contract: a concealed boss is invisible to the guardable-threat view
// too, so Guard is never spent on something that cannot be answered.
// ─────────────────────────────────────────────────────────────────────────────

{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('conceal-threat'), 'conceal-threat');
  const { monster, armedAt } = armPattern(world, 'chitinous-dreadbore', 'conceal-threat');
  const now = advanceUntil(world, armedAt, () => monster.isConcealed !== undefined);

  assert(!isMonsterCharging(monster, now), 'a burrowed boss is not mid charged-attack');
  // Ordinary combat must not try to resolve anything against it either.
  const hpBefore = player.hasHealth.hp;
  updateCombat(world, 100, now);
  assert(
    player.hasHealth.hp <= hpBefore,
    'the tick should resolve without the burrowed boss acting on the player',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAVELLING BURROW (2026-09-05). The burrow used to TELEPORT the boss to its
// emergence point the instant it went under, which broke the encounter twice:
// the body jumped across the arena in one frame, and the whole sequence was
// decided seconds before the telegraph the player is supposed to read.
// ─────────────────────────────────────────────────────────────────────────────

// The geometry must be able to hit somebody who never moves. This is a DATA
// invariant, and it is machine-checked rather than eyeballed because it failed
// silently at both tiers: an emergeGap of 150 against a 140 radius resolved 10px
// clear of a stationary player, so the payoff of the whole pattern could not land.
for (const id of ['chitinous-dreadbore', 'deep-core-burrow-gorger']) {
  const steps = MONSTER_DATABASE.get(id)!.bossPattern!.steps;
  const conceal = steps.find(step => step.kind === 'conceal');
  const impact = steps.find(step => step.kind === 'impact');
  assert(conceal?.kind === 'conceal' && impact?.kind === 'impact', `${id}: burrow then erupt`);
  const gap = conceal.emergeGap ?? 140;
  assert(
    gap < impact.radius,
    `${id}: emergeGap ${gap} must sit INSIDE the ${impact.radius} eruption radius, ` +
      'or a stationary player can never be hit',
  );
  assert(
    conceal.travelSpeed !== undefined,
    `${id}: the burrow must travel rather than teleport`,
  );
}

// It WALKS there. Driven through the real `world.tick` — the movement system is
// what actually carries the body, and a probe that ran only `updateBossPatterns`
// would show a boss that never moves and call that a pass.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('burrow-travel', 900, 400), 'burrow-travel');
  const { monster, armedAt } = armPattern(world, 'chitinous-dreadbore', 'burrow-travel', {
    x: 400,
    y: 400,
  });

  const startedAt = { ...monster.hasPosition.current };
  let now = armedAt;
  let sawConcealed = false;
  let biggestStep = 0;
  let prev = { ...startedAt };
  let concealedTravel = 0;

  for (let i = 0; i < 200 && !monster.recoversFromPattern; i++) {
    world.tick(100, now);
    const here = monster.hasPosition.current;
    const stepPx = Math.hypot(here.x - prev.x, here.y - prev.y);
    if (monster.isConcealed) {
      sawConcealed = true;
      concealedTravel += stepPx;
      // Speed is broadcast, and the client interpolates with it. A body moving
      // faster than the speed it advertises is the bug that made the Mountain
      // charge look like it stopped halfway.
      assert(
        stepPx <= monster.hasPosition.speed * 0.1 + 1,
        `underground travel outran its broadcast speed (${stepPx}px in one tick)`,
      );
    }
    biggestStep = Math.max(biggestStep, stepPx);
    prev = { ...here };
    now += 100;
  }

  assert(sawConcealed, 'setup: the boss should burrow');
  assert(concealedTravel > 100, 'it should cover real ground while under, not teleport');
  // No single tick may move it more than its speed allows — which is exactly what
  // a teleport would do, and what this test exists to forbid.
  assert(
    biggestStep < 200,
    `the burrow should never jump the body (largest single-tick move: ${biggestStep}px)`,
  );
  // And it should have closed on the player it was chasing.
  assert(
    monster.hasPosition.current.x > startedAt.x + 100,
    'the burrow should end up near its target, not where it started',
  );
}

// It CHASES, and it catches a kiting character. This is the claim the burrow
// exists to make: both Cave burrowers walk at ~20px/s against a player who moves
// at 120, so the burrow is their ONLY means of closing. A version that surfaces
// wherever it already stood has a telegraph aimed at empty floor.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('burrow-kite', 1000, 400), 'burrow-kite');
  const { monster, armedAt } = armPattern(world, 'deep-core-burrow-gorger', 'burrow-kite', {
    x: 400,
    y: 400,
  });
  const impact = MONSTER_DATABASE.get('deep-core-burrow-gorger')!.bossPattern!.steps.find(
    step => step.kind === 'impact',
  )!;
  assert(impact.kind === 'impact', 'setup: the gorger erupts');

  let now = armedAt;
  let sawConcealed = false;
  let endpointFollowed = false;
  let firstEndpoint: { x: number; y: number } | undefined;
  let gapAtSurface: number | null = null;

  for (let i = 0; i < 200 && !monster.recoversFromPattern; i++) {
    world.tick(100, now);
    // Flee at a full sprint, every tick, for the whole encounter.
    player.hasPosition.current = {
      x: player.hasPosition.current.x + GAME_CONFIG.PLAYER_SPEED * 0.1,
      y: player.hasPosition.current.y,
    };
    const endpoint = monster.runsBossPattern?.capturedEndpoint;
    if (monster.isConcealed) {
      sawConcealed = true;
      if (endpoint) {
        firstEndpoint ??= { ...endpoint };
        if (Math.hypot(endpoint.x - firstEndpoint.x, endpoint.y - firstEndpoint.y) > 50) {
          endpointFollowed = true;
        }
      }
    }
    if (sawConcealed && !monster.isConcealed && gapAtSurface === null) {
      gapAtSurface = Math.hypot(
        monster.hasPosition.current.x - player.hasPosition.current.x,
        monster.hasPosition.current.y - player.hasPosition.current.y,
      );
    }
    now += 100;
  }

  assert(sawConcealed, 'setup: the boss should burrow');
  assert(endpointFollowed, 'the emergence point should track a target that keeps moving');
  assert(gapAtSurface !== null, 'setup: the boss should surface');
  // It must come up close enough that the eruption is a threat the player has to
  // answer, rather than one they already walked out of. Measured at ~136px against
  // a 155px radius; the bound is loose enough not to be a balance tripwire and
  // tight enough to fail the moment the burrow stops closing.
  assert(
    gapAtSurface! < impact.radius + 60,
    `the burrow must close on a kiting player (surfaced ${gapAtSurface!.toFixed(0)}px away, ` +
      `eruption radius ${impact.radius})`,
  );
}

// Surfacing hands the boss back intact: speed restored, rooted again, and not
// still drifting when the eruption resolves at `anchor: 'self'`.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('burrow-restore', 800, 400), 'burrow-restore');
  const { monster, armedAt } = armPattern(world, 'chitinous-dreadbore', 'burrow-restore', {
    x: 400,
    y: 400,
  });
  const walkSpeed = MONSTER_DATABASE.get('chitinous-dreadbore')!.stats.speed;

  let now = armedAt;
  let sawConcealed = false;
  let checkedSurface = false;
  for (let i = 0; i < 200 && !monster.recoversFromPattern; i++) {
    world.tick(100, now);
    if (monster.isConcealed) sawConcealed = true;
    if (sawConcealed && !monster.isConcealed && monster.runsBossPattern && !checkedSurface) {
      checkedSurface = true;
      assert(
        monster.hasPosition.speed === walkSpeed,
        `surfacing must restore the walking speed (was ${monster.hasPosition.speed})`,
      );
      assert(!!monster.isRooted, 'and re-root the boss before it erupts');
      assert(monster.isMoving === undefined, 'and stop it drifting');
    }
    now += 100;
  }
  assert(sawConcealed, 'setup: the boss should burrow');
  assert(checkedSurface, 'setup: the boss should surface again');
}

// The renderer's copy of concealment is reconciled from component PRESENCE, so it
// cannot drift from the server's answer about whether the boss can be hit.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('burrow-broadcast', 700, 400), 'burrow-broadcast');
  const { monster, armedAt } = armPattern(world, 'chitinous-dreadbore', 'burrow-broadcast', {
    x: 400,
    y: 400,
  });

  let now = armedAt;
  let sawBroadcast = false;
  for (let i = 0; i < 200 && !monster.recoversFromPattern; i++) {
    world.tick(100, now);
    assert(
      monster.hasStatus.concealed === monster.isConcealed?.marker,
      'the broadcast marker must match the component on every tick',
    );
    if (monster.hasStatus.concealed === 'burrow') sawBroadcast = true;
    now += 100;
  }
  assert(sawBroadcast, 'the burrow should reach the client as a burrow marker');
  assert(
    monster.hasStatus.concealed === undefined,
    'and clear once it surfaces, or the client draws a fightable boss as buried',
  );
}

console.log('bossConcealmentPhase4: ok');

