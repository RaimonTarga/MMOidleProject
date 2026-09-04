// BOSS ENCOUNTER REDESIGN — Phase 5: generalized hazards, Vent/Heat, Cataclysm.
//
// The generalization claim first: Swamp rot, the Plague Hound's death pool and the
// Volcano's magma vents are now ONE hazard family. That is only worth doing if the
// existing consumers are provably unchanged, so the parity assertions come first and
// the new behaviour is built on top of them.
//
// The design claim second: a Vent ACCELERATES the room's Heat rather than minting a
// second Heat source, and it is deliberately NOT auto-avoided — standing in it is a
// legal, rewarded choice, and the trade is the encounter.

import {
  ambientRampStatus,
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  VOLCANIC_HEAT_EFFECT_ID,
  emptyEquipment,
  isCleanseable,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { updateBossPatterns } from '../src/systems/combat/ai/bossPatterns';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { updateShellUp } from '../src/systems/combat/ai/shellUp';
import {
  activeAvoidablePersistentGroundZones,
  buildGroundZoneViews,
  hazardRampAcceleration,
  publishToxicPool,
  updateGroundZones,
  type RuntimeToxicPool,
} from '../src/systems/world/groundZones';
import { updateNodeFeatures } from '../src/systems/world/nodeFeatures';
import { buildKillerFromMonster } from '../src/systems/world/deathCause';
import { World } from '../src/world/World';
import type { PlayerEntity } from '../src/ecs/entity';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
const HEAT_NODE = 'node-t4-volcanic-dungeon';

function playerSlices(id: string, nodeId = NODE, x = 405, y = 400): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x, y }, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
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

// ─────────────────────────────────────────────────────────────────────────────
// PARITY — the existing hazard consumers must be untouched by the generalization.
// ─────────────────────────────────────────────────────────────────────────────

// Swamp rot: still hostile, persistent, avoided, and still ticks and slows.
{
  const world = new World();
  const inside = world.attachPlayerEntity(playerSlices('rot-in'), 'rot-in');
  const outside = world.attachPlayerEntity(playerSlices('rot-out'), 'rot-out');
  outside.hasPosition.current = { x: 900, y: 400 };
  const boss = world.createMonster(NODE, 'grave-toadeater', { x: 100, y: 100 })!;

  const pool = publishToxicPool(world, NODE, {
    kind: 'toxic-pool', pos: { x: 405, y: 400 }, radius: 90,
    startedAtMs: 1_000, expiresAtMs: 60_000, damagePerTick: 5, tickIntervalMs: 1_000,
    slowSpeedMult: 0.65, ownerId: boss.isMonster.id, killer: buildKillerFromMonster(boss),
  });

  // An UNFLAVOURED pool is exactly what it was: the default must not have moved.
  assert(pool.flavor === undefined, 'an unflavoured pool stays unflavoured');
  assert(pool.rampAccelMult === undefined, 'and does not touch the room ramp');
  assert(pool.semantics.disposition === 'hostile-to-player', 'still hostile');
  assert(pool.semantics.persistence === 'persistent', 'still persistent');
  assert(pool.semantics.movementResponse === 'avoid-hazards', 'still avoided');
  assert(
    activeAvoidablePersistentGroundZones(world, NODE, 2_000).some(z => z.id === pool.id),
    'and still picked up by the avoidance query',
  );

  const insideHp = inside.hasHealth.hp;
  const outsideHp = outside.hasHealth.hp;
  updateGroundZones(world, 2_000);
  assert(inside.hasHealth.hp < insideHp, 'rot still damages a player inside it');
  assert(outside.hasHealth.hp === outsideHp, 'and still spares one outside');
}

