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
 * - The weapon page (`weaponCards`): the lean, the weapon's own verb and the lean's
 *   ranks (design §26.1), on the weapon the class FIGHTS with (design §24.9): so
 *   that weapon is worn from where it is crafted — the Chaotic Axe from the Cave's
 *   first level, the Slinger's Poison Dagger from the Swamp's — rather than
 *   swapped in late as the bot does.
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
 * The T1 band (design §26.1: "T1 deepens; T2 branches") on the page of the weapon
 * the class fights with (design §24.9): a LEAN of the Attack / Speed / Effect trio
 * (row 1, its home zone's level 2), the weapon's ONE verb (row 2, the zone's level 4
 * and the row's Global Mastery — not a choice, the weapon's own move), then the
 * lean's further ranks. The lineage is the boss kit's weapon's, so the band is live
 * in every seal and gate fight (`tutorial.test.ts` holds the plan to that), and the
 * gate the last chapter pays is the same weapon's.
 */
export interface TutorialWeaponCards {
  lineageId: string;
  /** One of the weapon's ranked T1 leans (`<weapon>-t1-attack|speed|effect`). */
  lean: string;
  /** The weapon's one T1 verb. */
  verb: string;
  /**
   * The rank the guide takes the lean to (1..3): rank II one level after the verb,
   * rank III at the home leg's end, each where its Global Mastery gate is held.
   */
  leanRank: number;
}

export interface TutorialClassPlan {
  classRoot: string;
  className: string;
  movement: TutorialMovement;
  biomes: Record<T1Biome, BiomePlan>;
  /** Weapon, charm and boots worn for every boss fight (the seals and the gate). */
  bossKit: string[];
  bosses: Record<T1Biome, BossPlan>;
  /** What the guide buys on the boss kit weapon's page (reasons per class below). */
  weaponCards: TutorialWeaponCards;
}

/**
 * The Axe's and the Dagger's T1 band (`data/lineages/axe.ts`, `dagger.ts`, design
 * §26.1): the lean trio, Attack / Speed / Effect, and the weapon's one verb. Named
 * here only to keep the class table readable.
 */
const AXE = {
  lineageId: 'axe',
  attack: 'axe-t1-attack',
  speed: 'axe-t1-speed',
  effect: 'axe-t1-effect',
  choppingRhythm: 'axe-t1-tempo-payoff',
} as const;

const DAGGER = {
  lineageId: 'dagger',
  attack: 'dagger-t1-attack',
  speed: 'dagger-t1-speed',
  effect: 'dagger-t1-effect',
  intoTheWound: 'dagger-t1-affliction-payoff',
} as const;

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
        // Worn the moment it is made: its page is the tree the guide teaches,
        // and a lineage pays only while its own form is worn (design §23).
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
      // The Poison Dagger is the Slinger's boss weapon and its page the tree the
      // guide teaches, so it is made and worn first thing in the Swamp, where its
      // shards drop (design §24.9).
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

/*
 * The picks (`weaponCards`), PROVISIONAL and the designer's to change. Design §26.1
 * leaves the guide no pair to pick: the verb is the weapon's own, and the lesson
 * names the EFFECT lean, the weapon's own move made stronger (the legibility run's
 * brief), taken to rank III because the home leg holds rank III's Global Mastery 14
 * long before the gate. Attack and Speed are plain stats and are not taught.
 *
 * What the choice costs, per class (boss lab, legibility run after wave 1 at
 * `8deb861d`, reports/legibility/after-composition.md: boss DPS over the same class on
 * the same weapon with no cards, median over the five T1 bosses, 10 seeds; I / III =
 * rank). On the Chaotic Axe Effect is the weakest lean for every class — it scales
 * Chopping Rhythm's second strike, which is a sixth of the hits — so a designer who
 * wants the strongest guide would switch the five Axe plans to the lean named per
 * class. On the Poison Dagger the three are within ~2 pp at rank I and Effect leads
 * at rank III.
 */
/** The rank the guide takes its lean to: III, inside the home leg (GM 14 is held there). */
const LEAN_RANK = 3;
const AXE_BAND: TutorialWeaponCards = {
  lineageId: AXE.lineageId, lean: AXE.effect, verb: AXE.choppingRhythm, leanRank: LEAN_RANK,
};
const DAGGER_BAND: TutorialWeaponCards = {
  lineageId: DAGGER.lineageId, lean: DAGGER.effect, verb: DAGGER.intoTheWound, leanRank: LEAN_RANK,
};

export const TUTORIAL_CLASS_PLANS: readonly TutorialClassPlan[] = [
  {
    classRoot: 'cadence-root',
    className: 'Striker',
    movement: 'melee',
    biomes: durableMelee(),
    bossKit: MELEE_KIT,
    bosses: DEFAULT_BOSSES,
    // Effect +11.6% / +12.9% (I / III); best: Speed +24.5% at I (flat to III),
    // Attack +28.1% at III. The verb alone: +10.2%.
    weaponCards: AXE_BAND,
  },
  {
    classRoot: 'cooldown-root',
    className: 'Squire',
    movement: 'melee',
    biomes: durableMelee(),
    bossKit: MELEE_KIT,
    bosses: DEFAULT_BOSSES,
    // Effect +10.7% / +12.1%; best: Speed +18.4% at I (Attack +18.3%), Speed +29.2%
    // at III. The verb alone: +9.7%.
    weaponCards: AXE_BAND,
  },
  {
    classRoot: 'reload-root',
    className: 'Slinger',
    movement: 'ranged',
    biomes: slinger(),
    bossKit: ['ashbrand-blade', 'swamp-charm-t1', 'plains-boots-t1'],
    bosses: withArmor(DEFAULT_BOSSES, 'forest-vest-t1'),
    // Effect +50.5% / +58.4% ("Your poison is +10% stronger", and Into the Wound
    // re-doses that poison: design §26.2); best: Attack +52.3% at I, Effect itself at
    // III. The verb alone: +46.3%.
    weaponCards: DAGGER_BAND,
  },
  {
    classRoot: 'energy-root',
    className: 'Spirit',
    movement: 'ranged',
    biomes: durableMelee(),
    bossKit: MELEE_KIT,
    bosses: DEFAULT_BOSSES,
    // Effect +13.9% / +15.6%; best: Speed +24.8% at I (flat to III), Attack +28.0% at
    // III. The verb alone: +12.5%.
    weaponCards: AXE_BAND,
  },
  {
    classRoot: 'dot-root',
    className: 'Apprentice',
    movement: 'ranged',
    biomes: apprentice(),
    bossKit: MELEE_KIT,
    bosses: { ...DEFAULT_BOSSES, swamp: { ...DEFAULT_BOSSES.swamp, armor: 'swamp-vest-t1' } },
    // Effect +5.1% / +5.8%; best: Attack +16.4% at I, +18.9% at III. The verb alone:
    // +4.6%.
    weaponCards: AXE_BAND,
  },
  {
    classRoot: 'summoner-root',
    className: 'Conduit',
    movement: 'ranged',
    biomes: durableMelee(),
    bossKit: MELEE_KIT,
    bosses: DEFAULT_BOSSES,
    // Effect +17.5% / +19.9%; best: Attack +24.0% at I, +36.9% at III. The verb alone:
    // +17.0% (four summons fill the six-count fast).
    weaponCards: AXE_BAND,
  },
];
