import {
  GAME_CONFIG,
  BOSS_RECOVERY_EFFECT,
  MONSTER_DATABASE,
  PLATING_SHRED_EFFECT_ID,
  STARTER_RUNE_IDS,
  applyStatusEffect,
  emptyEquipment,
  getStatusEffect,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { updateBossPatterns } from '../src/systems/combat/ai/bossPatterns';
import { updateRaisers } from '../src/systems/combat/ai/raiseDead';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { syncPlayerBuffs } from '../src/systems/combat/buffs/buffSync';
import { updateCombat } from '../src/systems/combat/engine/combat';
import { syncEnemyBarrierState } from '../src/systems/combat/engine/enemyBarrierState';
import { applyEnemyShield } from '../src/systems/combat/engine/monsterMechanics';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

function playerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 405, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
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

// ANCHOR HISTORY — "a timed boss effect carries its actual clock, not a permanent
// look". The claim began on the Stoneplate Juggernaut's repeating flat-DR shield,
// moved to the Dreadbore's Carapace Seal when Mountain became patterns, moved again
// when Cave's burrow conversion deleted Carapace Seal, and stood on the Jungle
// gorger's Canopy Hunt until 2026-09-06, when that phase was deleted too (it had
// already been removed from its own design comment two days earlier, and only the
// data survived).
//
// The roster now has NO timed `stat-buff` left at all: every one of them was a
// generic escalation the encounter redesign replaced with a real mechanic, and the
// permanent phase buffs that remain deliberately omit `durationMs`. Rather than
// re-anchor on a fifth soon-to-be-deleted buff, the claim now stands where the
// game's only remaining timed boss effect actually lives — the pattern recovery
// window below, which publishes through the same `bossEffectDurations` channel.

// An authored pattern recovery is a PUNISH WINDOW, so it has to be legible on the
// target frame for exactly as long as it lasts. An invisible recovery teaches the
// player nothing about why the boss just stopped moving.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('recovery-target'), 'recovery-target');
  const boss = world.createMonster(NODE, 'crag-behemoth', { x: 400, y: 400 });
  assert(boss, 'Crag Behemoth should spawn');
  const pattern = MONSTER_DATABASE.get('crag-behemoth')!.bossPattern!;
  const recoveryStep = pattern.steps.find(
    (step): step is Extract<typeof step, { kind: 'recovery' }> => step.kind === 'recovery',
  )!;
  setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  boss.hasAwareness.state = 'attacking';

  let now = 1_000 + (pattern.initialCooldownMs ?? pattern.cooldownMs) + 1_000;
  updateBossPatterns(world, 100, now);
  for (let i = 0; i < 150 && !boss.recoversFromPattern; i++) {
    now += 100;
    updateBossPatterns(world, 100, now);
  }
  assert(!!boss.recoversFromPattern, 'the pattern should reach its recovery');
  const clock = boss.hasStatus.bossEffectDurations?.[BOSS_RECOVERY_EFFECT];
  assert(
    clock?.totalMs === recoveryStep.durationMs && clock.remainingMs === recoveryStep.durationMs,
    'the recovery should publish its real target-frame clock the moment it opens',
  );
}

// Cave corrosion appears on the player with the resolved amount stripped.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('corroded-player'), 'corroded-player');
  for (let stack = 0; stack < 3; stack++) {
    applyStatusEffect(player.tracksCombat, {
      id: PLATING_SHRED_EFFECT_ID,
      maxStacks: 8,
      remainingMs: -1,
      sourceId: 'cave-boss',
      data: { platingPerStack: 2 },
    });
  }
  syncPlayerBuffs(world, 1_000);
  const tile = player.hasStatus.activeBuffs.find(buff => buff.id === 'debuff-plating-shred');
  assert(tile?.stacks === 3, 'corrosion should publish its stack count on the player bar');
  assert(
    tile.values?.some(value => value.label === 'Plating stripped' && value.value === '-6'),
    'corrosion should publish the resolved plating loss',
  );
}

// Periodic monster barriers are authoritative between hits and expose depletion/recharge.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('barrier-target'), 'barrier-target');
  const bear = world.createMonster(NODE, 'glacier-bear', { x: 400, y: 400 });
  assert(bear, 'Glacier Bear should spawn');
  setAggroTarget(world, bear, { id: player.isPlayer.id, kind: 'player' }, 1_000);

  syncEnemyBarrierState(world, 1_000);
  const initial = bear.hasStatus.enemyBarrier;
  assert(initial && initial.amount === initial.maxAmount && initial.remainingMs === 6_000, 'barrier should be visible immediately on combat entry');
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'boss-fx' && event.fx === 'shield'),
    'barrier activation should publish the shared shield cue',
  );

  const def = MONSTER_DATABASE.get('glacier-bear');
  assert(def, 'Glacier Bear definition should exist');
  const absorbed = applyEnemyShield(bear, def, initial.maxAmount, 1_001);
  assert(absorbed.absorbed === initial.maxAmount && absorbed.broke, 'the barrier should absorb and report its breaking hit');
  syncEnemyBarrierState(world, 1_001);
  assert(
    bear.hasStatus.enemyBarrier?.amount === 0 &&
      (bear.hasStatus.enemyBarrier.rechargeRemainingMs ?? 0) > 0,
    'a broken barrier should remain visible as a recharge clock',
  );
}

