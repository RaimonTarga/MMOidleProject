import {
  AMBIENT_RAMP_KEY,
  GAME_CONFIG,
  MIN_PLAYER_MOVE_SLOW_MULT,
  MONSTER_DATABASE,
  RESOLVED_NODE_FEATURES,
  STARTER_RUNE_IDS,
  TUNDRA_CHILL_EFFECT_ID,
  WORLD_NODE_LIST,
  ambientRampScalingMult,
  applyStatusEffect,
  describeMonsterMechanics,
  distanceSq,
  emptyEquipment,
  getStatusEffect,
  isHarmfulPlayerStatusEffect,
  playerIncomingDamageMult,
  playerOutgoingDamageMult,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { PlayerEntity } from '../src/ecs/entity';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { syncPlayerBuffs } from '../src/systems/combat/buffs/buffSync';
import { runMonsterAttack } from '../src/systems/combat/engine/combat';
import { updateNodeFeatures } from '../src/systems/world/nodeFeatures';
import { setEntityMotion, updateMovement } from '../src/systems/world/movement';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const CHILL_NODE = 'node-t4-tundra-01';
const WARM_NODE = 'node-5-5';
const SPOT = { x: 400, y: 400 };

/** The Tundra capstone — the one mob allowed to feed on the ramp. */
const APEX_ID = 'permafrost-behemoth';

const CHILL = RESOLVED_NODE_FEATURES[CHILL_NODE].find((f) => f.ambientRamp)?.ambientRamp;
assert(CHILL !== undefined, `${CHILL_NODE} must author an ambientRamp feature`);
const RAMP_MS = CHILL!.rampMs;
const MAX_STACKS = CHILL!.maxStacks;
const SLOW_PER_STACK = CHILL!.payload.moveSlowPct ?? 0;

function makePlayerSlices(id: string, nodeId: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { ...SPOT }, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
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

/** Strip every mitigation layer so a damage delta can only be the amplifier. */
function isolate(player: PlayerEntity): void {
  player.mitigatesDamage.plating = 0;
  player.mitigatesDamage.damageReduction = 0;
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

/** Fill a player's chill to full stacks. */
function chillToFull(world: World, player: PlayerEntity): void {
  tickFeatures(world, player, RAMP_MS * (MAX_STACKS + 1), true);
  const chill = getStatusEffect(player.tracksCombat, TUNDRA_CHILL_EFFECT_ID);
  assert(chill?.stacks === MAX_STACKS, 'test setup needs a fully chilled player');
}

initCombatSystems();

// ── Authoring: every tundra node carries the chill, and the chill is ALL cost ──
{
  const tundraNodes = WORLD_NODE_LIST.filter((n) => n.biomeGroup === 'tundra');
  assert(tundraNodes.length > 0, 'expected tundra nodes in the world');

  for (const node of tundraNodes) {
    const ramps = (RESOLVED_NODE_FEATURES[node.id] ?? []).filter((f) => f.ambientRamp);
    assert(
      ramps.length === 1,
      `${node.id} must author exactly one ambient ramp (the pass only ever runs the FIRST)`,
    );
    const ramp = ramps[0].ambientRamp!;
    assert(
      ramp.effectId === TUNDRA_CHILL_EFFECT_ID,
      `${node.id} must ramp the tundra chill, not ${ramp.effectId}`,
    );
    assert(
      (ramp.payload.moveSlowPct ?? 0) > 0,
      `${node.id}'s chill must actually slow — the move slow IS the mechanic`,
    );
    assert(
      !ramp.payload.outgoingDamagePct && !ramp.payload.incomingDamagePct,
      `${node.id}'s chill must carry NO damage amplifier — locked decision: no upside, ` +
        'and the roster-wide damage ramp is exactly what the one-elite rule rules out',
    );
  }

  // Dungeons included: the boss exam is "kill it before the room takes your legs".
  assert(
    tundraNodes.some((n) => n.kind === 'dungeon'),
    'the tundra dungeons must be covered by the sweep above, not exempt from it',
  );
}

// ── The ramp climbs in combat, slows the player, and pays out nothing ─────────
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('chill', CHILL_NODE), 'chill');
  const cs = player.tracksCombat;
  const hpBefore = player.hasHealth.hp;

  assert(getStatusEffect(cs, TUNDRA_CHILL_EFFECT_ID) === undefined, 'no chill before the fight');

  tickFeatures(world, player, 100, true);
  const chill = getStatusEffect(cs, TUNDRA_CHILL_EFFECT_ID);
  assert(chill?.stacks === 1, 'entering combat in the tundra starts the chill');
  assert(
    (chill!.data[AMBIENT_RAMP_KEY] ?? 0) !== 0,
    'the chill must carry the generic ramp marker the decay/cleanse passes look for',
  );

  chillToFull(world, player);
  assert(
    playerIncomingDamageMult(cs) === 1 && playerOutgoingDamageMult(cs) === 1,
    'the chill must not touch either damage amplifier — the volcano is the greed ramp, not this',
  );
  assert(player.hasHealth.hp === hpBefore, 'the chill deals no damage of its own');

  // The tile is the whole client tell for an invisible status, and its speedMult is
  // load-bearing: own-player extrapolation collapses it through the same clamp.
  syncPlayerBuffs(world, Date.now());
  const tile = player.hasStatus.activeBuffs.find((b) => b.id === 'debuff-tundra-chill');
  assert(tile !== undefined, 'the chill must project a buff tile');
  assert(tile!.stacks === MAX_STACKS, 'the tile reports live stacks');
  assert(tile!.durationPct === 100, 'a full ramp reads as a full fill, not a countdown');
  assert(
    Math.abs(tile!.speedMult! - (1 - SLOW_PER_STACK * MAX_STACKS)) < 1e-9,
    'the tile must publish the move slow, or the client over-extrapolates and snaps back',
  );

  assert(
    isHarmfulPlayerStatusEffect(TUNDRA_CHILL_EFFECT_ID, chill!.data),
    'the chill must count as a debuff so a cleanse can strip it',
  );

  tickFeatures(world, player, RAMP_MS * 2, false);
  assert(
    getStatusEffect(cs, TUNDRA_CHILL_EFFECT_ID)!.stacks === MAX_STACKS - 2,
    'disengaging sheds the chill gradually, not in one cliff',
  );
}

// ── The slow reaches real movement, and meets the shared floor ────────────────
{
  const world = new World();
  const warm = world.attachPlayerEntity(makePlayerSlices('mv-warm', CHILL_NODE), 'mv-warm');
  const cold = world.attachPlayerEntity(makePlayerSlices('mv-cold', CHILL_NODE), 'mv-cold');
  chillToFull(world, cold);

  const target = { x: SPOT.x + 900, y: SPOT.y };
  setEntityMotion(world, warm, target);
  setEntityMotion(world, cold, target);
  const warmFrom = { ...warm.hasPosition.current };
  const coldFrom = { ...cold.hasPosition.current };
  updateMovement(world, 100, Date.now());
  const warmMoved = Math.sqrt(distanceSq(warmFrom, warm.hasPosition.current));
  const coldMoved = Math.sqrt(distanceSq(coldFrom, cold.hasPosition.current));

  assert(warmMoved > 0, 'the control player must actually move');
  assert(
    Math.abs(coldMoved / warmMoved - (1 - SLOW_PER_STACK * MAX_STACKS)) < 0.02,
    `a fully chilled player must move slower (ratio ${coldMoved / warmMoved})`,
  );

  // The chill is the FOURTH slow source in this biome (roster slowEffect, frost-ramp,
  // hazard slows) — the clamp is what stops it from compounding into a soft root.
  applyStatusEffect(cold.tracksCombat, {
    id: 'slow',
    maxStacks: 1,
    remainingMs: 5_000,
    refreshable: true,
    sourceId: 'test',
    data: { speedMult: 0.45, totalMs: 5_000 },
  });
  const floorFrom = { ...cold.hasPosition.current };
  setEntityMotion(world, cold, target);
  updateMovement(world, 100, Date.now());
  const floorMoved = Math.sqrt(distanceSq(floorFrom, cold.hasPosition.current));
  assert(
    floorMoved / warmMoved >= MIN_PLAYER_MOVE_SLOW_MULT - 0.02,
    'chill stacked with a roster slow must clamp at the floor, not compound past it',
  );
}

// ── The capstone: the apex hits harder the colder its target is ──────────────
{
  const helper = { perStackPct: 0.1, maxPct: 0.25 };
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('scale', CHILL_NODE), 'scale');
  const cs = player.tracksCombat;

  assert(ambientRampScalingMult(undefined, cs) === 1, 'a mob without the field is unaffected');
  assert(ambientRampScalingMult(helper, cs) === 1, 'an unchilled target feeds nothing');

  tickFeatures(world, player, 100, true);
  assert(
    Math.abs(ambientRampScalingMult(helper, cs) - 1.1) < 1e-9,
    'one stack should read as its authored per-stack fraction',
  );

  chillToFull(world, player);
  assert(
    Math.abs(ambientRampScalingMult(helper, cs) - 1.25) < 1e-9,
    'the scaling must clamp at its own maxPct rather than tracking stacks forever',
  );
}

