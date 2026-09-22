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
  TUNDRA_CHILL_EFFECT_ID,
  ambientRampStatus,
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
import { teleportPlayerToNode } from '../src/admin/gameActions';
import { respawnPlayer } from '../src/systems/world/spawning';

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
const BREAKPOINT = HEAT!.payload.damageSoftcapStacks!;
const TAKEN_PER_STACK = HEAT!.payload.incomingDamagePct ?? 0;
const DEALT_PER_STACK = HEAT!.payload.outgoingDamagePct ?? 0;

function makePlayerSlices(id: string, nodeId: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { ...CLEAR_SPOT }, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
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
      attunedAbilities: { technique: null, guard: null },
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

// ── The uncapped ramp drives BOTH amplifiers, with a linear first ten stacks ──
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

  tickFeatures(world, player, RAMP_MS * (BREAKPOINT - 3), true);
  const full = getStatusEffect(cs, VOLCANIC_HEAT_EFFECT_ID)!;
  assert(full.stacks === BREAKPOINT && full.maxStacks === 0, 'Heat reaches ten without a stack cap');

  const taken = playerIncomingDamageMult(cs) - 1;
  const dealt = playerOutgoingDamageMult(cs) - 1;
  assert(
    Math.abs(taken - BREAKPOINT * TAKEN_PER_STACK) < 1e-9,
    'P3 must read the ramp payload as the incoming amplifier',
  );
  assert(
    Math.abs(dealt - BREAKPOINT * DEALT_PER_STACK) < 1e-9,
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
  assert(tile!.stacks === BREAKPOINT, 'the tile reports live stacks');
  assert(tile!.durationPct === -1, 'uncapped Heat must not display a full-stack ceiling');
  assert(tile!.values?.some(v => v.label === 'Damage dealt' && v.value === '+30%') === true, 'tile reports actual dealt bonus');
  assert(tile!.values?.some(v => v.label === 'Damage taken' && v.value === '+45%') === true, 'tile reports actual taken bonus');
  assert(tile!.speedMult === 1, 'volcano payload carries no move slow');

  // Disengaging sheds the ramp one stack at a time, and clears it.
  tickFeatures(world, player, RAMP_MS * 2, false);
  assert(
    getStatusEffect(cs, VOLCANIC_HEAT_EFFECT_ID)!.stacks === BREAKPOINT - 2,
    'the ramp decays gradually out of combat, not in one cliff',
  );
  tickFeatures(world, player, RAMP_MS * BREAKPOINT, false);
  assert(
    getStatusEffect(cs, VOLCANIC_HEAT_EFFECT_ID) === undefined,
    'a fully shed ramp removes its status',
  );
  assert(playerIncomingDamageMult(cs) === 1, 'and the amplifiers return to baseline');
}

// ── A position change outside normal transitions still clears stale ramps ────
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('carry', HEAT_NODE), 'carry');
  const cs = player.tracksCombat;

  tickFeatures(world, player, RAMP_MS * 3, true);
  const carried = getStatusEffect(cs, VOLCANIC_HEAT_EFFECT_ID)!.stacks;
  assert(carried > 1, 'test needs a ramp worth carrying');

  // A node transition, reduced to what the ramp pass actually reads.
  player.hasPosition.nodeId = COLD_NODE;
  tickFeatures(world, player, 100, true);
  assert(
    getStatusEffect(cs, VOLCANIC_HEAT_EFFECT_ID) === undefined,
    'leaving the biome clears the ramp on the next pass, even mid-fight',
  );
}

