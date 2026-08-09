import {
  AMBIENT_RAMP_KEY,
  DAMAGE_DEALT_PCT_KEY,
  DAMAGE_TAKEN_PCT_KEY,
  FROST_RAMP_EFFECT_ID,
  GAME_CONFIG,
  MIN_PLAYER_MOVE_SLOW_MULT,
  RESOLVED_NODE_FEATURES,
  STARTER_RUNE_IDS,
  VOLCANIC_HEAT_EFFECT_ID,
  applyStatusEffect,
  distanceSq,
  emptyEquipment,
  getStatusEffect,
  isHarmfulPlayerStatusEffect,
  playerIncomingDamageMult,
  playerMoveSpeedMult,
  playerOutgoingDamageMult,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { PlayerEntity } from '../src/ecs/entity';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { syncPlayerBuffs } from '../src/systems/combat/buffs/buffSync';
import { updateNodeFeatures } from '../src/systems/world/nodeFeatures';
import { setEntityMotion, updateMovement } from '../src/systems/world/movement';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

/** A volcanic node, and a corner of it well clear of every authored lava vent. */
const HEAT_NODE = 'node-t3-volcanic-01';
const COLD_NODE = 'node-5-5';
const CLEAR_SPOT = { x: 150, y: 150 };

const HEAT = RESOLVED_NODE_FEATURES[HEAT_NODE].find((f) => f.ambientRamp)?.ambientRamp;
assert(HEAT !== undefined, `${HEAT_NODE} must author an ambientRamp feature`);
const RAMP_MS = HEAT!.rampMs;
const MAX_STACKS = HEAT!.maxStacks;
const TAKEN_PER_STACK = HEAT!.payload.incomingDamagePct ?? 0;
const DEALT_PER_STACK = HEAT!.payload.outgoingDamagePct ?? 0;

function makePlayerSlices(id: string, nodeId: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { ...CLEAR_SPOT }, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, hpRegen: 0 },
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
      equippedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
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

/** Run the node-feature pass for `ms`, holding the player in (or out of) combat. */
function tickFeatures(
  world: World,
  player: PlayerEntity,
  ms: number,
  inCombat: boolean,
): void {
  const dt = 100;
  for (let elapsed = 0; elapsed < ms; elapsed += dt) {
    player.tracksEngagement = inCombat ? Date.now() : undefined;
    updateNodeFeatures(world, dt);
  }
}

initCombatSystems();

// ── The clamp: distinct slow ids multiply, and the product has a floor ────────
{
  assert(playerMoveSpeedMult([]) === 1, 'no modifiers means base speed');
  assert(Math.abs(playerMoveSpeedMult([0.6]) - 0.6) < 1e-9, 'a lone slow is untouched');
  assert(
    Math.abs(playerMoveSpeedMult([0.6, 0.6]) - 0.36) < 1e-9,
    'two slows still compound while the product stays above the floor',
  );
  assert(
    playerMoveSpeedMult([0.6, 0.6, 0.6]) === MIN_PLAYER_MOVE_SLOW_MULT,
    'three unrelated slows must clamp at the floor instead of compounding to a soft root',
  );
  assert(
    playerMoveSpeedMult([0]) === 0 && playerMoveSpeedMult([0, 1.5]) === 0,
    'a ROOT is absolute — the slow floor must never hand a rooted player speed back',
  );
  assert(
    Math.abs(
      playerMoveSpeedMult([0.6, 0.6, 0.6, 1.3]) - MIN_PLAYER_MOVE_SLOW_MULT * 1.3,
    ) < 1e-9,
    'haste applies on top of the floor, so mobility boots still help a fully slowed player',
  );
  assert(
    playerMoveSpeedMult([0.6, 1.3]) === playerMoveSpeedMult([1.3, 0.6]),
    'the collapse must be order-independent',
  );
}

// ── The clamp is wired into real player movement ──────────────────────────────
{
  const world = new World();
  const fast = world.attachPlayerEntity(makePlayerSlices('mv-fast', COLD_NODE), 'mv-fast');
  const slow = world.attachPlayerEntity(makePlayerSlices('mv-slow', COLD_NODE), 'mv-slow');

  const target = { x: CLEAR_SPOT.x + 900, y: CLEAR_SPOT.y };
  const now = Date.now();
  setEntityMotion(world, fast, target);
  setEntityMotion(world, slow, target);

  // Two DIFFERENT ids, so they multiply: 0.5 * 0.5 = 0.25, below the floor.
  applyStatusEffect(slow.tracksCombat, {
    id: 'slow',
    maxStacks: 1,
    remainingMs: 5_000,
    refreshable: true,
    sourceId: 'test',
    data: { speedMult: 0.5, totalMs: 5_000 },
  });
  applyStatusEffect(slow.tracksCombat, {
    id: FROST_RAMP_EFFECT_ID,
    maxStacks: 1,
    remainingMs: 5_000,
    refreshable: true,
    sourceId: 'test',
    data: { moveSlowPerHit: 0.5, moveSlowMaxPct: 0.5, totalMs: 5_000 },
  });

  const fastFrom = { ...fast.hasPosition.current };
  const slowFrom = { ...slow.hasPosition.current };
  updateMovement(world, 100, now);
  const fastMoved = Math.sqrt(distanceSq(fastFrom, fast.hasPosition.current));
  const slowMoved = Math.sqrt(distanceSq(slowFrom, slow.hasPosition.current));

  assert(fastMoved > 0, 'the control player must actually move');
  assert(
    Math.abs(slowMoved / fastMoved - MIN_PLAYER_MOVE_SLOW_MULT) < 0.02,
    `stacked slows must move at the floor, not their raw product (ratio ${slowMoved / fastMoved})`,
  );
}

// ── The ramp climbs while fighting, caps, and drives BOTH amplifiers ──────────
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('ramp', HEAT_NODE), 'ramp');
  const cs = player.tracksCombat;
  const hpBefore = player.hasHealth.hp;

  assert(playerIncomingDamageMult(cs) === 1, 'no ramp before the player fights');

  tickFeatures(world, player, 100, true);
  const heat = getStatusEffect(cs, VOLCANIC_HEAT_EFFECT_ID);
  assert(
    heat !== undefined && heat.stacks === 1,
    'entering combat in the caldera starts the ramp',
  );
  assert(
    (heat!.data[AMBIENT_RAMP_KEY] ?? 0) !== 0,
    'the ramp must carry the generic marker the decay pass and the cleanse authority look for',
  );

  tickFeatures(world, player, RAMP_MS * 2, true);
  assert(
    getStatusEffect(cs, VOLCANIC_HEAT_EFFECT_ID)!.stacks === 3,
    'the ramp gains exactly one stack per rampMs of combat',
  );

  tickFeatures(world, player, RAMP_MS * MAX_STACKS, true);
  const full = getStatusEffect(cs, VOLCANIC_HEAT_EFFECT_ID)!;
  assert(full.stacks === MAX_STACKS, 'the ramp stops at the authored maxStacks');

  const taken = playerIncomingDamageMult(cs) - 1;
  const dealt = playerOutgoingDamageMult(cs) - 1;
  assert(
    Math.abs(taken - MAX_STACKS * TAKEN_PER_STACK) < 1e-9,
    'P3 must read the ramp payload as the incoming amplifier',
  );
  assert(
    Math.abs(dealt - MAX_STACKS * DEALT_PER_STACK) < 1e-9,
    'the SAME status must also drive the outgoing amplifier',
  );
  assert(
    taken > dealt,
    'locked decision 1: damage taken must climb faster than damage dealt, or overstaying is free',
  );

  // The volcano ramp is a greed ramp, not a burn (Session 5 dropped the burn).
  assert(player.hasHealth.hp === hpBefore, 'the ambient ramp itself must deal no damage');

  // Buff tile: the whole client tell for a status that is otherwise invisible.
  syncPlayerBuffs(world, Date.now());
  const tile = player.hasStatus.activeBuffs.find((b) => b.id === 'debuff-volcanic-heat');
  assert(tile !== undefined, 'the ramp must project a buff tile');
  assert(tile!.stacks === MAX_STACKS, 'the tile reports live stacks');
  assert(tile!.durationPct === 100, 'a full ramp reads as a full fill, not a countdown');
  assert(tile!.speedMult === 1, 'volcano payload carries no move slow');

  // Disengaging sheds the ramp one stack at a time, and clears it.
  tickFeatures(world, player, RAMP_MS * 2, false);
  assert(
    getStatusEffect(cs, VOLCANIC_HEAT_EFFECT_ID)!.stacks === MAX_STACKS - 2,
    'the ramp decays gradually out of combat, not in one cliff',
  );
  tickFeatures(world, player, RAMP_MS * MAX_STACKS, false);
  assert(
    getStatusEffect(cs, VOLCANIC_HEAT_EFFECT_ID) === undefined,
    'a fully shed ramp removes its status',
  );
  assert(playerIncomingDamageMult(cs) === 1, 'and the amplifiers return to baseline');
}

