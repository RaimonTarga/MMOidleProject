// Regression coverage for the biome-boss identity pass. This pins both the
// authored tier progression and the runtime seams the new mechanics rely on.

import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  PLATING_SHRED_EFFECT_ID,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
  monsterDotStatusEffectId,
  platingAfterShred,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { updateBossPatterns } from '../src/systems/combat/ai/bossPatterns';
import { sourceBarrierRemaining } from '../src/systems/combat/engine/sourceBarriers';
import { applyEnemyShield } from '../src/systems/combat/engine/monsterMechanics';
import { updateMonsters } from '../src/systems/combat/ai/ai';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import {
  runMonsterAttack,
  updateCombat,
} from '../src/systems/combat/engine/combat';
import { updateCombatState } from '../src/systems/combat/engine/combatState';
import {
  BOSS_ROAR_HASTE_EFFECT_ID,
  monsterAttackCooldown,
} from '../src/systems/combat/engine/monsterMechanics';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { STUN_EFFECT } from '../src/systems/combat/status/stun';
import { buildKillerFromMonster } from '../src/systems/world/deathCause';
import { setEntityMotion } from '../src/systems/world/movement';
import {
  buildGroundZoneViews,
  publishFaultLineBurst,
  publishToxicPool,
  updateGroundZones,
} from '../src/systems/world/groundZones';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

function playerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 405, y: 400 },
      nodeId: NODE,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
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

function def(id: string) {
  const found = MONSTER_DATABASE.get(id);
  assert(!!found, `missing monster definition: ${id}`);
  return found;
}

function scriptActions(id: string) {
  const script = def(id).bossScript;
  const actions = [
    ...(script?.phases ?? []).flatMap(phase => phase.actions),
    ...(script?.repeating ?? []).flatMap(repeating => repeating.actions),
  ];
  const flatten = (action: typeof actions[number]): typeof actions =>
    action.type === 'cast' ? [action, ...action.actions.flatMap(flatten)] : [action];
  return actions.flatMap(flatten);
}

function hasAction(id: string, type: string): boolean {
  return scriptActions(id).some(action => String(action.type) === type);
}

// Plains is the swarm commander at BOTH tiers. The 2026-08-23 encounter rework
// moved the rally roar down to T1 and deleted both self-enrages: this lineage
// escalates by concurrency, never by the boss becoming a better duellist.
assert(hasAction('tusked-razorback', 'spawn-adds'), 'T1 Plains should spawn its swarm');
assert(hasAction('tusked-razorback', 'roar'), 'T1 Plains should rally the swarm at 50%');
const plainsReinforcementCasts = scriptActions('tusked-razorback').filter(action => action.type === 'cast');
assert(
  plainsReinforcementCasts.length === 2 &&
    plainsReinforcementCasts.every(action => action.castMs === 2_000 && action.label === 'Rallying Cry'),
  'T1 Plains reinforcement paths should use the 2-second Rallying Cry cast',
);
assert(hasAction('gorging-razortusk', 'spawn-adds'), 'T2 Plains should still spawn mobs');
assert(hasAction('gorging-razortusk', 'roar'), 'T2 Plains should keep the allied haste roar');
for (const id of ['tusked-razorback', 'gorging-razortusk']) {
  assert(!hasAction(id, 'enrage'), `${id} must not self-enrage — Plains escalates the herd`);
}

