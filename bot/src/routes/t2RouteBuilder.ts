import {
  RECIPE_DATABASE,
  SKILL_TREE,
  STANCE_RECIPE_DATABASE,
  maxGlobalMasteryAtTier,
} from "@mmo-idle/shared";
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
import {
  BIOME_ENCOUNTER_SHAPE,
  CORE_CRAFT_LEG,
  DEFENSIVE_STANCE,
  DEFENSIVE_STANCE_LEG,
  OFFENSIVE_STANCE,
  OFFENSIVE_STANCE_LEG,
  STANCE_RECIPES,
  bossCoreFor,
  bossStanceFor,
  farmCoreFor,
  farmStanceFor,
  guardFor,
  techniqueFor,
} from "./t2Loadouts";
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

/**
 * The encounter-shape kit for farming one biome: ability pair, default stance
 * and core, applied as one block at the top of the leg.
 *
 * Emitted even when a component is unchanged from the previous leg. The steps
 * are idempotent (`setAbilities` and `equip` both no-op when already correct)
 * and the redundancy buys something worth more than the saved tick: every leg's
 * telemetry states the loadout it ran under, so a reader of the artifact never
 * has to reconstruct it by scanning backwards.
 */
function farmLoadoutSteps(group: T2BiomeGroup): RouteStep[] {
  const shape = BIOME_ENCOUNTER_SHAPE[group];
  const stance = farmStanceFor(group);
  const core = farmCoreFor(group);
  const steps: RouteStep[] = [
    {
      type: "setAbilities",
      techniques: [techniqueFor(shape)],
      guards: [guardFor(group)],
      label: `${group} farm kit: ${shape} (${techniqueFor(shape)} / ${guardFor(group)})`,
    },
    {
      type: "setDefaultStance",
      stanceId: stance,
      label: stance ? `${shape} stance: ${stance}` : `no stance owned yet for the ${group} leg`,
    },
  ];
  if (core) steps.push({ type: "equip", definitionIds: [core], label: `farm core: ${core}` });
  return steps;
}

/**
 * The boss kit. A boss is a single-target encounter whatever biome it lives in,
 * so the crowd biomes drop Sweep here; the Guard still follows the biome, which
 * is what keeps Cleanse on the Swamp boss.
 */
function bossLoadoutSteps(group: T2BiomeGroup): RouteStep[] {
  const stance = bossStanceFor(group);
  const core = bossCoreFor(group);
  const steps: RouteStep[] = [
    {
      type: "setAbilities",
      techniques: [techniqueFor("single-target")],
      guards: [guardFor(group)],
      label: `${group} boss kit: single-target (expose-weakness / ${guardFor(group)})`,
    },
    {
      type: "setDefaultStance",
      stanceId: stance,
      label: stance ? `boss stance: ${stance}` : "no defensive stance owned yet",
    },
  ];
  if (core) steps.push({ type: "equip", definitionIds: [core], label: `boss core: ${core}` });
  return steps;
}

/** Craft the cores and stances whose craft leg is this one. */
function buildAcquisitionSteps(group: T2BiomeGroup): RouteStep[] {
  const steps: RouteStep[] = [];
  for (const [coreId, leg] of Object.entries(CORE_CRAFT_LEG)) {
    if (leg !== group) continue;
    const recipe = RECIPE_DATABASE.get(coreId)!;
    steps.push(
      {
        type: "farm",
        at: t2(group),
        until: { type: "recipeUnlocked", recipeId: coreId },
        label: `farm ${group} until ${coreId} unlocks`,
      },
      {
        type: "craft",
        recipeIds: [coreId],
        farmAt: t2FarmFor(group, soleCatalystFamily(recipe.catalystCost)),
      },
    );
  }
  for (const [stanceId, craftLeg] of [
    [OFFENSIVE_STANCE, OFFENSIVE_STANCE_LEG],
    [DEFENSIVE_STANCE, DEFENSIVE_STANCE_LEG],
  ] as const) {
    if (craftLeg !== group) continue;
    const recipeId = STANCE_RECIPES[stanceId];
    steps.push({
      type: "craftStance",
      recipeId,
      farmAt: t2FarmFor(group, soleCatalystFamily(STANCE_RECIPE_DATABASE.get(recipeId)?.catalystCost)),
      label: `learn ${stanceId}`,
    });
  }
  return steps;
}

export interface T2RouteConfig {
  plan: T2ClassPlan;
  branch: T2Branch;
  version: string;
  /**
   * Drop every boss interaction from the route: no `attemptBoss`, no boss
   * loadout swap, no branch step -- and complete on BIOME MASTERY instead of on
   * seals. See `makeT2ProgressionRoute` for why this arm exists.
   */
  bossless?: boolean;
}