// ── A ramp carried OUT of its node still sheds, even while in combat ──────────
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('carry', HEAT_NODE), 'carry');
  const cs = player.tracksCombat;

  tickFeatures(world, player, RAMP_MS * 3, true);
  const carried = getStatusEffect(cs, VOLCANIC_HEAT_EFFECT_ID)!.stacks;
  assert(carried > 1, 'test needs a ramp worth carrying');

  // A node transition, reduced to what the ramp pass actually reads.
  player.hasPosition.nodeId = COLD_NODE;
  tickFeatures(world, player, RAMP_MS, true);
  assert(
    getStatusEffect(cs, VOLCANIC_HEAT_EFFECT_ID)!.stacks === carried - 1,
    'leaving the node sheds the ramp even mid-fight — the pass finds it by marker, not by node',
  );
}

// ── The cleanse authority covers ramps generically, so Session 6 needs no edit ─
{
  assert(
    isHarmfulPlayerStatusEffect('some-future-biome-ramp', { [AMBIENT_RAMP_KEY]: 1 }),
    'any status carrying the ambient-ramp marker must count as a debuff',
  );
  assert(
    isHarmfulPlayerStatusEffect(VOLCANIC_HEAT_EFFECT_ID, {
      [DAMAGE_TAKEN_PCT_KEY]: 0.08,
      [DAMAGE_DEALT_PCT_KEY]: 0.05,
    }),
    'volcanic heat stays net-harmful despite paying out damage dealt',
  );
}

console.log('ambientRamp.test.ts: ok');
