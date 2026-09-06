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
  blockShapesForMover,
  emptyEquipment,
  navigationBodyHalfExtents,
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
function armPattern(
  world: World,
  monsterId: string,
  playerId: string,
  at = { x: 400, y: 400 },
  nodeId = NODE,
) {
  const monster = world.createMonster(nodeId, monsterId, at)!;
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

// HARD CONTROL CANCELS THE ESCAPE, at every stage of it.
//
// The escape-guard and conceal steps were the only timed wind-ups in the pattern
// system that did NOT check for stun/freeze, so a stunned boss ran the whole
// sequence out on top of the control: it "got away" while standing there stunned,
// vanished, and ambushed once the stun lapsed. A stun is a plainer answer than
// breaking the plate — no stumble and no Instinct — but it has to stop the attempt.
for (const stage of ['flee', 'stalk'] as const) {
  const id = 'jungle-dread-gorger';
  const world = new World();
  world.attachPlayerEntity(playerSlices(`escape-stun-${stage}`, 2_400, 2_400), `escape-stun-${stage}`);
  const { monster, armedAt } = armPattern(world, id, `escape-stun-${stage}`, { x: 2_440, y: 2_400 });

  // Run to the stage under test, then land the stun.
  let now = armedAt;
  for (let i = 0; i < 200; i++) {
    world.tick(100, now);
    now += 100;
    const reached = stage === 'flee'
      ? !!monster.runsBossPattern && monster.isConcealed === undefined
      : monster.isConcealed !== undefined;
    if (reached) break;
  }
  assert(!!monster.runsBossPattern, `${stage}: setup — the pattern should be running`);
  if (stage === 'stalk') assert(!!monster.isConcealed, 'stalk: setup — it should have vanished');

  const instinctBefore = escapeInstinct(monster);
  applyStun(monster.tracksCombat, 3_000, 'stunner', 1);
  world.tick(100, now);
  now += 100;

  assert(!monster.runsBossPattern, `${stage}: a stunned boss must not keep escaping`);
  assert(monster.isConcealed === undefined, `${stage}: and must not be left hidden`);
  assert(
    sourceBarrierRemaining(monster, 'jungle-escape') === 0,
    `${stage}: the plate comes down with the attempt`,
  );
  assert(
    escapeInstinct(monster) === instinctBefore,
    `${stage}: a stun banks no Instinct — only breaking the plate teaches it anything`,
  );
  assert(
    !monster.recoversFromPattern?.fromStagger,
    `${stage}: a stun is not the stumble that breaking the plate causes`,
  );

  // And it STAYS cancelled for the rest of the stun: no late vanish, no sequence
  // quietly resuming underneath the control. (Ordinary melee coming back once the
  // stun lapses is correct and deliberately not asserted against here.)
  for (let i = 0; i < 30; i++) {
    world.tick(100, now);
    assert(
      monster.isConcealed === undefined,
      `${stage}: a cancelled escape must never resume into stealth`,
    );
    assert(
      !monster.runsBossPattern,
      `${stage}: and the sequence must not pick up where the stun stopped it`,
    );
    now += 100;
  }
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

// A SUCCESSFUL escape runs the WHOLE loop, in order: it bolts (visible, breakable),
// it vanishes only once it has got away, it stalks back unseen, and the Ambush is
// what happens when it arrives.
//
// This is driven through the real `world.tick` because the movement system is what
// carries the body — a probe that ran only `updateBossPatterns` would show a boss
// that never moves and call that a pass. It is also the regression guard for the
// 2026-09-06 correction: the guard used to be a stationary cast, the vanish used to
// TELEPORT the boss to its leash edge, and the bite then fired from across the arena
// at a player it had never come near.
{
  const id = 'jungle-dread-gorger';
  const world = new World();
  const player = world.attachPlayerEntity(
    playerSlices('escape-success', 2_400, 2_400),
    'escape-success',
  );
  const { monster, armedAt } = armPattern(world, id, 'escape-success', { x: 2_440, y: 2_400 });
  const gapTo = () =>
    Math.hypot(
      monster.hasPosition.current.x - player.hasPosition.current.x,
      monster.hasPosition.current.y - player.hasPosition.current.y,
    );
  const startGap = gapTo();

  let now = armedAt;
  let sawConceal = false;
  let fledTo = startGap;
  let gapAtConceal: number | null = null;
  let gapAtSurface: number | null = null;
  let hpAtSurface = player.hasHealth.hp;
  let concealedAt: number | null = null;

  // Stops the moment the SEQUENCE ends, not on a recovery: a completed ambush
  // deliberately leaves none, and a loop that waited for one would run on into the
  // boss's ordinary melee and credit that damage to the ambush.
  for (let i = 0; i < 200; i++) {
    world.tick(100, now);
    const gap = gapTo();
    if (monster.isConcealed) {
      if (!sawConceal) {
        gapAtConceal = gap;
        concealedAt = now;
      }
      sawConceal = true;
    } else if (!sawConceal) {
      fledTo = Math.max(fledTo, gap);
    } else if (gapAtSurface === null) {
      gapAtSurface = gap;
      hpAtSurface = player.hasHealth.hp;
    }
    now += 100;
    if (sawConceal && !monster.runsBossPattern) break;
  }

  assert(sawConceal, 'an unanswered guard lets the boss vanish');
  assert(monster.isConcealed === undefined, 'and it must come back');
  assert(gapAtConceal !== null && gapAtSurface !== null, 'setup: it should vanish and resurface');

  // 1. IT BOLTS, IN THE OPEN, WHILE THE GUARD IS BREAKABLE. The retreat has to be a
  //    thing the player watches happen — otherwise the barrier is a shield with a
  //    story attached and the distance the ambush closes is fictional.
  assert(
    fledTo > startGap + 200,
    `the escape guard should carry the boss away in the open (got ${fledTo.toFixed(0)}px ` +
      `from ${startGap.toFixed(0)})`,
  );
  // ...and it has to LAST. The first pass was a 1500ms guard at 420px/s, which the
  // player read as "cast, blink, gone": the run was over before it registered and
  // the break window with it. The escape is timed, so this is the guarantee that
  // the chase is something you get to watch and answer, not a state change.
  // (Escape Instinct can shorten it, but only to 55% of the authored window.)
  const fleeMs = concealedAt! - armedAt;
  assert(
    fleeMs >= 2_500,
    `the flee should be long enough to read and answer (lasted ${fleeMs}ms)`,
  );
  // Slower than the player cannot get away; far faster than the player cannot be
  // watched. Breaking the plate is the answer, not outrunning it.
  const guardStep = MONSTER_DATABASE.get(id)!.bossPattern!.steps.find(
    step => step.kind === 'escape-guard',
  )!;
  assert(guardStep.kind === 'escape-guard' && guardStep.flee !== undefined, 'setup: it flees');
  assert(
    guardStep.flee.speed > GAME_CONFIG.PLAYER_SPEED &&
      guardStep.flee.speed < GAME_CONFIG.PLAYER_SPEED * 2.5,
    `the flee should outpace the player without blurring (${guardStep.flee.speed}px/s ` +
      `vs ${GAME_CONFIG.PLAYER_SPEED})`,
  );

  // 2. IT HIDES ONLY ONCE IT HAS GOT AWAY, never on the spot at the head of the cast.
  assert(
    gapAtConceal! > startGap + 200,
    `it should already be away when it vanishes (vanished ${gapAtConceal!.toFixed(0)}px out)`,
  );

  // 3. IT STALKS BACK. Concealment is the approach, not the departure.
  assert(
    gapAtSurface! < gapAtConceal! * 0.25,
    `it should close on the player while unseen (vanished at ${gapAtConceal!.toFixed(0)}px, ` +
      `surfaced at ${gapAtSurface!.toFixed(0)}px)`,
  );

  // 4. THE BITE IS CONTACT. A payoff with no radius hits at any range, so "it landed"
  //    is not the claim — "it landed from on top of the player" is.
  assert(
    gapAtSurface! < 120,
    `the ambush must resolve in contact, not from across the arena ` +
      `(surfaced ${gapAtSurface!.toFixed(0)}px away)`,
  );
  assert(player.hasHealth.hp < hpAtSurface, 'and the ambush should actually land');
  // A SUCCESSFUL ambush leaves no punish window. The stagger is what breaking the
  // plate buys; a predator that just landed its bite does not stun itself, and
  // giving both branches the same ending flattened the choice the loop poses.
  assert(
    !monster.recoversFromPattern,
    'a landed ambush must not stun the boss — that window belongs to the break',
  );
  assert(concealedAt !== null && now > concealedAt, 'setup: time should have passed');

  // Targetability is proven at the seam concealment actually changed — the player
  // attack-target scan — rather than through the acquisition policy.
  updateCombat(world, 100, now);
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

// ─────────────────────────────────────────────────────────────────────────────
// SHORT BURROW (2026-09-06). The Dreadbore's burrow was cut from 1600ms to 500ms
// to make it threatening rather than a long walk. Closing power is the travel
// BUDGET, not the speed, so shortening one without raising the other silently
// removes the only thing this boss has for catching a kiting player.
// ─────────────────────────────────────────────────────────────────────────────

// THE BURROW MUST BE ABLE TO CATCH A RUNNING PLAYER. This is the whole reason the
// mechanic exists: both Cave burrowers walk at ~20px/s against a player who moves
// at 120, so the burrow is their ONLY closer, and one that surfaces short leaves a
// telegraphed eruption resolving on empty floor.
//
// SIMULATED, not calculated. A closed form (`duration * speed` against the ground
// the player opens) was exact while the burrow travelled a straight line, and stops
// being exact the moment one curves: the spiral's arc length depends on the radius
// it happens to be at, and a body chasing a moving point on that spiral cuts every
// corner rather than tracing it. The arithmetic said the Dreadbore could not close
// from melee; it closes from melee with room. So run it.
for (const id of ['chitinous-dreadbore', 'deep-core-burrow-gorger']) {
  const def = MONSTER_DATABASE.get(id)!;
  const steps = def.bossPattern!.steps;
  const conceal = steps.find(step => step.kind === 'conceal');
  const impact = steps.find(step => step.kind === 'impact');
  assert(conceal?.kind === 'conceal' && conceal.travelSpeed !== undefined,
    `${id}: the burrow must travel rather than teleport`);
  assert(impact?.kind === 'impact', `${id}: burrow then erupt`);

  const world = new World();
  const player = world.attachPlayerEntity(
    playerSlices(`burrow-catch-${id}`, 2_400, 2_400),
    `burrow-catch-${id}`,
  );
  // Engaged, at its own reach — the distance this boss actually fights from.
  const { monster, armedAt } = armPattern(world, id, `burrow-catch-${id}`, {
    x: 2_400 - def.stats.attackRange,
    y: 2_400,
  });

  let now = armedAt;
  let sawConcealed = false;
  let gapAtSurface: number | null = null;
  for (let i = 0; i < 260 && !monster.recoversFromPattern; i++) {
    world.tick(100, now);
    // Flee at a full sprint for the whole encounter.
    player.hasPosition.current = {
      x: player.hasPosition.current.x + GAME_CONFIG.PLAYER_SPEED * 0.1,
      y: player.hasPosition.current.y,
    };
    if (monster.isConcealed) sawConcealed = true;
    else if (sawConcealed && gapAtSurface === null) {
      gapAtSurface = Math.hypot(
        monster.hasPosition.current.x - player.hasPosition.current.x,
        monster.hasPosition.current.y - player.hasPosition.current.y,
      );
    }
    now += 100;
  }

  assert(sawConcealed && gapAtSurface !== null, `${id}: setup — it should burrow and surface`);
  // Inside its own circle, which is the claim. Measured 2026-09-06: the retuned
  // Dreadbore surfaces at ~0.2x its radius (dead centre), while the UNTOUCHED T3
  // Gorger surfaces at ~0.88x — on the lip, where a player already drifting falls
  // out for free. Worth tightening when T3 gets its own pass; not pinned here,
  // because this guard is about landing at all.
  assert(
    gapAtSurface! < impact.radius,
    `${id}: a ${conceal.durationMs}ms burrow at ${conceal.travelSpeed}px/s` +
      (conceal.feint
        ? ` with a ${conceal.feint.awayPx}px${conceal.feint.arcDeg ? `/${conceal.feint.arcDeg}deg` : ''} feint`
        : '') +
      ` surfaced ${gapAtSurface!.toFixed(0)}px from a sprinting player it started ` +
      `${def.stats.attackRange}px away from — outside its own ${impact.radius}px eruption. ` +
      `Slowing the burrow or widening the feint costs reach; the duration has to grow with them`,
  );
}

// THE SPIRAL. A concealed body that beelines at you from the moment it disappears
// has exactly one thing it can be doing and nowhere to be but between its start and
// you. The Dreadbore digs AWAY first and sweeps around while it does it, so the
// mound is worth tracking and it returns from a bearing you did not watch it leave
// on. Guarded as SHAPE — out, around, then in past where it started — never as
// distances or degrees.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('burrow-feint', 2_400, 2_400), 'burrow-feint');
  const { monster, armedAt } = armPattern(world, 'chitinous-dreadbore', 'burrow-feint', {
    x: 2_300,
    y: 2_400,
  });
  const gapTo = () =>
    Math.hypot(
      monster.hasPosition.current.x - player.hasPosition.current.x,
      monster.hasPosition.current.y - player.hasPosition.current.y,
    );
  const bearingTo = () =>
    Math.atan2(
      monster.hasPosition.current.y - player.hasPosition.current.y,
      monster.hasPosition.current.x - player.hasPosition.current.x,
    );

  let now = armedAt;
  const gaps: number[] = [];
  const bearings: number[] = [];
  for (let i = 0; i < 200 && !monster.recoversFromPattern; i++) {
    world.tick(100, now);
    if (monster.isConcealed) {
      gaps.push(gapTo());
      bearings.push(bearingTo());
    } else if (gaps.length > 0) break;
    now += 100;
  }
  assert(gaps.length > 4, 'setup: the boss should burrow for several ticks');

  // 1. OUT.
  const opening = gaps[0];
  const furthest = Math.max(...gaps);
  const furthestAt = gaps.indexOf(furthest);
  assert(
    furthest > opening + 60,
    `it should dig AWAY before turning (opened at ${opening.toFixed(0)}px, ` +
      `furthest ${furthest.toFixed(0)}px)`,
  );
  assert(
    furthestAt > 0 && furthestAt < gaps.length / 2,
    'and turn in the first half of the burrow, not spend it all running',
  );

  // 2. IN, past where it started.
  assert(
    gaps[gaps.length - 1] < opening,
    `and end CLOSER than it started (${gaps[gaps.length - 1].toFixed(0)}px vs ${opening.toFixed(0)}px)`,
  );

  // 3. AROUND. Without this the feint is satisfied by a straight there-and-back
  //    along one line, which is exactly the shape the arc replaced. Measured as the
  //    total sweep of the bearing from the player, unwrapped so a crossing of PI
  //    does not read as a reversal.
  let swept = 0;
  for (let i = 1; i < bearings.length; i++) {
    let step = bearings[i] - bearings[i - 1];
    while (step > Math.PI) step -= Math.PI * 2;
    while (step < -Math.PI) step += Math.PI * 2;
    swept += step;
  }
  const sweptDeg = Math.abs(swept) * 180 / Math.PI;
  assert(
    sweptDeg > 60,
    `the burrow should circle its target, not retrace its own line ` +
      `(swept only ${sweptDeg.toFixed(0)} degrees of bearing)`,
  );
}

// BLOCKED GROUND. With `emergeGap: 0` every angle at the authored radius names the
// SAME point, so a target standing somewhere the boss cannot fit used to collapse
// the whole search to one failed sample — and a failed search means "stay put",
// which telegraphs the eruption back where the boss burrowed from. The emergence
// search expands outward in rings instead.
//
// The setup exploits the fact that a boss body is fatter than a player body: the
// player stands in the band beside a wall that fits them and not the Dreadbore, so
// the emergence point the boss WANTS is genuinely unstandable for it.
{
  const BLOCKED_NODE = 'node-t1-mountain-01';
  const wall = blockShapesForMover(BLOCKED_NODE, 'monster').find(
    shape => shape.kind === 'rect' && shape.halfW >= 96 && shape.halfH >= 32,
  );
  assert(wall?.kind === 'rect', 'setup: the probe node should carry a monster-blocking rect');
  const playerBody = navigationBodyHalfExtents('player');
  const bossBody = navigationBodyHalfExtents('monster', true);
  assert(bossBody.y > playerBody.y, 'setup: a boss body must be fatter than a player body');
  // Halfway through the band the player fits and the boss does not.
  const standY = wall.y + wall.halfH + (playerBody.y + bossBody.y) / 2;

  const world = new World();
  const player = world.attachPlayerEntity(
    playerSlices('burrow-blocked', wall.x, standY, BLOCKED_NODE),
    'burrow-blocked',
  );
  const { monster, armedAt } = armPattern(
    world,
    'chitinous-dreadbore',
    'burrow-blocked',
    { x: wall.x, y: standY + 220 },
    BLOCKED_NODE,
  );
  const burrowedFrom = { ...monster.hasPosition.current };

  let now = armedAt;
  let sawConcealed = false;
  let surfacedAt: { x: number; y: number } | null = null;
  for (let i = 0; i < 200 && !monster.recoversFromPattern; i++) {
    world.tick(100, now);
    if (monster.isConcealed) sawConcealed = true;
    if (sawConcealed && !monster.isConcealed && surfacedAt === null) {
      surfacedAt = { ...monster.hasPosition.current };
    }
    now += 100;
  }

  assert(sawConcealed && surfacedAt !== null, 'setup: the boss should burrow and surface');
  const anchor = player.hasPosition.current;
  assert(
    Math.abs(anchor.y - standY) < 1,
    'setup: the player should still be standing in the band beside the wall',
  );
  const gap = Math.hypot(surfacedAt!.x - anchor.x, surfacedAt!.y - anchor.y);
  assert(
    Math.hypot(surfacedAt!.x - burrowedFrom.x, surfacedAt!.y - burrowedFrom.y) > 100,
    'a blocked emergence point must not collapse into "stay where you burrowed"',
  );
  assert(
    gap < 120,
    'a blocked emergence should fall back to the nearest standable ring, not give up ' +
      `(surfaced ${gap.toFixed(0)}px from the target)`,
  );
}

console.log('bossConcealmentPhase4: ok');

