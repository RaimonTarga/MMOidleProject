/**
 * The Striker's gear at runtime (class-first build plan CS.4; bible §12.4, §12.10): its weapon
 * jobs and its T1 armor and charm lines each do their one thing, and equipping the gear is
 * what turns them on. Wiring only: placeholders, no balance.
 */
import assert from 'node:assert/strict';
import {
  emptyEquipment,
  getStatusEffect,
  MONSTER_DATABASE,
  type OrderConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { attachComponent } from '../src/ecs/markerHelpers';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { updateStrikerGear } from '../src/systems/classes/archetypes/cadence/strikerGear';
import { updateDotArchetype } from '../src/systems/classes/archetypes/dot/dotPrototype';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runMonsterAttack, runPlayerAttack } from '../src/systems/combat/engine/combat';
import { applyMonsterDotToPlayer } from '../src/systems/combat/status/monsterDot';
import { runDotCleanse } from '../src/systems/defense/mitigation/dotCleanse';
import { oocRecoveryPerSecond } from '../src/systems/defense/regen/recovery';
import { equipItem } from '../src/systems/player/economy/inventory';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const base = MONSTER_DATABASE.get('bone-crawler')!;
MONSTER_DATABASE.set('test-gear-dummy', { ...base, id: 'test-gear-dummy', evasion: 0 });
MONSTER_DATABASE.set('test-gear-slower', {
  ...base, id: 'test-gear-slower', evasion: 0, slowEffect: { speedMult: 0.5, durationMs: 4000 },
  dotEffect: { debuffId: 'test-gear-poison', label: 'Test Poison', damagePerStack: 50, maxStacks: 5, tickIntervalMs: 1000, durationMs: 6000 },
});

let clock = 50_000;

function setup(beats: OrderConfig['beats'] = [null, null, null, null]) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'striker', name: 'Striker' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {},
      biomeLevel: { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 },
      playerTier: 1, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['cadence-root'], passives: {}, selectedClass: 'cadence-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'cadence',
    },
  } as PersistedPlayerSlices, 'striker');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  attachComponent(world, player, 'configuresClass', {
    config: { mode: 'custom', relic: [], system: { kind: 'order', beats, holdFinisher: [] } },
  });
  const spawn = (x: number, y: number, type = 'test-gear-dummy'): MonsterEntity => {
    const m = world.createMonster(NODE, type, { x, y })!;
    m.hasHealth.hp = m.hasHealth.maxHp = 100_000;
    m.mitigatesDamage.plating = 0;
    m.mitigatesDamage.damageReduction = 0;
    return m;
  };
  const target = spawn(430, 400);
  setAttackTarget(world, player, target.isMonster.id);
  return { world, player, target, spawn };
}

function swing(world: World, player: PlayerEntity, target: MonsterEntity): number {
  clock += 1000;
  world.tickCounter += 1;
  const before = target.hasHealth.hp;
  runPlayerAttack(world, player, target, clock, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });
  player.performsAttack.lastAttackAt = clock;
  return before - target.hasHealth.hp;
}

function equip(world: World, player: PlayerEntity, id: string): void {
  player.holdsInventory.inventory.push(id);
  assert(equipItem(world, player, id), `the Striker equips ${id}`);
}

// 1. Equipping the gear turns its keys on (weapons and the class line on a shared base).
{
  const { world, player } = setup();
  equip(world, player, 'striker-broadblade-t1');
  assert((player.usesSkills.passives['striker.nick-pct'] ?? 0) > 0, 'the Broadblade carries its nick');
  const cooldown = player.performsAttack.attackCooldown;
  equip(world, player, 'cave-vest-t1');
  assert((player.usesSkills.passives['striker.bulk-pct'] ?? 0) > 0, 'the Cave vest carries Weighty for a Striker');
  assert(player.performsAttack.attackCooldown > cooldown, 'Weighty slows the beats');
}

// 2. Broadblade: every beat also nicks the nearest other enemy.
{
  const { world, player, target, spawn } = setup();
  const other = spawn(460, 400);
  player.usesSkills.passives['striker.nick-pct'] = 0.25;
  swing(world, player, target);
  assert(other.hasHealth.hp < other.hasHealth.maxHp, 'the nearest other enemy is nicked');
}

// 3. Twin Fangs: each hit strikes once more.
{
  const plain = setup();
  const plainHit = swing(plain.world, plain.player, plain.target);
  const { world, player, target } = setup();
  player.usesSkills.passives['striker.extra-strike-pct'] = 0.2;
  assert(swing(world, player, target) > plainHit, 'the extra strike adds damage');
}

// 4. Maul: a bigger finisher; faster wind-ups.
{
  const plain = setup();
  for (let i = 0; i < 4; i++) swing(plain.world, plain.player, plain.target);
  const plainFinisher = swing(plain.world, plain.player, plain.target);
  const { world, player, target } = setup([null, null, null, 'striker-coil']);
  player.usesSkills.passives['striker.finisher-pct'] = 0.4;
  player.usesSkills.passives['striker.windup-speed-pct'] = 0.5;
  for (let i = 0; i < 3; i++) swing(world, player, target);
  swing(world, player, target); // the wind-up casts
  assert(player.isCastingAbility && player.isCastingAbility.castMs < 900, `the wind-up is shorter (${player.isCastingAbility?.castMs})`);
  const maul = setup();
  maul.player.usesSkills.passives['striker.finisher-pct'] = 0.4;
  for (let i = 0; i < 4; i++) swing(maul.world, maul.player, maul.target);
  assert(swing(maul.world, maul.player, maul.target) > plainFinisher, 'the Maul finisher is bigger');
}

