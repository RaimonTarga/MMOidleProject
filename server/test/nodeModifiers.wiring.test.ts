import {
  MONSTER_DATABASE,
  NODE_MODIFIERS,
  modifierRewardMult,
  modifierSpawnFactor,
} from "@mmo-idle/shared";
import { World } from "../src/world/World";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

const world = new World();
const POS = { x: 800, y: 800 };

// Nodes chosen so each modifier is exercised against a same-biome control, since
// population targets are per-biome.
const ALACRITY = "node-t1-forest-01";
const FOREST_CONTROL = "node-t1-forest-04"; // fortified — no population change
const HEAVY = "node-t1-mountain-01";
const SWARMING = "node-t1-plains-03";
const PLAINS_CONTROL = "node-t1-plains-01"; // alacrity — no population change
const DOMINION = "node-t1-cave-04";
const CAVE_CONTROL = "node-t1-cave-01"; // alacrity — no population change
const FORTIFIED = "node-t1-swamp-05";

// Sanity: the nodes this test leans on carry the modifiers it expects.
assert(NODE_MODIFIERS[ALACRITY].modifier === "alacrity", "forest 01 is alacrity");
assert(NODE_MODIFIERS[HEAVY].modifier === "heavy", "mountain 01 is heavy");
assert(NODE_MODIFIERS[SWARMING].modifier === "swarming", "plains 03 is swarming");
assert(NODE_MODIFIERS[DOMINION].modifier === "dominion", "cave 04 is dominion");
assert(NODE_MODIFIERS[FORTIFIED].modifier === "fortified", "swamp 05 is fortified");

// ── Alacrity: faster cadence and movement, damage untouched ───────────────────
const wolfDef = MONSTER_DATABASE.get("wolf")!;
const alac = world.createMonster(ALACRITY, "wolf", POS)!;
assert(!!alac, "alacrity spawn");
assert(alac.dealsDamage.attack === wolfDef.stats.attack, "alacrity leaves attack alone");
assert(
  alac.performsAttack.attackCooldown < wolfDef.stats.attackCooldown,
  "alacrity lowers cooldown (faster)",
);
assert(alac.hasPosition.speed > wolfDef.stats.speed, "alacrity raises move speed");
assert(alac.hasHealth.maxHp === wolfDef.stats.hp, "alacrity leaves HP alone");

// ── Heavy: bigger hits, slower cadence, net more damage ───────────────────────
const hopperDef = MONSTER_DATABASE.get("cliff-hopper")!;
const heavy = world.createMonster(HEAVY, "cliff-hopper", POS)!;
assert(heavy.dealsDamage.attack > hopperDef.stats.attack, "heavy raises attack");
assert(
  heavy.performsAttack.attackCooldown > hopperDef.stats.attackCooldown,
  "heavy raises cooldown (slower)",
);
const baseDps = (hopperDef.stats.attack * 1000) / hopperDef.stats.attackCooldown;
const heavyDps =
  (heavy.dealsDamage.attack * 1000) / heavy.performsAttack.attackCooldown;
assert(heavyDps > baseDps, "heavy is net dps-positive despite the slower cadence");

// ── Swarming: population only, monsters untouched ─────────────────────────────
const hareDef = MONSTER_DATABASE.get("plains-slime")!;
const swarmMob = world.createMonster(SWARMING, "plains-slime", POS)!;
assert(swarmMob.dealsDamage.attack === hareDef.stats.attack, "swarming leaves attack alone");
assert(
  swarmMob.performsAttack.attackCooldown === hareDef.stats.attackCooldown,
  "swarming leaves cooldown alone",
);
assert(swarmMob.hasHealth.maxHp === hareDef.stats.hp, "swarming leaves HP alone");
assert(
  world.getMobDensity(SWARMING) > world.getMobDensity(PLAINS_CONTROL),
  "swarming raises the node population",
);

// ── Dominion: fewer bodies, each stronger in every respect ────────────────────
const bruteDef = MONSTER_DATABASE.get("cave-brute")!;
const dom = world.createMonster(DOMINION, "cave-brute", POS)!;
assert(dom.hasHealth.maxHp > bruteDef.stats.hp, "dominion raises HP");
assert(dom.dealsDamage.attack > bruteDef.stats.attack, "dominion raises attack");
assert(dom.hasPosition.speed > bruteDef.stats.speed, "dominion raises move speed");
assert(
  dom.mitigatesDamage.damageReduction > bruteDef.stats.damageReduction,
  "dominion raises damage reduction",
);
assert(
  world.getMobDensity(DOMINION) < world.getMobDensity(CAVE_CONTROL),
  "dominion lowers the node population",
);
assert(world.getMobDensity(DOMINION) >= 1, "dominion never empties a node");

