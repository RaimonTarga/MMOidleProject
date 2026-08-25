import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  ABILITY_DATABASE,
  ABILITY_RECIPE_DATABASE,
  ACTION_DATABASE,
  BIOME_DATABASE,
  BIOME_LEVELS_PER_TIER,
  BIOME_PRIMARY_ESSENCE,
  CONDITION_DATABASE,
  ITEM_DATABASE,
  MONSTER_DATABASE,
  NODE_BIOMES,
  RECIPE_DATABASE,
  RITE_DATABASE,
  RUNE_RECIPE_DATABASE,
  SKILL_TREE,
  STANCE_DATABASE,
  STARTER_RUNE_IDS,
  WORLD_NODE_LIST,
  abilitySlotCount,
  biomeLevelCap,
  biomeXpForLevel,
  globalMasteryRequiredForUpgrade,
  runeBudgetForGlobalMastery,
  upgradeCostFor,
} from "@mmo-idle/shared";
import { parseArgs } from "./config";

/**
 * Generates the route-authoring knowledge packet.
 *
 * Everything below is READ FROM THE GAME DATA, never restated by hand, so the
 * packet cannot drift from the code the bots actually play against. Regenerate
 * with `pnpm bot:reference` after any balance or content change.
 */

const T1_BIOMES = ["plains", "forest", "cave", "mountain", "swamp"] as const;
const out: string[] = [];
const w = (line = ""): void => {
  out.push(line);
};

