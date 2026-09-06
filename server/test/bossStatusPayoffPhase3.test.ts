// BOSS ENCOUNTER REDESIGN — Phase 3: status policy, conditional payoff, shred rider.
//
// The load-bearing claim of this phase is that a status effect has FOUR independent
// properties, not one. Before it, "is this harmful" also decided "may Cleanse strip
// it" — which made §4.7 unstateable, because Heat is genuinely hurting you AND is
// the wrong thing to answer with a button.
//
// Everything below is shape and policy. Magnitudes belong to the balance pass and
// are deliberately not pinned.

import {
  cleanseableStacks,
  FROZEN_STATUS_ID,
  GAME_CONFIG,
  isCleanseable,
  MONSTER_DATABASE,
  PARTIAL_CLEANSE_MAX_STACKS,
  PLATING_SHRED_EFFECT_ID,
  STARTER_RUNE_IDS,
  statusPolicyFor,
  STUN_STATUS_ID,
  SUN_MARK_EFFECT_ID,
  TUNDRA_CHILL_EFFECT_ID,
  VOLCANIC_HEAT_EFFECT_ID,
  applyStatusEffect,
  emptyEquipment,
  getStatusEffect,
  resolveMonsterDotDebuff,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { updateBossPatterns } from '../src/systems/combat/ai/bossPatterns';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { applyPlatingShredStacks } from '../src/systems/combat/status/platingShred';
import { PLAYER_HARD_CONTROL_EFFECTS } from '../src/systems/combat/status/playerHardControl';
import { FROZEN_EFFECT } from '../src/systems/classes/archetypes/dot/t3/core/constants';
import { STUN_EFFECT } from '../src/systems/combat/status/stun';
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

// ─────────────────────────────────────────────────────────────────────────────
// The status policy itself.
// ─────────────────────────────────────────────────────────────────────────────

// The ids restated in `shared/` must match the real server constants. `shared/` may
// not import the server, so this is the seam a rename would otherwise slip through.
{
  assert(FROZEN_STATUS_ID === FROZEN_EFFECT, 'the shared Frozen id must match FROZEN_EFFECT');
  assert(STUN_STATUS_ID === STUN_EFFECT, 'the shared Stun id must match STUN_EFFECT');
}

// HEAT: harmful, environmental, and NOT cleanseable. The Volcano's question is
// "stay in the vent or leave"; a Cleanse that deletes Heat answers it with a button.
{
  const heat = statusPolicyFor(VOLCANIC_HEAT_EFFECT_ID, {});
  assert(heat.harmful, 'Heat is genuinely harmful');
  assert(heat.cleanse === 'immune', 'Heat is not ordinarily cleanseable');
  assert(heat.environmental, 'Heat is owned by the room, not a caster');
  assert(!isCleanseable(VOLCANIC_HEAT_EFFECT_ID, {}), 'Cleanse must not touch Heat');
  assert(cleanseableStacks(VOLCANIC_HEAT_EFFECT_ID, {}, 99) === 0, 'not even a big cleanse');
}

// CHILL: harmful, environmental, and PARTIALLY cleanseable — reduced, never deleted.
{
  const chill = statusPolicyFor(TUNDRA_CHILL_EFFECT_ID, {});
  assert(chill.harmful && chill.environmental, 'Chill is harmful and environmental');
  assert(chill.cleanse === 'partial', 'Chill is partially cleanseable');
  assert(isCleanseable(TUNDRA_CHILL_EFFECT_ID, {}), 'Cleanse can reach Chill');
  assert(
    cleanseableStacks(TUNDRA_CHILL_EFFECT_ID, {}, 99) === PARTIAL_CLEANSE_MAX_STACKS,
    'a partial cleanse is capped, so the room always keeps some Chill on you',
  );
  assert(
    cleanseableStacks(TUNDRA_CHILL_EFFECT_ID, {}, 1) === 1,
    'and a weak cleanse is not silently upgraded to the cap',
  );
}

// Death Mark and ordinary debuffs stay fully cleanseable — the default is unchanged,
// so adding a new debuff behaves exactly as it did before this module existed.
{
  for (const id of [SUN_MARK_EFFECT_ID, PLATING_SHRED_EFFECT_ID, 'antiheal']) {
    const policy = statusPolicyFor(id, {});
    assert(policy.harmful, `${id} should be harmful`);
    assert(policy.cleanse === 'full', `${id} should be fully cleanseable`);
    assert(!policy.environmental, `${id} is not environmental`);
    assert(cleanseableStacks(id, {}, 3) === 3, `${id} should cleanse at full strength`);
  }
}

// Hard control is Break Free's job and Cleanse's business nowhere. Collapsing the
// two would make Cleanse universal and Break Free pointless.
{
  for (const id of PLAYER_HARD_CONTROL_EFFECTS) {
    const policy = statusPolicyFor(id, {});
    assert(policy.hardControl, `${id} should be classified as hard control`);
    assert(policy.cleanse === 'immune', `Cleanse must not answer ${id}`);
  }
  assert(
    PLAYER_HARD_CONTROL_EFFECTS.includes(FROZEN_EFFECT),
    'Break Free must recognise Frozen — the Tundra freeze depends on it',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The conditional payoff: Cleanse removes the AMPLIFICATION, not the payoff.
// ─────────────────────────────────────────────────────────────────────────────

const EMPEROR = MONSTER_DATABASE.get('dune-stalker-emperor');
assert(!!EMPEROR?.bossPattern, 'the Desert T2 boss should run a mark/execution pattern');
const EMPEROR_PATTERN = EMPEROR.bossPattern;

/** Drive a pattern boss to completion, returning the damage one player took. */
function runPattern(
  world: World,
  monster: MonsterEntity,
  player: PlayerEntity,
  startAt: number,
  onEachTick?: (now: number) => void,
): number {
  const before = player.hasHealth.hp;
  let now = startAt;
  updateBossPatterns(world, 100, now);
  for (let i = 0; i < 200 && (monster.runsBossPattern || !monster.recoversFromPattern); i++) {
    now += 100;
    onEachTick?.(now);
    updateBossPatterns(world, 100, now);
  }
  return before - player.hasHealth.hp;
}

function armedEmperor(world: World, playerId: string) {
  const monster = world.createMonster(NODE, 'dune-stalker-emperor', { x: 400, y: 400 })!;
  assert(!!monster, 'the Emperor should spawn');
  setAggroTarget(world, monster, { id: playerId, kind: 'player' }, 1_000);
  monster.hasAwareness.state = 'attacking';
  const armedAt =
    1_000 + (EMPEROR_PATTERN.initialCooldownMs ?? EMPEROR_PATTERN.cooldownMs) + 1_000;
  return { monster, armedAt };
}

// The sequence paints the mark, then consumes it for an amplified payoff.
let markedDamage = 0;
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('mark-payoff'), 'mark-payoff');
  const { monster, armedAt } = armedEmperor(world, 'mark-payoff');

  let sawMark = false;
  markedDamage = runPattern(world, monster, player, armedAt, () => {
    if (getStatusEffect(player.tracksCombat, SUN_MARK_EFFECT_ID)) sawMark = true;
  });

  assert(sawMark, 'the sequence should visibly paint the mark');
  assert(markedDamage > 0, 'and cash it out');
  assert(
    getStatusEffect(player.tracksCombat, SUN_MARK_EFFECT_ID) === undefined,
    'the payoff should CONSUME the mark, not leave it standing',
  );
}

// Cleansing the mark mid-sequence keeps the Execution but strips its amplification.
// This is the whole §4.7 shape: not a hard counter, not a no-op.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('mark-cleansed'), 'mark-cleansed');
  const { monster, armedAt } = armedEmperor(world, 'mark-cleansed');

  const cleansedDamage = runPattern(world, monster, player, armedAt, () => {
    // Stand in for a Cleanse: strip the mark the moment it appears.
    const mark = getStatusEffect(player.tracksCombat, SUN_MARK_EFFECT_ID);
    if (mark) mark.stacks = 0;
  });

  assert(cleansedDamage > 0, 'the Execution still LANDS on a cleansed target');
  assert(
    cleansedDamage < markedDamage,
    `and lands softer: ${cleansedDamage} cleansed vs ${markedDamage} marked`,
  );
}

