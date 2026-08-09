// Smoke test for the guarded-altar dungeon loop (the gauntlet rework).
//
// A dungeon is an altar, the biome guardians holding it, and the boss they are
// guarding — no waves, no per-dungeon bonus mechanics. This pins:
//   - every dungeon node generates a def with a per-biome guard posture
//   - the three postures spawn the shapes they promise (pack / patrol / post-hold)
//   - guardians are tethered TIGHT to the altar's guard ring while idle
//   - clearing the guard first → clean boss start
//   - disturbing the altar aggroes every survivor at once, and survivors never
//     gate the boss
//   - boss death → cooldown; node wipe and freeze/thaw → a fresh guard
//   - dungeon nodes never run ambient spawning
//
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/dungeons.test.ts

import {
  DUNGEON_DEFS,
  GAME_CONFIG,
  MONSTER_DATABASE,
  NODE_BIOMES,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getDungeonDef,
  guardianTotalFor,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import {
  activateDungeonAltar,
  ensureDungeon,
  onDungeonMonsterRewarded,
  resetDungeonIfNodeWiped,
  tickDungeons,
} from "../src/systems/world/dungeons/dungeon";
import { ensurePopulation } from "../src/systems/world/spawning";
import { freezeNode, thawNode } from "../src/world/nodeLifecycle";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const ALTAR = { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 };

const PACK_NODE = "node-t1-forest-dungeon";
const PATROL_NODE = "node-t1-cave-dungeon";
const POST_HOLD_NODE = "node-t1-mountain-dungeon";

function makePlayerSlices(
  id: string,
  nodeId: string,
  pos = { ...ALTAR },
  maxHp = GAME_CONFIG.PLAYER_MAX_HP,
): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { ...pos }, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: maxHp, maxHp, hpRegen: GAME_CONFIG.PLAYER_HP_REGEN },
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
      combatArchetype: "cadence",
    },
  };
}

