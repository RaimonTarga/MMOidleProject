// Smoke test for the Plains T1 authored dungeon encounter:
//   - pre-encounter herds spawn as local packs, not generic altar-ring guardians
//   - clearing callers prevents the boss hook, but remaining herd bodies still aggro
//   - uncleared callers add pressure at boss start while the full herd stays active
//   - Tusked Razorback has capped periodic adds and a 50% herd call

import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  PRE_ENCOUNTER_AURA_EFFECT_ID,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getDungeonGauntletDef,
  getStatusEffect,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import {
  activateDungeonAltar,
  ensureDungeonGauntlet,
  onDungeonMonsterRewarded,
  tickDungeonGauntlets,
} from "../src/systems/world/dungeons/gauntlet";
import { setAggroTarget, setAttackTarget } from "../src/systems/combat/ai/targeting";
import { updateBossScripts } from "../src/systems/combat/ai/bossScripts";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const ALTAR = { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 };
const PLAINS_NODE = "node-4-3";

function makePlayerSlices(id: string, nodeId: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { ...ALTAR }, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, hpRegen: GAME_CONFIG.PLAYER_HP_REGEN },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], equippedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null, reactive: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null,
      selectedRange: null, combatArchetype: "cadence",
    },
  };
}

function setupPlains(): { world: World; playerId: string } {
  const world = new World();
  const playerId = `player-${PLAINS_NODE}`;
  world.attachPlayerEntity(makePlayerSlices(playerId, PLAINS_NODE), playerId);
  world.frozenNodes.delete(PLAINS_NODE);
  ensureDungeonGauntlet(world, PLAINS_NODE);
  return { world, playerId };
}

{
  const def = getDungeonGauntletDef(PLAINS_NODE);
  assert(!!def, "expected Plains T1 gauntlet def");
  assert(def!.preEncounter?.id === "plains-herds", "Plains uses authored herds");
  assert(def!.preEncounter.groups.length === 3, "Plains has three local herds");
  assert(def!.preEncounter.groups.every((g) => g.kind === "pack"), "every herd is a pack");
  assert(def!.unclearedThreat?.mode === "extra-adds", "uncleared callers add boss-start pressure");

  const boss = MONSTER_DATABASE.get("tusked-razorback")!;
  const phaseAdds = boss.bossScript?.phases?.[0]?.actions.filter((a) => a.type === "spawn-adds") ?? [];
  assert(phaseAdds.length >= 2, "50% boss beat calls a larger mixed herd");
  assert((boss.bossScript?.repeating?.[0]?.actions ?? []).some((a) => a.type === "spawn-adds"), "boss has periodic adds");
}

{
  const { world } = setupPlains();
  const state = world.gauntlets.get(PLAINS_NODE)!;
  const members = state.idleGuardianIds.map((id) => world.getMonsterEntity(id)!);
  const callers = members.filter((m) => m.tracksDungeon?.preEncounterRole === "leader");
  const followers = members.filter((m) => m.tracksDungeon?.preEncounterRole === "follower");
  assert(callers.length === 3, "three herd callers spawn");
  assert(followers.length === 12, "herd followers spawn as weak bodies");
  assert(callers.every((m) => m.inPack?.role === "alpha"), "callers are pack alphas");
  assert(followers.every((m) => m.inPack?.role === "follower"), "followers keep pack links");
  assert(callers.every((m) => m.tracksDungeon?.preEncounterAura?.kind === "damage"), "callers project an aura");
  // Each aura SOURCE shows the display-only "Rally" buff indicator (target frame);
  // the weak bodies do not.
  assert(
    callers.every((m) => !!getStatusEffect(m.tracksCombat!, PRE_ENCOUNTER_AURA_EFFECT_ID)),
    "callers show the aura (Rally) buff indicator",
  );
  assert(
    followers.every((m) => !getStatusEffect(m.tracksCombat!, PRE_ENCOUNTER_AURA_EFFECT_ID)),
    "herd bodies carry no aura indicator",
  );
}

{
  const { world, playerId } = setupPlains();
  const state = world.gauntlets.get(PLAINS_NODE)!;
  const remainingFollowers = state.idleGuardianIds
    .map((id) => world.getMonsterEntity(id)!)
    .filter((m) => m.tracksDungeon?.preEncounterRole === "follower")
    .length;
  for (const id of [...state.idleGuardianIds]) {
    const m = world.getMonsterEntity(id)!;
    if (m.tracksDungeon?.preEncounterRole !== "leader") continue;
    onDungeonMonsterRewarded(world, playerId, m);
    world.removeMonsterEntity(id);
  }
  const player = world.getPlayerEntity(playerId)!;
  assert(activateDungeonAltar(world, player), "altar activates after caller clear");
  assert(state.unclearedThreatCount === 0, "dead callers mean no extra-add hook");
  assert(
    state.preEncounterThreatIds.length === remainingFollowers,
    "remaining herd bodies still join as optional threats",
  );
}

{
  const { world, playerId } = setupPlains();
  const state = world.gauntlets.get(PLAINS_NODE)!;
  const survivors = state.idleGuardianIds.length;
  const player = world.getPlayerEntity(playerId)!;
  assert(activateDungeonAltar(world, player), "altar activates with herds alive");
  assert(state.unclearedThreatCount === 3, "uncleared count tracks callers only");
  assert(state.preEncounterThreatIds.length === survivors, "the full surviving herd joins immediately");
  tickDungeonGauntlets(world, Date.now() + 1_000_000);
  assert(state.status === "boss", "boss spawns");
  assert(state.preEncounterThreatIds.length > survivors, "extra adds spawn with the boss");
  const boss = world.getMonsterEntity(state.bossMonsterId!)!;
  setAggroTarget(world, boss, { id: playerId, kind: "player" }, Date.now());
  setAttackTarget(world, boss, playerId);
  boss.hasHealth.hp = Math.floor(boss.hasHealth.maxHp * 0.49);
  updateBossScripts(world, 100);
  const bossSpawnedAdds = boss.scriptsBoss?.spawnedAddIds ?? [];
  assert(bossSpawnedAdds.length > 0, "boss script spawns adds");
  for (const id of bossSpawnedAdds) {
    const add = world.getMonsterEntity(id)!;
    assert(add.hasAggroTarget?.targetId === playerId, "boss-spawned add inherits aggro target");
    assert(add.hasAttackTarget?.targetId === playerId, "boss-spawned add inherits attack target");
  }
  const res = onDungeonMonsterRewarded(world, playerId, boss);
  assert(res.suppressBossRespawn, "gauntlet boss suppresses standing respawn");
  assert(state.status === "cooldown", "boss can still be cleared");
}

console.log("dungeonPlains.test.ts: ok");
