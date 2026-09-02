import {
  NODE_BIOMES,
  SKILL_TREE,
  globalMastery,
  runeBudgetForGlobalMastery,
  runeIdsFromCraftedRecipes,
  sanitizeRuneLoadout,
} from "@mmo-idle/shared";
import { ENTRY_ECONOMY_MODES, TIER_ENTRY_PROFILES } from "./profiles";
import { T1_BASELINE_ROUTES } from "../routes";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

const archetypeByRoot: Record<string, "cadence" | "cooldown" | "reload" | "energy" | "dot" | "summoner"> = {
  "cadence-root": "cadence",
  "cooldown-root": "cooldown",
  "reload-root": "reload",
  "energy-root": "energy",
  "dot-root": "dot",
  "summoner-root": "summoner",
};
for (const profile of TIER_ENTRY_PROFILES.values()) {
  const root = SKILL_TREE.get(profile.classRoot);
  const frame = SKILL_TREE.get(profile.frameId);
  assert(profile.targetTier === 2, `${profile.id}: targets T2`);
  assert(profile.spawnNodeId === "node-t2-sanctuary", `${profile.id}: spawns at T2 Sanctuary`);
  assert(NODE_BIOMES[profile.spawnNodeId]?.kind === "sanctuary", `${profile.id}: sanctuary is a live node`);
  assert(profile.economyPolicy === "synthetic-combat-progression", `${profile.id}: labels synthetic wallet policy`);
  assert(!!root && !!frame && frame.parent === root.id, `${profile.id}: frame belongs to root`);
  assert(profile.skillPoints === 0 && profile.currentSkillTier === 2, `${profile.id}: no unspent T2 point remains`);
  assert(globalMastery(profile.biomeLevels) === 30, `${profile.id}: all five T1 biome levels are complete`);
  assert(
    JSON.stringify(profile.bossesCleared.sort()) ===
      JSON.stringify(["cave:1", "forest:1", "mountain:1", "plains:1", "swamp:1"]),
    `${profile.id}: has exactly the five T1 boss clears`,
  );
  assert(profile.bossesCleared.every((id) => !id.endsWith(":2")), `${profile.id}: has no T2 boss clear`);
  assert(profile.knownStances.length === 0 && profile.knownRites.length === 0, `${profile.id}: no speculative stance/rite content`);
  const budget = runeBudgetForGlobalMastery(globalMastery(profile.biomeLevels));
  const sanitized = sanitizeRuneLoadout(
    profile.runesEquipped,
    new Set(runeIdsFromCraftedRecipes(profile.runeRecipesCrafted)),
    budget,
    archetypeByRoot[profile.classRoot],
    new Set(),
  );
  assert(sanitized.length === profile.runesEquipped.length, `${profile.id}: baseline Rune loadout fits RP and ownership`);
}
assert(
  TIER_ENTRY_PROFILES.size === T1_BASELINE_ROUTES.length * ENTRY_ECONOMY_MODES.length,
  "one profile per canonical T1 class baseline x entry-economy mode",
);
// The two economy modes are a control PAIR: they must differ in the wallet and
// in nothing else, or a clean-vs-natural comparison measures more than economy.
for (const route of T1_BASELINE_ROUTES) {
  const [clean, natural] = ENTRY_ECONOMY_MODES.map((mode) =>
    TIER_ENTRY_PROFILES.get(`${route.id}-t2-entry-${mode}`)!,
  );
  assert(!!clean && !!natural, `${route.id}: both economy variants exist`);
  assert(
    JSON.stringify({ ...clean, id: "", wallet: null }) ===
      JSON.stringify({ ...natural, id: "", wallet: null }),
    `${route.id}: clean and natural entry differ ONLY in the wallet`,
  );
  assert(
    Object.values(clean.wallet.essences).every((v) => v === 0),
    `${route.id}: clean entry carries no essence`,
  );
  assert(
    Object.values(natural.wallet.essences).some((v) => v > 0),
    `${route.id}: natural entry carries some essence`,
  );
}
console.log("profiles.test.ts: ok");
