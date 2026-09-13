// BOG LURKER — DEATHROLL (2026-09-12).
//
// A wiring smoke test, not a balance test. Every assertion is about SHAPE — what
// fires, what owns what, what releases — and none of them pin a damage number.
//
// What is covered:
//   1. The ability is authored as a lunge + drag pair, and the ranges are a
//      coherent set (notice range sits between the jaws and the leap).
//   2. `nearestSwampRotPool` finds real water and honours its range cap.
//   3. The lurker idles at the RIM of its pool, not in the middle of it.
//   4. The wind-up OPENS from outside melee — the whole point of `lunge`, and the
//      thing the combat loop's `attackRange` gate would otherwise forbid.
//   5. It holds position through the tell instead of walking in, and does not sneak
//      an ordinary bite from leap range while it coils.
//   6. Resolution leaps the gap, lands the hit, and starts the haul.
//   7. The haul roots the victim, moves BOTH bodies toward the pool, telegraphs
//      itself, and releases on its own.
//   8. Leaving the leap mid-tell denies the pounce, and interrupting the crocodile
//      mid-haul frees the victim early — the root goes with the grip.
//   9. A node with no water degrades to an ordinary charged bite rather than
//      dragging anyone to a made-up point.
//  10. The whole thing reaches a player-facing surface.