// ── ...through the real attack path, and only for the apex ───────────────────
{
  const world = new World();
  const warm = world.attachPlayerEntity(makePlayerSlices('hit-warm', CHILL_NODE), 'hit-warm');
  const cold = world.attachPlayerEntity(makePlayerSlices('hit-cold', CHILL_NODE), 'hit-cold');
  isolate(warm);
  isolate(cold);
  chillToFull(world, cold);

  const apex = world.createMonster(CHILL_NODE, APEX_ID, { x: SPOT.x + 10, y: SPOT.y });
  assert(!!apex, `test needs a ${APEX_ID}`);

  // ⚠ `chargedOnly` (T1-T4 monster rework, locked): ONLY the apex's telegraphed
  // Glacial Slam feeds on the chill. Scaling every swing made this a flat difficulty
  // knob; scaling just the slam makes it a TELL — arrive cold and the one hit you
  // most need to walk out of is the one you cannot walk out of.

  // Ordinary swing (chargeMult 1): identical against a warm and a frozen target.
  const warmHp = warm.hasHealth.hp;
  runMonsterAttack(world, apex!, warm, 1_000);
  const warmHit = warmHp - warm.hasHealth.hp;

  const coldHp = cold.hasHealth.hp;
  runMonsterAttack(world, apex!, cold, 1_000);
  const coldHit = coldHp - cold.hasHealth.hp;

  assert(warmHit > 0 && coldHit > 0, 'both hits must land');
  assert(
    warmHit === coldHit,
    `the apex's ORDINARY swing must ignore chill (warm ${warmHit} vs cold ${coldHit})`,
  );

  // The Glacial Slam (any chargeMult > 1) does feed on it.
  const fed = MONSTER_DATABASE.get(APEX_ID)!.scalesWithAmbientRamp!;
  const expected = 1 + Math.min(fed.maxPct, fed.perStackPct * MAX_STACKS);
  const warmSlamHp = warm.hasHealth.hp;
  runMonsterAttack(world, apex!, warm, 2_500, 2);
  const warmSlam = warmSlamHp - warm.hasHealth.hp;

  const coldSlamHp = cold.hasHealth.hp;
  runMonsterAttack(world, apex!, cold, 2_500, 2);
  const coldSlam = coldSlamHp - cold.hasHealth.hp;

  assert(warmSlam > 0 && coldSlam > 0, 'both slams must land');
  assert(
    Math.abs(coldSlam / warmSlam - expected) < 0.02,
    `the apex's SLAM must hit a fully chilled target ${expected}x harder (got ${coldSlam / warmSlam})`,
  );

  // A roster mob standing in the same room does NOT get the payout at all — locked
  // decision 5 is one elite, not a biome-wide damage ramp.
  const grunt = world.createMonster(CHILL_NODE, 'glacial-direbear', { x: SPOT.x + 10, y: SPOT.y });
  assert(!!grunt, 'test needs a non-apex tundra mob');
  const warmHp2 = warm.hasHealth.hp;
  runMonsterAttack(world, grunt!, warm, 2_000);
  const gruntWarm = warmHp2 - warm.hasHealth.hp;
  const coldHp2 = cold.hasHealth.hp;
  runMonsterAttack(world, grunt!, cold, 2_000);
  const gruntCold = coldHp2 - cold.hasHealth.hp;
  assert(
    gruntWarm === gruntCold,
    'an ordinary tundra mob must hit a chilled and an unchilled player identically',
  );
}