// Beyond ten, Heat keeps growing but its marginal effect shrinks; HUD uses the same curve.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('hot', HEAT_NODE), 'hot');
  tickFeatures(world, player, 100, true);
  const heat = ambientRampStatus(player.tracksCombat)!;
  let lastBonus = 0;
  let lastIncrement = Infinity;
  for (let stacks = 1; stacks <= 100; stacks++) {
    heat.stacks = stacks;
    const bonus = playerOutgoingDamageMult(player.tracksCombat) - 1;
    const increment = bonus - lastBonus;
    assert(increment > 0, 'every stack must still matter');
    if (stacks <= 10) assert(Math.abs(bonus - stacks * 0.03) < 1e-9, 'first ten stacks are linear');
    if (stacks > 10) assert(increment < lastIncrement, 'each post-breakpoint stack adds less');
    lastBonus = bonus;
    lastIncrement = increment;
  }
  assert(playerOutgoingDamageMult(player.tracksCombat) > 1.5, 'Heat exceeds the former outgoing cap');
  assert(playerIncomingDamageMult(player.tracksCombat) > 2, 'Heat exceeds the former incoming cap');
  syncPlayerBuffs(world, Date.now());
  const tile = player.hasStatus.activeBuffs.find(b => b.id === 'debuff-volcanic-heat')!;
  assert(tile.values?.some(v => v.label === 'Damage dealt' && v.value === '+74.2%') === true, 'high-stack HUD reflects logarithmic damage');
  tickFeatures(world, player, RAMP_MS, true);
  assert(heat.stacks === 101, 'live accumulation continues above all former ceilings');

  // Cooling consumes elapsed time at the interval for EACH stack, slowing as Heat falls.
  heat.stacks = 100;
  tickFeatures(world, player, 300, false);
  assert(heat.stacks === 99, '100 Heat loses its first stack in 0.3 seconds');
  tickFeatures(world, player, 300, false);
  assert(heat.stacks === 99, '99 Heat needs slightly longer for its next stack');
  tickFeatures(world, player, 100, false);
  assert(heat.stacks === 98, 'cooling carries fractional elapsed time');

  // Re-entering combat must not bank cooling progress or turn it into growth.
  tickFeatures(world, player, 100, true);
  assert(heat.stacks === 98, 'resuming combat does not convert cooling into growth');
  heat.stacks = 10;
  tickFeatures(world, player, 2900, false);
  assert(heat.stacks === 10, 'low Heat needs a fresh three seconds to cool');
  tickFeatures(world, player, 100, false);
  assert(heat.stacks === 9, 'cooling returns to baseline at ten stacks');
  tickFeatures(world, player, 27_000, false);
  assert(!ambientRampStatus(player.tracksCombat), 'cooling clears the final stack');
}

// A larger server step must traverse the same cooling intervals as small steps.
{
  const snapshots: Array<{ stacks: number; elapsed: number }> = [];
  for (const dt of [100, 1000]) {
    const world = new World();
    const player = world.attachPlayerEntity(makePlayerSlices(`cool-${dt}`, HEAT_NODE), `cool-${dt}`);
    tickFeatures(world, player, 100, true);
    const heat = ambientRampStatus(player.tracksCombat)!;
    heat.stacks = 100;
    player.tracksEngagement = undefined;
    for (let ms = 0; ms < 30_000; ms += dt) updateNodeFeatures(world, dt);
    snapshots.push({ stacks: heat.stacks, elapsed: heat.data.coolingAccum });
  }
  assert(snapshots[0].stacks === snapshots[1].stacks, 'cooling count is independent of tick size');
  assert(Math.abs(snapshots[0].elapsed - snapshots[1].elapsed) < 1e-8, 'cooling preserves elapsed remainder across tick sizes');
  assert(snapshots[0].stacks < 50 && snapshots[0].stacks > 10, 'high Heat cools quickly while retaining a gradual tail');
}

// Generic amplifiers remain additive, without a hidden global cap on either axis.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('uncapped', COLD_NODE), 'uncapped');
  for (const id of ['source-one', 'source-two']) {
    applyStatusEffect(player.tracksCombat, {
      id, maxStacks: 1, remainingMs: 5000, sourceId: 'test',
      data: { [DAMAGE_DEALT_PCT_KEY]: 0.4, [DAMAGE_TAKEN_PCT_KEY]: 0.75 },
    });
  }
  assert(Math.abs(playerOutgoingDamageMult(player.tracksCombat) - 1.8) < 1e-9, 'outgoing sources add beyond 50%');
  assert(playerIncomingDamageMult(player.tracksCombat) === 2.5, 'incoming sources add beyond 100%');
}

