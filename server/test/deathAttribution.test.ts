import {
  GAME_CONFIG, MONSTER_DATABASE, STARTER_RUNE_IDS, emptyEquipment,
  formatDeathCauseLabel, formatDeathLogMessage, resolveMonsterDotDebuff,
  applyStatusEffect, getStatusEffect, type MonsterDefinition,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { syncPlayerBuffs } from '../src/systems/combat/buffs/buffSync';
import { World } from '../src/world/World';
import { buildPlayerDeathPayload } from '../src/systems/world/deathCause';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runMonsterAttack, updateCombat } from '../src/systems/combat/engine/combat';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { updateBossPatterns } from '../src/systems/combat/ai/bossPatterns';
import { applyMonsterDotToPlayer } from '../src/systems/combat/status/monsterDot';
import { updateDotArchetype } from '../src/systems/classes/archetypes/dot/dotPrototype';

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "poison-icons-player", name: "Poison Icons" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      attunedAbilities: { techniques: [], guards: [] },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: {
      inventory: [],
      equipment: emptyEquipment(),
      itemUpgrades: {},
    },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: null,
    },
  };
}


initCombatSystems();
const NODE = 'node-5-5';
function setup(typeId = 'giant-spider') {
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices(), 'death-attribution');
  player.mitigatesDamage.plating = 0;
  player.mitigatesDamage.damageReduction = 0;
  const monster = world.createMonster(NODE, typeId, { x: 405, y: 400 });
  assert(monster, `spawn ${typeId}`);
  monster.dealsDamage.attack = 100;
  return { world, player, monster };
}

// Basic swings preserve their existing labels; explicit attacks name their source.
for (const ranged of [false, true]) {
  const { world, player, monster } = setup();
  monster.isMonster.isRanged = ranged;
  player.hasHealth.hp = 1;
  runMonsterAttack(world, monster, player, 1_000);
  const death = world.pendingDeaths[0]?.payload;
  assert(death, 'a lethal basic attack must publish a death');
  assert(formatDeathCauseLabel(death.cause) === (ranged ? 'Ranged attack' : 'Melee attack'), 'basic label');
}

// Scheduler-to-death wiring: both targeted and area abilities, plus charged slams.
for (const mode of ['hit', 'area-hit', 'charge', 'slam', 'splash'] as const) {
  const base = MONSTER_DATABASE.get('giant-spider')!;
  const id = `death-attribution-${mode}`;
  const def: MonsterDefinition = { ...base, id, dotEffect: undefined,
    chargedAttack: undefined, monsterAbilities: undefined };
  if (mode === 'charge' || mode === 'slam' || mode === 'splash') {
    def.chargedAttack = { name: 'Test Maul', castMs: 100, cooldownMs: 1000,
      multiplier: 2, ...(mode === 'slam' ? { aoe: { radius: 100 } } : {}) };
    if (mode === 'splash') def.aoeAttack = { radius: 100 };
  } else {
    def.monsterAbilities = [{ id: 'test-strike', name: 'Test Strike', target: 'player',
      castMs: 100, cooldownMs: 1000, initialCooldownMs: 0,
      actions: [mode === 'hit' ? { type: 'hit', multiplier: 2 }
        : { type: 'area-hit', radius: 100, multiplier: 2 }] }];
  }
  MONSTER_DATABASE.set(id, def);
  try {
    const { world, player, monster } = setup(id);
    player.hasHealth.hp = 1;
    if (mode === 'splash') {
      player.hasHealth.hp = player.hasHealth.maxHp = 10000;
      const slices = makePlayerSlices();
      slices.isPlayer.id = 'splash-victim';
      const victim = world.attachPlayerEntity(slices, 'splash-victim');
      victim.hasHealth.hp = 1;
    }
    setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, 1_000);
    monster.hasAwareness.state = 'attacking';
    updateCombat(world, 0, 10_000);
    updateCombat(world, 0, 10_200);
    const death = world.pendingDeaths[0]?.payload;
    assert(death, `${mode} must kill through scheduler`);
    const expected = mode === 'hit' || mode === 'area-hit' ? 'Test Strike' : 'Test Maul';
    assert(formatDeathCauseLabel(death.cause) === expected, `${mode} must retain cast name: ${formatDeathCauseLabel(death.cause)}`);
    assert(formatDeathLogMessage(death).includes(expected), 'log must use same label as death overlay');
  } finally { MONSTER_DATABASE.delete(id); }
}

