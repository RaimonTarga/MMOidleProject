import {
  CLEARING_NODE_ID,
  GAME_CONFIG,
  emptyEquipment,
  emptyEquippedAbilities,
  emptyEquippedRites,
  emptyEquippedStances,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import { buildSpectatorNodeSnapshot } from "../src/world/spectatorSnapshot";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const slices: PersistedPlayerSlices = {
  isPlayer: { id: "private-player", name: "Public Name" },
  hasPosition: {
    current: { x: 400, y: 400 },
    nodeId: CLEARING_NODE_ID,
    speed: GAME_CONFIG.PLAYER_SPEED,
  },
  hasHealth: { hp: 90, maxHp: 100, hpRegen: 2 },
  tracksProgression: {
    level: 77,
    skillPoints: 9,
    essences: { red: 12345, blue: 0, green: 0, yellow: 0, purple: 0 },
    catalysts: { "private-wallet": 42 },
    catalystProgress: {},
    biomeXP: { "private-biome": 999 },
    biomeLevel: {},
    unlockedRecipes: ["private-recipe"],
    questProgress: { "private-quest": 8 },
    playerTier: 2,
    currentSkillTier: 1,
    bossesCleared: ["private-boss"],
    clearedNodes: [],
    visitedNodes: [],
    runesOwned: ["private-rune"],
    runeRecipesCrafted: [],
    runesEquipped: [],
    knownAbilities: [],
    equippedAbilities: emptyEquippedAbilities(),
    knownStances: [],
    equippedStances: emptyEquippedStances(),
    activeStance: null,
    knownRites: [],
    equippedRites: emptyEquippedRites(),
  },
  holdsInventory: {
    inventory: ["private-item"],
    equipment: emptyEquipment(),
    itemUpgrades: { "private-item": 3 },
  },
  usesSkills: {
    unlockedSkills: ["private-skill"],
    passives: { "private-passive": 11 },
    selectedClass: "cadence",
    selectedSubVariant: null,
    selectedRange: null,
    combatArchetype: "cadence",
  },
};

const world = new World();
world.attachPlayerEntity(slices, slices.isPlayer.id);
const snapshot = buildSpectatorNodeSnapshot(world, CLEARING_NODE_ID);
const playerDelta = snapshot.deltas.find((delta) =>
  delta.kind === "add" && delta.netId === slices.isPlayer.id,
);

assert(playerDelta?.kind === "add", "spectator snapshot should include the visible player");
if (!playerDelta || playerDelta.kind !== "add") throw new Error("missing player delta");
assert(playerDelta.components.spectatorPlayer?.playerTier === 2, "safe tier should be projected");
assert(playerDelta.components.spectatorPlayer?.selectedClass === "cadence", "safe class should be projected");
assert(playerDelta.components.tracksProgression === undefined, "progression slice must stay off the wire");
assert(playerDelta.components.holdsInventory === undefined, "inventory slice must stay off the wire");
assert(playerDelta.components.usesSkills === undefined, "skill build slice must stay off the wire");

const wire = JSON.stringify(snapshot);
for (const secret of ["private-item", "private-skill", "private-passive", "private-wallet", "private-quest"]) {
  assert(!wire.includes(secret), `spectator wire payload leaked ${secret}`);
}

console.log("spectatorSnapshot.test.ts: ok");
