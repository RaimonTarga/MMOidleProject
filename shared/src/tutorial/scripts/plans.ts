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
 * - Two weapon-page purchases, a lean and a verb (`weaponCards`), on the weapon
 *   the class FIGHTS with (design §24.9): so that weapon is worn from where it is
 *   crafted — the Chaotic Axe from the Cave's first level, the Slinger's Poison
 *   Dagger from the Swamp's — rather than swapped in late as the bot does.
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
 * The two purchases of the T1 band (design §24.2) on the page of the weapon the
 * class fights with (design §24.9): a LEAN (row 1, its home zone's level 2) and a
 * VERB (row 2, the zone's level 4 and the row's Global Mastery). The lineage is
 * the boss kit's weapon's, so the pair is live in every seal and gate fight
 * (`tutorial.test.ts` holds the plan to that), and the gate the last chapter pays
 * is the same weapon's.
 *
 * Each class's pair is the one with the best boss-lab uplift for that class on
 * that weapon whose verb FIRES for it (verb firings > 0) — the composition matrix,
 * `reports/verbs-that-fire/` — so a pick may be a same-lane (pure) pair, which reads
 * its lane's own sentence.
 */
export interface TutorialWeaponCards {
  lineageId: string;
  lean: string;
  verb: string;
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
 * The Axe's and the Dagger's three leans and three verbs (`data/lineages/axe.ts`,
 * `dagger.ts`), by lane. Named here only to keep the class table readable.
 */
// Legibility run (design §26.1), ID SUBSTITUTION ONLY: the T1 band is the lean trio
// (Attack / Speed / Effect) and the weapon's one verb, so each retired lean maps to
// the trio card that carries its stat (Loose Grip → Speed, Hewing Arc → Attack,
// Coated Edge → Effect) and each retired verb to the weapon's own (Cleaving Blow →
// Chopping Rhythm). The picks and their notes below are wave 2's (E) to redo.
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

/*
 * The picks (`weaponCards`), PROVISIONAL and the designer's to change: per class,
 * the boss-lab composition matrix's best pair on the class's own boss weapon among
 * the pairs whose verb fired for that class (verbs-that-fire rerun at 57916b52, five
 * T1 bosses × 10 seeds; `server/scripts/_vfTutorialPicks.ts`, table in
 * reports/verbs-that-fire/tutorial-picks.md). Uplift is boss DPS over the same class
 * on the same Axe/Dagger with no cards, median over the bosses; per pick below.
 */
export const TUTORIAL_CLASS_PLANS: readonly TutorialClassPlan[] = [
  {
    classRoot: 'cadence-root',
    className: 'Striker',
    movement: 'melee',
    biomes: durableMelee(),
    bossKit: MELEE_KIT,
    bosses: DEFAULT_BOSSES,
    // +31.2%, 10.2 fires/min: the finisher every 5th swing is its mechanic, and
    // "the hit lands twice" doubles it; attack speed brings it round sooner.
    weaponCards: { lineageId: AXE.lineageId, lean: AXE.speed, verb: AXE.choppingRhythm },
  },
  {
    classRoot: 'cooldown-root',
    className: 'Squire',
    movement: 'melee',
    biomes: durableMelee(),
    bossKit: MELEE_KIT,
    bosses: DEFAULT_BOSSES,
    // +25.4%, 6.6 fires/min (pure Empowered: "Your mechanic hits half again as hard"):
    // the slowest hands and the biggest timed execution.
    weaponCards: { lineageId: AXE.lineageId, lean: AXE.attack, verb: AXE.choppingRhythm },
  },
  {
    classRoot: 'reload-root',
    className: 'Slinger',
    movement: 'ranged',
    biomes: slinger(),
    bossKit: ['ashbrand-blade', 'swamp-charm-t1', 'plains-boots-t1'],
    bosses: withArmor(DEFAULT_BOSSES, 'forest-vest-t1'),
    // +42.8%, 11.6 fires/min (pure Affliction: "Hitting an afflicted target doubles
    // its affliction"): the Dagger's poison and the lean's bleed are always on the
    // target, so the moment fires at its cap. Every other Dagger pair is within ±3%.
    weaponCards: { lineageId: DAGGER.lineageId, lean: DAGGER.effect, verb: DAGGER.intoTheWound },
  },
  {
    classRoot: 'energy-root',
    className: 'Spirit',
    movement: 'ranged',
    biomes: durableMelee(),
    bossKit: MELEE_KIT,
    bosses: DEFAULT_BOSSES,
    // +24.8%, 7.3 fires/min (pure Tempo: "Every 6th hit strikes twice"). Tied on the
    // median with Loose Grip → Cleaving Blow (both +24.8%, the same Greatbear reading);
    // broken by the mean over the five bosses, +23.7% against +22.7%.
    weaponCards: { lineageId: AXE.lineageId, lean: AXE.speed, verb: AXE.choppingRhythm },
  },
  {
    classRoot: 'dot-root',
    className: 'Apprentice',
    movement: 'ranged',
    biomes: apprentice(),
    bossKit: MELEE_KIT,
    bosses: { ...DEFAULT_BOSSES, swamp: { ...DEFAULT_BOSSES.swamp, armor: 'swamp-vest-t1' } },
    // +14.0%, 6.0 fires/min ("Every 6th hit counts as your class mechanic firing"):
    // Cleaving Blow on Hewing Arc never fired for it in the lab, so the six-count
    // carries its mechanic instead.
    weaponCards: { lineageId: AXE.lineageId, lean: AXE.attack, verb: AXE.choppingRhythm },
  },
  {
    classRoot: 'summoner-root',
    className: 'Conduit',
    movement: 'ranged',
    biomes: durableMelee(),
    bossKit: MELEE_KIT,
    bosses: DEFAULT_BOSSES,
    // +17.0%, 26.9 fires/min (pure Tempo): four summons' hits fill the six-count fast;
    // its Empowered verb fell to +7.4% under the 4 s cap.
    weaponCards: { lineageId: AXE.lineageId, lean: AXE.speed, verb: AXE.choppingRhythm },
  },
];
