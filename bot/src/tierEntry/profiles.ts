import type { DesiredBuild } from "../loadout/loadout";
import {
  LINEAGE_DATABASE,
  NODE_BIOMES,
  STANCE_RECIPE_DATABASE, RITE_RECIPE_DATABASE,
  RECIPE_DATABASE,
  biomeXpForBiomeLevel,
  emptyEquipment,
  emptyAttunedAbilities,
  type EquipmentMap,
  type LineageDefinition,
  type PacketId,
  type RowKind,
  type TierEntryProfile,
} from "@mmo-idle/shared";
import { T1_BASELINE_ROUTES } from "../routes/t1Baselines";
import type { Route, RouteStep } from "../route/types";
import { entryWallet, type EntryEconomyMode } from "./economy";

const T1_BIOMES = ["plains", "forest", "swamp", "mountain", "cave"] as const;

/** `biomeLevelCap(_, "clearing")` is a hard 4; the starter set needs all of it. */
const CLEARING_MAX_LEVEL = 4;

const FRAME_BY_ROOT: Record<string, string> = {
  "cadence-root": "cadence-balanced",
  "cooldown-root": "cooldown-heavy",
  "reload-root": "reload-heavy",
  "energy-root": "energy-heavy",
  "dot-root": "dot-balanced",
  "summoner-root": "summoner-balanced",
};

function allSteps(route: Route): RouteStep[] {
  const out: RouteStep[] = [];
  const visit = (steps: readonly RouteStep[]): void => {
    for (const step of steps) {
      out.push(step);
      if (step.type === "repeatUntil" || step.type === "ifPossible") visit(step.steps);
    }
  };
  visit(route.steps);
  return out;
}

function finalEquipment(steps: readonly RouteStep[]): EquipmentMap {
  const equipment = emptyEquipment();
  for (const step of steps) {
    if (step.type !== "equip") continue;
    for (const definitionId of step.definitionIds) {
      const recipe = RECIPE_DATABASE.get(definitionId);
      if (!recipe) continue;
      equipment[recipe.slot] = definitionId;
    }
  }
  return equipment;
}

