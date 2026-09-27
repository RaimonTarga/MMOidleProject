/**
 * Wiring smoke test for the boss-lineage redesign's shared seams
 * (design_docs/boss-lineage-redesign.md §4 step 1):
 *   - announced (named) phases publish a boss-bar label and an event;
 *   - `set-pattern` swaps the NEXT pattern, letting a running one finish;
 *   - `stoppedBy` turns a stun / root on a wind-up into a stagger with the stun tell;
 *   - `controlImmune` and a `blocksControl` plate refuse player control;
 *   - the Enemy Shielded / Enemy Escaping rune conditions.
 *
 * Definitions are patched in-process: this pins the seams, not any one boss.
 */
import {
  ABILITY_ROOT_EFFECT_ID,
  deriveAutoConfigFromRunes,
  emptyEquipment,
  GAME_CONFIG,
  getStatusEffect,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  type BossPattern,
  type MonsterDefinition,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import {
  activeBossPatternDef,
  bossPatternEscaping,
  updateBossPatterns,
} from '../src/systems/combat/ai/bossPatterns';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { applyMonsterRoot, updateMonsterSlows } from '../src/systems/combat/status/monsterControl';
import { applyStun } from '../src/systems/combat/status/stun';
import { monsterIgnoresControl } from '../src/systems/combat/status/controlImmunity';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';
import type { MonsterEntity } from '../src/ecs/entity';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

function playerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 700, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      attunedAbilities: { technique: null, guard: null }, knownStances: [],
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

const BOSS = 'crag-behemoth';
const def = MONSTER_DATABASE.get(BOSS) as MonsterDefinition;
const original = structuredClone(def);
function restore(): void {
  for (const key of Object.keys(def)) delete (def as unknown as Record<string, unknown>)[key];
  Object.assign(def, structuredClone(original));
}

const WINDUP: BossPattern = {
  id: 'seam-windup', name: 'Seam Wind-up',
  damageMultiplier: 1, cooldownMs: 60_000, initialCooldownMs: 100,
  stoppedBy: {
    stun: { staggerMs: 2000, label: 'Stunned Out' },
    root: { staggerMs: 1200, label: 'Pinned' },
  },
  steps: [
    { kind: 'cast', name: 'Seam Wind-up', castMs: 3000, rootable: true },
    { kind: 'recovery', label: 'Done', durationMs: 500 },
  ],
};

function engaged(world: World): { boss: MonsterEntity; now: number } {
  const player = world.attachPlayerEntity(playerSlices('seam-player'), 'seam-player');
  const boss = world.createMonster(NODE, BOSS, { x: 400, y: 400 })!;
  assert(boss, 'boss spawns');
  setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  boss.hasAwareness.state = 'attacking';
  return { boss, now: 2_000 };
}

// ── Announced phase + set-pattern ────────────────────────────────────────────
{
  restore();
  def.bossPattern = { ...WINDUP, stoppedBy: undefined };
  def.bossPatternVariants = [{ ...WINDUP, id: 'seam-variant', name: 'Variant' }];
  def.bossScript = { phases: [{ hpPct: 0.6, name: 'Second Wind', actions: [
    { type: 'set-pattern', patternId: 'seam-variant' },
  ] }] };
  const world = new World();
  const { boss } = engaged(world);
  assert(boss.scriptsBoss, 'scripted boss carries its script state');
  updateBossScripts(world, 100);
  assert(boss.hasStatus.bossPhase === undefined, 'no label before the first named phase');
  assert(activeBossPatternDef(boss)?.id === 'seam-windup', 'base pattern arms first');

  // Start the base pattern, THEN cross the phase: the run must finish as itself.
  updateBossPatterns(world, 100, 2_000);
  assert(boss.runsBossPattern?.patternId === 'seam-windup', 'base pattern running');
  boss.hasHealth.hp = Math.round(boss.hasHealth.maxHp * 0.5);
  world.takeNodeEvents(NODE);
  updateBossScripts(world, 100);
  assert(boss.hasStatus.bossPhase === 'Second Wind', 'named phase becomes the boss-bar label');
  assert(
    world.takeNodeEvents(NODE).some(e => e.kind === 'boss-phase' && e.name === 'Second Wind'),
    'named phase is announced to the node',
  );
  assert(activeBossPatternDef(boss)?.id === 'seam-variant', 'set-pattern swaps the next pattern');
  updateBossPatterns(world, 100, 2_100);
  assert(boss.runsBossPattern?.patternId === 'seam-windup', 'the running pattern is not torn down by the swap');
}

// ── stoppedBy: stun ───────────────────────────────────────────────────────────
{
  restore();
  def.bossPattern = WINDUP;
  delete def.bossScript;
  const world = new World();
  const { boss } = engaged(world);
  updateBossPatterns(world, 100, 2_000);
  updateBossPatterns(world, 100, 2_100);
  assert(boss.runsBossPattern, 'wind-up running');
  applyStun(boss.tracksCombat, 800, 'seam-player');
  updateBossPatterns(world, 100, 2_200);
  assert(!boss.runsBossPattern, 'a stun stops the wind-up');
  assert(boss.recoversFromPattern?.fromStagger === true, 'and staggers the boss');
  assert(boss.recoversFromPattern.label === 'Stunned Out', 'with the authored stun stagger');
  updateMonsterSlows(world);
  assert(boss.hasStatus.hardControlled === true, 'a stagger shows the stun tell');
}

// ── stoppedBy: root on a rootable wind-up ─────────────────────────────────────
{
  restore();
  def.bossPattern = WINDUP;
  delete def.bossScript;
  const world = new World();
  const { boss } = engaged(world);
  updateBossPatterns(world, 100, 2_000);
  updateBossPatterns(world, 100, 2_100);
  applyMonsterRoot(world, boss, 1500, 'seam-player');
  assert(getStatusEffect(boss.tracksCombat, ABILITY_ROOT_EFFECT_ID), 'root lands');
  updateBossPatterns(world, 100, 2_200);
  assert(boss.recoversFromPattern?.label === 'Pinned', 'a root on a rootable wind-up pins it into a stagger');
}

// ── A completed pattern earns no stun tell ────────────────────────────────────
{
  restore();
  def.bossPattern = { ...WINDUP, steps: [
    { kind: 'cast', name: 'Quick', castMs: 200 },
    { kind: 'recovery', label: 'Done', durationMs: 800 },
  ] };
  delete def.bossScript;
  const world = new World();
  const { boss } = engaged(world);
  let now = 2_000;
  for (let i = 0; i < 10 && !boss.recoversFromPattern; i++) { updateBossPatterns(world, 100, now); now += 100; }
  assert(boss.recoversFromPattern && !boss.recoversFromPattern.fromStagger, 'completed run recovers');
  updateMonsterSlows(world);
  assert(boss.hasStatus.hardControlled !== true, 'a completed recovery does not show the stun tell');
}

// ── controlImmune ─────────────────────────────────────────────────────────────
{
  restore();
  def.bossPattern = WINDUP;
  def.controlImmune = true;
  delete def.bossScript;
  const world = new World();
  const { boss } = engaged(world);
  assert(monsterIgnoresControl(boss), 'control-immune boss ignores control');
  applyMonsterRoot(world, boss, 1500, 'seam-player');
  assert(!getStatusEffect(boss.tracksCombat, ABILITY_ROOT_EFFECT_ID), 'a root never lands on it');
  updateBossPatterns(world, 100, 2_000);
  updateBossPatterns(world, 100, 2_100);
  applyStun(boss.tracksCombat, 800, 'forced'); // arrives by another route
  updateBossPatterns(world, 100, 2_200);
  assert(boss.runsBossPattern, 'and even a forced stun does not stop its cast');
}

// ── blocksControl plate ──────────────────────────────────────────────────────
{
  restore();
  def.bossPattern = {
    ...WINDUP,
    steps: [
      { kind: 'barrier', sourceId: 'seam-plate', shieldPct: 0.5, blocksControl: true },
      { kind: 'cast', name: 'Plated Wind-up', castMs: 3000, rootable: true },
      { kind: 'recovery', label: 'Done', durationMs: 500 },
    ],
  };
  delete def.bossScript;
  const world = new World();
  const { boss } = engaged(world);
  updateBossPatterns(world, 100, 2_000);
  updateBossPatterns(world, 100, 2_100);
  assert(monsterIgnoresControl(boss), 'plated boss ignores control');
  applyMonsterRoot(world, boss, 1500, 'seam-player');
  updateBossPatterns(world, 100, 2_200);
  assert(boss.runsBossPattern, 'the plate keeps the wind-up going through a root');
}

// ── Rune conditions ──────────────────────────────────────────────────────────
{
  const rules = [{ conditionId: 'target-shielded', actionId: 'use-ability', targetAbilityId: 'power-strike' }];
  const base = { hpPct: 1, inCombat: true, inParty: false, aggroCount: 1 };
  const off = deriveAutoConfigFromRunes(rules, { ...base, targetShielded: false });
  const on = deriveAutoConfigFromRunes(rules, { ...base, targetShielded: true });
  assert(off.abilityTargets.length === 0 && on.abilityTargets.includes('power-strike'),
    'Enemy Shielded gates its rule');
  const esc = deriveAutoConfigFromRunes(
    [{ conditionId: 'target-escaping', actionId: 'use-ability', targetAbilityId: 'power-strike' }],
    { ...base, targetEscaping: true },
  );
  assert(esc.abilityTargets.includes('power-strike'), 'Enemy Escaping gates its rule');
}

// ── Escaping reads a fleeing boss ────────────────────────────────────────────
{
  restore();
  def.bossPattern = {
    id: 'seam-flee', name: 'Flee', damageMultiplier: 1, cooldownMs: 60_000, initialCooldownMs: 100,
    steps: [{ kind: 'escape-guard', name: 'Flee', castMs: 3000, sourceId: 'seam-escape', shieldPct: 0.05,
      onBreak: { staggerMs: 800, label: 'Caught' }, flee: { speed: 250, escapeDistance: 5000 } }],
  };
  delete def.bossScript;
  const world = new World();
  const { boss } = engaged(world);
  updateBossPatterns(world, 100, 2_000);
  updateBossPatterns(world, 100, 2_100);
  assert(bossPatternEscaping(boss), 'a fleeing boss reads as escaping');
}

restore();
console.log('bossLineageSeams: ok');
