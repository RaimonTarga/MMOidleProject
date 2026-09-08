import {
  RECIPE_DATABASE,
  SKILL_TREE,
  STANCE_RECIPE_DATABASE,
  maxGlobalMasteryAtTier,
} from "@mmo-idle/shared";
import type { TierCheckpointKind, TierEntryProfile } from "@mmo-idle/shared";
import type { Condition, Route, RouteStep } from "../route/types";
import {
  T2_PROGRESSION_ORDER,
  soleCatalystFamily,
  t2,
  t2FarmFor,
  t2Runes,
  t2MaxLevel,
  type T2BiomeGroup,
} from "./t2Common";
import {
  CONDUIT_HAMMER_PROBE_PLAN,
  T2_CLASS_PLANS,
  type T2ClassPlan,
} from "./t2GearPlans";
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

  // A skip is authored as a telemetry milestone rather than as nothing at all.
  // "0/18 adoption" and "nobody could afford it" are different findings, and
  // only a recorded intent can tell them apart.
  for (const recipeId of Object.keys(biomePlan.skip ?? {})) {
    steps.push({ type: "milestone", id: `skip:${recipeId}`, label: `deliberately skip ${recipeId}` });
  }

  return steps;
}

function learnAbilitySteps(group: T2BiomeGroup, plan: T2ClassPlan): RouteStep[] {
  const learn = plan.biomes[group]?.learn;
  if (!learn) return [];
  return [
    {
      type: "learnAbility",
      recipeId: learn.recipeId,
      abilityId: learn.abilityId,
      slot: learn.slot,
      farmAt: t2(group),
      label: `learn ${learn.abilityId} (replaces the single ${learn.slot} slot)`,
    },
  ];
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
function farmAbilityKitSteps(
  group: T2BiomeGroup,
  plan: T2ClassPlan,
  useOverrides = true,
): RouteStep[] {
  const shape = BIOME_ENCOUNTER_SHAPE[group];
  const technique = useOverrides
    ? plan.techniqueOverrides?.[group] ?? techniqueFor(shape)
    : techniqueFor(shape);
  const guard = useOverrides ? plan.guardOverrides?.[group] ?? guardFor(group) : guardFor(group);
  const stance = useOverrides && Object.prototype.hasOwnProperty.call(plan.stanceOverrides ?? {}, group)
    ? plan.stanceOverrides?.[group] ?? null
    : farmStanceFor(group);
  return [
    {
      type: "setAbilities",
      techniques: [technique],
      guards: [guard],
      label: `${group} farm kit: ${shape} (${technique} / ${guard})`,
    },
    {
      type: "setDefaultStance",
      stanceId: stance,
      label: stance ? `${shape} stance: ${stance}` : `no stance owned yet for the ${group} leg`,
    },
  ];
}

/**
 * Equip this leg's farm core.
 *
 * Separated from `farmAbilityKitSteps` because on the exact leg that CRAFTS
 * this core (Cave for core-tempered, Desert for core-force -- see
 * `farmCoreFor`/`CORE_CRAFT_LEG`), the core is not ownable yet until
 * `buildCoreAcquisitionSteps` has run, so this step must come after it; the
 * ability/stance kit has no such dependency and must come before it (see
 * `buildCoreAcquisitionSteps`'s own doc comment). Every other leg simply
 * re-equips a core it already owns from an earlier leg, so this ordering
 * costs nothing there.
 */
function farmCoreEquipSteps(group: T2BiomeGroup, plan: T2ClassPlan): RouteStep[] {
  const core = Object.prototype.hasOwnProperty.call(plan.farmCoreOverrides ?? {}, group)
    ? plan.farmCoreOverrides?.[group] ?? null
    : farmCoreFor(group);
  return core ? [{ type: "equip", definitionIds: [core], label: `farm core: ${core}` }] : [];
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

/**
 * Craft the stance whose craft leg is this one.
 *
 * Stance crafting never requires combat farming to unlock (unlike a core's
 * `recipeUnlocked` gate below), so it is safe to run before `farmLoadoutSteps`
 * sets this leg's ability kit -- there is nothing here that would be fought
 * under the wrong kit.
 */
function buildStanceAcquisitionSteps(group: T2BiomeGroup): RouteStep[] {
  const steps: RouteStep[] = [];
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

/**
 * Craft the core whose craft leg is this one.
 *
 * Unlike a stance, a core's `recipeUnlocked` gate is farmed for in real
 * combat at this biome (`farm ... until recipeUnlocked`), so it MUST run
 * after `farmLoadoutSteps` has already set this leg's own ability/stance kit
 * -- otherwise that farm is fought under the previous leg's leftover kit,
 * which is silent everywhere except Jungle (the one crowd biome that also
 * gates a core), where it meant every class ground out its Jungle
 * level-0-to-6 climb under Swamp/Mountain/Cave's single-target
 * expose-weakness instead of Jungle's own sweep. See
 * docs/briefs/t2-overnight-experiment-2026-09-07.md Finding A.
 */
function buildCoreAcquisitionSteps(group: T2BiomeGroup, skipCoreIds: readonly string[] = []): RouteStep[] {
  const steps: RouteStep[] = [];
  for (const [coreId, leg] of Object.entries(CORE_CRAFT_LEG)) {
    if (leg !== group || skipCoreIds.includes(coreId)) continue;
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
  return steps;
}

export interface T2TreatmentAssertion {
  condition: Condition;
  message?: string;
}

export interface T2RouteConfig {
  plan: T2ClassPlan;
  branch: T2Branch;
  version: string;
  /** Explicit id for an exploratory arm; control ids keep their historical form. */
  routeId?: string;
  /**
   * Drop every boss interaction from the route: no `attemptBoss`, no boss
   * loadout swap, no branch step -- and complete on BIOME MASTERY instead of on
   * seals. See `makeT2ProgressionRoute` for why this arm exists.
   */
  bossless?: boolean;
  /** Start after this biome, retaining the same route policies for the tail. */
  startAfter?: T2BiomeGroup;
  /** Stop after this biome instead of running the full progression order. */
  stopAfter?: T2BiomeGroup;
  /** Capture a named intermediate state at the route completion boundary. */
  checkpointKind?: TierCheckpointKind;
  /** Require a matching sealed checkpoint kind when this route consumes an entry. */
  entryCheckpointKind?: TierCheckpointKind;
  /** Keep transit movement-only while preparing a pre-progression checkpoint. */
  suppressTransitCombat?: boolean;
  /** Override the normal cap for a checkpoint such as Jungle level 5 (J3). */
  checkpointLevel?: number;
  /** Equip a known item before the first farm in a tail route. */
  initialEquip?: readonly string[];
  /** Assertions evaluated after the entry profile is live. */
  entryAssertions?: readonly T2TreatmentAssertion[];
  /** Assertions evaluated after the first leg's treatment is fully applied. */
  treatmentAssertions?: readonly T2TreatmentAssertion[];
  /** Assertions evaluated after the terminal leg's treatment is fully applied. */
  terminalAssertions?: readonly T2TreatmentAssertion[];
  /** Omit named core acquisitions from a focused tail route. */
  skipCoreIds?: readonly string[];
  /** Explicitly suppress Snapshot B on a partial/tail route. */
  captureTier2Handoff?: boolean;
  entryItems?: readonly string[];
  entryKnownAbilities?: readonly string[];
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
  const startIndex = config.startAfter
    ? T2_PROGRESSION_ORDER.indexOf(config.startAfter) + 1
    : 0;
  const stopIndex = config.stopAfter
    ? T2_PROGRESSION_ORDER.indexOf(config.stopAfter)
    : T2_PROGRESSION_ORDER.length - 1;
  if (startIndex < 0 || stopIndex < 0 || startIndex > stopIndex) {
    throw new Error(`invalid T2 route slice ${config.startAfter ?? "entry"} -> ${config.stopAfter ?? "end"}`);
  }
  const progressionOrder = T2_PROGRESSION_ORDER.slice(startIndex, stopIndex + 1);
  const terminalGroup = progressionOrder[progressionOrder.length - 1];
  if (!terminalGroup) throw new Error("T2 route has no biome legs");
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
  for (const assertion of config.entryAssertions ?? []) {
    steps.push({
      type: "assert",
      condition: assertion.condition,
      message: assertion.message,
      label: assertion.message ?? `assert entry treatment: ${assertion.condition.type}`,
    });
  }

  let bossesAttempted = 0;
  for (const group of progressionOrder) {
    steps.push({ type: "travel", to: t2(group) });
    // Brackets the leg for the per-biome response map: dwell time for `group` is
    // the span between this milestone and `${group}-t2-leg-complete`.
    steps.push({ type: "milestone", id: `${group}-t2-entered` });
    // Order matters here and each step earns its place:
    // 1. Stances never require combat farming to unlock, so crafting them
    //    first is free.
    // 2. This leg's own ability/stance kit must be set BEFORE the core-gate
    //    farm below, because that farm IS fought in combat -- setting the
    //    kit after it would fight this leg's unlock grind in the previous
    //    leg's stale kit (Finding A).
    // 3. The core craft's `recipeUnlocked` gate needs that correct kit, so it
    //    runs after step 2.
    // 4. Only THEN can this leg's farm core be equipped, because on the leg
    //    that crafts it (Cave/Desert), it does not exist until step 3 ran.
    if (group === progressionOrder[0] && config.initialEquip && config.initialEquip.length > 0) {
      steps.push({ type: "equip", definitionIds: [...config.initialEquip], label: "equip declared treatment weapon" });
    }
    steps.push(...buildStanceAcquisitionSteps(group));
    const learnsAbility = plan.biomes[group]?.learn !== undefined;
    // A newly learned Technique/Guard cannot be slotted before its own craft.
    // Start the leg with the ordinary encounter kit, learn the optional ability
    // at its live biome gate, then re-emit the final policy before any core gate
    // farm. This keeps both ability ownership and Jungle's ordering invariant.
    steps.push(...farmAbilityKitSteps(group, plan, !learnsAbility));
    if (learnsAbility) {
      steps.push(...learnAbilitySteps(group, plan));
      steps.push(...farmAbilityKitSteps(group, plan));
    }
    steps.push(...buildCoreAcquisitionSteps(group, config.skipCoreIds));
    steps.push(...farmCoreEquipSteps(group, plan));
    const adopted: string[] = [];
    steps.push(...biomeLegSteps(plan, group, profile, adopted));
    for (const id of adopted) if (!worn.includes(id)) worn.push(id);
    if (group === progressionOrder[0]) {
      for (const assertion of config.treatmentAssertions ?? []) {
        steps.push({
          type: "assert",
          condition: assertion.condition,
          message: assertion.message,
          label: assertion.message ?? `assert live treatment: ${assertion.condition.type}`,
        });
      }
    }
    if (group === terminalGroup) {
      for (const assertion of config.terminalAssertions ?? []) {
        steps.push({
          type: "assert",
          condition: assertion.condition,
          message: assertion.message,
          label: assertion.message ?? `assert terminal treatment: ${assertion.condition.type}`,
        });
      }
      if (config.checkpointKind) {
        steps.push({
          type: "milestone",
          id: `checkpoint:${config.checkpointKind}`,
          label: `capture ${config.checkpointKind} checkpoint after terminal assertions`,
        });
      }
    }
    const maxLevel = config.checkpointKind && group === terminalGroup && config.checkpointLevel !== undefined
      ? config.checkpointLevel
      : t2MaxLevel(group);
    steps.push({
      type: "farm",
      at: t2(group),
      until: { type: "biomeLevelAtLeast", biomeGroup: group, level: maxLevel },
      label: `farm ${group} T2 to level ${maxLevel}`,
    });
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

  const checkpointMilestone = config.checkpointKind
    ? [{
        id: `checkpoint:${config.checkpointKind}`,
        when: { type: "biomeLevelAtLeast" as const, biomeGroup: terminalGroup, level: config.checkpointLevel ?? t2MaxLevel(terminalGroup) },
      }]
    : [];
  const slicedCompletion = config.checkpointKind || config.startAfter || config.stopAfter
    ? { type: "biomeLevelAtLeast" as const, biomeGroup: terminalGroup, level: config.checkpointLevel ?? t2MaxLevel(terminalGroup) }
    : undefined;

  if (bossless) {
    return {
      id: config.routeId ?? `${plan.slug}-t2-progression`,
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
      completion: slicedCompletion ?? {
        type: "globalMasteryAtLeast",
        value: T2_BOSSLESS_MASTERY_TARGET,
      },
      milestones: [...masteryMilestones, ...checkpointMilestone],
      checkpointKind: config.checkpointKind,
      entryCheckpointKind: config.entryCheckpointKind,
      suppressTransitCombat: config.suppressTransitCombat,
      captureTier2Handoff: config.captureTier2Handoff ?? (!config.startAfter && !config.stopAfter && !config.checkpointKind),
      entryItems: config.entryItems,
      entryKnownAbilities: config.entryKnownAbilities,
    };
  }

  return {
    id: config.routeId ?? `${plan.slug}-t2-${branch}`,
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
    entryCheckpointKind: config.entryCheckpointKind,
    suppressTransitCombat: config.suppressTransitCombat,
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

/**
 * Bossless PROBE arms: one variable each, read only against their own baseline.
 *
 * Kept out of `T2_PROGRESSION_ROUTES` deliberately. That export is the six-class
 * comparative cohort, and the cross-class interpretation rules ("degraded for 4
 * of 6 classes") are only meaningful over exactly one route per class. A probe
 * is a within-class A/B and would corrupt those counts if pooled.
 */
export const T2_PROBE_ROUTES: readonly Route[] = [
  makeT2Route({
    plan: CONDUIT_HAMMER_PROBE_PLAN,
    branch: "mid",
    version: "1.0.0",
    bossless: true,
  }),
];

export const T2_PROBE_ROUTE_IDS: readonly string[] = T2_PROBE_ROUTES.map((r) => r.id);
