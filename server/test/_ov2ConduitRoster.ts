// Throwaway (leading `_` = skipped by the test runner). OV2-CONDUIT: print the auto Formation
// each discipline fields at each tier's bosses (every biome at the tier's cap, the route's clears),
// with the weapon's Command. Usage (from server/):
//   node --conditions=development --import tsx test/_ov2ConduitRoster.ts
import {
  biomeLevelCap,
  classConfigContextFromState,
  defaultClassConfig,
  listBiomeGroupsAtTier,
  rosterCommand,
} from "@mmo-idle/shared";

const CHAINS: Record<string, [string, string, string]> = {
  swarm: ["conduit-swarm", "conduit-legion", "conduit-devour"],
  pack: ["conduit-pack", "conduit-the-hunt", "conduit-avenge"],
  elite: ["conduit-elite", "conduit-ascendant", "conduit-last-stand"],
};
const only = process.argv[2];
const WEAPON: Record<number, number> = { 2: Number(process.env.W2 ?? -1), 3: Number(process.env.W3 ?? -1), 4: Number(process.env.W4 ?? -1) };

const T1 = ["plains:1", "mountain:1"];
const T2 = ["plains", "forest", "swamp", "cave", "mountain", "jungle", "desert"].map((b) => `${b}:2`);
const T3 = ["mountain", "cave", "swamp", "jungle", "desert", "tundra", "volcanic"].map((b) => `${b}:3`);

for (const [name, [discipline, spec]] of Object.entries(CHAINS)) {
  if (only && only !== name) continue;
  for (const tier of [2, 3, 4]) {
    const biomeLevel: Record<string, number> = { clearing: biomeLevelCap(tier, "clearing") };
    for (let t = 1; t <= tier; t++) for (const g of listBiomeGroupsAtTier(t)) biomeLevel[g] = biomeLevelCap(tier, g);
    const cleared = tier === 2 ? T1 : tier === 3 ? [...T1, ...T2] : [...T1, ...T2, ...T3];
    const ctx = classConfigContextFromState({
      combatArchetype: "summoner",
      biomeLevel,
      bossesCleared: cleared,
      disciplineId: discipline,
      specializationId: tier >= 3 ? spec : null,
      budgetBonus: WEAPON[tier],
    });
    if (!ctx) throw new Error("no ctx");
    const config = defaultClassConfig(ctx);
    if (config.system.kind !== "formation") throw new Error("not a formation");
    const roster = config.system.roster;
    const counts = new Map<string, number>();
    for (const id of roster) counts.set(id, (counts.get(id) ?? 0) + 1);
    const shown = [...counts].map(([id, n]) => `${id.replace("conduit-", "")}${n > 1 ? `x${n}` : ""}`).join(", ");
    console.log(`${name.padEnd(6)} T${tier} budget ${ctx.budget} used ${rosterCommand(roster, discipline, tier >= 3 ? spec : null)} bodies ${roster.length}: ${shown}`);
  }
}