// Forest is always the two-claw, accelerating duel with no mid-fight adds.
// Its acceleration is now a readable, permanently stacking Bestial Frenzy cast.
for (const id of ['gnarled-greatbear', 'apex-timberclaw']) {
  const forest = def(id);
  assert(forest.attackStyle === 'bear-claws', `${id} should use the claw animation`);
  assert(forest.consecutiveHits === 2, `${id} should strike twice per basic attack`);
  assert(!forest.rampOnCombat, `${id} should not retain an invisible attack-speed ramp`);
  const frenzyCasts = scriptActions(id).filter(action => action.type === 'cast' && action.label === 'Bestial Frenzy');
  assert(
    frenzyCasts.length === 1 && frenzyCasts[0].castMs === 1500 && frenzyCasts[0].fx === 'frenzy',
    `${id} should telegraph Bestial Frenzy with a 1.5-second cast`,
  );
  // SHAPE, not magnitude. This used to pin `mult === 1.20` and `intervalMs`, which
  // made an ordinary balance edit look like a broken encounter — and it is the two
  // Forest bosses' whole job to be tuned against each other (the T2 multiplier came
  // down to 1.12 on 2026-09-06 so its ramp would stop out-running T1's). What must
  // not change is that the stack is permanent, uncapped, and compounds: that is the
  // fight's time limit, and `forestT2BossSwipe.test.ts` guards the relationship.
  const frenzyStack = frenzyCasts[0]?.actions[0];
  assert(
    frenzyStack?.type === 'stat-buff' &&
      frenzyStack.stat === 'attackSpeed' &&
      frenzyStack.mult > 1 &&
      frenzyStack.moveSpeedMult !== undefined &&
      frenzyStack.maxStacks === undefined &&
      frenzyStack.label === 'bestial-frenzy' &&
      frenzyStack.durationMs === undefined,
    `${id} should gain a permanent Bestial Frenzy attack- and movement-speed stack per cast with no cap`,
  );
  assert(
    forest.bossScript?.repeating?.some(repeating => repeating.intervalMs > 0),
    `${id} should recast Bestial Frenzy on a repeating cadence`,
  );
  assert(!hasAction(id, 'spawn-adds') && !hasAction(id, 'summon'), `${id} must not spawn adds`);
}
assert(def('gnarled-greatbear').stats.hp === 1800, 'T1 Greatbear HP should be reduced by exactly 10%');
assert(
    def('gnarled-greatbear').stats.attack === 24 &&
    def('gnarled-greatbear').stats.attackCooldown === 1900 &&
    def('gnarled-greatbear').consecutiveHits === 2,
  'T1 Greatbear balance change must preserve its attack, cadence, and combo',
);
assert(
  !!def('apex-timberclaw').chargedAttack?.aoe &&
    (def('apex-timberclaw').chargedAttack?.stunMs ?? 0) > 0,
  'T2 Forest should have a small charged AoE stun',
);

// Swamp arenas start dry; the boss plants the pool, with vulnerability from T2.
for (const id of ['grave-toadeater', 'mire-gorged-behemoth', 'rot-spore-croc-behemoth']) {
  const swamp = def(id);
  assert(!hasAction(id, 'spawn-adds') && !hasAction(id, 'summon'), `${id} must not spawn adds`);
  assert(!!swamp.chargedAttack?.aoe, `${id} should telegraph its pool impact`);
  assert(!!swamp.chargedAttack?.pool, `${id} should leave a runtime pool`);
}
assert(def('grave-toadeater').dotEffect?.durationMs === 7000, 'T1 Swamp poison should last 7 seconds');
assert(def('mire-gorged-behemoth').dotEffect?.durationMs === 8000, 'T2 Swamp venom should last 8 seconds');
assert(def('rot-spore-croc-behemoth').dotEffect?.durationMs === 9000, 'T3 Swamp spores should last 9 seconds');
const rotSporeMorph = def('rot-spore-croc-behemoth').bossScript?.phases
  ?.find(phase => phase.hpPct === 0.25)
  ?.actions.find(action => action.type === 'morph');
assert(
  rotSporeMorph?.type === 'morph' && rotSporeMorph.dotEffect?.durationMs === 9000,
  'T3 Rot Spores morph should preserve the 9-second lineage duration',
);
assert(
  (def('mire-gorged-behemoth').chargedAttack?.pool?.vulnerability?.damageTakenPct ?? 0) > 0,
  'T2 Swamp pools should increase damage taken',
);
assert(
  (def('rot-spore-croc-behemoth').chargedAttack?.pool?.detonationMultiplier ?? 0) > 1,
  'T3 Swamp pools should detonate at expiry',
);

