import {
  biomeLevelCap,
  CLEARING_NODE_ID,
  DEFAULT_RUNE_LOADOUT,
  T1_BIOME_ORDER,
  TUTORIAL_SEALS,
  type ClassConfig,
  type EquippedRule,
} from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";

/**
 * The Slinger's T1 route (CL6, bible §10.13).
 *
 * The tier-0 quest, the Slinger, then `classConfig` in `auto` mode. The server
 * rebuilds that default as lessons and trophies arrive: the plain clip, then
 * each clip on its natural rule (Scatter on three or more enemies, Snare on a
 * fast enemy closing, Venom on an elite or a boss, Stopping on a charge,
 * Breaching on a plated target), and the two free reload rules. The zones are
 * the tutorial's: `T1_BIOME_ORDER`, with the two seals fought where the guide
 * fights them (Plains after its farm, Mountain after Cave). Plains, Forest,
 * Swamp and Cave are farmed to the tier cap. The Mountain is farmed to the
 * Stopping lesson, then its boss. Completion is both seals and the tier-2
 * promotion.
 */
export const SLINGER_T1_ID = "slinger-t1";

export const SLINGER_CLASS_ROOT = "reload-root";

/**
 * The level a T1 zone teaches its clip (bible §10.4, `LESSON_ZONE_LEVEL`).
 * Not imported: the helper stays inside the class-kit folder.
 */
const LESSON_LEVEL = 2;

const CLEARING: NodeRef = { kind: "node", nodeId: CLEARING_NODE_ID };

const [FIRST_SEAL, SECOND_SEAL] = TUTORIAL_SEALS;

/** Walks in `T1_BIOME_ORDER`, with each seal placed where the guide fights it. */
const ZONE_ORDER: readonly string[] = [
  FIRST_SEAL,
  ...T1_BIOME_ORDER.filter((biome) => biome !== FIRST_SEAL && biome !== SECOND_SEAL),
  SECOND_SEAL,
];

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: 1, pick: "uncleared" };
}

/** How far the guided route farms this zone before it moves on. */
export function slingerFarmLevel(biomeGroup: string): number {
  return biomeGroup === SECOND_SEAL ? LESSON_LEVEL : biomeLevelCap(1, biomeGroup);
}

/**
 * Craft each piece in `at` (the step farms there until the recipe is unlocked and
 * affordable) and wear it at once, in the order given: a zone's weapon at its
 * first level, the vest one level later, the charm two, the boots three. That is
 * how a real player gears up, piece by piece as the zone opens it, rather than
 * all at once before a seal. Already held, already worn: both steps pass.
 */
export function wearAsUnlocked(at: NodeRef, ids: readonly string[]): RouteStep[] {
  return ids.flatMap((id): RouteStep[] => [
    { type: "craft", recipeIds: [id], farmAt: at, label: `craft ${id}` },
    { type: "equip", definitionIds: [id], label: `wear ${id}` },
  ]);
}

/**
 * A gun the discipline fits (bible §10.4: Gunslinger the Carbine and Pepperbox, Siege
 * the Drum Gun and Pepperbox, Trickshot the Hand Cannon and Snakebite Pistol), made in
 * `zone` of `tier`. `before` names the zone whose steps it goes in front of when the
 * gun's own zone comes later in the route (a detour, so the tier's first boss is met
 * in that tier's class weapon); without it the gun is made when the route reaches its
 * zone, before that zone's armor.
 */
export interface DisciplineGun {
  discipline: string;
  zone: string;
  id: string;
  before?: string;
}

/** The discipline route choice every T2+ Slinger route shares. */
export const SLINGER_DISCIPLINE_CHOICE = "slinger-discipline";
export const SLINGER_DEFAULT_DISCIPLINE = "gunslinger";

/** Craft and wear one discipline gun; the steps exist only on that discipline's run. */
export function gunSteps(gun: DisciplineGun, tier: number): RouteStep[] {
  const at: NodeRef = { kind: "biome", biomeGroup: gun.zone, tier, pick: "uncleared" };
  const choice = { id: SLINGER_DISCIPLINE_CHOICE, option: gun.discipline, defaultOption: SLINGER_DEFAULT_DISCIPLINE };
  return [
    { type: "craft", recipeIds: [gun.id], farmAt: at, label: `craft ${gun.id}`, choice },
    { type: "equip", definitionIds: [gun.id], label: `wear ${gun.id}`, choice },
  ];
}

/**
 * One zone's steps on a T2+ route: the discipline guns that detour in front of it, the
 * travel, the zone's own discipline guns, then its vest, charm and boots as they unlock.
 */
export function zoneGearSteps(biomeGroup: string, tier: number, guns: readonly DisciplineGun[], kit: readonly string[]): {
  before: RouteStep[];
  inZone: RouteStep[];
} {
  const at: NodeRef = { kind: "biome", biomeGroup, tier, pick: "uncleared" };
  return {
    before: guns.filter((gun) => gun.before === biomeGroup).flatMap((gun) => gunSteps(gun, tier)),
    inZone: [
      ...guns.filter((gun) => gun.zone === biomeGroup && !gun.before).flatMap((gun) => gunSteps(gun, tier)),
      ...wearAsUnlocked(at, kit),
    ],
  };
}

/**
 * The standing orders a Slinger plays with: the default set, with Keep Distance in
 * place of the chase while fighting. Keep Distance is a free universal standing
 * order (bible §3, decided in the Slinger dive: "it decides where the Slinger
 * stands for its stationary reload"); without it the Slinger trades shots at
 * melee distance (the Plains boss sim: ~60 px from the boss, a loss every time;
 * with it ~100 px and a win).
 */
