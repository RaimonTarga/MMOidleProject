/**
 * What the guide crafts and wears for each class (designer's decision 2026-10-16: "the guide
 * crafts each tier's class gear the way the bot routes do"). One plan per class, keyed by class
 * root; `gear.ts` turns it into beats and `tutorial.test.ts` checks every id.
 *
 * Copied from the class's default-chain bot routes (`bot/src/routes/<class>T1.ts` .. `T4.ts`) as
 * they stood on 2026-10-16. The routes are the balance reference; if a route's gear changes,
 * change it here too (the conductor reconciles). Copied as data, not imported: `shared/` never
 * imports `bot/`.
 *
 * - `start` is the class's own Clearing weapon, made right after the class pick (the opening's
 *   Primordial Club comes before it, while no class is chosen).
 * - `tiers[t][zone]` is what the guide wears from that zone in its tier-`t` turn, in unlock order
 *   (a zone's first level of the tier opens its weapon, then armor, charm and boots one level
 *   apart). The guide crafts each piece as soon as the zone opens it.
 * - A piece from another zone is a detour (the Slinger's T3 and T4 Jungle vest and Carbine, made
 *   in front of the tier's first boss); a piece already made earlier in the plan is worn again
 *   (the Striker's Plains charm in the T2 Jungle).
 * - T2 to T4: the guide cannot know the player's discipline, so the weapons are the default
 *   chain's (`defaultPick`, the routes' default), with a line that says so. The armor, charms
 *   and boots are the ones that chain's route wears. PLACEHOLDER (OV2-GUIDE).
 */
export interface TutorialGearPlan {
  /** The default chain's tier-2 pick, the skill node whose name the T2-T4 weapon lines say. */
  defaultPick: string;
  /** What the class calls that pick on its tier-2 line. */
  pickWord: 'discipline' | 'school';
  /** The class's own Clearing start weapon (the route's Clearing weapon). */
  start: string;
  tiers: Readonly<Record<1 | 2 | 3 | 4, Readonly<Record<string, readonly string[]>>>>;
}

/** Striker: Balanced, Iaido, Read the Blow (OV-STRIKER's verified chain). */
const STRIKER: TutorialGearPlan = {
  defaultPick: 'striker-balanced',
  pickWord: 'discipline',
  start: 'striker-plain-sword-t1',
  tiers: {
    1: {
      plains: ['striker-broadblade-t1', 'plains-vest-t1', 'plains-charm-t1', 'plains-boots-t1'],
      forest: ['striker-twin-fangs-t1', 'forest-vest-t1', 'forest-boots-t1'],
      cave: ['striker-bastard-sword-t1'],
    },
    2: {
      plains: ['striker-broadblade-t2', 'plains-vest-t2', 'plains-charm-t2', 'plains-boots-t2'],
      // The Plains vest and Grit stay on in the Forest (2026-10-17: the Apex Timberclaw comes before
      // the Cave teaches Concuss; their plating and Grit hold its many small hits).
      forest: ['striker-twin-fangs-t2', 'forest-boots-t2'],
      mountain: ['mountain-vest-t2', 'mountain-charm-t2', 'mountain-boots-t2'],
      swamp: ['swamp-vest-t2', 'swamp-charm-t2', 'swamp-boots-t2'],
      cave: ['striker-bastard-sword-t2', 'cave-vest-t2', 'cave-charm-t2', 'cave-boots-t2'],
      // The route puts the Plains' Grit back on in the Jungle instead of its own charm, and keeps it
      // on in the Desert (2026-10-17: Grit over Shake Off at the Dune-Stalker Emperor).
      jungle: ['jungle-vest-t2', 'plains-charm-t2', 'jungle-boots-t2'],
      desert: ['desert-vest-t2', 'desert-boots-t2'],
    },
    3: {
      mountain: ['striker-maul-t3', 'mountain-vest-t3', 'mountain-charm-t3', 'mountain-boots-t3'],
      swamp: ['swamp-vest-t3', 'swamp-charm-t3', 'swamp-boots-t3'],
      cave: ['striker-bastard-sword-t3', 'cave-vest-t3', 'cave-charm-t3', 'cave-boots-t3'],
      jungle: ['jungle-vest-t3', 'jungle-charm-t3', 'jungle-boots-t3'],
      desert: ['desert-vest-t3', 'desert-charm-t3', 'desert-boots-t3'],
      tundra: ['tundra-vest-t3', 'tundra-charm-t3', 'tundra-boots-t3'],
      volcanic: ['volcanic-vest-t3', 'volcanic-charm-t3', 'volcanic-boots-t3'],
    },
    4: {
      mountain: ['striker-maul-t4', 'mountain-vest-t4', 'mountain-charm-t4', 'mountain-boots-t4'],
      tundra: ['tundra-vest-t4', 'tundra-charm-t4', 'tundra-boots-t4'],
      jungle: ['jungle-vest-t4', 'jungle-charm-t4', 'jungle-boots-t4'],
      desert: ['desert-vest-t4', 'desert-charm-t4', 'desert-boots-t4'],
      volcanic: ['volcanic-vest-t4', 'volcanic-charm-t4', 'volcanic-boots-t4'],
      graveyard: ['striker-reapers-scythe-t4', 'graveyard-vest-t4', 'graveyard-charm-t4', 'graveyard-boots-t4'],
      trench: ['striker-bastard-sword-t4', 'trench-vest-t4', 'trench-charm-t4'],
    },
  },
};

