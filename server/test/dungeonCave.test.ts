// Smoke test for the Cave T1 dungeon: the sparse-elite / careful-pulling exam.
//   - Deep Watch pre-encounter spawns 3 brute sentinels that ORBIT the altar
//   - each sentinel gets a bespoke absolute patrol ring, evenly separated
//   - the brutes keep their high pull range (overpull-risk identity)
//   - clearing the elites → clean boss start; leaving them → they join (join hook)
//   - the boss (Obsidian Broodmother) spawns no adds (T1 simplification); the
//     50% beat is the timed shield only
//   - the boss can still be cleared
//
// Run: pnpm --filter @mmo-idle/server exec tsx ../server/test/dungeonCave.test.ts

import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getDungeonGauntletDef,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import {
  activateDungeonAltar,
  ensureDungeonGauntlet,
  onDungeonMonsterRewarded,
  tickDungeonGauntlets,
} from "../src/systems/world/dungeons/gauntlet";
import { updateBossScripts } from "../src/systems/combat/ai/bossScripts";
import { setAggroTarget } from "../src/systems/combat/ai/targeting";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const ALTAR = { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 };
const CAVE_NODE = "node-t1-cave-dungeon";

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
      equippedStances: { default: null, reactive: null },
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

function setupCave(): { world: World; playerId: string } {
  const world = new World();
  const playerId = `player-${CAVE_NODE}`;
  world.attachPlayerEntity(makePlayerSlices(playerId, CAVE_NODE), playerId);
  world.frozenNodes.delete(CAVE_NODE);
  ensureDungeonGauntlet(world, CAVE_NODE);
  return { world, playerId };
}

// ── 0. Definition wiring ────────────────────────────────────────────────────
{
  const def = getDungeonGauntletDef(CAVE_NODE);
  assert(!!def, `expected a gauntlet def for ${CAVE_NODE}`);
  assert(def!.biomeTier === 1, "cave dungeon must be tier 1 (pre-encounter)");
  assert(def!.phases.length === 0, "cave T1 must not run gauntlet waves");
  assert(def!.preEncounter?.id === "cave-deep-watch", "cave T1 uses the authored Deep Watch");
  assert(def!.preEncounter.unclearedRole === "leader", "only the lead elites count as the threat");
  assert(def!.preEncounter.groups.length === 3, "deep watch = 3 brute sentinels");
  assert(
    def!.preEncounter.groups.every(
      (g) => g.kind === "pack" && g.leaderMonsterId === "cave-brute",
    ),
    "every sentinel is a solo cave-brute pack leader (no lurkers)",
  );
  assert((def!.unclearedThreat?.mode ?? "join") === "join", "uncleared elites join the boss");

  // Sparse / careful exam: no follower bodies — each group is a lone elite.
  const followerBodies = def!.preEncounter.groups.reduce((sum, g) => {
    if (g.kind !== "pack") return sum;
    return sum + (g.followers ?? []).reduce((s, f) => s + f.count, 0);
  }, 0);
  assert(followerBodies === 0, "no follower swarm: cave density stays low (3 elites)");

  // Each sentinel orbits the altar via a bespoke absolute patrol ring.
  for (const g of def!.preEncounter.groups) {
    assert(g.kind === "pack", "sentinel is a pack");
    const patrol = (g as { patrolOverride?: { absolute?: boolean; mode?: string; waypoints: unknown[] } })
      .patrolOverride;
    assert(!!patrol, "sentinel carries a bespoke altar-orbit patrol override");
    assert(patrol!.absolute === true, "the orbit uses absolute (node-local) waypoints around the altar");
    assert(patrol!.mode === "loop", "the orbit loops");
    assert(patrol!.waypoints.length >= 3, "the orbit is a real ring of waypoints");
  }

  const boss = MONSTER_DATABASE.get("obsidian-broodmother")!;
  // T1 simplification: no adds during the boss fight (Plains is the only T1 boss
  // with adds). The 50% beat is the timed shield only.
  const phase = boss.bossScript?.phases?.[0];
  assert(
    !boss.bossScript?.phases?.some((p) => p.actions.some((a) => a.type === "spawn-adds")),
    "the cave boss spawns no phase adds (T1 simplification)",
  );
  assert(
    !!phase?.actions.find((a) => a.type === "shield"),
    "boss still digs in (timed shield) — stays durable",
  );
  assert(!boss.bossScript?.repeating, "the cave boss has no repeating add beat");
}