// T2 Plains now delays its wave behind the same Rallying Cry vocabulary as T1.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('t2-rally-target'), 't2-rally-target');
  const boss = world.createMonster(NODE, 'gorging-razortusk', { x: 400, y: 400 });
  assert(boss, 'Gorging Razortusk should spawn');
  setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.5;

  updateBossScripts(world, 0);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === 'Rallying Cry'),
    'T2 Plains threshold should start Rallying Cry',
  );
  const reinforcements = () => [...world.monsterEntities].filter(monster =>
    monster.isMonster.monsterTypeId === 'plains-slime' ||
    monster.isMonster.monsterTypeId === 'boar',
  );
  assert(reinforcements().length === 0, 'the reinforcement wave should wait for cast completion');
  updateBossScripts(world, 2_000);
  assert(reinforcements().length === 6, 'the six-unit wave should arrive when Rallying Cry completes');
}

// Carrion Vulture announces its ally haste and does not buff itself.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('screech-target'), 'screech-target');
  const vulture = world.createMonster(NODE, 'carrion-vulture', { x: 400, y: 400 });
  const ally = world.createMonster(NODE, 'plague-rat', { x: 450, y: 400 });
  assert(vulture && ally, 'Necrotic Screech fixtures should spawn');
  setAggroTarget(world, vulture, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  vulture.hasAwareness.state = 'attacking';
  vulture.performsAttack.lastAttackAt = 0;

  updateCombat(world, 0, 9_000);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === 'Necrotic Screech'),
    'Carrion Vulture should announce Necrotic Screech before the haste',
  );
  updateCombat(world, 0, 10_200);
  assert(getStatusEffect(ally.tracksCombat, 'carrion-screech-haste'), 'nearby ally should receive the screech haste');
  assert(!getStatusEffect(vulture.tracksCombat, 'carrion-screech-haste'), 'support screech should not buff its caster');
}

// Gravewright reserves the corpse until its Raise Dead cast completes.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('raise-target'), 'raise-target');
  const gravewright = world.createMonster(NODE, 'gravewright', { x: 400, y: 400 });
  assert(gravewright, 'Gravewright should spawn');
  world.corpses.set(NODE, [{ monsterTypeId: 'plague-rat', pos: { x: 430, y: 400 }, diedAtMs: 1_000 }]);
  setAggroTarget(world, gravewright, { id: player.isPlayer.id, kind: 'player' }, 1_000);

  updateRaisers(world, 1_000);
  updateRaisers(world, 3_500);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === 'Raise Dead'),
    'Gravewright should cast before consuming a corpse',
  );
  assert(world.corpses.get(NODE)?.length === 1 && gravewright.isRooted && gravewright.cannotAttack, 'the corpse should remain and Gravewright should be planted during the cast');
  updateRaisers(world, 4_600);
  assert(!world.corpses.has(NODE), 'Raise Dead should consume the corpse on completion');
  assert(
    [...world.monsterEntities].some(monster => monster.isRaised?.raiserId === gravewright.isMonster.id),
    'Raise Dead should create a risen copy owned by Gravewright',
  );
  assert(!gravewright.isRooted && !gravewright.cannotAttack, 'Gravewright should release its cast locks');
}

// Charnel-Crown's threshold burst is likewise delayed behind a named mass cast.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('mass-raise-target'), 'mass-raise-target');
  const boss = world.createMonster(NODE, 'charnel-crown-sovereign', { x: 400, y: 400 });
  assert(boss, 'Charnel-Crown Sovereign should spawn');
  world.corpses.set(NODE, [0, 1, 2].map(index => ({
    monsterTypeId: 'plague-rat',
    pos: { x: 430 + index * 10, y: 400 },
    diedAtMs: 1_000,
  })));
  setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.5;

  updateBossScripts(world, 0);
  assert(
    world.takeNodeEvents(NODE).some(event => event.kind === 'monster-cast-start' && event.label === 'Mass Resurrection'),
    'Charnel-Crown should announce Mass Resurrection at 50%',
  );
  assert(world.corpses.get(NODE)?.length === 3, 'Mass Resurrection should not consume corpses during its warning');
  updateBossScripts(world, 1_800);
  assert(!world.corpses.has(NODE), 'Mass Resurrection should consume its corpses on completion');
  assert(
    [...world.monsterEntities].filter(monster => monster.isRaised?.raiserId === boss.isMonster.id).length === 3,
    'Mass Resurrection should raise the authored burst count',
  );
}

console.log('wave1AbilityReadability.test.ts: ok');