// Admin teleport and normal node accounting share immediate cleanup in both directions.
for (const [source, destination] of [
  ['node-t4-tundra-01', HEAT_NODE],
  [HEAT_NODE, 'node-t4-tundra-01'],
] as const) {
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('teleport', source), 'teleport');
  tickFeatures(world, player, 20_000, true);
  syncPlayerBuffs(world, Date.now());
  const oldId = ambientRampStatus(player.tracksCombat)!.id;
  assert(player.hasStatus.activeBuffs.some(b => b.id === `debuff-${oldId}`), 'source ramp is visible');
  assert(teleportPlayerToNode(world, player, destination).ok, 'admin teleport succeeds');
  assert(!ambientRampStatus(player.tracksCombat), 'teleport immediately clears old ramp before a tick');
  assert(player.hasStatus.attackCadenceMult === 1, 'teleport clears the displayed attack slow');
  assert(player.hasStatus.finalDamageDealtMult === 1 && player.hasStatus.finalDamageTakenMult === 1, 'teleport clears displayed heat amplifiers');
  assert(!player.hasStatus.activeBuffs.some(b => b.id === `debuff-${oldId}`), 'teleport immediately clears old icon');
  player.hasPosition.current = { ...CLEAR_SPOT };
  tickFeatures(world, player, 100, true);
  const next = ambientRampStatus(player.tracksCombat)!;
  assert(next.id !== oldId && next.stacks === 1, 'destination starts its own ramp at one stack');
  assert(next.id === (destination === HEAT_NODE ? VOLCANIC_HEAT_EFFECT_ID : TUNDRA_CHILL_EFFECT_ID), 'destination gets correct effect');

  // Ordinary transitions use the same World hook, without waiting for a feature tick.
  player.hasPosition.nodeId = COLD_NODE;
  world.movePlayerNode(destination, COLD_NODE, player.isPlayer.id);
  assert(!ambientRampStatus(player.tracksCombat), 'ordinary biome exit clears immediately');
}

for (const nodeId of [HEAT_NODE, 'node-t4-tundra-01']) {
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('dies', nodeId), 'dies');
  tickFeatures(world, player, 20_000, true);
  syncPlayerBuffs(world, Date.now());
  const id = ambientRampStatus(player.tracksCombat)!.id;
  const sameBiomeNode = Object.entries(RESOLVED_NODE_FEATURES).find(([candidate, features]) =>
    candidate !== nodeId && features.some(f => f.ambientRamp?.effectId === id),
  )![0];
  const stacks = ambientRampStatus(player.tracksCombat)!.stacks;
  player.hasPosition.nodeId = sameBiomeNode;
  world.movePlayerNode(nodeId, sameBiomeNode, player.isPlayer.id);
  assert(ambientRampStatus(player.tracksCombat)?.stacks === stacks, 'same-biome travel preserves stacks');
  world.killPlayer(player.isPlayer.id, { kind: 'stance', damage: 100_000, stanceName: 'Test' });
  assert(!ambientRampStatus(player.tracksCombat), 'death clears ramp status');
  assert(player.hasStatus.attackCadenceMult === 1, 'death clears displayed chill penalty');
  assert(player.hasStatus.finalDamageDealtMult === 1 && player.hasStatus.finalDamageTakenMult === 1, 'death clears displayed heat amplifiers');
  assert(!player.hasStatus.activeBuffs.some(b => b.id === `debuff-${id}`), 'death clears ramp icon immediately');
  tickFeatures(world, player, 100, true);
  assert(!ambientRampStatus(player.tracksCombat), 'dead players cannot regain stacks');
  respawnPlayer(world, player.isPlayer.id);
  assert(!ambientRampStatus(player.tracksCombat), 'respawn does not restore ramp');
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

// Cosmetic events report actual gains only, including the first stack and capped Chill.
for (const nodeId of [HEAT_NODE, 'node-t4-tundra-01']) {
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('flash', nodeId), 'flash');
  tickFeatures(world, player, 100, true);
  const effect = ambientRampStatus(player.tracksCombat)!;
  const first = world.takeNodeEvents(nodeId).filter(e => e.kind === 'ambient-stack-gain');
  assert(first.length === 1 && first[0].kind === 'ambient-stack-gain' && first[0].effectId === effect.id, 'initial stack emits the correct Heat/Chill cue');
  const interval = effect.data.rampMs;
  tickFeatures(world, player, interval * 2, true);
  assert(world.takeNodeEvents(nodeId).filter(e => e.kind === 'ambient-stack-gain').length === 2, 'each gained stack emits one cue');
  tickFeatures(world, player, interval * 2, false);
  assert(!world.takeNodeEvents(nodeId).some(e => e.kind === 'ambient-stack-gain'), 'cooling never flashes');
  if (effect.maxStacks > 0) {
    effect.stacks = effect.maxStacks;
    tickFeatures(world, player, interval * 2, true);
    assert(!world.takeNodeEvents(nodeId).some(e => e.kind === 'ambient-stack-gain'), 'capped Chill never emits fake gains');
  }
}

console.log('ambientRamp.test.ts: ok');