function buildProfile(route: Route, economy: EntryEconomyMode): TierEntryProfile {
  const frameId = route.frameId ?? FRAME_BY_ROOT[route.classRoot];
  if (!frameId) throw new Error(`${route.id}: no tier-entry frame declaration`);

  const steps = allSteps(route);
  const craftedItems = new Set(
    steps.flatMap((step) => (step.type === "craft" ? step.recipeIds : [])),
  );
  const equipment = finalEquipment(steps);
  const equippedItems = new Set(Object.values(equipment).filter((id): id is string => !!id));
  const learnedAbilities = [
    ...new Set(
      steps
        .filter((step): step is Extract<RouteStep, { type: "learnAbility" }> => step.type === "learnAbility")
        .map((step) => step.abilityId),
    ),
  ];
  let build: DesiredBuild = { abilities: emptyAttunedAbilities(), runeRules: [], stances: { attuned: [], default: null }, rites: [] };
  const knownStances: string[] = [];
  const knownRites: string[] = [];
  for (const step of steps) {
    if (step.type === "configureBuild") build = structuredClone(step.build);
    if (step.type === "learnAbility" && step.attune !== false) build.abilities[step.slot === "guard" ? "guards" : "techniques"] = [step.abilityId];
    if (step.type === "setAbilities") build.abilities = { techniques: [...step.techniques], guards: [...step.guards] };
    if (step.type === "configureRunes") build.runeRules = structuredClone(step.rules);
    if (step.type === "setDefaultStance") {
      build.stances.default = step.stanceId;
      if (step.stanceId && !build.stances.attuned.includes(step.stanceId)) build.stances.attuned.push(step.stanceId);
    }
    if (step.type === "craftStance") {
      const recipe = STANCE_RECIPE_DATABASE.get(step.recipeId);
      if (recipe && !knownStances.includes(recipe.stanceId)) knownStances.push(recipe.stanceId);
    }
    if (step.type === "craftRite") {
      const recipe = RITE_RECIPE_DATABASE.get(step.recipeId);
      if (recipe && !knownRites.includes(recipe.riteId)) knownRites.push(recipe.riteId);
    }
  }
  const itemUpgrades: Record<string, number> = {};
  for (const step of steps) {
    if (step.type !== "upgrade") continue;
    itemUpgrades[step.definitionId] = Math.max(itemUpgrades[step.definitionId] ?? 0, step.toPlus);
  }

  const t1Nodes = Object.entries(NODE_BIOMES)
    .filter(([, info]) => T1_BIOMES.includes(info.biomeGroup as (typeof T1_BIOMES)[number]) && info.biomeTier === 1)
    .map(([id, info]) => ({ id, kind: info.kind }));

  const wallet = entryWallet(economy);

  return {
    id: `${route.id}-t2-entry-${economy}`,
    targetTier: 2,
    classRoot: route.classRoot,
    frameId,
    spawnNodeId: "node-t2-sanctuary",
    economyPolicy: "synthetic-combat-progression",
    wallet: {
      essences: { ...wallet.essences },
    },
    // The wallet is a labelled MODEL (see economy.ts); progression state below is
    // an explicit T1-complete manifest derived from the canonical route source.
    level: 0,
    // ZERO IS CORRECT, and it is the whole reason there are six T2-entry
    // templates rather than eighteen. Skill points are minted one per TIER
    // advance (`advanceTier` in questSystem.ts), and `canUnlockSkill` requires
    // `node.tier === currentSkillTier`, so the skill-tree tier a character can
    // afford is always `playerTier - 1`:
    //     playerTier 1 (tier-0 quest)  -> buys the tier-0 class ROOT
    //     playerTier 2 (2 T1 seals)    -> buys the tier-1 FRAME
    //     playerTier 3 (3 T2 seals)    -> buys the tier-2 RANGE node
    // A character standing at the START of Tier 2 has therefore already spent
    // its point on the frame and has NO branch, and no way to buy one until it
    // has cleared three T2 bosses. See `t3Entry.ts` for the branched checkpoint
    // and docs/t2-bot-testing-infrastructure.md for the full argument.
    skillPoints: 0,
    currentSkillTier: 2,
    // The Clearing is part of the manifest even though `globalMastery()` excludes
    // it: every canonical T1 route farms it to level 4 for the starter set (the
    // Soft Boots recipe gates at clearing 4), and a template that owns those four
    // items while declaring no Clearing mastery is describing a character whose
    // own gear was never craftable. It contributes 0 GM, so adding it changes no
    // rune budget and no upgrade ceiling -- only legality.
    biomeLevels: {
      ...Object.fromEntries(T1_BIOMES.map((group) => [group, 6])),
      clearing: CLEARING_MAX_LEVEL,
    },
    biomeXP: {
      ...Object.fromEntries(T1_BIOMES.map((group) => [group, biomeXpForBiomeLevel(group, 6)])),
      clearing: biomeXpForBiomeLevel("clearing", CLEARING_MAX_LEVEL),
    },
    bossesCleared: T1_BIOMES.map((group) => `${group}:1`),
    clearedNodes: t1Nodes.filter(({ kind }) => kind === "normal").map(({ id }) => id),
    visitedNodes: t1Nodes.map(({ id }) => id),
    questProgress: { "tier-0": 10, "tier-1": 1 },
    inventory: [...craftedItems].filter((id) => !equippedItems.has(id)),
    equipment,
    itemUpgrades,
    knownAbilities: learnedAbilities,
    attunedAbilities: build.abilities,
    runeRecipesCrafted: [
      ...new Set(
        steps
          .filter((step): step is Extract<RouteStep, { type: "craftRune" }> => step.type === "craftRune")
          .map((step) => step.recipeId),
      ),
    ],
    runesEquipped: build.runeRules,
    knownStances,
    attunedStances: build.stances.attuned,
    equippedStances: { default: build.stances.default },
    knownRites,
    equippedRites: build.rites,
  };
}

/**
 * One profile per (canonical T1 class baseline x entry-economy mode).
 *
 * The two modes share byte-identical permanent progression and differ ONLY in
 * the wallet, which is what makes them a usable control pair: any difference
 * between a `-clean` and a `-natural` run is attributable to carryover economy
 * and nothing else.
 */
export const ENTRY_ECONOMY_MODES: readonly EntryEconomyMode[] = [
  "clean",
  "natural",
];

export const TIER_ENTRY_PROFILES = new Map<string, TierEntryProfile>(
  T1_BASELINE_ROUTES.flatMap((route) =>
    ENTRY_ECONOMY_MODES.map((economy) => {
      const profile = buildProfile(route, economy);
      return [profile.id, profile] as const;
    }),
  ),
);

/** The T2-entry profile id for a class root and economy mode. */
export function t2EntryProfileId(classRoot: string, economy: EntryEconomyMode): string {
  const route = T1_BASELINE_ROUTES.find((r) => r.classRoot === classRoot);
  if (!route) throw new Error(`no canonical T1 baseline route for class root "${classRoot}"`);
  return `${route.id}-t2-entry-${economy}`;
}

export function requireTierEntryProfile(id: string): TierEntryProfile {
  const profile = TIER_ENTRY_PROFILES.get(id);
  if (!profile) {
    throw new Error(
      `unknown tier-entry profile "${id}" (have: ${[...TIER_ENTRY_PROFILES.keys()].join(", ")})`,
    );
  }
  return profile;
}

