/**
 * The Squire's tier 3 made visible (T3-W2-SQUIRE): Frostward and Rampage show on the buff bar,
 * the Resolve budget is networked beside the (wider) bar, every Squire specialization is a pick
 * the Passive Tree gate offers under its discipline, and the guided stretch for tier 3 exists.
 * Wiring only.
 */
import assert from 'node:assert/strict';
import {
  applyStatusEffect,
  buildSquireBeats,
  canUnlockSkill,
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  SQUIRE_KIT,
  type SkillUnlockTarget,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { attachComponent } from '../src/ecs/markerHelpers';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import {
  SQUIRE_FROSTWARD_EFFECT_ID,
  SQUIRE_RAMPAGE_EFFECT_ID,
  updateSquire,
} from '../src/systems/classes/archetypes/cooldown/squire';
import { ATTACK_HASTE_PCT_KEY } from '../src/systems/combat/engine/attackCadence';
import { syncPlayerBuffs } from '../src/systems/combat/buffs/buffSync';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const BIOMES = { swamp: 14, mountain: 14, cave: 14, jungle: 14, desert: 14, tundra: 4, volcanic: 4 };

function setup(relic: string[] = []) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'squire', name: 'Squire' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: BIOMES,
      playerTier: 3, currentSkillTier: 0, bossesCleared: ['tundra:3'], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['cooldown-root'], passives: {}, selectedClass: 'cooldown-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'cooldown',
      disciplineId: 'squire-avenger', specializationId: null,
    },
  } as PersistedPlayerSlices, 'squire');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  const ctx = classConfigContextFromState({
    combatArchetype: 'cooldown', biomeLevel: BIOMES, bossesCleared: ['tundra:3'], disciplineId: 'squire-avenger',
  })!;
  const config = defaultClassConfig(ctx);
  config.relic = relic;
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  return { world, player };
}

// 1. Frostward and Rampage have their buff tiles.
{
  const { world, player } = setup();
  const tiles = () => (syncPlayerBuffs(world, 1000), player.hasStatus.activeBuffs ?? []);
  assert(!tiles().some((b) => b.id === SQUIRE_FROSTWARD_EFFECT_ID || b.id === SQUIRE_RAMPAGE_EFFECT_ID), 'no tiles before they are applied');
  const cs = player.tracksCombat;
  applyStatusEffect(cs, {
    id: SQUIRE_FROSTWARD_EFFECT_ID, maxStacks: 1, remainingMs: 4000, refreshable: true, sourceId: 'squire',
    data: { totalMs: 4000, holdStacks: 3 },
  });
  applyStatusEffect(cs, {
    id: SQUIRE_RAMPAGE_EFFECT_ID, maxStacks: 1, remainingMs: 4000, refreshable: true, sourceId: 'squire',
    data: { [ATTACK_HASTE_PCT_KEY]: 0.5, totalMs: 4000 },
  });
  const shown = tiles();
  assert(shown.find((b) => b.id === SQUIRE_FROSTWARD_EFFECT_ID)?.label === 'Frostward', 'Frostward shows');
  assert(shown.find((b) => b.id === SQUIRE_RAMPAGE_EFFECT_ID)?.label === 'Rampage', 'Rampage shows');
}

// 2. The Resolve budget is networked, and the bar can be wider than it (Deep Winter).
{
  const plain = setup();
  updateSquire(plain.world, 100, 1000);
  const cd = plain.player.usesCooldown!;
  assert(cd.resolveBudget > 0 && cd.resolveBudget === cd.resolveMax, 'a plain bar is exactly the budget');
  const winter = setup(['squire-relic-tundra']);
  updateSquire(winter.world, 100, 1000);
  const wide = winter.player.usesCooldown!;
  assert(wide.resolveMax > wide.resolveBudget && wide.resolveBudget === cd.resolveBudget, 'Deep Winter widens the bar past the budget');
}

// 3. Every specialization is offered under its own discipline by the Passive Tree gate.
{
  const target = (disciplineId: string | null): SkillUnlockTarget => ({
    usesSkills: { unlockedSkills: [], selectedClass: 'cooldown-root', disciplineId },
    tracksProgression: { skillPoints: 1, currentSkillTier: 2 },
  });
  assert.equal(SQUIRE_KIT.specializations.length, 9);
  for (const spec of SQUIRE_KIT.specializations) {
    assert(canUnlockSkill(target(spec.disciplineId), spec.id).ok, `${spec.id}: offered under ${spec.disciplineId}`);
    const other = SQUIRE_KIT.disciplines.find((d) => d.id !== spec.disciplineId)!.id;
    assert(!canUnlockSkill(target(other), spec.id).ok, `${spec.id}: not offered under ${other}`);
    assert(!canUnlockSkill(target(null), spec.id).ok, `${spec.id}: not before a discipline`);
  }
}

// 4. The guided tier 3 stretch follows the tier 2 one and ends on the Volcanic boss.
{
  const beats = buildSquireBeats();
  const ids = beats.map((b) => b.id);
  const first = ids.indexOf('squire3:specialization');
  assert(first > ids.indexOf('squire2:boss-desert'), 'the tier 3 stretch comes after the tier 2 one');
  assert.equal(ids.at(-1), 'squire3:boss-volcanic');
  assert(new Set(ids).size === ids.length, 'beat ids are unique');
  for (const beat of beats.slice(first)) assert(beat.say.length < 170, `${beat.id}: short enough`);
}

console.log('squireT3W2: ok');