// Applied venom survives removal of the caster and keeps a snapshot, including boss identity.
{
  const { world, player, monster } = setup('crag-behemoth');
  const dot = { damagePerStack: 5, maxStacks: 3, tickIntervalMs: 100,
    durationMs: 1000, element: 'fire' as const, label: 'Scorch', debuffId: 'test-scorch' };
  applyMonsterDotToPlayer(world, monster, player, dot, 'Flame Bite');
  const effect = getStatusEffect(player.tracksCombat, resolveMonsterDotDebuff({ dotEffect: dot }).statusEffectId)!;
  const expectedName = monster.isMonster.name;
  syncPlayerBuffs(world, 1000);
  const beforeBuff = player.hasStatus.activeBuffs?.find(buff => buff.instanceKey === effect.id);
  assert(beforeBuff?.label === 'Scorch', 'buff uses applied effect, not caster definition');
  world.removeMonsterEntity(monster.isMonster.id);
  syncPlayerBuffs(world, 1100);
  const afterBuff = player.hasStatus.activeBuffs?.find(buff => buff.instanceKey === effect.id);
  assert(afterBuff?.label === beforeBuff.label && afterBuff?.logSourceName === expectedName,
    'buff label and source survive caster removal');
  assert(!world.hasMonster(monster.isMonster.id), 'caster must be fully removed');
  assert(player.tracksCombat.statusEffects.includes(effect), 'removing caster must retain venom');
  player.hasHealth.hp = 1;
  updateDotArchetype(world, 100);
  const death = world.pendingDeaths[0]?.payload;
  assert(death?.cause.kind === 'dot', 'posthumous dot must publish a death');
  assert(death.cause.killer.isBoss, 'dead boss retains boss identity');
  assert(death.cause.killer.monsterName === expectedName, 'dead caster keeps its name');
  assert(death.cause.killer.monsterEntityId === monster.isMonster.id, 'dead caster keeps entity id');
  assert(death.cause.killer.monsterTypeId === monster.isMonster.monsterTypeId, 'dead caster keeps sprite identity');
  assert(formatDeathCauseLabel(death.cause) === 'Flame Bite (Scorch)', 'burn must retain ability and effect label');
  assert(world.pendingDeaths.length === 1, 'exactly one death');
  assert(world.takeNodeEvents(NODE).some(event => event.kind === 'dot-tick' && event.sourceId === monster.isMonster.id), 'tick keeps source id');
  player.hasPosition.nodeId = 'node-5-6';
  const movedDeath = buildPlayerDeathPayload(player, death.cause, 0);
  assert(movedDeath.diedAtNodeId === 'node-5-6', 'death location follows victim, not old caster snapshot');
}

// A later stack owns the shared effect, including its snapshot. Ordinary reapplication
// must clear the previous ability.
{
  const { world, player, monster } = setup();
  const dot = { damagePerStack: 5, maxStacks: 3, tickIntervalMs: 100, durationMs: 1000, label: 'Venom' };
  applyMonsterDotToPlayer(world, monster, player, dot, 'Venom Bite');
  const other = world.createMonster(NODE, 'giant-spider', { x: 405, y: 400 })!;
  other.isMonster.name = 'Second Spider';
  applyMonsterDotToPlayer(world, other, player, dot);
  world.removeMonsterEntity(monster.isMonster.id);
  world.removeMonsterEntity(other.isMonster.id);
  player.hasHealth.hp = 1;
  updateDotArchetype(world, 100);
  const death = world.pendingDeaths[0]?.payload;
  assert(death?.cause.kind === 'dot', 'stacked venom death');
  assert(death.cause.killer.monsterName === 'Second Spider', 'latest applying enemy owns merged stacks');
  assert(!death.cause.abilityName, 'old ability must not leak into new stack source');
  assert(death.cause.stacks === 2, 'stack count unchanged');
}

// Generic status reapplication cannot retain a snapshot from an older owner.
{
  const { world, player, monster } = setup();
  const dot = { damagePerStack: 5, maxStacks: 3, tickIntervalMs: 100, durationMs: 1000 };
  applyMonsterDotToPlayer(world, monster, player, dot);
  const effect = player.tracksCombat.statusEffects.find(e => e.damageSource)!;
  applyStatusEffect(player.tracksCombat, { id: effect.id, sourceId: 'replacement' });
  assert(!effect.damageSource, 'generic replacement must clear old attribution');
}


// A DoT delivered by the on-hit listener retains the originating ability too.
{
  const { world, player, monster } = setup();
  player.hasHealth.hp = player.hasHealth.maxHp = 10000;
  runMonsterAttack(world, monster, player, 1000, 1, undefined, undefined, false, 'Venom Bite');
  const effect = player.tracksCombat.statusEffects.find(e => e.damageSource)!;
  assert(effect?.damageSource?.abilityName === 'Venom Bite', 'on-hit dot must capture ability metadata');
  world.removeMonsterEntity(monster.isMonster.id);
  player.hasHealth.hp = 1;
  updateDotArchetype(world, effect.data.tickIntervalMs);
  assert(world.pendingDeaths[0]?.payload.cause.abilityName === 'Venom Bite', 'on-hit dot death keeps ability after removal');
}

// Ordered boss impacts use the name of the damaging step.
{
  const base = MONSTER_DATABASE.get('crag-behemoth')!;
  const id = 'death-attribution-pattern';
  MONSTER_DATABASE.set(id, { ...base, id, bossScript: undefined, bossPattern: {
    id: 'test-pattern', name: 'Test Pattern', initialCooldownMs: 0, cooldownMs: 1000,
    damageMultiplier: 2, steps: [{ kind: 'impact', name: 'Test Eruption',
      telegraphMs: 100, radius: 100, damageMult: 1, anchor: 'self' }],
  } });
  try {
    const { world, player, monster } = setup(id);
    player.hasHealth.hp = 1;
    setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, 1000);
    monster.hasAwareness.state = 'attacking';
    for (let now = 10000; now < 12000 && !player.isDead; now += 100) updateBossPatterns(world, 100, now);
    const death = world.pendingDeaths[0]?.payload;
    assert(death && formatDeathCauseLabel(death.cause) === 'Test Eruption', 'boss impact must retain step name');
  } finally { MONSTER_DATABASE.delete(id); }
}

console.log('deathAttribution.test.ts: ok');
