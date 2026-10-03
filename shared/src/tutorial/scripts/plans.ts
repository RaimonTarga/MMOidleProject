import type { TutorialMovement } from './runes';

/**
 * Per-class Tier-1 plans for the guide, ported from the bot's controlled T1
 * routes (bot/src/routes/t1GearPlans.ts + the per-class configs). Only the
 * data is here; `classScript.ts` turns it into beats.
 *
 * Differences from the bot routes, all deliberate:
 * - Only two bosses, `TUTORIAL_SEALS` (two seals promote to Tier 2).
 * - No upgrade beats: the +N ladder is retired on every slot (design §24.5) and
 *   an item is crafted at its old +5 power, so the kit the bot took to +5 is the
 *   plain crafted kit here.
 * - Two weapon-page purchases, a lean and a verb (`weaponCards`).
 * - The Slinger's Forest armor waits for Forest 3 (`atLevel`).
 */

export type T1Biome = 'plains' | 'forest' | 'swamp' | 'mountain' | 'cave';

export const T1_BIOME_ORDER: readonly T1Biome[] = ['plains', 'forest', 'swamp', 'mountain', 'cave'];

/**
 * The two bosses the guide fights, in order; two seals promote to Tier 2.
 * Designer decision 2026-09-29: Plains + Mountain (was Forest, until the bot
 * showed the Greatbear walling a GM-30 Striker and Apprentice while the
 * Mountain boss fell first try; docs/guided-tutorial-plan.md, Findings).
 * Changing a seal is this one line; every class has a loadout for every boss.
 */
export const TUTORIAL_SEALS: readonly [T1Biome, T1Biome] = ['plains', 'mountain'];

export type PlanItem =
  /**
   * Fight until it can be made, then craft and wear it. `atLevel` holds the
   * craft back to a later level of its zone than the recipe needs — pacing for
   * the first-hour checklist (at most two new ideas per level), never a price.
   */
  | { piece: string; atLevel?: number }
  /** Fight until it can be made, then craft it (worn later). */
  | { craft: string }
  | { equip: string[] };

export interface BiomePlan {
  before?: PlanItem[];
  after?: PlanItem[];
  afterMax?: PlanItem[];
}

export interface BossPlan {
  armor: string;
  technique: string;
  guard: string;
}

/**
 * The weapon lineage the guide teaches: the Forest's, because every class plan
 * crafts and wears the Flash Rapier from the Forest leg to the Cave.
 */
export const TUTORIAL_WEAPON_LINEAGE = 'rapier';

/**
 * The two purchases of the T1 band (design §24.2): a LEAN (row 1, Forest 2) and a
 * VERB (row 2, Forest 4 and the band's Global Mastery). Card ids in
 * {@link TUTORIAL_WEAPON_LINEAGE}. The two are always DIFFERENT lanes, so the
 * verb's sentence is the composed one — the lean visibly rewrites what the verb
 * does, which is the lesson. Same-lane pairs read their packet's pure sentence.
 */
export interface TutorialWeaponCards {
  lean: string;
  verb: string;
}

export interface TutorialClassPlan {
  classRoot: string;
  className: string;
  movement: TutorialMovement;
  biomes: Record<T1Biome, BiomePlan>;
  /** Weapon, charm and boots worn for both boss fights. */
  bossKit: string[];
  bosses: Record<T1Biome, BossPlan>;
  /** What the guide buys on the Rapier's page (reasons per class below). */
  weaponCards: TutorialWeaponCards;
}

/**
 * The Rapier's three leans and three verbs (`data/lineages/rapier.ts`), by lane.
 * Named here only to keep the class table readable.
 */
const RAPIER = {
  quickWrist: 'rapier-t1-tempo-stat',
  envenomed: 'rapier-t1-affliction-stat',
  keenEdge: 'rapier-t1-engagement-stat',
  flurry: 'rapier-t1-tempo-payoff',
  openingLunge: 'rapier-t1-engagement-payoff',
} as const;

/**
 * "Your first hit on each new target lands twice." Quick Wrist's attack speed is
 * a stat every fast or cadence-counting class feels, and its payload — a whole
 * second swing — lands on every new body, which T1 farming (many short pulls)
 * hands out constantly.
 */
const SPEED_OPENER: TutorialWeaponCards = { lean: RAPIER.quickWrist, verb: RAPIER.openingLunge };

/**
 * "Every 6th hit is a lunge for double damage." Keen Edge's flat Attack is on
 * every blow, and Flurry's six-count is the readout ring that visibly fills one
 * hit at a time before the lunge.
 */
const COUNTED_LUNGE: TutorialWeaponCards = { lean: RAPIER.keenEdge, verb: RAPIER.flurry };

const PLAINS: BiomePlan = {
  before: [{ piece: 'iron-broadsword' }, { piece: 'plains-vest-t1' }],
  after: [{ piece: 'plains-charm-t1' }, { piece: 'plains-boots-t1' }],
};

function durableMelee(): Record<T1Biome, BiomePlan> {
  return {
    plains: PLAINS,
    forest: {
      before: [{ piece: 'flash-rapier' }],
    },
    swamp: {
      after: [{ piece: 'swamp-charm-t1' }],
    },
    mountain: {
      after: [{ piece: 'mountain-vest-t1' }],
    },
    cave: {
      before: [
        { equip: ['flash-rapier', 'mountain-vest-t1', 'swamp-charm-t1', 'plains-boots-t1'] },
        { craft: 'chaotic-axe' },
      ],
      after: [
        { equip: ['chaotic-axe'] },
      ],
    },
  };
}

