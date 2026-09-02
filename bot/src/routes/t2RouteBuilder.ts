import { RECIPE_DATABASE, SKILL_TREE } from "@mmo-idle/shared";
import type { TierEntryProfile } from "@mmo-idle/shared";
import type { Condition, Route, RouteStep } from "../route/types";
import {
  T2_PROGRESSION_ORDER,
  maxOutT2,
  soleCatalystFamily,
  t2,
  t2FarmFor,
  t2Runes,
  type T2BiomeGroup,
} from "./t2Common";
import { T2_CLASS_PLANS, type T2ClassPlan } from "./t2GearPlans";
import { obtainSteps, planAcquisition, type AcquisitionPlan } from "./t2Acquisition";
import { t2EntryProfileId, TIER_ENTRY_PROFILES } from "../tierEntry/profiles";

/**
 * The Tier-2 branch axis.
 *
 * ── When the branch is actually bought, and why it is not at entry ──────────
 *
 * A skill point is minted by a TIER advance and by nothing else (`advanceTier`,
 * server/src/systems/player/progression/questSystem.ts), and `canUnlockSkill`
 * requires `node.tier === currentSkillTier`. The two rules together mean the
 * skill-tree tier a character can afford is always `playerTier - 1`:
 *
 *   playerTier 1 (tier-0 kill quest)  -> buys the tier-0 class ROOT
 *   playerTier 2 (2 Tier-1 seals)     -> buys the tier-1 FRAME
 *   playerTier 3 (3 Tier-2 seals)     -> buys the tier-2 RANGE node
 *
 * So a character does NOT enter Tier 2 with a branch, and cannot buy one until
 * it has felled three Tier-2 bosses. `server/bench/balance/progression.ts` agrees
 * (`maxSkillTreeTierForContent = contentTier - 1`); the design docs' "T2 snapshot
 * = root + frame + range" does not, and the code wins.
 *
 * The consequence for this campaign is structural, not cosmetic:
 *
 *   - There are SIX legal Tier-2 entry templates, not eighteen.
 *   - The first three legs of the control route (Plains, Forest, Swamp) are
 *     byte-identical across a class's three branch variants. That is a feature:
 *     it is a genuine shared control period.
 *   - The branch differentiates only the BACK HALF (Mountain, Cave, Jungle,
 *     Desert) -- which is the half the designer expects builds to wall in, so it
 *     is the half where the branch matters most anyway.
 *   - A run that never clears three Tier-2 bosses never buys its branch. The
 *     `ifPossible` wrapper turns that into a recorded skip instead of a stall,
 *     so the run still reports WHERE it was walled.
 */
export const T2_BRANCHES = ["close", "mid", "far"] as const;
export type T2Branch = (typeof T2_BRANCHES)[number];

/** The class-prefixed range skill id. Bare `range-close` is not a real node. */
export function rangeSkillId(classRoot: string, branch: T2Branch): string {
  const prefix = classRoot.replace(/-root$/, "");
  const id = `${prefix}-range-${branch}`;
  if (!SKILL_TREE.has(id)) throw new Error(`no such range node "${id}"`);
  return id;
}

/**
 * Seals needed to leave Tier 2, and therefore the number of Tier-2 bosses that
 * must fall before the branch step can fire. Read from shared data rather than
 * restated, so a retune of `SEALS_REQUIRED_BY_TIER` moves this with it.
 */
function branchStep(classRoot: string, branch: T2Branch): RouteStep {
  const skillId = rangeSkillId(classRoot, branch);
  return {
    type: "ifPossible",
    when: { type: "playerTierAtLeast", tier: 3 },
    steps: [{ type: "unlockSkill", skillId, label: `spend the T3 point on ${skillId}` }],
    label: `branch: ${skillId} (only if three Tier-2 seals were earned)`,
  };
}

function biomeLegSteps(
  plan: T2ClassPlan,
  group: T2BiomeGroup,
  profile: TierEntryProfile,
  adopted: string[],
): RouteStep[] {
  const biomePlan = plan.biomes[group];
  if (!biomePlan) return [];
  const steps: RouteStep[] = [];

  for (const recipeId of biomePlan.adopt ?? []) {
    const acquisition = planAcquisition(profile, recipeId);
    steps.push(...obtainSteps(group, acquisition));
    // Only wear it if the game could actually hand it over. An unreachable item
    // must not produce an `equip` step -- that would stall the run on a piece the
    // template can never own, and hide the real finding behind a timeout.
    if (acquisition.path !== "unreachable") {
      steps.push({ type: "equip", definitionIds: [recipeId] });
      adopted.push(recipeId);
    }
  }
  for (const recipeId of biomePlan.craftOnly ?? []) {
    steps.push(...obtainSteps(group, planAcquisition(profile, recipeId)));
  }

  if (biomePlan.learn) {
    steps.push({
      type: "learnAbility",
      recipeId: biomePlan.learn.recipeId,
      abilityId: biomePlan.learn.abilityId,
      slot: biomePlan.learn.slot,
      farmAt: t2(group),
      label: `learn ${biomePlan.learn.abilityId} (replaces the single ${biomePlan.learn.slot} slot)`,
    });
  }

  // A skip is authored as a telemetry milestone rather than as nothing at all.
  // "0/18 adoption" and "nobody could afford it" are different findings, and
  // only a recorded intent can tell them apart.
  for (const recipeId of Object.keys(biomePlan.skip ?? {})) {
    steps.push({ type: "milestone", id: `skip:${recipeId}`, label: `deliberately skip ${recipeId}` });
  }

  return steps;
}

