// BOSS ENCOUNTER REDESIGN — Phase 6: corpse identity, views, and reservation.
//
// Necromancy used to be invisible bookkeeping: corpses lived only as a server list,
// so a player watching a Wasteland fight had no way to know which bodies were about
// to get up, or that the boss was reaching for them at all. The encounter read as
// "things reappear, somehow".
//
// Two claims carry this phase:
//
//   1. THE DEAD ARE VISIBLE. Corpses have stable ids and are broadcast, and a cast
//      that has claimed one marks it WHILE THE CAST RUNS — the answer is on the
//      floor before the payoff, not after it.
//
//   2. A CLAIM IS EXCLUSIVE AND NEVER LEAKS. Two raisers cannot tether the same
//      body, and a reservation that outlived its raiser would leave a corpse
//      permanently marked and permanently unraisable.

import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { updateRaisers } from '../src/systems/combat/ai/raiseDead';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import {
  buildCorpseViews,
  CORPSE_TTL_MS,
  recordCorpse,
  releaseCorpseReservations,
  reserveCorpses,
  reservedCorpses,
  takeNearestCorpse,
  updateCorpses,
} from '../src/systems/world/corpses';
import { buildNodeDelta } from '../src/world/nodeDelta';
import { World } from '../src/world/World';
import type { MonsterEntity } from '../src/ecs/entity';

function assert(condition: boolean, message: string): asserts condition {
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

/** Kill a fixture monster where it stands, leaving a corpse. */
function makeCorpse(world: World, typeId: string, x: number, y: number): void {
  const dead = world.createMonster(NODE, typeId, { x, y });
  assert(!!dead, `${typeId} fixture should spawn`);
  dead.hasHealth.hp = 0;
  recordCorpse(world, dead);
  world.removeMonsterEntity(dead.isMonster.id);
}

function sovereign(world: World, playerId: string): MonsterEntity {
  const boss = world.createMonster(NODE, 'charnel-crown-sovereign', { x: 400, y: 400 })!;
  assert(!!boss, 'the Sovereign should spawn');
  setAggroTarget(world, boss, { id: playerId, kind: 'player' }, 1_000);
  boss.hasAwareness.state = 'attacking';
  return boss;
}

// ─────────────────────────────────────────────────────────────────────────────
// Identity and visibility.
// ─────────────────────────────────────────────────────────────────────────────

// Every corpse gets a stable, unique id, and the node broadcasts them.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('corpse-view'), 'corpse-view');
  makeCorpse(world, 'bone-crawler', 420, 400);
  makeCorpse(world, 'bone-crawler', 460, 400);
  makeCorpse(world, 'plague-hound', 500, 400);

  const views = buildCorpseViews(world, NODE, Date.now());
  assert(views?.length === 3, 'every corpse should be broadcast');
  assert(new Set(views.map(v => v.id)).size === 3, 'corpse ids must be unique');
  assert(
    views.every(v => v.id.length > 0 && MONSTER_DATABASE.has(v.monsterTypeId)),
    'a view should name the body it came from, so the client can draw it',
  );
  assert(
    views.every(v => v.remainingMs > 0 && v.remainingMs <= CORPSE_TTL_MS),
    'and carry its decay clock so the client can fade it',
  );
  assert(views.every(v => v.reservedBy === undefined), 'nothing is claimed yet');

  // It actually reaches the wire.
  const { snapshot } = buildNodeDelta(world, NODE, true);
  assert(snapshot.corpses?.length === 3, 'corpses should ride the node delta');
}

// A node with no dead pays nothing for the feature.
{
  const world = new World();
  assert(
    buildCorpseViews(world, NODE, Date.now()) === undefined,
    'an empty node should omit corpses entirely',
  );
  const { snapshot } = buildNodeDelta(world, NODE, true);
  assert(snapshot.corpses === undefined, 'and send no key at all');
}