function setup(nodeId: string): { world: World; playerId: string } {
  const world = new World();
  const playerId = `player-${nodeId}`;
  world.attachPlayerEntity(makePlayerSlices(playerId, nodeId), playerId);
  world.frozenNodes.delete(nodeId);
  ensureDungeon(world, nodeId);
  return { world, playerId };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// ── 0. Every dungeon node generates a def ────────────────────────────────────
{
  const dungeonNodes = Object.entries(NODE_BIOMES).filter(
    ([, info]) => info.isDungeon && info.bossTypeId !== "void-overlord",
  );
  assert(dungeonNodes.length > 0, "the world has dungeon nodes");
  for (const [nodeId] of dungeonNodes) {
    const def = DUNGEON_DEFS.get(nodeId);
    assert(!!def, `every dungeon node has a def (${nodeId})`);
    assert(def!.guard.groups.length > 0, `${nodeId} has guard stations`);
    assert(!!MONSTER_DATABASE.get(def!.boss.bossId), `${nodeId} names a real boss`);
    // Guardians come from that biome/tier's own ambient roster.
    for (const group of def!.guard.groups) {
      assert(
        !!MONSTER_DATABASE.get(group.leaderMonsterId),
        `${nodeId} leader ${group.leaderMonsterId} exists`,
      );
      for (const follower of group.followers ?? []) {
        assert(
          !!MONSTER_DATABASE.get(follower.monsterId),
          `${nodeId} follower ${follower.monsterId} exists`,
        );
      }
    }
  }
  // The Void Overlord throne (unauthored in the current world map) keeps its own
  // ultimate-encounter system and is excluded by the def builder.
  const throne = Object.entries(NODE_BIOMES).find(
    ([, info]) => info.bossTypeId === "void-overlord",
  );
  if (throne) {
    assert(!DUNGEON_DEFS.has(throne[0]), "the throne is not a guarded-altar dungeon");
  }
}

// ── 1. Stations ring the altar, evenly separated ─────────────────────────────
{
  for (const nodeId of [PACK_NODE, PATROL_NODE, POST_HOLD_NODE]) {
    const def = getDungeonDef(nodeId)!;
    const stations = def.guard.groups.map((g) => g.station);
    for (const station of stations) {
      const d = distance(station, def.altar);
      assert(
        d > def.altar.activationRadius && d < 700,
        `${nodeId} stations sit on the guard ring, not on the altar (d=${Math.round(d)})`,
      );
    }
    if (stations.length > 1) {
      const minSep = Math.min(
        ...stations.flatMap((a, i) => stations.slice(i + 1).map((b) => distance(a, b))),
      );
      assert(minSep > 200, `${nodeId} stations are spread around the altar`);
    }
  }
}

// ── 2. `pack` posture: leader + entourage sharing one pack link ──────────────
{
  const { world } = setup(PACK_NODE);
  const def = getDungeonDef(PACK_NODE)!;
  const state = world.dungeons.get(PACK_NODE)!;
  assert(
    state.guardianIds.length === guardianTotalFor(def),
    "the whole guard spawns at once",
  );

  const guardians = state.guardianIds.map((id) => world.getMonsterEntity(id)!);
  assert(
    guardians.every((m) => m.tracksDungeon?.source === "dungeonGuardian"),
    "every body is tagged as a dungeon guardian",
  );

  // Forest's guard is led by the biome's own pack alpha with its authored pups.
  const leaders = guardians.filter((m) => m.inPack?.role === "alpha");
  assert(leaders.length === def.guard.groups.length, "one leader per station");
  assert(
    leaders.every((m) => m.isMonster.monsterTypeId === "wolf"),
    "the forest guard is led by the biome's pack alpha",
  );
  assert(
    leaders.every((m) => m.isMonster.name === "Forest Sentinel"),
    "leaders carry the biome guardian name",
  );
  const followers = guardians.filter((m) => m.inPack?.role === "follower");
  assert(followers.length > 0, "the leader brings its entourage");
  assert(
    followers.every((m) => m.isMonster.name !== "Forest Sentinel"),
    "followers keep their own names — only leaders are named guardians",
  );
  // Each station is one pack, so call-allies and alpha-scatter stay group-local.
  const packIds = new Set(guardians.map((m) => m.inPack!.packId));
  assert(packIds.size === def.guard.groups.length, "each station is its own pack");

  // Pack members mill on a small local loop around their OWN post, not as a
  // column walking one shared route.
  const posts = guardians.map((m) => m.controlsMonster.holdPost!);
  assert(posts.every((p) => !!p), "every pack guardian holds a post");
  const routeCentres = guardians.map((m) => {
    const route = m.controlsMonster.holdPatrol!;
    return {
      x: route.reduce((sum, w) => sum + w.x, 0) / route.length,
      y: route.reduce((sum, w) => sum + w.y, 0) / route.length,
    };
  });
  guardians.forEach((m, i) => {
    assert(
      distance(routeCentres[i], m.controlsMonster.holdPost!) < 5,
      "a pack guardian's mill loop is centred on its own post",
    );
    assert(
      (m.controlsMonster.holdPatrol ?? []).every(
        (w) => distance(w, m.controlsMonster.holdPost!) < 150,
      ),
      "the mill loop stays local — guardians never drift off station",
    );
  });

  // Guardian buffs are the dungeon's difficulty layer (forest = faster + quicker).
  const wolfDef = MONSTER_DATABASE.get("wolf")!;
  assert(
    leaders.every((m) => m.performsAttack.attackCooldown < wolfDef.stats.attackCooldown),
    "guardian modifiers are applied on top of the base monster",
  );
}

// ── 3. `patrol` posture: solo sentinels orbiting the altar ───────────────────
{
  const { world } = setup(PATROL_NODE);
  const def = getDungeonDef(PATROL_NODE)!;
  const state = world.dungeons.get(PATROL_NODE)!;
  const guardians = state.guardianIds.map((id) => world.getMonsterEntity(id)!);
  assert(guardians.length === 3, "the deep watch is three sentinels");
  assert(guardians.every((m) => !m.inPack), "patrol sentinels are solo, not a pack");
  assert(
    guardians.every((m) => (m.controlsMonster.holdPatrol?.length ?? 0) >= 3),
    "each sentinel walks a real orbit around the altar",
  );
  // Waypoints are absolute node coordinates on the guard ring, so the sentinel
  // circles the altar rather than drifting inward onto it.
  const ringRadius = distance(def.guard.groups[0].station, def.altar);
  for (const m of guardians) {
    for (const w of m.controlsMonster.holdPatrol ?? []) {
      assert(
        Math.abs(distance(w, def.altar) - ringRadius) < 40,
        "every orbit waypoint stays on the guard ring",
      );
    }
  }
  // A patrolling guardian's leash is anchored on the ALTAR: it may cross the ring
  // but can never be dragged off it.
  assert(
    guardians.every(
      (m) =>
        Math.abs(m.controlsMonster.spawn.x - def.altar.x) < 1 &&
        Math.abs(m.controlsMonster.spawn.y - def.altar.y) < 1,
    ),
    "patrol guardians leash to the altar itself",
  );
  assert(
    guardians.every((m) => m.controlsMonster.wanderRadius === 0),
    "the orbit supplies movement — no random wander",
  );
  // Cave identity survives: the sentinels keep their overpull detection range.
  assert(
    guardians.every((m) => m.hasAwareness.pullRange >= 240),
    "cave sentinels keep their high-detection pull range",
  );
}

// ── 3b. No guardian is ever on the random-wander path ────────────────────────
// Several biomes override random wander with node-wide targets that ignore
// `wanderRadius` (swamp mobs head for the nearest pool, cave lurkers for a wall).
// A guardian on a hold post never reaches that code, which is what keeps it on
// station — so this invariant has to hold for EVERY dungeon, not just the three
// sampled above.
{
  for (const nodeId of DUNGEON_DEFS.keys()) {
    const { world } = setup(nodeId);
    const state = world.dungeons.get(nodeId)!;
    for (const id of state.guardianIds) {
      const m = world.getMonsterEntity(id)!;
      assert(
        !!m.controlsMonster.holdPost,
        `${nodeId}: every guardian stands a post`,
      );
      assert(
        m.controlsMonster.wanderRadius === 0,
        `${nodeId}: no guardian uses the random-wander path`,
      );
    }
  }
}

// ── 4. `post-hold` posture + the tight tether ────────────────────────────────
{
  const { world } = setup(POST_HOLD_NODE);
  const def = getDungeonDef(POST_HOLD_NODE)!;
  const state = world.dungeons.get(POST_HOLD_NODE)!;
  const guardians = state.guardianIds.map((id) => world.getMonsterEntity(id)!);
  assert(guardians.length === 4, "four stone wardens hold the mountain altar");
  assert(
    guardians.every((m) => !!m.controlsMonster.holdPost),
    "post-holders return to their station instead of free-wandering",
  );
  assert(
    guardians.every((m) => !m.controlsMonster.holdPatrol),
    "post-holders do not patrol",
  );

  // The tether is the point: however far a guardian chases, it can never end up
  // more than ring + margin from the altar it is guarding.
  for (const m of guardians) {
    const anchorToAltar = distance(m.controlsMonster.spawn, def.altar);
    const reach = anchorToAltar + m.controlsMonster.leashRange;
    assert(
      reach < GAME_CONFIG.NODE_WIDTH / 2,
      `guardians stay near the altar (reach=${Math.round(reach)}) — they cannot be kited to the node edge`,
    );
    assert(
      m.controlsMonster.leashRange === m.hasAwareness.leashRange,
      "both leash fields agree",
    );
    const baseDef = MONSTER_DATABASE.get(m.isMonster.monsterTypeId)!;
    // Same anchor semantics as ambient (leash from the mob's own post), so the
    // numbers are directly comparable — and the guard's is the tighter one.
    assert(
      m.controlsMonster.leashRange < baseDef.ai.leashRange,
      "the guard leash is tighter than the monster's ambient leash",
    );
    assert(
      m.hasAwareness.pullRange <= baseDef.stats.pullRange,
      "idle guardians never detect further than their ambient counterparts",
    );
  }
}

// ── 5. Clearing the guard first → a clean boss start ─────────────────────────
{
  const { world, playerId } = setup(POST_HOLD_NODE);
  const def = getDungeonDef(POST_HOLD_NODE)!;
  const state = world.dungeons.get(POST_HOLD_NODE)!;
  for (const id of [...state.guardianIds]) {
    onDungeonMonsterRewarded(world, playerId, world.getMonsterEntity(id)!);
    world.removeMonsterEntity(id);
  }
  assert(state.guardianIds.length === 0, "the guard is cleared");

  const player = world.getPlayerEntity(playerId)!;
  assert(activateDungeonAltar(world, player), "the altar activates once the player is on it");
  assert(state.status === "bossAwakening", "activation goes straight to the boss — no waves");

  tickDungeons(world, Date.now() + 1_000_000);
  assert(state.status === "boss", "the boss spawns after the awakening delay");
  const boss = world.getMonsterEntity(state.bossMonsterId!)!;
  assert(
    boss.isMonster.monsterTypeId === def.boss.bossId,
    "the biome's own boss spawned",
  );
  assert(boss.tracksDungeon?.source === "dungeonBoss", "the boss is tagged as such");
}

// ── 6. Disturbing the altar turns every survivor at once ────────────────────
{
  const { world, playerId } = setup(POST_HOLD_NODE);
  const state = world.dungeons.get(POST_HOLD_NODE)!;
  const before = state.guardianIds.length;
  const player = world.getPlayerEntity(playerId)!;

  assert(activateDungeonAltar(world, player), "the altar activates with the guard alive");
  assert(state.guardiansEngaged, "the guard is engaged");
  assert(state.guardianIds.length === before, "no guardian is consumed by activation");

  const guardians = state.guardianIds.map((id) => world.getMonsterEntity(id)!);
  assert(
    guardians.every((m) => m.hasAggroTarget?.targetId === playerId),
    "every surviving guardian aggroes the moment the altar is disturbed",
  );
  assert(
    guardians.every((m) => m.controlsMonster.leashRange > 3_000),
    "engaged guardians drop the tether and fight anywhere in the node",
  );
  assert(
    guardians.every((m) => !m.controlsMonster.holdPost),
    "engaged guardians abandon their station",
  );

  // A surviving guardian is an optional kill: it never gates the boss.
  onDungeonMonsterRewarded(world, playerId, guardians[0]);
  world.removeMonsterEntity(guardians[0].isMonster.id);
  assert(state.status === "bossAwakening", "killing a guardian does not complete the trial");
  assert(state.guardianIds.length === before - 1, "the kill is tracked");

  tickDungeons(world, Date.now() + 1_000_000);
  assert(state.status === "boss", "the boss still wakes on its own timer");
  assert(
    state.guardianIds.length === before - 1,
    "surviving guardians fight on alongside the boss",
  );

  const boss = world.getMonsterEntity(state.bossMonsterId!)!;
  const result = onDungeonMonsterRewarded(world, playerId, boss);
  assert(result.suppressBossRespawn, "the dungeon boss uses the altar cooldown, not the old marker");
  assert(state.status === "cooldown", "boss death starts the altar cooldown");
  assert(state.guardianIds.length === 0, "leftover guardians leave with the trial");

  // The cooldown expiring reforms the whole guard.
  state.cooldownEndsAtMs = Date.now() - 1;
  tickDungeons(world, Date.now());
  const reformed = world.dungeons.get(POST_HOLD_NODE)!;
  assert(reformed.status === "idle", "the altar reforms");
  assert(
    reformed.guardianIds.length === guardianTotalFor(getDungeonDef(POST_HOLD_NODE)!),
    "a fresh guard reforms with it",
  );
}

// ── 7. Node wipe and freeze/thaw both reset the dungeon ──────────────────────
{
  const { world, playerId } = setup(POST_HOLD_NODE);
  const player = world.getPlayerEntity(playerId)!;
  activateDungeonAltar(world, player);
  world.killPlayer(playerId, {
    kind: "melee",
    damage: 999,
    killer: {
      monsterTypeId: "cliff-hopper",
      monsterName: "Cliff Hopper",
      isBoss: false,
      nodeId: POST_HOLD_NODE,
    },
  });
  resetDungeonIfNodeWiped(world, POST_HOLD_NODE);
  const afterWipe = world.dungeons.get(POST_HOLD_NODE)!;
  assert(afterWipe.status === "idle", "a node wipe resets the dungeon to idle");
  assert(afterWipe.guardianIds.length > 0, "and re-forms the guard");
}
{
  const { world } = setup(POST_HOLD_NODE);
  freezeNode(world, POST_HOLD_NODE);
  assert(!world.dungeons.has(POST_HOLD_NODE), "freezing discards the dungeon runtime");
  thawNode(world, POST_HOLD_NODE);
  const thawed = world.dungeons.get(POST_HOLD_NODE)!;
  assert(!!thawed, "thawing rebuilds it");
  assert(thawed.status === "idle", "back to idle");
  assert(
    thawed.guardianIds.length === guardianTotalFor(getDungeonDef(POST_HOLD_NODE)!),
    "with a full guard",
  );
}

// ── 8. Dungeon nodes never run ambient spawning ──────────────────────────────
{
  const { world } = setup(POST_HOLD_NODE);
  const before = world.getMonsterCountInNode(POST_HOLD_NODE);
  ensurePopulation(world, POST_HOLD_NODE);
  assert(
    world.getMonsterCountInNode(POST_HOLD_NODE) === before,
    "ambient population is off in dungeon nodes — the guard is the population",
  );
}

console.log("dungeons.test.ts: ok");