/**
 * Upgrade what the Global Mastery ceiling currently allows, and move on.
 *
 * Always `opportunistic`. The Tier-2 ceiling is +0 until Global Mastery 42 and
 * only reaches +5 at GM 72 (every one of the seven biomes at its cap), so a
 * fixed `toPlus` target would park the bot in a biome waiting for headroom that
 * only arrives by farming a DIFFERENT one. A real player upgrades what it can
 * afford and keeps going.
 */
function opportunisticUpgrades(worn: readonly string[], group: T2BiomeGroup): RouteStep[] {
  return worn.map((definitionId) => {
    // Deep upgrade steps cost catalysts too (the ruinous-axe +4/+5 steps want 1
    // and 2 swarming), so the same modifier rule applies to the upgrade farm as
    // to the acquisition farm.
    const item = RECIPE_DATABASE.get(definitionId);
    const family = soleCatalystFamily(
      ...(item?.upgrades ?? []).map((step) => step.catalystCost),
    );
    return {
      type: "upgrade" as const,
      definitionId,
      toPlus: 5,
      farmAt: t2FarmFor(group, family),
      opportunistic: true,
      label: `upgrade ${definitionId} as far as Global Mastery allows`,
    };
  });
}

export interface T2RouteConfig {
  plan: T2ClassPlan;
  branch: T2Branch;
  version: string;
}

export function makeT2Route(config: T2RouteConfig): Route {
  const { plan, branch } = config;
  // The class's own Tier-2 entry template decides how each Tier-2 item can be
  // obtained (see t2Acquisition.ts). `clean` and `natural` differ only in the
  // wallet, so either resolves the same acquisition paths.
  const profile = TIER_ENTRY_PROFILES.get(t2EntryProfileId(plan.classRoot, "clean"))!;
  const steps: RouteStep[] = [];
  // Everything the class is currently wearing, so upgrade steps target the live
  // kit rather than a guess. Seeded empty: the Tier-1 kit arrives with the
  // template and is upgraded no further (its ceiling is already +5 at GM 30).
  const worn: string[] = [];

  steps.push(
    {
      type: "configureRunes",
      rules: t2Runes(plan.movementProfile, plan.guard === "brace"),
      label: `carry the Tier-1 endgame ${plan.movementProfile} Rune profile into Tier 2`,
    },
    {
      type: "setAbilities",
      techniques: [plan.technique],
      guards: [plan.guard],
      label: `carry the Tier-1 endgame ability pair into Tier 2`,
    },
    { type: "milestone", id: "t2-entry" },
  );

  let bossesAttempted = 0;
  for (const group of T2_PROGRESSION_ORDER) {
    steps.push({ type: "travel", to: t2(group) });
    const adopted: string[] = [];
    steps.push(...biomeLegSteps(plan, group, profile, adopted));
    for (const id of adopted) if (!worn.includes(id)) worn.push(id);
    steps.push(maxOutT2(group));
    steps.push({ type: "milestone", id: `${group}-t2-maxed` });
    steps.push(...opportunisticUpgrades(worn, group));
    steps.push({ type: "attemptBoss", biomeGroup: group, tier: 2, maxAttempts: 4 });
    steps.push({ type: "milestone", id: `${group}-t2-boss-attempted` });
    bossesAttempted += 1;
    // Three seals is the Tier-2 advancement requirement, so the earliest the
    // branch can possibly be affordable is right after the third boss step.
    if (bossesAttempted === 3) steps.push(branchStep(plan.classRoot, branch));
  }

  return {
    id: `${plan.slug}-t2-${branch}`,
    version: config.version,
    classRoot: plan.classRoot,
    frameId: plan.frameId,
    startsFromTierEntry: 2,
    description:
      `Tier-2 control route, ${plan.slug} / ${branch} branch. Common biome order ` +
      `(${T2_PROGRESSION_ORDER.join(" -> ")}) held constant; the range node is the ` +
      `only variable across this class's three variants. Hypothesis: ${plan.hypothesis}`,
    steps,
    // Completion is the TIER, not the map: three Tier-2 seals is what the game
    // asks for. Maxing all seven biomes is the route's own work, not the gate.
    completion: { type: "playerTierAtLeast", tier: 3 },
    milestones: [
      { id: "t2-first-seal", when: anyT2BossCleared() },
      { id: "t2-third-seal-tier-3", when: { type: "playerTierAtLeast", tier: 3 } },
      { id: "gm-42-first-t2-upgrade", when: { type: "globalMasteryAtLeast", value: 42 } },
      { id: "gm-48", when: { type: "globalMasteryAtLeast", value: 48 } },
      { id: "gm-60", when: { type: "globalMasteryAtLeast", value: 60 } },
      { id: "gm-72-all-t2-maxed", when: { type: "globalMasteryAtLeast", value: 72 } },
      ...T2_PROGRESSION_ORDER.map((group) => ({
        id: `${group}-t2-boss-cleared`,
        when: { type: "bossCleared" as const, biomeGroup: group, tier: 2 },
      })),
    ],
  };
}

/** "At least one Tier-2 boss is down", in the route condition vocabulary. */
function anyT2BossCleared(): Condition {
  return {
    type: "anyOf",
    of: T2_PROGRESSION_ORDER.map((group) => ({
      type: "bossCleared" as const,
      biomeGroup: group,
      tier: 2,
    })),
  };
}

/** All 6 classes x 3 branches. */
export const T2_ROUTES: readonly Route[] = T2_CLASS_PLANS.flatMap((plan) =>
  T2_BRANCHES.map((branch) => makeT2Route({ plan, branch, version: "1.0.0" })),
);

/** The six-run control cohort: one branch per class, held at `mid`. */
export const T2_CONTROL_ROUTE_IDS: readonly string[] = T2_CLASS_PLANS.map(
  (plan) => `${plan.slug}-t2-mid`,
);

export const T2_ROUTE_IDS: readonly string[] = T2_ROUTES.map((r) => r.id);