// Decay still removes them, and the view follows.
{
  const world = new World();
  makeCorpse(world, 'bone-crawler', 420, 400);
  const now = Date.now();
  updateCorpses(world, now + CORPSE_TTL_MS + 1);
  assert(
    buildCorpseViews(world, NODE, now + CORPSE_TTL_MS + 1) === undefined,
    'a decayed corpse should stop being broadcast',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reservation.
// ─────────────────────────────────────────────────────────────────────────────

// Claiming marks the bodies, and the mark is what the client renders.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('reserve-mark'), 'reserve-mark');
  const boss = sovereign(world, 'reserve-mark');
  makeCorpse(world, 'bone-crawler', 420, 400);
  makeCorpse(world, 'bone-crawler', 460, 400);
  makeCorpse(world, 'bone-crawler', 500, 400);

  const claimed = reserveCorpses(world, boss, 520, 2);
  assert(claimed.length === 2, 'the cast should claim exactly what it asked for');

  const views = buildCorpseViews(world, NODE, Date.now())!;
  const marked = views.filter(v => v.reservedBy === boss.isMonster.id);
  assert(marked.length === 2, 'claimed corpses are marked for the client');
  assert(
    marked.every(v => claimed.includes(v.id)),
    'and the marks name exactly the claimed bodies',
  );
  assert(
    views.some(v => v.reservedBy === undefined),
    'unclaimed bodies stay unmarked — the tell has to distinguish them',
  );
}

// Claiming is DETERMINISTIC: the same board reserves the same bodies. A tether that
// jitters between equidistant corpses reads as a bug.
{
  function claimOrder(): string[] {
    const world = new World();
    world.attachPlayerEntity(playerSlices('reserve-order'), 'reserve-order');
    const boss = sovereign(world, 'reserve-order');
    makeCorpse(world, 'bone-crawler', 420, 400);
    makeCorpse(world, 'bone-crawler', 600, 400);
    makeCorpse(world, 'bone-crawler', 500, 400);
    return reserveCorpses(world, boss, 520, 2).map(id => id.replace(/\\d+$/, ''));
  }
  const a = claimOrder();
  const b = claimOrder();
  assert(a.length === 2 && b.length === 2, 'both runs should claim two');
  assert(a.join('|') === b.join('|'), 'reservation must be deterministic');
}

// A claim is EXCLUSIVE. Two raisers cannot tether the same body.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('reserve-excl'), 'reserve-excl');
  const first = sovereign(world, 'reserve-excl');
  const second = world.createMonster(NODE, 'charnel-crown-sovereign', { x: 430, y: 400 })!;
  makeCorpse(world, 'bone-crawler', 420, 400);

  const firstClaim = reserveCorpses(world, first, 520, 1);
  assert(firstClaim.length === 1, 'the first raiser claims the only body');
  const secondClaim = reserveCorpses(world, second, 520, 1);
  assert(secondClaim.length === 0, 'the second raiser must not claim it too');

  // And it cannot take it out from under the first, either.
  const stolen = takeNearestCorpse(
    world, NODE, second.hasPosition.current, 520, second.isMonster.id,
  );
  assert(stolen === null, "a raiser must not consume another's claim");

  // The owner can still take its own.
  const owned = takeNearestCorpse(
    world, NODE, first.hasPosition.current, 520, first.isMonster.id,
  );
  assert(owned?.id === firstClaim[0], 'the claiming raiser gets its body');
}

// A cancelled cast RELEASES its claims — a corpse claimed by a cast that never
// resolved would be marked forever and raisable by nobody.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('reserve-cancel'), 'reserve-cancel');
  const boss = sovereign(world, 'reserve-cancel');
  makeCorpse(world, 'bone-crawler', 420, 400);

  reserveCorpses(world, boss, 520, 1);
  assert(reservedCorpses(world, boss.isMonster.id, NODE).length === 1, 'setup: claimed');

  releaseCorpseReservations(world, boss.isMonster.id, NODE);
  assert(
    reservedCorpses(world, boss.isMonster.id, NODE).length === 0,
    'cancelling should release the claim',
  );
  assert(
    buildCorpseViews(world, NODE, Date.now())!.every(v => v.reservedBy === undefined),
    'and unmark it for the client',
  );
  // Raisable again by anyone.
  assert(
    takeNearestCorpse(world, NODE, { x: 400, y: 400 }, 520) !== null,
    'a released corpse is available again',
  );
}