// Mountain's sequence grows from slow slam, to stun, to charge-lock-slam.
const mountainIds = [
  'crag-behemoth',
  'stoneplate-juggernaut',
  'crag-gorged-horn-behemoth',
  'iron-crest-titan',
];
for (const id of mountainIds) {
  const mountain = def(id);
  // The whole Mountain lineage now runs an ORDERED PATTERN whose spine is a
  // committed lane. What must never come back is a target-following power shot with
  // no footprint on the ground — that is the thing this lineage is not.
  const pattern = mountain.bossPattern;
  assert(!!pattern, `${id} should run an ordered encounter pattern`);
  const windUp = pattern.steps.find(
    (step): step is Extract<typeof step, { kind: 'cast' }> =>
      step.kind === 'cast' && step.lane !== undefined,
  );
  assert(!!windUp, `${id} should paint a committed lane during a wind-up`);
  assert(windUp.castMs >= 2_000, `${id} should have a readable slow wind-up`);
  assert(
    pattern.steps.some(step => step.kind === 'charge'),
    `${id} should actually travel its lane`,
  );
  assert(
    pattern.steps.some(step => step.kind === 'recovery'),
    `${id} should end in a punishable recovery`,
  );
  assert(
    mountain.chargedAttack === undefined,
    `${id} must not keep a chargedAttack competing with its pattern`,
  );
  assert(
    mountain.chargeOnAggro === undefined,
    `${id} should not keep the legacy aggro speed burst`,
  );
}
// T2 Mountain's pre-cast stun is GONE (2026-09-04 redesign). Stunning the player
// immediately before an unavoidable circle was not an answerable beat — it removed
// the answer and then asked the question. Its replacement is the Stoneplate barrier:
// a thing the player acts ON, whose break cancels the charge into an early stagger.
{
  const juggernaut = def('stoneplate-juggernaut');
  assert(
    juggernaut.chargedAttack?.precastStunMs === undefined,
    'T2 Mountain should no longer stun the player before its wind-up',
  );
  const barrier = juggernaut.bossPattern?.steps.find(
    (step): step is Extract<typeof step, { kind: 'barrier' }> => step.kind === 'barrier',
  );
  assert(!!barrier, 'T2 Mountain should raise a breakable barrier instead');
  assert(!!barrier.onBreak, 'breaking that barrier should be worth something');
}
// T3/T4 Mountain used a legacy `engageSequence` charge-lock opener to make the slam
// arrive rather than sit still. The ordered pattern IS that charge now — a better
// version of it, committed and answerable — so the opener was a second, worse copy
// competing with it for the same beat, and it is gone.
for (const id of mountainIds.slice(2)) {
  const monster = def(id);
  assert(
    monster.engageSequence === undefined,
    `${id} should not keep the legacy charge-lock opener alongside its pattern`,
  );
  const steps = monster.bossPattern?.steps ?? [];
  const chargeIndex = steps.findIndex(step => step.kind === 'charge');
  const impactIndex = steps.findIndex(step => step.kind === 'impact');
  assert(chargeIndex >= 0 && impactIndex > chargeIndex, `${id} should charge, then slam`);
  const impact = steps[impactIndex];
  assert(
    impact.kind === 'impact' && impact.anchor === 'captured-endpoint',
    `${id} should erupt where it charged TO, not where the player later stood`,
  );
}
{
  const steps = def('iron-crest-titan').bossPattern?.steps ?? [];
  const impactIndex = steps.findIndex(step => step.kind === 'impact');
  const faultIndex = steps.findIndex(step => step.kind === 'fault-lines');
  assert(
    impactIndex >= 0 && faultIndex > impactIndex,
    'T4 Mountain should follow its slam with radial fault lines',
  );
  // The cracks are the finite TAIL of the payoff, so the recovery has to come after
  // them — a recovery that opened before the last damage landed would be a punish
  // window the player cannot actually use.
  const recoveryIndex = steps.findIndex(step => step.kind === 'recovery');
  assert(recoveryIndex > faultIndex, 'T4 Mountain should recover after its fault lines');
}

// Caverns corrosion stacks for the encounter, and every tier keeps ONE telegraphed
// beat. T1's is now a Breach that applies a larger dose of the SAME corrosion rather
// than a generic damage circle that taught nothing about erosion (2026-09-04); T2/T3
// still run their planted slams until the Phase 4 burrow conversion.
for (const id of ['obsidian-broodmother', 'chitinous-dreadbore', 'deep-core-burrow-gorger']) {
  const cave = def(id);
  assert(!!cave.appliesPlatingShred, `${id} should corrode plating`);
  const breach = cave.monsterAbilities?.some((ability) =>
    ability.actions.some((action) => action.type === 'plating-shred'),
  );
  assert(
    !!cave.chargedAttack?.aoe || breach || !!cave.bossPattern,
    `${id} should keep one telegraphed beat — a Breach, a planted slam, or a burrow sequence`,
  );
}
assert(
  def('deep-core-burrow-gorger').appliesPlatingShred?.thresholdPoison?.atStacks.length === 2,
  'T3 Caverns should trigger poison at authored corrosion thresholds',
);

