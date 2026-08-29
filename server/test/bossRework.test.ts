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
  return [
    ...(script?.phases ?? []).flatMap(phase => phase.actions),
    ...(script?.repeating ?? []).flatMap(repeating => repeating.actions),
  ];
}

function hasAction(id: string, type: string): boolean {
  return scriptActions(id).some(action => String(action.type) === type);
}

// Plains is the swarm commander at BOTH tiers. The 2026-08-23 encounter rework
// moved the rally roar down to T1 and deleted both self-enrages: this lineage
// escalates by concurrency, never by the boss becoming a better duellist.
assert(hasAction('tusked-razorback', 'spawn-adds'), 'T1 Plains should spawn its swarm');
assert(hasAction('tusked-razorback', 'roar'), 'T1 Plains should rally the swarm at 50%');
assert(hasAction('gorging-razortusk', 'spawn-adds'), 'T2 Plains should still spawn mobs');
assert(hasAction('gorging-razortusk', 'roar'), 'T2 Plains should keep the allied haste roar');
for (const id of ['tusked-razorback', 'gorging-razortusk']) {
  assert(!hasAction(id, 'enrage'), `${id} must not self-enrage — Plains escalates the herd`);
}

// Forest is always the two-claw, accelerating duel with no mid-fight adds.
for (const id of ['gnarled-greatbear', 'apex-timberclaw']) {
  const forest = def(id);
  assert(forest.attackStyle === 'bear-claws', `${id} should use the claw animation`);
  assert(forest.consecutiveHits === 2, `${id} should strike twice per basic attack`);
  assert(forest.rampOnCombat?.stat === 'attackSpeed', `${id} should ramp attack speed`);
  assert(!hasAction(id, 'spawn-adds') && !hasAction(id, 'summon'), `${id} must not spawn adds`);
}
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
  assert(!!mountain.chargedAttack?.aoe, `${id} should use the planted charged AoE system`);
  assert(mountain.chargedAttack!.castMs >= 2_000, `${id} should have a readable slow wind-up`);
}
assert(
  (def('stoneplate-juggernaut').chargedAttack?.precastStunMs ?? 0) > 0,
  'T2 Mountain should stun immediately before its slam wind-up',
);
for (const id of mountainIds.slice(2)) {
  assert(!!def(id).engageSequence, `${id} should charge, lock, then slam`);
}
assert(
  def('iron-crest-titan').chargedAttack?.aftershock?.kind === 'radial-fault-lines',
  'T4 Mountain should follow its slam with radial fault lines',
);

// Caverns corrosion stacks for the encounter and every tier keeps a medium slam.
for (const id of ['obsidian-broodmother', 'chitinous-dreadbore', 'deep-core-burrow-gorger']) {
  const cave = def(id);
  assert(!!cave.appliesPlatingShred, `${id} should corrode plating`);
  assert(!!cave.chargedAttack?.aoe, `${id} should keep a medium planted slam`);
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
  const charged = def(id).chargedAttack;
  assert(!!charged?.aoe, `${id} should have a charged AoE instead of an instant slam`);
  assert(charged.aoe.radius <= 250, `${id} slam should be bounded rather than screen-wide`);
}
for (const monster of MONSTER_DATABASE.values()) {
  assert(
    !scriptActions(monster.id).some(action => String(action.type) === 'slam'),
    `${monster.id} still authors a legacy instant slam action`,
  );
}

initCombatSystems();

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
  assert(!!getStatusEffect(boss.tracksCombat, BOSS_ROAR_HASTE_EFFECT_ID), 'roar should haste the boss');
  assert(!!getStatusEffect(ally.tracksCombat, BOSS_ROAR_HASTE_EFFECT_ID), 'roar should haste nearby allies');
  assert(monsterAttackCooldown(ally) < ally.performsAttack.attackCooldown, 'roar haste should shorten attack cadence');
}

// T2 Mountain's pre-slam stun is real hard control, and releases on expiry.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('mountain-stun'), 'mountain-stun');
  const boss = world.createMonster(NODE, 'stoneplate-juggernaut', { x: 400, y: 400 });
  assert(!!boss, 'Mountain boss should spawn');
  const charged = def('stoneplate-juggernaut').chargedAttack!;
  const armedAt = 1_000 + (charged.initialCooldownMs ?? charged.cooldownMs) + 1;
  setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  boss.hasAwareness.state = 'attacking';
  boss.performsAttack.lastAttackAt = armedAt - boss.performsAttack.attackCooldown;
  updateCombat(world, 100, armedAt);
  assert(!!getStatusEffect(player.tracksCombat, STUN_EFFECT), 'slam start should apply stun');
  updateCombatState(world, 0);
  assert(!!player.isRooted && !!player.cannotAttack, 'stun should lock movement and attacks');
  updateCombatState(world, charged.precastStunMs!);
  assert(!player.isRooted && !player.cannotAttack, 'stun expiry should release both controls');
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
