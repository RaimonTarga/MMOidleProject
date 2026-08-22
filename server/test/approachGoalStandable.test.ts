/**
 * Regression: the auto-combat approach goal must always be a point the player can
 * stand in.
 *
 * The far-approach standoff is derived along the straight line to the target, so a
 * target hugging the far side of an obstacle puts that point INSIDE the obstacle —
 * most easily when `attackRange` is small enough that APPROACH_GOAL_SLACK zeroes
 * the aim gap and the standoff advances the entire edge-to-edge gap.
 *
 * An unreachable goal does not merely fail; it WEDGES. The nav layer snaps the
 * blocked goal cell to the nearest walkable cell, which for a target directly
 * behind an obstacle sits back on the player's own side. The player steps a few px,
 * lands inside the goal-arrival epsilon, clears the path, re-derives the same
 * unreachable goal next tick, and oscillates forever without ever routing around.
 *
 * This asserts the invariant rather than eventual arrival, so it keeps testing the
 * bug even when procedural terrain reshuffles (which is exactly how it first
 * surfaced — a node-size change moved which trunk the sibling test picks).
 */
import {
  aabbHalfExtents,
  emptyEquipment,
  moverOverlapsBlockShapes,
  posHitboxFromEntity,
  GAME_CONFIG,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { steerTowardTarget } from "../src/systems/combat/ai/autoTarget";
import { navigationPadForEntity } from "../src/systems/world/movement";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function playerSlices(id: string, nodeId: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
    },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [], runeRecipesCrafted: [],
      runesEquipped: [], knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: "cadence",
    },
  };
}

const nodeId = "node-t1-forest-01";
const world = new World();

const trunks = world.collision
  .staticRegions(nodeId)
  .filter((r) => r.kind === "block" && r.data?.blockTarget === "player")
  .map((r) => r.shape)
  .filter((sh): sh is Extract<typeof sh, { kind: "ellipse" }> => sh.kind === "ellipse");
assert(trunks.length > 0, "forest node should generate blocking tree trunks");

// Every trunk, not just one: the wedge only appears for certain widths relative to
// the 32px nav cell, and hard-coding a single trunk is what let it hide before.
let checked = 0;
for (const trunk of trunks) {
  const player = world.attachPlayerEntity(
    playerSlices(`probe-${checked}`, nodeId),
    `probe-${checked}`,
  );
  const playerPad = aabbHalfExtents(posHitboxFromEntity(player).rects);
  player.hasPosition.current = {
    x: trunk.x - trunk.halfW - playerPad.x - 9,
    y: trunk.y,
  };

  const monster = world.createMonster(nodeId, "forest-slime", { x: 400, y: 400 });
  if (!monster) throw new Error("failed to create forest target");
  const monsterPad = aabbHalfExtents(posHitboxFromEntity(monster).rects);
  monster.hasPosition.current = {
    x: trunk.x + trunk.halfW + monsterPad.x + 1,
    y: trunk.y,
  };

  // Small enough that APPROACH_GOAL_SLACK (64) zeroes the aim gap — the case that
  // advances the standoff the whole way into the trunk.
  player.performsAttack.attackRange = 40;
  steerTowardTarget(world, player, monster, 1_000);

  const goal = player.hasMovePath?.goal;
  if (goal) {
    const shapes = world.collision.blockShapes(nodeId, "player");
    assert(
      !moverOverlapsBlockShapes(goal, shapes, navigationPadForEntity(player)),
      `approach goal must be standable, got ${JSON.stringify(goal)} inside a blocker `
        + `(trunk ${JSON.stringify(trunk)})`,
    );
    checked++;
  }

  world.removeMonsterEntity(monster.isMonster.id);
  world.detachPlayerEntity(`probe-${checked - 1}`);
}

assert(checked > 0, "expected at least one trunk to produce a pathed approach goal");
console.log(`approachGoalStandable.test.ts: ok (${checked} trunk approaches checked)`);