// 5. Hooked Sickle: Rend bleeds longer, and the finisher hits a bleeding target harder.
{
  const plain = setup(['striker-rend', null, null, null]);
  swing(plain.world, plain.player, plain.target);
  const plainTicks = getStatusEffect(plain.target.tracksCombat, 'cadence-hemorrhage')!.stacks;
  const { world, player, target } = setup(['striker-rend', null, null, null]);
  player.usesSkills.passives['striker.dot-duration-pct'] = 0.5;
  swing(world, player, target);
  assert(getStatusEffect(target.tracksCombat, 'cadence-hemorrhage')!.stacks > plainTicks, 'the bleed lasts longer');
}

// 6. Shoulder Through: each extra enemy on you is a little plating.
{
  const hitWith = (perEnemy: number): number => {
    const { world, player, target, spawn } = setup();
    player.mitigatesDamage.plating = 0;
    player.mitigatesDamage.damageReduction = 0;
    player.usesSkills.passives['striker.plating-per-enemy'] = perEnemy;
    const attackers = [target, spawn(380, 400), spawn(400, 430)];
    for (const m of attackers) setAggroTarget(world, m, { id: player.isPlayer.id, kind: 'player' }, clock);
    target.dealsDamage.attack = 100;
    world.tickCounter += 1;
    const before = player.hasHealth.hp;
    runMonsterAttack(world, target, player, clock);
    return before - player.hasHealth.hp;
  };
  assert(hitWith(10) < hitWith(0), 'two extra enemies on you take damage off the hit');
}

// 7. Unbroken: slows on you are shorter.
{
  const slowWith = (cut: number): number => {
    const { world, player, spawn } = setup();
    player.usesSkills.passives['defense.control-duration-cut-pct'] = cut;
    const slower = spawn(420, 420, 'test-gear-slower');
    runMonsterAttack(world, slower, player, clock);
    return getStatusEffect(player.tracksCombat, 'slow')?.remainingMs ?? 0;
  };
  const plainMs = slowWith(0);
  assert(plainMs > 0 && slowWith(0.5) < plainMs, 'Unbroken shortens the slow');
}

// 8. Bloodless: while attacking, a DoT can't take you below the floor.
{
  const { world, player, spawn } = setup();
  const poisoner = spawn(420, 420, 'test-gear-slower');
  player.usesSkills.passives['striker.dot-floor-pct'] = 0.25;
  player.hasHealth.hp = player.hasHealth.maxHp * 0.26;
  for (let i = 0; i < 5; i++) applyMonsterDotToPlayer(world, poisoner, player, MONSTER_DATABASE.get('test-gear-slower')!.dotEffect!);
  const floor = player.hasHealth.maxHp * 0.25;
  const now = clock;
  player.performsAttack.lastAttackAt = now;
  for (let t = 1; t <= 4; t++) updateDotArchetype(world, 1000, now + t * 100);
  assert(player.hasHealth.hp >= floor - 1, `attacking: held at the floor (${player.hasHealth.hp} >= ${floor})`);
  for (let t = 1; t <= 4; t++) updateDotArchetype(world, 1000, now + 10_000 + t * 100);
  assert(player.hasHealth.hp < floor - 1, 'not attacking: the DoT goes on down');
}

// 9. Grit: part of a hit heals back while you keep attacking; stop and it is lost.
{
  const { world, player, target } = setup();
  player.usesSkills.passives['striker.grit-pct'] = 0.5;
  player.usesSkills.passives['striker.grit-ms'] = 1000;
  target.dealsDamage.attack = 60;
  runMonsterAttack(world, target, player, clock);
  const hurt = player.hasHealth.hp;
  assert(hurt < player.hasHealth.maxHp && hurt > 0, 'the hit landed and the Striker stands');
  player.performsAttack.lastAttackAt = clock;
  updateStrikerGear(world, 500, clock + 100);
  assert(player.hasHealth.hp > hurt, 'Grit heals back while attacking');
  const partway = player.hasHealth.hp;
  updateStrikerGear(world, 500, clock + 10_000);
  updateStrikerGear(world, 500, clock + 10_500);
  assert(player.hasHealth.hp === partway, 'stop attacking and the rest is lost');
}

// 10. Antidote: the poison or bleed with the most time left ends.
{
  const { world, player, spawn } = setup();
  const poisoner = spawn(420, 420, 'test-gear-slower');
  applyMonsterDotToPlayer(world, poisoner, player, MONSTER_DATABASE.get('test-gear-slower')!.dotEffect!);
  player.usesSkills.passives['defense.dot-cleanse-interval-ms'] = 1000;
  const before = player.tracksCombat.statusEffects.length;
  runDotCleanse(player, 1000);
  assert(player.tracksCombat.statusEffects.length === before - 1, 'the DoT is cleansed');
}

// 11. Deep Breath: out-of-combat healing runs faster.
{
  const { player } = setup();
  const plain = oocRecoveryPerSecond(player);
  player.usesSkills.passives['defense.ooc-recovery-pct'] = 1;
  assert(oocRecoveryPerSecond(player) === plain * 2, 'twice as fast');
}

console.log('strikerGear.test.ts: ok');
