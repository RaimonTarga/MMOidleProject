// A returning monster already back on its post is home, and auto-combat may pick it.
//
// The T3 Jungle dungeon's guard packs spot a player wearing +65% aggro-pull boots from
// about 305 px, while their leash runs 320 px from an anchor 70 px further out: a pack
// that spots the player there "returns" on the same tick. Auto-combat skipped returning
// monsters, so a Squire standing between two such packs switched targets every tick,
// never reached either, and the guard phase gave up after 15 minutes (OV final runs,
// 2026-10-17). A monster still walking home stays skipped.
//
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/returningAtHome.test.ts

import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  DEFAULT_RUNE_LOADOUT,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  baseRecoveryForTier,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import type { PlayerEntity } from "../src/ecs/entity";
import { selectAutoCombatAction } from "../src/systems/combat/ai/targetPriority";
import { ensureDungeon } from "../src/systems/world/dungeons/dungeon";
import { World } from "../src/world/World";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = "node-t3-jungle-dungeon";

function addPlayer(world: World, pos: { x: number; y: number }): PlayerEntity {
  const id = "player-returning-at-home";
  const slices: PersistedPlayerSlices = {
    isPlayer: { id, name: id },
    hasPosition: { current: { ...pos }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1e6, maxHp: 1e6, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {}, playerTier: 3, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS], runesEquipped: [...DEFAULT_RUNE_LOADOUT],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null,
      combatArchetype: "cadence",
    },
  };
  world.attachPlayerEntity(slices, id);
  const player = world.getPlayerEntity(id)!;
  Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true, autoTraverse: false, acquireRadius: 10_000 });
  player.hasHealth.maxHp = 1e6;
  player.hasHealth.hp = 1e6;
  return player;
}

// ── The gate: home is targetable, the walk home is not ────────────────────────
{
  const world = new World();
  world.frozenNodes.delete(NODE);
  ensureDungeon(world, NODE);
  const guardianIds = [...world.dungeons.get(NODE)!.guardianIds];
  const monster = world.getMonsterEntity(guardianIds[0])!;
  for (const id of guardianIds.slice(1)) world.removeMonsterEntity(id);
  delete monster.inPack;
  const post = monster.controlsMonster.holdPost ?? monster.controlsMonster.spawn;
  monster.hasPosition.current = { ...post };
  monster.hasAwareness.state = "returning";
  const player = addPlayer(world, { x: post.x + 150, y: post.y });

  const home = selectAutoCombatAction(world, player, player.usesAutocombat, Date.now());
  assert(home.kind === "attack" && home.target === monster, "a returning monster on its post can be picked");

  monster.hasPosition.current = { x: post.x - 200, y: post.y };
  const away = selectAutoCombatAction(world, player, player.usesAutocombat, Date.now());
  assert(away.kind === "idle", "a returning monster still walking home is left to finish its reset");
}

// ── The wiring: the spot between two guard packs reaches the guard ────────────
{
  const world = new World();
  world.frozenNodes.delete(NODE);
  ensureDungeon(world, NODE);
  const state = world.dungeons.get(NODE)!;
  const total = state.guardianIds.length;
  // Between the east and west packs, each ~302 px from its nearest member.
  const player = addPlayer(world, { x: GAME_CONFIG.NODE_WIDTH / 2, y: 2615 });
  player.usesSkills.passives["mobility.aggro-pull-pct"] = 0.65;

  let contact = false;
  let now = Date.now();
  for (let tick = 0; tick < 200 && !contact; tick++) {
    world.tick(100, now);
    world.pendingDeaths = [];
    now += 100;
    contact = state.guardianIds.length < total || state.guardianIds.some((id) =>
      world.getMonsterEntity(id)?.hasAggroTarget?.targetId === player.isPlayer.id);
  }
  assert(contact, "within 20 s the player engages a guard pack instead of hovering between two");
}

console.log("returningAtHome.test.ts: ok");
