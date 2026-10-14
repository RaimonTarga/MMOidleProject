/**
 * The class config's wiring (class-first build plan §3.3, F2): the slice attaches with a
 * class, follows lessons, trophies and budget in auto mode, keeps a custom setup, refuses an
 * invalid one with reasons, survives a save, and detaches without a class.
 */
import {
  baseRecoveryForTier,
  checkClassConfig,
  composePlayerView,
  emptyEquipment,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  type ClassConfig,
  type OrderConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import {
  classConfigContextOf,
  hydrateClassConfig,
  refreshClassConfig,
  setClassConfig,
} from '../src/systems/player/progression/classConfig';
import { unlockSkill } from '../src/systems/player/progression/skills';
import { World } from '../src/world/World';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function makeUnclassedPlayer(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: 'Class Config Tester' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 1,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier: 0, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null,
      selectedRange: null, combatArchetype: null,
    },
  };
}

const order = (config: ClassConfig | undefined): OrderConfig => {
  assert(config?.system.kind === 'order', 'a Striker config is an Order');
  return config!.system as OrderConfig;
};

const world = new World();

// ── The Striker, step by step ────────────────────────────────────────────────

const striker = world.attachPlayerEntity(makeUnclassedPlayer('class-config-striker'), 'class-config-striker');
assert(striker.configuresClass === undefined, 'no class, no class config');
assert(unlockSkill(world, striker, 'cadence-root'), 'the Striker root unlocks');
assert(striker.configuresClass?.config.mode === 'auto', 'picking a class attaches an auto config');
assert(order(striker.configuresClass?.config).beats.join() === ',,,', 'a fresh Striker: four plain beats before the finisher');
assert(striker.configuresClass!.config.relic.length === 0, 'no boss, no relic');

striker.tracksProgression.biomeLevel.plains = 2;
refreshClassConfig(world, striker);
assert(order(striker.configuresClass?.config).beats[3] === 'striker-sweep', 'Plains level 2 teaches Sweep and auto fields it');

striker.tracksProgression.bossesCleared.push('plains:1');
refreshClassConfig(world, striker);
assert(striker.configuresClass!.config.relic.join() === 'striker-relic-plains', 'the Plains boss puts Wide Arc in the relic slot');

const view = composePlayerView(striker);
assert(view?.classConfig?.relic[0] === 'striker-relic-plains', 'the player view carries the class config');

// A custom setup is kept as lessons arrive.
const custom: ClassConfig = {
  mode: 'custom',
  relic: ['striker-relic-plains'],
  system: { kind: 'order', beats: ['striker-sweep', null, null, null], holdFinisher: [] },
};
assert(setClassConfig(world, striker, custom).ok, 'a valid custom Order is accepted');
striker.tracksProgression.biomeLevel.forest = 2;
refreshClassConfig(world, striker);
assert(order(striker.configuresClass?.config).beats[0] === 'striker-sweep', 'a custom Order stays as the player set it');
assert(striker.configuresClass!.config.mode === 'custom', 'and stays custom');

// Invalid setups are refused with reasons, and nothing changes.
const unknown = setClassConfig(world, striker, { ...custom, system: { kind: 'order', beats: ['striker-coil', null, null, null], holdFinisher: [] } });
assert(!unknown.ok && unknown.reasons.some((r) => r.includes('striker-coil')), 'an unlearned technique is refused');
const crowded = setClassConfig(world, striker, { ...custom, system: { kind: 'order', beats: ['striker-hamstring', null, null, 'striker-sweep'], holdFinisher: [] } });
assert(!crowded.ok && crowded.reasons.some((r) => r.includes('only 1 beat')), 'one budget step opens one beat');
const junk = setClassConfig(world, striker, { mode: 'custom', relic: [], system: { kind: 'formation' } });
assert(!junk.ok, 'another class\'s system is refused');
assert(order(striker.configuresClass?.config).beats[0] === 'striker-sweep', 'a refused setup changes nothing');

// A save round trip keeps the custom config; junk falls back to the default.
const saved = JSON.parse(JSON.stringify(striker.configuresClass!.config));
assert(JSON.stringify(hydrateClassConfig(striker, saved)?.config) === JSON.stringify(striker.configuresClass!.config), 'a saved custom config loads as it was');
assert(hydrateClassConfig(striker, { nonsense: true })?.config.mode === 'auto', 'an unreadable save loads the default');

// The T2 discipline reshapes the default: Light swings a 7-beat combo (§12.5).
striker.tracksProgression.skillPoints += 1;
assert(setClassConfig(world, striker, { ...custom, mode: 'auto' }).ok, 'back to auto before the discipline');
assert(unlockSkill(world, striker, 'striker-light'), 'the Light discipline unlocks at tier 1');
assert(striker.usesSkills.disciplineId === 'striker-light', 'the pick is recorded as the discipline');
assert(order(striker.configuresClass?.config).beats.length === 6, 'a Light combo has six beats before the finisher');

// Auto mode resumed, then no class.
assert(striker.configuresClass!.config.mode === 'auto', 'auto mode resumes');
striker.usesSkills.combatArchetype = null;
syncArchetypeSlices(world, striker);
assert(striker.configuresClass === undefined, 'resetting the class detaches the config');

// ── Every class gets a usable default ────────────────────────────────────────

const ROOTS = ['cadence-root', 'cooldown-root', 'dot-root', 'reload-root', 'energy-root', 'summoner-root'] as const;
for (const root of ROOTS) {
  const id = `class-config-${root}`;
  const player = world.attachPlayerEntity(makeUnclassedPlayer(id), id);
  assert(unlockSkill(world, player, root), `${root} unlocks`);
  const config = player.configuresClass?.config;
  assert(config, `${root}: a class config attaches`);
  const ctx = classConfigContextOf(player)!;
  const check = checkClassConfig(config!, ctx);
  assert(check.ok, `${root}: the default is valid: ${check.ok ? '' : check.reasons.join('; ')}`);
}

const conduit = world.attachPlayerEntity(makeUnclassedPlayer('class-config-conduit'), 'class-config-conduit');
unlockSkill(world, conduit, 'summoner-root');
const formation = conduit.configuresClass?.config.system;
assert(formation?.kind === 'formation' && formation.roster.join() === 'conduit-thrall,conduit-thrall,conduit-thrall,conduit-thrall',
  'a fresh Conduit fields four Thralls at Command 4');

console.log('classConfig.test.ts: ok');