/** Squire: Bulwark, Reverb, Second Line (OV-SQUIRE's chain). */
const SQUIRE: TutorialGearPlan = {
  defaultPick: 'squire-bulwark',
  pickWord: 'discipline',
  start: 'squire-plain-sword-and-shield-t1',
  tiers: {
    1: {
      plains: ['squire-flanged-mace-t1', 'plains-vest-t1', 'plains-charm-t1', 'plains-boots-t1'],
      forest: ['forest-vest-t1', 'forest-charm-t1', 'forest-boots-t1'],
      swamp: ['squire-spiked-flail-t1', 'swamp-vest-t1', 'swamp-charm-t1'],
      cave: ['squire-tower-shield-t1', 'cave-vest-t1', 'cave-charm-t1'],
      mountain: ['squire-warhammer-t1', 'mountain-vest-t1'],
    },
    2: {
      plains: ['squire-flanged-mace-t2', 'plains-vest-t2', 'plains-charm-t2', 'plains-boots-t2'],
      forest: ['forest-vest-t2', 'forest-charm-t2', 'forest-boots-t2'],
      mountain: ['squire-warhammer-t2', 'mountain-vest-t2', 'mountain-charm-t2'],
      swamp: ['swamp-vest-t2', 'swamp-charm-t2'],
      cave: ['squire-tower-shield-t2', 'cave-vest-t2', 'cave-charm-t2'],
      jungle: ['jungle-vest-t2', 'jungle-charm-t2', 'jungle-boots-t2'],
      desert: ['desert-vest-t2', 'desert-charm-t2', 'desert-boots-t2'],
    },
    3: {
      mountain: ['squire-warhammer-t3', 'mountain-vest-t3', 'mountain-charm-t3', 'mountain-boots-t3'],
      cave: ['cave-vest-t3', 'cave-charm-t3', 'cave-boots-t3'],
      swamp: ['swamp-vest-t3', 'swamp-charm-t3'],
      jungle: ['jungle-vest-t3', 'jungle-charm-t3', 'jungle-boots-t3'],
      desert: ['desert-vest-t3', 'desert-charm-t3', 'desert-boots-t3'],
      tundra: ['tundra-vest-t3', 'tundra-charm-t3'],
      volcanic: ['volcanic-vest-t3', 'volcanic-charm-t3'],
    },
    4: {
      mountain: ['squire-warhammer-t4', 'mountain-vest-t4', 'mountain-charm-t4', 'mountain-boots-t4'],
      tundra: ['tundra-vest-t4', 'tundra-charm-t4'],
      jungle: ['jungle-vest-t4', 'jungle-charm-t4', 'jungle-boots-t4'],
      desert: ['desert-vest-t4', 'desert-charm-t4', 'desert-boots-t4'],
      volcanic: ['volcanic-vest-t4', 'volcanic-charm-t4'],
      graveyard: ['graveyard-vest-t4', 'graveyard-charm-t4'],
      trench: ['trench-vest-t4', 'trench-charm-t4'],
    },
  },
};