// ── Fortified: defence only ───────────────────────────────────────────────────
const toadDef = MONSTER_DATABASE.get("mud-toad")!;
const fort = world.createMonster(FORTIFIED, "mud-toad", POS)!;
assert(fort.dealsDamage.attack === toadDef.stats.attack, "fortified leaves attack alone");
assert(
  fort.performsAttack.attackCooldown === toadDef.stats.attackCooldown,
  "fortified leaves cooldown alone",
);
assert(fort.hasPosition.speed === toadDef.stats.speed, "fortified leaves speed alone");
// Plating is rounded at spawn, and T1 magnitude is only 5% — a 2-plating toad
// cannot move. Assert the shape here and prove the scaling on a monster whose
// plating is large enough for the rounding not to swallow it.
assert(fort.mitigatesDamage.plating >= toadDef.stats.plating, "fortified never lowers plating");
const hydraDef = MONSTER_DATABASE.get("swamp-hydra")!;
const fortHydra = world.createMonster(FORTIFIED, "swamp-hydra", POS)!;
assert(
  fortHydra.mitigatesDamage.plating > hydraDef.stats.plating,
  "fortified raises plating where rounding allows it",
);
assert(
  fort.mitigatesDamage.damageReduction > toadDef.stats.damageReduction,
  "fortified raises damage reduction",
);
assert(fort.mitigatesDamage.damageReduction < 1, "damage reduction never reaches 1");
assert(
  world.getMobDensity(FORTIFIED) === world.getMobDensity("node-t1-swamp-01"),
  "fortified does not change the node population",
);

// A monster authored with DR 0 still gains reduction — the multiplicative fold has
// to work from zero, which a naive `DR x k` cannot do.
const oozeDef = MONSTER_DATABASE.get("bog-slime")!;
assert(oozeDef.stats.damageReduction === 0, "bog-slime is authored with no DR");
const fortOoze = world.createMonster(FORTIFIED, "bog-slime", POS)!;
assert(
  fortOoze.mitigatesDamage.damageReduction > 0,
  "fortified grants DR to a monster authored with none",
);

// ── Boss immunity in a modified (non-dungeon) node ────────────────────────────
const bossDef = MONSTER_DATABASE.get("gnarled-greatbear")!;
assert(bossDef.isBoss === true, "gnarled-greatbear is a boss");
const boss = world.createMonster(ALACRITY, "gnarled-greatbear", POS)!;
assert(boss.dealsDamage.attack === bossDef.stats.attack, "boss keeps def attack");
assert(
  boss.performsAttack.attackCooldown === bossDef.stats.attackCooldown,
  "boss keeps def cooldown",
);
assert(boss.hasHealth.maxHp === bossDef.stats.hp, "boss keeps def HP");

// ── Dungeons are excluded — no modifier, trash unmodified ─────────────────────
assert(NODE_MODIFIERS["node-t1-forest-dungeon"] === undefined, "dungeon node has no modifier");
assert(
  modifierSpawnFactor(NODE_MODIFIERS["node-t1-forest-dungeon"]?.modifier, 1) === 1,
  "an absent modifier leaves population alone",
);

// ── Unmodified nodes stay identical to the def ────────────────────────────────
assert(NODE_MODIFIERS["node-clearing"] === undefined, "clearing has no modifier");
const clearingMob = world.createMonster("node-clearing", "wolf", POS);
if (clearingMob) {
  assert(clearingMob.dealsDamage.attack === wolfDef.stats.attack, "clearing spawn unmodified");
  assert(clearingMob.hasHealth.maxHp === wolfDef.stats.hp, "clearing HP unmodified");
  assert(
    clearingMob.performsAttack.attackCooldown === wolfDef.stats.attackCooldown,
    "clearing cooldown unmodified",
  );
}

// ── Rewards pay for the added difficulty ──────────────────────────────────────
for (const nodeId of [ALACRITY, HEAVY, SWARMING, DOMINION, FORTIFIED]) {
  assert(
    modifierRewardMult(NODE_MODIFIERS[nodeId].modifier, 1) > 1,
    `${nodeId} pays a reward premium`,
  );
  // ...and pays MORE for the same modifier deeper in the world.
  assert(
    modifierRewardMult(NODE_MODIFIERS[nodeId].modifier, 4) >
      modifierRewardMult(NODE_MODIFIERS[nodeId].modifier, 1),
    `${nodeId} pays more at T4 than at T1`,
  );
}
assert(modifierRewardMult(undefined, 1) === 1, "an unmodified node pays no premium");

console.log("nodeModifiers.wiring.test: ok");