// Every former scripted screen-wide slam is now a bounded, charged ground tell.
const migratedSlamIds = [
  ...mountainIds,
  'grave-toadeater', 'mire-gorged-behemoth', 'rot-spore-croc-behemoth',
  'obsidian-broodmother', 'chitinous-dreadbore', 'deep-core-burrow-gorger',
  'dune-carapace-monarch', 'dune-throne-sovereign',
  'cinder-shell-magma-salamander', 'caldera-sovereign',
  'frost-plated-rime-mammoth', 'glacial-patriarch',
  'charnel-crown-sovereign',
  // NOT `elder-trench-serpent`: the encounter rework replaced its Abyssal Slam with
  // DEVOUR, which is deliberately single-target (a bite, and the self-heal only
  // resolves on the direct-hit path). It is covered by bossEncounterRework.test.ts.
];
for (const id of migratedSlamIds) {
  // The claim is "a telegraphed footprint on the ground, not an instant slam". A
  // charged AoE satisfies it; so does an ordered pattern's lane and impact. Both
  // are bounded, so neither can quietly become screen-wide.
  const monster = def(id);
  const charged = monster.chargedAttack;
  const pattern = monster.bossPattern;
  // A telegraphed BEAT, in any of the three shapes the roster now uses: a planted
  // charged AoE, an ordered pattern, or a cast-time `monsterAbility`. What the list
  // forbids is the thing it was written against — an instant slam with no tell.
  const telegraphedAbility = (monster.monsterAbilities?.length ?? 0) > 0;
  // A repeating SHELL CYCLE counts too: the Volcano lineage's telegraphed beat is
  // the shell closing and laying its vent, not a slam.
  const shellCycle = monster.shellUp?.repeatIntervalMs !== undefined;
  // A cast-time RAISE DEAD counts too: the Wasteland lineage's telegraphed beat is
  // the necromancy, complete with a cast bar and — since 2026-09-04 — visibly
  // reserved corpses tethered to the boss while it channels.
  const castRaise = (monster.raisesDead?.castMs ?? 0) > 0;
  assert(
    !!charged?.aoe || !!pattern || telegraphedAbility || shellCycle || castRaise,
    `${id} should have a telegraphed beat instead of an instant slam`,
  );
  if (charged?.aoe) {
    assert(charged.aoe.radius <= 250, `${id} slam should be bounded rather than screen-wide`);
  }
  for (const step of pattern?.steps ?? []) {
    if (step.kind === 'cast' && step.lane) {
      assert(
        step.lane.length <= 900 && step.lane.halfWidth <= 250,
        `${id} lane should be bounded rather than screen-wide`,
      );
    }
    if (step.kind === 'impact') {
      // A deliberately room-wide catastrophe is legal, but ONLY as a once-per-life
      // beat. That is the real invariant behind this bound: nothing the boss does
      // REPEATEDLY may be screen-wide, because a recurring unavoidable arena-filler
      // is not an encounter, it is a timer.
      const roomWideAllowed = pattern?.oncePerLife === true;
      assert(
        step.radius <= 250 || roomWideAllowed,
        `${id} impact should be bounded rather than screen-wide`,
      );
    }
  }
}
for (const monster of MONSTER_DATABASE.values()) {
  assert(
    !scriptActions(monster.id).some(action => String(action.type) === 'slam'),
    `${monster.id} still authors a legacy instant slam action`,
  );
}

initCombatSystems();