import {
  GAME_CONFIG,
  LAIR_DRAG_ROOT_EFFECT_ID,
  applyStatusEffect,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  describeMonsterAbilities,
  describeMonsterMechanics,
  emptyEquipment,
  getStatusEffect,
  nearestSwampRotPool,
  pointFromMotion,
  swampRotPools,
  type MonsterDefinition,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import type { MonsterEntity, PlayerEntity } from "../src/ecs/entity";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { updateCombat } from "../src/systems/combat/engine/combat";
import { updateMonsters } from "../src/systems/combat/ai/ai";
import { beginLairDrag, updateLairDrags } from "../src/systems/combat/damage/lairDrag";
import { setAggroTarget } from "../src/systems/combat/ai/targeting";
import { applyStun } from "../src/systems/combat/status/stun";
import { setEntityMotion, updateMovement } from "../src/systems/world/movement";
import { syncPlayerBuffs } from "../src/systems/combat/buffs/buffSync";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function def(id: string): MonsterDefinition {
  const d = MONSTER_DATABASE.get(id);
  assert(!!d, `${id} should exist in MONSTER_DATABASE`);
  return d!;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

initCombatSystems();

const SWAMP_NODE = "node-t3-swamp-01";
const lurker = def("bog-lurker");

// ═══════════════════════════════════════════════════════════════════════════
// 1. AUTHORING — the pair, and the ranges that make it readable
// ═══════════════════════════════════════════════════════════════════════════
{
  const charged = lurker.chargedAttack;
  assert(charged?.name === "Deathroll", "the Bog Lurker should carry the Deathroll");
  assert((charged!.lunge?.range ?? 0) > 0, "Deathroll should be a lunge");
  assert(charged!.dragsToLair?.lair === "swamp-pool", "Deathroll should drag to the bog");
  assert(
    lurker.idleAnchor === "swamp-pool",
    "the drag only makes sense on a mob that lives at the water",
  );

  // RANGE COHERENCE. Notice range must sit between the jaws and the leap: under the
  // jaws there is no ambush, over the leap the lurker walks most of the way in
  // before it may coil and the pounce stops being a pounce.
  assert(
    lurker.stats.pullRange > lurker.stats.attackRange &&
      lurker.stats.pullRange <= charged!.lunge!.range,
    `pullRange ${lurker.stats.pullRange} should sit between attackRange ` +
      `${lurker.stats.attackRange} and lunge range ${charged!.lunge!.range}`,
  );

  // THE TELL HAS TO BE WALKABLE, or it is a tax rather than a telegraph: a player at
  // base speed must be able to leave the leap during the wind-up.
  const reachable = (GAME_CONFIG.PLAYER_SPEED * charged!.castMs) / 1_000;
  assert(
    reachable > charged!.lunge!.range - lurker.stats.pullRange,
    `a player at base speed must be able to break the ${charged!.lunge!.range}px leap ` +
      `inside the ${charged!.castMs}ms tell (covers ${Math.round(reachable)}px)`,
  );

  // The cost of this ability is the DESTINATION, not the bite. A big multiplier on
  // top would charge twice for one mistake.
  assert(
    charged!.multiplier <= 1.6,
    "the Deathroll should be a relocation, not a one-shot",
  );
  // The root is the haul's own; authoring both would mean two clocks on one grip.
  assert(
    charged!.rootMs === undefined,
    "dragsToLair owns the root — a second rootMs would double-hold the victim",
  );
}

// ── DATABASE-WIDE: neither rider survives a planted circle ───────────────────
//
// `aoe` resolves down `resolveChargedSlam` and returns before any direct-hit rider
// runs, so a charge authoring both would leap nowhere and drag nobody — silently,
// which is exactly how the same trap next to `rootMs` went unnoticed. Cheap to guard,
// so guard it for every monster rather than only for this one.
for (const d of MONSTER_DATABASE.values()) {
  const charged = d.chargedAttack;
  if (!charged?.aoe) continue;
  assert(
    charged.lunge === undefined,
    `${d.id}: lunge cannot ride a planted aoe charge — the leap would never happen`,
  );
  assert(
    charged.dragsToLair === undefined,
    `${d.id}: dragsToLair cannot ride a planted aoe charge — the haul would never start`,
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. THE LAIR LOOKUP
// ═══════════════════════════════════════════════════════════════════════════
{
  const pools = swampRotPools(SWAMP_NODE);
  assert(pools.length > 0, `${SWAMP_NODE} should have rot pools to drag into`);
  assert(
    swampRotPools("node-t1-plains-01").length === 0,
    "only the swamp has rot pools",
  );

  const from = { x: pools[0].x + 200, y: pools[0].y + 200 };
  const near = nearestSwampRotPool(SWAMP_NODE, from);
  assert(!!near, "a point beside a pool should find one");
  for (const pool of pools) {
    assert(
      dist(from, near!) <= dist(from, pool) + 0.001,
      "nearestSwampRotPool should return the closest pool",
    );
  }
  assert(
    nearestSwampRotPool(SWAMP_NODE, from, 10) === null,
    "the range cap should be honoured, so a drag is always local",
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. IT WAITS AT THE RIM
// ═══════════════════════════════════════════════════════════════════════════
//
// The ecology half of the change. Deep water hid the ambusher behind its own
// hazard; the lunge opens from the shoreline, so that is where it has to stand.
{
  const world = new World();
  const pool = swampRotPools(SWAMP_NODE)[0];
  const spawn = { x: pool.x, y: pool.y };
  const mob = world.createMonster(SWAMP_NODE, "bog-lurker", spawn)!;

  let now = Date.now();
  const samples: number[] = [];
  for (let i = 0; i < 400 && samples.length < 6; i++) {
    now += 500;
    updateMonsters(world, 500, now);
    if (!mob.isMoving) continue;
    const target = pointFromMotion(mob.hasPosition.current, mob.isMoving.motion);
    samples.push(dist(target, pool) / pool.radius);
    // Park it back on the anchor so the next idle re-rolls from the same place.
    mob.hasPosition.current = { ...spawn };
  }
  assert(samples.length >= 3, "the idle lurker should pick wander targets");
  assert(
    samples.every((frac) => frac > 0.7 && frac < 1.05),
    `every idle target should sit in the pool's rim band, got ${samples
      .map((f) => f.toFixed(2))
      .join(", ")}`,
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4-7. THE WHOLE SEQUENCE, LIVE
// ═══════════════════════════════════════════════════════════════════════════
{
  const charged = lurker.chargedAttack!;
  const world = new World();
  const pool = swampRotPools(SWAMP_NODE)[0];
  // Lurker on the rim; player outside its jaws but well inside its leap.
  const mobAt = { x: pool.x + pool.radius * 0.9, y: pool.y };
  const playerAt = { x: mobAt.x + 200, y: mobAt.y };
  const player = makePlayer(world, SWAMP_NODE, playerAt.x, playerAt.y);
  const mob = world.createMonster(SWAMP_NODE, "bog-lurker", mobAt)!;

  let now = Date.now();
  const step = (): void => {
    now += 100;
    updateLairDrags(world, 100, now);
    updateMonsters(world, 100, now);
    updateCombat(world, 100, now);
  };

  setAggroTarget(world, mob, { id: player.isPlayer.id, kind: "player" }, now);
  step();

  // 4. THE WIND-UP OPENS FROM OUTSIDE MELEE. Without `lunge` the combat loop's
  //    attackRange gate would have refused to start it at 200px.
  const started = world
    .takeNodeEvents(SWAMP_NODE)
    .filter((e) => e.kind === "monster-cast-start" && e.label === "Deathroll");
  assert(started.length === 1, "the Deathroll should open from outside the jaws");
  assert(
    dist(mob.hasPosition.current, player.hasPosition.current) >
      lurker.stats.attackRange,
    "...and it should still be out of melee when it opens",
  );

  // 5. IT COILS RATHER THAN WALKING IN, and steals no ordinary bite meanwhile.
  const hpAtCastStart = player.hasHealth.hp;
  const coiledAt = { ...mob.hasPosition.current };
  const castTicks = Math.floor(charged.castMs / 100) - 1;
  for (let i = 0; i < castTicks; i++) step();
  assert(
    dist(mob.hasPosition.current, coiledAt) < 1,
    "the lurker should hold position for the whole tell",
  );
  assert(
    player.hasHealth.hp === hpAtCastStart,
    "a coiling lurker must not land ordinary bites from leap range",
  );

  // 6. RESOLUTION: it crosses the gap, bites, and takes hold.
  for (let i = 0; i < 4 && !mob.dragsPrey; i++) step();
  assert(player.hasHealth.hp < hpAtCastStart, "the pounce should land");
  assert(
    dist(mob.hasPosition.current, coiledAt) > 100,
    "the leap should actually cross the gap",
  );
  assert(!!mob.dragsPrey, "landing the Deathroll should start the haul");
  assert(
    mob.dragsPrey!.targetId === player.isPlayer.id,
    "the haul should hold the victim it bit",
  );
  assert(
    dist(mob.dragsPrey!.destination, pool) > pool.radius * 0.5 &&
      dist(mob.dragsPrey!.destination, pool) < pool.radius,
    "the haul should be bound for the pool the lurker lives in",
  );

  // 7a. ROOTED WHILE DRAGGED — the player's legs stop, their weapon does not.
  const root = getStatusEffect(player.tracksCombat, LAIR_DRAG_ROOT_EFFECT_ID);
  assert(
    root !== undefined && root.data["speedMult"] === 0,
    "the victim should be rooted for the haul",
  );
  assert(!player.cannotAttack, "a rooted victim must still be able to fight back");
  syncPlayerBuffs(world, now);
  assert(player.hasStatus.activeBuffs.some(b => b.id === "debuff-root" && b.speedMult === 0),
    "the grab root must reach client movement prediction and the buff HUD");

  // 7b. BOTH BODIES CLOSE ON THE WATER, and the haul telegraphs itself.
  const playerStart = dist(player.hasPosition.current, pool);
  const mobStart = dist(mob.hasPosition.current, pool);
  for (let i = 0; i < 8; i++) step();
  assert(
    dist(mob.hasPosition.current, pool) < mobStart - 20,
    "the lurker should back into its own water",
  );
  assert(
    dist(player.hasPosition.current, pool) < playerStart - 20,
    "the victim should come with it",
  );
  const dragEvents = world
    .takeNodeEvents(SWAMP_NODE)
    .filter((e) => e.kind === "monster-drag");
  assert(
    dragEvents.some((e) => e.kind === "monster-drag" && e.phase === "wake"),
    "the haul should leave a visible wake",
  );

  applyStatusEffect(player.tracksCombat, {
    id: "slow", maxStacks: 1, remainingMs: 1000, refreshable: true,
    sourceId: "pool", data: { speedMult: 0.7, totalMs: 1000 },
  });

  // 7c. IT RELEASES ON ITS OWN — nothing here is a permanent state.
  for (let i = 0; i < 60 && mob.dragsPrey; i++) step();
  assert(!mob.dragsPrey, "the haul must end on its own");
  assert(
    dist(player.hasPosition.current, pool) < pool.radius &&
      dist(player.hasPosition.current, pool) > pool.radius - 80,
    "the victim should be delivered to the water",
  );
  // THE ROOT GOES WITH THE GRIP. Arriving early (close water) must not leave the
  // player pinned in a poison pool by a crocodile that already let go.
  assert(getStatusEffect(player.tracksCombat, "slow")?.data["speedMult"] === 0.7,
    "pool slow remains independent of the released grip");
  const afterRoot = getStatusEffect(player.tracksCombat, LAIR_DRAG_ROOT_EFFECT_ID);
  assert(
    afterRoot === undefined || (afterRoot.data["speedMult"] ?? 1) > 0,
    "releasing the haul should release the root",
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7d. WALK OUT OF THE LEAP
// ═══════════════════════════════════════════════════════════════════════════
//
// The counterplay the wind-up exists to offer. A lunge is a MOBILE cast, so the
// combat loop's generic range bail deliberately does not break it — leaving the leap
// has to. Without this the pounce follows its victim across the node and lands
// anyway, which is a teleport wearing a telegraph.
{
  const charged = lurker.chargedAttack!;
  const world = new World();
  const pool = swampRotPools(SWAMP_NODE)[2];
  const mobAt = { x: pool.x + pool.radius * 0.9, y: pool.y };
  const player = makePlayer(world, SWAMP_NODE, mobAt.x + 200, mobAt.y);
  const mob = world.createMonster(SWAMP_NODE, "bog-lurker", mobAt)!;

  let now = Date.now();
  const step = (): void => {
    now += 100;
    updateLairDrags(world, 100, now);
    updateMonsters(world, 100, now);
    updateCombat(world, 100, now);
  };

  setAggroTarget(world, mob, { id: player.isPlayer.id, kind: "player" }, now);
  step();
  assert(
    world
      .takeNodeEvents(SWAMP_NODE)
      .some((e) => e.kind === "monster-cast-start" && e.label === "Deathroll"),
    "the wind-up should have opened",
  );

  // Out of the leap, mid-tell.
  player.hasPosition.current = {
    x: mobAt.x + charged.lunge!.range + 60,
    y: mobAt.y,
  };
  const hpBefore = player.hasHealth.hp;
  step();
  const ended = world
    .takeNodeEvents(SWAMP_NODE)
    .filter((e) => e.kind === "monster-cast-end");
  assert(
    ended.some((e) => e.kind === "monster-cast-end" && !e.fired),
    "leaving the leap should break the wind-up, not merely delay it",
  );
  assert(!mob.dragsPrey, "a broken wind-up should grab nobody");
  assert(player.hasHealth.hp === hpBefore, "...and land nothing");
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. BREAK THE CROCODILE, BREAK THE GRIP
// ═══════════════════════════════════════════════════════════════════════════
//
// The counterplay that makes the haul answerable rather than suffered. A stunned
// lurker still holding you in place would punish the interrupt it exists to reward.
{
  const world = new World();
  const pool = swampRotPools(SWAMP_NODE)[1];
  const mobAt = { x: pool.x + pool.radius * 0.9, y: pool.y };
  const player = makePlayer(world, SWAMP_NODE, mobAt.x + 180, mobAt.y);
  const mob = world.createMonster(SWAMP_NODE, "bog-lurker", mobAt)!;

  let now = Date.now();
  const step = (): void => {
    now += 100;
    updateLairDrags(world, 100, now);
    updateMonsters(world, 100, now);
    updateCombat(world, 100, now);
  };

  setAggroTarget(world, mob, { id: player.isPlayer.id, kind: "player" }, now);
  for (let i = 0; i < 40 && !mob.dragsPrey; i++) step();
  assert(!!mob.dragsPrey, "the haul should have started");

  applyStun(mob.tracksCombat, 1_500, player.isPlayer.id, 1);
  step();
  assert(!mob.dragsPrey, "stunning the lurker should make it let go");
  const root = getStatusEffect(player.tracksCombat, LAIR_DRAG_ROOT_EFFECT_ID);
  assert(
    root === undefined || (root.data["speedMult"] ?? 1) > 0,
    "an interrupted haul should free the victim's legs with it",
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. NO WATER, NO DRAG
// ═══════════════════════════════════════════════════════════════════════════
//
// The ability degrades to an ordinary charged bite off its home terrain rather than
// hauling anyone toward a point that does not exist.
{
  const DRY = "node-t1-plains-01";
  const world = new World();
  const player = makePlayer(world, DRY, 2_000, 2_000);
  const mob = world.createMonster(DRY, "bog-lurker", { x: 2_180, y: 2_000 })!;

  let now = Date.now();
  const hpBefore = player.hasHealth.hp;
  for (let i = 0; i < 40; i++) {
    now += 100;
    updateLairDrags(world, 100, now);
    updateMonsters(world, 100, now);
    updateCombat(world, 100, now);
  }
  assert(!mob.dragsPrey, "there is nowhere to drag a player on dry land");
  assert(player.hasHealth.hp < hpBefore, "...but the bite still lands");
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. IT REACHES THE PLAYER
// ═══════════════════════════════════════════════════════════════════════════
{
  const abilities = describeMonsterAbilities(lurker);
  const line = abilities.find((a) => a.id === "charged-attack");
  assert(!!line, "the Deathroll should appear in the bestiary ability list");
  assert(
    /drag/i.test(line!.detail) && /leap|lunge/i.test(line!.detail),
    `the Deathroll's ability text should describe both halves, got: ${line!.detail}`,
  );
  assert(
    !/committed when the cast begins/.test(line!.detail),
    "a target-following lunge must not be described as a committed circle",
  );
  const mechanics = describeMonsterMechanics(lurker);
  assert(
    mechanics.some((m) => /drag/i.test(m.detail)),
    "the drag should reach the mechanic list too",
  );
}

function makePlayerSlices(
  id: string,
  nodeId: string,
  x: number,
  y: number,
): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x, y }, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 500_000, maxHp: 500_000, recovery: 0 },
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

function makePlayer(world: World, nodeId: string, x: number, y: number): PlayerEntity {
  const id = `p-${nodeId}-${Math.round(x)}-${Math.round(y)}`;
  return world.attachPlayerEntity(makePlayerSlices(id, nodeId, x, y), id);
}

{
  const world = new World();
  const pool = swampRotPools(SWAMP_NODE)[0];
  const player = makePlayer(world, SWAMP_NODE, pool.x + pool.radius + 100, pool.y);
  const mob = world.createMonster(SWAMP_NODE, "bog-lurker", { x: pool.x + pool.radius, y: pool.y })!;
  const now = Date.now();
  applyStatusEffect(player.tracksCombat, {
    id: "slow", maxStacks: 1, remainingMs: 1000, refreshable: true,
    sourceId: "pool", data: { speedMult: 0.7, totalMs: 1000 },
  });
  assert(beginLairDrag(world, mob, player, lurker.chargedAttack!.dragsToLair!, now), "grab starts");
  const start = { ...player.hasPosition.current };
  const walkTo = { x: start.x + 100, y: start.y };
  setEntityMotion(world, player, walkTo);
  updateMovement(world, 100, now);
  assert(dist(start, player.hasPosition.current) < 0.01,
    "a grab must root even a player already slowed by a pool");
  world.removeMonsterEntity(mob.isMonster.id);
  updateLairDrags(world, 100, now + 100);
  assert(!getStatusEffect(player.tracksCombat, LAIR_DRAG_ROOT_EFFECT_ID), "removed owner releases root");
  setEntityMotion(world, player, walkTo);
  updateMovement(world, 100, now + 100);
  assert(dist(start, player.hasPosition.current) > 1, "the released player can actually walk again");
  syncPlayerBuffs(world, now + 100);
  assert(!player.hasStatus.activeBuffs.some(b => b.id === "debuff-root"),
    "the root must also disappear from the client buff state");
}
console.log("bogLurkerDeathroll: ok");