/**
 * The bossless terminal condition: every one of the seven Tier-2 biomes at its
 * playerTier-2 cap.
 *
 * Read from `maxGlobalMasteryAtTier(2)` rather than restated, so a retune of any
 * biome's level band moves the finish line with it. Today it is 72 (five
 * carryover biomes at 12, plus Jungle and Desert at 6 -- they FIRST APPEAR at
 * Tier 2, so their own caps are half the others'). Entry is GM 30.
 *
 * It is also the threshold that governs the Tier-2 item upgrade ceiling: +0
 * until GM 42, +5 only at GM 72. So "mastered the tier" and "can finally reach
 * +5 on tier gear" are the same moment, which is what makes it the right place
 * to stop a progression run.
 */
export const T2_BOSSLESS_MASTERY_TARGET = maxGlobalMasteryAtTier(2);

export function makeT2Route(config: T2RouteConfig): Route {
  const { plan, branch } = config;
  const bossless = config.bossless === true;
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
    { type: "milestone", id: "t2-entry" },
  );

  let bossesAttempted = 0;
  for (const group of T2_PROGRESSION_ORDER) {
    steps.push({ type: "travel", to: t2(group) });
    // Brackets the leg for the per-biome response map: dwell time for `group` is
    // the span between this milestone and `${group}-t2-leg-complete`.
    steps.push({ type: "milestone", id: `${group}-t2-entered` });
    // Cores and stances first: they are cheap, they are worn for the whole leg,
    // and crafting them before the gear farm means the leg is fought in the kit
    // the leg is supposed to be measuring.
    steps.push(...buildAcquisitionSteps(group));
    steps.push(...farmLoadoutSteps(group));
    const adopted: string[] = [];
    steps.push(...biomeLegSteps(plan, group, profile, adopted));
    for (const id of adopted) if (!worn.includes(id)) worn.push(id);
    steps.push(maxOutT2(group));
    steps.push({ type: "milestone", id: `${group}-t2-maxed` });
    steps.push(...opportunisticUpgrades(worn, group));
    if (!bossless) {
      steps.push(...bossLoadoutSteps(group));
      steps.push({ type: "attemptBoss", biomeGroup: group, tier: 2, maxAttempts: 4 });
      steps.push({ type: "milestone", id: `${group}-t2-boss-attempted` });
      bossesAttempted += 1;
      // Three seals is the Tier-2 advancement requirement, so the earliest the
      // branch can possibly be affordable is right after the third boss step.
      if (bossesAttempted === 3) steps.push(branchStep(plan.classRoot, branch));
    }
    steps.push({ type: "milestone", id: `${group}-t2-leg-complete` });
  }

  const masteryMilestones = [
    { id: "gm-42-first-t2-upgrade", when: { type: "globalMasteryAtLeast" as const, value: 42 } },
    { id: "gm-48", when: { type: "globalMasteryAtLeast" as const, value: 48 } },
    { id: "gm-60", when: { type: "globalMasteryAtLeast" as const, value: 60 } },
    {
      id: `gm-${T2_BOSSLESS_MASTERY_TARGET}-all-t2-maxed`,
      when: { type: "globalMasteryAtLeast" as const, value: T2_BOSSLESS_MASTERY_TARGET },
    },
  ];

  if (bossless) {
    return {
      id: `${plan.slug}-t2-progression`,
      version: config.version,
      classRoot: plan.classRoot,
      frameId: plan.frameId,
      startsFromTierEntry: 2,
      description:
        `Tier-2 BOSSLESS progression route, ${plan.slug}. Common biome order ` +
        `(${T2_PROGRESSION_ORDER.join(" -> ")}) held constant. No boss is fought and ` +
        `no range branch is bought: Tier-2 boss balance is being reworked, so a boss ` +
        `outcome is not admissible evidence about biome tuning. Nothing inside Tier 2 ` +
        `gates on a boss clear (no recipe sets requiredBossClear, travel is ungated, ` +
        `and biomeLevelCap reads playerTier only), so this arm loses no content ` +
        `coverage -- only the branch, which is bought on the way OUT of the tier ` +
        `anyway. Hypothesis: ${plan.hypothesis}`,
      steps,
      // Completion is BIOME MASTERY, not the tier. Three seals can never
      // legitimately be earned by a route that fights no bosses, so keying
      // completion on playerTier 3 would report every run as `stalled`.
      completion: {
        type: "globalMasteryAtLeast",
        value: T2_BOSSLESS_MASTERY_TARGET,
      },
      milestones: masteryMilestones,
    };
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
      ...masteryMilestones,
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

/**
 * The bossless progression cohort: ONE route per class, no branch axis.
 *
 * There is no branch axis here because there is no branch: the range node is
 * bought with the point minted by reaching playerTier 3, which needs three
 * Tier-2 seals, which needs three Tier-2 boss kills. A bossless run never has
 * one, so all three variants of a class would be byte-identical.
 */
export const T2_PROGRESSION_ROUTES: readonly Route[] = T2_CLASS_PLANS.map((plan) =>
  makeT2Route({ plan, branch: "mid", version: "1.0.0", bossless: true }),
);

export const T2_PROGRESSION_ROUTE_IDS: readonly string[] = T2_PROGRESSION_ROUTES.map(
  (r) => r.id,
);