// Forest Frenzy visibly casts, locks the bear down, and each completed cast adds
// another permanent attack-speed stack shown on the target frame.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('frenzy-target'), 'frenzy-target');
  const boss = world.createMonster(NODE, 'gnarled-greatbear', { x: 400, y: 400 });
  assert(!!boss, 'T1 Forest boss should spawn');
  setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  boss.hasAwareness.state = 'attacking';
  boss.performsAttack.lastAttackAt = 0;

  updateBossScripts(world, 5_000);
  assert(!!boss.isRooted && !!boss.cannotAttack, 'Bestial Frenzy should lock the boss during its cast');
  const frenzyStartEvents = world.takeNodeEvents(NODE);
  assert(
    frenzyStartEvents.some(event =>
      event.kind === 'monster-cast-start' && event.label === 'Bestial Frenzy' && event.castMs === 1_500,
    ),
    'Bestial Frenzy should publish the normal cast-bar presentation',
  );
  const hpBeforeCast = player.hasHealth.hp;
  updateCombat(world, 100, 10_000);
  assert(player.hasHealth.hp === hpBeforeCast, 'the Forest boss must not attack during Bestial Frenzy');

  updateBossScripts(world, 1_500);
  assert(boss.hasStatus.bossEffects?.includes('bestial-frenzy'), 'Bestial Frenzy should appear in the boss effect bar');
  assert(boss.hasStatus.bossEffectStacks?.['bestial-frenzy'] === 1, 'first Frenzy cast should add one stack');
  assert(boss.performsAttack.attackCooldown === Math.round(1900 / 1.20), 'first Frenzy stack should increase attack speed by 20%');
  assert(boss.hasPosition.speed === Math.round(60 * 1.10), 'first Frenzy stack should increase movement speed by 10%');
  assert(frenzyStartEvents.some(event => event.kind === 'boss-fx' && event.fx === 'frenzy'), 'Bestial Frenzy should publish its distinct frenzy animation');

  updateBossScripts(world, 4_500);
  assert(!!boss.isRooted, 'the next Bestial Frenzy should begin on its six-second cadence');
  updateBossScripts(world, 1_500);
  assert(boss.hasStatus.bossEffectStacks?.['bestial-frenzy'] === 2, 'each completed Frenzy cast should stack permanently');
  assert(
    boss.performsAttack.attackCooldown === Math.round(Math.round(1900 / 1.20) / 1.20),
    'second Frenzy stack should further accelerate the bear',
  );
  assert(
    boss.hasPosition.speed === Math.round(Math.round(60 * 1.10) * 1.10),
    'second Frenzy stack should further increase the bear movement speed',
  );

  for (const expectedStacks of [3, 4, 5, 6]) {
    updateBossScripts(world, 4_500);
    updateBossScripts(world, 1_500);
    assert(
      boss.hasStatus.bossEffectStacks?.['bestial-frenzy'] === expectedStacks,
      `Frenzy cast should reach stack ${expectedStacks}`,
    );
  }
  const sixthStackCooldown = boss.performsAttack.attackCooldown;
  const sixthStackSpeed = boss.hasPosition.speed;
  world.takeNodeEvents(NODE);
  updateBossScripts(world, 4_500);
  assert(!!boss.isRooted, 'uncapped Frenzy should continue starting casts beyond five stacks');
  updateBossScripts(world, 1_500);
  assert(
    boss.hasStatus.bossEffectStacks?.['bestial-frenzy'] === 7,
    'Frenzy should continue past the former five-stack cap',
  );
  assert(boss.performsAttack.attackCooldown < sixthStackCooldown, 'the seventh Frenzy stack should further accelerate attack cadence');
  assert(boss.hasPosition.speed > sixthStackSpeed, 'the seventh Frenzy stack should further increase movement speed');
}

// Plains reinforcements are a visible downtime beat: no adds or boss attacks land
// during Rallying Cry, then the authored wave appears exactly at cast completion.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('plains-cast-target'), 'plains-cast-target');
  const boss = world.createMonster(NODE, 'tusked-razorback', { x: 400, y: 400 });
  assert(!!boss, 'T1 Plains boss should spawn');
  setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  boss.hasAwareness.state = 'attacking';
  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.5;
  boss.performsAttack.lastAttackAt = 0;
  setEntityMotion(world, boss, { x: 700, y: 400 });

  updateBossScripts(world, 0);
  assert(!!boss.isRooted && !!boss.cannotAttack && !boss.isMoving, 'Rallying Cry should root and disarm the boss');
  assert(
    world.takeNodeEvents(NODE).some(event =>
      event.kind === 'monster-cast-start' && event.label === 'Rallying Cry' && event.castMs === 2_000,
    ),
    'Rallying Cry should publish the normal labeled boss-cast presentation',
  );
  const hpBeforeCast = player.hasHealth.hp;
  updateCombat(world, 100, 10_000);
  assert(player.hasHealth.hp === hpBeforeCast, 'the boss must not attack during Rallying Cry');

  const reinforcementAdds = () => [...world.monsterEntities].filter(monster =>
    monster.isMonster.monsterTypeId === 'plains-slime' || monster.isMonster.monsterTypeId === 'boar',
  );
  updateBossScripts(world, 1_999);
  assert(reinforcementAdds().length === 0, 'Rallying Cry should not spawn adds before completion');
  updateBossScripts(world, 1);
  assert(reinforcementAdds().length === 5, 'Rallying Cry should spawn the full phase wave at completion');
  assert(!boss.isRooted && !boss.cannotAttack, 'Rallying Cry should release the boss at completion');
  const spawnedAdds = reinforcementAdds();
  assert(
    spawnedAdds.every(add =>
      add.hasAggroTarget?.targetId === player.isPlayer.id &&
      add.controlsMonster.bossSpawnerId === boss.isMonster.id &&
      add.controlsMonster.spawn.x === boss.controlsMonster.spawn.x &&
      add.controlsMonster.spawn.y === boss.controlsMonster.spawn.y &&
      add.controlsMonster.leashRange === boss.controlsMonster.leashRange &&
      add.hasAwareness.leashRange === boss.hasAwareness.leashRange,
    ),
    'Rallying Cry adds should inherit the boss target and encounter leash',
  );
  assert(
    spawnedAdds.every(add => !!getStatusEffect(add.tracksCombat, BOSS_ROAR_HASTE_EFFECT_ID)),
    'Rallying Cry should roar only after spawning so every reinforcement receives its haste',
  );
  const summonFx = world.takeNodeEvents(NODE).filter(event => event.kind === 'boss-fx' && event.fx === 'summon');
  assert(summonFx.length === 5, 'each Rallying Cry add should publish its own spawn animation');

  const retarget = world.attachPlayerEntity(playerSlices('plains-cast-retarget'), 'plains-cast-retarget');
  setAggroTarget(world, boss, { id: retarget.isPlayer.id, kind: 'player' }, 3_000);
  updateMonsters(world, 100, 3_000);
  assert(
    spawnedAdds.every(add => add.hasAggroTarget?.targetId === retarget.isPlayer.id),
    'Rallying Cry adds should follow later boss retargets',
  );
}