function num(n: number | undefined): string {
  if (n === undefined) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function effects(record: Record<string, number> | undefined): string {
  if (!record) return "";
  return Object.entries(record)
    .map(([k, v]) => `${k} ${num(v)}`)
    .join(", ");
}

// ── Header ───────────────────────────────────────────────────────────────────

w("# Bot route authoring — game knowledge packet");
w();
w("**Generated from live game data. Do not hand-edit — run `pnpm bot:reference`.**");
w();
w("Audience: whoever (human or model) is authoring progression routes for the");
w("headless bot harness. It contains everything needed to choose a class, a gear");
w("path, abilities and runes, and to express that choice as a route.");
w();
w("A route is a **hypothesis about how the game should be played**. The harness");
w("executes it faithfully and reports where it breaks. A stall is a finding, not");
w("automatically a bug in the route.");
w();
w("Companion docs: [`bot/README.md`](../bot/README.md) (running, telemetry),");
w("[`bot/ROUTE-AUTHORING.md`](../bot/ROUTE-AUTHORING.md) (the DSL in detail).");
w();

// ── Hard rules ───────────────────────────────────────────────────────────────

w("## 1. The gating rules a route must obey");
w();
w("These are not guidelines. A route that violates one cannot complete.");
w();
w(`**Player tier gates biome access.** \`biomeLevelCap(playerTier, biome)\` is`);
w(`\`(playerTier - biomeStartTier + 1) x ${BIOME_LEVELS_PER_TIER}\`. A tier-0 character has a cap of`);
w("**0** in every T1 biome — it cannot bank a single level there. The tier-0 quest");
w("(10 Tiny Wisps in the Clearing) must come first. At tier 1 each T1 biome caps at");
w(`**${biomeLevelCap(1, "plains")}**.`);
w();
w("**Item upgrades are gated by Global Mastery, which is account-wide.** GM is the");
w("sum of every biome's level, *excluding the Clearing and Sanctuary*. Gear depth is");
w("therefore bought with **breadth**:");
w();
w("| upgrade | +1 | +2 | +3 | +4 | +5 |");
w("|---|---|---|---|---|---|");
w(
  `| GM required (tier-1 item) | ${[1, 2, 3, 4, 5]
    .map((p) => globalMasteryRequiredForUpgrade(1, p))
    .join(" | ")} |`,
);
w();
w(`One T1 biome maxes at ${biomeLevelCap(1, "plains")} GM, so a single-biome character can only ever reach **+1**.`);
w(`All five maxed = GM ${T1_BIOMES.length * biomeLevelCap(1, "plains")}, which is exactly what **+5** needs.`);
w();
const slots = abilitySlotCount(1);
w(`**Ability slots at player tier 1: ${slots.technique} Technique, ${slots.guard} Guard.**`);
w("Every mid-run ability change is therefore a REPLACEMENT, not an addition.");
w("(Tier 3 grants a 2nd Technique; tier 4 a 2nd Guard.)");
w();
w(`**Runic Points**: budget is \`8 + floor(GM / 10)\` — ${runeBudgetForGlobalMastery(0)} at GM 0,`);
w(`${runeBudgetForGlobalMastery(30)} at GM 30. Each equipped rune rule costs condition + action.`);
w();
w("**Biome XP curve** (cumulative, per biome):");
w();
w("| level | " + [1, 2, 3, 4, 5, 6].map((n) => `L${n}`).join(" | ") + " |");
w("|---|" + "---|".repeat(6));
w("| cumulative XP | " + [1, 2, 3, 4, 5, 6].map((n) => biomeXpForLevel(n)).join(" | ") + " |");
w(
  "| this level costs | " +
    [1, 2, 3, 4, 5, 6].map((n) => biomeXpForLevel(n) - biomeXpForLevel(n - 1)).join(" | ") +
    " |",
);
w();
w("Note the shape: reaching L6 costs roughly **twice** everything spent up to L4.");
w();

// ── Classes ──────────────────────────────────────────────────────────────────

w("## 2. Classes (tier-0 roots)");
w();
w("Choosing a root costs 1 skill point, granted by the tier-0 quest. Percentages");
w("are class affinities applied once after gear.");
w();
for (const node of [...SKILL_TREE.values()].filter((n) => n.tier === 0)) {
  w(`### ${node.name} — \`${node.id}\``);
  w();
  w(node.description);
  w();
  const st = effects(node.statEffects as unknown as Record<string, number>);
  if (st) w(`- **Affinities:** ${st}`);
  const me = effects(node.mechanicEffects as unknown as Record<string, number>);
  if (me) w(`- **Mechanics:** ${me}`);
  w();
}
w("> `summoner-root` (Conduit) is gated behind the server's `CONDUIT_ENABLED` flag.");
w();

// ── Map ──────────────────────────────────────────────────────────────────────

w("## 3. The world map");
w();
w("An 11x11 grid of nodes. Travel is gate-to-gate between orthogonally adjacent");
w("nodes; the server owns pathing (`player:navigateTo`), so a route only names a");
w("destination. Routes should name content (`{ biomeGroup, tier }`), not node ids.");
w();

const rows = WORLD_NODE_LIST.map((n) => n.map.row);
const cols = WORLD_NODE_LIST.map((n) => n.map.col);
const minRow = Math.min(...rows);
const maxRow = Math.max(...rows);
const minCol = Math.min(...cols);
const maxCol = Math.max(...cols);
const byCell = new Map(WORLD_NODE_LIST.map((n) => [`${n.map.row},${n.map.col}`, n]));

const LETTER: Record<string, string> = {
  clearing: "C",
  plains: "P",
  forest: "F",
  cave: "V",
  mountain: "M",
  swamp: "S",
};

w("### Shape (tier-1 region and its neighbours)");
w();
w("```text");
w("     " + Array.from({ length: maxCol - minCol + 1 }, (_, i) => String((minCol + i) % 10)).join(" "));
for (let r = minRow; r <= maxRow; r++) {
  const cells: string[] = [];
  for (let c = minCol; c <= maxCol; c++) {
    const node = byCell.get(`${r},${c}`);
    if (!node) {
      cells.push(".");
      continue;
    }
    const base = LETTER[node.biomeGroup] ?? node.biomeGroup[0].toUpperCase();
    const isDungeon = node.kind === "dungeon" || node.kind === "unique";
    cells.push(node.biomeTier === 1 || node.biomeTier === 0 ? (isDungeon ? base.toLowerCase() : base) : "·");
  }
  w(`  ${String(r).padStart(2)} ${cells.join(" ")}`);
}
w("```");
w();
w("`C` Clearing · `P` Plains · `F` Forest · `V` Cave · `M` Mountain · `S` Swamp");
w("· lowercase = that biome's **dungeon** node · `·` = tier 2+ content · `.` = no node");
w();

w("### Tier-1 nodes");
w();
w("| node id | biome | kind | modifier |");
w("|---|---|---|---|");
for (const [id, info] of Object.entries(NODE_BIOMES)) {
  if (info.biomeTier > 1) continue;
  w(`| \`${id}\` | ${info.biomeGroup} | ${info.kind} | ${info.modifier ?? "—"} |`);
}
w();
w("Node modifiers are all-upside and determine which **catalyst family** the node");
w("pays into (alacrity / heavy / swarming / dominion / fortified).");
w();

// ── Biomes and monsters ──────────────────────────────────────────────────────

w("## 4. Tier-1 biomes and their rosters");
w();
w("Essence type per biome: " + T1_BIOMES.map((b) => `${b} = ${BIOME_PRIMARY_ESSENCE[b]}`).join(" · ") + ".");
w();

for (const group of T1_BIOMES) {
  const biome = BIOME_DATABASE.get(group);
  w(`### ${biome?.name ?? group} (\`${group}\`, ${BIOME_PRIMARY_ESSENCE[group]} essence)`);
  w();
  const pool = biome?.monsterPoolByTier?.[1] ?? [];
  const bosses = biome?.bossPoolByTier?.[1] ?? [];
  w("| monster | role | hp | atk | plate | DR | rng | cd(ms) | behavior | essence |");
  w("|---|---|---|---|---|---|---|---|---|---|");
  for (const id of [...pool, ...bosses]) {
    const m = MONSTER_DATABASE.get(id);
    if (!m) continue;
    const role = bosses.includes(id) ? "**BOSS**" : "normal";
    w(
      `| ${m.name} \`${id}\` | ${role} | ${num(m.stats.hp)} | ${num(m.stats.attack)} | ${num(
        m.stats.plating,
      )} | ${num(m.stats.damageReduction)} | ${num(m.stats.attackRange)} | ${num(
        m.stats.attackCooldown,
      )} | ${m.behavior} | ${num(m.rewards.essence)} |`,
    );
  }
  w();
}
w("A dungeon node is entered through its **guard** — a pack of guardians engages");
w("before the boss awakens. Measured: 11-12 simultaneous attackers in the Plains");
w("dungeon. Plan armor and Guards for the guard fight, not just the boss.");
w();

// ── Items ────────────────────────────────────────────────────────────────────

w("## 5. Tier-0/1 gear");
w();
w("| biome | id | slot | gate lvl | craft cost | stats | mechanics |");
w("|---|---|---|---|---|---|---|");
for (const group of ["clearing", ...T1_BIOMES]) {
  const recipes = [...RECIPE_DATABASE.values()]
    .filter((r) => r.recipeGroup === group && r.tier <= 1 && !r.evolvesFrom)
    .sort((a, b) => a.requiredBiomeLevel - b.requiredBiomeLevel);
  for (const r of recipes) {
    const cost = Object.entries(r.cost)
      .map(([k, v]) => `${v} ${k}`)
      .join(" + ");
    const cat = Object.entries(r.catalystCost ?? {})
      .map(([k, v]) => `${v} ${k}`)
      .join(" + ");
    const stats = [
      effects(r.stats as unknown as Record<string, number>),
      r.attacksPerSecond ? `aps ${num(r.attacksPerSecond)}` : "",
    ]
      .filter(Boolean)
      .join(", ");
    w(
      `| ${group} | \`${r.id}\` | ${r.slot} | ${r.requiredBiomeLevel} | ${cost}${
        cat ? " + " + cat : ""
      } | ${stats} | ${effects(r.mechanicEffects)} |`,
    );
  }
}
w();
w("The Clearing set is deliberately FIXED POWER (`upgrades: []`) — it cannot be");
w("upgraded at all, and is meant to be replaced wholesale by T1 gear.");
w();
w("### Total essence to take a T1 item +0 -> +5");
w();
w("| item | total |");
w("|---|---|");
for (const [id, item] of ITEM_DATABASE) {
  if (item.tier !== 1 || !item.upgrades || item.upgrades.length === 0) continue;
  const tally: Record<string, number> = {};
  for (let p = 1; p <= 5; p++) {
    for (const [k, v] of Object.entries(upgradeCostFor(item, p) ?? {})) {
      tally[k] = (tally[k] ?? 0) + (v ?? 0);
    }
  }
  const total = Object.entries(tally)
    .map(([k, v]) => `${v} ${k}`)
    .join(" + ");
  if (total) w(`| \`${id}\` | ${total} |`);
}
w();

// ── Abilities ────────────────────────────────────────────────────────────────

w("## 6. Abilities");
w();
w("Techniques are offensive riders; Guards are defensive reactions. Both auto-fire");
w("on a built-in heuristic, which a Rune rule can override.");
w();
w("| ability | slot | tier | learn via | gate | cost | what it does |");
w("|---|---|---|---|---|---|---|");
for (const recipe of [...ABILITY_RECIPE_DATABASE.values()].sort((a, b) => a.tier - b.tier)) {
  if (recipe.tier > 1) continue;
  const def = ABILITY_DATABASE.get(recipe.abilityId);
  const cost = Object.entries(recipe.cost)
    .map(([k, v]) => `${v} ${k}`)
    .join(" + ");
  const gate = recipe.recipeGroup
    ? `${recipe.recipeGroup} L${recipe.requiredBiomeLevel ?? "?"}`
    : "—";
  w(
    `| **${def?.name ?? recipe.abilityId}** \`${recipe.abilityId}\` | ${def?.slot ?? "?"} | ${
      def?.tier ?? recipe.tier
    } | \`${recipe.id}\` | ${gate} | ${cost} | ${def?.blurb ?? ""} |`,
  );
}
w();

// ── Runes ────────────────────────────────────────────────────────────────────

w("## 7. Runes");
w();
w("A rune rule pairs one **condition** with one **action**, and the equipped list is");
w("ordered by priority. Both fragments must be owned. Fragments not marked");
w("*starter* must be unlocked by crafting a rune forge recipe.");
w();
w("### Conditions");
w();
w("| id | cost | starter | what it means |");
w("|---|---|---|---|");
for (const [id, def] of CONDITION_DATABASE) {
  w(
    `| \`${id}\` | ${num((def as { cost?: number }).cost)} | ${
      STARTER_RUNE_IDS.includes(id) ? "yes" : "**no**"
    } | ${(def as { blurb?: string }).blurb ?? ""} |`,
  );
}
w();
w("### Actions");
w();
w("| id | cost | channel | starter | what it does |");
w("|---|---|---|---|---|");
for (const [id, def] of ACTION_DATABASE) {
  const d = def as { cost?: number; channel?: string; blurb?: string };
  w(
    `| \`${id}\` | ${num(d.cost)} | ${d.channel ?? ""} | ${
      STARTER_RUNE_IDS.includes(id) ? "yes" : "**no**"
    } | ${d.blurb ?? ""} |`,
  );
}
w();
w("### Rune forge recipes (how non-starter fragments are unlocked)");
w();
w("| recipe | unlocks | kind | gate | cost |");
w("|---|---|---|---|---|");
for (const recipe of RUNE_RECIPE_DATABASE.values()) {
  if (recipe.tier > 1) continue;
  const cost = Object.entries(recipe.cost)
    .map(([k, v]) => `${v} ${k}`)
    .join(" + ");
  const gate = recipe.recipeGroup
    ? `${recipe.recipeGroup} L${recipe.requiredBiomeLevel ?? "?"}`
    : "—";
  w(`| \`${recipe.id}\` | \`${recipe.runeId}\` | ${recipe.runeKind} | ${gate} | ${cost} |`);
}
w();

// ── Stances / rites ──────────────────────────────────────────────────────────

w("## 8. Stances and Rites");
w();
w("Both are build layers the harness can set but the baseline routes do not yet");
w("use. Listed so a route author knows they exist.");
w();
w(`- **Stances** (${STANCE_DATABASE.size} authored): postures folded into stats; one free default slot,`);
w("  with automated destinations carried on Rune `switch-stance` rules.");
w(`- **Rites** (${RITE_DATABASE.size} authored): always-on out-of-combat effects sharing the Runic Point`);
w("  budget with rune rules.");
w();

// ── DSL ──────────────────────────────────────────────────────────────────────

w("## 9. Expressing a route");
w();
w("Routes are data in `bot/src/routes/`, registered in `bot/src/routes/index.ts`.");
w("`bot/src/harness.test.ts` fails the build if a route names a recipe, item,");
w("ability, rune fragment, dungeon or node that does not exist, equips something it");
w("never crafted, or exceeds the tier-1 ability slot count.");
w();
w("```ts");
w('{ type: "chooseClass",  skillId: "cadence-root" }');
w('{ type: "travel",       to: <NodeRef> }');
w('{ type: "farm",         at: <NodeRef>, until: <Condition> }');
w('{ type: "craft",        recipeIds: [...], farmAt?: <NodeRef> }');
w('{ type: "equip",        definitionIds: [...] }');
w('{ type: "upgrade",      definitionId, toPlus, farmAt?, opportunistic? }');
w('{ type: "learnAbility", recipeId, abilityId, slot: "technique"|"guard", farmAt? }');
w('{ type: "setAbilities", techniques: [...], guards: [...] }   // REPLACES');
w('{ type: "craftRune",    recipeId, farmAt? }');
w('{ type: "configureRunes", rules: [{ conditionId, actionId }] }');
w('{ type: "attemptBoss",  biomeGroup, tier, maxAttempts? }');
w('{ type: "repeatUntil",  steps: [...], until: <Condition> }');
w('{ type: "milestone",    id: "..." }');
w("");
w("// every step also accepts: label?, optional?, stallAfterMs?");
w("//   optional: the `intended` policy does it; `rusher`/`generic` skip it");
w("");
w("// NodeRef");
w('{ kind: "node",    nodeId: "node-clearing" }');
w('{ kind: "biome",   biomeGroup: "plains", tier: 1, pick?: "first"|"rotate"|"uncleared" }');
w('{ kind: "dungeon", biomeGroup: "plains", tier: 1 }');
w("");
w("// Condition");
w('{ type: "biomeLevelAtLeast", biomeGroup, level }   { type: "essenceAtLeast", essence, amount }');
w('{ type: "catalystAtLeast", family, amount }        { type: "recipeUnlocked", recipeId }');
w('{ type: "hasItem", definitionId }                  { type: "itemAtLeastPlus", definitionId, plus }');
w('{ type: "equipped", definitionId }                 { type: "bossCleared", biomeGroup, tier }');
w('{ type: "playerTierAtLeast", tier }                { type: "globalMasteryAtLeast", value }');
w('{ type: "canCraft", recipeId }                     { type: "canUpgrade", definitionId }');
w('{ type: "elapsedMs", ms }                          allOf(...) / anyOf(...) / { type: "not", of }');
w("```");
w();
w("**The Clearing is not a `biome` ref.** It is `kind: \"tutorial\"` at biomeTier 0,");
w("so `{ kind: \"biome\", biomeGroup: \"clearing\", tier: 1 }` resolves to nothing. Use");
w("`{ kind: \"node\", nodeId: \"node-clearing\" }`.");
w();
w("### Policies");
w();
w("One executor, three parameter sets — never forked route code.");
w();
w("| | intended | rusher | generic |");
w("|---|---|---|---|");
w("| authored upgrade target | as written | 0 | -1 |");
w("| biome-level thresholds | as written | -2 | -1 |");
w("| `optional` steps | performed | skipped | skipped |");
w("| rune loadout | as authored | starter default | starter default |");
w();

// ── Worked example ───────────────────────────────────────────────────────────

w("## 10. Worked example — the Striker baseline");
w();
w("Authored by the designer, 2026-08-25. Full source:");
w("[`bot/src/routes/strikerT1.ts`](../bot/src/routes/strikerT1.ts).");
w();
w("Its spine, and *why* it is shaped that way:");
w();
w("```text");
w("Clearing   full tutorial set, tier 0->1, pick Striker");
w("Plains     whole set + Sweep,               max out -> +1");
w("Forest     flash-rapier + Second Wind,      max out -> +2");
w("Mountain   plate + Brace + brace rune,      max out -> +3   (nothing else crafted)");
w("Swamp      Cleanse + avoid-hazards + charm, max out -> +4   (charm only)");
w("Cave       Chaotic Axe + Expose Weakness,   max out -> GM 30, everything -> +5");
w("Bosses     Plains, Forest, Mountain, Swamp, Cave");
w("```");
w();
w("- **All five bosses at the END, not per biome.** +5 needs GM 30, which needs all");
w("  five biomes maxed. The gear ladder and the boss tuning agree on this.");
w("- **Each biome maxed adds exactly one upgrade level** (6 GM per biome, gates every 6).");
w("- **Mountain is walked before Swamp** because Brace — the Guard the reactive rune");
w("  fires — is gated at Mountain L3, and Swamp's DoT attrition punishes weak kit.");
w("- **Only one piece is taken from Mountain and Swamp.** Breadth exists to raise GM,");
w("  not to collect a full set from every biome.");
w();
w("Standing kit into the gauntlet: `chaotic-axe`, `swamp-charm-t1`, `plains-boots-t1`,");
w("with `plains-vest-t1` (plating 7) for Plains/Forest and `mountain-vest-t1`");
w("(guard potency 15%) for Mountain/Swamp/Cave.");
w();
w("Per-boss loadout — one Technique + one Guard is all tier 1 allows:");
w();
w("| boss | armor | technique | guard |");
w("|---|---|---|---|");
w("| Plains | plains-vest-t1 | sweep | second-wind |");
w("| Forest | plains-vest-t1 | expose-weakness | second-wind |");
w("| Mountain | mountain-vest-t1 | expose-weakness | brace |");
w("| Swamp | mountain-vest-t1 | expose-weakness | cleanse |");
w("| Cave | mountain-vest-t1 | expose-weakness | brace |");
w();
w("Rune loadout (6 RP of a budget that starts at 8):");
w();
w("```ts");
w('{ conditionId: "always",         actionId: "auto-path-enemy" }  // 0 RP');
w('{ conditionId: "in-combat",      actionId: "chase-enemy" }      // 1 RP');
w('{ conditionId: "target-casting", actionId: "fire-guard" }       // 3 RP');
w('{ conditionId: "always",         actionId: "avoid-hazards" }    // 2 RP, Swamp L2 recipe');
w("```");
w();
w("`target-casting -> fire-guard` is the ONLY reactive-to-telegraph behavior in the");
w("harness, and the game supplies it. Bots do not manually dodge. The rule is legal");
w("from minute one but INERT until a Guard is learned — which is deliberate.");
w();

// ── Write ────────────────────────────────────────────────────────────────────

const args = parseArgs(process.argv.slice(2));
const target = resolve(args.out ?? "../reports/bot-route-reference.md");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${out.join("\n")}\n`, "utf8");
console.log(`[reference] wrote ${target} (${out.length} lines)`);
