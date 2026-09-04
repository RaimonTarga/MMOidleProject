import {
  NODE_BIOMES,
  RECIPE_DATABASE,
  STANCE_RECIPE_DATABASE,
  type EssenceType,
} from "@mmo-idle/shared";
import { T2_PROGRESSION_ORDER } from "../routes/t2Common";

/**
 * At which leg of the control route does each Tier-2 purchase first become
 * PAYABLE, as opposed to merely unlocked?
 *
 * A recipe gate is a biome LEVEL. Affordability is a different question, and on
 * a `clean` entry (zero carryover) it is the binding one: an essence colour can
 * only be earned in the biomes that mint it, and a catalyst family only in nodes
 * carrying that modifier. So a cost is payable at leg N only if every colour it
 * asks for is minted by some biome at leg <= N, and likewise for its catalyst.
 *
 * This matters because a route step that asks for an unpayable cost does not
 * fail — it farms forever in a node that can never produce the missing resource.
 * That is the failure mode that cost a measured run 521 of its 540 seconds.
 *
 * `pnpm bot:t2-payable`
 */
const ESSENCE_BIOME: Record<EssenceType, string> = {
  yellow: "plains",
  green: "forest",
  purple: "swamp",
  blue: "mountain",
  red: "cave",
};

/** First leg index (1-based) at which a biome group has been visited. */
const legOf = new Map<string, number>();
T2_PROGRESSION_ORDER.forEach((group, i) => legOf.set(group, i + 1));
// Jungle also mints green and Desert also mints yellow, but both are later than
// their primary source, so the earliest leg is what matters.

const familyLegs = new Map<string, number>();
for (const [, info] of Object.entries(NODE_BIOMES)) {
  if (info.biomeTier !== 2 || info.kind !== "normal") continue;
  const family = (info as { modifier?: string }).modifier;
  const leg = legOf.get(info.biomeGroup);
  if (!family || !leg) continue;
  familyLegs.set(family, Math.min(familyLegs.get(family) ?? 99, leg));
}

interface Row {
  id: string;
  home: string;
  homeLeg: number;
  payableLeg: number;
  blockers: string[];
}

function analyse(
  id: string,
  home: string,
  cost: Partial<Record<string, number>> | undefined,
  catalystCost: Partial<Record<string, number>> | undefined,
): Row {
  const homeLeg = legOf.get(home) ?? 99;
  let payableLeg = homeLeg;
  const blockers: string[] = [];
  for (const [type, amount] of Object.entries(cost ?? {})) {
    if ((amount ?? 0) <= 0) continue;
    const source = ESSENCE_BIOME[type as EssenceType];
    const leg = legOf.get(source) ?? 99;
    if (leg > payableLeg) {
      payableLeg = leg;
      blockers.push(`${amount} ${type} (first minted at leg ${leg}, ${source})`);
    }
  }
  for (const [family, amount] of Object.entries(catalystCost ?? {})) {
    if ((amount ?? 0) <= 0) continue;
    const leg = familyLegs.get(family) ?? 99;
    if (leg > payableLeg) {
      payableLeg = leg;
      blockers.push(`${amount} ${family} catalyst (first minted at leg ${leg})`);
    }
  }
  return { id, home, homeLeg, payableLeg, blockers };
}

const rows: Row[] = [];
for (const r of RECIPE_DATABASE.values()) {
  if (r.tier !== 2) continue;
  // Reconstruction is the expensive path most templates are forced onto, so it
  // is the one whose affordability decides the route.
  rows.push(analyse(r.id, r.recipeGroup, r.reconstructCost ?? r.cost, r.reconstructCatalystCost ?? r.catalystCost));
}
for (const r of STANCE_RECIPE_DATABASE.values()) {
  if (r.tier !== 2) continue;
  rows.push(analyse(`STANCE ${r.stanceId}`, r.recipeGroup ?? "forest", r.cost, r.catalystCost));
}

console.log("Control-route legs: " + T2_PROGRESSION_ORDER.map((g, i) => `${i + 1}=${g}`).join("  "));
console.log("Catalyst families first minted at leg: " + JSON.stringify(Object.fromEntries(familyLegs)));
console.log("\nPurchases whose HOME leg is too early to pay for them (clean entry):\n");
let any = false;
for (const row of rows.sort((a, b) => a.payableLeg - b.payableLeg || a.id.localeCompare(b.id))) {
  if (row.payableLeg <= row.homeLeg) continue;
  any = true;
  console.log(
    `  ${row.id.padEnd(30)} home leg ${row.homeLeg} (${row.home}) -> payable leg ${row.payableLeg}\n` +
      row.blockers.map((b) => `      needs ${b}`).join("\n"),
  );
}
if (!any) console.log("  (none)");

console.log("\nEverything else is payable on its own leg.");