// NUMBING STING (2026-09-06). The Emperor now slows you BETWEEN the mark and the
// Execution, which is what turns the sequence into a dilemma: one Cleanse, two
// things worth spending it on, and the pacing denies you both.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('numbing-order'), 'numbing-order');
  const { monster, armedAt } = armedEmperor(world, 'numbing-order');

  let markAt: number | null = null;
  let slowAt: number | null = null;
  let slowWhenExecuted: number | null = null;
  runPattern(world, monster, player, armedAt, now => {
    if (markAt === null && getStatusEffect(player.tracksCombat, SUN_MARK_EFFECT_ID)) markAt = now;
    const slow = getStatusEffect(player.tracksCombat, 'slow');
    if (slowAt === null && slow) slowAt = now;
    // The payoff plants its circle as a slam telegraph; capture the slow that is
    // live at the moment it is showing.
    const circle = (world.groundZones.get(NODE) ?? []).some(
      z => z.kind === 'slam-telegraph' && z.ownerId === monster.isMonster.id,
    );
    if (circle && slow) slowWhenExecuted = slow.remainingMs;
  });

  assert(markAt !== null, 'the sequence should still paint the mark');
  assert(slowAt !== null, 'and should now also apply the Numbing Sting slow');
  assert(markAt! < slowAt!, 'mark FIRST, then the slow — the order is the sentence');
  assert(
    slowWhenExecuted !== null && slowWhenExecuted! > 0,
    'and the slow must still be running while the Execution circle is on the ground — ' +
      'a slow that lapses first answers nothing',
  );
}

