import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  applyStatusEffect,
  emptyEquipment,
  resolveMonsterDotDebuff,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { syncPlayerBuffs } from "../src/systems/combat/buffs/buffSync";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "poison-icons-player", name: "Poison Icons" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
    },
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
      equippedAbilities: { techniques: [], guards: [] },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: {
      inventory: [],
      equipment: emptyEquipment(),
      itemUpgrades: {},
    },
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

const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices(), "poison-icons-player");
const expectedEffectIds = new Set<string>();
let poisonDefinitionCount = 0;

for (const monsterDef of MONSTER_DATABASE.values()) {
  if (!monsterDef.dotEffect) continue;
  const debuff = resolveMonsterDotDebuff({ monster: monsterDef });
  if (debuff.id !== "poison") continue;

  poisonDefinitionCount += 1;
  expectedEffectIds.add(debuff.statusEffectId);
  const monster = world.createMonster("node-5-5", monsterDef.id, { x: 420, y: 400 });
  assert(monster, `failed to create poison monster ${monsterDef.id}`);
  applyStatusEffect(player.tracksCombat, {
    id: debuff.statusEffectId,
    maxStacks: monsterDef.dotEffect.maxStacks,
    remainingMs: monsterDef.dotEffect.durationMs,
    refreshable: true,
    sourceId: monster.isMonster.id,
    data: {
      totalMs: monsterDef.dotEffect.durationMs,
      damagePerStack: monsterDef.dotEffect.damagePerStack,
      flavorCode: debuff.code,
    },
  });
}

syncPlayerBuffs(world, 1_000);
const poisonBuffs = (player.hasStatus.activeBuffs ?? []).filter(
  (buff) => buff.id === "debuff-dot",
);

assert(poisonDefinitionCount >= 19, "the poison authoring audit unexpectedly shrank");
assert(
  poisonBuffs.length === expectedEffectIds.size,
  "every distinct authored poison should project a HUD entry",
);
assert(
  poisonBuffs.every((buff) => buff.iconKey === "debuff-poison"),
  "every poison flavor should share the generic poison artwork",
);
assert(
  new Set(poisonBuffs.map((buff) => buff.instanceKey)).size === poisonBuffs.length,
  "shared poison artwork must not collapse distinct runtime effects",
);
assert(
  poisonBuffs.some((buff) => buff.instanceKey === "monster-dot:spider-venom"),
  "Giant Spider venom should use the generic poison artwork",
);
assert(
  poisonBuffs.some((buff) => buff.instanceKey === "monster-dot:deep-spider-venom"),
  "Deep Spider venom should use the generic poison artwork",
);
assert(
  poisonBuffs.some((buff) => buff.instanceKey === "monster-dot:swamp-poison"),
  "Swamp poison should use the generic poison artwork",
);

console.log("monsterDotBuffIcons.test.ts: ok");
