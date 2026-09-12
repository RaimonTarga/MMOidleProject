// Wiring smoke test for the monster empowered-beat flag.
//
// The client draws a monster's attack animation off `lastAttackAt` changing and
// passed NO flags when it did, so the heavier `empowered` variants that
// `fxBearClaws`/`fxBite`/`fxSlash`/`fxArrow`/`fxGunshot` already define were
// unreachable for every monster in the game — a cadence finisher looked exactly like
// an ordinary swing. The `monster-hit` event already carried the bit but has no
// `monsterId`, so the snapshot path could not use it; hence the slice field.
//
// What matters here is not the multiplier (that is `monsterMechanics`' job) but that
// the flag RISES on the amplified beat and FALLS again on the next ordinary one. A
// flag that is only ever set true would make every later swing read as empowered,
// which is worse than having no tell at all.

import { GAME_CONFIG, MONSTER_DATABASE, STARTER_RUNE_IDS, emptyEquipment } from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { runMonsterAttack } from "../src/systems/combat/engine/combat";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Empower Tester" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
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

initCombatSystems();

// Granite Mammoth: `cadenceFinisher` every 4th attack. Read from the database rather
// than hardcoded, so a designer retuning the cadence does not silently make this
// test assert the wrong beat.
const MONSTER_ID = "granite-mammoth";
const def = MONSTER_DATABASE.get(MONSTER_ID) as
  | { cadenceFinisher?: { everyNAttacks: number } }
  | undefined;
assert(def !== undefined, `${MONSTER_ID} is not in the database`);
const everyN = def!.cadenceFinisher?.everyNAttacks ?? 0;
assert(everyN > 1, `${MONSTER_ID} should still carry a cadenceFinisher; got ${everyN}`);

const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices("empower-player"), "empower-player");
player.mitigatesDamage.plating = 0;
player.mitigatesDamage.damageReduction = 0;

const monster = world.createMonster("node-5-5", MONSTER_ID, { x: 410, y: 400 });
assert(monster !== null, `test needs a monster; '${MONSTER_ID}' is not spawnable`);

let now = 1_000;
const flags: boolean[] = [];
for (let beat = 1; beat <= everyN * 2; beat++) {
  now += 5_000; // Comfortably past any cooldown so every call lands a real beat.
  runMonsterAttack(world, monster!, player, now);
  flags.push(monster!.performsAttack.lastAttackEmpowered === true);
}

// The amplified beats are exactly the multiples of `everyN`, twice over — which also
// proves the flag is cleared between them rather than latching on.
const expected = Array.from({ length: everyN * 2 }, (_, i) => (i + 1) % everyN === 0);
assert(
  flags.join(",") === expected.join(","),
  `empowered flag should follow the cadence.\n  expected: ${expected.join(",")}\n  actual:   ${flags.join(",")}`,
);

// An ordinary monster with no amplifier must never set the flag at all, or every mob
// in the game would draw the heavy variant on every swing.
const plain = world.createMonster("node-5-5", "plains-slime", { x: 412, y: 400 });
assert(plain !== null, "test needs 'plains-slime'");
for (let beat = 0; beat < 6; beat++) {
  now += 5_000;
  runMonsterAttack(world, plain!, player, now);
  assert(
    plain!.performsAttack.lastAttackEmpowered !== true,
    "a monster with no cadence finisher must never report an empowered beat",
  );
}

console.log("monsterEmpoweredBeat: ok");
