import { MONSTER_DATABASE, NODE_MODIFIERS, elitePoolWeight } from "@mmo-idle/shared";
import { World } from "../src/world/World";
import {
  effectiveMonsterDot,
  monsterEmpoweredMultiplier,
} from "../src/systems/combat/engine/monsterMechanics";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

const world = new World();
const POS = { x: 800, y: 800 };

// Sanity: the nodes this test leans on carry the modifiers it expects.
assert(NODE_MODIFIERS["node-4-6"].pace === "alacrity", "node-4-6 is alacrity");
assert(NODE_MODIFIERS["node-3-4"].pace === "brutality", "node-3-4 is brutality");
assert(NODE_MODIFIERS["node-6-5"].pace === "blight", "node-6-5 is blight");
assert(NODE_MODIFIERS["node-1-5"].pace === "volatility", "node-1-5 is volatility");

// ── Alacrity: faster + lighter than the def ────────────────────────────────────
const wolfDef = MONSTER_DATABASE.get("wolf")!;
const alac = world.createMonster("node-4-6", "wolf", POS)!;
assert(!!alac, "alacrity spawn");
assert(alac.dealsDamage.attack < wolfDef.stats.attack, "alacrity lowers attack");
assert(
  alac.performsAttack.attackCooldown < wolfDef.stats.attackCooldown,
  "alacrity lowers cooldown (faster)",
);
assert(alac.moddedByNode?.family === "alacrity", "alacrity attaches moddedByNode");

// ── Brutality: harder + slower than the def ────────────────────────────────────
const hopperDef = MONSTER_DATABASE.get("cliff-hopper")!;
const brut = world.createMonster("node-3-4", "cliff-hopper", POS)!;
assert(brut.dealsDamage.attack > hopperDef.stats.attack, "brutality raises attack");
assert(
  brut.performsAttack.attackCooldown > hopperDef.stats.attackCooldown,
  "brutality raises cooldown (slower)",
);

// ── Boss immunity in a modified dungeon node ───────────────────────────────────
const bossDef = MONSTER_DATABASE.get("gnarled-greatbear")!;
assert(bossDef.isBoss === true, "gnarled-greatbear is a boss");
assert(NODE_MODIFIERS["node-6-7"].pace === "alacrity", "node-6-7 dungeon is modified");
const boss = world.createMonster("node-6-7", "gnarled-greatbear", POS)!;
assert(boss.dealsDamage.attack === bossDef.stats.attack, "boss keeps def attack");
assert(
  boss.performsAttack.attackCooldown === bossDef.stats.attackCooldown,
  "boss keeps def cooldown",
);
assert(boss.moddedByNode === undefined, "boss carries no moddedByNode");

// ── Blight: DoT added to a monster that lacks one ──────────────────────────────
assert(wolfDef.dotEffect === undefined, "wolf has no authored DoT");
const blightWolf = world.createMonster("node-6-5", "wolf", POS)!;
assert(blightWolf.moddedByNode?.dot !== undefined, "blight synthesizes a DoT");
assert(
  effectiveMonsterDot(blightWolf, wolfDef) === blightWolf.moddedByNode!.dot,
  "effectiveMonsterDot returns the overlay DoT",
);

// ── Blight: existing DoT amplified, identity preserved ─────────────────────────
const bogDef = MONSTER_DATABASE.get("bog-slime")!;
assert(bogDef.dotEffect !== undefined, "bog-slime has an authored DoT");
assert(NODE_MODIFIERS["node-7-7"].pace === "blight", "node-7-7 is blight (T3)");
const blightBog = world.createMonster("node-7-7", "bog-slime", POS)!;
const bogEff = effectiveMonsterDot(blightBog, bogDef)!;
assert(bogEff !== undefined, "amplified DoT resolves");
assert(
  bogEff.damagePerStack > bogDef.dotEffect!.damagePerStack,
  "blight raises damagePerStack",
);
assert(
  bogEff.debuffId === bogDef.dotEffect!.debuffId,
  "blight preserves the debuff identity",
);

// ── Volatility: counted burst fires on the expected beat ───────────────────────
const volWolf = world.createMonster("node-1-5", "wolf", POS)!;
const cadence = volWolf.moddedByNode?.cadence;
assert(cadence !== undefined, "volatility attaches a cadence overlay");
assert(cadence!.everyNAttacks === 3, "synthesized cadence every 3 attacks");
const now = 1_000;
const m1 = monsterEmpoweredMultiplier(volWolf, wolfDef, now);
const m2 = monsterEmpoweredMultiplier(volWolf, wolfDef, now);
const m3 = monsterEmpoweredMultiplier(volWolf, wolfDef, now);
assert(m1 === 1 && m2 === 1, "no burst on the off-beats");
assert(m3 > 1, "burst on the 3rd (counted) attack");

// ── Density: population target scales; pool weighting favors the right shape ───
assert(NODE_MODIFIERS["node-4-7"].density === "swarming", "node-4-7 is swarming");
assert(NODE_MODIFIERS["node-6-10"].density === "elite-ground", "node-6-10 is elite-ground");
assert(
  world.getMobDensity("node-4-7") > world.getMobDensity("node-4-6"),
  "swarming raises the population target",
);
assert(
  world.getMobDensity("node-6-10") < world.getMobDensity("node-2-9"),
  "elite-ground lowers the population target",
);
assert(
  elitePoolWeight("elite-ground", true) > elitePoolWeight("swarming", true),
  "elite-ground weights elites above swarming",
);

// ── Unmodified nodes stay byte-identical to the def ────────────────────────────
assert(NODE_MODIFIERS["node-5-5"] === undefined, "clearing has no modifier");
const clearingMob = world.createMonster("node-5-5", "wolf", POS);
if (clearingMob) {
  assert(clearingMob.dealsDamage.attack === wolfDef.stats.attack, "clearing spawn unmodified");
  assert(clearingMob.moddedByNode === undefined, "clearing spawn has no moddedByNode");
}

console.log("nodeModifiers.wiring.test: ok");