// ── The scaling is scoped to exactly one T4 elite, and it is described ────────
{
  const carriers = [...MONSTER_DATABASE.entries()].filter(
    ([, def]) => def.scalesWithAmbientRamp !== undefined,
  );
  assert(
    carriers.length === 1 && carriers[0][0] === APEX_ID,
    `locked decision 5: exactly one mob may scale off the ramp (found ${carriers.map(([id]) => id).join(', ')})`,
  );
  const apexDef = carriers[0][1];
  assert(apexDef.elite === true, 'the chill-scaling mob must be the biome capstone, not trash');
  assert(apexDef.biome === 'tundra', 'the chill-scaling mob belongs to the biome that authors it');

  // A hidden multiplier is a bug; the bestiary has to say it out loud.
  const described = describeMonsterMechanics(apexDef).some((line) => line.id === 'ambient-fed');
  assert(described, 'the bestiary must describe the ramp scaling — it is the capstone tell');
}

// ── A warm node authors no ramp at all ───────────────────────────────────────
{
  assert(
    !(RESOLVED_NODE_FEATURES[WARM_NODE] ?? []).some((f) => f.ambientRamp),
    'the clearing must not author an ambient ramp',
  );
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('warm', WARM_NODE), 'warm');
  tickFeatures(world, player, RAMP_MS * 3, true);
  assert(
    getStatusEffect(player.tracksCombat, TUNDRA_CHILL_EFFECT_ID) === undefined,
    'fighting outside the tundra must never chill anyone',
  );
}

console.log('tundraChill.test.ts: ok');
