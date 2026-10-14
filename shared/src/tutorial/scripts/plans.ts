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

export interface TutorialClassPlan {
  classRoot: string;
  className: string;
  movement: TutorialMovement;
  biomes: Record<T1Biome, BiomePlan>;
  /** Weapon, charm and boots worn for every boss fight (the seals and the gate). */
  bossKit: string[];
  bosses: Record<T1Biome, BossPlan>;
}

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
        { equip: ['mountain-vest-t1', 'swamp-charm-t1', 'plains-boots-t1'] },
        // Worn the moment it is made: it is the boss kit's weapon.
        { piece: 'chaotic-axe' },
      ],
    },
  };
}

function slinger(): Record<T1Biome, BiomePlan> {
  return {
    plains: PLAINS,
    forest: {
      before: [{ piece: 'flash-rapier' }],
      // The recipe opens at Forest 2; the evasion armor's reason waits one level
      // (the first-hour checklist, course-correction W3-B).
      after: [{ piece: 'forest-vest-t1', atLevel: 3 }],
    },
    swamp: {
      // The Poison Dagger is the Slinger's boss weapon, so it is made and worn
      // first thing in the Swamp.
      before: [{ piece: 'ashbrand-blade' }],
      after: [{ piece: 'swamp-charm-t1' }],
    },
    mountain: {},
    cave: {
      before: [{ equip: ['ashbrand-blade', 'forest-vest-t1', 'swamp-charm-t1', 'plains-boots-t1'] }],
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
  // Slam took Expose Weakness's place in the four single-boss kits (the ability
  // pass, design §22.2: Expose Weakness is cut, and Slam rank I is authored so the
  // T1 boss lab holds every class within ±5% of the old kit). Plains keeps Sweep.
  forest: { armor: 'plains-vest-t1', technique: 'slam', guard: 'second-wind' },
  mountain: { armor: 'mountain-vest-t1', technique: 'slam', guard: 'second-wind' },
  swamp: { armor: 'mountain-vest-t1', technique: 'slam', guard: 'cleanse' },
  cave: { armor: 'mountain-vest-t1', technique: 'slam', guard: 'second-wind' },
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
  },
  {
    classRoot: 'cooldown-root',
    className: 'Squire',
    movement: 'melee',
    biomes: durableMelee(),
    bossKit: MELEE_KIT,
    bosses: DEFAULT_BOSSES,
  },
  {
    classRoot: 'reload-root',
    className: 'Slinger',
    movement: 'ranged',
    biomes: slinger(),
    bossKit: ['ashbrand-blade', 'swamp-charm-t1', 'plains-boots-t1'],
    bosses: withArmor(DEFAULT_BOSSES, 'forest-vest-t1'),
  },
  {
    classRoot: 'energy-root',
    className: 'Spirit',
    movement: 'ranged',
    biomes: durableMelee(),
    bossKit: MELEE_KIT,
    bosses: DEFAULT_BOSSES,
  },
  {
    classRoot: 'dot-root',
    className: 'Apprentice',
    movement: 'ranged',
    biomes: apprentice(),
    bossKit: MELEE_KIT,
    bosses: { ...DEFAULT_BOSSES, swamp: { ...DEFAULT_BOSSES.swamp, armor: 'swamp-vest-t1' } },
  },
  {
    classRoot: 'summoner-root',
    className: 'Conduit',
    movement: 'ranged',
    biomes: durableMelee(),
    bossKit: MELEE_KIT,
    bosses: DEFAULT_BOSSES,
  },
];