// One Forest attack opportunity resolves exactly two real combat hits.
{
  const baselineWorld = new World();
  const baselinePlayer = baselineWorld.attachPlayerEntity(playerSlices('claw-baseline'), 'claw-baseline');
  const baselineBear = baselineWorld.createMonster(NODE, 'gnarled-greatbear', { x: 400, y: 400 });
  assert(!!baselineBear, 'baseline bear should spawn');
  const hp = baselinePlayer.hasHealth.hp;
  runMonsterAttack(baselineWorld, baselineBear, baselinePlayer, 10_000);
  const oneHit = hp - baselinePlayer.hasHealth.hp;

  const comboWorld = new World();
  const comboPlayer = comboWorld.attachPlayerEntity(playerSlices('claw-combo'), 'claw-combo');
  const comboBear = comboWorld.createMonster(NODE, 'gnarled-greatbear', { x: 400, y: 400 });
  assert(!!comboBear, 'combo bear should spawn');
  setAggroTarget(comboWorld, comboBear, { id: comboPlayer.isPlayer.id, kind: 'player' }, 1_000);
  comboBear.hasAwareness.state = 'attacking';
  comboBear.performsAttack.lastAttackAt = 0;
  const comboHp = comboPlayer.hasHealth.hp;
  updateCombat(comboWorld, 100, 10_000);
  const comboDamage = comboHp - comboPlayer.hasHealth.hp;
  assert(comboDamage === oneHit * 2, `Forest claw combo should deal two hits (${comboDamage} != ${oneHit * 2})`);
}

// The Plains roar buffs both its owner and nearby allies through the cadence gate.
{
  const world = new World();
  const boss = world.createMonster(NODE, 'gorging-razortusk', { x: 400, y: 400 });
  const ally = world.createMonster(NODE, 'plains-slime', { x: 450, y: 400 });
  assert(!!boss && !!ally, 'roar fixtures should spawn');
  setAggroTarget(world, boss, { id: 'roar-target', kind: 'player' }, 1_000);
  updateBossScripts(world, 6_000);
  assert(
    world.takeNodeEvents(NODE).some(event =>
      event.kind === 'monster-cast-start' && event.label === 'Rallying Cry',
    ),
    'T2 Plains reinforcement cadence should announce Rallying Cry before the roar',
  );
  updateBossScripts(world, 2_000);
  assert(!!getStatusEffect(boss.tracksCombat, BOSS_ROAR_HASTE_EFFECT_ID), 'roar should haste the boss');
  assert(!!getStatusEffect(ally.tracksCombat, BOSS_ROAR_HASTE_EFFECT_ID), 'roar should haste nearby allies');
  assert(monsterAttackCooldown(ally) < ally.performsAttack.attackCooldown, 'roar haste should shorten attack cadence');
}