// ── 1. Deep Watch spawns 3 brute sentinels orbiting the altar ────────────────
{
  const { world } = setupCave();
  const state = world.gauntlets.get(CAVE_NODE)!;
  assert(state.idleGuardianIds.length === 3, "deep watch spawns 3 elites");

  const members = state.idleGuardianIds.map((id) => world.getMonsterEntity(id)!);
  const brutes = members.filter((m) => m.isMonster.monsterTypeId === "cave-brute");
  assert(brutes.length === 3, "three cave-brute sentinels (no lurkers)");
  assert(
    members.every((m) => m.tracksDungeon?.source === "idleDungeonGuardian"),
    "all elites are tracked as idle guardians",
  );
  assert(
    members.every((m) => m.tracksDungeon?.preEncounterRole === "leader"),
    "every elite is a leader (counts toward the uncleared threat)",
  );
  // Cave identity: the patrolling brutes keep their high-detection pull range.
  assert(
    brutes.every((m) => m.hasAwareness.pullRange >= 240),
    "patrolling brutes keep their high-detection pull range",
  );
  // The bespoke altar-orbit patrol is applied at spawn (not the open-world loop).
  assert(
    brutes.every((m) => m.controlsMonster.patrolOverride?.absolute === true),
    "each brute got its altar-orbit patrol override",
  );
  assert(
    brutes.every((m) => m.controlsMonster.wanderRadius === 0),
    "brutes don't random-wander — the orbit supplies movement",
  );

  // They circle the altar (~orbit radius from center) and are mutually separated.
  const altar = getDungeonGauntletDef(CAVE_NODE)!.altar;
  const dists = brutes.map((m) =>
    Math.hypot(m.controlsMonster.spawn.x - altar.x, m.controlsMonster.spawn.y - altar.y),
  );
  assert(dists.every((d) => d > 200 && d < 400), "every sentinel sits on the altar orbit ring");
  const minSep = Math.min(
    ...brutes.flatMap((a, i) =>
      brutes.slice(i + 1).map((b) =>
        Math.hypot(a.controlsMonster.spawn.x - b.controlsMonster.spawn.x, a.controlsMonster.spawn.y - b.controlsMonster.spawn.y),
      ),
    ),
  );
  assert(minSep > 150, "the sentinels are separated around the altar, not clustered");
}

// ── 2. Cleared elites → clean boss start ─────────────────────────────────────
{
  const { world, playerId } = setupCave();
  const state = world.gauntlets.get(CAVE_NODE)!;
  for (const id of [...state.idleGuardianIds]) {
    onDungeonMonsterRewarded(world, playerId, world.getMonsterEntity(id)!);
    world.removeMonsterEntity(id);
  }
  const player = world.getPlayerEntity(playerId)!;
  assert(activateDungeonAltar(world, player), "altar activates after clearing the deep watch");
  assert(state.unclearedThreatCount === 0, "no elites left → zero uncleared threat");
  assert(state.preEncounterThreatIds.length === 0, "clean boss start: nothing joins");

  tickDungeonGauntlets(world, Date.now() + 1_000_000);
  assert(state.status === "boss", "boss spawns after the awakening delay");
  const boss = world.getMonsterEntity(state.bossMonsterId!)!;
  assert(boss.isMonster.monsterTypeId === "obsidian-broodmother", "the cave boss spawned");
  assert(state.requiredKillsForCurrentPhase === 1, "only the boss gates completion");
}

// ── 3. Uncleared elites → join the boss, then boss can be cleared ────────────
{
  const { world, playerId } = setupCave();
  const state = world.gauntlets.get(CAVE_NODE)!;
  const elites = state.idleGuardianIds.length;
  assert(elites === 3, "three elites alive at activation");

  const player = world.getPlayerEntity(playerId)!;
  assert(activateDungeonAltar(world, player), "altar activates with the elites alive");
  assert(state.status === "bossAwakening", "cave T1 goes straight to boss awakening (no waves)");
  assert(state.unclearedThreatCount === 3, "all 3 uncleared elites count as the threat");
  assert(state.preEncounterThreatIds.length === 3, "all 3 elites join the boss fight");

  tickDungeonGauntlets(world, Date.now() + 1_000_000);
  assert(state.status === "boss", "boss spawns alongside the joined elites");
  assert(state.preEncounterThreatIds.length === 3, "joined elites persist through boss spawn");

  // Boss can still be cleared → cooldown.
  const boss = world.getMonsterEntity(state.bossMonsterId!)!;
  const res = onDungeonMonsterRewarded(world, playerId, boss);
  assert(res.suppressBossRespawn, "gauntlet boss death suppresses the old respawn marker");
  assert(state.status === "cooldown", "boss death starts the altar cooldown");
  assert(state.preEncounterThreatIds.length === 0, "joined elites are cleared on boss death");
}

// ── 4. Boss spawns no adds even as its script runs (T1 simplification) ───────
{
  const world = new World();
  const node = "node-clearing";
  const playerId = "brood-target";
  world.attachPlayerEntity(
    makePlayerSlices(playerId, node, { x: 400, y: 400 }, 4000),
    playerId,
  );

  const boss = world.createMonster(node, "obsidian-broodmother", { x: 420, y: 400 })!;
  setAggroTarget(world, boss, { id: playerId, kind: "player" }, 10_000);

  // Drive the script well past where the old lurker beat would have fired.
  for (let i = 0; i < 24; i++) updateBossScripts(world, 12_000);

  const tracked = boss.scriptsBoss?.spawnedAddIds ?? [];
  const alive = tracked.filter((id) => world.hasMonster(id));
  assert(alive.length === 0, "the cave boss hatches no adds (T1 simplification)");
}

console.log("dungeonCave.test.ts: ok");