export const SLINGER_STANDING_ORDERS: readonly EquippedRule[] = DEFAULT_RUNE_LOADOUT.map((rule) =>
  rule.conditionId === "in-combat" && rule.actionId === "chase-enemy" ? { conditionId: "in-combat", actionId: "orbit" } : { ...rule });

/** The Clearing set, made right after the class pick (the pistol is class gear). */
export const SLINGER_CLEARING_GEAR: readonly string[] = [
  "slinger-plain-pistol-t1", "clearing-vest-t1", "clearing-charm-t1", "clearing-boots-t1",
];

/**
 * Each T1 zone's pieces, worn as they unlock. The guns are the ones that beat the
 * gun already held (PLACEHOLDER, by DPS: attack x fire rate x the share of the
 * cycle spent firing): Pepperbox, then Carbine, then the Drum Gun; the Snakebite
 * Pistol and the Hand Cannon are below the Carbine and the Drum Gun, so they stay
 * on the bench. The Mountain is fought at its lesson level, so only its vest
 * (level 2, Dig In) is open before the seal.
 */
export const SLINGER_T1_ZONE_GEAR: Readonly<Record<string, readonly string[]>> = {
  plains: ["slinger-pepperbox-t1", "plains-vest-t1", "plains-charm-t1", "plains-boots-t1"],
  forest: ["slinger-carbine-t1", "forest-vest-t1", "forest-charm-t1", "forest-boots-t1"],
  swamp: ["swamp-vest-t1", "swamp-charm-t1", "swamp-boots-t1"],
  cave: ["slinger-drum-gun-t1", "cave-vest-t1", "cave-charm-t1", "cave-boots-t1"],
  mountain: ["mountain-vest-t1"],
};

/**
 * `auto` hands the Loadout back to the class default. This is the fresh
 * Loadout: the plain clip is always loaded and takes no slot, nothing else is
 * owned yet, and the two free reload rules are on. A racked clip or a trophy
 * here would not pass the Loadout's own check.
 */
function autoLoadout(): ClassConfig {
  return {
    mode: "auto",
    relic: [],
    system: {
      kind: "loadout",
      rack: [],
      doubleLoads: [],
      clipRules: [],
      reloadEarlyWhenSafe: true,
      neverReloadInTelegraph: true,
    },
  };
}

export function slingerT1Route(): Route {
  const steps: RouteStep[] = [
    { type: "travel", to: CLEARING },
    {
      type: "farm",
      at: CLEARING,
      until: { type: "playerTierAtLeast", tier: 1 },
      label: "clear the tier-0 quest",
    },
    { type: "chooseClass", skillId: SLINGER_CLASS_ROOT },
    { type: "classConfig", config: autoLoadout() },
    { type: "configureRunes", rules: [...SLINGER_STANDING_ORDERS], label: "Keep Distance while fighting" },
    // The guide's Clearing set (opening.ts): the bot would otherwise walk into the Plains bare.
    ...wearAsUnlocked(CLEARING, SLINGER_CLEARING_GEAR),
  ];

  for (const biomeGroup of ZONE_ORDER) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
    steps.push(...wearAsUnlocked(at, SLINGER_T1_ZONE_GEAR[biomeGroup] ?? []));
    steps.push({
      type: "farm",
      at,
      until: { type: "biomeLevelAtLeast", biomeGroup, level: slingerFarmLevel(biomeGroup) },
    });
    if (biomeGroup === FIRST_SEAL || biomeGroup === SECOND_SEAL) {
      steps.push({ type: "attemptBoss", biomeGroup, tier: 1 });
    }
  }

  // The guide's farewell: two seals promote to tier 2. If the kill already did,
  // this step is already done.
  steps.push({
    type: "farm",
    at: zone(SECOND_SEAL),
    until: { type: "playerTierAtLeast", tier: 2 },
    label: "wait for the tier-2 promotion",
  });

  const milestones: Route["milestones"] = [
    { id: "tier-1-reached", when: { type: "playerTierAtLeast", tier: 1 } },
    { id: "class-chosen", when: { type: "classSelected" } },
  ];
  for (const biomeGroup of ZONE_ORDER) {
    const level = slingerFarmLevel(biomeGroup);
    if (level !== LESSON_LEVEL) {
      milestones.push({
        id: `${biomeGroup}-lesson`,
        when: { type: "biomeLevelAtLeast", biomeGroup, level: LESSON_LEVEL },
      });
    }
    milestones.push({
      id: `${biomeGroup}-level-${level}`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level },
    });
    if (biomeGroup === FIRST_SEAL || biomeGroup === SECOND_SEAL) {
      milestones.push({
        id: `${biomeGroup}-seal`,
        when: { type: "bossCleared", biomeGroup, tier: 1 },
      });
    }
  }
  milestones.push({ id: "tier-2", when: { type: "playerTierAtLeast", tier: 2 } });

  return {
    id: SLINGER_T1_ID,
    version: "1.0.0",
    classRoot: SLINGER_CLASS_ROOT,
    description:
      "Slinger T1: the tier-0 quest, the class, an auto Loadout, each T1 zone to the " +
      "level the guide farms, then the Plains seal and the Mountain seal.",
    steps,
    completion: allOf(
      { type: "bossCleared", biomeGroup: FIRST_SEAL, tier: 1 },
      { type: "bossCleared", biomeGroup: SECOND_SEAL, tier: 1 },
      { type: "playerTierAtLeast", tier: 2 },
    ),
    milestones,
  };
}