// T2 Mountain's Stoneplate barrier is a REAL absorb pool on the shared damage path,
// and breaking it during the preparation cancels the charge into an early stagger.
// This is what replaced the pre-cast stun: a beat the player acts ON, rather than
// one that removes their answer and then asks the question.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('stoneplate-break'), 'stoneplate-break');
  const boss = world.createMonster(NODE, 'stoneplate-juggernaut', { x: 400, y: 400 })!;
  assert(!!boss, 'Mountain boss should spawn');
  const pattern = def('stoneplate-juggernaut').bossPattern!;
  const barrierStep = pattern.steps.find(
    (step): step is Extract<typeof step, { kind: 'barrier' }> => step.kind === 'barrier',
  )!;

  setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  boss.hasAwareness.state = 'attacking';
  const armedAt = 1_000 + (pattern.initialCooldownMs ?? pattern.cooldownMs) + 1;

  // Arm and run the pattern until the barrier is up.
  updateBossPatterns(world, 100, armedAt);
  assert(!!boss.runsBossPattern, 'the pattern should take ownership of the boss');
  let now = armedAt;
  for (let i = 0; i < 60 && sourceBarrierRemaining(boss, barrierStep.sourceId) === 0; i++) {
    now += 100;
    updateBossPatterns(world, 100, now);
  }
  const raised = sourceBarrierRemaining(boss, barrierStep.sourceId);
  assert(raised > 0, 'the preparation should raise a Stoneplate barrier');
  assert(
    raised === Math.round(boss.hasHealth.maxHp * barrierStep.shieldPct),
    'the barrier should be sized off the boss max HP',
  );

  // It absorbs through the SAME path every enemy barrier uses — not private HP.
  const partial = applyEnemyShield(boss, def('stoneplate-juggernaut'), 100, now);
  assert(partial.absorbed === 100 && partial.damage === 0, 'the barrier absorbs incoming damage');
  assert(
    sourceBarrierRemaining(boss, barrierStep.sourceId) === raised - 100,
    'absorbing should drain the barrier',
  );

  // Break it.
  applyEnemyShield(boss, def('stoneplate-juggernaut'), raised, now);
  assert(sourceBarrierRemaining(boss, barrierStep.sourceId) === 0, 'the barrier should break');

  now += 100;
  updateBossPatterns(world, 100, now);
  assert(!boss.runsBossPattern, 'breaking the plate should cancel the rest of the sequence');
  assert(!!boss.recoversFromPattern, 'and stagger the boss into a recovery');
  assert(boss.recoversFromPattern!.fromStagger, 'the recovery should be attributed to the break');
  assert(!!boss.isRooted && !!boss.cannotAttack, 'a staggered boss cannot move or swing');

  // The stagger is finite and releases both locks.
  updateBossPatterns(world, 100, now + barrierStep.onBreak!.staggerMs + 1);
  assert(!boss.recoversFromPattern, 'the stagger should end on its own');
  assert(!boss.isRooted && !boss.cannotAttack, 'and release movement and attacks');
}

// Caverns corrosion stacks without timing out, then clears with the encounter.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('corrosion-target'), 'corrosion-target');
  player.mitigatesDamage.plating = 10;
  const boss = world.createMonster(NODE, 'obsidian-broodmother', { x: 400, y: 400 });
  assert(!!boss, 'Caverns boss should spawn');
  setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  runMonsterAttack(world, boss, player, 10_000);
  runMonsterAttack(world, boss, player, 20_000);
  const corrosion = getStatusEffect(player.tracksCombat, PLATING_SHRED_EFFECT_ID);
  assert(corrosion?.stacks === 2 && corrosion.remainingMs === -1, 'corrosion should stack permanently in combat');
  assert(platingAfterShred(10, player.tracksCombat) === 8, 'two T1 stacks should remove two plating');
  setAggroTarget(world, boss, null, 21_000);
  updateCombatState(world, 0);
  assert(!getStatusEffect(player.tracksCombat, PLATING_SHRED_EFFECT_ID), 'corrosion should clear on disengage');
}

// T3 Caverns poison appears only on the authored corrosion threshold hits.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('threshold-poison'), 'threshold-poison');
  const boss = world.createMonster(NODE, 'deep-core-burrow-gorger', { x: 400, y: 400 });
  assert(!!boss, 'T3 Caverns boss should spawn');
  setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  const poisonId = monsterDotStatusEffectId('deep-core-corrosive-venom');
  runMonsterAttack(world, boss, player, 10_000);
  runMonsterAttack(world, boss, player, 20_000);
  assert(!getStatusEffect(player.tracksCombat, poisonId), 'poison should wait for corrosion threshold 3');
  runMonsterAttack(world, boss, player, 30_000);
  assert(getStatusEffect(player.tracksCombat, poisonId)?.stacks === 1, 'threshold 3 should add one poison stack');
  runMonsterAttack(world, boss, player, 40_000);
  runMonsterAttack(world, boss, player, 50_000);
  assert(getStatusEffect(player.tracksCombat, poisonId)?.stacks === 1, 'non-threshold hits must not add poison');
  runMonsterAttack(world, boss, player, 60_000);
  assert(getStatusEffect(player.tracksCombat, poisonId)?.stacks === 2, 'threshold 6 should add the second poison stack');
}