// ── Lineage lane reference profiles (progression rework plan §1.5) ───────────
//
// Design §9: "pure lanes are the reference builds. Three per frame, run by the
// bot harness against every variant." A lane profile is an ordinary T2-entry
// manifest — the character who has just finished Tier 1, so it holds full T1
// mastery and can legally own the whole T1 lineage band — plus two declarations
// the matrix needs: which LANE it is pure in, and which cards it bought.
//
// Each lineage also gets a lane-less CONTROL with the same class, frame and
// weapon and no cards at all. Without it a lane number is unreadable: the
// absolute throughput of `rapier/tempo` is mostly Striker-with-a-rapier, and
// only the difference from the control is the lane. The budget check in §9
// therefore runs on the control-relative uplift, not on absolute TTK.

/**
 * Which class root and T1 frame each weapon lineage's reference build wears.
 *
 * Four of the five are the pairing the SHIPPED canonical T1 route already ends
 * on (`SURVEY_CLASSES` in `server/bench/balance/ttkSurveySpec.ts` names the same
 * weapons): the Flash Rapier is the Striker's, the Heavy Hammer the Squire's,
 * the Chaotic Axe the Apprentice's, the Poison Dagger the Slinger's.
 *
 * The Iron Broadsword has NO shipped pairing — every melee route crafts it as
 * the Plains starter and then replaces it, which is exactly design §3.2's
 * "generalist floor". It is paired here with the energy root, the only root
 * whose canonical route does not already anchor a lineage (the summoner root is
 * the other, and its minions put damage the lane did not do into every TTK).
 * That is a BENCH AUTHORING CHOICE, not a design decision — flagged for the
 * designer in the lane-matrix report.
 */
export interface LineageReferenceClass {
  classRoot: string;
  frameId: string;
  /** The lineage's tier-1 base form; holding it is what opens the tree. */
  baseForm: string;
}

export const LINEAGE_REFERENCE_CLASS: Record<string, LineageReferenceClass> = {
  rapier: { classRoot: "cadence-root", frameId: "cadence-balanced", baseForm: "flash-rapier" },
  hammer: { classRoot: "cooldown-root", frameId: "cooldown-heavy", baseForm: "heavy-hammer" },
  axe: { classRoot: "dot-root", frameId: "dot-balanced", baseForm: "chaotic-axe" },
  dagger: { classRoot: "reload-root", frameId: "reload-heavy", baseForm: "ashbrand-blade" },
  broadsword: { classRoot: "energy-root", frameId: "energy-heavy", baseForm: "iron-broadsword" },
};

/** The T1 band's rows, in the order a player buys them (`rowsForTier(1)`). */
const T1_LANE_ROWS: readonly RowKind[] = ["stat", "payoff"];

export interface LineageLaneReference {
  profileId: string;
  lineageId: string;
  /** Null on the control: same build, no cards. */
  lane: PacketId | null;
  classRoot: string;
  frameId: string;
  baseForm: string;
  homeBiome: string;
  /** The T1 stat and payoff cards of this lane, in row order. */
  cardIds: string[];
  /**
   * True when NO Tier-1 mob family drops this lane's shard, so the cards cannot
   * be bought from T1 kills at all. This was Engagement's case until the third
   * mob per biome was authored (design §18.8) and Plains Sky could finally field
   * `savanna-hawk` at tier 1; `LANES_WITHOUT_T1_SHARD_SOURCE` is now empty. A
   * harness that ever runs such a profile has to grant the shards outright and
   * SAY SO.
   */
  shardsUnobtainableAtT1: boolean;
}

/**
 * Lanes whose shard has no Tier-1 source (see `shardsUnobtainableAtT1`). EMPTY
 * since the third family mob per biome landed: `laneProfiles.test.ts` recomputes
 * this from the pools and the family table, so it fails the moment the list and
 * the data disagree in either direction.
 */
export const LANES_WITHOUT_T1_SHARD_SOURCE: readonly PacketId[] = [];

function laneCardIds(lineage: LineageDefinition, lane: PacketId): string[] {
  return T1_LANE_ROWS.map((row) => {
    const card = lineage.cards.find((c) => c.tier === 1 && c.row === row && c.lane === lane);
    if (!card) throw new Error(`${lineage.id}: no T1 ${row} card on lane ${lane}`);
    return card.id;
  });
}

/**
 * One reference per (weapon lineage x lane), plus one lane-less control each.
 * Twenty rows: five lineages x (three lanes + control).
 */