// The DILEMMA, as arithmetic rather than as a feeling: the Execution circle is
// escapable on foot at full speed and is NOT escapable while numbed. If either half
// of that stops being true the beat collapses into "always dodge" or "never dodge".
{
  const steps = EMPEROR_PATTERN.steps;
  const sting = steps.find(
    step => step.kind === 'apply-status' && step.effectId === 'slow',
  );
  const execution = steps.find(step => step.kind === 'payoff');
  assert(sting?.kind === 'apply-status', 'the Emperor should carry a slow step');
  assert(execution?.kind === 'payoff' && execution.radius !== undefined, 'and an area Execution');

  const slowMult = sting.data?.['speedMult'];
  assert(typeof slowMult === 'number' && slowMult > 0 && slowMult < 1, 'the sting should be a real slow');

  const escapeMs = (execution.radius! / GAME_CONFIG.PLAYER_SPEED) * 1_000;
  const numbedEscapeMs = escapeMs / slowMult;
  assert(
    escapeMs < execution.castMs,
    `an unslowed player must be able to leave the circle ` +
      `(${escapeMs.toFixed(0)}ms of running vs a ${execution.castMs}ms tell)`,
  );
  // With MARGIN, not by a hair. A slow that only just fails to let you out is
  // indistinguishable in play from lag, and it makes the Cleanse decision a
  // coin-flip rather than a read: a 0.9 "slow" would clear a bare `>` comparison
  // here while changing nothing anyone could feel.
  assert(
    numbedEscapeMs > execution.castMs * 1.5,
    `and a numbed one must not, with room to spare ` +
      `(${numbedEscapeMs.toFixed(0)}ms against a ${execution.castMs}ms tell)`,
  );
}