/** Apprentice: Fire, Afterburn, Tinderbox (OV-APPRENTICE's chain). */
const APPRENTICE: TutorialGearPlan = {
  defaultPick: 'apprentice-fire',
  pickWord: 'school',
  start: 'apprentice-plain-wand-t1',
  tiers: {
    1: {
      plains: ['apprentice-branching-wand-t1', 'plains-vest-t1', 'plains-charm-t1', 'plains-boots-t1'],
      forest: ['apprentice-thornwood-rod-t1', 'forest-vest-t1', 'forest-charm-t1', 'forest-boots-t1'],
      cave: ['apprentice-deep-grimoire-t1'],
      mountain: ['apprentice-runestone-staff-t1', 'mountain-vest-t1'],
    },
    2: {
      plains: ['apprentice-branching-wand-t2', 'plains-vest-t2', 'plains-charm-t2', 'plains-boots-t2'],
      forest: ['apprentice-thornwood-rod-t2', 'forest-vest-t2', 'forest-charm-t2', 'forest-boots-t2'],
      mountain: ['apprentice-runestone-staff-t2'],
      jungle: ['jungle-vest-t2'],
      desert: ['desert-boots-t2'],
    },
    3: {
      mountain: ['apprentice-runestone-staff-t3', 'mountain-vest-t3', 'mountain-charm-t3', 'mountain-boots-t3'],
      desert: ['desert-charm-t3', 'desert-boots-t3'],
    },
    4: {
      mountain: ['apprentice-runestone-staff-t4', 'mountain-vest-t4', 'mountain-charm-t4', 'mountain-boots-t4'],
      desert: ['desert-charm-t4', 'desert-boots-t4'],
      volcanic: ['volcanic-vest-t4'],
    },
  },
};

/** Slinger: Gunslinger, Fan the Hammer, Light Hands (OV-SLINGER's chain). */
const SLINGER: TutorialGearPlan = {
  defaultPick: 'slinger-gunslinger',
  pickWord: 'discipline',
  start: 'slinger-plain-pistol-t1',
  tiers: {
    1: {
      plains: ['slinger-pepperbox-t1', 'plains-vest-t1', 'plains-charm-t1', 'plains-boots-t1'],
      forest: ['slinger-carbine-t1', 'forest-vest-t1', 'forest-charm-t1', 'forest-boots-t1'],
      swamp: ['swamp-vest-t1', 'swamp-charm-t1', 'swamp-boots-t1'],
      cave: ['slinger-drum-gun-t1', 'cave-vest-t1', 'cave-charm-t1', 'cave-boots-t1'],
      mountain: ['mountain-vest-t1'],
    },
    2: {
      // The Forest vest (Quickdraw) stays on for the rest of the tier.
      plains: ['slinger-pepperbox-t2', 'plains-vest-t2', 'plains-charm-t2', 'plains-boots-t2'],
      forest: ['slinger-carbine-t2', 'forest-vest-t2', 'forest-charm-t2', 'forest-boots-t2'],
      mountain: ['mountain-charm-t2', 'mountain-boots-t2'],
      swamp: ['swamp-charm-t2', 'swamp-boots-t2'],
      cave: ['cave-charm-t2', 'cave-boots-t2'],
      jungle: ['jungle-charm-t2', 'jungle-boots-t2'],
      desert: ['desert-charm-t2', 'desert-boots-t2'],
    },
    3: {
      // The tier's one vest and the Carbine are Jungle pieces, made on a detour before the Mountain boss.
      mountain: ['jungle-vest-t3-b', 'slinger-carbine-t3', 'mountain-charm-t3', 'mountain-boots-t3'],
      cave: ['cave-charm-t3', 'cave-boots-t3'],
      swamp: ['swamp-charm-t3', 'swamp-boots-t3'],
      jungle: ['jungle-charm-t3-b', 'jungle-boots-t3'],
      desert: ['desert-charm-t3', 'desert-boots-t3'],
      tundra: ['tundra-charm-t3', 'tundra-boots-t3'],
      volcanic: ['volcanic-charm-t3', 'volcanic-boots-t3'],
    },
    4: {
      mountain: ['jungle-vest-t4-b', 'slinger-carbine-t4', 'mountain-charm-t4', 'mountain-boots-t4'],
      tundra: ['tundra-charm-t4', 'tundra-boots-t4'],
      jungle: ['jungle-charm-t4-b', 'jungle-boots-t4'],
      desert: ['desert-charm-t4', 'desert-boots-t4'],
      volcanic: ['volcanic-charm-t4', 'volcanic-boots-t4'],
      graveyard: ['graveyard-charm-t4', 'graveyard-boots-t4'],
      trench: ['trench-charm-t4', 'trench-boots-t4-stalkers'],
    },
  },
};

