import type { TutorialMovement } from './runes';

/**
 * Per-class Tier-1 plans for the guide, ported from the bot's controlled T1
 * routes (bot/src/routes/t1GearPlans.ts + the per-class configs). Only the
 * data is here; `classScript.ts` turns it into beats.
 *
 * Differences from the bot routes, all deliberate:
 * - Only two bosses, `TUTORIAL_SEALS` (two seals promote to Tier 2).
 * - No opportunistic upgrades: each upgrade names the level the leg's Global
 *   Mastery already allows, so a resumed guide never chases a moving target.
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
  /** Fight until it can be made, then craft and wear it. */
  | { piece: string }
  /** Fight until it can be made, then craft it (worn later). */
  | { craft: string }
  | { equip: string[] }
  /** Upgrade each item to the given level. `say` replaces the routine opening line. */
  | { upgrade: Array<[definitionId: string, toPlus: number]>; say?: string };

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
  /** Weapon, charm and boots worn for both boss fights. */
  bossKit: string[];
  bosses: Record<T1Biome, BossPlan>;
}

const PLAINS: BiomePlan = {
  before: [{ piece: 'iron-broadsword' }, { piece: 'plains-vest-t1' }],
  after: [{ piece: 'plains-charm-t1' }, { piece: 'plains-boots-t1' }],
  afterMax: [{
    upgrade: [['iron-broadsword', 1], ['plains-vest-t1', 1], ['plains-charm-t1', 1], ['plains-boots-t1', 1]],
  }],
};

function durableMelee(): Record<T1Biome, BiomePlan> {
  return {
    plains: PLAINS,
    forest: {
      before: [{ piece: 'flash-rapier' }],
      afterMax: [{
        upgrade: [['flash-rapier', 2], ['plains-vest-t1', 2], ['plains-charm-t1', 2], ['plains-boots-t1', 2]],
      }],
    },
    swamp: {
      after: [{ piece: 'swamp-charm-t1' }],
      afterMax: [{
        upgrade: [['swamp-charm-t1', 3], ['flash-rapier', 3], ['plains-vest-t1', 3], ['plains-boots-t1', 3]],
      }],
    },
    mountain: {
      after: [{ piece: 'mountain-vest-t1' }],
      afterMax: [{
        upgrade: [
          ['mountain-vest-t1', 4], ['flash-rapier', 4], ['swamp-charm-t1', 4],
          ['plains-vest-t1', 4], ['plains-boots-t1', 4],
        ],
      }],
    },
    cave: {
      before: [
        { equip: ['flash-rapier', 'mountain-vest-t1', 'swamp-charm-t1', 'plains-boots-t1'] },
        { craft: 'chaotic-axe' },
      ],
      after: [
        { upgrade: [['chaotic-axe', 4]], say: 'The axe needs a few upgrades before it beats the rapier.' },
        { equip: ['chaotic-axe'] },
      ],
      afterMax: [{
        upgrade: [
          ['chaotic-axe', 5], ['plains-vest-t1', 5], ['mountain-vest-t1', 5],
          ['swamp-charm-t1', 5], ['plains-boots-t1', 5],
        ],
      }],
    },
  };
}

function slinger(): Record<T1Biome, BiomePlan> {
  return {
    plains: PLAINS,
    forest: {
      before: [{ piece: 'flash-rapier' }, { piece: 'forest-vest-t1' }],
      afterMax: [{
        upgrade: [['flash-rapier', 2], ['forest-vest-t1', 2], ['plains-charm-t1', 2], ['plains-boots-t1', 2]],
      }],
    },
    swamp: {
      after: [{ piece: 'swamp-charm-t1' }, { craft: 'ashbrand-blade' }],
      afterMax: [{
        upgrade: [
          ['swamp-charm-t1', 3], ['ashbrand-blade', 3], ['forest-vest-t1', 3],
          ['flash-rapier', 3], ['plains-boots-t1', 3],
        ],
      }],
    },
    mountain: {
      afterMax: [{
        upgrade: [
          ['ashbrand-blade', 4], ['flash-rapier', 4], ['forest-vest-t1', 4],
          ['swamp-charm-t1', 4], ['plains-boots-t1', 4],
        ],
      }],
    },
    cave: {
      before: [{ equip: ['flash-rapier', 'forest-vest-t1', 'swamp-charm-t1', 'plains-boots-t1'] }],
      after: [{ equip: ['ashbrand-blade'] }],
      // The bot also crafts a Mountain vest here, but only for the Mountain,
      // Swamp and Cave bosses, which the guide does not fight.
      afterMax: [{
        upgrade: [['ashbrand-blade', 5], ['forest-vest-t1', 5], ['swamp-charm-t1', 5], ['plains-boots-t1', 5]],
      }],
    },
  };
}

function apprentice(): Record<T1Biome, BiomePlan> {
  const plan = durableMelee();
  plan.swamp = {
    after: [{ piece: 'swamp-vest-t1' }, { piece: 'swamp-charm-t1' }],
    afterMax: [{
      upgrade: [
        ['swamp-vest-t1', 3], ['swamp-charm-t1', 3], ['flash-rapier', 3],
        ['plains-vest-t1', 3], ['plains-boots-t1', 3],
      ],
    }],
  };
  plan.mountain = {
    after: [{ piece: 'mountain-vest-t1' }],
    afterMax: [{
      upgrade: [
        ['mountain-vest-t1', 4], ['flash-rapier', 4], ['swamp-vest-t1', 4],
        ['swamp-charm-t1', 4], ['plains-boots-t1', 4],
      ],
    }],
  };
  plan.cave = {
    ...plan.cave,
    afterMax: [{
      upgrade: [
        ['chaotic-axe', 5], ['plains-vest-t1', 5], ['mountain-vest-t1', 5],
        ['swamp-vest-t1', 5], ['swamp-charm-t1', 5], ['plains-boots-t1', 5],
      ],
    }],
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