// The Plague Hound's death pool uses the same family and is unowned on purpose, so
// it outlives its maker — the corpse's parting gift.
{
  const hound = MONSTER_DATABASE.get('plague-hound');
  assert(!!hound?.onDeath?.spawnHazard, 'the Plague Hound should still leave a death pool');
  assert(
    hound.onDeath.spawnHazard.kind === 'toxic-pool',
    'and it should be the shared hazard family, not a private one',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The Vent.
// ─────────────────────────────────────────────────────────────────────────────

for (const id of ['cinder-shell-magma-salamander', 'caldera-sovereign']) {
  const def = MONSTER_DATABASE.get(id)!;
  const vent = def.shellUp?.pool;
  assert(vent?.flavor === 'magma-vent', `${id} should lay a magma vent`);
  assert((vent.rampAccelMult ?? 1) > 1, `${id} vent should accelerate the room's Heat`);
  assert(def.chargedAttack === undefined, `${id} should drop its generic Eruption`);
  assert(def.chargeOnAggro === undefined, `${id} should drop the aggro speed burst`);
  assert(
    !def.scalesWithAmbientRamp,
    `${id} must not ALSO scale its own damage with Heat — that counts it twice`,
  );
}

function ventedWorld(id: string, playerId: string) {
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices(playerId, HEAT_NODE), playerId);
  const boss = world.createMonster(HEAT_NODE, id, { x: 405, y: 400 })!;
  assert(!!boss, `${id} should spawn`);
  setAggroTarget(world, boss, { id: playerId, kind: 'player' }, Date.now());
  boss.hasAwareness.state = 'attacking';
  return { world, player, boss };
}

/** Drive the shell until it lays its vent. */
function layVent(world: World, boss: ReturnType<typeof ventedWorld>['boss']): RuntimeToxicPool {
  const now = Date.now();
  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.5;
  for (let i = 0; i < 40; i++) {
    updateShellUp(world, boss, now + i * 200);
    const vent = (world.groundZones.get(HEAT_NODE) ?? []).find(
      (zone): zone is RuntimeToxicPool => zone.kind === 'toxic-pool',
    );
    if (vent) return vent;
  }
  throw new Error('the shell never laid its vent');
}

// A VENT IS NOT AUTO-AVOIDED. This is the load-bearing distinction: staying inside
// trades damage taken for damage dealt, so a rune dragging the player out would be
// answering a question the encounter meant them to answer themselves.
{
  const { world, boss } = ventedWorld('cinder-shell-magma-salamander', 'vent-avoid');
  const vent = layVent(world, boss);

  assert(vent.flavor === 'magma-vent', 'the shell should lay a magma vent');
  assert(vent.semantics.movementResponse === 'none', 'a vent must NOT be auto-avoided');
  assert(vent.semantics.disposition === 'hostile-to-player', 'it is still dangerous');
  assert(
    !activeAvoidablePersistentGroundZones(world, HEAT_NODE, Date.now()).some(
      z => z.id === vent.id,
    ),
    'and the avoidance query must leave it alone',
  );

  // The client is told what it is, so it can paint magma rather than rot.
  const view = (buildGroundZoneViews(world, HEAT_NODE, Date.now()) ?? [])
    .find(z => z.id === vent.id);
  assert(view?.flavor === 'magma-vent', 'the view should carry the hazard flavour');
}

// Standing in the vent ACCELERATES the room's Heat; stepping out returns the player
// to the node's baseline rate. One Heat number, two rates.
{
  const { world, player, boss } = ventedWorld('cinder-shell-magma-salamander', 'vent-heat');
  const vent = layVent(world, boss);

  player.hasPosition.current = { ...vent.pos };
  const inside = hazardRampAcceleration(world, HEAT_NODE, player.hasPosition.current, Date.now());
  assert(inside > 1, `standing in the vent should accelerate Heat (got ${inside})`);
  assert(
    inside === (vent.rampAccelMult ?? 1),
    'the acceleration should be exactly what the vent authored',
  );

  player.hasPosition.current = { x: vent.pos.x + vent.radius * 4, y: vent.pos.y };
  assert(
    hazardRampAcceleration(world, HEAT_NODE, player.hasPosition.current, Date.now()) === 1,
    'stepping out returns the player to the room baseline',
  );
}

// End to end: two players in the same room, one in the vent and one out, and the one
// standing in it heats up faster. This is the trade the whole encounter is about.
{
  const { world, player, boss } = ventedWorld('cinder-shell-magma-salamander', 'vent-a');
  const outside = world.attachPlayerEntity(playerSlices('vent-b', HEAT_NODE), 'vent-b');
  const vent = layVent(world, boss);

  player.hasPosition.current = { ...vent.pos };
  outside.hasPosition.current = { x: vent.pos.x + vent.radius * 4, y: vent.pos.y };

  for (let i = 0; i < 12; i++) {
    player.tracksEngagement = Date.now();
    outside.tracksEngagement = Date.now();
    updateNodeFeatures(world, 500);
  }

  const hot = ambientRampStatus(player.tracksCombat)?.stacks ?? 0;
  const cool = ambientRampStatus(outside.tracksCombat)?.stacks ?? 0;
  assert(hot > 0, 'the player in the vent should be carrying Heat');
  assert(
    hot > cool,
    `standing in the vent should heat you faster (${hot} in vs ${cool} out)`,
  );
}

// Heat stays the thing you answer WITH YOUR FEET, not with a button (Phase 3 policy,
// re-asserted here because the Vent is what finally makes that decision matter).
{
  assert(
    !isCleanseable(VOLCANIC_HEAT_EFFECT_ID, {}),
    'Cleanse must not answer Heat — leaving the vent is the answer',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The Cataclysm.
// ─────────────────────────────────────────────────────────────────────────────

const CALDERA = MONSTER_DATABASE.get('caldera-sovereign')!;
const CATACLYSM = CALDERA.bossPattern!;

{
  assert(CATACLYSM.oncePerLife === true, 'the Cataclysm fires once per life');
  assert(CATACLYSM.armBelowHpPct === 0.25, 'and only in the final quarter');
  const cast = CATACLYSM.steps[0];
  assert(cast.kind === 'cast' && cast.interruptible === false, 'it is uninterruptible');
  assert(cast.kind === 'cast' && cast.castMs >= 5_000, 'and long enough to race');
  const impact = CATACLYSM.steps[1];
  assert(impact.kind === 'impact' && impact.radius >= 1_000, 'the blast is room-wide');
}

function armedCaldera(hpPct: number) {
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('cataclysm', HEAT_NODE), 'cataclysm');
  const boss = world.createMonster(HEAT_NODE, 'caldera-sovereign', { x: 405, y: 400 })!;
  setAggroTarget(world, boss, { id: 'cataclysm', kind: 'player' }, 1_000);
  boss.hasAwareness.state = 'attacking';
  boss.hasHealth.hp = boss.hasHealth.maxHp * hpPct;
  const armedAt = 1_000 + (CATACLYSM.initialCooldownMs ?? CATACLYSM.cooldownMs) + 1_000;
  return { world, player, boss, armedAt };
}

// It does not begin above the health gate.
{
  const { world, boss, armedAt } = armedCaldera(0.4);
  updateBossPatterns(world, 100, armedAt);
  assert(!boss.runsBossPattern, 'the Cataclysm must not start above the final quarter');
}

// In the final quarter it starts, stops the boss attacking, and resists interruption.
{
  const { world, boss, armedAt } = armedCaldera(0.2);
  updateBossPatterns(world, 100, armedAt);
  assert(!!boss.runsBossPattern, 'the Cataclysm should begin in the final quarter');
  assert(!!boss.cannotAttack, 'and the boss stops attacking while it channels');
}

// It resolves ONCE. Surviving it is a legitimate outcome and the fight continues —
// a failed race is not a win condition, and repeating it would make it a metronome.
{
  const { world, player, boss, armedAt } = armedCaldera(0.2);
  const before = player.hasHealth.hp;
  let now = armedAt;
  updateBossPatterns(world, 100, now);
  for (let i = 0; i < 200 && !boss.recoversFromPattern; i++) {
    now += 100;
    updateBossPatterns(world, 100, now);
  }
  assert(player.hasHealth.hp < before, 'the Cataclysm should actually land');
  assert(!!boss.recoversFromPattern, 'and end in a recovery');

  // Let the recovery lapse and run well past the cooldown: it must never come back.
  now = boss.recoversFromPattern!.endsAtMs + 1;
  updateBossPatterns(world, 100, now);
  const afterBlast = player.hasHealth.hp;
  for (let i = 0; i < 400; i++) {
    now += 500;
    updateBossPatterns(world, 100, now);
  }
  assert(!boss.runsBossPattern, 'the Cataclysm must not re-arm');
  assert(player.hasHealth.hp === afterBlast, 'and must not land a second time');
  assert(world.hasMonster(boss.isMonster.id), 'the fight simply continues');
}

console.log('bossVolcanoPhase5: ok');