// Expiring T3 pools detonate once through the owner boss's real damage pipeline.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('pool-detonation'), 'pool-detonation');
  player.hasPosition.current = { x: 600, y: 400 };
  const boss = world.createMonster(NODE, 'rot-spore-croc-behemoth', { x: 400, y: 400 });
  assert(!!boss, 'T3 Swamp boss should spawn');
  publishToxicPool(world, NODE, {
    kind: 'toxic-pool', pos: { x: 600, y: 400 }, radius: 80,
    startedAtMs: 1_000, expiresAtMs: 2_000, damagePerTick: 1,
    tickIntervalMs: 1_000, ownerId: boss.isMonster.id,
    detonationMultiplier: 2.25, killer: buildKillerFromMonster(boss),
  });
  const hp = player.hasHealth.hp;
  updateGroundZones(world, 2_000);
  updateCombat(world, 100, 2_000);
  assert(player.hasHealth.hp < hp, 'standing in an expiring T3 pool should take detonation damage');
  const after = player.hasHealth.hp;
  updateCombat(world, 100, 2_100);
  assert(player.hasHealth.hp === after, 'a pool detonation should resolve exactly once');
}

// Fault-line chains hit occupied cracks once while the wedges between them remain safe.
{
  const world = new World();
  const onLine = world.attachPlayerEntity(playerSlices('fault-line-hit'), 'fault-line-hit');
  const inWedge = world.attachPlayerEntity(playerSlices('fault-line-safe'), 'fault-line-safe');
  onLine.hasPosition.current = { x: 520, y: 400 };
  inWedge.hasPosition.current = { x: 485, y: 485 };
  const boss = world.createMonster(NODE, 'iron-crest-titan', { x: 400, y: 400 });
  assert(!!boss, 'T4 Mountain boss should spawn');
  publishFaultLineBurst(world, NODE, {
    kind: 'fault-line-telegraph', pos: { x: 400, y: 400 }, radius: 24,
    startedAtMs: 1_000, resolvesAtMs: 1_900, ownerId: boss.isMonster.id,
    points: [{ x: 480, y: 400 }, { x: 520, y: 400 }, { x: 400, y: 480 }, { x: 400, y: 520 }],
    damageMultiplier: 1.35,
  });
  assert(
    (buildGroundZoneViews(world, NODE, 1_000) ?? []).filter(zone => zone.kind === 'fault-line-telegraph').length === 4,
    'each linked fault segment should be visible during the delay',
  );
  const lineHp = onLine.hasHealth.hp;
  const wedgeHp = inWedge.hasHealth.hp;
  updateGroundZones(world, 1_900);
  updateCombat(world, 100, 1_900);
  assert(onLine.hasHealth.hp < lineHp, 'a player on a fault line should take the aftershock');
  assert(inWedge.hasHealth.hp === wedgeHp, 'the wedge between fault lines should remain safe');
  assert(!(buildGroundZoneViews(world, NODE, 1_900) ?? []).some(zone => zone.kind === 'fault-line-telegraph'), 'resolved faults should clear');
}

// Swamp boss pools now run for minutes, so they must be retired with the boss that
// planted them. An owned pool dies with its maker; an unowned one (corpse hazard)
// deliberately survives.
{
  const world = new World();
  const boss = world.createMonster(NODE, 'grave-toadeater', { x: 400, y: 400 });
  assert(!!boss, 'T1 Swamp boss should spawn');
  const bossId = boss.isMonster.id;
  const basePool = {
    kind: 'toxic-pool' as const, pos: { x: 400, y: 400 }, radius: 80,
    startedAtMs: 1_000, expiresAtMs: 601_000, damagePerTick: 3,
    tickIntervalMs: 1_000, killer: buildKillerFromMonster(boss),
  };
  const owned = publishToxicPool(world, NODE, { ...basePool, ownerId: bossId });
  const corpse = publishToxicPool(world, NODE, basePool);

  assert(
    MONSTER_DATABASE.get('grave-toadeater')?.chargedAttack?.pool?.durationMs === 600_000,
    'the Bile Pool should last for the whole fight',
  );

  world.removeMonsterEntity(bossId);
  const remaining = world.groundZones.get(NODE) ?? [];
  assert(!remaining.some(zone => zone.id === owned.id), 'a boss-owned pool should die with the boss');
  assert(remaining.some(zone => zone.id === corpse.id), 'an unowned corpse pool should outlive its maker');
}

console.log('boss rework tests passed');