// Every Desert tier has exactly one mark source and one thing consuming it, and the
// amplification is a multiplier on a payoff that lands regardless.
{
  for (const id of ['dune-stalker-emperor', 'dune-carapace-monarch', 'dune-throne-sovereign']) {
    const steps = MONSTER_DATABASE.get(id)!.bossPattern!.steps;
    const payoff = steps.find(step => step.kind === 'payoff');
    assert(payoff?.kind === 'payoff', `${id} should have a payoff step`);
    assert(payoff.damageMult > 0, `${id} payoff must land even unmarked`);
    assert(payoff.amplifiedMult > 1, `${id} payoff must hit harder when marked`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// The Tundra Chill gate.
// ─────────────────────────────────────────────────────────────────────────────

const MAMMOTH = MONSTER_DATABASE.get('frost-plated-rime-mammoth');
assert(!!MAMMOTH?.bossPattern, 'Tundra T3 should run a Chill-check pattern');
const FREEZE_STEP = MAMMOTH.bossPattern.steps[0];
assert(FREEZE_STEP.kind === 'apply-status', 'its first step should be the freeze');
const CHILL_GATE = FREEZE_STEP.requires!;
assert(!!CHILL_GATE, 'the freeze should be gated on Chill');

function armedMammoth(world: World, playerId: string) {
  const monster = world.createMonster(NODE, 'frost-plated-rime-mammoth', { x: 400, y: 400 })!;
  setAggroTarget(world, monster, { id: playerId, kind: 'player' }, 1_000);
  monster.hasAwareness.state = 'attacking';
  const pattern = MAMMOTH!.bossPattern!;
  return {
    monster,
    armedAt: 1_000 + (pattern.initialCooldownMs ?? pattern.cooldownMs) + 1_000,
  };
}

function chill(player: PlayerEntity, stacks: number): void {
  applyStatusEffect(player.tracksCombat, {
    id: TUNDRA_CHILL_EFFECT_ID,
    maxStacks: 20,
    remainingMs: 60_000,
    refreshable: true,
    sourceId: 'test-room',
    data: { totalMs: 60_000, isAmbientRamp: 1 },
  });
  const effect = getStatusEffect(player.tracksCombat, TUNDRA_CHILL_EFFECT_ID)!;
  effect.stacks = stacks;
}

// A target the room has NOT chilled enough simply does not get frozen. The question
// was decided before the cast — by whether they cleansed and kept moving.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('chill-low'), 'chill-low');
  chill(player, CHILL_GATE.minStacks - 1);
  const { monster, armedAt } = armedMammoth(world, 'chill-low');

  let everFrozen = false;
  runPattern(world, monster, player, armedAt, () => {
    if (getStatusEffect(player.tracksCombat, FROZEN_STATUS_ID)) everFrozen = true;
  });

  assert(!everFrozen, 'an under-chilled target must not be frozen');
  assert(
    (monster.runsBossPattern?.skippedStepIndexes.length ?? 0) > 0 ||
      monster.recoversFromPattern !== undefined,
    'the gated step should be SKIPPED, not retried forever',
  );
}

// A sufficiently chilled target is frozen, and the Shatter follows.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('chill-high'), 'chill-high');
  chill(player, CHILL_GATE.minStacks + 2);
  const { monster, armedAt } = armedMammoth(world, 'chill-high');

  let everFrozen = false;
  const damage = runPattern(world, monster, player, armedAt, () => {
    if (getStatusEffect(player.tracksCombat, FROZEN_STATUS_ID)) everFrozen = true;
  });

  assert(everFrozen, 'a sufficiently chilled target should be frozen');
  assert(damage > 0, 'and the Shatter should follow');
}

// Damage must NEVER secretly scale with Chill. Two targets frozen at very different
// Chill depths take the same Shatter — the stacks decide IF, never how hard.
{
  function shatterDamageAt(chillStacks: number): number {
    const world = new World();
    const player = world.attachPlayerEntity(playerSlices('chill-scale'), 'chill-scale');
    chill(player, chillStacks);
    const { monster, armedAt } = armedMammoth(world, 'chill-scale');
    return runPattern(world, monster, player, armedAt);
  }
  const shallow = shatterDamageAt(CHILL_GATE.minStacks);
  const deep = shatterDamageAt(CHILL_GATE.minStacks + 10);
  assert(shallow > 0 && deep > 0, 'both should resolve a Shatter');
  assert(
    shallow === deep,
    `Shatter damage must not scale with Chill: ${shallow} shallow vs ${deep} deep`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The plating-shred rider: a larger dose of the SAME corrosion.
// ─────────────────────────────────────────────────────────────────────────────

{
  const broodmother = MONSTER_DATABASE.get('obsidian-broodmother');
  assert(!!broodmother?.appliesPlatingShred, 'Cave T1 should corrode plating');
  const breach = broodmother.monsterAbilities?.[0];
  assert(!!breach, 'Cave T1 should telegraph a Breach');
  const shred = breach.actions.find(action => action.type === 'plating-shred');
  assert(shred?.type === 'plating-shred', 'the Breach should apply plating shred');
  assert(
    shred.stacks > 1,
    'the Breach is a LARGER dose than an ordinary hit, or it teaches nothing',
  );
  assert(
    broodmother.chargedAttack === undefined,
    'the generic damage circle it replaces should be gone',
  );
}

// N stacks land as N, and each threshold crossed on the way fires its poison — a
// bigger dose must never apply LESS than the same number of ordinary hits.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('shred-dose'), 'shred-dose');
  const monster = world.createMonster(NODE, 'deep-core-burrow-gorger', { x: 400, y: 400 })!;
  const def = MONSTER_DATABASE.get('deep-core-burrow-gorger')!;
  const poison = def.appliesPlatingShred!.thresholdPoison!;
  setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, 1_000);

  // The DoT's status id is resolved by the shared flavour mapper, not the raw
  // authored `debuffId` — ask the same function the runtime asks.
  const poisonId = resolveMonsterDotDebuff({ monster: def, dotEffect: poison }).statusEffectId;

  applyPlatingShredStacks(world, monster, player, def, 4);
  const corrosion = getStatusEffect(player.tracksCombat, PLATING_SHRED_EFFECT_ID);
  assert(corrosion?.stacks === 4, 'a 4-stack dose should land as 4 stacks');
  assert(
    poison.atStacks.some(rung => rung > 1 && rung <= 4),
    'setup: the dose must actually leap a threshold for this to prove anything',
  );
  assert(
    getStatusEffect(player.tracksCombat, poisonId) !== undefined,
    'and should fire the threshold poison it LEAPT OVER, not skip it',
  );
}

// The dose is capped by the authored ceiling like any other corrosion.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('shred-cap'), 'shred-cap');
  const monster = world.createMonster(NODE, 'obsidian-broodmother', { x: 400, y: 400 })!;
  const def = MONSTER_DATABASE.get('obsidian-broodmother')!;
  const ceiling = def.appliesPlatingShred!.maxStacks;
  setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, 1_000);

  applyPlatingShredStacks(world, monster, player, def, ceiling + 5);
  assert(
    getStatusEffect(player.tracksCombat, PLATING_SHRED_EFFECT_ID)?.stacks === ceiling,
    'a big dose still respects the authored ceiling',
  );
}

console.log('bossStatusPayoffPhase3: ok');
