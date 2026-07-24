import {
  DENSITY_MODIFIERS_ENABLED,
  MONSTER_DATABASE,
  NODE_MODIFIERS,
} from "@mmo-idle/shared";
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
assert(NODE_MODIFIERS["node-t1-forest-01"].pace === "alacrity", "forest 01 is alacrity");
assert(NODE_MODIFIERS["node-t1-mountain-01"].pace === "brutality", "mountain 01 is brutality");
assert(NODE_MODIFIERS["node-t1-swamp-03"].pace === "blight", "swamp 03 is blight");
assert(NODE_MODIFIERS["node-t1-cave-04"].pace === "volatility", "cave 04 is volatility");

// ── Alacrity: faster + lighter than the def ────────────────────────────────────
const wolfDef = MONSTER_DATABASE.get("wolf")!;
const alac = world.createMonster("node-t1-forest-01", "wolf", POS)!;
assert(!!alac, "alacrity spawn");
assert(alac.dealsDamage.attack < wolfDef.stats.attack, "alacrity lowers attack");
assert(
  alac.performsAttack.attackCooldown < wolfDef.stats.attackCooldown,
  "alacrity lowers cooldown (faster)",
);
assert(alac.moddedByNode?.family === "alacrity", "alacrity attaches moddedByNode");

// ── Brutality: harder + slower than the def ────────────────────────────────────
const hopperDef = MONSTER_DATABASE.get("cliff-hopper")!;
const brut = world.createMonster("node-t1-mountain-01", "cliff-hopper", POS)!;
assert(brut.dealsDamage.attack > hopperDef.stats.attack, "brutality raises attack");
assert(
  brut.performsAttack.attackCooldown > hopperDef.stats.attackCooldown,
  "brutality raises cooldown (slower)",
);

// ── Boss immunity in a modified (non-dungeon) node ─────────────────────────────
const bossDef = MONSTER_DATABASE.get("gnarled-greatbear")!;
assert(bossDef.isBoss === true, "gnarled-greatbear is a boss");
const boss = world.createMonster("node-t1-forest-01", "gnarled-greatbear", POS)!;
assert(boss.dealsDamage.attack === bossDef.stats.attack, "boss keeps def attack");
assert(
  boss.performsAttack.attackCooldown === bossDef.stats.attackCooldown,
  "boss keeps def cooldown",
);
assert(boss.moddedByNode === undefined, "boss carries no moddedByNode");

// ── Dungeons are excluded — no modifier, trash unmodified ──────────────────────
assert(NODE_MODIFIERS["node-t1-forest-dungeon"] === undefined, "dungeon node has no modifier");
const dungeonMob = world.createMonster("node-t1-forest-dungeon", "wolf", POS)!;
assert(dungeonMob.moddedByNode === undefined, "dungeon trash carries no moddedByNode");

// ── Blight: DoT added to a monster that lacks one ──────────────────────────────
assert(wolfDef.dotEffect === undefined, "wolf has no authored DoT");
const blightWolf = world.createMonster("node-t1-swamp-03", "wolf", POS)!;
assert(blightWolf.moddedByNode?.dot !== undefined, "blight synthesizes a DoT");
assert(
  effectiveMonsterDot(blightWolf, wolfDef) === blightWolf.moddedByNode!.dot,
  "effectiveMonsterDot returns the overlay DoT",
);

// ── Blight: existing DoT amplified, identity preserved ─────────────────────────
const bogDef = MONSTER_DATABASE.get("bog-slime")!;
assert(bogDef.dotEffect !== undefined, "bog-slime has an authored DoT");
assert(NODE_MODIFIERS["node-t3-swamp-03"].pace === "blight", "T3 swamp 03 is blight");
const blightBog = world.createMonster("node-t3-swamp-03", "bog-slime", POS)!;
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
const volWolf = world.createMonster("node-t1-cave-04", "wolf", POS)!;
const cadence = volWolf.moddedByNode?.cadence;
assert(cadence !== undefined, "volatility attaches a cadence overlay");
assert(cadence!.everyNAttacks === 3, "synthesized cadence every 3 attacks");
const now = 1_000;
const m1 = monsterEmpoweredMultiplier(volWolf, wolfDef, now);
const m2 = monsterEmpoweredMultiplier(volWolf, wolfDef, now);
const m3 = monsterEmpoweredMultiplier(volWolf, wolfDef, now);
assert(m1 === 1 && m2 === 1, "no burst on the off-beats");
assert(m3 > 1, "burst on the 3rd (counted) attack");

// ── Density modifiers are fully dormant while their design is reconsidered ─────
assert(DENSITY_MODIFIERS_ENABLED === false, "density modifiers stay disabled");
assert(
  Object.values(NODE_MODIFIERS).every((modifier) => modifier.density === undefined),
  "authored modifiers expose no density slot",
);
assert(
  world.getMobDensity("node-t1-forest-05") === world.getMobDensity("node-t1-forest-01"),
  "former swarming node keeps the biome population target",
);
assert(
  world.getMobDensity("node-t4-jungle-01") === world.getMobDensity("node-t4-jungle-02"),
  "former elite-ground node keeps the biome population target",
);

// ── Unmodified nodes stay byte-identical to the def ────────────────────────────
assert(NODE_MODIFIERS["node-clearing"] === undefined, "clearing has no modifier");
const clearingMob = world.createMonster("node-clearing", "wolf", POS);
if (clearingMob) {
  assert(clearingMob.dealsDamage.attack === wolfDef.stats.attack, "clearing spawn unmodified");
  assert(clearingMob.moddedByNode === undefined, "clearing spawn has no moddedByNode");
}

console.log("nodeModifiers.wiring.test: ok");
