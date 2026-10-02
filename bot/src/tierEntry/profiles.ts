import type { DesiredBuild } from "../loadout/loadout";
import {
  LINEAGE_DATABASE,
  NODE_BIOMES,
  STANCE_RECIPE_DATABASE, RITE_RECIPE_DATABASE,
  RECIPE_DATABASE,
  biomeLevelCap,
  biomeXpForBiomeLevel,
  emptyEquipment,
  emptyAttunedAbilities,
  rowsForTier,
  type EquipmentMap,
  type LineageDefinition,
  type LineageForm,
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

/**
 * Which tier's BAND and gear a reference carries (run 4, W2-A step 1).
 *
 * Band 1 is the character the Tier-1 gate hands over: T1 gear, the T1 stat and
 * payoff rows, T1 mastery. Band 2 is the character the Tier-2 gate hands over:
 * the lineage's tier-2 form, the T2 form of every armour/charm/boot the band-1
 * reference wears, the T2 stat/payoff/amplifier rows, and mastery at the Tier-2
 * cap. Nothing else differs between the two — same class, same frame, same
 * ability package — so a band-1 and a band-2 row of the same lane are the same
 * build one tier apart, and that is the only reading in which the BAND is the
 * variable.
 */
export type BandTier = 1 | 2;

export interface LineageLaneReference {
  profileId: string;
  lineageId: string;
  /** Null on the control: same build, no cards. */
  lane: PacketId | null;
  classRoot: string;
  frameId: string;
  /** Which tier's band and gear this row carries. */
  bandTier: BandTier;
  /** The lineage's tier-1 base form. Owned by every band; worn only by band 1. */
  baseForm: string;
  /** The form actually equipped: the base form at band 1, the T2 form at band 2. */
  wornForm: string;
  homeBiome: string;
  /**
   * Every card this reference OWNS, in purchase order. At band 1 that is the T1
   * stat and payoff rows; at band 2 it is those two plus the T2 stat, payoff and
   * amplifier, because a T2 character bought the T1 band on the way and its stat
   * row folded into the form it is wearing (design §4 band collapse).
   */
  cardIds: string[];
  /**
   * The subset of `cardIds` that is SLOTTED. `active` is one card per row across
   * the whole tree, so a band-2 reference runs the T2 rows and leaves the T1
   * payoff owned-but-inert; its T1 stat row is absorbed by the worn form and
   * pays out from there (`absorbedStatCards`), which is why it is still owned.
   */
  activeCardIds: string[];
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

function laneCardIds(lineage: LineageDefinition, lane: PacketId, tier = 1): string[] {
  return rowsForTier(tier).map((row) => {
    const card = lineage.cards.find((c) => c.tier === tier && c.row === row && c.lane === lane);
    if (!card) throw new Error(`${lineage.id}: no T${tier} ${row} card on lane ${lane}`);
    return card.id;
  });
}

/**
 * The tier-2 form a band-2 reference wears: the lineage's FIRST authored tier-2
 * form, which is the one whose door stands in the lineage's own home biome.
 *
 * Fixed per lineage rather than chosen to match the lane, and deliberately so.
 * Seven of the fifteen weapon lanes have no tier-2 form crowning them at all
 * (the Hammer, Axe and Dagger each author one T2 door, the Rapier and Broadsword
 * two), so a lane-matched form is not available for most rows, and a mixed
 * selection would make the lanes of one lineage incomparable — one of them would
 * carry a capstone that answers its own lane while the others carry one that does
 * not. Holding it fixed moves the form's capstone into the CONTROL as well, where
 * the uplift reading divides most of it out.
 *
 * The residual is named rather than hidden: the capstone's lane still synergises
 * with one of the lineage's three lanes more than the others, and that is the
 * band-2 instrument's known confound. Reported in `lane-matrix-run4.md`.
 */
function t2WornForm(lineage: LineageDefinition): LineageForm {
  const form = lineage.forms.find((f) => f.tier === 2);
  if (!form) throw new Error(`${lineage.id}: no tier-2 form, so it has no tier-2 band`);
  return form;
}

/**
 * The tier-2 counterpart of a tier-1 armour / charm / boot: the same lineage's
 * tier-2 form in the SAME biome.
 *
 * Derived rather than listed, so the T2 gear set can never drift from the T1 one
 * the band-1 references already wear. Returns null when the item belongs to no
 * lineage or its lineage authors no same-biome T2 form, and the caller then keeps
 * the T1 item — which would be a finding, not a silent downgrade, because
 * `validateProfile`'s `no-future-tier-items` says nothing about carrying an older
 * item and the band-2 test below asserts the whole set moved.
 */
function t2CounterpartItem(recipeId: string): string | null {
  for (const lineage of LINEAGE_DATABASE.values()) {
    const t1 = lineage.forms.find((f) => f.recipeId === recipeId && f.tier === 1);
    if (!t1) continue;
    const t2 = lineage.forms.find((f) => f.tier === 2 && f.biome === t1.biome);
    return t2?.recipeId ?? null;
  }
  return null;
}

/**
 * One reference per (weapon lineage x lane), plus one lane-less control each.
 * Twenty rows: five lineages x (three lanes + control).
 */
function laneReferencesForBand(bandTier: BandTier): LineageLaneReference[] {
  return [...LINEAGE_DATABASE.values()]
    .filter((lineage) => lineage.slot === "weapon")
    .flatMap((lineage) => {
      const ref = LINEAGE_REFERENCE_CLASS[lineage.id];
      if (!ref) throw new Error(`no reference class for weapon lineage ${lineage.id}`);
      const wornForm = bandTier === 1 ? ref.baseForm : t2WornForm(lineage).recipeId;
      const suffix = bandTier === 1 ? "" : "-t2";
      const lanes: (PacketId | null)[] = [...lineage.lanes, null];
      return lanes.map((lane) => {
        // Band 2 owns the T1 band as well: a tier-2 character bought it on the
        // way up and its stat row is inside the form now (design §4).
        const owned = lane
          ? (bandTier === 1
            ? laneCardIds(lineage, lane, 1)
            : [...laneCardIds(lineage, lane, 1), ...laneCardIds(lineage, lane, 2)])
          : [];
        const active = lane ? laneCardIds(lineage, lane, bandTier) : [];
        return {
          // NOT "control": `control` is itself a packet name, so the lane-less
          // profile of the Hammer would have collided with its Control lane.
          profileId: `lineage-${lineage.id}-${lane ?? "baseline"}${suffix}`,
          lineageId: lineage.id,
          lane,
          classRoot: ref.classRoot,
          frameId: ref.frameId,
          bandTier,
          baseForm: ref.baseForm,
          wornForm,
          homeBiome: lineage.homeBiome,
          cardIds: owned,
          activeCardIds: active,
          shardsUnobtainableAtT1: lane !== null && LANES_WITHOUT_T1_SHARD_SOURCE.includes(lane),
        };
      });
    });
}

export const LINEAGE_LANE_REFERENCES: readonly LineageLaneReference[] = laneReferencesForBand(1);

/**
 * The band-2 half of the reference set (run 4, W2-A step 1): twenty more rows,
 * five lineages x (three lanes + control), carrying the T2 band on T2 gear.
 *
 * A SEPARATE array rather than twenty more entries in `LINEAGE_LANE_REFERENCES`,
 * because that array's own test asserts its exact size and every row's T1 shape —
 * a contract the band-2 rows are not part of. The bench reads `ALL_LANE_REFERENCES`.
 */
export const LINEAGE_LANE_REFERENCES_T2: readonly LineageLaneReference[] = laneReferencesForBand(2);

/** Both bands, in band order — the set the lane matrix sweeps. */
export const ALL_LANE_REFERENCES: readonly LineageLaneReference[] =
  [...LINEAGE_LANE_REFERENCES, ...LINEAGE_LANE_REFERENCES_T2];

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
  const t1 = buildProfile(route, "clean");
  const base = reference.bandTier === 1 ? t1 : t2CompleteManifest(t1);

  // The reference wears the lineage's own form for its band. Whatever the route
  // or the previous band wore stays in the bag: a character who crafted it still
  // owns it, and dropping it would make the manifest claim essence was never spent.
  const gear = reference.bandTier === 1
    ? { ...base.equipment, weapon: reference.wornForm }
    : t2Equipment(base.equipment, reference.wornForm);
  const worn = new Set(Object.values(gear).filter((id): id is string => !!id));
  const inventory = [...new Set([
    ...base.inventory.filter((id) => !worn.has(id)),
    ...Object.values(base.equipment).filter((id): id is string => !!id && !worn.has(id)),
    // The base form is owned at every band: it is what opened the tree, and at
    // band 2 it is the form the gate was paid FROM.
    ...(worn.has(reference.baseForm) ? [] : [reference.baseForm]),
  ])];

  // The worn form is carried at +0. Every lane profile of a lineage then differs
  // ONLY in its cards, and the card's magnitude is not competing with an upgrade
  // ladder that Phase 2 deletes for weapons anyway. (The tier-2 forms author no
  // upgrade steps at all, so +0 is their only legal level.)
  const itemUpgrades: Record<string, number> = { ...base.itemUpgrades };
  for (const id of [reference.baseForm, reference.wornForm]) itemUpgrades[id] = 0;
  if (reference.bandTier === 2) {
    for (const slot of ["armor", "recovery", "mobility"] as const) {
      const id = gear[slot];
      if (id && id !== base.equipment[slot]) itemUpgrades[id] = T2_GEAR_PLUS;
    }
  }
  // `upgrade-refers-to-owned-item`: the band-1 manifest records a +N for items the
  // route crafted and this build no longer carries in either place.
  for (const id of Object.keys(itemUpgrades)) {
    if (!worn.has(id) && !inventory.includes(id)) delete itemUpgrades[id];
  }

  const lineage = LINEAGE_DATABASE.get(reference.lineageId)!;
  const rowOf = (cardId: string): RowKind => {
    const card = lineage.cards.find((c) => c.id === cardId);
    if (!card) throw new Error(`${reference.profileId}: ${cardId} is not a card of ${lineage.id}`);
    return card.row;
  };

  return {
    ...base,
    id: reference.profileId,
    lane: reference.lane ?? undefined,
    equipment: gear,
    inventory,
    itemUpgrades,
    lineages: {
      [reference.lineageId]: {
        ownedCards: [...reference.cardIds],
        active: Object.fromEntries(
          reference.activeCardIds.map((cardId) => [rowOf(cardId), cardId]),
        ) as Partial<Record<RowKind, string>>,
        ownedForms: [...new Set([reference.baseForm, reference.wornForm])],
        wornForm: reference.wornForm,
      },
    },
  };
}

// --- The band-2 manifest (run 4, W2-A step 1) -------------------------------

/** Biomes the Tier-2 region adds on top of the five T1 ones. */
const T2_BIOMES = ["jungle", "desert"] as const;

/**
 * Upgrade level the band-2 armour / charm / boots are carried at.
 *
 * +5, the same ceiling the band-1 references carry their T1 set at, so the gear
 * is a tier up and not also an upgrade step behind. A tier-2 item's +5 needs its
 * recipe group at level 10 and a Global Mastery ceiling of +5; the band-2 manifest
 * sits at level 12 in all five T1 groups and Global Mastery 72, so both are met
 * with room to spare. `validateProfile` checks exactly this, and the test below
 * runs it over every band-2 row.
 */
const T2_GEAR_PLUS = 5;

/**
 * The band-1 (T1-complete) manifest raised to the state the Tier-2 gate hands
 * over: every T1 biome at the top of its Tier-2 band, both Tier-2 biomes at the
 * cap their own tier allows, every Tier-1 AND Tier-2 boss felled.
 *
 * `biomeLevelCap(2, group)` is the authority for both numbers and they are NOT the
 * same: a T1 group reaches 12 while the character is still inside Tier 2, but
 * Jungle and Desert cap at 6 until the third tier is entered. "Mastery at the T2
 * cap" therefore means 12 for the five T1 groups and 6 for the two T2 ones --
 * which `validateProfile`'s `mastery-within-previous-tier-cap` enforces against
 * this very function, so the two cannot drift.
 *
 * Global Mastery lands at 72, clearing the T2 amplifier row's 64 and the +5
 * ceiling for tier-2 items. The band's own biome gate (level 11 for an amplifier)
 * is read in the lineage's DOOR biome, and every tier-2 weapon door of the five
 * weapon lineages stands in a T1 biome -- so nothing in the band depends on the
 * Jungle/Desert levels being short of twelve.
 */
function t2CompleteManifest(base: TierEntryProfile): TierEntryProfile {
  const groups: string[] = [...T1_BIOMES, ...T2_BIOMES];
  const biomeLevels: Record<string, number> = { clearing: CLEARING_MAX_LEVEL };
  const biomeXP: Record<string, number> = {
    clearing: biomeXpForBiomeLevel("clearing", CLEARING_MAX_LEVEL),
  };
  for (const group of groups) {
    const level = biomeLevelCap(2, group);
    biomeLevels[group] = level;
    biomeXP[group] = biomeXpForBiomeLevel(group, level);
  }

  const nodes = Object.entries(NODE_BIOMES)
    .filter(([, info]) => groups.includes(info.biomeGroup) && info.biomeTier <= 2)
    .map(([id, info]) => ({ id, kind: info.kind }));

  return {
    ...base,
    targetTier: 3,
    spawnNodeId: "node-t3-sanctuary",
    // ONE unspent point, and no branch. A T3-entry character has been minted the
    // point the third tier pays and has not spent it: `currentSkillTier` 3 is the
    // tier it may buy from and the tier-2 Range node is what it would buy. Left
    // UNSPENT on purpose -- the band is what this reference varies, and a Range
    // pick would be a second variable. `validateProfile`'s
    // `no-unearned-skill-points` asserts exactly this pairing, so the choice is
    // checked rather than assumed.
    skillPoints: 1,
    currentSkillTier: 3,
    biomeLevels,
    biomeXP,
    // Every T1 and T2 boss, mirroring the band-1 manifest's "all five T1 bosses".
    // Three T2 seals are what Tier 3 requires; seven is what a character that has
    // actually finished the region holds.
    bossesCleared: [
      ...T1_BIOMES.map((group) => `${group}:1`),
      ...groups.map((group) => `${group}:2`),
    ],
    clearedNodes: nodes.filter(({ kind }) => kind === "normal").map(({ id }) => id),
    visitedNodes: nodes.map(({ id }) => id),
    questProgress: { "tier-0": 10, "tier-1": 10, "tier-2": 1 },
  };
}

/**
 * The band-2 equipment set: the tier-2 weapon form plus the tier-2 counterpart of
 * every armour / charm / boot the band-1 reference wears.
 *
 * Derived from the band-1 set item by item (`t2CounterpartItem`) rather than
 * listed, so the two sets can never name different lineages. An item with no
 * same-biome tier-2 form keeps its T1 entry, and the band-2 test fails on it --
 * the gap is the finding, not a silent downgrade.
 */
function t2Equipment(band1: EquipmentMap, wornForm: string): EquipmentMap {
  const out: EquipmentMap = { ...band1, weapon: wornForm };
  for (const slot of ["armor", "recovery", "mobility"] as const) {
    const current = band1[slot];
    if (!current) continue;
    out[slot] = t2CounterpartItem(current) ?? current;
  }
  return out;
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

/** The band-2 half, keyed the same way. */
export const LINEAGE_LANE_PROFILES_T2 = new Map<string, TierEntryProfile>(
  LINEAGE_LANE_REFERENCES_T2.map((reference) => [reference.profileId, laneReferenceProfile(reference)]),
);

/** Both bands in one lookup -- what a bench sweeping `ALL_LANE_REFERENCES` needs. */
export const ALL_LANE_PROFILES = new Map<string, TierEntryProfile>([
  ...LINEAGE_LANE_PROFILES,
  ...LINEAGE_LANE_PROFILES_T2,
]);

export function laneReferenceFor(profileId: string): LineageLaneReference {
  const reference = ALL_LANE_REFERENCES.find((r) => r.profileId === profileId);
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

// ── The two-card swap (progression rework run 3, W2-A step 1) ────────────────
//
// `lineageRouteSteps` buys a band and slots it, which exercises `unlockCard`
// into an EMPTY row — and an unlock into an empty row activates the card
// server-side on its own, so the `setActive` steps that follow it return early
// in `doSetActive`. The row-SWAP seam — "I own two cards for this row, show me
// the other one" — had therefore never run on any route: none has ever owned two
// cards of one row.
//
// That swap is what design §6 means by a row being a question you may re-answer,
// and it is the only path on which `setLineageActive` does real work: it takes
// the live card out and puts the other one in, recalculating stats and
// re-registering listeners both times.

export interface LineageSwapReference {
  /** The lane reference whose band the swap is built on. */
  base: LineageLaneReference;
  /** The row both cards answer. */
  row: RowKind;
  /** The lane's own card — bought first, and live again at the end. */
  firstCardId: string;
  /** The SECOND card of the same row, from another lane of the same lineage. */
  secondCardId: string;
  secondLane: PacketId;
}

/**
 * The swap reference for a lane: its own `stat` card plus the `stat` card of the
 * lineage's next lane, so the two are genuinely rival answers to one row rather
 * than the same card twice.
 *
 * The stat row rather than the payoff row on purpose: a stat card's whole effect
 * is a recalculated stat, so a swap that failed to take shows up in the stat
 * sheet, whereas a payoff card that is owned-but-inert looks exactly like one
 * whose trigger has not come round yet.
 */
export function lineageSwapReference(base: LineageLaneReference): LineageSwapReference | null {
  if (!base.lane) return null;
  const lineage = LINEAGE_DATABASE.get(base.lineageId);
  if (!lineage) throw new Error(`unknown lineage ${base.lineageId}`);
  const secondLane = lineage.lanes.find((lane) => lane !== base.lane);
  if (!secondLane) return null;
  const row: RowKind = "stat";
  const cardFor = (lane: PacketId): string => {
    const card = lineage.cards.find((c) => c.tier === 1 && c.row === row && c.lane === lane);
    if (!card) throw new Error(`${lineage.id}: no T1 ${row} card on lane ${lane}`);
    return card.id;
  };
  return {
    base,
    row,
    firstCardId: cardFor(base.lane),
    secondCardId: cardFor(secondLane),
    secondLane,
  };
}

/**
 * Buy the lane's own stat card, buy a SECOND stat card, then flip the row twice:
 * to the second card and back to the first.
 *
 * The second purchase carries NO `farmAt`. Its lane is a different packet, so its
 * shard usually drops in a different biome than the lineage's home —
 * `doUnlockCard` resolves that itself through `lineageFarmNode`, which walks to a
 * biome that can actually pay and raises a named stall when none can. Pinning
 * `farmAt` to the home biome here would farm the wrong node forever for most of
 * the lineages, which is the stall this wave's step 1c reports instead.
 */
export function lineageSwapRouteSteps(swap: LineageSwapReference): RouteStep[] {
  const home = { kind: "biome" as const, biomeGroup: swap.base.homeBiome, tier: 1 };
  const { lineageId } = swap.base;
  return [
    { type: "unlockCard", lineageId, cardId: swap.firstCardId, farmAt: home },
    { type: "setActive", lineageId, row: swap.row, cardId: swap.firstCardId },
    { type: "unlockCard", lineageId, cardId: swap.secondCardId },
    // Flip 1: the rival card takes the row off a card that is already live.
    { type: "setActive", lineageId, row: swap.row, cardId: swap.secondCardId },
    // Flip 2: back again, the half a one-way swap cannot prove.
    { type: "setActive", lineageId, row: swap.row, cardId: swap.firstCardId },
  ];
}

// ── Frame reference profiles (design §18.10) ─────────────────────────────────
//
// "Light / Balanced / Heavy uplift per root is not a column the lane matrix can
// grow: `LINEAGE_LANE_REFERENCES` does not vary frame, so it needs three new
// reference profiles per root (18 rows in `bot/src/tierEntry/profiles.ts`)."
//
// These are the eighteen. A frame reference is LANE-LESS on purpose: design §10
// gives each frame a feedback loop of its own and the column answers what the
// FRAME is worth, so a card on top of it would be a second variable. Within a
// root the three rows differ in exactly one field, `frameId`.
//
// The weapon is the root's lane-matrix weapon wherever it has one, so the row on
// the frame that root's canonical route wears is the SAME build as that lineage's
// lane-less control in the lane matrix and the two readings can be laid side by
// side. `summoner-root` anchors no weapon lineage, so it wears the weapon its own
// canonical route finishes T1 on.

export const FRAME_SHAPES = ["light", "balanced", "heavy"] as const;
export type FrameShape = (typeof FRAME_SHAPES)[number];

/** The six class roots, in `T1_BASELINE_ROUTES` order. */
export const FRAME_REFERENCE_ROOTS: readonly string[] =
  T1_BASELINE_ROUTES.map((route) => route.classRoot);

export interface LineageFrameReference {
  profileId: string;
  classRoot: string;
  frameShape: FrameShape;
  frameId: string;
  /** Which tier's gear this row carries; the frame itself is a tier-1 node at both. */
  bandTier: BandTier;
  /** The weapon every frame of this root wears, so the frame is the only variable. */
  baseForm: string;
  /** The form actually equipped: the base form at band 1, its T2 form at band 2. */
  wornForm: string;
  /** The weapon lineage that base form belongs to, or null when it anchors none. */
  lineageId: string | null;
  /**
   * True on the frame the root's canonical T1 route actually ends on — the cell
   * the lane matrix's own control already measures, and therefore the natural
   * denominator for the other two.
   */
  canonical: boolean;
}

function frameWeaponFor(classRoot: string): { baseForm: string; lineageId: string | null } {
  const paired = Object.entries(LINEAGE_REFERENCE_CLASS)
    .find(([, ref]) => ref.classRoot === classRoot);
  if (paired) return { baseForm: paired[1].baseForm, lineageId: paired[0] };
  const route = T1_BASELINE_ROUTES.find((r) => r.classRoot === classRoot);
  if (!route) throw new Error(`no canonical T1 baseline route for ${classRoot}`);
  const weapon = finalEquipment(allSteps(route)).weapon;
  if (!weapon) throw new Error(`${classRoot}: canonical route finishes T1 with no weapon`);
  const lineage = [...LINEAGE_DATABASE.values()]
    .find((l) => l.slot === "weapon" && l.forms.some((f) => f.recipeId === weapon));
  return { baseForm: weapon, lineageId: lineage?.id ?? null };
}

function frameReferencesForBand(bandTier: BandTier): LineageFrameReference[] {
  return FRAME_REFERENCE_ROOTS.flatMap((classRoot) => {
    const { baseForm, lineageId } = frameWeaponFor(classRoot);
    const canonicalFrame = T1_BASELINE_ROUTES.find((r) => r.classRoot === classRoot)?.frameId
      ?? FRAME_BY_ROOT[classRoot];
    const root = classRoot.replace("-root", "");
    const suffix = bandTier === 1 ? "" : "-t2";
    // The root's weapon one tier up. Every root's lane-matrix weapon has a tier-2
    // form; a root whose weapon belongs to no lineage (none today) would keep the
    // T1 weapon and the test says so.
    const lineage = lineageId ? LINEAGE_DATABASE.get(lineageId) : undefined;
    const wornForm = bandTier === 1 || !lineage ? baseForm : t2WornForm(lineage).recipeId;
    return FRAME_SHAPES.map((frameShape) => {
      const frameId = `${root}-${frameShape}`;
      return {
        profileId: `frame-${root}-${frameShape}${suffix}`,
        classRoot,
        frameShape,
        frameId,
        bandTier,
        baseForm,
        wornForm,
        lineageId,
        canonical: frameId === canonicalFrame,
      };
    });
  });
}

/** Eighteen rows: six class roots x Light / Balanced / Heavy. */
export const LINEAGE_FRAME_REFERENCES: readonly LineageFrameReference[] = frameReferencesForBand(1);

/**
 * The same eighteen on Tier-2 gear (run 4, W2-A step 1).
 *
 * The frame nodes themselves are tier-1 skills at both bands -- a frame is bought
 * once and never replaced -- so what the band-2 rows vary is the GEAR the frame is
 * read on. "Is Heavy still worth what it was once the T2 set is on?" is the
 * question, and it is not one the band-1 rows can answer.
 */
export const LINEAGE_FRAME_REFERENCES_T2: readonly LineageFrameReference[] = frameReferencesForBand(2);

/** Both bands, in band order. */
export const ALL_FRAME_REFERENCES: readonly LineageFrameReference[] =
  [...LINEAGE_FRAME_REFERENCES, ...LINEAGE_FRAME_REFERENCES_T2];

/**
 * The frame reference as a tier-entry profile: the root's canonical T2-entry
 * manifest with the frame and the weapon overridden and no lineage cards.
 */
function frameReferenceProfile(reference: LineageFrameReference): TierEntryProfile {
  const route = T1_BASELINE_ROUTES.find((r) => r.classRoot === reference.classRoot);
  if (!route) throw new Error(`no canonical T1 baseline route for ${reference.classRoot}`);
  const t1 = buildProfile(route, "clean");
  const base = reference.bandTier === 1 ? t1 : t2CompleteManifest(t1);
  const gear = reference.bandTier === 1
    ? { ...base.equipment, weapon: reference.wornForm }
    : t2Equipment(base.equipment, reference.wornForm);
  const worn = new Set(Object.values(gear).filter((id): id is string => !!id));
  const inventory = [...new Set([
    ...base.inventory.filter((id) => !worn.has(id)),
    ...Object.values(base.equipment).filter((id): id is string => !!id && !worn.has(id)),
    ...(worn.has(reference.baseForm) ? [] : [reference.baseForm]),
  ])];
  const itemUpgrades: Record<string, number> = { ...base.itemUpgrades };
  for (const id of [reference.baseForm, reference.wornForm]) itemUpgrades[id] = 0;
  if (reference.bandTier === 2) {
    for (const slot of ["armor", "recovery", "mobility"] as const) {
      const id = gear[slot];
      if (id && id !== base.equipment[slot]) itemUpgrades[id] = T2_GEAR_PLUS;
    }
  }
  for (const id of Object.keys(itemUpgrades)) {
    if (!worn.has(id) && !inventory.includes(id)) delete itemUpgrades[id];
  }
  return {
    ...base,
    id: reference.profileId,
    frameId: reference.frameId,
    lane: undefined,
    equipment: gear,
    inventory,
    itemUpgrades,
  };
}

export const LINEAGE_FRAME_PROFILES = new Map<string, TierEntryProfile>(
  LINEAGE_FRAME_REFERENCES.map((reference) => [reference.profileId, frameReferenceProfile(reference)]),
);

/** The band-2 half, keyed the same way. */
export const LINEAGE_FRAME_PROFILES_T2 = new Map<string, TierEntryProfile>(
  LINEAGE_FRAME_REFERENCES_T2.map((reference) => [reference.profileId, frameReferenceProfile(reference)]),
);

/** Both bands in one lookup. */
export const ALL_FRAME_PROFILES = new Map<string, TierEntryProfile>([
  ...LINEAGE_FRAME_PROFILES,
  ...LINEAGE_FRAME_PROFILES_T2,
]);

export function frameReferenceFor(profileId: string): LineageFrameReference {
  const reference = ALL_FRAME_REFERENCES.find((r) => r.profileId === profileId);
  if (!reference) throw new Error(`unknown frame reference "${profileId}"`);
  return reference;
}