function slinger(): Record<T1Biome, BiomePlan> {
  return {
    plains: PLAINS,
    forest: {
      before: [{ piece: 'flash-rapier' }],
      // Forest 2 already brings the lean and Second Wind; the evasion armor's
      // reason waits one level so no level carries three new ideas (the
      // first-hour checklist). The recipe itself opens at Forest 2.
      after: [{ piece: 'forest-vest-t1', atLevel: 3 }],
    },
    swamp: {
      after: [{ piece: 'swamp-charm-t1' }, { craft: 'ashbrand-blade' }],
    },
    mountain: {},
    cave: {
      before: [{ equip: ['flash-rapier', 'forest-vest-t1', 'swamp-charm-t1', 'plains-boots-t1'] }],
      after: [{ equip: ['ashbrand-blade'] }],
      // The bot also crafts a Mountain vest here, but only for the Mountain,
      // Swamp and Cave bosses, which the guide does not fight.
    },
  };
}

function apprentice(): Record<T1Biome, BiomePlan> {
  const plan = durableMelee();
  plan.swamp = {
    after: [{ piece: 'swamp-vest-t1' }, { piece: 'swamp-charm-t1' }],
  };
  plan.mountain = {
    after: [{ piece: 'mountain-vest-t1' }],
  };
  return plan;
}

const MELEE_KIT = ['chaotic-axe', 'swamp-charm-t1', 'plains-boots-t1'];

/** The bot's dodge-profile boss matrix (t1RouteBuilder DODGE_BOSS_ABILITIES + armorByBoss). */
const DEFAULT_BOSSES: Record<T1Biome, BossPlan> = {
  plains: { armor: 'plains-vest-t1', technique: 'sweep', guard: 'second-wind' },
  forest: { armor: 'plains-vest-t1', technique: 'expose-weakness', guard: 'second-wind' },
  mountain: { armor: 'mountain-vest-t1', technique: 'expose-weakness', guard: 'second-wind' },
  swamp: { armor: 'mountain-vest-t1', technique: 'expose-weakness', guard: 'cleanse' },
  cave: { armor: 'mountain-vest-t1', technique: 'expose-weakness', guard: 'second-wind' },
};

/** Slinger never makes the Mountain vest (see its Cave plan), so it keeps its evasion armor. */
function withArmor(bosses: Record<T1Biome, BossPlan>, armor: string): Record<T1Biome, BossPlan> {
  return Object.fromEntries(
    Object.entries(bosses).map(([biome, plan]) => [biome, { ...plan, armor }]),
  ) as Record<T1Biome, BossPlan>;
}

export const TUTORIAL_CLASS_PLANS: readonly TutorialClassPlan[] = [
  {
    classRoot: 'cadence-root',
    className: 'Striker',
    movement: 'melee',
    biomes: durableMelee(),
    bossKit: MELEE_KIT,
    bosses: DEFAULT_BOSSES,
    // The finisher is every 5th swing, so swings per second is the Striker's own
    // currency, and a landed-twice opener puts two of them on every new body.
    weaponCards: SPEED_OPENER,
  },
  {
    classRoot: 'cooldown-root',
    className: 'Squire',
    movement: 'melee',
    biomes: durableMelee(),
    bossKit: MELEE_KIT,
    bosses: DEFAULT_BOSSES,
    // The slowest hands and the biggest hits: flat Attack under a ×2 timed
    // execution, and on a slow chassis the six-count is a steady, readable beat.
    weaponCards: COUNTED_LUNGE,
  },
  {
    classRoot: 'reload-root',
    className: 'Slinger',
    movement: 'ranged',
    biomes: slinger(),
    bossKit: ['ashbrand-blade', 'swamp-charm-t1', 'plains-boots-t1'],
    bosses: withArmor(DEFAULT_BOSSES, 'forest-vest-t1'),
    // Attack keeps only 65% at the clip's cadence while on-hit keeps all of it,
    // and the echo is a proc that carries on-hit (design §24.2: on-hit belongs to
    // Tempo) — so Keen Edge's flat Attack is the Slinger's weakest lean. A kiting
    // ranged build opens on many targets (design §24.2: Far feeds Engagement).
    weaponCards: SPEED_OPENER,
  },
  {
    classRoot: 'energy-root',
    className: 'Spirit',
    movement: 'ranged',
    biomes: durableMelee(),
    bossKit: MELEE_KIT,
    bosses: DEFAULT_BOSSES,
    // The fastest, highest-output chassis: its six-count fills fastest of the
    // six classes, so the lunge lands often and the ring is never idle.
    weaponCards: COUNTED_LUNGE,
  },
  {
    classRoot: 'dot-root',
    className: 'Apprentice',
    movement: 'ranged',
    biomes: apprentice(),
    bossKit: MELEE_KIT,
    bosses: { ...DEFAULT_BOSSES, swamp: { ...DEFAULT_BOSSES.swamp, armor: 'swamp-vest-t1' } },
    // DoT potency is the Apprentice's whole package (design §24.2: with the
    // Affliction lean it "poisons harder with everything, which is intended"),
    // and Affliction × Engagement is the pair that suggested the structure:
    // "Your first hit on each new target leaves a heavy poison or bleed".
    weaponCards: { lean: RAPIER.envenomed, verb: RAPIER.openingLunge },
  },
  {
    classRoot: 'summoner-root',
    className: 'Conduit',
    movement: 'ranged',
    biomes: durableMelee(),
    bossKit: MELEE_KIT,
    bosses: DEFAULT_BOSSES,
    // The weapon sets the formation's cadence, so attack speed reaches every
    // summon, and four bodies spreading over a pull open on many targets.
    weaponCards: SPEED_OPENER,
  },
];