export const LINEAGE_LANE_REFERENCES: readonly LineageLaneReference[] =
  [...LINEAGE_DATABASE.values()]
    .filter((lineage) => lineage.slot === "weapon")
    .flatMap((lineage) => {
      const ref = LINEAGE_REFERENCE_CLASS[lineage.id];
      if (!ref) throw new Error(`no reference class for weapon lineage ${lineage.id}`);
      const lanes: (PacketId | null)[] = [...lineage.lanes, null];
      return lanes.map((lane) => ({
        // NOT "control": `control` is itself a packet name, so the lane-less
        // profile of the Hammer would have collided with its Control lane.
        profileId: `lineage-${lineage.id}-${lane ?? "baseline"}`,
        lineageId: lineage.id,
        lane,
        classRoot: ref.classRoot,
        frameId: ref.frameId,
        baseForm: ref.baseForm,
        homeBiome: lineage.homeBiome,
        cardIds: lane ? laneCardIds(lineage, lane) : [],
        shardsUnobtainableAtT1: lane !== null && LANES_WITHOUT_T1_SHARD_SOURCE.includes(lane),
      }));
    });

/**
 * The lane reference as a tier-entry profile.
 *
 * Built from the canonical route of its class root so the permanent progression
 * (mastery, recipes, runes, abilities) is the SAME manifest every other template
 * uses, then overridden in exactly three places: the weapon is the lineage's
 * base form, `lane` names the lane, and `lineages` declares the cards. The
 * wallet is `clean`, because a lane comparison must not also be a wallet
 * comparison.
 */
function laneReferenceProfile(reference: LineageLaneReference): TierEntryProfile {
  const route = T1_BASELINE_ROUTES.find((r) => r.classRoot === reference.classRoot);
  if (!route) throw new Error(`no canonical T1 baseline route for ${reference.classRoot}`);
  const base = buildProfile(route, "clean");

  // The reference wears the lineage's own base form. Whatever weapon the route
  // finished T1 on stays in the bag: a character who crafted it still owns it,
  // and dropping it would make the manifest claim essence was never spent.
  const displaced = base.equipment.weapon;
  const equipment: EquipmentMap = { ...base.equipment, weapon: reference.baseForm };
  const inventory = [...new Set([
    ...base.inventory.filter((id) => id !== reference.baseForm),
    ...(displaced && displaced !== reference.baseForm ? [displaced] : []),
  ])];

  // The base form is carried at +0. Every lane profile of a lineage then differs
  // ONLY in its cards, and the card's magnitude is not competing with an upgrade
  // ladder that Phase 2 deletes for weapons anyway.
  const itemUpgrades = { ...base.itemUpgrades, [reference.baseForm]: 0 };

  return {
    ...base,
    id: reference.profileId,
    lane: reference.lane ?? undefined,
    equipment,
    inventory,
    itemUpgrades,
    lineages: {
      [reference.lineageId]: {
        ownedCards: [...reference.cardIds],
        active: Object.fromEntries(
          reference.cardIds.map((cardId, index) => [T1_LANE_ROWS[index], cardId]),
        ) as Partial<Record<RowKind, string>>,
        ownedForms: [reference.baseForm],
        wornForm: reference.baseForm,
      },
    },
  };
}

/**
 * Keyed by `LineageLaneReference.profileId`. Deliberately a SEPARATE map from
 * `TIER_ENTRY_PROFILES`: that one is the T2-entry catalogue and its test asserts
 * its exact size (one per canonical route x economy mode), a contract these
 * profiles are not part of.
 */
export const LINEAGE_LANE_PROFILES = new Map<string, TierEntryProfile>(
  LINEAGE_LANE_REFERENCES.map((reference) => [reference.profileId, laneReferenceProfile(reference)]),
);

export function laneReferenceFor(profileId: string): LineageLaneReference {
  const reference = LINEAGE_LANE_REFERENCES.find((r) => r.profileId === profileId);
  if (!reference) throw new Error(`unknown lane reference "${profileId}"`);
  return reference;
}

/**
 * The route steps a lane reference buys its band with, spliced into a live T1
 * route after the step that crafts and equips the base form.
 *
 * `unlockCard` into an empty row already activates the card server-side, so the
 * `setActive` steps are redundant for a pure lane — they are emitted anyway
 * because they are the swap the playtest metric counts, and a route that states
 * its active set cannot drift from the profile that declares it.
 */
export function lineageRouteSteps(reference: LineageLaneReference): RouteStep[] {
  if (!reference.lane) return [];
  const at = { kind: "biome" as const, biomeGroup: reference.homeBiome, tier: 1 };
  return reference.cardIds.flatMap((cardId, index) => [
    { type: "unlockCard" as const, lineageId: reference.lineageId, cardId, farmAt: at },
    { type: "setActive" as const, lineageId: reference.lineageId, row: T1_LANE_ROWS[index], cardId },
  ]);
}