// THE RAISER DYING releases its claims too. This is the leak that would matter most:
// a claimed corpse is off limits to everyone, so one stranded by a dead boss would be
// permanently unraisable and permanently glowing.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('reserve-death'), 'reserve-death');
  const boss = sovereign(world, 'reserve-death');
  makeCorpse(world, 'bone-crawler', 420, 400);
  const bossId = boss.isMonster.id;

  reserveCorpses(world, boss, 520, 1);
  assert(reservedCorpses(world, bossId, NODE).length === 1, 'setup: claimed');

  world.removeMonsterEntity(bossId);
  assert(
    reservedCorpses(world, bossId, NODE).length === 0,
    'a dead raiser must not strand its claims',
  );
  assert(
    takeNearestCorpse(world, NODE, { x: 400, y: 400 }, 520) !== null,
    'and the body is raisable again',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The encounter: claim-once, and the invariants that keep the tide finite.
// ─────────────────────────────────────────────────────────────────────────────

// EACH CORPSE RISES ONCE. Feeding three bodies yields at most three risen, ever.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('rise-once'), 'rise-once');
  const boss = sovereign(world, 'rise-once');
  for (let i = 0; i < 3; i++) makeCorpse(world, 'bone-crawler', 420 + i * 20, 400);

  let now = 2_000;
  for (let i = 0; i < 400; i++) {
    now += 500;
    updateRaisers(world, now);
  }
  const risen = [...world.monsterEntitiesInNode(NODE)].filter(m => m.isRaised);
  assert(risen.length > 0, 'the Sovereign should raise what it was fed');
  assert(risen.length <= 3, `three bodies must never yield more than three risen (got ${risen.length})`);
}

// RISEN DEATHS ARE PERMANENT: a risen unit leaves no corpse, so the tide terminates.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('rise-terminal'), 'rise-terminal');
  const boss = sovereign(world, 'rise-terminal');
  makeCorpse(world, 'bone-crawler', 420, 400);

  let now = 2_000;
  for (let i = 0; i < 200 && ![...world.monsterEntitiesInNode(NODE)].some(m => m.isRaised); i++) {
    now += 500;
    updateRaisers(world, now);
  }
  const risen = [...world.monsterEntitiesInNode(NODE)].find(m => m.isRaised);
  assert(!!risen, 'setup: something should have risen');

  risen.hasHealth.hp = 0;
  recordCorpse(world, risen);
  assert(
    buildCorpseViews(world, NODE, Date.now()) === undefined,
    'a risen unit must leave no reusable corpse — the tide has to terminate',
  );
}

// The boss itself never leaves a raisable body.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('boss-corpse'), 'boss-corpse');
  const boss = sovereign(world, 'boss-corpse');
  boss.hasHealth.hp = 0;
  recordCorpse(world, boss);
  assert(
    buildCorpseViews(world, NODE, Date.now()) === undefined,
    'a boss corpse would be absurd to raise',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The authored Wasteland shape.
// ─────────────────────────────────────────────────────────────────────────────

{
  const def = MONSTER_DATABASE.get('charnel-crown-sovereign')!;
  assert(!!def.raisesDead, 'the Sovereign should raise the dead');
  assert((def.raisesDead.castMs ?? 0) > 0, 'and announce it with a cast');
  assert(def.raisesDead.maxAlive > 0, 'with a living-risen cap so the tide is bounded');

  // Removed: the generic circle, the broad personal DoT, and the aggro speed burst.
  assert(def.chargedAttack === undefined, 'Charnel Burst should be gone');
  assert(
    def.dotEffect === undefined,
    'the always-on Crown Decay should be gone — the corpse tide IS the attrition',
  );
  assert(def.chargeOnAggro === undefined, 'and the aggro speed burst with it');

  // The opening entourage: one shot, on engage, with the three authored roles.
  const opener = (def.bossScript?.phases ?? []).find(phase =>
    phase.actions.some(action => action.type === 'spawn-adds'),
  );
  assert(!!opener, 'the Sovereign should arrive with an entourage');
  assert(opener.hpPct === 1.0, 'which fires on engage, never mid-fight');
  const spawned = opener.actions
    .filter((action): action is Extract<typeof action, { type: 'spawn-adds' }> =>
      action.type === 'spawn-adds')
    .map(action => action.monsterTypeId);
  for (const role of ['bone-crawler', 'plague-hound', 'carrion-vulture']) {
    assert(spawned.includes(role), `the entourage should include ${role}`);
    assert(MONSTER_DATABASE.has(role), `${role} should exist in the roster`);
  }
}

console.log('bossCorpsesPhase6: ok');