/** Spirit: Tide, Spring Tide, Wading (OV-SPIRIT's chain). */
const SPIRIT: TutorialGearPlan = {
  defaultPick: 'spirit-tide',
  pickWord: 'discipline',
  start: 'spirit-plain-rod-t1',
  tiers: {
    1: {
      plains: ['spirit-forked-rod-t1', 'plains-vest-t1', 'plains-charm-t1', 'plains-boots-t1'],
      forest: ['forest-vest-t1', 'forest-charm-t1', 'forest-boots-t1'],
      cave: ['spirit-lodestone-orb-t1'],
      mountain: ['spirit-summit-staff-t1'],
    },
    2: {
      plains: ['spirit-forked-rod-t2', 'plains-vest-t2', 'plains-charm-t2', 'plains-boots-t2'],
      forest: ['forest-vest-t2', 'forest-charm-t2', 'forest-boots-t2'],
      mountain: ['spirit-summit-staff-t2'],
      jungle: ['jungle-vest-t2', 'jungle-boots-t2'],
      desert: ['desert-boots-t2'],
    },
    3: {
      mountain: ['spirit-summit-staff-t3', 'mountain-vest-t3', 'mountain-charm-t3', 'mountain-boots-t3'],
      cave: ['cave-vest-t3', 'cave-charm-t3', 'cave-boots-t3'],
      jungle: ['jungle-charm-t3', 'jungle-boots-t3'],
      desert: ['desert-boots-t3'],
      volcanic: ['volcanic-vest-t3', 'volcanic-charm-t3'],
    },
    4: {
      mountain: ['spirit-summit-staff-t4', 'mountain-vest-t4', 'mountain-charm-t4', 'mountain-boots-t4'],
      tundra: ['tundra-charm-t4'],
      desert: ['desert-boots-t4'],
      volcanic: ['volcanic-vest-t4', 'volcanic-charm-t4'],
    },
  },
};

/** Conduit: Pack, The Hunt, Avenge (OV-CONDUIT's chain). */
const CONDUIT: TutorialGearPlan = {
  defaultPick: 'conduit-pack',
  pickWord: 'discipline',
  start: 'conduit-plain-staff-t1',
  tiers: {
    1: {
      plains: ['conduit-swarm-staff-t1', 'plains-vest-t1', 'plains-charm-t1', 'plains-boots-t1'],
      forest: ['conduit-swift-staff-t1', 'forest-vest-t1', 'forest-charm-t1', 'forest-boots-t1'],
      swamp: ['swamp-vest-t1'],
      cave: ['conduit-heavy-staff-t1'],
      mountain: ['mountain-vest-t1'],
    },
    2: {
      plains: ['conduit-swarm-staff-t2', 'plains-vest-t2', 'plains-charm-t2', 'plains-boots-t2'],
      forest: ['conduit-swift-staff-t2', 'forest-vest-t2', 'forest-charm-t2', 'forest-boots-t2'],
      swamp: ['swamp-vest-t2'],
      cave: ['conduit-heavy-staff-t2'],
      mountain: ['mountain-vest-t2'],
      jungle: ['jungle-vest-t2', 'jungle-boots-t2'],
      desert: ['desert-boots-t2'],
    },
    3: {
      mountain: ['conduit-ability-staff-t3', 'mountain-vest-t3', 'mountain-charm-t3', 'mountain-boots-t3'],
      cave: ['conduit-heavy-staff-t3', 'cave-charm-t3'],
      swamp: ['swamp-boots-t3'],
      jungle: ['jungle-charm-t3', 'jungle-boots-t3'],
      desert: ['desert-boots-t3'],
    },
    4: {
      mountain: ['conduit-ability-staff-t4', 'mountain-vest-t4', 'mountain-charm-t4', 'mountain-boots-t4'],
      tundra: ['tundra-charm-t4'],
      jungle: ['conduit-swift-staff-t4'],
      desert: ['desert-boots-t4'],
      volcanic: ['volcanic-vest-t4'],
      trench: ['conduit-heavy-staff-t4', 'trench-vest-t4'],
    },
  },
};

/** Gear plans by class root (`cadence-root`, ...). */
export const TUTORIAL_GEAR_PLANS: Readonly<Record<string, TutorialGearPlan>> = {
  'cadence-root': STRIKER,
  'cooldown-root': SQUIRE,
  'dot-root': APPRENTICE,
  'reload-root': SLINGER,
  'energy-root': SPIRIT,
  'summoner-root': CONDUIT,
};
